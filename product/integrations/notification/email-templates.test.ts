import { describe, expect, it } from 'vitest';
import { BRAND, renderStaffEmail, STAFF_EMAIL_TEMPLATES } from './email-templates.js';

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
        // Option B of FB-R4-CPY-INT-05: the anti-phishing line ends the body of every email_changed copy.
        expect(r.text).toContain('OTTIMO security notices never contain links');
        expect(r.text).toContain('không bao giờ có đường liên kết');
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

    // CPY test 6 (option B): the shared footer of the older templates is unchanged in v1.0.3.
    it('older templates keep their footer and do not get the email_changed anti-phishing line', () => {
      for (const t of STAFF_EMAIL_TEMPLATES.filter((x) => x !== 'email_changed')) {
        const r = renderStaffEmail(t, { audience: 'self', occurredAt: '03/11/2026 10:15 (GMT+7)' });
        expect(r.text).toContain('OTTIMO never asks for your password or codes by e-mail.');
        expect(r.text).not.toContain('never contain links');
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

  it('refuses an unknown template', () => {
    expect(() => renderStaffEmail('nope', {})).toThrow(/Unknown e-mail template/);
  });
});
