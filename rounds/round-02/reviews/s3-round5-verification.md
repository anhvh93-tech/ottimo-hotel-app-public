# Kiểm chéo đối kháng lần 4 – sau vòng sửa 5 (ORC, workflow verify-s3-round5, HEAD 1cd7d8a, 17/10/2026)

## UPLOAD – bác bỏ: True (Major, high)

Kết luận: phần "chỗ không bao giờ được trả" và "đếm hai lần" đã ĐÓNG. Nhưng lưới cuối `reply.raw.once('close')` (product/services/api/src/http.ts:296-300) trả chỗ QUÁ SỚM. Khi client gửi đủ thân rồi đóng socket, chỗ được trả ngay lúc socket đóng, trong khi handler vẫn giữ thân 42 MB và còn chờ hàng sharp. Bộ đếm về 0, nên trần mỗi phiên (2), mỗi IP (3) và toàn tiến trình (4) không còn giới hạn bộ nhớ như câu ở upload-gate.ts:12 khẳng định. Đã tái hiện bằng script chạy được. Kiểm ở HEAD 1cd7d8a, fastify 5.12.7, Node 22.23.3. Chỉ đọc, không sửa repo.

1) Chạy lại repro cũ (scratchpad/upleak):
- leak2.ts với CHECK=5/HANDLER=200 và CHECK=100/HANDLER=500: inFlight = 0 ngay và sau 2,5 s; upload hợp lệ nhận 200.
- leak3.ts (trustProxy, 2 phiên × 2 IP, WAIT=3 s): inFlight = 0; nhân viên nhận 200 hai lần, khách khác nhận 200.
- slow.ts: 2 chỗ bị giữ tới giây 90, sau đó 408 và inFlight = 0. Không đổi so với lượt trước (Minor, đã biết).
- `vitest run test/upload-gate-socket.test.ts`: 8/8 xanh.

2) Chuỗi request mới, chạy trên adapter thật (scratchpad/r5/seq.ts):
- [2] Hủy trong lúc kiểm phiên, 5 lần: 0 chỗ.
- [3] Handler ném lỗi đồng bộ: 500, 0 chỗ. Lỗi 422 bất đồng bộ: 0 chỗ. 422 kèm client hủy: 0 chỗ.
- [4] Khai thân lớn hơn 42 MB: 413, 0 chỗ. Cookie nhân viên trên route khách: 401, 0 chỗ. Thân thiếu rồi FIN: 400, 0 chỗ.
- [5] Gửi đủ thân rồi half-close (FIN) khi handler đang chạy: 0 chỗ.
- [6] Lấy 1 chỗ, gọi release 2 lần và releaseUploadSlot 2 lần: inFlight = 0. Trả chỗ idempotent nhờ upload-gate.ts:51-58 và http.ts:125-129. Không tìm thấy đường nào lấy chỗ 2 lần cho một request.
- [7] 3 khách giữ chỗ: khách thứ 4 nhận 503, nhân viên từ IP khác nhận 200 (upload-gate.ts:41-43). Nhưng nhân viên CÙNG IP với 3 khách (NAT Wi-Fi khách sạn) nhận 429, vì trần IP ở upload-gate.ts:47 tính chung khách và nhân viên. Test :133-144 đang khẳng định hành vi này là đúng.

