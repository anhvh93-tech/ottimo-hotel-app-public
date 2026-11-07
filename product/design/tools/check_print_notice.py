#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""So chữ tờ in "Your ID details" (Tờ 4, Tờ 4ru) với chữ trang khách – V5-47.

Chạy từ gốc repo (CI chạy trong product/, cùng job với gen_strings.py):
    python3 -I product/design/tools/check_print_notice.py
Thoát 0: khớp. 1: lệch (in từng chỗ lệch, chữ trang và chữ tờ, phần khác nhau). 2: không đọc được nguồn.

Vì sao (FB-R4-PO-UXD-IDS2-02, FB-R4-SEC-UXD-IDS2-01): tờ ở quầy là thông báo xử lý dữ liệu cá nhân (NĐ 13/2023).
Chữ của nó có hai nguồn: staff-one-pager.md (bộ dựng tờ in build_print_sheets.py) và gen_strings.py →
design/copy/strings-*.json (trang khách). Bằng chứng đồng ý ghi version của trang, nên chữ tờ phải đúng chữ trang
của version ghi ở chân tờ. Trước V5-47 việc này chỉ kiểm bằng tay.

Trang khách (đọc như guest-web hiển thị):
- các khóa NOTICE_PARAGRAPHS và NOTICE_TEXT_VERSIONS trong apps/guest-web/src/app/config.ts, đúng thứ tự, mỗi khóa
  một đoạn (CheckinFlow NoticeStep);
- chữ lấy từ strings-{en,vi,ru}.json theo luật ngôn ngữ pháp lý của i18n.tsx (legalLocale): trang tiếng X chỉ hiện chữ
  X khi đủ mọi khóa LEGAL_KEYS bằng X (và với RU: không khóa nào còn trong RU_UNREVIEWED_LEGAL); không thì hiện EN.
Tờ in, hai nơi:
- Markdown "## Tờ 4" (EN + VI) và "## Tờ 4ru" (EN + RU) của staff-one-pager.md, tách đoạn bằng đúng hàm
  build_print_sheets.notice_parts và dựng chữ bằng đúng hàm il() của bộ dựng;
- các tệp HTML đã dựng docs/print/to-4-*.html (mọi lần in có Tờ 4 trong build_print_sheets.JOBS, mọi bản trên mặt
  giấy). Tệp HTML là thứ được in, nên Markdown đã sửa mà chưa dựng lại cũng đỏ; chữ thêm tay ngoài các đoạn cũng đỏ.
Luật khớp:
- mỗi đoạn tờ in là một khóa, trừ khóa trong SPLIT (gw.notice_body in 2 đoạn: câu 1–2, câu 3–4, như bản v1 –
  SEC-on-v104-id-sheet-v2.md mục 0). Đoạn tách phải dừng ở cuối câu. Ghép các đoạn của một khóa bằng một dấu cách
  thì phải bằng đúng chữ trang;
- so chữ in ra: bỏ thẻ HTML (<span class="nb">, <strong>…), giải mã thực thể, gộp khoảng trắng ASCII liên tiếp
  thành một dấu cách (trình duyệt cũng gộp như vậy ở cả trang và tờ), chuẩn hóa Unicode NFC. Mọi ký tự khác phải
  giống hệt, kể cả U+00A0 (khoảng trắng không ngắt) của bản RU;
- chân tờ "OTTIMO · ID notice · vN · …": vN phải là version có chữ trên trang (một mục của NOTICE_TEXT_VERSIONS
  kết thúc bằng -vN).
Không so: nhãn OTTIMO, tiêu đề và dòng phụ của tờ, tháng ở chân tờ (chỉ có trên tờ); PDF (Chrome in từ HTML).

