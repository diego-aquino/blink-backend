import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { BadRequestError, HttpError, InternalServerError } from './http';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

function handleError(error: unknown, _request: Request, response: Response, next: NextFunction) {
  if (error instanceof ZodError) {
    const httpError = new BadRequestError('Validation failed');

    return response.status(400).json({
      message: httpError.message,
      code: httpError.code,
      issues: error.issues,
    });
  }

  if (error instanceof HttpError) {
    if (error instanceof InternalServerError) {
      console.error(error);
    }

    return response.status(error.status).json({
      message: error.message,
      code: error.code,
    });
  }

  console.error(error);

  if (
    error instanceof PrismaClientKnownRequestError ||
    error instanceof PrismaClientUnknownRequestError ||
    error instanceof PrismaClientInitializationError ||
    error instanceof PrismaClientValidationError ||
    error instanceof PrismaClientRustPanicError
  ) {
    return response.status(500).json({
      message: 'Database error',
    });
  }

  if (error instanceof Error) {
    return response.status(500).json({
      message: error.message,
    });
  } else {
    return response.status(500).json({
      message: 'Unknown error',
    });
  }
}

export default handleError;
