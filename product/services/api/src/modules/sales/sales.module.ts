/**
 * sales module (architecture 5.1; EP11 R2 – BE-B Sprint 2): short-stay quotes (SM-08), holds from quotes
 * (B1 via the reservations port), leads (SM-09 minimal), commission list (US-087 AC2).
 * Global: LeadsService is called by payments (B4 → won) and reservations (B5/B6 → quoted).
 */
import { Global, Module } from '@nestjs/common';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { CommissionsService } from './internal/commissions.service';
import { QuotePricingService } from './internal/quote-pricing';
import { QuotesController } from './internal/quotes.controller';
import { QuotesService } from './internal/quotes.service';
import { LeadsService } from './public/leads.service';

defineAuditEntity('quote', ['status', 'totalVnd', 'depositVnd', 'nights', 'reservationCode']);
defineAuditEntity('lead', ['status', 'source', 'lostReasonCode']);

@Global()
@Module({
  controllers: [QuotesController],
  providers: [QuotePricingService, QuotesService, LeadsService, CommissionsService],
  exports: [LeadsService],
})
export class SalesModule {}
