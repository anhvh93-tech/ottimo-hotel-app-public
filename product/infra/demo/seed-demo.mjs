// OTTIMO Desk – investor DEMO data, created THROUGH THE API (same business rules as the real app), around the
// business date of the day the script runs (Asia/Ho_Chi_Minh, roll-over 06:00). Run by lib.sh seed_all():
//   node seed-demo.mjs past   phase 1 – stack with the fake clock (ottimo-api:demo-seed): demo accounts, trusted
//                             desk device, guests, and the stays that started BEFORE today (long stay since a month,
//                             guests in house since yesterday / the day before), each checked in on its own day
//   node seed-demo.mjs now    phase 2 – real demo stack (real clock, no test endpoints): today's and future bookings,
//                             hold, CTV quote, OOO, unassigned OTA booking, VietQR receiving account, guest link,
//                             accounts file .out/demo-accounts.md (0600)
// Data is FAKE (names, phones, ID numbers); only the VietQR receiving account comes from product/.env (investor's).
// Secrets (passwords, link token, device cookie) go to DEMO_STATE (.work/state.json) and .out only – never to stdout.
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API = process.env.DEMO_API_URL ?? 'http://127.0.0.1:3100';
const DESK = process.env.DEMO_DESK_URL ?? 'http://localhost:8181';
const STAFF = process.env.DEMO_STAFF_URL ?? 'http://localhost:8182';
const STATE = process.env.DEMO_STATE ?? '.work/state.json';
const OUT = process.env.DEMO_OUT ?? '.out';
const TZ = 'Asia/Ho_Chi_Minh';
const phase = process.argv[2];

// ───────────────────────── small utilities ─────────────────────────
const log = (m) => console.log(`[demo-seed ${new Date().toTimeString().slice(0, 8)}] ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function addDays(date, n) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function localNow() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
    hour: Number(p.hour),
  };
}
/** Business date (BR-010: the day rolls over at 06:00 local). */
function businessToday() {
  const n = localNow();
  return n.hour < 6 ? addDays(n.date, -1) : n.date;
}
const at = (date, hhmm) => `${date}T${hhmm}:00+07:00`;
/** Random password: letters + digits + symbol, 18 chars, never contains a username or "ottimo". */
function password() {
  return `${randomBytes(12).toString('base64url').replace(/[-_]/g, 'x')}-${randomInt(10, 99)}Q`;
}
function readState() {
  return existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {};
}
function writeState(s) {
  writeFileSync(STATE, JSON.stringify(s, null, 2), { mode: 0o600 });
  chmodSync(STATE, 0o600);
}

// ───────────────────────── HTTP (cookies, CSRF, Origin, Idempotency, If-Match) ─────────────────────────
function cookieOf(setCookies, name) {
  for (const c of setCookies) {
    const m = new RegExp(`^(?:__Host-)?${name}=([^;]+)`).exec(c);
    if (m) return m[1];
  }
  return undefined;
}
async function http(method, path, o = {}) {
  const headers = { accept: 'application/json', ...(o.headers ?? {}) };
  const cookies = [];
  if (o.s) cookies.push(`ottimo_sid=${o.s.token}`);
  if (o.device) cookies.push(`ottimo_did=${o.device}`);
  if (o.guestCookie) cookies.push(`ottimo_gsid=${o.guestCookie}`);
  if (cookies.length) headers.cookie = cookies.join('; ');
  if (method !== 'GET') {
    headers.origin = o.origin ?? DESK;
    if (o.s) headers['x-csrf-token'] = o.s.csrf;
  }
  if (o.idem) headers['idempotency-key'] = randomUUID();
  if (o.ifMatch !== undefined) headers['if-match'] = `"${o.ifMatch}"`;
  if (o.testToken) headers['x-test-token'] = o.testToken;
  let body;
  if (o.form) body = o.form;
  else if (o.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(o.body);
  }
  const qs = o.query
    ? `?${new URLSearchParams(Object.entries(o.query).filter(([, v]) => v !== undefined))}`
    : '';
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}${path}${qs}`, { method, headers, body, redirect: 'manual' });
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = text;
    }
    if (res.status === 429 && attempt < 3) {
      const wait = Math.min(Number(res.headers.get('retry-after') ?? 10) || 10, 65);
      log(`giới hạn tần suất (429) – chờ ${wait} giây`);
      await sleep(wait * 1000 + 300);
      if (o.idem) headers['idempotency-key'] = randomUUID();
      continue;
    }
    return {
      status: res.status,
      body: json,
      headers: res.headers,
      setCookies: res.headers.getSetCookie?.() ?? [],
    };
  }
}
function must(r, expected, what) {
  const ok = Array.isArray(expected) ? expected.includes(r.status) : r.status === expected;
  if (!ok) {
    const b = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    throw new Error(`${what}: HTTP ${r.status} ${String(b).slice(0, 600)}`);
  }
  return r.body;
}
const listOf = (b) => (Array.isArray(b) ? b : (b?.data ?? b?.items ?? []));

