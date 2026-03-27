import httpStatus from 'http-status';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { groups, users } from '../db/schema.js';
import { createGroupSchema } from '../schemas/group.schema.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { validateWithSchema } from '../utils/validateSchema.js';

export const createGroup = async (req, res) => {
  const { userId: clerkUserId } = req.auth;

  if (!clerkUserId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  const { title } = validateWithSchema(createGroupSchema, req.body);

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkUserId)).limit(1);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found in database');
  }

  const [group] = await db.insert(groups).values({
      userId: user.id,
      title,
    }).returning();

  res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, group, 'Group created successfully'));
};
