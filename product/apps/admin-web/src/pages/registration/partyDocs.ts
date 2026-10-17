import type { AttentionItem, GuestDocumentMasked, Registration } from '@ottimo/api-client';
import { useEffect, useRef } from 'react';
import { api } from '../../app/api';
import { useResource } from '../../hooks/useResource';

/**
 * FB-R2-SEC-FE-07 (BUG-R2-083, BE-C fallback of SEC-BE-53): when a person leaves the party, the documents the
 * guest sent through the link from "Khách 2" on that are linked to nobody wait 24 h for the desk – link the
 * ones of people still staying (`updateGuestDocument` + `partyMemberId`), otherwise J16 deletes them.
 * The API says it in two places: `documents[].imagePurgeAt` (the deadline) and the "Cần chú ý" item
 * `data_quality` / `params.check = registration_party_docs_unlinked` (booking ids + earliest `dueAt`).
 */
export const UNLINKED_CHECK = 'registration_party_docs_unlinked';

export const isUnlinkedItem = (a: AttentionItem): boolean =>
  a.kind === 'data_quality' && a.params?.check === UNLINKED_CHECK;

/** A document the guest sent through the link that no party member owns yet ("Người trong đoàn" asked). */
export const isGuestUploadUnlinked = (d: GuestDocumentMasked): boolean =>
  d.captureMethod === 'guest_upload' && !d.partyMemberId && !d.isMain;

/**
 * The "Cần chú ý" item of the unlinked guest-link documents (one item for every booking concerned).
 * `deps` reloads it (e.g. the registration version after a link). Errors are kept local – the screen falls
 * back to the document data alone (`pendingDocs` with `flagged = null`).
 */
export function useUnlinkedAttention(propertyId: string, deps: unknown[] = []) {
  const res = useResource(
    async () =>
      (await api.listAttentionItems({ propertyId })).data.data.find(isUnlinkedItem) ?? null,
    [propertyId, ...deps],
  );
  const { state } = res;
  // The last answer stays while reloading (no flicker after each save / live event).
  const data = state.data;
  /** true/false = the item does/doesn't name the booking; undefined = loading; null = could not be read. */
  const flagged = (reservationId: string): boolean | null | undefined =>
    data !== undefined
      ? !!data?.reservationIds?.includes(reservationId)
      : state.status === 'error'
        ? null
        : undefined;
  return { item: data ?? null, flagged, reload: res.reload };
}

/** 0.3.7 (S4-48): the server says when a document waits (`unclaimedUntil`, null = not waiting). */
const saysUnclaimed = (reg: Pick<Registration, 'documents'>) =>
  reg.documents.some((d) => d.unclaimedUntil !== undefined);

/** The deadline of a waiting document: `unclaimedUntil` (0.3.7), else the image deadline (0.3.6). */
export const deadlineOf = (d: GuestDocumentMasked): string | undefined =>
  d.unclaimedUntil ?? d.imagePurgeAt ?? undefined;

/**
 * Documents waiting to be linked. 0.3.7: exactly those with `unclaimedUntil` (S4-48 – no guessing).
 * Older server – with the attention item: every unlinked guest-link document of a flagged booking (its
 * images may already be gone); without it (could not be read): only the ones carrying a deadline – a
 * document of a stay that ended also has one, so the label may show there too (warning when unsure).
 * Still loading → none (no flash of warnings).
 */
export function pendingDocs(
  reg: Pick<Registration, 'documents'>,
  flagged: boolean | null | undefined,
): GuestDocumentMasked[] {
  if (saysUnclaimed(reg))
    return reg.documents.filter((d) => isGuestUploadUnlinked(d) && !!d.unclaimedUntil);
  if (!flagged && flagged !== null) return [];
  return reg.documents.filter(
    (d) => isGuestUploadUnlinked(d) && (flagged === true || Boolean(d.imagePurgeAt)),
  );
}

/** Earliest deadline among the documents (ISO), or undefined. */
export function earliestPurge(docs: readonly GuestDocumentMasked[]): string | undefined {
  return docs
    .map(deadlineOf)
    .filter((x): x is string => !!x)
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0];
}

/**
 * 0.3.7 (S4-39, SEC-BE-53 main option): the "Khách n" slots (n ≥ 2) of IDs the guest sent through the
 * link that nobody owns yet – when a person without a linked ID leaves, the desk says which slot was
 * theirs (`removePartyMember.guestUploadPersonIndex`) or "none".
 */
export function unclaimedSlots(reg: Pick<Registration, 'documents'>): number[] {
  return reg.documents
    .filter((d) => isGuestUploadUnlinked(d) && (d.personIndex ?? 0) >= 2)
    .map((d) => d.personIndex!)
    .sort((a, b) => a - b);
}

/** DOM id of a document row – the banner and the "Cần chú ý" link focus it. */
export const docRowId = (documentId: string): string => `doc-${documentId}`;

/** Scroll to and focus a document row (`tabIndex = -1`). */
export function focusDocRow(documentId: string): void {
  const el = document.getElementById(docRowId(documentId));
  if (!el) return;
  el.scrollIntoView?.({ block: 'center' });
  el.focus();
}

/** Focus the first pending document once, when `when` turns true (`?focus=pending` from the H14 list). */
export function useFocusPendingOnce(when: boolean, first: GuestDocumentMasked | undefined): void {
  const id = first?.id;
  const done = useRef(false);
  useEffect(() => {
    if (!when || !id || done.current) return;
    done.current = true;
    focusDocRow(id);
  }, [when, id]);
}
