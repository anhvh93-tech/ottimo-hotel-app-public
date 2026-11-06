# DATA review – PR #114 (V5-11): ngày của dòng phí giữ lại và chỉ số K-22e

- Người review: DATA | Round 5 – bước Review (chỉ số) | Ngày: 07/11/2026
- Đối tượng: PR #114, nhánh `r5-a2` @ `f730b691` (BE-A1, đang mở). Đọc bằng `gh pr diff 114`, không checkout, không chạy test.
- Đối chiếu:
  - `product/docs/metrics-definitions.md` v0.2: mục 2 (ngày nghiệp vụ), Q-07, Q-09, Q-14, K-07, K-22, mục 8 (R-01…R-09);
  - `product/docs/business-rules.md` v0.5.15: BR-010 (câu v0.5.12), BR-011, BR-428;
  - DOM `rounds/round-05/reviews/DOM-on-be-a1-prs-127-114.md` mục 3.4; DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 2.1 (5), 2.4 (T-11-9);
  - mã trên `main`: `folio.service.ts` `voidStay`, `checkout.service.ts` (`deposit_forfeit`), `stay.service.ts` (`early_departure_fee`), module `reporting`.
- Không có số doanh thu thật. Số tiền trong file là số ví dụ của oracle và của DOM.

## 1. Kết luận

- **PR #114 ĐẠT về chỉ số. Không có thẻ cho BE.**
  - Sau PR, bốn loại dòng phí giữ lại (`cancellation_fee`, `no_show_fee`, `early_departure_fee`, `deposit_forfeit`) có `service_date` = ngày nghiệp vụ lúc thao tác (`input.businessDate` / `ctx.today`).
  - Điều này khớp định nghĩa DATA đã có từ R1: mục 2 ghi "ngày ghi nhận phí hủy/no-show/phí trả sớm (Q-09)" theo ngày nghiệp vụ. Trước PR, mã lệch định nghĩa ở hai chỗ:
    - phí hủy và phí không đến ghi ngày lịch trong 00:00–05:59 (BUG-R3-036);
    - phí trả sớm ban ngày ghi Ngày rời mới.
  - PR sửa mã cho khớp chỉ số. Chỉ số không phải đổi theo PR.
- **K-22e vẫn đúng ý định nghĩa về ngày, nhưng có một lỗi định nghĩa cũ của DATA** (lỗi có từ trước, PR không gây ra). PR làm lỗi này lộ rõ hơn:
  - K-22e cộng cả `deposit_forfeit`.
  - Trong mã, `deposit_forfeit` **chỉ** sinh ở Trả phòng B18: tiền thừa khách để lại, `chargeCode = overpayment_retained`.
  - Hủy và không đến luôn ghi `cancellation_fee` / `no_show_fee` (`retainedKind`). Cọc bị giữ khi hủy đã nằm trong hai loại này.
  - Vậy K-22e đang cộng tiền thừa ở quầy vào "doanh thu bù từ hủy/không đến". Sửa ở mục 3.1.
- **Phí trả sớm không thuộc K-22e** (K-22e chỉ có hủy và không đến). Thay đổi ban ngày DOM nêu ở mục 3.4 tác động vào **K-07 doanh thu khác**, không vào K-22e. DOM rules 2.1 (5) ghi "doanh thu khác theo ngày (K-22e)" là gọi nhầm tên chỉ số (thẻ FB-R5-DATA-DOM-01).
- **Không báo cáo nào đang chạy đọc các dòng phí này theo ngày:**
  - Module `reporting` trên `main` chỉ đọc `stay_night` (Tổng quan, KPI đêm nay), cộng `foc`/`discount` cho cảnh báo FOC (`attention-sources.ts`).
  - Báo cáo doanh thu (US-100, 101, 102) và xuất dữ liệu (US-104) thuộc v1.2.
  - Vì vậy v1.0.5 không phải sửa báo cáo nào. Các điều kiện cho v1.2 ghi ở mục 3.4.

## 2. Đối chiếu ngày từng loại dòng (trước và sau PR #114)

