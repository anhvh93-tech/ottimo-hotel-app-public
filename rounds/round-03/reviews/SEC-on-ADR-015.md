# SEC review – ADR-015 (tính thử B16 `earlyDeparture` trong giao dịch luôn ROLLBACK) + hợp đồng 0.3.9

- Người review: SEC | Round 3 – Review chéo (bản vá v1.0.1) | 27/10/2026
- Đọc tại commit `22fe06d` (nhánh `arc-contract-v1.0.1`):
  - `product/docs/adr/ADR-015-dry-run-rollback-transaction.md`
  - `rounds/round-03/outputs/ARC/contract-v1.0.1.md`
  - diff `frontdesk.controller.ts`
- Đối chiếu mã hiện hành trên `main`:
  - `stay.service.ts` `earlyDeparture` (dòng 1284–1700)
  - `shared/http/unit-of-work.ts`, `shared/http/auth.guard.ts`, `db/database.ts` (`withContext`, chặn kết nối lồng)
  - `events.service.ts` (SSE qua `pg_notify`)
  - `reservation-hooks.ts` và các listener (`registration`, `frontdesk`, `reporting`)
  - `registration.service.ts` `purgeImages`, `encrypted-blob.service.ts`, `envelope-crypto.service.ts` `destroy`
- Chưa đọc nhánh `be-a-v1.0.1`. Phần cài đặt `uow.simulate` sẽ review khi BE-A mở PR.

## Tóm tắt

| Mức | Số thẻ |
|---|---|
| Blocker | 0 |
| Major | 3 |
| Minor | 4 |
| Suggestion | 1 |

**Kết luận: SEC chấp nhận lệch mẫu A3, chỉ cho B16, với điều kiện xử lý thẻ 01–03 trước khi gộp PR BE-A.**

Lý do chấp nhận: viết công thức tính thứ hai đúng là loại rủi ro đã sinh BUG-R3-012/013/014. Dùng một hàm cho cả hai đường an toàn hơn về tiền.

Cái giá phải trả: A3 có **cơ sở dữ liệu bảo đảm** "không ghi" (giao dịch READ ONLY). ADR-015 đổi bảo đảm đó lấy **kỷ luật mã** ("luôn ROLLBACK", "nhánh dry bỏ audit/duyệt"). Hai thứ này đang tách rời nhau. Nếu cờ `dryRun` lọt vào đường COMMIT, Desk sẽ **ghi thật một lần trả sớm mà không có audit, không có yêu cầu hoàn**. Đường đó còn đi qua `crypto.destroy` khi đơn con bị hủy hẳn. Thẻ 01 yêu cầu ghép hai thứ lại và thêm chốt ở tầng DB.

SEC đã kiểm và đồng ý với ba điểm ARC hỏi:

| Điểm ARC hỏi | Kết quả SEC kiểm |
|---|---|
| (1) Rollback | `withContext` hiện **luôn COMMIT khi thành công**, nên `simulate` phải là đường riêng (thẻ 01). |
| (2) Tác dụng ngoài giao dịch | Không thấy lời gọi HTTP, email hay ghi tệp trực tiếp trong API. Chi tiết ở thẻ 03. |
| (3) Chốt fail-closed | Đúng chỗ, cùng điều kiện với guard và uow. Còn thiếu test (thẻ 06). |

Chi tiết điểm (2):
- SSE đi qua `pg_notify`, outbox là bảng, các hook đơn đặt phòng chạy trong cùng `tx`.
- Xóa ảnh giấy tờ: `crypto.destroy` chỉ ghi DB. Tệp đi qua hàng đợi `blob_pending_delete` và chỉ bị quét khi đã commit.
- `database.ts` đã chặn mở kết nối lồng trong phạm vi unit of work.

---

## Thẻ feedback

