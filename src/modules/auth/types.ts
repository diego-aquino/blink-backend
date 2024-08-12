import { BlinkComponents } from '@/types/generated';
import { UserSession } from '@prisma/client';

export type LoginResult = BlinkComponents['schemas']['LoginResult'];

export interface AccessTokenPayload {
  sessionId: UserSession['id'];
}

export interface RefreshTokenPayload {
  sessionId: UserSession['id'];
}
