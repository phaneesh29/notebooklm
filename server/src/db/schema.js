import { pgTable, pgEnum, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export const documentTypeEnum = pgEnum('document_type', ['pdf', 'web', 'youtube', 'docs']);
export const documentStatusEnum = pgEnum('document_status', ['processing', 'ready', 'failed']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull().unique(),
  username: text('username').unique(),
  apiKeyEncrypted: text('api_key_encrypted'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

export const groups = pgTable('groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  type: documentTypeEnum('type').notNull(),
  sourceUrl: text('source_url'),
  status: documentStatusEnum('status').notNull().default('processing'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  citations: jsonb('citations'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
