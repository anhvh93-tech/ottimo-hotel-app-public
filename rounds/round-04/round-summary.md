# Tổng kết Round 4 – Đưa OTTIMO vào vận hành thật

- Người soạn: ORC, cùng PO | Ngày: 06/11/2026
- Nguồn:
  - số liệu PO: `outputs/PO/round-4-metrics.md`;
  - việc chờ anh/chị: `outputs/PO/esc-pending-06-11.md`;
  - kế hoạch tiếp theo: `../round-05/plan.md`;
  - QA, SEC, OPS: `qa/lp-v2-staging-s6.md`, `reviews/SEC-on-lp-v2-s6d.md`, `reviews/SEC-on-bug-r4-054.md`, `outputs/OPS/ops-readiness-06-11.md`;
  - cổng QC: `qc/round-4-closeout-gate.md`.

---

## 1. Kết quả chính

- **Năm bản đã lên production trong 4 ngày (03–06/11).** Cả năm bản đều qua cổng QC và đều được anh/chị cho phép từng lần.
  - **v1.0.1:** báo yêu cầu đặt phòng từ website vào Google Chat.
  - **v1.0.2:** trả phòng sớm có tính phí; giá hẹn theo ngày cho từng căn.
  - **v1.0.3:** email nhận thông báo bảo mật.
  - **v1.0.4:** giữ chỗ quá hạn; đăng nhập 2 bước trên app nhân viên; sửa 4 lỗi tiền ở quầy (minibar, đơn Nội bộ, đơn OTA, trả phòng sau nửa đêm); mở lại check-in online.
  - **Web ottimo.vn mới (LP-v2):** 5 ngôn ngữ (Anh, Việt, Hàn, Trung, Nga), form gửi yêu cầu, thông báo quyền riêng tư bản 2026-11-04. Giá ước tính bật từ 06/11.
- **Giá trên web khớp Desk.**
  - Trên bản thử: 13/13 ca lệch 0 đồng.
  - Trên production: 4/4 ca mẫu khớp.
  - Chủ đầu tư đổi giá trên Desk thì web theo ngay (đo trên bản thử: khoảng 2,5 giây).
  - Web không để lộ căn nào đã bán hay đang giữ.
  - Muốn tắt giá web gấp: đặt `public_show_prices` = false trên Desk. Form vẫn chạy.
- **Bảo mật web:** 12 ca kiểm bắt buộc của SEC không ca nào đỏ. Ca 10 (căn thiếu giá) SEC chấp nhận cách kiểm thay. Ca 4 có một phần dời sang v1.0.5: Desk hiện cả số "từ – đến".
  - Production hiện không có căn nào thiếu giá mà web chạm tới (kiểm chỉ đọc lúc 06/11 tối).
- **Tài liệu để anh/chị vận hành:**
  - **Sổ vận hành** `product/docs/so-van-hanh.md`: việc hằng ngày, tuần, tháng, năm; khi có sự cố làm gì; cách báo lỗi bằng `/feedback`; lịch review.
  - **Từ điển tham số** `product/docs/tham-so-quy-tac.md`: 198 khóa, nghĩa và cách chỉnh.
  - **Sổ tay người dùng:** phần web và giá đã sửa khớp thực tế 06/11. Còn câu cũ "check-in online tạm dừng" ở sổ tay và bộ hướng dẫn; BA sửa trước 10/11 (mục 2, điều kiện 5).
- **Máy chủ:**
  - Kiểm sức khỏe 16/16 đạt.
  - Chứng chỉ còn từ 74 ngày trở lên, tự gia hạn. Đĩa dùng 18 %.
  - Bản sao lưu ngoài máy chủ (trên Mac) đã cập nhật tới 06/11 14:08; trước đó bản mới nhất là 30/10.

## 2. Quyết định QC

**ĐẠT CÓ ĐIỀU KIỆN.** Round 4 đóng, OTTIMO chuyển sang vận hành. Chi tiết: `qc/round-4-closeout-gate.md`.

**Vì sao đạt:**
- Production không còn lỗi P0/P1 chưa sửa.
- Mọi thẻ Blocker và Major đã xử lý hoặc có đích.
- 12 ca bảo mật của SEC đều có kết luận, không ca nào đỏ.
- Đã có mức an toàn vận hành tối thiểu: bản sao lưu ngoài máy mới, kiểm giá web ra 0 căn thiếu giá, cảnh báo có người nhận.

**Điều kiện kèm theo** (không điều kiện nào đổi production):

