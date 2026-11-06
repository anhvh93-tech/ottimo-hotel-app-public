// V5-46 (FB-R4-SEC-ARC-P104-03, OpenAPI 0.3.12 (i)): the server refuses an ID number typed in a guest note
// (422 VALIDATION_FAILED, errors[{ field, code: ID_NUMBER_DETECTED }], SR-LOG-04) → the page says so, the way it
// already does for a card number. guest-web has no ID check of its own: the server's detector decides.
// Sentence = `error.ID_NUMBER_DETECTED` (CPY lượt 2, v1.0.4 PR24PM-01) in VI / EN / RU.
import { ApiError } from '@ottimo/api-client';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { translateGuest, type GuestLocale } from '../app/i18n';
import { problemText, sensitiveNumberOf } from '../app/problem';
import { mockControl, MOCK_TOKENS } from '../mocks/handlers';
import { server } from '../mocks/node';
import { openLink } from './helpers';

/** A fake CCCD-shaped run (12 digits) – not a real document. */
const FAKE_ID = '079000000000';
const ID_SENTENCE: Record<GuestLocale, string> = {
  vi: 'Không cần ghi số giấy tờ ở đây. Vui lòng xóa số đó rồi gửi lại.',
  en: "There's no need to include an ID number here. Please remove it and send again.",
  ru: 'Номер документа здесь указывать не нужно. Пожалуйста, удалите его и отправьте снова.',
};

const idProblem = (field: string) =>
  new ApiError(422, {
    type: '/problems/validation-failed',
    title: 'VALIDATION_FAILED',
    status: 422,
    code: 'VALIDATION_FAILED',
    errors: [{ field, code: 'ID_NUMBER_DETECTED' }],
  });

describe('V5-46 – sentence for ID_NUMBER_DETECTED (unit)', () => {
  it('the copy table has the reviewed sentence in the three guest languages', () => {
    for (const l of ['vi', 'en', 'ru'] as const) {
      expect(translateGuest(l, 'error.ID_NUMBER_DETECTED')).toBe(ID_SENTENCE[l]);
    }
  });

  it('problemText / sensitiveNumberOf read the field code, card before ID', () => {
    const en = (k: string) => translateGuest('en', k);
    expect(sensitiveNumberOf(idProblem('arrivalNote'))).toBe('id');
    expect(problemText(en, idProblem('note'))).toBe(ID_SENTENCE.en);
    const card = new ApiError(422, {
      type: '/problems/card-number-detected',
      title: 'CARD_NUMBER_DETECTED',
      status: 422,
      code: 'CARD_NUMBER_DETECTED',
      errors: [{ field: 'note', code: 'CARD_NUMBER_DETECTED' }],
    });
    expect(sensitiveNumberOf(card)).toBe('card');
    expect(sensitiveNumberOf(new Error('x'))).toBeUndefined();
  });
});

describe('V5-46 – arrival note of online check-in (updateOnlineCheckin.arrivalNote)', () => {
  for (const locale of ['vi', 'en', 'ru'] as const) {
    it(`${locale.toUpperCase()}: the server refuses the note → the sentence under the note, nothing kept`, async () => {
      if (locale !== 'vi') {
        mockControl.state.locale = locale;
        mockControl.state.localeChosen = true; // the guest picked this language in an earlier session
      }
      Object.assign(mockControl.state.oci, {
        noticeAccepted: true,
        currentStep: 'eta',
        uploadedPeople: [1, 2],
      });
      const tr = (k: string) => translateGuest(locale, k);
      const { user } = openLink();
      await user.click(await screen.findByRole('button', { name: tr('guest.cta.checkin_short') }));
      await user.click(await screen.findByRole('radio', { name: tr('guest.oci.arrival_late') }));
      const note = screen.getByLabelText(tr('guest.oci.note'));
      await user.type(note, `CCCD ${FAKE_ID}`);
      const calls = mockControl.state.calls.length;
      await user.click(screen.getByRole('button', { name: tr('common.next') }));

      // Not a card number: the page sends it, the server's detector refuses it.
      const alert = await screen.findByText(ID_SENTENCE[locale]);
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveAttribute('id', 'gw-note-err');
      expect(note).toHaveAttribute('aria-invalid', 'true');
      expect(note).toHaveAttribute('aria-describedby', 'gw-note-err');
      expect(mockControl.state.calls.length).toBeGreaterThan(calls);
      expect(mockControl.state.notes).toEqual([]);
      // still on the arrival step, the guest's text is still there to edit
      expect(screen.getByRole('heading', { name: tr('guest.oci.step2'), level: 1 })).toBeVisible();
      expect(note).toHaveValue(`CCCD ${FAKE_ID}`);

      // Editing the note clears the sentence; without the number the step goes on.
      await user.clear(note);
      expect(screen.queryByText(ID_SENTENCE[locale])).toBeNull();
      await user.type(note, 'Late flight');
      await user.click(screen.getByRole('button', { name: tr('common.next') }));
      await screen.findByText(tr('guest.oci.consent_q'));
      expect(mockControl.state.notes).toEqual(['Late flight']);
    });
  }
});

