// MSW mock of the Desk side of US-155 (R3-Q06, S35) – OpenAPI 0.3.7 bổ sung 2, frozen in 0.3.8 – until BE-D ships
// `listWebsiteBookingRequests`, `getWebsiteBookingRequest`, `transitionWebsiteBookingRequest`. Rules mirrored from the
// contract and specs/EP19-website-requests.md: x-roles → 403; SAL scope `unassigned_or_own` filtered in the query
// (out of scope → absent / 404); SAL sees no C2 on an unassigned `new` request (SEC ARC-19); SM-18 WR1–WR5, WR8 with
// If-Match → 428/412 and Idempotency-Key replay; 409 INVALID_TRANSITION with `currentState`; `decline` reason rules.
// The form switch `public_booking_requests_enabled` (OWN-only security parameter, default false) is read by
// OWN/MGR/FDL through `getParameterHistory`, answered here before the generic parameter handler.
import type {
  AllowedAction,
  AttentionItem,
  Role,
  WebsiteBookingRequest,
  WebsiteBookingRequestStatus,
} from '@ottimo/api-client';
import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw';
import { todayLocal } from '../app/dates';
import { addDays } from './reservations';
import type { MockUser } from './seed';

type Guard = { user: MockUser; roles: Role[] } | Response;
interface Ctx {
  guard: (
    request: StrictRequest<DefaultBodyType>,
    allowed: Role[] | 'any',
    opts?: { ifMatch?: number },
  ) => Guard;
  problem: (status: number, code: string, extra?: Record<string, unknown>) => Response;
  users: () => MockUser[];
}

const FD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const LEADS: Role[] = ['owner', 'manager', 'front_desk_lead'];
const VIEW: Role[] = [...FD_PLUS, 'sales_staff'];
const C2 = ['guestName', 'phone', 'email', 'note', 'declineNote'] as const;
const STAFF_REASONS = [
  'no_availability',
  'price_not_accepted',
  'guest_unreachable',
  'guest_not_proceeding',
  'duplicate',
  'policy_mismatch',
  'other',
];
export const FORM_SWITCH_KEY = 'public_booking_requests_enabled';

