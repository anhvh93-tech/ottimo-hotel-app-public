// Smoke test of the investor DEMO stack (run by demo-up.sh --smoke, which reseeds a clean demo afterwards because
// this test CHANGES the scenario: it checks a guest in, checks the departing guest out and opens the guest link).
//   1. every demo role logs in (8 accounts) and reads its home data
//   2. rack of the next 14 days (front desk) + occupancy of the scenario (target 50–60 %)
//   3. check-in of today's arrival (document already entered, trusted desk device)
//   4. check-out of the guest leaving today: VietQR for the open balance → payment received → check-out
//   5. guest-web link of tomorrow's arrival: open the guest session from the guest origin, read the stay
// Secrets are read from DEMO_STATE and never printed.
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const API = process.env.DEMO_API_URL ?? 'http://127.0.0.1:3100';
const DESK = process.env.DEMO_DESK_URL ?? 'http://localhost:8181';
const GUEST = process.env.DEMO_GUEST_URL ?? 'http://localhost:8183';
const st = JSON.parse(readFileSync(process.env.DEMO_STATE ?? '.work/state.json', 'utf8'));
let failures = 0;
const ok = (m) => console.log(`ok   ${m}`);
const bad = (m) => {
  console.log(`FAIL ${m}`);
  failures++;
};

async function http(method, path, o = {}) {
  const headers = { accept: 'application/json' };
  const cookies = [];
  if (o.s) cookies.push(`ottimo_sid=${o.s.token}`);
  if (o.device) cookies.push(`ottimo_did=${o.device}`);
  if (o.gsid) cookies.push(`ottimo_gsid=${o.gsid}`);
  if (cookies.length) headers.cookie = cookies.join('; ');
  if (method !== 'GET') {
    headers.origin = o.origin ?? DESK;
    if (o.s) headers['x-csrf-token'] = o.s.csrf;
    headers['idempotency-key'] = randomUUID();
  }
  if (o.ifMatch !== undefined) headers['if-match'] = `"${o.ifMatch}"`;
  let body;
  if (o.form) body = o.form;
  else if (o.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(o.body);
  }
  const qs = o.query ? `?${new URLSearchParams(o.query)}` : '';
  const res = await fetch(`${API}${path}${qs}`, { method, headers, body, redirect: 'manual' });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = text;
  }
  return { status: res.status, body: json, setCookies: res.headers.getSetCookie?.() ?? [] };
}
const cookieOf = (sc, name) =>
  sc.map((c) => new RegExp(`^(?:__Host-)?${name}=([^;]+)`).exec(c)?.[1]).find(Boolean);
const listOf = (b) => (Array.isArray(b) ? b : (b?.data ?? b?.items ?? []));
const short = (b) => JSON.stringify(b ?? '').slice(0, 300);

async function login(a) {
  const r = await http('POST', '/v1/auth/login', {
    body: { username: a.username, password: a.password },
  });
  if (r.status !== 200) {
    bad(`đăng nhập ${a.key} (${a.username}): HTTP ${r.status} ${short(r.body)}`);
    return null;
  }
  const me = r.body;
  return {
    key: a.key,
    username: a.username,
    token: cookieOf(r.setCookies, 'ottimo_sid'),
    csrf: me.csrfToken,
    pid: me.activePropertyId ?? me.properties?.[0]?.propertyId,
    me,
  };
}
const P = (s, rest = '') => `/v1/properties/${s.pid}${rest}`;

// 1. every role
const S = {};
// One screen each role can use in this build (Hôm nay / Tổng quan / HK / maintenance apps are Sprint 4).
const home = {
  OWN: (s) => P(s, '/parameters'),
  MGR: (s) => P(s, '/approval-requests'),
  FDL: (s) => P(s, '/attention'),
  FD: (s) => P(s, '/rack'),
  SAL: (s) => P(s, '/quotes'),
  CTV: (s) => P(s, '/quotes'),
  HK: (s) => P(s, '/rack'),
  MT: (s) => P(s, '/room-blocks'),
};
for (const a of Object.values(st.accounts)) {
  const s = await login(a);
  if (!s) continue;
  S[a.key] = s;
  const r = await http('GET', home[a.key](s), { s });
  if (r.status === 200)
    ok(`${a.key} đăng nhập + đọc màn chính (${home[a.key](s).split('/').pop()})`);
  else bad(`${a.key} màn chính: HTTP ${r.status} ${short(r.body)}`);
}
const fd = S.FD;
if (!fd) {
  console.log('FAIL không đăng nhập được lễ tân');
  process.exit(1);
}

