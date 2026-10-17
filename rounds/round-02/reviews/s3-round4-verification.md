# Kiểm chéo đối kháng lần 3 – sau vòng sửa 4 (ORC, workflow verify-s3-round4, HEAD 9e9fd64, 17/10/2026)

## UPLOAD-LEAK – bác bỏ: True (Blocker, high)

Tôi tìm được một chuỗi request mới vẫn làm rò chỗ upload và đã tái hiện trên socket thật. Fastify 5.12.7 (bản @nestjs/platform-fastify dùng), Node 22.23.3. Chỉ đọc, không sửa repo.

PHẦN ĐÃ ĐÓNG (gap của lượt trước):
- Hủy lúc đang kiểm phiên: http.ts:191-195 gọi clientGone (:132-139) trước khi lấy chỗ. Test upload-gate-socket.test.ts:87.
- Hủy lúc đang đọc thân: readBody nghe 'aborted' và 'close' (:248-252), lỗi thì trả chỗ (:207). Test :96 và :107.
- Trần mỗi phiên 2, mỗi IP 3 (upload-gate.ts:14-16, :33-52). Test :117.
- Cookie gắn route: http.ts:70-79 và :164; upload-session.check.ts:46-47. Test socket :142, test tích hợp files-attachments.test.ts:379.
- Thân chunked: bắt buộc có Content-Length, thiếu thì trả 422 (http.ts:168-173). Thân được chép vào 1 buffer cấp sẵn (:221).
- leak.ts chạy lại bằng tsx với DELAY=5, DELAY=100 và AB=1: inFlight = 0/0/0, upload hợp lệ nhận 200. vitest test/upload-gate-socket.test.ts: 5/5 xanh.

RÒ RỈ MỚI, ĐÃ TÁI HIỆN (Blocker): client gửi ĐỦ thân rồi đóng kết nối trước khi api trả lời.
Cơ chế:
- Đọc thân thành công thì chỗ được giữ (http.ts:205-209). Chỗ chỉ được trả bởi onResponse (:286) hoặc onRequestAbort (:287).
- Fastify chỉ chạy onRequestAbort khi `req.aborted` đúng (node_modules fastify@5.12.7 lib/route.js:579-590). Node chỉ đặt aborted khi thân chưa đọc xong (!readableEnded || !complete). Thân đã đọc đủ thì cờ này là false.
- onResponse chỉ gắn với 'finish' hoặc 'error' của res (lib/reply.js:974-1004). Ghi vào socket đã hủy thì res chỉ phát 'close', không có 'finish' hay 'error'.
- Kết quả: chỗ không bao giờ được trả.

Script repro (scratchpad/upleak/):
- leak2.ts: handler chờ 200 ms. Ba lần gửi đủ thân rồi hủy sau 50 ms làm inFlight = 3, và 2,5 s sau vẫn là 3. Mọi upload sau đó từ cùng IP nhận 429 vĩnh viễn.
- leak3.ts mô phỏng prod: trustProxy và X-Forwarded-For, handler 150 ms. 4 request (2 phiên khách × 2 IP) làm inFlight = 4. Upload của nhân viên từ IP khác, phiên khác nhận 503. Sau 65 s (đã quá requestTimeout) inFlight vẫn = 4, nhân viên và khách khác vẫn nhận 503 cho tới khi khởi động lại tiến trình.
- Trên app thật, cửa sổ này rất rộng: AuthGuard truy DB, controller truy DB, sharp có thể chạy tới 10 s mỗi ảnh.
- Lỗi xảy ra cả khi không có ai tấn công:
  - Caddy cắt kết nối tới api khi trình duyệt bỏ request hoặc khi hết `response_header_timeout 60s` (Caddyfile.prod:176-180).
  - guest-web dùng `xhr.timeout = 120_000` (apps/guest-web/src/app/api.ts:182).
  - Khách đóng tab khi đang "xử lý ảnh", hoặc mạng 4G rớt sau khi gửi xong ảnh.
  - Mỗi lần như vậy mất vĩnh viễn 1 chỗ, và tới chỗ thứ 4 thì upload giấy tờ lưu trú (nghĩa vụ pháp lý) bị chặn toàn bộ.
- Test socket không có ca này: mọi ca hủy đều gửi thân thiếu, và handler trả lời ngay (:41-42).
- Cách sửa gợi ý: trả chỗ trên `reply.raw.once('close')` (ServerResponse luôn phát 'close'), hoặc trên `req.raw` 'close' bất kể cờ aborted. Thêm test socket: gửi đủ thân, hủy trước khi handler (có trễ) trả lời, kiểm uploadsInFlight() = 0.

