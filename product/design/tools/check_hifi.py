"""Kiểm hi-fi HTML (UXD, R2): cú pháp + tham chiếu a11y + chuỗi VI/EN.

Chạy:  python3 product/design/tools/check_hifi.py [--missing]
- Cú pháp: thẻ mở/đóng cân bằng (trừ thẻ rỗng), không trùng id trong một trang.
- a11y: label[for], aria-labelledby, aria-describedby, aria-controls, data-open trỏ tới id có thật.
- Chuỗi: mọi data-i18n / data-i18n-ph / data-i18n-label có trong copy/strings-vi.json và strings-en.json;
  chữ tiếng Việt viết sẵn trong HTML phải đúng bằng chuỗi VI sau khi điền tham số (data-i18n-args).
- --missing: in danh sách key chưa có (kèm chữ VI trong HTML) để bổ sung vào gen_strings.py.
Thoát mã 1 nếu có lỗi.
"""
import glob, html, json, os, re, sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HIFI = os.path.join(ROOT, "hifi")
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr", "use", "path", "circle", "rect"}
VI = json.load(open(os.path.join(ROOT, "copy/strings-vi.json"), encoding="utf-8"))
EN = json.load(open(os.path.join(ROOT, "copy/strings-en.json"), encoding="utf-8"))


def fmt(s, a):
    return re.sub(r"\{(\w+)\}", lambda m: str(a[m.group(1)]) if m.group(1) in a else m.group(0), s)


def norm(s):
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.errors, self.ids, self.refs = [], [], {}, []
        self.i18n = []  # (key, args, text, line)
        self.capture = []  # stack of [key, args, depth, textparts, line]
        self.keys_other = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        line = self.getpos()[0]
        if tag not in VOID:
            self.stack.append((tag, line))
        if "id" in a:
            if a["id"] in self.ids:
                self.errors.append(f"L{line}: trùng id '{a['id']}' (đã có ở L{self.ids[a['id']]})")
            self.ids[a["id"]] = line
        for attr in ("aria-labelledby", "aria-describedby", "aria-controls"):
            if a.get(attr):
                for r in a[attr].split():
                    self.refs.append((attr, r, line))
        if tag == "label" and a.get("for"):
            self.refs.append(("for", a["for"], line))
        if a.get("data-open"):
            self.refs.append(("data-open", a["data-open"].lstrip("#"), line))
        for attr in ("data-i18n-ph", "data-i18n-label"):
            if a.get(attr):
                self.keys_other.append((a[attr], line))
        if "data-i18n" in a and tag not in VOID:
            try:
                args = json.loads(a.get("data-i18n-args") or "{}")
            except json.JSONDecodeError:
                self.errors.append(f"L{line}: data-i18n-args không phải JSON"); args = {}
            self.capture.append([a["data-i18n"], args, len(self.stack), [], line])

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append(f"L{self.getpos()[0]}: thẻ đóng </{tag}> thừa"); return
        t, line = self.stack[-1]
        if t != tag:
            self.errors.append(f"L{self.getpos()[0]}: đóng </{tag}> nhưng đang mở <{t}> (L{line})")
            # try to recover
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i][0] == tag:
                    del self.stack[i:]; break
        else:
            self.stack.pop()
        while self.capture and self.capture[-1][2] > len(self.stack):
            k, args, _, parts, l = self.capture.pop()
            self.i18n.append((k, args, norm("".join(parts)), l))

    def handle_data(self, data):
        for c in self.capture:
            c[3].append(data)


def main():
    show_missing = "--missing" in sys.argv
    total_err, missing = 0, {}
    files = sorted(glob.glob(os.path.join(HIFI, "*.html")))
    for f in files:
        src = open(f, encoding="utf-8").read()
        p = P(); p.feed(src); p.close()
        errs = list(p.errors)
        for t, line in p.stack:
            if t not in ("html", "body"):
                errs.append(f"L{line}: <{t}> chưa đóng")
        for attr, r, line in p.refs:
            if r not in p.ids:
                errs.append(f"L{line}: {attr} trỏ tới id '{r}' không tồn tại")
        if not re.search(r"<title>[^<]+</title>", src):
            errs.append("thiếu <title>")
        if not re.search(r'<html lang="vi"', src):
            errs.append("thiếu <html lang>")
        for k, args, text, line in p.i18n:
            if k not in VI:
                missing.setdefault(k, (text, args, os.path.basename(f), line)); continue
            if k not in EN:
                errs.append(f"L{line}: key '{k}' thiếu EN")
            exp = norm(fmt(VI[k], args))
            if text and exp != text:
                errs.append(f"L{line}: '{k}' chữ trong HTML khác chuỗi VI\n      HTML: {text}\n      VI  : {exp}")
            left = re.findall(r"\{(\w+)\}", fmt(VI[k], args))
            if left:
                errs.append(f"L{line}: '{k}' thiếu tham số {left}")
        for k, line in p.keys_other:
            if k not in VI:
                missing.setdefault(k, ("(placeholder/aria-label)", {}, os.path.basename(f), line))
        name = os.path.basename(f)
        if errs:
            print(f"✗ {name}: {len(errs)} lỗi"); [print("   ", e) for e in errs]
        else:
            print(f"✓ {name}: {len(p.i18n)} chuỗi, {len(p.ids)} id")
        total_err += len(errs)
    if missing:
        print(f"\n{len(missing)} key chưa có trong strings-vi.json")
        if show_missing:
            for k, (text, args, f, line) in sorted(missing.items()):
                print(f"  {k}\t{text}\t{json.dumps(args, ensure_ascii=False)}\t{f}:{line}")
    sys.exit(1 if (total_err or missing) else 0)


if __name__ == "__main__":
    main()
