#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dựng lại toàn bộ HTML sổ tay + bộ hướng dẫn + sổ vận hành và kiểm, bằng một lệnh (UXD, Round 4–5).

Chạy từ gốc repo:
    python3 -I product/design/tools/rebuild_manual_html.py --out-dir rounds/round-04/outputs/UXD --tag manual-1.8

Làm theo thứ tự:
  1. build_manual.py  -> product/docs/manual/ottimo-manual-v1.0.html
     build_so_van_hanh.py -> product/docs/so-van-hanh.html (Round 5)
  2. build_guides.py --check-dir <tạm>  -> product/docs/manual/guides/html/*.html (+ đo tràn 390/1440 từng tệp)
  3. check_manual.py --out-dir <tạm>    -> đo tràn sổ tay 390/1440 (và sổ vận hành)
  4. Soát: ảnh nhúng chỉ lấy từ product/docs/manual/img/ (khớp từng byte), các mã ảnh --codes có ảnh thật,
     cụm --phrase có trong sổ tay và tệp 01, không còn link "mục 0.3" + chữ cái lẻ ngoài link;
     mọi tệp nhúng font (@font-face base64), không trỏ Google Fonts (v1.0.4 P4-21);
     khối **[Chờ xác nhận …]** không thành khung bước làm ở tệp nào (Round 5, khối Wi-Fi trên Desk).
  5. Chụp ảnh kiểm: <out-dir>/<tag>-check-1440.png (sổ tay, tại ảnh --shot-1440)
                    <out-dir>/<tag>-check-390.png  (sổ tay, tại ảnh --shot-390)
                    <out-dir>/<tag>-sovh-check-1440.png, -390.png (sổ vận hành, mục 1)
     Ảnh phụ (--extra-dir) cho từng mã trong --codes, ở tệp có mã đó.
     Chrome chạy ở chế độ MẤT MẠNG (Network.emulateNetworkConditions offline): mỗi lần chụp kiểm thêm
     Lora 500/400 nghiêng, Be Vietnam Pro 400/600, JetBrains Mono 400 đã nạp từ font nhúng.
Thoát mã 1 nếu có bước nào lỗi hoặc tràn ngang. Không sửa Markdown, không sửa ảnh. Chỉ thư viện chuẩn + Chrome.
"""
import argparse
import base64
import hashlib
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
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE))
import check_manual as cm  # noqa: E402

MANUAL = ROOT / "product" / "docs" / "manual" / "ottimo-manual-v1.0.html"
GUIDES = ROOT / "product" / "docs" / "manual" / "guides" / "html"
SOVH = ROOT / "product" / "docs" / "so-van-hanh.html"
IMG_DIR = ROOT / "product" / "docs" / "manual" / "img"
DEFAULT_CODES = "C0-06,G1-01,C1-07,C0-12,C0-13,C1-22"


def run(args):
    print("$ " + " ".join(str(a) for a in args), flush=True)
    r = subprocess.run([sys.executable, "-I"] + [str(a) for a in args], cwd=ROOT, capture_output=True, text=True)
    out = r.stdout + r.stderr
    print("\n".join("  " + ln for ln in out.splitlines() if "ảnh:" not in ln))
    return r.returncode, out


def html_files():
    return [MANUAL] + sorted(GUIDES.glob("*.html")) + [SOVH]


def audit(codes, phrase):
    bad = []
    known = {hashlib.sha1(p.read_bytes()).hexdigest() for p in IMG_DIR.iterdir() if p.is_file()}
    found = {c: [] for c in codes}
    for f in html_files():
        t = f.read_text(encoding="utf-8")
        srcs = re.findall(r'src="data:image/[a-z+]+;base64,([^"]+)"', t)
        unknown = sum(1 for b in srcs if hashlib.sha1(base64.b64decode(b)).hexdigest() not in known)
        ext = re.findall(r'<img[^>]+src="(?!data:)([^"]+)"', t)
        if unknown or ext:
            bad.append("%s: %d ảnh không có trong img/, %d ảnh ngoài" % (f.name, unknown, len(ext)))
        lite = re.sub(r"data:[^\"')]+", "", t)
        if "fonts.googleapis.com" in lite or not re.search(r"@font-face\{[^}]*data:font/woff2;base64,", t):
            bad.append("%s: font chưa nhúng (đang trỏ Google Fonts – cần `pnpm install` cho @fontsource)" % f.name)
        for c in codes:
            if re.search(r'<figure class="shot [a-z]+ has-img"><button[^>]*ảnh %s"' % re.escape(c), lite):
                found[c].append(f.name)
        dang = re.findall(r'#s-[\d-]+">(?:mục )?[\d.]+</a>[a-z](?![^\W\d_])', lite)
        live = [x for x in re.findall(r'<aside class="callout[^>]*>.*?</aside>', lite, re.S) if "[Chờ xác nhận" in x]
        if live:
            bad.append("%s: %d khối [Chờ xác nhận] đang hiện thành khung" % (f.name, len(live)))
        if dang:
            bad.append("%s: %d link mục bị cắt chữ cái" % (f.name, len(dang)))
        print("  %-30s ảnh %3d · '%s' x%d" % (f.name, len(srcs), phrase, lite.count(phrase)))
    for c, fs in found.items():
        print("  %s có ảnh ở: %s" % (c, ", ".join(fs) or "KHÔNG CÓ"))
        if not fs:
            bad.append("mã %s không có ảnh" % c)
    for f in (MANUAL, GUIDES / "01-chu-dau-tu-quan-ly.html"):
        if phrase not in f.read_text(encoding="utf-8"):
            bad.append("%s thiếu '%s'" % (f.name, phrase))
    return bad, found


# Mặt chữ phải nạp được khi mất mạng: [CSS font, chữ mẫu có dấu]. Kết quả 0 = rơi về font hệ thống.
FONT_PROBES = [["500 32px Lora", "Sổ tay Desk"], ["italic 400 20px Lora", "Desk đúng hơn"],
               ["400 16px 'Be Vietnam Pro'", "Đặt lại xác thực"], ["600 16px 'Be Vietnam Pro'", "Ưu tiên"],
               ["400 14px 'JetBrains Mono'", "0.3a"]]
FONT_JS = ("Promise.all(%s.map(function(x){return document.fonts.load(x[0],x[1]).then("
           "function(l){return [x[0],l.length]},function(){return [x[0],0]})}))" % json.dumps(FONT_PROBES))


def shoot(jobs):
    chrome = next((c for c in cm.CHROME_CANDIDATES if c and Path(c).exists()), None)
    if not chrome:
        return ["không thấy Chrome (đặt biến CHROME)"]
    prof = tempfile.mkdtemp(prefix="ottimo-rebuild-")
    p = subprocess.Popen([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
                          "--remote-debugging-port=0", "--user-data-dir=" + prof, "about:blank"],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    bad = []
    try:
        pf = Path(prof) / "DevToolsActivePort"
        for _ in range(100):
            if pf.exists() and pf.read_text().strip():
                break
            time.sleep(0.1)
        port = int(pf.read_text().split()[0])
        req = urllib.request.Request("http://127.0.0.1:%d/json/new?about:blank" % port, method="PUT")
        ws = cm.WS(json.loads(urllib.request.urlopen(req, timeout=10).read())["webSocketDebuggerUrl"])
        ws.call("Page.enable")
        ws.call("Runtime.enable")
        ws.call("Network.enable")
        ws.call("Network.emulateNetworkConditions", offline=True, latency=0,
                downloadThroughput=-1, uploadThroughput=-1)
        for f, w, code, off, out in jobs:
            mob = w < 768
            cm.load(ws, f.resolve().as_uri(), w, 844 if mob else 900, mob, 2 if mob else 1)
            ov = cm.overflow(ws)
            if code.startswith("#"):  # điểm chụp theo id (tệp không có ảnh: sổ vận hành)
                ok = cm.js(ws, "(function(){var e=document.getElementById(%s);if(!e)return false;"
                               "e.scrollIntoView();window.scrollBy(0,%d);return true})()" % (json.dumps(code[1:]), off))
            else:
                ok = cm.js(ws, """(function(){var b=document.querySelector('[aria-label$="ảnh %s"]');if(!b)return false;
              var fg=b.closest('figure');fg.querySelectorAll('img').forEach(function(i){i.loading='eager'});
              fg.scrollIntoView();window.scrollBy(0,%d);return true})()""" % (code, off))
            time.sleep(1.0)
            cm.shot(ws, out)
            st = "OK" if ov["scroll"] <= ov["client"] and not ov["over"] else "TRÀN"
            print("  %s %d px tại %s: scrollWidth %s / %s – %s" % (f.name, w, code, ov["scroll"], ov["client"], st))
            if st != "OK" or not ok:
                bad.append("%s %d px %s: %s" % (f.name, w, code, st if ok else "không thấy điểm chụp"))
            fonts = cm.js(ws, FONT_JS, await_promise=True) or []
            miss = [n for n, k in fonts if not k]
            print("  %s %d px mất mạng – font nhúng: %s" % (
                f.name, w, "OK (%d mặt)" % len(fonts) if fonts and not miss else "THIẾU " + ", ".join(miss)))
            if not fonts or miss:
                bad.append("%s %d px mất mạng: thiếu font %s" % (f.name, w, ", ".join(miss) or "?"))
    finally:
        p.terminate()
        shutil.rmtree(prof, ignore_errors=True)
    return bad


def main():
    ap = argparse.ArgumentParser(description="Dựng lại HTML sổ tay + bộ hướng dẫn và kiểm 390/1440.")
    ap.add_argument("--out-dir", type=Path, required=True, help="nơi lưu 2 ảnh kiểm chính")
    ap.add_argument("--tag", default="manual", help="tiền tố tên ảnh kiểm, ví dụ manual-1.8")
    ap.add_argument("--codes", default=DEFAULT_CODES, help="mã ảnh phải có (phẩy)")
    ap.add_argument("--phrase", default="Bảo mật tài khoản", help="cụm phải có trong sổ tay và tệp 01")
    ap.add_argument("--shot-1440", default="C0-06", help="mã ảnh làm điểm chụp 1440")
    ap.add_argument("--shot-390", default="C0-12", help="mã ảnh làm điểm chụp 390")
    ap.add_argument("--extra-dir", type=Path, help="chụp thêm ảnh phụ cho từng mã vào thư mục này")
    a = ap.parse_args()
    codes = [c.strip() for c in a.codes.split(",") if c.strip()]
    out_dir = a.out_dir if a.out_dir.is_absolute() else ROOT / a.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="ottimo-check-"))
    bad = []
    try:
        rc, out1 = run([HERE / "build_manual.py"])
        bad += ["build_manual.py mã %d" % rc] if rc else []
        rc, out3 = run([HERE / "build_so_van_hanh.py"])
        bad += ["build_so_van_hanh.py mã %d" % rc] if rc else []
        rc, out = run([HERE / "build_guides.py", "--check-dir", tmp / "guides"])
        bad += ["build_guides.py mã %d" % rc] if rc else []
        held = [ln.strip() for ln in (out1 + out + out3).splitlines() if "Không dựng khối chờ xác nhận" in ln]
        print("$ khối chờ xác nhận không dựng: %d" % len(held))
        bad += ["bộ hướng dẫn: " + ln.strip() for ln in out.splitlines() if "TRÀN" in ln]
        rc, _ = run([HERE / "check_manual.py", "--out-dir", tmp / "manual"])
        bad += ["check_manual.py mã %d (tràn ngang?)" % rc] if rc else []
        rc, _ = run([HERE / "check_manual.py", "--html", SOVH, "--out-dir", tmp / "sovh"])
        bad += ["check_manual.py sổ vận hành mã %d (tràn ngang?)" % rc] if rc else []
        print("$ soát ảnh, cụm chữ, link mục")
        b2, found = audit(codes, a.phrase)
        bad += b2
        print("$ chụp ảnh kiểm")
        jobs = [(MANUAL, 1440, a.shot_1440, -90, out_dir / ("%s-check-1440.png" % a.tag)),
                (MANUAL, 390, a.shot_390, -60, out_dir / ("%s-check-390.png" % a.tag)),
                (SOVH, 1440, "#ch-1", -20, out_dir / ("%s-sovh-check-1440.png" % a.tag)),
                (SOVH, 390, "#s-1-1", -60, out_dir / ("%s-sovh-check-390.png" % a.tag))]
        if a.extra_dir:
            a.extra_dir.mkdir(parents=True, exist_ok=True)
            for c, fs in found.items():
                for name in fs[:2]:
                    f = MANUAL if name == MANUAL.name else GUIDES / name
                    for w in (1440, 390):
                        jobs.append((f, w, c, -120, a.extra_dir / ("%s-%s-%d.png" % (f.stem[:2], c, w))))
        bad += shoot(jobs)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print("\nKẾT QUẢ: " + ("ĐẠT" if not bad else "LỖI\n  - " + "\n  - ".join(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
