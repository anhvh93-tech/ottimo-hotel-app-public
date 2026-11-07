// v1.0.5 V5-16 Desk (US-177 AC2, AC8; BR-438; contract 0.3.13 1.20; UXD copy-v1.0.5 9.5): a front desk reduces
// directly only the lines it typed by hand itself in today's business day. Any other reduction comes back 403
// `requiredFlow: foc_request` – the adjust box says why, keeps what was typed and offers "Gửi miễn có duyệt": the waiver
// form of that line, its amount filled in (old − new, a void = the whole line, never above `foc.max`), with the reason
// "Ghi nhầm" (`entered_in_error`). Managers and owners reduce as before. DOM T-16-1, -2, -4, -7, -11; ARC T16-6…11.
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { auditReasonText, requestReasonText } from '../app/auditReason';
import { api } from '../app/api';
import { lineLabel } from '../app/folio';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { PROPERTY_ID } from '../mocks/seed';
import { FOC_REASONS, LINE_FOC_REASONS } from '../pages/stay/foc';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];
type Line =
  ReturnType<typeof mockControl.stay.folios.get> extends infer F
    ? F extends { lines: Array<infer L> }
      ? L
      : never
    : never;

const GUEST = 'Nguyễn Văn An';
const res = () => mockControl.rsv.reservations.find((r) => r.guestName === GUEST)!;
const userId = (username: string) => mockControl.db.users.find((u) => u.username === username)!.id;
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fieldRe = (key: string) => new RegExp(`^${esc(tv(key))}`);
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const DAY_MS = 86_400_000;

/**
 * A F&B line 3 × 35.000 on the open folio of Nguyễn Văn An. `by` typed it by hand (A30, `source = manual`) at
 * `postedAt`; `source: undefined` = a line the Desk wrote itself (no person typed it).
 */
function addFnb(opts: { by?: string; postedAt?: string; source?: string; id?: string } = {}): {
  r: ReturnType<typeof res>;
  line: Line;
} {
  const r = res();
  const folio = mockControl.stay.folios.get(r.folioId)!;
  const line = {
    id: opts.id ?? 'fnb-v516',
    category: 'fnb',
    description: 'fnb x3',
    labelKey: 'bill.line.fnb',
    labelParams: { text: 'Bia' },
    serviceDate: r.arrivalDate,
    quantity: 3,
    unitPriceVnd: 35_000,
    amountVnd: 105_000,
    lineState: 'posted',
    postedAt: opts.postedAt ?? new Date().toISOString(),
    postedBy: 'Hạnh',
    source: 'source' in opts ? opts.source : 'manual',
    postedByUserId: opts.by ? userId(opts.by) : undefined,
  } as Line;
  folio.lines.push(line);
  return { r, line };
}

/** Every POST body sent to a URL matching `re`. */
function capture(re: RegExp) {
  const sent: Array<Record<string, unknown>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== 'POST' || !re.test(new URL(request.url).pathname)) return;
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

/** "Điều chỉnh" on the Bia line of the open folio dialog. */
async function adjustIn(user: User, dlg: HTMLElement) {
  const row = (await within(dlg).findByText(/Bia/)).closest('tr')!;
  await user.click(within(row).getByRole('button', { name: tv('folio.adjust') }));
  return screen.findByRole('dialog', { name: /^Điều chỉnh:/ });
}

async function openAdjust(user: User) {
  const d = await screen.findByRole('dialog', { name: GUEST });
  await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
  const dlg = await screen.findByRole('dialog', { name: /^Folio · OTM-0\d+/ });
  return { dlg, box: await adjustIn(user, dlg) };
}

async function setQty(user: User, box: HTMLElement, qty: string) {
  const input = within(box).getByLabelText(fieldRe('folio.adjust_qty'));
  await user.clear(input);
  await user.type(input, qty);
}

