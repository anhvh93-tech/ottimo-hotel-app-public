import { createApiClient, createEndpoints, type ApiError } from '@ottimo/api-client';

type ErrorListener = (error: ApiError) => void;

// CSRF token lives in memory only (from Me.csrfToken) – never in localStorage/sessionStorage (SR-SES).
let csrfToken: string | undefined;
const listeners = new Set<ErrorListener>();

export function setCsrfToken(token: string | undefined) {
  csrfToken = token;
}

/** Session layer subscribes to global problems (401 expired session, 403 password change…). */
export function onApiError(listener: ErrorListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const client = createApiClient({
  getCsrfToken: () => csrfToken,
  onError: (error) => listeners.forEach((l) => l(error)),
});

export const api = createEndpoints(client);
export type Api = typeof api;

/**
 * The raw client, for operations not yet in the generated contract. FB-INV-012 (`app/statements.ts`) calls the
 * billing endpoints of ARC contract 0.3.14-draft until the BE PR regenerates `@ottimo/api-client`.
 */
export const apiClient = client;
