export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string) {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}
