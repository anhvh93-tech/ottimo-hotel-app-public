// UXD FB-R5-UXD-FE-130-01 (Minor) and 130-04 (Suggestion), `rounds/round-05/reviews/UXD-on-fe-pr-130.md`:
// - the Hoàn tiền tab used to squeeze each row's text to ~90 px at 390 px (chip and buttons on the same line) – rows now
//   use the request-row pattern of Yêu cầu từ website (`.req-row` / `.req-acts`): at ≤ 520 px the text takes the whole
//   row, the state and buttons go under it, right-aligned. No colour, no copy change.
// - field errors and alert bodies wrap with `text-wrap: pretty` (no one-word last line; ignored where unsupported).
import { screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

const css = () =>
  readFileSync(join(__dirname, '../../../../packages/ui/src/styles/app.css'), 'utf8');

describe('FB-R5-UXD-FE-130-01 – Hoàn tiền rows at 390 px', () => {
  it('each refund row: text block, then the state chip and buttons in their own block (under the text at ≤ 520 px)', async () => {
    const { user } = renderApp('/audit', 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const nga = mockControl.rsv.reservations.find((r) => r.guestName === 'Trần Thu Nga')!;
    const card = (await screen.findByText(new RegExp(`^${nga.code} · 500.000`))).closest('li')!;
    const row = card.querySelector('.req-row')!;
    expect(row).not.toBeNull();
    const text = row.querySelector(':scope > .grow')!;
    const acts = row.querySelector(':scope > .req-acts')!;
    expect(text).toHaveTextContent(nga.code);
    const pay = within(card).getByRole('button', { name: tv('refund.execute_cash') });
    expect(pay.closest('.req-acts')).toBe(acts);
    expect(
      within(acts as HTMLElement).getByRole('button', { name: tv('refund.set_destination') }),
    ).toBeInTheDocument();
    // the state chip sits with the buttons, not in the text column
    expect(acts.querySelector('.chip')).not.toBeNull();
    expect(text.querySelector('.chip')).toBeNull();
  });

  it('CSS: the request-row rules it relies on are there (text shrinks, actions take a row of their own ≤ 520 px)', () => {
    const c = css();
    expect(c).toMatch(/\.task > \.grow,\s*\.req-row > \.grow \{\s*min-width: 0;/);
    expect(c).toMatch(
      /@media \(max-width: 520px\) \{[^@]*\.req-row \{\s*flex-wrap: wrap;[^@]*\.req-row > \.req-acts \{\s*flex-basis: 100%;\s*justify-content: flex-end;/,
    );
  });
});

describe('FB-R5-UXD-FE-130-04 – text-wrap: pretty', () => {
  it('field error text and alert body', () => {
    expect(css()).toMatch(/\.field \.err > span,\s*\.alert \.txt \{\s*text-wrap: pretty;/);
  });
});
