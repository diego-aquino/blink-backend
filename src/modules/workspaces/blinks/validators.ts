import { z } from 'zod';
import { workspaceByIdSchema } from '../validators';

export const blinkCreationSchema = workspaceByIdSchema.extend({
  name: z.string().min(1),
  url: z.string().url(),
  redirectId: z.string().optional(),
});

export type BlinkCreationInput = z.infer<typeof blinkCreationSchema>;

export const blinksListSchema = workspaceByIdSchema.extend({
  name: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

export type BlinkListInput = z.infer<typeof blinksListSchema>;

export const blinkByIdSchema = workspaceByIdSchema.extend({
  blinkId: z.string().min(1),
});

export type BlinkByIdInput = z.infer<typeof blinkByIdSchema>;

export const blinkUpdateSchema = blinkByIdSchema.extend({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  redirectId: z.string().optional(),
});

export type BlinkUpdateInput = z.infer<typeof blinkUpdateSchema>;
