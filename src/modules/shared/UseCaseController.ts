import { Request, Response } from 'express';

abstract class UseCaseController {
  abstract handle: (request: Request, response: Response) => Promise<Response> | Response;
}

export default UseCaseController;
