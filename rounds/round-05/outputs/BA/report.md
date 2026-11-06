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
- ~~đơn giữ chỗ chưa tạo được link (BUG-R3-047, V5-53);~~ *Đính chính (BA, Phản hồi & sửa 06/11, FB-R5-SEC-BA-09): sai. BUG-R3-047 đã sửa ở v1.0.4 (`5539b7e6`): đơn giữ chỗ không có mục Link check-in online. Đã sửa ở `64025107`.*
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

## 6. Cập nhật 06/11 tối – Phản hồi & sửa (commit `a9927c78`)
- **Lời dặn về hai tham số** (BUG-R5-001, BUG-R5-003):
  - đặt cùng một câu ở 5 chỗ: sổ tay 1.4 và 5.6, `01` 9.2 và 15.6, sổ vận hành 4.1 (grep 5/5 khớp);
  - nội dung: tới khi v1.0.5 lên, không bấm **Lưu thay đổi** ở `weekend_nights` (**Đêm tính là cuối tuần**) và `min_stay` (**Ở tối thiểu**). Buộc phải đổi thì nhắn đội trước, **Hiệu lực từ** chọn ngày mai để còn **Hủy lịch**. Lỡ lưu thì báo đội ngay, coi là P0;
  - tên ô và tên nút đã đối chiếu với `strings-vi.json` và `ParamDialog.tsx`.
