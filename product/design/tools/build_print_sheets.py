#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dựng bộ tờ in ngày D (one-pager nhân viên + tờ "Your ID details") từ Markdown của PO.

Chạy từ gốc repo (UXD, Round 3):
    python3 -I product/design/tools/build_print_sheets.py            # chỉ dựng HTML
    python3 -I product/design/tools/build_print_sheets.py --pdf      # dựng + đo + in PDF bằng Chrome headless
    python3 -I product/design/tools/build_print_sheets.py --pdf --only to-4-your-id-details-a4
                                                                      # chỉ dựng/đo một lần in (không ghi đè tệp khác)
    python3 -I product/design/tools/build_print_sheets.py --pdf --only to-4-your-id-details-a4
        to-4-your-id-details-a4-2-ban to-4-your-id-details-a5 to-4-your-id-details-a4-ru
                                                                      # (một dòng) chỉ các tờ "Your ID details"

Nguồn:  product/docs/staff-one-pager.md – các phần "## Tờ 1 …", "## Tờ 2a …", "## Tờ 2b …",
        "## Tờ 3 …", "## Tờ 4 …", "## Tờ 4ru …" (EN/RU, hai cột). Phần "## Cách in và dán" không in.
Ra:     product/docs/print/*.html (mỗi lần in một tệp, một khổ giấy)
        product/docs/print/pdf/*.pdf (khi có --pdf)

Mỗi tờ là một khung cố định đúng khổ giấy (mm). Khi đo, Chrome kiểm khung có tràn không và tìm
cỡ chữ lớn nhất còn vừa, rồi in PDF và đếm số trang. Tràn hoặc PDF nhiều hơn 1 trang: thoát mã 1.

Không sửa tệp nguồn. Chữ giữ nguyên văn của PO; bộ dựng chỉ chọn khổ, cỡ chữ, chỗ đặt.
Font tờ "Your ID details": nhúng base64 (woff2 của @fontsource) để in ở quầy khi mất mạng vẫn đúng font.
Tìm tệp font ở --font-dir, rồi product/apps/landing-web/node_modules/@fontsource, product/node_modules/@fontsource,
product/node_modules/.pnpm/@fontsource+<tên>@*/. Tờ EN/VI thiếu font thì dùng Google Fonts (báo lại); tờ EN/RU
thiếu font (Onest chưa cài) thì dừng: cài gói LP-v2 (pnpm install trong product/) hoặc chỉ --font-dir.

