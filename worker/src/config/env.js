import 'dotenv/config';

const env = {
  redisUrl: process.env.REDIS_URL,
  documentIngestionQueueName: process.env.DOCUMENT_INGESTION_QUEUE_NAME || 'document-ingestion',
  databaseUrl: process.env.DATABASE_URL,
  encryptionKey: process.env.ENCRYPTION_KEY,
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  qdrantCollectionName: process.env.QDRANT_COLLECTION_NAME || 'document_chunks',
  qdrantVectorSize: parseInt(process.env.QDRANT_VECTOR_SIZE || '3072', 10),
};

export default env;
