import { useEffect, useState } from 'react';

/** Skeletons only appear when loading takes longer than 300 ms (H03 3.1 "Trạng thái"). */
export function useDelayed(active: boolean, ms = 300) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const id = setTimeout(() => setShow(true), ms);
    return () => clearTimeout(id);
  }, [active, ms]);
  return show;
}
