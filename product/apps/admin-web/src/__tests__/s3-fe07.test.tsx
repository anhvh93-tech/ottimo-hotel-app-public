import { formatInstant } from '@ottimo/i18n';
import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

/**
 * Vòng sửa 9c – FB-R2-SEC-FE-07 (BUG-R2-083, BE-C 9b): a person left the party, the documents the guest sent
 * through the link from "Khách 2" on wait 24 h to be linked to a person still staying. The Desk shows the
 * deadline, leads to them, and links them (`updateGuestDocument` + `partyMemberId`, full fields – OpenAPI 0.3.6).
 * Also: UXR P2 (ảnh 020) "Xem đủ số / ảnh" opens the photos under the C3 rules, SEC-BE-54 mark-sent message.
 */

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const userId = (username: string) => mockControl.db.users.find((u) => u.username === username)!.id;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fieldRe = (key: string) => new RegExp(`^${esc(tv(key))}`);
const DUE = new Date(Date.now() + 20 * 3_600_000).toISOString();
const due = () => formatInstant('vi', DUE);

interface Sent {
  method: string;
  path: string;
  body?: Record<string, unknown>;
}
function recordWrites() {
  const sent: Sent[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'GET') return;
    const entry: Sent = { method: request.method, path: new URL(request.url).pathname };
    sent.push(entry);
    if ((request.headers.get('content-type') ?? '').includes('json'))
      void request
        .clone()
        .json()
        .then((b: unknown) => (entry.body = b as Record<string, unknown>));
  });
  return sent;
}

/**
 * "Gia đình anh Hưng" after removing A from a party of booker + A + B + C: main document (booker, desk),
 * "Khách 2" (link, no fields yet) and "Khách 3" (link, fields entered) wait; C's document is linked.
 */
function setupRemoved() {
  const r = res('Gia đình anh Hưng');
  const reg = mockControl.stay.registrations.get(r.registrationId!)!;
  reg.status = 'partial';
  mockControl.stay.party.set(r.id, [
    { id: 'm-booker', role: 'booker', displayName: 'Gia đình anh Hưng', priceAgeBand: 'adult' },
    { id: 'm-b', role: 'companion', displayName: 'Trần Thị Bích', priceAgeBand: 'adult' },
    { id: 'm-c', role: 'companion', displayName: 'Lê Văn Cường', priceAgeBand: 'adult' },
  ]);
  const base = { imageConsent: 'not_recorded' as const, checks: [], nationalityCode: 'VNM' };
  reg.documents.push(
    {
      ...base,
      id: 'doc-main',
      // ARC 16.22: whose ID it is is the link, not "main" – the booker's own ID is linked to the booker.
      partyMemberId: 'm-booker',
      docType: 'cccd',
      isMain: true,
      fullNameOnDoc: 'Nguyễn Văn Hưng',
      docNumber: '079123456789',
      imageIds: [],
      captureMethod: 'manual',
    },
    {
      ...base,
      id: 'doc-k2',
      docType: 'cccd',
      isMain: false,
      fullNameOnDoc: '',
      docNumber: '',
      nationalityCode: undefined,
      imageIds: ['img-k2'],
      captureMethod: 'guest_upload',
      personIndex: 2,
      fieldsPurgeAfter: DUE,
    },
    {
      ...base,
      id: 'doc-k3',
      docType: 'cccd',
      isMain: false,
      fullNameOnDoc: 'Trần Thị Bích',
      docNumber: '079287654321',
      dateOfBirth: '1990-01-02',
      imageIds: ['img-k3a', 'img-k3b'],
      captureMethod: 'guest_upload',
      personIndex: 3,
      fieldsPurgeAfter: DUE,
    },
    {
      ...base,
      id: 'doc-k4',
      docType: 'cccd',
      isMain: false,
      fullNameOnDoc: 'Lê Văn Cường',
      docNumber: '079211112222',
      imageIds: ['img-k4'],
      captureMethod: 'guest_upload',
      personIndex: 4,
      partyMemberId: 'm-c',
    },
  );
  mockControl.stay.stepUpUntil.set(userId('qa.fd'), Date.now() + 5 * 60_000);
  return { r, reg };
}

/** The document row (H13/H14 list item) whose text contains `name`. */
const rowOf = (name: string) => {
  const li = screen
    .getAllByRole('listitem')
    .find((x) => x.id.startsWith('doc-') && x.textContent?.includes(name));
  if (!li) throw new Error(`no document row with "${name}"`);
  return li;
};