const has = (roles: Role[], set: Role[]) => roles.some((r) => set.includes(r));
const isResponse = (g: Guard): g is Response => g instanceof Response;
const uid = (n: number) => `0192a1b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const minutesAhead = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

export type MockWebRequest = Omit<WebsiteBookingRequest, 'allowedActions'>;

/** Server normalisation of `refCode=` (SEC UXD-07): no `-`/spaces, upper case, Crockford I/L → 1, O → 0. */
export function normalizeRefCode(raw: string): string {
  return raw.replace(/[-\s]/g, '').toUpperCase().replace(/[IL]/g, '1').replace(/O/g, '0');
}

/**
 * Contact as the server compares it (BR-951): e-mail lower-cased; phone to E.164 digits (Vietnamese 0… → 84…).
 * Empty string = not a usable contact.
 */
export function contactKey(raw: string): string {
  const v = raw.trim();
  if (v.includes('@')) return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? v.toLowerCase() : '';
  const digits = v.replace(/[^\d+]/g, '');
  if (/^\+[1-9]\d{7,14}$/.test(digits)) return digits.slice(1);
  if (/^0\d{9,10}$/.test(digits)) return `84${digits.slice(1)}`;
  return '';
}

function seed(): MockWebRequest[] {
  const today = todayLocal();
  const base = {
    aliasRefCodes: [],
    suspiciousFlags: [],
    relatedRefCodes: [],
    duplicateCount: 0,
    arrivesToday: false,
    isReplyOverdue: false,
    assignedUserId: null,
    assignedUserName: null,
    claimedAt: null,
    declineReasonCode: null,
    quoteId: null,
    reservationId: null,
    reservationCode: null,
    convertedAt: null,
    offerSnapshot: null,
    piiPurgedAt: null,
    subSource: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    refHost: null,
    landingPath: '/',
    months: null,
    version: 1,
  } satisfies Partial<MockWebRequest>;
  return [
    {
      ...base,
      id: uid(12001),
      refCode: 'W7K3QX9P',
      status: 'new',
      arrival: addDays(today, 3),
      departure: addDays(today, 5),
      nights: 2,
      stayKind: 'short',
      adults: 2,
      children: 1,
      infants: 0,
      roomType: 'standard-studio-garden-view',
      roomTypeLabel: 'Standard Studio · Garden View',
      guestName: 'Trần Linh',
      phone: '+84905123456',
      preferredChannel: 'zalo',
      note: 'Cho mình hỏi có chỗ đậu xe máy không?',
      locale: 'vi',
      subSource: 'facebook',
      utmSource: 'facebook',
      utmMedium: 'social',
      utmCampaign: 'fanpage_book_now',
      replyBy: minutesAgo(10),
      isReplyOverdue: true,
      createdAt: minutesAgo(25),
      updatedAt: minutesAgo(25),
    },
    {
      ...base,
      id: uid(12002),
      refCode: '7K3QX9MD',
      status: 'new',
      arrival: addDays(today, 20),
      departure: addDays(today, 112),
      nights: 92,
      stayKind: 'long',
      months: 3,
      adults: 1,
      children: 0,
      infants: 0,
      roomType: null,
      roomTypeLabel: null,
      guestName: 'Anna Keller',
      email: 'anna.keller@example.com',
      preferredChannel: 'email',
      note: 'Remote work stay. Photos of the desk? See https://example.com/brief',
      locale: 'en',
      suspiciousFlags: ['contains_url'],
      refHost: 'www.google.com',
      subSource: 'google',
      replyBy: minutesAhead(12),
      createdAt: minutesAgo(3),
      updatedAt: minutesAgo(3),
    },
    {
      ...base,
      id: uid(12003),
      refCode: 'M2PN4R8T',
      status: 'in_progress',
      arrival: addDays(today, 7),
      departure: addDays(today, 10),
      nights: 3,
      stayKind: 'short',
      adults: 2,
      children: 0,
      infants: 1,
      roomType: 'one-bedroom-suite',
      roomTypeLabel: 'One Bedroom Suite',
      guestName: 'Irina Volkova',
      phone: '+79123456789',
      preferredChannel: 'whatsapp',
      locale: 'ru',
      assignedUserId: uid(3),
      assignedUserName: 'Lan',
      claimedAt: minutesAgo(50),
      replyBy: minutesAgo(40),
      createdAt: minutesAgo(70),
      updatedAt: minutesAgo(50),
      version: 2,
    },
    {
      ...base,
      id: uid(12004),
      refCode: 'H8TV3K2C',
      status: 'declined',
      arrival: addDays(today, 2),
      departure: addDays(today, 4),
      nights: 2,
      stayKind: 'short',
      adults: 4,
      children: 0,
      infants: 0,
      roomType: null,
      roomTypeLabel: null,
      guestName: 'Phạm Quốc Bảo',
      phone: '+84912345678',
      preferredChannel: 'phone',
      locale: 'vi',
      declineReasonCode: 'no_availability',
      assignedUserId: uid(4),
      assignedUserName: 'Hạnh',
      replyBy: minutesAgo(1400),
      createdAt: minutesAgo(1440),
      updatedAt: minutesAgo(1300),
      version: 3,
    },
    {
      ...base,
      id: uid(12005),
      refCode: 'Q9RS7Z4B',
      status: 'spam',
      arrival: addDays(today, 300),
      departure: addDays(today, 301),
      nights: 1,
      stayKind: 'short',
      adults: 1,
      children: 0,
      infants: 0,
      roomType: null,
      roomTypeLabel: null,
      guestName: 'test test',
      phone: '+84900000000',
      preferredChannel: 'zalo',
      locale: 'vi',
      suspiciousFlags: ['far_future', 'repeat_contact'],
      duplicateCount: 3,
      replyBy: minutesAgo(600),
      createdAt: minutesAgo(620),
      updatedAt: minutesAgo(500),
      version: 2,
    },
  ];
}

export function createWebRequestMock(ctx: Ctx) {
  const { guard, problem } = ctx;
  const makeState = () => ({
    requests: seed(),
    /** The OWN-only switch (US-155 AC4) – `false` until the legal + SEC conditions are met. */
    formEnabled: false as boolean | null,
    idem: new Map<string, { status: number; body: WebsiteBookingRequest; etag: string }>(),
  });
  let state = makeState();

  const sal = (roles: Role[]) => !has(roles, FD_PLUS) && roles.includes('sales_staff');
  const inScope = (r: MockWebRequest, user: MockUser, roles: Role[]) =>
    !sal(roles) || (r.status === 'new' && !r.assignedUserId) || r.assignedUserId === user.id;

  function allowed(r: MockWebRequest, user: MockUser, roles: Role[]): AllowedAction[] {
    const fd = has(roles, FD_PLUS);
    const mine = r.assignedUserId === user.id;
    const open = r.status === 'new' || r.status === 'in_progress';
    const out: AllowedAction[] = [];
    const add = (event: string, transition: string, action: string) =>
      out.push({ event, transition, action });
    if (r.status === 'new' && (fd || !r.assignedUserId))
      add('claim_website_request', 'WR1', 'claim');
    if (r.status === 'in_progress' && (mine || has(roles, LEADS)))
      add('release_website_request', 'WR2', 'release');
    if (open && (fd || mine)) {
      add('decline_website_request', 'WR3', 'decline');
      add('mark_website_request_spam', 'WR4', 'mark-spam');
    }
    if ((r.status === 'declined' || r.status === 'spam') && !r.piiPurgedAt && (fd || mine))
      add('reopen_website_request', 'WR5', 'reopen');
    if (r.status !== 'converted' && !r.piiPurgedAt && has(roles, LEADS))
      add('erase_website_request', 'WR8', 'erase');
    return out;
  }

  function view(r: MockWebRequest, user: MockUser, roles: Role[]): WebsiteBookingRequest {
    const out = { ...r, allowedActions: allowed(r, user, roles) } as Record<string, unknown>;
    const hideC2 = !!r.piiPurgedAt || (sal(roles) && r.assignedUserId !== user.id);
    if (hideC2) for (const k of C2) delete out[k];
    for (const k of C2) if (out[k] === undefined) delete out[k];
    return out as unknown as WebsiteBookingRequest;
  }

  const etag = (r: MockWebRequest) => ({ etag: `"${r.version}"` });
  const find = (id: unknown) => state.requests.find((r) => r.id === id);

  const handlers = [
    http.get('*/v1/properties/:propertyId/parameters/:key', ({ request, params }) => {
      if (params.key !== FORM_SWITCH_KEY) return undefined;
      const g = guard(request, LEADS);
      if (isResponse(g)) return g;
      if (state.formEnabled === null) return problem(404, 'NOT_FOUND');
      const current = {
        key: FORM_SWITCH_KEY,
        value: state.formEnabled,
        effectiveFrom: '2026-10-22',
        brRef: 'SEC ARC-17',
        editableBy: ['owner'] as Role[],
      };
      return HttpResponse.json({ current, history: [current] });
    }),
    http.get('*/v1/properties/:propertyId/website-booking-requests', ({ request }) => {
      const g = guard(request, VIEW);
      if (isResponse(g)) return g;
      const url = new URL(request.url);
      const status = (url.searchParams.get('status') || 'new,in_progress').split(
        ',',
      ) as WebsiteBookingRequestStatus[];
      const rawRef = url.searchParams.get('refCode');
      if (rawRef !== null && !/^[0-9A-Za-z][0-9A-Za-z -]{6,10}[0-9A-Za-z]$/.test(rawRef))
        return problem(422, 'VALIDATION_FAILED', {
          errors: [{ field: 'refCode', code: 'PATTERN' }],
        });
      const ref = rawRef ? normalizeRefCode(rawRef) : null;
      const limit = Number(url.searchParams.get('limit') ?? 50);
      const offset = Number(url.searchParams.get('cursor') ?? 0);
      const rows = state.requests
        .filter((r) => inScope(r, g.user, g.roles))
        .filter((r) =>
          ref
            ? r.refCode === ref || (r.aliasRefCodes ?? []).includes(ref)
            : status.includes(r.status),
        )
        .sort(
          (a, b) =>
            Number(b.arrivesToday) - Number(a.arrivesToday) ||
            Number(b.status === 'new') - Number(a.status === 'new') ||
            (a.status === 'new' && b.status === 'new'
              ? a.replyBy.localeCompare(b.replyBy)
              : b.updatedAt.localeCompare(a.updatedAt)),
        );
      const page = rows.slice(offset, offset + limit);
      const hasMore = offset + limit < rows.length;
      return HttpResponse.json({
        data: page.map((r) => view(r, g.user, g.roles)),
        page: { limit, nextCursor: hasMore ? String(offset + limit) : null },
      });
    }),
    http.get(
      '*/v1/properties/:propertyId/website-booking-requests/:requestId',
      ({ request, params }) => {
        const g = guard(request, VIEW);
        if (isResponse(g)) return g;
        const r = find(params.requestId);
        if (!r || !inScope(r, g.user, g.roles)) return problem(404, 'NOT_FOUND');
        return HttpResponse.json(view(r, g.user, g.roles), { headers: etag(r) });
      },
    ),
    // SEC ARC-16: data-rights lookup by contact (OWN/MGR/FDL) – exactly one of phone/email, in the body; refs only.
    http.post(
      '*/v1/properties/:propertyId/website-booking-requests/lookup',
      async ({ request }) => {
        const g = guard(request, LEADS);
        if (isResponse(g)) return g;
        const body = ((await request.json().catch(() => ({}))) ?? {}) as {
          phone?: string;
          email?: string;
        };
        if (body.phone && body.email)
          return problem(422, 'VALIDATION_FAILED', {
            errors: [{ field: 'email', code: 'NOT_ALLOWED' }],
          });
        const raw = body.phone ?? body.email;
        if (!raw)
          return problem(422, 'VALIDATION_FAILED', {
            errors: [{ field: 'phone', code: 'REQUIRED' }],
          });
        const key = contactKey(raw);
        if (!key)
          return problem(422, 'VALIDATION_FAILED', {
            errors: [
              {
                field: body.phone ? 'phone' : 'email',
                code: body.phone ? 'PHONE_INVALID' : 'EMAIL_INVALID',
              },
            ],
          });
        const data = state.requests
          .filter((r) => r.status !== 'converted' && !r.piiPurgedAt)
          .filter((r) => contactKey(r.phone ?? r.email ?? '') === key)
          .map((r) => ({ id: r.id, refCode: r.refCode, status: r.status, createdAt: r.createdAt }));
        return HttpResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
      },
    ),
    http.post(
      '*/v1/properties/:propertyId/website-booking-requests/:requestId/actions/:action',
      async ({ request, params }) => {
        const r0 = find(params.requestId);
        const g = guard(request, VIEW, { ifMatch: r0?.version });
        if (isResponse(g)) return g;
        const r = r0;
        if (!r || !inScope(r, g.user, g.roles)) return problem(404, 'NOT_FOUND');
        const key = request.headers.get('idempotency-key');
        if (!key) return problem(400, 'IDEMPOTENCY_KEY_REQUIRED');
        const seen = state.idem.get(key);
        if (seen)
          return HttpResponse.json(seen.body, {
            status: seen.status,
            headers: { etag: seen.etag },
          });
        const action = String(params.action);
        const body = ((await request.json().catch(() => ({}))) ?? {}) as {
          reasonCode?: string;
          note?: string;
          verificationMethod?: string;
          verifiedContact?: string;
        };
        if (action === 'erase' && !has(g.roles, LEADS)) return problem(403, 'FORBIDDEN_ACTION');
        if (!allowed(r, g.user, g.roles).some((a) => a.action === action)) {
          const fdAction = ['release'].includes(action) && r.status === 'in_progress';
          return fdAction
            ? problem(403, 'FORBIDDEN_ACTION')
            : problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        }
        const now = new Date().toISOString();
        if (action === 'decline') {
          if (!body.reasonCode)
            return problem(422, 'VALIDATION_FAILED', {
              errors: [{ field: 'reasonCode', code: 'REQUIRED' }],
            });
          if (!STAFF_REASONS.includes(body.reasonCode))
            return problem(422, 'VALIDATION_FAILED', {
              errors: [{ field: 'reasonCode', code: 'NOT_IN_LIST' }],
            });
          const note = (body.note ?? '').trim();
          if (body.reasonCode === 'other' && note.length < 3)
            return problem(422, 'VALIDATION_FAILED', {
              errors: [{ field: 'note', code: 'REASON_REQUIRED' }],
            });
          r.status = 'declined';
          r.declineReasonCode = body.reasonCode as MockWebRequest['declineReasonCode'];
          if (note) r.declineNote = note;
        } else if (action === 'claim' || action === 'reopen') {
          r.status = 'in_progress';
          r.assignedUserId = g.user.id;
          r.assignedUserName = g.user.displayName;
          r.claimedAt = now;
          if (action === 'reopen') r.declineReasonCode = null;
        } else if (action === 'release') {
          r.status = 'new';
          r.assignedUserId = null;
          r.assignedUserName = null;
          r.claimedAt = null;
        } else if (action === 'mark-spam') {
          r.status = 'spam';
        } else if (action === 'erase') {
          if (!body.verificationMethod)
            return problem(422, 'VALIDATION_FAILED', {
              errors: [{ field: 'verificationMethod', code: 'REQUIRED' }],
            });
          if (!['same_contact', 'called_back'].includes(body.verificationMethod))
            return problem(422, 'VALIDATION_FAILED', {
              errors: [{ field: 'verificationMethod', code: 'NOT_IN_LIST' }],
            });
          // SEC ARC-16: `same_contact` → the contact the person used must match the request (server compares HMACs;
          // here the normalised values). `called_back` needs a phone on the request to call back.
          if (body.verificationMethod === 'same_contact') {
            const given = contactKey(body.verifiedContact ?? '');
            if (!given)
              return problem(422, 'VALIDATION_FAILED', {
                errors: [{ field: 'verifiedContact', code: 'REQUIRED' }],
              });
            if (given !== contactKey(r.phone ?? r.email ?? ''))
              return problem(422, 'VALIDATION_FAILED', {
                errors: [{ field: 'verifiedContact', code: 'CONTACT_MISMATCH' }],
              });
          } else if (!r.phone)
            return problem(422, 'VALIDATION_FAILED', {
              errors: [{ field: 'verificationMethod', code: 'NOT_ALLOWED' }],
            });
          r.status = 'declined';
          r.declineReasonCode = 'erased_on_request';
          r.piiPurgedAt = now;
          for (const k of C2) delete (r as Record<string, unknown>)[k];
        }
        r.isReplyOverdue = r.status === 'new' && Date.parse(r.replyBy) < Date.now();
        r.updatedAt = now;
        r.version += 1;
        const out = view(r, g.user, g.roles);
        state.idem.set(key, { status: 200, body: out, etag: `"${r.version}"` });
        return HttpResponse.json(out, { headers: etag(r) });
      },
    ),
  ];

  /** "Cần chú ý" `website_request_new` (computed, FD+): new requests nobody picked up (0.3.7 add. 2). */
  function attentionItems(): AttentionItem[] {
    const fresh = state.requests
      .filter((r) => r.status === 'new')
      .sort((a, b) => a.replyBy.localeCompare(b.replyBy));
    if (!fresh.length) return [];
    const oldest = fresh[0]!;
    return [
      {
        kind: 'website_request_new',
        source: 'computed',
        severity: Date.parse(oldest.replyBy) < Date.now() ? 'warning' : 'info',
        count: fresh.length,
        dueAt: oldest.replyBy,
        refCode: fresh.length === 1 ? oldest.refCode : undefined,
        params: { count: fresh.length },
        link: '/website-requests?status=new',
      } as AttentionItem,
    ];
  }

  return {
    handlers,
    attentionItems,
    get state() {
      return state;
    },
    reset() {
      state = makeState();
    },
    /** Hooks for the EP02 quote/hold mock (US-155 AC2 – WR1 automatic, WR6). */
    hooks: {
      checkQuote(requestId: string, user: MockUser, roles: Role[]) {
        const r = find(requestId);
        if (!r || !inScope(r, user, roles)) return problem(404, 'NOT_FOUND');
        if (r.status !== 'new' && r.status !== 'in_progress')
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        return null;
      },
      linkQuote(requestId: string, user: MockUser, quoteId: string) {
        const r = find(requestId);
        if (!r) return;
        if (r.status === 'new') {
          r.status = 'in_progress';
          r.assignedUserId = user.id;
          r.assignedUserName = user.displayName;
          r.claimedAt = new Date().toISOString();
        }
        r.quoteId = quoteId;
        r.version += 1;
      },
      convert(requestId: string, reservationId: string, reservationCode: string) {
        const r = find(requestId);
        if (!r) return;
        const now = new Date().toISOString();
        r.status = 'converted';
        r.reservationId = reservationId;
        r.reservationCode = reservationCode;
        r.convertedAt = now;
        r.piiPurgedAt = now;
        for (const k of C2) delete (r as Record<string, unknown>)[k];
        r.version += 1;
      },
    },
  };
}
