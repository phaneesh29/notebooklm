import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const documentTypeEnum = pgEnum('document_type', ['pdf', 'docx', 'txt', 'web', 'youtube']);
export const documentStatusEnum = pgEnum('document_status', ['queued', 'processing', 'ready', 'failed']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  apiKeyEncrypted: text('api_key_encrypted'),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').notNull(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  type: documentTypeEnum('type').notNull(),
  sourceUrl: text('source_url'),
  storageKey: text('storage_key'),
  originalFileName: text('original_file_name'),
  mimeType: text('mime_type'),
  status: documentStatusEnum('status').notNull(),
  metadata: jsonb('metadata'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});
