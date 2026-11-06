import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class VelocityCheckerService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async checkVelocity(tenantId: string, walletId: string, amount: bigint) {
    const windowKey = `velocity:${tenantId}:${walletId}`;
    const limitCents = 500000n; // الحد الأقصى 5000 دولار في الساعة (500,000 سنت)

    // تسجيل العملية في نافذة زمنية (Sliding Window via Redis)
    const currentTotal = await this.redis.incrby(windowKey, Number(amount));

    // إذا كان هذا أول استعلام، اجعل النافذة تنتهي بعد 3600 ثانية (ساعة)
    if (currentTotal === Number(amount)) {
      await this.redis.expire(windowKey, 3600);
    }

    if (BigInt(currentTotal) > limitCents) {
      // إطلاق تنبيه أمني ورفض العملية لمنع الاحتيال
      throw new ForbiddenException('FRAUD_ALERT: Velocity limit exceeded. Account temporarily frozen.');
    }
  }
}
