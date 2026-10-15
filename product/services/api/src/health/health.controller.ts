import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import type { HealthResponse } from '@ottimo/contracts';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  /** Liveness + DB readiness. 200 when DB answers, 503 otherwise (used by Docker healthcheck and uptime monitor). */
  @Get('health')
  async get(): Promise<HealthResponse> {
    const result = await this.health.check();
    if (result.status !== 'ok') {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