| Dòng | Sinh ở đâu | `service_date` trước PR | Sau PR | Định nghĩa DATA | Khớp sau PR |
|---|---|---|---|---|---|
| `cancellation_fee` | `voidStay` (hủy, gồm phạt OTA BR-310) | Ngày lịch lúc ghi | Ngày nghiệp vụ lúc hủy | Q-09: ngày hủy (ngày nghiệp vụ, mục 2) | Có |
| `no_show_fee` | `voidStay` (đánh dấu không đến) | Ngày lịch lúc ghi | Ngày nghiệp vụ lúc đánh dấu | Q-09: ngày đánh dấu không đến | Có |
| `early_departure_fee` (gồm phần OTA `ota_retained`) | `stay.service.ts` B16 | Ngày rời mới | Ngày nghiệp vụ lúc trả sớm | Mục 2: ngày nghiệp vụ; Q-09 chưa ghi riêng | Có (Q-09 cần ghi rõ, mục 3.2) |
| `deposit_forfeit` | `checkout.service.ts` B18, tiền thừa khách để lại | Ngày đi của lượt | Ngày nghiệp vụ lúc B18 | Q-09: "cọc bị giữ lại" theo ngày dịch vụ | Có về ngày; **sai nhóm ở K-22e** (mục 3.1) |
| Dòng đảo của các dòng trên | `reverseWithReductions` | Chép `service_date` của dòng gốc | Không đổi | Q-14: trước chốt tháng, tính lại theo dữ liệu mới | Có: dòng đảo tự triệt tiêu đúng ngày gốc |

Ví dụ phí trả sớm ban ngày (số ví dụ của DOM 3.4):
- Đơn 25/11–05/12 × 700.000. Lúc 10:00 ngày 29/11, khách báo rời ngày 02/12. Phí 1.050.000.
- Trước PR: K-07 tháng 12 có 1.050.000. Sau PR: K-07 tháng **11** có 1.050.000.
- Ba đêm bỏ (02, 03, 04/12) vẫn tính theo ngày lưu trú ở tháng 12: đêm `void`, `early_departure`.
- Hai số này nằm ở hai tháng khác nhau. Đúng định nghĩa: doanh thu khác theo ngày phát sinh, đêm theo ngày lưu trú. Mục 3.3 ghi cách so sánh cho đúng.

## 3. Việc DATA phải sửa (quyền DATA, chưa sửa trong commit này)

Chỉ commit file review theo lệnh ORC. Các sửa dưới đây vào `product/docs/metrics-definitions.md` (bản 0.3) là **một commit riêng** khi ORC giao. Không đổi số nào của INV.

### 3.1 K-22e: bỏ `deposit_forfeit`, đọc thẳng `service_date`

- Định nghĩa mới: **K-22e Doanh thu bù từ hủy/không đến** = Σ `folio_line.amount_vnd` có `category ∈ {cancellation_fee, no_show_fee}`, gồm dòng đảo, trên đơn `stay_type = short`, theo `service_date`.
  - Từ v1.0.5, `service_date` = ngày nghiệp vụ lúc hủy hoặc đánh dấu không đến (BR-010 v0.5.12).
  - Tách theo kênh (`reservation.channel_id`) và theo mã lý do hủy, như K-22a.
- Lý do bỏ `deposit_forfeit`:
  - Trong mã, đây là tiền thừa khách để lại khi trả phòng, không liên quan hủy hay không đến.
  - Cọc bị giữ khi hủy hoặc không đến đã là `cancellation_fee` / `no_show_fee`.
  - Ký quỹ thuê tháng bị giữ (v1.3) không vào K-22, vì K-22 chỉ tính đơn ngắn ngày. Loại này báo ở chỉ số hợp đồng.
- `deposit_forfeit` vẫn nằm trong K-07 (nhóm hiển thị đổi tên "Tiền khách để lại / cọc giữ lại").
- Bỏ cụm "theo ngày nghiệp vụ hủy/đánh dấu no-show" (lấy từ `cancelled_at`, `no_show_marked_at`), thay bằng `service_date`. Hai cách nay cho cùng một ngày. Đọc `service_date` thì dòng đảo khi khôi phục không đến (B12) tự triệt tiêu, không cần ghép bảng đơn.

### 3.2 Q-09 và Q-07: ghi rõ ngày của phí trả sớm và tiền khách để lại

- Q-09, cột "Ghi nhận vào kỳ nào" của nhóm doanh thu khác, thay câu "phí hủy/no-show theo ngày hủy/ngày đánh dấu no-show" bằng:
  > Dòng phí giữ lại (phí hủy, phí không đến, phí trả sớm, tiền khách để lại khi trả phòng) theo **ngày nghiệp vụ lúc thao tác** (`service_date`, BR-010 v0.5.12) – phí trả sớm không theo Ngày rời mới.
