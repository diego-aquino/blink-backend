import { Request, Response } from 'express';
import UseCaseController from '../shared/UseCaseController';
import CreateUserService, { createUserSchema } from './CreateUserService';

class CreateUserController extends UseCaseController {
  private createUser = new CreateUserService();

  handle = async (request: Request, response: Response) => {
    const createInput = createUserSchema.parse(request.body);
    const user = await this.createUser.run(createInput);
    return response.status(201).json(user);
  };
}

export default CreateUserController;