3) LỖI MỚI (Major) – trả chỗ quá sớm:
- seq.ts [1]: một phiên khách gửi 10 request đủ thân, mỗi request hủy sau 30 ms, xong trong 339 ms. Lúc đó có 10 handler đang chạy giữ thân, inFlight = 0.
- r5/membound.ts: một phiên, một IP gửi 16 thân 42 MB, tuần tự, không lúc nào quá 1 kết nối, xong trong 858 ms. Kết quả: 16 handler giữ 672 MB, RSS 870 MB, uploadsInFlight() = 1. Trần thiết kế là 4 × 42 = 168 MB. Container api có mem_limit 1g (infra/docker-compose.prod.yml:144).
- Cơ chế:
  - Handler thật vẫn chạy tiếp sau khi client đi (guest.controller.ts:187-237).
  - normalizeImage xếp hàng 2 làn, hàng chờ không có trần (image-pipeline.ts:20, :71-84), mỗi ảnh tối đa 10 s.
  - Chặn duy nhất là limiter 20 lần/phiên/giờ và 60 lần/IP/giờ (guest.controller.ts:45-48, :208-209). Limiter nằm trong bộ nhớ nên reset khi tiến trình khởi động lại (rate-limiter.ts:1-8).
  - Mở link là tạo phiên mới (guest-portal.service.ts:183-215).
- Hậu quả: ai có link khách đều đẩy được api quá 1 GB. Api bị OOM-kill, `restart: unless-stopped` dựng lại, limiter reset, rồi lặp lại được. Toàn bộ PMS ngừng.
- Lỗi cũng xảy ra không cố ý khi quá tải: Caddy cắt kết nối sau 60 s, chỗ được trả trong khi handler còn nằm trong hàng sharp, và api nhận thêm thân mới đúng lúc đang quá tải.
- Bản thử sửa, chỉ trong scratch (r5/http-fixprobe.ts, 2 dòng): đánh dấu khi readBody thành công, và chỉ trả chỗ ở 'close' nếu thân CHƯA giao cho handler; sau khi giao thì để onSend/onResponse trả. Kết quả:
  - membound: tối đa 2 handler, 84 MB, RSS 278 MB.
  - seq [1]: 2 handler; inFlight về 0 sau khi handler xong.
  - Ca [2]–[8]: vẫn 0 chỗ.

4) Ghi chú phụ:
- Content-Type bắt đầu bằng byte 0xA0 (latin1 " multipart/form-data; boundary=…"):
  - Fastify lib/content-type.js dùng `type.trimStart()` nên vẫn chọn readMultipart và lấy chỗ.
  - onRequest dùng `startsWith` (http.ts:297-299) nên không gắn lưới 'close'.
  - seq [8]: chỗ chỉ được trả ở onSend. Trong app thật vô hại, vì parseMultipart (multipart.ts boundaryOf `^multipart\/form-data\s*;`) trả 422 ngay.
  - Chỉ rò nếu handler không bao giờ trả lời. seq [9] với handler treo: inFlight giữ nguyên 1.

Gap:
- Major: http.ts:296-300 trả chỗ khi socket phản hồi đóng, kể cả khi thân đã giao cho handler. Client gửi đủ thân rồi đóng socket (lặp tuần tự) vượt được trần phiên 2, IP 3, tiến trình 4. Repro r5/membound.ts: 1 phiên khách giữ 16×42 MB = 672 MB, RSS 870 MB, trong khi api có mem_limit 1g. Có thể OOM-kill api lặp lại, vì limiter trong bộ nhớ reset khi restart. Sửa: chỉ trả ở 'close' khi thân chưa giao; sau khi giao thì để onSend/onResponse trả. Thêm test socket: thân lớn, handler chậm, N lần gửi đủ thân rồi hủy từ một phiên → số handler giữ thân ≤ MAX_UPLOADS_PER_SESSION.
- Câu chú thích upload-gate.ts:12 ('At most MAX_UPLOADS_IN_FLIGHT × MULTIPART_BODY_LIMIT bytes … live in memory') và http.ts:285-289 hiện sai so với hành vi thật.
- Minor: chỗ dành cho nhân viên không có tác dụng khi nhân viên và khách dùng chung IP (NAT Wi-Fi khách sạn), vì trần IP (upload-gate.ts:47) tính chung khách và nhân viên. 3 khách đang upload thì quầy nhận 429 (seq.ts [7]; test :133-144 coi đây là hành vi đúng). Nên tách khóa IP theo loại phiên, hoặc miễn trần IP cho route nhân viên.
- Minor (không xảy ra trong app hiện tại): Content-Type có byte 0xA0 ở đầu vẫn vào readMultipart (Fastify trimStart) nhưng không được gắn lưới 'close' (startsWith ở http.ts:298). Chỉ rò nếu handler không bao giờ trả lời. Nên gắn lưới ngay trong readMultipart khi lấy chỗ, hoặc so khớp bằng ContentType của Fastify.
- Minor, đã biết, không đổi: thân gửi chậm giữ chỗ khoảng 90 s, không phải 60 s (slow.ts chạy lại: 408 lúc 90 s rồi inFlight = 0).
- Không chạy test tích hợp cần DB. Handler thật (AuthGuard, CSRF, precheck, sharp) chỉ được mô phỏng bằng trễ và hàng 2 làn; tôi chưa đo RAM sharp giải mã thật, nên mức OOM thực tế còn cao hơn số trong repro.