- Q-07, câu Trả sớm: thêm "dòng phí trả phòng sớm mang ngày nghiệp vụ lúc trả sớm; các đêm bỏ giữ ngày lưu trú của chúng."

### 3.3 Đặt tên chỉ số cho trả sớm, và cách so sánh phí với đêm mất

- K-22d đã nhắc "dòng riêng 'đêm bỏ do trả sớm'" nhưng chưa có mã. Thêm hai chỉ số:
  - **K-22f Đêm bỏ do trả sớm** = Σ đêm `void` có `void_reason = early_departure`, `prev_state = sold`, theo ngày lưu trú, theo kênh.
  - **K-22g Phí giữ lại do trả sớm** = Σ `early_departure_fee` (gồm dòng đảo) theo `service_date`, tách phần OTA (`charge_code = ota_retained`) và phần Trực tiếp/CTV.
- So sánh "phí bù ÷ doanh thu phòng của đêm mất" (K-22e với K-22d, K-22g với K-22f): **gom theo đơn**, không chia hai tổng tháng cho nhau.
  - Mỗi đơn hủy, không đến hay trả sớm góp phí của nó và doanh thu phòng gốc của các đêm nó bỏ.
  - Kỳ = tháng của ngày thao tác.
  - Lý do: phí nằm ở tháng thao tác, đêm bỏ nằm ở tháng lưu trú. Chia hai tổng tháng cho nhau sẽ ra tỷ lệ vô nghĩa, ví dụ phí của tháng 11 chia cho đêm của tháng 12.

### 3.4 Điều kiện cho báo cáo v1.2 (US-100, 101, 102, 104)

1. Mọi báo cáo doanh thu khác **đọc `folio_line.service_date` như đã lưu**. Không tự tính lại từ Ngày rời mới, `departure_date`, `cancelled_at` hay ngày lịch của `posted_at`.
2. Dòng đảo cộng vào ngày của dòng gốc (`COALESCE(gốc.service_date, dòng.service_date)`, như `attention-sources.ts` đang làm). Sau khi có "Chốt tháng" (Q-14), điều chỉnh của tháng đã chốt vào tháng hiện hành.
3. **Dòng ghi trước v1.0.5 giữ ngày cũ.**
   - Không viết migration sửa ngày: mã tiền đang đóng băng, và dòng đã ghi không sửa.
   - Trước khi dựng báo cáo v1.2, OWN hoặc OPS chạy câu đếm chỉ đọc dưới đây trên production. Câu chỉ trả **số dòng, không số tiền**, và kết quả **không ghi vào repo**.
   - Số dòng khác 0 thì báo cáo v1.2 ghi chú "các dòng phí ghi trước ngày lên v1.0.5 theo ngày cũ".

   ```sql
   -- Read-only. Run on production by OWN/OPS. Do not commit the result.
   SELECT l.category, count(*) AS lines
   FROM folio_line l
   WHERE l.category IN ('cancellation_fee', 'no_show_fee', 'early_departure_fee', 'deposit_forfeit')
     AND l.reversal_of_id IS NULL
     AND l.line_state = 'posted'
     AND l.service_date <> ((l.posted_at AT TIME ZONE 'Asia/Ho_Chi_Minh') - interval '6 hours')::date
   GROUP BY l.category;
   ```
   (`6 hours` = `business_day_rollover` 06:00 hiện hành. Đổi tham số thì đổi theo.)
4. Thêm phép đối chiếu **R-10** vào mục 8: dòng phí giữ lại ghi sau khi v1.0.5 lên có `service_date` = ngày nghiệp vụ của `posted_at` → **0 dòng lệch**. Câu SQL trên, lọc thêm `posted_at` ≥ giờ lên v1.0.5, là phép kiểm. Khác 0 là lỗi dữ liệu.
5. Phí kênh OTA trên phần OTA giữ lại (K-15, `channel_fee.recognized_on`, chưa có trong mã) ghi cùng ngày với dòng `early_departure_fee` / `cancellation_fee` của nó, để K-10 của một tháng không lệch. Đây là việc của ARC khi làm hợp đồng báo cáo v1.2, không phải việc của #114.

## 4. Thẻ

