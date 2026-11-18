// FB-INV-012 (UXD #189, BE-190-03/12): the READING_OUT_OF_WINDOW sentence takes `{days}` from the server's
// `lateUntil` − `windowTo` (parameter `lateMaxDays`), never a number typed in the copy; past the late limit there is
// no "ask the lead". Made-up dates only.
import { ApiError } from '@ottimo/api-client';
import { translate } from '@ottimo/i18n';
import { describe, expect, it } from 'vitest';
import { problemView } from '../app/problem';

const tv = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);
const outOfWindow = (extra: Record<string, unknown>) =>
  new ApiError(422, {
    type: '/problems/reading-out-of-window',
    title: 'READING_OUT_OF_WINDOW',
    status: 422,
    code: 'READING_OUT_OF_WINDOW',
    windowFrom: '2026-11-25',
    windowTo: '2026-11-26',
    ...extra,
  });

describe('READING_OUT_OF_WINDOW copy', () => {
  it('late entry still allowed: {days} and {date} from the problem body', () => {
    const e = outOfWindow({ lateUntil: '2026-12-03', lateNeedsRole: 'front_desk_lead' });
    expect(problemView(tv, e).text).toBe(
      tv('error.READING_OUT_OF_WINDOW', { date: '26/11/2026', days: 7 }),
    );
    expect(problemView(tv, e).text).toContain('7 ngày');
    expect(tv('error.READING_OUT_OF_WINDOW', { date: 'x', days: 1 })).not.toMatch(/\b10\b/);
  });

  it('past the late limit: the closed sentence, no lead', () => {
    const text = problemView(tv, outOfWindow({})).text;
    expect(text).toBe(tv('error.READING_OUT_OF_WINDOW_PAST_LATE', { date: '26/11/2026' }));
    expect(text).not.toContain('{');
  });
});