### FB-R3-SEC-ARC-01
- Mức độ: Major
- Vị trí: ADR-015 mục 2 (1)–(2); contract-v1.0.1 mục 4 BE-A bước 1 ("`uow.simulate` hoặc tương đương… gọi `earlyDeparture(..., { dryRun: true })`"); `db/database.ts` `withContext` (dòng ~111–130: thành công → `COMMIT`)
- Vấn đề: an toàn của tính thử dựa vào **hai cơ chế độc lập**:
  - (a) giao dịch rollback;
  - (b) cờ `dryRun` trong hàm, dùng để bỏ `approvals.submit`, `attachments.bindTo`, `audit.recordMoney`.

  Không có gì buộc (b) chỉ chạy khi có (a). Ba lỗi cài đặt rất dễ gặp:
  - Bọc `simulate` bằng `withContext` (luôn COMMIT) rồi "ném lỗi để rollback", nhưng một nhánh trả kết quả mà không ném.
  - Controller truyền `{ dryRun: true }` vào hàm nhưng gọi `uow.run`.
  - Sau này một người thêm `tx.query('COMMIT')` hoặc `SAVEPOINT`/`RELEASE`.

  Cả ba đều dẫn tới **ghi thật mà không có audit tiền và không có yêu cầu hoàn**: số đêm bị void, phí trả sớm ghi vào folio, khách mất phần hoàn mà không ai duyệt. Với đơn con bị hủy hẳn, hook `transitioned` sẽ:
  - thu hồi link/phiên khách (`revokeAllForReservation`);
  - hủy hồ sơ khai báo → `purgeImages` → `crypto.destroy` (xóa khóa DEK, không đảo ngược được khi đã commit).
- Vì sao quan trọng: đây là đường đi qua tiền và dữ liệu C3. Mất audit nghĩa là mất khả năng truy vết (SR-LOG, kiểm soát tiền). A3 trước đây được DB bảo đảm. Mẫu mới phải có lớp bảo đảm tương đương, không chỉ "nhớ làm đúng".
- Đề xuất sửa (thêm vào ADR-015 mục 2 thành điều kiện bắt buộc; BE-A cài, SEC review PR):
  1. **Một API, không có đường commit.** `uow.simulate(req, handler)` dùng **kết nối riêng**:
     - `BEGIN`, `SET_CONTEXT_SQL` (cùng tenant/RLS, `lock_timeout` và `statement_timeout` qua `SET LOCAL`/`set_config(..., true)`);
     - chạy handler trong `runInUnitOfWork` (giữ chặn kết nối lồng);
     - `ROLLBACK` trong `finally`;
     - `ROLLBACK` lỗi → `client.release(true)` (hủy kết nối, như `withContext`).

     **Không** tái dùng `withContext` với mẹo ném lỗi. Trong mã `simulate` không có chữ `COMMIT`.
  2. **Ghép cờ với giao dịch.** `simulate` gắn `tx.ctx.simulation = true`.
     - `earlyDeparture` nhận `dryRun` **từ `tx.ctx`**, không từ tham số do controller truyền.
     - Nếu giữ tham số thì phải `assert(dryRun === (tx.ctx.simulation === true))` ở dòng đầu hàm, sai thì ném lỗi 500 kèm log.
     - Như vậy không thể "dry trong giao dịch thật" hay "thật trong giao dịch dry".
  3. **Chốt ở tầng DB.** Đầu giao dịch `simulate`, chèn một **dòng chặn commit**. Ví dụ bảng `simulation_guard` có `CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED` luôn `RAISE`. Nếu vì bất kỳ lý do gì giao dịch đi tới COMMIT, Postgres từ chối và tự rollback. Đây là bảo đảm thay cho READ ONLY của A3 (ARC/BE-A chọn cách tương đương nếu muốn, nhưng phải do DB bảo đảm).
  4. **`tx` của `simulate` từ chối** câu lệnh điều khiển giao dịch: `COMMIT`, `END`, `ROLLBACK`, `SAVEPOINT`, `RELEASE`, `SET` không có `LOCAL`.
  5. Test:
     - (i) gọi `earlyDeparture` với cờ dry trong `uow.run` → ném lỗi, không ghi;
     - (ii) ép handler trả kết quả bình thường trong `simulate` → không dòng nào đổi;
     - (iii) ép COMMIT trong `simulate` → lỗi từ trigger chặn;
     - (iv) `ROLLBACK` lỗi → kết nối bị hủy, không trả về pool (kiểm `pool.totalCount`/sự kiện `remove`).

