import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { gatewayBodyLimitBytes } from './rate-limit/rate-limit';

function getCorsOrigins(): string[] {
  const configured = process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL;

  if (!configured) {
    return ['http://localhost:3000'];
  }

  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: gatewayBodyLimitBytes(),
      logger: false,
    }),
    // Capture the raw request body so proxyRequest can forward it upstream.
    // Without this, Fastify consumes the parsed body and piping req.raw hangs.
    { rawBody: true },
  );

  // Fastify has no built-in parser for binary/multipart bodies, so file uploads
  // (multipart/form-data) and other binary content would be rejected with 415.
  // The gateway only proxies these through to upstream services, so buffer the
  // raw bytes verbatim and let proxyRequest forward them with the original headers.
  const fastify = app.getHttpAdapter().getInstance() as unknown as {
    addContentTypeParser: (
      ct: RegExp,
      opts: { parseAs: 'buffer'; bodyLimit: number },
      handler: (req: unknown, body: Buffer, done: (e: Error | null, b: Buffer) => void) => void,
    ) => void;
  };
  fastify.addContentTypeParser(
    /^multipart\/form-data|^application\/octet-stream|^image\//,
    { parseAs: 'buffer', bodyLimit: gatewayBodyLimitBytes() },
    (_req, body, done) => done(null, body),
  );

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    credentials: true,
    maxAge: 600,
  });
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  await app.listen(port, '0.0.0.0');
}
bootstrap().catch((err) => {
  console.error('Failed to start NestJS API Gateway:', err);
});