## MONEY – bác bỏ: True (Major, medium)

Kết luận: các bản sửa ghi trong mục này đã đóng. Nhưng tôi tái hiện được 2 kịch bản tiền mới, chạy bằng code thật FolioService.resyncStay/syncStay trên lớp SQL giả lập trong bộ nhớ (script r5/money-foc-resync.ts). Kịch bản (A) cho phí hủy lớn hơn giá trị đơn sau FOC đã duyệt. Kịch bản (B) cho FOC bị trừ hai lần, đi qua đường B14 mới của đợt sửa 5. Tôi chỉ đọc repo, đường dẫn tính từ product/services/api.

PHẦN ĐÃ ĐÓNG
- FOC trên dòng OTA_COVERED:
  - foc.service.ts:90 dùng OTA_COVERED.has(line.category), JOIN payment theo reservation_id của dòng. special_discount chỉ áp cho dòng room, nên cũng bị chặn.
  - payment_model chỉ ghi lúc tạo đơn, không có UPDATE, nên không có đường "FOC trước rồi chuyển sang prepaid".
  - Chú thích onDecided :207-209 đã sửa đúng.
  - Test ota-prepaid-flow.test.ts:642 "Round 5 (A)…".
- retainableDeposit (reservations.service.ts:2619-2635):
  - B10 :2576/:2598 và B11 :3269-3270 dùng chung hàm.
  - Phí = X − min(X, applyPct) với X = min(base, giá trị đơn), nên phí ≤ giá trị đơn (pricing.ts:215-230).
  - Không tính dòng dịch vụ thì tổng yêu cầu hoàn = depositPaid − phí ≤ số tiền còn giữ.
  - B11 tính giá trị đơn trước money.voided (:3269 so với :3303). B10 tính quote trước voidNights/voidStay.
  - Test payments-s3.test.ts:2743 "Round 5 (REFUND #1)…" và :2813 "Round 5 (REFUND #3)…".
- bookingValueVnd (folio.service.ts:743-758): các dòng đảo đều mang category và related_line_id (:1391-1408), nên tổng tính ra là số ròng.
- 0043: mã 'PT-OTA-' + 32 ký tự hex, cột code kiểu text. vitest be-b-s3-units + migrations-journal: 20/20 xanh.

PHẢN CHỨNG (A) – FOC đã duyệt mất sau khi đổi giá đêm rồi đồng bộ thêm một lần nữa, làm phí B10/B11 vượt giá trị đơn sau FOC
- Cơ chế:
  1. Đổi giá đêm (B8 xếp lại hạng :2930, B7, đường :2238, B14 khách yêu cầu stay.service.ts:970) ghi room_revenue_vnd = gross − discount_vnd.
  2. Ở syncStay (folio.service.ts:1237), dòng đêm cũ lệch giá nên bị đảo kèm FOC. reverseWithReductions trả chiết khấu về đêm, discount_vnd = 0 (:1385).
  3. Dòng mới lại ghi bằng n.roomRevenueVnd cũ = gross − F (:1252), tức FOC bị "nhúng" vào dòng phòng.
  4. Bất kỳ lần resync sau nào (PATCH số khách, B7, B8, B13…) cũng thấy dòng G2 − F lệch với đêm G2, nên đăng lại G2. FOC biến mất, trong khi phiếu duyệt vẫn là 'approved'.
