import { tool } from 'ai';
import { z } from 'zod';
import { embedTextsForApiKey } from './gemini.js';
import { searchDocumentChunks } from './qdrant.js';

const normalizeQuery = (value) => {
  if (typeof value !== 'string') return '';
  const query = value.trim();
  if (!query) return '';

  const lower = query.toLowerCase();
  if (lower === 'undefined' || lower === 'null' || lower === 'nan') return '';

  return query;
};

export const getRetrievalTool = ({ apiKey, userId, groupId, fallbackQuery = '' }) => {
  return tool({
    description: 'Retrieve concise snippets from user documents. Use only when the question depends on private uploaded files.',
    parameters: z.object({
      query: z.string().optional().describe('The search query to embed and look up in the vector database.'),
    }),
    execute: async ({ query }) => {
      try {
        const effectiveQuery = normalizeQuery(query) || normalizeQuery(fallbackQuery);

        if (!effectiveQuery) {
          return {
            query: '',
            snippets: [],
            error: 'Missing retrieval query',
          };
        }

        console.log(`[RetrievalTool] Embedding query: "${effectiveQuery}"`);
        const embeddings = await embedTextsForApiKey({ apiKey, texts: [effectiveQuery] });

        if (!embeddings.length) {
          return {
            query: effectiveQuery,
            snippets: [],
            error: 'No embeddings generated.',
          };
        }

        console.log(`[RetrievalTool] Searching Qdrant...`);
        const searchResults = await searchDocumentChunks({
          embedding: embeddings[0],
          userId,
          groupId,
          limit: 5,
        });

        if (!searchResults || searchResults.length === 0) {
          return {
            query: effectiveQuery,
            snippets: [],
            error: 'No relevant document snippets found.',
          };
        }

        const snippets = searchResults.map((result) => {
          const payload = result.payload || {};
          const rawText = String(payload.text || '').replace(/\s+/g, ' ').trim();

          return {
            title: payload.title || 'Unknown',
            excerpt: rawText.slice(0, 700),
          };
        });

        return {
          query: effectiveQuery,
          snippets,
        };
      } catch (err) {
        console.error('[RetrievalTool] Error during retrieval:', err);
        return {
          query: normalizeQuery(query) || normalizeQuery(fallbackQuery),
          snippets: [],
          error: `Error during retrieval: ${err.message}`,
        };
      }
    },
  });
};
