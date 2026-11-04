import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BRAND,
  NO_LINK_EN,
  NO_LINK_VI,
  renderStaffEmail,
  STAFF_EMAIL_TEMPLATES,
} from './email-templates.js';
import * as notificationEntry from './index.js';

const EMOJI = /\p{Extended_Pictographic}/u;
const ALLOWED_COLOURS = new Set(Object.values(BRAND).map((c) => c.toUpperCase()));

describe('staff e-mail templates (OTTIMO brand guideline)', () => {
  for (const t of STAFF_EMAIL_TEMPLATES) {
    for (const audience of ['self', 'owner']) {
      it(`${t} / ${audience}: English first, Vietnamese second, no emoji, palette colours only, no links`, () => {
        const r = renderStaffEmail(t, {
          audience,
          staffName: 'Lan',
          occurredAt: '23/10/2026 09:00 (GMT+7)',
          effectiveDate: '25/10/2026',
        });
        for (const s of [r.subject, r.text, r.html]) expect(s).not.toMatch(EMOJI);
        expect(r.subject).toMatch(/^OTTIMO – [A-Z][^/]+ \/ [^/]+$/);
        // English block before the Vietnamese block.
        const vi = r.text.search(/[ạảãàáâậầấẩẫăắằẳẵặđêếềểễệôốồổỗộơớờởỡợưứừửữự]/);
        const sep = r.text.indexOf('\n—\n');
        expect(sep).toBeGreaterThan(0);
        expect(vi).toBeGreaterThan(sep);
        // Colours: only the 80/15/5 palette (+ white).
        for (const c of r.html.match(/#[0-9A-Fa-f]{6}\b/g) ?? []) {
          expect(ALLOWED_COLOURS.has(c.toUpperCase())).toBe(true);
        }
        expect(r.html).toContain('Lora, Georgia');
        expect(r.html).toContain("'Be Vietnam Pro', Arial");
        expect(r.html).not.toMatch(/<a\s|href=|https?:\/\//i);
        expect(r.text).not.toMatch(/https?:\/\//);
        if (audience === 'owner' && t !== 'receiving_account_changed')
          expect(r.text).toContain('Lan');
      });
    }
  }

  it('escapes parameters in HTML and strips control characters from the subject line', () => {
    const r = renderStaffEmail('mfa_reset', {
      audience: 'owner',
      staffName: '<img src=x onerror=alert(1)>\r\nBcc: x@y.test',
    });
    expect(r.html).not.toContain('<img');
    expect(r.html).toContain('&lt;img');
    expect(r.subject).not.toMatch(/[\r\n]/);
    expect(r.text).not.toContain('\r\nBcc');
  });

  it('never prints an effective account number – only the date', () => {
    const r = renderStaffEmail('receiving_account_changed', { effectiveDate: '25/10/2026' });
    expect(r.text).toContain('25/10/2026');
    expect(r.text).not.toMatch(/\d{6,}/);
  });

  describe('email_changed (BUG-R3-032, ARC v1.0.3-contract-email 4.3, CPY-on-v1.0.3-email-changed)', () => {
    const base = { staffName: 'Lan', occurredAt: '03/11/2026 10:15 (GMT+7)' };
    // Extra keys a careless caller might pass: none of them may reach the message.
    const leaky = {
      email: 'new.fd@example.test',
      newEmail: 'new.fd@example.test',
      oldEmail: 'old.fd@example.test',
      emailMasked: 'n***@e***.test',
      username: 'fd.lan',
    };
    const audiences = ['self', 'previous', 'owner'] as const;
    const allCopies: Record<string, string>[] = [
      ...audiences.flatMap((audience) =>
        ['self', 'owner', undefined].map((via) => ({ audience, ...(via ? { via } : {}) })),
      ),
      {},
      { audience: 'someone' },
    ];
    const SUBJECT =
      'OTTIMO – Security notice: notification email changed / Thông báo bảo mật: email nhận thông báo đã thay đổi';
    const render = (extra: Record<string, string>) =>
      renderStaffEmail('email_changed', { ...base, ...extra });

    // CPY test 1: every copy (3 audiences × via, and the neutral one) – no address, link, nested brackets.
    for (const extra of allCopies) {
      it(`${JSON.stringify(extra)}: no address, no link, no "((", palette only, name never in subject`, () => {
        const r = render({ ...leaky, ...extra });
        for (const s of [r.subject, r.text, r.html]) {
          expect(s).not.toMatch(EMOJI);
          expect(s).not.toContain('@');
          expect(s).not.toContain('example.test');
          expect(s).not.toContain('***');
          expect(s).not.toContain('fd.lan');
          expect(s).not.toMatch(/https?:|href=|<a\s|www\./i);
          expect(s).not.toContain('((');
        }
        expect(r.subject).toBe(SUBJECT);
        expect(r.subject).not.toContain('Lan');
        expect(r.text).toContain('Time: 03/11/2026 10:15 (GMT+7)');
        expect(r.text).toContain('Thời điểm: 03/11/2026 10:15 (GMT+7)');
        // v1.0.4 (option A of FB-R4-CPY-INT-05): the anti-phishing line is said once, in the shared footer.
        expect(r.text.split('never contain links')).toHaveLength(2);
        expect(r.text.split('không bao giờ có đường liên kết')).toHaveLength(2);
        for (const c of r.html.match(/#[0-9A-Fa-f]{6}\b/g) ?? []) {
          expect(ALLOWED_COLOURS.has(c.toUpperCase())).toBe(true);
        }
        expect(r.html).toContain('lang="vi"');
        // English block before the Vietnamese block.
        expect(r.text.indexOf('Time:')).toBeLessThan(r.text.indexOf('Thời điểm:'));
      });
    }

    it('self (via=self): new address now receives notices, "not you" action, no staff name', () => {
      const r = render({ audience: 'self', via: 'self' });
      expect(r.text).toContain(
        'This address will now receive security notices for your OTTIMO Desk account.',
      );
      expect(r.text).toContain(
        'Từ nay, địa chỉ này sẽ nhận thông báo bảo mật cho tài khoản OTTIMO Desk của bạn.',
      );
      expect(r.text).toContain('If this was not you');
      expect(r.text).not.toContain('property owner');
      expect(r.text).not.toContain('Lan');
    });

    // CPY test 2: owner made the change for a staff member – no "change your password".
    it('self (via=owner): says the owner made it, no "change your password" / "đổi mật khẩu"', () => {
      const r = render({ audience: 'self', via: 'owner' });
      expect(r.text).toContain('The change was made by the property owner.');
      expect(r.text).toContain('Thay đổi do chủ cơ sở thực hiện.');
      expect(r.text).toContain('If you did not expect this, please contact the owner directly.');
      expect(r.text).not.toMatch(/change your password|đổi mật khẩu|If this was not you/);
    });

    // CPY test 3: previous, both via – "do not reply" inside the action, never "will now receive".
    it('previous (via=self and via=owner): "do not reply" in the action, never "will now receive"', () => {
      for (const via of ['self', 'owner']) {
        const r = render({ audience: 'previous', via });
        expect(r.text).toContain(
          'This address no longer receives security notices for your OTTIMO Desk account.',
        );
        expect(r.text).toContain('Địa chỉ này không còn nhận thông báo bảo mật');
        expect(r.text).toContain('do not reply to this email');
        expect(r.text).toContain('không trả lời thư này');
        expect(r.text).not.toContain('will now receive');
        expect(r.text).not.toContain('Lan');
      }
      const self = render({ audience: 'previous', via: 'self' });
      expect(self.text).toContain(
        'Contact the owner or the OTTIMO team right away and change your password.',
      );
      const byOwner = render({ audience: 'previous', via: 'owner' });
      expect(byOwner.text).toContain('The change was made by the property owner.');
      expect(byOwner.text).not.toMatch(/change your password|đổi mật khẩu/);
    });

    it('owner: names the person (escaped), asks to check today; via=owner says an owner made it', () => {
      const r = render({ audience: 'owner' });
      expect(r.text).toContain('The notification email of Lan was changed or removed.');
      expect(r.text).toContain('Email nhận thông báo bảo mật của Lan vừa được đổi hoặc gỡ.');
      expect(r.text).toContain('check with them today');
      const o = render({ audience: 'owner', via: 'owner' });
      expect(o.text).toContain('An owner changed or removed the notification email of Lan.');
      expect(o.text).toContain(
        'Một chủ cơ sở vừa đổi hoặc gỡ email nhận thông báo bảo mật của Lan.',
      );
      const x = renderStaffEmail('email_changed', { audience: 'owner', staffName: '<b>Lan</b>' });
      expect(x.html).not.toContain('<b>Lan');
      expect(x.html).toContain('&lt;b&gt;Lan');
      const n = renderStaffEmail('email_changed', { audience: 'owner' });
      expect(n.text).toContain('The notification email of a staff member was changed or removed.');
      expect(n.text).toContain('của một nhân viên');
    });

    // CPY test 4: no occurredAt – no time line at all.
    it('without occurredAt there is no "Time:" / "Thời điểm:" line', () => {
      for (const audience of [...audiences, 'someone']) {
        const r = renderStaffEmail('email_changed', { audience, staffName: 'Lan' });
        expect(r.text).not.toMatch(/Time:|Thời điểm:/);
        expect(r.html).not.toMatch(/Time:|Thời điểm:/);
      }
    });

    // CPY test 5: missing or unknown via reads as via=self.
    it('missing or unknown via renders exactly like via=self', () => {
      for (const audience of audiences) {
        const self = render({ audience, via: 'self' });
        expect(render({ audience })).toEqual(self);
        expect(render({ audience, via: 'operator' })).toEqual(self);
      }
    });

    it('missing or unknown audience: neutral copy that claims nothing about which address this is', () => {
      const cases: Record<string, string>[] = [{}, { audience: 'someone' }];
      for (const params of cases) {
        const r = renderStaffEmail('email_changed', params);
        expect(r.text).toContain('The notification email of an OTTIMO Desk account was changed.');
        expect(r.text).not.toMatch(/will now receive|no longer receive/);
      }
    });

    it('the three copies differ from each other, and via=owner differs from via=self', () => {
      const texts = audiences.map((audience) => render({ audience }).text);
      expect(new Set(texts).size).toBe(3);
      for (const audience of audiences) {
        expect(render({ audience, via: 'owner' }).text).not.toBe(render({ audience }).text);
      }
    });
  });

  describe('v1.0.4 – one layout for the five templates (CPY FB-R4-CPY-INT-03/05, G-BE-4)', () => {
    const AT = '03/11/2026 10:15 (GMT+7)';
    const audiences = ['self', 'owner', 'previous', undefined, 'someone'];
    const combos = STAFF_EMAIL_TEMPLATES.flatMap((t) =>
      audiences.flatMap((audience) =>
        ['self', 'owner', undefined].map((via) => ({ t, audience, via })),
      ),
    );
    const paramsOf = (audience: string | undefined, via: string | undefined, extra = {}) => {
      const params: Record<string, string> = { occurredAt: AT, staffName: 'Lan', ...extra };
      if (audience) params.audience = audience;
      if (via) params.via = via;
      return params;
    };

    // CPY round 2, note 1: footer text chosen by CPY, said once, in every template.
    it('every template: the shared footer says "never contain links" exactly once (text and HTML)', () => {
      expect(NO_LINK_EN).toBe(
        'OTTIMO security notices never contain links and never ask for your password or sign-in codes.',
      );
      expect(NO_LINK_VI).toBe(
        'Thư bảo mật của OTTIMO không bao giờ có đường liên kết và không bao giờ hỏi mật khẩu hay mã đăng nhập.',
      );
      for (const { t, audience, via } of combos) {
        const r = renderStaffEmail(t, paramsOf(audience, via));
        const tag = `${t}/${audience}/${via}`;
        expect(r.text.split(NO_LINK_EN), tag).toHaveLength(2);
        expect(r.text.split(NO_LINK_VI), tag).toHaveLength(2);
        expect(r.html.split('never contain links'), tag).toHaveLength(2);
        expect(r.html.split('không bao giờ có đường liên kết'), tag).toHaveLength(2);
        // The v1.0.3 footer (and its "e-mail" spelling) is gone.
        expect(r.text, tag).not.toContain(
          'OTTIMO never asks for your password or codes by e-mail.',
        );
        expect(r.text, tag).not.toMatch(/\be-mail\b/i);
        // The footer comes after the Vietnamese block: it is not part of either body.
        expect(r.text.indexOf(NO_LINK_EN), tag).toBeGreaterThan(r.text.indexOf('\n—\n'));
      }
    });

    // CPY round 2, note 2: "Time:" / "Thời điểm:" on its own line in all five; never "((".
    it('every template: time on its own line after the main sentence, never in brackets', () => {
      for (const { t, audience, via } of combos) {
        const r = renderStaffEmail(t, paramsOf(audience, via));
        const tag = `${t}/${audience}/${via}`;
        const lines = r.text.split('\n');
        expect(lines, tag).toContain(`Time: ${AT}`);
        expect(lines, tag).toContain(`Thời điểm: ${AT}`);
        expect(r.text.split(AT), tag).toHaveLength(3); // once EN, once VI
        expect(r.text, tag).not.toContain(`(${AT}`);
        for (const s of [r.subject, r.text, r.html]) expect(s, tag).not.toContain('((');
        expect(r.subject, tag).not.toContain(AT);
        // Line 0 'OTTIMO', 1 '', 2 subject, 3 main sentence, then (via=owner line) Time, then the action.
        const en = lines.indexOf(`Time: ${AT}`);
        const vi = lines.indexOf(`Thời điểm: ${AT}`);
        expect(en, tag).toBeGreaterThan(3);
        expect(lines[en + 1], tag).not.toBe('');
        expect(vi, tag).toBeGreaterThan(lines.indexOf('—'));
        expect(lines[vi + 1], tag).not.toBe('');
        expect(r.html, tag).toContain(`>Time: ${AT}</p>`);
        expect(r.html, tag).toContain(`>Thời điểm: ${AT}</p>`);
      }
    });

    it('every template without occurredAt: no "Time:" / "Thời điểm:" line, no empty brackets', () => {
      for (const t of STAFF_EMAIL_TEMPLATES) {
        for (const audience of ['self', 'owner', 'previous']) {
          const r = renderStaffEmail(t, {
            audience,
            staffName: 'Lan',
            effectiveDate: '25/10/2026',
          });
          expect(r.text).not.toMatch(/Time:|Thời điểm:|\(\)/);
          expect(r.html).not.toMatch(/Time:|Thời điểm:|\(\)/);
        }
      }
    });

    it('older templates keep their sentences, only the time moved', () => {
      const r = renderStaffEmail('mfa_reset', { audience: 'self', occurredAt: AT });
      expect(r.text).toContain(
        [
          'Two-step sign-in of your account was reset.',
          `Time: ${AT}`,
          'You will set it up again at your next sign-in.',
          'If this was not you, contact the owner or the OTTIMO team today and change your password.',
        ].join('\n'),
      );
      const op = renderStaffEmail('mfa_reset_by_operator', {
        audience: 'owner',
        staffName: 'Lan',
        occurredAt: AT,
      });
      expect(op.text).toContain(
        [
          'Two-step sign-in of Lan was reset by the OTTIMO technical team.',
          `Time: ${AT}`,
          'If this was not expected, check with them today.',
        ].join('\n'),
      );
      const rc = renderStaffEmail('mfa_recovery_code_used', { audience: 'self', occurredAt: AT });
      expect(rc.text).toContain(
        [
          'Tài khoản của bạn vừa đăng nhập OTTIMO Desk bằng mã khôi phục.',
          `Thời điểm: ${AT}`,
          'Nếu không phải bạn, hãy báo chủ cơ sở hoặc đội OTTIMO ngay trong hôm nay và đổi mật khẩu.',
        ].join('\n'),
      );
      const acc = renderStaffEmail('receiving_account_changed', {
        effectiveDate: '25/10/2026',
        occurredAt: AT,
      });
      expect(acc.text).toContain(
        [
          'The bank account that receives deposits was changed from 25/10/2026.',
          `Time: ${AT}`,
          'Open OTTIMO Desk as usual to review it. If you did not expect this change, review it today.',
        ].join('\n'),
      );
    });

    // G-BE-4 / FB-R4-INT-BE-31-05 (template part): the name only ever reaches the owner copy.
    it('staffName is used only by the owner copy – dropped for self, previous, missing or unknown audience', () => {
      const NAME = 'Lanzzq';
      for (const { t, audience, via } of combos) {
        const params = paramsOf(audience, via, { staffName: NAME });
        const r = renderStaffEmail(t, params);
        const tag = `${t}/${audience}/${via}`;
        expect(r.subject, tag).not.toContain(NAME);
        if (audience === 'owner') {
          if (t !== 'receiving_account_changed') {
            expect(r.text, tag).toContain(NAME);
            expect(r.html, tag).toContain(NAME);
          }
          continue;
        }
        expect(r.text, tag).not.toContain(NAME);
        expect(r.html, tag).not.toContain(NAME);
        // Same message with or without the name.
        const without = { ...params };
        delete without.staffName;
        expect(renderStaffEmail(t, without), tag).toEqual(r);
      }
    });
  });

  // FB-R4-ARC-OPS-PR32-06 + FB-R4-ARC-BE-31-05: the export path below is used OUTSIDE this package by
  // `infra/server/bin/requeue-email-changed.sh` (asks a running worker image) and by the api/worker
  // (`StaffEmailTemplate`, `isStaffEmailTemplate`). Moving or renaming them breaks the requeue step R9 exactly when
  // it is needed – this test goes red first.
  describe('export path @ottimo/integrations/notification (used by requeue-email-changed.sh)', () => {
    it('the package entry "./notification" is dist/notification/index.js, built from ./index.ts', () => {
      const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
        name: string;
        exports: Record<string, { import: string }>;
      };
      expect(pkg.name).toBe('@ottimo/integrations');
      expect(pkg.exports['./notification']?.import).toBe('./dist/notification/index.js');
    });

    it('the entry exports STAFF_EMAIL_TEMPLATES (with email_changed) and isStaffEmailTemplate', () => {
      expect(notificationEntry.STAFF_EMAIL_TEMPLATES).toEqual([
        'mfa_recovery_code_used',
        'mfa_reset',
        'mfa_reset_by_operator',
        'receiving_account_changed',
        'email_changed',
      ]);
      expect(typeof notificationEntry.isStaffEmailTemplate).toBe('function');
      for (const t of notificationEntry.STAFF_EMAIL_TEMPLATES) {
        expect(notificationEntry.isStaffEmailTemplate(t)).toBe(true);
      }
      for (const bad of ['', 'EMAIL_CHANGED', 'email_changed ', 'booking_confirmed', 'toString']) {
        expect(notificationEntry.isStaffEmailTemplate(bad), bad).toBe(false);
      }
      // The shared address rule travels on the same entry (FB-R4-INT-BE-31-04).
      expect(typeof notificationEntry.normalizeEmailAddress).toBe('function');
      expect(typeof notificationEntry.isEmailAddress).toBe('function');
    });

    it('every function the requeue script asks the worker image for is exported by this entry', () => {
      let script: string;
      try {
        script = readFileSync(
          new URL('../../infra/server/bin/requeue-email-changed.sh', import.meta.url),
          'utf8',
        );
      } catch {
        return; // script gone: nothing outside depends on this path any more
      }
      const imports = [
        ...script.matchAll(/import\(\s*\\?["'](@ottimo\/integrations[^"'\\]*)\\?["']\s*\)/g),
      ].map((m) => m[1]);
      for (const spec of imports) expect(spec).toBe('@ottimo/integrations/notification');
      const called = [...script.matchAll(/\bm\.([A-Za-z_$][\w$]*)\(/g)].map((m) => m[1] as string);
      if (imports.length > 0) expect(called.length).toBeGreaterThan(0);
      for (const name of called) {
        expect(typeof (notificationEntry as Record<string, unknown>)[name], name).toBe('function');
      }
      const asked = [
        ...script.matchAll(/isStaffEmailTemplate\(\s*\\?["']([a-z_]+)\\?["']\s*\)/g),
      ].map((m) => m[1] as string);
      for (const t of asked) expect(notificationEntry.isStaffEmailTemplate(t), t).toBe(true);
    });
  });

  it('refuses an unknown template', () => {
    expect(() => renderStaffEmail('nope', {})).toThrow(/Unknown e-mail template/);
  });
});
