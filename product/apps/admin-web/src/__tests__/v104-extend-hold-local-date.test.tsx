// FB-R4-ARC-FE-PR76-01 – B3 "Gia hạn giữ chỗ (1 lần)": the new deadline is read out on the button and in the toast as
// "HH:mm dd/MM". The hour was local (Asia/Ho_Chi_Minh) but the day was the UTC date, so a deadline from 00:00 to 06:59
// showed one day early – the desk would quote the guest the wrong day. A 12-hour hold made 12:00–18:59 ends in that
// window, and +24 h keeps the hour. Not about the clock of the run: the deadline itself is at 01:00.
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays, dayMonth } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

describe('FB-R4-ARC-FE-PR76-01 – extend a hold: the deadline day is the local day', () => {
  it('hold ending 01:00 tomorrow, +24 h → "Gia hạn đến 01:00 <day after tomorrow>", the toast says the same', async () => {
    const today = todayLocal();
    const r = mockControl.rsv.reservations.find((x) => x.guestName === 'Lê Minh')!;
    r.arrivalDate = addDays(today, 5); // the arrival-day cap (12:00) is far away
    r.hold = { ...r.hold!, expiresAt: `${addDays(today, 1)}T01:00:00+07:00`, extendedCount: 0 };
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Lê Minh' });
    await user.click(within(d).getByRole('button', { name: 'Gia hạn giữ chỗ (1 lần)' }));
    const dlg = await screen.findByRole('dialog', { name: 'Gia hạn giữ chỗ (1 lần)' });
    const time = `01:00 ${dayMonth(addDays(today, 2))}`;
    const submit = within(dlg).getByRole('button', { name: tv('rsv.extend_submit', { time }) });
    await user.click(submit);
    expect(
      await screen.findByText(tv('rsv.toast.hold_extended', { code: r.code, time })),
    ).toBeInTheDocument();
  });
});
