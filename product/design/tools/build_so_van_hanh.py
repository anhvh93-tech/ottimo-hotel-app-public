#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dựng Sổ vận hành OTTIMO (một tệp HTML tự đứng) từ Markdown của BA (UXD, Round 5).

Chạy từ gốc repo:
    python3 -I product/design/tools/build_so_van_hanh.py
Ra: product/docs/so-van-hanh.html – KHÔNG commit (.gitignore, FB-R4-SEC-UXD-HTML-01), dựng lại từ .md.

Dùng lõi build_manual.py (đọc Markdown, khung trang, CSS, font nhúng, in A4) và chỉ đổi phần riêng của sổ:
  - "## 1. Việc định kỳ" được coi là phần 1 (chỉ trong bộ dựng, không sửa tệp nguồn); nhãn ghi "Mục 1";
  - bìa ghi Bản / Ngày lấy từ dòng "Lập:"; tên trang, đầu trang, chân trang in ghi "Sổ vận hành";
  - mỗi dòng "- [ ]" thành ô vuông để đánh dấu khi in (sổ dặn: in mục 1 dán cạnh bàn);
  - nút "In riêng mục này" in đúng mục đó, không kèm bìa;
  - chỉ nối "mục x.y" của chính sổ. "sổ tay mục …", "`01` mục …", "`….md` mục …" là tài liệu khác: để chữ;
  - khối **[Chờ xác nhận …]** không dựng (như sổ tay).
