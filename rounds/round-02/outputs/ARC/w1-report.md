# ARC – Round 2, Tuần 1 (Đợt 0): việc chuyển từ R1

- Vai: ARC | Ngày: 16/10/2026 | Phạm vi: R-C (INV đồng ý ESC-012) | **Không commit** (theo chỉ đạo ORC)
- Đầu vào: `rounds/round-02/plan.md` mục 3.2 (W1, W2, W11, W15, W16) và dòng ARC mục 4; `rounds/round-02/outputs/OPS/w1-skeleton-run.md` (Redocly 24 lỗi, nâng phiên bản); `rounds/round-02/outputs/BE/w1-report.md` (G1–G3, G6 – ORC chuyển tiếp); `rounds/round-01/qa/bug-list.md`, `sec-findings.md` (SEC-10, SEC-11, SEC-06)
- Công cụ kiểm: `openapi-spec-validator` (Python), `npx @redocly/cli@1.34.21 lint` (đúng phiên bản job `contract-lint`), `python3 product/tests/tools/gen_traceability.py --strict`
- OpenAPI: **0.2.1-draft → 0.3.0-draft** (chỉ thêm, không đổi/xóa đường dẫn hay trường cũ; 141 → 156 path, 123 → 133 schema, 182 operation)

## 1. Bảng trạng thái

