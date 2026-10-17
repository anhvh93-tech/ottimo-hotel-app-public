# Kiểm chéo đối kháng lần 5 – sau vòng sửa 6 (ORC, verify-s3-round6, HEAD 59da6da, 17/10/2026)

## UPLOAD-MEM – bác bỏ: True (Major, high)

Kiểm ở HEAD 59da6da, fastify 5.12.7, Node 22.23.3. Chỉ đọc repo. Script để ở scratchpad/r6/.

PHẦN ĐÃ ĐẠT (4 yêu cầu của mục, chạy lại đúng các script được giao):
- r5/membound.ts: 16 thân 42 MB từ 1 phiên. Đỉnh 2 handler giữ thân, 84 MB, RSS 265 MB. Xả xong inFlight = 0 (vòng 5: 16 handler, 672 MB).
- leak.ts: inFlight = 0 ở mọi ca; upload hợp lệ nhận 200.
- leak2.ts (mặc định và CHECK=100/HANDLER=500): inFlight = 0 ngay và sau 2,5 s; upload hợp lệ nhận 200.
- leak3.ts (WAIT=3000): inFlight = 0; staff nhận 200; khách khác nhận 200.
- r5/seq.ts:
  - [1] đỉnh 2 handler giữ thân, inFlight 2, xả về 0.
  - [2]–[6] đều về 0.
  - [7] 3 khách chiếm NAT 10.10.0.1, staff cùng NAT nhận 200 (trước đây 429).
  - [9] handler treo thì vẫn giữ chỗ dù client đã rời. Đúng thiết kế mới, vì thân còn sống.
- vitest test/upload-gate-socket.test.ts: 10/10 xanh. Không test nào dùng keep-alive.
- Tách khóa IP theo loại (upload-gate.ts:48, `i:${kind}:${ip}`): không thấy hồi quy. Kind lấy từ route và phiên thật. Trần tiến trình 4 và phần dành cho staff vẫn giữ.

PHẦN BÁC BỎ – hồi quy mới do vòng 6:
- Nguyên nhân: src/http.ts:222-223 gắn `req.raw.socket.once('close', net)` cho mỗi upload. Listener này không bao giờ được gỡ khi thân đã giao hay khi handler đã trả lời.
- Hậu quả trên socket keep-alive:
  - Mỗi upload thêm 1 listener.
  - Closure `net` giữ context của readMultipart. Context đó giữ `payload` (IncomingMessage), payload giữ các listener 'data' của readBody, và các listener này giữ buffer `body`.
  - Vì vậy thân upload sống đến khi socket TCP đóng, kể cả khi handler đã gán lại req.body (guest.controller.ts:217, registration.controller.ts:209, attachments.controller.ts:92).
  - Slot đã trả ở onSend, nên trần phiên/IP/tiến trình không còn chặn được bộ nhớ.
  - Câu ở upload-gate.ts:15 ("At most MAX_UPLOADS_IN_FLIGHT × MULTIPART_BODY_LIMIT bytes … live in memory") lại sai.

Tái hiện:
1) r6/keepalive.ts (NODE_OPTIONS=--expose-gc): 1 phiên khách, 1 IP, 1 kết nối keep-alive, 16 upload 42 MB gửi tuần tự, handler trả 422 (đường parse/validate lỗi).
   - Kết quả: 16 lần 422, uploadsInFlight() = 0, 17 listener 'close' trên socket (có MaxListenersExceededWarning).
   - Sau GC cưỡng bức: 16/16 thân còn sống, tức 672 MB; arrayBuffers 716 MB, RSS 883 MB.
   - Đóng socket: 0/16 thân còn sống, 44 MB.
   - Đối chứng cùng HEAD, KEEP=0 (Connection: close): 0/16, RSS 315 MB.
   - Đối chứng http.ts của vòng 5 (1cd7d8a, chép ra r6/http-r5.ts), keep-alive: 0/16, 1 listener, RSS 329 MB.
2) r6/proxy.ts mô phỏng topology prod: client → reverse proxy có pool kết nối upstream keep-alive (như reverse_proxy của Caddy) → api.
   - 16 khách KHÁC NHAU: mỗi khách có phiên riêng, IP riêng, kết nối riêng với Connection: close.
   - Đường thành công (201, req.body đã gán lại): 1 upstream socket mang 17 listener. 16/16 thân còn sống, 672 MB, RSS 888 MB, uploadsInFlight = 0.
   - Đường 422: kết quả tương tự (672 MB, RSS 880 MB).
   - IMPL=r5: 0/16, RSS 290 MB.
   - Proxy bỏ kết nối idle: 0/16.

