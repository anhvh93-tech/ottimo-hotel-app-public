// BUG-R4-037 (P0, money) – H09 Đặt phòng mới: the nightly rates the Direct price preview filled in stayed in the boxes
// after the desk switched to OTA / Nội bộ (or changed room / dates), and were sent as `nightlyRates` with
// `edited:false` – stored by the server as calendar rates of the OTA / internal booking (BUG-R2-017: an OTA booking
// with no typed rate is priced from the OTA calendar; an internal one is 0 đ).
// Every case waits for the preview to fill the boxes BEFORE touching the channel – a person is always slower than the
// 300 ms debounce (QA). The two flaky cases A-20 (`s2-fix`) and US-139 (`booking`) hit the same window under load.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, onTestFinished } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays, dayMonth } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];
type Sent = { nightlyRates?: { date: string; amountVnd: number; edited: boolean }[] } & Record<
  string,
  unknown
>;

/** Bodies of `POST …/reservations` (B1) sent by the Desk in this case. */
function createBodies() {
  const sent: Sent[] = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method === 'POST' && /\/reservations$/.test(new URL(request.url).pathname))
      void request
        .clone()
        .json()
        .then((b: Sent) => sent.push(b));
  };
  server.events.on('request:start', on);
  onTestFinished(() => {
    server.events.removeListener('request:start', on);
  });
  return sent;
}

const rateBox = (dlg: HTMLElement, date: string) =>
  within(dlg).getByLabelText(`${tv('rate.pre_tier')} ${dayMonth(date)}`) as HTMLInputElement;

async function openBooking(user: User) {
  await screen.findByRole('grid');
  await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
  return screen.findByRole('dialog', { name: /Đặt phòng mới/ });
}

/** The preview has priced the default stay (Direct, today, 1 night, first room): today's box holds its rate. */
async function previewFilled(dlg: HTMLElement) {
  await waitFor(() => expect(rateBox(dlg, todayLocal()).value).not.toBe(''), { timeout: 3000 });
  return rateBox(dlg, todayLocal()).value;
}

async function pickRoom(user: User, dlg: HTMLElement, no: string) {
  const room = within(dlg).getByLabelText(/^Căn/);
  await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
  await user.selectOptions(room, within(room).getByRole('option', { name: new RegExp(`^${no} `) }));
}

async function pickGuest(user: User, dlg: HTMLElement) {
  await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Anna');
  await user.click(await screen.findByRole('option', { name: /Anna Martin/ }));
}

describe('BUG-R4-037 – rates filled by the Direct preview never travel to OTA / Nội bộ', () => {
  it('OTA, 1 night today, another room: no nightlyRates sent (server prices from the OTA calendar)', async () => {
    pinDaytime();
    const sent = createBodies();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    await pickRoom(user, dlg, '203');
    await pickGuest(user, dlg);
    await user.type(within(dlg).getByLabelText(/Mã đặt phòng OTA/), 'BK-037-1');
    // the box of a rate the desk never typed is empty again
    expect(rateBox(dlg, todayLocal())).toHaveValue('');
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    expect(sent).toHaveLength(1);
    expect(sent[0]!.nightlyRates).toBeUndefined();
  });

  it('OTA, 2 nights, room 201 above its maximum: no "Nhập giá mỗi đêm" – the capacity warning shows', async () => {
    pinDaytime();
    const sent = createBodies();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    await pickRoom(user, dlg, '201');
    fireEvent.change(within(dlg).getByLabelText(tv('booking.field.departure')), {
      target: { value: addDays(todayLocal(), 2) },
    });
    const inc = within(dlg).getByRole('button', { name: 'Tăng Người lớn (từ 12 tuổi)' });
    await user.click(inc);
    await user.click(inc);
    await pickGuest(user, dlg);
    await user.type(within(dlg).getByLabelText(/Mã đặt phòng OTA/), 'BK-037-2');
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(
      await within(dlg).findByText(tv('booking.capacity_warning', { room: '201', max: 3, n: 4 })),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('booking.error.rate_empty'))).toBeNull();
    await user.type(
      within(dlg).getByLabelText(new RegExp(`^${tv('booking.capacity_reason')}`)),
      'Khách đã đặt 4 người trên kênh',
    );
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    await screen.findByRole('dialog', { name: 'Anna Martin' });
    expect(sent.at(-1)!.nightlyRates).toBeUndefined();
  });

  it('Nội bộ, 1 night: no nightlyRates sent (the server writes 0 đ)', async () => {
    pinDaytime();
    const sent = createBodies();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await user.click(within(dlg).getByRole('button', { name: tv('bk.ch_internal') }));
    // 101 (first room) is taken tonight in the seed – a free room, so the request is sent
    await pickRoom(user, dlg, '203');
    await user.type(within(dlg).getByLabelText(new RegExp(`^${tv('crm.f_note')}`)), 'Khách mời');
    await pickGuest(user, dlg);
    expect(rateBox(dlg, todayLocal())).toHaveValue('');
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    expect(sent).toHaveLength(1);
    expect(sent[0]!.nightlyRates).toBeUndefined();
  });
});

