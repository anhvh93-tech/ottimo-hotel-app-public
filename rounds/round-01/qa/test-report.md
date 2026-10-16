# Báo cáo kiểm thử – Round 1 (round tài liệu)

- Tác giả: QA | Round 1 – Bước 5 (Kiểm thử) | Ngày: 16/10/2026 | **Lượt 2/3 (kiểm lại sau vòng sửa, 16/10 chiều)**
- Căn cứ: `rounds/round-01/plan.md` mục 6 (bước 5 cho round tài liệu) và mục 7 (tiêu chí QC A1–C5); `product/docs/qa/test-strategy.md`
- Đầu vào lượt 2: `qa/fix-notes-{ARC,BA,PO,DATA,INT,OPS}.md`, `qa/sec-findings.md` (Phần B: 9 lỗi; Phần D: SEC kiểm lại và 2 lỗi mới SEC-10, SEC-11), `rounds/round-02/plan.md` (dự thảo)
- Đọc cùng: `rounds/round-01/qa/bug-list.md` (34 lỗi), `product/docs/qa/traceability.md` (sinh lại 16/10 chiều)
- **Cập nhật R2 tuần 1 (16/10, sau lần chạy thật của OPS):** TC-X-050, TC-X-065, TC-X-066 (a–c) chuyển **Đạt (chạy thật cục bộ)**; TC-X-066 (d) và CI trên GitHub vẫn **chưa có**. Chi tiết mục 9.
- Lượt 1 (sáng 16/10): 22 lỗi QA, 0 P0/P1. Nội dung lượt 1 vẫn đúng ở các mục không nhắc lại dưới đây. Bản lượt 1 lưu trong lịch sử file.

## 1. Kết luận ngắn

- **Không còn lỗi P0/P1 mở.** Lỗi P0 duy nhất (BUG-R1-SEC-01, mã cửa C3 lọt qua `renderMessage`) và lỗi P1 (BUG-R1-SEC-02, MGR sửa được tham số bảo mật) đã được ARC/BA sửa. QA đã kiểm lại trên `openapi.yaml` 0.2.1-draft và đóng cả hai. SEC cũng chấm Đạt.
- **Tổng 34 lỗi:** 20 Closed, 4 Open (P3), 10 Deferred (1 P2, 9 P3), 0 Reopened. Mọi lỗi tác giả báo Fixed đều qua khi kiểm lại. Lỗi còn Open là lỗi tác giả **chưa sửa**: BUG-R1-014, 015, phần ARC của 017, và lỗi mới 023. Cả bốn đều P3.
- **Truy vết vẫn đủ:** `gen_traceability.py --strict` → **exit 0**. 0 operation lệch quyền (lượt 1: 14). Chuyển trạng thái có TC tăng lên 102/122 (thêm K13). Tổng TC 383 (lượt 1: 374), có 9 TC mới cho các bản sửa.
- **C2 vẫn BLOCKED do môi trường:** máy vẫn chưa có node, pnpm, docker. Phần OPS sửa trong vòng này chỉ kiểm tĩnh được, và kiểm tĩnh đạt. Hai lỗi SEC-06, SEC-08 vì thế để **Deferred R2 (chờ chạy thật)**, không đóng.
- **C5:** đã có `rounds/round-02/plan.md`, nhưng là **dự thảo**, đang chờ INV trả lời ESC-012. Ba lỗi Deferred chưa có dòng theo dõi trong plan R2 (SEC-10, SEC-11, phần BE của SEC-07). QA đề nghị bổ sung (mục 7).

## 2. Phạm vi và cách kiểm lại (lượt 2)

