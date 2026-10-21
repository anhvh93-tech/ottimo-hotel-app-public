# Cổng QC Round 2 – "luồng chính chạy từ đầu đến cuối"

- Người chấm: QC | 21/10/2026 | Round 2 – Bước 6 (cổng cả round, không chỉ Sprint 4)
- Đọc lại theo ma trận: ORC (bắt buộc), PO (khuyến nghị).
- Căn cứ chấm: `rounds/round-02/plan.md` mục 7 (A1–A7, B1–B5, C1–C6 và quy tắc quyết định), mục 2.2 (phần được phép dùng Mock), P-R2-7; protocol mục 4 (Round 2), mục 7, mục 10 (DoD); `sprint-4-plan.md` 9.3 ("staging … là điều kiện của cổng cuối Round 2"); `qc/s3-qc-gate.md` 4.2 (3). QC **không đổi tiêu chí**. Chỗ nào chưa đạt theo chữ thì ghi chưa đạt và chỉ đường gỡ hợp lệ.
- Đầu vào: cổng S2 (ĐCĐK), S3 bản 3 (ĐCĐK), S4 lần 3 (ĐCĐK, 21/10, `21bb797`); `sprint-1/2/3-summary.md`; `reviews/`, `responses/`; `qa/bug-list.md`; `outputs/PO/s4-acceptance.md`; `03-backlog/backlog.md`; decision-log; `02-escalations/escalations-index.md`; `s4-carryover.md`; `product/docs/research/usability-report-r2.md`; `rounds/round-03/plan.md` (nháp).
- Ký hiệu: **Đạt** · **Đạt có ĐK** · **Chưa** (thiếu so với chữ tiêu chí) · **KAD** (plan cho phép không áp dụng ở R2).

## Commit chấm và bằng chứng CI

**Commit chấm: `21bb797`** (main). Từ `21bb797` tới HEAD chỉ có tài liệu. QC tự đọc bằng `gh run list/view -R anhvh93-tech/ottimo-hotel-app-public`, không dùng số tự khai. Theo C13, lượt T9 gần nhất được dẫn kèm `gh run list --workflow CI -L 6`:

| Run | Sự kiện | Commit | Kết quả QC đọc |
|---|---|---|---|
| 39364680576 | push | `21bb797` | Xanh 8/8 (đọc ở lần chấm S4 lần 3): API 2.971 đạt, E2E 1.976 đạt / 69 bỏ qua, 0 `retry #`, gitleaks 148 commit no leaks, audit 0 high |
| 39462961483 | workflow_dispatch (T9) | `21bb797` | Xanh. E2E chạy 00:14–00:25 giờ VN |
| **39485554354** | **schedule (T9 hằng đêm)** | **`21bb797`** | **Xanh.** Tạo 19:41:10Z = **02:41 giờ VN 21/10**, đúng khung giờ đã đỏ ở 39312874062. QC tải log: `Running 2045 tests`, **1.976 đạt, 69 bỏ qua, 0 ✘, 0 dòng `retry #`**. TC-X-074 (`ui/gate-s4.spec.ts:413`) ✓ #1792; `axe-k8.s4` TC-X-084…087 ✓ #1998–2001. API 104 tệp / **2.971 đạt**, 2 bỏ qua. gitleaks **148 commit, no leaks**. Landing LP-v1 37/37. **C14 của cổng S4: Đạt** |
| 39515694829 | pull_request (Dependabot `minor-and-patch`, 8 gói) | `f88a273` | Đỏ. Không phải `main`, không gộp. Thuộc C9 |

- QC tự chạy `gen_traceability.py --strict` ở lần chấm S4 lần 3 trên `21bb797`: exit 0, 71/71 story Must R2, AC 254/254, RBAC lệch 0.
- QC không chạy stack, không đi luồng bằng tay, không đụng stack demo, không in tệp env.

---

## 1. Quyết định

**KHÔNG ĐẠT.**

Lý do (1 câu): mục 7 đòi nhóm A chạy trên **staging** và B5 có **staging deploy tự động**, nhưng Round 2 chưa có staging (VPS + tên miền INV chưa gửi), nên nhóm A và B5 chưa đạt theo chữ; quy tắc mục 7 chỉ cho ĐẠT CÓ ĐIỀU KIỆN khi nhóm A và B đạt hết.

