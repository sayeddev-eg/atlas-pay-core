import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';
import { logger } from '../../core/logger';

let kafka: Kafka;
let producer: Producer;

export async function connectKafka(): Promise<void> {
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'atlas-pay-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    logLevel: logLevel.WARN,
    retry: {
      retries: 1,
    },
  });

  producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30_000,
  });

  await producer.connect();
}

export function getProducer(): Producer {
  if (!producer) throw new Error('Kafka producer not initialized');
  return producer;
}

export function createConsumer(groupId: string): Consumer {
  if (!kafka) throw new Error('Kafka not initialized. Call connectKafka() first.');
  return kafka.consumer({ groupId });
}

export async function publishEvent(topic: string, payload: unknown): Promise<void> {
  if (!producer) {
    logger.warn(`Kafka producer not connected, skipping event on topic: ${topic}`);
    return;
  }
  await getProducer().send({
    topic,
    messages: [{ value: JSON.stringify(payload), timestamp: Date.now().toString() }],
  });
  logger.debug(`Event published to topic: ${topic}`);
}
