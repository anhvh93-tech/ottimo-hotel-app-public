// Generates lp-v2-privacy-review.html (lawyer; ko/zh/ru readers may also read their column).
import { writeFileSync } from 'node:fs';
import { PRIVACY_NOTICE as P } from './content/privacy.ts';
import { PRIVACY_NOTICE as P21 } from './pr21/privacy.ts';
import { CSS, FONTS, esc, script, toolbar } from './common.mjs';

const OUT = process.argv[2];
const SRC = process.argv[3];
const LANGS = ['en', 'vi', 'ko', 'zh', 'ru'];
const HL = { en: 'en', vi: 'vi', ko: 'ko', zh: 'zh-Hans', ru: 'ru' };
const LBL = { en: 'EN – bản gốc', vi: 'VI', ko: 'KO – 한국어', zh: 'ZH – 简体中文', ru: 'RU – Русский' };

const copy = {};
const copy21 = {};
for (const l of LANGS) copy[l] = (await import(`./content/${l}.ts`))[l];
for (const l of ['en', 'vi']) copy21[l] = (await import(`./pr21/${l}.ts`))[l];

// SEC notice-2026-10-31-final.md section 7: ko/zh/ru third sentence of Δ5 for the new clause (not applied on lp-v2).
const SEC_D5 = {
  ko: '이 서비스는 해당 내용을 자체 개인정보 처리방침에 따라 처리하며, 서버는 베트남 밖에 있을 수 있습니다.',
  zh: '该服务按其自身的隐私政策处理这些内容，其服务器可能位于越南境外。',
  ru: 'Этот сервис обрабатывает такой текст в соответствии со своей политикой конфиденциальности, и его серверы могут находиться за пределами Вьетнама.',
};

// Build blocks: [{ id, h: {lang: heading}, paras: [{ id, t: {lang: text}, t21: {en, vi} | null }] }]
const blocks = [];
const head = (k) => Object.fromEntries(LANGS.map((l) => [l, P[l][k] ?? '']));
const head21 = (k) => ({ en: P21.en[k], vi: P21.vi[k] });
const hdrKeys = [
  ['title', 'Tiêu đề tab trình duyệt'],
  ['description', 'Mô tả trên kết quả tìm kiếm'],
  ['label', 'Nhãn nhỏ trên tiêu đề'],
  ['h1', 'Tiêu đề trang'],
  ['intro', 'Đoạn mở đầu'],
  ['translationNote', 'Câu ưu tiên bản dịch (chỉ trang ko/zh/ru)'],
  ['version', 'Dòng phiên bản cuối trang'],
  ['back', 'Nút về trang chủ'],
];
blocks.push({
  id: '0',
  title: 'Đầu trang và cuối trang',
  h: null,
  paras: hdrKeys.map(([k, where], i) => ({ id: `0.${i + 1}`, where, t: head(k), t21: k === 'translationNote' ? null : head21(k) })),
});
P.en.sections.forEach((s, si) => {
  blocks.push({
    id: String(si + 1),
    title: `${s.h} / ${P.vi.sections[si].h}`,
    h: Object.fromEntries(LANGS.map((l) => [l, P[l].sections[si].h])),
    h21: { en: P21.en.sections[si].h, vi: P21.vi.sections[si].h },
    paras: s.p.map((_, pi) => ({
      id: `${si + 1}.${pi + 1}`,
      t: Object.fromEntries(LANGS.map((l) => [l, P[l].sections[si].p[pi] ?? '(không có)'])),
      t21: { en: P21.en.sections[si].p[pi], vi: P21.vi.sections[si].p[pi] },
    })),
  });
});
const cf = (c) => c.book.form;
const nC = P.en.sections.length + 1;
blocks.push({
  id: String(nC),
  title: 'Chữ ô đồng ý trên form "Plan your stay" / Yêu cầu đặt phòng',
  h: null,
  paras: [
    ['consent', 'Câu cạnh ô tích (A.1)'],
    ['consentMore', 'Dòng nhỏ dưới ô tích (A.2)'],
    ['privacy', 'Nhãn link tới thông báo'],
  ].map(([k, where], i) => ({
    id: `${nC}.${i + 1}`,
    where,
    t: Object.fromEntries(LANGS.map((l) => [l, cf(copy[l])[k]])),
    t21: { en: cf(copy21.en)[k], vi: cf(copy21.vi)[k] },
  })),
});

