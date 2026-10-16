import { useEffect, useState } from 'react';

/** Browser connectivity. Offline → Desk is read-only (BR-906, DS §7): show bar + lock writes. */
export function useOnline() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [since, setSince] = useState<Date | null>(null);
  useEffect(() => {
    const up = () => {
      setOnline(true);
      setSince(null);
    };
    const down = () => {
      setOnline(false);
      setSince(new Date());
    };
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return { online, since };
}
