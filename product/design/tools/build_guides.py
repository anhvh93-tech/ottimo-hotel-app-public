#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dựng Bộ hướng dẫn OTTIMO Desk v1.0 theo bộ phận (HTML) + bản "Your ID details" cho máy tính bảng.

Chạy từ gốc repo (UXD, Round 3):
    python3 -I product/design/tools/build_guides.py
    python3 -I product/design/tools/build_guides.py --check-dir <thư mục ảnh kiểm>   # + đo tràn 390/1440, chụp, in thử PDF

Nguồn:  product/docs/manual/guides/0*.md (BA) – mỗi tệp một trang HTML; 00-index.md thành trang mục lục.
        Ảnh: product/docs/manual/img/<mã>.png|.jpg|.jpeg|.webp – nhận cả mã Cx-yy (sổ tay) và Gx-yy (bộ hướng dẫn).
        Mô tả ảnh thiếu: screenshot-list.md (C) và guides/screenshot-additions.md (G).
        Tờ "Your ID details": chữ lấy nguyên văn từ product/docs/print/to-4-your-id-details-a4.html.
Ra:     product/docs/manual/guides/html/<tên tệp>.html (mỗi tệp tự đứng: ảnh, font nhúng base64)
        product/docs/manual/guides/html/your-id-details-tablet.html (chỉ tờ thông báo, toàn màn hình)

Trong trang:
  - "mục 7.2", "mục 15" nối tới mục trong tệp; "`02` mục 7.2", "`02-le-tan.md`" nối sang tệp khác.
    Không nối số mục của sổ tay ("sổ tay 3.1", "`user-manual-v1.0.md` mục 2.4").
  - Ảnh thiếu: khung trống ghi mã và mô tả màn hình.
  - Thanh mục (điện thoại) / thanh bên (máy tính ≥ 1100 px), tìm trong trang (gõ có dấu hoặc không dấu), in A4.
