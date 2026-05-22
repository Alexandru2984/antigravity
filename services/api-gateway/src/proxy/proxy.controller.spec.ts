import { ProxyController } from './proxy.controller';
import type { FastifyRequest } from 'fastify';
import { IS_PUBLIC_KEY } from '../auth/auth.guard';

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

  it('keeps image reads public but requires auth for uploads', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, controller.proxyImagesRead)).toBe(
      true,
    );
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, controller.proxyImagesUpload),
    ).toBeUndefined();
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
        'proxyRequest'
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
});
