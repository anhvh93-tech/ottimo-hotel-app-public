// Data-processing notice version of the E2E stack (parameter `privacy_notice_version`, R-CON-02, OWN only).
//
// v1.0.4 P4-42 (SEC-on-plan-v1.0.4 6.4): guest-web ships only the text of `privacy-2026-10-v2`
// (NOTICE_TEXT_VERSIONS = [v2]). The server default stays `privacy-2026-10-v1` (catalogue 0050) until OWN sets the
// Desk parameter to v2 – that is the release step. A stack still on v1 makes the guest page fail closed ("đến
// quầy") and every consent sent with v2 answers 422 noticeVersion NOT_IN_LIST.
//
// The DS-E seed does NOT carry this key: services/api tests load every DS-E parameter into their tenants and still
// assert the catalogue default v1. So the E2E setup does what OWN does on release: setParameter (qa.owner) from the
// stack's business date. Only on a disposable stack (CI, E2E_COMPOSE_CONTROL=1) or on explicit opt-in
// (E2E_NOTICE_SETUP=1): the parameter is effective-dated and append-only, so a shared dev stack is never switched
// behind other people's back – there the setup only reports what it found.
import type { APIRequestContext } from '@playwright/test';
import { call, propertyIdOf, session, stackToday } from './api.js';

/** The notice version guest-web carries (guest-web config.ts NOTICE_TEXT_VERSIONS). */
export const PRIVACY_NOTICE = 'privacy-2026-10-v2';

/** Catalogue default of the server (migration 0050) – what a stack shows before OWN switches it. */
export const PRIVACY_NOTICE_SERVER_DEFAULT = 'privacy-2026-10-v1';

export const NOTICE_SETUP_ENABLED =
  !!process.env.CI ||
  process.env.E2E_COMPOSE_CONTROL === '1' ||
  process.env.E2E_NOTICE_SETUP === '1';

/** Value of `privacy_notice_version` in force on the stack's business date (catalogue default if no row). */
export async function currentNoticeVersion(ctx: APIRequestContext): Promise<string | undefined> {
  const owner = await session(ctx, 'qa.owner');
  const r = await call<{ data?: Array<{ key: string; value: unknown }> }>(
    ctx,
    'GET',
    `/v1/properties/${propertyIdOf(owner)}/parameters`,
    { session: owner },
  );
  if (r.status !== 200) return undefined;
  const item = r.body.data?.find((p) => p.key === 'privacy_notice_version');
  return typeof item?.value === 'string' ? item.value : PRIVACY_NOTICE_SERVER_DEFAULT;
}

/**
 * Global setup: make the stack show PRIVACY_NOTICE. Returns a one-line report; throws in CI when the stack still
 * answers another version afterwards (one clear red instead of every check-in case stopping at "đến quầy").
 */
export async function ensurePrivacyNotice(ctx: APIRequestContext): Promise<string> {
  const before = await currentNoticeVersion(ctx);
  if (before === PRIVACY_NOTICE)
    return `[e2e setup] privacy_notice_version = ${PRIVACY_NOTICE} (đã đúng)`;
  if (!NOTICE_SETUP_ENABLED) {
    return (
      `[e2e setup] CẢNH BÁO: stack đang ở privacy_notice_version = ${before ?? '?'} – guest-web chỉ có bản ` +
      `${PRIVACY_NOTICE}: ca thủ tục trước sẽ dừng ở màn "đến quầy", đồng ý gửi ${PRIVACY_NOTICE} → 422. ` +
      'Stack dùng một lần: chạy lại với E2E_COMPOSE_CONTROL=1 hoặc E2E_NOTICE_SETUP=1 để setup đặt tham số.'
    );
  }
  const owner = await session(ctx, 'qa.owner');
  const effectiveFrom = await stackToday(ctx);
  const r = await call(
    ctx,
    'PUT',
    `/v1/properties/${propertyIdOf(owner)}/parameters/privacy_notice_version`,
    {
      session: owner,
      idempotencyKey: true,
      body: {
        value: PRIVACY_NOTICE,
        effectiveFrom,
        reason:
          'E2E setup – v1.0.4 P4-42: OWN chuyển thông báo dữ liệu sang bản guest-web đang mang',
      },
    },
  );
  const after = await currentNoticeVersion(ctx);
  if (after !== PRIVACY_NOTICE) {
    const msg =
      `[e2e setup] Không đặt được privacy_notice_version = ${PRIVACY_NOTICE} (từ ${effectiveFrom}): ` +
      `setParameter ${r.status} ${JSON.stringify(r.body)}; stack vẫn trả ${after ?? '?'}.`;
    if (process.env.CI) throw new Error(msg);
    return msg;
  }
  return `[e2e setup] privacy_notice_version: ${before ?? '?'} → ${PRIVACY_NOTICE} (từ ${effectiveFrom}, qa.owner)`;
}
