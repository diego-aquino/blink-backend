import { BlinkComponents, BlinkOperations, BlinkSchema } from '@/types/generated';
import { ParsedHttpSearchParams } from '@/types/zimic';
import { InferPathParams } from 'zimic/http';

export type BlinkCreationRequestBody = BlinkOperations['workspaces/blinks/create']['request']['body'];
export type BlinkCreationResponseStatus = keyof BlinkOperations['workspaces/blinks/create']['response'];
export type BlinkCreationSuccessResponseBody = BlinkOperations['workspaces/blinks/create']['response']['201']['body'];
export type BlinkCreationBadRequestResponseBody =
  BlinkOperations['workspaces/blinks/create']['response']['400']['body'];
export type BlinkCreationUnauthorizedResponseBody =
  BlinkOperations['workspaces/blinks/create']['response']['401']['body'];
export type BlinkCreationForbiddenResponseBody = BlinkOperations['workspaces/blinks/create']['response']['403']['body'];
export type BlinkCreationNotFoundResponseBody = BlinkOperations['workspaces/blinks/create']['response']['404']['body'];
export type BlinkCreationConflictResponseBody = BlinkOperations['workspaces/blinks/create']['response']['409']['body'];

export type BlinkListParams = ParsedHttpSearchParams<
  BlinkOperations['workspaces/blinks/list']['request']['searchParams']
>;
export type BlinkListSuccessResponseBody = BlinkOperations['workspaces/blinks/list']['response']['200']['body'];
export type BlinkListUnauthorizedResponseBody = BlinkOperations['workspaces/blinks/list']['response']['401']['body'];
export type BlinkListForbiddenResponseBody = BlinkOperations['workspaces/blinks/list']['response']['403']['body'];
export type BlinkListNotFoundResponseBody = BlinkOperations['workspaces/blinks/list']['response']['404']['body'];
export type BlinkListResponseStatus = keyof BlinkOperations['workspaces/blinks/get']['response'];

export type BlinkByIdPathParams = InferPathParams<BlinkSchema, '/workspaces/:workspaceId/blinks/:blinkId'>;
export type BlinkGetByIdSuccessResponseBody = BlinkOperations['workspaces/blinks/get']['response']['200']['body'];
export type BlinkGetByIdUnauthorizedResponseBody = BlinkOperations['workspaces/blinks/get']['response']['401']['body'];
export type BlinkGetByIdForbiddenResponseBody = BlinkOperations['workspaces/blinks/get']['response']['403']['body'];
export type BlinkGetByIdNotFoundResponseBody = BlinkOperations['workspaces/blinks/get']['response']['404']['body'];
export type BlinkGetByIdResponseStatus = keyof BlinkOperations['workspaces/blinks/get']['response'];

export type BlinkUpdateRequestBody = BlinkOperations['workspaces/blinks/update']['request']['body'];
export type BlinkUpdateResponseStatus = keyof BlinkOperations['workspaces/blinks/update']['response'];
export type BlinkUpdateSuccessResponseBody = BlinkOperations['workspaces/blinks/update']['response']['200']['body'];
export type BlinkUpdateUnauthorizedResponseBody =
  BlinkOperations['workspaces/blinks/update']['response']['401']['body'];
export type BlinkUpdateForbiddenResponseBody = BlinkOperations['workspaces/blinks/update']['response']['403']['body'];
export type BlinkUpdateNotFoundResponseBody = BlinkOperations['workspaces/blinks/update']['response']['404']['body'];

export type BlinkDeletionResponseStatus = keyof BlinkOperations['workspaces/blinks/delete']['response'];
export type BlinkDeletionUnauthorizedResponseBody =
  BlinkOperations['workspaces/blinks/delete']['response']['401']['body'];
export type BlinkDeletionNotFoundResponseBody = BlinkOperations['workspaces/blinks/delete']['response']['404']['body'];

export type BlinkResponse = BlinkComponents['schemas']['Blink'];