- Kết quả repro: đơn 3 đêm × 1tr, FOC 300k được duyệt. Đổi giá còn 950k: bookingValue 2.550.000. Resync thêm 1 lần: đêm 1 tính 950.000, bookingValue 2.850.000.
- B10 bậc 0%, cọc 2,85tr: directCancelRefund cho cancelFeeVnd 2.850.000, lớn hơn giá trị sau FOC là 2.550.000. Tương tự B11 giữ 2,85tr.
- Khách đang ở cũng bị thu thêm F lúc trả phòng.

PHẢN CHỨNG (B) – FOC trên đêm của đơn con bị trừ hai lần khi B14 đồng bộ đơn con (đường mới của đợt 5, stay.service.ts:1085)
- FOC luôn ghi reservation_id = folio.primary_reservation_id (foc.service.ts:121). liveLines lọc l.reservation_id = đơn con (folio.service.ts:1344-1356), nên syncStay(con) không nhìn thấy dòng FOC: reduced = 0.
- Dòng gross G lệch với G − F, nên bị đảo và đăng lại G − F, còn dòng FOC −F vẫn sống.
- Repro: đêm con 1tr, FOC 200k. Sau B14 đêm còn 600.000, tổng folio 2.500.000, trong khi phải là 2.700.000.
- Lỗi cùng lớp đã có ở B16 với đơn con (:1442). Không có test nào cho FOC + đổi giá + resync, hay FOC trên đêm đơn con.

MINOR
- FolioFocService.onDecided không khóa folio hay đơn (:176-200). Nếu duyệt FOC đúng lúc B10/B11 đang chạy: quote đọc giá trị trước FOC, voidStay sau đó lại thấy FOC đã được đăng, nên phí vượt giá trị đơn đúng bằng F.
- Trần otaPenaltyVnd (reservations.service.ts:2422-2426) = total_room_vnd + snapshot.extraPersonFeeVnd. Phần phụ thu người này thu tại quầy chứ không phải tiền OTA thu. Với đơn OTA trả trước, ota_collect khi đó = tiền phạt và có thể lớn hơn số OTA đã thu thật. Không có test cho 422 VALUE_OUT_OF_RANGE.
- Phép trừ ota trong bookingValueVnd không bao giờ chạy, vì nhánh OTA của B10/B11 thoát sớm. Câu trong s3-BE-B.md nói "giá trị đơn OTA = 0" là không chính xác.

Gap:
- Không có DB nên không chạy test tích hợp. Phần đóng tính xanh theo lần chạy 2169/2169 của ORC. Repro chạy code thật FolioService.syncStay, nhưng lớp SQL là giả lập bằng regex trong bộ nhớ, chưa chạy đầu-cuối qua API.
- (A) là lỗi có từ trước trong syncStay, không phải do đợt 5 gây ra. Bản thân truy vấn bookingValueVnd đúng định nghĩa DOM; chính bước đồng bộ làm mất FOC đã duyệt. Cần DOM chốt ý định: FOC giữ lại hay bỏ khi giá đêm đổi. Dù chọn bên nào, trạng thái trung gian (FOC nhúng vào dòng phòng, chiết khấu của đêm = 0) và việc FOC mất không có ai yêu cầu đều sai.
- (B) cần FOC trên đêm của đơn con (đơn gia hạn) trước khi làm B14 hoặc B16. Đường này hợp lệ qua API nhưng hiếm. Tôi chưa kiểm hoàn tiền B16 khi có FOC mồ côi.
- Ca tranh chấp FOC/B10 chỉ suy ra từ đọc code (không có khóa), chưa tái hiện.

## B14-STAY – bác bỏ: True (Major, high)

