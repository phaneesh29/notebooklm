import httpStatus from 'http-status';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import ApiError from '../utils/ApiError.js';

export const getAuthenticatedUser = async (clerkUserId) => {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkUserId)).limit(1);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found in database');
  }

  return user;
};
