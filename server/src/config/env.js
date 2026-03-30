import 'dotenv/config';

const env = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  documentIngestionQueueName: process.env.DOCUMENT_INGESTION_QUEUE_NAME || 'document-ingestion',
  minioEndPoint: process.env.MINIO_ENDPOINT || 'localhost',
  minioPort: parseInt(process.env.MINIO_PORT || '9000', 10),
  minioUseSSL: process.env.MINIO_USE_SSL === 'true',
  minioAccessKey: process.env.MINIO_ACCESS_KEY,
  minioSecretKey: process.env.MINIO_SECRET_KEY,
  minioBucketName: process.env.MINIO_BUCKET_NAME || 'notebooklm-documents',
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-secret-do-not-use-in-prod',
  chatModel: 'gemini-3.1-flash-lite-preview',
  chatAgentName: 'chatAssistant',
  chatAppName: 'notebooklm-chat',
  chatHistoryTurnLimit: 5,
};

env.chatHistoryMessageLimit = env.chatHistoryTurnLimit * 2;

export default env;
