import { and, desc, eq } from 'drizzle-orm';
import env from '../config/env.js';
import { db } from '../db/index.js';
import { messages } from '../db/schema.js';

export const listRecentChatMessages = async ({ groupId, userId, limit = env.chatHistoryMessageLimit }) => {
  const recentMessages = await db.select()
    .from(messages)
    .where(and(eq(messages.groupId, groupId), eq(messages.userId, userId)))
    .orderBy(desc(messages.createdAt), desc(messages.role))
    .limit(limit);

  return recentMessages.reverse();
};

export const persistChatTurn = async ({ groupId, userId, query, response, citations = [] }) => {
  const safeResponse = String(response || '').trim();
  const safeCitations = Array.isArray(citations)
    ? [...new Set(citations.map((citation) => String(citation || '').trim()).filter(Boolean))].slice(0, 10)
    : [];
  const now = new Date();

  return db.insert(messages).values([
    {
      groupId,
      userId,
      role: 'user',
      content: query,
      createdAt: now,
    },
    {
      groupId,
      userId,
      role: 'assistant',
      content: safeResponse,
      citations: safeCitations,
      createdAt: new Date(now.getTime() + 1),
    },
  ]).returning();
};

export const HISTORY_TURN_LIMIT = env.chatHistoryTurnLimit;
export const HISTORY_MESSAGE_LIMIT = env.chatHistoryMessageLimit;
