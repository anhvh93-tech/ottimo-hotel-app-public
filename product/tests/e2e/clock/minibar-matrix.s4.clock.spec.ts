// Sprint 4 tuần Ổn định – bảng ca tổ hợp minibar theo mô hình M-1 (ARC `rounds/round-02/outputs/ARC/openapi-0.3.7.md`
// mục 16; bảng QA `product/tests/test-cases/s4-minibar-matrix.md` đã sửa theo 16.5). Kiểm lại BUG-R2-135…138, 140.
//
// Project "clock" (tuần tự, 1 worker, sau mọi project dùng API): ca cần đơn đang ở (nhận phòng trên đồng hồ ảo) và
// SỬA DANH MỤC MINIBAR của cơ sở – trạng thái dùng chung. Mỗi ca trả danh mục về như cũ trong `finally`; afterAll trả
// lần nữa theo ảnh chụp đầu file (lưới an toàn).
//
// Quy tắc kỳ vọng (M-1): tủ = (lượt, căn) R1; mốc = mức lúc nhận phòng R2; món của tủ theo lần nạp R3; một đơn giá mỗi
// kỳ nạp = giá lúc nạp R5; giữ dòng khi đếm lại cùng số lần trước hoặc cùng số trên folio R6; lần đếm thật mới = một dòng
// R7; FOC minibar khóa theo món, Σ FOC ≤ giá trị món R8; B14 hai tủ R9; latestCheck = folio = B18 R10.
// Lỗi đã biết: knownBug() ở DÒNG ĐẦU ca, dựng dữ liệu trong precondition() (support/known-bugs.ts – BUG-R2-064).
// TC (r1-main-flows.md): TC-L4-101…TC-L4-118.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  needSeedPassword,
  propertyIdOf,
  sessionOrSkip,
  stackToday,
  versionTag,
  type ApiResult,
  type StaffSession,
} from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { knownBug, precondition } from '../support/known-bugs.js';
import {
  addDays,
  cleanupTracked,
  getReservation,
  room,
  s2Context,
  vnTime,
  type ProblemFields,
  type Room,
  type S2Context,
} from '../support/s2.js';
import {
  EP3,
  cleanRooms,
  getFolio,
  inHouse,
  liveLines,
  p3,
  stayAction,
  useVirtualDevice,
  virtualDay,
  type Folio,
  type Stay,
} from '../support/s3.js';
import { checkOut, checkoutSummary, minibarItem, adjustLine } from '../support/s3-stay.js';
import { approvalById, approvedReduction, requestReduction, sum } from '../support/s4-money.js';

type Json = Record<string, unknown>;

// ───────────────────────── người, đồng hồ ─────────────────────────

interface People {
  c: S2Context;
  fd: StaffSession;
  owner: StaffSession;
}
async function people(request: APIRequestContext): Promise<People> {
  return {
    c: await s2Context(request),
    fd: await sessionOrSkip(request, 'qa.fd'),
    owner: await sessionOrSkip(request, 'qa.owner'),
  };
}
async function startDay(request: APIRequestContext, D: string, hhmm: string): Promise<void> {
  await useVirtualDevice(request, await setClock(request, vnTime(D, hhmm)));
  cleanRooms();
}
async function moveTo(request: APIRequestContext, date: string, hhmm: string): Promise<People> {
  await useVirtualDevice(request, await setClock(request, vnTime(date, hhmm)));
  return people(request);
}

// ───────────────────────── danh mục (updateItem / createItem) ─────────────────────────

interface CatalogItem {
  id: string;
  code: string;
  name: string;
  nameI18n?: Record<string, string>;
  unit: string;
  costPriceVnd?: number;
  salePriceVnd: number | null;
  minibarStandardQty: number;
  minStockQty?: number;
  isActive?: boolean;
  version: number;
}
type ItemChange = Partial<Pick<CatalogItem, 'salePriceVnd' | 'minibarStandardQty' | 'isActive'>>;

