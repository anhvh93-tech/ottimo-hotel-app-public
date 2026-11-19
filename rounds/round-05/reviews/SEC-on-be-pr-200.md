# SEC review – BE PR #200 (FB-INV-012 §12.4: giá dọn thêm theo căn cho khách dài hạn)

- Người review: SEC | Round 5 – Bước: Review (code) | Ngày: 19/11/2026
- Đối tượng: PR #200, nhánh `r5-fb012-cleaning-fee`, head `58935c02` (gốc `d5c61256`), CI xanh
- Đã đọc trong `gh pr diff 200`:
  - `parameter-rules.ts`, `parameters.service.ts`, `ParameterService.set`;
  - `folio/public/cleaning-fee.ts`, `folio-lines.service.ts`, `folio.controller.ts`;
  - `guest-requests.service.ts`;
  - `openapi.yaml`, `ds-e.json`;
  - `test/integration/fb-inv-012-cleaning-fee.test.ts`;
  - mục "12.4" trong `BE-responses.md`.
- Không ghi số tiền hoa hồng hay tỷ lệ thưởng vào tài liệu này. PR cũng không có số nào như vậy. Giá dọn trong seed là giá bán cho khách, không phải bảng giá nội bộ (CI "confidential paths" xanh).

## Kết luận

**Đạt. Đồng ý gộp. Không có Major.** Có 3 thẻ Minor. Cả ba chỉ thêm lớp phòng thủ và thêm test, không chặn v1.0.7.

## Kết quả theo 5 điểm ORC yêu cầu kiểm

| # | Điểm | Kết quả | Căn cứ |
|---|---|---|---|
| 1 | Hook kiểm giá: căn có trong danh mục, số nguyên, bội 1.000, trong 1.000–5.000.000 | **Đạt** | `checkStructuredParameter`, mục `long_stay_cleaning_fee_by_room`. Không phải object → 422. Căn lạ → 422 `PARAM_OUT_OF_RANGE` + `NOT_IN_LIST`. `isInt`, biên dưới/trên, `% 1_000` → 422. Khóa `__proto__` trong JSON không có trong danh mục căn, nên cũng bị chặn. Có test cho căn lạ, 150.500, 0, âm, 5.001.000, chuỗi, số lẻ, mảng, `null`, và FDL/FD → 403. Bên đọc có `roomPriceOf`: chỉ nhận số nguyên dương an toàn; giá trị lưu hỏng thì dùng giá mặc định, không làm lỗi màn đọc. Biên dưới 1.000 (contract ghi 0) là việc ARC/DOM chốt, không ảnh hưởng bảo mật |
| 2 | MGR sửa giá có audit | **Đạt** | Đi đường chung `setParameter` → `ParameterService.set`: kiểm `edit_roles` (OWN/MGR, A101), audit `config.changed` có `before.value`, `after`, `reason`, người sửa. Test chưa kiểm dòng audit (thẻ 200-03) |
| 3 | Trang khách không lộ giá căn khác hay folio | **Đạt** | `options()` chỉ trả `feeVnd` của đơn trong phiên khách (`stay.reservationId`). Khách không nhận được bảng giá, số căn khác hay `priceSource`. `guestDto` chỉ có `feeVnd` đã chụp lúc gửi. `ParameterMissingError` của bảng giá → dùng giá mặc định, không lộ lỗi |
| 4 | `getChargeCatalog?folioId` không đọc được folio của cơ sở khác hay căn khác (IDOR) | **Đạt** | Kiểm `UUID` trước (sai dạng → 422). Truy vấn chạy trong `db.withContext(tenantOf(p))`, nên RLS của `folio` giới hạn theo cơ sở của phiên. Không có folio → 404 (có test). x-roles chỉ gồm OWN/MGR/FDL/FD, các vai này vốn đã xem mọi folio của cơ sở. SAL/CTV/HK/MT không gọi được. Phản hồi chỉ có giá dọn và `priceSource`, không có dòng folio, không có thông tin khách. Thiếu test sang cơ sở khác (thẻ 200-02) |
| 5 | Yêu cầu khách đã gửi giữ giá cũ | **Đạt** | Giá được chụp vào `fee_vnd_snapshot` lúc khách POST. Lúc ghi folio dùng `postLines` với giá đã chụp (mã cũ, PR này không đổi). Test: yêu cầu gửi trước khi MGR đặt bảng giữ `ADHOC`, yêu cầu mới nhận 200.000. Chưa có test hoàn tất yêu cầu cũ rồi kiểm số tiền dòng folio (thẻ 200-03) |

