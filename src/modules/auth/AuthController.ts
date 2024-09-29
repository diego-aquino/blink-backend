import AuthService from './AuthService';
import { RequestHandler } from '../shared/controllers';
import { loginSchema } from './validators';
import { LoginRequestBody, LoginResponseStatus, LogoutResponseStatus, RefreshAuthResponseStatus } from './types';
import { AuthPath } from './router';
import { readCookie } from '@/utils/cookies';
import { AuthenticationRequiredError, InvalidCredentialsError } from './errors';
import { ACCESS_COOKIE_NAME, AUTH_TOKEN_COOKIE_DEFAULT_OPTIONS, REFRESH_COOKIE_NAME } from './constants';
import AuthMiddleware from './AuthMiddleware';

class AuthController {
  private static _instance = new AuthController();

  static instance() {
    return this._instance;
  }

  private authMiddleware = AuthMiddleware.instance();
  private authService = AuthService.instance();

  private constructor() {}

  login: RequestHandler = async (request, response) => {
    const input = loginSchema.parse(request.body) satisfies LoginRequestBody;

    const { accessToken, refreshToken } = await this.authService.login(input);

    response.cookie(ACCESS_COOKIE_NAME, accessToken.value, {
      ...AUTH_TOKEN_COOKIE_DEFAULT_OPTIONS,
      expires: accessToken.expiresAt,
    });
    response.cookie(REFRESH_COOKIE_NAME, refreshToken.value, {
      ...AUTH_TOKEN_COOKIE_DEFAULT_OPTIONS,
      path: '/auth/refresh' satisfies AuthPath,
      expires: refreshToken.expiresAt,
    });

    return response.status(204 satisfies LoginResponseStatus).send();
  };

  refresh: RequestHandler = async (request, response) => {
    const refreshToken = this.authMiddleware.readRefreshTokenFromCookies(request.cookies);

    if (!refreshToken) {
      throw new InvalidCredentialsError();
    }

    const { accessToken } = await this.authService.refresh({ refreshToken });

    response.cookie(ACCESS_COOKIE_NAME, accessToken.value, {
      ...AUTH_TOKEN_COOKIE_DEFAULT_OPTIONS,
      expires: accessToken.expiresAt,
    });

    return response.status(204 satisfies RefreshAuthResponseStatus).send();
  };

  logout: RequestHandler = async (request, response) => {
    const { sessionId } = request.middlewares.auth.authenticated;

    await this.authService.logout({ sessionId });

    response.clearCookie(ACCESS_COOKIE_NAME);
    response.clearCookie(REFRESH_COOKIE_NAME);

    return response.status(204 satisfies LogoutResponseStatus).send();
  };
}

export default AuthController;
