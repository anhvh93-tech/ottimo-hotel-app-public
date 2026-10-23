import type { components, operations } from './generated/openapi';

type Schemas = components['schemas'];

export type Me = Schemas['Me'];
export type MeProperty = Me['properties'][number];
export type Problem = Schemas['Problem'];
export type FieldError = Schemas['FieldError'];
export type Role = Schemas['Role'];
export type Room = Schemas['Room'];
export type RoomPatch = Schemas['RoomPatch'];
export type RoomGroup = Schemas['RoomGroup'];
export type Parameter = Schemas['Parameter'];
export type Guest = Schemas['Guest'];
export type GuestInput = Schemas['GuestInput'];
export type GuestSummary = Schemas['GuestSummary'];
export type User = Schemas['User'];
export type PropertyRole = Schemas['PropertyRole'];
export type TrustedDevice = Schemas['TrustedDevice'];
export type PageInfo = Schemas['PageInfo'];
// Sprint 2 – EP02 reservations, rack, sale (OpenAPI 0.3.4)
export type Rack = Schemas['Rack'];
export type RackRoom = Rack['rooms'][number];
export type RackBar = Schemas['RackBar'];
export type RackBarKind = RackBar['kind'];
export type AvailabilityResult = Schemas['AvailabilityResult'];
export type Channel = Schemas['Channel'];
export type ChannelGroup = Channel['channelGroup'];
export type Reservation = Schemas['Reservation'];
export type ReservationSummary = Schemas['ReservationSummary'];
export type ReservationStatus = Schemas['ReservationStatus'];
export type ReservationCreate = Schemas['ReservationCreate'];
export type ReservationPatch = Schemas['ReservationPatch'];
export type ManualLongStayInput = Schemas['ManualLongStayInput'];
export type DirectSource = NonNullable<ReservationCreate['directSource']>;
export type PaymentModel = ReservationCreate['paymentModel'];
export type NightRate = Schemas['NightRate'];
export type AllowedAction = Schemas['AllowedAction'];
export type CancellationQuote = Schemas['CancellationQuote'];
export type CancelReasonCode = Schemas['CancelReasonCode'];
export type PaymentCreate = Schemas['PaymentCreate'];
export type PaymentMethod = Schemas['PaymentMethod'];
export type ApprovalRequest = Schemas['ApprovalRequest'];
export type QuoteInput = Schemas['QuoteInput'];
export type QuoteCalculation = Schemas['QuoteCalculation'];
export type Quote = Schemas['Quote'];
export type QuoteStatus = Schemas['QuoteStatus'];
export type Commission = Schemas['Commission'];
export type Locale = Schemas['Locale'];
export type CloserCandidate = Schemas['CloserCandidate'];
export type MoveReasonCode = Schemas['MoveReasonCode'];
export type BookingRules = Schemas['BookingRules'];
export type OccupancyConflict = Schemas['OccupancyConflict'];
/** `409 ROOM_UNAVAILABLE` body extras (responses.RoomUnavailable example). */
export type RoomSuggestion = NonNullable<Problem['suggestions']>[number];
/** `conflicts[]` item of 409 ROOM_UNAVAILABLE / ROOM_BLOCKED / ROOM_OCCUPIED (0.3.5 `OccupancyConflict`). */
export type RoomConflict = OccupancyConflict;

/** JSON request body of an operation (generated from OpenAPI). */
export type BodyOf<K extends keyof operations> = operations[K] extends {
  requestBody?: { content: { 'application/json': infer B } };
}
  ? B
  : never;

/** JSON body of the first 2xx response of an operation. */
export type ResponseOf<K extends keyof operations> = operations[K]['responses'] extends infer R
  ? R extends { 200: { content: { 'application/json': infer B } } }
    ? B
    : R extends { 201: { content: { 'application/json': infer B } } }
      ? B
      : undefined
  : never;

export type LoginBody = BodyOf<'login'>;
export type ChangePasswordBody = BodyOf<'changeMyPassword'>;
export type SetParameterBody = BodyOf<'setParameter'>;
export type CancelScheduledParameterBody = BodyOf<'cancelScheduledParameter'>;
/** `setParameter.reauth` / `cancelScheduledParameter.reauth` (password as `secret` + S2 factor – 0.3.8). */
export type ParameterReauth = NonNullable<SetParameterBody['reauth']>;
export type TrustDeviceBody = BodyOf<'trustCurrentDevice'>;
export type UpdateUserBody = BodyOf<'updateUser'>;
export type LookupGuestBody = BodyOf<'lookupGuestByContact'>;
// R3 Sprint 1 – US-143 2FA (OpenAPI 0.3.8, SEC A)
export type StrongReauth = Schemas['StrongReauth'];
export type LoginMfaBody = BodyOf<'loginMfa'>;
export type My2fa = ResponseOf<'getMy2fa'>;
export type My2faSetup = ResponseOf<'startMy2faSetup'>;
export type RecoveryCodes = ResponseOf<'confirmMy2fa'>;
export type ResetUser2faBody = BodyOf<'resetUser2fa'>;
export type CreateUserBody = Schemas['UserCreate'] & { reauth: StrongReauth };
export type ConfirmDepositBody = BodyOf<'confirmDeposit'>;
export type CancelReservationBody = BodyOf<'cancelReservation'>;
export type CancelReservationResult = ResponseOf<'cancelReservation'>;
export type MoveReservationBody = BodyOf<'moveReservation'>;
/** 0.3.7 (ESC-019 A, S4-21): `previewMoveReservation` query + answer (same calc as the write). */
export type MovePreviewQuery = NonNullable<
  operations['previewMoveReservation']['parameters']['query']
