import { ProxyController, SERVICE_MAP } from './proxy.controller';
import type { FastifyRequest } from 'fastify';
import { IS_PUBLIC_KEY } from '../auth/auth.guard';
import { AUTH_RATE_LIMIT, UPLOAD_RATE_LIMIT } from '../rate-limit/rate-limit';

const THROTTLER_LIMIT_DEFAULT = 'THROTTLER:LIMITdefault';
const THROTTLER_TTL_DEFAULT = 'THROTTLER:TTLdefault';

describe('ProxyController', () => {
  let controller: ProxyController;

  beforeEach(() => {
    controller = new ProxyController();
    process.env.INTERNAL_SERVICE_TOKEN = 'internal-test-token';
  });

  afterEach(() => {
    delete process.env.INTERNAL_SERVICE_TOKEN;
  });

  function buildHeaders(req: Partial<FastifyRequest>, service = 'search') {
    return (
      controller as unknown as {
        buildProxyHeaders: (
          req: Partial<FastifyRequest>,
          service: string,
          targetUrl: URL,
        ) => Record<string, unknown>;
      }
    ).buildProxyHeaders(
      {
        headers: {},
        ip: '203.0.113.10',
        ...req,
      },
      service,
      new URL('http://internal-service:4000'),
    );
  }

  function publicMetadata(methodName: keyof ProxyController) {
    return Reflect.getMetadata(
      IS_PUBLIC_KEY,
      ProxyController.prototype[methodName],
    );
  }

  function throttleMetadata(methodName: keyof ProxyController) {
    const method = ProxyController.prototype[methodName];
    return {
      limit: Reflect.getMetadata(THROTTLER_LIMIT_DEFAULT, method),
      ttl: Reflect.getMetadata(THROTTLER_TTL_DEFAULT, method),
    };
  }

  it('strips client-supplied user and internal headers', () => {
    const headers = buildHeaders({
      headers: {
        host: 'polyglot.micutu.com',
        'x-user-id': 'attacker',
        'x-user-email': 'attacker@example.test',
        'x-user-roles': 'admin',
        'x-internal-service-token': 'forged',
        'x-request-id': 'request-1',
      },
    });

    expect(headers['x-user-id']).toBeUndefined();
    expect(headers['x-user-email']).toBeUndefined();
    expect(headers['x-user-roles']).toBeUndefined();
    expect(headers['x-internal-service-token']).toBeUndefined();
    expect(headers.host).toBe('internal-service:4000');
    expect(headers['x-request-id']).toBe('request-1');
  });

  it('forwards only verified user context and listing internal token', () => {
    const headers = buildHeaders(
      {
        headers: {
          'x-user-id': 'attacker',
          'x-user-roles': 'admin',
        },
        user: {
          sub: 'user-123',
          email: 'user@example.test',
          roles: ['seller'],
        },
      } as Partial<FastifyRequest> & {
        user: { sub: string; email: string; roles: string[] };
      },
      'listings',
    );

    expect(headers['x-user-id']).toBe('user-123');
    expect(headers['x-user-email']).toBe('user@example.test');
    expect(headers['x-user-roles']).toBe('seller');
    expect(headers['x-internal-service-token']).toBe('internal-test-token');
  });

  it('adds the internal token for image service requests', () => {
    const headers = buildHeaders(
      {
        headers: {
          'x-internal-service-token': 'forged',
        },
      },
      'images',
    );

    expect(headers['x-internal-service-token']).toBe('internal-test-token');
  });

  it('adds the internal token for review service requests', () => {
    const headers = buildHeaders(
      {
        headers: {
          'x-internal-service-token': 'forged',
        },
      },
      'reviews',
    );

    expect(headers['x-internal-service-token']).toBe('internal-test-token');
  });

  it('adds the internal token for feed service requests', () => {
    const headers = buildHeaders(
      {
        headers: {
          'x-internal-service-token': 'forged',
        },
      },
      'feed',
    );

    expect(headers['x-internal-service-token']).toBe('internal-test-token');
  });

  it('adds the internal token for payment service requests', () => {
    const headers = buildHeaders(
      {
        headers: {
          'x-internal-service-token': 'forged',
        },
      },
      'payments',
    );

    expect(headers['x-internal-service-token']).toBe('internal-test-token');
  });

  it('keeps image reads public but requires auth for uploads', () => {
    expect(publicMetadata('proxyImagesRead')).toBe(true);
    expect(publicMetadata('proxyImagesUpload')).toBeUndefined();
  });

  it('rate limits public auth and image upload routes', () => {
    expect(throttleMetadata('proxyAuth')).toEqual(AUTH_RATE_LIMIT);
    expect(throttleMetadata('proxyImagesUpload')).toEqual(UPLOAD_RATE_LIMIT);
  });

  it('keeps proxy service defaults aligned with compose ports', () => {
    expect(SERVICE_MAP.notifications).toBe('http://notification-service:4005');
    expect(SERVICE_MAP.config).toBe('http://config-service:4014');
  });

  it('keeps review reads public but requires auth for writes', () => {
    expect(publicMetadata('proxyReviewsRootRead')).toBe(true);
    expect(publicMetadata('proxyReviewsRead')).toBe(true);
    expect(publicMetadata('proxyReviewsRootCreate')).toBeUndefined();
    expect(publicMetadata('proxyReviewsWrite')).toBeUndefined();
  });

  it('keeps feed reads public but requires auth for follow writes', () => {
    expect(publicMetadata('proxyFeedRootRead')).toBe(true);
    expect(publicMetadata('proxyFeedRead')).toBe(true);
    expect(publicMetadata('proxyFeedWrite')).toBeUndefined();
  });

  it('keeps Stripe payment webhook public but requires auth for other payment routes', () => {
    expect(publicMetadata('proxyPaymentsWebhook')).toBe(true);
    expect(publicMetadata('proxyPayments')).toBeUndefined();
  });

  it('requires auth for profile routes', () => {
    expect(publicMetadata('proxyProfiles')).toBeUndefined();
    expect(publicMetadata('proxyProfilesRoot')).toBeUndefined();
    expect(publicMetadata('proxyMyProfile')).toBeUndefined();
  });

  it('proxies image routes to the image-service path prefix', async () => {
    const proxyRequest = jest
      .spyOn(
        controller as unknown as {
          proxyRequest: jest.MockedFunction<
            (
              req: FastifyRequest,
              res: unknown,
              service: string,
              path: string,
            ) => Promise<void>
          >;
        },
        'proxyRequest',
      )
      .mockResolvedValue(undefined);

    const res = {};
    const readReq = {
      params: { '*': 'abc.webp' },
    } as unknown as FastifyRequest;
    const uploadReq = {
      params: { '*': 'upload' },
    } as unknown as FastifyRequest;

    await controller.proxyImagesRead(readReq, res as never);
    await controller.proxyImagesUpload(uploadReq, res as never);

    expect(proxyRequest).toHaveBeenNthCalledWith(
      1,
      readReq,
      res,
      'images',
      'images/abc.webp',
    );
    expect(proxyRequest).toHaveBeenNthCalledWith(
      2,
      uploadReq,
      res,
      'images',
      'images/upload',
    );
  });

  it('proxies review routes to the Laravel API path prefix', async () => {
    const proxyRequest = jest
      .spyOn(
        controller as unknown as {
          proxyRequest: jest.MockedFunction<
            (
              req: FastifyRequest,
              res: unknown,
              service: string,
              path: string,
            ) => Promise<void>
          >;
        },
        'proxyRequest',
      )
      .mockResolvedValue(undefined);

    const res = {};
    const rootReq = {} as unknown as FastifyRequest;
    const listingReq = {
      params: { '*': 'listing/listing-123' },
    } as unknown as FastifyRequest;
    const writeReq = {
      params: { '*': 'review-123' },
    } as unknown as FastifyRequest;

    await controller.proxyReviewsRootRead(rootReq, res as never);
    await controller.proxyReviewsRead(listingReq, res as never);
    await controller.proxyReviewsRootCreate(rootReq, res as never);
    await controller.proxyReviewsWrite(writeReq, res as never);

    expect(proxyRequest).toHaveBeenNthCalledWith(
      1,
      rootReq,
      res,
      'reviews',
      'api/reviews',
    );
    expect(proxyRequest).toHaveBeenNthCalledWith(
      2,
      listingReq,
      res,
      'reviews',
      'api/reviews/listing/listing-123',
    );
    expect(proxyRequest).toHaveBeenNthCalledWith(
      3,
      rootReq,
      res,
      'reviews',
      'api/reviews',
    );
    expect(proxyRequest).toHaveBeenNthCalledWith(
      4,
      writeReq,
      res,
      'reviews',
      'api/reviews/review-123',
    );
  });

  it('proxies feed routes to the feed-service path prefix', async () => {
    const proxyRequest = jest
      .spyOn(
        controller as unknown as {
          proxyRequest: jest.MockedFunction<
            (
              req: FastifyRequest,
              res: unknown,
              service: string,
              path: string,
            ) => Promise<void>
          >;
        },
        'proxyRequest',
      )
      .mockResolvedValue(undefined);

    const res = {};
    const rootReq = {} as unknown as FastifyRequest;
    const readReq = {
      params: { '*': 'followed' },
    } as unknown as FastifyRequest;
    const writeReq = {
      params: { '*': 'follow/seller-123' },
    } as unknown as FastifyRequest;

    await controller.proxyFeedRootRead(rootReq, res as never);
    await controller.proxyFeedRead(readReq, res as never);
    await controller.proxyFeedWrite(writeReq, res as never);

    expect(proxyRequest).toHaveBeenNthCalledWith(
      1,
      rootReq,
      res,
      'feed',
      'feed/',
    );
    expect(proxyRequest).toHaveBeenNthCalledWith(
      2,
      readReq,
      res,
      'feed',
      'feed/followed',
    );
    expect(proxyRequest).toHaveBeenNthCalledWith(
      3,
      writeReq,
      res,
      'feed',
      'feed/follow/seller-123',
    );
  });

  it('proxies payment routes to the payment-service path prefix', async () => {
    const proxyRequest = jest
      .spyOn(
        controller as unknown as {
          proxyRequest: jest.MockedFunction<
            (
              req: FastifyRequest,
              res: unknown,
              service: string,
              path: string,
            ) => Promise<void>
          >;
        },
        'proxyRequest',
      )
      .mockResolvedValue(undefined);

    const res = {};
    const webhookReq = {} as unknown as FastifyRequest;
    const intentReq = {
      params: { '*': 'intent' },
    } as unknown as FastifyRequest;

    await controller.proxyPaymentsWebhook(webhookReq, res as never);
    await controller.proxyPayments(intentReq, res as never);

    expect(proxyRequest).toHaveBeenNthCalledWith(
      1,
      webhookReq,
      res,
      'payments',
      'payments/webhook',
    );
    expect(proxyRequest).toHaveBeenNthCalledWith(
      2,
      intentReq,
      res,
      'payments',
      'payments/intent',
    );
  });

  it('proxies profile routes to the profile-service path prefix', async () => {
    const proxyRequest = jest
      .spyOn(
        controller as unknown as {
          proxyRequest: jest.MockedFunction<
            (
              req: FastifyRequest,
              res: unknown,
              service: string,
              path: string,
            ) => Promise<void>
          >;
        },
        'proxyRequest',
      )
      .mockResolvedValue(undefined);

    const res = {};
    const rootReq = {} as unknown as FastifyRequest;
    const userReq = {
      params: { '*': '550e8400-e29b-41d4-a716-446655440000' },
    } as unknown as FastifyRequest;
    const meReq = {} as unknown as FastifyRequest;

    await controller.proxyProfilesRoot(rootReq, res as never);
    await controller.proxyProfiles(userReq, res as never);
    await controller.proxyMyProfile(meReq, res as never);

    expect(proxyRequest).toHaveBeenNthCalledWith(
      1,
      rootReq,
      res,
      'profiles',
      'profiles',
    );
    expect(proxyRequest).toHaveBeenNthCalledWith(
      2,
      userReq,
      res,
      'profiles',
      'profiles/550e8400-e29b-41d4-a716-446655440000',
    );
    expect(proxyRequest).toHaveBeenNthCalledWith(
      3,
      meReq,
      res,
      'profiles',
      'me/profile',
    );
  });
});
