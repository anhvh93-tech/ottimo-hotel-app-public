// C0313-25 (UXD copy-v1.0.5 9.8, bản 1.8; SEC-responses 4.1 (a); BE PR #119 `r5-v09-reference`): a bank
// transaction reference the server refuses as a card number shows `pay.bank_reference_card_like` under the field and
// in the dialog alert – never the note sentence `error.CARD_NUMBER_DETECTED` ("Ô ghi chú…", "Xóa dãy số đó"). Free-text
// fields keep that sentence. Only public test card numbers are used here (SEC 4.3).
import { ApiError } from '@ottimo/api-client';
import { I18nProvider, loadLocale, translate } from '@ottimo/i18n';
import { renderHook, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { fieldErrorText, fieldErrors } from '../app/problem';
import { mockControl } from '../mocks/handlers';
import { useSubmit } from '../pages/stay/common';
import { renderApp, tv } from '../test/render';

const t = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);
const CARD_LIKE = 'pay.bank_reference_card_like';

const cardProblem = (errors: Array<{ field: string; code: string }>) =>
  new ApiError(422, {
    type: 'about:blank',
    title: 'Unprocessable',
    status: 422,
    code: 'CARD_NUMBER_DETECTED',
    errors,
  });

const photo = () =>
  new File([new Uint8Array([0xff, 0xd8, 0xff])], 'bien-nhan.jpg', { type: 'image/jpeg' });

describe('C0313-25 – câu lỗi theo cặp (ô, mã): fieldErrorText', () => {
  it('bankReference + CARD_NUMBER_DETECTED → pay.bank_reference_card_like, with or without a prefix', () => {
    for (const field of ['bankReference', 'body.bankReference', 'payment.bankReference']) {
      expect(fieldErrorText(t, { field, code: 'CARD_NUMBER_DETECTED' })).toBe(t(CARD_LIKE));
    }
    expect(t(CARD_LIKE)).not.toBe(t('error.CARD_NUMBER_DETECTED'));
  });

  it('free-text fields keep error.CARD_NUMBER_DETECTED; other codes on bankReference keep their own sentence', () => {
    for (const field of ['note', 'freeNote', 'replyNote', 'payment.note', 'bankReferenceNote']) {
      expect(fieldErrorText(t, { field, code: 'CARD_NUMBER_DETECTED' })).toBe(
        t('error.CARD_NUMBER_DETECTED'),
      );
    }
    expect(fieldErrorText(t, { field: 'bankReference', code: 'REQUIRED' })).toBe(
      t('common.required'),
    );
  });

  it('Desk EN: "Enter the last 8 digits of the transaction reference."', async () => {
    await loadLocale('en');
    const en = (k: string, a?: Record<string, string | number>) => translate('en', k, a);
    expect(fieldErrorText(en, { field: 'bankReference', code: 'CARD_NUMBER_DETECTED' })).toBe(
      en(CARD_LIKE),
    );
    expect(en(CARD_LIKE)).toMatch(/Enter the last 8 digits of the transaction reference\.$/);
  });
});

describe('C0313-25 – khung lỗi của hộp: useSubmit().text', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nProvider>{children}</I18nProvider>
  );

  it('every errors[] entry is bankReference → the VALIDATION_FAILED branch (no map: the field sentence)', () => {
    const { result } = renderHook(() => useSubmit(), { wrapper });
    const e = cardProblem([{ field: 'bankReference', code: 'CARD_NUMBER_DETECTED' }]);
    expect(result.current.text(e)).toBe(t(CARD_LIKE));
    expect(fieldErrors(t, e)).toEqual({ bankReference: t(CARD_LIKE) });
  });

  it('with a field map and the field on screen → "Còn {n} ô cần sửa", the sentence stays under the field', () => {
    const { result } = renderHook(() => useSubmit({ bound: ['payment.bankReference'] }), {
      wrapper,
    });
    const e = cardProblem([{ field: 'payment.bankReference', code: 'CARD_NUMBER_DETECTED' }]);
    expect(result.current.text(e)).toBe(t('error.VALIDATION_FAILED', { n: 1 }));
  });

  it('a card number in a note (or a note and the reference together) keeps error.CARD_NUMBER_DETECTED', () => {
    const { result } = renderHook(() => useSubmit(), { wrapper });
    for (const errors of [
      [{ field: 'note', code: 'CARD_NUMBER_DETECTED' }],
      [
        { field: 'bankReference', code: 'CARD_NUMBER_DETECTED' },
        { field: 'note', code: 'CARD_NUMBER_DETECTED' },
      ],
    ]) {
      expect(result.current.text(cardProblem(errors))).toBe(t('error.CARD_NUMBER_DETECTED'));
    }
  });
});

