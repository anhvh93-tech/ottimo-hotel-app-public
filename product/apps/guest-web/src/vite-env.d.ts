/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `mock` = MSW in the browser (default in dev), `server` = real API through the Vite proxy. */
  readonly VITE_API_MODE?: 'mock' | 'server';
  /** Public desk phone for the "link expired" page (no session = no property phone). */
  readonly VITE_DESK_PHONE?: string;
}
