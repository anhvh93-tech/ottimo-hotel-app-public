# BA – Round 5, bước Sản xuất, Gói 0: sổ vận hành bản 1.2 và câu check-in online

- Người làm: BA. ORC lưu tệp này từ báo cáo bàn giao của BA (subagent không ghi tệp báo cáo).
- Commit: `4d25f5b7` trên `main`.
- Việc: QC R4 ĐK-4 (sổ vận hành: nhịp kéo sao lưu, người thứ hai nhận cảnh báo), ĐK-5 / V5-08 (bỏ câu check-in online "tạm dừng / chưa gửi link").

## 1. Đã làm gì

**ĐK-4 – sổ vận hành `product/docs/so-van-hanh.md` bản 1.1 lên 1.2**
- Đầu tệp: ghi bản 1.2.
- 1.1a mới "Hai ngày một lần":
  - OWN cho phép kéo; lần gần nhất 06/11 khoảng 19:00, lần tới 08/11.
  - Đội báo lại một dòng sau mỗi lần kéo.
  - Bản trên Mac không bị ghi đè hay xóa; bản quá 35 ngày tự xóa.
  - "server copy changed" (mã 3): P0 bảo mật, giữ bản Mac, không xóa, không kéo lại.
  - Lỗi khác: kéo lại vào lần INV cho phép kế tiếp, không để quá 2 ngày.
- 1.2: thay dòng "kéo mỗi tuần" bằng "kiểm lần kéo gần nhất không quá 2 ngày".
- 1.3: phòng Báo động có anh/chị và người thứ hai (nếu có).
- 1.4: thêm mốc kéo từ 08/11 và mốc diễn tập chậm nhất 20/11.
- 1.5: người nghỉ thì gỡ khỏi phòng Báo động cùng ngày.
- 2.1a mới, bảng mất dữ liệu tối đa:
  - máy chủ còn: 24 giờ, từ v1.0.5 còn 12 giờ;
  - máy chủ mất hẳn: mất phần sau bản mới nhất trên Mac;
  - con số 15 phút cũ chưa đúng; INV xác nhận 12 giờ ở buổi 20/11.
- 2.2:
  - dòng kéo ngoài máy: ít nhất 2 ngày một lần; v1.0.5 tự kéo nếu INV đồng ý; quá 48 giờ thì có email về `info@`;
  - dòng mới: lượt sao lưu 14:00;
  - dòng diễn tập: quá 35 ngày thì FAIL; lần gần nhất 29/10.
- 2.3 bước 6 mới: người thứ hai nhận FAIL làm gì.
- 3.1: thêm ví dụ P0 "server copy changed".
- 5.3 ý 5: kéo không quá 2 ngày; trong kỳ có "server copy changed" không; diễn tập không quá 35 ngày.
- 5.4: thêm 5 việc cho buổi 20/11:
  - diễn tập khôi phục;
  - trả lời có/không ba ý (a), (b), (c);
  - đồng ý hay không cho cài lịch kéo tự động;
  - xác nhận 12 giờ;
  - chọn người thứ hai.
- 6: phòng Báo động có tối đa một người thứ hai; không xóa, không chuyển thư mục sao lưu.
- 7.2: sửa dòng phòng Báo động, thêm khối "Thêm người thứ hai" (vì sao, ai, cách thêm, nhắn đội chỉ ghi vai).
- G2: ít nhất 2 ngày một lần.
- Gộp ĐK-4 (c): nhắc diễn tập sau 35 ngày thay "hằng quý" (SEC đồng ý, `rounds/round-04/reviews/SEC-on-bug-r4-054.md` B1).
- Thêm dòng 1.2 vào bảng lịch sử.

**ĐK-5 / V5-08 – sổ tay `product/docs/manual/user-manual-v1.0.md`**
- 0.1: check-in online mở lại từ 06/11/2026.
- 0.9: bỏ vế "link đang tạm dừng".
- 2.4: nút link ở đơn giữ chỗ "dự kiến sửa ở v1.0.5"; xác nhận cọc trước rồi gửi link.
- 2.9:
  - viết lại khung đầu mục: mở lại từ v1.0.4, thông báo bản 2 có vi/en/ru, ai gửi, đơn nào, khi chủ đầu tư báo dừng;
  - bỏ "lỡ gửi link" và "đội đếm link mỗi sáng";
  - cập nhật chú thích nguồn ẩn;
  - đoạn trang khách thêm câu thông báo có tiếng Nga.
- 4.2: bỏ "tạm dừng tới v1.0.3"; khách của sale hỏi link thì nhắn lễ tân mã đơn.
- 5.6: bỏ dòng "Check-in online cho khách thật" ở bảng Chưa có; sửa cách làm tạm ở dòng nút link của đơn giữ chỗ.
- 5.7: thêm mục lịch sử.
- 5.8: bài tập lễ tân đổi sang gửi link và xử lý gửi nhầm người.

**ĐK-5 / V5-08 – bộ hướng dẫn `product/docs/manual/guides/`**
- `00-index`:
  - mục 3, dòng `g.ottimo.vn`: check-in online đã mở lại;
  - mục 3, phòng Báo động: có thể thêm một người;
  - mục 4 bước 10: "đã làm 06/11";
  - mục 7: lịch sử.
- `01`:
  - 14.1: "lỡ gửi link" thành "gửi nhầm người";
  - 15 đoạn mở đầu và 15.4: viết lại;
  - 17.1: phòng Báo động có thêm người thứ hai, cách thêm, người thứ hai nhận FAIL làm gì.
