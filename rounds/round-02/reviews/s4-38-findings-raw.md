# S4-38 – phát hiện thô của 5 skeptic (commit 08dabd3)

Trích nguyên văn kết quả có cấu trúc của workflow `wf_ff22b199-27c` (ORC 17/10/2026). Báo cáo phân xử: `s4-money-verification.md` (critic). Test tái hiện nằm trong worktree cố định `scratchpad/s438/wt/product/services/api/test/s438/`.

## S438-MOVE-01 – P1 – swapRoom (K12) không tính lại phụ thu người theo quy tắc đổi căn do OTTIMO, cũng không lưu định mức bảo vệ
- BR: BR-429 v0.3.4 (phụ thu người khi đổi căn do OTTIMO = min), BR-429 (b1) (b2) v0.3.8, BR-429 (d1), BR-110, OpenAPI swapRoom: "Mỗi đơn là B7"
- Kịch bản: Đơn A: Trực tiếp căn 202 (định mức 2), 3 người lớn, 23–25/11/2027 (2 đêm thường), phụ thu 2 × 150.000 = 300.000. Đơn B: Trực tiếp căn 302 (định mức 3), 3 người lớn, cùng ngày, phụ thu 0. Gọi POST /reservations/{A}/actions/swap-room với B. Server ghi change_reason_code = 'other', tức tính như OTTIMO đổi. Hợp đồng swapRoom ghi rõ: "Mỗi đơn là B7". Sau đó PATCH đơn B: adults 2 rồi 3.
- Mong đợi: Áp BR-429 v0.3.4 và (b1), (b2) v0.3.8: OTTIMO đổi căn thì phụ thu mỗi đêm = min(phụ thu đang ghi, phụ thu theo định mức bảo vệ). Định mức bảo vệ = max(định mức cũ, định mức mới), lưu theo đêm. (1) Đơn A sang 302: min(150.000, phụ thu ở định mức max(2,3) = 3 là 0) = 0 mỗi đêm. Phụ thu 300.000 → 0, folio A từ 1.884.000 còn 1.584.000 (−300.000). Đổi số tiền như vậy thì phải có bản tính thử và tick (BR-429 (d1)). (2) Đơn B sang 202: phụ thu 0, lưu định mức bảo vệ 3. Sửa 3 → 2 → 3 người lớn thì tính từ định mức bảo vệ, phụ thu vẫn 0 (giống BR-429-08 kịch bản sự cố).
- Thực tế: Chạy trên PostgreSQL thật. swap-room trả 200. Đơn A: phụ thu vẫn 300.000, tổng folio vẫn 1.884.000 (2 × 792.000 + 300.000), stay_night.extra_person_fee không đổi, không có resync folio. Khách bị thu thừa 300.000. Đơn B: extra_person_base = NULL. Sau PATCH 2 → 3 người lớn, phụ thu = 300.000 (2 × 150.000), mong đợi 0.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/move/move-adversarial.test.ts -t "T16" (số thật: scratchpad/s438/move/final.jsonl dòng T16)`
- Mã nghi: product/services/api/src/modules/reservations/internal/reservations.service.ts swapRoom (~dòng 3656–3750): chỉ chạy UPDATE stay_night SET room_id. Không gọi MovePlanner.planBooking (cause 'ottimo'), không ghi extra_person_fee/base, không gọi money.resynced.
- Hồi quy: False

## S438-MOVE-02 – P1 – swapRoom không ghi origin_room_id: đơn OTA bị OTTIMO đổi chéo căn, sau đó khách xin đổi căn thì chênh lệch tính theo căn bị đổi tới
- BR: BR-424 v0.3.5/v0.3.8 (căn gốc), BR-429 (c), BR-424-06 (cùng bản chất, luồng swap)
- Kịch bản: Đơn Agoda 203, 30/11–02/12/2027 (2 đêm thường, tiền OTA 1.600.000). OTTIMO swap-room với một đơn Trực tiếp ở 101. Sau đó trước ngày đến, khách nhờ OTTIMO đổi sang 401: xem trước rồi ghi, lý do guest_request.
- Mong đợi: BR-424 v0.3.8: căn gốc = căn gán đầu tiên (203); OTTIMO đổi căn vì mọi lý do khác guest_request đều không đổi căn gốc. BR-429 (c): chênh mỗi đêm = max(0, giá Trực tiếp 401 − giá Trực tiếp 203) = 1.042.000 − 792.000 = 250.000; 2 đêm = 500.000 thu tại quầy. origin_room_id = 203.
- Thực tế: Ngay sau swap, origin_room_id = NULL. B7 lấy căn của đoạn hiện tại (101) làm căn gốc. Dòng room_change_difference = 375.000/đêm (1.042.000 − 667.000), tổng 750.000. Xem trước cũng ra 750.000 (khớp lệnh ghi). origin_room_id được ghi = 101. Khách bị thu thừa 250.000.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/move/move-adversarial.test.ts -t "T17"`
- Mã nghi: reservations.service.ts swapRoom không chạy UPDATE reservation SET origin_room_id = COALESCE(origin_room_id, <căn trước swap>). move-planner.ts MovePlanner.originRoom() lấy căn của đoạn đầu tiên hiện tại khi origin_room_id rỗng.
- Hồi quy: False

## S438-MOVE-03 – P1 – Khôi phục no-show (B12) vào căn khác không ghi origin_room_id: chênh lệch OTA về sau tính theo căn mới
- BR: BR-424 v0.3.8 (căn gốc), BR-429 (c), BR-315 (g)
- Kịch bản: Đơn Agoda 203, 18–20/01/2028 (2 đêm thường, 1.600.000). 23:30 ngày 18/01 mark-no-show. MGR gọi restore-no-show với roomId = 101 (OTTIMO chọn căn). Sau đó khách nhờ đổi sang 401 (B7 guest_request, xem trước rồi ghi).
- Mong đợi: BR-424 v0.3.8: căn gốc là căn gán đầu tiên (203), OTTIMO đổi căn không đổi căn gốc. BR-315 (g): khôi phục giữ giá. Chênh = (1.042.000 − 792.000) × 2 = 500.000.
- Thực tế: restore trả 200 và chuyển đoạn sang 101 (change_reason_code 'overbooking') nhưng không ghi origin_room_id. B7 sang 401 ra room_change_difference 375.000 × 2 = 750.000, origin_room_id = 101. Thu thừa 250.000. Xem trước = lệnh ghi = 750.000.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/move/move-adversarial.test.ts -t "T22"`
- Mã nghi: reservations.service.ts restoreNoShow, nhánh roomId !== seg.room_id (~dòng 3936–3946): đổi reservation_segment.room_id nhưng không ghi origin_room_id = COALESCE(origin_room_id, seg.room_id cũ).
- Hồi quy: False

## S438-MOVE-04 – P1 – 500 khi gán căn cho đơn đã khôi phục no-show vào làn chưa gán: assign-room và move đều bị 23505 room_occupancy_segment_uk
- BR: BR-315 (g)(b), BR-312 / B7a, BR-429 (b) (gán căn do OTTIMO)
- Kịch bản: Đơn Agoda 203, 15–17/02/2028. 23:30 ngày 15/02 mark-no-show. Căn 203 bán lại cho đơn Trực tiếp 16–17/02. MGR gọi restore-no-show với allowUnassigned = true: trả 200, conflictState open, đơn vào làn chưa gán. Lễ tân gán căn theo BR-315 (g)(b): assign-room roomId = 201, resolution reassigned_same_group. Thử thêm cách khác: actions/move với overbookingResolution.
- Mong đợi: BR-315 (g)(b): đơn vào làn chưa gán, lễ tân gán căn bằng B7a; giá giữ nguyên, phụ thu theo BR-429 (gán căn do OTTIMO). Kết quả 200, gán được căn, sau đó thu tiền và nhận phòng bình thường.
- Thực tế: assign-room trả 500 INTERNAL_ERROR (log: PostgresError 23505 constraint=room_occupancy_segment_uk). move với overbookingResolution cũng trả 500. Sau khi restore, bảng room_occupancy vẫn còn một dòng của segment (room 203, active=false). Lệnh claim INSERT thêm dòng thứ hai nên vi phạm unique. Đơn kẹt ở làn chưa gán, không có cách gán căn nào nên không nhận phòng và không thu được tiền. Ca có sẵn reservations-fix.test.ts BR-315-04/05 chỉ dừng ở bước restore.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/move/move-adversarial.test.ts -t "T22b" (dòng T22b-occ trong final.jsonl: occ = [{room 203, active false}], mv = [500, INTERNAL_ERROR])`
- Mã nghi: reservations.service.ts restoreNoShow, nhánh unassigned (~dòng 3948–3965): chỉ đặt reservation_segment.room_id = NULL, không xóa và không tái dùng dòng room_occupancy cũ. assignRoom (~3588) và move (~3135) gọi occupancy.claim (INSERT) thay vì update dòng sẵn có.
- Hồi quy: False

## S438-MOVE-05 – P1 – Giá đêm sửa tay (S4-35) không được tính lại bậc BR-107 khi B7 đổi ngày làm qua mốc 7 đêm: lệch ±70.000 một đêm
- BR: BR-429 (g) v0.3.6, BR-107 (đổi số đêm), S4-35 (setNightRate: giá nhập là giá lịch)
- Kịch bản: (a) Trực tiếp 202, 7 đêm 25/10–01/11/2027 (−10%). Lễ tân sửa giá đêm 26/10 qua adjustFolioLine, giá nhập 700.000 (giá lịch). Server ghi gross 630.000, calendar 700.000. Khách xin rút còn 6 đêm (đi 31/10), guest_request, xem trước rồi ghi. (b) Trực tiếp 202, 6 đêm 15–21/11/2027. Sửa giá đêm 16/11 thành 700.000 (gross 700.000). Khách xin thêm 1 đêm (đi 22/11), thành 7 đêm.
- Mong đợi: BR-429 (g) v0.3.6: khi tính lại bậc BR-107, giá sửa tay giữ nguyên với nghĩa là giá lịch của đêm, bậc BR-107 áp trên đó. BR-107: bậc áp lại cho mọi đêm còn hiệu lực trên giá lịch đã chốt. (a) 6 đêm, bậc 0%: đêm 26/10 = 700.000. Tổng = 3 × 792.000 + 700.000 + 2 × 911.000 = 4.898.000. (b) 7 đêm, −10%: đêm 16/11 = 700.000 × 0,9 = 630.000. Tổng = 4 × 713.000 + 630.000 + 2 × 820.000 = 5.122.000.
- Thực tế: (a) Đêm 26/10 vẫn gross 630.000, calendar 700.000, trong khi đơn đã ở bậc 0%. Tổng 4.828.000 (thu thiếu 70.000). Xem trước −294.000 = lệnh ghi −294.000. (b) Đêm 16/11 vẫn 700.000 (không được giảm 10%). Tổng 5.192.000 (thu thừa 70.000). Xem trước +294.000 = lệnh ghi. Xem trước khớp lệnh ghi; chỗ lệch là quy tắc. Dữ liệu stay_night tự mâu thuẫn: calendar 700.000, gross 630.000 ở bậc 0%.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/move/move-adversarial.test.ts -t "T12"`
- Mã nghi: move-planner.ts planBooking: `else if (retier && !manual && n)` bỏ qua đêm manual. reservations.service.ts retierStay: `n.manual || !tiered ? {...n}`. Đây là quyết định ARC-BE-S3-24.3 từ thời S3 ("never re-tiered"), mâu thuẫn với S4-35, nơi giá nhập là giá lịch và gross = giá × (1 − bậc). Cần DOM xác nhận câu "tính lại BR-107 … giữ giá sửa tay" ở decision-log 17/10: giữ giá lịch đã nhập hay giữ gross.
- Hồi quy: False

## S438-MOVE-06 – P3 – B14 vẫn lưu khi expectedDeltaVnd gửi kèm lệch số tính lúc ghi nếu chênh = 0 (tương tự DOM-S4-19 nhưng ở B14)
- BR: BR-429 (d2) v0.3.8 (DOM-S4-19), OpenAPI changeRoom.applyDifference
- Kịch bản: Đơn Trực tiếp 202 đang ở, 28–30/09/2027. Ngày 29/09 gọi change-room sang 203, cause property_fault (chênh lúc ghi = 0), gửi kèm applyDifference = true và expectedDeltaVnd = 119.000. Tình huống thật: Desk đã báo khách một con số theo bản tính thử cũ, rồi dữ liệu đổi khiến chênh về 0.
- Mong đợi: Theo nguyên tắc BR-429 (d2) v0.3.8 (DOM-S4-19): bên gọi đã gửi expectedDeltaVnd thì số đó phải khớp, lệch thì 409 SURCHARGE_CHANGED và không lưu, vì khách đã nghe một con số. (d2) nằm trong BR-429 (B7/B8). Mô tả changeRoom trong hợp đồng chỉ ghi "lệch → 409" khi chênh ≠ 0. Cần DOM xác nhận phạm vi cho B14.
- Thực tế: 200: đổi phòng được lưu. Server bỏ qua expectedDeltaVnd khi chênh = 0. Khách không mất tiền (có lợi cho khách) nhưng số đã báo khách khác số lưu.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/move/move-adversarial.test.ts -t "T8"`
- Mã nghi: frontdesk/internal/stay.service.ts changeRoom: chỉ so expectedDelta khi `delta !== 0`; move() của B7 có thêm nhánh else so số gửi kèm.
- Hồi quy: False

