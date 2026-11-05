#!/usr/bin/env python3
"""Generate the v1.0.4 release traceability matrix for QC.

Reads only files in the repo plus `git log` (no network):
  - rounds/round-04/qa/v1.0.4-test-cases.md      (cases, source, run-at)
  - rounds/round-04/qa/v1.0.4-local-run-1.md     (pass-1 result per case)
  - rounds/round-04/qa/bug-list-v1.0.4.md        (bug summary table)
  - rounds/round-04/qa/v1.0.4-test-report.md     (pass-2 result, optional)
  - merge commits `Merge pull request #N` between tag v1.0.3 and HEAD

Writes rounds/round-04/qa/v1.0.4-traceability.md (Vietnamese, like other QA docs).

Usage (repo root):
  python3 rounds/round-04/qa/tools/gen_v104_traceability.py [--check]

--check exits 1 when a case or bug cannot be traced (no case for a bug fixed in
v1.0.4, a section without a merged PR, a case without a pass-2 slot).
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from collections import OrderedDict, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
QA = ROOT / "rounds/round-04/qa"
CASES = QA / "v1.0.4-test-cases.md"
RUN1 = QA / "v1.0.4-local-run-1.md"
BUGS = QA / "bug-list-v1.0.4.md"
REPORT2 = QA / "v1.0.4-test-report.md"
OUT = QA / "v1.0.4-traceability.md"
BASE_TAG = "v1.0.3"
CODE_CUT = "c9b64e4c"  # last merge that changed product code (#87)

ID_RE = re.compile(r"TC-V104-([A-Z]{2}-\d{2}b?)")
P4_RE = re.compile(r"P4-\d{2}")
BUG_RE = re.compile(r"BUG-R(\d)-(\d{3})((?:\s*/\s*\d{3})*)")

# PRs whose title has no package/bug id, or where the id needs context.
PR_NOTE = {
    34: ["LP-v2 (trơ trong v1.0.4)"],
    40: ["V3-08 phiếu giấy tờ v2 (UXD)"],
    51: ["Tài liệu BA (đặc tả P4)"],
    65: ["P4-30 (câu 409 khi đặt lại 2 bước)"],
    68: ["Tài liệu BA: CO-05, cách làm tạm BUG-R4-036; giới hạn yêu cầu hoàn"],
    72: ["Sổ tay (giá gõ, khóa Giữ chỗ, nhận phòng căn có khách, 2 tủ)"],
    73: ["BUG-R4-037 (điều kiện phát hành #70: OTA thiếu `ota_base_rate`)"],
    75: ["BUG-R4-041 (khóa tạm Giữ chỗ)"],
    76: ["P4-40 (chỉ test)"],
    78: ["Dữ liệu demo/smoke OPS P-1…P-4"],
    80: ["BUG-R4-044"],
    82: ["BUG-R4-046 (nguồn giá đã gõ)"],
    83: ["BUG-R4-048 (sửa trên nhánh, chưa từng vào `main`)"],
    85: ["Sổ tay ESC-045; CO-05 cách làm tạm BUG-R4-036"],
    79: ["Gộp vào nhánh #77 (PR chồng), vào `main` cùng #77"],
    87: ["RG-33 `rooms.night_auto`"],
    88: ["Tài liệu UXD (hi-fi, content guide)"],
    89: ["Sổ tay (SEC-PR85-01, DOM-PR85-04/05)"],
}

# Mandatory QC 7.4 lines -> cases (plan-v1.0.4.md 7.4).
QC74 = [
    ("Không P0/P1 mở", "Bảng B (mọi lỗi P0/P1 đã gộp, chờ STG)"),
    ("EM-09 (giới hạn đổi email)", "EM-01…EM-07"),
    ("PR32-06 / ARC-BE-31-05 (`STAFF_EMAIL_TEMPLATES`)", "EM-13, OP-05"),
    ("OPS-31-01 (diễn tập 5.0, thứ tự deploy)", "OP-01, OP-02, OP-03"),
    ("V3-08 (`privacy-2026-10-v2`, mở lại check-in online)", "PV-01…PV-05, NV-01, NV-02, PN-02; S15, S16"),
    ("QA-DOM-PR25-01 (`byCalc`)", "BC-01"),
    ("PO-DOM-PR25-01 + SEC-DOM-01", "BR-02, BR-03, CT-02"),
    ("SEC-OPS-01 (CI `confidential-paths`, mẫu PR)", "OP-07, OP-10"),
    ("SEC-ORC-01 G4 (che ảnh)", "RG-06"),
    ("Runbook quay lui về `sha-da6d6f3dc22b`", "OP-03, OP-04"),
    ("Sổ tay: đường Đặt lại xác thực 2 bước, bỏ câu \"chưa bật 2 bước\"", "MN-02 (BUG-R4-032)"),
    ("UXD dựng lại HTML sổ tay (P4-21)", "MN-01"),
    ("Brand OTTIMO", "RG-05, MF-19"),
]


def expand(spec: str) -> list[str]:
    out = []
    for part in spec.split(","):
        part = part.strip()
        m = re.fullmatch(r"([A-Z]{2})-(\d{2})(b?)(?:\.\.(\d{2}))?", part)
        if not m:
            raise ValueError(part)
        pre, a, b_suffix, z = m.groups()
        if z:
            out += [f"{pre}-{i:02d}" for i in range(int(a), int(z) + 1)]
        else:
            out.append(f"{pre}-{a}{b_suffix}")
    return out


# Pass-2 slot, plan A (T0 = 11:00 on 05/11), from v1.0.4-qa-round2-plan.md.
LOCAL = "Local/CI trên mã cắt (QA2/QA3), 05/11 trước 13:00"
REV = "REV trước QC (06/11 13:00–13:45)"
SLOTS_SRC = [
    ("HD-01..04", "05/11 13:20–13:50 (lúc tạo H1–H6)"),
    ("HD-09..13,HD-15..17,HD-19,HD-21,HD-23..26,HD-30,HD-32,HD-33", "05/11 14:50–15:50 (giữ chỗ 1 giờ tạo sau S10)"),
    ("HD-14", "05/11 14:15 mở SSE, kiểm 14:50–15:50"),
    ("HD-20", "05/11 14:50–15:50 + 06/11 10:00 (nút Nhận phòng)"),
    ("HD-28", "06/11 11:30–11:55"),
    ("HD-27,HD-29,HD-31", "06/11 12:05–12:30"),
    ("HD-34", "DOM 05/11 14:45–15:45"),
    ("HD-35", "C0 (OPS đọc journal) + " + LOCAL),
    ("MF-01..13,MF-20", "05/11 16:40–17:40 (sau C2)"),
    ("MF-14,MF-16,MF-19", "05/11 19:30–20:00"),
    ("MF-15", "05/11 19:30 chụp C1-07/C1-22 → UXD; kiểm che"),
    ("EM-01..04,EM-12,EM-15..17", "05/11 17:40–18:30 (sau diễn tập)"),
    ("EM-20", "OPS 05/11 khoảng 20:00"),
    ("LE-01..03", "Diễn tập S12, 05/11 khoảng 13:00–13:20"),
    ("LE-05,LE-06", "05/11 16:20–16:40"),
    ("LE-07", "OPS 05/11 khoảng 20:00"),
    ("PR-01", "D3 trước lùi, 05/11 khoảng 11:22–11:30"),
    ("PR-02,PR-03,PR-05", "05/11 16:20–16:40"),
    ("ET-01,ET-02", "05/11 19:30–20:00"),
    ("RD-01", "05/11 17:40–18:30"),
    ("RD-02", "05/11 17:40–18:30 nếu dựng được dữ liệu; không thì chỉ UNIT"),
    ("RD-05", "OPS 05/11 khoảng 20:00"),
    ("ML-02", "06/11 08:40–09:30 (sau RG-34)"),
    ("ML-01,ML-03..07", "05/11 17:40–18:30"),
    ("CO-01,CO-01b", "06/11 08:40–09:30 (C7)"),
    ("CO-02", "05/11 17:40–18:30"),
    ("CO-05", "(a) 06/11 08:20–08:40 (C6-1); (b) 06/11 12:35–13:00 (C6-2)"),
    ("MT-01", "05/11 19:30–20:00"),
    ("NV-01", "05/11 18:30–19:30"),
    ("PV-01,PV-02,PV-04", "S15/S16 diễn tập + 05/11 18:30–19:30"),
    ("PV-03", "S16 (K11 (d) staging, OPS)"),
    ("PN-02", "S4 diễn tập (`db_triggers`, OPS)"),
    ("PN-03", "OPS + ARC quyết có chạy không (không là điều kiện PV-01)"),
    ("PA-01..03,PA-05", "05/11 19:30–20:00 (PA-02 dùng dòng `hold_hours_options` hôm nay)"),
    ("OP-01,OP-02", "Diễn tập S3/S9 (OPS chạy, QA đọc)"),
    ("OP-03", "Diễn tập S4b/S6/S7/S15 + OP-03 (C6-2)"),
    ("OP-04,OP-11", "REV trước QC (06/11 13:00–13:45)"),
    ("OP-08,OP-09", "OPS 05/11 khoảng 20:00"),
    ("SN-05", "05/11 19:30–20:00"),
    ("MN-01,MN-02", "REV trước QC (UXD dựng HTML, BA câu)"),
    ("LP-01..09,LP-14,LP-15", "05/11 18:30–19:25 (LP-03, LP-14 đọc ở C0)"),
    ("LP-10", "05/11 19:25 (ca cuối khối LP)"),
    ("RG-01", "Diễn tập S16, 05/11 khoảng 13:00–13:20"),
    ("RG-02", "05/11 19:30–20:00"),
    ("RG-03", "05/11 17:40–18:30"),
    ("RG-05", "05/11 19:30–20:00"),
    ("RG-06", "Trước QC (kiểm che ảnh, SEC G4)"),
    ("RG-07..11,RG-15,RG-17,RG-27", "05/11 14:20–14:50 (P0 STG)"),
    ("RG-13", "05/11 14:50 nếu OPS chỉ ra nhóm thiếu `ota_base_rate`"),
    ("RG-14,RG-30", "06/11 08:00–08:40 (B-RG14 vào căn của C6-1)"),
    ("RG-16,RG-32", "05/11 15:50–16:20 (NB1, NB2)"),
    ("RG-18,RG-21", "06/11 09:30–10:00 (C9, Trả phòng 2 tủ)"),
    ("RG-23", "05/11 16:20 (giữ chỗ 12 giờ, hạn 06/11 04:20)"),
    ("RG-33", "05/11 19:30–20:00"),
    ("RG-34", "06/11 08:40–09:30 (C7, giờ thật)"),
    ("RG-35", "Sau khi `TAG12` r3 lên staging (S16' của 5.0 r3), trước 06/11 10:15"),
]
SLOTS: dict[str, str] = {}
for spec, slot in SLOTS_SRC:
    for cid in expand(spec):
        if cid in SLOTS:
            raise SystemExit(f"slot defined twice: {cid}")
        SLOTS[cid] = slot
# Cases that verify a bug without naming it in the row.
BUG_EXTRA = {"BUG-R4-032": ["MN-02"]}
NA = {"CO-03": "N/A – dời v1.0.5", "RG-22": "N/A – dời v1.0.5", "PV-06": "Production (K11), không thuộc lượt 2"}


def cells(line: str) -> list[str]:
    return [c.strip() for c in re.split(r"(?<!\\)\|", line.strip())[1:-1]]


def bug_ids(text: str) -> list[str]:
    out = []
    for m in BUG_RE.finditer(text):
        rnd, first, more = m.groups()
        out.append(f"BUG-R{rnd}-{first}")
        for extra in re.findall(r"\d{3}", more or ""):
            out.append(f"BUG-R{rnd}-{extra}")
    return list(OrderedDict.fromkeys(out))


def short(text: str, n: int) -> str:
    text = re.sub(r"\s+", " ", text.replace("**", "")).strip()
    text = text.replace("|", "/")
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(ROOT), *args], check=True, capture_output=True, text=True).stdout


def read_cases():
    cases = OrderedDict()
    sections = OrderedDict()
    sec = None
    for line in CASES.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^## (\d+)\. (.*)$", line)
        if m:
            sec = int(m.group(1))
            sections[sec] = m.group(2)
            continue
        if line.startswith("| TC-V104-"):
            c = cells(line)
            cid = ID_RE.match(c[0]).group(1)
            if cid in cases:
                raise SystemExit(f"duplicate case {cid}")
            cases[cid] = {
                "sec": sec,
                "src": c[1],
                "runat": c[4],
                "when": c[5],
                "bugs": bug_ids(line),
                "p4": P4_RE.findall(line),
                "stg": "STG" in c[4],
            }
    return cases, sections


def read_run1():
    res = {}
    for line in RUN1.read_text(encoding="utf-8").splitlines():
        if line.startswith("| TC-V104-"):
            c = cells(line)
            res[ID_RE.match(c[0]).group(1)] = c[2]
    return res


def read_run2():
    if not REPORT2.exists():
        return {}
    res, col = {}, None
    for line in REPORT2.read_text(encoding="utf-8").splitlines():
        if line.startswith("| ID"):
            hdr = cells(line)
            col = next((i for i, h in enumerate(hdr) if "lượt 2" in h), None)
        elif line.startswith("| TC-V104-") and col is not None:
            c = cells(line)
            res[ID_RE.match(c[0]).group(1)] = c[col]
    return res


def read_bugs():
    bugs = OrderedDict()
    text = BUGS.read_text(encoding="utf-8")
    summary = text.split("## Tóm tắt", 1)[1].split("\n---", 1)[0]
    for line in summary.splitlines():
        if line.startswith("| BUG-"):
            c = cells(line)
            bugs[c[0]] = {"sev": c[1], "where": c[2], "owner": c[3], "status": c[4]}
    return bugs


def read_prs():
    log = git("log", f"{BASE_TAG}..HEAD", "--merges", "--format=%h%x09%s%x09%b%x1e")
    prs = OrderedDict()
    for rec in log.split("\x1e"):
        rec = rec.strip()
        if not rec:
            continue
        sha, subj, body = (rec.split("\t", 2) + [""])[:3]
        m = re.match(r"Merge pull request #(\d+) from [^/]+/(\S+)", subj)
        if not m:
            continue
        num, branch = int(m.group(1)), m.group(2)
        title = body.strip().splitlines()[0] if body.strip() else branch
        items = list(OrderedDict.fromkeys(P4_RE.findall(title + " " + branch) + bug_ids(title)))
        prs[num] = {"sha": sha, "branch": branch, "title": title, "items": items, "note": PR_NOTE.get(num, [])}
    return OrderedDict(sorted(prs.items()))


BUG_NOTE = {"BUG-R4-036": "Hạ P2 khi #66 gộp (decision-log 05/11); sửa mã dời v1.0.5"}
# Fix in an open (not merged) PR: shown in table B when no merged PR names the bug.
OPEN_PR = {"BUG-R4-053": "#91 `9216394f` (chưa gộp)"}


def first_status(status: str) -> str:
    if status.startswith("**"):
        return short(status[2:].split("**", 1)[0], 90)
    return short(re.split(r"(?<=[^.])\.(?:\s|$)", status, 1)[0], 90)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    cases, sections = read_cases()
    run1, run2 = read_run1(), read_run2()
    bugs, prs = read_bugs(), read_prs()
    head = git("rev-parse", "--short=8", "HEAD").strip()
    code_diff = [p for p in git("diff", "--name-only", CODE_CUT, "HEAD", "--", "product").split() if p]
    code_changed = [p for p in code_diff if not p.startswith(("product/docs/", "product/design/"))]
    problems: list[str] = []

    # package -> PRs, bug -> PRs
    pkg_prs, bug_prs = defaultdict(list), defaultdict(list)
    for num, pr in prs.items():
        for it in pr["items"]:
            (pkg_prs if it.startswith("P4-") else bug_prs)[it].append(num)
        for note in pr["note"]:
            for b in bug_ids(note):
                if num not in bug_prs[b]:
                    bug_prs[b].append(num)
    bug_cases = defaultdict(list)
    for cid, c in cases.items():
        for b in c["bugs"]:
            bug_cases[b].append(cid)
    for b, extra in BUG_EXTRA.items():
        bug_cases[b] += [x for x in extra if x not in bug_cases[b]]

    def pr_ref(nums):
        return ", ".join(f"#{n} `{prs[n]['sha']}`" for n in nums) or "–"

    L: list[str] = []
    w = L.append
    w("# Ma trận truy vết v1.0.4 – gói, lỗi, ca kiểm thử, kết quả (cho QC)")
    w("")
    w(f"- Tác giả: QA | Round 4 – v1.0.4 – Bước **Kiểm thử** | Sinh bằng `rounds/round-04/qa/tools/gen_v104_traceability.py` trên `main` @ `{head}`.")
    w(f"- Nguồn: `v1.0.4-test-cases.md` ({len(cases)} ca), `v1.0.4-local-run-1.md` (lượt 1), `bug-list-v1.0.4.md` (bảng Tóm tắt), "
      f"commit gộp `Merge pull request #N` từ tag `{BASE_TAG}` tới `{head}` ({len(prs)} PR). "
      + ("Kết quả lượt 2: `v1.0.4-test-report.md`." if run2 else "Kết quả lượt 2: **chưa có** (`v1.0.4-test-report.md` chưa tạo); cột lượt 2 ghi khung giờ theo `v1.0.4-qa-round2-plan.md` phương án A."))
    if code_changed:
        w(f"- **Mã sản phẩm đã đổi sau `{CODE_CUT}`** ({len(code_changed)} tệp): kết quả lượt 1 / UNIT trên `{CODE_CUT}` phải chạy lại.")
        problems.append(f"product code changed after {CODE_CUT}: {code_changed[:5]}")
    else:
        w(f"- Mã sản phẩm không đổi sau `{CODE_CUT}` (#87): `git diff {CODE_CUT} {head} -- product` chỉ có "
          f"{len(code_diff)} tệp trong `product/docs/` hoặc `product/design/`. Kết quả UNIT/E2E trên `main` từ `{CODE_CUT}` dùng được cho `SHA_V104`.")
    w("- Ma trận chuẩn theo câu chuyện/AC (`product/docs/qa/traceability.md`, `gen_traceability.py --strict`) "
      + ("đã sinh lại và gộp ở PR #90" if 90 in prs else "sinh lại cùng PR này") + "; tóm tắt ở mục E.")
    w("- Sinh lại: `python3 rounds/round-04/qa/tools/gen_v104_traceability.py --check` ở gốc repo. Không sửa tay tệp này.")
    w("")

    # A. sections / packages
    w("## A. Gói v1.0.4 → PR → mục ca")
    w("")
    w("| Mục ca | Gói (theo tiêu đề mục) | PR đã gộp (merge SHA) | Số ca | Có STG | Lượt 1 đạt trọn / đạt phần / chờ STG / chưa đạt / N/A |")
    w("|---|---|---|---|---|---|")
    for sec, title in sections.items():
        ids = [k for k, c in cases.items() if c["sec"] == sec]
        if not ids:
            continue
        pk = list(OrderedDict.fromkeys(P4_RE.findall(title)))
        nums = sorted({n for p in pk for n in pkg_prs.get(p, [])})
        if pk and not nums:
            problems.append(f"section {sec}: no merged PR for {pk}")
        cnt = defaultdict(int)
        for k in ids:
            r = run1.get(k, "")
            if r.startswith("Đạt (local)") or r.startswith("**Đạt"):
                cnt["ok"] += 1
            elif r.startswith("Đạt"):
                cnt["part"] += 1
            elif "Chờ staging" in r:
                cnt["wait"] += 1
            elif "Chưa đạt" in r:
                cnt["red"] += 1
            elif r.startswith("N/A"):
                cnt["na"] += 1
            else:
                cnt["new"] += 1
        stg = sum(1 for k in ids if cases[k]["stg"])
        lr = f"{cnt['ok']} / {cnt['part']} / {cnt['wait']} / {cnt['red']} / {cnt['na']}" + (f" (+{cnt['new']} ca thêm sau lượt 1)" if cnt["new"] else "")
        w(f"| {sec}. {short(title.split(' – ')[0], 60)} | {', '.join(pk) or '–'} | {pr_ref(nums)} | {len(ids)} | {stg} | {lr} |")
    w("")
    w("Lượt 1 đếm theo `v1.0.4-local-run-1.md` (04/11, 172 ca). Ca thêm sau lượt 1 (bản 0.2–0.19) có kết quả ở cột \"Khi\" của test case và ở mục lỗi tương ứng; xem bảng D.")
    w("")

    # PR list
    w("### A.1 Mọi PR đã gộp từ `v1.0.3`")
    w("")
    w("| PR | Merge SHA | Nhánh | Gói / lỗi | Ghi chú |")
    w("|---|---|---|---|---|")
    for num, pr in prs.items():
        items = ", ".join(pr["items"]) or "–"
        w(f"| #{num} | `{pr['sha']}` | `{pr['branch']}` | {items} | {'; '.join(pr['note']) or short(pr['title'], 70)} |")
    w("")

    # B. bugs
    w("## B. Lỗi của v1.0.4 → PR sửa → ca hồi quy → trạng thái")
    w("")
    w("| Lỗi | Mức | PR sửa | Ca hồi quy | Trạng thái (bug list) | Lượt 2 (khung) |")
    w("|---|---|---|---|---|---|")
    for bid, b in bugs.items():
        sev = short(b["sev"], 40)
        st = first_status(b["status"])
        if bid in BUG_NOTE:
            st += ". " + BUG_NOTE[bid]
        elif "v1.0.5" in b["status"] and "v1.0.5" not in st:
            st += "; đề xuất dời v1.0.5"
        cs = bug_cases.get(bid, [])
        slots = sorted({SLOTS.get(c, LOCAL if not cases[c]["stg"] else "?") for c in cs if c not in NA})
        deferred = "v1.0.5" in b["status"]
        if not cs and not deferred and bid not in ("BUG-R4-029", "BUG-R4-030", "BUG-R4-031", "BUG-R4-033", "BUG-R4-034"):
            problems.append(f"{bid}: no regression case")
        prs_col = pr_ref(bug_prs[bid]) if bug_prs.get(bid) else OPEN_PR.get(bid, "–")
        w(f"| {bid} | {sev} | {prs_col} | {', '.join(cs) or ('– (dời v1.0.5)' if deferred else '– (CI/bộ test)')} | {st} | {short('; '.join(slots), 120) or '–'} |")
    w("")
    w("Lỗi CI/bộ test (029–031, 033, 034) không có ca riêng: bằng chứng là job CI không cache và E2E đủ bộ (RG-04).")
    w("")

    # C. QC 7.4
    w("## C. Điều kiện QC 7.4 → ca")
    w("")
    w("| Điều kiện (plan-v1.0.4 7.4) | Ca / bằng chứng |")
    w("|---|---|")
    p01 = [(bid, b) for bid, b in bugs.items() if re.match(r"\*{0,2}P[01]\b", b["sev"])]
    still_open = [bid for bid, b in p01 if not b["status"].startswith("**")]
    # Bold status = fixed. Merged only when the bold part says so ("gộp"); otherwise the fix is in an open PR.
    unmerged = [bid for bid, b in p01 if bid not in still_open and "gộp" not in b["status"][2:].split("**", 1)[0].lower()]
    merged = [bid for bid, b in p01 if bid not in still_open and bid not in unmerged]
    for cond, ref in QC74:
        if cond == "Không P0/P1 mở":
            ref = (f"Mở lúc sinh: {', '.join(still_open) or 'không'}"
                   + (f" ({BUG_NOTE[still_open[0]]})" if len(still_open) == 1 and still_open[0] in BUG_NOTE else "")
                   + (f". Đã sửa, chưa gộp: {', '.join(unmerged)}" if unmerged else "")
                   + f". Đã gộp, chờ xác nhận STG: {', '.join(merged)}")
        w(f"| {cond} | {ref} |")
    w("")
    w("Release notes (PO, PR #66"
      + (f", đã gộp `{prs[66]['sha']}`" if 66 in prs else ", **chưa gộp lúc sinh tệp này**")
      + ") và sổ tay (BA) là REV của PO/BA/DOM; QA chỉ đối chiếu chữ ở MN-02, CO-05. "
      "PR #69 (bỏ lời khuyên 2 bước v1.0.x) chỉ gộp sau khi v1.0.4 lên production.")
    w("")

    # D. all cases
    w(f"## D. Từng ca ({len(cases)})")
    w("")
    w("| Ca | Nguồn | Lỗi | Chạy ở | Lượt 1 | Lượt 2 – khung (phương án A) | Lượt 2 – kết quả |")
    w("|---|---|---|---|---|---|---|")
    for cid, c in cases.items():
        r1 = run1.get(cid)
        if r1 is None:
            r1 = "Thêm sau lượt 1: " + short(c["when"], 70)
        rev_only = c["runat"].startswith("REV") and not re.search(r"UNIT|E2E", c["runat"])
        slot = NA.get(cid) or SLOTS.get(cid) or (None if c["stg"] else (REV if rev_only else LOCAL))
        if slot is None:
            problems.append(f"{cid}: STG case without pass-2 slot")
            slot = "?"
        w(f"| {cid} | {short(c['src'], 45)} | {', '.join(c['bugs']) or '–'} | {short(c['runat'], 40)} | {short(r1, 70)} | {slot} | {short(run2.get(cid, 'Chưa chạy'), 50)} |")
    w("")

    # E. canonical matrix
    w("## E. Ma trận chuẩn `product/docs/qa/traceability.md`")
    w("")
    last = git("log", "-1", "--format=%h %ad", "--date=short", "HEAD", "--", "product/docs/qa/traceability.md").strip()
    w("Sinh lại bằng `python3 product/tests/tools/gen_traceability.py --strict` (như job CI `traceability`, thoát 0) trên cùng `main`. "
      + (f"Bản trong repo là `{last}` (PR #90). Bản trước đó là `e3f98d17 2026-10-21` (Round 2), nên PR #90 gồm mọi thay đổi từ đó "
         if 90 in prs else
         f"Bản trong repo trước PR này là `{last}` (Round 2), nên diff gồm mọi thay đổi từ đó ")
      + "(v1.0.1–v1.0.4, LP-v2). Ba điểm QA ghi để QC biết, không chặn:")
    w("")
    w("- **1 thuộc tính lệch:** `User.email` (D27) có `x-visible-to: [owner]`, còn hàng D27 của `rbac-matrix.md` ghi `manager` \"Đầy\". "
      "Lệch có từ OpenAPI 0.3.10 (BUG-R3-032, commit `c7a9e43c`), không do v1.0.4. Hợp đồng **hẹp hơn** ma trận (chỉ OWN xem email nhân viên, đúng ghi chú 45 của ma trận), không lộ dữ liệu. "
      "Gợi ý BA ghi ngoại lệ này ở hàng D27 (v1.0.5).")
    w("- **BR-116 không được story/TC nào trích:** đúng, vì BR-116 đã \"thừa\" từ `business-rules.md` v0.5.0 (INV 01/11, ESC-043 C). Danh mục BR 174 → 178.")
    w("- **LP-v2 là luồng riêng** (mục 9.1, US-131/174/175): chưa có AC ở backlog mục 4 nên 0/0, không tính vào `--strict`. Kiểm LP-v2 trong v1.0.4 là \"LP-v2 trơ\" (LP-01…LP-15).")
    w("")

    # F. problems
    w("## F. Kiểm của bộ sinh")
    w("")
    if problems:
        for p in problems:
            w(f"- {p}")
    else:
        w("- Không có ca/lỗi nào thiếu dấu vết: mọi mục có PR đã gộp, mọi lỗi sửa trong v1.0.4 có ca hồi quy (trừ lỗi CI/bộ test), mọi ca STG có khung lượt 2.")
    w("")

    OUT.write_text("\n".join(L), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(cases)} cases, {len(bugs)} bugs, {len(prs)} PRs, {len(problems)} problems")
    for p in problems:
        print("  -", p)
    return 1 if (args.check and problems) else 0


if __name__ == "__main__":
    sys.exit(main())
