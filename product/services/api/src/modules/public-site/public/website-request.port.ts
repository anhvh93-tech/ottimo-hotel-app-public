/**
 * WebsiteRequestPort (erd 4.14 "cổng `WebsiteRequestPort` cho `sales`"; OpenAPI saveQuote / createHoldFromQuote /
 * createReservation `websiteBookingRequestId`; SM-18 WR1 (SYS) and WR6; SEC ARC-19) – BE-D, R3 Sprint 1.
 * Called INSIDE the caller's transaction, after its own locks (16.19: booking/quote first, the request last).
 *
 * - attachQuote()   saveQuote with a request: scope as the Desk list (SAL: unassigned or own; CTV: none → 404);
 *                   `new` → `in_progress` assigned to the caller (WR1 by the system), `in_progress` kept;
 *                   `declined`/`spam`/`converted` → 409 INVALID_TRANSITION; `quote_id` = this quote.
 * - markConverted() createHoldFromQuote / createReservation: returns the request's `subSource` (the booking's
 *                   `directSubSource`); WR6 only when the caller is FD+ or holds the request and it is still
 *                   `new`/`in_progress` – C2 NULLed in the same transaction (data now lives in the guest profile);
 *                   otherwise the request is unchanged and its holder gets `website_request_linked_hold`.
 * No C2 ever leaves through this port.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { EventsService, FD_PLUS } from '../../events/public/events.service';
import { PII_NULLS, WebsiteRequestsService } from '../internal/website-requests.service';

export const WEBSITE_REQUEST_PORT = Symbol('WEBSITE_REQUEST_PORT');

export interface PortActor {
  userId: string;
  roles: readonly string[];
}

export interface WebsiteRequestLink {
  requestId: string;
  refCode: string;
  subSource: string | null;
  status: string;
}

export interface WebsiteRequestPortContract {
  attachQuote(
    tx: Tx,
    input: { requestId: string; quoteId: string; actor: PortActor; now: Date },
  ): Promise<WebsiteRequestLink>;
  markConverted(
    tx: Tx,
    input: { requestId: string; reservationId: string; actor: PortActor; now: Date },
  ): Promise<WebsiteRequestLink & { converted: boolean }>;
  /** Code, status and sub-source of a request (no scope – the caller already holds the linked quote). */
  linkInfo(tx: Tx, requestId: string): Promise<WebsiteRequestLink | null>;
}

const desk = (roles: readonly string[]) =>
  roles.some((r) => (FD_PLUS as readonly string[]).includes(r));

@Injectable()
export class WebsiteRequestPort implements WebsiteRequestPortContract {
  constructor(
    @Inject(WebsiteRequestsService) private readonly requests: WebsiteRequestsService,
    @Inject(EventsService) private readonly events: EventsService,
  ) {}

  private async scoped(tx: Tx, requestId: string, actor: PortActor) {
    const r = await this.requests.rowById(tx, requestId, true);
    if (!r) throw problem('NOT_FOUND');
    if (!desk(actor.roles)) {
      const sal = actor.roles.includes('sales_staff');
      const inScope =
        sal && ((r.status === 'new' && !r.assigned_user_id) || r.assigned_user_id === actor.userId);
      if (!inScope) throw problem('NOT_FOUND');
    }
    return r;
  }

  async linkInfo(tx: Tx, requestId: string): Promise<WebsiteRequestLink | null> {
    const r = await this.requests.rowById(tx, requestId);
    return r
      ? { requestId: r.id, refCode: r.ref_code, subSource: r.sub_source, status: r.status }
      : null;
  }

  async attachQuote(
    tx: Tx,
    input: { requestId: string; quoteId: string; actor: PortActor; now: Date },
  ): Promise<WebsiteRequestLink> {
    const r = await this.scoped(tx, input.requestId, input.actor);
    if (r.status !== 'new' && r.status !== 'in_progress') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: r.status } });
    }
    const claim = r.status === 'new';
    await tx.query(
      `UPDATE website_booking_request
          SET quote_id = $2, last_activity_at = $3, updated_at = $3, version = version + 1,
              status = 'in_progress', assigned_user_id = COALESCE(assigned_user_id, $4),
              claimed_at = COALESCE(claimed_at, $3)
        WHERE id = $1`,
      [r.id, input.quoteId, input.now, input.actor.userId],
    );
    if (claim) {
      await this.requests.history(
        tx,
        r.id,
        'new',
        'in_progress',
        'claim_website_request',
        input.now,
        'system',
        input.actor.userId,
      );
    }
    const after = await this.requests.rowById(tx, r.id);
    if (after) await this.requests.publish(tx, r, after);
    return { requestId: r.id, refCode: r.ref_code, subSource: r.sub_source, status: 'in_progress' };
  }

  async markConverted(
    tx: Tx,
    input: { requestId: string; reservationId: string; actor: PortActor; now: Date },
  ): Promise<WebsiteRequestLink & { converted: boolean }> {
    const r = await this.requests.rowById(tx, input.requestId, true);
    if (!r) throw problem('NOT_FOUND');
    const base = { requestId: r.id, refCode: r.ref_code, subSource: r.sub_source };
    const open = r.status === 'new' || r.status === 'in_progress';
    const may = desk(input.actor.roles) || r.assigned_user_id === input.actor.userId;
    if (!open) return { ...base, status: r.status, converted: false };
    if (!may) {
      if (r.assigned_user_id) {
        await this.events.notify(
          tx,
          {
            kind: 'website_request_linked_hold',
            userIds: [r.assigned_user_id],
            refType: 'website_booking_request',
            refId: r.id,
            refCode: r.ref_code,
          },
          input.now,
        );
      }
      return { ...base, status: r.status, converted: false };
    }
    await tx.query(
      `UPDATE website_booking_request
          SET status = 'converted', reservation_id = $2, converted_at = $3, converted_by = $4, ${PII_NULLS},
              ip_hmac = NULL, pii_purged_at = $3, last_activity_at = $3, updated_at = $3, version = version + 1
        WHERE id = $1`,
      [r.id, input.reservationId, input.now, input.actor.userId],
    );
    await this.requests.history(
      tx,
      r.id,
      r.status,
      'converted',
      'convert_website_request',
      input.now,
      'system',
      input.actor.userId,
    );
    const after = await this.requests.rowById(tx, r.id);
    if (after) await this.requests.publish(tx, r, after);
    return { ...base, status: 'converted', converted: true };
  }
}
