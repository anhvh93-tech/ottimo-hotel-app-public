import { useI18n } from '@ottimo/i18n';
import { Field } from '@ottimo/ui';

/** Contract 0.3.13 addendum 1 (`PaymentCreate.bankReference`): `^[A-Za-z0-9./_-]{1,64}$`. */
const NOT_ALLOWED = /[^A-Za-z0-9./_-]/g;

/** The value sent to the API: trimmed, absent when empty (the field is optional). */
export const bankReferenceOf = (value: string) => value.trim() || undefined;

/**
 * V5-51 (UXD copy-v1.0.5 9.1, `pay.bank_reference_optional`): the optional bank transaction reference of a bank
 * transfer / VietQR typed by hand – every box that records one, so the "Chờ đối soát" list has a number to match with
 * the statement. Never a card number: the server refuses one (422 CARD_NUMBER_DETECTED → `pay.bank_reference_card_like`
 * via FIELD_PAIR) and a duplicate (409 DUPLICATE_BANK_REFERENCE). Not on the confirmation of a pending VietQR code
 * (`confirmPaymentReceived` takes no reference).
 */
export function BankReferenceField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const { t } = useI18n();
  return (
    <Field
      label={t('pay.bank_reference_optional')}
      help={t('pay.bank_reference_help')}
      error={error}
    >
      {(p) => (
        <input
          {...p}
          className="input mono"
          maxLength={64}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(NOT_ALLOWED, ''))}
        />
      )}
    </Field>
  );
}
