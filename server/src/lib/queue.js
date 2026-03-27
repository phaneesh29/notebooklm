import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import httpStatus from 'http-status';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

let connection;
let documentIngestionQueue;

const getRedisConnection = () => {
  if (!env.redisUrl) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'REDIS_URL is not configured');
  }

  if (!connection) {
    connection = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return connection;
};

export const getDocumentIngestionQueue = () => {
  if (!documentIngestionQueue) {
    documentIngestionQueue = new Queue(env.documentIngestionQueueName, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });
  }

  return documentIngestionQueue;
};

export const addInQueue = async (payload) => {
  const queue = getDocumentIngestionQueue();

  return queue.add('document.ingest', payload, {
    jobId: payload.documentId,
  });
};