describe('BUG-R4-037 – a typed rate is kept, an untyped one follows the preview of the stay on screen', () => {
  it('Trực tiếp: another room → the figure of the old room leaves at once, the new preview fills the box', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    const first = await previewFilled(dlg);
    await pickRoom(user, dlg, '301');
    // never the figure of room 101 for room 301 – empty until the preview of 301 is back
    expect(rateBox(dlg, todayLocal()).value).not.toBe(first);
    await waitFor(() => expect(rateBox(dlg, todayLocal()).value).not.toBe(''), { timeout: 3000 });
    expect(rateBox(dlg, todayLocal()).value).not.toBe(first);
  });

  it('OTA and back to Trực tiếp: the box is filled again by the preview of the direct stay', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    const first = await previewFilled(dlg);
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    expect(rateBox(dlg, todayLocal())).toHaveValue('');
    await user.click(within(dlg).getByRole('button', { name: tv('bk.ch_direct') }));
    await waitFor(() => expect(rateBox(dlg, todayLocal())).toHaveValue(first), { timeout: 3000 });
  });
});

type Group = 'direct' | 'agent' | 'ota' | 'internal';
const channelButton: Record<Group, string> = {
  direct: 'bk.ch_direct',
  agent: 'bk.ch_agent',
  ota: 'bk.ch_ota',
  internal: 'bk.ch_internal',
};
const pickChannel = (user: User, dlg: HTMLElement, g: Group) =>
  user.click(within(dlg).getByRole('button', { name: tv(channelButton[g]) }));
async function typeRate(user: User, dlg: HTMLElement, date: string, value: string) {
  const box = rateBox(dlg, date);
  await user.clear(box);
  await user.type(box, value);
}
const clearedNote = (dlg: HTMLElement) =>
  within(dlg).queryByText(tv('booking.rates_cleared_channel'));
/** FB-R4-UXD-FE-PR70-07: the sentence of a room change into another room group. */
const roomNote = (dlg: HTMLElement, room: string) =>
  within(dlg).queryByText(tv('booking.rates_cleared_room_group', { room }));
/** "Tạo đơn" is back from waiting: the preview of the stay on screen answered (Trực tiếp / CTV). */
const previewSettled = (dlg: HTMLElement) =>
  waitFor(() => expect(within(dlg).getByRole('button', { name: 'Tạo đơn' })).toBeEnabled(), {
    timeout: 3000,
  });
/** Answers of `calculateQuote` in this case. */
function quoteReads() {
  const n = { count: 0 };
  const on = ({ request }: { request: Request }) => {
    if (request.method === 'POST' && /\/quotes\/calculate$/.test(new URL(request.url).pathname))
      n.count += 1;
  };
  server.events.on('response:mocked', on);
  onTestFinished(() => {
    server.events.removeListener('response:mocked', on);
  });
  return n;
}

