import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) => {
        const redis = new Redis(
          config.get<string>('app.redis.url') ?? 'redis://localhost:6379',
          {
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: false,
          },
        );
        redis.on('error', (err) => console.error('[Redis]', err.message));
        redis.on('connect', () => console.log('[Redis] Connected'));
        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
