# PO – Phản hồi review Round 5

- Người trả lời: PO · 06/11/2026 tối · Bước: Phản hồi & sửa.
- Nguồn thẻ: `rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md` mục 3 (tờ dán quầy `product/docs/staff-one-pager.md`, commit `8d607f98`). Trạng thái cũng ghi ngay dưới từng thẻ trong tệp review.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-SEC-PO-01 | Fixed | Tờ 1, khối "Check-in online", dòng "Gửi nhầm người": thu hồi link, tạo link mới; ghi sổ giao ca mã đơn, giờ gửi, giờ thu hồi, kênh (không ghi tên khách, không ghi tên hay số người nhận nhầm); **báo chủ đầu tư trong ngày**; đơn đã hiện **Đã làm thủ tục trước** mà khách nói chưa gửi thì không dùng giấy tờ đó, báo chủ đầu tư ngay. Lệnh dừng của chủ đầu tư tách gạch riêng. PO bỏ giả định "không báo" theo quyết định SEC. Chờ SEC đọc lại một dòng này rồi INV in Tờ 1 |
| FB-R5-SEC-PO-02 | Fixed | Tờ 1 gạch 2: gửi riêng 1–1 tới số, email hoặc hội thoại OTA **ghi trên đơn**; người xin link từ số khác thì không gửi. Sửa cùng lần với PO-01 |
| FB-R5-SEC-PO-03 | Fixed | Chú thích đầu Tờ 2a bỏ vế "Điều kiện bỏ khối check-in…" |
| SEC mục 5 ý 1 (runbook SR-INC-01) | Accepted | PO xếp **V5-74**, Gói 6, bắt buộc, SEC viết (OPS góp phần kỹ thuật), OPS và DOM review. Hạn 14/11, review 15–16/11 (plan R5 mục 2 Gói 6, mục 6 quyết định 11). Tới khi có, sổ vận hành dùng lớp tạm của FB-R5-SEC-BA-04 |

Tờ 2a: SEC cho in. Phần giữ chỗ chờ DOM đọc; thẻ DOM (nếu có) trả lời ở tệp này khi ORC chuyển tới.

## Review CPY chữ v1.0.5 (`rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md`) – PO chốt phạm vi

Các thẻ dưới gửi UXD. PO chỉ chốt phạm vi (plan R5 mục 6, quyết định 15). UXD sửa rồi đổi trạng thái thẻ thành Fixed.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-CPY-UXD-V105-02 (a) | Accepted – v1.0.5, bắt buộc | V5-23. `sale.quote_text` VI dòng 2, `gw.req.clean_makeup_free`, `gw.req.clean_second_fee`: "căn" → "phòng" theo chữ CPY, cùng lượt sinh lại `quote-copy.ts`. BA sửa sổ tay nếu có trích báo giá mẫu (V5-71) |
| FB-R5-CPY-UXD-V105-02 (b) | Accepted – v1.0.5 cùng lượt C5, nên có | V5-23. `msg.booking_confirmed`, `msg.deposit_received`, `msg.hot_water_issue` dùng "phòng {room}". Không chặn QC; không kịp thì chuyển US-125 (B-SAU) |
| FB-R5-CPY-UXD-V105-02 (c) | Deferred – v1.0.6 | Backlog R5-B-03 (B-QUAY), gộp với C6: dòng phiếu `bill.line.*` và khóa chưa dùng `guest.stay.room`, `guest.late.how_1`, `gw.room` |
| FB-R5-CPY-UXD-V105-06 | Accepted – v1.0.5 cùng lượt C5 | Điều kiện của C5: áp đúng 3 câu EN, VI, RU của CPY. Vì phần (b) thẻ 02 đã nhận, bản VI dùng "phòng {room}" |
| FB-R5-CPY-UXD-V105-07 | Accepted – v1.0.5 cùng lượt C5, nên có | `msg.house_rules_smoking` (3 ngôn ngữ), `msg.bill` RU, `guest.late.done_title` EN/VI theo chữ CPY. RU vào danh sách người bản xứ (CPY mục 3). Không chặn QC; không kịp thì US-125 |
| FB-R5-CPY-UXD-V105-08 | Accepted – v1.0.5 cùng lượt C5 (hoặc C1), nên có | `msg.booking_confirmed` RU: "Предоплата {deposit} получена, остаток {balance} — при заселении." Vào danh sách người bản xứ |
| CPY C6 (ý kiến ngắn) | Deferred – v1.0.6 | Backlog R5-B-03: đổi cả họ `bill.line.*` VI một lượt ("phụ thu" → "phí"), `sale.quote_text_extra_guest_*` (CPY sửa), BA sửa sổ tay cùng lúc. Chữ Desk nội bộ giữ |
| CPY mục 5 – BR-012 thứ tự tên, số phòng | Deferred – B-SAU | Backlog R5-B-04, cùng US-125. PO + ARC xem cách ghép ở `quotes.service.ts` |
| CPY mục 5 – `msg.checkout_reminder` | Đã có quyết định | B-SAU với `{checkout_time}` (plan R5 quyết định 14) |

