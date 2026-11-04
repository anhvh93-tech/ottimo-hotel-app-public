/**
 * v1.0.4 P4-34 – H05 hộp Sửa tham số: hủy dòng **Chưa hiệu lực** bằng `cancelScheduledParameter`
 * (OpenAPI 0.3.8: quyền như `setParameter` theo khóa; S2 chỉ với `payment_receiving_account`).
 * Sổ tay ngày thay tờ quyền riêng tư: OWN hủy dòng lên lịch của `privacy_notice_version` trên Desk, không SQL.
 * Mock riêng trong test (`server.use`) – plan v1.0.4 mục 4.1: không sửa `mocks/handlers.ts`.
 */
import type { Parameter, Role } from '@ottimo/api-client';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../mocks/node';
import { RECEIVING_KEY } from '../pages/ReceivingAccount';
import { GROUP_LABEL, paramLabel, paramMeta } from '../pages/paramCatalog';
import { renderApp, tv } from '../test/render';

const NOTICE = 'privacy_notice_version';
const QUOTE = 'quote_validity_days';
const PAST = '2026-01-01';
const LATER = '2099-01-10';
const LATER_VI = '10/01/2099';

type Sent = { key: string; body: Record<string, unknown>; idem: string | null };
let history: Record<string, Parameter[]>;
let sent: Sent[];
type Mode = 'ok' | 409 | 404 | 422 | 'network' | 'inprogress';
/** Answer for every request; `queue` (one per request, in order) wins while it has items. */
let answer: Mode;
let queue: Mode[];

function row(
  key: string,
  value: unknown,
  effectiveFrom: string,
  editableBy: Role[],
  reason: string,
) {
  return {
    key,
    value,
    effectiveFrom,
    editableBy,
    changedBy: 'Chủ đầu tư',
    changedAt: `${effectiveFrom}T03:00:00Z`,
    reason,
  } satisfies Parameter;
}

function problem(status: number, code: string, extra: Record<string, unknown> = {}) {
  return HttpResponse.json(
    { type: `/problems/${code}`, title: code, status, code, requestId: `mock-${status}`, ...extra },
    { status, headers: { 'content-type': 'application/problem+json' } },
  );
}

const current = (key: string) => history[key]!.find((h) => h.effectiveFrom <= PAST)!;

