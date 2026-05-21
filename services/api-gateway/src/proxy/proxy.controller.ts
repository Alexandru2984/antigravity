import {
  All,
  Controller,
  Delete,
  Get,
  Logger,
  Patch,
  Post,
  Put,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '../auth/auth.guard';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as http from 'http';
import * as https from 'https';

const INTERNAL_SERVICE_TOKEN_HEADER = 'x-internal-service-token';

// ── Service route map ──────────────────────────────────────────
const SERVICE_MAP: Record<string, string> = {
  auth: process.env.AUTH_SERVICE_URL ?? 'http://auth-service:4001',
  listings: process.env.LISTING_SERVICE_URL ?? 'http://listing-service:4002',
  search: process.env.SEARCH_SERVICE_URL ?? 'http://search-service:4003',
  images: process.env.IMAGE_SERVICE_URL ?? 'http://image-service:4004',
  notifications:
    process.env.NOTIFICATION_SERVICE_URL ?? 'http://notification-service:4025',
  payments: process.env.PAYMENT_SERVICE_URL ?? 'http://payment-service:4006',
  profiles: process.env.PROFILE_SERVICE_URL ?? 'http://profile-service:4007',
  feed: process.env.FEED_SERVICE_URL ?? 'http://feed-service:4008',
  reviews: process.env.REVIEW_SERVICE_URL ?? 'http://review-service:4009',
  analytics:
    process.env.ANALYTICS_SERVICE_URL ?? 'http://analytics-service:4010',
  chat: process.env.CHAT_SERVICE_URL ?? 'http://chat-service:4011',
  ml: process.env.ML_SERVICE_URL ?? 'http://ml-service:4012',
  config: process.env.CONFIG_SERVICE_URL ?? 'http://config-service:4014',
};

// ── Helper to extract wildcard path from Fastify params ────────
function wildcardPath(req: FastifyRequest): string {
  return (req.params as Record<string, string>)['*'] ?? '';
}

@Controller('api/v1')
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  // ── Auth (public — login/register/refresh) ───────────────────
  @Public()
  @All('auth/*')
  proxyAuth(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'auth', wildcardPath(req));
  }

  // ── Listings ─────────────────────────────────────────────────
  @Public()
  @Get('listings/*')
  proxyListingsRead(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(
      req,
      res,
      'listings',
      'listings/' + wildcardPath(req),
    );
  }

  @Public()
  @Get('listings')
  proxyListingsRootRead(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'listings', 'listings');
  }

  @Post('listings')
  proxyListingsRootCreate(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    return this.proxyRequest(req, res, 'listings', 'listings');
  }

  @Post('listings/*')
  @Put('listings/*')
  @Patch('listings/*')
  @Delete('listings/*')
  proxyListingsWrite(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(
      req,
      res,
      'listings',
      'listings/' + wildcardPath(req),
    );
  }

  // ── Search (public) ──────────────────────────────────────────
  @Public()
  @All('search/*')
  proxySearch(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'search', wildcardPath(req));
  }

  @Public()
  @All('search')
  proxySearchRoot(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'search', '');
  }

  // ── Images ───────────────────────────────────────────────────
  @All('images/*')
  proxyImages(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'images', wildcardPath(req));
  }

  // ── Notifications ────────────────────────────────────────────
  @All('notifications/*')
  proxyNotifications(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'notifications', wildcardPath(req));
  }

  // ── Payments ─────────────────────────────────────────────────
  @All('payments/*')
  proxyPayments(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'payments', wildcardPath(req));
  }

  // ── Profiles ─────────────────────────────────────────────────
  @All('profiles/*')
  proxyProfiles(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'profiles', wildcardPath(req));
  }

  @All('profiles')
  proxyProfilesRoot(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'profiles', '');
  }

  // ── Feed (public) ─────────────────────────────────────────────
  @Public()
  @All('feed/*')
  proxyFeed(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'feed', wildcardPath(req));
  }

  // ── Reviews (public) ─────────────────────────────────────────
  @Public()
  @All('reviews/*')
  proxyReviews(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'reviews', wildcardPath(req));
  }

  // ── Chat ─────────────────────────────────────────────────────
  @All('chat/*')
  proxyChat(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'chat', wildcardPath(req));
  }

  // ── ML ───────────────────────────────────────────────────────
  @All('ml/*')
  proxyMl(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'ml', wildcardPath(req));
  }

  // ── Core proxy logic ─────────────────────────────────────────
  private async proxyRequest(
    req: FastifyRequest,
    res: FastifyReply,
    service: string,
    path: string,
  ): Promise<void> {
    const targetBase = SERVICE_MAP[service];
    if (!targetBase) {
      throw new HttpException(
        `Unknown service: ${service}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const qs = req.url.includes('?')
      ? '?' + req.url.split('?').slice(1).join('?')
      : '';
    const targetUrl = new URL(`/${path}${qs}`, targetBase);

    this.logger.debug(`Proxying ${req.method} ${req.url} → ${targetUrl}`);

    const headers = this.buildProxyHeaders(req, service, targetUrl);

    return new Promise((resolve) => {
      const protocol = targetUrl.protocol === 'https:' ? https : http;
      const options: http.RequestOptions = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers,
      };

      const proxyReq = protocol.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode ?? 200);
        Object.entries(proxyRes.headers).forEach(([key, value]) => {
          if (value !== undefined) res.header(key, value as string);
        });
        proxyRes.pipe(res.raw);
        proxyRes.on('end', resolve);
      });

      proxyReq.on('error', (err) => {
        this.logger.error(`Proxy error for ${service}: ${err.message}`);
        if (!res.sent) {
          res.status(502).send({
            statusCode: 502,
            error: 'Bad Gateway',
            message: `Service ${service} is unavailable`,
          });
        }
        resolve();
      });

      const rawBody = (req as unknown as Record<string, unknown>).rawBody;
      if (rawBody) proxyReq.write(rawBody as Buffer);
      proxyReq.end();
    });
  }

  private buildProxyHeaders(
    req: FastifyRequest,
    service: string,
    targetUrl: URL,
  ): http.OutgoingHttpHeaders {
    const headers: http.OutgoingHttpHeaders = { ...req.headers };
    delete headers[INTERNAL_SERVICE_TOKEN_HEADER];
    delete headers.host;

    headers.host = targetUrl.host;
    headers['x-forwarded-for'] = req.ip ?? '';
    headers['x-request-id'] = (req.headers['x-request-id'] as string) ?? '';

    if (service === 'listings') {
      const token = process.env.INTERNAL_SERVICE_TOKEN;
      if (!token) {
        throw new HttpException(
          'INTERNAL_SERVICE_TOKEN is not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      headers[INTERNAL_SERVICE_TOKEN_HEADER] = token;
    }

    return headers;
  }
}