### Coverage (21 mục) / Gaps
- ✓ Cách chạy: PostgreSQL thật, DB ottimo_test_s438_move tạo mới, cây cố định 08dabd3. Tệp test: product/services/api/test/s438/move/move-adversarial.test.ts. Lượt cuối: 27 ca, 21 xanh, 6 đỏ, đúng bằng các phát hiện ở trên. Số thật nằm ở scratchpad/s438/move/final.jsonl và final.log.
- ✓ T1 B7 khách xin đổi cùng lúc ngày và căn: 202 (03–06/08) → 302 (04–07/08). FOC 792.000 trên đêm bỏ 03/08 chuyển sang đêm thêm 06/08 (thứ Sáu, 1.055.000) theo BR-434 (2). Đêm mới 917.000 / 917.000 / 1.055.000. Xem trước +513.000 = folio đổi thật +513.000. Tổng 2.097.000. Đúng.
- ✓ T2 B7 property_fault 202 → 401 kèm thêm 1 đêm (6 → 7 đêm, DOM-S4-01 (b1) + BR-107): đêm giữ tính lại bậc trên giá lịch đã chốt, đêm thêm lấy lịch căn cũ 792.000 × 0,9. Kết quả 713.000 × 5 + 820.000 × 2 = 5.205.000. Chênh +215.000 = thật. Đúng.
- ✓ T3 3 người lớn ở 202. Nâng hạng lên 302: −300.000. Sự cố chuyển 203: 0, lưu định mức bảo vệ 3. Khách thêm 1 đêm: +792.000, phụ thu đêm thêm 0 theo định mức bảo vệ (b2). Khách xin về 202: +450.000, mất bảo vệ, phụ thu 150.000 × 3. Mọi bước xem trước = thật. Đúng.
- ✓ T4 B14 Agoda 203 + đơn con B13 2 đêm, khách xin 401 cả lượt: đơn gốc chênh 250.000 (1 đêm); đêm đơn con 792.000 → 1.042.000 × 2. Xem trước 750.000 = thật 750.000. Đúng BR-424.
- ✓ T5 B14 Agoda 203 → 401 → 302 trong cùng ngày: +500.000, rồi −250.000 (đảo 500.000, ghi 125.000 × 2). Không cộng dồn. Đúng BR-424-04 / S4-05.
- ✓ T6 B14 Trực tiếp 202 7 đêm (−10%), khách xin 401 từ 15/09: 938.000 × 3 + 1.078.000 × 2. Chênh +1.191.000 = thật. Đúng.
- ✓ T7 B14 3 người lớn: sự cố 202 → 302, phụ thu −300.000 (min); khách xin 302 → 202, +300.000 (giá lịch 202). Xem trước = thật. Đúng.
- ✓ T9 B7 401 có FOC 1.042.000, khách xin xuống 101 (S4-04 ở B7): FOC = 667.000, chênh −375.000 = thật, tổng 667.000. Đúng.
- ✓ T10 báo giá 101 có OTTIMO-BACK5, 6 đêm 3.994.000. Thêm 1 đêm: −10% thắng 5%, không cộng dồn → 600.000 / 690.000, tổng 4.380.000 (+386.000). Rút lại 6 đêm: 634.000 / 729.000, tổng 3.994.000 (−386.000). Đúng DOM-S4-03 (a1).
- ✓ T11 báo giá 202 7 đêm 5.205.000, rút còn 6 đêm: 4.990.000 (−215.000), không giảm hai lần. Đúng DOM-S4-04.
- ✓ T13 B7 Agoda 203: sự cố → 101, rồi khách xin 401. Chênh 250.000 × 2 so với 203. Đúng BR-424-06 ở B7.
- ✓ T14 3 người lớn 202, FOC 150.000 trên phụ thu ngày 18/10. Khách xin 302: +100.000, FOC ngủ. Khách xin về 202: −100.000, FOC khôi phục 150.000, tổng 1.734.000. Đúng.
- ✓ T15 B14 Agoda 203 + đơn con, until_parent_departure, khách xin 401: chênh 250.000 × 2 chỉ trên đêm đơn gốc, đêm đơn con giữ nguyên căn và giá. Xem trước 500.000 = thật. Đúng S4-09.
- ✓ T18 B14 Agoda: sự cố 203 → 101 (ngày 2), khách xin 401 (ngày 3): chênh 250.000/đêm so với 203. Đúng BR-424-06.
- ✓ T19 đơn CTV 101 hai đêm: hoa hồng 8% × 1.334.000 = 106.720. Khách xin 401 (2.084.000): hoa hồng 166.720, cộng theo đêm cũng 166.720. Đúng BR-429 (f), BR-903.
- ✓ T20 B14 có FOC 792.000 đang chờ duyệt, khách xin 302: FOC chờ không vào chênh (+250.000 = thật). Duyệt xong FOC 792.000, tổng 1.834.000. Đúng BR-434 S4-18 ở B14.
- ✓ T21 báo giá BACK5 đang ở, B14 khách xin 401: 1.042.000 × 0,95 = 990.000/đêm, chênh +712.000 = thật. Đúng DOM-S4-03 ở B14.
- ✓ T23 B14 sự cố 202 → 203, phụ thu đêm 25/01 đã sửa tay còn 100.000: giữ 100.000, chênh 0. Đúng DOM-S4-02 ở B14.
- ✓ T24 BR-424-02 ở B14: 3 người lớn 202 → 302 cho 2 đêm còn lại, tiền phòng +250.000, phụ thu −300.000, folio −50.000 = thật. Oracle này vẫn còn ghi pendingFix FB-R2-DOM-BE-16 nhưng mã đã đúng, QA nên bỏ cờ.
- ✓ T26 đơn Agoda chưa gán căn, B7a nâng hạng lên 401, sau đó khách xin 302: chênh 125.000/đêm so với căn đã đặt 203. Đúng BR-424 v0.3.8 (gán kiểu nâng hạng thì căn gốc là căn đã đặt).
- ◻ Căn gốc ở B7a sau khi khôi phục no-show vào làn chưa gán: chưa chạy được vì 500 (S438-MOVE-04). Đọc mã MovePlanner.originRoom thì đoán căn gốc sẽ thành căn vừa gán (201), chênh 334.000 thay vì 250.000. Chưa kiểm thật.
- ◻ Phụ thu người khi MGR khôi phục no-show vào căn khác định mức (BR-315 hay BR-429 min?): chưa thử, BR chưa nói rõ.
- ◻ Đua đồng thời: xem trước B7/B14 ‖ duyệt FOC hoặc ‖ swap, và 409 SURCHARGE_CHANGED lặp lại do đua: chưa chạy. Không tìm được đường nào làm hàm tính thử khác lệnh ghi khi dữ liệu không đổi.
- ◻ Đơn con B13 dài ≥ 7 đêm (bậc BR-107 riêng của đơn con) khi B14 khách xin: chưa thử.
- ◻ Đêm B9a nhận sớm (đơn con / đêm sửa tay) kết hợp B14 hoặc B7: chưa thử.
- ◻ B14 đơn OTA có phụ thu 'khách báo trực tiếp' (guest_direct) khi sự cố đổi căn khác định mức: chỉ BE-A có ca B7, B14 chưa thử.
- ◻ Phí kênh OTA (channel_fee) sau B14 có room_change_difference: chưa đọc số. Theo mã, nền chỉ gồm giá OTA của đêm.
- ◻ Hoa hồng nhân viên sale 3% sau B7/B14: chưa thử, mới thử CTV 8%.
- ◻ Bản tính thử B14 không có room_change_difference từng đêm và không có cảnh báo MANUAL_RATE_REPRICED: chỉ là hiển thị, không ghi thành phát hiện.
- ◻ Giá gõ tay lúc tạo đơn (nightlyRates) ≥ 7 đêm không áp bậc BR-107: ngoài phạm vi đổi căn/ngày, chưa kiểm.
- ◻ Hợp đồng ghi swapRoom cho đơn đang ở là B14 nhưng mã chỉ nhận đơn confirmed: chưa thử.

## S438-PAY-01 – P1 – B9a đơn Trực tiếp vượt ngưỡng 7 đêm: amountDueAtCheckinVnd và trần QR check_in (xem trước) lớn hơn số B9a thật sự để lại, nên QR thu thừa tiền khách
- BR: BR-107, BR-417, BR-402, OpenAPI 0.3.7 CheckInPreview.amountDueAtCheckinVnd, S4-10
- Kịch bản: Đơn Trực tiếp căn 101, 6 đêm 22–28/11/2026 (CN–T6, theo lịch giá: 5 × 667.000 + T6 767.000 = 4.102.000), cọc 30% = 1.200.000, còn 2.902.000. Khách tới 04:30 ngày 22/11 (cửa sổ B9a, thêm đêm 21/11). Lễ tân mở check-in-preview, tạo QR purpose=check_in addPriorNight=true priorNightRateVnd=667.000 (mặc định) đúng số xem trước, xác nhận đã nhận rồi bấm B9a không kèm payment. Ca A2: căn 201 (708.000), cùng ngày, trả checkIn.payment đúng số xem trước.
- Mong đợi: BR-107 (D-8; decision-log 17/10 DOM S3-1: 'thêm đêm (B13, B9a) vẫn tính lại bậc') và OpenAPI 0.3.7 CheckInPreview.amountDueAtCheckinVnd ('là trần của checkIn.payment và createVietQr purpose=check_in'). Sau B9a có 7 đêm nên −10% cho các đêm giữ: 5 × round(667.000 × 0,9) = 5 × 600.000, cộng T6 round(767.000 × 0,9) = 690.000, được 3.690.000. Cộng đêm B9a 667.000 (giá mã đang ghi) ra tổng 4.357.000. Số phải thu khi nhận phòng = 4.357.000 − 1.200.000 = 3.157.000. Vậy xem trước và trần QR phải là 3.157.000. Ca 201: 4.626.000 − 1.300.000 = 3.326.000.
- Thực tế: Chạy trên PostgreSQL thật. Preview amountDueAtCheckinVnd = 3.569.000 (= 2.902.000 + 667.000), QR check_in max = 3.569.000. B9a ghi xong tổng 4.357.000. Đi đường QR: QR 3.569.000 được tạo, xác nhận, rồi B9a trả 200 nhưng folio thừa 412.000 (khách trả dư, phải qua luồng hoàn BR-522 do quản lý duyệt). Đi đường checkIn.payment = số xem trước: 422 AMOUNT_EXCEEDS_BALANCE, max 3.157.000. Ca 201: xem trước 3.762.000, server trả max 3.326.000 (lệch 436.000).
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/pay/b9a-due.test.ts (ca A, A2). Chạy: bash .../s438/newdb.sh ottimo_test_s438_pay && bash .../s438/pay/run.sh test/s438/pay/b9a-due.test.ts`
- Mã nghi: product/services/api/src/modules/frontdesk/internal/checkin.service.ts evaluate(): toPost = early.amountVnd + priorNight.defaultRateVnd. Hàm này không mô phỏng retierStay/writeRepricedNights mà addPriorNight() sẽ ghi, trong khi checkout.service.ts extraNightDelta() có làm. amountDueForQr() dùng lại cùng số này.
- Hồi quy: False

## S438-PAY-02 – P2 – B9a đơn Trực tiếp có người vượt định mức: xem trước và trần QR check_in thiếu phụ thu người BR-110 của đêm thêm, trả đúng số xem trước bị 409
- BR: BR-417, BR-110, BR-305, BR-402, S4-10
- Kịch bản: Đơn Trực tiếp căn 102 (giá đêm 750.000, định mức 2), 3 người lớn, 10–12/11/2026: 2 × 750.000 + 2 × 150.000 = 1.800.000. Cọc 30% × 1.500.000 = 450.000, làm tròn 500.000, còn 1.300.000. Khách tới 04:30 ngày 10/11 (B9a, đêm 09/11). Lễ tân đọc preview, tạo QR check_in, rồi nhận phòng trả đúng số xem trước.
- Mong đợi: BR-417 (2): thêm 1 đêm vào đầu đơn. BR-110: phụ thu người tính từng đêm. BR-305: phụ thu người thu khi nhận phòng. Hợp đồng 0.3.7: xem trước = trần checkIn.payment và QR. Số phải thu = 1.300.000 + 750.000 + 150.000 = 2.200.000.
- Thực tế: Preview amountDueAtCheckinVnd = 2.050.000, QR check_in max = 2.050.000. Trả 2.050.000 thì B9a trả 409 CHECKIN_CONDITIONS_NOT_MET balance_paid, balanceDueVnd 150.000. Lệnh ghi đúng: thêm dòng extra_person 09/11 150.000, tổng 2.700.000. Không thu sai tiền vì bị chặn, nhưng số gợi ý thu và trần QR lệch lệnh ghi; QR theo số xem trước phải thu thêm lần hai.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/pay/b9a-due.test.ts (ca B)`
- Mã nghi: checkin.service.ts evaluate(): toPost chỉ cộng priorNight.defaultRateVnd, không cộng phí BR-110 của đêm thêm mà writeRepricedNights ghi khi các đêm mang phí riêng. checkout.service.ts extraNightDelta() có cộng nightExtra(...).feeVnd.
- Hồi quy: False

