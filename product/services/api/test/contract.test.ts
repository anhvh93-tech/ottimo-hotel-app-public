/**
 * Contract and test-surface guards (no database needed):
 * - src/generated/openapi-meta.ts matches docs/api/openapi.yaml (contract-first)
 * - the strings CI scans for in the production bundle appear only inside src/test-support (BUG-R1-SEC-08)
 * - every controller handler in src is bound to an OpenAPI operation or explicitly public
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPENAPI_META } from '../src/generated/openapi-meta';
import { ProblemError, statusForCode } from '../src/shared/problem';

const API = join(__dirname, '..');
const SRC = join(API, 'src');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe('OpenAPI-generated metadata', () => {
  it('is up to date with docs/api/openapi.yaml (run pnpm --filter @ottimo/api gen:openapi)', () => {
    expect(() =>
      execFileSync(process.execPath, [join(API, 'scripts', 'gen-openapi-meta.mjs'), '--check'], {
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });

  it('every staff operation declares x-roles', () => {
    const missing = Object.entries(OPENAPI_META.operations)
      .filter(([, op]) => op.roles.length === 0)
      .map(([id]) => id);
    expect(missing).toEqual([]);
  });

  it('Problem codes map to the documented HTTP status; unknown codes are refused', () => {
    expect(statusForCode('ROOM_UNAVAILABLE')).toBe(409);
    expect(statusForCode('PRECONDITION_REQUIRED')).toBe(428);
    expect(new ProblemError('VERSION_CONFLICT').toBody('r1')).toEqual({
      type: '/problems/version-conflict',
      title: 'Version conflict',
      status: 412,
      code: 'VERSION_CONFLICT',
      requestId: 'r1',
    });
    expect(() => new ProblemError('MADE_UP_CODE')).toThrow(/Unknown Problem.code/);
  });
});

describe('test-only surface stays in src/test-support (BUG-R1-SEC-08, infra/ci/check-no-test-surface.sh)', () => {
  it('no "__test__" / "TestSupportModule" outside src/test-support', () => {
    const offenders = files(SRC)
      .filter((f) => !relative(SRC, f).startsWith('test-support'))
      .filter((f) => /__test__|TestSupportModule/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(API, f));
    expect(offenders).toEqual([]);
  });

  it('every @Get/@Post/@Put/@Patch/@Delete handler in src has @Operation or @PublicRoute', () => {
    const bad: string[] = [];
    for (const f of files(SRC).filter(
      (x) => x.endsWith('.controller.ts') || x.endsWith('.module.ts'),
    )) {
      const lines = readFileSync(f, 'utf8').split('\n');
      const classPublic = /@PublicRoute\(\)\s*\n(@UseGuards\([^)]*\)\s*\n)?export class/.test(
        lines.join('\n'),
      );
      lines.forEach((line, i) => {
        if (!/^\s*@(Get|Post|Put|Patch|Delete)\(/.test(line)) return;
        const window = lines.slice(Math.max(0, i - 3), i + 4).join('\n');
        if (!classPublic && !/@Operation\(|@PublicRoute\(/.test(window))
          bad.push(`${relative(API, f)}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });
});
