/**
 * platform module (architecture 5.1): room catalogue (US-004), rule parameters (US-005). Global exports:
 * PropertyContextService (business "today"), ROOM_CAPACITY_CHECK port (reservations overrides it).
 * ParameterService / DocNumberService stay in CoreModule (BE-A foundation).
 */
import { Global, Module } from '@nestjs/common';
import { ParametersService } from './internal/parameters.service';
import { PlatformController } from './internal/platform.controller';
import { RoomsService } from './internal/rooms.service';
import { PropertyContextService } from './public/property-context';
import { NO_BOOKINGS_YET, ROOM_CAPACITY_CHECK } from './public/room-capacity';
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
defineAuditEntity('dataset', ['rooms']);

@Global()
@Module({
  controllers: [PlatformController],
  providers: [
    PropertyContextService,
    RoomsService,
    ParametersService,
    { provide: ROOM_CAPACITY_CHECK, useValue: NO_BOOKINGS_YET },
  ],
  exports: [PropertyContextService, ROOM_CAPACITY_CHECK],
})
export class PlatformModule {}
