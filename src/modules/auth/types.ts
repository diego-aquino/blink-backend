import { BlinkOperations } from '@/types/generated';
import { User, UserSession } from '@prisma/client';
import { JWTPayload } from 'jose';

export interface AuthToken {
  value: string;
  expiresAt: Date;
}

export interface AccessTokenPayload extends JWTPayload {
  userId: User['id'];
  sessionId: UserSession['id'];
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: User['id'];
  sessionId: UserSession['id'];
}

export type LoginRequestBody = BlinkOperations['auth/login']['request']['body'];
export type LoginResponseStatus = keyof BlinkOperations['auth/login']['response'];
export type LoginBadRequestResponseBody = BlinkOperations['auth/login']['response']['400']['body'];
export type LoginUnauthorizedResponseBody = BlinkOperations['auth/login']['response']['401']['body'];

export type RefreshAuthResponseStatus = keyof BlinkOperations['auth/refresh']['response'];
export type RefreshAuthBadRequestResponseBody = BlinkOperations['auth/refresh']['response']['400']['body'];
export type RefreshAuthUnauthorizedResponseBody = BlinkOperations['auth/refresh']['response']['401']['body'];

export type LogoutResponseStatus = keyof BlinkOperations['auth/logout']['response'];
export type LogoutUnauthorizedResponseBody = BlinkOperations['auth/logout']['response']['401']['body'];