| Hạng mục | Cách làm | Công cụ / bằng chứng |
|---|---|---|
| Kiểm lại từng lỗi Fixed | Không tin fix-notes. QA tự mở đúng tệp, đúng dòng, và grep lại chuỗi lỗi cũ. Với OpenAPI, dùng script PyYAML in ra `x-roles`, `x-scope`, `x-rbac`, `x-classification`, `x-requires-trusted-device`, `x-step-up`, `x-c3-log`, `x-after-checkout` và `responses` của từng operation liên quan. Với rbac.json, in ra `roles`/`operationIds` của A22, A110, A118, A119 | Dòng "Kiểm lại lượt 2" dưới từng lỗi trong bug-list |
| Gộp lỗi SEC | Gộp 11 lỗi `BUG-R1-SEC-01…11` vào bug-list và giữ nguyên mã. SEC-09 trùng BUG-R1-004 nên ghi Closed (trùng) | bug-list mục 1 |
| Truy vết | `python3 product/tests/tools/gen_traceability.py --strict` (ghi đè `product/docs/qa/traceability.md`) | exit 0 (mục 3) |
| Hợp lệ spec | `python3 -m openapi_spec_validator` trên `openapi.yaml` 0.2.1-draft và `openapi.test.yaml` 0.1.1-draft | Cả hai **OK** |
| Kiểm tĩnh OPS | `bash -n`, parse YAML, chạy `check-no-test-surface.sh` (cả ca đúng và ca đối chứng phải đỏ), đọc `02-roles.sh`, `Dockerfile.api`, `ci.yml`, `.env.example`, `docker-compose.yml`, `db-role.test.ts` | Mục 5 |
| C5 | Đọc `rounds/round-02/plan.md`, đối chiếu mục 3.2 với các lỗi Deferred | Mục 6, 7 |
| Test case | Thêm 9 TC cho các bản sửa. Bỏ ghi chú lệch ở TC-L2-074. Bỏ giả định ở TC-SEC-008. Sửa số đếm "74" → "77" trong test-strategy và đầu tệp test case (phần QA của BUG-R1-017) | `r1-main-flows.md` v0.2.2 |
| Không làm | Không chạy ứng dụng, CI, E2E, PostgreSQL hay Docker (không có công cụ). Không sửa tệp của vai khác | – |

## 3. Chỉ số truy vết (sinh lại 16/10 chiều)

