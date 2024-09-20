import { Router } from 'express';
import { HttpMethod, HttpSchemaPath } from 'zimic/http';

import { BlinkSchema } from '@/types/generated';

import RedirectController from './RedirectController';

const redirectRouter = Router();

const redirectController = RedirectController.instance();

export namespace RedirectPath {
  export type NonLiteral = Extract<HttpSchemaPath.NonLiteral<BlinkSchema>, `/${string}`>;
}
export type RedirectPath = Extract<HttpSchemaPath.Literal<BlinkSchema>, '/:redirectId'>;

export const REDIRECT_HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] satisfies HttpMethod[];

for (const method of REDIRECT_HTTP_METHODS) {
  const lowerCaseMethod = method.toLowerCase() as Lowercase<HttpMethod>;
  redirectRouter[lowerCaseMethod]('/:redirectId' satisfies RedirectPath, redirectController.all);
}

export default redirectRouter;
