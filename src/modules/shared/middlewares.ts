import { RequestMiddleware } from './controllers';

export const prepareMiddlewares: RequestMiddleware = async (request, _response, next) => {
  request.middlewares = {
    auth: { authenticated: {} },
    workspaceMember: { typeAtLeast: {} },
  } as typeof request.middlewares;

  return next();
};
