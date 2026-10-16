#!/usr/bin/env python3
"""Generate the role x operation permission test matrix from OpenAPI x-roles / x-rbac (QA, Round 2 – Đợt 0).

For every operation in product/docs/api/openapi.yaml and every QA account of seed DS-E it emits one case with the
expected outcome of the ROLE GATE only (payload valid, resource in scope):

  2xx  role is listed in x-roles (alias any_staff = every internal role). If x-scope narrows the role
       (own, catalog_only, availability_only, all_masked ...) the case carries `scope`: BE/QA must also run the
       out-of-scope variant (own -> 404 on another user's record, rbac note 4).
  403  staff role not listed -> 403 FORBIDDEN_ACTION + audit_event access.denied (backlog section 4 convention).
  401  wrong session type: staff cookie on a guest operation, guest cookie on a staff operation (SR-SES-09).

public / system (webhook) operations are listed under `skipped`. Operations with x-round R3 are kept but flagged
`sprint: "R3"`. The rbac-matrix (truth) is cross-checked through gen_traceability.rbac_check: any operation where
OpenAPI and rbac disagree is flagged `rbacMismatch` (expected: none – traceability section 8).

Usage (from repo root):
  python3 product/tests/tools/gen_rbac_cases.py            # write fixtures/rbac-cases.json + .csv
  python3 product/tests/tools/gen_rbac_cases.py --check    # exit 1 if the committed files are stale (CI)
  python3 product/tests/tools/gen_rbac_cases.py --summary  # print counts only
"""
from __future__ import annotations

import csv
import io
import json
import os
import re
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(__file__))
import gen_traceability as gt  # noqa: E402  (same folder; reuses the OpenAPI/rbac readers)

OUT_JSON = gt.P('product', 'tests', 'fixtures', 'rbac-cases.json')
OUT_CSV = gt.P('product', 'tests', 'fixtures', 'rbac-cases.csv')
SEED = gt.P('product', 'tests', 'fixtures', 'seed', 'ds-e.json')

STAFF_ROLES = [r for r in gt.ROLE_CODES.values() if r != 'guest']


def parse_paths():
    """operationId -> (method, path, security, x-round) – line based, same style as gen_traceability."""
    out = {}
    path = method = None
    cur = None
    for line in gt.read(gt.OPENAPI).splitlines():
        m = re.match(r'^  (/[^:]*):\s*$', line)
        if m:
            path, method, cur = m.group(1), None, None
            continue
        m = re.match(r'^    (get|post|put|patch|delete):\s*$', line)
        if m:
            method, cur = m.group(1), None
            continue
        m = re.match(r'^      operationId:\s*(\w+)', line)
        if m and path and method:
            cur = m.group(1)
            out[cur] = {'method': method.upper(), 'path': path, 'security': 'staff', 'round': 'R2'}
            continue
        if cur:
            if re.match(r'^      security:\s*\[\]', line):
                out[cur]['security'] = 'none'
            elif re.match(r'^        - guestSession', line):
                out[cur]['security'] = 'guest'
            elif re.match(r'^        - providerSignature', line):
                out[cur]['security'] = 'provider'
            m = re.match(r'^      x-round:\s*(R\d)', line)
            if m:
                out[cur]['round'] = m.group(1)
    return out


def accounts():
    """role combination -> QA username (single-role accounts first; multi-role accounts as extra subjects)."""
    users = json.load(open(SEED, encoding='utf-8'))['users']
    subj = []
    seen = set()
    for u in users:
        if u['status'] != 'active':
            continue
        key = tuple(sorted(u['roles']))
        if key in seen:
            continue
        seen.add(key)
        subj.append((u['username'], u['roles']))
    return subj


