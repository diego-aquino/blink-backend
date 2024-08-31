import { RequestMiddleware } from '../../shared/controllers';
import { workspaceByIdSchema } from '../validators';
import { ForbiddenResourceAccessError } from '../../auth/errors';
import { WorkspaceMemberType } from '@prisma/client';
import database from '@/database/client';

const WORKSPACE_MEMBER_TYPE_PRIORITY: Record<WorkspaceMemberType, number> = {
  ADMINISTRATOR: 1,
  DEFAULT: 0,
};

class WorkspaceMemberMiddleware {
  private static _instance = new WorkspaceMemberMiddleware();

  static instance() {
    return this._instance;
  }

  private constructor() {}

  minimumType = (minimumType: WorkspaceMemberType): RequestMiddleware => {
    return async (request, _response, next) => {
      const { userId } = request.middlewares.authenticated;
      const { workspaceId } = workspaceByIdSchema.parse(request.params);

      const member = await database.client.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
      });

      if (!member || !this.getTypesStartingAt(minimumType).includes(member.type)) {
        throw new ForbiddenResourceAccessError(`/workspaces/${workspaceId}`);
      }

      return next();
    };
  };

  private getTypesStartingAt(minimumType: WorkspaceMemberType): WorkspaceMemberType[] {
    const miniumPriority = WORKSPACE_MEMBER_TYPE_PRIORITY[minimumType];

    return Object.entries(WORKSPACE_MEMBER_TYPE_PRIORITY)
      .filter(([_type, priority]) => priority >= miniumPriority)
      .map(([type]) => type);
  }
}

export default WorkspaceMemberMiddleware;
