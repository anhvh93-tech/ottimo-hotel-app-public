/**
 * V-09 / SR-LOG-04 – one card / ID-number detector for the website form and the Google Chat text (BUG-R3-058,
 * SEC FB-R3-SEC-BE-GCHAT-07, QA FB-R3-QA-BE-GCHAT-06, SEC lp-v2-privacy-and-api 10). Units without a database.
 * Fake data only: CCCD 079203012345, CMND 123456789, Luhn test card 4111…, passport C1234567, phones 0905 111 222;
 * Korean / Chinese / Russian numbers are BUILT here from made-up parts.
 */
import { describe, expect, it } from 'vitest';
import {
  looksLikeCard,
  looksLikeIdNumber,
  looksLikeSensitiveNumber as formRule,
  sensitiveNumberKind,
} from '../src/modules/public-site/internal/website-request-rules';
import {
  CHAT_ID_REPLACEMENT,
  chatSafeText,
  looksLikeSensitiveNumber,
} from '../src/modules/public-site/public/chat-message';

const note = (s: string) => chatSafeText(s, { maxChars: 500, singleLine: false });
const name = (s: string) => chatSafeText(s, { maxChars: 80, singleLine: true, plain: true });
/** The form's guest name is collapsed to one line before the check (public-booking.service). */
const formName = (s: string) => s.replace(/\s+/g, ' ');

const CCCD = '079203012345';
const each = (digits: string, sep: string) => digits.split('').join(sep);
const groups = (sep: string) => ['079', '203', '012', '345'].join(sep);
const cardGroups = (sep: string) => ['4111', '1111', '1111', '1111'].join(sep);

/** Korean resident registration number shape, made up: YYMMDD-SNNNNNN. */
const koreanRrn = (sep: string) => `${'90'}${'01'}${'01'}${sep}${'1'}${'234567'}`;
/** Chinese resident ID shape, made up: region + YYYYMMDD + sequence + ISO 7064 MOD 11-2 check character. */
function chineseId(seq = '123'): string {
  const body = `${'110101'}${'1990'}${'0307'}${seq}`;
  const w = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const sum = body.split('').reduce((s, d, i) => s + Number(d) * w[i]!, 0);
  return body + '10X98765432'[sum % 11]!;
}
/** A made-up Chinese ID whose check character is X (sequence chosen so the sum gives X). */
const chineseIdX = (() => {
  for (let n = 0; n < 1000; n += 1) {
    const id = chineseId(String(n).padStart(3, '0'));
    if (id.endsWith('X')) return id;
  }
  throw new Error('no X sequence');
})();

describe('one rule for the form and Chat (BUG-R3-058, QA FB-06: Chat and form must not disagree)', () => {
  it('Chat re-exports the very function the form rules use', () => {
    expect(looksLikeSensitiveNumber).toBe(formRule);
  });
});

describe('SEC GCHAT-07 – natural ways of writing that slipped through V-09', () => {
  it.each([
    ['ID next to another number', `CCCD ${CCCD} 2 người lớn`],
    ['grouped ID next to another number', `CCCD ${groups(' ')} 2 người`],
    ['a number before the ID', `Phòng 2 ${CCCD}`],
    ['dash with spaces', groups(' - ')],
    ['en dash (autocorrect)', groups('–')],
    ['em dash', groups('—')],
    ['U+2010 hyphen', groups('‐')],
    ['U+2011 non-breaking hyphen', groups('‑')],
    ['U+2212 minus', groups('−')],
    ['two spaces', groups('  ')],
    ['two spaces in a card', cardGroups('  ')],
    ['one group per line', groups('\n')],
    ['one group per line (CRLF)', groups('\r\n')],
    ['one group per line (U+2028)', groups('\u2028')],
    ['passport, small letter', 'Hộ chiếu c1234567'],
    ['passport, space after the letter', 'Hộ chiếu C 1234567'],
    ['passport, small letter and a space after a keyword', 'hộ chiếu c 1234567'],
    ['passport, keyword without accents', 'ho chieu b 12345678'],
  ])('%s → caught (form) and replaced (Chat)', (_n, s) => {
    expect(sensitiveNumberKind(s), s).not.toBeNull();
    expect(note(`Em gửi ${s} nhé`)).toBe(CHAT_ID_REPLACEMENT);
    expect(name(s)).toBe(CHAT_ID_REPLACEMENT);
  });
});

