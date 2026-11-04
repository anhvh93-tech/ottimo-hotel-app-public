# DOM review – PR #89 `v104/ba-manual-minors`: các thẻ nhỏ của sổ tay sau #85

- Người review: DOM | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Tác giả: BA. Bản đọc: `git diff origin/main...origin/v104/ba-manual-minors`, head `89743a8f`. Chỉ có tài liệu: 5 tệp (`00`, `01`, `02`, `05`, sổ tay), 34 dòng thêm, 19 dòng bớt; CI xanh. Số dòng ghi trong file này là số dòng trên nhánh @ `89743a8f`.
- Căn cứ:
  - `product/docs/business-rules.md` BR-428 (cách tính và dòng phí trên bill), BR-011;
  - `rounds/round-04/qa/v1.0.2-dk10-b18.md` mục 10 (BR-428-02 ở giờ thật qua Desk, 05/11: ĐẠT);
  - `rounds/round-04/reviews/DOM-on-v104-pr85-prices.md` lượt 2 (thẻ 04, 05).
- Mã đối chiếu ở `main`:
  - `frontdesk/internal/stay.service.ts` dòng 1470 (`droppedFeesVnd` = phụ thu người của các đêm bỏ) và 1745–1781. Số hoàn = min(phần BR-428 + phụ thu người các đêm bỏ + chênh lệch đổi phòng đã đảo, tiền trả thừa chưa xử lý). Desk tạo **một** yêu cầu hoàn khi số này > 0. Phụ thu người **không** phụ thuộc số ngày báo trước.
  - `frontdesk/public/stay-rules.ts` dòng 208–212: chỉ phần 50 % tiền phòng mới cần báo trước ≥ 1 ngày.
  - Chuỗi `early_departure.no_refund` ("Không có khoản hoàn."), `bill.line.early_departure_fee_notice` ("Phí trả phòng sớm (báo trước {noticeDays} ngày)" / "Early departure fee ({noticeDays} days' notice)").

## Phán quyết: **ĐẠT CÓ ĐIỀU KIỆN**

Hai thẻ của DOM ở #85 đã đóng đúng. Câu mới "báo trong ngày rời" đúng với ca QA đã chạy, nhưng **viết tuyệt đối quá**. Nếu các đêm bỏ có phụ thu người mà khách đã trả, Desk vẫn tạo một yêu cầu hoàn (BR-428, `stay.service.ts`), trong khi câu mới dặn "không có yêu cầu hoàn, không cần nhập nơi nhận". Phải sửa nửa câu này trước khi gộp (thẻ 01). Sau khi sửa thẻ 01, DOM không cần đọc lại: BA dùng đúng chữ ở mục 3, ORC đối chiếu là đủ.

---

## 1. Kiểm theo việc ORC giao

| Việc | Đã sửa ở | DOM kiểm | Kết quả |
|---|---|---|---|
| DOM-PR85-04 | `02` 11.5.1, gạch **Khách đi trước 06:00** (1001); sổ tay 2.14a cùng gạch (1317) | Câu đúng chữ đề xuất: quá 12:00 mới làm được thì gõ 12:00, không gõ giờ trước 06:00, Desk đòi **Ghi chú giờ trả (vì sao ghi bù)** thì ghi giờ rời thật, không phụ thu. Câu đặt ngay sau câu "trước 12:00". Đủ 2 chỗ | Closed |
| DOM-PR85-05 | `01` 14.1 (870) | "Hạn ghi trễ: đội đang hỏi luật sư (BR mục 15). Tới khi có câu trả lời, vẫn ghi ngay trong ngày phát hiện và báo chủ đầu tư". Khớp BR v0.5.11 mục 15 | Closed |
| Câu "báo trong ngày rời" | `02` 11.5.2 (1025); sổ tay 2.14a **Nhánh ngắn ngày** (1322); `01` 7.3 (518) | Đúng với ca QA (không có phụ thu người): hoàn 0, "Không có khoản hoàn.", 0 yêu cầu hoàn, dòng phí "(báo trước 0 ngày)". **Thiếu** ca các đêm bỏ có phụ thu người mà khách đã trả. Câu không ghi rõ chỉ áp cho đơn Trực tiếp/CTV | **Thẻ 01** |
| "khi có khoản hoàn, tạo **một** yêu cầu hoàn" | `01` 7.3 (518), sổ tay 2.14a; `02` 11.5.2 (1024, bullet "Có khoản hoàn") | Đúng BR-428 ("**một** yêu cầu hoàn cho khoản trả sớm") và đúng mã (`refundVnd > 0`) | Đạt |
| Phần khác của #89 | Bỏ tỷ lệ hoa hồng (`05` 4.2, sổ tay 4.2); trích đủ "Đã giảm …% vì ở từ 7 đêm (BR-107)" (khớp `sale.los_applied`); cột **Giá lịch/đêm (trước giảm theo số đêm)** (khớp `rate.pre_tier`); tách dòng **Kiểm sau khi chuyển giá**; gạch **Kiểm trùng** chia 4 gạch con | Không đổi nghiệp vụ, không đổi số | Đạt |

