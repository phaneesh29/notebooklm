import path from 'node:path';
import httpStatus from 'http-status';
import { and, desc, eq } from 'drizzle-orm';
import { getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { documents, groups, messages } from '../db/schema.js';
import {
  createFileDocumentSchema,
  createGroupSchema,
  createLinkDocumentSchema,
  deleteGroupParamsSchema,
  listGroupDocumentsParamsSchema,
} from '../schemas/group.schema.js';
import { uploadDocumentBuffer } from '../lib/object-storage.js';
import { enqueueDocument } from '../services/document.service.js';
import { assertGroupAccess } from '../services/group.service.js';
import { getAuthenticatedUser } from '../services/user.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { getSupportedFileType } from '../utils/document.js';
import { validateWithSchema } from '../utils/validateSchema.js';

const toClientDocument = (document) => ({
  id: document.id,
  groupId: document.groupId,
  userId: document.userId,
  title: document.title,
  type: document.type,
  sourceUrl: document.sourceUrl,
  originalFileName: document.originalFileName,
  mimeType: document.mimeType,
  fileSizeBytes: document.fileSizeBytes,
  status: document.status,
  metadata: document.metadata,
  errorMessage: document.errorMessage,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
  processedAt: document.processedAt,
});

export const listGroups = async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  const user = await getAuthenticatedUser(clerkUserId);
  const userGroups = await db.select().from(groups).where(eq(groups.userId, user.id)).orderBy(desc(groups.createdAt));

  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, userGroups, 'Groups retrieved successfully'));
};

export const listGroupDocuments = async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  const { groupId } = validateWithSchema(listGroupDocumentsParamsSchema, req.params);
  const user = await getAuthenticatedUser(clerkUserId);
  await assertGroupAccess({ groupId, userId: user.id });

  const groupDocuments = await db.select().from(documents).where(and(eq(documents.groupId, groupId), eq(documents.userId, user.id))).orderBy(desc(documents.createdAt));

  res.status(httpStatus.OK).json(
    new ApiResponse(
      httpStatus.OK,
      groupDocuments.map(toClientDocument),
      'Documents retrieved successfully'
    )
  );
};

export const createGroup = async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  const { title } = validateWithSchema(createGroupSchema, req.body);
  const user = await getAuthenticatedUser(clerkUserId);

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
  const user = await getAuthenticatedUser(clerkUserId);
  await assertGroupAccess({ groupId, userId: user.id });

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

  const job = await enqueueDocument(document);

  res.status(httpStatus.CREATED).json(
    new ApiResponse(
      httpStatus.CREATED,
      {
        ...toClientDocument(document),
        queueJobId: job.id,
      },
      'Document queued successfully'
    )
  );
};

export const createFileDocument = async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'file is required');
  }

  const { groupId, title } = validateWithSchema(createFileDocumentSchema, req.body);
  const user = await getAuthenticatedUser(clerkUserId);
  await assertGroupAccess({ groupId, userId: user.id });

  const extension = path.extname(req.file.originalname).toLowerCase();
  const supportedFile = getSupportedFileType(extension);

  if (!supportedFile) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only pdf, docx, and txt files are supported');
  }

  if (!supportedFile.mimeTypes.includes(req.file.mimetype)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid mime type for ${extension} file`);
  }

  const uploadedObject = await uploadDocumentBuffer({
    fileBuffer: req.file.buffer,
    mimeType: req.file.mimetype,
    originalFileName: req.file.originalname,
    groupId,
    userId: user.id,
  });

  const [document] = await db.insert(documents).values({
    groupId,
    userId: user.id,
    title: title?.trim() || req.file.originalname,
    type: supportedFile.type,
    sourceUrl: uploadedObject.sourceUrl,
    storageKey: uploadedObject.storageKey,
    originalFileName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSizeBytes: req.file.size,
    status: 'queued',
    metadata: {
      ingestionMethod: 'file-upload',
    },
  }).returning();

  const job = await enqueueDocument(document);

  res.status(httpStatus.CREATED).json(
    new ApiResponse(
      httpStatus.CREATED,
      {
        ...toClientDocument(document),
        queueJobId: job.id,
      },
      'File uploaded and queued successfully'
    )
  );
};

export const deleteGroup = async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
  }

  const { groupId } = validateWithSchema(deleteGroupParamsSchema, req.params);
  const user = await getAuthenticatedUser(clerkUserId);

  await assertGroupAccess({ groupId, userId: user.id });

  await db.transaction(async (tx) => {
    await tx.delete(messages).where(and(eq(messages.groupId, groupId), eq(messages.userId, user.id)));
    await tx.delete(documents).where(and(eq(documents.groupId, groupId), eq(documents.userId, user.id)));
    await tx.delete(groups).where(and(eq(groups.id, groupId), eq(groups.userId, user.id)));
  });

  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, {}, 'Group deleted successfully'));
};
