#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Nhúng font OTTIMO (Lora, Be Vietnam Pro, JetBrains Mono) vào HTML tự đứng – dùng chung (UXD).

Dùng bởi build_manual.py (sổ tay) và build_guides.py (bộ hướng dẫn + tờ máy tính bảng).
Font lấy từ @fontsource của landing-web (cài bằng `pnpm install`), tập con latin + vietnamese,
nhúng base64 woff2 trong @font-face. Mở tệp khi mất mạng vẫn đúng font thương hiệu.
Thiếu bất kỳ tệp font nào thì trả về None và trang dùng Google Fonts (cần mạng); hàm fonts_head
báo điều đó qua giá trị thứ hai để công cụ dựng in cảnh báo, còn rebuild_manual_html.py coi là lỗi.

Chỉ thư viện chuẩn Python 3.9+.
"""
import base64
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
FONT_DIR = ROOT / "product" / "apps" / "landing-web" / "node_modules" / "@fontsource"
GOOGLE_FONTS = ("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700"
                "&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap")

# fontsource: tập con latin + vietnamese (đủ tiếng Anh, tiếng Việt). Mũi tên → dùng font dự phòng.
UR_LATIN = ("U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,"
            "U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")
UR_VI = ("U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,"
         "U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB")

FONT_CACHE = {}


def _spec(f):
    """(họ, slug, độ đậm[, kiểu]) -> (họ, slug, độ đậm, kiểu); kiểu mặc định 'normal'."""
    family, slug, weight = f[0], f[1], f[2]
    style = f[3] if len(f) > 3 else "normal"
    return family, slug, weight, style


def font_face_css(fonts):
    """@font-face nhúng base64 (woff2) từ @fontsource; thiếu tệp thì trả None (dùng Google Fonts)."""
    rules = []
    for f in fonts:
        family, slug, weight, style = _spec(f)
        for subset, urange in (("latin", UR_LATIN), ("vietnamese", UR_VI)):
            p = FONT_DIR / slug / "files" / ("%s-%s-%d-%s.woff2" % (slug, subset, weight, style))
            if not p.is_file():
                return None
            if p not in FONT_CACHE:
                FONT_CACHE[p] = base64.b64encode(p.read_bytes()).decode("ascii")
            rules.append("@font-face{font-family:'%s';font-style:%s;font-weight:%d;font-display:swap;"
                         "src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s}"
                         % (family, style, weight, FONT_CACHE[p], urange))
    return "\n".join(rules)


def fonts_head(fonts, embed):
    """Khối <head> cho font: (html, True) khi đã nhúng; (link Google Fonts, False) khi không nhúng được."""
    css = font_face_css(fonts) if embed else None
    if css:
        return "<style>%s</style>" % css, True
    return ('<link rel="preconnect" href="https://fonts.googleapis.com">'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            '<link rel="stylesheet" href="%s">' % html.escape(GOOGLE_FONTS, quote=True)), False
