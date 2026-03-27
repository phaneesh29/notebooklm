import 'dotenv/config';

const env = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  documentIngestionQueueName: process.env.DOCUMENT_INGESTION_QUEUE_NAME || 'document-ingestion',
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-secret-do-not-use-in-prod',
};

export default env;
