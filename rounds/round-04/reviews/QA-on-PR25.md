# QA duyệt PR #25 – `dom/br-fixtures-v0.5.1` (oracle `br-examples.json` theo BR v0.5.1 + BUG-R4-013)

- PR #25, nhánh `dom/br-fixtures-v0.5.1` @ `b5619e4e`, **đã gộp** vào `main` ở `74e8833f` (01/11 14:35 UTC). Tác giả: DOM (QA lo công cụ). 4 tệp: `product/docs/business-rules.md` (+24/−10), `product/tests/fixtures/br-examples.json` (+1763/−285), `product/tests/tools/validate-fixtures.mjs` (+13/−9), `product/tests/turbo.json` (mới).
- Người duyệt: QA. Round 4, bước **Review** (sau gộp), thuộc **ĐK2 (a)** của `rounds/round-04/qc/v1.0.3-gate.md` = ĐK12 (a) của `qc/v1.0.2-gate.md` (S10: "không có review PR #25 nào"). Ngày 03/11/2026. Phần BA/PO của ĐK2 (a) (PO đọc nhãn BR) không nằm trong tệp này.
- Trọng tâm theo ORC: oracle BR có đúng quy tắc không, test có đủ ca biên không. ORC nêu "BR-428-01…09": xem mục 0.
- Không checkout nhánh khác, không sửa mã, không commit, không đăng lên PR, không chạm staging/production.

## 0. Phạm vi thật của PR #25 so với "BR-428-01…09"

PR #25 **không đổi dòng BR-428 nào**. Bằng chứng: so `br-examples.json` ở `74e8833f^1` (`90dcda4b`) với `74e8833f`, 9 dòng BR-428 giống hệt. Mô tả PR cũng ghi "BR-428 rows are untouched". Sau đó PR #22 (v1.0.2) chỉ bỏ khóa `pendingFix` ở BR-428-08, 09 trên `main`.

Nhãn "oracle BR" trong ĐK12 (a) của QC v1.0.2 nghĩa là oracle BR v0.5.1 và cột Nhãn mà PR #25 đổi. Vì vậy QA làm hai phần:
- mục 1–3: duyệt nội dung PR #25 (đúng phạm vi ĐK2 (a));
- mục 4: theo yêu cầu ORC, kiểm thêm BR-428-01…09 trên `main` @ `92010000` và các test đọc chúng.

## 1. Cách kiểm

| Việc | Lệnh / cách làm | Kết quả |
|---|---|---|
| Lấy diff | `gh pr view 25`, `gh pr diff 25` (2.644 dòng); tách `br-examples.json` ở `74e8833f^1`, `74e8833f`, `main` rồi so từng dòng bằng script Node trong scratchpad | 31 dòng thêm, 4 dòng bỏ (BR-101-14, BR-114-03…05), 36 dòng sửa. Trong 36 dòng sửa: 17 dòng có `expected` mới, 19 dòng chỉ đổi `case`/`note`. 0 id trùng |
| Đối chiếu số với BR | Tự tính tay **48 dòng có số mới** (31 thêm + 17 sửa) theo `business-rules.md` v0.5.1 mục 2.0 (bảng giá 01/11), BR-101…116, 201…210, 313 | **0 sai số** (mục 2) |
| Cột Nhãn trong BR | So từng dòng bảng BR (trước mục 13) ở hai commit | Chỉ cột 4 (Nhãn) đổi ở BR-101, 103, 107, 114, 201–204, 206, 208. Không đổi quy tắc, không đổi con số. Đúng như PR nói |
| Validator | `node tools/validate-fixtures.mjs` trong `product/tests` (trên `main` hiện tại) | `OK – 0 lỗi, 1 cảnh báo` (cảnh báo `ds-0.json` có từ trước); 536 dòng, 173 dòng tính lại |
| Test BE đọc oracle | `npx vitest run` 7 tệp không cần DB: `reservations-pricing`, `a7-lease-nights`, `frontdesk-rules`, `be-b-s2/s3/s4-units`, `be-d-s4-units` | 7 tệp qua, 178 ca qua, 3 bỏ qua (có sẵn) |
| CI của PR | `gh run view 41315019014` | 8/8 job chạy xanh (format/lint/test/build, E2E smoke, gitleaks, contract…). Lần chạy trên commit gộp `41316916147` bị hủy vì có commit mới đè lên. CI `main` sau đó xanh (QC v1.0.3: `41660661788` @ `da6d6f3d`) |
| Turbo (BUG-R4-013) | `npx turbo run test --filter=@ottimo/tests --dry=json` | Inputs có `../docs/business-rules.md` và 48 tệp `ESC-*.md` (thêm 1 ESC so với lúc PR viết). Mọi tệp validator đọc ngoài gói (`readFileSync`/`readdirSync`) đều nằm trong inputs |
| Ai dùng id bị đổi | `grep` id trong `services/`, `apps/`, `tests/` | Mục 3, thẻ 02 |

