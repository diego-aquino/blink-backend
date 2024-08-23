import { BlinkComponents, BlinkOperations } from '@/types/generated';

export type CreateUserRequestBody = BlinkOperations['users/create']['request']['body'];
export type CreateUserResponseStatus = keyof BlinkOperations['users/create']['response'];
export type CreateUserSuccessResponseBody = BlinkOperations['users/create']['response']['201']['body'];
export type CreateUserConflictResponseBody = BlinkOperations['users/create']['response']['409']['body'];

export type UserResponse = BlinkComponents['schemas']['User'];
