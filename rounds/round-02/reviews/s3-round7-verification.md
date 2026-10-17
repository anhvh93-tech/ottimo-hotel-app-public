# Kiểm chứng đối kháng lần 6 – vòng sửa 7 (HEAD aeb479e)

Workflow `s3-round7-verify` (wf_30757e79-f3b): 4 người phản biện (upload: tái hiện + đọc code; FOC: tái hiện trên PostgreSQL thật + đọc code) và 1 critic. CI run 38995279907 trên aeb479e xanh (1.777 đạt).

## Kết quả từng hướng kiểm

**upload-repro (không bác bỏ).** Tác giả chạy lại mọi script cũ ở HEAD aeb479e và thêm 8 biến thể mới trong r7/:
- keepalive.ts: 0/16 thân còn sống, 1 listener 'close', RSS 314–319 MB.
- proxy.ts: 0/16. membound: đỉnh 84 MB.
- 1000 upload trên 1 socket: listener giữ nguyên, 0/1000 thân sống.
- vitest upload-gate-socket 11/11 xanh. Cùng test đó chạy với http.ts vòng 6 thì đỏ (10 listener), nên test bắt đúng lỗi cũ.

Có 2 phát hiện, đều không phải hồi quy:
- Pipelining gửi thẳng vào api giữ được 26 × 42 MB = 1092 MB trong khi inFlight = 0.
- Chú thích ở http.ts:268 sai: listener onError còn giữ `body`.

Tôi chạy lại keepalive.ts (reject): 16 × 422, 0/16 thân sống, RSS 318 MB, 1 listener. Chạy lại vitest: 11/11 xanh.

**upload-code (refuted = true, nhưng chỉ Minor).** Lỗi Major vòng 6 đã đóng: keepalive và proxy đều 0/16, RSS 271–328 MB. Ba phát hiện:
- onError giữ `body` qua closure: HEAD 8/8 thân sống (336 MB), bản no-op 0/8.
- Pipelining không đọc response: 26/26 thân sống, RSS 1,0–1,3 GB. Bản fixprobe về 0/26.
- Lưới an toàn `net` trả slot sớm nếu sau này có hook preParsing. Hiện src/ chưa có hook nào.

**foc-repro (refuted, Major, hồi quy vòng 7).** Chạy 21 ca trên PostgreSQL thật, cùng bộ ca chạy lại trên code vòng 6 (25ee693).
- Đạt: a, a2, b, c, d, d2, e, f, h, k, o. Test repo foc-resync 2/2 xanh.
- Sai tiền mà code vòng 6 đúng:
  - c4: OTTIMO thu thiếu 750.000.
  - c2: khách trả thừa 400.000.
  - d4: khách trả thừa 113.000.
  - i: đổi căn giữ ngày, sau đó FOC chờ duyệt thành 'rejected', khách trả thừa 100.000.
- Lỗi có từ trước: g (FOC phụ thu người mất, thừa 150.000), m (dời 2 lần, thừa 100.000).

Tôi đã đọc report.json của cả HEAD và oldrun: c2, c4, d4 sai ở HEAD, đúng ở vòng 6, khớp với báo cáo.

**foc-code (refuted, Major, hồi quy vòng 7).** E2E trên PostgreSQL thật, cùng nguyên nhân với foc-repro:
- E1b: thu thừa 911.000 (FOC 100 % của đêm còn giữ bị mất).
- E2b: thu thừa 119.000.
- E1: OTTIMO thu thiếu 100.000.
- E3: FOC chờ duyệt bị 'rejected' sau khi đổi căn, lệch 200.000.
- E4: FOC phụ thu mất.

Harness so với vòng 6: S2, S3, S4, S5 sai ở HEAD, đúng ở vòng 6.

Tôi tự đọc code để kiểm:
- reservations.service.ts:2865 truyền `focFollowsNightIndex: true` mà không có điều kiện.
- Ở folio.service.ts:1247, khi `byIndex` thì bỏ qua nhánh giữ dòng.
- :1300 lấy `byRank[rank]`. Nên khi rút hoặc thêm đêm ở đầu, mọi FOC lệch một vị trí.
- :1327 chỉ chuyển FOC phụ thu khi trùng ngày.
- foc.service.ts:184: duyệt mà dòng gốc đã bị đảo thì dòng FOC thành 'rejected'.

## Critic

