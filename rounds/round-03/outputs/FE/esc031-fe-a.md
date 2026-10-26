# FE-A – Round 3 – Phản hồi & sửa: màn trả phòng và "Cần chú ý" cho bản vá ESC-031

- Vai: FE-A (Desk) | Ngày: 26/10/2026 | Nhánh: `worktree-agent-a67639f06f6add4d9` (chưa push)
- Đã gộp: `arc-esc031-contract-add8` (`66d88e7` = BE-B `35a477c` + ARC hợp đồng 0.3.8 bổ sung 8 + sinh lại `api-client`). Kiểu `postReview` lấy từ `api-client` sinh ra, không tự khai báo.
- Căn cứ: ESC-031 (INV 26/10), ESC-024 B; BE-B `outputs/BE/esc031-be-b.md`; SEC `reviews/SEC-sprint1.md` mục 8.6 (1); DOM `reviews/s1-DOM-on-esc031.md` E31-02; `product/docs/staff-one-pager.md` bước 3.

## 1. Đã làm gì

**H16 Trả phòng, bước "Bill & thu tiền"** (`CheckOutPage.tsx`). Áp dụng khi `extraNightAvailable = false` và có `lateFeeAsNightVnd`:
- Mặc định là **"Ghi phụ thu – quản lý xem lại"**, đúng chữ trên tờ hướng dẫn nhân viên. Màn hiện:
  - câu "Gọi quản lý trước khi ghi" + giải thích;
  - số phụ thu do máy chủ tính, **chỉ đọc** (không có ô nhập số);
  - ô **Lý do** bắt buộc. Thiếu lý do thì nút Hoàn tất bị khóa, kèm câu giải thích.
- Không có ô mật khẩu quản lý, ô tên đăng nhập hay ô miễn/giảm.
- Body gửi đi đúng `{amountVnd, reason, postReview: true}`. Không có trường xác nhận nào, kể cả rỗng (SEC 8.6). Có test kiểm bằng `toStrictEqual`.
- Hộp xác nhận Hoàn tất thêm một dòng: "phụ thu được ghi vào folio; quản lý nhận thông báo để xem lại".
- **409 `SURCHARGE_CHANGED`:**
  - hiện câu riêng kèm số mới và tải lại số;
  - chưa ghi gì;
  - lần bấm sau dùng `Idempotency-Key` mới (có test).
- **422 `NOT_ALLOWED` ở `lateFeeInsteadOfNight`** (đêm bán được trở lại): hiện câu riêng, quay về bước Phụ phí để tính thêm 1 đêm như thường.
- **Đường "Quản lý xác nhận tại quầy" cũ giữ nguyên mã** (mật khẩu, miễn/giảm, FE-08), nhưng **chỉ hiện khi `getMy2fa.enforced === false`** (dev/CI).
  - Bật 2FA bắt buộc (staging/production), không đọc được hoặc lỗi → ẩn. Khi đó chỉ còn một lựa chọn.
  - Đổi cách thì mật khẩu đã gõ bị xóa khỏi state.
  - Đường cũ bị 401 thì câu lỗi chỉ sang "Ghi phụ thu – quản lý xem lại".
- Bước Phụ phí: câu `co.late_fee_as_night_body` bỏ vế "Quản lý xác nhận…", đổi thành "Ghi khoản này ở bước Bill & thu tiền". Phần đầu câu giữ nguyên nên E2E vẫn khớp.

**"Cần chú ý" `late_fee_post_review`** (`app/attention.ts`, `dashboard/parts.tsx`, `ReservationDrawer.tsx`):
- Câu theo mã đơn, dòng phụ "Xem trên folio trước {giờ} {ngày}. Cần miễn hoặc giảm thì dùng Điều chỉnh" (hạn = `dueAt`), mức `warning`.
- Nút **"Mở folio"** → `/reservations/<id>?open=folio`: drawer mở folio ngay khi đọc xong đơn (nơi có "Điều chỉnh" – A32), rồi bỏ cờ trên URL. Nút **"Đã xem"** gọi `resolveAttentionEvent`.
- FD/FDL không thấy mục (máy chủ lọc). FD gọi đóng mục → 404 (có test).

**Chữ** (`design/tools/gen_strings.py` → sinh lại `strings-vi/en.json`, `strings-tables.md`, `strings.js`):
- Nhóm mới: "R3 v1.0 – FE-A ESC-031", 16 khóa, **chờ UXD duyệt**.
- Giọng điềm tĩnh, ngắn, không emoji. Dùng component sẵn có (`Seg`, `Field`, `Alert`, `dl.dl`), token màu và chữ OTTIMO. Không thêm màu.

