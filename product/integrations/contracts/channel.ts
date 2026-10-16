// ChannelAdapter contract (README section 3.1 v0.2). Owner: INT. R2 Mock, R3 Beds24.
// Signatures copied verbatim from README v0.2 – change only through ARC.
import type {
  HealthStatus,
  InboundHttp,
  IntegrationContext,
  IsoInstant,
  LocalDate,
} from './common.js';

export type ChannelCode =
  'airbnb' | 'booking' | 'agoda' | 'expedia' | 'tripcom' | 'traveloka' | 'other';

export interface PushResult {
  accepted: number;
  requests: number;
  creditsUsed?: number;
  warnings?: string[];
}

/** Half-open range [from, to). The adapter splits into batches per provider API limits (ARC-09). */
export interface AvailabilityRange {
  roomRef: string;
  from: LocalDate;
  to: LocalDate;
  available: number;
  closed?: boolean;
}

export interface RateRange {
  roomRef: string;
  ratePlanRef: string;
  from: LocalDate;
  to: LocalDate;
  /** Integer VND (ADR-002). */
  amountVnd: number;
}

/** Sales restrictions (DOM-08): min stay by arrival, CTA, CTD, stop sell. */
export interface RestrictionRange {
  roomRef: string;
  ratePlanRef?: string;
  channel?: ChannelCode;
  from: LocalDate;
  to: LocalDate;
  minStayArrival?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  stopSell?: boolean;
}

export type ChannelBookingHint = 'new' | 'modified' | 'cancelled';

/** Webhook = signal only (ARC-04, SEC-02): used to write inbox_message, never trusted as content. */
export interface ChannelWebhookSignal {
  eventId: string;
  externalId: string;
  hint?: ChannelBookingHint;
}

export interface InventorySnapshotRow {
  roomRef: string;
  from: LocalDate;
  to: LocalDate;
  available: number;
  closed: boolean;
}

export interface ChannelGuest {
  name: string;
  phone?: string;
  email?: string;
  emailIsRelay?: boolean;
  country?: string;
  locale?: string;
}

/** One element per room. Contains NO card fields (README 3.1, SEC-01). */
export interface ChannelBooking {
  /** Channel-manager booking id for this room. */
  externalId: string;
  /** Original booking id when one OTA booking has several rooms → core creates linked reservations. */
  groupRef?: string;
  channel: ChannelCode;
  /** OTA booking reference shown to front desk. */
  otaRef?: string;
  status: 'new' | 'modified' | 'cancelled';
  /** Idempotency and out-of-order protection. */
  modifiedAt: IsoInstant;
  /** Mapped through channel_mapping (erd 4.12). */
  externalRoomRef: string;
  ratePlanRef?: string;
  checkIn: LocalDate;
  checkOut: LocalDate;
  adults: number;
  children: number;
  guest: ChannelGuest;
  /** ISO 4217. */
  currency: string;
  /** Integer, minor unit of currency. */
  amountOriginal: number;
  /** Only when the channel manager already converted. */
  amountVnd?: number;
  channelFee?: { amount: number; currency: string; isEstimate: boolean };
  /** DOM-05c – OTA collects or guest pays at the property. */
  collectModel: 'ota_collect' | 'hotel_collect' | 'unknown';
  /** Allowlisted fields only (README 1.8); purged after 90 days. */
  rawFiltered?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface ChannelAdapter {
  pushAvailability(ctx: IntegrationContext, ranges: AvailabilityRange[]): Promise<PushResult>;
  pushRates(ctx: IntegrationContext, ranges: RateRange[]): Promise<PushResult>;
  pushRestrictions(ctx: IntegrationContext, ranges: RestrictionRange[]): Promise<PushResult>;
  parseWebhookSignal(ctx: IntegrationContext, req: InboundHttp): Promise<ChannelWebhookSignal>;
  /** Worker J19 ALWAYS re-fetches before writing. Array: one element per room. */
  fetchBooking(ctx: IntegrationContext, externalId: string): Promise<ChannelBooking[] | null>;
  fetchBookingsModifiedSince(ctx: IntegrationContext, since: IsoInstant): Promise<ChannelBooking[]>;
  getInventorySnapshot(
    ctx: IntegrationContext,
    from: LocalDate,
    to: LocalDate,
  ): Promise<InventorySnapshotRow[]>;
  /** No-show → core creates a manual task when absent (DOM-05b). */
  reportNoShow?(ctx: IntegrationContext, externalId: string): Promise<void>;
  /** OTA inbox (DOM-06). */
  sendGuestMessage?(
    ctx: IntegrationContext,
    externalId: string,
    text: string,
  ): Promise<{ providerMsgId: string }>;
  healthCheck(ctx: IntegrationContext): Promise<HealthStatus>;
}
