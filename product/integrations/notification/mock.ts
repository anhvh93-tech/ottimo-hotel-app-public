import type { NotificationAdapter, NotificationMessage, NotificationResult } from './types.js';

/**
 * Deterministic, network-free adapter for dev, QA and CI.
 * Same idempotencyKey => same result, message stored once.
 */
export class MockNotificationAdapter implements NotificationAdapter {
  readonly sent = new Map<string, NotificationMessage>();

  async send(msg: NotificationMessage): Promise<NotificationResult> {
    if (!this.sent.has(msg.idempotencyKey)) {
      this.sent.set(msg.idempotencyKey, msg);
    }
    return {
      providerMsgId: `mock-${msg.idempotencyKey}`,
      status: msg.channel === 'manual_copy' ? 'copied' : 'sent',
    };
  }
}