// Differences lp-v2 vs PR #21 (en/vi)
const diffs = [];
for (const b of blocks) {
  if (b.h21) for (const l of ['en', 'vi']) if (b.h[l] !== b.h21[l]) diffs.push(`${b.id} tiêu đề (${l})`);
  for (const p of b.paras) {
    p.diff = p.t21 && ['en', 'vi'].some((l) => p.t21[l] !== undefined && p.t21[l] !== p.t[l]);
    if (p.diff) diffs.push(p.id);
  }
}
const nParas = blocks.reduce((a, b) => a + b.paras.length, 0);
const verLine = P.version;
const ver21 = P21.version;

const cell = (l, text) => `<div class="cell" lang="${HL[l]}"><div class="lng">${LBL[l]}</div>${esc(text)}</div>`;

const body = blocks
  .map((b) => {
    const headRow = b.h
      ? `<div class="para"><div class="pnum">§${b.id} – tiêu đề mục</div><div class="grid2">${cell('en', b.h.en)}${cell('vi', b.h.vi)}</div><div class="grid3">${cell('ko', b.h.ko)}${cell('zh', b.h.zh)}${cell('ru', b.h.ru)}</div></div>`
      : '';
    const paras = b.paras
      .map((p) => {
        const alt = (l) =>
          p.diff && p.t21[l] !== p.t[l]
            ? `<div class="cell alt" lang="${HL[l]}"><div class="lng">BẢN PR #21 – NHÃN ${esc(ver21.match(/\d{4}-\d{2}-\d{2}/)[0])} (SẼ ĐĂNG)</div>${esc(p.t21[l])}</div>`
            : '';
        const altT = (l) =>
          p.id === '6.4' && p.diff && SEC_D5[l]
            ? `<div class="cell alt" lang="${HL[l]}"><div class="lng">SEC ĐỀ XUẤT CHO VẾ MỚI – THAY CÂU THỨ BA, CHƯA ÁP, NGƯỜI BẢN XỨ CHƯA ĐỌC</div>${esc(SEC_D5[l])}</div>`
            : '';
        return `<div class="para" id="p${p.id}"><div class="pnum">§${p.id}${p.where ? ` – ${esc(p.where)}` : ''}${p.diff ? ' <span class="tag diff">Lệch PR #21</span>' : ''}</div>
<div class="grid2"><div>${cell('en', p.t.en)}${alt('en')}</div><div>${cell('vi', p.t.vi)}${alt('vi')}</div></div>
<div class="grid3"><div>${cell('ko', p.t.ko)}${altT('ko')}</div><div>${cell('zh', p.t.zh)}${altT('zh')}</div><div>${cell('ru', p.t.ru)}${altT('ru')}</div></div></div>`;
      })
      .join('\n');
    return `<h2 id="s${b.id}">§${b.id}. ${esc(b.title)}<span class="count">${b.paras.length} đoạn</span></h2>
${headRow}
${paras}
<div class="secbox"><label for="c${b.id}">Góp ý mục §${b.id}</label><textarea id="c${b.id}" data-id="§${b.id}" data-key="${esc(b.title)}" placeholder="Đồng ý, hoặc Sửa: … (ghi số đoạn, ví dụ §${b.id}.1)"></textarea></div>`;
  })
  .join('\n');

