# PO – Round 5, bước Sản xuất, Gói 0: release notes v1.0.4, trạng thái backlog, mở Round 5

- Người làm: PO. ORC lưu tệp này từ báo cáo bàn giao của PO (subagent không ghi tệp báo cáo).
- Commit: `8d607f98` trên `main`.

## 1. Đã làm gì

**V5-01 – release notes (`product/docs/release-notes.md`).** Xong, chỉ còn ghi số bản sổ tay sau khi gộp #69.
- v1.0.4: đã phát hành 06/11 14:10, tag `v1.0.4` → `6414be25`. LP-v2 và giá web lên cùng ngày. Bỏ câu "khách chưa thấy gì".
- Check-in online: đã mở lại (N5). BUG-R3-021 phần Desk trỏ V5-58.
- Thêm mục v1.0.5 "Đang làm". Các bảng "Chưa có" từ v1.0.0 đến v1.0.4 trỏ về V5-xx hoặc backlog.
- Sửa hai câu "chưa mở lại", "vẫn dừng". Ba đoạn check-in cũ ở v1.0.0–v1.0.3 thêm ghi chú "đã mở lại 06/11".

**V5-06 – backlog (`03-backlog/backlog.md`).** Xong.
- 19 story chuyển "Xong (production)", gồm 9 story LP-v1 US-146…154.
- 111 dòng mục 5.6/5.6a/5.6b có nhãn mới: "Xong v1.0.4", "→ V5-xx" hoặc "→ backlog B-xxx".
- Thêm mục 5.7.

**Mở Round 5.**
- Thêm 1 dòng decision-log (PO, ORC đồng ý), có câu ĐK-2 chặn production với bản có migration.
- Cập nhật `rounds/round-05/plan.md`:
  - bảng ĐK-1…8 kèm hạn và tình trạng tối 06/11;
  - tiêu chí QC điều 8 thêm "diễn tập khôi phục xong trước production nếu bản có migration";
  - phụ lục I;
  - quyết định PO 6–10 ở mục 6.

**Việc ORC giao thêm (từ báo cáo BA).**
- `product/docs/staff-one-pager.md`:
  - Tờ 1 thêm khối "Check-in online – mở lại từ 06/11/2026", gồm ba dòng BA đề xuất, khớp sổ tay 2.9 và SEC N4–N6;
  - bỏ khối "tạm dừng" (nằm ở Tờ 2a, không phải Tờ 1);
  - Tờ 2a đổi tên thành "Giữ chỗ quá hạn (tạm)" và sửa 4 câu về giữ chỗ quá hạn cho khớp bảng "Giữ chỗ và cọc" của release notes v1.0.4.
- `product/docs/day-one-guide.md` mục 10: dòng check-in ghi "hết hiệu lực từ 06/11/2026".
- Dòng V5-08 trong plan mở rộng gồm:
  - mọi chỗ QC liệt kê;
  - 9 chỗ BA grep thêm;
  - ĐK-4 (c);
  - gộp #69;
  - tờ dán quầy.
  Plan ghi thêm: INV in lại Tờ 1 và Tờ 2a.
- Sửa theo QC mục 5:
  - `rounds/round-04/outputs/PO/esc-pending-06-11.md`: 03:30 → 03:00; City View 800.000 đã nhập;
  - `rounds/round-04/outputs/PO/round-4-metrics.md`: số đếm 553/126/203/224.

## 2. File tạo/sửa
- `product/docs/release-notes.md`
- `03-backlog/backlog.md`
- `rounds/round-05/plan.md`
- `01-decisions/decision-log.md` (1 dòng cuối)
- `product/docs/staff-one-pager.md`
- `product/docs/day-one-guide.md`
- `rounds/round-04/outputs/PO/esc-pending-06-11.md`
- `rounds/round-04/outputs/PO/round-4-metrics.md`

## 3. Giả định
- Cách gửi link nằm ở Tờ 1 vì đây là cách làm lâu dài, không còn là việc tạm.
- Gửi link nhầm người: chỉ thu hồi rồi tạo link mới, theo sổ tay 2.9. Không thêm bước báo chủ đầu tư; SEC có thể yêu cầu thêm khi review.
- 9 story LP-v1 chuyển "Xong (production)" dù không có trong danh sách B1, vì đã chạy trên ottimo.vn từ 25/10. Số đếm không đổi.
- ĐK-6 và ĐK-7 ghi "đang làm", vì DOM và QA còn chạy lúc commit.
- ESC mới: không có.

