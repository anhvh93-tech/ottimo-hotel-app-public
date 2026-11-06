/**
 * V5-25 (damage_catalog, pulled from R5-B-05 by ORC 06/11; same kind as BUG-R5-003) – defensive read of the BR-512
 * damage table in the two places that read it: the charge catalogue (`getChargeCatalog`, and `addFolioLine`, which
 * looks the charge code up in it) and the damage line labels of every folio body (`getFolio`, the folio returned by
 * each folio write) and of `getBill` (`BillService.catalogNames`).
 *
 * Before: one `null` element made `d.code` throw a TypeError, so every bill, folio and folio line of the property
 * gave a 500 until the next business day (a value in force today cannot be replaced today). The save rule
 * (`damageCatalogIssue`, 422 PARAM_OUT_OF_RANGE, DOM rules-v1.0.5 13.4) now refuses such a value; one that still got
 * into the database another way never stops the desk (DOM 13.2): not a list → no table (damage then goes "outside the
 * table", priced by MGR+ with a photo – BR-512), a broken item → that item is left out, the good ones apply.
 *
 * One warning per value and property (so OPS sees it), without the value itself and without any guest data – only
 * the key, the property, how many items were left out, the first problem (field path + code) and a short fingerprint.
 * The field path never carries the name of an unknown key (SEC FB-R5-SEC-BE-V525-01, `logSafeField`).
 */
import { createHash } from 'node:crypto';
import { Logger } from '@nestjs/common';
import {
  type DamageItem,
  logSafeField,
  readDamageCatalogItems,
} from '../../platform/public/parameter-shapes';

const log = new Logger('ParameterRead');
/** Fingerprints already logged (bounded: a long-running process never grows it without end). */
const logged = new Set<string>();
const LOGGED_MAX = 500;

/** Test hook: forget what was logged. */
export function resetDamageCatalogReadLog(): void {
  logged.clear();
}

/** The usable damage items; `null` / absent (no row, or the key missing) = no table, without a warning. */
export function readDamageCatalog(
  value: unknown,
  where: { propertyId?: string | null } = {},
): DamageItem[] {
  if (value === null || value === undefined) return [];
  const read = readDamageCatalogItems(value);
  if (!read.notAList && read.dropped.length === 0) return read.items;
  let json: string;
  try {
    json = JSON.stringify(value) ?? 'undefined';
  } catch {
    json = 'unserializable';
  }
  const property = where.propertyId ?? '-';
  const fingerprint = createHash('sha256')
    .update(`damage_catalog\u0000${property}\u0000${json}`)
    .digest('hex')
    .slice(0, 16);
  if (!logged.has(fingerprint)) {
    if (logged.size >= LOGGED_MAX) logged.clear();
    logged.add(fingerprint);
    const first = read.dropped[0];
    const firstField = first ? logSafeField(first.field, first.code, first.index) : '-';
    log.warn(
      read.notAList
        ? `parameter damage_catalog is not a list – read as an empty damage table (V5-25) property=${property} fingerprint=${fingerprint}`
        : `parameter damage_catalog: ${read.dropped.length} of ${read.dropped.length + read.items.length} items left out, first ${firstField} ${first?.code} – the other items apply (V5-25) property=${property} fingerprint=${fingerprint}`,
    );
  }
  return read.items;
}
