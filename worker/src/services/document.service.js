import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents } from '../db/schema.js';

export const getDocumentById = async (documentId) => {
  if (!documentId) {
    throw new Error('documentId is required');
  }

  const [document] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);

  if (!document) {
    throw new Error('Document not found');
  }

  return document;
};

export const updateDocumentStatus = async (
  documentId,
  {
    status,
    errorMessage = null,
    metadata,
    processedAt,
  }
) => {
  if (!documentId) {
    throw new Error('documentId is required');
  }

  await db.update(documents).set({
      ...(status ? { status } : {}),
      errorMessage,
      ...(metadata !== undefined ? { metadata } : {}),
      ...(processedAt !== undefined ? { processedAt } : {}),
    }).where(eq(documents.id, documentId));
};