Chỉ dùng thư viện chuẩn Python 3.9+ (dùng lại bộ đọc Markdown của build_manual.py).
"""
import argparse
import base64
import json
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from build_manual import esc, inline, parse_blocks, plain, strip_comments  # noqa: E402

ROOT = HERE.parents[2]
DEFAULT_MD = ROOT / "product" / "docs" / "staff-one-pager.md"
DEFAULT_OUT = ROOT / "product" / "docs" / "print"

FONTS = ("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600"
         "&family=JetBrains+Mono:wght@400&family=Lora:wght@500&display=swap")
FONTS_RU = ("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600"
            "&family=Lora:wght@500&family=Onest:wght@400&display=swap")

# Font nhúng (fontsource, woff2). unicode-range theo tệp CSS của fontsource 5.x.
UR = {
    "latin": ("U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,"
              "U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"),
    "vietnamese": ("U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,"
                   "U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB"),
    "cyrillic": "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
}
# (họ font, gói fontsource, độ đậm, tập con)
NOTICE_FONTS = [("Lora", "lora", 500, ("latin", "vietnamese")),
                ("Be Vietnam Pro", "be-vietnam-pro", 400, ("latin", "vietnamese")),
                ("Be Vietnam Pro", "be-vietnam-pro", 600, ("latin", "vietnamese"))]
# EN/RU: Be Vietnam Pro không có chữ Kirin -> cột RU dùng Onest (như landing /ru/, LP-v2); Lora có Kirin.
NOTICE_FONTS_RU = [("Lora", "lora", 500, ("latin", "cyrillic")),
                   ("Be Vietnam Pro", "be-vietnam-pro", 400, ("latin",)),
                   ("Be Vietnam Pro", "be-vietnam-pro", 600, ("latin",)),
                   ("Onest", "onest", 400, ("latin", "cyrillic"))]
FONT_CACHE = {}

# Mỗi lần in: tệp, khổ giấy (mm), các tờ trên mặt giấy, cỡ chữ thân (pt).
JOBS = [
    {"file": "to-1-quay-le-tan", "page": "A4", "w": 210, "h": 297, "sheets": ["1"],
     "title": "Tờ 1 – Quầy lễ tân"},
    # 06/11/2026 (Round 5, V5-08): Tờ 2a không còn vừa A5 (chữ gấp ba sau thẻ DOM, SEC; A5 chỉ vừa ở 8 pt) nên in
    # riêng A4 dọc, 2 cột. Tờ 2b không đổi chữ: in 2 bản trên A4 ngang, cắt đôi (giữ một, một bản dự phòng).
    {"file": "to-2a-giu-cho-qua-han-a4", "page": "A4", "w": 210, "h": 297, "sheets": ["2a"],
     "title": "Tờ 2a – Giữ chỗ quá hạn (tạm), A4"},
    {"file": "to-2b-a4-2-ban", "page": "A4 landscape", "w": 297, "h": 210, "sheets": ["2b", "2b"],
     "title": "Tờ 2b – 2 bản trên A4, cắt đôi"},
    {"file": "to-3-buong-phong", "page": "A4", "w": 210, "h": 297, "sheets": ["3"],
     "title": "Tờ 3 – Buồng phòng"},
    {"file": "to-4-your-id-details-a5", "page": "A5", "w": 148, "h": 210, "sheets": ["4"], "embed": NOTICE_FONTS,
     "title": "Tờ 4 – Your ID details (A5)"},
    {"file": "to-4-your-id-details-a4-2-ban", "page": "A4 landscape", "w": 297, "h": 210, "sheets": ["4", "4"],
     "embed": NOTICE_FONTS, "title": "Tờ 4 – Your ID details (2 bản trên A4, cắt đôi)"},
    # INV 30/10 (decision-log): bỏ bộ tờ nhân viên; riêng Tờ 4 in khổ A4 đặt ở quầy. Chữ y hệt bản A5,
    # chỉ phóng cỡ để đọc được từ 60–80 cm (khung mica A4 hoặc dán phía khách).
    {"file": "to-4-your-id-details-a4", "page": "A4", "w": 210, "h": 297, "sheets": ["4"], "notice": "a4",
     "embed": NOTICE_FONTS,
     "title": "Tờ 4 – Your ID details (A4, đặt ở quầy)", "paper": "giấy trắng hoặc ngà 120–160 gsm"},
    # UXD-on-privacy-v2-ru.md T2–T8: khách nói tiếng Nga có tờ riêng, A4 dọc, EN trái – RU phải, đặt cạnh tờ EN/VI.
    {"file": "to-4-your-id-details-a4-ru", "page": "A4", "w": 210, "h": 297, "sheets": ["4ru"], "notice": "a4-ru",
     "embed": NOTICE_FONTS_RU, "embed_required": True, "google": FONTS_RU,
     "title": "Tờ 4ru – Your ID details EN/RU (A4, đặt ở quầy)", "paper": "giấy trắng hoặc ngà 120–160 gsm"},
]

# Quy cách từng tờ (UXD-on-PO-v1.0.0-docs.md mục 1.3 và mục 2).
SPEC = {
    # Tờ 1: 9 pt tới bản 30/10. Bản 06/11 (check-in online, "Gửi nhầm người", dòng Cọc) chỉ vừa A4 một mặt ở 8,25 pt
    # (đo 06/11: 9 pt tràn; bớt khoảng cách vẫn chỉ vừa 8,5 pt và còn 1,5 mm). Giữ chữ nguyên văn, hạ cỡ.
    "1": {"size": "a4", "fs": 8.25, "cols": 2, "dense": True, "where": "Phía trong quầy, chỗ nhân viên"},
    # Tờ 2a: A5 10 pt tới bản 30/10. Bản 06/11 in A4 dọc, 2 cột, 11 pt (vừa tới 11,75 pt; còn ~36 mm mỗi cột).
    # Bản 07/11 (thêm câu hộp Thông báo, DOM PO-08): vẫn 11 pt, dòng 1,28, còn 6,5 mm mỗi cột (CSS .snug).
    "2a": {"size": "a4", "fs": 11.0, "cols": 2, "frame": True, "snug": True, "where": "Cạnh Tờ 1, phía nhân viên"},
    "2b": {"size": "a5", "fs": 12.0, "cols": 1, "where": "Kẹp sau Tờ 1 hoặc trong bìa quầy"},
    "3": {"size": "a4", "fs": 12.0, "cols": 2, "where": "Phòng buồng / kho đồ vải"},
    "4": {"size": "a5", "fs": 10.0, "fs_vi": 9.5, "where": "Khung mica trên quầy, mặt quay ra khách"},
}
# Tờ 4 khổ A4 dọc (cùng chữ, cùng nguồn "## Tờ 4"): thân EN = VI, tiêu đề Lora 36 pt.
NOTICE_A4 = {"size": "a4", "fs": 14.0, "fs_vi": 14.0}
# Tờ 4ru A4 dọc, hai cột: --fs cột EN, --fs-vi dùng cho cột RU (T7: RU nhỏ hơn EN tối đa 0,5 pt, không dưới 10 pt).
NOTICE_A4_RU = {"size": "a4", "fs": 12.5, "fs_vi": 12.5}

SHEET_RE = re.compile(r"^##\s+Tờ\s+(\w+)\s+[–-]\s+(.+?)\s*$")
NOBREAK_RE = re.compile(r"\b(\d+|N) (months?|days?|tháng|ngày|giờ|hours?)\b")


# --------------------------------------------------------------------------- đọc nguồn

def read_source(md_path):
    text = strip_comments(md_path.read_text(encoding="utf-8"))
    lines = text.splitlines()
    meta = {"title": "", "edition": ""}
    sheets, cur = {}, None
    for line in lines:
        if line.startswith("# ") and not meta["title"]:
            meta["title"] = line[2:].strip()
            continue
        if line.startswith("## "):
            m = SHEET_RE.match(line)
            cur = None
            if m:
                cur = {"id": m.group(1), "heading": m.group(2), "lines": []}
                sheets[cur["id"]] = cur
            continue
        if cur is not None:
            cur["lines"].append(line)
        elif line.strip() and not meta["edition"] and not line.startswith("#"):
            meta["edition"] = line.strip()
    for s in sheets.values():
        while s["lines"] and (not s["lines"][-1].strip() or s["lines"][-1].strip() == "---"):
            s["lines"].pop()
    return meta, sheets


def edition_line(raw, short=False):
    """'Dành cho … · Bản 30/10/2026 · v1.0.0 · Hướng dẫn đầy đủ: … · In 4 tờ …' -> phần cần in ở chân tờ."""
    parts = [p.strip().rstrip(".") for p in raw.split(" · ")]
    keep = [p for p in parts if not p.startswith("Dành cho") and not p.startswith("In ")]
    if short:  # tờ A5: chỉ giữ bản và phiên bản, để chân tờ một dòng
        keep = [p for p in keep if p.startswith("Bản") or re.match(r"^v\d", p)]
    return " · ".join(keep)


# --------------------------------------------------------------------------- dựng HTML

def nobreak(html_text):
    t = html_text.replace("check-out", '<span class="nb">check-out</span>')
    return NOBREAK_RE.sub(lambda m: '<span class="nb">%s %s</span>' % (m.group(1), m.group(2)), t)


def il(text):
    return nobreak(inline(text, None, xref=False))


def render_list(b):
    tag = "ol" if b["ordered"] else "ul"
    attrs = ' start="%d"' % b["start"] if b["ordered"] and b["start"] != 1 else ""
    out = ["<%s%s>" % (tag, attrs)]
    for it in b["items"]:
        out.append("<li>%s" % il(it["text"]))
        for ch in it["children"]:
            out.append(render_list(ch))
        out.append("</li>")
    out.append("</%s>" % tag)
    return "".join(out)


def render_table(b):
    ncol = len(b["header"])
    out = ["<table><thead><tr>"]
    out += ['<th scope="col">%s</th>' % il(h) for h in b["header"]]
    out.append("</tr></thead><tbody>")
    for r in b["rows"]:
        r = (r + [""] * ncol)[:ncol]
        out.append("<tr>" + "".join("<td>%s</td>" % il(c) for c in r) + "</tr>")
    out.append("</tbody></table>")
    return "".join(out)


def render_blocks(blocks):
    out = []
    for b in blocks:
        t = b["t"]
        if t == "h":
            out.append("<h3>%s</h3>" % il(b["text"]))
        elif t == "p":
            out.append("<p>%s</p>" % il(b["text"]))
        elif t == "list":
            out.append(render_list(b))
        elif t == "table":
            out.append(render_table(b))
        elif t == "quote":
            out.append('<div class="note">%s</div>' % render_blocks(b["blocks"]))
        # "hr" bỏ: tờ nhân viên không dùng nét ngang
    return "".join(out)


def staff_sheet(sid, sheet, meta):
    spec = SPEC[sid]
    blocks = parse_blocks(sheet["lines"])
    # Phần trước "###" đầu tiên là phần mở đầu, nằm ngang cả tờ (tờ không có "###": không có phần mở đầu).
    k = next((i for i, b in enumerate(blocks) if b["t"] == "h"), 0)
    intro, body = blocks[:k], blocks[k:]
    title = re.sub(r"\s*\(([^)]*)\)$", r' <span class="paren">(\1)</span>', esc(sheet["heading"]))
    cls = "sheet staff %s c%d%s%s" % (spec["size"], spec["cols"], " frame" if spec.get("frame") else "",
                                      " dense" if spec.get("dense") else "") + (" snug" if spec.get("snug") else "")
    # Góc phải hàng tiêu đề: nhãn "OTTIMO Desk · Tờ x". Tờ dày chữ (Tờ 1): đặt dòng địa chỉ đầu tiên ở đó
    # thay cho nhãn (nhãn đã có ở chân tờ), để dành chỗ cho thân.
    side = '<p class="eyebrow">OTTIMO Desk · Tờ %s</p>' % esc(sid)
    if spec.get("dense") and intro and intro[0]["t"] == "p" and len(plain(intro[0]["text"])) < 90:
        side = '<p class="side">%s</p>' % il(intro.pop(0)["text"])
    return (
        '<section class="%s" data-sheet="%s" style="--fs:%spt">' % (cls, sid, spec["fs"])
        + '<div class="inner">'
        + '<header class="shead"><div class="hrow"><h2>%s</h2>%s</div>%s</header>'
        % (title, side, '<div class="intro">%s</div>' % render_blocks(intro) if intro else "")
        + '<div class="fit flow">%s</div>' % render_blocks(body)
        # Tên tờ ở chân không ngắt giữa cụm (chân hai dòng: "OTTIMO Desk · Tờ 2a ·" / "Giữ chỗ quá hạn (tạm)").
        + '<footer class="sfoot"><span>OTTIMO Desk · Tờ %s · <span class="nb">%s</span></span><span>%s</span></footer>'
        % (esc(sid), esc(plain(sheet["heading"])), esc(edition_line(meta["edition"], short=spec["size"] == "a5")))
        + "</div></section>"
    )


def notice_sheet(sheet, size="a5"):
    """Tờ 4: nhãn OTTIMO · tiêu đề · dòng phụ · EN · nét Oak · VI · chân trang. size: "a5", "a4" hoặc "a4-ru".

    "a4-ru" (Tờ 4ru): phần sau "---" là RU; hai cột EN trái – RU phải, mỗi hàng một cặp đoạn cùng nghĩa."""
    spec = {"a4": NOTICE_A4, "a4-ru": NOTICE_A4_RU}.get(size, SPEC["4"])
    paras, cur = [], []
    for line in sheet["lines"] + [""]:
        s = line.strip()
        if s == "---":
            if cur:
                paras.append(" ".join(cur))
                cur = []
            paras.append("---")
        elif not s:
            if cur:
                paras.append(" ".join(cur))
                cur = []
        else:
            cur.append(s)
    label = paras.pop(0)
    # "**Your ID details**" và "*Thông tin giấy tờ của bạn*" có thể nằm liền hai dòng (một đoạn).
    m = re.match(r"^\*\*(.+?)\*\*\s*(?:\*([^*].*?)\*)?$", paras.pop(0))
    if not m:
        raise SystemExit("Tờ 4: dòng tiêu đề phải dạng **Tiêu đề** *Dòng phụ*")
    title, sub = m.group(1), m.group(2)
    if sub is None and paras and re.match(r"^\*[^*].*\*$", paras[0]):
        sub = paras.pop(0)[1:-1]
    foot = paras.pop() if paras and "ID notice" in paras[-1] else ""
    cut = paras.index("---") if "---" in paras else len(paras)
    en, vi = paras[:cut], [p for p in paras[cut + 1:] if p != "---"]
    fl, _, fr = foot.rpartition(" · ")
    if size == "a4-ru":
        if len(en) != len(vi):
            raise SystemExit("Tờ %s: số đoạn EN (%d) và RU (%d) phải bằng nhau" % (sheet["id"], len(en), len(vi)))
        rows = "".join('<div class="en" lang="en"><p>%s</p></div><div class="ru" lang="ru"><p>%s</p></div>'
                       % (il(a), il(b)) for a, b in zip(en, vi))
        return (
            '<section class="sheet notice a4 pairs" data-sheet="%s" style="--fs:%spt;--fs-vi:%spt">'
            % (esc(sheet["id"]), spec["fs"], spec["fs_vi"])
            + '<div class="inner"><div class="fit">'
            + '<p class="eyebrow">%s</p>' % esc(label)
            + '<h2 lang="en">%s</h2>' % il(title)
            + ('<p class="sub" lang="ru">%s</p>' % il(sub) if sub else "")
            + '<div class="grid">%s</div>' % rows
            + "</div>"
            + '<footer class="nfoot"><span>%s</span><span>%s</span></footer>' % (esc(fl or foot), esc(fr))
            + "</div></section>"
        )
    return (
        '<section class="sheet notice %s" data-sheet="4" style="--fs:%spt;--fs-vi:%spt">'
        % (spec["size"], spec["fs"], spec["fs_vi"])
        + '<div class="inner"><div class="fit">'
        + '<p class="eyebrow">%s</p>' % esc(label)
        + '<h2 lang="en">%s</h2>' % il(title)
        + ('<p class="sub">%s</p>' % il(sub) if sub else "")
        + '<div class="en" lang="en">%s</div>' % "".join("<p>%s</p>" % il(p) for p in en)
        + '<hr class="rule">'
        + '<div class="vi" lang="vi">%s</div>' % "".join("<p>%s</p>" % il(p) for p in vi)
        + "</div>"
        + '<footer class="nfoot"><span>%s</span><span>%s</span></footer>' % (esc(fl or foot), esc(fr))
        + "</div></section>"
    )


CSS = r"""
:root{--ivory:#F4F0E8;--cream:#EDE6D8;--stone:#6B6760;--ink:#2B2B28;--oak:#B08D57;--earth:#7A5C44;--paper:#FFFFFF;
  --sans:'Be Vietnam Pro',Arial,Helvetica,sans-serif;--serif:'Lora',Georgia,'Times New Roman',serif;
  --mono:'JetBrains Mono','Courier New',monospace;--ru:'Onest',Arial,Helvetica,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact;-webkit-text-size-adjust:100%}
