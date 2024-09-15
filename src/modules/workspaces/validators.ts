import { z } from 'zod';

export const workspaceCreationSchema = z.object({
  name: z.string().min(1),
});

export type WorkspaceCreationInput = z.infer<typeof workspaceCreationSchema>;

export const workspacesListSchema = z.object({
  name: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

export type WorkspaceListInput = z.infer<typeof workspacesListSchema>;
export namespace WorkspaceListInput {
  export type Raw = z.input<typeof workspacesListSchema>;
}

export const workspaceByIdSchema = z.object({
  workspaceId: z.string().min(1),
});

export type WorkspaceByIdInput = z.infer<typeof workspaceByIdSchema>;

export const workspaceUpdateSchema = workspaceByIdSchema.extend({
  name: z.string().min(1).optional(),
});

export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>;
