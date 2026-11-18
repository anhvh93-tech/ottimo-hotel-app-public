// BUG-R5-012 (QA staging 18/11): the three monthly-statement parameters sat in "FOC, hoa hồng, phí kênh" as raw
// JSON. They now have their own tab, read as a sentence and edit as fields (OWN). All data is made up.
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp, tv } from '../test/render';

const tab = () => screen.findByRole('tab', { name: tv('params.grp_statement') });

async function edit(user: ReturnType<typeof renderApp>['user'], key: string) {
  const name = tv(`params.k.${key}`);
  await user.click(await screen.findByRole('button', { name: tv('params.edit_title', { name }) }));
  return screen.findByRole('dialog', { name: tv('params.edit_title', { name }) });
}

describe('BUG-R5-012 monthly-statement parameters', () => {
  it('own tab "Dài hạn – phiếu tháng", readable values, nothing of it left in the money tab', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    await user.click(await tab());
    const row = (k: string) => screen.getByText(tv(`params.k.${k}`)).closest('tr')!;
    expect(row('utility_unit_price').textContent).toContain(
      tv('params.stmt.price_value', { electricity: '4.000', water: '25.000' }),
    );
    expect(row('utility_vat_rate').textContent).toContain(
      tv('params.stmt.vat_value', { electricity: 8, water: 5 }),
    );
    const rules = row('monthly_statement_rules').textContent ?? '';
    expect(rules).toContain(tv('params.stmt.rent_advance'));
    expect(rules).toContain(tv('params.stmt.due_value', { day: 5 }));
    for (const k of ['utility_unit_price', 'utility_vat_rate', 'monthly_statement_rules'])
      expect(row(k).textContent).not.toMatch(/[{}"]/);
    await user.click(screen.getByRole('tab', { name: tv('params.grp_money') }));
    expect(screen.queryByText(tv('params.k.utility_vat_rate'))).toBeNull();
  });

  it('VAT % edits as two choices with an effective date; the saved value reads back as a sentence', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    await user.click(await tab());
    const dlg = await edit(user, 'utility_vat_rate');
    expect(within(dlg).queryByLabelText(tv('params.value_json'))).toBeNull();
    expect(within(dlg).getByText(tv('params.stmt.vat_help'))).toBeVisible();
    await user.selectOptions(
      within(dlg).getByLabelText(new RegExp(`^${tv('params.stmt.vat_electricity')}`)),
      '10',
    );
    expect(within(dlg).getByLabelText(/Hiệu lực từ/)).toBeVisible();
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Mức VAT mới');
    await user.click(within(dlg).getByRole('button', { name: tv('params.save') }));
    expect(await screen.findByText(/Đã lưu/)).toBeInTheDocument();
    const row = screen.getByText(tv('params.k.utility_vat_rate')).closest('tr')!;
    expect(row.textContent).toContain(tv('params.stmt.vat_value', { electricity: 10, water: 5 }));
  });

  it('unit prices: per-field check before sending (bounds of the BE hook)', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    await user.click(await tab());
    const dlg = await edit(user, 'utility_unit_price');
    const el = within(dlg).getByLabelText(new RegExp(`^${tv('params.stmt.electricity')}`));
    expect(el).toHaveValue('4000');
    await user.clear(el);
    await user.type(el, '0');
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Thử biên');
    await user.click(within(dlg).getByRole('button', { name: tv('params.save') }));
    expect(el).toHaveAttribute('aria-invalid', 'true');
    expect(within(dlg).queryByText(/Đã lưu/)).toBeNull();
  });

  it('manager reads the tab, cannot edit (OWN only)', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.mgr');
    await user.click(await tab());
    expect(screen.getByText(tv('params.k.utility_unit_price'))).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: tv('params.edit_title', { name: tv('params.k.utility_unit_price') }),
      }),
    ).toBeNull();
  });
});
