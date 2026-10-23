/**
 * R3-Q30 fuzz – generator + runner (QA test plan `rounds/round-03/qa/s1-test-plan.md` mục 3).
 *
 * - Ops are DATA (seeded PRNG, `mulberry32`): a chain is replayable from (family, seed) and the shrinker replays a
 *   shorter op list on a fresh stay. Picks ("which line", "which receipt") are indices resolved against the live
 *   state at run time, modulo what exists – deterministic for a given state.
 * - Every money step goes through the real HTTP app (`test/integration/s438-r8/fixture.ts`: feature app on real
 *   PostgreSQL, fake clock, real J15 unit, folio-lock holder to force race orders). FAKE data only.
 * - After EVERY step: raw rows → `refLedger` (independent) + API view → invariants I1–I16. Each step is one JSONL
 *   record in `$FUZZ_LOG_DIR/<run>/<family>-<seed>.jsonl` (request, outcome, clock, raw rows, ref, code view,
 *   violations) – the critic reads THESE files, not the summary (mục 3.5).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Fx } from '../integration/s438-r8/fixture';
import { addDays, outcome } from '../integration/s438-r8/fixture';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import { TEST_PASSWORD } from '../helpers/feature-app';
import { type CodeView, type Gates, type StepCtx, type Violation, check } from './invariants';
import { type RawFolio, readRaw, refView } from './ref-ledger';

// ───────────────────────── PRNG ─────────────────────────
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export type Rng = ReturnType<typeof mulberry32>;
const pick = <T>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
const int = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

// ───────────────────────── ops ─────────────────────────
export type Who = 'fd' | 'lead' | 'mgr' | 'mgr2' | 'owner' | 'sal';
export type AmountMode =
  'small' | 'O' | 'W' | 'basis' | 'basis+1' | 'halfBasis' | 'all' | 'over' | 'random';
export type Op =
  | { k: 'advance'; minutes: number }
  | { k: 'late'; amountVnd: number }
  | { k: 'collect'; amount: AmountMode; who: Who }
  | { k: 'reverse'; receipt: number; who: Who }
  | { k: 'writeOff'; line: number; amount: AmountMode; who: Who }
  | { k: 'decide'; req: number; verb: 'approve' | 'reject'; who: Who }
  | { k: 'cancel'; req: number; who: Who }
  | {
      k: 'a32';
      line: number;
      mode: 'raise' | 'lower' | 'void';
      amount: AmountMode;
      who: Who;
      nightOnly?: boolean;
    }
  | { k: 'j15' }
  | { k: 'race'; a: Op; b: Op; bFirst: boolean }
  // in-house ops (FZ-12: BR-433 (d) before B18, FB-09 observation)
  | { k: 'charge'; amountVnd: number }
  | { k: 'foc'; line: number; amount: AmountMode; who: Who }
  | { k: 'moveRoom'; up: boolean }
  | { k: 'extend'; rateUpBp: number }
  | { k: 'checkout'; debt: boolean }
  // ARC 0.3.8 addendum 3 (FUZZ-01): credit after check-out and its refund path
  | { k: 'qrLate'; extraVnd: number } // QR paid late, above what is due, a person confirms it (K11-06)
  | { k: 'sysCredit'; extraVnd: number } // a receipt with no person (stand-in: no such endpoint exists yet)
  | { k: 'refundReq'; who: Who } // FD+ createRefundRequest on a settled folio for the unhandled credit
  | { k: 'refundApprove'; req: number; who: Who }
  | { k: 'refundPay'; req: number; who: Who };

export type Family =
  'FZ-01' | 'FZ-02' | 'FZ-06' | 'FZ-07' | 'FZ-08' | 'FZ-09' | 'FZ-10' | 'FZ-11' | 'FZ-12';

/**
 * Families of the test plan mục 3.3 built in this harness. FZ-03 (night-branch FOC in stay), FZ-04 (child
 * bookings B9a / OTA extension), FZ-05 (long stay) need in-house fixtures – listed in `NOT_BUILT` and reported.
 * FZ-09/10/11 are the SEC cases of `reviews/s1-SEC-on-BE-B.md` ("Ca QA phải đưa vào fuzz" #1–#3); #4 is I13.
 */
export const FAMILIES: Record<
  Family,
  { title: string; be83: boolean; start: StartKind; weights: Partial<Record<Op['k'], number>> }
