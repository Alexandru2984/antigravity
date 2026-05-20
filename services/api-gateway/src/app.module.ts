import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import { HealthModule } from './health/health.module';
import { ProxyModule } from './proxy/proxy.module';
import { AuthGuard } from './auth/auth.guard';
import { RedisModule } from './redis/redis.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    // ── Config ───────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env'],
    }),

    // ── JWT (public key only — validation, no signing) ────────
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        // RS256: we only verify here, auth-service signs
        algorithms: ['RS256'],
        publicKey: process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n'),
      }),
    }),

    // ── Redis ─────────────────────────────────────────────────
    RedisModule,

    // ── Feature Modules ───────────────────────────────────────
    HealthModule,
    ProxyModule,
  ],

  providers: [
    // ── Global JWT Guard ──────────────────────────────────────
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
