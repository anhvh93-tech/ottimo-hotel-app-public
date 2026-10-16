import { describe, expect, it } from 'vitest';
import { IntegrationError, type IntegrationContext } from '../contracts/common.js';
import type { GuestRegistrationPrepared } from '../contracts/guest-registration.js';
import * as mod from './manual.js';
import {
  ManualGuestRegistrationAdapter,
  assertPortalUrl,
  validatePortalReference,
} from './manual.js';

const ctx: IntegrationContext = { propertyId: 'p1', credentialsRef: 'env:none', requestId: 'r1' };

// What BE-C rules.ts would return (fictitious values, labels are i18n keys).
const built: GuestRegistrationPrepared = {
  portalUrl: 'https://portal-nn.example.test',
  people: [
    {
      personRef: 'pr_a1',
      kind: 'foreigner_temp_residence',
      fields: [{ label: 'reg.field.full_name', value: 'EMMA TEST' }],
    },
  ],
};

describe('ManualGuestRegistrationAdapter (FB-R2-ARC-BE-S3-20: no field building in INT)', () => {
  it('prepare returns exactly what the core built', async () => {
    const a = new ManualGuestRegistrationAdapter({ prepare: async () => built });
    await expect(a.prepare(ctx, 'stay-1')).resolves.toBe(built);
  });

  it('prepare refuses a non-https portal address from the core', async () => {
    const a = new ManualGuestRegistrationAdapter({
      prepare: async () => ({ ...built, portalUrl: 'http://look-alike.example.test' }),
    });
    await expect(a.prepare(ctx, 'stay-1')).rejects.toMatchObject({ code: 'CONFIG' });
  });

  it('the module exports no field builder any more (single source = BE-C rules.ts)', () => {
    for (const gone of ['portalFields', 'clipboardTextFor', 'toPortalDate']) {
      expect(Object.keys(mod)).not.toContain(gone);
    }
  });

  it('recordSubmission validates the portal reference (EP06 5.2)', async () => {
    const a = new ManualGuestRegistrationAdapter({ prepare: async () => built });
    await expect(a.recordSubmission(ctx, 'stay-1', ' HS-2026/10.123 ')).resolves.toBeUndefined();
    await expect(a.recordSubmission(ctx, '', 'HS-1')).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
    for (const bad of ['', 'ab', 'x'.repeat(65), 'HS 123', 'HS<1>']) {
      expect(() => validatePortalReference(bad)).toThrowError(IntegrationError);
    }
    expect(validatePortalReference(' HS-1 ')).toBe('HS-1');
  });

  it('assertPortalUrl', () => {
    expect(assertPortalUrl('https://tbltkbtt.bocongan.gov.vn')).toBe(
      'https://tbltkbtt.bocongan.gov.vn',
    );
    for (const bad of ['http://x.test', 'not a url', 'javascript:alert(1)']) {
      expect(() => assertPortalUrl(bad)).toThrowError(IntegrationError);
    }
  });
});