Không sửa tệp nguồn. Chỉ thư viện chuẩn Python 3.9+ (dùng lõi đọc Markdown của build_manual.py).
"""
import argparse
import base64
import datetime
import hashlib
import html
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
import build_manual as bm  # noqa: E402
from build_manual import IMG_EXT, MIME, esc, image_size, inline, parse_blocks, plain, slugify, split_row, strip_comments  # noqa: E402

ROOT = HERE.parents[2]
SRC_DIR = ROOT / "product" / "docs" / "manual" / "guides"
OUT_DIR = SRC_DIR / "html"
IMG_DIR = ROOT / "product" / "docs" / "manual" / "img"
SHOT_LISTS = [ROOT / "product" / "docs" / "manual" / "screenshot-list.md", SRC_DIR / "screenshot-additions.md"]
A4_NOTICE = ROOT / "product" / "docs" / "print" / "to-4-your-id-details-a4.html"
TABLET_NAME = "your-id-details-tablet.html"
FONT_DIR = ROOT / "product" / "apps" / "landing-web" / "node_modules" / "@fontsource"
GOOGLE_FONTS = ("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700"
                "&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap")
SET_NAME = "Bộ hướng dẫn OTTIMO Desk v1.0"

# fontsource: tập con latin + vietnamese (đủ tiếng Anh, tiếng Việt). Mũi tên → dùng font dự phòng.
UR_LATIN = ("U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,"
            "U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")
UR_VI = ("U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,"
         "U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB")
GUIDE_FONTS = [("Lora", "lora", 400), ("Lora", "lora", 500), ("Be Vietnam Pro", "be-vietnam-pro", 400),
               ("Be Vietnam Pro", "be-vietnam-pro", 500), ("Be Vietnam Pro", "be-vietnam-pro", 600),
               ("JetBrains Mono", "jetbrains-mono", 400), ("JetBrains Mono", "jetbrains-mono", 500)]
NOTICE_FONTS = [("Lora", "lora", 500), ("Be Vietnam Pro", "be-vietnam-pro", 400)]

CHAPTER_RE = re.compile(r"^(\d+)\.\s+(.+)$")
SUB_RE = re.compile(r"^(\d+(?:\.\d+)+)\s+(.+)$")
GUIDE_CODE_RE = re.compile(r"^(0\d)(?:-[a-z0-9-]+\.md)?$")
MUC_RE = re.compile(r"(?<![\w])([mM]ục\s+)(\d+(?:\.\d+)?)((?:(?:\s*,\s*|\s+và\s+|\s+hoặc\s+)\d+(?:\.\d+)?(?![\d.]*\d))*)")
SHOT_CODE_RE = re.compile(r"^([A-Z]\d+-\d+)(?:\s*-\s*(.*))?$")

FONT_CACHE = {}
IMG_CACHE = {}


# --------------------------------------------------------------------------- tiện ích

def font_face_css(fonts):
    """@font-face nhúng base64 (woff2) từ @fontsource; thiếu tệp thì trả None (dùng Google Fonts)."""
    rules = []
    for family, slug, weight in fonts:
        for subset, urange in (("latin", UR_LATIN), ("vietnamese", UR_VI)):
            p = FONT_DIR / slug / "files" / ("%s-%s-%d-normal.woff2" % (slug, subset, weight))
            if not p.is_file():
                return None
            if p not in FONT_CACHE:
                FONT_CACHE[p] = base64.b64encode(p.read_bytes()).decode("ascii")
            rules.append("@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:swap;"
                         "src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s}"
                         % (family, weight, FONT_CACHE[p], urange))
    return "\n".join(rules)


def fonts_head(fonts, embed):
    css = font_face_css(fonts) if embed else None
    if css:
        return "<style>%s</style>" % css, True
    return ('<link rel="preconnect" href="https://fonts.googleapis.com">'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            '<link rel="stylesheet" href="%s">' % esc(GOOGLE_FONTS)), False


def load_shots(paths):
    """mã ảnh -> (mô tả màn hình, có phải ảnh điện thoại) – đọc theo cột "Màn hình" của từng bảng."""
    info = {}
    for p in paths:
        if not p.exists():
            continue
        header, phone_sec = None, False
        for line in p.read_text(encoding="utf-8").splitlines():
            if line.startswith("#"):
                phone_sec = "điện thoại" in line.lower()
                header = None
                continue
            if not line.strip().startswith("|"):
                continue
            cells = [c.strip() for c in split_row(line)]
            if cells and cells[0] == "Mã":
                header = [c.lower() for c in cells]
                continue
            m = re.match(r"^([A-Z]\d+-\d+)$", cells[0]) if cells else None
            if not m or not header:
                continue
            col = header.index("màn hình") if "màn hình" in header else 1
            screen = cells[col] if col < len(cells) else ""
            low = screen.lower()
            phone = phone_sec or "điện thoại" in low or "390" in low or "app nhân viên" in low
            info.setdefault(m.group(1), (screen, phone))
    return info


def short_name(title):
    """'Hướng dẫn Lễ tân – OTTIMO Desk v1.0' -> 'Lễ tân'."""
    t = re.split(r"\s+[–—]\s+", plain(title))[0]
    t = re.sub(r"^Hướng dẫn\s+", "", t).strip()
    return t[:1].upper() + t[1:]


def find_image(code):
    for ext in IMG_EXT:
        for name in (code + ext, code + ext.upper()):
            p = IMG_DIR / name
            if p.is_file():
                return p
    return None


# --------------------------------------------------------------------------- đọc tệp

class Guide:
    def __init__(self, path):
        self.path = path
        self.stem = path.stem
        self.prefix = self.stem[:2]
        self.out_name = self.stem + ".html"
        self.is_index = self.stem.startswith("00")
        self.text = path.read_text(encoding="utf-8")
        blocks = parse_blocks(strip_comments(self.text).split("\n"))
        self.title, self.pre, self.sections = None, [], []
        cur = None
        for b in blocks:
            if b["t"] == "h" and b["level"] == 1 and self.title is None:
                self.title = b["text"]
                continue
            if b["t"] == "h" and b["level"] == 2:
                cur = {"title": b["text"], "blocks": []}
                self.sections.append(cur)
                continue
            (cur["blocks"] if cur is not None else self.pre).append(b)
        self.title = self.title or self.stem
        self.name = "Mục lục" if self.is_index else short_name(self.title)
        while self.pre and self.pre[-1]["t"] == "hr":
            self.pre.pop()
        self.ids = {}  # "7.2" -> "s-7-2", "15" -> "c-15"
        used = set()

        def uid(base):
            cand, k = base, 2
            while cand in used:
                cand = "%s-%d" % (base, k)
                k += 1
            used.add(cand)
            return cand

        for sec in self.sections:
            while sec["blocks"] and sec["blocks"][-1]["t"] == "hr":
                sec["blocks"].pop()
            m = CHAPTER_RE.match(plain(sec["title"]))
            if m:
                sec["num"], sec["name"] = m.group(1), m.group(2)
                sec["id"] = uid("c-" + m.group(1))
                self.ids.setdefault(m.group(1), sec["id"])
            else:
                sec["num"], sec["name"] = None, plain(sec["title"])
                sec["id"] = uid(slugify(sec["title"]))
            # tách theo ### : phần đầu chương + các mục con
            sec["lead"], sec["subs"] = [], []
            for b in sec["blocks"]:
                if b["t"] == "h" and b["level"] == 3:
                    hm = SUB_RE.match(b["text"])
                    if hm:
                        b["num"], b["title"] = hm.group(1), hm.group(2)
                        b["id"] = uid("s-" + hm.group(1).replace(".", "-"))
                        self.ids.setdefault(hm.group(1), b["id"])
                    else:
                        b["id"] = uid(slugify(b["text"]))
                    sec["subs"].append({"h": b, "blocks": []})
                elif sec["subs"]:
                    sec["subs"][-1]["blocks"].append(b)
                else:
                    sec["lead"].append(b)
            for sb in sec["subs"]:
                while sb["blocks"] and sb["blocks"][-1]["t"] == "hr":
                    sb["blocks"].pop()
            while sec["lead"] and sec["lead"][-1]["t"] == "hr":
                sec["lead"].pop()
        self.chapters = [s for s in self.sections if s["num"]]
        self.intros = [s for s in self.sections if not s["num"]]

    def meta(self, key):
        """Giá trị dòng '- Dành cho: …' ở đầu tệp."""
        for b in self.pre:
            if b["t"] == "list":
                for it in b["items"]:
                    m = re.match(r"^%s:\s*(.+)$" % re.escape(key), it["text"])
                    if m:
                        return m.group(1)
        return None


# --------------------------------------------------------------------------- dựng một trang

class Ctx:
    """Ngữ cảnh dựng của một tệp – build_manual gọi các hook xref_hook, render_shots, render_quote."""

    def __init__(self, guide, guides, shot_info, link_images, out_path):
        self.g = guide
        self.by_prefix = {g.prefix: g for g in guides}
        self.shot_info = shot_info
        self.link_images = link_images
        self.out_path = out_path
        self.found, self.missing, self.refs = [], [], 0
        self.notice = None  # đoạn chữ tờ Your ID details trong tệp (để đối chiếu)

    # ---- nối mục, nối tệp
    def code_guide(self, codes, idx):
        m = GUIDE_CODE_RE.match(codes[idx].strip())
        return self.by_prefix.get(m.group(1)) if m else None

    def xref_hook(self, t, codes):
        def mref(m):
            before = t[: m.start()]
            if re.search(r"[Ss]ổ tay(?:[^.;|]|\.\d){0,40}$", before):  # "sổ tay 1.5 mục 2.13"
                return m.group(0)
            target = self.g
            tm = re.search(r"[Tt]ệp\s+(0\d)\s*$", before)  # "tệp 02 mục 17.1"
            if tm and tm.group(1) in self.by_prefix:
                g2 = self.by_prefix[tm.group(1)]
                return link_nums(m, g2)
            last = None
            for last in re.finditer("\x00(\\d+)\x00", before):
                pass
            if last is not None:
                between = before[last.end():]
                if len(between) <= 40 and not re.search(r"[;.]\s|\x00", between):
                    g2 = self.code_guide(codes, int(last.group(1)))
                    if g2 is not None:
                        target = g2
                    elif codes[int(last.group(1))].endswith(".md") and len(between.strip()) == 0:
                        return m.group(0)  # mục của tài liệu khác (sổ tay, one-pager)
            return link_nums(m, target)

        def link_nums(m, target):
            href_base = "" if target is self.g else target.out_name

            def link(num, text):
                hid = target.ids.get(num)
                if not hid:
                    return text
                return '<a class="xref" href="%s#%s">%s</a>' % (href_base, hid, text)

            out = link(m.group(2), m.group(1) + m.group(2))
            rest = m.group(3) or ""
            out += re.sub(r"\d+(?:\.\d+)?", lambda k: link(k.group(0), k.group(0)), rest)
            return out

        t = MUC_RE.sub(mref, t)

        def cref(m):
            g2 = self.code_guide(codes, int(m.group(1)))
            if g2 is None or g2 is self.g:
                return m.group(0)
            return '<a class="fref" href="%s" title="%s">%s</a>' % (g2.out_name, esc(g2.name), m.group(0))

        return re.sub("\x00(\\d+)\x00", cref, t)

    # ---- ảnh
    def render_shots(self, group, _ctx):
        figs = []
        for b in group:
            m = SHOT_CODE_RE.match(b["raw"].strip())
            code, desc = (m.group(1), (m.group(2) or "").strip()) if m else (b["raw"], "")
            screen, phone = self.shot_info.get(code, ("", False))
            desc = desc or plain(screen)
            path = find_image(code)
            self.refs += 1
            cap = '<figcaption><span class="code">%s</span> %s</figcaption>' % (esc(code), esc(desc))
            if path:
                if code not in self.found:
                    self.found.append(code)
                size = image_size(path)
                if size:
                    phone = size[1] > size[0] * 1.15
                if self.link_images:
                    src = _rel(path, self.out_path)
                else:
                    if path not in IMG_CACHE:
                        IMG_CACHE[path] = "data:%s;base64,%s" % (
                            MIME[path.suffix.lower()], base64.b64encode(path.read_bytes()).decode("ascii"))
                    src = IMG_CACHE[path]
                dims = ' width="%d" height="%d"' % size if size else ""
                body = ('<button type="button" class="frame" aria-label="%s" aria-pressed="false">'
                        '<img src="%s" alt="%s"%s loading="lazy" decoding="async"></button>') % (
                    esc("Phóng to hoặc thu nhỏ ảnh %s" % code), src, esc("Ảnh %s: %s" % (code, desc)), dims)
            else:
                if code not in self.missing:
                    self.missing.append(code)
                new = code.startswith("G")
                extra = '<span class="ph-screen">%s</span>' % inline(screen, None, xref=False) if screen else ""
                body = ('<div class="ph" role="img" aria-label="%s"><span class="ph-tag">%s</span>'
                        '<span class="ph-code">%s</span>%s<span class="ph-note">img/%s.png</span></div>') % (
                    esc("Chưa có ảnh %s: %s" % (code, desc)), "Ảnh mới · chờ chụp" if new else "Chưa có ảnh",
                    esc(code), extra, esc(code))
            figs.append('<figure class="shot %s%s">%s%s</figure>'
                        % ("phone" if phone else "desk", " has-img" if path else "", body, cap))
        return '<div class="shots">%s</div>' % "".join(figs)

    # ---- khối trích: tờ Your ID details thành bản xem trước của tờ
    def render_quote(self, b, _ctx):
        paras = [x for x in b["blocks"]]
        texts = [plain(x["text"]) for x in paras if x["t"] == "p"]
        if not any(t.startswith("Your ID details") for t in texts):
            return bm.render_quote(b, self)
        groups, cur = [], []
        for x in paras:
            if x["t"] == "hr":
                groups.append(cur)
                cur = []
            elif x["t"] == "p":
                cur.append(x["text"])
        groups.append(cur)
        head, vi = groups[0], (groups[1] if len(groups) > 1 else [])
        label = head.pop(0) if head and not head[0].startswith("**") else ""
        tm = re.match(r"^\*\*(.+?)\*\*\s*(?:\*([^*].*?)\*)?$", head.pop(0)) if head else None
        title, sub = (tm.group(1), tm.group(2) or "") if tm else ("Your ID details", "")
        foot = vi.pop() if vi and "ID notice" in vi[-1] else ""
        self.notice = {"label": label, "title": title, "sub": sub, "en": head, "vi": vi, "foot": foot}
        fl, _, fr = foot.rpartition(" · ")
        il = lambda s: inline(s, None, xref=False)  # noqa: E731
        return (
            '<figure class="notice-card" aria-label="Tờ Your ID details – nguyên văn">'
            '<div class="nc-paper"><p class="nc-label">%s</p><p class="nc-title" lang="en">%s</p>'
            '<p class="nc-sub">%s</p><div lang="en">%s</div><hr class="nc-rule"><div lang="vi">%s</div>'
            '<p class="nc-foot"><span>%s</span><span>%s</span></p></div>'
            '<figcaption>Bản cho máy tính bảng ở quầy (chỉ hiện tờ này, toàn màn hình): '
            '<a href="%s">mở tờ trên màn hình</a> · tệp <code>%s</code> cùng thư mục.</figcaption></figure>'
            % (esc(label), il(title), il(sub), "".join("<p>%s</p>" % il(p) for p in head),
               "".join("<p>%s</p>" % il(p) for p in vi), esc(fl or foot), esc(fr), TABLET_NAME, TABLET_NAME))


def _rel(path, out_path):
    import os
    try:
        return Path(os.path.relpath(path.resolve(), out_path.parent.resolve())).as_posix()
    except ValueError:
        return path.resolve().as_uri()


def heading_html(h, ctx):
    return bm.render_heading(h, ctx)


def render_page(g, guides, ctx, stats_all, embed_fonts):
    rb = lambda blocks: bm.render_blocks(blocks, ctx)  # noqa: E731
    il = lambda s: inline(s, ctx, xref=False)  # noqa: E731

    # ---- thân
    body = []
    for sec in g.sections:
        lead = rb(sec["lead"])
        subs = "".join(
            '<section class="sub" id="%s-u" data-unit data-label="%s">%s%s</section>'
            % (sb["h"]["id"], esc(("%s " % sb["h"]["num"] if sb["h"].get("num") else "") + plain(sb["h"].get("title") or sb["h"]["text"])),
               heading_html(sb["h"], ctx), rb(sb["blocks"]))
            for sb in sec["subs"])
        if not sec["num"]:
            body.append('<section class="intro" id="%s" aria-labelledby="%s-h"><h2 id="%s-h" class="intro-h">%s</h2>'
                        '<div class="lead" data-unit data-label="%s">%s</div>%s</section>'
                        % (sec["id"], sec["id"], sec["id"], il(sec["title"]), esc(sec["name"]), lead, subs))
            continue
        toc_items = "".join(
            '<li><a href="#%s"><span class="n">%s</span><span>%s</span></a></li>'
            % (sb["h"]["id"], esc(sb["h"].get("num") or ""), il(sb["h"].get("title") or sb["h"]["text"]))
            for sb in sec["subs"])
        ch_toc = ('<details class="ch-toc"><summary>Các mục trong phần này (%d)</summary><ol>%s</ol></details>'
                  % (len(sec["subs"]), toc_items)) if len(sec["subs"]) > 1 else ""
        body.append(
            '<section class="chapter" id="%s" aria-labelledby="%s-h">'
            '<header class="ch-head"><p class="ch-label">Phần %s</p><h2 id="%s-h">%s</h2>%s</header>'
            '<div class="lead" data-unit data-label="%s. %s">%s</div>%s</section>'
            % (sec["id"], sec["id"], esc(sec["num"]), sec["id"], il(sec["name"]), ch_toc,
               esc(sec["num"]), esc(sec["name"]), lead, subs))

    # ---- mục lục trong trang
    tree = []
    for s in g.intros:
        tree.append('<li class="toc-row"><a href="#%s">%s</a></li>' % (s["id"], il(s["title"])))
    for ch in g.chapters:
        if ch["subs"]:
            items = "".join(
                '<li><a href="#%s"><span class="n">%s</span><span>%s</span></a></li>'
                % (sb["h"]["id"], esc(sb["h"].get("num") or ""), il(sb["h"].get("title") or sb["h"]["text"]))
                for sb in ch["subs"])
            tree.append('<li><details class="toc-ch"><summary><span class="n">%s</span><span>%s</span></summary>'
                        '<ol class="toc-secs"><li><a href="#%s"><span class="n">%s</span><span>Đầu phần</span></a></li>%s</ol>'
                        '</details></li>' % (esc(ch["num"]), il(ch["name"]), ch["id"], esc(ch["num"]), items))
        else:
            tree.append('<li class="toc-row"><a href="#%s"><span class="n">%s</span>%s</a></li>'
                        % (ch["id"], esc(ch["num"]), il(ch["name"])))
    toc = ('<section class="toc" id="muc-luc" aria-labelledby="muc-luc-h"><p class="ch-label">Trong tệp này</p>'
           '<h2 id="muc-luc-h">Các phần</h2><ul class="toc-all">%s</ul></section>' % "".join(tree))

    # ---- trang mục lục: thẻ chọn tệp theo bộ phận
    cards = ""
    if g.is_index:
        items = []
        for o in guides:
            if o.is_index:
                continue
            st = stats_all.get(o.stem, {})
            aud = o.meta("Dành cho")
            dev = o.meta("Thiết bị")
            items.append(
                '<li class="dept"><p class="ch-label">Tệp %s · %d phần · %d mục</p><p class="dept-title"><a href="%s">%s</a></p>'
                '%s%s<p class="aud imgs">Ảnh: %d có · %d chờ chụp</p></li>'
                % (esc(o.prefix), len(o.chapters), sum(len(c["subs"]) for c in o.chapters), o.out_name, esc(o.name),
                   '<p class="aud"><span class="k">Dành cho</span> %s</p>' % inline(aud, None, xref=False) if aud else "",
                   '<p class="aud"><span class="k">Thiết bị</span> %s</p>' % inline(dev, None, xref=False) if dev else "",
                   len(st.get("found", [])), len(st.get("missing", []))))
        items.append(
            '<li class="dept notice-dept"><p class="ch-label">Cho khách · máy tính bảng ở quầy</p>'
            '<p class="dept-title"><a href="%s">Your ID details</a></p>'
            '<p class="aud">Tờ thông báo cho khách, đúng chữ bản in A4. Mở trên máy tính bảng, quay về phía khách, '
            'chạm một lần để hiện toàn màn hình. Không mở Desk trên cùng màn hình.</p></li>' % TABLET_NAME)
        cards = ('<section class="pick" id="chon-tep" aria-labelledby="chon-tep-h"><p class="ch-label">Bắt đầu ở đây</p>'
                 '<h2 id="chon-tep-h">Chọn tệp của bộ phận</h2><ul class="dept-grid">%s</ul></section>' % "".join(items))

    # ---- điều hướng
    chips = ['<a class="chip" href="#muc-luc">Các phần</a>']
    for s in g.intros:
        chips.append('<a class="chip" data-spy href="#%s">%s</a>' % (s["id"], esc(short_label(s["name"]))))
    for ch in g.chapters:
        chips.append('<a class="chip" data-spy href="#%s"><span class="n">%s</span>%s</a>'
                     % (ch["id"], esc(ch["num"]), esc(short_label(ch["name"]))))
    side = []
    for s in g.intros:
        side.append('<li class="side-top"><a href="#%s">%s</a></li>' % (s["id"], il(s["title"])))
    for ch in g.chapters:
        secs = "".join(
            '<li><a href="#%s"><span class="n">%s</span><span>%s</span></a></li>'
            % (sb["h"]["id"], esc(sb["h"].get("num") or ""), il(sb["h"].get("title") or sb["h"]["text"]))
            for sb in ch["subs"])
        side.append('<li class="side-ch" data-ch="%s"><a class="side-ch-a" href="#%s"><span class="n">%s</span>'
                    '<span>%s</span></a>%s</li>'
                    % (ch["id"], ch["id"], esc(ch["num"]), il(ch["name"]),
                       '<ol class="side-secs">%s</ol>' % secs if secs else ""))
    files = "".join(
        '<li%s><a href="%s"%s><span class="n">%s</span><span>%s</span></a></li>'
        % (' class="cur"' if o is g else "", o.out_name, ' aria-current="page"' if o is g else "",
           esc(o.prefix), esc(o.name)) for o in guides)
    order = [o for o in guides]
    k = order.index(g)
    prev_g = order[k - 1] if k > 0 else None
    next_g = order[k + 1] if k + 1 < len(order) else None
    pager = '<nav class="pager" aria-label="Tệp trước, tệp sau">%s%s</nav>' % (
        '<a class="pg prev" href="%s"><span class="k">Tệp trước</span><span>%s · %s</span></a>'
        % (prev_g.out_name, esc(prev_g.prefix), esc(prev_g.name)) if prev_g else "<span></span>",
        '<a class="pg next" href="%s"><span class="k">Tệp sau</span><span>%s · %s</span></a>'
        % (next_g.out_name, esc(next_g.prefix), esc(next_g.name)) if next_g else "<span></span>")

    # ---- bìa
    head_title = re.split(r"\s+[–—]\s+", g.title, maxsplit=1)
    big, small = head_title[0], (head_title[1] if len(head_title) > 1 else "")
    cover = ('<section class="cover" id="cover" aria-labelledby="cover-h">'
             '<p class="eyebrow-set">%s%s</p><div class="rule" aria-hidden="true"></div>'
             '<h1 id="cover-h">%s</h1>%s%s<div class="cover-meta">%s</div>%s</section>'
             % (esc(SET_NAME), "" if g.is_index else " · tệp %s" % esc(g.prefix), il(big),
                '<p class="cover-sub">%s</p>' % il(small) if small else "", cards, rb(g.pre),
                '<div class="cover-tools"><button type="button" class="btn" data-print hidden>In tệp này</button></div>'))

    digest = hashlib.sha256(g.text.encode("utf-8")).hexdigest()[:10]
    total = len(ctx.found) + len(ctx.missing)
    colophon = ('<footer class="colophon"><p>Dựng tự động từ <code>%s</code> · mã nội dung <code>%s</code> · ngày dựng %s'
                '%s</p></footer>' % (esc(g.path.name), digest, datetime.date.today().strftime("%d/%m/%Y"),
                                     " · ảnh đã có %d/%d mã" % (len(ctx.found), total) if total else ""))

    font_html, embedded = fonts_head(GUIDE_FONTS, embed_fonts)
    doc_label = "%s · %s" % ("Bộ hướng dẫn" if g.is_index else "Hướng dẫn", "Mục lục" if g.is_index else g.name)
    page = TEMPLATE.format(
        title=esc("%s – %s" % (g.name, SET_NAME) if not g.is_index else SET_NAME),
        description=esc(plain(g.title)),
        fonts=font_html,
        css=bm.CSS + GUIDE_CSS.replace("@@DOC@@", css_str(doc_label)),
        js=GUIDE_JS,
        doc=esc(doc_label),
        index_link="" if g.is_index else '<a class="up" href="%s">Bộ hướng dẫn</a>' % guides[0].out_name,
        chips="".join(chips),
        side="".join(side),
        files=files,
        cover=cover,
        pick="",
        toc=toc,
        body="\n".join(body),
        pager=pager,
        colophon=colophon,
    )
    return page, embedded


def short_label(name):
    t = re.split(r"\s+[–—]\s+", plain(name))[0]
    t = re.sub(r"\s*\([^()]*\)", "", t).strip()
    return t if len(t) <= 34 else t[:32].rstrip(" ,") + "…"


def css_str(s):
    return '"%s"' % s.replace("\\", "\\\\").replace('"', '\\"')


# --------------------------------------------------------------------------- tờ Your ID details – máy tính bảng

def read_a4_notice(path):
    """Lấy nguyên văn tờ A4 đã dựng (HTML của build_print_sheets.py)."""
    src = path.read_text(encoding="utf-8")
    m = re.search(r'<section class="sheet notice a4".*?</section>', src, re.S)
    if not m:
        raise SystemExit("Không thấy tờ thông báo trong %s" % path)
    s = m.group(0)

    def one(pat):
        k = re.search(pat, s, re.S)
        return k.group(1) if k else ""

    paras = lambda block: re.findall(r"<p>(.*?)</p>", block, re.S)  # noqa: E731
    return {
        "label": one(r'<p class="eyebrow">(.*?)</p>'),
        "title": one(r"<h2[^>]*>(.*?)</h2>"),
        "sub": one(r'<p class="sub">(.*?)</p>'),
        "en": paras(one(r'<div class="en"[^>]*>(.*?)</div>')),
        "vi": paras(one(r'<div class="vi"[^>]*>(.*?)</div>')),
        "foot": re.findall(r"<span>(.*?)</span>", one(r'<footer class="nfoot">(.*?)</footer>')),
        "digest": hashlib.sha256(s.encode("utf-8")).hexdigest()[:10],
    }


def text_of(fragment):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


def compare_notice(guide_notice, a4):
    """Đối chiếu chữ tờ trong tệp hướng dẫn với bản A4: trả danh sách chỗ khác."""
    diffs = []
    g = guide_notice
    pairs = [("Nhãn", plain(g["label"]), text_of(a4["label"])),
             ("Tiêu đề", plain(g["title"]), text_of(a4["title"])),
             ("Dòng phụ", plain(g["sub"]), text_of(a4["sub"]))]
    for lang in ("en", "vi"):
        for i in range(max(len(g[lang]), len(a4[lang]))):
            a = plain(g[lang][i]) if i < len(g[lang]) else "(thiếu)"
            b = text_of(a4[lang][i]) if i < len(a4[lang]) else "(thiếu)"
            pairs.append(("%s đoạn %d" % (lang.upper(), i + 1), a, b))
    pairs.append(("Chân tờ", plain(g["foot"]), " · ".join(text_of(x) for x in a4["foot"])))
    for name, a, b in pairs:
        if re.sub(r"\s+", " ", a).strip() != b:
            diffs.append((name, a, b))
    return diffs


def build_tablet(a4, embed_fonts):
    font_html, _ = fonts_head(NOTICE_FONTS, embed_fonts)
    foot = a4["foot"] + [""] * (2 - len(a4["foot"]))
    return TABLET_TEMPLATE.format(
        fonts=font_html, css=TABLET_CSS, js=TABLET_JS, label=a4["label"], title=a4["title"], sub=a4["sub"],
        en="".join("<p>%s</p>" % p for p in a4["en"]), vi="".join("<p>%s</p>" % p for p in a4["vi"]),
        foot_l=foot[0], foot_r=foot[1], digest=a4["digest"])


# --------------------------------------------------------------------------- CSS, JS, khung trang

GUIDE_CSS = r"""
/* ---- bộ hướng dẫn: phần thêm trên nền CSS sổ tay ---- */
[hidden]{display:none!important}
.mhead{align-items:center}
.mhead .doc{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.up{display:inline-flex;align-items:center;min-height:44px;padding:0 4px;color:var(--earth);font-size:.85rem;font-weight:600;white-space:nowrap}
@media (max-width:1099px){.chipbar{display:flex;align-items:stretch}}
.chipbar .chips{flex:1 1 auto;min-width:0}
.sbtn{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:64px;min-height:44px;margin:8px var(--gutter) 8px 0;padding:0 12px;border-radius:999px;border:1px solid var(--earth);background:var(--ivory);color:var(--earth);font:600 .875rem/1 var(--f-body);cursor:pointer}
.sbtn[aria-expanded="true"]{background:var(--earth);color:var(--white)}
.sbtn svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2}
.search{background:var(--ivory)}
.chipbar .search{position:absolute;left:0;right:0;top:100%;border-bottom:1px solid var(--line-strong);box-shadow:0 8px 24px rgba(43,43,40,.12);padding:12px var(--gutter) 14px;max-height:calc(100vh - 140px);overflow-y:auto}
.search label{display:block;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.01em;color:var(--stone);margin:0 0 6px}
.srow{display:flex;gap:8px}
.search input{flex:1 1 auto;min-width:0;min-height:44px;padding:0 12px;border:1px solid var(--line-strong);border-radius:8px;background:var(--white);color:var(--ink);font:400 1rem var(--f-body)}
.search input:focus-visible{outline:2px solid var(--earth);outline-offset:1px}
.sclose{flex:0 0 auto;min-width:44px;min-height:44px;border:1px solid var(--line-strong);border-radius:8px;background:transparent;color:var(--ink);font:600 .85rem var(--f-body);cursor:pointer}
.sstatus{font-size:.82rem;color:var(--stone);margin:8px 0 4px}
.sres{list-style:none;margin:0;padding:0}
.sres a{display:block;padding:10px 4px;border-top:1px solid var(--line);color:var(--ink);text-decoration:none;min-height:44px}
.sres a:hover,.sres a:focus-visible{background:var(--cream)}
.sres .t{display:block;font-weight:600;font-size:.9rem;line-height:1.35}
.sres .t .n{font-family:var(--f-mono);font-size:.78rem;color:var(--earth);margin-right:6px}
.sres .x{display:block;font-size:.82rem;color:var(--stone);line-height:1.45;margin-top:2px}
mark{background:var(--oak);color:var(--ink);border-radius:2px;padding:0 1px}
mark.hit{box-shadow:0 0 0 2px var(--oak)}
.eyebrow-set{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--stone);margin:0 0 18px}
.cover .rule{margin-bottom:20px}
.cover h1{font-size:clamp(2rem,8vw,3.1rem);margin-bottom:8px}
.cover-sub{font-family:var(--f-head);font-size:1.15rem;color:var(--stone);margin:0 0 24px}
.cover-meta{font-size:.92rem}
.cover-tools{margin-top:16px}
.toc{padding-top:32px}
.toc h2,.pick h2{font-size:1.6rem}
.toc-row a .n{font-family:var(--f-mono);font-size:.78rem;color:var(--earth);min-width:1.2rem;margin-right:10px}
.pick{padding:8px 0 24px}
.cover .pick h2{font-family:var(--f-head);font-weight:500;font-size:1.5rem;margin:4px 0 14px}
.pick .dept-title a{font-size:1.2rem}
.dept .aud .k{display:inline;margin-right:4px}
.dept .imgs{font-family:var(--f-mono);font-size:.78rem}
.notice-dept{background:var(--ivory);border:1px solid var(--oak)}
.lead>:first-child{margin-top:.6rem}
.ch-label{letter-spacing:.04em}
.chapter{padding-top:40px}
.ch-head h2{font-size:clamp(1.55rem,5.6vw,2rem)}
.ph{gap:6px}
.ph-code{font-family:var(--f-mono);font-size:1.15rem;font-weight:500;color:var(--ink);letter-spacing:.02em}
.notice-card{margin:1.25rem 0 1.5rem}
.nc-paper{background:var(--white);border:1px solid var(--line);border-radius:6px;padding:22px 20px 14px;box-shadow:0 1px 3px rgba(43,43,40,.08)}
.nc-label{font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--stone);margin:0}
.nc-title{font-family:var(--f-head);font-weight:500;font-size:1.6rem;line-height:1.15;letter-spacing:.02em;margin:10px 0 2px}
.nc-sub{font-family:var(--f-head);font-weight:500;color:var(--stone);margin:0 0 14px}
.nc-paper p{margin:.5rem 0}
.nc-rule{border:0;border-top:1px solid var(--oak);width:56px;margin:14px 0}
.nc-foot{display:flex;justify-content:space-between;font-size:.75rem;color:var(--stone);margin-top:14px!important}
.notice-card figcaption{font-size:.82rem;color:var(--stone);margin-top:8px}
.pager{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:56px}
.pg{display:flex;flex-direction:column;gap:2px;min-height:44px;padding:12px 14px;border:1px solid var(--line-strong);border-radius:10px;color:var(--ink);text-decoration:none;font-weight:600;font-size:.92rem}
.pg:hover{border-color:var(--oak)}
.pg.next{text-align:right}
.pg .k{font-size:.72rem}
a.fref{text-decoration:none}
a.fref code{color:var(--earth);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.18em}
.side-files{list-style:none;margin:0 0 18px;padding:0 0 14px;border-bottom:1px solid var(--line-strong)}
.side-files a{display:flex;gap:8px;align-items:baseline;padding:6px 10px;border-radius:6px;color:var(--ink);text-decoration:none;font-size:.86rem}
.side-files .n{font-family:var(--f-mono);font-size:.75rem;color:var(--stone)}
.side-files .cur a{background:var(--ivory);font-weight:600;box-shadow:inset 3px 0 0 var(--oak)}
.side-files a:hover{background:var(--ivory)}
.side-label{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--stone);margin:0 0 6px 10px}
#side-search{margin:0 0 18px}
.sidebar .search{background:transparent;padding:0}
.sidebar .sclose{display:none}
.sidebar .sres{max-height:52vh;overflow-y:auto;background:var(--ivory);border-radius:8px;padding:0 6px}
@media (min-width:600px){.nc-paper{padding:28px 30px 16px}.nc-title{font-size:2rem}}
@media (min-width:1100px){
  .up{display:none}
  .content{max-width:50rem}
  .cover{padding:64px 0 40px}
}
@media (max-width:1099px){#side-search{display:none}}
@page{@bottom-center{content:@@DOC@@ " · trang " counter(page);font-family:"Be Vietnam Pro",Arial,sans-serif;font-size:8pt;color:#6B6760}}
@media print{
  .search,.sbtn,.pager,.cover-tools,.up,mark.hit{box-shadow:none}
  .search,.sbtn,.pager,.cover-tools,.up{display:none!important}
  .cover{min-height:0;padding:0 0 8mm;break-after:auto;page-break-after:auto;border-bottom:1px solid var(--line)}
  .cover h1{font-size:28pt}
  .pick{break-after:page;page-break-after:always}
  .toc{break-after:page;page-break-after:always}
  .toc-all{columns:2;column-gap:10mm}
  .chapter{break-before:auto;page-break-before:auto;padding-top:10mm}
  .ch-head{break-after:avoid;page-break-after:avoid}
  .ch-head h2{font-size:20pt}
  .sub{break-before:auto}
  .notice-card,.nc-paper{break-inside:avoid;page-break-inside:avoid;box-shadow:none}
  mark{background:none;padding:0}
}
"""

GUIDE_JS = r"""
(function(){
  var d=document,root=d.documentElement;root.classList.add('js');
  var each=function(list,fn){Array.prototype.forEach.call(list,fn);};
  /* in */
  each(d.querySelectorAll('[data-print]'),function(b){b.hidden=false;b.addEventListener('click',function(){window.print();});});
  var opened=[];
  window.addEventListener('beforeprint',function(){each(d.querySelectorAll('details.toc-ch:not([open])'),function(x){x.open=true;opened.push(x);});});
  window.addEventListener('afterprint',function(){opened.forEach(function(x){x.open=false;});opened=[];});
  /* ảnh: chạm để phóng to */
  each(d.querySelectorAll('.shot .frame'),function(f){f.addEventListener('click',function(){
    var fig=f.closest('.shot'),on=!fig.classList.contains('zoom');fig.classList.toggle('zoom',on);f.setAttribute('aria-pressed',on?'true':'false');});});
  /* đang đọc phần nào */
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
  window.addEventListener('scroll',function(){if(!ticking){ticking=true;window.requestAnimationFrame(update);}},{passive:true});
  window.addEventListener('hashchange',update);
  update();

  /* tìm trong trang: có dấu hoặc không dấu */
  var box=d.getElementById('tim'),input=d.getElementById('tim-q'),status=d.getElementById('tim-st'),list=d.getElementById('tim-kq');
  var btn=d.querySelector('.sbtn'),closeB=d.querySelector('.sclose'),slotM=d.querySelector('.chipbar'),slotD=d.getElementById('side-search');
  if(!box||!input)return;
  box.hidden=false;if(btn)btn.hidden=false;
  var mq=window.matchMedia('(min-width:1100px)');
  function place(){
    if(mq.matches){if(box.parentNode!==slotD)slotD.appendChild(box);box.style.display='';}
    else{if(box.parentNode!==slotM)slotM.appendChild(box);setOpen(false);}
  }
  function setOpen(on){
    if(mq.matches)return;
    box.style.display=on?'':'none';if(btn)btn.setAttribute('aria-expanded',on?'true':'false');
    if(on){setTimeout(function(){input.focus();},30);}
  }
  if(btn)btn.addEventListener('click',function(){setOpen(btn.getAttribute('aria-expanded')!=='true');});
  if(closeB)closeB.addEventListener('click',function(){setOpen(false);if(btn)btn.focus();});
  if(mq.addEventListener)mq.addEventListener('change',place);else if(mq.addListener)mq.addListener(place);
  place();

  function norm(s){var o='';for(var i=0;i<s.length;i++){var c=s.charAt(i);
      if(c==='đ'||c==='Đ'){o+='d';continue;}
      var n=c.normalize?c.normalize('NFD').replace(/[\u0300-\u036f]/g,''):c;
      o+=(n.charAt(0)||' ').toLowerCase().charAt(0)||' ';}
    return o;}
  var units=null;
  function index(){
    units=[].slice.call(d.querySelectorAll('[data-unit]')).map(function(el){
      var raw=(el.getAttribute('data-label')||'')+' \u00b7 '+(el.innerText||el.textContent).replace(/\s+/g,' ');
      return {el:el,label:el.getAttribute('data-label')||'',raw:raw,n:norm(raw)};
    });
  }
  function terms(q){return norm(q).replace(/\s+/g,' ').trim();}
  function clearMarks(){each(d.querySelectorAll('mark.hit'),function(m){var p=m.parentNode;p.replaceChild(d.createTextNode(m.textContent),m);p.normalize();});}
  function snippet(u,q,words,loose){
    var i=u.n.indexOf(q),len=q.length;
    if(i<0){i=u.n.indexOf(words[0]);len=words[0].length;}
    var lab=u.label.length+3;if(i<lab){var j=u.n.indexOf(i<0?words[0]:q,lab);if(j>=0)i=j;}
    var a=Math.max(lab,i-50),b=Math.min(u.raw.length,i+len+90);
    var frag=d.createDocumentFragment();
    if(a>lab)frag.appendChild(d.createTextNode('… '));
    var seg=u.raw.slice(a,b),ns=u.n.slice(a,b),pos=0,re=loose?words.filter(function(w){return w.length>1;}):[q];
    while(pos<seg.length){
      var best=-1,bl=0;re.forEach(function(w){var k=ns.indexOf(w,pos);if(k>=0&&(best<0||k<best||(k===best&&w.length>bl))){best=k;bl=w.length;}});
      if(best<0){frag.appendChild(d.createTextNode(seg.slice(pos)));break;}
      frag.appendChild(d.createTextNode(seg.slice(pos,best)));
      var m=d.createElement('mark');m.textContent=seg.slice(best,best+bl);frag.appendChild(m);pos=best+bl;
    }
    if(b<u.raw.length)frag.appendChild(d.createTextNode(' …'));
    return frag;
  }
  function markIn(el,q,words,loose){
    var ws=loose?words.filter(function(w){return w.length>1;}):[q];
    var walker=d.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false),nodes=[],nd;
    while((nd=walker.nextNode())){if(nd.parentNode&&!nd.parentNode.closest('button,script,style,mark'))nodes.push(nd);}
    var first=null;
    nodes.forEach(function(node){
      var t=node.nodeValue,n=norm(t),hits=[],pos=0;
      while(pos<n.length){var best=-1,bl=0;ws.forEach(function(w){var k=n.indexOf(w,pos);if(k>=0&&(best<0||k<best)){best=k;bl=w.length;}});
        if(best<0)break;hits.push([best,bl]);pos=best+bl;}
      for(var h=hits.length-1;h>=0;h--){var r=node.splitText(hits[h][0]);r.splitText(hits[h][1]);
        var m=d.createElement('mark');m.className='hit';m.textContent=r.nodeValue;r.parentNode.replaceChild(m,r);first=m;}
    });
    return first;
  }
  var timer=null,last=null,results=[];
  function run(){
    var raw=input.value,q=terms(raw);list.innerHTML='';results=[];
    if(q.length<2){status.textContent=q.length?'Gõ ít nhất 2 chữ.':'';return;}
    if(!units)index();
    var words=q.split(' ').filter(Boolean);
    var hit=units.filter(function(u){return u.n.indexOf(q)>=0;});
    var loose=false;
    if(!hit.length&&words.length>1){hit=units.filter(function(u){return words.every(function(w){return u.n.indexOf(w)>=0;});});loose=true;}
    results=hit;
    if(!hit.length){status.textContent='Không thấy \u201c'+raw.trim()+'\u201d trong tệp này. Thử từ ngắn hơn, hoặc tìm ở tệp khác.';return;}
    status.textContent=hit.length+' mục có \u201c'+raw.trim()+'\u201d'+(loose?' (đủ các từ, không liền nhau)':'')+(hit.length>40?' · hiện 40 mục đầu':'');
    hit.slice(0,40).forEach(function(u){
      var li=d.createElement('li'),a=d.createElement('a'),t=d.createElement('span'),x=d.createElement('span');
      var target=u.el.querySelector('h3[id]')||u.el.closest('section[id]');
      a.href='#'+(target?target.id:'');t.className='t';
      var mm=u.label.match(/^(\d+(?:\.\d+)*)\.?\s+(.*)$/);
      if(mm){var n=d.createElement('span');n.className='n';n.textContent=mm[1];t.appendChild(n);t.appendChild(d.createTextNode(mm[2]));}
      else t.textContent=u.label;
      x.className='x';x.appendChild(snippet(u,q,words,loose));
      a.appendChild(t);a.appendChild(x);
      a.addEventListener('click',function(){
        clearMarks();
        var first=markIn(u.el,q,words,loose);
        setOpen(false);
        if(first){setTimeout(function(){first.scrollIntoView({block:'center'});},0);}
      });
      li.appendChild(a);list.appendChild(li);
    });
  }
  input.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(run,120);});
  input.addEventListener('keydown',function(e){
    if(e.key==='Enter'){var a=list.querySelector('a');if(a){e.preventDefault();a.click();location.hash=a.getAttribute('href');}}
    if(e.key==='Escape'){setOpen(false);if(btn)btn.focus();}
  });
})();
"""

SEARCH_HTML = (
    '<div class="search" id="tim" role="search" hidden style="display:none">'
    '<label for="tim-q">Tìm trong tệp này</label>'
    '<div class="srow"><input id="tim-q" type="search" autocomplete="off" spellcheck="false" '
    'placeholder="Ví dụ: hoàn cọc" enterkeyhint="search">'
    '<button type="button" class="sclose" aria-label="Đóng tìm kiếm">Đóng</button></div>'
    '<p class="sstatus" id="tim-st" aria-live="polite"></p><ol class="sres" id="tim-kq"></ol></div>'
)

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
{fonts}
<style>{css}</style>
</head>
<body>
<a class="skip" href="#noi-dung">Bỏ qua, tới nội dung</a>
<header class="mhead"><p class="wm">OTTIMO</p><span class="doc">{doc}</span>{index_link}</header>
<nav class="chipbar" aria-label="Các phần trong tệp"><div class="chips">{chips}</div><button type="button" class="sbtn" aria-expanded="false" aria-controls="tim" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>Tìm</button>""" + SEARCH_HTML + """</nav>
<div class="shell">
<aside class="sidebar" aria-label="Điều hướng">
<div class="side-brand"><p class="wm">OTTIMO</p><span class="doc">{doc}</span></div>
<p class="side-label">Bộ hướng dẫn</p>
<ol class="side-files">{files}</ol>
<div id="side-search"></div>
<p class="side-label">Trong tệp này</p>
<nav aria-label="Các phần"><ol class="side-toc"><li class="side-top"><a href="#muc-luc">Các phần</a></li>{side}</ol></nav>
</aside>
<main id="noi-dung">
<div class="content">
{cover}
{pick}
{toc}
{body}
{pager}
{colophon}
</div>
</main>
</div>
<script>{js}</script>
</body>
</html>
"""

