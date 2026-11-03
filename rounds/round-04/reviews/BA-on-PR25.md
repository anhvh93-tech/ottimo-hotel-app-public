# BA review PR #25 – oracle `br-examples.json` theo BR v0.5.1 (góc đặc tả)

- Người review: BA | Round 4 – Review (điều kiện QC v1.0.3 **ĐK2a** = QC v1.0.2 **ĐK12a**, S10) | Ngày: 03/11/2026
- PR: anhvh93-tech/ottimo-hotel-app-public#25 `dom/br-fixtures-v0.5.1` → `main`, đã gộp 01/11 (merge `74e8833f`, một commit `b5619e4e`). Tác giả: DOM (QA lo công cụ).
- Phạm vi BA: (1) oracle có khớp quy tắc nghiệp vụ đã đặc tả trong `product/docs/business-rules.md` không; (2) nhãn oracle có khớp cột **Nhãn** của BR và dùng đúng thuật ngữ mục 0.1 không. Phần chạy test và công cụ (turbo, BUG-R4-013) là việc của QA. Phần đọc nhãn BR là việc của PO. Cả hai ghi ở tệp riêng.
- Kết luận: **ĐẠT.** Không có Blocker hay Major. Có 4 Minor và 3 Suggestion, không cái nào đổi con số tiền. Phần BA của ĐK2a xong.

## 1. Cách kiểm

| Bước | Làm gì | Kết quả |
|---|---|---|
| 1 | So `br-examples.json` trước gộp (`74e8833f^1`) với sau gộp (`74e8833f`), từng dòng theo id | Bỏ 4 dòng (BR-101-14, BR-114-03…05). Thêm 31 dòng. Sửa 36 dòng: 25 dòng đổi nhãn hoặc số, 11 dòng chỉ đổi `case`/`note` |
| 2 | Tính tay lại mọi số của dòng thêm hoặc sửa (BR-101, 103, 104, 107, 108, 110, 114–116, 201–210, 313), đối chiếu cột Quy tắc và Ví dụ của BR v0.5.1 | Mọi số khớp (mục 2) |
| 3 | So nhãn từng dòng với cột Nhãn của BR đó, và với ESC-043 / ESC-045 (trạng thái, phương án đã chọn) | Khớp, trừ các thẻ 02–04 |
| 4 | Kiểm BR-428-01…09 theo yêu cầu ORC | PR không đụng BR-428. Cả 9 dòng khớp BR-428 v0.4.8 (mục 3) |
| 5 | Chạy `node tools/validate-fixtures.mjs` trên `main` hiện tại | `OK – 0 lỗi, 1 cảnh báo` (536 dòng, 173 dòng tính lại) |
| 6 | Tìm id đã bỏ hoặc dùng lại trong `product/`, `rounds/round-04/` | Không test hay tài liệu R4 nào đọc BR-101-14, BR-114-03…05, BR-208-02/03 |

## 2. Đối chiếu số – dòng thêm hoặc sửa (tóm tắt)

