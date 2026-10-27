# ARC – Hợp đồng API 0.3.9 cho bản vá v1.0.1 (04/11)

- Vai: ARC | Round 3 – Phản hồi & sửa | Ngày: 27/10/2026 | Nhánh `arc-contract-v1.0.1` (từ `main` `a54cd6f`), **chưa push, chưa gộp**
- Đầu vào: báo cáo FE-A `early-departure-fe-a.md` (commit `71edd63`, nhánh `fe-a-early-departure`), FB-R3-DOM-BA-02 (Blocker), `rounds/round-03/qa/bug-list.md` BUG-R3-018, `rounds/round-03/outputs/FE/fb-inv-005-fe-a.md`, BR-428 + BR-011 (`business-rules.md`), oracle `product/tests/fixtures/br-examples.json` BR-428-01…06, mã nguồn `stay.service.ts` (`earlyDeparture`), `rooms.service.ts` (`writePrice`), `unit-of-work.ts`, `auth.guard.ts`.
- **Phạm vi phát hành**: chỉ v1.0.1. v1.0.0 (B2 sáng 28/10, ngày chạy 02/11) giữ hợp đồng 0.3.8 – **không** gộp nhánh này vào `main` trước khi cắt v1.0.0.

## 1. Tóm tắt thay đổi (0.3.8-draft → 0.3.9-draft, chỉ cộng thêm)

| # | Chỗ | Thay đổi | Ai cài |
|---|---|---|---|
| 1 | `earlyDeparture` (B16) | Thân thêm `dryRun`, `expectedRefundVnd`, `expectedFeeVnd`; mô tả luồng Desk + hướng dẫn cài; khai thêm 409/412/422; ví dụ request tính thử/ghi | BE-A, FE-A |
| 2 | `EarlyDepartureResult` | Thêm `noticeDays`, `noticeBusinessDate`, `droppedNights[]`, `droppedNetVnd`, `refundableVnd`, `roomChangeDifferenceVnd`, `refundCapped`, `otaRetainedMaxVnd`, `otaRetainedRequired`, `evidenceRequired`, `childBookings[]`, `registrationNeedsUpdate`; quan hệ giữa các số (để QA kiểm) | BE-A |
| 3 | Mã lỗi | **`AMOUNT_CHANGED` (409)** – lần ghi B16 lệch số đã hiện; kèm `refundVnd`, `earlyDepartureFeeVnd` | BE-A (bảng mã sinh tự động) |
| 4 | `Room.scheduledListPrices[]` + schema `RoomScheduledListPrice` | Giá đã lên lịch (`effectiveFrom` > ngày nghiệp vụ), chỉ OWN/MGR (`x-visible-to`) | BE-A, FE-A |
| 5 | **`cancelScheduledRoomListPrice`** (mới) | `POST /v1/properties/{propertyId}/rooms/{roomId}/list-prices/actions/cancel-scheduled` – OWN/MGR, `x-rbac: [S25]`, `Idempotency-Key` + `If-Match` (= `Room.version`), trả `Room` + `ETag` | BE-A, FE-A |
| 6 | `updateRoom` | Làm rõ hành vi đã cài: ghi **một dòng đủ hai giá** cho ngày D, ghi đè dòng cùng ngày | – |
| 7 | Quy ước chung "Hành động không đảo ngược" | Ghi rõ B16 có `dryRun` từ 0.3.9; quy tắc: chỉ khai `dryRun` khi handler đã cài, nếu chưa thì handler chặn | – |
| 8 | `Room.version` | Mô tả: tăng ở mọi lần sửa căn, kể cả đổi giá và hủy giá đã lên lịch | BE-A (hủy lịch phải tăng) |

Không đổi `x-roles` của operation cũ. Không thêm mã hành động rbac. Không thêm mã trường lỗi.

## 2. B16 – quyết định và lý do

### 2.1 Gọn lại đề xuất của FE-A