>;
export type MovePreview = Schemas['MovePreview'];
/** 0.3.7 D1 (S4-08): no-show with the service lines the desk keeps. */
export type MarkNoShowBody = BodyOf<'markNoShow'>;
/** 0.3.7 D1 (S4-08): one kept service line (`cancelReservation` / `markNoShow`). */
export type RetainLine = NonNullable<MarkNoShowBody['retainLines']>[number];
export type AssignRoomBody = BodyOf<'assignRoom'>;
export type DepositNoticeBody = BodyOf<'createDepositNotice'>;
export type SaveQuoteBody = BodyOf<'saveQuote'>;
export type CreateHoldBody = BodyOf<'createHoldFromQuote'>;

// Sprint 3 – EP03–EP06, EP15 (OpenAPI 0.3.6-draft)
export type CheckInPreview = Schemas['CheckInPreview'];
export type CheckInCondition = CheckInPreview['conditions'][number];
export type CheckInBody = BodyOf<'checkIn'>;
export type ExtensionOptions = Schemas['ExtensionOptions'];
export type ExtendStayBody = BodyOf<'extendStay'>;
export type ExtendStayResult = ResponseOf<'extendStay'>;
export type GuestLinkIssued = ResponseOf<'issueGuestLink'>;
export type LateCheckoutBody = BodyOf<'setLateCheckout'>;
export type LateCheckoutResult = Schemas['LateCheckoutResult'];
export type ChangeRoomBody = BodyOf<'changeRoom'>;
export type ChangeRoomPreview = Schemas['ChangeRoomPreview'];
export type CheckoutConfirmationBody = BodyOf<'recordCheckoutConfirmation'>;
export type CheckoutSummary = Schemas['CheckoutSummary'];
export type CheckOutBody = BodyOf<'checkOut'>;
export type CheckOutResult = ResponseOf<'checkOut'>;
export type Party = Schemas['Party'];
export type PartyMemberView = NonNullable<Party['members']>[number];
export type PartyMemberCreate = Schemas['PartyMemberCreate'];
export type Folio = Schemas['Folio'];
export type FolioLine = Schemas['FolioLine'];
export type FolioLineCreate = Schemas['FolioLineCreate'];
export type FolioLineCategory = Schemas['FolioLineCategory'];
export type FocRequestInput = Schemas['FocRequestInput'];
export type ChargeCatalogItem = Schemas['ChargeCatalogItem'];
export type Payment = Schemas['Payment'];
export type PaymentListItem = Schemas['PaymentListItem'];
export type PaymentType = Schemas['PaymentType'];
export type ConfirmReceivedBody = BodyOf<'confirmPaymentReceived'>;
export type ReconcileBody = BodyOf<'reconcilePayment'>;
export type CashHandoverBody = BodyOf<'confirmCashHandover'>;
export type VietQrBody = BodyOf<'createVietQr'>;
export type VietQrResult = ResponseOf<'createVietQr'>;
export type Bill = Schemas['Bill'];
export type InvoiceRequest = Schemas['InvoiceRequest'];
export type MinibarStandard = Schemas['MinibarStandard'];
export type MinibarCheck = Schemas['MinibarCheck'];
export type MinibarCheckInput = Schemas['MinibarCheckInput'];
export type ApprovalStatus = Schemas['ApprovalStatus'];
export type ApproveBody = BodyOf<'approveRequest'>;
export type RejectBody = BodyOf<'rejectRequest'>;
export type RefundRequestBody = BodyOf<'createRefundRequest'>;
export type RefundDestinationBody = BodyOf<'setRefundDestination'>;
export type RefundDestination = ResponseOf<'getRefundDestination'>;
export type CashRefundBody = BodyOf<'executeCashRefund'>;
export type TransferRefundBody = BodyOf<'executeRefund'>;
export type AuditEvent = Schemas['AuditEvent'];
/** "Cần chú ý" (BR-907) – `listAttentionItems`. */
export type AttentionItem = Schemas['AttentionItem'];
/** Sprint 4 FE-B (EP01, 0.3.7): H03 Hôm nay / H24 Tổng quan. */
export type AttentionKind = AttentionItem['kind'];
export type TonightKpi = Schemas['TonightKpi'];
export type ArrivalsDepartures = Schemas['ArrivalsDepartures'];
export type ArrivalItem = ArrivalsDepartures['arrivals'][number];
export type DepartureItem = ArrivalsDepartures['departures'][number];
export type DepartureReminderState = Schemas['DepartureReminderState'];
export type ResolveAttentionBody = BodyOf<'resolveAttentionEvent'>;
export type Registration = Schemas['Registration'];
export type RegistrationSummary = Schemas['RegistrationSummary'];
export type RegistrationStatus = Schemas['RegistrationStatus'];
export type GuestDocumentMasked = Schemas['GuestDocumentMasked'];
export type GuestDocumentInput = Schemas['GuestDocumentInput'];
/** 0.3.7 (S4-39): `updateGuestDocument` body that only links the document to a party member. */
export type GuestDocumentLink = Schemas['GuestDocumentLink'];
export type GuestDocumentSensitive = Schemas['GuestDocumentSensitive'];
export type DocumentCheckCode = Schemas['DocumentCheckCode'];
export type DocumentCheckResult = Schemas['DocumentCheckResult'];
export type DocType = Schemas['DocType'];
export type ConsentInput = Schemas['ConsentInput'];
export type CompleteReviewBody = BodyOf<'completeRegistrationReview'>;
export type DocumentCheckBody = BodyOf<'recordDocumentCheck'>;
export type PortalData = Schemas['PortalData'];
export type RegistrationTransitionBody = BodyOf<'transitionRegistration'>;
export type AttachmentPurpose =
  'penalty_evidence' | 'deposit_receipt' | 'refund_proof' | 'work_order' | 'inspection';
