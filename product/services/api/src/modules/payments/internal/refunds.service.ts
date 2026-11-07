/**
 * Refunds: request → destination → approval → pay-out (EP03-05 mục 2.6; BR-522 v0.3.3; SM-10, SM-12;
 * rbac A43, A47, A47a; SEC F8 [CHẶN]; OpenAPI 0.3.6 A-33/A-41/A-42; PO decision Q-S3-1 16/10).
 *
 * - createRefundRequest (FD+, A43): manual request from a folio with credit (overpayment mid-stay); amount ≤
 *   credit − requests still open (pending/escalated/approved not fully paid) of the folio.
 * - setRefundDestination (FD+, trusted device, A43): cash / bank_transfer / original_method; the account number
 *   is C3 (D15): Luhn → CARD_NUMBER_DETECTED, encrypted with its own DEK (CryptoService port), only the last 4
 *   digits stay readable; c3_access_log create/update. Changing it after approval → back to `pending` (F8).
 * - getRefundDestination (OWN/MGR, trusted device + step-up, A47): full number, c3_access_log `view` written
 *   BEFORE the data is returned (BE-C C3AccessGate: SR-RL-06 limit, 503 when the log cannot be written).
 * - executeCashRefund (FD+, A47a): destination `cash`; the payer is never the requester (403
 *   SELF_REFUND_FORBIDDEN, CHECK payment_refund_not_requester_check); signed receipt image mandatory.
 * - executeRefund (OWN/MGR, A47): destination bank_transfer / original_method; bank reference + proof image for a
 *   transfer; fully paid → the account DEK is destroyed in the same transaction (T09).
 * Both pay-outs: approved request, amount ≤ approved − paid AND ≤ received − refunded of the folio (server),
 * negative `refund` payment pointing at the request, money audit, `payment.changed` + `reservation.changed`.
 * Lock order (ARC 16.19, BUG-R2-198): the folio of the refund (L3) → approval_request (L4) – `lock()` takes the folio
 * first, and the decision paths do the same through the preLock (`lockFolioOf`).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import type { StaffPrincipal } from '../../../shared/http/auth.guard';
import { problem } from '../../../shared/problem';
import { toZonedIso } from '../../../shared/time';
import {
  assertNoCardNumber,
  assertNotCardNumberReference,
  luhnValid,
  optionalText,
  requireReason,
  stripControlChars,
} from '../../../shared/validation';
import { AuditService } from '../../audit/public/audit.service';
import { type ApprovalRow, ApprovalService } from '../../approvals/public/approval.service';
import { C3AccessGate } from '../../crypto/public/c3-access-gate';
import { EventsService } from '../../events/public/events.service';
import { FolioService, type PaymentRowLite } from '../../folio/public/folio.service';
import { folioLocked } from '../../folio/public/folio-locked';
import type { RefundDestinationCarry } from '../../folio/public/refund-routing';
import { DocNumberService } from '../../platform/public/doc-number.service';
import { notifyStaff, publishEvent } from '../../platform/public/staff-notify';
import {
  ATTACHMENT_USAGE,
  type AttachmentUsage,
  anchorPaymentAttachment,
} from '../public/attachment-usage';
import {
  MANAGER_ROLES,
  type PaymentActor,
  PaymentService,
  parseInstant,
  primaryRole,
} from '../public/payment.service';
import {
  REFUND_ACCOUNT_CIPHER,
  type RefundAccountCipher,
  refundAccountAad,
} from '../public/refund-account-cipher';

export interface RefundRow extends ApprovalRow {
  refund_method: 'cash' | 'bank_transfer' | 'original_method' | null;
  refund_bank_bin: string | null;
  refund_account_last4: string | null;
  refund_account_enc: Buffer | null;
  refund_account_key_id: string | null;
  refund_destination_set_at: Date | null;
  refund_destination_set_by: string | null;
  refunded_vnd: number;
}

export interface DestinationInput {
  method: 'cash' | 'bank_transfer' | 'original_method';
  bankBin?: string | undefined;
  accountNo?: string | undefined;
  accountHolder?: string | undefined;
}

export interface PayoutInput {
  amountVnd: number;
  paidAt: string;
  attachmentId: string | null;
  bankReference: string | null;
  note: unknown;
}

const OPEN_STATES = ['pending', 'escalated', 'approved'];

/** 0.3.13 bổ sung 1 (5B-1): reason code of the refund made with a receipt on a closed booking ("Tiền về sau khi hủy"). */
export const PAYMENT_AFTER_CANCEL = 'payment_after_cancel';

/**
 * 5B-1 (SEC S3, DOM 11.4 mục 3): a destination the SERVER fixed – `original_method` with nobody as its setter (every
 * person-set destination carries `refund_destination_set_by`; a `superseded` replacement copies the setter, so it stays
 * fixed too). Never changed (`setRefundDestination` → 409), never paid in cash, paid back to a transfer receipt only.
 */
export function serverFixedDestination(
  row: Pick<RefundRow, 'reason_code' | 'refund_method' | 'refund_destination_set_by'>,
): boolean {
  return (
    row.reason_code === PAYMENT_AFTER_CANCEL ||
    (row.refund_method === 'original_method' && !row.refund_destination_set_by)
  );
}

/** P4-12: the holder as compared (never stored or logged): trim, spaces collapsed, NFC, any case. */
function holderKey(holder: string): string {
  return holder.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}
/**
 * FB-R4-ARC-BE-D-P412-01 (SEC BED-03 point 2): the decrypted destination as JSON. A SyntaxError from V8 quotes the
 * input, and `redactText` (ProblemFilter's `unhandled error` line) masks no bank account or holder – so the error is
 * replaced by one that carries nothing read, and both fields must be strings. Throws → the caller's transaction is
 * rolled back (500).
 */
