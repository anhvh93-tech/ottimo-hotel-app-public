/**
 * Party of a booking – US-022 (spec EP03-05 4.7, EP02 8; OpenAPI 0.3.6 E04-04 / A-38; BR-110, BR-601, BR-604,
 * BR-612, BR-812).
 *
 * - The booker is the reservation column (member id = the booking id, role `booker`, never removable – A-38).
 * - Children: name + birth year are C3 (D09) – encrypted through the crypto port with a DEK of their own,
 *   only the price age band (BR-110) is ever returned; duplicates found by a keyed hash (AC3).
 * - Adding a person mid-stay (`in_house`): `effectiveFrom` required; when the counted persons exceed the
 *   declared ones the response carries `occupancyChange` with the BR-110 fee from that night × remaining nights
 *   (the desk confirms it – BR-414); a confirmed booking whose counts would change goes through
 *   `updateReservation` first (one repricing path).
 * - `Party.version` (reservation.party_version) is the ETag / If-Match of removePartyMember.
 * SAL/CTV (`own_count_only`) never get `members` (D10).
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import { pgCode } from '../../../db/database';
import { problem } from '../../../shared/problem';
import type { LocalDate } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { maskPhone } from '../../guests/public/normalize';
import {
  type BookingContext,
  FD_PLUS,
  Fields,
  type ReservationRow,
  hasAny,
  loadReservation,
  recordChange,
} from '../../reservations/public/stay-port';
import { StaySupport, TASK_RANK } from './stay-support';

type Band = 'adult' | 'child_6_11' | 'child_under_6';

interface MemberRow {
  id: string;
  role: 'companion' | 'child';
  guest_id: string | null;
  relationship: string | null;
  price_age_band: Band;
  is_minor_data: boolean;
  effective_from: string | null;
  child_data_key_id: string | null;
  g_code: string | null;
  g_name: string | null;
  g_nationality: string | null;
  g_phone: string | null;
}

interface GuestLite {
  id: string;
  code: string;
  full_name: string;
  nationality_code: string | null;
  phone_e164: string | null;
}

const RELATIONSHIPS = ['spouse', 'partner', 'family', 'friend', 'colleague', 'unknown'] as const;

@Injectable()
export class PartyService {
  constructor(
    @Inject(StaySupport) private readonly s: StaySupport,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private async members(tx: Tx, reservationId: string): Promise<MemberRow[]> {
    const { rows } = await tx.query<MemberRow>(
      `SELECT m.id, m.role, m.guest_id, m.relationship, m.price_age_band, m.is_minor_data,
              m.effective_from::text AS effective_from, m.child_data_key_id,
              g.code AS g_code, g.full_name AS g_name, g.nationality_code AS g_nationality, g.phone_e164 AS g_phone
         FROM reservation_guest m LEFT JOIN guest g ON g.id = m.guest_id
        WHERE m.reservation_id = $1 AND m.removed_at IS NULL
        ORDER BY m.created_at, m.id`,
      [reservationId],
    );
    return rows;
  }

  private async guest(tx: Tx, id: string): Promise<GuestLite | null> {
    const { rows } = await tx.query<GuestLite>(
      `SELECT id, code, full_name, nationality_code, phone_e164 FROM guest
        WHERE id = $1 AND merged_into_id IS NULL AND anonymized_at IS NULL`,
      [id],
    );
    return rows[0] ?? null;
  }

  private summary(g: GuestLite) {
    return {
      id: g.id,
      code: g.code,
      displayName: g.full_name,
      ...(g.nationality_code ? { nationalityCode: g.nationality_code } : {}),
      ...(g.phone_e164 ? { phoneMasked: maskPhone(g.phone_e164) } : {}),
    };
  }

  /** Party JSON for the caller (members only for FD+ – D10, x-scope own_count_only). */
  async dto(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    extra: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    const members = await this.members(tx, row.id);
    const required = row.adults + row.children_6_11 + row.children_under_6;
    const present = 1 + members.length;
    const out: Record<string, unknown> = {
      requiredCount: required,
      presentCount: present,
      missingCount: Math.max(0, required - present),
      version: row.party_version,
      ...extra,
    };
    if (hasAny(ctx.actor.roles, FD_PLUS)) {
      const booker = await this.guest(tx, row.booker_guest_id);
      out.members = [
        {
          id: row.id,
          role: 'booker',
          ...(booker ? { guest: this.summary(booker) } : {}),
          priceAgeBand: 'adult',
          isMinorData: false,
        },
        ...members.map((m) => ({
          id: m.id,
          role: m.role,
          ...(m.guest_id && m.g_code && m.g_name
            ? {
                guest: this.summary({
                  id: m.guest_id,
                  code: m.g_code,
                  full_name: m.g_name,
                  nationality_code: m.g_nationality,
                  phone_e164: m.g_phone,
                }),
              }
            : {}),
          ...(m.relationship ? { relationship: m.relationship } : {}),
          priceAgeBand: m.price_age_band,
          isMinorData: m.is_minor_data,
          ...(m.effective_from ? { effectiveFrom: m.effective_from } : {}),
        })),
      ];
    }
    return out;
  }

  async list(tx: Tx, ctx: BookingContext, id: string) {
    const row = await loadReservation(tx, id, ctx.actor);
    return this.dto(tx, ctx, row);
  }

  /** BR-110 band at the arrival date (age by calendar year – birth date is not collected, BR-612). */
  private async bandOf(
    tx: Tx,
    ctx: BookingContext,
    arrival: LocalDate,
    birthYear: number,
  ): Promise<{ band: Band; minor: boolean }> {
    const adultFrom = await this.s.param<number>(tx, ctx, 'adult_from_age');
    const freeUnder = await this.s.param<number>(tx, ctx, 'child_free_under_age');
    const minorUnder = await this.s.param<number>(tx, ctx, 'minor_data_age_threshold');
    // DOM S3-7: only the birth year is known → the YOUNGEST possible age (birthday not reached yet) – lower
    // fee/capacity for the guest, the safer side of the minor-data threshold (BR-110, BR-612).
    const age = Number(arrival.slice(0, 4)) - birthYear - 1;
    const band: Band =
      age >= adultFrom ? 'adult' : age < freeUnder ? 'child_under_6' : 'child_6_11';
    return { band, minor: age < minorUnder };
  }

  async add(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    body: Record<string, unknown>,
    dryRun: boolean,
  ): Promise<Record<string, unknown>> {
    const f = new Fields(body);
    const role = f.enumOf('role', ['companion', 'child'] as const, true);
    const guestId = f.uuid('guestId', role === 'companion');
    const relationship = f.enumOf('relationship', RELATIONSHIPS, false);
    const childName =
      role === 'child' ? f.text('childName', 100, { required: true, min: 1 }) : undefined;
    const thisYear = Number(ctx.today.slice(0, 4));
    const birthYear =
      role === 'child'
        ? f.int('childBirthYear', { required: true, min: 2000, max: thisYear })
        : undefined;
    if (
      role === 'companion' &&
      (body.childName !== undefined || body.childBirthYear !== undefined)
    ) {
      f.add('childName', 'NOT_ALLOWED');
    }
    if (role === 'child' && guestId) f.add('guestId', 'NOT_ALLOWED');
    const effectiveFrom = f.date('effectiveFrom', false);
    const apply = f.bool('applyExtraPersonSurcharge') ?? false;
    const expected = f.money('expectedSurchargeVnd', { required: false, positive: false });
    const ackReason = f.text('capacityWarningAckReason', 500, { min: 3 });
    f.done();

    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: !dryRun });
    if (!['hold', 'confirmed', 'in_house'].includes(row.status)) throw this.s.stay.invalid(row);
    const inHouse = row.status === 'in_house';
    if (inHouse) {
      if (!effectiveFrom) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'effectiveFrom', code: 'REQUIRED' }],
        });
      }
      // Blocker verification ARC-S3-01: from tonight at the latest – a person announced for a later night is
      // added on that day (a future date would charge nights the guest may never stay).
      if (effectiveFrom !== ctx.today || effectiveFrom >= row.departure_date) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'effectiveFrom', code: 'DATE_INVALID' }],
        });
      }
    }

    // AC3 duplicates (booker included) and BR-110 band of the new person.
    let band: Band = 'adult';
    let minor = false;
    if (role === 'companion') {
      const g = await this.guest(tx, guestId as string);
      if (!g)
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'guestId', code: 'NOT_IN_LIST' }] });
      const dup = await tx.query(
        `SELECT 1 FROM reservation_guest WHERE reservation_id = $1 AND guest_id = $2 AND removed_at IS NULL`,
        [row.id, g.id],
      );
      if (g.id === row.booker_guest_id || dup.rows.length > 0) throw problem('PARTY_DUPLICATE');
    } else {
      const b = await this.bandOf(tx, ctx, row.arrival_date, birthYear as number);
      band = b.band;
      minor = b.minor;
    }

    // Counted persons per band (BR-110): present people may exceed what the booking declared.
    const members = await this.members(tx, row.id);
    const present = { adult: 1, child_6_11: 0, child_under_6: 0 } as Record<Band, number>;
    for (const m of members) present[m.price_age_band] += 1;
    present[band] += 1;
    const declared = {
      adult: row.adults,
      child_6_11: row.children_6_11,
      child_under_6: row.children_under_6,
    } as Record<Band, number>;
    const next = {
      adult: Math.max(declared.adult, present.adult),
      child_6_11: Math.max(declared.child_6_11, present.child_6_11),
      child_under_6: Math.max(declared.child_under_6, present.child_under_6),
    };
    const changed =
      next.adult !== declared.adult ||
      next.child_6_11 !== declared.child_6_11 ||
      next.child_under_6 !== declared.child_under_6;

    let occupancyChange: Record<string, unknown> | undefined;
    let surcharge = 0;
    let nights = 0;
    let extraDelta = 0;
    let roomId: string | null = null;
    if (changed) {
      if (!inHouse) {
        throw problem('INVALID_TRANSITION', {
          extras: { currentState: row.status },
          detail: 'update the guest counts of the booking first (updateReservation)',
        });
      }
      const seg = await this.s.segmentOn(tx, row.id, effectiveFrom as LocalDate);
      const rm = seg.room_id ? await this.s.stay.room(tx, seg.room_id) : null;
      if (!rm) throw problem('RESERVATION_UNASSIGNED');
      roomId = rm.id;
      const counted = next.adult + next.child_6_11;
      if (counted > rm.max_occupancy) {
        if (row.channel_group !== 'ota') {
          throw problem('CAPACITY_EXCEEDED', {
            errors: [{ field: 'role', code: 'CAPACITY_EXCEEDED' }],
            extras: { roomNo: rm.room_no, max: rm.max_occupancy },
          });
        }
        if (!ackReason) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'capacityWarningAckReason', code: 'CAPACITY_EXCEEDED_WARNING' }],
            extras: { roomNo: rm.room_no, max: rm.max_occupancy },
          });
        }
      }
      const oldExtra = Math.max(0, declared.adult + declared.child_6_11 - rm.base_occupancy);
      const newExtra = Math.max(0, counted - rm.base_occupancy);
      extraDelta = newExtra - oldExtra;
      // DOM S3-13 / FB-R2-ARC-BE-S3-01: BR-110 per night from `effectiveFrom` – people present that night in
      // that night's room, the extra persons at the lower band (not "the person just added").
      const party = {
        adults: next.adult,
        children6to11: next.child_6_11,
        childrenUnder6: next.child_under_6,
      };
      const p = await this.s.stay.peopleFromNight(tx, ctx, row, party, effectiveFrom as LocalDate, {
        write: false,
      });
      nights = p.nights;
      surcharge = Math.max(0, p.newVnd - p.oldVnd);
      occupancyChange = {
        adults: next.adult,
        children6to11: next.child_6_11,
        childrenUnder6: next.child_under_6,
        extraCount: newExtra,
        surchargeVnd: surcharge,
        nights,
        surchargeApplied: false,
        extraGuestKitTaskCreated: false,
      };
    }
    if (dryRun) return this.dto(tx, ctx, row, occupancyChange ? { occupancyChange } : {});

    // DOM S3-12 (BR-414): a fee > 0 is never waived by leaving the box unticked – FOC goes through approval.
    if (surcharge > 0 && !apply) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'applyExtraPersonSurcharge', code: 'SURCHARGE_DECISION_REQUIRED' }],
        extras: { surchargeVnd: surcharge },
      });
    }
    if (apply && surcharge > 0) {
      if (expected === undefined) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'expectedSurchargeVnd', code: 'REQUIRED' }],
        });
      }
      if (expected !== surcharge) {
        throw problem('SURCHARGE_CHANGED', { extras: { surchargeVnd: surcharge } });
      }
    }

    // ── writes ──
    const memberId = uuidv7();
    let enc: { nameEnc: Buffer; birthYearEnc: Buffer; nameHmac: string; dataKeyId: string } | null =
      null;
    if (role === 'child') {
      enc = await this.s.ports.childData.encryptChild(tx, {
        reservationId: row.id,
        memberId,
        name: childName as string,
        birthYear: birthYear as number,
      });
    }
    try {
      await tx.query('SAVEPOINT party_member');
      await tx.query(
        `INSERT INTO reservation_guest (id, organization_id, property_id, reservation_id, guest_id, role,
           relationship, child_name_enc, child_birth_year_enc, child_name_hmac, child_data_key_id, is_minor_data,
           price_age_band, effective_from, created_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          memberId,
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          row.id,
          role === 'companion' ? guestId : null,
          role,
          relationship ?? null,
          enc?.nameEnc ?? null,
          enc?.birthYearEnc ?? null,
          enc?.nameHmac ?? null,
          enc?.dataKeyId ?? null,
          minor,
          band,
          inHouse ? effectiveFrom : null,
          ctx.now,
          ctx.actor.userId,
        ],
      );
      await tx.query('RELEASE SAVEPOINT party_member');
    } catch (err) {
      await tx.query('ROLLBACK TO SAVEPOINT party_member');
      if (pgCode(err) === '23505') {
        if (enc) await this.s.ports.childData.destroy(tx, enc.dataKeyId);
        throw problem('PARTY_DUPLICATE');
      }
      throw err;
    }
    await tx.query(
      `UPDATE reservation SET party_version = party_version + 1, updated_at = $2, version = version + 1
        WHERE id = $1`,
      [row.id, ctx.now],
    );
    if (occupancyChange) {
      await tx.query(
        `UPDATE reservation SET adults = $2, children_6_11 = $3, children_under_6 = $4,
                capacity_conflict_at = CASE WHEN $5::text IS NULL THEN capacity_conflict_at ELSE $6::timestamptz END,
                capacity_ack_reason = COALESCE($5, capacity_ack_reason),
                capacity_ack_by = CASE WHEN $5::text IS NULL THEN capacity_ack_by ELSE $7::uuid END
          WHERE id = $1`,
        [
          row.id,
          next.adult,
          next.child_6_11,
          next.child_under_6,
          ackReason ?? null,
          ctx.now,
          ctx.actor.userId,
        ],
      );
      await recordChange(
        tx,
        row.id,
        'persons',
        {
          adults: declared.adult,
          children6to11: declared.child_6_11,
          childrenUnder6: declared.child_under_6,
        },
        { adults: next.adult, children6to11: next.child_6_11, childrenUnder6: next.child_under_6 },
        ctx.now,
        'US-022',
      );
      // Nights from `effectiveFrom` get the new party's fee; the folio posts them one line per night.
      await this.s.stay.peopleFromNight(
        tx,
        ctx,
        row,
        { adults: next.adult, children6to11: next.child_6_11, childrenUnder6: next.child_under_6 },
        effectiveFrom as LocalDate,
        { write: true },
      );
      if (row.folio_id && !row.external_contract) {
        const fresh = await loadReservation(tx, row.id, ctx.actor);
        await this.s.folios.resyncStay(tx, await this.s.stay.confirmedStay(tx, fresh), {
          userId: ctx.actor.userId,
          ...this.s.req(ctx),
        });
        occupancyChange.surchargeApplied = surcharge > 0;
      }
      // Blocker verification ARC-S3-01: the in-house children (B9a / OTA extension) follow the people.
      await this.s.stay.syncChildrenParty(
        tx,
        ctx,
        row,
        { adults: next.adult, children6to11: next.child_6_11, childrenUnder6: next.child_under_6 },
        effectiveFrom as LocalDate,
      );
      if (extraDelta > 0 && roomId) {
        const task = await this.s.createTask(tx, ctx, {
          roomId,
          reservationId: row.id,
          type: 'extra_guest_kit_prepare',
          quantity: extraDelta,
          dueDate: ctx.today,
          dueAt: await this.s.midstayKitDue(tx, ctx),
          rank: TASK_RANK.kitInHouse,
        });
        occupancyChange.extraGuestKitTaskCreated = task !== null;
      }
    }
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.party_member_added',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      after: {
        partyRole: role,
        priceAgeBand: band,
        ...(occupancyChange
          ? {
              adults: next.adult,
              children6to11: next.child_6_11,
              childrenUnder6: next.child_under_6,
            }
          : {}),
        ...(surcharge > 0 ? { extraPersonFeeVnd: apply ? surcharge : 0 } : {}),
      },
      ...(ackReason ? { reason: ackReason } : {}),
      ...this.s.req(ctx),
    });
    await this.s.ports.registration.onPartyChanged(tx, row.id);
    await this.s.events.publish(tx, 'reservation.changed', row.id);
    await this.s.events.publish(tx, 'registration.changed', row.id);
    const fresh = await loadReservation(tx, row.id, ctx.actor);
    return this.dto(tx, ctx, fresh, occupancyChange ? { occupancyChange } : {});
  }

  async remove(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    memberId: string,
    expectedVersion: number,
  ): Promise<void> {
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    if (row.party_version !== expectedVersion) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: row.party_version } });
    }
    if (memberId === row.id) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'the booker cannot be removed',
      });
    }
    if (!['hold', 'confirmed', 'in_house'].includes(row.status)) throw this.s.stay.invalid(row);
    const { rows } = await tx.query<{
      id: string;
      role: string;
      child_data_key_id: string | null;
      price_age_band: Band;
    }>(
      `SELECT id, role, child_data_key_id, price_age_band FROM reservation_guest
        WHERE id = $1 AND reservation_id = $2 AND removed_at IS NULL FOR UPDATE`,
      [memberId, row.id],
    );
    const m = rows[0];
    if (!m) throw problem('NOT_FOUND');
    // ARC-BE-S3-24.6 / DOM S3-13: an in-house person who leaves no longer counts from tonight – the declared
    // band goes down when it was counting this person, and the BR-110 fee of the nights from today follows
    // (in the guest's favour, so no decision is needed). Nights already stayed keep their fee.
    const members = await this.members(tx, row.id);
    const presentAfter = { adult: 1, child_6_11: 0, child_under_6: 0 } as Record<Band, number>;
    for (const x of members) if (x.id !== m.id) presentAfter[x.price_age_band] += 1;
    const declared = {
      adult: row.adults,
      child_6_11: row.children_6_11,
      child_under_6: row.children_under_6,
    } as Record<Band, number>;
    const leaves =
      row.status === 'in_house' && declared[m.price_age_band] > presentAfter[m.price_age_band];
    if (leaves) {
      const next = { ...declared, [m.price_age_band]: declared[m.price_age_band] - 1 } as Record<
        Band,
        number
      >;
      await tx.query(
        `UPDATE reservation SET adults = $2, children_6_11 = $3, children_under_6 = $4 WHERE id = $1`,
        [row.id, next.adult, next.child_6_11, next.child_under_6],
      );
      await recordChange(
        tx,
        row.id,
        'persons',
        {
          adults: declared.adult,
          children6to11: declared.child_6_11,
          childrenUnder6: declared.child_under_6,
        },
        { adults: next.adult, children6to11: next.child_6_11, childrenUnder6: next.child_under_6 },
        ctx.now,
        'US-022 member left',
      );
      await this.s.stay.peopleFromNight(
        tx,
        ctx,
        row,
        { adults: next.adult, children6to11: next.child_6_11, childrenUnder6: next.child_under_6 },
        ctx.today,
        { write: true },
      );
    }
    // SEC-BE-41: the keyed hash of a child's name|year is C3 – erased together with the DEK.
    await tx.query(
      `UPDATE reservation_guest SET removed_at = $2, removed_by = $3, child_name_hmac = NULL WHERE id = $1`,
      [m.id, ctx.now, ctx.actor.userId],
    );
    // A-38 / T03: C3 of the removed person destroyed in the same transaction (DEK + documents).
    if (m.child_data_key_id) await this.s.ports.childData.destroy(tx, m.child_data_key_id);
    await this.s.ports.registration.onPartyMemberRemoved(tx, row.id, m.id);
    await tx.query(
      `UPDATE reservation SET party_version = party_version + 1, updated_at = $2, version = version + 1
        WHERE id = $1`,
      [row.id, ctx.now],
    );
    if (leaves && row.folio_id && !row.external_contract) {
      const fresh = await loadReservation(tx, row.id, ctx.actor);
      await this.s.folios.resyncStay(tx, await this.s.stay.confirmedStay(tx, fresh), {
        userId: ctx.actor.userId,
        ...this.s.req(ctx),
      });
    }
    if (leaves) {
      const fresh = await loadReservation(tx, row.id, ctx.actor);
      await this.s.stay.syncChildrenParty(
        tx,
        ctx,
        fresh,
        {
          adults: fresh.adults,
          children6to11: fresh.children_6_11,
          childrenUnder6: fresh.children_under_6,
        },
        ctx.today,
      );
    }
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.party_member_removed',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      after: { partyRole: m.role },
      ...this.s.req(ctx),
    });
    await this.s.events.publish(tx, 'reservation.changed', row.id);
    await this.s.events.publish(tx, 'registration.changed', row.id);
  }
}
