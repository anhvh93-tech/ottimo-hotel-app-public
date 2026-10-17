import { useEffect, useState } from 'react';

// Hash routes: the back button of the phone / installed PWA works without a router library, and the
// static app shell (sw.js) answers every route offline.
export type Route =
  | { name: 'tasks' }
  | { name: 'rooms' }
  | { name: 'room'; roomId: string; refuse?: boolean }
  | { name: 'inspect'; roomId: string }
  | { name: 'report'; roomId?: string }
  | { name: 'queue' }
  | { name: 'me' }
  | { name: 'notifications' }
  | { name: 'wo' }
  | { name: 'wo_detail'; id: string };

const ID = '([A-Za-z0-9-]{1,64})';

export function parseRoute(hash: string): Route | undefined {
  const h = hash.replace(/^#/, '');
  let m: RegExpExecArray | null;
  if (h === '/tasks') return { name: 'tasks' };
  if (h === '/rooms') return { name: 'rooms' };
  if (h === '/queue') return { name: 'queue' };
  if (h === '/me') return { name: 'me' };
  if (h === '/notifications') return { name: 'notifications' };
  if (h === '/wo') return { name: 'wo' };
  if (h === '/report') return { name: 'report' };
  if ((m = new RegExp(`^/room/${ID}$`).exec(h))) return { name: 'room', roomId: m[1]! };
  if ((m = new RegExp(`^/room/${ID}/refuse$`).exec(h))) {
    return { name: 'room', roomId: m[1]!, refuse: true };
  }
  if ((m = new RegExp(`^/inspect/${ID}$`).exec(h))) return { name: 'inspect', roomId: m[1]! };
  if ((m = new RegExp(`^/report/${ID}$`).exec(h))) return { name: 'report', roomId: m[1]! };
  if ((m = new RegExp(`^/wo/${ID}$`).exec(h))) return { name: 'wo_detail', id: m[1]! };
  return undefined;
}

export function href(route: Route): string {
  switch (route.name) {
    case 'room':
      return route.refuse ? `#/room/${route.roomId}/refuse` : `#/room/${route.roomId}`;
    case 'inspect':
      return `#/inspect/${route.roomId}`;
    case 'report':
      return route.roomId ? `#/report/${route.roomId}` : '#/report';
    case 'wo_detail':
      return `#/wo/${route.id}`;
    default:
      return `#/${route.name}`;
  }
}

export function navigate(route: Route, replace = false) {
  const target = href(route);
  if (replace) {
    history.replaceState(null, '', target);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = target;
  }
}

export function goBack(fallback: Route) {
  if (history.length > 1) history.back();
  else navigate(fallback, true);
}

export function useRoute(home: Route): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash) ?? home);
  useEffect(() => {
    const on = () => setRoute(parseRoute(window.location.hash) ?? home);
    window.addEventListener('hashchange', on);
    on();
    return () => window.removeEventListener('hashchange', on);
  }, [home]);
  return route;
}
