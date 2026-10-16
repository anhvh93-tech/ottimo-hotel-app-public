// GuestRegistrationAdapter 'manual' / semi-auto (README 3.6, EP06 v0.2 section 5, BR-602…606). Owner: INT.
// The police portals have no public API: this adapter only lays out the fields so front desk can copy them
// into the portal and then type back the portal's file reference. It never calls the portal, never writes a
// file, never logs. All values are C3: the core (BE-C) must have written c3_access_log BEFORE calling it
// (SEC B3/E1) and returns the result only to a trusted device. One stay at a time (no multi-booking export –
// A75, SEC E3).
import {
  IntegrationError,
  localDate,
  type IntegrationContext,
  type LocalDate,
} from '../contracts/common.js';
import type {
  GuestRegistrationAdapter,
  GuestRegistrationKind,
  GuestRegistrationPerson,
  GuestRegistrationPrepared,
} from '../contracts/guest-registration.js';

export type GuestDocType = 'cccd' | 'passport' | 'child_personal_id' | 'other';
export type VisaKind = 'visa' | 'visa_exempt' | 'temp_residence_card';

/** One person as decrypted by the core (EP06 2.2 field names). */
export interface RegistrationPersonSource {
  /** Random internal reference – not a name or document number. */
  personRef: string;
  /** Decided by the core from the declaring document (EP06 0.1, BR-009). */
  kind: GuestRegistrationKind;
  fullNameOnDoc: string;
  dateOfBirth: LocalDate | string;
  gender?: 'male' | 'female' | 'other';
  /** ISO 3166-1 alpha-3. */
  nationalityCode: string;
  docType: GuestDocType;
  docNumber: string;
  passportExpiryDate?: LocalDate | string;
  visaKind?: VisaKind;
  visaNumber?: string;
  visaValidUntil?: LocalDate | string;
  entryDate?: LocalDate | string;
  entryPort?: string;
  entryPurpose?: string;
  phone?: string;
  address?: string;
}

export interface RegistrationStaySource {
  arrivalDate: LocalDate | string;
  departureDate: LocalDate | string;
  roomNo: string;
  people: RegistrationPersonSource[];
}

/** Implemented by BE-C (registration module): load + decrypt after logging the C3 access. */
export interface RegistrationDataPort {
  loadStay(ctx: IntegrationContext, stayId: string): Promise<RegistrationStaySource>;
}

export interface ManualGuestRegistrationOptions {
  data: RegistrationDataPort;
  /** From configuration (BR-606 names tbltkbtt.bocongan.gov.vn for foreigners). No default: the property sets both. */
  portalUrls: Readonly<Record<GuestRegistrationKind, string>>;
}

/** Shape of OpenAPI `PortalData` – one block per kind (a mixed stay = two declarations, EP06 5.1). */
export interface PortalDataBlock {
  kind: GuestRegistrationKind;
  portalUrl: string;
  people: { fields: { label: string; value: string }[] }[];
  clipboardText: string;
}

const PORTAL_REFERENCE_RE = /^[A-Za-z0-9\-/._]{3,64}$/;

const GENDER_VI: Readonly<Record<string, string>> = { male: 'Nam', female: 'Nữ', other: 'Khác' };
const VISA_KIND_VI: Readonly<Record<VisaKind, string>> = {
  visa: 'Thị thực',
  visa_exempt: 'Miễn thị thực',
  temp_residence_card: 'Thẻ tạm trú',
};

/** 'YYYY-MM-DD' → 'dd/mm/yyyy' (format used by the portals' date fields). */
export function toPortalDate(value: LocalDate | string): string {
  const d = localDate(value);
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}

/** Throws with the field name and the internal person reference only – never a value. */
function required(person: RegistrationPersonSource, field: keyof RegistrationPersonSource): string {
  const v = person[field];
  if (typeof v !== 'string' || v.trim() === '') {
    throw new IntegrationError(
      'INVALID_REQUEST',
      `Missing ${String(field)} for person ${person.personRef}`,
    );
  }
  return v.trim();
}

function minDate(a: string, b: string | undefined): string {
  return b !== undefined && b < a ? b : a;
}

function foreignerFields(
  p: RegistrationPersonSource,
  stay: RegistrationStaySource,
): { label: string; value: string }[] {
  // BR-605: the declared departure never exceeds the permitted stay.
  const departure = minDate(
    localDate(stay.departureDate),
    p.visaValidUntil ? localDate(p.visaValidUntil) : undefined,
  );
  const f: { label: string; value: string }[] = [
    { label: 'Họ và tên', value: required(p, 'fullNameOnDoc').toUpperCase() },
    { label: 'Giới tính', value: p.gender ? (GENDER_VI[p.gender] as string) : '' },
    { label: 'Ngày sinh', value: toPortalDate(required(p, 'dateOfBirth')) },
    { label: 'Quốc tịch', value: required(p, 'nationalityCode').toUpperCase() },
    { label: 'Số hộ chiếu', value: required(p, 'docNumber') },
    {
      label: 'Ngày hết hạn hộ chiếu',
      value: p.passportExpiryDate ? toPortalDate(p.passportExpiryDate) : '',
    },
    { label: 'Diện nhập cảnh', value: p.visaKind ? VISA_KIND_VI[p.visaKind] : '' },
    { label: 'Số thị thực / thẻ tạm trú', value: p.visaNumber ?? '' },
    {
      label: 'Thời hạn tạm trú đến',
      value: p.visaValidUntil ? toPortalDate(p.visaValidUntil) : '',
    },
    { label: 'Ngày nhập cảnh', value: p.entryDate ? toPortalDate(p.entryDate) : '' },
    { label: 'Cửa khẩu nhập cảnh', value: p.entryPort ?? '' },
    { label: 'Mục đích nhập cảnh', value: p.entryPurpose ?? '' },
    { label: 'Số điện thoại', value: p.phone ?? '' },
    { label: 'Ngày đến', value: toPortalDate(stay.arrivalDate) },
    { label: 'Ngày đi dự kiến', value: toPortalDate(departure) },
    { label: 'Số phòng', value: stay.roomNo },
  ];
  return f.filter((x) => x.value !== '');
}

