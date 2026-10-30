// Google Chat webhook client against a local fake server (ARC gchat-booking-request-notify 5.2 test 2, 8.7 G1).
// Fake URL and fake text only; nothing goes to Google.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FakeChatServer } from './fake-chat.test-support.js';
import { chatErrorCode, postChatText } from './google-chat.js';

describe('postChatText (fake webhook)', () => {
  const server = new FakeChatServer();
  beforeAll(async () => {
    await server.start();
  });
  afterAll(async () => {
    await server.stop();
  });
  beforeEach(() => {
    server.requests.length = 0;
    server.script = [];
  });

  it('200 → ok; JSON text; threadKey + reply option + messageId added as query parameters on a copy', async () => {
    const url = server.url;
    const r = await postChatText(url, 'Line 1\nLine 2', {
      threadKey: '0192f0aa-0000-7000-8000-000000000001',
      messageId: 'client-0192f0aa-0000-7000-8000-000000000002',
    });
    expect(r).toEqual({ ok: true, code: 'HTTP_200' });
    expect(url).toBe(server.url); // the caller's string is not changed
    const [req] = server.requests;
    expect(req).toMatchObject({
      method: 'POST',
      path: '/v1/spaces/AAAAtest01/messages',
      text: 'Line 1\nLine 2',
    });
    expect(req!.query).toEqual({
      key: 'fake-key',
      token: 'fake-token',
      threadKey: '0192f0aa-0000-7000-8000-000000000001',
      messageReplyOption: 'REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD',
      messageId: 'client-0192f0aa-0000-7000-8000-000000000002',
    });
  });

  it('a threadKey or messageId outside the safe pattern is refused before any request', async () => {
    expect(await postChatText(server.url, 'x', { threadKey: 'a&key=evil' })).toEqual({
      ok: false,
      retryable: false,
      code: 'BAD_THREAD_KEY',
    });
    expect(await postChatText(server.url, 'x', { messageId: 'nope' })).toMatchObject({
      code: 'BAD_MESSAGE_ID',
    });
    expect(server.requests).toHaveLength(0);
  });

  it.each([
    [429, true, 'HTTP_429'],
    [500, true, 'HTTP_500'],
    [503, true, 'HTTP_503'],
    [408, true, 'HTTP_408'],
    [400, false, 'CHAT_REJECTED_400'],
    [401, false, 'CHAT_REJECTED_401'],
    [403, false, 'CHAT_REJECTED_403'],
    [404, false, 'CHAT_REJECTED_404'],
  ])('HTTP %i → retryable %s (%s)', async (status, retryable, code) => {
    server.script = [status];
    expect(await postChatText(server.url, 'x')).toEqual({ ok: false, retryable, code });
  });

  it('409 is "already posted" only when a messageId was sent', async () => {
    server.script = [409, 409];
    expect(await postChatText(server.url, 'x', { messageId: 'client-abc' })).toEqual({
      ok: true,
      code: 'HTTP_409_DUPLICATE',
    });
    expect(await postChatText(server.url, 'x')).toMatchObject({ ok: false, retryable: false });
  });

  it('302 is never followed: permanent CHAT_REDIRECT, one request only', async () => {
    server.script = [302];
    expect(await postChatText(server.url, 'x')).toEqual({
      ok: false,
      retryable: false,
      code: 'CHAT_REDIRECT',
    });
    expect(server.requests).toHaveLength(1);
  });

  it('timeout and connection reset → retryable, codes without the URL', async () => {
    server.script = [0];
    const t = await postChatText(server.url, 'x', { timeoutMs: 200 });
    expect(t).toEqual({ ok: false, retryable: true, code: 'TIMEOUT' });
    server.script = [-1];
    const reset = await postChatText(server.url, 'x');
    expect(reset).toMatchObject({ ok: false, retryable: true });
    expect(reset.code).toMatch(/^NETWORK/);
    const refused = await postChatText(
      'http://127.0.0.1:1/v1/spaces/x/messages?key=k&token=t',
      'x',
    );
    expect(refused).toMatchObject({ ok: false, retryable: true });
    for (const r of [t, reset, refused]) {
      expect(JSON.stringify(r)).not.toMatch(/127\.0\.0\.1|key=|token=|chat\.googleapis/);
    }
  });

  it('a body over 4 KB is refused without a request', async () => {
    expect(await postChatText(server.url, 'x'.repeat(5000))).toEqual({
      ok: false,
      retryable: false,
      code: 'CHAT_BODY_TOO_LARGE',
    });
    expect(server.requests).toHaveLength(0);
  });

  it('chatErrorCode never returns a message', () => {
    const e = new TypeError(
      'fetch failed https://chat.googleapis.com/v1/spaces/X/messages?key=k&token=t',
      {
        cause: Object.assign(new Error('connect ECONNREFUSED chat.googleapis.com'), {
          code: 'ECONNREFUSED',
        }),
      },
    );
    expect(chatErrorCode(e)).toEqual({ retryable: true, code: 'NETWORK_ECONNREFUSED' });
  });
});
