# SEC review – PR #68, tài liệu v1.0.4 đợt r4b (phần bảo mật)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: nhánh `v104/ba-docs-r4b` @ **`da98e511`** (`da98e511660f72dbf5bfbb216d9531181dbc0e89`). Đọc bằng `git diff origin/main...origin/v104/ba-docs-r4b`, merge-base `58183764`. Diff có 4 tệp, đều là tài liệu: `user-manual-v1.0.md`, `guides/00-index.md`, `guides/01-chu-dau-tu-quan-ly.md`, `guides/02-le-tan.md` (+40/−23).
- Phạm vi SEC: đọc nhanh các phần chạm bảo mật.
  - Chặn hộp thư chung ở bước nhập email.
  - Giới hạn xem yêu cầu hoàn đang chờ.
  - Quét dữ liệu nhạy cảm trong mọi dòng thêm mới.
  - Phần HĐ thuê tháng khi gia hạn và Trả sớm lúc 00:00–05:59 là nghiệp vụ (DOM, PO). SEC chỉ quét dữ liệu ở các phần này.
- Căn cứ:
  - mã trên `origin/main`: `identity/public/shared-mailboxes.ts`, `identity/internal/security-email.service.ts`, `infra/server/env.production.example`, `approvals/internal/limits.ts` (`minRoleFor`);
  - `rounds/round-04/reviews/ARC-on-v104-p4-32.md` mục A1 và thẻ 01.
- Không sửa tệp nào ngoài tệp này, không commit, không đụng nhánh BA.

## 0. Kết luận

**ĐẠT.** Không có Blocker, Major hay Minor. Có 1 Suggestion, dành cho nhánh gỡ phần v1.0.3.

## 1. Chặn `booking@` và `info@`: sổ tay so với mã

Các chỗ đã đọc: sổ tay 0.3a, 1.5 bước 4, 5.0; `01` 1.6a, 1.9; `02` 1.6.

| Sổ tay ghi | Mã trên `main` | Khớp |
|---|---|---|
| Từ v1.0.4 Desk chặn cả `booking@` của cơ sở | `DEFAULT_SHARED_LOCAL_PARTS = ['info', 'booking']`, ghép với tên miền của `EMAIL_FROM` và tên miền của danh sách cấu hình. Production `EMAIL_FROM=info@ottimo.vn`, nên Desk chặn `info@` và `booking@` của tên miền cơ sở | Có |
| Kể cả dạng có dấu cộng (`info+…@`, `booking+…@`) | `canonicalMailbox` đổi sang chữ thường và bỏ phần `+…` | Có |
| Ở v1.0.3 Desk chỉ chặn `info@` | v1.0.3 chỉ so với địa chỉ `EMAIL_FROM` (đầu tệp `shared-mailboxes.ts` ghi rõ) | Có |
| Các hộp thư chung khác (Gmail dùng cho OTA, hộp thư của quầy…) Desk không nhận ra, anh/chị phải tự tránh | Desk chỉ chặn thêm khi OPS khai địa chỉ trong `EMAIL_SHARED_MAILBOXES`. Sổ tay nói theo hướng an toàn | Có (hướng an toàn) |
| Desk báo sau khi bấm **Lưu email**; mật khẩu và mã không bị tính là sai, mã chưa bị dùng | `SecurityEmailService.check` chạy **trước** S2 ("no factor burnt on a refused value, nothing counted") | Có |

**Có lộ cách vòng không: Không.**
- Sổ tay chỉ nói cái bị chặn. Sổ tay không nói cái nào lọt, như dấu chấm, bí danh hay tên miền khác.
- Câu "kể cả dạng có dấu cộng" đóng một đường vòng, không mở thêm đường nào.
- Không câu nào nhắc `EMAIL_SHARED_MAILBOXES`, `EMAIL_FROM` hay cách OPS khai danh sách.
- Còn khoảng 2 ngày chạy v1.0.3. Trong lúc đó, người đọc có thể suy ra Desk chưa chặn `info+…@`. Suy luận này không mở được việc gì, vì:
  - người nhập email cho nhân viên là chủ đầu tư, còn email của chính mình thì chủ tài khoản nhập sau S2;
  - mọi lần đổi email đều gửi thư tới địa chỉ cũ, địa chỉ mới và mọi chủ đầu tư.

  SEC chấp nhận.

## 2. Giới hạn xem yêu cầu hoàn đang chờ

- Sổ tay ghi: "Lễ tân và lễ tân trưởng chỉ thấy yêu cầu hoàn chờ duyệt do **chính mình** tạo… hỏi quản lý (hoặc chủ đầu tư) trước khi báo khách". Có ở sổ tay 2.14, 2.14a; `02` 11.1, 11.5.2; `01` 7.3.
- Câu này khớp ARC A1 (`approval.service.ts`, hàm `list`):
  - Lễ tân thấy yêu cầu của mình, cộng các yêu cầu hoàn đã duyệt mà chưa chi đủ.
  - Lễ tân trưởng thấy thêm yêu cầu mình duyệt và yêu cầu có `required_role = front_desk_lead`.
  - `minRoleFor('refund') = 'manager'`, nên yêu cầu hoàn không bao giờ được chuyển cho lễ tân trưởng. Vì vậy câu đúng cho cả lễ tân trưởng.
