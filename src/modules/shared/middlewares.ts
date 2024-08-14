import { RequestMiddleware } from './controllers';

export const prepareMiddlewares: RequestMiddleware = async (request, _response, next) => {
  if (!request.middlewares) {
    request.middlewares = {} as typeof request.middlewares;
  }

  return next();
};
