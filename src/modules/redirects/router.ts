import { Router } from 'express';
import { HttpSchemaPath } from 'zimic/http';

import { BlinkSchema } from '@/types/generated';

import RedirectController from './RedirectController';

const redirectRouter = Router();

const redirectController = RedirectController.instance();

export namespace RedirectPath {
  export type NonLiteral = Extract<HttpSchemaPath.NonLiteral<BlinkSchema>, '/:redirectId'>;
}
export type RedirectPath = Extract<HttpSchemaPath.Literal<BlinkSchema>, '/:redirectId'>;

redirectRouter.all('/:redirectId' satisfies RedirectPath, redirectController.all);

export default redirectRouter;
