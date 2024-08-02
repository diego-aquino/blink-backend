import express from 'express';
import path from 'path';
import userRouter from '../modules/users/router';
import deprecatedRouter from '../modules/deprecated/deprecatedRouter';
import handleUncaughtError from '../errors/handler';

const app = express();
app.use(express.json());

const rootDirectory = path.join(__dirname, '..');
const publicDirectory = path.join(rootDirectory, 'public');
app.use(express.static(publicDirectory));

app.use(userRouter);
app.use(deprecatedRouter);

app.use(handleUncaughtError);

export default app;
