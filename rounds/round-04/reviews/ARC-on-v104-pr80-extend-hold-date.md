# ARC review – PR #80: hạn gia hạn giữ chỗ hiện đúng ngày theo giờ Việt Nam (sửa FB-R4-ARC-FE-PR76-01)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review chéo** | 05/11/2026
- Đối tượng: `v104/fe-extend-hold-local-date` @ `796a0cee`, một commit cắt từ `main` `373ec195`.
- Tệp:
  - `apps/admin-web/src/pages/reservations/ReservationDialogs.tsx` (+4/−2): `ExtendHoldDialog` định dạng hạn bằng `dayMonth(todayLocal('Asia/Ho_Chi_Minh', d))`;
  - test mới `apps/admin-web/src/__tests__/v104-extend-hold-local-date.test.tsx` (1 ca).
- ARC tự chạy trong worktree tạm (đã xóa). Chỉ chạy tệp test mới, với bộ giả giờ riêng của ARC (không commit): giả `Date` về giờ cần thử theo giờ Asia/Ho_Chi_Minh, chạy trước `setup.ts`.

## Phán quyết (head `796a0cee`): **ĐẠT CÓ ĐK**

Điều kiện duy nhất: **CI xanh ở `796a0cee`**. Lúc ghi review, `API contract`, `OpenAPI lint` và `no test endpoints` đã xanh; các job còn lại đang chờ.

- Bản sửa đúng gốc. Một hàm `fmt` dùng cho cả nút "Gia hạn đến …" và thông báo sau khi gia hạn, nên một chỗ sửa phủ cả hai.
- Lời FE về đợt quét là đúng với phạm vi FE nêu. Có thêm 3 chỗ cùng họ lỗi nhưng ở dạng khác; cả 3 đúng ở production nhờ hợp đồng (mục 2).
- Thẻ dưới đây chỉ là Suggestion, không chặn gộp.
- Thẻ FB-R4-ARC-FE-PR76-01: **Done** khi #80 gộp.
- Gộp #80 không xung đột với #75, #76, #71, #74 (`git merge-tree` sạch). Không PR mở nào khác chạm `ReservationDialogs.tsx`.

## 1. Test có thể xanh nhầm trên `main` không

Test không phụ thuộc giờ chạy:
- Hạn giữ chỗ được đặt cố định lúc **01:00 giờ Việt Nam** ngày mai: `${addDays(today, 1)}T01:00:00+07:00`.
- Gia hạn +24 giờ cho ra 01:00 ngày kia. Trần 12:00 ngày đến ở rất xa (ngày đến = hôm nay + 5).
- Trên `main`, ngày hiện ra là ngày UTC của mốc đó, tức sớm một ngày. Test so khớp **nguyên văn** tên nút (`rsv.extend_submit`) và câu thông báo (`rsv.toast.hold_extended`).
- Hai ngày này luôn khác nhau, nên `main` không thể xanh nhầm.

Kết quả chạy (ngày thật 05/11; ngày mong đợi trong test là 07/11):

| Mã | Giờ giả 00:30 · 03:00 · 06:30 · 07:00 · 12:00 · 23:30 · giờ thật | Lý do đỏ |
|---|---|---|
| PR `796a0cee` | **Xanh ở cả 7 giờ** | – |
| `main` `373ec195` | **Đỏ ở cả 7 giờ** | Nút hiện "Gia hạn đến 01:00 **06/11**", test tìm "… 01:00 **07/11**". Đỏ đúng lý do: lệch ngày, không phải hộp không mở |
| Đột biến: `todayLocal()`, không truyền `d` (lấy ngày của "bây giờ") | Đỏ ở cả 7 giờ | Nút hiện "01:00 05/11" |
| Đột biến: `businessDayLocal(tz, d)` (dùng nhầm ngày làm việc) | Đỏ ở cả 7 giờ | Nút hiện "01:00 06/11" |

Câu thông báo cũng được kiểm thật:
- Mock trả hạn mới bằng chuỗi UTC (`Z`). Thông báo dựng lại qua `fmt(new Date(…))`.
- Thông báo khớp câu mong đợi ở mọi giờ, tức thông báo cũng dùng ngày Việt Nam.

## 2. Lời FE về đợt quét `toISOString().slice(0, 10)` có đúng không

**Đúng với mã sản phẩm và mock của admin-web.** Sau #80, các chỗ còn lại đều cộng/trừ cả ngày từ mốc `T00:00:00Z` (`setUTCDate`), nên an toàn:
- `app/dates.ts` 72 (`shiftDay`);
- `app/reservations.ts` 48 (`addDays`);
- `app/problem.ts` 60;
- mock `mocks/reservations.ts` 81 và `mocks/stay.ts` 76.

