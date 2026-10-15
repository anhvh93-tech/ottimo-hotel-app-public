#!/usr/bin/env python3
"""Generate product/docs/qa/traceability.md (QA, Round 1).

Reads (no third-party packages needed):
  03-backlog/backlog.md                       -> Must R2 stories + acceptance criteria (section 4)
  product/tests/test-cases/r1-main-flows.md   -> test cases (table rows starting with "| TC-")
  product/docs/api/openapi.yaml               -> operationId + x-stories
  product/docs/business-rules.md              -> BR catalogue
  product/docs/baseline-issues-triage.md      -> BL 8.2 #1..30 triage status
  product/design/wireframes/0*.html           -> US references in each page header
  product/docs/state-machines.md              -> transition tables of SM-01..SM-15 (column "#" B1, O1, K1, A1...;
                                                 machines without codes are keyed by "from→to")
  product/docs/rbac-matrix.json (preferred, if BA exports it) or product/docs/rbac-matrix.md
                                              -> source of truth for permissions (sections 3, 4, 6)

Round 1 step 4 additions (QA responses FB-R1-BA-QA-02/03/04, FB-R1-PO-QA-03/07):
  * section 7  "State transition -> TC" with EMPTY cells (TC column "Quy tắc" cites "SM-xx <code>" or
    "SM-xx from→to"; bare B/O/W/Q codes are accepted, R/K/T/A codes need the "SM-xx" prefix because they
    clash with round numbers, ERD constraints K1-K10, SEC T01-T18 and RBAC A01-A107)
  * section 8  static RBAC check: rbac-matrix (truth) vs OpenAPI x-rbac/x-roles/x-scope and Dxx vs x-visible-to
  * tags in a TC row: [BLOCKED: ...], [UNDECIDED: ...] -> not counted as "runnable in R2 with a fixed oracle";
    [GIẢ ĐỊNH QA ...] -> counted but listed
  * priority cell "Cao (S)" = smoke subset run on every PR
  * column "ESC" per story = ESC-xxx cited in its AC and TCs

Usage (from repo root):  python3 product/tests/tools/gen_traceability.py [--out PATH] [--strict]
  --out     write the matrix somewhere else (dry run); default product/docs/qa/traceability.md
  --strict  exit 1 when the RBAC static check finds a role that OpenAPI grants but rbac-matrix denies (CI gate)
"""
from __future__ import annotations

import datetime as _dt
import glob
import html
import os
import re
import json
import sys
from collections import Counter, OrderedDict, defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)  # noqa: E731

BACKLOG = P('03-backlog', 'backlog.md')
TCFILE = P('product', 'tests', 'test-cases', 'r1-main-flows.md')
OPENAPI = P('product', 'docs', 'api', 'openapi.yaml')
BRFILE = P('product', 'docs', 'business-rules.md')
TRIAGE = P('product', 'docs', 'baseline-issues-triage.md')
WF_GLOB = P('product', 'design', 'wireframes', '0*.html')
SMFILE = P('product', 'docs', 'state-machines.md')
RBAC_MD = P('product', 'docs', 'rbac-matrix.md')
RBAC_JSON = P('product', 'docs', 'rbac-matrix.json')
OUT = P('product', 'docs', 'qa', 'traceability.md')

ROLE_CODES = OrderedDict([('OWN', 'owner'), ('MGR', 'manager'), ('FDL', 'front_desk_lead'), ('FD', 'front_desk'),
                          ('HK', 'housekeeping'), ('MT', 'maintenance'), ('SAL', 'sales_staff'),
                          ('CTV', 'collaborator'), ('GST', 'guest')])
TAG_RE = re.compile(r'\[(BLOCKED|UNDECIDED|GIẢ ĐỊNH QA)[^\]]*\]')

DASH = '[–—…-]'  # en dash, em dash, ellipsis, hyphen


def read(path: str) -> str:
    with open(path, encoding='utf-8') as f:
        return f.read()


# ---------------------------------------------------------------- BR refs
def expand_br(text: str) -> set[str]:
    """BR-421–423, BR-501…504, BR-602/603, BR-602/BR-603, BR-123 -> set of 'BR-xxx'."""
    out: set[str] = set()
    for m in re.finditer(r'BR-(\d{3})(?:\s*' + DASH + r'\s*(?:BR-)?(\d{3}))?((?:\s*/\s*(?:BR-)?\d{3})*)', text):
        a = int(m.group(1))
        out.add(f'BR-{a:03d}')
        if m.group(2):
            b = int(m.group(2))
            if a < b <= a + 30:
                for n in range(a, b + 1):
                    out.add(f'BR-{n:03d}')
        for extra in re.findall(r'\d{3}', m.group(3) or ''):
            out.add(f'BR-{extra}')
    return out


def expand_bl(text: str) -> set[int]:
    out: set[int] = set()
    for m in re.finditer(r'BL(?: 8\.2)? #(\d+)((?:\s*,\s*#?\d+)*)', text):
        out.add(int(m.group(1)))
        for extra in re.findall(r'\d+', m.group(2) or ''):
            out.add(int(extra))
    return out


# ---------------------------------------------------------------- backlog
def parse_backlog():
    t = read(BACKLOG)
    sec3 = t[t.index('## 3. User story'):t.index('## 4. Ti')]
    stories = OrderedDict()
    for line in sec3.splitlines():
        m = re.match(r'^\|\s*(US-\d{3})\s*\|(.*?)\|\s*(Must|Should|Could|Won\'t)\s*\|\s*(R\d\+?)\s*\|', line)
        if m:
            stories[m.group(1)] = {'moscow': m.group(3), 'round': m.group(4), 'text': m.group(2).strip()}
    sec4 = t[t.index('## 4. Ti'):t.index('## 5. Truy')]
    acs: dict[str, OrderedDict] = {}
    titles: dict[str, str] = {}
    for block in re.split(r'^#### ', sec4, flags=re.M)[1:]:
        head = block.splitlines()[0]
        sid = head.split()[0]
        titles[sid] = head.split('–', 1)[1].strip() if '–' in head else head
        acs[sid] = OrderedDict()
        for m in re.finditer(r'^- (AC\d+): (.*)$', block, flags=re.M):
            acs[sid][m.group(1)] = m.group(2)
    return stories, acs, titles, t


