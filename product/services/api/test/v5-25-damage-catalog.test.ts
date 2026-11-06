/**
 * V5-25 – `damage_catalog` (BR-512), pulled from R5-B-05 by ORC 06/11 (same kind as BUG-R5-003), no database:
 * - the save rule (DOM rules-v1.0.5 13.4, QA T-13-5): [{code, name, priceVnd}], code `^[a-z0-9_]{1,40}$` not repeated,
 *   name 1–100 characters not repeated (case and edge spaces ignored), priceVnd whole 1.000–20.000.000, ≤ 100 items,
 *   unknown key → NOT_ALLOWED, `[]` accepted; 422 PARAM_OUT_OF_RANGE with the #96 field paths and extras;
 * - every value the team ships passes (production-defaults.ts, DS-E BR-512 rows – plan V5-25 AC2, QA T-13-6);
 * - the defensive read (DOM 13.2): never throws, a broken item is left out, the good ones apply, one warning per
 *   value and property without the value itself.
 */
import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRODUCTION_PARAMETERS } from '../src/admin/production-defaults';
import {
  readDamageCatalog,
  resetDamageCatalogReadLog,
} from '../src/modules/folio/internal/damage-catalog-read';
import { checkStructuredParameter } from '../src/modules/platform/internal/parameter-rules';
import {
  DAMAGE_CATALOG_MAX,
  readDamageCatalogItems,
} from '../src/modules/platform/public/parameter-shapes';
import { ProblemError } from '../src/shared/problem';
import { DAMAGE_DEFAULT, damageItems } from './helpers/parameter-shape-cases';
import { DS_E } from './helpers/reservations-fixture';

/** The 422 of a refused save (or null when accepted). */
async function save(value: unknown): Promise<ProblemError | null> {
  try {
    await checkStructuredParameter('damage_catalog', value, async (k) => {
      throw new Error(`damage_catalog needs no other key (${k})`);
    });
    return null;
  } catch (e) {
    if (e instanceof ProblemError) return e;
    throw e;
  }
}
const GLASS = DAMAGE_DEFAULT[1]!;
/** The DS-E table as `db/seed/ds-e.ts` builds it (feeCatalog rows of BR-512). */
const DSE_DAMAGE = (
  DS_E as unknown as {
    feeCatalog: Array<{ code: string; name: string; priceVnd: number; br: string }>;
  }
).feeCatalog
  .filter((f) => f.br === 'BR-512')
  .map((f) => ({ code: f.code, name: f.name, priceVnd: f.priceVnd }));