describe('QA FB-06 table 2d – also caught in the message (not only in the name)', () => {
  it.each([
    ['double underscores', '0790__12345678'],
    ['double underscores between groups', groups('__')],
    ['`_/` between groups', groups('_/')],
    ['card, one group per line', cardGroups('\n')],
    ['ID split over two lines', '079203\n012345'],
    ['middle dot', groups('·')],
    ['katakana middle dot', groups('・')],
    ['apostrophe in a card', cardGroups("'")],
    ['typographic apostrophe in a card', cardGroups('’')],
    ['U+034F combining grapheme joiner', groups('\u034f')],
    ['U+FE00 variation selector', groups('\ufe00')],
    ['VS16 inside the ID', `0790\ufe0f12345678`],
    [
      'keycap digits',
      CCCD.split('')
        .map((d) => `${d}\ufe0f\u20e3`)
        .join(''),
    ],
    [
      'combining tilde on every digit',
      CCCD.split('')
        .map((d) => `${d}\u0303`)
        .join(''),
    ],
    ['U+3164 Hangul filler', groups('\u3164')],
    ['U+2800 Braille blank', groups('\u2800')],
    ['%20 in a link', `https://pay.example/?c=${cardGroups('%20')}`],
    ['encoded ZWSP in a link', `https://pay.example/${groups('%E2%80%8B')}`],
    ['ideographic full stop', groups('。')],
    ['ideographic comma', groups('、')],
  ])('%s → caught (form) and replaced (Chat)', (_n, s) => {
    expect(sensitiveNumberKind(s), s).not.toBeNull();
    expect(note(`CCCD ${s} nhé`)).toBe(CHAT_ID_REPLACEMENT);
    expect(name(s)).toBe(CHAT_ID_REPLACEMENT);
  });
});

describe('BUG-R3-058 – the form refuses what Chat already masked (US-155 AC5)', () => {
  it.each([
    ['NBSP', groups('\u00a0')],
    ['narrow NBSP', groups('\u202f')],
    ['thin space', groups('\u2009')],
    ['ideographic space', groups('\u3000')],
    ['commas', groups(',')],
    ['slashes', groups('/')],
    ['underscores', groups('_')],
    ['underscores in a card', cardGroups('_')],
    ['commas in a card', cardGroups(',')],
    ['ZWSP', `0790\u200b12345678`],
    ['word joiner', groups('\u2060')],
    ['soft hyphen', `079203\u00ad012345`],
    ['BOM', groups('\ufeff')],
    ['full-width digits', '０７９２０３０１２３４５'],
    ['Arabic-Indic digits', '٠٧٩٢٠٣٠١٢٣٤٥'],
    ['Devanagari digits', '०७९२०३०१२३४५'],
    ['circled digits', '⓪⑦⑨②⓪③⓪①②③④⑤'],
    ['mathematical bold digits', '𝟎𝟕𝟗𝟐𝟎𝟑𝟎𝟏𝟐𝟑𝟒𝟓'],
    ['ZWSP between every digit', each(CCCD, '\u200b')],
    ['underscore between every digit', each(CCCD, '_')],
    ['underscore between every card digit', each('4111111111111111', '_')],
    ['CMND with ZWSP', `123\u200b456\u200b789`],
    ['passport with ZWSP', `B\u200b1234567`],
    ['full-width passport', 'Ｃ１２３４５６７'],
    ['control character between groups', groups('\u0007')],
  ])('%s → a kind (422 on the form)', (_n, s) => {
    expect(sensitiveNumberKind(s), s).not.toBeNull();
    expect(sensitiveNumberKind(formName(s)), s).not.toBeNull();
    expect(note(`CCCD ${s} nhé`)).toBe(CHAT_ID_REPLACEMENT);
  });

  it('the code is the card one for a card, the ID one for an ID number', () => {
    expect(sensitiveNumberKind(`the ${cardGroups('_')}`)).toBe('card');
    expect(sensitiveNumberKind(`the ${cardGroups('\n')}`)).toBe('card');
    expect(sensitiveNumberKind(`CCCD ${groups('–')}`)).toBe('id');
    expect(sensitiveNumberKind('Hộ chiếu c1234567')).toBe('id');
    expect(looksLikeCard(cardGroups('  '))).toBe(true);
    expect(looksLikeIdNumber(groups('  '))).toBe(true);
  });
});

