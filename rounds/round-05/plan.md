# Round 5 – Kế hoạch: bảo trì đợt 1 (bản v1.0.5)

- Người lập: PO (ORC duyệt, ARC và QA góp ý trước khi giao) | Ngày: 06/11/2026 | Bước 1 – Lập kế hoạch.
- Cập nhật 06/11/2026 tối (PO, Sản xuất Gói 0 – V5-01, V5-06), sau cổng QC đóng Round 4 (`rounds/round-04/qc/round-4-closeout-gate.md`):
  - lịch có bảng điều kiện QC R4 ĐK-1…8 kèm hạn (mục 2, cuối "Thứ tự và lịch đề xuất");
  - tiêu chí QC điều 8 thêm diễn tập khôi phục trước production nếu bản có migration (ĐK-2);
  - V5-08 mở rộng theo ĐK-5 và theo việc BA đã làm; V5-53 bỏ BUG-R3-047 (đã sửa ở v1.0.4);
  - Phản hồi & sửa theo SEC (06/11 tối): thêm V5-74 (runbook sự cố SR-INC-01), quyết định 11;
  - theo báo cáo UXD Gói 2 (06/11 tối): 3 khóa mục 4.19 vào V5-23, thêm V5-25 (`weekend_nights`), R1 và R4 vào backlog (quyết định 12–14);
  - theo review CPY chữ v1.0.5 (06/11 tối): quyết định 15, V5-23 thêm chữ khách "căn" → "phòng" và mẫu tin `msg.*`;
  - theo DOM rules v1.0.5 (06/11 khuya): thêm V5-1B, V5-5B, phương án dự phòng ĐK-2 cho V5-30/31, ESC-051 vào danh sách 20/11 (quyết định 16–18); V5-25 dẫn BUG-R5-001;
  - theo QA bug list R5 (`233b9b5d`; PO, Phản hồi & sửa 06/11 khuya): V5-25 thành **P1**, gồm cả `min_stay` (BUG-R5-003), làm đầu làn BE-C, không chờ PR hợp đồng; V5-5B chia 5B-1 (ghi tiền, hoàn, "Cần chú ý" `deposit_after_cancel` = US-085 AC4) và 5B-2 (khôi phục đơn), có chỗ cho kết luận SEC (quyết định 19–20); Tờ 1 giữ 8,25 pt (quyết định 21); backlog R5-B-05, R5-B-06;
  - theo DOM `rules-v1.0.5.md` bản chốt (`e9e0e2e4`): V5-5B theo 11.4 (mọi đơn `cancelled`, `no_show`; chỉ chuyển khoản, VietQR, ảnh bắt buộc; hoàn 100 % cùng giao dịch; khôi phục cho mọi đơn hủy lúc còn giữ chỗ), PO xác nhận vẫn nên có nhưng không vừa trọn, có đường cắt (quyết định 20); V5-25 trỏ DOM 12.1–12.3 và oracle 12.6;
  - theo SEC kết luận (b) cho BUG-R5-002 (`62103d55`, `406af104`; thẻ FB-R5-SEC-PO-B002-05): thêm **V5-48** (Gói 4, bắt buộc, làn BE-B, không migration; quyết định 22); 5B-1 thêm tiêu chí S1–S8, 5B-2 thêm tiêu chí SEC mục 4; lời dặn tạm cho người duyệt hoàn ở release notes v1.0.4; mục 7 đếm V5-48;
  - theo ARC hợp đồng 0.3.13 bổ sung 1c (PR #94, `2cb549cc`): V5-48 và 5B-1 là nhánh đơn đã đóng trong `recordPayment`, có `bankReference` tùy chọn, không migration; **PR-B3 (5B-1) xếp vào v1.0.5**, lịch theo thứ tự PR của hợp đồng mục 2, V5-48 nằm trong PR-B1, 5B-2 sang 0.3.14 / v1.0.6 (quyết định 23); **US-177** cho BR-438 (V5-16, quyết định 24); ghi chú QA về id ca rbac mới (mục 3);
  - theo SEC FB-R5-SEC-OPS-95-02 ý 4 (`rounds/round-05/reviews/SEC-on-ops-prs-92-93-95.md`): **V5-61 chưa đạt thì cả v1.0.5 chưa lên production**, kể cả phần không migration, vì V5-62 là đổi sao lưu (ĐK-2); hạn 01/12 của V5-30/31 phụ thuộc hoàn toàn vào V5-61; ORC xin INV hẹn diễn tập trong tuần 09–13/11 (quyết định 25);
  - mục 6 thêm quyết định 6–10; phụ lục I (điều chỉnh sau cổng QC, gồm hai cảnh báo Dependabot). Bảng đếm mục 7 giữ số QC đã kiểm, tác động ghi ngay dưới bảng.
- Chế độ: **vận hành thực tế**. Đây là round bảo trì đầu tiên. Chủ đầu tư (INV) chỉ review định kỳ để cải thiện hoặc sửa lỗi. Nguyên văn 06/11: "project này kéo dài quá rồi".
- Đầu vào:
  - bug list R1–R4: `rounds/round-0{1..4}/qa/bug-list.md`, `rounds/round-04/qa/bug-list-v1.0.4.md`;
  - `03-backlog/backlog.md`;
  - thẻ feedback trong `rounds/round-04/reviews/`;
  - decision-log 04–06/11;
  - release notes v1.0.4 mục "Chưa có";
  - DOM `rounds/round-04/outputs/DOM/pricing-spec-2026-11-01-reconcile.md` (H1–H11);
  - từ điển tham số `product/docs/tham-so-quy-tac.md` (mục cuối);
  - OPS `rounds/round-04/outputs/OPS/ops-readiness-06-11.md`, `rounds/round-04/outputs/OPS/bug-r4-054-proposal.md`, `product/infra/server/README.md` 12.3;
  - BA `product/docs/so-van-hanh.md` 2.2;
  - các việc ORC giao 06/11.
- Bảng chờ INV: `rounds/round-04/outputs/PO/esc-pending-06-11.md`. Số liệu Round 4: `rounds/round-04/outputs/PO/round-4-metrics.md`.

## 0. Nguyên tắc chế độ vận hành

1. **Bản bảo trì chỉ sửa, không thêm tính năng.** Được làm bốn loại việc:
   - lỗi tiền hoặc giá;
   - việc thay cho cách làm tạm ở quầy;
   - bảo mật và dữ liệu cá nhân;
   - chữ sai sự thật.

   Tính năng mới vào backlog cải tiến, INV chọn ở buổi review.
2. **Vẫn đủ 7 bước của protocol:** Lập kế hoạch → Sản xuất → Review chéo (mỗi đầu ra ít nhất 2 vai khác) → Phản hồi & sửa → Kiểm thử → QC → Tổng kết. Production chỉ lên khi INV đồng ý, từng lần.
3. **Chỉ hỏi INV ở buổi review định kỳ.** Ngoại lệ: P0/P1 trên production, hoặc việc có hạn tới trước buổi review sau.
4. **Đội không đổi tham số giá hay tiền trên production.** INV tự chỉnh theo từ điển tham số.
5. **Không SSH ngoài runbook.** Không đưa số hoa hồng, dữ liệu cá nhân khách hay bí mật vào repo, PR, test, chat.
6. **Thương hiệu OTTIMO** cho mọi chữ, màn hình và tài liệu hướng khách: bảng màu 80/15/5; Lora, Be Vietnam Pro, JetBrains Mono; tiếng Anh dẫn, tiếng Việt hỗ trợ, không emoji.

### Nhịp review định kỳ (đề xuất; ORC chốt với INV)

- Mỗi **2 tuần**, khoảng 30 phút.
- Buổi đầu: **20/11/2026** (trùng mốc trong sổ vận hành 5.4).
- Mỗi buổi xem:
  1. Bản đã lên và lỗi mới.
  2. ESC còn chờ.
  3. Năm mục đầu của backlog cải tiến: INV chọn việc cho bản sau.
  4. Số liệu vận hành: ADR, công suất, yêu cầu web, cảnh báo.
  5. Việc chỉ INV làm được.
- Mỗi buổi chọn phạm vi cho **bản sau** (v1.0.6, …). Việc chưa được chọn ở lại backlog.

## 1. Mục tiêu v1.0.5

1. Bỏ các cách làm tạm ở quầy dễ sai tiền:
   - khách đi trước 06:00;
   - trả sớm sau nửa đêm;
   - Tổng cộng ở bước Bill;
   - giữ chỗ theo giá đã thỏa thuận;
   - khoản chờ hoàn do người khác tạo;
   - lễ tân bỏ dòng phát sinh không qua duyệt.
2. Chữ trên Desk khớp bảng giá 01/11, và các tham số INV phải chỉnh có tên tiếng Việt.
3. Xong các việc có hạn cứng:
   - H2 hoa hồng: trước **01/12/2026**;
   - H3 phí dọn thuê tháng: trước lượt dọn đầu tiên của khách tháng.
4. Xong các việc bảo mật nhỏ đã hẹn. Đưa vận hành về mức an toàn:
   - tự kéo bản sao lưu ra ngoài máy;
   - diễn tập khôi phục;
   - giữ log;
   - nhắc hạn tên miền và máy chủ.
5. Khép sổ Round 4:
   - đóng các lỗi đã sửa;
   - release notes và sổ tay đúng với production 06/11;
   - backlog đúng trạng thái.

**Không làm trong v1.0.5:** tính năng mới; bất cứ gì đổi chính sách giá, cọc, hoàn, hủy; channel manager; chấm công; báo cáo xuất file.

## 2. Phạm vi v1.0.5 theo thứ tự

Thứ tự làm như sau:

1. **Gói 0** trước, và không đổi mã.
2. ARC chốt hợp đồng 0.3.13 cho các mục cần trường mới hoặc đổi hợp đồng: V5-10, V5-13, V5-1A, V5-30 (V5-19 nếu làm). BE, FE và MOB chỉ code sau khi hợp đồng chốt. **Ngoại lệ: V5-25 (P1) không chờ hợp đồng**, vì không đổi schema API (thẻ BE C0313-18). ARC chỉ thêm dòng mô tả `setParameter`, không chặn BE (quyết định 19).
3. **Gói 1–4 và phần bắt buộc của Gói 6** làm song song.
4. **Gói 5** làm sau cùng, nếu kịp. Mục không kịp sang v1.0.6, không chặn QC.

### Gói 0 – Khép sổ Round 4 (không đổi mã; 07–10/11)

| ID | Việc | Vai (làm → review) | Xong khi |
|---|---|---|---|
| V5-01 | **Release notes v1.0.4** (PO). Cập nhật:<ul><li>trạng thái "đã phát hành 06/11/2026 14:10, tag `v1.0.4` → `6414be25`";</li><li>LP-v2 đã lên, giá web đã bật; bỏ dòng "khách chưa thấy gì";</li><li>check-in online đã mở lại (N5);</li><li>số bản sổ tay sau #69 (tối 06/11 #69 chưa gộp vì xung đột với `main`; PO ghi số bản khi BA gộp ở V5-08);</li><li>BUG-R3-021 Desk dời sang v1.0.5 (V5-58).</li></ul>Mở mục v1.0.5 "Đang làm".<br>**PO làm tối 06/11**, gồm cả các mục "Chưa có" của v1.0.0–v1.0.3 trỏ về V5-xx và ghi chú "đã mở lại" ở các đoạn check-in cũ. Còn: số bản sổ tay sau #69. | PO → BA, DOM | Release notes không còn câu trái production |
| V5-02 | **QA đóng lỗi đã sửa** (danh sách phụ lục A, các dòng "(c) … QA xác nhận"). Gồm:<ul><li>chuyển Closed các lỗi v1.0.4 đang ghi "đã gộp / chờ staging";</li><li>kiểm lại BUG-R4-035, 039 mà QC v1.0.4 còn ghi mở;</li><li>dọn bug list R1 (14 dòng) và R3.</li></ul> | QA → QC | Bug list chỉ còn lỗi thật sự mở |
| V5-03 | **Phần còn lại của SEC 9.5 và P10.**<ul><li>SEC đã kết luận 06/11 tối (`rounds/round-04/reviews/SEC-on-lp-v2-s6d.md`): ca 3 và ca 8 ĐẠT; ca 10 ĐẠT bằng bằng chứng thay thế; ca 4 web ĐẠT. SEC đã sửa câu ca 10 ở mục 9.5. Phần Desk "từ – đến" của ca 4 nằm ở V5-19.</li><li>QA đọc tệp SEC rồi đóng BUG-R4-056.</li><li>P10 trên Desk staging cho BUG-R4-011, 012.</li></ul> | ORC + QA → SEC | BUG-R4-011, 012, 056 Closed |
| V5-04 | **Ảnh và bản HTML sổ tay.**<ul><li>UXD chụp lại C1-07, C1-22 (BUG-R4-023).</li><li>QA chụp lại `product/docs/manual/img/C2-39.png` (màn form đang bật) trên staging, chỉ dùng yêu cầu giả. QA kiểm che dữ liệu trước khi commit.</li><li>UXD dựng lại `ottimo-manual-v1.0.html` và `guides/html/` từ sổ tay mới nhất; không còn câu có tỷ lệ hoa hồng (FB-R4-SEC-UXD-HTML-01).</li></ul> | UXD, QA → BA, SEC (che dữ liệu) | Ảnh khớp production; HTML dựng lại, không vào repo |
| V5-05 | FB-R4-SEC-OPS-LPV2S4-01: OPS đã sửa chữ runbook LP-v2 r2.3 (commit `cef4d688`) và thêm câu kiểm S0 của BUG-R4-055. SEC xác nhận rồi đóng thẻ. | OPS → SEC | Thẻ Closed |
| V5-06 | **Backlog đúng trạng thái** (PO):<ul><li>story đã lên production chuyển "Xong" (phụ lục B1);</li><li>dòng mục 5.6 đã vào v1.0.4 ghi "Xong v1.0.4";</li><li>thêm mục 5.7 trỏ về kế hoạch này.</li></ul>**PO làm tối 06/11:** 19 story chuyển **Xong (production)** (gồm 9 story LP-v1 US-146…154, phụ lục I); 111 dòng mục 5.6, 5.6a, 5.6b ghi đích mới; mục 5.7. | PO → BA | Backlog không còn story "Mới" đã chạy |
| V5-07 | **Theo dõi lỗi 422 `ID_NUMBER_DETECTED`** tới 01/12 (4 tuần kể từ v1.0.2). Báo số ở review 20/11. | DATA + OPS → PO, SEC | Báo cáo tuần |
| V5-08 | **Sổ tay, hướng dẫn, tờ dán quầy: bỏ câu cũ về check-in online** ("tạm dừng", "tới v1.0.3, chưa gửi link"). Mở rộng theo QC R4 ĐK-5. Phạm vi:<ul><li>mọi chỗ QC liệt kê: sổ tay 0.1, 2.4, 2.9, 4.2, 5.6 (dòng 47, 808, 1006, 1760, 2013 lúc QC kiểm); `guides/00-index.md` dòng 73; `guides/01` 15.4; `guides/02` 17.3; `guides/05` 8.3; `guides/screenshot-additions.md` dòng 8;</li><li>cộng 9 chỗ BA grep thêm (`rounds/round-05/outputs/BA/report.md` mục 1): sổ tay 0.9, 5.7, 5.8; `00` mục 4 bước 10; `01` 14.1 và đoạn mở đầu 15; `02` 4.5, 9.7, 16.2, đoạn mở đầu 17, 20.3; `05` 4.2, 7.2, đoạn mở đầu 8;</li><li>cộng ĐK-4 (c): sổ vận hành nhắc diễn tập khôi phục sau 35 ngày thay "hằng quý" (SEC đồng ý, `rounds/round-04/reviews/SEC-on-bug-r4-054.md` B1);</li><li>ghi lại câu nào còn đúng: Wi-Fi trang khách "hỏi lễ tân" (V5-58), mở lại link sau "Bổ sung tại quầy" (V5-5A), sale và CTV không gửi link;</li><li><b>sửa thêm (PO 06/11 tối):</b> câu "đơn giữ chỗ cũng hiện nút <b>Tạo link check-in online</b>, Desk luôn từ chối" <b>sai từ v1.0.4</b>. BUG-R3-047 đã sửa (`5539b7e6`): Desk chỉ hiện mục link cho đơn đã xác nhận. Chỗ còn câu này: sổ tay 2.4, 2.9 (khung đầu mục và bước 1), 5.6; `guides/02` 4.5 và 17.3; `guides/05` 4.2 (dòng "Khung đơn giữ chỗ hiện…"; sale, CTV không thấy mục link). Thay bằng "đơn giữ chỗ chưa có link: xác nhận cọc trước";</li><li>gộp #69 (đang xung đột với `main`, cùng 7 tệp) rồi đánh số bản sổ tay và bộ hướng dẫn; báo PO số bản để ghi release notes (V5-01);</li><li>PO: `staff-one-pager.md` Tờ 1 (thêm khối check-in online theo sổ tay 2.9 và SEC N4–N6), Tờ 2a (bỏ khối tạm dừng, bỏ các câu giữ chỗ v1.0.4 đã làm sai), `day-one-guide.md` mục 10 (dòng check-in ghi "hết hiệu lực từ 06/11"). Đã làm tối 06/11. Chờ DOM (phần giữ chỗ), SEC đọc lại. <b>INV in lại Tờ 1 và Tờ 2a</b> sau khi đội báo đọc xong, gỡ bản cũ cùng lúc.</li></ul>Điều kiện SEC N5 đã có: check-in online mở lại 06/11 14:22.<br>**Tình trạng 06/11 tối:** BA đã sửa chữ (`4d25f5b7`, ghi "chưa đánh số bản"); PO đã sửa tờ dán quầy và hướng dẫn ngày D. SEC duyệt có điều kiện (`rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md`):<ul><li>"gửi nhầm người" thêm ghi sổ giao ca và báo chủ đầu tư trong ngày ở sổ tay 2.9, `guides/02` 17.3, `guides/01` 14.1 (FB-R5-SEC-BA-01, Major, hạn **08/11**);</li><li>Tờ 1: PO đã sửa FB-R5-SEC-PO-01, 02, 03; in sau khi SEC đọc lại dòng "Gửi nhầm người". Tờ 2a: SEC cho in; DOM ĐẠT CÓ ĐIỀU KIỆN (`rounds/round-05/reviews/DOM-on-staff-one-pager-2a.md`), PO đã sửa FB-R5-DOM-PO-01…06 tối 06/11, rồi áp nguyên văn "bản gộp" thẻ DOM-PO-07 và câu SEC PO-04 lúc khuya: Tờ 2a in được (DOM không cần đọc lại; ORC grep câu SEC để đóng PO-04). Tờ 1 dòng "Cọc" đổi theo DOM-02, SEC đọc lại dòng này.</li></ul>Còn: BA-01, dòng "sửa thêm", gộp #69, DOM đọc Tờ 2a. HTML sổ tay dựng lại ở V5-04. | BA, PO → SEC, UXD, DOM (tờ dán quầy) | 10/11 (hết Gói 0). `grep -n "tạm dừng\|chưa gửi link"` trong `product/docs/manual/` chỉ còn câu đúng sự thật; không còn câu "đơn giữ chỗ cũng hiện nút link"; #69 gộp hoặc đóng kèm lý do; INV đã in lại Tờ 1, Tờ 2a |

### Gói 1 – Tiền và trả phòng ở quầy (bắt buộc)

| ID | Việc | Nguồn | Vai (làm → review) |
|---|---|---|---|
| V5-10 | Khách đi trước 06:00:<ul><li>nút **Trả phòng** có từ 00:00 cho khách đi đúng ngày;</li><li>Desk gửi **một** `checkoutAt` dùng chung cho bản tóm tắt, VietQR và Trả phòng;</li><li>ghi được giờ khách rời thật;</li><li>trang không chỉ sang Trả sớm khi đọc tóm tắt lỗi vào ngày trước ngày đi.</li></ul> | BUG-R4-036, BUG-R4-051, FB-R4-ARC-FE-P432-04 | ARC (luật, hợp đồng) → BE + FE-A → ARC, DOM, QA |
| V5-11 | Trả sớm lúc 00:00–05:59:<ul><li>Desk đặt sẵn ngày lịch;</li><li>máy chủ chặn ngày hôm trước bằng 409 (RN-05);</li><li>B16 không hoàn đêm khách đã ở;</li><li>phí hủy và phí không đến ghi theo ngày nghiệp vụ;</li><li>oracle BR-428 có ca sau nửa đêm.</li></ul> | RN-05, FB-R4-ARC-DOM-B16-01, BUG-R3-036 | DOM (luật) → BE + FE-A → ARC, DOM, QA |
| V5-12 | Bước Bill: **Tổng cộng** gồm đêm thêm sắp ghi. | BUG-R4-052 | FE-A → UXD, QA |
| V5-13 | Trang Trả phòng và folio hiện **tổng đang chờ hoàn** của đơn, kể cả yêu cầu do người khác tạo:<ul><li>`openRefunds` theo ARC hướng (b), hợp đồng 0.3.13;</li><li>số chờ hoàn trên khung đơn (UXD U4);</li><li>lỗi đọc không trông giống "không có khoản chờ hoàn";</li><li>mock đúng phạm vi máy chủ.</li></ul> | Release notes v1.0.4 "Chưa có", FB-R4-UXD-FE-P432-03, FB-R4-ARC-FE-P432-02 | ARC → BE → FE-A/FE-B → ARC, SEC, UXD, QA |
| V5-14 | **Giữ chỗ theo đúng giá đã gõ.** Ô giá khóa trong lúc lệnh giữ chỗ đang chạy. | BUG-R4-041 phần còn lại, FB-R4-ARC-FE-PR75-01 | ARC → BE + FE-A → DOM, QA |
| V5-15 | **Trả phòng** nhận đơn quá ngày đi với ngày rời thật. Nút **Cần dọn** ở Desk và app nhân viên. | Release notes v1.0.4 "Chưa có" | ARC → BE + FE-A + MOB → DOM, QA |
| V5-16 | Lễ tân bỏ hoặc giảm về 0 dòng phát sinh mà không qua duyệt (**Major**):<ul><li>DOM đã chọn (a) của SEC, thêm phần báo cáo của (b) → <b>BR-438</b> (`rounds/round-05/outputs/DOM/rules-v1.0.5.md` 3.1, 7.2): lễ tân, lễ tân trưởng chỉ sửa giảm thẳng dòng mình nhập tay trong ngày nghiệp vụ; mọi ca khác đi <b>Gửi miễn có duyệt</b> (FOC);</li><li>ARC đã thiết kế ở 0.3.13 mục 1.20: 403 kèm `requiredFlow: foc_request`, `reductionsOnly`, lý do FOC `entered_in_error`, `lineReductions[]`; không migration;</li><li>kèm bộ lọc tuần cho quản lý.</li><li><b>Story US-177</b> (backlog, AC1–AC10; quyết định 24; AC10: bill khách chỉ in "Miễn phí" cho dòng miễn lý do Ghi nhầm). Máy chủ: bộ lọc `reductionsOnly` ở PR-B1, phần chặn ở PR-B2 (BE-B, sau PR-B1). Ca QA: DOM T-16-1…10, ARC T16-6…12. Danh sách đóng ca `lineReductions[]` không kịp thì v1.0.6, không chặn nghiệm thu (DOM 7.2 ý 4).</li></ul> | FB-R4-SEC-BE-A31-01 | DOM → ARC → BE + FE-A → SEC, DOM, QA |
| V5-17 | Cờ `is_complimentary` theo tiền, không theo kênh. Tính lại dữ liệu trước báo cáo giá phòng bình quân (ADR) đầu tiên. Chạy mốc "trước" của gói chỉ đọc. | BUG-R4-043, FB-R4-SEC-OPS-ROPACK-06 | DATA + BE → ARC, SEC, QA |
| V5-18 | Khi chấp nhận cọc thiếu sau hạn, hộp thoại nói rõ phần tiền chưa đối soát. | FB-R4-SEC-FE-HOLDS-03 | ARC (trường đọc) → FE-B → SEC, UXD |
| V5-1A | **Bỏ đường tạm "giá đêm = giá tháng ÷ 12"** (BR-101 (5) hẹn bỏ "tới v1.0.1"):<ul><li>API đổi giá căn **bắt buộc** gửi giá đêm (thiếu → 422);</li><li>`createRoom` và công cụ nhập danh mục căn nhận giá đêm;</li><li>ví dụ trong OpenAPI ghi đủ hai giá (hợp đồng 0.3.13).</li></ul>Desk không đi đường này. Nhưng gọi API thẳng mà quên giá đêm thì giá sai không cảnh báo, và web cùng Desk hiện số sai.<br>Làm ngay ở Gói 0 (07–08/11), không chờ bản:<ul><li>DOM sửa mục `night_from_month_divisor` trong từ điển tham số (`.md` và `.json`): khóa còn dùng ở đường API, không sửa giá trị 12;</li><li>DOM sửa câu "tới v1.0.1" ở BR-101 (5);</li><li>tới khi gỡ, script của ORC/OPS luôn gửi đủ hai giá và đọc lại giá sau khi ghi.</li></ul>SEC 06/11: không phải lỗi bảo mật. Hai ràng buộc khi gỡ: giữ `money ≥ 1` và `CHECK > 0`; thiếu giá đêm trả 422, không trả 500. Nếu bootstrap hay công cụ nhập danh mục tạo căn chưa có giá thì kiểm tĩnh V5-73 phải có trước. | BUG-R4-057 | ARC (hợp đồng) → BE → DOM, SEC, QA; DOM (từ điển) → BA |
| V5-1B | **Tin "Giữ chỗ chưa cọc đã hết hạn và tự hủy" (`hold_expired`) gửi thêm mọi lễ tân, lễ tân trưởng đang hoạt động**, như tin `hold_overdue_with_deposit`. Bỏ nhánh "chỉ gửi lễ tân khi không có người tạo, người chốt".<ul><li>Lý do: ở v1.0.x sale, CTV không có chỗ nào nhận tin, nên giữ chỗ do họ tạo mà tự hủy thì không ai báo khách (BR-312).</li><li>Chỗ sửa: `product/services/api/src/modules/reservations/internal/hold-notices.ts`, `HOLD_NOTICE_ROLES.hold_expired` = `front_desk`, `front_desk_lead`; giữ khóa chống trùng theo đơn.</li><li>Test (QA): giữ chỗ do sale tạo, chưa cọc, tới hạn → mỗi lễ tân, lễ tân trưởng đang hoạt động có đúng một tin; nhịp sau không có tin thứ hai; giữ chỗ có cọc một phần vẫn đi tin `hold_overdue_with_deposit` như cũ.</li><li><b>Không migration, không đổi hợp đồng</b> (kind đã có), nên không vướng QC R4 ĐK-2.</li><li>Khi lên: BA sửa sổ tay 2.4 (V5-71); PO đổi Tờ 2a sang dựa hộp Thông báo. Tới đó Tờ 2a rà theo mã đơn (FB-R5-DOM-PO-07).</li></ul>Bắt buộc (PO 06/11 khuya, quyết định 16). Hạn 14/11. | DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 9 (luật A.5 sửa); FB-R5-DOM-PO-07 | BE → DOM, QA |

### Gói 2 – Chữ và tham số theo bảng giá 01/11 (bắt buộc)

UXD duyệt mọi chữ. CPY duyệt chữ hướng khách (EN dẫn, VI hỗ trợ, RU/KO/ZH theo bảng đã duyệt).

| ID | Việc | Nguồn | Vai |
|---|---|---|---|
| V5-20 | Bỏ chữ theo mức cũ:<ul><li>"Từ 28 đêm…" (`field.LONG_STAY_REQUIRES_CONTRACT`, `bk.long_body`, `stay.long_hint`);</li><li>"trước giảm theo số đêm";</li><li>nhãn `bk.src_weekend` "+15 %";</li><li>`sale.nights_all`.</li></ul>Báo giá không tách đêm thứ Sáu, thứ Bảy. Đổi số người thì bảng tổng tính lại. | H10, FB-R4-UXD-FE-PR82-02, FB-R4-ARC-FE-PR82-02 | UXD → FE-A → DOM, UXD, QA |
| V5-21 | **Tham số trên Desk:**<ul><li>tên tiếng Việt cho các khóa còn hiện mã. Ưu tiên khóa INV phải chỉnh: B2–B11 của hướng dẫn chuyển giá, `rounding.*`, `early_checkin_tiers`; lấy tên từ từ điển;</li><li>câu "nằm ngoài khoảng" cho giá trị dạng chữ;</li><li>`ota_base_rate`: hiện tên và câu "Không cần nhập – đơn OTA lấy giá đêm niêm yết". **Không làm trình nhập theo nhóm căn** (quyết định PO, mục 6).</li></ul> | H10 (`params.k.*`), backlog 5.6b, việc ORC 06/11 (`ota_base_rate`) | UXD → FE-A → DOM, UXD |
| V5-22 | Hộp **Đặt phòng mới**:<ul><li>câu giá ngoài sàn–trần có số thật;</li><li>ô OTA để trống nói rõ hệ quả;</li><li>không hiện "0 đ" khi máy chủ sẽ tính theo lịch giá;</li><li>phần còn lại của UXD-FE-PR70-02, nếu UXD thấy còn.</li></ul> | BUG-R4-040, FB-R4-UXD-FE-PR70-03/04/06 | ARC (trường `min`/`max`) → BE + FE-A → UXD, QA |
| V5-23 | **Một lượt sửa chữ sai sự thật** (gom các chỗ dưới đây):<ul><li>phí trả sớm báo trong ngày rời (FB-R4-DOM-UXD-PR89-02);</li><li>BUG-R2-094, 096, 098, 100;</li><li>BUG-R2-218 (trang khách);</li><li>BUG-R3-028, 035, 051, 055;</li><li>`folio.adjust_night_help_internal`;</li><li>khóa chung `error.INVALID_TRANSITION_generic`;</li><li>đơn vị tiền trong `error.DEPOSIT_INSUFFICIENT` (UXD P440-06);</li><li>hộp xanh "Gửi mã QR…" khi chưa cài tài khoản nhận;</li><li>U+2011 cho "2-step" (CPY P401-11);</li><li>câu mục đích xử lý dữ liệu cạnh ô email nhân viên (FB-R4-SEC-ARC-EM-13, Nghị định 13);</li><li>câu "Bạn nhận (…)" đủ đuôi cho CTV và sale (FB-R4-UXD-BA-PR89-01);</li><li>UXD dọn câu cũ `rooms.night_auto` ở `design/content-guide.md` dòng 1335 và khóa thừa `fo.tabs.holds` ở `gen_strings.py` (ghi chú QA bug list v1.0.4);</li><li>3 khóa Desk UXD phát hiện thêm (`rounds/round-05/outputs/UXD/copy-v1.0.5.md` mục 4.19; PO đưa vào 06/11 tối, quyết định 12): `fo.rack.empty_body` (viết cứng "10 căn"), `desk_code.channel_off` và `error.DELIVERY_CHANNEL_DISABLED` (chỉ tới "Tham số › Kênh gửi mã", chỗ không có trên Desk).</li><li>chữ khách theo CPY review (`rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md`; PO chốt 06/11 tối, quyết định 15):<ul><li><b>bắt buộc</b> – thẻ 02 (a): "căn" → "phòng" ở `sale.quote_text` VI dòng 2, `gw.req.clean_makeup_free`, `gw.req.clean_second_fee`, cùng lượt sinh lại `quote-copy.ts`. Sổ tay trích báo giá mẫu thì BA sửa cùng bản (V5-71);</li><li><b>nên có, không chặn QC</b> – mẫu tin `msg.*` cùng lượt C5: thẻ 02 (b), 06, 07 (gồm `guest.late.done_title`), 08. Chỉ đổi chuỗi; chưa có mã nào gọi các mẫu này. Không kịp thì chuyển US-125 (B-SAU).</li></ul></li></ul> | các nguồn ghi trong cột Việc | UXD (+ CPY chữ khách) → FE-A/FE-B/MOB → UXD, QA |
| V5-24 | **Tiếng Nga:**<ul><li>7 chuỗi hướng khách có từ cấm "апартаменты" (CPY);</li><li>font chữ Nga ở ô mã và Wi-Fi bị CSP chặn.</li></ul>Chuỗi nằm trong bản thông báo dữ liệu thì để tới bản thông báo kế tiếp (backlog B-PN). | decision-log 04/11, BUG-R4-017 | CPY → FE-B/MOB → SEC (font, CSP), UXD |
| V5-25 | **P1 – Tham số `min_stay` (ở tối thiểu) và `weekend_nights` (đêm cuối tuần): bộ kiểm khi lưu khớp bộ tính giá** (BE-C, một PR riêng; quyết định 13, mở rộng ở quyết định 19). Mã lỗi: **BUG-R5-003** (P1) và **BUG-R5-001** (P2), `rounds/round-05/qa/bug-list.md`; thẻ BE `FB-R5-BE-ARC-C0313-06` (Major) và `-18`.<ul><li><b>`min_stay`:</b> bộ kiểm (`parameter-rules.ts` 243–254) cho qua `2`, `{"nights":2}`, `[{"nights":0}]`, trong khi bộ tính giá cần danh sách luật (`MinStayRule[]`). Lưu `2` cho hôm nay thì báo giá (FD, sale), giá ước tính web khách và tạo đơn trực tiếp đều trả 500, kéo tới mốc đổi ngày nghiệp vụ: lưu lại giá trị đúng → 422, hủy dòng hôm nay → 409. Production hiện đúng dạng (ORC kiểm chỉ đọc 06/11), nên lỗi chưa xảy ra.</li><li><b>`weekend_nights`:</b> bộ kiểm (dòng 180–187) chỉ nhận số 1–7; giá trị đang chạy, `production-defaults.ts` và hai bộ tính giá dùng mã thứ `["FRI","SAT"]`. Lưu đúng dạng đang chạy → 422; lưu dạng số thì bộ tính giá không còn nhận ra đêm cuối tuần. Hiện chưa sai tiền vì `weekend_uplift_pct` = 0 %.</li><li><b>Luật kiểm:</b> `weekend_nights` theo DOM `rules-v1.0.5.md` mục 8.4 (mã thứ `MON`…`SUN`, không trùng, ít nhất 1). `min_stay` <b>theo DOM `rules-v1.0.5.md` mục 12.1–12.3</b> (`e9e0e2e4`): dạng bắt buộc của từng luật (12.1), nghĩa và lý do từng điểm, gồm `[]` được lưu và nghĩa là không có ở tối thiểu (12.2), đọc phòng thủ ở ba chỗ gọi `minStayNights` (12.3). Gồm cả <b>chiều ngược ở `short_stay_max_nights`</b>: lưu `short_stay_max_nights` nhỏ hơn `nights` lớn nhất của `min_stay` đang hiệu lực → 422 (12.2). PO không tự đặt luật.</li><li><b>Rà thêm cùng PR</b> (thẻ BE 06 đề xuất 5, QA BUG-R5-003 (f); `short_stay_max_nights` đã nằm trong phần chiều ngược ở trên): các khóa có cấu trúc mà báo giá, tạo đơn, giá ước tính web, nhận phòng hoặc trả phòng đọc (ví dụ `los_discount`, `special_dates`, `cancel_policy_direct`, `early_checkin_tiers`, `late_checkout_tiers`). BE ghi danh sách đủ trong mô tả PR. Khóa nào lưu sai dạng làm các đường đó trả 500 thì sửa trong PR này, cùng tiêu chí. Phần rà làm PR vượt khoảng 2 ngày BE thì BE báo PO; PO giữ các khóa chủ đầu tư sắp chỉnh (B3 `los_discount`, B7 `early_checkin_tiers`, `special_dates`), phần còn lại sang R5-B-05.</li><li><b>Tiêu chí nghiệm thu:</b><ol><li>Lưu sai dạng (số, đối tượng, phần tử hỏng, mã thứ lạ hoặc trùng, `nights` ngoài khoảng DOM chốt) → 422 `PARAM_OUT_OF_RANGE`, giá trị đang hiệu lực không đổi. Câu báo trên Desk nói đúng dạng phải nhập và <b>không dẫn người dùng tới dạng sai</b> (như câu "Chọn một trong: 1, 2, …, 7" ở BUG-R5-001 bước 2). Chữ do UXD viết trong V5-21 (câu "nằm ngoài khoảng" cho giá trị dạng chữ); FE-A hiện được `allowed` dạng chữ.</li><li><b>Giá trị đang chạy trên production vẫn hợp lệ:</b> lưu lại nguyên giá trị đang hiệu lực (`min_stay` danh sách 2 luật; `weekend_nights` = `["FRI","SAT"]`) → 200. Trước khi lên production, ORC đọc chỉ đọc giá trị đang hiệu lực <b>và các dòng đã hẹn</b> của mọi khóa trong PR, cho chạy qua bộ kiểm mới (BE đưa sẵn lệnh kiểm): phải nhận hết. Có giá trị không nhận → dừng, báo PO và ARC; đội không tự sửa tham số trên production (nguyên tắc 4).</li><li><b>Gỡ một giá trị sai đã có hiệu lực hôm nay:</b> PO quyết <b>bộ kiểm khi lưu cộng đọc phòng thủ là đủ, không thêm đường sửa trong ngày ở v1.0.5</b> (lý do ở quyết định 19). Đo bằng: giá trị hỏng chèn thẳng vào DB thử (bỏ qua bộ kiểm) thì báo giá, tạo đơn trực tiếp và giá ước tính web <b>không trả 500</b>, máy chủ ghi một cảnh báo; cách áp luật lúc đó theo DOM 12.3: giá trị không phải mảng thì coi như không có luật; phần tử hỏng thì bỏ phần tử đó, các phần tử đúng vẫn áp; log một lần cho mỗi giá trị. Giá trị đúng lưu cho ngày mai thay vào lúc đổi ngày nghiệp vụ, như hiện nay.</li><li>Báo giá sau khi lưu: `weekend_nights` = `["FRI","SAT"]` với mức tăng thử > 0 thì đêm thứ Sáu, thứ Bảy có mức tăng; `min_stay` đổi `nights` 2 → 3 thì báo giá đến thứ Sáu 2 đêm → 422 `MIN_STAY_NOT_MET`.</li><li>Test: QA BUG-R5-001 (a)–(d), BUG-R5-003 (a)–(f) (ca (a) thêm phần tử thiếu `channels`, `channels` có `internal` → 422, theo DOM 12.6); oracle <b>`BR-113-06` … `BR-113-30`</b> ở `product/tests/fixtures/br-examples.json` (DOM 12.6, `pendingFix: BUG-R5-003`, gồm ca 28 chiều ngược và ca 29–30 đọc phòng thủ); sửa ca `[5, 6]` ở `be-b-units.test.ts`.</li></ol></li><li><b>Hợp đồng:</b> không đổi schema (thẻ BE 18). ARC thêm dòng mô tả `setParameter` cho `min_stay` và `weekend_nights` (thẻ BE 06 đề xuất 3, thẻ 18 đề xuất 2) vào PR-0 hoặc PR bổ sung; PR V5-25 <b>không chờ</b> dòng này. ARC sửa `erd.md` 9.1a nếu cần.</li><li><b>Tình trạng 06/11 khuya:</b> BE-C đã mở <b>PR #96</b> (nhánh `r5-v5-25`), CI xanh, <b>chờ ARC, DOM, SEC review</b>. Mục tiêu gộp <b>10/11</b> giữ nguyên. PR rà các khóa có cấu trúc trên đường báo giá, tạo đơn, web, nhận và trả phòng (PR #96 mục 2): thêm bộ kiểm khi lưu cho `special_dates`, `los_discount`, `cancel_policy_direct`, `early_checkin_tiers`, `late_checkout_tiers`, `early_departure_refund`, `checkout_reminders`, `weekend_uplift_channels`, `special_uplift_channels`, `max_open_holds_per_user`, `lease_terms` (tối thiểu); chỉ `min_stay` có đọc phòng thủ (DOM 12.3). Câu SQL chỉ đọc `services/api/scripts/v5-25-parameter-shape-check.sql` do ORC chạy (tiêu chí 2). Khóa chưa có bộ kiểm hay đọc phòng thủ vào R5-B-05.</li><li><b>`damage_catalog` – PO đề nghị kéo vào V5-25, ORC quyết:</b> khóa đọc ở bill (`bill.service.ts` `catalogNames`); một phần tử `null` làm bill báo lỗi 500 cho mọi đơn tới hết ngày nghiệp vụ, không gỡ được trong ngày, cùng loại với BUG-R5-003. Theo quyết định 19 (khóa trên đường trả phòng rà cùng PR) và điều kiện của R5-B-05 (làm luồng quầy chính trả 500 thì vào bản gần nhất), PO đề nghị thêm đọc phòng thủ (bỏ phần tử không phải đối tượng) và bộ kiểm khi lưu, trong PR #96 hoặc PR nhỏ ngay sau ở BE-C, không migration, không đổi hợp đồng. QA ghi lỗi và mức. Tới đó: lời dặn tạm ở release notes v1.0.4. Hiện ghi ở R5-B-05 theo ORC.</li><li><b>Làn và hạn:</b> BE-C, việc đầu tiên của làn, bắt đầu 07/11, trước PR-C1 (PR-C1 còn chờ V5-73). Mục tiêu gộp <b>10/11</b>, QA test lại trên staging ngay sau. Không migration. Theo đề nghị BE (review 0.3.13 mục 4), PR-H1 không xếp ở làn BE-C để làn này kịp 14/11; ORC chọn người.</li><li><b>Tới khi lên:</b> không ai lưu ô `min_stay`, `weekend_nights` và các ô dạng danh sách có trong danh sách đội đã rà (gồm `damage_catalog`); buộc phải đổi thì nhắn đội trước, Hiệu lực từ ngày mai (release notes v1.0.4, "Giới hạn đã biết"). Buộc phải đổi thì theo cách làm tạm ở BUG-R5-003.</li></ul> | BUG-R5-003, BUG-R5-001; thẻ BE `FB-R5-BE-ARC-C0313-06`, `-18`; báo cáo UXD Round 5 mục 4 ý R5; ORC kiểm mã và production 06/11 | ARC (dòng mô tả, không chặn) → BE-C → DOM, QA; UXD + FE-A (câu báo, trong V5-21) |

### Gói 3 – Việc có hạn cứng (bắt buộc)

| ID | Việc | Hạn | Vai |
|---|---|---|---|
| V5-30 | **H2 – hoa hồng theo bảng nội bộ** trên Desk, không có số mặc định trong mã:<ul><li>FB-R4-SEC-BE-01 (Major);</li><li>FB-R4-SEC-ORC-01 G3;</li><li>CI `confidential-paths`.</li></ul>DOM gửi chi tiết **ngoài kho mã**. Không ghi tỷ lệ hay số tiền hoa hồng vào repo, PR, test, chat. | Trước kỳ chốt hoa hồng **01/12/2026** | DOM → ARC → BE + FE-A → SEC, DOM, QA |
| V5-31 | **H3 – phí dọn theo lượt cho khách thuê tháng theo hạng** (bảng 01/11). Khách ngắn ngày giữ BR-506. Tới khi lên: lễ tân thêm dòng phí phần chênh. | Trước lượt dọn đầu tiên của khách thuê tháng đầu tiên | DOM → BE + FE-A → DOM, QA |

Quy tắc: nếu tới **25/11** v1.0.5 chưa lên production thì PO + ORC tách V5-30 thành bản sửa riêng. Việc này không cần hỏi INV; production vẫn chờ INV đồng ý. Bản tách có migration nên cũng phải chờ V5-61 đạt (ĐK-2): quy tắc này chỉ giúp khi v1.0.5 trễ vì lý do khác.

**Khi chưa diễn tập khôi phục (QC R4 ĐK-2; quyết định 17, sửa ở quyết định 25 theo SEC FB-R5-SEC-OPS-95-02 ý 4):**
- **V5-61 chưa đạt thì v1.0.5 chưa lên production, kể cả phần không migration.** Phần không migration vẫn có V5-62 (`backup.sh` mới, vòng xoay mới, timer W1), tức là đổi sao lưu, nên vẫn vướng ĐK-2. V5-62 cùng bundle với bản nên khó tách; SEC và OPS cùng chọn làm V5-61 trước, không tách V5-62.
- Bỏ phương án cũ "tách migration V5-30, V5-31 ra, phần không migration vẫn lên": tách ra không giúp bản lên sớm hơn.
- Hạn **01/12** của V5-30, V5-31 vì vậy **phụ thuộc hoàn toàn vào V5-61**. Tới khi lên: hoa hồng thuê tháng và thưởng quản lý tính ngoài Desk theo bảng nội bộ (DOM); phí dọn thuê tháng: lễ tân thêm dòng phí phần chênh, như dòng V5-31.
- **Kéo diễn tập sớm:** ORC xin INV hẹn V5-61 trong **tuần 09–13/11** (30 phút mở khóa `age`), không chờ hạn 20/11 của ĐK-2. Mốc 25/11 giữ nguyên: diễn tập vẫn chưa xong thì ORC báo INV ngay, vì đây là đường duy nhất để giữ hạn 01/12.
- Bản sửa P0 không migration, không đổi sao lưu vẫn lên được, kèm sao lưu ngay trước deploy (câu cuối dòng ĐK-2). Bản đó cắt từ v1.0.4, không mang V5-62.
- Runbook v1.0.5 (#95, OPS `40e31795`) đã có ô "V5-61 ĐẠT" ở P0: được chạy trước V5-61 là Đợt A (staging) và W0, W5 production; chỉ chạy sau V5-61 là Đợt C (P2b production, W1, W2, W6, W7) rồi P3–P5.

### Gói 4 – Bảo mật nhỏ đã hẹn (bắt buộc)

| ID | Việc | Nguồn | Vai |
|---|---|---|---|
| V5-40 | Desk ép **lễ tân trưởng** bật 2 bước (`front_desk_lead` vào `MFA_REQUIRED_ROLES`). BA sửa dòng Lễ tân ở `02` 1.7. | Release notes v1.0.4 "Chưa có", FB-R4-PO-BA-032-07 | BE-A + FE-A → SEC, DOM; BA |
| V5-41 | **Nâng gói gửi thư `nodemailer` lên ≥ 10.1.7** (6 cảnh báo Dependabot #4–#6, #15–#17 = 3 advisory `addressparser` × 2 manifest). Tiêu chí nghiệm thu (SEC `rounds/round-05/outputs/SEC/dependabot-triage.md` mục 2.3):<ol><li>ghim đúng bản 10.x mới nhất (≥ 10.1.7; hiện 10.3.1, đủ 2 tuần tuổi vào 12/11) ở `product/integrations/package.json`, không thêm `pnpm.overrides`;</li><li>sinh lại lockfile chỉ cho gói này;</li><li>chạy `smtp.test.ts` và `infra/server/test/mail-test-send.test.sh`;</li><li>`mapSmtpError` không log `err.permanent` hay `info.serverMessageId` nếu chúng chứa địa chỉ;</li><li>chạy `mail-test` qua relay staging trước khi phát hành (10.1.x đổi cách chạy phiên SMTP);</li><li>đóng PR Dependabot #9 và #11 (ghim 10.1.4);</li><li>sau khi gộp, 6 cảnh báo chuyển `fixed`.</li></ol>Không dismiss cảnh báo trên GitHub. Nếu v1.0.5 trễ quá **20/11**, ORC báo SEC xem lại. | SEC (release notes v1.0.4 ghi chú kỹ thuật; SEC phân loại Dependabot 06/11) | INT/BE → SEC |
| V5-42 | Worker không ghi `err.message`. | FB-R4-SEC-BE-BED-02, BED-03 | BE-D → SEC |
| V5-43 | Siết `serializeSchema('Me')`. Gồm V104-07. Controller ghi `action` cho thư đổi tài khoản nhận (V104-08 phần còn lại). | FB-R4-SEC-BE-C0312-02, V104-07, V104-08 | BE-A → SEC, ARC |
| V5-44 | Sửa hai chỗ phụ thuộc chữ máy chủ:<ul><li>thay dò chữ `detail` của 409 bằng trường hợp đồng (P4-41);</li><li>ánh xạ `check_violation` của trigger 0094 về 409 (ARC P411-02).</li></ul> | decision-log 04/11 | ARC → BE + FE-A → ARC, QA |
| V5-45 | Nới giới hạn `id_image_retention_days_after_checkout` để INV đặt được **90 ngày** (ý INV 26/10). SEC duyệt. INV tự đặt sau khi lên. | Từ điển tham số mục cuối; backlog 5.6 | BE → SEC, DOM |
| V5-46 | Trang khách hiện câu báo khi chặn số giấy tờ (`ID_NUMBER_DETECTED`), như với số thẻ. Check-in online đã mở lại 06/11. | FB-R4-SEC-ARC-P104-03 | ARC → MOB/FE-B → SEC, CPY |
| V5-47 | Tờ in và trang khách tự so chữ khi build, để không lệch nhau. | FB-R4-PO-UXD-IDS2-02, SEC IDS2-01 | UXD + OPS → SEC, PO |
| V5-48 | **Luật máy chủ cho khoản thu trên đơn đã đóng** (`cancelled`, `no_show`), **bắt buộc**, không migration (SEC kết luận (b), `rounds/round-05/reviews/SEC-on-bug-r5-002.md` mục 3.1; thẻ FB-R5-SEC-PO-B002-05, Major; quyết định 22). Đây là phần luật máy chủ ở bước (1) của V5-5B (DOM 11.4 mục 2 (a)–(d)), cộng chặn hai thao tác không đi qua `recordPayment`. Áp cho <b>mọi vai, kể cả OWN</b>; đọc trạng thái đơn dưới khóa đơn sẵn có.<ul><li><b>`recordPayment`:</b> chỉ nhận `bank_transfer`, `vietqr`; tiền mặt, `card_pos`, `ota_collect` → 422. Thiếu ảnh `deposit_receipt` của đúng đơn → 422. Khoản thu luôn `pending` (chờ đối soát). Giữ luật đang có: ghi chú từ 3 ký tự, khung Giờ nhận tiền. Sale, CTV vẫn bị chặn như hiện nay. Nhật ký `payment.recorded` thêm `reservationStatus` và `afterClosure: true`, không thêm dữ liệu khách.</li><li><b>`confirmPaymentReceived`</b> với QR còn chờ của đơn đã đóng → 409, mọi vai. Tiền khách trả theo QR đó ghi bằng `recordPayment` theo luật trên.</li><li><b>`createVietQr`</b> trên đơn đã đóng → 409, mọi mục đích, kể cả có `overBalanceReason`.</li><li><b>Lỗi thì không ghi gì:</b> không dòng khoản thu, không nhật ký, folio không đổi version, ảnh không bị gắn. Thứ tự kiểm: vai → phạm vi → luật đơn đã đóng → luật còn lại.</li><li>Không đụng: thu ở nhận phòng, trả phòng (gọi thẳng `recordInTx`), xác nhận cọc đơn `hold`, J24, `createRefundRequest`, chi hoàn, `reversePayment` (MGR+ vẫn đảo được khoản ghi nhầm).</li><li><b>Không gồm</b> (ở lại V5-5B-1, nên có): tự tạo yêu cầu hoàn, nút ghi trên Desk, `deposit_after_cancel`.</li><li>Mã lỗi ARC đã chốt ở 0.3.13 mục 1.21 ý 2: phương thức khác chuyển khoản, VietQR → 422 `VALIDATION_FAILED` (`method`, `NOT_IN_LIST`); thiếu ảnh → 422 `REQUIRED` (`attachmentId`); ảnh đã gắn vào tin báo của sale → 422 `NOT_IN_LIST`; `confirmPaymentReceived`, `createVietQr` → 409 `INVALID_TRANSITION` kèm `reservationStatus`; `Payment.afterClosure`. FE-A: hộp Xác nhận cọc hiện câu rõ nghĩa khi gặp 409 này (ví dụ "Đơn đã hủy. Làm theo Tờ 2a."), UXD chốt chữ theo brand guideline OTTIMO. Nên làm cùng (ARC: không đổi hợp đồng): J1, B5, B10, B11 cho QR `pending` của đơn hết hạn ngay khi hủy.</li><li><b>Tiêu chí nghiệm thu:</b> ca (h1)–(h5) của thẻ FB-R5-SEC-QA-B002-06, trên đơn `cancelled` (`hold_expired` và một lý do khác) và `no_show`; lỗi thì kiểm không có dòng khoản thu, không nhật ký, version folio không đổi.</li><li><b>Làn:</b> BE-B, <b>trong PR-B1</b> (hợp đồng 0.3.13 mục 2). PR-B1 trễ, hoặc PR-B3 cần nền sớm, thì tách V5-48 thành PR riêng gộp trước, không chờ phần khác (quyết định 23). Không chờ V5-5B-1. 5B-1 về sau dùng đúng nhánh này, không nới luật.</li><li><b>Tới khi lên production:</b> người duyệt hoàn theo lời dặn tạm SEC 3.3 (release notes v1.0.4, "Giới hạn đã biết"; ORC đưa lên trang bàn giao của chủ đầu tư). ORC xin INV cho chạy câu đếm chỉ đọc SEC mục 5, trước 10/11 nếu được. BA chỉ thêm lời dặn vào `guides/01` (phần duyệt hoàn) nếu có lần sửa sổ tay trước khi v1.0.5 lên; không thì bỏ, vì V5-71 sẽ gỡ cùng lúc.</li></ul> | SEC `SEC-on-bug-r5-002.md` mục 3.1, 3.3, 5; thẻ FB-R5-SEC-PO-B002-05, FB-R5-SEC-QA-B002-06; DOM 11.4 mục 2 | ARC (đã chốt ở 0.3.13) → BE-B + FE-A (câu hộp Xác nhận cọc) + UXD → SEC, DOM, QA |

### Gói 5 – Lỗi nhỏ ở quầy (nên có; không kịp thì sang v1.0.6)

| ID | Việc | Nguồn | Vai |
|---|---|---|---|
| V5-50 | Hộp **Đổi phòng** lọc bỏ căn chưa dọn. Hiện Desk đã chặn khi chọn nhầm. | BUG-R3-023 (P2) | FE-A/BE-A → UXD, QA |
| V5-51 | Hộp **Xác nhận cọc** có ô Mã giao dịch, để cột Chờ đối soát có số (liên quan ESC-039). | BUG-R3-025 | FE-A → UXD, QA |
| V5-52 | Folio ở Trả phòng: dòng miễn bị từ chối không hiện số âm. | BUG-R3-030 | FE-A → UXD |
| V5-53 | Máy chưa cấp quyền: khóa nút **Nhập nơi nhận hoàn**, ghi đúng lý do. (Phần "giữ chỗ không hiện nút link check-in online" của BUG-R3-047 đã có ở v1.0.4, phụ lục I.) | BUG-R3-048 | FE-A → UXD, SEC |
| V5-54 | SĐT nước ngoài hiện đúng nhóm số. Khách web 5 ngôn ngữ nên gặp hằng ngày. | BUG-R3-049 | FE-A → QA |
| V5-55 | Yêu cầu web quá hạn ghi rõ "quá hạn", không chỉ đổi màu viền. | BUG-R3-054 | UXD → FE-A |
| V5-56 | QA tái hiện trên v1.0.4: OWN không thấy **Xóa theo yêu cầu người gửi** ở yêu cầu đã đóng. Tái hiện được thì sửa (nâng P1 nếu OWN không có nút). Không tái hiện được thì đóng, ghi lý do. | BUG-R3-056 (P2) | QA → FE-A → SEC |
| V5-57 | Tìm đơn theo tên khách. | BUG-R2-077 | ARC (API) → BE + FE-A |
| V5-58 | Ô nhập Wi-Fi trên Desk. Release notes v1.0.0 đã hẹn v1.0.4 hoặc v1.0.5. Check-in online đã mở lại nên trang khách cần số đúng. | BUG-R3-021 phần Desk (P2) | ARC → BE + FE-A → SEC, UXD |
| V5-59 | Nút phát sinh ở bước Phụ phí chọn sẵn khoản. Dòng giữ chỗ sắp hết hạn ở **Cần chú ý** có mã đơn. | BUG-R2-082, 217 | FE-A/BE → UXD, QA |
| V5-5A | Trang khách: mở lại link giữa chừng không mất danh sách bổ sung, không 409. | BUG-R3-027 | MOB/FE-B → QA |
| V5-5B | **Ghi tiền khách chuyển về cho đơn đã đóng (`cancelled`, `no_show`), tự tạo yêu cầu hoàn, báo ở "Cần chú ý"; khôi phục giữ chỗ khi còn căn** (BUG-R5-002, P2; DOM `rules-v1.0.5.md` 11.4 bản `e9e0e2e4`; quyết định 16, 20). v1.0.4 không có nút ghi khoản thu hay tạo yêu cầu hoàn trên đơn đã đóng, và không ai được báo khi tiền về (US-085 AC4 vế sau: mục `deposit_after_cancel` đã khai báo, chưa nơi nào tạo). Tiền hoàn ngoài Desk.<ul><li><b>5B-1 – ghi tiền về sau khi đóng đơn, và hoàn</b> (DOM 11.4 mục 1–5). DOM quyết dùng lại `recordPayment`, không làm đường ghi tiền riêng. ARC đã chốt ở 0.3.13 mục 1.21 ý 3 (PR #94, `2cb549cc`): nhánh đơn đã đóng trong `recordPayment`, cùng giao dịch với V5-48, không migration; làm ở <b>PR-B3</b> (quyết định 23).<ul><li><b>Phạm vi:</b> mọi đơn `cancelled`, `no_show`, <b>mọi lý do hủy</b>, không chỉ `hold_expired`.</li><li><b>Luật khoản thu trên đơn đã đóng – nay là V5-48 (Gói 4, bắt buộc, quyết định 22)</b>; 5B-1 dùng đúng nhánh đó, không nới luật (đơn đang mở giữ luật hiện hành): chỉ FD+ (sale, CTV vẫn bị chặn); chỉ chuyển khoản hoặc VietQR (tiền mặt, POS, `ota_collect` → 422); ảnh chứng từ bắt buộc (thiếu → 422); luôn chờ đối soát, MGR+ đối soát theo sao kê (BR-527); Giờ nhận tiền từ lúc tạo đơn tới bây giờ; Ghi chú bắt buộc; không đổi trạng thái đơn, không sinh dòng phí (BR-522 ghi chú 18/10 giữ nguyên). Loại khoản thu `deposit` khi đơn bị hủy lúc còn là giữ chỗ (để 5B-2 dùng lại); đơn khác ARC chốt.</li><li><b>Cùng giao dịch, tự tạo yêu cầu hoàn 100 % số vừa ghi</b>, không phí (BR-308). MGR/OWN duyệt; người ghi không tự duyệt; <b>chỉ chi sau khi khoản thu đã đối soát</b> (BR-522). Đơn đã xác nhận rồi hủy: yêu cầu hoàn theo BR-309 giữ nguyên, khoản mới hoàn đủ riêng.</li><li><b>Một khoản tiền chỉ ghi một lần.</b> Khách muốn đặt lại mà 5B-2 chưa lên: không ghi ở đơn cũ, làm tay như DOM 11.2 trên giữ chỗ mới. Hộp ghi trên Desk nói rõ điều này (UXD viết chữ).</li><li><b>Desk (FE-A):</b> trên khung đơn `cancelled`, `no_show`, FD+ có nút ghi tiền về sau khi hủy; hộp ghi có ô ảnh bắt buộc, chỉ hai phương thức. Không có nút cho sale, CTV.</li><li><b>US-085 AC4 – "Cần chú ý" `deposit_after_cancel`:</b> sinh khi sale, CTV báo "khách đã chuyển" (`createDepositNotice`) trên đơn đã đóng, <b>thay cho 409</b>; người thấy FD, FDL, MGR, OWN; chữ `today.money_after_cancel`. Mục tự đóng khi đơn có khoản thu ghi sau lúc báo (5B-1 hoặc 5B-2), hoặc khi FD+ bấm "Không thấy tiền" kèm ghi chú. Mã trả về cho sale: 202 (ARC 0.3.13). EP02 10.5 ghi "FD/SAL": BA sửa cho khớp.</li><li><b>Tiêu chí SEC cho 5B-1</b> (`SEC-on-bug-r5-002.md` mục 3.2; bắt buộc khi 5B-1 lên, trừ S5):<ul><li>S1: luật V5-48 có sẵn ở máy chủ, mọi vai kể cả OWN.</li><li>S2: yêu cầu hoàn tự tạo đứng tên người ghi, không đứng tên hệ thống; người ghi không duyệt, không chi, kể cả khi yêu cầu bị từ chối rồi người khác tạo lại.</li><li>S3: nơi nhận hoàn là chuyển khoản về đúng tài khoản đã chuyển; chi tiền mặt trên yêu cầu này → lỗi.</li><li>S4: máy chủ biết một khoản đã ghi hai lần. Tối thiểu: màn duyệt hoàn và màn đối soát hiện "Có thể trùng" khi có khoản chuyển khoản, VietQR khác chưa đảo, cùng số tiền, Giờ nhận tiền cách ≤ 24 giờ, ở đơn khác (chỉ hiện mã đơn). Nên có: mã giao dịch ngân hàng trong hộp ghi, trùng mã → 409.</li><li>S5 (nên có): một khoản ≤ tổng tiền phòng đơn cũ; vượt thì chỉ MGR/OWN ghi, kèm lý do.</li><li>S6: cờ "Tiền về sau khi đơn đã đóng" trên màn duyệt hoàn và Nhật ký tiền; bộ lọc tuần cho MGR/OWN.</li><li>S7: tin báo đã chuyển của sale, CTV trên đơn đã đóng chỉ sinh mục `deposit_after_cancel`, không sinh khoản thu; ảnh khách gửi kèm không dùng làm ảnh chứng từ.</li><li>S8: "Không thấy tiền" bắt buộc ghi chú; nhật ký ghi người bấm, giờ bấm; bộ lọc tuần có các mục đóng kiểu này.</li><li>Tin đẩy, nhật ký, log chỉ có mã đơn: không tên khách, số điện thoại, số tài khoản.</li></ul></li><li><b>Hợp đồng 0.3.13 cho 5B-1</b> (ARC): yêu cầu hoàn mã mới `payment_after_cancel`, người ghi vào `origin_actor_ids` (S2); nơi nhận cố định `original_method`, `setRefundDestination` → 409 (S3); `possibleDuplicateCodes` trên `Payment` và `ApprovalRequest`, tính lúc đọc (S4 tối thiểu, bắt buộc khi 5B-1 lên); `bankReference` tùy chọn trong `PaymentCreate`, trùng khoản chưa đảo → 409 `DUPLICATE_BANK_REFERENCE` (S4 nên có); `listAuditEvents.afterClosureOnly` (S6); `createDepositNotice` trên đơn đã đóng → 202 + `deposit_after_cancel` (S7); "Không thấy tiền" = `resolveAttentionEvent` có ghi chú (S8). Ô mã giao dịch ở bước đối soát và luật "một dòng sao kê chỉ khớp một khoản": v1.0.6, tới đó MGR+ áp tay.</li><li>Vai: ARC (đã chốt ở 0.3.13) → BE-D hoặc BE-B (PR-B3) + FE-A + UXD (chữ hộp ghi) → SEC, DOM, QA.</li></ul></li><li><b>5B-2 – khôi phục đơn</b> (DOM 11.4 mục 6–10): lựa chọn <b>Khôi phục giữ chỗ và xác nhận cọc</b> thay cho lối hoàn, cho <b>mọi đơn bị hủy lúc còn là giữ chỗ</b> (J1 `hold_expired` hoặc người bấm Hủy giữ chỗ B5), khi căn cũ còn trống đủ các đêm và chưa qua ngày đến. Cùng mã đơn, cùng căn, cùng giá; đủ cọc → `confirmed`, thiếu → giữ chỗ có cọc một phần đã quá hạn (BR-303). Căn đã bán hoặc đã qua ngày đến → lỗi rõ, không 500, không ghi nửa chừng. ARC đã phác cho hợp đồng 0.3.14 (0.3.13 mục 1.21 ý 4): `recordPayment.restoreHold`, kiểm dưới khóa căn, `room_occupancy_no_overlap` giữ hai thao tác song song; <b>cần migration nhỏ</b> (kind thông báo `reservation_restored_after_cancel`), nên theo QC R4 ĐK-2. <b>Tiêu chí SEC</b> (`SEC-on-bug-r5-002.md` mục 4): FD, FDL, MGR, OWN tự khôi phục khi đủ ba điều kiện DOM (hủy lúc còn là giữ chỗ; căn cũ trống đủ các đêm; chưa qua ngày đến); sale, CTV không được; thiếu một điều kiện thì không ai khôi phục, kể cả OWN, và không có nhánh xin duyệt. Kiểm ở máy chủ dưới khóa căn; chỉ cùng lúc với một khoản thu theo V5-48, trong một giao dịch (ghi khoản thu, khôi phục, xác nhận cọc). Đơn cũ còn yêu cầu hoàn chưa đóng → không khôi phục. Lý do bắt buộc. Audit chuyển trạng thái (người làm, lý do, lý do hủy cũ, hạn giữ chỗ cũ, mã khoản thu); <b>báo OWN và MGR</b> (không gửi người làm), tin chỉ có mã đơn; bộ lọc tuần. Thiếu cọc thì không cho gia hạn thêm. <b>Đích v1.0.6</b> (hợp đồng 0.3.14, sau V5-61).</li><li><b>Lịch và đường cắt 5B-1 (PO 06/11 khuya, quyết định 20, 23):</b> mức <b>nên có</b> (P2, có cách làm tạm trong release notes, QC điều 2), <b>xếp vào v1.0.5 ở PR-B3</b>, vì ARC đã đưa 5B-1 vào 0.3.13 không migration. Ước của PO (BE xác nhận): BE 2,5–3 ngày (bản trước 2–2,5 ngày, cộng S2–S8 và `bankReference`), FE-A 1–1,5 ngày. Phụ thuộc: V5-48 đã gộp. Người làm (ORC xếp): đề nghị <b>BE-D sau PR-D1</b> (khoảng từ 11/11), khi đó V5-48 tách khỏi PR-B1 thành PR riêng gộp trước; không thì BE-B sau PR-B2 (V5-16, Gói 1, bắt buộc, làm trước). Mục tiêu gộp 14/11. Thứ tự và đường cắt:<ol><li><b>Máy chủ:</b> yêu cầu hoàn `payment_after_cancel` tự tạo (S2, S3), "Có thể trùng" (S4 tối thiểu), `afterClosureOnly` (S6), `bankReference` (S4 nên có).</li><li><b>Nút và hộp ghi trên Desk</b> (FE-A, chữ UXD). Chỉ lên cùng (1).</li><li><b>`deposit_after_cancel` từ tin báo của sale, CTV</b> (`createDepositNotice` 202, nút "Không thấy tiền"; S7, S8). Hợp đồng đã có. Cắt được: khi đó `createDepositNotice` trên đơn đã đóng vẫn trả 409 như v1.0.4.</li></ol>Cắt theo thứ tự: S5 (trần một khoản) trước, rồi (3); (1) và (2) lên cùng nhau hoặc cùng sang v1.0.6. 12/11 PR-B3 chưa mở thì cắt (3); 14/11 chưa gộp phần nào thì phần đó sang v1.0.6, là việc đầu của bản đó. v1.0.5 vẫn đủ an toàn nhờ V5-48 (SEC mục 3.5). 5B-2 sang v1.0.6.</li><li><b>Kết luận SEC (06/11): (b) – có điều kiện</b> (`rounds/round-05/reviews/SEC-on-bug-r5-002.md`; thẻ FB-R5-SEC-PO-B002-05). Phần luật máy chủ tách thành <b>V5-48</b> (Gói 4, bắt buộc, làn BE-B, không migration; quyết định 22), lên v1.0.5 không chờ 5B-1. 5B-1 còn lại (tự tạo yêu cầu hoàn, nút Desk, `deposit_after_cancel`) giữ mức nên có, có lịch ở PR-B3 (quyết định 23), và phải đạt S1–S8 ở trên khi lên. Tới khi V5-48 lên production: lời dặn tạm cho người duyệt hoàn ở release notes v1.0.4 (SEC mục 3.3).</li><li><b>Test (ghi chú cho QA):</b> ca (a) của BUG-R5-002 <b>đổi kết quả mong đợi</b>: đơn hủy vì lý do khác `hold_expired` → <b>nhận</b> (không còn 409). Thêm các ca DOM 11.4: (a') giữ chỗ lễ tân hủy lý do Không liên lạc được, ghi chuyển khoản kèm ảnh → 201, chờ đối soát, có yêu cầu hoàn `pending`; (a'') đơn đã đóng: tiền mặt, POS, chuyển khoản không ảnh → 422, sale bị chặn; (d') người ghi không tự duyệt, MGR duyệt được, chi trước đối soát bị chặn; (e') sale báo đã chuyển → mục `deposit_after_cancel`, ghi khoản thu thì mục đóng, "Không thấy tiền" thì mục đóng kèm ghi chú; (b') 5B-2 với giữ chỗ người bấm hủy, đơn `confirmed` rồi hủy không có lựa chọn khôi phục. Ca (b)–(g) còn lại giữ.</li><li>Không mở nút <b>Xác nhận cọc</b> cho giữ chỗ quá hạn chưa nhận đồng nào (DOM 11.2 quyết; Tờ 2a dòng "Hết hạn, chưa cọc" ORC đã sửa `128643f6`).</li><li>Khi lên: PO sửa Tờ 2a, BA sửa sổ tay 2.4 (V5-71), bỏ các bước làm tay tương ứng ở DOM 11.2.</li></ul>Nâng bắt buộc khi QA nâng P1 (sổ giao ca có từ 2 ca "tiền về sau khi hủy" trong một tuần). Tới khi lên: làm tay theo DOM 11.2 và Tờ 2a. | BUG-R5-002; DOM `rules-v1.0.5.md` mục 11.2–11.4 (`e9e0e2e4`); US-085 AC4 (EP02 10.5, EP01 dòng 109); SEC `SEC-on-ba-dk4-dk5.md` mục 3a lượt 3 | ARC (hợp đồng, máy trạng thái) → BE-B/BE-D + FE-A + UXD → SEC, DOM, QA |
| V5-19 | Desk S35 hiện cả **giá web khách đã thấy lúc gửi** ("từ – đến") và giá Desk tính lại (SEC 9.5 ca 4). Hợp đồng `atSubmit` chỉ đọc; số "đến" đã lưu trong DB. SEC 06/11: Minor, không bắt buộc ở v1.0.5, vì hiện mọi hạng trên production có các căn cùng giá nên số "đến" bằng số "từ". **Điều kiện kích hoạt:** phải lên trước khi hai căn cùng hạng có giá khác nhau trên production. | FB-R4-SEC-BE-03; SEC 9.5 ca 4 | ARC → BE → FE-A → SEC, UXD, QA |

### Gói 6 – Vận hành, runbook, tài liệu (OPS, BA, PO)

Bắt buộc: V5-60, V5-61, V5-62, V5-63, V5-65 (phần OR-03), V5-67, V5-70, V5-71, V5-72, V5-73, V5-74. Phần còn lại nên có. SEC xếp V5-60 (OR-01, OR-02) là **Major**.

| ID | Việc | Nguồn | Vai |
|---|---|---|---|
| V5-60 | **Bản sao lưu ngoài máy an toàn và tự động.**<ul><li>**Làm ngay (Gói 0), không chờ bản:** thêm `--ignore-existing` vào `pull-backups.sh`, để máy chủ bị chiếm không ghi đè được bản tốt trên máy nhận (FB-R4-SEC-OPS-OR-01, Major). Test: máy chủ giả đổi một tệp cũ thì tệp cục bộ giữ nguyên.</li><li>Tới khi tự động: ORC kéo tay ít nhất 2 ngày một lần. Lần gần nhất: 06/11 khoảng 19:00.</li><li>Tự kéo hằng ngày bằng launchd trên máy INV, **chỉ khi INV đồng ý** cài trên máy mình (`esc-pending-06-11.md` mục 3).</li><li>Điều kiện máy nhận theo FB-R4-SEC-OPS-OR-02 (Major): ping Healthchecks `ottimo-offsite` chỉ khi rc = 0 và bản mới nhất ≤ 36 giờ; URL ping không vào repo; thư mục nhận loại khỏi Time Machine và iCloud; khóa `age` không nằm cùng máy; FileVault bật.</li><li>OPS và BA chốt một ngưỡng báo (OPS 48 giờ, sổ vận hành 2.2 ghi 8 ngày) và sửa cả hai tài liệu.</li></ul>Không tốn tiền. | OR-H1; FB-R4-SEC-OPS-OR-01, OR-02; sổ vận hành 2.2 dòng 1 | OPS + INV (đồng ý) → SEC, ARC; BA |
| V5-61 | **Diễn tập khôi phục** với bản sao lưu sau LP-v2 và image `sha-6414be25f20d`. SEC xếp **Major** (SR-BAK-05: mỗi round một lần; Round 4 chưa có). Làm ngay khi INV có 30 phút mở khóa `age`. Yêu cầu SEC:<ul><li>môi trường cách ly, không khôi phục vào staging dùng chung;</li><li>giải mã 1 ảnh mẫu bằng KEK;</li><li>áp lại `purge_journal` rồi chạy J16;</li><li>xóa dữ liệu khôi phục sau khi xong;</li><li>biên bản vào repo chỉ có số đếm.</li></ul>Thêm `ops-check drill`: quá 35 ngày thì FAIL (SEC đồng ý 35 ngày). Sửa sổ vận hành 2.2 (đang ghi hằng quý) cho khớp. | OR-M1; sổ vận hành 2.2 dòng 4 | OPS + INV → SEC, QC; BA |
| V5-62 | Thêm lượt sao lưu thứ hai mỗi ngày (ARC chọn (a); SEC đồng ý): **production 03:00 + 15:00, staging 03:30 + 15:30**, mỗi khoảng 12 giờ (OPS 06/11, PR #93). Production chạy `ottimo-backup@ottimo-prod.timer` lúc 03:00, staging chạy `ottimo-backup.timer` lúc 03:30 (`bootstrap-vps.sh` mục 7; OPS kiểm chỉ đọc 06/11), nên 15:30 của ARC đúng cho staging, production là 15:00. Hai timer sao lưu hai stack khác nhau, không timer nào thừa. 15:00 tránh giờ nhận phòng 14:00 và khung phát hành quen khoảng 14:00. Cùng mã hóa `age`, cùng chủ và quyền. Vòng xoay tính theo tuổi: mọi bản ≤ 35 ngày. `ops-check backup` 26 → 14 giờ. RPO thật còn 12 giờ. Mất hẳn VPS: tối đa khoảng 60 giờ với nhịp kéo tay 2 ngày, khoảng 36 giờ khi kéo tự động hằng ngày (V5-60). Sửa `hosting-plan.md`; SEC sửa SR-BAK-01 khi bản lên. INV xác nhận "RPO 12 giờ" thay giả định 15 phút (`esc-pending-06-11.md` mục 3). | OR-M2 | ARC → OPS → SEC |
| V5-63 | Giữ log qua lần dựng lại container, **trần cứng 90 ngày**. Tệp hoặc journal không cho mọi user đọc. Giữ nguyên cách che hiện có. Không đưa log vào bản sao lưu ngoài máy. SEC nghiêng về driver `journald` + `MaxRetentionSec=90day`; ARC chọn. | OR-M3; FB-R4-SEC-OPS-OR-04 | ARC → OPS → SEC |
| V5-64 | Runbook "VPS mới" một trang: thứ tự bootstrap, khóa từ bản ngoại tuyến, `.env` từ mẫu, khôi phục, edge, DNS. Chỉ viết, chưa diễn tập (diễn tập tốn tiền, xem B-OPS). | OR-M4 | OPS → ARC, SEC |
| V5-65 | Dọn nhỏ:<ul><li>**gỡ khóa `ottimo-ops` khỏi user `ottimo`** ở cửa sổ bảo trì đầu tiên (kiểm trước vẫn vào được `ottimo-admin`); `ops-check` thêm mục `sshkeys`; README bootstrap ghi rõ khóa `--deploy-key` chỉ dùng lúc dựng máy (OR-L4, FB-R4-SEC-OPS-OR-03, bắt buộc);</li><li>`ops-check` báo tên khóa `.env` trùng, chỉ tên (OR-L1);</li><li>mask `fwupd` (OR-L2);</li><li>lần sửa `.env` staging tới: làm rỗng `TEST_SUPPORT_ALLOW_IPS`, chỉ giữ bản `env.before-*` mới nhất (OPS sẵn sàng vận hành mục 9; SEC đồng ý).</li></ul> | OR-L1, L2, L4; FB-R4-SEC-OPS-OR-03; OPS mục 9 | OPS → SEC |
| V5-66 | Landing staging tự xử lý các bước dựng lần đầu (README 12.3 đề xuất (a)–(f)):<ul><li>`deploy-landing.sh` báo khóa thiếu và dừng nếu edge chưa biết host;</li><li>`edge.sh` kiểm quyền ghi;</li><li>smoke đếm lỗi ACME;</li><li>`publish-privacy-notice.sh` dừng sớm nếu không đọc được mật khẩu xem trước, và tạo log đúng chủ;</li><li>OR-L3: đưa `privacy-notice.log` staging về `ottimo:ottimo 0600`. SEC cho sửa tay một lần ngay; không xóa, không cắt nội dung;</li><li>`--rollback-to` chỉ cho staging.</li></ul> | README 12.3 (a)–(f), OR-L3 | OPS → ARC, SEC |
| V5-67 | **Không chuyển header `Authorization` tới api:** thêm `header_up -Authorization` trong `(public_api)` cho **cả staging và production**. Commit riêng, kèm ca CI cho 3 route và hai snippet. Kiểm một lần trên staging qua edge thật. SEC duyệt 06/11 (FB-R4-SEC-OPS-054-01).<br>Phương án A+ cho BUG-R4-054 **không làm ở v1.0.5** (quyết định PO, mục 6). Thử form trên staging tiếp tục bằng công cụ chèn header (README 12.3). | FB-R4-SEC-OPS-054-01; `rounds/round-04/reviews/SEC-on-bug-r4-054.md` | OPS → SEC, ARC |
| V5-68 | Lượt kiểm 30 phút báo khi tin Google Chat không gửi được ("chat dead"). | Sổ vận hành 2.2 dòng 2 | OPS + BE-D → SEC |
| V5-69 | Nhắc hạn tên miền, máy chủ, Google Workspace **trước 30 ngày** vào phòng Báo động. Ngày hết hạn do INV cung cấp, lưu trên máy chủ, không vào repo. | Sổ vận hành 2.2 dòng 3 | OPS → SEC; INV cho ngày |
| V5-70 | **Runbook v1.0.5, dùng làm mẫu cho các bản bảo trì sau:**<ul><li>M4d;</li><li>số M4a ghi rõ là tương đương P2 (RB2-04);</li><li>câu đếm "giới hạn đã biết" có lọc đúng (RB2-05);</li><li>phần quay lui kể cả các biện pháp bảo vệ bị mất (SEC-OPS-RB-03);</li><li>gộp ý còn giá trị của các thẻ runbook bản cũ đã đóng ở phụ lục C.</li></ul> | FB-R4-ARC-OPS-RB2-04, 05; FB-R4-SEC-OPS-RB-03; decision-log (j) | OPS → ARC, SEC, QC |
| V5-71 | **Sổ tay và hướng dẫn cho v1.0.5:**<ul><li>bỏ các cách làm tạm hết cần khi bản lên;</li><li>dọn sau #69 (PR69-02/04);</li><li>sửa `so-van-hanh` 4.2 và 5.4 về "ô giá OTA nền" cho khớp V5-21;</li><li>sổ tay lễ tân: số trên yêu cầu web là giá thấp nhất của hạng lúc khách gửi; báo giá thật làm trên Desk theo từng căn (Suggestion của SEC ở `SEC-on-lp-v2-s6d.md`);</li><li>sổ tay 2.4 viết lại theo v1.0.4 và Tờ 2a bản 06/11: rà giữ chỗ theo mã đơn, kiểm tiền về trước khi hủy hoặc báo khách, các bước làm tay khi tiền về mà đơn đã tự hủy (DOM `rules-v1.0.5.md` mục 11.2), và phòng ngừa: lượt rà trước khi rời quầy, giữ chỗ chưa cọc hết hạn trước giờ mở quầy hôm sau mà khách còn muốn thì gia hạn 1 lần tới 10:00 sáng hôm sau (dưới trần 12:00 ngày đến, BR-302, BR-303). Bỏ bước nào khi V5-1B, V5-5B lên.</li><li>câu cũ "sau hạn Desk từ chối xác nhận cọc" (đúng tới v1.0.3; từ v1.0.4 giữ chỗ có cọc quá hạn vẫn xác nhận được, BUG-R3-042): sổ tay 2.4 (gạch "Xử lý trước hạn", khung "Giữ chỗ quá hạn"), dòng tương ứng ở 5.6; `02` 4.5, 17.1. ORC ghi 06/11 theo SEC, chưa sửa ở V5-08.</li></ul> | FB-R4-SEC-BA-PR69-02, FB-R4-PO-BA-PR69-04, mục 6, SEC S6d mục 9 | BA → DOM, UXD, SEC |
| V5-73 | **`pricegap` có thêm phần kiểm tĩnh** (FB-R4-SEC-OPS-S6D-01, Minor). SQL READ ONLY qua `psql_ro`, chỉ trả một số đếm, không trả id. Đếm các căn đang bán, có nhãn hạng, `active_from <= hôm nay + 365`, chưa ngừng, mà không có dòng giá nào `effective_from <= greatest(active_from, hôm nay)`. Kết quả phải là 0. Cửa sổ 365 ngày theo SEC, để bắt cả căn sắp hoạt động mà chưa có giá. FAIL khi phần log **hoặc** phần tĩnh > 0; tin chỉ nêu số căn. Thêm 2 ca vào `ops-check-price.test.sh`.<br>Làm ngay, không chờ bản:<ul><li>ORC chạy truy vấn này một lần bằng `SQLRO` trên production và staging, ghi số đếm vào biên bản;</li><li>OPS sửa câu README `infra/server` dòng 120 "nhất là sau khi nhập lại bảng giá 01/11" thành "thường do dữ liệu khởi tạo hoặc sửa thẳng DB: OWN nhập giá cho căn đó trên Desk, OPS tìm nguồn".</li></ul> | QA S6d; FB-R4-SEC-OPS-S6D-01 | OPS (+ ORC chạy một lần) → SEC, QA |
| V5-72 | Release notes v1.0.5 bằng ngôn ngữ người dùng. Mỗi mục "Chưa có" có đích. Rà các bảng "Chưa có" của v1.0.0–v1.0.3 còn hứa v1.0.5. | PO | PO → BA, DOM |
| V5-74 | **Runbook sự cố dữ liệu khách (SR-INC-01), một trang.** Thêm 06/11 tối theo SEC (`rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md` mục 5 ý 1).<ul><li>các bước: phát hiện → khoanh vùng → đánh giá → quyết có phải báo cơ quan chức năng trong 72 giờ không (INV cùng SEC) → báo khách nếu cần;</li><li>ai làm gì, ai quyết; mẫu dòng ghi chỉ có mã đơn, giờ, kênh, không dữ liệu khách;</li><li>hai nhánh có sẵn: lễ tân gửi nhầm link check-in online (FB-R5-SEC-BA-01, Tờ 1); `pull-backups.sh` thoát 3 "server copy changed";</li><li>sổ vận hành và `guides/01` 14.1 trỏ về runbook này. Tới khi có, sổ vận hành dùng lớp tạm của FB-R5-SEC-BA-04.</li></ul>Chỉ viết tài liệu, không đổi mã, không đổi chính sách. Không cần INV trả lời trước 20/11. | SR-INC-01; SEC mục 5 ý 1; FB-R5-SEC-BA-01, BA-04 | SEC (OPS góp phần kỹ thuật) → OPS, DOM. Hạn 14/11 (hết Sản xuất); review 15–16/11 |

### Thứ tự và lịch đề xuất

| Ngày | Việc |
|---|---|
| 07–08/11 | Gói 0. ORC gộp PR-0 (#94, hợp đồng 0.3.13). **BE-C làm V5-25 (PR-C2; P1, BUG-R5-003), không chờ PR-0; PR #96 đã mở 06/11, CI xanh, chờ ARC, DOM, SEC review; mục tiêu gộp 10/11.** BE-S làm PR-S1 (V5-14, V5-22, guard `x-write-roles`), hạn ≤ 08/11. ARC chốt hợp đồng 0.3.13. DOM chốt luật V5-11, V5-16, V5-30, V5-31, và sửa từ điển cùng BR-101 (5) (V5-1A). OPS sửa câu README dòng 120 và thêm `--ignore-existing` (V5-73, V5-60; đã làm 06/11: `bede5332`, `a26804f6`). ORC chạy truy vấn tĩnh `pricegap` một lần (V5-73; production đã chạy 06/11, 0 căn thiếu giá; còn staging). Diễn tập khôi phục ngay khi INV có 30 phút (V5-61); ORC xin INV hẹn trong tuần 09–13/11, vì chưa đạt thì cả v1.0.5 chưa lên (quyết định 25). Các điều kiện QC R4 hạn 08/11 và 10/11 (bảng dưới). |
| 09–14/11 | Sản xuất Gói 1–4, Gói 6 bắt buộc, theo thứ tự PR ở hợp đồng 0.3.13 mục 2 (quyết định 23): PR-A1a rồi PR-A1b (BE-A), PR-D1 (BE-D), PR-B1 có V5-48 rồi PR-B2 (BE-B), PR-C1 sau V5-73 (BE-C), PR-H1. Gói 5: PR-B3 (5B-1) mục tiêu gộp 14/11, cắt theo dòng V5-5B. PR-M (migration V5-30, V5-31) chỉ gộp khi V5-61 đạt (quyết định 17). |
| 15–16/11 | Review chéo, Phản hồi & sửa. |
| 17–18/11 | QA trên staging, gồm ca giờ thật 00:00–05:59 và ca trả phòng 06:00. |
| 19/11 | QC rút gọn. |
| 20/11 | Review định kỳ đầu tiên. INV xem kết quả QC, các việc chờ quyết (`esc-pending-06-11.md`) và backlog. INV đồng ý hoặc không cho production. |
| 20–21/11 | Production nếu INV đồng ý. Dự phòng tới 25/11, trước hạn H2 01/12. |

Đội làm ngay phần bắt buộc vì đây là lỗi và việc đã hẹn, không đổi chính sách. Ở buổi 20/11, mục nào INV muốn bỏ thì rút ra trước khi cắt bản.

#### Điều kiện của cổng QC đóng Round 4 (ĐK-1…8)

Nguồn: `rounds/round-04/qc/round-4-closeout-gate.md` mục 2. Hạn là hạn QC đặt. ORC theo dõi. Xong thì ghi commit hoặc dòng decision-log. ĐK-2 và ĐK-3 cần INV; các ĐK khác không cần.

| ĐK | Việc | Mã V5 | Làm → xác nhận | Hạn | Tình trạng 06/11 tối |
|---|---|---|---|---|---|
| ĐK-1 | Một lượt CI xanh đủ mọi job trên `main` từ `bede5332`, gồm E2E smoke và landing Playwright | – | ORC | 07/11 12:00 | **Đạt:** run 42216567004 (`066da253`), 9/9 job kiểm xanh. ORC ghi vào decision-log khi tổng kết |
| ĐK-2 | Diễn tập khôi phục production theo đủ yêu cầu SEC (môi trường cách ly, giải mã 1 ảnh mẫu, `purge_journal` + J16, xóa dữ liệu khôi phục, biên bản chỉ ghi số đếm) | V5-61 | OPS + INV (30 phút mở khóa `age`) → SEC | Chậm nhất 20/11; ORC xin INV hẹn trong tuần 09–13/11 (quyết định 25) | Chưa làm. **Chặn production** bản có migration hoặc đổi sao lưu, khôi phục tới khi đạt (tiêu chí QC điều 8). **v1.0.5 có V5-62 (đổi sao lưu), nên V5-61 chưa đạt thì cả v1.0.5 chưa lên, kể cả phần không migration** (SEC FB-R5-SEC-OPS-95-02 ý 4); hạn 01/12 của V5-30/31 phụ thuộc hoàn toàn vào V5-61. Bản sửa P0 không migration vẫn lên được, kèm sao lưu ngay trước deploy |
| ĐK-3 | Kéo sao lưu ra ngoài máy ít nhất 2 ngày một lần bằng `pull-backups.sh` bản `bede5332`, tới khi V5-60 tự động hóa. Thoát 3 ("server copy changed") = P0 bảo mật | V5-60 | ORC (INV cho phép SSH trong ngày) | Mỗi 2 ngày; lần đầu 08/11 khoảng 19:00 | Lần gần nhất 06/11 khoảng 19:00 (script cũ). Mỗi lần một dòng decision-log: giờ, mã thoát, tên bản mới nhất. Quá hạn vì INV vắng thì ORC báo INV ở phiên kế tiếp |
| ĐK-4 | Sổ vận hành khớp quyết định 06/11: kéo sao lưu ít nhất 2 ngày một lần; phòng "Báo động" có thể thêm một người; (c) nhắc diễn tập sau 35 ngày | – (Gói 0) | BA → SEC, OPS | 08/11 | BA đã sửa: sổ vận hành bản 1.2, gồm (c) (`4d25f5b7`). Chờ SEC hoặc OPS đọc lại |
| ĐK-5 | Bỏ mọi câu "check-in online tạm dừng / chưa gửi link"; PO sửa dòng V5-08 | V5-08 | BA, PO → SEC, UXD | 10/11 | BA đã sửa chữ (`4d25f5b7`); PO đã sửa dòng V5-08, tờ dán quầy và hướng dẫn ngày D. SEC duyệt có điều kiện: FB-R5-SEC-BA-01 hạn 08/11; thẻ PO đã sửa. Còn câu "đơn giữ chỗ cũng hiện nút link", #69, DOM đọc Tờ 2a (dòng V5-08) |
| ĐK-6 | Từ điển tham số: `night_from_month_divisor` là khóa còn dùng ở đường API đổi giá khi không gửi giá đêm (BUG-R4-057), giữ giá trị 12 | V5-1A | DOM → BA | 08/11 | DOM đang làm |
| ĐK-7 | Chuyển Closed 28 lỗi "đã sửa, chờ QA" (gồm 8 lỗi P0/P1); kiểm lại BUG-R4-035, 039 không ghi thử trên production; sửa ô "Closed 10" ở `bug-list.md` | V5-02 | QA → QC | 10/11 | QA đang làm. P0/P1 nào hóa ra chưa sửa trên production thì đi đường hotfix (protocol 9.3) và báo INV ngay |
| ĐK-8 | Dòng trả lời trong `responses/OPS-LP-v2.md` cho FB-R4-SEC-OPS-054-02 và các thẻ Minor SEC ngày 06/11 | – (Gói 0) | OPS → SEC | 08/11 | OPS đã trả lời (`a26804f6`). Chờ SEC đọc lại |

## 3. Vai trong Round 5

| Vai | Việc chính |
|---|---|
| ORC | Giao việc theo mục 2. V5-03 (cùng QA). Script gọi API đổi giá luôn gửi đủ hai giá (V5-1A). Tổ chức review 20/11. Commit sau mỗi bước. |
| PO | V5-01, V5-06, V5-72. Chốt phạm vi trong round. Nhận và trả lời thẻ review. Chuẩn bị nội dung review 20/11. |
| ARC | Hợp đồng 0.3.13 (V5-10, 13, 14, 15, 18, 19, 1A, 22, 30, 44, 46, 50, 57, 58). V5-25: dòng mô tả `setParameter` cho `min_stay`, `weekend_nights`, không chặn BE. V5-5B: chốt hướng 5B-1 trước 10/11 (có đổi hợp đồng không), 5B-2 chốt migration. V5-48, 5B-1: đã chốt ở 0.3.13 mục 1.21 (bổ sung 1c); 5B-2 ở 0.3.14. Duyệt V5-62, V5-63. Review kỹ thuật mọi PR. |
| DOM | Luật cho V5-11, 16, 30, 31. Sửa từ điển và BR-101 (5) ở V5-1A ngay trong Gói 0. Review chữ tiền và giá. Review V5-74 phần việc ở quầy. Đọc phần giữ chỗ Tờ 2a (V5-08). |
| BE (A/B/C/D) | Gói 1 (gồm V5-1B), 3, 4. **V5-25 (P1) là việc đầu của làn BE-C, bắt đầu 07/11, không chờ PR-0** (quyết định 19). V5-5B-1 (PR-B3) là việc BE đầu của Gói 5: đề nghị BE-D sau PR-D1, không thì BE-B sau PR-B2; phần chưa gộp tới 14/11 sang v1.0.6 (quyết định 20, 23). **V5-48 (Gói 4, bắt buộc) trong PR-B1 ở làn BE-B; tách PR riêng nếu PR-B1 trễ hoặc PR-B3 cần nền sớm** (quyết định 22, 23). Thứ tự PR theo hợp đồng 0.3.13 mục 2 và lịch mục 2 (quyết định 23). BE-B: PR-B1 → PR-B2 (bắt buộc) → PR-B3 nếu BE-D không nhận. V5-57, 58, 68 phần máy chủ. |
| FE-A (Desk) | Gói 1, 2, 5 phần Desk. V5-48: câu báo ở hộp Xác nhận cọc khi máy chủ trả 409 đơn đã đóng (chữ do UXD chốt). |
| FE-B, MOB | V5-13, 15, 18, 24, 46, 5A. App nhân viên cho V5-15. |
| UXD, CPY | Gói 2. Chữ cho Gói 1 và 5. V5-04, V5-47. Mọi đầu ra theo brand guideline OTTIMO. |
| INT | V5-41. |
| DATA | V5-07, V5-17. |
| SEC | Viết V5-74 (runbook sự cố SR-INC-01). Duyệt V5-16, 19, 30, 40–48, 60–69, 73; V5-5B theo S1–S8 và mục 4 của `SEC-on-bug-r5-002.md`. Đóng thẻ V5-05. Theo dõi các thẻ SEC-OPS ngày 06/11 (OR-01…04, 054-01, S6D-01). |
| OPS | Gói 6 (V5-60 tới V5-70, V5-73). Góp phần kỹ thuật và review V5-74. Sửa câu README dòng 120 ngay trong Gói 0. |
| BA | V5-08, V5-71. Chữ sổ tay đi kèm từng mục. |
| QA | V5-02, V5-03, V5-04 (C2-39), V5-56. Test case cho mọi mục (a); V5-48 theo ca (h1)–(h5) thẻ FB-R5-SEC-QA-B002-06; US-177 (BR-438) theo DOM T-16-1…10 và ARC T16-6…12. <b>Id ca rbac đổi từ 0.3.13</b> (SEC ARC-13): ca thao tác `RB-<operationId>-<subject>`, ca trường `RBF-<operationId>-<field>-<subject>`, ổn định qua các lần thêm luật. Id cũ dạng số (`RB-0387`…) trong tài liệu trước 0.3.13 theo đánh số của commit đó, tra git. Test case, bug list và báo cáo mới dùng id mới. Hồi quy tiền ở quầy. Kiểm trên staging. |
| QC | Cổng rút gọn v1.0.5 theo mục 4. |

## 4. Tiêu chí QC v1.0.5 (cổng rút gọn)

QC quyết **ĐẠT / ĐẠT CÓ ĐIỀU KIỆN / KHÔNG ĐẠT** theo 12 điều:

1. **Phạm vi bắt buộc:** Gói 0–4 và phần bắt buộc của Gói 6 Done. Nếu dời, phải có dòng decision-log của PO + ORC kèm lý do. **Riêng V5-30 không được dời quá 01/12.** Gói 5 không chặn.
2. **Lỗi:** 0 P0/P1 mở. P2 mới chỉ được mở khi có cách làm tạm trong release notes. Mọi lỗi đã sửa ở v1.0.4 đã chuyển Closed (V5-02).
3. **Review chéo:**
   - mỗi đầu ra có ít nhất 2 vai khác review theo ma trận;
   - mục tiền và giá có DOM;
   - mục bảo mật và dữ liệu khách có SEC;
   - chữ có UXD, chữ hướng khách có thêm CPY;
   - Blocker và Major đóng hết.
4. **CI và bản dựng:** CI xanh gồm E2E smoke. Production lên đúng digest đã kiểm trên staging, không có commit mã sau tag.
5. **Tiền:**
   - oracle tính thử bằng ghi thật ở BR-428, BR-103, BR-105;
   - ca sau nửa đêm chạy bằng giờ thật hoặc đồng hồ stack có ghi rõ;
   - web bằng Desk ở 4 ca mẫu như F2 (0 VND lệch);
   - Tổng cộng, Còn phải thu, VietQR cùng một số ở mọi ca trả phòng.
6. **Kiểm thử:** mỗi mục (a) có test case và kết quả. Hồi quy luồng quầy: nhận phòng, trả phòng, trả sớm, giữ chỗ, hoàn tiền, đổi phòng. Smoke staging đạt.
7. **Bí mật và dữ liệu:**
   - không số hoa hồng, không dữ liệu cá nhân khách, không bí mật trong repo, PR, test, ảnh;
   - CI `confidential-paths` xanh;
   - ảnh mới (C1-07, C1-22, C2-39) qua kiểm che dữ liệu;
   - SEC ký.
8. **Migration và quay lui:**
   - migration (nếu có) đi tiến, có đường lùi;
   - runbook v1.0.5 có M4d và phần quay lui kể cả biện pháp bảo vệ bị mất;
   - đã diễn tập trên staging;
   - **diễn tập khôi phục production (V5-61) xong và đạt trước khi lên production nếu bản có migration** hoặc đổi sao lưu, khôi phục (QC R4 ĐK-2). Chưa đạt thì bản đó không lên. v1.0.5 có V5-62 (đổi sao lưu) nên luôn cần V5-61, kể cả khi bỏ migration (quyết định 25). Bản sửa P0 không migration vẫn lên được, kèm sao lưu ngay trước deploy.
9. **Sao lưu:** trước khi lên production có bản sao lưu ngoài máy mới trong 24 giờ, kéo bằng `pull-backups.sh` đã có `--ignore-existing`. Diễn tập khôi phục Round 5 (V5-61) đạt theo yêu cầu SEC.
10. **Tài liệu:**
    - release notes v1.0.5;
    - sổ tay và hướng dẫn bỏ các cách làm tạm đã hết cần;
    - sổ tay HTML dựng lại;
    - chữ hướng khách theo brand guideline OTTIMO.
11. **Không đổi chính sách:** không mục nào đổi giá, cọc, hoàn, hủy so với quyết định của INV. Tham số giá trên production không bị đội đổi.
12. **INV đồng ý** trước production. QC không duyệt deploy.

## 5. Rủi ro

| Rủi ro | Cách giảm |
|---|---|
| V5-10, V5-11 đụng giờ nghiệp vụ sau nửa đêm, khó kiểm | ARC chốt luật một chỗ (`businessDay` + `rollover`). QA chạy ca giờ thật trên staging trước QC. |
| H2 trễ quá 01/12 | Quy tắc tách bản 25/11 (Gói 3). |
| Chưa diễn tập khôi phục (V5-61) lúc cắt v1.0.5: cả v1.0.5 chưa lên (V5-62 là đổi sao lưu), hạn 01/12 của V5-30/31 trượt theo | ORC xin INV hẹn diễn tập trong tuần 09–13/11. Không tách migration ra nữa (không giúp lên sớm hơn). 25/11 chưa diễn tập thì ORC báo INV ngay. Tới khi lên: hoa hồng thuê tháng và thưởng quản lý tính ngoài Desk; P0 không migration, không đổi sao lưu vẫn lên riêng (quyết định 25) |
| Tham số production còn lệch sổ tay (INV chưa làm B2–B11), Desk và web ra số lai | Đội không sửa thay. Nhắc trong `esc-pending-06-11.md` mục 3 và ở review 20/11. QA kiểm v1.0.5 với tham số đang chạy, như S6c. |
| Chủ đầu tư hoặc quản lý lưu sai một tham số dạng danh sách trước khi V5-25 lên (BUG-R5-003: báo giá, đơn trực tiếp mới, giá web trả 500 tới hết ngày nghiệp vụ, không sửa được trong ngày) | Release notes v1.0.4 "Giới hạn đã biết" dặn không bấm Lưu ở `min_stay`, `weekend_nights`; buộc phải đổi thì nhắn đội, Hiệu lực từ ngày mai; lỡ lưu thì báo đội ngay, coi là P0. V5-25 gộp sớm (10/11). Điều kiện tách bản sớm ở quyết định 19 |
| Làn BE-B quá tải: PR-B1 có V5-48 (4,25–4,5 ngày cộng V5-48), PR-B2 (1 ngày), PR-B3 5B-1 (2,5–3 ngày) là khoảng 8–9 ngày trong cửa sổ 6 ngày 09–14/11. Tới khi V5-48 lên, FD+ gọi thẳng API vẫn ghi được tiền mặt, thẻ không ảnh lên đơn đã đóng (SEC, BUG-R5-002) | BE-B giữ phần bắt buộc: PR-B1 (V5-48 làm trước trong PR) rồi PR-B2. Đề nghị ORC giao PR-B3 cho BE-D sau PR-D1 (khoảng từ 11/11); khi đó V5-48 tách PR riêng, gộp khoảng 10/11, làm nền cho PR-B3 (ARC mục 2 cho phép). FE-A làm nút Desk sau PR-B3. 12/11 PR-B3 chưa mở thì cắt (3) `deposit_after_cancel`; 14/11 chưa gộp thì 5B-1 sang v1.0.6, v1.0.5 vẫn có V5-48. Tới khi V5-48 lên production: người duyệt hoàn theo lời dặn tạm SEC 3.3 (release notes v1.0.4); câu đếm chỉ đọc SEC mục 5 khi INV cho phép (quyết định 22, 23). |
| Đội nhỏ, phạm vi rộng | Gói 5 tự rơi sang v1.0.6. PO cắt thêm nếu tới 14/11 Gói 1–4 chưa xong 70 %. |
| INV chưa đồng ý cài lịch kéo sao lưu trên máy mình | ORC kéo tay ít nhất 2 ngày một lần, với `pull-backups.sh` đã có `--ignore-existing`. QC điều 9 vẫn đòi bản ngoài máy ≤ 24 giờ trước production. |
| INV không có mặt tới 20/11 | Không có việc nào trong v1.0.5 cần INV trả lời trước 20/11. Chỉ V5-61 cần INV khoảng 30 phút. Đội đề nghị làm trong tuần 09–13/11; dời sau 20/11 thì cả v1.0.5 dời theo, vì V5-61 chặn cả bản (quyết định 25). |

## 6. Quyết định PO trong phạm vi round (ghi decision-log)

1. **`ota_base_rate`: không làm trình nhập theo nhóm căn ở v1.0.5.** Chỉ hiện tên và câu "Không cần nhập" (V5-21).
   - Lý do:
     - từ v1.0.4 (#73), đơn OTA để trống giá đã lấy giá đêm niêm yết;
     - INV chốt một mức giá cho mọi kênh (ESC-045);
     - từ điển ghi "Không cần dòng này";
     - DOM H6 sẽ gỡ khóa này ở v1.1, nên làm trình nhập bây giờ là việc bỏ đi sau.
   - INV xác nhận ở review 20/11. Nếu INV vẫn muốn nhập giá OTA riêng thì đó là đổi chính sách "một mức giá" và cần ESC.
2. **v1.0.5 gồm Gói 0–6 theo thứ tự ở mục 2.** Gói 5 không chặn QC. Các mục khác vào backlog cải tiến (phụ lục) để INV chọn ở review định kỳ.
3. **Chạy ESC-035, 037, 038 theo đề xuất như giả định.** Giữ "Chờ INV" cho ESC-032, 033, 039, 046, 047 (bảng `esc-pending-06-11.md`).
4. **A+ của BUG-R4-054 không vào v1.0.5.** Lý do:
   - đây là tiện ích cho lượt thử form trên staging, không phải lỗi production;
   - SEC chỉ duyệt kèm 5 điều kiện, trong đó có một Major (cửa sổ tự đóng);
   - cách C của README 12.3 đã đủ cho lượt thử thỉnh thoảng.

   Phần bảo mật đi kèm (`header_up -Authorization`, 054-01) vẫn làm ở V5-67.
5. **V5-19 (Desk "từ – đến") chuyển sang Gói 5.** ORC giao đưa vào v1.0.5. Sau đó SEC kết luận Minor, không bắt buộc ở v1.0.5, vì mọi hạng trên production đang có các căn cùng giá. PO giữ mục này trong v1.0.5 ở mức "nên có", kèm điều kiện kích hoạt: phải lên trước khi INV đặt hai căn cùng hạng khác giá. Điều này đã ghi cho INV ở `esc-pending-06-11.md` mục 3.

6. **Dependabot `minimatch` (cảnh báo #19): xếp (b) B-KYTHUAT, không đóng, không ép bản** (06/11 tối, phụ lục I).
   - `minimatch` 10.2.6 trong lockfile **nằm trong** dải bị ảnh hưởng (≥ 7.0.0, < 11.0.1). Câu "lockfile ngoài các dải bị ảnh hưởng" ở cổng QC đóng R4 mục 5 chưa đúng với cảnh báo này.
   - Gói chỉ có ở công cụ phát triển (lint TypeScript), không vào image chạy production. Lượt Dependabot lỗi vì chưa có bản vá cài được qua cây phụ thuộc hiện tại. Job `audit` xanh vì CI chỉ chặn từ mức `high`.
   - Đóng khi `typescript-eslint` ra bản dùng `minimatch` ≥ 11.0.1. Không chặn v1.0.5.
   - **SEC kết luận 06/11** (`rounds/round-05/outputs/SEC/dependabot-triage.md`, `1543be77`): chấp nhận có hạn, giữ mở, không override, không dismiss. Nhánh mã lỗi không chạy ở cấu hình lint của OTTIMO. SEC xem lại **30/11**; chưa có bản thì gia hạn và ghi lý do.
7. **Dependabot `react-router` (cảnh báo #3, Desk): (b) B-BAOMAT, giữ mở.** Backlog R3-Q31 hẹn việc này từ 19/10 nhưng plan R5 chưa xếp. **SEC kết luận 06/11:** Desk chỉ có một chỗ đưa đường dẫn từ ngoài vào `navigate`, và chỗ đó đã qua `safeInternalPath` từ 23/10, có test đúng các mẫu `\`. Không thêm việc vào Gói 4. Nâng lên 7.18+ cùng lần nâng toolchain FE (PR #2 React 19, #5 plugin-react). Trước đó bật thử cờ `v7_startTransition` và `v7_relativeSplatPath` trên 6.30.x để xem test nào hỏng. Các cảnh báo `nodemailer` ở V5-41.
8. **BUG-R3-047 chuyển (c).** Lỗi đã sửa ở v1.0.4 (`5539b7e6`). V5-53 chỉ còn BUG-R3-048. Câu sai trong sổ tay sửa ở V5-08.
9. **#69 gộp ở Gói 0 cùng V5-08**, không chờ V5-71. PO ghi số bản sổ tay vào release notes v1.0.4 khi gộp.
10. **Tờ dán quầy sửa ngay, không chờ bản.**
    - PO sửa tối 06/11: Tờ 1 thêm cách gửi link check-in online; Tờ 2a bỏ khối tạm dừng và các câu giữ chỗ mà v1.0.4 làm sai; hướng dẫn ngày D mục 10 ghi "hết hiệu lực".
    - Phần giữ chỗ chỉ chép những gì Desk v1.0.4 đã làm (release notes v1.0.4 bảng "Giữ chỗ và cọc"), không thêm quy tắc mới. DOM đọc lại phần này, SEC đọc lại phần check-in.
    - INV in lại Tờ 1 và Tờ 2a sau khi đội báo đọc xong. Tờ 2a viết lại hẳn cùng sổ tay 2.4 ở V5-71.

11. **Runbook sự cố SR-INC-01 vào v1.0.5 thành V5-74, Gói 6, bắt buộc** (06/11 tối, theo đề xuất SEC). SEC xếp Minor. PO vẫn để bắt buộc vì:
    - luồng gửi link check-in online chạy thật từ 06/11, nên gửi nhầm người là việc có thể xảy ra mỗi ngày;
    - quyết định "có phải báo trong 72 giờ không" cần các bước viết sẵn;
    - việc nhỏ (một trang tài liệu), không đổi mã.
    - Hạn 14/11; OPS, DOM review 15–16/11. Không xong thì QC ghi điều kiện, không chặn bản sửa mã.

12. **3 khóa UXD mục 4.19 vào v1.0.5, gộp V5-23.** Cả ba là chữ Desk sai sự thật: số căn viết cứng; đường dẫn tới màn không có. Chỉ đổi chuỗi, không cần CPY (chữ nội bộ), UXD đã viết sẵn.
13. **`weekend_nights` thành V5-25, Gói 2, bắt buộc.** Đây là lỗi máy chủ chặn chủ đầu tư lưu đúng mức đội đề xuất, và có thể làm giá cuối tuần sai nếu lưu dạng số. Release notes v1.0.4 dặn chủ đầu tư không sửa ô này tới v1.0.5.
14. **Hai việc UXD vào backlog cải tiến:**
    - R4: cột Giá trị ở **Tham số quy tắc** hiện `true`/`false` và JSON thô → B-QUAY. Không sai sự thật; tên tiếng Việt và câu báo ở V5-21 đủ cho lần chỉnh tham số sắp tới.
    - R1: `msg.checkout_reminder` viết cứng "(trước 12:00)" → B-SAU, làm cùng story mẫu tin nhắn. Chưa có mã nào gọi 4 mẫu `msg.*` (UXD G5), giờ trả phòng đang là 12:00, nên không có chữ sai trước mắt. Khi nối mẫu tin thì dùng `{checkout_time}`, CPY duyệt.

15. **Chữ khách theo CPY review (06/11 tối):**
    - Thẻ 02 (a) vào v1.0.5, bắt buộc, trong V5-23. Báo giá VI gửi khách mỗi ngày, và chữ "căn" ngược FB-INV-002 (không để khách hiểu là căn hộ dịch vụ).
    - Thẻ 02 (b), 06, 07, 08 (mẫu tin `msg.*`, dấu "!", RU) làm cùng lượt C5 trong v1.0.5, mức nên có. Lý do: UXD đang sửa đúng nhóm `TEMPLATES` cho C5, chữ CPY đã viết xong, tách ra thì phải sửa cùng tệp hai lần. Không chặn QC vì chưa có mã nào gọi các mẫu này. UXD R1 (`msg.checkout_reminder`) vẫn ở B-SAU, vì cần mã truyền `{checkout_time}`.
    - Thẻ 02 (c) và C6 (họ `bill.line.*`, "phụ thu" → "phí", "căn" trên dòng phiếu, khóa chưa dùng) vào backlog R5-B-03, đích v1.0.6. Đổi cả họ một lượt, BA sửa sổ tay cùng lúc.
    - BR-012 (khách thấy "The Pine · 401", tên trước số) vào backlog R5-B-04 (B-SAU, cùng US-125). PO và ARC xem cách ghép ở `quotes.service.ts`.

16. **Hai việc BE mới từ DOM (06/11 khuya).**
    - **V5-1B**, tin `hold_expired` gửi thêm lễ tân và lễ tân trưởng: Gói 1, **bắt buộc**, hạn 14/11. Sửa một chỗ cấu hình kèm test, không migration, không đổi hợp đồng. Nó che đúng chỗ hở làm khách đến quầy mà không có phòng. Cách rà bằng sổ giao ca ở Tờ 2a chỉ là lớp tạm cho một người trực.
    - **V5-5B**, ghi tiền khách chuyển về cho đơn đã đóng (`cancelled`, `no_show`, mọi lý do hủy; DOM 11.4 bản chốt) và khôi phục giữ chỗ khi còn căn (BUG-R5-002): Gói 5, **nên có**, không chặn QC. Phần khôi phục cần ARC chốt máy trạng thái và có thể cần migration. Đã có cách làm tay an toàn (DOM mục 11.2). Cần migration mà chưa diễn tập thì sang v1.0.6. Chia phần và đường cắt ở quyết định 20.
17. **Phương án dự phòng ĐK-2 cho V5-30/31** (Gói 3): chưa diễn tập khôi phục thì migration của hai việc này tách sang bản riêng, lên trước 01/12. *Thay bằng quyết định 25 (06/11 khuya): phần không migration cũng vướng ĐK-2 vì V5-62, nên không tách nữa.*
18. **ESC-051 (hoa hồng theo bảng nội bộ, 4 câu, đội đề xuất A) vào danh sách INV quyết ở buổi 20/11** (`rounds/round-04/outputs/PO/esc-pending-06-11.md`), kèm 7 việc INV tự nhập trên Desk sau khi v1.0.5 lên. Hai việc nhập số hoa hồng phải xong trước kỳ chốt 01/12. Tới khi INV trả lời, đội làm theo A (DOM).
19. **V5-25 lên P1, gồm `min_stay` và `weekend_nights`, làm đầu làn BE-C** (06/11 khuya, theo QA BUG-R5-003 và thẻ BE C0313-06).
    - Lý do P1: chỉ một lần lưu sai của MGR hoặc OWN là báo giá, đơn trực tiếp mới và giá web dừng tới hết ngày nghiệp vụ, không gỡ được trên Desk. QC điều 2 đòi 0 P1 mở, nên V5-25 phải xong trong v1.0.5.
    - Không chờ PR hợp đồng: không đổi schema API (thẻ BE 18). ARC thêm dòng mô tả `setParameter` song song. Làn BE-C làm V5-25 trước PR-C1, vì PR-C1 còn chờ V5-73.
    - Luật kiểm `min_stay` theo DOM `rules-v1.0.5.md` mục 12.1–12.3 (gồm chiều ngược ở `short_stay_max_nights`), `weekend_nights` theo DOM 8.4. PO chỉ đặt tiêu chí nghiệm thu.
    - **Không thêm đường sửa trong ngày cho tham số đã có hiệu lực hôm nay; bộ kiểm khi lưu cộng đọc phòng thủ là đủ.** DOM đồng ý (12.5). Lý do:
      - sau khi sửa, Desk và API không còn lưu được dạng làm sập. Giá trị hỏng chỉ vào được bằng đường ngoài API, và đọc phòng thủ làm nó không dừng quầy. "Không sửa được trong ngày" khi đó chỉ còn là luật ở tối thiểu không áp tới hết ngày, không còn là báo giá và đặt phòng dừng cả ngày;
      - mọi tham số, kể cả giá, theo luật "có hiệu lực hôm nay thì không sửa hôm nay", để báo giá và đơn trong ngày cùng một luật và nhật ký đủ. Đổi luật này chạm mọi khóa giá, cần ARC, DOM, SEC; đó là tính năng, không phải sửa lỗi (nguyên tắc 1);
      - giá trị đúng dạng nhưng sai ý (ví dụ 3 đêm thay 2) là sai thao tác như mọi tham số. Cách tránh có sẵn: lưu với Hiệu lực từ ngày mai thì còn Hủy lịch được. Đường sửa trong ngày vào backlog R5-B-06 (B-QUAY) cho INV chọn.
    - Khóa có cấu trúc khác trên đường báo giá, đặt phòng, nhận và trả phòng: rà cùng PR; khóa ngoài các đường đó vào R5-B-05 (B-KYTHUAT).
    - **Không tách bản sớm.** V5-25 không migration nên tách được: qua QA và QC rút gọn, INV đồng ý (nguyên tắc 3, ngoại lệ P1). ORC đề nghị INV tách bản khi có một trong ba điều: (1) INV hoặc quản lý cần đổi một khóa trong PR trước khi v1.0.5 lên; (2) sự cố đã xảy ra; (3) v1.0.5 trễ quá 25/11. Tới đó dùng lời dặn tạm trong release notes v1.0.4.
20. **BUG-R5-002 nối vào V5-5B, chia hai phần; US-085 AC4 vào phạm vi** (06/11 khuya, theo QA BUG-R5-002 và DOM 11.4; sửa lại theo DOM 11.4 bản chốt `e9e0e2e4`).
    - Phạm vi theo DOM: 5B-1 áp cho **mọi đơn đã đóng** (`cancelled`, `no_show`, mọi lý do hủy), dùng lại `recordPayment`. Chỉ FD+, chỉ chuyển khoản hoặc VietQR, ảnh chứng từ bắt buộc, luôn chờ đối soát. Cùng giao dịch tự tạo yêu cầu hoàn 100 %; MGR/OWN duyệt, chỉ chi sau đối soát. Một khoản tiền chỉ ghi một lần. `deposit_after_cancel` sinh khi sale, CTV báo đã chuyển trên đơn đã đóng, thay cho 409. 5B-2 (khôi phục) áp cho mọi đơn bị hủy lúc còn là giữ chỗ, khi căn còn trống và chưa qua ngày đến.
    - US-085 AC4 (vế "tiền về sau khi đã tự hủy") vào 5B-1, không để backlog. Lý do: story đang ghi "Đạt" nhưng vế này chưa có mã; đây là phần làm cho tiền khách không còn nằm ngoài Desk mà không ai biết; AC4 không đổi chính sách; kind `deposit_after_cancel` đã có trong hợp đồng và bảng `attention_event`, nên không cần migration. Backlog US-085 ghi rõ vế còn thiếu.
    - **Phạm vi mở rộng vẫn ở mức nên có, nhưng không còn vừa trọn v1.0.5.** Vẫn nên có vì: P2, có cách làm tạm trong release notes (QC điều 2), không đổi chính sách. Không vừa trọn vì: 5B-1 ước khoảng 2–2,5 ngày BE và 1–1,5 ngày FE-A, cộng một bổ sung hợp đồng (ước của PO, BE xác nhận), trong khi làn BE-B đã kín 09–14/11. Làm theo thứ tự: (1) tự tạo yêu cầu hoàn (luật khoản thu trên đơn đã đóng nay là V5-48, bắt buộc, quyết định 22); (2) nút và hộp ghi trên Desk, lên cùng (1); (3) `deposit_after_cancel` từ tin báo của sale, CTV. Phần nào chưa gộp tới 14/11 thì sang v1.0.6, là việc đầu của bản đó. *Sửa theo quyết định 23:* ARC đã đưa 5B-1 vào 0.3.13 không migration, nên 5B-1 có lịch ở PR-B3 trong v1.0.5; đường cắt mới ở dòng V5-5B.
    - 5B-2 (khôi phục): đích v1.0.6, hợp đồng 0.3.14; ARC xác nhận cần migration nhỏ (kind thông báo), nên theo QC R4 ĐK-2. Tới đó đặt lại cho khách theo cách tay DOM 11.2.
    - Nâng bắt buộc khi QA nâng P1.
    - Kết luận SEC (06/11): (b). Phần luật máy chủ của bước (1) tách thành V5-48, bắt buộc (quyết định 22). 5B-1 thêm tiêu chí S1–S8, 5B-2 thêm tiêu chí SEC mục 4 (dòng V5-5B). 5B-1 có lịch ở PR-B3 (quyết định 23); không kịp thì sang v1.0.6, v1.0.5 vẫn đủ an toàn nhờ V5-48.
21. **Tờ 1 giữ 8,25 pt, không dời khối chữ** (06/11 khuya, theo ORC, sau khi UXD dựng lại bản in `bb67605d`). Chữ Tờ 1 đã qua SEC và DOM; dời khối sang tờ khác thì phải review lại. Tờ 2a thành A4 dọc in riêng 11 pt, Tờ 2b in hai bản trên một A4. Bảng "Cách in và dán" và ghi chú khổ giấy trong `staff-one-pager.md` sửa theo.
22. **V5-48 bắt buộc ở v1.0.5: luật máy chủ cho khoản thu trên đơn đã đóng** (06/11 khuya, theo SEC kết luận (b) cho BUG-R5-002, `rounds/round-05/reviews/SEC-on-bug-r5-002.md` `62103d55`, `406af104`; thẻ FB-R5-SEC-PO-B002-05, Major).
    - Phạm vi: Gói 4, làn BE-B, trong PR-B1 theo hợp đồng 0.3.13 mục 2 (tách PR riêng nếu PR-B1 trễ hoặc PR-B3 cần nền sớm, quyết định 23), không migration, không chờ 5B-1. Trên đơn `cancelled`, `no_show`, mọi vai kể cả OWN: `recordPayment` chỉ nhận chuyển khoản, VietQR; tiền mặt, POS, OTA → 422; thiếu ảnh `deposit_receipt` → 422; luôn chờ đối soát; nhật ký thêm `afterClosure`. `confirmPaymentReceived`, `createVietQr` → 409. Lỗi thì không ghi gì. Chi tiết và tiêu chí nghiệm thu ở dòng V5-48.
    - Lý do bắt buộc: v1.0.4 cho FD+ gọi thẳng API ghi tiền mặt, thẻ không ảnh lên đơn đã đóng rồi tạo yêu cầu hoàn; hộp Xác nhận cọc mở từ trước lúc đơn tự hủy cũng ghi được khoản thu (SEC K5). Sau đó MGR/OWN duyệt hoàn là tiền thật đi ra. Bịt ở máy chủ là phần nhỏ, không đổi chính sách hoàn, không migration, nên là sửa lỗi bảo mật (nguyên tắc 1, Gói 4).
    - Không hotfix (SEC mục 3.4): rủi ro Trung bình, chưa có dấu hiệu bị dùng; tiền ra phải qua MGR/OWN và còn dấu vết trong nhật ký; v1.0.5 dự kiến lên trong khoảng 2 tuần. Không cần ESC.
    - Tới khi V5-48 lên production: lời dặn tạm SEC mục 3.3 cho người duyệt hoàn đặt ở release notes v1.0.4 "Giới hạn đã biết"; ORC đưa lên trang bàn giao của chủ đầu tư. ORC xin INV cho chạy câu đếm chỉ đọc SEC mục 5, trước 10/11 nếu được.
    - Sổ tay quản lý `guides/01` (phần duyệt hoàn): BA chỉ thêm lời dặn này nếu có lần sửa sổ tay trước khi v1.0.5 lên; không thì bỏ, vì V5-71 gỡ cùng lúc. Không làm ngay.
    - Phần còn lại của 5B-1 (tự tạo yêu cầu hoàn, nút Desk, `deposit_after_cancel`) giữ nên có, phải đạt S1–S8 khi lên; 5B-2 theo SEC mục 4.
23. **PR-B3 (5B-1) xếp vào v1.0.5; lịch theo thứ tự PR của hợp đồng 0.3.13 mục 2** (06/11 khuya, theo ARC 0.3.13 bổ sung 1c, PR #94 `2cb549cc`).
    - ARC đưa V5-48 và 5B-1 vào 0.3.13 dưới dạng nhánh đơn đã đóng trong `recordPayment`, kèm `bankReference` tùy chọn, không migration. Lý do "cần bổ sung hợp đồng" của quyết định 20 hết. 5B-1 vẫn nên có (P2, không chặn QC), nhưng có lịch: PR-B3, mục tiêu gộp 14/11.
    - Thứ tự: PR-0 (#94) gộp 07–08/11; song song PR-A1a rồi PR-A1b (BE-A), PR-D1 (BE-D), PR-B1 có V5-48 (BE-B), PR-S1 (BE-S, ≤ 08/11), PR-C2 V5-25 (BE-C, đã chạy từ 07/11, quyết định 19) rồi PR-C1 sau V5-73, PR-H1; sau PR-B1: PR-B2 (V5-16) và PR-B3 (5B-1); PR-M chỉ gộp khi V5-61 đạt (quyết định 17).
    - Trên làn BE-B, PR-B2 làm trước PR-B3: V5-16 thuộc Gói 1 bắt buộc, 5B-1 là nên có (nguyên tắc: phần bắt buộc trước). Để PR-B3 kịp, PO đề nghị ORC giao PR-B3 cho BE-D sau PR-D1, và tách V5-48 thành PR riêng gộp trước để PR-B3 có nền; ARC mục 2 đã cho phép tách.
    - Đường cắt (dòng V5-5B): S5 trước, rồi (3) `deposit_after_cancel`; (1) máy chủ và (2) nút Desk lên cùng nhau hoặc cùng sang v1.0.6. Ô mã giao dịch ở bước đối soát: v1.0.6 (ARC).
    - 5B-2: hợp đồng 0.3.14, v1.0.6, có migration nhỏ (kind thông báo `reservation_restored_after_cancel`), theo QC R4 ĐK-2.
24. **US-177 cho BR-438 (V5-16)** (06/11 khuya, theo ARC 0.3.13 mục 1.20 và rủi ro "BR-438 chưa có story/TC tham chiếu" của hợp đồng). Must, v1.0.5, AC1–AC10 trong backlog, gắn ca DOM T-16-1…10 và ARC T16-6…12. AC10 (thêm theo UXD copy 1.5): bill in cho khách không in lý do "Ghi nhầm" (`entered_in_error`), chỉ in "Miễn phí"; lý do vẫn hiện trên Desk và báo cáo FOC. Lý do: chữ nội bộ, khách không cần đọc, số tiền không đổi, giọng bill giữ điềm tĩnh theo brand guideline. Story không đổi luật: lễ tân, lễ tân trưởng chỉ sửa giảm thẳng dòng mình nhập tay trong ngày nghiệp vụ; mọi ca khác đi FOC có duyệt; hạn mức ESC-007 giữ nguyên. Danh sách đóng ca `lineReductions[]` không chặn nghiệm thu (DOM 7.2 ý 4). Không đếm thêm ở mục 7: nằm trong FB-R4-SEC-BE-A31-01 (V5-16).
25. **V5-61 chưa đạt thì cả v1.0.5 chưa lên production, kể cả phần không migration** (06/11 khuya, theo SEC FB-R5-SEC-OPS-95-02 ý 4, `rounds/round-05/reviews/SEC-on-ops-prs-92-93-95.md`; OPS đồng ý, `40e31795`). Thay phương án dự phòng của quyết định 17.
    - Lý do: phần không migration vẫn có V5-62 (`backup.sh` mới, vòng xoay mới, timer W1), tức là đổi sao lưu, đúng loại QC R4 ĐK-2 chặn. Đổi cách xóa bản sao lưu trước khi chứng minh khôi phục được là rủi ro QC muốn chặn: lỗi vòng xoay có thể xóa bản tốt mà chưa ai biết bản còn lại dùng được không. V5-62 cùng bundle nên khó tách; SEC và OPS cùng chọn làm V5-61 trước, không tách.
    - Hệ quả: hạn 01/12 của V5-30, V5-31 phụ thuộc hoàn toàn vào V5-61. Quy tắc tách V5-30 lúc 25/11 chỉ còn giúp khi v1.0.5 trễ vì lý do khác (bản tách có migration, cũng chờ V5-61). Mốc 25/11 "báo INV ngay" giữ nguyên.
    - Kéo sớm: ORC xin INV hẹn diễn tập V5-61 trong tuần 09–13/11, không chờ hạn 20/11. Việc này nằm trong việc đã chờ INV (30 phút mở khóa `age`), không cần ESC (SEC ý 5). ORC làm cùng buổi việc INV cất bản ngoại tuyến `id_hash_key` (FB-R5-SEC-OPS-95-07).
    - Giữ nguyên: bản sửa P0 không migration, không đổi sao lưu vẫn lên được, kèm sao lưu ngay trước deploy (câu cuối dòng ĐK-2). Bản tách sớm V5-25 của quyết định 19, nếu có, cũng phải cắt từ v1.0.4, không mang V5-62.
    - Release notes v1.0.5 sửa theo: bỏ ý "chỉ diễn tập nếu bản có thay đổi cấu trúc dữ liệu".

## 7. Tổng hợp xếp loại (đếm từ phụ lục)

Đếm bằng script trên các bảng A–G của phụ lục. Mỗi mã ở cột đầu là một mục. Dòng ghi "đã đếm ở…" và mã trùng giữa các mục không đếm lại.

| Nguồn | (a) v1.0.5 | (b) backlog | (c) đóng |
|---|---|---|---|
| A. Lỗi R1–R4 và ghi nhận có gợi ý | 34 | 25 | 64 |
| B. Backlog (story, 5.6, 5.6b) | 6 | 106 (gồm 89 story) | 73 |
| C. Thẻ Minor R4 (111 thẻ; EM-09 đã đếm ở B) | 19 | 27 | 64 |
| D. Việc đã hẹn ở decision-log, release notes, DOM H-list | 32 | 28 | 3 |
| E. Việc ngày 06/11 | 5 | 1 | 4 |
| F. Vận hành (OPS, SEC 06/11 tối) và sổ vận hành (BA) | 29 | 14 | 6 |
| G. Tham số lệch sổ tay | 1 | 2 | 10 |
| **Tổng (553 mục)** | **126** | **203** | **224** |

**Điều chỉnh sau cổng QC đóng R4 (PO, ORC 06/11 tối, phụ lục I).** Bảng trên giữ đúng số QC đã kiểm. Tác động nếu đếm lại:
- BUG-R3-047 (a) → (c) (PO);
- BUG-R1-023 (c) → (a) (ORC `09fd9cc4`, theo QA V5-02; BA sửa ở Gói 0, không có mã V5 riêng);
- thêm 2 mục (b): hai cảnh báo Dependabot;
- thêm 1 mục (a): runbook sự cố SR-INC-01 (V5-74);
- thêm 4 mục (a) từ báo cáo UXD: 3 khóa mục 4.19 (vào V5-23), `weekend_nights` (V5-25);
- thêm 2 mục (b) từ báo cáo UXD: R4 (B-QUAY), R1 (B-SAU);
- thêm 2 mục (a) và 2 mục (b) từ review CPY (quyết định 15);
- thêm 2 mục (a) từ DOM: V5-1B, V5-5B (quyết định 16);
- thêm 1 mục (a) từ QA: BUG-R5-003, gộp V5-25 (quyết định 19). US-085 AC4 đã nằm trong BUG-R5-002 (V5-5B-1) nên không đếm thêm;
- thêm 2 mục (b): R5-B-05 (B-KYTHUAT), R5-B-06 (B-QUAY) (quyết định 19);
- thêm 1 mục (a) từ SEC: FB-R5-SEC-PO-B002-05, việc mới V5-48 (quyết định 22). US-177 (story cho BR-438) nằm trong FB-R4-SEC-BE-A31-01 (V5-16), không đếm thêm (quyết định 24).

Khi đó có 572 mục: 137 (a), 211 (b), 224 (c). Số việc V5 thành 64 (thêm V5-48; V5-5B chia 5B-1, 5B-2 vẫn là một việc); Gói 4 có 9 việc, Gói 5 có 13 việc.

126 mục (a) được gom thành 59 việc V5-xx ở mục 2. Gói 5 có 12 việc (gồm V5-19) và không chặn QC; riêng V5-19 có điều kiện kích hoạt. Mục (c) "QA xác nhận" chỉ đóng hẳn khi QA chuyển Closed ở V5-02.

---

## Phụ lục – Xếp từng mục: (a) v1.0.5 · (b) backlog cải tiến · (c) đóng/bỏ

Cách đọc: cột "Xếp" có đúng một nhãn. Với (a), cột cuối là mã việc V5-xx. Với (b), cột cuối là nhóm backlog (mục G). Với (c), cột cuối là lý do. Dòng có nhiều mã thì mỗi mã là một mục. Trạng thái lấy theo bằng chứng trong repo tới 06/11 tối (bug list, phản hồi, review lượt sau, decision-log, plan v1.0.4). Mục ghi "(c) … QA xác nhận" đóng khi QA chuyển Closed ở V5-02.

### A. Lỗi còn mở

#### A1. Round 4 – `rounds/round-04/qa/bug-list.md`

| Mã | P | Nội dung | Xếp | Mục / lý do |
|---|---|---|---|---|
| BUG-R4-010 | P3 | Sổ tay chưa có cách trả lời khách ko/zh/ru | (c) | `02-le-tan` 13.1d đã có; QA xác nhận |
| BUG-R4-011 | P2 | Tạo nhanh hồ sơ từ yêu cầu Zalo bị 422 | (c) | Sửa ở LP-v2, đã lên 06/11; đóng khi P10 trên Desk đạt (V5-03) |
| BUG-R4-012 | P3 | Hồ sơ tạo nhanh lưu quốc tịch VN | (c) | Như BUG-R4-011 |
| BUG-R4-015 | P3 | Hủy giá hẹn đầu tiên làm căn mất giá | (c) | Sửa ở v1.0.4 (V4-08); QA xác nhận |
| BUG-R4-017 | P3 | Font chữ Nga bị CSP chặn | (a) | V5-24 |
| BUG-R4-020 | P3 | Desk chưa có Đặt lại xác thực 2 bước | (c) | Có ở v1.0.4; QA xác nhận |
| BUG-R4-023 | P3 | Email ngắt giữa chữ ở 1440 px | (c) | Sửa ở v1.0.4; chụp lại C1-07, C1-22 (V5-04) rồi QA đóng |
| BUG-R4-024 | P3 | Hộp S2 chỉ có ô mật khẩu báo sai câu | (c) | Sửa ở v1.0.4; QA xác nhận |
| BUG-R4-025 | P3 | Release notes v1.0.2 hứa sai về B18 | (c) | PO sửa 04/11; phần BR-428 và chữ Desk vào v1.0.4; QA xác nhận |
| BUG-R4-026 | P3 | Mã thô `overpayment` ở cột Lý do | (c) | Sửa ở v1.0.4 (P4-41); QA xác nhận |
| BUG-R4-054 | P3 | Basic auth staging chặn form | (b) | B-OPS. SEC duyệt A+ có điều kiện (054-02…05), nhưng PO không đưa vào v1.0.5 (mục 6). Tới khi làm: thử form staging bằng cách C của README 12.3. Phần bảo mật đi kèm (054-01) ở V5-67 |
| BUG-R4-056 | P3 | Kịch bản thử SEC 9.5 ca 10 sai giả định (tài liệu thử) | (c) | QA sửa S6b.3; SEC sửa câu ca 10 ở 9.5 và chấp nhận bằng chứng thay thế 06/11 (`SEC-on-lp-v2-s6d.md` mục 7). QA chuyển Closed (V5-03) |
| BUG-R4-057 | P3 | API tự tính giá đêm = giá tháng ÷ 12 khi không gửi giá đêm, không cảnh báo | (a) | V5-1A (Desk không đi đường này) |

#### A2. Round 4 – `rounds/round-04/qa/bug-list-v1.0.4.md`

| Mã | P | Nội dung | Xếp | Mục / lý do |
|---|---|---|---|---|
| BUG-R4-036 | P2 | Không có nút Trả phòng lúc 00:00–05:59 | (a) | V5-10 |
| BUG-R4-040 | P3 | Câu sàn–trần hiện `{min}`, `{max}` | (a) | V5-22 |
| BUG-R4-041 | P2 | Giữ chỗ bỏ giá đã gõ (phần còn lại) | (a) | V5-14 (phần khóa nút đã có ở v1.0.4) |
| BUG-R4-043 | P2 | Cờ `is_complimentary` theo kênh | (a) | V5-17 |
| BUG-R4-051 | P2 | Giờ gõ trước 06:00 bị đọc là sáng hôm sau | (a) | V5-10 |
| BUG-R4-052 | P3 | Tổng cộng chưa gồm đêm thêm | (a) | V5-12 |
| BUG-R4-032 | P2 | Sổ tay thiếu đường Đặt lại 2 bước | (c) | #63 đã gộp; #69 còn mở (QA 06/11): BA gộp ở Gói 0 cùng V5-08, rồi MN-02; QA đọc lại và đóng |
| BUG-R4-029, BUG-R4-030, BUG-R4-031, BUG-R4-033, BUG-R4-034, BUG-R4-035, BUG-R4-037, BUG-R4-038, BUG-R4-039, BUG-R4-042, BUG-R4-044, BUG-R4-045, BUG-R4-046, BUG-R4-047, BUG-R4-048, BUG-R4-049, BUG-R4-050, BUG-R4-053 | P0–P3 | Đã gộp `main`, có trong `sha-6414be25f20d` trên production; bug list còn ghi "đã gộp / chờ staging" | (c) | QC v1.0.4 ĐẠT CÓ ĐIỀU KIỆN; QA xác nhận và chuyển Closed (V5-02). Riêng BUG-R4-035, 039: QC v1.0.4 còn ghi P1 mở, QA kiểm lại trên production |

#### A3. Round 3 – `rounds/round-03/qa/bug-list.md`

| Mã | P | Nội dung | Xếp | Mục / lý do |
|---|---|---|---|---|
| BUG-R3-016 | P3 | Báo giá khách đến hôm nay không chuyển thành đơn | (b) | B-QUAY. Có cách làm: lễ tân nhập lại |
| BUG-R3-018 (phần 1) | P2 | Danh sách giá hẹn và nút hủy | (c) | Có ở v1.0.2 |
| BUG-R3-021 (phần Desk) | P2 | Không có ô nhập Wi-Fi trên Desk | (a) | V5-58 |
| BUG-R3-023 (phần lọc) | P2 | Đổi phòng liệt kê căn chưa dọn | (a) | V5-50 |
| BUG-R3-024 | P3 | Trang trả phòng mở trước ngày đi, ghi trùng minibar | (c) | Vào v1.0.4 (gói (5)); QA xác nhận |
| BUG-R3-025 | P3 | Xác nhận cọc thiếu ô Mã giao dịch | (a) | V5-51 |
| BUG-R3-026 | P3 | App nhân viên thiếu loại sự cố "Tắc thoát nước", "Wi-Fi" | (b) | B-QUAY. Có loại "Khác" |
| BUG-R3-027 | P3 | Trang khách mở lại link mất danh sách bổ sung | (a) | V5-5A (check-in online mở lại 06/11) |
| BUG-R3-028 | P3 | Chữ lộ "Round 3", nhãn sai, hạn báo giá 00:00 / 23:59 | (a) | V5-23 |
| BUG-R3-029 | P3 | App nhân viên hiện hai câu 2 bước trái nhau | (c) | v1.0.4 có đăng nhập 2 bước trên app nhân viên (ARC-RN103-02); QA xác nhận, còn lỗi thì mở lại |
| BUG-R3-030 | P3 | Dòng miễn bị từ chối hiện số âm | (a) | V5-52 |
| BUG-R3-031 | P3 | Nút Hoàn tác nhận phòng mở khi folio có dòng mới | (b) | B-QUAY. Máy chủ chặn đúng (409) |
| BUG-R3-032 | P1 | (lỗi P1 của v1.0.3) | (c) | Sửa ở v1.0.3. Fixed, chưa Closed (QA 06/11): chờ SEC V3-07, tức bật `EMAIL_NO_RECIPIENT_ALERT` theo QC v1.0.3 ĐK12 (SEC xem số, INV đồng ý trong chat) |
| BUG-R3-034 | P3 | Mục "tiền dư đơn đã đóng" còn tới khi đóng folio | (b) | B-QUAY |
| BUG-R3-035 | P3 | Phiếu ghi "Phụ thu trả muộn (00:15)" cho khoản bằng 1 đêm | (a) | V5-23 |
| BUG-R3-036 | P3 | Phí hủy, phí không đến 00:00–05:59 mang ngày lịch | (a) | V5-11 |
| BUG-R3-040 | P3 | Bản ghi audit bootstrap thiếu trường | (c) | Chỉ ghi nhận; nhật ký chỉ ghi thêm; không lặp lại từ v1.0.0 |
| BUG-R3-041, BUG-R3-042, BUG-R3-043, BUG-R3-044, BUG-R3-045, BUG-R3-046, BUG-R3-052, BUG-R3-053 | P1–P3 | Nhóm giữ chỗ quá hạn, chữ, app | (c) | Vào v1.0.4 (backlog 5.6, plan v1.0.4); QA xác nhận |
| BUG-R3-047 | P3 | Giữ chỗ hiện nút link check-in online | (c) | Đã sửa ở v1.0.4 (`5539b7e6`); QA xác nhận ở V5-02. Sửa từ (a) V5-53 ngày 06/11 tối (phụ lục I) |
| BUG-R3-048 | P3 | Máy chưa cấp quyền: toast sai lý do | (a) | V5-53 |
| BUG-R3-049 | P3 | SĐT nước ngoài sai nhóm số | (a) | V5-54 |
| BUG-R3-050 | P3 | Hồ sơ tạo nhanh từ yêu cầu EN | (c) | Đã tách thành BUG-R4-011, 012 (đã sửa) |
| BUG-R3-051 | P3 | Banner công tắc ghi "mở chat Zalo" khi landing đã có form | (a) | V5-23 |
| BUG-R3-054 | P3 | Yêu cầu web quá hạn chỉ đổi màu | (a) | V5-55 |
| BUG-R3-055 | P3 | Sau xóa theo yêu cầu, ghi sai lý do "theo hạn lưu" | (a) | V5-23 |
| BUG-R3-056 | P2 | INV không thấy Xóa theo yêu cầu người gửi | (a) | V5-56 |

#### A4. Round 2 – `rounds/round-02/qa/bug-list.md`

| Mã | P | Nội dung | Xếp | Mục / lý do |
|---|---|---|---|---|
| BUG-R2-074 | P2 | Ô Ngân hàng nhận chỉ nhận mã BIN | (b) | B-TIEN, v1.1 (cần danh sách ngân hàng VietQR) |
| BUG-R2-099 | P3 | Hiện mã BIN thay tên ngân hàng | (b) | B-TIEN, cùng gốc 074 |
| BUG-R2-123 | P3 | `move-preview` thiếu `overbookingResolution` | (b) | B-TIEN, v1.1 lượt tiền phần 2 |
| BUG-R2-075 | P3 | Ô "Khách đứng tên" đỏ sai sau Tạo nhanh khách | (b) | B-QUAY. Vẫn tạo đơn được |
| BUG-R2-077 | P3 | Không tìm đơn theo tên khách | (a) | V5-57 |
| BUG-R2-079 | P3 | Phím Esc không đóng khung chi tiết | (b) | B-QUAY |
| BUG-R2-082 | P3 | Nút phát sinh chưa chọn sẵn khoản | (a) | V5-59 |
| BUG-R2-086 | P3 | Chip đè nút "Ẩn số" | (b) | B-QUAY |
| BUG-R2-092 | P3 | Dòng đỏ giờ nhận không tự mất | (b) | B-QUAY |
| BUG-R2-094 | P3 | Ô tìm người đi cùng mang nhãn "Khách đứng tên" | (a) | V5-23 |
| BUG-R2-096 | P3 | Câu "phí phạt" hiện cho mọi khoản | (a) | V5-23 |
| BUG-R2-098 | P3 | Hộp mật khẩu ghi "xem giấy tờ" khi xem số tài khoản | (a) | V5-23 |
| BUG-R2-100 | P3 | Cột Lý do hiện mã thô | (a) | V5-23 |
| BUG-R2-214 | P3 | Chip "Cần nhập thông tin" đè ở H13 | (b) | B-QUAY |
| BUG-R2-215 | P3 | PWA còn việc minibar dưới "Khách đang ở" sau trả phòng | (b) | B-QUAY |
| BUG-R2-217 | P3 | Dòng giữ chỗ sắp hết hạn thiếu mã đơn | (a) | V5-59 |
| BUG-R2-218 | P3 | Trang khách ghi "ngôn ngữ theo trình duyệt" sai | (a) | V5-23 |
| BUG-R2-220 | P3 | Tìm thứ Sáu 1 đêm cho báo giá rồi mới báo tối thiểu 2 đêm | (b) | B-QUAY. UXD xem có cố ý không |
| BUG-R2-221, BUG-R2-222 | P3 | Lỗi của bộ test trên staging | (b) | B-KYTHUAT. Không gắn bản; QA sửa khi cần |
| BUG-R2-097, BUG-R2-103, BUG-R2-216, BUG-R2-219 | P3 | Hiển thị tiền | (c) | Vào v1.0.4; QA xác nhận |

#### A5. Round 1 – `rounds/round-01/qa/bug-list.md`

| Mã | Xếp | Lý do |
|---|---|---|
| BUG-R1-010, BUG-R1-014, BUG-R1-015, BUG-R1-016, BUG-R1-017, BUG-R1-020, BUG-R1-021, BUG-R1-022, BUG-R1-SEC-06, BUG-R1-SEC-07, BUG-R1-SEC-08, BUG-R1-SEC-10, BUG-R1-SEC-11 | (c) | Đã xử lý ở Round 2–3: kế hoạch R2 W1, W4, W5, W6, W11, W15–W18; decision-log 16/10; hợp đồng, CI và test case R3. Bug list R1 chưa được cập nhật. QA chuyển Closed (V5-02) |
| BUG-R1-023 | (a) | Chưa sửa (QA 06/11): `product/docs/rbac-matrix.json` còn mục `openapi_check.differences` và ghi chú A22 cũ. BA sửa ở Gói 0, QA đóng |

#### A6. Ghi nhận có gợi ý trong bug list R4 (không phải lỗi)

Chỉ liệt kê ghi nhận có đề xuất việc làm. Ghi nhận "đúng thiết kế" không có việc nên không liệt kê.

| Mã | Nguồn | Nội dung | Xếp | Mục / lý do |
|---|---|---|---|---|
| GN-R4-publicRoomType | `bug-list.md` mục 3 | Máy chủ chưa kiểm danh sách `publicRoomType` (Desk đã khóa bằng danh sách; chỉ OWN gọi được) | (b) | B-KYTHUAT |
| GN-R4-mock-phone | `bug-list.md` mục 3 | Ảnh FE `lp-v2-fe2-*` dùng SĐT mock đúng dạng số thật | (b) | B-KYTHUAT. FE đổi sang dải `+84 900 000 xxx` khi chụp lại |
| GN-R4-notice-log-indent | `bug-list.md` mục 3 | Dòng NOTICE thứ 2 trở đi trong `privacy-notice.log` không thụt lề | (c) | Thẩm mỹ, `deploy-landing` đọc đúng. OPS chỉnh nếu chạm tệp ở V5-66 |
| GN-R4-quote-locale-flicker | `bug-list.md` mục 3 | Mở lại báo giá, Desk hiện tiếng Việt dưới 1 giây rồi mới đổi ngôn ngữ; bấm Sao chép ngay có thể chép nhầm bản | (b) | B-QUAY |
| GN-R4-S35-1366 | `bug-list.md` mục 3 | Bảng S35 cuộn ngang ở 1366 px | (c) | Đã gộp vào BUG-R4-007 (phần cột đã sửa; phần còn lại ở B-SAU) |
| GN-R4-early-clock | `bug-list.md` mục 3 (PR #22) | Hộp Trả sớm lấy giờ trình duyệt; sai khi E2E dùng đồng hồ giả | (b) | B-KYTHUAT. Production không gặp |
| GN-R4-notice-0-days | `bug-list.md` mục 3 (PR #22) | Bill ghi "báo trước 0 ngày" thay vì "báo cùng ngày" | (b) | B-QUAY. UXD xem câu |
| GN-R4-mfa-clock-reset | `bug-list.md` mục 3 (PR #31) | `/__test__/clock reset` chưa hạ `mfa_last_used_step` cho E2E | (b) | B-KYTHUAT |
| GN-R4-email-break-1024 | `bug-list.md` mục 3 (PR #31) | Ngắt email giữa chữ ở 1024 px | (c) | Đã nâng thành BUG-R4-023 |
| GN-V104-content-guide-1335 | `bug-list-v1.0.4.md` "Ghi chú" | Content guide còn câu cũ `rooms.night_auto` | (a) | V5-23 |
| GN-V104-fo-tabs-holds | `bug-list-v1.0.4.md` "Ghi chú" | Khóa chữ `fo.tabs.holds` không còn dùng | (a) | V5-23 |
| GN-V104-P4-32 | `bug-list-v1.0.4.md` "Ghi chú" | TC-V104-CO-03 N/A, dời v1.0.5 | (a) | V5-13 |
| GN-V104-HD-27-SSE | `bug-list-v1.0.4.md` "Ghi nhận 06/11" | Chưa có test riêng cho sự kiện SSE `hold_overdue_cap` (BE thêm 1 assert) | (b) | B-KYTHUAT |
| GN-V104-enter-submits | `bug-list-v1.0.4.md` #75 | Enter trong ô giá gửi form Tạo đơn ngay | (b) | B-QUAY. UXD cân nhắc |
| GN-V104-QR-green-box | `bug-list-v1.0.4.md` #60 | Hộp xanh "Gửi mã QR" trên câu đỏ | (a) | V5-23 (đã đếm ở mục D) |

### B. Backlog `03-backlog/backlog.md`

#### B1. Story

| Mã | Xếp | Lý do / nhóm |
|---|---|---|
| US-008, US-043, US-048, US-135, US-143, US-155 | (c) | Đã chạy trên production v1.0.x; bảng còn ghi "Mới" hoặc "Đang nghiệm thu". PO cập nhật (V5-06). Riêng US-135 AC3 → B-SAU (v1.1) |
| US-131, US-174, US-175 | (c) | LP-v2 lên production 06/11 qua cổng QC và runbook LP-v2, giá web bật |
| US-156 | (c) | Đã gộp vào US-174 |
| US-095, US-096, US-099, US-128, US-141, US-145, US-164, US-165, US-166, US-167, US-168, US-169, US-170, US-171, US-172, US-173 | (b) | B-SAU, đích v1.1. Gồm channel manager (US-096) và chấm công EP20 (US-165–173, ESC-037) |
| US-014, US-034, US-040, US-100, US-101, US-102, US-104, US-111, US-123, US-125, US-126, US-138, US-161, US-162 | (b) | B-SAU, đích v1.2. Gồm xuất báo cáo (US-104, cùng BUG-R4-007 phần xuất) và tin tự gửi (US-126) |
| US-041, US-056, US-064, US-065, US-081, US-088, US-089, US-114, US-115, US-122, US-124, US-133, US-134, US-140 | (b) | B-SAU, đích v1.3. Gồm báo giá thuê tháng (US-081, H7) và nhắc tiền thuê (US-064, H8) |
| US-009, US-013, US-015, US-033, US-051, US-058, US-059, US-060, US-063, US-067, US-068, US-069, US-070, US-074, US-075, US-076, US-077, US-078, US-079, US-090, US-091, US-092, US-093, US-094, US-097, US-098, US-103, US-105, US-113, US-116, US-117, US-118, US-121, US-127, US-129, US-130, US-132, US-137, US-144, US-157, US-158, US-159, US-160, US-163, US-176 | (b) | B-SAU, "R4+ xếp lại theo feedback". INV chọn ở review định kỳ |

#### B2. Mục 5.6 – việc ngoài story

| Mã | Xếp | Lý do / mục |
|---|---|---|
| ARC-RN103-02, FB-R4-SEC-ARC-EM-09, FB-R4-SEC-OPS-PR32-02, FB-R4-SEC-OPS-PR32-S1, FB-R4-ARC-OPS-PR30-09, FB-R4-SEC-OPS-PR32-S2, FB-R4-SEC-OPS-PR30-10, FB-R4-ARC-OPS-PR30-10, FB-R4-ARC-OPS-PR30-08, FB-R4-ARC-OPS-PR32-06, FB-R4-OPS-ARC-31-01, D1-digest, FB-R4-INT-BE-31-04, FB-R4-INT-BE-31-05, FB-R4-SEC-BE-018-01, FB-R4-SEC-BE-018-02, FB-R4-ARC-BE-018-03, FB-R4-ARC-BE-018-04, FB-R4-SEC-ARC-018-03, FB-R4-SEC-BE-018-04, FB-R4-CPY-INT-05, FB-R4-CPY-INT-03, FB-R4-UXD-FE-EM-07, FB-R4-UXD-FE-EM-13, FB-R4-UXD-FE-EM-14, FB-R4-UXD-FE-EM-15, V3-08, V3-09, V3-04, FB-R4-PO-DOM-PR25-01, FB-R4-SEC-DOM-01, FB-R4-SEC-OPS-01, FB-R4-DOM-BA-M18-08, FB-R4-QA-DOM-PR25-01, FB-R4-ARC-BE-PR24PM-01, FB-R4-ARC-BE-PR24PM-03, FB-R4-ARC-BE-PR24PM-04, FB-R4-SEC-OPS-PR33-S3, FB-R4-ARC-BA-M18-01, UXD-L1-font, GN-R4-QA-01, GN-R4-QA-03, RN025-02, BA-025-superseded, SEC-SENT-02, DOM-FE-A-01, DOM-BE-A-04, FB-R4-ARC-BE-A-ED-02, FB-R4-ARC-BE-PR29-01, FB-R4-SEC-BE-PN01-01, FB-R4-SEC-BE-PN01-02, FB-R4-SEC-BE-PN01-03, FB-R4-SEC-BE-PR24-03, ETag-6-gzip, US-131-AC1-AC3, US-157-AC1, FB-R4-DOM-BA-06 | (c) | Đã vào v1.0.4, LP-v2 hoặc v1.0.3 theo plan v1.0.4 (gói P4-xx) và plan LP-v2; QC các bản ĐẠT CÓ ĐIỀU KIỆN; đang chạy trên production. FB-R4-DOM-BA-06: sổ tay `02` đã có bước đóng phòng trên extranet |
| FB-R4-SEC-BE-01, FB-R4-SEC-ORC-01 (G3) | (a) | V5-30 |
| Hạn lưu ảnh giấy tờ 3 tháng | (a) | V5-45 |
| Theo dõi 422 `ID_NUMBER_DETECTED` | (a) | V5-07 |
| Chữ Desk "nằm ngoài khoảng" cho giá trị chữ | (a) | V5-21 |
| FB-R4-ARC-BE-31-04 | (b) | B-KYTHUAT (Suggestion; v1.0.4 "nếu kịp") |
| GN-R4-QA-02 | (b) | B-SAU, theo H9 / v1.3 |
| FB-R4-DOM-BA-025-07 (ghi chú duyệt lúc khách ở) | (b) | B-QUAY, không bắt buộc |
| SEC-SENT phần (4) | (b) | B-BAOMAT: điều kiện trước story thư cho khách (cùng FB-R4-SEC-PO-SENT-03) |
| FB-R4-ARC-BE-A-ED-03 | (b) | B-TIEN, v1.1, trước khi B16 thêm luật HĐ tháng |
| FZ-08 | (b) | B-TIEN, v1.1 lượt tiền phần 2 |
| US-135 AC3 | (b) | B-SAU, v1.1 |
| Critic Minor sau G1 | (b) | B-KYTHUAT. Không còn mục cụ thể mở; xem lại ở review |
| Hộp Trả sớm 1440 × 900 | (b) | B-QUAY, theo dõi |
| BUG-R2-210 | (c) | SEC Verified; QA chuyển Closed |
| BUG-R4-001, BUG-R4-006, BUG-R4-007 (phần cột, lọc, đếm), BUG-R4-008 (câu Desk, ngôn ngữ vào hồ sơ), BUG-R4-009 | (c) | Đã sửa và đóng trong gói LP-v2 |
| BUG-R4-007 (phần báo cáo, xuất) | (b) | B-SAU, cùng US-104 (v1.2) |
| BUG-R4-008 (lưu riêng `ko`/`zh` trong hồ sơ) | (b) | B-KYTHUAT. Tra được từ yêu cầu liên kết |

#### B3. Mục 5.6b

| Mã | Xếp | Lý do / mục |
|---|---|---|
| FB-R4-SEC-BA-104-09 (b), G-ARC-NV-4 (`SECURITY_AUDITED_KEYS`) | (b) | B-PN: bắt buộc trước bản thông báo dữ liệu kế tiếp |
| FB-R4-SEC-FE-P434-03, FB-R4-UXD-FE-P434-04, FB-R4-ARC-BE-C-P416-01, FB-R4-ARC-BE-C-P416-02 | (b) | B-KYTHUAT (Suggestion) |
| Backlog 06/11: ô nhập `ota_base_rate` theo nhóm căn | (a) | V5-21, thu gọn (mục 6) |

### C. Thẻ feedback Minor còn mở hoặc đã dời trong `rounds/round-04/reviews/`

Danh sách lấy bằng script: thẻ Minor không có dấu xử lý ở chính thẻ hoặc ở dòng có mã thẻ. Có 111 thẻ. PO đã rà từng thẻ trong phản hồi, review lượt sau, báo cáo vai và decision-log. Nhiều thẻ đã xử lý nhưng tệp review chưa sửa dòng trạng thái; với những thẻ đó, cột lý do ghi nơi có bằng chứng.

| Thẻ | Nội dung ngắn | Xếp | Mục / lý do |
|---|---|---|---|
| FB-R4-ARC-BE-018-02 | Câu báo cáo BE về `field` reauth | (c) | Chỉ là câu trong báo cáo của lỗi đã đóng (BUG-R4-018, 022); mã đúng |
| FB-R4-ARC-FE-018-01 | Tên `field` của STRONG_REAUTH khác theo op | (c) | Done (`responses/FE-on-ARC-BUG-R4-018-022.md`) |
| FB-R4-ARC-FE-LPV2-02 | Landing dùng kiểu hợp đồng viết tay | (b) | B-KYTHUAT |
| FB-R4-ARC-FE-LPV2-03 | Xung đột chữ ngày khi gộp `main` vào `lp-v2` | (c) | LP-v2 đã gộp `main`, không còn hai nhánh |
| FB-R4-ARC-FE-LPV2-04 | Chưa có Lighthouse CI | (b) | B-OPS |
| FB-R4-ARC-ARC-LPV2-01 | Luật cho `@ottimo/contracts` | (c) | Done (`ARC-on-LP-v2-ops.md`) |
| FB-R4-ARC-ARC-LPV2-02 | Ví dụ hợp đồng trái luật; quốc tịch NULL | (b) | B-KYTHUAT |
| FB-R4-ARC-BE-LPV2-11 | SĐT `messagingHandles` thiếu `+` | (b) | B-KYTHUAT, ARC hẹn v1.1 |
| FB-R4-ARC-DATA-LPV2-01 | Quốc tịch NULL làm `is_foreigner = false` trong chỉ số | (b) | B-DATA, trước báo cáo theo quốc tịch đầu tiên |
| FB-R4-ARC-FE-LPV2-06 | Bản nháp cũ thay prefill từ yêu cầu web | (c) | Done (`outputs/FE/lp-v2-fe.md` 11.1) |
| FB-R4-ARC-OPS-LPV2-02 | `turbo dev` thiếu build gói | (c) | Done, ARC đóng (K16) |
| FB-R4-ARC-UXD-LPV2-01 | Sửa tay JSON chữ sinh ra | (c) | Done (CI "Copy is generated") |
| FB-R4-ARC-OPS-PR23-03 | Dạng dòng log mới | (c) | OPS xong ở PR #26, README ở PR #24 |
| FB-R4-ARC-BE-PR24PM-02 | Bước xóa ngày nuốt số viết từng cặp | (c) | ARC ĐẠT (P4-14 giai đoạn A) |
| FB-R4-ARC-BE-PR29-02 | Trigger nhận mọi `superseded_at` | (c) | Sửa ở P4-13 (migration 0095), v1.0.4 |
| FB-R4-ARC-BE-31-01 | Thư `owner` gửi OWN mọi cơ sở | (b) | B-MP |
| FB-R4-ARC-OPS-V102RB-02 | Runbook v1.0.2 thiếu chỉ dẫn hai ca | (c) | Runbook bản đã phát hành; ý còn giá trị gộp vào V5-70 |
| FB-R4-ARC-OPS-P403-09 | Câu chữ S14, dòng rỗng trên Mac | (c) | Runbook v1.0.4 đã chạy; gộp vào V5-70 |
| FB-R4-ARC-OPS-P404-08 | `db_triggers` coi thiếu trigger là ok | (c) | Done, ARC Verified (r1.1) |
| FB-R4-ARC-OPS-P404-09 | `email_config` lệch `smtp.ts` | (c) | Runbook v1.0.4 ghi đã khớp `smtp.ts` |
| FB-R4-ARC-OPS-P404-10 | SQL mốc P2 | (c) | Runbook v1.0.4 một lần |
| FB-R4-ARC-OPS-P404-11 | Thứ tự gộp PR-A, PR-M | (c) | v1.0.4 đã gộp xong |
| FB-R4-ARC-BE-B-P410-02 | Giữ chỗ quá hạn trước lúc lên bản | (c) | Done (OPS P4-04, câu đếm R3b) |
| FB-R4-ARC-OPS-P413-01 | Số migration 0095 trong README | (c) | ARC Verified |
| FB-R4-ARC-DOM-B16-01 | Trả sớm sau nửa đêm hoàn đêm đã ở | (a) | V5-11 |
| FB-R4-ARC-FE-P432-02 | Mock hoàn tiền rộng hơn máy chủ | (a) | V5-13 |
| FB-R4-ARC-FE-P432-04 | Không chỉ sang Trả sớm trước ngày đi | (a) | V5-10 |
| FB-R4-ARC-BE-PR71-03 | Đêm Nội bộ chặn 0 đ nhưng nhận 1 đ | (b) | B-TIEN, cùng "Đơn Nội bộ theo vai" |
| FB-R4-ARC-BE-PR73-01 | Máy chủ không có báo giá kênh OTA | (b) | B-TIEN |
| FB-R4-ARC-FE-PR75-01 | Ô giá sửa được khi đang giữ chỗ | (a) | V5-14 |
| FB-R4-ARC-FE-PR77-03 | Test kiểm nhánh `ROOM_OCCUPIED` không còn | (b) | B-KYTHUAT |
| FB-R4-ARC-FE-PR82-02 | Đổi số người không tính lại bảng tổng | (a) | V5-20 |
| FB-R4-DOM-UXD-PR82-01 | Chữ BR-107 và hướng dẫn Nội bộ | (c) | Done ở #82 |
| FB-R4-ARC-OPS-RB2-03 | Giờ D của diễn tập r2 | (c) | Diễn tập một lần, đã qua |
| FB-R4-ARC-OPS-RB2-04 | M4a không còn nguyên văn P2 | (a) | V5-70 |
| FB-R4-ARC-OPS-RB2-05 | Câu đếm "giới hạn đã biết" thiếu lọc | (a) | V5-70 |
| FB-R4-BA-DOM-PR25-02 | Nhãn quy ước mục 0.1 | (c) | Làm ở P4-20 (plan v1.0.4); QC v1.0.4 ĐẠT CÓ ĐIỀU KIỆN |
| FB-R4-BA-DOM-PR25-03 | Nhãn `INV-043` cho BR-115 | (c) | Làm ở P4-20 |
| FB-R4-BA-DOM-PR25-04 | Phí dịch vụ kỳ đầu mang nhãn giả định | (c) | Nhãn làm ở P4-20. Con số chờ INV, đi cùng H7 (B-TIEN) |
| FB-R4-BEA-ARC-03 | Ngoại lệ `null` ở `updateUser` | (b) | B-KYTHUAT (chữ hợp đồng) |
| FB-R4-BEA-ARC-04 | Ca tạm `serializer.test.ts` dùng khóa cũ | (c) | `be-identity` đã gộp với khóa `schema:` / `op:` |
| FB-R4-DOM-BA-PR72-07 | Đêm đầu miễn phí sau nhận sớm | (c) | Sổ tay `01`, `02`, sổ tay chung đã có câu |
| FB-R4-DOM-BA-PR85-04 | Quá 12:00 mới Trả phòng | (c) | DOM đóng ở #89 |
| FB-R4-DOM-BA-PR85-05 | Câu "hạn ghi trễ" | (c) | DOM đóng ở #89 |
| FB-R4-INT-BE-31-03 | Chưa có test khóa dạng `idempotencyKey` | (b) | B-KYTHUAT |
| FB-R4-PO-BA-032-06 | Các điểm sổ tay v1.0.4 ngoài BUG-R4-032 | (c) | Làm ở #68 |
| FB-R4-PO-BA-P420-01 | Đặc tả EP02 ghi người nhận `hold_expired` cũ | (b) | B-KYTHUAT (tài liệu) |
| FB-R4-PO-DOM-P420-01 | Ký quỹ HĐ trên 24 tháng là chính sách cọc | (b) | B-TIEN. Khi có khách hỏi, sale ghi "chờ chủ đầu tư duyệt"; gom ESC ở review nếu cần |
| FB-R4-QA-DOM-PR25-03 | Nhãn BR-207 và BR-210 mâu thuẫn | (c) | Làm ở P4-20 |
| FB-R4-QA-DOM-PR25-04 | Oracle thiếu ca biên | (c) | Làm ở P4-20 |
| FB-R4-QA-DOM-PR25-05 | Oracle BR-428 còn chỗ hở | (c) | Làm ở P4-20; ca sau nửa đêm thêm ở V5-11 |
| FB-R4-SEC-BE-03 | Desk chưa hiện giá "từ – đến" (SEC 9.5 ca 4) | (a) | V5-19 |
| FB-R4-SEC-OPS-PR23-03 | B4 của runbook v1.0.1 | (c) | Runbook v1.0.1 đã chạy |
| FB-R4-SEC-OPS-PR23-04 | WARNING bị `tail -4` cắt | (c) | SEC Đóng |
| FB-R4-SEC-OPS-PR23-05 | `env.level.tmp` quyền 0644 | (c) | SEC Đóng (`umask 077`) |
| FB-R4-SEC-OPS-PR23-06 | `trap` không chạy khi SIGKILL | (c) | SEC Đóng |
| FB-R4-SEC-ARC-PR31-04 | Tập OWN nhận thư lệch tài liệu G-E3 | (b) | B-MP |
| FB-R4-SEC-OPS-SENT-01 | Đường `relay` có lưu bản sao | (c) | README 13.8 sửa ở v1.0.4 (plan v1.0.4 P4-02–04) |
| FB-R4-SEC-PO-SENT-03 | Thư khách qua SMTP để lại bản sao ở `info@` | (b) | B-BAOMAT: điều kiện trước story thư cho khách |
| FB-R4-SEC-OPS-LPV2S4-01 | Runbook đòi trùng băm FE-B | (c) | OPS sửa r2.3 (`cef4d688`); SEC xác nhận (V5-05) |
| FB-R4-SEC-ARC-P104-03 | Trang khách chưa có câu cho `ID_NUMBER_DETECTED` | (a) | V5-46 |
| FB-R4-SEC-ARC-P104-04 | Bước đặt tham số và thay tờ ở quầy | (c) | Có trong release notes và runbook v1.0.4 (N2–N5 xong 06/11) |
| FB-R4-SEC-MOB-PR91-03 | Đổi ngôn ngữ trước khi gọi máy chủ | (b) | B-KYTHUAT |
| FB-R4-SEC-OPS-PR91-04 | Bằng chứng N4 ghi S15–S16 | (c) | Bằng chứng một lần; SEC N4 ĐẠT 06/11 |
| FB-R4-SEC-CPY-RU2-02 | Câu RU "từ chối việc gì" chưa rõ | (b) | B-PN |
| FB-R4-SEC-CPY-RU2-03 | Câu RU mất chủ thể khai báo | (b) | B-PN |
| FB-R4-SEC-MOB-RU-NL-04 | Câu sai về `notice_locale` | (b) | B-PN |
| FB-R4-SEC-OPS-RB-03 | Quay lui chưa kể biện pháp bảo vệ bị mất | (a) | V5-70 |
| FB-R4-SEC-OPS-RB-04 | Dòng thường trực "không UPDATE/DELETE tay" | (c) | SEC: đủ ý ở PR #30 |
| FB-R4-SEC-ARC-EM-03 | Bảng thứ tự trong hợp đồng email | (b) | B-KYTHUAT |
| FB-R4-SEC-ARC-EM-07 | Tập OWN của dispatcher | (b) | B-MP |
| FB-R4-SEC-ARC-EM-08 | `setMyEmail` không có `If-Match` | (b) | B-BAOMAT |
| FB-R4-SEC-ARC-EM-09 | Không giới hạn số lần đổi email | (c) | Làm ở v1.0.4 (tối đa 5 lần trong 24 giờ) |
| FB-R4-SEC-ARC-EM-10 | Danh mục dữ liệu thiếu hai chỗ giữ địa chỉ | (b) | B-BAOMAT |
| FB-R4-SEC-ARC-EM-11 | Chưa có test địa chỉ không vào Problem | (b) | B-BAOMAT |
| FB-R4-SEC-ARC-EM-13 | Câu mục đích cạnh ô email; câu "thư xác nhận" | (a) | V5-23 |
| FB-R4-SEC-BE-BED-01 | Phạm vi mục 1.2 ý 4 đọc hai cách | (b) | B-KYTHUAT (tài liệu; mã đúng) |
| FB-R4-SEC-BE-BED-02 | Worker ghi `err.message` | (a) | V5-42 |
| FB-R4-SEC-BE-C0312-02 | `serializeSchema('Me')` trả email mọi ngữ cảnh | (a) | V5-43 |
| FB-R4-SEC-BE-V104-01 | Lần đổi thứ 6 chặn cả xóa email | (c) | Có trong hợp đồng 0.3.12 và v1.0.4 |
| FB-R4-SEC-BE-V104-02 | Thiếu test hai yêu cầu song song | (c) | Done (test tích hợp, `outputs/BE/v104-be-identity.md`) |
| FB-R4-SEC-BE-V104-03 | `--owner-email=` bị bỏ qua | (c) | SEC Verified |
| FB-R4-SEC-BE-V104-08 | Controller chưa ghi `action` | (a) | V5-43 |
| FB-R4-SEC-OPS-V104-04 | Kiểm trước deploy cho luật địa chỉ | (c) | Xong trong runbook v1.0.4 |
| FB-R4-UXD-FE-13 | Tiêu đề cảnh báo "Đã đổi" | (c) | UXD đóng (`UXD-on-LP-v2-fe4.md`) |
| FB-R4-UXD-FE-14 | Câu trợ giúp "rate on request" | (c) | UXD đóng |
| FB-R4-UXD-FE-15 | Ô chỉ đọc cho manager | (c) | UXD đóng |
| FB-R4-UXD-FE-16 | Cỡ chữ `.est-line` | (c) | UXD đóng |
| FB-R4-UXD-BE-01 | "Room 1 night × {rate}" | (c) | Done ở lp-v2-fe5 |
| FB-R4-UXD-FE-18 | "Tiếng Trung (giản thể)" ngắt 3 dòng | (c) | Done ở lp-v2-fe5 |
| FB-R4-UXD-FE-19 | Chip bị kéo rộng | (c) | Done ở lp-v2-fe5 |
| FB-R4-UXD-FE-20 | Số đếm yêu cầu mới lệch huy hiệu | (c) | Done ở lp-v2-fe5 |
| FB-R4-UXD-FE-21 | Hai kiểu nhãn trên một hàng | (c) | Done ở lp-v2-fe5 |
| FB-R4-UXD-FE-22 | Hai cỡ chữ cho cùng câu | (c) | Done ở lp-v2-fe5 |
| FB-R4-UXD-FE-23 | Mock dựng câu EN cố định | (c) | Done ở lp-v2-fe5 |
| FB-R4-UXD-FE-EM-04 | Hai banner cam giống nhau | (c) | Done (`responses/FE-on-UXD-v1.0.3-email.md`) |
| FB-R4-UXD-FE-EM-05 | Câu hộp thư chung nói sai người | (c) | Done (cùng tệp) |
| FB-R4-UXD-FE-EM-06 | Khoảng cách câu dẫn | (c) | Done (cùng tệp) |
| FB-R4-UXD-FE-EM-08 | Hàng của chính mình cao gấp đôi | (c) | Done (cùng tệp) |
| FB-R4-UXD-FE-P432-03 | Lỗi đọc trông như "không có khoản chờ hoàn" | (a) | V5-13 |
| FB-R4-UXD-FE-PR70-03 | Ô OTA trống không nói hệ quả | (a) | V5-22 |
| FB-R4-UXD-FE-PR70-04 | Hiện "0 đ" khi máy chủ tính theo lịch OTA | (a) | V5-22 |
| FB-R4-UXD-FE-PR70-06 | `{min}`, `{max}` trong câu lỗi | (a) | V5-22 (= BUG-R4-040) |
| FB-R4-UXD-BA-PR85-02 | Câu nhãn "+15 %" của v1.0.3 trong sổ tay | (c) | UXD đóng; phần chữ Desk ở V5-20 |
| FB-R4-UXD-BA-PR85-03 | Sổ tay dặn "Desk hiện 100.000 cho trẻ 6–11" | (c) | UXD đóng |
| FB-R4-UXD-FE-PR75-02 | `aria-disabled` và focus | (c) | UXD đóng cả 3 thẻ PR75 |
| FB-R4-UXD-FE-PR75-03 | Footer hộp `lg` xuống dòng | (c) | UXD đóng |
| FB-R4-UXD-FE-PR79-01 | Ghi chú `room_occupied` cũ | (b) | B-KYTHUAT |
| FB-R4-UXD-BA-PR85-06 | Tiêu đề 20.2 dài 164 ký tự | (c) | UXD đóng ở #89 |
| FB-R4-UXD-FE-PR87-02 | Câu lặp nhãn ô Giá đêm niêm yết | (b) | B-QUAY |
| FB-R4-UXD-FE-PR82-02 | Báo giá tách đêm thứ Sáu, thứ Bảy | (a) | V5-20 |

### D. Việc đã hẹn v1.0.5 ở nơi khác (decision-log 04–05/11, release notes v1.0.4 "Chưa có", DOM H-list)

| Mã | Nội dung | Xếp | Mục / lý do |
|---|---|---|---|
| RN-05 | Trả sớm 00:00–05:59 | (a) | V5-11 |
| openRefunds | Tổng chờ hoàn trên Trả phòng và folio | (a) | V5-13 |
| UXD-U4 | Số chờ hoàn trên khung đơn | (a) | V5-13 |
| FDL-2FA | Ép lễ tân trưởng bật 2 bước | (a) | V5-40 |
| Hold-agreed-rate | Giữ chỗ theo giá thỏa thuận | (a) | V5-14 |
| Overdue-checkout | Trả phòng đơn quá ngày đi, nút Cần dọn | (a) | V5-15 |
| FB-R4-DOM-UXD-PR89-02 | Chữ phí trả sớm báo trong ngày rời | (a) | V5-23 |
| FB-R4-UXD-BA-PR89-01 | Câu "Bạn nhận (…)" thiếu đuôi | (a) | V5-23 |
| RU-7-strings | 7 chuỗi RU có từ cấm | (a) | V5-24 |
| CPY-P401-11 | U+2011 cho "2-step" | (a) | V5-23 |
| P4-41-detail | Thay dò chữ `detail` 409 | (a) | V5-44 |
| ARC-P411-02 | `check_violation` → 409 | (a) | V5-44 |
| SEC-V104-07 | (cùng gói PR-D) | (a) | V5-43 |
| FB-R4-PO-UXD-IDS2-01, FB-R4-PO-UXD-IDS2-02 | Tờ in và trang khách tự so chữ | (a) | V5-47 |
| UXD-P440-06 | Đơn vị tiền trong `error.DEPOSIT_INSUFFICIENT` | (a) | V5-23 |
| UXD-F1-01 | Khóa chung `error.INVALID_TRANSITION_generic` | (a) | V5-23 |
| UXD-QR-green-box | Hộp xanh "Gửi mã QR" trên câu đỏ | (a) | V5-23 |
| folio.adjust_night_help_internal | Chữ hướng dẫn Nội bộ ở folio | (a) | V5-23 |
| nodemailer | Nâng gói gửi thư | (a) | V5-41 |
| FB-R4-SEC-BE-BED-03 | Phần còn lại của BED | (a) | V5-42 |
| FB-R4-SEC-FE-HOLDS-03 | Cọc thiếu sau hạn: phần chưa đối soát | (a) | V5-18 |
| FB-R4-SEC-BE-A31-01 | Bỏ dòng phát sinh không qua duyệt (Major) | (a) | V5-16 |
| FB-R4-SEC-OPS-ROPACK-06 | Mốc "trước" cho lượt tính lại cờ | (a) | V5-17 |
| FB-R4-SEC-UXD-HTML-01 | Dựng lại HTML sổ tay | (a) | V5-04 |
| M4d | Runbook v1.0.5 | (a) | V5-70 |
| FB-R4-SEC-BA-PR69-02, FB-R4-PO-BA-PR69-04 | Dọn tài liệu sau #69 | (a) | V5-71 |
| UXD-P450-03 | Câu "chưa đủ 6 số" ở app nhân viên | (b) | B-QUAY |
| FB-R4-SEC-MOB-P442-02 | Ngôn ngữ khối pháp lý dựa vào một khóa | (b) | B-PN |
| ARC-P416-01 (`vi.waitFor`) | Test | (b) | B-KYTHUAT |
| ARC-13 (K10/K11b lọc cơ sở, giờ Đà Lạt) | Lọc theo cơ sở | (b) | B-MP |
| SEC-proconfig-PN01 | Cấu hình hàm PN-01 | (b) | B-BAOMAT |
| BE-P413-S1 (`COMMENT ON` 0090) | Chú thích phạm vi DML | (b) | B-KYTHUAT |
| BE-P413-G2-S2 | Chữ báo cáo BE P4-13 | (c) | Chỉ là chữ trong báo cáo của bản đã phát hành |
| DS-time-field | Ô giờ của Design System thay `datetime-local` | (b) | B-QUAY |
| FB-R4-DOM-PO-RN-04 | Đường báo sale/CTV của BR-303 | (b) | B-QUAY. UXD + ARC chọn cách; hiện có Cần chú ý ở Desk |
| FB-R4-ARC-QA-PR62-03 | Kiểm va chạm thật cho TC-L2-032 | (b) | B-KYTHUAT |
| SEC-BE-PR74-02, ARC-PR74-04, ARC-PR74-05, QA-PR74-05, DOM-PR74-01 | Phần sau của BUG-R4-039 (nhận phòng vào căn còn khách) | (b) | B-QUAY. Gói chỉ đọc production 05/11 đếm 0 ca, sổ tay đủ an toàn (SEC) |
| FB-R4-ARC-BE-PR71-04 | Hai cách biểu diễn "không có khoảng" | (b) | B-KYTHUAT |
| FB-R4-UXD-FE-PR70-02 | Bản xem cũ trong lúc chờ | (a) | V5-22 (phần còn lại, nếu có) |
| FB-R4-ARC-FE-PR80-01, FB-R4-UXD-FE-PR83-02, FB-R4-ARC-FE-PR83-04 | Giữ chỗ, gia hạn, minibar: chữ và thứ tự tủ | (b) | B-QUAY |
| FB-R4-SEC-OPS-PR78-04 | Công cụ demo đọc một trang `listUsers` | (b) | B-KYTHUAT (chỉ chạy trên máy) |
| FB-R4-INT-OPS-PR61-01 | Ca test chỉ kiểm chữ hàm `email_rule()` | (b) | B-KYTHUAT |
| Internal-by-role | Desk chặn hoặc gửi duyệt đơn Nội bộ theo vai | (b) | B-TIEN (cùng FB-R4-ARC-BE-PR71-03) |
| Security-log-screen | Màn xem nhật ký bảo mật trên Desk | (b) | B-BAOMAT. Cách tạm: nhắn ORC tên đăng nhập |
| H1 | Gia hạn đơn cũ tính theo bậc giảm hiện hành | (b) | B-TIEN, P3: chỉ xảy ra nếu INV bật lại giảm theo số đêm |
| H2 | Hoa hồng theo bảng nội bộ | (a) | V5-30 |
| H3 | Phí dọn thuê tháng theo hạng | (a) | V5-31 |
| H4 | HĐ đủ 1 tháng lịch có dưới 30 đêm | (b) | B-TIEN. **Hạn 15/01/2027**: phải vào bản chọn ở review 04/12 |
| H5 | Giá ước tính web, `parity_mode` | (c) | Xong cùng LP-v2 |
| H6 | Gỡ `ota_base_rate` khỏi mã | (b) | B-SAU, v1.1 |
| H7 | Báo giá thuê tháng trên Desk; cấu trúc `lease_terms`, `early_termination` | (b) | B-SAU (US-081). Tới đó sale dùng bảng tra |
| H8 | Nhắc hạn tiền thuê ngày 05 | (b) | B-SAU, v1.3 |
| H9 | `production-defaults`, seed, ví dụ BR theo v0.5.1 | (b) | B-KYTHUAT. Nên làm trước khi diễn tập dựng lại VPS (B-OPS) |
| H10 | Chữ Desk còn số "28" | (a) | V5-20 |
| H11 | Sổ tay theo bảng giá | (c) | Xong ở #85 |

### E. Việc còn lại ngày 06/11 (ORC giao)

| Mã | Nội dung | Xếp | Mục / lý do |
|---|---|---|---|
| SEC-9.5-ca3 | Kiểm trên Desk staging | (c) | SEC ĐẠT 06/11 (`SEC-on-lp-v2-s6d.md`) |
| SEC-9.5-ca8 | Kiểm trên Desk staging | (c) | SEC ĐẠT 06/11 |
| SEC-9.5-ca10 | Không tạo được khe giá qua Desk; QA ghi S6d | (c) | SEC ĐẠT bằng bằng chứng thay thế 06/11, kèm điều kiện V5-73 |
| SEC-9.5-ca4 | Web ĐẠT; Desk hiện "từ – đến" | (a) | V5-19 (= FB-R4-SEC-BE-03; Gói 5, có điều kiện kích hoạt) |
| BUG-R4-054 | Basic auth staging chặn form | (b) | B-OPS (đã đếm ở A1) |
| FB-R4-SEC-OPS-LPV2S4-01 | Chữ runbook S4/P10 | (c) | OPS sửa r2.3; SEC xác nhận ở V5-05 (đã đếm ở C) |
| ota_base_rate-Desk | Ô nhập trên Desk | (a) | V5-21 thu gọn (đã đếm ở B3) |
| BA-C2-39 | Ảnh C2-39 vẫn là màn form tắt | (a) | V5-04 |
| BA-checkin-online-copy | Câu cũ về check-in online trong sổ tay | (a) | V5-08 |
| ORC-bf155fdc | `public_show_prices` trong từ điển, dòng v1.0.3 của `00-index` | (c) | ORC đã sửa (commit `bf155fdc`) |
| QA-pricegap-static-SQL | Kiểm tĩnh SQL READ ONLY tìm căn thiếu giá đêm, bổ sung cho `pricegap` dựa vào log | (a) | V5-73 |
| QA-README-120 | Câu README `infra/server` dòng 120 "nhất là sau khi nhập lại bảng giá 01/11" gây hiểu nhầm | (a) | V5-73 (sửa ngay, không chờ bản) |
| QA-pricegap-e2e-local | Thử trọn chuỗi log → `ops-check` → webhook trên stack cục bộ dựng bằng bootstrap (QA ghi "không bắt buộc") | (b) | B-OPS |

### F. Vận hành (OPS 06/11) và sổ vận hành (BA)

| Mã | Nội dung | Xếp | Mục / lý do |
|---|---|---|---|
| OR-H1 | Bản sao lưu ngoài máy cũ 7 ngày | (a) | V5-60 (kéo tay đã làm 06/11 khoảng 19:00) |
| OR-H1-PA2 | Máy chủ phụ tự kéo về (có chi phí) | (b) | B-OPS. Cần ESC khi muốn làm |
| OR-M1 | Diễn tập khôi phục quá hạn | (a) | V5-61 |
| OR-M2 | Không có WAL; RPO thật 24 giờ | (a) | V5-62 (phương án (a)) |
| OR-M2-WAL | WAL archive (phương án (b)) | (b) | B-OPS, khi có máy phụ |
| OR-M3 | Log mất khi dựng lại container | (a) | V5-63 |
| OR-M4 | Chưa diễn tập dựng lại cả VPS | (a) | V5-64 (viết runbook) |
| OR-M4-drill | Diễn tập trên VPS dùng một lần (có chi phí) | (b) | B-OPS. Cần ESC |
| OR-L1 | `.env` có khóa trùng | (a) | V5-65 |
| OR-L2 | `fwupd` làm nhiễu `systemctl --failed` | (a) | V5-65 |
| OR-L3 | `privacy-notice.log` staging thuộc root | (a) | V5-66 |
| OR-L4 | Khóa `ottimo-ops` thừa | (a) | V5-65 (SEC xét) |
| OR-L5 | Deploy landing staging bỏ qua kiểm CSP/HSTS | (b) | B-OPS. SEC: chấp nhận, gộp vào 054-06; không nới quyền tệp mật khẩu |
| OR-L6 | Chưa dọn image cũ | (b) | B-OPS (SEC xếp backlog). Không bao giờ xóa tag đang chạy, tag trước, tag landing và image của lần diễn tập gần nhất |
| OR-L7 | Cảnh báo chỉ tới một người | (c) | Việc INV tự quyết, không tốn tiền; đã ghi ở `esc-pending-06-11.md` mục 3 |
| README-12.3-a | `deploy-landing.sh` kiểm khóa và edge trước khi chạy container | (a) | V5-66 |
| README-12.3-b | `edge.sh` kiểm quyền ghi, báo host mới | (a) | V5-66 |
| README-12.3-c | Smoke đếm lỗi ACME | (a) | V5-66 |
| README-12.3-d | `publish-privacy-notice.sh` dừng sớm trên staging | (a) | V5-66 |
| README-12.3-e | Log thông báo đúng chủ, kiểm ghi trước giao dịch | (a) | V5-66 |
| README-12.3-f | `--rollback-to` chỉ cho staging | (a) | V5-66 |
| README-12.3-g | Bước bật công tắc form | (c) | OPS: không đổi mã, runbook r2.3 S5 đã ghi |
| README-12.3-h | BUG-R4-054 | (b) | B-OPS, cùng A+ |
| BUG-R4-054-A+ | Phương án A+ | (b) | B-OPS. SEC DUYỆT CÓ ĐIỀU KIỆN 06/11; PO không đưa vào v1.0.5 |
| FB-R4-SEC-OPS-OR-01 | `pull-backups.sh` ghi đè được bản tốt trên máy nhận (Major) | (a) | V5-60, làm ngay |
| FB-R4-SEC-OPS-OR-02 | Điều kiện an toàn của máy nhận và lời báo "đã kéo" (Major) | (a) | V5-60 |
| FB-R4-SEC-OPS-OR-03 | Khóa `ottimo-ops` vào thẳng user `ottimo` | (a) | V5-65 |
| FB-R4-SEC-OPS-OR-04 | Log mất khi deploy, không có trần 90 ngày | (a) | V5-63 |
| FB-R4-SEC-OPS-054-01 | Header `Authorization` tới api | (a) | V5-67 |
| FB-R4-SEC-OPS-054-02, FB-R4-SEC-OPS-054-03, FB-R4-SEC-OPS-054-04, FB-R4-SEC-OPS-054-05 | Điều kiện của A+ (054-02 là Major) | (b) | B-OPS, cùng A+. Chỉ có hiệu lực khi làm A+ |
| FB-R4-SEC-OPS-054-06 | `--refresh-landing-access`, smoke CSP/HSTS lúc mở (Suggestion) | (b) | B-OPS, cùng A+ |
| FB-R4-SEC-OPS-S6D-01 | `pricegap` chỉ dựa vào log | (a) | V5-73 |
| ORC-SQLRO-pricegap-once | ORC chạy truy vấn tĩnh một lần trên production và staging | (a) | V5-73, làm ngay |
| SEC-S6d-manual-web-price | Sổ tay lễ tân: số trên yêu cầu web là giá thấp nhất của hạng (Suggestion) | (a) | V5-71 |
| OPS-9-TEST_SUPPORT_ALLOW_IPS | Staging còn giá trị IP dù đã tắt test support | (a) | V5-65 |
| OPS-9-env-before | 6 bản `env.before-*` trên staging | (a) | V5-65 |
| OPS-9-QA-S6-requests | 8 yêu cầu web thử của QA trên staging | (c) | Dữ liệu giả; SEC không yêu cầu xóa |
| INV-launchd-consent | INV đồng ý hay không cài lịch kéo sao lưu trên máy mình | (c) | Việc của INV (`esc-pending-06-11.md` mục 3); V5-60 chờ câu trả lời |
| INV-RPO-12h | INV xác nhận RPO 12 giờ thay giả định 15 phút | (c) | Việc của INV (`esc-pending-06-11.md` mục 3) |
| INV-FileVault | INV xác nhận máy giữ khóa SSH và bản sao lưu đã bật FileVault | (c) | Việc của INV (`esc-pending-06-11.md` mục 3) |
| SVH-2.2-backup-pull | Tự kéo sao lưu | (a) | V5-60 |
| SVH-2.2-chat-dead | Báo khi tin Chat không gửi được | (a) | V5-68 |
| SVH-2.2-renewals | Nhắc hạn tên miền, VPS, Workspace | (a) | V5-69 |
| SVH-2.2-restore-quarterly | Diễn tập khôi phục định kỳ | (a) | V5-61 |
| SVH-2.2-chat-room-yearly | Nhắc xóa phòng Chat hằng năm | (b) | B-OPS. Lần đầu tới hạn khoảng 10/2027; xếp trước 09/2027 |
| SVH-2.2-key-rotation | Nhắc đổi khóa và mật khẩu 12 tháng | (b) | B-OPS. Lần đầu tới hạn khoảng 10/2027; xếp trước 09/2027 |

### G. Tham số production lệch sổ tay (từ điển tham số, mục cuối)

| Mã | Xếp | Lý do |
|---|---|---|
| `special_uplift_pct` (B2), `los_discount` (B3), `long_stay_required_from_nights` (B4), `short_stay_max_nights` (B5), `early_checkin_tiers` (B7), `child_fee_6_11` (B8), `long_stay_compare_from_nights` (B9), `rounding.monthly_rent` (B11), `rounding.ota_rate`, giá City View 800.000 | (c) | Không phải việc của đội. INV tự chỉnh theo từ điển (`esc-pending-06-11.md` mục 3). Đội không đổi tham số giá trên production. V5-21 giúp bằng tên tiếng Việt |
| `lease_terms`, `early_termination` | (b) | B-SAU, đổi cấu trúc cùng H7. Desk chưa đọc phần lệch; không sửa tay |
| `id_image_retention_days_after_checkout` = 90 ngày | (a) | V5-45 |

### H. Nhóm backlog cải tiến (để review định kỳ)

| Nhóm | Gồm | Gợi ý thứ tự cho INV |
|---|---|---|
| B-TIEN | Tiền, giá, hợp đồng (H1, H4, PR71-03, PR73-01, đơn Nội bộ theo vai, ED-03, FZ-08, BIN ngân hàng, ký quỹ HĐ trên 24 tháng) | **H4 vào bản chọn ngày 04/12** (hạn 15/01/2027). Còn lại theo feedback |
| B-QUAY | Lỗi nhỏ, chữ và trình bày ở quầy (BUG-R2 P3 còn lại, BUG-R3-016/026/031/034, thẻ UXD trình bày, phần sau BUG-R4-039) | Gom 5–10 mục cho mỗi bản bảo trì |
| B-BAOMAT | Bảo mật nhỏ, không có rủi ro đang mở (EM-08/10/11, SENT-03, proconfig, màn nhật ký bảo mật) | SEC chọn mỗi bản 1–2 mục |
| B-PN | Lần đổi bản thông báo dữ liệu kế tiếp (RU2-02/03, RU-NL-04, P442-02, SEC-BA-104-09 (b) + `SECURITY_AUDITED_KEYS`, chuỗi RU nằm trong bản thông báo) | Làm cùng một lần khi có lý do đổi bản thông báo |
| B-MP | Khi có cơ sở thứ hai (ARC-BE-31-01, PR31-04, EM-07, K10/K11b) | Chỉ khi INV mở thêm cơ sở |
| B-OPS | Vận hành có chi phí, chưa tới hạn hoặc chỉ cần khi thử trên staging (máy phụ, WAL, diễn tập VPS mới, Lighthouse CI, nhắc hằng năm, A+ của BUG-R4-054 cùng 054-02…06, OR-L5, OR-L6) | Có chi phí thì ESC trước |
| B-DATA | Chỉ số (quốc tịch NULL) | Trước báo cáo theo quốc tịch đầu tiên |
| B-KYTHUAT | Nợ kỹ thuật, test, chữ hợp đồng | Đội tự xếp vào bản khi chạm đúng chỗ đó; không cần INV chọn |
| B-SAU | Story v1.1, v1.2, v1.3, R4+ (89 story) và H6, H7, H8 | INV chọn ở review định kỳ |

### I. Điều chỉnh sau cổng QC đóng Round 4 (PO 06/11/2026 tối)

Không cộng vào bảng mục 7 (bảng đó giữ số QC đã kiểm); tác động ghi ngay dưới bảng mục 7. Các cảnh báo Dependabot còn mở khác (`nodemailer`, 6 cảnh báo) đã có ở V5-41, nay ghi đủ tiêu chí nghiệm thu theo SEC.

| Mã | Việc | Xếp | Đích / lý do |
|---|---|---|---|
| DEP-minimatch | Dependabot cảnh báo #19 (GHSA-g3hv-75wg-m249, mức trung bình, `minimatch` có thể bị làm treo qua mẫu glob). Lockfile có `minimatch` 10.2.6, **nằm trong** dải bị ảnh hưởng (≥ 7.0.0, < 11.0.1). Gói đến gián tiếp qua `@typescript-eslint/typescript-estree` 8.71.2, phạm vi development. Bản mới nhất 8.72.1 vẫn cần `minimatch` ^10.2.2, nên lượt cập nhật Dependabot lỗi (run 41573607059, 42216172237). Job `audit` của CI xanh vì `pnpm audit --audit-level=high` | (b) | B-KYTHUAT. Không ép bản bằng override (lên 11.x có thể làm hỏng lint). Đóng khi `typescript-eslint` ra bản dùng `minimatch` ≥ 11.0.1 (Dependabot tự mở PR). SEC kết luận 06/11 (`1543be77`): chấp nhận có hạn, không override, không dismiss, xem lại 30/11. Không chặn v1.0.5 (quyết định 6) |
| DEP-react-router | Dependabot cảnh báo #3 (mức trung bình, phạm vi runtime): `react-router` 6.30.6 trong Desk (`apps/admin-web`), chuyển hướng mở qua dấu `\` ở `<Link>` và `useNavigate`. Bản vá 7.18.0 là đổi bản lớn. Backlog R3-Q31 hẹn SEC phân loại; plan R5 chưa xếp | (b) | B-BAOMAT, giữ mở. SEC kết luận 06/11 (`1543be77`): chỗ duy nhất đưa đường dẫn từ ngoài vào `navigate` đã qua `safeInternalPath`, không cần Gói 4. Nâng 7.18+ cùng toolchain FE, thử trước cờ `v7_*` trên 6.30.x (quyết định 7) |
| BUG-R3-047 | Giữ chỗ hiện nút link check-in online | (a) → (c) | Đã sửa ở v1.0.4 (`5539b7e6`, test `v104-holds-feb`), đang chạy trên production. QA đóng ở V5-02. V5-53 chỉ còn BUG-R3-048 (quyết định 8). Sổ tay và hướng dẫn còn câu "đơn giữ chỗ cũng hiện nút": sửa ở V5-08 |
| SEC-SR-INC-01 | Chưa có runbook sự cố dữ liệu khách (SR-INC-01); SEC đề xuất ở review sổ vận hành 1.2 (mục 5 ý 1) | (a) | V5-74, Gói 6, bắt buộc (quyết định 11) |
| UXD-4.19 (3 khóa) | `fo.rack.empty_body`, `desk_code.channel_off`, `error.DELIVERY_CHANNEL_DISABLED` (`copy-v1.0.5.md` mục 4.19) | (a) | V5-23 (quyết định 12) |
| UXD-R5 `weekend_nights` | Validator nhận số 1–7, giá trị đang chạy và bộ tính giá dùng `["FRI","SAT"]` | (a) | V5-25 (quyết định 13), BUG-R5-001 |
| UXD-R4 | Cột Giá trị ở Tham số quy tắc hiện `true`/`false` và JSON thô | (b) | B-QUAY (quyết định 14) |
| UXD-R1 | `msg.checkout_reminder` viết cứng "(trước 12:00)" | (b) | B-SAU, cùng story mẫu tin nhắn (quyết định 14) |
| FB-R5-CPY-UXD-V105-02 (a) | "căn" trong chuỗi VI đang gửi khách: `sale.quote_text` dòng 2, `gw.req.clean_makeup_free`, `gw.req.clean_second_fee` | (a) | V5-23, bắt buộc (quyết định 15) |
| FB-R5-CPY-UXD-V105-02 (b), 06, 07, 08 | Mẫu tin `msg.*`: "căn", dấu "!", RU "Предоплата … получена"; `guest.late.done_title` | (a) | V5-23 cùng lượt C5, nên có, không chặn QC; không kịp thì US-125 |
| FB-R5-CPY-UXD-V105-02 (c) + C6 | Họ `bill.line.*` VI ("phụ thu" → "phí", "căn" → "phòng"), `sale.quote_text_extra_guest_*`, khóa chưa dùng `guest.stay.room`, `guest.late.how_1`, `gw.room` | (b) | Backlog R5-B-03, B-QUAY, đích v1.0.6 |
| CPY-BR012-order | Báo giá ghép "{room} {room_name}" (số trước), BR-012 ghi "The Pine · 401" | (b) | Backlog R5-B-04, B-SAU cùng US-125; PO + ARC |
| DOM-A.5-hold_expired | Tin tự hủy giữ chỗ chưa cọc chỉ tới người tạo, người chốt; sale, CTV không nhận được | (a) | V5-1B, Gói 1, bắt buộc (quyết định 16) |
| BUG-R5-002 | Tiền cọc về cho giữ chỗ đã tự hủy: Desk không ghi được khoản thu, không tạo được yêu cầu hoàn | (a) | V5-5B, Gói 5, nên có (quyết định 16). Phạm vi theo DOM 11.4: mọi đơn `cancelled`, `no_show`. Chia 5B-1 (ghi tiền, hoàn, "Cần chú ý"; làm theo thứ tự (1)–(3), phần chưa gộp tới 14/11 sang v1.0.6) và 5B-2 (khôi phục, đích v1.0.6) (quyết định 20). SEC kết luận (b): phần luật máy chủ tách thành V5-48, bắt buộc (quyết định 22); 5B-1 theo S1–S8, 5B-2 theo SEC mục 4 |
| FB-R5-SEC-PO-B002-05 | SEC kết luận (b) cho BUG-R5-002: luật máy chủ cho khoản thu trên đơn đã đóng, mọi vai kể cả OWN (chỉ chuyển khoản, VietQR, ảnh bắt buộc, luôn chờ đối soát; chặn `confirmPaymentReceived`, `createVietQr`) | (a) | V5-48, Gói 4, bắt buộc (quyết định 22) |
| US-177 | Story cho BR-438: lễ tân sửa giảm dòng phát sinh (hợp đồng 0.3.13 mục 1.20 ghi "BR-438 chưa có story") | (a) | V5-16 (quyết định 24). Nằm trong FB-R4-SEC-BE-A31-01, không đếm thêm |
| US-085 AC4 (vế sau) | Tiền về sau khi đơn đã tự hủy → "Cần chú ý" `deposit_after_cancel`: đã khai báo, chưa nơi nào tạo | (a) | V5-5B-1 (quyết định 20). Nằm trong BUG-R5-002, không đếm thêm |
| BUG-R5-003 | `min_stay`: bộ kiểm cho qua dạng số, lưu một lần là báo giá, đơn trực tiếp mới, giá web trả 500 tới hết ngày nghiệp vụ | (a) | V5-25, **P1**, làn BE-C đầu tiên, không chờ PR-0 (quyết định 19) |
| R5-B-05 | Bộ kiểm cho các khóa có cấu trúc V5-25 chưa phủ: `damage_catalog` (bill, phần tử null → 500; PO đề nghị kéo vào V5-25, dòng V5-25) và các khóa ngoài luồng quầy hoặc chưa dùng (`registration_*`, `front_desk_hours`, `wo_sla`, `long_stay_cleaning_window`, `room_move_pricing`, `extra_guest_kit_items`, `early_termination`, `utility_estimate`, `commission_payout`), theo PR #96 mục 2 | (b) | B-KYTHUAT (quyết định 19) |
| R5-B-06 | Sửa hoặc hủy trong ngày một tham số vừa lưu sai cho hôm nay | (b) | B-QUAY, INV chọn (quyết định 19) |
| US-146…154 | 9 story website LP-v1 (lên ottimo.vn 25/10) | – | Backlog ghi **Xong (production)** ngày 06/11 (V5-06). Các story này không nằm trong bảng B1 nên không đổi số đếm |
