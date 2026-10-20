# BE-B – phản hồi Round 2, Sprint 4 (cổng QC, C11 – `qc/s4-qc-gate.md` mục 10.5)

- Vai: BE-B (folio, payments, inventory/minibar, approvals) | Ngày: 20/10/2026 | Chỉ đọc mã và ghi tài liệu, không sửa `src`, không commit.
- Đầu vào:
  - commit `c293ceb` (repo `anhvh93-tech/ottimo-hotel-app-public`);
  - `reviews/s4-SEC.md` (FB-R2-SEC-BE-65, 74, 75, 79, 83);
  - `responses/s4-PO.md` (bảng chỉ mục backlog R3).

## 1. Review chéo – BE-C sửa FB-R2-SEC-BE-65 (c293ceb)

**Kết luận: OK – không mở thẻ.**

| Tệp | Đã đọc | Nhận xét |
|---|---|---|
| `files/public/attachment.service.ts` | **Ảnh `penalty_evidence` tải lên sau khi lượt kết thúc** (`checked_out` / `cancelled` / `no_show`): đặt mốc = lúc tải lên (b1). **`setRetentionAnchorForRef`**: ghi đè mốc theo **một** bản ghi, không theo `purpose`; mở lại phiếu thì xóa mốc. **`purgeDue`**: chỉ đếm `anchorMissing` (b2), không xóa | Đúng đề xuất của SEC. Mốc lúc tải lên ≥ giờ trả phòng, nên ảnh được giữ lâu hơn chứ không ngắn hơn. Lưới an toàn chỉ đếm, không xóa – đúng, vì đơn dài hạn có thể vẫn đang ở |
| `housekeeping/internal/work-orders.service.ts` | `complete` và `cancel` → mốc = `c.now` (đóng phiếu); `reopen` → mốc NULL | Chạy trong giao dịch của lệnh chuyển trạng thái phiếu (đã giữ khóa phiếu). Phiếu đóng lại thì đặt lại mốc |
| `housekeeping/internal/housekeeping.service.ts` | Ảnh kiểm phòng: `retentionAnchorAt = performedAt` lúc `bindTo` | Đúng: mốc = `inspected_at` |
| `registration` (`registration.service.ts`, `registration.repo.ts`) | Hủy đơn / no-show đặt mốc cho ảnh phạt đã tải trước đó (`setRetentionAnchor`, chỉ dời về sau). Gộp điều kiện "không gắn với ai" (`LINKED_TO_NOBODY_SQL`, `UNCLAIMED_DOC_SQL` – ARC-BE-S4-21) | Thứ tự giống `onCheckedOut` (registration trước, attachment sau). No-show được khôi phục rồi trả phòng thì mốc dời tiếp về sau – chấp nhận |
| Migration `0078` | Chỉ bù dữ liệu cho dòng còn mốc NULL và chưa xóa; không dời mốc đã có. Phiếu `cancelled` lấy mốc = `updated_at` (giữ lâu hơn). RLS tắt/bật đủ 4 bảng | Không đổi lược đồ; snapshot đầu 0078 theo mẫu 0075 |

**Ghi chú nhỏ (không chặn, không mở thẻ):** nếu sau này cho gắn ảnh vào phiếu **đã** `done` mà không mở lại phiếu, ảnh đó sẽ không có mốc cho tới khi phiếu đóng lần nữa. Hiện mã không có đường này, và nếu có thì `anchorMissing` của J16 cũng đếm được. Nên giữ nguyên ý này trong FB-R2-SEC-BE-84 (R3).

## 2. Thẻ SEC Major của BE-B còn dời

| ID | Vai của BE-B | Trạng thái mới | Phản hồi |
|---|---|---|---|
| FB-R2-SEC-BE-83 | Người sửa (folio/approvals – chặn chia nhỏ `debt_write_off` dưới hạn mức BR-433) | **Deferred → backlog R3-Q22** | Hạn: trước khi có dữ liệu thật. Câu nghiệp vụ đã có ở BR-433 (a)(b)(c) và BR-525 [R3]. Phần cài đặt làm ở R3; `pendingFix` của oracle giữ là `R3-SEC-BE-83` (`br-examples.json`). R2 vẫn có ghi vết: mỗi lần xóa nợ có một dòng FOC `post_checkout` mã `debt_write_off` và audit money; trần lúc gửi và lúc duyệt theo `openDebtVnd` (FB-R2-SEC-BE-80) |
| FB-R2-SEC-BE-74, FB-R2-SEC-BE-79 | Chỉ review (người sửa là BE-C) | Deferred → backlog **R3-Q17** (theo `s4-PO.md`) | BE-B review khi BE-C làm ở R3 |
| FB-R2-SEC-BE-75 | Không liên quan BE-B (người sửa BE-C) | Deferred → R3-Q17 | – |