## Review DOM Tờ 2a (`rounds/round-05/reviews/DOM-on-staff-one-pager-2a.md`, commit `a4e2cb3e`)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-DOM-PO-01 | Fixed | Tờ 2a: "Hết hạn, chưa cọc": Desk tự hủy, nhả căn, báo khách ngay. "Hết hạn, có cọc": không tự hủy, căn vẫn giữ. Mốc 11:00 và cuối ca rà đơn **Đã hủy** lý do **Hết hạn giữ chỗ** qua nút **Tất cả** (Desk không có lọc "Đã hủy") và hộp **Thông báo** của app nhân viên. "Báo quản lý" đổi thành "ghi sổ giao ca, báo chủ đầu tư", vì người trực giữ vai quản lý. Chờ DOM đọc lại |
| FB-R5-DOM-PO-02 | Fixed | Tờ 2a theo chữ DOM. **Tờ 1 dòng "Cọc" đổi:** thêm "(có cọc: xem Tờ 2a)". SEC đọc lại dòng này |
| FB-R5-DOM-PO-03 | Fixed | Người tạo không tự duyệt được; chủ đầu tư duyệt và chi; nơi nhận là tài khoản khách đã chuyển cọc |
| FB-R5-DOM-PO-04 | Fixed | Thêm bước khi khách đến mà đơn vẫn **Giữ chỗ · chờ cọc**; giữ câu "Chấp nhận cọc thiếu" ở nhánh "Vẫn đi" (DOM xác nhận đúng) |
| FB-R5-DOM-PO-05 | Fixed | Chú thích đầu Tờ 2a ghi hai điều kiện gỡ tờ: sổ tay 2.4 viết lại (V5-71); tin giữ chỗ quá hạn chạy đúng trên production |
| FB-R5-DOM-PO-06 | Fixed | Sổ giao ca: đơn có cọc đã hủy ghi "chờ chủ đầu tư hoàn"; không hứa ngày |

Tờ 2a dài hơn bản trước khoảng 5 dòng. Khi in, UXD kiểm còn vừa A5 10 pt. Không vừa thì dùng 9 pt như Tờ 1, hoặc chuyển dòng "chờ chủ đầu tư hoàn" sang sổ tay 2.4 (V5-71) như DOM cho phép ở thẻ 06.

