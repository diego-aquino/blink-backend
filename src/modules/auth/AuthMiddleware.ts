import { JOSEError } from 'jose/errors';

import { verifyJWT } from '@/utils/auth';

import { RequestMiddleware } from '../shared/controllers';
import { AuthenticationRequiredError, InvalidCredentialsError } from './errors';
import { AccessTokenPayload } from './types';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from './constants';

class AuthMiddleware {
  private static _instance = new AuthMiddleware();

  static instance() {
    return this._instance;
  }

  private constructor() {}

  authenticated: RequestMiddleware = async (request, _response, next) => {
    const accessToken = this.readAccessTokenFromCookies(request.cookies);

    if (!accessToken) {
      throw new AuthenticationRequiredError();
    }

    try {
      const { userId, sessionId } = await verifyJWT<AccessTokenPayload>(accessToken);

      if (!userId || !sessionId) {
        throw new InvalidCredentialsError();
      }

      request.middlewares.auth.authenticated = { userId, sessionId };

      return next();
    } catch (error) {
      if (error instanceof JOSEError) {
        throw new InvalidCredentialsError();
      }
      throw error;
    }
  };

  readAccessTokenFromCookies(cookies: Record<string, string | undefined>) {
    const accessToken = cookies[ACCESS_COOKIE_NAME];
    return accessToken;
  }

  readRefreshTokenFromCookies(cookies: Record<string, string | undefined>) {
    const refreshToken = cookies[REFRESH_COOKIE_NAME];
    return refreshToken;
  }
}

export default AuthMiddleware;
