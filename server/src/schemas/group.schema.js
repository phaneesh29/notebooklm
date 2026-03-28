import { z } from 'zod';

export const createGroupSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(255, 'title must be 255 characters or fewer'),
});

export const deleteGroupParamsSchema = z.object({
  groupId: z.uuid('groupId must be a valid UUID'),
});

export const listGroupDocumentsParamsSchema = z.object({
  groupId: z.uuid('groupId must be a valid UUID'),
});

const youtubeHostnames = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

export const createLinkDocumentSchema = z.object({
  groupId: z.uuid('groupId must be a valid UUID'),
  title: z.string().trim().min(1, 'title is required').max(255, 'title must be 255 characters or fewer'),
  type: z.enum(['web', 'youtube'], 'type must be either web or youtube'),
  sourceUrl: z.url('sourceUrl must be a valid URL'),
}).superRefine((input, ctx) => {
  try {
    const hostname = new URL(input.sourceUrl).hostname.toLowerCase();
    const isYoutubeUrl = youtubeHostnames.has(hostname);

    if (input.type === 'youtube' && !isYoutubeUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['sourceUrl'],
        message: 'sourceUrl must be a valid YouTube URL when type is youtube',
      });
    }

    if (input.type === 'web' && isYoutubeUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['sourceUrl'],
        message: 'Use type youtube for YouTube links',
      });
    }
  } catch {
    ctx.addIssue({
      code: 'custom',
      path: ['sourceUrl'],
      message: 'sourceUrl must be a valid URL',
    });
  }
});

export const createFileDocumentSchema = z.object({
  groupId: z.uuid('groupId must be a valid UUID'),
  title: z.string().trim().max(255, 'title must be 255 characters or fewer').optional().or(z.literal('')),
});
