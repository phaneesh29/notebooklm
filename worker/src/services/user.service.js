import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { decrypt } from '../utils/encryption.js';

export const getUserGeminiApiKey = async (userId) => {
  if (!userId) {
    throw new Error('userId is required');
  }

  const [user] = await db.select({
      apiKeyEncrypted: users.apiKeyEncrypted,
    }).from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.apiKeyEncrypted) {
    throw new Error('User Gemini API key is not configured');
  }

  return decrypt(user.apiKeyEncrypted);
};
