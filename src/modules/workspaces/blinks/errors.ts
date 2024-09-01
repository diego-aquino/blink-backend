import { InternalServerError, NotFoundError } from '@/errors/http';
import { Blink } from '@prisma/client';

export class BlinkNotFoundError extends NotFoundError {
  constructor(memberId: Blink['id']) {
    super(`Workspace member '${memberId}' not found.`);
  }
}

export class BlinkRedirectIdGenerationError extends InternalServerError {
  constructor() {
    super('Could not generate a unique blink redirect identifier.');
  }
}