| Nhóm | Kiểm | Kết quả |
|---|---|---|
| BR-101-11…13, 103-04, 104-10/11, 107-07, 114-01/02 | Giá theo hạng: Studio 800.000, Premium 1.100.000, Signature 1.300.000. Giá tháng 8,5 / 9 / 11,5 / 13,5 triệu. Không tăng giá T6/T7 và ngày lễ (ESC-045 câu 1 = A). Không giảm theo số đêm. "Chỉ từ" = 800.000 | Khớp |
| BR-108-02/03 | 20 đêm × 800.000 = 16.000.000, không hiện thuê tháng. 29 đêm = 23.200.000. 30 đêm thì bắt buộc HĐ (ESC-045 câu 6 = A) | Khớp |
| BR-110-18…20 | Từ 6 tuổi tính 150.000 khi vượt định mức: 301 → 450.000; 302 → 2.500.000; 202 thêm người → 150.000/đêm × 2 | Khớp |
| BR-115-01…08, 116-01 | 2.400.000 · 1.900.000 · 9.100.000 + 7 × 150.000 = 10.150.000 · 2.200.000. Không hiện số khi: dưới số đêm tối thiểu (BR-113), sau `open_until`, từ 30 đêm (`monthly_offer`), quá 3 khách. `direct` = `ota_floor` = 2.400.000 | Khớp. Ghi chú sai phương án, xem thẻ 01 |
| BR-201-01, 202-01…05 | Khoảng 1–3 / 4–6 / 7–9 / 10–23 / từ 24 tháng: 0 / 3 / 5 / 7 / 10 %. 18 tháng → khoảng 10, 7 %. 30 tháng → 10 %. Kỳ hạn = số tháng HĐ (202-05) | Khớp |
| BR-203-01…04, 206-01…03 | 9.603.000 · 7.905.000 · 13.365.000 · 12.270.500 → 12.271.000 (làm tròn 1.000, đúng 500 thì lên). Ký quỹ 1 tháng, HĐ 24 tháng là 2 tháng → 26.730.000 | Khớp |
| BR-204-01/03 | 2 × 52/12 × 120.000 = 1.040.000 → 1.240.000. Signature dọn 3 lượt × 150.000 = 450.000 | Khớp (giá dọn theo bảng INV, bảng gốc không có trong repo) |
| BR-207-01/02, 210-01…04 | 8.500.000 ÷ 30 = 283.000. 11 ngày = 3.113.000 (phí dịch vụ 73.000). 12 ngày = 3.396.000 (không dùng ngày thực 3.290.000). Kỳ cuối khử lệch: 5.387.000 và 127.000. Tổng 25.500.000 và 600.000 | Khớp |
| BR-208-01…03 | 19.406.000 · 40.295.000 · ESC-047 A 20.386.000 / B 11.686.000 + 8.700.000 / C 8.500.000 + 11.886.000 | Khớp số. Nhãn thiếu, xem thẻ 04 |
| BR-313-02 | Trả trước hạn thì mất toàn bộ 7.905.000 ký quỹ, không truy thu. Tháng 4 không hoàn, tháng 5 thu trước thì hoàn (ESC-045 câu 4) | Khớp |

## 3. BR-428-01…09 (trả phòng sớm) – theo yêu cầu ORC

PR #25 **không sửa** dòng BR-428 nào. Diff chỉ có BR-428 trong câu chữ BR-107 và chuỗi `owner`. Đúng như mô tả PR. Sau gộp, `pendingFix` của BR-428-08/09 được gỡ ở nhánh v1.0.2-ed (`1552e495`, gộp qua `91c26e0c`). Vẫn đối chiếu lại cả 9 dòng với BR-428 v0.4.8 vì đây là luồng tiền đang chạy ở v1.0.2:

| Dòng | Đối chiếu | Kết quả |
|---|---|---|
| 01–03 | Đếm ngày báo trước theo BR-011, mốc là ngày rời mới. 1 ngày thì hoàn 50 % × 1.400.000 = 700.000. 0 ngày thì không hoàn. Báo lúc 01:00 tính ngày nghiệp vụ hôm trước nên vẫn được 1 ngày | Khớp. Nhãn INV-006 đúng: chỉ là chính sách ESC-006 |
| 04 | Cơ sở ròng: đêm FOC 100 % không vào cơ sở. Hoàn 350.000, phí 350.000 | Khớp, INV-006 + NGÀNH |
| 05 | Không tính lại bậc BR-107. Đêm bỏ 820.000 + 713.000 = 1.533.000 → hoàn 767.000 (làm tròn nửa lên, có lợi khách), phí 766.000, đêm đã ở giữ 3.672.000 | Khớp |
| 06 | OTA: phụ thu người đã thu hoàn 100 %, 2 × 150.000 = 300.000. Chỉ một yêu cầu hoàn, B18 không tạo thêm | Khớp |
| 07 | Trần số dư, đơn Trực tiếp: 2.800.000 − (1.400.000 + 300.000 + 700.000) = 400.000. Chia theo thứ tự phụ thu người 300.000 → phần hoàn BR-428 100.000 | Khớp |
| 08 | Trần số dư, OTA đổi phòng: đảo 500.000. Số dư 300.000 − 250.000 = 50.000 → hoàn 50.000. Đã đảo nhưng không hoàn 450.000 | Khớp. Ghi chú cũ, xem thẻ S2 |
| 09 | Nhãn bill: dòng Trực tiếp ghi "báo trước N ngày", dòng OTA giữ lại không ghi, VI và EN | Khớp |