Kết luận: BÁC BỎ. Phần chuyển cả lượt lưu trú đã đúng. Nhưng khi đổi phòng nhiều lần trên đơn OTA, khách bị thu chênh lệch hai lần cho cùng một đêm, và bị thu chênh lệch cả cho đêm ngủ ở chính căn đã đặt.

PHẦN ĐÃ ĐÚNG (HEAD 1cd7d8a, đường dẫn tính từ product/services/api):
- Gọi B14 trên đơn con trả 409: `assertPrimary` ở stay.service.ts:728 và :1629.
- Chuyển cả lượt: `effectiveStay` (stay-support.ts:444) lấy các đơn con `in_house`. Mọi đoạn phòng có to_date > from của đơn gốc và đơn con đều được chuyển (:739-753, :912-966).
- Kiểm trống tới ngày đi hiệu lực, trả 409 ROOM_UNAVAILABLE trước mọi lệnh ghi (:772-780). DB còn chặn thêm bằng EXCLUDE ở 0014:7-9, nên không thể bán trùng căn mới.
- Giá theo kênh: đêm đơn con Trực tiếp lấy giá lịch căn mới (:813-816). Đơn OTA giữ giá và ghi chênh lệch theo đêm (:817-821).
- Test frontdesk-s3-fixes.test.ts:1170 "fix round 5 (B)…" phủ đúng ca chuẩn.
- ota_modification (reservations.service.ts:1142-1155) có test :1135. Tôi không thấy lỗi ở phần này.

PHẢN VÍ DỤ: chênh lệch OTA cộng dồn, không bao giờ được bù trừ.
- `otaDiffs` = max(0, direct(căn mới) − direct(căn hiện tại của đêm)) (:817-821). Mỗi lần B14 chỉ đăng thêm dòng `room_change_difference` (:1061-1082).
- Không lần B14 nào đảo các dòng chênh lệch cũ.
- `resyncStay` → `syncStay` (folio.service.ts:1224-1285) chỉ đụng tới các dòng no_show_fee, room, extra_person.
- Nơi duy nhất đảo `room_change_difference` là B16, và chỉ cho các đêm bị bỏ (stay.service.ts:1452-1466).
- Trong khi đó, đêm Trực tiếp (đơn con) được tính lại theo giá tuyệt đối. Vì vậy hai kênh lệch nhau ngay trong cùng một thao tác.

TÁI HIỆN chạy được, không cần DB. Script chạy hàm `StayService.changeRoom` THẬT, chỉ thay tx, StaySupport và folio bằng bản trong bộ nhớ:
- Script: /private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/r5/b14-stay-repro.ts
- Lệnh chạy: `cd product/services/api && pnpm exec tsx --tsconfig tsconfig.json <script>`

Kịch bản: Agoda 203, 01–04/05, giá 900k. Đơn con Trực tiếp 04–06. Giá Trực tiếp căn 203 là 792k, căn 401 là 1.042k. Mọi lần đổi đều là guest_request.
1. Ngày 02, đổi 203→401. Đăng 2 dòng chênh lệch 250k cho đêm 02 và 03. Đêm đơn con lên 1.042k (đúng).
2. Cũng ngày 02, buồng phòng dọn xong 203 (VC), khách xin quay lại 203.
   - Bản xem trước: roomChangeDifferenceVnd = 0, folioDeltaVnd = −500k (chỉ phần đơn con).
   - Hai dòng 250k vẫn còn sống. Đêm đơn con về 792k (đúng).
3. Ngày 03, đổi 203→401 lần nữa. Đăng thêm 250k cho đêm 03.

Kết quả của script:
- `RESULT per night difference charged: { '2027-05-02': 250000, '2027-05-03': 500000 }`
- `Charged total: 750000`
- Theo BR-424 đúng ra: đêm 02 khách ngủ ở 203 (căn đã đặt) nên chênh lệch là 0, đêm 03 ở 401 nên là 250k. Tổng đúng là 250k, tức thu thừa 500k.
- Trong đó đêm 03 bị thu chênh lệch HAI LẦN.

