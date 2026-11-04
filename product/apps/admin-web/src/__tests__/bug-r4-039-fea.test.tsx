// v1.0.4 (FE-A) – BUG-R4-039 on the desk (BE #74, BR-402 (1) v0.5.3). The "room not ready" exception exists only for
// a vacant room not cleaned yet (VD/CL) with no other stay in it – the server offers it as `overridableBy`. OC/OD
// (the previous guest is still in the room) have none, for any role, the lead's approval included: B9 answers 409.
// H13 used to decide on `detail === 'OOO'`, so on OC/OD it still asked the lead to confirm (or the desk to ask
// the lead) and the server refused. Now: blocking like an over-capacity room (UXD 05/11), no reason box, no request.
// DOM (lượt 5 mục 2): two blocked cases with their own sentence – (a) OC/OD; (b) another booking's stay still holds
// the room, whatever status the room shows (never "ask housekeeping" there).
// ARC (review #74 C1/C2, review #77 PR77-02/03): the sentence follows `cause` (`room_status` | `held_by_other_stay` |
// `no_room`) and names the holding booking (`heldByReservationCode`, UXD lượt 3 `checkin.room_held_code`); an overdue
// stay with no B18 also takes the exception away; without `cause`, DOM's reading – never on a booking with no room.
// UXD lượt 4 (DOM lượt 7 mục 3): `cause = room_status` on OC/OD with no stay in house → `checkin.room_status_stuck`;
// `room_occupied` (new ending: move this booking, tell the manager) stays for a server with no `cause`.
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../app/api';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { roomBlockedMessage } from '../pages/stay/CheckInPage';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

const rsvOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const reasonBox = () => screen.queryByLabelText(new RegExp(`^${tv('ci.reason')}`));
const occupied = (room: string) => tv('checkin.room_occupied', { room });
const stuck = (room: string) => tv('checkin.room_status_stuck', { room });
const held = (room: string) => tv('checkin.room_held', { room });
const heldCode = (room: string, code: string) => tv('checkin.room_held_code', { room, code });
const yesterday = () =>
  new Date(Date.parse(`${todayLocal()}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** "Gia đình anh Hưng" arrives today in 302, with the main guest's document; 302 in `status`. */
function hung(status: string) {
  pinDaytime();
  const r = rsvOf('Gia đình anh Hưng');
  mockControl.stay.registrations.get(r.registrationId!)!.documents.push({
    id: 'doc-main-302-r4039',
    docType: 'cccd',
    isMain: true,
    fullNameOnDoc: 'Gia đình anh Hưng',
    nationalityCode: 'VNM',
    docNumber: '079123456789',
    imageIds: [],
    imageConsent: 'refused',
    captureMethod: 'manual',
    checks: [],
  });
  mockControl.stay.roomStatus['302'] = status;
  return r;
}

/** Phạm Huy (in house, leaving today unless `departure`) is still in 302 – no B18 yet. */
function huyIn302(departure?: string) {
  const other = rsvOf('Phạm Huy');
  expect(other.status).toBe('in_house');
  other.roomId = rsvOf('Gia đình anh Hưng').roomId;
  if (departure) other.departureDate = departure;
  return other;
}

async function toConditions(user: ReturnType<typeof renderApp>['user']) {
  await screen.findByRole('heading', { name: /Nhận phòng/ });
  await user.click(await screen.findByRole('button', { name: tv('ci.go_verify') }));
  await user.click(await screen.findByRole('button', { name: tv('ci.go_register') }));
  await user.click(await screen.findByRole('button', { name: tv('reg.later') }));
}

/** The DS Alert (role "alert") that reads `sentence` – the code inside it is a separate (mono) element. */
const alertWith = (sentence: string) =>
  screen.queryAllByRole('alert').find((a) => a.textContent?.includes(sentence));

/** The room line's blocking alert: the sentence and the way out ("Đổi căn / đổi ngày" → the booking). */
async function expectBlocked(reservationId: string, sentence: string) {
  const alert = await waitFor(() => {
    const a = alertWith(sentence);
    expect(a).toBeDefined();
    return a!;
  });
  expect(alert).toHaveClass('bad');
  expect(within(alert).getByRole('link', { name: tv('drawer.action.move') })).toHaveAttribute(
    'href',
    `/reservations/${reservationId}`,
  );
  expect(reasonBox()).not.toBeInTheDocument();
  expect(
    screen.queryByText(
      tv('checkin.room_not_ready_lead', { room: '302', status: tv('status.room.OC') }),
    ),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: tv('ci.send_lead') })).not.toBeInTheDocument();
  expect(screen.queryByText(tv('error.ROOM_OCCUPIED', { room: '302' }))).not.toBeInTheDocument();
  return alert;
}

/** UXD lượt 3: the holding booking named once, its code in mono. */
async function expectHeldBy(reservationId: string, code: string) {
  const alert = await expectBlocked(reservationId, heldCode('302', code));
  expect(within(alert).getByText(code)).toHaveClass('mono');
  // (b) is never cleared by fixing the room status – the OC/OD sentences (which say so) are not shown.
  expect(alertWith(occupied('302'))).toBeUndefined();
  expect(alertWith(stuck('302'))).toBeUndefined();
}

describe('BUG-R4-039 – H13: no "room not ready" exception on a room the previous guest still holds', () => {
  it('OC, lead, no stay in 302 (status stuck): blocked – no reason box, no confirm sentence; "Nhận phòng" locked', async () => {
    const r = hung('OC');
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fdl');
    await toConditions(user);
    // UXD lượt 4 (3): `cause = room_status` on OC – no stay to check out, so not the room_occupied sentence.
    await expectBlocked(r.id, stuck('302'));
    expect(alertWith(occupied('302'))).toBeUndefined();
    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    const submit = screen.getByRole('button', { name: tv('ci.submit', { room: '302' }) });
    expect(submit).toHaveAttribute('aria-disabled', 'true');
  });

  it('OD, desk with the lead\'s approval of today: still blocked – no "approved" chip, nothing sent', async () => {
    const r = hung('OD');
    mockControl.stay.approvals.push({
      id: 'appr-r4039',
      type: 'checkin_room_not_ready',
      status: 'approved',
      reservationCode: r.code,
      amountVnd: 0,
      reasonCode: 'other',
      reasonNote: 'Khách chờ không được',
      requestedBy: 'Hạnh',
      requestedAt: new Date().toISOString(),
      approverName: 'Lan',
      decidedAt: new Date().toISOString(),
    } as (typeof mockControl.stay.approvals)[number]);
    const sent: string[] = [];
    const on = ({ request }: { request: Request }) => {
      if (/\/actions\/check-in$/.test(request.url)) sent.push(request.url);
    };
    server.events.on('request:start', on);
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await toConditions(user);
    await expectBlocked(r.id, stuck('302'));
    expect(screen.queryByText(tv('ci.room_approved', { name: 'Lan' }))).not.toBeInTheDocument();
    server.events.removeListener('request:start', on);
    expect(sent).toHaveLength(0);
  });

  it.each(['VD', 'VC', 'OC'])(
    "%s while another booking's stay is still in 302 (leaving today): blocked, that booking named, no housekeeping",
    async (status) => {
      const r = hung(status);
      const other = huyIn302();
      const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fdl');
      await toConditions(user);
      // UXD lượt 3 (2): the code wins even on OC – a stay is really in the room, the status is not wrong.
      await expectHeldBy(r.id, other.code);
    },
  );

  it('ARC C1 – only an overdue stay (no B18) left in 302, room CL: no exception, that booking named', async () => {
    const r = hung('CL');
    const other = huyIn302(yesterday());
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fdl');
    await toConditions(user);
    await expectHeldBy(r.id, other.code);
  });

  it('control – VD, no one in the room: the exception is still there (lead: reason; desk: ask the lead)', async () => {
    const r = hung('VD');
    const lead = renderApp(`/reservations/${r.id}/check-in`, 'qa.fdl');
    await toConditions(lead.user);
    expect(
      await screen.findByText(
        tv('checkin.room_not_ready_lead', { room: '302', status: tv('status.room.VD') }),
      ),
    ).toBeInTheDocument();
    expect(reasonBox()).toBeInTheDocument();
    expect(screen.queryByText(occupied('302'))).not.toBeInTheDocument();
    expect(screen.queryByText(stuck('302'))).not.toBeInTheDocument();
    lead.unmount();

    const desk = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await toConditions(desk.user);
    await desk.user.type(reasonBox()!, 'Khách chờ không được');
    await desk.user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: tv('ci.send_lead') })).not.toHaveAttribute(
        'aria-disabled',
      ),
    );
    expect(screen.queryByText(occupied('302'))).not.toBeInTheDocument();
  });

  it('ARC PR77-03 – the preview offered the exception, then another stay took 302: B9 409 → re-read, blocked, no reason box', async () => {
    const r = hung('VD');
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fdl');
    await toConditions(user);
    await user.type(reasonBox()!, 'Khách chờ không được');
    const due = rsvOf('Gia đình anh Hưng').balanceDueVnd ?? 0;
    if (due > 0) {
      await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
      await user.type(screen.getByLabelText(new RegExp(`^${tv('co.cash_received')}`)), String(due));
    }
    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    // Meanwhile: Phạm Huy is moved into 302 (no B18) – the server now refuses the exception (no `overridableBy`).
    const other = huyIn302();
    await user.click(screen.getByRole('button', { name: tv('ci.submit', { room: '302' }) }));
    const ok = await screen.findByRole('alertdialog', { name: /Nhận phòng căn 302/ });
    await user.click(within(ok).getByRole('button', { name: tv('ci.submit', { room: '302' }) }));
    await expectHeldBy(r.id, other.code);
    expect(rsvOf('Gia đình anh Hưng').status).toBe('confirmed');
  });

  it.each([
    ['OC', 'nobody', 'checkin.room_occupied'],
    ['VD', 'Phạm Huy', 'checkin.room_held'],
  ] as const)(
    'server before #74 C2 (no `cause`): %s, in 302: %s → %s (DOM lượt 5), no code',
    async (status, in302, key) => {
      const r = hung(status);
      if (in302 !== 'nobody') huyIn302();
      const preview = api.previewCheckIn.bind(api);
      const spy = vi.spyOn(api, 'previewCheckIn').mockImplementation(async (...args) => {
        const res = await preview(...args);
        for (const c of res.data.conditions) {
          delete (c as { cause?: string }).cause;
          delete (c as { heldByReservationCode?: string }).heldByReservationCode;
        }
        return res;
      });
      try {
        const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fdl');
        await toConditions(user);
        await expectBlocked(r.id, tv(key, { room: '302' }));
        expect(alertWith(stuck('302'))).toBeUndefined();
        expect(
          alertWith(key === 'checkin.room_held' ? occupied('302') : held('302')),
        ).toBeUndefined();
      } finally {
        spy.mockRestore();
      }
    },
  );
});

describe('roomBlockedMessage – which sentence for a room_ready with no exception', () => {
  const base = { code: 'room_ready' as const, met: false };
  it('nothing on a room with the exception, on OOO (ci.ooo_never), on a met condition', () => {
    expect(
      roomBlockedMessage({ ...base, detail: 'VD', overridableBy: ['front_desk_lead'] }, true),
    ).toBeNull();
    expect(roomBlockedMessage({ ...base, detail: 'OOO', cause: 'room_status' }, true)).toBeNull();
    expect(roomBlockedMessage({ code: 'room_ready', met: true, detail: 'VC' }, true)).toBeNull();
    expect(roomBlockedMessage(undefined, true)).toBeNull();
  });
  it('`cause` (ARC A.2, UXD lượt 4): held_by_other_stay with / without the code – even on OC/OD; room_status; no_room', () => {
    expect(
      roomBlockedMessage(
        { ...base, detail: 'OC', cause: 'held_by_other_stay', heldByReservationCode: 'OT-1001' },
        true,
      ),
    ).toEqual({ key: 'checkin.room_held_code', code: 'OT-1001' });
    expect(
      roomBlockedMessage({ ...base, detail: 'CL', cause: 'held_by_other_stay' }, true),
    ).toEqual({ key: 'checkin.room_held' });
    expect(
      roomBlockedMessage({ ...base, detail: 'OC', cause: 'held_by_other_stay' }, true),
    ).toEqual({ key: 'checkin.room_held' });
    expect(roomBlockedMessage({ ...base, detail: 'OD', cause: 'room_status' }, true)).toEqual({
      key: 'checkin.room_status_stuck',
    });
    expect(roomBlockedMessage({ ...base, detail: 'OC', cause: 'room_status' }, true)).toEqual({
      key: 'checkin.room_status_stuck',
    });
    expect(roomBlockedMessage({ ...base, cause: 'no_room' }, false)).toBeNull();
    expect(roomBlockedMessage({ ...base, cause: 'no_room' }, true)).toBeNull();
  });
  it('no `cause` (API before #74 C2): DOM lượt 5 on `detail`, only for a booking with its room', () => {
    expect(roomBlockedMessage({ ...base, detail: 'OC' }, true)).toEqual({
      key: 'checkin.room_occupied',
    });
    expect(roomBlockedMessage({ ...base, detail: 'OD' }, true)).toEqual({
      key: 'checkin.room_occupied',
    });
    expect(roomBlockedMessage({ ...base, detail: 'VD' }, true)).toEqual({
      key: 'checkin.room_held',
    });
    // An unassigned booking reads `detail: "VC"` there – not "another stay in house".
    expect(roomBlockedMessage({ ...base, detail: 'VC' }, false)).toBeNull();
    // A cause this Desk does not know: the same reading.
    expect(roomBlockedMessage({ ...base, detail: 'VI', cause: 'later_cause' }, true)).toEqual({
      key: 'checkin.room_held',
    });
  });
});