Đọc kỹ để không hiểu sai:
- **Phần mềm chạy được luồng chính.** Trên stack CI dùng một lần (cùng ảnh production, PostgreSQL thật, đồng hồ giả lập), A1–A7 có ca tự động xanh, lượt chạy đêm cũng xanh. Không còn lỗi P0/P1. Không có lỗi bảo mật Critical/High. Không có lỗi sai tiền P0/P1 mở.
- Cổng trượt chủ yếu vì **môi trường**: chưa có máy chủ staging. Việc này đội không tự gỡ được, vì phụ thuộc VPS và tên miền của INV (ESC-002 đã quyết 16/10; INV hẹn gửi 19/10, chưa nhận). QC đã báo trước điều này ở `s3-qc-gate.md` 4.2 (3) ngày 17/10.
- Ngoài staging còn **4 việc đội tự làm được** (mục 5, R-1…R-4): nghiệm thu PO chưa chấm lại, 7 thẻ Major SEC→INT chưa có trả lời, A1 chưa có lượt QA chạy tay có ghi hình, 3 điều kiện cổng S4 có hạn "trước QC Round 2" chưa xong.
- Bản nháp tổng kết đề nghị "chuyển mục staging thành điều kiện đầu R3". QC **không làm được việc đó**: như vậy là tự đổi tiêu chí mục 7. Muốn đi tiếp khi cổng còn trượt thì phải để INV quyết. QC tạo **ESC-028** (mục 7).
- Không phải KHÔNG ĐẠT vì tiền hay bảo mật. Không có tình huống nào trong các quy tắc cứng của skill QC: không P0, không lỗi bảo mật nghiêm trọng, không sai tiền mở.

---

## 2. Bảng kiểm mục 7

### A. Luồng chính chạy từ đầu đến cuối trên staging (E2E tự động + QA chạy tay một lần có ghi hình/ảnh)

Cột "Nội dung" chấm trên stack CI dùng một lần (`21bb797`, run 39364680576 + T9 39462961483 + T9 39485554354). Cột "Theo chữ" chấm đúng câu của tiêu chí.

| # | Nội dung (stack CI) | Bằng chứng | Theo chữ (staging + chạy tay có hình) |
|---|---|---|---|
| A1 | Đạt | Chuỗi liền mạch `ui-clock/flow-a1.s4.spec.ts` TC-X-070 (báo giá 202 → giữ chỗ → VietQR cọc → xác nhận → check-in online → nhận phòng → lưu trú → trả phòng 3 bước → bill → thu → `VD` → PWA dọn, kiểm → `VI`), TC-X-071 (FOC ở trả phòng, S4-25). Có trong `WRITES`, không `test.fail` (`OPEN = {}`). Tiền: 8 lượt kiểm đối kháng, `br-examples.json` + `validate-fixtures` 0 lỗi (cổng S4 G1) | **Chưa** – không staging; chưa có lượt QA chạy tay A1 có ghi hình (QC grep `qa/`, `outputs/QA`: 0 tệp ghi hình/ảnh cho A1). Các lượt UXR L1–L4 là đánh giá khả dụng, có ảnh, nhưng không đi trọn A1 |
| A2 | Đạt | `api/booking-conflicts.api.spec.ts`, `api/ota-rules.s3.api.spec.ts`, `clock/ota-rules.s3.clock.spec.ts`: đơn OTA thu hộ, lệnh đồng bộ Mock vào outbox, đơn trùng → cờ xung đột, làn "Chưa gán căn", gán căn, chặn nhận phòng khi chưa gán. Kênh thật là Mock theo plan 2.2 – **KAD phần kênh thật**. Lưu ý: không có một ca A2 liền mạch như A1, chỉ có các ca thành phần | **Chưa** – không staging |
| A3 | Đạt | `api/concurrency.api.spec.ts` (2 phiên lưu cùng căn–đêm → đúng 1 thành công, `409 ROOM_UNAVAILABLE` + gợi ý), `clock/hold-expiry.clock.spec.ts` (giữ chỗ quá hạn tự hủy, mở phòng). Ràng buộc EXCLUDE (cổng S2) | **Chưa** – không staging |
| A4 | Đạt | `ui-clock/flow-a4.s4.spec.ts` TC-X-072 (PWA báo sự cố + ảnh → phiếu + khóa OOO → không bán được → đóng phiếu → `VD` → dọn → bán lại). TC-X-074 PWA ✓ cả lượt đêm 02:41 | **Chưa** – không staging |
| A5 | Đạt | `clock/no-show.clock.spec.ts`, `api/reservations.api.spec.ts`, `refund-credit.s4.*` (phí hủy BR-309/310, no-show sau mốc BR-311 không tự đánh dấu, khôi phục trong ngày nghiệp vụ, khai báo dùng lại bản ghi) | **Chưa** – không staging |
| A6 | Đạt | Ma trận quyền tự sinh `rbac` 1.474 ca xanh; `api/c3-access.s3.api.spec.ts`, `c3-at-rest.s3.api.spec.ts` (thiết bị được cấp, `c3_access_log`); `api/identity.api.spec.ts`; P-R2-4 có SEC xác nhận (app khách không lộ dữ liệu nhạy cảm) | **Chưa** – không staging; SEC chưa smoke staging (SEC-G2, C7 cổng S4) |
| A7 | Đạt | DATA `outputs/DATA/s4-a7-reconciliation.md` 8.7: `a7-ds0` 114/114 khớp trên `c293ceb` (cổng S4 K4). `c293ceb → 21bb797` không đổi `product/services` → số còn giá trị. Nhật ký tiền đủ người – thời điểm – giá trị cũ/mới (TT audit) | **Chưa** – không staging |