# ---------------------------------------------------------------- test cases
def parse_tcs():
    rows = []
    for line in read(TCFILE).splitlines():
        if not line.startswith('| TC-'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) != 9:
            print(f'WARN: {cells[0]} has {len(cells)} columns (expected 9)', file=sys.stderr)
            continue
        tc, storyac, rules, layer, prio, pre, steps, expect, eps = cells
        refs = []
        for m in re.finditer(r'(US-\d{3})/(AC\d+(?:\s*,\s*AC\d+)*|–|-)', storyac):
            sid = m.group(1)
            if m.group(2) in ('–', '-'):
                refs.append((sid, None))
            else:
                for ac in re.findall(r'AC\d+', m.group(2)):
                    refs.append((sid, ac))
        endpoints = [e.strip() for e in eps.split(',') if e.strip() and e.strip() not in ('—', '–', '-', '(mọi operation)')]
        tags = [m.group(0) for m in TAG_RE.finditer(line)]
        rows.append({
            'tc': tc, 'refs': refs, 'rules': rules, 'layer': layer, 'prio': prio.split()[0] if prio else prio,
            'smoke': '(S)' in prio, 'tags': tags, 'line': line,
            'blocked': any(t.startswith('[BLOCKED') or t.startswith('[UNDECIDED') for t in tags),
            'assumed': any(t.startswith('[GIẢ ĐỊNH QA') for t in tags),
            'sm_refs': parse_sm_refs(rules),
            'endpoints': endpoints, 'br': expand_br(rules + ' ' + expect), 'bl': expand_bl(rules),
            'all_ops': '(mọi operation)' in eps, 'missing_ep': '\u2014' in eps,
        })
    return rows


# ---------------------------------------------------------------- openapi
def _yaml_list(v: str) -> list[str]:
    v = v.strip()
    if v.startswith('['):
        return [x.strip().strip('\'"') for x in v.strip('[]').split(',') if x.strip()]
    return [v.strip('\'"')] if v else []


def parse_openapi():
    """Line-based reader (no PyYAML): operationId + x-stories/x-roles/x-scope/x-rbac/x-transition + method,
    and schema properties carrying x-visible-to (name -> list of role sets)."""
    t = read(OPENAPI)
    ops: dict[str, list[str]] = {}
    meta: dict[str, dict] = {}
    current = None
    method = None
    prop = None
    visible = defaultdict(list)
    for line in t.splitlines():
        m = re.match(r'^    (get|post|put|patch|delete):\s*$', line)
        if m:
            method, current = m.group(1), None
            continue
        m = re.match(r'^\s+operationId:\s*(\w+)', line)
        if m:
            current = m.group(1)
            ops[current] = []
            meta[current] = {'method': method, 'roles': [], 'scope': {}, 'rbac': [], 'transition': []}
            continue
        if current:
            m = re.match(r'^\s+x-stories:\s*(.*)$', line)
            if m:
                ops[current] = _yaml_list(m.group(1))
            m = re.match(r'^\s+x-roles:\s*(.*)$', line)
            if m:
                meta[current]['roles'] = _yaml_list(m.group(1))
            m = re.match(r'^\s+x-rbac:\s*(.*)$', line)
            if m:
                meta[current]['rbac'] = _yaml_list(m.group(1))
            m = re.match(r'^\s+x-transition:\s*(.*)$', line)
            if m:
                meta[current]['transition'] = _yaml_list(m.group(1))
            m = re.match(r'^\s+x-scope:\s*\{(.*)\}', line)
            if m:
                meta[current]['scope'] = {k.strip(): v.strip() for k, v in
                                          (kv.split(':', 1) for kv in m.group(1).split(',') if ':' in kv)}
        m = re.match(r'^\s+(\w+):\s*(\{.*\})?\s*$', line)
        if m and not line.strip().startswith('x-'):
            prop = m.group(1)
            inline = re.search(r'x-visible-to:\s*(\[[^\]]*\])', m.group(2) or '')
            if inline:
                visible[prop].append(_yaml_list(inline.group(1)))
            continue
        m = re.match(r'^\s+x-visible-to:\s*(\[.*\])', line)
        if m and prop:
            visible[prop].append(_yaml_list(m.group(1)))
    by_story = defaultdict(list)
    for op, sts in ops.items():
        for s in sts:
            by_story[s].append(op)
    return ops, by_story, meta, visible


# ---------------------------------------------------------------- state machines (FB-R1-BA-QA-02)
CODE_SM = {'B': 'SM-01', 'O': 'SM-02', 'R': 'SM-03', 'W': 'SM-04', 'K': 'SM-05', 'H': 'SM-06', 'T': 'SM-07',
           'Q': 'SM-08', 'A': 'SM-10'}
BARE_OK = 'BOWQ'  # bare codes accepted without "SM-xx" prefix (no clash with other code families)


def _states(cell: str) -> set[str]:
    out = set(re.findall(r'`([^`]+)`', cell))
    if '[*]' in cell:
        out.add('*')
    return out


def _pair_key(src: set[str], dst: set[str]) -> str:
    return '/'.join(sorted(src)) + '→' + '/'.join(sorted(dst))


