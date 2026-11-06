import { Module } from '@nestjs/common';
import { PaymentSagaCoordinator } from './payment-saga.service.js';
import { ExternalPaymentProvider } from '../providers/external-payment.provider.js';
import { LedgerModule } from '../ledger/ledger.module.js';

@Module({
  imports: [LedgerModule],
  providers: [PaymentSagaCoordinator, ExternalPaymentProvider],
  exports: [PaymentSagaCoordinator],
})
export class OrchestrationModule {}
