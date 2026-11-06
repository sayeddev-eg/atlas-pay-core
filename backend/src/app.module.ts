import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
import { TransfersModule } from './modules/transfers/transfers.module.js';
import { LedgerModule } from './modules/ledger/ledger.module.js';
import { OutboxModule } from './modules/outbox/outbox.module.js';
import { OrchestrationModule } from './modules/orchestration/orchestration.module.js';
import { FraudModule } from './modules/fraud/fraud.module.js';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    OrganizationsModule,
    TransfersModule,
    LedgerModule,
    OutboxModule,
    OrchestrationModule,
    FraudModule,
    ReconciliationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
