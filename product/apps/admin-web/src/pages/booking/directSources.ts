import type { DirectSource } from '@ottimo/api-client';

/** The "Nguồn" options of a direct booking (H09 and H10 share them – BUG-R3-019). */
export const DIRECT_SOURCES: Array<{ value: DirectSource; key: string }> = [
  { value: 'zalo_phone', key: 'bk.src_zalo' },
  { value: 'website', key: 'bk.src_web' },
  { value: 'walk_in', key: 'bk.src_walkin' },
  { value: 'returning', key: 'bk.src_return' },
  { value: 'sales_staff', key: 'bk.src_sales' },
];

/**
 * H10 (manual long stay) has no closer field and creates no commission (`lsm.not_generated`), while the server
 * requires a closer for `sales_staff` (BR-903) – so that source is left out there.
 */
export const LONG_STAY_SOURCES = DIRECT_SOURCES.filter((s) => s.value !== 'sales_staff');
