import { ConflictError, NotFoundError } from '@/errors/http';
import { User } from '@prisma/client';

export class EmailAlreadyInUseError extends ConflictError {
  constructor(email: User['email']) {
    super(`Email '${email}' is already in use.`);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(userId: User['id']) {
    super(`User '${userId}' not found.`);
  }
}