| Trường FE-A đề xuất | Chốt | Lý do |
|---|---|---|
| `noticeDays` | Giữ | BR-011; 0 ngày → không hoàn 50 %. Server tính **cả khi** lượt ở chỉ có đêm OTA bị bỏ (code hiện chỉ tính khi có đêm trực tiếp) |
| – | **Thêm** `noticeBusinessDate` | Giải thích ca biên BR-428-03 (báo 01:00 ngày 22/10 → ngày nghiệp vụ 21/10 → 1 ngày) |
| `droppedNights[{date, roomNo, netVnd, ota}]` | Giữ + `reservationCode` | Lượt ở có đơn con gia hạn (BR-422): đêm bỏ thuộc nhiều đơn. `roomNo` nullable |
| `droppedNetVnd` | Giữ | Cơ sở BR-428 = Σ đêm **không** OTA (oracle `refundBaseVnd`) |
| `refundableVnd` | Giữ | Phần 50 % đã làm tròn, trước trần |
| `extraPersonRefundVnd` / `ReversedVnd` | Giữ (đã có từ 0.3.6) | – |
| `roomChangeDifferenceVnd` | Giữ | BR-428 bổ sung 17/10: chênh lệch đổi phòng đơn OTA hoàn 100 % |
| `refundVnd` | Giữ (đã có) | Đã trần theo số dư thừa chưa xử lý **sau** thay đổi |
| – | **Thêm** `refundCapped` | Để Desk nói "hoàn tối đa số khách đã trả thừa" mà không tự trừ tiền ở client |
| `earlyDepartureFeeVnd` | Giữ (đã có) | – |
| `otaRetainedMaxVnd` | Giữ | Trần ô "Số OTA giữ lại"; **vắng** khi không có đêm OTA bị bỏ |
| `evidenceRequired` | Giữ | – |
| – | **Thêm** `otaRetainedRequired` | Lần tính thử đầu chưa có số OTA: không trả 422 mà bật cờ để hộp hiện ô nhập |
| `childBookings[]` | Giữ, dạng `{reservationId, code, droppedNightCount, cancelled}` | Đơn con bị hủy hẳn là hậu quả phải hiện |
| – | **Thêm** `registrationNeedsUpdate` | Chỉ nhắc khai báo khi lượt ở có giấy tờ khách nước ngoài (đúng `registration.onDepartureChanged`) |

Không thêm trường "giờ trả muộn bị hủy" (`replaceLateCharge`) – trường hợp hiếm, đã nằm trong `refundVnd` qua số dư; ghi ở rủi ro.

Các trường diễn giải để ngoài `required` (chỉ để server 0.3.8 không vi phạm hợp đồng). Server 0.3.9 **luôn** trả, cả đường ghi – màn kết quả dùng lại bảng.

### 2.2 Luồng và quy tắc
1. Desk gọi `dryRun=true` (`newDepartureDate`, `noticeGivenAt`) – không cần hai header.
2. Nếu `otaRetainedRequired`/`evidenceRequired` → hiện ô, lễ tân nhập, gọi `dryRun=true` lại. Ở tính thử, **chỉ** hai lỗi "thiếu dữ liệu bổ sung" này đổi thành cờ; các lỗi khác (`DATE_INVALID`, `VALUE_OUT_OF_RANGE` + `max`, `NOT_ALLOWED`, `INVALID_TRANSITION`, `PAYMENT_NOT_CONFIGURED`) trả như lần ghi để báo ngay tại ô.
3. Xác nhận → `dryRun=false`, **cùng thân** + `expectedRefundVnd` = `refundVnd`, `expectedFeeVnd` = `earlyDepartureFeeVnd` của lần tính thử cuối, `Idempotency-Key` mới, `If-Match` = `reservation.version` của lần tính thử (tính thử trả đơn **đang lưu**, chưa đổi).
4. Lệch số → `409 AMOUNT_CHANGED` (kèm số mới), không ghi gì → Desk tính thử lại, hỏi lại lễ tân.
5. `expectedRefundVnd`/`expectedFeeVnd` vắng = không so (để test API/E2E cũ không vỡ). Desk **luôn** gửi.

### 2.3 Vì sao giao dịch luôn ROLLBACK (ADR-015)
`earlyDeparture` ghi trước rồi mới tính được: giải phóng occupancy → void đêm → `resyncStay` (cả `ota_collect` đơn OTA trả trước) → đảo chênh lệch đổi phòng → ghi dòng phí → **rồi** đọc `unhandledCreditVnd` để trần số hoàn. Không chạy được trong `read()` readOnly như `setLateCheckout`. Viết công thức thứ hai dễ lệch đúng chỗ đã sinh BUG-R3-012/013/014. Nên tính thử chạy **chính hàm ghi** trong giao dịch luôn rollback. Chi tiết, phương án loại bỏ và test bắt buộc ở `product/docs/adr/ADR-015-dry-run-rollback-transaction.md`.

### 2.4 Chốt fail-closed (đã làm trong nhánh này)
Meta sinh lại khai `dryRun: true` cho `earlyDeparture`. Vì vậy guard và unit of work **bỏ** `Idempotency-Key`/`If-Match` khi thân có `dryRun: true` (SEC-BE-21). Handler hiện tại không có nhánh tính thử: nếu không chặn, lời gọi `dryRun: true` sẽ **ghi thật mà không có khóa idempotency**. Đã thêm 6 dòng vào `frontdesk.controller.ts`: `dryRun: true` → 422 `NOT_ALLOWED` (`field` = `dryRun`) **trước** `uow.run`. Hành vi giống hệt hôm nay (trước đây guard trả cùng lỗi). BE-A gỡ chốt này trong PR cài tính thử.