> = {
  'FZ-01': {
    title: 'one short-stay folio, every op',
    be83: false,
    start: 'mixed',
    weights: {
      advance: 3,
      late: 2,
      collect: 2,
      reverse: 2,
      writeOff: 2,
      decide: 2,
      cancel: 1,
      a32: 3,
      j15: 1,
      race: 1,
      qrLate: 1,
      sysCredit: 1,
      refundReq: 1,
      refundApprove: 1,
      refundPay: 1,
    },
  },
  'FZ-02': {
    title: 'pairwise races (≥ 30 % of steps; SEC D.3 a–c pairs)',
    be83: false,
    start: 'mixed',
    weights: {
      advance: 2,
      late: 1,
      collect: 1,
      reverse: 1,
      writeOff: 1,
      decide: 1,
      a32: 2,
      j15: 1,
      race: 5,
      qrLate: 1,
      refundApprove: 1,
    },
  },
  'FZ-06': {
    title: 'two organisations in parallel – no number leaks across',
    be83: false,
    start: 'mixed',
    weights: {
      advance: 2,
      late: 2,
      collect: 2,
      reverse: 2,
      writeOff: 2,
      decide: 1,
      a32: 2,
      j15: 1,
    },
  },
  'FZ-07': {
    title: 'closed folio: reversal ‖ debt collection (RD), only three money paths (I11)',
    be83: false,
    start: 'closed',
    weights: { advance: 1, collect: 3, reverse: 3, writeOff: 2, decide: 1, a32: 2, race: 3 },
  },
  'FZ-08': {
    title: 'debt written before 0076 (210)',
    be83: false,
    start: 'pre0076',
    weights: {
      advance: 3,
      late: 2,
      collect: 2,
      reverse: 2,
      writeOff: 2,
      decide: 2,
      a32: 2,
      j15: 1,
      race: 1,
    },
  },
  'FZ-09': {
    title: 'split write-offs + ESC-026 (SEC B.5 #1–#4)',
    be83: true,
    start: 'bigDebt',
    weights: { advance: 1, writeOff: 6, decide: 3, cancel: 1, collect: 1, race: 3 },
  },
  'FZ-10': {
    title: 'limit basis raised by A32 between MGR write-offs (FB-R3-SEC-BE-B-07, I16)',
    be83: true,
    start: 'bigDebt',
    weights: { a32: 6, writeOff: 5, decide: 2, collect: 1, advance: 1, race: 1 },
  },
  'FZ-11': {
    title: 'void the line carrying a write-off, then write off again (SEC #3)',
    be83: true,
    start: 'bigDebt',
    weights: { writeOff: 4, a32: 4, decide: 2, collect: 1, late: 1, advance: 1, race: 1 },
  },
  'FZ-12': {
    title:
      'in house → B18: A31/A32 on nights, room move up/back, extend at a typed rate, FOC on other keys (I16 before/after B18, FB-09 observed)',
    be83: true,
    start: 'inHouse',
    weights: {
      a32: 4,
      charge: 3,
      foc: 5,
      moveRoom: 2,
      extend: 2,
      checkout: 1,
      writeOff: 2,
      decide: 2,
      advance: 1,
    },
  },
};
export const NOT_BUILT = [
  'FZ-03 FOC qua nhánh dòng đêm khi đang ở (S4-35) – FZ-12 phủ FOC trên khóa khác, chưa phủ FOC trên chính dòng đêm',
  'FZ-04 công nợ trên đơn con (B9a, gia hạn OTA) – cần fixture B9a',
  'FZ-05 đơn dài hạn (cơ sở = giá đêm quy đổi BR-102) – cần fixture dài hạn',
];

export type StartKind = 'mixed' | 'closed' | 'pre0076' | 'bigDebt' | 'inHouse';

function genOp(r: Rng, fam: Family, depth = 0): Op {
  const w = FAMILIES[fam].weights;
  const keys = (Object.keys(w) as Op['k'][]).filter((k) => depth === 0 || k !== 'race');
  const total = keys.reduce((s, k) => s + (w[k] ?? 0), 0);
  let x = r() * total;
  let k: Op['k'] = keys[0]!;
  for (const kk of keys) {
    x -= w[kk] ?? 0;
    if (x <= 0) {
      k = kk;
      break;
    }
  }
  const amount = (): AmountMode =>
    pick(r, [
      'small',
      'O',
      'W',
      'basis',
      'basis+1',
      'halfBasis',
      'halfBasis',
      'all',
      'over',
      'random',
    ] as const);
  const subOwner = (): Who => pick(r, ['mgr', 'mgr', 'mgr2', 'owner', 'fd'] as const);
  switch (k) {
    case 'advance':
      // 0–6 h, biased to cross 00:00 / 06:00 / the window edge
      return { k, minutes: pick(r, [0, 1, 30, 59, 60, 61, 120, 240, 360, int(r, 0, 360)]) };
    case 'late':
      return { k, amountVnd: pick(r, [35_000, 70_000, 140_000, 300_000, 834_000]) };
    case 'collect':
      return { k, amount: amount(), who: pick(r, ['fd', 'fd', 'mgr'] as const) };
    case 'reverse':
      return { k, receipt: int(r, 0, 9), who: pick(r, ['mgr', 'owner', 'fd'] as const) };
    case 'writeOff':
      return { k, line: int(r, 0, 9), amount: amount(), who: subOwner() };
    case 'decide':
      return {
        k,
        req: int(r, 0, 9),
        verb: r() < 0.7 ? 'approve' : 'reject',
        who: pick(r, ['owner', 'owner', 'mgr'] as const),
      };
    case 'cancel':
      return { k, req: int(r, 0, 9), who: pick(r, ['mgr', 'owner'] as const) };
    case 'a32':
      return {
        k,
        line: int(r, 0, 9),
        mode: pick(
          r,
          fam === 'FZ-10'
            ? (['raise', 'raise', 'lower'] as const)
            : (['raise', 'lower', 'void'] as const),
        ),
        amount: amount(),
        who: subOwner(),
        ...(fam === 'FZ-10' ? { nightOnly: true } : {}),
      };
    case 'j15':
      return { k };
    case 'race':
      return { k, a: genOp(r, fam, 1), b: genOp(r, fam, 1), bFirst: r() < 0.5 };
    case 'charge':
      return { k, amountVnd: pick(r, [100_000, 300_000, 600_000, 1_500_000, 3_000_000]) };
    case 'foc':
      return {
        k,
        line: int(r, 0, 9),
        amount: amount(),
        who: pick(r, ['fd', 'lead', 'mgr', 'mgr'] as const) as Who,
      };
    case 'moveRoom':
      return { k, up: r() < 0.6 };
    case 'extend':
      return { k, rateUpBp: pick(r, [0, 2_000, 5_000, 9_900]) };
    case 'checkout':
      return { k, debt: r() < 0.6 };
    case 'qrLate':
      return { k, extraVnd: pick(r, [10_000, 50_000, 300_000, 900_000]) };
    case 'sysCredit':
      return { k, extraVnd: pick(r, [20_000, 150_000, 700_000]) };
    case 'refundReq':
      return { k, who: pick(r, ['fd', 'lead', 'mgr'] as const) as Who };
    case 'refundApprove':
      return {
        k,
        req: int(r, 0, 9),
        who: pick(r, ['mgr', 'mgr2', 'owner', 'lead', 'fd'] as const) as Who,
      };
    case 'refundPay':
      return { k, req: int(r, 0, 9), who: pick(r, ['fd', 'lead', 'mgr'] as const) as Who };
  }
}

