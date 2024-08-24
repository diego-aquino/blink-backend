import { NextFunction, Request, Response } from 'express';

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
