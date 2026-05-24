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
const USER_CONTEXT_HEADERS = ['x-user-id', 'x-user-email', 'x-user-roles'];
const INTERNAL_TOKEN_SERVICES = new Set([
  'listings',
  'images',
  'payments',
  'feed',
  'reviews',
]);

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
  @Public()
  @Get('images/*')
  proxyImagesRead(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'images', 'images/' + wildcardPath(req));
  }

  @Post('images/upload')
  proxyImagesUpload(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'images', 'images/upload');
  }

  // ── Notifications ────────────────────────────────────────────
  @All('notifications/*')
  proxyNotifications(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'notifications', wildcardPath(req));
  }

  // ── Payments ─────────────────────────────────────────────────
  @Public()
  @Post('payments/webhook')
  proxyPaymentsWebhook(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'payments', 'payments/webhook');
  }

  @All('payments/*')
  proxyPayments(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(
      req,
      res,
      'payments',
      'payments/' + wildcardPath(req),
    );
  }

  // ── Profiles ─────────────────────────────────────────────────
  @All('profiles/*')
  proxyProfiles(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(
      req,
      res,
      'profiles',
      'profiles/' + wildcardPath(req),
    );
  }

  @All('profiles')
  proxyProfilesRoot(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'profiles', 'profiles');
  }

  @All('me/profile')
  proxyMyProfile(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'profiles', 'me/profile');
  }

  // ── Feed ─────────────────────────────────────────────────────
  @Public()
  @Get('feed')
  proxyFeedRootRead(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'feed', 'feed/');
  }

  @Public()
  @Get('feed/*')
  proxyFeedRead(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'feed', 'feed/' + wildcardPath(req));
  }

  @Post('feed/*')
  @Delete('feed/*')
  proxyFeedWrite(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'feed', 'feed/' + wildcardPath(req));
  }

  // ── Reviews ──────────────────────────────────────────────────
  @Public()
  @Get('reviews')
  proxyReviewsRootRead(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'reviews', 'api/reviews');
  }

  @Public()
  @Get('reviews/*')
  proxyReviewsRead(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(
      req,
      res,
      'reviews',
      'api/reviews/' + wildcardPath(req),
    );
  }

  @Post('reviews')
  proxyReviewsRootCreate(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res, 'reviews', 'api/reviews');
  }

  @Put('reviews/*')
  @Patch('reviews/*')
  @Delete('reviews/*')
  proxyReviewsWrite(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(
      req,
      res,
      'reviews',
      'api/reviews/' + wildcardPath(req),
    );
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
      if (rawBody) {
        proxyReq.write(rawBody as Buffer);
        proxyReq.end();
        return;
      }

      if (this.hasRequestBody(req)) {
        req.raw.pipe(proxyReq);
        return;
      }

      proxyReq.end();
    });
  }

  private hasRequestBody(req: FastifyRequest): boolean {
    return !['GET', 'HEAD'].includes(req.method.toUpperCase());
  }

  private buildProxyHeaders(
    req: FastifyRequest,
    service: string,
    targetUrl: URL,
  ): http.OutgoingHttpHeaders {
    const headers: http.OutgoingHttpHeaders = { ...req.headers };
    this.deleteHeader(headers, INTERNAL_SERVICE_TOKEN_HEADER);
    USER_CONTEXT_HEADERS.forEach((header) =>
      this.deleteHeader(headers, header),
    );
    this.deleteHeader(headers, 'host');

    headers.host = targetUrl.host;
    headers['x-forwarded-for'] = req.ip ?? '';
    headers['x-request-id'] = (req.headers['x-request-id'] as string) ?? '';

    const user = (
      req as FastifyRequest & {
        user?: { sub?: string; email?: string; roles?: string[] };
      }
    ).user;
    if (user?.sub) {
      headers['x-user-id'] = user.sub;
      if (user.email) {
        headers['x-user-email'] = user.email;
      }
      if (Array.isArray(user.roles)) {
        headers['x-user-roles'] = user.roles.join(',');
      }
    }

    if (INTERNAL_TOKEN_SERVICES.has(service)) {
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

  private deleteHeader(
    headers: http.OutgoingHttpHeaders,
    header: string,
  ): void {
    Object.keys(headers).forEach((key) => {
      if (key.toLowerCase() === header) {
        delete headers[key];
      }
    });
  }
}
