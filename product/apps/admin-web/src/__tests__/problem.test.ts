// @vitest-environment node
import { ApiError, networkError } from '@ottimo/api-client';
import { translate } from '@ottimo/i18n';
import { describe, expect, it } from 'vitest';
import { problemView } from '../app/problem';

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
