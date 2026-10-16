# Báo cáo kiểm thử – Round 1 (round tài liệu)

- Tác giả: QA | Round 1 – Bước 5 (Kiểm thử) | Ngày: 16/10/2026
- Căn cứ: `rounds/round-01/plan.md` mục 6 (bước 5 cho round tài liệu) và mục 7 (tiêu chí QC A1–C5); `product/docs/qa/test-strategy.md`
- Đọc cùng: `rounds/round-01/qa/bug-list.md` (22 lỗi), `product/docs/qa/traceability.md` v0.3 (sinh lại 16/10)

## 1. Kết luận ngắn

- **0 lỗi P0, 0 lỗi P1.** 9 lỗi P2 (7 Open, 2 Closed) và 13 lỗi P3 (12 Open, 1 Closed). Lỗi P2 đều là lệch giữa các tài liệu, đã có cách sửa rõ, không chặn bắt đầu code R2.
- **Truy vết đủ:** 77/77 story Must R2 có đủ 4 chiều: test case, endpoint, wireframe và bảng ERD. 267/267 AC có test case chạy được ở R2. 150/150 BR được story hoặc test case tham chiếu. 26/30 lỗi BL 8.2 có test case chống tái phát; 4 lỗi còn lại thuộc R3.
- **Kiểm kỹ thuật BLOCKED:** máy chưa có node, pnpm, docker, nên TC-X-050 (`docker compose up` + `GET /health`) và CI khung **chưa chạy**. QA **không** báo đạt hai mục này. Phần kiểm tĩnh đều đạt: 29 tệp YAML/JSON hợp lệ, OpenAPI 0.2.0-draft qua openapi-spec-validator, không tìm thấy bí mật thật trong repo, `.env.example` chỉ chứa placeholder.

## 2. Phạm vi và cách test

| Hạng mục | Cách làm | Công cụ / bằng chứng |
|---|---|---|
| Truy vết | Sinh lại ma trận bằng script, ghi đè `product/docs/qa/traceability.md` | `python3 product/tests/tools/gen_traceability.py` (16/10). Bước 5 sửa script: đọc đủ wireframe 01–10 (bản cũ chỉ đọc `0*.html` nên bỏ sót L10 và dòng `wf-meta`), thêm cột **ERD**, bỏ 6 lệch quyền báo giả |
| Nhất quán chéo (QC B1–B3) | Dùng script đối chiếu: (a) enum trạng thái OpenAPI ↔ danh mục 17 máy trong state-machines; (b) mã lỗi `NNN CODE` và `` `CODE` `` trong wireframe, test case, backlog, state-machines, rbac, ADR ↔ danh mục 45 mã lỗi OpenAPI; (c) định dạng mã chứng từ ↔ BR-007/erd mục 10; (d) số liệu giờ, %, tiền ghi cứng ngoài business-rules; (e) `x-roles` ↔ `rbac-matrix.json`. Đọc tay: bảng vai L1 và các nút của L5, L6, L10 ↔ rbac | Python tại chỗ, kết quả ở bug-list |
| Kỹ thuật | `which node pnpm docker`; parse toàn bộ YAML/JSON; chạy openapi-spec-validator; kiểm trùng `operationId`, operation thiếu `x-roles`; dò bí mật bằng regex (khóa AWS/Google/GitHub/Slack, `sk_live`, private key, JWT, gán mật khẩu/khóa dài); đọc `.env.example`, `.gitignore`, `ci.yml` | Python 3.9.6, PyYAML 6.0.3, openapi-spec-validator 0.7.2 |
| Không làm | Không chạy ứng dụng, CI, E2E hay test hiệu năng vì chưa có mã chạy được và công cụ. Không sửa tài liệu của vai khác. Kiểm wireframe ↔ RBAC chỉ đọc tay 4/10 trang | – |

## 3. Chỉ số truy vết (traceability v0.3)

