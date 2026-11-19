import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { businessDayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

// BUG-R5-017 (ARC 19/11, appendix of ARC-on-be-pr-200): only the long-stay cleaning table may be saved
// again the same day; any other key answers `effectiveFrom: ALREADY_IN_FORCE` and the dialog offers tomorrow.
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (key: string) => new RegExp(`^${esc(tv(key))}`);
type User = ReturnType<typeof renderApp>['user'];

async function openParam(user: User, name: string, tab?: string) {
  if (tab) await user.click(await screen.findByRole('tab', { name: tv(tab) }));
  await user.click(await screen.findByRole('button', { name: `${tv('rooms.edit')}: ${name}` }));
  return screen.findByRole('dialog', { name: tv('params.edit_title', { name }) });
}

async function save(user: User, dlg: HTMLElement, reason: string) {
  await user.type(within(dlg).getByLabelText(label('params.reason')), reason);
  await user.click(within(dlg).getByRole('button', { name: tv('params.save') }));
}

const lscfValue = () =>
  (mockControl.db as unknown as { params: Array<{ key: string; value: unknown }> }).params.find(
    (p) => p.key === 'long_stay_cleaning_fee_by_room',
  )!.value;

describe('BUG-R5-017 same-day saves on S24', () => {
  it('FE-2: the cleaning table saves twice today; each save says "in force now", never red', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const name = tv('params.k.long_stay_cleaning_fee_by_room');

    let dlg = await openParam(user, name, 'params.grp_statement');
    await user.type(
      within(dlg).getByLabelText(new RegExp(`^${esc(tv('params.lscf.room'))} 101`)),
      '150000',
    );
    await save(user, dlg, 'Go-live table');
    expect(await screen.findByText(tv('params.saved_now'))).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    dlg = await openParam(user, name);
    await user.type(
      within(dlg).getByLabelText(new RegExp(`^${esc(tv('params.lscf.room'))} 102`)),
      '200000',
    );
    await save(user, dlg, 'Add room 102');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getAllByText(tv('params.saved_now')).length).toBeGreaterThan(0);
    expect(screen.queryByText(tv('field.ALREADY_IN_FORCE'))).toBeNull();
    expect(lscfValue()).toEqual({ '101': 150000, '102': 200000 });
  });

  it('FE-1: another key saved twice today → the clear sentence + "Effective tomorrow" pre-fills T+1, then saves', async () => {
    const today = businessDayLocal();
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const name = 'Hiệu lực báo giá';

    let dlg = await openParam(user, name);
    await save(user, dlg, 'First change');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    dlg = await openParam(user, name);
    await save(user, dlg, 'Second change');
    expect(await within(dlg).findByText(tv('field.ALREADY_IN_FORCE'))).toBeVisible();
    const from = within(dlg).getByLabelText(label('config.effective_from'));
    expect(from).toHaveAttribute('aria-invalid', 'true');
    expect(from).toHaveValue(today);

    await user.click(within(dlg).getByRole('button', { name: tv('params.effective_tomorrow') }));
    expect(from).toHaveValue(addDays(today, 1));
    expect(within(dlg).queryByText(tv('field.ALREADY_IN_FORCE'))).toBeNull();
    expect(within(dlg).queryByRole('button', { name: tv('params.effective_tomorrow') })).toBeNull();

    await user.click(within(dlg).getByRole('button', { name: tv('params.save') }));
    const day = addDays(today, 1).split('-').reverse().join('/');
    expect(await screen.findByText(tv('params.saved', { name, date: day }))).toBeVisible();
  });
});
