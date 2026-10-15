// Interface copied from integrations/README.md section 3.5 (INT owns it; ARC review pending).
export type NotificationChannel = 'email' | 'zalo_zns' | 'zalo_oa' | 'manual_copy';
export type Locale = 'vi' | 'en' | 'ru';

export interface NotificationMessage {
  channel: NotificationChannel;
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
  send(msg: NotificationMessage): Promise<NotificationResult>;
}
