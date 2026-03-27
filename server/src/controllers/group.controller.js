import httpStatus from 'http-status';
import { and, desc, eq } from 'drizzle-orm';
import { getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { documents, groups, users } from '../db/schema.js';
import { createGroupSchema, createLinkDocumentSchema, deleteGroupParamsSchema } from '../schemas/group.schema.js';
import { addInQueue } from '../lib/queue.js';
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

export const createLinkDocument = async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  const { groupId, sourceUrl, title, type } = validateWithSchema(createLinkDocumentSchema, req.body);

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkUserId)).limit(1);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found in database');
  }

  const [group] = await db.select({ id: groups.id }).from(groups).where(and(eq(groups.id, groupId), eq(groups.userId, user.id))).limit(1);

  if (!group) {
    const [existingGroup] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId)).limit(1);

    if (!existingGroup) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
    }

    throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to add documents to this group');
  }

  const [document] = await db.insert(documents).values({
    groupId,
    userId: user.id,
    title,
    type,
    sourceUrl,
    status: 'queued',
    metadata: {
      ingestionMethod: 'link',
    },
  }).returning();

  try {
    const job = await addInQueue({
      documentId: document.id,
      groupId: document.groupId,
      userId: document.userId,
      type: document.type,
      sourceUrl: document.sourceUrl,
      storageKey: document.storageKey,
    });

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, {
      ...document,
      queueJobId: job.id,
    }, 'Document queued successfully'));
  } catch (error) {
    await db.update(documents).set({
      status: 'failed',
      errorMessage: error.message || 'Failed to enqueue document processing job',
    }).where(eq(documents.id, document.id));

    throw new ApiError(httpStatus.BAD_GATEWAY, 'Document was created but queueing failed');
  }
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