## 3. BUG-R3-018 phần 1 – quyết định và lý do
- **Đọc**: thêm `Room.scheduledListPrices[]` vào `Room`. Không làm endpoint riêng: Desk đã gọi `listRooms`, mỗi căn chỉ có vài dòng. Chỉ OWN/MGR thấy, theo rbac ghi chú 25a: vai tra cứu không thấy lịch sử/lịch giá. `changedBy` là tên hiển thị như `Parameter.changedBy`; `changedAt` = `updated_at`.
- **Hủy**: dùng operation riêng theo mẫu `cancelScheduledParameter`, nhưng **không** đòi S2 vì giá niêm yết không phải tham số bảo mật, cùng mức với `updateRoom`. Thêm `If-Match` = `Room.version` (khác tham số): hai người cùng sửa giá một căn thì người sau nhận 412.
- Các luật:
  - Dòng ≤ ngày nghiệp vụ → 409 `INVALID_TRANSITION` (`currentState = effective`).
  - Không có dòng → 404.
  - Không xóa được dòng **duy nhất** của căn → 409 (`currentState = only_price`). Trường hợp này là căn tạo với `activeFrom` tương lai; nếu xóa, căn sẽ không còn giá.
  - Audit `config` `room.list_price_cancelled`.
  - Đơn/báo giá đã lưu không đổi (BR-006).
- **Rủi ro QA đã ghi (điền sẵn giá)**: `updateRoom.listPrice` luôn ghi đủ hai giá cho ngày D. Hợp đồng chốt: Desk lấy dòng đang áp cho D, tức dòng có `effectiveFrom` lớn nhất ≤ D trong {`currentListPrice`} ∪ `scheduledListPrices`. Desk điền sẵn **cả hai** ô bằng dòng đó và so "đã đổi" với dòng đó. Đây là chọn dòng, không phải tính tiền, nên làm ở client được.

## 4. Việc cụ thể theo vai

### BE-A (B16 + rooms) – ước 0,75–1 ngày
**B16**
1. Cài `dryRun` theo ADR-015 (a): `uow.simulate` (hoặc tương đương), giao dịch ghi được cùng ngữ cảnh tenant, `lock_timeout` ngắn, không `idempotency_key`, gọi `earlyDeparture(..., { dryRun: true })`, `ROLLBACK` trong `finally`. Trong chế độ dry, bỏ `approvals.submit` (chỉ giữ `refundVnd`), `attachments.bindTo` (vẫn `assertUsable`), `audit.recordMoney`. Trả `reservation` là đơn **đang lưu**, đọc lại sau rollback hoặc chụp trước khi ghi.
2. Ở tính thử, đổi `REQUIRED otaRetainedVnd` và `EVIDENCE_REQUIRED` thành cờ, tính phần OTA = 0. Lần ghi giữ 422.
3. `expectedRefundVnd`/`expectedFeeVnd`: so ngay trước bước tạo yêu cầu hoàn (đã có `refundVnd` cuối). Lệch → `problem('AMOUNT_CHANGED', { extras: { refundVnd, earlyDepartureFeeVnd } })` để rollback toàn bộ.
4. Trả đủ trường mới ở **cả hai** đường:
   - `noticeDays` tính cả khi không có đêm trực tiếp;
   - `droppedNights` lấy từ `parts` + segment (số căn);
   - `refundCapped`;
   - `registrationNeedsUpdate`: cần một hàm đọc ở registration port, "lượt ở có giấy tờ khách nước ngoài". Hàm này phải không khóa, không publish.
5. Gỡ chốt fail-closed ở `frontdesk.controller.ts` trong **cùng** PR.
6. Test (bắt buộc, theo ADR-015 mục 4):
   - oracle BR-428-01…06 qua cả tính thử và lần ghi;
   - tính thử không đổi số dòng `reservation_change`, `stay_night`, `folio_line`, `approval_request`, `audit_event`, `idempotency_key`, outbox, và không đổi `reservation.version`;
   - không header vẫn 200;
   - lệch số → 409, không ghi;
   - replay cùng `Idempotency-Key`;
   - FD/FDL/MGR/OWN được, HK/SAL 403 (đã có trong `rbac-cases`).

**Rooms**
1. `loadRoom`/`list`: truy vấn `room_list_price` có `effective_from > pc.today`, nối `app_user.display_name`, sắp tăng dần. Serializer lọc theo `x-visible-to`; vai khác thì trường **vắng**.
2. `cancelScheduledRoomListPrice`:
   - khóa `room FOR UPDATE`, `assertVersion`;
   - kiểm theo mục 3, xóa dòng, `version + 1`;
   - audit `room.list_price_cancelled` (`before.listPrice`, `after.cancelledEffectiveFrom`, `reason`);
   - trả `Room` + `ETag`.
