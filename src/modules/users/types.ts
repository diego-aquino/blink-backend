import { BlinkComponents, BlinkOperations, BlinkSchema } from '@/types/generated';
import { InferPathParams } from 'zimic/http';

export type CreateUserRequestBody = BlinkOperations['users/create']['request']['body'];
export type CreateUserResponseStatus = keyof BlinkOperations['users/create']['response'];
export type CreateUserSuccessResponseBody = BlinkOperations['users/create']['response']['201']['body'];
export type CreateUserConflictResponseBody = BlinkOperations['users/create']['response']['409']['body'];

export type UserByIdPathParams = InferPathParams<BlinkSchema, '/users/:userId'>;
export type GetUserByIdSuccessResponseBody = BlinkOperations['users/getById']['response']['200']['body'];
export type GetUserByIdNotFoundResponseBody = BlinkOperations['users/getById']['response']['404']['body'];
export type GetUserByIdResponseStatus = keyof BlinkOperations['users/getById']['response'];

export type UpdateUserRequestBody = BlinkOperations['users/update']['request']['body'];
export type UpdateUserResponseStatus = keyof BlinkOperations['users/update']['response'];
export type UpdateUserSuccessResponseBody = BlinkOperations['users/update']['response']['200']['body'];

export type DeleteUserResponseStatus = keyof BlinkOperations['users/delete']['response'];

export type UserResponse = BlinkComponents['schemas']['User'];
