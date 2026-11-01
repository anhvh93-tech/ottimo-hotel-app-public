// Simplified Chinese run-time strings of the booking form – CPY rounds/round-04/outputs/CPY/lp-v2-copy.md sections 2.2
// and 4 (01/11/2026). Full-width punctuation; hotline in sentences = the international number (CPY 1.3).
// Native-speaker review pending (SEC D4).
import type { BookingStrings } from './types';

const dur = (m: number) => (m % 60 === 0 ? `${m / 60} 小时` : `${m} 分钟`);

const strings: BookingStrings = {
  chName: { zalo: 'Zalo', whatsapp: 'WhatsApp', phone: '电话' },
  thanks: (name) => `${name}，感谢您。这是预订申请，尚未确认预订。`,
  next: {
    zalo: '如需最快回复，请打开 Zalo，将此编号发给我们。',
    whatsapp: '我们将通过 WhatsApp 联系您。',
    phone: '我们将致电您。',
    email: '我们将通过电子邮件回复您。',
  },
  when: {
    withinMinutes: (m, open, close) => `我们将在 ${dur(m)}内回复（${open}–${close}，大叻时间）。`,
    nextMorning: (by, open) => `前台 ${open} 开始服务，我们会在 ${by} 前回复您。`,
    callNow: (m) => `您今晚抵达，我们将在 ${m} 分钟内联系您。`,
  },
  fallback: ['如果到 ', ' 仍未收到我们的消息，请致电 ', '，或在 Zalo 上将此编号发给我们。'],
  // U+00A0: the number never leaves its word (CPY 13.5, FB-R4-UXD-FE-04)
  nights: (n) => `${n}\u00a0晚`,
  roomHint: (lo, hi) =>
    lo
      ? `可住 ${lo}–${hi} 人。较大的人数含加住一人（睡沙发，或 Premium 房型的 1.4 米加床），已含在报价中。`
      : '我们会根据人数为您推荐合适的房型。',
  longHint: (n) => `${n}\u00a0晚。我们将按长住价格为您报价。`,
  summary: (n) => `请检查 ${n} 项内容`,
  e: {
    inReq: '请选择入住日期。',
    outReq: '请选择退房日期。',
    arrReq: '请选择抵达日期。',
    range: (max) => `请选择今天至 ${max} 之间的日期。`,
    order: '退房日期须晚于入住日期。',
    cap: (n) =>
      `此房型最多可住 ${n} 人（6 岁以下儿童不计）。请选择更大的房型，或选择“请为我推荐”。`,
    name: '请填写您的姓名。',
    phone: (c) => `请输入可以联系到您的 ${c} 号码。`,
    email: '请输入有效的电子邮箱，例如 name@example.com。',
    card: '请从备注中删除银行卡号。',
    consent: '请勾选同意，以便我们回复您。',
    idNumber: '此步骤无需提供证件号码，请将其删除。',
    phoneCountry: '请检查号码。非越南号码请以 + 和国家代码开头。',
    server: '请检查此项。',
  },
  net: {
    network: '申请未能发送。请检查网络后重试，或通过 Zalo 联系我们。',
    busy: '目前申请较多。请通过 Zalo 联系我们，或致电 +84 84 444 0909。',
    rate: '此网络发送的申请过多。请稍后再试，或通过 Zalo 联系我们。',
  },
  notReady: ['在线申请暂时关闭。请通过 ', ' 联系我们，或致电 ', '。我们会尽快回复。'],
  reload: '页面已更新。请刷新页面后重新发送申请。',
  sending: '正在发送…',
  notSent: '预览：此申请未发送。请通过 Zalo 联系我们。',
  estimate: {
    label: '预估价格',
    // CPY lp-v2-copy 14.1 (BUG-R4-003)
    final: '尚未为您保留房间。最终价格及是否有房，以我们发送的报价为准。',
    guests: (n) => `适用于 ${n}\u00a0位客人。`,
    prompt: '选择房型和日期，即可查看预估价格。',
    anyRoom: '选择房型即可查看预估价格；也可由我们在报价中为您推荐。',
    loading: '正在计算价格…',
    total: (amount, nights) => `${nights}，共 ${amount}`,
    perNight: (amount) => `平均每晚约 ${amount}`,
    longStay: '已含长住优惠价。',
    unavailable: '所选日期暂无在线预估价格，我们会在报价中告知您。',
    error: '暂时无法获取预估价格，具体价格请以报价为准。',
    currency: '价格以越南盾（VND）计。',
    taxIn: '含税。',
    taxOut: '不含税。',
    extraGuest: '已含加住一人。',
    sentWith: '此预估价格将随申请一并发送。',
    live: (amount, nights) => `预估价格已更新：${nights}，共 ${amount}`,
    done: '预估价格',
    // CPY lp-v2-copy 13.3 (Lượt 3, 01/11): minimum stay, status line when the estimate goes away
    minStay: (n) =>
      `所选日期最少需入住 ${n}\u00a0晚。延长住宿即可查看预估价格；也可直接提交申请，由我们为您推荐合适的安排。`,
    liveCleared: '预估价格已清除。',
  },
  // ESC-043 (INV 01/11): by the month or from the BR-108 threshold (30 nights) – no figure (CPY lp-v2-copy 12.1)
  priceMonthlyOffer: {
    label: '长住专属优惠',
    text: '入住一个月或以上，我们会根据您的日期准备专属价格，随报价一并发送给您。',
    // CPY lp-v2-copy 13.2: spoken line of the offer (zh full stop "。", no digit)
    live: '长住专属优惠。入住一个月或以上，我们会根据您的日期准备专属价格，随报价一并发送给您。',
  },
};

export default strings;