export function parseRefundAccount(plain: string): { accountNo: string; accountHolder: string } {
  let value: unknown;
  try {
    value = JSON.parse(plain);
  } catch {
    throw new Error('refund account unreadable');
  }
  if (
    typeof value !== 'object' ||
    value === null ||
    typeof (value as { accountNo?: unknown }).accountNo !== 'string' ||
    typeof (value as { accountHolder?: unknown }).accountHolder !== 'string'
  ) {
    throw new Error('refund account unreadable');
  }
  const { accountNo, accountHolder } = value as { accountNo: string; accountHolder: string };
  return { accountNo, accountHolder };
}

@Injectable()
export class RefundsService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(PaymentService) private readonly payments: PaymentService,
    @Inject(DocNumberService) private readonly docNumbers: DocNumberService,
    @Inject(ATTACHMENT_USAGE) private readonly attachments: AttachmentUsage,
    @Inject(REFUND_ACCOUNT_CIPHER) private readonly cipher: RefundAccountCipher,
    @Inject(C3AccessGate) private readonly gate: C3AccessGate,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /** SM-10 hook (registered by PaymentsModule): an approved refund → `refund_ready` to its requester (A-36). */
  async onDecided(tx: Tx, row: ApprovalRow): Promise<void> {
    if (row.status === 'rejected' || row.status === 'cancelled') {
      // SEC-BE-45 / T09: a refund that will never be paid keeps no account – DEK destroyed, envelope dropped.
      const r = row as RefundRow;
      if (r.refund_account_key_id && r.refund_account_enc) {
        await this.cipher.destroy(tx, r.refund_account_key_id);
        await tx.query(
          `UPDATE approval_request SET refund_account_enc = NULL, updated_at = $2 WHERE id = $1`,
          [r.id, this.clock.now()],
        );
        await this.audit.recordC3Access(tx, {
          subjectType: 'refund_account',
          subjectId: r.id,
          action: 'purge',
          ...(r.target_id ? { reservationId: r.target_id } : {}),
        });
      }
      return;
    }
    if (row.status !== 'approved') return;
    // S4-42 (BR-522 (a)): a cash refund is paid by ANOTHER desk member than its requester (SELF_REFUND_FORBIDDEN)
    // → the front desk (FD/FDL) hears it too while the destination is cash or not chosen yet. [GIẢ ĐỊNH BE-B]
    // R2 has no shift table yet: every active FD/FDL of the property stands for "trong ca". Transfers stay with
    // the requester (paid by MGR/OWN only).
    const method = (row as RefundRow).refund_method;
    const desk = !method || method === 'cash';
    await notifyStaff(
      tx,
      this.events,
      {
        kind: 'refund_ready',
        userIds: [row.requested_by],
        ...(desk ? { roles: ['front_desk', 'front_desk_lead'] } : {}),
        refType: 'approval_request',
        refId: row.id,
        ...(row.target_code ? { refCode: row.target_code } : {}),
      },
      this.clock.now(),
    );
  }

  // ───────────── destination carried to a replacement (P4-12) ─────────────

  /** Wired with the refund decision hooks (api + worker): FolioService asks this service when it replaces requests. */
  provideDestinationCarrier(): void {
    this.folios.provideRefundDestinationCarrier({
      peek: (tx, fromIds, targetReservationId) =>
        this.peekCarryableDestination(tx, fromIds, targetReservationId),
    });
  }

  /**
   * P4-12 (FB-R4-DOM-BA-025-02; ARC plan v1.0.4 6.3; SEC-on-plan-v1.0.4 1.2) – called by FolioService BEFORE the
   * requests `fromIds` are closed `superseded` (their `cancelled` hook destroys the DEK – SEC-BE-45). The ONE
   * destination they share, read through the cipher (never `getDestination`: no `view` in c3_access_log, no C3 quota),
   * kept in this closure only. Carried only when every request of `fromIds` that has a destination:
   * - targets the replacement's booking (`targetReservationId`);
   * - has the same method, bank BIN, account number and holder (trim, spaces collapsed, NFC, any case);
   * - was entered by the same person (`refund_destination_set_by` is the maker-checker of CHECK 0031/0042 – copied, so
   *   whoever entered the account still never approves a pay-out to it).
   * Requests without a destination are ignored. Otherwise null: the desk enters it again (as before). A destination
   * that cannot be read (no envelope) is never carried. Nothing compared is logged.
   */
  async peekCarryableDestination(
    tx: Tx,
    fromIds: readonly string[],
    targetReservationId: string,
  ): Promise<RefundDestinationCarry | null> {
    if (fromIds.length === 0) return null;
    const { rows } = await tx.query<RefundRow>(
      `SELECT * FROM approval_request
        WHERE id = ANY($1::uuid[]) AND type = 'refund' AND refund_method IS NOT NULL
        ORDER BY refund_destination_set_at, requested_at, id`,
      [[...fromIds]],
    );
    if (rows.length === 0) return null;
    const first = rows[0]!;
    const setBy = first.refund_destination_set_by;
    const method = first.refund_method!;
    const bankBin = first.refund_bank_bin;
    // Pass 1 (FB-R4-ARC-BE-D-P412-03, SEC BED-03 point 1): every field that is not encrypted, on every row – nothing
    // is decrypted when the destination cannot be carried anyway.
    for (const r of rows) {
      if (r.target_type !== 'reservation' || r.target_id !== targetReservationId) return null;
      if (r.refund_method !== method || r.refund_destination_set_by !== setBy) return null;
      if ((r.refund_bank_bin ?? '') !== (bankBin ?? '')) return null;
      if (method === 'bank_transfer' && (!r.refund_account_enc || !r.refund_account_key_id)) {
        return null;
      }
    }
    // Pass 2: the account number and holder, only for a bank transfer that passed pass 1.
    let account: { accountNo: string; accountHolder: string } | null = null;
    if (method === 'bank_transfer') {
      let key: string | null = null;
      for (const r of rows) {
        // A failure here throws: the caller's whole transaction is rolled back (SEC 1.2 point 1).
        const a = parseRefundAccount(
          await this.cipher.decrypt(tx, {
            dekId: r.refund_account_key_id!,
            ciphertext: r.refund_account_enc!,
            aad: refundAccountAad(r.id),
          }),
        );
        const k = JSON.stringify([a.accountNo, holderKey(a.accountHolder)]);
        if (key === null) {
          key = k;
          account = a;
        } else if (k !== key) {
          return null;
        }
      }
    }
    const dest = { method, bankBin, account };
    const setAt = rows[0]!.refund_destination_set_at;
    const sourceIds = rows.map((r) => r.id);
    return {
      apply: (tx2, toApprovalId, requestId) =>
        this.applyCarriedDestination(tx2, {
          sourceIds,
          toApprovalId,
          targetReservationId,
          dest,
          setAt,
          setBy,
          ...(requestId ? { requestId } : {}),
        }),
    };
  }

  /** P4-12 – the second step: the replacement gets the destination, sealed under a NEW DEK bound to its own id. */
  private async applyCarriedDestination(
    tx: Tx,
    input: {
      sourceIds: string[];
      toApprovalId: string;
      targetReservationId: string;
      dest: {
        method: 'cash' | 'bank_transfer' | 'original_method';
        bankBin: string | null;
        account: { accountNo: string; accountHolder: string } | null;
      };
      setAt: Date | null;
      setBy: string | null;
      requestId?: string;
    },
  ): Promise<void> {
    // Every source must really be closed before its destination is copied. (An APPROVED request that
    // refundsDownToCredit keeps may share the account with the replacement: accepted – same guest, same booking,
    // Σ ≤ credit, each request has its own maker-checker – SEC-on-v104-be-d 1.3, BED-06.)
    const { rows: open } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM approval_request WHERE id = ANY($1::uuid[]) AND status <> 'cancelled'`,
      [input.sourceIds],
    );
    if ((open[0]?.n ?? 0) > 0) return;
    const { rows } = await tx.query<RefundRow>(
      `SELECT * FROM approval_request WHERE id = $1 AND type = 'refund' FOR UPDATE`,
      [input.toApprovalId],
    );
    const to = rows[0];
    if (
      !to ||
      to.refund_method ||
      (to.status !== 'pending' && to.status !== 'escalated') ||
      to.target_type !== 'reservation' ||
      to.target_id !== input.targetReservationId
    ) {
      return;
    }
    let enc: Buffer | null = null;
    let keyId: string | null = null;
    const account = input.dest.account;
    if (account) {
      const sealed = await this.cipher.encrypt(
        tx,
        { purpose: 'refund_account', subjectId: to.id, aad: refundAccountAad(to.id) },
        JSON.stringify({ accountNo: account.accountNo, accountHolder: account.accountHolder }),
      );
      enc = sealed.ciphertext;
      keyId = sealed.dekId;
    }
    // Created in this transaction: the version stays the one the replacement was made with.
    await tx.query(
      `UPDATE approval_request SET refund_method = $2, refund_bank_bin = $3, refund_account_last4 = $4,
          refund_account_enc = $5, refund_account_key_id = $6, refund_destination_set_at = $7,
          refund_destination_set_by = $8, updated_at = $9
        WHERE id = $1`,
      [
        to.id,
        input.dest.method,
        input.dest.bankBin,
        account ? account.accountNo.slice(-4) : null,
        enc,
        keyId,
        input.setAt,
        input.setBy,
        this.clock.now(),
      ],
    );
    await this.audit.recordC3Access(tx, {
      subjectType: 'refund_account',
      subjectId: to.id,
      action: 'create',
      reservationId: input.targetReservationId,
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
    // Request ids only – never the bank, the last 4 digits or the holder (SEC 1.2 point 5).
    await this.audit.recordMoney(tx, {
      action: 'refund.destination_carried',
      entityType: 'approval_request',
      entityId: to.id,
      ...(to.target_code ? { entityCode: to.target_code } : {}),
      after: { fromApprovalIds: input.sourceIds, toApprovalId: to.id },
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
  }

  // ───────────── 5B-1: refund made with a receipt on a closed booking ─────────────

  /**
   * 0.3.13 bổ sung 1 (5B-1 – `recordPayment` (B); SEC S2, S3; DOM 11.4 mục 3; FB-R5-ARC-BE-105-03 step 6), in the
   * receipt's transaction (L1 booking → L3 folio held by recordInTx): ONE `refund` request of `amountVnd` (what the
   * receipt brought above N), reason `payment_after_cancel`, no fee (BR-308); the BR-309 request of the booking is
   * left as it is.
   * - S2: requested by the RECORDER, who is also put in `origin_actor_ids` – they never approve (CHECK
   *   approval_request_origin_check) and never pay it out, even when it is rejected and someone else asks again
   *   (FolioService.refundRouting adds every after-closure recorder of the folio to each new refund of it).
   * - S3: destination fixed now to `original_method` with no setter (`serverFixedDestination`): back to the account the
   *   money came from – `setRefundDestination` → 409, `executeCashRefund` → 409, `executeRefund` pays a transfer
   *   receipt's method only, and only once that receipt is reconciled (REFUND_SOURCE_NOT_RECONCILED as for any refund).
   * The "Cần chú ý" closed_reservation_credit item of the booking opens (S4-06 – it closes when the credit is paid back).
   */
  async createAfterClosureRefund(
    tx: Tx,
    actor: PaymentActor,
    input: {
      reservationId: string;
      reservationCode: string;
      amountVnd: number;
      receipt: { code: string; method: string };
    },
  ): Promise<RefundRow> {
    const row = await this.approvals.submit(
      tx,
      { userId: actor.userId, roles: actor.roles },
      {
        type: 'refund',
        amountVnd: input.amountVnd,
        reasonCode: PAYMENT_AFTER_CANCEL,
        reasonNote: `Tự sinh từ khoản thu ${input.receipt.code} ${input.receipt.method}`,
        targetType: 'reservation',
        targetId: input.reservationId,
        targetCode: input.reservationCode,
        refundSource: 'other',
        originActorIds: [actor.userId],
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      },
    );
    const now = this.clock.now();
    // Created in this transaction: its version stays the one it was made with (as applyCarriedDestination).
    await tx.query(
      `UPDATE approval_request SET refund_method = 'original_method', refund_destination_set_at = $2,
          refund_destination_set_by = NULL, updated_at = $2
        WHERE id = $1 AND refund_method IS NULL`,
      [row.id, now],
    );
    await this.audit.recordMoney(tx, {
      action: 'refund.destination_set',
      entityType: 'approval_request',
      entityId: row.id,
      entityCode: input.reservationCode,
      before: { status: row.status, refundMethod: null },
      after: { status: row.status, refundMethod: 'original_method' },
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    await this.folios.openCreditAttention(tx, input.reservationId, input.reservationCode);
    return this.lock(tx, row.id);
  }

  // ───────────── createRefundRequest (E15-01) ─────────────

  async create(
    tx: Tx,
    actor: PaymentActor,
    folioId: string,
    input: { amountVnd: number; reason: unknown },
    reservationCode: string | null,
    bookingStatus: string | null = null,
  ): Promise<RefundRow> {
    const reason = requireReason('reason', input.reason);
    // Verification 17/10 (ARC-S3-02 follow-up): a hold has no charges – its money goes back through the
    // cancellation (B5, BR-308) or confirms the booking (B4); a manual refund request would leave the hold
    // counted as paid.
    if (bookingStatus === 'hold') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: 'hold' } });
    }
    if (!Number.isSafeInteger(input.amountVnd) || input.amountVnd <= 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' }],
      });
    }
    const folio = await this.folios.lock(tx, folioId);
    if (!folio) throw problem('NOT_FOUND');
    // 0.3.8 bổ sung 3 (ARC FB-R3-ARC-FUZZ-01, BR-522 K11-06): an overpayment left after check-out is requested on the
    // `settled` folio too (J15 keeps it settled – `waiting_refund` – until it is paid back); `closed` holds no credit (I4).
    if (folio.status === 'closed') throw folioLocked('closed');
    // E15-05: the cap is the overpayment not routed to a refund request yet (open requests of every booking
    // of the folio already deducted by FolioService.balance).
    const max = (await this.folios.balance(tx, folio.id)).unhandledCreditVnd;
    if (input.amountVnd > max) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'amountVnd', code: 'REFUND_EXCEEDS_APPROVED' }],
        extras: { max },
      });
    }
    const row = await this.approvals.submit(
      tx,
      { userId: actor.userId, roles: actor.roles },
      {
        type: 'refund',
        amountVnd: input.amountVnd,
        reasonCode: 'overpayment',
        reasonNote: reason,
        targetType: 'reservation',
        targetId: folio.primary_reservation_id,
        ...(reservationCode ? { targetCode: reservationCode } : {}),
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      },
    );
    return this.lock(tx, row.id);
  }

  // ───────────── destination (A43 / A47) ─────────────

  /** L3 of a refund request: the folio of its booking, locked BEFORE the request (16.19). No row → nothing. */
  async lockFolioOf(tx: Tx, approvalId: string): Promise<void> {
    const { rows } = await tx.query<{ folio_id: string | null }>(
      `SELECT CASE WHEN a.target_type = 'folio' THEN a.target_id ELSE r.folio_id END AS folio_id
         FROM approval_request a
         LEFT JOIN reservation r ON a.target_type = 'reservation' AND r.id = a.target_id
        WHERE a.id = $1 AND a.type = 'refund'`,
      [approvalId],
    );
    if (rows[0]?.folio_id) await this.folios.lock(tx, rows[0].folio_id);
  }

  async lock(tx: Tx, approvalId: string): Promise<RefundRow> {
    await this.lockFolioOf(tx, approvalId);
    const { rows } = await tx.query<RefundRow>(
      `SELECT * FROM approval_request WHERE id = $1 AND type = 'refund' FOR UPDATE`,
      [approvalId],
    );
    if (!rows[0]) throw problem('NOT_FOUND');
    return rows[0];
  }

  async setDestination(
    tx: Tx,
    actor: PaymentActor & { sessionId?: string; trustedDeviceId?: string | null },
    approvalId: string,
    input: DestinationInput,
  ): Promise<RefundRow> {
    // Field checks first (422 writes nothing).
    let accountNo: string | null = null;
    let holder: string | null = null;
    let bankBin: string | null = null;
    if (input.method === 'bank_transfer') {
      const errors: Array<{ field: string; code: string }> = [];
      bankBin = input.bankBin?.trim() ?? null;
      if (!bankBin) errors.push({ field: 'bankBin', code: 'REQUIRED' });
      else if (!/^[0-9]{6}$/.test(bankBin))
        errors.push({ field: 'bankBin', code: 'VALIDATION_FAILED' });
      accountNo = input.accountNo?.replace(/\s+/g, '') ?? null;
      if (!accountNo) errors.push({ field: 'accountNo', code: 'REQUIRED' });
      else if (!/^[0-9]{6,19}$/.test(accountNo)) {
        errors.push({ field: 'accountNo', code: 'VALIDATION_FAILED' });
      }
      // SEC-BE-44: control characters stripped, Luhn refused (V-09). FB-R5-SEC-BE-127-02: the one shared filter
      // (SR-INP-05 – Cc, Cf incl. bidi overrides, default-ignorable): a name of invisible characters only → REQUIRED.
      holder =
        typeof input.accountHolder === 'string'
          ? stripControlChars(input.accountHolder).trim()
          : null;
      if (!holder) errors.push({ field: 'accountHolder', code: 'REQUIRED' });
      else if (holder.length > 70) errors.push({ field: 'accountHolder', code: 'TOO_LONG' });
      if (errors.length) throw problem('VALIDATION_FAILED', { errors });
      assertNoCardNumber('accountHolder', holder);
      // SEC F8 / V-09: a card number is never accepted as a refund account.
      if (accountNo && accountNo.length >= 13 && luhnValid(accountNo)) {
        throw problem('CARD_NUMBER_DETECTED', {
          errors: [{ field: 'accountNo', code: 'CARD_NUMBER_DETECTED' }],
        });
      }
    } else if (input.bankBin || input.accountNo || input.accountHolder) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: input.accountNo ? 'accountNo' : 'bankBin', code: 'NOT_ALLOWED' }],
      });
    }
    const row = await this.lock(tx, approvalId);
    if (!OPEN_STATES.includes(row.status) || row.refunded_vnd >= row.amount_vnd) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: row.status } });
    }
    // 0.3.13 bổ sung 1 (5B-1, SEC S3): the server fixed where this money goes back – not to cash, not to another account.
    if (serverFixedDestination(row)) {
      throw problem('INVALID_TRANSITION', {
        detail: 'refund destination fixed by the server (original_method)',
        extras: { currentState: row.status },
      });
    }
    await this.assertNotA32Maker(tx, row, actor);
    const now = this.clock.now();
    let enc: Buffer | null = null;
    let keyId: string | null = null;
    if (accountNo && holder) {
      const sealed = await this.cipher.encrypt(
        tx,
        { purpose: 'refund_account', subjectId: row.id, aad: refundAccountAad(row.id) },
        JSON.stringify({ accountNo, accountHolder: holder }),
      );
      enc = sealed.ciphertext;
      keyId = sealed.dekId;
    }
    const oldKey = row.refund_account_key_id;
    const reapprove = row.status === 'approved';
    if (reapprove) {
      // SEC F8: a new destination after approval needs a new decision – through SM-10 (ARC 15 d).
      await this.approvals.reopenForRedecision(tx, row.id, {
        reason: 'refund_destination_changed',
        byUserId: actor.userId,
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
    const { rows } = await tx.query<RefundRow>(
      `UPDATE approval_request SET refund_method = $2, refund_bank_bin = $3,
          refund_account_last4 = $4, refund_account_enc = $5, refund_account_key_id = $6,
          refund_destination_set_at = $7, refund_destination_set_by = $8,
          updated_at = $7, version = version + 1
        WHERE id = $1 RETURNING *`,
      [
        row.id,
        input.method,
        bankBin,
        accountNo ? accountNo.slice(-4) : null,
        enc,
        keyId,
        now,
        actor.userId,
      ],
    );
    if (oldKey) await this.cipher.destroy(tx, oldKey);
    const reservationId = row.target_type === 'reservation' ? row.target_id : null;
    await this.audit.recordC3Access(tx, {
      subjectType: 'refund_account',
      subjectId: row.id,
      action: row.refund_method ? 'update' : 'create',
      ...(reservationId ? { reservationId } : {}),
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
      ...(actor.sessionId ? { sessionId: actor.sessionId } : {}),
      ...(actor.trustedDeviceId ? { trustedDeviceId: actor.trustedDeviceId } : {}),
    });
    await this.audit.recordMoney(tx, {
      action: 'refund.destination_set',
      entityType: 'approval_request',
      entityId: row.id,
      ...(row.target_code ? { entityCode: row.target_code } : {}),
      before: { status: row.status, refundMethod: row.refund_method },
      after: {
        status: reapprove ? 'pending' : row.status,
        refundMethod: input.method,
        ...(accountNo ? { accountNoLast4: accountNo.slice(-4) } : {}),
      },
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    // SEC-BE-37 (4): every set/change of the destination is pushed to the requester and every owner – the
    // booking code only, never the account (SEC A5). Push-only kind (no inbox row in R2).
    await this.pushDestinationChanged(tx, row, actor.userId);
    return rows[0] as RefundRow;
  }

  private async pushDestinationChanged(tx: Tx, row: RefundRow, actorId: string): Promise<void> {
    const { rows } = await tx.query<{ id: string }>(
      `SELECT DISTINCT u.id FROM app_user u
         JOIN user_property_role upr ON upr.user_id = u.id AND upr.property_id = $1 AND upr.revoked_at IS NULL
        WHERE u.status = 'active' AND (upr.role = 'owner' OR u.id = $2) AND u.id <> $3
        ORDER BY u.id`,
      [tx.ctx.propertyId, row.requested_by, actorId],
    );
    if (!rows.length) return;
    await tx.query(
      `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
       VALUES ($1, $2, $3, 'staff.push', $4, $5) ON CONFLICT (dedupe_key) DO NOTHING`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        JSON.stringify({
          kind: 'refund_destination_changed',
          userIds: rows.map((r) => r.id),
          refType: 'approval_request',
          refId: row.id,
          ...(row.target_code ? { refCode: row.target_code } : {}),
        }),
        `refund_destination_changed:${row.id}:${uuidv7()}`,
      ],
    );
  }

  async getDestination(
    tx: Tx,
    p: StaffPrincipal,
    approvalId: string,
    requestId?: string,
  ): Promise<{ method: string; bankBin?: string; accountNo?: string; accountHolder?: string }> {
    const { rows } = await tx.query<RefundRow>(
      `SELECT * FROM approval_request WHERE id = $1 AND type = 'refund'`,
      [approvalId],
    );
    const row = rows[0];
    if (!row || !row.refund_method) throw problem('NOT_FOUND');
    const reservationId = row.target_type === 'reservation' ? row.target_id : null;
    // SR-C3-07 (BE-C C3AccessGate): rate limit + c3_access_log BEFORE any data leaves; a failed log write is
    // a 503. The step-up window slides (SR-C3-09).
    await this.gate.record(
      tx,
      p,
      {
        subjectType: 'refund_account',
        subjectId: row.id,
        action: 'view',
        ...(reservationId ? { reservationId } : {}),
        ...(requestId ? { requestId } : {}),
      },
      { stepUp: true },
    );
    if (row.refund_method !== 'bank_transfer') return { method: row.refund_method };
    if (!row.refund_account_enc || !row.refund_account_key_id) {
      // Destroyed after the full pay-out (T09): nothing readable is left.
      return {
        method: row.refund_method,
        ...(row.refund_bank_bin ? { bankBin: row.refund_bank_bin } : {}),
      };
    }
    const plain = parseRefundAccount(
      await this.cipher.decrypt(tx, {
        dekId: row.refund_account_key_id,
        ciphertext: row.refund_account_enc,
        aad: refundAccountAad(row.id),
      }),
    );
    return {
      method: row.refund_method,
      ...(row.refund_bank_bin ? { bankBin: row.refund_bank_bin } : {}),
      accountNo: plain.accountNo,
      accountHolder: plain.accountHolder,
    };
  }

  /**
   * PO 17/10: an OWN paying a transfer refund they requested, approved or routed takes the self path – the
   * controller asks for the step-up window first (401 REAUTH_REQUIRED). Read-only, before the unit of work.
   * FB-R5-SEC-BE-148-01: so does an OWN who is only among its origin actors (`origin_actor_ids` – e.g. the recorder of
   * a receipt after closure whose 5B-1 request was rejected and asked again by someone else): the OWN transfer
   * exception of `payOut` lets them pay, so the two compensating controls of PO 17/10 (step-up, money-log flag) apply.
   */
  async isOwnSelfPayout(tx: Tx, approvalId: string, userId: string): Promise<boolean> {
    const { rows } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM approval_request
        WHERE id = $1 AND type = 'refund'
          AND (requested_by = $2 OR approver_id = $2 OR refund_destination_set_by = $2
            OR $2::uuid = ANY(origin_actor_ids))`,
      [approvalId, userId],
    );
    return (rows[0]?.n ?? 0) > 0;
  }

  // ───────────── pay-outs (A47a cash, A47 transfer / original method) ─────────────

  async executeCash(
    tx: Tx,
    actor: PaymentActor,
    approvalId: string,
    input: PayoutInput,
  ): Promise<PaymentRowLite> {
    return this.payOut(tx, actor, approvalId, input, 'cash');
  }

  async executeTransfer(
    tx: Tx,
    actor: PaymentActor,
    approvalId: string,
    input: PayoutInput,
  ): Promise<PaymentRowLite> {
    return this.payOut(tx, actor, approvalId, input, 'transfer');
  }

  private async payOut(
    tx: Tx,
    actor: PaymentActor,
    approvalId: string,
    input: PayoutInput,
    channel: 'cash' | 'transfer',
  ): Promise<PaymentRowLite> {
    const note = optionalText('note', input.note, 300);
    const paidAt = parseInstant('paidAt', input.paidAt) as Date;
    if (!Number.isSafeInteger(input.amountVnd) || input.amountVnd <= 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' }],
      });
    }
    if (input.bankReference !== null && !/^[A-Za-z0-9./_-]{1,64}$/.test(input.bankReference)) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'bankReference', code: 'VALIDATION_FAILED' }],
      });
    }
    // SEC-BE-44 as C0313-25 corrected it (SEC-responses 4.1 (a)): a reference that IS a card number as a whole
    // (13–19 digits once `.` `/` `_` `-` are removed, Luhn) is never stored; a bank code with a long digit run is not
    // a card. Free text (`note`) keeps the general V-09 rule.
    assertNotCardNumberReference('bankReference', input.bankReference);
    // ARC-BE-S3-25 lock order (reservation → folio → payment → approval): folio first, then the request; every
    // state check below runs under both locks.
    const target = await this.targetOf(tx, approvalId);
    const folio = await this.folios.folioOfReservation(tx, target);
    if (!folio) throw problem('NOT_FOUND');
    const lockedFolio = await this.folios.lock(tx, folio.id);
    const row = await this.lock(tx, approvalId);
    if (row.status !== 'approved' || row.refunded_vnd >= row.amount_vnd) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.refunded_vnd >= row.amount_vnd ? 'refunded' : row.status },
      });
    }
    if (!row.refund_method) throw problem('REFUND_DESTINATION_REQUIRED');
    // PO 16/10: cash at the desk vs transfer / original method are two operations (A47a / A47).
    if ((channel === 'cash') !== (row.refund_method === 'cash')) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: row.refund_method } });
    }
    // PO 17/10 (SEC-37, decision-log): for a TRANSFER refund the payer differs from the requester, the approver
    // and whoever set the destination – except an OWN (role at the time of the action), who may approve and pay
    // the same refund (step-up checked by the controller, flagged in the money log). MGR never approves + pays.
    // Cash refunds (A47a): the requester never pays, no exception (CHECK in 0040/0042 as well).
    const ownerTransfer = channel === 'transfer' && primaryRole(actor.roles) === 'owner';
    if (row.requested_by === actor.userId && !ownerTransfer) throw problem('SELF_REFUND_FORBIDDEN');
    // 5B-1 (SEC S2) / ADD3-01: whoever may never approve it (the recorder of a receipt after closure, an A32 maker)
    // never pays it out either – the OWN transfer exception of PO 17/10 kept (the one-owner property, step-up).
    if (!ownerTransfer && (row.origin_actor_ids ?? []).includes(actor.userId)) {
      throw problem('SELF_REFUND_FORBIDDEN');
    }
    await this.assertNotA32Maker(tx, row, actor);
    if (
      channel === 'transfer' &&
      !ownerTransfer &&
      (row.approver_id === actor.userId || row.refund_destination_set_by === actor.userId)
    ) {
      throw problem('SELF_REFUND_FORBIDDEN');
    }
    // FB-R5-SEC-BE-148-01: an OWN among the origin actors pays through the same self path (flag; step-up checked by
    // the controller through isOwnSelfPayout) as one who requested, approved or routed it.
    const ownSelf =
      ownerTransfer &&
      ([row.requested_by, row.approver_id, row.refund_destination_set_by].includes(actor.userId) ||
        (row.origin_actor_ids ?? []).includes(actor.userId));
    if (!lockedFolio || lockedFolio.status === 'closed') throw folioLocked('closed');
    const now = this.clock.now();
    if (
      paidAt.getTime() > now.getTime() ||
      (row.decided_at && paidAt.getTime() < row.decided_at.getTime())
    ) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'paidAt', code: 'DATE_INVALID' }] });
    }
    // DOM BE-14 b/c, ARC 13: never more than the overpayment that exists NOW, and only the part backed by
    // settled money (reconciled transfers, cash, POS – a disputed receipt counts for what arrived).
    const balance = await this.folios.balance(tx, folio.id);
    const left = row.amount_vnd - row.refunded_vnd;
    if (input.amountVnd > Math.min(left, balance.rawCreditVnd)) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'amountVnd', code: 'REFUND_EXCEEDS_APPROVED' }],
        extras: { max: Math.max(0, Math.min(left, balance.payableCreditVnd)) },
      });
    }
    if (input.amountVnd > balance.payableCreditVnd) {
      // E15-05 / BR-522 v0.3.4 (DOM S3-16 a): the overpayment comes from receipts not reconciled yet.
      throw problem('REFUND_SOURCE_NOT_RECONCILED', {
        extras: {
          paymentIds: balance.unsettledPaymentIds,
          unreconciledVnd: balance.unreconciledVnd,
        },
      });
    }
    // Method actually used (original_method → the method of the latest receipt of the folio).
    let method: string = row.refund_method === 'cash' ? 'cash' : 'bank_transfer';
    if (row.refund_method === 'original_method') {
      // 5B-1 (SEC S3): a destination fixed by the server goes back to a transfer / VietQR receipt of the folio – the
      // account the money came from – never to an earlier cash or OTA receipt (no transfer at all → 409 below).
      const fixed = serverFixedDestination(row);
      const { rows: orig } = await tx.query<{ method: string }>(
        `SELECT method FROM payment WHERE folio_id = $1 AND status = 'succeeded' AND reversal_of_id IS NULL
            AND type <> 'refund' AND type <> 'security_deposit'
            AND (NOT $2::boolean OR method IN ('bank_transfer', 'vietqr'))
          ORDER BY received_at DESC NULLS LAST, id DESC LIMIT 1`,
        [folio.id, fixed],
      );
      method = orig[0]?.method ?? 'cash';
      // ARC-BE-S3-26 / SEC-BE-45: cash (or money the OTA holds) is never paid out by this operation – cash goes
      // through executeCashRefund with the guest's signed receipt (A47a).
      if (method === 'cash' || method === 'ota_collect') {
        throw problem('INVALID_TRANSITION', {
          detail: 'original method resolves to cash – use executeCashRefund',
          extras: { currentState: method },
        });
      }
    }
    const transfer = method === 'bank_transfer' || method === 'vietqr';
    const errors: Array<{ field: string; code: string }> = [];
    if ((transfer || method === 'card_pos') && channel === 'transfer' && !input.bankReference) {
      errors.push({ field: 'bankReference', code: 'REQUIRED' });
    }
    // Proof: always for cash (signed receipt – PO 16/10), and for a bank transfer (E15-02).
    if (!input.attachmentId && (channel === 'cash' || transfer)) {
      errors.push({ field: 'attachmentId', code: 'EVIDENCE_REQUIRED' });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    if (input.attachmentId) {
      await this.attachments.assertUsable(tx, actor, input.attachmentId, 'refund_proof', {
        reservationId: row.target_id,
        field: 'attachmentId',
      });
    }
    const id = uuidv7();
    const code = await this.docNumbers.allocate(tx, 'payment');
    // G-14: a refund by transfer is reconciled against the statement by someone else (A46); cash → shift.
    const reconciliation = transfer ? 'pending' : 'not_required';
    await tx.query(
      `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
         reconciliation, amount_vnd, status, received_at, recorded_by, recorded_by_role, approval_request_id,
         approval_requested_by, attachment_id, note, bank_reference, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'refund', $7, $8, $9, 'succeeded', $10, $11, $12, $13, $14, $15, $16, $17,
         $18, $11, $18)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        code,
        folio.id,
        row.target_id,
        method,
        reconciliation,
        -input.amountVnd,
        paidAt,
        actor.userId,
        primaryRole(actor.roles),
        row.id,
        row.requested_by,
        input.attachmentId,
        note,
        input.bankReference,
        now,
      ],
    );
    await this.folios.touch(tx, folio.id); // ARC 16.29 (N-6): refund paid out
    if (input.attachmentId) {
      await this.attachments.bindTo(tx, input.attachmentId, { type: 'payment', id });
      // SEC I5: a cash pay-out is final at once; a transfer waits for its reconciliation.
      if (reconciliation === 'not_required') {
        await anchorPaymentAttachment(
          this.attachments,
          tx,
          { attachment_id: input.attachmentId, type: 'refund' },
          now,
        );
      }
    }
    const refunded = row.refunded_vnd + input.amountVnd;
    const full = refunded >= row.amount_vnd;
    await this.approvals.addRefunded(tx, row.id, input.amountVnd);
    if (full) {
      await tx.query(
        `UPDATE approval_request SET refund_account_enc = NULL, updated_at = $2 WHERE id = $1`,
        [row.id, now],
      );
    }
    if (full && row.refund_account_key_id) {
      // T09: crypto-shredding of the destination account once the refund is fully paid.
      await this.cipher.destroy(tx, row.refund_account_key_id);
      await this.audit.recordC3Access(tx, {
        subjectType: 'refund_account',
        subjectId: row.id,
        action: 'purge',
        reservationId: target,
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
    await this.audit.recordMoney(tx, {
      action: channel === 'cash' ? 'refund.cash_paid' : 'refund.paid',
      entityType: 'payment',
      entityId: id,
      ...(row.target_code ? { entityCode: row.target_code } : {}),
      after: {
        code,
        type: 'refund',
        method,
        amountVnd: -input.amountVnd,
        status: 'succeeded',
        reconciliation,
        recordedByRole: primaryRole(actor.roles),
        // PO 17/10: "OWN tự duyệt và chi" – shown in the money log (mlog) from this flag.
        ...(ownSelf ? { ownSelfApprovedAndPaid: true } : {}),
      },
      ...(note ? { reason: note } : {}),
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    // BUG-R3-014 (critic rerun M-2, 13.3 points 1 + 3): the pay-out lowered the credit – the open refunds of the folio
    // are re-planned in this transaction; no credit left → approved requests with money left are closed `superseded`.
    await this.folios.replanRefundsAfterPayout(tx, folio.id, actor.requestId);
    // S4-06 (BR-522 v0.3.4): the "Cần chú ý – tiền dư đơn đã đóng" item of a cancelled / no-show booking closes
    // itself once nothing is left to pay back on its folio (BE-D 2.2: system-resolved only).
    if (this.events) {
      const { rows: st } = await tx.query<{ status: string }>(
        'SELECT status FROM reservation WHERE id = $1',
        [target],
      );
      if (st[0] && (st[0].status === 'cancelled' || st[0].status === 'no_show')) {
        const left = await this.folios.balance(tx, folio.id);
        if (left.rawCreditVnd <= 0) {
          await this.events.resolveAttention(
            tx,
            `closed_reservation_credit:${target}`,
            now,
            'refund paid out (BR-522)',
          );
        }
      }
    }
    await publishEvent(tx, this.events, 'payment.changed', id, {
      roles: MANAGER_ROLES,
      userIds: [actor.userId],
    });
    await publishEvent(tx, this.events, 'reservation.changed', target);
    return (await this.payments.row(tx, id)) as PaymentRowLite;
  }

  /**
   * ARC 0.3.8 bổ sung 7 (13.4 point 2 – BUG014-02): whoever made an A32 reduction below the owner on the folio after
   * check-out never touches its refunds – paying one out (cash or transfer) or setting where it goes – 403
   * SELF_REFUND_FORBIDDEN, under the folio lock the caller holds. The owner is never blocked.
   */
  private async assertNotA32Maker(
    tx: Tx,
    row: Pick<RefundRow, 'target_type' | 'target_id'>,
    actor: { userId: string; roles: readonly string[] },
  ): Promise<void> {
    if (actor.roles.includes('owner')) return;
    if (
      await this.folios.isA32Maker(tx, row.target_type ?? null, row.target_id ?? null, actor.userId)
    ) {
      throw problem('SELF_REFUND_FORBIDDEN');
    }
  }

  /** Booking of a refund request (unlocked read – the request row is locked after the folio). */
  private async targetOf(tx: Tx, approvalId: string): Promise<string> {
    const { rows } = await tx.query<{ target_type: string | null; target_id: string | null }>(
      `SELECT target_type, target_id FROM approval_request WHERE id = $1 AND type = 'refund'`,
      [approvalId],
    );
    const r = rows[0];
    if (!r || r.target_type !== 'reservation' || !r.target_id) throw problem('NOT_FOUND');
    return r.target_id;
  }

  /** OpenAPI ApprovalRequest + refund parts (masked destination, refundedVnd). */
  async dto(tx: Tx, row: RefundRow): Promise<Record<string, unknown>> {
    const base = (await this.approvals.toDto(tx, row)) as unknown as Record<string, unknown>;
    const tz = await this.folios.timezone(tx);
    return {
      ...base,
      refundedVnd: row.refunded_vnd,
      ...(row.refund_method
        ? {
            refundDestination: {
              method: row.refund_method,
              ...(row.refund_bank_bin ? { bankBin: row.refund_bank_bin } : {}),
              ...(row.refund_account_last4 ? { accountNoLast4: row.refund_account_last4 } : {}),
              ...(row.refund_destination_set_at
                ? { setAt: toZonedIso(row.refund_destination_set_at, tz) }
                : {}),
            },
          }
        : {}),
    };
  }
}
