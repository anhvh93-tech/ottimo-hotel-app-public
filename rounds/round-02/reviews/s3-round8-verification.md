# Kiểm chứng đối kháng lần 7 – vòng sửa 8 (HEAD 6af7173)

Workflow `s3-round8-verify` (wf_a9c1c581-35b): 3 người phản biện (tiền trên PostgreSQL thật, đọc code, hồi quy diện rộng) + critic. CI run 38998735861 trên 6af7173 xanh (9/9 job, E2E 1.777 đạt).

## Kết quả từng hướng kiểm

Không hướng nào bác bỏ được vòng 8 (HEAD 6af7173). Không có hồi quy, không có sai tiền mới.

**money-repro**: 29 ca chạy trên PG thật. Đối chứng với code vòng 7 thì đỏ 15/29, nên harness phân biệt được đúng và sai.
- Tôi chạy lại trên DB riêng `ottimo_verify_r8_critic` (đã xóa sau khi chạy).
- `r8-money*.test.ts`: 28/29 xanh. Ca đỏ duy nhất là N16, thuộc S4-07.
- Tái hiện đúng số: X1 B12 1.200.000 → 500.000 → 1.500.000, không còn FOC. N11 4A→2A→4A ra 2.901.000. X2b ra `rejected`, tổng 5.205.000. X2a ra `posted`, tổng 1.703.000.
- Harness r7 `foc-move-r7` (bản đã sửa kỳ vọng (b)/(g2)): 19/21 xanh. Ca c2/c4/d4 của vòng 7 xanh. Đỏ (j) là S4-18 cộng kỳ vọng cũ bỏ sót ngày 24/12. Đỏ (m) là S4-02.

**code-audit**: 13 ca PG đều đúng tiền. `move()` giữ nguyên `stay_night_id` của ngày giữ.
- Các luồng không dời ngày cho kết quả giống vòng 6.
- 4 mục Note chỉ xảy ra ở trạng thái tổng hợp. Luồng thật không tạo ra được, vì có index duy nhất `stay_night`, và `folio-lines.service.ts:411` chặn sửa dòng room/extra_person.

**regression-suite**:
- Toàn bộ api: 2.187/2.187 ca, 2 lượt.
- E2E: 0 trượt, 2 lượt.
- k2k: 6/6 (E3, E4 xanh).
- Không có oracle nào trong repo còn mã hóa k→k cũ.

Đọc code `folio.service.ts:299-323` (`focDateMap`) và `:1258-1300`, `:1347-1390`:
- Phòng và phụ thu người dùng chung một bảng ngày. Logic khớp đủ 4 vế của quy tắc DOM.
- Phụ thu về 0 trên ngày giữ thì FOC hủy (min = 0). Đây là gốc của N11.

## Critic