describe('V5-46 – note of a guest request (createGuestRequest.note)', () => {
  async function openOther(locale: GuestLocale) {
    if (locale !== 'vi') {
      mockControl.state.locale = locale;
      mockControl.state.localeChosen = true;
    }
    const tr = (k: string) => translateGuest(locale, k);
    const r = openLink(`/g/${MOCK_TOKENS.inHouse}`);
    await r.user.click(await screen.findByRole('button', { name: tr('guest.tab.requests') }));
    await r.user.click(await screen.findByRole('button', { name: tr('gw.req.new') }));
    await r.user.click(
      await screen.findByRole('button', { name: new RegExp(`^${tr('guest.req.other')}`) }),
    );
    return { ...r, tr };
  }

  for (const locale of ['vi', 'en', 'ru'] as const) {
    it(`${locale.toUpperCase()}: an ID number in the note → the ID sentence, the request is not created`, async () => {
      const { user, tr } = await openOther(locale);
      await user.type(screen.getByLabelText(tr('gw.req.note_label')), `My passport ${FAKE_ID}`);
      await user.click(screen.getByRole('button', { name: tr('guest.req.send') }));
      expect(
        await screen.findByText(ID_SENTENCE[locale], { selector: '.txt, .txt *' }),
      ).toBeInTheDocument();
      expect(mockControl.state.requests).toEqual([]);
      expect(
        screen.queryByText(tr('gw.req.note_required'), { selector: '.txt, .txt *' }),
      ).toBeNull();
    });
  }

  it('the field code alone (requestFail scenario) gives the same sentence', async () => {
    const { user, tr } = await openOther('vi');
    await user.type(screen.getByLabelText(tr('gw.req.note_label')), 'Cho tôi hỏi giờ ăn sáng');
    mockControl.scenario.requestFail = 'ID_NUMBER_DETECTED';
    await user.click(screen.getByRole('button', { name: tr('guest.req.send') }));
    expect(
      await screen.findByText(ID_SENTENCE.vi, { selector: '.txt, .txt *' }),
    ).toBeInTheDocument();
  });

  it('FB-R5-ARC-FE-107-01: the base mock answers a card number like the server (top-level CARD_NUMBER_DETECTED) → the card sentence', async () => {
    const { user, tr } = await openOther('vi');
    await user.type(screen.getByLabelText(tr('gw.req.note_label')), 'Cho tôi hỏi giờ ăn sáng');
    mockControl.scenario.requestFail = 'CARD_NUMBER_DETECTED';
    const seen: unknown[] = [];
    const on = ({ response }: { response: Response }) => {
      if (new URL(response.url).pathname.endsWith('/v1/guest/requests') && response.status === 422)
        void response
          .clone()
          .json()
          .then((b: unknown) => seen.push(b));
    };
    server.events.on('response:mocked', on);
    try {
      await user.click(screen.getByRole('button', { name: tr('guest.req.send') }));
      expect(
        await screen.findByText(tr('gw.req.card_detected'), { selector: '.txt, .txt *' }),
      ).toBeInTheDocument();
      expect(seen[0]).toMatchObject({
        code: 'CARD_NUMBER_DETECTED',
        errors: [{ field: 'note', code: 'CARD_NUMBER_DETECTED' }],
      });
    } finally {
      server.events.removeListener('response:mocked', on);
    }
    expect(mockControl.state.requests).toEqual([]);
  });

  it('guest-portal shape for a card number (top-level code CARD_NUMBER_DETECTED) → the card sentence, not "server error"', async () => {
    server.use(
      http.post('*/v1/guest/requests', () =>
        HttpResponse.json(
          {
            type: '/problems/card-number-detected',
            title: 'CARD_NUMBER_DETECTED',
            status: 422,
            code: 'CARD_NUMBER_DETECTED',
            requestId: 'req-mock',
            errors: [{ field: 'note', code: 'CARD_NUMBER_DETECTED' }],
          },
          { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
    const { user, tr } = await openOther('vi');
    await user.type(screen.getByLabelText(tr('gw.req.note_label')), 'Cho tôi hỏi giờ ăn sáng');
    await user.click(screen.getByRole('button', { name: tr('guest.req.send') }));
    expect(
      await screen.findByText(tr('gw.req.card_detected'), { selector: '.txt, .txt *' }),
    ).toBeInTheDocument();
  });
});