## S438-PAY-03 – P1 – S4-35: đêm sửa giá (setNightRate) không được tính lại bậc BR-107 khi số đêm đổi (B13 gia hạn, B7 rút ngắn)
- BR: BR-107, BR-429 (g), S4-35, BR-106
- Kịch bản: S1: đơn Trực tiếp 101, 6 đêm 22–28/11/2026 (4.102.000). Quản lý adjustFolioLine đêm 23/11 newUnitPriceVnd = 600.000 (giá lịch, bậc 0 nên ghi 600.000, tổng 4.035.000). Khách nhận phòng, ngày 26/11 B13 +1 đêm giá mặc định, thành 7 đêm. S2: đơn Trực tiếp 202, 7 đêm 9–16/11 (5.205.000, BR-107-01). Sửa đêm 10/11 = 700.000 (giá lịch, ghi 630.000 vì bậc 10%). Trước ngày đến, khách xin dời còn 9–14/11 (B7, 5 đêm, bậc 0), move-preview rồi move với số đã hiện.
- Mong đợi: BR-107: bậc tính lại theo tổng số đêm cuối và áp cho mọi đêm còn hiệu lực trên giá lịch đã chốt. BR-429 (g) v0.3.6: 'tính lại bậc BR-107 … giá sửa tay giữ nguyên (là giá lịch của đêm, bậc BR-107 áp trên đó)'; stay-night-pricing.ts cũng ghi calendar_rate_vnd = giá nhập. S1: 23/11 = 600.000 × 0,9 = 540.000; tổng = 540.000 + 4 × 600.000 + T6 690.000 + T7 mới 690.000 = 4.320.000. S2: 10/11 = 700.000 (hết bậc); tổng = 3 × 792.000 + 700.000 + T6 911.000 = 3.987.000.
- Thực tế: S1: đêm 23/11 giữ gross 600.000 (calendar 600.000), tổng 4.380.000, thu thừa 60.000. extension-options repricedTotalVnd cũng 4.380.000. S2: đêm 10/11 giữ gross 630.000 (calendar 700.000), tổng 3.917.000, thu thiếu 70.000. move-preview folioDeltaVnd −1.205.000 khớp lệnh ghi nhưng sai BR.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/pay/night-rate.test.ts (ca S1, S2)`
- Mã nghi: product/services/api/src/modules/reservations/internal/reservations.service.ts retierStay(): `n.manual || !tiered ? { ...n }` giữ amountVnd (gross theo bậc cũ) thay vì discountedNight(n.calendarVnd, tier mới, ret, unit) cho đêm manual. setNightRate đã lưu calendar_rate_vnd = giá nhập nên đủ dữ liệu. Đường B7 (move-planner) giữ gross tương tự. Cần DOM chốt 'giữ giá sửa tay' = giữ giá lịch (theo câu trong ngoặc của BR-429 (g)).
- Hồi quy: False

## S438-PAY-04 – P1 – Đêm thêm khi trả phòng sau 18:00 (B18 extraNight) và đêm B9a không nhận bậc BR-107 khi lượt ở thành ≥ 7 đêm: cùng một đêm, gia hạn B13 giá 777.000, B18 giá 863.000
- BR: BR-107, BR-107-04, BR-416, BR-421, BR-417, S4-47
- Kịch bản: N1: hai đơn Trực tiếp giống nhau, căn 102 và 103 (750.000), 6 đêm 22–28/11/2026 (CN–T6), đã nhận phòng. Đơn X: ngày 27/11 B13 +1 đêm (giá mặc định), rồi trả phòng bình thường. Đơn Y: khách rời 19:00 ngày 28/11, B18 'trả phòng – tính thêm 1 đêm' với extraNight.rateVnd = extraNightDefaultRateVnd (863.000) và finalPayment = amountDueAtCheckoutVnd. N2: đơn 101, 6 đêm 22–28/11, B9a 04:30 ngày 22/11 với priorNightRateVnd mặc định 667.000.
- Mong đợi: BR-416 v0.3.4: đêm thêm của ngày đi giá theo BR-421 (như gia hạn). BR-107: gia hạn hoặc nhận trước 06:00 tính lại bậc cho mọi đêm, đêm mới lấy giá lịch rồi áp bậc (BR-107-04: đêm mới 820.000/713.000 cũng giảm). BR-417 (2): đêm B9a giá = giá đêm của đơn. N1: đêm 28/11 (T7) = round(750.000 × 1,15) = 863.000, × 0,9 = 776.700, làm tròn 777.000. Đơn Y phải bằng đơn X: tổng 4.929.000. N2: đêm 21/11 = 667.000 × 0,9 = 600.300, làm tròn 600.000; tổng 4.290.000, phải thu khi nhận phòng 3.090.000.
- Thực tế: N1: đơn X đêm 28/11 = 777.000, tổng 4.929.000. Đơn Y đêm 28/11 = 863.000, tổng 5.015.000: khách rời sau 18:00 trả thừa 86.000 so với gia hạn cùng đêm. N2: đêm 21/11 ghi 667.000 (không bậc), tổng 4.357.000. Trả 3.090.000 thì 409 balance_paid thiếu 67.000. Trong B13, nếu lễ tân nhập đúng giá mặc định qua nightlyRates thì đêm cũng thành manual và mất bậc: cùng một đêm, giá phụ thuộc việc có gõ số hay không.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/pay/added-night-tier.test.ts (ca N1, N2)`
- Mã nghi: checkout.service.ts addExtraNight() và extraNightDelta(), checkin.service.ts addPriorNight(), stay.service.ts extend() (nightlyRates nhập tay) đều truyền `{ ..., manual: true }` vào retierStay, nên đêm thêm bỏ qua bậc. extraNightDefaultRateVnd và priorNight.defaultRateVnd là giá trước bậc. Cần DOM chốt giá lễ tân nhập ở B18/B9a là giá trước bậc hay giá cuối, vì hiện B13 không nhập giá thì có bậc.
- Hồi quy: False

