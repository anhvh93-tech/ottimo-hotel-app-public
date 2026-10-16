# Kiểm thử lại toàn bộ – Round 2, Sprint 2 (sau bước Phản hồi & sửa)

- Người chạy: QA | Ngày: 16/10/2026 | Không commit
- Bản kiểm: HEAD `7d42218` ("Sprint 2 response & fix") + cây làm việc hiện tại. Sau khi ORC báo BE-A, BE-B, FE xong, `product/` chỉ còn khác HEAD ở phần test/seed của QA.
- OpenAPI 0.3.5-draft (bản cuối Sprint 2, A-01…A-28)

## 1. Cách chạy (giống CI)

1. Stack dùng một lần `COMPOSE_PROJECT_NAME=ottimo-qa-s2`:
   - build `api` + `web` từ cây làm việc;
   - `.env` sinh bằng `infra/ci/make-ci-env.sh`;
   - cổng 25432 / 23000 / 28081–28083, image `:qa-s2`.
2. Mỗi lượt dựng mới: `down --volumes` → `up --wait` (migrate) → `run --rm seed` (DS-E mới: một kênh `direct`, thêm 4 tham số – loader nạp được, `warnings: []`).
3. Biến môi trường: `CI=true`, `E2E_COMPOSE_CONTROL=1` (+ `E2E_COMPOSE_PROJECT/FILE/ENV_FILE` trỏ stack QA), `E2E_API_URL`, `E2E_WEB_URL`, `E2E_ORIGIN`.
4. Lệnh: `playwright test -c e2e/playwright.config.ts`, đủ mọi project. Thư mục kết quả `tests/e2e/test-results`; không tạo `tests/test-results` (đã xóa một thư mục do lần dò tạm của QA để lại).
5. Kiểm tĩnh:
   - `gen_traceability.py --strict` **exit 0** (402 TC, AC **251/251**, ops mismatched 0);
   - `gen_rbac_cases.py --check` **OK** (181 operation, 1991 ca);
   - `validate-fixtures` **0 lỗi**;
   - `tsc`, `eslint`, `prettier` xanh.
6. Ngoài phạm vi E2E: kiểm lại BUG-R2-009 bằng `pnpm --filter ./apps/admin-web test` → **108/108**.

## 2. Kết quả

Lượt 1 có 3 ca trượt; phân tích ở mục 3. Đã sửa phần thuộc QA, ghi 1 lỗi mới cho BE. Hai lượt cuối liên tiếp, mỗi lượt trên stack mới, cho kết quả giống nhau:

| Project | Đạt | Trượt | Bỏ qua | Phải trượt (lỗi Open) |
|---|---|---|---|---|
| smoke | 2 | 0 | 23 | – |
| rbac (Sprint 1 + Sprint 2) | 660 | 0 | 132 | – |
| api | 96 | 0 | 19 | 1 (BUG-R2-023) |
| limits | 2 | 0 | 1 | – |
| rbac-logout | 11 | 0 | 0 | – |
| clock | 9 | 0 | 1 | – |
| db-outage | 1 | 0 | 0 | – |
| desk-chromium (UI) | 0 | 0 | 18 | – |
| **Tổng (976)** | **781** | **0** | **194** | **1** |

0 flaky ở hai lượt cuối (lượt 7 và 8).

**Phạm vi Sprint 2 chạy thật và đạt:**
- **Chống đặt trùng:**
  - TC-L2-021: 8 yêu cầu song song × 20 vòng, mỗi vòng đúng 1 thành công; bên thua `409 ROOM_UNAVAILABLE` hoặc `409 CONCURRENT_UPDATE` kèm `Retry-After`;
  - TC-X-001: 50 song song → 1 × 201, 49 × 409, 0 lỗi 5xx;
  - TC-X-002, TC-X-003.
- **Đặt phòng và hủy:**
  - tạo/sửa/hủy đơn, Idempotency, AC5a, ở tối thiểu, cửa sổ đặt, sàn–trần, giá OTA mặc định;
  - TC-L2-082: BR-107 tính lại khi đổi số đêm (4.079.000 ↔ 5.205.000);
  - TC-L2-053 (b): hủy thật thì folio đảo tiền phòng, có 1 dòng phí hủy 350.000, còn phải thu −350.000 (khoản hoàn chờ duyệt).
