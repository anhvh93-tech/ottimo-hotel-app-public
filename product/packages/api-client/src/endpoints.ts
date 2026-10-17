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
  RoomUpdateResult,
  ApproveBody,
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
      r<RoomUpdateResult>('PATCH', '/v1/properties/{propertyId}/rooms/{roomId}', {
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
    removePartyMember: (
      { propertyId, reservationId }: R,
      memberId: string,
      version: number,
      idem: string,
    ) =>
      r<void>('DELETE', `${RES}/party/{memberId}`, {
        path: { propertyId, reservationId, memberId },
        ifMatch: version,
        idempotencyKey: idem,
      }),
    getMinibarStandard: ({ propertyId, reservationId }: R) =>
      r<MinibarStandard>('GET', `${RES}/minibar-standard`, { path: { propertyId, reservationId } }),
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
    listApprovalRequests: ({ propertyId }: P, status?: ApprovalStatus) =>
      r<Paged<ApprovalRequest>>('GET', '/v1/properties/{propertyId}/approval-requests', {
        path: { propertyId },
        query: { status, limit: 100 },
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
      form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
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
      body: GuestDocumentInput,
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
