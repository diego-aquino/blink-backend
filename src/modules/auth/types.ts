import { BlinkComponents } from '@/types/generated';
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