**Mock MSW** (`mocks/stay.ts`, `mocks/handlers.ts`) làm theo BE-B:
- `postReview` không phải boolean → 422;
- trường xác nhận → 422 `NOT_ALLOWED` từng trường;
- thiếu lý do → `REASON_REQUIRED`;
- số lệch → 409;
- audit `channel: post_review`;
- một mục "Cần chú ý" mỗi đơn cho OWN/MGR.

**E2E** `tests/e2e/ui-clock/axe-k8.s4.spec.ts` TC-X-086:
- thêm quét axe hộp "Ghi phụ thu – quản lý xem lại" (kiểm không có ô mật khẩu);
- sau đó chọn "Quản lý xác nhận tại quầy" để giữ các bước quét cũ. Stack CI có `MFA_ENFORCED=false`.
- **Chưa chạy** ca này (cần stack đồng hồ ảo).

## 2. File tạo/sửa
- `product/apps/admin-web/src/pages/stay/CheckOutPage.tsx`
- `product/apps/admin-web/src/app/attention.ts`
- `product/apps/admin-web/src/pages/dashboard/parts.tsx`
- `product/apps/admin-web/src/pages/reservations/ReservationDrawer.tsx`
- `product/apps/admin-web/src/mocks/stay.ts`, `product/apps/admin-web/src/mocks/handlers.ts`
- `product/apps/admin-web/src/__tests__/esc031-fea.test.tsx` (mới, 9 ca)
- `product/apps/admin-web/src/__tests__/s4-416-fea.test.tsx` (chọn "Quản lý xác nhận tại quầy" trước khi kiểm đường cũ)
- `product/design/tools/gen_strings.py` + các tệp sinh ra: `design/copy/strings-vi.json`, `strings-en.json`, `design/tools/strings-tables.md`, `design/wireframes/assets/strings.js`
- `product/tests/e2e/ui-clock/axe-k8.s4.spec.ts`
- `01-decisions/decision-log.md` (1 dòng)
- Ảnh: `rounds/round-03/outputs/FE/esc031-shots/` (11 ảnh, dev server + MSW, 1366 px)

## 3. Test
- admin-web vitest: **59 tệp, 619 ca xanh**. Gồm `esc031-fea` 9/9:
  - body đúng 3 trường;
  - 2FA bật → chỉ một cách, không có ô mật khẩu;
  - 2FA tắt → đổi cách xóa mật khẩu;
  - 409 và key mới;
  - 422 về bước 2;
  - 401 chỉ sang đường mới;
  - câu "Cần chú ý";
  - OWN mở và đóng, FD không thấy và bị 404;
  - `?open=folio`.
- `s4-416-fea` 8/8.
- Kiểm tĩnh: `tsc --noEmit` (admin-web, tests) xanh; eslint xanh; prettier `--check` xanh.
- i18n: 19/19.

## 4. Giả định
1. Hạn hậu kiểm hiển thị lấy từ `dueAt` của mục. Câu cho lễ tân không nêu "24 giờ", vì lễ tân không đọc được tham số `post_checkout_charge_hours`.
2. Khi 2FA bắt buộc, vẫn hiện một nút "Ghi phụ thu – quản lý xem lại" (đã chọn sẵn) để lễ tân thấy đúng chữ trên tờ hướng dẫn. UXD có thể đổi thành nhãn tĩnh.
3. "Mở folio" dùng cờ URL `?open=folio` trong drawer đơn. Không thêm route mới.

## 5. Rủi ro / việc còn lại
- **UXD duyệt 16 chuỗi mới** và câu `co.late_fee_as_night_body` đã sửa.
- **SEC xem diff FE trước khi gộp** (8.6 (1)).
- **QA:**
  - chạy TC-X-086 trên stack đồng hồ ảo;
  - chạy kiểm tiền ESC-031 trên stack `MFA_ENFORCED=true`: trên Desk chỉ có một cách, body gồm 3 trường.
- Ảnh `10-folio-opened` chụp trên đơn còn đang ở (cảnh dựng bằng mock), không phải folio đã chốt sau trả phòng. Luồng thật của A32 trên folio `settled` là màn có sẵn từ S4-27, không đổi.
