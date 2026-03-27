import { z } from 'zod';

export const updateApiKeySchema = z.object({
  apiKey: z.string().trim().min(1, 'apiKey is required in the JSON body'),
});

