import { isApiError } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Seg, StateView } from '@ottimo/ui';
import { useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useBusinessDay } from '../../app/businessDay';
import { problemView } from '../../app/problem';
import {
  monthOf,
  statementsApi,
  statusTone,
  type BillingCandidate,
  type BillingPeriodSummary,
} from '../../app/statements';
import { useWrite } from '../../app/useWrite';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useResource } from '../../hooks/useResource';
import { usePropertyId } from '../../session/SessionProvider';
import { dayText, monthText, num, statusText } from './labels';
import { StatementDrawer } from './StatementDrawer';

type Tab = 'draft' | 'issued' | 'overdue' | 'paid' | 'void';
const TAB_QUERY: Record<Tab, { status?: string; overdue?: boolean }> = {
  draft: { status: 'draft' },
  issued: { status: 'issued,partially_paid' },
  overdue: { overdue: true },
  paid: { status: 'paid' },
  void: { status: 'void' },
};

/**
 * S16 "Long stay · Monthly statements" (FB-INV-012, contract §6.1/§6.3): who is ready to bill this month (from
 * `listBillingCandidates`), then the statements by tab. The drawer shows lines, warnings and the actions the server
 * allows (`availableActions` – the screen never infers rights by itself).
 */
export function StatementsPage() {
  const { t, locale } = useI18n();
  const propertyId = usePropertyId();
  const today = useBusinessDay();
  const [month, setMonth] = useState(() => monthOf(today));
  // UXD-189-08: "Cần chú ý" opens `?tab=overdue` (or `?tab=issued` when only due today).
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const q = params.get('tab');
    return q && q in TAB_QUERY ? (q as Tab) : 'draft';
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const ids = useId();
  const candidates = useResource(
    async () => (await statementsApi.listBillingCandidates(propertyId, month)).data.items,
    [propertyId, month],
  );
  const list = useResource(
    async () =>
      (
        await statementsApi.listBillingPeriods(propertyId, {
          ...TAB_QUERY[tab],
          // Overdue is across months (an old statement still unpaid is what the desk must see).
          month: tab === 'overdue' ? undefined : month,
        })
      ).data.items,
    [propertyId, month, tab],
  );
  const reloadAll = () => {
    candidates.reload();
    list.reload();
  };

  return (
    <>
      <Topbar
        title={t('stmt.title')}
        sub={t('stmt.subtitle', { month: monthText(locale, month) })}
      />
      <Page>
        <div className="row wrap mb-16">
          <label className="lbl" htmlFor={`${ids}-m`}>
            {t('stmt.month')}
          </label>
          <input
            id={`${ids}-m`}
            className="input"
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        </div>

        <section className="card mb-16" aria-labelledby={`${ids}-ready`}>
          <h2 className="label-h mb-8" id={`${ids}-ready`}>
            {t('stmt.ready_title', { month: monthText(locale, month) })}
          </h2>
          {candidates.state.status === 'error' ? (
            <ErrorBlock
              titleKey="stmt.load_error"
              error={candidates.state.error}
              onRetry={candidates.reload}
            />
          ) : !candidates.state.data ? (
            <LoadingBlock rows={2} />
          ) : !candidates.state.data.length ? (
            <p className="li-s">{t('stmt.ready_empty')}</p>
          ) : (
            <ul className="list-plain stack">
              {candidates.state.data.map((c) => (
                <CandidateRow
                  key={c.reservationId}
                  c={c}
                  month={month}
                  onOpen={(id) => {
                    setOpenId(id);
                    reloadAll();
                  }}
                />
              ))}
            </ul>
          )}
        </section>

        <div className="mb-8">
          <Seg
            label={t('stmt.tabs')}
            value={tab}
            onChange={setTab}
            options={(['draft', 'issued', 'overdue', 'paid', 'void'] as Tab[]).map((v) => ({
              value: v,
              label: t(`stmt.tab.${v}`),
            }))}
          />
        </div>
        {list.state.status === 'error' ? (
          <ErrorBlock titleKey="stmt.load_error" error={list.state.error} onRetry={list.reload} />
        ) : !list.state.data ? (
          <LoadingBlock />
        ) : !list.state.data.length ? (
          <StateView icon="sparkle" title={t(`stmt.empty.${tab}`)} />
        ) : (
          <div className="table-wrap">
            <table className="table stmt-table">
              <thead>
                <tr>
                  <th scope="col">{t('stmt.col_code')}</th>
                  <th scope="col">{t('stmt.col_room')}</th>
                  <th scope="col">{t('stmt.col_month')}</th>
                  <th scope="col" className="r">
                    {t('stmt.col_total')}
                  </th>
                  <th scope="col" className="r">
                    {t('stmt.col_balance')}
                  </th>
                  <th scope="col">{t('stmt.col_due')}</th>
                  <th scope="col">{t('stmt.col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {list.state.data.map((s) => (
                  <SummaryRow key={s.id} s={s} onOpen={() => setOpenId(s.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Page>
      {openId ? (
        <StatementDrawer
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={reloadAll}
          onOpen={(id) => setOpenId(id)}
        />
      ) : null}
    </>
  );
}

function SummaryRow({ s, onOpen }: { s: BillingPeriodSummary; onOpen: () => void }) {
  const { t, locale } = useI18n();
  const tone = statusTone(s.status, s.alertLevel);
  return (
    <tr className={s.alertLevel && s.alertLevel !== 'due_today' ? 'stmt-row-overdue' : undefined}>
      <td>
        <button type="button" className="btn ghost sm mono" onClick={onOpen}>
          {s.code ?? t('stmt.draft_code')}
        </button>
      </td>
      <td>
        {s.roomNos.join(', ')} · {s.guestDisplayName ?? ''}
      </td>
      <td>{monthText(locale, s.month)}</td>
      <td className="r num">{s.totalVnd == null ? '' : num(s.totalVnd)}</td>
      <td className="r num">{num(s.balanceVnd)}</td>
      <td>{dayText(locale, s.dueDate)}</td>
      <td>
        <Chip tone={tone.tone} icon={null} className={tone.className}>
          {statusText(t, s)}
        </Chip>
      </td>
    </tr>
  );
}

function CandidateRow({
  c,
  month,
  onOpen,
}: {
  c: BillingCandidate;
  month: string;
  onOpen: (id: string) => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const write = useWrite();
  const [err, setErr] = useState<string | null>(null);
  const create = async () => {
    setErr(null);
    try {
      const p = await write.run((key) =>
        statementsApi.createBillingPeriod(
          propertyId,
          c.reservationId,
          { month, kind: 'regular' },
          key,
        ),
      );
      onOpen(p.data.id);
    } catch (e) {
      if (
        isApiError(e) &&
        e.code === 'STATEMENT_EXISTS' &&
        typeof e.problem.billingPeriodId === 'string'
      )
        return onOpen(e.problem.billingPeriodId);
      setErr(problemView(t, e).text);
    }
  };
  return (
    <li className="row wrap stmt-candidate">
      <span className="grow">
        <b>{c.roomNos.join(', ')}</b> · {c.guestDisplayName ?? ''}
      </span>
      {c.readingStatus === 'missing' ? (
        <>
          <Chip tone="neutral" icon={null}>
            {t('stmt.reading_missing')}
          </Chip>
          <Link className="btn sm" to="/long-stay/meters">
            {t('stmt.enter_readings')}
          </Link>
        </>
      ) : (
        <Chip tone="long" icon="check">
          {t(c.readingStatus === 'exception' ? 'stmt.reading_exception' : 'stmt.reading_recorded')}
        </Chip>
      )}
      {c.draftId ? (
        <Button size="sm" onClick={() => onOpen(c.draftId!)}>
          {t('stmt.open_draft')}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="pri"
          busy={write.busy}
          busyLabel={write.busyLabel}
          onClick={() => void create()}
        >
          {write.label(t('stmt.create_draft'))}
        </Button>
      )}
      {err ? <Alert tone="bad">{err}</Alert> : null}
    </li>
  );
}