body{background:var(--paper);color:var(--ink);font-family:var(--sans);font-weight:400;
  font-kerning:normal;text-rendering:optimizeLegibility;hyphens:manual}
.page{width:var(--pw);height:var(--ph);display:flex;overflow:hidden;position:relative;background:var(--paper)}
.sheet{flex:0 0 auto;width:var(--sw);height:var(--sh);position:relative;overflow:hidden}
.sheet.a4{--sw:210mm;--sh:297mm}
.sheet.a5{--sw:148mm;--sh:210mm}
.page.two .sheet.a5{--sw:148.5mm}
.page.two::after{content:"";position:absolute;left:148.5mm;top:0;bottom:0;border-left:0.3pt dashed var(--stone)}
.inner{position:absolute;inset:0;display:flex;flex-direction:column}
.nb{white-space:nowrap}
strong{font-weight:600}
em{font-style:italic}
code{font-family:var(--mono);font-size:.92em;font-weight:400;letter-spacing:0}

/* ---- tờ nhân viên (1, 2a, 2b, 3) ---- */
.staff{font-size:var(--fs);line-height:var(--lh,1.42)}
.staff.a4 .inner{padding:var(--pad,11mm 12mm 8mm)}
.dense{--lh:1.3;--pad:7mm 6mm 5mm}
.dense .flow h3{font-size:1.22em}
.dense .flow p{margin-bottom:.8mm}.dense .flow li{margin-bottom:.3mm}.dense .flow h3{margin:2mm 0 1mm}
.dense .sfoot{margin-top:1.2mm;padding-top:1mm}
.dense .flow th,.dense .flow td{padding:.35mm .8mm}.dense.c2 .flow{column-gap:5.5mm}
.dense .shead{padding-bottom:1.8mm;margin-bottom:2mm}
.staff.a4.dense .shead h2{font-size:15pt}.dense .intro{margin-top:1.4mm}
.staff.a5 .inner{padding:var(--pad,11mm 11mm 8mm)}
/* Tờ 2a bản 07/11 (hộp Thông báo, DOM FB-R5-DOM-PO-08) với dòng 1,3 chỉ vừa khít 11 pt (còn 0 mm). Giữ cỡ chữ 11 pt và
   viền cách mép 6 mm; dòng 1,28 (dấu chồng tiếng Việt không chạm dòng trên, đã soi ảnh ~420 dpi) và bớt khoảng trắng phụ
   để còn dư khoảng một dòng mỗi cột (đo 07/11: 6,5 mm), phòng khi in HTML ở trình duyệt khác. */
