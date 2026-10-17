import { Fragment, type ReactNode } from 'react';

type Translate = (key: string, args?: Record<string, string | number>) => string;
const MARK = '\u0000';

/**
 * DS v0.4.1 §11.6 B1: codes (booking code, folio number, VietQR transfer content, registration / work-order
 * code, Wi-Fi) are set in JetBrains Mono (`.mono`) – but only the value: the sentence around it stays in the
 * UI font. Translates `key` with `args` and wraps the values of the `mono` args in `<span class="mono">`.
 * The visible text equals `t(key, args)` (screen readers and copy/paste read the same sentence).
 */
export function monoArgs(
  t: Translate,
  key: string,
  args: Record<string, string | number>,
  mono: string[],
): ReactNode {
  const marked: Record<string, string | number> = { ...args };
  for (const k of mono) marked[k] = `${MARK}${k}${MARK}`;
  const parts = t(key, marked).split(new RegExp(`${MARK}(\\w+)${MARK}`));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="mono">
            {String(args[p] ?? '')}
          </span>
        ) : p ? (
          <Fragment key={i}>{p}</Fragment>
        ) : null,
      )}
    </>
  );
}

/** A code on its own (Topbar subtitle, drawer meta, list cell). */
export function Code({ children }: { children: ReactNode }) {
  return <span className="mono">{children}</span>;
}
