/**
 * J25 `guest.document_profile_anonymize` (erd 4.4, SEC s3 7.2, T05 – BE-C, R2 Sprint 4): daily, idempotent,
 * in batches – `document` profiles without P05 are anonymised `document_profile_retention_months` after their
 * last check-out (DocumentProfileService.anonymizeDue). Registered by the guests module (api / test-support job
 * runner) and by the worker (plain objects). Required before real guest data (ESC-001 gate).
 */
import type { JobDefinition } from '../../../jobs/job-runner';
import type { AuditService } from '../../audit/public/audit.service';
import type { Clock } from '../../../clock';
import { DocNumberService } from '../../platform/public/doc-number.service';
import type { ParameterService } from '../../platform/public/parameter.service';
import { DocumentProfileService } from './document-profile.service';

export const J25_KEY = 'guest.document_profile_anonymize';

export function documentProfileAnonymizeJob(
  profiles: DocumentProfileService,
  params: ParameterService,
): JobDefinition {
  return {
    key: J25_KEY,
    schedule: { kind: 'daily', at: '03:30', catchUp: 'always' },
    async handler(tx, ctx) {
      const months = await params.get<number>(tx, 'document_profile_retention_months', ctx.date);
      return { ...(await profiles.anonymizeDue(tx, ctx.now, months)) };
    },
  };
}

/** Worker composition (worker.ts: one import line). */
export function guestsWorkerJobs(deps: {
  clock: Clock;
  audit: AuditService;
  parameters: ParameterService;
}): JobDefinition[] {
  const profiles = new DocumentProfileService(
    new DocNumberService(deps.clock, deps.parameters),
    deps.audit,
  );
  return [documentProfileAnonymizeJob(profiles, deps.parameters)];
}