**Nhóm A: Chưa** (7/7 đạt nội dung trên stack CI; 0/7 đạt theo chữ "trên staging"; A1 thiếu lượt QA chạy tay có ghi hình).

### B. Chất lượng kỹ thuật

| # | Bằng chứng | Kết quả |
|---|---|---|
| B1 | `ci.yml`: format, lint (ESLint + `tsc` từng gói), `pnpm audit --audit-level=high`, unit + API trên PostgreSQL, kiểm schema = migration, ma trận quyền, `api-contract` (`gen_traceability.py --strict`), `contract-lint` Redocly (job trong `needs`), gitleaks toàn lịch sử, build ảnh + smoke `/health`, E2E smoke + T9. Không còn `--no-frozen-lockfile` (grep `.github`, `product/infra`: 0). Push 39364680576 xanh 8/8 trên `21bb797`; T9 gần nhất 39485554354 xanh, 0 retry | **Đạt** |
| B2 | `qa/bug-list.md` bảng tổng: P0 11/11 Closed, P1 68/68 Closed. P2 Open 2 (208 → R3-Q19, 209 → R3-Q20), Deferred 1 (074 → S4-45), đều có dòng backlog và hạn | **Đạt** |
| B3 | `s4-SEC.md` mục E (sau khi repo công khai): 0 Critical/High Open. SEC review đủ PR chạm C3, phiên, RLS, quyền, guest link (cổng S3 G-SEC, S4 G2.1–G2.5). Major SEC còn dời (74, 75, 79, 83) là điều kiện cứng trước dữ liệu thật, có Deferred của tác giả (C11 b) | **Đạt** |
| B4 | `validate-fixtures` + test đọc `br-examples.json` (cổng S4 G1.4); test đồng thời chống trùng, FOC, thu tiền (`concurrency.api.spec.ts`, `approvals-foc.s3.clock.spec.ts`, cổng S4 T2); `services/api/test/integration/rls.test.ts` (RLS 2 cơ sở, cổng S2) | **Đạt** |
| B5 | Caddyfile production đúng SEC-OPS-11/12: `check-caddy-prod.sh` 33/33 trong CI, SEC Verified SEC-OPS-03 **phần cấu hình** (decision-log 17/10). Không khóa thật trong repo: gitleaks 148 commit no leaks. **Staging deploy tự động từ CI, migration là bước riêng: chưa từng chạy** – job staging/GHCR "bỏ qua theo thiết kế" ở mọi run vì chưa có VPS | **Chưa** |

**Nhóm B: Chưa** (B5).

### C. Definition of Done và tài liệu

