import { describe, expect, it } from 'vitest';
import { MockNotificationAdapter } from './mock.js';
import type { NotificationMessage } from './types.js';

const msg: NotificationMessage = {
  channel: 'email',
  to: 'guest@example.test',
  templateId: 'booking_confirmed',
  locale: 'vi',
  params: { bookingCode: 'OTM-00001' },
  idempotencyKey: 'k-1',
};

describe('MockNotificationAdapter', () => {
  it('is idempotent on idempotencyKey', async () => {
    const adapter = new MockNotificationAdapter();
    const a = await adapter.send(msg);
    const b = await adapter.send(msg);
    expect(a).toEqual(b);
    expect(adapter.sent.size).toBe(1);
  });

  it('returns copied for manual_copy channel', async () => {
    const adapter = new MockNotificationAdapter();
    const res = await adapter.send({ ...msg, channel: 'manual_copy', idempotencyKey: 'k-2' });
    expect(res.status).toBe('copied');
  });
});