describe('DOM ARC-03 / UXD-05 – which changes drop the rates the desk typed', () => {
  const today = () => todayLocal();

  it.each<[Group, Group]>([
    ['direct', 'ota'],
    ['direct', 'internal'],
    ['agent', 'ota'],
    ['ota', 'direct'],
    ['internal', 'agent'],
    ['ota', 'internal'],
  ])(
    'channel %s → %s: the typed rate is dropped, the status sentence says so',
    async (from, to) => {
      pinDaytime();
      const { user } = renderApp('/rack', 'qa.fd');
      const dlg = await openBooking(user);
      await previewFilled(dlg);
      if (from !== 'direct') await pickChannel(user, dlg, from);
      await pickRoom(user, dlg, '203');
      if (from === 'direct' || from === 'agent') await previewSettled(dlg);
      await typeRate(user, dlg, today(), '880000');
      expect(clearedNote(dlg)).toBeNull();
      await pickChannel(user, dlg, to);
      const note = clearedNote(dlg)!;
      expect(note).toBeInTheDocument();
      expect(note).toHaveAttribute('role', 'status');
      expect(note).not.toHaveClass('err');
      if (to === 'ota' || to === 'internal') expect(rateBox(dlg, today())).toHaveValue('');
      else {
        // Trực tiếp / CTV: the preview of the new stay fills the box again – never the typed figure
        await previewSettled(dlg);
        await waitFor(() => expect(rateBox(dlg, today()).value).not.toBe(''));
        expect(rateBox(dlg, today())).not.toHaveValue('880000');
      }
      // typing again (or another channel change) takes the sentence away
      await typeRate(user, dlg, today(), '700000');
      expect(clearedNote(dlg)).toBeNull();
    },
  );

  it('Trực tiếp → OTA → Trực tiếp at once: a new preview fills the boxes again, never empty, never the typed figure', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    const first = await previewFilled(dlg);
    await typeRate(user, dlg, today(), '880000');
    await pickChannel(user, dlg, 'ota');
    expect(clearedNote(dlg)).toBeInTheDocument();
    await pickChannel(user, dlg, 'direct');
    await waitFor(() => expect(rateBox(dlg, today())).toHaveValue(first), { timeout: 3000 });
    await previewSettled(dlg);
    // the sentence went with the second channel change (UXD): nothing typed was dropped by that one
    expect(clearedNote(dlg)).toBeNull();
  });

  it('a channel change with nothing typed says nothing', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await pickChannel(user, dlg, 'ota');
    expect(clearedNote(dlg)).toBeNull();
  });

  it('Trực tiếp ↔ CTV keeps the typed rate', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await typeRate(user, dlg, today(), '880000');
    await pickChannel(user, dlg, 'agent');
    await previewSettled(dlg);
    expect(rateBox(dlg, today())).toHaveValue('880000');
    await pickChannel(user, dlg, 'direct');
    await previewSettled(dlg);
    expect(rateBox(dlg, today())).toHaveValue('880000');
    expect(clearedNote(dlg)).toBeNull();
  });

  it('the number of guests keeps the typed rate (a new preview does not overwrite it)', async () => {
    pinDaytime();
    const reads = quoteReads();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await typeRate(user, dlg, today(), '880000');
    const before = reads.count;
    await user.click(within(dlg).getByRole('button', { name: 'Tăng Người lớn (từ 12 tuổi)' }));
    await waitFor(() => expect(reads.count).toBeGreaterThan(before), { timeout: 3000 });
    await previewSettled(dlg);
    expect(rateBox(dlg, today())).toHaveValue('880000');
  });

  it('dates: a typed night still in the stay is kept, a new night takes the preview rate', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await typeRate(user, dlg, today(), '880000');
    fireEvent.change(within(dlg).getByLabelText(tv('booking.field.departure')), {
      target: { value: addDays(today(), 2) },
    });
    await previewSettled(dlg);
    await waitFor(() => expect(rateBox(dlg, addDays(today(), 1)).value).not.toBe(''));
    expect(rateBox(dlg, today())).toHaveValue('880000');
  });

  it('Trực tiếp, a room of the same group (101 → 203) keeps the typed rate', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await typeRate(user, dlg, today(), '880000');
    await pickRoom(user, dlg, '203');
    await previewSettled(dlg);
    expect(rateBox(dlg, today())).toHaveValue('880000');
    expect(roomNote(dlg, '203')).toBeNull();
  });

  it.each<Group>(['direct', 'agent'])(
    '%s, a room of another group (203 → 301) drops it, the new room is priced from its list (BR-429 (g)) and the sentence says so',
    async (g) => {
      pinDaytime();
      const { user } = renderApp('/rack', 'qa.fd');
      const dlg = await openBooking(user);
      await previewFilled(dlg);
      if (g !== 'direct') await pickChannel(user, dlg, g);
      await pickRoom(user, dlg, '203');
      await previewSettled(dlg);
      await typeRate(user, dlg, today(), '880000');
      await pickRoom(user, dlg, '301');
      expect(rateBox(dlg, today())).not.toHaveValue('880000');
      // FB-R4-UXD-FE-PR70-07: the desk is told the agreed rate is gone – status, not an error
      const note = roomNote(dlg, '301')!;
      expect(note).toBeInTheDocument();
      expect(note).toHaveAttribute('role', 'status');
      expect(note).not.toHaveClass('err');
      expect(clearedNote(dlg)).toBeNull();
      await previewSettled(dlg);
      await waitFor(() => expect(rateBox(dlg, today()).value).not.toBe(''));
      expect(rateBox(dlg, today())).not.toHaveValue('880000');
      // typing again takes the sentence away
      await typeRate(user, dlg, today(), '700000');
      expect(roomNote(dlg, '301')).toBeNull();
    },
  );

  it('the room sentence goes on the next room change; another group with nothing typed says nothing', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await pickRoom(user, dlg, '301');
    expect(roomNote(dlg, '301')).toBeNull();
    await previewSettled(dlg);
    await typeRate(user, dlg, today(), '880000');
    await pickRoom(user, dlg, '203');
    expect(roomNote(dlg, '203')).toBeInTheDocument();
    await pickRoom(user, dlg, '302');
    expect(roomNote(dlg, '203')).toBeNull();
    expect(roomNote(dlg, '302')).toBeNull();
  });

  it('one sentence: after a channel drop, a room change keeps the channel sentence (never both)', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await pickChannel(user, dlg, 'ota');
    await pickRoom(user, dlg, '203');
    await typeRate(user, dlg, today(), '880000');
    await pickChannel(user, dlg, 'direct');
    expect(clearedNote(dlg)).toBeInTheDocument();
    await pickRoom(user, dlg, '301');
    expect(clearedNote(dlg)).toBeInTheDocument();
    expect(roomNote(dlg, '301')).toBeNull();
  });

  it('OTA, another room (any group) keeps the typed rate – the OTA price goes with the booking', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await pickChannel(user, dlg, 'ota');
    await pickRoom(user, dlg, '203');
    await typeRate(user, dlg, today(), '880000');
    await pickRoom(user, dlg, '301');
    expect(rateBox(dlg, today())).toHaveValue('880000');
  });
});