### FB-R3-SEC-ARC-02
- Mức độ: Major
- Vị trí: ADR-015 mục 2 (3); contract-v1.0.1 mục 2.2 bước 3 ("`If-Match` = `reservation.version` của lần tính thử"); `earlyDeparture` cuối hàm trả `after = loadReservation(...)` (đơn **sau khi ghi**, `version + 1`)
- Vấn đề: hàm hiện trả `row: after`, tức đơn đã đổi ngày đi và `version` đã tăng. Nếu `simulate` trả nguyên kết quả này (cách cài nhanh nhất), lỗi xảy ra như sau:
  - Desk hiện ngày đi **mới** như đã lưu.
  - Desk gửi `If-Match` = `v+1` → lần ghi bị 412 mãi.
  - Nặng hơn: giữa hai lần gọi, nếu một thao tác khác (thu tiền, thêm người, gia hạn) làm đơn lên đúng `v+1` thì `If-Match` **khớp nhầm**. Lần ghi đi qua trên một trạng thái lễ tân chưa xem. Kiểm soát tranh chấp bị vô hiệu đúng ở thao tác tiền.

  ETag header của phản hồi tính thử cũng phải theo cùng nguyên tắc.
- Vì sao quan trọng: `If-Match` là lớp chống ghi đè đồng thời (ADR-009, SR về tranh chấp). Phản hồi tính thử là nguồn duy nhất FE lấy `version`.
- Đề xuất sửa:
  - ADR-015 mục 2 (3) viết rõ:
    > "Phản hồi tính thử chứa `reservation` = **ảnh chụp dòng đã khóa ở đầu hàm** (`row` sau `loadReservation(... forUpdate)`) hoặc đọc lại **sau ROLLBACK** trong một giao dịch READ ONLY cùng ngữ cảnh RLS; **không** trả `after`. `ETag` = `version` đang lưu. Các trường hậu quả (`droppedNights`, `childBookings`…) nằm ở `EarlyDepartureResult`, không phản ánh vào `reservation`."
  - Test bắt buộc:
    - `dryRun` → `body.reservation.version` và `ETag` bằng `version` trong DB, `departureDate` cũ;
    - đổi đơn giữa tính thử và ghi → lần ghi 412.
  - Đọc lại sau rollback phải qua cùng serializer có `x-visible-to`, không đọc bằng kết nối ngoài RLS.

### FB-R3-SEC-ARC-03
- Mức độ: Major
- Vị trí: ADR-015 mục 4 "Test bắt buộc (1)" (đếm dòng `reservation_change`, `stay_night`, `folio_line`, `approval_request`, `audit_event`, `idempotency_key`, outbox); contract-v1.0.1 mục 4 BE-A bước 6 và BE-B
- Vấn đề: danh sách bảng để kiểm "tính thử không để lại gì" **thiếu đúng những bảng mà các hook chạm vào**. SEC lần theo mã `earlyDeparture` hiện hành và thấy:
  - `reservation_segment` và bảng occupancy (`occupancy.release`/`update`);
  - `reservation.status/version` của **đơn con**;
  - `state_transition` (`recordTransition`, dùng sequence `state_transition_id_seq`);
  - `hk_task` và outbox `hk_task.changed` (qua `stay.emit`);
  - `registration` và `document_image`;
  - `data_key` (`wrapped_key = NULL`), `blob_pending_delete`, `purge_journal`, `c3_access_log` (hook `registration.onReservationVoided` → `purgeImages`);
  - bảng link/phiên khách (`guestAccess.revokeAllForReservation`, hook frontdesk `transitioned`);
  - `attention`/thông báo (`stay-waiver-alert`, `reporting.onNoShowTransition`);
  - audit **lồng** trong `folios.postLines`/`reverseLine`/`resyncStay` (`folio-lines.service.ts` gọi `audit.recordMoney`). ADR nói "bỏ audit", nhưng chỉ bỏ được dòng audit ở cuối `earlyDeparture`.

  Ngoài DB còn hai điểm:
  - **Sequence không rollback**: `state_transition_id_seq`, `audit_event_id_seq`, `purge_journal_id_seq` bị tiêu, để lại khoảng trống id.
  - **Trạng thái trong tiến trình**: cache tham số, bộ đếm rate-limit, cờ `auth.enforced`. Hiện chưa thấy thứ nào bị đổi trong đường B16, nhưng chưa có gì bảo đảm sau này.
