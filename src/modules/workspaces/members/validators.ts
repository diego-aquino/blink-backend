import { WorkspaceMemberType } from '@prisma/client';
import { z } from 'zod';
import { workspaceByIdSchema } from '../validators';

export const createWorkspaceMemberSchema = workspaceByIdSchema.extend({
  userId: z.string().min(1),
  type: z.nativeEnum(WorkspaceMemberType),
});

export type CreateWorkspaceMemberInput = z.infer<typeof createWorkspaceMemberSchema>;

export const listWorkspaceMembersSchema = workspaceByIdSchema.extend({
  name: z.string().optional(),
  type: z.nativeEnum(WorkspaceMemberType).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

export type ListWorkspaceMembersInput = z.infer<typeof listWorkspaceMembersSchema>;

export const workspaceMemberByIdSchema = workspaceByIdSchema.extend({
  memberId: z.string().min(1),
});

export type WorkspaceMemberByIdInput = z.infer<typeof workspaceMemberByIdSchema>;

export const updateWorkspaceMemberSchema = workspaceMemberByIdSchema.extend({
  type: z.nativeEnum(WorkspaceMemberType).optional(),
});

export type UpdateWorkspaceMemberInput = z.infer<typeof updateWorkspaceMemberSchema>;