describe("BUG-R4-037 (BE 1.8) – Trực tiếp: never the previous stay's figures while the new preview is on its way", () => {
  it('another room, one night typed before its preview is back → "Tạo đơn" waits; then the new room\'s rate is sent', async () => {
    pinDaytime();
    const sent = createBodies();
    const d1 = todayLocal();
    const d2 = addDays(d1, 1);
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await pickRoom(user, dlg, '203');
    fireEvent.change(within(dlg).getByLabelText(tv('booking.field.departure')), {
      target: { value: addDays(d1, 2) },
    });
    await waitFor(() => expect(rateBox(dlg, d2).value).not.toBe(''), { timeout: 3000 });
    const old2 = rateBox(dlg, d2).value;
    // the preview of the next room is held until `release()` – the window is as long as the test wants
    const r301 = mockControl.db.rooms.find((x) => x.roomNo === '301')!;
    let release!: () => void;
    const gate = new Promise<void>((ok) => (release = ok));
    server.use(
      http.post('*/quotes/calculate', async ({ request }) => {
        const b = (await request.clone().json()) as { roomId?: string };
        if (b.roomId !== r301.id) return undefined;
        await gate;
        return undefined;
      }),
    );
    await pickRoom(user, dlg, '301');
    await user.clear(rateBox(dlg, d1));
    await user.type(rateBox(dlg, d1), '990000');
    // room 203's figure is not shown for 301, and "Tạo đơn" waits (DS busy) – pressing it sends nothing
    expect(rateBox(dlg, d2)).toHaveValue('');
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Trần Minh');
    await user.click(await screen.findByRole('option', { name: /Trần Minh Khoa/ }));
    const waiting = within(dlg).getByRole('button', { name: tv('common.loading') });
    expect(waiting).toHaveAttribute('aria-busy', 'true');
    expect(waiting).toBeDisabled();
    await user.click(waiting);
    expect(sent).toHaveLength(0);
    release();
    const create = await within(dlg).findByRole('button', { name: 'Tạo đơn' });
    await waitFor(() => expect(create).toBeEnabled());
    // typed night kept, the other one now holds the rate of 301
    expect(rateBox(dlg, d1)).toHaveValue('990000');
    await waitFor(() => expect(rateBox(dlg, d2).value).not.toBe(''));
    const new2 = rateBox(dlg, d2).value;
    expect(new2).not.toBe(old2);
    await user.click(create);
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]!.roomId).toBe(r301.id);
    expect(sent[0]!.nightlyRates).toEqual([
      { date: d1, amountVnd: 990_000, edited: true },
      { date: d2, amountVnd: Number(new2.replace(/\D/g, '')), edited: false },
    ]);
  });
});

/** The next `POST …/reservations` answers 422 VALIDATION_FAILED with these field errors (then the mock again). */
function refuseNextCreate(
  errors: { field: string; code: string }[],
  extra: Record<string, unknown> = {},
) {
  server.use(
    http.post(
      '*/v1/properties/:propertyId/reservations',
      () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Validation failed',
            status: 422,
            code: 'VALIDATION_FAILED',
            errors,
            ...extra,
          },
          { status: 422, headers: { 'content-type': 'application/problem+json' } },
        ),
      { once: true },
    ),
  );
}