Chỉ đọc, không sửa tệp nào. Chỉ dùng thư viện chuẩn Python 3.9+.
"""
import argparse
import difflib
import json
import re
import sys
import unicodedata
from html.parser import HTMLParser
from pathlib import Path

sys.dont_write_bytecode = True  # không để lại __pycache__ trong repo (repo không bỏ qua thư mục đó)
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_print_sheets as bps  # noqa: E402

ROOT = HERE.parents[2]
PRODUCT = ROOT / "product"
DEFAULT_MD = bps.DEFAULT_MD
DEFAULT_PRINT = bps.DEFAULT_OUT
DEFAULT_COPY = PRODUCT / "design" / "copy"
DEFAULT_CONFIG = PRODUCT / "apps" / "guest-web" / "src" / "app" / "config.ts"
DEFAULT_I18N = PRODUCT / "apps" / "guest-web" / "src" / "app" / "i18n.tsx"

LANGS = ("en", "vi", "ru")
# Tờ → (ngôn ngữ phần trên / cột trái, ngôn ngữ phần sau "---" / cột phải).
SHEET_LANGS = {"4": ("en", "vi"), "4ru": ("en", "ru")}
# Khóa in thành nhiều đoạn trên tờ. Đổi cách tách thì UXD + SEC duyệt, như đổi chữ.
SPLIT = {"gw.notice_body": 2}
SENTENCE_END = (".", "!", "?", "…")
ASCII_WS = re.compile(r"[ \t\r\n\f\v]+")


class SourceError(Exception):
    """Không đọc được một nguồn (tệp thiếu, khai báo đổi dạng): thoát 2, không phải chữ lệch."""


def rel(path):
    p = Path(path).resolve()
    try:
        return str(p.relative_to(ROOT))
    except ValueError:
        return str(p)


def norm(text):
    return ASCII_WS.sub(" ", unicodedata.normalize("NFC", text)).strip()


def visible(text):
    """Hiện ký tự không thấy được (U+00A0, U+200B, U+00AD…) thành <U+XXXX> để người đọc thấy chỗ lệch."""
    out = []
    for ch in text:
        cat = unicodedata.category(ch)
        if ch != " " and (cat in ("Zs", "Zl", "Zp", "Cc", "Cf")):
            out.append("<U+%04X>" % ord(ch))
        else:
            out.append(ch)
    return "".join(out)


class _Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def html_text(fragment):
    p = _Text()
    p.feed(fragment)
    p.close()
    return norm("".join(p.parts))


def printed(md_text):
    """Chữ Markdown của tờ → chữ in ra giấy (qua đúng hàm il() của bộ dựng)."""
    return html_text(bps.il(md_text))


# --------------------------------------------------------------------------- trang khách

def _ts_list(text, name, path):
    """Các chuỗi trong khai báo `const NAME … = [ … ]` (hoặc `new Set<string>([ … ])`) và các tên được trải (...X)."""
    m = re.search(r"\bconst\s+%s\b[^=]*=\s*(?:new\s+Set(?:<[^>]*>)?\(\s*)?\[(.*?)\]" % re.escape(name), text, re.S)
    if not m:
        raise SourceError("Không thấy khai báo `const %s = [...]` trong %s. Đổi cách khai báo thì sửa "
                          "product/design/tools/check_print_notice.py trong cùng PR." % (name, rel(path)))
    body = re.sub(r"//[^\n]*", "", m.group(1))
    return [s for _, s in re.findall(r"""(['"])(.*?)\1""", body)], re.findall(r"\.\.\.\s*([A-Za-z_]\w*)", body)


def _read(path):
    try:
        return Path(path).read_text(encoding="utf-8")
    except OSError as e:
        raise SourceError("Không đọc được %s: %s" % (rel(path), e.strerror or e))


def load_page(copy_dir=DEFAULT_COPY, config=DEFAULT_CONFIG, i18n=DEFAULT_I18N):
    cfg = _read(config)
    paragraphs, spread = _ts_list(cfg, "NOTICE_PARAGRAPHS", config)
    versions, _ = _ts_list(cfg, "NOTICE_TEXT_VERSIONS", config)
    if not paragraphs or spread:
        raise SourceError("NOTICE_PARAGRAPHS trong %s phải là danh sách khóa viết thẳng (không rỗng, không ...)."
                          % rel(config))
    src = _read(i18n)
    legal, legal_spread = _ts_list(src, "LEGAL_KEYS", i18n)
    for name in legal_spread:
        if name != "NOTICE_PARAGRAPHS":
            raise SourceError("LEGAL_KEYS trong %s trải ...%s: bộ so chỉ biết ...NOTICE_PARAGRAPHS." % (rel(i18n), name))
        legal = list(paragraphs) + legal
    unreviewed, _ = _ts_list(src, "RU_UNREVIEWED_LEGAL", i18n)
    strings = {}
    for lang in LANGS:
        p = Path(copy_dir) / ("strings-%s.json" % lang)
        try:
            d = json.loads(_read(p))
        except ValueError as e:
            raise SourceError("%s không phải JSON: %s" % (rel(p), e))
        if not isinstance(d, dict):
            raise SourceError("%s phải là một object JSON" % rel(p))
        strings[lang] = d
    return {"paragraphs": paragraphs, "versions": versions, "legal": legal, "ru_unreviewed": set(unreviewed),
            "strings": strings, "copy_dir": Path(copy_dir)}


def legal_locale(page, lang):
    """(ngôn ngữ trang thật sự hiện cho phần pháp lý, các khóa làm trang chuyển sang EN) – như i18n.tsx legalLocale."""
    d = page["strings"][lang]
    blocked = [k for k in page["legal"]
               if not isinstance(d.get(k), str) or (lang == "ru" and k in page["ru_unreviewed"])]
    return (lang, []) if not blocked else ("en", blocked)


def page_text(page, lang, key):
    """(chữ trang hiện cho khóa, tệp JSON chứa chữ đó) – như translateGuest: ngôn ngữ pháp lý, rồi EN."""
    shown, _ = legal_locale(page, lang)
    for loc in (shown, "en"):
        v = page["strings"][loc].get(key)
        if isinstance(v, str):
            return norm(v), "strings-%s.json" % loc
    return None, None


# --------------------------------------------------------------------------- tờ in

def _copy(where, sid, first, second, foot):
    langs = SHEET_LANGS.get(sid)
    blocks = {langs[0]: first, langs[1]: second} if langs else {}
    return {"where": where, "sid": sid, "blocks": blocks, "foot": foot}


def markdown_copies(md_path, sheets=None):
    if sheets is None:
        if not Path(md_path).is_file():
            raise SourceError("Không thấy %s" % rel(md_path))
        _, sheets = bps.read_source(Path(md_path))
    out = []
    for sid in SHEET_LANGS:
        if sid not in sheets:
            raise SourceError("Thiếu phần '## Tờ %s' trong %s" % (sid, rel(md_path)))
        parts = bps.notice_parts(sheets[sid])
        out.append(_copy("%s · Tờ %s" % (rel(md_path), sid), sid, [printed(p) for p in parts["first"]],
                         [printed(p) for p in parts["second"]], printed(parts["foot"])))
    return out


class _SheetHTML(HTMLParser):
    """Đọc các <section class="sheet notice …"> của tệp HTML đã dựng: đoạn theo ngôn ngữ, chân tờ.

    Chữ chỉ có trên tờ (nhãn p.eyebrow, tiêu đề h2, dòng phụ p.sub) bỏ qua. Chữ nào khác nằm ngoài một <p> của khối
    ngôn ngữ hay ngoài <span> chân tờ (ví dụ thêm tay vào HTML) được ghi lại là "chữ ngoài đoạn" để báo lỗi."""
    TRACK = {"section", "div", "p", "footer", "span", "h2", "h3", "header", "strong", "em", "code", "a", "b", "i"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.sheets, self.stack, self.buf = [], [], None

    def _roles(self):
        return [r for _, r in self.stack if r]

    def handle_starttag(self, tag, attrs):
        if tag not in self.TRACK:
            return
        a = {k: (v or "") for k, v in attrs}
        cls = a.get("class", "").split()
        roles, role = self._roles(), None
        if tag == "section" and "notice" in cls:
            self.sheets.append({"sid": a.get("data-sheet", ""), "paras": [], "foot": [], "stray": []})
            role = "sheet"
        elif "sheet" in roles:
            lang = a.get("lang", "")
            in_lang = any(r.startswith("lang:") for r in roles)
            if tag == "div" and lang in LANGS and lang in cls:
                role = "lang:" + lang
            elif tag == "p" and in_lang and self.buf is None:
                role, self.buf = "para", []
            elif not in_lang and (tag == "h2" or (tag == "p" and ({"eyebrow", "sub"} & set(cls)))):
                role = "sheetonly"
            elif tag == "footer" and "nfoot" in cls:
                role = "foot"
            elif tag == "span" and roles[-1] == "foot":
                role, self.buf = "footspan", []
        self.stack.append((tag, role))

    def handle_endtag(self, tag):
        if tag not in self.TRACK:
            return
        while self.stack:
            t, role = self.stack.pop()
            if role == "para":
                lang = [r for r in self._roles() if r.startswith("lang:")][-1][5:]
                self.sheets[-1]["paras"].append((lang, norm("".join(self.buf))))
                self.buf = None
            elif role == "footspan":
                self.sheets[-1]["foot"].append(norm("".join(self.buf)))
                self.buf = None
            if t == tag:
                break

    def handle_data(self, data):
        if self.buf is not None:
            self.buf.append(data)
            return
        roles = self._roles()
        if "sheet" in roles and "sheetonly" not in roles and norm(data):
            self.sheets[-1]["stray"].append(norm(data))


def html_sheets(path):
    p = _SheetHTML()
    p.feed(_read(path))
    p.close()
    return p.sheets


def notice_jobs():
    return [j for j in bps.JOBS if any(k.startswith("4") for k in j["sheets"])]


def html_copies(print_dir=DEFAULT_PRINT):
    """(các tờ đọc từ HTML đã dựng, lỗi cấu trúc: tệp thiếu, tệp lạ, số tờ hay ngôn ngữ không đúng bộ dựng)."""
    print_dir = Path(print_dir)
    jobs = notice_jobs()
    problems, out = [], []
    known = {j["file"] + ".html" for j in jobs}
    for extra in sorted(p.name for p in print_dir.glob("to-4*.html") if p.name not in known):
        problems.append("TỆP LẠ  %s/%s: tờ Your ID details không có trong build_print_sheets.JOBS, nên không biết đây "
                        "là bản nào. Gỡ tệp cũ khỏi repo, hoặc thêm lần in vào JOBS." % (rel(print_dir), extra))
    for j in jobs:
        f = print_dir / (j["file"] + ".html")
        if not f.is_file():
            problems.append("THIẾU  %s: chưa dựng. Chạy python3 -I product/design/tools/build_print_sheets.py "
                            "--pdf --only %s" % (rel(f), j["file"]))
            continue
        found = html_sheets(f)
        sids = [s["sid"] for s in found]
        if sids != list(j["sheets"]):
            problems.append("CẤU TRÚC  %s: có tờ %s, bộ dựng in tờ %s. Dựng lại tệp này." % (rel(f), sids, j["sheets"]))
            continue
        for i, s in enumerate(found):
            langs = SHEET_LANGS.get(s["sid"], ())
            got = sorted({lang for lang, _ in s["paras"]})
            where = "%s · Tờ %s%s" % (rel(f), s["sid"], " (bản %d/%d)" % (i + 1, len(found)) if len(found) > 1 else "")
            if got != sorted(langs):
                problems.append("CẤU TRÚC  %s: có đoạn tiếng %s, tờ này cần %s." % (where, got, list(langs)))
                continue
            if s["stray"]:
                problems.append("CHỮ NGOÀI ĐOẠN  %s: có chữ in ra nhưng không nằm trong đoạn nào để so: %s. Tệp HTML "
                                "bị sửa tay? Dựng lại bằng build_print_sheets.py."
                                % (where, "; ".join('"%s"' % visible(x[:80]) for x in s["stray"])))
            by = {lang: [t for g, t in s["paras"] if g == lang] for lang in langs}
            out.append(_copy(where, s["sid"], by[langs[0]], by[langs[1]],
                             " · ".join(x for x in s["foot"] if x)))
    return out, problems


# --------------------------------------------------------------------------- so

def word_diff(want, got, context=4):
    """Khác nhau theo từ: [-chữ trang-]{+chữ tờ+}, giữ vài từ hai bên, phần giống dài thì rút thành …"""
    a, b = want.split(" "), got.split(" ")
    out = []
    ops = difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes()
    for n, (op, i1, i2, j1, j2) in enumerate(ops):
        if op == "equal":
            seg = a[i1:i2]
            if len(seg) > 2 * context:
                head = seg[:context] if n > 0 else []
                tail = seg[-context:] if n < len(ops) - 1 else []
                seg = head + ["…"] + tail
            out.append(" ".join(seg))
            continue
        if i2 > i1:
            out.append("[-%s-]" % " ".join(a[i1:i2]))
        if j2 > j1:
            out.append("{+%s+}" % " ".join(b[j1:j2]))
    return visible(" ".join(x for x in out if x))


def compare(page, copy):
    problems = []
    where, sid = copy["where"], copy["sid"]
    langs = SHEET_LANGS.get(sid)
    if not langs:
        return ["CẤU TRÚC  %s: không có luật so cho tờ '%s' (SHEET_LANGS)." % (where, sid)]
    keys = page["paragraphs"]
    want_n = sum(SPLIT.get(k, 1) for k in keys)
    for lang in langs:
        shown, blocked = legal_locale(page, lang)
        if shown != lang:
            problems.append(
                "LỆCH NGÔN NGỮ  %s · %s: trang khách tiếng %s đang hiện phần pháp lý bằng EN (khóa thiếu hoặc chưa "
                "duyệt: %s), nên chữ %s trên tờ không phải chữ khách đọc trên trang. Không dán tờ này cho tới khi "
                "trang có lại bản %s đã duyệt." % (where, lang, lang.upper(), ", ".join(blocked), lang.upper(),
                                                  lang.upper()))
            continue
        paras = copy["blocks"].get(lang, [])
        if len(paras) != want_n:
            plan = ", ".join("%s (%d đoạn)" % (k, SPLIT[k]) if k in SPLIT else k for k in keys)
            listed = "\n".join("      %d. %s" % (i + 1, visible(p[:90] + ("…" if len(p) > 90 else "")))
                               for i, p in enumerate(paras)) or "      (không có đoạn nào)"
            problems.append("LỆCH SỐ ĐOẠN  %s · %s: tờ có %d đoạn, trang khách cần %d theo thứ tự %s.\n%s"
                            % (where, lang, len(paras), want_n, plan, listed))
            continue
        i = 0
        for k in keys:
            n = SPLIT.get(k, 1)
            group, i = paras[i:i + n], i + n
            want, src = page_text(page, lang, k)
            if want is None:
                problems.append("THIẾU CHỮ TRANG  %s · %s · %s: không có trong strings-%s.json lẫn strings-en.json "
                                "(trang sẽ hiện tên khóa)." % (where, lang, k, lang))
                continue
            got = " ".join(group)
            if got != want:
                problems.append(
                    "LỆCH CHỮ  %s · %s · %s\n"
                    "    trang khách: %s\n"
                    "                 (%s/%s)\n"
                    "    tờ in:       %s\n"
                    "    khác nhau:   %s\n"
                    "                 ([-chữ trang-] {+chữ tờ+})"
                    % (where, lang, k, visible(want), rel(page["copy_dir"]), src, visible(got), word_diff(want, got)))
            for piece in group[:-1]:
                if not piece.endswith(SENTENCE_END):
                    problems.append("TÁCH GIỮA CÂU  %s · %s · %s: đoạn \"%s\" dừng giữa câu; chỉ tách ở cuối câu."
                                    % (where, lang, k, visible(piece[-60:])))
    m = re.search(r"·\s*v(\d+)\b", copy["foot"])
    if not m:
        problems.append("LỆCH VERSION  %s: chân tờ \"%s\" không ghi version dạng \"· vN\"." % (where, copy["foot"]))
    elif not any(v.endswith("-v" + m.group(1)) for v in page["versions"]):
        problems.append("LỆCH VERSION  %s: chân tờ ghi v%s, trang khách chỉ có chữ của %s (NOTICE_TEXT_VERSIONS)."
                        % (where, m.group(1), ", ".join(page["versions"]) or "(không version nào)"))
    return problems


def check_markdown(md_path, sheets=None, copy_dir=DEFAULT_COPY, config=DEFAULT_CONFIG, i18n=DEFAULT_I18N):
    """Cho build_print_sheets.py: chỉ so Markdown (trước khi dựng). Trả danh sách chỗ lệch (rỗng = khớp)."""
    try:
        page = load_page(copy_dir, config, i18n)
        copies = markdown_copies(md_path, sheets)
    except SourceError as e:
        return ["KHÔNG ĐỌC ĐƯỢC  %s" % e]
    return [p for c in copies for p in compare(page, c)]


def run(md=DEFAULT_MD, print_dir=DEFAULT_PRINT, copy_dir=DEFAULT_COPY, config=DEFAULT_CONFIG, i18n=DEFAULT_I18N):
    """(chỗ lệch, số tờ đã so, trang). SourceError khi không đọc được nguồn."""
    page = load_page(copy_dir, config, i18n)
    copies = markdown_copies(md)
    from_html, problems = html_copies(print_dir)
    copies += from_html
    for c in copies:
        problems += compare(page, c)
    return problems, copies, page


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--md", type=Path, default=DEFAULT_MD, help="nguồn tờ in (staff-one-pager.md)")
    ap.add_argument("--print-dir", type=Path, default=DEFAULT_PRINT, help="thư mục HTML đã dựng (docs/print)")
    ap.add_argument("--copy-dir", type=Path, default=DEFAULT_COPY, help="design/copy (strings-*.json)")
    ap.add_argument("--guest-config", type=Path, default=DEFAULT_CONFIG, help="guest-web src/app/config.ts")
    ap.add_argument("--guest-i18n", type=Path, default=DEFAULT_I18N, help="guest-web src/app/i18n.tsx")
    a = ap.parse_args(argv)
    print("So chữ tờ in Your ID details với trang khách (V5-47)")
    try:
        problems, copies, page = run(a.md, a.print_dir, a.copy_dir, a.guest_config, a.guest_i18n)
    except SourceError as e:
        print("KHÔNG ĐỌC ĐƯỢC  %s" % e)
        return 2
    print("  trang: %s/strings-{en,vi,ru}.json · %s · %s" % (rel(page["copy_dir"]), ", ".join(page["paragraphs"]),
                                                          ", ".join(page["versions"])))
    print("  tờ:    %d tờ – %s" % (len(copies), "; ".join(c["where"] for c in copies)))
    if problems:
        print("")
        print("\n\n".join(problems))
        print("")
        print("LỆCH: %d chỗ. Không tự chọn bên nào đúng: UXD (chữ) + SEC (chữ pháp lý) quyết. Sửa chữ trang ở "
              "product/design/tools/gen_strings.py rồi chạy lại nó; sửa tờ ở product/docs/staff-one-pager.md rồi chạy "
              "build_print_sheets.py --pdf (dựng HTML + PDF). Đổi nghĩa thì đổi version và chân tờ." % len(problems))
        return 1
    print("KHỚP: %d tờ × %d khóa, chân tờ đúng version." % (len(copies), len(page["paragraphs"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
