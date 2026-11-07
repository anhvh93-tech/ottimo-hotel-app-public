# DOM review – OPS PR #155: runbook K14, đếm đơn đổi người chốt (DOM 1H-01)

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #155, nhánh `r5-ops-1h01-query` @ **`2cea3139`**:
  - `rounds/round-05/outputs/OPS/k14-closer-change-note.md`;
  - `rounds/round-05/outputs/OPS/k14-closer-change-counts.sql` (K14, 8 dòng đếm), `k14-closer-change-list.sql` (K14-L);
  - `v1.0.5-release-runbook.md`: bước K14, mục 8 "Giả định K14" (a)–(g);
  - `OPS-responses.md`.
- Đối chiếu:
  - DOM `DOM-on-contract-addendum-1h.md` mục 1.7, thẻ FB-R5-DOM-ARC-1H-01;
  - DOM `DOM-on-be-h-pr-154.md`;
  - hợp đồng 0.3.13 mục 1.30 (#152); SEC `SEC-on-contract-0313-addendum-1i.md` thẻ 1I-02;
  - BR-903 (3)–(4), BR-212.
- Đối chiếu mã:
  - #154 ở head hiện nay `4e81c3be`: `ensureCommission`, `syncCommissionOnly`, `tryEarnCommissions`, PATCH người chốt;
  - check-in và Hủy nhận phòng (`checkin.service.ts`);
  - Desk trên `main` @ `31e12c48`: `ReservationDrawer.tsx`, `MoneyPage.tsx`, chuỗi `mlog.a_closer_changed`; `rack.service.ts` `history`.
- Chỉ review chữ và câu SQL. DOM không chạy câu nào, không xem dữ liệu production. Không có số production ở đây. Không ghi tỷ lệ hay số tiền hoa hồng. Không dữ liệu khách.

## 0. Kết luận

**DUYỆT CÓ ĐIỀU KIỆN.**

- **Câu đếm K14 (8 dòng): DUYỆT nguyên trạng.** Khớp định nghĩa hai danh sách của DOM 1H-01. Giả định (a), (b), (c) đúng (mục 1). SEC ghim và chạy được như bản này.
- **Câu danh sách K14-L: chưa dùng được cho việc chủ đầu tư phải làm.** Giả định (d) "INV xem tên trên Desk" không đúng với Desk hiện nay. Desk không cho thấy người chốt cũ, người chốt hiện tại hay người hưởng của dòng hoa hồng (mục 1.4).

| Mức | Thẻ | Hạn |
|---|---|---|
| **Major** | 155-01 K14-L in tên hiển thị nhân viên (không tên khách, không số) | Điều kiện **trước lần chạy K14-L đầu tiên**. Không chặn K14 đếm |
| Minor | 155-02 câu báo INV trong runbook thay bằng bảng việc ở mục 2; sửa chữ "màn **Hoa hồng**" | Trước lần chạy K14 đầu tiên (chỉ sửa chữ runbook, không đổi SHA câu SQL) |
| Minor | 155-04 Nhật ký tiền ghi "Đổi người chốt:  →" không có tên (FE-A) | Cùng tag có #154, hoặc v1.0.6 |
| Suggestion | 155-03 K14-L thêm cột loại đơn; (b3) có thể gồm đơn đã trả phòng | OPS tự cân nhắc khi sửa 155-01 |
| Suggestion | 155-05 hai chỗ Desk chưa làm được khi chủ đầu tư xử lý K14 (ARC, BE-H) | 0.3.14 / v1.0.6, chỉ khi K14 ra > 0 |

Không ESC.

Đính chính của DOM: review 1h (mục 1.1, 1.7, thẻ 1H-01) viết "chủ đầu tư chi theo màn **Hoa hồng**". Desk hiện **không có** màn hoa hồng cho chủ đầu tư hay quản lý. Chỉ sale/CTV thấy dòng **Hoa hồng dự kiến của bạn** trên đơn của mình (`ReservationDrawer`, chỉ vai sale/CTV). Chủ đầu tư chi ngoài Desk theo sổ của mình. Runbook K14 chép lại chữ đó (mục "Vì sao cần" và K14-L), nên sửa theo thẻ 155-02.

---

## 1. Bốn giả định OPS hỏi

### 1.1 (a) Không lọc loại đơn, có thể đếm thừa – đồng ý

- Thừa là hướng an toàn: chủ đầu tư mở thêm một đơn, không sót đơn nào.
- **Dòng hoa hồng HĐ thuê tháng không vào (b).** Lý do: câu lọc `cm.reservation_id IS NOT NULL`; bản ghi HĐ gắn `lease_contract_id`, ràng buộc `commission_target_check` không cho có cả hai.
- **Đơn dài hạn vẫn có thể vào (a).** Ở OTTIMO hiện không có khách dài hạn đang ở (chủ đầu tư xác nhận 30/10), nên gần như không thừa. Đơn dài hạn nằm ở (a) thì không có việc gì về hoa hồng ngắn ngày: người hưởng theo HĐ lúc ký (BR-212 (c)). Muốn chủ đầu tư thấy ngay thì thêm cột loại đơn ở K14-L (thẻ 155-03).
- Đơn con gia hạn có người chốt riêng thì đếm riêng là đúng, vì mỗi đơn có dòng hoa hồng riêng.

### 1.2 (b) "Sau nhận phòng" = `changed_at ≥ actual_checkin_at` – đồng ý

- Đây đúng là mốc #154 dùng để chặn (`actual_checkin_at` khác rỗng hoặc trạng thái `in_house`/`checked_out`). Câu đếm và luật mới đo cùng một thứ.
- `actual_checkin_at` là **lúc bấm Nhận phòng** (`ctx.now` trong B9), không phải giờ khai. Lần đổi người chốt sau lúc bấm đều vào (a), không sót.
- `reservation_change` ghi cả "ghi người chốt lần đầu" (cũ rỗng → mới), nên ca T-30-3 cũ có vào (a). Đúng chữ 1H-01.
- **Hủy nhận phòng** xóa `actual_checkin_at`, nên lần nhận phòng sau dùng giờ mới. Lần đổi trong lượt đã hủy được coi là trước nhận phòng. Chấp nhận:
  - Hủy nhận phòng là sửa lần bấm nhầm, lượt ở coi như chưa bắt đầu;
  - Desk chỉ cho Hủy khi chưa có dòng folio mới, nên khoảng đó rất ngắn.
  - Cũng vì vậy (a3) "trạng thái khác" gần như không bao giờ > 0. Nếu > 0 thì là ca lạ, báo OPS như runbook đã ghi.
- Đổi đúng giây nhận phòng tính là "sau": đúng, cùng chiều an toàn.

### 1.3 (c) Nhãn "Desk tự sửa lúc trả phòng" (b3) dựa vào `ensureCommission` của #154 – đúng

- #154 nay ở `4e81c3be`: một lần gộp `main`, không xung đột. DOM so `279b5492` (bản DOM đã duyệt ở `DOM-on-be-h-pr-154.md`) với `4e81c3be`: `folio.service.ts` và `reservations.service.ts` không đổi. Luật bỏ qua giữ nguyên: chỉ bỏ qua khi đơn đã có dòng `earned`/`payable`/`paid`, hoặc dòng `projected` của đúng người chốt hiện tại.
- (b3) gồm đơn giữ chỗ, đã xác nhận, đang ở, không nằm ở danh sách 1. Lần đổi cuối của các đơn này là trước nhận phòng. Theo BR-903 (3), người chốt đang ghi trên đơn là người hưởng. Lúc trả phòng, Desk bỏ dòng của người cũ (`closer_changed`) và tạo dòng của người đang ghi. Đúng luật, chủ đầu tư không làm gì.
- Thêm một ý cho OPS: mọi đường "đạt" đều chạy `ensureCommission`: B18 (`checkout.service.ts`), thu nợ hoặc đối soát (`payments.service.ts` `tryEarn`), xóa nợ (`foc.service.ts`). Vậy đơn **đã trả phòng** còn dòng `projected` lệch (folio còn nợ, khoản chờ đối soát), không nằm ở danh sách 1, cũng được Desk tự sửa ở lần đạt. OPS để nhóm này ngoài (b3) là thận trọng, DOM chấp nhận. Việc của chủ đầu tư với nhóm này vẫn là "không làm gì" (mục 2, dòng b2). Muốn gộp vào (b3) thì xem thẻ 155-03.
- Nếu #154 đổi luật `ensureCommission` trước khi gộp thì OPS sửa câu và SEC ghim lại, như (c) đã ghi. Tới `4e81c3be` thì chưa đổi.

### 1.4 (d) Danh sách không có tên, INV xem tên trên Desk – **không đủ**

Chủ đầu tư cần biết ba người để quyết từng đơn:
- **người chốt lúc nhận phòng**: theo BR-903 (3), mặc định là người hưởng;
- **người chốt đang ghi trên đơn**: người quản lý gán, Desk sẽ cho hưởng;
- **người đang giữ dòng hoa hồng**: người Desk ghi là đạt.

Desk hiện không cho thấy cả ba (DOM đọc `main` @ `31e12c48`):

| Chỗ runbook bảo INV xem | Trên Desk hiện nay |
|---|---|
| Người chốt của đơn | Khung đơn (`ReservationDrawer`) **không có** ô người chốt. Người chốt chỉ chọn lúc tạo đơn (`BookingDialog`) |
| "Lịch sử đơn (ai đổi, lúc nào)" | Máy chủ có `getReservationHistory` (gồm dòng `reservation_change` với giá trị cũ/mới dạng id), nhưng Desk **không gọi** chỗ nào. Không có màn lịch sử đơn |
| Nhật ký tiền, dòng "Đổi người chốt" | Hiện chuỗi `Đổi người chốt: {from} → {to}`, FE đọc `before.closer`/`after.closer`. Audit trước #154 rỗng `before`/`after`; từ #154 có `closerUserId` (id), không có khóa `closer`. Hai bên tên đều **trống**. Chỉ thấy ai bấm và lúc nào (thẻ 155-04) |
| "Màn **Hoa hồng** (người hưởng)" | **Không có** cho OWN/MGR. `listCommissions` chỉ được Desk gọi trong khung đơn của sale/CTV, lọc dòng của chính họ |

Hệ quả: với danh sách hiện nay, chủ đầu tư chỉ có mã đơn và nhãn việc. Mở đơn trên Desk vẫn không biết ai là ai, nên không quyết được "giữ người mới hay trả người cũ" trước lúc trả phòng, và không chi đúng người ở kỳ 01/12.

DOM cần K14-L in **tên hiển thị nhân viên** (thẻ 155-01). Đây là dữ liệu tối thiểu cho đúng mục đích, chi hoa hồng đúng người:
- chỉ hiện trên màn hình Terminal của chủ đầu tư, theo kênh (e);
- không vào repo, chat hay subagent;
- không username, email, id, tên khách, tỷ lệ, số tiền hay lý do.

SEC 1I-02 đã tính tới việc truy vấn trả tên hiển thị nhân viên. SEC chỉ đòi chạy qua khối ghim và vai chỉ đọc, không cấm tên. SEC quyết lần cuối khi ghim lại.

Nếu SEC không cho in tên thì chỉ còn cách chờ Desk hiện người chốt và lịch sử đổi cho OWN. Ô người chốt trên khung đơn sẽ đến cùng FE-A (DOM 154-03). Lịch sử đổi và tên ở Nhật ký tiền đến với thẻ 155-04. Khi đó K14-L chỉ giúp chủ đầu tư biết đơn nào cần mở, và kỳ 01/12 có rủi ro chi nhầm. DOM không đề xuất cách này.

---

## 2. Chủ đầu tư làm gì với từng dòng > 0 (để runbook chép vào "Cách đọc và câu báo INV")

Luật chung:
- Bản có #154 cho chủ đầu tư (OWN) sửa người chốt trên Desk cả khi khách đang ở và đã trả phòng, có lý do. Desk chuyển dòng hoa hồng theo người chốt ngay. Vì vậy **sửa trên Desk** thay cho "chi ngoài Desk mà để Desk sai": dòng `earned` để sai người thì lúc có luồng chi (v1.3) Desk sẽ đưa người đó vào kỳ chi.
- Chỉ dòng `earned` mới được chi. Dòng `projected` chưa ai được chi.
- Đã chi ngoài Desk cho người sai: vẫn sửa trên Desk, rồi trừ phần đó ở kỳ chi sau của người đó (BR-212).
- Mỗi lần sửa ghi lý do ngắn, không số tiền, không tên khách. Ví dụ: "K14: trả hoa hồng về người chốt lúc nhận phòng".
- Desk chỉ chuyển dòng hoa hồng khi người chốt **thật sự đổi**. Người chốt trên đơn đã đúng mà dòng đạt vẫn ở người khác thì sửa **hai lần**: đổi sang người đang giữ dòng, lưu; rồi đổi lại người đúng, lưu. Desk sẽ bỏ dòng cũ và tạo dòng cho người đúng, ngày đạt = lúc sửa (thẻ 155-05 ý 1).

| Dòng | Hạn | Chủ đầu tư làm gì (theo K14-L đã có tên) |
|---|---|---|
| (a1) đổi sau nhận phòng, **khách đang ở** | **Trước giờ trả phòng của đơn.** Hạn mềm: lỡ hạn thì làm như (a2) sau đó | So **người chốt lúc nhận phòng** với **người chốt đang ghi**. Lúc trả phòng, Desk cho người đang ghi hưởng.<br>– Đồng ý người đang ghi: không sửa gì. Ghi vào sổ chi "đã xác nhận"; nếu muốn có dấu trên Desk thì thêm một dòng ghi chú nội bộ trên đơn, không số tiền.<br>– Người lúc nhận phòng mới đúng: sửa người chốt về người đó trên Desk, có lý do, trước giờ trả phòng.<br>– Người lúc nhận phòng là "không có" (ghi lần đầu sau nhận phòng) và anh/chị không đồng ý có hoa hồng: Desk chưa bỏ được người chốt (thẻ 155-05 ý 2). Để nguyên, ghi "không chi" vào sổ chi. Dòng Desk ghi đạt lúc trả phòng anh/chị không chi |
| (a2) đổi sau nhận phòng, **đã trả phòng** | Trước kỳ chi kế (01/12) | Xem K14-L cột "người hưởng là người chốt":<br>– `no`: dòng đạt đang ở một người khác người chốt trên đơn, thường là người chốt lúc nhận phòng, vì trước bản sửa Desk không chuyển. Giữ người đang giữ dòng (luật BR-903 (3)): sửa người chốt về người đó, có lý do; dòng đạt giữ nguyên, đơn khớp. Đồng ý người đang ghi: sửa hai lần như luật chung.<br>– `yes`: dòng đạt đã ở người quản lý gán. Đồng ý: không làm gì. Không đồng ý: sửa về người lúc nhận phòng, có lý do. Người lúc nhận phòng "không có": ghi "không chi".<br>– `none`: đơn không có dòng hoa hồng ngắn ngày (đơn dài hạn, hoặc chưa có tỷ lệ lúc trả phòng). Không làm gì |
| (a3) có giờ nhận phòng mà trạng thái khác | Như (a1) nếu khách chưa trả phòng | Ca lạ (mục 1.2). Mở đơn, quyết như (a1). ORC báo OPS và DOM, không kèm số |
| (b1) dòng đạt mà người hưởng khác người chốt | Trước kỳ chi kế (01/12) | Đơn có ở danh sách 1 thì làm theo (a2). Không có ở danh sách 1 (lần đổi cuối **trước** nhận phòng): người chốt đang ghi là người hưởng (BR-903 (3)). Sửa hai lần như luật chung để Desk chuyển dòng đạt sang người đó. Không chi người đang giữ dòng. Lần đổi cuối "none" (lệch mà không có lần đổi): ca lạ, anh/chị quyết người hưởng; ORC báo DOM, không kèm số |
| (b2) dòng dự kiến lệch | Không gấp | Chưa ai được chi.<br>– Phần (b3): không làm gì.<br>– Đơn đã trả phòng còn nợ hoặc còn khoản chờ, không ở danh sách 1: Desk tự sửa ở lần đạt (thu xong nợ, đối soát, xóa nợ). Không làm gì.<br>– Đơn có ở danh sách 1: theo (a1)/(a2).<br>– Đơn đã hủy hoặc không đến mà còn dòng dự kiến: không chi; ORC báo DOM (ca lạ), không kèm số |
| (b3) Desk tự sửa lúc trả phòng | – | Không làm gì |

Thêm cho **lần 2**: sau khi #154 lên, chỉ chủ đầu tư đổi được người chốt sau nhận phòng. Vì vậy lần 2 có thể đếm cả các lần anh/chị tự sửa sau lần 1. Ở K14-L, các dòng đó có vai người đổi cuối là `owner` và ngày đổi sau lần 1, không cần làm lại.

---

## 3. Thẻ feedback

### FB-R5-DOM-OPS-155-01
- Mức độ: **Major** (điều kiện trước lần chạy K14-L đầu tiên; không chặn ghim và chạy K14 đếm)
- Người sửa: OPS (câu `k14-closer-change-list.sql`, chữ K14-L); SEC (duyệt, ghim lại `K14_PIN` phần danh sách)
- Vị trí: `k14-closer-change-list.sql` khối (1), (2); runbook K14-L gạch "Không có trong danh sách"; mục 8 giả định (d)
- Vấn đề: danh sách chỉ có mã đơn, trạng thái, ngày, vai và nhãn việc. Runbook bảo chủ đầu tư xem tên trên Desk ("lịch sử đơn", "màn **Hoa hồng**"), nhưng Desk không có hai chỗ đó, và Nhật ký tiền ghi lần đổi người chốt không có tên (mục 1.4).
- Vì sao quan trọng: không biết ai là người chốt lúc nhận phòng, ai đang ghi, ai giữ dòng thì chủ đầu tư không quyết được đơn đang ở trước giờ trả phòng, và không chi đúng người ở kỳ 01/12. Đó là toàn bộ mục đích của 1H-01.
- Đề xuất sửa: thêm cột **tên hiển thị** (`app_user.display_name`). Người đã thu hồi hết vai ở cơ sở thì thêm "(đã thu hồi)". Không có thì ghi `none`.
  - **l1:**
    - người chốt lúc nhận phòng = `old_value` của lần đổi **đầu tiên** từ lúc nhận phòng;
    - người chốt đang ghi;
    - người đổi cuối (tên, kèm cột vai hiện có như bây giờ);
    - người hưởng của các dòng hoa hồng chưa `void`.
  - **l2:** người hưởng của dòng lệch; người chốt đang ghi.
  - **Giữ nguyên:**
    - không username, email, id, tỷ lệ, số tiền, lý do, cột nào của khách;
    - kênh (e): chỉ Terminal của chủ đầu tư, không vào repo/chat/subagent;
    - câu đếm K14 không đổi, không tách theo người (SEC 129).
  - Sửa giả định (d): "K14-L có tên hiển thị nhân viên vì Desk v1.0.5 chưa hiện người chốt và người hưởng cho chủ đầu tư (DOM 155-01)".
  - SEC không đồng ý tên thì ghi lý do. ORC báo DOM để DOM viết lại bảng việc ở mục 2 theo cách khác.
- Trạng thái: Open

### FB-R5-DOM-OPS-155-02
- Mức độ: Minor (trước lần chạy K14 đầu tiên; chỉ chữ runbook, không đổi SHA câu SQL)
- Người sửa: OPS
- Vị trí: runbook K14:
  - "Vì sao cần", gạch "Chủ đầu tư chi theo màn **Hoa hồng**";
  - "Cách đọc và câu báo INV", các câu (a1), (a2)/(b1), (b2), (a3);
  - K14-L gạch "INV mở đơn trên Desk để xem ai";
  - `k14-closer-change-note.md` mục 3 "Tên người INV xem trên Desk"
- Vấn đề:
  - (i) "Màn **Hoa hồng**" không có cho chủ đầu tư. Chữ này là lỗi của DOM ở review 1h; DOM đính chính ở đây.
  - (ii) Câu (a2)/(b1) bảo "chi ngoài Desk … không sửa dữ liệu". Từ #154, chủ đầu tư sửa được trên Desk, và nên sửa: để dòng `earned` sai người thì luồng chi v1.3 sẽ chi người đó.
  - (iii) Chưa có ca "người chốt đã đúng mà dòng đạt ở người khác" (sửa hai lần), chưa có ca "ghi lần đầu sau nhận phòng mà không đồng ý" (ghi "không chi"), chưa nói lần 2 có cả các lần chủ đầu tư tự sửa.
- Vì sao quan trọng: chủ đầu tư làm đúng theo câu báo mà Desk vẫn sai người hưởng. Hoặc đi tìm một màn không có.
- Đề xuất sửa: chép bảng mục 2 (rút gọn) vào "Cách đọc và câu báo INV". Câu (a1) giữ ý "quyết trước lúc trả phòng". Thay "màn **Hoa hồng**" bằng "sổ chi của anh/chị; Desk chưa có màn hoa hồng cho chủ đầu tư". UXD không cần rà vì đây là chữ nội bộ.
- Trạng thái: Open

### FB-R5-DOM-OPS-155-03
- Mức độ: Suggestion
- Người sửa: OPS (khi sửa 155-01; SEC ghim cùng lần)
- Vị trí: `k14-closer-change-list.sql`; `k14-closer-change-counts.sql` dòng `payee_not_closer_projected_auto`
- Vấn đề và đề xuất:
  - (i) K14-L thêm cột loại đơn (`stay_type`: ngắn ngày / dài hạn) và "đơn con" (có `parent_reservation_id` hay không). Đơn dài hạn ở danh sách 1 thì chủ đầu tư bỏ qua ngay (mục 1.1).
  - (ii) Không bắt buộc: (b3) có thể gồm cả đơn `checked_out` còn dòng `projected` lệch, không ở danh sách 1, vì mọi đường đạt đều chạy `ensureCommission` (mục 1.3). Đổi nhãn thành "Desk tự sửa lúc đạt". Giữ như bây giờ cũng được: bảng việc ở mục 2 đã ghi "không làm gì" cho nhóm này.
- Trạng thái: Open

### FB-R5-DOM-FE-155-04
- Mức độ: Minor (cùng tag có #154, hoặc v1.0.6)
- Người sửa: FE-A; UXD (chữ khi không có tên)
- Vị trí: `MoneyPage.tsx` `AuditAction`, nhánh `reservation.closer_changed` (đọc `before.closer`, `after.closer`); chuỗi `mlog.a_closer_changed`
- Vấn đề: máy chủ ghi `closerUserId` (id), từ #154 mới có trong audit; FE đọc khóa `closer` không tồn tại. Dòng hiện "Đổi người chốt:  → " cho mọi lần đổi, kể cả lần chủ đầu tư sửa sau #154.
- Vì sao quan trọng: đây là chỗ duy nhất trên Desk chủ đầu tư thấy lần đổi người chốt. Không có tên thì chủ đầu tư không tự kiểm được, kể cả sau K14.
- Đề xuất sửa:
  - Đọc `closerUserId`, đổi ra tên hiển thị bằng danh sách nhân viên mà `MoneyPage` đã tải cho bộ lọc người (`listCloserCandidates`, `staff`).
  - Không thấy trong danh sách (đã khóa, hoặc CTV) thì hiện chữ UXD chọn, ví dụ "nhân viên đã khóa".
  - Bản ghi trước #154 rỗng thì hiện "Đổi người chốt (trước v1.0.5, không ghi tên)".
  - Không đổi máy chủ.
- Trạng thái: Open

### FB-R5-DOM-ARC-155-05
- Mức độ: Suggestion (0.3.14 / v1.0.6; chỉ cần nếu K14 lần 1 ra (a) hoặc (b1) > 0)
- Người sửa: ARC (hợp đồng), BE-H
- Vị trí: `updateReservation` 1h ("đổi" = giá trị khác giá trị đang lưu); `Fields.uuid` coi `closerUserId: null` như không gửi
- Vấn đề: hai việc chủ đầu tư cần khi xử lý K14 mà Desk chưa làm thẳng được:
  - (1) Người chốt trên đơn đã đúng, dòng đạt ở người khác (dữ liệu trước #154): phải sửa hai lần. Gửi lại đúng người chốt trên đơn `checked_out` thì bị 409.
  - (2) Chủ đầu tư quyết "đơn này không có hoa hồng" (người chốt ghi lần đầu sau nhận phòng, BR-903 (3)): không bỏ được người chốt. Desk vẫn tạo dòng đạt lúc trả phòng, và luồng chi v1.3 sẽ chi dòng đó.
- Vì sao quan trọng: (1) dễ làm sai và để hai dòng audit khó đọc. (2) để lại dòng đạt mà chủ đầu tư đã quyết không chi; tới v1.3 luồng chi tự động sẽ chi.
- Đề xuất sửa (chỉ OWN, lý do bắt buộc, sau nhận phòng):
  - (1) gửi đúng người chốt hiện tại kèm lý do, trên đơn có dòng chưa `void` của người khác, thì Desk đồng bộ lại (`closer_corrected`);
  - (2) gửi `closerUserId: null` kèm lý do thì bỏ người chốt; dòng chưa `void` → `void` (`closer_corrected`), không tạo dòng mới.
  - Hai ý phải xong trước luồng chi v1.3 (US-089), cùng nhóm với DOM 1H-03.
- Trạng thái: Open

---

## 4. Điểm làm tốt

- Câu đếm lấy lịch sử từ `reservation_change`, không từ audit rỗng. Có dòng gác vai/tenant, READ ONLY, `ROLLBACK`. Phép kiểm `a = a1 + a2 + a3`, `b3 ≤ b2` bắt được câu sai mà không lộ số.
- 13 ca chạy thử trên DB dùng một lần phủ đúng các ca DOM lo:
  - đổi đúng giây nhận phòng;
  - hai lần đổi trên một đơn;
  - ghi lần đầu bởi người đã thu hồi vai;
  - dòng HĐ thuê tháng;
  - đơn hủy còn dòng dự kiến.
- OPS tự ghi chỗ lệch với 1H-01 thành giả định có tên ((d)) thay vì lặng lẽ bỏ cột. Nhờ vậy DOM thấy và kiểm được Desk có bù được hay không.

## 5. Giả định DOM dùng

1. DOM chỉ đọc chữ và câu SQL ở `2cea3139`. DOM không chạy, không xem dữ liệu production, không có số production.
2. "Desk không có màn hoa hồng cho OWN/MGR, không có màn lịch sử đơn, khung đơn không có ô người chốt": DOM tìm trong `product/apps/admin-web/src` trên `main` @ `31e12c48`:
   - `listCommissions` chỉ gọi ở `ReservationDrawer` khi người xem là sale/CTV;
   - không chỗ nào gọi `getReservationHistory`;
   - ngoài test, mock và chú thích, chữ `closer` chỉ có ở `BookingDialog` (lúc tạo đơn) và `MoneyPage`.
   Một PR FE chưa gộp có thể đã thêm các chỗ này; DOM không thấy PR nào đang mở làm việc đó.
3. "Hủy nhận phòng xóa `actual_checkin_at`" và "`actual_checkin_at` = lúc bấm": theo `checkin.service.ts` ở `4e81c3be`.
4. "Mọi đường đạt chạy `ensureCommission`": theo ba chỗ gọi `tryEarnCommissions` có truyền `stay` ở `4e81c3be` (B18, thanh toán/đối soát, xóa nợ).
5. Tên hiển thị nhân viên là dữ liệu cá nhân của người lao động, không phải dữ liệu khách. Chủ đầu tư là người chi hoa hồng nên cần đúng dữ liệu này. Kênh và cách che do SEC quyết. Mọi điểm khác là luật đã có (BR-903 (3)–(4), BR-212), nên không ESC.

## 6. Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review OPS PR #155 (runbook K14, DOM 1H-01) @ 2cea3139: DUYỆT CÓ ĐIỀU KIỆN.** Câu đếm K14 (8 dòng, từ reservation_change) duyệt nguyên trạng: (a) không lọc loại đơn – đồng ý, thừa là hướng an toàn, dòng HĐ thuê tháng không vào (b); (b) sau nhận phòng = changed_at ≥ actual_checkin_at – đồng ý, cùng mốc #154, actual_checkin_at là lúc bấm, Hủy nhận phòng xóa mốc; (c) (b3) dựa ensureCommission của #154 @ 4e81c3be – đúng, không đổi so với 279b5492 DOM đã duyệt, mọi đường đạt đều chạy ensureCommission. (d) không đủ: Desk không có ô người chốt trên khung đơn, không có màn lịch sử đơn, không có màn hoa hồng cho OWN/MGR, Nhật ký tiền ghi lần đổi người chốt không có tên – điều kiện 155-01 (Major, trước lần chạy K14-L đầu): K14-L in tên hiển thị nhân viên (người chốt lúc nhận phòng, đang ghi, người đổi cuối, người hưởng dòng sống), không tên khách, không số, chỉ trên Terminal của INV, SEC ghim lại. 155-02 Minor: câu báo INV theo bảng việc DOM (a1 quyết trước giờ trả phòng – hạn mềm; sửa trên Desk bằng OWN thay cho chi ngoài Desk mà để Desk sai; sửa hai lần khi người chốt đã đúng mà dòng đạt ở người khác; ghi lần đầu sau nhận phòng mà không đồng ý thì ghi "không chi"), bỏ chữ "màn Hoa hồng" (DOM đính chính review 1h). 155-04 Minor FE-A: dòng "Đổi người chốt" ở Nhật ký tiền đọc closerUserId ra tên. 155-03, 155-05 Suggestion. Không ESC, không số production, không số hoa hồng | DOM | rounds/round-05/reviews/DOM-on-ops-pr-155-k14.md |`
