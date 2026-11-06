import { Router, Request, Response, NextFunction } from 'express';
import { transferService } from '../../modules/transfers/transfer.service';
import { authenticate } from '../middlewares/auth.middleware';
import { z } from 'zod';
import { validate } from '../middlewares/validate.middleware';
import { StatusCodes } from 'http-status-codes';

const createTransferSchema = z.object({
  body: z.object({
    fromWalletId: z.string().uuid('Invalid fromWalletId'),
    toWalletId: z.string().uuid('Invalid toWalletId'),
    amount: z.number().positive('Amount must be positive').max(1_000_000),
    currency: z.enum(['EGP', 'USD', 'EUR', 'GBP']).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  headers: z.object({
    'idempotency-key': z.string().min(1).max(255).optional(),
  }).passthrough(),
});

export const transferRouter = Router();

transferRouter.use(authenticate);

// POST /api/v1/transfers
transferRouter.post(
  '/',
  validate(createTransferSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
      const transfer = await transferService.createTransfer({
        ...req.body,
        idempotencyKey,
      });
      res.status(StatusCodes.CREATED).json(transfer);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/transfers/:id
transferRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transfer = await transferService.getTransferById(req.params.id);
      res.json(transfer);
    } catch (err) {
      next(err);
    }
  },
);
