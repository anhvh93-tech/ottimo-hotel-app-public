// Trusted desk device for the C3 endpoints (x-requires-trusted-device, SR-DEV): the harness sends the device
// cookie of a DS-E seed device. Token sources, in order:
//   1. the seed output tests/fixtures/seed/.out/ds-e.map.json (E2E_SEED_OUT) – written by the seed container;
//   2. the fallback written by global-setup (AUTH_DIR/device.json) when (1) cannot be read.
// Why (2): on CI the seed container runs as `node` (uid 1000) and writes the map 0600 into the runner's checkout;
// the runner (uid 1001) cannot read it (EACCES). Until ci.yml runs the seed with the runner's uid (BUG-R2-053),
// global-setup registers a desk device through qa.owner (trustCurrentDevice, password re-auth, admin Origin –
// the same path as the clock project's virtual device) and says so loudly in the log.
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { APIRequestContext } from '@playwright/test';
import { call, propertyIdOf, session, uuid } from './api.js';
import { AUTH_DIR, COOKIE_PREFIX, PRODUCT_DIR, SEED_PASSWORD } from './env.js';

export const DEVICE_MAP =
  process.env.E2E_SEED_OUT ?? `${PRODUCT_DIR}tests/fixtures/seed/.out/ds-e.map.json`;
export const DEVICE_FALLBACK = `${AUTH_DIR}device.json`;
export const DEVICE_COOKIE = `${COOKIE_PREFIX}ottimo_did`;
export const DESK_LABEL = 'qa-desk-01';

interface DeviceFile {
  devices?: Array<{ label: string; token: string }>;
}

/** Seed device tokens by label, or the read error (ENOENT: seed output absent, EACCES: owned by another uid). */
export function readSeedDevices(): { tokens: Map<string, string>; error?: string } {
  const tokens = new Map<string, string>();
  try {
    const m = JSON.parse(readFileSync(DEVICE_MAP, 'utf8')) as DeviceFile;
    for (const d of m.devices ?? []) tokens.set(d.label, d.token);
    return tokens.size ? { tokens } : { tokens, error: 'no devices in the seed output' };
  } catch (e) {
    return { tokens, error: (e as NodeJS.ErrnoException).code ?? String(e) };
  }
}

/** Fallback desk device registered by global-setup (only when the seed output is unreadable). */
export function readFallbackDevices(): Map<string, string> {
  const tokens = new Map<string, string>();
  try {
    const m = JSON.parse(readFileSync(DEVICE_FALLBACK, 'utf8')) as DeviceFile & { apiUrl?: string };
    if (m.apiUrl && m.apiUrl !== (process.env.E2E_API_URL ?? 'http://127.0.0.1:3000'))
      return tokens;
    for (const d of m.devices ?? []) tokens.set(d.label, d.token);
  } catch {
    /* no fallback */
  }
  return tokens;
}

/**
 * global-setup: make sure a desk device token is available to every worker. Returns a one-line status for the
 * setup log. Throws (CI) when neither the seed output nor a fallback registration gives a token.
 */
export async function ensureDeskDevice(ctx: APIRequestContext): Promise<string> {
  const seed = readSeedDevices();
  if (seed.tokens.get(DESK_LABEL)) return `token thiết bị quầy: seed (${DEVICE_MAP})`;
  const why =
    seed.error === 'EACCES'
      ? `EACCES – tệp 0600 của uid khác (seed chạy bằng uid của container); chạy seed với --user "$(id -u):$(id -g)" – BUG-R2-053`
      : (seed.error ?? 'không có qa-desk-01');
  const owner = await session(ctx, 'qa.owner');
  const r = await call<{ id?: string; expiresAt?: string }>(
    ctx,
    'POST',
    `/v1/properties/${propertyIdOf(owner)}/trusted-devices`,
    {
      session: owner,
      idempotencyKey: true,
      body: {
        name: `qa-e2e-desk-fallback-${uuid().slice(0, 8)}`,
        deviceKind: 'desk',
        currentPassword: SEED_PASSWORD,
        hardeningChecklistConfirmed: true,
      },
    },
  );
  let token = '';
  for (const c of r.setCookies) {
    const first = c.split(';')[0] ?? '';
    if (first.startsWith(`${DEVICE_COOKIE}=`))
      token = decodeURIComponent(first.slice(DEVICE_COOKIE.length + 1));
  }
  if (r.status !== 201 || !token) {
    throw new Error(
      `[e2e setup] không đọc được token thiết bị của seed ${DEVICE_MAP} (${why}) và không đăng ký được thiết bị dự phòng: HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`,
    );
  }
  mkdirSync(AUTH_DIR, { recursive: true });
  writeFileSync(
    DEVICE_FALLBACK,
    `${JSON.stringify({ apiUrl: process.env.E2E_API_URL ?? 'http://127.0.0.1:3000', devices: [{ label: DESK_LABEL, token }] })}\n`,
    { mode: 0o600 },
  );
  chmodSync(DEVICE_FALLBACK, 0o600);
  return `CẢNH BÁO token thiết bị quầy: không đọc được ${DEVICE_MAP} (${why}) → đã đăng ký thiết bị quầy dự phòng qua qa.owner (trustCurrentDevice, ${r.body.id ?? ''}) cho lượt chạy này`;
}
