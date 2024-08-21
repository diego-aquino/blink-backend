import AuthService from './AuthService';
import { RequestHandler } from '../shared/controllers';
import { BlinkOperations } from '@/types/generated';
import { loginSchema, refreshAuthSchema } from './validators';

class AuthController {
  private static _instance = new AuthController();

  static instance() {
    return this._instance;
  }

  private constructor() {}

  private authService = AuthService.instance();

  login: RequestHandler = async (request, response) => {
    type RequestBody = BlinkOperations['auth/login']['request']['body'];
    type SuccessResponseBody = BlinkOperations['auth/login']['response']['200']['body'];

    const input = loginSchema.parse(request.body) satisfies RequestBody;
    const loginResult = await this.authService.login(input);

    return response.status(200).json(loginResult satisfies SuccessResponseBody);
  };

  refresh: RequestHandler = async (request, response) => {
    type RequestBody = BlinkOperations['auth/refresh']['request']['body'];
    type SuccessResponseBody = BlinkOperations['auth/refresh']['response']['200']['body'];

    const { refreshToken } = refreshAuthSchema.parse(request.body) satisfies RequestBody;
    const refreshResult = await this.authService.refresh({ refreshToken });

    return response.status(200).json(refreshResult satisfies SuccessResponseBody);
  };

  logout: RequestHandler = async (request, response) => {
    type ResponseStatus = keyof BlinkOperations['auth/logout']['response'];

    const { sessionId } = request.middlewares.authenticated;
    await this.authService.logout({ sessionId });

    return response.status(204 satisfies ResponseStatus).send();
  };
}

export default AuthController;
