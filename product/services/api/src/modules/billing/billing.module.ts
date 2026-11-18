/**
 * billing module (R5 FB-INV-012 – contract `rounds/round-05/fb-inv-012/contract.md`): meter readings and monthly
 * statements of long stays (OpenAPI tag `billing`, 0.3.14-draft). Registers:
 * - BillingController (12 operations, A88 / A121 / A122 / A58);
 * - setParameter hooks of `utility_unit_price`, `utility_vat_rate`, `monthly_statement_rules` (OWN only – setParameter's
 *   own 403 first; out of bounds → 422 PARAM_OUT_OF_RANGE, wrong shape → 422 VALIDATION_FAILED);
 * - the payments module's reversal listener: a reversed statement receipt recomputes `paid_vnd` + status in the same
 *   transaction (contract 5 `recordBillingPeriodPayment`).
 */
import { Inject, Module, type OnModuleInit } from '@nestjs/common';
import type { Tx } from '../../db/database';
import { problem } from '../../shared/problem';
import { PaymentService } from '../payments/public/payment.service';
import { ParameterHooks } from '../platform/public/parameter-hooks';
import { BillingController } from './internal/billing.controller';
import { MeterReadingsService } from './internal/meter-readings.service';
import {
  type ParamIssue,
  STATEMENT_RULES_KEY,
  UTILITY_UNIT_PRICE_KEY,
  UTILITY_VAT_RATE_KEY,
  rulesIssue,
  unitPriceIssue,
  vatRateIssue,
} from './internal/statement-math';
import { StatementsService } from './internal/statements.service';
import './audit-entities';

const HOOKS: ReadonlyArray<[string, (v: unknown) => ParamIssue | null]> = [
  [UTILITY_UNIT_PRICE_KEY, unitPriceIssue],
  [UTILITY_VAT_RATE_KEY, vatRateIssue],
  [STATEMENT_RULES_KEY, rulesIssue],
];

@Module({
  controllers: [BillingController],
  providers: [MeterReadingsService, StatementsService],
})
export class BillingModule implements OnModuleInit {
  constructor(
    @Inject(ParameterHooks) private readonly hooks: ParameterHooks,
    @Inject(PaymentService) private readonly payments: PaymentService,
    @Inject(StatementsService) private readonly statements: StatementsService,
  ) {}

  onModuleInit(): void {
    for (const [key, check] of HOOKS) {
      if (this.hooks.get(key)) continue;
      this.hooks.register(key, {
        before: async (_tx: Tx, value: unknown, roles: readonly string[]) => {
          if (!roles.includes('owner')) return; // setParameter's own 403 comes first
          const issue = check(value);
          if (!issue) return;
          const { extras, ...error } = issue;
          if (issue.code === 'PARAM_OUT_OF_RANGE') {
            throw problem('PARAM_OUT_OF_RANGE', { errors: [error], ...(extras ? { extras } : {}) });
          }
          throw problem('VALIDATION_FAILED', { errors: [error], ...(extras ? { extras } : {}) });
        },
      });
    }
    this.payments.provideBillingPeriodListener((tx, id) => this.statements.refreshPaid(tx, id));
  }
}
