/**
 * payments module (architecture 5.1; SM-12) – BE-B Sprint 2: deposit confirmation of a hold (B4) and the
 * "đã chuyển cọc" notice of SAL/CTV (A53). PaymentService (manual receipts, PT- codes, money audit) is the
 * base for recordPayment / VietQR / reconciliation in Sprint 3.
 */
import { Global, Module } from '@nestjs/common';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { DepositsController } from './internal/deposits.controller';
import { DepositsService } from './internal/deposits.service';
import { PaymentService } from './public/payment.service';

defineAuditEntity('payment', [
  'code',
  'type',
  'method',
  'amountVnd',
  'status',
  'reconciliation',
  'recordedByRole',
]);
defineAuditEntity('deposit_notice', ['amountVnd', 'status']);

@Global()
@Module({
  controllers: [DepositsController],
  providers: [PaymentService, DepositsService],
  exports: [PaymentService],
})
export class PaymentsModule {}
