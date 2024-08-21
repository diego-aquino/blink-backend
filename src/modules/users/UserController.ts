import UserService from './UserService';
import { BlinkSchema } from '@/types/generated';
import { RequestHandler } from '../shared/controllers';
import { BlinkOperations } from '@/types/generated';
import { toUserResponse } from './views';
import { createUserSchema, userByIdSchema, updateUserSchema } from './validators';
import { InferPathParams } from 'zimic/http';

class UserController {
  private static _instance = new UserController();

  static instance() {
    return this._instance;
  }

  private constructor() {}

  private userService = UserService.instance();

  create: RequestHandler = async (request, response) => {
    type RequestBody = BlinkOperations['users/create']['request']['body'];
    type SuccessResponseBody = BlinkOperations['users/create']['response']['201']['body'];

    const input = createUserSchema.parse(request.body) satisfies RequestBody;
    const user = await this.userService.create(input);

    return response.status(201).json(toUserResponse(user) satisfies SuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    type RequestParams = InferPathParams<BlinkSchema, '/users/:userId'>;
    type SuccessResponseBody = BlinkOperations['users/getById']['response']['200']['body'];

    const input = userByIdSchema.parse(request.params) satisfies RequestParams;
    const user = await this.userService.getById(input);

    return response.status(200).json(toUserResponse(user) satisfies SuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    type RequestParams = InferPathParams<BlinkSchema, '/users/:userId'>;
    type RequestBody = BlinkOperations['users/update']['request']['body'];
    type SuccessResponseBody = BlinkOperations['users/update']['response']['200']['body'];

    const input = updateUserSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies RequestBody & RequestParams;

    const user = await this.userService.update(input);

    return response.status(200).json(toUserResponse(user) satisfies SuccessResponseBody);
  };

  delete: RequestHandler = async (request, response) => {
    type RequestParams = InferPathParams<BlinkSchema, '/users/:userId'>;
    type ResponseStatus = keyof BlinkOperations['auth/logout']['response'];

    const input = userByIdSchema.parse(request.params) satisfies RequestParams;
    await this.userService.delete(input);

    return response.status(204 satisfies ResponseStatus).send();
  };
}

export default UserController;
