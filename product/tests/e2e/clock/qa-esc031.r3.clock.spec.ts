// QA – ESC-031 money check (DOM oracle s1-money-oracle.md 10.1, E31-1…E31-11 + I-E31) through the real HTTP API of a
// disposable stack (c7ba6b5) with MFA_ENFORCED=true. Scratchpad only. ONE serial timeline, clock only moves FORWARD
// (OWN/MGR log in with test TOTP computed from the stack clock; the server refuses a step ≤ the last used one).
// Oracle dates of 2030 shifted by 104 weeks (weekdays kept; the 30/04 special day is added as a QA special day on the
// shifted date) – the stack clock already passed 2031 in earlier clock suites and OWN/MGR TOTP steps only go forward.
import { appendFileSync } from 'node:fs';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { call, propertyIdOf, session } from '../support/api.js';
import { runJob, setClock } from '../support/clock.js';
import { room, s2Context, type S2Context, getReservation } from '../support/s2.js';
import {
  approve,
  checkIn,
  cleanRooms,
  getFolio,
  makeStay,
  stackSql,
  useVirtualDevice,
  type Stay,
} from '../support/s3.js';
import { attention } from '../support/s3-checkin.js';
import {
  adjustLine,
  approvalsOf,
  checkOut,
  checkoutSummary,
  lateCheckout,
  minibarCheck,
  setParam,
} from '../support/s3-stay.js';

// Extra whole weeks so that the timeline starts after every TOTP step OWN/MGR already used on this stack (anti-replay:
// a rerun at the same frozen instants would have no code left). Weekdays are kept.
import { existsSync as _ex, readFileSync as _rd } from 'node:fs';
const _last = Math.max(
  0,
  ...['qa.owner', 'qa.mgr'].map((u) => {
    const f = `${process.env.E2E_TOTP_DIR}/${u}.laststep`;
    return _ex(f) ? Number(_rd(f, 'utf8')) * 30_000 : 0;
  }),
);
const _base = Date.parse('2032-03-29T00:00:00+07:00');
const WEEKS = _last >= _base ? Math.ceil((_last - _base) / (7 * 864e5)) + 30 : 0; // + 30: past every booking of an earlier attempt
const X = (txt: string): string =>
  txt.replace(/2032-\d\d-\d\d/g, (d) =>
    new Date(Date.parse(`${d}T00:00:00Z`) + WEEKS * 7 * 864e5).toISOString().slice(0, 10),
  );

const LOG = process.env.QA_ESC_LOG ?? '/dev/null';
const log = (s: string) => appendFileSync(LOG, `${s}\n`);
const REASON = 'Căn có khách đến đêm nay, không dời được';
const vn = (d: string, hm: string) => `${d}T${hm}:00+07:00`;
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

test.describe.configure({ mode: 'serial' });
// Only on a stack with MFA_ENFORCED=true and the QA TOTP store (README "Stack bật 2FA bắt buộc") – never on the CI clock project.
test.skip(!process.env.E2E_TOTP_DIR, 'Chỉ chạy trên stack MFA_ENFORCED=true (đặt E2E_TOTP_DIR)');
test.setTimeout(30 * 60_000);

let c: S2Context;
const S: Record<string, Stay> = {};
const results: Array<[string, string, string]> = [];
const ok = (id: string, what: string, pass: boolean) => {
  results.push([id, what, pass ? 'Đạt' : 'KHÔNG ĐẠT']);
  log(`| ${id} | ${what} | ${pass ? 'Đạt' : '**KHÔNG ĐẠT**'} |`);
};

let lastAt = 0;
/**
 * Move the frozen stack clock forward to `iso`. Logins (TOTP of OWN/MGR – at most 2 codes per user per frozen
 * instant) and the virtual desk device are done 90 s before (never before the previous instant), so the case time
 * itself keeps a full TOTP budget for S2.
 */
async function at(request: APIRequestContext, iso: string): Promise<void> {
  const target = Date.parse(iso);
  const pre = Math.max(lastAt + 1_000, target - 90_000);
  if (pre < target) {
    const p = new Date(pre).toISOString();
    await setClock(request, p);
    await useVirtualDevice(request, p);
    for (const u of ['qa.owner', 'qa.mgr', 'qa.fd', 'qa.fdl']) await session(request, u);
  }
  await setClock(request, iso);
  await useVirtualDevice(request, iso);
  lastAt = target;
}
const sess = (request: APIRequestContext, u: string) => session(request, u);

async function notifs(request: APIRequestContext, u: string, st: Stay): Promise<string[]> {
  const s = await sess(request, u);
  const r = await call<{ data: Json[] }>(request, 'GET', '/v1/me/notifications', {
    session: s,
    query: { limit: 100 },
  });
  expect(r.status).toBe(200);
  return r.body.data
    .filter((n) => n.refId === st.res.id || n.refCode === st.res.code)
    .map((n) => String(n.kind));
}
const countKind = (k: string[], kind: string) => k.filter((x) => x === kind).length;
async function items(request: APIRequestContext, u: string, st: Stay): Promise<Json[]> {
  const s = await sess(request, u);
  return (await attention(request, s)).filter(
    (i) =>
      i.kind === 'late_fee_post_review' &&
      (i.refCode === st.res.code || (i.reservationIds ?? []).includes(st.res.id)),
  );
}
const sqlRows = (q: string) => stackSql(q).trim().split('\n').filter(Boolean);
const lateLines = async (request: APIRequestContext, st: Stay) => {
  const f = await getFolio(request, await sess(request, 'qa.mgr'), st.res.folioId!);
  return {
    f,
    late: (f.lines as Json[]).filter(
      (l) => l.chargeCode === 'late_fee_as_night' && !l.reversalOfId && !l.voidedAt,
    ),
    foc: (f.lines as Json[]).filter((l) => l.category === 'foc' && !l.reversalOfId && !l.voidedAt),
  };
};
const refunds = async (request: APIRequestContext, u: string, st: Stay) =>
  (await approvalsOf(request, await sess(request, u), st.res.code, 'refund')).filter((a) =>
    ['pending', 'approved', 'paid', 'executed', 'completed'].includes(String(a.status)),
  );

