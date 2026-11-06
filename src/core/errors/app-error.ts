import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Predefined Errors ───────────────────────────────────────────────────────

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, StatusCodes.NOT_FOUND, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, StatusCodes.FORBIDDEN, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, StatusCodes.CONFLICT, 'CONFLICT');
  }
}

export class InsufficientFundsError extends AppError {
  constructor() {
    super('Insufficient funds in wallet', StatusCodes.UNPROCESSABLE_ENTITY, 'INSUFFICIENT_FUNDS');
  }
}

export class WalletLockedError extends AppError {
  constructor(walletId: string) {
    super(`Wallet ${walletId} is locked by another transaction`, StatusCodes.CONFLICT, 'WALLET_LOCKED');
  }
}

export class IdempotencyConflictError extends AppError {
  constructor(key: string) {
    super(`Request with idempotency key '${key}' is already being processed`, StatusCodes.CONFLICT, 'IDEMPOTENCY_CONFLICT');
  }
}

export class FraudDetectedError extends AppError {
  constructor(reason: string) {
    super(`Transaction blocked: ${reason}`, StatusCodes.FORBIDDEN, 'FRAUD_DETECTED');
  }
}