describe('FB-R2-SEC-FE-07 – documents waiting to be linked after a person left the party', () => {
  it('chip "Chờ gắn người – tự xóa lúc …" instead of "Đã có", banner leads to the first waiting document', async () => {
    const { reg } = setupRemoved();
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    const banner = await screen.findByText(tv('reg.link.banner', { n: 2, time: due() }));
    const chips = await screen.findAllByText(tv('reg.link.pending_chip', { time: due() }));
    expect(chips).toHaveLength(2);
    // The linked document of C and the main one keep "Đã có".
    expect(within(rowOf('Lê Văn Cường')).getByText(tv('guest.chip.doc_ok'))).toBeInTheDocument();
    expect(
      within(rowOf(tv('reg.link.no_fields'))).queryByText(tv('guest.chip.doc_ok')),
    ).not.toBeInTheDocument();
    await user.click(
      within(banner.closest('.alert') as HTMLElement).getByRole('button', {
        name: tv('reg.link.go'),
      }),
    );
    expect(document.activeElement?.id).toBe('doc-doc-k2');
  });

  it('"Gắn người" (0.3.7 S4-39): person required, nothing pre-selected, people with a document locked; the PATCH sends ONLY partyMemberId – no step-up read', async () => {
    const { reg } = setupRemoved();
    mockControl.stay.stepUpUntil.clear();
    const sent = recordWrites();
    const reads: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'GET' && /\/sensitive|\/images\//.test(request.url))
        reads.push(request.url);
    });
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    await screen.findAllByText(tv('reg.link.pending_chip', { time: due() }));
    // The row says the slot the guest used – the number the party-removal box asks about.
    expect(within(rowOf('Trần Thị Bích')).getByText(/Khách 3/)).toBeInTheDocument();
    await user.click(
      within(rowOf('Trần Thị Bích')).getByRole('button', { name: tv('reg.link.action') }),
    );
    const dlg = await screen.findByRole('dialog', { name: tv('reg.link.action') });
    expect(within(dlg).getByText(tv('reg.link.dialog_help'))).toBeInTheDocument();
    const pick = await within(dlg).findByLabelText(fieldRe('reg.link.member'));
    await waitFor(() => expect(pick).toBeEnabled());
    expect(pick).toHaveValue('');
    expect(pick).toHaveAccessibleDescription(tv('reg.link.member_help_pending', { time: due() }));
    const options = within(pick).getAllByRole('option') as HTMLOptionElement[];
    expect(options.map((o) => [o.textContent, o.disabled])).toEqual([
      [tv('reg.link.member_placeholder'), false],
      [tv('reg.link.has_doc', { name: 'Gia đình anh Hưng' }), true],
      ['Trần Thị Bích', false],
      [tv('reg.link.has_doc', { name: 'Lê Văn Cường' }), true],
    ]);
    await user.click(within(dlg).getByRole('button', { name: tv('reg.link.action') }));
    expect(pick).toHaveAccessibleDescription(new RegExp(esc(tv('common.required'))));
    expect(sent.filter((x) => x.method === 'PATCH')).toHaveLength(0);

    await user.selectOptions(pick, 'm-b');
    await user.click(within(dlg).getByRole('button', { name: tv('reg.link.action') }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: tv('reg.link.action') })).not.toBeInTheDocument(),
    );
    const patch = sent.find((x) => x.method === 'PATCH')!;
    expect(patch.path).toMatch(/\/documents\/doc-k3$/);
    await waitFor(() => expect(patch.body).toBeDefined());
    expect(patch.body).toEqual({ partyMemberId: 'm-b' });
    expect(reads).toEqual([]);
    expect(
      await screen.findByText(tv('reg.link.linked_toast', { name: 'Trần Thị Bích' })),
    ).toBeInTheDocument();
    // Kept: linked, no deadline; only "Khách 2" still waits.
    const k3 = reg.documents.find((d) => d.id === 'doc-k3')!;
    expect(k3.partyMemberId).toBe('m-b');
    expect(k3.fieldsPurgeAfter).toBeNull();
    expect(await screen.findByText(tv('reg.link.banner', { n: 1, time: due() }))).toBeVisible();
    expect(screen.getAllByText(tv('reg.link.pending_chip', { time: due() }))).toHaveLength(1);
    expect(within(rowOf('Trần Thị Bích')).getByText(tv('guest.chip.doc_ok'))).toBeInTheDocument();
  });

  it('a guest-link document of a person who already left (no free person): help says why, nothing to send', async () => {
    const { r, reg } = setupRemoved();
    mockControl.stay.party.set(r.id, [
      { id: 'm-booker', role: 'booker', displayName: 'Gia đình anh Hưng', priceAgeBand: 'adult' },
      { id: 'm-c', role: 'companion', displayName: 'Lê Văn Cường', priceAgeBand: 'adult' },
    ]);
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    await screen.findAllByText(tv('reg.link.pending_chip', { time: due() }));
    await user.click(
      within(rowOf('Trần Thị Bích')).getByRole('button', { name: tv('reg.link.action') }),
    );
    const dlg = await screen.findByRole('dialog', { name: tv('reg.link.action') });
    const pick = await within(dlg).findByLabelText(fieldRe('reg.link.member'));
    await waitFor(() =>
      expect(pick).toHaveAccessibleDescription(tv('reg.link.no_member', { time: due() })),
    );
    expect(pick).not.toBeRequired();
    expect(within(dlg).getByRole('button', { name: tv('reg.link.action') })).toBeDisabled();
  });

  it('a guest-link document that does not wait: "Người trong đoàn" is offered but optional', async () => {
    const { reg } = setupRemoved();
    for (const d of reg.documents) d.fieldsPurgeAfter = null;
    const sent = recordWrites();
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    expect(await screen.findByText('Trần Thị Bích')).toBeInTheDocument();
    expect(screen.queryByText(tv('reg.link.go'))).not.toBeInTheDocument();
    await user.click(
      within(rowOf('Trần Thị Bích')).getByRole('button', { name: tv('rooms.edit') }),
    );
    const dlg = await screen.findByRole('dialog', { name: tv('ci.manual_title') });
    const pick = await within(dlg).findByLabelText(fieldRe('reg.link.member'));
    expect(pick).toHaveAccessibleDescription(tv('reg.link.member_help'));
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    await waitFor(() => expect(sent.some((s) => s.method === 'PATCH')).toBe(true));
    await waitFor(() => expect(sent.find((s) => s.method === 'PATCH')!.body).toBeDefined());
    expect(sent.find((s) => s.method === 'PATCH')!.body).not.toHaveProperty('partyMemberId');
  });

  it('"Nhập tay" with the number of a waiting document → 409 DOCUMENT_UNCLAIMED_EXISTS → opens exactly that document (0.3.7 S4-39)', async () => {
    const { reg } = setupRemoved();
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    await screen.findAllByText(tv('reg.link.pending_chip', { time: due() }));
    await user.click(screen.getAllByRole('button', { name: tv('checkin.docs.manual') })[0]!);
    const dlg = await screen.findByRole('dialog', { name: tv('ci.manual_title') });
    // ARC 16.22 (SEC BE-73): a new ID always names its person – here someone not in the party yet.
    await user.selectOptions(
      within(dlg).getByLabelText(new RegExp(`^${tv('reg.link.member')}`)),
      await within(dlg).findByRole('option', { name: tv('reg.person_not_in_party') }),
    );
    // The number of "Khách 3" (doc-k3) – before 0.3.7 the box went to the FIRST waiting one (doc-k2).
    await user.type(
      within(dlg).getByLabelText(fieldRe('checkin.docs.field.doc_no')),
      '079287654321',
    );
    await user.type(
      within(dlg).getByLabelText(fieldRe('checkin.docs.field.full_name')),
      'Tran Thi Bich',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    expect(
      await within(dlg).findByText(tv('reg.link.dup_unclaimed', { n: 3 })),
    ).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: tv('reg.link.open_pending') }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: tv('ci.manual_title') })).not.toBeInTheDocument(),
    );
    const link = await screen.findByRole('dialog', { name: tv('reg.link.action') });
    expect(within(link).getByText(/Khách 3 · Trần Thị Bích/)).toBeInTheDocument();
    expect(reg.documents.filter((d) => d.docNumber === '079287654321')).toHaveLength(1);
  });

  it('older server (409 PARTY_DUPLICATE without an id) → guidance + "Mở giấy tờ chờ gắn người"', async () => {
    const { reg } = setupRemoved();
    server.use(
      http.post('*/v1/properties/:p/registrations/:id/documents', () =>
        HttpResponse.json({ code: 'PARTY_DUPLICATE', status: 409 }, { status: 409 }),
      ),
    );
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    await screen.findAllByText(tv('reg.link.pending_chip', { time: due() }));
    await user.click(screen.getAllByRole('button', { name: tv('checkin.docs.manual') })[0]!);
    const dlg = await screen.findByRole('dialog', { name: tv('ci.manual_title') });
    // ARC 16.22 (SEC BE-73): a new ID always names its person – here someone not in the party yet.
    await user.selectOptions(
      within(dlg).getByLabelText(new RegExp(`^${tv('reg.link.member')}`)),
      await within(dlg).findByRole('option', { name: tv('reg.person_not_in_party') }),
    );
    await user.type(
      within(dlg).getByLabelText(fieldRe('checkin.docs.field.doc_no')),
      '079287654321',
    );
    await user.type(
      within(dlg).getByLabelText(fieldRe('checkin.docs.field.full_name')),
      'Tran Thi Bich',
    );
    await user.click(within(dlg).getByRole('button', { name: tv('ci.manual_save') }));
    expect(await within(dlg).findByText(tv('reg.link.dup_pending'))).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: tv('reg.link.open_pending') }));
    await waitFor(() => expect(document.activeElement?.id).toBe('doc-doc-k2'));
  });

  it('H14 list: "Cần chú ý" item above the list with "Mở đơn" (even for a booking outside the tab), row chip; it opens the registration on the waiting document', async () => {
    const { r } = setupRemoved();
    // Arriving later → not in "Cần xử lý" (in house / arriving today): the button still finds it.
    const arrival = r.arrivalDate;
    r.arrivalDate = '2099-01-05';
    const { user, unmount } = renderApp('/registration', 'qa.fd');
    const title = await screen.findByText(
      tv('attn.dq_party_docs_unlinked_one', { code: r.code, time: due() }),
    );
    const alert = title.closest('.alert') as HTMLElement;
    expect(within(alert).getByText(tv('attn.dq_party_docs_unlinked_body'))).toBeInTheDocument();
    expect(screen.queryByText(tv('reg.link.row_chip'))).not.toBeInTheDocument();
    await user.click(
      await within(alert).findByRole('button', {
        name: tv('reg.link.open_booking', { code: r.code }),
      }),
    );
    await screen.findAllByText(tv('reg.link.pending_chip', { time: due() }));
    await waitFor(() => expect(document.activeElement?.id).toBe('doc-doc-k2'));
    expect(screen.getByRole('heading', { level: 1 }).closest('header')?.textContent).toContain(
      r.code,
    );
    unmount();
    // In the tab → the row carries the chip and its button opens on the waiting document too.
    r.arrivalDate = arrival;
    const second = renderApp('/registration', 'qa.fd');
    const row = (await screen.findByText(tv('reg.link.row_chip'))).closest('tr') as HTMLElement;
    expect(within(row).getByText(r.code)).toBeInTheDocument();
    await second.user.click(within(row).getByRole('button'));
    await waitFor(() => expect(document.activeElement?.id).toBe('doc-doc-k2'));
  });

  it('"Cần chú ý" cannot be read → falls back to the documents carrying a deadline', async () => {
    const { reg } = setupRemoved();
    server.use(
      http.get('*/v1/properties/:p/attention', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    );
    renderApp(`/registration/${reg.id}`, 'qa.fd');
    expect(await screen.findAllByText(tv('reg.link.pending_chip', { time: due() }))).toHaveLength(
      2,
    );
  });
});

