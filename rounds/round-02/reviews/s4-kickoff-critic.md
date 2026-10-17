# Critic độc lập – khởi động Sprint 4 (17/10/2026)

> Workflow s4-kickoff (wf_01ee8899-514). Đầu vào cho bước D1 đóng băng (s4-d1-freeze).

## Thiếu sót

### (a) Người làm, thời điểm, và việc bị đẩy sang R3

1. **[Major] Kế hoạch và bảng việc của ARC giao module buồng phòng/bảo trì cho hai người khác nhau.**
   - Kế hoạch mục 8.3 và mục 13 giao housekeeping/maintenance cho BE-C (có nhãn `[GIẢ ĐỊNH – ORC xác nhận]`).
   - `outputs/ARC/openapi-0.3.7.md` mục 7, dòng BE-A, lại giao cho BE-A toàn bộ nhóm H: buồng phòng, việc HK, kiểm phòng, `listInspections`, phiếu sửa, khối OOO, J8/J11, `getTonightKpi`, `getArrivalsDepartures`, thông báo HK/MT. Mục 4 B-14 cũng ghi "`room_status` sang module housekeeping – BE-A".
   - Hệ quả: BE-A đã thiếu khoảng 1,5 ngày. Nếu theo bảng ARC thì BE-A quá tải nặng. Nếu theo kế hoạch thì một phần việc của EP01 không có ai nhận rõ.
   - **Sửa:** ORC chốt một bảng phân việc duy nhất ở D1. ARC sửa mục 7 cho khớp với kế hoạch: nhóm H thuộc BE-C; `getTonightKpi`, `getArrivalsDepartures`, SSE thuộc BE-A. Ghi vào decision-log.

2. **[Major] ARC đã áp phần nháp nhóm D vào hợp đồng, nhưng phần này không có người làm, không được phân loại và không có trong ước lượng.**
   - Các mục: B-2 `availableOperations`, B-3 `getGuestSession`, B-4 `deferredPeople`, B-5, B-7, B-8, B-9, B-11, B-12.
   - Có một thay đổi hành vi gây vỡ: #6 bắt buộc `expectedVersion` khi duyệt hoặc từ chối `refund`. Khi BE cài xong mà Desk chưa gửi trường này, luồng duyệt hoàn tiền sẽ hỏng.
   - Kế hoạch mục 8.2 chỉ nhắc "Mục A bản nháp". Mục 8.3 không có dòng nào cho những việc trên.
   - **Sửa:** PO phân loại từng mục là CỔNG, NÊN, hoặc "hợp đồng đi trước, cài ở R3". Riêng #6 phải là CỔNG, BE và FE-A làm trong cùng một PR. Mục nào chưa cài thì ghi "contract-ahead" để QC không coi là lệch hợp đồng.

3. **[Minor] Phân loại BUG-R2-078 mâu thuẫn trong cùng kế hoạch.**
   - Mục 6, S4-50b xếp 078 (P2, cột "Còn phải thu" trống) vào NÊN-ÔĐ, tức "không sang R3".
   - Mục 12.3 bước 2 lại ghi "BUG-078 → R3".
   - **Sửa:** bỏ 078 khỏi bước 2. Đưa nó vào bước 6 (sang giai đoạn Ổn định).

4. **[Minor] Một số mục có liên quan đến tiền bị xếp NÊN và nằm trong thứ tự cắt sang R3, trái quy tắc ORC "mục sai tiền phải sửa trước cổng S4".**
   - S4-37: trần `otaPenaltyVnd` cộng cả phụ thu người. Vòng 5 gắn nhãn MONEY, chưa tái hiện được sai tiền.
   - S4-47: thu trước B18 vượt số còn phải thu.
   - S4-04: bản xem trước B14 lệch với số ghi thật.
   - **Sửa:** đưa ca `otaPenaltyVnd` và S4-47 vào phạm vi S4-38. Nếu vòng kiểm chứng xác nhận là không sai tiền thì ghi lý do vào decision-log rồi mới cho cắt. Với S4-04 xem mục 9.

5. **[Minor] Một số việc còn mở chưa có người nhận trong kế hoạch.**
   - ĐK-S3-1 (ghi mục 6c `demo-1.md`) không có trong kế hoạch.
   - Các việc DOM chuyển cho vai khác chưa vào bảng 8.3:
     - INT sửa `zalo-oa.md` mục 3 theo `contact_source` (BR-972);
     - QA sửa tình huống #14 theo BR-978;
     - PO đưa SEC DOM-04 vào US-161.
   - **Sửa:** thêm vào mục 8.3. Các việc này đều NÊN, không chặn cổng.

