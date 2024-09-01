import type { AccessTokenPayload } from '@/modules/auth/types';
import type { User, WorkspaceMember } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      middlewares: {
        auth: {
          authenticated: AccessTokenPayload;
        };
        workspaceMember: {
          typeAtLeast: { member: WorkspaceMember };
        };
      };
    }
  }
}
