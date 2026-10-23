import { isApiError, type Role, type StrongReauth, type User } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Checkbox, Chip, ConfirmDialog, Modal } from '@ottimo/ui';
import { useState } from 'react';
import { api } from '../app/api';
import { fieldErrors, problemView } from '../app/problem';
import { useToast } from '../app/toast';
import { Page, Topbar } from '../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../components/states';
import { isStrongReauthError, StrongReauthDialog } from '../components/StrongReauthDialog';
import { useOnline } from '../hooks/useOnline';
import { useResource } from '../hooks/useResource';
import { usePropertyId, useSession } from '../session/SessionProvider';
import { AddUserDialog } from './AddUserDialog';

/** Roles the owner can assign here – "owner" itself is granted by the tech team only (H07 7.1b `[GIẢ ĐỊNH UXD]`). */
const ASSIGNABLE: Role[] = [
  'manager',
  'front_desk_lead',
  'front_desk',
  'housekeeping',
  'maintenance',
  'sales_staff',
  'collaborator',
];

/** Temporary password shown once to the owner (EP00 2.3) – 14 chars from an unambiguous alphabet. */
export function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/** Roles whose grant needs S2 (SEC 06.26). */
const S2_ROLES: Role[] = ['owner', 'manager'];

/**
 * CỔNG S2 (BE-C ae836f7, same rule as the server): the new list ADDS owner/manager at a property –
 * owner → manager is not an escalation.
 */
export function rolesNeedS2(
  current: { propertyId: string; role: Role }[],
  next: { propertyId: string; role: Role }[],
): boolean {
  const had = new Set(current.map((r) => `${r.propertyId}:${r.role}`));
  return next.some(
    (r) =>
      S2_ROLES.includes(r.role) &&
      !had.has(`${r.propertyId}:${r.role}`) &&
      !(r.role === 'manager' && had.has(`${r.propertyId}:owner`)),
  );
}

type Pending =
  | { kind: 'roles'; user: User; roles: Role[] }
  | { kind: 'lock'; user: User }
  | { kind: 'reset'; user: User };

