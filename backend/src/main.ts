import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(helmet());
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Prefix for Enterprise API Routing
  app.setGlobalPrefix('api/v1');

  // Input Validation & Serialization Protection
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Graceful Shutdown for Container Orchestration (K8s / Docker)
  app.enableShutdownHooks();

  // OpenAPI / Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('ATLAS PAY - Core Banking & Payment Engine')
    .setDescription(
      'Enterprise FinTech API for multi-tenant treasury, double-entry ledger, SAGA orchestration, and automated financial reconciliation.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token with organization & role claims',
      },
      'bearer-jwt',
    )
    .addTag('Authentication', 'Tenant user onboarding and JWT token lifecycle')
    .addTag('Transfers', 'Idempotent double-entry transfers and maker-checker flows')
    .addTag('Wallets', 'Minor-unit wallet balances and balance audits')
    .addTag('Ledger', 'Immutable journal entries and balance assertions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'ATLAS PAY API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 ATLAS PAY Core Engine live at: http://localhost:${port}/api/v1`);
  console.log(`📘 OpenAPI Swagger Documentation: http://localhost:${port}/docs`);
}
await bootstrap();
