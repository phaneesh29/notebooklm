import { z } from 'zod';

export const createGroupSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(255, 'title must be 255 characters or fewer'),
});