describe('damage_catalog – save rule (DOM rules-v1.0.5 13.4, QA T-13-5)', () => {
  it('T-13-6: the production default and the DS-E table are accepted (and are the same 3 items)', async () => {
    const prod = PRODUCTION_PARAMETERS.find((p) => p.key === 'damage_catalog')?.value;
    expect(prod).toEqual(DAMAGE_DEFAULT);
    expect(DSE_DAMAGE).toEqual(DAMAGE_DEFAULT);
    expect(await save(prod)).toBeNull();
    expect(await save(DSE_DAMAGE)).toBeNull();
  });

  it('T-13-5: [] (no table yet, ESC-008), 20.000.000, 1.000 and 100 items are accepted', async () => {
    expect(await save([])).toBeNull();
    expect(await save([{ ...GLASS, priceVnd: 20_000_000 }])).toBeNull();
    expect(await save([{ ...GLASS, priceVnd: 1_000 }])).toBeNull();
    expect(await save(damageItems(DAMAGE_CATALOG_MAX))).toBeNull();
    // Bilingual name (brand: English first) within 100 characters.
    expect(await save([{ ...GLASS, name: 'Glass / Ly thủy tinh' }])).toBeNull();
  });

  it.each([
    ['priceVnd 0', [{ ...GLASS, priceVnd: 0 }], 'value[0].priceVnd', 'VALUE_OUT_OF_RANGE'],
    [
      'priceVnd 20.001.000',
      [{ ...GLASS, priceVnd: 20_001_000 }],
      'value[0].priceVnd',
      'VALUE_OUT_OF_RANGE',
    ],
    [
      'priceVnd negative',
      [{ ...GLASS, priceVnd: -50_000 }],
      'value[0].priceVnd',
      'VALUE_OUT_OF_RANGE',
    ],
    [
      'priceVnd fraction',
      [{ ...GLASS, priceVnd: 50_000.5 }],
      'value[0].priceVnd',
      'VALIDATION_FAILED',
    ],
    ['priceVnd text', [{ ...GLASS, priceVnd: '50000' }], 'value[0].priceVnd', 'VALIDATION_FAILED'],
  ])('T-13-5 %s → 422 with min 1.000 / max 20.000.000', async (_l, value, field, code) => {
    const e = await save(value);
    expect(e?.code).toBe('PARAM_OUT_OF_RANGE');
    expect(e?.options.errors).toEqual([{ field, code }]);
    expect(e?.options.extras).toEqual({ min: 1_000, max: 20_000_000 });
  });

  it.each([
    ['101 items', damageItems(DAMAGE_CATALOG_MAX + 1), 'value', 'VALUE_OUT_OF_RANGE'],
    ['an object, not a list', GLASS, 'value', 'VALIDATION_FAILED'],
    ['null', null, 'value', 'REQUIRED'],
    ['a null item (the v1.0.4 500)', [GLASS, null], 'value[1]', 'REQUIRED'],
    ['an item that is a list', [[GLASS]], 'value[0]', 'VALIDATION_FAILED'],
    ['unknown key', [{ ...GLASS, unit: 'cái' }], 'value[0].unit', 'NOT_ALLOWED'],
    ['no priceVnd', [{ code: 'glass', name: 'Ly' }], 'value[0].priceVnd', 'REQUIRED'],
    ['empty code', [{ ...GLASS, code: '' }], 'value[0].code', 'REQUIRED'],
    ['code upper case', [{ ...GLASS, code: 'Glass' }], 'value[0].code', 'VALIDATION_FAILED'],
    ['code with a dot', [{ ...GLASS, code: 'damage.glass' }], 'value[0].code', 'VALIDATION_FAILED'],
    [
      'code of 41 characters',
      [{ ...GLASS, code: 'g'.repeat(41) }],
      'value[0].code',
      'VALIDATION_FAILED',
    ],
    ['code a number', [{ ...GLASS, code: 7 }], 'value[0].code', 'VALIDATION_FAILED'],
    ['name only spaces', [{ ...GLASS, name: '  \t ' }], 'value[0].name', 'REQUIRED'],
    ['name a number', [{ ...GLASS, name: 12 }], 'value[0].name', 'VALIDATION_FAILED'],
    ['name of 101 characters', [{ ...GLASS, name: 'L'.repeat(101) }], 'value[0].name', 'TOO_LONG'],
    ['code repeated', [GLASS, { ...GLASS, name: 'Ly lớn' }], 'value[1].code', 'DUPLICATE'],
    [
      'names "Ly" and " ly " (case and edge spaces ignored)',
      [GLASS, { code: 'glass_2', name: ' ly ', priceVnd: 60_000 }],
      'value[1].name',
      'DUPLICATE',
    ],
  ])('T-13-5 %s → 422 PARAM_OUT_OF_RANGE', async (_l, value, field, code) => {
    const e = await save(value);
    expect(e?.code).toBe('PARAM_OUT_OF_RANGE');
    expect(e?.options.errors).toEqual([{ field, code }]);
  });

  it('a 100-character name counts characters, not UTF-16 units (Vietnamese and emoji-free text)', async () => {
    expect(await save([{ ...GLASS, name: 'ắ'.repeat(100) }])).toBeNull();
    expect((await save([{ ...GLASS, name: 'ắ'.repeat(101) }]))?.options.errors).toEqual([
      { field: 'value[0].name', code: 'TOO_LONG' },
    ]);
  });
});

