import type { RoomBlock, WorkOrder } from '@ottimo/api-client';
import { roomLabel, useI18n } from '@ottimo/i18n';
import { Button, Chip, ConfirmDialog, Field, Modal, Seg, StateView } from '@ottimo/ui';
import { useId, useState } from 'react';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { useBusinessDay } from '../../app/businessDay';
import { useLiveReload } from '../../app/live';
import { Code } from '../../app/mono';
import { addDays, dayMonth } from '../../app/reservations';
import { findRoom } from '../../app/rooms';
import { useToast } from '../../app/toast';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useNow } from '../../hooks/useNow';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { useSubmit } from '../stay/common';
import { BLOCK_STATUS, SEV_TONE, WO_STATUS } from './opsLabels';
import { WorkOrderDrawer, dueText } from './WorkOrderDrawer';
import { BlockConflict, BlockDialog, CreateWorkOrderDialog } from './WorkOrderForms';

const WRITERS = ['owner', 'manager', 'front_desk_lead', 'front_desk', 'maintenance'];
const OWN_MGR = ['owner', 'manager'];
type Filter = 'open' | 'high' | 'parts' | 'done';
const SEV_ORDER = { high: 0, medium: 1, low: 2 } as const;

/**
 * S11 Bảo trì – Desk (US-061, US-062, US-019, US-135): work orders (open / urgent / waiting for parts / done –
 * overdue first, then severity, then deadline – EP07-08 6.7) with a detail drawer, and the room blocks tab
 * (planned blocks, reopening date, early release, cancel). Live: `work_order.changed`, `room.status_changed`.
 */
export function MaintenancePage() {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const { online } = useOnline();
  const write = roles.some((r) => WRITERS.includes(r));
  const [tab, setTab] = useState<'orders' | 'blocks'>('orders');
  const [creating, setCreating] = useState<'wo' | 'block' | null>(null);
  const ids = useId();
  const orders = useResource(
    async () => (await api.listWorkOrders({ propertyId })).data.data,
    [propertyId],
  );
  const today = useBusinessDay(); // BR-010 (night window – BUG-R2-211)
  const blocks = useResource(
    async () =>
      (
        await api.listRoomBlocks(
          { propertyId },
          { from: addDays(today, -30), to: addDays(today, 120) },
        )
      ).data.data,
    [propertyId, today],
  );
  const reload = () => {
    orders.reload();
    blocks.reload();
  };
  useLiveReload(propertyId, reload);
  const [openId, setOpenId] = useState<string | null>(null);
  const current = orders.state.data?.find((w) => w.id === openId);

  return (
    <>
      <Topbar
        title={t('nav.maintenance')}
        actions={
          write && online ? (
            <>
              <Button onClick={() => setCreating('block')}>{t('ooo.new')}</Button>
              <Button variant="pri" icon="plus" onClick={() => setCreating('wo')}>
                {t('wo.new_title')}
              </Button>
            </>
          ) : undefined
        }
      />
      <Page>
        <span className="sr-only" id={`${ids}-tab`}>
          {t('nav.maintenance')}
        </span>
        <Seg
          labelledBy={`${ids}-tab`}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'orders', label: t('nav.work_orders') },
            { value: 'blocks', label: t('wo.tab.blocks') },
          ]}
        />
        <div className="mt-16">
          {tab === 'orders' ? (
            !orders.state.data && orders.state.status === 'error' ? (
              <ErrorBlock
                titleKey="wo.error_title"
                error={orders.state.error}
                onRetry={orders.reload}
              />
            ) : !orders.state.data ? (
              <LoadingBlock />
            ) : (
              <OrderList orders={orders.state.data} onOpen={setOpenId} />
            )
          ) : !blocks.state.data && blocks.state.status === 'error' ? (
            <ErrorBlock titleKey="ooo.error" error={blocks.state.error} onRetry={blocks.reload} />
          ) : !blocks.state.data ? (
            <LoadingBlock />
          ) : (
            <BlockList
              blocks={blocks.state.data}
              orders={orders.state.data ?? []}
              canWrite={write}
              manager={roles.some((r) => OWN_MGR.includes(r))}
              onChanged={reload}
            />
          )}
        </div>
      </Page>
      {current ? (
        <WorkOrderDrawer
          workOrder={current}
          onClose={() => setOpenId(null)}
          onChanged={() => reload()}
        />
      ) : null}
      {creating === 'wo' ? (
        <CreateWorkOrderDialog
          onClose={() => setCreating(null)}
          onDone={(w) => {
            setCreating(null);
            reload();
            setOpenId(w.id);
          }}
        />
      ) : null}
      {creating === 'block' ? (
        <BlockDialog
          onClose={() => setCreating(null)}
          onDone={() => {
            setCreating(null);
            setTab('blocks');
            reload();
          }}
        />
      ) : null}
    </>
  );
}