// 2. rack + occupancy
const rack = await http('GET', P(fd, '/rack'), { s: fd, query: { from: st.today, days: '14' } });
if (rack.status === 200) ok('rack 14 ngày');
else bad(`rack: HTTP ${rack.status} ${short(rack.body)}`);
const resList = await http('GET', P(fd, '/reservations'), {
  s: fd,
  query: { stayFrom: st.today, stayTo: addDays(st.today, 14), limit: '100' },
});
if (resList.status === 200) {
  let nights = 0;
  for (const r of listOf(resList.body)) {
    if (
      ['cancelled', 'no_show', 'checked_out'].includes(r.status) ||
      !(r.segments?.[0]?.roomId ?? r.roomId ?? r.roomNo)
    )
      continue;
    for (let d = 0; d < 14; d++) {
      const day = addDays(st.today, d);
      if (r.arrivalDate <= day && day < r.departureDate) nights++;
    }
  }
  const pct = Math.round((nights / 140) * 100);
  (pct >= 45 && pct <= 70 ? ok : bad)(
    `công suất 14 đêm tới: ${nights}/140 đêm-phòng ≈ ${pct} % (mục tiêu 50–60 %)`,
  );
} else bad(`listReservations: HTTP ${resList.status} ${short(resList.body)}`);

function addDays(date, n) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const nowLocal = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());

// 3. check-in of today's arrival: main guest document from the trusted desk device, pay the balance (BR-402)
{
  const id = st.ids.arrivalToday;
  const res = (await http('GET', P(fd, `/reservations/${id}`), { s: fd })).body;
  let regId = res.registrationId;
  if (!regId) {
    const l = await http('GET', P(fd, '/registrations'), {
      s: fd,
      query: { view: 'all', limit: '100' },
    });
    regId = listOf(l.body).find((x) => x.reservationId === id)?.id;
  }
  const form = new FormData();
  form.append(
    'data',
    JSON.stringify({
      docType: 'cccd',
      isMain: true,
      fullNameOnDoc: 'NGUYEN THU TRANG',
      docNumber: `079${String(Date.now()).slice(-9)}`,
      dateOfBirth: '1991-05-12',
      gender: 'female',
      nationalityCode: 'VNM',
      address: '12 Phan Đình Phùng, Đà Lạt',
      captureMethod: 'manual',
    }),
  );
  const doc = await http('POST', P(fd, `/registrations/${regId}/documents`), {
    s: fd,
    device: st.deviceToken,
    form,
  });
  if (doc.status === 201) ok('nhập giấy tờ người đứng tên (máy quầy tin cậy)');
  else bad(`nhập giấy tờ: HTTP ${doc.status} ${short(doc.body)}`);
  const folio = (await http('GET', P(fd, `/folios/${res.folioId}`), { s: fd })).body;
  if (folio?.totals?.balanceDueVnd > 0) {
    const p = await http('POST', P(fd, `/folios/${res.folioId}/payments`), {
      s: fd,
      body: { type: 'charge', method: 'cash', amountVnd: folio.totals.balanceDueVnd },
    });
    if (p.status !== 201) bad(`thu tiền trước nhận phòng: HTTP ${p.status} ${short(p.body)}`);
  }
  const cur = (await http('GET', P(fd, `/reservations/${id}`), { s: fd })).body;
  let r = await http('POST', P(fd, `/reservations/${id}/actions/check-in`), {
    s: fd,
    device: st.deviceToken,
    ifMatch: cur.version,
    body: { checkinTime: nowLocal(), cardsIssued: 1, houseRulesSent: true },
  });
  if (r.status === 422 && short(r.body).includes('SURCHARGE_DECISION_REQUIRED')) {
    // before 14:00: take the early check-in surcharge the preview shows (desk default of the E2E harness)
    const pv = (
      await http('GET', P(fd, `/reservations/${id}/check-in-preview`), {
        s: fd,
        query: { checkinTime: nowLocal() },
      })
    ).body;
    const early = pv?.earlyCheckinSurcharge ?? {};
    const decision = early.addsPreviousNight
      ? { addPriorNight: true }
      : { applyEarlySurcharge: true, expectedSurchargeVnd: early.amountVnd ?? 0 };
    const again = (await http('GET', P(fd, `/reservations/${id}`), { s: fd })).body;
    r = await http('POST', P(fd, `/reservations/${id}/actions/check-in`), {
      s: fd,
      device: st.deviceToken,
      ifMatch: again.version,
      body: { checkinTime: nowLocal(), cardsIssued: 1, houseRulesSent: true, ...decision },
    });
  }
  if (
    r.status === 409 &&
    r.body?.code === 'CHECKIN_CONDITIONS_NOT_MET' &&
    (r.body.unmet ?? []).every((u) => u === 'room_ready') &&
    S.FDL
  ) {
    const again = (await http('GET', P(fd, `/reservations/${id}`), { s: fd })).body;
    r = await http('POST', P(S.FDL, `/reservations/${id}/actions/check-in`), {
      s: S.FDL,
      device: st.deviceToken,
      ifMatch: again.version,
      body: {
        checkinTime: nowLocal(),
        cardsIssued: 1,
        houseRulesSent: true,
        roomNotReadyOverride: { reason: 'smoke demo' },
      },
    });
  }
  if (r.status === 200 && r.body?.status === 'in_house')
    ok(`nhận phòng ${r.body.code} (đến hôm nay)`);
  else bad(`nhận phòng: HTTP ${r.status} ${short(r.body)}`);
}

