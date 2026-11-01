/**
 * One JSON log line of the worker: `{"level":…,"msg":…,…extra}`. `level` and `msg` are written last as well, so an
 * extra field can never overwrite them (OPS: `chat detail level` once logged `"level":"A"` – the Chat detail level
 * replaced the log level; that field is `detailLevel` now).
 */
export function logLine(level: string, msg: string, extra: Record<string, unknown> = {}): string {
  return JSON.stringify(Object.assign({ level, msg }, extra, { level, msg }));
}
