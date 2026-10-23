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
  PaymentCreate,
  CreateHoldBody,
  DepositNoticeBody,
  Locale,
  MarkNoShowBody,
  MovePreview,
  MovePreviewQuery,
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
  LoginMfaBody,
  CreateUserBody,
  CancelScheduledParameterBody,
  My2fa,
  My2faSetup,
  RecoveryCodes,
  ResetUser2faBody,
  StrongReauth,
  LookupGuestBody,
  Me,
  Parameter,
  PageInfo,
  PropertyRole,
  Room,
  RoomGroup,
  RoomPatch,
  RoomUpdateResult,
  ApproveBody,
  AttentionItem,
  ArrivalsDepartures,
  CreateHkTaskBody,
  GuestRequest,
  GuestRequestStatus,
  HkTask,
  HkTaskStatus,
  HkTaskSummary,
  Item,
  ItemInput,
  RoomBlock,
  RoomBlockCreate,
  RoomStatusEntry,
  TransitionGuestRequestBody,
  TransitionHkTaskBody,
  TransitionWorkOrderBody,
  UpdateWorkOrderBody,
  WorkOrder,
  WorkOrderAction,
  WorkOrderCreate,
  WorkOrderStatus,
  ResolveAttentionBody,
  TonightKpi,
  ApprovalStatus,
  AttachmentPurpose,
  AttachmentResult,
  AuditEvent,
  Bill,
  CashHandoverBody,
  CashRefundBody,
  ChangeRoomBody,
  ChangeRoomPreview,
  ChargeCatalogItem,
  CheckInBody,
  CheckInPreview,
  CheckOutBody,
  CheckOutResult,
  CheckoutConfirmationBody,
  CheckoutSummary,
  CompleteReviewBody,
  ConfirmReceivedBody,
  ConsentInput,
  DocumentCheckBody,
  DocumentCheckCode,
  ExtendStayBody,
  ExtendStayResult,
  GuestLinkIssued,
  ExtensionOptions,
  FocRequestInput,
  Folio,
  FolioLineCreate,
  GuestDocumentInput,
  GuestDocumentLink,
  GuestDocumentSensitive,
  InvoiceRequest,
  LateCheckoutBody,
  LateCheckoutResult,
  MinibarCheck,
  MinibarCheckInput,
  MinibarStandard,
  Party,
  PartyMemberCreate,
  Payment,
  PaymentListItem,
  PaymentMethod,
  PortalData,
  ReconcileBody,
  RefundDestination,
  RefundDestinationBody,
  RefundRequestBody,
  Registration,
  RegistrationSummary,
  RegistrationTransitionBody,
  RejectBody,
  TransferRefundBody,
  VietQrBody,
  VietQrResult,
  SetParameterBody,
  TrustDeviceBody,
  TrustedDevice,
  UpdateUserBody,
  User,
  WebsiteBookingRequest,
  WebsiteBookingRequestAction,
  WebsiteBookingRequestStatus,
  WebsiteBookingRequestTransition,
} from './types';

type P = { propertyId: string };
type R = P & { reservationId: string };
type Q = P & { quoteId: string };
type F = P & { folioId: string };
type A = P & { approvalId: string };
type G = P & { registrationId: string };
type C3Reason = 'registration' | 'recheck' | 'guest_request' | 'authority_request';
const FOL = '/v1/properties/{propertyId}/folios/{folioId}';
const APR = '/v1/properties/{propertyId}/approval-requests/{approvalId}';
const REG = '/v1/properties/{propertyId}/registrations/{registrationId}';
const PAY = '/v1/properties/{propertyId}/payments/{paymentId}';

export interface ListPaymentsQuery {
  reconciliation?: 'pending' | 'reconciled' | 'disputed' | 'not_required' | 'any';
  receivedFrom?: string;
  receivedTo?: string;
  recordedBy?: string;
  recordedByRole?: string;
  method?: PaymentMethod;
  cursor?: string;
  limit?: number;
}
export interface ListAuditQuery {
  category?: AuditEvent['category'];
  actorUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}
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

