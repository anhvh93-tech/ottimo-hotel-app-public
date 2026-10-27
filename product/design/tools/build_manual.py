#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dựng Sổ tay OTTIMO Desk (một tệp HTML tự đứng) từ Markdown của BA.

Chạy từ gốc repo (UXD, Round 3):
    python3 -I product/design/tools/build_manual.py

Tùy chọn:
    --md PATH        tệp nguồn   (mặc định product/docs/manual/user-manual-v1.0.md)
    --out PATH       tệp ra      (mặc định product/docs/manual/ottimo-manual-v1.0.html)
    --img-dir PATH   thư mục ảnh (mặc định <thư mục của --md>/img), tên ảnh <mã>.png|.jpg|.jpeg|.webp
    --link-images    trỏ ảnh bằng đường dẫn tương đối thay vì nhúng base64
                     (tệp nhẹ, nhưng phải gửi kèm thư mục img/)

Cú pháp Markdown được hỗ trợ (đúng những gì BA dùng):
    # / ## / ### tiêu đề · đoạn văn · **đậm** · *nghiêng* · `mã` · [chữ](link)
    bảng | … | (căn :-: / -: ) · danh sách - và 1. lồng nhau (thụt 2–3 dấu cách)
    > khối trích (có danh sách bên trong) · --- · [ẢNH: Cx-yy-mô tả] · <!-- chú thích --> (bị bỏ)
Khối trích mở đầu bằng **Tạm ở v1.0:**, **Lỗi nhỏ đã biết…:**, "Trước khi bắt đầu:" thành khung màu;
đoạn "Lưu ý:" / "Luôn nhớ:" ngay trước một danh sách thành khung "Lưu ý".

