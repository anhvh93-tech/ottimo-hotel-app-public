import type { AttentionItem } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Icon, Modal, Skeleton, StateView } from '@ottimo/ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../app/api';
import { attentionLine, type AttentionLine } from '../../app/attention';
import { useCatalog } from '../../app/catalog';
import { channelName } from '../../app/reservations';
import { useStaffRoomLabel } from '../../app/rooms';
import { useToast } from '../../app/toast';
import { useDelayed } from '../../hooks/useDelayed';
import { useNarrow } from '../../hooks/useMedia';
import { useOnline } from '../../hooks/useOnline';
import type { ResourceState } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { useSubmit } from '../stay/common';
import { DebtCollectDialog } from '../stay/DebtCollectDialog';
import { useNewKeys } from './useDashboard';

/** "66,7%" (VI) / "66.7%" (EN), one decimal; `null` (no sellable room tonight) → "–" (Q-15). */
export function formatPct(locale: 'vi' | 'en', pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return '–';
  const n = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    maximumFractionDigits: 1,
  }).format(pct);
  return `${n}%`;
}

/**
 * H24 SSE state – always with text, the offline mark has another shape (empty red ring), not only another
 * colour (A4): Trực tiếp / Đang kết nối lại (+ "tự tải lại mỗi 30 giây") / Ngoại tuyến.
 */
export function LiveBadge({ stale }: { stale: boolean }) {
  const { t } = useI18n();
  const { online } = useOnline();
  if (!online)
    return (
      <span className="live off">
        <i aria-hidden="true" />
        <span>{t('ov.offline_short')}</span>
      </span>
    );
  if (stale)
    return (
      <span className="live re">
        <i aria-hidden="true" />
        <span>
          {t('ov.reconnecting')} <span className="li-s">· {t('ov.poll_note')}</span>
        </span>
      </span>
    );
  return (
    <span className="live">
      <i aria-hidden="true" />
      <span>{t('ov.live')}</span>
    </span>
  );
}

/** Skeleton rows, shown only after 300 ms (H03 "Trạng thái"). */
export function SkeletonRows({ rows, height = 56 }: { rows: number; height?: number }) {
  const { t } = useI18n();
  const show = useDelayed(true);
  if (!show) return null;
  return (
    <div className="cards" aria-busy="true">
      <span className="sr-only" role="status">
        {t('common.loading')}
      </span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </div>
  );
}

/** Lines for the items, with names/labels read from the room catalogue and channels. */
export function useAttentionLines(items: AttentionItem[] | undefined): AttentionLine[] | undefined {
  const { t, locale } = useI18n();
  const propertyId = usePropertyId();
  const { roles, property } = useSession();
  const catalog = useCatalog(propertyId);
  const room = useStaffRoomLabel(propertyId);
  if (!items) return undefined;
  const seen = new Map<string, number>();
  return items.map((item) => {
    const line = attentionLine(item, {
      t,
      roles,
      room,
      channel: (code) => channelName(catalog.channels, code) || code,
      timeZone: property?.timezone,
      num: (n) =>
        new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
          maximumFractionDigits: 1,
        }).format(n),
    });
    // Identical items (same kind, ids and params) still get distinct React keys.
    const n = seen.get(line.key) ?? 0;
    seen.set(line.key, n + 1);
    return n ? { ...line, key: `${line.key}#${n}` } : line;
  });
}

/**
 * "Cần chú ý" (US-012, BR-907): critical → warning → info (server order), one line per kind (AC4), each
 * opens the screen that handles it; `event` items have "Đã xử lý" / "Đã báo kênh" (resolveAttentionEvent).
 * Items new since the last read get "Mới" + a 2 s highlight and ONE polite announcement – no focus move.
 * `compact` = H24 phone list (whole row is the link); otherwise H03 task cards – on a phone (≤ 860 px) H03 uses
 * the H24 rows as well (UXD FE-S4-27).
 */
