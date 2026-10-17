import type {
  ApprovalRequest,
  ArrivalsDepartures,
  AttentionItem,
  GuestRequest,
  TonightKpi,
} from '@ottimo/api-client';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../app/api';
import { ALL_EVENTS, useLiveEvents } from '../../app/live';
import { useResource, type ResourceState } from '../../hooks/useResource';

type Block = 'kpi' | 'board' | 'attention' | 'approvals' | 'requests';
/** EP01 §4: what each SSE event re-reads (events carry only type + id). */
const LIVE_EVENTS = [
  'reservation.changed',
  'room.status_changed',
  'attention.changed',
  'hk_task.changed',
  'work_order.changed',
  'guest_request.changed',
  'registration.changed',
  'payment.changed',
];
const TOUCHES: Record<string, Block[]> = {
  'reservation.changed': ['kpi', 'board', 'attention', 'approvals'],
  'room.status_changed': ['kpi', 'board', 'attention'],
  'attention.changed': ['attention'],
  // A task / work order done closes its guest request (SM-15).
  'hk_task.changed': ['attention', 'requests'],
  'work_order.changed': ['attention', 'kpi', 'requests'],
  'guest_request.changed': ['attention', 'requests'],
  'registration.changed': ['attention', 'board'],
  'payment.changed': ['attention', 'approvals'],
};
const ALL: Block[] = ['kpi', 'board', 'attention', 'approvals', 'requests'];
/** Items with a deadline change with time even without an event (EP01 §4 `[GIẢ ĐỊNH BA]`). */
export const ATTENTION_REFRESH_MS = 60_000;

export interface Dashboard {
  kpi: ResourceState<TonightKpi>;
  board?: ResourceState<ArrivalsDepartures>;
  attention: ResourceState<AttentionItem[]>;
  approvals?: ResourceState<ApprovalRequest[]>;
  /** H03: the desk's guest request queue (US-110, S30). */
  requests?: ResourceState<GuestRequest[]>;
  reload: Record<Block, () => void>;
  /** SSE dropped (data may be old) – "Đang kết nối lại", polling every 30 s. */
  stale: boolean;
}

/**
 * Data of H03 Hôm nay (`board` = arrivals/departures + guest requests) and H24 Tổng quan (`approvals`): every
 * block is read on its own, so one failing block never hides the others (H24 24.1 Problem.code). Live: SSE
 * events re-read only the blocks they touch, a burst within 1 s gives one read per block (EP01 §4).
 */
export function useDashboard(
  propertyId: string,
  blocks: { board?: boolean; approvals?: boolean },
): Dashboard {
  const kpi = useResource(async () => (await api.getTonightKpi({ propertyId })).data, [propertyId]);
  const board = useResource(
    async () =>
      blocks.board ? (await api.getArrivalsDepartures({ propertyId })).data : (undefined as never),
    [propertyId, blocks.board],
  );
  const attention = useResource(
    async () => (await api.listAttentionItems({ propertyId })).data.data,
    [propertyId],
  );
  const approvals = useResource(
    async () =>
      // Every request the caller may see (server scope by role); the page picks what its role shows.
      blocks.approvals
        ? (await api.listApprovalRequests({ propertyId })).data.data
        : (undefined as never),
    [propertyId, blocks.approvals],
  );
  const requests = useResource(
    async () =>
      blocks.board ? (await api.listGuestRequests({ propertyId })).data.data : (undefined as never),
    [propertyId, blocks.board],
  );
  const reload: Record<Block, () => void> = {
    kpi: kpi.reload,
    board: board.reload,
    attention: attention.reload,
    approvals: approvals.reload,
    requests: requests.reload,
  };
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  const enabled = (b: Block) =>
    (b !== 'board' && b !== 'requests' && b !== 'approvals') ||
    (b === 'approvals' ? !!blocks.approvals : !!blocks.board);

  const { stale } = useLiveEvents(
    propertyId,
    (kinds) => {
      const todo = new Set<Block>();
      for (const k of kinds)
        for (const b of k === ALL_EVENTS || !TOUCHES[k] ? ALL : TOUCHES[k]!) todo.add(b);
      for (const b of todo) if (enabled(b)) reloadRef.current[b]();
    },
    { events: LIVE_EVENTS, debounceMs: 1000 },
  );

  useEffect(() => {
    const id = setInterval(() => reloadRef.current.attention(), ATTENTION_REFRESH_MS);
    return () => clearInterval(id);
  }, [propertyId]);

  return {
    kpi: kpi.state,
    board: blocks.board ? board.state : undefined,
    attention: attention.state,
    approvals: blocks.approvals ? approvals.state : undefined,
    requests: blocks.board ? requests.state : undefined,
    reload,
    stale,
  };
}

/**
 * Keys of attention lines that appeared since the previous successful read (SSE / refresh) – shown with
 * "Mới" + a 2 s highlight and announced once (`ov.sse_new_announce`); the first read marks nothing.
 */
export function useNewKeys(keys: string[] | undefined): { fresh: Set<string>; announce: string } {
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [announce, setAnnounce] = useState('');
  const sig = keys?.join('\n');
  useEffect(() => {
    if (!keys) return;
    if (seen.current) {
      const before = seen.current;
      const added = keys.filter((k) => !before.has(k));
      setFresh(new Set(added));
      if (added.length) setAnnounce(String(Date.now()));
    }
    seen.current = new Set(keys);
    // `sig` stands for `keys`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  // The polite live region speaks once, then empties (a later new item is announced again).
  useEffect(() => {
    if (!announce) return;
    const id = setTimeout(() => setAnnounce(''), 3000);
    return () => clearTimeout(id);
  }, [announce]);
  return { fresh, announce };
}
