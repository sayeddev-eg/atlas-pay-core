import { Module } from '@nestjs/common';
import { VelocityCheckerService } from './velocity-checker.service.js';

@Module({
  providers: [VelocityCheckerService],
  exports: [VelocityCheckerService],
})
export class FraudModule {}