### Coverage (24 mục) / Gaps
- ✓ Chạy lại test BE trên DB riêng ottimo_test_s438_pay: checkin-payment, checkout-due, vietqr-stay-step, move-pricing, reservation-list – 44/44 xanh. Gồm BR-402-01 (1.500.000 / 1.710.000 / 1.610.000 / từ chối còn 210.000 / duyệt 0 / thừa 210.000), nhánh 202 + payment → 422 NOT_ALLOWED, BR-402-02 (500.000 / 1.542.000), S4-47, QR check_in 1.710.000.
- ✓ C3 (checkin-money.test.ts): 102, 3 người lớn, FOC chờ 150.000 trên phụ thu người đêm 17/11. Còn phải thu 1.300.000 nhưng xem trước và điều kiện là 1.150.000; thu 1.150.000 thì nhận phòng được; từ chối FOC thì còn 150.000. Đúng BR-402 v0.3.6.
- ✓ C4: 103, giảm giá đặc biệt chờ 100.000 trên đêm phòng. Vẫn phải thu đủ 1.000.000; trả 900.000 thì 409. Đúng BR-402.
- ✓ C5: quản lý tự áp FOC 210.000 trên phụ thu nhận sớm 11:00 (BR-402-01 managerSelfApply): yêu cầu approved ngay, thu 1.500.000, số dư 0/0.
- ✓ C5b: lễ tân trưởng xin FOC 210.000 lúc tự nhận phòng: pending (không tự duyệt, BR-432), thu 1.500.000 nhận được, còn 210.000.
- ✓ C6: lễ tân, buồng VD → 202 → lễ tân trưởng duyệt → nhận phòng với approvalRequestId + payment đủ → 200, số dư 0.
- ✓ C7: Agoda trả trước 203 nhận 11:00 thứ Ba: phụ thu 30% × 792.000 = 238.000 (BR-415). amountDueAtCheckinVnd 0, nhận phòng không thu (DOM-S4-05), còn 238.000 tới trả phòng.
- ✓ C8: Agoda 203 → 401 khách xin (+500.000) + nhận 11:00: phải thu 500.000, phụ thu 313.000 chờ; QR check_in max 500.000; thu 499.000 → 409, 500.000 → 200, còn 313.000.
- ✓ LS1/LS2 (long-stay.test.ts), BR-413 dài hạn 11.130.000 (371.000/đêm): nhận 08:00 căn trống đêm trước → 0; căn có khách trả cùng ngày → 186.000. Trả 15:00 → 0; 16:00 → 186.000; căn có khách đến, trả 13:00 → 111.000.
- ✓ K1 (checkout-money.test.ts): B15 15:00 (225.000) FOC 225.000 duyệt, rời 17:00 (375.000). FOC = min → summary 150.000 = B18, finalPayment +1 → 422. Bill.settledAt = 2026-11-19T17:00:00.000+07:00.
- ✓ K2: căn có khách đến cùng ngày, rời 12:20 → 225.000 (BR-412-09); K3: Agoda 203, đêm cuối thứ Sáu, 13:00 → 30% × 911.000 = 273.000 (BR-415); summary = B18 = 273.000.
- ✓ K4: rời 01:00 ngày 04/12 (ngày nghiệp vụ = ngày đi 03/12): một thao tác thêm đêm 708.000, summary = B18, tổng 2.124.000 (BR-416-02/03).
- ✓ K5: B15 17:00 (402, 500.000) FOC 300.000 duyệt, rời 19:00: đêm thêm 1.000.000 = summary = B18; FOC → cancelled khi chốt (trả hạn mức BR-433).
- ✓ K6: trả trước phụ thu 17:00 479.000 (301), rời 13:00 (287.000): summary 0, B18 422 OVERPAYMENT_HANDLING_REQUIRED unhandled 192.000.
- ✓ K7: B15 15:00 FOC 200.000 duyệt → B13 +1 đêm (giờ hẹn bị xóa, FOC ngủ) → B18 13:00 ngày đi mới 200.000. FOC khôi phục applied, khách chỉ trả đêm thêm 667.000 (BR-412 v0.3.5).
- ✓ L1 (list-qr.test.ts), BUG-R2-078: balanceDueVnd trên danh sách = getReservation = folio. Đơn cọc 934.000, OTA có phụ thu 238.000, đơn trả thừa 0.
- ✓ L2: QR check_out 19:00 (402, đêm thêm) max 1.000.000 = summary; xác nhận xong B18 không thu thêm → 0/0 (S4-10).
- ✓ L3: trả thừa 300.000 → B18 refund_request → đúng một yêu cầu hoàn 300.000 pending, unhandled 0 (BR-522).
- ✓ S3 (night-rate.test.ts): Agoda trả trước, quản lý sửa giá đêm (S4-35) → 'Đã thu qua OTA' đồng bộ trong cùng giao dịch, số dư 0/0 (BR-307).
- ✓ S4: sửa phụ thu người đêm 1 thành 100.000 → tổng giảm 50.000; xem trước nhận phòng = số dư.
- ✓ S5: sửa phụ thu 100.000, rồi PATCH số người 3 → 2 → 3 → phụ thu tính lại 150.000/đêm, tổng 1.800.000 (BR-429 (b2) v0.3.8).
- ✓ D1 (deposit-qr.test.ts): hold 202, 7 đêm, 3 người lớn: cọc 1.600.000 (không gồm phụ thu 1.050.000, BR-305-02); QR cọc max 1.600.000, sau 600.000 → max 1.000.000.
- ✓ P1/P2 (payment-input.test.ts): checkIn.payment 0, âm, lẻ, ota_collect, deposit, refund → 422, không ghi gì; vietqr ghi tay → reconciliation pending (BR-527); finalPayment lẻ, 1e20, chuỗi → 422.
- ✓ B13 không nhập giá (S1, N1): extension-options repricing deltaVnd = lệnh ghi (345.000).
- ◻ Đua chưa thử: check-in kèm payment ‖ duyệt FOC; B18 ‖ B15; xác nhận QR ‖ B9 trên cùng folio; adjustFolioLine ‖ duyệt FOC đêm.
- ◻ QR check_in đang pending mà lễ tân thu tiền mặt ở B9, sau đó QR vẫn được xác nhận → khách trả hai lần. confirm-received không kiểm số dư. BR không nói rõ nên chưa báo.
- ◻ B16 trả phòng sớm (BR-428 hoàn 50%, phụ thu người OTA): chỉ đọc mã, chưa chạy.
- ◻ OTA trả tại chỗ (không ota_prepaid); B9a đơn OTA có người vượt định mức (phụ thu người của đơn con Trực tiếp tính là khoản phát sinh hay tiền phòng – BR chưa rõ).
- ◻ Bậc 13 → 14 đêm (−15%) khi B9a/B18/B13; đơn CTV: hoa hồng sau S4-35 (giới hạn đã biết E4).
- ◻ Đơn tạo lúc đặt có giá nhập tay (nightlyRates) 7 đêm không có −10% (4.900.000 thay vì 4.410.000): đã thấy khi dò nhưng không báo vì BR chưa có ví dụ cho giá thỏa thuận lúc đặt; cùng gốc với S438-PAY-03/04, nên để DOM chốt chung.
- ◻ Phần preview của S438-PAY-01 trên đơn đã ≥ 7 đêm (không vượt bậc) là nhất quán; chưa thử đơn ≥ 14 đêm.
- ◻ Chưa chạy E2E/UI (FE gửi số xem trước vào payment/QR).

## S438-CANCEL-01 – P1 – Cọc yêu cầu (deposit_required_vnd) đóng băng lúc tạo đơn: sau B7/B8, phí hủy và phí no-show tính trên cọc cũ, sai cả hai chiều
- BR: BR-305, BR-309 (v0.3.8, cơ sở phí = min(cọc đã thu, cọc yêu cầu của đơn – BR-305, giá trị đơn)), BR-311 (cùng cơ sở), BR-311-03, BR-309-10
- Kịch bản: Mọi ca chạy qua HTTP trên PostgreSQL thật, DB ottimo_test_s438_cancel. Không phải ca đỉnh điểm (đã tránh ngày đặc biệt).
(X6) Đơn 202, 22–24/2/2027 (2 đêm, 1.584.000), cọc 500.000. B8 khách xin kéo dài thành 22/2–1/3 (7 đêm, 5.205.000). Khách nộp thêm cọc 1.100.000 (tổng 1.600.000). Hủy 20/2 (còn 2 ngày, không hoàn).
(X6b) Đơn 203, 7 đêm 22/2–1/3/2027, đã cọc 1.600.000. B8 rút còn 2 đêm (1.584.000). Hủy 20/2 (2 ngày).
(X6c) Đơn 102, 7 đêm 8–15/3/2027, cọc 1.600.000 (cọc yêu cầu lúc tạo 1.500.000). B8 rút còn 2 đêm (1.500.000). Đánh dấu no-show 23:30 ngày 8/3.
(Z4) Đơn 401, 1–3/3/2027, cọc 700.000 (cọc yêu cầu 600.000), FOC 100 % đêm 1. B7 khách xin đổi sang 101 (2 × 667.000). Hủy 27/2 (2 ngày).
- Mong đợi: Cọc yêu cầu theo BR-305 = 30 % tiền phòng hiện tại của đơn, làm tròn 100.000. Phí = min(cọc đã thu, cọc yêu cầu, giá trị đơn).
- X6: cọc yêu cầu = 30 % × 5.205.000 = 1.561.500 → 1.600.000 (đúng ví dụ BR-305). Phí = min(1.600.000; 1.600.000; 5.205.000) = 1.600.000, hoàn 0.
- X6b: cọc yêu cầu = 30 % × 1.584.000 = 475.200 → 500.000. Phí = min(1.600.000; 500.000; 1.584.000) = 500.000, tự tạo yêu cầu hoàn 1.100.000.
- X6c: cọc yêu cầu = 30 % × 1.500.000 = 450.000 → 500.000. Giữ 500.000, hoàn 1.100.000.
- Z4: cọc yêu cầu = 30 % × 1.334.000 = 400.200 → 400.000. Phí = min(700.000; 400.000; giá trị 667.000) = 400.000, hoàn 300.000.
- Thực tế: Reservation.depositRequiredVnd không đổi sau B7/B8: X6 vẫn 500.000 cho đơn 7 đêm 5.205.000, depositShortfall = null nên Desk không đòi thêm cọc. X6b vẫn 1.600.000 cho đơn 2 đêm.
- X6: phí 500.000, yêu cầu hoàn 1.100.000. OTTIMO mất 1.100.000.
- X6b: phí 1.584.000 (bằng cả giá trị đơn), hoàn 16.000. Khách bị thu thừa 1.084.000.
- X6c: no_show_fee 1.500.000, hoàn 100.000. Khách bị giữ thừa 1.000.000.
- Z4: phí 600.000, hoàn 100.000. Khách bị thu thừa 200.000.
Thử (dryRun) và ghi ra cùng số sai.
- Test tái hiện: `Thư mục thử: /private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/cancel/
- a1-cancel-money.test.ts: các ca X6, X6b, X6c.
- a3-tiers-sod.test.ts: ca Z4.
Chạy: source scratchpad/s438/cancel/env.sh; cd …/api; pnpm exec vitest run test/s438/cancel/a1-cancel-money.test.ts -t "X6"
Số quan sát được ghi ở scratchpad/s438/cancel/obs.log.`
- Mã nghi: - product/services/api/src/modules/reservations/internal/reservations.service.ts, retainableDeposit (~dòng 2787–2803): base = min(paid, row.deposit_required_vnd). Hàm này dùng chung cho B10 và B11.
- deposit_required_vnd chỉ được ghi lúc tạo đơn. Nhánh áp B7/B8 (~dòng 2429: UPDATE total_room_vnd + pricing_snapshot) không tính lại.
Cần DOM xác nhận "cọc yêu cầu của đơn" đi theo tiền phòng sau B7/B8. Nếu DOM chọn giữ cọc cũ thì X6b/X6c/Z4 vẫn trái ý BR-305 (cọc lớn hơn cả 30 % đơn).
- Hồi quy: False

## S438-CANCEL-02 – P1 – Cờ đêm cao điểm (pricing_snapshot.hasPeakNight) đóng băng lúc tạo: đơn dời sang Giỗ Tổ vẫn được hoàn 100 % cọc
- BR: BR-309 (Ngày cao điểm không hoàn = đơn có ít nhất 1 đêm rơi vào ngày đặc biệt – BR-104), BR-309-08, BR-104
- Kịch bản: (X1) Đơn trực tiếp 202, 5–7/4/2027 (ngày thường), cọc 500.000. B8 khách xin dời sang 15–17/4/2027. Đêm 16/4 là Giỗ Tổ (special_dates). Xem trước có tính phụ thu đặc biệt +238.000; tiền phòng 1.584.000 → 1.822.000. Hủy 10:00 ngày 1/4/2027 (14 ngày trước ngày đến).
(X1b, chiều ngược) Đơn 203, 15–17/4/2027 (có Giỗ Tổ), cọc 600.000 (cọc yêu cầu 500.000). B8 dời sang 5–7/4/2027. Hủy 25/3 (11 ngày).
- Mong đợi: X1: đơn có đêm 16/4 nên không hoàn sau khi cọc → phí hủy 500.000, không có yêu cầu hoàn (giống BR-309-08: 14 ngày vẫn không hoàn).
X1b: đọc theo chữ BR thì đơn không còn đêm cao điểm, 11 ≥ 7 ngày → hoàn 100 %: phí 0, hoàn 600.000. Có thể DOM cố ý giữ "không hoàn" để chặn lách luật – cần DOM quyết.
- Thực tế: X1: phí 0, tự tạo yêu cầu hoàn 500.000 (dryRun cũng 500.000). OTTIMO mất toàn bộ cọc.
X1b: phí 500.000, hoàn 100.000 (vẫn áp "cao điểm" dù đơn không còn đêm đặc biệt).
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/cancel/a1-cancel-money.test.ts, ca X1 và X1b.
Chạy: pnpm exec vitest run test/s438/cancel/a1-cancel-money.test.ts -t "X1"`
- Mã nghi: - reservations.service.ts, cancellationQuote (~dòng 2756–2771): peakNoRefund = … && !!snap.hasPeakNight.
- hasPeakNight chỉ được ghi ở pricing.service.ts snapshot() và sales-port.adapter.ts lúc tạo. Các UPDATE pricing_snapshot của B7/B8 (~2429, ~3354, ~3431) không cập nhật nó.
- Cách sửa gợi ý: tính lại từ các đêm sống lúc hủy (special_dates của ngày đêm).
- Hồi quy: False

## S438-CANCEL-03 – P2 – B12 khôi phục no-show không dọn yêu cầu hoàn tự tạo (S4-06) và mục "Cần chú ý" closed_reservation_credit
- BR: BR-522 v0.3.8 (yêu cầu chờ duyệt vượt dư thừa tự hủy; mục tiền dư đơn đã đóng tự đóng khi dư thừa về 0), BR-315 (f), BR-311-03
- Kịch bản: (X3) Đơn trực tiếp 201, 20–22/11/2026, tổng 1.628.000, cọc yêu cầu 500.000, khách chuyển 800.000. 23:30 ngày 20/11 đánh dấu no-show: no_show_fee 500.000, tự tạo yêu cầu hoàn 300.000 (pending), mở closed_reservation_credit. 01:30 ngày 21/11 FD tự khôi phục (B12).
(Y11) Biến thể OTA: Agoda 202→301 do khách xin, khách trả chênh lệch 332.000 tại quầy. No-show tạo yêu cầu hoàn 332.000. MGR khôi phục → chênh lệch được ghi lại.
- Mong đợi: Sau B12, folio còn phải thu 828.000, dư thừa 0 (X3) hoặc 0 (Y11). Theo BR-522 v0.3.8:
- yêu cầu hoàn chờ duyệt lớn hơn dư thừa (300.000 > 0) phải tự hủy và báo người tạo;
- mục closed_reservation_credit phải đóng vì dư thừa đã về 0 (và đơn không còn ở trạng thái đã đóng).
- Thực tế: X3: sau B12 yêu cầu hoàn 300.000 vẫn pending, closed_reservation_credit vẫn mở (resolved_at null). MGR vẫn duyệt được (200). Lệnh chi tiền mặt bị chặn 422 REFUND_EXCEEDS_APPROVED max 0, nên tiền không ra – không mất tiền.
Y11: yêu cầu 332.000 vẫn pending, mục chú ý vẫn mở.
Hàng duyệt của MGR và "Cần chú ý" hiện khoản hoàn ảo. RefundsService.payOut chỉ đóng mục khi đơn đang cancelled/no_show, nên mục này không bao giờ tự đóng.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/cancel/
- a1-cancel-money.test.ts, ca X3.
- a2-ota-refund.test.ts, ca Y11.`
- Mã nghi: - reservations.service.ts, restoreNoShow (~dòng 3873–4011): chỉ gọi money.resynced; không chạy refundPlan/closeStayCredit, không resolveAttention.
- payments/internal/refunds.service.ts, payOut (~dòng 633–651): chỉ đóng mục khi status ∈ {cancelled, no_show}.
- Hồi quy: False