Không chạy: các bộ integration cần `DATABASE_URL`. CI của PR đã chạy, và QC v1.0.2 đã ghi B16 9/9 trên stack.

## 2. Kết quả đối chiếu oracle v0.5.1

| Nhóm | Dòng | Kiểm | KQ |
|---|---|---|---|
| Bảng giá 01/11 | BR-101-11, 13, 15 | Giá đêm, giá tháng 10 căn đúng bảng mục 2.0; 8.500.000 ÷ 30 = 283.333 > 260.000 → cảnh báo | Đúng |
| Một mức giá, không tăng cuối tuần/lễ | BR-101-12, 103-04, 104-10, 104-11, 114-02, 116-01 | 3 × 800.000 = 2.400.000; thứ Bảy 14/11 và 31/12 vẫn 800.000; OTA = Trực tiếp | Đúng |
| Không giảm theo số đêm | BR-107-07 | 7 × 800.000 = 5.600.000, `discountBp` 0 | Đúng |
| Mốc 30 đêm | BR-108-02, 03; BR-115-07 | 20 đêm 16.000.000, không hiện thuê tháng; 29 đêm 23.200.000; 30 đêm → HĐ 8.500.000 + 200.000, ký quỹ 8.500.000 / web `monthly_offer` | Đúng, **có cả hai phía biên 29/30** |
| Trẻ từ 6 tuổi 150.000 | BR-110-18, 19, 20 | 150.000 × 3 = 450.000; 2.200.000 + 300.000 = 2.500.000; 2 đêm × 150.000 | Đúng |
| Giá "từ" | BR-114-01 | min = 800.000, 6 căn Studio | Đúng |
| Giá ước tính web | BR-115-01…08 | 2.400.000; 1.600.000 + 300.000 = 1.900.000; Signature 9.100.000 + 1.050.000 = **10.150.000** (trẻ 3 tuổi không tính, trẻ 8 tuổi là người thứ 5); Premium 2 đêm 2.200.000; dưới ở tối thiểu, sau `open_until`, vượt tối đa → không hiện số | Đúng; `open_until` = 2027-01-01 có **cả hai phía** (đêm 01/01 hiện ở 115-04, đêm 02/01 ẩn ở 115-06) |
| Bảng kỳ hạn | BR-201-01, 202-01…05 | 4 → 3 %, 9 → 5 %, 18 → 7 %, 30 → 10 %, 6 tháng vào 20/11 → trả 20/05/2027 | Đúng (validator tính lại) |
| Tiền thuê | BR-203-01…04 | 9.900.000 × 0,97 = 9.603.000; 8.500.000 × 0,93 = 7.905.000; 14.850.000 × 0,9 = 13.365.000; 12.650.000 × 0,97 = 12.270.500 → 12.271.000 (500 làm tròn lên) | Đúng (validator tính lại, `rounding.monthly_rent` 1.000) |
| Phí dịch vụ, dọn | BR-204-01, 03 | 2 × 52/12 × 120.000 = 1.040.000 → 1.240.000; 3 × 150.000 = 450.000 | Đúng |
| Ký quỹ | BR-206-01…03 | 1 tháng; 24 tháng = 2 × 13.365.000 = 26.730.000; không làm tròn thêm | Đúng |
| Chu kỳ tháng lịch | BR-207-01, 02 | Hạn 05/01, nhắc 29/12 và 05/01, đỏ 08/01, quản lý 15/01; HĐ 3 tháng vào 20/11: 11.613.000 / 8.500.000 / 5.387.000, tổng 25.500.000; phí 273.000 / 200.000 / 127.000, tổng 600.000 | Đúng |
| Thu khi ký | BR-208-01…03 | 19.406.000; 40.295.000; ESC-047 A 20.386.000, B 11.686.000 + 8.700.000, C 8.500.000 + 11.886.000 | Đúng |
| Tính lẻ ÷ 30 | BR-210-01…04 | 283.000 × 5 = 1.415.000 + 33.000; 11 ngày 3.113.000 + 73.000; 12 ngày 3.396.000 + 80.000 (theo ngày thực 3.290.000, không dùng); kỳ cuối khử lệch 5.387.000 / 127.000 | Đúng |
| Trả trước hạn HĐ | BR-313-02 | Mất 7.905.000, không truy thu, hoàn tháng 5 nếu đã thu | Đúng |

