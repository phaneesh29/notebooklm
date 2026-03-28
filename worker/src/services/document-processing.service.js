import { embedTextsForUser, GEMINI_EMBEDDING_MODEL } from '../lib/gemini.js';
import { getDocumentBuffer } from '../lib/object-storage.js';
import { deleteDocumentChunks, upsertDocumentChunks } from '../lib/qdrant.js';
import { getDocumentById, updateDocumentStatus } from './document.service.js';
import { chunkTextWithMeta } from '../utils/chunking.js';
import { parseDocumentByType } from '../utils/parsers.js';

const buildChunkPayloads = ({ chunks, embeddings, document, parsedTitle }) =>
  chunks.map((chunk, index) => ({
    documentId: document.id,
    groupId: document.groupId,
    userId: document.userId,
    chunkIndex: chunk.chunkIndex,
    title: parsedTitle || document.title,
    type: document.type,
    sourceUrl: document.sourceUrl,
    text: chunk.text,
    characterCount: chunk.characterCount,
    embedding: embeddings[index],
    metadata: {
      embeddingModel: GEMINI_EMBEDDING_MODEL,
      originalFileName: document.originalFileName,
      mimeType: document.mimeType,
    },
  }));

export const processDocumentJob = async ({ documentId, userId }) => {
  if (!documentId || !userId) {
    throw new Error('documentId and userId are required');
  }

  const document = await getDocumentById(documentId);

  if (document.userId !== userId) {
    throw new Error('Queue user does not match document owner');
  }

  await updateDocumentStatus(documentId, {
    status: 'processing',
    errorMessage: null,
    metadata: {
      ...(document.metadata || {}),
      processingStartedAt: new Date().toISOString(),
    },
  });

  try {
    const parsed =
      document.type === 'web' || document.type === 'youtube'
        ? await parseDocumentByType({
            type: document.type,
            url: document.sourceUrl,
          })
        : await parseDocumentByType({
            type: document.type,
            buffer: await getDocumentBuffer(document.storageKey),
          });

    const chunks = await chunkTextWithMeta(parsed.text, document.id);

    if (!chunks.length) {
      throw new Error('No chunks generated from parsed document');
    }

    const embeddings = await embedTextsForUser({
      userId,
      texts: chunks.map((chunk) => chunk.text),
    });

    await deleteDocumentChunks({ documentId: document.id, userId });

    await upsertDocumentChunks(
      buildChunkPayloads({
        chunks,
        embeddings,
        document,
        parsedTitle: parsed.title,
      })
    );

    await updateDocumentStatus(documentId, {
      status: 'ready',
      errorMessage: null,
      processedAt: new Date(),
      metadata: {
        ...(document.metadata || {}),
        chunkCount: chunks.length,
        embeddingModel: GEMINI_EMBEDDING_MODEL,
      },
    });
  } catch (error) {
    await updateDocumentStatus(documentId, {
      status: 'failed',
      errorMessage: error.message || 'Document processing failed',
      metadata: {
        ...(document.metadata || {}),
      },
    });

    throw error;
  }
};
