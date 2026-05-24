import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { HealthModule } from './health/health.module';
import { ProxyModule } from './proxy/proxy.module';
import { AuthGuard } from './auth/auth.guard';
import { RedisModule } from './redis/redis.module';
import { StatusController } from './status.controller';
import { ComputeController } from './compute.controller';
import appConfig from './config/app.config';
import { throttlerOptions } from './rate-limit/rate-limit';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env'],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        algorithms: ['RS256'],
        publicKey: process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n'),
      }),
    }),
    ThrottlerModule.forRoot(throttlerOptions()),
    RedisModule,
    HealthModule,
    ProxyModule,
  ],
  controllers: [StatusController, ComputeController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
