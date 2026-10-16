import type { FieldError, Problem } from './types';

/** Pseudo-code for a request that never reached the server (offline, DNS, CORS…). */
export const NETWORK_ERROR = 'NETWORK_ERROR';

/**
 * Every failed call throws ApiError. `problem` is the RFC 9457 body (application/problem+json);
 * for responses without a problem body we synthesise one so the UI always has a `code`.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: Problem;
  /** Seconds from `Retry-After` (429). */
  readonly retryAfterSeconds?: number;

  constructor(status: number, problem: Problem, retryAfterSeconds?: number) {
    super(`${status} ${problem.code}`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  get code(): string {
    return this.problem.code;
  }

  /** Reference shown to the user for 5xx / unknown errors (coding-standards 12). */
  get requestId(): string | undefined {
    return this.problem.requestId;
  }

  get fieldErrors(): FieldError[] {
    return this.problem.errors ?? [];
  }

  get isNetwork(): boolean {
    return this.problem.code === NETWORK_ERROR;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export function networkError(): ApiError {
  return new ApiError(0, {
    type: '/problems/network',
    title: 'Network error',
    status: 0,
    code: NETWORK_ERROR,
  });
}

export function syntheticProblem(status: number, requestId?: string): Problem {
  const code =
    status === 401
      ? 'UNAUTHENTICATED'
      : status === 403
        ? 'FORBIDDEN_ACTION'
        : status === 404
          ? 'NOT_FOUND'
          : status === 412
            ? 'VERSION_CONFLICT'
            : status === 429
              ? 'RATE_LIMITED'
              : 'INTERNAL_ERROR';
  return { type: 'about:blank', title: String(status), status, code, requestId };
}

export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds));
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, Math.round((at - Date.now()) / 1000));
}
