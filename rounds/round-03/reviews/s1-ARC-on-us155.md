# ARC review BE-D – US-155 "Yêu cầu đặt phòng từ website" đưa vào v1.0

- Người review: ARC | Round 3 – Sprint 1, bước Review (bắt buộc theo quyết định 24/10) | Ngày: 24/10/2026
- Đối tượng: nhánh `be-d/r3-us155-v1`, commit `2fdff4d` (worktree `agent-a3df896dd8f7b8e31`); báo cáo `rounds/round-03/outputs/BE/s1-be-d-us155.md`.
- Đối chiếu:
  - OpenAPI 0.3.7 bổ sung 2 (US-155, `createReservation.websiteBookingRequestId`, `public_booking_requests_enabled`);
  - erd 4.14 (public-site), 2.3–2.4 (RLS, hàm entry);
  - ADR-001 (ranh giới module), ADR-014 (landing);
  - quy tắc migration S1-09 (CHECK chỉ thêm);
  - ARC 16.19 (thứ tự khóa).

## Kết luận
**Gộp được.** Không có Blocker.

Có **1 Major (US155-01)**: tên rút gọn (slug) của cơ sở có thể trùng giữa hai tổ chức. Thẻ này phải sửa trong round, **trước khi OWN bật công tắc form**. Công tắc mặc định tắt và v1.0 chỉ có một tổ chức, nên gộp ngay không làm lộ dữ liệu. Ngoài ra có 3 Minor.

**Đã chạy** (gộp thử `2fdff4d` vào `main` `d7af8c9`, worktree tách riêng, PostgreSQL 17 riêng):
- không xung đột; `tsc` đạt; `drizzle-kit generate` không sinh file;
- toàn bộ api: **126 tệp đạt (2 bỏ qua), 3.194 test đạt (19 bỏ qua)**. Lỗi `production-bootstrap` BE-D báo đã được sửa trên `main` ở `d7af8c9`.

**Đúng kiến trúc và hợp đồng:**
- **Migration 0086**:
  - số và chuỗi đúng: `prevId` = 0085, journal `idx` 62;
  - DDL sinh từ schema, phần viết tay giữ nguyên;
  - 4 CHECK viết lại = tập trước cộng giá trị US-155 (đúng S1-09), có test so tập.
- **RLS**:
  - `website_booking_request` và `public_form_nonce` lọc theo cơ sở, có `WITH CHECK`;
  - `privacy_notice_version` lọc theo tổ chức, app chỉ SELECT (ghi bằng bước phát hành landing);
  - `rate_limit_counter` là ngoại lệ RLS có ghi tên trong `architecture.test` (khóa chỉ là mã giới hạn + HMAC, không có dữ liệu khách).
- **Hàm entry `public_resolve_property`**:
  - `SECURITY DEFINER`, `search_path` cố định, `REVOKE ALL FROM PUBLIC`, chỉ cấp EXECUTE cho `ottimo_app`;
  - chạy dưới policy `entry_function_read` của `ottimo_owner` (erd 2.4);
  - chỉ trả mã tổ chức, mã cơ sở, múi giờ;
  - slug được kiểm `^[a-z0-9-]{2,40}$` trước khi gọi.
- **`ParameterHooks`** (platform không import module tính năng – ADR-001):
  - `before` chạy trong giao dịch, có thể ném lỗi; `after` chạy sau khi ghi;
  - hook bỏ qua khi người gọi không phải OWN, để lỗi 403 của `setParameter` đi trước;
  - gộp với S2 của R3-Q51 đúng thứ tự: S2 xác thực trước giao dịch → hook `before` → ghi → `receivingAccountChanged` → hook `after`.
- **`cancelScheduledParameter` gọi `hook.after`: đồng ý** (giả định ARC của BE-D). Hủy lịch bật/tắt form cũng là một thay đổi công tắc, nên OWN + MGR phải được báo `public_booking_toggled` và cache bị xóa. `after` của US-155 không đọc giá trị, nên truyền `undefined` an toàn.
- **B2 `createReservation.websiteBookingRequestId`**:
  - 422 khi kênh không thuộc nhóm `direct`, hoặc `directSource` ≠ `website`;
  - 404 khi không có yêu cầu; 409 khi yêu cầu đã đóng;
  - WR6 `markConverted` khóa yêu cầu (`FOR UPDATE`) **sau** khi ghi đơn, đúng thứ tự 16.19 "yêu cầu cuối cùng";
  - yêu cầu bị người khác đóng giữa lúc kiểm và lúc ghi → 409 và **cả giao dịch hủy**. Đồng ý (giả định ARC của BE-D): không bao giờ có đơn nguồn `website` mà không gắn yêu cầu;
  - xóa dữ liệu liên hệ của khách (C2) cùng giao dịch.
- Công tắc form mặc định `false`. Bật khi thiếu thông báo quyền riêng tư hoặc khóa ký → 422 `PUBLIC_FORM_NOT_READY`.

## Hợp đồng – `notePurgedAt` (BE-D chờ): **đồng ý, đã thêm** (0.3.8 bổ sung 4, chưa commit, ORC commit)
- `GuestRequest.notePurgedAt` và `GuestRequestForGuest.notePurgedAt`: `Instant`, **tùy chọn**. Có giá trị khi ghi chú bị xóa theo hạn lưu T13 (`retention.guest_request_months`, migration 0083); khi đó `note`/`replyNote` vắng mặt và màn hiện "Ghi chú đã xóa theo hạn lưu". Vắng = chưa xóa.
- Khớp mã đang chạy trên `main` (`guest-requests.service.ts` chỉ trả khi có giá trị).
- Không có `x-rbac-field`, vì đây chỉ là mốc thời gian, không phải dữ liệu khách.
- Có thêm dòng changelog 0.3.8 bổ sung 4.
- Đã sinh lại `openapi-schemas.ts`, api-client `openapi.ts`. Kiểm:
  - spec validator OK; `gen-openapi-meta --check` up to date; `gen_rbac_cases --check` OK; `gen_traceability --strict` exit 0;
  - prettier xanh; `tsc` api, api-client, admin-web 0 lỗi; api `contract` 5/5.
