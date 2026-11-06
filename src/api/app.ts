import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { userRouter } from './routes/users.routes';
import { walletRouter } from './routes/wallets.routes';
import { transferRouter } from './routes/transfers.routes';
import { errorHandler } from '../core/errors/error-handler';
import { requestLogger } from '../core/logger/request-logger.middleware';

const app = express();

// ─── Security Middleware ────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// ─── Rate Limiting ──────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  }),
);

// ─── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging ────────────────────────────────────────
app.use(requestLogger);

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'atlas-pay', timestamp: new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────────────
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/users`, userRouter);
app.use(`${API_PREFIX}/wallets`, walletRouter);
app.use(`${API_PREFIX}/transfers`, transferRouter);

// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

export default app;
