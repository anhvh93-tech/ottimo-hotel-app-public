// v1.0.5 V5-30 – Desk "Người chốt" on the booking drawer (khung đơn), by milestone. Server rules: contract 0.3.13
// addendum 1h/1i, `updateReservation` (BE-H #154/#157). Copy: UXD copy-v1.0.5 9.16 (DOM 154-03, SEC 1I-03).
// - hold: FD+ change it, no reason box;
// - after the hold, before check-in: MGR+ change it, reason optional; FD/FDL read-only + `rsv.closer.readonly_manager`;
// - after check-in (`in_house`, `checked_out`): OWN only, reason required; MGR/FDL/FD read-only +
//   `rsv.closer.readonly_owner`; `checked_out` takes only `closerUserId` + `closerChangeReason`;
// - `closerChangeReason` only when `closerUserId` changes; 412/403 → read again, then `error.closer_change_forbidden`
//   when the milestone moved (ARC 162-01), `error.FORBIDDEN_ACTION` and read-only otherwise (SEC 162-01);
//   422 → the field sentences (`reason_required`, `too_long` {max} 500, `not_in_list`, `reason_card_number`).
// No commission figures and no real guest data here: the booking is a seed booking, the people are the QA accounts.
import type { ReservationPatch, ReservationStatus } from '@ottimo/api-client';
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../app/api';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

const GUEST = 'Nguyễn Văn An';
const userId = (username: string) => mockControl.db.users.find((u) => u.username === username)!.id;
const booking = () => mockControl.rsv.reservations.find((r) => r.guestName === GUEST)!;
const LABEL = tv('bk.closer_sales');
const REASON = new RegExp(`^${tv('rsv.closer.reason')}`);

/** The seed Direct booking, made a "Sale nội bộ" booking closed by Sơn (qa.sal), at the given milestone. */
function at(status: ReservationStatus) {
  const r = booking();
  r.directSource = 'sales_staff';
  r.closerUserId = userId('qa.sal');
  r.status = status;
  if (status === 'hold')
    r.hold = {
      hours: 24,
      expiresAt: new Date(Date.now() + 20 * 3_600_000).toISOString(),
      extendedCount: 0,
    };
  if (status === 'in_house' || status === 'checked_out')
    r.actualCheckinAt = new Date(Date.now() - 3_600_000).toISOString();
  return r;
}

async function openAs(username: string) {
  const { user } = renderApp(`/reservations/${booking().id}`, username);
  const d = await screen.findByRole('dialog', { name: GUEST });
  await within(d).findByText(tv('booking.field.room'), { selector: 'dt' });
  return { user, d };
}

/** The select once the candidate list is in (it is disabled while loading). */
async function closerSelect(d: HTMLElement) {
  const box = await within(d).findByRole('combobox', { name: LABEL });
  await waitFor(() => expect(box).toBeEnabled());
  return box as HTMLSelectElement;
}

