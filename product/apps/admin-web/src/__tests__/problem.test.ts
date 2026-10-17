// @vitest-environment node
import { ApiError, networkError } from '@ottimo/api-client';
import { allKeys, translate } from '@ottimo/i18n';
import { describe, expect, it } from 'vitest';
import { fieldErrorText, problemView } from '../app/problem';

const t = (k: string, a?: Record<string, string | number>) => translate('vi', k, a);

describe('problemView (FB-R2-UXD-FE-04)', () => {
  it('network failure → common.error_network_body, never a "—" reference', () => {
    const v = problemView(t, networkError());
    expect(v.text).toBe(t('common.error_network_body'));
    expect(v.text).not.toContain('—');
    expect(v.reference).toBeUndefined();
  });

  it('5xx with a requestId → error.server quoting it', () => {
    const e = new ApiError(500, {
      type: 'about:blank',
      title: '500',
      status: 500,
      code: 'INTERNAL_ERROR',
      requestId: 'req-42',
    });
    const v = problemView(t, e);
    expect(v.text).toContain('req-42');
    expect(v.reference).toBe('req-42');
  });

  it('5xx without a requestId or a non-API error → no {request_id} placeholder', () => {
    const e = new ApiError(502, {
      type: 'about:blank',
      title: '502',
      status: 502,
      code: 'INTERNAL_ERROR',
    });
    for (const err of [e, new Error('boom')]) {
      const v = problemView(t, err);
      expect(v.text).not.toMatch(/\{request_id\}|—/);
    }
  });
});

const problem = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  new ApiError(status, {
    type: `/problems/${code}`,
    title: code,
    status,
    code,
    requestId: 'req-9',
    ...extra,
  } as ConstructorParameters<typeof ApiError>[1]);

describe('problemView – vòng sửa 9 (UXR #8, #9)', () => {
  it('ROOM_BLOCKED names the room and the dates of the conflict (no raw {room}/{from}/{to})', () => {
    const v = problemView(
      t,
      problem(409, 'ROOM_BLOCKED', {
        conflicts: [{ roomNo: '203', nights: ['2026-10-20', '2026-10-19'], kind: 'ooo' }],
      }),
    );
    expect(v.text).toBe(
      t('error.ROOM_BLOCKED', { room: '203', from: '19/10/2026', to: '21/10/2026' }),
    );
    expect(v.text).not.toMatch(/\{\w+\}/);
  });

  it('VALIDATION_FAILED summary counts the fields; a field-level VALIDATION_FAILED is not "{n} ô"', () => {
    const e = problem(422, 'VALIDATION_FAILED', {
      errors: [
        { field: 'a', code: 'REQUIRED' },
        { field: 'b', code: 'REQUIRED' },
      ],
    });
    expect(problemView(t, e).text).toBe(t('error.VALIDATION_FAILED', { n: 2 }));
    expect(fieldErrorText(t, { field: 'Idempotency-Key', code: 'VALIDATION_FAILED' })).toBe(
      t('field_error.generic'),
    );
  });

  it('403 is a refusal, never "Máy chủ đang gặp sự cố"', () => {
    expect(problemView(t, problem(403, 'SELF_REFUND_FORBIDDEN')).text).toBe(
      t('error.SELF_REFUND_FORBIDDEN'),
    );
    const unknown = problemView(t, problem(403, 'SOME_NEW_CODE'));
    expect(unknown.text).toBe(t('error.FORBIDDEN_ACTION'));
    expect(unknown.reference).toBeUndefined();
  });

  it('every error.* sentence the Problem can fill renders without a raw placeholder', () => {
    // Placeholders a Problem body carries (OpenAPI §3.1 extensions). Others ({status}, {required}, {paid},
    // {time}, {unmet}, {approver}, {group}…) are filled by the screen's own helper (rsvErrorText…).
    const fromProblem = new Set(['room', 'from', 'to', 'n', 'max', 'min', 'amount', 'minutes']);
    const full = {
      conflicts: [{ roomNo: '203', nights: ['2026-10-19'], kind: 'ooo', guestDisplayName: 'A' }],
      roomNo: '203',
      max: 3,
      min: 1,
      surchargeVnd: 150_000,
      allowed: ['a', 'b'],
      guestDisplayName: 'Khách A',
      etaTime: '14:00',
      pendingApprovals: 2,
      errors: [{ field: 'x', code: 'REQUIRED' }],
    };
    const keys = [...allKeys('vi')].filter((k) => /^error\.[A-Z_]+$/.test(k));
    expect(keys.length).toBeGreaterThan(30);
    const raw: string[] = [];
    for (const key of keys) {
      const names = [...translate('vi', key).matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
      if (
        !names.every(
          (n) =>
            fromProblem.has(n) || ['request_id', 'seconds', 'allowed', 'guest', 'eta'].includes(n),
        )
      )
        continue;
      const code = key.slice('error.'.length);
      const status = code === 'INTERNAL_ERROR' ? 500 : 409;
      const text = problemView(t, problem(status, code, full)).text;
      if (/\{\w+\}/.test(text)) raw.push(`${key}: ${text}`);
    }
    expect(raw).toEqual([]);
  });
});
