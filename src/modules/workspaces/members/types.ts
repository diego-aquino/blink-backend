import { BlinkComponents, BlinkOperations, BlinkSchema } from '@/types/generated';
import { Prisma } from '@prisma/client';
import { InferPathParams } from 'zimic/http';

export type WorkspaceMemberWithUser = Prisma.WorkspaceMemberGetPayload<{
  include: { user: true };
}>;

export type CreateWorkspaceMemberRequestBody = BlinkOperations['workspaces/members/create']['request']['body'];
export type CreateWorkspaceMemberResponseStatus = keyof BlinkOperations['workspaces/members/create']['response'];
export type CreateWorkspaceMemberSuccessResponseBody =
  BlinkOperations['workspaces/members/create']['response']['201']['body'];

export type WorkspaceMemberByIdPathParams = InferPathParams<BlinkSchema, '/workspaces/:workspaceId/members/:memberId'>;
export type GetWorkspaceMemberByIdSuccessResponseBody =
  BlinkOperations['workspaces/members/get']['response']['200']['body'];
export type GetWorkspaceMemberByIdUnauthorizedResponseBody =
  BlinkOperations['workspaces/members/get']['response']['401']['body'];
export type GetWorkspaceMemberByIdForbiddenResponseBody =
  BlinkOperations['workspaces/members/get']['response']['403']['body'];
export type GetWorkspaceMemberByIdNotFoundResponseBody =
  BlinkOperations['workspaces/members/get']['response']['404']['body'];
export type GetWorkspaceMemberByIdResponseStatus = keyof BlinkOperations['workspaces/members/get']['response'];

export type UpdateWorkspaceMemberRequestBody = BlinkOperations['workspaces/members/update']['request']['body'];
export type UpdateWorkspaceMemberResponseStatus = keyof BlinkOperations['workspaces/members/update']['response'];
export type UpdateWorkspaceMemberSuccessResponseBody =
  BlinkOperations['workspaces/members/update']['response']['200']['body'];
export type UpdateWorkspaceMemberUnauthorizedResponseBody =
  BlinkOperations['workspaces/members/update']['response']['401']['body'];
export type UpdateWorkspaceMemberForbiddenResponseBody =
  BlinkOperations['workspaces/members/update']['response']['403']['body'];
export type UpdateWorkspaceMemberNotFoundResponseBody =
  BlinkOperations['workspaces/members/update']['response']['404']['body'];

export type DeleteWorkspaceMemberResponseStatus = keyof BlinkOperations['workspaces/members/delete']['response'];
export type DeleteWorkspaceMemberUnauthorizedResponseBody =
  BlinkOperations['workspaces/members/delete']['response']['401']['body'];
export type DeleteWorkspaceMemberNotFoundResponseBody =
  BlinkOperations['workspaces/members/delete']['response']['404']['body'];

export type WorkspaceMemberResponse = BlinkComponents['schemas']['WorkspaceMember'];
