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
  it('direct / CTV part with noticeDays → "(báo trước N ngày)"', () => {
    expect(lineLabel(t, line({ noticeDays: 2 }))).toBe(
      t('bill.line.early_departure_fee_notice', { noticeDays: 2 }),
    );
  });

  it('OTA part without noticeDays (absent or null) → the plain label', () => {
    expect(lineLabel(t, line({}))).toBe(t('bill.line.early_departure_fee'));
    expect(lineLabel(t, line({ noticeDays: null }))).toBe(t('bill.line.early_departure_fee'));
  });
});