function OrderList({ orders, onOpen }: { orders: WorkOrder[]; onOpen: (id: string) => void }) {
  const { t } = useI18n();
  const { property } = useSession();
  const now = useNow(30_000);
  const ids = useId();
  const [filter, setFilter] = useState<Filter>('open');
  const isOpen = (w: WorkOrder) => !['done', 'cancelled'].includes(w.status);
  const match: Record<Filter, (w: WorkOrder) => boolean> = {
    open: isOpen,
    high: (w) => isOpen(w) && w.severity === 'high',
    parts: (w) => w.status === 'waiting_parts',
    done: (w) => w.status === 'done',
  };
  const rows = orders
    .filter(match[filter])
    .sort(
      (a, b) =>
        Number(!!b.isOverdue) - Number(!!a.isOverdue) ||
        SEV_ORDER[a.severity] - SEV_ORDER[b.severity] ||
        (a.ackDueAt ?? a.resolveDueAt ?? '9').localeCompare(b.ackDueAt ?? b.resolveDueAt ?? '9'),
    );
  const label: Record<Filter, string> = {
    open: 'wo.filter.open',
    high: 'wo.filter.high',
    parts: 'wo.filter.parts',
    done: 'wo.filter.done',
  };
  return (
    <div className="stack">
      <span className="sr-only" id={`${ids}-f`}>
        {t('wo.filter_label')}
      </span>
      <Seg
        labelledBy={`${ids}-f`}
        value={filter}
        onChange={setFilter}
        options={(Object.keys(label) as Filter[]).map((f) => ({
          value: f,
          label: t(label[f], { n: orders.filter(match[f]).length }),
        }))}
      />
      {rows.length === 0 ? (
        <StateView icon="wrench" title={t('wo.empty_title')}>
          {t('wo.empty_body')}
        </StateView>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('wo.col.code')}</th>
                <th scope="col">{t('hk.wo.room')}</th>
                <th scope="col">{t('wo.col.title')}</th>
                <th scope="col">{t('wo.severity_label')}</th>
                <th scope="col">{t('wo.col.status')}</th>
                <th scope="col">{t('wo.col.due')}</th>
                <th scope="col">{t('wo.col.assignee')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => {
                const st = WO_STATUS[w.status];
                const due = dueText(t, w, now, property?.timezone);
                return (
                  <tr key={w.id}>
                    <td>
                      <button
                        type="button"
                        className="btn ghost sm mono"
                        onClick={() => onOpen(w.id)}
                      >
                        {w.code}
                      </button>
                    </td>
                    <td>{roomLabel({ roomNo: w.roomNo, name: w.roomName }, 'staff')}</td>
                    <td>
                      {w.title}
                      <div className="row wrap">
                        {w.source === 'guest_app' ? (
                          <Chip tone="ink" icon="chat">
                            {t('wo.source.guest_app')}
                          </Chip>
                        ) : null}
                        {w.blockRequested ? (
                          <Chip tone="warn" icon="lock">
                            {t('wo.chip.block_requested')}
                          </Chip>
                        ) : null}
                        {w.roomBlock && w.roomBlock.status === 'active' ? (
                          <Chip tone="bad" icon="lock">
                            {t('wo.locked_until', {
                              date: dayMonth(w.roomBlock.endDatePlanned),
                            })}
                          </Chip>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <Chip tone={SEV_TONE[w.severity]} icon="alert">
                        {t(`wo.sev.${w.severity}`)}
                      </Chip>
                    </td>
                    <td>
                      <Chip tone={st.tone} icon={st.icon}>
                        {t(st.key)}
                      </Chip>
                    </td>
                    <td className={due?.bad ? 'countdown bad' : undefined}>{due?.text ?? '—'}</td>
                    <td>{w.assigneeName ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** US-019: blocks of the last 30 days / next 4 months – half-open dates shown as nights + reopening day. */
function BlockList({
  blocks,
  orders,
  canWrite,
  manager,
  onChanged,
}: {
  blocks: RoomBlock[];
  orders: WorkOrder[];
  canWrite: boolean;
  manager: boolean;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { rooms } = useCatalog(propertyId);
  const { online } = useOnline();
  const [editing, setEditing] = useState<{
    b: RoomBlock;
    mode: 'end' | 'release' | 'cancel';
  } | null>(null);
  const room = (b: RoomBlock) =>
    roomLabel(findRoom(rooms, b.roomNo, b.roomId) ?? { roomNo: b.roomNo }, 'staff');
  const rows = [...blocks].sort(
    (a, b) =>
      Number(['released', 'cancelled'].includes(a.status)) -
        Number(['released', 'cancelled'].includes(b.status)) ||
      a.startDate.localeCompare(b.startDate),
  );
  if (!rows.length) return <StateView icon="lock" title={t('ooo.empty')} />;
  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t('hk.wo.room')}</th>
              <th scope="col">{t('wo.col.status')}</th>
              <th scope="col">{t('ooo.col.nights')}</th>
              <th scope="col">{t('ooo.col.reopen')}</th>
              <th scope="col">{t('ci.reason')}</th>
              <th scope="col">{t('ooo.col.wo')}</th>
              <th scope="col">
                <span className="sr-only">{t('wo.col.status')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const st = BLOCK_STATUS[b.status];
              const reopen = b.endDateActual ?? b.endDatePlanned;
              const wo = orders.find((w) => w.id === b.workOrderId);
              const live = b.status === 'planned' || b.status === 'active';
              return (
                <tr key={b.id}>
                  <td>{room(b)}</td>
                  <td>
                    <Chip tone={st.tone} icon="lock">
                      {t(st.key)}
                    </Chip>
                  </td>
                  <td>
                    {t('ooo.nights', {
                      from: dayMonth(b.startDate),
                      to: dayMonth(addDays(reopen, -1)),
                    })}
                  </td>
                  <td>{dayMonth(reopen)}</td>
                  <td>{b.reason}</td>
                  <td>{wo ? <Code>{wo.code}</Code> : '—'}</td>
                  <td>
                    {canWrite && online && live ? (
                      <div className="row wrap">
                        <Button size="sm" onClick={() => setEditing({ b, mode: 'end' })}>
                          {t('ooo.change_end')}
                        </Button>
                        {b.status === 'planned' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditing({ b, mode: 'cancel' })}
                          >
                            {t('ooo.cancel')}
                          </Button>
                        ) : wo && !['done', 'cancelled'].includes(wo.status) ? (
                          <span className="li-s">
                            {t('ooo.release_needs_wo', { code: wo.code })}
                          </span>
                        ) : manager ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditing({ b, mode: 'release' })}
                          >
                            {t('ooo.release')}
                          </Button>
                        ) : (
                          <span className="li-s">{t('ooo.mgr_only')}</span>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editing?.mode === 'end' ? (
        <ChangeEndDialog
          block={editing.b}
          room={room(editing.b)}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            onChanged();
          }}
        />
      ) : null}
      {editing && editing.mode !== 'end' ? (
        <BlockActionDialog
          block={editing.b}
          action={editing.mode}
          room={room(editing.b)}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            onChanged();
          }}
        />
      ) : null}
    </>
  );
}

/** O3 – new reopening date (half-open): extending checks clashes like creation (409 → what to do). */
function ChangeEndDialog({
  block,
  room,
  onClose,
  onDone,
}: {
  block: RoomBlock;
  room: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const today = useBusinessDay(); // BR-010 (night window – BUG-R2-211)
  const [end, setEnd] = useState(block.endDatePlanned);
  const act = useSubmit({ bound: ['endDatePlanned'] });
  const min = addDays(block.startDate > today ? block.startDate : today, 1);
  const save = async () => {
    const out = await act.submit(() =>
      api.updateRoomBlock({ propertyId, roomBlockId: block.id }, end, block.version),
    );
    if (out) {
      toast(t('ooo.saved', { room, date: dayMonth(out.data.endDatePlanned) }));
      onDone();
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t('ooo.change_end_title', { room })}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!end || end === block.endDatePlanned}
            onClick={() => void save()}
          >
            {act.label(t('common.save'))}
          </Button>
        </>
      }
    >
      <Field
        label={t('ooo.reopen_date')}
        help={t('ooo.reopen_help')}
        required
        error={act.fields.endDatePlanned}
      >
        {(p) => (
          <input
            {...p}
            type="date"
            className="input"
            min={min}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        )}
      </Field>
      <BlockConflict error={act.error} room={room} />
      {act.code && ['ROOM_OCCUPIED', 'ROOM_UNAVAILABLE', 'ROOM_BLOCKED'].includes(act.code)
        ? null
        : act.view()}
    </Modal>
  );
}

/** O4 early release (MGR+, no open work order) / O5 cancel a planned block – consequence first (US-135). */
function BlockActionDialog({
  block,
  action,
  room,
  onClose,
  onDone,
}: {
  block: RoomBlock;
  action: 'release' | 'cancel';
  room: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const act = useSubmit({ bound: ['reason'] });
  const reopen = block.endDateActual ?? block.endDatePlanned;
  const save = async () => {
    const out = await act.submit((idem) =>
      api.transitionRoomBlock({ propertyId, roomBlockId: block.id }, action, reason.trim(), idem),
    );
    if (out) {
      toast(t(action === 'release' ? 'ooo.released_toast' : 'ooo.cancelled_toast', { room }));
      onDone();
    }
  };
  return (
    <ConfirmDialog
      title={t(action === 'release' ? 'ooo.release_title' : 'ooo.cancel_title', { room })}
      body={
        action === 'release'
          ? t('ooo.release_effect')
          : t('ooo.cancel_effect', {
              from: dayMonth(block.startDate),
              to: dayMonth(addDays(reopen, -1)),
            })
      }
      keepLabel={t('confirm.keep')}
      confirmLabel={t(action === 'release' ? 'ooo.release' : 'ooo.cancel')}
      busy={act.busy}
      busyLabel={act.busyLabel}
      confirmDisabled={reason.trim().length < 3}
      onKeep={onClose}
      onConfirm={() => void save()}
    >
      <Field label={t('ci.reason')} required error={act.fields.reason}>
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
      {act.view()}
    </ConfirmDialog>
  );
}
