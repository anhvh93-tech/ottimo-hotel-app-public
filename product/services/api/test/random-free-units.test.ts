/** test/helpers/random-free.ts – the leak scan leaves out random ids, never the data it looks for. */
import { describe, expect, it } from 'vitest';
import { withoutRandomIds } from './helpers/random-free';

describe('withoutRandomIds', () => {
  it('the US-022 body of CI run 42282981812: "2018" was only inside a random guest id', () => {
    const body = JSON.stringify({
      members: [
        {
          id: '01a1b28a-2942-713a-a726-da8fdbe0041b',
          guest: { id: '01a1b28a-2018-776f-bba4-fa3edd89acad', code: 'KH-a8e95c' },
        },
        { id: '01a1b28a-29e0-7162-b88f-8aee5a76bd03', role: 'child', priceAgeBand: 'child_6_11' },
      ],
      requestId: 'e7a82441-788f-473c-8b31-fa1e15c1d149',
    });
    expect(body).toContain('2018');
    const scanned = withoutRandomIds(body);
    expect(scanned).not.toContain('2018');
    expect(scanned).toContain('"code":"KH-<code>"');
    expect(scanned).toContain('"priceAgeBand":"child_6_11"');
  });

  it('a real leak stays: a year, a card group, a name, a server code', () => {
    for (const leak of [
      '{"childBirthYear":2018}',
      '{"note":"4111 1111"}',
      '{"name":"Bé Na"}',
      '{"code":"KH-2018"}',
    ]) {
      expect(withoutRandomIds(leak)).toBe(leak);
    }
    // A short id-like run that is not a whole UUID is kept too.
    expect(withoutRandomIds('ref 2018-0001')).toBe('ref 2018-0001');
  });
});