---

## 2. Thẻ feedback

### FB-R4-DOM-BA-PR89-01
- Mức độ: Major
- Vị trí:
  - `02` 11.5.2: bullet 1 (1021) và bullet mới (1025);
  - sổ tay 2.14a **Nhánh ngắn ngày** (1322): câu chính sách đầu đoạn và câu mới;
  - `01` 7.3: câu chính sách (517) và câu mới (518);
  - cùng quy tắc, có từ trước #89: sổ tay 5.2 dòng **Trả phòng sớm** (1866).
- Vấn đề:
  1. Câu mới ghi "Khách báo trong ngày rời: Desk ghi 'Không có khoản hoàn.', không có yêu cầu hoàn, không cần nhập nơi nhận". Câu này chỉ đúng khi các đêm bỏ không có phụ thu người mà khách đã trả. Theo BR-428 ("phụ thu người (BR-110) của các đêm bỏ hoàn 100%"), Desk cộng phụ thu người của các đêm bỏ vào số hoàn **dù báo trước 0 ngày** (`stay.service.ts` 1750), rồi tạo **một** yêu cầu hoàn. Chênh lệch đổi phòng (BR-424) cũng được cộng như vậy, nhưng chỉ có ở đơn OTA. Ví dụ: Studio 3 người (định mức 2), đã trả đủ 3 đêm, báo trong ngày rời bỏ 2 đêm → tiền phòng 2 đêm không hoàn, nhưng phụ thu 2 × 150.000 = **300.000** vẫn hoàn: Desk tạo yêu cầu hoàn 300.000.
  2. Câu chính sách cũ ("báo trước từ 1 ngày: hoàn 50 % …; phụ thu người các đêm đó hoàn 100 %. Báo trong ngày rời: không hoàn") đặt vế phụ thu người dưới ca "từ 1 ngày". Người đọc dễ hiểu là báo trong ngày rời thì không hoàn cả phụ thu.
  3. Câu mới không nói chỉ áp cho đơn Trực tiếp/CTV. Đơn OTA thì dòng phí không ghi số ngày báo trước (BR-428), và phụ thu người đã thu tại quầy vẫn hoàn 100 % qua một yêu cầu hoàn.
- Vì sao quan trọng: lễ tân làm đúng chữ thì sẽ báo khách "không có khoản hoàn" trong khi Desk hiện "Sẽ xin hoàn cho khách 300.000", và bỏ qua **Nhập nơi nhận hoàn**. Yêu cầu hoàn thiếu nơi nhận, người duyệt phải hỏi lại, khách có thể đã đi. Đây là sai lời về tiền với khách, nên DOM xếp Major. Chỉ cần sửa nửa câu, kịp trước giờ cắt.
- Đề xuất sửa: dùng đúng chữ ở mục 3.
- Trạng thái: Open

### FB-R4-DOM-UXD-PR89-02 (việc v1.0.5, không thuộc #89)
- Mức độ: Suggestion
- Vị trí: chuỗi `bill.line.early_departure_fee_notice` khi `noticeDays` = 0. Chuỗi hiện ở folio, bill **Trả phòng**, khung đơn và **phiếu thanh toán** khách cầm về: VI "Phí trả phòng sớm (báo trước 0 ngày)", EN "Early departure fee (0 days' notice)".
- Vấn đề: với N = 0, chữ hiểu được nhưng cứng. Trên phiếu tiếng Anh, khách đọc như bị trách ("0 days' notice"), không hợp giọng OTTIMO (ngắn, lịch sự, điềm tĩnh).
- Đề xuất: thêm biến thể khi N = 0, ví dụ `bill.line.early_departure_fee_same_day`:
  - EN dẫn: "Early departure fee (same-day notice)";
  - VI: "Phí trả phòng sớm (báo trong ngày rời)";
  - các tiếng khác theo UXD/CPY.

  FE chọn biến thể khi `noticeDays` = 0 (`app/folio.ts`, `VARIANT`). N ≥ 1 giữ nguyên "báo trước N ngày". Đơn OTA giữ nguyên, không ghi số ngày. Chỉ đổi chữ: số tiền và `labelParams` không đổi, nên dòng đã ghi hiện chữ mới là chấp nhận được. Sau khi chữ mới lên, BA sửa câu "(báo trước 0 ngày)" ở `02` 11.5.2 và sổ tay 2.14a. BR-428 không cần sửa trước: "báo trong ngày rời" là cách ghi của N = 0; DOM thêm một câu khi UXD làm.
- Trạng thái: Open – PO xếp v1.0.5 (UXD + FE + CPY)

---

## 3. Chữ đề xuất cho thẻ 01