const QUESTIONS = [
  ['Q1', 'Khung pháp lý', 'Xin Luật sư xác nhận văn bản đang áp dụng cho thông báo này: Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, và văn bản thay thế hoặc hướng dẫn mới (nếu có hiệu lực vào thời điểm đăng). Nếu có điểm nào của thông báo cần sửa theo văn bản mới, xin ghi ở mục tương ứng.'],
  ['Q2', 'Bản dịch', 'Thông báo bằng tiếng Hàn, Trung giản thể, Nga có cần dịch thuật có chứng nhận hoặc công chứng không, hay người bản xứ đọc lại là đủ?'],
  ['Q3', 'Bản nào là bản chính', 'Trang ko/zh/ru có câu: "Đây là bản dịch. Nếu khác với bản tiếng Anh hoặc tiếng Việt, áp dụng bản tiếng Anh và tiếng Việt" (§0.6). (a) Có nên chỉ để tiếng Việt là bản chính? (b) Có cần câu ưu tiên giữa tiếng Anh và tiếng Việt trên trang en/vi không? (c) Câu này có bị coi là điều khoản bất lợi cho người tiêu dùng không?'],
  ['Q4', 'Thời hạn 180 ngày chỉ cho máy chủ', `Dòng dưới ô đồng ý (§${nC}.2) và §7.2 nói 180 ngày áp dụng cho máy chủ của OTTIMO; bản sao trong Google Chat được xóa khi không còn cần để trả lời hoặc khi khách yêu cầu (§6.3). Như vậy đã đủ rõ chưa?`],
  ['Q5', 'Dịch vụ dịch (Google Dịch)', 'Nhân viên có thể dùng dịch vụ dịch để đọc và trả lời yêu cầu; nội dung dịch có thể gồm tên, liên hệ, thông tin lưu trú, lời nhắn (§6.4). Bản phổ thông không có hợp đồng xử lý dữ liệu và OTTIMO không xóa được bản ở đó. (a) Câu "dịch vụ xử lý nội dung theo chính sách riêng của họ" (bản PR #21) đã đủ báo cho khách chưa? (b) Việc này có thuộc diện chuyển dữ liệu cá nhân ra nước ngoài cần đưa vào hồ sơ cùng Google Workspace không?'],
  ['Q6', 'Ô đồng ý', `Câu ở ô đồng ý (§${nC}.1) không nêu riêng việc gửi dữ liệu ra ngoài Việt Nam (Google Chat, dịch vụ dịch). Có cần sửa không? Nếu sửa, cả ô đồng ý và thông báo sẽ lên phiên bản mới.`],
  ['Q7', 'Luật nước ngoài', 'Có trang tiếng Trung, Nga, Hàn có làm OTTIMO thuộc phạm vi luật dữ liệu của các nước đó không (ví dụ Luật Bảo vệ thông tin cá nhân của Trung Quốc, Luật Liên bang 152-FZ của Nga, Luật Bảo vệ thông tin cá nhân của Hàn Quốc)? OTTIMO không có hiện diện ở các nước này, giá chỉ bằng VND, không quảng cáo nhắm các nước này trong đợt này.'],
];
const qHtml = QUESTIONS.map(
  ([id, t, q]) => `<div class="para"><div class="pnum">${id} – ${esc(t)}</div><p>${esc(q)}</p><textarea data-id="${id}" data-key="${esc(t)}" aria-label="Trả lời ${id}" placeholder="Đồng ý, hoặc Sửa: …"></textarea></div>`,
).join('\n');

const toc = blocks.map((b) => `<a href="#s${b.id}">§${b.id}. ${esc(b.title)}</a><br>`).join('\n');

const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>OTTIMO privacy notice review</title>
${FONTS}
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header class="top">
<p class="brand">OTTIMO BOUTIQUE STAY</p>
<h1>Thông báo xử lý dữ liệu – bản đọc duyệt<span class="sub" lang="en">Privacy notice for the booking request form – review copy</span></h1>
<p class="meta">Nguồn chữ: ${esc(SRC)} · ${blocks.length} mục, ${nParas} đoạn × 5 ngôn ngữ · Lập ngày 04/11/2026</p>
</header>

<section class="panel note">
<h3>Phiên bản và ngày hiệu lực</h3>
<ul>
<li><strong>Bản trong tệp này:</strong> nhãn <code>${esc(P.version)}</code> – <strong>nhãn tạm</strong> cho lượt LP-v2 (5 ngôn ngữ). SEC đặt nhãn cuối sau khi người bản xứ duyệt xong; nhãn cuối phải sau <code>2026-10-31</code>. Dòng phiên bản trên trang: "${esc(verLine)}".</li>
<li><strong>Ngày hiệu lực:</strong> chưa đăng. Có hiệu lực từ lúc OPS ghi phiên bản lên ottimo.vn, sau khi người bản xứ duyệt, Luật sư đồng ý và QA, QC đạt (quyết định của chủ đầu tư ngày 01/11: giá ước tính và ba ngôn ngữ lên cùng một lần).</li>
<li><strong>Đang chạy trên ottimo.vn:</strong> <code>2026-10-24</code> (en, vi).</li>
<li><strong>Chờ đăng trước:</strong> <code>2026-10-31</code> (en, vi) – PR #21, nhánh <code>fe-b/notice-2026-10-31</code>, chưa gộp.</li>
</ul>
</section>