const linesOf = (r: ReturnType<typeof res>) => mockControl.stay.folios.get(r.folioId)!.lines;

describe('V5-16 – lễ tân sửa giảm dòng chính mình nhập tay trong ngày: ghi thẳng (BR-438 (1), T16-6)', () => {
  it.each(['qa.fd', 'qa.fdl'])(
    '%s giảm số lượng dòng mình nhập tay hôm nay → ghi ngay, không qua miễn phí; hộp có câu luật',
    async (who) => {
      pinDaytime();
      const { r } = addFnb({ by: who });
      const adjust = capture(/\/lines\/fnb-v516\/adjustments$/);
      const foc = capture(/\/foc$/);
      const { user } = renderApp(`/reservations/${r.id}`, who);
      const { box } = await openAdjust(user);
      // UXD 9.5: the rule is said from the start, under "Bỏ cả dòng" – FD, FDL only.
      expect(within(box).getByText(tv('folio.adjust_reduce_rule'))).toBeInTheDocument();
      await setQty(user, box, '2');
      await user.type(
        within(box).getByLabelText(fieldRe('folio.adjust_reason')),
        'Gõ nhầm số lượng',
      );
      await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
      expect(await screen.findByText(tv('folio.adjusted_toast'))).toBeInTheDocument();
      adjust.stop();
      foc.stop();
      expect(adjust.sent).toEqual([{ newQuantity: 2, reason: 'Gõ nhầm số lượng' }]);
      expect(foc.sent).toHaveLength(0);
      const live = linesOf(r).filter((l) => l.category === 'fnb' && !l.reversalOfId);
      expect(live.at(-1)).toMatchObject({ quantity: 2, amountVnd: 70_000 });
      expect(linesOf(r).some((l) => l.category === 'foc')).toBe(false);
    },
  );
});