PHẦN CÒN LẠI (Major/Minor):
- Thân chậm: chỗ chỉ được trả khi Node trả 408 ở khoảng 90 s, không phải 60 s (slow.ts đo được: inFlight = 2 suốt tới 80 s, về 0 lúc 90 s).
- Kẻ tấn công có ≥2 IP và ≥2 phiên khách vẫn giữ được cả 4 chỗ toàn tiến trình trong 90 s rồi lặp lại, nên mọi người nhận 503. Câu chú thích ở upload-gate.ts:7-8 ("staff and other guests keep at least one") chỉ đúng khi tấn công từ một phiên hoặc một IP.

Gap:
- Rò chỗ vĩnh viễn: client gửi đủ thân (Content-Length khớp) rồi đóng kết nối trước khi api trả lời. onRequestAbort không chạy vì req.aborted=false khi thân đã đọc đủ (fastify lib/route.js:579-590). onResponse không chạy vì không có 'finish'/'error' (lib/reply.js:974-1004). Chỗ giữ ở http.ts:205-209 không bao giờ được trả. Đã tái hiện (scratchpad/upleak/leak2.ts, leak3.ts): 4 request (2 phiên × 2 IP) làm mọi upload trả 503 quá 65 s, tới khi khởi động lại tiến trình.
- Lỗi xảy ra cả khi không có ai tấn công, qua Caddy: trình duyệt bỏ request, Caddy hết response_header_timeout 60s, guest-web hết xhr.timeout 120s, hoặc khách đóng tab khi đang xử lý ảnh. Mỗi lần mất 1/4 chỗ.
- Thiếu test socket cho ca gửi đủ thân rồi hủy khi handler (có trễ) chưa trả lời. Các ca trong upload-gate-socket.test.ts đều gửi thân thiếu, và handler trả lời ngay.
- Thân chậm giữ chỗ khoảng 90 s, không phải 60 s (Node kiểm requestTimeout theo chu kỳ). Với ≥2 IP và ≥2 phiên khách vẫn chiếm được cả 4 chỗ toàn tiến trình rồi lặp lại, nên mọi người nhận 503. Câu chú thích ở upload-gate.ts:7-8 nói quá so với thực tế.
- Không có test nào cho thân chunked hoặc thiếu Content-Length → 422 (http.ts:168-173).

## OTA-MONEY – bác bỏ: True (Major, high)

Kết luận: chưa đóng được OTA-MONEY. Toàn bộ gap cũ của DOM-BE-13/VER đã đóng, có code và test. Nhưng tôi tìm thêm được 5 kịch bản tiền mới: 1 kịch bản đã tái hiện bằng `moneyPosition` thật, 1 kịch bản vi phạm quy tắc DOM 17/10 chưa được cài, 3 kịch bản đọc từ code. Vì vậy mục này bị bác bỏ. Kiểm ở HEAD 9e9fd64, đường dẫn tương đối theo product/services/api.

## Gap cũ đã đóng (file:line + test)

1. **Đồng bộ lại `ota_collect`.**
   - Code gọi `resyncOtaCollect` ở 4 chỗ:
     - `reverseLine`: `folio.service.ts:666`
     - `adjustFolioLine`: `folio-lines.service.ts:490`
     - Duyệt FOC: `foc.service.ts:207`
     - B18, trước bước kiểm số dư: `checkout.service.ts:407`
   - Test `ota-prepaid-flow.test.ts:350` "Re-verification 17/10: B16 on an OTA booking, MGR edits the OTA-kept fee, FD voids it…".
2. **Không FOC trên đêm OTA trả trước, và sửa giá đêm sau trả phòng.**
   - Code: `foc.service.ts:87-101` trả 422 `FOC_NOT_ALLOWED_OTA_PREPAID`.
   - Test `:445` "BR-307-03 / BR-307-04".
3. **Tiền phạt hủy OTA ghi lên folio.**
   - Code: `reservations.service.ts:2531-2540`, `voidStay` ở `folio.service.ts:969-998`, và `channelFeeAfterVoid`.
   - Test `:510` "BR-310-01 / BR-310-02".
4. **Quy tắc `partyChangeSource`.**
   - Code: `reservations.service.ts:1047-1135`, `:1191-1208`, `repriceExtraPersons` ở `:1324-1371`; `bookedParty` lưu khi tạo đơn ở `:551`.
   - Test `frontdesk-s3-fixes.test.ts:1066` "(5) OTA guest count…" và `:1135` "(5) oracles BR-110-14 / BR-110-15".
