import type { AccessTokenPayload } from '@/modules/auth/types';
import type { User } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      middlewares: {
        authenticated: AccessTokenPayload;
      };
    }
  }
}