export type AttachmentResult = ResponseOf<'uploadAttachment'>;
/** `updateRoom` 200 = Room + `warnings[]` (0.3.6 A-39). */
export type RoomUpdateResult = ResponseOf<'updateRoom'>;

// ---------- Sprint 4 FE-B (EP07/EP08/EP14/EP09 – Desk, OpenAPI 0.3.7) ----------
export type RoomStatusEntry = Schemas['RoomStatusEntry'];
export type RoomStatusCode = Schemas['RoomStatusCode'];
export type HkTask = Schemas['HkTask'];
export type HkTaskType = Schemas['HkTaskType'];
export type HkTaskStatus = Schemas['HkTaskStatus'];
export type HkTaskSummary = ResponseOf<'listHkTasks'>['summary'];
export type CreateHkTaskBody = BodyOf<'createHkTask'>;
export type TransitionHkTaskBody = BodyOf<'transitionHkTask'>;
export type WorkOrder = Schemas['WorkOrder'];
export type WorkOrderCreate = Schemas['WorkOrderCreate'];
export type WorkOrderStatus = Schemas['WorkOrderStatus'];
export type WorkOrderCategory = Schemas['WorkOrderCategory'];
export type Severity = Schemas['Severity'];
export type UpdateWorkOrderBody = BodyOf<'updateWorkOrder'>;
export type TransitionWorkOrderBody = NonNullable<BodyOf<'transitionWorkOrder'>>;
export type WorkOrderAction = 'accept' | 'wait-parts' | 'resume' | 'complete' | 'cancel' | 'reopen';
export type RoomBlock = Schemas['RoomBlock'];
export type RoomBlockCreate = Schemas['RoomBlockCreate'];
export type RoomBlockStatus = Schemas['RoomBlockStatus'];
export type GuestRequest = Schemas['GuestRequest'];
export type GuestRequestStatus = Schemas['GuestRequestStatus'];
export type GuestRequestType = Schemas['GuestRequestType'];
export type TransitionGuestRequestBody = NonNullable<BodyOf<'transitionGuestRequest'>>;
export type Item = Schemas['Item'];
export type ItemInput = Schemas['ItemInput'];

// ---------- R3 Sprint 1 FE-B – S35 "Yêu cầu từ website" (US-155 Desk, OpenAPI 0.3.7 bổ sung 2, frozen in 0.3.8) ----------
export type WebsiteBookingRequest = Schemas['WebsiteBookingRequest'];
export type WebsiteBookingRequestStatus = Schemas['WebsiteBookingRequestStatus'];
export type WebsiteBookingRequestDeclineReason = Schemas['WebsiteBookingRequestDeclineReason'];
export type WebsiteBookingRequestTransition = Schemas['WebsiteBookingRequestTransition'];
/** Path segment of `transitionWebsiteBookingRequest` (SM-18 WR1–WR5, WR8). */
export type WebsiteBookingRequestAction =
  'claim' | 'release' | 'decline' | 'mark-spam' | 'reopen' | 'erase';