## S438-CANCEL-04 – P2 – Hủy thử (dryRun) và hủy thật trả refundRequestVnd khác nhau khi đã có yêu cầu hoàn mở đủ số
- BR: BR-522-05 (b), OpenAPI CancellationQuote.refundRequestVnd (0.3.7 D1: số của yêu cầu hoàn tự tạo; 0 → không tạo yêu cầu), M2 xem trước = lệnh ghi
- Kịch bản: (X2, oracle BR-522-05 b) Đơn 202, 10–13/11/2026 (2.376.000), cọc yêu cầu 700.000, khách chuyển 1.000.000. Lễ tân đã tạo yêu cầu hoàn 300.000 (pending). Hủy 08/11 (2 ngày): gọi thử rồi lưu.
(Y6) Như trên nhưng yêu cầu 300.000 đã được duyệt, chưa chi. Đơn 20–23/12/2026, hủy 18/12.
- Mong đợi: Phí 700.000, dư thừa 300.000 = yêu cầu đang mở, không tạo yêu cầu mới. Lần thử và lần lưu cùng một số: refundRequestVnd = 0 ở cả hai (không tạo yêu cầu).
- Thực tế: Tiền đúng: phí 700.000, không tạo yêu cầu mới, vẫn chỉ một yêu cầu.
Nhưng dryRun refundRequestVnd = 0, còn lần lưu refundRequestVnd = 300.000 kèm refundApprovalRequestId của yêu cầu cũ (Y6 cũng vậy).
Hậu quả: Desk hiện "không tạo yêu cầu hoàn" lúc xem thử nhưng "đã tạo yêu cầu hoàn 300.000" sau khi lưu.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/cancel/
- a1-cancel-money.test.ts, ca X2.
- a2-ota-refund.test.ts, ca Y6 (số trong obs.log).`
- Mã nghi: - reservations.service.ts cancel() ~dòng 2711: quote.refundRequestVnd = refund.amountVnd.
- Trong khi FolioService.closeStayCredit (~dòng 2574–2583) trả về "yêu cầu đang mở" khi không tạo mới.
- Hồi quy: False

## S438-CANCEL-05 – P3 – otaPenaltyChannelFeeVnd không có trần: phí kênh 5.000.000 trên tiền phạt 100.000 vẫn được nhận
- BR: BR-310 (phí kênh trên tiền phạt = số thực tế của kênh), BR-901, S4-37 (cùng tinh thần chặn gõ nhầm)
- Kịch bản: (Y12) Agoda trả trước 101, 22–24/3/2027, 1.400.000. Hủy 10/3 với otaPenaltyVnd = 100.000 và otaPenaltyChannelFeeVnd = 5.000.000 (gõ thừa số 0).
- Mong đợi: Phí kênh thực tế không thể vượt tiền phạt kênh giữ (≤ 100.000). Nên trả 422 VALUE_OUT_OF_RANGE như trần S4-37 của otaPenaltyVnd.
- Thực tế: Trả 200. channel_fee: base 100.000, amount_actual_vnd 5.000.000 (chi phí kênh gấp 50 lần doanh thu phạt) – sai báo cáo phí kênh/DATA. Tiền khách không đổi.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/cancel/a2-ota-refund.test.ts, ca Y12.`
- Mã nghi: reservations.service.ts cancel() ~dòng 2558–2561: chỉ kiểm otaPenaltyChannelFeeVnd có đi kèm tiền phạt, không kiểm ≤ otaPenaltyVnd.
- Hồi quy: False

### Coverage (21 mục) / Gaps
- ✓ X4 – giá trị đơn làm trần phí (BR-309 v0.3.8): 203, 2 đêm × 792.000, cọc 500.000, FOC 792.000 + 600.000 → giá trị 192.000. Hủy trước 2 ngày: phí 192.000, hoàn 308.000, thử = ghi. Hai FOC cancelled (reservation_cancelled). Đúng.
- ✓ X5 – S4-06/S4-08 no-show: 102, đón sân bay 300.000 ngày đến đã trả tại quầy, không giữ → đảo. no_show_fee 500.000, tự tạo một yêu cầu hoàn 300.000, credit 300.000. Đúng.
- ✓ X7 – BR-315 (c)(g): MGR khôi phục no-show sang 401 (đắt hơn). Đêm giữ giá snapshot 867.000 × 2; FOC 200.000 quay lại applied. Đúng.
- ✓ Y1 – S4-37: Agoda 203 1.600.000 dời (khách xin) sang 401. total_room_vnd vẫn 1.600.000; chênh lệch 500.000 là dòng riêng; ota_collect 1.600.000. Phạt 1.600.001 → 422 VALUE_OUT_OF_RANGE; phạt 1.600.000 → 200. Đúng (trần không cộng phụ thu người hay chênh lệch).
- ✓ Y2 – BR-310 + S4-06: Agoda trả trước 302 1.800.000, đón sân bay 300.000 trả tại quầy. Hủy với phạt 900.000: dòng phí 900.000, ota_collect 900.000, dịch vụ tự đảo (performed=false), yêu cầu hoàn 300.000, còn phải thu 0. Thử = ghi = 300.000.
- ✓ Y3 – OTA trả tại chỗ, đã trả 500.000 tại quầy. Phạt 900.000 → còn phải thu 400.000, không yêu cầu hoàn, không ota_collect. Phạt 300.000 → hoàn 200.000, thử = ghi.
- ✓ Y4 – BR-303 (3)/BR-308: giữ chỗ (báo giá → create-hold) cọc một phần 200.000 (cọc yêu cầu 400.000) bị hủy → phí 0, yêu cầu hoàn 200.000, thử = ghi.
- ✓ Y5 – S4-08/DOM-S4-15: dịch vụ 300.000 có FOC 100.000, lễ tân giữ khi hủy. Khách chịu 300.000, FOC cancelled. Phí 500.000, đã trả 700.000 → còn phải thu 100.000, không yêu cầu hoàn. serviceRetainedVnd thử = ghi = 300.000.
- ✓ Y6 – BR-522 / S4-06 D7: yêu cầu 300.000 đã duyệt chưa chi, hủy trước 2 ngày → phí 700.000, không tạo yêu cầu thứ hai. Chi 100.000 → mục chú ý vẫn mở. Chi 200.001 → 422. Chi 200.000 → mục tự đóng. refund_ready gửi 3 người (người tạo + FD/FDL, S4-42).
- ✓ Y7 – #6: hai MGR duyệt cùng lúc với cùng expectedVersion → một 200, một 409 INVALID_TRANSITION; không 500; trạng thái approved version 2.
- ✓ Y8 – S4-22 / BR-315 (b)(g): 103, 07–09/1/2027, FOC 300.000 đêm 1. No-show → suspended. MGR khôi phục 07:00 hôm sau → applied. Đêm 750.000 + 863.000 − 300.000 = 1.313.000.
- ✓ Y9 – BR-315 (c)(g): căn bị bán lại đêm 2 → MGR khôi phục vào làn chưa gán (roomId null, conflict open). FOC 300.000 đêm 1 applied, tổng 1.116.000.
- ✓ Y10 – S4-08 D5: markNoShow với retainLines trỏ dòng phòng → 422 NOT_IN_LIST, đơn vẫn confirmed, không ghi gì.
- ✓ Y11 (phần hủy) – DOM-S4-13 + S4-06: Agoda 203→401, khách trả chênh lệch 500.000 tại quầy, hủy phạt 0 → chênh lệch đảo, hoàn 500.000, thử = ghi. Bản no-show: B12 ghi lại chênh lệch 332.000.
- ✓ Z1 – BR-309/BR-011 qua API, đến 22/3/2027, cọc 700.000. 15/3 → phí 0. 16/3 05:00 (ngày nghiệp vụ 15/3) → phí 0. 16/3 → 350.000. 19/3 → 350.000. 20/3 → phí = min(700.000, cọc yêu cầu 600.000) = 600.000, hoàn 100.000. Tất cả đúng.
- ✓ Z2 – BR-310/BR-901: phí kênh Agoda 18 % trên tiền phạt 900.000 = 162.000; số thực tế 120.000 được ưu tiên; no-show OTA → base phí kênh 0.
- ✓ Z3 – BR-522 tách quyền trên yêu cầu tự tạo: MGR hủy → yêu cầu do MGR tạo. MGR tự duyệt 403 SELF_APPROVAL_FORBIDDEN; MGR2 duyệt 200; MGR tự chi 403 SELF_REFUND_FORBIDDEN; FD chi tiền mặt 201; mục chú ý tự đóng.
- ✓ Z4 (phần S4-01) – FOC 100 % đêm 401 rồi B7 khách xin sang 101: 200, FOC = 667.000 (giá mới), stay_night.discount_vnd 667.000, không đêm âm. Chênh lệch xem trước −375.000 = chênh lệch folio. Hủy → FOC cancelled.
- ✓ R1 – đua B10 ‖ MGR duyệt yêu cầu hoàn chờ (BR-522-05 c), 5 vòng: không 500/40P01. Duyệt luôn thắng; yêu cầu approved 700.000 còn lại, không có pending vượt dư thừa.
- ✓ R2 – đua B10 ‖ chi tiền mặt của yêu cầu đã duyệt, 4 vòng: một vòng 409 CONCURRENT_UPDATE, còn lại 201. Bất biến "tổng yêu cầu mở = credit" đúng mọi vòng (vd 1.484.000; 1.316.000).
- ✓ R3 – đua B10 ‖ B11 cùng version, 4 vòng: hủy 200, no-show 412 VERSION_CONFLICT. Chỉ một dòng phí, một yêu cầu hoàn.
- ◻ Hoa hồng CTV/nhân viên khi hủy/no-show và base hoa hồng sau B8 (S4-03): tenant thử không có user CTV/SAL nên chưa dựng đơn có hoa hồng.
- ◻ Hạn mức tháng BR-433 khi FOC suspended rồi khôi phục: chỉ kiểm foc_state, chưa đọc số hạn mức còn lại của người duyệt.
- ◻ DOM-S4-12 với no-show: API markNoShow không có tính thử nên không đọc được performed qua HTTP; BE-B đã kiểm bằng gọi trực tiếp.
- ◻ Chi hoàn chuyển khoản/original_method cho yêu cầu tự tạo (OWN tự duyệt và chi); chặn chi khi cọc chuyển khoản chưa đối soát (D4).
- ◻ Đua B10 ‖ duyệt ở thứ tự ngược (hủy thắng trước): 5 vòng R1 đều do duyệt thắng.
- ◻ Đua duyệt FOC ‖ B10/B11 (A2/A3): BE-B đã có test S4-13, chưa thử lại.
- ◻ Chế độ postpone_instead_of_cancel và force_majeure rồi hủy: có thể dính cùng gốc với S438-CANCEL-01/02, chưa chạy.
- ◻ CTV/SAL hủy giữ chỗ có cọc (yêu cầu hoàn do CTV/SAL tạo).
- ◻ B12 sau khi yêu cầu hoàn tự tạo đã được chi; no-show lần hai sau B12.
- ◻ Phí no-show khi chỉ có FOC trên phụ thu người (extra_person) đang dormant.