3. Test:
   - FDL/FD/SAL/CTV không thấy `scheduledListPrices` và gọi hủy bị 403;
   - 409 `effective`/`only_price`, 404, 412;
   - báo giá ngày D sau khi hủy về giá dòng trước;
   - replay.

### BE-B (folio, tiền) – ước 0,25 ngày, review
- Xác nhận các hàm folio nằm trên đường tính thử không có tác dụng ngoài giao dịch, không tiêu sequence không được hở số (bill), và không kích hoạt `refundPlan`/J15 ngoài giao dịch: `resyncStay`, `onReservationVoided`, `reverseLine`, `postLines`, `balance`, `replaceLateCharge`.
- Review PR BE-A phần tiền: trần số dư, thứ tự phân bổ BR-428 (phụ thu người → chênh lệch → 50 %), `AMOUNT_CHANGED`.

### FE-A (Desk) – ước 0,75 ngày B16 + 0,5 ngày giá đã lên lịch
**B16**
- Nút drawer `early_departure` (đã có `allowedActions`).
- Hộp có ba bước: tính thử → xác nhận → ghi. Gọi tính thử lại khi đổi ngày, giờ báo, số OTA hoặc bằng chứng (debounce).
- Lần ghi gửi `expectedRefundVnd`/`expectedFeeVnd` + `If-Match` từ `reservation.version` của lần tính thử.
- Lỗi:
  - 409 `AMOUNT_CHANGED` → tính thử lại, hiện số mới, bắt xác nhận lại;
  - 412 → tải lại đơn;
  - 422 → báo tại ô.
- Sau khi ghi:
  - nếu `newDepartureDate` = hôm nay và `allowedActions` có `check_out` → mời sang `CheckOutPage`;
  - `refundRequestId` → liên kết yêu cầu hoàn;
  - `registrationNeedsUpdate` → dòng nhắc + liên kết danh sách "cần cập nhật ngày đi".
- **Không tính tiền ở client**: chỉ hiện số server trả.
- Thêm mock MSW theo schema mới và test vitest.
- Cho tới khi BE-A gộp, server thật trả 422 `dryRun NOT_ALLOWED`. FE-A làm với MSW.

**Giá đã lên lịch**
- Ngăn kéo căn liệt kê `scheduledListPrices`: ngày, giá tháng, giá đêm, người, lý do. Mỗi dòng có nút "Hủy lịch giá này", hỏi lý do rồi gọi operation mới với `If-Match`.
- Sau khi hủy, cập nhật căn và `ETag`.
- Khi chọn ngày hiệu lực D:
  - điền sẵn **cả hai** giá từ dòng đang áp cho D (mục 3) và so "đã đổi" với dòng đó;
  - ngày trùng một dòng đã lên lịch thì chữ phụ nói rõ cả hai giá của dòng đó sẽ bị thay.
- Lỗi:
  - 409 `effective` (đã tới ngày) hoặc 404 (người khác đã hủy) → tải lại, báo nhẹ;
  - trường `scheduledListPrices` vắng (vai khác) → ẩn mục.
- Thay mock `db.scheduledListPrices` bằng trả ra GET.

### UXD – ước 0,25–0,5 ngày
Theo Brand Guidelines OTTIMO (bảng màu 80/15/5, Lora/Be Vietnam Pro, JetBrains Mono cho mã; Desk nội bộ: tiếng Việt chính, có EN; không emoji).

**Hộp trả sớm B16**
1. **Ngày rời mới**: chọn ngày, nhỏ nhất là hôm nay, lớn nhất là ngày đi − 1, mặc định hôm nay.
2. **Giờ khách báo**: mặc định lúc mở hộp. Sửa lùi thì hiện mục **bằng chứng**: ghi chú (bắt buộc, ≥ 3 ký tự) + ảnh tin nhắn (tùy chọn). Chữ giải thích BR-011, dùng `noticeBusinessDate`.
3. **Số OTA giữ lại** (chỉ khi `otaRetainedMaxVnd` có): ô tiền, chữ phụ "tối đa {otaRetainedMaxVnd} theo extranet".
4. **Bảng xem trước**:
   - các đêm bỏ: ngày, đơn, căn, OTA/trực tiếp, số tiền;
   - cơ sở ròng;
   - số ngày báo trước;
   - phần hoàn 50 % (hoặc "không hoàn – báo cùng ngày");
   - phụ thu người hoàn / chỉ đảo;
   - chênh lệch đổi phòng;
   - **số sẽ xin hoàn**, có câu khi `refundCapped`;
   - **phí trả sớm**;
   - đơn con bị hủy (`childBookings`).
5. **Trạng thái "số vừa thay đổi"** (409 `AMOUNT_CHANGED`).
6. **Màn kết quả**: đã mở bán N đêm, yêu cầu hoàn đã tạo (chờ duyệt), nút "Trả phòng ngay" khi ngày rời = hôm nay.
7. **Nhắc khai báo khách nước ngoài** khi `registrationNeedsUpdate`.

