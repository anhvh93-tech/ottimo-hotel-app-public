# Tổng kết Sprint 3 – Round 2 (Nhận phòng · lưu trú · trả phòng · tiền · giấy tờ)

- Người viết: ORC | Ngày: 17/10/2026
- Code: `fe4b166` (sửa lỗi) · commit bước QC `02cfaba`. CI run 39020532465: **xanh** (7 job đạt, 2 job staging/GHCR chờ VPS), API 2.201/2.201, E2E chạy thật 1.786 đạt / 0 trượt.
- Quyết định QC Sprint 3 (bản 3): **ĐẠT CÓ ĐIỀU KIỆN** (`rounds/round-02/qc/s3-qc-gate.md`).
  - Bản 1: ĐẠT CÓ ĐIỀU KIỆN.
  - Bản 2: KHÔNG ĐẠT. Lý do: UXR tự bấm thật trên giao diện, thấy 3 thao tác ở quầy không làm được.
  - Bản 3: sau vòng sửa 9.
- Demo lần 1 trên máy Mac: anh/chị đã thử, phản hồi "mọi thứ có vẻ ok" (FB-INV-001).

## 1. Đã làm được (bấm thử được)
- **Nhận phòng:** kiểm giấy tờ, phụ thu nhận sớm có xin miễn và duyệt, người đi cùng, link check-in online cho khách (khách tự gửi ảnh giấy tờ, đồng ý, khai báo).
- **Giấy tờ khách (dữ liệu nhạy cảm C3):**
  - mã hóa, chỉ mở trên máy quầy đã được cấp quyền;
  - xem số đầy đủ hoặc ảnh phải nhập lại mật khẩu, tự ẩn sau 60 giây, mỗi lần xem có nhật ký;
  - ảnh tự xóa đúng hạn.
  - Bỏ một người khỏi đoàn thì giấy tờ khách gửi qua link chờ lễ tân gắn đúng người trong 24 giờ.
- **Khai báo lưu trú:** dữ liệu chép sẵn đúng định dạng anh/chị chọn (dd/mm/yyyy, quốc tịch 3 chữ cái), theo dõi hạn khai báo.
- **Lưu trú:** gia hạn, đổi phòng cả lượt ở (kể cả đơn gia hạn), trả muộn có phụ thu theo mốc giờ, thêm người có phụ thu (lễ tân xác nhận đã báo khách).
- **Trả phòng 3 bước:** minibar, phụ phí, bill song ngữ Việt–Anh (in được), thu tiền mặt hoặc **VietQR** (QR đúng chuẩn ngân hàng).
- **Tiền:**
  - mọi khoản thu do lễ tân, sale hoặc CTV ghi đều chờ đối soát;
  - hoàn tiền tách quyền: người duyệt, người nhập tài khoản và người chi khác nhau, riêng chủ đầu tư được vừa duyệt vừa chi;
  - FOC theo đêm đi đúng quy tắc DOM khi đổi ngày hoặc đổi phòng;
  - quy tắc riêng cho đơn OTA (phụ thu theo số khách OTA, phạt hủy, trả sớm).
- **Hạ tầng:** CI 9 bước, có test giao diện bấm thật các bước ghi tiền và giấy tờ. Bản demo một lệnh có smoke test tự động.

## 2. Chất lượng
- **Kiểm chứng đối kháng:** 8 vòng do người phản biện độc lập tìm cách phá. Qua đó tìm ra và sửa:
  - rò bộ nhớ khi tải ảnh lớn (3 biến thể);
  - FOC rơi sai đêm khi dời ngày;
  - xóa nhầm ảnh giấy tờ khi bỏ người khỏi đoàn;
  - lỗi tiền trên đơn OTA.
