import { describe, expect, it } from 'vitest';
import { IntegrationError, type IntegrationContext } from '../contracts/common.js';
import {
  ManualGuestRegistrationAdapter,
  toPortalDate,
  validatePortalReference,
  type RegistrationPersonSource,
  type RegistrationStaySource,
} from './manual.js';

const ctx: IntegrationContext = { propertyId: 'p1', credentialsRef: 'env:none', requestId: 'r1' };
const portalUrls = {
  foreigner_temp_residence: 'https://portal-nn.example.test/khai-bao',
  vn_citizen_stay: 'https://portal-vn.example.test/luu-tru',
};

// Fictitious people (test data only).
const emma: RegistrationPersonSource = {
  personRef: 'pr_a1',
  kind: 'foreigner_temp_residence',
  fullNameOnDoc: 'Emma Test Example',
  dateOfBirth: '1990-03-14',
  gender: 'female',
  nationalityCode: 'gbr',
  docType: 'passport',
  docNumber: 'X1234567',
  passportExpiryDate: '2030-01-31',
  visaKind: 'visa',
  visaNumber: 'V998877',
  visaValidUntil: '2026-11-20',
  entryDate: '2026-10-10',
  entryPort: 'Tan Son Nhat',
  entryPurpose: 'Du lịch',
};
const an: RegistrationPersonSource = {
  personRef: 'pr_b2',
  kind: 'vn_citizen_stay',
  fullNameOnDoc: 'Trần Thị Thử',
  dateOfBirth: '1988-07-02',
  nationalityCode: 'VNM',
  docType: 'cccd',
  docNumber: '079188000001',
};

function adapter(stay: RegistrationStaySource) {
  return new ManualGuestRegistrationAdapter({ data: { loadStay: async () => stay }, portalUrls });
}

describe('ManualGuestRegistrationAdapter', () => {
  it('foreigner: fields in form order, uppercase name, dd/mm/yyyy, departure clamped to visa (BR-605)', async () => {
    const a = adapter({
      arrivalDate: '2026-10-19',
      departureDate: '2026-12-04',
      roomNo: '302',
      people: [emma],
    });
    const p = await a.prepare(ctx, 'stay-1');
    expect(p.portalUrl).toBe(portalUrls.foreigner_temp_residence);
    expect(p.people[0]?.fields.map((f) => f.label)).toEqual([
      'Họ và tên',
      'Giới tính',
      'Ngày sinh',
      'Quốc tịch',
      'Số hộ chiếu',
      'Ngày hết hạn hộ chiếu',
      'Diện nhập cảnh',
      'Số thị thực / thẻ tạm trú',
      'Thời hạn tạm trú đến',
      'Ngày nhập cảnh',
      'Cửa khẩu nhập cảnh',
      'Mục đích nhập cảnh',
      'Ngày đến',
      'Ngày đi dự kiến',
      'Số phòng',
    ]);
    const get = (label: string) => p.people[0]?.fields.find((f) => f.label === label)?.value;
    expect(get('Họ và tên')).toBe('EMMA TEST EXAMPLE');
    expect(get('Quốc tịch')).toBe('GBR');
    expect(get('Ngày sinh')).toBe('14/03/1990');
    expect(get('Ngày đi dự kiến')).toBe('20/11/2026'); // HĐ to 04/12, visa to 20/11
  });

  it('VN citizen: CCCD label, Vietnamese name kept, full stay dates', async () => {
    const a = adapter({
      arrivalDate: '2026-10-19',
      departureDate: '2026-10-21',
      roomNo: '202',
      people: [an],
    });
    const [block] = await a.preparePortalData(ctx, 'stay-2');
    expect(block?.kind).toBe('vn_citizen_stay');
    expect(block?.portalUrl).toBe(portalUrls.vn_citizen_stay);
    expect(block?.clipboardText).toBe(
      [
        'Người 1',
        'Họ và tên: Trần Thị Thử',
        'Ngày sinh: 02/07/1988',
        'Số định danh cá nhân / CCCD: 079188000001',
        'Quốc tịch: Việt Nam',
        'Lưu trú từ ngày: 19/10/2026',
        'Lưu trú đến ngày: 21/10/2026',
        'Số phòng: 202',
      ].join('\n'),
    );
  });

  it('mixed stay → two blocks (foreigner first), each a separate declaration; filter by kind', async () => {
    const a = adapter({
      arrivalDate: '2026-10-19',
      departureDate: '2026-10-21',
      roomNo: '301',
      people: [an, emma],
    });
    const blocks = await a.preparePortalData(ctx, 'stay-3');
    expect(blocks.map((b) => [b.kind, b.people.length])).toEqual([
      ['foreigner_temp_residence', 1],
      ['vn_citizen_stay', 1],
    ]);
    const only = await a.preparePortalData(ctx, 'stay-3', 'vn_citizen_stay');
    expect(only).toHaveLength(1);
    const none = adapter({
      arrivalDate: '2026-10-19',
      departureDate: '2026-10-21',
      roomNo: '301',
      people: [an],
    });
    await expect(
      none.preparePortalData(ctx, 's', 'foreigner_temp_residence'),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('missing required field → INVALID_REQUEST naming the field, never a value', async () => {
    const a = adapter({
      arrivalDate: '2026-10-19',
      departureDate: '2026-10-21',
      roomNo: '202',
      people: [{ ...an, docNumber: '' }],
    });
    const err = await a.prepare(ctx, 's').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(IntegrationError);
    expect((err as Error).message).toContain('docNumber');
    expect((err as Error).message).not.toContain('Trần');
  });

  it('portal URLs must be https', () => {
    expect(
      () =>
        new ManualGuestRegistrationAdapter({
          data: {
            loadStay: async () => ({ arrivalDate: '', departureDate: '', roomNo: '', people: [] }),
          },
          portalUrls: { ...portalUrls, vn_citizen_stay: 'http://insecure.example.test' },
        }),
    ).toThrow(/https/);
  });

  it('recordSubmission validates the portal reference (EP06 5.2)', async () => {
    const a = adapter({
      arrivalDate: '2026-10-19',
      departureDate: '2026-10-21',
      roomNo: '202',
      people: [an],
    });
    await expect(a.recordSubmission(ctx, 'stay-2', ' HS-2026/10.123 ')).resolves.toBeUndefined();
    for (const bad of ['', 'ab', 'x'.repeat(65), 'HS 123', 'HS<1>']) {
      expect(() => validatePortalReference(bad)).toThrowError(IntegrationError);
    }
  });

  it('toPortalDate', () => {
    expect(toPortalDate('2026-01-05')).toBe('05/01/2026');
    expect(() => toPortalDate('05/01/2026')).toThrowError(IntegrationError);
  });
});
