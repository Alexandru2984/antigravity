import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { AuthGuard, JwtPayload } from './auth.guard';

describe('AuthGuard', () => {
  const payload: JwtPayload = {
    sub: '550e8400-e29b-41d4-a716-446655440000',
    email: 'seller@example.test',
    roles: ['seller'],
    iat: 1,
    exp: 2,
  };

  function buildGuard(
    overrides: {
      isPublic?: boolean;
      verifyAsync?: jest.Mock;
    } = {},
  ) {
    const jwtService = {
      verifyAsync:
        overrides.verifyAsync ?? jest.fn().mockResolvedValue(payload),
    } as unknown as JwtService;
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(overrides.isPublic ?? false),
    } as unknown as Reflector;

    return new AuthGuard(jwtService, reflector);
  }

  function buildContext(req: Partial<FastifyRequest>): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;
  }

  it('stores verified identity on request.user without mutating headers', async () => {
    const guard = buildGuard();
    const req: Partial<FastifyRequest> & {
      headers: Record<string, string>;
      user?: JwtPayload;
    } = {
      headers: {
        authorization: 'Bearer valid-token',
        'x-user-id': 'attacker',
        'x-user-email': 'attacker@example.test',
        'x-user-roles': 'admin',
      },
    };

    await expect(guard.canActivate(buildContext(req))).resolves.toBe(true);

    expect(req.user).toEqual(payload);
    expect(req.headers['x-user-id']).toBe('attacker');
    expect(req.headers['x-user-email']).toBe('attacker@example.test');
    expect(req.headers['x-user-roles']).toBe('admin');
  });

  it('rejects missing bearer tokens', async () => {
    const guard = buildGuard();
    const req = { headers: {} } as Partial<FastifyRequest>;

    await expect(guard.canActivate(buildContext(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
