import { BlinkComponents, BlinkOperations, BlinkSchema } from '@/types/generated';
import { ParsedHttpSearchParams } from '@/types/zimic';
import { Prisma } from '@prisma/client';
import { InferPathParams } from 'zimic/http';

export type WorkspaceMemberWithUser = Prisma.WorkspaceMemberGetPayload<{
  include: { user: true };
}>;

export type WorkspaceMemberCreationRequestBody = BlinkOperations['workspaces/members/create']['request']['body'];
export type WorkspaceMemberCreationResponseStatus = keyof BlinkOperations['workspaces/members/create']['response'];
export type WorkspaceMemberCreationSuccessResponseBody =
  BlinkOperations['workspaces/members/create']['response']['201']['body'];
export type WorkspaceMemberCreationBadRequestResponseBody =
  BlinkOperations['workspaces/members/create']['response']['400']['body'];
export type WorkspaceMemberCreationUnauthorizedResponseBody =
  BlinkOperations['workspaces/members/create']['response']['401']['body'];
export type WorkspaceMemberCreationForbiddenResponseBody =
  BlinkOperations['workspaces/members/create']['response']['403']['body'];
export type WorkspaceMemberCreationNotFoundResponseBody =
  BlinkOperations['workspaces/members/create']['response']['404']['body'];
export type WorkspaceMemberCreationConflictResponseBody =
  BlinkOperations['workspaces/members/create']['response']['409']['body'];

export type WorkspaceMemberListParams = ParsedHttpSearchParams<
  BlinkOperations['workspaces/members/list']['request']['searchParams']
>;
export type WorkspaceMemberListSuccessResponseBody =
  BlinkOperations['workspaces/members/list']['response']['200']['body'];
export type WorkspaceMemberListUnauthorizedResponseBody =
  BlinkOperations['workspaces/members/list']['response']['401']['body'];
export type WorkspaceMemberListForbiddenResponseBody =
  BlinkOperations['workspaces/members/list']['response']['403']['body'];
export type WorkspaceMemberListNotFoundResponseBody =
  BlinkOperations['workspaces/members/list']['response']['404']['body'];
export type WorkspaceMemberListResponseStatus = keyof BlinkOperations['workspaces/members/get']['response'];

export type WorkspaceMemberByIdPathParams = InferPathParams<BlinkSchema, '/workspaces/:workspaceId/members/:memberId'>;
export type WorkspaceMemberGetByIdSuccessResponseBody =
  BlinkOperations['workspaces/members/get']['response']['200']['body'];
export type WorkspaceMemberGetByIdUnauthorizedResponseBody =
  BlinkOperations['workspaces/members/get']['response']['401']['body'];
export type WorkspaceMemberGetByIdForbiddenResponseBody =
  BlinkOperations['workspaces/members/get']['response']['403']['body'];
export type WorkspaceMemberGetByIdNotFoundResponseBody =
  BlinkOperations['workspaces/members/get']['response']['404']['body'];
export type WorkspaceMemberGetByIdResponseStatus = keyof BlinkOperations['workspaces/members/get']['response'];

export type WorkspaceMemberUpdateRequestBody = BlinkOperations['workspaces/members/update']['request']['body'];
export type WorkspaceMemberUpdateResponseStatus = keyof BlinkOperations['workspaces/members/update']['response'];
export type WorkspaceMemberUpdateSuccessResponseBody =
  BlinkOperations['workspaces/members/update']['response']['200']['body'];
export type WorkspaceMemberUpdateUnauthorizedResponseBody =
  BlinkOperations['workspaces/members/update']['response']['401']['body'];
export type WorkspaceMemberUpdateForbiddenResponseBody =
  BlinkOperations['workspaces/members/update']['response']['403']['body'];
export type WorkspaceMemberUpdateNotFoundResponseBody =
  BlinkOperations['workspaces/members/update']['response']['404']['body'];

export type WorkspaceMemberDeletionResponseStatus = keyof BlinkOperations['workspaces/members/delete']['response'];
export type WorkspaceMemberDeletionUnauthorizedResponseBody =
  BlinkOperations['workspaces/members/delete']['response']['401']['body'];
export type WorkspaceMemberDeletionForbiddenResponseBody =
  BlinkOperations['workspaces/members/delete']['response']['403']['body'];
export type WorkspaceMemberDeletionNotFoundResponseBody =
  BlinkOperations['workspaces/members/delete']['response']['404']['body'];

export type WorkspaceMemberResponse = BlinkComponents['schemas']['WorkspaceMember'];
