import { BlinkComponents, BlinkOperations, BlinkSchema } from '@/types/generated';
import { ParsedHttpSearchParams } from '@/types/zimic';
import { InferPathParams } from 'zimic/http';

export type CreateBlinkRequestBody = BlinkOperations['workspaces/blinks/create']['request']['body'];
export type CreateBlinkResponseStatus = keyof BlinkOperations['workspaces/blinks/create']['response'];
export type CreateBlinkSuccessResponseBody = BlinkOperations['workspaces/blinks/create']['response']['201']['body'];

export type ListBlinksParams = ParsedHttpSearchParams<
  BlinkOperations['workspaces/blinks/list']['request']['searchParams']
>;
export type ListBlinksSuccessResponseBody = BlinkOperations['workspaces/blinks/list']['response']['200']['body'];
export type ListBlinksUnauthorizedResponseBody = BlinkOperations['workspaces/blinks/list']['response']['401']['body'];
export type ListBlinksForbiddenResponseBody = BlinkOperations['workspaces/blinks/list']['response']['403']['body'];
export type ListBlinksNotFoundResponseBody = BlinkOperations['workspaces/blinks/list']['response']['404']['body'];
export type ListBlinksResponseStatus = keyof BlinkOperations['workspaces/blinks/get']['response'];

export type BlinkByIdPathParams = InferPathParams<BlinkSchema, '/workspaces/:workspaceId/blinks/:blinkId'>;
export type GetBlinkByIdSuccessResponseBody = BlinkOperations['workspaces/blinks/get']['response']['200']['body'];
export type GetBlinkByIdUnauthorizedResponseBody = BlinkOperations['workspaces/blinks/get']['response']['401']['body'];
export type GetBlinkByIdForbiddenResponseBody = BlinkOperations['workspaces/blinks/get']['response']['403']['body'];
export type GetBlinkByIdNotFoundResponseBody = BlinkOperations['workspaces/blinks/get']['response']['404']['body'];
export type GetBlinkByIdResponseStatus = keyof BlinkOperations['workspaces/blinks/get']['response'];

export type UpdateBlinkRequestBody = BlinkOperations['workspaces/blinks/update']['request']['body'];
export type UpdateBlinkResponseStatus = keyof BlinkOperations['workspaces/blinks/update']['response'];
export type UpdateBlinkSuccessResponseBody = BlinkOperations['workspaces/blinks/update']['response']['200']['body'];
export type UpdateBlinkUnauthorizedResponseBody =
  BlinkOperations['workspaces/blinks/update']['response']['401']['body'];
export type UpdateBlinkForbiddenResponseBody = BlinkOperations['workspaces/blinks/update']['response']['403']['body'];
export type UpdateBlinkNotFoundResponseBody = BlinkOperations['workspaces/blinks/update']['response']['404']['body'];

export type DeleteBlinkResponseStatus = keyof BlinkOperations['workspaces/blinks/delete']['response'];
export type DeleteBlinkUnauthorizedResponseBody =
  BlinkOperations['workspaces/blinks/delete']['response']['401']['body'];
export type DeleteBlinkNotFoundResponseBody = BlinkOperations['workspaces/blinks/delete']['response']['404']['body'];

export type BlinkResponse = BlinkComponents['schemas']['Blink'];
