# QA – Kiểm trên staging: FB-INV-012 phiếu thanh toán tháng khách dài hạn

## L6. Kiểm lại BUG-R5-017, nhập đủ bảng giá dọn 10 căn (20/11, 08:38–08:50)

- Bản kiểm: Desk staging `main` @ `b250cd37` (BE #203 + FE #202, sửa BUG-R5-017). Ngày nghiệp vụ 20/11/2026.
- Cách chạy như L5: API script và Playwright, tài khoản `qa.*`, khách giả KH-0486. Lượt này không cần thiết bị tin cậy, nên không cấp.
- Trạng thái lúc bắt đầu: dòng `{}` QA lên lịch ở L5 đã có hiệu lực từ 20/11, nên bảng rỗng. Lần lưu đầu hôm nay vì vậy đã là lần ghi đè dòng của hôm nay.

### L6.0 Kết luận: **ĐẠT** – đóng BUG-R5-017; bảng staging đủ 10 căn; không có lỗi mới

- **13 ca: 13 đạt, 0 trượt.**
- **Bảng staging hiện tại:** 101, 102, 103, 201, 202, 203 = 150.000; 301, 302, 401, 402 = 200.000. Hiệu lực từ 20/11, không còn dòng nào lên lịch sau đó.
- **Ghi chú tài liệu (cho PO/OPS, không ghi lỗi):** go-live guide 7.1 bản mới ghi "**Thêm dòng phát sinh**" và "chọn 'Dọn phòng lẻ'". Desk lại hiện nút "Thêm phát sinh" và khoản "Dọn phòng thêm" ("Dọn phòng lẻ" chỉ là tên máy chủ trả về). Nên sửa guide theo đúng chữ trên màn hình.
- **Ghi chú cho UXD:** nút "Chọn ngày mai" nằm dưới ô "Lý do", không nằm ngay dưới câu lỗi ở "Hiệu lực từ". Vẫn dùng được, xem ảnh.
- Không có ESC mới.

### L6.1 Kết quả

| # | Ca | Kết quả | Bằng chứng ngắn |
|---|---|---|---|
| 1 | BUG-R5-017: lần lưu 1 trong ngày (S24, OWN, VI) | **Đạt** | Hộp điền sẵn "Hiệu lực từ" 20/11. Lưu 202 = 160.000 (giá thử) → `PUT` 200, ghi đè dòng `{}` của hôm nay. Toast "Đã lưu Giá dọn thêm khách dài hạn theo căn, áp dụng ngay." |
| 2 | Giá mới áp dụng ngay (lần 1) | **Đạt** | OTM-00412 (202): `charge-catalog?folioId=` 160.000, `priceSource: long_stay_room`. Web khách `request-options` 160.000, `long_stay_adhoc`. Khách gửi yêu cầu dọn → `feeVnd` 160.000 |
| 3 | BUG-R5-017: lần lưu 2 trong ngày, đủ 10 căn | **Đạt → Đóng** | Lưu cả 10 căn (202 về 150.000), hiệu lực hôm nay → `PUT` 200, cùng toast "… áp dụng ngay." Dòng bảng: "10 căn có giá riêng", 20/11/2026 08:39. Lịch sử chỉ có **một** dòng 20/11 (ghi đè, không thêm dòng) |
| 4 | Nhật ký ghi đè | **Đạt** | `audit-events` `config.changed`: `before.value` `{"202":160000}` → `after` đủ 10 căn, `sameDayOverride: true`. Lần 1: `before` `{}`, `sameDayOverride: true` |
| 5 | Giá mới áp dụng ngay (lần 2) | **Đạt** | Ngay sau lần lưu 2, `charge-catalog` cho thấy giá bảng mới, `long_stay_room`: OTM-00408 (103) 150.000, OTM-00385 (203, L5 chưa có giá) 150.000, OTM-00412 (202) 150.000, OTM-00409 (402) 200.000. Web khách: 202 → 150.000, 402 → 200.000 |
| 6 | Yêu cầu gửi trước lúc đổi giữ giá đã chụp | **Đạt** | Yêu cầu 160.000 gửi giữa lần lưu 1 và lần lưu 2 vẫn là 160.000 sau lần lưu 2. HK bắt đầu rồi xong việc dọn liên kết → folio ghi dòng `adhoc_cleaning` **160.000**, không phải 150.000. MGR đã hủy dòng (dòng đảo −160.000) |
| 7 | Lưu lần 3 trong ngày, EN | **Đạt** | `ottimo.locale = en`, lưu lại bảng → 200, toast "Saved Extra cleaning for long stays, by room, in force now." |
| 8 | MGR lưu trong ngày | **Đạt** | MGR lưu lại đúng bảng 10 căn, hiệu lực hôm nay → 200 (`editableBy` có manager). FDL, FD → 403 `FORBIDDEN_ACTION` (ca 10) |
| 9 | Khóa khác lưu 2 lần trong ngày → `ALREADY_IN_FORCE` | **Đạt** | `weekend_uplift_pct`, giữ nguyên 0 (không đổi giá). Lần 1 hôm nay → 200. Lần 2 → 422 `VALIDATION_FAILED`, `errors[{field: effectiveFrom, code: ALREADY_IN_FORCE}]`, `detail` như cũ |
| 10 | Q21 chạy lại khi lưu được trong ngày | **Đạt** | Các giá trị sai, hiệu lực hôm nay: 0, −1000, 150500, 5001000, chuỗi → `PARAM_OUT_OF_RANGE` `value.202`; căn 999 → `NOT_IN_LIST`; mảng, số trơn → `VALIDATION_FAILED`; FDL, FD → 403. Bảng 10 căn **không đổi**: bộ kiểm vẫn chạy trước khi ghi đè |
| 11 | UI `ALREADY_IN_FORCE` và nút ngày mai (VI, EN) | **Đạt** | S24 → "Khác" → `weekend_uplift_pct` → Sửa → Lưu. VI: dưới "Hiệu lực từ" hiện "Tham số này đã được đổi cho hôm nay. Chọn từ ngày mai trở đi." và nút "Chọn ngày mai". Bấm nút: ngày thành 21/11/2026, câu lỗi và nút ẩn. EN: "This setting was already changed for today. Choose tomorrow or a later date." và "Use tomorrow's date", bấm cũng thành 21/11. QA đóng hộp, không lưu dòng 21/11 |
| 12 | 12.4: ngắn ngày ở căn có giá | **Đạt** | OTM-00418 (MGR tạo, kênh nội bộ, ngắn ngày 20–22/11, căn 401 = 200.000 trong bảng): `charge-catalog` 100.000, `priceSource: default`. Đã hủy đơn |
| 13 | 12.4: hộp "Thêm phát sinh" (VI, EN), câu phí phạt | **Đạt** | OTM-00409 (402), VI: "Dọn phòng thêm", "Giá mặc định 200.000 đ", chip "Giá dài hạn của căn". Câu phí phạt chỉ hiện ở khoản phạt. EN: "Extra cleaning", "Long-stay room price", không lẫn tiếng Việt ở khoản dọn; câu "Fines don't count as room revenue." chỉ ở khoản phạt |

### L6.2 Dọn staging

- **Bảng giá dọn:** để lại đủ 10 căn theo giá chủ đầu tư (việc 3). Dòng `{}` lên lịch từ L5 không còn: nó đã có hiệu lực 20/11 và bị lần lưu 1 ghi đè. Không có dòng nào sau 20/11.
- **`weekend_uplift_pct`:** có thêm một dòng 20/11 cùng giá trị 0. Giá không đổi. Không có dòng 21/11.
- **Yêu cầu khách và folio:** yêu cầu 160.000 của OTM-00412 đã `done`; dòng 160.000 trên folio đã có dòng đảo. Link khách đã thu hồi sau mỗi lần dùng.
- **Đơn L6 tạo ra:** OTM-00418 đã hủy (chưa nhận phòng). Căn 401 vẫn **VC**.
- **Không đụng:** OTM-00408, 00409, 00385; OTM-00412 chỉ có các dòng trên.
- **Còn lại, API không xóa được:** dòng 160.000 và dòng đảo trên OTM-00412.
- **Đang ở trên staging sau lượt này:** OTM-00385 (203), OTM-00408 (103), OTM-00409 (402), OTM-00412 (202).

### L6.3 Ảnh (scratchpad, không commit)

- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L6-lscf-save1.png`, `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L6-lscf-save2.png` – lần lưu 1 và lần lưu 2 trong ngày, toast "áp dụng ngay".
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L6-lscf-save3-en.png` – toast EN.
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L6-uplift-vi-err.png`, `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L6-uplift-vi-tomorrow.png` – câu `ALREADY_IN_FORCE` và sau khi bấm "Chọn ngày mai".
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L6-uplift-en-err.png`, `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L6-uplift-en-tomorrow.png` – bản EN.
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L5-charge-L6-B.png` – "Thêm phát sinh" của OTM-00409, 200.000.

## L5. Giá dọn thêm khách dài hạn theo căn – contract §12.4 (19/11, 21:55–22:12)

- Bản kiểm: Desk staging sau CI `44544747375` (`main` @ `8b570d41` = BE #200 + FE #201).
- Giá chủ đầu tư: Studio 150.000 (101, 102, 103, 201, 202, 203); Premium (302, 402) và Signature (301, 401) 200.000. Giá chung `adhoc_cleaning_fee` 100.000.
- Cách chạy như L4: API script và Playwright, tài khoản `qa.*`, khách giả KH-0486. QA OWN cấp thiết bị tin cậy "QA STG API 2026-11-19" đầu lượt, thu hồi lúc 22:11.
- Dữ liệu: OTM-00408 (103), OTM-00409 (402), OTM-00412 (202), OTM-00385 (203) là các lượt dài hạn đang ở. OTM-00416 (ngắn ngày, 401) và OTM-00417 (dài hạn, 302) do L5 tạo, đã hủy.

### L5.0 Kết luận: **ĐẠT CÓ LỖI** – §12.4 chạy đúng; 1 lỗi mới P2 (BUG-R5-017)

- **12 ca: 11 đạt, 1 trượt.** Mọi ca Điều phối viên giao (Q19–Q21, Q16) đều đạt.
- **Ca trượt:** QA tìm thêm. Trong ngày, OWN chỉ lưu được bảng giá một lần. Lần lưu thứ hai bị 422, Desk hiện "Giá trị này chưa hợp lệ – kiểm tra lại." ở ô "Hiệu lực từ" mà không nói lý do. Go-live guide 7.1 lại hướng dẫn "nhập từng căn, hiệu lực từ hôm nay". Xem BUG-R5-017.
- Đã biết, không ghi lỗi mới:
  - Giao diện EN còn tên tiếng Việt cho các khoản khác ngoài dọn thêm (UXD 201-02, dời round sau).
  - Câu giá mặc định hiện mã luật cho lễ tân ("set by BR-506"), có từ trước §12.4.
- Không có ESC mới.

### L5.1 Kết quả

| # | Ca | Kết quả | Bằng chứng ngắn |
|---|---|---|---|
| 1 | Q21: hook chặn giá sai | **Đạt** | OWN, `PUT parameters/long_stay_cleaning_fee_by_room`. `{"202":0}`, `-1000`, `150500` (không chia hết 1.000), `5001000`, `"150000"` (chuỗi) → 422 `PARAM_OUT_OF_RANGE`, `errors[].field` = `value.202`. Căn `999` → 422, `value.999: NOT_IN_LIST`, `allowed` = 10 căn + căn thử `QAT1` của staging. Mảng, số trơn → 422 `VALIDATION_FAILED`. Không lần nào ghi giá |
| 2 | Q21: quyền | **Đạt** | FDL và FD lưu `{"202":150000}` → 403 `FORBIDDEN_ACTION`. `editableBy` = owner, manager |
| 3 | Q19: OWN đặt bảng ở S24 | **Đạt** | Tham số → "Dài hạn – phiếu tháng" → "Giá dọn thêm khách dài hạn theo căn". Hộp có 10 ô "Căn 101…402", câu "Để trống thì căn dùng giá dọn thêm chung (100.000 đ). Khách ngắn ngày luôn dùng giá chung." Nhập 150500 → báo lỗi tại ô, không lưu. Lưu 103, 202 = 150.000 và 401, 402 = 200.000, kèm lý do → 200. Dòng bảng và lịch sử hiện đúng 4 căn |
| 4 | Q19: folio dài hạn, căn có giá | **Đạt** | `GET charge-catalog?folioId=`: OTM-00408 (103) và OTM-00412 (202) 150.000, OTM-00409 (402) 200.000, `priceSource: long_stay_room`. Hộp "Thêm phát sinh", khoản "Dọn phòng thêm": giá 150.000 kèm chip "Giá dài hạn của căn" |
| 5 | Q19: folio dài hạn, căn chưa có giá | **Đạt** | OTM-00385 (203, không có trong bảng): 100.000, `priceSource: default` |
| 6 | Q19: folio ngắn ngày ở căn có giá | **Đạt** | OTM-00416 (ngắn ngày, căn 401 = 200.000 trong bảng): 100.000, chip "Giá chung" |
| 7 | Q20: khách dài hạn gửi yêu cầu dọn trên web khách | **Đạt** | OTM-00412 (202). `request-options` `extra_cleaning`: `feeVnd` 150.000, `feeReason: long_stay_adhoc`. Gửi yêu cầu (`feeAccepted: true`) → 201, `feeVnd` 150.000. HK bắt đầu rồi xong việc dọn liên kết → folio có dòng `adhoc_cleaning` **150.000** "Dọn phòng lẻ theo yêu cầu khách (BR-506)". MGR đã hủy dòng (`voidLine`, dòng đảo −150.000) |
| 8 | Q20: yêu cầu gửi trước khi đổi giá giữ giá cũ | **Đạt** | Yêu cầu dọn của OTM-00412 gửi lúc 22:02:08, trước khi OWN lưu bảng (22:02:53), vẫn giữ 100.000. Cùng lúc đó `request-options` đã là 150.000. Trang khách liệt kê cả hai yêu cầu: 150.000 và 100.000 |
| 9 | Q19: giao diện EN | **Đạt** | `ottimo.locale = en`, OTM-00412: nút "Add charge", khoản "Extra cleaning", chip "Long-stay room price", không còn chữ tiếng Việt của khoản dọn. Các khoản khác còn tên tiếng Việt (UXD 201-02, đã biết) |
| 10 | Q19: câu phí phạt chỉ ở khoản phạt | **Đạt** | Câu "Phí phạt không tính vào doanh thu phòng." chỉ hiện ở "Khử mùi thuốc lá" và "Mất/hỏng thẻ phòng" (`penalty`). Không hiện ở dọn thêm, giặt ủi, hư hỏng (khăn tắm, ly, remote), đồ ăn uống, dịch vụ khác. EN: "Fines don't count as room revenue." chỉ ở khoản phạt |
| 11 | Thêm: lưu bảng lần hai trong ngày | **Trượt → BUG-R5-017** | OWN mở lại S24, hộp điền sẵn 4 căn đã lưu. Thêm 302 = 200.000, lưu → Desk gửi đủ 5 căn với `effectiveFrom` hôm nay → 422 `VALIDATION_FAILED` "value already effective – add a row with a later effectiveFrom". Desk chỉ hiện "Giá trị này chưa hợp lệ – kiểm tra lại." dưới "Hiệu lực từ". Bảng không đổi |
| 12 | Q16 smoke trên OTM-00412 | **Đạt** | Nháp 12/2026 `final`, kỳ thuê 01–13/12, tiền thuê 3.689.000, như L3/L4. Đã hủy nháp |

### L5.2 Dọn staging

- **Bảng giá:** QA OWN thêm dòng `{}` hiệu lực từ **20/11/2026** (lý do "QA L5 tra bang gia ve rong sau kiem thu").
  - Không trả về `{}` ngay trong hôm nay được, vì lỗi ở ca 11 (máy chủ không cho thêm dòng thứ hai cùng ngày).
  - Hết ngày nghiệp vụ 19/11 trên staging, bảng 4 căn (103, 202: 150.000; 401, 402: 200.000) vẫn chạy; từ 20/11 là rỗng. Lịch sử S24 hiện dòng 20/11 "Chưa hiệu lực".
  - Nếu chủ đầu tư muốn thử trên staging trước go-live: OWN đặt dòng mới từ 21/11 trở đi, hoặc sửa dòng 20/11.
- **Yêu cầu khách:**
  - đã từ chối (`decline`, lý do `other`): yêu cầu cũ 100.000 của OTM-00412 và 3 yêu cầu của OTM-00417;
  - yêu cầu 150.000 của OTM-00412 đã `done`, dòng folio 150.000 đã có dòng đảo;
  - việc dọn liên kết đã `cancelled` hoặc `done`;
  - link khách đã thu hồi sau mỗi lần dùng.
- **Đơn L5 tạo ra:** OTM-00416 và OTM-00417 đã hoàn tác nhận phòng rồi hủy. Căn 302 và 401 trở về **VC**.
- **Phiếu:** nháp 12/2026 của OTM-00412 đã hủy (`void`).
- **Thiết bị tin cậy:** đã thu hồi.
- **Không đụng:** OTM-00408, 00409, 00412 (ngoài các dòng trên), OTM-00385.
- **Còn lại, API không xóa được:**
  - giấy tờ CCCD giả của OTM-00416, 00417 (khách giả KH-0486);
  - 1 dòng folio và dòng đảo trên OTM-00412;
  - 1 yêu cầu "other" `acknowledged` ở căn 203 tạo ngày 22/10, không phải của L5, QA để nguyên.
- **Đang ở trên staging sau lượt này:** OTM-00385 (203), OTM-00408 (103), OTM-00409 (402), OTM-00412 (202).

### L5.3 Ảnh (scratchpad, không commit)

- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L5-dialog-filled.png`, `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L5-row-after.png` – hộp S24 đã điền và dòng bảng sau khi lưu.
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L5-charge-X.png` – "Thêm phát sinh" của OTM-00412, chip "Giá dài hạn của căn".
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L5-charge-SS.png` – OTM-00416 ngắn ngày, chip "Giá chung".
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L5-charge-X-pen.png` – câu phí phạt ở khoản phạt.
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L5-charge-OTM-00412-en.png` – giao diện EN, "Extra cleaning".
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L5-second-save.png` – BUG-R5-017, lần lưu thứ hai trong ngày.

## L4. Kiểm lại BUG-R5-014..016, chữ mới, dọn staging (19/11, 16:38–16:50)

- Bản kiểm: Desk staging sau CI `44488395821` (`main` @ `4d47af0d` = BE #199 + FE #198), job `deploy staging` xanh.
- Cách chạy như L3: API script + Playwright, `qa.*`, khách giả. QA OWN cấp thiết bị tin cậy "QA STG API 2026-11-19" lúc 16:38, thu hồi lúc 16:44.

### L4.0 Kết luận: **ĐẠT** – đóng BUG-R5-014, 015, 016; không có lỗi mới

- **11 ca: 10 đạt, 0 trượt, 1 chưa kết luận.** Ca chưa kết luận là Q13 đường B9 (`checkIn.payment` với `outside_desk`): server chặn ở bước kiểm khác trước, xem L4.1.
- **Lỗi FB-INV-012 còn mở: 0.** Lỗi Round 5 còn mở ngoài phần này không đổi: BUG-R5-002, BUG-R5-007 (P2).
- **Dọn staging xong:** 6 lượt `in_house` cũ đã trả phòng, 6 căn sạch (VC). Q7 đã chạy và đạt.
- UXD 196-04 (checkbox của trình duyệt) vẫn còn. Không thuộc việc lượt này, chỉ ghi lại.
- Không có ESC mới.

### L4.1 Kết quả

| # | Ca | Kết quả | Bằng chứng ngắn |
|---|---|---|---|
| 1 | BUG-R5-014: dời ngày đến vào đêm bận | **Đạt → Đóng** | OTM-00415 (MGR tạo, căn 101, đến 18/11). `checkInBackdated` với `arrivalDate` 16/11 → 409 `ROOM_UNAVAILABLE`. `conflicts` chỉ có lượt khác: OTM-00403, đêm 16/11. Không còn đêm của chính đơn |
| 2 | BUG-R5-015: MGR và `settle_outside_desk` sau khi có khoản bị đảo | **Đạt → Đóng** | OWN đảo khoản 3.000.000 trên TT-2611-202 → `partially_paid`, phiếu đã có 2 khoản bị đảo. MGR: `availableActions` = `record_payment, print` (không còn nút); drawer MGR chỉ có "Ghi đã thu". OWN vẫn có `settle_outside_desk`. MGR gọi thẳng → 403 "owner only" như cũ |
| 3 | BUG-R5-016: hotline có nhóm số, JetBrains Mono | **Đạt → Đóng** | OWN lưu "+84 900 000 222" (server lưu `+84900000222`). S24 "Xem trước chân phiếu": "QA 2 Duong Thu Nghiem, Phuong 1, Da Lat · +84 900 000 222", số hotline ở thẻ `.mono` font `"JetBrains Mono"`. Ô nhập hotline cũng là JetBrains Mono. Trang in TT-2611-202: chân phiếu "+84 900 000 222", cùng thẻ `.mono` JetBrains Mono |
| 4 | Giới hạn ngày trong form "Khách đang ở từ trước" (T = 19/11) | **Đạt** | Ngày vào: `min` 05/10 = T−45, `max` 18/11 = T−1. Ngày ra: `min` 20/11 (sau hôm nay). Lượt L3 `min` ngày ra là 18/11 |
| 5 | `od.confirm_body` | **Đạt** | Hộp xác nhận: "Lúc này không thu tiền. Khoản này không vào ca, đối soát hay tiền mặt bàn giao. Khách cần hoàn tiền thì hoàn bằng tiền mặt hoặc chuyển khoản. Ghi nhầm thì quản lý hoặc chủ đầu tư dùng Đảo giao dịch." Khớp `strings-vi.json` và lệch 8 |
| 6 | `od.owner_only` | **Đạt** | Không còn cách để MGR thấy nút rồi bị 403 (ca 2), nên QA giả lập 403 `FORBIDDEN_ACTION` bằng `page.route` trên trình duyệt (OWN, TT-2611-202; không gửi gì lên server). Desk hiện băng "Chỉ chủ đầu tư ghi được khoản này ở đây. Quản lý chỉ ghi được tiền thuê … Nhờ chủ đầu tư ghi." đúng `strings-vi.json`. Phiếu không đổi sau ca này |
| 7 | `stmt.pay_amount` | **Đạt** | Nhãn "Số tiền *" ở form "Ghi đã thu" và form "Khách đã trả ngoài app" |
| 8 | Nhãn VI trong lịch sử thu | **Đạt** | Folio OTM-00412, "Giao dịch thu": "6.509.000 đ · Khách đã trả ngoài app · 10/11/2026 12:00 · QA MGR · Đã đảo", "3.000.000 đ · Khách đã trả ngoài app … QA OWNER". Thống nhất với `payment.method.outside_desk` và báo cáo 196-01 (ghi chú UXD ở L3.4 đã xong) |
| 9 | Q16 smoke trên OTM-00412 | **Đạt** | Nháp 12/2026 `final`, kỳ thuê 01–13/12, tiền thuê 3.689.000 = 10.198.000 − 6.509.000, như L3. Đã hủy nháp |
| 10 | Q7: nhận phòng thường | **Đạt** | OTM-00414 (FD, dài hạn nhập tay, đến hôm nay, căn 101 VC): xem trước nhận phòng đủ 6 điều kiện, `checkIn` → 200 `in_house`, `checkinBackdatedOn` null, `allowedActions` không có `check_in_backdated`, folio 0 dòng. Sau đó MGR hoàn tác nhận phòng và hủy đơn |
| 11 | Q13 đường B9: `checkIn.payment` `outside_desk` | **Chưa kết luận** (CI phủ) | Đơn dài hạn nhập tay không có số phải thu, nên server trả 422 `payment.amountVnd: AMOUNT_EXCEEDS_BALANCE` trước khi xét phương thức. Không ghi gì. Cần đơn ngắn ngày có tiền cọc để thấy `NOT_IN_LIST`; test SEC 12-03 phủ đường này |

### L4.2 Dọn staging

- **6 lượt `in_house` cũ, trả phòng bằng QA OWN:**
  - Trước đó QA kiểm minibar trả phòng (đủ món, không dùng), vì cả 6 bị chặn `minibar_not_checked`.
  - Giờ trả = 12:00 ngày đi của từng đơn (`checkoutAt`), kèm `overdueReason` "QA dọn dữ liệu thử staging". MGR bị 403 `requiredRole: owner` vì có đêm chưa tính tiền; dùng ngày đi thật thì không tính thêm đêm.
  - OTM-00397 (301), OTM-00399 (401), OTM-00403 (101), OTM-00406 (102): số dư 0, trả phòng xong.
  - OTM-00296 (302, còn nợ 2.074.000) và OTM-00359 (201, còn nợ 210.000): ghi công nợ (`debt`, hạn 30/11, lý do "QA dọn dữ liệu thử staging: nợ giả, không thu"). Hai mục này sẽ hiện trong "Cần chú ý" `checkout_debt`. Đây là tiền giả của dữ liệu thử.
  - QA dọn xong 6 căn (`qa.hk` bắt đầu/xong dọn) → 101, 102, 201, 301, 302, 401 đều **VC**.
- **Đơn L4 tạo ra đã hủy:** OTM-00414 (Q7, sau khi hoàn tác nhận phòng), OTM-00415 (ca 1).
- **OTM-00412 trả về như cuối L3:** khoản OWN 3.000.000 bị đảo ở ca 2 đã được OWN ghi lại, TT-2611-202 `paid`. Nháp 12/2026 đã hủy.
- **Liên hệ cơ sở** về `null`/`null`. Thiết bị tin cậy đã thu hồi.
- **Không đụng** OTM-00408, 00409, 00412 (trừ ca 2 đã trả lại), OTM-00385.
- **Còn lại, API không xóa được:** giấy tờ CCCD giả của OTM-00414, 00415 (dùng lại khách giả KH-0486) nằm trong hồ sơ lưu trú của hai đơn đã hủy; 6 lần kiểm minibar trả phòng.
- **Đang ở trên staging sau lượt này:** OTM-00385 (203), OTM-00408 (103), OTM-00409 (402), OTM-00412 (202). 6 căn còn lại trống, sạch cho lượt 30/11–02/12.

### L4.3 Ảnh (scratchpad, không commit)

- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L4-contact-owner.png` – khối "Liên hệ cơ sở", hotline có nhóm, JetBrains Mono.
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L4-print-X.png` – trang in TT-2611-202, chân phiếu có hotline nhóm số. Tên khách giả.
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L4-confirm.png`, `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L4-owner-only.png` – hộp xác nhận và băng "Chỉ chủ đầu tư…" (403 giả lập).
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/L4-ls-form-inhouse-qa.mgr-1440.png` – form "Khách đang ở từ trước".

## L3. Go-live fix v1.0.7 – contract §12 (19/11, 14:00–14:20)

- Bản kiểm: Desk staging sau CI `44324784155` (`main` @ `93f48941` = BE #197 + FE #196), job `deploy staging` xanh (`sha-93f4894167f7`). OpenAPI `0.3.15-draft`.
- Đầu vào:
  - `fb-inv-012/contract.md` §12 (12.11 Q1–Q28, 12.14 lệch BE đã chấp nhận);
  - `reviews/ARC-on-be-pr-197.md`, `reviews/SEC-on-be-pr-197.md`, `reviews/UXD-on-fe-pr-196.md`;
  - `fb-inv-012/go-live-guide.md`.
- Cách chạy như mục 1: API script + Playwright, tài khoản `qa.*`, khách giả `@example.test`. Không in mật khẩu, TOTP, cookie hay link khách.
  - Máy quầy: QA OWN cấp một thiết bị tin cậy "QA STG API 2026-11-19" lúc 14:00 và thu hồi lúc 14:18.
  - Không truy cập production, không SSH, không SQL.
- Hôm nay T = 19/11. Biên ngày đến bù: [05/10, 18/11]. Tháng 10 đã quá hạn ghi trễ (11/11).

### L3.0 Kết luận: **ĐẠT** – 0 P0, 0 P1, 0 P2, 3 P3 mới

- **34 ca:**
  - 21 ca Q trong phạm vi;
  - 6 ca bổ sung ORC giao;
  - 7 ca hoãn (Q9, Q19–Q24).
- **Kết quả: 25 đạt, 0 trượt, 9 chưa chạy.** 9 ca chưa chạy là:
  - 7 ca hoãn;
  - Q7: không có căn sạch để nhận phòng thường (L3.3);
  - Q25: không có quyền DB trên staging. Ca này CI đã phủ.
- **Q16 đạt:** phiếu cuối không thu tháng 11 hai lần. Phiếu 11 ghi "đã thu ngoài Desk" vẫn được trừ trong phiếu cuối, và tổng tiền thuê trên Desk = tiền thuê HĐ (L3.1 Q16). Bản 3 kỳ (phiếu 12 thu thường rồi mới tới phiếu cuối) phải chờ có chỉ số cuối kỳ 11: chạy lại ngày 01/12 với OTM-00412.
- **Lỗi mới, đều P3, không sai tiền:**
  - BUG-R5-014: 409 dời ngày đến liệt kê cả đêm của chính đơn;
  - BUG-R5-015: MGR vẫn thấy nút "Khách đã trả ngoài app" khi server sẽ trả 403;
  - BUG-R5-016: hotline in trên phiếu không có dấu cách.
- **Lỗi đã biết, kiểm lại trên staging:**
  - SEC 197 Minor: `reference` "TK 0123456789" vẫn lọt;
  - ARC 197-03: khóa `long_stay_cleaning_fee_by_room` vẫn sửa được qua API khi chưa có hook. QA lỡ đặt một lịch, đã hủy trước ngày hiệu lực;
  - UXD 196-04: checkbox của trình duyệt vẫn còn.
- **UXD:**
  - 196-07 đạt: nút xác nhận màu Ink, ô số tiền có dấu phân cách hàng nghìn;
  - 196-04 còn nửa: hàng Căn / Ngày vào / Ngày ra đã thẳng, nhưng checkbox vẫn là của trình duyệt.
- **Không có ESC mới.**

### L3.1 Kết quả theo contract 12.11

Đơn thử:
- **X** = OTM-00412, căn 202, MGR tạo với ngày đến 09/11 (T−10), tiền thuê HĐ 8.500.000, đi 14/12;
- **B** = OTM-00409 (lượt 1) dùng cho ca chia phần;
- OTM-00410 (căn 201), OTM-00411 (căn 301), OTM-00413 (căn 101): đã hủy.

| # | Ca | Kết quả | Bằng chứng ngắn |
|---|---|---|---|
| Q1 | MGR tạo đơn dài hạn nhập tay, ngày đến T−10, có lý do | **Đạt** | 201 `confirmed`, `allowedActions` có `check_in_backdated` (`requiresTrustedDevice`). Audit `reservation.created` có `after.backdatedArrival = true` và `reason`. OWN có thông báo `backdated_stay`, chỉ có mã đơn |
| Q2 | FDL, FD gửi `backdatedArrival`; ngày đã qua mà không gửi trường | **Đạt** | FDL, FD → 403 `FORBIDDEN_ACTION` "backdatedArrival needs MGR+ (A127)", mỗi lần có `access.denied`. MGR/FD không gửi trường → 422 `arrivalDate: DATE_IN_PAST` |
| Q3 | Các ngày ngoài biên | **Đạt** | (1) 04/10 → `BACKDATE_OUT_OF_RANGE`, `earliest` 05/10.<br>(2) 20/10 → `PREVIOUS_MONTH_CLOSED`, `earliest` 01/11.<br>(3) Ngày đi 19/11 và 12/11 → `departureDate: DATE_IN_PAST`.<br>(4) Ngày đến = T → `BACKDATE_OUT_OF_RANGE` (lệch 4).<br>(5) Đơn ngắn ngày → `backdatedArrival: NOT_ALLOWED`. Đây là mã của 12.1.1; bảng Q3 ghi `NOT_LONG_STAY`, hai chỗ trong contract lệch nhau, ARC nên sửa một chỗ |
| Q4 | Căn đã có lượt khác trong các đêm đã qua | **Đạt** | Căn 101, 102, 202 → 409 `ROOM_UNAVAILABLE`, có `conflicts` đúng đêm bận. Không ghi gì: số mã đơn không nhảy, đơn tạo được ngay sau đó là OTM-00410 |
| Q5 | MGR nhận phòng bù: (a) cùng ngày đến; (b) dời sớm | **Đạt** | (a) `arrivalDate` 09/11 → 200 `in_house`, `checkinBackdatedOn` 19/11, `actualCheckinAt` = giờ bấm (14:03), buồng VD → OC, folio 0 dòng. Có 2 audit: `reservation.checked_in` (`after.backdated`) và `reservation.checked_in_backdated`.<br>(b) Hoàn tác nhận phòng (B17), rồi `arrivalDate` 08/11 → 200, ngày đến 08/11, đoạn 202 từ 08/11, `leaseEndDate` và tiền thuê không đổi. Audit có `previousArrivalDate` 09/11.<br>Dời về 05/11 (căn bận 06–07/11) → 409 `ROOM_UNAVAILABLE`, nhưng danh sách có cả đêm của chính đơn → **BUG-R5-014** |
| Q6 | FD/FDL gọi; `arrivalDate` = T; gửi trường của `checkIn` | **Đạt** | FD, FDL → 403. T → 422 `USE_CHECK_IN`. `checkinTime`, `payment`, `houseRulesSent` → 422 `<field>: NOT_ALLOWED`. Ngày tháng trước → `PREVIOUS_MONTH_CLOSED`. Căn có lượt khác `in_house` (201, 301) → 409 `unmet: [main_guest_document, room_occupied]`, không có `room_ready` |
| Q7 | Hồi quy `checkIn` thường | **Chưa chạy** (CI xanh) | Mọi căn sạch đều đang giữ một lượt `in_house` cũ quá ngày đi (L3.3), nên `checkIn` thường bị `room_ready` chặn. Đơn hôm nay (OTM-00413): FD/MGR chỉ thấy `check_in`, không thấy `check_in_backdated`. ARC xác nhận `checkIn` không đổi một dòng, test CI xanh |
| Q8 | Chỉ số nhận phòng của đơn nhận phòng bù | **Đạt** | (1) FDL, `readOn` 07/11 (= ngày đến − 1), có lý do, thiếu ảnh kèm ghi chú → 201, `late=true`.<br>(2) FD có ảnh, ngày 07/11 hay 19/11 → 422 `READING_OUT_OF_WINDOW`, `lateNeedsRole: front_desk_lead`, `lateUntil` 30/11 (= 19/11 + 11).<br>(3) FD gửi `photoWaived` → 403.<br>(4) `readOn` 06/11 hay 20/11 → `DATE_INVALID`.<br>(5) Thiếu `lateReason` → 422 |
| Q9 | Đọc bù sau hạn | **Hoãn** | Cần ngày nhập > 30/11 và code 12.5 (chưa lên). Desk không có nút "Đọc bù" (L3.2 E4) |
| Q10 | Phiếu tháng nhận phòng của đơn nhận phòng bù | **Đạt** | Có trong danh sách lập phiếu 11/2026 (`readingStatus: not_needed`). Nháp `regular`, kỳ thuê 08–30/11, 23 × 283.000 = **6.509.000**, không có điện nước, không thiếu chỉ số. Phát hành → TT-2611-202, hạn 08/11 |
| Q11 | MGR ghi "đã thu ngoài Desk" toàn bộ phiếu 11 | **Đạt** | 201, phiếu `paid`. Khoản `outside_desk` 6.509.000: `succeeded`, `not_required`, `shiftId` null, nhận 10/11 12:00. Không có trong hàng đối soát `pending`. Audit `money` `billing_period.settled_outside_desk` có số tiền, ngày, lý do. OWN có thông báo `statement_settled_outside_desk`, không số tiền, không người ghi (lệch 5). Không có ca đang mở nên không xem được màn đóng ca; khoản này không có ca, đúng CHECK |
| Q12 | Các ca lỗi | **Đạt** | (1) FD, FDL → 403.<br>(2) OWN hay MGR gửi 6.510.000 → 422 `AMOUNT_OVER_BALANCE` (`balanceVnd` 6.509.000).<br>(3) Số tiền 0 → 422.<br>(4) Thiếu lý do hay lý do 2 ký tự → `reason: REASON_REQUIRED`.<br>(5) `receivedOn` 20/11 → `DATE_IN_FUTURE` (lệch 7).<br>(6) Phiếu `void` → 409 `INVALID_TRANSITION` |
| Q13 | `method: outside_desk` ở các đường thu khác | **Đạt** (B9 chưa kết luận) | `recordBillingPeriodPayment`, `recordPayment` (folio), `createReservation.initialPayment`, `checkOut.finalPayment` → 422 `NOT_IN_LIST`. Riêng `checkIn.payment` trả 409 `CHECKIN_CONDITIONS_NOT_MET` trước (căn chưa sạch), nên chưa thấy 422. Test SEC 12-03 (duyệt mọi `requestBody`) phủ đường này trong CI |
| Q14 | MGR đảo khoản `outside_desk` | **Đạt** (phần hoàn tiền: CI) | FDL đảo → 403. MGR → 200, khoản `reversed`, phiếu `paid` → `issued`, folio còn nợ 6.509.000. Ca hoàn tiền không dựng được: folio không có dư. Test 197-01 phủ ca này |
| Q15 | Thu một phần ngoài Desk + VietQR phần còn lại | **Đạt** | B (TT-2611-402, còn nợ 3.890.000): OWN ghi ngoài Desk 890.000 → `partially_paid`, QR in `54` = 3.000.000, nội dung `TT2611402`. Đảo xong thì QR về 3.890.000.<br>X: VietQR 3.509.000 → `partially_paid`, QR 3.000.000. OWN ghi ngoài Desk 3.000.000 → `paid`, trang in hết QR, có dấu PAID, không in phương thức hay lý do |
| Q16 | **Phiếu cuối không thu hai lần** | **Đạt** (bản 2 kỳ) | X: HĐ 08/11–13/12 (đi 14/12), tháng 11 đã thu ngoài Desk 6.509.000. Nháp 12/2026 là `final`, kỳ thuê 01–13/12, tiền thuê **3.689.000**. Tính tay: HĐ = 8.500.000 (08/11–07/12) + 6 × 283.000 (08–13/12) = 10.198.000. Phiếu cuối = 10.198.000 − 6.509.000 = 3.689.000. Tổng thuê trên Desk = HĐ. Nếu không trừ phiếu 11 thì phiếu cuối là 10.198.000. Bản 3 kỳ của Q16: chạy lại 01/12 |
| Q17 | Liên hệ cơ sở | **Đạt** | (1) OWN GET 200 `no-store`; MGR, FDL GET 200; FD 403. MGR PUT → 403.<br>(2) OWN gửi địa chỉ 2 dòng, địa chỉ 3 ký tự, ký tự bidi, hotline "abc 123" hay "090", thiếu hotline → 422. Lỗi không lặp lại giá trị đã gửi.<br>(3) OWN lưu → bỏ khoảng trắng đầu/cuối, hotline chuẩn hóa "+84900000222".<br>(4) Audit `config` `property.contact_changed` có trước/sau.<br>(5) API in và trang in TT-2611-202 có địa chỉ mới ở đầu phiếu, "Cần hỗ trợ, vui lòng liên hệ +84900000222" ở chân (xem **BUG-R5-016**).<br>(6) "Trang công khai căn": `getPublicUnitPage` chưa có ở server (404, không có controller), nên không kiểm được – xem L3.4 |
| Q18 | Miễn trừ hotline | **Đạt** | Sau khi đổi hotline từ 0900000111 sang +84900000222, FD từ chối yêu cầu khách (`replyNote`):<br>- hotline cũ → 422 `SENSITIVE_DATA_DETECTED`;<br>- số khác → 422;<br>- "+84 900 000 222" → 200. |
| Q19 | Giá dọn dài hạn khi bảng rỗng | **Hoãn** (thấy khớp) | Trang khách của X (`request-options`): dọn thêm 100.000, `feeReason: long_stay_adhoc` = `adhoc_cleaning_fee` |
| Q20–Q24 | 12.4 / 12.5 | **Hoãn** | Code chưa lên (§12.10 phạm vi tối thiểu) |
| Q25 | `lock_timeout` | **Chưa chạy trên staging** (CI phủ) | QA không có quyền DB staging. `migrate-lock-timeout.test.ts` (2 ca, 1 s) xanh trong CI PR #197 (ARC mục 0) |
| Q26 | Migration 75 | **Đạt gián tiếp** | Mọi thứ của 0100 chạy trên staging: cột `checkin_backdated_on`, CHECK `outside_desk` nhận khoản thu, 2 loại thông báo mới, khóa `long_stay_cleaning_fee_by_room`. Deploy `ok`. **Số đếm 75 và `convalidated` cần OPS xác nhận** (QA không có SQL) |
| Q27 | RBAC 8 vai × A127–A129; `Me.screens` | **Đạt** | `GET /v1/me` của 8 vai khớp từng màn với `SCREENS_BY_ROLE` (`screens.ts` không đổi từ trước gói). hk, mt, sal, ctv: A127 tạo đơn và nhận phòng bù, A128, A129 → 403; `getPropertyContact` → 403. FD: `getPropertyContact` 403. FDL: xem 200, sửa 403. MGR: sửa liên hệ 403. A130 chưa có operation (lệch 9) |
| Q28 | Hồi quy FB-INV-012 | **Đạt** | (1) Luồng X: chỉ số nhận phòng → nháp → phát hành → in A5/A4 (1 trang mỗi khổ) → VietQR → đã thu.<br>(2) Trang in B: QR giải mã khớp payload API. Bảng màu như lượt 2 (chỉ `fill` đen của biểu tượng SVG). Có đủ Lora, Be Vietnam Pro, JetBrains Mono, không emoji.<br>(3) Cuối kỳ 11 ngày 19/11 → 422 `READING_OUT_OF_WINDOW` 30/11–01/12.<br>(4) Phát hành phiếu 12 khi thiếu chỉ số → `METER_READING_MISSING`.<br>4 ca cửa sổ (1.9, 1.14, 2.3, 3.6) vẫn chạy ngày 30/11–01/12 |

### L3.2 Ca bổ sung ORC giao

| # | Ca | Kết quả | Bằng chứng ngắn |
|---|---|---|---|
| E1 | MGR ngoài thiết bị tin cậy | **Đạt** | Chưa có thiết bị: MGR tạo đơn có `backdatedArrival` → 403 `DEVICE_NOT_TRUSTED` + `access.denied` `trusted_device` (SEC 12-07 đã đóng). Thiếu thiết bị ở `check-in-backdated` và `settle-outside-desk` → 403 `DEVICE_NOT_TRUSTED` (thấy ở các vai không có cookie máy quầy, Q27) |
| E2 | MGR chỉ thấy nút trên phiếu tháng nhận phòng của đơn nhận phòng bù | **Đạt** (xem BUG-R5-015) | API: TT-2611-202 (X) MGR có `settle_outside_desk`, FD/FDL không. TT-2611-402 (B, nhận phòng thường): MGR không có, OWN có. MGR gọi vào B → 403 "owner only".<br>Desk: drawer TT-2611-402 với MGR, FDL chỉ có "Ghi đã thu"; với OWN có "Khách đã trả ngoài app".<br>Phạm vi MGR (SEC-BE-197-02): MGR ghi lại sau khi đã đảo một khoản → 403 "owner only", đúng thiết kế. Nhưng phiếu vẫn báo `settle_outside_desk` cho MGR → BUG-R5-015 |
| E3 | Số thẻ trong `reference` | **Đạt** | "4111 1111 1111 1111" → 422 `CARD_NUMBER_DETECTED` (`reference`). Số thẻ trong `reason` → 422. Toàn số 10 chữ số → `reference: NOT_ALLOWED` (lệch 2). "TK 0123456789" vẫn lọt, lưu `note` "… \| ref TK 0123456789". Đây là thẻ SEC 197 Minor đã biết, giữ hạn của SEC |
| E4 | Giao diện 12.4/12.5 không mở được | **Đạt** | Tham số (OWN, MGR, FDL): không có khóa giá dọn theo căn, tab "Dài hạn – phiếu tháng" chỉ có 3 khóa cũ. Chốt công tơ (MGR, OWN): không có nút hay chữ "Đọc bù". API `catchUp: true` không được dùng (409 `READING_EXISTS` trước). **API `setParameter long_stay_cleaning_fee_by_room` (MGR) vẫn nhận `{"202":150000}` = ARC 197-03.** QA lỡ đặt hiệu lực 20/11, đã `cancel-scheduled` lúc 14:16, lịch sử trống, giá trị hiện tại vẫn `{}` |
| E5 | UXD 196-04 (checkbox), 196-07 (nút Ink, dấu nghìn) | 196-07 **đạt**; 196-04 **còn nửa** | 196-07: hộp xác nhận "Ghi 3.890.000 đ là khách đã trả ngoài app?" có nút chính nền Ink #2B2B28, chữ Ivory; "Quay lại" là nút phụ. Ô số tiền điền sẵn "3.890.000". Đạt ở 1440 và 390.<br>196-04: hàng Căn / Ngày vào / Ngày ra đã thẳng; câu "ngày 01" đã lên khối giải thích. Nhưng "Khách đang ở từ trước" vẫn là `input[type=checkbox]` của trình duyệt (ô đen), không phải `Checkbox` của DS |
| E6 | MGR đảo rồi ghi lại (SEC-BE-197-02) | **Đạt** | Sau khi MGR đảo khoản `outside_desk` trên TT-2611-202, MGR ghi lại 3.000.000 → 403 "owner only". OWN ghi được |

### L3.3 Dữ liệu và dọn dẹp

- **Đã hủy:** OTM-00410, OTM-00411, OTM-00413 (lý do `other`).
- **B (OTM-00409):**
  - khoản ngoài Desk 890.000 đã đảo, TT-2611-402 về đúng như trước (còn nợ 3.890.000);
  - nháp 12/2026 tạo nhầm khi kiểm hồi quy đã hủy.
- **X (OTM-00412) – giữ lại có chủ ý, như OTM-00408/00409:**
  - trạng thái: căn 202, đang ở 08/11–14/12;
  - TT-2611-202 `paid`: VietQR 3.509.000 `pending`, ngoài Desk 3.000.000 (OWN), một khoản ngoài Desk đã đảo;
  - nháp 12/2026 đã hủy;
  - dùng để chạy Q16 bản đầy đủ ngày 01/12: có cuối kỳ 11 → phát hành phiếu 12 `final` → so với HĐ;
  - nếu ORC muốn dọn ngay: đảo 2 khoản, hủy TT-2611-202, hoàn tác nhận phòng, hủy đơn.
- **Đã trả lại:**
  - liên hệ cơ sở về `null`/`null` như trước khi kiểm. Lưu ý: production vẫn cần OWN nhập theo `go-live-guide.md`;
  - lịch tham số đặt nhầm đã hủy;
  - link khách của X đã thu hồi;
  - thiết bị tin cậy đã thu hồi.
- **Còn lại, không xóa được qua API:**
  - 1 hồ sơ khách giả `@example.test` (KH-0486);
  - 2 ảnh đồng hồ tải lên nhưng không dùng (`purpose=meter`);
  - 1 yêu cầu khách đã từ chối trên X.
- **Cho ORC:** staging có 6 lượt `in_house` cũ quá ngày đi, giữ các căn 101, 102, 201, 301, 302, 401:
  - OTM-00296, 00359, 00397, 00399: từ trước;
  - OTM-00403, 00406: tạo 16/11, không phải của lượt này.

  Không căn sạch nào nhận phòng thường được, nên Q7 chưa chạy. Nên nhờ vai đã tạo trả phòng các lượt này trước lượt 30/11.

### L3.4 Ghi chú cho vai liên quan (không ghi lỗi)

- **ARC:**
  - Q3 ghi `NOT_LONG_STAY` cho đơn ngắn ngày, nhưng 12.1.1 và code dùng `backdatedArrival: NOT_ALLOWED`. Nên sửa bảng Q3.
  - §12.3 nói đổi hotline "tác động trang công khai căn (`phonePublic`)", nhưng `getPublicUnitPage` chưa có ở server. Nên ghi rõ là chưa áp dụng.
- **ARC/BE – hoàn tác nhận phòng bù:** sau B17, đơn về `confirmed` nhưng `checkinBackdatedOn` vẫn 19/11. Nhận phòng bù lại thì đúng. Cần xác nhận đây là chủ ý: giữ dấu để SEC 12-01 vẫn chặn đổi người chốt.
- **FE – ô "Ngày ra" khi chọn "Khách đang ở từ trước":** `min` = ngày vào, nên chọn được ngày ≤ hôm nay; server trả `DATE_IN_PAST`. Ô "Ngày vào" cho chọn từ 05/10, còn server chỉ nhận từ 01/11 và báo ngày sớm nhất. Cả hai đều có server chặn, nên chỉ nên siết `min` cho dễ dùng.
- **UXD:**
  - Câu xác nhận ghi "và không hoàn được". Theo lệch 8, chỉ hoàn "theo phương thức gốc" bị chặn; hoàn tiền mặt hay chuyển khoản vẫn theo SM-10. UXD xem có cần nói chính xác hơn.
  - Folio ghi "Đã trả ngoài app", báo cáo 196-01 ghi "Khách đã trả ngoài app". Hai chữ nên thống nhất.
- **OPS:** xác nhận số migration staging = 75 và 2 CHECK mới `convalidated` (Q26).

### L3.5 Ảnh (scratchpad, không commit; có tên khách giả rút gọn)

- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/ls-form-inhouse-qa.mgr-1440.png`, `…/shots3/ls-form-inhouse-qa.mgr-390.png` – form có "Khách đang ở từ trước" (196-04).
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/od-confirm-qa.owner-1440.png`, `…/shots3/od-confirm-qa.owner-390.png` – hộp xác nhận (196-07).
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/od-form-qa.owner-1440.png` – form "Khách đã trả ngoài app", số tiền có dấu nghìn.
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/stmt-TT-2611-402-qa.mgr-1440.png` – MGR không có nút trên phiếu nhận phòng thường.
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/contact-qa.owner.png`, `…/shots3/contact-qa.mgr.png` – khối "Liên hệ cơ sở" (OWN sửa, MGR chỉ xem).
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/print-Xnov-screen.png`, `…/shots/print-Xnov-A5.pdf` – trang in TT-2611-202 (địa chỉ, hotline, PAID).
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots3/res-X-folio2-qa.mgr.png` – chip "Nhận phòng bù 19/11", folio "Đã trả ngoài app". Ảnh có tên khách trên staging, không commit.

## L2. Lượt 2 – kiểm lại bản sửa (18/11, 17:40–18:05)

- Bản kiểm: Desk staging sau CI `44278151592` (`main` @ `5e98ec5a` = BE #194 + FE #195), job `deploy staging` xanh.
- Đầu vào: `bug-list.md` (BUG-R5-008…013), `responses/BE-responses.md` (QA staging 18/11), `responses/FE-responses.md` (Lượt 5, 6), `reviews/ARC-on-be-pr-194.md`, `reviews/UXD-on-fe-pr-195.md`.

### L2.0 Kết luận: **ĐẠT** phần bản sửa – đóng cả 6 lỗi, không có lỗi mới

- **Kiểm lại lỗi:** BUG-R5-008, 009 (P2) và 010, 011, 012, 013 (P3) đều **Đạt → Đóng**. Chi tiết và bằng chứng ở mục "Ghi chú test lại" của từng lỗi trong `bug-list.md`.
- **Hồi quy:** 18 ca, **17 đạt, 0 trượt, 1 chưa chạy**. Ca chưa chạy là ghi trễ dương theo ngày nhập (L2.1 R3).
- **Lỗi FB-INV-012 còn mở: 0.** Lỗi Round 5 còn mở ngoài phần này không đổi: BUG-R5-002, BUG-R5-007 (P2).
- **Bốn ca cửa sổ chốt công tơ vẫn "Chưa chạy"** (1.9, 1.14, 2.3, 3.6), không làm giả. Chạy ngày 30/11–01/12 với OTM-00408/00409.
- **Kết luận lượt 1 đổi thành ĐẠT CÓ ĐIỀU KIỆN, còn 3 điều kiện:**
  1. Chạy 4 ca cửa sổ (VAT điện nước trên staging).
  2. Kiểm địa chỉ, hotline cơ sở trên production.
  3. DOM/OWN kiểm giá dọn thêm.

  Điều kiện 1 và 2 của lượt 1 (BUG-R5-009, BUG-R5-008) đã xong.
- Không có ESC mới. Cách chạy như mục 1 (API script + Playwright, `qa.*`, không in bí mật). Lượt này không cần máy quầy (không nhận phòng).

### L2.1 Kết quả

| # | Ca | Kết quả | Bằng chứng ngắn |
|---|---|---|---|
| R1 | BUG-R5-008: ghi lùi ngày đọc | **Đạt** | OTM-00385, nhập 18/11:<br>- FD `readOn` 05/11, 06/11 → 422 `READING_OUT_OF_WINDOW` (không `lateUntil`);<br>- FDL có lý do, `readOn` 05/11, 16/11 → 422 (ngày nhập quá `lateUntil` 16/11);<br>- `readOn` 19/11 → `DATE_INVALID`.<br>Không ghi gì |
| R2 | Hồi quy: nhập trong cửa sổ | **Đạt** | OTM-00408 (đến 18/11), FD nhập hôm nay `readOn` 18/11 → 201, `late=false` (sau khi hủy lần đọc cũ, cùng số 1.250 / 38,6) |
| R3 | Ghi trễ dương theo **ngày nhập**: nhập trong (`windowTo`, `lateUntil`] → FD 422 kèm `lateUntil`, FDL+ có lý do 201 `late` | **Chưa chạy** | Hôm nay không có đơn đang ở nào nằm trong khoảng này (OTM-00408/409 có cửa sổ tới 19/11). Có trong test BE #194. Chạy ở lượt 30/11–01/12 (ví dụ nhập đầu kỳ ngày 02/12) |
| R4 | Desk: câu khi quá cả hạn ghi trễ | **Đạt** | Hộp "Chỉ số nhận phòng · căn 203", ngày điền sẵn 05/11 → "Đã quá hạn ghi trễ cho ngày đọc này (hạn chốt 06/11/2026). Vui lòng báo quản lý để xử lý." (chữ UXD chốt) |
| R5 | BUG-R5-009: tháng mặc định, câu giữa tháng | **Đạt** | Mặc định 11/2026. "Nhập cuối kỳ từ ngày 30/11/2026." một lần trên đầu bảng; mỗi hàng có chip "Chưa tới kỳ chốt"; 203 có nút "Nhập chỉ số nhận phòng" |
| R6 | Hàng thiếu đầu kỳ của căn mở kỳ bằng `period_start` | **Đạt** | Tháng 12/2026:<br>- 103, 402 có một dòng "Chưa có đầu kỳ 12/2026. Nhập ở tháng 11/2026." + nút "Mở tháng 11/2026", bấm thì về 11/2026;<br>- 203 (chưa có chỉ số nhận phòng) nằm ở khối "Chỉ số nhận phòng cần nhập – 11/2026" |
| R7 | Câu trống tháng không có căn | **Đạt** | 10/2026: "Tháng 10/2026 không có căn dài hạn nào cần chốt", vẫn hiện khối chỉ số nhận phòng của tháng hiện tại |
| R8 | BUG-R5-010: `unreconciledVnd` | **Đạt** | TT-2611-103-R1 → 2.900.000; TT-2611-402 → 1.000.000 |
| R9 | BUG-R5-011: xem trước A5 | **Đạt** | Bảng kết thúc ở x = 888 px, khớp lề nội dung (lượt 1: khoảng 928) |
| R10 | In A5/A4 phiếu thật | **Đạt** | TT-2611-402, TT-2611-203-R1: PDF A5 1 trang (420 × 595 pt), A4 1 trang. Brand như lượt 1 (cùng viền `#FBF9F4`, ghi chú 9.8) |
| R11 | Cảnh báo tràn A4 (UXD 195-01) | **Đạt** | Ca giả phía trình duyệt (Playwright chặn phản hồi `print` và chèn 9 dòng nhãn dài, không ghi lên server):<br>- tự sang A4, "Đã chuyển sang A4 để vừa một trang" + "Phiếu dài hơn một trang – kiểm lại trước khi in";<br>- đầu cột một hàng; không cắt chữ (PDF 4 trang, đúng thiết kế "báo, không cắt") |
| R12 | Nhãn dòng dự phòng (UXD 195-02) | **Đạt** | Ca giả: dòng `service` có `labelKey` lạ → in "Service · 12 Nov / Dịch vụ · 12/11". Có `labelParams.description` → in chữ đó. Không có khóa thô `bill.line.*` trên tờ |
| R13 | BUG-R5-012: nhóm và chữ tóm tắt tham số | **Đạt** | Nhóm "Dài hạn – phiếu tháng", 3 dòng đọc thành câu (chữ UXD 195-04, "8%" không cách). Không còn JSON trên màn |
| R14 | Hộp sửa tham số theo ô | **Đạt** | Ô VAT: chọn 0/5/8/10%. Ô quy tắc: có "Từ … đến …". Giá −5 → chặn tại ô, không gửi. Giá 4.200 hiệu lực 01/03/2027 → `PUT` đúng dạng, bảng hiện lịch "từ 01/03". QA đã hủy lịch (204) |
| R15 | BUG-R5-013: kỳ null ở phiếu tháng nhận phòng (API) | **Đạt** | Nháp, phát hành TT-2611-203-R1 và `print`: `utilityPeriod` / `servicePeriod` null. Nháp 12/2026 của OTM-00408 vẫn 01–30/11 |
| R16 | BUG-R5-013: trang in | **Đạt** | TT-2611-203-R1 chỉ có "Kỳ thuê 05 – 30 Nov 2026". TT-2611-402 (phát hành trước bản sửa) giữ kỳ 10/2026 đã lưu: đúng "phiếu đã phát hành không đổi" |
| R17 | Hồi quy QR | **Đạt** | TT-2611-402: ảnh QR giải mã = payload server; số tiền 3.890.000, nội dung TT2611402 |
| R18 | Hồi quy quá hạn | **Đạt** | TT-2611-203-R1 `escalate`. "Hôm nay": "Phiếu tháng quá hạn: 1 · 8.242.000 đ" |

### L2.2 Dữ liệu và dọn dẹp

- QA đã hủy những gì ghi thêm lên staging trong lượt này:
  - TT-2611-203-R1 (FDL, có lý do): folio OTM-00385 về 0;
  - nháp 12/2026 của OTM-00408;
  - lịch giá 01/03/2027.
- OTM-00408 có lần đọc nhận phòng mới (cùng số), lần cũ đã hủy.
- Thử nhập trên Desk cho căn 203 bị 422, chỉ để lại một ảnh đồng hồ chưa gắn lần đọc. J16 tự xóa sau `attachment_unbound_days`.
- Ghi chú vận hành cho DOM/ARC: OTM-00385 không còn cách ghi chỉ số nhận phòng (quá `lateUntil`, cả MGR/OWN cũng 422). Đơn này là dữ liệu drill. Ngoài thực tế, một căn bị lỡ quá 10 ngày thì chỉ còn chờ đầu kỳ tháng sau. Đây là đúng hợp đồng 11.2, nhưng chưa có đường cho quản lý xử lý như câu Desk gợi ý.

### L2.3 Ảnh (scratchpad, không commit; có tên rút gọn khách giả)

- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots2/meters-default.png`
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots2/meters-dec.png`
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots2/checkin-pastlate-dialog.png`
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots2/402-screen.png`
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots2/203R1-screen.png`, `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots2/203R1-default.pdf`
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots2/402-fake-unknown-screen.png`, `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots2/402-fake-long-screen.png`
- `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots2/params-statement.png`, `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots2/params-vat-dialog.png`, `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots2/params-rules-dialog.png`

---

# Lượt 1 (18/11, 14:45–15:05)

- Tác giả: QA | Round 5 – bước **Kiểm thử** | 18/11/2026, 14:45–15:05 giờ VN.
- Bản kiểm: Desk staging sau CI `44256601452` (`main` @ `f871ab1e` = BE #190 + FE #189), job `deploy staging` xanh. API billing trả 200 trên staging, nên bản mới đã lên.
- Đầu vào: `04-investor-feedback/FB-INV-012.md`, `rounds/round-05/fb-inv-012/DOM-rules.md` (BR-LS-01…16), `rounds/round-05/fb-inv-012/contract.md` (mục 11, 18/11), decision-log 17–18/11, `responses/BE-responses.md` (#190), `responses/FE-responses.md` (#189).

## 0. Kết luận: **ĐẠT CÓ ĐIỀU KIỆN** – 0 P0, 0 P1, 2 P2, 4 P3

- **Kết quả:** 43 ca: **33 đạt, 6 trượt, 4 chưa chạy**.
- **Phần tiền đúng ở mọi chỗ kiểm được.** Tiền thuê kỳ lẻ, làm tròn, folio, QR và trạng thái phiếu đều khớp tính tay. Trang in A5/A4 đều một trang, đúng brand. Ảnh QR giải mã ra đúng payload server.
- **Lỗi mới:**
  - BUG-R5-008 (P2): lễ tân ghi lùi ngày đọc để lách luật ghi trễ.
  - BUG-R5-009 (P2): giữa tháng, màn Chốt công tơ báo "Không có căn dài hạn" và ẩn nút nhập chỉ số nhận phòng.
  - BUG-R5-010…013 (P3): xem `bug-list.md`.
- **Điều kiện trước production:**
  1. Sửa BUG-R5-009, hoặc ghi rõ cách làm trong sổ vận hành: lễ tân chọn tháng hiện tại ở "Tháng chốt".
  2. ARC chốt BUG-R5-008 (cửa sổ tính theo ngày nhập hay ngày đọc).
  3. Chạy lại phần cần đồng hồ (mục 7): bằng `-test` image trên staging, hoặc ngày 30/11–01/12 trên staging thật với 2 đơn thử đã để lại.
  4. Kiểm `property.addressLine` / `hotline` trên production. Staging đang null, nên chân phiếu không có địa chỉ, hotline.
- **Không có ESC mới.**

## 1. Cách chạy

- **API:** gọi Desk staging bằng script Node của QA ở scratchpad, không đưa vào repo. Đăng nhập `qa.*` như lượt 16/11 (`v1.0.5-fb010-staging.md` L2.1). Không in mật khẩu, mã 2FA, cookie hay `csrfToken` ra đâu cả.
- **Máy quầy tin cậy:**
  - Thiết bị cũ hết hiệu lực phía client vì đã xóa cookie, nên `qa.owner` cấp máy mới `QA STG API 2026-11-18` để nhận phòng. Lúc này giấy tờ trả 403 `DEVICE_NOT_TRUSTED`, đúng thiết kế.
  - Xong lượt, `qa.owner` đã **thu hồi** máy này (200, có xác nhận lại mức S2).
- **Desk UI:** Playwright headless, 1440 px và 390 px, dùng lại phiên API.
- **Dữ liệu thử (giả):**
  - 2 khách "Khach Thu QA …", email `qa-r5-fb012-…@example.test`, CCCD ngẫu nhiên đầu 079.
  - **OTM-00408**: căn 103 The Bloom, 18/11/2026–18/02/2027, thuê 9.000.000.
  - **OTM-00409**: căn 402 The Ember, cùng ngày, thuê 11.300.000 để ra số lẻ.
  - Ảnh đồng hồ là ảnh tổng hợp (chỉ mặt số), không có người hay giấy tờ.
- **Đơn của OPS drill OTM-00385** (căn 203, đến 05/11, dữ liệu fixtures giả) dùng cho ca ngoài cửa sổ/ghi trễ và ca quá hạn. Mọi thứ QA ghi lên đơn này đã hủy lại:
  - lần đọc ghi trễ, lần đọc lùi ngày;
  - phiếu TT-2611-203 (folio đảo về 0).
- **Giới hạn:** staging chạy `CLOCK_MODE=system`, không có endpoint kiểm thử. Hôm nay 18/11, nên **không ghi được chỉ số cuối kỳ / đầu kỳ tháng** (cửa sổ 30/11–01/12). Không có cuối kỳ thì không có dòng điện, nước, nên phần VAT điện nước chưa chạy trên staging (mục 7).
- **Bằng chứng thay thế cho phần cần đồng hồ:** CI `44256601452` trên chính `f871ab1e`.
  - `[desk-clock] e2e/ui-clock/fb012-monthly-statement.r5.spec.ts` **đạt** (S12 nhận phòng + cuối kỳ/đầu kỳ → S16 nháp → cảnh báo → phát hành → in A5/A4 → VietQR → Đã thu).
  - Vitest FE `fb012-*` 31 ca đạt, BE vitest Postgres thật đạt.
- **Không SSH, không SQL, không chạm production.** Không commit.

## 2. Chỉ số đồng hồ (yêu cầu 1)

| # | Ca | Kết quả | Bằng chứng |
|---|---|---|---|
| 1.1 | Chỉ số nhận phòng trong cửa sổ, FD, có ảnh | **Đạt** | OTM-00408 căn 103, ngày đọc 18/11: điện 1.250, nước gõ 38,67 → lưu **38,6** (bỏ lẻ, BR-LS-11). 201, `readByInitials` "QF", `late=false`. Danh sách lần đọc `no-store` |
| 1.2 | Thiếu ảnh; FD bỏ ảnh | **Đạt** | Thiếu ảnh → 422 `photoAttachmentId REQUIRED`. FD `photoWaived` → 403 `FORBIDDEN_ACTION` (cần FDL+) |
| 1.3 | Ngày đọc sau hôm nay, trước ngày đến | **Đạt** | 19/11 và 17/11 → 422 `readOn DATE_INVALID` |
| 1.4 | Lần đọc nhận phòng thứ hai | **Đạt** | 409 `READING_EXISTS` |
| 1.5 | **Ngoài cửa sổ – FD bị chặn** | **Đạt** | OTM-00385 (đến 05/11, cửa sổ 05–06/11), ngày đọc 16/11, FD → 422 `READING_OUT_OF_WINDOW`, `windowFrom` 05/11, `windowTo` 06/11, `lateUntil` 16/11, `lateNeedsRole front_desk_lead`. FDL không lý do → cùng 422 |
| 1.6 | Quá cả hạn ghi trễ | **Đạt** | Ngày đọc 18/11: FD và FDL **có lý do** đều 422 `READING_OUT_OF_WINDOW`, không có `lateUntil` |
| 1.7 | **FDL ghi trễ có lý do** | **Đạt** | Ngày đọc 16/11, `lateReason` → 201, `late=true`, lý do lưu đúng. Lần đọc thứ hai của đơn → 409. QA đã hủy lần đọc này (FDL, có lý do) → 200 |
| 1.8 | Ghi **lùi ngày** để lách luật ghi trễ | **Trượt → BUG-R5-008 (P2)** | Hủy xong, FD nhập ngày 18/11 nhưng chọn ngày đọc **05/11** (trong cửa sổ cũ) → **201, `late=false`**, không lý do, không cần FDL. Hộp nhập trên Desk cho sửa ngày nhận phòng |
| 1.9 | Chốt cuối tháng: Closing M (`period_end`) + Opening M+1 (`period_start`) | **Chưa chạy** (cần đồng hồ) | Kiểm được phần chặn: `period_end` 11/2026 ngày đọc 18/11 → 422, `windowFrom` 30/11, `windowTo` 01/12. `period_start` tháng nhận phòng → 422 (xem ghi chú 9.6). Luồng lưu: E2E desk-clock CI đạt |
| 1.10 | **Đầu kỳ thấp hơn cuối kỳ trước → cảnh báo hai bước** | **Đạt** | Cách dựng mục 8. OTM-00409 nhận căn 402, gõ điện 5.315 < cuối kỳ trước 5.322:<br>- server 422 `OPENING_BELOW_PREVIOUS_CLOSING` → Desk hiện hộp "Điện: đầu kỳ thấp hơn cuối kỳ trước" với 3 lựa chọn. Với FD, "Thay đồng hồ" tắt, kèm câu nhờ lễ tân trưởng;<br>- "Vẫn lưu – số này đúng" → gửi lại với khóa mới, 201. `gap` điện −7, nước +0,5;<br>- "Lịch sử" ghi "Thấp hơn cuối kỳ trước 7 – phiếu sẽ hỏi kiểm lại" và "Hao hụt khi trống: 0,5 (không tính khách)" |
| 1.11 | **Cuối kỳ < đầu kỳ → chặn** | **Đạt** | Lần đọc đóng (`checkout`) căn 402 của OTM-00408, đầu kỳ 5.310 / 120,4:<br>- điện 5.300 (FD) → 422 `METER_LOWER_THAN_PREVIOUS` (`meter`, `previousValue`, `previousKind checkin`);<br>- nước 120,0 (FDL, không ngoại lệ) → cùng 422;<br>- FD gửi ngoại lệ thay đồng hồ → 403;<br>- số đúng 5.322 / 121,07 → 201, `consumption` 12 kWh / 0,6 m³ (nước bỏ lẻ) |
| 1.12 | **Hao hụt không vào phiếu** | **Đạt** (phần kiểm được) | Hao hụt chỉ nằm trên lần đọc đầu kỳ (`gap`); tiêu thụ tính tiền = cuối − đầu của cùng kỳ (1.11). Nháp phiếu 12/2026 của OTM-00409 không có dòng nào từ hao hụt; trang in không có chữ hao hụt/gap (4.3). Dòng điện có hao hụt âm: chưa thấy được vì thiếu cuối kỳ |
| 1.13 | Lễ tân tìm chỗ nhập chỉ số nhận phòng giữa tháng (S12) | **Trượt → BUG-R5-009 (P2)** | Ngày 18/11 mở "Chốt công tơ": "Tháng chốt" mặc định **10/2026** → "Không có căn dài hạn nào đang ở", không có nút "Nhập chỉ số nhận phòng". Chỉ khi tự đổi sang 11/2026 mới thấy 3 căn |
| 1.14 | Cảnh báo trên nháp `OPENING_BELOW_PREVIOUS_CLOSING`, `READING_LATE` | **Chưa chạy** | Server chỉ dựng cảnh báo khi kỳ có cuối kỳ. Nháp 12/2026 của OTM-00409 có `missingReadings`, chưa có cảnh báo, đúng code. Cần đồng hồ |

## 3. Số tiền trên phiếu (yêu cầu 2) – tính tay

| # | Ca | Kết quả | Tính tay = số trên phiếu |
|---|---|---|---|
| 2.1 | **Kỳ lẻ tháng đầu** (thu lúc nhận phòng = phiếu tháng nhận phòng, ÷30) | **Đạt** | Số ngày tính từ ngày đến tới hết tháng, gồm hai đầu:<br>- OTM-00408: 9.000.000 ÷ 30 = 300.000 × 13 ngày (18–30/11) = **3.900.000**;<br>- OTM-00409: 11.300.000 ÷ 30 = 376.667 → làm tròn **377.000** × 13 = **4.901.000**;<br>- OTM-00385: 9.500.000 ÷ 30 = 316.667 → 317.000 × 26 (05–30/11) = **8.242.000**.<br>Dòng `rent` đơn vị `day`, VAT "incl." |
| 2.2 | Tháng kế tiếp: tiền thuê trọn tháng trả trước | **Đạt** (nháp) | Phiếu 12/2026: kỳ thuê 01–31/12 = 9.000.000 / 11.300.000; kỳ điện nước, dịch vụ 01–30/11 |
| 2.3 | **Điện 4.000 + VAT 8 %, nước 25.000 + VAT 5 %** | **Chưa chạy trên staging** (cần chỉ số cuối kỳ) | Tham số staging đúng: `utility_unit_price` {điện 4.000, nước 25.000}, `utility_vat_rate` {điện 8, nước 5}.<br>Tính tay ví dụ DOM:<br>- 142 kWh × 4.000 = 568.000, VAT 45.440;<br>- 3,4 m³ × 25.000 = 85.000, VAT 4.250;<br>- Cộng 9.453.000, VAT 49.690, làm tròn −690, tổng 9.502.000.<br>Ca này có trong unit test BE và vitest FE (CI xanh). Trên staging: chạy lại ngày 30/11–01/12 |
| 2.4 | **Dịch vụ phòng trong kỳ** | **Đạt** | Dọn thêm ghi 18/11 trên OTM-00408:<br>- **không** vào phiếu 11/2026 (kỳ dịch vụ là 10/2026). Tổng phiếu 11 vẫn 3.900.000;<br>- **có** trong nháp 12/2026 (`service` 1 × 100.000, ngày 18/11), tổng 9.100.000.<br>"Dời sang phiếu sau" → dòng vào `excludedLines`, tổng về 9.000.000. Id dòng không thuộc folio → 422 `excludedFolioLineIds[0] NOT_IN_LIST`. Ghi chú 9.1 về giá 100.000 |
| 2.5 | **Không có phí dịch vụ 200.000** | **Đạt** | 6 nháp/phiếu (11 và 12/2026) không có dòng `service_fee` hay khoản 200.000 tự thêm |
| 2.6 | **Làm tròn** | **Đạt** | OTM-00409, FDL "Điều chỉnh kỳ trước" −10.500:<br>- Cộng 4.890.500, Làm tròn **−500**, Tổng **4.890.000** (xuống 1.000, có lợi cho khách, BR-LS-09);<br>- folio ghi `monthly_rent` 4.901.000, `statement_prior_adjustment` −10.500, `statement_rounding` −500; tổng folio 4.890.000 = tổng phiếu |
| 2.7 | **Hạn ngày 05** | **Đạt** | Phiếu 12/2026: hạn 05/12. Phiếu tháng nhận phòng: hạn = ngày đến (18/11; OTM-00385: 05/11), không trước ngày đến |
| 2.8 | Phát hành khi thiếu chỉ số | **Đạt** | Phiếu 12/2026 → 422 `METER_READING_MISSING`, `missingReadings` = căn, `period_end`, 2026-11 |
| 2.9 | Tháng không hợp lệ; trùng phiếu | **Đạt** | Tháng 10/2026 (trước tháng đến) → 422 `month NOT_ALLOWED`. Tạo lại 11/2026 → 409 `STATEMENT_EXISTS` kèm `billingPeriodId` |

## 4. Phát hành, hủy, ghi thu, quá hạn (yêu cầu 3)

| # | Ca | Kết quả | Bằng chứng |
|---|---|---|---|
| 3.1 | **Phát hành** | **Đạt** | FD phát hành → **TT-2611-402**, `issued`, `availableActions` = `record_payment`, `print`.<br>- Gửi lại cùng `Idempotency-Key` → cùng mã, folio không ghi hai lần.<br>- `If-Match` cũ → 412 `VERSION_CONFLICT`.<br>- `If-Match` sai dạng → 422 |
| 3.2 | **Hủy & lập lại** | **Đạt** | TT-2611-103:<br>- FD hủy phiếu đã phát hành → 403;<br>- FDL, lý do 1 ký tự → 422 `REASON_REQUIRED`;<br>- FDL có lý do → `void`, `canReplace=true`. Folio đảo: tiền phòng về 0, chỉ còn dòng dọn 100.000;<br>- lập lại → **TT-2611-103-R1**, `replacesCode` TT-2611-103, phát hành 3.900.000.<br>Nháp hủy được bằng FD (200) |
| 3.3 | **Ghi thu tiền mặt và VietQR** | **Đạt** | TT-2611-103-R1:<br>- tiền mặt 1.000.000 → `partially_paid`, `reconciliation not_required`;<br>- VietQR 3.000.000 → 422 `AMOUNT_OVER_BALANCE` (`balanceVnd` 2.900.000);<br>- hủy phiếu đã thu → 409 `STATEMENT_HAS_PAYMENTS`;<br>- VietQR 2.900.000 → `paid`, có `paidAt`, `reconciliation pending`, chỉ còn `print`.<br>TT-2611-402: VietQR 1.000.000 → `partially_paid`, còn 3.890.000 |
| 3.4 | Số tiền VietQR chờ đối soát trên phiếu (`totals.unreconciledVnd`) | **Trượt → BUG-R5-010 (P3)** | Có 2.900.000 / 1.000.000 VietQR `pending`, nhưng `getBillingPeriod`, phản hồi ghi thu và danh sách đều **không có** `unreconciledVnd`. `disputed` có |
| 3.5 | **Quá hạn ở "Cần chú ý"** | **Đạt** | TT-2611-203 (OTM-00385, hạn 05/11): `overdueDays` 13, `alertLevel escalate`, có trong `listBillingPeriods?overdue=true`.<br>Desk "Hôm nay" hiện "**Phiếu tháng quá hạn: 1 · 8.242.000 đ**" và "**1 phiếu tháng đến hạn hôm nay**" (TT-2611-402). S16 tab Quá hạn: "Quá hạn 13 ngày". Ghi chú 9.4.<br>QA đã hủy TT-2611-203 sau ca này |
| 3.6 | Mốc ngày 05 / 06 / 08 / 15 chuyển mức nhắc | **Chưa chạy** (cần đồng hồ) | Chỉ thấy được hai mức `due_today` và `escalate` |

## 5. Trang in (yêu cầu 4)

Phiếu kiểm: TT-2611-402 (còn nợ, có QR, có điều chỉnh + làm tròn) và TT-2611-103-R1 (đã thu đủ). PDF do Chromium in với `preferCSSPageSize`.

| # | Ca | Kết quả | Bằng chứng |
|---|---|---|---|
| 4.1 | **A5 và A4, mỗi khổ 1 trang** | **Đạt** | Mặc định A5: PDF 1 trang, MediaBox 420 × 595 pt. Bấm A4: 1 trang, 595 × 842 pt. Cả 2 phiếu |
| 4.2 | **Brand OTTIMO** | **Đạt** | - Chữ: Lora (tên cơ sở, "Monthly statement", tên phòng, dấu "Paid"); Be Vietnam Pro (nội dung); JetBrains Mono (mã phiếu, nội dung chuyển khoản). Không font khác.<br>- Màu: quét màu tính toán trong `.print-root`, chỉ có màu trong bảng 80/15/5 và trắng. Lệch duy nhất: 1 viền `#FBF9F4` (sắc Ivory nhạt), ghi chú 9.8.<br>- Song ngữ EN dẫn, VI dưới; không emoji; dấu "Paid · Đã thanh toán" màu Earth Brown |
| 4.3 | **Không dòng hao hụt; có tên phòng** | **Đạt** | Không có chữ hao hụt/gap/wastage. Ô Phòng: "**The Ember · 402**", "**The Bloom · 103**" (tên Lora, số Mono) |
| 4.4 | **QR đúng số tiền và nội dung** | **Đạt** | Giải mã ảnh QR trên trang bằng `BarcodeDetector` → **trùng từng ký tự** payload `getBillingPeriodPrint`.<br>- Payload: tag 54 = **4.890.000** (= còn nợ); sau khi thu 1.000.000 → **3.890.000**. Tag 62/08 = **TT2611402** (mã phiếu, không tên khách). Tag 53 = 704, 58 = VN, 38 GUID `A000000727`.<br>- Phiếu đã thu đủ: `vietqr null`, không QR, in dấu Đã thanh toán |
| 4.5 | Dữ liệu cá nhân trên giấy | **Đạt** | `BillingPeriodPrint` chỉ có `guest.fullName`; không SĐT, email, quốc tịch, giấy tờ, ghi chú, lý do. Tài khoản `••••6789`. Người in "QF" (chữ đầu). URL chỉ có `id`. `no-store` |
| 4.6 | Xem trước A5 trên màn hình | **Trượt → BUG-R5-011 (P3)** | Ở 1280 px, bảng dòng (cột Thành tiền) lấn ra ngoài lề nội dung tờ khoảng 40 px. Bản in PDF không bị |
| 4.7 | Kỳ in trên phiếu tháng nhận phòng | **Trượt → BUG-R5-013 (P3)** | Phiếu của khách đến 18/11 in "Utilities & services · 01 – 31 Oct 2026", là tháng khách chưa ở |

## 6. Quyền (yêu cầu 5)

| # | Ca | Kết quả | Bằng chứng |
|---|---|---|---|
| 5.1 | FD | **Đạt** | Được: nhập chỉ số, tạo nháp, phát hành, ghi thu, in, hủy nháp.<br>403: điều chỉnh kỳ trước, hủy phiếu đã phát hành, ngoại lệ đồng hồ, bỏ ảnh, sửa tham số.<br>`availableActions` nháp của FD: `update, issue, void` (không có `prior_adjustment`) |
| 5.2 | FDL | **Đạt** | Ghi trễ có lý do; hủy phiếu đã phát hành; điều chỉnh kỳ trước. Sửa tham số → 403 |
| 5.3 | MGR | **Đạt** | Đọc 5 API 200. Điều chỉnh +20.000 rồi bỏ → 200 (11.320.000 → 11.300.000). `availableActions` có `prior_adjustment`. Sửa tham số → 403 |
| 5.4 | **HK, MT** (và SAL, CTV) | **Đạt** | 11 thao tác (3 chỉ số, 8 phiếu) × 4 vai → đều **403 `FORBIDDEN_ACTION`** |
| 5.5 | **OWN đổi đơn giá và % VAT** | **Đạt** | OWN đặt hiệu lực 01/03/2027:<br>- `utility_vat_rate` điện 10 → 200; `utility_unit_price` điện 4.200 → 200;<br>- MGR đọc thấy lịch, giá hiện hành không đổi;<br>- hủy lịch → 204, lịch sử về rỗng.<br>Ngoài biên → 422 `PARAM_OUT_OF_RANGE`: VAT 150 %, giá âm, `dueDay` 31, `lateMaxDays` 40. MGR, FDL, FD → 403 |
| 5.6 | OWN sửa trên Desk (S24) | **Trượt → BUG-R5-012 (P3)** | 3 khóa có trên màn Tham số, nhưng giá trị hiện dạng JSON thô (`{"waterVndPerM3":25000,…}`) và nằm trong nhóm "FOC, hoa hồng, phí kênh" |

## 7. Ảnh cho UXD (yêu cầu 6) và bằng chứng

| # | Ca | Kết quả |
|---|---|---|
| 6.1 | Chụp hộp "đầu kỳ thấp hơn" | **Đạt** |

Ảnh ở scratchpad, **không commit** (ảnh toàn trang có tên rút gọn của khách giả):

- **Hộp thoại "Điện: đầu kỳ thấp hơn cuối kỳ trước"**
  - Chỉ hộp, không có dữ liệu khách – UXD dùng được:
    - `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/below-dialog-only-390.png`
    - `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/below-dialog-only-1440.png` – ảnh này chụp nhầm hộp nhập phía sau; dùng ảnh 390 hoặc ảnh toàn trang.
  - Toàn trang:
    - `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/below-dialog-1440.png`
    - `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/below-dialog-390.png`
- Sau "Vẫn lưu", và Lịch sử:
  - `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/below-saved-390.png`
  - `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/history-402.png`
- **BUG-R5-009:** `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/meters-0.png` (mặc định 10/2026) và `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/meters-nov.png`
- **Trang in:**
  - TT-2611-402 A5: `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/print-Bnov-A5.pdf` (ảnh `print-Bnov-A5.pdf.png` cùng thư mục);
  - TT-2611-402 A4: `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/print-Bnov-A4.pdf`;
  - TT-2611-103-R1 A5: `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/print-Anov2-A5.pdf`;
  - xem trước màn hình (BUG-R5-011): `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/print-Bnov-screen.png`.
- **Hôm nay / S16:** `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/today.png`, `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/stg012/shots/s16-overdue.png`.

## 8. Cách dựng ca "đầu kỳ thấp hơn" và "cuối < đầu" khi chưa tới cửa sổ cuối tháng

- Cuối kỳ trước của một căn lấy từ mọi lần đọc đóng (`period_end`, `room_change_out`, `checkout`) của **mọi đơn** ở căn đó.
- QA dựng như sau:
  1. OTM-00408 đổi sang căn 402 trong ngày.
  2. Nhập chỉ số nhận phòng ở 402 (5.310 / 120,4).
  3. Nhập lần đọc đóng `checkout` (5.322 / 121,0). Đây là ca 1.11.
  4. Đổi OTM-00408 về lại 103.
  5. OTM-00409 nhận 402 và nhập 5.315 (ca 1.10).
- Phụ phẩm: đổi căn **ngay ngày đến** thì đoạn ở căn cũ bị bỏ khỏi đơn. Lần đọc nhận phòng ở căn cũ còn hiệu lực nhưng không còn dùng được (ghi chú 9.5).

## 9. Ghi chú (không ghi lỗi, cho vai liên quan)

1. **Giá dọn thêm (DOM/OWN):** danh mục `adhoc_cleaning_fee` trên staging ghi **100.000**/lần. BR-LS-07 ghi Studio City/Garden 150.000, Premium/Signature 200.000. Đây là dữ liệu danh mục, không phải mã. OWN/DOM kiểm giá trên production trước phiếu đầu tiên.
2. **Chân phiếu (OPS/OWN):** `property.addressLine`, `hotline` trên staging là null, `email` null theo hợp đồng (chưa có cột). Phiếu in chỉ có câu VAT và dòng "Printed". Cần kiểm dữ liệu cơ sở trên production.
3. **Phiếu lập lại (DOM/UXD):** TT-2611-103-R1 in ra không ghi "thay phiếu TT-2611-103" (BR-LS-16), vì `replacesCode` không có trong allowlist in. Đề xuất in một dòng nhỏ "Replaces / Thay phiếu …" để khách khỏi nhầm khi đã cầm tờ cũ.
4. **Tab "Quá hạn" ở S16 (UXD/FE):** gồm cả phiếu "Đến hạn hôm nay" (danh sách `overdue=true` lấy `due_date <= hôm nay`). Cho "Cần chú ý" thì đúng, nhưng tên tab làm lễ tân hiểu phiếu đến hạn hôm nay đã trễ.
5. **Đổi căn ngay ngày nhận phòng:** lần đọc nhận phòng căn cũ bị treo (căn cũ không còn trong đơn, không ghi được `room_change_out`). Desk đòi lại chỉ số nhận phòng cho căn mới. Phần tiêu thụ ở căn cũ trong vài giờ đó mất. Hiếm, ARC/DOM xem có cần chặn hay không.
6. **Thứ tự kiểm `period_start` tháng nhận phòng:** server trả `READING_OUT_OF_WINDOW` (hoặc `DATE_INVALID`) trước khi tới `periodMonth NOT_ALLOWED` như hợp đồng 11.1. Kết quả vẫn là chặn; chỉ ghi để ARC biết.
7. **FD gửi ngoại lệ `rollover` thiếu `maxValue`:** nhận 422 kiểm dạng trước 403. Không lộ gì, chỉ ghi lại.
8. **Viền `#FBF9F4`** trên trang in (một phần tử, sắc Ivory nhạt): UXD xem có chấp nhận như sắc của Ivory hay đổi về Ivory.
9. **Dữ liệu QA để lại trên staging:**
   - OTM-00408 (103) và OTM-00409 (402) đang ở, tới 18/02/2027.
   - TT-2611-103-R1 đã thu đủ. TT-2611-402 còn 3.890.000.
   - Để nguyên cho lượt chạy lại 30/11–01/12 (chốt 11/2026, phiếu 12/2026 có điện nước). Xong lượt đó thì trả phòng hai đơn.

## 10. Việc còn lại

- **QA:** chạy lại 1.9, 1.14, 2.3, 3.6 ngày 30/11–01/12 trên staging (với OTM-00408/00409), hoặc sớm hơn nếu OPS bật `-test` image trên staging. Kiểm lại BUG-R5-008…013: xong ở L2.
- **OPS (BE-190-07):** chạy 0099 trên bản sao dữ liệu staging. QA không làm (không SSH/SQL).