.snug{--lh:1.28}
.snug.c2 .flow{column-gap:6mm}
.snug .shead{padding-bottom:2mm;margin-bottom:2.2mm}
.snug .flow li{margin-bottom:.35mm}
.staff.frame .inner{inset:6mm;border:0.8pt solid var(--oak);padding:3.5mm 4mm 1.5mm}
.eyebrow{font-family:var(--sans);font-size:8pt;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  color:var(--stone);line-height:1.2}
.shead h2{font-family:var(--serif);font-weight:500;color:var(--ink);letter-spacing:.02em;line-height:1.15;
  margin-top:0}
.staff.a4 .shead h2{font-size:17pt}
.staff.a5 .shead h2{font-size:calc(var(--fs) * 1.25)}
.hrow{display:flex;justify-content:space-between;align-items:baseline;gap:5mm}
.shead h2{text-wrap:balance}
.hrow .eyebrow,.hrow .side{flex:0 0 auto;text-align:right}
.shead h2 .paren{font-size:.72em;color:var(--stone)}
.intro{margin-top:2mm}
.intro p+p{margin-top:1.2mm}
.shead{padding-bottom:2.4mm;margin-bottom:2.6mm;border-bottom:0.6pt solid var(--oak)}
.fit{flex:1 1 auto;min-height:0;overflow:hidden}
.c2 .flow{column-count:2;column-gap:7mm;column-fill:balance}
.flow h3{font-family:var(--serif);font-weight:500;font-size:1.3em;line-height:1.2;color:var(--ink);
  padding-bottom:.6mm;border-bottom:0.4pt solid var(--oak);margin:2.6mm 0 1.4mm;break-after:avoid}
