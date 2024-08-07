import UserService, { createUserPayloadSchema } from './UserService';
import { RequestHandler } from '../shared/controllers';

class UserController {
  private userService = new UserService();

  create: RequestHandler = async (request, response) => {
    const payload = createUserPayloadSchema.parse(request.body);
    const user = await this.userService.create(payload);
    return response.status(201).json(user);
  };
}

export default UserController;
