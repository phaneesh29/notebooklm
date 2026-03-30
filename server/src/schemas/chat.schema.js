import { z } from 'zod';

export const streamGroupChatParamsSchema = z.object({
  groupId: z.uuid(),
});

export const streamGroupChatBodySchema = z.object({
  query: z.string().trim().min(1).max(4000),
});
