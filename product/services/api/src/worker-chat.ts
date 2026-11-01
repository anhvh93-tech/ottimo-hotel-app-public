/**
 * The worker's Google Chat composition (ARC gchat-booking-request-notify 3, 8.3, 8.7 G3; SEC ESC-041 ★3, GCHAT-02).
 * Used by src/worker.ts and by the worker-only test process (test/helpers/worker-only-child.ts) – the renderers are
 * wired HERE, never in a Nest module, so the worker (which loads no `*.module.ts`) has them (lesson of PR #14).
 *
 * Configuration (worker only; a bad value never stops the worker – J1/J15/J16 and e-mail keep running):
 *   BOOKING_REQUEST_CHAT_WEBHOOK_URL (from BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE, secret file 0400): empty → off;
 *     invalid → off + `error chat webhook config invalid {code: CHAT_WEBHOOK_URL_INVALID}` (never the value).
 *   BOOKING_REQUEST_CHAT_DETAIL_LEVEL A|B|C (trim, upper case): unset → A; invalid → A + `error chat config invalid
 *     {code: CHAT_DETAIL_LEVEL_INVALID}`.
 *   ADMIN_BASE_URL (Desk link): https, no user info, no port, path `/`; production = https://desk.ottimo.vn exactly.
 *     Invalid → off + `error … {code: CHAT_LINK_BASE_INVALID}` (a wrong value can never turn the link elsewhere).
 * Startup logs, once: `chat: on|off` (+ reason code) and `chat detail level {level}`.
 */
import { parseBookingChatWebhook } from '@ottimo/integrations/common';
import { postChatText } from '@ottimo/integrations/notification';
import type { Clock } from './clock';
import type { Database } from './db/database';
import { type ChatLog, type ChatPost, ChatDispatcher, type ChatTarget } from './jobs/chat-dispatch';
import type { ParameterService } from './modules/platform/public/parameter.service';
import {
  type ChatDetailLevel,
  type ChatRenderer,
  parseChatDetailLevel,
  websiteRequestChatRenderer,
} from './modules/public-site/public/chat-message';
import type { StaffChatKind } from './modules/events/public/staff-chat';

/** Desk host the production link must use (SEC GCHAT-02 point 3). */
export const PRODUCTION_DESK_HOST = 'desk.ottimo.vn';

/** Desk origin for the "Mở Desk" line, or null when it is not safe to link to. */
export function parseChatLinkBase(raw: string | undefined, appEnv: string): string | null {
  const v = (raw ?? '').trim();
  if (v === '') return null;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return null;
  }
  if (u.username !== '' || u.password !== '' || u.search !== '' || u.hash !== '') return null;
  if (u.pathname !== '/') return null;
  const local = appEnv === 'dev' || appEnv === 'test';
  if (!local) {
    if (u.protocol !== 'https:' || u.port !== '') return null;
    if (/^[0-9.]+$/.test(u.hostname) || u.hostname.startsWith('[')) return null;
    if (appEnv === 'production' && u.hostname !== PRODUCTION_DESK_HOST) return null;
  } else if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return null;
  }
  return u.origin;
}

export interface ChatConfig {
  target: ChatTarget;
  level: ChatDetailLevel;
  /** Problem codes to log at startup (never values). */
  problems: Array<
    'CHAT_WEBHOOK_URL_INVALID' | 'CHAT_DETAIL_LEVEL_INVALID' | 'CHAT_LINK_BASE_INVALID'
  >;
  /** Why Chat is off: no webhook configured, or the first problem. */
  offReason?: string;
}

export function resolveChatConfig(env: NodeJS.ProcessEnv, appEnv: string): ChatConfig {
  const problems: ChatConfig['problems'] = [];
  const { level, invalid } = parseChatDetailLevel(env.BOOKING_REQUEST_CHAT_DETAIL_LEVEL);
  if (invalid) problems.push('CHAT_DETAIL_LEVEL_INVALID');
  const webhook = parseBookingChatWebhook(env.BOOKING_REQUEST_CHAT_WEBHOOK_URL);
  if (webhook.mode === 'invalid') problems.push('CHAT_WEBHOOK_URL_INVALID');
  if (webhook.mode !== 'on') {
    return {
      target: { mode: 'off' },
      level,
      problems,
      offReason: webhook.mode === 'off' ? 'NOT_CONFIGURED' : webhook.code,
    };
  }
  // ARC GC-06: staging/production read ADMIN_BASE_URL only (the older APP_BASE_URL may name another host);
  // dev/test keep the fallback.
  const local = appEnv === 'dev' || appEnv === 'test';
  const linkBase = parseChatLinkBase(
    local ? env.ADMIN_BASE_URL || env.APP_BASE_URL : env.ADMIN_BASE_URL,
    appEnv,
  );
  if (!linkBase) {
    problems.push('CHAT_LINK_BASE_INVALID');
    return { target: { mode: 'off' }, level, problems, offReason: 'CHAT_LINK_BASE_INVALID' };
  }
  return { target: { mode: 'on', url: webhook.url, level, linkBase, appEnv }, level, problems };
}

/** kind → renderer of the module that owns the request (one module today: public-site). */
export function workerChatRenderers(deps: {
  parameters: ParameterService;
}): Readonly<Record<StaffChatKind, ChatRenderer>> {
  const website = websiteRequestChatRenderer({ params: deps.parameters });
  return {
    web_request_new: website,
    web_request_overdue: website,
    web_request_morning: website,
    web_request_erased: website,
  };
}

/** Builds the dispatcher and writes the startup log lines (no URL, no token, ever). */
export function buildWorkerChat(deps: {
  database: Database;
  clock: Clock;
  env: NodeJS.ProcessEnv;
  appEnv: string;
  parameters: ParameterService;
  log: ChatLog;
  /** Tests: a fake webhook client. */
  post?: ChatPost;
}): { dispatcher: ChatDispatcher; config: ChatConfig } {
  const config = resolveChatConfig(deps.env, deps.appEnv);
  for (const code of config.problems) {
    deps.log(
      'error',
      code === 'CHAT_DETAIL_LEVEL_INVALID' ? 'chat config invalid' : 'chat webhook config invalid',
      { code },
    );
  }
  deps.log(
    'info',
    `chat: ${config.target.mode}`,
    config.offReason ? { reason: config.offReason } : {},
  );
  deps.log('info', 'chat detail level', { level: config.level });
  const dispatcher = new ChatDispatcher(
    deps.database,
    deps.clock,
    config.target,
    workerChatRenderers({ parameters: deps.parameters }),
    deps.post ?? postChatText,
    deps.log,
  );
  return { dispatcher, config };
}