## Review SEC lượt 3 (`rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md` mục 3a lượt 3, commit `00d6816d`)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-SEC-PO-04 | Fixed | Tờ 2a, nhánh "Không đi": thay câu "Nơi nhận: …" bằng nguyên văn câu SEC. Đường bấm **Nhật ký tiền → Hoàn tiền** → **Nhập nơi nhận hoàn** → **Cùng cách khách đã trả** (đổi từ Tiền mặt Desk chọn sẵn). Không hỏi số tài khoản. Khách xin hoàn vào tài khoản khác: không nhập, báo chủ đầu tư. ORC grep "Cùng cách khách đã trả", "Không hỏi số tài khoản" để đóng |
| FB-R5-SEC-PO-05 | Fixed | Tờ 1 dòng Cọc: "(ảnh chụp, SMS khách gửi không tính)", câu SEC đề xuất, không cần đọc lại. Tờ 2a: Giờ nhận tiền "ghi đúng giờ trên tin báo tiền vào, không sớm hơn, không sau bây giờ" |
| FB-R5-SEC-PO-06 | Fixed | Chú thích đầu Tờ 2a: gỡ tờ này thì sửa Tờ 1 "xem Tờ 2a" → "xem sổ tay 2.4". Chữ in không đổi |

Câu SEC gửi DOM ở cuối lượt 3 (tiền về trước hạn mà chưa ai bấm, rồi giữ chỗ bị hủy; khách chuyển theo mã QR cũ sau khi giữ chỗ tự hủy): DOM quyết. PO sửa Tờ 2a theo quyết định đó khi ORC chuyển tới.

## Review DOM Tờ 2a lượt 2 (`rounds/round-05/reviews/DOM-on-staff-one-pager-2a.md` thẻ 07; `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 9, 11)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-DOM-PO-07 | Fixed | Áp bản gộp đúng chữ DOM (gạch "Ở đâu", câu cuối "Hết hạn, chưa cọc", gạch mới "Tiền đã về mà đơn đã tự hủy"). Chỉ đổi nháy đơn thành nháy kép. DOM không cần đọc lại |
| DOM mục 11 (tiền về mà giữ chỗ đã tự hủy) | Fixed | Tờ 2a: kiểm tiền theo mã đơn trước khi hủy hoặc báo khách; còn căn → giữ chỗ mới cùng căn, cùng giá, xác nhận cọc; căn đã bán → chủ đầu tư hoàn đủ. Phần mềm: plan R5 **V5-5B** (BUG-R5-002 của QA; ARC chốt khôi phục đơn hay tạo yêu cầu hoàn, có migration không; có migration thì chờ ĐK-2, không kịp thì v1.0.6). Sổ tay 2.4 thêm bước tay: V5-71 |
| DOM mục 9 (luật A.5 sửa) | Đã xếp việc | Plan R5 **V5-1B**: tin `hold_expired` gửi thêm lễ tân, lễ tân trưởng. Bắt buộc, không migration, không đổi hợp đồng, hạn 14/11 |

- Câu nơi nhận hoàn của SEC (FB-R5-SEC-PO-04) giữ nguyên, không đụng.
- **Tờ 1 không đổi** ở lượt này: SEC không có gì mới phải đọc.
- Không vừa A5 10 pt: in 9 pt, hoặc chuyển phần "đơn để nguyên" của dòng Sổ giao ca sang sổ tay 2.4, như DOM cho phép. Ba câu của thẻ 07 giữ trên tờ.
- Câu SEC gửi DOM cuối lượt 3 (tiền về trước hạn mà chưa ai bấm; khách chuyển theo mã QR cũ): DOM đã quyết ở mục 11, Tờ 2a đã theo.

## Review DOM tài liệu BA v1.0.5 (`rounds/round-05/reviews/DOM-on-ba-v105-docs.md`, `da9ac25d`) – 07/11/2026

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-DOM-PO-08 | Fixed | Tờ 2a gạch **Ở đâu** (câu hộp Thông báo) và vế đầu gạch **Hết hạn, chưa cọc**: dán chữ DOM nguyên văn. Phần sau "Khách còn muốn:…" giữ. Bảng **Cách in và dán** ghi Tờ 2a in bản 07/11 khi PDF dựng lại. Release notes v1.0.5 dòng **Tin giữ chỗ tự hủy** thêm "Tin không đổ chuông…, làm theo trạng thái đơn". Chờ DOM đọc lại một câu trước khi UXD dựng bản in. Không vừa 11 pt thì bỏ câu "Tới v1.0.5…" khi v1.0.5 lên, không cắt "Tin chỉ để nhắc…". Phần sổ tay 2.4, `guides/02`: BA |
| FB-R5-DOM-UXD-02 | Deferred | Thẻ của UXD; PO đưa vào backlog v1.0.6 **R5-B-14** (UXD + CPY → SEC → FE-B). Không chặn v1.0.5 |

