/**
 * guests module (architecture 5.1, EP10): guest profiles, duplicate blocking, shared guest picker.
 * 0.3.7 nhóm D mục A (S4-11, S4-32 – BE-C, BE-B reviews): DocumentProfileService (profiles "from documents",
 * P05 document key, last stay) is exported globally for the registration / front-desk flows; job J25.
 */
import { Global, Inject, Module, type OnModuleInit } from '@nestjs/common';
import { JobRegistry } from '../../jobs/job-runner';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { ParameterService } from '../platform/public/parameter.service';
import { GuestsController } from './internal/guests.controller';
import { GuestsService } from './internal/guests.service';
import { DocumentProfileService } from './public/document-profile.service';
import { documentProfileAnonymizeJob } from './public/worker-jobs';

// Audit allowlists (SR-AUD-03): profile code, changed field NAMES and lookup counts only – no C2 values.
// 0.3.7: `source` of a profile created from a document (never the name or the document).
defineAuditEntity('guest', ['code', 'fields', 'by', 'matches', 'source']);

@Global()
@Module({
  controllers: [GuestsController],
  providers: [GuestsService, DocumentProfileService],
  exports: [DocumentProfileService],
})
export class GuestsModule implements OnModuleInit {
  constructor(
    @Inject(JobRegistry) private readonly jobs: JobRegistry,
    @Inject(DocumentProfileService) private readonly profiles: DocumentProfileService,
    @Inject(ParameterService) private readonly params: ParameterService,
  ) {}

  onModuleInit(): void {
    const job = documentProfileAnonymizeJob(this.profiles, this.params);
    if (!this.jobs.get(job.key)) this.jobs.register(job);
  }
}