6. **[Minor] Cách đóng S4-17 phụ thuộc vào máy chủ.**
   - G2 yêu cầu "S4-17 đóng".
   - Mục S4-17 trong carryover ghi "kiểm cùng S4-15", mà S4-15 cần Caddy thật, tức cần VPS.
   - **Sửa:** ghi rõ S4-17 đóng bằng test cục bộ (body về `null`, giới hạn pipelining). Phần kiểm qua Caddy thật để ở S4-15.

### (b) Hợp đồng 0.3.7 so với story và AC của Sprint 4

7. **[Major] Hợp đồng chưa có trường nào cho BR-012 (tên phòng hiển thị), trong khi S4-49 và S4-52 là CỔNG.**
   - `GuestStay` chỉ có `roomNo` (`openapi.yaml` khoảng dòng 10846). Không có `roomName` hay hạng phòng công khai. Như vậy guest-web đang trả số căn cho khách, trái BR-012 (1).
   - `Room.name` có nhưng không có mô tả. Không có `publicRoomType` ở đâu cả (cả ERD).
   - HK/MT không được gọi `listRooms`. Trong khi `RoomStatusEntry`, `HkTask`, `WorkOrder` chỉ có `roomNo`, nên PWA không hiện được "401 · The Pine".
   - `labelParams.room` của dòng bill chưa nói là tên hay số. Bill đã chốt cần giữ tên lúc chốt (BR-012 (5)).
   - Đơn OTA theo nhóm "chưa báo căn" (BR-012 (4), AC6 `inventory_optimize`) không có cờ để biết khách đã được báo căn hay chưa.
   - Kế hoạch mục 8.2 #7 có yêu cầu những trường này, UXD B4 cũng yêu cầu. ARC không làm và không ghi lý do.
   - **Sửa (ARC, trước khi đóng băng D1):**
     - `Room.publicRoomType`;
     - `GuestStay.roomName` và `publicRoomType`; ẩn `roomNo` với khách (hoặc chỉ trả cho nhân viên);
     - `roomName` trong `RoomStatusEntry`, `HkTask`, `WorkOrder`, `MovePreview`;
     - quy ước `labelParams.room` = tên phòng, kèm snapshot khi `settled`;
     - cờ `roomDisclosedToGuest` trên đơn;
     - tìm căn theo tên.

8. **[Major] Hợp đồng thiếu nhiều trường mà quy tắc FOC v0.3.5 (S4-02, S4-18, S4-22, đều là CỔNG) cần.**
   - Mã audit `folio.foc_cancelled` không có trong tập đóng `AuditEvent.action` (dòng 10109). Theo mô tả, đây là tập đóng: thêm mã mới là đổi hợp đồng, BE có test kiểm. M1 và BR-433 lại bắt buộc ghi mã này.
   - `ApprovalRequest` không có:
     - số đang áp (min(số xin, dòng));
     - trạng thái FOC: áp, ngủ, tạm dừng;
     - ghi chú "dòng đã đổi: giá cũ → giá mới, khi duyệt sẽ áp X" mà BR-434 bắt người gửi và hàng chờ phải thấy.
   - `StaffNotification.kind` không có loại nào cho "yêu cầu tự hủy, báo người gửi và người đã nhận thông báo duyệt".
   - **Sửa (ARC D1):** thêm `folio.foc_cancelled`, và nếu cần thì `folio.foc_dormant`/`foc_restored`. Thêm `ApprovalRequest.effectiveAmountVnd`, `focState`, `lineChangedNote`. Thêm kind `approval_cancelled`. QA thêm ca kiểm tập đóng.

9. **[Major] S4-08 (CỔNG, sai tiền) chưa có trường trong hợp đồng.**
   - `cancelReservation` và `CancellationQuote` không có danh sách dòng dịch vụ đã hoặc chưa thực hiện.
   - Cũng không có trường để lễ tân chọn giữ dòng nào, kèm lý do.
   - **Sửa:**
     - `CancellationQuote.serviceLines[]` gồm `lineId`, `performed`, `amountVnd`;
     - `cancelReservation.retainLines[{lineId, reason}]`;
     - bổ sung mô tả cho `dryRun`.

