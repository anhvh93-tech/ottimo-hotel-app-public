# DOM review – FE PR #168 (V5-16 Desk: 403 `foc_request` → Gửi miễn có duyệt, lý do Ghi nhầm)

- Round 5 (v1.0.5) · Bước: Review · DOM · 07/11/2026
- PR #168, nhánh `r5-fe-v5-16` @ `a5285fd1`. Báo cáo: `rounds/round-05/outputs/FE/v5-16-desk-reduce-foc-fea.md` (trên nhánh).
- DOM đọc: báo cáo FE; 5 khóa chữ mới trong `gen_strings.py`; diff `FolioDialog.tsx`, `foc.tsx` (vai, `canAskFoc`, số điền sẵn), `mocks/stay.ts` (luật mock). Đối chiếu BR-438, DOM `rules-v1.0.5.md` 3.1–3.6, 7.2 (sửa 07/11, mục 14.1), BR-431…436, US-177 AC2, AC8, AC10. DOM không chạy test.
- Không có dữ liệu khách thật, không có số hoa hồng.

## 0. Kết luận

**DUYỆT về nghiệp vụ.** Một thẻ Minor, một Suggestion, không chặn gộp. Không ESC.

## 1. Ba điểm ORC hỏi

**(a) FD/FDL giảm dòng của người khác, hay dòng của mình từ hôm qua → phải Gửi miễn có duyệt: đúng BR-438 (1)(2).**
- Tự sửa thẳng chỉ khi đủ ba điều: dòng chính mình nhập tay (A30 hay đếm minibar), trong ngày nghiệp vụ hiện tại, folio chưa chốt; xét theo dòng gốc. Ngoài ra là 403 `requiredFlow = foc_request`, folio không đổi. PR làm đúng thế: câu chỉ dẫn, hộp giữ số đã gõ, nút mở form miễn phí đúng dòng.
- Số điền sẵn = số cũ − số mới, bỏ dòng = cả dòng, không quá `foc.max`. Khớp T-16-11 và ví dụ 3.3: Lan sửa dòng 3 × 35.000 của Hạnh về 2 → bị chặn → FOC **35.000**; bill minibar 105.000, FOC −35.000. Dòng đã miễn 50.000 mà bỏ dòng → điền **55.000**, không 105.000. Đúng: không bao giờ miễn quá số còn lại.
- MGR, OWN sửa như cũ; người có cả vai lễ tân và quản lý sửa như quản lý. Đúng 3.1 (3) và `limitedByBr438` của máy chủ.
- Folio đã chốt (A32, ví dụ dòng trả muộn B18 sau khi bấm Trả phòng): 403 không `requiredFlow`, câu chung, không nút. Đúng T-16-4: muốn miễn thì FOC **trước** khi bấm Trả phòng.
- Câu phụ `folio.adjust_reduce_rule` chỉ cho FD/FDL, không hiện ở dòng đêm. Đúng: dòng đêm không thuộc BR-438 (sửa giá đêm là A31).

**(b) Lý do "Ghi nhầm" chỉ ở FOC theo dòng, không có ở B9/B15: đúng.**
- "Ghi nhầm" nghĩa là dòng **đã ghi** sai (sai số lượng, sai căn, ghi trùng). Chỉ form miễn phí của dòng đã có trên folio mới có ý nghĩa đó, kể cả ở Trả phòng bước 2.
- B9 (nhận sớm) và B15 (trả muộn) là lúc **đang ghi** phụ thu kèm xin miễn. Ghi sai thì sửa giờ trước khi lưu, không ghi rồi miễn. Có "Ghi nhầm" ở đó thì miễn phụ thu thật sẽ được gắn nhầm lý do, làm báo cáo FOC tách "ghi nhầm" mất nghĩa (lý do DOM 3.1 đề xuất mã riêng).
- Không chọn sẵn lý do khi mở từ nút: đúng. Chọn sẵn "Ghi nhầm" thì mọi lần miễn theo lối này đều thành "ghi nhầm", kể cả miễn cho khách quen, đúng đường thất thoát SEC muốn tách.
- Bill khách không in lý do (in "Miễn phí"): đúng US-177 AC10. Khách không cần biết quầy ghi nhầm.
- Miễn "Ghi nhầm" vẫn đi đường FOC: tính hạn mức BR-433, đếm cảnh báo BR-435, minibar tự áp trong hạn mức BR-436. Đúng 3.1 (2). Phần "không cộng FOC tháng" của 3.1 (4) chỉ dành cho lần tự sửa hợp lệ theo (1), không dành cho FOC "Ghi nhầm".

**(c) Dòng không còn gì để miễn thì không hiện nút: đúng, nhưng câu chưa khớp.** Không có gì để miễn (đã miễn hết, hoặc yêu cầu chờ duyệt đã phủ cả dòng) thì mở form chỉ dẫn tới lỗi khác. Bỏ nút là đúng. Nhưng câu `error.reduce_needs_foc` vẫn bảo "Bấm Gửi miễn có duyệt…" mà không có nút. Xem thẻ 168-01.