**Ngăn kéo căn**: chữ cho danh sách giá đã lên lịch, nút và hộp "Hủy lịch giá", chữ phụ khi chọn ngày trùng dòng lên lịch (thay `rooms.price_same_future`). Duyệt luôn 3 chuỗi `rooms.*` FE-A thêm 27/10.

### QA – oracle BR-428 (`product/tests/fixtures/br-examples.json`)

Đối chiếu tên trường:
- oracle `refundVnd` của BR-428-01…05 = hợp đồng **`refundableVnd`** (phần 50 %);
- hợp đồng `refundVnd` = số xin hoàn sau trần. Hai số bằng nhau khi khách **đã trả đủ** và không có phụ thu người;
- oracle `refundBaseVnd` = `droppedNetVnd`;
- oracle `cancelledNights`/`droppedNights` = `droppedNights[].date`.

| Ca | Thiết lập (khách đã trả đủ) | Kỳ vọng hợp đồng |
|---|---|---|
| BR-428-01 | 4 × 700.000, báo 21/10 10:00, rời 22/10 | `noticeDays` 1; đêm 22, 23; `droppedNetVnd` 1.400.000; `refundableVnd` 700.000; `earlyDepartureFeeVnd` 700.000; `refundVnd` 700.000; `refundCapped` false |
| BR-428-02 | báo 22/10 08:00, rời 22/10 | `noticeDays` 0; `refundableVnd` 0; `earlyDepartureFeeVnd` 1.400.000; `refundVnd` 0 |
| BR-428-03 | báo 22/10 01:00 (cần bằng chứng nếu nhập lùi) | như 01; `noticeBusinessDate` 2026-10-21 |
| BR-428-04 | đêm 23/10 FOC 100 % | `droppedNetVnd` 700.000; `refundableVnd` 350.000; phí 350.000; `refundVnd` 350.000 |
| BR-428-05 | 7 đêm có bậc 10 %, báo 12/11 rời 14/11 | `droppedNetVnd` 1.533.000; `refundableVnd` 767.000; phí 766.000; `refundVnd` 767.000 |
| BR-428-06 | Agoda, phụ thu 600.000 đã thu | tính thử đầu: `otaRetainedRequired` true, `otaRetainedMaxVnd` = tiền OTA đêm 22+23; ghi: `extraPersonRefundVnd` 300.000, `refundVnd` 300.000, `refundableVnd` 0; B18 không tạo yêu cầu thứ hai |

Ca thêm:
- **trần**: khách mới trả cọc → `refundCapped` true, `refundVnd` < tổng;
- **lệch số**: thu thêm tiền giữa lần tính thử và lần ghi → 409 `AMOUNT_CHANGED`, đơn không đổi;
- **tính thử không ghi gì**: `version`, ETag, nhật ký, yêu cầu hoàn, tồn phòng đều không đổi;
- **nhập lùi giờ báo**: `evidenceRequired`, lần ghi thiếu bằng chứng → 422;
- **đơn con gia hạn** bị hủy hẳn.

Giá đã lên lịch: kịch bản BUG-R3-018 rc.2/rc.3, nay hiện dòng và hủy được. Kiểm điền sẵn cả hai giá khi chọn ngày có dòng lên lịch; FDL không thấy mục, gọi API thì bị 403.

**Lưu ý**: `rbac-cases.json/csv` đã sinh lại (206 operation, 2.266 ca). **Mã `RB-xxxx` dịch số** từ sau `cancelScheduledParameter` vì operation mới chèn theo thứ tự chữ cái. Báo cáo nào trích mã RB cũ thì đối chiếu bằng `operationId` + vai.

### SEC (khuyến nghị review, cho ORC)
ADR-015 khác mẫu SEC A3: tính thử chạy câu ghi rồi rollback, không dùng giao dịch readOnly. Nhờ SEC xác nhận ba điểm: (1) rollback trong `finally`; (2) không có tác dụng ngoài giao dịch (`pg_notify` chỉ phát khi commit); (3) chốt fail-closed. Không đổi quyền.

## 5. Kiểm tra đã chạy (trong worktree, giống CI)
| Kiểm | Kết quả |
|---|---|
| Redocly `@redocly/cli@1.34.21 lint` | Hợp lệ, **4 cảnh báo – bằng bản 0.3.8** (servers example.invalid, 3 operation thiếu 4xx có từ trước) |
| `openapi-spec-validator==0.7.2` (openapi.yaml + openapi.test.yaml) | OK / OK |
| `gen_traceability.py --strict` | rc 0; ops mismatched 0, fields mismatched 0, unknown codes [] |
| `gen_rbac_cases.py --check` (sau khi sinh lại) | OK – 206 operation, 2.266 ca, rbac mismatch [] |
| `check-no-test-surface.sh spec` | OK – không có `/__test__` |
| `gen-openapi-meta.mjs` | đã sinh lại `openapi-meta.ts`, `openapi-schemas.ts`; `--check` qua `contract.test.ts` |
| `@ottimo/api-client gen` | đã sinh lại `openapi.ts`; test api-client 32/32 |
| API `tsc --noEmit`; vitest `contract`, `serializer`, `http` | sạch; 21/21 |
| `tsc` admin-web, guest-web, landing-web, mobile | sạch |

