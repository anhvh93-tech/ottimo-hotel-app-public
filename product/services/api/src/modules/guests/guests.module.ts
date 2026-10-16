/** guests module (architecture 5.1, EP10): guest profiles, duplicate blocking, shared guest picker. */
import { Module } from '@nestjs/common';
import { GuestsController } from './internal/guests.controller';
import { GuestsService } from './internal/guests.service';
import { defineAuditEntity } from '../audit/public/audit-fields';

// Audit allowlists (SR-AUD-03): profile code, changed field NAMES and lookup counts only – no C2 values.
defineAuditEntity('guest', ['code', 'fields', 'by', 'matches']);

@Module({
  controllers: [GuestsController],
  providers: [GuestsService],
})
export class GuestsModule {}