- Vì sao quan trọng: danh sách bảng viết tay sẽ lỗi thời ngay khi ai đó thêm một hook. ADR mục 4 cũng thừa nhận điều này. Chỗ nguy hiểm nhất (xóa DEK, thu hồi link khách) lại nằm ngoài danh sách.
- Đề xuất sửa:
  1. Test (1) đổi thành **so ảnh chụp toàn bộ dữ liệu tenant**: với mọi bảng có `organization_id`, lấy `count(*)` + `md5(string_agg(t::text, '' ORDER BY ctid))` (hoặc `max(xmin)`), trước và sau `dryRun`. Chạy với dữ liệu mẫu có: (a) đơn con gia hạn **bị hủy hẳn**; (b) đơn có ảnh giấy tờ chưa khai xong; (c) đơn OTA có `room_change_difference`; (d) có phụ thu trả muộn ngày đi cũ. Bảng `simulation_guard` (thẻ 01) được loại trừ.
  2. Test kiểm **một kết nối**: bọc pool, `dryRun` chỉ `connect()` một lần, không có `LISTEN`/`NOTIFY` nào tới SSE hub (subscriber test không nhận gì sau 500 ms).
  3. Ghi vào ADR mục 4: **id `audit_event`/`state_transition`/`purge_journal` có khoảng trống là bình thường**; không kiểm soát nào được dựa vào id liên tục. SEC xác nhận hiện không có cơ chế nào như vậy (không có chuỗi băm audit). BE-B xác nhận đường B16 **không** tiêu số có ý nghĩa pháp lý hay hiển thị cho khách (số phiếu thanh toán, mã yêu cầu duyệt – đã bỏ, mã đơn).
  4. ADR mục 2 (2) thêm câu: "Hook đăng ký vào `ReservationHooks` phải chỉ dùng `tx` của tham số. Hook nào có tác dụng ngoài giao dịch phải đọc `tx.ctx.simulation` và bỏ qua." Thêm test kiến trúc liệt kê mọi listener `on('transitioned' | 'stay_changed' | 'created')` để reviewer thấy khi có hook mới.

### FB-R3-SEC-ARC-04
- Mức độ: Minor
- Vị trí: ADR-015 mục 3 A ("giữ khóa dòng đơn/căn/folio vài chục ms"), mục 5 (p95 > 300 ms); contract-v1.0.1 FE-A ("gọi tính thử lại khi đổi ngày, giờ báo, số OTA hoặc bằng chứng (debounce)")
- Vấn đề: tính thử không cần `Idempotency-Key` và được gọi lặp theo thao tác gõ. Mỗi lần nó lấy `FOR UPDATE` trên đơn và đơn con, `occupancy.lockRooms` **cả căn** (chặn mọi đặt phòng khác vào căn đó trong lúc tính), và folio.
  - Một client lỗi hoặc cố ý gọi liên tục làm nghẽn thu tiền, trả phòng, đặt phòng của căn đó.
  - Nếu `lock_timeout` ngắn của tính thử đặt bằng `SET` thay vì `SET LOCAL` thì giá trị lọt sang request khác qua pool.
- Vì sao quan trọng: đây là tính sẵn sàng của quầy ở giờ cao điểm. Rủi ro thấp (chỉ FD+ đã đăng nhập, 10 căn), nhưng cách chặn rẻ.
- Đề xuất sửa:
  - (a) `lock_timeout` tính thử ≤ 1 s, `statement_timeout` ≤ 5 s, đặt bằng `SET_CONTEXT_SQL` (local) như `withContext`.
  - (b) Giới hạn tần suất `dryRun` B16 theo người dùng, ví dụ 30 lần/phút (bảng SR-RL; SEC thêm dòng SR-RL khi BE-A cài). Vượt → 429.
  - (c) FE debounce ≥ 400 ms, hủy request cũ khi gửi request mới.
  - (d) Đo p95 và số lần lock_timeout trên staging như ADR mục 5.

