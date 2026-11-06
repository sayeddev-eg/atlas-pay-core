import { Injectable, Logger } from '@nestjs/common';

export interface ChargeResult {
  referenceId: string;
  status: 'SUCCESS' | 'DECLINED';
  timestamp: string;
}

@Injectable()
export class ExternalPaymentProvider {
  private readonly logger = new Logger(ExternalPaymentProvider.name);

  /**
   * محاكاة استدعاء بوابة دفع خارجية (Stripe / Bank Gateway) دون حجز اتصال قاعدة البيانات
   */
  async chargeCard(userId: string, amount: bigint): Promise<ChargeResult> {
    this.logger.log(`Charging external card for user ${userId}, amount: ${amount} cents`);

    // محاكاة تأخير الشبكة الخارجي
    await new Promise((resolve) => setTimeout(resolve, 50));

    // افتراض نجاح العملية في بيئة Sandbox
    const referenceId = `ext_ref_${Math.random().toString(36).substring(2, 12)}`;

    return {
      referenceId,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    };
  }
}
