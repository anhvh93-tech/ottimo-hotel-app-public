// Korean run-time strings of the booking form – CPY rounds/round-04/outputs/CPY/lp-v2-copy.md sections 2.2 and 4
// (01/11/2026). Hotline in sentences = the international number (CPY 1.3). Native-speaker review pending (SEC D4).
import type { BookingStrings } from './types';

const dur = (m: number) => (m % 60 === 0 ? `${m / 60}시간` : `${m}분`);

const strings: BookingStrings = {
  chName: { zalo: 'Zalo', whatsapp: 'WhatsApp', phone: '전화' },
  thanks: (name) => `${name}님, 감사합니다. 아직 예약 확정이 아닌 예약 요청입니다.`,
  next: {
    zalo: '가장 빠른 답변을 원하시면 Zalo를 열어 이 번호를 보내 주세요.',
    whatsapp: 'WhatsApp으로 메시지 드리겠습니다.',
    phone: '전화드리겠습니다.',
    email: '이메일로 답변드리겠습니다.',
  },
  when: {
    withinMinutes: (m, open, close) =>
      `${dur(m)} 이내에 답변드립니다(${open}–${close}, 달랏 시간).`,
    nextMorning: (by, open) => `리셉션은 ${open}에 문을 엽니다. ${by} 전까지 답변드리겠습니다.`,
    callNow: (m) => `오늘 밤 도착하시니 ${m}분 이내에 연락드리겠습니다.`,
  },
  fallback: [
    '혹시 ',
    '까지 연락이 없으면 ',
    '로 전화하시거나, 요청 번호와 함께 Zalo로 메시지를 보내 주세요.',
  ],
  nights: (n) => `${n}박`,
  roomHint: (lo, hi) =>
    lo
      ? `${lo}–${hi}인. 큰 숫자는 한 명이 더 머무는 경우(소파, 또는 프리미엄 원베드룸의 1.4m 보조 침대)이며, 견적에 포함됩니다.`
      : '인원에 맞는 객실을 추천해 드립니다.',
  longHint: (n) => `${n}박. 장기 숙박 요금으로 견적을 드립니다.`,
  summary: (n) => `${n}개 항목을 확인해 주세요`,
  e: {
    inReq: '체크인 날짜를 선택해 주세요.',
    outReq: '체크아웃 날짜를 선택해 주세요.',
    arrReq: '도착 날짜를 선택해 주세요.',
    range: (max) => `오늘부터 ${max}까지의 날짜를 선택해 주세요.`,
    order: '체크아웃 날짜는 체크인 날짜 이후여야 합니다.',
    cap: (n) =>
      `이 객실은 최대 ${n}인까지 머물 수 있습니다(만 6세 미만 제외). 더 넓은 객실이나 "추천해 주세요"를 선택해 주세요.`,
    name: '이름을 알려 주세요.',
    phone: (c) => `연락 가능한 ${c} 번호를 입력해 주세요.`,
    email: 'name@example.com 형식으로 이메일을 입력해 주세요.',
    card: '메모에서 카드 번호를 지워 주세요.',
    consent: '답변을 드릴 수 있도록 동의란에 체크해 주세요.',
    idNumber: '이 단계에서는 신분증 번호가 필요하지 않습니다. 지워 주세요.',
    phoneCountry: '번호를 확인해 주세요. 베트남 외 번호는 +와 국가 번호로 시작해야 합니다.',
    server: '이 항목을 확인해 주세요.',
  },
  net: {
    network:
      '요청을 보내지 못했습니다. 연결 상태를 확인한 뒤 다시 시도하시거나 Zalo로 문의해 주세요.',
    busy: '지금 요청이 많습니다. Zalo로 문의하시거나 +84 84 444 0909로 전화해 주세요.',
    rate: '이 연결에서 요청이 너무 많이 전송되었습니다. 잠시 후 다시 시도하시거나 Zalo로 문의해 주세요.',
  },
  notReady: [
    '지금은 온라인 요청을 잠시 받지 않고 있습니다. ',
    '로 메시지를 보내시거나 ',
    '로 전화해 주세요. 최대한 빨리 답변드리겠습니다.',
  ],
  reload: '페이지가 업데이트되었습니다. 새로고침한 뒤 요청을 다시 보내 주세요.',
  sending: '보내는 중…',
  notSent: '미리보기: 이 요청은 전송되지 않았습니다. Zalo로 문의해 주세요.',
  estimate: {
    label: '예상 요금',
    final: '최종 요금은 보내 드리는 견적에서 확인하실 수 있습니다.',
    prompt: '객실과 날짜를 선택하시면 예상 요금을 보여 드립니다.',
    anyRoom:
      '객실을 선택하시면 예상 요금을 볼 수 있습니다. 고르기 어려우시면 견적과 함께 추천해 드립니다.',
    loading: '요금 확인 중…',
    total: (amount, nights) => `${nights} 기준 ${amount}`,
    perNight: (amount) => `1박 평균 약 ${amount}`,
    longStay: '장기 숙박 요금이 적용되었습니다.',
    unavailable:
      '선택하신 날짜는 온라인 예상 요금이 없습니다. 견적에서 요금을 안내해 드리겠습니다.',
    error: '지금은 예상 요금을 불러올 수 없습니다. 견적에서 요금을 안내해 드리겠습니다.',
    currency: '요금은 베트남 동(VND) 기준입니다.',
    taxIn: '세금 포함.',
    taxOut: '세금 별도.',
    extraGuest: '추가 인원 1명 포함.',
    sentWith: '이 예상 요금은 요청과 함께 전달됩니다.',
    live: (amount, nights) => `예상 요금이 변경되었습니다: ${nights} 기준 ${amount}`,
    done: '예상 요금',
  },
  // ESC-043 (INV 01/11): by the month or 28+ nights – no figure (CPY lp-v2-copy 12.1)
  priceMonthlyOffer: {
    label: '장기 숙박 특별 제안',
    text: '한 달 이상 머무신다면 일정에 맞춘 요금을 따로 준비해 드립니다. 보내 드리는 견적에서 확인하실 수 있습니다.',
  },
};

export default strings;