| Mục | Kết luận | Lý do |
|---|---|---|
| FOC-1: k→k bật cho mọi move() (B7 rút/thêm đêm đầu, rút hai đầu) | **Major-fix-now** | Hồi quy vòng 7. Sai tiền âm thầm theo cả hai chiều (−750k, +400k, +911k, +119k) trên đường thường là B7 đổi ngày đến. Trái BR-434 v0.3.4: "Đêm bị bỏ … FOC hủy theo, không chuyển sang đêm khác". Không thuộc S4-14: các ca này là rút hoặc thêm đêm, ngày trả phòng giữ nguyên, không phải dời cả đơn. |
| FOC-2: đổi căn giữ ngày đảo mọi dòng, FOC chờ duyệt thành 'rejected' | **Major-fix-now** (gộp với FOC-1) | Hồi quy vòng 7. Approval 'approved' nhưng khách vẫn trả đủ, hạn mức FOC tháng vẫn bị trừ. Sửa cùng điều kiện với FOC-1 (không bật cờ khi ngày không đổi). |
| FOC-3: FOC trên phụ thu người mất khi dời ngày | **Major-fix-now** | Có từ trước, không phải hồi quy. Nhưng sai tiền âm thầm (+150k), chưa có trong s4-carryover (S4-07 là chuyện khác). BR-434 ghi "áp cho mọi dòng được tính lại". Sửa trong cùng hàm, cùng vòng sửa, chi phí nhỏ. |
| FOC-4: carry lấy min(FOC hiện tại) thay vì min(số đã duyệt) | Minor (S4-02) | Đã có trong carryover, chờ DOM chốt. |
| FOC-5: FOC chờ duyệt khi dời ngày: dòng 'rejected', approval 'approved' (A5) | Major-defer-S4 | Có từ trước. Tiền folio đúng, chỉ lệch hạn mức và báo cáo FOC. Thêm vào s4-carryover. |
| FOC-6: base hoa hồng cũ sau khi dời | Minor (S4-03) | Đã có trong carryover, tự đúng ở lần resync sau. |
| FOC-7: ví dụ BR-434 (302 giá 917k) không khớp B7 đổi căn giữ giá | Note | Câu hỏi cho DOM: ví dụ áp cho B14 hay cả B7. |
| UP-1: pipelining gửi thẳng api, thân vượt trần 4 × 42 MB | Major-defer-S4 | Có thật (khoảng 1 GB, vượt mem_limit 1g). Nhưng client không với tới: compose prod không có `ports` cho api (infra/docker-compose.prod.yml:136-155), Caddy không pipeline lên upstream. Không phải hồi quy vòng 7. Ghi vào S4 cùng S4-15. |
| UP-2: onError giữ `body`, chú thích :268 sai | Minor | Tôi đã xem :264/:286: closure dùng chung context. Đường qua Caddy không bị ảnh hưởng (0/16). Sửa 1 dòng (`body = null` hoặc noop cấp module), làm cùng UP-1. |
| UP-3: lưới `net` trả slot sớm nếu có preParsing | Note | Hiện không có hook preParsing. Nên thêm assert `payload === req.raw`. |
| Bản sửa upload vòng 7 (lỗi Major vòng 6) | CLOSED | Tôi chạy lại: 0/16 thân sống, 1 listener, 11/11 test xanh. Test đỏ với code vòng 6. |
| Bản sửa FOC vòng 7 cho B8 dời hẳn và dời chồng giữ số đêm | CLOSED | Ca a, a2, b, e, f, h và test repo đều đúng ở HEAD. |

## Gaps

- Tôi không tự chạy lại e2e FOC trên PostgreSQL. Tôi kiểm bằng cách đọc code (các dòng :2865, :1241-1300, :1327, foc.service.ts:184) và đọc report.json của HEAD lẫn vòng 6. Hai skeptic độc lập, hai harness khác nhau, cho cùng kết quả.
- Chưa chạy B8 postpone với MGR qua HTTP cho ca rút hoặc thêm đêm. Cờ đặt ở cùng một chỗ nên kết quả suy ra được.
- Chưa có Caddy thật (S4-15). Ca dời chồng ngày có đổi số đêm vẫn chờ DOM (S4-14).
- rounds/round-02/s4-carryover.md đang có thay đổi chưa commit (S4-16, ghi chú Dependabot). Thay đổi này không do skeptic nào tạo, và không ảnh hưởng kết luận.

## Khuyến nghị cổng QC Sprint 3