Chưa chạy: test tích hợp API (cần Postgres). Chốt controller không đổi hành vi so với hôm nay.

## 6. File đã tạo/sửa
- `product/docs/api/openapi.yaml` (0.3.9-draft)
- `product/services/api/src/generated/openapi-meta.ts`, `openapi-schemas.ts` (sinh)
- `product/packages/api-client/src/generated/openapi.ts` (sinh)
- `product/services/api/src/modules/frontdesk/internal/frontdesk.controller.ts` (chốt fail-closed `dryRun` B16)
- `product/tests/fixtures/rbac-cases.json`, `rbac-cases.csv` (sinh)
- `product/docs/rbac-matrix.md` (ghi chú 25a + lịch sử), `product/docs/rbac-matrix.json` (operation mới + ghi chú S25)
- `product/docs/erd.md` (`room_list_price` – giá đã lên lịch)
- `product/docs/adr/ADR-015-dry-run-rollback-transaction.md` (mới), `product/docs/adr/README.md`
- `01-decisions/decision-log.md`
- `rounds/round-03/outputs/ARC/contract-v1.0.1.md` (file này)

## 7. Giả định
1. `expectedRefundVnd`/`expectedFeeVnd` để tùy chọn (vắng = không so) để không phải sửa test API/E2E cũ trong bản vá. Desk bắt buộc gửi; FE-A có test kiểm. Có thể chuyển sang bắt buộc ở v1.1.
2. Hủy giá đã lên lịch không cần xác nhận lại S2, cùng mức `updateRoom`. Nếu SEC muốn S1 thì là thay đổi cộng thêm.
3. `registrationNeedsUpdate` = lượt ở có giấy tờ khách nước ngoài, đúng điều kiện của `onDepartureChanged`.
4. B16 thuộc BE-A (`frontdesk`), rooms thuộc BE-A (`platform`), theo báo cáo FE-A 27/10.

## 8. Rủi ro / vướng mắc
- **CỔNG gộp**:
  - Nhánh này chỉ gộp `main` **sau khi cắt v1.0.0** và **cùng hoặc trước** PR BE-A.
  - Nếu gộp riêng: meta khai `dryRun` nhưng chốt controller giữ an toàn, chỉ trả 422. Operation mới `cancelScheduledRoomListPrice` chưa có route → 404 từ framework. `scheduledListPrices` vắng.
  - Hợp đồng không phá client đang chạy.
- Tính thử B16 giữ khóa dòng đơn/căn/folio trong thời gian tính, ước vài chục ms. Chấp nhận với 10 căn; đo p95 trên staging.
- `replaceLateCharge` (hủy phụ thu trả muộn của ngày đi cũ) không có trường riêng trong bảng xem trước. Số đã nằm trong `refundVnd` qua số dư. Nếu DOM muốn hiện riêng thì thêm trường cộng thêm.
- Lịch v1.0.1: ARC chốt hôm nay; BE-A + FE-A song song ~1–1,5 ngày; QA 30/10–02/11. Không chặn mốc 04/11 nếu BE-A bắt đầu 28/10 chiều (sau B2).

## 9. Việc chưa xong
- Chưa có review bắt buộc của BE và SEC cho hợp đồng 0.3.9 và ADR-015.
- QA cập nhật `br-examples.json` (thêm `expectedContract` hoặc ghi chú đối chiếu tên trường). Đó là file của QA, ARC không sửa.

---

## 10. Bổ sung 1 (27/10, ARC theo ORC) – 0.3.9 bổ sung 1

Đầu vào:
- UXD `reviews/UXD-on-FE-A-v1.0.1.md` thẻ FB-R3-UXD-FE-A-06 (Major);
- BE-B `reviews/BE-B-on-BE-A-v1.0.1.md` thẻ 01 (Major), thẻ 06;
- SEC `reviews/SEC-on-ADR-015.md` thẻ 07, `reviews/SEC-on-BE-A-v1.0.1.md` điều kiện 3;
- báo cáo BE-A `outputs/BE/v1.0.1-be-a.md` (nhánh `be-a-v1.0.1`, `5e966a5`).

Phiên bản giữ `0.3.9-draft` vì chưa phát hành. Mọi thay đổi chỉ cộng thêm, trừ một chỗ đổi nghĩa có chủ đích (10.2): trường đó mới có từ `22fe06d`, chưa client nào phát hành dùng.