describe('SEC lp-v2 10 – identity numbers of Korean, Chinese and Russian guests (numbers built here)', () => {
  it.each([
    ['Korean resident number with a dash', `주민등록번호 ${koreanRrn('-')}`],
    ['Korean resident number with a space', koreanRrn(' ')],
    ['Korean resident number in one group', koreanRrn('')],
    ['Korean resident number with an en dash', koreanRrn('–')],
    ['Chinese resident ID', `身份证 ${chineseId()}`],
    ['Chinese resident ID ending in X', `身份证 ${chineseIdX}`],
    ['Chinese resident ID ending in small x', chineseIdX.toLowerCase()],
    [
      'Chinese resident ID in groups',
      `${chineseIdX.slice(0, 6)} ${chineseIdX.slice(6, 14)} ${chineseIdX.slice(14)}`,
    ],
    [
      'Chinese resident ID, full-width digits',
      chineseId().replace(/\d/g, (d) => String.fromCharCode(0xff10 + Number(d))),
    ],
    ['Russian internal passport NN NN NNNNNN', `паспорт ${'45'} ${'06'} ${'123456'}`],
    ['Russian internal passport NNNN NNNNNN', `${'4506'} ${'123456'}`],
    ['Russian internal passport after the keyword, one group', `паспорт ${'4506123456'}`],
    ['Russian international passport (9 digits)', `${'75'} ${'1234567'}`],
    ['Korean passport (letter + 8 digits)', 'M12345678'],
    ['Chinese passport (two letters + 7 digits)', 'EA1234567'],
  ])('%s → caught (form) and replaced (Chat)', (_n, s) => {
    expect(sensitiveNumberKind(s), s).not.toBeNull();
    expect(note(s)).toBe(CHAT_ID_REPLACEMENT);
    expect(name(s)).toBe(CHAT_ID_REPLACEMENT);
  });
});