## 4. Rủi ro/vướng mắc
1. **Sổ tay BA còn một câu sai.** "Đơn giữ chỗ cũng hiện nút Tạo link check-in online, Desk luôn từ chối (sửa ở v1.0.5)" đã sai từ v1.0.4: BUG-R3-047 sửa ở `5539b7e6`, Desk chỉ hiện mục link cho đơn đã xác nhận.
   - Chỗ còn câu này: sổ tay 2.4, 2.9 (khung đầu mục và bước 1), 5.6; `guides/02` 4.5 và 17.3; `guides/05` 4.2.
   - BA sửa trước 10/11 (đã ghi ở V5-08).
2. **Dependabot.** Câu QC "lockfile đã ở bản vá" không khớp cảnh báo #19.
   - `minimatch` 10.2.6 nằm trong dải ảnh hưởng (≥ 7.0.0, < 11.0.1). Gói chỉ có ở công cụ dev, chưa có bản vá cài được. PO xếp (b) B-KYTHUAT, không ép bản; SEC ghi kết luận.
   - Cảnh báo #3 `react-router` (runtime, Desk) chưa xếp. PO xếp (b) B-BAOMAT, SEC phân loại ở Gói 0. Nếu khai thác được thì đưa phần chặn vào Gói 4.
   - `nodemailer` đã có ở V5-41.
3. **BUG-R3-047 chuyển (a) → (c).** V5-53 chỉ còn BUG-R3-048. Bảng đếm mục 7 giữ số QC đã kiểm; đếm lại thì 555 = 125 + 205 + 225, vẫn 59 việc V5.
4. **#69 vẫn xung đột.** BA gộp ở Gói 0 cùng V5-08, sau đó PO ghi số bản sổ tay vào release notes.
5. **Tờ 2a cần đọc lại trước khi INV in:** DOM đọc phần giữ chỗ, SEC đọc phần check-in. Tờ 2a sẽ viết lại hẳn cùng sổ tay 2.4 ở V5-71.

## 5. Việc chưa xong
- Ghi số bản sổ tay vào release notes sau khi gộp #69.

## Cập nhật 06/11 tối – Phản hồi & sửa (commit `a907edc7`)
- **V5-25 lên P1**, gồm cả `min_stay` (BUG-R5-003) và `weekend_nights` (BUG-R5-001).
  - Là việc đầu của làn BE-C: bắt đầu 07/11, không chờ PR-0 vì không đổi schema, mục tiêu gộp 10/11.
  - Luật kiểm theo DOM rules-v1.0.5.
- **Đường gỡ** (quyết định 19): ở v1.0.5 chỉ làm bộ kiểm khi lưu cộng đọc phòng thủ. Giá trị hỏng đã nằm trong DB cũng không còn gây lỗi 500.
  - Sửa trong ngày đưa vào backlog R5-B-06.
  - Trước khi deploy, chạy giá trị đang hiệu lực trên production qua bộ kiểm mới.
  - Các khóa có cấu trúc khác trên luồng quầy được rà trong cùng PR; khóa ngoài luồng quầy để R5-B-05.
- **BUG-R5-002 nối vào V5-5B:**
  - 5B-1: ghi tiền kèm ảnh, yêu cầu hoàn 100 %, "Cần chú ý" `deposit_after_cancel` (US-085 AC4). Mức nên có; làn BE-B sau PR-B1; không cần migration.
  - 5B-2: khôi phục đơn, để v1.0.6.
  - Kết luận SEC đi theo 3 nhánh; nếu cần thì thêm V5-48 (bắt buộc).
- **Release notes:**
  - v1.0.5: một dòng cho hai ô;
  - v1.0.4: "Lời dặn tạm cho bản v1.0.4 đang chạy", dùng câu BA; cách làm tạm cho BUG-R5-002;
  - lời dặn chọn **Hiệu lực từ** ngày mai cho các ô dạng danh sách khác.