## Kiểm thêm
- **`addFolioLine`:** giá do server quyết. Gửi `unitPriceVnd` → 422 `PRICE_NOT_EDITABLE` (có test). `serviceDate` dùng để chọn giá chỉ được nhận khi là một ngày thật (`isRealDay`). Phần kiểm cũ vẫn đòi ngày này nằm trong khoảng ở, ngoài khoảng → 422. Lễ tân có thể chọn ngày dịch vụ ở một đoạn khác của cùng lượt ở, nên giá có thể khác, nhưng chỉ trong bảng do OWN/MGR đặt, và dòng folio có người ghi. Chấp nhận.
- **SQL:** mọi truy vấn mới đều tham số hóa (`$1`, `$2`). Không ghép chuỗi.
- **Lỗi 422 của hook có `extras.allowed`** (danh sách số căn). Chỉ OWN/MGR thấy. Chấp nhận.
- **Có một chênh lệch nhỏ, đã có từ trước PR:** khách xem giá ở `options`, rồi giá chụp lúc POST là giá tại thời điểm POST. Nếu MGR đổi bảng đúng giữa hai lúc, khách đồng ý một giá chưa thấy. Khả năng rất thấp, và đây là luồng cũ của `adhoc_cleaning_fee`. Không ra thẻ. Nếu UXD/DOM muốn chặt hơn, khách có thể gửi kèm `feeVnd` đã thấy, sai thì trả 409.

## Thẻ feedback

### FB-R5-SEC-BE-200-01
- Mức độ: Minor
- Vị trí: `parameters.service.ts`, hàm `roomNos` truyền vào `checkStructuredParameter`: `SELECT room_no FROM room ORDER BY room_no`.
- Vấn đề: danh sách căn hợp lệ chỉ dựa vào RLS để giới hạn theo cơ sở. Các truy vấn khác cùng file đều lọc rõ `property_id = pc.propertyId`. Nếu RLS của `room` bị tắt tạm, ví dụ như các migration backfill 0068/0071/0075 từng tắt rồi bật lại, hoặc nếu có thêm cơ sở thứ hai, hook sẽ nhận số căn của cơ sở khác.
- Đề xuất sửa: thêm `WHERE property_id = $1` với `pc.propertyId`, giống các truy vấn bên cạnh. Một dòng. Hạn: cùng PR nếu còn sửa; nếu không thì 31/12.
- Trạng thái: Open

### FB-R5-SEC-BE-200-02
- Mức độ: Minor
- Vị trí: `folio.controller.ts` `catalog` (`folios.get` chỉ có `WHERE id = $1`); `fb-inv-012-cleaning-fee.test.ts`.
- Vấn đề: chặn IDOR giữa các cơ sở hoàn toàn dựa vào RLS. Đây là cách cả module đang làm, nhưng operation mới này chưa có test cho trường hợp đó. Test 404 hiện tại chỉ dùng một UUID ngẫu nhiên.
- Đề xuất sửa: thêm 1 test. Dựng folio ở cơ sở B, gọi `getChargeCatalog?folioId=<folio B>` bằng phiên của cơ sở A, phải nhận 404 và không có `priceSource`. Có thể so thêm `folio.property_id === p.propertyId` ở controller cho chắc. Hạn 31/12.
- Trạng thái: Open

### FB-R5-SEC-BE-200-03
- Mức độ: Minor
- Vị trí: `fb-inv-012-cleaning-fee.test.ts`, Q20.
- Vấn đề: hai điều đúng trong mã nhưng chưa có test giữ.
  - (a) MGR sửa bảng thì có đúng một audit `config.changed` (`entityId = long_stay_cleaning_fee_by_room`), có `before`/`after`.
  - (b) Hoàn tất yêu cầu gửi trước khi đổi giá thì dòng folio ghi giá đã chụp (`ADHOC`), không phải giá mới.
- Đề xuất sửa: thêm 2 khẳng định vào Q20. Hạn 31/12.
- Trạng thái: Open

## Giả định
- RLS của `folio` và `room` đang bật và áp cho vai DB của API, như các review trước. PR không đổi chính sách RLS.
- Giá dọn thêm là giá công khai cho khách, nên để trong seed của repo công khai là chấp nhận được.
