/**
 * One JSON log line of the worker: `{"level":…,"msg":…,…extra}`. `level` and `msg` are written last as well, so an
 * extra field can never overwrite them (OPS: `chat detail level` once logged `"level":"A"` – the Chat detail level
 * replaced the log level; that field is `detailLevel` now).
 *
 * Never throws (ARC FB-R4-ARC-BE-PR24PM-03): a field that cannot be serialized (BigInt, a cycle, a throwing getter or
 * `toJSON`) gives `{"level":…,"msg":…,"logError":"UNSERIALIZABLE"}` – the other fields are dropped, never printed
 * half-way, and a log call can never turn into a job failure.
 */
export function logLine(level: string, msg: string, extra: Record<string, unknown> = {}): string {
  try {
    // A `toJSON` key would replace the whole line (SEC FB-R4-SEC-BE-PR24-04): never copied.
    const rest: Record<string, unknown> = { ...extra };
    delete rest.toJSON;
    return JSON.stringify(Object.assign({ level, msg }, rest, { level, msg }));
  } catch {
    return JSON.stringify({ level: String(level), msg: String(msg), logError: 'UNSERIALIZABLE' });
  }
}

/** A short machine code (SQLSTATE, `ECONNREFUSED`, `EENVELOPE:550:5.1.1`): letters, digits and `_.:-`, ≤ 40. */
const SAFE_CODE = /^[A-Za-z0-9_.:-]{1,40}$/;
/** An error class name (`DatabaseError`, `TypeError`): an identifier, ≤ 60. */
const SAFE_NAME = /^[A-Za-z_$][A-Za-z0-9_$]{0,59}$/;

/**
 * `value` when it is a short machine code, otherwise undefined. For codes that come from OUTSIDE this codebase
 * (an adapter's `providerMessage`, a health-check `detail`): only that shape is ever logged or stored, never text.
 */
export function safeCode(value: unknown): string | undefined {
  return typeof value === 'string' && SAFE_CODE.test(value) ? value : undefined;
}

/**
 * Error fields safe to log: class name and a short code, never the message (SEC S-1; V5-42, FB-R4-SEC-BE-BED-02/03/05).
 * A message from PostgreSQL, SMTP or an HTTP library may quote a value (an e-mail address, a name, a token).
 * The name itself is checked too: a non-identifier name (set by hand on some library errors) logs as `Error`.
 */
export function errorTag(err: unknown): { err: string; code?: string } {
  const raw = err instanceof Error ? err.name : 'error';
  const name = SAFE_NAME.test(raw) ? raw : 'Error';
  const code = safeCode((err as { code?: unknown } | null)?.code);
  return code ? { err: name, code } : { err: name };
}

/** `errorTag` as plain text, for loggers that take one string (`Name` or `Name (code)`). */
export function errorText(err: unknown): string {
  const tag = errorTag(err);
  return tag.code ? `${tag.err} (${tag.code})` : tag.err;
}

/**
 * Writes one `logLine` to stdout. The worker and the jobs log only through this module: ESLint `no-console` holds
 * for `src/worker*.ts` and `src/jobs/**` (ARC FB-R4-ARC-BE-PR24PM-04), so no job can print a raw
 * `console.log(JSON.stringify(…))` line again.
 */
export function writeLogLine(
  level: string,
  msg: string,
  extra: Record<string, unknown> = {},
): void {
  console.log(logLine(level, msg, extra));
}

/** The same line on stderr: the worker's last line before it exits on a startup failure (was a raw `console.error`). */
export function writeErrorLine(msg: string, extra: Record<string, unknown> = {}): void {
  console.error(logLine('error', msg, extra));
}