Validator mới: `tierFor(months, tiers)` và `params.lease_terms` / `rounding.monthly_rent` giữ bảng cũ làm mặc định. Vì vậy các dòng DS-E cũ (BE còn đọc) không đổi số. Ký quỹ bảng mới làm tròn bước 1 (không làm tròn thêm), đúng BR-206 v0.5.0. Không thấy lỗi.

## 3. Thẻ góp ý

### FB-R4-QA-DOM-PR25-01
- Mức độ: Major
- Vị trí: `product/tests/fixtures/br-examples.json`: các dòng v0.5.1 BR-101-12, 103-04, 104-10, 104-11, 107-07, 108-02, 108-03, 110-18…20, 114-01, 114-02, 115-01…08, 116-01 (`calc: null`). `product/services/api/test/reservations-pricing.test.ts` dòng 53–103 (`byCalc` luôn dùng tham số DS-E). Mô tả PR #25: "follow-up for QA/BE".
- Vấn đề: Mọi dòng tiền ngắn ngày theo bảng giá 01/11 đều để `calc: null`. Vì vậy validator không tính lại chúng, và test BE (`byCalc`) không đọc chúng. 7 dòng `calendarRate` cũ cũng rời test BE (16 → 9 dòng). Kết quả: **không có máy nào kiểm** động cơ giá Desk với tham số đang dùng sau ngày chuyển S. Các tham số đó là `weekend_uplift_pct` = 0, `special_uplift_pct` = 0, `los_discount` = [], `child_fee_6_11` = 150.000, `long_stay_compare_from_nights` = `long_stay_required_from_nights` = 30. Chỉ QA kiểm tay ở lần review này (mục 2). Việc nối tiếp "DS-E chuyển sang bảng 01/11" **chưa có thẻ theo dõi**: `grep` trong `03-backlog/backlog.md`, `qa/bug-list.md`, plan v1.0.3 không thấy.
- Vì sao quan trọng: Đây là đường tính tiền đang chạy thật cho khách ngắn ngày. Nếu sau này đọc sai một khóa tham số (ví dụ phụ thu trẻ, mốc 30 đêm) hay sửa một nhánh của động cơ, CI vẫn xanh. Đúng kiểu "xanh giả" mà BUG-R4-013 vừa đóng.
- Đề xuất sửa:
  - (a) BE-A cho `byCalc` gộp `row.params` lên tham số DS-E, hoặc thêm seed `ds-e-0111` cho bảng 01/11. Sau đó DOM đặt `calc` (`calendarRate`, `losDiscount`, `extraPersonFee`… đúng tên đang có) cho các dòng trên, để validator và test BE cùng tính lại.
  - (b) Trước khi làm (a), PO/ORC ghi một mục backlog v1.0.4 (BE-A + DOM + QA), hạn trước QC v1.0.4.
  - (c) Khi (a) xong, QA chạy lại và đóng thẻ.