export function genChain(fam: Family, seed: number): Op[] {
  const r = mulberry32(seed);
  const n = int(r, 20, 60);
  return Array.from({ length: n }, () => genOp(r, fam));
}

// ───────────────────────── execution ─────────────────────────
type Stay = Awaited<ReturnType<Fx['checkedOutStay']>>;
type Res = Awaited<ReturnType<ReturnType<Fx['collect']>>>;

export interface ChainResult {
  family: Family;
  seed: number;
  steps: number;
  violations: Array<Violation & { step: number; op: string }>;
  http5xx: number;
  deadlocks: number;
  log: string;
}

const MIN = 60_000;

export class Runner {
  private nowMs = 0;
  private legacy = false;
  private ambiguousSeen = false;
  private explicitDue: string[] = [];
  private basisAtCreate = new Map<string, number>();
  /** in-house chains: current room, home room, arrival/departure (FZ-12) */
  private stay: { home: string; room: string; arrival: string; departure: string } | null = null;
  private static inHouseSeq = 0;
  constructor(
    private x: Fx,
    private gates: Gates,
    private logFile: string,
  ) {}

  private at(ms: number) {
    this.nowMs = ms;
    return this.x.at(new Date(ms).toISOString());
  }

  async start(kind: StartKind, r: Rng): Promise<{ s: Stay; b18DueAt: string | null }> {
    const x = this.x;
    let s: Stay;
    let b18DueAt: string | null = null;
    this.stay = null;
    this.explicitDue = [];
    this.basisAtCreate = new Map();
    if (kind === 'inHouse') {
      const k = Runner.inHouseSeq++;
      const home = (['101', '202', '302'] as const)[k % 3]!;
      const arrival = addDays('2028-01-03', 4 * k);
      const departure = addDays(arrival, 2);
      await x.at(`${addDays(arrival, -10)}T10:00:00+07:00`);
      const body = {
        roomId: x.ids.rooms[home],
        channelId: x.ids.channels.direct,
        directSource: 'zalo_phone',
        adults: 2,
        bookerGuestId: x.guest,
        paymentModel: 'direct',
        arrivalDate: arrival,
        departureDate: departure,
      };
      let res = await x.c.fd!.send('POST', x.url('/reservations'), body);
      if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT')
        res = await x.c.fd!.send('POST', x.url('/reservations'), {
          ...body,
          initialPayment: {
            type: 'deposit',
            method: 'cash',
            amountVnd: res.json().depositRequiredVnd,
          },
        });
      if (res.statusCode !== 201) throw new Error(`inHouse create ${res.statusCode} ${res.body}`);
      const b = res.json();
      await x.at(`${arrival}T15:00:00+07:00`);
      await x.q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [x.ids.rooms[home]]);
      const due = (await x.folio(b.folioId)).totals.balanceDueVnd as number;
      if (due > 0) await x.pay(b.folioId, { type: 'charge', method: 'cash', amountVnd: due });
      const ci = await x.act(b.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '15:00',
      });
      if (ci.statusCode !== 200) throw new Error(`inHouse check-in ${ci.statusCode} ${ci.body}`);
      this.nowMs = new Date(`${arrival}T16:00:00+07:00`).getTime();
      await this.at(this.nowMs);
      this.stay = { home, room: home, arrival, departure };
      this.legacy = false;
      this.ambiguousSeen = false;
      return {
        s: { ...b, departure, transferId: '', cashId: '', cashVnd: 0, billNo: '' } as Stay,
        b18DueAt: null,
      };
    }
    if (kind === 'bigDebt') {
      s = await x.checkedOutStay({
        b18Debt: { unpaid: pick(r, [1_000_000, 5_000_000]), finalPay: 0 },
      });
      b18DueAt = (
        await x.q(
          `SELECT max(occurred_at) AS t FROM audit_event WHERE action = 'reservation.debt_on_checkout' AND entity_id = $1`,
          [s.id],
        )
      )[0]?.t;
      b18DueAt = b18DueAt ? new Date(b18DueAt).toISOString() : null;
    } else {
      const big = kind === 'mixed' && r() < 0.5 ? pick(r, [500_000, 2_000_000]) : 0;
      s = await x.checkedOutStay(big ? { big } : {});
    }
    // fixture leaves the clock at departure 15:00
    this.nowMs = new Date(`${s.departure}T15:00:00+07:00`).getTime();
    if (kind === 'pre0076' || kind === 'closed') {
      // a real debt first (G-4 reversal of the 100.000 transfer)
      const rv = await x.reverse(s.transferId)();
      if (rv.statusCode !== 200)
        throw new Error(`start ${kind}: reverse ${rv.statusCode} ${rv.body}`);
    }
    this.legacy = kind === 'pre0076';
    this.ambiguousSeen = false;
    if (kind === 'pre0076') {
      await x.q(
        `UPDATE reservation SET debt_opened_at = NULL, debt_recorded_vnd = 0, debt_base_vnd = 0 WHERE folio_id = $1`,
        [s.folioId],
      );
    }
    if (kind === 'closed') {
      await this.at(this.nowMs + 21 * 60 * MIN); // past D+1 11:00
      await x.runJ15();
    }
    return { s, b18DueAt };
  }

  private accountSet = false;
  /** The VietQR receiving account (needed by the QR op): set once per fixture, effective from the next day. */
  async ensureAccount(): Promise<void> {
    if (this.accountSet) return;
    const [has] = await this.x
      .q(`SELECT count(*)::int AS n FROM config_parameter WHERE key = 'payment_receiving_account'`)
      .catch(() => [{ n: 0 }]);
    if (has?.n > 0) {
      this.accountSet = true;
      return;
    }
    const keep = this.nowMs;
    await this.x.at('2026-10-14T09:00:00+07:00');
    await this.x.c.owner!.send('PUT', this.x.url('/parameters/payment_receiving_account'), {
      value: { bankBin: '970407', accountNo: '1903123456789', accountName: 'OTTIMO TEST' },
      effectiveFrom: '2026-10-15',
      reason: 'Tài khoản nhận thử nghiệm',
      reauth: { authMethod: 'password', secret: TEST_PASSWORD },
    });
    await this.at(keep);
    this.accountSet = true;
  }

  /** A refund proof attachment (memory blob store – BLOBSTORE_PROVIDER=memory in the fuzz entry). */
  private async proof(s: Stay): Promise<string | undefined> {
    try {
      const svc = this.x.fa.app.get(AttachmentService, { strict: false });
      const fd = this.x.t.users.fd!;
      return await this.x.db.withContext(
        { ...this.x.t.ctx(), userId: fd.id, actorType: 'user' } as any,
        async (tx: any) =>
          (
            await svc.upload(
              tx,
              { userId: fd.id, roles: fd.roles },
              { purpose: 'refund_proof', reservationId: s.id },
              { data: Buffer.from('fake-jpeg-bytes'), mime: 'image/jpeg', width: 1, height: 1 },
            )
          ).id,
      );
    } catch {
      return undefined;
    }
  }

  roleOf(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [, u] of Object.entries(this.x.t.users)) out[u.id] = (u.roles ?? [])[0] ?? '';
    return out;
  }

  private async raw(s: Stay): Promise<RawFolio> {
    return readRaw(this.x.q, s.folioId, s.id);
  }

  async codeView(s: Stay): Promise<CodeView> {
    const f = await this.x.folio(s.folioId);
    const od = await this.x.openDebtOf(s);
    return {
      dueVnd: f.totals.balanceDueVnd,
      creditVnd: f.totals.creditVnd,
      folioStatus: f.status,
      openDebtVnd: od ? od.openDebtVnd : 0,
      openDebtDueDate: od ? (od.dueDate as string) : null,
      unhandledCreditVnd: f.totals.unhandledCreditVnd ?? 0,
    };
  }

  private liveLines(raw: RawFolio, nightOnly = false) {
    const reversed = new Set(raw.lines.map((l) => l.reversalOfId).filter(Boolean));
    return raw.lines.filter(
      (l) =>
        l.lineState === 'posted' &&
        !l.reversalOfId &&
        !reversed.has(l.id) &&
        l.amountVnd > 0 &&
        l.category !== 'foc' &&
        (!nightOnly || l.category === 'room' || l.category === 'late_fee_as_night'),
    );
  }

  private amountOf(mode: AmountMode, raw: RawFolio, s: Stay, linePrice = 0): number {
    const ref = refView(raw, new Date(this.nowMs).toISOString());
    const B = Math.max(0, ref.B);
    switch (mode) {
      case 'small':
        return 1_000;
      case 'O':
        return Math.max(1_000, ref.O);
      case 'W':
        return Math.max(1_000, ref.W);
      case 'basis':
        return Math.max(1_000, ref.basisVnd);
      case 'basis+1':
        return ref.basisVnd + 1_000;
      case 'halfBasis':
        // several of these on different keys cross the ESC-026 threshold (critic M-3: I13 never exercised)
        return Math.max(1_000, Math.round((ref.basisVnd * 0.6) / 1_000) * 1_000);
      case 'all':
        return Math.max(1_000, B);
      case 'over':
        return B + 50_000;
      case 'random':
        // deterministic for a given state (replayable): 1.000 … 997.000 from the line price / B
        return 1_000 * (1 + (Math.floor((linePrice || B || 100_000) / 1_000) % 997));
    }
    void s;
  }

  /** Build the request of an op against the live state; returns a thunk (for races) + its context. */
  private async prepare(
    op: Op,
    s: Stay,
  ): Promise<{ run: () => Promise<Res | null>; ctx: Partial<StepCtx>; label: string }> {
    const x = this.x;
    const raw = await this.raw(s);
    const nowIso = new Date(this.nowMs).toISOString();
    const ref = refView(raw, nowIso);
    switch (op.k) {
      case 'advance':
        return {
          label: `advance ${op.minutes}m`,
          ctx: {},
          run: async () => {
            await this.at(this.nowMs + op.minutes * MIN);
            return null;
          },
        };
      case 'late': {
        return {
          label: `late +${op.amountVnd}`,
          ctx: {},
          run: async () =>
            x.c.fd!.send('POST', x.url(`/folios/${s.folioId}/lines`), {
              category: 'fnb',
              description: 'Phát sinh sau trả phòng',
              quantity: 1,
              unitPriceVnd: op.amountVnd,
              serviceDate: s.departure,
            }) as Promise<Res>,
        };
      }
      case 'collect': {
        const amt = this.amountOf(op.amount, raw, s);
        return {
          label: `collect ${amt} by ${op.who}`,
          ctx: raw.folio.status === 'settled' ? { humanMoneyOnSettled: true } : {},
          run: () => x.collect(s, amt, 'cash', op.who)(),
        };
      }
      case 'reverse': {
        const live = raw.payments.filter(
          (p) => p.status === 'succeeded' && !p.reversalOfId && p.type !== 'refund',
        );
        if (!live.length) return { label: 'reverse (none)', ctx: {}, run: async () => null };
        const p = live[op.receipt % live.length]!;
        return {
          label: `reverse ${p.amountVnd} by ${op.who}`,
          ctx: {},
          run: () => x.reverse(p.id, 'Chuyển khoản không về', op.who)(),
        };
      }
      case 'writeOff': {
        const lines = this.liveLines(raw);
        if (!lines.length) return { label: 'writeOff (no line)', ctx: {}, run: async () => null };
        const l = lines[op.line % lines.length]!;
        const amt = this.amountOf(op.amount, raw, s, l.unitPriceVnd);
        return {
          label: `writeOff ${amt} on ${l.category} by ${op.who}`,
          ctx: { writeOff: { appliedVnd: null, oBefore: ref.O } },
          run: () => x.writeOff(s, l.id, amt, { who: op.who })(),
        };
      }
      case 'decide':
      case 'cancel': {
        const pend = raw.approvals.filter(
          (a) => a.status === 'pending' || a.status === 'escalated',
        );
        if (!pend.length) return { label: `${op.k} (none)`, ctx: {}, run: async () => null };
        const a = pend[op.req % pend.length]!;
        if (op.k === 'cancel')
          return {
            label: `cancel ${a.amountVnd} by ${op.who}`,
            ctx: {},
            run: () => x.cancelReq(a.id, op.who)(),
          };
        return {
          label: `${op.verb} ${a.amountVnd} by ${op.who}`,
          ctx:
            a.reasonCode === 'debt_write_off' && op.verb === 'approve'
              ? { writeOff: { appliedVnd: null, oBefore: ref.O } }
              : {},
          run: () => x.decide(a.id, op.verb, op.who)(),
        };
      }
      case 'a32': {
        const lines = this.liveLines(raw, op.nightOnly);
        if (!lines.length) return { label: 'a32 (no line)', ctx: {}, run: async () => null };
        const l = lines[op.line % lines.length]!;
        const by = Math.min(
          this.amountOf(op.amount, raw, s, l.unitPriceVnd),
          op.mode === 'lower' ? Math.max(0, l.unitPriceVnd - 1_000) : Number.MAX_SAFE_INTEGER,
        );
        const body =
          op.mode === 'void'
            ? { voidLine: true, reason: 'Ghi nhầm khoản' }
            : {
                newUnitPriceVnd: op.mode === 'raise' ? l.unitPriceVnd + by : l.unitPriceVnd - by,
                reason: 'Sửa giá',
              };
        const reduce = op.mode === 'void' ? l.amountVnd : op.mode === 'lower' ? by : 0;
        return {
          label: `a32 ${op.mode} ${op.mode === 'void' ? l.amountVnd : by} on ${l.category} by ${op.who}`,
          ctx:
            reduce > 0 && raw.folio.status !== 'open'
              ? {
                  humanMoneyOnSettled: raw.folio.status === 'settled',
                  a32: {
                    reduceVnd: reduce,
                    wBefore: ref.W,
                    oBefore: ref.O,
                    windowOverBefore: ref.windowOver,
                    closedBefore: raw.folio.status === 'closed',
                  },
                }
              : {},
          run: () => x.adjust(s, l.id, body, undefined, op.who)(),
        };
      }
      case 'j15':
        return { label: 'J15', ctx: {}, run: () => x.j15Unit(s)() };
      case 'race':
        throw new Error('race is prepared by step()');
      case 'qrLate': {
        if (raw.folio.status !== 'settled')
          return { label: 'qrLate (not settled)', ctx: {}, run: async () => null };
        const due = Math.max(0, ref.B);
        const amt = due + op.extraVnd;
        return {
          label: `QR paid late ${amt} (due ${due}) confirmed by fd`,
          ctx: { humanMoneyOnSettled: true },
          run: async () => {
            await this.ensureAccount();
            const q = await x.c.fd!.send('POST', x.url(`/folios/${s.folioId}/vietqr`), {
              amountVnd: amt,
              ...(op.extraVnd > 0 ? { overBalanceReason: 'Khách chuyển thừa' } : {}),
            });
            if (q.statusCode !== 201) return q as Res;
            return x.c.fd!.send(
              'POST',
              x.url(`/payments/${q.json().payment.id}/actions/confirm-received`),
              {
                note: 'Tiền về muộn',
              },
            ) as Promise<Res>;
          },
        };
      }
      case 'sysCredit': {
        if (raw.folio.status !== 'settled')
          return { label: 'sysCredit (not settled)', ctx: {}, run: async () => null };
        return {
          label: `receipt with no person +${op.extraVnd} (SQL stand-in – no automatic reconciliation endpoint)`,
          ctx: {},
          run: async () => {
            const t = new Date(this.nowMs).toISOString();
            await x.q(
              `INSERT INTO payment
               SELECT (jsonb_populate_record(NULL::payment, to_jsonb(p) || jsonb_build_object(
                 'id', gen_random_uuid(), 'code', 'QA-SYS-' || substr(md5(random()::text), 1, 8),
                 'amount_vnd', $2::bigint, 'status', 'succeeded', 'method', 'bank_transfer',
                 'reconciliation', 'not_required', 'reconciled_by', NULL, 'reconciled_at', NULL, 'reversal_of_id', NULL, 'approval_request_id', NULL,
                 'note', 'QA giả lập đối soát tự động', 'created_at', $3::timestamptz,
                 'updated_at', $3::timestamptz, 'received_at', $3::timestamptz, 'version', 1))).*
                 FROM payment p
                WHERE p.folio_id = $1 AND p.type = 'charge' AND p.reversal_of_id IS NULL
                ORDER BY p.created_at LIMIT 1`,
              [s.folioId, op.extraVnd, t],
            );
            return { statusCode: 299, body: 'sql', json: () => ({}) } as unknown as Res;
          },
        };
      }
      case 'refundReq': {
        const f = await x.folio(s.folioId);
        const amt = f.totals.unhandledCreditVnd ?? 0;
        if (amt <= 0)
          return { label: 'refundReq (no unhandled credit)', ctx: {}, run: async () => null };
        return {
          label: `refund request ${amt} by ${op.who}`,
          ctx: {},
          run: () =>
            x.c[op.who]!.send('POST', x.url(`/folios/${s.folioId}/refund-requests`), {
              amountVnd: amt,
              reason: 'Tiền dư sau trả phòng',
            }) as Promise<Res>,
        };
      }
      case 'refundApprove': {
        const pend = raw.refunds.filter((r) => r.status === 'pending' || r.status === 'escalated');
        if (!pend.length) return { label: 'refundApprove (none)', ctx: {}, run: async () => null };
        const r = pend[op.req % pend.length]!;
        return {
          label: `approve refund ${r.amountVnd} by ${op.who}`,
          ctx: {},
          run: () => x.decide(r.id, 'approve', op.who)(),
        };
      }
      case 'refundPay': {
        const ok = raw.refunds.filter((r) => r.status === 'approved');
        if (!ok.length) return { label: 'refundPay (none)', ctx: {}, run: async () => null };
        const r = ok[op.req % ok.length]!;
        return {
          label: `pay refund ${r.amountVnd} cash by ${op.who}`,
          ctx: {},
          run: async () =>
            x.c[op.who]!.send(
              'POST',
              x.url(`/approval-requests/${r.id}/actions/execute-cash-refund`),
              {
                amountVnd: r.amountVnd,
                paidAt: new Date(this.nowMs).toISOString(),
                attachmentId: await this.proof(s),
              },
            ) as Promise<Res>,
        };
      }
      case 'charge':
        return {
          label: `charge +${op.amountVnd}`,
          ctx: {},
          run: () =>
            x.c.fd!.send('POST', x.url(`/folios/${s.folioId}/lines`), {
              category: 'fnb',
              description: 'Dịch vụ phát sinh',
              quantity: 1,
              unitPriceVnd: op.amountVnd,
              serviceDate: this.stay?.arrival ?? s.departure,
            }) as Promise<Res>,
        };
      case 'foc': {
        const lines = this.liveLines(raw).filter((l) => l.category !== 'room');
        if (!lines.length) return { label: 'foc (no line)', ctx: {}, run: async () => null };
        const l = lines[op.line % lines.length]!;
        const amt = Math.min(this.amountOf(op.amount, raw, s, l.unitPriceVnd), l.amountVnd);
        return {
          label: `foc ${amt} on ${l.category} ${l.amountVnd} by ${op.who}`,
          ctx: {},
          run: () => x.writeOff(s, l.id, amt, { who: op.who, reasonCode: 'service_recovery' })(),
        };
      }
      case 'moveRoom': {
        const st = this.stay;
        if (!st || raw.folio.status !== 'open')
          return { label: 'moveRoom (not in house)', ctx: {}, run: async () => null };
        const target = op.up ? (st.room === '401' ? '402' : '401') : st.home;
        if (target === st.room)
          return { label: 'moveRoom (already there)', ctx: {}, run: async () => null };
        return {
          label: `moveRoom ${st.room} → ${target}`,
          ctx: {},
          run: async () => {
            await x.q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [
              x.ids.rooms[target],
            ]);
            const body = {
              newRoomId: x.ids.rooms[target],
              effectiveDate: businessDay(this.nowMs, st.arrival),
              cause: 'guest_request',
              reason: 'Khách muốn đổi căn',
              oldRoomVacated: true,
            };
            const dry = await x.act(s.id, 'change-room', { ...body, dryRun: true }, 'mgr');
            if (dry.statusCode !== 200) return dry as Res;
            const mv = await x.act(
              s.id,
              'change-room',
              { ...body, applyDifference: true, expectedDeltaVnd: dry.json().folioDeltaVnd },
              'mgr',
            );
            if (mv.statusCode === 200) st.room = target;
            return mv as Res;
          },
        };
      }
      case 'extend': {
        const st = this.stay;
        if (!st || raw.folio.status !== 'open')
          return { label: 'extend (not in house)', ctx: {}, run: async () => null };
        const room = this.liveLines(raw, true).filter((l) => l.category === 'room');
        const base = Math.max(0, ...room.map((l) => l.unitPriceVnd));
        const typed = Math.round((base * (10_000 + op.rateUpBp)) / 10_000 / 1_000) * 1_000;
        return {
          label: `extend 1 night${op.rateUpBp ? ` typed ${typed}` : ''}`,
          ctx: {},
          run: async () => {
            const r = await x.act(s.id, 'extend', {
              nights: 1,
              ...(op.rateUpBp
                ? { nightlyRates: [{ date: st.departure, amountVnd: typed, edited: true }] }
                : {}),
            });
            if (r.statusCode === 200) st.departure = addDays(st.departure, 1);
            return r as Res;
          },
        };
      }
      case 'checkout': {
        const st = this.stay;
        if (!st || raw.folio.status !== 'open')
          return { label: 'checkout (not in house)', ctx: {}, run: async () => null };
        return {
          label: `B18${op.debt ? ' debt' : ''}`,
          ctx: {},
          run: async () => {
            const outAt = new Date(`${st.departure}T11:00:00+07:00`).getTime();
            if (this.nowMs < outAt) await this.at(outAt);
            const due = (await x.folio(s.folioId)).totals.balanceDueVnd as number;
            if (due > 0 && !op.debt)
              await x.pay(s.folioId, { type: 'charge', method: 'cash', amountVnd: due });
            if (due > 0 && op.debt) this.explicitDue.push(addDays(st.departure, 5));
            const r = await x.act(
              s.id,
              'check-out',
              {
                checkoutTime: '11:00',
                ...(due > 0 && op.debt
                  ? {
                      debt: {
                        dueDate: addDays(st.departure, 5),
                        reason: 'Công ty hẹn chuyển khoản',
                      },
                    }
                  : {}),
              },
              op.debt ? 'mgr' : 'fd',
            );
            (s as any).departure = st.departure;
            return r as Res;
          },
        };
      }
    }
  }

  async step(
    op: Op,
    s: Stay,
    stepNo: number,
    b18DueAt: string | null,
  ): Promise<{ v: Violation[]; c5: number; label: string }> {
    // one fake second per step: rows of different steps never share a timestamp, so the reference ledger can order
    // them (a debt record vs a receipt of the same instant would be ambiguous – test plan 3.2)
    await this.at(this.nowMs + 1_000);
    const before = await this.raw(s);
    const auditsBefore = before.debtAudits.length;
    let label: string;
    let ctx: Partial<StepCtx> = {};
    let results: Array<Res | null>;
    if (op.k === 'race') {
      const a = await this.prepare(op.a, s);
      const b = await this.prepare(op.b, s);
      label = `race [${a.label}] ‖ [${b.label}] ${op.bFirst ? 'B first' : 'A first'}`;
      const records = (o: Op) => o.k === 'reverse' || o.k === 'j15';
      const money = (o: Op) =>
        records(o) || o.k === 'collect' || o.k === 'writeOff' || o.k === 'decide' || o.k === 'a32';
      if ((records(op.a) && money(op.b)) || (records(op.b) && money(op.a)))
        this.ambiguousSeen = true;
      const thunks = (op.bFirst ? [b, a] : [a, b]).map(
        (p) => async () => (await p.run()) ?? ({ statusCode: 0, body: '' } as unknown as Res),
      );
      if (op.a.k === 'advance' || op.b.k === 'advance') {
        results = [];
        for (const t of thunks) results.push(await t());
      } else {
        results = await this.x.interleaved(s.folioId, thunks as any).catch(async (e: Error) => {
          // the lock-order helper could not queue a step (one op answered without touching the folio): the
          // requests already sent are NOT sent again (critic M-4) – wait for them to settle, outcomes unknown
          await new Promise((res) => setTimeout(res, 1_500));
          appendFileSync(
            this.logFile,
            `${JSON.stringify({ step: stepNo, note: `interleave fallback (no re-send): ${e.message}` })}\n`,
          );
          return [] as Array<Res | null>;
        });
      }
    } else {
      const p = await this.prepare(op, s);
      label = p.label;
      ctx = p.ctx;
      results = [await p.run()];
    }
    // the hourly J15 (scheduler model): never leave a settled folio more than 60 min past its window
    const mid = await this.raw(s);
    if (
      mid.folio.status === 'settled' &&
      mid.folio.windowUntil &&
      this.nowMs >= new Date(mid.folio.windowUntil).getTime() + 60 * MIN
    ) {
      const j = await this.x.j15Unit(s)();
      appendFileSync(
        this.logFile,
        `${JSON.stringify({ step: stepNo, scheduler: 'J15', outcome: outcome(j) })}\n`,
      );
    }
    const res = results.filter((r): r is Res => !!r && (r as any).statusCode > 0);
    const c5 = res.filter((r) => r.statusCode >= 500).length;
    const last = res[res.length - 1];
    if (ctx.writeOff && last) {
      const m = /eff (\d+)/.exec(outcome(last));
      ctx.writeOff.appliedVnd = m ? Number(m[1]) : null;
    }
    const raw = await this.raw(s);
    const nowIso = new Date(this.nowMs).toISOString();
    const ref = refView(raw, nowIso);
    for (const ap of raw.approvals)
      if (!this.basisAtCreate.has(ap.id)) this.basisAtCreate.set(ap.id, ref.basisVnd);
    const code = await this.codeView(s);
    const full: StepCtx = {
      op: label,
      status: last?.statusCode ?? 0,
      code: last ? outcome(last) : '',
      auditsBefore,
      b18ExplicitDueAt: b18DueAt,
      legacyCycle: this.legacy,
      explicitDueDates: this.explicitDue,
      basisAtCreate: this.basisAtCreate,
      ambiguousOrder: this.ambiguousSeen,
      roleOf: this.roleOf(),
      http5xx: c5 > 0,
      ...ctx,
    };
    const v = check(raw, ref, code, full, nowIso, this.gates);
    // no line ever deleted (I15 second half, BR-008)
    if (raw.lines.length < before.lines.length)
      v.push({ inv: 'I15', msg: `folio_line rows ${before.lines.length} → ${raw.lines.length}` });
    appendFileSync(
      this.logFile,
      `${JSON.stringify({
        step: stepNo,
        now: nowIso,
        op,
        label,
        outcomes: res.map((r) => ({
          status: r.statusCode,
          outcome: outcome(r),
          body: String(r.body).slice(0, 600),
        })),
        code,
        ref,
        raw,
        violations: v,
      })}\n`,
    );
    return { v, c5, label };
  }

  async chain(fam: Family, seed: number, ops?: Op[]): Promise<ChainResult & { ops: Op[] }> {
    const r = mulberry32(seed ^ 0x5eed);
    const chainOps = ops ?? genChain(fam, seed);
    const { s, b18DueAt } = await this.start(FAMILIES[fam].start, r);
    appendFileSync(
      this.logFile,
      `${JSON.stringify({ chain: { family: fam, seed, stay: s.code, ops: chainOps.length } })}\n`,
    );
    const dl0 = await this.x.deadlocks();
    const out: ChainResult['violations'] = [];
    let c5 = 0;
    for (let i = 0; i < chainOps.length; i++) {
      const { v, c5: n, label } = await this.step(chainOps[i]!, s, i, b18DueAt);
      c5 += n;
      for (const x of v) out.push({ ...x, step: i, op: label });
    }
    await new Promise((res) => setTimeout(res, 1_100)); // pg_stat snapshot refresh
    const dl = (await this.x.deadlocks()) - dl0;
    if (dl > 0)
      out.push({ inv: 'I14', msg: `deadlocks +${dl}`, step: chainOps.length, op: 'chain' });
    return {
      family: fam,
      seed,
      steps: chainOps.length,
      violations: out,
      http5xx: c5,
      deadlocks: dl,
      log: this.logFile,
      ops: chainOps,
    };
  }
}

