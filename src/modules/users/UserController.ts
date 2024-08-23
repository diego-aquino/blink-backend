import UserService from './UserService';
import { RequestHandler } from '../shared/controllers';
import { toUserResponse } from './views';
import { createUserSchema, userByIdSchema, updateUserSchema } from './validators';
import {
  CreateUserRequestBody,
  CreateUserResponseStatus,
  CreateUserSuccessResponseBody,
  DeleteUserResponseStatus,
  GetUserByIdResponseStatus,
  GetUserByIdSuccessResponseBody,
  UpdateUserRequestBody,
  UpdateUserResponseStatus,
  UpdateUserSuccessResponseBody,
  UserByIdPathParams,
} from './types';

class UserController {
  private static _instance = new UserController();

  static instance() {
    return this._instance;
  }

  private constructor() {}

  private userService = UserService.instance();

  create: RequestHandler = async (request, response) => {
    const input = createUserSchema.parse(request.body) satisfies CreateUserRequestBody;
    const user = await this.userService.create(input);

    return response
      .status(201 satisfies CreateUserResponseStatus)
      .json(toUserResponse(user) satisfies CreateUserSuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    const input = userByIdSchema.parse(request.params) satisfies UserByIdPathParams;
    const user = await this.userService.getById(input);

    return response
      .status(200 satisfies GetUserByIdResponseStatus)
      .json(toUserResponse(user) satisfies GetUserByIdSuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    const input = updateUserSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies UserByIdPathParams & UpdateUserRequestBody;

    const user = await this.userService.update(input);

    return response
      .status(200 satisfies UpdateUserResponseStatus)
      .json(toUserResponse(user) satisfies UpdateUserSuccessResponseBody);
  };

  delete: RequestHandler = async (request, response) => {
    const input = userByIdSchema.parse(request.params) satisfies UserByIdPathParams;
    await this.userService.delete(input);

    return response.status(204 satisfies DeleteUserResponseStatus).send();
  };
}

export default UserController;
