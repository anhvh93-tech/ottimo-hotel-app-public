import { Inject, Injectable } from '@nestjs/common';
import type { HealthResponse } from '@ottimo/contracts';
import { CLOCK, type Clock, toOffsetIso } from '../clock';
import { DB_PINGER, type DbPinger } from '../db/pinger';

@Injectable()
export class HealthService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(DB_PINGER) private readonly db: DbPinger,
  ) {}

  async check(): Promise<HealthResponse> {
    const dbOk = await this.db.ping();
    return {
      status: dbOk ? 'ok' : 'error',
      db: dbOk ? 'ok' : 'down',
      time: toOffsetIso(this.clock.now()),
    };
  }
}
