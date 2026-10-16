/**
 * CryptoService behind the consumer ports BE-A and BE-B declared while BE-C was building (ARC s3-contract
 * 4.3). CryptoModule binds them, replacing the fail-closed / ephemeral stand-ins:
 * - FD_CHILD_DATA_PORT (frontdesk/public/ports.ts): a child's name + birth year (D09, C3) – own DEK per
 *   reservation_guest row, purpose `child_data`; `nameHmac` = keyedHash('child_name', …) (not ID_HASH_KEY).
 * - REFUND_ACCOUNT_CIPHER (payments/public/refund-account-cipher.ts): refund account (D15, SEC F8, T09) –
 *   own DEK per approval_request, purpose `refund_account`. BE-B's string AAD
 *   `approval_request|refund_account_enc|<id>|<v>` is mapped to the field AAD (table|column|record id);
 *   the key version in the AAD is the one CryptoService writes in the ciphertext header.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import type { EncryptedChildData, FrontdeskChildDataPort } from '../../frontdesk/public/ports';
import type { RefundAccountCipher } from '../../payments/public/refund-account-cipher';
import { CryptoService, type FieldAad } from './crypto.service';

@Injectable()
export class ChildDataCipher implements FrontdeskChildDataPort {
  constructor(@Inject(CryptoService) private readonly crypto: CryptoService) {}

  async encryptChild(
    tx: Tx,
    input: { reservationId: string; memberId: string; name: string; birthYear: number },
  ): Promise<EncryptedChildData> {
    const name = input.name.trim().replace(/\s+/g, ' ');
    if (!name || !Number.isInteger(input.birthYear)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'name', code: 'REQUIRED' }] });
    }
    const aad = (column: string): FieldAad => ({
      table: 'reservation_guest',
      column,
      recordId: input.memberId,
    });
    const { dataKeyId, ciphertext: nameEnc } = await this.crypto.seal(
      tx,
      { purpose: 'child_data', subjectId: input.memberId, aad: aad('child_name_enc') },
      name,
    );
    const birthYearEnc = await this.crypto.encrypt(
      tx,
      dataKeyId,
      aad('child_birth_year_enc'),
      String(input.birthYear),
    );
    return {
      nameEnc,
      birthYearEnc,
      nameHmac: this.crypto.keyedHash(
        'child_name',
        `${name.normalize('NFC').toUpperCase()}|${input.birthYear}`,
      ),
      dataKeyId,
    };
  }

  async destroy(tx: Tx, dataKeyId: string): Promise<void> {
    const subject = await subjectOf(tx, dataKeyId);
    await this.crypto.destroy(tx, dataKeyId, {
      subjectType: 'reservation_guest',
      subjectId: subject,
      policyKey: 'T03',
    });
  }
}

/** `approval_request|refund_account_enc|<id>|<v>` → field AAD. */
export function parseStringAad(aad: string): FieldAad {
  const [table, column, recordId] = aad.split('|');
  if (!table || !column || !recordId) throw new Error('invalid AAD');
  return { table, column, recordId };
}

@Injectable()
export class RefundAccountCipherAdapter implements RefundAccountCipher {
  constructor(@Inject(CryptoService) private readonly crypto: CryptoService) {}

  async encrypt(
    tx: Tx,
    meta: { purpose: 'refund_account'; subjectId: string; aad: string },
    plaintext: string,
  ): Promise<{ dekId: string; ciphertext: Buffer }> {
    const sealed = await this.crypto.seal(
      tx,
      { purpose: meta.purpose, subjectId: meta.subjectId, aad: parseStringAad(meta.aad) },
      plaintext,
    );
    return { dekId: sealed.dataKeyId, ciphertext: sealed.ciphertext };
  }

  decrypt(tx: Tx, input: { dekId: string; ciphertext: Buffer; aad: string }): Promise<string> {
    return this.crypto.decryptText(tx, input.dekId, parseStringAad(input.aad), input.ciphertext);
  }

  async destroy(tx: Tx, dekId: string): Promise<void> {
    const subject = await subjectOf(tx, dekId);
    await this.crypto.destroy(tx, dekId, {
      subjectType: 'approval_request',
      subjectId: subject,
      policyKey: 'T09',
    });
  }
}

/** Subject id of a DEK (for the purge_journal row) – crypto module code, may read data_key. */
async function subjectOf(tx: Tx, dataKeyId: string): Promise<string> {
  const { rows } = await tx.query<{ subject_id: string }>(
    'SELECT subject_id FROM data_key WHERE id = $1',
    [dataKeyId],
  );
  return rows[0]?.subject_id ?? dataKeyId;
}
