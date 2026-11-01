/**
 * One JSON log line of the worker: `{"level":…,"msg":…,…extra}`. `level` and `msg` are written last as well, so an
 * extra field can never overwrite them (OPS: `chat detail level` once logged `"level":"A"` – the Chat detail level
 * replaced the log level; that field is `detailLevel` now).
 */
export function logLine(level: string, msg: string, extra: Record<string, unknown> = {}): string {
  // A `toJSON` key would replace the whole line (SEC FB-R4-SEC-BE-PR24-04): never copied.
  const rest: Record<string, unknown> = { ...extra };
  delete rest.toJSON;
  return JSON.stringify(Object.assign({ level, msg }, rest, { level, msg }));
}
