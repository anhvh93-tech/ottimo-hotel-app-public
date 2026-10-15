/** Response of GET /health (architecture.md section 17). */
export interface HealthResponse {
  status: 'ok' | 'error';
  db: 'ok' | 'down';
  /** ISO-8601 timestamp in the property time zone, e.g. 2026-10-15T09:30:00.000+07:00 */
  time: string;
}
