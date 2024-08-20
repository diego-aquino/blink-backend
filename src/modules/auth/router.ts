import { Router } from 'express';

import AuthController from './AuthController';

const authRouter = Router();

const authController = AuthController.instance();

authRouter.post('/auth/login', authController.login);

export default authRouter;