def build():
    _, _, meta, visible = gt.parse_openapi()
    paths = parse_paths()
    acts, rfields, op_actions, rbac_src = gt.load_rbac()
    op_bad, _, _ = gt.rbac_check(meta, visible, acts, rfields, op_actions)
    mismatch = {row[0] for row in op_bad}
    subjects = accounts()
    cases, skipped = [], []
    for op in sorted(meta):
        m = meta[op]
        p = paths.get(op, {'method': (m['method'] or '').upper(), 'path': '?', 'security': 'staff', 'round': 'R2'})
        roles = set(m['roles'])
        if roles & {'public', 'system'} or p['security'] in ('none', 'provider'):
            skipped.append({'operationId': op, 'reason': ','.join(sorted(roles)) or p['security']})
            continue
        if 'any_staff' in roles:
            roles = (roles - {'any_staff'}) | set(STAFF_ROLES)
        scope = m['scope'] or {}
        if scope.get('all'):
            scope = {r: scope['all'] for r in STAFF_ROLES}
        guest_op = p['security'] == 'guest' or roles == {'guest'}
        base = {'operationId': op, 'method': p['method'], 'path': p['path'], 'rbac': m['rbac'],
                'sprint': p['round'], 'rbacMismatch': op in mismatch}
        if guest_op:
            cases.append({**base, 'subject': 'guest-session', 'roles': ['guest'], 'expected': '2xx', 'scope': None})
            for user, rs in subjects:
                cases.append({**base, 'subject': user, 'roles': rs, 'expected': '401', 'scope': None,
                              'note': 'cookie nhân viên trên operation khách (SR-SES-09)'})
            continue
        for user, rs in subjects:
            allowed = [r for r in rs if r in roles]
            sc = sorted({scope[r] for r in allowed if r in scope}) if allowed else []
            # a multi-role account is unscoped if at least one of its allowed roles is unscoped
            if allowed and any(r not in scope for r in allowed):
                sc = []
            cases.append({**base, 'subject': user, 'roles': rs, 'expected': '2xx' if allowed else '403',
                          'scope': ','.join(sc) or None})
        cases.append({**base, 'subject': 'guest-session', 'roles': ['guest'], 'expected': '401', 'scope': None,
                      'note': 'cookie khách trên operation nhân viên (SR-SES-09)'})
    for i, c in enumerate(cases, 1):
        c['id'] = f'RB-{i:04d}'
    doc = {
        '$comment': 'SINH TỰ ĐỘNG bởi product/tests/tools/gen_rbac_cases.py từ OpenAPI x-roles/x-scope/x-rbac – không sửa tay. '
                    'Kỳ vọng chỉ là CỔNG VAI: payload hợp lệ, tài nguyên trong phạm vi. 403 = FORBIDDEN_ACTION + audit access.denied; '
                    '401 = sai loại phiên; scope ≠ null → chạy thêm biến thể ngoài phạm vi (own → 404).',
        'source': {'openapi': 'product/docs/api/openapi.yaml', 'rbac': rbac_src, 'seed': 'product/tests/fixtures/seed/ds-e.json'},
        'summary': {
            'operations': len({c['operationId'] for c in cases}),
            'cases': len(cases),
            'byExpected': dict(sorted(Counter(c['expected'] for c in cases).items())),
            'scoped': sum(1 for c in cases if c['scope']),
            'sprintR3': sum(1 for c in cases if c['sprint'] == 'R3'),
            'rbacMismatchOps': sorted(mismatch),
            'skipped': len(skipped),
        },
        'skipped': skipped,
        'cases': [{k: c[k] for k in ('id', 'operationId', 'method', 'path', 'subject', 'roles', 'expected', 'scope',
                                     'rbac', 'sprint', 'rbacMismatch') } | ({'note': c['note']} if c.get('note') else {})
                  for c in cases],
    }
    return doc


def to_csv(doc):
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator='\n')
    w.writerow(['id', 'operationId', 'method', 'path', 'subject', 'roles', 'expected', 'scope', 'rbac', 'sprint', 'note'])
    for c in doc['cases']:
        w.writerow([c['id'], c['operationId'], c['method'], c['path'], c['subject'], '+'.join(c['roles']), c['expected'],
                    c['scope'] or '', ' '.join(c['rbac']), c['sprint'], c.get('note', '')])
    return buf.getvalue()


def main(argv=None):
    argv = argv or sys.argv[1:]
    doc = build()
    js = json.dumps(doc, ensure_ascii=False, indent=2) + '\n'
    cs = to_csv(doc)
    s = doc['summary']
    print(f"operations {s['operations']}; cases {s['cases']} {s['byExpected']}; scoped {s['scoped']}; "
          f"R3 {s['sprintR3']}; skipped {s['skipped']}; rbac mismatch {s['rbacMismatchOps']}")
    if '--summary' in argv:
        return
    if '--check' in argv:
        stale = [p for p, body in ((OUT_JSON, js), (OUT_CSV, cs))
                 if not os.path.exists(p) or open(p, encoding='utf-8').read() != body]
        if stale or s['rbacMismatchOps']:
            print('STALE/MISMATCH:', [os.path.relpath(p, gt.ROOT) for p in stale], s['rbacMismatchOps'])
            sys.exit(1)
        print('OK – rbac-cases up to date')
        return
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        f.write(js)
    with open(OUT_CSV, 'w', encoding='utf-8') as f:
        f.write(cs)
    print('written', os.path.relpath(OUT_JSON, gt.ROOT), os.path.relpath(OUT_CSV, gt.ROOT))


if __name__ == '__main__':
    main()