TABLET_CSS = r"""
:root{--ivory:#F4F0E8;--cream:#EDE6D8;--stone:#6B6760;--ink:#2B2B28;--oak:#B08D57;
  --serif:'Lora',Georgia,'Times New Roman',serif;--sans:'Be Vietnam Pro',Arial,Helvetica,sans-serif;--fs:18px}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{background:var(--ivory);color:var(--ink);font-family:var(--sans);font-weight:400;font-kerning:normal;
  text-rendering:optimizeLegibility;-webkit-tap-highlight-color:transparent;overflow:hidden}
body.scroll{overflow:auto}
.nb{white-space:nowrap}
.stage{min-height:100%;display:flex;align-items:center;justify-content:center;
  padding:max(4vmin,env(safe-area-inset-top)) max(5vmin,env(safe-area-inset-right)) max(4vmin,env(safe-area-inset-bottom)) max(5vmin,env(safe-area-inset-left))}
.sheet{width:100%;max-width:62em;font-size:var(--fs);display:flex;flex-direction:column}
.eyebrow{font-size:.62em;font-weight:400;letter-spacing:.14em;text-transform:uppercase;color:var(--stone);line-height:1.2}
h1{font-family:var(--serif);font-weight:500;font-size:2.15em;letter-spacing:.02em;line-height:1.12;margin-top:.45em}
.sub{font-family:var(--serif);font-weight:500;font-size:1.2em;line-height:1.3;color:var(--stone);margin:.15em 0 1.1em}
.body p{line-height:1.5;margin-bottom:.62em;text-wrap:pretty}
.body p:last-child{margin-bottom:0}
.rule{border:0;border-top:1px solid var(--oak);width:4.5em;margin:1.1em 0}
.foot{display:flex;justify-content:space-between;font-size:.62em;line-height:1.2;color:var(--stone);margin-top:1.6em;
  padding-top:.8em;border-top:1px solid var(--cream)}
/* máy tính bảng ngang: EN | VI hai cột */
@media (min-aspect-ratio:5/4) and (min-width:800px){
  .sheet{max-width:none}
  .body{display:grid;grid-template-columns:1fr auto 1fr;column-gap:2.4em;align-items:start}
  .rule{width:0;height:100%;border-top:0;border-left:1px solid var(--oak);margin:0}
}
@media print{body{background:#fff;overflow:visible}.stage{padding:16mm}}
"""

