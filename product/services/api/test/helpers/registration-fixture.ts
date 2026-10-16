/**
 * BE-C fixtures: a booking row (+ segment on a DS-E room) inserted directly as test data (the booking flows
 * themselves are BE-A's and tested there), sample images, multipart bodies, step-up. FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { v7 as uuidv7 } from 'uuid';
import type { Database } from '../../src/db/database';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import type { BookingIds } from './reservations-fixture';
import { seedGuestRow } from './reservations-fixture';
import { T0, type TestTenant } from './tenant';
import type { FeatureApp, LightMyRequestResponse } from './feature-app';

export interface StayOpts {
  status?: 'hold' | 'confirmed' | 'in_house' | 'checked_out' | 'cancelled' | 'no_show';
  arrival?: string;
  departure?: string;
  adults?: number;
  children6to11?: number;
  childrenUnder6?: number;
  bookerName?: string;
  roomNo?: string;
  stayType?: 'short' | 'long';
  propertyIndex?: number;
}

export async function seedStay(
  db: Database,
  t: TestTenant,
  ids: BookingIds,
  opts: StayOpts = {},
): Promise<{ reservationId: string; code: string }> {
  const i = opts.propertyIndex ?? 0;
  const guestId = await seedGuestRow(db, t, { name: opts.bookerName ?? 'Emma Schmidt' });
  const id = uuidv7();
  const code = `OTM-${randomBytes(3).toString('hex').toUpperCase()}`;
  const status = opts.status ?? 'confirmed';
  const folioId = uuidv7();
  await db.withContext(t.ctx(i), async (tx) => {
    // reservation.folio_id ↔ folio.primary_reservation_id: deferred FKs, same transaction (erd 4.6).
    await tx.query(
      `INSERT INTO folio (id, organization_id, property_id, primary_reservation_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5)`,
      [folioId, t.organizationId, t.propertyIds[i], id, T0],
    );
    await tx.query(
      `INSERT INTO reservation (id, organization_id, property_id, code, status, stay_type, channel_id,
         payment_model, booker_guest_id, arrival_date, departure_date, adults, children_6_11, children_under_6,
         pricing_snapshot, hold_expires_at, cancel_reason_code, cancelled_at, status_before_cancel,
         created_at, updated_at, folio_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'direct', $8, $9, $10, $11, $12, $13, '{}', $14, $15, $16, $17, $18, $18, $19)`,
      [
        id,
        t.organizationId,
        t.propertyIds[i],
        code,
        status,
        opts.stayType ?? 'short',
        Object.values(ids.channels)[0],
        guestId,
        opts.arrival ?? '2026-10-15',
        opts.departure ?? '2026-10-20',
        opts.adults ?? 2,
        opts.children6to11 ?? 0,
        opts.childrenUnder6 ?? 0,
        status === 'hold' ? new Date(T0.getTime() + 86_400_000) : null,
        status === 'cancelled' ? 'guest_cancelled' : null,
        status === 'cancelled' ? T0 : null,
        status === 'cancelled' || status === 'no_show' ? 'confirmed' : null,
        T0,
        folioId,
      ],
    );
    await tx.query(
      `INSERT INTO reservation_segment (id, organization_id, property_id, reservation_id, room_id, from_date,
         to_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
      [
        uuidv7(),
        t.organizationId,
        t.propertyIds[i],
        id,
        ids.rooms[opts.roomNo ?? '202'],
        opts.arrival ?? '2026-10-15',
        opts.departure ?? '2026-10-20',
        T0,
      ],
    );
  });
  return { reservationId: id, code };
}

export async function setStayStatus(
  db: Database,
  t: TestTenant,
  reservationId: string,
  status: string,
  extra: { actualCheckinAt?: Date; actualCheckoutAt?: Date } = {},
): Promise<void> {
  await db.withContext(t.ctx(), (tx) =>
    tx.query(
      `UPDATE reservation SET status = $2, actual_checkin_at = COALESCE($3, actual_checkin_at),
              actual_checkout_at = COALESCE($4, actual_checkout_at),
              cancel_reason_code = CASE WHEN $2 = 'cancelled' THEN 'guest_cancelled' ELSE cancel_reason_code END,
              cancelled_at = CASE WHEN $2 = 'cancelled' THEN $5 ELSE cancelled_at END,
              status_before_cancel = CASE WHEN $2 IN ('cancelled', 'no_show') THEN 'confirmed' ELSE status_before_cancel END
        WHERE id = $1`,
      [reservationId, status, extra.actualCheckinAt ?? null, extra.actualCheckoutAt ?? null, T0],
    ),
  );
}

export async function sampleJpeg(color = '#7799bb', exif = true): Promise<Buffer> {
  const img = sharp({ create: { width: 120, height: 80, channels: 3, background: color } }).jpeg();
  return (exif ? img.withExif({ IFD0: { Copyright: 'GPS-LOCATION-SECRET' } }) : img).toBuffer();
}

export interface Part {
  name: string;
  value: string | Buffer;
  filename?: string;
  contentType?: string;
}

export function multipart(parts: Part[]): { body: Buffer; contentType: string } {
  const boundary = `----bec${randomBytes(8).toString('hex')}`;
  const chunks: Buffer[] = [];
  for (const p of parts) {
    let head = `--${boundary}\r\nContent-Disposition: form-data; name="${p.name}"`;
    if (p.filename) head += `; filename="${p.filename}"`;
    head += '\r\n';
    if (p.contentType) head += `Content-Type: ${p.contentType}\r\n`;
    chunks.push(
      Buffer.from(`${head}\r\n`),
      Buffer.isBuffer(p.value) ? p.value : Buffer.from(p.value),
      Buffer.from('\r\n'),
    );
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
}

/** Staff request with session + device cookies, CSRF and (writes) Idempotency-Key / If-Match. */
export async function staff(
  fa: FeatureApp,
  token: string,
  device: string | null,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  opts: {
    json?: unknown;
    multipart?: Part[];
    ifMatch?: number;
    idem?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<LightMyRequestResponse> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  headers.cookie = [`ottimo_sid=${token}`, ...(device ? [`ottimo_did=${device}`] : [])].join('; ');
  if (method !== 'GET') {
    headers['x-csrf-token'] = fa.sessions.csrfToken(sha256Hex(token));
    headers['idempotency-key'] = opts.idem ?? randomUUID();
  }
  if (opts.ifMatch !== undefined) headers['if-match'] = `"${opts.ifMatch}"`;
  let payload: string | Buffer | undefined;
  if (opts.multipart) {
    const m = multipart(opts.multipart);
    headers['content-type'] = m.contentType;
    payload = m.body;
  } else if (opts.json !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(opts.json);
  }
  return fa.app.inject({ method, url, headers, ...(payload !== undefined ? { payload } : {}) });
}

/** Origin the guest() helper sends on writes (startFeatureApp `guestOrigins`). */
export const GUEST_TEST_ORIGIN = 'https://g.test';

/** Guest-web request with the guest cookie. */
export async function guest(
  fa: FeatureApp,
  sid: string | null,
  method: 'GET' | 'POST' | 'PUT',
  url: string,
  opts: {
    json?: unknown;
    multipart?: Part[];
    idem?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<LightMyRequestResponse> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (sid) headers.cookie = `ottimo_gsid=${sid}`;
  if (method !== 'GET') {
    headers['idempotency-key'] = opts.idem ?? randomUUID();
    // guest-web origin of the test app (`guestOrigins`); ignored where no guest origin is configured.
    if (!('origin' in headers)) headers.origin = GUEST_TEST_ORIGIN;
  }
  let payload: string | Buffer | undefined;
  if (opts.multipart) {
    const m = multipart(opts.multipart);
    headers['content-type'] = m.contentType;
    payload = m.body;
  } else if (opts.json !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(opts.json);
  }
  return fa.app.inject({ method, url, headers, ...(payload !== undefined ? { payload } : {}) });
}