Mọi `toISOString()` còn lại trong mã sản phẩm đều gửi nguyên thời điểm, không cắt lấy ngày:
- `MoneyPage` 851;
- `HousekeepingPage` 168, 294;
- `CheckOutPage` 2096.

Ngoài lời FE (để FE và QA biết, không chặn #80):

| Chỗ | Tình trạng |
|---|---|
| Test: `v104-holds-feb.test.tsx` 577, 587 | Lấy ngày UTC từ "bây giờ". #76 ghim giờ; thẻ PR76-02 đề nghị đổi sang `todayLocal()` |
| Test: `s4-money.test.tsx` 714 | `yesterday` lấy từ `Date.now()`. Ban đêm số này thành "hôm kia", nhưng ca vẫn đúng |
| **Cùng họ lỗi, dạng khác:** cắt ngày từ chuỗi thời điểm của máy chủ bằng `.slice(0, 10)` | 3 chỗ: `ReservationDrawer.tsx` 485 (hạn giữ chỗ trong ngăn đơn), `DepositNotices.tsx` 55, `WebRequestDrawer.tsx` 554 |
| Vì sao 3 chỗ trên vẫn đúng ở production | Hợp đồng quy định "Thời điểm: ISO-8601 có offset `+07:00`" (`openapi.yaml` dòng 22). Máy chủ ghi thời điểm qua `iso()` của ngữ cảnh cơ sở (`toZonedIso`), ví dụ `reservation-dto.ts` 183 |
| Nhưng | MSW mock trả `hold.expiresAt` dạng `Z` (`mocks/reservations.ts` 316, 1915). Trên mock, ban đêm, ngăn đơn hiện ngày UTC. Mock lệch hợp đồng, nên một lỗi kiểu này ở production sẽ không lộ ra trong test (thẻ 01) |
| `RecoveryCodes.tsx` 89 | `toLocaleString('vi-VN')` không có `timeZone`, nên theo múi giờ của máy. Máy Desk ở Việt Nam nên đúng. Nên truyền `timeZone` cho chắc; không thành thẻ |

## 3. Thẻ feedback

### FB-R4-ARC-FE-PR80-01
- Mức độ: Suggestion (v1.0.5)
- Vị trí:
  - `ReservationDrawer.tsx` 485, `DepositNotices.tsx` 55, `WebRequestDrawer.tsx` 554;
  - mock `mocks/reservations.ts` 316, 1915 (và các chỗ khác dựng thời điểm bằng `toISOString()`).
- Vấn đề:
  - Ba màn lấy ngày bằng cách cắt chuỗi thời điểm máy chủ gửi về. Cách này chỉ đúng khi chuỗi mang offset `+07:00`.
  - Hợp đồng đảm bảo điều đó, nhưng mock lại trả `Z`. Vì vậy test chạy ban đêm trên mock thấy ngày sai, còn production thì đúng.
  - Ngược lại, nếu có ngày máy chủ trả `Z` (sai hợp đồng), test trên mock sẽ không bắt được.
- Vì sao quan trọng: cùng họ lỗi PR76-01. Đây là hạn giữ chỗ và giờ khách báo chuyển cọc mà lễ tân đọc cho khách.
- Đề xuất sửa (chọn một, hoặc cả hai):
  - (a) Client lấy ngày từ thời điểm, không từ chuỗi: `dayMonth(todayLocal(tz, new Date(at)))`, như #80. Cách này không phụ thuộc offset.
  - (b) Mock trả thời điểm theo hợp đồng (`+07:00`), bằng một helper chung như `toZonedIso` của máy chủ.
  - Gợi ý thêm: `fmt` ở #80 và `holdUntil` ở `BookingDialog` dùng cứng `'Asia/Ho_Chi_Minh'`. Khi lên chuỗi nhiều cơ sở, nên dùng `property.timezone` cho cả giờ lẫn ngày, như `DepositNotices` đã làm. Hiện chỉ có một cơ sở ở Đà Lạt nên chưa ảnh hưởng.
- Trạng thái: Open

## 4. Điểm làm tốt

- Test cố định **mốc hạn** lúc 01:00, không cố định giờ chạy. Nhờ vậy test đỏ trên `main` ở mọi giờ, và không cần `pinDaytime()`.
- Sửa ở đúng một hàm dùng chung cho nút và thông báo, theo cùng cách với `holdUntil` đã có ở `BookingDialog`. PR không đổi chữ, không đổi hợp đồng.
- Báo cáo có kết quả đỏ/xanh ở nhiều giờ giả, và có đợt quét cùng kiểu lỗi trong admin-web.