<section class="panel note">
<h3>Phạm vi xin Luật sư xem</h3>
<ul>
<li><strong>Văn bản:</strong> thông báo xử lý dữ liệu cho biểu mẫu "Yêu cầu đặt phòng" (Plan your stay) trên website ottimo.vn, đăng ở trang privacy của từng ngôn ngữ; kèm chữ ô đồng ý trên biểu mẫu (§${nC}).</li>
<li><strong>Dữ liệu:</strong> chỉ dữ liệu khách tự nhập vào biểu mẫu (tên, một cách liên hệ, ngày ở, số khách theo nhóm tuổi, hạng phòng, lời nhắn) và dữ liệu kỹ thuật đi kèm (trang gửi, nhãn chiến dịch, địa chỉ IP mã hóa một chiều). Không gồm dữ liệu khách lưu trú (giấy tờ tùy thân, khai báo lưu trú, hóa đơn) – thuộc thông báo khác.</li>
<li><strong>Căn cứ đối chiếu:</strong> Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (xin Luật sư xác nhận văn bản đang áp dụng – câu Q1).</li>
<li><strong>Ngôn ngữ:</strong> tiếng Anh là bản gốc, tiếng Việt cùng giá trị. Tiếng Hàn, Trung giản thể, Nga là bản dịch do đội làm; người bản xứ đang đọc lại phần ngôn ngữ. Xin Luật sư xem nghĩa ở bản EN/VI và các câu hỏi Q1–Q7; phần ko/zh/ru để tham khảo.</li>
<li><strong>Cách đọc:</strong> mỗi đoạn có EN và VI cạnh nhau, ba bản dịch ở dưới. Cuối mỗi mục có ô góp ý. Trả lời "Đồng ý" hoặc "Sửa: …" và ghi số đoạn (ví dụ §6.4).</li>
</ul>
</section>

<section class="panel warn">
<h3>Lệch giữa bản LP-v2 và PR #21 – cho Luật sư và Điều phối</h3>
<p>Đã so từng ký tự EN/VI của bản trong tệp này với PR #21 (<code>fe-b/notice-2026-10-31</code>, thông báo <code>2026-10-31</code>, chữ SEC chốt ngày 01/11). Đoạn lệch: <strong>${diffs.map(esc).join(', ') || 'không có'}</strong>.</p>
<ol>
<li><strong>§6.4 – câu về dịch vụ dịch.</strong> PR #21 thêm một vế: EN "The service handles this text under its own privacy policy, and its servers may be outside Viet Nam." / VI "Dịch vụ này xử lý nội dung đó theo chính sách riêng của họ, và máy chủ của họ có thể đặt ngoài Việt Nam." Bản LP-v2 chưa có vế này, và <strong>bản ko/zh/ru đang dịch theo bản EN cũ</strong> (thiếu vế). Trong §6.4, bản PR #21 và câu ko/zh/ru SEC đã soạn cho vế mới hiện ở ô viền nâu. CPY không tự dịch lại.
<br><em>Đề xuất:</em> Luật sư đọc §6.4 theo bản PR #21 (bản sẽ đăng). Sau khi PR #21 gộp, FE-B lấy lại en/vi từ main cho LP-v2 và áp ba câu ko/zh/ru SEC đã soạn; người bản xứ đọc ba câu đó trong tệp này.</li>
<li><strong>§0.7 – nhãn phiên bản:</strong> LP-v2 <code>${esc(P.version)}</code> (nhãn tạm), PR #21 <code>2026-10-31</code>. Không phải lệch chữ; SEC đặt nhãn cuối.</li>
<li>Mọi đoạn khác của EN/VI (đầu trang, 11 mục) và chữ ô đồng ý (§${nC}) trùng từng ký tự giữa hai bản.</li>
<li>Thư mẫu gửi Luật sư trong tài liệu SEC LP-v2 (mục 8, câu 4) còn mô tả cách dùng dịch cũ ("chép riêng lời nhắn, không tên, không liên hệ"). Chữ đang dùng nay gồm tên, liên hệ, thông tin lưu trú và lời nhắn; câu Q5 dưới đây theo chữ mới.</li>
</ol>
</section>

<section class="panel">
<h3>Câu hỏi đề nghị Luật sư xem</h3>
${qHtml}
</section>

<section class="panel noprint">
<h3>Mục lục</h3>
<nav class="toc">
${toc}
</nav>
</section>

${toolbar('Vai trò hoặc tên viết tắt', 'ví dụ: Luật sư')}

${body}

<footer class="end">
<p>Tệp đọc duyệt, không phải trang công khai. Liên hệ và tên pháp nhân trong thông báo giữ đúng như trên website.</p>
<p>OTTIMO Boutique Stay · Đà Lạt · Việt Nam</p>
</footer>
</div>
<script>${script('ottimo-lp-v2-privacy-review', `OTTIMO – privacy notice review (${SRC})`)}</script>
</body>
</html>
`;
writeFileSync(`${OUT}/lp-v2-privacy-review.html`, html);
console.log('privacy blocks', blocks.length, 'paras', nParas, 'diffs', diffs);
