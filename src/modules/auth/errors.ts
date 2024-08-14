import { ForbiddenError, UnauthorizedError } from '@/errors/http';

export class AuthenticationRequiredError extends UnauthorizedError {
  constructor() {
    super('Authentication is required to access this resource.');
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Authentication credentials are not valid.');
  }
}

export class AccessNotAllowedError extends ForbiddenError {
  constructor(resource: string) {
    super(`User has no access to resource '${resource}'.`);
  }
}
