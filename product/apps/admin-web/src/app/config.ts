export type ApiMode = 'mock' | 'server';

/** Dev defaults to the MSW mock so FE does not depend on a running API; production always uses the server. */
export function apiMode(): ApiMode {
  if (!import.meta.env.DEV) return 'server';
  return import.meta.env.VITE_API_MODE === 'server' ? 'server' : 'mock';
}