- **Khóa phòng OOO:** TC-L2-030…033, TC-L6-041 (`conflicts[]` ẩn mã đơn với MT).
- **Đơn OTA trùng căn:** làn "Chưa gán căn", gán căn → `resolved`; gợi ý chỉ cùng nhóm hoặc nhóm cao hơn.
- **Báo giá, giữ chỗ, cọc:**
  - TC-L5-001…006: số liệu khớp oracle;
  - giữ chỗ, gia hạn, A-13 (cọc thiếu → 200, đơn vẫn `hold`), `HOLD_LIMIT_REACHED`, `dryRun` bị từ chối;
  - `extendQuote`: SAL → 202, MGR → 200, báo giá còn hiệu lực → 409.
- **Project clock (MutableClock):**
  - J1 hết hạn giữ chỗ, đúng biên 1 giây;
  - giữ chỗ đã có tiền không tự hủy;
  - J3 / BR-304-01, BR-304-02;
  - dòng thời gian no-show: đánh dấu, đảo folio, khôi phục BR-315-01, cần duyệt BR-315-02;
  - J9 theo ngày nghiệp vụ 06:00.
- **Runner quyền Sprint 2:** 363 ca đạt (gồm `extendQuote`, `listCloserCandidates`, `getBookingRules`).

**Bỏ qua (194), đều có lý do ghi trong ca:**

| Lý do | Số ca |
|---|---|
| Smoke đang chờ tính năng Sprint 3+ | 23 |
| Runner quyền: R3 (2FA) | 44 |
| Runner quyền: operation chưa có (`addPartyMember`/`listParty`, `changeRoom` – Sprint 3; `listAttentionItems`/`listMyNotifications` – Sprint 4; `listC3AccessLog`, `setMyApprovalPin`, `stepUp` – Sprint 3) | 88 |
| `listHkTasks` (BR-812 phần việc HK – Sprint 4). Phần `extraGuestCount` + phụ thu folio của các ca này chạy và đạt trước bước skip | 7 |
| Ca Sprint 1 chờ folio/FOC/DS-0 | 10 |
| TC-SEC-024 (stack compose không đặt origin) | 1 |
| TC-L2-079 (a): `fixme` – chưa viết lại theo ARC mục 3.3 | 1 |
| TC-L5-028 (J2 + "Cần chú ý" – Sprint 4) | 1 |
| TC-NT-043 (b): cần `E2E_CLOCK_CONTROL=1` – thiết kế giữ nguyên như CI | 1 |
| UI chờ `E2E_UI` + trình duyệt | 18 |

## 3. Lỗi tìm thấy ở lượt 1 và cách xử lý

| Ca | Phân loại | Xử lý |
|---|---|---|
| TC-L2-080 (a): kênh CTV không người chốt → 201 | **Lỗi server – BUG-R2-023 (P2, mới)**. Tái hiện thêm: người chốt sai loại, nguồn `sales_staff` không người chốt → đều 201 | `test.fail` kèm mã lỗi |
| TC-L6-041: MT không thấy mã đơn trong `conflicts[]` | Lỗi test: hành vi mới SEC-23 (ẩn mã đơn/tên với SAL/CTV/MT) | Sửa kỳ vọng |
| TC-L2-053 (b): `balanceDueVnd` = −350.000 | Lỗi test: EP03-05 1.1 – còn phải thu = Σ dòng − Σ thu = 350.000 − 700.000 (khoản hoàn chờ duyệt) | Sửa kỳ vọng |
| Flaky (lượt 2–6): TC-L2-022, TC-L2-021 (lần dò cọc), TC-L2-033, TC-L5-015 (BR-304-02); TC-NT-008 bị bỏ qua một lần | Lỗi harness – BUG-R2-024 (QA, Closed): ca song song chiếm cùng căn – đêm; ngày 1 đêm rơi T6/T7; dò endpoint lưu kết quả 404 tạm thời | Chọn lại khoảng khi bị chiếm; TC-L2-033 kiểm `reason = blocked`; ngày T2–T5; dò endpoint thử lại và không lưu kết quả âm |

## 4. Kiểm lại lỗi (bug-list)

