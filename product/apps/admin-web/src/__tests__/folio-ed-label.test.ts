import type { FolioLine } from '@ottimo/api-client';
import { translate } from '@ottimo/i18n';
import { describe, expect, it } from 'vitest';
import { lineLabel } from '../app/folio';

const t = (key: string, args?: Record<string, string | number>) => translate('vi', key, args);
const line = (labelParams: Record<string, unknown>) =>
  ({
    id: 'l1',
    category: 'early_departure_fee',
    description: 'early_departure_fee',
    amountVnd: 500_000,
    lineState: 'posted',
    labelKey: 'bill.line.early_departure_fee',
    labelParams,
  }) as unknown as FolioLine;

describe('bill line "Phí trả phòng sớm" (ARC 0.3.9 bổ sung 2, BR-428-09)', () => {
  it('direct / CTV part with noticeDays → "(báo trước N ngày)" (copy-v1.0.5 4.1: _one / _other)', () => {
    expect(lineLabel(t, line({ noticeDays: 2 }))).toBe(
      t('bill.line.early_departure_fee_notice_other', { noticeDays: 2 }),
    );
    expect(lineLabel(t, line({ noticeDays: 1 }))).toBe(
      t('bill.line.early_departure_fee_notice_one', { noticeDays: 1 }),
    );
  });

  it('copy-v1.0.5 4.1: noticeDays 0 → "báo trong ngày rời", never "báo trước 0 ngày"', () => {
    expect(lineLabel(t, line({ noticeDays: 0 }))).toBe(t('bill.line.early_departure_fee_same_day'));
    expect(lineLabel(t, line({ noticeDays: 0 }))).not.toMatch(/0/);
  });

  it('copy-v1.0.5 4.1: the EN bill picks the singular for 1 day and the plural otherwise', () => {
    const en = (key: string, args?: Record<string, string | number>) => translate('en', key, args);
    expect(lineLabel(en, line({ noticeDays: 1 }))).toBe(
      translate('en', 'bill.line.early_departure_fee_notice_one', { noticeDays: 1 }),
    );
    expect(lineLabel(en, line({ noticeDays: 3 }))).toBe(
      translate('en', 'bill.line.early_departure_fee_notice_other', { noticeDays: 3 }),
    );
    expect(lineLabel(en, line({ noticeDays: 0 }))).toBe(
      translate('en', 'bill.line.early_departure_fee_same_day'),
    );
  });

  it('OTA part without noticeDays (absent or null) → the plain label', () => {
    expect(lineLabel(t, line({}))).toBe(t('bill.line.early_departure_fee'));
    expect(lineLabel(t, line({ noticeDays: null }))).toBe(t('bill.line.early_departure_fee'));
  });
});
