import UserService from './UserService';
import { BlinkSchema } from '@/types/generated';
import { PathParamsSchemaFromPath, RequestHandler } from '../shared/controllers';
import { BlinkOperations } from '@/types/generated';
import { toUserResponse } from './views';
import { createUserSchema, getUserByIdSchema, updateUserSchema } from './validators';

class UserController {
  private userService = UserService.singleton();

  create: RequestHandler = async (request, response) => {
    type RequestBody = BlinkOperations['users/create']['request']['body'];
    type SuccessResponseBody = BlinkOperations['users/create']['response']['201']['body'];

    const input = createUserSchema.parse(request.body) satisfies RequestBody;
    const user = await this.userService.create(input);

    return response.status(201).json(toUserResponse(user) satisfies SuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    type RequestParams = PathParamsSchemaFromPath<BlinkSchema, '/users/:userId'>;
    type SuccessResponseBody = BlinkOperations['users/getById']['response']['200']['body'];

    const input = getUserByIdSchema.parse(request.params) satisfies RequestParams;
    const user = await this.userService.getById(input);

    return response.status(200).json(toUserResponse(user) satisfies SuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    type RequestParams = PathParamsSchemaFromPath<BlinkSchema, '/users/:userId'>;
    type RequestBody = BlinkOperations['users/update']['request']['body'];
    type SuccessResponseBody = BlinkOperations['users/update']['response']['200']['body'];

    const input = updateUserSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies RequestBody & RequestParams;

    const user = await this.userService.update(input);

    return response.status(200).json(toUserResponse(user) satisfies SuccessResponseBody);
  };
}

export default UserController;
