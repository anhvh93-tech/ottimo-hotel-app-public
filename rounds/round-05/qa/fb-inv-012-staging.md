# QA – Kiểm trên staging: FB-INV-012 phiếu thanh toán tháng khách dài hạn

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