| # | Bằng chứng | Kết quả |
|---|---|---|
| C1 | Backlog: 71 story Must R2 = **36 "Đạt (stack tạm)" + 35 "Đang nghiệm thu"**; **0 story Accepted trên staging** (P-R2-7). `s4-acceptance.md` vẫn là bản 18/10 trên `7ac11a4` (32 AC "Chờ ca UI", 2 "Chưa"). Điều kiện C4 cổng S4 (PO chấm lại trên commit chấm lại, trước tổng kết) **chưa làm**. Phần dời R3 đều có quyết định: R-C (ESC-012), US-012 AC7 và US-031 AC1 (ORC K9 19/10). 8 story LP-v1 thuộc cổng riêng – KAD | **Chưa** |
| C2 | DS v0.4, font tự host, màu ngoài bảng chỉ còn ngoại lệ UXD ký (cổng S4 G8.1, G8.3). axe: 13 ca UI + `axe-k8.s4` (H20, H15, H16, H23), 0 vi phạm critical/serious trong T9 39485554354; UXD Verified K8 và MOB-S4-05 (a) (`s4-UXD-brand.md` dòng 499, 549). VI + EN đủ chuỗi theo UXD `s4-UXD-strings-2.md`. Giới hạn: chưa đo trên thiết bị thật, phóng chữ 200 %, trình đọc màn hình | **Đạt** |
| C3 | OpenAPI 0.3.x `--strict` exit 0; traceability sinh lại; migration có test journal; specs BA, `dev-setup.md` cập nhật theo sprint. `hosting-plan.md` có phần staging nhưng **chưa kiểm trên staging thật** | **Đạt có ĐK** (hosting-plan đối chiếu khi dựng staging – R-5) |
| C4 | 384 thẻ FB-R2 trong `reviews/`; 147 Blocker/Major. QC đối chiếu từng thẻ với `responses/`: 135 Done/Verified, 5 Deferred có lý do + backlog (SEC-BE-74, 75, 79, 83; SEC-ARC-25 → US-164). **7 thẻ Major không có trả lời của tác giả**: FB-R2-SEC-INT-07, 08, 09, 10, 11, 12, 14 (`reviews/landing-zalo-SEC.md`, tác giả INT; grep `responses/`: 0). Hai thẻ 09, 12 có quyết định SEC trong decision-log 17/10, nhưng INT chưa ghi trạng thái. Không có Rejected thiếu lý do | **Chưa** (thủ tục – R-2) |
| C5 | `product/docs/research/usability-report-r2.md` v1.0: 5 kịch bản (lễ tân, buồng phòng/kỹ thuật, khách check-in online, chủ đầu tư, CTV), có bảng vấn đề và danh sách sửa cho R3 (mục 5). Ghi rõ là đánh giá mô phỏng, chưa có người dùng thật (ESC-003 chưa có kết quả phiếu) | **Đạt** |
| C6 | `rounds/round-03/plan.md` nháp 20/10 (PO + ORC), có phần dời R-C và hàng chờ R3-Q01…Q38 | **Đạt** |

**Nhóm C:** thiếu 2 dòng (C1, C4) và 1 dòng có ĐK (C3).

### Theo quy tắc mục 7
- ĐẠT: cần mọi dòng A–C đạt và 0 Blocker/Major Open → không.
- ĐẠT CÓ ĐIỀU KIỆN: cần nhóm A và B đạt hết → **không** (A1–A7 và B5 Chưa).
- → **KHÔNG ĐẠT.**

---

## 3. Đầu vào từ các cổng sprint

| Cổng | Kết quả | Điều kiện còn mở liên quan cổng round |
|---|---|---|
| S2 | ĐẠT CÓ ĐIỀU KIỆN (16/10) | ĐK-S2-6 staging → nay là A/B5 |
| S3 bản 3 | ĐẠT CÓ ĐIỀU KIỆN (17/10) | ĐK-S3-8 staging + SEC smoke → A6, B5 |
| S4 lần 3 | ĐẠT CÓ ĐIỀU KIỆN (21/10, `21bb797`) | Xem bảng dưới |

Điều kiện cổng S4 (mục 11.5) lúc chấm cổng round:

| # | Hạn | Tình trạng QC kiểm 21/10 |
|---|---|---|
| C1 (phần R3) | R3 Sprint 1 | Giữ – 208, 209, 210, ARC 16.31, BUG-R2-123 qua lượt kiểm tiền riêng |
| C2 thủ tục 210 | Tới khi 210 sửa | Giữ |
| C3 DOM xác nhận số BR-525-16 | Tuần Ổn định | **Chưa** – không thấy dòng DOM (grep `responses/DOM-responses.md`, decision-log, business-rules) |
| C4 PO chấm lại `s4-acceptance.md` | Trước tổng kết R2 | **Chưa** → C1 cổng round, R-1 |
| C5 SEC đọc PWA snapshot 502–504 | Trước R3 Sprint 1 | Chưa (còn hạn) |
| C6 ORC ghi ngày chấm + nêu trong tổng kết | Tổng kết R2 | Ngày chấm đã có trong decision-log 19/10, 20/10, 21/10; phần tổng kết là việc ORC |
| C7 staging, S4-15 Caddy thật, SEC-G2 smoke | Cổng cuối R2 | **Chưa** – không VPS → A, B5 |
| C8 UXR đi lại T6, T7 PWA | Trước QC R2 | **Chưa** – `s4-pwa-walkthrough.md` dòng 182 vẫn là việc cần làm |
| C9 PR Dependabot đỏ không gộp | R3 Sprint 1 | Giữ – thêm 39515694829 (đỏ) |
| C10 ca chọn ngày tương đối | Trước QC R2 | **Đạt** – QA 19/10 (decision-log, `bug-list.md` 11.36) |
| C11 (a)(b)(c) | Trước QC R2 | Đạt (lần chấm 3) |
| C11 (d) ORC 16.5 | Trước QC R2 | **Đạt** – `sprint-4-plan.md` dòng 644: "Ngày: 19/10/2026 · Dòng decision-log: 'ORC – K9 …' ngày 2026-10-19" |
| C11 (e) UXD axe H23 + MOB-S4-05 (a) | Trước QC R2 | **Đạt** – `s4-UXD-brand.md` dòng 499 (MOB-S4-05 (a) Verified 21/10 `21bb797`), 549 (K8 axe Verified) |
| C12 | – | Đạt |
| C13 | Từ nay | Giữ – bản này dẫn T9 gần nhất kèm danh sách `-L 6` |
| **C14** T9 lịch đầu tiên trên `21bb797` xanh | Trước tổng kết R2 | **Đạt** – 39485554354 (schedule, 02:41 giờ VN 21/10), xanh, 0 `retry #`. Quyết định S4 lần 3 không mở lại |

Cổng LP-v1 (landing): cổng riêng, **không tính vào cổng QC Round 2** (ORC decision-log 17/10). QC chưa chấm cổng LP-v1. Landing chạy xanh trong CI (37/37 trong T9 39485554354). Trên mạng còn chờ tên miền, VPS, INV duyệt nội dung và luật sư (ESC-001 LZ-2, LZ-8).

---

## 4. Tự kiểm mẫu (3–5 story quan trọng nhất)

| Story / luồng | Cách kiểm | Kết luận |
|---|---|---|
| US-016…024 chống trùng (A3) | Đọc lại bằng chứng cổng S2 (EXCLUDE + test đồng thời); ca `concurrency.api.spec.ts` có trong 1.976 ca xanh của T9 39485554354 | Đạt trên stack CI |
| A1 chuỗi tiền (US-084, 086, 120, 035–039) | Cổng S4 G1 (8 lượt kiểm đối kháng, fuzz 0 lệch / 37.966 phép so); TC-X-070/071 trong T9; `git diff c293ceb 21bb797 -- product/services product/packages` rỗng | Đạt trên stack CI |
| US-052…057 PWA buồng phòng (A4) | TC-X-074 ✓ lúc 02:41 giờ VN (đúng khung lỗi BUG-R2-211); TC-X-072; axe H20 | Đạt trên stack CI |
| US-042…050 giấy tờ C3 (A6) | Cổng S3 bản 3 (SEC-G1 a, BE-32 Verified), S4 K1 (BE-65), K11 (đánh giá lại khi repo công khai) | Đạt trên stack CI; SEC vẫn chặn link khách thật và dữ liệu thật tới khi smoke staging |
| US-010…012 tổng quan chủ đầu tư (A7) | DATA 114/114 trên `c293ceb`; server không đổi tới `21bb797` | Đạt trên stack CI |