### 10.1 Ngày đi của cả lượt ở (UXD-06) – **chốt: thêm `Reservation.stayDepartureDate`**

| Phương án | Kết luận |
|---|---|
| `allowedActions` đã đủ | **Không đủ**. Nút hiện/ẩn thì dùng được, nhưng ngày rời tối đa và dòng "Lượt ở hiện tại" vẫn cần ngày đi của cả lượt. Thêm nữa, server hiện trả `early_departure` cho **mọi** đơn `in_house`, kể cả khi không còn ngày rời hợp lệ (ngày đi của cả lượt = hôm nay) |
| `maxDepartureDate` trong phản hồi tính thử | **Không chọn**. Phải gọi tính thử trước khi biết giới hạn của ô ngày; drawer (dòng lượt ở) không có số này |
| **`Reservation.stayDepartureDate`** (chỉ đọc) | **Chọn**. Server đã tính bằng `effectiveStay` (B16, B18). Một trường dùng được cho cả ba chỗ |

Hợp đồng:
- **`Reservation.stayDepartureDate`**:
  - `LocalDate`, `x-visible-to` FD+;
  - = ngày đi lớn nhất của đơn chính và các đơn con gia hạn còn hiệu lực (BR-422); không có đơn con thì bằng `departureDate`;
  - có ở đơn **chính** `confirmed`/`in_house`; vắng ở đơn con và trạng thái khác.
- **`allowedActions.early_departure`** chỉ có khi đơn `in_house` **và** max(hôm nay, `arrivalDate` + 1) < `stayDepartureDate`. Đây là thu hẹp có chủ đích: trước đây có cả khi không còn ngày hợp lệ, bấm vào chỉ nhận 422.
- **Khoảng chọn ngày rời** = [max(hôm nay, `arrivalDate` + 1), `stayDepartureDate` − 1], khớp đúng điều kiện server đang kiểm.

### 10.2 Chênh lệch đổi phòng sau trần (BE-B thẻ 01) – **chốt: phương án A**
- `roomChangeDifferenceVnd` = phần **được hoàn sau trần** = min(chênh lệch đã đảo, `refundVnd` − `extraPersonRefundVnd`).
- Thêm `roomChangeDifferenceReversedVnd` = phần đã đảo nhưng không hoàn.
- Thêm `refundableAfterCapVnd` = `refundVnd` − `extraPersonRefundVnd` − `roomChangeDifferenceVnd` (phần 50 % thực có trong yêu cầu hoàn). Desk hiện từng dòng mà không phải tự trừ.
- Bất biến:
  - `refundVnd` = `extraPersonRefundVnd` + `roomChangeDifferenceVnd` + `refundableAfterCapVnd`;
  - `refundCapped` ⇔ `refundVnd` < `refundableVnd` + `extraPersonRefundVnd` + `extraPersonReversedVnd` + `roomChangeDifferenceVnd` + `roomChangeDifferenceReversedVnd` (giá trị không đổi so với trước).
- Thứ tự trần theo BR-428: phụ thu người → chênh lệch → 50 %. DOM đang chốt; nếu DOM trả lời khác, ORC báo ARC sửa công thức. Hình dạng hợp đồng giữ nguyên.

### 10.3 Số kỳ vọng phải cùng input (BE-B thẻ 06)
- `expectedRefundVnd`/`expectedFeeVnd` phải lấy từ lần tính thử có **cùng toàn bộ input** (`newDepartureDate`, `noticeGivenAt`, `otaRetainedVnd`, `noticeEvidence`).
- Lần tính thử còn `otaRetainedRequired = true` thì không dùng để ghi được. Gửi số của lần tính thử khác input thì luôn bị 409.
- Desk tính thử lại mỗi khi một ô đổi, và khóa nút xác nhận tới khi có kết quả mới.

### 10.4 Quyền xem trường tiền (SEC thẻ 07) – **chốt: FD được xem**
- B16 chỉ cho FD+ (A17). Số tiền theo đêm và tiền OTA là "Giá bán phòng, folio của đơn"; rbac mục 6 ghi FD **Đầy**.
- Đã gắn `x-visible-to` FD+ cho `droppedNights`, `droppedNetVnd`, `refundableVnd`, `refundableAfterCapVnd`, `roomChangeDifferenceVnd`, `roomChangeDifferenceReversedVnd`, `otaRetainedMaxVnd`. Mục đích là phòng khi `x-roles` mở rộng sau này.
- Với vai hiện tại không có gì đổi: tính thử và lần ghi cùng vai ra cùng tập trường.
- Lỗi `55P03` đi qua `ProblemFilter` → 409 `CONCURRENT_UPDATE`, không lộ SQL (BE-A đã xác nhận).