// ───────────────────────── sessions ─────────────────────────
async function login(username, pw) {
  const r = await http('POST', '/v1/auth/login', { body: { username, password: pw } });
  must(r, 200, `đăng nhập ${username}`);
  const token = cookieOf(r.setCookies, 'ottimo_sid');
  if (!token) throw new Error(`đăng nhập ${username}: không có cookie phiên`);
  const me = r.body;
  const propertyId = me.activePropertyId ?? me.properties?.[0]?.propertyId;
  return { username, token, csrf: me.csrfToken, me, id: me.id, pid: propertyId };
}
async function refreshMe(s) {
  const r = await http('GET', '/v1/me', { s });
  must(r, 200, `getMe ${s.username}`);
  s.me = r.body;
  s.csrf = r.body.csrfToken;
  s.pid = r.body.activePropertyId ?? r.body.properties?.[0]?.propertyId;
  return s;
}
async function changePassword(s, current, next) {
  const r = await http('POST', '/v1/me/password', {
    s,
    body: { currentPassword: current, newPassword: next },
  });
  must(r, 204, `đổi mật khẩu ${s.username}`);
  s.token = cookieOf(r.setCookies, 'ottimo_sid') ?? s.token;
  return refreshMe(s);
}
const P = (s, rest = '') => `/v1/properties/${s.pid}${rest}`;

// ───────────────────────── fake clock (phase 1 only) ─────────────────────────
async function setClock(owner, iso) {
  const r = await http('POST', '/__test__/clock', {
    s: owner,
    testToken: process.env.TEST_SUPPORT_TOKEN,
    body: { op: 'set', at: iso },
  });
  must(r, 200, `đặt đồng hồ ${iso}`);
  log(`đồng hồ giả → ${iso}`);
}

// ───────────────────────── catalogue ─────────────────────────
async function loadContext(s) {
  const rooms = listOf(must(await http('GET', P(s, '/rooms'), { s }), 200, 'listRooms'));
  const channels = listOf(must(await http('GET', P(s, '/channels'), { s }), 200, 'listChannels'));
  return {
    room: (no) => {
      const r = rooms.find((x) => x.roomNo === no);
      if (!r) throw new Error(`không có căn ${no}`);
      return r;
    },
    channel: (code) => {
      const c = channels.find((x) => x.code === code);
      if (!c) throw new Error(`không có kênh ${code}`);
      return c;
    },
  };
}

// Demo staff – one per role (display names are fictional).
const STAFF_ACCOUNTS = [
  { key: 'OWN', username: 'chunha', displayName: 'Chủ nhà OTTIMO', role: 'owner', app: 'desk' },
  {
    key: 'MGR',
    username: 'quanly.thao',
    displayName: 'Quản lý Thảo',
    role: 'manager',
    app: 'desk',
  },
  {
    key: 'FDL',
    username: 'truongca.khoa',
    displayName: 'Trưởng ca Khoa',
    role: 'front_desk_lead',
    app: 'desk',
  },
  {
    key: 'FD',
    username: 'letan.linh',
    displayName: 'Lễ tân Linh',
    role: 'front_desk',
    app: 'desk',
  },
  {
    key: 'SAL',
    username: 'sale.duc',
    displayName: 'Sale Đức',
    role: 'sales_staff',
    app: 'desk + staff',
  },
  {
    key: 'CTV',
    username: 'ctv.minhanh',
    displayName: 'CTV Minh Anh',
    role: 'collaborator',
    app: 'desk + staff',
  },
  {
    key: 'HK',
    username: 'buongphong.hoa',
    displayName: 'Buồng phòng Hoa',
    role: 'housekeeping',
    app: 'staff',
  },
  {
    key: 'MT',
    username: 'kythuat.tam',
    displayName: 'Kỹ thuật Tâm',
    role: 'maintenance',
    app: 'staff',
  },
];

// Fake guests (Vietnamese + foreign travellers to Đà Lạt). Phones are fake 0900 000 xxx numbers.
const GUESTS = [
  ['Nguyễn Thu Trang', 'vn'],
  ['Trần Minh Quân', 'vn'],
  ['Lê Hoàng Yến', 'vn'],
  ['Phạm Gia Huy', 'vn'],
  ['Võ Ngọc Ánh', 'vn'],
  ['Đặng Quốc Bảo', 'vn'],
  ['Bùi Thảo Vy', 'vn'],
  ['Hoàng Đức Anh', 'vn'],
  ['Ngô Mỹ Linh', 'vn'],
  ['Dương Tuấn Kiệt', 'vn'],
  ['Lý Khánh Ngân', 'vn'],
  ['Trịnh Bảo Châu', 'vn'],
  ['Phan Thế Vinh', 'vn'],
  ['Mai Phương Thảo', 'vn'],
  ['Hồ Nhật Nam', 'vn'],
  ['Châu Gia Hân', 'vn'],
  ['Anna Petrova', 'ru'],
  ['Kim Min-ji', 'kr'],
  ['Lukas Schneider', 'de'],
  ['Sophie Martin', 'fr'],
  ['Dmitri Volkov', 'ru'],
  ['Đỗ Thanh Tâm', 'vn'],
  ['Tạ Minh Khôi', 'vn'],
  ['La Ngọc Hà', 'vn'],
  ['Nghiêm Hải Yến', 'vn'],
  ['Quách Minh Trí', 'vn'],
  ['Lâm Bảo Ngọc', 'vn'],
  ['Chen Wei', 'cn'],
  ['Elena Ivanova', 'ru'],
  ['Kiều Anh Thư', 'vn'],
  ['Tôn Thất Phúc', 'vn'],
  // last one: created by the CTV for the CTV quote (D6)
  ['Vương Thị Hồng', 'vn'],
];
async function createGuest(s, i) {
  const [fullName, kind] = GUESTS[i % GUESTS.length];
  const phone = `0900${String(100000 + i * 7 + randomInt(0, 6)).slice(-6)}`;
  const body = { fullName, phone };
  if (kind !== 'vn') body.email = `${fullName.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`;
  const r = await http('POST', P(s, '/guests'), { s, idem: true, body });
  return { id: must(r, 201, `tạo khách ${fullName}`).id, fullName, kind };
}

