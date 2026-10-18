// Shared test helpers: sign in through the real App (StrictMode, like main.tsx) against the MSW mock.
import { translate } from '@ottimo/i18n';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { vi } from 'vitest';
import { App } from '../App';
import type { Connect, EventSourceLike } from '../app/live';
import { MemoryStore } from '../data/store';
import { mockControl, MOCK_PASSWORD } from '../mocks/handlers';

/** UXD string in Vietnamese – read from the string files, so a wording change by UXD does not break tests. */
export const tv = (key: string, args?: Record<string, string | number>) =>
  translate('vi', key, args);

export function setOnline(v: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { value: v, configurable: true });
  window.dispatchEvent(new Event(v ? 'online' : 'offline'));
}

export async function start(username = 'hk.lan', connect?: Connect) {
  const store = new MemoryStore();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const utils = render(
    <StrictMode>
      <App store={store} connect={connect} />
    </StrictMode>,
  );
  await user.type(await screen.findByLabelText('Tên đăng nhập'), username);
  await user.type(screen.getByLabelText('Mật khẩu'), MOCK_PASSWORD);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  return { user, store, ...utils };
}

export async function wait(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

export const calls = (op: string) => mockControl.state.calls.filter((c) => c === op).length;
export const bodies = (op: string) =>
  mockControl.state.bodies.filter((b) => b.op === op).map((b) => b.body);

/** In-memory SSE: `emit('room.status_changed')` like the server's `event:` line. */
export class FakeEventSource implements EventSourceLike {
  static last: FakeEventSource | undefined;
  readyState = 1;
  onopen: ((ev: Event) => unknown) | null = null;
  onerror: ((ev: Event) => unknown) | null = null;
  closed = false;
  private listeners = new Map<string, ((ev: MessageEvent) => void)[]>();
  constructor(readonly url: string) {
    FakeEventSource.last = this;
    queueMicrotask(() => this.onopen?.(new Event('open')));
  }
  addEventListener(type: string, fn: (ev: MessageEvent) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]);
  }
  emit(type: string, id = 'x') {
    for (const fn of this.listeners.get(type) ?? []) {
      fn(new MessageEvent(type, { data: JSON.stringify({ id }) }));
    }
  }
  close() {
    this.closed = true;
    this.readyState = 2;
  }
}
export const fakeConnect: Connect = (url) => new FakeEventSource(url);
