import AuthService from './AuthService';
import { RequestHandler } from '../shared/controllers';
import { loginSchema, refreshAuthSchema } from './validators';
import {
  LoginRequestBody,
  LoginResponseStatus,
  LoginSuccessResponseBody,
  LogoutResponseStatus,
  RefreshAuthRequestBody,
  RefreshAuthResponseStatus,
  RefreshAuthSuccessResponseBody,
} from './types';

class AuthController {
  private static _instance = new AuthController();

  static instance() {
    return this._instance;
  }

  private authService = AuthService.instance();

  private constructor() {}

  login: RequestHandler = async (request, response) => {
    const input = loginSchema.parse(request.body) satisfies LoginRequestBody;
    const loginResult = await this.authService.login(input);

    return response.status(200 satisfies LoginResponseStatus).json(loginResult satisfies LoginSuccessResponseBody);
  };

  refresh: RequestHandler = async (request, response) => {
    const { refreshToken } = refreshAuthSchema.parse(request.body) satisfies RefreshAuthRequestBody;
    const refreshResult = await this.authService.refresh({ refreshToken });

    return response
      .status(200 satisfies RefreshAuthResponseStatus)
      .json(refreshResult satisfies RefreshAuthSuccessResponseBody);
  };

  logout: RequestHandler = async (request, response) => {
    const { sessionId } = request.middlewares.auth.authenticated;
    await this.authService.logout({ sessionId });

    return response.status(204 satisfies LogoutResponseStatus).send();
  };
}

export default AuthController;