function patchSpy() {
  return vi.spyOn(api, 'updateReservation');
}
const bodyOf = (spy: ReturnType<typeof patchSpy>, call = 0) =>
  spy.mock.calls[call]![1] as ReservationPatch;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('V5-30 – who sees what, by role × milestone (copy 9.16, DOM 154-03)', () => {
  type Cell = [ReservationStatus, string, 'none' | 'optional' | 'required' | string];
  const cells: Cell[] = [
    ['hold', 'qa.owner', 'none'],
    ['hold', 'qa.mgr', 'none'],
    ['hold', 'qa.fdl', 'none'],
    ['hold', 'qa.fd', 'none'],
    ['confirmed', 'qa.owner', 'optional'],
    ['confirmed', 'qa.mgr', 'optional'],
    ['confirmed', 'qa.fdl', 'rsv.closer.readonly_manager'],
    ['confirmed', 'qa.fd', 'rsv.closer.readonly_manager'],
    ['in_house', 'qa.owner', 'required'],
    ['in_house', 'qa.mgr', 'rsv.closer.readonly_owner'],
    ['in_house', 'qa.fdl', 'rsv.closer.readonly_owner'],
    ['in_house', 'qa.fd', 'rsv.closer.readonly_owner'],
    ['checked_out', 'qa.owner', 'required'],
    ['checked_out', 'qa.mgr', 'rsv.closer.readonly_owner'],
    ['checked_out', 'qa.fdl', 'rsv.closer.readonly_owner'],
    ['checked_out', 'qa.fd', 'rsv.closer.readonly_owner'],
  ];

  it.each(cells)('%s · %s → %s', async (status, username, expected) => {
    at(status);
    const { user, d } = await openAs(username);
    if (expected.startsWith('rsv.closer.')) {
      // Read-only: the name as text, one line saying whom to ask, no select and no button (no access.denied).
      expect(await within(d).findByText(tv(expected))).toHaveClass('li-s');
      const dt = within(d).getByText(LABEL, { selector: 'dt' });
      await waitFor(() => expect(dt.nextElementSibling).toHaveTextContent(/^Sơn/));
      expect(within(d).queryByRole('combobox', { name: LABEL })).toBeNull();
      expect(within(d).queryByRole('button', { name: tv('common.save') })).toBeNull();
      const other =
        expected === 'rsv.closer.readonly_manager'
          ? 'rsv.closer.readonly_owner'
          : 'rsv.closer.readonly_manager';
      expect(within(d).queryByText(tv(other))).toBeNull();
      return;
    }
    // Editable: the select as in the booking dialog; the reason box only after another person is picked.
    const box = await closerSelect(d);
    expect(box.value).toBe(userId('qa.sal'));
    expect(within(d).queryByLabelText(REASON)).toBeNull();
    expect(within(d).queryByText(tv('rsv.closer.readonly_manager'))).toBeNull();
    expect(within(d).queryByText(tv('rsv.closer.readonly_owner'))).toBeNull();
    await user.selectOptions(box, userId('qa.fd'));
    expect(within(d).getByRole('button', { name: tv('common.save') })).toBeInTheDocument();
    const reason = within(d).queryByLabelText(REASON);
    if (expected === 'none') {
      expect(reason).toBeNull();
      return;
    }
    expect(reason).not.toBeNull();
    if (expected === 'required') {
      expect(reason).toHaveAttribute('aria-required', 'true');
      expect(within(d).queryByText(`(${tv('common.optional')})`)).toBeNull();
    } else {
      expect(reason).not.toHaveAttribute('aria-required');
      expect(within(d).getByText(`(${tv('common.optional')})`)).toBeInTheDocument();
    }
  });

  it('SAL: no closer row and no read-only line (not their job – copy 9.16)', async () => {
    at('confirmed');
    const { d } = await openAs('qa.sal');
    expect(within(d).queryByText(LABEL)).toBeNull();
    expect(within(d).queryByText(tv('rsv.closer.readonly_manager'))).toBeNull();
    expect(within(d).queryByText(tv('rsv.closer.readonly_owner'))).toBeNull();
  });

  it('CTV: no closer row on their own hold', async () => {
    renderApp(
      `/reservations/${mockControl.rsv.reservations.find((r) => r.guestName === 'Lê Minh')!.id}`,
      'qa.ctv1',
    );
    const d = await screen.findByRole('dialog', { name: 'Lê Minh' });
    await within(d).findByText(tv('booking.field.room'), { selector: 'dt' });
    expect(within(d).queryByText(tv('bk.closer'))).toBeNull();
    expect(within(d).queryByRole('combobox')).toBeNull();
  });

  it('CTV channel hold, FD: label "CTV chốt đơn", agents only (A-06, like the booking dialog)', async () => {
    renderApp(
      `/reservations/${mockControl.rsv.reservations.find((r) => r.guestName === 'Lê Minh')!.id}`,
      'qa.fd',
    );
    const d = await screen.findByRole('dialog', { name: 'Lê Minh' });
    const box = await within(d).findByRole('combobox', { name: tv('bk.closer') });
    await waitFor(() => expect(box).toBeEnabled());
    const names = within(box)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(names).toEqual(['Mai']);
  });
});

