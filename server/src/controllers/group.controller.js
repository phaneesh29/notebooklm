import httpStatus from 'http-status';
import { and, desc, eq } from 'drizzle-orm';
import { getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { groups, users } from '../db/schema.js';
import { createGroupSchema, deleteGroupParamsSchema } from '../schemas/group.schema.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { validateWithSchema } from '../utils/validateSchema.js';

export const listGroups = async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkUserId)).limit(1);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found in database');
  }

  const userGroups = await db.select().from(groups).where(eq(groups.userId, user.id)).orderBy(desc(groups.createdAt));

  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, userGroups, 'Groups retrieved successfully'));
};

export const createGroup = async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);

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

export const deleteGroup = async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  const { groupId } = validateWithSchema(deleteGroupParamsSchema, req.params);

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkUserId)).limit(1);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found in database');
  }

  const [deletedGroup] = await db.delete(groups).where(and(eq(groups.id, groupId), eq(groups.userId, user.id))).returning({ id: groups.id });

  if (!deletedGroup) {
    const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId)).limit(1);

    if (!group) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
    }

    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to delete this group');
  }

  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, {}, 'Group deleted successfully'));
};