// 4. check-out with VietQR
{
  const id = st.ids.departingToday;
  const res = (await http('GET', P(fd, `/reservations/${id}`), { s: fd })).body;
  const folio = (await http('GET', P(fd, `/folios/${res.folioId}`), { s: fd })).body;
  const due = folio?.totals?.balanceDueVnd ?? 0;
  if (due > 0) {
    const q = await http('POST', P(fd, `/folios/${res.folioId}/vietqr`), {
      s: fd,
      body: { amountVnd: due, purpose: 'balance' },
    });
    if (q.status === 201 || q.status === 200) {
      ok(`VietQR ${due.toLocaleString('vi-VN')} đ cho bill ${res.code}`);
      const pay = q.body.payment ?? q.body;
      const pid = pay.id ?? q.body.paymentId;
      const c = await http('POST', P(fd, `/payments/${pid}/actions/confirm-received`), {
        s: fd,
        ifMatch: pay.version,
        body: {},
      });
      if ([200, 201].includes(c.status)) ok('lễ tân xác nhận đã thấy tiền VietQR');
      else bad(`xác nhận VietQR: HTTP ${c.status} ${short(c.body)}`);
    } else bad(`tạo VietQR: HTTP ${q.status} ${short(q.body)}`);
  } else ok(`bill ${res.code} không còn nợ`);
  const std = await http('GET', P(fd, `/reservations/${id}/minibar-standard`), { s: fd });
  if (std.status === 200 && listOf(std.body.items ?? std.body).length) {
    await http('POST', P(fd, `/reservations/${id}/minibar-checks`), {
      s: fd,
      body: {
        mode: 'checkout',
        lines: (std.body.items ?? []).map((i) => ({
          itemId: i.itemId,
          remainingQty: i.standardQty,
        })),
      },
    });
  }
  const cur = (await http('GET', P(fd, `/reservations/${id}`), { s: fd })).body;
  const checkOut = (extra) =>
    http('POST', P(fd, `/reservations/${id}/actions/check-out`), {
      s: fd,
      ifMatch: cur.version,
      body: { checkoutTime: nowLocal(), ...extra },
    });
  let r = await checkOut({});
  // After the grace time (BR-425) the desk must decide on the late check-out surcharge, like the UI does:
  // apply it with the amount the server quotes (409 SURCHARGE_CHANGED carries it), then retry.
  const lateDecision = (res) =>
    res.status === 422 && (res.body?.errors ?? []).some((e) => e.field === 'applyLateSurcharge');
  if (lateDecision(r)) {
    const quote = await checkOut({ applyLateSurcharge: true, expectedSurchargeVnd: 0 });
    const amount = quote.status === 409 ? quote.body?.surchargeVnd : undefined;
    r =
      amount === undefined
        ? quote
        : await checkOut({ applyLateSurcharge: true, expectedSurchargeVnd: amount });
    if (amount !== undefined)
      ok(`phụ thu trả muộn ${amount.toLocaleString('vi-VN')} đ (sau giờ ân hạn)`);
  }
  if (r.status === 200) ok(`trả phòng ${cur.code}`);
  else bad(`trả phòng: HTTP ${r.status} ${short(r.body)}`);
}

// 5. guest-web link
{
  const token = st.guestLink?.url?.split('/g/')[1];
  if (!token) bad('không có link khách');
  else {
    const r = await http('POST', '/v1/guest/sessions', { origin: GUEST, body: { token } });
    const gsid = cookieOf(r.setCookies, 'ottimo_gsid');
    if ([200, 201].includes(r.status) && gsid) {
      ok('mở link khách (phiên mức 1)');
      const stay = await http('GET', '/v1/guest/stay', { gsid });
      if (stay.status === 200) ok(`web khách đọc lượt ở (căn ${stay.body.roomNo ?? '?'})`);
      else bad(`getGuestStay: HTTP ${stay.status} ${short(stay.body)}`);
    } else bad(`openGuestSession: HTTP ${r.status} ${short(r.body)}`);
  }
}

console.log(failures === 0 ? 'SMOKE ĐẠT' : `SMOKE: ${failures} lỗi`);
process.exit(failures === 0 ? 0 : 1);
