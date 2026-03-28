import { text, uuid, pgTable } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  apiKeyEncrypted: text('api_key_encrypted'),
});