/** S35 queue filters – only the status list and the request code go in the URL (C2 never does – SEC ARC-12). */
export interface ListWebsiteRequestsQuery {
  status?: WebsiteBookingRequestStatus[];
  refCode?: string;
  cursor?: string;
  limit?: number;
}
const WBR = '/v1/properties/{propertyId}/website-booking-requests';

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

    // 2FA (US-143, OpenAPI 0.3.8 – SEC A). No Idempotency-Key on setup/confirm/recovery codes (SEC 06.9):
    // their answers carry secrets that must never be stored server side.
    /** Step 2 of sign-in: exactly one of `totpCode`, `recoveryCode`; every failure is `401 MFA_INVALID`. */
    loginMfa: (body: LoginMfaBody) => r<Me>('POST', '/v1/auth/login/mfa', { body, local: true }),
    getMy2fa: () => r<My2fa>('GET', '/v1/me/2fa'),
    /** Current password → a NEW pending secret every call (the previous QR stops working). */
    startMy2faSetup: (currentPassword: string) =>
      r<My2faSetup>('POST', '/v1/me/2fa/setup', { body: { currentPassword }, local: true }),
    /** First TOTP code → 2FA on, 10 recovery codes once, NEW session (reload getMe for the csrfToken). */
    confirmMy2fa: (totpCode: string) =>
      r<RecoveryCodes>('POST', '/v1/me/2fa/confirm', { body: { totpCode }, local: true }),
    /** S2 – the previous set stops working at once. */
    regenerateMyRecoveryCodes: (reauth: StrongReauth) =>
      r<RecoveryCodes>('POST', '/v1/me/2fa/recovery-codes', { body: reauth, local: true }),
    /** S2 – voluntary roles only (owner/manager → 403); every session is revoked, this one too. */
    disableMy2fa: (reauth: StrongReauth) =>
      r<void>('DELETE', '/v1/me/2fa', { body: reauth, local: true }),

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
      r<RoomUpdateResult>('PATCH', '/v1/properties/{propertyId}/rooms/{roomId}', {
        path: { propertyId, roomId },
        body,
        ifMatch: version,
      }),

    // parameters (S24)
    /** `asOf` (LocalDate): values in force on that day – a later day shows changes already scheduled. */
    listParameters: ({ propertyId }: P, local = false, asOf?: string) =>
      r<{ data: Parameter[] }>('GET', '/v1/properties/{propertyId}/parameters', {
        path: { propertyId },
        local,
        query: asOf ? { asOf } : undefined,
      }),
    getParameterHistory: ({ propertyId, key }: P & { key: string }) =>
      r<{ current?: Parameter; history: Parameter[] }>(
        'GET',
        '/v1/properties/{propertyId}/parameters/{key}',
        { path: { propertyId, key } },
      ),
    setParameter: ({ propertyId, key }: P & { key: string }, body: SetParameterBody) =>
      r<Parameter>('PUT', '/v1/properties/{propertyId}/parameters/{key}', {
        path: { propertyId, key },
        body,
      }),
    /** 0.3.8 (R3-Q51): drop a value scheduled for a later day; `payment_receiving_account` needs S2 `reauth`. */
    cancelScheduledParameter: (
      { propertyId, key }: P & { key: string },
      body: CancelScheduledParameterBody,
      idempotencyKey: string,
    ) =>
      r<void>('POST', '/v1/properties/{propertyId}/parameters/{key}/actions/cancel-scheduled', {
        path: { propertyId, key },
        body,
        idempotencyKey,
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
    /**
     * 0.3.7 (ESC-019 A, S4-21): money of a B7/B8 change before saving – read only (no Idempotency-Key,
     * no If-Match). `moveReservation.expectedDeltaVnd` = `folioDeltaVnd` shown to the guest.
     */
    previewMoveReservation: ({ propertyId, reservationId }: R, query: MovePreviewQuery) =>
      r<MovePreview>('GET', `${RES}/move-preview`, {
        path: { propertyId, reservationId },
        query: { ...query },
        local: true,
      }),
    /** 0.3.7 D1 (S4-08): `retainLines` = service lines the desk keeps (others are reversed). */
    markNoShow: (
      { propertyId, reservationId }: R,
      body: MarkNoShowBody | string,
      version: number,
      idempotencyKey: string,
    ) =>
      r<Reservation>('POST', `${RES}/actions/mark-no-show`, {
        path: { propertyId, reservationId },
        body: (typeof body === 'string'
          ? { contactAttemptNote: body }
          : body) satisfies BodyOf<'markNoShow'>,
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

    // ---------- Sprint 3: stay (EP03–EP05, OpenAPI 0.3.6) ----------
    previewCheckIn: ({ propertyId, reservationId }: R, checkinTime?: string) =>
      r<CheckInPreview>('GET', `${RES}/check-in-preview`, {
        path: { propertyId, reservationId },
        query: { checkinTime },
      }),
    /** 200 = Reservation; 202 = ApprovalRequest `checkin_room_not_ready` (FD sent roomNotReadyOverride). */
    checkIn: ({ propertyId, reservationId }: R, body: CheckInBody, version: number, idem: string) =>
      r<Reservation | ApprovalRequest>('POST', `${RES}/actions/check-in`, {
        path: { propertyId, reservationId },
        body,
        ifMatch: version,
        idempotencyKey: idem,
      }),
    /** A22a: new guest link (old ones stop working) – the token is returned once, never stored. */
    issueGuestLink: ({ propertyId, reservationId }: R, idem: string) =>
      r<GuestLinkIssued>('POST', `${RES}/guest-link`, {
        path: { propertyId, reservationId },
        idempotencyKey: idem,
      }),
    revokeGuestLink: ({ propertyId, reservationId }: R) =>
      r<void>('DELETE', `${RES}/guest-link`, { path: { propertyId, reservationId } }),
    undoCheckIn: (
      { propertyId, reservationId }: R,
      reason: string,
      version: number,
      idem: string,
    ) =>
      r<Reservation>('POST', `${RES}/actions/undo-check-in`, {
        path: { propertyId, reservationId },
        body: { reason } satisfies BodyOf<'undoCheckIn'>,
        ifMatch: version,
        idempotencyKey: idem,
      }),
    getExtensionOptions: ({ propertyId, reservationId }: R) =>
      r<ExtensionOptions>('GET', `${RES}/extension-options`, {
        path: { propertyId, reservationId },
      }),
    extendStay: (
      { propertyId, reservationId }: R,
      body: ExtendStayBody,
      version: number,
      idem: string,
    ) =>
      r<ExtendStayResult>('POST', `${RES}/actions/extend`, {
        path: { propertyId, reservationId },
        body,
        ifMatch: version,
        idempotencyKey: idem,
      }),
    /** `dryRun=true` → read-only preview (no key / If-Match, SEC A3); 202 = approval request (FD + conflict). */
    setLateCheckout: (
      { propertyId, reservationId }: R,
      body: LateCheckoutBody,
      version?: number,
      idem?: string,
    ) =>
      r<LateCheckoutResult | ApprovalRequest>('POST', `${RES}/actions/late-checkout`, {
        path: { propertyId, reservationId },
        body,
        ifMatch: body.dryRun ? undefined : version,
        idempotencyKey: body.dryRun ? undefined : idem,
        local: body.dryRun,
      }),
    previewChangeRoom: ({ propertyId, reservationId }: R, body: ChangeRoomBody) =>
      r<ChangeRoomPreview>('POST', `${RES}/actions/change-room`, {
        path: { propertyId, reservationId },
        body: { ...body, dryRun: true },
        local: true,
      }),
    changeRoom: (
      { propertyId, reservationId }: R,
      body: ChangeRoomBody,
      version: number,
      idem: string,
    ) =>
      r<Reservation>('POST', `${RES}/actions/change-room`, {
        path: { propertyId, reservationId },
        body: { ...body, dryRun: false },
        ifMatch: version,
        idempotencyKey: idem,
      }),
    listCheckoutReminders: ({ propertyId, reservationId }: R) =>
      r<ResponseOf<'listCheckoutReminders'>>('GET', `${RES}/checkout-confirmations`, {
        path: { propertyId, reservationId },
      }),
    recordCheckoutConfirmation: (
      { propertyId, reservationId }: R,
      body: CheckoutConfirmationBody,
      idem: string,
    ) =>
      r<ResponseOf<'recordCheckoutConfirmation'>>('POST', `${RES}/checkout-confirmations`, {
        path: { propertyId, reservationId },
        body,
        idempotencyKey: idem,
      }),
    getCheckoutSummary: ({ propertyId, reservationId }: R, checkoutTime?: string) =>
      r<CheckoutSummary>('GET', `${RES}/checkout-summary`, {
        path: { propertyId, reservationId },
        query: { checkoutTime },
      }),
    checkOut: (
      { propertyId, reservationId }: R,
      body: CheckOutBody,
      version: number,
      idem: string,
    ) =>
      r<CheckOutResult>('POST', `${RES}/actions/check-out`, {
        path: { propertyId, reservationId },
        body,
        ifMatch: version,
        idempotencyKey: idem,
      }),
    listParty: ({ propertyId, reservationId }: R) =>
      r<Party>('GET', `${RES}/party`, { path: { propertyId, reservationId } }),
    addPartyMember: ({ propertyId, reservationId }: R, body: PartyMemberCreate, idem?: string) =>
      r<Party>('POST', `${RES}/party`, {
        path: { propertyId, reservationId },
        body,
        idempotencyKey: body.dryRun ? undefined : idem,
        local: body.dryRun,
      }),
    /**
     * 0.3.7 (S4-39): `guestUploadPersonIndex` = the "Khách n" slot (n ≥ 2) of the ID the guest sent
     * through the link that belongs to the person removed, or `none` – required when that person has no
     * linked ID and unlinked slots exist (422 REQUIRED + `personIndexes[]`). Only a slot number.
     */
    removePartyMember: (
      { propertyId, reservationId }: R,
      memberId: string,
      version: number,
      idem: string,
      guestUploadPersonIndex?: number | 'none',
    ) =>
      r<void>('DELETE', `${RES}/party/{memberId}`, {
        path: { propertyId, reservationId, memberId },
        query: { guestUploadPersonIndex },
        ifMatch: version,
        idempotencyKey: idem,
      }),
    /** 0.3.7 bổ sung 4 (minibar M-1): `roomId` = the cabinet (absent = the room assigned now). */
    getMinibarStandard: ({ propertyId, reservationId }: R, roomId?: string) =>
      r<MinibarStandard>('GET', `${RES}/minibar-standard`, {
        path: { propertyId, reservationId },
        query: { roomId },
      }),
    recordMinibarCheck: ({ propertyId, reservationId }: R, body: MinibarCheckInput, idem: string) =>
      r<MinibarCheck>('POST', `${RES}/minibar-checks`, {
        path: { propertyId, reservationId },
        body,
        idempotencyKey: idem,
      }),

    // ---------- folio, payments, bill (EP05/EP15) ----------
    getFolio: ({ propertyId, folioId }: F) =>
      r<Folio>('GET', FOL, { path: { propertyId, folioId } }),
    getChargeCatalog: ({ propertyId }: P) =>
      r<{ data: ChargeCatalogItem[] }>('GET', '/v1/properties/{propertyId}/charge-catalog', {
        path: { propertyId },
      }),
    addFolioLine: ({ propertyId, folioId }: F, body: FolioLineCreate, idem: string) =>
      r<Folio>('POST', `${FOL}/lines`, {
        path: { propertyId, folioId },
        body,
        idempotencyKey: idem,
      }),
    /**
     * S4-27 (US-006 AC1, US-032 AC1, US-038 AC2; BR-008): adjust a line = reversal + new line, reason
     * required, If-Match = `Folio.version`. Settled folio → MGR/OWN only (A32). Night lines (`room`,
     * `extra_person`) take `newUnitPriceVnd` only (S4-35).
     */
    adjustFolioLine: (
      { propertyId, folioId }: F,
      lineId: string,
      body: BodyOf<'adjustFolioLine'>,
      version: number,
      idem: string,
    ) =>
      r<Folio>('POST', `${FOL}/lines/{lineId}/adjustments`, {
        path: { propertyId, folioId, lineId },
        body,
        ifMatch: version,
        idempotencyKey: idem,
      }),
    requestFoc: ({ propertyId, folioId }: F, lineId: string, body: FocRequestInput, idem: string) =>
      r<ApprovalRequest>('POST', `${FOL}/lines/{lineId}/foc`, {
        path: { propertyId, folioId, lineId },
        body,
        idempotencyKey: idem,
      }),
    recordPayment: ({ propertyId, folioId }: F, body: PaymentCreate, idem: string) =>
      r<Payment>('POST', `${FOL}/payments`, {
        path: { propertyId, folioId },
        body,
        idempotencyKey: idem,
      }),
    createVietQr: ({ propertyId, folioId }: F, body: VietQrBody, idem: string) =>
      r<VietQrResult>('POST', `${FOL}/vietqr`, {
        path: { propertyId, folioId },
        body,
        idempotencyKey: idem,
      }),
    createRefundRequest: ({ propertyId, folioId }: F, body: RefundRequestBody, idem: string) =>
      r<ApprovalRequest>('POST', `${FOL}/refund-requests`, {
        path: { propertyId, folioId },
        body,
        idempotencyKey: idem,
      }),
    setInvoiceRequest: ({ propertyId, folioId }: F, body: InvoiceRequest) =>
      r<InvoiceRequest>('PUT', `${FOL}/invoice-request`, { path: { propertyId, folioId }, body }),
    getBill: ({ propertyId, folioId }: F) =>
      r<Bill>('GET', `${FOL}/bill`, { path: { propertyId, folioId } }),
    listPayments: ({ propertyId }: P, query: ListPaymentsQuery = {}) =>
      r<Paged<PaymentListItem>>('GET', '/v1/properties/{propertyId}/payments', {
        path: { propertyId },
        query: { limit: 100, ...query },
      }),
    confirmPaymentReceived: (
      { propertyId }: P,
      paymentId: string,
      body: ConfirmReceivedBody,
      idem: string,
    ) =>
      r<Payment>('POST', `${PAY}/actions/confirm-received`, {
        path: { propertyId, paymentId },
        body,
        idempotencyKey: idem,
      }),
    reconcilePayment: (
      { propertyId }: P,
      paymentId: string,
      body: ReconcileBody,
      version: number,
      idem: string,
    ) =>
      r<Payment>('POST', `${PAY}/actions/reconcile`, {
        path: { propertyId, paymentId },
        body,
        ifMatch: version,
        idempotencyKey: idem,
      }),
    confirmCashHandover: (
      { propertyId }: P,
      paymentId: string,
      body: CashHandoverBody,
      version: number,
      idem: string,
    ) =>
      r<Payment>('POST', `${PAY}/actions/confirm-cash-handover`, {
        path: { propertyId, paymentId },
        body,
        ifMatch: version,
        idempotencyKey: idem,
      }),
    reversePayment: ({ propertyId }: P, paymentId: string, reason: string, idem: string) =>
      r<Payment>('POST', `${PAY}/actions/reverse`, {
        path: { propertyId, paymentId },
        body: { reason } satisfies BodyOf<'reversePayment'>,
        idempotencyKey: idem,
      }),
    /** multipart upload (penalty evidence, receipts, refund proof) – the file never goes to storage. */
    uploadAttachment: (
      { propertyId }: P,
      file: Blob,
      purpose: AttachmentPurpose,
      idem: string,
      reservationId?: string,
    ) => {
      const form = new FormData();
      form.append('file', file);
      form.append('purpose', purpose);
      if (reservationId) form.append('reservationId', reservationId);
      return r<AttachmentResult>('POST', '/v1/properties/{propertyId}/attachments', {
        path: { propertyId },
        form,
        idempotencyKey: idem,
      });
    },

    // ---------- approvals, refunds (SM-10, rbac A43/A47/A47a) ----------
    /** One page (newest first); the next page with `page.nextCursor` (BUG-R2-107). */
    listApprovalRequests: ({ propertyId }: P, status?: ApprovalStatus, cursor?: string) =>
      r<Paged<ApprovalRequest>>('GET', '/v1/properties/{propertyId}/approval-requests', {
        path: { propertyId },
        query: { status, cursor, limit: 100 },
      }),
    approveRequest: ({ propertyId, approvalId }: A, body: ApproveBody, idem: string) =>
      r<ApprovalRequest>('POST', `${APR}/actions/approve`, {
        path: { propertyId, approvalId },
        body,
        idempotencyKey: idem,
        local: true,
      }),
    rejectRequest: ({ propertyId, approvalId }: A, body: RejectBody, idem: string) =>
      r<ApprovalRequest>('POST', `${APR}/actions/reject`, {
        path: { propertyId, approvalId },
        body,
        idempotencyKey: idem,
        local: true,
      }),
    cancelRequest: ({ propertyId, approvalId }: A, idem: string) =>
      r<ApprovalRequest>('POST', `${APR}/actions/cancel`, {
        path: { propertyId, approvalId },
        idempotencyKey: idem,
      }),
    setRefundDestination: (
      { propertyId, approvalId }: A,
      body: RefundDestinationBody,
      idem: string,
    ) =>
      r<ApprovalRequest>('PUT', `${APR}/refund-destination`, {
        path: { propertyId, approvalId },
        body,
        idempotencyKey: idem,
      }),
    getRefundDestination: ({ propertyId, approvalId }: A) =>
      r<RefundDestination>('GET', `${APR}/refund-destination`, {
        path: { propertyId, approvalId },
        local: true,
      }),
    /** A47a – cash at the desk (FD+, payer ≠ requester, signed receipt photo required). */
    executeCashRefund: ({ propertyId, approvalId }: A, body: CashRefundBody, idem: string) =>
      r<Payment>('POST', `${APR}/actions/execute-cash-refund`, {
        path: { propertyId, approvalId },
        body,
        idempotencyKey: idem,
      }),
    /** A47 – bank transfer / original method (OWN/MGR only). */
    executeRefund: ({ propertyId, approvalId }: A, body: TransferRefundBody, idem: string) =>
      r<Payment>('POST', `${APR}/actions/execute-refund`, {
        path: { propertyId, approvalId },
        body,
        idempotencyKey: idem,
      }),
    listAuditEvents: ({ propertyId }: P, query: ListAuditQuery = {}) =>
      r<Paged<AuditEvent>>('GET', '/v1/properties/{propertyId}/audit-events', {
        path: { propertyId },
        query: { limit: 100, ...query },
      }),
    /** Step-up for C3 reads (SR-C3-09): password re-entry, valid `c3_stepup_minutes`. */
    stepUp: (password: string) =>
      r<{ validUntil: string }>('POST', '/v1/me/step-up', { body: { password }, local: true }),

    /** "Cần chú ý" (US-012, BR-907) – computed + stored items; FD+ (no finance/FOC items for FD). */
    listAttentionItems: ({ propertyId }: P) =>
      r<{ data: AttentionItem[] }>('GET', '/v1/properties/{propertyId}/attention', {
        path: { propertyId },
      }),
    // ---------- dashboard (EP01 – Sprint 4 FE-B, OpenAPI 0.3.7) ----------
    /** US-010: tonight's KPIs for the business date (BR-010); OWN/MGR/FDL/FD – no money fields. */
    getTonightKpi: ({ propertyId }: P) =>
      r<TonightKpi>('GET', '/v1/properties/{propertyId}/dashboard/tonight', {
        path: { propertyId },
      }),
    /** US-011/US-031: arrivals, departures, holds arriving today; `date` absent = business date. */
    getArrivalsDepartures: ({ propertyId }: P, date?: string) =>
      r<ArrivalsDepartures>('GET', '/v1/properties/{propertyId}/arrivals-departures', {
        path: { propertyId },
        query: { date },
      }),
    /** Close an `event` item of "Cần chú ý" (US-012, US-136 AC2 "Đã báo kênh") – no If-Match. */
    resolveAttentionEvent: (
      { propertyId, eventId }: P & { eventId: string },
      body: ResolveAttentionBody,
      idempotencyKey: string,
    ) =>
      r<void>('POST', '/v1/properties/{propertyId}/attention-events/{eventId}/actions/resolve', {
        path: { propertyId, eventId },
        body,
        idempotencyKey,
      }),

    // ---------- housekeeping, maintenance, guest requests, minibar (Sprint 4 FE-B – 0.3.7) ----------
    /** S10 (US-052): the 10 rooms with status + allowed events (FD+ full, HK masked). */
    listRoomStatuses: (
      { propertyId }: P,
      filter?: 'all' | 'needs_cleaning' | 'occupied' | 'ready',
    ) =>
      r<{ data: RoomStatusEntry[]; asOf: string }>(
        'GET',
        '/v1/properties/{propertyId}/room-statuses',
        {
          path: { propertyId },
          query: { filter },
        },
      ),
    /** US-054: today's tasks sorted by BR-807 rank + `summary {done, total}`. */
    listHkTasks: ({ propertyId }: P, query: { date?: string; status?: HkTaskStatus } = {}) =>
      r<{ data: HkTask[]; summary: HkTaskSummary }>('GET', '/v1/properties/{propertyId}/hk-tasks', {
        path: { propertyId },
        query: { ...query },
      }),
    createHkTask: ({ propertyId }: P, body: CreateHkTaskBody, idem: string) =>
      r<HkTask>('POST', '/v1/properties/{propertyId}/hk-tasks', {
        path: { propertyId },
        body,
        idempotencyKey: idem,
      }),
    transitionHkTask: (
      { propertyId, taskId }: P & { taskId: string },
      action: 'start' | 'complete' | 'cancel',
      body: TransitionHkTaskBody,
      idem: string,
    ) =>
      r<HkTask>('POST', '/v1/properties/{propertyId}/hk-tasks/{taskId}/actions/{action}', {
        path: { propertyId, taskId, action },
        body,
        idempotencyKey: idem,
      }),
    listWorkOrders: ({ propertyId }: P, status?: WorkOrderStatus) =>
      r<Paged<WorkOrder>>('GET', '/v1/properties/{propertyId}/work-orders', {
        path: { propertyId },
        query: { status, limit: 100 },
      }),
    /** W1 (+ O1 with `block`): 409 ROOM_OCCUPIED / ROOM_UNAVAILABLE / ROOM_BLOCKED carry `conflicts[]`. */
    createWorkOrder: ({ propertyId }: P, body: WorkOrderCreate, idem: string) =>
      r<WorkOrder>('POST', '/v1/properties/{propertyId}/work-orders', {
        path: { propertyId },
        body,
        idempotencyKey: idem,
      }),
    getWorkOrder: ({ propertyId, workOrderId }: P & { workOrderId: string }) =>
      r<WorkOrder>('GET', '/v1/properties/{propertyId}/work-orders/{workOrderId}', {
        path: { propertyId, workOrderId },
      }),
    updateWorkOrder: (
      { propertyId, workOrderId }: P & { workOrderId: string },
      body: UpdateWorkOrderBody,
      version: number,
    ) =>
      r<WorkOrder>('PATCH', '/v1/properties/{propertyId}/work-orders/{workOrderId}', {
        path: { propertyId, workOrderId },
        body,
        ifMatch: version,
      }),
    /** SM-04 W2–W6 (online only): If-Match + Idempotency-Key. */
    transitionWorkOrder: (
      { propertyId, workOrderId }: P & { workOrderId: string },
      action: WorkOrderAction,
      body: TransitionWorkOrderBody,
      version: number,
      idem: string,
    ) =>
      r<WorkOrder>(
        'POST',
        '/v1/properties/{propertyId}/work-orders/{workOrderId}/actions/{action}',
        { path: { propertyId, workOrderId, action }, body, ifMatch: version, idempotencyKey: idem },
      ),
    listRoomBlocks: ({ propertyId }: P, query: { from?: string; to?: string } = {}) =>
      r<{ data: RoomBlock[] }>('GET', '/v1/properties/{propertyId}/room-blocks', {
        path: { propertyId },
        query: { ...query },
      }),
    /** O1 planned block (US-019) – also "khóa theo đề nghị" with `workOrderId`. */
    createRoomBlock: ({ propertyId }: P, body: RoomBlockCreate, idem: string) =>
      r<RoomBlock>('POST', '/v1/properties/{propertyId}/room-blocks', {
        path: { propertyId },
        body,
        idempotencyKey: idem,
      }),
    /** O3 – extend / shorten (half-open: `endDatePlanned` = first sellable day). */
    updateRoomBlock: (
      { propertyId, roomBlockId }: P & { roomBlockId: string },
      endDatePlanned: string,
      version: number,
    ) =>
      r<RoomBlock>('PATCH', '/v1/properties/{propertyId}/room-blocks/{roomBlockId}', {
        path: { propertyId, roomBlockId },
        body: { endDatePlanned } satisfies BodyOf<'updateRoomBlock'>,
        ifMatch: version,
      }),
    /** O4 release (no work order → MGR+), O5 cancel. */
    transitionRoomBlock: (
      { propertyId, roomBlockId }: P & { roomBlockId: string },
      action: 'release' | 'cancel',
      reason: string,
      idem: string,
    ) =>
      r<RoomBlock>(
        'POST',
        '/v1/properties/{propertyId}/room-blocks/{roomBlockId}/actions/{action}',
        {
          path: { propertyId, roomBlockId, action },
          body: { reason } satisfies BodyOf<'transitionRoomBlock'>,
          idempotencyKey: idem,
        },
      ),
    /** S30 (US-110): routed requests – the desk sees every department. */
    listGuestRequests: ({ propertyId }: P, status?: GuestRequestStatus) =>
      r<{ data: GuestRequest[] }>('GET', '/v1/properties/{propertyId}/guest-requests', {
        path: { propertyId },
        query: { status },
      }),
    transitionGuestRequest: (
      { propertyId, requestId }: P & { requestId: string },
      action: 'acknowledge' | 'complete' | 'decline',
      body: TransitionGuestRequestBody,
      idem: string,
    ) =>
      r<GuestRequest>(
        'POST',
        '/v1/properties/{propertyId}/guest-requests/{requestId}/actions/{action}',
        { path: { propertyId, requestId, action }, body, idempotencyKey: idem },
      ),
    /** B-01 – a non-ID photo (receipt, work order…) as a Blob; the caller makes an object URL and revokes it. */
    getAttachment: ({ propertyId, attachmentId }: P & { attachmentId: string }) =>
      r<Blob>('GET', '/v1/properties/{propertyId}/attachments/{attachmentId}', {
        path: { propertyId, attachmentId },
        blob: true,
        local: true,
      }),
    /** S13 (US-066): minibar catalogue – `costPriceVnd` only OWN/MGR (US-003 AC2). */
    listItems: ({ propertyId }: P) =>
      r<{ data: Item[] }>('GET', '/v1/properties/{propertyId}/items', { path: { propertyId } }),
    createItem: ({ propertyId }: P, body: ItemInput, idem: string) =>
      r<Item>('POST', '/v1/properties/{propertyId}/items', {
        path: { propertyId },
        body,
        idempotencyKey: idem,
      }),
    /** New sale price applies to the next minibar checks; posted folio lines keep theirs (BR-006). */
    updateItem: (
      { propertyId, itemId }: P & { itemId: string },
      body: ItemInput,
      version: number,
    ) =>
      r<Item>('PATCH', '/v1/properties/{propertyId}/items/{itemId}', {
        path: { propertyId, itemId },
        body,
        ifMatch: version,
      }),

    // ---------- registration (EP06 – C3, trusted device only) ----------
    listRegistrations: ({ propertyId }: P, view: 'action_needed' | 'needs_update' | 'all') =>
      r<Paged<RegistrationSummary>>('GET', '/v1/properties/{propertyId}/registrations', {
        path: { propertyId },
        query: { view, limit: 100 },
      }),
    getRegistration: ({ propertyId, registrationId }: G) =>
      r<Registration>('GET', REG, { path: { propertyId, registrationId } }),
    addGuestDocument: (
      { propertyId, registrationId }: G,
      data: GuestDocumentInput,
      images: Blob[],
      idem: string,
    ) => {
      const form = new FormData();
      // UXR #3: a plain string part (no filename). A Blob part gets `filename="blob"` from the browser and
      // the API's `textPart` reads only non-file parts → 422 `data REQUIRED`. The JSON stays the value.
      form.append('data', JSON.stringify(data));
      for (const img of images) form.append('image', img);
      return r<Registration>('POST', `${REG}/documents`, {
        path: { propertyId, registrationId },
        form,
        idempotencyKey: idem,
      });
    },
    updateGuestDocument: (
      { propertyId, registrationId }: G,
      documentId: string,
      /** Full fields, or 0.3.7 `GuestDocumentLink` = only `partyMemberId` (no C3 read / resend – S4-39). */
      body: GuestDocumentInput | GuestDocumentLink,
      version: number,
    ) =>
      r<Registration>('PATCH', `${REG}/documents/{documentId}`, {
        path: { propertyId, registrationId, documentId },
        body,
        ifMatch: version,
      }),
    getGuestDocumentSensitive: (
      { propertyId, registrationId }: G,
      documentId: string,
      reason?: C3Reason,
    ) =>
      r<GuestDocumentSensitive>('GET', `${REG}/documents/{documentId}/sensitive`, {
        path: { propertyId, registrationId, documentId },
        query: { reason },
        local: true,
      }),
    getDocumentImage: (
      { propertyId, registrationId }: G,
      documentId: string,
      imageId: string,
      reason?: C3Reason,
    ) =>
      r<Blob>('GET', `${REG}/documents/{documentId}/images/{imageId}`, {
        path: { propertyId, registrationId, documentId, imageId },
        query: { reason },
        blob: true,
        local: true,
      }),
    recordDocumentCheck: (
      { propertyId, registrationId }: G,
      documentId: string,
      checkCode: DocumentCheckCode,
      body: DocumentCheckBody,
      version: number,
    ) =>
      r<Registration>('PUT', `${REG}/documents/{documentId}/checks/{checkCode}`, {
        path: { propertyId, registrationId, documentId, checkCode },
        body,
        ifMatch: version,
      }),
    recordImageConsent: ({ propertyId, registrationId }: G, body: ConsentInput, idem: string) =>
      r<Registration>('POST', `${REG}/consents`, {
        path: { propertyId, registrationId },
        body,
        idempotencyKey: idem,
      }),
    completeRegistrationReview: (
      { propertyId, registrationId }: G,
      body: CompleteReviewBody,
      version: number,
      idem: string,
    ) =>
      r<Registration>('POST', `${REG}/actions/complete-review`, {
        path: { propertyId, registrationId },
        body,
        ifMatch: version,
        idempotencyKey: idem,
      }),
    getPortalData: ({ propertyId, registrationId }: G, kind?: PortalData['kind']) =>
      r<PortalData>('GET', `${REG}/portal-data`, {
        path: { propertyId, registrationId },
        query: { kind },
        local: true,
      }),
    transitionRegistration: (
      { propertyId, registrationId }: G,
      transition: 'mark-sent' | 'mark-confirmed' | 'mark-rejected' | 'mark-updated',
      body: RegistrationTransitionBody,
      version: number,
      idem: string,
    ) =>
      r<Registration>('POST', `${REG}/actions/{transition}`, {
        path: { propertyId, registrationId, transition },
        body,
        ifMatch: version,
        idempotencyKey: idem,
      }),
    purgeRegistrationImages: (
      { propertyId, registrationId }: G,
      reason: 'guest_request' | 'consent_withdrawn',
      version: number,
      idem: string,
    ) =>
      r<void>('DELETE', `${REG}/images`, {
        path: { propertyId, registrationId },
        query: { reason },
        ifMatch: version,
        idempotencyKey: idem,
      }),

    // ---------- S35 "Yêu cầu từ website" (US-155 Desk – R3-Q06) ----------
    /** Queue: default `new,in_progress`; server sorts (new by `replyBy`, then `updatedAt` desc) and scopes SAL. */
    listWebsiteBookingRequests: ({ propertyId }: P, query: ListWebsiteRequestsQuery = {}) =>
      r<Paged<WebsiteBookingRequest>>('GET', WBR, {
        path: { propertyId },
        query: { ...query, status: query.status?.length ? query.status.join(',') : undefined },
      }),
    getWebsiteBookingRequest: ({ propertyId, requestId }: P & { requestId: string }) =>
      r<WebsiteBookingRequest>('GET', `${WBR}/{requestId}`, { path: { propertyId, requestId } }),
    /** WR1–WR5 (+ WR8 erase, OWN/MGR/FDL): `If-Match` = version, one Idempotency-Key per click. */
    transitionWebsiteBookingRequest: (
      { propertyId, requestId }: P & { requestId: string },
      action: WebsiteBookingRequestAction,
      body: WebsiteBookingRequestTransition,
      version: number,
      idempotencyKey: string,
    ) =>
      r<WebsiteBookingRequest>('POST', `${WBR}/{requestId}/actions/{action}`, {
        path: { propertyId, requestId, action },
        body,
        ifMatch: version,
        idempotencyKey,
      }),

    // users & devices (S26, owner only)
    listUsers: () => r<Paged<User>>('GET', '/v1/users', { query: { limit: 100 } }),
    /** S2 `reauth` (0.3.8 CỔNG) only when the new list ADDS owner/manager – see `rolesNeedS2`. */
    setUserRoles: (userId: string, roles: PropertyRole[], version: number, reauth?: StrongReauth) =>
      r<User>('PUT', '/v1/users/{userId}/roles', {
        path: { userId },
        body: (reauth ? { roles, reauth } : { roles }) satisfies BodyOf<'setUserRoles'>,
        ifMatch: version,
      }),
    /** US-008 – always S2 (SEC 06.26). The S26 "add user" screen is FE-B's. */
    createUser: (body: CreateUserBody, idempotencyKey: string) =>
      r<User>('POST', '/v1/users', { body, idempotencyKey }),
    /** `status` / `resetPassword` on someone else need `body.reauth` (S2, 0.3.8 CỔNG). */
    updateUser: (userId: string, body: UpdateUserBody, version: number) =>
      r<User>('PATCH', '/v1/users/{userId}', {
        path: { userId },
        body,
        ifMatch: version,
      }),
    /** US-143 AC3 (b): OWN resets another user's 2FA (S2 + reason); never one's own (422). */
    resetUser2fa: (userId: string, body: ResetUser2faBody, idempotencyKey: string) =>
      r<void>('POST', '/v1/users/{userId}/2fa/actions/reset', {
        path: { userId },
        body,
        idempotencyKey,
        local: true,
      }),
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
    /** S2 (SEC 06.27, 0.3.8 CỔNG). */
    revokeTrustedDevice: (
      { propertyId, deviceId }: P & { deviceId: string },
      reason: string | undefined,
      reauth: StrongReauth,
      idempotencyKey: string,
    ) =>
      r<TrustedDevice>(
        'POST',
        '/v1/properties/{propertyId}/trusted-devices/{deviceId}/actions/revoke',
        {
          path: { propertyId, deviceId },
          body: (reason ? { reason, reauth } : { reauth }) satisfies BodyOf<'revokeTrustedDevice'>,
          idempotencyKey,
        },
      ),
  };
}

export type Endpoints = ReturnType<typeof createEndpoints>;

/** `streamEvents` (SSE, text/event-stream): open with `new EventSource(path, { withCredentials: true })`. */
export function eventStreamPath(propertyId: string): string {
  return `/v1/properties/${encodeURIComponent(propertyId)}/events`;
}
