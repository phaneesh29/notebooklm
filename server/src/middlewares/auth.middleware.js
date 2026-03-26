import httpStatus from 'http-status';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import ApiError from '../utils/ApiError.js';
import { decrypt } from '../utils/encryption.js';

export const requireApiKey = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);

    if (!user || !user.apiKeyEncrypted) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You must add your Gemini API Key in your profile to use this feature');
    }

    const rawKey = decrypt(user.apiKeyEncrypted);
    req.geminiApiKey = rawKey;

    next();
  } catch (error) {
    next(error);
  }
};
