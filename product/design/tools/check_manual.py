#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kiểm bản HTML Sổ tay OTTIMO Desk bằng Chrome headless (giao thức DevTools, chỉ thư viện chuẩn).

Chạy từ gốc repo, sau build_manual.py:
    python3 -I product/design/tools/check_manual.py --out-dir rounds/round-03/outputs/UXD

Làm gì:
  - Giả lập điện thoại 390 × 844 (mobile, DPR 2) và máy tính 1440 × 900: đo tràn ngang
    (scrollWidth > clientWidth, không tính bảng/thanh chip vốn được cuộn ngang).
  - Chụp ảnh kiểm: manual-check-390.png, manual-check-1440.png (+ vài ảnh phụ với --all).
  - --pdf: in thử A4 toàn bộ và "bộ cho bộ phận" Lễ tân (ch-2) ra PDF để soát CSS in.
Biến môi trường CHROME = đường dẫn Chrome nếu không ở chỗ mặc định của macOS.
Thoát mã 1 nếu có tràn ngang.
"""
import argparse
import base64
import json
import os
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[3]
HTML = ROOT / "product" / "docs" / "manual" / "ottimo-manual-v1.0.html"
CHROME_CANDIDATES = [
    os.environ.get("CHROME", ""),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    shutil.which("google-chrome") or "",
    shutil.which("chromium") or "",
]


class WS:
    """WebSocket tối giản (client, text frame) cho DevTools."""

    def __init__(self, url):
        u = urlparse(url)
        self.s = socket.create_connection((u.hostname, u.port), timeout=60)
        key = base64.b64encode(os.urandom(16)).decode()
        req = ("GET %s HTTP/1.1\r\nHost: %s:%d\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
               "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n") % (u.path, u.hostname, u.port, key)
        self.s.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            chunk = self.s.recv(4096)
            if not chunk:
                raise RuntimeError("WebSocket handshake failed")
            buf += chunk
        self.rest = buf.split(b"\r\n\r\n", 1)[1]
        self.next_id = 0

    def _read(self, n):
        while len(self.rest) < n:
            chunk = self.s.recv(1 << 20)
            if not chunk:
                raise RuntimeError("WebSocket closed")
            self.rest += chunk
        out, self.rest = self.rest[:n], self.rest[n:]
        return out

    def send(self, text):
        data = text.encode()
        head = bytearray([0x81])
        n = len(data)
        if n < 126:
            head.append(0x80 | n)
        elif n < 65536:
            head.append(0x80 | 126)
            head += struct.pack(">H", n)
        else:
            head.append(0x80 | 127)
            head += struct.pack(">Q", n)
        mask = os.urandom(4)
        head += mask
        self.s.sendall(bytes(head) + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def recv(self):
        msg = b""
        while True:
            b1, b2 = self._read(2)
            n = b2 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._read(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._read(8))[0]
            payload = self._read(n)
            if b1 & 0x0F == 0x9:  # ping
                continue
            msg += payload
            if b1 & 0x80:
                return msg.decode("utf-8")

    def call(self, method, **params):
        self.next_id += 1
        my = self.next_id
        self.send(json.dumps({"id": my, "method": method, "params": params}))
        while True:
            m = json.loads(self.recv())
            if m.get("id") == my:
                if "error" in m:
                    raise RuntimeError("%s: %s" % (method, m["error"]))
                return m.get("result", {})


def js(ws, expr, await_promise=False):
    r = ws.call("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=await_promise)
    return r.get("result", {}).get("value")


def load(ws, url, w, h, mobile, dpr):
    ws.call("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=dpr, mobile=mobile)
    ws.call("Page.navigate", url=url)
    for _ in range(100):
        time.sleep(0.15)
        if js(ws, "document.readyState") == "complete":
            break
    js(ws, "document.fonts.ready.then(function(){return 1})", await_promise=True)
    js(ws, "document.documentElement.style.scrollBehavior='auto'")
    time.sleep(0.3)


def overflow(ws):
    return js(ws, r"""(function(){var w=document.documentElement.clientWidth,o=[];
      document.querySelectorAll('body *').forEach(function(e){if(e.closest('.table-wrap,.chips,.sidebar'))return;
        var r=e.getBoundingClientRect();if(r.width&&r.right>w+1)o.push(e.tagName.toLowerCase()+'.'+e.className+' → '+Math.round(r.right));});
      return {client:w,scroll:document.documentElement.scrollWidth,over:o.slice(0,10)};})()""")


def scroll_to(ws, el_id, offset=0):
    js(ws, "(function(){var e=document.getElementById(%s);if(e){e.scrollIntoView();window.scrollBy(0,%d);}})()"
       % (json.dumps(el_id), offset))
    time.sleep(0.4)


def shot(ws, path):
    data = ws.call("Page.captureScreenshot", format="png")["data"]
    Path(path).write_bytes(base64.b64decode(data))
    print("  ảnh: %s" % path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", type=Path, default=HTML)
    ap.add_argument("--out-dir", type=Path, required=True)
    ap.add_argument("--all", action="store_true", help="chụp thêm ảnh phụ")
    ap.add_argument("--pdf", action="store_true", help="in thử PDF A4")
    a = ap.parse_args()
    chrome = next((c for c in CHROME_CANDIDATES if c and Path(c).exists()), None)
    if not chrome:
        print("Không thấy Chrome. Đặt biến CHROME.", file=sys.stderr)
        return 2
    a.out_dir.mkdir(parents=True, exist_ok=True)
    url = a.html.resolve().as_uri()
    prof = tempfile.mkdtemp(prefix="ottimo-manual-")
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
        target = json.loads(urllib.request.urlopen(req, timeout=10).read())
        ws = WS(target["webSocketDebuggerUrl"])
        ws.call("Page.enable")
        ws.call("Runtime.enable")

        for (w, h, mob, dpr, name, anchor, off) in [
            (390, 844, True, 2, "manual-check-390.png", "ch-2", 0),
            (1440, 900, False, 1, "manual-check-1440.png", "s-2-10", 0),
        ]:
            load(ws, url, w, h, mob, dpr)
            ov = overflow(ws)
            status = "OK" if ov["scroll"] <= ov["client"] and not ov["over"] else "TRÀN"
            bad += status != "OK"
            print("%d px: scrollWidth %s / clientWidth %s – %s %s" % (w, ov["scroll"], ov["client"], status,
                                                                   "; ".join(ov["over"])))
            scroll_to(ws, anchor, off)
            shot(ws, a.out_dir / name)
            if a.all:
                for tag, anc, o2 in [("cover", "cover", 0), ("toc", "muc-luc", 0), ("table", "s-5-3", 0),
                                     ("callout", "s-1-14", 0), ("shots", "s-1-2", 0),
                                     ("chapter", "ch-2", 0), ("note", "s-1-3", 700), ("nested", "s-2-10", 900)]:
                    scroll_to(ws, anc, o2)
                    shot(ws, a.out_dir / ("extra-%d-%s.png" % (w, tag)))

        if a.pdf:
            load(ws, url, 1200, 900, False, 1)
            js(ws, "window.dispatchEvent(new Event('beforeprint'))")
            pdf = ws.call("Page.printToPDF", preferCSSPageSize=True, printBackground=True)["data"]
            (a.out_dir / "manual-print-all.pdf").write_bytes(base64.b64decode(pdf))
            print("  pdf: %s" % (a.out_dir / "manual-print-all.pdf"))
            js(ws, """(function(){var keep={cover:1,'ch-2':1};
              (document.getElementById('noi-dung').getAttribute('data-common')||'').split(' ').forEach(function(i){keep[i]=1});
              document.querySelectorAll('.content > section').forEach(function(s){if(!keep[s.id])s.classList.add('print-hide')});})()""")
            pdf = ws.call("Page.printToPDF", preferCSSPageSize=True, printBackground=True)["data"]
            (a.out_dir / "manual-print-le-tan.pdf").write_bytes(base64.b64decode(pdf))
            print("  pdf: %s" % (a.out_dir / "manual-print-le-tan.pdf"))
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        shutil.rmtree(prof, ignore_errors=True)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
