// Generates lp-v2-<lang>-review.html for native-speaker review (ko, zh, ru).
import { writeFileSync } from 'node:fs';
import { buildRows } from './rows.mjs';
import { CSS, FONTS, esc, script, toolbar } from './common.mjs';

const OUT = process.argv[2];
const SRC = process.argv[3]; // e.g. "lp-v2 @ 93c549ea (1 Nov 2026)"
const TODAY = '4 November 2026';

const L = {
  ko: {
    name: 'Korean', native: '한국어', htmlLang: 'ko',
    title: 'OTTIMO website – Korean translation review',
    sub: 'OTTIMO 웹사이트 – 한국어 번역 검토',
    col: 'Korean (한국어)',
    intro: `<p>검토해 주셔서 감사합니다.</p>
<p>OTTIMO Boutique Stay는 베트남 달랏의 조용한 언덕에 있는 부티크 스테이로, 며칠부터 몇 달까지 머무를 수 있습니다. 문장은 짧고, 정중하고, 차분하게 씁니다. 느낌표와 이모지는 쓰지 않습니다. 호텔 체인이나 아파트 임대처럼 들리는 표현이 있으면 알려 주세요.</p>
<ol>
<li>각 줄의 한국어를 손님의 입장에서 읽고 영어 원문과 비교해 주세요.</li>
<li>틀리거나 어색하거나 기계 번역처럼 들리는 줄은 Comments 칸에 고친 문장이나 의견을 적어 주세요. 문제가 없는 줄은 비워 두시면 됩니다.</li>
<li>Legal 표시가 있는 줄은 표현만 다듬어 주시고 의미는 바꾸지 말아 주세요. 의미는 변호사가 확인합니다.</li>
<li>Screen reader 표시가 있는 줄은 화면에 보이지 않고, 시각장애인용 프로그램이 읽어 주는 문장입니다.</li>
<li>{name}, {amount}, {date}, {time}, {holder}는 그대로 두세요. 시간, 퍼센트, 일수는 정해진 사실이므로 바꾸지 말아 주세요.</li>
</ol>
<p>보내는 방법: 칸에 입력한 뒤 Download comments를 눌러 파일을 보내 주시거나, 인쇄해서 손으로 적은 뒤 사진을 보내 주세요.</p>`,
    focus: [
      ['Core brand lines. Do they sound refined and natural? An alternative we considered for the first one: 머묾의 미학.', ['why.title', 'amenities.title']],
      ['"부티크 스테이" for "boutique stay": natural, or better to keep the Latin "Boutique Stay"?', ['hero.label', 'meta.description', 'nav.why']],
      ['Main button and booking section title: soft enough, not "book now"? Does the title sound forced?', ['actions.requestToBook', 'book.title']],
      ['This title plays on "한 달 살기". Does it sound like a rental advert?', ['why.long.title']],
      ['Room names in Hangul, or keep them in English?', [/^rooms\.items\.\d\.name$/]],
      ['Place names: the way Korean guidebooks and blogs write them?', ['location.intro', /^location\.rows\./]],
      ['Politeness level across the page and in the form messages: even? Too stiff?', [/^e\./, /^summary/]],
      ['"하우스키핑" or "객실 청소": which suits Korean guests better?', ['why.short.body', 'faq.items.1.q', 'faq.items.1.a.0', 'faq.items.0.a.0']],
    ],
  },
  zh: {
    name: 'Simplified Chinese', native: '简体中文', htmlLang: 'zh-Hans',
    title: 'OTTIMO website – Simplified Chinese translation review',
    sub: 'OTTIMO 网站 – 简体中文译文审阅',
    col: 'Chinese (简体中文)',
    intro: `<p>感谢您抽空审阅。</p>
<p>OTTIMO Boutique Stay 是一处位于越南大叻安静山坡上的精品住宿，可以住几晚，也可以住几个月。我们的文字简短、礼貌、从容，不用感叹号，也不用表情符号。如有词语听起来像连锁酒店或公寓出租，请告诉我们。</p>
<ol>
<li>请以客人的角度阅读每一行中文，并与英文原文对照。</li>
<li>如某行有错误、不自然或像机器翻译，请在 Comments 栏写下您的改法或意见。没有问题的行请留空。</li>
<li>标有 Legal 的行只请修改表达，不要改变意思；意思由我们的律师确认。</li>
<li>标有 Screen reader 的行不显示在页面上，由读屏软件朗读给视障访客，但也应读起来自然。</li>
<li>请保留 {name}、{amount}、{date}、{time}、{holder}。时间、百分比和天数是固定信息，请勿更改。</li>
</ol>
<p>如何发回：在栏中填写后，点击 Download comments，把文件发给转交本页的人；也可以打印后手写，再拍照发回。</p>`,
    focus: [
      ['Core brand lines. Refined, not clichéd?', ['why.title', 'amenities.title']],
      ['"精品住宿" for "boutique stay": does it read like "精品酒店" (a hotel)?', ['hero.label', 'meta.description']],
      ['Mixed room names (Chinese + Latin). Keep, or change? Does "套房" make guests think of a hotel suite?', [/^rooms\.items\.\d\.name$/, /^rooms\.items\.\d\.shortName$/]],
      ['"旅居一季": natural for guests from the mainland (the page is Simplified Chinese)?', [{ text: '旅居' }]],
      ['"订金" for the deposit: natural? (the lawyer also checks this word)', [{ text: '订金' }]],
      ['Place names: as written on Ctrip or Xiaohongshu?', ['location.intro', /^location\.rows\./]],
      ['Main button "咨询预订" and section label "官网直订": natural?', ['actions.requestToBook', 'book.label']],
      ['Full-width punctuation, and the single space between Chinese and Latin letters or numbers: does it look right?', ['estimate.guests(2)', 'book.steps.2.text', 'rooms.note']],
    ],
  },
  ru: {
    name: 'Russian', native: 'Русский', htmlLang: 'ru',
    title: 'OTTIMO website – Russian translation review',
    sub: 'Сайт OTTIMO — проверка перевода на русский',
    col: 'Russian (Русский)',
    intro: `<p>Спасибо, что согласились прочитать перевод.</p>
<p>OTTIMO Boutique Stay — спокойное место для проживания на тихом холме в Далате, Вьетнам: на несколько ночей или на несколько месяцев. Мы пишем коротко, вежливо и спокойно, без восклицательных знаков и эмодзи. Если какое-то слово звучит как сеть отелей или аренда квартиры, отметьте его.</p>
<ol>
<li>Прочитайте каждую строку на русском глазами гостя и сравните с английским оригиналом.</li>
<li>Если строка ошибочна, неестественна или звучит как машинный перевод, впишите свой вариант или замечание в поле Comments. Если всё в порядке, оставьте поле пустым.</li>
<li>В строках с пометкой Legal исправляйте только язык, не смысл: смысл проверяет наш юрист.</li>
<li>Строки с пометкой Screen reader не видны на странице: их зачитывает программа для незрячих посетителей. Они тоже должны звучать естественно.</li>
<li>Оставьте {name}, {amount}, {date}, {time}, {holder} без изменений. Время, проценты и сроки — это факты, их не меняйте.</li>
<li>Некоторые строки повторяются с разными числами (1, 2, 5, 21), чтобы проверить окончания.</li>
</ol>
<p>Как вернуть замечания: впишите их в поля, нажмите Download comments и отправьте файл тому, кто прислал вам эту страницу. Или распечатайте, напишите от руки и пришлите фото.</p>`,
    focus: [
      ['"The art of staying well": the current line may read as "the art of living well (in luxury)". Alternatives we considered: "Искусство неспешного пребывания", "Искусство жить в покое". Please choose or suggest.', ['why.title', 'amenities.title']],
      ['"Boutique stay" kept in Latin letters inside Russian text: acceptable, or is there a natural Russian phrase that does not use "отель"?', ['meta.description', 'hero.label']],
      ['"Номера" for rooms is standard but sounds like a hotel. Would "Комнаты" or another word be better?', ['nav.rooms', 'rooms.label', 'form.roomType']],
      ['Main button: clear and soft enough?', ['actions.requestToBook', 'book.title']],
      ['The two length-of-stay choices avoid "посуточно / помесячно" (they sound like flat rentals). Are they clear?', ['form.byNight', 'form.byMonth']],
      ['"предоплата" instead of "депозит"; and "Как люкс" in the Premium description: too hotel-like?', [{ text: 'предоплат' }, 'rooms.items.2.desc']],
      ['Place names: as written on Russian travel sites about Viet Nam?', ['location.intro', /^location\.rows\./]],
      ['Plural endings with different numbers (ночь / ночи / ночей, поле / поля / полей, "в течение 1 часа").', [{ flag: 'plural' }, 'when.withinMinutes(60)']],
      ['Length: Russian runs about 30% longer than English. Suggest shorter wording for buttons and labels if you can.', [/^actions\./, 'form.submit', 'estimate.label']],
    ],
  },
};

