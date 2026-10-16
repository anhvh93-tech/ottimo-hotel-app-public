// One function per OpenAPI operation used by the web apps. Request/response types come from the
// generated contract, so a contract change breaks the build here instead of at runtime.
import type { ApiClient } from './client';
import type {
  ApprovalRequest,
  AssignRoomBody,
  AvailabilityResult,
  BodyOf,
  BookingRules,
  CloserCandidate,
  CancelReservationBody,
  CancelReservationResult,
  Channel,
  Commission,
  ConfirmDepositBody,
  CreateHoldBody,
  DepositNoticeBody,
  Locale,
  MoveReservationBody,
  Quote,
  QuoteCalculation,
  QuoteInput,
  QuoteStatus,
  Rack,
  Reservation,
  ReservationCreate,
  ReservationPatch,
  ReservationStatus,
  ReservationSummary,
  SaveQuoteBody,
  ChangePasswordBody,
  Guest,
  GuestInput,
  GuestSummary,
  ResponseOf,
  LoginBody,
  LookupGuestBody,
  Me,
  Parameter,
  PageInfo,
  PropertyRole,
  Room,
  RoomGroup,
  RoomPatch,
  SetParameterBody,
  TrustDeviceBody,
  TrustedDevice,
  UpdateUserBody,
  User,
} from './types';

type P = { propertyId: string };
type R = P & { reservationId: string };
type Q = P & { quoteId: string };
const RES = '/v1/properties/{propertyId}/reservations/{reservationId}';
const QUO = '/v1/properties/{propertyId}/quotes/{quoteId}';

export interface ListReservationsQuery {
  status?: ReservationStatus[];
  stayFrom?: string;
  stayTo?: string;
  q?: string;
  externalContract?: boolean;
  cursor?: string;
  limit?: number;
}
type Paged<T> = { data: T[]; page: PageInfo };

