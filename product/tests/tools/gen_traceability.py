#!/usr/bin/env python3
"""Generate product/docs/qa/traceability.md (QA, Round 1).

Reads (no third-party packages needed):
  03-backlog/backlog.md                       -> Must R2 stories + acceptance criteria (section 4)
  product/tests/test-cases/r1-main-flows.md   -> test cases (table rows starting with "| TC-")
  product/docs/api/openapi.yaml               -> operationId + x-stories
  product/docs/business-rules.md              -> BR catalogue
  product/docs/baseline-issues-triage.md      -> BL 8.2 #1..30 triage status
  product/design/wireframes/0*.html           -> US references in each page header

Usage (from repo root):  python3 product/tests/tools/gen_traceability.py
"""
from __future__ import annotations

import datetime as _dt
import glob
import html
import os
import re
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
OUT = P('product', 'docs', 'qa', 'traceability.md')

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
        rows.append({
            'tc': tc, 'refs': refs, 'rules': rules, 'layer': layer, 'prio': prio,
            'endpoints': endpoints, 'br': expand_br(rules + ' ' + expect), 'bl': expand_bl(rules),
            'all_ops': '(mọi operation)' in eps, 'missing_ep': '\u2014' in eps,
        })
    return rows


# ---------------------------------------------------------------- openapi
def parse_openapi():
    t = read(OPENAPI)
    ops = {}
    current = None
    for line in t.splitlines():
        m = re.match(r'^\s+operationId:\s*(\w+)', line)
        if m:
            current = m.group(1)
            ops[current] = []
            continue
        m = re.match(r'^\s+x-stories:\s*\[(.*)\]', line)
        if m and current:
            ops[current] = [s.strip() for s in m.group(1).split(',') if s.strip()]
    by_story = defaultdict(list)
    for op, sts in ops.items():
        for s in sts:
            by_story[s].append(op)
    return ops, by_story


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


def main():
    stories, acs, titles, backlog_text = parse_backlog()
    tcs = parse_tcs()
    ops, ops_by_story = parse_openapi()
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
    w(f'- Tác giả: QA | Round 1 – Bước 2 (Sản xuất, đợt 4) | Ngày: {now} | Phiên bản: 0.1')
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
    w(f'| Story Must R2 không có AC ở mục 4 | {len(no_ac_story)} {", ".join(no_ac_story)} |')
    w(f'| Tổng số TC | **{len(tcs)}** (Cao {prios.get("Cao",0)} · TB {prios.get("TB",0)} · Thấp {prios.get("Thấp",0)}) |')
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
    if unknown_ops:
        w('')
        w('operationId lạ: ' + ', '.join(f'{t}→{e}' for t, e in unknown_ops))
    if bad_refs:
        w('')
        w('Tham chiếu AC sai: ' + ', '.join(f'{t}→{x}' for t, x in bad_refs))
    w('')
    w('## 2. Ma trận story Must R2')
    w('')
    w('| Story | Tên (backlog mục 4) | AC → TC | BR trong AC | Endpoint (operationId) | Wireframe |')
    w('|---|---|---|---|---|---|')
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
        w(f'| {s} | {titles.get(s, "")} | {"<br>".join(ac_cells)} | {", ".join(brs) or "–"} | {ep} | {wf} |')
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
    w('## 6. Danh mục operationId OpenAPI chưa được test case nào dùng (để R2 bổ sung ca)')
    unused = sorted(o for o in ops if o not in {e for r in tcs for e in r['endpoints']})
    w('- ' + (', '.join(f'`{o}`' for o in unused) if unused else 'Không có.'))
    w('')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(L))
    # console summary
    print(f'Must R2 stories: {len(must_r2)}; covered: {len(story_cov)}')
    print(f'AC: {cov_ac}/{total_ac}; uncovered: {uncovered_ac}')
    print(f'TCs: {len(tcs)}; dup: {dup_ids}; unknown ops: {unknown_ops}; bad refs: {bad_refs}')
    print(f'no endpoint: {no_ep}; only TC ep: {only_tc_ep}; no wireframe: {no_wf}')
    print(f'BR unref: {br_unref}; BR story-no-TC: {br_story_no_tc}')
    print('BL no TC:', [n for n in range(1, 31) if not bl_tc.get(n)])


if __name__ == '__main__':
    main()