- Trạng thái: Open

### FB-R4-QA-DOM-PR25-02
- Mức độ: Minor
- Vị trí: `br-examples.json` BR-208-02, BR-208-03, BR-210-01. `product/services/api/test/integration/a7-lease-nights.test.ts` dòng 90–110. `product/tests/e2e/api/stay-checkout.s3.api.spec.ts` TC-L4-081 (dòng ~990). Mô tả PR #25 mục "Removed".
- Vấn đề:
  - (1) Mô tả PR ghi "Removed: BR-208-02/03". Thực tế hai id này **được dùng lại** với nghĩa khác: trước là hoa hồng HĐ (`leaseCommission`), nay là thu khi ký (`dueAtSigning` / `calc` null). Không có dấu vết id cũ đã nghỉ. Hiện chưa tài liệu nào trích id cũ (`grep` rỗng), nên ảnh hưởng nhỏ, nhưng tiền lệ này sẽ làm lệch các báo cáo và bug trích id về sau.
  - (2) BR-210-01 đổi số (371.000 → 283.000; 350.000 → 200.000), nhưng nơi dùng chưa đổi theo. Tên test a7 vẫn ghi "BR-210-01: 371.000 × 5". Test còn ghép HĐ 11.130.000 (BR-215-02) với giá ngày 283.000 của HĐ 8.500.000. Test vẫn qua, vì nó chỉ kiểm hàm nhận đúng giá truyền vào, nhưng tình huống không còn đúng nghiệp vụ. Ghi chú TC-L4-081 vẫn ghi "371.000 × 5 = 1.855.000 + 350.000 × 5/30 = 58.000".
- Vì sao quan trọng: Oracle là nguồn sự thật cho bug, test và báo cáo QC. Id đổi nghĩa thì truy vết sai. Tên test sai số thì người đọc CI hiểu nhầm.
- Đề xuất sửa:
  - Id đã nghỉ thì không dùng lại. Dòng mới đánh tiếp (BR-208-04, 05). Liệt kê id đã nghỉ (BR-101-14, 114-03…05, 208-02/03 cũ) trong khối `retired` hoặc trong `owner`.
  - BE-A sửa tên test a7, và dùng hằng 371.000 riêng cho BR-215-02 (hoặc một dòng BR-215).
  - QA sửa ghi chú TC-L4-081 theo số mới.
- Trạng thái: Open

### FB-R4-QA-DOM-PR25-03
- Mức độ: Minor
- Vị trí: `business-rules.md` cột Nhãn BR-207, BR-210, BR-108, BR-115, mục 2.0 (VAT). `br-examples.json` BR-210-04, BR-108-02/03, BR-115-07, BR-114-01, BR-313-01. `validate-fixtures.mjs` dòng 617–630.
- Vấn đề:
  - (1) Hai ô Nhãn mâu thuẫn. BR-207 ghi "kỳ cuối tính lẻ: [GIẢ ĐỊNH – DOM]", BR-210 ghi "kỳ cuối khử lệch: NGÀNH". BR-210-04 (kỳ cuối 5.387.000) chỉ mang `INV-045, NGÀNH`, trong khi `note` của chính dòng ghi "[GIẢ ĐỊNH – DOM, BR-207]".
  - (2) Phần "INV 01/11" / "INV chốt 01/11" không kèm mã ESC: mốc 30 đêm ở BR-108, BR-115. Phần này không có nhãn INV-0xx nào để gắn. BR-108-02/03 và BR-115-07 chỉ mang `INV-045` (ESC-045 câu 6 là chuyện hiện phương án thuê tháng, không phải mốc 30 đêm).
  - (3) BR-114-01 ghi "gồm VAT", nhưng VAT là [GIẢ ĐỊNH] (mục 2.0, ESC-008), và dòng không mang nhãn này.
  - (4) Validator chỉ kiểm theo cả BR: ô Nhãn có chuỗi `ESC-xxx` ở bất kỳ đâu là cho qua, kể cả "thay ESC-006". Vì vậy BR-313-01 (`INV-006`, chính sách đã bị thay) qua kiểm như một quy tắc còn hiệu lực.
