import filesystem from 'fs';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { absolutePath as swaggerAbsolutePath } from 'swagger-ui-dist';

import authRouter from '@/modules/auth/router';
import { prepareMiddlewares } from '@/modules/shared/middlewares';
import workspaceRouter from '@/modules/workspaces/router';
import userRouter from '@/modules/users/router';
import handleUncaughtError from '@/errors/handler';
import workspaceMemberRouter from '@/modules/workspaces/members/router';
import blinkRouter from '@/modules/workspaces/blinks/router';
import redirectRouter from '@/modules/redirects/router';

async function setSwaggerConfigURL(swaggerDirectory: string, newConfigURL: string) {
  const initializerPath = path.join(swaggerDirectory, 'swagger-initializer.js');

  const initialInitializer = await filesystem.promises.readFile(initializerPath, 'utf-8');
  const updatedInitializer = initialInitializer.replace(/url: .+,/, `url: \`${newConfigURL}\`,`);

  await filesystem.promises.writeFile(initializerPath, updatedInitializer);
}

async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cors({ origin: '*' }));

  const rootDirectory = path.join(__dirname, '..', '..');

  const openapiDirectory = path.join(rootDirectory, 'docs', 'spec');
  app.use(express.static(openapiDirectory));

  const swaggerDirectory = swaggerAbsolutePath();
  await setSwaggerConfigURL(swaggerDirectory, '${window.location.origin}/openapi.yaml');
  app.use(express.static(swaggerDirectory));

  app.use(prepareMiddlewares);

  app.use(authRouter);
  app.use(userRouter);
  app.use(workspaceRouter);
  app.use(workspaceMemberRouter);
  app.use(blinkRouter);
  app.use(redirectRouter);

  app.use(handleUncaughtError);

  return app;
}

export default createApp;
