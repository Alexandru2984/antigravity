import type { ExecutionContext } from '@nestjs/common';

type GatewayRequest = {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  user?: {
    sub?: string;
  };
};

export const DEFAULT_RATE_LIMIT = {
  ttl: 60_000,
  limit: 300,
};

export const AUTH_RATE_LIMIT = {
  ttl: 60_000,
  limit: 30,
};

export const UPLOAD_RATE_LIMIT = {
  ttl: 60_000,
  limit: 20,
};

export const POLYGLOT_TRANSACTION_RATE_LIMIT = {
  ttl: 60_000,
  limit: 10,
};

export function gatewayRateLimitTracker(req: GatewayRequest): string {
  const userId = req.user?.sub?.trim();
  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${clientIp(req)}`;
}

export function throttlerTracker(req: Record<string, unknown>): string {
  return gatewayRateLimitTracker(req as GatewayRequest);
}

export function gatewayBodyLimitBytes(): number {
  return megabytesToBytes(envInt('GATEWAY_BODY_LIMIT_MB', 10, 1, 50));
}

export function throttlerOptions() {
  return {
    getTracker: (
      req: Record<string, unknown>,
      _context: ExecutionContext,
    ): string => throttlerTracker(req),
    throttlers: [DEFAULT_RATE_LIMIT],
  };
}

function clientIp(req: GatewayRequest): string {
  const forwardedFor = headerValue(req.headers?.['x-forwarded-for']);
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return req.ip?.trim() || 'unknown';
}

function headerValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join(',');
  }

  return value ?? '';
}

function envInt(
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return fallback;
  }

  return parsed;
}

function megabytesToBytes(megabytes: number): number {
  return megabytes * 1024 * 1024;
}