// ───────────────────────── reservations ─────────────────────────
function rates(arrival, nights, vnd) {
  return Array.from({ length: nights }, (_, i) => ({ date: addDays(arrival, i), amountVnd: vnd }));
}
/**
 * createReservation. Direct/agent bookings carry the BR-305 deposit: the first call without it answers
 * 422 DEPOSIT_INSUFFICIENT with depositRequiredVnd (nothing written) → resend once with that deposit.
 */
async function book(s, c, b) {
  const ch = c.channel(b.channel);
  const ota = ch.channelGroup === 'ota';
  const body = {
    roomId: c.room(b.room).id,
    channelId: ch.id,
    arrivalDate: b.arrival,
    departureDate: addDays(b.arrival, b.nights),
    adults: b.adults ?? 2,
    children6to11: b.kids ?? 0,
    childrenUnder6: 0,
    bookerGuestId: b.guest.id,
    paymentModel: ota ? (b.paymentModel ?? 'ota_prepaid') : 'direct',
    ...(ch.channelGroup === 'direct' ? { directSource: b.source ?? 'zalo_phone' } : {}),
    ...(ch.channelGroup === 'agent' || b.closer ? { closerUserId: b.closer } : {}),
    ...(ota
      ? {
          otaRef: `${b.channel.slice(0, 2).toUpperCase()}${randomInt(10000000, 99999999)}`,
          nightlyRates: rates(b.arrival, b.nights, b.rate ?? 1150000),
        }
      : {}),
    ...(b.extra ?? {}),
  };
  let r = await http('POST', P(s, '/reservations'), { s, idem: true, body });
  if (r.status === 422 && r.body?.code === 'DEPOSIT_INSUFFICIENT' && r.body?.depositRequiredVnd) {
    r = await http('POST', P(s, '/reservations'), {
      s,
      idem: true,
      body: {
        ...body,
        initialPayment: {
          type: 'deposit',
          method: b.depositMethod ?? 'cash',
          amountVnd: r.body.depositRequiredVnd,
        },
      },
    });
  }
  if (r.status === 409 && b.allowUnassigned) {
    r = await http('POST', P(s, '/reservations'), {
      s,
      idem: true,
      body: { ...body, allowUnassigned: true },
    });
  }
  const res = must(r, 201, `đặt phòng ${b.label ?? ''} ${b.room} ${b.arrival} ${b.nights} đêm`);
  log(`  ${res.code} ${b.room} ${b.arrival} +${b.nights} đêm (${b.channel}) – ${b.label ?? ''}`);
  return res;
}
const getRes = async (s, id) =>
  must(await http('GET', P(s, `/reservations/${id}`), { s }), 200, 'getReservation');
const getFolio = async (s, id) =>
  must(await http('GET', P(s, `/folios/${id}`), { s }), 200, 'getFolio');
