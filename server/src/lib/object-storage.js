import crypto from 'node:crypto';
import path from 'node:path';
import { Client as MinioClient } from 'minio';
import httpStatus from 'http-status';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

let minioClient;
let bucketEnsured = false;

const getMinioClient = () => {
  if (!env.minioAccessKey || !env.minioSecretKey) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'MinIO credentials are not configured');
  }

  if (!minioClient) {
    minioClient = new MinioClient({
      endPoint: env.minioEndPoint,
      port: env.minioPort,
      useSSL: env.minioUseSSL,
      accessKey: env.minioAccessKey,
      secretKey: env.minioSecretKey,
    });
  }

  return minioClient;
};

const ensureBucket = async () => {
  if (bucketEnsured) {
    return;
  }

  const client = getMinioClient();
  const exists = await client.bucketExists(env.minioBucketName);

  if (!exists) {
    await client.makeBucket(env.minioBucketName);
  }

  bucketEnsured = true;
};

export const uploadDocumentBuffer = async ({ fileBuffer, mimeType, originalFileName, groupId, userId }) => {
  const client = getMinioClient();
  await ensureBucket();

  const safeExtension = path.extname(originalFileName).toLowerCase();
  const objectKey = `${userId}/${groupId}/${crypto.randomUUID()}${safeExtension}`;

  await client.putObject(env.minioBucketName, objectKey, fileBuffer, fileBuffer.length, {
    'Content-Type': mimeType,
  });

  return {
    storageKey: objectKey,
    sourceUrl: `${env.minioUseSSL ? 'https' : 'http'}://${env.minioEndPoint}:${env.minioPort}/${env.minioBucketName}/${objectKey}`,
  };
};
