// Builds src/modules/identity/public/common-passwords.txt (SR-AUTH-02, SEC s1-decisions mục 2).
//
//   node scripts/build-common-passwords.mjs [--seclists <file> ...]
//
// Source A (SecLists, MIT – danielmiessler/SecLists, Passwords/Common-Credentials/): local copies of the
// downloaded files are passed with --seclists (one or more). The script never downloads anything: the
// person who downloads records URL, commit, licence and date in common-passwords.SOURCE.md.
// Source B (team-authored, no licence constraint): Vietnamese / hotel / brand words × common suffixes,
// generated below from VI_BASE_WORDS (shared with the runtime "stripped suffix" check through
// common-password-bases.json).
//
// Normalisation = runtime normalisation (passwords.ts): NFKC, lower case, trimmed; keep length 10–256;
// de-duplicated; sorted (code-point order); UTF-8 without BOM, one entry per line.
// Prints the line count and the SHA-256 to copy into SOURCE.md.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const api = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(api, 'src', 'modules', 'identity', 'public');
const bases = JSON.parse(readFileSync(join(dir, 'common-password-bases.json'), 'utf8'));

const normalize = (s) => s.normalize('NFKC').toLowerCase().trim();
const MIN = 10;
const MAX = 256;

const years = [];
for (let y = 2020; y <= 2030; y++) years.push(String(y));
const shortYears = years.map((y) => y.slice(2));
const tails = [
  '123',
  '1234',
  '12345',
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '@123',
  '@1234',
  '!',
  '!!',
  '@',
  '#',
  '1',
  '12',
  '01',
  '99',
  '88',
  '68',
  '86',
  '000',
  '111',
  '666',
  '888',
];

const out = new Set();
const add = (s) => {
  const n = normalize(s);
  if (n.length >= MIN && n.length <= MAX && !/[\r\n]/.test(n)) out.add(n);
};

// Source B
for (const w of bases.words) {
  add(w);
  for (const t of tails) add(w + t);
  for (const y of years) {
    add(w + y);
    add(`${w}@${y}`);
    add(`${w}${y}!`);
    add(`${w}@${y}!`);
    add(`${w}#${y}`);
    add(`${w}_${y}`);
    add(`${w}.${y}`);
  }
  for (const y of shortYears) {
    add(w + y);
    add(`${w}@${y}`);
  }
  for (const v of bases.words) if (v !== w) add(w + v);
}
const sourceB = out.size;

// Source A
const args = process.argv.slice(2);
let sourceA = 0;
for (let i = 0; i < args.length; i++) {
  if (args[i] !== '--seclists') continue;
  const file = args[++i];
  if (!file) throw new Error('--seclists needs a file');
  const before = out.size;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) add(line);
  sourceA += out.size - before;
}

const sorted = [...out].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const text = `${sorted.join('\n')}\n`;
writeFileSync(join(dir, 'common-passwords.txt'), text, 'utf8');
const sha = createHash('sha256').update(text, 'utf8').digest('hex');
console.log(
  JSON.stringify({ lines: sorted.length, sourceB, sourceAAdded: sourceA, sha256: sha }, null, 2),
);
if (sorted.length < 10_000) {
  console.error(
    `WARNING: ${sorted.length} < 10000 lines – staging/production refuse to start (SR-AUTH-02). ` +
      'Add the SecLists files with --seclists.',
  );
}
