// Tiny inline markup for copy strings: [[…]] = a run that never breaks (`.nw`, concept T7), e.g. "[[07:00–22:00]]".
export interface Segment {
  text: string;
  nowrap: boolean;
}

export function segments(text: string): Segment[] {
  const out: Segment[] = [];
  const re = /\[\[(.+?)\]\]/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), nowrap: false });
    out.push({ text: m[1] ?? '', nowrap: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), nowrap: false });
  return out;
}

/** The text as read (markup removed) – for meta tags, tests and scripts. */
export function plain(text: string): string {
  return text.replace(/\[\[(.+?)\]\]/g, '$1');
}
