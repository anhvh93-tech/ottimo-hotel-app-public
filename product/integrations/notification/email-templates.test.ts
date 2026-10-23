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

  it('refuses an unknown template', () => {
    expect(() => renderStaffEmail('nope', {})).toThrow(/Unknown e-mail template/);
  });
});
