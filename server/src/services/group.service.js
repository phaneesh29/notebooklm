import httpStatus from 'http-status';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { groups } from '../db/schema.js';
import ApiError from '../utils/ApiError.js';

export const assertGroupAccess = async ({ groupId, userId }) => {
  const [group] = await db.select({ id: groups.id }).from(groups).where(and(eq(groups.id, groupId), eq(groups.userId, userId))).limit(1);

  if (group) {
    return group;
  }

  const [existingGroup] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId)).limit(1);

  if (!existingGroup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to add documents to this group');
};
