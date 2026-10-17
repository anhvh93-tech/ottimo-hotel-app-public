import { Button, Icon, Skeleton, StateView } from '@ottimo/ui';
import { roomLabel, useI18n } from '@ottimo/i18n';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isApiError, staffApi, type WorkOrder } from '../app/api';
import { REFRESH_MS } from '../app/config';
import { useLive, useLiveEvents } from '../app/live';
import { asRoom } from '../app/rooms';
import { href } from '../app/router';
import { canBlock, type StaffSession } from '../app/session';
import { inWoFilter, nextDue, reopenDate, sortWorkOrders, type WoFilter } from '../app/workOrders';
import type { OfflineCache } from '../data/cache';
import { useQueue } from '../queue/QueueProvider';
import { CallDesk, Chip, RoomNo, SeverityChip, TopBar, UpdatedAt, WoStatusChip } from '../ui/parts';

interface ListState {
  status: 'loading' | 'ready' | 'error';
  list: WorkOrder[];
  savedAt?: number;
  fromCache: boolean;
}

export function useWorkOrders(session: StaffSession, cache: OfflineCache) {
  const { syncTick, online } = useQueue();
  const [state, setState] = useState<ListState>({ status: 'loading', list: [], fromCache: false });
  const refresh = useCallback(async () => {
    const fromCache = async () => {
      const c = await cache.loadWorkOrders();
      setState(
        c
          ? { status: 'ready', list: c.data, savedAt: c.savedAt, fromCache: true }
          : { status: 'error', list: [], fromCache: false },
      );
    };
    if (!globalThis.navigator?.onLine) return fromCache();
    try {
      const res = await staffApi.listWorkOrders(session.propertyId);
      const now = Date.now();
      await cache.saveWorkOrders(res.data, now);
      setState({ status: 'ready', list: res.data, savedAt: now, fromCache: false });
    } catch (e) {
      if (isApiError(e) && e.status === 401) return;
      await fromCache();
    }
  }, [cache, session.propertyId]);
  useEffect(() => {
    void refresh();
  }, [refresh, syncTick, online]);
  useLiveEvents(['work_order.changed'], () => void refresh());
  const { connected } = useLive();
  useEffect(() => {
    if (!online || connected) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [online, connected, refresh]);
  return { ...state, refresh };
}

const FILTER_KEYS: Record<WoFilter, string> = {
  open: 'wo.filter.open',
  high: 'wo.filter.high',
  parts: 'wo.filter.parts',
};

/** H22 22.1 – maintenance list: severity (word + icon + left border), status, next deadline as a sentence. */
export function WorkOrdersPage({ session, cache }: { session: StaffSession; cache: OfflineCache }) {
  const { t } = useI18n();
  const data = useWorkOrders(session, cache);
  const [filter, setFilter] = useState<WoFilter>('open');
  const sorted = useMemo(() => sortWorkOrders(data.list), [data.list]);
  const shown = sorted.filter((w) => inWoFilter(w, filter));

  return (
    <>
      <TopBar
        title={t('nav.work_orders')}
        sub={<UpdatedAt savedAt={data.savedAt} fromCache={data.fromCache} />}
      />
      <div className="m-body">
        {data.status === 'loading' ? (
          <div aria-busy="true">
            <span className="sr-only">{t('common.loading')}</span>
            <Skeleton height={56} />
            <Skeleton height={120} />
          </div>
        ) : data.status === 'error' ? (
          <StateView
            kind="error"
            title={t('wo.error_title')}
            action={
              <div className="hk-stack">
                <Button variant="pri" block className="xl" onClick={() => void data.refresh()}>
                  {t('common.retry')}
                </Button>
                <CallDesk block />
              </div>
            }
          >
            {t('hk.error_body')}
          </StateView>
        ) : (
          <>
            {canBlock(session) ? (
              // H22 22.5: maintenance (and FD+) open a work order themselves, with an optional room block.
              <a className="btn xl block mb-12" href={href({ name: 'report' })}>
                <Icon name="plus" />
                <span>{t('wo.new_title')}</span>
              </a>
            ) : null}
            <div className="filters" role="group" aria-label={t('wo.filter_label')}>
              {(Object.keys(FILTER_KEYS) as WoFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {t(FILTER_KEYS[f], { n: sorted.filter((w) => inWoFilter(w, f)).length })}
                </button>
              ))}
            </div>
            {shown.length === 0 ? (
              <StateView icon="check" title={t('wo.empty_title')}>
                {t('wo.empty_body')}
              </StateView>
            ) : (
              <ul className="hk-list">
                {shown.map((w) => {
                  const due = nextDue(w, t);
                  const reopen = reopenDate(w);
                  return (
                    <li key={w.id}>
                      <a
                        className={`hk-card rowlink${w.severity === 'high' ? ' urgent' : w.severity === 'medium' ? ' soon' : ''}`}
                        href={href({ name: 'wo_detail', id: w.id })}
                        aria-label={`${w.code}, ${t('hk.wo.room')} ${roomLabel(asRoom(w), 'staff', { separator: ', ' })}, ${w.title}`}
                      >
                        <span className="grow">
                          <span className="hd">
                            <RoomNo no={w.roomNo ?? ''} name={w.roomName} />
                            <SeverityChip severity={w.severity} />
                            <WoStatusChip status={w.status} />
                          </span>
                          <span className="what">
                            <b>
                              <span className="mono">{w.code}</span> · {w.title}
                            </b>
                            {due ? (
                              <span
                                className={`countdown ${due.tone === 'neutral' ? '' : due.tone}`}
                              >
                                <Icon name="clock" />
                                <span>{due.text}</span>
                              </span>
                            ) : null}
                            <span className="meta">
                              {reopen ? (
                                <Chip tone="bad" icon="lock">
                                  {t('wo.locked_until', { date: reopen })}
                                </Chip>
                              ) : null}
                              {w.source === 'guest_app' ? (
                                <span>{t('wo.source.guest_app')}</span>
                              ) : null}
                              {w.assigneeName ? (
                                <span>{t('wo.assignee', { name: w.assigneeName })}</span>
                              ) : null}
                            </span>
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}
