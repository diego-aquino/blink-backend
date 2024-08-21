import { RequestMiddleware } from '../shared/controllers';
import { userByIdSchema } from './validators';
import { ForbiddenResourceAccessError } from '../auth/errors';

class UserMiddleware {
  private static _instance = new UserMiddleware();

  static instance() {
    return this._instance;
  }

  private constructor() {}

  ownUser: RequestMiddleware = (request, _response, next) => {
    const { userId: authenticatedUserId } = request.middlewares.authenticated;
    const { userId: accessedUserId } = userByIdSchema.parse(request.params);

    if (authenticatedUserId !== accessedUserId) {
      throw new ForbiddenResourceAccessError(`/users/${accessedUserId}`);
    }

    return next();
  };
}

export default UserMiddleware;
