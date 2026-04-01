import httpStatus from 'http-status';
import { getAuth } from '@clerk/express';
import { streamGroupChatBodySchema, streamGroupChatParamsSchema } from '../schemas/chat.schema.js';
import { assertGroupAccess } from '../services/group.service.js';
import { getAuthenticatedUser } from '../services/user.service.js';
import { listRecentChatMessages, persistChatTurn } from '../services/chat.service.js';
import ApiError from '../utils/ApiError.js';
import { validateWithSchema } from '../utils/validateSchema.js';
import { stepCountIs, streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import env from '../config/env.js';
import { getRetrievalTool } from '../lib/retrieval.tool.js';

const extractMessageText = (message) => {
  if (typeof message?.content === 'string') {
    return message.content.trim();
  }

  if (Array.isArray(message?.parts)) {
    return message.parts
      .filter((part) => part?.type === 'text' && typeof part?.text === 'string')
      .map((part) => part.text)
      .join('\n')
      .trim();
  }

  return '';
};

const normalizeToModelMessages = (messages) => {
  if (!Array.isArray(messages)) return [];

  return messages
    .map((message) => ({
      role: message?.role,
      content: extractMessageText(message),
    }))
    .filter((message) => (
      (message.role === 'user' || message.role === 'assistant' || message.role === 'system')
      && message.content.length > 0
    ));
};

const normalizeCitationLabel = (value) => {
  const label = String(value || '').replace(/\s+/g, ' ').trim();
  if (!label) return '';
  return label.length > 120 ? `${label.slice(0, 117)}...` : label;
};

const collectCitationTitles = (value, collector) => {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectCitationTitles(item, collector));
    return;
  }

  if (typeof value === 'object') {
    if (typeof value.title === 'string') {
      const label = normalizeCitationLabel(value.title);
      if (label) collector.add(label);
    }

    if (Array.isArray(value.snippets)) {
      value.snippets.forEach((snippet) => {
        if (typeof snippet?.title === 'string') {
          const label = normalizeCitationLabel(snippet.title);
          if (label) collector.add(label);
        }
      });
    }

    Object.values(value).forEach((nestedValue) => collectCitationTitles(nestedValue, collector));
  }
};

const collectInlineCitationsFromText = (text, collector) => {
  if (typeof text !== 'string' || text.length === 0) return;

  const citationRegex = /\[(?:Document:\s*)?([^\]]+)\]/g;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const label = normalizeCitationLabel(match[1]);
    if (label) collector.add(label);
  }
};

export const getGroupChats = async (req, res, next) => {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
    }

    const { groupId } = req.params;
    const user = await getAuthenticatedUser(clerkUserId);
    await assertGroupAccess({ groupId, userId: user.id });
    const citationCollector = new Set();

    const history = await listRecentChatMessages({ groupId, userId: user.id, limit: 100 });

    res.status(httpStatus.OK).json({ messages: history });
  } catch (error) {
    next(error);
  }
};

export const streamGroupChat = async (req, res, next) => {
  try {
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'You must be logged in');
    }

    const { groupId } = validateWithSchema(streamGroupChatParamsSchema, req.params);
    const { messages } = validateWithSchema(streamGroupChatBodySchema, req.body);
    const uiMessages = Array.isArray(messages) ? messages : [];
    const modelMessages = normalizeToModelMessages(messages);
    const lastUserMessage = [...modelMessages].reverse().find((message) => message.role === 'user');

    if (uiMessages.length === 0 || modelMessages.length === 0 || !lastUserMessage?.content) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No valid chat messages provided');
    }

    const user = await getAuthenticatedUser(clerkUserId);
    await assertGroupAccess({ groupId, userId: user.id });

    const google = createGoogleGenerativeAI({ apiKey: req.geminiApiKey });

    const result = streamText({
      model: google(env.chatModel || 'gemini-1.5-pro'),
      system: `You are a grounded assistant for a user's private document workspace.

Use the document_retrieval tool when the user asks about their uploaded files, resume/profile details, or any private facts.
For greetings or general questions, answer directly without tools.

Important:
- After any tool call, always produce a final natural-language answer for the user.
- Never expose raw tool payloads, JSON, or internal traces in the final answer.
- If retrieval does not provide enough evidence, clearly say you cannot verify from uploaded documents and ask for clarification or additional files.
- Do not invent projects, skills, or personal facts that are not supported by retrieved context.`,
  messages: modelMessages,
      tools: {
        document_retrieval: getRetrievalTool({
          apiKey: req.geminiApiKey,
          userId: user.id,
          groupId,
          fallbackQuery: lastUserMessage.content,
        }),
      },
      stopWhen: stepCountIs(6),
      temperature: 0,
      onStepFinish: (step) => {
        if (!step || typeof step !== 'object') return;
        collectCitationTitles(step, citationCollector);
      },
      onFinish: async ({ text }) => {
        if (text) {
          collectInlineCitationsFromText(text, citationCollector);

          await persistChatTurn({
            groupId,
            userId: user.id,
            query: lastUserMessage.content,
            response: text,
            citations: [...citationCollector],
          });
        }
      }
    });

    result.pipeUIMessageStreamToResponse(res, { originalMessages: uiMessages });
  } catch (error) {
    next(error);
  }
};