- Giả định 1 của DOM (#117 cùng tag) nằm ở plan R5 mục 4a dòng T1. Giả định 2 (push vẫn Mock) nằm ở cuối mục 4a.

## Review ARC #112/#121 (`rounds/round-05/reviews/ARC-on-be-prs-112-121.md`) – 07/11/2026

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-ARC-PO-112-01 | Done | Plan R5 mục 4a thêm **T12** (#112 + FE V5-13 + FE V5-18: thiếu FE thì bỏ hai câu ở dòng **Trả phòng và tiền ở quầy**; thiếu FE V5-13 thì lời dặn v1.0.4 "hỏi quản lý" – ca CO-01b – thành giới hạn của v1.0.5, đích v1.0.6) và **T13** (chặn: Desk đọc `lockReason` không vào tag thiếu #112). Quyết định 28 |

## Review DOM BE-H #110/#131 (`rounds/round-05/reviews/DOM-on-be-h-prs-110-131.md`) – Phản hồi & sửa, 07/11/2026

PO làm luôn phần sửa của BA ở sổ tay `01` (ORC giao). Commit `8f875e29`.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-DOM-BE-110-02 | Done | Plan R5 mục 4a **T5**: điều kiện là **PR #133 @ `0636f2fc`** (BE-A2 `r5-v516-minibar`, xếp trên #110), thay commit `0b2ebb45`; kiểm lúc cắt `git merge-base --is-ancestor 0636f2fc <tag>`; head #133 nay `1082cb82`, vẫn chứa `0636f2fc`. Release notes v1.0.5, chú thích nguồn **Giới hạn đã biết** (dòng Đóng ca, dòng Minibar): điều kiện là #133. Sổ tay `01` mục 8.1, chú thích nguồn: "#133 (BE-A2 `r5-v516-minibar`, xếp trên #110) có trong tag"; lối lùi `d467578b` khi thiếu #133, áp ở mục 8.1, dòng đầu tệp và dòng "Mỗi tuần" 2.1. Chữ chủ đầu tư đọc không đổi. Quyết định 31 |
| FB-R5-DOM-BE-110-04 | Done | Sổ tay `01` mục 8.1, khối **Từ v1.0.5 – bộ lọc Sửa giảm dòng – 7 ngày**: gạch "Mở từ dòng **Cần chú ý**" thêm câu tháng lên v1.0.5; gạch "Không gồm tiền đêm" thêm câu phụ thu trả muộn tính lại khi đổi giờ trả. Đúng chữ DOM, đặt cuối mỗi gạch. Lịch sử tệp: bản 1.16, bổ sung lượt 5 |
| ARC mục 7 (PO thêm hai dòng vào plan 4a) | Done | **T18** (chặn tag): PR "audit visibility" của BE-H, SEC 131-01 + ARC 131-01. **T19** (chặn PR-M, hạn 01/12): `r5-h1c`, DOM 131-01 + ARC 131-02. Cùng ở quyết định 31 |

- Còn lại cho BA: chú thích nguồn ở `02-le-tan.md` (khối đếm lại minibar) và `user-manual-v1.0.md` (mục bộ lọc 7 ngày, khối đếm lại minibar) vẫn lấy #110 làm điều kiện. Chữ chủ đầu tư đọc không sai; chỉ sửa chú thích khi BA mở tệp lần tới.
- DOM 131-01 ý 4 (dòng **Giới hạn đã biết** "Sửa người chốt"): PO thêm lúc cắt tag nếu `r5-h1c` chưa gộp. Chữ đã ghi sẵn ở plan 4a T19.