Không sửa Markdown. Chỉ thư viện chuẩn Python 3.9+.
"""
import argparse
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_manual as bm  # noqa: E402

ROOT = bm.ROOT
DEFAULT_MD = ROOT / "product" / "docs" / "so-van-hanh.md"
DEFAULT_OUT = ROOT / "product" / "docs" / "so-van-hanh.html"
TITLE = "Sổ vận hành OTTIMO"

PART_RE = re.compile(r"^## (\d+)\. ", re.M)
MUC_RE = re.compile(r"(?<![\w])(mục\s+)(\d+(?:\.\d+)?(?:[a-z](?![^\W\d_]))?)(?![\d.]*\d)")
OTHER_DOC_RE = re.compile(r"(?:[Ss]ổ tay(?:\s+theo)?|hướng dẫn|\x00\d+\x00)$")

EXTRA_CSS = r"""
/* ---- sổ vận hành: ô đánh dấu ---- */
ul.bul>li.todo{list-style:none;position:relative;margin-left:-1.25rem;padding-left:1.85rem}
ul.bul>li.todo::before{content:"";position:absolute;left:.1rem;top:.3em;width:1em;height:1em;border:1.5px solid var(--stone);border-radius:3px;background:var(--ivory)}
.tick{display:inline-block;width:.95em;height:.95em;border:1.5px solid var(--stone);border-radius:3px;background:var(--ivory);vertical-align:-.12em}
@media print{
  ul.bul>li.todo::before,.tick{border-color:var(--ink);background:var(--white)}
}
"""


class Ctx(bm.Ctx):
    parts = set()

    def xref_hook(self, t, codes):
        def ref(m):
            before = re.sub(r"<[^>]+>", "", t[: m.start()]).rstrip()
            if OTHER_DOC_RE.search(before):
                return m.group(0)  # mục của tài liệu khác
            num = m.group(2)
            target = self.sec_ids.get(num) or self.sec_ids.get(num.rstrip("abcdefghijklmnopqrstuvwxyz"))
            if not target and num in self.parts:
                target = "ch-" + num
            if not target:
                return m.group(0)
            return '<a class="xref" href="#%s">%s%s</a>' % (target, m.group(1), num)

        return MUC_RE.sub(ref, t)


def sub1(page, old, new, count=None):
    n = page.count(old)
    if not n or (count is not None and n != count):
        raise SystemExit("build_so_van_hanh: mẫu '%s' xuất hiện %d lần – lõi build_manual.py đã đổi?" % (old, n))
    return page.replace(old, new)


def build(md_text, md_path, out_path, embed_fonts=True):
    meta = re.search(r"Bản (\d+\.\d+) \((\d{1,2}/\d{1,2}/\d{4})", md_text)
    edition, ed_date = (meta.group(1), meta.group(2)) if meta else ("", "")
    doc = "Sổ vận hành%s" % (" · bản " + edition if edition else "")
    Ctx.parts = set(PART_RE.findall(md_text))
    src = PART_RE.sub(lambda m: "## Chương %s. " % m.group(1), md_text)

    saved = (bm.Ctx, bm.PAGE_TITLE, bm.MOTTO, bm.CSS, bm.JS, bm.TEMPLATE)
    bm.Ctx, bm.PAGE_TITLE, bm.MOTTO = Ctx, TITLE, ""
    foot = "Sổ vận hành OTTIMO%s · trang " % (" · bản " + edition if edition else "")
    bm.CSS = sub1(bm.CSS, '"Sổ tay OTTIMO Desk v1.0 · trang "', '"%s"' % foot, 1)
    bm.CSS = sub1(bm.CSS, "@page :first{@bottom-center{content:none}}", "", 1) + EXTRA_CSS
    bm.JS = sub1(bm.JS, "keep={cover:1}", "keep={}", 1)
    bm.TEMPLATE = sub1(bm.TEMPLATE, '<span class="doc">Sổ tay Desk v1.0</span>', '<span class="doc">%s</span>' % bm.esc(doc), 2)
    bm.TEMPLATE = sub1(bm.TEMPLATE, 'aria-label="Chuyển nhanh theo bộ phận"', 'aria-label="Chuyển nhanh theo mục"', 1)
    bm.TEMPLATE = sub1(bm.TEMPLATE, 'aria-label="Các chương"', 'aria-label="Các mục"', 1)
    try:
        page, ctx, parts = bm.build(src, md_path, out_path, md_path.parent / "manual" / "img", False, embed_fonts)
    finally:
        bm.Ctx, bm.PAGE_TITLE, bm.MOTTO, bm.CSS, bm.JS, bm.TEMPLATE = saved

    # nhãn: phần của sổ gọi là "mục"
    page = sub1(page, '<p class="ch-label">Chương ', '<p class="ch-label">Mục ')
    page = re.sub(r'(<p class="ch-label">Mục \d+) · (\d+) mục</p>',
                  lambda m: '%s%s</p>' % (m.group(1), " · %s mục con" % m.group(2) if m.group(2) != "0" else ""), page)
    page = sub1(page, "<span>Đầu chương</span>", "<span>Đầu mục</span>")
    page = sub1(page, "Các mục trong chương (", "Các mục con (")
    page = sub1(page, "In riêng chương này", "In riêng mục này")
    page = sub1(page, '<p class="ch-label">Theo bộ phận</p>', '<p class="ch-label">Theo việc</p>', 1)
    page = sub1(page, '<p class="motto"></p>', "", 1)
    # bìa: bản và ngày của bản (dòng "Lập: … Bản 1.7 (07/11/2026, …")
    facts = '<div><dt>Dành cho</dt><dd>Chủ đầu tư</dd></div>'
    if edition:
        facts = '<div><dt>Bản</dt><dd>%s</dd></div><div><dt>Ngày</dt><dd>%s</dd></div>%s' % (
            bm.esc(edition), bm.esc(ed_date), facts)
    page = re.sub(r'<dl class="facts">.*?</dl>', '<dl class="facts">%s</dl>' % facts, page, count=1, flags=re.S)
    # ô đánh dấu
    n_todo = page.count("<li>[ ] ")
    page = page.replace("<li>[ ] ", '<li class="todo">')
    page = page.replace("<code>[ ]</code>", '<span class="tick" role="img" aria-label="ô vuông"></span>')
    # thanh bên + mục lục: "Giả định…", "Lịch sử" (không đánh số) xuống cuối, sau mục 7
    for cls, box in (("side-top", r'(<ol class="side-toc">)(.*?)(</ol></nav>)'),
                     ("toc-row", r'(<ul class="toc-all">)(.*?)(</ul></section>)')):
        def move(m, cls=cls):
            items = re.findall(r'<li class="%s"><a href="#(?!muc-luc")[^"]+">.*?</a></li>' % cls, m.group(2))
            rest = m.group(2)
            for it in items:
                rest = rest.replace(it, "", 1)
            return m.group(1) + rest + "".join(items) + m.group(3)
        page = re.sub(box, move, page, count=1, flags=re.S)
    return page, ctx, parts, n_todo


def main(argv=None):
    ap = argparse.ArgumentParser(description="Dựng Sổ vận hành OTTIMO (HTML) từ Markdown.")
    ap.add_argument("--md", type=Path, default=DEFAULT_MD)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--no-embed-fonts", action="store_true", help="dùng Google Fonts thay vì nhúng font")
    a = ap.parse_args(argv)
    md_path = a.md.resolve()
    if not md_path.is_file():
        print("Không thấy tệp nguồn: %s" % md_path, file=sys.stderr)
        return 2
    out_path = a.out.resolve()
    page, ctx, parts, n_todo = build(md_path.read_text(encoding="utf-8"), md_path, out_path, not a.no_embed_fonts)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(page, encoding="utf-8")
    rel = out_path.relative_to(ROOT) if str(out_path).startswith(str(ROOT)) else out_path
    print("Đã dựng: %s (%.2f MB)" % (rel, out_path.stat().st_size / 1024 / 1024))
    print("  Mục: %d · mục con: %d · ô đánh dấu: %d" % (len(parts), sum(len(c["subs"]) for c in parts), n_todo))
    print("  Font: %s" % ("nhúng base64 (mở khi mất mạng vẫn đúng font)" if ctx.fonts_embedded
                          else "Google Fonts (cần mạng)"))
    if not ctx.fonts_embedded and not a.no_embed_fonts:
        print("  ! Không thấy font @fontsource – chạy `pnpm install` rồi dựng lại.", file=sys.stderr)
        return 1
    if ctx.missing:
        print("  Ảnh chưa có: %s" % ", ".join(ctx.missing))
    return 0


if __name__ == "__main__":
    sys.exit(main())
