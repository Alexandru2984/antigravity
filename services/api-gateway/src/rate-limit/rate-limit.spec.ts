import { gatewayBodyLimitBytes, gatewayRateLimitTracker } from './rate-limit';

describe('rate limit helpers', () => {
  afterEach(() => {
    delete process.env.GATEWAY_BODY_LIMIT_MB;
  });

  it('tracks authenticated requests by user id', () => {
    expect(
      gatewayRateLimitTracker({
        ip: '203.0.113.10',
        headers: { 'x-forwarded-for': '198.51.100.1' },
        user: { sub: 'user-123' },
      }),
    ).toBe('user:user-123');
  });

  it('tracks anonymous requests by the first forwarded ip', () => {
    expect(
      gatewayRateLimitTracker({
        ip: '203.0.113.10',
        headers: { 'x-forwarded-for': '198.51.100.1, 198.51.100.2' },
      }),
    ).toBe('ip:198.51.100.1');
  });

  it('falls back to the socket ip when forwarded headers are missing', () => {
    expect(gatewayRateLimitTracker({ ip: '203.0.113.10' })).toBe(
      'ip:203.0.113.10',
    );
  });

  it('caps gateway bodies to 10 MB by default', () => {
    expect(gatewayBodyLimitBytes()).toBe(10 * 1024 * 1024);
  });

  it('accepts valid body limit overrides', () => {
    process.env.GATEWAY_BODY_LIMIT_MB = '25';

    expect(gatewayBodyLimitBytes()).toBe(25 * 1024 * 1024);
  });

  it('rejects unsafe body limit overrides', () => {
    process.env.GATEWAY_BODY_LIMIT_MB = '500';

    expect(gatewayBodyLimitBytes()).toBe(10 * 1024 * 1024);
  });
});