async function payBalance(s, folioId, method = 'cash') {
  const f = await getFolio(s, folioId);
  if (f.totals.balanceDueVnd > 0) {
    must(
      await http('POST', P(s, `/folios/${folioId}/payments`), {
        s,
        idem: true,
        body: { type: 'charge', method, amountVnd: f.totals.balanceDueVnd },
      }),
      201,
      'thu tiền phòng',
    );
  }
}
async function registrationOf(s, res) {
  if (res.registrationId) return res.registrationId;
  const fresh = await getRes(s, res.id);
  if (fresh.registrationId) return fresh.registrationId;
  const l = must(
    await http('GET', P(s, '/registrations'), { s, query: { view: 'all', limit: 100 } }),
    200,
    'listRegistrations',
  );
  const hit = listOf(l).find((x) => x.reservationId === res.id);
  if (!hit) throw new Error(`không thấy khai báo của ${res.code}`);
  return hit.id;
}
function fakeDoc(guest, arrival, departure) {
  const yob = 1975 + randomInt(0, 25);
  if (guest.kind === 'vn') {
    return {
      docType: 'cccd',
      isMain: true,
      fullNameOnDoc: guest.fullName.toUpperCase(),
      docNumber: `0${randomInt(10, 99)}${String(randomInt(0, 1e9)).padStart(9, '0')}`,
      dateOfBirth: `${yob}-0${randomInt(1, 9)}-1${randomInt(0, 9)}`,
      gender: randomInt(0, 2) ? 'female' : 'male',
      nationalityCode: 'VNM',
      address: `${randomInt(2, 199)} Phan Đình Phùng, Phường 1, Đà Lạt, Lâm Đồng`,
      captureMethod: 'manual',
    };
  }
  const nat = { ru: 'RUS', kr: 'KOR', de: 'DEU', fr: 'FRA', cn: 'CHN' }[guest.kind] ?? 'DEU';
  const ascii = guest.fullName.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  return {
    docType: 'passport',
    isMain: true,
    fullNameOnDoc: ascii,
    docNumber: `C${String.fromCharCode(65 + randomInt(0, 26))}${String(randomInt(0, 1e7)).padStart(7, '0')}`,
    dateOfBirth: `${yob}-04-0${randomInt(1, 9)}`,
    gender: 'male',
    nationalityCode: nat,
    passportIssueDate: '2021-03-15',
    passportExpiryDate: addDays(departure, 2500),
    visaKind: 'visa_exempt',
    visaValidUntil: addDays(departure, 30),
    entryDate: addDays(arrival, -3),
    entryPort: 'Tan Son Nhat',
    entryPurpose: 'DL',
    captureMethod: 'manual',
  };
}
async function addDoc(s, device, regId, data) {
  const form = new FormData();
  form.append('data', JSON.stringify(data));
  const r = await http('POST', P(s, `/registrations/${regId}/documents`), {
    s,
    device,
    idem: true,
    form,
  });
  must(r, 201, 'nhập giấy tờ người đứng tên');
}
async function checkIn(s, device, resId, time, lead) {
  const send = async (who, extra = {}) => {
    const cur = await getRes(who, resId);
    return http('POST', P(who, `/reservations/${resId}/actions/check-in`), {
      s: who,
      device,
      idem: true,
      ifMatch: cur.version,
      body: { checkinTime: time, cardsIssued: 1, houseRulesSent: true, ...extra },
    });
  };
  let r = await send(s);
  if (r.status === 422 && JSON.stringify(r.body).includes('SURCHARGE_DECISION_REQUIRED')) {
    r = await send(s, { applyEarlySurcharge: false });
  }
  if (r.status === 409 && r.body?.code === 'CHECKIN_CONDITIONS_NOT_MET' && lead) {
    const unmet = r.body.unmet ?? [];
    if (unmet.every((u) => u === 'room_ready'))
      r = await send(lead, {
        roomNotReadyOverride: { reason: 'Buồng đã dọn, chưa bấm trạng thái (dữ liệu demo)' },
      });
  }
  return must(r, 200, `nhận phòng ${resId}`);
}
// ───────────────────────── phase 1: the past ─────────────────────────
async function phasePast() {
  const D = businessToday();
  const st = { today: D, createdAt: new Date().toISOString(), accounts: {}, ids: {} };
  const S = {};
  let owner = await login('qa.owner', process.env.QA_SEED_PASSWORD);
  let lastVirtual = at(addDays(D, -35), '09:00');
  await setClock(owner, lastVirtual);
  /**
   * Jump the fake clock. Sessions die on a jump (idle timeout counted on the fake clock), so the in-memory login
   * windows are cleared first (SR-RL-01: 20 logins / IP / 15 min – test endpoint, seeding phase only) and every
   * session in use is opened again.
   */
  async function jump(iso, keys = ['FD', 'FDL']) {
    must(
      await http('POST', '/__test__/rate-limits/reset', {
        s: owner,
        testToken: process.env.TEST_SUPPORT_TOKEN,
        body: {},
      }),
      200,
      'đặt lại giới hạn đăng nhập',
    );
    await setClock(owner, iso);
    lastVirtual = iso;
    owner = await login('qa.owner', process.env.QA_SEED_PASSWORD);
    for (const k of keys) S[k] = await login(st.accounts[k].username, st.accounts[k].password);
  }

  // demo accounts (temporary password → each person sets the final random one: no "must change" on first login)
  log('tạo tài khoản demo cho 8 vai');
  for (const a of STAFF_ACCOUNTS) {
    const temp = password();
    const r = await http('POST', '/v1/users', {
      s: owner,
      idem: true,
      body: {
        username: a.username,
        displayName: a.displayName,
        initialPassword: temp,
        roles: [{ propertyId: owner.pid, role: a.role }],
      },
    });
    const u = must(r, 201, `tạo tài khoản ${a.username}`);
    const finalPw = password();
    S[a.key] = await changePassword(await login(a.username, temp), temp, finalPw);
    st.accounts[a.key] = { ...a, id: u.id, password: finalPw };
  }
  writeState(st);

  // trusted desk device (SR-DEV-02): issued by the owner, same mechanism as the DS-E seed devices
  const tr = await http('POST', P(S.OWN, '/trusted-devices'), {
    s: S.OWN,
    idem: true,
    body: {
      name: 'Máy quầy lễ tân (demo)',
      deviceKind: 'desk',
      currentPassword: st.accounts.OWN.password,
      hardeningChecklistConfirmed: true,
    },
  });
  must(tr, 201, 'cấp thiết bị quầy tin cậy');
  st.deviceToken = cookieOf(tr.setCookies, 'ottimo_did');
  if (!st.deviceToken) throw new Error('cấp thiết bị: không có cookie thiết bị');
  writeState(st);

  const c = await loadContext(S.FD);
  log('tạo hồ sơ khách (dữ liệu giả)');
  const guests = [];
  for (let i = 0; i < GUESTS.length - 1; i++)
    guests.push(await createGuest(i < 20 ? S.FD : S.SAL, i));
  st.guests = guests;
  writeState(st);

  log('đơn bắt đầu trước hôm nay (đặt từ 5 tuần trước)');
  await jump(at(addDays(D, -35), '10:00'));
  const plan = [
    {
      key: 'longStay',
      label: 'thuê dài hạn nhập tay (HĐ ngoài)',
      room: '301',
      arrival: addDays(D, -30),
      nights: 182,
      channel: 'collaborator',
      closer: st.accounts.CTV.id,
      guest: guests[5],
      adults: 2,
      payFull: false,
      time: '15:00',
      extra: {
        manualLongStay: {
          monthlyRentVnd: 14500000,
          externalContractRef: `HĐ-${D.slice(2, 4)}-031`,
          depositHeldVnd: 14500000,
        },
      },
    },
    {
      key: 'departingToday',
      label: 'đang ở – trả phòng hôm nay, còn nợ',
      room: '103',
      arrival: addDays(D, -2),
      nights: 2,
      channel: 'direct',
      guest: guests[1],
      time: '14:30',
    },
    // D4: 2 adults in a Studio (standard 2, max 3) → one more adult = extra-person surcharge; free nights after (202 next arrival D+5)
    {
      key: 'midStay',
      label: 'đang ở – giữa kỳ (gia hạn / thêm người)',
      room: '202',
      arrival: addDays(D, -2),
      nights: 5,
      channel: 'direct',
      source: 'walk_in',
      guest: guests[2],
      adults: 2,
      time: '16:10',
    },
    {
      key: 'otaInHouse',
      label: 'đang ở – Booking.com trả trước',
      room: '401',
      arrival: addDays(D, -1),
      nights: 3,
      channel: 'booking',
      guest: guests[18],
      adults: 3,
      rate: 1650000,
      payFull: false,
      time: '15:20',
    },
    {
      key: 'ctvInHouse',
      label: 'đang ở – khách CTV',
      room: '101',
      arrival: addDays(D, -1),
      nights: 3,
      channel: 'collaborator',
      closer: st.accounts.CTV.id,
      guest: guests[3],
      time: '18:45',
    },
  ];
  const made = [];
  for (const b of plan) made.push({ b, res: await book(S.FD, c, b) });
  for (const m of made) st.ids[m.b.key] = m.res.id;
  writeState(st);

  for (const m of made) {
    await jump(at(m.b.arrival, m.b.time));
    const res = await getRes(S.FD, m.res.id);
    if (m.b.payFull !== false) await payBalance(S.FD, res.folioId);
    const regId = await registrationOf(S.FD, res);
    await addDoc(
      S.FD,
      st.deviceToken,
      regId,
      fakeDoc(m.b.guest, m.b.arrival, addDays(m.b.arrival, m.b.nights)),
    );
    const done = await checkIn(S.FD, st.deviceToken, res.id, m.b.time, S.FDL);
    log(`  nhận phòng ${done.code} căn ${m.b.room} lúc ${m.b.arrival} ${m.b.time}`);
  }

  // D3 extras during the stay (laundry, minibar consumption) → an open balance to settle with VietQR at check-out
  await jump(at(addDays(D, -1), '20:30'));
  const cat = listOf(
    must(await http('GET', P(S.FD, '/charge-catalog'), { s: S.FD }), 200, 'charge catalog'),
  );
  const code = (x) => x.code ?? x.chargeCode;
  const outRes = await getRes(S.FD, st.ids.departingToday);
  for (const [re, qty] of [
    [/laundry|giat|giặt/i, 2],
    [/minibar|coca|snack|bia|beer/i, 1],
  ]) {
    const item = cat.find((x) => re.test(`${code(x)} ${x.name ?? ''}`));
    if (!item) continue;
    const r = await http('POST', P(S.FD, `/folios/${outRes.folioId}/lines`), {
      s: S.FD,
      idem: true,
      body: {
        chargeCode: code(item),
        quantity: qty,
        serviceDate: addDays(D, -1),
        note: 'Dịch vụ trong kỳ ở (demo)',
      },
    });
    log(
      r.status === 201
        ? `  thêm ${code(item)} vào bill ${outRes.code}`
        : `  (bỏ qua ${code(item)}: HTTP ${r.status})`,
    );
  }

  // D5 – a hold that still has ~5 hours left when the demo starts: hold_hours_options are 12/24/48, so the 12-hour
  // hold is taken 7 hours before now (never earlier than the last step above – the fake clock only moves forward).
  const sevenHoursAgo = new Date(Date.now() - 7 * 3600e3);
  const holdAt = new Date(
    Math.max(sevenHoursAgo.getTime(), new Date(lastVirtual).getTime() + 60e3),
  );
  const hhmm = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(holdAt);
  const holdDay = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(holdAt);
  await jump(at(holdDay, hhmm), ['SAL']);
  const qh = await http('POST', P(S.SAL, '/quotes'), {
    s: S.SAL,
    idem: true,
    body: {
      type: 'short',
      roomId: c.room('201').id,
      arrivalDate: addDays(D, 3),
      nights: 2,
      adults: 2,
      channelId: c.channel('direct').id,
      guestId: guests[24].id,
    },
  });
  const quoteForHold = must(qh, 201, 'báo giá cho giữ chỗ');
  const h = await http('POST', P(S.SAL, `/quotes/${quoteForHold.id}/actions/create-hold`), {
    s: S.SAL,
    idem: true,
    body: { holdHours: 12, depositMethod: 'vietqr' },
  });
  const hold = must(h, 201, 'giữ chỗ 12 giờ');
  st.ids.hold = hold.id;
  st.holdExpiresAt = hold.hold?.expiresAt ?? hold.holdExpiresAt ?? null;
  log(`  giữ chỗ ${hold.code} căn 201, hết hạn ${st.holdExpiresAt ?? '(12 giờ sau)'}`);
  writeState(st);
  log('pha 1 xong');
}

