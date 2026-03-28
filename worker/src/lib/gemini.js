import { GoogleGenAI } from '@google/genai';
import env from '../config/env.js';
import { getUserGeminiApiKey } from '../services/user.service.js';

const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

const clients = new Map();

const getGeminiClientForApiKey = (apiKey) => {
  if (!clients.has(apiKey)) {
    clients.set(
      apiKey,
      new GoogleGenAI({
        apiKey,
      })
    );
  }

  return clients.get(apiKey);
};

export const embedTextsForUser = async (
  { userId, texts },
  {
    taskType = 'RETRIEVAL_DOCUMENT',
    outputDimensionality = env.qdrantVectorSize,
  } = {}
) => {
  if (!userId) {
    throw new Error('userId is required');
  }

  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('texts must be a non-empty array');
  }

  const safeTexts = texts.map((text) => String(text || '').trim()).filter(Boolean);

  if (!safeTexts.length) {
    throw new Error('texts must contain at least one non-empty string');
  }

  const apiKey = await getUserGeminiApiKey(userId);
  const gemini = getGeminiClientForApiKey(apiKey);
  const response = await gemini.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: safeTexts,
    config: {
      taskType,
      outputDimensionality,
    },
  });

  return (response.embeddings || []).map((embedding) => embedding.values || []);
};

export { GEMINI_EMBEDDING_MODEL };
