// v1.0.4 (FE-A) – BUG-R4-039 on the desk (BE #74, BR-402 (1) v0.5.3). The "room not ready" exception exists only for
// a vacant room not cleaned yet (VD/CL) with no other stay in it – the server offers it as `overridableBy`. OC/OD
// (the previous guest is still in the room) have none, for any role, the lead's approval included: B9 answers 409.
// H13 used to decide on `detail === 'OOO'`, so on OC/OD it still asked the lead to confirm (or the desk to ask
// the lead) and the server refused. Now: blocking like an over-capacity room (UXD 05/11), no reason box, no request.
// DOM (lượt 5 mục 2): two blocked cases with their own sentence – (a) OC/OD; (b) another booking's stay still holds
// the room, whatever status the room shows (never "ask housekeeping" there).
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

const rsvOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const reasonBox = () => screen.queryByLabelText(new RegExp(`^${tv('ci.reason')}`));
const occupied = (room: string) => tv('checkin.room_occupied', { room });
const held = (room: string) => tv('checkin.room_held', { room });

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

async function toConditions(user: ReturnType<typeof renderApp>['user']) {
  await screen.findByRole('heading', { name: /Nhận phòng/ });
  await user.click(await screen.findByRole('button', { name: tv('ci.go_verify') }));
  await user.click(await screen.findByRole('button', { name: tv('ci.go_register') }));
  await user.click(await screen.findByRole('button', { name: tv('reg.later') }));
}

/** The room line's blocking alert: the sentence and the way out ("Đổi căn / đổi ngày" → the booking). */
async function expectBlocked(reservationId: string, sentence = occupied('302')) {
  const text = await screen.findByText(sentence);
  const alert = text.closest('.alert') as HTMLElement;
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
}

describe('BUG-R4-039 – H13: no "room not ready" exception on a room the previous guest still holds', () => {
  it('OC, lead: blocked – no reason box, no confirm sentence; "Nhận phòng" locked', async () => {
    const r = hung('OC');
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fdl');
    await toConditions(user);
    await expectBlocked(r.id);
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
    await expectBlocked(r.id);
    expect(screen.queryByText(tv('ci.room_approved', { name: 'Lan' }))).not.toBeInTheDocument();
    server.events.removeListener('request:start', on);
    expect(sent).toHaveLength(0);
  });

  it.each(['VD', 'VC'])(
    "%s while another booking's stay is still in 302 (leaving today): blocked, its own sentence, no housekeeping",
    async (status) => {
      const r = hung(status);
      const other = rsvOf('Phạm Huy');
      expect(other.status).toBe('in_house');
      other.roomId = r.roomId;
      const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fdl');
      await toConditions(user);
      await expectBlocked(r.id, held('302'));
      // (b) is never cleared by housekeeping – the OC/OD sentence (which mentions it) is not shown.
      expect(screen.queryByText(occupied('302'))).not.toBeInTheDocument();
    },
  );

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

  it('409 ROOM_OCCUPIED from B9: the check-in sentence, never `error.ROOM_OCCUPIED` (blocking a room)', async () => {
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
    mockControl.failNext(/\/actions\/check-in:POST$/, 409, { code: 'ROOM_OCCUPIED' });
    await user.click(screen.getByRole('button', { name: tv('ci.submit', { room: '302' }) }));
    const ok = await screen.findByRole('alertdialog', { name: /Nhận phòng căn 302/ });
    await user.click(within(ok).getByRole('button', { name: tv('ci.submit', { room: '302' }) }));
    expect(await screen.findByText(occupied('302'))).toBeInTheDocument();
    expect(screen.queryByText(tv('error.ROOM_OCCUPIED', { room: '302' }))).not.toBeInTheDocument();
    expect(rsvOf('Gia đình anh Hưng').status).toBe('confirmed');
  });
});