## 4. Thẻ feedback

### FB-R4-BA-DOM-PR25-01
- Mức độ: Minor
- Vị trí: `product/docs/business-rules.md` BR-115 cột Ví dụ ("Sau ngày chuyển, ESC-045 câu 1 = A, câu 3 = A"). `product/tests/fixtures/br-examples.json` BR-115-01…08 trường `note` (8 dòng).
- Vấn đề: ESC-045 câu 3 INV chọn **B (bản INV sửa)**: dưới 6 tuổi miễn, từ 6 tuổi 150.000 (`02-escalations/ESC-045.md` dòng 53). Phương án **A** là "giữ trẻ 6–11 tuổi 100.000". Số trong oracle dùng 150.000, tức đúng B. BR-115-03 = 10.150.000 cũng tự ghi "trước 9.800.000 với 100.000/đêm". Vậy chỉ chữ "câu 3 = A" sai. Cột Nhãn BR-115 và BR-110 ghi đúng.
- Vì sao quan trọng: người đọc chữ "câu 3 = A" có thể "sửa" về 100.000. Khi đó 10.150.000 thành 9.800.000 và báo giá web cho gia đình có trẻ 6–11 tuổi thấp hơn giá Desk thu. Truy vết từ quyết định INV tới oracle cũng sai.
- Đề xuất sửa: DOM đổi thành "câu 3 = B" ở cột Ví dụ BR-115 (không đổi số, ghi mục 18). QA thay chuỗi trong 8 `note` ở cùng PR. Nên làm trong Round 4 vì chỉ là sửa chữ, nhưng không chặn ĐK2a.
- Trạng thái: Open

### FB-R4-BA-DOM-PR25-02
- Mức độ: Minor
- Vị trí: `business-rules.md` mục 0.1 (bảng Nhãn). `br-examples.json` `conventions.labels`. Mục 18 "v0.5.1 bổ sung".
- Vấn đề: mục 0.1 chỉ định nghĩa nhãn "**INV quyết ESC-xxx 16/10** (… 17/10)". `conventions.labels` vẫn ghi "INV-0xx = INV quyết ESC-0xx 16/10 (giá trị chính thức, v0.3)". PR #25 dùng hai nghĩa mới: `INV-043` = "Bảng giá INV 01/11 (gửi theo ESC-043 C)", và `INV-045` = "INV quyết ESC-045 câu N (01/11)". Hai nghĩa này chỉ được giải thích trong mục lịch sử 18. Ngoài ra cột Nhãn còn ít nhất ba cách viết quyết định INV mà không có mã ESC: "INV 26/10 (FB-INV-005)", "INV chốt 01/11", "INV 01/11 (FB-INV-009)". Oracle không gắn nhãn được cho các phần đó, vì validator chỉ nhận `NGÀNH`, `GIẢ ĐỊNH`, `PHÁP LÝ` và `INV-0xx` có ESC trong cột Nhãn (`validate-fixtures.mjs` dòng 604, 623).
- Vì sao quan trọng: nhãn là chỗ dev và QA biết con số nào phải có INV đồng ý mới được đổi. Thuật ngữ nằm ngoài bảng định nghĩa thì mỗi người hiểu một kiểu. Phần INV quyết qua FB-INV cũng không truy vết được tới oracle.
- Đề xuất sửa: DOM mở rộng dòng nhãn ở mục 0.1 thành "**INV quyết ESC-xxx (ngày)**", ghi rõ hai cách viết được chấp nhận ("INV quyết ESC-xxx câu N (dd/mm)" và "tài liệu INV gửi theo ESC-xxx P"), và quy định quyết định INV qua FB-INV phải kèm mã ESC hoặc ghi "INV dd/mm (FB-INV-xxx)" với nhãn oracle tương ứng. QA cập nhật `conventions.labels` cho khớp. Thêm `FB-INV-0xx` vào validator là quyết định của QA/ARC, BA không áp.
- Trạng thái: Open

