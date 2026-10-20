// K2' cổng QC Sprint 4 – BUG-R2-211: `listHkTasks` của vai buồng phòng chỉ cho ngày kinh doanh (x-scope HK `today`,
// BR-010 đổi ngày 06:00). Lúc 02:40 ngày D ngày kinh doanh là D-1; 06:00 sang D. Không gửi `date` = ngày kinh doanh.
// Project clock (MutableClock, tuần tự).
import { expect, test } from '@playwright/test';
import { call, needSeedPassword, propertyIdOf, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { addDays, vnTime } from '../support/s2.js';
import { virtualDay } from '../support/s3.js';

type Json = Record<string, unknown>;
let realToday = '';
test.beforeAll(async ({ request }) => {
  needSeedPassword();
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  "K2' – listHkTasks của buồng phòng theo ngày kinh doanh",
  { tag: ['@clock', '@sprint4'] },
  () => {
    test('TC-L6-060 (A) US-052/AC1 BR-010 BUG-R2-211: qa.hk lúc 02:40 ngày D – không `date` 200, `date` = D-1 200, `date` = D 422 `NOT_IN_LIST`; 05:59 như 02:40; 06:00 – `date` = D 200, D-1 422; qa.fd mọi ngày 200', async ({
      request,
    }) => {
      needClock('TC-L6-060');
      const D = virtualDay(realToday, 2);
      const list = async (user: string, date?: string) => {
        const s = await sessionOrSkip(request, user);
        return call<Json>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(s)}/hk-tasks${date ? `?date=${date}` : ''}`,
          { session: s },
        );
      };
      for (const [hhmm, biz] of [
        ['02:40', addDays(D, -1)],
        ['05:59', addDays(D, -1)],
        ['06:00', D],
      ] as const) {
        await setClock(request, vnTime(D, hhmm));
        const other = biz === D ? addDays(D, -1) : D;
        const none = await list('qa.hk');
        expect(none.status, `${hhmm} không date: ${JSON.stringify(none.body).slice(0, 200)}`).toBe(
          200,
        );
        const ok = await list('qa.hk', biz);
        expect(ok.status, `${hhmm} date=${biz} (ngày kinh doanh)`).toBe(200);
        const bad = await list('qa.hk', other);
        expect(bad.status, `${hhmm} date=${other} (không phải ngày kinh doanh)`).toBe(422);
        expect(JSON.stringify(bad.body)).toContain('NOT_IN_LIST');
        for (const d of [biz, other])
          expect((await list('qa.fd', d)).status, `qa.fd ${hhmm} ${d}`).toBe(200);
      }
    });
  },
);