| Mục | Kết luận | Lý do |
|---|---|---|
| mny-1: B12 khôi phục no-show làm mất FOC đã duyệt (+300k) | Major-defer-S4 (mục S4 mới + hỏi DOM) | Tôi đã tái hiện. Có từ vòng 6/7, không phải hồi quy. BR-434 chưa nói về B12. Tuy vậy BR-315(a) yêu cầu dùng lại đêm cũ, giữ giá, và điều kiện (3) cấm đổi giá. Vậy nhiều khả năng FOC phải quay lại. Ca này hiếm: phải có FOC trước khi đến, rồi no-show, rồi khôi phục. DOM cần chốt trước khi sửa. |
| mny-2: FOC phụ thu mất hẳn khi phí về 0 rồi tăng lại (+150k) | Major-defer-S4 (mở rộng S4-02) | Tôi đã tái hiện (2.901.000; theo DOM là 2.751.000). Cùng gốc với S4-02 (phải đọc số đã duyệt từ approval). Bản sửa S4-02 phải phủ cả ca dòng FOC đã bị đảo. Không phải hồi quy. |
| mny-3: FOC chờ duyệt trên ngày giữ bị đổi giá (LOS) → `rejected` | Major-defer-S4 (mở rộng S4-18) | Tôi đã tái hiện (X2b). Cùng lớp A5. S4-18 hiện chỉ ghi ca B8. Vòng 8 đã sửa đúng ca giá không đổi (X2a ra `posted`). |
| mny-4: B7 đổi căn không tính lại phụ thu | CLOSED (trùng S4-07) | Đã biết. Phần FOC tự nó vẫn đúng quy tắc. |
| code-1 + breg-2: FOC bị hủy không có audit `folio.*`; approval vẫn `approved` và vẫn trừ hạn mức tháng | Minor (gộp S4-18) | Tôi đã xác nhận. Điều kiện ghi audit ở `:1407` dựa trên tổng ≠ 0. `monthlyApprovedBy` (`approval.service.ts:840`) cộng SUM của các yêu cầu `approved`. Tiền khách đúng. Chỉ lệch báo cáo FOC và hạn mức. Có từ vòng 6. |
| code-2: `service_date` null → `''` chiếm slot added[0] | Note (không xảy ra trong luồng thật) | Mọi dòng room có `stay_night_id` đều được ghi kèm `serviceDate`. Nếu muốn chắc thì lọc null hoặc thêm CHECK ở S4. |
| code-3: hai dòng room sống trên cùng ngày | CLOSED/not-real | Index duy nhất `stay_night` và sync trong cùng giao dịch loại trừ trạng thái này. |
| code-4: phụ thu ở ngày không có dòng room | CLOSED/not-real | `folio-lines.service.ts:411` chặn. `voidStay` đảo cả hai dòng cùng lúc. |
| code-5: thứ tự áp nhiều reduction trên một dòng | Note (hỏi DOM ở S4) | Tiền khách đúng. Chỉ lệch cách chia FOC và giảm giá đặc biệt trong báo cáo. Có từ vòng 6. |
| breg-1: kỳ vọng k→k cũ chỉ còn trong harness scratch | QA-test-update (ngoài repo) | Repo không phải sửa. Nên thêm spec E2E/api cho BR-434-02/03 qua endpoint move ở S4. Không chặn cổng. |
| breg-3: TC-L3-013 chập chờn vì trùng số điện thoại | QA-test-update (Minor) | Lỗi ở `support/s3.ts:901` sinh số ngẫu nhiên. Không liên quan vòng 8. |
| breg-4: S4-19 vẫn ghi "Câu hỏi" | Note (ORC dọn sổ) | `s4-carryover.md:27`. DOM đã trả lời ở decision-log dòng 585 và BR-434. |

## Gaps

- Không ai kiểm FOC khi OTA sửa đơn (`ota_modification`) có đổi ngày. Code-audit chỉ chạy ca giữ ngày.
- Chưa kiểm luồng thêm/bớt người giữa kỳ (party add/remove có `effectiveFrom`).
- Chưa kiểm B12 khôi phục sau ngày nghiệp vụ, qua MGR duyệt, khi có FOC. Tôi chỉ chạy lại ca cùng ngày.
- Đơn có người chốt, tranh chấp duyệt song song, và B14 OTA đổi phòng 2 lần đều bỏ qua có chủ đích. Các mục này thuộc S4-01/03/05/13.
- Tôi không chạy lại bộ api 2.187 ca, E2E và world harness. Tôi dựa vào log của skeptic, kèm đọc code các dòng được dẫn.
- Quy trình kiểm: `r8/env.sh` và `r8/recreate-db.sh` dùng chung đã làm DROP DB của skeptic khác. Kết quả cuối không bị ảnh hưởng vì cả hai đã chạy lại trên DB riêng. Vòng sau mỗi skeptic nên có thư mục riêng ngay từ đầu.
- Cây làm việc có `rounds/round-02/demo-1-limits.md` đã sửa nhưng chưa commit. Tệp này ngoài `product/`, không ảnh hưởng kết quả.

## Khuyến nghị cổng QC Sprint 3

**ĐẠT để vào cổng QC.** Lý do:
- Không có Major-fix-now nào.
- 4 ví dụ BR-434 cho đúng số, BR-434-06 cũng đúng.
- Các hồi quy B7 của vòng 7 (c2, c4, d4, E3, E4) đã đóng.
- Toàn bộ test api và E2E xanh.

Điều kiện kèm theo, cho ORC (không cần sửa code trước cổng):
1. Thêm vào `s4-carryover.md` một mục mới: B12 khôi phục no-show làm mất FOC đã duyệt. Major-defer, BE-B, hỏi DOM.
2. Mở rộng S4-02: phải đọc số đã duyệt từ approval, kể cả khi dòng FOC đã bị đảo (ca phụ thu về 0 rồi tăng lại). Kèm test 4A→2A→4A.
3. Mở rộng S4-18:
   - mọi lần ghi lại dòng đêm có FOC đang chờ (kể cả đổi giá do LOS), không chỉ B8;
   - FOC bị hủy theo quy tắc phải có audit `folio.foc_cancelled` và không còn tính vào `monthlyApprovedBy` hay báo cáo FOC tháng.
