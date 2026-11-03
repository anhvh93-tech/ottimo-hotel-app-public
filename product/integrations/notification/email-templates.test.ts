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

  describe('email_changed (BUG-R3-032, ARC v1.0.3-contract-email 4.3)', () => {
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

    for (const audience of audiences) {
      it(`${audience}: renders, brand palette only, no link, no address of any kind`, () => {
        const r = renderStaffEmail('email_changed', { ...base, ...leaky, audience });
        for (const s of [r.subject, r.text, r.html]) {
          expect(s).not.toMatch(EMOJI);
          expect(s).not.toContain('@');
          expect(s).not.toContain('example.test');
          expect(s).not.toContain('***');
          expect(s).not.toContain('fd.lan');
        }
        expect(r.subject).toBe(
          'OTTIMO – Security notice: the security e-mail was changed / Thông báo bảo mật: email nhận thư bảo mật đã thay đổi',
        );
        expect(r.text).toContain('03/11/2026 10:15 (GMT+7)');
        for (const c of r.html.match(/#[0-9A-Fa-f]{6}\b/g) ?? []) {
          expect(ALLOWED_COLOURS.has(c.toUpperCase())).toBe(true);
        }
        expect(r.html).not.toMatch(/<a\s|href=|https?:\/\//i);
        expect(r.text).not.toMatch(/https?:\/\/|www\./);
        expect(r.html).toContain('lang="vi"');
      });
    }

    it('self: tells the new address it now receives notices, EN then VI, no staff name', () => {
      const r = renderStaffEmail('email_changed', { ...base, audience: 'self' });
      expect(r.text).toContain(
        'This address will now receive security notices for your OTTIMO Desk account (03/11/2026 10:15 (GMT+7)).',
      );
      expect(r.text).toContain(
        'Từ nay, địa chỉ này nhận thư bảo mật của tài khoản OTTIMO Desk của bạn',
      );
      expect(r.text).toContain('If this was not you');
      expect(r.text.indexOf('This address will now')).toBeLessThan(r.text.indexOf('Từ nay'));
      expect(r.text).not.toContain('Lan');
    });

    it('previous: tells the old address it no longer receives notices and to tell the owner immediately', () => {
      const r = renderStaffEmail('email_changed', { ...base, audience: 'previous' });
      expect(r.text).toContain('was changed or removed (03/11/2026 10:15 (GMT+7)).');
      expect(r.text).toContain('This address will no longer receive security notices.');
      expect(r.text).toContain('tell the owner or the OTTIMO team immediately');
      expect(r.text).toContain('Địa chỉ này sẽ không nhận thư bảo mật nữa.');
      expect(r.text).toContain('hãy báo ngay chủ cơ sở');
      expect(r.text).not.toContain('will now receive');
      expect(r.text).not.toContain('Lan');
    });

    it('owner: names the person (escaped), asks to check today, no address', () => {
      const r = renderStaffEmail('email_changed', { ...base, audience: 'owner' });
      expect(r.text).toContain('The security e-mail of Lan was changed or removed');
      expect(r.text).toContain('Email nhận thư bảo mật của Lan vừa được đổi hoặc gỡ');
      expect(r.text).toContain('check with them today');
      const x = renderStaffEmail('email_changed', { audience: 'owner', staffName: '<b>Lan</b>' });
      expect(x.html).not.toContain('<b>Lan');
      expect(x.html).toContain('&lt;b&gt;Lan');
    });

    it('owner without a name falls back to a neutral phrase', () => {
      const r = renderStaffEmail('email_changed', { audience: 'owner' });
      expect(r.text).toContain('The security e-mail of A staff member was changed');
      expect(r.text).toContain('Một nhân viên');
    });

    it('missing or unknown audience: neutral copy that claims nothing about which address this is', () => {
      const cases: Record<string, string>[] = [{}, { audience: 'someone' }];
      for (const params of cases) {
        const r = renderStaffEmail('email_changed', params);
        expect(r.text).toContain('The security e-mail of an OTTIMO Desk account was changed.');
        expect(r.text).not.toMatch(/will now receive|no longer receive/);
      }
    });

    it('the three copies differ from each other', () => {
      const texts = audiences.map(
        (audience) => renderStaffEmail('email_changed', { ...base, audience }).text,
      );
      expect(new Set(texts).size).toBe(3);
    });
  });

  it('refuses an unknown template', () => {
    expect(() => renderStaffEmail('nope', {})).toThrow(/Unknown e-mail template/);
  });
});
