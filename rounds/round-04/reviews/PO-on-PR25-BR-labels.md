# PO review PR #25 – nhãn cột BR (QC v1.0.2 ĐK12a / QC v1.0.3 ĐK2(a), phần PO)

- Người review: PO | Ngày: 04/11/2026 | Round 4 – Bước: **Phản hồi & sửa** (việc tồn QC v1.0.2 ĐK12a, QC v1.0.3 ĐK2(a))
- Đối tượng: PR #25 `round-4: br-examples fixtures for BR v0.5.1 (+ BUG-R4-013 turbo inputs)`, repo `anhvh93-tech/ottimo-hotel-app-public`, **đã gộp** 01/11/2026 (merge `74e8833f`, head `b5619e4e`). Tác giả: DOM (nhãn BR, ví dụ), QA (công cụ, fixtures).
- Phạm vi phần PO: **cột Nhãn** của `product/docs/business-rules.md` và mảng `labels` của `product/tests/fixtures/br-examples.json`, đối chiếu với ESC, decision-log và backlog. QA và BA review phần oracle, validator, `turbo.json` ở tệp riêng.
- Cách kiểm: `gh pr view 25`, `gh pr diff 25`; tách bảng BR trong diff bằng script, so từng cột (Quy tắc, Ví dụ, Nhãn, Nguồn) trước/sau; so `labels` của 509 dòng cũ với 536 dòng mới (`git show 74e8833f^1:…` và `b5619e4e:…`); đối chiếu `02-escalations/escalations-index.md` (ESC-004, 005, 014, 016, 043, 045, 047), `ESC-045.md`, decision-log 01/11 (dòng 1043, 1053, 1054, 1056), backlog US-081, US-131, US-147, US-157, mục 5.4. `main` hiện tại chỉ khác PR #25 ở 2 dòng `pendingFix` (BR-428), không đổi nhãn.
- Không chạy test, không sửa mã, không commit. Tệp này không ghi số hoa hồng hay thưởng.

---

## 1. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN** (phần nhãn BR).

- Cột Nhãn đổi ở 10 BR (101, 103, 107, 114, 201, 202, 203, 204, 206, 208). Script xác nhận **chỉ cột Nhãn đổi**: cột Quy tắc, Ví dụ, Nguồn giữ nguyên ở cả 10 dòng. Phần thêm vào lịch sử (mục 18, "v0.5.1 bổ sung") nói đúng điều này. PR không lén đổi quy tắc qua đường nhãn.
- Nhãn mới khớp quyết định của INV: ESC-043 C (bảng giá 01/11), ESC-045 câu 1–6 (đã quyết 01/11, decision-log 1053–1054), ESC-004 / ESC-005 / ESC-016 (16–17/10), ESC-047 còn **chờ INV** và được giữ là "chờ INV". Không nhãn nào ghi "INV quyết" cho việc INV chưa quyết.
- Fixtures: 17 dòng đổi nhãn, 31 dòng mới, 4 dòng bỏ. Nhãn mới phần lớn khớp cột Nhãn của BR. `BR-210-01` bỏ `GIẢ ĐỊNH` đúng (ESC-045 câu 5).
- Còn **1 Major**: nhãn của phần hoa hồng (BR-212, BR-326, BR-903 và các dòng fixtures dẫn tới) vẫn ghi "INV quyết ESC-005 16/10", trong khi BR mục 2.0 và BR-212 v0.5.0 nói từ 01/11 hoa hồng theo bảng nội bộ của INV, không ghi số ở tài liệu. PR đã bỏ BR-208-02/03 vì lý do này nhưng bỏ sót các dòng còn lại (thẻ 01).
- **Không chặn v1.0.3.** PR #25 chỉ đổi tài liệu, fixtures và cấu hình test; v1.0.3 không đụng luồng tiền (QC v1.0.3 S2). Thẻ 01 xử lý trong Round 4, trước khi BE làm hotfix H2 (hoa hồng thuê tháng) hoặc trước QC v1.0.4, tùy việc nào đến trước.
- Với ĐK12a: **phần PO đã xong** ở tệp này. ĐK12a chỉ đủ khi QA và BA có tệp review riêng.

---

## 2. Thẻ feedback