### FB-R4-BA-DOM-PR25-03
- Mức độ: Minor
- Vị trí: BR-115 cột Nhãn. `br-examples.json` BR-115-01…08. Mục 18 "v0.5.1 bổ sung" (câu mở đầu ghi oracle phủ "BR-114–116", nhưng bảng không có dòng BR-115).
- Vấn đề: mọi con số của BR-115-01…04 và 07 lấy từ bảng giá INV 01/11. Theo quy ước chính PR đặt ra, nguồn này phải gắn `INV-043`. Nhưng cột Nhãn BR-115 chỉ ghi "một mức giá: INV chốt 01/11", không có "gửi theo ESC-043 C", nên validator không cho gắn `INV-043`, và các dòng chỉ mang `INV-045` + `NGÀNH`. Ngược lại, BR-115-05, 06, 08 (số đêm tối thiểu, `open_until`, sức chứa) không dùng quyết định nào của ESC-045 mà vẫn mang `INV-045`. BR-116 ghi đúng "Một mức giá: INV 01/11 (ESC-043 C)".
- Vì sao quan trọng: đây là luồng giá công khai (LP-v2). Nhãn sai nguồn thì khi INV đổi bảng giá, QA không lọc được hết dòng web cần tính lại.
- Đề xuất sửa: DOM thêm "(gửi theo ESC-043 C)" vào phần giá và "một mức giá" ở cột Nhãn BR-115, và thêm BR-115 vào bảng mục 18. QA thêm `INV-043` cho BR-115-01…04, 07. Với BR-115-05, 06, 08: chỉ giữ `INV-045` nếu đổi `params` làm đổi kết quả, nếu không thì bỏ.
- Trạng thái: Open

### FB-R4-BA-DOM-PR25-04
- Mức độ: Minor
- Vị trí: `br-examples.json` BR-208-01, BR-208-02 (`labels: ["INV-043","INV-045"]`).
- Vấn đề: cả hai dòng cộng **phí dịch vụ kỳ đầu 200.000** vào số thu khi ký (19.406.000; 40.295.000). Cột Nhãn BR-208 ghi phần này là "phí dịch vụ kỳ đầu: [GIẢ ĐỊNH – chờ INV xác nhận]". Ghi chú của chính BR-208-01 cũng nói bảng giá mục 3.4 chỉ có "ký quỹ + tiền thuê tháng đầu". Hai dòng lại không có nhãn `GIẢ ĐỊNH`. BR-208-03 thì có.
- Vì sao quan trọng: số thu khi ký là tiền khách trả ngay lúc ký HĐ. Thiếu nhãn giả định thì sale và QA coi 200.000 là giá trị INV đã chốt, và khi INV trả lời ESC-047 thì không ai lọc ra hai dòng này để xem lại.
- Đề xuất sửa: thêm `GIẢ ĐỊNH` vào BR-208-01/02 và ghi trong `note` là giả định nằm ở phí dịch vụ kỳ đầu. Không đổi số.
- Trạng thái: Open

