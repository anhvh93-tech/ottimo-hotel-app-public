# UXD review lượt 2 – v1.0.4 P4-40: Desk giữ chỗ (FE-B, PR #54)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** (lượt 2) | 04/11/2026
- Đối tượng: `origin/v104/fe-holds` @ `a00218cc` (đã merge `origin/main` @ `79df287e`, PR #47 P4-01).
- Đã đọc:
  - thẻ lượt 1 `rounds/round-04/reviews/UXD-on-v104-p4-40.md`;
  - `rounds/round-04/responses/FE-P4-40.md`, cả bảng trả lời và mục "Lượt 2";
  - mã `ReservationDrawer.tsx`, `ReservationDialogs.tsx` (`DepositDialog`), `TodayPage.tsx` (`HoldRow`), `reservations.ts` (`remaining`);
  - `gen_strings.py` trên `origin/main` (13 khóa P4-40).
- Ảnh: đủ 20 ảnh `rounds/round-04/outputs/FE/screenshots/v1.0.4-p4-40-*.png` (5 cảnh × VI/EN × 1366/1440). Ảnh dùng dữ liệu giả của mock MSW, không có dữ liệu khách thật.

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

Cả 5 thẻ lượt 1 đã đóng. Banner `hold.paid_overdue_banner` có `{cutoff}`. Brand đạt. Chữ VI/EN trên 20 ảnh khớp bảng strings.

Còn một điều kiện: **thẻ 07**. UXD quyết làm ngay trong v1.0.4, không dời sang v1.0.5. Lý do:
- Trạng thái "hold có cọc ở lại sau hạn" do chính gói này tạo ra (BUG-R3-044). Trước v1.0.4 không có trạng thái này.
- Trên cùng một trang Hôm nay, mục "Cần chú ý" nói "quá hạn từ 14:33", còn khối Giữ chỗ nói "còn 0 giờ 00 phút". Hai câu nói ngược nhau.
- Việc sửa nhỏ: một khóa (đã có trên nhánh), một nhánh `if`, một ca test.

Thẻ 06 (Minor) nên làm cùng lượt vì cùng gói và chỉ sửa một điều kiện. Nếu FE-B hết giờ thì dời v1.0.5, không chặn gộp.

Không có việc cần báo chủ đầu tư.

| Thẻ | Mức | Tóm tắt | Điều kiện gộp |
|---|---|---|---|
| 06 | Minor | Hộp Xác nhận cọc: quản lý đã tick **Chấp nhận cọc thiếu** mà khung vàng vẫn nói "Ghi nhận thêm rồi xác nhận" | Không (nên làm cùng 07) |
| 07 | Minor | Hôm nay › Giữ chỗ chờ cọc: hold quá hạn hiện "còn 0 giờ 00 phút". Dùng khóa mới `today.hold_overdue_since` | **Có** |

## 1. Thẻ lượt 1

| Thẻ | FE-B trả lời | UXD kiểm | Trạng thái |
|---|---|---|---|
| FB-R4-UXD-FE-P440-01 (Major) | Done | Ảnh `today-mgr-*`: hai mục "Cần chú ý" dùng đúng `attn.hold_overdue_one` ("Giữ chỗ OTM-0146 quá hạn từ 14:33 04/11 – cần xử lý" / "Hold OTM-0146 past its deadline since 14:33 on 04/11 – action needed") và `attn.hold_overdue_cap_one` ("… còn chờ cọc sau 12:00 ngày đến – quản lý quyết" / "… still awaiting deposit after 12:00 on arrival day – manager to decide"). `HOLD_KEYS` đã xóa. Khóa viết thẳng trong `t('…')`. `pending-keys-p4-40.json` đã xóa sau khi P4-01 gộp. Test `i18n-keys` trở về bản của main | **Đóng** |
| FB-R4-UXD-FE-P440-02 (Minor) | Done | `time = expiredAt ?? holdExpiresAt`. Có ca test. `{paid}` có đơn vị như ghi chú khóa | **Đóng** (kiểm bằng mã và test; ảnh không có cảnh 409) |
| FB-R4-UXD-FE-P440-03 (Minor) | Done | Ảnh `drawer-paid-keep-*`: khung đếm giờ hiện `rsv.hold_paid_keep` đúng chữ, VI "Đã nhận 200.000 đ/500.000 đ. Tới hạn mà chưa đủ cọc thì đơn không tự hủy, căn vẫn giữ – …". Tông `warn` trước hạn, `rsv.hold_auto` không còn hiện với hold có cọc | **Đóng** |
| FB-R4-UXD-FE-P440-04 (Minor) | Done | Ảnh `cancel-hold-paid-*`: chỉ một câu `cancel.refund_preview` với số của tính thử (200.000 đ / 200,000 VND). Không còn câu "Đang tính…" đứng cạnh. Mã dùng `??` và chỉ đọc số khi `quoteCurrent` | **Đóng** |
| FB-R4-UXD-FE-P440-05 (Suggestion) | Accepted | Ảnh `drawer-paid-overdue-*`: `Alert` tông `bad`, icon đồng hồ cát. Ghi chú khóa trên main đã ghi "Alert bad" | **Đóng** |

## 2. Kiểm theo yêu cầu

| Mục | Kết quả |
|---|---|
| `hold.paid_overdue_banner` có `{cutoff}` | **Đạt.** VI "… Mốc xử lý: 12:00 08/11." EN "… Deadline to decide: 12:00 on 08/11." Không còn `{cutoff}` thô. Không còn 12:00 viết cứng: FE truyền `rules.holdLatestTime`, test kiểm theo giờ của mock |
| Brand | **Đạt.** Diff không có `style=`, mã màu hex hay `rgb(`. Khung dùng `Alert` warn/bad, `countdown`, `li-s`, `Checkbox`, `Field` của DS. Tiêu đề hộp và khối dùng Lora, nội dung dùng Be Vietnam Pro, mã đơn và mã chuyển khoản dùng JetBrains Mono. Nền Ivory/Cream, chữ Ink/Stone. Không emoji |
| Chữ VI/EN theo bảng strings | **Đạt** cho 13 khóa P4-40, đối chiếu từng câu trên ảnh: `deposit.received_at(_help)`, `deposit.accept_shortfall(_reason)`, `field_error.reason_required`, `rsv.hold_paid_keep`, `hold.paid_overdue_banner`, `cancel.refund_preview`, `today.holds_waiting`, `attn.hold_overdue_one`, `attn.hold_overdue_cap_one`. Tiền trong câu có đơn vị ("200.000 đ", "200,000 VND") |
| 1366 / 1440 | Không vỡ, không tràn. Banner quá hạn: EN 5 dòng, VI 4 dòng trong khung đơn. Hộp Xác nhận cọc: EN dài hơn khoảng 18 px, vẫn nằm gọn trong `Modal`. Hai mục "Cần chú ý" EN xuống 2 dòng ở 1366, nút Mở vẫn thẳng hàng |
| A11y | Khung quá hạn có `role="status"`. Ô lý do có `required`, viền đỏ và câu lỗi khi bấm xác nhận mà chưa ghi |

Ghi chú về ảnh (không phải lỗi mã, không cần sửa):
- Ở `today-mgr-*`, mục `attn.hold_overdue_cap_one` hiện cho đơn đến ngày 08/11, trong khi hôm nay là 04/11. Lý do: script chụp chèn cả hai kind vào `/attention` cho cùng một đơn. Trên máy chủ thật (PR #50), `hold_overdue_cap` chỉ xuất hiện vào ngày đến. QA nên kiểm ca này trên bản tích hợp, không dựa vào ảnh.
- Ô `datetime-local` hiện "11/04/2026, 03:03 PM" ở cả bản VI, vì Chromium headless chạy locale en-US. Máy quầy tiếng Việt sẽ hiện dd/mm/yyyy theo locale của máy. UXD đồng ý với FE-B: chỉ ghi lại, không sửa. Ở v1.0.5 UXD xem có cần ô giờ riêng của DS không. Chưa đưa vào backlog.

---

### FB-R4-UXD-FE-P440-06
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/reservations/ReservationDialogs.tsx`, dòng 754–758 (`paidBefore > 0 && missing > 0` → `Alert warn` `error.DEPOSIT_INSUFFICIENT`). Ảnh `deposit-shortfall-mgr-{vi,en}-{1366,1440}.png`
- Vấn đề: hộp Xác nhận cọc của quản lý hiện cùng lúc ba thứ:
  1. khung vàng "Chưa đủ cọc: cần 500.000, đã ghi nhận 100.000. Ghi nhận thêm rồi xác nhận.";
  2. ô **Chấp nhận cọc thiếu** đã tick;
  3. ô lý do chấp nhận cọc thiếu.

  Câu (1) bảo người dùng ghi thêm tiền, còn (2) và (3) cho phép xác nhận mà không cần đủ. Ngoài ra, hai số trong câu (1) không có đơn vị, trong khi ngay trên là "500.000 đ" và khung đơn phía sau là "100.000 đ/500.000 đ". Khung này có từ trước P4-40, nhưng trước đây không có ô chấp nhận nên không mâu thuẫn.
- Vì sao quan trọng: quản lý đang làm đúng việc của BUG-R3-043 mà màn hình lại bảo làm việc khác. Người dùng dễ nghĩ phải ghi thêm tiền thì mới xác nhận được. Không sai tiền, vì máy chủ quyết theo `acceptShortfallReason`.
- Đề xuất sửa:
  - Ẩn khung vàng khi `accepting` (đã tick). Khi chưa tick, giữ khung như hiện tại, vì với lễ tân và ca chưa chấp nhận thì câu vẫn đúng.
  - Không cần khóa mới.
  - Tùy chọn, cùng lượt: truyền `money(need)` / `money(paidBefore)` thay `vnd(…)`, để số có đơn vị như các câu P4-40.
  - Thêm một ca test: tick ô chấp nhận thì không còn chữ `error.DEPOSIT_INSUFFICIENT`.
- Trạng thái: Open

### FB-R4-UXD-FE-P440-07
- Mức độ: Minor. UXD quyết **làm trong v1.0.4**, là điều kiện gộp PR #54.
- Vị trí: `product/apps/admin-web/src/pages/TodayPage.tsx`, `HoldRow`, dòng 489–493. Ảnh `today-mgr-{vi,en}-{1366,1440}.png`, khối "Giữ chỗ chờ cọc (1)"
- Vấn đề: FE-B phát hiện. Hàm `remaining()` kẹp `ms` ở 0. Vì vậy hold có cọc đã quá hạn hiện "còn 0 giờ 00 phút (hết hạn 04/11/2026 14:33)" / "0 h 00 min left (expires …)". Câu này nói là đơn còn hạn, trong khi mục đỏ "Cần chú ý" ngay bên trái nói đơn đã quá hạn từ 14:33.
- Vì sao quan trọng:
  - Câu "còn 0 giờ" làm người đọc hiểu là đơn sắp hết hạn, chưa cần làm gì. Thực tế đơn đã quá hạn và cần xử lý trong ngày (BR-303, DOM A.3).
  - Hai khối cùng trang nói ngược nhau.
  - Trạng thái này là mới ở v1.0.4, nên cần đúng ngay khi phát hành.
- Đề xuất sửa:
  - Khóa mới, UXD đã thêm trên nhánh **`v104/uxd-hold-overdue-key`** @ `9ab718d5` (từ `origin/main` @ `79df287e`, chưa mở PR). Nhánh chỉ thêm một dòng vào `gen_strings.py` và các tệp sinh:

    | Khóa | VI | EN | Tham số |
    |---|---|---|---|
    | `today.hold_overdue_since` | Quá hạn từ {at} – cần xử lý | Past its deadline since {at} – action needed | `at` = `dateTime(r.holdExpiresAt)`, như `today.hold_left` |

    Chữ khớp `attn.hold_overdue_one`, nên hai khối cùng trang nói cùng một ý. Câu cũng đúng với hold chưa cọc trong vài phút trước khi máy chủ tự hủy.
  - Cách lấy khóa vào PR #54: FE-B merge `origin/v104/uxd-hold-overdue-key` vào `v104/fe-holds`. UXD đã thử `git merge-tree` và không có xung đột. Không cần `pending-keys`. ORC không cần mở PR riêng cho nhánh này. Nếu ORC muốn gộp riêng trước thì vẫn được.
  - Chỗ dùng trong `HoldRow`:
    ```tsx
    {left ? (
      left.ms === 0 ? (
        <span className="countdown bad">
          {t('today.hold_overdue_since', { at: dateTime(r.holdExpiresAt) })}
        </span>
      ) : (
        <span className={`countdown ${left.ms < 2 * 3_600_000 ? 'bad' : 'warn'}`}>
          {t('today.hold_left', { h: left.h, m: left.m, at: dateTime(r.holdExpiresAt) })}
        </span>
      )
    ) : null}
    ```
  - Test: thêm một ca trong `v104-holds-feb.test.tsx`. Hold có `holdExpiresAt` trước `now` thì hiện `tv('today.hold_overdue_since', …)` và không còn `today.hold_left`.
  - Ảnh: chụp lại `today-mgr-vi-1366` và `today-mgr-en-1366`, chỉ hai ảnh này. Gửi UXD để đóng thẻ, không cần review lại cả gói.
- Trạng thái: Open

## Điểm nên giữ
- Lượt 2 đưa mã về đúng tệp test dùng chung của main và xóa `pending-keys-p4-40.json`. Gói không để lại phần tạm.
- `{cutoff}` lấy từ tham số quy tắc, không viết cứng 12:00. Có test khóa lại.
- Ảnh đủ 5 cảnh × 2 ngôn ngữ × 2 độ rộng, đặt tên đều, dữ liệu giả. FE-B tự phát hiện lỗi "còn 0 giờ" khi chụp và không tự viết chữ. Đây là cách làm nên giữ.

---

## r3 @ 170aaa16 (04/11/2026)

- Đối tượng: `git diff a00218cc..170aaa16`, gồm:
  - `56b51dfe`: merge khóa `today.hold_overdue_since` từ `v104/uxd-hold-overdue-key` @ `9ab718d5`. Các tệp chuỗi sinh ra giống hệt nhánh UXD;
  - `170aaa16`: sửa `TodayPage.tsx`, `ReservationDialogs.tsx` và thêm 2 ca test.
- Đã đọc `FE-P4-40.md` mục "Lượt 3" và xem 8 ảnh chụp lại: `today-mgr-*`, `deposit-shortfall-mgr-*`, VI/EN, 1366/1440.

### Kết luận r3: ĐẠT

| Thẻ | FE-B | UXD kiểm | Trạng thái |
|---|---|---|---|
| FB-R4-UXD-FE-P440-07 | Done | `HoldRow`: khi `left.ms === 0` thì hiện `countdown bad` với `today.hold_overdue_since`, đúng như đề xuất. Ảnh `today-mgr-*`: VI "Quá hạn từ 04/11/2026 14:43 – cần xử lý", EN "Past its deadline since 04/11/2026 14:43 – action needed". Câu khớp mục "Cần chú ý" bên trái và không còn "còn 0 giờ". Ở 1366 câu xuống 2–3 dòng, nút Mở đơn vẫn thẳng hàng. Test kiểm cả tông `bad` lẫn việc không còn `today.hold_left` | **Đóng** |
| FB-R4-UXD-FE-P440-06, phần chính | Done | Điều kiện hiện khung đổi thành `paidBefore > 0 && missing > 0 && !accepting`. Khi quản lý chưa tick thì khung vẫn hiện. Ảnh `deposit-shortfall-mgr-*`: sau khi tick không còn khung vàng, hộp ngắn lại, không có khoảng trống thừa. Test kiểm cả lúc trước và sau khi tick | **Đóng** |
| FB-R4-UXD-FE-P440-06, phần tùy chọn (đơn vị cho số) | Deferred | **UXD đồng ý dời sang v1.0.5.** Lý do của FE-B đúng: `error.DEPOSIT_INSUFFICIENT` còn được dùng ở đường lỗi 422 (`rsvErrorText`), và `reservation.test.tsx` đang so số không đơn vị. Nếu chỉ đổi một chỗ thì cùng một khóa sẽ hiện hai kiểu số. Ở v1.0.5, UXD ghi trong ghi chú khóa rằng `{required}`/`{paid}` có đơn vị, rồi FE đổi cả hai chỗ trong một lượt. Không chặn gộp | **Deferred v1.0.5** |

- Brand: diff không thêm màu, không thêm `style=`. Chỉ dùng lớp `countdown bad` có sẵn.
- Không còn điều kiện gộp từ phía UXD cho PR #54. Không có ESC.