describe('V5-30 – what the Desk sends (contract 1i, BE 1H-01)', () => {
  it('hold, FD: no reason box; the body is the closer alone; the drawer shows the new closer', async () => {
    at('hold');
    const spy = patchSpy();
    const { user, d } = await openAs('qa.fd');
    await user.selectOptions(await closerSelect(d), userId('qa.fdl'));
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    await waitFor(() => expect(booking().closerUserId).toBe(userId('qa.fdl')));
    expect(bodyOf(spy)).toEqual({ closerUserId: userId('qa.fdl') });
    await waitFor(() =>
      expect(within(d).queryByRole('button', { name: tv('common.save') })).toBeNull(),
    );
    expect((await closerSelect(d)).value).toBe(userId('qa.fdl'));
  });

  it('confirmed, MGR: reason optional – left empty, no closerChangeReason key', async () => {
    at('confirmed');
    const spy = patchSpy();
    const { user, d } = await openAs('qa.mgr');
    await user.selectOptions(await closerSelect(d), userId('qa.fd'));
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    await waitFor(() => expect(booking().closerUserId).toBe(userId('qa.fd')));
    expect(bodyOf(spy)).toEqual({ closerUserId: userId('qa.fd') });
  });

  it('confirmed, MGR: a typed reason is sent trimmed; help (SEC 1I-03) and hint come from copy 9.16', async () => {
    at('confirmed');
    const spy = patchSpy();
    const { user, d } = await openAs('qa.mgr');
    await user.selectOptions(await closerSelect(d), userId('qa.fd'));
    const reason = within(d).getByLabelText(REASON);
    expect(reason).toHaveAttribute('placeholder', tv('rsv.closer.reason_hint'));
    expect(reason).toHaveAttribute('maxlength', '500');
    const help = within(d).getByText(tv('rsv.closer.reason_help'));
    expect(reason.getAttribute('aria-describedby')).toContain(help.id);
    await user.type(reason, '  Chọn nhầm lúc tạo đơn  ');
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(bodyOf(spy)).toEqual({
      closerUserId: userId('qa.fd'),
      closerChangeReason: 'Chọn nhầm lúc tạo đơn',
    });
  });

  it('confirmed, MGR: a started reason under 3 characters is stopped on the Desk (no request)', async () => {
    at('confirmed');
    const spy = patchSpy();
    const { user, d } = await openAs('qa.mgr');
    await user.selectOptions(await closerSelect(d), userId('qa.fd'));
    await user.type(within(d).getByLabelText(REASON), 'ab');
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    expect(await within(d).findByText(tv('field_error.reason_required'))).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
    // The help line stays with the error (SEC 1I-03, like 9.9).
    expect(within(d).getByText(tv('rsv.closer.reason_help'))).toBeInTheDocument();
  });

  it('in_house, OWN: reason required – empty is stopped locally, then sent with the closer', async () => {
    at('in_house');
    const spy = patchSpy();
    const { user, d } = await openAs('qa.owner');
    await user.selectOptions(await closerSelect(d), userId('qa.fd'));
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    expect(await within(d).findByText(tv('field_error.reason_required'))).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
    await user.type(within(d).getByLabelText(REASON), 'Khách do lễ tân chốt, không phải sale');
    expect(within(d).queryByText(tv('field_error.reason_required'))).toBeNull();
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    await waitFor(() => expect(booking().closerUserId).toBe(userId('qa.fd')));
    expect(bodyOf(spy)).toEqual({
      closerUserId: userId('qa.fd'),
      closerChangeReason: 'Khách do lễ tân chốt, không phải sale',
    });
  });

  it('after Save: toast common.saved, focus back on the select once it is enabled (UXD 162-01)', async () => {
    at('in_house');
    const { user, d } = await openAs('qa.owner');
    const box = await closerSelect(d);
    await user.selectOptions(box, userId('qa.fd'));
    await user.type(within(d).getByLabelText(REASON), 'Khách do lễ tân chốt');
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    const toast = await screen.findByText(tv('common.saved'));
    expect(toast.closest('[aria-live="polite"]')).not.toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(box));
    expect(box).toBeEnabled();
    expect(box.value).toBe(userId('qa.fd'));
    expect(within(d).queryByLabelText(REASON)).toBeNull();
  });

  it('checked_out, OWN: the body holds only closerUserId + closerChangeReason (BE 1H-01) and is accepted', async () => {
    const r = at('checked_out');
    const version = r.version;
    const spy = patchSpy();
    const { user, d } = await openAs('qa.owner');
    await user.selectOptions(await closerSelect(d), userId('qa.fdl'));
    await user.type(within(d).getByLabelText(REASON), 'Sửa người chốt sau trả phòng');
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    await waitFor(() => expect(booking().closerUserId).toBe(userId('qa.fdl')));
    expect(Object.keys(bodyOf(spy)).sort()).toEqual(['closerChangeReason', 'closerUserId']);
    expect(spy.mock.calls[0]![2]).toBe(version);
    expect(booking().status).toBe('checked_out');
  });

  it('unchanged closer → no reason, no Save: picking the stored person again hides and clears the reason', async () => {
    at('in_house');
    const spy = patchSpy();
    const { user, d } = await openAs('qa.owner');
    const box = await closerSelect(d);
    await user.selectOptions(box, userId('qa.fd'));
    await user.type(within(d).getByLabelText(REASON), 'Lý do thử');
    await user.selectOptions(box, userId('qa.sal'));
    expect(within(d).queryByLabelText(REASON)).toBeNull();
    expect(within(d).queryByRole('button', { name: tv('common.save') })).toBeNull();
    await user.selectOptions(box, userId('qa.fd'));
    expect(within(d).getByLabelText(REASON)).toHaveValue('');
    // "Bỏ thay đổi" puts the stored closer back (UXD 162-02: never a bare "Hủy" in the booking drawer).
    expect(within(d).queryByRole('button', { name: tv('common.cancel') })).toBeNull();
    await user.click(within(d).getByRole('button', { name: tv('common.unsaved_discard') }));
    expect(box.value).toBe(userId('qa.sal'));
    expect(within(d).queryByLabelText(REASON)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('V5-30 – answers from the server (412 → 409 → 403 → 422, SEC 158-02)', () => {
  /** Another desk checks the guest in: the status moves AND the version moves (the server answers 412 first). */
  const checkInElsewhere = (r: ReturnType<typeof at>) => {
    r.status = 'in_house';
    r.actualCheckinAt = new Date().toISOString();
    r.version += 1;
  };
  /** The role of qa.mgr is taken away on the server; the Desk session still says manager. */
  const demoteManager = () => {
    const u = mockControl.db.users.find((x) => x.username === 'qa.mgr')!;
    u.roles = u.roles.map((x) => ({ ...x, role: 'front_desk' as const }));
  };

  it('412 after a check-in at another desk: read again → error.closer_change_forbidden, read-only + readonly_owner (ARC 162-01)', async () => {
    const r = at('confirmed');
    const spy = patchSpy();
    const read = vi.spyOn(api, 'getReservation');
    const { user, d } = await openAs('qa.mgr');
    await user.selectOptions(await closerSelect(d), userId('qa.fd'));
    await user.type(within(d).getByLabelText(REASON), 'Chọn nhầm');
    checkInElsewhere(r);
    const readsBefore = read.mock.calls.length;
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    const notice = await within(d).findByText(tv('error.closer_change_forbidden'));
    expect(notice.closest('[role="alert"]')).not.toBeNull();
    // Read again before the sentence: the read-only line of the new milestone is already there.
    expect(read.mock.calls.length).toBeGreaterThan(readsBefore);
    expect(within(d).getByText(tv('rsv.closer.readonly_owner'))).toBeInTheDocument();
    expect(within(d).queryByRole('combobox', { name: LABEL })).toBeNull();
    expect(within(d).queryByRole('button', { name: tv('common.save') })).toBeNull();
    // Not the generic conflict sentence any more.
    expect(within(d).queryByText(tv('error.VERSION_CONFLICT'))).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(booking().closerUserId).toBe(userId('qa.sal'));
  });

  it('412 after a cancel at another desk: read again → the drawer says the new status (ARC 162-01)', async () => {
    const r = at('confirmed');
    const { user, d } = await openAs('qa.mgr');
    await user.selectOptions(await closerSelect(d), userId('qa.fd'));
    r.status = 'cancelled';
    r.version += 1;
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    expect(
      await within(d).findByText(
        tv('rsv.transition_changed', { status: tv('status.booking.cancelled') }),
      ),
    ).toBeInTheDocument();
    expect(within(d).queryByRole('combobox', { name: LABEL })).toBeNull();
    expect(within(d).queryByText(tv('error.VERSION_CONFLICT'))).toBeNull();
    expect(within(d).queryByText(tv('error.closer_change_forbidden'))).toBeNull();
  });

  it('403 on the same booking (the role was just taken away): read again → error.FORBIDDEN_ACTION, read-only, no second PATCH (SEC 162-01)', async () => {
    at('confirmed');
    const spy = patchSpy();
    const { user, d } = await openAs('qa.mgr');
    await user.selectOptions(await closerSelect(d), userId('qa.fd'));
    await user.type(within(d).getByLabelText(REASON), 'Chọn nhầm');
    demoteManager();
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    const notice = await within(d).findByText(tv('error.FORBIDDEN_ACTION'));
    expect(notice.closest('[role="alert"]')).not.toBeNull();
    // The status did not change: never "Đơn vừa đổi trạng thái… Desk đã tải lại đơn".
    expect(within(d).queryByText(tv('error.closer_change_forbidden'))).toBeNull();
    // Read-only while the booking keeps this version: the name, no select, no button – nothing to send twice.
    const dt = within(d).getByText(LABEL, { selector: 'dt' });
    expect(dt.nextElementSibling).toHaveTextContent(/^Sơn/);
    expect(within(d).queryByRole('combobox', { name: LABEL })).toBeNull();
    expect(within(d).queryByRole('button', { name: tv('common.save') })).toBeNull();
    expect(within(d).queryByRole('button', { name: tv('common.reload') })).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(booking().closerUserId).toBe(userId('qa.sal'));
  });

  it('403 and the booking cannot be read again: no "Desk đã tải lại đơn", read-only, "Tải lại" reads it (SEC 162-01)', async () => {
    at('confirmed');
    const spy = patchSpy();
    const read = vi.spyOn(api, 'getReservation');
    const { user, d } = await openAs('qa.mgr');
    await user.selectOptions(await closerSelect(d), userId('qa.fd'));
    demoteManager();
    mockControl.failNext(/\/reservations\/[^/]+:GET$/, 500, { code: 'INTERNAL_ERROR' });
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    const notice = await within(d).findByText(tv('error.FORBIDDEN_ACTION'));
    const alert = notice.closest('.alert') as HTMLElement;
    expect(within(d).queryByText(tv('error.closer_change_forbidden'))).toBeNull();
    expect(within(d).queryByRole('combobox', { name: LABEL })).toBeNull();
    expect(within(d).queryByRole('button', { name: tv('common.save') })).toBeNull();
    // "Tải lại" reads the booking: same version, same milestone → still read-only, the button goes.
    const readsBefore = read.mock.calls.length;
    await user.click(within(alert).getByRole('button', { name: tv('common.reload') }));
    await waitFor(() => expect(read.mock.calls.length).toBeGreaterThan(readsBefore));
    await waitFor(() =>
      expect(within(d).queryByRole('button', { name: tv('common.reload') })).toBeNull(),
    );
    expect(within(d).getByText(tv('error.FORBIDDEN_ACTION'))).toBeInTheDocument();
    expect(within(d).queryByText(tv('error.closer_change_forbidden'))).toBeNull();
    expect(within(d).queryByRole('combobox', { name: LABEL })).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  const PATCH = /\/reservations\/[^/]+:PATCH$/;
  const fail = (code: string, errors: Array<{ field: string; code: string }>) =>
    mockControl.failNext(PATCH, 422, { code, errors });

  it.each([
    ['REASON_REQUIRED', 'VALIDATION_FAILED', () => tv('field_error.reason_required')],
    ['TOO_LONG', 'VALIDATION_FAILED', () => tv('field_error.too_long', { max: 500 })],
    ['CARD_NUMBER_DETECTED', 'VALIDATION_FAILED', () => tv('field_error.reason_card_number')],
    ['CARD_NUMBER_DETECTED', 'CARD_NUMBER_DETECTED', () => tv('field_error.reason_card_number')],
  ])(
    '422 %s on closerChangeReason (problem %s) → its sentence under the reason box',
    async (fieldCode, problemCode, text) => {
      at('in_house');
      const { user, d } = await openAs('qa.owner');
      await user.selectOptions(await closerSelect(d), userId('qa.fd'));
      await user.type(within(d).getByLabelText(REASON), 'Lý do đủ dài');
      fail(problemCode, [{ field: 'closerChangeReason', code: fieldCode }]);
      await user.click(within(d).getByRole('button', { name: tv('common.save') }));
      const msg = await within(d).findByText(text());
      expect(within(d).getByLabelText(REASON)).toHaveAttribute('aria-invalid', 'true');
      expect(within(d).getByLabelText(REASON).getAttribute('aria-describedby')).toContain(
        msg.closest('.err')!.id,
      );
      // Never the note sentence of CARD_NUMBER_DETECTED, never a form-level alert.
      expect(within(d).queryByText(tv('error.CARD_NUMBER_DETECTED'))).toBeNull();
      expect(within(d).getByText(tv('rsv.closer.reason_help'))).toBeInTheDocument();
      expect(booking().closerUserId).toBe(userId('qa.sal'));
    },
  );

  it('422 CARD_NUMBER_DETECTED end to end (mock V-09): a test card number in the reason', async () => {
    at('in_house');
    const { user, d } = await openAs('qa.owner');
    await user.selectOptions(await closerSelect(d), userId('qa.fd'));
    await user.type(within(d).getByLabelText(REASON), 'Khách đọc thẻ 4111 1111 1111 1111');
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    expect(await within(d).findByText(tv('field_error.reason_card_number'))).toBeInTheDocument();
    expect(within(d).queryByText(tv('error.CARD_NUMBER_DETECTED'))).toBeNull();
    expect(booking().closerUserId).toBe(userId('qa.sal'));
  });

  it('422 NOT_IN_LIST on closerUserId → field_error.not_in_list under the select; the list is read again', async () => {
    at('confirmed');
    const list = vi.spyOn(api, 'listCloserCandidates');
    const { user, d } = await openAs('qa.mgr');
    const box = await closerSelect(d);
    await user.selectOptions(box, userId('qa.fd'));
    // Hạnh's account is turned off meanwhile.
    mockControl.db.users.find((u) => u.username === 'qa.fd')!.status = 'disabled';
    const before = list.mock.calls.length;
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    expect(await within(d).findByText(tv('field_error.not_in_list'))).toBeInTheDocument();
    expect(box).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(before));
    await waitFor(() =>
      expect(
        within(box)
          .getAllByRole('option')
          .map((o) => o.textContent),
      ).not.toContain('Hạnh'),
    );
    expect(booking().closerUserId).toBe(userId('qa.sal'));
  });

  it('409 INVALID_TRANSITION at the same version (kept for a status change that does not move it): reload, the drawer says the new status', async () => {
    const r = at('confirmed');
    const { user, d } = await openAs('qa.mgr');
    await user.selectOptions(await closerSelect(d), userId('qa.fd'));
    r.status = 'cancelled';
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    expect(
      await within(d).findByText(
        tv('rsv.transition_changed', { status: tv('status.booking.cancelled') }),
      ),
    ).toBeInTheDocument();
    expect(within(d).queryByRole('combobox', { name: LABEL })).toBeNull();
  });

  it('412 VERSION_CONFLICT, still editable (another field changed): the input stays, "Tải lại" reads the new version, Save then works', async () => {
    const r = at('confirmed');
    const spy = patchSpy();
    const { user, d } = await openAs('qa.mgr');
    await user.selectOptions(await closerSelect(d), userId('qa.fd'));
    await user.type(within(d).getByLabelText(REASON), 'Chọn nhầm');
    r.version += 1; // another desk saved the booking
    const bumped = r.version;
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    const alert = await within(d).findByText(tv('error.VERSION_CONFLICT'));
    await user.click(
      within(alert.closest('.alert') as HTMLElement).getByRole('button', {
        name: tv('common.reload'),
      }),
    );
    await waitFor(() => expect(within(d).queryByText(tv('error.VERSION_CONFLICT'))).toBeNull());
    expect(within(d).getByLabelText(REASON)).toHaveValue('Chọn nhầm');
    await user.click(within(d).getByRole('button', { name: tv('common.save') }));
    await waitFor(() => expect(booking().closerUserId).toBe(userId('qa.fd')));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0]![2]).toBe(bumped - 1);
    expect(spy.mock.calls[1]![2]).toBe(bumped);
  });
});
