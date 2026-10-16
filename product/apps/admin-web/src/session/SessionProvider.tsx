import {
  isApiError,
  type ChangePasswordBody,
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
import { readSession, removeSession, writeSession } from '../app/storage';

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
  /** Set when a 401 ended the session mid-work (shows error.UNAUTHENTICATED on the login page). */
  expired: boolean;
  login: (username: string, password: string) => Promise<Me>;
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
  const statusRef = useRef(status);
  statusRef.current = status;

  const setMe = useCallback((next: Me | null) => {
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
        }
      }),
    [setMe],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const { data } = await api.login({ username, password });
      setExpired(false);
      setMe(data);
      return data;
    },
    [setMe],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* already signed out server-side – clear locally anyway */
    }
    removeSession(PROPERTY_KEY);
    setExpired(false);
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
      expired,
      login,
      logout,
      refresh,
      selectProperty,
      changePassword,
    };
  }, [status, me, propertyId, expired, login, logout, refresh, selectProperty, changePassword]);

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