### FB-R4-PO-DOM-PR25-01
- Mức độ: Major
- Vị trí: `business-rules.md` cột Nhãn của **BR-212** ("tỷ lệ và lịch chi: INV quyết ESC-005 16/10"), **BR-326** ("tỷ lệ: INV quyết ESC-005 16/10"), **BR-903** ("INV quyết ESC-005 16/10"). `br-examples.json` các dòng có hoa hồng tính bằng tỷ lệ cụ thể mang nhãn `INV-005` hoặc chỉ `NGÀNH`: **BR-212-01, BR-212-02, BR-326-01, BR-903-01, BR-903-02, BR-903-04, BR-309-26, BR-525-14** (BR-525-04, 525-10, 527-04 có trường hoa hồng nhưng không nêu tỷ lệ; DOM xem cùng lượt).
- Vấn đề:
  - BR mục 2.0 (dòng "Hoa hồng, thưởng") và BR-212 v0.5.0 ghi: từ 01/11 tỷ lệ, cơ sở tính và lịch chi hoa hồng theo **bảng giá nội bộ INV 01/11**, không ghi số ở tài liệu công khai. Cột Nhãn của BR-212, BR-326, BR-903 vẫn ghi giá trị là "INV quyết ESC-005 16/10". Theo BR 0.1, nhãn này nghĩa là "giá trị chính thức để code".
  - PR #25 bỏ BR-208-02/03 (hoa hồng thuê tháng) với lý do "nay là bảng nội bộ, không ghi ở repo", nhưng giữ các dòng fixtures trên với tỷ lệ cũ và nhãn `INV-005`. Hai cách xử lý trong cùng một PR là không nhất quán.
  - Repo `ottimo-hotel-app-public` là repo **công khai**.
- Vì sao quan trọng:
  - Nhãn sai nghĩa làm QA và BE tin rằng tỷ lệ cũ vẫn là giá trị chính thức. Nếu bảng nội bộ 01/11 khác số cũ, test vàng vẫn xanh trong khi Desk tính sai hoa hồng CTV/sale. Đây là tiền phải trả cho người khác.
  - INV đã chốt 01/11 là không ghi số hoa hồng ở tài liệu công khai. Dòng fixtures mới sửa trong PR mà vẫn mang số là trái với quyết định đó, dù số là số cũ.
- Đề xuất sửa:
  - (a) DOM sửa cột Nhãn của BR-212, BR-326, BR-903 thành dạng "Cách tính: NGÀNH; tỷ lệ, lịch chi: bảng nội bộ INV 01/11 (không ghi số); trước 01/11: INV quyết ESC-005 16/10".
  - (b) QA + DOM chọn một trong hai cách cho các dòng fixtures nêu trên, ghi vào `owner` của fixtures:
    1. đổi tỷ lệ trong `params` thành tham số thử không phải số của INV (ví dụ đặt tên `test_rate_bp`), nhãn `NGÀNH` + ghi chú "tỷ lệ thật ở bảng nội bộ";
    2. giữ số cũ, nhưng nhãn ghi rõ là số **trước 01/11** (ví dụ thêm nhãn `INV-005-cu` hoặc ghi chú `supersededBy: "bảng nội bộ INV 01/11"`), và BE không dùng các dòng này làm đáp án cho đơn từ 01/11.
  - (c) ORC hỏi SEC có cần làm gì với số cũ trong lịch sử git của repo công khai hay không. Số cũ đã công khai từ 16/10, nên PO đề nghị **không** viết lại lịch sử, chỉ ngừng thêm số mới.
  - (d) Làm trước khi BE code hotfix H2 (hoa hồng thuê tháng) hoặc trước QC v1.0.4, tùy việc nào đến trước. PO đã thêm dòng theo dõi vào backlog 5.6.
- Trạng thái: Open

### FB-R4-PO-DOM-PR25-02
- Mức độ: Minor
- Vị trí: `br-examples.json`, các dòng có số kỳ vọng lấy từ bảng giá 01/11 mà thiếu nhãn `INV-043`: **BR-104-10, 104-11, 108-02, 108-03, 110-19, 115-01, 115-02, 115-03, 115-04, 207-02, 208-03, 210-01, 210-02, 210-03, 210-04, 313-02**. Cùng loại: **BR-114-02** (ca "một mức giá mọi đêm", ghi chú dẫn ESC-045 câu 1 = A) thiếu `INV-045` và bỏ `PHÁP LÝ`, trong khi cột Nhãn BR-114 vẫn có "quy định quảng cáo/niêm yết giá: PHÁP LÝ".
- Vấn đề: PR định nghĩa `INV-043` = bảng giá INV 01/11 (gửi theo ESC-043 C). Một số dòng gắn `INV-043` khi số lấy từ bảng (BR-101-12, 103-04, 116-01, 203-03…, 206-02…). Các dòng trên cũng lấy giá đêm hay giá tháng từ bảng đó, nhưng chỉ gắn `INV-045` (quy tắc đang kiểm). Hai cách gắn nhãn cùng tồn tại.
- Vì sao quan trọng: nhãn dùng để tìm ca bị ảnh hưởng khi INV đổi chính sách. Lần tới INV đổi giá đêm của một hạng, ai `grep INV-043` sẽ bỏ sót 16 dòng, gồm cả 4 ca giá ước tính trên web (BR-115) mà khách nhìn thấy. BR-114-02 bỏ `PHÁP LÝ` thì danh sách việc cần luật sư xem (BR mục 15) thiếu một ca về chữ quảng cáo giá.
- Đề xuất sửa: DOM chốt một luật và ghi vào `conventions.labels`: "dòng mang nhãn của **mọi** quyết định mà số kỳ vọng phụ thuộc vào (quy tắc đang kiểm và nguồn con số)". QA thêm `INV-043` cho 16 dòng trên; BR-114-02 thêm `INV-045` và giữ `PHÁP LÝ`. Có thể thêm một kiểm nhỏ vào `validate-fixtures.mjs`: dòng có `labels` không chứa nhãn nào xuất hiện ở cột Nhãn của BR tương ứng thì cảnh báo.
- Trạng thái: Open