.flow h3:first-child{margin-top:0}
.flow p{margin:0 0 1.15mm}
.flow ul,.flow ol{margin:0 0 1.2mm;padding-left:1.15em}
.flow ul{list-style:none}
.flow ul>li{position:relative}
.flow ul>li::before{content:"";position:absolute;left:-.85em;top:.62em;width:.32em;height:.32em;border-radius:50%;
  background:var(--oak)}
.flow ul ul{margin:.4mm 0 .4mm}
.flow li{margin-bottom:.55mm}
.flow ol{padding-left:1.5em}
.flow ol>li::marker{font-weight:600;color:var(--earth)}
.flow table{width:100%;border-collapse:collapse;margin:0 0 1.6mm;break-inside:avoid}
.flow th,.flow td{text-align:left;vertical-align:top;padding:.55mm 1.4mm;border-bottom:0.25pt solid var(--stone)}
.flow th{background:var(--cream);font-weight:600}
.flow td:first-child{white-space:nowrap;font-weight:600}
.flow li,.flow p,.flow tr{orphans:2;widows:2}
.note{border-left:0.8pt solid var(--oak);padding-left:2mm}
.sfoot{flex:0 0 auto;display:flex;justify-content:space-between;gap:6mm;margin-top:2mm;padding-top:1.4mm;
  border-top:0.25pt solid var(--stone);font-size:8pt;line-height:1.3;color:var(--stone)}