### FB-R3-SEC-ARC-05
- Mức độ: Minor
- Vị trí: contract-v1.0.1 mục 2.2 bước 3–5; OpenAPI `AMOUNT_CHANGED`; ADR-015 mục 2 (4)
- Vấn đề:
  - (a) Lần ghi chỉ so **hai số** (`refundVnd`, `earlyDepartureFeeVnd`). Lễ tân còn xác nhận các hậu quả khác trên hộp: **đơn con bị hủy hẳn**, số đêm bỏ, nhắc khai báo, trần hoàn. `If-Match` chỉ bảo vệ `version` của đơn **chính**. Đơn con đổi (ví dụ gia hạn thêm) giữa hai lần có thể làm hậu quả khác đi mà không bị 409.
  - (b) `expected*` vắng thì không so. Chấp nhận được cho tương thích, nhưng lần ghi từ Desk phải luôn có.
  - (c) Cần khẳng định rõ hai số `expected*` **chỉ để so**, không bao giờ được dùng làm số ghi.
- Vì sao quan trọng: mục đích của US-135 là lễ tân đồng ý với đúng hậu quả sẽ xảy ra. Về an toàn, server vẫn tự tính nên không có đường gian lận tiền. Thẻ này chủ yếu về tính toàn vẹn của sự đồng ý.
- Đề xuất sửa:
  - Tính thử trả thêm `previewToken` = HMAC(server key, `reservationId` + version đơn chính + version các đơn con + `refundVnd` + `earlyDepartureFeeVnd` + danh sách đêm bỏ + `childBookings`). Lần ghi gửi lại, server tính lại và so; lệch → 409 `AMOUNT_CHANGED` (giữ một mã). Nếu ARC không muốn thêm trường ở v1.0.1 thì tối thiểu thêm version các đơn con vào phép so, và ghi rủi ro.
  - Test:
    - `expectedRefundVnd` khác số thật một đồng → 409, không dòng nào đổi, `Idempotency-Key` dùng lại được (409 ném trong giao dịch nên dòng khóa cũng rollback);
    - `expected*` âm hoặc quá lớn → 422 theo `f.money`.
  - Audit lần ghi thêm `after.previewConfirmed: true` (và hai số đã hiện) để sau này tra được lễ tân đã thấy số nào.

### FB-R3-SEC-ARC-06
- Mức độ: Minor
- Vị trí: `frontdesk.controller.ts` (diff `22fe06d`, chốt `isDryRun(raw)` trước `uow.run`)
- Vấn đề: SEC kiểm chốt và thấy **đúng**:
  - cùng điều kiện `dryRun === true` với `auth.guard.ts` và `unit-of-work.ts` (chuỗi `"true"` không qua chốt nhưng cũng không được bỏ header ở guard/uow, nên đi đường ghi có đủ khóa);
  - đặt trước `uow.run`;
  - guard đã `enforce` vai và thiết bị trước controller cho mọi lời gọi dry, nên HK/SAL nhận 403 chứ không nhận 422.

  Thiếu duy nhất: **không có test** cho chốt. Theo contract mục 8, nhánh ARC có thể gộp **riêng**. Khi đó chốt là lớp duy nhất ngăn một lần trả sớm **ghi thật không có `Idempotency-Key`/`If-Match`**.
- Vì sao quan trọng: chốt 6 dòng bị xóa nhầm khi gộp hoặc sửa xung đột thì không test nào báo.
- Đề xuất sửa: thêm test API ngay trong nhánh ARC (hoặc PR BE-A đầu tiên):
  - (a) FD gọi `earlyDeparture` `{dryRun: true, …}` không header → 422 `dryRun NOT_ALLOWED`, `reservation.version`, `stay_night`, `folio_line` không đổi;
  - (b) `{dryRun: "true"}` không header → 428/400 thiếu header (không ghi);
  - (c) HK `{dryRun: true}` → 403.

  BE-A gỡ chốt trong cùng PR cài `simulate` và đổi (a) thành test "tính thử không để lại gì" của thẻ 03.

