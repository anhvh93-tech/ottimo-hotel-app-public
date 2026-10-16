/**
 * inventory module (BE-B Sprint 3, ARC s3-contract 4.1): goods (`item`) and minibar counts (US-035, BR-701…703).
 * Stock movements, stocktake and average cost are R3 (BR-705). Binds FD_MINIBAR_PORT for the desk's B18.
 */
import { Global, Module } from '@nestjs/common';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { MinibarController } from './internal/minibar.controller';
import { FD_MINIBAR_PORT } from '../frontdesk/public/ports';
import { MinibarService } from './internal/minibar.service';
import { MinibarCheckoutPort } from './public/minibar-checkout.port';

// DS-E seed report (db/seed/ds-e.ts): goods loaded into `item`.
defineAuditEntity('dataset', ['items']);

// Global: binds BE-A's FD_MINIBAR_PORT (B18 blocker `minibar_not_checked` + refill task – ARC 4.3).
@Global()
@Module({
  controllers: [MinibarController],
  providers: [
    MinibarService,
    MinibarCheckoutPort,
    { provide: FD_MINIBAR_PORT, useExisting: MinibarCheckoutPort },
  ],
  exports: [FD_MINIBAR_PORT],
})
export class InventoryModule {}
