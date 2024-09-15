import { ConflictError, InternalServerError, NotFoundError } from '@/errors/http';
import { Blink } from '@prisma/client';

export class BlinkNotFoundError extends NotFoundError {
  constructor(blinkId: Blink['id']) {
    super(`Blink '${blinkId}' not found.`);
  }
}

export class BlinkByRedirectNotFoundError extends NotFoundError {
  constructor(redirectId: Blink['redirectId']) {
    super(`Blink with redirect '${redirectId}' not found.`);
  }
}

export class BlinkRedirectConflictError extends ConflictError {
  constructor(redirectId: Blink['redirectId']) {
    super(`Blink redirect '${redirectId}' already exists.`);
  }
}

export class BlinkRedirectGenerationError extends InternalServerError {
  constructor() {
    super('Could not generate a unique blink redirect.');
  }
}
