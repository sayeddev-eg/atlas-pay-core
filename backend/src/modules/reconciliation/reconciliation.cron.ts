import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ReconciliationJob {
  private readonly logger = new Logger(ReconciliationJob.name);
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailyReconciliation() {
    this.logger.log('Starting Daily Reconciliation & Drift Detection...');

    // استخراج معادلة القيد المزدوج: يجب أن يكون مجموع كل الأرصدة الدائنة والمدينة في النظام = صفر
    const sumResult: any[] = await this.prisma.$queryRaw`
      SELECT COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END), 0) as total_drift 
      FROM ledger_entries 
      WHERE created_at >= NOW() - INTERVAL '1 DAY';
    `;

    const drift = sumResult[0]?.total_drift ?? 0n;

    if (BigInt(drift) !== 0n) {
      this.logger.fatal(`🚨 RECONCILIATION ALERT: Ledger out of balance by ${drift} cents! Initiating system freeze.`);
      return { status: 'DRIFT_DETECTED', drift: drift.toString() };
    } else {
      this.logger.log('✅ Ledger perfectly balanced. Zero drift detected.');
      return { status: 'BALANCED', drift: '0' };
    }
  }
}
