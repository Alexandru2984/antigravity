import { Injectable, NestMiddleware } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { ServerResponse } from 'http';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: ServerResponse, next: () => void) {
    const requestId = (req.headers['x-request-id'] as string) ?? uuidv4();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
