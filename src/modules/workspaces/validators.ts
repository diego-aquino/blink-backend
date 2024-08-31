import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const workspaceByIdSchema = z.object({
  workspaceId: z.string().min(1),
});

export type WorkspaceByIdInput = z.infer<typeof workspaceByIdSchema>;

export const updateWorkspaceSchema = workspaceByIdSchema.extend({
  name: z.string().min(1).optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