describe('not a card or an ID: phones, dates, times, amounts and counts stay (form accepts, Chat prints)', () => {
  it.each([
    'Gọi em số 0905 111 222 nhé',
    '0905111222',
    '0905.111.222',
    '0905-111-222',
    '0905_111_222',
    '0905–111–222',
    '+84 905 111 222',
    '+84905111222',
    '+84-905-111-222',
    '84905111222',
    '84 905 111 222',
    '(+84) 905-111-222',
    '(+84) 905 111 222',
    '+84 (0) 905 111 222',
    '０９０５１１１２２２',
    '0905111222 2 người',
    '+84 905 111 222 3 người',
    'Zalo 0905111222 hoặc 0283 822 1234',
    '0905 111 222, 0905 333 444',
    '0905.111.222, 0905 333 444',
    '0905111222 / 0912333444',
    '0905 111 222 - 0912 333 444',
    '0905111222\n0912333444',
    'Zalo: 0905 111 222\nWhatsApp: +84 912 333 444',
    '+82 10-1234-5678',
    '010-1234-5678',
    '+86 138 0013 8000',
    '138 0013 8000',
    '+7 912 345-67-89',
    '8 912 345-67-89',
    'Hotline 1900 545454',
    'Đến 12/11/2026, đi 15/11/2026, 2 người lớn 1 trẻ 5 tuổi',
    'Đến 12/11 - 15/11/2026, 2 phòng',
    'arrive 23.10.2026 leave 25.10.2026',
    'Ngày 23-10-2026 đến 25-10-2026',
    'Gọi sau 18:00 ngày 12.11',
    'arrive 23/10 25/10 around 22:30 or 22h30',
    'Ngân sách 1,500,000 đ/đêm',
    '1 500 000 đ/đêm',
    'budget 150 000 000 VND a month',
    'budget 100.000.000đ',
    'Ngân sách 100 000 000 - 150 000 000 đ/tháng',
    'Ngân sách 15 000 000 - 20 000 000 đồng/tháng',
    'budget $ 100 000 000',
    '예산 1 000 000 원',
    'Phòng 101, 102',
    'Phòng 2, 3 người, 1_2 tuổi',
    '2 adults 1 child 3 nights',
    'iPhone 15 Pro 256GB',
    'Mã yêu cầu 7K3P9QXA',
    'Mã đặt Agoda 1234567890',
    'Booking no 1234567',
    'Tôi ở 12345678 đêm',
    'Nguyễn Thị Ánh 👨\u200d👩\u200d👧',
    '안녕하세요, 2명 3박 예약하고 싶습니다',
    '我们2个人住3晚',
    'Здравствуйте, 2 взрослых, 3 ночи',
    // BUG-R4-016 (QA PR #24): currency before the number, ≥ 1 billion without a unit, `00` + country code
    '₫150,000,000',
    '₫ 150,000,000',
    'VND 150,000,000',
    'budget VND 150,000,000',
    'USD 150,000,000',
    'Ngân sách 1.500.000.000',
    'Ngân sách 1,500,000,000',
    'ngân sách 1 500 000 000',
    '0084 905 111 222',
    '00 84 905 111 222',
    // G2 (QA PR #24 5.1): budgets with thousands separators, no unit
    'Ngân sách 150,000,000',
    'budget 150,000,000 for 6 months',
    'tổng 120,000,000 cho 8 tháng',
    '100,000,000-150,000,000',
    'ngân sách 150.000.000',
    'VNĐ 150.000.000',
    // QA PR #24 3e: phones, dates, amounts and booking codes that must stay
    '0905 111 222 hoặc 0912 333 444',
    '(+84)905111222',
    '028 3822 1234',
    '(028) 3822 1234',
    'Hotline 1900 1234',
    '1800 5888 99',
    '8 (912) 345-67-89',
    '+1 (415) 555-0123',
    '+44 20 7946 0958',
    '+61 412 345 678',
    '+65 9123 4567',
    '+33 6 12 34 56 78',
    'WhatsApp +84 905 111 222, Zalo 0905 111 222',
    '12-15/11/2026',
    'từ 12.11 đến 15.11.2026',
    '2026-11-12 → 2026-11-15',
    'check-in 14:00, check-out 12h',
    '12/11/2026 14:00 – 15/11/2026 12:00',
    '12/11, 13/11, 14/11, 15/11',
    'bay VN1234 hạ cánh 13:45 ngày 12/11',
    '1.500.000đ/đêm',
    '1,500,000 VND',
    '150.000.000 đ',
    '150,000,000 VND',
    '150 000 000 VNĐ',
    '$1,200',
    'USD 1,200',
    '15 triệu/tháng',
    '100.000.000-150.000.000đ',
    'khoảng 150tr',
    '150.000.000 đồng',
    '150,000,000 VND/6 tháng',
    'budget 150,000,000 vnd',
    'REQ-7K3P9QXA',
    'Booking.com 4012.345.678',
    'Booking.com 4012345678 PIN 1234',
    'Traveloka 1234567890',
    'Airbnb HMABCD1234',
    'Xuất hóa đơn MST 0312345678',
  ])('%s', (s) => {
    expect(sensitiveNumberKind(s), s).toBeNull();
    // A name is one line: two phones on two lines are not a name (their one-line form is the accepted case below).
    if (!s.includes('\n')) expect(sensitiveNumberKind(formName(s)), s).toBeNull();
    expect(note(s)).not.toBe(CHAT_ID_REPLACEMENT);
  });

  it('a phone the guest typed is printed as typed', () => {
    expect(note('Gọi (+84) 905-111-222 sau 18:00')).toBe('Gọi (+84) 905-111-222 sau 18:00');
    expect(note('0905111222 2 người')).toBe('0905111222 2 người');
  });
});

describe('currency words only next to an amount', () => {
  it('a word starting with đ / tr / k after an ID is not a currency', () => {
    for (const s of [
      `CCCD ${CCCD} đến ngày 12/11`,
      `CCCD ${CCCD} trẻ em đi cùng`,
      `CMND 123 456 789 khách 2`,
    ]) {
      expect(sensitiveNumberKind(s), s).toBe('id');
    }
  });
  it('an ID before a range of amounts is still read', () => {
    expect(sensitiveNumberKind(`CCCD ${CCCD} 2 người, 15 000 000 - 20 000 000 đ`)).toBe('id');
  });
  it.each([
    ['`đồng ý` is not a currency', `CCCD ${CCCD} đồng ý nhận phòng sớm`],
    ['a bare `dong` is not a currency', `số ${CCCD} dong`],
    ['a currency only excuses an amount ending in 000 (G3)', `CCCD ${CCCD} - 500k`],
    ['nor a currency before it', `VND ${CCCD}`],
    ['an encoded `+` is not a phone prefix', `%2B${CCCD}`],
    ['an encoded `+` with a space', `%2B ${groups(' ')}`],
  ])('SEC PR24-02: %s', (_n, s) => {
    expect(sensitiveNumberKind(s), s).toBe('id');
    expect(note(s)).toBe(CHAT_ID_REPLACEMENT);
  });
  it('an ID next to an amount with thousands separators is still read', () => {
    expect(sensitiveNumberKind(`CCCD ${groups('-')} 150,000,000`)).not.toBeNull();
    expect(sensitiveNumberKind(`${CCCD} 1.500.000.000`)).not.toBeNull();
  });
  it('a CCCD of province 001/008 is not read as an international `00` prefix', () => {
    for (const s of ['001203012345', '001 203 012 345', '008212345678', '0082 1234 5678']) {
      expect(sensitiveNumberKind(s), s).toBe('id');
    }
  });
});