| Chỉ số | Kết quả | So với bước 2 |
|---|---|---|
| Story Must R2 | **77** | 74 → 77 (thêm US-139, 141, 142) |
| Story Must R2 có ≥ 1 TC | **77/77** | = |
| Story Must R2 có endpoint (`x-stories` hoặc TC) | **77/77** | = |
| Story Must R2 có wireframe | **77/77** | 64/74 → 77/77. Thêm L10 cho US-004, 005, 006, 066, 071, 072, 125. QA đối chiếu tay: US-027 (L4, L9), US-049 (L3), US-050 (L8, L9), US-141 (L7, L3 mục 3.5), US-142 (L3 mục 3.5, L1) |
| Story Must R2 có bảng ERD | **77/77** | Mới (QC C1). Cách tính: mục `erd.md` 4.x có nêu US, cộng mục suy từ `tags` của operation (bảng `TAG_ERD`). Mới kiểm có bảng, **chưa** kiểm từng cột |
| Ô trống QC C1 trong ma trận story Must R2 | **0** | Ô trống chỉ còn ở mục 3 (story R3: US-041, 064, 137) – BUG-R1-022 |
| AC có ≥ 1 TC | **267/267** | 244 → 267 |
| AC có TC chạy được ở R2, kỳ vọng xác định | **267/267** | – |
| Tổng TC | 374 (Cao 226 · TB 142 · Thấp 6), Smoke 39 | 313 → 374 |
| Chuyển trạng thái có TC | **101/121** (83,5%) | 20 chuyển trống, đều thuộc R3 hoặc chưa có AC: SM-06 H3–H9, SM-07 T3, SM-11 ×2, SM-16 ×5, SM-17 ×5 (BUG-R1-020) |
| Tham chiếu chuyển sai | 1: `TC-L3-055 → SM-05 review→partial` | Lỗi nằm ở state-machines (BUG-R1-001), không phải TC |
| BR được story/TC tham chiếu | **150/150** | 13 chưa tham chiếu → 0. Còn 31 BR có story nhưng chưa có TC (R3) |
| Lỗi BL 8.2 có TC chống tái phát | **26/30** | Thiếu #11, #14, #22, #25, đều R3 |
| `operationId` lạ / AC sai / TC trùng | 0 / 0 / 0 | = |
| rbac ↔ OpenAPI: operation lệch | **14** (thô 20; 6 là báo giả của script, đã sửa) | Phân loại ở mục 4.3 |
| Thuộc tính lệch `x-visible-to` | 0 | = |

## 4. Kết quả kiểm nhất quán chéo

### 4.1 Đạt
- **Tên trạng thái:** 15/15 enum `*Status` trong OpenAPI khớp đúng từng giá trị với state-machines mục 0.3 và erd mục 5. SM-16 và SM-17 chưa có enum OpenAPI vì chưa có endpoint (BUG-R1-010, R3). Không thấy tên trạng thái cũ của prototype (`cf`, `in`, `out`, `cx`, `checked_in`…) trong wireframe, test case, PRD, use-cases, business-processes, BR, backlog.
- **Vai:** `x-roles` chỉ dùng 8 mã vai của rbac, cộng `guest` và 3 bí danh có chủ đích (`any_staff`, `public`, `system`). 164/164 operation có `x-roles`. Không có `operationId` trùng.
- **Mã lỗi:** mọi mã lỗi trong test case, backlog, state-machines, rbac, ADR đều có trong OpenAPI. Riêng wireframe 10 lệch 2 mã (BUG-R1-007). `412 VERSION_CONFLICT` đã thống nhất.
- **Quy tắc nghiệp vụ:** hai điểm P1 sơ bộ ở bước 2 đã đóng: khối OOO nửa mở (BR-804 v0.2) và đơn OTA nhập tay vào căn đã kín (409 kèm gợi ý). Ví dụ BR-107 đã khớp với giá đêm làm tròn (BUG-R1-009 Closed). Các số liệu trong TC-L5-001/002 khớp BR.
- **Wireframe ↔ RBAC (đọc tay L1, L5, L6, L10):** không vai nào được vẽ hành động mà rbac cấm. Cụ thể: sale xác nhận cọc đơn của mình (A04 = M); CTV chỉ "Báo đã chuyển cọc" (A53); buồng phòng không có nút khóa phòng (A86); lễ tân trưởng không dời ngày thay hủy (A08); manager chỉ xem khóa A102; thiết bị được cấp chỉ owner thao tác. Lệch duy nhất nằm ở văn bản rbac.json (BUG-R1-006), không phải ở wireframe.