### FB-R5-DATA-DOM-01
- Mức độ: Minor
- Vị trí: `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 2.1 (5) và 2.3 (dòng DATA); `rounds/round-05/reviews/DOM-on-be-a1-prs-127-114.md` mục 3.4 ("DATA xác nhận K-22e 'doanh thu khác theo ngày'").
- Vấn đề: K-22e là "doanh thu bù từ hủy/không đến" và không gồm phí trả sớm. "Doanh thu khác theo ngày" là **K-07**. Câu hiện tại làm người đọc nghĩ phí trả sớm vào K-22e.
- Vì sao quan trọng: khi dựng báo cáo v1.2, người làm FE/BE có thể cộng phí trả sớm vào thẻ "bù từ hủy/không đến", và thẻ này sẽ đếm hai lần với K-07.
- Đề xuất sửa: đổi thành "Báo cáo doanh thu khác theo ngày (**K-07**) đếm theo ngày này; phí hủy và không đến cũng vào K-22e, phí trả sớm vào K-22g (metrics v0.3)".
- Trạng thái: Open

### FB-R5-DATA-QA-01
- Mức độ: Suggestion
- Vị trí: `rounds/round-05/outputs/DOM/rules-v1.0.5.md` 2.4, ca **T-11-9** ("Báo cáo doanh thu khác ngày 20/10 và 21/10").
- Vấn đề: v1.0.x chưa có màn báo cáo doanh thu khác (US-100 thuộc v1.2), nên T-11-9 không có chỗ để xem.
- Vì sao quan trọng: ca có thể bị đánh "không chạy được" hoặc bị bỏ, trong khi điểm cần khóa (ngày lưu đúng) kiểm được ngay.
- Đề xuất sửa:
  - Ở v1.0.5, chạy T-11-9 trên staging bằng truy vấn K-07 chỉ đọc: Σ `amount_vnd` theo `service_date`, `category` trong `revenue_group = 'other'`.
  - Mong đợi theo oracle: dòng phí hủy của T-11-7 ở **21/10**, dòng phí không đến của T-11-8 ở **20/10**, dòng phí trả sớm của T-11-1/T-11-3 ở **20/10**. Không dòng nào ở 22/10 hay ở Ngày rời mới.
  - Thêm câu R-10 (mục 3.4 ý 4). Mong đợi 0 dòng lệch trên dữ liệu test.
  - Ở v1.2, chạy lại T-11-9 trên màn US-100.
- Trạng thái: Open

## 5. Dòng đề xuất ghi `decision-log.md` (ORC ghi khi commit)

`| 2026-11-07 | 5 | **DATA – review chỉ số PR #114 (V5-11)** (rounds/round-05/reviews/DATA-on-pr-114-k22e.md): #114 @ f730b691 ĐẠT về chỉ số, không thẻ BE – dòng phí giữ lại (cancellation_fee, no_show_fee, early_departure_fee gồm phần OTA, deposit_forfeit) mang service_date = ngày nghiệp vụ lúc thao tác, khớp metrics mục 2/Q-09 (trước đây mã lệch: ngày lịch 00:00–05:59, phí trả sớm theo Ngày rời mới). DATA tự sửa ở metrics v0.3 (commit riêng): K-22e bỏ deposit_forfeit (trong mã chỉ là tiền thừa khách để lại khi Trả phòng) và đọc thẳng service_date; Q-09/Q-07 ghi rõ phí trả sớm theo ngày thao tác, không theo Ngày rời mới; thêm K-22f (đêm bỏ do trả sớm) và K-22g (phí trả sớm); so sánh phí với đêm mất gom theo đơn, kỳ = tháng thao tác; thêm đối chiếu R-10 (0 dòng phí lệch ngày nghiệp vụ sau v1.0.5). Không báo cáo nào trên main đọc các dòng này; báo cáo v1.2 đọc service_date như đã lưu, dòng trước v1.0.5 giữ ngày cũ, không migration (OWN/OPS đếm số dòng chỉ đọc, không ghi kết quả vào repo). Thẻ FB-R5-DATA-DOM-01 (Minor, K-22e ≠ K-07), FB-R5-DATA-QA-01 (Suggestion, T-11-9 bằng truy vấn ở v1.0.5) | DATA | Quyền DATA (định nghĩa chỉ số); không đổi số của INV |`

## 6. Điểm làm tốt

- Một luật cho cả bốn loại dòng, đặt ở một chỗ (`voidStay` nhận `businessDate`, câu chặn `retainedVnd > 0 without businessDate`). Báo cáo chỉ cần tin `service_date`, không phải biết dòng sinh từ đường nào.
- Test `v105-early-hours` kiểm `service_date` của từng loại dòng bằng SQL trên chính `folio_line`, gồm `deposit_forfeit` lúc 02:00. Đó cũng là cách DATA sẽ đối chiếu báo cáo (R-10).
