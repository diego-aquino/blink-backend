import { Router } from 'express';

import UserController from './UserController';
import AuthMiddleware from '../auth/AuthMiddleware';
import UserMiddleware from './UserMiddleware';
import { HttpSchemaPath } from 'zimic/http';
import { BlinkSchema } from '@/types/generated';

const userRouter = Router();

const userController = UserController.instance();

const authMiddleware = AuthMiddleware.instance();
const userMiddleware = UserMiddleware.instance();

type UserPath = Extract<HttpSchemaPath.Literal<BlinkSchema>, `/users${string}`>;

userRouter.post('/users' satisfies UserPath, userController.create);

userRouter.get(
  '/users/:userId' satisfies UserPath,
  authMiddleware.authenticated,
  userMiddleware.ownUser,
  userController.get,
);

userRouter.patch(
  '/users/:userId' satisfies UserPath,
  authMiddleware.authenticated,
  userMiddleware.ownUser,
  userController.update,
);

userRouter.delete(
  '/users/:userId' satisfies UserPath,
  authMiddleware.authenticated,
  userMiddleware.ownUser,
  userController.update,
);

export default userRouter;
