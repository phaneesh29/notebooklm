import { embedMany } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import env from '../config/env.js';

const GEMINI_EMBEDDING_MODEL = env.geminiEmbeddingModel;

export const embedTextsForApiKey = async (
  { apiKey, texts },
  {
    outputDimensionality = env.qdrantVectorSize,
  } = {}
) => {
  if (!apiKey) {
    throw new Error('apiKey is required');
  }

  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('texts must be a non-empty array');
  }

  const safeTexts = texts.map((text) => String(text || '').trim()).filter(Boolean);

  if (!safeTexts.length) {
    throw new Error('texts must contain at least one non-empty string');
  }

  const google = createGoogleGenerativeAI({ apiKey });
  
  const { embeddings } = await embedMany({
    model: google.embedding(GEMINI_EMBEDDING_MODEL),
    values: safeTexts,
  });

  return embeddings;
};

export { GEMINI_EMBEDDING_MODEL };