**KHÔNG ĐẠT để vào cổng QC tại aeb479e.** Bản sửa upload vòng 7 đã đóng đúng. Nhưng bản sửa FOC vòng 7 làm hỏng đường thường B7 đổi ngày đến và đổi căn: sai tiền âm thầm theo cả hai chiều, trong khi vòng 6 xử lý đúng. Cần một vòng sửa 8 ngắn cho BE-B, gồm:

1. Trong move(), chỉ bật `focFollowsNightIndex` khi cả đơn dời: tập ngày có đổi, và hoặc không còn ngày cũ nào trùng, hoặc giữ nguyên số đêm như ca (b). Chỉ đổi căn, hoặc chỉ rút/thêm đêm ở một đầu, thì xử lý theo ngày: đêm còn giữ thì giữ FOC của nó, đêm bị bỏ thì hủy FOC. Đổi căn mà ngày và giá không đổi thì không đảo dòng nào.
2. Khi bật k→k, cho FOC phụ thu người đi theo k→k, lấy min(FOC, phụ thu mới).
3. Thêm test cho các ca c2, c4, d4/E2b, E1b, i/E3 (FOC chờ duyệt, đổi căn, rồi duyệt thì thành posted) và g/E4. Giữ xanh foc-resync (A).

Hai mục không chặn cổng:
- Chuyển UP-1, UP-2 (kèm sửa 1 dòng `body = null`) và FOC-5 sang s4-carryover.
- Hỏi DOM về ví dụ BR-434 (FOC-7).

Sau vòng 8, chỉ cần một lượt kiểm hẹp: các ca FOC kể trên, cộng chạy lại keepalive và vitest upload. Đạt thì vào QC.

## Phụ lục – chi tiết phản biện (FOC)

