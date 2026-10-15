import {
  errorForScenario,
  isoInstant,
  type HealthStatus,
  type IntegrationContext,
  type IsoInstant,
  type MockScenario,
} from '../contracts/common.js';
import type {
  NotificationAdapter,
  NotificationChannel,
  NotificationMessage,
  NotificationResult,
} from '../contracts/notification.js';

/** What the mock keeps per idempotencyKey. Secret params (codes) are never retained. */
export interface MockSentRecord {
  propertyId: string;
  channel: NotificationChannel;
  templateId: string;
  purpose: NotificationMessage['purpose'];
}

/**
 * Deterministic, network-free adapter for dev, QA and CI (README 1.2).
 * Same idempotencyKey (per property) => same result, recorded once.
 * Scenario 'timeout' | 'rate_limited' | 'unavailable' | 'auth_error' => throws IntegrationError.
 */
export class MockNotificationAdapter implements NotificationAdapter {
  readonly sent = new Map<string, MockSentRecord>();
  private scenario: MockScenario;
  private readonly now: () => IsoInstant;

  /** `now` is injected (ADR-008: no new Date() in integrations); default is a fixed instant so output is deterministic. */
  constructor(opts: { scenario?: MockScenario; now?: () => IsoInstant } = {}) {
    this.scenario = opts.scenario ?? 'ok';
    this.now = opts.now ?? (() => isoInstant('2026-10-15T09:00:00+07:00'));
  }

  setScenario(scenario: MockScenario): void {
    this.scenario = scenario;
  }

  async send(ctx: IntegrationContext, msg: NotificationMessage): Promise<NotificationResult> {
    const err = errorForScenario(this.scenario);
    if (err) throw err;

    const key = `${ctx.propertyId}:${msg.idempotencyKey}`;
    if (!this.sent.has(key)) {
      this.sent.set(key, {
        propertyId: ctx.propertyId,
        channel: msg.channel,
        templateId: msg.templateId,
        purpose: msg.purpose,
      });
    }
    return {
      providerMsgId: `mock-${msg.idempotencyKey}`,
      status: msg.channel === 'manual_copy' ? 'copied' : 'sent',
    };
  }

  async healthCheck(ctx: IntegrationContext): Promise<HealthStatus> {
    void ctx; // mock has no per-property connection state
    const err = errorForScenario(this.scenario);
    return {
      status: err ? 'down' : 'ok',
      checkedAt: this.now(),
      ...(err ? { detail: err.code } : {}),
    };
  }
}
