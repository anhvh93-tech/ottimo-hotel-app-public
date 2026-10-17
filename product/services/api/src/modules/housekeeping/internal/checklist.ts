/**
 * Inspection checklist (BR-808 – 12 points of BL 3.12, US-055; OpenAPI 0.3.7 B-07/B-23): the property's
 * `inspection_checklist` row, or the default below (version 1) when the property has none. Labels in vi/en/ru
 * (`Accept-Language`, missing → vi). Dynamic item `extra_guest_kit` (BR-812 (5)) is added per room by the
 * service; the returned version includes it, so a stale offline submission gets 409 CHECKLIST_OUTDATED.
 * [GIẢ ĐỊNH – BR-808 chờ INV xác nhận nội dung; EN/RU là bản dịch BE – UXD duyệt]
 */
export type ChecklistLocale = 'vi' | 'en' | 'ru';

export interface ChecklistItemDef {
  code: string;
  label: Record<ChecklistLocale, string>;
  required: boolean;
  /** The "photo" point: required only for a self-inspection (BR-802, DOM D-12 e). */
  photo?: boolean;
}

export const PHOTO_CODE = 'photos';
export const EXTRA_KIT_CODE = 'extra_guest_kit';

export const DEFAULT_CHECKLIST: readonly ChecklistItemDef[] = [
  {
    code: 'bedding',
    label: { vi: 'Ga gối', en: 'Bed linen', ru: 'Постельное бельё' },
    required: true,
  },
  { code: 'bathroom', label: { vi: 'Phòng tắm', en: 'Bathroom', ru: 'Ванная' }, required: true },
  {
    code: 'towels',
    label: {
      vi: 'Khăn (2 tắm, 2 mặt, 1 chân)',
      en: 'Towels (2 bath, 2 face, 1 mat)',
      ru: 'Полотенца (2 банных, 2 для лица, 1 коврик)',
    },
    required: true,
  },
  {
    code: 'amenities',
    label: { vi: 'Amenity', en: 'Amenities', ru: 'Принадлежности' },
    required: true,
  },
  { code: 'kitchen', label: { vi: 'Bếp', en: 'Kitchen', ru: 'Кухня' }, required: true },
  { code: 'desk', label: { vi: 'Bàn làm việc', en: 'Desk', ru: 'Рабочий стол' }, required: true },
  {
    code: 'wifi',
    label: { vi: 'Wi-Fi ≥ 50 Mbps', en: 'Wi-Fi ≥ 50 Mbps', ru: 'Wi-Fi ≥ 50 Мбит/с' },
    required: true,
  },
  {
    code: 'curtains_windows',
    label: { vi: 'Rèm / cửa sổ', en: 'Curtains / windows', ru: 'Шторы / окна' },
    required: true,
  },
  { code: 'odor', label: { vi: 'Mùi', en: 'Smell', ru: 'Запах' }, required: true },
  {
    code: 'remote_ac_heater',
    label: {
      vi: 'Remote / điều hòa / sưởi',
      en: 'Remote / air conditioning / heater',
      ru: 'Пульт / кондиционер / обогреватель',
    },
    required: true,
  },
  {
    code: 'welcome_card',
    label: {
      vi: 'Thẻ chào + Wi-Fi',
      en: 'Welcome card + Wi-Fi',
      ru: 'Приветственная карточка + Wi-Fi',
    },
    required: true,
  },
  {
    code: PHOTO_CODE,
    label: { vi: 'Ảnh phòng', en: 'Room photos', ru: 'Фото номера' },
    required: false,
    photo: true,
  },
];

export function extraKitItem(n: number): ChecklistItemDef {
  return {
    code: EXTRA_KIT_CODE,
    label: {
      vi: `Bộ đồ dùng thêm đủ × ${n}`,
      en: `Extra guest kit complete × ${n}`,
      ru: `Комплект для доп. гостя × ${n}`,
    },
    required: true,
  };
}

export function localeOf(acceptLanguage: string | string[] | undefined): ChecklistLocale {
  const raw = (Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage) ?? '';
  const first = raw.split(',')[0]?.trim().toLowerCase() ?? '';
  if (first.startsWith('en')) return 'en';
  if (first.startsWith('ru')) return 'ru';
  return 'vi';
}

/** Validates a stored checklist row (defensive: a bad row falls back to the default, never a 500). */
export function parseChecklist(items: unknown): ChecklistItemDef[] | null {
  if (!Array.isArray(items) || items.length === 0) return null;
  const out: ChecklistItemDef[] = [];
  for (const i of items as Array<Record<string, unknown>>) {
    const label = i.label as Record<string, unknown> | undefined;
    if (typeof i.code !== 'string' || !label || typeof label.vi !== 'string') return null;
    out.push({
      code: i.code,
      label: {
        vi: label.vi,
        en: typeof label.en === 'string' ? label.en : label.vi,
        ru: typeof label.ru === 'string' ? label.ru : label.vi,
      },
      required: i.required === true,
      ...(i.photoRequired === true || i.photo === true ? { photo: true } : {}),
    });
  }
  return out;
}