def parse_state_machines():
    """-> OrderedDict 'SM-01' -> {'name':..., 'rows':[{'id','code','src','dst','event'}]}"""
    t = read(SMFILE)
    sms: OrderedDict = OrderedDict()
    parts = re.split(r'^## \d+\. (SM-\d\d) – (.*)$', t, flags=re.M)
    for i in range(1, len(parts), 3):
        sm, name, body = parts[i], parts[i + 1].strip(), parts[i + 2]
        rows = []
        header = None
        for line in body.splitlines():
            if not line.startswith('|'):
                header = None
                continue
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            if header is None:
                header = cells
                continue
            if set(''.join(cells)) <= set('-: '):
                continue
            code = None
            if header[0] == '#':
                code, cells = cells[0], cells[1:]
                hdr = header[1:]
            else:
                hdr = header
            if not any('→' in c or '↔' in c for c in cells[:1]):
                continue
            trans = cells[0]
            event = cells[1] if len(cells) > 1 else ''
            if '↔' in trans:
                a, b = trans.split('↔', 1)
                src = dst = _states(a) | _states(b)
            else:
                a, b = trans.split('→', 1)
                src, dst = _states(a) or {'*'}, _states(b)
            rows.append({'id': code or _pair_key(src, dst), 'code': code, 'src': src, 'dst': dst,
                         'event': re.sub(r'\*', '', event)[:60], 'label': re.sub(r'\s+', ' ', trans)})
        if not rows:  # SM-13: transitions only in prose ("Chuyển: `open` → `settled` ...")
            for line in body.splitlines():
                if line.startswith('Chuyển'):
                    for a, b in re.findall(r'`(\w+)`\s*→\s*`(\w+)`', line):
                        rows.append({'id': f'{a}→{b}', 'code': None, 'src': {a}, 'dst': {b},
                                     'event': '(mô tả trong đoạn văn)', 'label': f'`{a}` → `{b}`'})
        sms[sm] = {'name': name, 'rows': rows}
    return sms


def _expand_codes(seg: str) -> list[str]:
    out = []
    for m in re.finditer(r'\b([A-Z])(\d{1,2})(?:\([a-z]\))?(?:\s*[–-]\s*\1?(\d{1,2}))?\b', seg):
        a = int(m.group(2))
        b = int(m.group(3)) if m.group(3) else a
        if a <= b <= a + 20:
            out += [f'{m.group(1)}{n}' for n in range(a, b + 1)]
    return out


def parse_sm_refs(rules: str) -> list[tuple[str, str]]:
    """'SM-01 B5/B10; SM-14 open→cancelled; B9' -> [('SM-01','B5'),('SM-01','B10'),('SM-14','open→cancelled'),('SM-01','B9')]"""
    out: list[tuple[str, str]] = []
    pos = []
    for m in re.finditer(r'SM-(\d\d)', rules):
        pos.append((m.start(), m.end(), f'SM-{m.group(1)}'))
    taken = []
    for k, (a, b, sm) in enumerate(pos):
        nxt = pos[k + 1][0] if k + 1 < len(pos) else len(rules)
        seg = rules[b:nxt]
        stop = re.search(r'[;(]|, (?:BR|BL|US|rbac|SEC|R-|ADR|HR|D\d)', seg)
        seg = seg[:stop.start()] if stop else seg
        taken.append((a, b + len(seg)))
        for f, t in re.findall(r'`?([\w*]+)`?\s*(?:→|->)\s*`?(\w+)`?', seg):
            out.append((sm, f'{f}→{t}'))
        seg_codes = re.sub(r'`?[\w*]+`?\s*(?:→|->)\s*`?\w+`?', ' ', seg)
        for c in _expand_codes(seg_codes):
            if CODE_SM.get(c[0]) == sm:
                out.append((sm, c))
    rest = ''.join(ch if not any(a <= i < b for a, b in taken) else ' ' for i, ch in enumerate(rules))
    for c in _expand_codes(rest):
        if c[0] in BARE_OK and not re.search(r'\b' + c + r'\d', rest):
            out.append((CODE_SM[c[0]], c))
    return out


def match_transition(sms, sm: str, ref: str):
    rows = sms.get(sm, {}).get('rows', [])
    if '→' not in ref:
        return [r for r in rows if r['code'] == ref]
    f, t = ref.split('→', 1)
    return [r for r in rows if (f in r['src'] or (f == '*' and '*' in r['src'])) and t in r['dst']]


# ---------------------------------------------------------------- RBAC truth (FB-R1-BA-QA-03)
def _cell_allows(cell: str) -> str:
    """'' deny | 'R' read-only | 'M' own scope | 'Y' allowed (✔, D, Đ, L, T, ◐ ...)."""
    c = re.sub(r'[⁰¹²³⁴⁵⁶⁷⁸⁹\s*]', '', cell)
    if not c or c.startswith('✖') or c in ('–', '-', 'K'):
        return ''
    if c.startswith('M'):
        return 'M'
    if c.startswith('R'):
        return 'R'
    return 'Y'


def load_rbac():
    """-> (actions: code -> {role: 'Y'|'M'|'R'|''}, fields: Dxx -> {role: 'full'|'partial'|'none'}, source)."""
    if os.path.exists(RBAC_JSON):
        data = json.loads(read(RBAC_JSON))
        alias = {**{k: v for k, v in ROLE_CODES.items()}, **{v: v for v in ROLE_CODES.values()}}
        acts = {}
        for key in ('actions', 'screens'):
            for code, cells in (data.get(key) or {}).items():
                acts[code] = {alias.get(r, r): _cell_allows(str(v)) for r, v in cells.items() if alias.get(r, r) in ROLE_CODES.values()}
        fields = {}
        for code, cells in (data.get('fields') or {}).items():
            fields[code] = {}
            for r, v in cells.items():
                for rr in r.split('/'):
                    if alias.get(rr) in ROLE_CODES.values():
                        fields[code][alias[rr]] = _field_level(str(v))
        return acts, fields, 'rbac-matrix.json'
    t = read(RBAC_MD)
    acts, fields = {}, {}
    header = None
    for line in t.splitlines():
        if not line.startswith('|'):
            header = None
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if header is None:
            header = cells
            continue
        code = cells[0]
        if re.fullmatch(r'[AS]\d{2,3}', code):
            row = {r: '' for r in ROLE_CODES.values()}
            for h, v in zip(header, cells):
                if h in ROLE_CODES:
                    row[ROLE_CODES[h]] = _cell_allows(v)
                elif h == 'Khác':
                    for rc in ('HK', 'MT', 'SAL', 'CTV', 'GST'):
                        if re.search(r'\b' + rc + r'\b', v):
                            row[ROLE_CODES[rc]] = 'Y'
            acts[code] = row
        elif re.fullmatch(r'D\d{2}', code) and 'OWN/MGR' in header:
            row = {}
            for h, v in zip(header, cells):
                for rr in h.split('/'):
                    if rr in ROLE_CODES:
                        row[ROLE_CODES[rr]] = _field_level(v)
            fields[code] = row
    return acts, fields, 'rbac-matrix.md (mục 3, 4, 6)'


