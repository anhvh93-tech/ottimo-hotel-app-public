/**
 * Run async steps one after another and collect their results in order. Used instead of Promise.all for
 * queries on ONE transaction: a pg client executes one query at a time, and queuing several concurrently is
 * deprecated (pg warns "client.query() when the client is already executing a query").
 */
export async function inSequence<T extends readonly unknown[]>(steps: {
  [K in keyof T]: () => Promise<T[K]>;
}): Promise<T> {
  const out: unknown[] = [];
  for (const step of steps as readonly (() => Promise<unknown>)[]) out.push(await step());
  return out as unknown as T;
}
