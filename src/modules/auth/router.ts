import { Router } from 'express';
import AuthController from './AuthController';

const authRouter = Router();

const authController = new AuthController();
authRouter.post('/auth/login', authController.login);

export default authRouter;