function citizenFields(
  p: RegistrationPersonSource,
  stay: RegistrationStaySource,
): { label: string; value: string }[] {
  const docLabel = p.docType === 'passport' ? 'Số hộ chiếu' : 'Số định danh cá nhân / CCCD';
  const f: { label: string; value: string }[] = [
    { label: 'Họ và tên', value: required(p, 'fullNameOnDoc') },
    { label: 'Ngày sinh', value: toPortalDate(required(p, 'dateOfBirth')) },
    { label: 'Giới tính', value: p.gender ? (GENDER_VI[p.gender] as string) : '' },
    { label: docLabel, value: required(p, 'docNumber') },
    { label: 'Quốc tịch', value: 'Việt Nam' },
    { label: 'Số điện thoại', value: p.phone ?? '' },
    { label: 'Lưu trú từ ngày', value: toPortalDate(stay.arrivalDate) },
    { label: 'Lưu trú đến ngày', value: toPortalDate(stay.departureDate) },
    { label: 'Số phòng', value: stay.roomNo },
  ];
  return f.filter((x) => x.value !== '');
}

/** Field list for one person, in the order the form is filled. */
export function portalFields(
  person: RegistrationPersonSource,
  stay: RegistrationStaySource,
): { label: string; value: string }[] {
  return person.kind === 'foreigner_temp_residence'
    ? foreignerFields(person, stay)
    : citizenFields(person, stay);
}

/** "Người 1" block per person, "Nhãn: giá trị" per line – the `clipboardText` of PortalData. */
export function clipboardTextFor(
  people: readonly { fields: { label: string; value: string }[] }[],
): string {
  return people
    .map((p, i) => [`Người ${i + 1}`, ...p.fields.map((f) => `${f.label}: ${f.value}`)].join('\n'))
    .join('\n\n');
}

/** Portal file reference typed back by staff (EP06 5.2 `mark-sent`). */
export function validatePortalReference(portalReference: string): string {
  const v = portalReference.trim();
  if (!PORTAL_REFERENCE_RE.test(v)) {
    throw new IntegrationError(
      'INVALID_REQUEST',
      'portalReference must be 3–64 characters [A-Za-z0-9-/._]',
    );
  }
  return v;
}

export class ManualGuestRegistrationAdapter implements GuestRegistrationAdapter {
  private readonly data: RegistrationDataPort;
  private readonly portalUrls: Readonly<Record<GuestRegistrationKind, string>>;

  constructor(opts: ManualGuestRegistrationOptions) {
    for (const kind of ['foreigner_temp_residence', 'vn_citizen_stay'] as const) {
      const url = opts.portalUrls[kind];
      if (!url || !/^https:\/\/[^\s/]+(\/\S*)?$/.test(url)) {
        throw new IntegrationError('CONFIG', `Portal URL for ${kind} must be an https URL`);
      }
    }
    this.data = opts.data;
    this.portalUrls = { ...opts.portalUrls };
  }

  private async load(ctx: IntegrationContext, stayId: string): Promise<RegistrationStaySource> {
    const stay = await this.data.loadStay(ctx, stayId);
    if (stay.people.length === 0) {
      throw new IntegrationError('INVALID_REQUEST', 'No person with documents on this stay');
    }
    localDate(stay.arrivalDate);
    localDate(stay.departureDate);
    return stay;
  }

  /** Contract 3.6: one entry per person; portalUrl = foreigner portal when anyone is foreign. */
  async prepare(ctx: IntegrationContext, stayId: string): Promise<GuestRegistrationPrepared> {
    const stay = await this.load(ctx, stayId);
    const people: GuestRegistrationPerson[] = stay.people.map((p) => ({
      personRef: p.personRef,
      kind: p.kind,
      fields: portalFields(p, stay),
    }));
    const anyForeign = people.some((p) => p.kind === 'foreigner_temp_residence');
    return {
      portalUrl: this.portalUrls[anyForeign ? 'foreigner_temp_residence' : 'vn_citizen_stay'],
      people,
    };
  }

  /** OpenAPI `PortalData` blocks: one per kind present (mixed → foreigner block first). Filter with `kind`. */
  async preparePortalData(
    ctx: IntegrationContext,
    stayId: string,
    kind?: GuestRegistrationKind,
  ): Promise<PortalDataBlock[]> {
    const prepared = await this.prepare(ctx, stayId);
    const kinds: GuestRegistrationKind[] = kind
      ? [kind]
      : (['foreigner_temp_residence', 'vn_citizen_stay'] as const).filter((k) =>
          prepared.people.some((p) => p.kind === k),
        );
    return kinds.map((k) => {
      const people = prepared.people.filter((p) => p.kind === k).map((p) => ({ fields: p.fields }));
      if (people.length === 0) {
        throw new IntegrationError('NOT_FOUND', `No ${k} person on this stay`);
      }
      return {
        kind: k,
        portalUrl: this.portalUrls[k],
        people,
        clipboardText: clipboardTextFor(people),
      };
    });
  }

  /** Validates the reference only; the core records submitter (session userId), time and state (K6). */
  async recordSubmission(
    _ctx: IntegrationContext,
    stayId: string,
    portalReference: string,
  ): Promise<void> {
    if (!stayId) throw new IntegrationError('INVALID_REQUEST', 'stayId is required');
    validatePortalReference(portalReference);
  }
}