describe('V5-16 – ngoài phạm vi: 403 requiredFlow = foc_request → Gửi miễn có duyệt điền sẵn (BR-438 (2), US-177 AC2)', () => {
  it('FD bỏ dòng lễ tân khác nhập (T-16-2, T-16-11): câu chỉ dẫn, giữ số đã gõ, folio không đổi; nút mở form miễn phí đúng dòng, số = cả dòng, lý do Ghi nhầm', async () => {
    pinDaytime();
    const { r } = addFnb({ by: 'qa.fdl' });
    const before = linesOf(r).length;
    const foc = capture(/\/lines\/fnb-v516\/foc$/);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const { dlg, box } = await openAdjust(user);
    await user.click(within(box).getByRole('checkbox', { name: tv('folio.adjust_void') }));
    await user.type(within(box).getByLabelText(fieldRe('folio.adjust_reason')), 'Ghi nhầm căn');
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    // `requiredFlow` is read before the general 403 sentence (UXD 9.5) – no technical code shown.
    const note = await within(box).findByText(tv('error.reduce_needs_foc'));
    expect(within(box).queryByText(tv('error.FORBIDDEN_ACTION'))).toBeNull();
    expect(note.textContent).not.toMatch(/foc_request|FORBIDDEN|403/);
    // The box stays open with what was typed; nothing was written.
    expect(within(box).getByRole('checkbox', { name: tv('folio.adjust_void') })).toBeChecked();
    expect(within(box).getByLabelText(fieldRe('folio.adjust_reason'))).toHaveValue('Ghi nhầm căn');
    expect(linesOf(r)).toHaveLength(before);
    await user.click(within(box).getByRole('button', { name: tv('folio.foc_request_btn') }));
    // The waiver form of THAT line, the whole line filled in (a void), with its first-line note.
    const form = await screen.findByRole('dialog', { name: /^Miễn phí ·/ });
    expect(screen.queryByRole('dialog', { name: /^Điều chỉnh:/ })).toBeNull();
    expect(form).toHaveAccessibleName(new RegExp(`Bia.*${esc((105_000).toLocaleString('vi-VN'))}`));
    expect(within(form).getByLabelText(fieldRe('foc.amount'))).toHaveValue('105.000');
    expect(within(form).getByText(tv('foc.reduce_note'))).toBeInTheDocument();
    await user.click(within(form).getByRole('radio', { name: tv('foc.r_entered_in_error') }));
    await user.click(within(form).getByRole('button', { name: tv('foc.send') }));
    expect(await screen.findByText(tv('foc.sent', { amount: money(105_000) }))).toBeInTheDocument();
    foc.stop();
    // Body shape (FocRequestInput, contract 0.3.13 1.20): no extra field, `entered_in_error`.
    expect(foc.sent).toEqual([{ kind: 'foc', amountVnd: 105_000, reasonCode: 'entered_in_error' }]);
    const a = mockControl.stay.approvals.at(-1)!;
    expect(a).toMatchObject({
      type: 'foc',
      status: 'pending',
      reasonCode: 'entered_in_error',
      amountVnd: 105_000,
      folioLineId: 'fnb-v516',
    });
    // The line itself is untouched; the waiver waits beside it and the Desk names its reason.
    expect(linesOf(r).filter((l) => l.reversalOfId === 'fnb-v516')).toHaveLength(0);
    expect(
      await within(dlg).findByText(
        new RegExp(esc(tv('bill.line.foc_reason', { reason: tv('foc.r_entered_in_error') }))),
      ),
    ).toBeInTheDocument();
  });

  it('FD giảm dòng mình ghi hôm qua (T16-8): số điền sẵn = số cũ − số mới, không quá foc.max', async () => {
    pinDaytime();
    const { r } = addFnb({ by: 'qa.fd', postedAt: new Date(Date.now() - DAY_MS).toISOString() });
    // 50.000 already waived on the line → 55.000 left (foc.max).
    mockControl.stay.folios.get(r.folioId)!.lines.push({
      id: 'foc-old-v516',
      category: 'foc',
      description: 'foc',
      quantity: 1,
      unitPriceVnd: -50_000,
      amountVnd: -50_000,
      lineState: 'posted',
      relatedLineId: 'fnb-v516',
      postedAt: new Date().toISOString(),
    } as Line);
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const { dlg, box } = await openAdjust(user);
    // 3 → 2: what was meant to come off is 35.000 (≤ 55.000 left).
    await setQty(user, box, '2');
    await user.type(within(box).getByLabelText(fieldRe('folio.adjust_reason')), 'Khách trả 1 lon');
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    await within(box).findByText(tv('error.reduce_needs_foc'));
    await user.click(within(box).getByRole('button', { name: tv('folio.foc_request_btn') }));
    let form = await screen.findByRole('dialog', { name: /^Miễn phí ·/ });
    expect(within(form).getByLabelText(fieldRe('foc.amount'))).toHaveValue('35.000');
    await user.click(within(form).getByRole('button', { name: tv('common.cancel') }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /^Miễn phí ·/ })).toBeNull());
    // A void would take 105.000 off – the form starts at what is left on the line (foc.max 55.000).
    const again = await adjustIn(user, dlg);
    await user.click(within(again).getByRole('checkbox', { name: tv('folio.adjust_void') }));
    await user.type(within(again).getByLabelText(fieldRe('folio.adjust_reason')), 'Ghi nhầm');
    await user.click(within(again).getByRole('button', { name: tv('folio.adjust_submit') }));
    await within(again).findByText(tv('error.reduce_needs_foc'));
    await user.click(within(again).getByRole('button', { name: tv('folio.foc_request_btn') }));
    form = await screen.findByRole('dialog', { name: /^Miễn phí ·/ });
    expect(within(form).getByLabelText(fieldRe('foc.amount'))).toHaveValue('55.000');
    expect(within(form).getByText(tv('foc.max', { amount: money(55_000) }))).toBeInTheDocument();
  });

  it('FDL giảm đơn giá dòng Desk tự ghi (T-16-4, T-16-7): 403 → Gửi miễn có duyệt, số = phần giảm', async () => {
    pinDaytime();
    // Written by a Desk flow, not typed by hand – even by this lead (BR-438-07).
    const { r } = addFnb({ by: 'qa.fdl', source: undefined });
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fdl');
    const { box } = await openAdjust(user);
    const price = within(box).getByLabelText(fieldRe('folio.adjust_price'));
    await user.clear(price);
    await user.type(price, '30000');
    await user.type(within(box).getByLabelText(fieldRe('folio.adjust_reason')), 'Giá khuyến mãi');
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    await within(box).findByText(tv('error.reduce_needs_foc'));
    await user.click(within(box).getByRole('button', { name: tv('folio.foc_request_btn') }));
    const form = await screen.findByRole('dialog', { name: /^Miễn phí ·/ });
    // 3 × 35.000 → 3 × 30.000: 15.000 meant to come off.
    expect(within(form).getByLabelText(fieldRe('foc.amount'))).toHaveValue('15.000');
  });

  it('403 không có requiredFlow (vd. quyền vừa đổi): câu chung, không nút Gửi miễn có duyệt', async () => {
    pinDaytime();
    const { r } = addFnb({ by: 'qa.fd' });
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const { box } = await openAdjust(user);
    await setQty(user, box, '1');
    await user.type(within(box).getByLabelText(fieldRe('folio.adjust_reason')), 'Gõ nhầm');
    mockControl.failNext(/\/adjustments:POST$/, 403, { code: 'FORBIDDEN_ACTION' });
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    expect(await within(box).findByText(tv('error.FORBIDDEN_ACTION'))).toBeInTheDocument();
    expect(within(box).queryByText(tv('error.reduce_needs_foc'))).toBeNull();
    expect(within(box).queryByRole('button', { name: tv('folio.foc_request_btn') })).toBeNull();
  });
});

