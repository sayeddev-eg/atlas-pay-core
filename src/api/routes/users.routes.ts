import { Router, Request, Response, NextFunction } from 'express';
import { userService } from '../../modules/users/user.service';
import { createUserSchema, loginSchema } from '../../modules/users/user.schema';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { StatusCodes } from 'http-status-codes';

export const userRouter = Router();

// POST /api/v1/users/register
userRouter.post(
  '/register',
  validate(createUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await userService.register(req.body);
      res.status(StatusCodes.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/users/login
userRouter.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await userService.login(req.body.email, req.body.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/users/me
userRouter.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.findById((req as any).userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
);