## 2. Thẻ

### FB-R5-DOM-FE-168-01
- Mức độ: Minor – FE (UXD viết câu), v1.0.5 nếu kịp, không chặn gộp.
- Vị trí: `FolioDialog.tsx`, khung 403 `requiredFlow = foc_request` khi `canAskFoc` = false; khóa `error.reduce_needs_foc`.
- Vấn đề: câu nói "Bấm Gửi miễn có duyệt để người có quyền duyệt xem", nhưng khung không có nút (dòng đã miễn hết, hoặc đang có yêu cầu chờ duyệt cho phần còn lại). Lễ tân đi tìm một nút không có.
- Vì sao quan trọng: ca hay gặp đúng lúc trả phòng: ca trước đã gửi miễn cả dòng, ca sau lại định bỏ dòng. Câu đúng giúp lễ tân biết chỉ cần chờ người duyệt, không gửi trùng và không giữ khách.
- Đề xuất sửa: khi không có nút, dùng câu riêng (UXD chốt chữ), ý: "Chưa ghi điều chỉnh. Dòng này đã được miễn hết hoặc đang có yêu cầu miễn chờ duyệt. Xem mục Cần duyệt, hoặc báo quản lý." Thêm một ca test: dòng có yêu cầu chờ duyệt cả dòng → 403 → câu riêng, không nút.
- Trạng thái: Open

### FB-R5-DOM-FE-168-02
- Mức độ: Suggestion – FE, UXD. Trả lời câu hỏi của FE ở báo cáo mục 3.
- Vị trí: form miễn phí mở từ nút `folio.foc_request_btn`, ô Ghi chú.
- Vấn đề: lễ tân đã gõ lý do ở hộp Điều chỉnh (bắt buộc); form miễn phí để trống Ghi chú, nên người duyệt không thấy lý do đó nếu lễ tân không gõ lại.
- Vì sao quan trọng: người duyệt (quản lý, chủ đầu tư) quyết nhanh hơn khi thấy ngay "khách đổi ý, 2 lon chứ không phải 3". Lễ tân ca đông dễ bỏ ô Ghi chú.
- Đề xuất sửa: **điền sẵn** Ghi chú bằng lý do đã gõ ở hộp Điều chỉnh, sửa được. Lý do (nút chọn) vẫn để trống như PR.
- Trạng thái: Open

## 3. Điểm làm tốt

- Desk không đoán trước dòng nào bị chặn; máy chủ quyết, Desk chỉ dẫn đúng lối. Đúng cách DOM 3.6 đã chọn cho v1.0.5.
- Số điền sẵn lấy lúc bấm Ghi điều chỉnh, nên sửa ô sau 403 không làm lệch số máy chủ đã từ chối.
- Mock bám luật dòng gốc và "nhập tay theo loại dòng" (A30, đếm minibar), không theo mã `source`, đúng sửa 07/11 mục 14.1.

## 4. Giả định

- Máy chủ trên `main` (`line-reduction.ts`) là chuẩn; luật mock chỉ để test Desk.
- Đếm lại minibar thấp hơn (T-16-13) ngoài phạm vi PR này, như FE ghi; khi `recordMinibarCheck` có 403 thì dùng cùng nút.

`| 2026-11-07 | 5 | **DOM – review FE PR #168 (V5-16 Desk, BR-438) @ a5285fd1: DUYỆT nghiệp vụ.** FD/FDL giảm dòng người khác, dòng Desk tự ghi hay dòng ngày trước → 403 foc_request → Gửi miễn có duyệt, số điền sẵn = cũ − mới (bỏ dòng = cả dòng), không quá foc.max (ví dụ 3.3: 35.000; dòng đã miễn 50.000 → 55.000); MGR/OWN như cũ; folio đã chốt (A32) câu chung không nút. Lý do Ghi nhầm chỉ ở FOC theo dòng đã ghi, không ở B9/B15 (đang ghi phụ thu – có thì báo cáo FOC tách ghi nhầm mất nghĩa); không chọn sẵn lý do; bill khách in "Miễn phí"; FOC Ghi nhầm vẫn tính hạn mức BR-433, cảnh báo BR-435. Không còn gì để miễn → không nút: đúng. Thẻ 168-01 Minor FE/UXD (khi không nút, câu vẫn bảo bấm Gửi miễn có duyệt – cần câu riêng "đã miễn hết hoặc đang chờ duyệt"), 168-02 Suggestion (điền sẵn Ghi chú bằng lý do đã gõ ở hộp Điều chỉnh). Không ESC | DOM | rounds/round-05/reviews/DOM-on-fe-pr-168.md |`
