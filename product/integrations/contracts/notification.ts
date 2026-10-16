// NotificationAdapter contract (README section 3.5). Owner: INT.
import type { HealthStatus, IntegrationContext } from './common.js';

export type NotificationChannel = 'email' | 'zalo_zns' | 'zalo_oa' | 'ota_message' | 'manual_copy';
export type Locale = 'vi' | 'en' | 'ru';
/**
 * verification_code / door_code: params are secrets – never logged or stored after send.
 * Sending verification_code via ota_message / zalo_* is OFF by default; the core checks the
 * per-channel owner setting before calling the adapter (ORC ruling 2026-10-15).
 */
export type NotificationPurpose =
  'transactional' | 'verification_code' | 'door_code' | 'security_alert';

export interface NotificationMessage {
  channel: NotificationChannel;
  purpose: NotificationPurpose;
  /** Resolved at send time from recipientRef; never stored in the outbox. */
  to: string;
  templateId: string;
  locale: Locale;
  params: Record<string, string>;
  attachments?: { name: string; mime: string; data: Uint8Array }[];
  idempotencyKey: string;
}

export interface NotificationResult {
  providerMsgId?: string;
  status: 'sent' | 'queued' | 'failed' | 'copied';
}

export interface NotificationAdapter {
  send(ctx: IntegrationContext, msg: NotificationMessage): Promise<NotificationResult>;
  healthCheck(ctx: IntegrationContext): Promise<HealthStatus>;
}
