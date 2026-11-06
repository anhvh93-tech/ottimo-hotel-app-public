/**
 * V5-16 (Round 5, v1.0.5) – units without a database. BE C0313-04 ý 3 / contract 0.3.13 1.20: the `folio_line` audit
 * allowlist keeps the origin keys of every `folio_line.adjusted` – a key missing there is dropped silently
 * (SR-AUD-03) and the BR-438 rule of PR-B2 would read data that is not there while the API tests stay green.
 */
import { describe, expect, it } from 'vitest';
import {
  AUDIT_MAX_ACTIONS,
  LINE_REDUCTION_ACTION,
  ROOM_MONEY_CATEGORIES,
} from '../src/modules/audit/internal/audit-log.controller';
import { auditFieldsOf, pickAuditFields } from '../src/modules/audit/public/audit-fields';
import { isMoneyAuditAction } from '../src/modules/audit/public/money-actions';
import '../src/modules/folio/audit-entities';

describe('V5-16 units', () => {
  it('folio_line allowlist keeps actorRole and the root-line keys, nothing else new', () => {
    expect([...(auditFieldsOf('folio_line') ?? [])]).toEqual(
      expect.arrayContaining([
        'actorRole',
        'postedByActor',
        'sameBusinessDay',
        'rootLineId',
        'rootLineManual',
      ]),
    );
    expect(
      pickAuditFields('folio_line', {
        category: 'fnb',
        amountVnd: 1,
        actorRole: 'front_desk',
        postedByActor: true,
        sameBusinessDay: false,
        rootLineId: '019a0000-0000-7000-8000-000000000001',
        rootLineManual: true,
        description: 'never logged',
      }),
    ).toEqual({
      category: 'fnb',
      amountVnd: 1,
      actorRole: 'front_desk',
      postedByActor: true,
      sameBusinessDay: false,
      rootLineId: '019a0000-0000-7000-8000-000000000001',
      rootLineManual: true,
    });
  });

  it('the filters pin one money action and leave out room money', () => {
    expect(LINE_REDUCTION_ACTION).toBe('folio_line.adjusted');
    expect(isMoneyAuditAction(LINE_REDUCTION_ACTION)).toBe(true);
    expect([...ROOM_MONEY_CATEGORIES].sort()).toEqual([
      'extra_person',
      'room',
      'room_change_difference',
    ]);
    expect(AUDIT_MAX_ACTIONS).toBe(10);
  });
});
