// Booking-request form behaviour (concept 5.1–5.4, mock v1.2.1 script) – loaded only where the form is rendered.
// SEC UXD-08: the form is in the HTML with `hidden` and no `action`; this module shows it. Nothing is stored in the
// browser (no cookie, no localStorage); the request number, name and dates never go into the URL or the title.
import { BOOKING_STRINGS } from './booking-strings';
import {
  REF_CODE,
  addDays,
  buildDraft,
  diffDays,
  fmtDate,
  looksLikeCard,
  overCapacity,
  promiseText,
  todayIn,
  validEmail,
  validPhone,
  type BookingPromise,
  type FormValues,
} from './booking-logic';
import {
  apiTransport,
  previewTransport,
  type FieldProblem,
  type Outcome,
  type Transport,
} from './booking-transport';

const form = document.getElementById('bk-form') as HTMLFormElement | null;
if (form) init(form);

function init(form: HTMLFormElement) {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const lang: 'en' | 'vi' = document.documentElement.lang === 'vi' ? 'vi' : 'en';
  const S = BOOKING_STRINGS[lang];
  const cfg = form.dataset;
  const tz = cfg.tz ?? 'Asia/Ho_Chi_Minh';
  const hours = {
    tz,
    open: cfg.open ?? '07:00',
    close: cfg.close ?? '22:00',
    withinMinutes: Number(cfg.promiseMinutes ?? 60),
    callNowMinutes: Number(cfg.callNowMinutes ?? 60),
  };
  const shortMax = Number(cfg.shortMax ?? 27);
  const status = $('bk-status');
  const TODAY = todayIn(tz, new Date());
  const MAX = addDays(TODAY, Number(cfg.windowDays ?? 365));

  // Same origin by default (`data-api` empty – the landing proxies /v1/public/…); the live build may name another
  // API origin, and CSP connect-src then allows exactly that origin (lib/booking-request.ts, scripts/headers.mjs).
  const apiBase = cfg.api ?? '';
  const transport: Transport =
    cfg.transport === 'api'
      ? apiTransport(`${apiBase}/v1/public/properties/${encodeURIComponent(cfg.property ?? '')}`, {
          fetch: (url, init) =>
            cfg.property ? fetch(url, init) : Promise.reject(new Error('no endpoint')),
          now: () => performance.now(),
          sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
          uuid: () => crypto.randomUUID(),
        })
      : previewTransport;

  form.hidden = false;
  for (const id of ['f-in', 'f-arr']) {
    $<HTMLInputElement>(id).min = TODAY;
    $<HTMLInputElement>(id).max = MAX;
  }
  $<HTMLInputElement>('f-out').min = addDays(TODAY, 1);
  // First touch: fetch the form token; if the property is not taking requests, say so before the guest types more.
  form.addEventListener(
    'focusin',
    () =>
      void transport.prepare().then((o) => {
        if (o) showOutcome(o);
      }),
    { once: true },
  );

  const checked = (name: string) =>
    (form.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement | null)?.value ?? '';
  const stayType = () => (checked('stayType') === 'long' ? 'long' : 'short');
  const channel = () => checked('preferredChannel') as FormValues['preferredChannel'];
  const note = $<HTMLTextAreaElement>('f-note');
  const room = $<HTMLSelectElement>('f-room');

  function updateNights() {
    const a = $<HTMLInputElement>('f-in').value;
    const b = $<HTMLInputElement>('f-out').value;
    const out = $('f-nights');
    if (stayType() !== 'short' || !a || !b || b <= a) {
      out.textContent = '';
      return;
    }
    const n = diffDays(a, b);
    out.textContent = n > shortMax ? S.longHint(n) : S.nights(n);
  }
  function syncStay() {
    const t = stayType();
    form.querySelectorAll<HTMLElement>('[data-stay]').forEach((el) => {
      const on = el.dataset.stay === t;
      el.hidden = !on;
      el.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select').forEach((i) => {
        i.disabled = !on;
      });
    });
    updateNights();
  }
  function syncChannel() {
    const c = channel();
    const mail = c === 'email';
    $('fld-phone').hidden = mail;
    $<HTMLInputElement>('f-phone').disabled = mail;
    $('fld-email').hidden = !mail;
    $<HTMLInputElement>('f-email').disabled = !mail;
    $<HTMLInputElement>('f-email').required = mail;
    form.querySelectorAll<HTMLElement>('.c-lab').forEach((s) => (s.hidden = s.dataset.k !== c));
  }
  function roomHint() {
    const o = room.selectedOptions[0];
    $('f-room-hint').textContent = S.roomHint(o?.dataset.min ?? null, o?.dataset.cap ?? null);
  }

  form
    .querySelectorAll<HTMLInputElement>('input[name="stayType"]')
    .forEach((r) => r.addEventListener('change', syncStay));
  form.querySelectorAll<HTMLInputElement>('input[name="preferredChannel"]').forEach((r) =>
    r.addEventListener('change', () => {
      syncChannel();
      if (form.dataset.validated === '1') validate(false);
    }),
  );
  $('f-in').addEventListener('change', () => {
    const a = $<HTMLInputElement>('f-in').value;
    if (!a) return;
    const out = $<HTMLInputElement>('f-out');
    out.min = addDays(a, 1);
    if (!out.value || out.value <= a) out.value = addDays(a, 2);
    updateNights();
  });
  $('f-out').addEventListener('change', updateNights);
  note.addEventListener(
    'input',
    () => ($('f-note-count').textContent = `${note.value.length} / 500`),
  );
  room.addEventListener('change', roomHint);
  // "Request this room" preselects the room type
  document.querySelectorAll<HTMLAnchorElement>('a[data-room]').forEach((a) =>
    a.addEventListener('click', () => {
      room.value = a.dataset.room ?? '';
      roomHint();
    }),
  );

  // ---- Validation (mirrors the contract; the server stays the authority) ----
  function errorIcon(): SVGSVGElement {
    const ns = 'http://www.w3.org/2000/svg';
    const el = (name: string, attrs: Record<string, string>) => {
      const node = document.createElementNS(ns, name);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
      return node;
    };
    const svg = el('svg', {
      viewBox: '0 0 16 16',
      'aria-hidden': 'true',
      focusable: 'false',
    }) as SVGSVGElement;
    svg.append(
      el('circle', {
        cx: '8',
        cy: '8',
        r: '7',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.5',
      }),
      el('path', {
        d: 'M8 4.5v4.2M8 10.8v.7',
        stroke: 'currentColor',
        'stroke-width': '1.5',
        'stroke-linecap': 'round',
      }),
    );
    return svg;
  }
  function setErr(inputId: string | null, errId: string, msg: string) {
    const el = $(errId);
    el.textContent = '';
    if (msg) {
      const span = document.createElement('span');
      span.textContent = msg;
      el.append(errorIcon(), span);
    }
    const input = inputId ? $(inputId) : null;
    if (input) {
      if (msg) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    return msg ? { id: inputId ?? errId, msg } : null;
  }
  const inWindow = (v: string) => v >= TODAY && v <= MAX;

  function validate(focus: boolean): boolean {
    const E = S.e;
    const errs: { id: string; msg: string }[] = [];
    const add = (x: { id: string; msg: string } | null) => {
      if (x) errs.push(x);
    };
    if (stayType() === 'short') {
      const a = $<HTMLInputElement>('f-in').value;
      const b = $<HTMLInputElement>('f-out').value;
      add(
        setErr('f-in', 'f-in-err', !a ? E.inReq : !inWindow(a) ? E.range(fmtDate(MAX, lang)) : ''),
      );
      add(setErr('f-out', 'f-out-err', !b ? E.outReq : a && b <= a ? E.order : ''));
      setErr('f-arr', 'f-arr-err', '');
    } else {
      const m = $<HTMLInputElement>('f-arr').value;
      add(
        setErr(
          'f-arr',
          'f-arr-err',
          !m ? E.arrReq : !inWindow(m) ? E.range(fmtDate(MAX, lang)) : '',
        ),
      );
      setErr('f-in', 'f-in-err', '');
      setErr('f-out', 'f-out-err', '');
    }
    const cap = room.selectedOptions[0]?.dataset.cap;
    const over = overCapacity(
      cap ? Number(cap) : null,
      Number($<HTMLSelectElement>('f-adults').value),
      Number($<HTMLSelectElement>('f-children').value),
    );
    add(setErr('f-room', 'f-guests-err', over && cap ? E.cap(cap) : ''));
    add(setErr('f-name', 'f-name-err', $<HTMLInputElement>('f-name').value.trim() ? '' : E.name));
    const c = channel();
    if (c === 'email') {
      add(
        setErr(
          'f-email',
          'f-email-err',
          validEmail($<HTMLInputElement>('f-email').value) ? '' : E.email,
        ),
      );
      setErr('f-phone', 'f-phone-err', '');
    } else {
      add(
        setErr(
          'f-phone',
          'f-phone-err',
          validPhone($<HTMLInputElement>('f-phone').value) ? '' : E.phone(S.chName[c]),
        ),
      );
      setErr('f-email', 'f-email-err', '');
    }
    add(setErr('f-note', 'f-note-err', looksLikeCard(note.value) ? E.card : ''));
    add(
      setErr(
        'f-consent',
        'f-consent-err',
        $<HTMLInputElement>('f-consent').checked ? '' : E.consent,
      ),
    );
    showSummary(errs, focus);
    return errs.length === 0;
  }

  function showSummary(errs: { id: string; msg: string }[], focus: boolean) {
    const sum = $('bk-summary');
    if (errs.length) {
      $('bk-summary-h').textContent = S.summary(errs.length);
      const ul = $('bk-summary-list');
      ul.textContent = '';
      for (const x of errs) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${x.id}`;
        a.textContent = x.msg;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          $(x.id).focus();
        });
        li.append(a);
        ul.append(li);
      }
      sum.hidden = false;
      if (focus) sum.focus();
    } else sum.hidden = true;
  }

  /**
   * 422 VALIDATION_FAILED from the server (`field` + `code` only – ARC-21): the same messages, at the same fields, as
   * the checks in the page. Returns false when no error belongs to a field of the form (→ generic message).
   */
  function showServerErrors(errors: FieldProblem[]): boolean {
    const E = S.e;
    const short = stayType() === 'short';
    const FIELD: Record<string, [string, string]> = {
      arrival: short ? ['f-in', 'f-in-err'] : ['f-arr', 'f-arr-err'],
      departure: ['f-out', 'f-out-err'],
      months: ['f-months', 'f-arr-err'],
      adults: ['f-adults', 'f-guests-err'],
      children: ['f-children', 'f-guests-err'],
      infants: ['f-infants', 'f-guests-err'],
      roomType: ['f-room', 'f-guests-err'],
      guestName: ['f-name', 'f-name-err'],
      phone: ['f-phone', 'f-phone-err'],
      email: ['f-email', 'f-email-err'],
      note: ['f-note', 'f-note-err'],
      consent: ['f-consent', 'f-consent-err'],
    };
    const REQUIRED: Record<string, string> = {
      arrival: short ? E.inReq : E.arrReq,
      departure: E.outReq,
      guestName: E.name,
      phone: E.phone(S.chName[channel() === 'email' ? 'phone' : (channel() as 'zalo')]),
      email: E.email,
      consent: E.consent,
    };
    const message = (fe: FieldProblem): string => {
      switch (fe.code) {
        case 'ID_NUMBER_DETECTED':
          return E.idNumber;
        case 'CARD_NUMBER_DETECTED':
          return E.card;
        case 'PHONE_INVALID':
        case 'PHONE_COUNTRY_CODE_REQUIRED':
          return E.phoneCountry;
        case 'EMAIL_INVALID':
          return E.email;
        case 'DATE_IN_PAST':
        case 'OUTSIDE_BOOKING_WINDOW':
          return E.range(fmtDate(MAX, lang));
        case 'DATE_ORDER':
          return E.order;
        case 'CONSENT_REQUIRED':
          return E.consent;
        case 'REQUIRED':
          return REQUIRED[fe.field] ?? E.server;
        default:
          return E.server;
      }
    };
    const errs: { id: string; msg: string }[] = [];
    const seen = new Set<string>();
    for (const fe of errors) {
      const target = FIELD[fe.field];
      if (!target || seen.has(target[1])) continue;
      seen.add(target[1]);
      const x = setErr(target[0], target[1], message(fe));
      if (x) errs.push(x);
    }
    showSummary(errs, true);
    return errs.length > 0;
  }

  /** Text with the Zalo link and the hotline link – "… message us on [Zalo] or call [08.4444.0909]." */
  function notReadyLine(): (string | HTMLAnchorElement)[] {
    const zalo = document.createElement('a');
    zalo.className = 'link-in';
    zalo.href = cfg.zalo ?? '';
    zalo.textContent = 'Zalo';
    const tel = document.createElement('a');
    tel.className = 'link-in';
    tel.href = cfg.hotlineTel ?? '';
    tel.textContent = cfg.hotline ?? '';
    return [S.notReady[0], zalo, S.notReady[1], tel, S.notReady[2]];
  }

  /** Every answer except "accepted" ends here: role=alert announces it; focus stays where it is. */
  function showOutcome(outcome: Outcome) {
    status.textContent = '';
    if (outcome.kind === 'not-ready') {
      status.append(...notReadyLine());
      return;
    }
    if (outcome.kind === 'invalid' && showServerErrors(outcome.errors)) return;
    status.textContent =
      outcome.kind === 'not-sent'
        ? S.notSent
        : outcome.kind === 'reload'
          ? S.reload
          : outcome.kind === 'busy'
            ? S.net.busy
            : outcome.kind === 'rate'
              ? S.net.rate
              : S.net.network;
  }
  form.addEventListener('input', () => {
    if (form.dataset.validated === '1') validate(false);
  });

  function values(): FormValues {
    return {
      stayType: stayType(),
      checkIn: $<HTMLInputElement>('f-in').value,
      checkOut: $<HTMLInputElement>('f-out').value,
      arrival: $<HTMLInputElement>('f-arr').value,
      months: $<HTMLSelectElement>('f-months').value,
      adults: Number($<HTMLSelectElement>('f-adults').value),
      children: Number($<HTMLSelectElement>('f-children').value),
      infants: Number($<HTMLSelectElement>('f-infants').value),
      roomType: room.value,
      guestName: $<HTMLInputElement>('f-name').value,
      preferredChannel: channel(),
      phone: $<HTMLInputElement>('f-phone').value,
      email: $<HTMLInputElement>('f-email').value,
      note: note.value,
      consent: $<HTMLInputElement>('f-consent').checked,
      website: $<HTMLInputElement>('f-website').value,
      locale: lang,
      search: location.search,
      pathname: location.pathname,
      referrer: document.referrer,
      ownHost: location.hostname,
      consentVersion: cfg.consentVersion ?? '',
    };
  }

  // ---- Submit ----
  const btn = $<HTMLButtonElement>('bk-submit');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    form.dataset.validated = '1';
    status.textContent = '';
    if (!validate(true)) return;
    const v = values();
    const label = btn.textContent ?? '';
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;
    btn.textContent = S.sending;
    let outcome: Outcome;
    try {
      outcome = await transport.send(buildDraft(v));
    } catch {
      outcome = { kind: 'network' };
    }
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
    btn.textContent = label;
    if (outcome.kind !== 'accepted') {
      showOutcome(outcome);
      return;
    }
    showDone(v, outcome.refCode, outcome.promise);
  });

  function showDone(v: FormValues, refCode: string, promise: BookingPromise) {
    $('bk-done-msg').textContent = S.thanks(v.guestName.trim());
    $('bk-done-next').textContent = S.next[v.preferredChannel];
    const p = promiseText(promise, S.when, hours);
    $('bk-done-when').textContent = p.when;
    // SEC UXD-05: a way out if nobody replies – time of the public promise, never replyBy.
    const fb = $('bk-done-fallback');
    const tel = document.createElement('a');
    tel.className = 'link-in';
    tel.href = cfg.hotlineTel ?? '';
    tel.textContent = cfg.hotline ?? '';
    fb.textContent = '';
    fb.append(S.fallback[0] + p.by + S.fallback[1], tel, S.fallback[2]);
    const arrival = v.stayType === 'short' ? v.checkIn : v.arrival;
    $('bk-done-tonight').hidden = !(p.callNow || arrival === TODAY);
    $('bk-open-zalo').hidden = v.preferredChannel !== 'zalo';
    // two spans, no separator character: a copied code is exactly what Desk searches for (SEC UXD-07)
    const ref = $('bk-ref');
    ref.textContent = '';
    const code = REF_CODE.test(refCode) ? refCode : '';
    for (const g of [code.slice(0, 4), code.slice(4)]) {
      const s = document.createElement('span');
      s.textContent = g;
      ref.append(s);
    }
    form.hidden = true;
    $('bk-done').hidden = false;
    $('bk-done-h').focus();
  }

  $('bk-again').addEventListener('click', () => {
    form.reset();
    form.dataset.validated = '0';
    syncStay();
    syncChannel();
    roomHint();
    form.querySelectorAll('.err').forEach((e) => (e.textContent = ''));
    form.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
    $('bk-summary').hidden = true;
    $('f-note-count').textContent = '0 / 500';
    $('bk-done').hidden = true;
    form.hidden = false;
    $('f-in').focus();
  });

  syncStay();
  syncChannel();
  roomHint();
}