Tính nhất quán tài liệu ↔ thiết kế ↔ mã: OpenAPI ↔ rbac lệch 0 (`--strict`); UXD ký thương hiệu (S4 G8); BR ↔ `br-examples.json` 0 lỗi. Lệch còn biết: BR-403 v0.3.9 mã cửa 8 số (INV 19/10) chưa vào mã/test – mã cửa thuộc R3 theo R-C, không ảnh hưởng R2.

---

## 5. Mục KHÔNG ĐẠT – quay lại Bước 4 (một lần), rồi QC chấm lại rút gọn

Chấm lại rút gọn = QC chỉ kiểm các dòng A1–A7, B5, C1, C3, C4 và điều kiện R-1…R-6. Không mở lại B1–B4, C2, C5, C6, trừ khi commit mới chạm `product/services`/`packages` hoặc vùng tiền. Mỗi báo cáo "CI/T9 xanh" dẫn lượt T9 gần nhất (C13).

**Đợt 1 – đội làm ngay, không cần VPS (hạn 23/10/2026):**

| # | Việc | Người làm | Đạt khi | Gỡ dòng |
|---|---|---|---|---|
| R-1 | Chấm lại `s4-acceptance.md` và cột Trạng thái backlog trên `21bb797` (C4 cổng S4): 32 AC "Chờ ca UI" đối chiếu ca UI đã thêm (gate-s4, axe-k8, night-business-day, flow-a1/a4), US-024 AC4, US-139 AC3, US-066 AC2, US-053/055/110 | PO | Mỗi story Must R2 ở "Đạt (stack tạm)" hoặc "Đang nghiệm thu" có lý do cụ thể còn lại (không còn "Chờ G1"); số liệu mới thay 36/35 | Chuẩn bị C1 |
| R-2 | INT trả lời 7 thẻ Major `landing-zalo-SEC.md`: FB-R2-SEC-INT-07, 08, 09, 10, 11, 12, 14 trong `responses/INT-responses.md` (Done / Deferred R3 có dòng backlog / Rejected có lý do). Gắn 09, 12 với quyết định SEC 17/10 | INT (SEC xác nhận) | grep `responses/` thấy đủ 7 mã có trạng thái; Deferred có mã backlog R3 | C4 |
| R-3 | QA chạy tay A1 một lần trên stack dựng bằng `demo-up.sh` hoặc stack QA từ `21bb797`, có ghi hình hoặc chuỗi ảnh từng bước (lưu ngoài repo nếu có dữ liệu giả nhạy cảm, ghi đường dẫn và mã commit). Lượt này **làm lại trên staging** ở R-5 | QA | Tệp ghi lượt chạy tay + danh sách ảnh/video; lỗi mới có dòng bug-list | A1 (phần chạy tay) |
| R-4 | Ba điều kiện S4 có hạn "trước QC Round 2" hoặc "tuần Ổn định" còn thiếu: C3 (DOM xác nhận số BR-525-16), C8 (UXR đi lại T6, T7 PWA trên bản đã sửa P-01/P-05) | DOM, UXR | Có dòng DOM trong `responses/DOM-responses.md`; UXR bổ sung `usability-report-r2.md` mục 3.2 | Điều kiện cổng S4 |

**Đợt 2 – khi có VPS + tên miền (hạn: 3 ngày làm việc kể từ lúc INV gửi IP và tên miền):**

| # | Việc | Người làm | Đạt khi | Gỡ dòng |
|---|---|---|---|---|
| R-5 | Dựng staging theo `hosting-plan.md`: DNS, HTTPS, Caddyfile production, deploy tự động từ CI, migration là bước riêng, sao lưu hằng ngày. Bật trước cài đặt GitHub "staging chỉ deploy khi INV duyệt" (tổng kết 4.7 (1)) – INV tự bấm. Đối chiếu `hosting-plan.md` với thực tế | OPS (INV bấm duyệt) | Run CI có job staging **chạy** (không bỏ qua) và xanh; smoke `/health` qua tên miền; migration chạy thành bước riêng có log | B5, C3 |
| R-6 | Trên staging: E2E A1–A7 (bộ hiện có, trỏ tới staging hoặc chạy bộ smoke + A1/A4 UI), QA chạy tay A1 có ghi hình (R-3 lặp lại), SEC smoke SEC-G2 (header, cookie, Origin, IDOR), QA kiểm S4-15 upload qua Caddy thật, PO nghiệm thu trên staging (P-R2-7) | QA, SEC, PO | A1–A7 xanh trên staging; SEC ghi kết quả smoke; PO chuyển story lên "Xong" hoặc Trả lại có lý do | A1–A7, C1 |

