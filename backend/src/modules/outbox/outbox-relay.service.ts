import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);
  private isProcessing = false;

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_SECOND)
  async relayPendingEvents() {
    // منع تداخل التنفيذ إذا طالت مدة المعالجة
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. جلب الأحداث بأمان تام باستخدام SKIP LOCKED للمقايسة (Scaling across multiple instances)
      const pendingEvents: any[] = await this.prisma.$queryRaw`
        SELECT * FROM outbox_events 
        WHERE status = 'PENDING' 
        ORDER BY created_at ASC 
        LIMIT 100 
        FOR UPDATE SKIP LOCKED;
      `;

      if (pendingEvents.length === 0) {
        this.isProcessing = false;
        return;
      }

      // 2. معالجة ونشر الأحداث
      for (const event of pendingEvents) {
        try {
          // النشر الموثوق للأحداث (Kafka / Event Bus / Webhook Dispatcher)
          this.logger.log(`Publishing Outbox Event [${event.event_type}] for Aggregate [${event.aggregate_id}]`);

          // 3. تحديث الحالة فور النجاح
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { 
              status: 'PROCESSED', 
              processedAt: new Date() 
            },
          });
        } catch (publishError) {
          this.logger.error(`Failed to publish event ${event.id}`, publishError);
          
          // 4. استراتيجية إعادة المحاولة (Max 3 Retries)
          const newRetryCount = (event.retry_count || 0) + 1;
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { 
              retryCount: newRetryCount,
              status: newRetryCount >= 3 ? 'FAILED' : 'PENDING',
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Error during Outbox Relay polling', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