| # | Việc | Trạng thái | Bằng chứng |
|---|---|---|---|
| W1 | Endpoint + enum nhóm đơn SM-16 và đóng ca SM-17 (hợp đồng, code R3) – BUG-R1-010 | **Xong** | Tag `reservation-groups` 9 operation (`x-stories: [US-140]`): `listReservationGroups`, `createReservationGroup` (G1, BR-321 tạo cả nhóm trong một giao dịch), `getReservationGroup`, `addReservationGroupMember`/`removeReservationGroupMember` (G4), `allocateGroupDeposit` (G2, BR-322, Σ phân bổ = tiền giao dịch), `cancelReservationGroupMember` (G3, BR-324), `cancelReservationGroup` (G3 × n → G5), `issueGroupBill` (BR-325). Tag `shifts` 8 operation (`x-stories: [US-124]`): `listShifts`, `openShift` (C1), `getMyCurrentShift`, `getShiftReport` (BR-526 a–d), `startShiftClosing` (C2), `reopenShift` (C4), `closeShift` (C3), `reviewShift` (C5). Enum `ReservationGroupStatus [open, closed]`, `ShiftStatus [open, closing, closed]`; schema `ReservationGroup(Summary)`, `ReservationGroupCreate`, `PaymentAllocation`, `GroupDepositInput`, `Shift`, `ShiftReport`; tham số `GroupId`, `ShiftId`; `Reservation.groupId`, `Payment.shiftId`, `Payment.reservationGroupId`; 4 mã lỗi `SHIFT_ALREADY_OPEN`, `SHIFT_NOT_OPEN`, `SHIFT_VARIANCE_REASON_REQUIRED`, `GROUP_ALLOCATION_MISMATCH`. Mọi operation `x-round: R3`, có `x-transition` G1–G5/C1–C5. Soát tự động: US-140 → 9 op, US-124 → 8 op |
| W2 | Giữ 0 lệch `x-roles` ↔ rbac; phủ `x-rbac-field` mọi thuộc tính nhạy cảm | **Xong** (QA xem lại phần sửa script) | `x-rbac-field`: **16 → 115 thuộc tính** (D01–D07, D09, D10, D12a, D12c, D14, D16, D19, D20, D22, D23, D25, D27, D28, D29) gồm toàn bộ `GuestInput`, `GuestDocumentInput/Sensitive/Masked`, `PartyMemberCreate`, `InvoiceRequest`, `GuestSummary`, tên khách trên rack/bill/danh sách, ảnh giấy tờ (D06), token link (D25)… `gen_traceability.py --strict` **exit 0**: `ops mismatched 0; fields mismatched 0; unknown codes []`, `x-rbac-field: tagged 115; untagged []; unknown codes []`. Script nâng cấp (mục 2.2) – đối chứng: đổi `GuestSummary.phoneMasked` sang D03 → `fields mismatched 1`, mã lạ D99 → `unknown codes [('code','D99')]`, **exit 1** |
| W11 | BUG-R1-014 (ví dụ `billNo` cũ) | **Fixed – chờ QA kiểm lại** | Schema mới `BillNo { pattern: '^F\d{2}-\d{6,}$', example: F26-000123 }`; `getBill`… `billNo` và `Folio.billNo` dùng `$ref BillNo`. `grep "F-261022\|F-yymmdd" openapi.yaml` → 0 |
| W11 | BUG-R1-017 phần ARC ("74 story") | **Fixed – chờ QA kiểm lại** | `info.description` mục "Phạm vi bản nháp": "Phủ cả **77 story Must R2** của backlog bản R1 … sau R-C còn **72 Must R2** … operation của 5 story dời giữ trong hợp đồng". `grep "74 story" openapi.yaml` → 0 |
| W15 | Step-up + `x-c3-log` + 401/403 cho `getDoorCredential`/`setDoorCredential` (BUG-R1-SEC-10, P2) | **Fixed – chờ SEC kiểm** (đã xong trước khi BE cài A21) | `getDoorCredential`: `x-step-up: true`, `x-c3-log {door_credential, view}`, response `401` (REAUTH_REQUIRED), `403` (DEVICE_NOT_TRUSTED/FORBIDDEN_ACTION), `404`, `429`; mô tả thứ tự kiểm + ghi log trước khi trả + chung bộ đếm rate limit với `renderDoorCodeMessage`. `setDoorCredential`: `x-step-up: true`, `x-c3-log {door_credential, update, onCreate: create}` (ghi trong cùng giao dịch), response 401/403/409/412/422/428 |
| W16 | Đồng bộ `x-c3-log`, 401/403 mọi operation C3; A119 vào `setParameter` (BUG-R1-SEC-11, P3) | **Fixed – chờ QA script + SEC** | Soát tự động 11 operation `x-classification: C3`: thiếu `x-c3-log` 0, thiếu 401 0; mọi op `x-requires-trusted-device` có 403; mọi op `x-step-up` có 401; mọi op `x-rate-limit` có 429 (thêm cho `lookupGuestByContact`). `x-c3-log` mới: `addGuestDocument` (create), `updateGuestDocument` (update), `getGuestDocumentSensitive` (view), `getDocumentImage` (`document_image` view), `purgeRegistrationImages` (purge), `getPortalData` (`portal_data` view), `uploadGuestDocument` (create, actorType guest), `startMy2faSetup` (`mfa_secret` create, R3). Quy ước info mở rộng: log cho thao tác ghi, `onCreate`, bảng "mã lỗi khai báo cho operation C3". `setParameter.x-rbac: [A101, A102, A118, A119]` |
| Redocly | Sửa 24 lỗi `operation-summary` để `contract-lint` chặn được | **Xong** | `npx @redocly/cli@1.34.21 lint docs/api/openapi.yaml` → **"Woohoo! Your API description is valid"**, **0 lỗi**, 4 cảnh báo (trước: 24 lỗi, 77 cảnh báo). Đã thêm 24 `summary`; sửa thêm 2 ví dụ sai schema (`listAttentionItems` thiếu `source`, ví dụ walk-in `initialPayment` thiếu `type`), `info.license`, mô tả tag `health`, khai 401/403 cho 65 operation chưa có 4xx. 4 cảnh báo còn lại có chủ đích: `operation-4xx-response` ở `/health`, `getPublicUnitPage`, `webhookGet`; `no-server-example.com` (`localhost` dev). → OPS bỏ `continue-on-error` của `contract-lint` (W5) |
| Validator | openapi-spec-validator | **Hợp lệ** | `validate()` OK cho `openapi.yaml` 0.3.0-draft và `openapi.test.yaml` |
| ADR-012 | Ghi phiên bản OPS đã nâng + kế hoạch ESLint | **Xong** | ADR-012 → **Chấp nhận**; mục "Cập nhật R2 tuần 1": bảng phiên bản khóa trong lockfile (fastify 5.11.3 → 5.12.7 qua override, vitest 2.1.9 → 4.1.12, vite 5.4.21 → 7.3.7, plugin-react 4.3.4 → 5.2.0, unplugin-swc 1.5.1 → 1.6.0; giữ NestJS 11.2.7, TS 5.8.3, ESLint 9.39.5, Prettier 3.9.10, Turbo 2.11.8) – đối chiếu `pnpm-lock.yaml`; 5 quy tắc (bỏ override khi Nest vá, không tắt audit, khi nào được lên major, `turbo.json env`, điều kiện `default` trong `exports`); **kế hoạch ESLint 10**: thử Sprint 2, nâng Sprint 3 R2 hoặc đầu R3, nâng ngay nếu có CVE High; cổng `contract-lint`/`api-contract` mới |
| erd 2.1 | `ottimo_readonly` = NOLOGIN | **Xong** (SEC-06 lệch nhỏ) | Dòng vai: `NOLOGIN BYPASSRLS` (bật LOGIN có hạn theo runbook khi cần); đoạn "Việc của OPS" viết lại thành "Đã làm (OPS W1)" kèm kết quả 4 vai trên PostgreSQL 17.11 |
| G1 (BE) | architecture 9.1 J12/J13 R2 → R3 | **Xong** | J12 `billing.status`, J13 `lease.renewal_offer` cột R = **R3** (R-C) |
| G2 (BE) | J2 "hẹn giờ" lệch ADR-008 điểm 4 | **Xong** | J2 = tick mỗi phút so `hold_expires_at − hold_expiry_reminder_hours ≤ Clock.now()`, khóa `reservationId:hold_expires_at` trong `job_run` |
| G3 (BE) | architecture 13 tên biến khớp mã/OPS | **Xong** | `TRUST_PROXY` (IP/CIDR, không số bước), `DATA_KEK_CURRENT`(`_FILE`), `ID_HASH_KEY`(`_FILE`), quy tắc chung `X_FILE`; ghi rõ `CLOCK_MODE`, `TEST_SUPPORT_TOKEN`, 3 origin do BE thêm vào `config.ts` + OPS cập nhật `.env.example` cùng PR (bỏ `CLOCK_OVERRIDE`) |
| G6 (BE) | Hợp đồng API US-017 AC5a (đơn dài hạn nhập tay) trước Sprint 2 | **Xong** | `ReservationCreate.manualLongStay` → schema `ManualLongStayInput` (`monthlyRentVnd` bắt buộc, `externalContractRef`, `depositHeldVnd`, `note`): `stayType=long`, `confirmed`, chiếm `room_occupancy` (409 khi trùng), không sinh HĐ/kỳ thu/hoa hồng, chỉ khi đạt ngưỡng BR-108; ví dụ `manualLongStay` trong `createReservation`; `Reservation.externalContract` + `manualLongStay` (FD+); lọc `listReservations?externalContract=true`; mô tả lỗi `LONG_STAY_REQUIRES_CONTRACT` (AC5) / `MANUAL_LONG_STAY_BELOW_THRESHOLD`. erd: `reservation.external_contract` (CHECK `stay_type='long'`, chỉ mục một phần), `manual_long_stay jsonb` – chuyển HĐ ở R3 giữ nguyên id/mã (rủi ro R2-7). SAL/CTV không tạo được (A01) |
| Thêm | Mô tả `restoreNoShow` khớp BR-315 | Xong | Summary + mô tả: FD/FDL tự khôi phục khi đủ 3 điều kiện, ngoài ra 202 + yêu cầu duyệt (trước ghi FD/FDL luôn phải duyệt – lệch SQ-1) |

