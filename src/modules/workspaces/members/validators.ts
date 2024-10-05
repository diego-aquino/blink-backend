import { WorkspaceMemberType } from '@prisma/client';
import { z } from 'zod';
import { workspaceByIdSchema } from '../validators';

export const workspaceMemberCreationBodySchema = z.object({
  userId: z.string().min(1),
  type: z.nativeEnum(WorkspaceMemberType),
});

export const workspaceMemberCreationSchema = workspaceByIdSchema.and(workspaceMemberCreationBodySchema);

export type WorkspaceCreationMemberInput = z.infer<typeof workspaceMemberCreationSchema>;

export namespace WorkspaceCreationMemberInput {
  export type Body = z.infer<typeof workspaceMemberCreationBodySchema>;
}

export const workspaceMemberListSchema = workspaceByIdSchema.extend({
  name: z.string().trim().optional(),
  type: z.nativeEnum(WorkspaceMemberType).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

export type WorkspaceMemberListInput = z.infer<typeof workspaceMemberListSchema>;

export const workspaceMemberByIdSchema = workspaceByIdSchema.extend({
  memberId: z.string().min(1),
});

export type WorkspaceMemberByIdInput = z.infer<typeof workspaceMemberByIdSchema>;

export const workspaceMemberUpdateSchema = workspaceMemberByIdSchema.extend({
  type: z.nativeEnum(WorkspaceMemberType).optional(),
});

export type WorkspaceUpdateMemberInput = z.infer<typeof workspaceMemberUpdateSchema>;
