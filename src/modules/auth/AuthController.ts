import AuthService from './AuthService';
import { RequestHandler } from '../shared/controllers';
import { BlinkOperations } from '@/types/generated';
import { loginSchema } from './validators';

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

  logout: RequestHandler = async (request, response) => {
    type LogoutStatus = keyof BlinkOperations['auth/logout']['response'];

    const { sessionId } = request.middlewares.authenticated;

    await this.authService.logout({ sessionId });

    return response.status(204 satisfies LogoutStatus).send();
  };
}

export default AuthController;
