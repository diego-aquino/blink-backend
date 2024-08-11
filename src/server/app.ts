import filesystem from 'fs';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { absolutePath as swaggerAbsolutePath } from 'swagger-ui-dist';

import userRouter from '../modules/users/router';
import deprecatedRouter from '../modules/deprecated/router';
import handleUncaughtError from '../errors/handler';

async function replaceSwaggerConfigURL(swaggerDirectory: string) {
  const swaggerInitializerPath = path.join(swaggerDirectory, 'swagger-initializer.js');

  const initialInitializerContent = await filesystem.promises.readFile(swaggerInitializerPath, 'utf-8');
  const updatedInitializerContent = initialInitializerContent.replace(
    /url: .+,/,
    'url: `${window.location.origin}/openapi.yaml`,',
  );

  await filesystem.promises.writeFile(swaggerInitializerPath, updatedInitializerContent);
}

async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cors({ origin: '*' }));

  const rootDirectory = path.join(__dirname, '..', '..');

  const openapiDirectory = path.join(rootDirectory, 'docs', 'spec');
  app.use(express.static(openapiDirectory));

  const publicDirectory = path.join(rootDirectory, 'public');
  app.use(express.static(publicDirectory));

  const swaggerDirectory = swaggerAbsolutePath();
  await replaceSwaggerConfigURL(swaggerDirectory);
  app.use('/swagger', express.static(swaggerDirectory));

  app.use(userRouter);
  app.use(deprecatedRouter);

  app.use(handleUncaughtError);

  return app;
}

export default createApp;
