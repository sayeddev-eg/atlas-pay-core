import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReconciliationJob } from './reconciliation.cron.js';

describe('ReconciliationJob (Daily Drift Detection & Audit)', () => {
  let reconciliationJob: ReconciliationJob;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: vi.fn(),
    };
    reconciliationJob = new ReconciliationJob(mockPrisma);
  });

  it('should confirm perfectly balanced ledger when drift is exactly zero', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ total_drift: 0n }]);

    const result = await reconciliationJob.runDailyReconciliation();

    expect(result).toEqual({ status: 'BALANCED', drift: '0' });
  });

  it('should trigger fatal alert when ledger drift is detected', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ total_drift: 1500n }]); // 15 dollars imbalance!

    const result = await reconciliationJob.runDailyReconciliation();

    expect(result).toEqual({ status: 'DRIFT_DETECTED', drift: '1500' });
  });
});
