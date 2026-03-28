import 'dotenv/config';

const env = {
  redisUrl: process.env.REDIS_URL,
  documentIngestionQueueName: process.env.DOCUMENT_INGESTION_QUEUE_NAME || 'document-ingestion',
};

export default env;