TABLET_JS = r"""
(function(){
  var d=document,b=d.body,sheet=d.querySelector('.sheet'),stage=d.querySelector('.stage');
  /* cỡ chữ lớn nhất còn vừa một màn hình; nhỏ hơn 15 px thì cho cuộn */
  function fit(){
    var lo=15,hi=48,best=lo;
    for(var i=0;i<12;i++){var mid=(lo+hi)/2;sheet.style.setProperty('--fs',mid+'px');
      if(stage.scrollHeight<=window.innerHeight&&stage.scrollWidth<=window.innerWidth){best=mid;lo=mid;}else{hi=mid;}}
    sheet.style.setProperty('--fs',Math.floor(best*4)/4+'px');
    b.classList.toggle('scroll',stage.scrollHeight>window.innerHeight);
  }
  var t=null;function later(){clearTimeout(t);t=setTimeout(fit,80);}
  window.addEventListener('resize',later);window.addEventListener('orientationchange',later);
  if(d.fonts&&d.fonts.ready){d.fonts.ready.then(fit);}
  fit();
  /* chạm một lần: toàn màn hình (nếu trình duyệt cho phép) và giữ màn hình sáng */
  var lock=null;
  function wake(){try{if('wakeLock' in navigator&&!lock&&d.visibilityState==='visible'){navigator.wakeLock.request('screen').then(function(l){lock=l;l.addEventListener('release',function(){lock=null;});}).catch(function(){});}}catch(e){}}
  d.addEventListener('visibilitychange',wake);
  d.addEventListener('click',function(){
    var el=d.documentElement,fs=d.fullscreenElement||d.webkitFullscreenElement;
    if(!fs){var r=el.requestFullscreen||el.webkitRequestFullscreen;if(r){try{var p=r.call(el);if(p&&p.catch)p.catch(function(){});}catch(e){}}}
    wake();
  });
  wake();
})();
"""

