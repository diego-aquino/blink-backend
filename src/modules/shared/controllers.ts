import { Request, Response } from 'express';

export type RequestHandler = (request: Request, response: Response) => Promise<Response>;