### FB-R4-BA-DOM-PR25-S1
- Mức độ: Suggestion
- Vị trí: `br-examples.json` BR-208-02, BR-208-03, chuỗi `owner` ("bỏ BR-208-02…03 (hoa hồng …)"), mô tả PR ("Removed: … BR-208-02/03").
- Vấn đề: mô tả PR và `owner` ghi là đã bỏ, nhưng thực tế hai id này được **dùng lại** với nghĩa khác: trước là hoa hồng HĐ (`leaseCommission`), nay là số thu khi ký (`dueAtSigning`, ESC-047). Hiện chưa test nào đọc theo id, nên chưa có hại.
- Vì sao quan trọng: id oracle được thẻ review, bug và test BE dùng để truy vết. Dùng lại id thì thẻ cũ (R3) trỏ vào nội dung mới. Cách làm này cũng ngược nguyên tắc "mã cũ giữ nguyên, quy tắc mới dùng số mới" của tài liệu BR.
- Đề xuất sửa: lần sau thêm id mới (BR-208-04/05) và để id cũ ở `notCovered` hoặc ghi "đã bỏ". Lần này ít nhất sửa chuỗi `owner` thành "BR-208-02/03 dùng lại cho thu khi ký".
- Trạng thái: Open

### FB-R4-BA-QA-PR25-S2
- Mức độ: Suggestion
- Vị trí: `br-examples.json` BR-428-08 trường `note` ("… → pendingFix tới khi BE-A áp đề xuất A của BE-B").
- Vấn đề: `pendingFix` của BR-428-08/09 đã gỡ sau khi BE-A sửa (`1552e495`), nhưng `note` của 08 vẫn ghi là đang chờ sửa và vẫn nói về `5e966a5`. Lỗi có từ trước PR #25. Ghi ở đây vì ORC yêu cầu rà BR-428.
- Vì sao quan trọng: `note` mâu thuẫn với trạng thái thật. QA đọc sẽ tưởng code chưa đúng oracle.
- Đề xuất sửa: QA đổi `note` thành "Đã sửa ở BE-A v1.0.1 lượt 2 (`1552e495`), bỏ pendingFix".
- Trạng thái: Open

### FB-R4-BA-DOM-PR25-S3
- Mức độ: Suggestion
- Vị trí: `br-examples.json` BR-103-04 (`labels: ["INV-043","INV-045"]`).
- Vấn đề: tình huống của dòng này là "`ota_base_rate` = giá đêm của nhóm". Cột Nhãn BR-103 ghi phần này là "NGÀNH (DOM)", nhưng dòng thiếu nhãn `NGÀNH`.
- Vì sao quan trọng: nhỏ. Giúp phân biệt phần DOM tự chốt với phần INV quyết khi gỡ mã `ota_base_rate` (H6).
- Đề xuất sửa: thêm `NGÀNH` vào BR-103-04.
- Trạng thái: Open

## 5. Điểm làm tốt
- Mọi con số mới tính tay lại đều khớp BR v0.5.1. Các dòng phải giữ số cũ (DS-E trước ngày chuyển S) ghi `calc: null` kèm lý do, nên test BE không đỏ giả.
- Mục 18 "v0.5.1 bổ sung" nói rõ PR chỉ đổi cột Nhãn, không đổi quy tắc hay con số. Cách ánh xạ "bảng giá INV 01/11 → ESC-043 C" có ghi lại, nên người review truy vết được.
- BR-208-03 ghi đủ ba phương án ESC-047 (A/B/C) thành ba kết quả mong đợi. Khi INV trả lời, chỉ cần chọn một nhánh, không phải viết lại oracle.

## 6. Kết luận
**ĐẠT.** Oracle của PR #25 khớp quy tắc nghiệp vụ đã đặc tả (BR v0.5.1, ESC-043 C, ESC-045 câu 1–6). Nhãn khớp cột Nhãn ở mọi dòng validator kiểm được. BR-428-01…09 không đổi và vẫn đúng. Bốn Minor (01–04) là lỗi chữ hoặc nhãn, không đổi tiền. Đề nghị DOM và QA sửa trước QC v1.0.4, và sửa 01 sớm nếu được. Đây không phải điều kiện của ĐK2a. Phần BA của QC v1.0.3 ĐK2a (= QC v1.0.2 ĐK12a) đã xong. Phần QA và phần PO đọc nhãn BR ghi ở tệp riêng.