describe('SEC FB-R4-SEC-BE-PR24-01 – Russian `№` and the new Korean passport', () => {
  it.each([
    ['серия 45 06 № 123456', `серия ${'45'} ${'06'} № ${'123456'}`],
    ['паспорт 45 06 № 123456', `паспорт ${'45'} ${'06'} № ${'123456'}`],
    ['4506 № 123456', `${'4506'} № ${'123456'}`],
    ['серия 4506 номер 123456', `серия ${'4506'} номер ${'123456'}`],
    ['серия, one group', `серия ${'4506123456'}`],
    ['Korean passport, new model', `${'M'}${'123'}${'A'}${'4567'}`],
    ['Korean passport, new model after the keyword', `여권 ${'M'}${'123'}${'A'}${'4567'}`],
    ['Korean passport, small letters after the keyword', `passport ${'m'}${'123'}${'a'}${'4567'}`],
  ])('%s → caught (form) and replaced (Chat)', (_n, s) => {
    expect(sensitiveNumberKind(s), s).toBe('id');
    expect(note(s)).toBe(CHAT_ID_REPLACEMENT);
    expect(name(s)).toBe(CHAT_ID_REPLACEMENT);
  });
});

describe('over-masking accepted by SEC (lượt 3: fails safe, Desk keeps the original)', () => {
  it.each([
    ['two phones joined by one space', '0905111222 0912333444'],
    ['three room numbers', '201,202,203'],
    ['a 9-digit number without separators or currency', '150000000'],
    ['a Chinese phone with its country code but no +', '86 138 0013 8000'],
    ['a Russian phone with a leading 8, spaces only', '8 912 345 67 89'],
  ])('%s → masked', (_n, s) => {
    expect(sensitiveNumberKind(s)).not.toBeNull();
  });
});

describe('SEC lp-v2 10 – links in the new scripts are inert in Chat', () => {
  it.each([
    ['ideographic full stop', 'evil。com/login', 'evil[.]com/login'],
    ['full-width full stop', 'evil．com', 'evil[.]com'],
    ['half-width ideographic full stop', 'evil｡com', 'evil[.]com'],
    ['full-width scheme', 'ｈｔｔｐｓ：／／evil．com', 'ｈｔｔｐｓ[:]//evil[.]com'],
    ['Cyrillic look-alike domain', 'оttimo.vn/pay', 'оttimo[.]vn/pay'],
    ['punycode domain', 'xn--80ak6aa92e.com', 'xn--80ak6aa92e[.]com'],
    ['Hangul domain', '오티모.com', '오티모[.]com'],
    ['Chinese domain with ideographic dot', '奥蒂莫。中国', '奥蒂莫[.]中国'],
  ])('%s', (_n, s, out) => {
    expect(note(s)).toBe(out);
  });

  it('full-width and small angle brackets cannot form a mention', () => {
    expect(name('＜users/all＞')).toBe('‹users/all›');
    expect(name('﹤users/all﹥')).toBe('‹users/all›');
    expect(note('＜https://evil.example|Mở Desk＞')).toBe('‹https[:]//evil[.]example|Mở Desk›');
  });
});

describe('cost', () => {
  it('a 500-character message of digits and marks is checked quickly', () => {
    const inputs = [
      '1 '.repeat(250),
      '1'.repeat(500),
      '12\n'.repeat(166),
      '1_'.repeat(250),
      `${'١'.repeat(250)}${'\u0303'.repeat(250)}`,
      '%20'.repeat(166),
    ];
    const t0 = performance.now();
    for (const s of inputs) sensitiveNumberKind(s);
    expect(performance.now() - t0).toBeLessThan(500);
  });
});