5. **B16 chỉ tạo một yêu cầu hoàn, gồm phụ thu người và chênh lệch đổi phòng; B16 trên lượt có đơn con.**
   - Code: `stay.service.ts:1128-1420`; B14 ghi chênh lệch theo từng đêm ở `:757-780` và `:963-984`.
   - Test:
     - `ota-prepaid-flow.test.ts:594` "BR-428-06"
     - `frontdesk-s3-fixes.test.ts:876` "(1)(3)(4)…"
     - `:969` "(1) the guest leaves on the OTA departure…"
     - `:1018` "(2) B14 on an OTA booking writes the difference per night…"
6. **Backfill đơn tạo trước 0042:** migration `0043`.
7. **Test DB-free:** tôi đã chạy `be-b-s3-units.test.ts`, 14/14 xanh. Các test tích hợp cần DB nên tôi không chạy; số liệu xanh dựa vào lần chạy của ORC (2161/2161).

## Phản chứng mới

**(A) FOC trên dòng phí do OTA giữ xóa mất phụ thu thu tại quầy – đã tái hiện.**
- Code:
  - `foc.service.ts:87` chỉ chặn FOC khi `category === 'room'`. Dòng `early_departure_fee` (`charge_code ota_retained`) và `cancellation_fee` của đơn OTA trả trước vẫn FOC được (lễ tân trưởng duyệt tới 300k, quản lý tới giá 1 đêm).
  - `otaCoveredOf` (`folio.service.ts:273-286`) tính "trước FOC", nên khoản thu OTA không đổi.
  - `moneyPosition` (`:333-341`) lấy dòng FOC trừ vào các khoản phải thu tại quầy.
  - Chú thích ở `foc.service.ts:204-206` nói khoản thu OTA sẽ giảm theo. Điều này sai với code.
- Tái hiện bằng `moneyPosition` thật, chạy tsx, script ở scratchpad `otamoney/foc-fee.ts`:
  - Agoda 3 đêm × 900k. B16 nhập `otaRetainedVnd` 450k, nên khoản thu OTA = 2.250k.
  - Người lớn thứ 4 trong 2 đêm còn ở: phụ thu 300k, khách đã trả tại quầy.
  - Duyệt FOC 450k trên dòng phí trả phòng sớm → `creditVnd` = 300k. B18 sẽ đòi xử lý tiền dư, và lễ tân chi trả 300k tiền thật.
  - Nếu khách chưa trả 300k thì `balanceDueVnd` = 0, tức mất 300k phụ thu.
- Không có test cho ca này.

**(B) B14 trên lượt có đơn con gia hạn không chuyển đêm của đơn con.**
- Quy tắc: BR-424 bổ sung 17/10 và `decision-log.md:574` yêu cầu đổi phòng áp cho cả lượt (đơn gốc + đơn con).
- Code `changeRoom` (`stay.service.ts:688-1027`) không dùng `effectiveStay` và không xét đơn con:
  - `:721` trả `DATE_INVALID` khi ngày đổi ≥ ngày đi của đơn gốc.
  - `:726` và `:743` chỉ chuyển đoạn phòng của đơn gốc, tới ngày đi của đơn gốc.
- Kịch bản: Agoda 203 ngày 01–03, đơn con 03–05. Ngày 02 khách yêu cầu chuyển sang 401.
  - Hai đêm 03 và 04 của đơn con vẫn ở căn 203 với giá 792k, mất phần chênh 250k × 2.
  - Căn 401 vẫn trống trong hai đêm 03–04, có thể bán trùng.
- Không có test.

**(C) Ghi "OTA sửa đơn" sau "khách báo trực tiếp" cùng số khách thì không có tác dụng.**
- Code: `peopleChanged` (`reservations.service.ts:1109`) bằng false, nên `:1191` bỏ qua bước tính lại.
- Kết quả: API trả 200 nhưng `bookedParty` vẫn là 2, phụ thu 150k/đêm vẫn còn phải thu. Khách trả hai lần, cho OTA và tại quầy. Điều này trái BR-110 (i).
- Không có test.

**(D) Hủy hoặc no-show đơn OTA khi khách đã trả phụ thu tại quầy trước ngày đến.**
- Việc trả trước này hợp lệ từ đợt sửa 4; test `:1066` trả 300k trước ngày đến.
- Code:
  - Nhánh OTA trả `refundableVnd: 0` (`reservations.service.ts:2536`).
  - No-show OTA: `kept = 0` (`:3247`).
  - `voidStay` đảo các dòng `extra_person`.
- Kết quả: 300k nằm thành số dư thừa trên folio của đơn đã hủy. Không có yêu cầu hoàn, cũng không có nguồn "Cần chú ý" nào nhắc.

