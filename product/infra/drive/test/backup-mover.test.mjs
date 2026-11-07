// Tests of the decisions of the Apps Script mover (infra/drive/apps-script/Code.gs): which files go from Nhận to Kho,
// which are refused, the 35-day retention in Kho (same rule as backup.sh) and the 36 h watchdog.
//   node --test product/infra/drive/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
const sandbox = { module: { exports: {} } };
vm.runInNewContext(src, sandbox);
// Results come from another realm (vm): clone them so deepStrictEqual compares plain values.
const M = Object.fromEntries(Object.entries(sandbox.module.exports).map(([k, v]) =>
  [k, typeof v === 'function' ? (...a) => JSON.parse(JSON.stringify(v(...a)) ?? 'null') : v]));

const H = 3600e3, D = 24 * H;
const NOW = Date.UTC(2026, 10, 7, 8, 0, 0); // Sat 07/11/2026 08:00 UTC
const st = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const hex = (c) => c.repeat(64);
let nid = 0;
const file = (name, extra = {}) => ({ id: 'f' + ++nid, name, size: 1000, sha256: '', createdMs: NOW - 10 * 60e3, ...extra });
const set = (ms, opts = {}) => {
  const s = st(ms), out = [];
  for (const n of [`db-${s}.dump.age`, `blobs-${s}.tar.age`, `counts-${s}.txt.age`, `purge-journal-${s}.csv.age`]) {
    out.push(file(n, { sha256: hex('a') }), file(n + '.sha256', { size: 100 }));
  }
  return opts.only ? out.filter((f) => f.name.startsWith(opts.only)) : out;
};

test('parseName: backup names only, extension must match the kind', () => {
  assert.equal(M.parseName('db-20261107T080000Z.dump.age').kind, 'db');
  assert.equal(M.parseName('db-20261107T080000Z.dump.age.sha256').isSum, true);
  assert.equal(M.parseName('db-20261107T080000Z.tar.age'), null);
  assert.equal(M.parseName('notes.txt'), null);
  assert.equal(M.parseName('db-20261107T080000Z.dump'), null);
});

test('planMoves: a verified pair is copied, a pair without .sha256 waits, a wrong checksum is refused', () => {
  const a = file('db-20261107T070000Z.dump.age', { sha256: hex('b') });
  const as = file('db-20261107T070000Z.dump.age.sha256', { size: 100 });
  const b = file('blobs-20261107T070000Z.tar.age', { sha256: hex('c') });
  const bs = file('blobs-20261107T070000Z.tar.age.sha256', { size: 100 });
  const c = file('counts-20261107T070000Z.txt.age', { sha256: hex('d') });
  const sums = { [as.id]: `${hex('b')}  ${a.name}\n`, [bs.id]: `${hex('e')}  ${b.name}\n` };
  const p = M.planMoves([a, as, b, bs, c], [], sums, NOW);
  assert.deepEqual(p.copy.map((x) => x.name), [a.name]);
  assert.equal(p.alerts.length, 1);
  assert.match(p.alerts[0].text, /1 file\(s\) in Nhận refused/);
});

test('planMoves: stamps far in the past or future, duplicates and big .sha256 are refused', () => {
  const old = file(`db-${st(NOW - 8 * D)}.dump.age`, { sha256: hex('b') });
  const olds = file(old.name + '.sha256', { size: 100 });
  const fut = file(`db-${st(NOW + 2 * D)}.dump.age`, { sha256: hex('b') });
  const futs = file(fut.name + '.sha256', { size: 100 });
  const big = file('counts-20261107T070000Z.txt.age', { sha256: hex('b') });
  const bigs = file(big.name + '.sha256', { size: 5000 });
  const d1 = file('blobs-20261107T070000Z.tar.age', { sha256: hex('b') });
  const d2 = file('blobs-20261107T070000Z.tar.age', { sha256: hex('b') });
  const ds = file('blobs-20261107T070000Z.tar.age.sha256', { size: 100 });
  const sums = {};
  for (const [f, s] of [[old, olds], [fut, futs], [big, bigs], [d1, ds]]) sums[s.id] = `${hex('b')}  ${f.name}`;
  const p = M.planMoves([old, olds, fut, futs, big, bigs, d1, d2, ds], [], sums, NOW);
  assert.equal(p.copy.length, 0);
  assert.match(p.alerts[0].text, /^4 file\(s\) in Nhận refused/);
});

test('planMoves: already in Kho with the same bytes → originals removed; other bytes → refused, nothing removed', () => {
  const a = file('db-20261107T070000Z.dump.age', { sha256: hex('b') });
  const as = file(a.name + '.sha256', { size: 100 });
  const sums = { [as.id]: `${hex('b')}  ${a.name}` };
  const same = M.planMoves([a, as], [file(a.name, { sha256: hex('b') }), file(a.name + '.sha256')], sums, NOW);
  assert.deepEqual(same.removeInbox.sort(), [a.id, as.id].sort());
  assert.equal(same.copy.length, 0);
  const other = M.planMoves([a, as], [file(a.name, { sha256: hex('9') }), file(a.name + '.sha256')], sums, NOW);
  assert.equal(other.removeInbox.length, 0);
  assert.equal(other.copy.length, 0);
  assert.equal(other.alerts[0].key, 'inbox-refused');
});