**`02` 11.5.2**
- Bullet 1 (thay): "Đơn Trực tiếp/CTV báo trước **từ 1 ngày**: hoàn **50 %** tiền phòng các đêm chưa ở. Báo **trong ngày rời** (báo trước 0 ngày): không hoàn tiền phòng. **Cả hai trường hợp**, phụ thu người khách đã trả cho các đêm bỏ được hoàn 100 %. Desk ghi **Báo trước N ngày** dưới ô giờ báo."
- Bullet OTA (thay): "Đơn OTA: tiền phòng theo kênh (số OTA giữ lại anh/chị đã nhập); dòng phí không ghi số ngày báo trước. Phụ thu người và chênh lệch đổi phòng đã thu tại quầy cho các đêm bỏ được hoàn 100 %, qua **một** yêu cầu hoàn."
- Bullet mới (thay): "Đơn Trực tiếp/CTV báo trong ngày rời mà các đêm bỏ không có phụ thu người khách đã trả: Desk ghi 'Không có khoản hoàn.', không có yêu cầu hoàn, không cần nhập nơi nhận. Có phụ thu người đã trả: Desk vẫn tạo **một** yêu cầu hoàn đúng phần đó, làm như bullet **Có khoản hoàn** ở trên. Dòng phí trên bill: 'Phí trả phòng sớm (báo trước 0 ngày)'."

**Sổ tay 2.14a, Nhánh ngắn ngày.** Đổi câu đầu thành: "đơn Trực tiếp/CTV báo trước từ 1 ngày hoàn 50 % tiền phòng các đêm chưa ở, báo trong ngày rời không hoàn tiền phòng; phụ thu người của các đêm bỏ hoàn 100 % trong cả hai trường hợp; đơn OTA theo kênh". Câu mới sửa như bullet mới của `02`.

**`01` 7.3.** Câu chính sách (517) sửa như câu đầu của sổ tay. Câu mới (518): "Khách Trực tiếp/CTV báo trong ngày rời: thường Desk ghi 'Không có khoản hoàn.' và không có yêu cầu hoàn; nếu các đêm bỏ có phụ thu người khách đã trả thì vẫn có **một** yêu cầu hoàn cho phần đó."

**Sổ tay 5.2, dòng Trả phòng sớm.** "Báo trước từ 1 ngày: hoàn 50 % tiền phòng các đêm chưa ở · báo trong ngày rời: không hoàn tiền phòng · phụ thu người các đêm bỏ hoàn 100 % (cả hai trường hợp)".

---

## 4. Ghi chú cho ORC

1. Câu nhánh OTA: BR-428 đã đúng, không sửa (OTA theo OTA; phụ thu người thu tại quầy hoàn 100 % qua một yêu cầu; dòng phí OTA không ghi số ngày). Việc còn lại chỉ là chữ sổ tay ở mục 3. Không đổi BR, không đổi số.
2. QA nên thêm một ca BR-428 "báo trong ngày rời, có phụ thu người đã trả" (ví dụ Studio 3 người, bỏ 2 đêm: hoàn 300.000, phí = tiền phòng 2 đêm, **một** yêu cầu hoàn). Ca ở mục 10 không có phụ thu người nên chưa phủ. Có thể chạy ở `/__test__/clock`, không cần giờ thật.
3. Thẻ 02 là việc v1.0.5. PO xếp cho UXD, FE và CPY (tiếng khác); không chặn v1.0.4.

---

## 5. Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **DOM – review PR #89 @ `89743a8f` (sổ tay, thẻ nhỏ sau #85): ĐẠT CÓ ĐK.** Đóng DOM-PR85-04 (quá 12:00 mới Trả phòng thì gõ 12:00, ghi giờ rời thật ở ghi chú giờ trả) và DOM-PR85-05 (`01` 14.1 "đội đang hỏi luật sư"). 1 Major sửa trước khi gộp: PR89-01 – câu "báo trong ngày rời: không có yêu cầu hoàn" chỉ đúng khi các đêm bỏ không có phụ thu người khách đã trả. Theo BR-428, phụ thu người các đêm bỏ hoàn 100 % dù báo trước 0 ngày, và Desk vẫn tạo một yêu cầu hoàn; ghi rõ chỉ áp cho Trực tiếp/CTV. "Khi có khoản hoàn, tạo một yêu cầu hoàn" đúng | DOM | BR-428; `stay.service.ts` (phụ thu người không phụ thuộc số ngày báo trước); QA `v1.0.2-dk10-b18.md` mục 10 chỉ phủ ca không có phụ thu |
| 2026-11-05 | 4 | **Việc v1.0.5 (PO xếp, UXD + FE + CPY):** dòng phí trả sớm khi báo trước 0 ngày đổi chữ, VI "Phí trả phòng sớm (báo trong ngày rời)", EN "Early departure fee (same-day notice)" (biến thể N = 0); N ≥ 1 và dòng OTA giữ nguyên; chỉ đổi chữ, không đổi số. QA thêm ca BR-428 báo trong ngày rời có phụ thu người | DOM | Chữ "0 days' notice" trên phiếu khách cầm về cứng, không hợp giọng thương hiệu; QC đã ghi "chữ không chặn" |
