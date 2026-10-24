/**
 * platform module (architecture 5.1): room catalogue (US-004), rule parameters (US-005). Global exports:
 * PropertyContextService (business "today"), ChannelsService (Sprint 2). RoomsService consumes the
 * ROOM_CAPACITY_CHECK port, provided (global) by ReservationsModule – no stub here (QC-S2-01).
 * ParameterService / DocNumberService stay in CoreModule (BE-A foundation).
 */
import { Global, Module } from '@nestjs/common';
import { ParametersService } from './internal/parameters.service';
import { PlatformController } from './internal/platform.controller';
import { RoomsService } from './internal/rooms.service';
import { ChannelsService } from './public/channels';
import { ParameterHooks } from './public/parameter-hooks';
import { PropertyContextService } from './public/property-context';
import { defineAuditEntity } from '../audit/public/audit-fields';

// Audit allowlists (SR-AUD-03): room catalogue changes (category config).
defineAuditEntity('room', [
  'roomNo',
  'name',
  'roomGroupId',
  'baseOccupancy',
  'maxOccupancy',
  'bedSetup',
  'bedCount',
  'areaM2',
  'isSellable',
  'activeFrom',
  'activeTo',
  'monthlyListPriceVnd',
  'nightlyListPriceVnd',
  'listPrice',
]);
defineAuditEntity('dataset', ['rooms', 'channels']);

@Global()
@Module({
  controllers: [PlatformController],
  providers: [
    PropertyContextService,
    ChannelsService,
    RoomsService,
    ParametersService,
    ParameterHooks,
  ],
  // ParameterHooks (R3 S1 – BE-D): per-key setParameter rules owned by feature modules (US-155 form switch).
  exports: [PropertyContextService, ChannelsService, ParameterHooks],
})
export class PlatformModule {}