### Bác bỏ (Major, hồi quy của vòng 7). Bản sửa đúng với ca dời hẳn cả đơn: FOC đêm 3 sang đúng đêm mới thứ 3. Ca dời chồng 
- **Major** (hồi quy vòng 7) move() bật focFollowsNightIndex cho cả B7 rút/thêm đêm đầu và rút hai đầu: FOC trượt sang đêm khác hoặc mất, trái BR-434 — reservations.service.ts:2865 truyền `focFollowsNightIndex: true` không điều kiện cho mọi lần gọi move(). move() phục vụ cả B7 đổi căn, đổi chỉ arrivalDate hoặc chỉ departureDate, và B8 postpone (dropped/added ở :2773/:2779). folio.service.ts:1247 bỏ nhánh giữ dòng khi byIndex; :1259 xếp khoản giảm của từng dòng cũ theo ngày vào byRank; :1300 gán byRank[rank] cho đêm mới thứ rank. Vì vậy khi bỏ hoặc thêm đêm ở đầu, mọi FOC lệch 1 vị trí. BR-434 v0.3.4 (business-rules.md:180): 'Đêm bị bỏ (trả sớm, rút đêm) → FOC của đêm đó hủy theo, không chuyển sang đêm khác'; chỉ 'dời cả đơn sang ngày khác (B8)' mới đi k→k. Đường B9a thêm đêm trước (checkin.service.ts:693) gọi resync không cờ, FOC ở lại đêm cũ, nên hai đường cùng nghiệp vụ cho kết quả khác nhau. E2E trên PostgreSQL thật (endpoint thật, DB riêng ottimo_verify_k2k, đã xóa sau khi chạy; script scratchpad/r7/k2k-audit/k2k.test.ts, kết quả e2e.out): E1b, căn 202, 03–06/12, giá 792k / 911k / 911k, FOC 100 % đêm 05/12 = 911.000; POST move {arrivalDate: 2026-12-04} → không còn dòng FOC sống; tiền phòng khách trả 1.822.000, đúng quy tắc là 911.000, thu thừa 911.000. E2b, căn 203, FOC 100 % đêm 04/12 = 911.000; move {arrivalDate: 2026-12-02} → FOC nằm ở 03/12 = min(911k, 792k) = 792.000; khách trả 2.614.000, đúng là 792+792+0+911 = 2.495.000, thu thừa 119.000; đêm 03/12 bị đánh dấu miễn phí sai. E1, căn 101, FOC 300k thứ Năm 03/12 + FOC 200k thứ Bảy 05/12; move {arrivalDate: 04/12} → 04/12 nhận FOC 300k của đêm đã bỏ, 05/12 mất FOC 200k; tiền phòng 1.234.000, đúng là 1.334.000 (khách sạn mất 100k, FOC chuyển sang đêm khác). Đối chứng cùng kịch bản trên FolioService vòng 6 (25ee693, harness SQL giả lập, scenarios.ts S2/S3/S4): FOC ở lại đúng đêm và số tiền đúng, nên đây là hồi quy. Test repo foc-resync (A) chỉ phủ ca dời hẳn và ca dời chồng 1 ngày, không có ca chỉ đổi ngày đến. — Sửa: Chỉ bật cờ khi cả đơn thực sự dời: trong move() tính `dropped` và `added` trước rồi truyền `focFollowsNightIndex: dropped.length > 0 && added.length > 0`. Chặt hơn: chỉ bật khi không còn ngày cũ nào; ca dời chồng ngày chờ DOM chốt (S4-14). Ca chỉ rút hoặc thêm đêm, và ca đổi căn, giữ cách cũ: đêm còn bán giữ FOC của nó, đêm bị bỏ hủy FOC. Thêm test: (a) FOC trên đêm 3, chỉ đổi arrivalDate muộn hơn 1 ngày; (b) FOC trên đêm 2, arrivalDate sớm hơn 1 ngày; (c) rút cả hai đầu.
- **Minor** (hồi quy vòng 7) Mọi lần move() (kể cả đổi căn giữ nguyên ngày và giá) đảo mọi dòng phòng, nên FOC đang chờ duyệt bị tự từ chối — Khi byIndex, folio.service.ts:1247 bỏ qua nhánh giữ dòng, nên mọi dòng phòng cũ bị đảo và ghi lại. foc.service.ts:184: duyệt FOC mà dòng liên quan đã đảo thì dòng FOC thành 'rejected'. E2E E3 trên PostgreSQL thật: căn 103, 03–06/12; FD xin FOC 200k cho đêm 2 (đang chờ); move {roomId: 201} cùng nhóm, cùng ngày → 3 dòng đảo; quản lý duyệt → HTTP 200, approval_request = approved nhưng dòng FOC = rejected; khách trả đủ 2.476.000 thay vì 2.276.000 (lệch 200.000), không ai được báo. Vòng 6 (scenarios.ts S5, R6) không đảo dòng nào, FOC được ghi 'posted'. Mỗi lần đổi căn nay sinh thêm N dòng đảo + N dòng ghi lại + dòng FOC mới, kèm audit 'folio.foc_posted' 'carried'. — Sửa: Sửa như mục 1 (không bật cờ khi chỉ đổi căn). Kể cả ở chế độ byIndex, giữ nguyên dòng khi đêm k cũ và đêm k mới cùng stay_night_id và cùng gross, như nhánh !byIndex. Thêm test: FOC chờ duyệt, sau đó đổi căn, sau đó duyệt → posted.
- **Minor** Dời cả đơn: FOC đã duyệt trên phụ thu người (extra_person) bị mất, không theo k→k — folio.service.ts:1327 chỉ carry khoản giảm của extra_person khi `wanted.has(d)`, tức cùng ngày. Dời sang ngày khác thì FOC bị đảo và không ghi lại. Dời chồng ngày thì FOC phòng đi theo k→k nhưng FOC phụ thu đi theo ngày, hai cách không nhất quán. BR-434 v0.3.4: 'áp cho mọi dòng được tính lại … dời cả đơn → đêm thứ k → đêm thứ k'. E2E E4 trên PostgreSQL thật: căn 101, 3 người lớn, 08–11/12, phụ thu 150.000/đêm, FOC 150.000 trên phụ thu đêm 09/12; move {15–18/12} → 3 dòng phụ thu 150.000, 0 dòng FOC sống; khách trả thêm 150.000. Vòng 6 cũng vậy (scenarios.ts S6). — Sửa: Ở chế độ byIndex, ghép khoản giảm của extra_person theo thứ tự ngày, giống dòng phòng (ngày cũ thứ k → ngày mới thứ k), lấy min(FOC, phí mới). Hoặc DOM ghi rõ là phụ thu người không theo k→k.
- **Note** Base hoa hồng còn cũ ngay sau khi byIndex dời FOC (đã biết, S4-03) — syncCommission (folio.service.ts:1680, base = Σ stay.nights.roomRevenueVnd đọc trước khi carry). scenarios.ts S8, đơn có người chốt 10 %, FOC 100 % đêm 3, dời hẳn: base 3.200.000 trong khi tiền phòng net 2.000.000, phân bổ dồn 120.000 lên đêm miễn phí; lần resync sau base về 2.000.000. Vòng 6: base 3.200.000 so với 2.200.000. Cùng lớp với S4-01/S4-03; vòng 7 không làm nặng thêm. — Sửa: Như S4-01: đọc lại đêm sau khi carry rồi mới tính base và trọng số hoa hồng, phí kênh.

