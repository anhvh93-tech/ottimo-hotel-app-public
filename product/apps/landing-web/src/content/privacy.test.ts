// FB-R4-SEC-FE-01: Δ5 (translation service) follows INV 01/11 question 9 – any Desk screen, reading AND replying – in
// the exact words of SEC (review of LP-v2 code, section 3 / L3), one paragraph per language. The old conditional
// sentence ("if you write in a language our team does not read…") is gone from every language.
import { describe, expect, it } from 'vitest';
import { PRIVACY_NOTICE } from './privacy';

const L3 = {
  en: 'We may use a translation service, such as Google Translate, to read your request and reply to you. The text we translate may include your name, contact, stay details and message. The service’s servers may be outside Viet Nam.',
  vi: 'OTTIMO có thể dùng một dịch vụ dịch, như Google Dịch, để đọc yêu cầu và trả lời bạn. Nội dung được dịch có thể gồm tên, liên hệ, thông tin lưu trú và lời nhắn của bạn. Máy chủ của dịch vụ này có thể đặt ngoài Việt Nam.',
  ko: '요청 내용을 읽고 답변드리기 위해 Google 번역 같은 번역 서비스를 이용할 수 있습니다. 번역하는 내용에는 고객님의 성함, 연락처, 숙박 정보, 메시지가 포함될 수 있습니다. 이 서비스의 서버는 베트남 밖에 있을 수 있습니다.',
  zh: '我们可能会使用 Google 翻译等翻译服务来阅读您的申请并回复您。翻译的内容可能包括您的姓名、联系方式、入住信息和留言。该服务的服务器可能位于越南境外。',
  ru: 'Мы можем пользоваться сервисом перевода, например Google Переводчиком, чтобы прочитать ваш запрос и ответить вам. Переводимый текст может включать ваше имя, контакт, сведения о проживании и сообщение. Серверы этого сервиса могут находиться за пределами Вьетнама.',
} as const;

describe('privacy notice Δ5 – SEC L3 text, 5 languages', () => {
  for (const [l, text] of Object.entries(L3) as [keyof typeof L3, string][]) {
    it(`${l}: the L3 sentence closes the section that names the other recipients`, () => {
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
