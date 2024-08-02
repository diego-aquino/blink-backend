import { Router } from 'express';
import CreateUserController from './CreateUserController';

const userRouter = Router();

const controllers = {
  createUser: new CreateUserController(),
};

userRouter.post('/users', controllers.createUser.handle);

export default userRouter;