- **Đúng hướng bảo mật.** Câu không dạy dùng tài khoản quản lý để xem, không gợi ý chụp màn hình của người khác. Câu cũng không trỏ sang **Nhật ký tiền → Hoàn tiền** cho ca này, vì tab đó dùng cùng phạm vi (đúng ARC thẻ 01 ý 3).
- `01` 7.3: chủ đầu tư hoặc quản lý báo lễ tân **số còn hoàn**, tức chỉ số tiền, không có nơi nhận hay số tài khoản. SEC đồng ý.

## 3. Dữ liệu nhạy cảm

SEC đã quét mọi dòng thêm mới trong diff.
- Email chỉ có `info@`, `booking@`, `info+…@`, `booking+…@`. Đây là hộp thư chung công khai của cơ sở, đã có trên `main`.
- Không có IP, chuỗi số từ 8 chữ số trở lên, số tài khoản, số điện thoại, tên đăng nhập, tên khách, khóa hay mật khẩu.
- Không có ảnh.
- Số tiền và căn 202 là ví dụ đã có trên `main`. Mã đơn chỉ ở dạng `OTM-…`.

## 4. Thẻ

### FB-R4-SEC-BA-PR68-S1
- Mức độ: Suggestion, làm ở nhánh gỡ phần v1.0.3 sau khi v1.0.4 lên.
- Vị trí: sổ tay 0.3a và `01` 1.6a, gạch đầu "**Desk chỉ chặn được `info@`.**"
- Vấn đề: chữ đậm vẫn giữ nguyên, phải tới câu sau mới có "Từ v1.0.4 Desk chặn cả `booking@`". Từ ngày v1.0.4 lên, chữ đậm này sai (theo hướng an toàn). Người đọc lướt thường chỉ đọc chữ đậm.
- Đề xuất: khi gỡ phần v1.0.3, viết lại thành "**Desk chặn `info@` và `booking@` của cơ sở** (kể cả dạng có dấu cộng). Các hộp thư chung khác (Gmail dùng cho OTA, hộp thư của quầy…) Desk không nhận ra, anh/chị phải tự tránh." Giữ vế "tự tránh".
- Trạng thái: Open

## 5. Ghi chú cho ORC

- SEC thử gộp bằng `git merge-tree` (#63 @ `8192e26b` trước, rồi #68 @ `da98e511`). Không tạo nhánh, không đổi ref.
  - Có xung đột ở 4 tệp, nhưng chỉ ở dòng "Lập:" đầu tệp và dòng bảng phiên bản: sổ tay 1.12/1.13, `00` 1.10/1.11, dòng "Lập:" của `01`, `02`.
  - Thân bài tự gộp được. Sau khi gộp thử, các câu S1, S2 của #63 và câu `booking@` của #68 đều còn.
- Khi BA giải xung đột: giữ cả hai dòng. Xong thì grep lại ba câu sau, trong sổ tay và `01`:
  - "Đặt lại mật khẩu luôn"
  - "Khóa cũng đăng xuất người đó trên mọi máy"
  - "OTTIMO chỉ có một tài khoản chủ đầu tư"
- Không ESC mới.

## 6. Điểm làm tốt

- Mỗi chỗ nói Desk chặn đều kèm "từ v1.0.4", và giữ nguyên vế "các hộp thư chung khác phải tự tránh". Không ai đọc thành "Desk lo hết".
- Giới hạn **Đang chờ hoàn** chỉ đúng người cần hỏi (quản lý hoặc chủ đầu tư), theo đúng thẻ ARC, và không mở rộng quyền đọc của lễ tân.

## 7. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – PR #68 tài liệu v1.0.4 r4b (v104/ba-docs-r4b @ da98e511, chỉ tài liệu): ĐẠT** (rounds/round-04/reviews/SEC-on-v104-pr68-docs.md): chặn info@/booking@ của cơ sở, kể cả dạng +…, khớp shared-mailboxes.ts; báo trước S2 nên mã không bị dùng; không lộ cách vòng hay cấu hình (EMAIL_SHARED_MAILBOXES, EMAIL_FROM); giới hạn "Đang chờ hoàn" khớp ARC A1 (yêu cầu hoàn tối thiểu MGR, FD/FDL chỉ thấy của mình); không dữ liệu khách, tên đăng nhập, IP, khóa, số tài khoản. Suggestion S1 (nhánh gỡ: sửa chữ đậm "Desk chỉ chặn được info@"). Xung đột với #63 chỉ ở dòng Lập và bảng phiên bản, gộp sau #63 | SEC | Quyền SEC |`

## Phản hồi BA (04/11/2026)

- **FB-R4-SEC-BA-PR68-S1 – Fixed ở PR #69** (`v104/ba-2fa-ungate` @ `77cbb496`, gộp sau khi v1.0.4 lên production). Câu in đậm thành "**Desk chặn `info@` và `booking@` của cơ sở**, kể cả dạng có dấu cộng…" và giữ vế "anh/chị phải tự tránh". Sửa ở sổ tay 0.3a, 5.0; `01` 1.6a; `02` 1.6; `05` 1.5.
- Trong lúc chờ: ở #68 lượt 2, câu in đậm đã đổi thành "Tới v1.0.3, Desk chỉ chặn được `info@`" theo DOM thẻ 03.
- Ba câu S1, S2 của #63 vẫn còn sau khi gộp #63 với #68 trong nhánh #69 (đã grep).