Tác động:
- api có mem_limit 1g (docker-compose.prod.yml:144).
- Trong prod, Caddy (product/infra/caddy/Caddyfile.prod:176) dùng chung kết nối upstream cho mọi client. Node chỉ đóng kết nối sau 72 s idle (keepAliveTimeout mặc định của Fastify; repo không đặt giá trị khác).
- Một khách có phiên hợp lệ có thể gửi khoảng 20+ thân rác 42 MB liên tiếp và làm api bị OOM-kill:
  - Đường 422 VALIDATION_FAILED xảy ra trước limiter.consume ở guest.controller.ts:208, nên không tốn hạn mức 20/giờ.
  - Trần phiên 2 và IP 3 không chặn, vì slot đã trả ở onSend.
- Ngay cả upload hợp lệ (ảnh CCCD) cũng bị giữ trong RAM cho tới khi kết nối upstream idle 72 s.
- Mức Major, tương đương lỗi vòng 5 (cũng 672 MB).

Sửa đề xuất (hẹp):
- Trong callback readBody (http.ts:224-228), cả khi lỗi lẫn khi thành công, gọi `req.raw?.off?.('close', net); req.raw?.socket?.off?.('close', net)`. Hoặc chỉ gắn lưới vào đối tượng theo request (req.raw / reply.raw), không gắn vào socket.
- Thêm test socket keep-alive: N upload tuần tự trên 1 socket, kiểm `socket.listenerCount('close')` không tăng, và WeakRef tới thân bị thu hồi sau gc.

Gap:
- Không có binary caddy trên máy. Topology prod được mô phỏng bằng reverse proxy Node với http.Agent({keepAlive:true}, lifo). Việc Caddy/Go Transport dùng lại kết nối upstream idle là hành vi mặc định đã biết, nhưng chưa chạy với Caddy thật.
- Không chạy app Nest đầy đủ với DB. Handler được thay bằng route Fastify trên createHttpAdapter thật. Đường giữ thân (context readMultipart → payload → listener 'data' → body) không phụ thuộc handler, vì thân vẫn sống cả khi handler đã gán lại req.body.
- Thời gian giữ thân trong prod phụ thuộc lưu lượng: kết nối upstream chỉ đóng sau 72 s idle. Chưa đo trên staging.

## FOC-RESYNC – bác bỏ: True (Major, high)

Tôi chạy lại repro trên HEAD 59da6da bằng code thật FolioService.resyncStay/syncStay, với lớp SQL giả lập trong bộ nhớ. Lớp giả lập làm đúng số học stay_night (addDiscount có kẹp; reprice = "UPDATE gross = X, room_revenue_vnd = X − discount_vnd") và CHECK folio_line. Script: scratchpad/r6/money-foc-resync-r6.ts và r6/e2.ts.

PHẦN ĐÃ ĐÚNG (PASS):
- (A) FOC 300k, cả 3 đêm 1tr đổi giá xuống 950k, resync 3 lần: còn đúng 1 FOC 300k và giữ approval_request_id. discount_vnd = 300k. bookingValue = 2.550.000. Phí B10 bậc 0 % = 2.550.000, không vượt giá trị đơn. Đẩy giá lên 1,2tr thì FOC vẫn 300k, không tăng.
- (B) FOC 200k trên đêm đơn con, resync cha rồi con 2 lần: tổng folio giữ 3.600.000, không trừ hai lần. Chạy cả với dữ liệu cũ, dòng FOC ghi reservation_id = đơn gốc: vẫn tìm ra qua related_line_id. Đêm con tăng 1,1tr thì FOC giữ 200k, FOC carry ghi reservation_id = C. B16 bỏ đêm thì FOC hủy theo, discount về 0.
- PATCH số khách (extra_person): phí 150k → 100k thì FOC còn 100k; phí 0 thì FOC hủy.

