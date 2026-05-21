import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';

export const IS_PUBLIC_KEY = 'isPublic';
/** Mark a route as public (no JWT required) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface JwtPayload {
  sub: string; // user UUID
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Health + public routes bypass JWT check
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        algorithms: ['RS256'],
      });

      // Inject user context into request — downstream services receive these headers
      (request as any).user = payload;
      request.headers['x-user-id'] = payload.sub;
      request.headers['x-user-email'] = payload.email;
      request.headers['x-user-roles'] = payload.roles.join(',');

      return true;
    } catch (err) {
      this.logger.warn(`JWT verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: FastifyRequest): string | null {
    const [type, token] = (request.headers.authorization ?? '').split(' ');
    return type === 'Bearer' ? token : null;
  }
}
