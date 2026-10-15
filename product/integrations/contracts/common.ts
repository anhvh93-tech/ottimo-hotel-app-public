// Shared integration contracts (README section 1 and 3.0). Owner: INT.
// The core (services/api) may import ONLY from '@ottimo/integrations/contracts'.

/** Calendar date 'YYYY-MM-DD' in property.timezone. Ranges are half-open [from, to). */
export type LocalDate = string & { readonly __brand: 'LocalDate' };
/** ISO 8601 instant WITH offset, e.g. '2026-10-20T14:00:00+07:00'. */
export type IsoInstant = string & { readonly __brand: 'IsoInstant' };

const LOCAL_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ISO_INSTANT_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;

export function localDate(value: string): LocalDate {
  if (!LOCAL_DATE_RE.test(value)) {
    throw new IntegrationError('INVALID_REQUEST', `Invalid LocalDate: ${value}`);
  }
  return value as LocalDate;
}

export function isoInstant(value: string): IsoInstant {
  if (!ISO_INSTANT_RE.test(value) || Number.isNaN(Date.parse(value))) {
    throw new IntegrationError('INVALID_REQUEST', `Invalid IsoInstant: ${value}`);
  }
  return value as IsoInstant;
}

/** Passed as first argument to every adapter method (ADR-007 multi-property). */
export interface IntegrationContext {
  propertyId: string;
  credentialsRef: string;
  requestId: string;
}

export type IntegrationErrorCode =
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE'
  | 'AUTH'
  | 'CONFIG'
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNKNOWN';

const RETRYABLE: Readonly<Record<IntegrationErrorCode, boolean>> = {
  TIMEOUT: true,
  RATE_LIMITED: true,
  UNAVAILABLE: true,
  AUTH: false,
  CONFIG: false,
  INVALID_REQUEST: false,
  NOT_FOUND: false,
  CONFLICT: false,
  UNKNOWN: true,
};

/** The only error type adapters may throw. providerMessage must be PII/secret-free. */
export class IntegrationError extends Error {
  readonly code: IntegrationErrorCode;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;
  readonly providerMessage?: string;

  constructor(
    code: IntegrationErrorCode,
    message: string,
    opts: { retryAfterMs?: number; providerMessage?: string; retryable?: boolean } = {},
  ) {
    super(message);
    this.name = 'IntegrationError';
    this.code = code;
    this.retryable = opts.retryable ?? RETRYABLE[code];
    if (opts.retryAfterMs !== undefined) this.retryAfterMs = opts.retryAfterMs;
    if (opts.providerMessage !== undefined) this.providerMessage = opts.providerMessage;
  }
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  checkedAt: IsoInstant;
  detail?: string;
}

/** Inbound webhook/IPN request as seen by an adapter. rawBody never leaves memory. */
export interface InboundHttp {
  method: 'GET' | 'POST';
  headers: Readonly<Record<string, string>>;
  query: Readonly<Record<string, string>>;
  rawBody: string;
  sourceIp: string;
}

/** Adapters never read process.env; they get credentials through this. */
export interface CredentialProvider {
  get(credentialsRef: string): Promise<Readonly<Record<string, string>>>;
}

export const MOCK_SCENARIOS = [
  'ok',
  'timeout',
  'rate_limited',
  'unavailable',
  'auth_error',
  'invalid_signature',
  'duplicate_callback',
  'late_callback',
  'callback_before_response',
  'amount_mismatch',
  'merchant_mismatch',
  'conflict_booking',
  'out_of_order',
  'card_data_in_payload',
] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export function isMockScenario(value: string): value is MockScenario {
  return (MOCK_SCENARIOS as readonly string[]).includes(value);
}

/** Maps transport-level mock scenarios to the error an adapter would throw. */
export function errorForScenario(scenario: MockScenario): IntegrationError | null {
  switch (scenario) {
    case 'timeout':
      return new IntegrationError('TIMEOUT', 'Mock timeout');
    case 'rate_limited':
      return new IntegrationError('RATE_LIMITED', 'Mock rate limited', { retryAfterMs: 60_000 });
    case 'unavailable':
      return new IntegrationError('UNAVAILABLE', 'Mock provider unavailable');
    case 'auth_error':
      return new IntegrationError('AUTH', 'Mock credentials rejected');
    default:
      return null;
  }
}