PHẢN CHỨNG 1 (Major): B8 dời cả đơn đặt FOC sai đêm, vi phạm BR-434 "đêm thứ k → đêm thứ k".
- Ở folio.service.ts:1254 (`if (!reductions.length) continue;`), droppedNights chỉ nhận các đêm bị bỏ CÓ FOC. Đến :1271 (`droppedNights[i]`), hàm ghép đêm có FOC thứ i với đêm mới thứ i. Vì vậy FOC của đêm 2 hoặc 3 luôn rơi vào đêm mới 1.
- Repro e2.ts: đơn Trực tiếp 03–05/12, thứ Năm–Sáu–Bảy, ngày thường 1,0tr, thứ Bảy 1,2tr. FOC 100 % = 1,2tr trên đêm 3 (thứ Bảy). Dời sang 10–12/12, toàn ngày mới nên move() void đêm cũ và tạo stay_night mới.
  - Code đặt FOC lên 10/12 (đêm 1) = min(1,2tr; 1,0tr) = 1,0tr; đêm 1 thành miễn phí cả đêm, khách trả 2.200.000.
  - Theo BR-434, FOC phải ở 12/12 (đêm 3) = 1,2tr, khách trả 2.000.000. Khách bị thu thừa 200.000.
  - Sau đó B16 bỏ đêm 3: code để khách trả 1.000.000 (FOC vẫn ở đêm 1). Theo quy tắc là 2.000.000, vì FOC đi theo đêm 3.
- Test `foc-resync.test.ts` (A) chỉ đặt FOC lên `nights0[0]` (:209), nên trùng hợp mà xanh.
- Ca dời chồng ngày (14–16 → 15–17, chỉ void 14/12, thêm 17/12): FOC đêm 1 sang 17/12 = đêm 3, cũng không phải k→k.

PHẢN CHỨNG 2 (Major): FOC lớn hơn giá mới trên đơn có người chốt (hoa hồng CTV/sale) thì lệnh trả 500.
- Ví dụ chính là ví dụ trong BR-434: FOC 100 % 792k, khách xin B14 sang căn 700k.
- stay.service.ts:969-970 ghi room_revenue_vnd = 700k − 792k = −92k. confirmedStay đọc giá trị này trước khi đồng bộ.
- Vòng đêm ở :1280 tính đúng (gộp 700k, FOC carry 700k). Nhưng syncCommission (:1686, :1773) lấy room_revenue_vnd âm làm base và trọng số. allocate.ts:13 ném `RangeError: allocate: weights must be non-negative safe integers`; lỗi này không được map nên thành 500, giao dịch rollback.
- Repro C (closer): FAIL đúng lỗi trên. Đơn không có người chốt thì PASS: FOC 700k, khách trả 0.
- Cùng lỗi với B7 kéo dài làm hạ bậc LOS, và B13 khi đơn có FOC 100 %.
- Trước vòng 6 ca này cũng hỏng (dòng room âm vi phạm CHECK), nên đây không phải hồi quy. Nhưng quy tắc min(F, giá mới) mà vòng 6 nhận đã sửa vẫn chưa đạt khi đơn có hoa hồng.

MINOR (không đủ để bác riêng):
- (a) FOC carry lấy min(FOC hiện tại, giá mới) (:1461), không phải min(số đã duyệt, giá mới). Giá xuống 900k rồi lên lại 1,0tr thì FOC 100 % chỉ còn 900k, khách trả 100k (repro D). extra_person cũng vậy (repro G: 150k → 100k → 200k thì FOC còn 100k). Tiền lệ G-10 (stay-support.ts:556) làm giống thế, cần DOM xác nhận.
- (b) Base hoa hồng dùng stay.nights đọc trước khi carry. Sau B8 dời FOC, base = 2.000.000 thay vì 1.700.000, chỉ đúng lại ở lần resync sau (repro H). Cùng lớp với việc duyệt FOC không resync hoa hồng (có từ trước).
- (c) Ca F > giá mới, đơn không closer: preview B14 báo folioDeltaVnd −92k nhưng folio thực đổi 0.

Gap:
- Chưa chạy được trên PostgreSQL thật vì task chỉ cho vitest không DB. Kết quả lấy từ code thật FolioService chạy trên lớp SQL giả lập trong bộ nhớ, cùng phương pháp với repro r5.
- Chưa chạy trọn phản chứng 2 qua HTTP (B14 guest_request trên đơn có closer collaborator/sales_staff). Chuỗi lỗi suy từ stay.service.ts:969-970 → syncCommission → allocate.ts:13 và đã tái hiện ở tầng FolioService.
- Phản chứng 1 dựa vào move() void đêm cũ và tạo stay_night id mới cho ngày mới, theo đọc reservations.service.ts:2771-2779, chưa chạy endpoint.
- Phản chứng 1 hiểu BR-434 'đêm thứ k → đêm thứ k' theo thứ tự đêm của cả lượt lưu trú. Với ca B7/B8 dời chồng ngày, hoặc rút đầu và nối đuôi, quy tắc chưa nói rõ có gọi là 'dời cả đơn' hay không; cần DOM chốt.
- Chưa kiểm ca tranh chấp: duyệt FOC chạy song song với resync.
- Chưa kiểm FOC đang pending_approval khi resync. Đây là hành vi A5 có từ trước: dòng bị đảo thì yêu cầu bị từ chối.

