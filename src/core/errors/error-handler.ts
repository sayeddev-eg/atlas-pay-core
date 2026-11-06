import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app-error';
import { logger } from '../logger';
import { StatusCodes } from 'http-status-codes';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req as any).requestId;

  // ─── Zod Validation Errors ───────────────────────────────────
  if (err instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      requestId,
    });
    return;
  }

  // ─── Known Operational Errors ─────────────────────────────────
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`[${err.code}] ${err.message}`, { requestId, statusCode: err.statusCode });
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      requestId,
    });
    return;
  }

  // ─── Unknown / Programming Errors ─────────────────────────────
  logger.error('Unexpected error occurred', { error: err, requestId, stack: err.stack });
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    requestId,
  });
}
