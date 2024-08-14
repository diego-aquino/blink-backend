import { NextFunction, Request, Response } from 'express';
import {
  HttpServiceSchema,
  LiteralHttpServiceSchemaPath,
  PathParamsSchemaFromPath as OriginalPathParamsSchemaFromPath,
} from 'zimic/http';

export type RequestHandler = (request: Request, response: Response) => Promise<Response> | Response;

export type RequestMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<Response | void> | Response | void;

export type RequestErrorHandler = (
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<Response | void> | Response | void;

export type PathParamsSchemaFromPath<
  Schema extends HttpServiceSchema,
  Path extends LiteralHttpServiceSchemaPath<Schema>,
> = OriginalPathParamsSchemaFromPath<Path>;