function matchRows(rows, matchers) {
  const ids = [];
  for (const m of matchers) {
    for (const r of rows) {
      const hit =
        typeof m === 'string' ? r.key === m
        : m instanceof RegExp ? m.test(r.key)
        : m.text ? r.tr.toLowerCase().includes(m.text.toLowerCase())
        : m.flag ? !!r.flags[m.flag]
        : false;
      if (hit && !ids.includes(r.n)) ids.push(r.n);
    }
  }
  return ids.sort((a, b) => a - b);
}

const pad = (n) => String(n).padStart(3, '0');

for (const lang of ['ko', 'zh', 'ru']) {
  const T = L[lang];
  const rows = await buildRows(lang);
  const focusSet = new Set();
  const focusHtml = T.focus
    .map(([q, ms], i) => {
      const ids = matchRows(rows, ms);
      ids.forEach((id) => focusSet.add(id));
      const links = ids.map((id) => `<a href="#r${id}">${pad(id)}</a>`).join(', ');
      return `<li>${esc(q)} <span class="meta">Lines: ${links || '–'}</span></li>`;
    })
    .join('\n');

  const sections = [];
  for (const r of rows) {
    let s = sections.find((x) => x.name === r.sec);
    if (!s) sections.push((s = { name: r.sec, rows: [] }));
    s.rows.push(r);
  }

  const tags = (r) =>
    [
      focusSet.has(r.n) ? '<span class="tag focus">Please look closely</span>' : '',
      r.flags.legal ? '<span class="tag legal">Legal</span>' : '',
      r.flags.sr ? '<span class="tag sr">Screen reader</span>' : '',
      r.flags.plural ? '<span class="tag plural">Plural check</span>' : '',
    ].join('');

  const body = sections
    .map((s, si) => {
      const trs = s.rows
        .map(
          (r) => `<tr id="r${r.n}"${focusSet.has(r.n) ? ' class="is-focus"' : ''}>
<td class="n" data-l="No.">${pad(r.n)}</td>
<td class="where" data-l="Where on the page">${tags(r)}<span>${esc(r.where)}</span>${r.flags.note ? `<span class="note">${esc(r.flags.note)}</span>` : ''}<span class="key">${esc(r.key)}</span></td>
<td class="src" lang="en" data-l="English (source)">${esc(r.en)}</td>
<td class="tr" lang="${T.htmlLang}" data-l="${esc(T.col)}">${esc(r.tr)}</td>
<td data-l="Comments"><textarea data-id="${pad(r.n)}" data-key="${esc(r.key)}" aria-label="Comments on line ${pad(r.n)}" lang="${T.htmlLang}"></textarea></td>
</tr>`,
        )
        .join('\n');
      return `<h2 id="s${si + 1}">${si + 1}. ${esc(s.name)}<span class="count">lines ${pad(s.rows[0].n)}–${pad(s.rows[s.rows.length - 1].n)}</span></h2>
<table class="rv">
<colgroup><col style="width:5%"><col style="width:17%"><col style="width:25%"><col style="width:28%"><col style="width:25%"></colgroup>
<thead><tr><th>No.</th><th>Where on the page</th><th>English (source)</th><th>${esc(T.col)}</th><th>Comments</th></tr></thead>
<tbody>
${trs}
</tbody>
</table>`;
    })
    .join('\n');

  const toc = sections
    .map((s, si) => `<a href="#s${si + 1}">${si + 1}. ${esc(s.name)}</a> <span class="meta">(${s.rows.length})</span><br>`)
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>OTTIMO ${T.name} review</title>
${FONTS}
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header class="top">
<p class="brand">OTTIMO BOUTIQUE STAY</p>
<h1>${esc(T.title)}<span class="sub" lang="${T.htmlLang}">${esc(T.sub)}</span></h1>
<p class="meta">Website ottimo.vn, home page, booking request form and page-not-found page · ${rows.length} lines · Text source: ${esc(SRC)} · Prepared ${TODAY}</p>
</header>

<div class="cols2">
<section class="panel note">
<h3>For the reader</h3>
<p>Thank you for reading this for us.</p>
<p>OTTIMO Boutique Stay is a calm place to stay on a quiet hillside in Da Lat, Viet Nam, for a few nights or a few months. Our voice is short, polite and calm: no exclamation marks, no emoji, no hard selling. We are not a hotel chain and we do not rent out flats; please flag any word that sounds like either.</p>
<ol>
<li>Read each line in ${T.name} as a guest would, and compare it with the English.</li>
<li>If a line is wrong, unnatural or sounds machine-translated, write your version or a comment in the Comments box. Leave the box empty when the line is fine.</li>
<li>Lines marked <span class="tag legal">Legal</span>: please correct the language only, not the meaning. Our lawyer checks the meaning.</li>
<li>Lines marked <span class="tag sr">Screen reader</span> are not visible; software reads them aloud to blind visitors. They should still sound natural.</li>
<li>Keep {name}, {amount}, {date}, {time} and {holder} as they are: the page fills them in. Times, percentages and numbers of days are fixed facts; tell us only if the format looks unusual.</li>
<li>Lines marked <span class="tag plural">Plural check</span> repeat with different numbers to test the word endings.</li>
</ol>
<p><strong>Sending your comments back.</strong> Type in the boxes; your notes stay in this browser on this device. When you finish, press Download comments and send the file to the person who gave you this page, or press Copy comments and paste them into a message. On paper: print, write beside the lines, and send a photo. Or simply message us the line numbers with your corrections.</p>
</section>
<section class="panel note" lang="${T.htmlLang}">
<h3>${esc(T.native)}</h3>
${T.intro}
</section>
</div>

<section class="panel">
<h3>Please look closely at these</h3>
<ol>
${focusHtml}
</ol>
<p class="meta">Lines marked <span class="tag focus">Please look closely</span> in the table are the ones listed here.</p>
</section>

<section class="panel noprint">
<h3>Contents</h3>
<nav class="toc">
${toc}
</nav>
</section>

${toolbar('Your role or initials', 'e.g. ' + T.name + ' reader')}

${body}

<footer class="end">
<p>Not included here: the privacy notice, which is reviewed in a separate file.</p>
<p>OTTIMO Boutique Stay · Da Lat · Viet Nam</p>
</footer>
</div>
<script>${script(`ottimo-lp-v2-${lang}-review`, `OTTIMO website – ${T.name} translation review (${SRC})`)}</script>
</body>
</html>
`;
  writeFileSync(`${OUT}/lp-v2-${lang}-review.html`, html);
  console.log(lang, rows.length, 'rows,', focusSet.size, 'focus rows');
}
