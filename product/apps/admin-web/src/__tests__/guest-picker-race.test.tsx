import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Providers } from '../app/Providers';
import { addDays } from '../app/reservations';
import { todayLocal } from '../app/dates';
import { GuestPicker } from '../components/GuestPicker';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { useSession } from '../session/SessionProvider';
import { renderApp, tv } from '../test/render';

/**
 * CI 39010774166 – TC-L3-076 (desk-clock): "Thêm vào đơn" stayed disabled and no `dryRun` was sent.
 * Root cause: between the 300 ms pause and the search answer the picker already listed "no match" +
 * "Tạo nhanh khách …" as its only option; the results then slid in above it. A click that targeted the
 * first option in that moment opened "Hồ sơ khách mới" instead of picking the guest (no guest → no preview).
 * Now the options always belong to the text in the box: while its search runs the list only says "loading".
 */
function PickerHarness({ onSelect }: { onSelect: (name: string) => void }) {
  const s = useSession();
  if (s.status !== 'authenticated') return null;
  return <GuestPicker label="Khách đứng tên" onSelect={(g) => onSelect(g.displayName)} />;
}

/** Holds every guest search until `release()` – the stack's search answering after the 300 ms pause. */
function holdSearch() {
  let release!: () => void;
  const gate = new Promise<void>((done) => (release = done));
  let held = 0;
  server.use(
    http.get('*/v1/properties/:p/guests', async () => {
      held += 1;
      await gate;
      // fall through to the mock search
      return undefined;
    }),
  );
  return { release, held: () => held };
}

const renderPicker = () => {
  mockControl.signInAs('qa.fd');
  const picked: string[] = [];
  const user = userEvent.setup();
  render(
    <Providers>
      <MemoryRouter>
        <PickerHarness onSelect={(n) => picked.push(n)} />
      </MemoryRouter>
    </Providers>,
  );
  return { user, picked };
};

describe('GuestPicker – options belong to the text in the box (CI 39010774166, TC-L3-076)', () => {
  it('while the search runs: "loading", no "no match", nothing to click (no quick create)', async () => {
    const hold = holdSearch();
    const { user } = renderPicker();
    const box = await screen.findByRole('combobox', { name: 'Khách đứng tên' });
    await user.type(box, 'do mai');
    await waitFor(() => expect(hold.held()).toBeGreaterThan(0));
    const list = await screen.findByRole('listbox');
    expect(within(list).getByText(tv('common.loading'))).toBeInTheDocument();
    expect(within(list).queryAllByRole('option')).toHaveLength(0);
    expect(within(list).queryByText(tv('crm.empty_title', { q: 'do mai' }))).toBeNull();
    expect(within(list).queryByText(tv('crm.quick_create', { q: 'do mai' }))).toBeNull();
    // Enter / ArrowDown while loading pick nothing and open nothing.
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.queryByRole('dialog', { name: 'Hồ sơ khách mới' })).toBeNull();
    hold.release();
    await waitFor(() => expect(within(list).getAllByRole('option')).toHaveLength(3));
    expect(within(list).queryByText(tv('common.loading'))).toBeNull();
    expect(box).toHaveAttribute(
      'aria-activedescendant',
      within(list).getAllByRole('option')[0]!.id,
    );
  });

  it('the first option seen is clicked after the results arrive → that guest is picked, no "new guest" form', async () => {
    const hold = holdSearch();
    const { user, picked } = renderPicker();
    const box = await screen.findByRole('combobox', { name: 'Khách đứng tên' });
    await user.type(box, 'do mai');
    // Like Playwright: resolve "the first option whose name has the text" as soon as one shows up …
    const seen = screen.findAllByRole('option', { name: /do mai|Đỗ Mai Anh|Do Mai Anh/i });
    await waitFor(() => expect(hold.held()).toBeGreaterThan(0));
    await new Promise((done) => setTimeout(done, 100));
    // … the search answers, the list re-renders, then the click lands on the element found above.
    hold.release();
    const first = (await seen)[0]!;
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));
    await user.click(first);
    expect(picked).toEqual(['Đỗ Mai Anh']);
    expect(screen.queryByRole('dialog', { name: 'Hồ sơ khách mới' })).toBeNull();
  });

  it('text changed after the results came: the old results are not offered for the new text', async () => {
    const { user } = renderPicker();
    const box = await screen.findByRole('combobox', { name: 'Khách đứng tên' });
    await user.type(box, 'do mai');
    const list = await screen.findByRole('listbox');
    await waitFor(() => expect(within(list).getAllByRole('option')).toHaveLength(3));
    const hold = holdSearch();
    await user.type(box, 'zz');
    expect(within(screen.getByRole('listbox')).queryAllByRole('option')).toHaveLength(0);
    hold.release();
    // "do maizz" has no match → the empty sentence and quick create for the text in the box.
    expect(await screen.findByText(tv('crm.empty_title', { q: 'do maizz' }))).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: tv('crm.quick_create', { q: 'do maizz' }) }),
    ).toBeInTheDocument();
  });
});