### FB-R4-PO-DOM-PR25-03
- Mức độ: Minor
- Vị trí: `br-examples.json` **BR-208-01**, **BR-208-02** (thu khi ký, vào ngày 01: ký quỹ + tiền thuê tháng đầu + phí dịch vụ kỳ đầu), nhãn `["INV-043", "INV-045"]`. Cột Nhãn BR-208: "phí dịch vụ kỳ đầu: [GIẢ ĐỊNH – chờ INV xác nhận]".
- Vấn đề: hai dòng cộng phí dịch vụ kỳ đầu vào số thu khi ký nhưng không mang `GIẢ ĐỊNH`. BR-208-03 (vào giữa tháng) có `GIẢ ĐỊNH`, đúng.
- Vì sao quan trọng: nếu INV trả lời khác về phí dịch vụ kỳ đầu, hai ca này phải đổi số nhưng không hiện trong danh sách giả định. Sale đọc số thu khi ký để báo khách thuê tháng.
- Đề xuất sửa: thêm `GIẢ ĐỊNH` cho BR-208-01, BR-208-02. Ghi chú của BR-208-01 thêm câu "phí dịch vụ kỳ đầu: [GIẢ ĐỊNH]" như BR-208-03.
- Trạng thái: Open

### FB-R4-PO-DOM-PR25-04
- Mức độ: Minor
- Vị trí: `business-rules.md` mục 0.1 (dòng nhãn "INV quyết ESC-xxx 16/10 (… 17/10)"); `br-examples.json` `conventions.labels` ("INV-0xx = INV quyết ESC-0xx 16/10 (giá trị chính thức, v0.3)").
- Vấn đề: định nghĩa nhãn chỉ nói tới quyết định ngày 16–17/10. PR #25 thêm hai nhãn khác loại: `INV-045` (INV quyết 01/11) và `INV-043`, vốn **không** phải một phương án INV chọn mà là **bảng giá** INV gửi theo ESC-043 C. Người đọc chỉ xem mục 0.1 hay `conventions` sẽ hiểu sai `INV-043`.
- Vì sao quan trọng: thấp. Nhưng đây là nơi QA, BE, BA tra nghĩa nhãn. Phần lịch sử "v0.5.1 bổ sung" đã giải thích đúng, chỉ chưa đưa lên phần định nghĩa.
- Đề xuất sửa: mục 0.1 thêm dòng "INV 01/11 – bảng giá (gửi theo ESC-043 C) và ESC-045" với nghĩa và người quyết; `conventions.labels` thêm "`INV-043` = bảng giá INV 01/11 (gửi theo ESC-043 C); `INV-045` = INV quyết ESC-045 01/11". Bỏ chữ "16/10" khỏi mẫu chung `INV-0xx`.
- Trạng thái: Open

### FB-R4-PO-DOM-PR25-05
- Mức độ: Suggestion
- Vị trí: `br-examples.json` **BR-208-02**, **BR-208-03**; mô tả PR mục "Removed".
- Vấn đề: mô tả PR ghi "Removed: BR-208-02/03 (lease commission…)". Thực tế hai id này được **dùng lại** cho hai ca mới (thu khi ký). Hiện không tài liệu nào ngoài fixtures dẫn tới hai id này (PO `grep` trong `product/`, `03-backlog/`, `rounds/round-04/`), nên chưa sai gì.
- Vì sao quan trọng: id oracle được dẫn trong bug-list, test report, review. Dùng lại id cho nghĩa khác làm hỏng truy vết sau này.
- Đề xuất sửa: lần sau dùng id mới (ví dụ BR-208-04, 05) và để id cũ trống có ghi chú "bỏ v0.5.1". Lần này chỉ cần ghi vào `owner` của fixtures: "BR-208-02/03 dùng lại id cho ca thu khi ký từ v0.5.1".
- Trạng thái: Open

---

## 3. Đối chiếu với backlog – việc PO tự nhận

