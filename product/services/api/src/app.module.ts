import { type DynamicModule, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { CLOCK, type Clock } from './clock';
import { CoreModule } from './core.module';
import type { Database } from './db/database';
import { DB_PINGER, type DbPinger } from './db/pinger';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import type { AuthOptions } from './shared/http/auth.guard';

export interface AppDeps {
  clock: Clock;
  db: DbPinger;
  /** RLS-aware database + auth options. Absent only in the DB-less health unit test. */
  database?: Database;
  auth?: AuthOptions;
  /** Extra modules (feature modules; the test-support module when INCLUDE_TEST_SUPPORT=1). */
  imports?: DynamicModule[];
}

@Module({})
export class AppModule implements OnApplicationShutdown {
  constructor(@Inject(DB_PINGER) private readonly db: DbPinger) {}

  static register(deps: AppDeps): DynamicModule {
    const core = deps.database
      ? [
          CoreModule.register({
            clock: deps.clock,
            database: deps.database,
            auth: deps.auth ?? { cookieSecurePrefix: true },
          }),
        ]
      : [];
    return {
      module: AppModule,
      imports: [...core, ...(deps.imports ?? [])],
      controllers: [HealthController],
      providers: [
        ...(deps.database ? [] : [{ provide: CLOCK, useValue: deps.clock }]),
        { provide: DB_PINGER, useValue: deps.db },
        HealthService,
      ],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.db.close();
  }
}