Chỉ cần hai bước 1 và 2 là đủ để thu chênh lệch 401 cho đêm khách ngủ ở 203. Màn xem trước của lễ tân không báo gì về các dòng cũ còn lại. Không có test nào cho ca B14 lặp lại trên đơn OTA.

Gap:
- Không chạy test tích hợp có DB. Script tái hiện chạy changeRoom thật nhưng thay folio bằng bản giả; việc resyncStay không đụng room_change_difference dựa vào đọc code folio.service.ts:1224-1285 và grep (chỉ B16 ở stay.service.ts:1452-1466 đảo loại dòng này).
- Biến thể property_fault (401 hỏng, OTTIMO chuyển khách về 203 mà vẫn giữ 250k/đêm) có thể chấp nhận theo câu 'sự cố giữ giá' của BR-424, giống cách xử lý đơn Trực tiếp. Tôi không coi đây là lỗi.
- Muốn chuyển ngược lại cùng ngày thì căn cũ phải được dọn về VC; ca chỉ đổi qua hai ngày liên tiếp cũng tái hiện được phần thu thừa.
- Không có test cho B14 vào ngày chỉ còn đêm của đơn con (from ≥ ngày đi của đơn gốc). Đọc code (:745-754, :800) thấy đúng nhưng chưa có bằng chứng chạy.
- Kiểm sức chứa căn mới chỉ dùng số khách của đơn gốc (counted(row), :764). Số khách đơn con được đồng bộ từ đơn gốc nên tôi không tìm được ca lỗi.

## Critic

# Phản biện cuối – kiểm lại các mục Major sau vòng sửa 5 (HEAD 1cd7d8a)

Tôi chạy lại cả 3 repro của bên kiểm chứng và đọc lại code thật ở mọi điểm mà repro thay bằng bản giả. Cả 3 phát hiện Major đều tái hiện đúng. Repo chỉ đọc, không sửa. Đường dẫn tính từ `product/services/api`.