- **Tờ in:** đã sửa bảng "Cách in và dán", ghi chú khổ giấy, Tờ 1 ở 8,25 pt (quyết định 21). "OTM-…" trên Tờ 2a đã bọc backtick.
- **Tờ 2a dòng 86: CHƯA sửa**, vì lúc PO làm DOM chưa commit chữ thay. Tờ 2a vẫn chưa in.
- **Việc chuyển:**
  - BE-C: PR V5-25, kèm lệnh kiểm chỉ đọc cho ORC chạy trước deploy.
  - ARC:
    - mô tả `setParameter` cho hai khóa;
    - chốt hướng 5B-1 trước 10/11;
    - migration 5B-2.
  - QA: test V5-25 và 5B-1 theo các ca trong bug-list.
  - BA: EP02 10.5 ghi "FD/SAL", hợp đồng ghi FD+; cần sửa cho khớp.
  - UXD:
    - dựng lại Tờ 2a sau khi sửa dòng 86;
    - câu `PARAM_OUT_OF_RANGE` cho hai khóa.
- **ORC ghi thêm:**
  - `weekend_nights` trên production đã được ORC đọc chỉ đọc ngày 06/11: `["FRI","SAT"]` từ 28/10, đúng dạng bộ tính giá cần.
  - V5-5B là quyết định 16.

## Cập nhật 07/11 – Review tài liệu BA v1.0.5 (`1217858a`) và backlog v1.0.6

- **Đã làm:**
  - review release notes v1.0.5 và Tờ 2a (`rounds/round-05/reviews/PO-on-ba-v105-docs.md`): ĐẠT CÓ ĐIỀU KIỆN;
  - sửa thẳng release notes: câu `line_reduction_count`, câu hoa hồng (nhập ngay trên Desk v1.0.4, 101-01, đơn từ 01/11 mang tỷ lệ cũ), "Việc anh/chị làm trước ngày lên" (thêm hẹn diễn tập, tỷ lệ hoa hồng; "không được bật lần đầu trên máy quầy"), dòng v1.0.4 **Giới hạn đã biết** mới về hoa hồng, câu "tin không đổ chuông";
  - Tờ 2a theo DOM FB-R5-DOM-PO-08 nguyên văn; bảng Cách in;
  - plan R5: V5-30 thêm FB-R5-DOM-BE-101-01 (`r5-h1b`); **mục 4a bảng kiểm cắt tag** (T1–T9); quyết định 26;
  - backlog: R5-B-08…R5-B-14 (đích v1.0.6); US-177 AC1 chữ "nhập tay", ghi chú AC7 phần dời.
- **File sửa:** `product/docs/release-notes.md`, `product/docs/staff-one-pager.md`, `rounds/round-05/plan.md`, `03-backlog/backlog.md`, `rounds/round-05/reviews/PO-on-ba-v105-docs.md` (mới), `rounds/round-05/responses/PO-responses.md`, tệp này.
- **Giả định:**
  - thẻ DOM 108-01 vào v1.0.6 chỉ là phần thêm (lọc loại dòng phía Desk, cột vai, số trước → sau). Bộ lọc **Sửa giảm dòng – 7 ngày** theo người (`mlog.filter_reductions`, US-177 AC7 (i)) vẫn ở v1.0.5. ORC muốn dời cả lối tắt thì US-177 AC7 (i) chưa đạt, và câu release notes phải bỏ (mục 4a T4);
  - S1-03: v1.0.5 nếu BE-H kịp, không thì v1.0.6 (theo ORC).
- **Rủi ro:** câu hoa hồng "chậm nhất lúc trả phòng và thu đủ" chỉ đúng khi `r5-h1b` cùng tag với #101 (4a T6).
- **Chuyển vai khác:**
  - ORC: dòng decision-log cho quyết định 26;
  - ORC: nhắc chủ đầu tư bước 1 và bước 3 của "Việc anh/chị làm trước ngày lên" (đã có ở trang bàn giao bản 19);
  - DOM: đọc lại câu Tờ 2a;
  - UXD: dựng PDF Tờ 2a sau DOM;
  - UXD: dựng HTML sổ tay và bộ hướng dẫn sau khi BA sửa 2.4 và `02` theo thẻ 08.