### 10.5 ADR-015 và erd – viết lại theo bản BE-A đã cài
- **ADR-015** chuyển trạng thái **Chấp nhận**. Bổ sung:
  - `Database.simulate` và bảng `simulation_guard` (trigger hoãn luôn `RAISE`);
  - bất biến thứ tự "guard trước handler", kèm hai test;
  - ngoại lệ SAVEPOINT/RELEASE/ROLLBACK TO và lý do (a)–(c);
  - "bộ lọc lệnh chỉ là lớp nhắc, ranh giới là guard"; cấm `tx.db.transaction` trên đường mô phỏng;
  - quy tắc hook (mục 2.4);
  - **khoảng trống id do sequence là bình thường** (mục 4);
  - test ảnh chụp toàn tenant 72 bảng;
  - việc dời v1.1: rate-limit `dryRun`, `previewToken`/`childVersions`.
- **erd**: mục 4.12 thêm `simulation_guard`; mục lịch sử thêm một dòng.

### 10.6 Việc thêm cho từng vai
**BE-A** – trên `be-a-v1.0.1`, gộp/rebase lên commit ARC mới:
1. `stayDepartureDate` trong DTO đơn chính `confirmed`/`in_house`:
   - dùng `effectiveStay`, hoặc một truy vấn max `departure_date` của đơn con còn hiệu lực;
   - danh sách đơn cũng phải có trường này, nên dùng truy vấn gộp, không truy vấn từng đơn.
2. `allowedActions`: thêm `stayDepartureDate` vào `ActionContext`; chỉ thêm `early_departure` khi max(today, arrival + 1) < stayDepartureDate.
3. Phương án A ở `earlyDeparture`:
   - `roomChangeDifferenceVnd` = min(đã đảo, `refundVnd` − `extraPersonRefundVnd`);
   - thêm `roomChangeDifferenceReversedVnd` và `refundableAfterCapVnd`;
   - audit `after.roomChangeDifferenceVnd` dùng cùng nghĩa (thêm `roomChangeDifferenceReversedVnd`).
4. Test:
   - một ca có chênh lệch bị trần;
   - bất biến tổng của 10.2;
   - đơn có đơn con: `stayDepartureDate`, nút có từ ngày đi của đơn chính tới hết ngày trước `stayDepartureDate`;
   - không có `early_departure` khi hôm nay = `stayDepartureDate` hoặc khi đến hôm nay mà lượt chỉ 1 đêm.
5. Điều kiện SEC-BE-A-01: hai test bất biến thứ tự guard.

**FE-A**:
1. Thay `r.departureDate` bằng `r.stayDepartureDate ?? r.departureDate` cho `maxDate` và dòng `stay_now` (số đêm = hiệu hai ngày).
2. `minDate` = max(ngày nghiệp vụ, `arrivalDate` + 1).
3. Hiện/ẩn nút **chỉ** theo `allowedActions`; bỏ so `businessDay < r.departureDate`.
4. Hộp xem trước:
   - dòng chênh lệch dùng `roomChangeDifferenceVnd` (đã hoàn) và `roomChangeDifferenceReversedVnd` (chỉ đảo);
   - dòng 50 % dùng `refundableAfterCapVnd` khi `refundCapped`;
   - không tự trừ.
5. Chỉ gửi `expected*` của lần tính thử khớp input hiện tại. Khóa nút xác nhận khi input đổi mà chưa có kết quả tính thử mới; debounce ≥ 400 ms, hủy request cũ.
6. Mock MSW + test đơn con: chọn ngày trong khoảng của đơn con; `effect_child_cancelled`/`done_child_cancelled`.

**UXD**:
- Thêm nhãn cho `roomChangeDifferenceReversedVnd` ("đã đảo, không hoàn").
- Nhãn dòng 6 giữ "đã thu – hoàn đủ", vì trường nay đúng nghĩa đó.
- Dòng "Lượt ở hiện tại" theo ngày đi cả lượt.

**QA**:
- Kiểm bất biến 10.2 trên mọi ca B16.
- Ca đơn OTA có chênh lệch 400.000, khách thừa 100.000: `roomChangeDifferenceVnd` 100.000, `roomChangeDifferenceReversedVnd` 300.000, `refundVnd` 100.000, `refundCapped` true.
- Ca đơn con gia hạn (BR-422): nút, khoảng ngày, `stayDepartureDate`.

### 10.7 Kiểm tra đã chạy (commit bổ sung)
- Redocly: hợp lệ, 4 cảnh báo (như trước).
- spec validator: OK / OK.
- `gen_traceability --strict`: rc 0.
- `gen_rbac_cases --check`: OK (không đổi ca).
- no-test-surface: OK.
- Đã sinh lại meta/schemas và api-client.
- tsc api và 4 app: sạch.
- vitest contract/serializer/http: 21/21; api-client: 32/32.
- prettier: sạch.