.a5 .sfoot{font-size:7.5pt}
.sfoot span:last-child{text-align:right}

/* ---- tờ 4: Your ID details (khách đọc) ---- */
.notice .inner{padding:12mm 12mm 9mm}
.notice .eyebrow{font-size:9pt;letter-spacing:.1em}
.notice h2{font-family:var(--serif);font-weight:500;font-size:20pt;letter-spacing:.02em;line-height:1.15;
  color:var(--ink);margin-top:3mm}
.notice .sub{font-family:var(--serif);font-weight:500;font-size:12pt;line-height:1.3;color:var(--stone);
  margin-top:1mm;margin-bottom:4mm}
.notice .en p{font-size:var(--fs);line-height:1.42;margin-bottom:.5em}
.notice .vi p{font-size:var(--fs-vi);line-height:1.42;margin-bottom:.5em}
.notice .en p:last-child,.notice .vi p:last-child{margin-bottom:0}
.notice .rule{border:0;border-top:0.6pt solid var(--oak);width:22mm;margin:3.5mm 0}
.notice .fit{flex:1 1 auto}
.nfoot{flex:0 0 auto;display:flex;justify-content:space-between;font-size:8pt;line-height:1.2;color:var(--stone);
  padding-top:2.5mm}
/* Tờ 4 khổ A4 dọc: đọc từ 60–80 cm. Tỉ lệ giữ như A5, phóng theo khổ (≈ ×1,4) rồi làm tròn. */
.notice.a4 .inner{padding:15mm 17mm 11mm}
.notice.a4 .eyebrow{font-size:12pt;letter-spacing:.12em}
.notice.a4 h2{font-size:32pt;margin-top:4mm}
.notice.a4 .sub{font-size:17pt;margin-top:1.2mm;margin-bottom:5.5mm}
.notice.a4 .en p,.notice.a4 .vi p{line-height:1.4;margin-bottom:.5em;text-wrap:pretty}
.notice.a4 .rule{border-top-width:1pt;width:32mm;margin:5mm 0}
.notice.a4 .nfoot{font-size:11pt;padding-top:4mm}
/* Tờ 4ru: A4 dọc, EN trái (Be Vietnam Pro) – RU phải (Onest), mỗi hàng một cặp đoạn, nét Oak dọc giữa hai cột. */
.notice.pairs .inner{padding:15mm 15mm 11mm}
.notice.pairs h2{font-size:30pt}
.notice.pairs .sub{font-size:16pt;margin-bottom:5mm}
.notice.pairs .grid{display:grid;grid-template-columns:1fr 1fr;column-gap:10mm;row-gap:0;
  border-top:1pt solid var(--oak);padding-top:5mm;
  background:linear-gradient(var(--oak),var(--oak)) center top/0.6pt 100% no-repeat}
.notice.pairs .grid>div{padding-bottom:.55em}
.notice.pairs .grid>div:nth-last-child(-n+2){padding-bottom:0}
.notice.pairs .en p{font-size:var(--fs);line-height:1.38;margin:0;text-wrap:pretty}
.notice.pairs .ru p{font-family:var(--ru);font-size:var(--fs-vi);line-height:1.38;margin:0;text-wrap:pretty}

