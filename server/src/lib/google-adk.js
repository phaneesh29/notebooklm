import { Gemini, InMemorySessionService, LlmAgent, Runner } from '@google/adk';
import env from '../config/env.js';

export const createChatRunner = (apiKey) => {
  const agent = new LlmAgent({
    name: env.chatAgentName,
    model: new Gemini({
      apiKey,
      model: env.chatModel,
    }),
    instruction: 'You are a helpful AI assistant. Answer clearly and use the conversation context when it is relevant.',
  });

  return new Runner({
    appName: env.chatAppName,
    agent,
    sessionService: new InMemorySessionService(),
  });
};

export const CHAT_AGENT_NAME = env.chatAgentName;
