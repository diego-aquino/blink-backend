import { User, WorkspaceMember } from '@prisma/client';
import { WorkspaceMemberResponse } from './types';
import { toUserResponse } from '@/modules/users/views';

export function toWorkspaceMemberResponse(workspaceMember: WorkspaceMember & { user: User }): WorkspaceMemberResponse {
  return {
    id: workspaceMember.id,
    user: toUserResponse(workspaceMember.user),
    type: workspaceMember.type,
    createdAt: workspaceMember.createdAt.toISOString(),
    updatedAt: workspaceMember.updatedAt.toISOString(),
  };
}
