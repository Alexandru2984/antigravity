import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/auth.guard';

@Controller()
export class HealthController {

  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'api-gateway', ts: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  ready() {
    // Could check Redis connection here
    return { status: 'ready', service: 'api-gateway' };
  }

  @Public()
  @Get('metrics')
  metrics() {
    // Prometheus metrics would go here via prom-client
    return '# PolyMarket API Gateway\n# TYPE up gauge\nup 1\n';
  }
}
