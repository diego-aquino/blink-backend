import UserService, { createUserSchema } from './UserService';
import { RequestHandler } from '../shared/controllers';
import { BlinkOperations } from '@/types/generated';
import { toUserResponse } from './views';

class UserController {
  private userService = new UserService();

  create: RequestHandler = async (request, response) => {
    const body = createUserSchema.parse(request.body) satisfies BlinkOperations['users/create']['request']['body'];

    const user = await this.userService.create(body);

    return response
      .status(201)
      .json(toUserResponse(user) satisfies BlinkOperations['users/create']['response']['201']['body']);
  };
}

export default UserController;
