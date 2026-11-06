import { Module } from '@nestjs/common';
import { TransfersController } from './transfers.controller.js';
import { LedgerModule } from '../ledger/ledger.module.js';

@Module({
  imports: [LedgerModule],
  controllers: [TransfersController],
})
export class TransfersModule {}
