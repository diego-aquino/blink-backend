import UserService from './UserService';
import { RequestHandler } from '../shared/controllers';
import { toUserResponse } from './views';
import { userCreationSchema, userByIdSchema, userUpdateSchema } from './validators';
import {
  UserCreationRequestBody,
  UserCreationResponseStatus,
  UserCreationSuccessResponseBody,
  UserDeletionResponseStatus,
  UserGetByIdResponseStatus,
  UserGetByIdSuccessResponseBody,
  UserUpdateRequestBody,
  UserUpdateResponseStatus,
  UserUpdateSuccessResponseBody,
  UserByIdPathParams,
} from './types';

class UserController {
  private static _instance = new UserController();

  static instance() {
    return this._instance;
  }

  private userService = UserService.instance();

  private constructor() {}

  create: RequestHandler = async (request, response) => {
    const input = userCreationSchema.parse(request.body) satisfies UserCreationRequestBody;
    const user = await this.userService.create(input);

    return response
      .status(201 satisfies UserCreationResponseStatus)
      .json(toUserResponse(user) satisfies UserCreationSuccessResponseBody);
  };

  getMe: RequestHandler = async (request, response) => {
    const userId = request.middlewares.auth.authenticated.userId;
    const user = await this.userService.get({ userId });

    return response
      .status(200 satisfies UserGetByIdResponseStatus)
      .json(toUserResponse(user) satisfies UserGetByIdSuccessResponseBody);
  };

  get: RequestHandler = async (request, response) => {
    const input = userByIdSchema.parse(request.params) satisfies UserByIdPathParams;
    const user = await this.userService.get(input);

    return response
      .status(200 satisfies UserGetByIdResponseStatus)
      .json(toUserResponse(user) satisfies UserGetByIdSuccessResponseBody);
  };

  update: RequestHandler = async (request, response) => {
    const input = userUpdateSchema.parse({
      ...request.body,
      ...request.params,
    }) satisfies UserByIdPathParams & UserUpdateRequestBody;

    const user = await this.userService.update(input);

    return response
      .status(200 satisfies UserUpdateResponseStatus)
      .json(toUserResponse(user) satisfies UserUpdateSuccessResponseBody);
  };

  delete: RequestHandler = async (request, response) => {
    const input = userByIdSchema.parse(request.params) satisfies UserByIdPathParams;
    await this.userService.delete(input);

    return response.status(204 satisfies UserDeletionResponseStatus).send();
  };
}

export default UserController;