/* ---- màn hình: xem trước trên nền Ivory; khi in chỉ còn tờ trắng ---- */
@media screen{
  body{background:var(--ivory);padding:16px}
  .howto{max-width:var(--pw);margin:0 auto 16px;font-size:13px;line-height:1.5;color:var(--ink)}
  .howto b{font-weight:600}
  .page{margin:0 auto;box-shadow:0 1px 3px rgba(43,43,40,.18),0 8px 24px rgba(43,43,40,.08)}
}
@media screen and (max-width:900px){body{padding:16px 0}.howto{padding:0 16px}.page{zoom:.42}}
@media print{.howto{display:none}body{background:none}}
"""

MEASURE_JS = r"""
window.__measure = function(){
  function over(el){return el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1}
  var out=[];
  document.querySelectorAll('.sheet').forEach(function(s,i){
    var fit=s.querySelector('.fit'), base=parseFloat(getComputedStyle(s).getPropertyValue('--fs'));
    var vi=parseFloat(getComputedStyle(s).getPropertyValue('--fs-vi'))||null, d=vi?base-vi:0;
    function setfs(v){s.style.setProperty('--fs',v+'pt');if(vi)s.style.setProperty('--fs-vi',(v-d)+'pt');}
    var r={sheet:s.dataset.sheet,index:i,basePt:base,viPt:vi,overflow:over(fit)};
    var p=s.querySelector('.flow p, .flow li, .en p');
    r.measuredPt=p?Math.round(parseFloat(getComputedStyle(p).fontSize)*0.75*100)/100:null;
    var pv=s.querySelector('.vi p, .ru p');
    if(pv)r.measuredViPt=Math.round(parseFloat(getComputedStyle(pv).fontSize)*0.75*100)/100;
    var max=base;for(var v=base+0.25;v<=base+4;v+=0.25){setfs(v);if(over(fit))break;max=v;}
    var min=null;if(r.overflow){for(var w=base-0.25;w>=7;w-=0.25){setfs(w);if(!over(fit)){min=w;break;}}}
    setfs(base);
    r.maxFitPt=r.overflow?null:max;r.minFitPt=min;
    // Chỗ trống còn lại: bớt chiều cao vùng thân từng 0,5 mm tới khi tràn (tờ 2 cột: mỗi cột còn chừng đó).
    var slack=0;if(!r.overflow){var h0=fit.clientHeight,mm=96/25.4;fit.style.flex='0 0 auto';
      for(var k=1;k<=400;k++){fit.style.height=(h0-k*0.5*mm)+'px';if(over(fit))break;slack=k*0.5;}
      fit.style.height='';fit.style.flex='';}
    r.slackMm=slack;var lp=s.querySelector('.flow p, .flow li, .en p');
    r.slackLines=lp?Math.floor(slack*96/25.4/parseFloat(getComputedStyle(lp).lineHeight)):null;
    var seen={};document.fonts.forEach(function(f){if(f.status==='loaded')seen[f.family.replace(/"/g,'')+' '+f.weight]=1;});
    r.fonts=Object.keys(seen).sort();
    out.push(r);
  });
  return out;
};
"""

PAGE = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light">
<title>{title}</title>
{fonts}
<style>@page{{size:{page};margin:0}}{css}</style>
</head>
<body style="--pw:{w}mm;--ph:{h}mm">
<p class="howto"><b>{title}</b> · {howto}</p>
<div class="page{two}">
{sheets}
</div>
<script>{js}</script>
</body>
</html>
"""


def howto(job):
    size = "A4 ngang" if job["page"] == "A4 landscape" else job["page"]
    s = "In: khổ %s, tỉ lệ Thực tế (100%%), một mặt, %s. Không bật Vừa trang." % (
        size, job.get("paper", "giấy trắng hoặc ngà"))
    if len(job["sheets"]) == 2:
        s += " In xong cắt đôi theo nét đứt giữa tờ."
    return s


def font_file(slug, subset, weight, extra=None):
    name = "%s-%s-%d-normal.woff2" % (slug, subset, weight)
    dirs = ([extra] if extra else []) + [ROOT / "product" / "apps" / "landing-web" / "node_modules" / "@fontsource",
                                         ROOT / "product" / "node_modules" / "@fontsource"]
    for d in dirs:
        p = Path(d) / slug / "files" / name
        if p.is_file():
            return p
    pnpm = ROOT / "product" / "node_modules" / ".pnpm"
    if pnpm.is_dir():
        for d in sorted(pnpm.glob("@fontsource+%s@*" % slug), reverse=True):
            p = d / "node_modules" / "@fontsource" / slug / "files" / name
            if p.is_file():
                return p
    return None


def fonts_head(job, font_dir=None):
    """(HTML phần đầu cho font, đã nhúng hay chưa). Nhúng base64 khi job có "embed" và đủ tệp font."""
    link = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            '<link rel="stylesheet" href="%s">' % esc(job.get("google", FONTS)))
    if not job.get("embed"):
        return link, False
    rules, missing = [], []
    for family, slug, weight, subsets in job["embed"]:
        for subset in subsets:
            p = font_file(slug, subset, weight, font_dir)
            if not p:
                missing.append("%s-%s-%d" % (slug, subset, weight))
                continue
            if p not in FONT_CACHE:
                FONT_CACHE[p] = base64.b64encode(p.read_bytes()).decode("ascii")
            rules.append("@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:block;"
                         "src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s}"
                         % (family, weight, FONT_CACHE[p], UR[subset]))
    if missing:
        msg = "Thiếu tệp font để nhúng cho %s: %s" % (job["file"], ", ".join(missing))
        if job.get("embed_required"):
            raise SystemExit(msg + ". Cài gói font (pnpm install trong product/) hoặc chỉ --font-dir.")
        print("  ! %s – dùng Google Fonts (cần mạng khi in)." % msg)
        return link, False
    return "<style>%s</style>" % "\n".join(rules), True


def build(md_path, out_dir, only=None, font_dir=None):
    meta, sheets = read_source(md_path)
    jobs = [j for j in JOBS if not only or j["file"] in only]
    unknown = sorted(set(only or []) - {j["file"] for j in JOBS})
    if unknown:
        raise SystemExit("Không có lần in: %s" % ", ".join(unknown))
    missing = sorted({k for j in jobs for k in j["sheets"] if k not in sheets})
    if missing:
        raise SystemExit("Thiếu phần '## Tờ %s' trong %s" % (", ".join(missing), md_path))
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for job in jobs:
        parts = [notice_sheet(sheets[k], job.get("notice", "a5")) if k.startswith("4")
                 else staff_sheet(k, sheets[k], meta) for k in job["sheets"]]
        font_html, embedded = fonts_head(job, font_dir)
        html_text = PAGE.format(title=esc(job["title"]), fonts=font_html, page=job["page"], css=CSS,
                                w=job["w"], h=job["h"], two=" two" if len(parts) == 2 else "",
                                howto=esc(howto(job)), sheets="\n".join(parts), js=MEASURE_JS)
        p = out_dir / (job["file"] + ".html")
        p.write_text(html_text, encoding="utf-8")
        written.append(p)
        print("  html: %s%s" % (p.relative_to(ROOT), " (font nhúng)" if embedded else ""))
    return written


# --------------------------------------------------------------------------- đo + in PDF (Chrome headless)

def pdf_pages(data):
    n = len(re.findall(rb"/Type\s*/Page(?![s\w])", data))
    boxes = re.findall(rb"/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]", data)
    mm = [(round((float(b[2]) - float(b[0])) * 25.4 / 72, 1), round((float(b[3]) - float(b[1])) * 25.4 / 72, 1))
          for b in boxes]
    return n, mm


def render_pdfs(html_files, pdf_dir):
    from check_manual import CHROME_CANDIDATES, WS, js  # noqa: E402

    chrome = next((c for c in CHROME_CANDIDATES if c and Path(c).exists()), None)
    if not chrome:
        print("Không thấy Chrome. Đặt biến CHROME.", file=sys.stderr)
        return 2, []
    pdf_dir.mkdir(parents=True, exist_ok=True)
    prof = tempfile.mkdtemp(prefix="ottimo-print-")
    proc = subprocess.Popen([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
                             "--remote-debugging-port=0", "--user-data-dir=" + prof, "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    bad, report = 0, []
    try:
        port_file = Path(prof) / "DevToolsActivePort"
        for _ in range(100):
            if port_file.exists() and port_file.read_text().strip():
                break
            time.sleep(0.1)
        port = int(port_file.read_text().split()[0])
        req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % port, method="PUT")
        target = json.loads(urllib.request.urlopen(req, timeout=10).read())
        ws = WS(target["webSocketDebuggerUrl"])
        ws.call("Page.enable")
        ws.call("Runtime.enable")
        ws.call("Emulation.setEmulatedMedia", media="print")
        for f in html_files:
            ws.call("Page.navigate", url=f.resolve().as_uri())
            for _ in range(200):
                time.sleep(0.1)
                if js(ws, "document.readyState") == "complete":
                    break
            js(ws, "document.fonts.ready.then(function(){return 1})", await_promise=True)
            time.sleep(0.4)
            meas = js(ws, "window.__measure()")
            pdf = base64.b64decode(ws.call("Page.printToPDF", preferCSSPageSize=True, printBackground=True)["data"])
            out = pdf_dir / (f.stem + ".pdf")
            out.write_bytes(pdf)
            pages, boxes = pdf_pages(pdf)
            ok = pages == 1 and not any(m["overflow"] for m in meas)
            bad += not ok
            report.append({"file": f.name, "pdf": out.name, "pages": pages, "mm": boxes[:1], "sheets": meas,
                           "kb": round(len(pdf) / 1024)})
            print("  pdf: %s – %d trang %s, %d KB – %s" % (out.relative_to(ROOT), pages, boxes[:1],
                                                         len(pdf) // 1024, "VỪA" if ok else "KHÔNG VỪA"))
            for m in meas:
                print("      Tờ %-2s đặt %s pt (đo %s pt%s) · tràn: %s · cỡ lớn nhất còn vừa: %s · cỡ nhỏ nhất vừa: %s · còn trống %s mm (~%s dòng/cột)"
                      % (m["sheet"], m["basePt"], m["measuredPt"],
                         ", VI %s pt" % m["measuredViPt"] if m.get("measuredViPt") else "",
                         "CÓ" if m["overflow"] else "không", m["maxFitPt"], m["minFitPt"],
                         m["slackMm"], m["slackLines"]))
                print("      font đã tải: %s" % ", ".join(m["fonts"]))
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        shutil.rmtree(prof, ignore_errors=True)
    return (1 if bad else 0), report


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--md", type=Path, default=DEFAULT_MD)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--pdf", action="store_true", help="đo bằng Chrome headless và in PDF vào <out>/pdf")
    ap.add_argument("--json", type=Path, help="ghi kết quả đo ra tệp JSON (không đưa vào repo)")
    ap.add_argument("--font-dir", type=Path, help="thư mục @fontsource để nhúng font (mặc định: tự tìm)")
    ap.add_argument("--only", nargs="+", metavar="FILE",
                    help="chỉ dựng các lần in này (tên tệp không đuôi, ví dụ to-4-your-id-details-a4)")
    a = ap.parse_args(argv)
    print("Nguồn: %s" % a.md)
    files = build(a.md, a.out, a.only, a.font_dir)
    if not a.pdf:
        return 0
    code, report = render_pdfs(files, a.out / "pdf")
    if a.json:
        a.json.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    return code


if __name__ == "__main__":
    sys.exit(main())
