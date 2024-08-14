import { Router } from 'express';

import AuthController from './AuthController';

const authRouter = Router();

const authController = AuthController.singleton();
authRouter.post('/auth/login', authController.login);

export default authRouter;