### 4.2 Lệch (chi tiết trong bug-list)
- **Trạng thái:** SM-05 thiếu dòng chuyển `review → partial` (001). US-136 AC4 mâu thuẫn K12 (002). ERD ghi thiếu K12 (018).
- **Thực thể/mã:** K-22a dùng mã lý do hủy cũ (003). `APP_ENV=development` (004). Định dạng mã chứng từ: TC cũ (008 – đã sửa), ví dụ OpenAPI (014), `WO-031` trên wireframe (015), mã đơn DS-0 4 số (016).
- **Số liệu chỉ tham chiếu BR (B3):** PRD chỉ ghi số ở mục tiêu/chỉ số thành công. Đây là chỉ tiêu kinh doanh, không phải quy tắc, nên đạt. Tài liệu BA ghi cứng mốc 06:00 mà không dẫn BR-010 (019). Số đếm "74 story" cũ (017).

### 4.3 rbac-matrix.json ↔ `x-roles`: phân loại 20 chỗ lệch ARC chuyển sang R2

| Nhóm | Số op | Operation | Mức | Lỗi | Vai |
|---|---|---|---|---|---|
| Báo giả của script QA | 6 | `cancelRequest`, `uploadGuestDocument`, `recordGuestConsent`, `setMyApprovalPin`, `listUsers`, `updateReservation` | – | 013 (Closed) | QA |
| OpenAPI cho thêm vai (rbac ✖) | 2 | `listRooms`, `listRoomGroups` (HK/MT) | **P2**: giá đã che bằng `x-visible-to`; còn hở `maxOccupancy` (C0) | 005 | BA + ARC |
| rbac.json chưa cập nhật theo quyết định bước 4 | 5 | `issueGuestLink`, `issueGuestVerificationCode` (sale), `listTrustedDevices`, `trustCurrentDevice`, `revokeTrustedDevice` (manager) | P2 | 006 | BA |
| OpenAPI hẹp vai hơn rbac | 4 | `getArrivalsDepartures`, `listHkTasks`, `searchAvailability`, `createHkTask` | P3 | 011 | BA + ARC |
| Thiếu `x-scope: own` (SAL/CTV) | 4 | `createGuest`, `createLead`, `listMessageTemplates`, `searchAvailability` | P3 | 012 | ARC |

`searchAvailability` có mặt ở cả hai nhóm cuối, nên 6 + 2 + 5 + 4 + 4 = 21 dòng ứng với 20 operation. Không có trường C3 nào lộ. `gen_traceability.py --strict` hiện trả exit 1 vì nhóm "cho thêm vai". Sau khi đóng BUG-R1-005 thì mới bật bước này trong CI (BUG-R1-021).

## 5. Kiểm kỹ thuật

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| TC-X-050: `docker compose up` theo `dev-setup.md`, `GET /health` → 200 `{"status":"ok"}` | **BLOCKED (môi trường)** | `which node pnpm docker` (16/10) → `node not found`, `pnpm not found`, `docker not found`. Chủ đầu tư đang cài |
| CI khung (format, lint, test Vitest + PostgreSQL, build, Redocly, gitleaks, build ảnh + smoke `/health`) | **BLOCKED (môi trường)** | Không chạy cục bộ được. Chưa có bằng chứng một lần chạy GitHub Actions xanh. `ci.yml` đã có đủ các job trên (đọc tĩnh) |
| YAML/JSON hợp lệ | **Đạt** | 29/29 tệp parse được (bỏ qua `.claude/`, `node_modules/`) |
| OpenAPI hợp lệ | **Đạt** | openapi-spec-validator 0.7.2: `openapi.yaml` 0.2.0-draft (140 path, 164 operation) VALID; `openapi.test.yaml` 0.1.0-draft VALID |
| Bí mật thật trong repo (QC B5) | **Đạt (tĩnh)** | Regex dò khóa và token: 0 kết quả. `.gitignore` chặn `.env`, `.env.*`, `*.pem`, `*.key`… và chỉ cho phép `.env.example`. Không có tệp `.env` thật. Chưa chạy gitleaks trên lịch sử git (cần CI) |
| `.env.example` chỉ chứa placeholder | **Đạt** | Mật khẩu DB dạng `change_me_*_dev_only`. `DATA_KEK_CURRENT`, `ID_HASH_KEY`, `LOG_IP_HMAC_KEY` để trống. Mọi tích hợp ở `off`/`mock`/`manual`. `APP_ENV=dev` |

