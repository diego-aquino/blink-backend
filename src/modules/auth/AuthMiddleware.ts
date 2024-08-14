import { RequestMiddleware } from '../shared/controllers';
import { verifyJWT } from '@/utils/auth';
import { JOSEError } from 'jose/dist/types/util/errors';
import { AuthenticationRequiredError, InvalidCredentialsError } from './errors';
import { AccessTokenPayload } from './types';

class AuthMiddleware {
  private static instance = new AuthMiddleware();

  static singleton() {
    return this.instance;
  }

  private constructor() {}

  authenticated: RequestMiddleware = async (request, _response, next) => {
    const { authorization } = request.headers;

    if (!authorization) {
      throw new AuthenticationRequiredError();
    }

    const authorizationMatch = authorization.match(/^Bearer (?<accessToken>.+)$/);
    const { accessToken } = authorizationMatch?.groups ?? {};

    if (!accessToken) {
      throw new InvalidCredentialsError();
    }

    try {
      const { userId, sessionId } = await verifyJWT<AccessTokenPayload>(accessToken);

      if (!userId || !sessionId) {
        throw new InvalidCredentialsError();
      }

      request.middlewares.authenticated = { userId, sessionId };

      return next();
    } catch (error) {
      if (error instanceof JOSEError) {
        throw new InvalidCredentialsError();
      }
      throw error;
    }
  };
}

export default AuthMiddleware;