### Bác bỏ (Major, là hồi quy của vòng 7). Tôi chạy trên PostgreSQL thật, DB mới ottimo_verify_r7, qua endpoint thật (Nest +
- **Major** (hồi quy vòng 7) k→k áp cho mọi move(), kể cả B7 rút đêm/thêm đêm ở đầu: FOC đêm bị bỏ chuyển sang đêm khác, FOC của đêm còn lại bị hủy — Nguyên nhân:
- reservations.service.ts:2865 luôn đặt focFollowsNightIndex: true.
- folio.service.ts:1241/1247/1300 ghép theo thứ hạng đêm cho mọi lần dời.

Test r7/foc/foc-move-r7.test.ts, chạy trên PG thật:

(c4) Căn 103, 07–10/12 → 08–10/12 (khách đến muộn 1 ngày). FOC 750k nằm trên đêm bị bỏ 07/12.
- HEAD: FOC chuyển sang 08/12, khách trả 750.000.
- Đúng BR-434 (rút đêm → hủy): 1.500.000. OTTIMO mất 750.000.
- bookingValue cũng chỉ còn 750.000, nên trần phí B10 thấp theo.
- Code vòng 6: 1.500.000.

(c2) Căn 201, 16–20/11 → 18–20/11. FOC 100k trên 16/11, FOC 500k trên 18/11.
- HEAD: FOC 500k của 18/11 bị hủy, FOC 100k nhảy sang 18/11. Khách trả 1.316.000, đúng là 916.000 (thừa 400k).
- Approval 500k vẫn 'approved' nhưng không còn dòng FOC nào.
- Code vòng 6: 916.000.

(d4) Căn 102, 26–29/11 → 24–29/11 (thêm 2 đêm đầu). FOC 863k trên thứ Bảy 28/11, đêm này vẫn còn.
- HEAD: FOC sang 26/11 (thứ Năm, 750k) = 750k. Khách trả 3.226.000, đúng là 3.113.000 (thừa 113k).
- Code vòng 6: 3.113.000.

(c3), (d3): cùng nguyên nhân. FOC rơi sai đêm (05/12 thay vì 04/12; 22/11 thay vì 25/11), tiền tình cờ bằng nhau. — Sửa: Chỉ bật k→k khi dời CẢ đơn: B8 postpone, hoặc B7 không còn ngày nào trùng, hoặc B7 dời giữ nguyên số đêm như ca (b). Khi rút hay thêm đêm mà còn ngày trùng thì xử lý theo ngày: đêm còn giữ FOC của nó, min(số đã duyệt, giá mới); đêm bị bỏ thì FOC hủy theo. Nhờ DOM chốt thế nào là 'dời cả đơn' với B7 đổi ngày đến. Thêm test c2/c4/d4.
- **Major** FOC trên phụ thu người (extra_person) mất khi B7/B8 dời sang ngày khác — Nguyên nhân: folio.service.ts:1327 chỉ chuyển FOC phụ thu khi trùng ngày (`if (wanted.has(d) && reductions.length)`). Không có nhánh k→k cho phụ thu.

(g) Căn 302, 4 người lớn (phụ thu 150k/đêm). FOC 150k trên phụ thu đêm 3 và FOC 300k trên tiền phòng đêm 3. Dời 02–06/11 → 16–20/11.
- FOC phòng sang 18/11: đúng.
- FOC phụ thu bị hủy. Khách trả 3.968.000, đúng là 3.818.000 (thừa 150k).
- Approval của FOC phụ thu vẫn 'approved'.
- BR-434 v0.3.4 ghi "áp cho mọi dòng được tính lại".
- Code vòng 6 cũng sai y như vậy.