- Vì sao quan trọng: Nhãn cho biết con số nào INV đã duyệt và con số nào đội tự giả định. Báo giá và tin gửi khách dựa vào phân biệt này. Phần PO "đọc nhãn BR" của ĐK2 (a) cũng cần nhãn đúng tới từng ý.
- Đề xuất sửa:
  - DOM thống nhất ô Nhãn BR-207/BR-210 (một trong hai). Nếu là GIẢ ĐỊNH thì thêm nhãn cho BR-210-04.
  - Ghi "(gửi theo ESC-043 C)" cho ý "INV 01/11" ở BR-108/115 nếu đúng nguồn, hoặc PO chấp nhận ghi chú hiện tại.
  - Thêm `GIẢ ĐỊNH` (VAT) cho BR-114-01.
  - Dòng của chính sách đã thay mang khóa `supersededBy` (ví dụ BR-313-01 → BR-313-02), validator bỏ qua chúng khi so nhãn.
  - Chuyển ý (2), (3) cho PO khi đọc nhãn.
- Trạng thái: Open

### FB-R4-QA-DOM-PR25-04
- Mức độ: Minor
- Vị trí: `br-examples.json` BR-202, BR-206, BR-110 (dòng v0.5.1).
- Vấn đề: Oracle mới thiếu ca biên đúng các mốc INV vừa quyết.
  - Kỳ hạn: chỉ có 4, 6, 9, 12, 18, 24 (qua `leaseRent`), 30. Thiếu **12 → 13** và **23 → 24** qua `leaseTier` (mốc ESC-045 câu 2), và mép dưới 1, 3 → 4, 6 → 7, 9 → 10.
  - Ký quỹ HĐ **trên 24 tháng** (2 tháng, [GIẢ ĐỊNH]) không có dòng nào.
  - Trẻ em v0.5.1 "từ 6 tuổi 150.000": các dòng dùng 3, 4, 8 tuổi, và năm sinh suy ra 5. Không có ca **đúng 6 tuổi** (bị tính) cạnh **5 tuổi** (không tính) với mức mới.
- Vì sao quan trọng: Lỗi lệch một khoảng (`<` thay `<=`) thường nằm đúng ở các mốc này. Dòng `leaseTier`/`leaseDeposit` có `calc`, nên validator tự tính lại, rất rẻ.
- Đề xuất sửa: DOM thêm:
  - BR-202-06…10: 1 → 0, 3 → 0, 13 → 700, 23 → 700, 24 → 1000 (`leaseTier`);
  - BR-206-04: 30 tháng → 2 tháng (`GIẢ ĐỊNH`);
  - BR-110-21: căn 202, 2 người lớn + trẻ 6 tuổi, 2 đêm → 300.000, và 5 tuổi → 0 (`calc` null tới khi thẻ 01 xong).
- Trạng thái: Open