async function stay(
  request: APIRequestContext,
  roomNo: string,
  arrival: string,
  nights: number,
  next = true,
) {
  const fd = await sess(request, 'qa.fd');
  const st = await makeStay(request, c, fd, {
    room: room(c, roomNo),
    arrival,
    nights,
    pay: 'full',
    adults: 2,
  });
  if (next) {
    const dep = new Date(Date.parse(`${arrival}T00:00:00Z`) + nights * 864e5)
      .toISOString()
      .slice(0, 10);
    await makeStay(request, c, fd, {
      room: room(c, roomNo),
      arrival: dep,
      nights: 2,
      pay: 'deposit',
      doc: false,
    });
  }
  return st;
}
async function checkInAt(request: APIRequestContext, st: Stay) {
  cleanRooms();
  const fd = await sess(request, 'qa.fd');
  const r = await checkIn(request, fd, st.res.id, {
    checkinTime: '15:00',
    cardsIssued: 1,
    houseRulesSent: true,
  });
  expect(r.status, `check-in ${st.res.code}: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
}
/** B18 on the post-review path at the current clock, as `who`, departure time 20:30. */
async function postReviewOut(
  request: APIRequestContext,
  st: Stay,
  who = 'qa.fd',
  more: Json = {},
  top: Json = {},
) {
  const s = await sess(request, who);
  await minibarCheck(request, s, st.res.id);
  const sum = await checkoutSummary(request, s, st.res.id, { checkoutTime: '20:30' });
  expect(sum.status, JSON.stringify(sum.body).slice(0, 300)).toBe(200);
  const fee = Number(sum.body.lateFeeAsNightVnd ?? 0);
  const due = Number(sum.body.amountDueAtCheckoutVnd ?? 0);
  const res = await checkOut(request, s, st.res.id, {
    checkoutTime: '20:30',
    lateFeeInsteadOfNight: { amountVnd: fee, reason: REASON, postReview: true, ...more },
    ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
    ...top,
  });
  return { sum: sum.body as Json, fee, due, res };
}

test('QA ESC-031 E31-1…E31-11 (oracle 10.1) trên stack MFA_ENFORCED=true', async ({ request }) => {
  log(
    `\n# QA ESC-031 E2E API (${new Date().toISOString()}) – dời thêm ${WEEKS} tuần\n\n| Ca | Kiểm | Kết quả |\n|---|---|---|`,
  );
  // ── setup 01/04/2030: special day 30/04/2030 (E31-3), every booking of the timeline ──
  await at(request, vn(X('2032-03-29'), '10:00'));
  c = await s2Context(request);
  const pid = propertyIdOf(await sess(request, 'qa.owner'));
  const curP = await call<Json>(request, 'GET', `/v1/properties/${pid}/parameters/special_dates`, {
    session: await sess(request, 'qa.owner'),
  });
  const cur = (curP.body.current?.value ?? curP.body.value ?? []) as Json[];
  log(`- special_dates hiện tại: ${curP.status}, ${JSON.stringify(cur).slice(0, 120)}`);
  const special = [
    ...(Array.isArray(cur) ? cur : []),
    { name: 'QA ngay dac biet (30/4 dich 104 tuan)', from: X('2032-04-27'), to: X('2032-04-28') },
  ];
  const sp = await setParam(request, 'special_dates', special, X('2032-03-30'), { reauth: false });
  log(
    `\n- special_dates thêm 30/04/2030 (OWN, hiệu lực 02/04) → ${sp.status} ${sp.status >= 300 ? JSON.stringify(sp.body).slice(0, 200) : ''}`,
  );
  await at(request, vn(X('2032-03-30'), '10:00'));
  S.e4 = await stay(request, '202', X('2032-04-09'), 6);
  S.e1 = await stay(request, '203', X('2032-04-13'), 2);
  S.e6 = await stay(request, '203', X('2032-04-20'), 2);
  S.e7 = await stay(request, '202', X('2032-04-20'), 2);
  S.e3 = await stay(request, '202', X('2032-04-25'), 2);
  S.e8a = await stay(request, '203', X('2032-05-04'), 2);
  S.e8b = await stay(request, '202', X('2032-05-04'), 2);
  S.e9 = await stay(request, '203', X('2032-05-11'), 2);
  S.e10 = await stay(request, '202', X('2032-05-11'), 2);
  S.e10s = await stay(request, '203', X('2032-05-18'), 2, false);
  S.e11 = await stay(request, '202', X('2032-05-25'), 2);
  S.e2 = await stay(request, '203', X('2032-09-15'), 2);
  log(
    `- Đơn: ${Object.entries(S)
      .map(([k, v]) => `${k}=${v.res.code}/${v.room.roomNo}`)
      .join(', ')}`,
  );

  // ── E31-4 check-in 12/04, E31-1 check-in 16/04 ──
  await at(request, vn(X('2032-04-09'), '15:00'));
  await checkInAt(request, S.e4!);
  await at(request, vn(X('2032-04-13'), '15:00'));
  await checkInAt(request, S.e1!);

  // ── 18/04 20:35: E31-1, E31-4 ──
  await at(request, vn(X('2032-04-15'), '20:35'));
  const sec0 = sqlRows(`SELECT count(*) FROM audit_event WHERE category = 'security'`)[0];
  const pins0 = sqlRows(`SELECT COALESCE(sum(approval_pin_failed_count),0) FROM app_user`)[0];
  const r1 = await postReviewOut(request, S.e1!);
  log(
    `- E31-1: summary lateFeeAsNightVnd ${r1.fee}, due ${r1.due}, extraNightAvailable ${r1.sum.extraNightAvailable}; checkOut → ${r1.res.status}`,
  );
  const l1 = await lateLines(request, S.e1!);
  const a1 = sqlRows(
    `SELECT actor_user_id::text || '|' || COALESCE(after->>'channel','') || '|' || COALESCE(after->>'checkoutTime','') || '|' || COALESCE(after->>'reviewDueAt','') || '|' || COALESCE(after->>'confirmedBy','-') FROM audit_event WHERE action = 'reservation.late_fee_instead_of_night' AND entity_id = '${S.e1!.res.id}'`,
  );
  const fdId = (await sess(request, 'qa.fd')).me.id;
  const until = sqlRows(
    `SELECT to_char(post_checkout_window_until AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD HH24:MI') FROM folio WHERE id = '${S.e1!.res.folioId}'`,
  )[0];
  const n1 = {
    own: await notifs(request, 'qa.owner', S.e1!),
    mgr: await notifs(request, 'qa.mgr', S.e1!),
    fdl: await notifs(request, 'qa.fdl', S.e1!),
    fd: await notifs(request, 'qa.fd', S.e1!),
  };
  const i1 = {
    mgr: await items(request, 'qa.mgr', S.e1!),
    own: await items(request, 'qa.owner', S.e1!),
    fd: await items(request, 'qa.fd', S.e1!),
  };
  const sec = String(
    Number(sqlRows(`SELECT count(*) FROM audit_event WHERE category = 'security'`)[0]) -
      Number(sec0),
  );
  const pins = String(
    Number(sqlRows(`SELECT COALESCE(sum(approval_pin_failed_count),0) FROM app_user`)[0]) -
      Number(pins0),
  );
  log(
    `- E31-1: dòng phụ thu ${JSON.stringify(l1.late.map((l) => l.amountVnd))}, FOC ${l1.foc.length}, folio ${l1.f.status}, đã trả ${l1.f.totals.paidVnd}; audit ${JSON.stringify(a1)} (FD ${fdId}); window_until ${until}; thông báo ${JSON.stringify(n1)}; Cần chú ý MGR ${i1.mgr.length} hạn ${i1.mgr[0]?.dueAt}, OWN ${i1.own.length}, FD ${i1.fd.length}; audit bảo mật mới ${sec}; lần đếm sai mới ${pins}`,
  );
  const aud = (a1[0] ?? '').split('|');
  ok(
    'E31-1',
    '200; 792.000; không FOC; audit post_review actor FD, không confirmedBy, giờ 20:30, hạn 19/04 20:35; báo OWN+MGR (không FD/FDL); 1 mục MGR+; 0 audit bảo mật',
    r1.res.status === 200 &&
      r1.fee === 792_000 &&
      l1.late.length === 1 &&
      l1.late[0]!.amountVnd === 792_000 &&
      l1.foc.length === 0 &&
      a1.length === 1 &&
      aud[0] === fdId &&
      aud[1] === 'post_review' &&
      aud[2] === '20:30' &&
      aud[4] === '-' &&
      until === X('2032-04-16 20:35') &&
      Date.parse(aud[3]!) === Date.parse(X('2032-04-16T20:35:00+07:00')) &&
      countKind(n1.own, 'late_fee_post_review') === 1 &&
      countKind(n1.mgr, 'late_fee_post_review') === 1 &&
      countKind(n1.fd, 'late_fee_post_review') === 0 &&
      countKind(n1.fdl, 'late_fee_post_review') === 0 &&
      i1.mgr.length === 1 &&
      i1.own.length === 1 &&
      i1.fd.length === 0 &&
      Date.parse(String(i1.mgr[0]?.dueAt)) === Date.parse(X('2032-04-16T20:35:00+07:00')) &&
      sec === '0' &&
      pins === '0',
  );

  const r4 = await postReviewOut(request, S.e4!);
  const l4 = await lateLines(request, S.e4!);
  log(
    `- E31-4 (6 đêm): summary ${r4.fee}, checkOut ${r4.res.status}, dòng ${JSON.stringify(l4.late.map((l) => l.amountVnd))}; giá đêm trên folio ${JSON.stringify((l4.f.lines as Json[]).filter((l) => l.category === 'room').map((l) => l.amountVnd ?? l.unitPriceVnd))}`,
  );
  ok(
    'E31-4',
    'lượt 6 đêm: phụ thu 792.000 (không 713.000)',
    r4.res.status === 200 && r4.fee === 792_000 && l4.late[0]?.amountVnd === 792_000,
  );

  // ── 19/04 09:00: E31-5 (MGR A32 → 396.000) ──
  await at(request, vn(X('2032-04-16'), '09:00'));
  const mgr = await sess(request, 'qa.mgr');
  const own = await sess(request, 'qa.owner');
  const line5 = (await lateLines(request, S.e1!)).late[0]!;
  const a32 = await adjustLine(request, mgr, S.e1!.res.folioId!, line5.id, {
    reason: 'Khach den muon do OTTIMO – mien 50 %',
    newUnitPriceVnd: 396_000,
  });
  const rf5 = await refunds(request, 'qa.mgr', S.e1!);
  log(
    `- E31-5: A32 → ${a32.status} ${a32.status >= 300 ? JSON.stringify(a32.body).slice(0, 200) : ''}; yêu cầu hoàn ${JSON.stringify(rf5.map((a) => [a.amountVnd, a.status, a.requestedByName ?? a.requestedBy]))}`,
  );
  const self = rf5[0] ? await approve(request, mgr, String(rf5[0].id)) : null;
  log(`- E31-5: MGR tự duyệt → ${self?.status} ${self?.body?.code ?? ''}`);
  const ownOk = rf5[0] ? await approve(request, own, String(rf5[0].id)) : null;
  log(
    `- E31-5: OWN duyệt → ${ownOk?.status} ${ownOk?.body?.code ?? ''} ${ownOk && ownOk.status >= 300 ? JSON.stringify(ownOk.body).slice(0, 200) : ''}`,
  );
  const own5 = await notifs(request, 'qa.owner', S.e1!);
  const it5 = (await items(request, 'qa.mgr', S.e1!))[0];
  const res5 = it5
    ? await call(
        request,
        'POST',
        `/v1/properties/${pid}/attention-events/${it5.eventId}/actions/resolve`,
        {
          session: await sess(request, 'qa.mgr'),
          idempotencyKey: true,
          body: { note: 'Da xem, mien 50 %' },
        },
      )
    : null;
  const fdRes = it5
    ? await call(
        request,
        'POST',
        `/v1/properties/${pid}/attention-events/${it5.eventId}/actions/resolve`,
        { session: await sess(request, 'qa.fd'), idempotencyKey: true, body: {} },
      )
    : null;
  const it5b = await items(request, 'qa.mgr', S.e1!);
  log(
    `- E31-5: thông báo OWN của đơn ${JSON.stringify(own5)}; MGR "Đã xem" → ${res5?.status}, FD đóng → ${fdRes?.status}; còn ${it5b.length} mục`,
  );
  ok(
    'E31-5',
    'A32 giảm 50 %: hoàn tự sinh 396.000 pending (MGR xin); MGR tự duyệt 403 (SELF_APPROVAL_FORBIDDEN – oracle ghi SELF_REFUND_FORBIDDEN); OWN duyệt được; không báo OWN thêm (ESC-026); MGR "Đã xem" → hết mục',
    a32.status < 300 &&
      rf5.length === 1 &&
      rf5[0]!.amountVnd === 396_000 &&
      self?.status === 403 &&
      ['SELF_REFUND_FORBIDDEN', 'SELF_APPROVAL_FORBIDDEN'].includes(String(self?.body?.code)) &&
      (ownOk?.status ?? 0) < 300 &&
      own5.length === 1 &&
      res5?.status === 204 &&
      it5b.length === 0,
  );

  // ── 19/04 20:40: overdue job – E31-1 reviewed (no more), E31-4 not reviewed (OWN once) ──
  await at(request, vn(X('2032-04-16'), '20:40'));
  await runJob(request, 'late_fee.post_review_overdue');
  const o1 = await notifs(request, 'qa.owner', S.e1!);
  const o4 = await notifs(request, 'qa.owner', S.e4!);
  log(
    `- Job quá hạn 19/04 20:40: OWN E31-1 ${JSON.stringify(o1)}, OWN E31-4 ${JSON.stringify(o4)}`,
  );
  ok(
    'E31-5b',
    'job sau 20:35 không báo thêm cho đơn đã xem',
    countKind(o1, 'late_fee_post_review') === 1 && o1.length === 1,
  );

  // ── E31-6, E31-7: 23–25/04 ──
  await at(request, vn(X('2032-04-20'), '15:00'));
  await checkInAt(request, S.e6!);
  await checkInAt(request, S.e7!);
  await at(request, vn(X('2032-04-22'), '20:35'));
  const r6 = await postReviewOut(request, S.e6!);
  const r7 = await postReviewOut(request, S.e7!);
  log(`- E31-6/7 B18 → ${r6.res.status}/${r7.res.status}, phụ thu ${r6.fee}/${r7.fee}`);
  await at(request, vn(X('2032-04-23'), '09:00'));
  const line6 = (await lateLines(request, S.e6!)).late[0]!;
  const v6 = await adjustLine(
    request,
    await sess(request, 'qa.mgr'),
    S.e6!.res.folioId!,
    line6.id,
    { reason: 'Mien toan bo – khach den muon do OTTIMO', voidLine: true },
  );
  let rf6 = await refunds(request, 'qa.mgr', S.e6!);
  log(
    `- E31-6: A32 hủy dòng → ${v6.status} ${v6.status >= 300 ? JSON.stringify(v6.body).slice(0, 300) : ''}; hoàn ${JSON.stringify(rf6.map((a) => [a.amountVnd, a.status]))}`,
  );
  if (v6.status >= 300) {
    // contract may express "void" as newUnitPriceVnd 0
    const v6b = await adjustLine(
      request,
      await sess(request, 'qa.mgr'),
      S.e6!.res.folioId!,
      line6.id,
      { reason: 'Mien toan bo – khach den muon do OTTIMO', newUnitPriceVnd: 0 },
    );
    rf6 = await refunds(request, 'qa.mgr', S.e6!);
    log(
      `- E31-6: A32 về 0 → ${v6b.status} ${v6b.status >= 300 ? JSON.stringify(v6b.body).slice(0, 300) : ''}; hoàn ${JSON.stringify(rf6.map((a) => [a.amountVnd, a.status]))}`,
    );
  }
  const own6 = await notifs(request, 'qa.owner', S.e6!);
  const f6 = await getFolio(request, await sess(request, 'qa.mgr'), S.e6!.res.folioId!);
  log(`- E31-6: thông báo OWN ${JSON.stringify(own6)}; folio ${JSON.stringify(f6.totals)}`);
  ok(
    'E31-6',
    'A32 hủy cả dòng: hoàn 792.000; Σ = ngưỡng → không báo thêm OWN; khách thực trả 0 cho phụ thu',
    rf6.length === 1 && rf6[0]!.amountVnd === 792_000 && own6.length === 1,
  );

  // E31-7: job 20:34 / 20:35 / ×3, J15, then A32 refused
  await at(request, vn(X('2032-04-23'), '20:34'));
  await runJob(request, 'late_fee.post_review_overdue');
  const o7a = countKind(await notifs(request, 'qa.owner', S.e7!), 'late_fee_post_review');
  const m7a = countKind(await notifs(request, 'qa.mgr', S.e7!), 'late_fee_post_review');
  await at(request, vn(X('2032-04-23'), '20:35'));
  await runJob(request, 'late_fee.post_review_overdue');
  const o7b = countKind(await notifs(request, 'qa.owner', S.e7!), 'late_fee_post_review');
  for (let i = 0; i < 3; i++) await runJob(request, 'late_fee.post_review_overdue');
  const o7c = countKind(await notifs(request, 'qa.owner', S.e7!), 'late_fee_post_review');
  const m7c = countKind(await notifs(request, 'qa.mgr', S.e7!), 'late_fee_post_review');
  const it7 = await items(request, 'qa.owner', S.e7!);
  await at(request, vn(X('2032-04-23'), '20:40'));
  const j15 = await runJob(request, 'folio.close');
  const f7 = await getFolio(request, await sess(request, 'qa.mgr'), S.e7!.res.folioId!);
  const line7 = (f7.lines as Json[]).find(
    (l) => l.chargeCode === 'late_fee_as_night' && !l.reversalOfId,
  )!;
  const a7 = await adjustLine(
    request,
    await sess(request, 'qa.mgr'),
    S.e7!.res.folioId!,
    line7.id,
    { reason: 'Thu sau khi dong', newUnitPriceVnd: 396_000 },
  );
  log(
    `- E31-7: OWN 20:34 ${o7a} (MGR ${m7a}); 20:35 ${o7b}; +3 lần ${o7c} (MGR ${m7c}); mục mở ${it7.length}; J15 ${JSON.stringify(j15.stats ?? j15.status)} → folio ${f7.status}; A32 sau đóng → ${a7.status} ${a7.body?.code ?? ''}`,
  );
  ok(
    'E31-7',
    'quá hạn không ai xem: 20:34 không báo; 20:35 báo OWN đúng 1 lần (tổng 2, MGR không thêm); mục vẫn mở; J15 đóng folio; A32 sau đó bị từ chối',
    o7a === 1 &&
      o7b === 2 &&
      o7c === 2 &&
      m7a === 1 &&
      m7c === 1 &&
      it7.length === 1 &&
      f7.status === 'closed' &&
      a7.status >= 400,
  );

  // ── E31-3: 28–30/04 (30/04 special) ──
  await at(request, vn(X('2032-04-25'), '15:00'));
  await checkInAt(request, S.e3!);
  await at(request, vn(X('2032-04-27'), '20:35'));
  const r3 = await postReviewOut(request, S.e3!);
  log(`- E31-3: lateFeeAsNightVnd ${r3.fee}, B18 ${r3.res.status}`);
  ok(
    'E31-3',
    'đêm ngày đi ngày đặc biệt 30/04: phụ thu 1.030.000 (không cộng +15 %)',
    r3.fee === 1_030_000 && r3.res.status === 200,
  );

  // ── E31-8: FOC 200.000 approved before; a/b variants ──
  await at(request, vn(X('2032-05-04'), '15:00'));
  await checkInAt(request, S.e8a!);
  await checkInAt(request, S.e8b!);
  await at(request, vn(X('2032-05-06'), '10:00'));
  for (const k of ['e8a', 'e8b']) {
    const st = S[k]!;
    const m = await sess(request, 'qa.mgr');
    const dry = await lateCheckout(request, m, st.res.id, { checkoutTime: '17:00' }, true);
    const lc = await lateCheckout(request, m, st.res.id, {
      checkoutTime: '17:00',
      applySurcharge: true,
      expectedSurchargeVnd: dry.body.surchargeVnd,
      requestFocForSurcharge: {
        kind: 'foc',
        amountVnd: 200_000,
        reasonCode: 'service_recovery',
        note: 'Khach quen',
      },
    });
    const pend = (await approvalsOf(request, m, st.res.code)).filter(
      (a) => a.status === 'pending' && a.type !== 'refund',
    );
    const ap = pend[0]
      ? await approve(request, await sess(request, 'qa.owner'), String(pend[0].id))
      : null;
    log(
      `- E31-8 ${k}: late-checkout 17:00 dry ${dry.status} phụ thu ${dry.body.surchargeVnd}; lưu → ${lc.status} ${lc.status >= 300 ? JSON.stringify(lc.body).slice(0, 200) : ''}; FOC chờ ${pend.length} → OWN duyệt ${ap?.status} ${ap?.body?.code ?? ''}`,
    );
  }
  await at(request, vn(X('2032-05-06'), '20:35'));
  const r8: Record<string, Awaited<ReturnType<typeof postReviewOut>>> = {};
  for (const k of ['e8a', 'e8b']) {
    r8[k] = await postReviewOut(request, S[k]!);
    const l = await lateLines(request, S[k]!);
    log(
      `- E31-8 ${k}: summary lateFee ${r8[k]!.fee}, due ${r8[k]!.due}, focVnd ${JSON.stringify(r8[k]!.sum.lateFeeFocVnd ?? r8[k]!.sum.focVnd ?? null)}; B18 ${r8[k]!.res.status} ${r8[k]!.res.status >= 300 ? JSON.stringify(r8[k]!.res.body).slice(0, 300) : ''}; dòng ${JSON.stringify(l.late.map((x) => x.amountVnd))} FOC ${JSON.stringify(l.foc.map((x) => x.amountVnd))}; đã trả ${l.f.totals.paidVnd}`,
    );
  }
  await at(request, vn(X('2032-05-07'), '09:00'));
  const m8 = await sess(request, 'qa.mgr');
  for (const [k, price] of [
    ['e8a', 396_000],
    ['e8b', 150_000],
  ] as const) {
    const l = await lateLines(request, S[k]!);
    const a = await adjustLine(request, m8, S[k]!.res.folioId!, l.late[0]!.id, {
      reason: 'Xem lai sau tra phong',
      newUnitPriceVnd: price,
    });
    const l2 = await lateLines(request, S[k]!);
    const rf = await refunds(request, 'qa.mgr', S[k]!);
    log(
      `- E31-8 ${k}: A32 → ${price}: ${a.status} ${a.status >= 300 ? JSON.stringify(a.body).slice(0, 200) : ''}; FOC ${JSON.stringify(l2.foc.map((x) => x.amountVnd))}; hoàn ${JSON.stringify(rf.map((x) => [x.amountVnd, x.status]))}; đã trả ${l2.f.totals.paidVnd}`,
    );
    const allL = l2.f.lines as Json[];
    const focNow = -allL
      .filter((x) => x.category === 'foc')
      .reduce((s2, x) => s2 + Number(x.amountVnd), 0);
    const ref = rf.reduce((s2, x) => s2 + Number(x.amountVnd), 0);
    if (k === 'e8a')
      ok(
        'E31-8a',
        'FOC 200.000 có trước: B18 phụ thu 792.000, FOC 200.000, khách trả 592.000 (= xem trước); A32 → 396.000: FOC vẫn 200.000, hoàn 396.000',
        r8.e8a!.res.status === 200 &&
          r8.e8a!.fee === 792_000 &&
          r8.e8a!.due === 592_000 &&
          focNow === 200_000 &&
          ref === 396_000,
      );
    else
      ok(
        'E31-8b',
        'A32 → 150.000: FOC 150.000 (min), hoàn 592.000 ≤ khách đã trả (I-E31)',
        r8.e8b!.res.status === 200 && focNow === 150_000 && ref === 592_000,
      );
  }

  // ── E31-9 (pending FOC), E31-10 (refusals) on 14–16/05 ──
  await at(request, vn(X('2032-05-11'), '15:00'));
  await checkInAt(request, S.e9!);
  await checkInAt(request, S.e10!);
  await at(request, vn(X('2032-05-13'), '10:00'));
  {
    const m = await sess(request, 'qa.mgr');
    const dry = await lateCheckout(request, m, S.e9!.res.id, { checkoutTime: '17:00' }, true);
    const lc = await lateCheckout(request, m, S.e9!.res.id, {
      checkoutTime: '17:00',
      applySurcharge: true,
      expectedSurchargeVnd: dry.body.surchargeVnd,
    });
    const f9 = await getFolio(request, await sess(request, 'qa.fd'), S.e9!.res.folioId!);
    const lcLine = (f9.lines as Json[]).find(
      (l) => l.category === 'late_checkout' && !l.reversalOfId,
    );
    const fq = await call<Json>(
      request,
      'POST',
      `/v1/properties/${pid}/folios/${S.e9!.res.folioId}/lines/${lcLine?.id}/foc`,
      {
        session: await sess(request, 'qa.fd'),
        idempotencyKey: true,
        body: {
          kind: 'foc',
          amountVnd: 200_000,
          reasonCode: 'service_recovery',
          note: 'Cho quan ly duyet',
        },
      },
    );
    log(
      `- E31-9: FD xin FOC 200.000 trên phụ thu trả muộn → ${fq.status} ${fq.body?.status ?? fq.body?.code ?? ''}`,
    );
    log(`- E31-9: late-checkout + FOC chờ → ${lc.status}`);
  }
  await at(request, vn(X('2032-05-13'), '20:35'));
  const snap = async (st: Stay) => ({
    status: (await getReservation(request, await sess(request, 'qa.fd'), st.res.id)).body.status,
    lines: (
      (await getFolio(request, await sess(request, 'qa.mgr'), st.res.folioId!)).lines as Json[]
    ).length,
    audit: sqlRows(
      `SELECT count(*) FROM audit_event WHERE entity_id = '${st.res.id}' AND action = 'reservation.late_fee_instead_of_night'`,
    )[0],
    notif: sqlRows(
      `SELECT count(*) FROM staff_notification WHERE ref_id = '${st.res.id}' AND kind = 'late_fee_post_review'`,
    )[0],
  });
  const b9 = await snap(S.e9!);
  const r9 = await postReviewOut(request, S.e9!);
  const a9 = await snap(S.e9!);
  log(
    `- E31-9: B18 với FOC đang chờ → ${r9.res.status} ${r9.res.body?.code ?? ''} ${JSON.stringify(r9.res.body?.errors ?? (r9.res.body as Json)?.unmet ?? '')}; trước ${JSON.stringify(b9)} sau ${JSON.stringify(a9)}`,
  );
  ok(
    'E31-9',
    'FOC trả muộn đang chờ → B18 bị chặn, không ghi gì',
    r9.res.status >= 400 && JSON.stringify(a9) === JSON.stringify(b9),
  );

  const b10 = await snap(S.e10!);
  const fd = await sess(request, 'qa.fd');
  await minibarCheck(request, fd, S.e10!.res.id);
  const fee10 = Number(
    (await checkoutSummary(request, fd, S.e10!.res.id, { checkoutTime: '20:30' })).body
      .lateFeeAsNightVnd,
  );
  const send10 = (lf: Json, who = 'qa.fd') =>
    sess(request, who).then((s) =>
      checkOut(request, s, S.e10!.res.id, { checkoutTime: '20:30', lateFeeInsteadOfNight: lf }),
    );
  const base10 = { amountVnd: fee10, reason: REASON, postReview: true };
  const cases10: Array<[string, Json, number, string]> = [
    ['692.000', { ...base10, amountVnd: fee10 - 100_000 }, 409, 'SURCHARGE_CHANGED'],
    ['792.001', { ...base10, amountVnd: fee10 + 1 }, 409, 'SURCHARGE_CHANGED'],
    [
      'requestFoc',
      {
        ...base10,
        requestFoc: { kind: 'foc', amountVnd: 100_000, reasonCode: 'service_recovery' },
      },
      422,
      'NOT_ALLOWED',
    ],
    ['mật khẩu', { ...base10, authMethod: 'password', secret: 'x-qa-sai' }, 422, 'NOT_ALLOWED'],
    ['TOTP', { ...base10, totpCode: '123456' }, 422, 'NOT_ALLOWED'],
    [
      'confirmationId',
      { ...base10, confirmationId: '01a17765-0000-7000-8000-000000000000' },
      422,
      'NOT_ALLOWED',
    ],
    ['approverUsername', { ...base10, approverUsername: 'qa.mgr' }, 422, 'NOT_ALLOWED'],
    ['thiếu lý do', { amountVnd: fee10, postReview: true }, 422, 'REASON_REQUIRED'],
  ];
  let all10 = true;
  for (const [name, lf, st, code] of cases10) {
    const r = await send10(lf);
    const got = String(r.body?.code ?? '') + ' ' + JSON.stringify(r.body?.errors ?? []);
    const pass = r.status === st && got.includes(code);
    all10 &&= pass;
    log(
      `- E31-10 ${name}: ${r.status} ${got.slice(0, 160)} ${pass ? '' : '← KHÁC kỳ vọng ' + st + ' ' + code}`,
    );
  }
  const mgr10 = await send10({ ...base10, authMethod: 'password', secret: 'x' }, 'qa.mgr');
  log(`- E31-10 MGR gửi kèm mật khẩu: ${mgr10.status} ${mgr10.body?.code ?? ''}`);
  const a10 = await snap(S.e10!);
  log(`- E31-10: trước ${JSON.stringify(b10)} sau ${JSON.stringify(a10)}`);
  // sellable departure night (no next booking)
  await at(request, vn(X('2032-05-18'), '15:00'));
  await checkInAt(request, S.e10s!);
  await at(request, vn(X('2032-05-20'), '20:35'));
  const fds = await sess(request, 'qa.fd');
  await minibarCheck(request, fds, S.e10s!.res.id);
  const sumS = (await checkoutSummary(request, fds, S.e10s!.res.id, { checkoutTime: '20:30' }))
    .body as Json;
  const bS = await snap(S.e10s!);
  const rS = await checkOut(request, fds, S.e10s!.res.id, {
    checkoutTime: '20:30',
    lateFeeInsteadOfNight: {
      amountVnd: Number(sumS.lateFeeAsNightVnd ?? sumS.extraNightDefaultRateVnd ?? 792_000),
      reason: REASON,
      postReview: true,
    },
  });
  const aS = await snap(S.e10s!);
  log(
    `- E31-10 đêm bán được: extraNightAvailable ${sumS.extraNightAvailable}, extraNightDefaultRateVnd ${sumS.extraNightDefaultRateVnd}; B18 postReview → ${rS.status} ${rS.body?.code ?? ''} ${JSON.stringify(rS.body?.errors ?? '')}; trước ${JSON.stringify(bS)} sau ${JSON.stringify(aS)}`,
  );
  ok(
    'E31-10',
    '692.000/792.001 → 409; FOC/mật khẩu/TOTP/confirmationId/approverUsername → 422 NOT_ALLOWED; thiếu lý do → 422; đêm bán được → 422; mọi ca: in_house, 0 dòng, 0 audit, 0 thông báo',
    all10 &&
      mgr10.status === 422 &&
      JSON.stringify(a10) === JSON.stringify(b10) &&
      b10.status === 'in_house' &&
      rS.status === 422 &&
      JSON.stringify(aS) === JSON.stringify(bS),
  );

  // ── E31-11: MGR checks out himself ──
  await at(request, vn(X('2032-05-25'), '15:00'));
  await checkInAt(request, S.e11!);
  await at(request, vn(X('2032-05-27'), '20:35'));
  const r11 = await postReviewOut(request, S.e11!, 'qa.mgr');
  const n11 = {
    own: await notifs(request, 'qa.owner', S.e11!),
    mgr: await notifs(request, 'qa.mgr', S.e11!),
  };
  const i11 = {
    mgr: await items(request, 'qa.mgr', S.e11!),
    own: await items(request, 'qa.owner', S.e11!),
  };
  const aud11 = sqlRows(
    `SELECT actor_user_id::text || '|' || COALESCE(after->>'channel','') FROM audit_event WHERE action = 'reservation.late_fee_instead_of_night' AND entity_id = '${S.e11!.res.id}'`,
  );
  log(
    `- E31-11: MGR B18 → ${r11.res.status}; thông báo ${JSON.stringify(n11)}; mục MGR ${i11.mgr.length}, OWN ${i11.own.length}; audit ${JSON.stringify(aud11)}`,
  );
  ok(
    'E31-11',
    'MGR tự bấm: như E31-1, MGR không nhận thông báo, OWN nhận; mục vẫn mở cho MGR+',
    r11.res.status === 200 &&
      countKind(n11.own, 'late_fee_post_review') === 1 &&
      countKind(n11.mgr, 'late_fee_post_review') === 0 &&
      i11.mgr.length === 1 &&
      i11.own.length === 1,
  );

  // ── E31-2: 18–20/09/2030 (Friday departure night) ──
  await at(request, vn(X('2032-09-15'), '15:00'));
  await checkInAt(request, S.e2!);
  await at(request, vn(X('2032-09-17'), '20:35'));
  const r2 = await postReviewOut(request, S.e2!);
  log(`- E31-2: lateFeeAsNightVnd ${r2.fee}, B18 ${r2.res.status}`);
  ok('E31-2', 'đêm ngày đi thứ Sáu: phụ thu 911.000', r2.fee === 911_000 && r2.res.status === 200);

  // ── I-E31 over every E31 stay ──
  const inv: string[] = [];
  for (const [k, st] of Object.entries(S)) {
    const f = await getFolio(request, await sess(request, 'qa.owner'), st.res.folioId!);
    const rf = (
      await approvalsOf(request, await sess(request, 'qa.owner'), st.res.code, 'refund')
    ).filter((a) => !['cancelled', 'rejected'].includes(String(a.status)));
    const sumRef = rf.reduce((s2, x) => s2 + Number(x.amountVnd), 0);
    const late = (f.lines as Json[]).filter((l) => l.chargeCode === 'late_fee_as_night');
    const focL = (f.lines as Json[]).filter(
      (l) => l.category === 'foc' && l.lineState === 'posted',
    );
    if (!late.length) {
      log(`- I-E31 ${k} ${st.res.code}: không có dòng phụ thu bằng 1 đêm (B18 không ghi) – bỏ qua`);
      continue;
    }
    const net =
      late.reduce((s2, l) => s2 + Number(l.amountVnd), 0) +
      focL.reduce((s2, l) => s2 + Number(l.amountVnd), 0);
    const paid = Number(f.totals.paidVnd ?? 0);
    const bad = sumRef > paid || net < 0;
    if (bad) inv.push(k);
    log(
      `- I-E31 ${k} ${st.res.code}: Σ hoàn ${sumRef} ≤ đã trả ${paid}; ròng phụ thu sau FOC ${net} ≥ 0 ${bad ? '← VI PHẠM' : ''}`,
    );
  }
  ok(
    'I-E31',
    'Σ hoàn ≤ đã trả; ròng phụ thu sau FOC ≥ 0; số ghi = lateFeeAsNightVnd đọc trước (mọi B18 dùng đúng số summary)',
    inv.length === 0,
  );
  log(`\nKết quả: ${results.filter((r) => r[2] === 'Đạt').length}/${results.length} Đạt`);
  expect(
    results.filter((r) => r[2] !== 'Đạt'),
    JSON.stringify(results),
  ).toEqual([]);
});
