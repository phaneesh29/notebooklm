import { Client as MinioClient } from 'minio';
import env from '../config/env.js';

let client;

const getMinioClient = () => {
  if (!env.minioAccessKey || !env.minioSecretKey) {
    throw new Error('MinIO credentials are not configured');
  }

  if (!client) {
    client = new MinioClient({
      endPoint: env.minioEndPoint,
      port: env.minioPort,
      useSSL: env.minioUseSSL,
      accessKey: env.minioAccessKey,
      secretKey: env.minioSecretKey,
    });
  }

  return client;
};

export const getDocumentBuffer = async (storageKey) => {
  if (!storageKey) {
    throw new Error('storageKey is required');
  }

  const minio = getMinioClient();
  const stream = await minio.getObject(env.minioBucketName, storageKey);

  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on('error', reject);
  });
};