- `02`:
  - 4.5 và 9.7: sửa câu về link;
  - 16.2: bỏ cấm gửi link, thay bằng quy tắc gửi riêng 1–1;
  - 17 đoạn mở đầu: bỏ check-in online khỏi danh sách "tạm";
  - 17.3: viết lại thành 5 bước gửi link, kèm lỗi "Bổ sung tại quầy" và khi chủ đầu tư báo dừng;
  - 20.3: bài tập 8 đổi sang gửi link.
- `05`:
  - 4.2 và 7.2: lễ tân gửi link, sale/CTV không chuyển tiếp;
  - 8 đoạn mở đầu: bỏ check-in online khỏi danh sách "tạm";
  - 8.3: viết lại.
- `screenshot-additions` dòng 8: ảnh C0-10 dùng lại được; UXD, QA kiểm ảnh còn khớp v1.0.4 (V5-04).

Viết theo SEC N4 và runbook N5:
- mở lại 06/11 lúc 14:22;
- người gửi link là lễ tân, lễ tân trưởng, quản lý, chủ đầu tư (sale, CTV không gửi);
- chỉ gửi cho đơn đã xác nhận;
- đội có thể báo dừng theo N6.

Đã sửa mọi chỗ QC liệt kê, cộng 9 chỗ grep tìm thêm. Grep `tạm dừng\|chưa gửi link` trên các tệp `.md` còn 6 dòng, đều đúng: phiếu sửa chờ vật tư, chú thích nguồn ẩn, mục lịch sử.

**Câu còn đúng, giữ nguyên:**
- đơn giữ chỗ chưa tạo được link (BUG-R3-047, V5-53);
- Wi-Fi trên trang khách ghi "hỏi lễ tân" (V5-58);
- mở lại link sau "Bổ sung tại quầy" thì không gửi được (V5-5A);
- sale, CTV không gửi link.

## 2. File tạo/sửa
- `product/docs/so-van-hanh.md`
- `product/docs/manual/user-manual-v1.0.md`
- `product/docs/manual/guides/00-index.md`
- `product/docs/manual/guides/01-chu-dau-tu-quan-ly.md`
- `product/docs/manual/guides/02-le-tan.md`
- `product/docs/manual/guides/05-sale-ctv.md`
- `product/docs/manual/guides/screenshot-additions.md`

## 3. Giả định
- [GIẢ ĐỊNH – chờ INV xác nhận] Phòng Báo động có một người thứ hai, tài khoản `@ottimo.vn`. Đề xuất quản lý hoặc lễ tân trưởng (OPS OR-L7). Người này nhận FAIL thì gọi INV, không tự báo đội, vì chỉ INV dùng Claude Code.
- Ngưỡng báo kéo chậm ở v1.0.5 là 48 giờ của OPS, bỏ con số 8 ngày (V5-60 yêu cầu chốt một ngưỡng).
- Lượt đếm link mỗi sáng của SEC S4 chỉ chạy "tới khi mở lại", nên tài liệu bỏ câu này.
- Ngày sửa ghi trong tài liệu: 06/11/2026.
- ESC mới: không có.

## 4. Rủi ro/vướng mắc
1. `product/docs/staff-one-pager.md` (tờ dán quầy, PO + DOM) Tờ 1, dòng 87–89 còn ghi "Check-in online – tạm dừng từ 02/11, không tạo, không gửi link". Sổ vận hành dặn lễ tân dùng tờ này mỗi ca.
   - Đề xuất PO thay bằng ba dòng: mở lại từ 06/11/2026; chỉ đơn đã xác nhận, sao chép link, gửi riêng 1–1, không kèm mã cửa; gửi nhầm người thì thu hồi link, tạo link mới.
   - Sau đó INV in lại Tờ 1.
   - `day-one-guide.md` dòng 190: ghi "hết hiệu lực từ 06/11".
2. `release-notes.md` dòng 91 và 157 còn "chưa mở lại / vẫn dừng" (V5-01, PO).
3. Hai bản HTML (`ottimo-manual-v1.0.html`, `guides/html/`) còn câu cũ tới khi UXD dựng lại (V5-04).
4. Lượt 03:00 và 14:00 để lại khoảng 14:00 → 03:00 dài **13 giờ**, không phải 12. Tài liệu đang ghi 12 giờ cho khớp V5-62, tổng kết Round 4 và esc-pending. OPS và ARC chọn trước 20/11: dời lượt hai sang 15:00, hoặc sửa mọi nơi thành 13 giờ.
5. Khi máy chủ mất hẳn, phần dữ liệu mất tính từ bản mới nhất trên Mac, có thể quá 2 ngày. Tài liệu chỉ ghi nguyên tắc; OPS có thể thêm con số.
6. PR #69 (đang mở) sửa cùng 7 tệp; gộp có thể xung đột ở mục lịch sử (V5-71).
7. Còn câu "tới v1.0.3" ở phần không phải check-in online: đoạn mở đầu `01` 15, `02` 17, `05` 8; sổ tay 2.4 "Lỗi nhỏ đã biết". V5-71 dọn.

## 5. Việc chưa xong
- SEC hoặc OPS đọc lại sổ vận hành 1.2.
- SEC và UXD review sổ tay và bộ hướng dẫn.
- PO sửa dòng V5-08 trong plan Round 5 cho đúng phạm vi đã mở rộng.
- Rủi ro 1 (PO) và 4 (OPS, ARC): ORC giao.
