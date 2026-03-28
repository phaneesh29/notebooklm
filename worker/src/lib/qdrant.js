import { randomUUID } from 'node:crypto';
import { QdrantClient } from '@qdrant/js-client-rest';
import env from '../config/env.js';

let client;

const getQdrantClient = () => {
  if (!client) {
    client = new QdrantClient({
      url: env.qdrantUrl,
    });
  }

  return client;
};

export const ensureQdrantCollection = async ({
  collectionName = env.qdrantCollectionName,
  vectorSize = env.qdrantVectorSize,
} = {}) => {
  const qdrant = getQdrantClient();
  const collections = await qdrant.getCollections();
  const exists = (collections.collections || []).some(
    (collection) => collection.name === collectionName
  );

  if (exists) {
    return;
  }

  await qdrant.createCollection(collectionName, {
    vectors: {
      size: vectorSize,
      distance: 'Cosine',
    },
  });
};

export const upsertDocumentChunks = async (
  chunks,
  {
    collectionName = env.qdrantCollectionName,
    vectorSize = env.qdrantVectorSize,
  } = {}
) => {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('chunks must be a non-empty array');
  }

  await ensureQdrantCollection({ collectionName, vectorSize });

  const qdrant = getQdrantClient();
  const points = chunks.map((chunk) => {
    if (!Array.isArray(chunk.embedding) || chunk.embedding.length !== vectorSize) {
      throw new Error(`embedding length must match Qdrant vector size ${vectorSize}`);
    }

    return {
      id: chunk.id || randomUUID(),
      vector: chunk.embedding,
      payload: {
        documentId: chunk.documentId,
        groupId: chunk.groupId,
        userId: chunk.userId,
        chunkIndex: chunk.chunkIndex,
        title: chunk.title,
        type: chunk.type,
        sourceUrl: chunk.sourceUrl,
        text: chunk.text,
        characterCount: chunk.characterCount,
        metadata: chunk.metadata || {},
      },
    };
  });

  return qdrant.upsert(collectionName, {
    wait: true,
    points,
  });
};

export const deleteDocumentChunks = async (
  { documentId, userId },
  { collectionName = env.qdrantCollectionName } = {}
) => {
  if (!documentId || !userId) {
    throw new Error('documentId and userId are required');
  }

  const qdrant = getQdrantClient();

  return qdrant.delete(collectionName, {
    wait: true,
    filter: {
      must: [
        {
          key: 'documentId',
          match: {
            value: documentId,
          },
        },
        {
          key: 'userId',
          match: {
            value: userId,
          },
        },
      ],
    },
  });
};