## Critic

| Mục | Kết luận | Lý do |
|---|---|---|
| UPLOAD-MEM: trần upload theo phiên, IP và tiến trình; tách khóa IP theo loại (upload-gate.ts:48) | CLOSED | Các trần chạy đúng; upload-gate-socket.test.ts 10/10 xanh. |
| UPLOAD-MEM: hồi quy vòng 6 ở src/http.ts:222-223 (`req.raw.socket.once('close', net)` không được gỡ) | **Major-fix-now** | Tôi đã chạy lại. r6/keepalive.ts, HEAD, keep-alive: 17 listener 'close'; 16/16 thân 42 MB (672 MB) còn sống sau GC; RSS 860 MB khi trả 422 và 886 MB khi gán lại `req.body`. Cùng script với http.ts của vòng 5: 0/16, RSS 314 MB. r6/proxy.ts (16 khách khác nhau qua 1 kết nối upstream keep-alive): HEAD 16/16, 672 MB, RSS 883 MB; vòng 5 0/16. Caddy dùng lại kết nối upstream (Caddyfile.prod: `reverse_proxy api:3000`); repo không đặt keepAliveTimeout; api có `mem_limit: 1g`. Sửa: gỡ `net` khỏi `req.raw` và socket trong callback của readBody, thêm test keep-alive (`listenerCount('close')` và WeakRef sau gc). |
| FOC-RESYNC: cùng đêm đổi giá, đơn cha/con, dữ liệu cũ, extra_person | CLOSED | Tôi chạy lại money-foc-resync-r6.ts: các ca A, B, B-legacy và G (giảm phí) đều PASS. |
| FOC-RESYNC (1): B8 dời cả đơn đặt FOC sai đêm | **Major-fix-now** | folio.service.ts:1254 `if (!reductions.length) continue;` bỏ qua đêm không có FOC trước khi ghi vào droppedNights, nên ghép theo vị trí ở :1268-1271 bị lệch. Tôi chạy lại r6/e2.ts: FOC đêm 3 (1,2tr) rơi vào đêm mới 1 (1,0tr), khách trả 2.200.000 thay vì 2.000.000. Sau B16 bỏ đêm 3, khách trả 1.000.000 thay vì 2.000.000. Đây là sai tiền, âm thầm, trái decision-log 2026-10-17 ("chuyển sang đêm tương ứng theo thứ tự"). move() có void đêm cũ và tạo đêm mới thật (reservations.service.ts:2772-2779). Test `foc-resync.test.ts` "(A) FOC 300k → B8…" chỉ đặt FOC ở `nights0[0]` (:209), nên trùng hợp mà xanh. |
| FOC-RESYNC (2): đơn có người chốt (CTV/sale), FOC lớn hơn giá mới, trả 500 | Major-defer-S4 | Tôi chạy lại ca C (closer): `RangeError` từ allocate.ts:13. Nguồn: stay.service.ts:970 ghi `room_revenue_vnd` âm; CHECK của stay_night không chặn số âm; syncCommission (:1686, :1773) dùng nó làm base và trọng số. Không phải hồi quy vòng 6: giao dịch rollback sạch, không sai tiền, đường đi hiếm. Ghi known issue; sửa bằng cách đọc lại đêm sau khi carry (sửa luôn Minor b). |
| Minor (a): carry lấy min(FOC hiện tại, giá mới) | Minor | Lệch chữ "số đã duyệt" của quyết định 17/10 (ca D, G). Cần DOM xác nhận, xử lý ở S4. |
| Minor (b): base hoa hồng còn cũ sau B8 | Minor | Tự đúng lại ở lần resync sau (ca H). |
| Minor (c): preview B14 báo delta −92k, folio thực đổi 0 | Minor | Chỉ sai hiển thị. |

Gaps:
- Chưa chạy với Caddy thật; topology prod được mô phỏng bằng proxy Node keep-alive.
- FOC chạy bằng code thật của FolioService trên lớp SQL giả lập, không có PostgreSQL.

Script: /private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/r6/{keepalive.ts,proxy.ts,e2.ts,money-foc-resync-r6.ts}

Khuyến nghị cổng QC Sprint 3: KHÔNG ĐẠT ở HEAD 59da6da; chạy fix round 7 hẹp cho 2 Major-fix-now (gỡ listener 'close' và thêm test keep-alive; ghép FOC khi B8 theo đúng thứ tự đêm k→k và thêm test FOC trên đêm 3), xác minh lại, rồi chuyển Major (2) và các Minor sang S4.