// ───────────────────────── phase 2: today and the next weeks (real clock) ─────────────────────────
function receivingAccountFromEnv() {
  const file = process.env.DEMO_ENV_FILE;
  if (!file || !existsSync(file)) return null;
  const text = readFileSync(file, 'utf8');
  const val = (k) => {
    const m = new RegExp(`^\\s*#?.*PAYMENT_VIETQR_${k}=(.*)$`, 'm').exec(text);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
  };
  const acc = {
    bankBin: val('BANK_BIN'),
    accountNo: val('ACCOUNT_NO'),
    accountName: val('ACCOUNT_NAME'),
  };
  return acc.bankBin && acc.accountNo && acc.accountName ? acc : null;
}

async function phaseNow() {
  const st = readState();
  if (!st.accounts) throw new Error('thiếu state pha 1');
  const D = businessToday();
  if (D !== st.today) log(`chú ý: ngày nghiệp vụ đã sang ${D} (pha 1 dựng cho ${st.today})`);
  const S = {};
  for (const a of STAFF_ACCOUNTS) S[a.key] = await login(a.username, st.accounts[a.key].password);
  const c = await loadContext(S.FD);
  const g = st.guests;
  const device = st.deviceToken;

  // VietQR receiving account (BR-521): the investor's own account from product/.env – via the API as OWN (re-auth)
  const acc = receivingAccountFromEnv();
  st.receivingAccount = 'missing';
  if (acc) {
    const r = await http('PUT', P(S.OWN, '/parameters/payment_receiving_account'), {
      s: S.OWN,
      idem: true,
      body: {
        value: acc,
        effectiveFrom: D,
        reason: 'Tài khoản nhận VietQR cho buổi demo',
        reauth: { authMethod: 'password', secret: st.accounts.OWN.password },
      },
    });
    if (r.status === 200) {
      st.receivingAccount = 'set';
      log('đã cấu hình tài khoản nhận VietQR (giá trị không in ra)');
    } else {
      st.receivingAccount = `failed ${r.status}`;
      log(`không cấu hình được tài khoản nhận VietQR (HTTP ${r.status}) – OWN nhập ở Tham số`);
    }
  } else {
    log(
      'không thấy 3 dòng PAYMENT_VIETQR_* trong product/.env – OWN nhập tài khoản nhận ở Tham số',
    );
  }

  log('đơn hôm nay và 2 tuần tới');
  const fd = S.FD;
  const plan = [
    // arrivals today
    {
      key: 'arrivalToday',
      label: 'đến hôm nay – đã cọc 30 %, còn nợ',
      room: '102',
      arrival: D,
      nights: 2,
      channel: 'direct',
      source: 'zalo_phone',
      guest: g[0],
    },
    {
      key: 'otaArrivalToday',
      label: 'đến hôm nay – Agoda trả trước',
      room: '302',
      arrival: D,
      nights: 3,
      channel: 'agoda',
      guest: g[16],
      adults: 3,
      rate: 1480000,
    },
    {
      key: 'arrivalToday3',
      label: 'đến hôm nay – Booking.com trả trước',
      room: '203',
      arrival: D,
      nights: 2,
      channel: 'booking',
      guest: g[17],
      rate: 980000,
    },
    {
      key: 'arrivalToday4',
      label: 'đến hôm nay – khách quen',
      room: '201',
      arrival: D,
      nights: 2,
      channel: 'direct',
      source: 'returning',
      guest: g[6],
      depositMethod: 'bank_transfer',
    },
    // tomorrow (guest link)
    {
      key: 'arrivalTomorrow',
      label: 'đến ngày mai – link check-in online',
      room: '402',
      arrival: addDays(D, 1),
      nights: 2,
      channel: 'direct',
      source: 'website',
      guest: g[4],
      adults: 2,
    },
    // the next two weeks
    {
      label: 'sale chốt',
      room: '103',
      arrival: addDays(D, 1),
      nights: 3,
      channel: 'direct',
      source: 'sales_staff',
      closer: st.accounts.SAL.id,
      guest: g[7],
    },
    {
      label: 'Airbnb',
      room: '102',
      arrival: addDays(D, 3),
      nights: 3,
      channel: 'airbnb',
      guest: g[19],
      rate: 1020000,
    },
    {
      label: 'Booking.com',
      room: '101',
      arrival: addDays(D, 4),
      nights: 3,
      channel: 'booking',
      guest: g[8],
      rate: 1050000,
    },
    {
      label: 'trực tiếp',
      room: '402',
      arrival: addDays(D, 4),
      nights: 2,
      channel: 'direct',
      guest: g[9],
      depositMethod: 'bank_transfer',
    },
    {
      label: 'trực tiếp – gia đình',
      room: '401',
      arrival: addDays(D, 5),
      nights: 3,
      channel: 'direct',
      guest: g[10],
      adults: 4,
      key: 'n401',
    },
    {
      label: 'Booking.com',
      room: '202',
      arrival: addDays(D, 5),
      nights: 2,
      channel: 'booking',
      guest: g[20],
      rate: 990000,
    },
    {
      label: 'trực tiếp',
      room: '302',
      arrival: addDays(D, 5),
      nights: 3,
      channel: 'direct',
      guest: g[11],
      adults: 3,
    },
    {
      label: 'trực tiếp',
      room: '203',
      arrival: addDays(D, 5),
      nights: 4,
      channel: 'direct',
      guest: g[12],
    },
    {
      label: 'Agoda',
      room: '103',
      arrival: addDays(D, 6),
      nights: 3,
      channel: 'agoda',
      guest: g[13],
      rate: 1010000,
    },
    {
      label: 'trực tiếp',
      room: '201',
      arrival: addDays(D, 7),
      nights: 3,
      channel: 'direct',
      guest: g[14],
    },
    {
      label: 'trực tiếp',
      room: '102',
      arrival: addDays(D, 8),
      nights: 2,
      channel: 'direct',
      guest: g[15],
    },
    {
      label: 'trực tiếp',
      room: '101',
      arrival: addDays(D, 9),
      nights: 3,
      channel: 'direct',
      guest: g[21],
    },
    {
      label: 'Booking.com',
      room: '302',
      arrival: addDays(D, 10),
      nights: 3,
      channel: 'booking',
      guest: g[22],
      adults: 3,
      rate: 1520000,
    },
    {
      label: 'Airbnb',
      room: '401',
      arrival: addDays(D, 10),
      nights: 2,
      channel: 'airbnb',
      guest: g[23],
      adults: 4,
      rate: 1850000,
    },
    {
      label: 'trực tiếp',
      room: '402',
      arrival: addDays(D, 11),
      nights: 3,
      channel: 'direct',
      guest: g[5],
      adults: 3,
    },
  ];
  for (const b of plan) {
    const res = await book(fd, c, b);
    if (b.key) st.ids[b.key] = res.id;
    if (b.doc) {
      const regId = await registrationOf(fd, res);
      await addDoc(fd, device, regId, fakeDoc(b.guest, b.arrival, addDays(b.arrival, b.nights)));
      log(`  đã nhập sẵn giấy tờ người đứng tên cho ${res.code}`);
    }
  }

  // unassigned OTA booking: 2-bedroom group full (301 long stay, 401 booked) → Expedia booking without a room
  log('đơn OTA chưa xếp phòng (nhóm căn 2 phòng ngủ đã kín)');
  const unassigned = await book(fd, c, {
    label: 'Expedia – chưa xếp phòng',
    room: '401',
    arrival: addDays(D, 6),
    nights: 2,
    channel: 'expedia',
    guest: g[28],
    adults: 4,
    rate: 1790000,
    allowUnassigned: true,
  });
  st.ids.unassignedOta = unassigned.id;

  // OOO (maintenance) – room 203 from D+2 for 2 nights
  log('khóa phòng sửa chữa (OOO)');
  const blk = await http('POST', P(S.MT, '/room-blocks'), {
    s: S.MT,
    idem: true,
    body: {
      roomId: c.room('203').id,
      startDate: addDays(D, 2),
      endDatePlanned: addDays(D, 4),
      reason: 'Thay bình nóng lạnh, sơn lại tường phòng tắm',
    },
  });
  st.ids.ooo = must(blk, 201, 'tạo khối OOO').id;

  // CTV quote (no booking yet)
  log('báo giá của CTV');
  const ctvGuest = await createGuest(S.CTV, GUESTS.length - 1);
  const q = await http('POST', P(S.CTV, '/quotes'), {
    s: S.CTV,
    idem: true,
    body: {
      type: 'short',
      roomId: c.room('402').id,
      arrivalDate: addDays(D, 8),
      nights: 3,
      adults: 3,
      channelId: c.channel('collaborator').id,
      closerUserId: st.accounts.CTV.id,
      guestId: ctvGuest.id,
    },
  });
  st.ids.ctvQuote = must(q, 201, 'báo giá CTV').id;

  // guest-web link for tomorrow's arrival
  const link = await http('POST', P(fd, `/reservations/${st.ids.arrivalTomorrow}/guest-link`), {
    s: fd,
    idem: true,
  });
  const lk = must(link, 201, 'cấp link khách');
  st.guestLink = { url: lk.url, expiresAt: lk.expiresAt, reservationId: st.ids.arrivalTomorrow };

  // test accounts of the QA seed (qa.*) are switched off – the demo shows only the demo staff
  const users = listOf(
    must(await http('GET', '/v1/users', { s: S.OWN, query: { limit: 100 } }), 200, 'listUsers'),
  );
  let off = 0;
  for (const u of users.filter(
    (x) => String(x.username).startsWith('qa.') && x.status !== 'disabled',
  )) {
    const r = await http('PATCH', `/v1/users/${u.id}`, {
      s: S.OWN,
      idem: true,
      ifMatch: u.version,
      body: { status: 'disabled' },
    });
    if (r.status === 200) off++;
  }
  log(`đã tắt ${off} tài khoản kiểm thử qa.*`);

  // occupancy of the next 14 nights (rack)
  const rack = await http('GET', P(fd, '/rack'), { s: fd, query: { from: D, days: 14 } });
  st.rackStatus = rack.status;
  writeState(st);
  writeAccounts(st, D);
  log('pha 2 xong');
}