- **Việc BE-D**: sau khi rebase lên `main` có commit hợp đồng, sinh lại `openapi-meta.ts`/`openapi-schemas.ts` (nhánh này có sửa `openapi-meta.ts`, nên xung đột ở tệp sinh tự động được giải bằng cách sinh lại, không gộp tay). Serializer sẽ tự trả trường này.

## Thẻ feedback

### FB-R3-ARC-US155-01
- Mức độ: Major (sửa trong round, **trước khi OWN bật công tắc form**)
- Vị trí: `0086` `public_resolve_property` (`WHERE lower(p.code) = p_slug`); `public-booking.service.ts` `resolve()` (`rows[0]`)
- Vấn đề: `property.code` chỉ duy nhất **trong một tổ chức** (`property_org_code_key (organization_id, code)`), không duy nhất toàn hệ thống. Hai tổ chức có cơ sở cùng mã thì hàm trả 2 dòng, và app lấy `rows[0]` (thứ tự không xác định). Yêu cầu đặt phòng của khách (C2: tên, SĐT) có thể ghi vào **cơ sở của tổ chức khác**.
- Vì sao quan trọng: rò dữ liệu cá nhân giữa các tenant (NĐ 13/2023). Kiến trúc phải đa tenant từ đầu; chuỗi cơ sở là mục tiêu đã chốt.
- Đề xuất sửa (chọn một; ARC khuyên (a)):
  - (a) Hàm chỉ trả khi đúng **một** cơ sở khớp slug (CTE các dòng khớp, thêm điều kiện `(SELECT count(*) FROM m) = 1`), và app coi `rows.length !== 1` là 404. Kèm test có hai tổ chức trùng mã → 404, không ghi gì.
  - (b) Cột `property.public_slug` duy nhất toàn hệ thống (`UNIQUE (lower(public_slug))`), do OWN/OPS đặt. Đây là hướng lâu dài cho chuỗi; có thể làm ở 0.3.9.

  Làm (a) ngay trong migration mới, **không sửa 0086 sau khi đã gộp**.
- Trạng thái: Open

### FB-R3-ARC-US155-02
- Mức độ: Minor
- Vị trí: `0086` – `GRANT … DELETE ON website_booking_request`
- Vấn đề: quyền DELETE mở cho mọi yêu cầu của cơ sở, trong khi chỉ cần xóa dòng `spam` quá `retention.web_request_spam_days` (T19). Cùng lớp với Q51-02.
- Đề xuất sửa:
  - test kiến trúc: `DELETE FROM website_booking_request` chỉ xuất hiện trong job T19;
  - trigger `BEFORE DELETE` chỉ cho xóa dòng `status = 'spam'`, như mẫu 0084;
  - làm cùng migration của US155-01.
- Trạng thái: Open

### FB-R3-ARC-US155-03
- Mức độ: Minor
- Vị trí: `reservations/internal/reservations.service.ts`, `sales/internal/quotes.service.ts` import `public-site/public/website-request.port`
- Vấn đề: module lõi (`reservations`, `sales`) phụ thuộc vào module tính năng `public-site`. Có `@Optional()`, nên chạy được khi không có module, nhưng chiều phụ thuộc ngược với mẫu đang dùng: bên dùng sở hữu cổng, ví dụ `ReservationHooks` ở `reservations/public` do `frontdesk` cung cấp.
- Đề xuất sửa (Sprint 2, không chặn): chuyển interface + token `WEBSITE_REQUEST_PORT` sang `reservations/public` (hoặc `sales/public`); `public-site` `provide` nó. Thêm luật vào `module-boundaries`: module lõi không import `public-site`.
- Trạng thái: Open

### FB-R3-ARC-US155-04
- Mức độ: Minor
- Vị trí: `public-booking.service.ts` – bộ đếm RAM "bước 0" và cache slug 60 giây theo tiến trình
- Vấn đề: đúng khi api chỉ có 1 bản (production v1.0 hiện 1 bản). `clearCache()` chỉ xóa ở tiến trình nhận lệnh đổi tham số. Cache chỉ giữ slug → cơ sở, công tắc đọc trực tiếp, nên không sai nghiệp vụ. Bộ đếm RAM thì nhân đôi giới hạn nếu chạy 2 bản.
- Đề xuất sửa: ghi trong `docker-compose.prod.yml`/runbook "api 1 bản cho tới khi bộ đếm bước 0 chuyển sang `rate_limit_counter`". Khi tăng bản thì chuyển hẳn sang bảng.
- Trạng thái: Open

## Điểm làm tốt
- Gộp hai nhánh cẩn thận: bỏ phần T13 đã có trên `main`, CHECK hợp tập có test riêng, snapshot sinh lại trên 0085 và so khớp từng ký tự.
- `ParameterHooks` giữ đúng ranh giới ADR-001: platform không biết module tính năng. Đã nhớ gọi cả ở đường hủy lịch mới.
- Luồng B2 → WR6 có thứ tự khóa rõ và 409 hủy cả giao dịch, nên không có đơn "mồ côi".