10. **[Major] Bản xem trước B7 phải khớp từng đồng với lệnh ghi, vì có `expectedDeltaVnd` / 409 `SURCHARGE_CHANGED`. Nhưng lỗi cùng loại với S4-04 lại bị xếp NÊN và nằm trong thứ tự cắt.**
   - Nếu `previewMoveReservation` tính FOC theo cách khác lệnh ghi (FOC lớn hơn giá mới, FOC chờ duyệt), lễ tân sẽ bị 409 lặp lại và không lưu được.
   - **Sửa:** viết rõ trong M2 rằng preview và move dùng chung một hàm tính. Thêm ca BR-434-06 và BR-434-09 chạy qua preview rồi move. Sửa S4-04 cùng S4-21 và xếp CỔNG.

11. **[Medium] Phần dời Sprint 4 của US-136 thiếu loại sự kiện trong hợp đồng.**
   - AC2 có việc "Báo no-show trên kênh" cho đơn OTA. Hợp đồng không có attention kind hay việc tương ứng; mô tả `restoreNoShow` còn ghi "R2 chưa lưu đã báo kênh".
   - AC4 cần "thông báo MGR" khi đánh dấu hoặc khôi phục no-show. `StaffNotification.kind` không có loại `no_show_*`.
   - Kế hoạch mục 5.2 vẫn giao US-136 AC2/AC4 cho BE-A và FE-B.
   - **Sửa:** ARC thêm attention kind `ota_no_show_report` và notification `no_show_marked`/`no_show_restored`. Nếu không thêm thì PO dời hai AC đó, có ghi lý do.

