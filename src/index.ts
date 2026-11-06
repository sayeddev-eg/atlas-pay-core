import 'dotenv/config';
import app from './api/app';
import { logger } from './core/logger';
import { connectDatabase } from './infrastructure/database/connection';
import { connectRedis } from './infrastructure/redis/client';
import { connectKafka } from './infrastructure/kafka/client';

const PORT = process.env.PORT || 3000;

async function bootstrap(): Promise<void> {
  try {
    logger.info('🚀 Starting Atlas Pay Engine...');

    await connectDatabase();
    logger.info('✅ PostgreSQL connected');

    await connectRedis();
    logger.info('✅ Redis connected');

    try {
      await connectKafka();
      logger.info('✅ Kafka connected');
    } catch (kafkaError) {
      logger.warn('⚠️ Kafka not reachable, continuing in degraded mode without real-time streaming');
    }

    app.listen(PORT, () => {
      logger.info(`✅ Atlas Pay API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (error) {
    logger.error('❌ Failed to start Atlas Pay', { error });
    process.exit(1);
  }
}

bootstrap();