**(E) B7 và B7a không tính lại phụ thu từng đêm của đơn OTA.**
- Code: `move` chỉ cập nhật `room_id` (`:2716-2730`); `assignRoom` (`:2969-3050`) không đồng bộ lại tiền.
- Kịch bản: Agoda 202, khách báo trực tiếp 3 người, phụ thu 150k/đêm. Nâng hạng B7 sang 302 (định mức 3) mà vẫn thu 150k/đêm, thu thừa. Ngược lại từ 302 sang 202 thì mất phụ thu.
- Đơn OTA chưa gán phòng: PATCH "khách báo trực tiếp" có `baseOccupancy` null, nên không bao giờ sinh phụ thu.

Gap:
- [Major] FOC trên dòng do OTA thu của đơn OTA trả trước, ngoài dòng phòng (early_departure_fee/ota_retained, cancellation_fee), vẫn được phép (foc.service.ts:87 chỉ chặn 'room'). Vì otaCoveredOf tính trước FOC (folio.service.ts:273-286), moneyPosition (:333-341) lấy FOC trừ vào phụ thu thu tại quầy. Đã tái hiện bằng moneyPosition thật: FOC 450k trên phí OTA giữ → creditVnd 300k, phải chi 300k tiền thật; nếu chưa thu thì mất 300k phụ thu. Chú thích foc.service.ts:204-206 mâu thuẫn với code. Không có test.
- [Major] B14 trên lượt có đơn con gia hạn chỉ chuyển đêm của đơn gốc (stay.service.ts:721, :726, :743; changeRoom không dùng effectiveStay), trái BR-424 bổ sung 17/10 và decision-log:574. Đêm của đơn con ở lại căn cũ với giá cũ: mất chênh lệch giá (ví dụ 203→401 mất 250k/đêm), căn mới trống các đêm đó nên có thể bán trùng. Không có test B14 nào cho đơn OTA có đơn con.
- [Major] PATCH partyChangeSource=ota_modification + otaModificationRef khi số khách đã bằng số mới (trước đó đã ghi 'khách báo trực tiếp'): peopleChanged=false (reservations.service.ts:1109, :1191), API trả 200 nhưng bookedParty và phụ thu 150k/đêm giữ nguyên, khách bị thu hai lần (OTA + quầy), trái BR-110 (i). Chỉ có đường vòng PATCH 2 lần. Không có test.
- [Major/Minor] Hủy (B10) hoặc no-show đơn OTA khi khách đã trả phụ thu 'khách báo trực tiếp' tại quầy trước ngày đến: nhánh OTA của cancellationQuote trả refundableVnd 0 (reservations.service.ts:2536), no-show kept=0 (:3247), voidStay đảo dòng extra_person → số dư thừa nằm trên folio của đơn đã hủy, không có yêu cầu hoàn, không có nguồn 'Cần chú ý'. Không có test.
- [Major, có từ trước, rộng hơn OTA] B7 (move, reservations.service.ts:2716-2730) và B7a (assignRoom :2969-3050) không tính lại extra_person_fee_vnd theo từng đêm do repriceExtraPersons ghi (:1360-1371) khi định mức căn đổi: nâng hạng 202→302 vẫn thu 150k/đêm (thu thừa), 302→202 mất phụ thu. Đơn OTA chưa gán phòng: PATCH 'khách báo trực tiếp' có baseOccupancy null → không bao giờ có phụ thu.
- [Minor] otaPenaltyVnd không có trần (reservations.service.ts:2374): đơn OTA trả tại chỗ nhập nhầm tiền phạt sẽ thành khoản còn phải thu lớn hơn giá trị đơn.
- [Minor] 0043: mã 'PT-OTA-' + 12 ký tự hex đầu của uuidv7, vốn là mốc thời gian theo ms. Hai đơn cùng cơ sở tạo trong cùng 1 ms sẽ trùng payment_property_code_key và làm migration lỗi.
- Không tự chạy được các test tích hợp cần DB: ota-prepaid-flow.test.ts:350/445/510/594 và frontdesk-s3-fixes.test.ts:876/969/1018/1066/1135 được tính là xanh theo bằng chứng ORC (2161/2161). Ca (A) chỉ tái hiện bằng hàm thuần moneyPosition, chưa chạy đầu-cuối qua API.

## REFUND-CANCEL – bác bỏ: True (Major, high)

Kết luận: BÁC BỎ. Ba gap B10 của lượt trước đã đóng, nhưng còn gap cũ chưa đóng và tôi tìm được phản ví dụ mới, ngay trên đúng hai bất biến cần giữ.

