import { Router } from 'express';

import UserController from './UserController';
import AuthMiddleware from '../auth/AuthMiddleware';

const userRouter = Router();

const userController = UserController.singleton();
const authMiddleware = AuthMiddleware.singleton();

userRouter.post('/users', userController.create);
userRouter.get('/users/:userId', authMiddleware.authenticated, userController.get);
userRouter.patch('/users/:userId', authMiddleware.authenticated, userController.update);

export default userRouter;