test('planMoves: checksum not computed yet → waits; alert only after 6 h; probes removed after 10 min', () => {
  const a = file('db-20261107T070000Z.dump.age', { sha256: '' });
  const as = file(a.name + '.sha256', { size: 100 });
  const sums = { [as.id]: `${hex('b')}  ${a.name}` };
  assert.equal(M.planMoves([a, as], [], sums, NOW).alerts.length, 0);
  a.createdMs = NOW - 7 * H;
  assert.equal(M.planMoves([a, as], [], sums, NOW).alerts[0].key, 'inbox-waiting');
  const p1 = file('probe-20261107T075500Z.txt', { createdMs: NOW - 5 * 60e3 });
  const p2 = file('probe-20261107T070000Z.txt', { createdMs: NOW - 60 * 60e3 });
  assert.deepEqual(M.planMoves([p1, p2], [], {}, NOW).removeInbox, [p2.id]);
});

test('planRetention: < 7 d kept, Sunday sets < 33 d, purge-journal < 40 d, unknown names untouched', () => {
  const sunday = Date.UTC(2026, 9, 11, 8, 0, 0); // Sun 11/10/2026, 27 days before NOW
  const monday = Date.UTC(2026, 9, 12, 8, 0, 0); // 26 days
  const sunOld = Date.UTC(2026, 9, 4, 8, 0, 0); //  Sun, 34 days
  const vault = [...set(NOW - 1 * D), ...set(NOW - 6.9 * D), ...set(NOW - 7.1 * D), ...set(sunday), ...set(monday),
                 ...set(sunOld), file(`purge-journal-${st(NOW - 39 * D)}.csv.age`), file(`purge-journal-${st(NOW - 41 * D)}.csv.age`),
                 file('README.txt')];
  const p = M.planRetention(vault, NOW);
  const removed = new Set(vault.filter((f) => p.remove.includes(f.id)).map((f) => f.name));
  const kept = vault.filter((f) => !p.remove.includes(f.id)).map((f) => f.name);
  for (const n of removed) assert.ok(!n.includes(st(NOW - 1 * D)) && !n.includes(st(NOW - 6.9 * D)) && !n.includes(st(sunday)), n);
  assert.ok(kept.some((n) => n.includes(st(sunday))));
  assert.ok(removed.has(`db-${st(NOW - 7.1 * D)}.dump.age`));
  assert.ok(removed.has(`db-${st(monday)}.dump.age`));
  assert.ok(removed.has(`db-${st(sunOld)}.dump.age.sha256`));
  assert.ok(removed.has(`purge-journal-${st(sunOld)}.csv.age`) === false, 'purge-journal of 34 days is kept');
  assert.ok(kept.includes(`purge-journal-${st(NOW - 39 * D)}.csv.age`));
  assert.ok(removed.has(`purge-journal-${st(NOW - 41 * D)}.csv.age`));
  assert.ok(kept.includes('README.txt'));
  assert.equal(p.alerts[0].key, 'vault-unknown');
});

test('planRetention: 45 days of daily runs – no file but purge-journal ever older than 35 days', () => {
  let vault = [];
  for (let day = 0; day < 45; day++) {
    const now = NOW + day * D;
    vault.push(...set(now - 4 * H), ...set(now + 8 * H));
    const p = M.planRetention(vault, now);
    vault = vault.filter((f) => !p.remove.includes(f.id));
    for (const f of vault) {
      const x = M.parseName(f.name);
      if (x && x.kind !== 'purge-journal') assert.ok(now - x.stamp < 35 * D, `${f.name} at day ${day}`);
      if (x && x.kind === 'purge-journal') assert.ok(now - x.stamp < 41 * D);
    }
  }
});

test('planRetention: the newest complete set is never removed, with an alert', () => {
  const vault = set(NOW - 50 * D);
  const p = M.planRetention(vault, NOW);
  assert.equal(p.remove.filter((id) => vault.find((f) => f.id === id).name.startsWith('db-')).length, 0);
  assert.ok(p.alerts.some((a) => a.key === 'vault-kept-old'));
});

test('vaultHealth: newest db dump < 36 h ok, ≥ 36 h or none → alert', () => {
  assert.equal(M.vaultHealth(set(NOW - 35 * H), NOW).alerts.length, 0);
  assert.equal(M.vaultHealth(set(NOW - 37 * H), NOW).alerts[0].key, 'vault-stale');
  assert.equal(M.vaultHealth([], NOW).alerts[0].key, 'vault-stale');
  assert.equal(M.vaultHealth(set(NOW - 2 * H), NOW).sets, 1);
});