| Mục | Kết luận | Lý do (một dòng) |
|---|---|---|
| UPLOAD – rò chỗ vĩnh viễn (Blocker vòng 4) | CLOSED | Chỗ được trả ở onSend, ở 'close' và ở onRequestAbort. `vitest run test/upload-gate-socket.test.ts`: 8/8 xanh. leak2/leak3 cho inFlight = 0. |
| UPLOAD – trả chỗ quá sớm ở `reply.raw.once('close')` (`src/http.ts:299`) | **Major-fix-now** | Chạy lại `r5/membound.ts`: một phiên khách, một IP, 16 thân 42 MB gửi tuần tự cho kết quả 16 handler giữ 672 MB, RSS 872 MB, `uploadsInFlight()=1`. Trần thiết kế là 4 × 42 = 168 MB, api có mem_limit 1g. Bản sửa 2 dòng (`r5/http-fixprobe.ts`, chạy `membound-fix.ts`) chỉ còn 2 handler, 84 MB, RSS 265 MB. Đây là lỗi hồi quy do chính vòng 5 gây ra. Test `upload-gate-socket.test.ts:243` đang khẳng định hành vi sai này là đúng, và câu ở `upload-gate.ts:12` không còn đúng. |
| UPLOAD – chỗ dành cho nhân viên vô tác dụng khi chung IP NAT với khách (`upload-gate.ts:47`) | Minor | Chỉ chặn tạm thời (429), không mất dữ liệu. Dời S4. |
| UPLOAD – Content-Type có byte 0xA0 ở đầu không được gắn lưới 'close' | Minor | Trong app hiện tại vô hại vì parseMultipart trả 422 ngay. Sẽ tự hết nếu gắn lưới ngay trong readMultipart (gộp vào bản sửa trên). |
| UPLOAD – thân gửi chậm giữ chỗ khoảng 90 s | Minor | Đã biết từ vòng 4, không đổi. |
| MONEY – chặn FOC trên mọi dòng OTA_COVERED, retainableDeposit B10/B11, bookingValueVnd, 0043 | CLOSED | Đúng như bên kiểm chứng nêu. Có test `ota-prepaid-flow.test.ts:642`, `payments-s3.test.ts:2743` và `:2813`. |
| MONEY (B) – FOC trên đêm đơn con bị trừ hai lần khi đồng bộ lại đơn con | **Major-fix-now** | Code thật xác nhận: dòng FOC luôn ghi `reservationId: folio.primary_reservation_id` (`foc.service.ts:121`), còn `liveLines` lọc theo `reservation_id` của đơn con (`folio.service.ts:1344`). Vì vậy `reduced = 0` và phép so ở `:1237` lệch, dòng phòng bị đảo rồi đăng lại G − F trong khi dòng FOC −F vẫn còn. Repro: folio còn 2.500.000, đúng ra phải là 2.700.000. Đường B14 mới ở vòng 5 (`stay.service.ts:1085`) đồng bộ lại cả đơn con, kể cả khi đổi phòng vì sự cố, nên chạm đúng tình huống mẫu S2 "sự cố → đổi phòng + FOC" khi đêm được FOC thuộc đơn gia hạn. |
| MONEY (A) – FOC đã duyệt biến mất sau khi đổi giá đêm rồi đồng bộ thêm một lần | **Major-fix-now** (sửa chung chỗ với B) | Đã đối chiếu SQL thật: `reverseWithReductions` (`:1371-1385`) gọi `addDiscount` làm discount của đêm về 0, nhưng dòng mới lại ghi `n.roomRevenueVnd` (giá G2 − F đọc từ trước, `:1252`). Lần đồng bộ sau đăng lại G2, FOC mất mà phiếu duyệt vẫn là "approved". Lỗi im lặng, nằm trong hàm đồng bộ dùng chung cho B7, B8, B14, B16 và PATCH số khách, không có test. BR-412 đã có tiền lệ "FOC đi theo dòng mới = min(FOC, giá mới)", nên không cần báo lên chủ đầu tư. |
| MONEY – duyệt FOC chạy song song với B10/B11, không có khóa | Minor | Chỉ suy ra từ đọc code, chưa tái hiện, cửa sổ rất hẹp. Dời S4. |
| MONEY – trần `otaPenaltyVnd` cộng cả phụ thu người; câu "giá trị đơn OTA = 0" trong s3-BE-B.md | Minor | Chưa có trường hợp sai tiền đã tái hiện. Sửa tài liệu và thêm test 422. |
| B14-STAY – chuyển cả lượt lưu trú, 409 khi gọi trên đơn con, kiểm trống, giá theo kênh | CLOSED | `stay.service.ts:728`, `:739-780`, `:813-821`. Test `frontdesk-s3-fixes.test.ts:1170`. |
| B14-STAY – chênh lệch đổi phòng OTA cộng dồn qua nhiều lần đổi | Major-defer-S4 | Đã chạy lại `r5/b14-stay-repro.ts`: thu thừa 500k, trong đó đêm 03 bị tính hai lần. Logic `max(0, …)` mà không đảo dòng cũ đã có từ vòng 4, không phải hồi quy vòng 5. Cần ít nhất 2 lần đổi theo yêu cầu khách có bước xuống căn rẻ hơn. Dòng chênh lệch hiện rõ trên folio và đảo tay được bằng `adjustFolioLine`. BR-424 chưa rõ "căn cũ" là căn đã đặt hay căn đang ở, nên DOM cần chốt trước. Điều kiện: có thẻ backlog S4, DOM bổ sung BR-424, QA ghi vào danh sách lỗi đã biết. |

