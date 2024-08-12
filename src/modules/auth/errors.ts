import { ForbiddenError, UnauthorizedError } from '@/errors/http';

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Credentials are not valid.');
  }
}

export class AccessNotAllowedError extends ForbiddenError {
  constructor(resource: string) {
    super(`User has no access to resource '${resource}'.`);
  }
}
