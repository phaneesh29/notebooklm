import env from './config/env.js';
import { createDocumentWorker } from './lib/queue.js';

const worker = createDocumentWorker(async (job) => {
  console.log('[worker] received job', {
    id: job.id,
    name: job.name,
    data: job.data,
  });
});

worker.on('ready', () => {
  console.log(`[worker] listening on queue "${env.documentIngestionQueueName}"`);
});

worker.on('completed', (job) => {
  console.log(`[worker] completed job ${job.id}`);
});

worker.on('failed', (job, error) => {
  console.error(`[worker] failed job ${job?.id}`, error);
});