function writeAccounts(st, D) {
  mkdirSync(OUT, { recursive: true, mode: 0o700 });
  const file = join(OUT, 'demo-accounts.md');
  const rows = STAFF_ACCOUNTS.map(
    (a) =>
      `| ${a.key} | ${a.displayName} | \`${a.username}\` | \`${st.accounts[a.key].password}\` | ${a.app === 'staff' ? STAFF : a.app === 'desk' ? DESK : `${DESK} · ${STAFF}`} |`,
  );
  const text = `# Demo OTTIMO – tài khoản (BÍ MẬT – không gửi qua chat, không commit)

Tạo lúc: ${new Date().toLocaleString('vi-VN', { timeZone: TZ })} · ngày nghiệp vụ: ${D} · dữ liệu GIẢ (trừ tài khoản nhận VietQR).
Giữ chỗ D5 (201) hết hạn lúc: ${st.holdExpiresAt ?? '-'}. Ảnh mẫu giả: anh-giay-to-mau.png, anh-bien-nhan-mau.png (cùng thư mục).
Mỗi lần chạy demo-up.sh / demo-reset.sh mật khẩu đổi mới.

| Vai | Tên hiển thị | Đăng nhập | Mật khẩu | Mở ở |
|---|---|---|---|---|
${rows.join('\n')}

## Máy quầy tin cậy (để Lễ tân xem/nhập giấy tờ, mã cửa)
Cách 1 (khuyên dùng – "Bước 0" của hướng dẫn): trên trình duyệt dùng cho demo, đăng nhập **${st.accounts.OWN.username}** → Quản trị › Thiết bị được cấp → "Cấp quyền thiết bị này" (tick các mục kiểm máy, đặt tên "Mac demo", nhập lại mật khẩu). Sau đó Lễ tân đăng nhập trên cùng trình duyệt.
Cách 2 (dự phòng, kỹ thuật): mở ${DESK}, bấm F12 → Console, dán đúng một dòng rồi Enter, tải lại trang:
\`document.cookie = "ottimo_did=${st.deviceToken}; path=/; SameSite=Strict"\`

## Link check-in online cho khách đến ngày mai
${st.guestLink?.url ?? '(chưa có)'}
Hết hạn: ${st.guestLink?.expiresAt ?? '-'}. Mở trên điện thoại cùng mạng không được (chỉ localhost) – mở trên máy này, hoặc cửa sổ ẩn danh.

## Tài khoản nhận VietQR
${st.receivingAccount === 'set' ? 'Đã cấu hình từ product/.env (Tham số → payment_receiving_account).' : 'CHƯA cấu hình – đăng nhập chủ nhà → Tham số → "Tài khoản nhận tiền" → nhập số tài khoản (hỏi lại mật khẩu).'}
`;
  writeFileSync(file, text, { mode: 0o600 });
  chmodSync(file, 0o600);
  log(`đã ghi tài khoản vào ${file} (0600, không in ra màn hình)`);
}

try {
  if (phase === 'past') await phasePast();
  else if (phase === 'now') await phaseNow();
  else throw new Error('dùng: node seed-demo.mjs past|now');
} catch (e) {
  console.error(`[demo-seed] LỖI: ${e.message}`);
  process.exit(1);
}
