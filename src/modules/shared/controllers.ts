import { Request, Response } from 'express';
import {
  HttpServiceSchema,
  LiteralHttpServiceSchemaPath,
  PathParamsSchemaFromPath as OriginalPathParamsSchemaFromPath,
} from 'zimic/http';

export type RequestHandler = (request: Request, response: Response) => Promise<Response>;

export type PathParamsSchemaFromPath<
  Schema extends HttpServiceSchema,
  Path extends LiteralHttpServiceSchemaPath<Schema>,
> = OriginalPathParamsSchemaFromPath<Path>;
