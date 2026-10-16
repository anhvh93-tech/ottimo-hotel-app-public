import { describe, expect, it } from 'vitest';
import { IntegrationError, type IntegrationContext } from '../contracts/common.js';
import type { NotificationMessage } from '../contracts/notification.js';
import { MockNotificationAdapter } from './mock.js';

const ctx: IntegrationContext = { propertyId: 'prop-1', credentialsRef: 'env', requestId: 'req-1' };

const msg: NotificationMessage = {
  channel: 'email',
  purpose: 'transactional',
  to: 'guest@example.test',
  templateId: 'booking_confirmed',
  locale: 'vi',
  params: { bookingCode: 'OTM-00001' },
  idempotencyKey: 'k-1',
};

describe('MockNotificationAdapter', () => {
  it('is idempotent on idempotencyKey per property', async () => {
    const adapter = new MockNotificationAdapter();
    const a = await adapter.send(ctx, msg);
    const b = await adapter.send(ctx, msg);
    expect(a).toEqual(b);
    expect(adapter.sent.size).toBe(1);
    await adapter.send({ ...ctx, propertyId: 'prop-2' }, msg);
    expect(adapter.sent.size).toBe(2);
  });

  it('returns copied for manual_copy channel', async () => {
    const adapter = new MockNotificationAdapter();
    const res = await adapter.send(ctx, { ...msg, channel: 'manual_copy', idempotencyKey: 'k-2' });
    expect(res.status).toBe('copied');
  });

  it('never retains secret params (door/verification codes)', async () => {
    const adapter = new MockNotificationAdapter();
    await adapter.send(ctx, {
      ...msg,
      purpose: 'door_code',
      params: { code: '1503472' },
      idempotencyKey: 'k-3',
    });
    expect(JSON.stringify([...adapter.sent.values()])).not.toContain('1503472');
  });

  it('throws retryable IntegrationError on timeout scenario', async () => {
    const adapter = new MockNotificationAdapter({ scenario: 'timeout' });
    await expect(adapter.send(ctx, msg)).rejects.toMatchObject({
      code: 'TIMEOUT',
      retryable: true,
    });
  });

  it('throws non-retryable IntegrationError on auth_error and reports down', async () => {
    const adapter = new MockNotificationAdapter();
    adapter.setScenario('auth_error');
    const err = await adapter.send(ctx, msg).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(IntegrationError);
    expect((err as IntegrationError).retryable).toBe(false);
    expect((await adapter.healthCheck(ctx)).status).toBe('down');
  });

  it('reports ok health by default', async () => {
    const adapter = new MockNotificationAdapter();
    const h = await adapter.healthCheck(ctx);
    expect(h.status).toBe('ok');
    expect(h.checkedAt).toBe('2026-10-15T09:00:00+07:00');
  });
});
