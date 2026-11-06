import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Redis } from 'ioredis';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const idempotencyKey =
      request.headers['x-idempotency-key'] ||
      request.body?.idempotencyKey;

    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency key (x-idempotency-key header) is required');
    }

    const tenantId = request.tenantId || request.params?.orgId || 'global';
    const redisKey = `idempotency:${tenantId}:${idempotencyKey}`;

    // 1. Check existing state in Redis
    const cachedRecord = await this.redis.get(redisKey);

    if (cachedRecord) {
      try {
        const parsed = JSON.parse(cachedRecord);
        if (parsed.status === 'PROCESSING') {
          throw new ConflictException('Concurrent request with this idempotency key is currently processing.');
        }
        if (parsed.status === 'COMPLETED') {
          response.status(parsed.statusCode || 200);
          return of(parsed.data);
        }
      } catch (err: any) {
        if (err instanceof ConflictException) throw err;
      }
    }

    // 2. Lock key with PROCESSING status and 120s safety TTL
    await this.redis.set(
      redisKey,
      JSON.stringify({ status: 'PROCESSING', startedAt: new Date().toISOString() }),
      'EX',
      120,
    );

    // 3. Process execution and save result on success
    return next.handle().pipe(
      tap(async (data) => {
        await this.redis.set(
          redisKey,
          JSON.stringify({
            status: 'COMPLETED',
            data,
            statusCode: response.statusCode,
            completedAt: new Date().toISOString(),
          }),
          'EX',
          86400, // 24-hour cache for financial idempotency
        );
      }),
      catchError(async (err) => {
        // Clear lock on unexpected failure to allow retry
        await this.redis.del(redisKey);
        throw err;
      }),
    );
  }
}