Phần ĐÃ ĐÓNG (đọc code ở HEAD 9e9fd64, đường dẫn tính từ product/services/api):
- Cơ sở tính phí: `base = max(0, depositPaid − open)`, rồi lấy `min(base, bookingValue)`. Phần hoàn = base − phí (reservations.service.ts:2566-2579).
- Test: payments-s3.test.ts:2659 'Re-verification 17/10 (VER-BE-S3-01)…' phủ hai bậc. Bậc 0% (dryRun): phí = giá trị đơn. Bậc 50% (hủy thật): `asked ≤ creditVnd`.
- depositPaid đã trừ tiền đã hoàn: `min(dep, own − back)`, bỏ dòng đảo (folio.service.ts:513-535).
- Đơn hold chỉ nhận cọc: payments.service.ts:177-179 (recordPayment) và :700-701 (VietQR). Vai SAL/CTV bị 403 trước 422 ở :168. Có test payments-s3.test.ts:2534.

Phản ví dụ còn lại:
1. [Major] B11 no-show bị bỏ sót, cùng lớp lỗi với B10 cũ. `kept = deposit` (reservations.service.ts:3214, :3247), giữ toàn bộ depositPaid. Không trừ yêu cầu hoàn đang mở, không chặn trần theo giá trị đơn.
   - Dùng đúng dữ liệu test :2659: cọc 1,5tr cho đơn 1tr, có yêu cầu hoàn 500k đang mở. Đánh dấu no-show thì `no_show_fee` = 1,5tr, lớn hơn giá trị đơn. Credit sau đó bằng 0, nên yêu cầu 500k không chi được (payOut trần theo rawCredit, refunds.service.ts:493-498).
   - Nếu 500k đã được chi trước đó thì phí chỉ 1tr, tức kết quả vẫn phụ thuộc thời điểm chi.
   - Không có test.
2. [Major] Tổng yêu cầu hoàn vượt số dư sau B10 khi folio còn dòng khác.
   - voidStay chỉ đảo dòng `room` và `extra_person` (folio.service.ts:956, :964).
   - addFolioLine không kiểm trạng thái đơn, chỉ kiểm ngày dịch vụ nằm trong kỳ ở (folio-lines.service.ts:249). Vì vậy FD ghi được `service_fee` 400k (ví dụ đưa đón sân bay) lên đơn confirmed khi khách chưa đến.
   - Ví dụ: cọc 1tr = giá trị đơn, dòng dịch vụ 400k chưa thu. Hủy ở bậc 100%: tạo yêu cầu hoàn 1tr, nhưng credit sau hủy chỉ 600k. Ở bậc 50%: yêu cầu 500k, credit chỉ 100k.
   - Trường hợp này phá đúng bất biến `asked ≤ creditVnd` mà test :2739 dùng.
3. [Major] Trần `bookingValue` dùng dữ liệu cũ, nên phí có thể vượt giá trị thật của đơn.
   - B7/B8 chỉ cập nhật `total_room_vnd` (reservations.service.ts:2733); `retierNights` chỉ ghi `nights` và `losDiscountPct` (:2909-2922). `extraPersonFeeVnd` vẫn giữ theo số đêm cũ (:2567-2568).
   - Ví dụ: 3 đêm × 1tr + phụ thu 150k/đêm, đã trả đủ 3,45tr, rút còn 1 đêm. Trần thành 1tr + 450k = 1,45tr, trong khi folio chỉ 1,15tr. Hủy ở bậc 0% thì phí 1,45tr.
   - Tương tự: FOC hoặc special_discount trên dòng phòng của đơn confirmed (foc.service.ts:58-160 không chặn theo trạng thái) không được trừ khỏi trần. Ví dụ đơn 2tr giảm 500k, cọc 2tr, hủy ở bậc 0%: phí 2tr, lớn hơn giá trị thật 1,5tr. Nếu FD tạo yêu cầu hoàn 500k trước khi hủy thì phí chỉ 1,5tr.
4. [Minor, đã nêu ở lượt trước, CHƯA sửa] cancel đọc yêu cầu hoàn đang mở (:2544) khi chỉ khóa reservation (:2382). Folio chỉ bị khóa sau đó, trong voidStay (folio.service.ts:949). createRefundRequest thì chỉ khóa folio (refunds.service.ts:161-166), còn ownership đọc reservation không khóa (refunds.controller.ts:107). Mức cô lập là READ COMMITTED.
   - Hai thao tác chạy song song có thể tạo 500k + 1,5tr = 2tr yêu cầu hoàn trong khi chỉ giữ 1,5tr.
5. [Minor] B2 nhận `initialPayment.type = 'charge'` để đủ mức cọc cho đơn ngày tương lai (:636-646, :1547). Đặc tả EP02:110 chỉ cho trường hợp khách vãng lai đến hôm nay. Khi đó depositPaid = 0, nên B10 không thu phí ở bậc nào (:2546-2552).

