import { Router } from 'express';
import UserController from './UserController';

const userRouter = Router();

const userController = new UserController();
userRouter.post('/users', userController.create);

export default userRouter;