**Khi máy có công cụ (node 20 theo `.nvmrc`, pnpm, Docker Desktop), QA chạy theo thứ tự:**
1. `cp product/.env.example product/.env`, điền khóa thử 32 byte, rồi `docker compose -f product/infra/docker-compose.yml up -d`.
2. `curl -s localhost:3000/health`, mong đợi 200 `{"status":"ok"}`. Dừng PostgreSQL thì mong đợi 503.
3. `pnpm install && pnpm format:check && pnpm lint && pnpm test && pnpm build`.
4. Đẩy một nhánh lên GitHub, lấy link lần chạy CI xanh làm bằng chứng cho QC C2.

## 6. Kết quả theo tiêu chí QC (plan mục 7) – đánh giá của QA

Đây là đánh giá tham khảo. QC là bên quyết định. "Sơ bộ" nghĩa là QA chỉ kiểm sự tồn tại và số đếm, chưa đọc kỹ nội dung.

| Dòng | QA đánh giá | Bằng chứng / ghi chú |
|---|---|---|
| A1 | Đạt (sơ bộ) | 11/11 `outputs/<VAI>/report.md` có, mỗi bản có tiêu đề cho đủ 5 mục |
| A2 | Đạt (sơ bộ) | PRD mục 3 có mục tiêu G1–G5 và chỉ số S1–S7 có số |
| A3 | **Đạt** | 145/145 story đúng mẫu "Là… tôi muốn… để…", có MoSCoW và round. 77/77 Must R2 có ≥ 2 AC, 267/267 AC có Given và Then (script) |
| A4 | Đạt (sơ bộ) | Có các epic EP00–EP18 phủ luồng khách và luồng nhân viên |
| A5 | **Đạt** | 30/30 lỗi BL 8.2 đã phân loại Sửa / Cần INV / Bỏ (traceability mục 4). 26/30 có TC |
| A6 | Đạt (sơ bộ) | `open-questions-resolution.md` 26 dòng; 12 ESC |
| A7 | **Đạt** | rbac md + json phủ 8 vai nội bộ + khách; dòng trường nhạy cảm Dxx; 0 lệch `x-visible-to` |
| A8 | **Đạt** | SM-01 (đơn), SM-03 (buồng), SM-04 (phiếu sửa), SM-05 (khai báo) có điều kiện chuyển và vai. Còn thiếu 1 dòng chuyển ở SM-05 (BUG-R1-001, P2) |
| A9 | **Đạt** | 10 wireframe ≥ 8 luồng. L2–L4 có trạng thái Đang tải / Rỗng / Lỗi. Chuỗi VI/EN: `design/copy` có 635/635 khóa, không khóa EN rỗng |
| A10 | Đạt (sơ bộ) | `design-system.md` + `tokens.json` có token sáng/tối (decision-log UXD 16/10) |
| A11 | **Đạt** | ERD phủ 77/77 story; OpenAPI phủ 77/77 story Must R2; ADR-010 + hosting-plan ước tính 0,35–0,95 triệu/tháng |
| A12 | Đạt (sơ bộ) | `integrations.md`, `integrations/channel-manager-comparison.md` |
| A13 | **Đạt** | test-strategy v0.2, 374 TC, ma trận truy vết v0.3 |
| A14 | Đạt (sơ bộ) | `security/data-risk-assessment.md`, `threat-model.md` |
| A15 | Đạt (sơ bộ) | `metrics-definitions.md` có. Có lệch mã hủy ở K-22a (BUG-R1-003, P2) |
| A16 | Đạt (sơ bộ) | Persona/hành trình có nhãn mô phỏng (decision-log UXR) |
| B1 | **Đạt** | 0 lỗi P0/P1 Open. Lệch tên còn lại đều P2/P3 (mục 4.2) |
| B2 | **Đạt có ghi chú** | Không wireframe nào cho vai làm hành động RBAC cấm (đọc tay 4/10 trang). US-136 AC4 lệch máy trạng thái (BUG-R1-002, P2), không lệch BR |
| B3 | **Đạt có ghi chú** | Ví dụ và số liệu trong test case khớp BR. Tài liệu BA ghi cứng 06:00 không dẫn BR-010 (P3) |
| B4 | Đạt (sơ bộ) | Decision-log dùng nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` cho chính sách giá, VAT, phụ thu… |
| B5 | **Đạt (tĩnh)** | Mục 5. Gitleaks trên lịch sử git chưa chạy (cần CI) |
| C1 | **Đạt** | 0 ô trống trong ma trận 77 story × (TC, endpoint, wireframe, ERD) |
| C2 | **BLOCKED** | Chưa có node/pnpm/docker. Chưa có `/health` OK, chưa có CI xanh |
| C3 | Đạt (sơ bộ) | ADR-009 + erd K1/K2 (chống trùng), erd mục 10 (mã duy nhất), SM-02/BR-804 (OOO chặn bán), architecture mục 9 (job J1–J16), ADR-008 (múi giờ, MutableClock) |
| C4 | **Đạt** | 286 thẻ review: 3 Blocker và 106 Major đều đã có trả lời; 0 Open, 0 Rejected, 1 Escalated |
| C5 | **Không / chưa tới lượt** | Chưa có `rounds/round-02/plan.md`. Việc này của PO + ORC |

QA nhận định về cổng QC: nhóm A và B đạt theo đánh giá của QA. Nhóm C thiếu C2 (blocked do môi trường) và C5 (chưa lập). Hai dòng này khớp ngưỡng "ĐẠT CÓ ĐIỀU KIỆN" nếu có kế hoạch xử lý đầu R2. QC quyết định.

## 7. Đề xuất sửa (theo thứ tự)

1. **BA:** sửa BUG-R1-001 (SM-05 thêm K13), -006 (rbac.json A22, A110), -005 (dòng S25a `catalog_only`), -019. Đây là các lỗi chặn bộ test quyền tự sinh của R2.
2. **PO:** sửa BUG-R1-002 (US-136 AC4) và -017 (tiêu đề "77 story").
3. **ARC:** sửa BUG-R1-005 (`x-visible-to` cho `maxOccupancy`), -007 (2 mã lỗi), -012, -014, -017, -018. Đầu R2 thêm endpoint nhóm đơn và đóng ca (-010).
4. **DATA:** sửa BUG-R1-003. **INT:** sửa BUG-R1-004. **UXD:** sửa BUG-R1-015 (và -007 nếu ARC không thêm mã).
5. **OPS:** thêm job kiểm hợp đồng (-021) sau khi đóng -005.
6. **QA:** BUG-R1-016 (quy ước mã DS-0) và -020 (TC cho R3) ở R2 tuần 1. Chạy TC-X-050 và CI ngay khi máy có công cụ. Kiểm lại từng lỗi khi tác giả báo Fixed.

## 8. Rủi ro còn lại

- C2 chưa có bằng chứng chạy được. Nếu khung repo có lỗi khi chạy thật, R2 sẽ mất ngày đầu để sửa.
- Mới kiểm tay 4/10 wireframe ↔ RBAC. 6 trang còn lại (L2, L3, L4, L7, L8, L9) chỉ được kiểm gián tiếp qua mã lỗi và trạng thái.
- Cột ERD trong ma trận mới chứng minh có bảng cho từng story, chưa chứng minh đủ cột cho từng AC. BE sẽ phát hiện phần thiếu khi viết migration.
