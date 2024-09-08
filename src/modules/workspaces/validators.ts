import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const listWorkspacesSchema = z.object({
  name: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

export type ListWorkspacesInput = z.infer<typeof listWorkspacesSchema>;
export namespace ListWorkspacesInput {
  export type Raw = z.input<typeof listWorkspacesSchema>;
}

export const workspaceByIdSchema = z.object({
  workspaceId: z.string().min(1),
});

export type WorkspaceByIdInput = z.infer<typeof workspaceByIdSchema>;

export const updateWorkspaceSchema = workspaceByIdSchema.extend({
  name: z.string().min(1).optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
