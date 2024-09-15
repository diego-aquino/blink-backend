import { BlinkComponents, BlinkOperations, BlinkSchema } from '@/types/generated';
import { ParsedHttpSearchParams } from '@/types/zimic';
import { InferPathParams } from 'zimic/http';

export type WorkspaceCreationRequestBody = BlinkOperations['workspaces/create']['request']['body'];
export type WorkspaceCreationResponseStatus = keyof BlinkOperations['workspaces/create']['response'];
export type WorkspaceCreationSuccessResponseBody = BlinkOperations['workspaces/create']['response']['201']['body'];
export type WorkspaceCreationBadRequestResponseBody = BlinkOperations['workspaces/create']['response']['400']['body'];
export type WorkspaceCreationUnauthorizedResponseBody = BlinkOperations['workspaces/create']['response']['401']['body'];

export type WorkspaceListParams = ParsedHttpSearchParams<BlinkOperations['workspaces/list']['request']['searchParams']>;
export type WorkspaceListSuccessResponseBody = BlinkOperations['workspaces/list']['response']['200']['body'];
export type WorkspaceListUnauthorizedResponseBody = BlinkOperations['workspaces/list']['response']['401']['body'];
export type WorkspaceListForbiddenResponseBody = BlinkOperations['workspaces/list']['response']['403']['body'];
export type WorkspaceListResponseStatus = keyof BlinkOperations['workspaces/list']['response'];

export type WorkspaceByIdPathParams = InferPathParams<BlinkSchema, '/workspaces/:workspaceId'>;
export type WorkspaceGetByIdSuccessResponseBody = BlinkOperations['workspaces/get']['response']['200']['body'];
export type WorkspaceGetByIdUnauthorizedResponseBody = BlinkOperations['workspaces/get']['response']['401']['body'];
export type WorkspaceGetByIdForbiddenResponseBody = BlinkOperations['workspaces/get']['response']['403']['body'];
export type WorkspaceGetByIdNotFoundResponseBody = BlinkOperations['workspaces/get']['response']['404']['body'];
export type WorkspaceGetByIdResponseStatus = keyof BlinkOperations['workspaces/get']['response'];

export type WorkspaceUpdateRequestBody = BlinkOperations['workspaces/update']['request']['body'];
export type WorkspaceUpdateResponseStatus = keyof BlinkOperations['workspaces/update']['response'];
export type WorkspaceUpdateSuccessResponseBody = BlinkOperations['workspaces/update']['response']['200']['body'];
export type WorkspaceUpdateBadRequestResponseBody = BlinkOperations['workspaces/update']['response']['400']['body'];
export type WorkspaceUpdateUnauthorizedResponseBody = BlinkOperations['workspaces/update']['response']['401']['body'];
export type WorkspaceUpdateForbiddenResponseBody = BlinkOperations['workspaces/update']['response']['403']['body'];
export type WorkspaceUpdateNotFoundResponseBody = BlinkOperations['workspaces/update']['response']['404']['body'];

export type WorkspaceDeletionResponseStatus = keyof BlinkOperations['workspaces/delete']['response'];
export type WorkspaceDeletionUnauthorizedResponseBody = BlinkOperations['workspaces/delete']['response']['401']['body'];
export type WorkspaceDeletionNotFoundResponseBody = BlinkOperations['workspaces/delete']['response']['404']['body'];

export type WorkspaceResponse = BlinkComponents['schemas']['Workspace'];