(g2) Dời chồng ngày: FOC phòng sang 26/11, còn FOC phụ thu ở lại 25/11. Hai FOC bị tách, tổng tiền vẫn bằng nhau. — Sửa: Trong vòng extra_person, khi cờ k→k bật thì ghép FOC theo thứ hạng đêm giống tiền phòng. Lấy min(số đã duyệt, phụ thu mới). Thêm test (g).
- **Minor** (hồi quy vòng 7) B7 chỉ đổi căn (giữ ngày) nay đảo và ghi lại mọi dòng; FOC đang chờ duyệt bị từ chối ngầm — (i) Căn 101 → 203, giữ ngày 23–27/11 (giá đêm giữ 667k). Có FOC 400k đã duyệt trên đêm 3 và FOC 100k đang chờ duyệt trên đêm 1.
- HEAD: move ghi thêm 10 dòng (4 dòng đảo phòng, 4 dòng phòng mới, 1 dòng đảo FOC, 1 dòng FOC mới). Code vòng 6: 0 dòng.
- Sau đó quản lý duyệt FOC 100k: API trả 200, approval_request = 'approved', nhưng folio_line = 'rejected' (A5).
- Khách trả 2.268.000. Code vòng 6: FOC được ghi, khách trả 2.168.000.
- Hạn mức FOC tháng vẫn bị trừ 100k.
- Nguyên nhân: nhánh byIndex bỏ qua kiểm tra giữ dòng (folio.service.ts:1247). — Sửa: Không bật cờ khi khoảng ngày không đổi, hoặc trong chế độ byIndex vẫn giữ dòng có cùng stay_night và cùng số tiền.
- **Minor** Carry FOC lấy min(FOC hiện tại, giá mới), không phải min(số đã duyệt, giá mới); dời qua lại thì FOC chỉ giảm — Nguyên nhân: folio.service.ts:1455 `Math.min(-r.amount_vnd, left)` dùng số của dòng FOC hiện tại. BR-434 ghi "min(số đã duyệt, giá trị dòng mới)".

(m) Căn 101. FOC 767k trên đêm thứ Bảy. Dời sang Thứ Hai–Thứ Tư: FOC còn 667k. Dời lại về Thứ Năm–Thứ Bảy: FOC vẫn 667k.
- Khách trả 1.534.000, đúng là 1.434.000 (thừa 100k).

(b-back) Dời 18–21 về lại 17–20/12: khách thừa 113k.

Đã ghi ở s4-carryover (Minor a). Code vòng 6 cũng vậy. — Sửa: Lấy số đã duyệt từ approval_request.amount_vnd của approval_request_id, rồi tính min(số đó, phần còn lại của dòng).
- **Note** FOC đang chờ duyệt khi dời ngày: dòng bị 'rejected' nhưng approval vẫn 'approved' và vẫn trừ hạn mức — (j) Căn 102, 14–18/12 → 21–25/12. FOC 300k đang chờ duyệt, duyệt sau khi dời.
- API trả 200. approval_request = 'approved', folio_line = 'rejected'.
- Tổng folio đúng: 3.225.000 (đêm 24/12 là ngày đặc biệt +30 % = 975k).
- Đây là hành vi A5 có từ trước. — Sửa: Hủy hoặc từ chối yêu cầu đang chờ khi dòng của nó bị đảo trong lúc đồng bộ, để hạn mức và báo cáo FOC không lệch (S4).
- **Note** Ví dụ của BR-434 (đổi sang 302 917k → khách trả 125k) không khớp move(): B7 đổi căn giữ giá lịch đã thỏa thuận — (i) Đổi căn 101 → 203 trước nhận phòng: giá đêm giữ nguyên 667k. Lý do: retierNights giữ calendar_rate của đêm còn giữ, theo DOM D-8/A-22. Vì vậy min(F, giá mới) không đổi khi đổi căn trước nhận phòng. — Sửa: Nhờ DOM chốt ví dụ BR-434 áp cho B14 (đang ở) hay cả B7.

### Kết luận: bản sửa vòng 7 đóng được lỗi Major của vòng 6. Không còn listener nào gắn vào socket. Thân upload không còn bị
- **Minor** Listener 'error' giữ lại trên payload vẫn giữ buffer body 42 MB qua closure; chú thích http.ts:268 sai — Vị trí trong code:
- http.ts:264 khai báo `onError = (err) => finish(err)`.
- http.ts:286 gắn `payload.on('error', onError)` và không bao giờ gỡ.
- onData (http.ts:247-256) bắt `body` (allocUnsafe ở :244). Các closure con của readBody dùng chung một V8 context, nên onError giữ cả `body` và `done`.
- http.ts:268 lại ghi 'Nothing of this read stays referenced from the stream'.

