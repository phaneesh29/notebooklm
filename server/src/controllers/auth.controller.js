import httpStatus from 'http-status';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { encrypt } from '../utils/encryption.js';

export const getMe = async (req, res) => {
  const { userId } = req.auth;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  const [user] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found in database');
  }

  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, user, 'User profile retrieved'));
};

export const updateApiKey = async (req, res) => {
  const { userId } = req.auth;
  const { apiKey } = req.body;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }
  if (!apiKey) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'apiKey is required in the JSON body');
  }

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
