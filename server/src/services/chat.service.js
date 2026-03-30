import crypto from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { createEvent, isFinalResponse, stringifyContent } from '@google/adk';
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

export const appendChatHistoryToSession = async ({ runner, session, history, agentName }) => {
  for (const message of history) {
    await runner.sessionService.appendEvent({
      session,
      event: createEvent({
        invocationId: `history-${message.id}`,
        author: message.role === 'user' ? 'user' : agentName,
        content: {
          role: message.role === 'user' ? 'user' : 'model',
          parts: [{ text: message.content }],
        },
        timestamp: message.createdAt ? new Date(message.createdAt).getTime() : Date.now(),
      }),
    });
  }
};

export const createChatSession = async ({ runner, userId }) => runner.sessionService.createSession({
  appName: runner.appName,
  userId,
  sessionId: crypto.randomUUID(),
});

export const deleteChatSession = async ({ runner, userId, sessionId }) => {
  await runner.sessionService.deleteSession({
    appName: runner.appName,
    userId,
    sessionId,
  });
};

export const persistChatTurn = async ({ groupId, userId, query, response }) => {
  const safeResponse = String(response || '').trim();
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
      createdAt: new Date(now.getTime() + 1),
    },
  ]).returning();
};

export const extractTextDelta = ({ event, accumulatedText }) => {
  const nextText = stringifyContent(event);

  if (!nextText) {
    return { delta: '', nextAccumulatedText: accumulatedText };
  }

  if (event.partial) {
    return {
      delta: nextText,
      nextAccumulatedText: accumulatedText + nextText,
    };
  }

  if (nextText.startsWith(accumulatedText)) {
    return {
      delta: nextText.slice(accumulatedText.length),
      nextAccumulatedText: nextText,
    };
  }

  return {
    delta: '',
    nextAccumulatedText: nextText,
  };
};

export const isAssistantTextEvent = ({ event, agentName }) => {
  const text = stringifyContent(event);

  return event.author === agentName && event.content?.role === 'model' && Boolean(text);
};

export const HISTORY_TURN_LIMIT = env.chatHistoryTurnLimit;
export const HISTORY_MESSAGE_LIMIT = env.chatHistoryMessageLimit;
export { isFinalResponse };