Repro r7/errclosure.ts (NODE_OPTIONS=--expose-gc, 8 upload × 42 MB, handler gán lại req.body như guest.controller.ts:217 rồi trả 201, test giữ ref tới req.raw):
- HEAD: 8/8 thân còn sống (336 MB), arrayBuffers 380 MB. Có 1 listener 'error' trên req.raw.
- Đối chứng r7/http-noerr.ts: trong finish, thay onError bằng một hàm no-op cấp module. Kết quả 0/8, arrayBuffers 44 MB.
- Bỏ ref tới req.raw thì HEAD cũng về 0/8.

Đường keep-alive bình thường không bị ảnh hưởng: keepalive.ts và proxy.ts ở HEAD đều 0/16. — Sửa: Trong finish(), sau khi gỡ data/end/aborted/close, thay `onError` bằng một hàm no-op khai báo ở cấp module (không dùng chung context của readBody). Sửa lại chú thích ở :268.
- **Minor** Slot được trả ở onSend nhưng thân còn sống tới khi response flush xong: client gọi thẳng api, pipelining và không đọc response sẽ giữ được khoảng 1 GB trong khi uploadsInFlight() = 0 — Repro r7/pipeline.ts, client gọi thẳng api: 1 kết nối keep-alive, pipelining HTTP/1.1, client gọi sock.pause() và không đọc response. Prefill 200 GET (URL 4000 ký tự) để làm đầy buffer kernel, rồi gửi 26 upload 42 MB.
- HANDLER=reject: 26/26 thân còn sống (1092 MB), uploadsInFlight() = 0, RSS 1233 MB. 5 s sau vẫn 26. Client đóng kết nối thì về 0.
- HANDLER=replace (handler gán lại req.body): cũng 26/26, RSS 1299 MB. Thứ giữ thân ở ca này là listener 'error' của mục 1. Với http-noerr.ts, ca replace còn 0 nhưng ca reject vẫn 89/89, vì request.body vẫn giữ thân.
- MB=1, không prefill: giữ được 104 thân.
- Probe sửa r7/http-fixprobe.ts (no-op error listener, cộng thêm `req.body = null` trong onSend khi UPLOAD_HANDED): 0/26 cho cả hai handler, RSS khoảng 330 MB.

Cơ chế: response của request pipeline chưa ghi ra được thì nằm chờ trong state.outgoing. 'finish' chưa bắn nên reply/request và req.raw còn sống. Node chỉ ngừng đọc socket khi phần chờ ghi đạt khoảng 16 KB. Không timeout nào áp dụng, vì mọi request đều đã nhận đủ.

Vì vậy câu ở upload-gate.ts:15 ('At most MAX_UPLOADS_IN_FLIGHT × MULTIPART_BODY_LIMIT bytes … live in memory') sai đối với client vào thẳng api.

Phạm vi khai thác:
- docker-compose.prod.yml:136-155: api không có `ports`, chỉ nằm trên network edge/db.
- Caddy (Go Transport) không pipeline sang upstream và đọc ngay response nhỏ, nên từ Internet không khai thác được.
- docker-compose.yml:124-125 (dev) bind 127.0.0.1:3000. — Sửa: Cách gọn nhất: làm như fixprobe. Thay listener 'error' bằng no-op cấp module, và trong hook onSend gán `request.body = null` khi UPLOAD_HANDED (lúc này handler đã xong). Không nên chuyển sang trả slot ở res 'close': response pipeline còn nằm trong state.outgoing thì không bao giờ bắn 'close', nên slot sẽ bị kẹt.
- **Note** Lưới an toàn `net` gắn trên req.raw sẽ trả slot sớm nếu payload là stream bọc (preParsing) kết thúc muộn hơn req.raw — Repro r7/closetiming.ts:
- MODE=plain (đúng cách nối dây ở HEAD): uploadsInFlight() = 1 lúc vào handler và vẫn = 1 sau khi req.raw bắn 'close' (do autoDestroy). Chỉ còn 1 listener 'close' trên req.raw (onRequestAbort của Fastify), nghĩa là net đã được gỡ đồng bộ trong 'end' trước khi 'close' bắn.
- MODE=wrap (PassThrough): vẫn = 1.
- MODE=slow (preParsing trả về Transform có flush chậm 50 ms): uploadsInFlight() = 0 ngay khi vào handler, trong khi handler đang giữ thân. Lý do: req.raw 'close' bắn trước 'end' của stream bọc, nên net chạy khi UPLOAD_HANDED chưa set.

