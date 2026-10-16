/**
 * RFC 9457 problem+json errors with the OpenAPI `Problem.code` (coding-standards 7.3, OpenAPI "Mã lỗi").
 * HTTP status always comes from the generated code table – a handler cannot pair a code with a wrong status.
 * Never exposes stack traces, SQL, table names or C2/C3 values: `detail` is for developers and must be
 * written without user data; clients display by `code`.
 */
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
  type LoggerService,
} from '@nestjs/common';
import { describeError } from './redact';
import { OPENAPI_META } from '../generated/openapi-meta';

/** Codes outside the OpenAPI table (proposed to ARC, see d0-foundation.md): unexpected server error. */
const EXTRA_CODES = { INTERNAL_ERROR: 500 } as const;

export type ProblemCode = string;

export interface FieldError {
  field: string;
  code: string;
  message?: string;
}

export interface ProblemBody {
  type: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  instance?: string;
  requestId?: string;
  errors?: FieldError[];
  [extra: string]: unknown;
}

export function statusForCode(code: string): number {
  const status =
    OPENAPI_META.problemCodes[code] ?? (EXTRA_CODES as Record<string, number>)[code] ?? undefined;
  if (status === undefined) throw new Error(`Unknown Problem.code ${code} (not in OpenAPI table)`);
  return status;
}

function kebab(code: string): string {
  return code.toLowerCase().replace(/_/g, '-');
}

function titleFor(code: string): string {
  const words = code.toLowerCase().split('_').join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Domain/HTTP error carrying a Problem.code. Throw it anywhere; ProblemFilter renders it. */
export class ProblemError extends Error {
  readonly status: number;
  constructor(
    readonly code: ProblemCode,
    readonly options: {
      detail?: string;
      errors?: FieldError[];
      /** Documented extension members (conflicts, suggestions, min, max, allowed…). */
      extras?: Record<string, unknown>;
      headers?: Record<string, string>;
    } = {},
  ) {
    super(options.detail ?? code);
    this.name = 'ProblemError';
    this.status = statusForCode(code);
  }

  toBody(requestId?: string): ProblemBody {
    return {
      ...(this.options.extras ?? {}),
      type: `/problems/${kebab(this.code)}`,
      title: titleFor(this.code),
      status: this.status,
      code: this.code,
      ...(this.options.detail ? { detail: this.options.detail } : {}),
      ...(this.options.errors ? { errors: this.options.errors } : {}),
      ...(requestId ? { requestId } : {}),
    };
  }
}

export const problem = (
  code: ProblemCode,
  options?: ConstructorParameters<typeof ProblemError>[1],
): ProblemError => new ProblemError(code, options);

/** Map framework HTTP errors (route not found, body too large, bad JSON…) onto the code table. */
function fromHttpStatus(status: number): ProblemError {
  switch (status) {
    case 400:
    case 415:
      return new ProblemError('VALIDATION_FAILED', { detail: 'Malformed request' });
    case 401:
      return new ProblemError('UNAUTHENTICATED');
    case 403:
      return new ProblemError('FORBIDDEN_ACTION');
    case 404:
    case 405:
      return new ProblemError('NOT_FOUND');
    case 413:
      return new ProblemError('PAYLOAD_TOO_LARGE');
    case 422:
      return new ProblemError('VALIDATION_FAILED');
    case 429:
      return new ProblemError('RATE_LIMITED');
    default:
      return new ProblemError('INTERNAL_ERROR');
  }
}

interface ReplyLike {
  status(code: number): ReplyLike;
  header(name: string, value: string): ReplyLike;
  send(body: unknown): unknown;
}

interface RequestLike {
  id?: string;
}

@Catch()
export class ProblemFilter implements ExceptionFilter {
  constructor(private readonly logger?: Pick<LoggerService, 'error'>) {}

  static create(): ProblemFilter {
    return new ProblemFilter(new Logger('ProblemFilter'));
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<ReplyLike>();
    const req = ctx.getRequest<RequestLike>();

    let err: ProblemError;
    if (exception instanceof ProblemError) {
      err = exception;
    } else if (exception instanceof HttpException) {
      err = fromHttpStatus(exception.getStatus());
    } else if (isFastifyError(exception)) {
      err = fromHttpStatus(exception.statusCode);
    } else {
      err = new ProblemError('INTERNAL_ERROR');
      // Never the request body (may hold C2/C3); the message itself is redacted (SR-LOG-04, SEC-BE-13):
      // PostgreSQL errors → code/constraint/routine only, others → class + redacted message.
      this.logger?.error(`unhandled error requestId=${req.id ?? '-'} ${describeError(exception)}`);
    }
    for (const [name, value] of Object.entries(err.options.headers ?? {}))
      reply.header(name, value);
    reply
      .status(err.status)
      .header('content-type', 'application/problem+json')
      .send(err.toBody(req.id));
  }
}

function isFastifyError(e: unknown): e is { statusCode: number } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'statusCode' in e &&
    typeof (e as { statusCode: unknown }).statusCode === 'number' &&
    (e as { statusCode: number }).statusCode >= 400 &&
    (e as { statusCode: number }).statusCode < 500
  );
}
