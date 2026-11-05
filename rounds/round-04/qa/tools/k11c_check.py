#!/usr/bin/env python3
"""K11 (c) – read-only string check of the served guest-web bundle (runbook v1.0.4 K11 (c), plan QA lượt 2 S16).

GET only: <base>/ (index.html) and every same-origin /assets/*.js it references, followed recursively.
Nothing is posted, no link/token is used, no guest data is read.

The approved text is the group `v1.0.4 P4-42 privacy-2026-10-v2` of design/tools/gen_strings.py, taken from
design/copy/strings-{vi,en,ru}.json of the cut (SHA_V104). For every key × language the script looks for the
string in the bundle in the encodings a bundler may emit (raw, JSON-escaped, \\uXXXX-escaped, inside a
JSON.parse('…') literal). It prints counts and key names only, never the bundle.

Usage (repo root, files of the cut checked out):
  python3 -I rounds/round-04/qa/tools/k11c_check.py <guest-web-base-url> product
Output: one line `files=… keys=11 found=N/33 v2_marker=… v1_marker=…`, then `MISSING <key>:<lang>` per miss.
Exit 0 = every key found in all 3 languages, `privacy-2026-10-v2` present, `privacy-2026-10-v1` absent.
Tried on the local stack of SHA_V104 0d11db20 (05/11): found=33/33, exit 0. Negative control (one ru string
edited in the copy JSON): 32/33, `MISSING gw.notice_rights:ru`, exit 1.
"""
import json
import re
import sys
import urllib.parse
import urllib.request

GROUP = 'v1.0.4 P4-42 privacy-2026-10-v2'
LANGS = ('vi', 'en', 'ru')


def keys_of_group(gen_path: str) -> list[str]:
    src = open(gen_path, encoding='utf-8').read()
    start = src.index(f'g("{GROUP}", [')
    end = src.index('\n])', start)
    return re.findall(r'^\s{4}\("([a-z0-9_.]+)",', src[start:end], flags=re.M)


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={'User-Agent': 'ottimo-qa-k11c/1 (read-only)'})
    with urllib.request.urlopen(req, timeout=20) as r:  # noqa: S310 – fixed https/http base given by QA
        return r.read().decode('utf-8', 'replace')


def bundle(base: str) -> tuple[str, int]:
    base = base.rstrip('/') + '/'
    origin = '{0.scheme}://{0.netloc}'.format(urllib.parse.urlsplit(base))
    seen, todo, texts = set(), [base], []
    while todo:
        url = todo.pop()
        if url in seen:
            continue
        seen.add(url)
        body = fetch(url)
        texts.append(body)
        for ref in re.findall(r'["\'(]((?:\.{0,2}/)?(?:[\w./-]*/)?assets/[\w.-]+\.js)', body):
            nxt = urllib.parse.urljoin(url, ref)
            if nxt.startswith(origin) and nxt not in seen:
                todo.append(nxt)
    return '\n'.join(texts), len(seen)


def encodings(s: str) -> set[str]:
    j = json.dumps(s, ensure_ascii=False)[1:-1]
    a = json.dumps(s, ensure_ascii=True)[1:-1]
    forms = {s, j, a, a.lower()}
    # JSON.parse('…'): JSON escapes, then backslashes doubled and single quotes escaped.
    forms |= {f.replace('\\', '\\\\').replace("'", "\\'") for f in (j, a)}
    return forms


def main() -> int:
    if len(sys.argv) != 3:
        print('usage: k11c_check.py <guest-web-base-url> <repo>/product', file=sys.stderr)
        return 2
    base, product = sys.argv[1], sys.argv[2].rstrip('/')
    keys = keys_of_group(f'{product}/design/tools/gen_strings.py')
    copy = {lg: json.load(open(f'{product}/design/copy/strings-{lg}.json', encoding='utf-8')) for lg in LANGS}
    text, nfiles = bundle(base)
    ok, missing = 0, []
    for k in keys:
        for lg in LANGS:
            s = copy[lg].get(k)
            if s and any(f in text for f in encodings(s)):
                ok += 1
            else:
                missing.append(f'{k}:{lg}')
    v2 = 'privacy-2026-10-v2' in text
    v1 = 'privacy-2026-10-v1' in text
    total = len(keys) * len(LANGS)
    print(f'files={nfiles} keys={len(keys)} found={ok}/{total} v2_marker={v2} v1_marker={v1}')
    for m in missing:
        print('MISSING', m)
    return 0 if (ok == total and v2 and not v1 and len(keys) == 11) else 1


if __name__ == '__main__':
    sys.exit(main())
