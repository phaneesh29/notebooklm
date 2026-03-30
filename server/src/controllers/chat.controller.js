import httpStatus from 'http-status';
import { StreamingMode } from '@google/adk';
import { getAuth } from '@clerk/express';
import { createChatRunner, CHAT_AGENT_NAME } from '../lib/google-adk.js';
import { streamGroupChatBodySchema, streamGroupChatParamsSchema } from '../schemas/chat.schema.js';
import { assertGroupAccess } from '../services/group.service.js';
import { getAuthenticatedUser } from '../services/user.service.js';
import {
  appendChatHistoryToSession,
  createChatSession,
  deleteChatSession,
  extractTextDelta,
  isAssistantTextEvent,
  isFinalResponse,
  listRecentChatMessages,
  persistChatTurn,
} from '../services/chat.service.js';
import ApiError from '../utils/ApiError.js';
import { validateWithSchema } from '../utils/validateSchema.js';

const writeSse = (res, event, data) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  res.flush?.();
};

export const streamGroupChat = async (req, res, next) => {
  let session;
  let runner;
  let user;

  try {
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
    }

    const { groupId } = validateWithSchema(streamGroupChatParamsSchema, req.params);
    const { query } = validateWithSchema(streamGroupChatBodySchema, req.body);

    user = await getAuthenticatedUser(clerkUserId);
    await assertGroupAccess({ groupId, userId: user.id });

    const history = await listRecentChatMessages({ groupId, userId: user.id });

    runner = createChatRunner(req.geminiApiKey);
    session = await createChatSession({ runner, userId: user.id });

    await appendChatHistoryToSession({
      runner,
      session,
      history,
      agentName: CHAT_AGENT_NAME,
    });

    res.status(httpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    writeSse(res, 'start', {
      groupId,
      historyCount: history.length,
    });

    let clientDisconnected = false;
    let responseText = '';

    req.on('close', () => {
      clientDisconnected = true;
    });

    for await (const event of runner.runAsync({
      userId: user.id,
      sessionId: session.id,
      newMessage: {
        role: 'user',
        parts: [{ text: query }],
      },
      runConfig: {
        streamingMode: StreamingMode.SSE,
      },
    })) {
      if (clientDisconnected) {
        break;
      }

      if (!isAssistantTextEvent({ event, agentName: CHAT_AGENT_NAME })) {
        continue;
      }

      const { delta, nextAccumulatedText } = extractTextDelta({
        event,
        accumulatedText: responseText,
      });

      if (delta) {
        responseText = nextAccumulatedText;
        writeSse(res, 'delta', { text: delta });
      } else if (!event.partial && nextAccumulatedText !== responseText) {
        responseText = nextAccumulatedText;
        writeSse(res, 'message', { text: responseText });
      }

      if (isFinalResponse(event)) {
        break;
      }
    }

    if (!clientDisconnected) {
      await persistChatTurn({
        groupId,
        userId: user.id,
        query,
        response: responseText,
      });

      writeSse(res, 'done', {
        text: responseText,
      });
    }

    res.end();
  } catch (error) {
    if (res.headersSent) {
      writeSse(res, 'error', {
        message: error.message || 'Failed to stream chat response',
      });
      res.end();
      return;
    }

    next(error);
  } finally {
    if (runner && session && user) {
      await deleteChatSession({
        runner,
        userId: user.id,
        sessionId: session.id,
      }).catch(() => {});
    }
  }
};
