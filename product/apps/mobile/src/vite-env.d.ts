/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `mock` = MSW in the browser (default in dev), `server` = real API through the Vite proxy. */
  readonly VITE_API_MODE?: 'mock' | 'server';
  /** Front desk phone for the "Call the front desk" buttons (public number, not a secret). */
  readonly VITE_DESK_PHONE?: string;
}