### FB-R4-QA-DOM-PR25-05
- Mức độ: Minor
- Vị trí: `br-examples.json` BR-428-01…09 (không thuộc diff PR #25, kiểm theo yêu cầu ORC); `services/api/test/integration/b16-preview-v101.test.ts` dòng 1020; `business-rules.md` BR-428.
- Vấn đề: Oracle BR-428 đúng (mục 4), nhưng còn 4 chỗ hở:
  - (1) Ca chia **ba phần** khi bị trần số dư (phụ thu người → chênh lệch đổi phòng → phần hoàn 50 %) chỉ có trong test BE-B 04 (dòng 1020). Không có dòng oracle, nên DOM chưa ký số của ca khó nhất.
  - (2) Không có dòng **CTV**. Câu chính sách nói "đơn trực tiếp… 50 %", câu nhãn bill nói "đêm Trực tiếp/CTV". Chưa có ví dụ chốt CTV đi nhánh 50 %.
  - (3) Biên 0 ↔ 1 ngày báo trước (hoàn 0 % ↔ 50 %) chỉ thử lúc 01:00 (BR-428-03). Mốc 05:59:59 / 06:00 có ở BR-010-03/04 (`businessDate`) nhưng chưa đi qua `earlyDeparture`.
  - (4) `note` của BR-428-08 vẫn ghi "pendingFix tới khi BE-A áp đề xuất A", dù khóa `pendingFix` đã bỏ trên `main` (PR #22).
- Vì sao quan trọng: B16 là luồng hoàn tiền. Mỗi biên trên đổi trực tiếp số tiền trả khách.
- Đề xuất sửa:
  - DOM thêm BR-428-10: chia ba phần, số lấy từ test dòng 1020 sau khi DOM tự tính lại.
  - Thêm BR-428-11 (CTV, nếu BR xác nhận CTV = Trực tiếp).
  - Thêm BR-428-12/13: báo lúc 05:59 và 06:00 ngày rời → 1 / 0 ngày (`calc` `earlyDeparture`, validator tự tính).
  - Sửa `note` 428-08.
  - Hạn: v1.0.4. Không chặn v1.0.3 (v1.0.3 không đụng B16).
- Trạng thái: Open

## 4. BR-428-01…09 trên `main` (theo yêu cầu ORC)

| Dòng | Kiểm tay theo BR-428 | Test đọc dòng này | KQ |
|---|---|---|---|
| 01 | Báo 21/10 rời 22/10 → 1 ngày; bỏ 22, 23 → 50 % × 1.400.000 = 700.000 | `frontdesk-rules.test.ts` (calc `earlyDeparture`), `b16-preview-v101` dòng 388 | Đúng |
| 02 | Báo 08:00 ngày rời → 0 ngày → 0 | như trên | Đúng |
| 03 | 01:00 ngày 22/10 = ngày nghiệp vụ 21/10 → 1 ngày → 700.000 | như trên, dòng 475 | Đúng |
| 04 | Đêm 23/10 FOC 100 % → cơ sở 700.000 → hoàn 350.000, phí 350.000 | dòng 388–399 | Đúng |
| 05 | Bỏ 14/11 (thứ Bảy 820.000) + 15/11 (713.000) = 1.533.000 → 766.500 → **767.000** (nửa lên), phí 766.000; đã ở 4 × 713.000 + 820.000 = 3.672.000, không tính lại bậc | dòng 485 | Đúng |
| 06 | Agoda 302, người thứ 4 × 150.000 × 4 = 600.000 đã thu; bỏ 2 đêm → một yêu cầu hoàn 300.000, trả phòng không tạo thêm | dòng 530 | Đúng |
| 07 | Đã trả 2.800.000; giữ 1.400.000 + 700.000 + 300.000 → dư 400.000 = phụ thu 300.000 + BR-428 100.000 | dòng 887 | Đúng |
| 08 | Chênh lệch 750.000, đã thu 300.000; đảo 500.000; dư 300.000 − 250.000 = 50.000 → hoàn 50.000, đảo không hoàn 450.000 | dòng 939 | Đúng |
| 09 | Nhãn bill: Trực tiếp "báo trước 2 ngày", OTA giữ lại không ghi số ngày (VI/EN) | dòng 929, 1099 | Đúng |

Ca biên khác đã có test (không có dòng oracle): báo lùi giờ phải có bằng chứng (dòng 709), chỉ còn 1 đêm / đúng ngày rời (dòng 1111), chia ba phần (dòng 1020). Chỗ còn hở: thẻ 05.

## 5. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN** (phần QA của ĐK2 (a)).

- Nội dung PR #25 đúng.
  - 48 dòng oracle có số mới khớp BR v0.5.1, 0 sai số.
  - BR chỉ đổi cột Nhãn.
  - Validator mới giữ được dòng DS-E cũ.
  - Turbo inputs đủ, nên BUG-R4-013 không tái phát.
  - `validate-fixtures` 0 lỗi; 178 ca vitest qua; CI của PR xanh.
- PR #25 không đổi BR-428-01…09. QA vẫn kiểm cả 9 dòng: đúng.
- Điều kiện: thẻ **FB-R4-QA-DOM-PR25-01 (Major)** phải có mục theo dõi.
  - PO ghi backlog v1.0.4, vai BE-A + DOM + QA. Việc này nên xong trước khi ORC báo ĐK2 xong (chỉ là ghi sổ).
  - Làm xong trước QC v1.0.4.
- Thẻ 02–05 (Minor) dời v1.0.4, không chặn v1.0.3. v1.0.3 không đụng giá hay B16.

## 6. Điểm làm tốt

- Dòng v0.5.1 có cả hai phía biên ở những chỗ khó nhất: 29/30 đêm, `open_until`, và ca Signature có trẻ 3 tuổi lẫn 8 tuổi. Ghi chú ghi rõ vì sao để `calc` null.
- Validator đổi theo kiểu cộng thêm: bảng cũ vẫn là mặc định. Nhờ đó test vàng của BE không phải sửa số.
- `turbo.json` liệt kê đúng mọi tệp validator đọc ngoài gói, có số băm trước/sau làm bằng chứng. Đây là cách sửa gốc cho "xanh giả".

## 7. Dòng decision-log đề nghị (ORC ghi khi commit)

`| 2026-11-03 | 4 | QA – review PR #25 sau gộp (ĐK2 (a) QC v1.0.3 = ĐK12 (a) QC v1.0.2, phần QA; DOM br-examples BR v0.5.1, merge 74e8833f): ĐẠT CÓ ĐIỀU KIỆN. 48 dòng oracle có số mới (31 thêm + 17 sửa) khớp BR v0.5.1, 0 sai; business-rules.md chỉ đổi cột Nhãn; turbo inputs đủ (dry-run: business-rules + 48 ESC); validate-fixtures 0 lỗi trên main; api vitest 7 tệp 178 qua; CI PR 41315019014 xanh. PR #25 không đổi BR-428; QA vẫn kiểm BR-428-01…09 đúng 9/9 và có test B16. 1 Major FB-R4-QA-DOM-PR25-01 (dòng tiền bảng giá 01/11 để calc null, không máy nào kiểm; chưa có thẻ) → PO ghi backlog v1.0.4 (BE-A + DOM + QA), xong trước QC v1.0.4. 4 Minor dời v1.0.4: 02 id BR-208-02/03 dùng lại + BR-210-01 cũ trong test a7/TC-L4-081; 03 nhãn BR-207/210 lệch, "INV 01/11" không mã ESC, VAT BR-114-01, validator nhận "thay ESC-006"; 04 thiếu biên kỳ hạn 1/3/13/23/24, ký quỹ > 24 tháng, trẻ đúng 6 tuổi; 05 BR-428 thiếu dòng chia ba phần, CTV, biên 05:59/06:00, note 428-08 cũ | QA | Quyền QA (kết luận kiểm thử); rounds/round-04/reviews/QA-on-PR25.md |`

`| 2026-11-03 | 4 | QA – dọn bug-list (ĐK14 QC v1.0.3): BUG-R4-011, 012 = đã sửa trên lp-v2 (QC LP-v2 xác nhận bằng test), chờ gộp main + staging smoke P10, production còn lỗi gốc với hồ sơ tạo tay (vẫn đếm Open); BUG-R4-017 đích v1.0.2 → v1.0.4 (V4-10); BUG-R4-020, 023, 024 đích v1.0.4; 023 sửa xong phải chụp lại C1-07, C1-22 mới đóng. Không đổi mức, không đóng lỗi nào | QA | Quyền QA (trạng thái lỗi); rounds/round-04/qa/bug-list.md |`