Gap:
- Không chạy được test tích hợp vì cần DB (không dùng docker). Các phản ví dụ chỉ dựa trên đọc code và tính tay, chưa có script tái hiện.
- Mục 1 thuộc B11 (markNoShow), không thuộc cancellationQuote. Cùng bất biến tiền (phí ≤ giá trị đơn, yêu cầu hoàn ≤ tiền giữ), nhưng có thể bị coi là ngoài phạm vi thẻ.
- Mục 2 phụ thuộc chính sách: có thể xem dòng dịch vụ ghi trước khi khách đến là ca hiếm, hoặc phải hủy tay. Nhưng code không tự hủy dòng đó, cũng không trừ nó khỏi phần hoàn.
- Mục 3 và 5 phụ thuộc cách hiểu 'giá trị đơn' (total_room_vnd + extraPersonFeeVnd hay tổng folio sau giảm giá) và phạm vi BR-402(c). DOM cần chốt.
- Mục 4 là gap Minor cũ, payOut vẫn chặn trần nên tiền không bị chi thừa.

## Critic

# Phản biện lượt kiểm 3 (HEAD 9e9fd64, chỉ đọc)

Tôi tự kiểm lại mọi gap đang ở mức Blocker hoặc Major: đọc code, chạy lại repro DB-free và chạy `vitest run test/upload-gate-socket.test.ts` (5/5 xanh). Các script thử nằm ở scratchpad, repo không bị sửa:
- `.../scratchpad/upleak/leak2.ts`
- `.../scratchpad/otamoney/foc-fee.ts`
- `.../scratchpad/critic/leak2-fixprobe.ts`
- `.../scratchpad/critic/leak2-onsend.ts`

## Kết luận từng mục

