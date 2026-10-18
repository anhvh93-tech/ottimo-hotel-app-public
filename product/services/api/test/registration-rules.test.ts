/**
 * Registration rules (EP06 v0.2) with the BR examples as golden tests (coding-standards 10.2):
 * BR-602 / BR-603 deadlines (wall clock, not business date), DOM G-5 name match, BR-605/BR-613 checks and
 * blocking, SM-05 status from counts, EP06 2.2 input validation.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PORTAL_VALUE_VI } from '../src/generated/portal-copy';
import { ALPHA3_TO_ALPHA2, countryNameVi } from '../src/modules/registration/internal/countries';
import {
  ageAt,
  computeChecks,
  deadlineLabel,
  isBlocking,
  nameMatch,
  nextStatus,
  docNumberCandidates,
  formatNationality,
  formatPortalDate,
  hasLongDigitRun,
  portalClipboard,
  portalFields,
  registrationDeadline,
  validateDocumentInput,
  visaAlertOn,
} from '../src/modules/registration/internal/rules';

const TZ = 'Asia/Ho_Chi_Minh';
const P = {
  vn: { before: '23:00', lateArrivalFrom: '23:00', lateArrivalDeadlineNextDay: '08:00' },
  foreignerHours: 12,
  foreignerMode: 'hours_only' as const,
};
const at = (local: string) => new Date(`${local}+07:00`);
const iso = (d: Date) => d.toISOString();

describe('BR-602 VN deadline (wall-clock date of the actual arrival)', () => {
  it('arrival 23:40 on 20/10 → 08:00 on 21/10', () => {
    const d = registrationDeadline(at('2026-10-20T23:40:00'), TZ, 'vn_citizen_stay', P);
    expect(iso(d.at)).toBe(iso(at('2026-10-21T08:00:00')));
    expect(d.basis).toBe('vn_0800_next');
  });
  it('arrival 01:30 on 21/10 (business date still 20/10) → 23:00 on 21/10', () => {
    const d = registrationDeadline(at('2026-10-21T01:30:00'), TZ, 'vn_citizen_stay', P);
    expect(iso(d.at)).toBe(iso(at('2026-10-21T23:00:00')));
  });
  it('22:59 / 23:00 on both sides of the mark', () => {
    expect(iso(registrationDeadline(at('2026-10-20T22:59:00'), TZ, 'vn_citizen_stay', P).at)).toBe(
      iso(at('2026-10-20T23:00:00')),
    );
    expect(iso(registrationDeadline(at('2026-10-20T23:00:00'), TZ, 'vn_citizen_stay', P).at)).toBe(
      iso(at('2026-10-21T08:00:00')),
    );
  });
});

describe('BR-603 foreigner deadline = actual arrival + 12 h (hours_only)', () => {
  for (const [arrive, due] of [
    ['2026-10-20T08:00:00', '2026-10-20T20:00:00'],
    ['2026-10-20T21:30:00', '2026-10-21T09:30:00'],
    ['2026-10-20T23:40:00', '2026-10-21T11:40:00'],
    ['2026-10-21T01:30:00', '2026-10-21T13:30:00'],
    // G-9: 04:40 → 16:40 (B9a early arrival)
    ['2026-10-21T04:40:00', '2026-10-21T16:40:00'],
  ] as const) {
    it(`${arrive} → ${due}`, () => {
      expect(iso(registrationDeadline(at(arrive), TZ, 'foreigner_temp_residence', P).at)).toBe(
        iso(at(due)),
      );
    });
  }
  it('earlier_of: 21:30 → 23:00 the same day; after 23:00 → +12 h', () => {
    const e = { ...P, foreignerMode: 'earlier_of' as const };
    expect(
      iso(registrationDeadline(at('2026-10-20T21:30:00'), TZ, 'foreigner_temp_residence', e).at),
    ).toBe(iso(at('2026-10-20T23:00:00')));
    expect(
      iso(registrationDeadline(at('2026-10-20T23:40:00'), TZ, 'foreigner_temp_residence', e).at),
    ).toBe(iso(at('2026-10-21T11:40:00')));
  });
  it('mixed / unknown → the earlier of the two blocks', () => {
    expect(iso(registrationDeadline(at('2026-10-20T08:00:00'), TZ, 'mixed', P).at)).toBe(
      iso(at('2026-10-20T20:00:00')),
    );
    expect(iso(registrationDeadline(at('2026-10-20T21:30:00'), TZ, null, P).at)).toBe(
      iso(at('2026-10-20T23:00:00')),
    );
  });
});

describe('name_match (EP06 3.1, DOM G-5)', () => {
  it('any order, no diacritics, extra middle names on the document still pass', () => {
    expect(nameMatch('Daniel Weber', 'WEBER DANIEL')).toBe('pass');
    expect(nameMatch('Nguyễn Văn Đức', 'NGUYEN VAN DUC')).toBe('pass');
    expect(nameMatch('Emma Schmidt', 'SCHMIDT EMMA LOUISE')).toBe('pass');
  });
  it('a missing word fails; a one-word booking name is never "pass"', () => {
    expect(nameMatch('Daniel Weber', 'DANIEL MUELLER')).toBe('fail');
    expect(nameMatch('Tuấn', 'NGUYEN ANH TUAN')).toBe('unverified');
    expect(nameMatch(null, 'ANY NAME')).toBe('unverified');
  });
});

const ctx = {
  arrivalDate: '2026-10-15',
  departureDate: '2026-10-20',
  bookingName: 'Emma Schmidt',
  submittedCount: 1,
  requiredCount: 1,
  isMain: true,
};
const passport = {
  docType: 'passport' as const,
  fullNameOnDoc: 'SCHMIDT EMMA',
  nationalityCode: 'DEU',
  passportExpiryDate: '2030-01-01',
  visaKind: 'visa_exempt' as const,
  visaValidUntil: '2026-11-20',
  entryDate: '2026-10-10',
  noEntryRecord: false,
};
const res = (checks: ReturnType<typeof computeChecks>) =>
  Object.fromEntries(checks.map((c) => [c.code, [c.result, c.blocking]]));

describe('BR-605 / BR-613 checks', () => {
  it('everything valid → pass, nothing blocking', () => {
    const r = res(computeChecks(passport, ctx));
    expect(r.passport_valid_through_departure).toEqual(['pass', false]);
    expect(r.visa_valid_at_arrival).toEqual(['pass', false]);
    expect(r.entry_record_present).toEqual(['pass', false]);
    expect(r.party_count).toEqual(['pass', false]);
  });
  it('passport expiring exactly on the departure day = fail (AC1), not blocking (b)', () => {
    const r = res(computeChecks({ ...passport, passportExpiryDate: '2026-10-20' }, ctx));
    expect(r.passport_valid_through_departure).toEqual(['fail', false]);
    expect(r.passport_valid_at_arrival).toEqual(['pass', false]);
  });
  it('BR-613 (c): passport expired at arrival (10/10 vs 15/10) blocks the door code', () => {
    const r = res(computeChecks({ ...passport, passportExpiryDate: '2026-10-10' }, ctx));
    expect(r.passport_valid_at_arrival).toEqual(['fail', true]);
  });
  it('BR-613 (a): visa ends before departure but valid at arrival – warning only, declare to the visa', () => {
    const r = res(computeChecks({ ...passport, visaValidUntil: '2026-10-18' }, ctx));
    expect(r.visa_valid_through_departure).toEqual(['fail', false]);
    expect(r.visa_valid_at_arrival).toEqual(['pass', false]);
    expect(r.stay_within_visa).toEqual(['fail', false]);
  });
  it('no entry stamp marked → fail + blocking; nothing entered → unverified + blocking (ARC assumption)', () => {
    expect(
      res(computeChecks({ ...passport, entryDate: null, noEntryRecord: true }, ctx))
        .entry_record_present,
    ).toEqual(['fail', true]);
    expect(res(computeChecks({ ...passport, entryDate: null }, ctx)).entry_record_present).toEqual([
      'unverified',
      true,
    ]);
    expect(isBlocking('entry_record_present', 'unverified', 'pass')).toBe(false);
    expect(isBlocking('entry_record_present', 'unverified', 'fail')).toBe(true);
  });
  it('Vietnamese guest: visa/passport items not applicable; a missing person fails party_count', () => {
    const r = res(
      computeChecks(
        { ...passport, docType: 'cccd', nationalityCode: 'VNM', fullNameOnDoc: 'EMMA SCHMIDT' },
        { ...ctx, submittedCount: 1, requiredCount: 3 },
      ),
    );
    expect(r.visa_valid_at_arrival).toEqual(['not_applicable', false]);
    expect(r.party_count).toEqual(['fail', false]);
  });
  it('a manual result of the desk is kept while the automatic result is unchanged', () => {
    const first = computeChecks({ ...passport, entryDate: null }, ctx).map((c) =>
      c.code === 'entry_record_present'
        ? { ...c, manualResult: 'pass' as const, note: 'Seen stamp', blocking: false }
        : c,
    );
    const again = computeChecks({ ...passport, entryDate: null }, ctx, first);
    expect(again.find((c) => c.code === 'entry_record_present')).toMatchObject({
      manualResult: 'pass',
      note: 'Seen stamp',
      blocking: false,
    });
  });
});

describe('SM-05 status from counts, labels, ages, visa reminder', () => {
  it('K2/K3/K4/K13', () => {
    expect(nextStatus('none', { submitted: 0, required: 2, guestUploads: 1 })).toBe('pre');
    expect(nextStatus('pre', { submitted: 1, required: 2, guestUploads: 1 })).toBe('partial');
    expect(nextStatus('partial', { submitted: 2, required: 2, guestUploads: 0 })).toBe('review');
    expect(nextStatus('review', { submitted: 1, required: 2, guestUploads: 0 })).toBe('partial');
    expect(nextStatus('scanned', { submitted: 0, required: 2, guestUploads: 0 })).toBe('scanned');
  });
  it('deadline labels', () => {
    const now = at('2026-10-20T21:00:00');
    expect(deadlineLabel('partial', null, false, now)).toBe('at_checkin');
    expect(deadlineLabel('partial', at('2026-10-20T23:00:00'), true, now)).toBe(
      'before_deadline_today',
    );
    expect(deadlineLabel('partial', at('2026-10-20T20:00:00'), true, now)).toBe('overdue');
    expect(deadlineLabel('sent', at('2026-10-20T20:00:00'), true, now)).toBe('done');
    expect(deadlineLabel('needs_update', null, true, now)).toBe('needs_update');
  });
  it('BR-612 age at arrival; BR-605 reminder (Emma long stay 20/11 − 30 = 21/10)', () => {
    expect(ageAt('2010-10-16', '2026-10-15')).toBe(15);
    expect(ageAt('2010-10-15', '2026-10-15')).toBe(16);
    expect(visaAlertOn('2026-11-20', 30)).toBe('2026-10-21');
    expect(visaAlertOn('2026-11-20', 14)).toBe('2026-11-06');
  });
});

describe('EP06 2.2 document input', () => {
  const today = '2026-10-15';
  it('normalises the number and accepts a valid CCCD', () => {
    const r = validateDocumentInput(
      {
        docType: 'cccd',
        fullNameOnDoc: 'Nguyễn Văn An',
        docNumber: '0791 2345 6789',
        dateOfBirth: '1990-01-02',
      },
      today,
    );
    expect(r.errors).toEqual([]);
    expect(r.value?.docNumber).toBe('079123456789');
    expect(r.value?.nationalityCode).toBe('VNM');
  });
  it('field codes: DOC_NUMBER_INVALID, ENTRY_DATE_FUTURE, REQUIRED visa for foreigners, expired passport accepted', () => {
    const bad = validateDocumentInput(
      {
        docType: 'passport',
        fullNameOnDoc: 'WEBER DANIEL',
        docNumber: 'C1-2',
        dateOfBirth: '1980-05-05',
        nationalityCode: 'DEU',
        passportExpiryDate: '2026-01-01',
        entryDate: '2026-10-20',
      },
      today,
    );
    const codes = bad.errors.map((e) => `${e.field}:${e.code}`);
    expect(codes).toContain('docNumber:DOC_NUMBER_INVALID');
    expect(codes).toContain('entryDate:ENTRY_DATE_FUTURE');
    expect(codes).toContain('visaKind:REQUIRED');
    expect(codes).not.toContain('passportExpiryDate:DATE_INVALID');
  });
  it('a card number in a free-text field is refused (V-09)', () => {
    const r = validateDocumentInput(
      {
        docType: 'cccd',
        fullNameOnDoc: 'Le Thi B',
        docNumber: '079123456789',
        dateOfBirth: '1990-01-02',
        address: 'Thẻ 4111 1111 1111 1111',
      },
      today,
    );
    expect(r.errors).toContainEqual({ field: 'address', code: 'CARD_NUMBER_DETECTED' });
  });
});

describe('portal data in Vietnamese (ORC 17/10, UXD s3 section 9)', () => {
  const person = {
    fullNameOnDoc: 'SCHMIDT EMMA',
    dateOfBirth: '1990-04-12',
    gender: 'female',
    nationalityCode: 'DEU',
    docNumber: 'C01X00T47',
    passportExpiryDate: '2031-01-01',
    visaKind: 'visa_exempt',
    visaNumber: null,
    visaValidUntil: '2026-10-18',
    entryDate: '2026-10-10',
    entryPort: null,
    entryPurpose: 'du lịch',
    address: null,
    arrivalDate: '2026-10-15',
    departureDate: '2026-10-20',
    roomNo: '202',
  };

  it('foreigner: 15 fields in portal order, enums in Vietnamese with their key, empty kept, departure ≤ visa', () => {
    const f = portalFields('foreigner_temp_residence', person);
    expect(f.map((x) => x.label)).toEqual([
      'reg.field.full_name',
      'reg.field.date_of_birth',
      'reg.field.gender',
      'reg.field.nationality',
      'reg.field.passport_number',
      'reg.field.passport_expiry',
      'reg.field.visa_kind',
      'reg.field.visa_number',
      'reg.field.visa_valid_until',
      'reg.field.entry_date',
      'reg.field.entry_port',
      'reg.field.entry_purpose',
      'reg.field.arrival_date',
      'reg.field.departure_date',
      'reg.field.room_no',
    ]);
    const by = Object.fromEntries(f.map((x) => [x.label, x]));
    expect(by['reg.field.gender']).toEqual({
      label: 'reg.field.gender',
      value: 'Nữ',
      valueKey: 'reg.value.gender.female',
    });
    expect(by['reg.field.visa_kind']).toEqual({
      label: 'reg.field.visa_kind',
      value: 'Miễn thị thực',
      valueKey: 'reg.value.visa_kind.visa_exempt',
    });
    expect(by['reg.field.visa_number']).toEqual({
      label: 'reg.field.visa_number',
      value: '',
      valueKey: 'reg.value.empty',
    });
    expect(by['reg.field.passport_number']).toEqual({
      label: 'reg.field.passport_number',
      value: 'C01X00T47',
    });
    expect(by['reg.field.departure_date']?.value).toBe('18/10/2026'); // BR-605, DOM S3-5 dd/MM/yyyy
    expect(by['reg.field.date_of_birth']?.value).toBe('12/04/1990');
    // ESC-018 (INV): the portal takes the bare upper-case alpha-3 code, no country name.
    expect(by['reg.field.nationality']).toEqual({ label: 'reg.field.nationality', value: 'DEU' });
    const clip = portalClipboard([{ fields: f }]);
    expect(clip.split('\t')).toHaveLength(15);
    expect(clip).toContain('\tNữ\tDEU\t');
    expect(clip).not.toContain('Đức');
    expect(clip).not.toContain('Không có'); // the "empty" hint is for the screen, never pasted
  });

  it('Vietnamese citizen: 8 fields; male → Nam; no visa items', () => {
    const f = portalFields('vn_citizen_stay', {
      ...person,
      gender: 'male',
      nationalityCode: 'VNM',
      address: 'Đà Lạt',
    });
    expect(f).toHaveLength(8);
    expect(f.find((x) => x.label === 'reg.field.gender')?.value).toBe('Nam');
    expect(f.some((x) => x.label.startsWith('reg.field.visa'))).toBe(false);
    expect(f.find((x) => x.label === 'reg.field.departure_date')?.value).toBe('20/10/2026');
  });

  it('DOM S3-5: formats are parameters – ISO date and "name (code)" when OWN/MGR choose them', () => {
    const f = portalFields('foreigner_temp_residence', person, {
      date: 'yyyy-MM-dd',
      nationality: 'name_vi_alpha3',
    });
    const by = Object.fromEntries(f.map((x) => [x.label, x.value]));
    expect(by['reg.field.date_of_birth']).toBe('1990-04-12');
    expect(by['reg.field.nationality']).toBe('Đức (DEU)');
    expect(by['reg.field.arrival_date']).toBe('2026-10-15');
    expect(formatPortalDate('2026-10-20', 'dd/MM/yyyy')).toBe('20/10/2026');
    expect(formatPortalDate(null, 'dd/MM/yyyy')).toBeNull();
    expect(formatNationality('KOR', 'name_vi_alpha3')).toBe('Hàn Quốc (KOR)'); // optional format
    expect(formatNationality('kor', 'alpha3')).toBe('KOR');
    expect(formatNationality('ZZZ', 'name_vi_alpha3')).toBe('ZZZ'); // unknown code: never invent a name
  });

  it('countries: every alpha-3 entry has a Vietnamese CLDR name; MRZ special codes map to GB / XK', () => {
    expect(ALPHA3_TO_ALPHA2.size).toBeGreaterThanOrEqual(249);
    const missing = [...ALPHA3_TO_ALPHA2.keys()].filter((a3) => !countryNameVi(a3));
    expect(missing).toEqual([]);
    expect(countryNameVi('DEU')).toBe('Đức');
    expect(countryNameVi('VNM')).toBe('Việt Nam');
    for (const a3 of ['GBD', 'GBN', 'GBO', 'GBP', 'GBS'])
      expect(ALPHA3_TO_ALPHA2.get(a3)).toBe('GB');
    expect(ALPHA3_TO_ALPHA2.get('RKS')).toBe('XK');
    expect(new Set(ALPHA3_TO_ALPHA2.values()).size).toBeGreaterThanOrEqual(247);
  });

  it('the Vietnamese words come from design/copy/strings-vi.json (generated file up to date)', () => {
    const vi = JSON.parse(
      readFileSync(join(__dirname, '../../../design/copy/strings-vi.json'), 'utf8'),
    ) as Record<string, string>;
    for (const [k, v] of Object.entries(PORTAL_VALUE_VI)) expect({ k, v }).toEqual({ k, v: vi[k] });
    expect(() =>
      execFileSync(
        process.execPath,
        [join(__dirname, '..', 'scripts', 'gen-portal-copy.mjs'), '--check'],
        {
          stdio: 'pipe',
        },
      ),
    ).not.toThrow();
  });
});

describe('document numbers in staff notes (SEC FB-R2-SEC-BE-48)', () => {
  it('six digits or more in a row, separators (space . , -) ignored, NFKC → sensitive (SEC BE-77)', () => {
    for (const note of [
      'CCCD 079123456789',
      '079 123 456 789',
      '079.123.456.789',
      '079-123-456-789',
      'CCCD079123456789',
      'mã cửa 123 456',
      // SEC FB-R2-SEC-BE-77 (C.6): commas are separators too, full-width digits are digits (NFKC).
      '079,123,456,789',
      'mã cửa 123,456',
      '０７９１２３４５６７８９',
      'SĐT ０９０５ １２３ ４５６',
    ]) {
      expect({ note, hit: hasLongDigitRun(note) }).toEqual({ note, hit: true });
    }
    for (const note of [
      'Người đi cùng, đã đối chiếu bản gốc',
      'Phòng 202, 2 khách',
      'Đến 22:30 ngày 20/10',
      'Phòng ２０２, ２ khách',
    ]) {
      expect({ note, hit: hasLongDigitRun(note) }).toEqual({ note, hit: false });
    }
  });

  it('candidates: windows ending with a known last-4 after removing separators (prefix glued, other person)', () => {
    const last4 = new Set(['0T47', '6789']);
    expect(docNumberCandidates('hộ chiếu C01X-00T47 của người đi cùng', last4)).toContain(
      'C01X00T47',
    );
    expect(docNumberCandidates('CCCD079123456789', last4)).toContain('079123456789');
    expect(docNumberCandidates('số P 777 777', last4)).toEqual([]);
    // Every candidate ends with a known last-4 and is 3..30 characters long.
    for (const c of docNumberCandidates('ABC C01X00T47 XYZ 0123456789', last4)) {
      expect(c.length).toBeGreaterThanOrEqual(3);
      expect(c.length).toBeLessThanOrEqual(30);
      expect([...last4].some((l) => c.endsWith(l) || l.endsWith(c))).toBe(true);
    }
  });
});
