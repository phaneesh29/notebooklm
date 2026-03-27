import httpStatus from 'http-status';
import { eq, sql } from 'drizzle-orm';
import { getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { encrypt } from '../utils/encryption.js';
import { updateApiKeySchema } from '../schemas/auth.schema.js';
import { validateWithSchema } from '../utils/validateSchema.js';

export const getMe = async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  const [user] = await db.select({
    id: users.id,
    clerkId: users.clerkId,
    email: users.email,
    username: users.username,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    hasApiKey: sql`${users.apiKeyEncrypted} IS NOT NULL`.as('hasApiKey'),
  }).from(users).where(eq(users.clerkId, userId)).limit(1);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found in database');
  }

  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, user, 'User profile retrieved'));
};

export const updateApiKey = async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  const { apiKey } = validateWithSchema(updateApiKeySchema, req.body);

  const encryptedKey = encrypt(apiKey);

  const [updatedUser] = await db.update(users)
    .set({ apiKeyEncrypted: encryptedKey })
    .where(eq(users.clerkId, userId))
    .returning();

  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found in database');
  }

  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, {}, 'API Key encrypted and securely saved'));
};