describe('damage_catalog – defensive read (DOM 13.2)', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    resetDamageCatalogReadLog();
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => warn.mockRestore());

  it('never throws, whatever is stored', () => {
    for (const v of [
      2,
      'x',
      true,
      {},
      { code: 'glass' },
      [null],
      [1, 'a', [], {}],
      [{ code: null }],
    ]) {
      expect(() => readDamageCatalog(v, { propertyId: 'p-1' }), JSON.stringify(v)).not.toThrow();
    }
  });

  it('a null item and broken items are left out, the good ones apply; one warning without the value', () => {
    const stored = [
      null,
      DAMAGE_DEFAULT[0],
      { ...GLASS, priceVnd: -1 },
      42,
      { ...DAMAGE_DEFAULT[0], name: 'Khăn tắm lớn' }, // code repeated → the first one wins
      { code: 'remote_2', name: 'remote', priceVnd: 1_000 },
      DAMAGE_DEFAULT[2], // name "Remote" repeated (case ignored) → the earlier "remote" wins
    ];
    expect(readDamageCatalog(stored, { propertyId: 'p-1' })).toEqual([
      DAMAGE_DEFAULT[0],
      { code: 'remote_2', name: 'remote', priceVnd: 1_000 },
    ]);
    expect(readDamageCatalogItems(stored).dropped.map((d) => [d.index, d.field, d.code])).toEqual([
      [0, 'value[0]', 'REQUIRED'],
      [2, 'value[2].priceVnd', 'VALUE_OUT_OF_RANGE'],
      [3, 'value[3]', 'VALIDATION_FAILED'],
      [4, 'value[4].code', 'DUPLICATE'],
      [6, 'value[6].name', 'DUPLICATE'],
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0]?.[0]);
    expect(line).toMatch(/damage_catalog: 5 of 7 items left out, first value\[0\] REQUIRED/);
    expect(line).toContain('property=p-1');
    // Never the stored value (codes, names, prices).
    expect(line).not.toMatch(/bath_towel|Khăn|remote|Remote|150000|glass/);
    // Same value and property → no new line; another property → its own line.
    readDamageCatalog(stored, { propertyId: 'p-1' });
    expect(warn).toHaveBeenCalledTimes(1);
    readDamageCatalog(stored, { propertyId: 'p-2' });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('not a list → no table, one warning', () => {
    expect(readDamageCatalog({ code: 'glass', name: 'Ly', priceVnd: 50_000 })).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/damage_catalog is not a list/);
    expect(String(warn.mock.calls[0]?.[0])).not.toMatch(/glass|Ly|50000/);
  });

  it('no row (null) or a good table → as it is, without a warning', () => {
    expect(readDamageCatalog(null)).toEqual([]);
    expect(readDamageCatalog(undefined)).toEqual([]);
    expect(readDamageCatalog([])).toEqual([]);
    expect(readDamageCatalog(DAMAGE_DEFAULT)).toEqual(DAMAGE_DEFAULT);
    // More than 100 good items: the cap is a save rule only, the read keeps them.
    expect(readDamageCatalog(damageItems(120))).toHaveLength(120);
    expect(warn).not.toHaveBeenCalled();
  });

  it('only {code, name, priceVnd} is returned', () => {
    expect(readDamageCatalog([{ ...GLASS }])[0]).toStrictEqual({
      code: 'glass',
      name: 'Ly',
      priceVnd: 50_000,
    });
  });

  it('SEC FB-R5-SEC-BE-V525-01: an unknown key with a line break and a marker → "<unknown key>", no text of the value', () => {
    const forged = 'x\nERROR fake log line ZZMARK-DMG';
    expect(
      readDamageCatalog([DAMAGE_DEFAULT[0], { ...GLASS, [forged]: 1 }], { propertyId: 'p-1' }),
    ).toEqual([DAMAGE_DEFAULT[0]]);
    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0]?.[0]);
    expect(line).toContain('1 of 2 items left out, first value[1].<unknown key> NOT_ALLOWED');
    expect(line).not.toContain('ZZMARK');
    expect(line).not.toContain('\n');
    expect(line).not.toMatch(/[{}"]|glass|Ly/);
  });
});
