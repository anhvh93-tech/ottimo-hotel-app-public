// Shared HTML pieces for the review pack (brand: OTTIMO Brand Guidelines v1.0 – Ivory, Cream, Stone Grey, Ink,
// Light Oak, Earth Brown, Sage; Lora / Be Vietnam Pro / JetBrains Mono; system fonts for ko, zh, ru).
export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=JetBrains+Mono:wght@400&family=Lora:wght@500;600&display=swap" rel="stylesheet">';

export const CSS = `
:root {
  --ivory: #F4F0E8; --cream: #EDE6D8; --stone: #6B6760; --ink: #2B2B28;
  --oak: #B08D57; --earth: #7A5C44; --sage: #8A9079;
  --line: rgba(107, 103, 96, 0.28);
  --sans: 'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
  --serif: 'Lora', Georgia, 'Times New Roman', serif;
  --mono: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--ivory); color: var(--ink); font: 15px/1.6 var(--sans); }
:lang(ko) { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Nanum Gothic', system-ui, sans-serif; word-break: keep-all; }
:lang(zh), :lang(zh-Hans) { font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', 'Source Han Sans SC', system-ui, sans-serif; }
:lang(ru) { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
.wrap { max-width: 1240px; margin: 0 auto; padding: 32px 16px 64px; }
header.top { border-bottom: 1px solid var(--oak); padding-bottom: 20px; margin-bottom: 28px; }
.brand { font: 600 13px/1 var(--sans); letter-spacing: 0.18em; color: var(--earth); margin: 0 0 14px; }
h1 { font: 600 30px/1.25 var(--serif); margin: 0 0 6px; }
h1 .sub { display: block; font: 500 20px/1.4 var(--sans); color: var(--stone); margin-top: 4px; }
h2 { font: 600 21px/1.3 var(--serif); margin: 40px 0 12px; padding-top: 8px; border-top: 1px solid var(--line); }
h2 .count { font: 400 13px var(--sans); color: var(--stone); margin-left: 8px; }
h3 { font: 600 16px/1.4 var(--sans); margin: 22px 0 8px; }
p { margin: 0 0 10px; }
.meta { color: var(--stone); font-size: 13px; }
.meta code, code, .mono { font-family: var(--mono); font-size: 12px; }
.panel { background: var(--cream); border-radius: 6px; padding: 18px 20px; margin: 18px 0; }
.panel.note { border-left: 3px solid var(--oak); }
.panel.warn { border-left: 3px solid var(--earth); }
.panel h3:first-child, .panel h2:first-child { margin-top: 0; border: 0; padding: 0; }
.cols2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
ol, ul { margin: 0 0 10px; padding-left: 22px; }
li { margin: 3px 0; }
a { color: var(--earth); }
.tag { display: inline-block; font: 500 11px/1.6 var(--sans); padding: 0 7px; border-radius: 3px; margin: 2px 4px 0 0; white-space: nowrap; }
.tag.legal { background: var(--earth); color: var(--ivory); }
.tag.sr { border: 1px solid var(--stone); color: var(--stone); }
.tag.plural { border: 1px solid var(--sage); color: var(--ink); background: rgba(138, 144, 121, 0.18); }
.tag.focus { background: var(--oak); color: var(--ink); }
.tag.diff { background: var(--earth); color: var(--ivory); }
table.rv { width: 100%; border-collapse: collapse; table-layout: fixed; }
table.rv th { text-align: left; font: 600 12px/1.4 var(--sans); color: var(--stone); background: var(--cream); padding: 8px 10px; border-bottom: 1px solid var(--oak); }
table.rv td { vertical-align: top; padding: 10px; border-bottom: 1px solid var(--line); overflow-wrap: anywhere; }
table.rv tr.is-focus td:first-child { box-shadow: inset 3px 0 0 var(--oak); }
td.n { font: 500 13px var(--mono); color: var(--earth); white-space: nowrap; }
td.where { font-size: 13px; color: var(--stone); }
td.where .key { display: block; font: 11px/1.4 var(--mono); color: var(--stone); opacity: 0.85; margin-top: 4px; }
td.where .note { display: block; margin-top: 4px; color: var(--ink); }
td.src { font-size: 14px; }
td.tr { font-size: 16px; line-height: 1.65; }
textarea { width: 100%; min-height: 64px; resize: vertical; font: 14px/1.5 var(--sans); color: var(--ink); background: var(--ivory); border: 1px solid var(--line); border-radius: 4px; padding: 6px 8px; }
textarea:focus { outline: 2px solid var(--oak); outline-offset: 0; border-color: var(--oak); }
textarea.has { border-color: var(--oak); box-shadow: inset 3px 0 0 var(--oak); }
.toolbar { position: sticky; top: 0; z-index: 5; background: var(--ivory); border-bottom: 1px solid var(--line); padding: 10px 0; display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
.toolbar label { font-size: 13px; color: var(--stone); }
.toolbar input { font: 14px var(--sans); padding: 6px 8px; border: 1px solid var(--line); border-radius: 4px; background: var(--ivory); color: var(--ink); width: 220px; max-width: 100%; }
button { font: 500 14px var(--sans); border-radius: 4px; padding: 7px 14px; cursor: pointer; border: 1px solid var(--ink); background: var(--ink); color: var(--ivory); }
button.ghost { background: transparent; color: var(--ink); }
.status { font-size: 13px; color: var(--stone); }
nav.toc { columns: 2; font-size: 14px; }
nav.toc a { text-decoration: none; }
.para { border-top: 1px solid var(--line); padding: 12px 0; }
.para:first-of-type { border-top: 0; }
.pnum { font: 500 12px var(--mono); color: var(--earth); margin-bottom: 6px; }
.lng { font: 600 11px/1.4 var(--sans); letter-spacing: 0.08em; color: var(--stone); margin-bottom: 2px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px 24px; margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--line); }
.cell { font-size: 15px; }
.cell.alt { background: rgba(176, 141, 87, 0.12); border-left: 3px solid var(--earth); padding: 8px 10px; margin-top: 8px; font-size: 14px; }
.sec { background: var(--ivory); }
.secbox { margin-top: 12px; }
.secbox label { font: 600 13px var(--sans); display: block; margin-bottom: 4px; }
footer.end { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--oak); color: var(--stone); font-size: 13px; }
@media (max-width: 760px) {
  body { font-size: 15px; }
  h1 { font-size: 24px; }
  .cols2, .grid2, .grid3 { grid-template-columns: 1fr; }
  nav.toc { columns: 1; }
  table.rv, table.rv tbody, table.rv tr, table.rv td { display: block; width: 100%; }
  table.rv thead { display: none; }
  table.rv tr { border-bottom: 1px solid var(--oak); padding: 10px 0; }
  table.rv td { border: 0; padding: 4px 0; }
  table.rv td[data-l]::before { content: attr(data-l); display: block; font: 600 11px/1.4 var(--sans); letter-spacing: 0.06em; color: var(--stone); }
  table.rv td.n::before { display: inline; margin-right: 8px; }
  .toolbar { position: static; }
}
@media print {
  @page { size: A4 landscape; margin: 12mm; }
  body { background: none; font-size: 11px; }
  .wrap { max-width: none; padding: 0; }
  .toolbar, .noprint { display: none !important; }
  h2 { break-after: avoid; }
  tr, .para, .panel { break-inside: avoid; }
  table.rv th { background: var(--cream); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  td.tr { font-size: 12px; }
  textarea { min-height: 52px; border: 1px solid var(--stone); background: none; resize: none; }
  a { color: var(--ink); text-decoration: none; }
}
`;

