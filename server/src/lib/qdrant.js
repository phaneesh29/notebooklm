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

export const searchDocumentChunks = async (
  { embedding, userId, groupId, limit = 5 },
  {
    collectionName = env.qdrantCollectionName,
  } = {}
) => {
  if (!embedding || !userId || !groupId) {
    throw new Error('embedding, userId, and groupId are required');
  }

  const qdrant = getQdrantClient();

  const response = await qdrant.search(collectionName, {
    vector: embedding,
    limit,
    with_payload: true,
    filter: {
      must: [
        {
          key: 'userId',
          match: {
            value: userId,
          },
        },
        {
          key: 'groupId',
          match: {
            value: groupId,
          },
        },
      ],
    },
  });

  return response;
};