4. Ghi vào S4 dạng Note: lọc `service_date` null khỏi `focDateMap`, và hỏi DOM thứ tự áp giảm giá đặc biệt / FOC.
5. Việc của QA (không chặn cổng):
   - thêm spec cho BR-434-02/03 qua endpoint move;
   - sửa cách sinh số điện thoại ở TC-L3-013.
6. Gạch S4-19 (đã đóng 17/10).

Script và log của tôi nằm ở `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/r8/critic/`:
- `new/run.log`, `new/report.json`, `new/report2.json`
- `foc/run.log`

DB `ottimo_verify_r8_critic` đã được xóa.

## Phụ lục – phát hiện của người phản biện

### Tôi không bác bỏ được vòng 8 trên các luồng thật. Tôi chạy 13 ca trên PostgreSQL thật, qua endpoint thật, DB riêng ottimo_verify_r8_code (đã
- **Minor** FOC bị hủy theo đêm bỏ (hoặc phụ thu về 0) không để lại audit tiền ở mức folio; approval vẫn 'approved' và vẫn trừ hạn mức tháng — PG thật, ca R1c (BR-434-04): căn 203, 03–06/12 → 04–06/12, FOC 792k trên 03/12. Tiền đúng: 1.822.000.
- Sau move chỉ có 2 dòng đảo (room −792k, foc +792k) và audit 'reservation.repriced'.
- Không có audit folio.* nào cho việc hủy FOC 792k.
- approval_request vẫn 'approved'. approval.service.ts:409 monthlyApprovedBy vẫn tính khoản này vào hạn mức tháng.
Nguyên nhân: folio.service.ts:1407 chỉ ghi audit khi roomVnd/extraPersonVnd/reversedVnd ≠ 0. Ở đây dòng đêm và FOC triệt tiêu nhau, reversedVnd = 0.
Tái hiện thêm: R4 (B16 bỏ đêm 19/11 có FOC 750k), R7 (PATCH số khách 4→3, FOC phụ thu 150k bị hủy; lên lại 4 người thì FOC không quay lại).
World W6: HEAD và R6 giống hệt, nên không phải hồi quy.
- **Note** focDateMap: service_date null → '' chiếm slot added[0], đẩy mọi ngày bỏ thật lệch 1 — Unit r8/unit/focdatemap.test.ts: focDateMap(['', 17/12, 18/12], [20/12, 21/12]) trả về {'': 20/12, 17/12: 21/12}. 18/12 bị hủy.
World W3 (HEAD): FOC 17/12 rơi vào 25/12 thay vì 24/12. R6 đặt đúng 24/12.
Trong luồng thật không xảy ra: mọi dòng room có stay_night_id đều do syncStay ghi kèm serviceDate. Không còn chỗ nào khác ghi loại dòng này, và không có migration backfill. Nhưng DB cũng không có CHECK chặn. Code ở folio.service.ts:1267 dùng `l.service_date ?? ''`.
- **Note** Hai dòng room sống trên cùng một ngày (dòng cũ của đêm đã void): HEAD dồn FOC của dòng cũ vào đêm hiện tại hoặc vào added[0] — World W2: ngày 19/12 giữ, đổi giá 911k→820k, dòng cũ có FOC 300k. HEAD ghi FOC 300k lên 19/12, tổng 2.223.000. R6 hủy FOC này, tổng 2.523.000.
World W2b: hai dòng cùng ngày bỏ 17/12 (FOC 100k + 200k). HEAD dồn cả hai lên 20/12. R6 chia ra 20/12 và 21/12. Tổng tiền bằng nhau.
focDateMap tự khử trùng ngày, nên không lệch slot.
Luồng thật không tạo trạng thái này: index duy nhất stay_night(reservation, date) với đêm không void, và sync đảo dòng của đêm void ngay trong cùng giao dịch.
- **Note** Phụ thu người dùng bảng ngày dựng từ dòng room: dòng extra_person ở ngày không có dòng room sống mất FOC — World W4: dòng room 18/12 bị đảo ngoài sync, FOC 150k nằm trên phụ thu 18/12, sau đó resync đổi phí 150k→200k. HEAD hủy FOC (vì goesTo.get(18/12) không có). R6 giữ FOC 150k.
Luồng thật không tạo trạng thái này:
- adjustFolioLine chặn dòng room/extra_person của đơn hold/confirmed/in_house (folio-lines.service.ts:411);
- voidStay đảo dòng room và extra_person cùng ngày.
- **Note** Nhiều reduction trên một dòng: khoản nào phải nhận phần cắt min phụ thuộc thứ tự ghi (posted_at); có khoản bị bỏ hẳn mà approval vẫn 'approved' — PG R3: căn 301, discount 300k (duyệt trước) + FOC 802k trên thứ Sáu 20/11 (đêm bị bỏ), chuyển sang 23/11 giá 958k. Kết quả: discount 300k + FOC 658k, tổng 2.060.000. Đúng tiền.
World W5: FOC duyệt trước. Kết quả: FOC 500k + discount 100k.
Nếu khoản đầu đã chiếm hết giá, khoản sau có amount ≤ 0 nên bị `continue` (folio.service.ts:1487). Không có dòng nào, approval vẫn approved.
Tiền khách đúng. Chỉ lệch cách chia FOC / giảm giá đặc biệt trong báo cáo. Vòng 6 cũng vậy.