Ghi chú quan trọng:
- Bước 4 chỉ được quay lại **một lần**. Nếu đợt 2 không thể bắt đầu vì chưa có VPS, cổng R2 **giữ KHÔNG ĐẠT** cho tới khi có VPS. Có cho đội bắt đầu R3 trong lúc chờ hay không là việc INV quyết (ESC-028).
- Kết quả dự kiến khi xong R-1…R-6: nhóm A, B đạt; C1 đạt nếu PO Accepted đủ trên staging, còn lại có thể ĐẠT CÓ ĐIỀU KIỆN theo mục 7 (nhóm C thiếu ≤ 2 dòng, có kế hoạch đầu R3).
- QC không khuyến nghị coi demo localhost là staging: SEC vẫn chặn link khách thật và dữ liệu thật tới khi smoke staging; nhân viên không dùng điện thoại của mình được (cổng S3 4.2–4.3).

---

## 6. Điều kiện mang sang Round 3 (giữ dù cổng R2 được chấm lại đạt)

| # | Điều kiện | Vai | Hạn |
|---|---|---|---|
| D1 | Lượt kiểm tiền riêng có critic đọc log gốc cho BUG-R2-208, 209, 210, ARC 16.31, BUG-R2-123 và khoảng hở tiền (`s4-qc-gate.md` mục 7); xếp mức lỗi tiền theo `test-strategy.md` mục 8 | ORC, QA, BE-A/B, DOM, SEC (review 208 theo `s4-SEC.md` F) | R3 Sprint 1, trước bản dùng thử |
| D2 | Giữ thủ tục OPS của 210 (không nâng tại chỗ lên ≥ 0076, cấm dựng staging từ dump, demo chỉ `demo-up.sh`) – **áp cả khi dựng staging ở R-5** | OPS, ORC | Tới khi 210 sửa |
| D3 | SEC Major dời (BE-74, 75, 79, 83, BE-84) và ESC-026 tối thiểu cảnh báo kiểu A | BE-B, BE-C, SEC, PO | Trước dữ liệu khách thật |
| D4 | C5 cổng S4: SEC đọc PWA snapshot 502/503/504 | SEC | Trước R3 Sprint 1 |
| D5 | C9: PR Dependabot đỏ (gồm 39515694829) – OPS/SEC phân loại, không gộp khi đỏ | OPS, SEC | R3 Sprint 1 |
| D6 | Ba thẻ ARC mục F (R3-Q36…Q38), US-012 AC7 (R3-Q12), US-031 AC1 (R3-Q13), logo khi INV gửi SVG | FE-A, MOB, BE-D, INT, UXD | Theo backlog 5.5 |
| D7 | Kiểm chứng với người dùng thật (ESC-003): kết quả phiếu INV để áp luật H-05; usability R3 có nhân viên thật trên điện thoại thật | UXR, INV | Trước bản dùng thử |
| D8 | BR-403 v0.3.9 mã cửa 8 số vào mã/test/chuỗi | INT, BE, QA, UXD, SEC | R3 (khi làm US-128) |
| D9 | C13: mọi báo cáo "CI/T9 xanh" dẫn lượt T9 gần nhất kèm `gh run list -L 5` | QA, DATA, ORC | Từ nay |

---

## 7. Báo lên chủ đầu tư

- **ESC-028 (mới, QC tạo)** – Round 2 chưa qua cổng QC chỉ vì chưa có staging: có cho đội bắt đầu Round 3 trong lúc chờ VPS không. Đội đề xuất A (bắt đầu R3 Sprint 1 phần không cần staging; cổng R2 chấm lại trong 3 ngày làm việc sau khi có VPS; không có bản dùng thử khi R2 chưa đạt). Bình thường, gom cuối Round 2.
- Đã có, còn chờ INV (không do QC tạo): ESC-022, 023, 024, 026, 027 và câu landing Q1–Q4. Không câu nào chặn việc chấm lại cổng R2.
- Rủi ro INV cần biết:
  1. Không có staging thì **không có bản dùng thử (RC) ở Round 3** (protocol mục 4, plan R3).
  2. Mọi kết luận khả dụng hiện là mô phỏng của đội; chưa có nhân viên thật thử.
  3. Repo công khai: tài liệu review mô tả các điểm bảo mật mức trung bình chưa sửa; đội sửa trước khi có dữ liệu khách thật (D3).