- **Dòng sự cố mới:** "Lỡ bấm Lưu thay đổi… hoặc mọi báo giá báo lỗi" (P0) ở sổ tay 5.5, `01` mục 17, sổ vận hành 3.2. Sổ vận hành 3.1 thêm ví dụ P0 "mọi báo giá trên Desk báo lỗi".
- **Con số "máy chủ mất hẳn"** ở 2.1a và 5.4, theo con số OPS (PR #93, `hosting-plan.md` mục 7 trên nhánh `r5-ops`):
  - trước v1.0.5: tới 72 giờ (thường khoảng 64);
  - từ v1.0.5, kéo tay: tới 60 giờ (thường khoảng 52);
  - Mac tự kéo: khoảng 36 giờ.
- **Sửa thêm ở 4.1:** ví dụ cặp tham số đổi thành "mức tăng cuối tuần với đêm tính là cuối tuần".
- **Số bản mới:**
  - sổ tay 1.16;
  - bộ hướng dẫn 1.14 (`01` 1.13);
  - sổ vận hành 1.5.
- **Giả định:**
  - lỡ lưu ô nào trong hai ô cũng là P0;
  - thêm ý "nhắn đội trước".
- **Chuyển vai khác** (ORC đã giao):
  - DOM sửa từ điển: câu "Desk kiểm đúng dạng khi lưu" và "Hiệu lực từ: hôm nay";
  - PO kiểm release-notes v1.0.4;
  - UXD dựng HTML từ `a9927c78`.
- **V5-71:** gỡ lời dặn và 3 dòng sự cố khi v1.0.5 lên.

## 7. Cập nhật 07/11 – Phản hồi & sửa: tài liệu v1.0.5 (Báo cần dọn, FDL 2 bước, tin `hold_expired`, BUG-R5-005/006)

Giao việc ORC 07/11. Nguồn: UXD `rounds/round-05/outputs/UXD/copy-v1.0.5.md` 9.7, 9.8; SEC `rounds/round-05/reviews/SEC-on-be-pr-100-d1.md` mục 4, 7; ARC `rounds/round-05/reviews/ARC-on-be-pr-100-d1.md` mục 2, 5, thẻ FB-R5-ARC-MOB-V51B-01; QA `rounds/round-05/qa/bug-list.md` (BUG-R5-005, 006); SEC `rounds/round-05/reviews/SEC-on-be-prs-101-108.md` (V516-02, V530-01); mã trên `main` (`hold-notices.ts`, `notifications.tsx`, `session.ts`, `SessionProvider.tsx`).

**Đã làm:**
- **Release notes v1.0.5:**
  - nhãn nút **Báo cần dọn** / **Mark for cleaning** ở 3 chỗ (dòng nhóm Trả phòng, v1.0.4 "Giới hạn đã biết", bảng "Chưa có"); grep không còn nhãn cũ;
  - dòng mới **Tin giữ chỗ tự hủy** (V5-1B): tin ở hộp Thông báo trên app nhân viên; người nhận là người tạo, người chốt và mọi tài khoản `active` có vai FD/FDL tại cơ sở;
  - FDL 2 bước: bị hạn chế ngay ở lượt bấm kế tiếp sau khi bản lên, kể cả đang đăng nhập; thao tác vừa bấm không lưu; không tự tắt được nữa;
  - mục mới **Lỗi đội tìm thấy trong Round 5, sửa ở v1.0.5** (BUG-R5-005, BUG-R5-006, có cách làm tạm);
  - mục mới **Việc anh/chị làm trước ngày lên v1.0.5** (FDL bật 2 bước; máy quầy đăng nhập app nhân viên; 8 chữ số cuối của mã giao dịch);
  - v1.0.4 "Giới hạn đã biết" thêm dòng BUG-R5-006 và câu nhắc FDL;
  - sửa câu sai ở v1.0.4 bảng "Báo giữ chỗ quá hạn": app nhân viên v1.0.4 chưa có câu riêng cho 3 tin giữ chỗ, hiện câu chung "Thông báo mới – xem chi tiết trên OTTIMO Desk";
  - hai câu ORC thêm theo SEC V516-02: `line_reduction_count` tháng 11 chỉ đếm từ lúc v1.0.5 lên; "Chưa có tỷ lệ hoa hồng" và chưa tạo dòng hoa hồng tới khi OWN nhập tỷ lệ. Kèm câu SEC V530-01: trên production bảng cũ vẫn còn nên câu này chưa hiện, vẫn nhập bảng mới trước 01/12. Không ghi tỷ lệ nào.
- **V5-71, ba điểm** (sổ tay 1.17, bộ hướng dẫn 1.15):
  - FDL 2 bước: sổ tay 0.3, 1.5 (bảng vai, bước 7); `01` 1.9 (bảng, bước 8); `02` 1.3, 1.7 (dòng "Mất cả điện thoại lẫn mã khôi phục", phần lễ tân trưởng), 1.8;
  - tin `hold_expired`: sổ tay 2.4, 3.11; `02` 4.5; Tờ 2a dòng **Ở đâu** và **Hết hạn, chưa cọc**. Mọi chỗ ghi rõ **hộp Thông báo trên app nhân viên**, Desk không có hộp này. Ghi cả v1.0.4 (câu chung, chỉ người tạo, người chốt) và từ v1.0.5. Vẫn rà theo mã đơn;
  - **Báo cần dọn**: sổ tay 2.10 (ca 2), 2.19 bước 5, 3.5; `01` 14; `02` 7.4 (ca 2), 13.2 bước 5; `03` 6.
- **Tài liệu nghiệp vụ:**
  - EP02 0.2.1, mục 10.5: bảng tin J1 (3 kind, người nhận, khóa chống trùng, nơi đọc). Đóng phần người nhận của FB-R4-PO-BA-P420-01;
  - EP07-08 0.1.1, mục 2.1: nhãn và khóa `hk.action.needs_cleaning` (thay `hk.mark_dirty`), chỗ đặt nút;
  - rbac-matrix 0.2.9: chỉ sửa ghi chú A111 (FDL bắt buộc 2FA từ v1.0.5). **Không đổi mục 3, không đổi ô quyền**, `rbac-matrix.json` không đổi, nên không đụng test `SCREENS_BY_ROLE`.
- **Sổ vận hành 1.6** (tài liệu của BA, viết cho INV):
  - mục 1.5: trước ngày lên mọi FDL đã bật 2 bước;
  - mục 1.5: đổi vai chỉ trên Desk. Đội buộc phải sửa vai thẳng trong cơ sở dữ liệu thì phải đăng xuất người đó và tăng `roles_version` như Desk, nếu không quyền cũ còn dùng tới khoảng 1 phút (SEC Info);
  - mục 6: không tắt 2 bước của lễ tân trưởng.

**File sửa:** `product/docs/release-notes.md`, `product/docs/manual/user-manual-v1.0.md`, `product/docs/manual/guides/00-index.md`, `01-chu-dau-tu-quan-ly.md`, `02-le-tan.md`, `03-buong-phong.md`, `product/docs/staff-one-pager.md` (Tờ 2a), `product/docs/specs/EP02-reservations.md`, `product/docs/specs/EP07-08-housekeeping-maintenance.md`, `product/docs/rbac-matrix.md`, `product/docs/so-van-hanh.md`, tệp này.

**Giả định:**
- Mọi câu "Từ v1.0.5" giả định MOB #117 (câu riêng cho tin giữ chỗ), FE #102 và MOB #97 (nút Báo cần dọn) lên cùng tag v1.0.5, như ARC yêu cầu. Thiếu PR nào thì BA sửa câu tương ứng trước khi cắt bản.
- Nút **Báo cần dọn** trên app nhân viên: chỉ tả việc nút làm, không đặt luật khi nào buồng phòng bấm (thuộc DOM).
- Desk giữa ca với FDL chưa bật 2 bước: thao tác vừa bấm bị máy chủ từ chối (403), không lưu, Desk mở **Bật xác thực 2 bước** (`SessionProvider.tsx`); app nhân viên mở màn "bật trên Desk", hàng đợi giữ thao tác chờ (`queue.ts`).
- BUG-R5-005: câu cho lễ tân khi khách nhắn vì lỗi ("nhờ khách bỏ dãy số thẻ rồi gửi lại, không hỏi số thẻ") là cách xử lý BA đề xuất theo V-09, chưa có DOM.
- Vai **Lễ tân** (FD) giữ "Chưa" ở bảng 2 bước: chưa có quyết định DOM + SEC cho thẻ FB-R4-PO-BA-032-07. "Dòng Lễ tân ở `02` 1.7" của V5-40 hiểu là phần lễ tân trưởng ở dòng "Mất cả điện thoại lẫn mã khôi phục" (vị trí thẻ 032-07).
- ESC mới: không có.

**Rủi ro/vướng mắc:**
1. Tờ 2a là tài liệu PO + DOM; BA sửa theo giao việc ORC. Bản in chưa dựng lại.
2. Bản HTML (`ottimo-manual-v1.0.html`, `guides/html/`) và PDF Tờ 2a còn chữ cũ tới khi UXD dựng lại.
3. Sổ tay 2.4 và `02` 4.5, 17.1 vẫn còn các khung cũ "tới v1.0.3". V5-71 viết lại hẳn 2.4 theo v1.0.4 và Tờ 2a: chưa làm ở lượt này.

**Việc chưa xong trong V5-71:**
- viết lại sổ tay 2.4 và `02` 4.5, 17.1 theo v1.0.4 + Tờ 2a;
- dọn sau #69 (PR69-02/04);
- `so-van-hanh` 4.2, 5.4 "ô giá OTA nền" (V5-21);
- câu giá web ở sổ tay lễ tân;
- gỡ các lời dặn tạm khi v1.0.5 lên.

**Chuyển vai khác (ORC giao):**
- **PO:** đọc lại phần BA sửa ở release notes (của PO, V5-72), nhất là câu sửa ở v1.0.4 bảng "Báo giữ chỗ quá hạn" và mục "Việc anh/chị làm trước ngày lên"; đọc lại Tờ 2a. **DOM:** đọc Tờ 2a và câu BUG-R5-005 cho lễ tân.
- **UXD:** dựng lại HTML sổ tay, bộ hướng dẫn và PDF Tờ 2a từ commit này.
- **OPS:** đưa quy tắc "sửa `user_property_role` bằng SQL tay phải tăng `app_user.roles_version` và thu hồi phiên, như `setRoles`" vào runbook của OPS (`product/infra/server/README.md` hoặc runbook v1.0.5, PR #95). Sổ vận hành của BA chỉ ghi phần INV cần biết. `staging-add-owner.mjs` chỉ tạo người dùng mới nên không vướng (SEC mục 1.1).
- **ORC:** đưa "cho mọi FDL bật 2 bước trước ngày lên v1.0.5" vào danh sách việc INV ở `round-summary.md`.
- **ORC:** MOB #117 phải lên cùng tag với #100 (ARC), nếu không thì câu "Từ v1.0.5" về tin giữ chỗ sai.

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | BA – tài liệu v1.0.5 (V5-71 phần V5-15, V5-40, V5-1B; release notes v1.0.5): nhãn trên màn hình "Báo cần dọn" / "Mark for cleaning" ở sổ tay và release notes, tên việc "nút Cần dọn" giữ trong plan, hợp đồng, luật (UXD 9.7); FDL chưa bật 2 bước bị hạn chế ngay ở lượt bấm kế tiếp sau khi lên bản, INV cho FDL bật trước ngày lên; tin hold_expired đọc ở hộp Thông báo trên app nhân viên, người nhận người tạo, người chốt và mọi tài khoản active có vai FD/FDL tại cơ sở. Cách trình bày: mỗi chỗ ghi cả v1.0.4 và "Từ v1.0.5", không gỡ lời dặn tạm trước khi bản lên. | BA |`

## 8. Cập nhật 07/11 (lượt 2) – Phản hồi & sửa: câu sổ tay theo DOM (#101, #108, #110; tài liệu BA v1.0.5) và SEC (số thẻ qua tin nhắn)

**Đã làm** (không dựng HTML; UXD dựng sau khi PO, DOM đọc xong):
1. **Ca đêm, ARC A4** (DOM `DOM-on-be-prs-101-108-110.md` mục 4, thẻ FB-R5-DOM-ARC-D1-01). Từ v1.0.5 tới v1.0.6, lúc 00:00–05:59 danh sách **Khách đi** không hiện lượt có ngày đi hôm qua theo lịch mà khách còn ở (#100). Thêm câu DOM: trước 06:00 rà **Sơ đồ phòng**, kiểm căn hoặc hỏi buồng phòng, rồi **Trả phòng** (ghi giờ khách rời thật) hoặc **Gia hạn**. Có ví dụ ngày cụ thể, vì Desk lúc đó vẫn tính "hôm nay" là ngày hôm trước. Chỗ thêm: `02` mục 2 (bảng việc), 13.3, 17.6; sổ tay 2.20, 5.6.
2. **Đóng ca – dòng tự sửa giảm** (DOM mục 3.2 ý 2). Tới v1.0.6 chưa có `ShiftReport.lineReductions[]`.
   - Lễ tân: trước khi giao ca, mở **Nhật ký tiền → Nhật ký thao tác tiền**, tìm dòng **Điều chỉnh dòng folio** của mình mà **Trước → sau** nhỏ đi, ghi sổ giao ca, báo người nhận ca. Chỗ thêm: `02` 2, 12.4, 17.6; sổ tay 2.1 (cuối ca bước 3), 5.6.
   - Quản lý, chủ đầu tư: mỗi tuần rà bộ lọc **Sửa giảm dòng – 7 ngày**. Chỗ thêm: `01` 2.1, 8.1; sổ tay 1.1, 1.15.
3. **Buồng phòng – bổ sung minibar** (DOM mục 3.3, trả lời SEC V516-01). Luôn nạp đủ định mức theo bảng trong căn, không theo số món trên việc. Tủ thiếu nhiều hơn số trên việc thì báo lễ tân **trước khi** bấm **Làm xong** (nhãn thật `hk.task.complete`; DOM viết "Xong"). Chỗ thêm: `03` 7; sổ tay 3.7.
4. **Lễ tân đếm lại minibar thấp hơn – hai khối [Chờ xác nhận]** ở `02` 11.1 bước 2 và sổ tay 2.14 bước 2. Một khối cho trường hợp BE-A2 `r5-v516-minibar` không kịp v1.0.5 (câu DOM 3.3 cộng ý ORC "báo quản lý"), một khối cho trường hợp kịp. Có ghi chú HTML: ORC báo thì giữ một khối, bỏ ngoặc vuông; UXD không dựng hai khối này trước đó.
5. **FB-R5-DOM-PO-08** (DOM `DOM-on-ba-v105-docs.md` mục 1), làm cùng ý với Tờ 2a PO đã sửa. Chỗ sửa: sổ tay 2.4, `02` 4.5.
   - Tin ở hộp Thông báo không đổ chuông và chỉ để nhắc. Gõ mã đơn, bấm **Tất cả**, làm theo trạng thái đơn.
   - Tới v1.0.5, câu chung kèm mã đơn có thể là một trong ba loại tin giữ chỗ. Tài khoản có vai quản lý nhận cả ba.
   - Tách hai trạng thái:
     - đơn **Đã hủy**, lý do **Hết hạn giữ chỗ**: kiểm tiền về rồi báo khách;
     - đơn còn **Giữ chỗ · chờ cọc**: không báo khách đơn đã hủy; làm theo gạch **Đã nhận cọc** (sổ tay) hoặc `02` 17.1 ý (2)/(3).
6. **FB-R5-DOM-BA-01, release notes** dòng BUG-R5-005, cột "Tới khi v1.0.5 lên", theo chữ DOM:
   - nhận yêu cầu ngay trên kênh khách đang nhắn, không bắt khách gửi lại;
   - lời nhắn có dãy từ 13 chữ số trở lên bị chặn: số thẻ, số tài khoản, hai số điện thoại viết liền;
   - không hỏi dãy số đó là gì;
   - khách muốn trả thẻ thì mời trả tại máy POS.

   Thêm câu chốt SEC 6.1 và một câu báo chủ đầu tư (6.3).
7. **Luật chung "khách lỡ gửi số thẻ hoặc ảnh thẻ qua tin nhắn, email"** (SEC `SEC-responses.md` mục 6.1–6.3). Thêm một dòng ngay dưới "Khách đọc số thẻ qua điện thoại" ở sổ tay 2.21 và `02` 16.1, gồm:
   - câu chốt SEC;
   - (b) một dòng sổ giao ca không có số, theo mẫu SEC;
   - (c) báo chủ đầu tư trước khi hết ca. Ca bất thường thì gọi ngay, muộn nhất 1 giờ, kể cả ban đêm. Gọi, không nhắn số.

   Câu trả lời khách để "(chờ CPY)". Bản nháp SEC nằm trong ghi chú HTML ngay dưới bảng, để CPY/UXD chỉnh.
8. Số bản:
   - sổ tay 1.17 → **1.18**;
   - bộ hướng dẫn 1.15 → **1.16**: `01` 1.15, `02` 1.15, `03` 1.7;
   - mỗi tệp có dòng lịch sử.

**File sửa:**
- `product/docs/manual/user-manual-v1.0.md`;
- `product/docs/manual/guides/00-index.md`, `01-chu-dau-tu-quan-ly.md`, `02-le-tan.md`, `03-buong-phong.md`;
- `product/docs/release-notes.md` (chỉ dòng BUG-R5-005 và ghi chú nguồn);
- tệp này.

**Giả định:**
- Lễ tân **không** thấy bộ lọc **Sửa giảm dòng – 7 ngày**: US-177 AC7 (i), UXD 9.5 "Chỉ MGR, OWN". Câu DOM 3.2 viết "lễ tân mở Nhật ký, lọc Sửa giảm dòng của mình". BA đổi sang tab **Nhật ký thao tác tiền**, nơi lễ tân thấy khoản của mình và có hàng `folio_line.adjusted` ("Điều chỉnh dòng folio (đảo + dòng mới)") với cột **Trước → sau**. Giả định cột này hiện đúng số trước, sau cho cả lần bỏ dòng (`after.amountVnd = 0`) và đếm lại minibar (`reason: minibar_recount`).
- Bộ lọc nằm ở **Nhật ký tiền**, theo UXD 9.5. BA không ghi tên tab.
- Ca đêm: lượt có ngày đi = ngày nghiệp vụ vẫn bấm **Trả phòng** được trước 06:00. Điều này đúng ở v1.0.4 và #100 không đổi. BA chỉ thêm câu, không đổi luật.
- "Phải nhờ quản lý" sau 06:00: người trực hiện nay giữ vai quản lý, nên làm bằng quyền quản lý, có lý do (phần **Cách đọc tệp này**).
- Câu "Từ v1.0.5 mỗi loại có câu riêng" đúng khi MOB #117 lên cùng tag với #100 (DOM giả định 1).
- ESC mới: không có.

**Rủi ro/vướng mắc:**
1. **Chốt chặn đếm lại minibar (BR-438 (2a)) ít tác dụng ở OTTIMO hiện nay.** App nhân viên chưa có màn đếm minibar (sổ tay 3.7, 5.6). Buồng phòng báo số bằng lời, rồi lễ tân tự gõ ở bước **Minibar** của **Trả phòng**. Mã chỉ gọi `recordMinibarCheck` từ `CheckOutPage.tsx`. Vì vậy:
   - dòng đếm "gốc" thường là của chính lễ tân, gõ trong ngày. Hạ số sau đó vẫn hợp lệ theo (1);
   - lễ tân cũng có thể gõ thấp ngay lần đầu, không phải lần "sửa giảm" nào;
   - lối "nhờ buồng phòng đếm lại" (DOM 3.3 ý 2) không gỡ được chặn: buồng phòng đếm lại thì vẫn do lễ tân gõ. Hai khối [Chờ xác nhận] nên chỉ ghi "báo quản lý".

   Cần DOM + SEC xem: chấp nhận rủi ro tới khi có màn đếm minibar cho buồng phòng, hay thêm kiểm soát thao tác. Ví dụ: buồng phòng ghi số đếm vào sổ giao ca, quản lý đối chiếu ở lượt rà tuần.
2. **FE chưa có nhánh dựng bộ lọc "Sửa giảm dòng – 7 ngày"** (`mlog.filter_reductions`): không nhánh nào có chuỗi này hay `reductionsOnly` trong `admin-web`. Release notes và tài liệu đã hứa bộ lọc ở v1.0.5. Không kịp thì `01` 2.1, 8.1 và sổ tay 1.1, 1.15 phải đổi.
3. Bản HTML và PDF còn chữ cũ tới khi UXD dựng lại.

**Chuyển vai khác:**
- **ORC:** báo BA khi biết BE-A2 có kịp v1.0.5, để giữ một trong hai khối [Chờ xác nhận]. Rủi ro 1 gửi DOM + SEC; rủi ro 2 hỏi FE-A.
- **PO:** release notes v1.0.5 chưa có mục "Giới hạn đã biết". Khi cắt bản, nên thêm:
  - A4 (rà **Sơ đồ phòng** trước 06:00);
  - danh sách đóng ca chưa có dòng tự sửa giảm (tới v1.0.6).
- **CPY:** câu trả lời khách khi khách lỡ gửi số thẻ (bản nháp SEC 6.1). Khi có, BA thay "(chờ CPY)" ở sổ tay 2.21 và `02` 16.1.
- **UXD:** dựng HTML sổ tay 1.18 và bộ hướng dẫn 1.16 sau khi PO, DOM đọc. Không dựng hai khối [Chờ xác nhận].
- **DOM:** đọc lại một lượt:
  - câu ca đêm, đóng ca và bổ sung minibar;
  - sổ tay 2.4, `02` 4.5 (thẻ PO-08);
  - rủi ro 1.

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | BA – câu sổ tay theo DOM #101/#108/#110 và DOM, SEC trên tài liệu v1.0.5: ca đêm rà Sơ đồ phòng trước 06:00 (A4, v1.0.5–v1.0.6); lễ tân ghi sổ giao ca dòng tự sửa giảm từ Nhật ký thao tác tiền (lễ tân không thấy bộ lọc 7 ngày – US-177 AC7 (i)), quản lý rà bộ lọc mỗi tuần; buồng phòng nạp đủ định mức; hai khối [Chờ xác nhận] đếm lại minibar chờ BE-A2; hộp Thông báo chỉ để nhắc, làm theo trạng thái đơn (PO-08); BUG-R5-005 theo DOM BA-01; luật chung khách lỡ gửi số thẻ (SEC mục 6) ở sổ tay 2.21, 02 16.1, câu khách chờ CPY. Sổ tay 1.18, bộ hướng dẫn 1.16 | BA | Không ESC |`

**Bổ sung cùng ngày (ORC, theo DOM `DOM-responses.md` thẻ FB-R5-QA-DOM-BR438-01 chọn A):** thêm vào sổ tay 2.15 và `02` 11.3 (khối **Hẹn trả muộn trước**) câu "Muốn miễn phụ thu trả muộn: làm trước khi bấm **Trả phòng** (đặt giờ trả muộn rồi gửi miễn có duyệt: **Xin miễn phụ thu (gửi duyệt)** ở bước 2, hoặc ở folio). Sau **Trả phòng** chỉ quản lý sửa được." Áp dụng ngay, không chặn v1.0.5. Nút ghi theo nhãn thật trên hộp **Trả muộn**, vì nhãn "Gửi miễn có duyệt" của DOM chỉ có từ v1.0.5. Không đổi số bản: ghi vào dòng sổ tay 1.18, bộ hướng dẫn 1.16, `02` bản 1.15. Hai khối [Chờ xác nhận] minibar và "(chờ CPY)" giữ nguyên, chờ ORC.