### Không bác bỏ được vòng 8 dưới góc tiền. Tôi chạy trên PostgreSQL thật (DB riêng ottimo_verify_r8_mny, đã xóa sau khi chạy), qua endpoint thậ
- **Minor** B12 khôi phục no-show làm mất FOC đã duyệt, khách trả thêm đúng số FOC — X1, file r8-money-2.test.ts, PG thật:
- Căn 103, 07–09/12, FOC 300k trên đêm 07/12. Tổng 1.200.000.
- mark-no-show lúc 23:30: tổng 500.000 (giữ cọc).
- restore-no-show lúc 01:30 cùng ngày nghiệp vụ: 2 dòng phòng 750k được ghi lại, 0 dòng FOC. Tổng 1.500.000, khách trả thêm 300.000.
- Approval vẫn 'approved'.

Nguyên nhân:
- voidStay (folio.service.ts:997) đảo cả dòng phòng lẫn FOC.
- restoreNoShow (reservations.service.ts:3467) chỉ gọi resync. Lúc này không còn dòng phòng sống, nên focDateMap không có gì để chuyển.

Vòng 7 (aeb479e) cho kết quả y hệt, nên đây không phải hồi quy. BR-434 không liệt kê B12. Nếu đọc đúng chữ quy tắc thì ngày bị bỏ lúc no-show không có đêm đối ứng → FOC hủy.
- **Minor** FOC phụ thu người mất vĩnh viễn khi phí của ngày đó về 0 rồi tăng lại (bản sửa S4-02 cũng không cứu được) — N11, file r8-money.test.ts. Đặt trước, PATCH số khách, căn 302:
- 4 người lớn, FOC 150k trên phụ thu 20/01.
- Đổi thành 3 người lớn + 1 trẻ: FOC còn 100k. Đúng.
- Đổi thành 2 người lớn: phụ thu = 0, FOC hủy. Tổng 2.451.000.
- Đổi lại 4 người lớn: phụ thu 150k × 3 quay lại, nhưng FOC không quay lại. Tổng 2.901.000.

Theo DOM, ngày 20/01 vẫn là ngày giữ: "ngày giữ giữ FOC = min(số đã duyệt 150k, giá mới)". Như vậy đúng ra là 2.751.000. Khách trả thêm 150.000.

folio.service.ts:1352-1361: phí về 0 → `wanted` không có ngày đó → dòng bị đảo, FOC mất. Lần sync sau không còn dòng FOC nào để carry. Vì vậy sửa S4-02 (đọc số đã duyệt từ dòng FOC đang có) vẫn không hồi được FOC.

Vòng 7 cho kết quả y hệt (2.901.000), nên không phải hồi quy.
- **Note** FOC chờ duyệt trên một ĐÊM GIỮ nhưng bị đổi giá (LOS khi B7 thêm đêm, B9a, B13, B14 khách yêu cầu) cũng thành 'rejected' – S4-18 hiện chỉ ghi B8 — X2b: căn 203, 23–26/11. FD xin FOC 300k cho đêm 24/11 (đang chờ). B7 đổi ngày đi thành 30/11 (7 đêm, LOS 10 %), nên đêm 24/11 đổi giá và dòng bị ghi lại. Quản lý duyệt sau đó: HTTP 200, approval = 'approved', nhưng dòng FOC = 'rejected'. Tổng 5.205.000, FOC không được trừ. Vòng 7 cho kết quả y hệt.

X2a (cùng file) là ca đối chứng: đêm giữ, giá không đổi (dời 17–20 → 18–21/12). FOC chờ duyệt được duyệt sau thì 'posted', tổng 1.703.000. Vậy vòng 8 đã sửa đúng ca giữ dòng.
- **Note** B7 đổi căn khác định mức không tính lại phụ thu người (S4-07); FOC phụ thu vì vậy vẫn còn — N16: đơn OTA prepaid căn 101, khách báo trực tiếp lên 3 người lớn, phụ thu 150k × 3. FOC 150k trên đêm 05/01.
- Dời sang 102: ghi thêm 0 dòng, FOC giữ. Đúng.
- Dời tiếp sang 301 (định mức 4): phụ thu vẫn 150k × 3, FOC vẫn 150k. Tổng 2.400.000. Theo BR-110 đúng ra là 2.100.000.