| Mục / gap | Kết luận | Lý do (đã tự kiểm) |
|---|---|---|
| **UPLOAD-LEAK**: gap lượt trước (hủy khi đang kiểm phiên hoặc đang đọc thân, trần phiên/IP, cookie gắn route, bắt buộc Content-Length) | ĐÓNG | Có trong `http.ts:191-195`, `:248-252`, `:164`, `:168-173` và `upload-gate.ts:14-16`. Test socket :87/:96/:107/:117/:142 xanh. |
| **UPLOAD-LEAK**: client gửi đủ thân rồi đóng kết nối trước khi api trả lời | **VẪN LÀ BLOCKER** | Tôi chạy lại `leak2.ts`: sau 3 lần hủy, `inFlight = 3` và vẫn giữ nguyên sau 2,5 s; upload hợp lệ nhận 429. Fastify 5.12.7 chỉ chạy `onRequestAbort` khi `req.aborted` đúng (`lib/route.js:579-590`). `onResponse` chỉ chạy khi có `finish` hoặc `error` (`lib/reply.js:1014-1015`). Vì vậy `http.ts:286-287` không bao giờ trả chỗ. Đây là lỗi vận hành thường ngày (Caddy cắt kết nối khi trình duyệt bỏ request, `response_header_timeout 60s`, hoặc khách đóng tab), không cần ai tấn công. Bản thử sửa của tôi cho kết quả 0 chỗ treo và upload 200. |
| UPLOAD-LEAK: thân gửi chậm giữ chỗ khoảng 90 s; 2 IP × 2 phiên khách thật chiếm đủ 4 chỗ | Minor | Kẻ tấn công nay cần 2 phiên khách thật (2 đơn có link) và 2 IP. Câu chú thích ở `upload-gate.ts:7-8` nói quá so với thực tế, cần sửa. Nên giữ 1 chỗ riêng cho route nhân viên; việc này rẻ, làm cùng đợt được. |
| UPLOAD-LEAK: chưa có test 422 cho thân chunked hoặc thiếu Content-Length | Minor | Code `http.ts:168-173` đúng, chỉ thiếu test. |
| **OTA-MONEY**: gap cũ (resync khi sửa/đảo dòng/FOC/B18, không FOC đêm OTA, phạt BR-310, `partyChangeSource`, B16 một yêu cầu hoàn, B16 qua đơn con, backfill 0043) | ĐÓNG | Code và test có tên đúng như verifier liệt kê (ota-prepaid-flow :350/:445/:510/:594; frontdesk-s3-fixes :876/:969/:1018/:1066/:1135). Tôi tính xanh theo lần chạy 2161/2161 của ORC. |
| OTA-MONEY (A): FOC trên dòng phí do OTA thu (`early_departure_fee`, `cancellation_fee`) | **Major (sửa ở Sprint 3)** | Đã tái hiện bằng `moneyPosition` thật: `creditVnd` = 300.000 (phải chi tiền thật); nếu khách chưa trả thì `balanceDueVnd` = 0, mất 300.000 phụ thu. `foc.service.ts:87` chỉ chặn dòng `room`, trong khi `otaCoveredOf` tính trước FOC. Chú thích ở `:204-206` mâu thuẫn với code. Sửa rất rẻ. |
| OTA-MONEY (B): B14 trên lượt có đơn con gia hạn chỉ chuyển đêm của đơn gốc | **Major (sửa ở Sprint 3, tối thiểu phải chặn hoặc báo)** | `stay.service.ts:721` và `:743` chỉ chuyển tới ngày đi của đơn gốc. Đơn con (`in_house`, có đoạn phòng riêng) ở lại căn cũ mà không báo, trái câu BR-424 v0.3.4 bổ sung 17/10: "không bao giờ để đêm đơn con ở căn cũ mà không báo". Hậu quả: căn mới hiện trống các đêm đơn con nên có thể bán trùng, mã cửa đi theo căn cũ, mất chênh lệch giá. Chưa có test (test :691 là đơn Trực tiếp). |
| OTA-MONEY (C): `ota_modification` khi số khách đã bằng số mới | **Major (sửa ở Sprint 3)** | `reservations.service.ts:1109`: `peopleChanged` = false nên `:1191` bỏ qua bước tính lại. API trả 200 nhưng `bookedParty` không đổi, phụ thu 150.000/đêm vẫn còn, khách bị thu hai lần. Luồng thật: khách báo quầy trước, rồi sửa đơn trên Agoda. Sửa 3–5 dòng. |
| OTA-MONEY (D): hủy hoặc no-show đơn OTA sau khi khách đã trả phụ thu tại quầy trước ngày đến | Major (hoãn sang Sprint 4) | Tiền không mất: folio vẫn `open`, `refunds.service.ts:152` chỉ chặn `hold`, nên hoàn tay được. Cùng lớp lỗi với khoản `charge` trên đơn Trực tiếp bị hủy. Cần một nguồn "Cần chú ý" chung cho tiền dư trên folio của đơn đã đóng; DOM chốt. |
| OTA-MONEY (E): B7/B7a không tính lại phụ thu từng đêm khi định mức căn đổi | Major (hoãn sang Sprint 4) | Lỗi có từ trước, áp cho mọi kênh, ngoài phạm vi thẻ. B7a chỉ dùng khi xử lý overbooking. Cần DOM chốt: giữ phụ thu đã thỏa thuận (giống D-8) hay tính lại. |
| OTA-MONEY: `otaPenaltyVnd` không có trần; 0043 sinh mã từ 12 ký tự hex của uuidv7 | Minor | Chưa có dữ liệu thật. Sửa 0043 trước khi staging nhận dữ liệu. |
| **REFUND-CANCEL**: gap cũ B10 (cơ sở = cọc − yêu cầu đang mở, trần theo giá trị đơn) | ĐÓNG | Code `reservations.service.ts:2566-2579`, `folio.service.ts:513-535`. Test `payments-s3.test.ts:2659` phủ bậc 0 % và 50 %, kiểm `asked ≤ creditVnd`. |
| REFUND-CANCEL #1: B11 no-show giữ toàn bộ `depositPaid` | **Major (sửa ở Sprint 3)** | `:3214` và `:3247`: không trừ yêu cầu hoàn đang mở, không trần theo giá trị đơn. Cùng bất biến với B10 vừa sửa. Cọc vượt bị giữ âm thầm thành phí no-show, và yêu cầu hoàn đang mở không chi được. Dùng lại đúng công thức cơ sở của B10. |
| REFUND-CANCEL #2: yêu cầu hoàn lớn hơn số dư khi folio còn dòng dịch vụ ghi trước ngày đến | Major (hoãn sang Sprint 4) | Có thật (`addFolioLine` không kiểm trạng thái đơn). Nhưng payOut chặn ở mức số dư và báo `max` (`refunds.service.ts:493-498`), nên người duyệt nhìn thấy. Cần DOM chốt cách xử lý dòng dịch vụ chưa dùng khi hủy (tự đảo hay chặn hủy). |
| REFUND-CANCEL #3: "giá trị đơn" lấy từ snapshot (B8 rút đêm, FOC hoặc giảm giá trước ngày đến) | Major (hoãn sang Sprint 4) | Cần cả hai điều kiện hiếm cùng lúc, và bản tính thử (dryRun) hiện phí trước khi hủy. DOM chốt định nghĩa giá trị đơn. Đề xuất: Σ dòng sống của đơn sau FOC và giảm giá. |
| REFUND-CANCEL #4 (khóa folio khi đọc yêu cầu hoàn đang mở) và #5 (B2 nhận `charge` cho đơn ngày tương lai) | Minor | payOut vẫn chặn trần. FE luôn gửi `type: 'deposit'` (`BookingDialog.tsx:404`), nên #5 chỉ xảy ra khi gọi API trực tiếp. |

