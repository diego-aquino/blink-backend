import { Router } from 'express';
import UserController from './UserController';

const userRouter = Router();

const userController = new UserController();
userRouter.post('/users', userController.create);
userRouter.get('/users/:userId', userController.get);
userRouter.patch('/users/:userId', userController.update);

export default userRouter;
