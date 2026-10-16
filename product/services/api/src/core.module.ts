/**
 * Shared foundation providers (BE-A module 1): Clock, Database (RLS transactions), audit writer,
 * parameters, document numbers, auth guard (global, default deny), UnitOfWork, job runner,
 * problem+json filter. Global so feature modules (and the test-support module) can inject them.
 */
import { type DynamicModule, Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { CLOCK, type Clock } from './clock';
import { DATABASE, type Database } from './db/database';
import { BUILTIN_JOBS } from './jobs/builtin-jobs';
import { JobRegistry, JobRunner } from './jobs/job-runner';
import { AuditService } from './modules/audit/public/audit.service';
import { DocNumberService } from './modules/platform/public/doc-number.service';
import { ParameterService } from './modules/platform/public/parameter.service';
import { AUTH_OPTIONS, AuthGuard, type AuthOptions } from './shared/http/auth.guard';
import { UnitOfWork } from './shared/http/unit-of-work';
import { ProblemFilter } from './shared/problem';

export interface CoreDeps {
  clock: Clock;
  database: Database;
  auth: AuthOptions;
}

@Global()
@Module({})
export class CoreModule {
  static register(deps: CoreDeps): DynamicModule {
    const exported = [
      CLOCK,
      DATABASE,
      AUTH_OPTIONS,
      AuditService,
      ParameterService,
      DocNumberService,
      AuthGuard,
      UnitOfWork,
      JobRegistry,
      JobRunner,
    ];
    return {
      module: CoreModule,
      providers: [
        { provide: CLOCK, useValue: deps.clock },
        { provide: DATABASE, useValue: deps.database },
        { provide: AUTH_OPTIONS, useValue: deps.auth },
        AuditService,
        ParameterService,
        DocNumberService,
        AuthGuard,
        UnitOfWork,
        {
          provide: JobRegistry,
          useFactory: () => {
            const registry = new JobRegistry();
            for (const job of BUILTIN_JOBS) registry.register(job);
            return registry;
          },
        },
        JobRunner,
        { provide: APP_GUARD, useExisting: AuthGuard },
        { provide: APP_FILTER, useFactory: () => ProblemFilter.create() },
      ],
      exports: exported,
    };
  }
}
