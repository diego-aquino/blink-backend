import { Router } from 'express';

import AuthController from './AuthController';
import { BlinkSchema } from '@/types/generated';
import { HttpSchemaPath } from 'zimic/http';
import AuthMiddleware from './AuthMiddleware';

const authRouter = Router();

const authController = AuthController.instance();
const authMiddleware = AuthMiddleware.instance();

type AuthPath = Extract<HttpSchemaPath.Literal<BlinkSchema>, `/auth${string}`>;

authRouter.post('/auth/login' satisfies AuthPath, authController.login);
authRouter.post('/auth/refresh' satisfies AuthPath, authController.refresh);
authRouter.post('/auth/logout' satisfies AuthPath, authMiddleware.authenticated, authController.logout);

export default authRouter;