| Chỉ số | Lượt 2 | Lượt 1 |
|---|---|---|
| Story Must R2 có đủ TC · endpoint · wireframe · ERD | **77/77** | 77/77 |
| AC có ≥ 1 TC (chạy được ở R2) | **267/267** | 267/267 |
| Tổng TC | **383** (Cao 233 · TB 144 · Thấp 6), Smoke **42** | 374, Smoke 39 |
| TC mới | TC-NT-039 (`CAPACITY_BELOW_BOOKINGS`), TC-RB-027 (HK/MT không gọi `listRooms`, MT xem `listHkTasks`), TC-SEC-026 (`renderDoorCodeMessage`), TC-SEC-027 (`renderMessage` từ chối mẫu C3), TC-SEC-028 (A119 + biên tham số bảo mật), TC-SEC-029 (link chờ), TC-SEC-030 (app khách sau trả phòng), TC-X-065 (4 vai DB), TC-X-066 (chặn `__test__`) | – |
| Chuyển trạng thái có TC | **102/122** (thêm K13). `bad SM refs: []` | 101/121, 1 tham chiếu sai |
| BR được tham chiếu | 150/150. Còn 31 BR có story nhưng chưa có TC (R3) | = |
| Lỗi BL 8.2 có TC chống tái phát | 26/30 (thiếu #11, #14, #22, #25, đều thuộc R3) | = |
| rbac ↔ OpenAPI: operation lệch / trường lệch / mã lạ | **0 / 0 / 0** | 14 / 0 / 0 |
| `operationId` lạ / TC trùng / tham chiếu sai | 0 / 0 / 0 | = |

## 4. Kết quả kiểm lại theo lỗi

| Nhóm | Lỗi | Kết quả |
|---|---|---|
| SEC P0/P1 | SEC-01, SEC-02 | **Closed.** Bằng chứng trong bug-list (thuộc tính operation, biên 8/8 khóa khớp SEC, rbac A119) |
| Tài liệu P2 | 001, 002, 003, 004, 005, 006, 007, SEC-03 | **Closed**, 8/8 |
| Tài liệu P3 | 011, 012, 018, 019, SEC-04, SEC-05, SEC-09 | **Closed**. 019 còn sót 1 chỗ nhỏ (state-machines dòng 113), không gây hiểu sai, nên không mở lại |
| Chưa sửa | 014 (ví dụ `billNo` cũ), 015 (`WO-031`), 017 phần ARC (OpenAPI "74 story") | **Open**, P3. Theo dõi ở plan R2 W11 |
| Mới lượt 2 | 023 (rbac.json còn ghi chú và mục `differences` cũ) | **Open**, P3, giao BA |
| Mới từ SEC | SEC-10 (P2), SEC-11 (P3) | **Deferred R2**. SEC-10 có hạn: phải xong trước khi BE cài A21. QA đã tự xác nhận bằng script |
| Đã sửa, chờ chạy thật | SEC-06, SEC-08 | **Deferred R2**. Kiểm tĩnh đạt. Đóng khi CI xanh lần đầu (W4) |
| Dời có kế hoạch | 010 (W1), 016 (W6), 021 (W5), SEC-07 phần BE; 020, 022 (R3) | **Deferred** |

Bảng số lỗi theo mức và trạng thái:

| Mức | Tổng | Open | Reopened | Closed | Deferred |
|---|---|---|---|---|---|
| P0 | 1 | 0 | 0 | 1 | 0 |
| P1 | 1 | 0 | 0 | 1 | 0 |
| P2 | 11 | 0 | 0 | 10 | 1 |
| P3 | 21 | 4 | 0 | 8 | 9 |
| **Tổng** | **34** | **4** | **0** | **20** | **10** |

## 5. Kiểm kỹ thuật (lượt 2)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Công cụ trên máy | **Chưa có** | `which node pnpm docker` (16/10 chiều): `node not found`, `pnpm not found`, `docker not found` |
| TC-X-050 (`docker compose up` + `GET /health`) | ~~BLOCKED (môi trường)~~ → **Đạt (chạy thật cục bộ, 16/10 R2 W1)** | Xem mục 9 |
| CI khung, TC-X-065 (vai DB), TC-X-066 (bundle không có `__test__`) | ~~BLOCKED~~ → TC-X-065 **Đạt**, TC-X-066 (a)(b)(c) **Đạt**, (d) **chưa chứng minh được**; CI GitHub **chưa chạy** (16/10 R2 W1) | Các bước CI chạy cục bộ đủ (OPS `w1-skeleton-run.md`); lockfile đã có. Xem mục 9 |
| OpenAPI hợp lệ | **Đạt** | openapi-spec-validator: `openapi.yaml` 0.2.1-draft OK; `openapi.test.yaml` 0.1.1-draft OK |
| `bash -n` | **Đạt** | `infra/postgres/init/02-roles.sh`, `infra/ci/check-no-test-surface.sh` |
| YAML | **Đạt** | `.github/workflows/ci.yml` (5 job: build-test, test-surface-guard, contract-lint, secrets-scan, docker-build), `infra/docker-compose.yml` |
| `check-no-test-surface.sh` | **Đạt** | `spec docs/api/openapi.yaml` → exit 0. `spec docs/api/openapi.test.yaml` (đối chứng) → exit 1, chỉ ra `/__test__/clock` và `/__test__/jobs/{jobKey}/run`. `bundle services/api/src` → exit 0 |
| Đổi sang 4 vai DB (đọc tĩnh) | **Đạt (tĩnh)** | Đủ 3 điểm. (1) `ottimo_owner NOLOGIN PASSWORD NULL`; migrator `NOINHERIT` + `GRANT … WITH INHERIT FALSE, SET TRUE`, cú pháp này cần PG ≥ 16, và cả CI service, smoke lẫn compose đều ghim `postgres:17-alpine` cùng digest. (2) `.env.example`, compose và `ci.yml` đều dùng `ottimo_migrator`/`OTTIMO_MIGRATOR_DB_PASSWORD`; không còn `OTTIMO_OWNER_DB_PASSWORD`, trừ hướng dẫn chuyển volume cũ. (3) `Dockerfile.api` xóa `dist/test-support` khi `INCLUDE_TEST_SUPPORT=0`, trước `pnpm deploy`; compose dev build với `1` |
| Bí mật thật / `.env.example` | **Đạt (tĩnh)** | Placeholder mới `change_me_migrator_dev_only`, `ci_migrator_only`. `GUEST_CODE_SIGNING_KEY` để trống. SEC dò lại: không có bí mật thật |

Rủi ro kiểm tĩnh không bắt được (QA ghi để kiểm khi có Docker):
- `REVOKE ottimo_owner FROM ottimo_app` khi chưa là thành viên chỉ báo WARNING, không lỗi. Cần xác nhận trên PG 17 thật.
- Bước bundle trong `docker-build` phụ thuộc đường dẫn `/app/dist` của image.
- `ottimo_readonly` NOLOGIN chặt hơn erd 2.1. ARC sửa lời erd, SEC chấp nhận.

## 6. Kết quả theo tiêu chí QC (plan mục 7) – đánh giá của QA, lượt 2

Đây là đánh giá tham khảo. QC là bên quyết định. "Sơ bộ" nghĩa là QA chỉ kiểm sự tồn tại và số đếm, chưa đọc kỹ nội dung.

| Dòng | QA đánh giá | Bằng chứng / thay đổi so với lượt 1 |
|---|---|---|
| A1 | Đạt (sơ bộ) | 11/11 `outputs/<VAI>/report.md` đủ 5 mục. Không đổi |
| A2 | Đạt (sơ bộ) | PRD mục tiêu G1–G5, chỉ số S1–S7. Không đổi |
| A3 | **Đạt** | 145 story đúng mẫu. 77/77 Must R2 có ≥ 2 AC, 267/267 AC có Given/Then. US-136 AC4 nay khớp SM-05 K12 (BUG-R1-002 Closed) |
| A4 | Đạt (sơ bộ) | Epic EP00–EP18. Không đổi |
| A5 | **Đạt** | 30/30 lỗi BL 8.2 đã phân loại; 26/30 có TC (4 thuộc R3) |
| A6 | Đạt (sơ bộ) | `open-questions-resolution.md`; 12 ESC |
| A7 | **Đạt** | rbac 0.2.1: thêm A119 (tham số bảo mật, chỉ OWN), A22 bỏ SAL, A110 chỉ OWN, ghi chú 25a. 0 lệch `x-roles`, 0 lệch `x-visible-to`. Còn ghi chú cũ trong rbac.json (023, P3) |
| A8 | **Đạt** | SM-05 đủ K1–K13 (BUG-R1-001, 018 Closed). 0 tham chiếu chuyển sai |
| A9 | **Đạt** | 10 wireframe. Hai mã lỗi của L10 đã vào hợp đồng (007 Closed). Còn `WO-031` (015, P3) |
| A10 | Đạt (sơ bộ) | Design system + tokens sáng/tối |
| A11 | **Đạt** | ERD v0.2.1 và OpenAPI 0.2.1-draft (hợp lệ) phủ 77/77 story; ADR-010 chi phí |
| A12 | Đạt (sơ bộ) | `integrations.md`; README INT nay dùng `APP_ENV` đúng (004 Closed) |
| A13 | **Đạt** | test-strategy, 383 TC (Smoke 42), traceability sinh lại, `--strict` exit 0 |
| A14 | **Đạt** | SEC: 33/33 SEC-R1 (32 Đạt, 1 có điều kiện), 25/25 thẻ Blocker/Major Đạt; P0/P1 SEC đã đóng (sec-findings Phần A, D) |
| A15 | **Đạt** | K-22a dùng mã BR-308 v0.2 (003 Closed) |
| A16 | Đạt (sơ bộ) | Persona/hành trình có nhãn mô phỏng |
| B1 | **Đạt** | 0 lỗi P0/P1 mở. Lệch còn lại là P3 về chữ/ví dụ (014, 015, 017, 023) |
| B2 | **Đạt** | US-136 AC4 đã khớp máy trạng thái. Không wireframe nào cho vai làm hành động RBAC cấm (đọc tay 4/10 trang). Contract quyền khớp rbac (0 lệch) |
| B3 | **Đạt có ghi chú** | Tài liệu BA dẫn BR-010 (019 Closed; còn 1 chỗ nhỏ ở state-machines dòng 113). Ví dụ trong OpenAPI còn mẫu mã cũ (014, 016 – P3) |
| B4 | Đạt (sơ bộ) | Giả định có nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` |
| B5 | **Đạt (tĩnh)** | Không có bí mật thật; placeholder mới hợp allowlist. Gitleaks trên lịch sử git cần CI |
| C1 | **Đạt** | 0 ô trống trong ma trận 77 story × (TC, endpoint, wireframe, ERD) |
| C2 | **BLOCKED (môi trường)** → cập nhật 16/10 R2 W1: **Đạt một phần** | `/health` OK chạy thật (compose + Caddy), 4 vai DB đúng, test 28→35 xanh có DB, bundle/spec sạch. **Còn thiếu**: link một lần chạy CI GitHub xanh đủ 5 job (chưa có repo – ESC-013 phương án B) |
| C3 | Đạt (sơ bộ) | ADR-009/erd (chống trùng), mã duy nhất, OOO chặn bán, job, múi giờ. Thêm: kiểm soát C3 cho mẫu tin mã cửa (SEC-01) |
| C4 | **Đạt** | Thẻ Blocker/Major đều đã trả lời (lượt 1). Vòng sửa lỗi: 6 vai có fix-notes (ARC, BA, PO, DATA, INT, OPS); mọi lỗi báo Fixed đều qua kiểm lại, 0 Reopened. UXD chưa sửa BUG-R1-015 (P3, theo dõi W11) |
| C5 | **Đạt có điều kiện** | Đã có `rounds/round-02/plan.md` (dự thảo, PO + ORC, 16/10): mục tiêu, phạm vi R-C, phân việc, việc chuyển từ R1 (W1–W14), tiêu chí QC R2. Điều kiện: (1) chờ INV trả lời ESC-012 rồi chốt; (2) bổ sung 3 lỗi Deferred chưa có dòng theo dõi (mục 7) |

Nhận định của QA về cổng QC: nhóm A và B đạt theo đánh giá của QA. Nhóm C thiếu C2 (BLOCKED do môi trường) và C5 (mới là dự thảo). Hai dòng này khớp ngưỡng "ĐẠT CÓ ĐIỀU KIỆN" nếu có kế hoạch xử lý đầu R2, và kế hoạch đó đã có: W4 cho C2, ESC-012 cho C5. QC quyết định.

## 7. Đề xuất (theo thứ tự)

1. **PO/ORC (plan R2 mục 3.2):** thêm dòng theo dõi cho 3 lỗi chưa có chỗ trong plan:
   - BUG-R1-SEC-10 (P2, ARC + SEC + BE): step-up, `x-c3-log`, 401/403 cho `getDoorCredential`/`setDoorCredential`. **Hạn: trước khi BE cài A21.**
   - BUG-R1-SEC-11 (P3, ARC): gộp vào W2.
   - BUG-R1-SEC-07 phần BE (`REQUIRED_SECRETS`): gộp vào W9 hoặc việc BE SR-GST.
   - Thêm BUG-R1-023 vào W11. Sửa W2 "Rà 14 operation lệch": nay đã 0 lệch, còn lại phần `x-rbac-field`.
2. **ARC (W11):** BUG-R1-014 (ví dụ `billNo` + `pattern`) và phần còn lại của BUG-R1-017 (`openapi.yaml` dòng 134). **UXD:** BUG-R1-015. **BA:** BUG-R1-023.
3. **OPS (W4, W5):** chạy CI thật lần đầu, sau đó QA đóng SEC-06 và SEC-08 và chạy TC-X-050, 065, 066. Thêm job `api-contract` (`--strict` + openapi-spec-validator).
4. **QA:** khi làm W5, thêm vào `gen_traceability.py --strict` luật SEC-11: operation đọc C3 phải có `x-c3-log`; có `x-requires-trusted-device` phải khai 403; có `x-step-up` phải khai 401. Làm W6 (quy ước mã DS-0, BUG-R1-016). Mở rộng TC-SEC-010 và TC-SEC-026 khi ARC sửa SEC-10.

## 8. Rủi ro còn lại

- C2 chưa có bằng chứng chạy. Script vai DB mới (cú pháp PG 16+), job `test-surface-guard` và bước bundle mới chỉ được kiểm tĩnh.
- Mới đọc tay 4/10 wireframe ↔ RBAC. Các trang L2, L3, L4, L7, L8, L9 chỉ được kiểm gián tiếp.
- Cột ERD trong ma trận chưa chứng minh đủ cột cho từng AC.
- SEC-10 là kẽ hở C3 trên giấy. Nếu không sửa contract trước khi BE cài A21, đường xem mã cửa sẽ không có step-up.

## 9. Cập nhật R2 tuần 1 (16/10) – chạy thật TC-X-050, TC-X-065, TC-X-066

Nguồn: lần chạy thật của OPS (`rounds/round-02/outputs/OPS/w1-skeleton-run.md`, Node 22.23.3, pnpm 9.15.4, Docker 29.8.2 + Compose v5.5.0 trên OrbStack, PostgreSQL 17.11) và **QA tự chạy lại** cùng ngày trên cùng máy (`rounds/round-02/outputs/QA/w1-report.md` mục 3). Trạng thái chỉ chuyển "Đạt" khi có ít nhất một lần chạy QA tự làm hoặc tự đọc được log chi tiết.

| TC | Kết quả OPS | QA tự chạy lại (16/10) | Trạng thái |
|---|---|---|---|
| TC-X-050 (a) api `/health` | 200 `{"status":"ok","db":"ok","time":"…+07:00"}` | Playwright `TC-X-050a` **pass** (200, `db: ok`, `time` đúng `+07:00`) | **Đạt** |
| TC-X-050 (b) qua Caddy `:8081/health` | 200 | Playwright `TC-X-050b` **pass** | **Đạt** |
| TC-X-050 (c) dừng PostgreSQL → 503, bật lại → 200 | 503 `{"status":"error","db":"down"}` → 200 | **Không chạy lại**: PostgreSQL dev đang được vai khác dùng song song (có phiên `ottimo_admin` mở). Ca `TC-X-050c` có sẵn trong Playwright, bật bằng `E2E_COMPOSE_CONTROL=1` | **Đạt (theo log OPS)** – QA chạy lại khi có stack riêng / trên CI |
| TC-X-065 vai DB | Bảng thuộc tính 4 vai đúng; owner đăng nhập → `FATAL … not permitted to log in`; volume cũ được đưa về đúng 4 vai | `pnpm test` với `DATABASE_URL` (ottimo_app) + `MIGRATION_DATABASE_URL` (ottimo_migrator) trên `ottimo_test`: `db-role.test.ts` 5/5 pass, **0 skipped**; api 35/35. `psql -U ottimo_owner` → `FATAL: role "ottimo_owner" is not permitted to log in`. `pg_roles`: app/migrator LOGIN, không super, không BYPASSRLS, NOINHERIT; owner NOLOGIN; readonly NOLOGIN BYPASSRLS | **Đạt**. Phần "chạy lại script trên volume cũ" theo log OPS (QA không phá volume dùng chung) |
| TC-X-066 (a) `spec openapi.yaml` | exit 0 | exit 0 `OK: … has no /__test__ path` | **Đạt** |
| TC-X-066 (b) `spec openapi.test.yaml` (đối chứng) | exit 1 | exit 1, chỉ ra `/__test__/clock`, `/__test__/jobs/{jobKey}/run` | **Đạt** |
| TC-X-066 (c) image mặc định, `bundle /app/dist` | exit 0 | Chép `/app/dist` từ image `ottimo-api:ci` → exit 0 `OK: no test-only code` | **Đạt** |
| TC-X-066 (d) image `INCLUDE_TEST_SUPPORT=1` → phải exit 1 | exit 0 (chưa có `src/test-support/`) | Image `ottimo-api:dev` (build arg = 1) → exit 0, vì `services/api/src` chưa có `test-support` | **Chưa chứng minh được** – chờ BE merge TestSupportModule (không phải lỗi) |
| CI GitHub (5 job) | Chưa chạy (chưa có repo) | – | **Chưa có** – ESC-013 phương án B (INV tạo repo). Không báo xanh |

Hệ quả cho lỗi: BUG-R1-SEC-06 (vai DB) và phần spec/bundle của BUG-R1-SEC-08 đủ bằng chứng chạy thật cục bộ – **SEC quyết đóng** (đề nghị đóng SEC-06; SEC-08 giữ mở phần (d)). BUG-R1-016 (mã DS-0): QA chốt quy ước nhãn seed (test-strategy 0.3 mục 4.5) → chuyển **Fixed (quy ước)**, đóng khi loader của BE nạp DS-0 khớp `expectedCode`.

