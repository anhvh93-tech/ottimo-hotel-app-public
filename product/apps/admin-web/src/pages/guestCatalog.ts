/** Guest tags / service notes (BA EP00 11.2 `[GIẢ ĐỊNH BA]`, DOM to confirm – E00-06). Labels are UXD keys. */
export const GUEST_TAGS = [
  { value: 'return_guest', label: 'crm.tag_return' },
  { value: 'corporate', label: 'crm.tag_corp' },
] as const;

/** D12a: fixed list, nothing health related, no free text. */
export const SERVICE_NOTES = [
  { value: 'high_floor', label: 'crm.svc_high_floor' },
  { value: 'quiet', label: 'crm.svc_quiet' },
  { value: 'extra_pillow', label: 'crm.svc_extra_pillow' },
] as const;

export const NATIONALITIES = [
  'VN',
  'KR',
  'RU',
  'CN',
  'JP',
  'US',
  'GB',
  'FR',
  'DE',
  'AU',
  'SG',
  'TH',
];

/** Endonyms – language names are shown in their own language. */
export const GUEST_LOCALES = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
] as const;

export function countryName(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale === 'vi' ? 'vi' : 'en'], { type: 'region' }).of(code) ?? code
    );
  } catch {
    return code;
  }
}
