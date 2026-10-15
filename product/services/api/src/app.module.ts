import { type DynamicModule, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { CLOCK, type Clock } from './clock';
import { DB_PINGER, type DbPinger } from './db';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';

export interface AppDeps {
  clock: Clock;
  db: DbPinger;
}

@Module({})
export class AppModule implements OnApplicationShutdown {
  constructor(@Inject(DB_PINGER) private readonly db: DbPinger) {}

  static register(deps: AppDeps): DynamicModule {
    return {
      module: AppModule,
      controllers: [HealthController],
      providers: [
        { provide: CLOCK, useValue: deps.clock },
        { provide: DB_PINGER, useValue: deps.db },
        HealthService,
      ],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.db.close();
  }
}
