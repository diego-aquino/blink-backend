import UserService, { createUserSchema, getUserByIdSchema } from './UserService';
import { BlinkSchema } from '@/types/generated';
import { PathParamsSchemaFromPath, RequestHandler } from '../shared/controllers';
import { BlinkOperations } from '@/types/generated';
import { toUserResponse } from './views';

class UserController {
  private userService = new UserService();

  create: RequestHandler = async (request, response) => {
    const input = createUserSchema.parse(request.body) satisfies BlinkOperations['users/create']['request']['body'];

    const user = await this.userService.create(input);

    return response
      .status(201)
      .json(toUserResponse(user) satisfies BlinkOperations['users/create']['response']['201']['body']);
  };

  getById: RequestHandler = async (request, response) => {
    const input = getUserByIdSchema.parse(request.params) satisfies PathParamsSchemaFromPath<
      BlinkSchema,
      '/users/:userId'
    >;

    const user = await this.userService.getById(input);

    return response
      .status(200)
      .json(toUserResponse(user) satisfies BlinkOperations['users/getById']['response']['200']['body']);
  };
}

export default UserController;