## S438-FOC-01 – P1 – Đếm lại minibar (recordMinibarCheck) làm mất FOC trên dòng minibar: FOC ngủ rồi bị hủy khi chốt folio, khách trả đủ tiền minibar đã được miễn
- BR: BR-434, BR-436, BR-433, BR-702
- Kịch bản: Đơn Trực tiếp căn 201 (708.000), 16→17/11/2026, đã nhận phòng. 17/11 09:00 lễ tân ghi minibar 2 lon bia = 70.000; lễ tân tự áp FOC 35.000 (BR-436, xác thực mật khẩu) → approved/applied, tổng folio 743.000, còn thu 35.000. Lễ tân ghi minibar lần nữa với CÙNG số đếm (đúng hành vi Desk H16 bước 1, BUG-R2-095: mỗi lần qua bước 1 gọi recordMinibarCheck). Rồi B18 11:00. Biến thể 2: FDL duyệt FOC 70.000 trên 2 lon bia, đếm lại còn 1 lon (35.000). Đối chứng: adjustFolioLine newQuantity 1 trên cùng dòng → FOC đi theo đúng 35.000 (chỉ đường đếm lại bị lỗi).
- Mong đợi: BR-434 (v0.3.4/v0.3.8) FOC đi theo dòng được tính lại: áp = min(số đã duyệt, giá trị dòng mới); chỉ 'dòng bị đảo không có bản thay (đếm lại minibar còn 0)' mới ngủ. Ca 1: min(35.000, 70.000) = 35.000 → minibar ròng 35.000, folio 743.000, amountDueAtCheckoutVnd 35.000, FOC applied sau B18. Ca 2: min(70.000, 35.000) = 35.000 → khách trả 0 tiền minibar, folio 792.000.
- Thực tế: PostgreSQL thật: ca 1 sau đếm lại focState=dormant, effectiveAmountVnd=0, tổng 778.000, còn thu 70.000; checkout-summary amountDueAtCheckoutVnd=70.000; sau B18 focState=cancelled (settled_while_dormant), audit approval.self_applied → folio.foc_dormant → folio.foc_cancelled; khách trả minibar 70.000 (dư 35.000). Ca 2: focState=dormant, tổng 827.000, còn thu 35.000 (dư 35.000). Hiện Desk chưa có nút FOC minibar (S4-25 chưa gộp) nên là đường API; khi S4-25 vào Desk thì luồng thường gặp (H16 bước 1 luôn ghi lại) → nguy cơ P0.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/foc/foc-attack.test.ts -t "A7-minibar" (đối chứng: -t "contrast"); DB ottimo_test_s438_foc`
- Mã nghi: src/modules/inventory/internal/minibar.service.ts record(): reverseLine (đồng bộ FOC → dormant) rồi postLines dòng minibar mới KHÔNG có relatedLineId, không gọi syncReductions (nghi vấn A7 của BE-B); LineIndex.keyLine kiểu 'line' (folio.service.ts) chỉ đi theo chuỗi related_line_id; FolioService.settle → cancelDormantOnSettle hủy FOC. Kèm BUG-R2-095 (ghi lại cả khi số đếm không đổi).
- Hồi quy: False

## S438-FOC-02 – P1 – B18 'trả phòng – tính thêm 1 đêm' khi có FOC trên đêm bị tính lại bậc BR-107: amountDueAtCheckoutVnd (xem trước, trần QR check_out) thấp hơn số lệnh ghi cần 100.000 → B18 409 BALANCE_DUE
- BR: BR-107, BR-416, BR-434, S4-47
- Kịch bản: Căn 402 (1.000.000 ngày thường, 1.150.000 T6/T7), đơn Trực tiếp 10→16/11/2026 (6 đêm = 6.300.000), FOC 100% đêm 10/11 = 1.000.000 (MGR duyệt), thu đủ 5.300.000 lúc nhận phòng. 16/11 19:00 GET checkout-summary?checkoutTime=19:00 rồi POST check-out {extraNight.rateVnd = extraNightDefaultRateVnd 1.000.000, finalPayment = amountDueAtCheckoutVnd}.
- Mong đợi: BR-107 (7 đêm −10%, áp lại mọi đêm), BR-416 (đêm thêm như gia hạn, giá lễ tân nhập), BR-434 (FOC = min(1.000.000, 900.000) = 900.000). Đêm: 4×900.000 + 2×1.035.000 + 1.000.000 = 6.670.000; FOC 900.000 → 5.770.000; số cần thu = 5.770.000 − 5.300.000 = 470.000. amountDueAtCheckoutVnd (OpenAPI 0.3.7 S4-47: 'số cần thu nếu hoàn tất B18', trần finalPayment và createVietQr check_out) phải = 470.000.
- Thực tế: amountDueAtCheckoutVnd = 370.000 (chỉ chênh dòng 6.670.000 − 6.300.000, bỏ phần FOC giảm 100.000). B18 với finalPayment 370.000 → 409 BALANCE_DUE balanceDueVnd=100.000. Gọi lại với 470.000 → 200, folio cuối đúng BR (FOC 900.000, tổng 5.770.000). Xem trước ≠ lệnh ghi 100.000; QR check_out bị chặn ở 370.000. (Đọc mã thêm: CheckOutPage.tsx tự tính balance + giá đêm thêm, không dùng số này – lệch còn lớn hơn, phần FE chưa chạy.)
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/foc/foc-attack.test.ts -t "B18-extra-night"`
- Mã nghi: src/modules/frontdesk/internal/checkout.service.ts extraNightDelta(): trả 'after − before + fee' theo dòng đêm, không cộng phần FOC/giảm giá đi theo (FolioService.previewStayReductions oldAppliedVnd/newAppliedVnd); dùng bởi dueAtCheckout → summary.amountDueAtCheckoutVnd và amountDueForQr.
- Hồi quy: False

## S438-FOC-03 – P1 – No-show hủy hẳn (không tạm dừng) FOC trên dòng chênh lệch đổi phòng OTA (room_change_difference, 'đi theo đêm'); B12 ghi lại chênh lệch nhưng FOC không quay lại → khách trả thêm 250.000
- BR: BR-315, BR-309, BR-429, BR-434
- Kịch bản: Agoda căn 203, 13→15/12/2027, otaRoomAmountVnd 1.600.000; B7 khách xin sang 401 → chênh lệch 250.000/đêm × 2 (dòng room_change_difference). MGR duyệt FOC 250.000 trên chênh lệch đêm 13/12 → tổng 1.850.000, còn thu 250.000. 23:30 13/12 đánh dấu no-show; MGR khôi phục (B12).
- Mong đợi: BR-309 v0.3.8: room_change_difference 'đi theo đêm' (đảo cùng đêm, BR-429 (c)); BR-315 (g): FOC đã duyệt của các đêm bị no-show → tạm dừng (suspended), khôi phục → áp lại = min(250.000, 250.000) = 250.000, không duyệt lại. Sau B12: tổng 1.850.000, còn thu 250.000 (như trước no-show).
- Thực tế: Sau no-show focState=cancelled, focCancelReason='reservation_cancelled' (audit folio.foc_cancelled với lý do hủy đơn dù là no-show). B12: chênh lệch được ghi lại 250.000 × 2 nhưng FOC vẫn cancelled → tổng 2.100.000, còn thu 500.000 (khách trả dư 250.000).
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/foc/foc-attack.test.ts -t "BR-315 \(g\) difference"`
- Mã nghi: src/modules/folio/public/folio.service.ts voidReductionKeys phase 'after': mọi FOC không phải khóa đêm có dòng bị đảo → cancelFoc(..., 'reservation_cancelled') kể cả no-show; keyKindOf coi room_change_difference là khóa 'line' (không theo ngày); repostVoidedDifferences chèn dòng mới không related_line_id nên FOC (kể cả nếu suspended) không tìm lại được dòng.
- Hồi quy: False

## S438-FOC-04 – P1 – Khách xin đổi căn lần hai (OTA): repostDifferences đảo + ghi mới chênh lệch không nối dòng → FOC trên chênh lệch ngủ thay vì đi theo; xem trước báo −84.000 nhưng folio tăng +166.000
- BR: BR-434, BR-424, BR-429
- Kịch bản: Agoda căn 203, 20→22/12/2027, 1.600.000; B7 khách xin 401 → chênh lệch 250.000/đêm; FDL duyệt FOC 250.000 trên chênh lệch 20/12 → tổng 1.850.000, còn thu 250.000. Khách xin tiếp sang 402: move-preview rồi move với expectedDeltaVnd = folioDeltaVnd.
- Mong đợi: BR-434 FOC đi theo dòng được tính lại = min(số đã duyệt, dòng mới) = min(250.000, 208.000) = 208.000; chênh lệch mới 208.000 × 2 = 416.000 → tổng 1.600.000 + 416.000 − 208.000 = 1.808.000, còn thu 208.000; folioDeltaVnd xem trước = lệnh ghi = −42.000 (S4-21/M2 xem trước = ghi).
- Thực tế: Chênh lệch mới 208.000 × 2 đúng, nhưng FOC focState=dormant, effectiveAmountVnd=0 → tổng 2.016.000, còn thu 416.000 (khách trả dư 208.000); move-preview folioDeltaVnd = −84.000 trong khi folio thực tế +166.000 (và đúng BR phải −42.000). Nếu sau đó chốt folio, FOC bị hủy settled_while_dormant.
- Test tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/foc/foc-attack.test.ts -t "A7-difference"`
- Mã nghi: src/modules/reservations/internal/money-bridge.ts repostDifferences(): reverseLine (đồng bộ → FOC dormant) + postLines dòng room_change_difference mới không relatedLineId và không đồng bộ lại (cùng họ A7); move-planner/previewStayReductions chỉ tính FOC khóa đêm room/extra_person nên folioDeltaVnd bỏ phần FOC trên chênh lệch.
- Hồi quy: False

