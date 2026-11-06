import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validates request body and headers against the given Zod schema.
 * Throws ZodError on failure (handled by the global error handler).
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    });
    next();
  };
}
