import { z } from 'zod';

export const streamGroupChatParamsSchema = z.object({
  groupId: z.uuid(),
});

export const streamGroupChatBodySchema = z.object({
  messages: z.array(z.any()).min(1),
});