describe('V5-16 – quản lý, chủ đầu tư sửa giảm như cũ (BR-438 (3), T16-11)', () => {
  it.each(['qa.mgr', 'qa.owner'])(
    '%s bỏ dòng lễ tân khác nhập → ghi ngay, không câu luật lễ tân',
    async (who) => {
      pinDaytime();
      const { r } = addFnb({ by: 'qa.fd', postedAt: new Date(Date.now() - DAY_MS).toISOString() });
      const adjust = capture(/\/lines\/fnb-v516\/adjustments$/);
      const { user } = renderApp(`/reservations/${r.id}`, who);
      const { box } = await openAdjust(user);
      expect(within(box).queryByText(tv('folio.adjust_reduce_rule'))).toBeNull();
      await user.click(within(box).getByRole('checkbox', { name: tv('folio.adjust_void') }));
      await user.type(within(box).getByLabelText(fieldRe('folio.adjust_reason')), 'Ghi nhầm căn');
      await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
      expect(await screen.findByText(tv('folio.adjusted_toast'))).toBeInTheDocument();
      adjust.stop();
      expect(adjust.sent).toEqual([{ voidLine: true, reason: 'Ghi nhầm căn' }]);
      expect(linesOf(r).filter((l) => l.reversalOfId === 'fnb-v516')).toHaveLength(1);
    },
  );
});

