// FB-R4-SEC-FE-01: Δ5 (translation service) follows INV 01/11 question 9 – any Desk screen, reading AND replying – in
// the exact words of SEC, one paragraph per language. Text = SEC notice-2026-10-31-final section 2 (en/vi, = PR #21,
// lawyer-reviewed) and section 7 (ko/zh/ru third sentence "handles this text under its own privacy policy") – the
// L3 wording of the LP-v2 code review differed only in that third sentence (merge lp-v2-main, ARC 04/11). The old
// conditional sentence ("if you write in a language our team does not read…") is gone from every language.
import { describe, expect, it } from 'vitest';
import { PRIVACY_NOTICE } from './privacy';

const DELTA5 = {
  en: 'We may use a translation service, such as Google Translate, to read your request and reply to you. The text we translate may include your name, contact, stay details and message. The service handles this text under its own privacy policy, and its servers may be outside Viet Nam.',
  vi: 'OTTIMO có thể dùng một dịch vụ dịch, như Google Dịch, để đọc yêu cầu và trả lời bạn. Nội dung được dịch có thể gồm tên, liên hệ, thông tin lưu trú và lời nhắn của bạn. Dịch vụ này xử lý nội dung đó theo chính sách riêng của họ, và máy chủ của họ có thể đặt ngoài Việt Nam.',
  ko: '요청 내용을 읽고 답변드리기 위해 Google 번역 같은 번역 서비스를 이용할 수 있습니다. 번역하는 내용에는 고객님의 성함, 연락처, 숙박 정보, 메시지가 포함될 수 있습니다. 이 서비스는 해당 내용을 자체 개인정보 처리방침에 따라 처리하며, 서버는 베트남 밖에 있을 수 있습니다.',
  zh: '我们可能会使用 Google 翻译等翻译服务来阅读您的申请并回复您。翻译的内容可能包括您的姓名、联系方式、入住信息和留言。该服务按其自身的隐私政策处理这些内容，其服务器可能位于越南境外。',
  ru: 'Мы можем пользоваться сервисом перевода, например Google Переводчиком, чтобы прочитать ваш запрос и ответить вам. Переводимый текст может включать ваше имя, контакт, сведения о проживании и сообщение. Этот сервис обрабатывает такой текст в соответствии со своей политикой конфиденциальности, и его серверы могут находиться за пределами Вьетнама.',
} as const;

describe('privacy notice Δ5 – SEC final text (2026-10-31 section 2 + 7), 5 languages', () => {
  for (const [l, text] of Object.entries(DELTA5) as [keyof typeof DELTA5, string][]) {
    it(`${l}: the Δ5 paragraph closes the section that names the other recipients`, () => {
      const sections = PRIVACY_NOTICE[l].sections;
      const all = sections.flatMap((s) => s.p);
      expect(all.filter((p) => p === text)).toHaveLength(1);
      const home = sections.find((s) => s.p.includes(text))!;
      expect(home.p.at(-1)).toBe(text);
      expect(all.join(' ')).not.toMatch(
        /language our team does not read|ngôn ngữ nhân viên|읽지 못하는 언어|无法阅读的语言|которого не знают/,
      );
    });
  }
});
