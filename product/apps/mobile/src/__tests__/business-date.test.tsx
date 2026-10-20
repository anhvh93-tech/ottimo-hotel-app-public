// BUG-R2-211 (P1): the PWA used the phone's CALENDAR date as "today". Between 00:00 and 05:59 the business day
// (BR-010, rollover 06:00) is still the day before, the server refuses another day for HK (x-scope T) → 422
// `date NOT_IN_LIST` and "Các căn" / "Việc của tôi" showed "Chưa tải được…" for six hours every night.
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { staffApi, type RoomStatusEntry } from '../app/api';
import { arrivalText, arrivingToday } from '../app/tasks';
import { businessDate, localDate } from '../app/time';
import { http, HttpResponse } from 'msw';
import { mockControl, PROPERTY_ID } from '../mocks/handlers';
import { server } from '../mocks/node';
import { bodies, calls, setOnline, start, tv } from './helpers';

vi.mock('../app/image', async (orig) => ({
  ...(await orig<typeof import('../app/image')>()),
  compressPhoto: vi.fn(async () => new Blob([new Uint8Array(2000)], { type: 'image/jpeg' })),
}));

/** Instant of `hh:mm` on 20/10/2026, Asia/Ho_Chi_Minh (UTC+7). */
const vn = (hhmm: string) => new Date(`2026-10-20T${hhmm}:00+07:00`);

/** Freeze the clock at a VN time, then rebuild the mock data so its "today" is the business day then. */
function at(hhmm: string) {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(vn(hhmm));
  mockControl.reset();
}

beforeEach(() => setOnline(true));
afterEach(() => {
  vi.useRealTimers();
});

describe('businessDate (BR-010, rollover 06:00)', () => {
  it.each([
    ['02:40', '2026-10-19'], // the CI run 39312874062 time
    ['05:59', '2026-10-19'],
    ['06:00', '2026-10-20'],
    ['00:00', '2026-10-19'],
    ['23:59', '2026-10-20'],
  ])('%s on 20/10 → %s', (hhmm, day) => {
    expect(businessDate(vn(hhmm))).toBe(day);
  });

  it('calendar date stays the wall-clock day (kept only for wall-clock needs)', () => {
    expect(localDate(vn('02:40'))).toBe('2026-10-20');
  });

  it('uses the clock when no instant is given (fake clock 02:40 / 05:59 / 06:00)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(vn('02:40'));
    expect(businessDate()).toBe('2026-10-19');
    vi.setSystemTime(vn('05:59'));
    expect(businessDate()).toBe('2026-10-19');
    vi.setSystemTime(vn('06:00'));
    expect(businessDate()).toBe('2026-10-20');
  });

  it('"arriving today" follows the business day, not the calendar', () => {
    vi.useFakeTimers();
    vi.setSystemTime(vn('02:40'));
    const room = { nextArrival: { date: '2026-10-19', etaTime: '14:00' } } as RoomStatusEntry;
    const t = (k: string, a?: Record<string, string | number>) => tv(k, a);
    expect(arrivingToday(room)).toBe(true);
    expect(arrivalText(room, t)).toBe(tv('hk.arriving_today', { time: '14:00' }).trim());
    vi.setSystemTime(vn('06:00'));
    expect(arrivingToday(room)).toBe(false);
  });
});

describe('HK lists between 00:00 and 05:59 (BUG-R2-211)', () => {
  it.each(['02:40', '05:59', '06:00'])(
    '%s: "Việc của tôi" and "Các căn" load; the task list is asked without `date`',
    async (hhmm) => {
      at(hhmm);
      const { user } = await start('hk.lan');
      expect(await screen.findByText('Làm trước')).toBeInTheDocument();
      expect(screen.queryByText(tv('hk.error_title'))).not.toBeInTheDocument();
      await user.click(screen.getByRole('link', { name: 'Các căn' }));
      const card = await screen.findByRole('link', { name: /^Căn 103,/ });
      // Room 103's next arrival is on the business day → "today", even at 02:40 on the next calendar day.
      expect(
        within(card).getByText(tv('hk.arriving_today', { time: '14:00' }).trim()),
      ).toBeInTheDocument();
      expect(screen.queryByText(tv('hk.rooms_error_title'))).not.toBeInTheDocument();
      const q = mockControl.state.queries.filter((x) => x.op === 'listHkTasks');
      expect(q.length).toBeGreaterThan(0);
      expect(q.every((x) => !('date' in x.query))).toBe(true);
    },
  );

  it('the mock refuses the calendar date at 02:40 like the server (guards the fix)', async () => {
    at('02:40');
    mockControl.signIn('hk.lan');
    await expect(staffApi.listHkTasks(PROPERTY_ID, '2026-10-20')).rejects.toMatchObject({
      status: 422,
    });
    await expect(staffApi.listHkTasks(PROPERTY_ID, '2026-10-19')).resolves.toBeDefined();
    await expect(staffApi.listHkTasks(PROPERTY_ID)).resolves.toBeDefined();
  });
});

/** Every read of this list fails (StrictMode mounts twice, so a one-shot failure would be retried away). */
function failAlways(path: string) {
  server.use(
    http.get(`*/v1/properties/:pid/${path}`, () =>
      HttpResponse.json({ status: 500, code: 'INTERNAL' }, { status: 500 }),
    ),
  );
}

describe('two loads settle apart', () => {
  it('task list fails → "Các căn" still shows the rooms; "Việc của tôi" shows its own error', async () => {
    at('10:00');
    failAlways('hk-tasks');
    const { user } = await start('hk.lan');
    expect(await screen.findByText(tv('hk.error_title'))).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Các căn' }));
    expect(await screen.findByRole('link', { name: /^Căn 103,/ })).toBeInTheDocument();
    expect(screen.queryByText(tv('hk.rooms_error_title'))).not.toBeInTheDocument();
  });

  it('room list fails → tasks still show', async () => {
    at('10:00');
    failAlways('room-statuses');
    await start('hk.lan');
    expect(await screen.findByText('Làm trước')).toBeInTheDocument();
    expect(screen.queryByText(tv('hk.error_title'))).not.toBeInTheDocument();
  });
});

describe('dates the server checks against its business day', () => {
  it('02:40: a room block starts on the business day (server: startDate ≥ ctx.today)', async () => {
    at('02:40');
    const { user } = await start('mt.tung');
    await user.click(await screen.findByRole('link', { name: 'Phiếu sửa mới' }));
    await user.selectOptions(
      await screen.findByLabelText('Căn'),
      screen.getByRole('option', { name: '203 · The Sage' }),
    );
    await user.click(screen.getByRole('button', { name: 'Điện / đèn' }));
    await user.type(screen.getByLabelText(/Mô tả/), 'Đèn ban công chập chờn, thay dây');
    await user.click(
      screen.getByRole('checkbox', { name: 'Khóa căn – không bán đến khi sửa xong' }),
    );
    expect(screen.getByLabelText('Khóa từ')).toHaveAttribute('min', '2026-10-19');
    await user.type(screen.getByLabelText('Dự kiến xong'), '2026-10-20');
    await user.click(screen.getByRole('button', { name: 'Tạo phiếu và khóa căn' }));
    await waitFor(() => expect(calls('createWorkOrder')).toBe(1));
    expect(bodies('createWorkOrder')[0]).toMatchObject({
      block: { startDate: '2026-10-19', expectedDoneDate: '2026-10-20' },
    });
  });
});
