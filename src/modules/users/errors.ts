import { ConflictError } from '@/errors/http';

export class EmailAlreadyInUseError extends ConflictError {
  constructor(email: string) {
    super(`Email '${email}' is already in use.`);
  }
}