/** H07 7.1 – users & roles (owner only, US-002). Changes revoke the person's sessions at once. */
export function UsersPage() {
  const { t, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const session = useSession();
  const toast = useToast();
  const { online } = useOnline();
  const { state, reload, mutate } = useResource(async () => (await api.listUsers()).data.data, []);
  const [editing, setEditing] = useState<{ user: User; roles: Role[] } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPw, setTempPw] = useState<{ name: string; value: string } | null>(null);
  const [adding, setAdding] = useState(false);
  // US-008 AC3: only the owner sees "Thêm người dùng" (the API answers 403 A100 to anyone else).
  const isOwner = session.roles.includes('owner');

  const rolesHere = (u: User) =>
    u.roles.filter((r) => r.propertyId === propertyId).map((r) => r.role);
  const replace = (u: User) => mutate((list) => list.map((x) => (x.id === u.id ? u : x)));

  const nextRoles = (p: { user: User; roles: Role[] }) => {
    const others = p.user.roles.filter((r) => r.propertyId !== propertyId);
    const keepOwner = rolesHere(p.user).includes('owner') ? (['owner'] as Role[]) : [];
    return [...others, ...[...keepOwner, ...p.roles].map((role) => ({ propertyId, role }))];
  };

  /** Lock/unlock and reset password always need S2; roles only when they add owner/manager. */
  const needsS2 = (p: Pending) => p.kind !== 'roles' || rolesNeedS2(p.user.roles, nextRoles(p));

  const perform = async (p: Pending, reauth?: StrongReauth) => {
    if (p.kind === 'roles') {
      replace((await api.setUserRoles(p.user.id, nextRoles(p), p.user.version, reauth)).data);
      setEditing(null);
    } else if (p.kind === 'lock') {
      const status = p.user.status === 'active' ? 'disabled' : 'active';
      replace((await api.updateUser(p.user.id, { status, reauth }, p.user.version)).data);
    } else {
      const value = generateTempPassword();
      replace(
        (await api.updateUser(p.user.id, { resetPassword: value, reauth }, p.user.version)).data,
      );
      setTempPw({ name: p.user.displayName, value });
    }
    toast(t('users.saved', { name: p.user.displayName }));
    setPending(null);
  };

  const fail = (err: unknown) => {
    const fe = fieldErrors(t, err);
    setError(Object.values(fe)[0] ?? problemView(t, err).text);
    setPending(null);
    if (isApiError(err) && err.code === 'VERSION_CONFLICT') reload();
  };

  /** Confirm-only path (role changes that add no owner/manager). */
  const run = async (p: Pending) => {
    setBusy(true);
    setError(null);
    try {
      await perform(p);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  /** S2 path: a wrong/missing factor stays in the dialog (one sentence); anything else closes it. */
  const runS2 = async (p: Pending, reauth: StrongReauth) => {
    setError(null);
    try {
      await perform(p, reauth);
    } catch (err) {
      if (isStrongReauthError(err)) throw err;
      fail(err);
    }
  };

  const statusChip = (u: User) =>
    u.status === 'active' ? (
      <Chip tone="ok" icon="check">
        {t('users.active')}
      </Chip>
    ) : u.status === 'locked' ? (
      <Chip tone="warn" icon="clock">
        {t('users.status_locked')}
      </Chip>
    ) : (
      <Chip tone="bad" icon="lock">
        {t('users.locked')}
      </Chip>
    );

  return (
    <>
      <Topbar
        title={t('nav.users')}
        actions={
          isOwner && online ? (
            <Button variant="pri" icon="plus" onClick={() => setAdding(true)}>
              {t('users.new_cta')}
            </Button>
          ) : undefined
        }
      />
      <Page>
        {error ? <Alert tone="bad">{error}</Alert> : null}
        {state.status === 'error' && !state.data ? (
          <ErrorBlock titleKey="users.error_title" error={state.error} onRetry={reload} />
        ) : state.status === 'loading' && !state.data ? (
          <LoadingBlock />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">{t('nav.users')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('users.col_name')}</th>
                  <th scope="col">{t('users.col_roles')}</th>
                  <th scope="col">{t('users.col_status')}</th>
                  <th scope="col">{t('users.col_last')}</th>
                  <th scope="col">
                    <span className="sr-only">{t('rooms.col_action')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(state.data ?? []).map((u) => {
                  const self = u.id === session.me?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <b>{u.displayName}</b>
                        {self ? ` · ${t('users.you')}` : ''}
                        <br />
                        <span className="li-s mono">{u.username}</span>
                      </td>
                      <td>
                        <div className="row" style={{ gap: 4 }}>
                          {rolesHere(u).map((r) => (
                            <Chip key={r} tone="oak">
                              {t(`role.${r}`)}
                            </Chip>
                          ))}
                        </div>
                      </td>
                      <td>{statusChip(u)}</td>
                      <td>{u.lastLoginAt ? dateTime(u.lastLoginAt) : t('users.never')}</td>
                      <td>
                        <div className="row">
                          <Button
                            size="sm"
                            disabled={!online}
                            aria-label={`${t('users.edit_roles')}: ${u.displayName}`}
                            onClick={() =>
                              setEditing({
                                user: u,
                                roles: rolesHere(u).filter((r) => r !== 'owner'),
                              })
                            }
                          >
                            {t('users.edit_roles')}
                          </Button>
                          {!self ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={!online}
                                onClick={() => setPending({ kind: 'reset', user: u })}
                              >
                                {t('users.reset_pw')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={!online}
                                onClick={() => setPending({ kind: 'lock', user: u })}
                              >
                                {u.status === 'active' ? t('users.lock') : t('users.unlock')}
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="li-s" style={{ marginTop: 10 }}>
          {t('users.roles_effect')}
        </p>
      </Page>

      {editing ? (
        <Modal
          open
          title={t('users.roles_title', { name: editing.user.displayName })}
          meta={session.property?.name}
          closeLabel={t('common.close')}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
              <Button
                variant="pri"
                disabled={editing.roles.length === 0 && !rolesHere(editing.user).includes('owner')}
                onClick={() =>
                  setPending({ kind: 'roles', user: editing.user, roles: editing.roles })
                }
              >
                {editing.roles.length === 0 && !rolesHere(editing.user).includes('owner')
                  ? t('users.roles_min')
                  : t('users.save_roles')}
              </Button>
            </>
          }
        >
          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className="label-h" style={{ marginBottom: 6 }}>
              {t('users.roles_legend')}
            </legend>
            {ASSIGNABLE.map((r) => (
              <Checkbox
                key={r}
                checked={editing.roles.includes(r)}
                onChange={(on) =>
                  setEditing({
                    ...editing,
                    roles: on ? [...editing.roles, r] : editing.roles.filter((x) => x !== r),
                  })
                }
              >
                <b>{t(`role.${r}`)}</b>
                <br />
                <span className="li-s">{t(`users.role_desc.${r}`)}</span>
              </Checkbox>
            ))}
          </fieldset>
          <Alert tone="info" role="note">
            {t('users.roles_effect')}
          </Alert>
        </Modal>
      ) : null}

      {pending && needsS2(pending) ? (
        <StrongReauthDialog
          open
          title={
            pending.kind === 'roles'
              ? t('users.roles_confirm_title', { name: pending.user.displayName })
              : pending.kind === 'lock'
                ? pending.user.status === 'active'
                  ? t('users.lock_title', { name: pending.user.displayName })
                  : t('users.unlock')
                : t('users.reset_pw_title', { name: pending.user.displayName })
          }
          confirmLabel={
            pending.kind === 'roles'
              ? t('users.save_roles')
              : pending.kind === 'lock'
                ? pending.user.status === 'active'
                  ? t('users.lock')
                  : t('users.unlock')
                : t('users.reset_pw')
          }
          danger={pending.kind === 'lock' && pending.user.status === 'active'}
          onClose={() => setPending(null)}
          onConfirm={(reauth) => runS2(pending, reauth)}
        >
          {pending.kind === 'roles'
            ? t('users.roles_confirm_body')
            : pending.kind === 'lock'
              ? pending.user.status === 'active'
                ? t('users.lock_body')
                : null
              : t('users.reset_pw_body')}
        </StrongReauthDialog>
      ) : pending ? (
        <ConfirmDialog
          title={
            pending.kind === 'roles'
              ? t('users.roles_confirm_title', { name: pending.user.displayName })
              : pending.kind === 'lock'
                ? t('users.lock_title', { name: pending.user.displayName })
                : t('users.reset_pw_title', { name: pending.user.displayName })
          }
          body={
            pending.kind === 'roles'
              ? t('users.roles_confirm_body')
              : pending.kind === 'lock'
                ? t('users.lock_body')
                : t('users.reset_pw_body')
          }
          keepLabel={t('confirm.keep')}
          confirmLabel={
            pending.kind === 'roles'
              ? t('users.save_roles')
              : pending.kind === 'lock'
                ? t('users.lock')
                : t('users.reset_pw')
          }
          busy={busy}
          onKeep={() => setPending(null)}
          onConfirm={() => void run(pending)}
        />
      ) : null}

      {adding ? (
        <AddUserDialog
          assignable={ASSIGNABLE}
          onClose={() => setAdding(false)}
          onDone={(u, value) => {
            setAdding(false);
            mutate((list) => [...list, u]);
            reload();
            toast(t('users.added', { name: u.displayName }));
            setTempPw({ name: u.displayName, value });
          }}
        />
      ) : null}

      {tempPw ? (
        <Modal
          open
          size="sm"
          title={t('users.temp_pw_title', { name: tempPw.name })}
          closeLabel={t('common.close')}
          onClose={() => setTempPw(null)}
          footer={
            <Button variant="pri" onClick={() => setTempPw(null)}>
              {t('common.close')}
            </Button>
          }
        >
          <p className="temp-secret">{tempPw.value}</p>
          <Alert tone="warn" icon="key" role="note">
            {t('users.temp_pw_once')}
          </Alert>
        </Modal>
      ) : null}
    </>
  );
}