Đây là S4-07 đã biết. Phần FOC tự nó vẫn đúng quy tắc: ngày giữ, phí không đổi thì không đụng dòng. Phiếu thu ota_collect = 2.100.000 (đúng). Không có FOC nào nằm trên dòng phòng OTA.

### Không bác bỏ được vòng 8 (HEAD 6af7173). Tôi không thấy hồi quy nào, cũng không thấy sai tiền mới. Chỉ có vài Note.

1) Bộ test api chạy trê
- **Note** Không có E2E/oracle nào trong repo mã hóa k→k cũ; chỉ harness ở scratchpad cần sửa kỳ vọng — Tôi grep product/tests (e2e, fixtures/br-examples.json, test-cases/*.md, smoke-manifest), product/docs và services/api/test, tìm 'k → k', 'night k', 'đêm thứ k', 'byIndex', 'whole stay' và FOC đi kèm move/postpone/B7/B8. Kết quả:
- Không spec E2E nào gộp FOC với move. TC-L2-055 (api/s3-kickoff.api.spec.ts:254), booking-conflicts:188 và s2-fix:214 chỉ kiểm trạng thái và cọc.
- br-examples chỉ có BR-434-02…06 mới, đúng quy tắc.
- BR-428-04 (FOC đêm bỏ khi B16 → hủy) vẫn khớp.
- Kỳ vọng k→k cũ chỉ còn ở harness vòng 7 trong scratchpad (ngoài repo): r7/foc/foc-move-r7.test.ts:430/442, ca (b), chờ FOC sang 20/12 = 750k, tổng 1.726.000; r7/foc/foc-move-r7.test.ts:742/762, ca (g2), chờ FOC phòng và phụ thu sang 26/11.
- Trong decision-log, dòng 582 (DOM 17/10 lần đầu: 'đêm bị bỏ → FOC hủy theo') và dòng 584 ([GIẢ ĐỊNH] của ORC) đã bị dòng 585 thay thế. Log chỉ ghi thêm nên chấp nhận được.
- **Note** FOC bị hủy (đêm bỏ không có đêm thêm) vẫn để approval 'approved', vẫn trừ hạn mức FOC tháng — Kịch bản N2: căn 202, dời 19–22/11 → 21–23/11. FOC 200k của 20/11 bị hủy đúng quy tắc (3), folio đúng 1.603.000. Nhưng approval_request của FOC này vẫn 'approved' mà không còn dòng FOC nào.
- approval.service.ts:852 (monthlyApprovedBy) cộng SUM(amount_vnd) của các yêu cầu 'approved', nên hạn mức tháng của người duyệt vẫn bị trừ 200k.
- Báo cáo FOC tháng ghi thừa khoản này.
- Lỗi có từ vòng 6 (B16, rút đêm), vòng 8 không làm nặng thêm. S4-18 chỉ ghi ca FOC đang chờ duyệt.
- **Note** E2E chập chờn TC-L3-013: số điện thoại khách ngẫu nhiên trùng → 409 DUPLICATE_GUEST — Lượt E2E 1, project clock: e2e/clock/checkin.s3.clock.spec.ts:877 (TC-L3-013) đỏ ở lần đầu, chạy lại thì xanh. Lượt 2 xanh.
- Nguyên nhân: support/s3.ts:901 sinh số `0939` + 6 chữ số ngẫu nhiên (1e6 khả năng). Mỗi lượt tạo vài trăm khách, nên xác suất trùng đáng kể.
- api trả 409 DUPLICATE_GUEST theo phone.
- Không liên quan code vòng 8.
- **Note** s4-carryover S4-19 vẫn ghi 'Câu hỏi' dù DOM đã trả lời FOC-7 — rounds/round-02/s4-carryover.md, dòng S4-19: 'Ví dụ BR-434 (căn 302 giá 917k) áp cho B14 hay cả B7 đổi căn | Câu hỏi | DOM'. Trong khi decision-log dòng 585 và business-rules.md:180 đã chốt: ví dụ là B14, còn B7 giữ giá (BR-429). Tôi chạy N3 (B14 khách xin đổi phòng): đúng 125.000. S4-14 đã gạch, S4-19 thì chưa.
