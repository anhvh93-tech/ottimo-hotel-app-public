/**
 * inventory module (BE-B Sprint 3, ARC s3-contract 4.1): goods (`item`) and minibar counts (US-035, BR-701…703).
 * Stock movements, stocktake and average cost are R3 (BR-705). Binds FD_MINIBAR_PORT for the desk's B18.
 * Sprint 4 (BE-D, moved from BE-B – ORC 17/10): minibar catalogue listItems / createItem / updateItem (US-066,
 * US-003 AC2).
 */
import { Global, Module } from '@nestjs/common';
import { ItemsController } from './internal/items.controller';
import { ItemsService } from './internal/items.service';
import { MinibarController } from './internal/minibar.controller';
import { FD_MINIBAR_PORT } from '../frontdesk/public/ports';
import { MINIBAR_REFILL_DONE_PORT } from '../housekeeping/public/minibar-refill-done.port';
import { MinibarService } from './internal/minibar.service';
import { MinibarCheckoutPort } from './public/minibar-checkout.port';
import './audit-entities';

// Global: binds BE-A's FD_MINIBAR_PORT (B18 blocker `minibar_not_checked` + refill task – ARC 4.3) and BE-C's
// MINIBAR_REFILL_DONE_PORT (ARC 16.16 – housekeeping takes it @Optional; MinibarCheckoutPort depends on no
// housekeeping provider, so no cycle).
@Global()
@Module({
  controllers: [MinibarController, ItemsController],
  providers: [
    MinibarService,
    ItemsService,
    MinibarCheckoutPort,
    { provide: FD_MINIBAR_PORT, useExisting: MinibarCheckoutPort },
    { provide: MINIBAR_REFILL_DONE_PORT, useExisting: MinibarCheckoutPort },
  ],
  exports: [FD_MINIBAR_PORT, MINIBAR_REFILL_DONE_PORT],
})
export class InventoryModule {}
