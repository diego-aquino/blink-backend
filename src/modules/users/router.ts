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

export namespace UserPath {
  export type NonLiteral = Extract<HttpSchemaPath.NonLiteral<BlinkSchema>, `/users${string}`>;
}
export type UserPath = Extract<HttpSchemaPath.Literal<BlinkSchema>, `/users${string}`>;

userRouter.post('/users' satisfies UserPath, userController.create);

userRouter.get('/users/me' satisfies UserPath, authMiddleware.authenticated, userController.getMe);

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
  userController.delete,
);

export default userRouter;