### Coverage (19 mục) / Gaps
- ✓ Bộ sẵn có test/integration/foc-keys-s4.test.ts (oracle BR-434-07…12, BR-433-03, BR-412-15…17, BR-315-06, S4-01/03/08/13/37): 21/21 xanh trên DB ottimo_test_s438_foc.
- ✓ BR-412 tại B18 – FOC trả muộn đang ngủ (12:30) rồi khách rời thật 15:00: phụ thu 30% × 750.000 = 225.000, FOC khôi phục 225.000, amountDueAtCheckoutVnd 0 = lệnh ghi, balance 0.
- ✓ BR-412 oracle tại B18 – hẹn 17:00 (50% × 708.000 = 354.000) FOC cả dòng, rời 13:00 → 30% = 212.400 → 212.000, FOC đi theo 212.000, cần thu 0 (xem trước = ghi).
- ✓ Gợi ý B5 – FOC phụ thu người 150.000 ngày 20/1 (302, 4 NL) → 2 NL (ngủ) → B7 dời 02–05/02 → 4 NL: FOC khôi phục ở 03/02 (đêm thứ 2), tổng 3.051.000 = 2.751.000 + 450.000 − 150.000.
- ✓ Gợi ý B8 – FOC trả muộn 225.000 đã duyệt, B13 +1 đêm (ngủ), trả muộn 15:00 ngày đi mới → applied 225.000, không duyệt lại.
- ✓ BR-433 khi chốt folio (S4-23 chia theo thứ tự duyệt): MGR giảm giá đặc biệt 500.000 trước, FDL FOC 300.000 sau trên 401 → đổi sang 101 (667.000) → FOC áp 167.000; hạn mức FDL còn 1.200.000 khi còn sống, sau B18 còn 1.333.000 (tính 167.000 thực áp).
- ✓ BUG-R2-104: FDL duyệt giảm giá đặc biệt 300.000 → 200 approved/applied; 300.001 → 403 APPROVAL_LIMIT_EXCEEDED (định tuyến quản lý ngay từ lúc gửi, không ghi gì).
- ✓ BR-428 + FOC: 4 đêm 201 × 708.000, FOC 100% đêm cuối, báo trước 1 ngày bỏ 2 đêm → cơ sở 708.000 → hoàn 354.000, phí 354.000, FOC cancelled night_removed.
- ✓ BR-428 + S4-23: đêm bỏ có giảm giá 250.000 + FOC 300.000 → ròng 158.000 + 708.000 = 866.000 → hoàn 433.000, phí 433.000.
- ✓ BR-309 giá trị đơn: 401 hai đêm, giảm giá đặc biệt 1.042.000 + FOC 800.000 → giá trị 242.000, phí hủy 242.000, hoàn 358.000 (cọc 600.000), dryRun = ghi.
- ✓ DOM-S4-15 hủy giữ dòng đón 300.000 có FOC 300.000: FOC cancelled, khách chịu 300.000, refundRequestVnd 700.000 = 1.000.000 − 0 − 300.000, dryRun = ghi; hạn mức FDL 1.200.000 → trả lại 1.500.000.
- ✓ DOM-S4-15 no-show giữ dòng đón: FOC suspended (hạn mức FDL về 1.500.000) → B12 lễ tân trực đêm → applied 300.000 (hạn mức 1.200.000), tổng 1.584.000 không đổi.
- ✓ S4-23 ba khoản trên một đêm 401: 250.000/692.000/100.000 → sang 302: 250.000/667.000/0 (khoản 3 ngủ) → về 401: 250.000/692.000/100.000; khách trả 0 suốt; xem trước move = ghi.
- ✓ B14 ví dụ BR-434: 202 đêm 2 FOC 792.000, khách xin 302 (917.000) → FOC 792.000, khách trả 125.000; folioDeltaVnd dryRun 125.000 = lệnh ghi.
- ✓ B14 phụ thu người: 302 4 NL FOC 150.000 đêm 2 → 401 (định mức 4) → phụ thu 0, FOC ngủ; Δ +125.000 = dryRun.
- ✓ BR-315 (b): 103 06–08/12/2027 FOC 300.000 đêm 06/12, no-show, MGR khôi phục 07:00 07/12 (FD bị 202 chuyển duyệt) → 2 × 750.000 − 300.000 = 1.200.000, FOC applied.
- ✓ S4-35 B + BR-429 (g) (E3): FOC 1.042.000 trên đêm 401; sửa giá 900.000 → FOC 900.000; khách xin 302 → 917.000/917.000; về 401 → 1.042.000/1.042.000; xem trước −125.000/+125.000 = ghi.
- ✓ Đối chứng adjustFolioLine newQuantity 2→1 lon bia có FOC 70.000 → FOC đi theo 35.000 (chuỗi bản thay hoạt động).
- ✓ S4-13 đua (Promise.all, PostgreSQL thật, không 5xx, không 40P01, bất biến BR-434 + Σ khoản giảm ≤ dòng): duyệt FOC phụ thu người ‖ PATCH người ×4 (FOC dormant); hai yêu cầu cùng khóa duyệt bởi MGR và OWN ×4 (tổng đêm 0, không âm); duyệt FOC trả muộn ‖ B15 về 12:30 ×3 (dormant); duyệt ‖ sửa giá đêm S4-35 B ×3 (FOC 800.000); duyệt FOC minibar ‖ đếm lại minibar ×3; duyệt FOC đêm ‖ B14 ×2, ‖ B16 ×2 (409 + tự hủy line_removed), ‖ B13 ×2; duyệt FOC dịch vụ ‖ B10 hủy có retainLines ×3 (cả hai thứ tự, không bao giờ áp trên đơn hủy); FD tự áp FOC minibar ‖ MGR duyệt FOC đêm ‖ FDL duyệt FOC minibar khác ×3.
- ◻ S4-25 (trần số xin theo khóa ở requestFocForSurcharge) và bản vá #6 expectedVersion: đã biết/chưa gộp – không thử.
- ◻ B12 (c) căn đã bán lại: MGR gọi restore-no-show trực tiếp nhận 409 ROOM_CONFLICT kèm gợi ý; chưa thử luồng duyệt khôi phục + gán căn ở làn chưa gán để xem FOC giữ nguyên (ca test để it.skip).
- ◻ DOM-S4-15 'chốt folio khi FOC còn suspended': không tìm được đường chốt folio của đơn no-show qua API – chưa chạy.
- ◻ BR-435 / mục Cần chú ý foc_threshold (BE-D, attention-sources.ts) chưa kiểm với FOC ngủ/hủy do lỗi S438-FOC-01.
- ◻ B16 có FOC trên phụ thu người của đêm bỏ + khách còn dư chưa xử lý: đọc mã thấy refund cộng droppedFeesVnd theo giá gộp (trần là unhandledCredit nên tiền không lệch, chỉ extraPersonRefundVnd báo lệch) – chưa chạy.
- ◻ B13 extension-options repricing.deltaVnd với FOC trên đêm bị tính lại bậc (hợp đồng mô tả là chênh tiền phòng gộp) – chưa chạy, không coi là trần thu.
- ◻ FE CheckOutPage.tsx tự tính số cần thu khi có đêm thêm (không dùng amountDueAtCheckoutVnd) – chỉ đọc mã, ngoài phạm vi BE.
- ◻ Gợi ý F2 (duyệt cuối tháng, hủy sang tháng sau → trả lại tháng lúc duyệt), A9 (B10 ‖ chi hoàn tiền mặt), nhóm C otaPenaltyVnd, D3/D4/D7 hoàn tiền – thuộc luồng pay/cancel, không thử.
- ◻ Hoa hồng/phí kênh sau FOC đi theo ở B18 đêm thêm và sau adjustFolioLine (giới hạn E4 đã biết) – chưa đối chiếu số.

## S438-REGR-01 – P1 – Trần QR check_in và số Desk hiện ở B9a lớn hơn số B9 thật thu khi folio có tiền thừa và lễ tân gõ giá đêm B9a cao hơn giá mặc định
- BR: BR-402, BR-417, BR-522, OpenAPI 0.3.7 createVietQr purpose=check_in, CheckInPreview.amountDueAtCheckinVnd, S4-10
- Kịch bản: Đơn Trực tiếp căn 202, 2 đêm 08–10/12/2026, 792.000/đêm. Khách đã trả đủ 1.584.000. MGR duyệt FOC 100% cả 2 đêm, folio còn tiền thừa 1.584.000. Khách đến 04:30 ngày 08/12 (cửa sổ B9a, priorNight.defaultRateVnd = 792.000), lễ tân gõ priorNightRateVnd = 1.000.000. Gọi POST /folios/{id}/vietqr với purpose=check_in, addPriorNight=true, priorNightRateVnd=1.000.000. Sau đó xác nhận QR rồi chạy B9.
- Mong đợi: BR-402 v0.3.6/v0.3.8 (điều kiện (2) xét sau khi ghi đêm B9a) và OpenAPI 0.3.7 createVietQr.purpose=check_in: trần = số phải thu để nhận phòng theo priorNightRateVnd gửi kèm = max(0, còn phải thu − tiền thừa + giá đêm B9a − FOC chờ trên khoản phát sinh) = max(0, 0 − 1.584.000 + 1.000.000) = 0. Không được tạo QR thu tiền. Sau B9 folio còn thừa 1.584.000 − 1.000.000 = 584.000.
- Thực tế: Chạy trên PostgreSQL thật. Trần QR (max) = 208.000. QR 208.000 được tạo (201) và xác nhận (200). Sau B9 folio thừa 792.000 thay vì 584.000, tức khách bị thu 208.000 không nợ. Ca không dùng QR: preview amountDueAtCheckinVnd = 0; Desk theo hợp đồng sẽ cộng chênh (1.000.000 − 792.000) = 208.000; nhưng B9 với payment 208.000 trả 422 AMOUNT_EXCEEDS_BALANCE, max = 0. Vậy QR và xem trước khác lệnh ghi.
- Test tái hiện: `cd .../scratchpad/s438/wt/product/services/api && bash ../../../../newdb.sh ottimo_test_s438_regr && source ../../../../regr/env.sh && pnpm exec vitest run test/s438/regr/money-regr.test.ts -t "B9a"  (2 ca: '(B) B9a QR cap = what B9 really charges…' và '(B) same B9a case, no QR…'). Tệp: /private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/regr/money-regr.test.ts`
- Mã nghi: product/services/api/src/modules/frontdesk/internal/checkin.service.ts:185 `Math.max(0, e.amountDueAtCheckinVnd - e.priorNight.defaultRateVnd + rate)` đổi giá đêm B9a trên một số đã bị kẹp về 0 ở dòng 286 `Math.max(0, balanceDueVnd - creditVnd + toPost - notYetDue)`. Cần tính số chưa kẹp với `rate` rồi mới kẹp. Mô tả OpenAPI CheckInPreview.amountDueAtCheckinVnd (openapi.yaml ~dòng 10183: 'client cộng chênh') có cùng lỗi phía Desk.
- Hồi quy: False

## S438-REGR-02 – P1 – origin_room_id không được ghi khi OTTIMO đổi căn bằng B12 (khôi phục no-show sang căn khác) hoặc swap-room, và dòng cũ trước 0059 cũng NULL; fallback lấy căn đã đổi nên chênh lệch OTA tính sai căn gốc
- BR: BR-424, BR-424-06, BR-429 (c), BR-315, migration 0059
- Kịch bản: Đơn Booking.com căn 203, 22–24/03/2027, ota_prepaid 1.640.000. Lúc 23:30 ngày 22/03 đánh dấu no-show. Lúc 23:40 MGR khôi phục sang căn 101 (restore-no-show roomId=101, đổi căn do OTTIMO), rồi nhận phòng 23:45. Ngày 23/03 khách tự xin chuyển 101 → 401 (B14 guest_request, dryRun rồi ghi). Cùng kịch bản lặp qua swap-room 203↔101 trước ngày đến (01–03/03/2027), và qua dòng 'trước 0059' (B7 property_fault 203 → 101 rồi đặt origin_room_id = NULL, 16–18/11/2026).
- Mong đợi: BR-424 v0.3.8 (căn gốc = căn gán đầu tiên; đổi căn do OTTIMO không bao giờ đổi căn gốc) và oracle BR-424-06: chênh lệch đêm 23/03 = giá Trực tiếp 401 − căn gốc 203 = 1.042.000 − 792.000 = 250.000 (doanh thu phòng).
- Thực tế: Chạy trên PostgreSQL thật, cả 3 đường đều có reservation.origin_room_id = NULL và dòng room_change_difference = 375.000 (1.042.000 − 667.000 của căn 101), thừa 125.000/đêm. Ngày Tết thì lệch lớn hơn: ca swap 09/02/2027 ghi 488.000 thay vì 325.000. Đối chứng: B7 thường (BR-424-06) ghi đúng 250.000 vì move() có ghi origin.
- Test tái hiện: `pnpm exec vitest run test/s438/regr/money-regr.test.ts -t "origin"  và -t "via B12: Booking 203"  và -t "via swap-room" (cùng tệp test/s438/regr/money-regr.test.ts, DB ottimo_test_s438_regr). Đường swap trùng ca T17 của luồng move.`
- Mã nghi: reservations.service.ts restoreNoShow (~3936–3946: UPDATE reservation_segment SET room_id … 'overbooking') và swapRoom (~3718–3730) không ghi `origin_room_id = COALESCE(origin_room_id, <căn cũ>)` như move()/changeRoom (3170/3416/3607). move-planner.ts:254–262 originRoom() khi NULL lấy phòng của segment active đầu tiên, nhưng segment này đã bị sửa tại chỗ. Migration 0059 không backfill cho đơn đã đổi căn trước 0059 (có thể lấy từ reservation_change 'room').
- Hồi quy: False

