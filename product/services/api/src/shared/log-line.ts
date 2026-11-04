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

/** Error fields safe to log: constructor name and a short code, never the message (SEC S-1). */
export function errorTag(err: unknown): { err: string; code?: string } {
  const name = err instanceof Error ? err.name : 'error';
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' && /^[A-Za-z0-9_.:-]{1,40}$/.test(code)
    ? { err: name, code }
    : { err: name };
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
