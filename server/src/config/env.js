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
  chatModel: process.env.CHAT_MODEL || 'gemini-3.1-flash-lite-preview',
  chatAgentName: process.env.CHAT_AGENT_NAME || 'chatAssistant',
  chatAppName: process.env.CHAT_APP_NAME || 'notebooklm-chat',
  chatHistoryTurnLimit: parseInt(process.env.CHAT_HISTORY_TURN_LIMIT || '5', 10),
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  qdrantCollectionName: process.env.QDRANT_COLLECTION_NAME || 'document_chunks',
  qdrantVectorSize: parseInt(process.env.QDRANT_VECTOR_SIZE || '3072', 10),
};

env.chatHistoryMessageLimit = env.chatHistoryTurnLimit * 2;

export default env;