export function createEndpoints(api: ApiClient) {
  const r = api.request.bind(api);
  return {
    // auth (S01)
    login: (body: LoginBody) => r<Me>('POST', '/v1/auth/login', { body, local: true }),
    logout: () => r<void>('POST', '/v1/auth/logout'),
    getMe: () => r<Me>('GET', '/v1/me'),
    // 0.3.4 Q4: a wrong current password is `401 REAUTH_FAILED` + errors[] (field error); only
    // `401 UNAUTHENTICATED` is an expired session – the global handler decides by `code`, not status.
    // Q3: 204 + new session cookie → callers reload getMe() for the new csrfToken.
    changeMyPassword: (body: ChangePasswordBody) => r<void>('POST', '/v1/me/password', { body }),

    // rooms (S25)
    listRooms: ({ propertyId }: P) =>
      r<{ data: Room[] }>('GET', '/v1/properties/{propertyId}/rooms', { path: { propertyId } }),
    listRoomGroups: ({ propertyId }: P) =>
      r<{ data: RoomGroup[] }>('GET', '/v1/properties/{propertyId}/room-groups', {
        path: { propertyId },
      }),
    updateRoom: (
      { propertyId, roomId }: P & { roomId: string },
      body: RoomPatch,
      version: number,
    ) =>
      r<Room>('PATCH', '/v1/properties/{propertyId}/rooms/{roomId}', {
        path: { propertyId, roomId },
        body,
        ifMatch: version,
      }),

    // parameters (S24)
    listParameters: ({ propertyId }: P, local = false) =>
      r<{ data: Parameter[] }>('GET', '/v1/properties/{propertyId}/parameters', {
        path: { propertyId },
        local,
      }),
    getParameterHistory: ({ propertyId, key }: P & { key: string }) =>
      r<{ current: Parameter; history: Parameter[] }>(
        'GET',
        '/v1/properties/{propertyId}/parameters/{key}',
        { path: { propertyId, key } },
      ),
    setParameter: ({ propertyId, key }: P & { key: string }, body: SetParameterBody) =>
      r<Parameter>('PUT', '/v1/properties/{propertyId}/parameters/{key}', {
        path: { propertyId, key },
        body,
      }),

    // guests (S14)
    searchGuests: ({ propertyId }: P, q: string, picker = false) =>
      r<Paged<GuestSummary>>('GET', '/v1/properties/{propertyId}/guests', {
        path: { propertyId },
        query: { q, picker: picker || undefined, limit: picker ? 5 : 20 },
      }),
    lookupGuestByContact: ({ propertyId }: P, body: LookupGuestBody) =>
      r<ResponseOf<'lookupGuestByContact'>>('POST', '/v1/properties/{propertyId}/guests/lookup', {
        path: { propertyId },
        body,
      }),
    createGuest: ({ propertyId }: P, body: GuestInput, idempotencyKey: string) =>
      r<Guest>('POST', '/v1/properties/{propertyId}/guests', {
        path: { propertyId },
        body,
        idempotencyKey,
      }),
    getGuest: ({ propertyId, guestId }: P & { guestId: string }) =>
      r<Guest>('GET', '/v1/properties/{propertyId}/guests/{guestId}', {
        path: { propertyId, guestId },
      }),
    updateGuest: (
      { propertyId, guestId }: P & { guestId: string },
      body: GuestInput,
      version: number,
    ) =>
      r<Guest>('PATCH', '/v1/properties/{propertyId}/guests/{guestId}', {
        path: { propertyId, guestId },
        body,
        ifMatch: version,
      }),

    // rack / availability (S03, S15 – EP02 §1–2)
    getRack: ({ propertyId }: P, query: { from?: string; days?: number } = {}) =>
      r<Rack>('GET', '/v1/properties/{propertyId}/rack', { path: { propertyId }, query }),
    searchAvailability: (
      { propertyId }: P,
      query: {
        arrival: string;
        departure: string;
        roomId?: string;
        roomGroupId?: string;
        adults?: number;
        /** 0.3.5 A-05: OTA conflict assignment – `upgrade` relative to this booking's group. */
        reservationId?: string;
      },
    ) =>
      r<AvailabilityResult>('GET', '/v1/properties/{propertyId}/availability', {
        path: { propertyId },
        query,
      }),
    /** 0.3.5 A-06: who can be the closer of a booking (FD+). */
    listCloserCandidates: ({ propertyId }: P, kind: 'agent' | 'staff' | 'all' = 'all') =>
      r<{ data: CloserCandidate[] }>('GET', '/v1/properties/{propertyId}/closer-candidates', {
        path: { propertyId },
        query: { kind },
        local: true,
      }),
    /** 0.3.5 A-07: booking rule values readable by every booking role (no params screen access needed). */
    getBookingRules: ({ propertyId }: P) =>
      r<BookingRules>('GET', '/v1/properties/{propertyId}/booking-rules', {
        path: { propertyId },
        local: true,
      }),
    listChannels: ({ propertyId }: P) =>
      r<{ data: Channel[] }>('GET', '/v1/properties/{propertyId}/channels', {
        path: { propertyId },
      }),

    // reservations (SM-01 – EP02 §3–11)
    listReservations: ({ propertyId }: P, query: ListReservationsQuery = {}) =>
      r<Paged<ReservationSummary>>('GET', '/v1/properties/{propertyId}/reservations', {
        path: { propertyId },
        query: { ...query, status: query.status?.join(',') },
      }),
    createReservation: ({ propertyId }: P, body: ReservationCreate, idempotencyKey: string) =>
      r<Reservation>('POST', '/v1/properties/{propertyId}/reservations', {
        path: { propertyId },
        body,
        idempotencyKey,
      }),
    getReservation: ({ propertyId, reservationId }: R) =>
      r<Reservation>('GET', RES, { path: { propertyId, reservationId } }),
    updateReservation: (
      { propertyId, reservationId }: R,
      body: ReservationPatch,
      version: number,
    ) =>
      r<Reservation>('PATCH', RES, { path: { propertyId, reservationId }, body, ifMatch: version }),
    extendHold: (
      { propertyId, reservationId }: R,
      extraHours: number,
      version: number,
      idempotencyKey: string,
    ) =>
      r<Reservation>('POST', `${RES}/actions/extend-hold`, {
        path: { propertyId, reservationId },
        body: { extraHours } satisfies BodyOf<'extendHold'>,
        ifMatch: version,
        idempotencyKey,
      }),
    confirmDeposit: (
      { propertyId, reservationId }: R,
      body: ConfirmDepositBody,
      version: number,
      idempotencyKey: string,
    ) =>
      r<Reservation>('POST', `${RES}/actions/confirm-deposit`, {
        path: { propertyId, reservationId },
        body,
        ifMatch: version,
        idempotencyKey,
      }),
    createDepositNotice: (
      { propertyId, reservationId }: R,
      body: DepositNoticeBody,
      idempotencyKey: string,
    ) =>
      r<void>('POST', `${RES}/deposit-notices`, {
        path: { propertyId, reservationId },
        body,
        idempotencyKey,
      }),
    /** US-021 AC3: `dryRun=true` (no Idempotency-Key / If-Match) returns the consequence for the dialog. */
    cancelReservationPreview: ({ propertyId, reservationId }: R, body: CancelReservationBody) =>
      r<CancelReservationResult>('POST', `${RES}/actions/cancel`, {
        path: { propertyId, reservationId },
        body: { ...body, dryRun: true },
      }),
    cancelReservation: (
      { propertyId, reservationId }: R,
      body: CancelReservationBody,
      version: number,
      idempotencyKey: string,
    ) =>
      r<CancelReservationResult>('POST', `${RES}/actions/cancel`, {
        path: { propertyId, reservationId },
        body: { ...body, dryRun: false },
        ifMatch: version,
        idempotencyKey,
      }),
    moveReservation: (
      { propertyId, reservationId }: R,
      body: MoveReservationBody,
      version: number,
      idempotencyKey: string,
    ) =>
      r<Reservation>('POST', `${RES}/actions/move`, {
        path: { propertyId, reservationId },
        body,
        ifMatch: version,
        idempotencyKey,
      }),
    markNoShow: (
      { propertyId, reservationId }: R,
      contactAttemptNote: string,
      version: number,
      idempotencyKey: string,
    ) =>
      r<Reservation>('POST', `${RES}/actions/mark-no-show`, {
        path: { propertyId, reservationId },
        body: { contactAttemptNote } satisfies BodyOf<'markNoShow'>,
        ifMatch: version,
        idempotencyKey,
      }),
    /** 200 = restored (Reservation); 202 = approval request created (FD/FDL outside BR-315). */
    restoreNoShow: (
      { propertyId, reservationId }: R,
      body: BodyOf<'restoreNoShow'>,
      version: number,
      idempotencyKey: string,
    ) =>
      r<Reservation | ApprovalRequest>('POST', `${RES}/actions/restore-no-show`, {
        path: { propertyId, reservationId },
        body,
        ifMatch: version,
        idempotencyKey,
      }),
    assignRoom: (
      { propertyId, reservationId }: R,
      body: AssignRoomBody,
      version: number,
      idempotencyKey: string,
    ) =>
      r<Reservation>('POST', `${RES}/actions/assign-room`, {
        path: { propertyId, reservationId },
        body,
        ifMatch: version,
        idempotencyKey,
      }),

    // quotes / sale (EP11 R2 – EP02 §10)
    calculateQuote: ({ propertyId }: P, body: QuoteInput) =>
      r<QuoteCalculation>('POST', '/v1/properties/{propertyId}/quotes/calculate', {
        path: { propertyId },
        body,
        local: true,
      }),
    listQuotes: ({ propertyId }: P, status?: QuoteStatus) =>
      r<Paged<Quote>>('GET', '/v1/properties/{propertyId}/quotes', {
        path: { propertyId },
        query: { status, limit: 50 },
      }),
    saveQuote: ({ propertyId }: P, body: SaveQuoteBody, idempotencyKey: string) =>
      r<Quote>('POST', '/v1/properties/{propertyId}/quotes', {
        path: { propertyId },
        body,
        idempotencyKey,
      }),
    getQuote: ({ propertyId, quoteId }: Q) =>
      r<Quote>('GET', QUO, { path: { propertyId, quoteId } }),
    getQuoteText: ({ propertyId, quoteId }: Q, locale: Locale) =>
      r<{ locale: Locale; text: string }>('GET', `${QUO}/text`, {
        path: { propertyId, quoteId },
        query: { locale },
      }),
    createHoldFromQuote: (
      { propertyId, quoteId }: Q,
      body: CreateHoldBody,
      idempotencyKey: string,
    ) =>
      r<Reservation>('POST', `${QUO}/actions/create-hold`, {
        path: { propertyId, quoteId },
        body,
        idempotencyKey,
      }),
    /** 0.3.5 A-18 (Q4): MGR/OWN → 200 Quote; SAL/CTV → 202 ApprovalRequest `quote_extension`. */
    extendQuote: ({ propertyId, quoteId }: Q, reason: string | undefined, idempotencyKey: string) =>
      r<Quote | ApprovalRequest>('POST', `${QUO}/actions/extend`, {
        path: { propertyId, quoteId },
        body: reason ? { reason } : {},
        idempotencyKey,
      }),
    /** SAL/CTV: server returns only their own commissions (x-scope own – US-087). */
    listCommissions: ({ propertyId }: P) =>
      r<Paged<Commission>>('GET', '/v1/properties/{propertyId}/commissions', {
        path: { propertyId },
        query: { limit: 100 },
        local: true,
      }),

    // users & devices (S26, owner only)
    listUsers: () => r<Paged<User>>('GET', '/v1/users', { query: { limit: 100 } }),
    setUserRoles: (userId: string, roles: PropertyRole[], version: number) =>
      r<User>('PUT', '/v1/users/{userId}/roles', {
        path: { userId },
        body: { roles } satisfies BodyOf<'setUserRoles'>,
        ifMatch: version,
      }),
    updateUser: (userId: string, body: UpdateUserBody, version: number) =>
      r<User>('PATCH', '/v1/users/{userId}', { path: { userId }, body, ifMatch: version }),
    listTrustedDevices: ({ propertyId }: P) =>
      r<{ data: TrustedDevice[] }>('GET', '/v1/properties/{propertyId}/trusted-devices', {
        path: { propertyId },
      }),
    trustCurrentDevice: ({ propertyId }: P, body: TrustDeviceBody, idempotencyKey: string) =>
      r<TrustedDevice>('POST', '/v1/properties/{propertyId}/trusted-devices', {
        path: { propertyId },
        body,
        idempotencyKey,
      }),
    revokeTrustedDevice: (
      { propertyId, deviceId }: P & { deviceId: string },
      reason: string | undefined,
      idempotencyKey: string,
    ) =>
      r<TrustedDevice>(
        'POST',
        '/v1/properties/{propertyId}/trusted-devices/{deviceId}/actions/revoke',
        { path: { propertyId, deviceId }, body: reason ? { reason } : {}, idempotencyKey },
      ),
  };
}

export type Endpoints = ReturnType<typeof createEndpoints>;

/** `streamEvents` (SSE, text/event-stream): open with `new EventSource(path, { withCredentials: true })`. */
export function eventStreamPath(propertyId: string): string {
  return `/v1/properties/${encodeURIComponent(propertyId)}/events`;
}