beforeEach(() => {
  history = {
    [NOTICE]: [
      row(NOTICE, 'privacy-2099-01-v2', LATER, ['owner'], 'Tờ mới'),
      row(NOTICE, 'privacy-2026-10-v1', PAST, ['owner'], 'Bản đầu'),
    ],
    [QUOTE]: [
      row(QUOTE, 5, LATER, ['owner', 'manager'], 'Mùa thấp'),
      row(QUOTE, 3, PAST, ['owner', 'manager'], 'Mặc định'),
    ],
  };
  sent = [];
  answer = 'ok';
  queue = [];
  server.use(
    http.get('*/v1/properties/:pid/parameters', () =>
      HttpResponse.json({ data: Object.keys(history).map(current) }),
    ),
    http.get('*/v1/properties/:pid/parameters/:key', ({ params }) => {
      const rows = history[String(params.key)];
      if (!rows) return problem(404, 'NOT_FOUND');
      return HttpResponse.json({ current: current(String(params.key)), history: rows });
    }),
    http.post(
      '*/v1/properties/:pid/parameters/:key/actions/cancel-scheduled',
      async ({ request, params }) => {
        const key = String(params.key);
        const body = (await request.json()) as Record<string, unknown>;
        sent.push({ key, body, idem: request.headers.get('idempotency-key') });
        const mode = queue.shift() ?? answer;
        if (mode === 'network') return HttpResponse.error();
        if (mode === 'inprogress') return problem(409, 'IDEMPOTENCY_IN_PROGRESS');
        if (mode === 409) return problem(409, 'INVALID_TRANSITION', { currentState: 'in_force' });
        if (mode === 404) return problem(404, 'NOT_FOUND');
        if (mode === 422)
          return problem(422, 'VALIDATION_FAILED', {
            errors: [{ field: 'reason', code: 'REASON_REQUIRED' }],
          });
        history[key] = history[key]!.filter((h) => h.effectiveFrom !== body.effectiveFrom);
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
});

async function openDialog(user: ReturnType<typeof renderApp>['user'], key: string) {
  const label = paramLabel(tv, key);
  await user.click(await screen.findByRole('tab', { name: tv(GROUP_LABEL[paramMeta(key).group]) }));
  await user.click(await screen.findByRole('button', { name: `${tv('rooms.edit')}: ${label}` }));
  const dlg = await screen.findByRole('dialog', { name: tv('params.edit_title', { name: label }) });
  await within(dlg).findByText(tv('params.not_yet'));
  return { dlg, label };
}

const cancelButton = (dlg: HTMLElement) =>
  within(dlg).queryByRole('button', { name: `${tv('params.cancel_scheduled')}: ${LATER_VI}` });

async function askCancel(user: ReturnType<typeof renderApp>['user'], dlg: HTMLElement) {
  await user.click(cancelButton(dlg)!);
  return screen.findByRole('alertdialog', { name: tv('params.cancel_title') });
}

const confirmIn = (ask: HTMLElement) =>
  within(ask).getByRole('button', { name: tv('params.cancel_scheduled') });

describe('v1.0.4 P4-34 – hủy tham số đã lên lịch trong hộp Sửa tham số', () => {
  it('owner: only the "Chưa hiệu lực" row has the button; cancel → POST, toast, history reloaded', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const { dlg, label } = await openDialog(user, NOTICE);
    // One button, on the scheduled row only (the row in force has none).
    expect(
      within(dlg).getAllByRole('button', {
        name: new RegExp(`^${tv('params.cancel_scheduled')}:`),
      }),
    ).toHaveLength(1);
    const ask = await askCancel(user, dlg);
    expect(ask).toHaveTextContent(
      tv('params.cancel_body', { value: 'privacy-2099-01-v2', date: LATER_VI, name: label }),
    );
    // The safe button has focus (C16); a reason is required before anything is sent.
    expect(within(ask).getByRole('button', { name: tv('confirm.keep') })).toHaveFocus();
    await user.click(confirmIn(ask));
    expect(await within(ask).findByText(tv('field_error.reason_required'))).toBeInTheDocument();
    expect(sent).toHaveLength(0);

    await user.type(
      within(ask).getByLabelText(new RegExp(`^${tv('params.reason')}`)),
      'Đổi ngày thay tờ',
    );
    await user.click(confirmIn(ask));
    expect(await screen.findByText(tv('params.cancelled', { name: label }))).toBeInTheDocument();
    expect(sent).toEqual([
      {
        key: NOTICE,
        body: { effectiveFrom: LATER, reason: 'Đổi ngày thay tờ' },
        idem: expect.stringMatching(/^[0-9a-f-]{36}$/),
      },
    ]);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    // The edit dialog stays open; its history no longer has the scheduled row.
    await waitFor(() => expect(within(dlg).queryByText(tv('params.not_yet'))).toBeNull());
    expect(cancelButton(dlg)).toBeNull();
  });

  it('manager: cancels a key managers edit; owner-only keys never open for a manager', async () => {
    const { user } = renderApp('/settings/parameters', 'qa.mgr');
    const { dlg } = await openDialog(user, QUOTE);
    expect(cancelButton(dlg)).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: tv('common.cancel') }));
    await user.click(screen.getByRole('tab', { name: tv('params.grp_other') }));
    expect(
      screen.queryByRole('button', { name: `${tv('rooms.edit')}: ${paramLabel(tv, NOTICE)}` }),
    ).toBeNull();
  });

  it('front desk lead: no edit dialog, so no cancel button', async () => {
    renderApp('/settings/parameters', 'qa.fdl');
    expect(await screen.findByText(tv('params.view_only_banner'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(`^${tv('rooms.edit')}: `) })).toBeNull();
    expect(
      screen.queryByRole('button', { name: new RegExp(`^${tv('params.cancel_scheduled')}`) }),
    ).toBeNull();
  });

  it('409 (already in force) → said in the box, confirm locked, history read again', async () => {
    answer = 409;
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const { dlg } = await openDialog(user, NOTICE);
    const ask = await askCancel(user, dlg);
    await user.type(within(ask).getByLabelText(new RegExp(`^${tv('params.reason')}`)), 'Nhập nhầm');
    await user.click(confirmIn(ask));
    expect(
      await within(ask).findByText(tv('params.cancel_effective', { date: LATER_VI })),
    ).toBeInTheDocument();
    expect(confirmIn(ask)).toBeDisabled();
    expect(within(ask).getByRole('alert')).toHaveTextContent(
      tv('params.cancel_effective', { date: LATER_VI }),
    );
    // UXD FB-R4-UXD-FE-P434-02: nothing left to keep – the safe button is "Đóng".
    expect(within(ask).queryByRole('button', { name: tv('confirm.keep') })).toBeNull();
    await user.click(within(ask).getByRole('button', { name: tv('common.close') }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.queryByText(tv('params.cancelled', { name: paramLabel(tv, NOTICE) }))).toBeNull();
  });

  it('404 (someone just cancelled it) → said in the box; 422 reason → under the field, key renewed', async () => {
    answer = 422;
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const { dlg } = await openDialog(user, NOTICE);
    const ask = await askCancel(user, dlg);
    const reason = within(ask).getByLabelText(new RegExp(`^${tv('params.reason')}`));
    await user.type(reason, 'abc');
    await user.click(confirmIn(ask));
    await waitFor(() => expect(reason).toHaveAttribute('aria-invalid', 'true'));
    answer = 404;
    await user.click(confirmIn(ask));
    expect(
      await within(ask).findByText(tv('params.cancel_gone', { date: LATER_VI })),
    ).toBeInTheDocument();
    // UXD FB-R4-UXD-FE-P434-03: not the user's mistake → info tone, role=status.
    expect(within(ask).getByRole('status')).toHaveTextContent(
      tv('params.cancel_gone', { date: LATER_VI }),
    );
    expect(within(ask).getByRole('button', { name: tv('common.close') })).toBeInTheDocument();
    expect(confirmIn(ask)).toBeDisabled();
    expect(sent).toHaveLength(2);
    expect(sent[0]!.idem).not.toBe(sent[1]!.idem);
  });
  it('receiving account in the shared table: no cancel button (S2 lives in its own section), nothing sent', async () => {
    const acct = (masked: string) => ({
      bankBin: '970436',
      bankName: 'Vietcombank',
      accountNoMasked: masked,
      accountName: 'OTTIMO',
    });
    history[RECEIVING_KEY] = [
      row(RECEIVING_KEY, acct('•••• 5678'), LATER, ['owner'], 'Tài khoản mới'),
      row(RECEIVING_KEY, acct('•••• 1234'), PAST, ['owner'], 'Tài khoản đầu'),
    ];
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const { dlg } = await openDialog(user, RECEIVING_KEY);
    expect(
      within(dlg).queryByRole('button', {
        name: new RegExp(`^${tv('params.cancel_scheduled')}`),
      }),
    ).toBeNull();
    expect(within(dlg).queryByRole('columnheader', { name: tv('rooms.col_action') })).toBeNull();
    expect(sent).toHaveLength(0);
  });

  it('network error then 204: the retry resends the same key and body; the reason is read-only meanwhile', async () => {
    queue = ['network', 'ok'];
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const { dlg, label } = await openDialog(user, NOTICE);
    const ask = await askCancel(user, dlg);
    const reason = within(ask).getByLabelText(new RegExp(`^${tv('params.reason')}`));
    await user.type(reason, 'Đổi ngày thay tờ');
    await user.click(confirmIn(ask));
    expect(await within(ask).findByText(tv('common.error_network_body'))).toBeInTheDocument();
    expect(reason).toHaveAttribute('readonly');
    await user.type(reason, ' sửa');
    expect(reason).toHaveValue('Đổi ngày thay tờ');
    await user.click(confirmIn(ask));
    expect(await screen.findByText(tv('params.cancelled', { name: label }))).toBeInTheDocument();
    expect(sent).toHaveLength(2);
    expect(sent[1]!.idem).toBe(sent[0]!.idem);
    expect(sent[1]!.body).toEqual(sent[0]!.body);
  });

  it('409 IDEMPOTENCY_IN_PROGRESS: says so, keeps the key; a later definite answer renews it', async () => {
    queue = ['inprogress', 'inprogress', 409];
    const { user } = renderApp('/settings/parameters', 'qa.owner');
    const { dlg } = await openDialog(user, NOTICE);
    const ask = await askCancel(user, dlg);
    const reason = within(ask).getByLabelText(new RegExp(`^${tv('params.reason')}`));
    await user.type(reason, 'Đổi ngày thay tờ');
    await user.click(confirmIn(ask));
    expect(await within(ask).findByText(tv('error.IDEMPOTENCY_IN_PROGRESS'))).toBeInTheDocument();
    expect(reason).toHaveAttribute('readonly');
    await user.click(confirmIn(ask));
    await waitFor(() => expect(sent).toHaveLength(2));
    await user.click(confirmIn(ask));
    expect(
      await within(ask).findByText(tv('params.cancel_effective', { date: LATER_VI })),
    ).toBeInTheDocument();
    expect(new Set(sent.map((x) => x.idem)).size).toBe(1);
    expect(sent.every((x) => JSON.stringify(x.body) === JSON.stringify(sent[0]!.body))).toBe(true);
    expect(reason).not.toHaveAttribute('readonly');
  });
});
