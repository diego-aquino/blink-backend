import { z } from 'zod';
import { workspaceByIdSchema } from '../validators';

export const createBlinkSchema = workspaceByIdSchema.extend({
  name: z.string().min(1),
  url: z.string().url(),
  redirectId: z.string().optional(),
});

export type CreateBlinkInput = z.infer<typeof createBlinkSchema>;

export const listBlinksSchema = workspaceByIdSchema.extend({
  name: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

export type ListBlinksInput = z.infer<typeof listBlinksSchema>;

export const blinkByIdSchema = workspaceByIdSchema.extend({
  blinkId: z.string().min(1),
});

export type BlinkByIdInput = z.infer<typeof blinkByIdSchema>;

export const updateBlinkSchema = blinkByIdSchema.extend({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  redirectId: z.string().optional(),
});

export type UpdateBlinkInput = z.infer<typeof updateBlinkSchema>;
