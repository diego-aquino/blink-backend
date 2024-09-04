import { RequestMiddleware } from '../../shared/controllers';
import { workspaceByIdSchema } from '../validators';
import { ForbiddenResourceAccessError } from '../../auth/errors';
import { WorkspaceMemberType } from '@prisma/client';
import database from '@/database/client';
import WorkspaceMemberService from './WorkspaceMemberService';

class WorkspaceMemberMiddleware {
  private static _instance = new WorkspaceMemberMiddleware();

  static instance() {
    return this._instance;
  }

  private memberService = WorkspaceMemberService.instance();

  private constructor() {}

  memberTypeAtLeast = (minimumType: WorkspaceMemberType): RequestMiddleware => {
    return async (request, _response, next) => {
      const { userId } = request.middlewares.auth.authenticated;
      const { workspaceId } = workspaceByIdSchema.parse(request.params);

      const member = await database.client.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
      });

      const isAllowed = member !== null && this.memberService.hasTypeAtLeast(member, minimumType);

      if (!isAllowed) {
        throw new ForbiddenResourceAccessError(`/workspaces/${workspaceId}`);
      }

      request.middlewares.workspaceMember.typeAtLeast = { member };

      return next();
    };
  };
}

export default WorkspaceMemberMiddleware;
