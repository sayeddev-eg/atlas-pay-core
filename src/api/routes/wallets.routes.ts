import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { query } from '../../infrastructure/database/connection';
import { StatusCodes } from 'http-status-codes';

export const walletRouter = Router();

walletRouter.use(authenticate);

// POST /api/v1/wallets
walletRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const { currency = 'EGP' } = req.body;

      const [wallet] = await query(
        `INSERT INTO wallets (user_id, currency)
         VALUES ($1, $2)
         RETURNING *`,
        [userId, currency],
      );
      res.status(StatusCodes.CREATED).json(wallet);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/wallets/my
walletRouter.get(
  '/my',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const wallets = await query(
        'SELECT * FROM wallets WHERE user_id = $1 ORDER BY created_at ASC',
        [userId],
      );
      res.json(wallets);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/wallets/:id/ledger
walletRouter.get(
  '/:id/ledger',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entries = await query(
        `SELECT * FROM ledger_entries
         WHERE wallet_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [req.params.id],
      );
      res.json(entries);
    } catch (err) {
      next(err);
    }
  },
);
