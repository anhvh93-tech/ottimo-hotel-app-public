# Báo cáo UXD – Round 5, Sản xuất, Gói 2 "Chữ và tham số theo bảng giá 01/11"

- Ngày: 06/11/2026 · Vai: UXD · Bước: Sản xuất. ORC lưu tệp này từ báo cáo bàn giao của UXD (subagent không ghi tệp báo cáo).
- Việc theo `rounds/round-05/plan.md`: V5-20, V5-21 (phần chữ), V5-22 (phần chữ), V5-23, V5-24.
- Đầu ra chính: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` (commit `6b3700c6`). Mỗi dòng gồm khóa thật trong mã, chữ cũ, chữ mới VI/EN (thêm RU ở chuỗi khách), lý do, nguồn. Kèm yêu cầu cho FE, BE và danh sách CPY duyệt.
- Không sửa mã. FE áp bảng vào `product/design/tools/gen_strings.py` sau review.

## 1. Đã làm gì
1. Rà mã `main` @ `b9f017f7`.
   - Mỗi khóa trong phạm vi: kiểm chỗ dùng thật (tệp, dòng, điều kiện hiện) và biến được truyền.
   - Kiểm các nhánh lỗi phía máy chủ để câu nói đúng điều máy chủ làm: `parameter-rules.ts`, `parameter.service.ts`, `reservations.service.ts`, `line-labels.ts`, `stay.service.ts`, `pricing.service.ts`.
2. V5-20, 22 khóa:
   - bỏ số 28, số 7, "+15 %" và chữ "trước giảm theo số đêm";
   - ngưỡng đọc từ tham số (`{n}`, `{time}`); không đọc được thì dùng câu không có số;
   - báo giá gom đêm theo số tiền (`sale.nights_at_rate_*`);
   - việc FE về số người (ARC-PR82-02).
3. V5-21, 39 khóa:
   - 29 tên `params.k.*` lấy từ từ điển: B1–B11, `rounding.*`, `early_checkin_tiers`, các khóa giá còn lại;
   - đơn vị "đêm";
   - 6 nhánh câu `PARAM_OUT_OF_RANGE`, đúng 6 dạng `extras` máy chủ trả;
   - 3 câu lỗi nhập: số, JSON, giờ;
   - câu `ota_base_rate` 2 vế.
4. V5-22, 8 khóa: chép chữ từ các thẻ PR70-03/04/06, bỏ `{group}`, thêm câu dự phòng.
5. V5-23, 67 khóa:
   - đủ mục của plan, trong đó 25 khóa EN thêm U+2011;
   - đã sửa sẵn trong mã, QA chỉ cần đóng: BUG-R2-100, BUG-R3-028 (g);
   - đã xong trên `main`: GN content-guide 1335 và phần lớn EM-13 (chỉ còn thêm `users.email_purpose`);
   - 3 khóa phát hiện thêm, PO quyết: `fo.rack.empty_body` (viết cứng "10 căn"), `desk_code.channel_off`, `error.DELIVERY_CHANNEL_DISABLED`.
6. V5-24, 7 khóa RU: "апартаменты" đổi thành "номер". 0/7 chuỗi thuộc bản thông báo dữ liệu. Kèm yêu cầu font theo BUG-R4-017.
7. Tổng 143 khóa: 63 sửa, 71 mới, 9 xóa.

| Việc | Sửa | Mới | Xóa | Cộng |
|---|---|---|---|---|
| V5-20 | 12 | 5 | 5 | 22 |
| V5-21 | 1 | 38 | 0 | 39 |
| V5-22 | 2 | 6 | 0 | 8 |
| V5-23 | 41 | 22 | 4 | 67 |
| V5-24 | 7 | 0 | 0 | 7 |

**Cần CPY duyệt** (mục 7 tệp chữ):
- C1: 7 chuỗi RU "номер".
- C2: `gw.lang_auto` EN/VI/RU.
- C3: 3 dòng phiếu phí trả sớm.
- C4: `bill.line.late_fee_as_night`.
- C5: dấu "!" ở `msg.hot_water_issue`.
- C6 (để sau v1.0.5): chữ "phụ thu" trên dòng phiếu hiện có.

**Yêu cầu cho FE và BE** (bảng đủ ở mục 6 tệp chữ):
- FE-A:
  - áp bảng vào `gen_strings.py`;
  - `RULE_DEFAULTS` 30/30;
  - `n` cho `LONG_STAY_REQUIRES_CONTRACT`;
  - báo giá gom đêm;
  - đổi số người thì tính lại tổng ("–" và `aria-busy` khi chờ);
  - `KNOWN` 29 khóa + `nights`;
  - `problemView` 6 nhánh;
  - `StepUpDialog` thêm `purpose`;
  - phí trả sớm có biến thể;
  - `money()` cho `DEPOSIT_INSUFFICIENT`;
  - `DepositQr` thêm `onFail`;
  - `expiresAt − 1 phút`;
  - sửa test so chữ cũ.
- FE-B:
  - `gw.lang_auto`;
  - 3 chuỗi RU trên trang khách;
  - kiểm từ cấm RU;
  - bỏ `test.fail` ở `TC-L7-053`.
- Font (FE-A, MOB, FE-B; SEC duyệt):
  - giữ JetBrains Mono đủ Kirin;
  - `assetsInlineLimit` trả `false` cho `.woff`/`.woff2`;
  - `check:dist` không còn `data:font`;
  - không nới CSP `font-src`.
- BE-A: `min`/`max` trong lỗi `RATE_OUT_OF_RANGE`.
- BE-B: `line-labels.ts` dùng `bill.line.late_fee_as_night`.
- BE: chạy lại `gen-quote-copy.mjs`.

## 2. File tạo/sửa
- `rounds/round-05/outputs/UXD/copy-v1.0.5.md`: mới.
- `rounds/round-05/outputs/UXD/report.md`: mới, ORC lưu.
- Không sửa `gen_strings.py`, JSON, content-guide hay mã. Không add các PNG chưa track.

## 3. Giả định
- G1: số dòng tính tại `b9f017f7`.
- G2: ARC 0.3.13 thêm `min`/`max` vào `RATE_OUT_OF_RANGE`; nếu không, dùng `booking.error.rate_out_of_range_dates`.
- G3: xem số tài khoản dùng chung `c3_stepup_minutes`.
- G4: "номер" đã duyệt cho landing RU (lp-v2-copy 16.2).
- G5: 4 mẫu `msg.*` chưa có mã nào gọi.
- G6: câu phí phạt chỉ cho `penalty`. DOM xác nhận ca `damage`.
- G7: tham số giữ nhóm "Khác".
- ESC mới: không có.

## 4. Rủi ro / vướng mắc
- R1: `msg.checkout_reminder` viết cứng "(trước 12:00)". Chuỗi khách có "14:00" giữ nguyên (cam kết FB-INV-004). Lượt sau dùng `{checkout_time}`, CPY duyệt.
- R2: chữ phụ thuộc giá trị tham số: `rooms.night_auto` theo `prices_include_vat`; `params.extra_child` ("6–11 tuổi") theo `child_free_under_age`, `adult_from_age`.
- R3: cặp giờ không cho bằng nhau thì nhập đúng mốc cũ cũng bị từ chối. Câu báo vẫn chỉ đúng hướng sửa.
- R4: cột Giá trị vẫn hiện `true`/`false` và JSON thô. Đề xuất cho PO, ngoài v1.0.5.
- R5: validator `weekend_nights` (`parameter-rules.ts:180–187`) nhận số 1–7, trong khi giá trị đang chạy và bộ tính giá dùng `["FRI","SAT"]`.
  - Lưu đúng mức từ điển đề xuất thì lỗi 422.
  - Lưu dạng số thì bộ tính giá không nhận ra đêm cuối tuần.
  - Hiện chưa sai tiền vì mức tăng cuối tuần là 0. Chuyển BE, QA.
- R6: sổ tay (V5-71) trích chữ cũ, phải đổi cùng bản Desk.
- R7: test so chữ cũ phải sửa cùng PR.

## 5. Việc chưa xong
- CPY duyệt C1–C5. FE chờ CPY với các khóa này; khóa Desk nội bộ áp ngay sau review.
- DOM xác nhận ca `damage`, và `hold_expiry_reminder_hours = 0` có nghĩa là không nhắc.
- PO quyết 3 khóa mục 4.19.
- Sau khi FE áp, UXD làm tiếp:
  - review PR;
  - đồng bộ content-guide mục 8 (v0.4.7);
  - xóa `fo.tabs.holds`;
  - sửa ô `bk.src_weekend` trong hi-fi;
  - kiểm 362 px, 1440 px và trang khách RU.
- DOM cập nhật tên tham số trong từ điển.

## 6. Cập nhật 06/11 tối – Phản hồi & sửa (commit `9f5c74a2`)
- UXD trả lời 11 thẻ CPY ngay trong `rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md` (mục 8): 10 Fixed. Thẻ 04 Open, chờ DOM. Thẻ 02 tách ba phần: (a) và (b) Fixed, (c) Deferred sang v1.0.6 (R5-B-03).
- `copy-v1.0.5.md` bản 1.1 có 150 khóa: 69 sửa, 72 mới, 9 xóa. Chia theo việc: V5-20 22, V5-21 39, V5-22 8, V5-23 73, V5-24 8. Mục mới: 4.20 (chữ "căn"), 4.21 (dấu "!"), 5.3 (5 bước kiểm tự động cho FE-B).
- Ưu tiên theo PO, quyết định 15:
  - Bắt buộc: V5-20…V5-24 bản gốc, 4.20 (a), 5.1 RU (thẻ 01).
  - Nên có, làm cùng lượt C5: 4.20 (b), 4.21, thẻ 06 và 08. Không kịp thì chuyển US-125 hoặc B-SAU, theo quy tắc dự phòng ở 5.1.
  - Làm sau: 5.3 (FE-B), khi xong 4.20 (a) và (b).
  - Chờ DOM: thẻ 04. Khóa dự phòng `bill.line.late_fee_after_limit` đã soạn ở 4.8 nhưng chưa tính vào 150.
  - Để v1.0.6: 4.20 (c), C6, xóa `gw.room`.
- Việc cho vai khác (mục 6):
  - FE-B: `gw.lang_auto_sr`, `gw.req.clean_*`, test 5.3.
  - BE: chạy lại `gen-quote-copy.mjs` (RU dòng 2 và 4, VI dòng 2).
  - BE-B: một dòng, chờ DOM.
- Còn chờ: DOM (thẻ 04, ca `damage`, `hold_expiry_reminder_hours = 0`). PO đã chốt 3 khóa mục 4.19: vào V5-23.

## 7. Cập nhật 06/11 tối – bản in, thẻ CPY 12, V5-04
- **Bản in** (`bb67605d`):
  - Tờ 1: A4 một mặt, 2 cột, **8,25 pt**. Ở 9 pt bị tràn; bớt khoảng cách cũng chỉ lên được 8,5 pt.
  - Tờ 2a: chuyển sang **A4 dọc, in riêng, 11 pt** (`to-2a-giu-cho-qua-han-a4.pdf`). Ở A5 thì chỉ vừa 8 pt.
  - Tờ 2b: không đổi chữ; tách thành `to-2b-a4-2-ban.pdf` (2 bản trên một tờ A4, cắt đôi).
  - Đã xóa `to-2a-2b-a4-cat-doi.*` để không ai in nhầm bản 30/10.
  - Nét kẻ bảng và chân tờ đổi sang Stone Grey.
- **Thẻ CPY 12** (Major) Fixed ở `copy-v1.0.5.md` bản 1.3 (`5525baab`): sale, CTV tự bấm "Gia hạn giữ chỗ (1 lần)". Vẫn 146 khóa.
- **V5-04** (`a099cb9e`): sổ tay 1.15, bộ hướng dẫn 1.13 (`01` 1.12, `02` 1.13, `05` 1.8). Đã dựng lại HTML từ `main`; bộ kiểm 390/1440 px, font khi mất mạng, ảnh chỉ từ `img/` đều ĐẠT. HTML nằm ngoài repo theo `.gitignore`.
- **Việc chuyển PO** (ORC đã giao): sửa mục "Cách in và dán" và ghi chú khổ giấy trong `staff-one-pager.md`; giữ Tờ 1 ở 8,25 pt; tùy chọn bọc "OTM-…" bằng backtick.
- **ORC ghi thêm:** khi xem bản in, ORC thấy Tờ 2a dòng 86 hướng dẫn "Tiền về trước hạn → Xác nhận đã nhận cọc" cho giữ chỗ quá hạn chưa nhận đồng nào. Desk không cho việc này (QA BUG-R5-002, `allowed-actions.ts` 72–74). Tờ 2a chưa in tới khi DOM viết chữ thay và PO sửa. Sau đó UXD dựng lại Tờ 2a. BA đang thêm lời dặn về hai tham số vào sổ tay, nên UXD dựng lại HTML sau khi BA xong.

## 8. Cập nhật 06/11 khuya – copy v1.0.5 bản 1.5 (commit `0ea355a3`, `363110a3`)
ORC lưu từ báo cáo bàn giao của UXD.
- **PR #96 (V5-25):**
  - Ý (1): đồng ý với máy chủ. Mục 9.2 sửa. Thiếu `channels` (BR-113-23) có `allowed`, nên Desk hiện câu "Chọn một trong". Quá 20 luật chỉ có `max`. Ca 23 ở mục 8 chuyển nhóm. ARC không phải đổi gì.
  - Ý (2): mục 9.4 mới, câu lỗi chung cho 11 khóa có cấu trúc. Câu dựng từ `errors[0].field` (chỉ số đếm từ 1, tên khóa con giữ nguyên mã), ghép câu mục 2.3, rồi trỏ về mục từ điển theo mã tham số.
- **V5-16 (US-177, BR-438), mục 9.5 mới:**
  - câu phụ trong hộp Điều chỉnh cho FD, FDL;
  - câu chỉ dẫn khi máy chủ trả 403 có `requiredFlow = foc_request`;
  - nút "Gửi miễn có duyệt", mở form miễn phí đã điền sẵn phần định giảm;
  - lý do "Ghi nhầm", bộ lọc "Sửa giảm dòng – 7 ngày", mục "Cần chú ý" `line_reduction_count`.
- **5B-1, V5-48, V5-1A:** chữ cho Desk (commit `0ea355a3`).
- **Số khóa:** 34 mới, 1 sửa. Tổng mục 0: 72/115/7 = **194** (bản 1.4: 162).
- **Giả định:**
  - (a) `{field}` giữ mã khóa con.
  - (b) `FolioLine` không có nguồn `manual`, ngày nghiệp vụ ghi hay dòng gốc. Vì vậy Desk không đoán trước được dòng nào bị chặn: hộp Điều chỉnh giữ lối sửa, chỉ thêm câu phụ, dựa vào 403. Cách này khác gợi ý DOM (`rules-v1.0.5.md` dòng 178: đổi hẳn nút Sửa trên dòng ngoài phạm vi). ORC chuyển ARC và DOM.
  - (c) EN nút "Gửi miễn có duyệt" theo `ci.ask_foc`.
  - (d) Đề xuất cho PO, CPY: bill khách không in lý do "Ghi nhầm", chỉ in "Miễn phí".
  - (e) Cảnh báo giá: đổi chữ nút Lưu thành "Vẫn lưu giá này", không thêm hộp xác nhận.
- ESC mới: không có. Chưa sửa mã. FE áp theo bảng sau review.

## 9. Cập nhật 07/11 – copy v1.0.5 bản 1.8 (C0313-25)
- Mục 9.8 mới, một khóa: `pay.bank_reference_card_like`. Đây là câu lỗi dưới ô mã giao dịch khi máy chủ trả 422 `CARD_NUMBER_DETECTED` có `field` = `bankReference`, cho cả hộp ghi khoản thu và hộp chi hoàn (SEC chọn (a), `SEC-responses.md` mục 4).
  - VI: "Mã này trông giống số thẻ thanh toán nên Desk không lưu. Nhập 8 chữ số cuối của mã giao dịch."
  - EN: "This looks like a card number, so Desk can't save it. Enter the last 8 digits of the transaction reference."
- Hiện bằng `Field error` có sẵn (`--bad`, icon ✕). Không thêm màu. Khung lỗi của hộp đi nhánh `VALIDATION_FAILED`, không hiện câu ô ghi chú.
- Số khóa mục 0: 74/132/7 = **213** (bản 1.7: 212).
- Giả định:
  - (a) "8 chữ số cuối" thay cho "8 ký tự cuối" để chặn trùng S4 khớp, dù người gõ có dấu gạch, chấm hay không. Đề nghị SEC xem lại khi review PR-B3.
  - (b) "mã giao dịch" theo nhãn ô, thay cho "mã chuyển khoản".
- Lưu ý cho ORC khi báo INV cách làm tạm (SEC 4.4): trên production, ô mã ở hộp chi hoàn đang hiện câu "Ô ghi chú có dãy số giống số thẻ thanh toán…". Lời dặn nên ghi "nhập 8 chữ số cuối của mã giao dịch", cho khớp câu mới.
- ESC mới: không có. Chưa sửa mã.

## 10. Cập nhật 07/11 – copy v1.0.5 bản 1.9 (V5-15, điều kiện SEC cho BE PR #99)
- Mục 9.9 mới, một khóa: `checkout.overdue_reason_help`. Đây là chữ gợi ý D12c dưới ô lý do (`overdueReason`) của hộp Trả phòng quá ngày đi (SEC `SEC-on-be-prs-106-99-checkout.md` mục 2.5).
  - VI: "Lý do lưu vào nhật ký thay đổi. Không ghi họ tên, số giấy tờ hay thông tin sức khỏe của khách."
  - EN: "The reason is kept in the change log. Don't write the guest's name, ID numbers or health information."
- Không dùng lại được câu có sẵn: `crm.note_hint` thiếu họ tên; `webreq.note_hint`, `rsv.after_cancel.note_hint` thiếu giấy tờ hoặc sức khỏe.
- Hiện bằng `Field help` có sẵn (Stone Grey, 12 px). Không Alert, không thêm màu.
- Số khóa mục 0: 74/133/7 = **214**.
- Phát hiện: nhãn ô, 3 lý do gợi ý (DOM 7.1) và tiêu đề hộp chưa có trong `design/copy`. Đề xuất FE-A viết theo chữ DOM rồi UXD duyệt.
- ESC mới: không có. Chưa sửa mã.

## 11. Cập nhật 07/11 – Phản hồi & sửa: bản in Tờ 2a bản 07/11
- **Nguồn:** `product/docs/staff-one-pager.md` @ `5bbed1fb`. Đây là bản DOM đọc lần cuối (FB-R5-DOM-PO-08 Closed, `DOM-on-ba-v105-docs.md` mục 1). Bảng "Cách in" theo câu DOM vừa tách: Tờ 1 in bản 06/11, Tờ 2a chỉ in bản 07/11. Chữ giữ nguyên văn, UXD không sửa nguồn.
- **Dựng bằng cùng bộ dựng:** `product/design/tools/build_print_sheets.py --pdf --only to-2a-giu-cho-qua-han-a4`. Ra hai tệp, ghi đè đúng chỗ bản 06/11:
  - `product/docs/print/to-2a-giu-cho-qua-han-a4.html`
  - `product/docs/print/pdf/to-2a-giu-cho-qua-han-a4.pdf`
- **Khổ:** A4 dọc, một mặt, 2 cột, **11 pt** như bảng "Cách in". Viền Light Oak cách mép 6 mm. Tờ có 1 trang (MediaBox 209,9 × 297 mm).
- **Chỗ chữ:**
  - Bản 07/11 dài hơn (hai câu PO-08). Với khoảng cách cũ (dòng 1,3), tờ vừa khít 11 pt và còn 0 mm. In HTML bằng trình duyệt khác có thể làm mất dòng cuối cột mà không báo.
  - UXD giữ 11 pt. Chỉ đổi khoảng cách, và chỉ ở Tờ 2a (lớp `.snug`):
    - dòng 1,28;
    - khe cột 6 mm;
    - đầu tờ bớt 0,8 mm;
    - mỗi gạch đầu dòng bớt 0,2 mm.
  - Đo: còn **6,5 mm mỗi cột** (khoảng 1 dòng). Đã soi ảnh khoảng 420 dpi: dấu chồng (ỗ, ẩ, ắ) không chạm chân chữ dòng trên.
  - Không cắt câu "Tới v1.0.5…". DOM chỉ cho cắt câu này khi tờ không vừa và v1.0.5 đã lên production.
- **Chân tờ:**
  - Ghi "Bản 30/10/2026, sửa 06/11/2026 (…), 07/11/2026 (Tờ 2a: hộp Thông báo trên app nhân viên)". Nhìn chân tờ là phân biệt được với bản 06/11, đúng lời dặn "Không in Tờ 2a bản 06/11".
  - Tên tờ không còn ngắt giữa cụm: "OTTIMO Desk · Tờ 2a ·" / "Giữ chỗ quá hạn (tạm)".
- **Kiểm:**
  - Bộ dựng thoát mã 0: không tràn, 1 trang.
  - Trích chữ trong PDF bằng PDFKit: đủ 3 133/3 133 ký tự của phần "## Tờ 2a", đúng thứ tự, đủ 17 mũi tên. Không mất dòng.
  - Không có emoji trong nguồn, HTML và chữ PDF.
  - Font nhúng: Lora Medium, Be Vietnam Pro Regular/SemiBold, JetBrains Mono (mã `OTM-…`).
  - Ảnh khổ in (PDF dựng ảnh khoảng 210 dpi, bản màu và bản xám): chữ Ink rõ; viền, chân tờ (Stone Grey) và chấm đầu dòng vẫn thấy khi in đen trắng.
  - Ảnh màn hình 1440 px và 390 px (giả lập máy, không cuộn ngang): đủ hai cột và chân tờ.
- **Ảnh kiểm để ngoài repo** (không có dữ liệu khách; repo công khai, tệp lớn): thư mục scratchpad của phiên `…/scratchpad/uxd-2a-0711/final/` gồm `print-a4-color.png`, `print-a4-gray.png`, `desktop-1440.png`, `mobile-390.png`.
- **Tờ 1:** không dựng lại. Dựng thử ra ngoài repo: thân Tờ 1 giống hệt bản 06/11 đã commit (`bb67605d`). Chỉ khác chân tờ, vì dòng bản in nay có thêm "07/11/2026 (Tờ 2a…)". Bản Tờ 1 06/11 vẫn đúng để in.
- **Còn từ trước, không mới:** mũi tên "→" in bằng Arial, vì gói Be Vietnam Pro của Google Fonts không có ký tự U+2192. Bản 06/11 của Tờ 1 và Tờ 2a cũng vậy. Ở 11 pt nhìn không ra. Đề xuất v1.0.6: nhúng font đủ ký tự cho tờ nhân viên, như đang làm cho Tờ 4.
- **Dòng decision-log đề xuất** (ORC ghi):
  `| 2026-11-07 | 5 | **UXD – dựng lại bản in Tờ 2a bản 07/11** (staff-one-pager.md @ 5bbed1fb, DOM PO-08 Closed): A4 dọc, 2 cột, 11 pt, một trang (product/docs/print/pdf/to-2a-giu-cho-qua-han-a4.pdf). Giữ cỡ 11 pt; riêng Tờ 2a dòng 1,28 và bớt khoảng trắng phụ, còn 6,5 mm mỗi cột (trước đó 0 mm). Không cắt câu nào. Chân tờ ghi bản 07/11. Tờ 1 bản 06/11 không đổi thân, không dựng lại | UXD | Quyền UXD (dàn trang bản in); chữ nguyên văn PO + DOM |`
- **Việc cho ORC:** báo chủ đầu tư PDF Tờ 2a bản 07/11 đã dựng lại, theo dòng "Cách in" của `staff-one-pager.md`. Gỡ bản cũ cùng lúc.
- ESC mới: không có. Không sửa nguồn chữ, không dựng HTML sổ tay 1.18 / bộ hướng dẫn 1.16 (chờ DOM đọc câu BA mới).