describe('SEC-BE-54 – mark-sent with fewer counted documents than people', () => {
  it('says how many people miss a document, before the click and on 409 REGISTRATION_INCOMPLETE', async () => {
    const { reg } = setupRemoved();
    reg.status = 'scanned';
    server.use(
      http.post('*/v1/properties/:p/registrations/:id/actions/mark-sent', () =>
        HttpResponse.json(
          {
            code: 'REGISTRATION_INCOMPLETE',
            status: 409,
            errors: [{ field: 'party_count', code: 'REGISTRATION_INCOMPLETE' }],
          },
          { status: 409, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    // 4 people (Gia đình anh Hưng), 2 documents count (main + C) – "Khách 2/3" wait.
    const text = tv('reg2.mark_sent_incomplete', { n: 2 });
    expect(await screen.findByText(text)).toBeInTheDocument();
    await user.type(screen.getByLabelText(fieldRe('reg.code_label')), 'HS-2026-0001');
    await user.click(screen.getByRole('button', { name: tv('reg2.mark_sent') }));
    await waitFor(() => expect(screen.getByText(text).closest('.alert')).toHaveClass('bad'));
    expect(screen.queryByText(tv('error.REGISTRATION_INCOMPLETE'))).not.toBeInTheDocument();
  });
});

describe('UXR P2 (ảnh 020) – "Xem đủ số / ảnh" opens the document photos under the C3 rules', () => {
  let created: string[];
  let revoked: string[];
  const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const setVisibility = (v: 'hidden' | 'visible') => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  };
  beforeEach(() => {
    created = [];
    revoked = [];
    let n = 0;
    URL.createObjectURL = vi.fn(() => {
      const u = `blob:mock/${++n}`;
      created.push(u);
      return u;
    });
    URL.revokeObjectURL = vi.fn((u: string) => void revoked.push(u));
  });
  afterEach(() => {
    URL.createObjectURL = original.create;
    URL.revokeObjectURL = original.revoke;
    setVisibility('visible');
  });

  const reads = () => {
    const urls: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'GET' && /\/images\//.test(request.url)) urls.push(request.url);
    });
    return urls;
  };

  it('number + every photo with reason=registration; "Ẩn" revokes the object URLs', async () => {
    const { reg } = setupRemoved();
    const urls = reads();
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    const row = await waitFor(() => rowOf('Trần Thị Bích'));
    await user.click(within(row).getByRole('button', { name: tv('ci.view_full') }));
    const imgs = await within(row).findAllByRole('img', { name: /Trần Thị Bích/ });
    expect(imgs.map((i) => i.getAttribute('src'))).toEqual(created);
    expect(imgs[0]).toHaveAccessibleName(
      tv('ci.photo_alt', { n: 1, total: 2, name: 'Trần Thị Bích' }),
    );
    expect(within(row).getByText('079287654321')).toBeInTheDocument();
    expect(urls).toHaveLength(2);
    expect(urls.every((u) => u.endsWith('?reason=registration'))).toBe(true);
    await user.click(within(row).getByRole('button', { name: tv('ci.view_hide') }));
    expect(within(row).queryAllByRole('img')).toHaveLength(0);
    expect(revoked.sort()).toEqual([...created].sort());
  });

  it('tab hidden hides the photos and revokes them; leaving the screen revokes too', async () => {
    const { reg } = setupRemoved();
    const { user, unmount } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    const row = await waitFor(() => rowOf('Trần Thị Bích'));
    await user.click(within(row).getByRole('button', { name: tv('ci.view_full') }));
    await within(row).findAllByRole('img');
    act(() => setVisibility('hidden'));
    await waitFor(() => expect(within(row).queryAllByRole('img')).toHaveLength(0));
    expect(revoked.sort()).toEqual([...created].sort());
    setVisibility('visible');
    await user.click(within(row).getByRole('button', { name: tv('ci.view_full') }));
    await within(row).findAllByRole('img');
    const shown = created.slice(-2);
    unmount();
    expect(revoked).toEqual(expect.arrayContaining(shown));
  });

  it('a read still running when the tab is hidden is never shown and its URL is revoked', async () => {
    const { reg } = setupRemoved();
    let release!: () => void;
    const gate = new Promise<void>((ok) => (release = ok));
    server.use(
      http.get('*/v1/properties/:p/registrations/:id/documents/:d/images/:i', async () => {
        await gate;
        return new HttpResponse(new Uint8Array([0xff, 0xd8, 0xff]), {
          headers: { 'content-type': 'image/jpeg' },
        });
      }),
    );
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    const row = await waitFor(() => rowOf('Lê Văn Cường'));
    await user.click(within(row).getByRole('button', { name: tv('ci.view_full') }));
    act(() => setVisibility('hidden'));
    release();
    await waitFor(() => expect(created).toHaveLength(1));
    await waitFor(() => expect(revoked).toEqual(created));
    expect(within(row).queryAllByRole('img')).toHaveLength(0);
  });

  it('photos only (no number yet) still need step-up; a deleted photo says so', async () => {
    const { reg } = setupRemoved();
    mockControl.stay.stepUpUntil.delete(userId('qa.fd'));
    const { user } = renderApp(`/registration/${reg.id}`, 'qa.fd');
    const row = await waitFor(() => rowOf(tv('reg.link.no_fields')));
    await user.click(within(row).getByRole('button', { name: tv('ci.view_full') }));
    expect(await screen.findByRole('dialog', { name: tv('ci.stepup_title') })).toBeInTheDocument();
    expect(created).toHaveLength(0);

    mockControl.stay.stepUpUntil.set(userId('qa.fd'), Date.now() + 5 * 60_000);
    reg.documents.find((d) => d.id === 'doc-k2')!.imageIds = ['img-k2'];
    server.use(
      http.get('*/v1/properties/:p/registrations/:id/documents/:d/images/:i', () =>
        HttpResponse.json({ code: 'NOT_FOUND', status: 404 }, { status: 404 }),
      ),
    );
    await user.click(screen.getByRole('button', { name: tv('common.close') }));
    await user.click(within(row).getByRole('button', { name: tv('ci.view_full') }));
    expect(await within(row).findByText(tv('ci.photo_deleted'))).toBeInTheDocument();
  });
});
