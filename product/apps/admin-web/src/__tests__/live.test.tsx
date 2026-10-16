// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLiveReload } from '../app/live';

vi.mock('../app/config', () => ({ apiMode: () => 'server' }));

class FakeEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static last: FakeEventSource;
  readyState = FakeEventSource.CONNECTING;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  constructor(public url: string) {
    FakeEventSource.last = this;
  }
  addEventListener() {}
  close() {
    this.closed = true;
    this.readyState = FakeEventSource.CLOSED;
  }
}

function Probe() {
  const { stale } = useLiveReload('p1', () => undefined);
  return <span>{stale ? 'stale' : 'live'}</span>;
}

describe('BUG-R2-029 – SSE missing on the build (404) is not "Đang kết nối lại…"', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('404 / never opened → quiet polling (no stale flag), stream closed', () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    render(<Probe />);
    const es = FakeEventSource.last;
    act(() => {
      es.readyState = FakeEventSource.CLOSED; // what browsers do on a non-200 answer
      es.onerror?.();
    });
    expect(screen.getByText('live')).toBeInTheDocument();
    expect(es.closed).toBe(true);
  });

  it('an open stream that drops and reconnects → stale until it opens again', () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    render(<Probe />);
    const es = FakeEventSource.last;
    act(() => {
      es.readyState = FakeEventSource.OPEN;
      es.onopen?.();
    });
    act(() => {
      es.readyState = FakeEventSource.CONNECTING;
      es.onerror?.();
    });
    expect(screen.getByText('stale')).toBeInTheDocument();
    act(() => {
      es.readyState = FakeEventSource.OPEN;
      es.onopen?.();
    });
    expect(screen.getByText('live')).toBeInTheDocument();
  });
});