export function AttentionBlock({
  state,
  onReload,
  compact,
  emptyTitleKey,
  emptyBodyKey,
}: {
  state: ResourceState<AttentionItem[]>;
  onReload: () => void;
  compact?: boolean;
  emptyTitleKey: string;
  emptyBodyKey?: string;
}) {
  const { t } = useI18n();
  const { online } = useOnline();
  // UXD FE-S4-27: on a phone H03 uses the H24 row too (DS 6.20) – a "Mở" button beside the text overflowed 390 px.
  const narrow = useNarrow();
  const rowLinks = compact || narrow;
  const lines = useAttentionLines(state.data);
  const { fresh, announce } = useNewKeys(lines?.map((l) => l.key));
  const [closing, setClosing] = useState<AttentionLine | null>(null);
  // ARC 16.26: "Thu công nợ" on a `checkout_debt` line of one booking (FD+).
  const { roles } = useSession();
  const fdPlus = roles.some((r) =>
    ['owner', 'manager', 'front_desk_lead', 'front_desk'].includes(r),
  );
  const [collecting, setCollecting] = useState<string | null>(null);

  let body;
  if (!lines && state.status === 'error')
    body = (
      <Alert
        tone="bad"
        title={t('ov.attn_error_title')}
        actions={
          <Button size="sm" onClick={onReload}>
            {t('common.retry')}
          </Button>
        }
      >
        {t('common.error_network_body')}
      </Alert>
    );
  else if (!lines) body = <SkeletonRows rows={3} height={64} />;
  else if (!lines.length)
    body = (
      <StateView icon="check" title={t(emptyTitleKey)}>
        {emptyBodyKey ? t(emptyBodyKey) : null}
      </StateView>
    );
  else
    body = (
      <ul className="list-none stack">
        {lines.map((l) => {
          const isNew = fresh.has(l.key);
          const chips = (
            <>
              {isNew ? (
                <Chip tone="ink" icon="sparkle">
                  {t('ov.new')}
                </Chip>
              ) : null}
              {l.ownerOnly ? <Chip icon="shield">{t('ov.owner_only')}</Chip> : null}
            </>
          );
          const text = (
            <div className="grow">
              <div className="li-t">{l.text}</div>
              {l.sub ? <div className="li-s">{l.sub}</div> : null}
              {isNew || l.ownerOnly ? <div className="row wrap mt-4">{chips}</div> : null}
            </div>
          );
          const ic = (
            <span className="ic">
              <Icon name={l.icon} />
            </span>
          );
          const cls = `task ${l.tone}${isNew ? ' is-new' : ''}`;
          const resolve = l.resolveLabel ? (
            <Button size="sm" disabled={!online} onClick={() => setClosing(l)}>
              {t(l.resolveLabel)}
            </Button>
          ) : l.collectDebtId && fdPlus ? (
            <Button
              size="sm"
              disabled={!online}
              onClick={() => setCollecting(l.collectDebtId ?? null)}
            >
              {t('debt.collect')}
            </Button>
          ) : null;
          // H24 (phone): the whole row is the link; H03: card with "Mở" + "Đã xử lý" buttons.
          return rowLinks && l.to ? (
            <li key={l.key}>
              <Link className={`${cls} rowlink`} to={l.to}>
                {ic}
                {text}
                <Icon name="chevron" />
              </Link>
              {resolve ? <div className="row mt-4">{resolve}</div> : null}
            </li>
          ) : (
            <li key={l.key} className={cls}>
              {ic}
              {text}
              {l.to ? (
                <Link className="btn sm" to={l.to}>
                  {t('today.open')}
                </Link>
              ) : null}
              {resolve}
            </li>
          );
        })}
      </ul>
    );

  return (
    <>
      {body}
      <span className="sr-only" role="status" aria-live="polite">
        {announce ? t('ov.sse_new_announce') : ''}
      </span>
      {collecting ? (
        <DebtCollectDialog
          reservationId={collecting}
          onClose={() => setCollecting(null)}
          onDone={() => {
            setCollecting(null);
            onReload();
          }}
        />
      ) : null}
      {closing ? (
        <ResolveDialog
          line={closing}
          onClose={() => setClosing(null)}
          onDone={() => {
            setClosing(null);
            onReload();
          }}
        />
      ) : null}
    </>
  );
}

/** Close an `event` item with a note (required for critical items – EP01 3.2). */
function ResolveDialog({
  line,
  onClose,
  onDone,
}: {
  line: AttentionLine;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const [note, setNote] = useState('');
  const act = useSubmit({ bound: ['note'] });
  const short = line.noteRequired && note.trim().length < 3;
  const save = async () => {
    if (short) return;
    const out = await act.submit((idem) =>
      api.resolveAttentionEvent(
        { propertyId, eventId: line.item.eventId! },
        { note: note.trim() || undefined },
        idem,
      ),
    );
    if (out) {
      toast(t('attn.resolved'));
      onDone();
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t('attn.resolve_title', { what: line.text })}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={short}
            onClick={() => void save()}
          >
            {act.label(t(line.resolveLabel ?? 'attn.resolve'))}
          </Button>
        </>
      }
    >
      {line.sub ? <p className="li-s">{line.sub}</p> : null}
      <Field
        label={t('attn.resolve_note')}
        help={t('attn.resolve_note_help')}
        required={line.noteRequired}
        error={act.fields.note}
      >
        {(p) => (
          <textarea
            {...p}
            className="input"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </Field>
      {act.view()}
    </Modal>
  );
}
