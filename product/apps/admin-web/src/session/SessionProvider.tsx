import {
  isApiError,
  type ChangePasswordBody,
  type LoginMfaBody,
  type Me,
  type MeProperty,
  type Role,
} from '@ottimo/api-client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api, onApiError, setCsrfToken } from '../app/api';
import { clearClientData } from '../app/clientData';
import { readSession, writeSession } from '../app/storage';

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

export interface Session {
  status: SessionStatus;
  me: Me | null;
  /** Property the user works in (ADR-007). Null when the account has ≥ 2 and none is chosen yet. */
  property: MeProperty | null;
  roles: Role[];
  screens: string[];
  deviceTrusted: boolean;
  mustChangePassword: boolean;
  /** US-143 / SEC 06.4: restricted session – only the 2FA enrollment screen until it is on. */
  enrollmentRequired: boolean;
  /** How this tab's session was opened – `recovery_code` shows the "code used" notice (US-143 AC3 a). */
  amr: 'password' | 'totp' | 'recovery_code' | null;
  /** Set when a 401 ended the session mid-work (shows error.UNAUTHENTICATED on the login page). */
  expired: boolean;
  /** Throws ApiError 401 `MFA_REQUIRED` (+ `problem.mfaToken`) when the account has 2FA. */
  login: (username: string, password: string) => Promise<Me>;
  /** Sign-in step 2 (`loginMfa`): the token stays in the caller's memory only (SEC 06.17). */
  loginMfa: (body: LoginMfaBody) => Promise<Me>;
  /** After `confirmMy2fa` (new session): reload Me for the new CSRF token, keep the screen. */
  clearAmr: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<Me | null>;
  selectProperty: (propertyId: string) => void;
  changePassword: (body: ChangePasswordBody) => Promise<void>;
}

const Ctx = createContext<Session | null>(null);
const PROPERTY_KEY = 'ottimo.activePropertyId';

function pickProperty(me: Me | null): MeProperty | null {
  if (!me) return null;
  const chosen = readSession(PROPERTY_KEY) ?? me.activePropertyId;
  const found = me.properties.find((p) => p.propertyId === chosen);
  if (found) return found;
  return me.properties.length === 1 ? me.properties[0]! : null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [me, setMeState] = useState<Me | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [amr, setAmr] = useState<Session['amr']>(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  /** Last signed-in user in this tab: a different user signing in wipes the previous one's data. */
  const lastUserId = useRef<string | null>(null);

  const setMe = useCallback((next: Me | null) => {
    if (next) {
      if (lastUserId.current && lastUserId.current !== next.id) clearClientData();
      lastUserId.current = next.id;
    }
    setMeState(next);
    setCsrfToken(next?.csrfToken);
    setPropertyId(pickProperty(next)?.propertyId ?? null);
    setStatus(next ? 'authenticated' : 'anonymous');
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.getMe();
      setMe(data);
      return data;
    } catch (e) {
      if (isApiError(e) && (e.status === 401 || e.status === 403)) {
        setMe(null);
        return null;
      }
      // Network/5xx on boot: stay signed out but keep the error visible on the login page.
      setMe(null);
      throw e;
    }
  }, [setMe]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  // Global problems (EP00 0.2.4): an expired session sends the user to login and keeps their place;
  // PASSWORD_CHANGE_REQUIRED forces the change-password screen.
  useEffect(
    () =>
      onApiError((error) => {
        if (error.code === 'UNAUTHENTICATED' && statusRef.current === 'authenticated') {
          // RequireAuth redirects to /login with the current route, so the user comes back here.
          setExpired(true);
          setMe(null);
        } else if (error.code === 'PASSWORD_CHANGE_REQUIRED') {
          setMeState((m) => (m ? { ...m, mustChangePassword: true } : m));
        } else if (error.code === 'MFA_ENROLLMENT_REQUIRED') {
          // SEC 06.4: the server put this session in enrollment-only mode → the route guard opens /enroll-2fa.
          setMeState((m) => (m ? { ...m, mfaEnrollmentRequired: true } : m));
        }
      }),
    [setMe],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const { data } = await api.login({ username, password });
      setExpired(false);
      setAmr('password');
      setMe(data);
      return data;
    },
    [setMe],
  );

  const loginMfa = useCallback(
    async (body: LoginMfaBody) => {
      const { data } = await api.loginMfa(body);
      setExpired(false);
      setAmr(body.recoveryCode ? 'recovery_code' : 'totp');
      setMe(data);
      return data;
    },
    [setMe],
  );

  const clearAmr = useCallback(() => setAmr(null), []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* already signed out server-side – clear locally anyway */
    }
    // SR-PWA-04: sign-out / "Đổi ca" wipes drafts and every ottimo.* sessionStorage key.
    clearClientData();
    lastUserId.current = null;
    setExpired(false);
    setAmr(null);
    setMe(null);
  }, [setMe]);

  const selectProperty = useCallback((id: string) => {
    writeSession(PROPERTY_KEY, id);
    setPropertyId(id);
  }, []);

  /** SR-SES-06: other sessions are revoked, this one stays; reload Me (mustChangePassword=false). */
  const changePassword = useCallback(
    async (body: ChangePasswordBody) => {
      await api.changeMyPassword(body);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<Session>(() => {
    const property = me?.properties.find((p) => p.propertyId === propertyId) ?? null;
    return {
      status,
      me,
      property,
      roles: (property?.roles ?? []) as Role[],
      screens: property?.screens ?? [],
      deviceTrusted: property?.deviceTrusted === true,
      mustChangePassword: me?.mustChangePassword === true,
      enrollmentRequired: me?.mfaEnrollmentRequired === true,
      amr,
      expired,
      login,
      loginMfa,
      clearAmr,
      logout,
      refresh,
      selectProperty,
      changePassword,
    };
  }, [
    status,
    me,
    propertyId,
    expired,
    amr,
    login,
    loginMfa,
    clearAmr,
    logout,
    refresh,
    selectProperty,
    changePassword,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession outside SessionProvider');
  return ctx;
}

/** Property id for API calls – only used under the authenticated shell, so it is always set. */
export function usePropertyId(): string {
  const { property } = useSession();
  if (!property) throw new Error('No active property');
  return property.propertyId;
}
