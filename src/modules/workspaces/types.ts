import { BlinkComponents, BlinkOperations, BlinkSchema } from '@/types/generated';
import { ParsedHttpSearchParams } from '@/types/zimic';
import { InferPathParams } from 'zimic/http';

export type CreateWorkspaceRequestBody = BlinkOperations['workspaces/create']['request']['body'];
export type CreateWorkspaceResponseStatus = keyof BlinkOperations['workspaces/create']['response'];
export type CreateWorkspaceSuccessResponseBody = BlinkOperations['workspaces/create']['response']['201']['body'];

export type ListWorkspacesParams = ParsedHttpSearchParams<
  BlinkOperations['workspaces/list']['request']['searchParams']
>;
export type ListWorkspacesSuccessResponseBody = BlinkOperations['workspaces/list']['response']['200']['body'];
export type ListWorkspacesUnauthorizedResponseBody = BlinkOperations['workspaces/list']['response']['401']['body'];
export type ListWorkspacesForbiddenResponseBody = BlinkOperations['workspaces/list']['response']['403']['body'];
export type ListWorkspacesResponseStatus = keyof BlinkOperations['workspaces/list']['response'];

export type WorkspaceByIdPathParams = InferPathParams<BlinkSchema, '/workspaces/:workspaceId'>;
export type GetWorkspaceByIdSuccessResponseBody = BlinkOperations['workspaces/get']['response']['200']['body'];
export type GetWorkspaceByIdUnauthorizedResponseBody = BlinkOperations['workspaces/get']['response']['401']['body'];
export type GetWorkspaceByIdForbiddenResponseBody = BlinkOperations['workspaces/get']['response']['403']['body'];
export type GetWorkspaceByIdNotFoundResponseBody = BlinkOperations['workspaces/get']['response']['404']['body'];
export type GetWorkspaceByIdResponseStatus = keyof BlinkOperations['workspaces/get']['response'];

export type UpdateWorkspaceRequestBody = BlinkOperations['workspaces/update']['request']['body'];
export type UpdateWorkspaceResponseStatus = keyof BlinkOperations['workspaces/update']['response'];
export type UpdateWorkspaceSuccessResponseBody = BlinkOperations['workspaces/update']['response']['200']['body'];
export type UpdateWorkspaceUnauthorizedResponseBody = BlinkOperations['workspaces/update']['response']['401']['body'];
export type UpdateWorkspaceForbiddenResponseBody = BlinkOperations['workspaces/update']['response']['403']['body'];
export type UpdateWorkspaceNotFoundResponseBody = BlinkOperations['workspaces/update']['response']['404']['body'];

export type DeleteWorkspaceResponseStatus = keyof BlinkOperations['workspaces/delete']['response'];
export type DeleteWorkspaceUnauthorizedResponseBody = BlinkOperations['workspaces/delete']['response']['401']['body'];
export type DeleteWorkspaceNotFoundResponseBody = BlinkOperations['workspaces/delete']['response']['404']['body'];

export type WorkspaceResponse = BlinkComponents['schemas']['Workspace'];
