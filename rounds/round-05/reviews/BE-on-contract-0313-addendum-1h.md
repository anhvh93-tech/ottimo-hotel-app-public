# BE – Xác nhận hợp đồng 0.3.13 bổ sung 1h (ARC, PR #147)

Round 5 · bước **Review** · BE (làn BE-H, người cài đặt) · 07/11/2026

- **Đối tượng:** PR #147 @ `0943db43`, gồm `openapi.yaml` (`updateReservation`, `ReservationPatch.closerChangeReason`, bảng mã lỗi) và `contract-0.3.13.md` 1.29.
- **Đối chiếu với:** nhánh `r5-h1c` @ `aa63f67d` (chưa đẩy). Gồm:
  - `reservations.service.ts` `update()`, `reservations.controller.ts` (`recordUseCaseDenial`), `money-bridge.ts` `closerChanged()`;
  - `folio.service.ts` `syncCommissionOnly()`, `ensureCommission()`;
  - `test/integration/v5-30-closer-change.test.ts`: 16 ca; 16 đột biến, mỗi đột biến làm đỏ ít nhất một ca.
- **Không chứa:** mật khẩu, bí mật, dữ liệu khách hay số hoa hồng. Test chỉ dùng `test_rate_short`.

## Kết luận: **DUYỆT** PR #147 @ `0943db43`

1h khớp mã `r5-h1c` ở mọi luật dưới đây. 0 Blocker · 0 Major · 0 Minor · 2 Suggestion, không thẻ nào chặn gộp.

| Luật 1h | `r5-h1c` | Test |
|---|---|---|
| "Đổi" = khác giá trị đang lưu, kể cả ghi lần đầu | `closerChange = closerUserId !== row.closer_user_id` (null → B tính là đổi) | T-30-3 |
| `hold`: FD+ như cũ | Không kiểm thêm. Đơn `hold` chưa có bản ghi hoa hồng; B2/B4 tạo bản ghi cho người chốt lúc xác nhận | – (mã cũ) |
| Chưa nhận phòng: MGR+; FD/FDL → 403 | Như cũ, `FORBIDDEN_ACTION`, không ghi `access.denied` (1h không đòi) | ca (a) |
| Sau nhận phòng (`in_house`, `checked_out`, hoặc đã có `actual_checkin_at`): chỉ OWN; MGR/FDL/FD → 403 + `access.denied` sau rollback | `auditReason = CLOSER_CHANGE_AFTER_CHECKIN`, controller ghi đúng một dòng (`after = { operationId, roles }`) | ca (b), đơn `rate_missing`, đơn đã trả phòng |
| Kiểm dưới khóa đơn, 403 trước 422 của `closerChangeReason` | Kiểm quyền ngay sau `loadReservation(forUpdate)`. Lỗi lý do nằm ở lần `f.done()` thứ hai, sau 403. MGR gửi lý do ngắn → vẫn 403 | ca (b) |
| `closerChangeReason` 3–500, bắt buộc khi OWN sửa sau nhận phòng → 422 `REASON_REQUIRED`; V-08, V-09 | `Fields.text` của `main` (bỏ ký tự điều khiển – SEC A1B-01). Thẻ → 422 `CARD_NUMBER_DETECTED` | ca (b) |
| Gửi lý do mà không đổi người chốt → 422 `NOT_ALLOWED` | Cả hai dạng: cùng `closerUserId`, hoặc không có `closerUserId` | ca "NOT_ALLOWED" |
| Lý do ghi vào `after.reason` của `reservation.closer_changed`, không trả lại ở `Reservation` | Allowlist `reservation` thêm `reason`. Thêm cả `closerUserId`: trước đây khóa này bị allowlist bỏ, nên `before`/`after` rỗng | ca (a), (b), T-30-3 |
| Hoa hồng đồng bộ cùng giao dịch, khóa đơn rồi `commission` `FOR UPDATE` như B18 | Thứ tự khóa: đơn (L1) → folio (L3) → các dòng `commission` `FOR UPDATE`, đúng thứ tự B18. Khóa folio vì bước "đạt" đọc số dư | – |
| Người cũ `void`: `closer_changed` trước nhận phòng, `closer_corrected` khi OWN sửa sau | `syncCommissionOnly(…, { voidReason })`. Bản ghi `earned` cũ cũng `void`, audit `before.status = earned`. Lưới an toàn `ensureCommission` dùng `closer_changed` | ca (a), (b), đơn đã trả phòng, lưới an toàn |
| Người mới theo tỷ lệ ghim, `projected` trước B18, `earned` sau B18 | Tạo `projected` (snapshot → bản ghi đầu cùng loại người hưởng → bảng). Đơn `checked_out` → `tryEarnCommissions` (luật B18) | ca (a), đơn đã trả phòng |
| Có `payable`/`paid` → 409 `INVALID_TRANSITION` (`currentState`), không ghi gì | Kiểm đầu `syncCommissionOnly`, cả giao dịch rollback. Đơn, `version`, hoa hồng, audit không đổi | ca `payable` |

Ghi chú cho người đọc hợp đồng:
- Tên phương thức cổng là `FolioStaySync.syncCommissionOnly`, không phải `syncCommission` như ARC review 4.2 đề xuất, vì `FolioService` đã có phương thức riêng tư `syncCommission`. 1h không nêu tên, nên không lệch hợp đồng.
- DOM xác nhận khi review `r5-h1c`: bản ghi người mới `earned` có `recognized_at` = lúc OWN sửa, không giữ ngày của bản ghi cũ.

### FB-R5-BE-ARC-1H-01
- Mức độ: Suggestion
- Vị trí: `openapi.yaml` `updateReservation` (bổ sung 1h), `contract-0.3.13.md` 1.29
- Vấn đề: 1h cho OWN đổi người chốt ở đơn `checked_out`, nhưng không nói các trường khác của PATCH. Trước 1h, mọi PATCH trên `checked_out` đều 409. `r5-h1c` chỉ nhận thân gồm `closerUserId` và `closerChangeReason`; có trường khác thì vẫn 409 `INVALID_TRANSITION` (`currentState = checked_out`).
- Vì sao quan trọng: FE-A gửi một thân gộp (ví dụ thêm `internalNote`) sẽ nhận 409 mà hợp đồng không báo trước.
- Đề xuất sửa: ở 0.3.14, thêm một câu: "Đơn `checked_out`: chỉ nhận `closerUserId` (+ `closerChangeReason`); trường khác → 409 `INVALID_TRANSITION`."
- Trạng thái: Open

### FB-R5-BE-ARC-1H-02
- Mức độ: Suggestion
- Vị trí: `updateReservation` 1h, gạch "Hoa hồng đồng bộ"; bảng 1.29 cột "Hoa hồng"
- Vấn đề: chữ "`earned` sau B18" dễ hiểu thành "luôn `earned`". Mã làm theo luật B18 (`tryEarnCommissions`). Nếu folio còn nợ, hoặc người hưởng mới còn khoản thu chưa đối soát, bản ghi mới ở `projected`, giống bản ghi cũ lúc đó.
- Vì sao quan trọng: QA viết ca theo chữ hợp đồng.
- Đề xuất sửa: đổi thành "ở trạng thái đơn đang đạt theo luật B18 (`projected` nếu chưa đủ điều kiện đạt)".
- Trạng thái: Open