Hiện src/ không có hook preParsing nào. content-type-parser.js:225 truyền kRequestPayloadStream, mà route.js:660 đặt bằng request.raw. Nên đây chỉ là rủi ro khi sau này có người thêm hook. — Sửa: Trong net chỉ trả slot khi `req.raw.aborted || !req.raw.complete`. Hoặc thêm một assert hay test bảo đảm payload === req.raw cho các route multipart.

### Kết luận: không bác bỏ được bản sửa vòng 7 cho lỗi giữ thân upload trên socket keep-alive. Tôi chạy lại toàn bộ script c
- **Minor** Pipelining HTTP/1.1 gửi thẳng vào api: slot trả ở onSend, thân vẫn sống trong hàng đợi response (vượt trần 4 × 42 MB) — Script: r7/s2-pipeline.ts. Trên 1 socket: request đầu chậm (GET /v1/slow 4 s, hoặc 1 upload có handler 4 s), sau đó K upload 42 MB gửi nối đuôi, handler trả 422 ngay.
- Mỗi upload: onSend trả slot (src/http.ts:327-332). Nhưng Node xếp response vào hàng đợi của socket, sau response chậm. ServerResponse còn giữ request Fastify cho tới khi gửi xong.
- Số đo:
  - K=12: 12/12 thân còn sống sau GC (504 MB), uploadsInFlight() = 0 suốt 4 s, RSS 702 MB.
  - K=26: 1092 MB, RSS 1276 MB, vượt mem_limit 1g (docker-compose.prod.yml:144).
  - 2c (request đầu là upload chậm): 12 thân sống, inFlight = 1.
  - Với thân nhỏ, Node xử lý 245 request rồi mới pause socket (outgoingData ≥ 16 KB). Vậy 1 socket có thể giữ khoảng 245 × 42 MB.
  - Khi response chậm trả xong: 0/12, inFlight = 0. Tự hết, không rò vĩnh viễn.
- Câu ở upload-gate.ts:15 ('At most MAX_UPLOADS_IN_FLIGHT × MULTIPART_BODY_LIMIT bytes … live in memory') sai trong ca này.
- Phạm vi: client không với tới trong prod. api chỉ nằm trên mạng edge/db, không publish port (compose prod :136-143). Caddy/Go không pipeline lên upstream và xử lý tuần tự request pipeline từ client.
- Có từ khi trả slot ở onSend (vòng 4/5), không phải do vòng 7. — Sửa: Trong onSend, chỉ trả slot ngay khi response của request này đang đứng đầu socket (`reply.raw.socket?._httpMessage === reply.raw`). Nếu chưa, hoãn tới `reply.raw` 'finish'/'close'. Cách khác: readMultipart từ chối upload (503/429) khi socket đang có response khác chưa xong.
- **Note** Chú thích vòng 7 sai: listener 'error' giữ lại vẫn giữ `body` qua closure context dùng chung — src/http.ts:264 `const onError = (err) => finish(err)` được giữ lại ở :286. Chú thích :268 viết 'Nothing of this read stays referenced from the stream'. Nhưng V8 dùng chung một context cho mọi closure của readBody, và onData giữ `body`. Vì vậy chuỗi tham chiếu là payload → onError → context → body (42 MB).
Chứng minh nhân quả:
- Tôi chép HEAD http.ts sang r7/http-noerr.ts. Chỉ đổi một chỗ: sau finish, listener 'error' thành một hàm no-op cấp module.
- Chạy pipelining 2b với QMODE=replace (handler gán lại req.body như đường thành công):
  - HEAD: 12/12 thân sống (504 MB), RSS 702 MB.
  - Bản no-op: 0/12, RSS 329 MB.
  (r7/s2-causality.out)
Đường thường qua Caddy không bị ảnh hưởng: IncomingMessage chết ngay sau khi trả lời. keepalive.ts, proxy.ts, s6 và s7 đều 0 thân sống.
Vòng 6 giữ mọi listener nên ít nhất cũng giữ thân như vậy. Đây không phải hồi quy, chỉ là bản sửa chưa đúng như lời mô tả, và nó khuếch đại phát hiện Minor ở trên. — Sửa: Trong finish, sau `done(err, out)`, gán `body = null` (khai báo `let body: Buffer | null`). Hoặc gỡ onError và gắn một hàm noop cấp module.
