import { useI18n } from '@ottimo/i18n';
import { Button, Field } from '@ottimo/ui';
import { normalizeRecoveryCode, normalizeTotp } from '../pages/MfaStep';

/** Second S2 factor as the API wants it: exactly one of `totpCode`, `recoveryCode` (empty → neither). */
export function secondFactor(
  value: string,
  useRecovery: boolean,
): { totpCode?: string; recoveryCode?: string } {
  const v = useRecovery ? normalizeRecoveryCode(value) : normalizeTotp(value);
  if (!v) return {};
  return useRecovery ? { recoveryCode: v } : { totpCode: v };
}

/**
 * The second factor of S2 (SEC A.5): the TOTP code by default, "Lost your phone?" switches to a recovery
 * code. Used by the shared S2 dialog and by the forms that carry their own factor fields
 * (`changeMyPassword`, `trustCurrentDevice` – `currentPassword` + `totpCode`/`recoveryCode`). Shown only
 * when `Me.mfaEnabled`.
 */
export function SecondFactorField({
  value,
  onChange,
  useRecovery,
  onToggle,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  useRecovery: boolean;
  onToggle: () => void;
  error?: string;
}) {
  const { t } = useI18n();
  return (
    <>
      <Field
        label={t(useRecovery ? 'auth.code_label.recovery' : 'auth.code_label.totp')}
        required
        error={error}
      >
        {(p) => (
          <input
            {...p}
            className={useRecovery ? 'input mono' : 'input code-input'}
            name={useRecovery ? 'recoveryCode' : 'totpCode'}
            inputMode={useRecovery ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            spellCheck={false}
            maxLength={useRecovery ? 24 : 9}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </Field>
      <Button variant="ghost" size="sm" onClick={onToggle}>
        {t(useRecovery ? 'mfa.use_totp' : 'auth.totp.recovery')}
      </Button>
    </>
  );
}
