// BUG-R3-015: TOTP of the DS-E accounts on stacks with MFA_ENFORCED=true (staging, production, a disposable stack
// started with the flag). The secret lives OUTSIDE the repo, in the directory E2E_TOTP_DIR (one file per account,
// mode 0600 – never printed, never in an assertion message, never attached – SEC 06.22):
//   <username>.secret        base32 secret (the key shown once at enrolment)
//   <username>.recovery.txt  the 10 recovery codes of that enrolment (written by the harness when it enrols)
//   <username>.laststep      last 30-second step used by the harness (anti-replay SEC 06.18, shared by every worker
//                            and every run – the server refuses a code whose step ≤ the last step of that user)
// E2E_TOTP_ENROLL=1 lets the harness enrol an account that the stack holds in the restricted "enrol first" session
// (SEC 06.4) – only for disposable stacks / staging test accounts, never for a real person's account.
// Codes are computed from the host clock: a stack whose MutableClock is moved (projects clock / desk-clock) cannot
// verify them – those projects run on MFA_ENFORCED=false stacks (CI), see tests/README.md.
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { test } from '@playwright/test';
import { base32Decode, stepOf, totpAt } from './totp.js';

export const TOTP_DIR = process.env.E2E_TOTP_DIR ? process.env.E2E_TOTP_DIR.replace(/\/$/, '') : '';
export const TOTP_ENROLL = process.env.E2E_TOTP_ENROLL === '1';

const path = (username: string, ext: string): string => `${TOTP_DIR}/${username}.${ext}`;

export function hasTotpSecret(username: string): boolean {
  return !!TOTP_DIR && existsSync(path(username, 'secret'));
}

function ensureDir(): void {
  if (!TOTP_DIR) throw new Error('E2E_TOTP_DIR chưa đặt – không có chỗ cất secret TOTP thử');
  mkdirSync(TOTP_DIR, { recursive: true, mode: 0o700 });
  chmodSync(TOTP_DIR, 0o700);
}

/** Store the secret (and the recovery codes) of an enrolment the harness just made. */
export function saveTotpSecret(
  username: string,
  base32: string,
  recoveryCodes: string[] = [],
): void {
  ensureDir();
  writeFileSync(path(username, 'secret'), base32, { mode: 0o600 });
  if (recoveryCodes.length)
    writeFileSync(path(username, 'recovery.txt'), `${recoveryCodes.join('\n')}\n`, { mode: 0o600 });
}

/** Cross-process lock (mkdir is atomic); a lock older than 45 s (a holder waits ≤ 31 s) is a killed run – taken over. */
async function withLock<T>(username: string, fn: () => Promise<T>): Promise<T> {
  ensureDir();
  const lock = path(username, 'lock');
  const deadline = Date.now() + 120_000;
  for (;;) {
    try {
      mkdirSync(lock);
      break;
    } catch {
      try {
        if (Date.now() - statSync(lock).mtimeMs > 45_000)
          rmSync(lock, { recursive: true, force: true });
      } catch {
        /* released meanwhile */
      }
      if (Date.now() > deadline)
        throw new Error(`TOTP ${username}: khóa ${lock} bị giữ quá 2 phút`);
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  try {
    return await fn();
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}

function lastStep(username: string): number {
  const f = path(username, 'laststep');
  return existsSync(f) ? Number(readFileSync(f, 'utf8')) || -1 : -1;
}

/** Record a step the harness used outside nextTotpCode (e.g. the confirm code of an enrolment). */
export function markTotpStepUsed(username: string, step: number): void {
  ensureDir();
  if (step > lastStep(username))
    writeFileSync(path(username, 'laststep'), String(step), { mode: 0o600 });
}

/**
 * A code of a step this user has never used. `now` = the STACK's time (ms): the server verifies against its own clock
 * (MutableClock on a disposable stack, system clock on staging/production) – pass it from `totpNow()` of support/api.
 * Uses the current step, or the next one (window ±1, SEC 06.18) when the current one is already spent; only when
 * both are spent it waits for real time to move (system clock). A frozen/virtual stack clock cannot move by waiting:
 * then it fails with the reason (at most two codes per user per frozen instant – move the clock between logins).
 * Login step 2 and every S2 of the same user share the server's anti-replay counter, hence one file per user.
 */
export async function nextTotpCode(
  username: string,
  now: () => Promise<number> = async () => Date.now(),
): Promise<string> {
  if (!hasTotpSecret(username))
    throw new Error(`TOTP ${username}: không có ${username}.secret trong E2E_TOTP_DIR`);
  const key = base32Decode(readFileSync(path(username, 'secret'), 'utf8').trim());
  return withLock(username, async () => {
    const last = lastStep(username);
    let t = await now();
    let step = Math.max(stepOf(t), last + 1);
    if (step > stepOf(t) + 1) {
      if (Math.abs(t - Date.now()) > 120_000)
        throw new Error(
          `TOTP ${username}: đồng hồ stack (${new Date(t).toISOString()}) đứng/ảo và bước mã đã dùng hết – tua đồng hồ trước khi đăng nhập lại`,
        );
      const waitMs = (step - 1) * 30_000 - Date.now() + 500;
      try {
        // the wait belongs to the stack's anti-replay rule, not to the case: give the case that time back
        test.info().setTimeout(test.info().timeout + waitMs + 5_000);
      } catch {
        /* outside a test (global-setup) */
      }
      await new Promise((r) => setTimeout(r, Math.max(0, waitMs)));
      t = await now();
      step = Math.max(stepOf(t), last + 1);
    }
    writeFileSync(path(username, 'laststep'), String(step), { mode: 0o600 });
    return totpAt(key, step);
  });
}
