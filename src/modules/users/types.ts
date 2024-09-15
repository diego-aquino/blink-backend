import { BlinkComponents, BlinkOperations, BlinkSchema } from '@/types/generated';
import { InferPathParams } from 'zimic/http';

export type UserCreationRequestBody = BlinkOperations['users/create']['request']['body'];
export type UserCreationResponseStatus = keyof BlinkOperations['users/create']['response'];
export type UserCreationSuccessResponseBody = BlinkOperations['users/create']['response']['201']['body'];
export type UserCreationBadRequestResponseBody = BlinkOperations['users/create']['response']['400']['body'];
export type UserCreationConflictResponseBody = BlinkOperations['users/create']['response']['409']['body'];

export type UserByIdPathParams = InferPathParams<BlinkSchema, '/users/:userId'>;
export type UserGetByIdSuccessResponseBody = BlinkOperations['users/get']['response']['200']['body'];
export type UserGetByIdUnauthorizedResponseBody = BlinkOperations['users/get']['response']['401']['body'];
export type UserGetByIdForbiddenResponseBody = BlinkOperations['users/get']['response']['403']['body'];
export type UserGetByIdNotFoundResponseBody = BlinkOperations['users/get']['response']['404']['body'];
export type UserGetByIdResponseStatus = keyof BlinkOperations['users/get']['response'];

export type UserUpdateRequestBody = BlinkOperations['users/update']['request']['body'];
export type UserUpdateResponseStatus = keyof BlinkOperations['users/update']['response'];
export type UserUpdateSuccessResponseBody = BlinkOperations['users/update']['response']['200']['body'];
export type UserUpdateBadRequestResponseBody = BlinkOperations['users/update']['response']['400']['body'];
export type UserUpdateUnauthorizedResponseBody = BlinkOperations['users/update']['response']['401']['body'];
export type UserUpdateForbiddenResponseBody = BlinkOperations['users/update']['response']['403']['body'];
export type UserUpdateNotFoundResponseBody = BlinkOperations['users/update']['response']['404']['body'];
export type UserUpdateConflictResponseBody = BlinkOperations['users/update']['response']['409']['body'];

export type UserDeletionResponseStatus = keyof BlinkOperations['users/delete']['response'];
export type UserDeletionUnauthorizedResponseBody = BlinkOperations['users/delete']['response']['401']['body'];
export type UserDeletionNotFoundResponseBody = BlinkOperations['users/delete']['response']['404']['body'];

export type UserResponse = BlinkComponents['schemas']['User'];