## Khuyến nghị cổng QC Sprint 3

**Chưa vào cổng QC Sprint 3.** Phải đóng Blocker rò chỗ upload trước, kèm test socket gửi đủ thân. Gom 4 Major nhỏ (OTA (A), (B) mức tối thiểu, (C), REFUND #1) vào cùng một đợt sửa. Sau đó QC xét ĐẠT CÓ ĐIỀU KIỆN, và 4 Major hoãn phải được ghi vào backlog Sprint 4 kèm quyết định DOM.

## Việc giao lại (chỉ Blocker và Major sửa ở Sprint 3)

| Vai | File | Việc |
|---|---|---|
| **BE-C (Blocker)** | `/Users/anhvh/Desktop/hotel-app/product/services/api/src/http.ts` (`createHttpAdapter`), `test/upload-gate-socket.test.ts` | **(1)** Trả chỗ ở hook `onSend`. Tôi đã thử: `onSend` vẫn chạy khi socket đã hủy (`socket.destroyed=true`), và lúc đó handler đã dùng xong thân nên trần bộ nhớ vẫn giữ. Giữ nguyên `onResponse`/`onRequestAbort` vì trả chỗ là idempotent. Có thể thêm `reply.raw.once('close')` làm lưới cuối; bản thử của tôi theo cách này cho `inFlight=0`, upload sau đó 200. **(2)** Test socket mới: handler có trễ 200 ms, gửi đủ thân rồi hủy trước khi handler trả lời, kiểm `uploadsInFlight()=0` và upload kế tiếp nhận 200. Thêm biến thể `trustProxy` + 2 IP × 2 phiên. **(3)** Sửa câu chú thích ở `upload-gate.ts:7-8`. Không bắt buộc nhưng nên làm: giữ 1 chỗ cho route nhân viên, thêm test 422 khi thiếu Content-Length. |
| **BE-B** | `src/modules/folio/internal/foc.service.ts:87`, `:204-206` | Mở rộng chặn `FOC_NOT_ALLOWED_OTA_PREPAID` cho mọi dòng thuộc `OTA_COVERED` (room, early_departure_fee, cancellation_fee, no_show_fee) của đơn có khoản thu `ota_system`. Sửa chú thích. Test: B16 OTA có `otaRetainedVnd` và phụ thu đã thu tại quầy, FOC trên dòng phí → 422, `creditVnd` vẫn 0. |
| **BE-B** | `src/modules/reservations/internal/reservations.service.ts:3214`, `:3247` (B11) | Tính `kept = min(max(0, depositPaid − openRefunds), bookingValue)` bằng cách tách hàm chung với `cancellationQuote`. Test dùng dữ liệu của :2659 (cọc = giá trị đơn + 500k, yêu cầu 500k đang mở): no-show → `no_show_fee` = giá trị đơn, và yêu cầu 500k chi được (payOut 200). |
| **BE-A** | `src/modules/frontdesk/internal/stay.service.ts` (`changeRoom` :688-1027) | Theo BR-424 bổ sung 17/10. Bản đầy đủ: chuyển cả lượt (đoạn phòng + đêm của đơn con, kiểm trống tới ngày đi hiệu lực, giá đêm đơn con theo BR-424). Nếu không kịp, **tối thiểu** khi có đơn con `in_house` thì dryRun và lệnh thật đều trả lỗi hoặc cảnh báo kèm danh sách đêm đơn con, lễ tân phải chọn trước khi lưu. Không bao giờ âm thầm để đêm đơn con ở căn cũ. Test: OTA 203 01–03 + đơn con 03–05, B14 ngày 02 sang 401. |
| **BE-A** | `src/modules/reservations/internal/reservations.service.ts:1109`, `:1191` | `partySource === 'ota_modification'` trước nhận phòng thì luôn tính lại khi `bookedParty ≠ next`, kể cả lúc `peopleChanged` = false. Test: `guest_direct` 2→3 (150k/đêm), sau đó `ota_modification` 3 kèm ref → phụ thu về 0, `bookedParty` = 3. |
| **QA** | `rounds/round-02/qa` | Sau đợt sửa: chạy lại test socket, CI api + E2E trên commit mới. Bổ sung oracle cho 4 Major trên. |
| **DOM** (cho các Major hoãn) | `product/docs/business-rules.md` | Chốt 4 điểm: (D) tiền dư trên folio của đơn đã hủy/no-show (nguồn "Cần chú ý"); (E) B7/B7a giữ hay tính lại phụ thu người; REFUND #2 dòng dịch vụ ghi trước ngày đến khi hủy; REFUND #3 định nghĩa "giá trị đơn". |