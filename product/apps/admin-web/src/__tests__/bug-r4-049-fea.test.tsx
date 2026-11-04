// v1.0.4 (FE-A) – BUG-R4-049 (P3, QA2 05/11): H13 for a booking with no room yet (OTA in the unassigned lane) printed
// "Căn · VC · Đã dọn, chờ kiểm" under "Buồng sẵn sàng" – an empty room number and the status the preview fills in
// (`roomStatus: 'VC'`) when there is no room. Now the room line says nothing more there; "Đơn đã được gán căn"
// above says what to do. Same `hasRoom` as BUG-R4-039 (`not_unassigned` met and a room number).
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

const hung = () => mockControl.rsv.reservations.find((r) => r.guestName === 'Gia đình anh Hưng')!;
const roomLine = async () =>
  (await screen.findByText(tv('checkin.cond.room_ready'))).closest('li')! as HTMLElement;

describe('BUG-R4-049 – H13: no room status for a booking with no room', () => {
  it('unassigned booking: the room line has no "Căn ·" and no room status', async () => {
    pinDaytime();
    const r = hung();
    r.roomId = null;
    r.segments = [];
    r.conflictState = 'open';
    renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    const line = await roomLine();
    const unassigned = screen.getByText(tv('checkin.cond.not_unassigned')).closest('li')!;
    expect(unassigned).toHaveTextContent(tv('ci.unmet'));
    expect(line).not.toHaveTextContent(
      tv('ci.cond_room', { room: '', status: tv('status.room.VC') }),
    );
    expect(line).not.toHaveTextContent(tv('status.room.VC'));
  });

  it('control – a booking with its room still shows "Căn 302 · <status>"', async () => {
    pinDaytime();
    const r = hung();
    mockControl.stay.roomStatus['302'] = 'VD';
    renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    const line = await roomLine();
    expect(line).toHaveTextContent(
      tv('ci.cond_room', { room: '302', status: tv('status.room.VD') }),
    );
  });
});
