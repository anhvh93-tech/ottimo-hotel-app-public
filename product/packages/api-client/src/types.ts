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
/** `409 ROOM_UNAVAILABLE` body extras (responses.RoomUnavailable example). */
export type RoomSuggestion = NonNullable<Problem['suggestions']>[number];
export interface RoomConflict {
  roomNo?: string;
  nights?: string[];
  kind?: 'reservation' | 'block' | string;
  reservationCode?: string;
  guestDisplayName?: string;
}

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
export type TrustDeviceBody = BodyOf<'trustCurrentDevice'>;
export type UpdateUserBody = BodyOf<'updateUser'>;
export type LookupGuestBody = BodyOf<'lookupGuestByContact'>;
export type ConfirmDepositBody = BodyOf<'confirmDeposit'>;
export type CancelReservationBody = BodyOf<'cancelReservation'>;
export type CancelReservationResult = ResponseOf<'cancelReservation'>;
export type MoveReservationBody = BodyOf<'moveReservation'>;
export type AssignRoomBody = BodyOf<'assignRoom'>;
export type DepositNoticeBody = BodyOf<'createDepositNotice'>;
export type SaveQuoteBody = BodyOf<'saveQuote'>;
export type CreateHoldBody = BodyOf<'createHoldFromQuote'>;