/**
 * Suspect (a) of the CI report: `effectiveFrom` must be the API's business day, not the device clock –
 * on the desk-clock stack (and on a desk whose clock is off, or a page left open past midnight) the two
 * differ and the API refuses the preview (422 DATE_INVALID). Preview errors are always said, never silent.
 */
describe('Người ở – thêm người khi khách đang ở theo ngày nghiệp vụ của máy chủ', () => {
  const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
  const vnd = (amount: string) => tv('common.currency_vnd', { amount });

  /** The API's business day differs from the device day; it refuses any other `effectiveFrom`. */
  function serverDay(day: string) {
    const previews: Array<Record<string, unknown>> = [];
    server.use(
      http.get('*/v1/properties/:p/booking-rules', () =>
        HttpResponse.json({
          businessDate: day,
          holdHoursOptions: [12, 24, 48],
          holdHoursDefault: 24,
          holdLatestTimeOnArrival: '12:00',
          holdExtensionMaxHours: 24,
          quoteValidityDays: 3,
          shortStayDepositPct: 30,
          longStayCompareFromNights: 15,
          longStayRequiredFromNights: 28,
          noShowCallTime: '18:00',
          noShowMarkTime: '23:00',
          checkinTime: '14:00',
          checkoutTime: '12:00',
        }),
      ),
      http.post('*/v1/properties/:p/reservations/:r/party', async ({ request }) => {
        const body = (await request.clone().json()) as Record<string, unknown>;
        if (body.dryRun === true) previews.push(body);
        if (body.effectiveFrom !== day)
          return HttpResponse.json(
            {
              type: 'about:blank',
              title: 'Validation failed',
              status: 422,
              code: 'VALIDATION_FAILED',
              errors: [{ field: 'effectiveFrom', code: 'DATE_INVALID' }],
            },
            { status: 422, headers: { 'content-type': 'application/problem+json' } },
          );
        return undefined;
      }),
    );
    return previews;
  }

  /** Trần Thu Nga (room 101, standard 2) already has a companion: the next adult is above the standard. */
  const openParty = async (guest: string) => {
    const r = res(guest);
    mockControl.stay.party.get(r.id)!.push({
      id: '0192a1b0-0000-7000-8000-000000099004',
      role: 'companion',
      displayName: 'Người Đi Cùng Hai',
      priceAgeBand: 'adult',
    });
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: guest });
    await user.click(within(d).getByRole('button', { name: tv('rsv.add_person') }));
    const dlg = await screen.findByRole('dialog', { name: tv('rsv.party') });
    const box = within(dlg).getByRole('combobox', { name: /Khách đứng tên/ });
    await user.type(box, 'do mai');
    await user.click(await screen.findByRole('option', { name: /Đỗ Mai Anh/ }));
    return { r, user, dlg };
  };

  it('device day ≠ business day: the preview goes with the business day and shows the surcharge', async () => {
    // Trần Thu Nga is in house in room 101 until today + 2; the API is already on "tomorrow".
    const day = addDays(todayLocal(), 1);
    const previews = serverDay(day);
    const { dlg } = await openParty('Trần Thu Nga');
    // Room 101: standard 2, the OTA priced 2 guests, 1 night left from the business day → 150.000.
    expect(
      await within(dlg).findByText(
        tv('party.surcharge_line', { amount: vnd('150.000'), nights: 1 }),
      ),
    ).toBeInTheDocument();
    expect(previews.at(-1)).toMatchObject({ effectiveFrom: day, dryRun: true });
  });

  it('a refused preview is said in the dialog (retry), never a silent disabled button', async () => {
    let fail = true;
    server.use(
      http.post('*/v1/properties/:p/reservations/:r/party', async ({ request }) => {
        const body = (await request.clone().json()) as Record<string, unknown>;
        if (body.dryRun === true && fail)
          return HttpResponse.json(
            {
              type: 'about:blank',
              title: 'Validation failed',
              status: 422,
              code: 'VALIDATION_FAILED',
              errors: [{ field: 'effectiveFrom', code: 'DATE_INVALID' }],
            },
            { status: 422, headers: { 'content-type': 'application/problem+json' } },
          );
        return undefined;
      }),
    );
    const { user, dlg } = await openParty('Trần Thu Nga');
    expect(await within(dlg).findByText(tv('party.surcharge_preview_failed'))).toBeInTheDocument();
    expect(within(dlg).getByRole('button', { name: tv('rsv.add_submit') })).toBeDisabled();
    fail = false;
    await user.click(within(dlg).getByRole('button', { name: tv('common.retry') }));
    expect(
      await within(dlg).findByText(
        tv('party.surcharge_line', { amount: vnd('300.000'), nights: 2 }),
      ),
    ).toBeInTheDocument();
  });
});
