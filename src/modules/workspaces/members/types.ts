import { BlinkComponents, BlinkOperations, BlinkSchema } from '@/types/generated';
import { ParsedHttpSearchParams } from '@/types/zimic';
import { Prisma } from '@prisma/client';
import { InferPathParams } from 'zimic/http';

export type WorkspaceMemberWithUser = Prisma.WorkspaceMemberGetPayload<{
  include: { user: true };
}>;

export type CreateWorkspaceMemberRequestBody = BlinkOperations['workspaces/members/create']['request']['body'];
export type CreateWorkspaceMemberResponseStatus = keyof BlinkOperations['workspaces/members/create']['response'];
export type CreateWorkspaceMemberSuccessResponseBody =
  BlinkOperations['workspaces/members/create']['response']['201']['body'];
export type CreateWorkspaceMemberBadRequestResponseBody =
  BlinkOperations['workspaces/members/create']['response']['400']['body'];
export type CreateWorkspaceMemberUnauthorizedResponseBody =
  BlinkOperations['workspaces/members/create']['response']['401']['body'];
export type CreateWorkspaceMemberForbiddenResponseBody =
  BlinkOperations['workspaces/members/create']['response']['403']['body'];
export type CreateWorkspaceMemberNotFoundResponseBody =
  BlinkOperations['workspaces/members/create']['response']['404']['body'];
export type CreateWorkspaceMemberConflictResponseBody =
  BlinkOperations['workspaces/members/create']['response']['409']['body'];

export type ListWorkspaceMembersParams = ParsedHttpSearchParams<
  BlinkOperations['workspaces/members/list']['request']['searchParams']
>;
export type ListWorkspaceMembersSuccessResponseBody =
  BlinkOperations['workspaces/members/list']['response']['200']['body'];
export type ListWorkspaceMembersUnauthorizedResponseBody =
  BlinkOperations['workspaces/members/list']['response']['401']['body'];
export type ListWorkspaceMembersForbiddenResponseBody =
  BlinkOperations['workspaces/members/list']['response']['403']['body'];
export type ListWorkspaceMembersNotFoundResponseBody =
  BlinkOperations['workspaces/members/list']['response']['404']['body'];
export type ListWorkspaceMembersResponseStatus = keyof BlinkOperations['workspaces/members/get']['response'];

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
export type DeleteWorkspaceMemberForbiddenResponseBody =
  BlinkOperations['workspaces/members/delete']['response']['403']['body'];
export type DeleteWorkspaceMemberNotFoundResponseBody =
  BlinkOperations['workspaces/members/delete']['response']['404']['body'];

export type WorkspaceMemberResponse = BlinkComponents['schemas']['WorkspaceMember'];
