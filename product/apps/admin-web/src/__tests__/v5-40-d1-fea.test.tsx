// v1.0.5 PR-D1 (BE PR #100), Desk side.
// - V5-40: `front_desk_lead` must turn 2FA on (server MFA_REQUIRED_ROLES = owner, manager, front_desk_lead). The Desk
//   reads the server's flags (Me.mfaEnrollmentRequired / mfaRequiredButMissing, getMy2fa.required); the MSW mock now
//   has the same role list. Not changed by V5-40: the notification-email reminder (owner/manager) and the S2 step-up
//   when roles are added (owner/manager).
// - `departuresDate` (contract 0.3.13 1.19, BUG-R4-036): between midnight and the rollover the departures list is
//   the calendar day's; the title names that day. Arrivals and the KPI stay on the business day.
import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../app/api';
import { shiftDay, weekdayDate } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { renderApp, signIn, tv } from '../test/render';

const userOf = (name: string) => mockControl.db.users.find((u) => u.username === name)!;

describe('V5-40 – lễ tân trưởng bắt buộc bật xác thực 2 bước', () => {
  it('MFA_ENFORCED: qa.fdl without 2FA → the mandatory enrolment screen; the API refuses everything else', async () => {
    mockControl.db.mfaEnforced = true;
    const { user } = renderApp('/today');
    await signIn(user, 'qa.fdl');
    expect(await screen.findByText(tv('mfa.enroll_required'))).toBeInTheDocument();
    expect(mockControl.db.enrollmentOnly).toBe(true);
    const res = await fetch('http://localhost/v1/properties/x/rooms');
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('MFA_ENROLLMENT_REQUIRED');
  });

  it('MFA_ENFORCED: qa.fd (front desk) is not forced', async () => {
    mockControl.db.mfaEnforced = true;
    const { user } = renderApp('/today');
    await signIn(user, 'qa.fd');
    expect(
      await screen.findByRole('region', { name: tv('today.arrivals', { n: 2 }) }),
    ).toBeInTheDocument();
    expect(screen.queryByText(tv('mfa.enroll_required'))).toBeNull();
    expect(mockControl.db.enrollmentOnly).toBe(false);
  });

  it('not enforced: qa.fdl without 2FA gets the 2FA reminder; qa.fd does not', async () => {
    userOf('qa.fdl').email = 'fdl@example.test';
    renderApp('/today', 'qa.fdl');
    expect(await screen.findByText(tv('mfa.nudge'))).toBeInTheDocument();
  });

  it('not enforced: qa.fd gets no 2FA reminder', async () => {
    renderApp('/today', 'qa.fd');
    await screen.findByRole('region', { name: tv('today.arrivals', { n: 2 }) });
    expect(screen.queryByText(tv('mfa.nudge'))).toBeNull();
  });

  it('qa.fdl with 2FA on: "required" note, no "turn off" button (disableMy2fa refused)', async () => {
    mockControl.enableMfa('qa.fdl');
    renderApp('/security', 'qa.fdl');
    expect(await screen.findByText(tv('mfa.required_note'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('mfa.disable') })).toBeNull();
  });

  it('unchanged by V5-40: no notification email → the email reminder still only for owner/manager, not qa.fdl', async () => {
    mockControl.enableMfa('qa.fdl');
    userOf('qa.fdl').email = undefined;
    renderApp('/today', 'qa.fdl');
    await screen.findByRole('region', { name: tv('today.arrivals', { n: 2 }) });
    expect(screen.queryByText(tv('secmail.nudge'))).toBeNull();
  });
});

describe('departuresDate – title of the departures list (contract 0.3.13 1.19)', () => {
  /** The server's answer with `departuresDate` set as `shift` days after `date` (undefined = field absent). */
  function departuresDay(shift: number | undefined) {
    const orig = api.getArrivalsDepartures.bind(api);
    return vi.spyOn(api, 'getArrivalsDepartures').mockImplementation(async (...args) => {
      const r = await orig(...args);
      const data = { ...r.data };
      if (shift === undefined) delete data.departuresDate;
      else data.departuresDate = shiftDay(data.date, shift);
      return { ...r, data };
    });
  }

  it('01:30 window: departuresDate = business day + 1 → "Khách đi (n) · <weekday dd/mm/yyyy>"; arrivals title unchanged', async () => {
    const spy = departuresDay(1);
    try {
      renderApp('/today', 'qa.fd');
      const dep = await screen.findByRole('region', {
        name: new RegExp(`^${tv('today.departures', { n: 1 }).replace(/[()]/g, '\\$&')} · `),
      });
      const { data } = (await spy.mock.results[0]!.value) as { data: { date: string } };
      const day = weekdayDate(
        'vi',
        'Asia/Ho_Chi_Minh',
        new Date(`${shiftDay(data.date, 1)}T12:00:00+07:00`),
      );
      expect(within(dep).getByRole('heading', { level: 2 })).toHaveTextContent(
        `${tv('today.departures', { n: 1 })} · ${day}`,
      );
      expect(
        screen.getByRole('region', { name: tv('today.arrivals', { n: 2 }) }),
      ).toBeInTheDocument();
    } finally {
      spy.mockRestore();
    }
  });

  it('departuresDate = date → title as before', async () => {
    renderApp('/today', 'qa.fd');
    expect(
      await screen.findByRole('region', { name: tv('today.departures', { n: 1 }) }),
    ).toBeInTheDocument();
  });

  it('older server without departuresDate → title as before', async () => {
    const spy = departuresDay(undefined);
    try {
      renderApp('/today', 'qa.fd');
      expect(
        await screen.findByRole('region', { name: tv('today.departures', { n: 1 }) }),
      ).toBeInTheDocument();
    } finally {
      spy.mockRestore();
    }
  });
});
