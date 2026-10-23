import { newIdempotencyKey, type Role, type StrongReauth, type User } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Checkbox, Field, Modal } from '@ottimo/ui';
import { useState, type FormEvent } from 'react';
import { api } from '../app/api';
import { fieldErrors, problemView } from '../app/problem';
import { isStrongReauthError, StrongReauthDialog } from '../components/StrongReauthDialog';
import { usePropertyId, useSession } from '../session/SessionProvider';
import { generateTempPassword } from './UsersPage';

/** Same rule as the server `createSchema` (trim + lower case, 3–64, a–z 0–9 . _ -). */
const USERNAME = /^[a-z0-9._-]{3,64}$/;
const PASSWORD_MIN = 10;

type Errors = Partial<Record<'displayName' | 'username' | 'initialPassword' | 'roles', string>>;

/**
 * US-008 (S26 "Thêm người dùng", A100 – owner only): display name, username, at least one role at this property
 * and a temporary password (pre-filled with a generated one, editable). Local checks mirror the server policy so an
 * S2 attempt is not spent on a form error; then the shared S2 dialog (FE-A `StrongReauthDialog`, SEC 06.26) sends
 * `createUser` with `reauth` inside the same request. After S2 the server may still answer a field error
 * (password policy 422, `USERNAME_TAKEN` 409 – US-008 AC2): the S2 dialog closes and the message sits at the input.
 * The account must change the temporary password at first sign-in (server `must_change_password`, US-001 AC4).
 */
export function AddUserDialog({
  assignable,
  onClose,
  onDone,
}: {
  assignable: Role[];
  onClose: () => void;
  onDone: (user: User, tempPassword: string) => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { property } = useSession();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(() => generateTempPassword());
  const [roles, setRoles] = useState<Role[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [s2, setS2] = useState(false);

  const cleanUsername = username.trim().toLowerCase();

  const check = (): Errors => {
    const e: Errors = {};
    if (!displayName.trim()) e.displayName = t('common.required');
    if (!cleanUsername) e.username = t('common.required');
    else if (!USERNAME.test(cleanUsername)) e.username = t('users.f_username_invalid');
    if (password.length < PASSWORD_MIN)
      e.initialPassword = t('field_error.password_short', { min: PASSWORD_MIN });
    else if (cleanUsername && password.toLowerCase().includes(cleanUsername))
      e.initialPassword = t('field.PASSWORD_SAME_AS_USERNAME');
    else if (/ottimo/i.test(password)) e.initialPassword = t('field.PASSWORD_TOO_COMMON');
    if (!roles.length) e.roles = t('users.roles_min');
    return e;
  };

  const next = (ev: FormEvent) => {
    ev.preventDefault();
    const e = check();
    setErrors(e);
    setBanner(null);
    if (Object.keys(e).length === 0) setS2(true);
  };

  const create = async (reauth: StrongReauth) => {
    try {
      const out = await api.createUser(
        {
          username: cleanUsername,
          displayName: displayName.trim(),
          initialPassword: password,
          roles: roles.map((role) => ({ propertyId, role })),
          reauth,
        },
        // Each S2 attempt carries new factors – a new command, a new key.
        newIdempotencyKey(),
      );
      setS2(false);
      onDone(out.data, password);
    } catch (err) {
      if (isStrongReauthError(err)) throw err;
      setS2(false);
      const fe = fieldErrors(t, err);
      const known: Errors = {};
      for (const k of ['displayName', 'username', 'initialPassword', 'roles'] as const)
        if (fe[k]) known[k] = fe[k];
      setErrors(known);
      if (!Object.keys(known).length) setBanner(problemView(t, err).text);
    }
  };

  const dirty = !!(displayName || username || roles.length);
  return (
    <>
      <Modal
        open
        title={t('users.add_title')}
        meta={property?.name}
        closeLabel={t('common.close')}
        onClose={onClose}
        dirty={dirty}
        footer={
          <>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" form="add-user-form" variant="pri">
              {t('users.create')}
            </Button>
          </>
        }
      >
        <form id="add-user-form" className="stack" onSubmit={next} noValidate>
          {banner ? <Alert tone="bad">{banner}</Alert> : null}
          <Field label={t('users.f_display')} required error={errors.displayName}>
            {(p) => (
              <input
                {...p}
                className="input"
                maxLength={80}
                autoComplete="off"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            )}
          </Field>
          <Field
            label={t('users.f_username')}
            required
            help={t('users.f_username_help')}
            error={errors.username}
          >
            {(p) => (
              <input
                {...p}
                className="input mono"
                maxLength={64}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            )}
          </Field>
          <Field
            label={t('users.f_temp_pw')}
            required
            help={t('users.f_temp_pw_help')}
            error={errors.initialPassword}
          >
            {(p) => (
              <div className="row wrap">
                <input
                  {...p}
                  className="input mono"
                  maxLength={256}
                  autoComplete="new-password"
                  spellCheck={false}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPassword(generateTempPassword())}
                >
                  {t('users.gen_pw')}
                </Button>
              </div>
            )}
          </Field>
          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className="label-h" style={{ marginBottom: 6 }}>
              {t('users.roles_legend')}
            </legend>
            {assignable.map((r) => (
              <Checkbox
                key={r}
                checked={roles.includes(r)}
                onChange={(on) => setRoles(on ? [...roles, r] : roles.filter((x) => x !== r))}
              >
                <b>{t(`role.${r}`)}</b>
                <br />
                <span className="li-s">{t(`users.role_desc.${r}`)}</span>
              </Checkbox>
            ))}
            {errors.roles ? (
              <p className="field-error" role="alert">
                {errors.roles}
              </p>
            ) : null}
          </fieldset>
          <Alert tone="info" icon="key" role="note">
            {t('users.temp_pw_note')}
          </Alert>
        </form>
      </Modal>
      <StrongReauthDialog
        open={s2}
        title={t('users.add_s2_title', { name: displayName.trim() })}
        confirmLabel={t('users.create')}
        onClose={() => setS2(false)}
        onConfirm={create}
      >
        {t('users.add_s2_body', { roles: roles.map((r) => t(`role.${r}`)).join(', ') })}
      </StrongReauthDialog>
    </>
  );
}