| ĐK | Việc | Ai | Hạn |
|---|---|---|---|
| 1 | Một lượt kiểm tự động (CI) xanh đủ mọi bước trên bản mã mới nhất. **Đã đạt tối 06/11** | ORC | 07/11 12:00 |
| 2 | Diễn tập khôi phục từ bản sao lưu. Trước khi xong, không lên production bản nào đổi cấu trúc dữ liệu hay cách sao lưu. Bản sửa P0 vẫn lên được | OPS + anh/chị (30 phút) | Chậm nhất 20/11 |
| 3 | Kéo bản sao lưu về Mac ít nhất 2 ngày một lần. Script báo "bản trên máy chủ đã bị đổi" thì xử lý như P0 bảo mật | ORC, khi anh/chị cho phép | Lần tới 08/11 |
| 4 | Sổ vận hành sửa cho khớp: kéo sao lưu 2 ngày một lần (không phải mỗi tuần); phòng "Báo động" được thêm một người anh/chị chọn | BA | 08/11 |
| 5 | Sổ tay và bộ hướng dẫn bỏ câu cũ "check-in online tạm dừng". Check-in online đã mở lại từ 06/11 | BA | 10/11 |
| 6 | Từ điển tham số sửa mục `night_from_month_divisor` (khóa này vẫn còn tác dụng ở một đường nhập giá qua API) | DOM | 08/11 |
| 7 | QA đóng sổ 28 lỗi đã sửa, gồm 8 lỗi P0/P1. Kiểm lại hai lỗi P1 ở quầy | QA | 10/11 |
| 8 | OPS trả lời đủ các thẻ SEC mở tối 06/11 | OPS | 08/11 |

**Diễn tập khôi phục là điều kiện, không chặn việc đóng round.** Chỉ anh/chị mở được khóa giải mã. Đóng round không đổi gì trên production. Điều kiện 2 vẫn chặn các bản có thay đổi dữ liệu cho tới khi diễn tập đạt.

**Anh/chị cần biết:**
- Chưa chứng minh được bản sao lưu hiện nay khôi phục được. Lần diễn tập cuối là 29/10.
- Bản sao lưu ngoài máy chỉ mới khi anh/chị cho đội kéo. Chưa có gì tự báo khi bản này cũ.
- Mức mất dữ liệu thật hiện là 24 giờ.
- Cảnh báo chỉ tới một mình anh/chị.
- Giá trên production còn lệch sổ tay tới khi anh/chị chỉnh B2–B11.

**QC đã sửa trong tệp này** (ngày 06/11, tối):
- Mục 1: số 2,5 giây ghi rõ là đo trên bản thử.
- Mục 1: sổ tay chưa khớp hết; còn câu cũ về check-in online.
- Mục 3: OR-01 thêm "SEC đã xác nhận, thẻ đóng".
- Mục 3: tiêu đề cột cuối bảng lỗi đổi thành "8 vào v1.0.5, BUG-R4-054 vào backlog".
- Các số còn lại QC đã đối chiếu với PO và hai bug list, để nguyên.

## 3. Chỉ số round

**Thẻ góp ý (review chéo):** 748 thẻ.

| Mức | Tạo | Đã xử lý | Dời có đích | Không cần xử lý |
|---|--:|--:|--:|--:|
| Blocker | 1 | 1 | 0 | 0 |
| Major | 121 | 120 | 1 (→ v1.0.5) | 0 |
| Minor | 356 | 310 | 46 (19 → v1.0.5, 27 → backlog) | 0 |
| Suggestion | 253 | 132 | 34 | 87 |
| Chưa rõ mức | 17 | – | – | 17 |

- Tối 06/11 SEC mở thêm 11 thẻ (3 Major). Không thẻ nào chặn bản đang chạy.
- Major OR-01: script kéo sao lưu không được ghi đè bản đã có trên Mac. Thẻ này đã sửa ngay trong Round 4. SEC đã xác nhận, thẻ đóng (`066da253`).
- Hai Major còn lại vào v1.0.5 hoặc backlog, có đích.

**Lỗi Round 4:** 57 lỗi.

| Mức | Tìm | Đã sửa, đã đóng | Đã sửa, chờ QA đóng sổ | Còn mở (8 vào v1.0.5, BUG-R4-054 vào backlog) |
|---|--:|--:|--:|--:|
| P0 | 4 | 0 | 4 | 0 |
| P1 | 4 | 0 | 4 | 0 |
| P2 | 20 | 9 | 7 | 4 |
| P3 | 29 | 11 | 13 | 5 |
| **Tổng** | **57** | **20** | **28** | **9** |

- **Không còn lỗi P0/P1 mở.** Cả 8 lỗi P0/P1 đã sửa trong bản đang chạy (v1.0.4). QA chỉ còn việc đóng sổ ở Gói 0 của Round 5.
- 4 lỗi P0 đều là lỗi tiền ở quầy. Sổ tay có cách làm tạm cho tới v1.0.4.
- BUG-R4-056 (tài liệu thử) đã đóng sau khi PO đếm số liệu. Vì vậy bảng này có 1 lỗi P3 đóng nhiều hơn bảng của PO.

## 4. CẦN ANH/CHỊ QUYẾT ĐỊNH – ở buổi review 20/11, không cần trả lời ngay

Còn 8 việc chờ. Chi tiết và phương án: `outputs/PO/esc-pending-06-11.md`.