- **Đi thử demo như người dùng thật (UXR):** tìm ra 9 lỗi giao diện mà test tự động bỏ sót. Tất cả đã sửa ở vòng 9 và có test bấm thật trên CI.
- **Nghiệm thu PO:** 27 story Sprint 3, trong đó 17 Accepted, 10 Accepted một phần (phần dời sang Sprint 4), 0 trả lại.
- **Sổ lỗi:** tìm 103 lỗi, đã đóng 62, hoãn 2. Còn mở 39:
  - 6 lỗi P0 và 1 lỗi P1 **sai tiền ở đường hiếm**, phần lớn chỉ gặp qua API. Theo quyết định ORC, những lỗi này **phải sửa xong trước cổng QC Sprint 4**, còn sót thì cổng cuối Round 2 KHÔNG ĐẠT;
  - 1 lỗi P1 (phương án chính cho việc bỏ người khỏi đoàn);
  - các lỗi P2, P3 về giao diện, chữ.
- **SEC:** gỡ chặn cổng Sprint 3. **Chưa cho nhập dữ liệu khách thật** cho tới khi có staging và SEC kiểm trên máy chủ thật.

## 3. Điều kiện QC còn lại (chính)
- **Trước cổng QC Sprint 4:**
  - sửa 7 lỗi tiền;
  - làm phương án chính bỏ người khỏi đoàn;
  - SEC, DOM, ARC, UXD xác nhận các thẻ Major;
  - có một E2E chạy luồng A1 liền mạch.
- **Khi có VPS:** deploy staging, SEC kiểm trên máy chủ thật, QA chạy luồng A1 trên staging. Mức "đủ dùng" của Sprint 3 (A1 chạy trên staging) **chưa đạt vì chưa có VPS**.

## 4. CẦN ANH/CHỊ QUYẾT ĐỊNH
1. **Gấp – Máy chủ chạy thử (staging):** báo nhà cung cấp VPS + IP và tên miền. Không gửi mật khẩu. Thiếu staging thì nhóm A của QC cuối Round 2 KHÔNG ĐẠT.
2. **ESC-020 – Landing page** (6 câu L1–L6) và **ESC-021 – Zalo OA** (+ K1): đội đề xuất **A hết**. Chi tiết ở `landing-zalo-summary.html`.
3. **ESC-019 – Giá khi khách xin đổi sang căn khác trước ngày đến.** Đội đề xuất A: tính giá căn mới, giống khi khách đang ở.
4. **Thông tin cần gửi:**
   - bảng ghép tên phòng (The Pine…) ↔ số căn;
   - logo SVG;
   - ghim Google Maps;
   - email chung;
   - tạo và xác thực Zalo OA (ĐKKD CTCP UTMG Living).

## 5. Đội đang dùng giả định
- Brand Guidelines v1.0 áp cho mọi đầu ra.
- Landing không dùng màu đất nung của brochure.
- Khách thấy tên phòng, nội bộ vẫn dùng số căn.
- Lịch nhắn tin khách theo DOM; chủ đầu tư chỉnh được.

## 6. Sprint 4 (tiếp theo)
- **Tuần đầu:**
  - VietQR cọc;
  - sửa các lỗi tiền: đổi căn khác định mức, đơn OTA đổi phòng nhiều lần, FOC theo số đã duyệt và FOC chờ duyệt;
  - sau đó mới mở nút xin FOC ở bước trả phòng.
- **Phạm vi kế hoạch:**
  - app buồng phòng & bảo trì trên điện thoại;
  - yêu cầu của khách;
  - màn Hôm nay + "Cần chú ý" + Tổng quan cho chủ đầu tư.
- **Song song:**
  - chỉnh giao diện theo Brand Guidelines (S4-49);
  - landing page v1 (cổng riêng LP-v1).

## 7. Cách xem/dùng thử sản phẩm hiện tại
- Demo đang chạy trên máy Mac: http://localhost:8181, hướng dẫn `rounds/round-02/demo-1-guide.md` v1.3.
- Giữ chỗ D5 hết hạn 20:45 ngày 17/10. Thử ngày khác thì chạy `bash product/infra/demo/demo-reset.sh` trước.