async function catalog(request: APIRequestContext, owner: StaffSession): Promise<CatalogItem[]> {
  const r = await call<{ data: CatalogItem[] }>(request, 'GET', p3(EP3.listItems, owner), {
    session: owner,
  });
  expect(r.status, `listItems: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
  return r.body.data;
}
function itemBody(it: CatalogItem, change: ItemChange): Json {
  return {
    code: it.code,
    name: it.nameI18n && Object.keys(it.nameI18n).length ? it.nameI18n : { vi: it.name },
    unit: it.unit,
    ...(it.costPriceVnd !== undefined ? { costPriceVnd: it.costPriceVnd } : {}),
    salePriceVnd: it.salePriceVnd ?? null,
    minibarStandardQty: it.minibarStandardQty,
    ...(it.minStockQty !== undefined ? { minStockQty: it.minStockQty } : {}),
    isActive: it.isActive ?? true,
    ...change,
  };
}
async function setItem(
  request: APIRequestContext,
  owner: StaffSession,
  code: string,
  change: ItemChange,
): Promise<void> {
  const it = (await catalog(request, owner)).find((x) => x.code === code);
  expect(it, `danh mục không có ${code}`).toBeTruthy();
  const r = await call(request, 'PATCH', p3(EP3.updateItem, owner, { itemId: it!.id }), {
    session: owner,
    idempotencyKey: true,
    ifMatch: versionTag(it!.version),
    body: itemBody(it!, change),
  });
  expect(r.status, `updateItem ${code} ${JSON.stringify(change)}: ${JSON.stringify(r.body)}`).toBe(
    200,
  );
}

/** Ảnh chụp danh mục đầu file – trả về sau mỗi ca (chỉ các trường ca được phép đổi). */
let baseline: CatalogItem[] = [];
async function restoreCatalog(request: APIRequestContext): Promise<void> {
  if (!baseline.length) return;
  const owner = await sessionOrSkip(request, 'qa.owner');
  for (const cur of await catalog(request, owner)) {
    const b = baseline.find((x) => x.code === cur.code);
    const want: ItemChange = b
      ? {
          salePriceVnd: b.salePriceVnd ?? null,
          minibarStandardQty: b.minibarStandardQty,
          isActive: b.isActive ?? true,
        }
      : { isActive: false }; // món ca tạo thêm (MX_NEW) – tắt lại
    const same =
      (cur.salePriceVnd ?? null) === want.salePriceVnd &&
      cur.minibarStandardQty === (want.minibarStandardQty ?? cur.minibarStandardQty) &&
      (cur.isActive ?? true) === want.isActive;
    if (same) continue;
    const r = await call(request, 'PATCH', p3(EP3.updateItem, owner, { itemId: cur.id }), {
      session: owner,
      idempotencyKey: true,
      ifMatch: versionTag(cur.version),
      body: itemBody(cur, want),
    });
    expect(r.status, `trả danh mục ${cur.code}: ${JSON.stringify(r.body)}`).toBe(200);
  }
}

// ───────────────────────── tủ, lần đếm, folio ─────────────────────────

interface StdItem {
  itemId: string;
  itemName: string;
  standardQty: number;
  isFree: boolean;
  unitPriceVnd?: number;
  lastCheckUsedQty?: number;
  folioLineId?: string;
  folioUsedQty?: number;
  folioAmountVnd?: number;
  adjustedAfterLastCheck?: boolean;
}
interface Std {
  items: StdItem[];
  latestCheck?: { totalVnd?: number } | null;
}

/** Bốn món tính tiền định mức 2 dùng cho trục B (BR-702, giá DS-E). */
const PAID = ['bia', 'coca', 'sua', 'mi'] as const;
const price = (code: string): number => minibarItem(code).salePriceVnd;
const SEED_ITEMS = (['nuoc', 'coca', 'bia', 'sua', 'caphe', 'atiso', 'snack', 'mi'] as const).map(
  (code) => minibarItem(code),
);
const nameOf = (code: string): string => minibarItem(code).name;

async function std(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  roomId?: string,
): Promise<ApiResult<Std & ProblemFields>> {
  return call(request, 'GET', p3(EP3.getMinibarStandard, s, { reservationId }), {
    session: s,
    ...(roomId ? { query: { roomId } } : {}),
  });
}

/** id món theo mã DS-E (danh mục – kể cả món đã tắt, không còn trong `items` của bản cũ). */
let idByCode = new Map<string, string>();

/**
 * Lần đếm `checkout` đủ mọi món của tủ: còn lại = mốc − đã dùng. Mốc lấy theo KỲ VỌNG M-1 (`mocs`, mặc định = số tủ
 * trả về), để bản chưa sửa (mốc theo danh mục hiện hành) lộ lỗi ở số tiền chứ không ở cách dựng lệnh.
 */
async function count(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  used: Record<string, number>,
  o: { mocs?: Record<string, number>; roomId?: string; remaining?: Record<string, number> } = {},
): Promise<ApiResult<Json & ProblemFields>> {
  const t = await std(request, s, reservationId, o.roomId);
  expect(t.status, `getMinibarStandard: ${JSON.stringify(t.body).slice(0, 300)}`).toBe(200);
  const lines = new Map<string, number>();
  for (const i of t.body.items) lines.set(i.itemId, i.standardQty);
  const codes = new Set([...Object.keys(used), ...Object.keys(o.mocs ?? {})]);
  for (const code of codes) {
    const id = idByCode.get(code)!;
    const moc = o.mocs?.[code] ?? lines.get(id) ?? minibarItem(code).standardQtyPerRoom;
    lines.set(id, moc - (used[code] ?? 0));
  }
  for (const [code, rem] of Object.entries(o.remaining ?? {})) lines.set(idByCode.get(code)!, rem);
  return call(request, 'POST', p3(EP3.recordMinibarCheck, s, { reservationId }), {
    session: s,
    idempotencyKey: true,
    body: {
      mode: 'checkout',
      ...(o.roomId ? { roomId: o.roomId } : {}),
      lines: [...lines].map(([itemId, remainingQty]) => ({ itemId, remainingQty })),
    },
  });
}
async function counted(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  used: Record<string, number>,
  o: Parameters<typeof count>[4] = {},
  what = 'recordMinibarCheck',
): Promise<void> {
  const r = await count(request, s, reservationId, used, o);
  expect(r.status, `${what} ${JSON.stringify(used)}: ${JSON.stringify(r.body).slice(0, 400)}`).toBe(
    201,
  );
}

/** Dòng minibar sống của một món (mô tả = tên món). */
function itemLines(f: Folio, code: string) {
  return liveLines(f, 'minibar').filter((l) => l.description === nameOf(code));
}
const itemVnd = (f: Folio, code: string): number => sum(itemLines(f, code).map((l) => l.amountVnd));
const minibarGross = (f: Folio): number => sum(liveLines(f, 'minibar').map((l) => l.amountVnd));
const reductions = (f: Folio): number =>
  -sum([...liveLines(f, 'foc'), ...liveLines(f, 'discount')].map((l) => l.amountVnd));

/** M7/R10: latestCheck.totalVnd của tủ = Σ dòng minibar sống của tủ trên folio. */
async function latestTotal(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  roomId?: string,
): Promise<number | undefined> {
  const t = await std(request, s, reservationId, roomId);
  return t.body.latestCheck?.totalVnd;
}

/** FOC đã duyệt trên dòng minibar sống của món (FD xin, OWN duyệt – không chạm hạn mức tháng của FDL). */
async function foc(
  request: APIRequestContext,
  k: People,
  st: Stay,
  code: string,
  amountVnd: number,
): Promise<string> {
  const line = itemLines(await getFolio(request, k.fd, st.res.folioId!), code).at(-1);
  expect(line, `không có dòng minibar ${code} để xin FOC`).toBeTruthy();
  const a = await approvedReduction(request, k.fd, k.owner, st.res.folioId!, line!.id, {
    amountVnd,
    reasonCode: 'service_recovery',
  });
  return a.id;
}

/** B18 lúc `hhmm` (trước giờ trả chuẩn): xem trước = lệnh ghi (R10), thu đúng số còn lại, folio chốt. */
async function settle(
  request: APIRequestContext,
  k: People,
  st: Stay,
  hhmm: string,
  expectDue: number,
): Promise<Folio> {
  const s = await checkoutSummary(request, k.fd, st.res.id, { checkoutTime: hhmm });
  expect(s.status, `checkout-summary: ${JSON.stringify(s.body).slice(0, 300)}`).toBe(200);
  const due = (s.body as unknown as Json).amountDueAtCheckoutVnd as number | undefined;
  expect
    .soft(due ?? s.body.balanceDueVnd, 'xem trước B18 = số minibar ròng còn thu')
    .toBe(expectDue);
  const out = await checkOut(request, k.fd, st.res.id, {
    checkoutTime: hhmm,
    ...(expectDue > 0
      ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: expectDue } }
      : {}),
  });
  expect(out.status, `checkOut: ${JSON.stringify(out.body).slice(0, 400)}`).toBe(200);
  const f = await getFolio(request, k.fd, st.res.folioId!);
  expect(f.status).toBe('settled');
  expect(f.totals.balanceDueVnd).toBe(0);
  return f;
}

/** Đơn 1 đêm (hoặc `nights`) ngày ảo riêng, nhận phòng D 14:00, tiền phòng đã thu; đồng hồ sang ngày đi 09:00. */
async function stayFor(
  request: APIRequestContext,
  roomNos: string[],
  nights = 1,
): Promise<{ D: string; k: People; stays: Stay[] }> {
  const D = virtualDay(realToday, nights + 1);
  await startDay(request, D, '14:00');
  let k = await people(request);
  const stays: Stay[] = [];
  for (const no of roomNos) {
    stays.push(
      await inHouse(request, k.c, k.fd, {
        room: room(k.c, no),
        alternatives: k.c.rooms.filter((r) => !roomNos.includes(r.roomNo)),
        arrival: D,
        nights,
      }),
    );
  }
  k = await moveTo(request, addDays(D, nights), '09:00');
  return { D, k, stays };
}

let realToday = '';
test.beforeAll(async ({ request }) => {
  needSeedPassword();
  await resetClock(request);
  realToday = await stackToday(request);
  const owner = await sessionOrSkip(request, 'qa.owner');
  // lượt chạy trước dừng giữa ca (không kịp `finally`) → món DS-E về đúng seed, không lấy số đã lệch làm mốc
  baseline = (await catalog(request, owner)).map((it) => {
    const seed = SEED_ITEMS.find((x) => x.code === it.code);
    return seed
      ? {
          ...it,
          salePriceVnd: seed.complimentary ? null : seed.salePriceVnd,
          minibarStandardQty: seed.standardQtyPerRoom,
          isActive: true,
        }
      : it;
  });
  idByCode = new Map(baseline.map((i) => [i.code, i.id]));
  await restoreCatalog(request);
});
test.afterEach(async ({ request }) => {
  await restoreCatalog(request);
  await cleanupTracked(request);
});
test.afterAll(async ({ request }) => {
  await restoreCatalog(request);
  await resetClock(request);
});

// Trục B trên bốn món định mức 2 của một tủ: lần đầu / đếm lại (số đã dùng) – B1 cùng số, B2 tăng, B3 giảm, B4 về 0.
const FIRST: Record<string, number> = { bia: 2, coca: 1, sua: 2, mi: 2 };
const AGAIN: Record<string, number> = { bia: 2, coca: 2, sua: 1, mi: 0 };
/** M-1: mọi thay đổi danh mục áp từ lần nạp sau → tiền mỗi món = đếm lại × giá lúc nạp, như khi không đổi gì. */
const EXPECT_AFTER = (code: string) => AGAIN[code]! * price(code);
const MOC2 = Object.fromEntries(PAID.map((c) => [c, 2]));

interface ACase {
  tc: string;
  title: string;
  bugs: string[];
  change: (code: string) => ItemChange | null;
  extra?: 'snack';
}
const A_CASES: ACase[] = [
  {
    tc: 'TC-L4-101',
    title: 'MX-A0 không đổi danh mục (đối chứng)',
    bugs: [],
    change: () => null,
  },
  {
    tc: 'TC-L4-102',
    title: 'MX-A1 tăng giá bán +5.000 giữa hai lần đếm – một đơn giá mỗi kỳ nạp (R5)',
    bugs: ['BUG-R2-140'],
    change: (c) => ({ salePriceVnd: price(c) + 5000 }),
  },
  {
    tc: 'TC-L4-103',
    title: 'MX-A2 giảm giá bán −5.000 giữa hai lần đếm (R5)',
    bugs: ['BUG-R2-140'],
    change: (c) => ({ salePriceVnd: price(c) - 5000 }),
  },
  {
    tc: 'TC-L4-104',
    title:
      'MX-A3 món sang miễn phí (giá null) giữa hai lần đếm – giữ dòng, phần thêm theo giá lúc nạp (R5, R6)',
    bugs: ['BUG-R2-137'],
    change: () => ({ salePriceVnd: null }),
  },
  {
    tc: 'TC-L4-105',
    title: 'MX-A4 món giá 0 giữa hai lần đếm (R5, R6)',
    bugs: ['BUG-R2-137'],
    change: () => ({ salePriceVnd: 0 }),
  },
  {
    tc: 'TC-L4-106',
    title: 'MX-A5 tắt món giữa hai lần đếm – món vẫn trong tủ và đếm được tới lần nạp sau (R3)',
    bugs: ['BUG-R2-137'],
    change: () => ({ isActive: false }),
  },
  {
    tc: 'TC-L4-107',
    title: 'MX-A6 hạ định mức 2 → 1 giữa hai lần đếm – mốc vẫn 2 (R2)',
    bugs: ['BUG-R2-138'],
    change: () => ({ minibarStandardQty: 1 }),
  },
  {
    tc: 'TC-L4-108',
    title: 'MX-A7 hạ định mức 2 → 0 giữa hai lần đếm – mốc vẫn 2, món vẫn đếm (R2, R3)',
    bugs: ['BUG-R2-138'],
    change: () => ({ minibarStandardQty: 0 }),
  },
  {
    tc: 'TC-L4-109',
    title:
      'MX-A8 nâng định mức (2 → 3; snack 1 → 2) giữa hai lần đếm – mốc theo lần nạp, còn > mốc → 422 (R2, R4)',
    bugs: ['BUG-R2-138'],
    change: () => ({ minibarStandardQty: 3 }),
    extra: 'snack',
  },
];

test.describe(
  'Minibar M-1 – bảng ca tổ hợp (BUG-R2-135…138, 140)',
  { tag: ['@clock', '@sprint4', '@money'] },
  () => {
    test.describe.configure({ mode: 'default' });

    for (const a of A_CASES) {
      test(`${a.tc} (A) ${a.title}: B1 cùng số / B2 tăng / B3 giảm / B4 về 0 trên bia, coca, sữa, mì`, async ({
        request,
      }) => {
        if (a.bugs.length) knownBug(...a.bugs);
        needClock(a.tc);
        const { k, st } = await precondition(
          'khách ở 1 đêm, ngày đi 09:00, lần đếm đầu',
          async () => {
            const { k, stays } = await stayFor(request, ['202']);
            const st = stays[0]!;
            await counted(request, k.fd, st.res.id, {
              ...FIRST,
              ...(a.extra ? { snack: 1 } : {}),
            });
            return { k, st };
          },
        );
        const f0 = await getFolio(request, k.fd, st.res.folioId!);
        for (const c of PAID)
          expect.soft(itemVnd(f0, c), `lần đầu ${c}`).toBe(FIRST[c]! * price(c));
        for (const c of PAID) {
          const ch = a.change(c);
          if (ch) await setItem(request, k.owner, c, ch);
        }
        if (a.extra === 'snack')
          await setItem(request, k.owner, 'snack', { minibarStandardQty: 2 });
        // tủ vẫn liệt kê mọi món của lần nạp, mốc 2, giá lúc nạp (R2, R3, R5)
        const t = await std(request, k.fd, st.res.id);
        expect(t.status).toBe(200);
        for (const c of PAID) {
          const it = t.body.items.find((i) => i.itemId === idByCode.get(c));
          expect.soft(it, `tủ còn món ${c} (R3)`).toBeTruthy();
          expect.soft(it?.standardQty, `mốc ${c} (R2)`).toBe(2);
          expect.soft(it?.unitPriceVnd, `giá ${c} (R5)`).toBe(price(c));
        }
        if (a.extra === 'snack') {
          const over = await count(request, k.fd, st.res.id, AGAIN, {
            mocs: MOC2,
            remaining: { snack: 2 },
          });
          expect.soft(over.status, 'snack còn 2 > mốc 1 → 422').toBe(422);
          expect.soft(JSON.stringify(over.body)).toContain('MINIBAR_QTY_OVER_STANDARD');
        }
        await counted(
          request,
          k.fd,
          st.res.id,
          { ...AGAIN, ...(a.extra ? { snack: 1 } : {}) },
          {
            mocs: { ...MOC2, ...(a.extra ? { snack: 1 } : {}) },
          },
        );
        const f1 = await getFolio(request, k.fd, st.res.folioId!);
        for (const c of PAID)
          expect
            .soft(itemVnd(f1, c), `${c}: đếm lại ${AGAIN[c]} × giá lúc nạp`)
            .toBe(EXPECT_AFTER(c));
        if (a.extra === 'snack')
          expect.soft(itemVnd(f1, 'snack'), 'snack mốc 1').toBe(price('snack'));
        const expected = sum(PAID.map(EXPECT_AFTER)) + (a.extra === 'snack' ? price('snack') : 0);
        expect.soft(minibarGross(f1), 'tổng minibar').toBe(expected);
        expect
          .soft(await latestTotal(request, k.fd, st.res.id), 'latestCheck = folio (R10)')
          .toBe(expected);
        await settle(request, k, st, '09:00', expected);
      });
    }

    test('TC-L4-110 (A) DOM (e) số folio lễ tân đã sửa thắng lần đếm cũ: bia đếm 2 → sửa folio còn 1 → HK xác nhận lần cũ (dùng 2) giữ 35.000 → Desk gửi theo folio (dùng 1) vẫn giữ → dùng 0 là lần đếm mới (R6, R7)', async ({
      request,
    }) => {
      knownBug('BUG-R2-140');
      needClock('TC-L4-110');
      const { k, st } = await precondition(
        'khách ở 1 đêm, bia đếm 2, lễ tân sửa còn 1',
        async () => {
          const { k, stays } = await stayFor(request, ['202']);
          const st = stays[0]!;
          await counted(request, k.fd, st.res.id, { bia: 2 });
          const line = itemLines(await getFolio(request, k.fd, st.res.folioId!), 'bia')[0]!;
          const adj = await adjustLine(request, k.fd, st.res.folioId!, line.id, {
            newQuantity: 1,
            reason: 'Khach chi dung 1 lon',
          });
          expect(adj.status, JSON.stringify(adj.body).slice(0, 300)).toBe(201);
          return { k, st };
        },
      );
      const t = await std(request, k.fd, st.res.id);
      const beer = t.body.items.find((i) => i.itemId === idByCode.get('bia'));
      expect.soft(beer?.adjustedAfterLastCheck, 'adjustedAfterLastCheck').toBe(true);
      expect.soft(beer?.folioUsedQty, 'folioUsedQty').toBe(1);
      expect.soft(beer?.lastCheckUsedQty, 'lastCheckUsedQty').toBe(2);
      const kept = itemLines(await getFolio(request, k.fd, st.res.folioId!), 'bia')[0]!;
      await counted(request, k.fd, st.res.id, { bia: 2 }, {}, 'HK xác nhận lần cũ (dùng 2)');
      let f = await getFolio(request, k.fd, st.res.folioId!);
      expect
        .soft(itemVnd(f, 'bia'), 'dùng 2 = lần đếm trước → giữ số folio 35.000')
        .toBe(price('bia'));
      expect.soft(itemLines(f, 'bia')[0]?.id, 'giữ đúng dòng folio đã sửa').toBe(kept.id);
      await counted(request, k.fd, st.res.id, { bia: 1 }, {}, 'đếm theo folio (dùng 1)');
      f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(itemVnd(f, 'bia'), 'dùng 1 = số folio → vẫn giữ 35.000').toBe(price('bia'));
      expect.soft(itemLines(f, 'bia')[0]?.id).toBe(kept.id);
      expect
        .soft(await latestTotal(request, k.fd, st.res.id), 'latestCheck = folio')
        .toBe(price('bia'));
      await counted(request, k.fd, st.res.id, { bia: 0 }, {}, 'lần đếm thật mới (dùng 0)');
      f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(itemVnd(f, 'bia')).toBe(0);
      await settle(request, k, st, '09:00', 0);
    });

    test('TC-L4-111 (A) DOM (e) lễ tân void dòng bia (có lý do) → đếm lại dùng 2 giữ "không dòng"; dùng 1 → 35.000 (R6, R7)', async ({
      request,
    }) => {
      knownBug('BUG-R2-140');
      needClock('TC-L4-111');
      const { k, st } = await precondition('khách ở 1 đêm, bia đếm 2, lễ tân void', async () => {
        const { k, stays } = await stayFor(request, ['202']);
        const st = stays[0]!;
        await counted(request, k.fd, st.res.id, { bia: 2 });
        const line = itemLines(await getFolio(request, k.fd, st.res.folioId!), 'bia')[0]!;
        const v = await adjustLine(request, k.fd, st.res.folioId!, line.id, {
          voidLine: true,
          reason: 'Khach khong dung, dem nham',
        });
        expect(v.status, JSON.stringify(v.body).slice(0, 300)).toBe(201);
        return { k, st };
      });
      await counted(request, k.fd, st.res.id, { bia: 2 }, {}, 'đếm lại dùng 2 (lần cũ)');
      let f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(itemVnd(f, 'bia'), 'giữ "không dòng"').toBe(0);
      await counted(request, k.fd, st.res.id, { bia: 1 }, {}, 'lần đếm mới dùng 1');
      f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(itemVnd(f, 'bia')).toBe(price('bia'));
      await settle(request, k, st, '09:00', price('bia'));
    });

    test('TC-L4-112 (A) món mới thêm vào danh mục sau khi nhận phòng không ở trong tủ: không trong `items`, đếm món đó → 422 NOT_IN_LIST (R3)', async ({
      request,
    }) => {
      knownBug('BUG-R2-137');
      needClock('TC-L4-112');
      const NEW = 'mx_e2e_new';
      const { k, st } = await precondition('khách ở 1 đêm; OWN thêm món mới', async () => {
        const { k, stays } = await stayFor(request, ['202']);
        const cur = (await catalog(request, k.owner)).find((x) => x.code === NEW);
        if (cur) await setItem(request, k.owner, NEW, { isActive: true });
        else {
          const r = await call<CatalogItem>(request, 'POST', p3(EP3.createItem, k.owner), {
            session: k.owner,
            idempotencyKey: true,
            body: {
              code: NEW,
              name: { vi: 'MX E2E món mới', en: 'MX E2E new item' },
              unit: 'gói',
              costPriceVnd: 5000,
              salePriceVnd: 15000,
              minibarStandardQty: 1,
              minStockQty: 0,
            },
          });
          expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(201);
        }
        idByCode.set(NEW, (await catalog(request, k.owner)).find((x) => x.code === NEW)!.id);
        return { k, st: stays[0]! };
      });
      const t = await std(request, k.fd, st.res.id);
      expect
        .soft(
          t.body.items.some((i) => i.itemId === idByCode.get(NEW)),
          'món mới không trong tủ',
        )
        .toBe(false);
      const r = await count(request, k.fd, st.res.id, { [NEW]: 1 }, { mocs: { [NEW]: 1 } });
      expect.soft(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(422);
      expect.soft(JSON.stringify(r.body)).toContain('NOT_IN_LIST');
      await counted(request, k.fd, st.res.id, {});
      await settle(request, k, st, '09:00', 0);
    });

    test('TC-L4-113 (A) sửa định mức hai lần khi khách đang ở (2 → 1 → 3): mốc vẫn 2 – chỉ lần sửa đầu chụp; còn 3 → 422 (R2, R4)', async ({
      request,
    }) => {
      knownBug('BUG-R2-138');
      needClock('TC-L4-113');
      const { k, st } = await precondition('khách ở 1 đêm, chưa đếm', async () => {
        const { k, stays } = await stayFor(request, ['202']);
        return { k, st: stays[0]! };
      });
      await setItem(request, k.owner, 'bia', { minibarStandardQty: 1 });
      await setItem(request, k.owner, 'bia', { minibarStandardQty: 3 });
      const t = await std(request, k.fd, st.res.id);
      expect.soft(t.body.items.find((i) => i.itemId === idByCode.get('bia'))?.standardQty).toBe(2);
      const over = await count(request, k.fd, st.res.id, {}, { remaining: { bia: 3 } });
      expect.soft(over.status, 'còn 3 > mốc 2 → 422').toBe(422);
      expect.soft(JSON.stringify(over.body)).toContain('MINIBAR_QTY_OVER_STANDARD');
      await counted(request, k.fd, st.res.id, { bia: 2 }, { mocs: { bia: 2 } });
      const f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(itemVnd(f, 'bia'), 'dùng 2 × 35.000').toBe(2 * price('bia'));
      await settle(request, k, st, '09:00', 2 * price('bia'));
    });

    // ───────────── FOC (R8) ─────────────

    test('TC-L4-114 (A) đối chứng BR-434-15 (a): bia 2 → FOC 35.000 → đếm về 0 (ngủ) → đếm lại 2 → tự khôi phục 35.000, ròng 35.000', async ({
      request,
    }) => {
      needClock('TC-L4-114');
      const { k, st } = await precondition('khách ở 1 đêm, bia 2', async () => {
        const { k, stays } = await stayFor(request, ['202']);
        await counted(request, k.fd, stays[0]!.res.id, { bia: 2 });
        return { k, st: stays[0]! };
      });
      const A = await foc(request, k, st, 'bia', price('bia'));
      await counted(request, k.fd, st.res.id, { bia: 0 });
      expect.soft((await approvalById(request, k.owner, A)).focState, 'về 0 → ngủ').toBe('dormant');
      await counted(request, k.fd, st.res.id, { bia: 2 });
      expect.soft((await approvalById(request, k.owner, A)).focState).toBe('applied');
      const f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(minibarGross(f) - reductions(f), 'ròng').toBe(price('bia'));
      await settle(request, k, st, '09:00', price('bia'));
    });

    test('TC-L4-115 (A) đối chứng: hai FOC trên CÙNG một dòng bia 70.000 (35.000 + 35.000) – cả hai áp, ròng 0', async ({
      request,
    }) => {
      needClock('TC-L4-115');
      const { k, st } = await precondition('khách ở 1 đêm, bia 2', async () => {
        const { k, stays } = await stayFor(request, ['202']);
        await counted(request, k.fd, stays[0]!.res.id, { bia: 2 });
        return { k, st: stays[0]! };
      });
      const A = await foc(request, k, st, 'bia', price('bia'));
      const B = await foc(request, k, st, 'bia', price('bia'));
      expect.soft((await approvalById(request, k.owner, A)).focState).toBe('applied');
      expect.soft((await approvalById(request, k.owner, B)).focState).toBe('applied');
      const f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(minibarGross(f) - reductions(f)).toBe(0);
      await settle(request, k, st, '09:00', 0);
    });

    test('TC-L4-116 (A) BUG-R2-135 hai FOC trên một món ở hai mắt chuỗi – (a) 2 → A → 0 → 2 → B → 1; (b) 1 → A → 2 → B → 1; (c) sửa số trên folio 1 → A → 2 → B → 1: A áp 35.000, B ngủ, ròng 0, B18 thu 0, chốt → B hủy settled_while_dormant', async ({
      request,
    }) => {
      knownBug('BUG-R2-135');
      needClock('TC-L4-116');
      const { k, sa, sb, sc } = await precondition('ba khách ở 1 đêm cùng ngày', async () => {
        const { k, stays } = await stayFor(request, ['102', '202', '203']);
        return { k, sa: stays[0]!, sb: stays[1]!, sc: stays[2]! };
      });
      const b = price('bia');
      // (a) đường về 0 – hồi quy của bản sửa BUG-R2-129
      await counted(request, k.fd, sa.res.id, { bia: 2 });
      const aA = await foc(request, k, sa, 'bia', b);
      await counted(request, k.fd, sa.res.id, { bia: 0 });
      await counted(request, k.fd, sa.res.id, { bia: 2 });
      const aB = await foc(request, k, sa, 'bia', b);
      await counted(request, k.fd, sa.res.id, { bia: 1 });
      // (b) đếm lại khác 0
      await counted(request, k.fd, sb.res.id, { bia: 1 });
      const bA = await foc(request, k, sb, 'bia', b);
      await counted(request, k.fd, sb.res.id, { bia: 2 });
      const bB = await foc(request, k, sb, 'bia', b);
      await counted(request, k.fd, sb.res.id, { bia: 1 });
      // (c) chỉ sửa số trên folio (adjustFolioLine)
      await counted(request, k.fd, sc.res.id, { bia: 1 });
      const cA = await foc(request, k, sc, 'bia', b);
      let line = itemLines(await getFolio(request, k.fd, sc.res.folioId!), 'bia')[0]!;
      expect(
        (
          await adjustLine(request, k.fd, sc.res.folioId!, line.id, {
            newQuantity: 2,
            reason: 'Them 1 lon',
          })
        ).status,
      ).toBe(201);
      const cB = await foc(request, k, sc, 'bia', b);
      line = itemLines(await getFolio(request, k.fd, sc.res.folioId!), 'bia')[0]!;
      expect(
        (
          await adjustLine(request, k.fd, sc.res.folioId!, line.id, {
            newQuantity: 1,
            reason: 'Bot 1 lon',
          })
        ).status,
      ).toBe(201);
      for (const [label, st, A, B] of [
        ['a', sa, aA, aB],
        ['b', sb, bA, bB],
        ['c', sc, cA, cB],
      ] as const) {
        const f = await getFolio(request, k.fd, st.res.folioId!);
        expect.soft(itemVnd(f, 'bia'), `(${label}) giá trị món`).toBe(b);
        expect.soft(minibarGross(f) - reductions(f), `(${label}) ròng 0, không âm`).toBe(0);
        expect
          .soft((await approvalById(request, k.owner, A)).focState, `(${label}) A`)
          .toBe('applied');
        expect
          .soft((await approvalById(request, k.owner, B)).focState, `(${label}) B`)
          .toBe('dormant');
        await settle(request, k, st, '09:00', 0);
        const after = await approvalById(request, k.owner, B);
        expect.soft(after.focState, `(${label}) B sau chốt`).toBe('cancelled');
        expect.soft(after.focCancelReason).toBe('settled_while_dormant');
      }
    });

    test('TC-L4-117 (A) FOC × thay đổi danh mục trên một tủ: bia sang miễn phí (B1, một FOC), coca hạ định mức 2 → 1 (B3, hai FOC áp trước – sau đếm lại A áp, B ngủ, FOC thứ ba bị chặn max 0), sữa tăng giá (B2, một FOC), mì tắt món (B1, một FOC) – ròng 80.000 = B18 (R5, R6, R8)', async ({
      request,
    }) => {
      knownBug('BUG-R2-135', 'BUG-R2-137', 'BUG-R2-138', 'BUG-R2-140');
      needClock('TC-L4-117');
      const { k, st } = await precondition(
        'khách ở 1 đêm, lần đếm đầu bia 2, coca 2, sữa 1, mì 2',
        async () => {
          const { k, stays } = await stayFor(request, ['202']);
          await counted(request, k.fd, stays[0]!.res.id, { bia: 2, coca: 2, sua: 1, mi: 2 });
          return { k, st: stays[0]! };
        },
      );
      await foc(request, k, st, 'bia', price('bia'));
      const coA = await foc(request, k, st, 'coca', price('coca'));
      // hai FOC coca khi giá trị món còn 50.000 (cả hai áp); sau khi đếm lại còn 25.000 → A áp, B ngủ (R8)
      const coB = await foc(request, k, st, 'coca', price('coca'));
      await foc(request, k, st, 'sua', price('sua'));
      await foc(request, k, st, 'mi', price('mi'));
      await setItem(request, k.owner, 'bia', { salePriceVnd: null });
      await setItem(request, k.owner, 'coca', { minibarStandardQty: 1 });
      await setItem(request, k.owner, 'sua', { salePriceVnd: price('sua') + 5000 });
      await setItem(request, k.owner, 'mi', { isActive: false });
      await counted(request, k.fd, st.res.id, { bia: 2, coca: 1, sua: 2, mi: 2 }, { mocs: MOC2 });
      // FOC mới khi Σ FOC đã bằng giá trị món → không cho xin (Problem `max` 0)
      const coLine = itemLines(await getFolio(request, k.fd, st.res.folioId!), 'coca').at(-1)!;
      const coC = await requestReduction(request, k.fd, st.res.folioId!, coLine.id, {
        amountVnd: price('coca'),
        reasonCode: 'service_recovery',
      });
      expect.soft(coC.status, 'FOC vượt phần còn lại của món').toBe(422);
      expect.soft(coC.body.max, 'max = phần còn lại').toBe(0);
      const f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(itemVnd(f, 'bia'), 'bia giữ 70.000').toBe(2 * price('bia'));
      expect.soft(itemVnd(f, 'coca'), 'coca dùng 1 (mốc 2)').toBe(price('coca'));
      expect.soft(itemVnd(f, 'sua'), 'sữa 2 × giá lúc nạp').toBe(2 * price('sua'));
      expect.soft(itemVnd(f, 'mi'), 'mì giữ 50.000').toBe(2 * price('mi'));
      expect.soft((await approvalById(request, k.owner, coA)).focState).toBe('applied');
      expect.soft((await approvalById(request, k.owner, coB)).focState).toBe('dormant');
      const net =
        2 * price('bia') -
        price('bia') +
        0 +
        2 * price('sua') -
        price('sua') +
        2 * price('mi') -
        price('mi');
      expect.soft(minibarGross(f) - reductions(f), 'ròng 80.000').toBe(net);
      await settle(request, k, st, '09:00', net);
    });

    // ───────────── B14 giữa lượt (R1, R9) ─────────────

    /** Trạng thái buồng hiện tại (lưu hoặc suy ra) theo `roomId`. */
    async function roomStates(
      request: APIRequestContext,
      s: StaffSession,
    ): Promise<Map<string, string>> {
      const r = await call<{ data: Array<{ roomId: string; status: string }> }>(
        request,
        'GET',
        p3(EP3.listRoomStatuses, s),
        { session: s },
      );
      expect(r.status, `listRoomStatuses: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
      return new Map(r.body.data.map((x) => [x.roomId, x.status]));
    }
    /** Căn không có khách và không khóa (VC, VI, VD, CL) – chọn được làm căn đi/đến của B14. */
    async function vacantRooms(request: APIRequestContext, k: People): Promise<Room[]> {
      const st = await roomStates(request, k.fd);
      return k.c.rooms.filter((r) => ['VC', 'VI', 'VD', 'CL'].includes(st.get(r.id) ?? 'VC'));
    }
    /**
     * Căn đích của B14 phải sạch (409 `ROOM_NOT_READY` nếu `VD`): ca trước trong tệp trả phòng để lại `VD`, và
     * `cleanRooms()` chỉ chạy được khi có E2E_COMPOSE_CONTROL – nên dọn bằng API như buồng phòng (SM-03 R1, R2/R3).
     */
    async function makeReady(
      request: APIRequestContext,
      s: StaffSession,
      rm: Room,
      day: string,
      hhmm: string,
    ): Promise<void> {
      const cur = (await roomStates(request, s)).get(rm.id) ?? 'VC';
      if (cur === 'VC' || cur === 'VI') return;
      const step = async (event: string, expectedFrom: string, at: string) => {
        const r = await call<Json & ProblemFields>(
          request,
          'POST',
          `/v1/properties/${propertyIdOf(s)}/rooms/${rm.id}/status-transitions`,
          {
            session: s,
            idempotencyKey: true,
            body: { event, expectedFrom, performedAt: vnTime(day, at) },
          },
        );
        expect(r.status, `${rm.roomNo} ${event}: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(
          200,
        );
      };
      const [h, m] = hhmm.split(':').map(Number) as [number, number];
      const plus = (n: number) => `${String(h).padStart(2, '0')}:${String(m + n).padStart(2, '0')}`;
      if (cur === 'VD') await step('start_cleaning', 'VD', plus(0));
      if (cur === 'VD' || cur === 'CL') await step('finish_cleaning', 'CL', plus(1));
      else throw new Error(`căn ${rm.roomNo} đang ${cur} – không làm căn đích B14 được`);
      expect((await roomStates(request, s)).get(rm.id), `${rm.roomNo} sạch trước B14`).toMatch(
        /^V[CI]$/,
      );
    }

    /** Hai căn trống cùng nhóm (B14 sự cố không chênh tiền), trong `rooms` (căn không có khách). */
    function sameGroupPairs(rooms: readonly Room[], n: number): Array<[Room, Room]> {
      const pairs: Array<[Room, Room]> = [];
      const used = new Set<string>();
      for (const a of rooms)
        for (const b of rooms)
          if (
            pairs.length < n &&
            a.id !== b.id &&
            a.roomGroupId &&
            a.roomGroupId === b.roomGroupId &&
            !used.has(a.id) &&
            !used.has(b.id)
          ) {
            pairs.push([a, b]);
            used.add(a.id);
            used.add(b.id);
          }
      return pairs;
    }
    async function b14(
      request: APIRequestContext,
      k: People,
      st: Stay,
      to: Room,
      day: string,
      cause: 'property_fault' | 'guest_request',
      extra: Json = {},
    ): Promise<void> {
      await makeReady(request, k.fd, to, day, '10:00');
      const base = {
        newRoomId: to.id,
        effectiveDate: day,
        cause,
        reason: cause === 'guest_request' ? 'Khach xin doi phong' : 'Binh nong lanh hong',
        ...extra,
      };
      const pv = await stayAction<Json & ProblemFields>(
        request,
        k.fd,
        st.res.id,
        'change-room',
        base,
        {
          dryRun: true,
        },
      );
      expect(pv.status, `changeRoom dryRun: ${JSON.stringify(pv.body).slice(0, 300)}`).toBe(200);
      const delta = Number(pv.body.folioDeltaVnd ?? 0);
      const w = await stayAction<Json & ProblemFields>(request, k.fd, st.res.id, 'change-room', {
        ...base,
        ...(delta !== 0 ? { applyDifference: true, expectedDeltaVnd: delta } : {}),
      });
      expect(w.status, `changeRoom: ${JSON.stringify(w.body).slice(0, 300)}`).toBe(200);
    }

    test('TC-L4-118 (A) BUG-R2-136 B14 sự cố giữa lượt – hai tủ hai lần đếm: (a) tủ cũ 2 bia (đếm trong ngày, `roomId`), tủ mới 1 → 105.000; (b) tủ cũ chưa đếm thì B18 chặn `minibarUncheckedRooms`, đếm xong 70.000; (c) như (a) + FOC 70.000 trên bia tủ cũ → ròng 35.000; đếm lại tủ mới chỉ thay lần đếm của tủ mới', async ({
      request,
    }) => {
      knownBug('BUG-R2-136');
      needClock('TC-L4-118');
      const { D, pairs, stays } = await precondition(
        'ba khách ở 2 đêm, mỗi khách một cặp căn cùng nhóm',
        async () => {
          const D = virtualDay(realToday, 3);
          await startDay(request, D, '14:00');
          const k0 = await people(request);
          const pairs = sameGroupPairs(await vacantRooms(request, k0), 3);
          expect(pairs.length, 'cần 3 cặp căn cùng nhóm').toBe(3);
          const stays: Stay[] = [];
          for (const [from] of pairs)
            stays.push(await inHouse(request, k0.c, k0.fd, { room: from, arrival: D, nights: 2 }));
          return { D, pairs, stays };
        },
      );
      const d1 = addDays(D, 1);
      let k = await moveTo(request, d1, '10:00');
      for (let i = 0; i < 3; i++)
        await b14(request, k, stays[i]!, pairs[i]![1], d1, 'property_fault');
      // (a), (c): HK đếm tủ căn cũ trong ngày (`roomId` = căn cũ)
      for (const i of [0, 2])
        await counted(
          request,
          k.fd,
          stays[i]!.res.id,
          { bia: 2 },
          { roomId: pairs[i]![0].id },
          'đếm tủ căn cũ',
        );
      const cFoc = await foc(request, k, stays[2]!, 'bia', 2 * price('bia'));
      k = await moveTo(request, addDays(D, 2), '09:00');
      await counted(request, k.fd, stays[0]!.res.id, { bia: 1 }, {}, '(a) đếm tủ mới');
      await counted(request, k.fd, stays[0]!.res.id, { bia: 1 }, {}, '(a) đếm lại tủ mới');
      await counted(request, k.fd, stays[1]!.res.id, {}, {}, '(b) đếm tủ mới');
      await counted(request, k.fd, stays[2]!.res.id, { bia: 1 }, {}, '(c) đếm tủ mới');
      // (b) tủ căn cũ chưa đếm → B18 chặn
      const s = await checkoutSummary(request, k.fd, stays[1]!.res.id, { checkoutTime: '09:00' });
      expect
        .soft(
          JSON.stringify((s.body as unknown as Json).minibarUncheckedRooms ?? []),
          '(b) tủ cũ chưa đếm',
        )
        .toContain(pairs[1]![0].id);
      const blocked = await checkOut(request, k.fd, stays[1]!.res.id, { checkoutTime: '09:00' });
      expect.soft(blocked.status, '(b) B18 bị chặn khi còn tủ chưa đếm').toBe(409);
      await counted(
        request,
        k.fd,
        stays[1]!.res.id,
        { bia: 2 },
        { roomId: pairs[1]![0].id },
        '(b) đếm tủ căn cũ',
      );
      const fa = await getFolio(request, k.fd, stays[0]!.res.folioId!);
      expect.soft(minibarGross(fa), '(a) 70.000 + 35.000').toBe(3 * price('bia'));
      expect
        .soft(
          await latestTotal(request, k.fd, stays[0]!.res.id, pairs[0]![0].id),
          '(a) latestCheck tủ cũ',
        )
        .toBe(2 * price('bia'));
      const fb = await getFolio(request, k.fd, stays[1]!.res.folioId!);
      expect.soft(minibarGross(fb), '(b) 70.000').toBe(2 * price('bia'));
      const fc = await getFolio(request, k.fd, stays[2]!.res.folioId!);
      expect.soft(minibarGross(fc) - reductions(fc), '(c) ròng 35.000').toBe(price('bia'));
      expect.soft((await approvalById(request, k.owner, cFoc)).focState).toBe('applied');
      await settle(request, k, stays[0]!, '09:00', 3 * price('bia'));
      await settle(request, k, stays[1]!, '09:00', 2 * price('bia'));
      await settle(request, k, stays[2]!, '09:00', price('bia'));
    });

    test('TC-L4-119 (A) BUG-R2-136 + 138: (a) B14 khách xin sang nhóm khác, tủ cũ không dùng, tủ mới 1 snack → minibar 30.000, xem trước = B18; (b) bia tủ cũ dùng 2 → hạ định mức 2 → 1 → B14 sự cố: tủ cũ mốc 2 giữ 70.000, tủ mới mốc 1 (danh mục lúc vào căn) dùng 1 → 35.000', async ({
      request,
    }) => {
      knownBug('BUG-R2-136', 'BUG-R2-138');
      needClock('TC-L4-119');
      const { D, sa, sb, toA, pair } = await precondition('hai khách ở 2 đêm', async () => {
        const D = virtualDay(realToday, 3);
        await startDay(request, D, '14:00');
        const k0 = await people(request);
        // (a) khách xin sang căn ĐẮT hơn (101 → 301: còn phải thu, không thừa tiền); (b) cặp 202 → 203 cùng nhóm
        const vacant = await vacantRooms(request, k0);
        const pick = (nos: string[]) => vacant.find((r) => nos.includes(r.roomNo));
        const fromA = pick(['101', '102', '103']);
        const toA = pick(['301', '302']);
        expect(fromA && toA, 'cần một căn 10x và một căn 30x không có khách').toBeTruthy();
        const pair = sameGroupPairs(
          vacant.filter(
            (r) => r.id !== fromA!.id && r.id !== toA!.id && r.roomGroupId !== fromA!.roomGroupId,
          ),
          1,
        )[0]!;
        expect(pair, 'cần một cặp căn cùng nhóm không có khách').toBeTruthy();
        const sa = await inHouse(request, k0.c, k0.fd, { room: fromA!, arrival: D, nights: 2 });
        const sb = await inHouse(request, k0.c, k0.fd, { room: pair[0], arrival: D, nights: 2 });
        return { D, sa, sb, toA: toA!, pair };
      });
      const d1 = addDays(D, 1);
      let k = await moveTo(request, d1, '10:00');
      // (a)
      await counted(request, k.fd, sa.res.id, {}, { roomId: sa.room.id }, '(a) đếm tủ cũ');
      await b14(request, k, sa, toA, d1, 'guest_request');
      // (b)
      await counted(request, k.fd, sb.res.id, { bia: 2 }, {}, '(b) đếm tủ cũ trước B14');
      await setItem(request, k.owner, 'bia', { minibarStandardQty: 1 });
      await b14(request, k, sb, pair[1], d1, 'property_fault');
      k = await moveTo(request, addDays(D, 2), '09:00');
      await counted(request, k.fd, sa.res.id, { snack: 1 }, {}, '(a) đếm tủ mới');
      const tb = await std(request, k.fd, sb.res.id);
      expect
        .soft(
          tb.body.items.find((i) => i.itemId === idByCode.get('bia'))?.standardQty,
          '(b) mốc tủ mới',
        )
        .toBe(1);
      await counted(request, k.fd, sb.res.id, { bia: 1 }, { mocs: { bia: 1 } }, '(b) đếm tủ mới');
      const fa = await getFolio(request, k.fd, sa.res.folioId!);
      expect.soft(minibarGross(fa), '(a) minibar').toBe(price('snack'));
      const fb = await getFolio(request, k.fd, sb.res.folioId!);
      expect.soft(minibarGross(fb), '(b) 70.000 + 35.000').toBe(3 * price('bia'));
      // (a) xem trước = lệnh ghi: thu đúng số summary (gồm chênh đổi căn của khách xin)
      const sum0 = await checkoutSummary(request, k.fd, sa.res.id, { checkoutTime: '09:00' });
      const dueA = Number(
        (sum0.body as unknown as Json).amountDueAtCheckoutVnd ?? sum0.body.balanceDueVnd,
      );
      await settle(request, k, sa, '09:00', dueA);
      await settle(request, k, sb, '09:00', 3 * price('bia'));
    });

    /** Việc bổ sung minibar của căn `roomId` cho đơn (BR-703-01 `oldRoomRestockTask`). */
    async function refillTasks(
      request: APIRequestContext,
      k: People,
      date: string,
      roomId: string,
      reservationId: string,
    ): Promise<Json[]> {
      const r = await call<{ data: Json[] }>(request, 'GET', p3(EP3.listHkTasks, k.owner), {
        session: k.owner,
        query: { date },
      });
      expect(r.status, `listHkTasks: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
      return r.body.data.filter(
        (t) =>
          t.type === 'minibar_refill' && t.roomId === roomId && t.reservationId === reservationId,
      );
    }
    const refillOf = (t: Json | undefined): Record<string, number> =>
      Object.fromEntries(
        ((t?.refillItems as Array<{ itemId: string; quantity: number }> | undefined) ?? []).map(
          (x) => [x.itemId, x.quantity],
        ),
      );

    test('TC-L4-122 (A) BUG-R2-136 B14 giữa lượt sinh việc bổ sung tủ căn cũ (`minibar_refill`, nguồn system, đúng món đã dùng): (a) tủ cũ đã đếm TRƯỚC B14 → việc sinh lúc B14; (b) đếm tủ cũ SAU B14 (`roomId`) → việc sinh lúc đếm; trước khi đếm, `minibarUncheckedRooms` có căn cũ', async ({
      request,
    }) => {
      knownBug('BUG-R2-136');
      needClock('TC-L4-122');
      const { D, pairs, sa, sb } = await precondition(
        'hai khách ở 2 đêm, mỗi khách một cặp căn cùng nhóm',
        async () => {
          const D = virtualDay(realToday, 3);
          await startDay(request, D, '14:00');
          const k0 = await people(request);
          const pairs = sameGroupPairs(await vacantRooms(request, k0), 2);
          expect(pairs.length, 'cần 2 cặp căn cùng nhóm').toBe(2);
          const sa = await inHouse(request, k0.c, k0.fd, {
            room: pairs[0]![0],
            arrival: D,
            nights: 2,
          });
          const sb = await inHouse(request, k0.c, k0.fd, {
            room: pairs[1]![0],
            arrival: D,
            nights: 2,
          });
          return { D, pairs, sa, sb };
        },
      );
      const d1 = addDays(D, 1);
      let k = await moveTo(request, d1, '10:00');
      const [oldA, newA] = pairs[0]!;
      const [oldB, newB] = pairs[1]!;
      // (a) đếm tủ căn đang ở (bia 2, coca 1) rồi B14 → onCheckedOut(căn cũ) sinh việc bổ sung
      await counted(request, k.fd, sa.res.id, { bia: 2, coca: 1 }, {}, '(a) đếm tủ trước B14');
      expect
        .soft(await refillTasks(request, k, d1, oldA.id, sa.res.id), '(a) chưa B14 → chưa có việc')
        .toHaveLength(0);
      await b14(request, k, sa, newA, d1, 'property_fault');
      const ta = await refillTasks(request, k, d1, oldA.id, sa.res.id);
      expect.soft(ta, '(a) một việc bổ sung tủ căn cũ').toHaveLength(1);
      expect.soft(ta[0]?.source, '(a) nguồn system').toBe('system');
      expect.soft(refillOf(ta[0]), '(a) đúng món đã dùng').toEqual({
        [idByCode.get('bia')!]: 2,
        [idByCode.get('coca')!]: 1,
      });
      // (b) B14 trước, tủ căn cũ chưa đếm → B18 phải thấy tủ đó; đếm sau B14 với `roomId` sinh việc
      await b14(request, k, sb, newB, d1, 'property_fault');
      const sum0 = await checkoutSummary(request, k.fd, sb.res.id);
      expect
        .soft(
          JSON.stringify((sum0.body as unknown as Json).minibarUncheckedRooms ?? []),
          '(b) B14 ghi nhận tủ căn cũ chưa đếm',
        )
        .toContain(oldB.id);
      expect
        .soft(await refillTasks(request, k, d1, oldB.id, sb.res.id), '(b) chưa đếm → chưa có việc')
        .toHaveLength(0);
      await counted(
        request,
        k.fd,
        sb.res.id,
        { snack: 1 },
        { roomId: oldB.id },
        '(b) đếm tủ căn cũ sau B14',
      );
      const tb = await refillTasks(request, k, d1, oldB.id, sb.res.id);
      expect.soft(tb, '(b) một việc bổ sung tủ căn cũ').toHaveLength(1);
      expect.soft(tb[0]?.source).toBe('system');
      expect.soft(refillOf(tb[0]), '(b) đúng món đã dùng').toEqual({ [idByCode.get('snack')!]: 1 });
      const sum1 = await checkoutSummary(request, k.fd, sb.res.id);
      expect
        .soft(
          JSON.stringify((sum1.body as unknown as Json).minibarUncheckedRooms ?? []),
          '(b) tủ căn cũ đã đếm',
        )
        .not.toContain(oldB.id);
      // ngày đi: đếm tủ mới (không dùng), B18 thu đúng minibar của tủ cũ
      k = await moveTo(request, addDays(D, 2), '09:00');
      await counted(request, k.fd, sa.res.id, {}, {}, '(a) đếm tủ mới');
      await counted(request, k.fd, sb.res.id, {}, {}, '(b) đếm tủ mới');
      await settle(request, k, sa, '09:00', 2 * price('bia') + price('coca'));
      await settle(request, k, sb, '09:00', price('snack'));
    });

    test('TC-L4-124 (A) BUG-R2-144 / BR-703-02 `s409Agoda`: đơn Agoda có đơn con gia hạn; khách xin đổi tạm (B14 `until_parent_departure`) → tủ căn gốc đếm 2 bia → HK xong việc bổ sung → ghi khách về căn gốc (`roomReturnRecorded`) mở kỳ mới → B18 đòi đếm lại tủ căn gốc; kỳ sau 1 bia → minibar 105.000, dòng 70.000 giữ; xem trước B18 = lệnh ghi; ngày đi tủ căn gốc phải đếm lại trong ngày (BR-703 ghi chú 7), tủ căn tạm đã rời thì không', async ({
      request,
    }) => {
      needClock('TC-L4-124');
      const { D, st, child, origin, temp } = await precondition(
        'Agoda 2 đêm căn gốc + 1 đêm con (B13), đang ở',
        async () => {
          const D = virtualDay(realToday, 4);
          await startDay(request, D, '14:00');
          const k0 = await people(request);
          const vacant = await vacantRooms(request, k0);
          const origin = vacant.find((r) => r.roomNo === '202') ?? vacant[0]!;
          const temp = vacant.find(
            (r) => r.id !== origin.id && r.roomGroupId !== origin.roomGroupId,
          )!;
          expect(temp, 'cần một căn trống khác nhóm cho đổi tạm').toBeTruthy();
          const st = await inHouse(request, k0.c, k0.fd, {
            room: origin,
            arrival: D,
            nights: 2,
            kind: 'agoda',
          });
          const cur = await getReservation(request, k0.fd, st.res.id);
          const ext = await call<{ childReservation?: { id: string } } & ProblemFields>(
            request,
            'POST',
            p3(EP3.extendStay, k0.fd, { reservationId: st.res.id }),
            {
              session: k0.fd,
              idempotencyKey: true,
              ifMatch: versionTag(cur.body.version),
              body: { nights: 1 },
            },
          );
          expect(ext.status, `extendStay: ${JSON.stringify(ext.body).slice(0, 300)}`).toBe(200);
          const child = ext.body.childReservation?.id;
          expect(child, 'đơn con B13 (BR-422)').toBeTruthy();
          return { D, st, child: child!, origin, temp };
        },
      );
      // D+1: khách xin đổi tạm tới hết đơn gốc (S4-09) → tủ căn gốc đếm như trả phòng, HK bổ sung xong
      const d1 = addDays(D, 1);
      let k = await moveTo(request, d1, '10:00');
      await b14(request, k, st, temp, d1, 'guest_request', { stayScope: 'until_parent_departure' });
      await counted(
        request,
        k.fd,
        st.res.id,
        { bia: 2 },
        { roomId: origin.id },
        'kỳ 1: đếm tủ căn gốc',
      );
      // ARC 16.17 mục 2: "xong sau lần đếm" xét theo giờ xử lý (`occurred_at` của `complete`) – đồng hồ ảo
      // đang đứng ở 10:00, nên dời tới 10:30 trước khi HK bấm để lần xong chắc chắn sau lần đếm.
      k = await moveTo(request, d1, '10:30');
      const hk = await sessionOrSkip(request, 'qa.hk');
      const tasks = await call<{ data: Json[] }>(request, 'GET', p3(EP3.listHkTasks, hk), {
        session: hk,
        query: { date: d1 },
      });
      expect(tasks.status).toBe(200);
      const refill = tasks.body.data.find(
        (t) =>
          t.type === 'minibar_refill' && t.roomId === origin.id && t.reservationId === st.res.id,
      );
      expect(refill, 'việc bổ sung tủ căn gốc').toBeTruthy();
      for (const [action, at] of [
        ['start', '10:30'],
        ['complete', '10:31'],
      ] as const) {
        const r = await call<Json & ProblemFields>(
          request,
          'POST',
          `/v1/properties/${propertyIdOf(hk)}/hk-tasks/${String(refill!.id)}/actions/${action}`,
          { session: hk, idempotencyKey: true, body: { performedAt: vnTime(d1, at) } },
        );
        expect(r.status, `HK ${action}: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
      }
      // D+2: khách về căn gốc (đêm đầu của đơn con) – lễ tân ghi nhận → kỳ nạp mới ở căn gốc
      const d2 = addDays(D, 2);
      k = await moveTo(request, d2, '10:00');
      // căn gốc đang `OC` (đêm của đơn con vẫn gán căn gốc) – không cần dọn trước khi ghi khách về
      const ch = await getReservation(request, k.fd, child);
      const back = await call<Json & ProblemFields>(
        request,
        'PATCH',
        `/v1/properties/${propertyIdOf(k.fd)}/reservations/${child}`,
        { session: k.fd, ifMatch: versionTag(ch.body.version), body: { roomReturnRecorded: true } },
      );
      expect(back.status, `roomReturnRecorded: ${JSON.stringify(back.body).slice(0, 300)}`).toBe(
        200,
      );
      const s0 = await checkoutSummary(request, k.fd, st.res.id);
      expect
        .soft(
          JSON.stringify((s0.body as unknown as Json).minibarUncheckedRooms ?? []),
          'kỳ mới ở căn gốc → B18 đòi đếm lại',
        )
        .toContain(origin.id);
      await counted(request, k.fd, st.res.id, {}, { roomId: temp.id }, 'tủ căn ở tạm (không dùng)');
      await counted(
        request,
        k.fd,
        st.res.id,
        { bia: 1 },
        { roomId: origin.id },
        'kỳ 2: đếm tủ căn gốc',
      );
      const f = await getFolio(request, k.fd, st.res.folioId!);
      expect
        .soft(
          itemLines(f, 'bia')
            .map((l) => l.amountVnd)
            .sort(),
          'dòng kỳ 1 giữ + dòng kỳ 2',
        )
        .toEqual([price('bia'), 2 * price('bia')]);
      expect.soft(minibarGross(f), 'minibar 105.000 (BR-703-02 s409Agoda)').toBe(3 * price('bia'));
      const s1 = await checkoutSummary(request, k.fd, st.res.id);
      expect
        .soft(
          JSON.stringify((s1.body as unknown as Json).minibarUncheckedRooms ?? []),
          'đã đếm đủ mọi tủ',
        )
        .toBe('[]');
      // ngày đi của đơn con: BR-703 ghi chú 7 (K11-09) – tủ căn đang ở phải đếm trong ngày đi → lần đếm D+2 không đủ
      // (`not_today`); đếm lại cùng số (còn 1/2) → giữ dòng (R6), không dòng mới; tủ căn tạm đã rời không phải đếm lại
      k = await moveTo(request, addDays(D, 3), '09:00');
      const s2 = await checkoutSummary(request, k.fd, st.res.id, { checkoutTime: '09:00' });
      expect
        .soft(
          ((s2.body as unknown as Json).minibarUncheckedRooms ?? []) as Json[],
          'tủ căn gốc đếm hôm trước → đòi đếm lại trong ngày đi (not_today)',
        )
        .toEqual([expect.objectContaining({ roomId: origin.id, reason: 'not_today' })]);
      await counted(
        request,
        k.fd,
        st.res.id,
        { bia: 1 },
        { roomId: origin.id },
        'ngày đi: đếm lại tủ căn gốc cùng số',
      );
      const f3 = await getFolio(request, k.fd, st.res.folioId!);
      expect
        .soft(minibarGross(f3), 'đếm lại cùng số → giữ dòng, minibar vẫn 105.000')
        .toBe(3 * price('bia'));
      const sum3 = await checkoutSummary(request, k.fd, st.res.id, { checkoutTime: '09:00' });
      const due = Number(
        (sum3.body as unknown as Json).amountDueAtCheckoutVnd ?? sum3.body.balanceDueVnd,
      );
      await settle(request, k, st, '09:00', due);
    });

    // ───────────── DOM R9 18/10 (BR-703-02 r9_*): việc bổ sung không hủy khi lượt ở tiếp, kỳ `carry` / `refill` ─────────────

    async function hkTask(
      request: APIRequestContext,
      hk: StaffSession,
      id: string,
      dates: string[],
    ) {
      for (const date of dates) {
        const r = await call<{ data: Json[] }>(request, 'GET', p3(EP3.listHkTasks, hk), {
          session: hk,
          query: { date },
        });
        if (r.status !== 200) continue; // ngày đã qua → 422; việc mở vẫn hiện ở hôm nay
        const hit = r.body.data.find((t) => t.id === id);
        if (hit) return hit;
      }
      return undefined;
    }
    async function refillTasksOf(
      request: APIRequestContext,
      hk: StaffSession,
      date: string,
      roomId: string,
      reservationId: string,
    ): Promise<Json[]> {
      const r = await call<{ data: Json[] }>(request, 'GET', p3(EP3.listHkTasks, hk), {
        session: hk,
        query: { date },
      });
      if (r.status !== 200) return [];
      return r.body.data.filter(
        (t) =>
          t.type === 'minibar_refill' && t.roomId === roomId && t.reservationId === reservationId,
      );
    }
    async function hkDone(
      request: APIRequestContext,
      hk: StaffSession,
      id: string,
      day: string,
      hhmm: string,
    ) {
      const [h, m] = hhmm.split(':').map(Number) as [number, number];
      for (const [action, add] of [
        ['start', 0],
        ['complete', 1],
      ] as const) {
        const at = `${String(h).padStart(2, '0')}:${String(m + add).padStart(2, '0')}`;
        const r = await call<Json & ProblemFields>(
          request,
          'POST',
          `/v1/properties/${propertyIdOf(hk)}/hk-tasks/${id}/actions/${action}`,
          { session: hk, idempotencyKey: true, body: { performedAt: vnTime(day, at) } },
        );
        expect(r.status, `HK ${action} ${id}: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
      }
    }
    /**
     * Ví dụ của DOM: 202 (bia 35.000 định mức 2, snack 30.000 định mức 1), ở 3 đêm. D+1 B14 sự cố sang căn cùng nhóm,
     * đếm tủ căn gốc dùng 2 bia (70.000) → việc T1 "2 bia"; D+2 đếm tủ căn tạm (không dùng), B14 về căn gốc khi T1 chưa
     * xong → kỳ `carry` (mốc bia 0, snack 1), T1 giữ mở.
     */
    async function r9Base(request: APIRequestContext, withFoc = false) {
      return precondition('ví dụ DOM R9: đi rồi về căn gốc khi T1 chưa xong', async () => {
        const D = virtualDay(realToday, 4);
        await startDay(request, D, '14:00');
        const k0 = await people(request);
        const [origin, other] = sameGroupPairs(await vacantRooms(request, k0), 1)[0]!;
        const st = await inHouse(request, k0.c, k0.fd, { room: origin, arrival: D, nights: 3 });
        const d1 = addDays(D, 1);
        let k = await moveTo(request, d1, '10:00');
        await b14(request, k, st, other, d1, 'property_fault');
        await counted(
          request,
          k.fd,
          st.res.id,
          { bia: 2 },
          { roomId: origin.id },
          'đếm tủ căn gốc',
        );
        const focId = withFoc ? await foc(request, k, st, 'bia', 2 * price('bia')) : null;
        const hk = await sessionOrSkip(request, 'qa.hk');
        const t1 = (await refillTasksOf(request, hk, d1, origin.id, st.res.id))[0];
        expect(t1, 'việc T1 bổ sung 2 bia').toBeTruthy();
        const d2 = addDays(D, 2);
        k = await moveTo(request, d2, '10:00');
        await counted(request, k.fd, st.res.id, {}, { roomId: other.id }, 'đếm tủ căn tạm');
        await b14(request, k, st, origin, d2, 'property_fault');
        return { D, d1, d2, d3: addDays(D, 3), k, st, origin, t1Id: String(t1!.id), focId };
      });
    }

    test('TC-L4-127 (A) BR-703-02 r9_16 (DOM R9 sửa): về căn gốc khi việc bổ sung T1 chưa xong → T1 GIỮ MỞ (không hủy); khách ăn 1 snack → B18 đếm: dòng mới 30.000, minibar 100.000; sau B18 có T1 (2 bia) + T2 (1 snack)', async ({
      request,
    }) => {
      knownBug('BUG-R2-144');
      needClock('TC-L4-127');
      const { d2, d3, st, origin, t1Id } = await r9Base(request);
      const hk = await sessionOrSkip(request, 'qa.hk');
      expect
        .soft((await hkTask(request, hk, t1Id, [d2]))?.status, 'T1 giữ mở sau khi vào lại')
        .toBe('open');
      const k = await moveTo(request, d3, '09:00');
      await counted(
        request,
        k.fd,
        st.res.id,
        { snack: 1 },
        { roomId: origin.id, mocs: { snack: 1 } },
      );
      const f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(minibarGross(f), 'minibar 100.000').toBe(2 * price('bia') + price('snack'));
      await settle(request, k, st, '09:00', 2 * price('bia') + price('snack'));
      const hk2 = await sessionOrSkip(request, 'qa.hk');
      const open = [...(await refillTasksOf(request, hk2, d3, origin.id, st.res.id))].filter(
        (t) => t.status === 'open',
      );
      expect.soft(new Set(open.map((t) => t.id)).size, 'T1 + T2 mở sau B18').toBe(2);
    });

    test('TC-L4-128 (A) BR-703-02 r9_16b: HK xong T1 khi khách đã vào lại → kỳ `refill`, mốc = số theo hệ thống + số nạp (bia 0 + 2, snack 1 + 0); B18 đếm còn bia 1, snack 0 → dòng 35.000 + 30.000, minibar 135.000, dòng 70.000 giữ', async ({
      request,
    }) => {
      knownBug('BUG-R2-144');
      needClock('TC-L4-128');
      const { d2, d3, st, origin, t1Id } = await r9Base(request);
      const hk = await sessionOrSkip(request, 'qa.hk');
      await hkDone(request, hk, t1Id, d2, '10:01');
      const k = await moveTo(request, d3, '09:00');
      const t = await std(request, k.fd, st.res.id, origin.id);
      const moc = (code: string) =>
        t.body.items.find((i) => i.itemId === idByCode.get(code))?.standardQty;
      expect.soft(moc('bia'), 'mốc bia 0 + 2').toBe(2);
      expect.soft(moc('snack'), 'mốc snack 1 + 0').toBe(1);
      await counted(
        request,
        k.fd,
        st.res.id,
        { bia: 1, snack: 1 },
        { roomId: origin.id, mocs: { bia: 2, snack: 1 } },
      );
      const f = await getFolio(request, k.fd, st.res.folioId!);
      expect
        .soft(
          itemLines(f, 'bia')
            .map((l) => l.amountVnd)
            .sort(),
          'bia 70.000 giữ + 35.000',
        )
        .toEqual([price('bia'), 2 * price('bia')]);
      expect.soft(minibarGross(f), 'minibar 135.000').toBe(3 * price('bia') + price('snack'));
      await settle(request, k, st, '09:00', 3 * price('bia') + price('snack'));
    });

    test('TC-L4-129 (A) BR-703-02 r9_16c (chống tính trùng): ngày đi 09:00 HK đếm snack còn 0 (30.000, kỳ `carry`); 09:05 HK xong T1 → mốc bia 2, snack bỏ khỏi lần nạp; 11:00 B18 đếm lại bia 2/2 → không dòng mới, minibar 100.000 (không 130.000)', async ({
      request,
    }) => {
      knownBug('BUG-R2-144');
      needClock('TC-L4-129');
      const { d3, st, origin, t1Id } = await r9Base(request);
      let k = await moveTo(request, d3, '09:00');
      const hk = await sessionOrSkip(request, 'qa.hk');
      await counted(
        request,
        hk,
        st.res.id,
        { snack: 1 },
        { roomId: origin.id, mocs: { snack: 1 } },
        'HK đếm 09:00',
      );
      await hkDone(request, hk, t1Id, d3, '09:01');
      k = await moveTo(request, d3, '11:00');
      await counted(
        request,
        k.fd,
        st.res.id,
        { bia: 0 },
        { roomId: origin.id, mocs: { bia: 2 } },
        'B18 đếm lại 11:00',
      );
      const f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(minibarGross(f), 'minibar 100.000').toBe(2 * price('bia') + price('snack'));
      await settle(request, k, st, '11:00', 2 * price('bia') + price('snack'));
    });

    test('TC-L4-130 (A) BR-703-02 r9_18: B13 gia hạn sau lần đếm dùng 2 bia → sinh việc T1 (2 bia) ngay; (a) HK chưa nạp → B18 đếm bia 0, snack 1 → 70.000; (b) HK đã nạp → mốc bia 2 → đếm bia 2, snack 1 → vẫn 70.000', async ({
      request,
    }) => {
      knownBug('BUG-R2-144');
      needClock('TC-L4-130');
      const { D, sa, sb } = await precondition('hai khách ở 1 đêm', async () => {
        const D = virtualDay(realToday, 3);
        await startDay(request, D, '14:00');
        const k0 = await people(request);
        const [ra, rb] = (await vacantRooms(request, k0)).slice(0, 2) as [Room, Room];
        const sa = await inHouse(request, k0.c, k0.fd, { room: ra, arrival: D, nights: 1 });
        const sb = await inHouse(request, k0.c, k0.fd, { room: rb, arrival: D, nights: 1 });
        return { D, sa, sb };
      });
      const d1 = addDays(D, 1);
      let k = await moveTo(request, d1, '09:00');
      const hk = await sessionOrSkip(request, 'qa.hk');
      for (const st of [sa, sb]) {
        await counted(request, k.fd, st.res.id, { bia: 2 }, {}, 'đếm ngày đi');
        const cur = await getReservation(request, k.fd, st.res.id);
        const ext = await call<ProblemFields>(
          request,
          'POST',
          p3(EP3.extendStay, k.fd, { reservationId: st.res.id }),
          {
            session: k.fd,
            idempotencyKey: true,
            ifMatch: versionTag(cur.body.version),
            body: { nights: 1 },
          },
        );
        expect(ext.status, `B13: ${JSON.stringify(ext.body).slice(0, 200)}`).toBe(200);
        const tasks = await refillTasksOf(request, hk, d1, st.room.id, st.res.id);
        expect.soft(tasks.length, 'B13 sinh việc bổ sung T1 ngay').toBe(1);
        expect
          .soft(JSON.stringify(tasks[0]?.refillItems ?? []), 'T1 = 2 bia')
          .toContain(idByCode.get('bia')!);
      }
      const tb = (await refillTasksOf(request, hk, d1, sb.room.id, sb.res.id))[0];
      if (tb) await hkDone(request, hk, String(tb.id), d1, '09:01');
      k = await moveTo(request, addDays(D, 2), '09:00');
      await counted(
        request,
        k.fd,
        sa.res.id,
        {},
        {},
        '(a) HK chưa nạp – kỳ carry, bia mốc 0 không còn trong tủ',
      );
      await counted(request, k.fd, sb.res.id, {}, { mocs: { bia: 2 } }, '(b) HK đã nạp');
      for (const st of [sa, sb]) {
        const f = await getFolio(request, k.fd, st.res.folioId!);
        expect.soft(minibarGross(f), `${st.room.roomNo}: minibar 70.000`).toBe(2 * price('bia'));
      }
      const dueOf = async (st: Stay) => {
        const s0 = await checkoutSummary(request, k.fd, st.res.id, { checkoutTime: '09:00' });
        return Number((s0.body as unknown as Json).amountDueAtCheckoutVnd ?? s0.body.balanceDueVnd);
      };
      await settle(request, k, sa, '09:00', await dueOf(sa));
      await settle(request, k, sb, '09:00', await dueOf(sb));
    });

    test('TC-L4-131 (A) BR-703-02 r9_t: bia 2 FOC 100 % (ròng 0) vẫn là lần đếm "có tính tiền" (xét số lượng) → về căn gốc mở kỳ `carry` (mốc bia 0); khách không dùng thêm → B18 không dòng mới: minibar 70.000, FOC 70.000, ròng 0', async ({
      request,
    }) => {
      needClock('TC-L4-131');
      const { d3, st, origin, focId } = await r9Base(request, true);
      const k = await moveTo(request, d3, '09:00');
      const t = await std(request, k.fd, st.res.id, origin.id);
      expect
        .soft(
          t.body.items.find((i) => i.itemId === idByCode.get('bia'))?.standardQty ?? 0,
          'kỳ carry: mốc bia 0 (món mốc 0 không còn trong tủ)',
        )
        .toBe(0);
      await counted(request, k.fd, st.res.id, {}, { roomId: origin.id });
      const f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(minibarGross(f), 'minibar 70.000').toBe(2 * price('bia'));
      expect.soft(reductions(f), 'FOC 70.000').toBe(2 * price('bia'));
      expect.soft((await approvalById(request, k.owner, focId!)).focState).toBe('applied');
      await settle(request, k, st, '09:00', 0);
    });
  },
);