## 2. Ghi chú kỹ thuật

### 2.1 Quyết định thiết kế khi viết SM-16/SM-17 (ghi decision-log)
- Mỗi căn trong nhóm vẫn là **một đơn SM-01**; `createReservationGroup` với `rooms[]` dùng lại logic `createReservation` cho từng căn trong **một** giao dịch → không có nửa nhóm, chống trùng giữ nguyên ADR-009.
- Quyền: G1/G4 theo rbac **A23** (SAL/CTV `own`); G2 phân bổ cọc theo **A33** (CTV không ghi tiền – rbac ghi chú 36); G3/hủy nhóm theo **A05/A06** (cùng phạm vi `own_direct_only`/`own_hold_only` như `cancelReservation`); bill nhóm theo **A18**; ca: S32 (xem, FD `own`), A45 (mở/đóng ca của mình, `x-scope {all: own}`), C5 MGR+ theo **A32** (bút toán).
- Đóng ca: `varianceVnd` server tính, không nhận từ client; `acknowledgedCarryOverVersion` buộc người đóng ca đã xem việc tồn (BR-526 d); xác nhận lại `authMethod`/`secret` (R3 PIN).

### 2.2 Sửa `product/tests/tools/gen_traceability.py` (công cụ của QA – W2 là việc chung ARC + BA + QA; nhờ QA xem lại)
- Đọc `x-rbac-field` (dạng inline và khối) cho từng thuộc tính, ưu tiên hơn `FIELD_MAP`; regex mã trường nhận `D12a/b/c`; `FIELD_MAP` `freeNote`/`internalNote` → D12c (D12 không tồn tại).
- Chỉ nhận thuộc tính ở mức thụt lề ≥ 8 và thuộc tính con đúng +2 (tránh gán nhầm `x-classification` cấp operation/schema).
- `--strict` đỏ thêm khi: thuộc tính có `x-visible-to` cho vai mà rbac mục 6 ghi **K**; thuộc tính có `x-classification` thiếu `x-rbac-field`; mã `x-rbac-field` không có trong rbac mục 6. Mục 8 của `traceability.md` có dòng tổng kết phủ `x-rbac-field`.
- Chạy công cụ sinh lại `product/docs/qa/traceability.md` (tệp sinh tự động).

