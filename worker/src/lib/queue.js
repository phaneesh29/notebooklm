import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import env from '../config/env.js';

let connection;

export const getRedisConnection = () => {
  if (!env.redisUrl) {
    throw new Error('REDIS_URL is not configured');
  }

  if (!connection) {
    connection = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return connection;
};

export const createDocumentWorker = (processor) =>
  new Worker(env.documentIngestionQueueName, processor, {
    connection: getRedisConnection(),
    concurrency: 2,
  });