Khuyến nghị cổng QC Sprint 3: CHƯA ĐẠT ở 1cd7d8a. Cần một vòng sửa 6 hẹp gồm 2 mục: (1) trả chỗ upload sớm, (2) FOC trong syncStay. Sau khi kiểm chứng lại đúng 2 mục đó thì cho ĐẠT CÓ ĐIỀU KIỆN, với B14-STAY dời S4 (DOM chốt BR-424) và các Minor vào backlog.

## Việc phải làm lại theo vai (chỉ cho các mục Major-fix-now)

**BE-C – upload (`src/http.ts`, `src/modules/files/public/upload-gate.ts`)**
- Trong readMultipart, đánh dấu khi đọc thân thành công (thân đã giao cho handler). Từ lúc đó, lưới 'close' không được trả chỗ nữa; chỗ chỉ được trả ở onSend, onResponse hoặc onRequestAbort.
- Gắn lưới 'close' ngay trong readMultipart lúc lấy chỗ, thay cho `startsWith` ở onRequest. Cách này đóng luôn Minor 0xA0.
- Sửa test `upload-gate-socket.test.ts:243`:
  - Trong lúc handler còn chạy, `uploadsInFlight()` phải còn đếm các request đó.
  - Sau khi handler trả lời thì về 0.
- Thêm test socket: một phiên khách, handler chậm, N lần gửi đủ thân rồi đóng socket → số handler đang giữ thân ≤ MAX_UPLOADS_PER_SESSION, và toàn tiến trình ≤ MAX_UPLOADS_IN_FLIGHT.
- Sửa lại chú thích ở `upload-gate.ts:12` và `http.ts:285-289` cho khớp hành vi thật.

**BE-B – folio (`folio.service.ts` syncStay/liveLines/reverseWithReductions, `foc.service.ts:121`)**
- Mục (B): tìm FOC/giảm giá của một dòng theo `related_line_id`, không theo `reservation_id`. Có hai cách:
  - Mở rộng `liveLines`/`reductionOf`.
  - Hoặc ghi dòng FOC với `reservation_id` của dòng mà nó giảm. Nếu chọn cách này, phải rà lại `bookingValueVnd`, `ota_collect` và cơ sở hoàn tiền B16 cho đêm đơn con.
- Mục (A): khi đảo một dòng phòng có FOC/giảm giá vì đêm đổi giá:
  - Dòng mới ghi theo giá gộp mới (lấy giá sau khi đã trả discount về đêm, không dùng `n.roomRevenueVnd` đọc từ trước).
  - Gắn lại FOC đã duyệt lên dòng mới = min(F, giá mới), trạng thái posted, không phải duyệt lại, rồi gọi `addDiscount` tương ứng và ghi audit.
- Test tích hợp:
  - FOC 300k → đổi giá đêm (B8 hoặc B14 theo yêu cầu khách) → đồng bộ lại → PATCH số khách → đêm vẫn còn giảm 300k, giá trị đơn đúng, phí B10 không vượt giá trị đơn.
  - FOC 200k trên đêm đơn gia hạn → B14 do sự cố → tổng folio không đổi; tiếp theo B16 trên đơn con → khoản hoàn tính trên số ròng sau FOC.

**DOM**
- Xác nhận trong response của BE-B rằng quy tắc "FOC/giảm giá đặc biệt đi theo dòng mới = min(FOC, giá mới)" của BR-412 áp cho cả đêm phòng khi giá đêm đổi. Ghi bổ sung vào BR-434/BR-431. Việc này DOM tự quyết, không cần ESC.

**QA và SEC**
- QA chạy lại toàn bộ api trên DB mới và thêm 2 ca hồi quy E2E ở trên.
- SEC kiểm lại giới hạn bộ nhớ upload bằng `membound.ts`, trên bản đã sửa thì phải ≤ 168 MB thân.

Các script repro nằm ở `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/r5/`:
- `membound.ts`, `membound-fix.ts`, `http-fixprobe.ts`
- `money-foc-resync.ts`
- `b14-stay-repro.ts`

Chạy bằng `cd product/services/api && pnpm exec tsx --tsconfig tsconfig.json <script>`.