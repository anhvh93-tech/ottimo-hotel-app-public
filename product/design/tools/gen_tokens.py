"""Generate tokens.json, tokens.css and contrast table for OTTIMO Design System.
Single source of truth for colour tokens (light + dark)."""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def lum(h):
    h = h.lstrip('#'); r, g, b = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def cr(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

# name: (light, dark, usage, r0_light, r0_dark)
COLORS = [
    ("bg",            "#F4F0E8", "#1B1A18", "Nền trang", "#F4F0E8", "#1B1A18"),
    ("surface",       "#FBF9F4", "#24221F", "Thẻ, input, modal, drawer", "#FBF9F4", "#24221F"),
    ("surface-2",     "#EEE8DC", "#2D2A26", "Nền phụ, seg control, header bảng", "#EEE8DC", "#2D2A26"),
    ("side",          "#ECE5D8", "#201E1C", "Sidebar", "#ECE5D8", "#201E1C"),
    ("ink",           "#2B2B2B", "#EDE8DF", "Chữ chính; nền nút chính", "#2B2B2B", "#EDE8DF"),
    ("ink-inverse",   "#FBF9F4", "#1B1A18", "Chữ trên nền --ink (nút chính)", "-", "-"),
    ("muted",         "#635F58", "#A9A398", "Chữ phụ (nhãn, mô tả)", "#6B6760", "#A9A398"),
    ("faint",         "#6A645B", "#A39D92", "Chữ phụ cấp 3 (chú thích, nhãn nhóm menu) – vẫn đạt 4,5:1", "#9A948A", "#7D776E"),
    ("deco",          "#9A948A", "#7D776E", "CHỈ trang trí (icon không mang nghĩa, vạch kẻ chấm). CẤM dùng cho chữ", "-", "-"),
    ("line",          "#E0D8CA", "#38342F", "Đường kẻ phân cách (trang trí)", "#E0D8CA", "#38342F"),
    ("line-strong",   "#857E71", "#857F75", "Viền ô nhập, checkbox, seg – thành phần UI cần ≥ 3:1 (R1 bước 4: #8C8578 → #857E71 để đạt 3:1 trên --side)", "-", "-"),
    ("oak",           "#B08D57", "#C9A56E", "Màu thương hiệu: logo, minh họa, thanh biểu đồ, viền nhấn. Không dùng cho chữ nhỏ trên nền sáng", "#B08D57", "#C9A56E"),
    ("oak-ink",       "#7A5C2E", "#D9B987", "Chữ/icon màu gỗ sồi, link, mục đang chọn", "#86693B", "#D9B987"),
    ("oak-soft",      "#F1E7D6", "#3A3226", "Nền nhấn nhẹ, mục đang chọn, dòng bảng đang chọn", "#F1E7D6", "#3A3226"),
    ("focus",         "#7A5C2E", "#D9B987", "Viền focus 2px + offset 2px", "#B08D57", "#C9A56E"),
    ("focus-on-dark", "#F4F0E8", "#1B1A18", "Viền focus trên vùng nền tối (đầu trang app khách --bar-in, toast --ink) – R1 bước 4", "-", "-"),
    ("ok",            "#356B49", "#7FBF95", "Thành công / Đạt / Sẵn sàng", "#3D7552", "#7FBF95"),
    ("ok-bg",         "#E2EEE5", "#22352A", "Nền chip thành công", "#E2EEE5", "#22352A"),
    ("warn",          "#8A5214", "#E0A866", "Cảnh báo / Cần dọn / Sắp hết hạn", "#9A5F1C", "#E0A866"),
    ("warn-bg",       "#F5E8D3", "#3A2E1E", "Nền chip cảnh báo", "#F5E8D3", "#3A2E1E"),
    ("bad",           "#A8403C", "#E58A84", "Lỗi / Không đạt / Khóa phòng / Quá hạn", "#A8403C", "#E58A84"),
    ("bad-bg",        "#F5DFDC", "#3D2422", "Nền chip lỗi", "#F5DFDC", "#3D2422"),
    ("info",          "#3E5E78", "#8DB0CC", "Thông tin / Có khách", "#3E5E78", "#8DB0CC"),
    ("info-bg",       "#E0E8EF", "#22303B", "Nền chip thông tin", "#E0E8EF", "#22303B"),
    ("bar-in",        "#2F2D2A", "#E3DCCF", "Thanh rack: đang ở (in_house)", "#2F2D2A", "#E3DCCF"),
    ("bar-in-t",      "#F4F0E8", "#1B1A18", "Chữ trên thanh đang ở", "#F4F0E8", "#1B1A18"),
    ("bar-cf",        "#C9A56E", "#B8925A", "Thanh rack: đã xác nhận (confirmed)", "#C9A56E", "#B8925A"),
    ("bar-cf-t",      "#2B2B2B", "#1B1A18", "Chữ trên thanh đã xác nhận", "#2B2B2B", "#1B1A18"),
    ("bar-long",      "#5B7387", "#7E98AD", "Thanh rack: hợp đồng dài hạn (đang ở/đã xác nhận)", "#5B7387", "#7E98AD"),
    ("bar-long-t",    "#FFFFFF", "#111111", "Chữ trên thanh dài hạn", "#FFFFFF", "#111111"),
    ("scrim",         "rgba(27,26,24,.48)", "rgba(0,0,0,.6)", "Nền mờ sau modal/drawer", "-", "-"),
]

# (fg, bg, kind, where) – kind: text (4.5) | large (3) | ui (3)
PAIRS = [
    ("ink", "bg", "text", "Chữ chính trên nền trang"),
    ("ink", "surface", "text", "Chữ chính trên thẻ"),
    ("ink-inverse", "ink", "text", "Chữ nút chính"),
    ("muted", "bg", "text", "Chữ phụ trên nền trang"),
    ("muted", "surface", "text", "Chữ phụ trên thẻ"),
    ("muted", "surface-2", "text", "Chữ phụ trên nền phụ / header bảng; chữ nút bị khóa (thay opacity .5); thanh 'Đã kín'"),
    ("muted", "side", "text", "Menu chưa chọn trên sidebar"),
    ("muted", "oak-soft", "text", "Chữ phụ trên dòng đang chọn"),
    ("faint", "bg", "text", "Chú thích trên nền trang (R0: 2,65:1)"),
    ("faint", "surface", "text", "Chú thích trên thẻ (R0: 2,86:1)"),
    ("faint", "side", "text", "Nhãn nhóm menu"),
    ("oak-ink", "bg", "text", "Link / chữ nhấn trên nền trang"),
    ("oak-ink", "surface", "text", "Link / chữ nhấn trên thẻ"),
    ("oak-ink", "oak-soft", "text", "Chữ trên nền nhấn (R0: 4,18:1)"),
    ("ok", "ok-bg", "text", "Chip thành công"),
    ("ok", "surface", "text", "Chữ/icon thành công trên thẻ"),
    ("warn", "warn-bg", "text", "Chip cảnh báo (R0: 4,31:1)"),
    ("warn", "surface", "text", "Chữ cảnh báo trên thẻ"),
    ("bad", "bad-bg", "text", "Chip lỗi"),
    ("bad", "surface", "text", "Chữ lỗi dưới ô nhập"),
    ("info", "info-bg", "text", "Chip thông tin"),
    ("bar-in-t", "bar-in", "text", "Chữ trên thanh đang ở"),
    ("bar-cf-t", "bar-cf", "text", "Chữ trên thanh đã xác nhận"),
    ("bar-long-t", "bar-long", "text", "Chữ trên thanh dài hạn"),
    ("focus", "bg", "ui", "Viền focus trên nền trang (R0: 2,72:1)"),
    ("focus", "surface", "ui", "Viền focus trên thẻ"),
    ("line-strong", "surface", "ui", "Viền ô nhập trên thẻ"),
    ("line-strong", "bg", "ui", "Viền ô nhập trên nền trang"),
    ("oak-ink", "surface-2", "text", "Chữ nhấn trên nền phụ / seg đang chọn"),
    ("ink", "oak-soft", "text", "Chữ chính trên dòng/mục đang chọn"),
    ("bad", "bg", "text", "Chữ lỗi / quá hạn trên nền trang"),
    ("warn", "bg", "text", "Chữ cảnh báo trên nền trang"),
    ("bad", "warn-bg", "text", "Đếm ngược quá hạn trên nền cảnh báo"),
    ("focus-on-dark", "bar-in", "ui", "Viền focus ở đầu trang app khách (R1 đo thực tế 2,22:1 – FB-R1-UXR-UXD-05)"),
    ("focus-on-dark", "ink", "ui", "Viền focus trên toast / nền --ink"),
    ("focus", "side", "ui", "Viền focus trên sidebar"),
    ("focus", "surface-2", "ui", "Viền focus trên nền phụ / seg"),
    ("focus", "oak-soft", "ui", "Viền focus trên dòng đang chọn"),
    ("focus", "warn-bg", "ui", "Viền focus của nút trong alert cảnh báo"),
    ("focus", "bad-bg", "ui", "Viền focus của nút trong alert lỗi"),
    ("focus", "info-bg", "ui", "Viền focus của nút trong alert thông tin"),
    ("line-strong", "side", "ui", "Viền ô nhập/seg đặt trên sidebar (R1: 2,92:1 – FB-R1-UXR-UXD-13)"),
    ("line-strong", "surface-2", "ui", "Viền seg trên nền phụ"),
    ("oak-ink", "surface", "ui", "Cột biểu đồ công suất (thay --oak 2,94:1 – FB-R1-UXR-UXD-03)"),
    ("ok", "bad", "info-only", "Phân biệt Đạt vs Lỗi chỉ bằng màu – KHÔNG đủ, bắt buộc icon + chữ (HR-11)"),
    # R2 Đợt 0 – cặp mới dùng trong hi-fi (product/design/hifi/assets/hifi.css)
    ("ink", "warn-bg", "text", "Chữ thân trong alert cảnh báo, thanh mất mạng (hi-fi R2)"),
    ("ink", "bad-bg", "text", "Chữ thân trong alert lỗi, thanh 'Chưa gán căn' (hi-fi R2)"),
    ("ink", "info-bg", "text", "Chữ thân trong alert thông tin, khối 'bộ đồ dùng thêm' (hi-fi R2)"),
    ("ink", "ok-bg", "text", "Chữ thân trong alert thành công (hi-fi R2)"),
    ("ink", "surface-2", "text", "Chữ chính trên nền phụ (ô chỉ đọc, thanh 'Đã kín') (hi-fi R2)"),
    ("ink", "side", "text", "Chữ chính trên sidebar (hi-fi R2)"),
    ("ink-inverse", "bad", "text", "Chữ nút nguy hiểm (Hủy đơn, Thu hồi) (hi-fi R2)"),
    ("info", "surface", "text", "Chữ/icon thông tin trên thẻ, mã operationId (hi-fi R2)"),
    ("oak-ink", "side", "text", "Icon/chữ mục đang chọn trên sidebar (hi-fi R2)"),
]

def build():
    light = {c[0]: c[1] for c in COLORS}
    dark = {c[0]: c[2] for c in COLORS}
    rows = []
    fails = 0
    for fg, bg, kind, where in PAIRS:
        res = []
        for mode, pal in (("sáng", light), ("tối", dark)):
            r = cr(pal[fg], pal[bg])
            need = 4.5 if kind == "text" else 3.0
            ok = r >= need if kind != "info-only" else None
            if ok is False:
                fails += 1
            res.append((r, ok))
        rows.append((fg, bg, kind, where, res))
    return light, dark, rows, fails

def write_all():
    light, dark, rows, fails = build()
    tokens = {
        "$schema": "https://design-tokens.github.io/community-group/format/",
        "$description": "OTTIMO Design System tokens v0.3 – Round 2 (Đợt 0 hi-fi). Nguồn: product/design/design-system.md. Mọi màu chữ đã đo tương phản WCAG 2.2 AA.",
        "meta": {"name": "OTTIMO", "version": "0.3.1", "round": 2, "owner": "UXD", "date": "2026-10-16"},
        "color": {
            "light": {c[0]: {"$type": "color", "$value": c[1], "$description": c[3]} for c in COLORS},
            "dark": {c[0]: {"$type": "color", "$value": c[2], "$description": c[3]} for c in COLORS},
        },
        "font": {
            "family": {
                "serif": {"$type": "fontFamily", "$value": ["Lora", "Georgia", "Times New Roman", "serif"], "$description": "Tiêu đề, số KPI, số căn, tổng bill. Tự host woff2 (SIL OFL 1.1)"},
                "sans": {"$type": "fontFamily", "$value": ["Be Vietnam Pro", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"], "$description": "Thân chữ, mọi UI. Tự host woff2 (SIL OFL 1.1), subset latin + latin-ext + vietnamese + cyrillic-fallback"},
                "mono": {"$type": "fontFamily", "$value": ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"], "$description": "Mã đơn, mã hồ sơ khai báo, nội dung chuyển khoản"},
            },
            "weight": {"regular": {"$type": "fontWeight", "$value": 400}, "medium": {"$type": "fontWeight", "$value": 500}, "semibold": {"$type": "fontWeight", "$value": 600}},
            "size": {k: {"$type": "dimension", "$value": f"{v}px"} for k, v in
                     [("xs", 12), ("sm", 13), ("md", 14), ("lg", 16), ("xl", 18), ("2xl", 22), ("3xl", 26), ("4xl", 32)]},
            "lineHeight": {"tight": {"$type": "number", "$value": 1.25}, "normal": {"$type": "number", "$value": 1.5}, "relaxed": {"$type": "number", "$value": 1.65}},
        },
        "typography": {
            "display": {"$type": "typography", "$value": {"fontFamily": "{font.family.serif}", "fontWeight": 600, "fontSize": "32px", "lineHeight": 1.2}},
            "h1": {"$type": "typography", "$value": {"fontFamily": "{font.family.serif}", "fontWeight": 600, "fontSize": "24px", "lineHeight": 1.25}},
            "h2": {"$type": "typography", "$value": {"fontFamily": "{font.family.serif}", "fontWeight": 600, "fontSize": "19px", "lineHeight": 1.3}},
            "h3-label": {"$type": "typography", "$value": {"fontFamily": "{font.family.sans}", "fontWeight": 600, "fontSize": "12px", "lineHeight": 1.4, "letterSpacing": "0.1em", "textTransform": "uppercase"}},
            "kpi": {"$type": "typography", "$value": {"fontFamily": "{font.family.serif}", "fontWeight": 600, "fontSize": "26px", "lineHeight": 1.15, "fontVariantNumeric": "tabular-nums"}},
            "body-desk": {"$type": "typography", "$value": {"fontFamily": "{font.family.sans}", "fontWeight": 400, "fontSize": "14px", "lineHeight": 1.5}},
            "body-mobile": {"$type": "typography", "$value": {"fontFamily": "{font.family.sans}", "fontWeight": 400, "fontSize": "16px", "lineHeight": 1.5}},
            "body-hk": {"$type": "typography", "$value": {"fontFamily": "{font.family.sans}", "fontWeight": 500, "fontSize": "17px", "lineHeight": 1.45}},
            "caption": {"$type": "typography", "$value": {"fontFamily": "{font.family.sans}", "fontWeight": 400, "fontSize": "12px", "lineHeight": 1.45}},
        },
        "space": {str(k): {"$type": "dimension", "$value": f"{k}px"} for k in (0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64)},
        "radius": {k: {"$type": "dimension", "$value": v} for k, v in
                   [("sm", "6px"), ("md", "8px"), ("lg", "12px"), ("xl", "16px"), ("pill", "999px"), ("phone", "36px")]},
        "size": {
            "target": {
                "min-desktop": {"$type": "dimension", "$value": "32px", "$description": "Chiều cao tối thiểu nút/ô trên máy tính quầy (WCAG 2.5.8 yêu cầu 24px)"},
                "min-touch": {"$type": "dimension", "$value": "44px", "$description": "Mọi màn hình điện thoại (lễ tân di động, sale, khách, chủ đầu tư)"},
                "min-hk": {"$type": "dimension", "$value": "48px", "$description": "Giao diện buồng phòng/bảo trì; nút chính 56px"},
            },
            "sidebar": {"$type": "dimension", "$value": "240px"},
            "drawer": {"$type": "dimension", "$value": "460px"},
            "modal-sm": {"$type": "dimension", "$value": "480px"},
            "modal-lg": {"$type": "dimension", "$value": "720px"},
            "rack-col": {"$type": "dimension", "$value": "72px"},
            "rack-row": {"$type": "dimension", "$value": "48px"},
        },
        "border": {"hairline": {"$type": "dimension", "$value": "1px"}, "focus": {"$type": "dimension", "$value": "2px"}, "accent": {"$type": "dimension", "$value": "4px"}},
        "shadow": {
            "light": {"sm": {"$type": "shadow", "$value": "0 1px 2px rgba(43,43,43,.06)"}, "lg": {"$type": "shadow", "$value": "0 1px 2px rgba(43,43,43,.06), 0 8px 24px rgba(43,43,43,.08)"}},
            "dark": {"sm": {"$type": "shadow", "$value": "0 1px 2px rgba(0,0,0,.3)"}, "lg": {"$type": "shadow", "$value": "0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.35)"}},
        },
        "motion": {
            "duration": {"fast": {"$type": "duration", "$value": "150ms"}, "base": {"$type": "duration", "$value": "200ms"}, "slow": {"$type": "duration", "$value": "280ms"}},
            "easing": {"standard": {"$type": "cubicBezier", "$value": [0.2, 0, 0, 1]}, "exit": {"$type": "cubicBezier", "$value": [0.4, 0, 1, 1]}},
            "$description": "prefers-reduced-motion: mọi duration = 0ms, không trượt/phóng",
        },
        "time": {
            "toast-min": {"$type": "duration", "$value": "6000ms", "$description": "Toast tự ẩn sau ≥ 6 giây, dừng khi rê chuột/focus; chỉ cho xác nhận thường"},
            "undo-window": {"$type": "duration", "$value": "10000ms", "$description": "Hoàn tác thao tác buồng phòng/đảo ngược được"},
            "skeleton-delay": {"$type": "duration", "$value": "300ms", "$description": "Chỉ hiện skeleton nếu tải lâu hơn 300ms"},
        },
        "breakpoint": {k: {"$type": "dimension", "$value": f"{v}px"} for k, v in [("phone", 360), ("phone-lg", 480), ("tablet", 768), ("desk", 1024), ("wide", 1280)]},
        "z": {k: {"$type": "number", "$value": v} for k, v in [("sticky", 10), ("drawer", 40), ("modal", 50), ("toast", 60)]},
        "status": {
            "booking": {
                "hold": {"bg": "surface", "fg": "ink", "border": "oak-ink dashed 2px", "icon": "hourglass", "pattern": "viền đứt"},
                "confirmed": {"bg": "bar-cf", "fg": "bar-cf-t", "icon": "check-circle", "pattern": "đặc"},
                "in_house": {"bg": "bar-in", "fg": "bar-in-t", "icon": "bed", "pattern": "đặc"},
                "checked_out": {"bg": "surface-2", "fg": "muted", "icon": "door-out", "pattern": "đặc nhạt"},
                "cancelled": {"bg": "-", "fg": "muted", "icon": "x-circle", "pattern": "không hiện trên rack; chip gạch ngang"},
                "no_show": {"bg": "-", "fg": "bad", "icon": "user-x", "pattern": "không hiện trên rack; chip"},
                "long_term": {"bg": "bar-long", "fg": "bar-long-t", "icon": "calendar-month", "pattern": "đặc + nhãn 'HĐ'"},
                "ooo_block": {"bg": "bad-bg", "fg": "bad", "icon": "lock", "pattern": "sọc chéo 45°"},
            },
            "room": {
                "VC": {"tone": "ok", "icon": "sparkle"}, "VI": {"tone": "ok", "icon": "shield-check"},
                "VD": {"tone": "warn", "icon": "broom"}, "CL": {"tone": "oak", "icon": "spray"},
                "OC": {"tone": "info", "icon": "user"}, "OD": {"tone": "warn", "icon": "user-broom"},
                "OOO": {"tone": "bad", "icon": "lock"},
            },
            "check": {"pass": {"tone": "ok", "icon": "check"}, "fail": {"tone": "bad", "icon": "x"}, "unknown": {"tone": "warn", "icon": "question"}},
        },
    }
    with open(os.path.join(ROOT, "tokens.json"), "w", encoding="utf-8") as f:
        json.dump(tokens, f, ensure_ascii=False, indent=2)
        f.write("\n")

    def css_block(pal):
        return "\n".join(f"  --{k}:{v};" for k, v in pal.items())
    css = f"""/* GENERATED from tokens.json (OTTIMO DS v0.3) – do not edit by hand */
:root{{
  color-scheme:light;
{css_block(light)}
  --shadow-sm:0 1px 2px rgba(43,43,43,.06);
  --shadow-lg:0 1px 2px rgba(43,43,43,.06),0 8px 24px rgba(43,43,43,.08);
  --serif:"Lora",Georgia,"Times New Roman",serif;
  --sans:"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --r-sm:6px;--r-md:8px;--r-lg:12px;--r-xl:16px;--r-pill:999px;
  --t-fast:150ms;--t-base:200ms;--t-slow:280ms;--ease:cubic-bezier(.2,0,0,1);
}}
@media (prefers-color-scheme: dark){{
  :root:not([data-theme="light"]){{
    color-scheme:dark;
{css_block(dark).replace('  --', '    --')}
    --shadow-sm:0 1px 2px rgba(0,0,0,.3);
    --shadow-lg:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.35);
  }}
}}
:root[data-theme="dark"]{{
  color-scheme:dark;
{css_block(dark)}
  --shadow-sm:0 1px 2px rgba(0,0,0,.3);
  --shadow-lg:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.35);
}}
@media (prefers-reduced-motion: reduce){{:root{{--t-fast:0ms;--t-base:0ms;--t-slow:0ms}}}}
"""
    with open(os.path.join(ROOT, "wireframes/assets/tokens.css"), "w", encoding="utf-8") as f:
        f.write(css)

    # markdown tables
    md = ["| Token | Sáng | Tối | Dùng cho | Round 0 (sáng / tối) |", "|---|---|---|---|---|"]
    for c in COLORS:
        chg = "" if (c[4] in ("-", c[1]) and c[5] in ("-", c[2])) else " **(đổi)**"
        r0 = "mới" if c[4] == "-" else f"{c[4]} / {c[5]}"
        md.append(f"| `--{c[0]}` | `{c[1]}` | `{c[2]}` | {c[3]} | {r0}{chg} |")
    md.append("")
    md.append("| Cặp (chữ/UI trên nền) | Vị trí dùng | Yêu cầu | Sáng | Tối |")
    md.append("|---|---|---|---|---|")
    for fg, bg, kind, where, res in rows:
        need = {"text": "≥ 4,5:1", "ui": "≥ 3:1", "large": "≥ 3:1", "info-only": "không áp dụng"}[kind]
        cells = []
        for r, ok in res:
            s = f"{r:.2f}".replace('.', ',') + ":1"
            cells.append(s + ("" if ok is None else (" ĐẠT" if ok else " **KHÔNG ĐẠT**")))
        md.append(f"| `--{fg}` / `--{bg}` | {where} | {need} | {cells[0]} | {cells[1]} |")
    with open(os.path.join(os.path.dirname(__file__), "contrast.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")
    print("fails:", fails)

if __name__ == "__main__":
    write_all()