---

## 8. Số liệu Round 2 cho tổng kết

**Thẻ feedback (review chéo, `reviews/` – QC đếm bằng script trên định dạng `FB-R2-…`):**

| | Tạo | Đã xử lý (Done/Verified) | Dời có quyết định (Deferred → R3) | Chưa có trả lời |
|---|--:|--:|--:|--:|
| Blocker | 12 | 12 | 0 | 0 |
| Major | 135 | 123 | 5 | 7 (SEC-INT-07…14, R-2) |
| Minor | 190 | không đếm từng thẻ | phần dời nằm trong backlog 5.5 | – |
| Suggestion | 44 | tác giả tự cân nhắc | – | – |
| Không ghi mức | 3 | – | – | – |
| **Tổng** | **384** | | | |

- Ngoài định dạng FB: các lượt kiểm tiền đối kháng (8 lượt S4, vòng 4–8 S3), `landing-v12-critic.md`, `s4-38-findings-raw.md` dùng mã riêng – không cộng vào 384.
- Hàng chờ R3 (backlog 5.5): R3-Q01…Q38.

**Lỗi (`qa/bug-list.md`, bảng tổng sau khi QC đóng 211–213):**

| Mức | Tìm | Đã sửa/đóng | Hoãn | Còn mở |
|---|--:|--:|--:|--:|
| P0 | 11 | 11 | 0 | 0 |
| P1 | 68 | 68 | 0 | 0 |
| P2 | 79 | 76 | 1 (074) | 2 (208, 209 → R3 Sprint 1) |
| P3 | 55 | 40 | 0 | 15 (gồm 210, 123 → R3) |
| **Tổng** | **213** | **195** | **1** | **17** |

**Cổng QC trong round:** S2 ĐCĐK · S3 KHÔNG ĐẠT (bản 2) → ĐCĐK (bản 3) · S4 KHÔNG ĐẠT lần 1 (19/10), lần 2 (20/10) → ĐCĐK lần 3 (21/10) · Round 2: **KHÔNG ĐẠT** (21/10, chờ staging).

**Kiểm thử tự động trên `21bb797`:** API 104 tệp / 2.971 ca; E2E 2.045 ca (1.976 đạt, 69 bỏ qua); 0 retry ở cả push và hai lượt T9.

---

## 9. Giả định và những gì QC chưa kiểm được

Giả định:
- "Staging" ở mục 7 là môi trường cố định có tên miền, HTTPS, deploy tự động từ CI (mục 1 điểm 6, B5, `sprint-4-plan.md` 9.3). Stack CI dùng một lần và demo localhost không thay được. Biện pháp "môi trường CI dùng một lần" ở rủi ro R2-5 là cách giảm ảnh hưởng, không phải đổi tiêu chí (QC đã nêu như vậy ở cổng S3 4.2).
- Kênh OTA thật, cổng thanh toán thật, push thật, Zalo tự động là **KAD** ở R2 theo plan 2.2 và ORC K9; QC không chấm chúng.
- 8 story LP-v1 thuộc cổng riêng, không tính vào C1.
- Thẻ có tiêu đề không theo mẫu `FB-R2-…` (ví dụ ID rút gọn `S2-02` trong `responses/s2-FE.md`) được QC ghép tay với thẻ gốc.
- A7 114/114 trên `c293ceb` còn giá trị ở `21bb797` vì `product/services`, `packages` không đổi.

QC chưa kiểm được:
- Không đi luồng bằng tay trên Desk, PWA, guest-web; không chạy stack hay test DB. Mọi kết luận chạy thật lấy từ log CI QC tự tải và đọc mã/test.
- Không đọc artifact `t9-playwright-report` của 39485554354 (chỉ đọc log job).
- Không đếm trạng thái xử lý từng thẻ Minor/Suggestion.
- Staging, Caddy thật, thiết bị thật, phóng chữ 200 %, trình đọc màn hình, p95 trên VPS: chưa có môi trường.
- QC chưa chấm cổng LP-v1.
