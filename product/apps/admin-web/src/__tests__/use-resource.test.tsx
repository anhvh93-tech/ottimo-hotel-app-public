// BUG-R2-141: `reload` of useResource reads with the LATEST inputs, even when called from a handler made in an
// earlier render (H16: "save the minibar, then reload the summary" while the departure time was still empty).
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useResource } from '../hooks/useResource';

describe('useResource – reload dùng đầu vào mới nhất (BUG-R2-141)', () => {
  it('a reload kept from an older render does not bring back the old answer', async () => {
    const calls: string[] = [];
    const { result, rerender } = renderHook(
      ({ q }: { q: string }) =>
        useResource(async () => {
          calls.push(q);
          return q || '12:00';
        }, [q]),
      { initialProps: { q: '' } },
    );
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    const staleReload = result.current.reload;
    rerender({ q: '11:00' });
    await waitFor(() => expect(result.current.state.data).toBe('11:00'));
    act(() => staleReload());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(result.current.state.data).toBe('11:00');
    expect(calls.at(-1)).toBe('11:00');
    // Stable identity: effects that depend on it do not re-run on every input change.
    expect(result.current.reload).toBe(staleReload);
  });
});