/**
 * Shrink a failing chain: drop ops one at a time (then halves) while some violation of the same invariant remains.
 * Each try runs on a fresh stay – O(n²) chains in the worst case; capped by `budget`.
 */
export async function shrink(
  run: (ops: Op[]) => Promise<Array<{ inv: string }>>,
  ops: Op[],
  inv: string,
  budget = 40,
): Promise<Op[]> {
  let cur = ops;
  let tries = 0;
  let chunk = Math.max(1, Math.floor(cur.length / 2));
  while (chunk >= 1 && tries < budget) {
    let progressed = false;
    for (let i = 0; i + chunk <= cur.length && tries < budget;) {
      const cand = [...cur.slice(0, i), ...cur.slice(i + chunk)];
      tries++;
      const v = await run(cand);
      if (v.some((x) => x.inv === inv)) {
        cur = cand;
        progressed = true;
      } else i += chunk;
    }
    if (!progressed) chunk = Math.floor(chunk / 2);
  }
  return cur;
}

/** Business date (06:00 rollover, +07:00) of the fake clock, not before the arrival. */
function businessDay(ms: number, notBefore: string): string {
  const d = new Date(ms + 7 * 3600_000 - 6 * 3600_000).toISOString().slice(0, 10);
  return d < notBefore ? notBefore : d;
}

export function logDir(): string {
  const dir = join(
    process.env.FUZZ_LOG_DIR ?? join(__dirname, '..', '..', 'fuzz-logs'),
    // wall-clock run label only (the money steps use the fake clock)
    `run-${process.env.FUZZ_RUN_ID ?? `${process.pid}-${Math.round(performance.timeOrigin)}`}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}