### FB-R3-SEC-ARC-07
- Mức độ: Minor
- Vị trí: OpenAPI 0.3.9 `EarlyDepartureResult` (`droppedNights[].netVnd`, `otaRetainedMaxVnd`, `childBookings[]`), lỗi `VALUE_OUT_OF_RANGE` + `extras.max`; contract mục 2.2 bước 2 (lỗi khác trả như lần ghi)
- Vấn đề:
  - Tính thử mở cho FD/FDL/MGR/OWN (giữ `x-roles`, đúng yêu cầu A3). Nhưng tính thử trả **nhiều số hơn** đường cũ: tiền OTA gộp từng đêm, mã đơn con. Chưa thấy `x-visible-to` cho các trường mới.
  - Lỗi DB trong tính thử (`lock_timeout`, vi phạm ràng buộc khi release occupancy) trả qua `Problem`. Phải không mang câu SQL hay tên bảng ra client.
- Vì sao quan trọng: xem số nào là quyền theo vai (rbac 25a vừa thêm cho giá lên lịch). Tính thử không được thành đường vòng để vai thấp xem số mà màn đơn không cho xem.
- Đề xuất sửa: ARC đối chiếu `rbac-matrix` (mục giá/folio của FD) và khai `x-visible-to` cho `otaRetainedMaxVnd`/`droppedNights[].netVnd` nếu FD không được thấy tiền OTA gộp. Nếu FD được xem thì ghi một dòng xác nhận trong contract. Test serializer:
  - phản hồi tính thử và lần ghi cùng vai cho ra cùng tập trường;
  - lỗi `55P03` (lock_not_available) trả 409/503 `Problem` không có `detail` chứa SQL (SR-LOG-04).

### FB-R3-SEC-ARC-08
- Mức độ: Suggestion
- Vị trí: contract-v1.0.1 mục 7 giả định 2 (`cancelScheduledRoomListPrice` không cần S2); ADR-015 mục 5
- Vấn đề / ý kiến:
  - (a) SEC **đồng ý** giả định 2. Giá niêm yết không phải tham số bảo mật. Mức `updateRoom` (OWN/MGR, `If-Match` = `Room.version`, audit `config` `room.list_price_cancelled` có `reason`) là đủ. Không cần S1/S2.
  - (b) ADR mục 5 đã định "gom `uow.simulate` thành tiện ích chung khi có thao tác thứ hai".
- Đề xuất:
  - (a) Thêm test: CTV/SAL/FD gọi hủy → 403. Khi hủy, audit ghi `before.listPrice` cả hai giá (đã có trong contract).
  - (b) Làm **ngay** test kiến trúc "mọi operation có `meta.dryRun = true` đều có test integration 'tính thử không để lại gì' (thẻ 03 mục 1)". Đây là quy tắc SEC-BE-21 viết thành test, áp cho cả `cancelReservation`, `changeRoom`, `setLateCheckout`, `addPartyMember`.

---

## Điểm làm tốt (nên giữ)

- Chọn một hàm cho cả tính thử và ghi, không viết công thức thứ hai. Phân tích phương án C (SAVEPOINT) bị loại đúng lý do: lẫn giao dịch có khóa idempotency.
- Chốt fail-closed được nghĩ tới **trước** khi có cài đặt. Đặt đúng chỗ, đúng điều kiện. Ghi cả quy tắc chung "chỉ khai `dryRun` khi handler đã cài" vào hợp đồng.
- `409 AMOUNT_CHANGED` "không ghi gì, kèm số mới" + bắt lễ tân xác nhận lại là đúng tinh thần US-135. Giữ nguyên `x-roles`, tính thử cùng quyền và phạm vi như lần ghi.

## Ghi chú cho ORC

- Điều kiện chấp nhận lệch A3 (thẻ 01–03) SEC sẽ ghi vào `decision-log.md` ở bước Phản hồi & sửa (theo yêu cầu "không commit" lần này, chưa ghi).
- Không có ESC: mọi điểm thuộc quyền kỹ thuật của ARC/BE/SEC.
