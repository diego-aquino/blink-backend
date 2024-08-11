import filesystem from 'fs';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { absolutePath as swaggerAbsolutePath } from 'swagger-ui-dist';

import userRouter from '../modules/users/router';
import deprecatedRouter from '../modules/deprecated/router';
import handleUncaughtError from '../errors/handler';

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

  app.use(userRouter);
  app.use(deprecatedRouter);

  app.use(handleUncaughtError);

  return app;
}

export default createApp;
