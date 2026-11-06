import { Module } from '@nestjs/common';
import { ReconciliationJob } from './reconciliation.cron.js';

@Module({
  providers: [ReconciliationJob],
  exports: [ReconciliationJob],
})
export class ReconciliationModule {}
