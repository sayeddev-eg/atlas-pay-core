import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VelocityCheckerService } from './velocity-checker.service.js';
import { ForbiddenException } from '@nestjs/common';

describe('VelocityCheckerService (Anti-Fraud Sliding Window)', () => {
  let velocityChecker: VelocityCheckerService;
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      incrby: vi.fn(),
      expire: vi.fn(),
    };
    velocityChecker = new VelocityCheckerService(mockRedis);
  });

  const tenantId = 'org-uuid-1';
  const walletId = 'wallet-uuid-1';

  it('should allow transaction within velocity limit and set TTL on first hit', async () => {
    const amount = 5000n; // $50.00
    mockRedis.incrby.mockResolvedValue(5000);
    mockRedis.expire.mockResolvedValue(1);

    await expect(velocityChecker.checkVelocity(tenantId, walletId, amount)).resolves.not.toThrow();

    expect(mockRedis.incrby).toHaveBeenCalledWith(`velocity:${tenantId}:${walletId}`, 5000);
    expect(mockRedis.expire).toHaveBeenCalledWith(`velocity:${tenantId}:${walletId}`, 3600);
  });

  it('should throw ForbiddenException when hourly limit (5,000 USD) is exceeded', async () => {
    const amount = 100000n; // $1,000.00
    mockRedis.incrby.mockResolvedValue(600000); // 6,000.00 USD total

    await expect(velocityChecker.checkVelocity(tenantId, walletId, amount)).rejects.toThrow(ForbiddenException);
    await expect(velocityChecker.checkVelocity(tenantId, walletId, amount)).rejects.toThrow(
      'FRAUD_ALERT: Velocity limit exceeded. Account temporarily frozen.',
    );
  });
});