describe('FB-R4-UXD-FE-PR70-01 – a 422 on nightlyRates is said under the rate table, never swallowed', () => {
  async function otaReady(user: User, dlg: HTMLElement, ref: string) {
    await previewFilled(dlg);
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    await pickRoom(user, dlg, '203');
    await pickGuest(user, dlg);
    await user.type(within(dlg).getByLabelText(/Mã đặt phòng OTA/), ref);
  }
  /** The error line of the "Giá mỗi đêm" field. */
  const rateFieldError = (dlg: HTMLElement) =>
    within(dlg)
      .getByText(tv('booking.field.rate'), { selector: '.lbl' })
      .closest<HTMLElement>('.field')!;

  it('OTA left empty, room group without an OTA base rate (422 nightlyRates REQUIRED) → "Nhập giá mỗi đêm"', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await otaReady(user, dlg, 'BK-070-1');
    refuseNextCreate([{ field: 'nightlyRates', code: 'REQUIRED' }], {
      detail: 'ota_base_rate is not configured for this room group',
    });
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    const field = rateFieldError(dlg);
    expect(await within(field).findByText(tv('booking.error.rate_empty'))).toBeInTheDocument();
    expect(field).toHaveClass('invalid');
    expect(screen.queryByText(/^Đã tạo đơn OTM-0\d+$/)).toBeNull();
  });

  it('every other nightlyRates 422 also shows: AMOUNT_NOT_POSITIVE, RATE_OUT_OF_RANGE, a night of the list', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await otaReady(user, dlg, 'BK-070-2');
    const box = rateBox(dlg, todayLocal());
    await user.type(box, '910000');
    // body.-prefixed field (schema layer) of the first night → under that night's box
    refuseNextCreate([{ field: 'body.nightlyRates[0].amountVnd', code: 'AMOUNT_NOT_POSITIVE' }]);
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(
      await within(box.closest('td') as HTMLElement).findByText(tv('booking.error.rate_empty')),
    ).toBeInTheDocument();
    // the hard rate bounds (422 RATE_OUT_OF_RANGE on `nightlyRates`) → under the table, with the bounds
    refuseNextCreate([{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE' }], {
      min: 500000,
      max: 900000,
    });
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(
      await within(rateFieldError(dlg)).findByText(
        tv('booking.error.rate_range', { min: '500000', max: '900000', group: '' }),
      ),
    ).toBeInTheDocument();
  });
});

describe('BUG-R4-037 – desk workaround on v1.0.3 (clear every rate box after choosing OTA / Nội bộ)', () => {
  it('OTA: boxes cleared by hand → no nightlyRates, no blocking sentence', async () => {
    pinDaytime();
    const sent = createBodies();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    await pickRoom(user, dlg, '203');
    fireEvent.change(within(dlg).getByLabelText(tv('booking.field.departure')), {
      target: { value: addDays(todayLocal(), 2) },
    });
    for (const d of [todayLocal(), addDays(todayLocal(), 1)]) await user.clear(rateBox(dlg, d));
    await pickGuest(user, dlg);
    await user.type(within(dlg).getByLabelText(/Mã đặt phòng OTA/), 'BK-037-W1');
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    expect(within(document.body).queryByText(tv('booking.error.rate_empty'))).toBeNull();
    expect(sent.at(-1)!.nightlyRates).toBeUndefined();
  });

  it('OTA: every night typed by hand → sent as typed, edited:true', async () => {
    pinDaytime();
    const sent = createBodies();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    await pickRoom(user, dlg, '203');
    const box = rateBox(dlg, todayLocal());
    await user.clear(box);
    await user.type(box, '910000');
    await pickGuest(user, dlg);
    await user.type(within(dlg).getByLabelText(/Mã đặt phòng OTA/), 'BK-037-W2');
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    expect(sent.at(-1)!.nightlyRates).toEqual([
      { date: todayLocal(), amountVnd: 910_000, edited: true },
    ]);
  });

  it('Nội bộ: boxes cleared by hand → no nightlyRates', async () => {
    pinDaytime();
    const sent = createBodies();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await previewFilled(dlg);
    await user.click(within(dlg).getByRole('button', { name: tv('bk.ch_internal') }));
    // 101 (first room) is taken tonight in the seed – a free room, so the request is sent
    await pickRoom(user, dlg, '203');
    await user.clear(rateBox(dlg, todayLocal()));
    await user.type(within(dlg).getByLabelText(new RegExp(`^${tv('crm.f_note')}`)), 'Khách mời');
    await pickGuest(user, dlg);
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    expect(sent.at(-1)!.nightlyRates).toBeUndefined();
  });
});
