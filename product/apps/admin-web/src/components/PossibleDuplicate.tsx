import { useI18n } from '@ottimo/i18n';
import { Chip } from '@ottimo/ui';

/**
 * 5B-1 (SEC S4; UXD copy-v1.0.5 9.1 "Có thể trùng"): `possibleDuplicateCodes` of a payment (Đối soát) or a refund request
 * (Cần duyệt, Hoàn tiền) – another transfer of the same amount within 24 hours on another booking. Booking codes only;
 * it never blocks a button (a guest may really pay twice). Opening the chip shows the explanation.
 */
export function PossibleDuplicate({ codes }: { codes?: readonly string[] | null }) {
  const { t } = useI18n();
  const list = (codes ?? []).filter(Boolean);
  if (!list.length) return null;
  return (
    <details className="li-s">
      <summary>
        <Chip tone="warn">{t('pay.possible_duplicate')}</Chip>
      </summary>
      <p className="li-s">{t('pay.possible_duplicate_note', { codes: list.join(', ') })}</p>
    </details>
  );
}