| ID | Mức | Kết quả kiểm lại | Trạng thái mới |
|---|---|---|---|
| BUG-R2-017 | P2 | TC-L2-012 (b): Booking bỏ trống giá → 870.000 / 870.000 / 760.000 | **Closed** |
| BUG-R2-018 | P2 | TC-L2-013: 0, 529.000, 1.901.000 bị chặn; 530.000, 1.900.000 được | **Closed** |
| BUG-R2-019 | P3 | Trùng đêm không kèm cọc → 409 trước cọc | **Closed** |
| BUG-R2-020 | P3 | Đơn 402 chỉ được gợi ý nhóm NPLUS | **Closed** |
| BUG-R2-021 | P3 | `hold.expire`, `ooo.activate` chạy đúng tên, đã bỏ alias | **Closed** |
| BUG-R2-005 | P1 | TC-NT-008 (thứ tự kiểm) đạt | **Closed** |
| BUG-R2-006 | P1 | Ảnh `ottimo-web` build xanh từ cây làm việc | **Closed** |
| BUG-R2-015 | P1 | CI/stack nạp seed DS-E; E2E chạy đủ | **Closed** |
| BUG-R2-007 | P2 | TC-NT-012: 36 → 422 | **Closed** |
| BUG-R2-008 | P2 | SAL tra SĐT khách người khác → `match: possible_duplicate` | **Closed** |
| BUG-R2-009 | P2 | admin-web 108/108 | **Closed** |
| BUG-R2-011 | P3 | `displayName` có `(`, `_`, `@` → 422 `NAME_INVALID` | **Closed** |
| BUG-R2-016 | P2 | 8 lượt chạy, `db-outage` chạy cuối, 0 lỗi 5xx | **Closed** |
| BUG-R2-001…003 | P2/P3 | BE test đọc oracle mới, repo xanh | **Closed** |
| BUG-R2-010 | P3 | FE báo đã sửa + test đơn vị; chưa kiểm bằng trình duyệt | Fixed (chờ UI E2E) |
| BUG-R2-014 | P3 | Vẫn tái hiện: reset tiền tố `qa.locked` → `{users:1}`, `qa.locked` đăng nhập 200 (chỉ endpoint test-support, dev/staging) | **Open** |
| **BUG-R2-023** | **P2** | Mới – người chốt không được kiểm theo kênh/nguồn (US-017 AC9) | **Open** |
| BUG-R2-024 | P3 | Mới – harness flaky (QA), đã sửa và kiểm 2 lượt sạch | Closed |

**Lỗi còn mở theo mức:**

| Mức | Open | Danh sách |
|---|---|---|
| P0 | 0 | – |
| P1 | 0 | – |
| P2 | 1 | BUG-R2-023 (BE-A) |
| P3 | 1 (+1 Fixed chờ kiểm UI) | BUG-R2-014 (BE-A, test-support); BUG-R2-010 Fixed |

## 5. Đề xuất cho QC

**Đề xuất: sẵn sàng chuyển QC cho phần Sprint 2, kèm 1 điều kiện.**
- Không còn lỗi P0/P1 mở (QC B2 đạt).
- E2E chạy thật trên stack sạch: 0 trượt, 0 flaky ở hai lượt liên tiếp.
- Tiêu chí A3 (chống đặt trùng đồng thời + hết hạn giữ chỗ theo job) đạt bằng test tự động.
- Traceability `--strict` exit 0.

Điều kiện: **BUG-R2-023 (P2)** – thiếu kiểm người chốt theo US-017 AC9 (AC Must R2, ảnh hưởng hoa hồng). Đề nghị BE-A sửa trước khi PO nghiệm thu US-017. Nếu không kịp, ghi vào kế hoạch xử lý P2 (QC B2 cho phép P2 Open có kế hoạch). Ca TC-L2-080 đang `test.fail`: khi sửa xong sẽ tự báo "đã đạt" để QA gỡ dấu và đóng lỗi.

Lưu ý cho QC – phần chưa có bằng chứng tự động ở bước này (không thuộc Sprint 2 hoặc chờ vai khác):
- UI admin-web chưa chạy E2E bằng trình duyệt (`E2E_UI`, máy chưa cài trình duyệt Playwright – QC C2/axe chưa có số liệu);
- việc HK của BR-812 (`listHkTasks`, Sprint 4);
- "Cần chú ý" và J2/J6/J7 (Sprint 4);
- TC-L2-079 (a) chưa viết lại theo ARC 3.3.

## 6. File sửa ở lượt này
- E2E:
  - `product/tests/e2e/support/{api.ts (isAvailable), s2.ts (WindowTakenError)}`
  - `product/tests/e2e/api/{booking-conflicts, concurrency, room-blocks, s2-fix}.api.spec.ts`
  - `product/tests/e2e/clock/hold-expiry.clock.spec.ts`
- Báo cáo: `rounds/round-02/qa/bug-list.md` (đóng 16 lỗi, thêm BUG-R2-023, BUG-R2-024, bảng tổng), `rounds/round-02/qa/s2-retest.md` (file này).
- Stack `ottimo-qa-s2` đã dọn sau khi chạy.