## Cập nhật 07/11 – Phản hồi & sửa: Giới hạn đã biết v1.0.5, phạm vi thẻ FB-R5-DOM-FE-121-01

- **Đã làm:**
  - **Release notes v1.0.5:** mục mới **Giới hạn đã biết của v1.0.5 và cách làm ở quầy**, ba dòng:
    - ca đêm 00:00–05:59: rà **Sơ đồ phòng** trước 06:00, tới v1.0.6 (A4, R5-B-09). Chữ theo BA `792e510a`, sửa theo DOM FB-R5-DOM-BA-02: không gõ cửa ban đêm, việc chính ở mốc đóng quầy (21:00);
    - đóng ca chưa liệt kê dòng tự sửa giảm, tới v1.0.6 (R5-B-10): lễ tân dùng tab **Nhật ký thao tác tiền** (kể cả hàng **Đảo dòng folio** lý do **Đếm lại minibar**, DOM BA-03); quản lý rà bộ lọc 7 ngày mỗi tuần;
    - luật "lễ tân không tự hạ số minibar đã đếm" (BR-438 (2a)) chưa có tác dụng thật ở OTTIMO tới khi buồng phòng có màn đếm; kiểm soát thay thế K-MB theo DOM (đếm kho mỗi tuần, so ngẫu nhiên 3 dòng phiếu nạp với **Folio**, lệch quá 2 món/tuần thì hỏi người trực, ghi sổ); điều kiện trước khi giao tài khoản lễ tân riêng. Không số hoa hồng.
  - Dòng **Lỗi nhỏ ở quầy** v1.0.5 thêm câu cảnh báo giá đêm cao bất thường (V5-5C). v1.0.4 **Giới hạn đã biết** thêm dòng áp dụng ngay "Đổi giá căn: … báo giá thử 1 đêm của căn đó"; bảng "Chưa có" v1.0.4 thêm V5-5C.
  - **Quyết định FB-R5-DOM-FE-121-01: đưa vào v1.0.5**, thành **V5-5C** (Gói 5, nên có), quyết định 27. Lý do: lỗi giá là loại việc đầu tiên bản bảo trì được làm; Desk là chỗ duy nhất OTTIMO đổi giá; việc nhỏ (khoảng 0,5 ngày FE-A), chữ UXD 9.3 và enum hợp đồng đã có trên `main`, không chờ ai; không có nó thì cảnh báo máy chủ của #121 không tới người dùng. Chỉ nên có vì Minor, có cách kiểm tay, v1.0.4 cũng thiếu biên trên. Thứ tự: sau phần bắt buộc của FE-A, việc đầu trong Gói 5 của FE-A. **Đường cắt 13/11:** chưa mở PR thì sang v1.0.6, giữ mã V5-5C, là việc đầu bản đó; release notes theo 4a T10.
  - **Plan R5:** dòng V5-5C (Gói 5), lịch 09–14/11, vai FE-A; ĐK-6 ghi sẵn chữ mới và việc "khi #121 gộp: PO sửa ĐK-6 cùng lúc DOM sửa dòng **Đội đề xuất** của từ điển" (DOM #121 mục 1.3); mục 4a sửa T4 (thêm câu đóng ca), T5 (audit vẫn chặn; phần chặn không cần sửa release notes; câu DOM (A) 1 thứ hai chỉ thêm nếu audit không vào tag), T9 (đã làm), thêm **T10** (V5-5C), **T11** (#121 + ĐK-6 + từ điển), thêm một gạch "Thêm khi cắt" về K-MB ở sổ tay; quyết định 27; mục 7 đếm thêm (582 mục: 138 (a), 220 (b), 224 (c); 65 việc V5; Gói 5 có 14 việc); phụ lục I hai dòng.
  - **Backlog:** **R5-B-15** (B-SAU) màn đếm minibar cho buồng phòng trên app nhân viên, cùng phần chặn SEC V516-01; ghi điều kiện trước ngày giao tài khoản lễ tân riêng. R5-B-09 trỏ thêm dòng release notes. Mục 5.7 ghi FE-121-01 thành V5-5C, không thành dòng backlog. Lịch sử thêm một dòng. Không đổi số story: 177.
- **File sửa:** `product/docs/release-notes.md`, `rounds/round-05/plan.md`, `03-backlog/backlog.md`, tệp này.
- **Giả định:**
  1. ORC gọi là "V5-10 quá ngày đi" là phần Desk của V5-10 và V5-15 (hộp Trả phòng, đơn quá ngày đi); PO xếp V5-5C sau các việc này.
  2. Phần audit của SEC V516-01 vẫn bắt buộc ở v1.0.5 (SEC, ORC decision-log 07/11), dù DOM nói "đáng làm sớm nếu rẻ". Vì vậy release notes chưa có câu "lần đếm lại chưa hiện trong bộ lọc 7 ngày". SEC, ORC đổi thì thêm câu theo 4a T5.
  3. Dòng minibar trong release notes đúng cả khi phần chặn của BE-A2 có hay không có trong tag (người trực giữ vai quản lý nên BR-438 không chặn).
  4. Dòng ca đêm theo DOM BA-02 (đang được BA áp vào sổ tay 2.20 và `02` 13.3, chưa commit lúc PO ghi). BA giữ chữ khác thì PO sửa lại cho khớp khi cắt (4a T9).
  5. K-MB làm được ngay trên v1.0.4, như BA ghi ở sổ tay ("từ tuần này"); release notes ghi "làm được ngay từ tuần này".
- **Rủi ro:** làn FE-A dài. V5-5C nhỏ và có đường cắt nên không đẩy phần bắt buộc; rủi ro còn lại là FE-A mở PR sát 13/11 làm UXD, QA dồn việc 15–19/11. Ca thử thật trên staging cần #121 đã gộp.
- **Chuyển vai khác:**
  - ORC: giao V5-5C cho FE-A (đầu Gói 5); nhắc PO và DOM sửa ĐK-6 và từ điển trong lượt gộp #121; ghi điều kiện "màn đếm minibar hoặc phiếu đếm giấy có chữ ký" cạnh quyết định INV 29/10; nêu K-MB ở buổi review 20/11 (việc thêm cho chủ đầu tư, đội đề nghị).
  - BA: câu "Đổi giá xong, báo giá thử 1 đêm của căn đó để kiểm số" ở sổ tay phần Danh mục căn (DOM thẻ 121-01, đề xuất 3).
  - UXD, QA: đọc chữ và chạy ca 9.3 khi PR V5-5C mở.
  - SEC: R5-B-15 ghi phần chặn V516-01 đi cùng màn đếm của buồng phòng theo đề xuất DOM; SEC giữ phần chặn ở v1.0.5 thì ORC xếp lại, PO sửa R5-B-15.
- **ESC mới:** không. Không đổi giá, cọc, hoàn, hủy; phạm vi trong round thuộc quyền PO.

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **PO – quyết định 27 (plan R5): FB-R5-DOM-FE-121-01 vào v1.0.5 thành V5-5C** (Gói 5, nên có): Desk kiểm cả hai biên BR-101 (4) trước khi gửi và đọc warnings[] NIGHTLY_PRICE_UNUSUAL sau khi lưu, theo UXD copy-v1.0.5 9.3; không đổi hợp đồng, máy chủ, chính sách; ước FE-A khoảng 0,5 ngày, sau phần bắt buộc của FE-A, đầu Gói 5; 13/11 chưa mở PR thì sang v1.0.6 (giữ mã, việc đầu bản đó), release notes theo plan 4a T10. Release notes v1.0.5 thêm mục Giới hạn đã biết: ca đêm rà Sơ đồ phòng trước 06:00 tới v1.0.6 (A4, R5-B-09; chữ BA 792e510a + DOM BA-02), đóng ca chưa có dòng tự sửa giảm tới v1.0.6 (R5-B-10; lễ tân dùng Nhật ký thao tác tiền), luật đếm lại minibar thấp hơn (BR-438 (2a)) chưa có tác dụng thật ở OTTIMO, đội đề nghị K-MB (DOM 7496e5bc); v1.0.4 thêm dòng áp dụng ngay "đổi giá xong báo giá thử 1 đêm". Plan 4a sửa T4, T5, T9, thêm T10 (V5-5C), T11 (#121 + ĐK-6 + từ điển); ĐK-6 ghi việc khi #121 gộp (PO sửa ĐK-6 cùng lúc DOM sửa dòng Đội đề xuất). Backlog R5-B-15 (B-SAU): màn đếm minibar cho buồng phòng trên app nhân viên, cùng phần chặn SEC V516-01 (DOM đề xuất, chờ SEC) | PO | Quyền PO (phạm vi trong round, release notes, backlog); không ESC |`

`| 2026-11-07 | 5 | Điều kiện thêm cho quyết định INV 29/10 (một tài khoản 6 vai; "khi có nhân viên lễ tân/buồng phòng thật thì mỗi người một tài khoản, đúng một vai"): trước ngày giao tài khoản lễ tân riêng không giữ vai quản lý, cần màn đếm minibar cho buồng phòng trên app nhân viên (backlog R5-B-15) hoặc phiếu đếm giấy có chữ ký buồng phòng (lễ tân nhập đúng số phiếu, phiếu kẹp sổ giao ca, quản lý so 3 phiếu ngẫu nhiên với bill mỗi tuần); giữ K-MB cả khi đã có (DOM DOM-responses.md (A) 3, 7496e5bc) | DOM / PO | Không ESC; INV đã chấp nhận mô hình 6 vai 29/10 |`

## Cập nhật 07/11 (lượt 2) – Phản hồi & sửa: bảng kiểm T12–T14, câu minibar theo BE-A2, Wi-Fi ngày lên

- **Đã làm:**
  - Plan R5 mục 4a: thêm **T12** (#112 + FE V5-13 + FE V5-18), **T13** (FE V5-44 (a) cần #112, chặn), **T14** (#120 + Desk V5-58 Wi-Fi); sửa **T5** theo BA lượt 4 (`da596507`): phần audit BE-A2 `0b2ebb45` vào tag cùng #110, phần chặn không vào v1.0.5; mặc định release notes không có câu "Lần đếm lại minibar chưa hiện trong bộ lọc…", kiểm bằng `grep -n "chưa hiện trong bộ lọc" product/docs/release-notes.md` lúc cắt; thiếu #110 hoặc audit thì đổi ba câu theo T5. Quyết định 28. Gạch "Thêm khi cắt" về K-MB ghi BA đã thêm.
  - Release notes v1.0.5:
    - dòng **Đóng ca**: lần đếm lại minibar thấp hơn hiện là **Điều chỉnh dòng folio**, lý do **Đếm lại minibar** (khớp sổ tay BA lượt 4);
    - dòng minibar: thêm "Desk không chặn lần đếm lại thấp hơn; lần đếm lại làm tiền minibar nhỏ đi hiện ở bộ lọc **Sửa giảm dòng – 7 ngày**";
    - mục mới **Việc anh/chị làm ngày lên v1.0.5**: nhập Wi-Fi trên Desk, kiểm trên trang khách; in thẻ Wi-Fi mới chỉ khi đổi mật khẩu luôn trong ngày (13:00–17:00, 10 căn + 2 dự phòng).
  - Trả lời thẻ ARC trong `rounds/round-05/responses/PO-responses.md`.
- **File sửa:** `rounds/round-05/plan.md`, `product/docs/release-notes.md`, `rounds/round-05/responses/PO-responses.md`, tệp này.
- **Giả định:** "in thẻ mới" ngày lên chỉ cần khi chủ đầu tư đổi mật khẩu luôn trong ngày. Sổ tay 1.4 ghi ngày lên chỉ nhập tên mạng, mật khẩu đang dùng; thẻ trong căn vẫn đúng nếu không đổi. ORC muốn in thẻ mới bắt buộc thì PO bỏ vế "không cần in lại".
- **ESC mới:** không.

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **PO – quyết định 28 (plan R5): bảng kiểm cắt tag 4a thêm T12–T14** (theo ARC FB-R5-ARC-PO-112-01, BA lượt 4 da596507). T12: #112 + FE V5-13 + FE V5-18 – thiếu FE thì bỏ hai câu ở dòng Trả phòng và tiền ở quầy (tổng đang chờ hoàn kể cả yêu cầu người khác tạo; cọc chưa đối soát), thiếu FE V5-13 thì lời dặn "hỏi quản lý" của v1.0.4 (ca CO-01b) thành giới hạn v1.0.5, đích v1.0.6. T13 (chặn): Desk đọc lockReason (V5-44 (a)) không vào tag thiếu #112. T14: bước nhập Wi-Fi ngày lên chỉ giữ khi Desk V5-58 cùng tag với #120. T5: audit đếm lại minibar BE-A2 0b2ebb45 vào tag cùng #110, phần chặn không vào v1.0.5 (R5-B-15); release notes không có câu "đếm lại chưa hiện trong bộ lọc", kiểm bằng grep lúc cắt. Release notes v1.0.5: câu đóng ca và minibar theo BE-A2; mục mới Việc anh/chị làm ngày lên (nhập Wi-Fi; in thẻ mới chỉ khi đổi mật khẩu) | PO | Quyền PO (release notes, bảng kiểm cắt bản); không ESC |`

## Cập nhật 07/11 (lượt 3) – bảng kiểm T15 (#99 cần #127)

- **Đã làm:** plan R5 mục 4a thêm **T15** (chặn) theo SEC `rounds/round-05/reviews/SEC-on-be-pr-99-delta.md` mục 0, 2: tag có #99 thì có #127 (`r5-text-strip`). #127 không kịp: bỏ #99 khỏi tag hoặc dời ngày cắt, ORC + PO chọn. Bỏ #99 thì V5-15 phía máy chủ dời (Gói 1, cần dòng decision-log PO + ORC), release notes bỏ câu "Trả phòng được đơn quá ngày đi" và giữ lời dặn v1.0.4 "Đơn quá ngày đi mà vẫn Đang ở", đích v1.0.6. Quyết định 29. Đã ghi nhận: ORC chấp nhận giả định Wi-Fi (in thẻ mới chỉ khi đổi mật khẩu).
- **File sửa:** `rounds/round-05/plan.md`, tệp này.
- **Giả định:** nút **Báo cần dọn** (T2) không phụ thuộc #99, vì máy chủ R8 đã trên `main`.
- **ESC mới:** không.

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **PO – quyết định 29 (plan R5): bảng kiểm cắt tag 4a thêm T15 (chặn) – tag có #99 (BE-A2 V5-15) thì phải có #127 (BE-A1 r5-text-strip)** (theo SEC SEC-on-be-pr-99-delta.md mục 0, 2): #99 ghi giờ khai vào actual_checkout_at, khai báo lưu trú và hồ sơ khách ở mọi B18 kể cả giờ quy đổi; #127 thêm notBeforeCheckIn cho mọi B18 (ca A1A-01) và bỏ ký tự điều khiển ở Fields.text (A1B-01). #127 không kịp lúc cắt: bỏ #99 khỏi tag hoặc dời ngày cắt, ORC + PO chọn và ghi decision-log; bỏ #99 là dời V5-15 phía máy chủ (Gói 1, QC điều 1), release notes bỏ câu "Trả phòng được đơn quá ngày đi", giữ lời dặn v1.0.4 "Đơn quá ngày đi mà vẫn Đang ở", đích v1.0.6 | PO | Quyền PO (bảng kiểm cắt bản); không ESC |`

## Cập nhật 07/11 (lượt 4) – bảng kiểm T16, T17 và ngày ghi phí (theo DOM review #127, #114)

- **Đã làm:**
  - Plan R5 mục 4a:
    - **T16** (không chặn): #127 + FE-A V5-10 (#125). Có cả hai: kiểm #125 đã làm ghi chú FE-A của DOM mục 4 (lần tóm tắt chưa gửi giờ không thành giờ điền sẵn, không làm hiện câu "giờ trả sau giờ hiện tại"), QA chạy T-10-14 trên staging. Thiếu #125: thêm dòng (a) của DOM vào **Giới hạn đã biết** v1.0.5 (VietQR trả phòng báo lỗi khi khách đã đi từ tối hôm trước; trả phòng vẫn được, còn nợ ghi công nợ), dòng BUG-R4-051 ở bảng "Chưa có" v1.0.4 đổi đích v1.0.6, QA kiểm vế "ghi được giờ khách rời thật" với Desk v1.0.4.
    - **T17** (không chặn): #114 + FE-A V5-11. Thiếu FE: bỏ câu "Trả sớm lúc 00:00–05:59 đặt sẵn đúng ngày", thêm dòng (b) của DOM (chọn Ngày rời mới là ngày hôm nay theo lịch), lời dặn v1.0.4 tách đích (máy chủ v1.0.5, Desk v1.0.6). Có FE mà thiếu #114: không gộp Desk. Thiếu #114: bỏ thêm dòng ngày ghi phí.
    - **T15**: ghi trạng thái. #99 đã gộp nên dòng này đang có hiệu lực. DOM ĐẠT #127 `5c66ca15`, ARC và SEC đang review.
    - Quyết định 30.
  - Release notes v1.0.5, "Dự kiến có": dòng mới **Ngày ghi phí trả sớm, hủy, không đến**. Phí ghi vào ngày thao tác (ngày nghiệp vụ, đổi lúc 06:00). Ví dụ 29/11 báo rời 02/12 thì phí nằm ở 29/11. Chỉ đổi ngày, số tiền không đổi (BR-010 v0.5.12, DOM 3.4).
  - Đã kiểm `gh pr list` và các nhánh trên remote 07/11:
    - **FE V5-11 chưa có PR, chưa có nhánh.**
    - #114 (BE-A1 V5-11, `r5-a2`) đang nháp. #125 (FE-A V5-10) đang mở. #127 đang nháp. #99, #105, #106 đã gộp.
- **File sửa:** `rounds/round-05/plan.md`, `product/docs/release-notes.md`, tệp này.
- **Giả định:**
  - Thiếu phần FE của V5-10 hoặc V5-11 không chặn tag, vì DOM 2.2 và mục 4 kết luận không sai tiền. Vẫn cần dòng decision-log PO + ORC vì đây là Gói 1 (QC điều 1).
  - Nút **Trả phòng** từ 00:00 đến từ máy chủ #106: DOM 2.2 cho thấy Desk v1.0.4 vẫn trả phòng được lúc 01:05. Vế "ghi được giờ khách rời thật" khi thiếu #125 thì để QA kiểm, chưa khẳng định.
- **Rủi ro cho ORC (không ESC):**
  - V5-11 phía Desk thuộc Gói 1 (bắt buộc) nhưng chưa có người mở PR.
  - Làn FE-A đang có #125, rồi hộp V5-15 sau #99, rồi V5-5C (đường cắt 13/11).
  - Chỉ dẫn 409 (`minNewDepartureDate`, `useCheckout`) chưa có khóa chữ trong `copy-v1.0.5.md`, nên cần UXD.
  - PO đề nghị ORC giao FE V5-11 ngay sau #125, hoặc cho FE-2/FE-3 làm, và gọi UXD chốt câu chỉ dẫn.
- **ESC mới:** không.

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **PO – quyết định 30 (plan R5): bảng kiểm cắt tag 4a thêm T16 (#127 + FE-A V5-10 #125) và T17 (#114 + FE-A V5-11), không chặn; release notes v1.0.5 thêm dòng ngày ghi phí** (theo DOM DOM-on-be-a1-prs-127-114.md mục 1, 2.2, 3.4, 4). Thiếu #125: Giới hạn đã biết v1.0.5 thêm "Lúc 00:00–05:59, khách đã đi từ tối hôm trước: VietQR trả phòng báo lỗi; trả phòng vẫn làm được, còn nợ thì ghi công nợ", BUG-R4-051 đổi đích v1.0.6. Thiếu FE V5-11: bỏ câu "Trả sớm 00:00–05:59 đặt sẵn đúng ngày", thêm "chọn Ngày rời mới là ngày hôm nay theo lịch", lời dặn v1.0.4 tách đích (máy chủ v1.0.5, Desk v1.0.6); Desk V5-11 không vào tag thiếu #114. Phần FE trễ vẫn cần dòng decision-log PO + ORC (Gói 1, QC điều 1). Release notes: phí trả sớm, phí hủy, phí không đến ghi vào ngày thao tác (ngày nghiệp vụ, đổi 06:00), không đổi số tiền (BR-010 v0.5.12); bỏ nếu thiếu #114. T15 có hiệu lực từ khi #99 gộp. 07/11: FE V5-11 chưa có PR, chưa có nhánh | PO | Quyền PO (release notes, bảng kiểm cắt bản); không ESC |`