def _field_level(v: str) -> str:
    c = re.sub(r'[*⁰¹²³⁴⁵⁶⁷⁸⁹]', '', v).strip()
    if not c or c.startswith('K') or c in ('–', '-'):
        return 'none'
    if c.startswith('Đầy') and '/' not in c and 'CRM' not in c:
        return 'full'
    return 'partial'


# QA map: schema property -> rbac field code (until ARC tags properties with x-rbac-field)
FIELD_MAP = {'dateOfBirth': 'D01', 'phone': 'D02', 'email': 'D02', 'phoneMasked': 'D02', 'relationship': 'D10',
             'childDisplayName': 'D09', 'companyName': 'D16', 'taxCode': 'D16', 'otaRef': 'D19',
             'payerName': 'D14', 'freeNote': 'D12', 'internalNote': 'D12'}


def rbac_check(meta, visible, acts, fields):
    """Compare OpenAPI against rbac truth. Returns (op_rows, field_rows, unknown_codes)."""
    op_rows, unknown = [], []
    for op, m in sorted(meta.items()):
        codes = [c for c in m['rbac'] if re.fullmatch(r'[AS]\d{2,3}', c)]
        if not codes:
            continue
        missing_codes = [c for c in codes if c not in acts]
        if missing_codes:
            unknown.append((op, missing_codes))
        exp, own = set(), set()
        for c in codes:
            for role, lv in acts.get(c, {}).items():
                if lv == 'Y' or lv == 'M' or (lv == 'R' and m['method'] == 'get'):
                    exp.add(role)
                if lv == 'M':
                    own.add(role)
        if not exp:
            continue
        got = set(m['roles'])
        if 'guest' not in got:  # GST reaches its data only through /guest/* operations (ADR-006)
            exp.discard('guest')
        extra = sorted(got - exp)
        lack = sorted(exp - got)
        scope_lack = sorted(r for r in own & got if r not in m['scope'])
        if extra or lack or scope_lack:
            op_rows.append((op, m['method'], ','.join(codes), extra, lack, scope_lack))
    field_rows = []
    for prop, sets in sorted(visible.items()):
        code = FIELD_MAP.get(prop)
        if not code or code not in fields:
            continue
        for vs in sets:
            leak = sorted(r for r in vs if fields[code].get(r) == 'none')
            lack = sorted(r for r, lv in fields[code].items() if lv == 'full' and r != 'guest' and r not in vs)
            if leak or lack:
                field_rows.append((prop, code, vs, leak, lack))
    return op_rows, field_rows, unknown


# ---------------------------------------------------------------- BR / triage / wireframes
def parse_br_catalogue():
    out = OrderedDict()
    for line in read(BRFILE).splitlines():
        m = re.match(r'^\|\s*(BR-\d{3})\s*\|\s*(.*?)\s*\|', line)
        if m and m.group(1) not in out:
            out[m.group(1)] = re.sub(r'\*\*', '', m.group(2))[:70]
    return out


def parse_triage():
    out = {}
    for line in read(TRIAGE).splitlines():
        m = re.match(r'^\|\s*#?(\d{1,2})\s*\|(.*?)\|\s*(Sửa|Cần INV quyết|Bỏ)\s*\|', line)
        if m:
            out[int(m.group(1))] = (m.group(3), re.sub(r'\*\*', '', m.group(2)).strip()[:80])
    return out


def parse_wireframes():
    """US numbers listed in the header (meta line) of each wireframe page."""
    res = defaultdict(list)
    for path in sorted(glob.glob(WF_GLOB)):
        name = os.path.basename(path)
        code = 'L' + name[1]
        text = html.unescape(re.sub(r'<[^>]+>', ' ', read(path)))
        text = re.sub(r'\s+', ' ', text)
        m = re.search(r'US-\d{3}(?:\s*[,\u2013-]\s*\d{3})*', text)
        if not m:
            continue
        seg = m.group(0)
        nums: set[int] = set()
        for a, b in re.findall(r'(\d{3})\s*[–-]\s*(\d{3})', seg):
            nums.update(range(int(a), int(b) + 1))
        nums.update(int(n) for n in re.findall(r'\d{3}', seg))
        for n in sorted(nums):
            res[f'US-{n:03d}'].append(code)
    return res