// Comments: kept in this browser only (localStorage, wrapped in try/catch), exported as a plain text file.
export function script(storeKey, fileLabel) {
  return `
(function () {
  var KEY = ${JSON.stringify(storeKey)};
  var LABEL = ${JSON.stringify(fileLabel)};
  var boxes = Array.prototype.slice.call(document.querySelectorAll('textarea[data-id]'));
  var who = document.getElementById('who');
  var status = document.getElementById('status');
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function write(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } }
  var data = read();
  if (who && data.__who) who.value = data.__who;
  boxes.forEach(function (b) { if (data[b.dataset.id]) { b.value = data[b.dataset.id]; } mark(b); });
  function mark(b) { b.classList.toggle('has', !!b.value.trim()); }
  function count() { return boxes.filter(function (b) { return b.value.trim(); }).length; }
  function show(msg) { if (status) status.textContent = msg; }
  function save() {
    var d = { __who: who ? who.value : '' };
    boxes.forEach(function (b) { if (b.value.trim()) d[b.dataset.id] = b.value; });
    var ok = write(d);
    show(count() + ' ' + (ok ? 'comment(s), saved in this browser' : 'comment(s) – could not save in this browser, please download before closing'));
  }
  boxes.forEach(function (b) { b.addEventListener('input', function () { mark(b); save(); }); });
  if (who) who.addEventListener('input', save);
  show(count() + ' comment(s)');
  function text() {
    var out = [LABEL, 'Reviewer: ' + (who && who.value.trim() ? who.value.trim() : '(not given)'), 'Exported: ' + new Date().toISOString().slice(0, 16).replace('T', ' '), ''];
    boxes.forEach(function (b) {
      if (!b.value.trim()) return;
      out.push('#' + b.dataset.id + (b.dataset.key ? '  [' + b.dataset.key + ']' : ''));
      out.push(b.value.trim());
      out.push('');
    });
    if (out.length === 4) out.push('(no comments – every line is fine)');
    return out.join('\\n');
  }
  var dl = document.getElementById('dl');
  if (dl) dl.addEventListener('click', function () {
    var blob = new Blob([text()], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = KEY + '-comments.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  });
  var cp = document.getElementById('cp');
  if (cp) cp.addEventListener('click', function () {
    var t = text();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { show('Copied. Paste it into a message.'); }, function () { show('Could not copy. Please use Download.'); });
    } else { show('Could not copy. Please use Download.'); }
  });
  var pr = document.getElementById('pr');
  if (pr) pr.addEventListener('click', function () { window.print(); });
})();
`;
}

export function toolbar(whoLabel, ph = 'e.g. lawyer') {
  return `<div class="toolbar noprint" role="region" aria-label="Comments">
  <label for="who">${whoLabel}</label><input id="who" type="text" autocomplete="off" placeholder="${ph}">
  <button type="button" id="dl">Download comments</button>
  <button type="button" id="cp" class="ghost">Copy comments</button>
  <button type="button" id="pr" class="ghost">Print</button>
  <span class="status" id="status" aria-live="polite"></span>
</div>`;
}