| Nhóm | ESC | Đội đề xuất |
|---|---|---|
| Đề nghị **đóng**, anh/chị chỉ cần xác nhận | 032 (tăng giá mùa lễ), 035 (phụ thu nhận phòng sớm) | Bảng giá 01/11 của anh/chị đã trả lời: không tăng giá cuối tuần và lễ; từ 11:00 không phụ thu |
| Đội **chạy theo đề xuất**, anh/chị xác nhận sau | 037 (chấm công – bản sau), 038 (kế toán xem Nhật ký tiền cùng chủ). ESC-035 đang chạy theo đề xuất trong lúc chờ đóng | Như trong tệp |
| **Phải chờ anh/chị** | 033 (VAT 2027), 047 (thu gì khi khách tháng vào giữa tháng) | Giữ giá khách trả; thu ký quỹ và kỳ đầu đã gộp |
| | 039 (lễ tân biết tiền chuyển khoản đã về) | Thiết bị báo tiền đặt ở quầy, anh/chị làm với ngân hàng |
| | 046 (phòng Google Chat thử) | Anh/chị tạo phòng thử, khoảng 5 phút |

**Việc chỉ anh/chị làm được** (không phải chọn phương án):
1. Hẹn khoảng 30 phút để mở khóa giải mã sao lưu cho buổi diễn tập khôi phục. Round 4 chưa diễn tập lần nào.
2. Trả lời có hoặc không, không gửi giá trị:
   - (a) sao lưu tự động của nhà cung cấp máy chủ đang tắt, hoặc giữ tối đa 7 ngày;
   - (b) bản ngoại tuyến của khóa dữ liệu và khóa giải mã sao lưu vẫn còn, anh/chị mở được;
   - (c) máy Mac đã bật FileVault.
3. Đồng ý hay không cho đội cài lịch tự kéo sao lưu hằng ngày về máy Mac này. Tới khi có lịch, đội kéo tay ít nhất 2 ngày một lần vào những ngày anh/chị cho phép SSH.
4. Xác nhận mức mất dữ liệu tối đa là 12 giờ (sau v1.0.5), thay cho con số 15 phút ghi từ trước. Hiện mức thật là 24 giờ.
5. Tùy chọn: thêm một người thứ hai nhận cảnh báo.
6. Chỉnh các tham số giá còn lệch sổ tay theo từ điển: B2, B3, B4, B5, B7, B8, B9, B11, `rounding.ota_rate`. Giá City View 800.000 đã nhập trên production từ 06/11 (Amber, Mist), không cần làm lại.
7. Ở buổi 20/11: chốt giá năm 2027 và mốc `web_estimate.open_until`. Chưa gia hạn thì từ 01/01/2027 web ghi "giá theo yêu cầu".

## 5. Giả định đội đang dùng – nhờ xác nhận ở buổi review

- Review định kỳ mỗi 2 tuần, khoảng 30 phút. Buổi đầu thứ Sáu 20/11/2026.
- Đội không đổi tham số giá hay tiền trên production. Anh/chị tự chỉnh theo từ điển.
- Desk hiện "từ – đến" (V5-19) để ở mức nên có trong v1.0.5, với điều kiện phải lên trước khi hai căn cùng hạng có giá khác nhau. Hiện các căn cùng hạng cùng giá.
- `ota_base_rate`: v1.0.5 chỉ hiện tên và câu "Không cần nhập".
- Sửa lỗi form trên bản thử (BUG-R4-054): v1.0.5 chỉ làm phần SEC bắt buộc; phương án mở rộng vào backlog.

## 6. Kế hoạch Round 5 – bản bảo trì v1.0.5

- **Nguyên tắc:** chỉ sửa, không thêm tính năng; vẫn đủ 7 bước; production chỉ lên khi anh/chị đồng ý.
- **Phạm vi:**
  - 553 mục còn mở đã được xếp hết: 126 vào v1.0.5 (gom thành 59 việc), 203 vào backlog cải tiến, 224 đóng.
  - 7 gói, theo thứ tự: khép sổ Round 4 → tiền và trả phòng ở quầy → chữ và tham số theo bảng giá 01/11 → việc có hạn cứng → bảo mật nhỏ → lỗi nhỏ (nên có) → vận hành và tài liệu.
- **Lịch:**
  - 07–19/11: làm, review, kiểm thử, QC.
  - 20/11: review định kỳ, anh/chị xem và cho phép.
  - 20–21/11: lên production. Hạn cứng: phần hoa hồng H2 trước 01/12.
- Chi tiết: `rounds/round-05/plan.md`.

## 7. Cách xem và dùng sản phẩm hiện tại

- Web khách: https://ottimo.vn (và `/vi/`, `/ko/`, `/zh/`, `/ru/`).
- Desk (máy quầy, máy chủ đầu tư): https://desk.ottimo.vn
- App nhân viên: https://staff.ottimo.vn
- Trang khách: https://g.ottimo.vn (khách mở bằng link hoặc mã QR của đơn).
- Gặp lỗi: mở Claude Code trong thư mục dự án, gõ `/feedback <mô tả>`, ảnh kèm theo phải che dữ liệu khách. Lỗi P0 (khách không đặt được, Desk sập, sai tiền) đội xử lý ngay; lỗi khác vào bản sau.
- Xem tiến độ: `/status`.