Chỉ dùng thư viện chuẩn Python 3.9+. Không sửa tệp nguồn, không sửa ảnh.
"""
import argparse
import base64
import datetime
import hashlib
import html
import re
import struct
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MD = ROOT / "product" / "docs" / "manual" / "user-manual-v1.0.md"
DEFAULT_OUT = ROOT / "product" / "docs" / "manual" / "ottimo-manual-v1.0.html"
PAGE_TITLE = "Sổ tay OTTIMO Desk v1.0"
MOTTO = "Desk đúng hơn sổ tay."
IMG_EXT = (".png", ".jpg", ".jpeg", ".webp")
MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}

# --------------------------------------------------------------------------- Markdown -> khối

HEAD_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
LIST_RE = re.compile(r"^( *)([-*+]|\d{1,3}[.)])\s+(.*)$")
HR_RE = re.compile(r"^\s{0,3}([-*_])(\s*\1){2,}\s*$")
IMG_RE = re.compile(r"^\[ẢNH:\s*(.+?)\s*\]$")
TABLE_SEP_RE = re.compile(r"^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$")
COMMENT_LINE_RE = re.compile(r"(?m)^[ \t]*<!--(?:(?!-->)[\s\S])*-->[ \t]*(?:\n|$)")
COMMENT_RE = re.compile(r"<!--(?:(?!-->)[\s\S])*-->")


def strip_comments(text):
    """Bỏ <!-- … --> (cả dòng chỉ có chú thích, để không cắt đôi danh sách)."""
    text = COMMENT_LINE_RE.sub("", text)
    text = COMMENT_RE.sub("", text)
    if "<!--" in text:
        print("  ! Cảnh báo: có '<!--' không đóng – phần đó sẽ hiện nguyên chữ.", file=sys.stderr)
    return text


def is_block_start(line):
    s = line.strip()
    return bool(
        HEAD_RE.match(line) or HR_RE.match(line) or LIST_RE.match(line)
        or s.startswith(">") or s.startswith("|") or IMG_RE.match(s)
    )


def split_row(line):
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|") and not s.endswith("\\|"):
        s = s[:-1]
    cells, cur, in_code, i = [], "", False, 0
    while i < len(s):
        ch = s[i]
        if ch == "\\" and i + 1 < len(s) and s[i + 1] == "|":
            cur += "|"
            i += 2
            continue
        if ch == "`":
            in_code = not in_code
        if ch == "|" and not in_code:
            cells.append(cur.strip())
            cur = ""
        else:
            cur += ch
        i += 1
    cells.append(cur.strip())
    if in_code:  # dấu ` lẻ: quay về cách tách đơn giản
        cells = [c.strip().replace("\\|", "|") for c in re.split(r"(?<!\\)\|", s)]
    return cells


def parse_aligns(line):
    out = []
    for c in split_row(line):
        c = c.strip()
        if c.startswith(":") and c.endswith(":"):
            out.append("c")
        elif c.endswith(":"):
            out.append("r")
        else:
            out.append("")
    return out


def build_list(entries, i, indent):
    ordered = entries[i][1]
    lst = {"t": "list", "ordered": ordered, "start": entries[i][2] or 1, "items": []}
    while i < len(entries):
        ind, is_ord, _num, text = entries[i]
        if ind < indent or (ind == indent and is_ord != ordered):
            break
        if ind > indent:  # mục thụt sâu mà chưa có mục cha: gắn vào mục trước
            if not lst["items"]:
                lst["items"].append({"text": "", "children": []})
            sub, i = build_list(entries, i, ind)
            lst["items"][-1]["children"].append(sub)
            continue
        item = {"text": text, "children": [], "num": _num}
        i += 1
        while i < len(entries) and entries[i][0] > indent:
            sub, i = build_list(entries, i, entries[i][0])
            item["children"].append(sub)
        lst["items"].append(item)
    return lst, i


def build_lists(entries):
    out, i = [], 0
    while i < len(entries):
        lst, i = build_list(entries, i, entries[i][0])
        out.append(lst)
    return out


def parse_blocks(lines):
    blocks, i, n = [], 0, len(lines)
    while i < n:
        line = lines[i]
        s = line.strip()
        if not s:
            i += 1
            continue
        m = HEAD_RE.match(line)
        if m:
            blocks.append({"t": "h", "level": len(m.group(1)), "text": m.group(2)})
            i += 1
            continue
        if HR_RE.match(line):
            blocks.append({"t": "hr"})
            i += 1
            continue
        m = IMG_RE.match(s)
        if m:
            blocks.append({"t": "img", "raw": m.group(1)})
            i += 1
            continue
        if s.startswith(">"):
            inner = []
            while i < n and lines[i].strip().startswith(">"):
                inner.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
            blocks.append({"t": "quote", "blocks": parse_blocks(inner)})
            continue
        if s.startswith("|") and i + 1 < n and TABLE_SEP_RE.match(lines[i + 1]):
            header, aligns, rows = split_row(line), parse_aligns(lines[i + 1]), []
            i += 2
            while i < n and lines[i].strip().startswith("|"):
                rows.append(split_row(lines[i]))
                i += 1
            blocks.append({"t": "table", "header": header, "aligns": aligns, "rows": rows})
            continue
        if LIST_RE.match(line):
            entries = []
            while i < n:
                cur = lines[i]
                m = LIST_RE.match(cur)
                if m:
                    marker = m.group(2)
                    is_ord = marker[0].isdigit()
                    entries.append([len(m.group(1)), is_ord, int(marker[:-1]) if is_ord else None, m.group(3)])
                    i += 1
                    continue
                if not cur.strip():
                    j = i
                    while j < n and not lines[j].strip():
                        j += 1
                    nm = LIST_RE.match(lines[j]) if j < n else None
                    # dòng trống rồi "1." ở lề trái = danh sách mới; còn lại là tiếp danh sách cũ
                    if nm and not (nm.group(1) == "" and re.match(r"^1[.)]$", nm.group(2))):
                        i = j
                        continue
                    break
                if is_block_start(cur):
                    break
                entries[-1][3] += " " + cur.strip()  # dòng nối tiếp của mục
                i += 1
            blocks.extend(build_lists(entries))
            continue
        para = [s]
        i += 1
        while i < n and lines[i].strip() and not is_block_start(lines[i]):
            para.append(lines[i].strip())
            i += 1
        blocks.append({"t": "p", "text": " ".join(para)})
    return blocks


# --------------------------------------------------------------------------- tiện ích

def esc(s):
    return html.escape(s, quote=True)


def slugify(s):
    s = s.replace("đ", "d").replace("Đ", "D")
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
    return s or "muc"


def plain(s):
    """Chữ trơn (bỏ dấu Markdown) – dùng cho aria-label, ước lượng độ rộng cột."""
    s = re.sub(r"`([^`]*)`", r"\1", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"(?<![\w*])\*(\S[^*]*?)\*(?![\w*])", r"\1", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
    return s


def short_title(t):
    """'Buồng phòng (HK) – app nhân viên…' -> 'Buồng phòng'."""
    t = plain(t)
    t = re.split(r"\s+[–—-]\s+", t)[0]
    t = re.sub(r"\s*\([^()]*\)", "", t)
    return re.sub(r"\s+", " ", t).strip()


def image_size(path):
    """(rộng, cao) của PNG/JPEG, hoặc None."""
    try:
        with open(path, "rb") as f:
            head = f.read(26)
            if head[:8] == b"\x89PNG\r\n\x1a\n":
                w, h = struct.unpack(">II", head[16:24])
                return w, h
            if head[:2] == b"\xff\xd8":
                f.seek(2)
                while True:
                    b = f.read(1)
                    while b and b != b"\xff":
                        b = f.read(1)
                    while b == b"\xff":
                        b = f.read(1)
                    if not b:
                        return None
                    marker = b[0]
                    if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
                        continue
                    seg_len = struct.unpack(">H", f.read(2))[0]
                    if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                        f.read(1)
                        h, w = struct.unpack(">HH", f.read(4))
                        return w, h
                    f.seek(seg_len - 2, 1)
    except (OSError, struct.error):
        return None
    return None


def load_shot_list(path):
    """Đọc screenshot-list.md: mã -> (màn hình, có phải ảnh điện thoại)."""
    info = {}
    if not path.exists():
        return info
    section_phone = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("#"):
            section_phone = "điện thoại" in line.lower()
            continue
        m = re.match(r"^\|\s*([A-Z]\d+-\d+)\s*\|(.*)$", line)
        if m:
            cells = split_row(line)
            screen = cells[1] if len(cells) > 1 else ""
            low = line.lower()
            phone = section_phone or "điện thoại" in low or "trên app" in low or "app nhân viên" in screen.lower()
            info[m.group(1)] = (screen, phone)
    return info


# --------------------------------------------------------------------------- dựng HTML

class Ctx:
    def __init__(self, img_dir, link_images, out_path, shot_info):
        self.img_dir = img_dir
        self.link_images = link_images
        self.out_path = out_path
        self.shot_info = shot_info
        self.sec_ids = {}      # "2.10" -> "s-2-10"
        self.used_ids = set()
        self.found, self.missing, self.refs = set(), [], 0
        self.img_cache = {}

    def uid(self, base):
        cand, k = base, 2
        while cand in self.used_ids:
            cand = "%s-%d" % (base, k)
            k += 1
        self.used_ids.add(cand)
        return cand


SAFE_HREF = re.compile(r"^(https?://|mailto:|#|\.{0,2}/?[\w./-]+$)")


def inline(text, ctx, xref=True):
    codes = []

    def keep(m):
        codes.append(m.group(2))
        return "\x00%d\x00" % (len(codes) - 1)

    t = re.sub(r"(`+)(.+?)\1", keep, text)
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(?=\S)(.+?)(?<=\S)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*(?=\S)([^*]+?)(?<=\S)\*(?![\w*])", r"<em>\1</em>", t)

    def link(m):
        href = html.unescape(m.group(2))
        if not SAFE_HREF.match(href):
            return m.group(0)
        return '<a href="%s">%s</a>' % (esc(href), m.group(1))

    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, t)

    if xref and ctx is not None:
        def ref(m):
            before = t_holder[0][: m.start()].rstrip()
            if before.endswith("\x00"):
                k = re.search(r"\x00(\d+)\x00$", before)
                if k and codes[int(k.group(1))].endswith(".md"):
                    return m.group(0)  # mục của tài liệu khác
            target = ctx.sec_ids.get(m.group(2))
            if not target:
                return m.group(0)
            return '<a class="xref" href="#%s">%s%s</a>' % (target, m.group(1), m.group(2))

        t_holder = [t]
        t = re.sub(r"(mục\s+)(\d+\.\d+)(?![\d])", ref, t)

    t = re.sub("\x00(\\d+)\x00", lambda m: "<code>%s</code>" % html.escape(codes[int(m.group(1))], quote=False), t)
    return t.replace("✔", "✔︎")  # dấu ✔ luôn ở dạng chữ, không thành emoji


ATTN_RE = re.compile(r"^(Lưu ý|Luôn nhớ|Chú ý|Quan trọng)[^:*]{0,40}:$")
LEAD_RE = re.compile(r"^\*\*([^*]+)\*\*$")
FAQ_RE = re.compile(r"^\*\*([^*]+\?)\*\*\s+(.+)$")
LABEL_RE = re.compile(r"^[^*`|]{2,60}:$")


def render_para(txt, ctx):
    m = LEAD_RE.match(txt)
    if m:
        return '<p class="lead">%s</p>' % inline(m.group(1), ctx)
    m = FAQ_RE.match(txt)
    if m:
        return '<p class="faq"><strong class="q">%s</strong> %s</p>' % (inline(m.group(1), ctx), inline(m.group(2), ctx))
    if LABEL_RE.match(txt):
        return '<p class="label">%s</p>' % inline(txt, ctx)
    return "<p>%s</p>" % inline(txt, ctx)


def render_list(b, ctx, depth=0):
    if b["ordered"]:
        cls = "steps" if depth == 0 else "steps sub"
        start = b["start"]
        attrs = ' class="%s"' % cls
        if start != 1:
            attrs += ' start="%d"' % start
        out = ["<ol%s>" % attrs]
    else:
        out = ['<ul class="bul">']
    num = b["start"]
    for it in b["items"]:
        if b["ordered"]:
            num = it.get("num") or num
            out.append('<li value="%d">%s' % (num, inline(it["text"], ctx)))
            num += 1
        else:
            out.append("<li>%s" % inline(it["text"], ctx))
        for ch in it["children"]:
            out.append(render_list(ch, ctx, depth + 1))
        out.append("</li>")
    out.append("</ol>" if b["ordered"] else "</ul>")
    return "".join(out)


def render_table(b, ctx):
    ncol = len(b["header"])
    rows = [(r + [""] * ncol)[:ncol] for r in b["rows"]]
    aligns = (b["aligns"] + [""] * ncol)[:ncol]
    widths = []
    for c in range(ncol):
        lens = [len(plain(b["header"][c]))] + [len(plain(r[c])) for r in rows]
        avg = sum(lens) / len(lens)
        widths.append(int(min(260, max(60, min(max(lens), avg * 1.5) * 6.4))))
    minw = sum(widths)
    wide = ncol >= 4 and minw > 380
    cls = "tbl wide" if wide else "tbl"
    style = ' style="min-width:%dpx"' % minw if wide else ""
    out = ['<div class="table-wrap" role="region" tabindex="0" aria-label="Bảng: %s">' % esc(plain(" · ".join(b["header"])))]
    out.append('<table class="%s"%s><thead><tr>' % (cls, style))
    for c, h in enumerate(b["header"]):
        a = ' class="%s"' % aligns[c] if aligns[c] else ""
        out.append('<th scope="col"%s>%s</th>' % (a, inline(h, ctx)))
    out.append("</tr></thead><tbody>")
    for r in rows:
        out.append("<tr>")
        for c, cell in enumerate(r):
            a = ' class="%s"' % aligns[c] if aligns[c] else ""
            out.append("<td%s>%s</td>" % (a, inline(cell, ctx)))
        out.append("</tr>")
    out.append("</tbody></table></div>")
    return "".join(out)


def find_image(ctx, code):
    for ext in IMG_EXT:
        for name in (code + ext, code + ext.upper()):
            p = ctx.img_dir / name
            if p.is_file():
                return p
    return None


def render_shots(group, ctx):
    figs = []
    for b in group:
        raw = b["raw"]
        m = re.match(r"^([A-Z]\d+-\d+)(?:\s*-\s*(.*))?$", raw)
        code, desc = (m.group(1), (m.group(2) or "").strip()) if m else (raw, "")
        screen, phone = ctx.shot_info.get(code, ("", False))
        if not desc:
            desc = plain(screen)
        path = find_image(ctx, code)
        ctx.refs += 1
        cap = '<figcaption><span class="code">%s</span> %s</figcaption>' % (esc(code), esc(desc))
        if path:
            ctx.found.add(code)
            size = image_size(path)
            if size:
                phone = size[1] > size[0] * 1.15
            if ctx.link_images:
                try:
                    src = path.resolve().relative_to(ctx.out_path.parent.resolve()).as_posix()
                except ValueError:
                    src = path.resolve().as_uri()
            else:
                if path not in ctx.img_cache:
                    data = base64.b64encode(path.read_bytes()).decode("ascii")
                    ctx.img_cache[path] = "data:%s;base64,%s" % (MIME[path.suffix.lower()], data)
                src = ctx.img_cache[path]
            dims = ' width="%d" height="%d"' % size if size else ""
            body = ('<button type="button" class="frame" aria-label="%s" aria-pressed="false">'
                    '<img src="%s" alt="%s"%s decoding="async"></button>') % (
                esc("Phóng to hoặc thu nhỏ ảnh %s" % code), src, esc("Ảnh %s: %s" % (code, desc)), dims)
        else:
            if code not in ctx.missing:
                ctx.missing.append(code)
            extra = '<span class="ph-screen">%s</span>' % inline(screen, None, xref=False) if screen else ""
            body = (
                '<div class="ph" role="img" aria-label="%s">'
                '<span class="ph-tag">Chưa có ảnh</span>%s<span class="ph-note">img/%s.png</span></div>'
            ) % (esc("Chỗ chèn ảnh %s: %s" % (code, desc)), extra, esc(code))
        figs.append('<figure class="shot %s%s">%s%s</figure>' % ("phone" if phone else "desk", " has-img" if path else "", body, cap))
    return '<div class="shots">%s</div>' % "".join(figs)


QUOTE_BOLD_RE = re.compile(r"^\*\*([^*]{2,70}?):\*\*\s*(.*)$")
QUOTE_BOLD2_RE = re.compile(r"^\*\*([^*]{2,70}?)\*\*:\s*(.*)$")
QUOTE_PLAIN_RE = re.compile(r"^([^*`:]{3,30}):\s+(.*)$")


def callout_kind(title):
    low = (title or "").lower()
    if low.startswith("tạm ở"):
        return "temp"
    if "lỗi" in low:
        return "bug"
    if low.startswith("trước khi"):
        return "prereq"
    if low.startswith(("lưu ý", "luôn nhớ", "chú ý", "quan trọng")):
        return "attention"
    return "note"


def callout(kind, title, inner_html):
    t = '<p class="callout-title">%s</p>' % title if title else ""
    label = ' aria-label="%s"' % esc(re.sub("<[^>]+>", "", title)) if title else ""
    return '<aside class="callout %s" role="note"%s>%s%s</aside>' % (kind, label, t, inner_html)


def render_quote(b, ctx):
    inner = [dict(x) for x in b["blocks"]]
    title = None
    if inner and inner[0]["t"] == "p":
        txt = inner[0]["text"]
        m = QUOTE_BOLD_RE.match(txt) or QUOTE_BOLD2_RE.match(txt)
        if not m:
            m2 = QUOTE_PLAIN_RE.match(txt)
            m = m2 if m2 and m2.group(1)[:1].isupper() else None
        if m:
            title, rest = m.group(1).strip(), m.group(2).strip()
            if rest:
                inner[0]["text"] = rest
            else:
                inner.pop(0)
    kind = callout_kind(title)
    return callout(kind, inline(title, ctx, xref=False) if title else None, render_blocks(inner, ctx))


def render_blocks(blocks, ctx):
    out, i = [], 0
    while i < len(blocks):
        b = blocks[i]
        t = b["t"]
        if t == "img":
            group = []
            while i < len(blocks) and blocks[i]["t"] == "img":
                group.append(blocks[i])
                i += 1
            out.append(render_shots(group, ctx))
            continue
        if t == "p":
            nxt = blocks[i + 1] if i + 1 < len(blocks) else None
            if ATTN_RE.match(b["text"]) and nxt and nxt["t"] == "list":
                title = b["text"].rstrip(":").strip()
                out.append(callout("attention", inline(title, ctx), render_list(nxt, ctx)))
                i += 2
                continue
            out.append(render_para(b["text"], ctx))
        elif t == "list":
            out.append(render_list(b, ctx))
        elif t == "table":
            out.append(render_table(b, ctx))
        elif t == "quote":
            out.append(render_quote(b, ctx))
        elif t == "hr":
            out.append("<hr>")
        elif t == "h":
            out.append(render_heading(b, ctx))
        i += 1
    return "\n".join(out)


def render_heading(b, ctx):
    lvl = min(6, max(3, b["level"]))
    hid = b.get("id")
    idattr = ' id="%s"' % hid if hid else ""
    if b.get("num"):
        return '<h%d%s><span class="n">%s</span><span>%s</span></h%d>' % (
            lvl, idattr, esc(b["num"]), inline(b["title"], ctx, xref=False), lvl)
    return "<h%d%s>%s</h%d>" % (lvl, idattr, inline(b["text"], ctx, xref=False), lvl)


# --------------------------------------------------------------------------- khung trang

def build(md_text, md_path, out_path, img_dir, link_images):
    shot_info = load_shot_list(md_path.parent / "screenshot-list.md")
    ctx = Ctx(img_dir, link_images, out_path, shot_info)
    blocks = parse_blocks(strip_comments(md_text).split("\n"))

    doc_title, pre, sections, cur = None, [], [], None
    for b in blocks:
        if b["t"] == "h" and b["level"] == 1 and doc_title is None:
            doc_title = b["text"]
            continue
        if b["t"] == "h" and b["level"] == 2:
            cur = {"title": b["text"], "blocks": []}
            sections.append(cur)
            continue
        (cur["blocks"] if cur is not None else pre).append(b)
    doc_title = doc_title or PAGE_TITLE

    # id cho chương và mục; bỏ "---" cuối mỗi phần (đã có ngắt chương)
    for sec in sections:
        while sec["blocks"] and sec["blocks"][-1]["t"] == "hr":
            sec["blocks"].pop()
        m = re.match(r"^Chương\s+(\d+)\s*[.:]\s*(.+)$", sec["title"])
        if m:
            sec["kind"], sec["num"], sec["name"] = "chapter", m.group(1), m.group(2)
            sec["id"] = ctx.uid("ch-" + m.group(1))
        else:
            sec["kind"], sec["num"], sec["name"] = "intro", None, sec["title"]
            sec["id"] = ctx.uid(slugify(sec["title"]))
        sec["subs"] = []
        for b in sec["blocks"]:
            if b["t"] == "h" and b["level"] >= 3:
                hm = re.match(r"^(\d+(?:\.\d+)+)\s+(.+)$", b["text"])
                if hm:
                    b["num"], b["title"] = hm.group(1), hm.group(2)
                    b["id"] = ctx.uid("s-" + hm.group(1).replace(".", "-"))
                    ctx.sec_ids.setdefault(hm.group(1), b["id"])
                else:
                    b["id"] = ctx.uid(slugify(b["text"]))
                if b["level"] == 3:
                    sec["subs"].append(b)
    while pre and pre[-1]["t"] == "hr":
        pre.pop()

    chapters = [s for s in sections if s["kind"] == "chapter"]
    intros = [s for s in sections if s["kind"] == "intro"]

    # "Dành cho" từ bảng Chương | Dành cho
    audience = {}
    for s in intros:
        for b in s["blocks"]:
            if b["t"] == "table" and plain(b["header"][0]).strip().lower() == "chương":
                for r in b["rows"]:
                    mm = re.match(r"^\s*(\d+)\.", plain(r[0]))
                    if mm and len(r) > 1:
                        audience[mm.group(1)] = r[1]

    # nút chuyển nhanh theo bộ phận
    dept = []
    for ch in chapters:
        if "," in short_title(ch["name"]) and ch["subs"]:
            for sb in ch["subs"]:
                dept.append((sb["id"], sb.get("num") or "", short_title(sb.get("title") or sb["text"])))
        else:
            dept.append((ch["id"], ch["num"], short_title(ch["name"])))
    common = [c["id"] for c in chapters if c["num"] == "0"]
    common += [c["id"] for c in chapters if short_title(c["name"]).lower().startswith("phụ lục")]
    intro_ids = [s["id"] for s in intros]

    # bìa
    version_full = re.search(r"v\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?", md_text)
    version_short = re.search(r"v(\d+\.\d+)", doc_title)
    date_m = re.search(r"Lập:[^\n]*?(\d{1,2}/\d{1,2}/\d{4})", md_text) or re.search(r"\d{1,2}/\d{1,2}/\d{4}", md_text)
    date_s = date_m.group(1) if date_m and date_m.groups() else (date_m.group(0) if date_m else "")
    motto_src = re.search(r"[^.\n>]*làm theo Desk[^.\n]*\.", strip_comments(md_text))

    # ---- phần thân
    body = []
    for sec in sections:
        content = render_blocks(sec["blocks"], ctx)
        if sec["kind"] == "intro":
            body.append(
                '<section class="intro" id="%s" aria-labelledby="%s-h"><h2 id="%s-h" class="intro-h">%s</h2>%s</section>'
                % (sec["id"], sec["id"], sec["id"], inline(sec["title"], ctx, xref=False), content))
            continue
        nm = re.match(r"^(.*?)\s*(\([^()]*\))$", sec["name"])
        title_html = inline(nm.group(1), ctx, xref=False) + ' <span class="roles">%s</span>' % esc(nm.group(2)) if nm else inline(sec["name"], ctx, xref=False)
        aud = audience.get(sec["num"])
        aud_html = '<p class="ch-aud"><span class="k">Dành cho</span> %s</p>' % inline(aud, ctx) if aud else ""
        dept_btn = ""
        if sec["id"] not in common and common:
            dept_btn = ('<button type="button" class="btn primary" data-print="dept" hidden>In bộ cho bộ phận</button>'
                        '<span class="hint" hidden>Bộ in gồm bìa, cách đọc, chương 0, chương này và phụ lục.</span>')
        tools = ('<div class="ch-tools">%s<button type="button" class="btn" data-print="chapter" hidden>In riêng chương này</button></div>'
                 % dept_btn)
        toc_items = "".join(
            '<li><a href="#%s"><span class="n">%s</span><span>%s</span></a></li>'
            % (sb["id"], esc(sb.get("num") or ""), inline(sb.get("title") or sb["text"], ctx, xref=False))
            for sb in sec["subs"])
        ch_toc = ('<details class="ch-toc"><summary>Các mục trong chương (%d)</summary><ol>%s</ol></details>'
                  % (len(sec["subs"]), toc_items)) if sec["subs"] else ""
        body.append(
            '<section class="chapter" id="%s" aria-labelledby="%s-h">'
            '<header class="ch-head"><p class="ch-label">Chương %s</p><h2 id="%s-h">%s</h2>%s%s%s</header>%s</section>'
            % (sec["id"], sec["id"], esc(sec["num"]), sec["id"], title_html, aud_html, tools, ch_toc, content))

    # ---- mục lục trong trang
    cards = []
    for ch in chapters:
        subs = ""
        if "," in short_title(ch["name"]) and ch["subs"]:
            subs = '<ul class="subs">%s</ul>' % "".join(
                '<li><a href="#%s"><span class="n">%s</span>%s</a></li>'
                % (sb["id"], esc(sb.get("num") or ""), esc(short_title(sb.get("title") or sb["text"])))
                for sb in ch["subs"])
        aud = audience.get(ch["num"])
        cards.append(
            '<li class="dept"><p class="ch-label">Chương %s · %d mục</p><p class="dept-title"><a href="#%s">%s</a></p>%s%s</li>'
            % (esc(ch["num"]), len(ch["subs"]), ch["id"], esc(short_title(ch["name"])),
               '<p class="aud">%s</p>' % inline(aud, ctx, xref=False) if aud else "", subs))
    tree = []
    for s in intros:
        tree.append('<li class="toc-row"><a href="#%s">%s</a></li>' % (s["id"], inline(s["title"], ctx, xref=False)))
    for ch in chapters:
        items = "".join(
            '<li><a href="#%s"><span class="n">%s</span><span>%s</span></a></li>'
            % (sb["id"], esc(sb.get("num") or ""), inline(sb.get("title") or sb["text"], ctx, xref=False))
            for sb in ch["subs"])
        tree.append(
            '<li><details class="toc-ch"><summary><span class="n">%s</span><span>%s</span></summary>'
            '<ol class="toc-secs"><li><a href="#%s"><span class="n">%s</span><span>Đầu chương</span></a></li>%s</ol></details></li>'
            % (esc(ch["num"]), inline(ch["name"], ctx, xref=False), ch["id"], esc(ch["num"]), items))
    toc = (
        '<section class="toc" id="muc-luc" aria-labelledby="muc-luc-h"><p class="ch-label">Theo bộ phận</p>'
        '<h2 id="muc-luc-h">Mục lục</h2><ul class="dept-grid">%s</ul>'
        '<p class="ch-label toc-all-h">Tất cả các mục</p><ul class="toc-all">%s</ul></section>'
        % ("".join(cards), "".join(tree)))

    # ---- thanh chuyển nhanh (điện thoại) + thanh bên (máy tính)
    chips = ['<a class="chip" href="#muc-luc">Mục lục</a>']
    for hid, num, label in dept:
        chips.append('<a class="chip" data-spy href="#%s"><span class="n">%s</span>%s</a>' % (hid, esc(num), esc(label)))
    side = ['<li class="side-top"><a href="#muc-luc">Mục lục</a></li>']
    for s in intros:
        side.append('<li class="side-top"><a href="#%s">%s</a></li>' % (s["id"], inline(s["title"], ctx, xref=False)))
    for ch in chapters:
        secs = "".join(
            '<li><a href="#%s"><span class="n">%s</span><span>%s</span></a></li>'
            % (sb["id"], esc(sb.get("num") or ""), inline(sb.get("title") or sb["text"], ctx, xref=False))
            for sb in ch["subs"])
        side.append(
            '<li class="side-ch" data-ch="%s"><a class="side-ch-a" href="#%s"><span class="n">%s</span><span>%s</span></a><ol class="side-secs">%s</ol></li>'
            % (ch["id"], ch["id"], esc(ch["num"]), esc(short_title(ch["name"])), secs))

    # ---- bìa
    facts = []
    if version_short:
        facts.append('<div><dt>Phiên bản</dt><dd>v%s%s</dd></div>' % (
            esc(version_short.group(1)),
            ' <span class="mono">· %s</span>' % esc(version_full.group(0)) if version_full else ""))
    if date_s:
        facts.append("<div><dt>Ngày</dt><dd>%s</dd></div>" % esc(date_s))
    cover_meta = render_blocks(pre, ctx) if pre else ""
    cover = (
        '<section class="cover" id="cover" aria-labelledby="cover-h">'
        '<p class="wm" aria-label="OTTIMO">OTTIMO</p><div class="rule" aria-hidden="true"></div>'
        '<h1 id="cover-h">%s</h1><dl class="facts">%s</dl>'
        '<p class="motto">%s</p>%s<div class="cover-meta">%s</div></section>'
        % (inline(doc_title, ctx, xref=False), "".join(facts), esc(MOTTO),
           '<p class="motto-sub">%s</p>' % inline(motto_src.group(0).strip(), ctx, xref=False) if motto_src else "",
           cover_meta))

    digest = hashlib.sha256(md_text.encode("utf-8")).hexdigest()[:10]
    unique_refs = len(ctx.found) + len(ctx.missing)
    colophon = (
        '<footer class="colophon"><p>Dựng tự động từ <code>%s</code> · mã nội dung <code>%s</code> · ngày dựng %s · '
        "ảnh đã có %d/%d mã.</p></footer>"
        % (esc(md_path.name), digest, datetime.date.today().strftime("%d/%m/%Y"), len(ctx.found), unique_refs))

    page = TEMPLATE.format(
        title=esc(PAGE_TITLE),
        description=esc(plain(doc_title)),
        css=CSS,
        js=JS,
        chips="".join(chips),
        side="".join(side),
        common=esc(" ".join(intro_ids + common)),
        cover=cover,
        toc=toc,
        body="\n".join(body),
        colophon=colophon,
    )
    return page, ctx, chapters


CSS = r"""
:root{
  --ivory:#F4F0E8;--cream:#EDE6D8;--stone:#6B6760;--ink:#2B2B28;
  --oak:#B08D57;--earth:#7A5C44;--sage:#8A9079;--white:#FFFFFF;
  --line:#E0D8CA;--line-strong:#857E71;--deco:#9A948A;
  --f-head:"Lora",Georgia,"Times New Roman",serif;
  --f-body:"Be Vietnam Pro",Arial,"Helvetica Neue",system-ui,sans-serif;
  --f-mono:"JetBrains Mono","Courier New",ui-monospace,monospace;
  --gutter:16px;--spy:76px;
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
body{margin:0;background:var(--ivory);color:var(--ink);font:400 1rem/1.6 var(--f-body);overflow-wrap:break-word}
a{color:var(--earth);text-decoration-thickness:1px;text-underline-offset:.18em}
a:focus-visible,button:focus-visible,summary:focus-visible,.table-wrap:focus-visible{outline:2px solid var(--earth);outline-offset:2px;border-radius:4px}
code,.mono{font-family:var(--f-mono);font-size:.86em}
code{background:var(--cream);padding:.08em .35em;border-radius:4px;color:var(--ink);overflow-wrap:anywhere}
strong{font-weight:600;color:var(--ink)}
.skip{position:absolute;left:-9999px;top:8px;z-index:100;background:var(--ink);color:var(--ivory);padding:12px 16px;border-radius:8px;text-decoration:none}
.skip:focus{left:var(--gutter)}

/* đầu trang + thanh chuyển nhanh (điện thoại, máy tính bảng) */
.mhead{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:14px var(--gutter) 10px}
.wm{font-family:var(--f-head);font-weight:500;letter-spacing:.12em;margin:0}
.mhead .wm{font-size:1.05rem}
.mhead .doc{font-size:.8rem;color:var(--stone)}
.chipbar{position:sticky;top:0;z-index:20;background:var(--ivory);border-bottom:1px solid var(--line);border-top:1px solid var(--line)}
.chips{display:flex;gap:8px;overflow-x:auto;padding:8px var(--gutter);scrollbar-width:none;-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent);mask-image:linear-gradient(90deg,#000 88%,transparent)}
.chips::-webkit-scrollbar{display:none}
.chip{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border-radius:999px;background:var(--cream);color:var(--ink);text-decoration:none;font-size:.875rem;font-weight:500;white-space:nowrap;transition:background-color .2s,color .2s}
.chip .n{font-family:var(--f-mono);font-size:.75rem;color:var(--stone)}
.chip[aria-current]{background:var(--ink);color:var(--ivory)}
.chip[aria-current] .n{color:var(--cream)}
.chips .chip:last-child{margin-right:48px}

/* bố cục */
.content{max-width:46rem;margin:0 auto;padding:0 var(--gutter) 64px}
.sidebar{display:none}
section[id],h3[id],h4[id]{scroll-margin-top:var(--spy)}

/* bìa */
.cover{padding:40px 0 36px;border-bottom:1px solid var(--line)}
.cover .wm{font-size:1.35rem;margin-bottom:24px}
.cover .rule{width:56px;height:2px;background:var(--oak);margin:0 0 24px}
.cover h1{font-family:var(--f-head);font-weight:500;font-size:clamp(2.1rem,8.6vw,3.4rem);line-height:1.1;letter-spacing:.004em;margin:0 0 24px;text-wrap:balance}
.facts{display:flex;flex-wrap:wrap;gap:12px 32px;margin:0 0 28px}
.facts dt,.ch-label,.k{font-size:.75rem;font-weight:600;letter-spacing:.01em;text-transform:uppercase;color:var(--stone);margin:0}
.facts dd{margin:2px 0 0;font-size:1.05rem;font-weight:500}
.facts .mono{font-size:.85rem;color:var(--stone);font-weight:400}
.motto{font-family:var(--f-head);font-style:italic;font-size:1.45rem;line-height:1.3;margin:0 0 6px}
.motto-sub{color:var(--stone);margin:0 0 28px;max-width:34rem}
.motto-sub strong{color:var(--ink)}
.cover-meta{font-size:.85rem;color:var(--stone);border-top:1px solid var(--line);padding-top:16px}
.cover-meta ul{margin:0;padding-left:1.1rem}
.cover-meta li{margin:.3rem 0}
.cover-meta strong,.cover-meta code{color:var(--ink)}

/* mục lục */
.toc{padding:40px 0 8px}
.toc h2,.intro-h{font-family:var(--f-head);font-weight:500;font-size:1.85rem;line-height:1.2;letter-spacing:.002em;margin:4px 0 16px}
.dept-grid{list-style:none;margin:0 0 32px;padding:0;display:grid;gap:10px;grid-template-columns:1fr}
.dept{position:relative;background:var(--cream);border-radius:10px;padding:12px 14px;border:1px solid transparent;transition:border-color .2s}
.dept:hover{border-color:var(--oak)}
.dept-title{font-family:var(--f-head);font-size:1.15rem;font-weight:500;line-height:1.3;margin:2px 0 0}
.dept-title a{color:var(--ink);text-decoration:none}
.dept-title a::after{content:"";position:absolute;inset:0;border-radius:10px}
.dept .aud{font-size:.85rem;color:var(--stone);margin:4px 0 0;line-height:1.45}
.dept .aud strong{color:var(--stone);font-weight:500}
.dept .subs{position:relative;z-index:1;list-style:none;display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0;padding:0}
.dept .subs a{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 12px;border-radius:999px;background:var(--ivory);color:var(--ink);text-decoration:none;font-size:.85rem;font-weight:500}
.dept .subs .n,.toc .n,.side-secs .n,.ch-toc .n{font-family:var(--f-mono);font-size:.78rem;color:var(--earth)}
.toc-all-h{margin-bottom:6px}
.toc-all{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.toc-all>li{border-bottom:1px solid var(--line)}
.toc-row a{display:flex;align-items:center;min-height:48px;color:var(--ink);text-decoration:none;font-weight:600}
.toc-ch summary{display:flex;align-items:center;gap:10px;min-height:48px;padding:6px 0;cursor:pointer;list-style:none;font-weight:600}
.toc-ch summary::-webkit-details-marker{display:none}
.toc-ch summary::after,.ch-toc summary::after{content:"";flex:0 0 auto;margin-left:auto;margin-right:6px;width:8px;height:8px;border-right:1.5px solid var(--stone);border-bottom:1.5px solid var(--stone);transform:rotate(45deg);transition:transform .2s}
.toc-ch[open] summary::after,.ch-toc[open] summary::after{transform:rotate(-135deg)}
.toc-ch summary .n{min-width:1.2rem}
.toc-secs,.ch-toc ol{list-style:none;margin:0 0 12px;padding:0}
.toc-secs a,.ch-toc a{display:flex;gap:10px;align-items:baseline;padding:9px 0;color:var(--ink);text-decoration:none;font-size:.95rem;line-height:1.4}
.toc-secs .n,.ch-toc .n{min-width:2.6rem;flex:0 0 auto}
.toc-secs a:hover span:last-child,.ch-toc a:hover span:last-child{text-decoration:underline;text-underline-offset:.18em}

/* chương */
.intro,.chapter{padding-top:48px}
.ch-head{padding-bottom:16px;margin-bottom:8px;border-bottom:1px solid var(--line)}
.ch-head::before{content:"";display:block;width:56px;height:2px;background:var(--oak);margin-bottom:20px}
.ch-head h2{font-family:var(--f-head);font-weight:500;font-size:clamp(1.75rem,6.4vw,2.3rem);line-height:1.2;letter-spacing:.002em;margin:6px 0 10px;text-wrap:balance}
.ch-head .roles{font-family:var(--f-body);font-size:.55em;font-weight:500;color:var(--stone);white-space:nowrap;letter-spacing:0}
.ch-aud{margin:0 0 14px;color:var(--ink);font-size:.95rem}
.ch-aud .k{display:block;margin-bottom:2px}
.ch-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 6px}
.ch-tools .hint{flex-basis:100%;font-size:.8rem;color:var(--stone)}
.btn{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:8px;border:1px solid var(--earth);background:transparent;color:var(--earth);font:600 .875rem/1 var(--f-body);cursor:pointer;transition:background-color .2s,color .2s}
.btn:hover{background:var(--cream)}
.btn.primary{background:var(--earth);color:var(--white)}
.btn.primary:hover{background:var(--ink);border-color:var(--ink)}
.ch-toc{margin-top:6px}
.ch-toc summary{display:flex;align-items:center;min-height:44px;cursor:pointer;list-style:none;font-weight:600;font-size:.9rem;color:var(--earth)}
.ch-toc summary::-webkit-details-marker{display:none}
.ch-toc a{border-top:1px solid var(--line)}

h3{font-family:var(--f-body);font-weight:600;font-size:1.2rem;line-height:1.3;margin:2.6rem 0 .8rem;display:flex;gap:10px;align-items:baseline}
h3 .n{font-family:var(--f-mono);font-weight:500;font-size:.8em;color:var(--earth);flex:0 0 auto}
h4,h5,h6{font-family:var(--f-body);font-weight:600;font-size:1.05rem;margin:1.8rem 0 .6rem}
p{margin:.75rem 0}
p.lead{display:flex;gap:10px;align-items:baseline;font-weight:600;margin:1.6rem 0 .5rem}
p.lead::before{content:"";flex:0 0 auto;width:14px;height:2px;background:var(--oak);transform:translateY(-.3em)}
p.label{font-weight:600;margin:1.2rem 0 .4rem}
p.faq{margin:0;padding:14px 0;border-top:1px solid var(--line)}
p.faq .q{display:block;margin-bottom:4px}
hr{border:0;border-top:1px solid var(--line);margin:2rem 0}
a.xref{white-space:nowrap}

/* danh sách */
ul.bul{padding-left:1.25rem;margin:.6rem 0 1rem}
ul.bul>li{margin:.35rem 0;padding-left:.2rem}
ul.bul>li::marker{color:var(--oak)}
ol.steps{list-style:none;margin:.8rem 0 1.2rem;padding:0}
ol.steps>li{position:relative;padding:0 0 .9rem 2.6rem;min-height:2rem}
ol.steps>li::before{content:attr(value);position:absolute;left:0;top:0;width:1.8rem;height:1.8rem;border-radius:50%;background:var(--earth);color:var(--white);font:600 .85rem/1.8rem var(--f-body);text-align:center;font-variant-numeric:tabular-nums}
ol.steps>li:not(:last-child)::after{content:"";position:absolute;left:calc(.9rem - 1px);top:1.95rem;bottom:.15rem;width:2px;background:var(--line)}
ol.steps>li:last-child{padding-bottom:.2rem}
ol.steps.sub{margin:.6rem 0 .4rem}
ol.steps.sub>li{padding-left:2.2rem;padding-bottom:.6rem}
ol.steps.sub>li::before{width:1.5rem;height:1.5rem;font-size:.78rem;line-height:calc(1.5rem - 2px);background:transparent;color:var(--earth);border:1px solid var(--earth)}
ol.steps.sub>li:not(:last-child)::after{left:calc(.75rem - 1px);top:1.6rem}
ol.steps ul.bul{margin:.4rem 0 .2rem}

/* bảng */
.table-wrap{overflow-x:auto;margin:1rem 0 1.25rem;border:1px solid var(--line);border-radius:10px;background:var(--ivory)}
table.tbl{border-collapse:separate;border-spacing:0;width:100%;font-size:.9rem;line-height:1.45}
.tbl th,.tbl td{padding:.6rem .75rem;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}
.tbl th{background:var(--cream);font-weight:600;font-size:.82rem;color:var(--ink)}
.tbl tbody tr:last-child td{border-bottom:0}
.tbl code{white-space:nowrap;overflow-wrap:normal}
.tbl .c{text-align:center}
.tbl .r{text-align:right}
.tbl.wide th:first-child,.tbl.wide td:first-child{position:sticky;left:0;z-index:1;box-shadow:1px 0 0 var(--line)}
.tbl.wide td:first-child{background:var(--ivory)}
.tbl.wide th:first-child{background:var(--cream)}

/* khung */
.callout{margin:1.25rem 0;padding:14px 16px 12px;border-radius:10px;background:var(--cream);border-left:4px solid var(--stone)}
.callout>:first-child{margin-top:0}
.callout>:last-child{margin-bottom:0}
.callout p{margin:.5rem 0}
.callout code{background:var(--ivory)}
.callout-title{display:inline-block;margin:0 0 .5rem!important;padding:3px 9px;border-radius:4px;font-size:.8rem;font-weight:600;line-height:1.35}
.callout-title+p::first-letter{text-transform:uppercase}
.callout.temp{border-left-color:var(--oak)}
.callout.temp .callout-title{background:var(--earth);color:var(--white)}
.callout.attention{background:var(--ivory);border:1px solid var(--line-strong);border-left:4px solid var(--ink)}
.callout.attention .callout-title{background:var(--ink);color:var(--ivory)}
.callout.attention code{background:var(--cream)}
.callout.bug{background:var(--ivory);border:1px dashed var(--line-strong);border-left:4px solid var(--stone)}
.callout.bug .callout-title{border:1px solid var(--stone);color:var(--ink)}
.callout.bug code{background:var(--cream)}
.callout.prereq{border-left-color:var(--sage)}
.callout.prereq .callout-title{border:1px solid var(--sage);color:var(--ink)}
.callout ol.steps>li:not(:last-child)::after{background:var(--deco)}

/* ảnh */
.shots{display:grid;gap:14px;margin:1.25rem 0 1.5rem;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.shot{margin:0;min-width:0}
.shot.desk{grid-column:1/-1}
.shot img{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:8px;background:var(--cream)}
.shot.phone img{max-width:300px;margin:0 auto}
.frame{display:block;width:100%;padding:0;margin:0;border:0;background:none;font:inherit;color:inherit;text-align:inherit;cursor:default}
@media (max-width:1099px){
  .js .frame{cursor:zoom-in}
  .shot.zoom .frame{overflow-x:auto;cursor:zoom-out;-webkit-overflow-scrolling:touch}
  .shot.desk.zoom img{width:960px;max-width:none}
  .js .shot.desk.has-img figcaption::after{content:" · Chạm ảnh để phóng to";color:var(--stone)}
  .js .shot.desk.has-img.zoom figcaption::after{content:" · Vuốt ngang để xem, chạm để thu nhỏ"}
}
.shot figcaption{font-size:.8rem;color:var(--stone);margin-top:6px;line-height:1.4}
.shot.phone figcaption{text-align:center}
.shot .code{font-family:var(--f-mono);font-weight:500;color:var(--earth);margin-right:4px}
.ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;aspect-ratio:16/10;padding:16px;border:1.5px dashed var(--line-strong);border-radius:8px;background:var(--cream)}
.shot.phone .ph{aspect-ratio:390/844;max-width:200px;margin:0 auto}
.ph-tag{font-size:.75rem;font-weight:600;letter-spacing:.01em;text-transform:uppercase;color:var(--stone)}
.ph-screen{font-size:.88rem;color:var(--ink);line-height:1.4;max-width:30rem}
.ph-screen strong{font-weight:600}
.ph-note{font-family:var(--f-mono);font-size:.75rem;color:var(--earth)}
.shot.desk+.shot.desk{margin-top:4px}

.colophon{margin-top:64px;padding-top:16px;border-top:1px solid var(--line);font-size:.78rem;color:var(--stone)}
.colophon code{background:transparent;padding:0;color:var(--stone)}

@media (min-width:600px){
  .dept-grid{grid-template-columns:1fr 1fr}
  .cover{padding:64px 0 48px}
  h3{font-size:1.25rem}
}

/* máy tính: thanh bên */
@media (min-width:1100px){
  :root{--spy:24px}
  .mhead,.chipbar,.ch-toc{display:none}
  .shell{display:grid;grid-template-columns:300px minmax(0,1fr)}
  .sidebar{display:block;position:sticky;top:0;height:100vh;overflow-y:auto;background:var(--cream);border-right:1px solid var(--line);padding:28px 16px 48px 22px;scrollbar-width:thin}
  .side-brand{margin:0 0 22px}
  .side-brand .wm{font-size:1.1rem;display:block}
  .side-brand .doc{font-size:.8rem;color:var(--stone)}
  .side-toc,.side-secs{list-style:none;margin:0;padding:0}
  .side-top a,.side-ch-a{display:flex;gap:8px;align-items:baseline;padding:8px 10px;border-radius:6px;color:var(--ink);text-decoration:none;font-weight:600;font-size:.92rem;line-height:1.35}
  .side-ch-a .n{font-family:var(--f-mono);font-size:.78rem;color:var(--stone);min-width:1rem}
  .side-top a:hover,.side-ch-a:hover,.side-secs a:hover{background:var(--ivory)}
  .side-ch.is-active>.side-ch-a{background:var(--ivory);box-shadow:inset 3px 0 0 var(--oak)}
  .side-secs{margin:2px 0 10px 18px;border-left:1px solid var(--line-strong)}
  .js .side-ch:not(.is-active) .side-secs{display:none}
  .side-secs a{display:flex;gap:8px;padding:5px 8px 5px 12px;color:var(--ink);text-decoration:none;font-size:.84rem;line-height:1.35;border-radius:0 6px 6px 0}
  .side-secs .n{min-width:2.3rem}
  .content{padding:0 56px 96px;max-width:52rem}
  .cover{padding:88px 0 56px}
}

/* in A4 */
@page{size:A4;margin:16mm 15mm 18mm}
@page{@bottom-center{content:"Sổ tay OTTIMO Desk v1.0 · trang " counter(page);font-family:"Be Vietnam Pro",Arial,sans-serif;font-size:8pt;color:#6B6760}}
@page :first{@bottom-center{content:none}}
@media print{
  html{font-size:11pt}
  body{background:var(--white);line-height:1.5}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .skip,.mhead,.chipbar,.sidebar,.ch-tools,.ch-toc,.print-hide{display:none!important}
  .shell{display:block}
  .content{max-width:none;padding:0}
  a{color:inherit;text-decoration:none}
  .cover{min-height:250mm;padding:40mm 0 0;border:0;break-after:page;page-break-after:always}
  .cover h1{font-size:40pt}
  .toc{padding-top:0;break-after:page;page-break-after:always}
  .dept-grid{grid-template-columns:1fr 1fr;gap:6px}
  .dept{padding:8px 10px;break-inside:avoid}
  .dept .subs a{min-height:0;padding:2px 8px}
  .toc-all{columns:2;column-gap:10mm;border:0}
  .toc-all>li{border:0}
  .toc-ch summary{break-after:avoid}
  .toc-secs>li:first-child{display:none}
  .toc-secs li{break-inside:avoid}
  .toc-ch summary{min-height:0;padding:4pt 0 2pt}
  .toc-ch summary::after{display:none}
  .toc-secs a{padding:1pt 0;font-size:9pt}
  .toc-row a{min-height:0;padding:4pt 0}
  .intro,.chapter{padding-top:0}
  .chapter{break-before:page;page-break-before:always}
  .ch-head h2{font-size:26pt}
  h3{font-size:16pt;margin-top:16pt}
  h3,h4,p.lead,p.label,.ch-head{break-after:avoid;page-break-after:avoid}
  .callout,.shot,.tbl tr,ol.steps>li,p.faq{break-inside:avoid;page-break-inside:avoid}
  .table-wrap{overflow:visible;border-radius:4px}
  .tbl{font-size:9pt}
  .tbl.wide{min-width:0!important}
  .tbl.wide th:first-child,.tbl.wide td:first-child{position:static;box-shadow:none}
  .tbl th,.tbl td{padding:3pt 5pt}
  .shots{grid-template-columns:repeat(3,1fr);gap:6mm}
  .shot.desk{grid-column:1/-1}
  .shot img{max-height:105mm;width:auto!important;max-width:100%!important;margin:0 auto}
  .shot figcaption::after{content:none!important}
  .shot.phone img{max-height:95mm}
  .ph{aspect-ratio:auto!important;height:26mm;max-width:none!important;padding:6pt}
  .colophon{margin-top:12mm}
}
"""

JS = r"""
(function(){
  var d=document,root=d.documentElement;root.classList.add('js');
  var main=d.getElementById('noi-dung');
  var common=(main&&main.getAttribute('data-common')||'').split(' ').filter(Boolean);
  var each=function(list,fn){Array.prototype.forEach.call(list,fn);};
  each(d.querySelectorAll('[data-print],.ch-tools .hint'),function(el){el.hidden=false;});
  each(d.querySelectorAll('button[data-print]'),function(b){
    b.addEventListener('click',function(){
      var sec=b.closest('section'),keep={cover:1};keep[sec.id]=1;
      if(b.getAttribute('data-print')==='dept'){common.forEach(function(id){keep[id]=1;});}
      each(main.querySelectorAll('.content > section'),function(s){if(!keep[s.id])s.classList.add('print-hide');});
      window.print();
    });
  });
  var opened=[];
  window.addEventListener('beforeprint',function(){each(d.querySelectorAll('details.toc-ch:not([open])'),function(x){x.open=true;opened.push(x);});});
  window.addEventListener('afterprint',function(){
    opened.forEach(function(x){x.open=false;});opened=[];
    each(d.querySelectorAll('.print-hide'),function(s){s.classList.remove('print-hide');});
  });
  var chips=[].slice.call(d.querySelectorAll('.chipbar a[data-spy]'));
  var chipT=chips.map(function(a){return d.getElementById(a.getAttribute('href').slice(1));});
  var side=[].slice.call(d.querySelectorAll('.side-ch'));
  var sideT=side.map(function(li){return d.getElementById(li.getAttribute('data-ch'));});
  var bar=d.querySelector('.chipbar .chips'),nav=d.querySelector('.sidebar'),cur=-1,curS=-1,ticking=false;
  function pick(ts){var k=-1;for(var i=0;i<ts.length;i++){if(ts[i]&&ts[i].getBoundingClientRect().top<=140)k=i;}return k;}
  function update(){
    ticking=false;
    var k=pick(chipT);
    if(k!==cur){
      if(cur>=0)chips[cur].removeAttribute('aria-current');
      cur=k;
      if(k<0&&bar&&bar.scrollTo){bar.scrollTo({left:0});}
      if(k>=0){chips[k].setAttribute('aria-current','true');
        if(bar&&bar.offsetParent!==null&&bar.scrollTo){bar.scrollTo({left:Math.max(0,chips[k].offsetLeft-16),behavior:'smooth'});}}
    }
    var s=pick(sideT);
    if(s!==curS){
      if(curS>=0)side[curS].classList.remove('is-active');
      curS=s;
      if(s>=0){side[s].classList.add('is-active');
        if(nav&&nav.offsetParent!==null){var top=side[s].offsetTop;if(top<nav.scrollTop+40||top>nav.scrollTop+nav.clientHeight-160){nav.scrollTop=Math.max(0,top-80);}}}
    }
  }
  each(d.querySelectorAll('.shot .frame'),function(f){f.addEventListener('click',function(){
    var fig=f.closest('.shot'),on=!fig.classList.contains('zoom');fig.classList.toggle('zoom',on);f.setAttribute('aria-pressed',on?'true':'false');});});
  window.addEventListener('scroll',function(){if(!ticking){ticking=true;window.requestAnimationFrame(update);}},{passive:true});
  window.addEventListener('hashchange',update);
  update();
})();
"""

TEMPLATE = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#F4F0E8">
<meta name="description" content="{description}">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>{css}</style>
</head>
<body>
<a class="skip" href="#noi-dung">Bỏ qua, tới nội dung</a>
<header class="mhead"><p class="wm">OTTIMO</p><span class="doc">Sổ tay Desk v1.0</span></header>
<nav class="chipbar" aria-label="Chuyển nhanh theo bộ phận"><div class="chips">{chips}</div></nav>
<div class="shell">
<aside class="sidebar" aria-label="Mục lục">
<div class="side-brand"><p class="wm">OTTIMO</p><span class="doc">Sổ tay Desk v1.0</span></div>
<nav aria-label="Các chương"><ol class="side-toc">{side}</ol></nav>
</aside>
<main id="noi-dung" data-common="{common}">
<div class="content">
{cover}
{toc}
{body}
{colophon}
</div>
</main>
</div>
<script>{js}</script>
</body>
</html>
"""


def main(argv=None):
    ap = argparse.ArgumentParser(description="Dựng Sổ tay OTTIMO Desk (HTML) từ Markdown.")
    ap.add_argument("--md", type=Path, default=DEFAULT_MD)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--img-dir", type=Path, default=None)
    ap.add_argument("--link-images", action="store_true")
    a = ap.parse_args(argv)

    md_path = a.md.resolve()
    if not md_path.is_file():
        print("Không thấy tệp nguồn: %s" % md_path, file=sys.stderr)
        return 2
    img_dir = (a.img_dir or md_path.parent / "img").resolve()
    out_path = a.out.resolve()
    md_text = md_path.read_text(encoding="utf-8")

    page, ctx, chapters = build(md_text, md_path, out_path, img_dir, a.link_images)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(page, encoding="utf-8")

    size_mb = out_path.stat().st_size / 1024 / 1024
    total = len(ctx.found) + len(ctx.missing)
    rel = out_path.relative_to(ROOT) if str(out_path).startswith(str(ROOT)) else out_path
    print("Đã dựng: %s (%.2f MB)" % (rel, size_mb))
    print("  Chương: %d · mục: %d" % (len(chapters), sum(len(c["subs"]) for c in chapters)))
    print("  Ảnh: %d/%d mã đã có (%d chỗ chèn)%s" % (
        len(ctx.found), total, ctx.refs, " – nhúng base64" if not a.link_images else " – trỏ đường dẫn"))
    if ctx.missing:
        shown = ", ".join(ctx.missing[:12]) + (" …" if len(ctx.missing) > 12 else "")
        print("  Còn thiếu %d: %s" % (len(ctx.missing), shown))
    if size_mb > 15:
        print("  ! Tệp > 15 MB: nên nén ảnh (PNG 8-bit/JPEG) hoặc dùng --link-images.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