PR #25 và BR v0.5.1 làm lộ ba chỗ backlog chưa theo kịp. Đây là việc của PO, không phải lỗi của PR. PO đã ghi một dòng vào `03-backlog/backlog.md` mục 5.6 (bảng 04/11), đích **LP-v2 – bắt buộc, trước QC rút gọn LP-v2**, DOM và QA đối chiếu số.

| # | Chỗ | Lệch | Việc |
|---|---|---|---|
| P1 | US-131 AC3, bảng ca W1–W11, M1 và bộ dữ liệu LP2-F1 | Còn theo BR v0.4.x: W2, W3 cộng cuối tuần/lễ; W4, W5 giảm theo số đêm; W8 trẻ 6–11 tuổi theo mức cũ; W6 gợi ý thuê tháng từ 20 đêm; AC1 ngắn ngày 1–27 đêm. BR v0.5.1 và ESC-045 câu 1, 3, 6 (không tăng cuối tuần/lễ, trẻ từ 6 tuổi một mức, chào thuê tháng từ 30 đêm), BR-107 (không giảm theo số đêm từ ngày chuyển) và BR-115-01…08 đã khác. QC LP-v2 đã kiểm theo giả định A, nhưng AC chính thức trong backlog vẫn ghi số cũ | PO viết lại bảng ca theo BR-115-01…08 và tham số sau ngày chuyển S; giữ dạng AC |
| P2 | US-157 AC1 ("căn 301, khách NN, 1 năm → khớp ví dụ BR-203") | Ví dụ này đã bị thay ở PR #25 (BR-203-01 nay là Garden, NN, 6 tháng) | PO đổi sang một id BR-203 còn có (ví dụ BR-203-03) |
| P3 | Bảng 5.4 "Story chịu ảnh hưởng của từng ESC" | Chưa có ESC-043, ESC-045, ESC-047 | PO thêm 3 dòng: ESC-043 → US-131, US-147, US-149; ESC-045 → US-131, US-081, US-093, US-157; ESC-047 → US-081, US-119 |

Các AC khác của backlog có dẫn nhãn BR đều khớp: US-081/US-119 AC4 "BR-204 – INV quyết ESC-005 16/10" khớp cách ghi mới của BR-204 (PR đổi "INV-005" thành "INV quyết ESC-005 16/10"). US-147 AC3 đã có ghi chú 01/11 rằng số "từ … /tháng" được thay. Không AC nào ghi "INV quyết" cho ESC-047.

---

## 4. Điểm làm tốt (nên giữ)

- Mọi nhãn mới ghi **số câu và ngày** của ESC (ví dụ "INV quyết ESC-045 câu 4 (01/11)"). Người đọc tra thẳng về quyết định, không phải đoán.
- Tách rõ số cũ và số mới: giá khởi tạo cũ (tới ngày chuyển S) giữ `INV-004` có chữ "để tra đơn cũ", không xóa. Đơn cũ vẫn kiểm được.
- Bỏ hoa hồng thuê tháng khỏi fixtures (BR-208 cũ) và ghi "không ghi ở repo" trong ghi chú. Đây là đúng hướng; thẻ 01 chỉ xin làm nốt cho các BR hoa hồng còn lại.

---

## 5. Dòng decision-log đề nghị (ORC ghi khi commit)

`| 2026-11-04 | 4 | **PO – review PR #25, nhãn cột BR** (QC v1.0.2 ĐK12a / QC v1.0.3 ĐK2(a), phần PO; merge 74e8833f): **ĐẠT CÓ ĐIỀU KIỆN**. 10 BR chỉ đổi cột Nhãn (script so 4 cột), nhãn khớp ESC-043 C, ESC-045 câu 1–6, ESC-004/005/016; ESC-047 giữ "chờ INV". 1 Major FB-R4-PO-DOM-PR25-01: nhãn BR-212/326/903 và 8 dòng fixtures hoa hồng còn ghi "INV quyết ESC-005" trong khi từ 01/11 hoa hồng theo bảng nội bộ INV (không ghi số; repo công khai) – DOM sửa nhãn, QA + DOM chọn cách xử lý số cũ, SEC xem lịch sử git; hạn trước H2 hoặc QC v1.0.4. 3 Minor (thiếu INV-043 ở 16 dòng + BR-114-02; GIẢ ĐỊNH ở BR-208-01/02; định nghĩa nhãn 0.1/conventions), 1 Suggestion (dùng lại id BR-208-02/03). Không chặn v1.0.3. PO tự nhận: US-131 AC3/LP2-F1, US-157 AC1, bảng 5.4 theo BR v0.5.1 (backlog 5.6, đích LP-v2) | PO | Quyền PO (tiêu chí nghiệm thu, backlog); rounds/round-04/reviews/PO-on-PR25-BR-labels.md |`