12. **[Minor] Vài khoảng trống nhỏ khác trong hợp đồng.**
   - `MovePreview` không có thành phần giảm giá khách quay lại (BR-111), dù AC5 yêu cầu hiện.
   - S4-43 (P-S4-6): x-scope mới chỉ phủ khoản hoàn "đã duyệt, chưa chi đủ". Khoản `pending` chưa có nơi nhận thì chưa phủ.
   - Chưa rõ S4-06 dùng attention kind nào (không phải `deposit_after_cancel`).
   - ARC không có ghi chú nào về S4-35 (mục 8.2 #6).
   - **Sửa:** ARC trả lời từng điểm trong `s4-contract.md` ở D1.

### (c) Quy tắc DOM so với kế hoạch và hợp đồng

13. **[Medium] Có ba câu hỏi ARC đã chuyển cho DOM mà DOM chưa trả lời. Trong đó có một câu chạm M4 (CỔNG).**
   - Phụ thu nhận sớm có FOC đang chờ duyệt thì có tính vào `balance_paid` hay không. Câu này quyết định cách BE-A cài `checkIn.payment`.
   - `until_parent_departure` có sinh `priority_clean` hay không.
   - Phương án dự phòng 24 giờ (câu này thuộc SEC).
   - **Sửa:** DOM chốt trong D1, trước khi BE-A làm M4. Thêm ví dụ vào `br-examples.json`.

14. **[Medium] BR-429 (a) chưa nói gì về giá đã sửa tay hoặc giá thỏa thuận theo đơn.**
   - BR-429 (a) ghi "mọi đêm lấy lịch giá hiện hành".
   - Mô tả `adjustFolioLine` (S4-35) lại cam kết "không bao giờ tự đảo giá đã sửa".
   - Như vậy khi khách tự xin đổi căn, giá đã chỉnh trong khung BR-105 hoặc giá thỏa thuận có bị xóa hay không là chưa rõ.
   - **Sửa:** DOM thêm một điểm vào BR-429, cùng ví dụ. Hướng đề xuất: giữ chênh lệch thỏa thuận theo tỷ lệ, hoặc báo lễ tân xác nhận lại.

15. **[Medium] S4-23 (thứ tự áp giảm giá đặc biệt và FOC trên cùng một dòng) vẫn để NÊN.**
   - P-S4-1 và BR-429 hướng dẫn: muốn tặng phần chênh thì dùng giảm giá đặc biệt. Như vậy trường hợp giảm giá đặc biệt và FOC cùng nằm trên một đêm sẽ gặp thường hơn.
   - Khi đó "giá trị dòng" dùng để tính min() không rõ là trước hay sau phần kia. Đây có thể là sai tiền, không chỉ lệch báo cáo.
   - **Sửa:** DOM trả lời S4-23 trước khi BE-A làm S4-21. Nâng S4-23 lên CỔNG, hoặc thêm ràng buộc "tối đa một khoản miễn hoặc giảm trên mỗi khóa".

16. **[Minor] Nhắn tin khách: BR v0.3.5 mô tả hành vi tự động hoặc theo danh sách, trong khi Sprint 4 không lập trình phần nhắn tin.**
   - BR-429 (d) ghi "gửi tin TP-15 đơn đã đổi". BR-979 sinh việc trên "Hôm nay"/"Cần chú ý" (`eta.followup_time` 12:00). BR-973 (1) nhắc danh sách "Tin cần gửi hôm nay" (US-161, R3).
   - Sprint 4 không lập trình nhắn tin (ESC-021 A). AC5–AC7 cũng không nói lễ tân phải báo khách bằng cách nào.
   - **Sửa:** DOM hoặc PO ghi rõ trong BR (hoặc trong ghi chú US-024 và US-012): "Sprint 4: lễ tân báo tay qua OA hoặc OTA. TP-15 và BR-979 tự động ở R3."
   - Kế hoạch mục 9.2 cũng nên liệt kê các quy tắc áp ngay khi chat tay: BR-978 (không gửi mã cửa), BR-973 (khung giờ), BR-981 (không gửi ưu đãi cho khách OTA).

17. **[Minor] Một quy tắc kinh doanh đang nằm ở PO thay vì DOM.**
   - `[GIẢ ĐỊNH – PO]` "ESC-019 không áp cho đơn dài hạn nhập tay" không có trong BR-429.
   - **Sửa:** DOM ghi điều này vào BR-429 (phạm vi), để BE và QA đọc từ một nguồn.

### (d) Token màu: AA và bảng màu thương hiệu

Tôi tự tính lại các cặp chính: không cặp chữ bắt buộc nào dưới 4,5:1. Stone trên Cream đạt 4,53:1; Sage Deep `#646859` đúng là Sage 60% pha Ink 40%. Phần màu đạt. Còn ba điểm nhỏ:

18. **[Minor] `--bar-cf` `#C9A56E` được ghi là "tint Light Oak" nhưng không phải tint một màu.**
   - Tỷ lệ pha với Ivory khác nhau theo kênh: R 0,37 / G 0,24 / B 0,16. Tức đây là một sắc vàng mới, trái quy tắc DS 2.0 "không tạo sắc mới".
   - Độ tương phản của thanh so với nền chỉ 2,03:1. Thanh vẫn có chữ và icon nên không vi phạm AA.
   - **Sửa:** UXD sinh lại màu bằng cách pha Light Oak với Ivory theo một tỷ lệ duy nhất, hoặc ghi rõ là ngoại lệ ở DS 2.4.

19. **[Minor] Màu `--info` (xanh `#3E5E78`) vẫn dùng rộng cho trạng thái không phải cảnh báo.**
   - Đang dùng cho OC "Có khách", khai báo `scanned`/`pre`, yêu cầu khách `acknowledged`/`in_progress`.
   - Lý do UXD bỏ màu xanh khỏi thanh "dài hạn" là vì nó ngoài bảng màu. Cùng lý do đó nên áp ở đây.
   - **Sửa:** giới hạn `info` cho alert. OC dùng Ink hoặc Stone kèm icon.

20. **[Minor] Kế hoạch chưa ghi các ràng buộc triển khai của UXD.**
   - B0 và B1 phải vào cùng một bản build: `--mono` mới mà chưa tải font JetBrains Mono thì mã sẽ hiện bằng Courier New.
   - Font phải tự host trên guest-web và landing (C-1).
   - guest-web đổi mặc định sang tiếng Anh: UXD ghi `[GIẢ ĐỊNH – PO xác nhận]`, nhưng kế hoạch không có quyết định P-S4 nào về việc này.
   - **Sửa:** thêm B0+B1 vào dòng FE-B và MOB của mục 8.3, và thêm P-S4-10 cho ngôn ngữ mặc định của guest-web.

### (e) Năng lực và điểm cắt

21. **[Major] Điểm cắt hiện tại không gỡ được nút thắt thật là BE-A và BE-B.**
   - Gần như mọi việc của BE-A và BE-B nằm trong danh sách "không bao giờ cắt":
     - BE-A: CỔNG khoảng 9,5 ngày;
     - BE-B: CỔNG khoảng 9,25 ngày.
   - Cộng 30–50 % làm lại (Sprint 3 mất 9 vòng sửa) thì nhu cầu là khoảng 12–14 ngày, trên năng lực 10 ngày. Bước 1–7 của mục 12.3 chỉ gỡ được khoảng 2 ngày của BE-A (phần NÊN) và gần 0 của BE-B.
   - EP01 (`getTonightKpi`, "Cần chú ý", SSE) đứng cuối hàng của BE-A, có thể bắt đầu từ D6. Trong khi A7 thuộc G4, mà G4 là điều kiện bắt buộc cả khi ĐẠT CÓ ĐIỀU KIỆN. FE-B dư 1,5 ngày nhưng lại chờ EP01.
   - Kiểm chứng đối kháng chạy D6–D8. Nếu tìm ra lỗi mới thì chỉ còn D9–D10, không có chỗ cho một lượt kiểm chứng lại.
   - **Sửa:**
     - (1) Thêm mốc kiểm có ngày: D3 S4-07, S4-05, S4-02 và S4-18 xong mã; D5 M1 xong mã; D7 có báo cáo S4-38. Trễ mốc nào thì tự động chạy bước 4 (dừng FE-LP) và chuyển việc.
     - (2) Chuyển việc ngay từ D1: FE-B nhận S4-26, S4-29, S4-30 (FE-A đang 10,5). Phần đọc của EP01 (`getArrivalsDepartures`, S4-31) chuyển cho BE-C nếu module HK xong trước D6, hoặc cho người thứ hai.
     - (3) Ghi rõ trong mục 11.2: nếu đến D8 G1 vẫn chưa xanh thì cổng S4 lùi vào tuần Ổn định. Không ép duyệt cổng khi chưa đủ.

22. **[Medium] QA đang quá tải nhưng không có điểm cắt nào cho QA.**
   - QA đang ở khoảng 10,5 ngày, chưa tính:
     - chạy lại toàn bộ ca UI và axe sau khi đổi token (T9);
     - kiểm chứng đối kháng;
     - kiểm lại 7 lỗi tiền;
     - E2E A1/A4 có PWA;
     - TC cho LP-v1.
   - Mục 12.3 không có bước nào bớt việc cho QA.
   - **Sửa:** thêm vào thứ tự cắt: TC LP-v1 dừng cùng FE-LP; S4-33 sang giai đoạn Ổn định; T9 chỉ chạy lại các ca UI có trong `WRITES` và A1/A4, phần còn lại chạy hằng đêm.

23. **[Minor] Kế hoạch coi `booking@ottimo.vn` và tên miền là đã có.**
   - Tên miền chưa mua xong (Mắt Bão, hẹn 19/10).
   - Tin INV trả lời gần nhất xếp "email chung" vào nhóm "nợ, thứ Hai gửi đủ". Decision-log thì ghi INV đã xác nhận.
   - **Sửa:** giữ nhãn `[GIẢ ĐỊNH – xác nhận 19/10]` cho cả địa chỉ email lẫn tên miền. Không cấu hình SPF/DKIM trước khi có tên miền thật.

## Kết luận

**Kế hoạch dùng được nhưng chưa nên đóng băng.**

Phần tốt:
- Mọi mục S4-xx và mọi lỗi P0/P1 đang mở đều có người làm và có chỗ trong lịch. Không lỗi tiền nào trong 055…061 bị đẩy sang R3.
- Ví dụ số của ESC-019 trong BR-429 v0.3.5, US-024 AC5–AC7 và `MovePreview` khớp nhau, đã đối chiếu từng con số.
- Token v0.4 đạt AA và nằm trong bảng màu, ngoài ngoại lệ đã ghi. Chỉ còn ba điểm nhỏ ở mục (d).

Cần xử lý trong D1, trước khi đóng băng hợp đồng:
1. Hợp đồng thiếu trường cho các việc CỔNG: BR-012 tên phòng (mục 7), FOC v0.3.5 gồm `folio.foc_cancelled` và trạng thái FOC trên yêu cầu duyệt (mục 8), S4-08 (mục 9).
2. Hai bảng phân việc lệch nhau và phần nhóm D chưa ai nhận (mục 1, 2).
3. DOM chưa trả lời giả định `balance_paid` của M4, và các câu S4-23, giá thỏa thuận khi đổi căn (mục 13–15).
4. Điểm cắt không chạm tới BE-A/BE-B, cần mốc kiểm có ngày và chuyển việc (mục 21).

Nếu bốn điểm này xong trong D1, kế hoạch đủ điều kiện để ORC duyệt. Nếu không, nhiều khả năng cổng QC Sprint 4 KHÔNG ĐẠT ở G1 hoặc G4.

Tệp đã đọc (không sửa tệp nào):
- `/Users/anhvh/Desktop/hotel-app/rounds/round-02/sprint-4-plan.md`
- `/Users/anhvh/Desktop/hotel-app/product/docs/api/openapi.yaml`
- `/Users/anhvh/Desktop/hotel-app/rounds/round-02/outputs/ARC/openapi-0.3.7.md`
- `/Users/anhvh/Desktop/hotel-app/product/docs/business-rules.md`
- `/Users/anhvh/Desktop/hotel-app/product/tests/fixtures/br-examples.json`
- `/Users/anhvh/Desktop/hotel-app/product/design/design-system.md`
- `/Users/anhvh/Desktop/hotel-app/product/design/wireframes/assets/tokens.css`

---

# Kiểm lại trước đóng băng D1 (s4-d1-freeze, wf_6cbf72aa-e9b)

## Kết quả

**Các bước kiểm tra trên cây làm việc (17/10, 18:0x, sau khi ARC/DOM/PO/UXD/QA đã ghi xong): đều xanh**

| Kiểm tra | Kết quả |
|---|---|
| `gen-openapi-meta.mjs --check` | up to date, exit 0 |
| `api-client gen.mjs --check` | up to date, exit 0 |
| `gen_rbac_cases.py --check` | 192 op, 2.112 ca, R3 286, mismatch [], exit 0 |
| `gen_traceability.py --strict` | exit 0: AC 254/254, chạy được ở R2 254/254, dup [], unknown ops [] |
| openapi-spec-validator 0.7.2 (`openapi.yaml`, `openapi.test.yaml`) | OK / OK |
| Redocly 1.34.21 | 0 lỗi, 4 cảnh báo cũ (`operation-4xx-response`) |
| `check-no-test-surface.sh spec` | OK |
| vitest `module-boundaries` + `contract` (thêm) | 10/10. Tập đóng audit và `money-actions.ts` khớp nhau |

Lưu ý: `docs/qa/traceability.md` đã commit lệch 1 ô so với bản sinh mới. Dòng US-136, cột ERD, thiếu `4.12`. CI không đỏ vì CI ghi ra tệp tạm, nhưng QA nên sinh lại trước khi commit.

**(1) Trường hợp đồng cho mục CỔNG: Đạt**
- **BR-012 (#7): đủ.**
  - `Room.publicRoomType` (ERD `room.public_room_type`).
  - `GuestStay`/`GuestSession` có `roomName` + `publicRoomType`; `roomNo` phía khách đã deprecated, ghi "server không trả".
  - `roomName` có trên `RoomStatusEntry`, `HkTask`, `WorkOrder`, `GuestRequest`, `MovePreview`.
  - `Bill.roomName`; `Bill.roomNo` deprecated.
  - `labelParams.room/from/to` là tên phòng, có snapshot `folio.settled_room_names`.
  - `Reservation.roomDisclosedToGuest`, PATCH chỉ nhận `true`.
- **FOC v0.3.5 (#8): đủ.**
  - Bốn mã `folio.foc_cancelled/dormant/suspended/restored` đã có trong tập đóng `AuditEvent.action` và trong `money-actions.ts`.
  - `ApprovalRequest` có `effectiveAmountVnd`, `focState` (4 trạng thái), `focCancelReason`, `lineChangedNote`, `autoCancelReason`.
  - `StaffNotification.kind` có `approval_cancelled`.
  - ERD 4.6 có CHECK cho `foc_state`; hạn mức chỉ tính `applied`/`dormant`.
- **S4-08 (#9): đủ.**
  - `CancellationQuote.serviceLines[]` (`lineId`, `category`, `amountVnd`, `performed`, `retained`, `retainReason`), `serviceReversedVnd`/`RetainedVnd`, `refundRequestVnd`.
  - `retainLines[{lineId, reason}]` có ở cả `cancelReservation` và `markNoShow`; mô tả `dryRun` ghi thử và lưu dùng cùng hàm tính.
- **#10: đủ.** `previewMoveReservation`, `moveReservation` và `changeRoom` `dryRun` ghi rõ "một hàm tính", có thêm `returningGuestDiscountPct`, `pendingFocVnd`, `external_contract`. S4-04 đã là CỔNG.
- **#11: đủ.** Có attention `ota_no_show_report` và thông báo `no_show_marked`/`no_show_restored`; mô tả `restoreNoShow` đã sửa.
- **#12: đủ.** Phạm vi `own_or_refund_queue` / `within_limit_or_own_or_refund_queue` đã ở `listApprovalRequests`; có `closed_reservation_credit`.
- Theo DOM: mô tả `checkIn` đã theo BR-402 v0.3.6, không còn nhãn GIẢ ĐỊNH. `changeRoom.stayScope` không sinh sẵn việc dọn và có `roomReturnRecorded`.
- Điểm nhỏ: mô tả `expectedVersion` vẫn ghi "(nháp B-6)". Nên đổi thành CỔNG để QC không đọc nhầm.

**(2) Bảng phân việc duy nhất và phân loại nhóm D: Chưa (chỉ còn sửa chữ, không đổi trường)**
- Bảng ORC đã được áp khớp vào plan 8.3/5.1/5.2/12.1 và `openapi-0.3.7.md` mục 7. Nhóm H và B-14 thuộc BE-C. EP01 đọc + SSE + EP14 + US-136 AC2/AC4 thuộc BE-D. #6 do BE-B + FE-A làm cùng một PR. S4-26/29/30 thuộc FE-B. Phần này đạt.
- **B-4 `deferredPeople` vẫn có hai cách phân loại:**
  - `openapi.yaml` dòng 302, `openapi-0.3.7.md` mục 4 (dòng 116) và dòng MOB ở mục 7 ghi **CỔNG**.
  - Plan 8.2b và P-S4-13 ghi **contract-ahead R3**.
  - Mã nguồn ủng hộ PO: guest-web chỉ gửi `deferredPeople` ở `completeOnlineCheckin` (`apps/guest-web/src/checkin/CheckinFlow.tsx:74`, `DocumentsStep.tsx:51`). Lý do của ARC, "guest-web đã gửi trường này", sai với `updateOnlineCheckin`.
  - Cần ARC sửa một dòng mô tả trong `openapi.yaml` và mục 4/7 của `openapi-0.3.7.md` theo PO, hoặc PO nâng lại CỔNG. Phải chốt một bên.
- **S4-23 chưa đồng bộ.** ORC, DOM và ARC đều coi S4-23 là CỔNG, BE-B cài trong hàm đồng bộ của S4-02. Nhưng plan vẫn ghi "chờ DOM", NÊN hoặc "theo DOM" ở các chỗ: mục 4 bước 4, mục 6 dòng S4-23, mục 8.3 dòng BE-B ("NÊN: S4-23"), 12.3 bước 2 và danh sách "không bao giờ cắt", mục 14. `s4-carryover.md` dòng S4-23 cũng vậy.
- Ghi chú A.3 cũ "cùng PR migration BE-B" còn ở `openapi-0.3.7.md` 5.3 và `openapi.yaml` dòng 282. Phân loại đúng (BE-C) đã có ở dòng 302 và mục 4.

**(3) Câu trả lời DOM (#13–#17): Đạt**
- Tôi tự tính lại các ví dụ, đều khớp:
  - **BR-402-01:** 3×700.000 − cọc 600.000 = 1.500.000; cộng phụ thu 210.000 = 1.710.000; xin FOC một phần 100.000 thì phải thu 1.610.000.
  - **BR-434-11:** tổng 1.042.000 → 917.000 → 667.000 → 1.042.000. Nếu lấy min riêng từng khoản thì ở 302 ra 792.000 (đêm −125.000). Đảo thứ tự thì vẫn 917.000.
  - **BR-434-12:** khi duyệt sẽ áp 667.000; số xin mới tối đa 0.
  - **BR-429-09:** lịch giá căn mới 3.126.000 (chênh 1.326.000, còn thu 2.626.000). Giữ ưu đãi: 937.331 làm tròn 937.000/đêm = 2.811.000. Đổi do OTTIMO: 1.800.000.
  - **BR-429-10** (dài hạn nhập tay) không tính lại giá.
- Cách chọn của #15 (áp theo thứ tự lúc duyệt, tổng = min(Σ, dòng)) không làm tiền khách phụ thuộc thứ tự, tốt hơn ràng buộc "một khoản mỗi khóa".
- #16 và #17 đã vào BR v0.3.6 và plan 9.2.
- Còn lại thuộc vai khác:
  - Plan mục 13 vẫn giữ `[GIẢ ĐỊNH – PO]` về đơn dài hạn nhập tay; dòng DOM ở 8.3 vẫn liệt kê #13–#17 như chưa làm.
  - QA chưa có TC cho BR-429 (g)/(h) và BR-434-11/12. TC-L2-094 `[UNDECIDED]` và TC-L2-098 nay gỡ nhãn được, vì đã có `roomDisclosedToGuest` và `returningGuestDiscountPct`.

**(4) Năng lực: Đạt, có lưu ý**
- Đã có trong plan:
  - mốc D3/D5/D7 có ngày và người báo (4.1);
  - bảng chuyển việc theo từng mốc, BE-D là luồng nhận việc đầu tiên (4.2);
  - quy tắc lùi cổng ở D8 (4.1, 11.2);
  - FE-B nhận S4-26/29/30 từ D1;
  - ba bước cắt cho QA (QA-1 áp từ D1, QA-2, QA-3), đưa QA từ 12,5 về khoảng 9,75;
  - S4-04, `otaPenaltyVnd` và S4-47 thuộc nhóm không cắt trước khi có kết luận.
- Lưu ý về BE-B (khoảng 10,0, không còn dự phòng):
  - Ước lượng chưa tính S4-23 phần thứ tự (nay CỔNG).
  - Có thể cũng chưa tính phần BR-012 phía folio (`labelParams`, `settled_room_names`, `Bill.roomName`).
  - Thêm 30–50 % làm lại thì vẫn vượt năng lực. Lối thoát duy nhất là chuyển US-066 sang BE-D khi trễ D3, mà việc này không phải việc tiền.
- Đề xuất: chuyển BR-012 phía folio sang BE-A ngay từ D1 (BE-A dư khoảng 2 ngày và đang giữ hàm tính chung), hoặc chuyển US-066/S4-20 sang BE-D từ D1, không chờ trễ mốc. Quy tắc D8 vẫn là chốt chặn cuối.

## Kết luận

**ĐÓNG BĂNG được phần hợp đồng cho mục CỔNG**, có điều kiện. Mọi trường của nhóm (1) đã có và đúng, mọi bước kiểm tra đều xanh. Nhóm (3) và (4) đạt.

**Kế hoạch chỉ nên đóng băng sau ba việc sửa chữ trong D1** (không đổi trường hay operation nào):
1. Chốt **một** phân loại cho B-4 (đề nghị contract-ahead R3, theo mã guest-web). ARC sửa `openapi.yaml` dòng 302 và `openapi-0.3.7.md` mục 4/7, sửa luôn ghi chú A.3 (BE-B → BE-C). Sau đó chạy lại meta/api-client/rbac `--check`, Redocly, spec validator và `--strict`.
2. PO đưa **S4-23 phần thứ tự = CỔNG, BE-B** vào plan (mục 4, 6, 8.3, 12.1, 12.3, 14) và `s4-carryover.md`. Đồng thời bỏ `[GIẢ ĐỊNH – PO]` ở mục 13 và cập nhật dòng DOM ở 8.3.
3. QA sinh lại `docs/qa/traceability.md` (lệch ô US-136, ERD 4.12) trước khi commit.

**Cần theo dõi sau đóng băng:**
- BE-B không còn dự phòng. Chọn một trong hai đề xuất chuyển việc ở mục (4) ngay từ D1.
- QA bổ sung TC cho BR-429 (g)/(h) và BR-434-11/12, gỡ nhãn TC-L2-094/098, viết ca cho tập đóng audit FOC.
- Mô tả `expectedVersion` bỏ chữ "nháp".
- UXD cần chuỗi cho các mã và loại mới. Tới lúc đó FE dùng câu chung `mlog.a_other`.
- Các giả định `[GIẢ ĐỊNH ARC – DOM xác nhận]` (mốc `roomDisclosedToGuest`, danh sách dòng dịch vụ S4-08) và tên miền/email 19/10 vẫn giữ nhãn.

Tệp đã đọc (không sửa tệp nào):
- /Users/anhvh/Desktop/hotel-app/rounds/round-02/reviews/s4-kickoff-critic.md
- /Users/anhvh/Desktop/hotel-app/01-decisions/decision-log.md
- /Users/anhvh/Desktop/hotel-app/rounds/round-02/sprint-4-plan.md
- /Users/anhvh/Desktop/hotel-app/rounds/round-02/s4-carryover.md
- /Users/anhvh/Desktop/hotel-app/product/docs/api/openapi.yaml
- /Users/anhvh/Desktop/hotel-app/rounds/round-02/outputs/ARC/openapi-0.3.7.md
- /Users/anhvh/Desktop/hotel-app/product/docs/erd.md
- /Users/anhvh/Desktop/hotel-app/product/docs/business-rules.md
- /Users/anhvh/Desktop/hotel-app/product/tests/fixtures/br-examples.json
- /Users/anhvh/Desktop/hotel-app/product/apps/guest-web/src/checkin/CheckinFlow.tsx