describe('V5-16 – lý do Ghi nhầm (US-177 AC8, AC10)', () => {
  it('form miễn phí mở theo lối thường: có Ghi nhầm, không câu "đã điền phần định giảm", số = phần còn lại', async () => {
    pinDaytime();
    const { r } = addFnb({ by: 'qa.fdl' });
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: GUEST });
    await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
    const dlg = await screen.findByRole('dialog', { name: /^Folio · OTM-0\d+/ });
    const row = (await within(dlg).findByText(/Bia/)).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: tv('foc.open_form') }));
    const form = await screen.findByRole('dialog', { name: /^Miễn phí ·/ });
    expect(
      within(form).getByRole('radio', { name: tv('foc.r_entered_in_error') }),
    ).toBeInTheDocument();
    expect(within(form).queryByText(tv('foc.reduce_note'))).toBeNull();
    expect(within(form).getByLabelText(fieldRe('foc.amount'))).toHaveValue('105.000');
  });

  it('Ghi nhầm chỉ ở form miễn phí của dòng đã ghi, không ở chỗ ghi phụ thu kèm xin miễn (B9, B15); "Khác" vẫn cuối', () => {
    expect(LINE_FOC_REASONS.map((o) => o.value)).toEqual([
      'regular_vip',
      'room_ready_no_impact',
      'service_recovery',
      'long_stay_guest',
      'entered_in_error',
      'other',
    ]);
    expect(FOC_REASONS.some((o) => o.value === 'entered_in_error')).toBe(false);
  });

  it('Desk gọi tên lý do (folio, Cần duyệt, Nhật ký tiền); bill khách không có lý do → chỉ "Miễn phí"', () => {
    const t = (k: string, a?: Record<string, string | number>) => tv(k, a);
    const desk = {
      id: 'x',
      category: 'foc',
      labelKey: 'bill.line.foc',
      labelParams: { reason: 'entered_in_error' },
    } as unknown as Parameters<typeof lineLabel>[1];
    expect(lineLabel(t, desk)).toBe(
      tv('bill.line.foc_reason', { reason: tv('foc.r_entered_in_error') }),
    );
    // getBill (guestFacing) sends the line without the reason.
    const bill = { ...desk, labelParams: {} } as Parameters<typeof lineLabel>[1];
    expect(lineLabel(t, bill)).toBe(tv('bill.line.foc'));
    expect(requestReasonText(t, { type: 'foc', reasonCode: 'entered_in_error' })).toBe(
      tv('foc.r_entered_in_error'),
    );
    expect(
      auditReasonText(t, {
        action: 'folio.foc_requested',
        after: { reasonCode: 'entered_in_error' },
      } as unknown as Parameters<typeof auditReasonText>[1]),
    ).toBe(tv('foc.r_entered_in_error'));
  });

  it('bill của mock bỏ lý do Ghi nhầm như máy chủ (AC10)', async () => {
    pinDaytime();
    const { r } = addFnb({ by: 'qa.fdl' });
    mockControl.stay.folios.get(r.folioId)!.lines.push({
      id: 'foc-eie',
      category: 'foc',
      description: 'foc',
      labelKey: 'bill.line.foc',
      labelParams: { reason: 'entered_in_error' },
      quantity: 1,
      unitPriceVnd: -35_000,
      amountVnd: -35_000,
      lineState: 'posted',
      relatedLineId: 'fnb-v516',
      postedAt: new Date().toISOString(),
    } as Line);
    // a signed-in Desk session (CSRF) first
    renderApp(`/reservations/${r.id}`, 'qa.fd');
    await screen.findByRole('dialog', { name: GUEST });
    const bill = (await api.getBill({ propertyId: PROPERTY_ID, folioId: r.folioId })).data;
    const line = bill.lines.find((l) => l.id === 'foc-eie')!;
    expect(lineLabel(tv, line)).toBe(tv('bill.line.foc'));
    // The Desk folio keeps the reason.
    const folio = (await api.getFolio({ propertyId: PROPERTY_ID, folioId: r.folioId })).data;
    expect(
      lineLabel(
        tv,
        folio.lines.find((l) => l.id === 'foc-eie')!,
      ),
    ).toBe(tv('bill.line.foc_reason', { reason: tv('foc.r_entered_in_error') }));
    // The mock-only BR-438 facts never reach the Desk.
    expect(folio.lines.find((l) => l.id === 'fnb-v516')).not.toHaveProperty('source');
  });
});