## S438-REGR-03 – P1 – extra_person_base không được ghi khi B12 khôi phục no-show sang căn định mức thấp hơn, và dòng cũ trước 0059 cũng NULL; lần đổi số người sau tính phụ thu theo định mức căn mới
- BR: BR-429 v0.3.4, BR-424, BR-110, BR-315, migration 0059 (extra_person_base), S4-07
- Kịch bản: Đơn Trực tiếp căn 302 (định mức 3), 3 người lớn, phụ thu 0, 29–31/03/2027. Đánh dấu no-show 23:30 ngày 29/03. Lúc 23:40 MGR khôi phục sang 202 (định mức 2, đổi căn do OTTIMO). Sau đó lễ tân PATCH adults 3 → 2 → 3. Ca dòng cũ: B7 property_fault 402 → 203 với 3 người lớn, đặt stay_night.extra_person_base = NULL, rồi PATCH 3 → 2 → 3.
- Mong đợi: BR-429 v0.3.4 / BR-424 property_fault (khách không bao giờ trả thêm vì OTTIMO đổi căn): phụ thu = min(cũ, mới) = phụ thu theo max(định mức cũ 3, mới 2) = 0. Bảo vệ này giữ cho lần đổi số người sau (stay_night.extra_person_base, BE-A §2.1). Tổng phụ thu sau 3 → 2 → 3 = 0. Đối chứng B7 property_fault 302 → 202 cho ra 0 (đạt).
- Thực tế: Chạy trên PostgreSQL thật. Ngay sau B12 phụ thu = 0 (đúng). Sau PATCH 3 → 2 → 3 phụ thu = 300.000 (150.000 × 2 đêm). Ca dòng cũ với extra_person_base NULL cũng cho 300.000.
- Test tái hiện: `pnpm exec vitest run test/s438/regr/money-regr.test.ts -t "BR-429 v0.3.4 via B12"  và -t "extra_person_base NULL on the same case"  (đối chứng: -t "control: OTTIMO move 302")`
- Mã nghi: reservations.service.ts restoreNoShow (~3936–3946) đổi căn mà không qua MovePlanner nên không ghi stay_night.extra_person_base = max(định mức cũ, mới). swapRoom cùng lỗi (xem T16 của luồng move). Fallback NULL = định mức của căn đêm đó (0059 dòng (1)) làm mất bảo vệ cho đơn đã đổi căn trước 0059.
- Hồi quy: False

### Coverage (9 mục) / Gaps
- ✓ (1) Hồi quy toàn bộ vitest api trên DB mới ottimo_test_s438_regr, commit 08dabd3, loại test/s438. Lượt 1: 78/78 tệp, 2.645/2.645 ca, 41,4 s. Lượt 2: 78/78 tệp, 2.645/2.645 ca, 35,7 s. Lượt 3 (pool threads + V8 coverage thô, DB ottimo_test_s438_regrcov): 2.645/2.645. Không ca chập chờn, không ca skip (log verbose không có ↓; mọi describe.skipIf(!HAS_DB) đều chạy). Log: scratchpad/s438/regr/run1.log, run2.log, runcov.log.
- ✓ validate-fixtures.mjs: 352 dòng, 169 dòng tính lại, 0 lỗi, 1 cảnh báo cũ của ds-0.
- ✓ (2) Oracle nhóm BR-3xx/4xx có 146 dòng. Test api đọc theo id: 47 dòng. Đọc qua vòng lặp calc (frontdesk-rules ex(br,calc), reservations-pricing): 33 dòng. KHÔNG test api nào đọc: 66 dòng, gồm: (a) 12 dòng có calc, chỉ được validator tính lại, không chạy qua mã: BR-309-07, 322-01, 326-01, 421-01..03, 422-01, 433-01/02, 435-01, 436-01/02; (b) 10 dòng còn pendingFix CŨ: BR-412-12/13 (FB-R2-DOM-BE-17), 412-14 (BE-28), 414-02 (BE-18), 416-02/03 (BE-19), 417-03 (BE-22), 424-02 (BE-16), 424-03 (BE-26), 428-04 (BE-23). responses/s3-BE-A.md và s3-BE-C.md ghi các thẻ này 'Done' từ Sprint 3 nhưng chưa ai bỏ pendingFix, nên theo quy ước không test nào đọc → P3 vệ sinh oracle; (c) 11 dòng chỉ có E2E: BR-302-03, 303-01, 311-01, 315-01/02, 412-16, 414-01, 416-01, 417-01/02, 432-01; (d) 33 dòng không ở đâu cả (danh sách ở gaps). Bảng đối chiếu: scratchpad/s438/regr/oracle_map.txt.
- ✓ Đã chạy trên PostgreSQL thật các dòng oracle chưa test nào đọc, số đọc từ br-examples.json, tất cả khớp. BR-424-02: 202 → 302 khi đang ở, phòng +250.000, phụ thu −300.000, folio −50.000. BR-424-03: Booking 203 → 401 = 250.000, nhóm room. BR-424-06: B7 OTTIMO 203 → 101 rồi khách xin 401 = 250.000/đêm. BR-428-04: 4 × 700.000, FOC 100% đêm cuối, rời sớm 1 đêm → phí 350.000, hoàn 350.000, FOC cancelled night_removed, một yêu cầu hoàn 350.000. BR-412-12: trả muộn 17:00 = 354.000, FOC cả khoản, rời 13:00 → 212.000, FOC đi theo 212.000, khách trả 0, checkout-summary = B18. BR-412-13: FOC 200.000, khách trả 12.000. BR-412-14: hold cọc 500.000 đến cùng ngày → 12:20 tính 210.000. BR-424-01: sự cố 203 → 301 giữ 820.000, không có dòng chênh. BR-421-02: gia hạn Booking 401 ngày thường 1.042.000. BR-421-03: thứ Sáu 1.198.000. BR-428-05: 7 đêm −10% = 5.205.000, cơ sở 1.533.000, hoàn 767.000, phí 766.000, đêm đã ở 3.672.000. BR-433-02: 521.000 > hạn mức FDL, FDL không duyệt được, MGR duyệt được.
- ✓ (3) Diff 94c711d..08dabd3 (0b605f3 + 08dabd3) ở folio/payments/approvals/reservations/frontdesk có 4.060 dòng thực thi mới. 146 dòng (3,6%) không test nào chạm (đo bằng V8 coverage thô ánh xạ qua source map; kết quả ở scratchpad/s438/regr/diffuncov.txt). Đã viết test và chạy cho các nhánh tiền chưa test chạm: (a) cancelDormantOnSettle: trả muộn 15:00 = 225.000, FOC FDL duyệt, kéo về 12:30 (dormant), B18 12:20 → cancelled/settled_while_dormant, hạn mức FDL trả lại đủ 225.000, nợ 0 – ĐÚNG; (b) FOC dormant nhưng khách rời 14:00 → B18 ghi lại 225.000, FOC applied 225.000, khách trả 0, summary = ghi – ĐÚNG; (c) FOC chờ duyệt khi dòng trả muộn về 0 → lineChangedNote 225.000 → 0, FDL duyệt → dormant 0, B18 → cancelled, hạn mức trả lại – ĐÚNG; (d) FOC chờ 300.000 khi B7 dời +2 ngày → note from/to 01/02 → 03/02, duyệt → 300.000 trên đêm mới – ĐÚNG; (e) setNightRate nhánh không bậc giá (OTA đang ở): Agoda 302, MGR sửa 900.000 → 850.000 → phòng 1.750.000, paidViaOta 1.750.000, nợ 0, thừa 0, B18 200 – ĐÚNG; (f) amountDueForQr với giá B9a gõ tay – SAI (S438-REGR-01).
- ✓ (4) Cột mới của 0059/0060 NULL trên dòng cũ, fallback ĐÚNG ở ca thường: extra_person_base NULL, đơn chưa đổi căn, PATCH 2 → 3 người → 150.000/đêm theo định mức căn; foc_service_date NULL trên FOC đêm phòng đã duyệt, B7 dời +1 ngày → FOC 300.000 giữ đêm 15/12, cột được ghi lại lười 2026-12-15; origin_room_id NULL ở đơn chưa đổi căn: căn gốc = segment đầu (BR-424-03 đạt). Fallback SAI ở đơn đã đổi căn bằng đường không ghi cột: xem S438-REGR-02 và S438-REGR-03.
- ✓ Xem trước = lệnh ghi đã khớp từng đồng ở: checkout-summary ↔ B18 (4 ca trả muộn/FOC); move-preview ↔ move (2 ca); change-room dryRun ↔ ghi (BR-424-02/03/06, BR-424-01). Chỉ lệch ở QR check_in / B9a (S438-REGR-01).
- ✓ Mã chết không tiền: FolioService.pendingReductionsVnd (folio.service.ts:2384) không có nơi gọi.
- ✓ Tệp test: /private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/wt/product/services/api/test/s438/regr/money-regr.test.ts. Lượt cuối: 27 ca, 20 xanh, 7 đỏ có chủ ý (tái hiện 3 phát hiện). Khi chạy toàn bộ cây, cần loại test/s438/**.
- ◻ Chưa chạy E2E Playwright (TC-L2/L3/L4 có oracle chỉ ở E2E: BR-302-03, 303-01, 311-01, 315-01/02, 412-16, 414-01, 416-01, 417-01/02, 432-01) vì cần stack riêng.
- ◻ 33 dòng oracle BR-3xx/4xx không có test api hay E2E nào đọc. Đã tự chạy BR-424-01, 424-06, 428-05. Chưa chạy: BR-301-01, 303-04, 307-01..04, 308-01/02, 310-01/02, 312-01, 313-01, 314-01, 315-03..05, 316-01, 317-01/02, 321-01, 323-01, 324-01, 325-01, 326-02, 403-01, 427-01, 428-06, 429-01, 429-02, 429-13. Một phần có test ghi số cứng (ota-prepaid-flow, reservations-fix) nhưng không đọc oracle.
- ◻ Các pendingFix cũ còn lại chưa tự chạy với số oracle: BR-414-02 (giờ nhập tay lệch > 30 phút), BR-416-02/03 (đã có ca S3 E05-11 tương đương), BR-417-03 (dữ liệu khai báo, không tiền). Đề nghị QA/DOM bỏ pendingFix của 10 dòng và cho test đọc oracle.
- ◻ Nhánh chưa test chạm còn lại (không tự viết test): stay-night-pricing.ts:179–185 (đêm không có trong pricing_snapshot, ví dụ đêm gia hạn hoặc B9a, rồi sửa giá); folio.service.ts:1851–1855 (syncReductions g.gone – có vẻ không tới được vì moveReductionKeys xử lý trước); folio.service.ts:2039 (suspended → dormant khi B12 khôi phục mà dòng về 0); move-planner.ts:210 (thiếu tham số room_move_pricing); reservations.service.ts:1345–1350 (đơn OTA cũ thiếu bookedParty); FOC xin ở B9a trên đêm trước (stay-support.ts:444).
- ◻ swap-room: chỉ kiểm phần origin; phần phụ thu người khi swap trùng ca T16 của luồng move nên không lặp lại. B12 khôi phục sang căn khác còn chưa kiểm FOC theo khóa ngày và hoa hồng.
- ◻ Một log từ lần chạy trước (scratchpad/s438/regr/old/run2.log, 20:44, cây 75 tệp/2.615 ca, không phải lượt của tôi) có ca đỏ architecture.test.ts 'startup checks > accept ottimo_app' (dev_clock có dòng). Ca này đọc dev_clock không qua withDevClockLock nên có thể chập chờn. Không tái hiện được trong 3 lượt toàn bộ và 6 lượt chạy riêng 5 tệp dùng dev_clock. Không phải lỗi tiền.
- ◻ Không kiểm dữ liệu cũ thật trên DB demo/staging (ngoài phạm vi, không được đụng): chưa biết có bao nhiêu đơn đã đổi căn trước 0059 sẽ dính S438-REGR-02/03.
- ◻ Không làm ca đua (A1–A9 trong gợi ý BE-B), FOC chi tiết, hủy/hoàn – thuộc các luồng foc, pay, cancel, move.