describe('C0313-25 – hộp Ghi đã hoàn chuyển khoản / qua máy POS (executeRefund)', () => {
  it('a card-shaped reference is refused with the reference sentence; nothing is paid; 8 digits then save', async () => {
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const kim = mockControl.rsv.reservations.find((r) => r.guestName === 'Kim Seo-yeon')!;
    const card = (await screen.findByText(new RegExp(`^${kim.code} · 1.200.000`))).closest('li')!;
    await user.click(within(card).getByRole('button', { name: tv('refund.execute_transfer') }));
    const dlg = await screen.findByRole('dialog', { name: tv('refund.execute_transfer') });
    const refInput = within(dlg).getByLabelText(
      new RegExp(tv('refund.bank_reference').replace(/[()]/g, '.')),
    );
    await user.upload(
      within(dlg).getByLabelText(new RegExp(tv('refund.proof').replace(/[()]/g, '.'))),
      photo(),
    );
    const refundsOf = () =>
      mockControl.stay.payments.filter((p) => p.type === 'refund' && p.folioId === kim.folioId);
    const before = refundsOf().length;

    for (const typed of ['4111-1111-1111-1111', '4111111111111111']) {
      await user.clear(refInput);
      await user.type(refInput, typed);
      await user.click(within(dlg).getByRole('button', { name: tv('refund.execute_transfer') }));
      // Under the field: the Field error (icon ✕ + sentence), tied to the input.
      await waitFor(() => expect(refInput).toHaveAccessibleDescription(tv(CARD_LIKE)));
      expect(refInput).toHaveAttribute('aria-invalid', 'true');
      // The dialog alert follows the VALIDATION_FAILED branch of a dialog without a field map.
      expect(within(dlg).getByRole('alert')).toHaveTextContent(tv(CARD_LIKE));
      expect(within(dlg).queryByText(tv('error.CARD_NUMBER_DETECTED'))).not.toBeInTheDocument();
      expect(dlg).not.toHaveTextContent(/Ô ghi chú|Xóa dãy số/);
      // The value stays in the field (no auto clear) and nothing was paid out.
      expect(refInput).toHaveValue(typed);
      expect(refundsOf()).toHaveLength(before);
    }

    // The way out the sentence gives: the last 8 digits (under 13, never refused again).
    await user.clear(refInput);
    await user.type(refInput, '11111111');
    await user.click(within(dlg).getByRole('button', { name: tv('refund.execute_transfer') }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: tv('refund.execute_transfer') }),
      ).not.toBeInTheDocument(),
    );
    expect(refundsOf()).toHaveLength(before + 1);
    expect(refundsOf().at(-1)).toMatchObject({ method: 'bank_transfer', note: '11111111' });
  });

  it('a 16-digit reference that fails Luhn is accepted (only a whole card number is refused)', async () => {
    const { user } = renderApp('/audit', 'qa.mgr');
    await user.click(await screen.findByRole('button', { name: tv('refund.title') }));
    const kim = mockControl.rsv.reservations.find((r) => r.guestName === 'Kim Seo-yeon')!;
    const card = (await screen.findByText(new RegExp(`^${kim.code} · 1.200.000`))).closest('li')!;
    await user.click(within(card).getByRole('button', { name: tv('refund.execute_transfer') }));
    const dlg = await screen.findByRole('dialog', { name: tv('refund.execute_transfer') });
    await user.upload(
      within(dlg).getByLabelText(new RegExp(tv('refund.proof').replace(/[()]/g, '.'))),
      photo(),
    );
    await user.type(
      within(dlg).getByLabelText(new RegExp(tv('refund.bank_reference').replace(/[()]/g, '.'))),
      '4111111111111112',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('refund.execute_transfer') }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: tv('refund.execute_transfer') }),
      ).not.toBeInTheDocument(),
    );
  });
});