TABLET_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#F4F0E8">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="ID notice">
<meta name="ottimo-source" content="to-4-your-id-details-a4.html · {digest}">
<title>Your ID details · OTTIMO</title>
{fonts}
<style>{css}</style>
</head>
<body>
<main class="stage">
<article class="sheet" aria-labelledby="t">
<p class="eyebrow">{label}</p>
<h1 id="t">{title}</h1>
<p class="sub" lang="vi">{sub}</p>
<div class="body"><div class="en" lang="en">{en}</div><hr class="rule"><div class="vi" lang="vi">{vi}</div></div>
<footer class="foot"><span>{foot_l}</span><span>{foot_r}</span></footer>
</article>
</main>
<script>{js}</script>
</body>
</html>
"""


# --------------------------------------------------------------------------- kiểm bằng Chrome

def check(files, out_dir):
    from check_manual import CHROME_CANDIDATES, WS, js, load, overflow, shot  # noqa: E402

    chrome = next((c for c in CHROME_CANDIDATES if c and Path(c).exists()), None)
    if not chrome:
        print("Không thấy Chrome. Đặt biến CHROME.", file=sys.stderr)
        return 2
    out_dir.mkdir(parents=True, exist_ok=True)
    prof = tempfile.mkdtemp(prefix="ottimo-guides-")
    proc = subprocess.Popen([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
                             "--remote-debugging-port=0", "--user-data-dir=" + prof, "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    bad = 0
    try:
        port_file = Path(prof) / "DevToolsActivePort"
        for _ in range(100):
            if port_file.exists() and port_file.read_text().strip():
                break
            time.sleep(0.1)
        port = int(port_file.read_text().split()[0])
        req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % port, method="PUT")
        ws = WS(json.loads(urllib.request.urlopen(req, timeout=10).read())["webSocketDebuggerUrl"])
        ws.call("Page.enable")
        ws.call("Runtime.enable")
        for f in files:
            url = f.resolve().as_uri()
            tablet = f.name == TABLET_NAME
            views = ([(1180, 820, True, 2, "ngang"), (820, 1180, True, 2, "doc"), (1024, 768, True, 2, "1024")]
                     if tablet else [(390, 844, True, 2, "390"), (1440, 900, False, 1, "1440")])
            for (w, h, mob, dpr, tag) in views:
                load(ws, url, w, h, mob, dpr)
                if tablet:
                    r = js(ws, "(function(){var s=document.querySelector('.stage');return {fs:getComputedStyle(document.querySelector('.sheet')).fontSize,"
                               "h:s.scrollHeight,vh:innerHeight,w:document.documentElement.scrollWidth,vw:innerWidth,"
                               "scroll:document.body.classList.contains('scroll'),fonts:Array.from(document.fonts).filter(function(x){return x.status==='loaded'}).map(function(x){return x.family+' '+x.weight})}})()")
                    ok = r["h"] <= r["vh"] and r["w"] <= r["vw"]
                    bad += not ok
                    print("  %s %s: cỡ chữ %s · cao %s/%s · rộng %s/%s · %s · font %s"
                          % (f.name, tag, r["fs"], r["h"], r["vh"], r["w"], r["vw"], "VỪA" if ok else "TRÀN",
                             ", ".join(sorted(set(r["fonts"])))))
                    shot(ws, out_dir / ("tablet-%s.png" % tag))
                    continue
                ov = overflow(ws)
                ok = ov["scroll"] <= ov["client"] and not ov["over"]
                bad += not ok
                print("  %s %s px: scrollWidth %s / clientWidth %s – %s %s"
                      % (f.name, w, ov["scroll"], ov["client"], "OK" if ok else "TRÀN", "; ".join(ov["over"])))
                if f.stem.startswith("02") or f.stem.startswith("00"):
                    shot(ws, out_dir / ("%s-%s-top.png" % (f.stem[:2], tag)))
                    if f.stem.startswith("02"):
                        js(ws, "(function(){var e=document.getElementById('s-7-2');if(e){e.scrollIntoView();window.scrollBy(0,-60);}})()")
                        time.sleep(0.4)
                        shot(ws, out_dir / ("02-%s-7-2.png" % tag))
                        # thử tìm không dấu
                        js(ws, "(function(){var b=document.querySelector('.sbtn');if(b&&b.offsetParent)b.click();"
                               "var i=document.getElementById('tim-q');i.value='hoan coc';i.dispatchEvent(new Event('input'));})()")
                        time.sleep(0.6)
                        st = js(ws, "document.getElementById('tim-st').textContent")
                        print("    tìm 'hoan coc': %s" % st)
                        shot(ws, out_dir / ("02-%s-search.png" % tag))
            if f.stem.startswith("02"):
                load(ws, url, 1200, 900, False, 1)
                js(ws, "window.dispatchEvent(new Event('beforeprint'))")
                pdf = base64.b64decode(ws.call("Page.printToPDF", preferCSSPageSize=True, printBackground=True)["data"])
                (out_dir / "02-print.pdf").write_bytes(pdf)
                n = len(re.findall(rb"/Type\s*/Page(?![s\w])", pdf))
                print("  in thử %s: %d trang A4 · %d KB" % (f.name, n, len(pdf) // 1024))
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        shutil.rmtree(prof, ignore_errors=True)
    return 1 if bad else 0


# --------------------------------------------------------------------------- chạy

def main(argv=None):
    ap = argparse.ArgumentParser(description="Dựng Bộ hướng dẫn OTTIMO Desk v1.0 theo bộ phận (HTML).")
    ap.add_argument("--src", type=Path, default=SRC_DIR)
    ap.add_argument("--out", type=Path, default=OUT_DIR)
    ap.add_argument("--link-images", action="store_true", help="trỏ ảnh bằng đường dẫn thay vì nhúng (không tự đứng)")
    ap.add_argument("--no-embed-fonts", action="store_true", help="dùng Google Fonts thay vì nhúng font")
    ap.add_argument("--check-dir", type=Path, help="đo tràn 390/1440, chụp ảnh kiểm, in thử PDF vào thư mục này")
    a = ap.parse_args(argv)

    paths = sorted(p for p in a.src.glob("0*.md") if re.match(r"^0\d-", p.name))
    if not paths:
        raise SystemExit("Không thấy tệp 0x-*.md trong %s" % a.src)
    guides = [Guide(p) for p in paths]
    if not guides[0].is_index:
        raise SystemExit("Thiếu 00-index.md (trang mục lục).")
    shot_info = load_shots(SHOT_LISTS)
    a.out.mkdir(parents=True, exist_ok=True)

    stats, written, notice_in_guides = {}, [], []
    embedded = False
    for g in guides[1:] + guides[:1]:  # tệp bộ phận trước, mục lục sau (cần số ảnh)
        out_path = a.out / g.out_name
        ctx = Ctx(g, guides, shot_info, a.link_images, out_path)
        page, embedded = render_page(g, guides, ctx, stats, not a.no_embed_fonts)
        out_path.write_text(page, encoding="utf-8")
        written.append(out_path)
        stats[g.stem] = {"found": ctx.found, "missing": ctx.missing, "refs": ctx.refs,
                         "chapters": len(g.chapters), "subs": sum(len(c["subs"]) for c in g.chapters),
                         "kb": out_path.stat().st_size // 1024}
        if ctx.notice:
            notice_in_guides.append((g, ctx.notice))

    a4 = read_a4_notice(A4_NOTICE)
    tablet = a.out / TABLET_NAME
    tablet.write_text(build_tablet(a4, not a.no_embed_fonts), encoding="utf-8")

    rel = lambda p: p.relative_to(ROOT) if str(p).startswith(str(ROOT)) else p  # noqa: E731
    print("Đã dựng vào %s (ảnh %s, font %s):" % (rel(a.out), "trỏ đường dẫn" if a.link_images else "nhúng base64",
                                                "nhúng" if embedded else "Google Fonts"))
    print("  %-30s %6s %5s %6s %10s %8s" % ("Tệp", "Phần", "Mục", "Chỗ ảnh", "Ảnh có/mã", "KB"))
    for g in guides:
        s = stats[g.stem]
        print("  %-30s %6d %5d %6d %10s %8d" % (g.out_name, s["chapters"], s["subs"], s["refs"],
                                                "%d/%d" % (len(s["found"]), len(s["found"]) + len(s["missing"])), s["kb"]))
        if s["missing"]:
            print("      thiếu: %s" % ", ".join(s["missing"]))
    print("  %s · %d KB · nguồn chữ %s (mã %s)" % (TABLET_NAME, tablet.stat().st_size // 1024, rel(A4_NOTICE), a4["digest"]))

    code = 0
    for g, n in notice_in_guides:
        diffs = compare_notice(n, a4)
        if diffs:
            code = 1
            print("  ! Chữ tờ Your ID details trong %s KHÁC bản A4:" % g.path.name)
            for name, x, y in diffs:
                print("      %s:\n        hướng dẫn: %s\n        bản A4:    %s" % (name, x, y))
        else:
            print("  Chữ tờ Your ID details trong %s khớp nguyên văn bản A4 (%d đoạn + nhãn, tiêu đề, chân tờ)."
                  % (g.path.name, len(n["en"]) + len(n["vi"])))
    if a.check_dir:
        code = max(code, check(written + [tablet], a.check_dir))
    return code


if __name__ == "__main__":
    sys.exit(main())
