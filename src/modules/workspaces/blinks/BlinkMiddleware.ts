import { RequestMiddleware } from '../../shared/controllers';
import { workspaceByIdSchema } from '../validators';
import { ForbiddenResourceAccessError } from '../../auth/errors';
import database from '@/database/client';
import { blinkByIdSchema } from './validators';
import { BlinkNotFoundError } from './errors';
import WorkspaceMemberService from '../members/WorkspaceMemberService';

class BlinkMiddleware {
  private static _instance = new BlinkMiddleware();

  static instance() {
    return this._instance;
  }

  private memberService = WorkspaceMemberService.instance();

  private constructor() {}

  blinkWriter = (): RequestMiddleware => {
    return async (request, _response, next) => {
      const { userId } = request.middlewares.auth.authenticated;
      const { workspaceId } = workspaceByIdSchema.parse(request.params);
      const { blinkId } = blinkByIdSchema.parse(request.params);

      const blink = await database.client.blink.findUnique({
        where: { id: blinkId, workspaceId },
      });

      if (!blink) {
        throw new BlinkNotFoundError(blinkId);
      }

      const { member } = request.middlewares.workspaceMember.typeAtLeast;
      const isAllowed = blink.creatorId === userId || this.memberService.hasTypeAtLeast(member, 'ADMINISTRATOR');

      if (isAllowed) {
        throw new ForbiddenResourceAccessError(`/workspaces/${workspaceId}`);
      }

      return next();
    };
  };
}

export default BlinkMiddleware;
