import { BlinkComponents, BlinkOperations } from '@/types/generated';
import { User, UserSession } from '@prisma/client';
import { JWTPayload } from 'jose';

export type LoginResult = BlinkComponents['schemas']['LoginResult'];

export interface AccessTokenPayload extends JWTPayload {
  userId: User['id'];
  sessionId: UserSession['id'];
}

export interface RefreshTokenPayload extends JWTPayload {
  sessionId: UserSession['id'];
}

export type LoginRequestBody = BlinkOperations['auth/login']['request']['body'];
export type LoginResponseStatus = keyof BlinkOperations['auth/login']['response'];
export type LoginSuccessResponseBody = BlinkOperations['auth/login']['response']['200']['body'];

export type RefreshAuthRequestBody = BlinkOperations['auth/refresh']['request']['body'];
export type RefreshAuthResponseStatus = keyof BlinkOperations['auth/refresh']['response'];
export type RefreshAuthSuccessResponseBody = BlinkOperations['auth/refresh']['response']['200']['body'];

export type LogoutResponseStatus = keyof BlinkOperations['auth/logout']['response'];