# QA mapping for stories a wireframe page shows but does not list in its header
# (screen section checked by QA when reading the page, 15/10/2026).
WF_QA = {
    'US-001': ['L1 §1.1'], 'US-002': ['L1 §1.2 (định hướng)'], 'US-011': ['L2 §2.1 tab Khách đến/đi', 'L8'],
    'US-016': ['L2 §2.1'], 'US-017': ['L2 §2.2'], 'US-018': ['L2 §2.2 (lỗi trùng)'], 'US-019': ['L2 §2.1 (401 khóa)', 'L6'],
    'US-020': ['L2 §2.3'], 'US-021': ['L2 §2.3 (hủy giữ chỗ)'], 'US-073': ['L2 §2.2'],
    'US-030': ['L2 §2.1 (Xác nhận giờ trả)'], 'US-031': ['L2 §2.1, §2.4'], 'US-135': ['L2 §2.3', 'L4 §4.4'],
    'US-029': ['L4 §4.2 (trả muộn)'], 'US-032': ['L4 §4.2 (phí phạt)'], 'US-085': ['L5 (bộ đếm giữ chỗ)', 'L2 §2.3'],
    'US-082': ['L5 (hết căn + gợi ý)'], 'US-022': ['L3 §3.1 (người thứ 2)'],
    'US-003': ['L1 §1.2 (cột Không được thấy)', 'L4 §4.1 (ghi chú giá vốn)'], 'US-048': ['L3 §3.1 (nút Xem giấy tờ)'], 'US-128': ['L3 §3.4', 'L7'], 'US-139': ['L8 (Cần chú ý)'],
}


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    out_path = OUT
    if '--out' in argv:
        out_path = os.path.abspath(argv[argv.index('--out') + 1])
    strict = '--strict' in argv
    stories, acs, titles, backlog_text = parse_backlog()
    tcs = parse_tcs()
    ops, ops_by_story, op_meta, visible = parse_openapi()
    sms = parse_state_machines()
    acts, rfields, rbac_src = load_rbac()
    op_bad, field_bad, rbac_unknown = rbac_check(op_meta, visible, acts, rfields)
    br_cat = parse_br_catalogue()
    triage = parse_triage()
    wf_hdr = parse_wireframes()

    must_r2 = [s for s, v in stories.items() if v['moscow'] == 'Must' and v['round'] == 'R2']
    must_r3_with_ac = [s for s in acs if s not in must_r2]

    # coverage maps
    tc_by_ac = defaultdict(list)
    tc_by_story = defaultdict(list)
    eps_by_story = defaultdict(set)
    br_by_tc = defaultdict(set)
    for r in tcs:
        for sid, ac in r['refs']:
            tc_by_story[sid].append(r['tc'])
            if ac:
                tc_by_ac[(sid, ac)].append(r['tc'])
            eps_by_story[sid].update(r['endpoints'])
        for b in r['br']:
            br_by_tc[b].add(r['tc'])

    unknown_ops = sorted({(r['tc'], e) for r in tcs for e in r['endpoints'] if e not in ops})
    bad_refs = sorted({(r['tc'], f'{s}/{a}') for r in tcs for s, a in r['refs'] if a and (s not in acs or a not in acs[s])})

    # runnable in R2 with a fixed oracle (FB-R1-BA-QA-04)
    tc_by_id = {r['tc']: r for r in tcs}
    cov_ac_run = sum(1 for s in must_r2 for a in acs.get(s, {})
                     if any(not tc_by_id[t]['blocked'] for t in tc_by_ac.get((s, a), [])))
    ac_only_blocked = [(s, a) for s in must_r2 for a in acs.get(s, {})
                       if tc_by_ac.get((s, a)) and all(tc_by_id[t]['blocked'] for t in tc_by_ac[(s, a)])]

    # state transitions -> TC (FB-R1-BA-QA-02)
    tc_by_tr = defaultdict(set)
    bad_sm_refs = []
    for r in tcs:
        for sm, ref in r['sm_refs']:
            hits = match_transition(sms, sm, ref)
            if not hits:
                bad_sm_refs.append((r['tc'], f'{sm} {ref}'))
            for h in hits:
                tc_by_tr[(sm, h['id'])].add(r['tc'])
    ops_by_tr = defaultdict(set)
    for op, m in op_meta.items():
        for code in m['transition']:
            sm = CODE_SM.get(code[:1])
            if sm:
                ops_by_tr[(sm, code)].add(op)
    total_tr = sum(len(v['rows']) for v in sms.values())
    cov_tr = sum(1 for sm, v in sms.items() for row in v['rows'] if tc_by_tr.get((sm, row['id'])))

    # ESC per story (FB-R1-PO-QA-07)
    esc_by_story = defaultdict(set)
    for sid, a in acs.items():
        for txt in a.values():
            esc_by_story[sid].update(re.findall(r'ESC-\d{3}', txt))
    for r in tcs:
        for sid, _ in r['refs']:
            esc_by_story[sid].update(re.findall(r'ESC-\d{3}', r['line']))

    total_ac = sum(len(acs.get(s, {})) for s in must_r2)
    cov_ac = sum(1 for s in must_r2 for a in acs.get(s, {}) if tc_by_ac.get((s, a)))
    story_cov = [s for s in must_r2 if tc_by_story.get(s)]
    uncovered_ac = [(s, a) for s in must_r2 for a in acs.get(s, {}) if not tc_by_ac.get((s, a))]
    no_ac_story = [s for s in must_r2 if not acs.get(s)]

    # endpoint + wireframe per story
    def endpoints_of(s):
        return sorted(set(ops_by_story.get(s, [])) | eps_by_story.get(s, set()))

    def wf_of(s):
        hdr = sorted(set(wf_hdr.get(s, [])))
        qa = [w for w in WF_QA.get(s, []) if not any(w.startswith(h) for h in hdr)]
        return hdr, qa

    no_ep = [s for s in must_r2 if not endpoints_of(s)]
    only_tc_ep = [s for s in must_r2 if not ops_by_story.get(s) and eps_by_story.get(s)]
    no_wf = [s for s in must_r2 if not any(wf_of(s))]

    # BR coverage
    br_story_refs = expand_br(backlog_text)
    tc_br_refs = set(br_by_tc)
    br_unref = [b for b in br_cat if b not in br_story_refs and b not in tc_br_refs]
    br_story_no_tc = [b for b in br_cat if b in br_story_refs and b not in tc_br_refs]

    # BL coverage
    bl_tc = defaultdict(list)
    for r in tcs:
        for n in r['bl']:
            bl_tc[n].append(r['tc'])

    groups = Counter(re.match(r'TC-([A-Z0-9]+)-', r['tc']).group(1) for r in tcs)
    prios = Counter(r['prio'] for r in tcs)
    layers = Counter()
    for r in tcs:
        for l in re.findall(r'[UAECPRM]', r['layer']):
            layers[l] += 1
    dup_ids = [k for k, v in Counter(r['tc'] for r in tcs).items() if v > 1]

    now = _dt.date(2026, 10, 15).strftime('%d/%m/%Y')
    L = []
    w = L.append
    w('# Ma trận truy vết – Story ↔ AC ↔ BR ↔ Test case ↔ Endpoint ↔ Wireframe')
    w('')
    w(f'- Tác giả: QA | Round 1 – Bước 4 (Phản hồi & sửa) | Ngày: {now} | Phiên bản: 0.2')
    w('- **File này do script sinh** – không sửa tay: `python3 product/tests/tools/gen_traceability.py` (chạy từ thư mục gốc repo). Nguồn: `03-backlog/backlog.md` (story, AC), `product/tests/test-cases/r1-main-flows.md` (TC), `product/docs/api/openapi.yaml` (`operationId`, `x-stories`), `product/docs/business-rules.md`, `product/docs/baseline-issues-triage.md`, `product/design/wireframes/0*.html` (dòng đầu trang liệt kê US).')
    w('- Đọc cùng `product/docs/qa/test-strategy.md`. Cột **Endpoint** = hợp của `x-stories` trong OpenAPI và endpoint QA dùng trong TC. Cột **Wireframe** = trang có ghi US ở đầu trang (`L2`…); mục có hậu tố "(QA)" = QA tự đối chiếu màn hình khi đầu trang không ghi US. Cột ERD không nằm trong ma trận này (QC C1 – ARC đã có `erd.md` mục 13 truy vết thực thể).')
    w('')
    w('## 1. Kết quả đếm (script)')
    w('')
    w('| Chỉ số | Kết quả |')
    w('|---|---|')
    w(f'| Story Must R2 trong backlog (mục 3) | **{len(must_r2)}** |')
    w(f'| Story Must R2 có ≥ 1 TC | **{len(story_cov)}/{len(must_r2)}** ({100*len(story_cov)//max(1,len(must_r2))}%) |')
    w(f'| AC của story Must R2 (backlog mục 4) | **{total_ac}** |')
    w(f'| AC có ≥ 1 TC | **{cov_ac}/{total_ac}** ({100*cov_ac/max(1,total_ac):.1f}%) |')
    w(f'| AC có ≥ 1 TC **chạy được ở R2 với kỳ vọng xác định** (TC không mang nhãn `[BLOCKED]`/`[UNDECIDED]`) | **{cov_ac_run}/{total_ac}** ({100*cov_ac_run/max(1,total_ac):.1f}%) |')
    w(f'| TC mang nhãn `[BLOCKED]`/`[UNDECIDED]` · `[GIẢ ĐỊNH QA]` | {sum(r["blocked"] for r in tcs)} · {sum(r["assumed"] for r in tcs)} (danh sách mục 5.7) |')
    w(f'| Chuyển trạng thái (15 máy, `state-machines.md`) có ≥ 1 TC | **{cov_tr}/{total_tr}** ({100*cov_tr/max(1,total_tr):.1f}%) – chi tiết mục 7 |')
    w(f'| Tham chiếu chuyển trạng thái trong TC không có trong `state-machines.md` | {len(bad_sm_refs)} |')
    w(f'| Kiểm tĩnh quyền (nguồn chuẩn: {rbac_src}): operation lệch `x-roles`/`x-scope` · thuộc tính lệch `x-visible-to` | {len(op_bad)} · {len(field_bad)} – chi tiết mục 8 |')
    w(f'| Story Must R2 không có AC ở mục 4 | {len(no_ac_story)} {", ".join(no_ac_story)} |')
    w(f'| Tổng số TC | **{len(tcs)}** (Cao {prios.get("Cao",0)} · TB {prios.get("TB",0)} · Thấp {prios.get("Thấp",0)}) · **Smoke (S)** {sum(r["smoke"] for r in tcs)} |')
    w('| TC theo nhóm | ' + ' · '.join(f'{k} {v}' for k, v in sorted(groups.items())) + ' |')
    w('| TC theo tầng (một TC có thể nhiều tầng) | ' + ' · '.join(f'{k} {layers[k]}' for k in 'UAEPM' if layers[k]) + ' |')
    w(f'| TC cho story ngoài Must R2 (ca chính) | ' + ', '.join(f'{s} ({len(set(tc_by_story[s]))})' for s in sorted(set(must_r3_with_ac) | {'US-041', 'US-064', 'US-137'}) if tc_by_story.get(s)) + ' |')
    w(f'| `operationId` dùng trong TC nhưng không có trong OpenAPI | {len(unknown_ops)} |')
    w(f'| Tham chiếu AC sai (AC không tồn tại) | {len(bad_refs)} |')
    w(f'| Mã TC trùng | {len(dup_ids)} |')
    w(f'| Story Must R2 **không có endpoint** (OpenAPI lẫn TC) | {len(no_ep)} |')
    w(f'| Story Must R2 có endpoint trong TC nhưng OpenAPI chưa gắn `x-stories` | {len(only_tc_ep)} |')
    w(f'| Story Must R2 **không có wireframe** | {len(no_wf)} |')
    w(f'| BR trong danh mục / BR không được story hay TC nào tham chiếu | {len(br_cat)} / {len(br_unref)} |')
    w('')
    if uncovered_ac:
        w('AC chưa có TC: ' + ', '.join(f'{s}/{a}' for s, a in uncovered_ac))
    else:
        w('**Không còn AC nào của story Must R2 thiếu test case.**')
    if ac_only_blocked:
        w('')
        w('AC **chỉ** có TC bị chặn/chưa có kỳ vọng xác định: ' + ', '.join(f'{s}/{a}' for s, a in ac_only_blocked))
    if unknown_ops:
        w('')
        w('operationId lạ: ' + ', '.join(f'{t}→{e}' for t, e in unknown_ops))
    if bad_refs:
        w('')
        w('Tham chiếu AC sai: ' + ', '.join(f'{t}→{x}' for t, x in bad_refs))
    w('')
    w('## 2. Ma trận story Must R2')
    w('')
    w('| Story | Tên (backlog mục 4) | AC → TC | BR trong AC | Endpoint (operationId) | Wireframe | ESC liên quan |')
    w('|---|---|---|---|---|---|---|')
    for s in must_r2:
        ac_cells = []
        for a in acs.get(s, {}):
            t = tc_by_ac.get((s, a), [])
            ac_cells.append(f'{a}: {", ".join(t) if t else "**TRỐNG**"}')
        extra = sorted({t for t in tc_by_story.get(s, []) if t not in {x for a in acs.get(s, {}) for x in tc_by_ac.get((s, a), [])}})
        if extra:
            ac_cells.append('bổ sung: ' + ', '.join(extra))
        brs = sorted(set().union(*[expand_br(v) for v in acs.get(s, {}).values()]) if acs.get(s) else set())
        eps = endpoints_of(s)
        hdr, qa = wf_of(s)
        wf = ', '.join(hdr + [f'{q} (QA)' for q in qa]) or '**TRỐNG**'
        ep = ', '.join(f'`{e}`' for e in eps) or '**TRỐNG**'
        esc = ', '.join(sorted(esc_by_story.get(s, []))) or '–'
        w(f'| {s} | {titles.get(s, "")} | {"<br>".join(ac_cells)} | {", ".join(brs) or "–"} | {ep} | {wf} | {esc} |')
    w('')
    w('## 3. Story ngoài Must R2 có test case ca chính trong R1 (Must R3, Should R2)')
    w('')
    w('| Story | AC → TC | Endpoint | Wireframe |')
    w('|---|---|---|---|')
    for s in sorted(set(must_r3_with_ac) | {'US-041', 'US-064', 'US-137'}):
        if not tc_by_story.get(s):
            continue
        cells = [f'{a}: {", ".join(tc_by_ac.get((s, a), [])) or "**TRỐNG**"}' for a in acs.get(s, {})]
        if not acs.get(s):
            cells = ['(chưa có AC) ' + ', '.join(sorted(set(tc_by_story[s])))]
        hdr, qa = wf_of(s)
        w(f'| {s} | {"<br>".join(cells)} | {", ".join(f"`{e}`" for e in endpoints_of(s)) or "**TRỐNG** (R3)"} | {", ".join(hdr + [q + " (QA)" for q in qa]) or "**TRỐNG**"} |')
    w('')
    w('## 4. Lỗi baseline BL 8.2 → test case chống tái phát')
    w('')
    w('| BL 8.2 | Nội dung (rút gọn) | Phân loại DOM | Test case |')
    w('|---|---|---|---|')
    for n in range(1, 31):
        st, txt = triage.get(n, ('?', ''))
        t = sorted(set(bl_tc.get(n, [])))
        cell = ', '.join(t) if t else ('**chưa có** – xem test case mục 11' if st != 'Bỏ' else '–')
        w(f'| #{n} | {txt} | {st} | {cell} |')
    w('')
    w('## 5. Ô trống và điểm cần xử lý')
    w('')
    w('### 5.1 Story Must R2 chưa có endpoint OpenAPI')
    if no_ep:
        for s in no_ep:
            w(f'- {s} – {titles.get(s, "")}')
    else:
        w('- Không có.')
    w('')
    w('### 5.2 Story Must R2 có endpoint trong TC nhưng OpenAPI chưa ghi `x-stories` (đề nghị ARC bổ sung để truy vết hai chiều)')
    w('- ' + (', '.join(only_tc_ep) if only_tc_ep else 'Không có.'))
    w('')
    w('### 5.3 Test case cần chức năng/endpoint chưa có trong OpenAPI R2 (cột Endpoint ghi "—"; TC chỉ kiểm giao diện/thủ công ghi "–" và không nằm trong danh sách này)')
    for r in tcs:
        if r['missing_ep']:
            refs = ', '.join(f'{s}/{a or "–"}' for s, a in r['refs']) or '–'
            w(f'- {r["tc"]} ({refs})')
    w('')
    w('### 5.4 Story Must R2 chưa có wireframe')
    w('- ' + (', '.join(f'{s} ({titles.get(s, "")})' for s in no_wf) if no_wf else 'Không có.'))
    w('')
    w('### 5.5 BR trong danh mục chưa được story hay test case nào tham chiếu')
    w('Đa số thuộc phân hệ Round 3 hoặc ngoài MVP (điện nước, VAT, kho, P&L, chấm dứt HĐ, đồ thất lạc, độ đầy đủ hồ sơ). Plan R1 mục 6 yêu cầu mỗi BR có ≥ 1 story/TC tham chiếu → đề nghị PO gắn các BR này vào story R3 tương ứng (US-064/065, US-122, US-093, US-118, US-078…), QA viết TC khi story có AC.')
    w('- ' + (', '.join(f'{b}' for b in br_unref) if br_unref else 'Không có.'))
    w('')
    w('### 5.6 BR được story tham chiếu nhưng chưa có test case R1 (thường là phân hệ R3)')
    w('- ' + (', '.join(br_story_no_tc) if br_story_no_tc else 'Không có.'))
    w('')
    w('### 5.7 Test case bị chặn, chưa có kỳ vọng xác định, hoặc theo giả định QA')
    w('')
    w('| TC | Nhãn | Story/AC |')
    w('|---|---|---|')
    for r in tcs:
        if r['tags']:
            w(f'| {r["tc"]} | {"; ".join(r["tags"])} | {", ".join(f"{s}/{a or chr(8211)}" for s, a in r["refs"]) or "–"} |')
    w('')
    w('## 6. Danh mục operationId OpenAPI chưa được test case nào dùng (để R2 bổ sung ca)')
    unused = sorted(o for o in ops if o not in {e for r in tcs for e in r['endpoints']})
    w('- ' + (', '.join(f'`{o}`' for o in unused) if unused else 'Không có.'))
    w('')
    w('## 7. Chuyển trạng thái (15 máy) → test case')
    w('')
    w('Nguồn: bảng chuyển của `state-machines.md`. Máy có cột "#" dùng mã chuyển (B1…, O1…, R1…, W1…, K1…, H1…, T1…, Q1…, A1…); máy chưa có mã (SM-09, SM-11…SM-15) dùng khóa `từ→đến`. TC khai báo chuyển ở cột "Quy tắc" (`SM-10 A5`, `SM-14 open→cancelled`). Cột Endpoint lấy từ `x-transition` của OpenAPI.')
    w('')
    w('| Máy | # | Từ → Đến | Sự kiện | Endpoint (`x-transition`) | TC |')
    w('|---|---|---|---|---|---|')
    for sm, v in sms.items():
        for row in v['rows']:
            t = sorted(tc_by_tr.get((sm, row['id']), []))
            ep = ', '.join(f'`{o}`' for o in sorted(ops_by_tr.get((sm, row['code'] or ''), []))) or '–'
            w(f'| {sm} | {row["code"] or "–"} | {row["label"]} | {row["event"]} | {ep} | {", ".join(t) if t else "**TRỐNG**"} |')
    w('')
    w('Tóm tắt theo máy: ' + ' · '.join(
        f'{sm} {sum(1 for row in v["rows"] if tc_by_tr.get((sm, row["id"])))}/{len(v["rows"])}' for sm, v in sms.items()))
    if bad_sm_refs:
        w('')
        w('Tham chiếu chuyển không có trong `state-machines.md` (BA bổ sung chuyển hoặc QA sửa TC): ' + ', '.join(f'{t}→{x}' for t, x in bad_sm_refs))
    w('')
    w('## 8. Kiểm tĩnh quyền – rbac-matrix (nguồn chuẩn) ↔ OpenAPI')
    w('')
    w(f'Nguồn chuẩn: `{rbac_src}`. Với mỗi operation: tập vai được phép = hợp các vai có ô khác ✖ ở dòng `x-rbac` (A-xx/S-xx; ô `R` chỉ tính cho GET; ô `M` đòi `x-scope: own`) – so với `x-roles`. Với thuộc tính có `x-visible-to`: so với dòng Dxx mục 6 qua bảng ánh xạ của QA (`FIELD_MAP`, đến khi ARC gắn `x-rbac-field`). "OpenAPI cho thêm vai" = nguy cơ rò quyền → lỗi tài liệu **P1** (P0 nếu là C3); "OpenAPI thiếu vai" = P2. Kết quả do người xem lại trước khi mở lỗi (ô `D`, `◐`, ghi chú chân trang có thể giải thích lệch).')
    w('')
    if op_bad:
        w('| operationId | Method | x-rbac | OpenAPI cho thêm vai (rbac ✖) | OpenAPI thiếu vai (rbac cho phép) | Vai M thiếu `x-scope` |')
        w('|---|---|---|---|---|---|')
        for op, meth, codes, extra, lack, sl in op_bad:
            w(f'| `{op}` | {meth} | {codes} | {", ".join(extra) or "–"} | {", ".join(lack) or "–"} | {", ".join(sl) or "–"} |')
    else:
        w('- Không có operation lệch.')
    w('')
    if field_bad:
        w('| Thuộc tính | Dxx | x-visible-to | Vai thấy nhưng rbac = K | Vai rbac "Đầy" nhưng không có trong x-visible-to |')
        w('|---|---|---|---|---|')
        for prop, code, vs, leak, lack in field_bad:
            w(f'| `{prop}` | {code} | {", ".join(vs)} | {", ".join(leak) or "–"} | {", ".join(lack) or "–"} |')
    else:
        w('- Không có thuộc tính lệch.')
    if rbac_unknown:
        w('')
        w('Mã `x-rbac` không có trong rbac-matrix: ' + ', '.join(f'{o}→{"/".join(c)}' for o, c in rbac_unknown))
    w('')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(L))
    # console summary
    print(f'Must R2 stories: {len(must_r2)}; covered: {len(story_cov)}')
    print(f'AC: {cov_ac}/{total_ac}; uncovered: {uncovered_ac}')
    print(f'TCs: {len(tcs)}; dup: {dup_ids}; unknown ops: {unknown_ops}; bad refs: {bad_refs}')
    print(f'no endpoint: {no_ep}; only TC ep: {only_tc_ep}; no wireframe: {no_wf}')
    print(f'BR unref: {br_unref}; BR story-no-TC: {br_story_no_tc}')
    print('BL no TC:', [n for n in range(1, 31) if not bl_tc.get(n)])
    print(f'AC runnable in R2: {cov_ac_run}/{total_ac}; only blocked: {ac_only_blocked}')
    print(f'Transitions covered: {cov_tr}/{total_tr}; bad SM refs: {bad_sm_refs}')
    print('Empty transitions:', [f'{sm} {row["id"]}' for sm, v in sms.items() for row in v['rows'] if not tc_by_tr.get((sm, row['id']))])
    print(f'RBAC ({rbac_src}): ops mismatched {len(op_bad)}; fields mismatched {len(field_bad)}; unknown codes {rbac_unknown}')
    print(f'Smoke: {sum(r["smoke"] for r in tcs)}; written to {out_path}')
    if strict and any(extra for _, _, _, extra, _, _ in op_bad):
        sys.exit(1)


if __name__ == '__main__':
    main()
