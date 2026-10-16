import { Controller, Get, Inject, Res } from '@nestjs/common';
import type { HealthResponse } from '@ottimo/contracts';
import { PublicRoute } from '../shared/http/operation';
import { HealthService } from './health.service';

interface StatusReply {
  status(code: number): unknown;
}

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  /**
   * Liveness + DB readiness (operation getHealth). 200 when DB answers, 503 otherwise.
   * Deliberate exception to problem+json: plain JSON for monitors (OpenAPI getHealth).
   */
  @Get('health')
  @PublicRoute()
  async get(@Res({ passthrough: true }) reply: StatusReply): Promise<HealthResponse> {
    const result = await this.health.check();
    if (result.status !== 'ok') reply.status(503);
    return result;
  }
}
