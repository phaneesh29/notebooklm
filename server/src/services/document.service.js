import httpStatus from 'http-status';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents } from '../db/schema.js';
import { addInQueue } from '../lib/queue.js';
import ApiError from '../utils/ApiError.js';

export const enqueueDocument = async (document) => {
  try {
    const job = await addInQueue({
      documentId: document.id,
      groupId: document.groupId,
      userId: document.userId,
      type: document.type,
      sourceUrl: document.sourceUrl,
      storageKey: document.storageKey,
    });

    return job;
  } catch (error) {
    await db.update(documents).set({
      status: 'failed',
      errorMessage: error.message || 'Failed to enqueue document processing job',
    }).where(eq(documents.id, document.id));

    throw new ApiError(httpStatus.BAD_GATEWAY, 'Document was created but queueing failed');
  }
};
