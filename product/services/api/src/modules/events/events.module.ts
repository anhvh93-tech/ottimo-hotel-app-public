/**
 * events module (BE-A Sprint 3, ARC s3-contract 4.1/4.3): SSE hub (streamEvents), staff inbox
 * (listMyNotifications, StaffNotification kinds A-36), "Cần chú ý" (listAttentionItems, B-21).
 * Global export EventsService: every module publishes `{type, id}` events, notifications and attention items
 * in its own business transaction.
 */
import { Global, Module } from '@nestjs/common';
import { AttentionService } from './internal/attention.service';
import { EventsController } from './internal/events.controller';
import { SseHub } from './internal/sse-hub';
import { EventsService } from './public/events.service';

@Global()
@Module({
  controllers: [EventsController],
  providers: [EventsService, SseHub, AttentionService],
  exports: [EventsService],
})
export class EventsModule {}