## 3. Việc gửi vai khác (ARC không sửa file của họ)
| Gửi | Việc |
|---|---|
| OPS (W5) | Bỏ `continue-on-error` job `contract-lint` (Redocly 0 lỗi); thêm job `api-contract` chạy `python3 product/tests/tools/gen_traceability.py --strict` (cần Python 3.9+, không cần PyYAML) |
| SEC | Kiểm lại BUG-R1-SEC-10, SEC-11; cập nhật SR-C3-09/SR-DEV-03 danh sách step-up (`door-credential` GET/PUT) như SEC đã nêu ở D2; xem `x-c3-log` của `startMy2faSetup` (`mfa_secret`) |
| QA | Kiểm lại BUG-R1-014, 017 (phần ARC), SEC-10/11 bằng script; xem lại sửa đổi `gen_traceability.py` (2.2); TC cho AC5a; 3 bad refs hiện tại của script (`TC-L5-033 → US-086/AC3`, `TC-L5-039 → US-119/AC5`, `TC-L8-006 → US-012/AC2`) do phần AC dời R3 – việc QA; script đếm 68 Must R2 trong khi backlog ghi 72 (cách script đọc story "một phần") – QA soát |
| BA | (a) SM-16 G4 ghi "Ai: FD+" nhưng rbac A23 cho SAL/CTV (M) → chốt một nguồn trước R3 (OpenAPI đang theo A23); (b) erd/OpenAPI tách người đặt/người trả của nhóm (`booker`, `payer` – BR-321), state-machines G1 ghi chung "người đặt/người trả" – khớp |
| DOM | BR-321 ví dụ mã nhóm `GRP-00012` lệch mẫu `NH-{n:05}` (erd mục 10, OpenAPI `NH-00012`) – đổi ví dụ |
| BE | AC5a theo `ManualLongStayInput` (trước Sprint 2); A21 cài kèm step-up + `c3_access_log` ngay từ đầu; migration R2 tạo `reservation.group_id`, `external_contract`, `manual_long_stay`, `payment.shift_id` (null được), bảng `reservation_group`/`shift`/`payment_allocation`/`group_bill` |
| FE/MOB | Không đổi đường dẫn/trường cũ. Mới: màn mã cửa xử lý `401 REAUTH_REQUIRED` (như `renderDoorCodeMessage`); form đặt phòng có lựa chọn "Đơn dài hạn nhập tay" (AC5a); `BillNo` có pattern |

## 4. Giả định
- Hợp đồng SM-16/SM-17 là bản để chỗ cho R3: BE không cài ở R2 (chỉ tạo bảng/cột trong migration đầu như erd đã ghi); có thể chỉnh khi BA/DOM chốt luồng chi tiết R3 mà không tính là đổi hợp đồng đã chốt.
- `x-c3-log.action` theo enum erd `c3_access_log` (`view|create|update|copy|delete|purge`) – không có `download`, ảnh giấy tờ dùng `view`.
- Token link khách (D25) trả một lần qua `issueGuestLink` chưa có `subject_type` trong `c3_access_log` – giữ audit `security` như R1, không thêm `x-c3-log` (đề nghị SEC xem có cần mở rộng enum ở R3).
- Mã lỗi AC5a dùng `422 VALIDATION_FAILED` với mã trường (`LONG_STAY_REQUIRES_CONTRACT`, `MANUAL_LONG_STAY_BELOW_THRESHOLD`), không thêm mã lỗi cấp cao vì là tính năng tạm.

## 5. Rủi ro / việc chưa xong
- CI GitHub chưa chạy (ESC-013 phương án B) → hai cổng `contract-lint`/`api-contract` mới chỉ được chứng minh trên máy.
- W10 (chốt thẻ BE-ARC 01–07): BE đã xác nhận đủ để code (BE w1-report) – không còn việc ARC.
- Không có ESC mới.

## 6. File đã tạo/sửa
- Sửa: `product/docs/api/openapi.yaml` (0.3.0-draft), `product/docs/adr/ADR-012-monorepo-toolchain.md`, `product/docs/erd.md`, `product/docs/architecture.md`, `product/tests/tools/gen_traceability.py`, `01-decisions/decision-log.md` (5 dòng ARC 16/10)
- Sinh lại: `product/docs/qa/traceability.md`
- Tạo: `rounds/round-02/outputs/ARC/w1-report.md`
