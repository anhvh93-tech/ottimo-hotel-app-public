# QC gate – FB-INV-012 phiếu thanh toán tháng khách dài hạn (ứng viên v1.0.7)

- Tác giả: QC | Round 5 – bước **QC** | Lượt 2: 19/11/2026. Lượt 1 (18/11, `5e98ec5a`) được thay bằng bản này; mục 9 tóm tắt những gì đã đổi.
- Ứng viên: `main` @ `4d47af0d`. Gồm:
  - bản lượt 1: BE #190, FE #189, BE #194, FE #195;
  - gói sửa trước ra mắt, theo cách A INV chọn 18/11: contract §12, migration **0100**, BE #197/#199, FE #196/#198.
- Phạm vi: chỉ FB-INV-012. BUG-R5-002 và BUG-R5-007 (P2) có sẵn trên production từ trước, không thuộc phạm vi này.
- QC không commit. ORC ghi quyết định vào `01-decisions/decision-log.md`.

## 1. Quyết định

**ĐẠT CÓ ĐIỀU KIỆN.**
- Được deploy production trong **23–26/11**, vào giờ vắng.
- Trước khi deploy phải xong 4 việc: chạy thử lại trên bản sao staging cho 73 → 75, kiểm production chỉ đọc về các CHECK mới, OPS xác nhận Q26, và checklist OPS.
- Sau deploy, nhập các đơn dài hạn lên Desk xong trước 30/11.
- Phiếu 12/2026 có điện nước vẫn chỉ phát hành sau khi các ca cửa sổ chạy đạt trên staging.

Lý do ngắn:
- 0 P0, 0 P1, 0 P2. Lỗi FB-INV-012 còn mở: 0. BUG-R5-008…016 đều đã đóng.
- QA L3: 34 ca, 25 đạt, 0 trượt, 9 chưa chạy. Trong 9 ca đó, 7 ca là phần 12.4/12.5 dời có chủ ý; Q7 đạt ở L4; Q25 có CI phủ.
- QA L4: 11 ca, 10 đạt, 1 chưa kết luận (Q13 nhánh B9, có test SEC 12-03 phủ).
- **Q16 đạt:** tiền thuê tháng 11 ghi "đã thu ngoài Desk" được trừ đúng ở phiếu cuối (3.689.000 = 10.198.000 − 6.509.000).
- Mọi thẻ Major của ARC, SEC, UXD đã đóng: ARC 197-01, SEC 197-01, UXD 196-01. #199 không có thẻ, #198 chỉ có Minor 198-01 (đã sửa trong `63d096b3`, có trong bản gộp).
- Còn hở hai chỗ:
  - (a) 0100 mới chỉ chạy trên DB rỗng của CI và trên staging thật. Chưa chạy chung 0099 + 0100 từ 73 trên bản sao dữ liệu, mà đó đúng là đường production sẽ đi.
  - (b) Các ca cửa sổ chốt công tơ vẫn chưa tới ngày.

## 2. Trả lời các điểm mới

### 2.1 ARC-07 có cần chạy lại trên bản sao staging cho 0099 + 0100 không? **Có, trước deploy.**

- Production đang ở 73. Lần deploy này chạy **0099 và 0100 trong một giao dịch** (contract G9). Đường 73 → 75 chưa chạy trên bản sao dữ liệu thật nào: §19 chỉ chạy 73 → 74.
- 0100 không chỉ thêm bảng. Nó **xóa rồi thêm lại CHECK** `payment_method_check` và `staff_notification_kind_check`, và thêm CHECK mới trên `payment`, `reservation`, `meter_reading` (file 0100, dòng 16–25). Thêm CHECK thì Postgres lấy khóa `ACCESS EXCLUSIVE`, chặn cả đọc, và quét các dòng đang có. DB rỗng của CI không chứng minh được dòng cũ qua kiểm.
- Việc này nhanh: OPS làm như §19, khoảng 15 phút, không cần INV và không đụng production.
- Bản sao staging vẫn không thay được dữ liệu production. Vì vậy thêm điều kiện 15: kiểm chỉ đọc trên production xem có dòng nào sẽ vi phạm CHECK mới.

### 2.2 Q26 (75 migration trên staging)

OPS cần xác nhận trước deploy (điều kiện 16). Việc rất nhỏ, đọc chỉ đọc. Nếu staging không ra 75 hoặc có CHECK chưa `convalidated` thì dừng.

### 2.3 Điểm mới QC thấy khi đọc lại

- **Phiếu tháng 11 của khách đã trả ngoài Desk vẫn phải phát hành**, rồi ghi "đã thu ngoài Desk" (contract G3). Ghi chép 18/11 của INV lại nói "không phát hành phiếu tháng 11, phiếu đầu tiên là 12/2026".
  - Nếu lễ tân làm theo đúng câu chữ đó, phiếu cuối sẽ **thu tháng 11 lần nữa**. Q16 cho thấy phiếu cuối khi đó là 10.198.000 thay vì 3.689.000.
  - Hướng dẫn của DOM phải nói rõ: phát hành phiếu, ghi đã thu ngoài Desk, **không gửi cho khách**. ORC xác nhận lại cách hiểu này với INV (điều kiện 5).
- **ARC 197-03:** khóa `long_stay_cleaning_fee_by_room` đã có trong DB nhưng chưa có hook kiểm. MGR vẫn đặt giá trị được qua API (QA L3 E4). Tới khi 12.4 lên thì không ai được đặt khóa này (điều kiện 3).
- **Hạn cứng của cách A:** khách ở từ trước 01/11 thì ngày đến trên Desk là 01/11 (G2).
  - Nhập phòng bù thì ngày đến không được quá 45 ngày trước hôm nay, và ngày đến thuộc tháng trước chỉ nhận khi hạn ghi trễ của tháng đó còn (`PREVIOUS_MONTH_CLOSED`). Nghĩa là sau **11/12** không còn nhận phòng bù với ngày đến tháng 11 được nữa.
  - Muốn chốt tháng 11 trong cửa sổ 30/11–01/12 thì đơn phải `in_house` từ trước. Do đó deploy càng sớm càng tốt trong 23–26/11.

## 3. Bảng kiểm

### 3.1 Review

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| ARC | Đạt | `ARC-on-be-pr-197.md` mục 10: **DUYỆT gộp**, 197-01 Major đã đóng; còn mở 197-03 (tới PR 12.4), 197-04 (hạn 31/12). `ARC-on-be-pr-199.md`: DUYỆT, chỉ có S1. Lượt 1: #190, #189, #194 |
| SEC | Đạt | `SEC-on-be-pr-197.md`: **Đạt**, 197-01 Major đã đóng; còn mở 197-03 Minor (trước khi gộp PR-M), 197-05 Minor (31/12). SEC 190-08 đã đóng (12-08); 190-07 còn mở, hạn 31/12 (`responses/BE-responses.md` dòng 96) |
| UXD | Đạt | `UXD-on-fe-pr-196.md`: 196-01…08 đóng; 196-09…11 Minor sửa trong `2a859844`. `UXD-on-fe-pr-198.md`: DUYỆT; 198-01 sửa trong `63d096b3`, gộp ở `4d47af0d` |
| Còn Blocker hoặc Major mở | Không | – |

### 3.2 QA

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| P0/P1/P2 mở trong phạm vi | 0 | `qa/bug-list.md`; BUG-R5-014…016 (P3) đóng ở L4 |
| Nhận phòng bù, tạo đơn ngày đến đã qua | Đạt | L3: Q1–Q6 (biên ngày, 403 với FD/FDL, 409 khi căn bận, `USE_CHECK_IN`), E1 (thiết bị tin cậy) |
| Chỉ số nhận phòng của đơn nhận phòng bù | Đạt | L3 Q8. `lateUntil` = ngày nhập bù + 11 |
| Đã thu ngoài Desk | Đạt | L3 Q11–Q15, E2, E3, E6; L4 #2, #5, #6, #8. Không vào ca, không vào đối soát, đảo được, MGR bị giới hạn phạm vi |
| Không thu tháng 11 hai lần | Đạt (2 kỳ) | L3 Q16, L4 #9. Bản 3 kỳ chạy ngày 01/12 |
| Liên hệ cơ sở, miễn trừ hotline | Đạt | L3 Q17, Q18; L4 #3 |
| Hồi quy `checkIn` thường | Đạt | L4 #10 (Q7) |
| RBAC 8 vai | Đạt | L3 Q27 |
| Hồi quy FB-INV-012 | Đạt | L3 Q28 |
| Chưa chạy | 1.9, 1.14, 2.3, 3.6, R3, Q16 bản 3 kỳ; Q9, Q19–Q24 (12.4/12.5 chưa lên); Q25 (CI phủ) | – |

### 3.3 QC tự kiểm mẫu

| Mẫu | Kết quả |
|---|---|
| `migrate.ts` | `SET lock_timeout` đặt sau khóa advisory, mặc định 10 s, `RESET` khi xong (dòng 23–84). Đúng §12.6 |
| `0100_go_live_fix_fb_inv_012.sql` | Thêm cột cho phép null, cột `catch_up` có default; xóa rồi thêm lại 2 CHECK; thêm 3 CHECK mới; `INSERT` vào `config_parameter_def`. Không `UPDATE`/`DELETE` dữ liệu. Thêm CHECK có quét dòng cũ, nên cần mục 2.1 |
| Lượt 1, vẫn giữ | Cửa sổ chốt [30/11, 01/12], trễ tính theo ngày nhập, VAT 45.440 / 4.250, làm tròn xuống |

### 3.4 Hạ tầng

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| 0099 trên bản sao staging | Đạt | OPS §19 |
| 0099 + 0100 trên bản sao (73 → 75) | **Chưa làm** | Điều kiện 14 |
| 0100 trên staging thật | Đạt gián tiếp | QA L3 Q26 (deploy `ok`, mọi phần của 0100 dùng được). Số 75 chờ OPS (điều kiện 16) |
| Kiểm chỉ đọc production | Đạt | OPS §20 |
| Kiểm giao dịch đang mở | Sửa cách kiểm | §20.2: câu `pg_stat_activity` mù dưới vai `ottimo_readonly`, số 0 ở §18.3 không có giá trị. Nay dùng `pg_locks` |

### 3.5 QC không kiểm được

- Dữ liệu production ngoài các số đếm ở §20.
- Ngày đến thật của khách: Desk có 6 đơn dài hạn, brief nói 10 căn.
- In giấy trên máy in quầy.
- Các ca cửa sổ, chưa tới ngày.
- Thuế suất VAT, chờ kế toán.

## 4. Điều kiện

Trạng thái: **Mở**, **Xong**, **Đổi** (giữ nhưng sửa nội dung), **Mới**.

### Nhóm A – trước khi deploy

1. **[Đổi] Checklist OPS §19.6.**
   - Tag đúng commit `4d47af0d` (hoặc commit có thư mục migrations giống hệt), đối chiếu digest. Giờ vắng. Sao lưu thủ công có `OK`. Ghi số đếm trước.
   - Mục 4 thay bằng câu `pg_locks` (§20.2): số tiến trình khác bằng **0**. Khác 0 thì đợi 1–2 phút chạy lại; vẫn khác 0 thì hoãn.
   - Sau deploy phải thấy `migrations: 75 applied / 75`, `config_parameter_def` +4 (3 khóa của 0099, 1 khóa của 0100).
   - `lock_timeout` là lớp chặn thứ hai: migrate hết thời gian thì `deploy.sh` dừng trước khi đổi container. OPS dời sang lượt giờ vắng kế tiếp, không ép.
   - Người làm: **OPS**, lúc deploy.
2. **[Xong]** Kiểm production chỉ đọc (OPS §20):
   - tài khoản nhận VietQR: có;
   - địa chỉ, hotline: trống (chuyển sang điều kiện 4);
   - đơn dài hạn: 0 `in_house`, 6 `confirmed` có ngày đến tháng 11 (chuyển sang điều kiện 5 và 17).
3. **(chuyển xuống Nhóm B)**
14. **[Mới] Chạy thử 73 → 75 trên bản sao staging**, cùng cách §19:
    - Bản sao lưu staging chụp trước 0099 (ví dụ `20261117T203350Z`). Image migrate là image của `4d47af0d`.
    - Đạt khi:
      - 75 migration, không ERROR;
      - mọi CHECK và FK `convalidated`;
      - md5 các bảng cũ không đổi, trừ `config_parameter_def` (+4);
      - tổng 3 folio mẫu khớp;
      - api mới `/health` ok;
      - ghi lại thời gian SQL và số lần chờ khóa.
    - Người làm: **OPS**, trước deploy.
15. **[Mới] Kiểm production chỉ đọc theo các CHECK của 0100** (`SQLRO`, chỉ in số đếm):
    - số dòng `staff_notification` có `kind` không nằm trong danh sách mới = 0;
    - số dòng `payment` có `method` không nằm trong danh sách mới = 0.

    Khác 0 thì không deploy, BE sửa migration. Người làm: **OPS**, trong ngày deploy, trước khi duyệt.
16. **[Mới] Q26:** OPS xác nhận staging có 75 migration, các CHECK mới `convalidated`, khóa `long_stay_cleaning_fee_by_room` có giá trị `{}`. **OPS**, trước deploy.

### Nhóm B – sau deploy, trước khi nhận phòng bù đơn đầu tiên và trước phiếu đầu tiên

3. **[Đổi] Giá dọn thêm dài hạn.** INV đã chọn 150.000/200.000 theo hạng (decision-log 18/11). 12.4 chưa lên, nên tới lúc đó dùng **dòng nhập tay** theo hướng dẫn. Cần:
   - (a) Không ai đặt `long_stay_cleaning_fee_by_room` cho tới khi 12.4 có hook (ARC 197-03). Sau deploy OPS kiểm giá trị là `{}`.
   - (b) Hướng dẫn ghi rõ: lễ tân ghi 150.000/200.000 thế nào, và xử lý ra sao khi yêu cầu dọn của khách tự tính 100.000 (`adhoc_cleaning_fee`).
   - (c) DOM sửa BR-LS-07 theo giá INV đã chọn.
   - Người làm: **DOM + lễ tân trưởng**, trước phiếu 12/2026.
4. **[Mở] Địa chỉ, hotline:** production đang trống. OWN nhập trên Desk (Liên hệ cơ sở, A129, chỉ OWN), in thử một phiếu A5 trên máy quầy, INV xem khối VietQR (ngân hàng, chủ tài khoản, 4 số cuối). Người làm: **OWN/INV**, ngay sau deploy, trước phiếu đầu tiên.
5. **[Đổi] Hướng dẫn ra mắt** (`go-live-guide.md`, DOM đang sửa). Phải có đủ:
   - (a) Đối chiếu **ngày đến thật** của từng khách trước khi bấm. Desk có 6 đơn, brief nói 10 căn (OPS §20.3). Khách ở từ trước 01/11 thì nhập ngày đến 01/11, ngày bắt đầu HĐ thật ghi vào ghi chú (G2).
   - (b) Nhận phòng bù do MGR/OWN làm trên máy quầy tin cậy. Chỉ số nhận phòng do FDL+ nhập kèm lý do, trước `lateUntil` (ngày nhập bù + 11). **Không nâng `lateMaxDays` nữa.**
   - (c) **Phát hành phiếu tháng nhận phòng, rồi ghi "đã thu ngoài Desk", không gửi cho khách** (mục 2.3). ORC xác nhận với INV rằng câu "không phát hành phiếu tháng 11" được hiểu theo cách này.
   - (d) Dòng dọn thêm nhập tay (điều kiện 3).
   - (e) Xử lý đơn ngắn ngày `confirmed` đã qua ngày đến (OPS §20.3).
   - UXD soát chữ nếu có câu gửi khách. Người làm: **DOM + ORC**, xong trước lần nhận phòng bù đầu tiên, tức trước ngày deploy.
17. **[Mới] Nhập xong các đơn dài hạn trước 30/11:** mọi khách dài hạn đang ở đều `in_house` trên Desk và có chỉ số nhận phòng, để chốt tháng 11 trong cửa sổ 30/11–01/12. Người làm: **MGR/OWN + FDL**, hạn **29/11**. Chậm nhất có thể là 11/12; sau ngày đó ngày đến 01/11 bị chặn `PREVIOUS_MONTH_CLOSED`.

### Nhóm C – trước khi phát hành phiếu 12/2026 có điện nước

6. **[Đổi] Chạy lại trên staging, trước production:**
   - 30/11: 1.9;
   - 01/12: 1.14, 2.3 và **Q16 bản 3 kỳ** (OTM-00412, đơn nhận phòng bù);
   - 02/12: R3.

   Phải đạt 1.9, 1.14, 2.3 và Q16 thì production mới phát hành phiếu 12/2026. Production vẫn ghi chỉ số đúng ngày, không phải chờ. Phiếu tháng nhận phòng chỉ có tiền thuê (của các đơn nhận phòng bù) được phát hành và ghi ngoài Desk trước 30/11, vì đã có bằng chứng ở Q10, Q11, Q15, Q16. Nếu OPS bật được image `-test` trên staging thì chạy sớm hơn. Người làm: **QA**.
7. **[Mở]** 3.6 (mức nhắc): QA kiểm ngày 05, 06 và 08/12. Không chặn phát hành phiếu. **QA**.
8. **[Mở]** Kế toán xác nhận VAT điện 8 %, nước 5 % và giá điện bán lại. Nên có trước 01/12. **INV**.

### Nhóm D – sau phát hành (có hạn)

9. **[Đổi] BR-LS-17 đọc bù:** INV đã xác nhận MGR và OWN được làm (18/11). Cột `catch_up` đã có trong 0100, nhưng mã 12.5 chưa lên (Q9, Q20–Q24 dời). Hạn **trước 11/12**. Tới lúc đó, lỡ hạn thì OWN nâng `lateMaxDays` tạm thời (áp cho cả cơ sở), ghi trong sổ vận hành. **ARC, BE, FE, SEC, QA.**
10. **[Xong]** `lock_timeout` cho migrator: §12.6 trong #197, có test CI `migrate-lock-timeout.test.ts`. Q25 chưa chạy trên staging; chấp nhận nhờ CI cộng lớp kiểm `pg_locks`.
11. **[Đổi]** SEC 190-08 đã đóng (12-08). Còn **190-07** (test J16 xóa ảnh `meter`), hạn **31/12**. **BE.**
12. **[Đổi] Đưa vào backlog, có hạn:**
    - ARC 194-01/02;
    - ARC 197-03: tới PR 12.4, hook phải gộp trước khi bật ô;
    - ARC 197-04 (31/12), SEC 197-03 (trước khi gộp PR-M), SEC 197-05 (31/12);
    - `reference` "TK 0123456789" vẫn lọt (SEC 197 Minor);
    - ARC 199-S1;
    - ghi chú QA L3.4: Q3 lệch mã giữa hai chỗ trong contract, `phonePublic` chưa áp dụng, `min` các ô ngày;
    - thẻ OPS §20.2: chọn giữa cấp `pg_read_all_stats` hoặc giữ cách `pg_locks`, rồi sửa chữ §19.6 mục 4.
13. **[Mở]** DOM gộp BR-LS-01…17 vào `product/docs/business-rules.md`. Hạn **30/11**. **DOM.**

## 5. Khung giờ phát hành khuyến nghị

**Deploy 23–26/11, giờ vắng.** Nên làm ngay khi xong điều kiện 14, 15, 16 và hướng dẫn ở điều kiện 5. Sau đó:

| Mốc | Việc |
|---|---|
| Ngày deploy, ngay sau | Điều kiện 1 (kiểm sau deploy), 3a, 4 (OWN nhập liên hệ, in thử) |
| Deploy → 29/11 | Điều kiện 17: nhận phòng bù, chỉ số nhận phòng, phiếu tháng nhận phòng ghi ngoài Desk |
| 30/11–01/12 | Production ghi chốt tháng 11. Staging chạy điều kiện 6 trước |
| 01–05/12 | Phát hành phiếu 12/2026 sau khi điều kiện 6 đạt (hạn phiếu 05/12) |

Không deploy khi có một trong các điều sau:
- `pg_locks` ≠ 0 sau khi chạy lại;
- điều kiện 14 hoặc 15 không đạt;
- staging không ra 75;
- sao lưu thủ công không có `OK`.

Muộn nhất 27/11 vẫn được, nhưng chỉ còn 2 ngày để nhập các đơn. Lên sau 30/11 thì chốt tháng 11 thành ghi trễ. Sau 11/12 thì không còn nhận phòng bù với ngày đến tháng 11.

## 6. Rủi ro chủ đầu tư cần biết

1. **Thu tháng 11 hai lần** nếu lễ tân bỏ qua phiếu tháng nhận phòng thay vì phát hành rồi ghi ngoài Desk (mục 2.3).
2. **Nhập sai ngày đến thật** thì sai tiền thuê kỳ lẻ và sai phiếu cuối. Desk mới có 6 đơn trên 10 căn.
3. **Giá dọn 150.000/200.000** phải nhập tay cho tới khi 12.4 lên. Desk tự tính 100.000 cho yêu cầu dọn của khách.
4. **VAT điện nước** mới chứng minh bằng test đồng hồ giả. Lần chạy thật đầu tiên rơi đúng ngày chốt (điều kiện 6).
5. **Lỡ hạn ghi trễ** vẫn chặn phiếu của căn đó cho tới khi BR-LS-17 lên.
6. **0100 khóa ngắn các bảng `payment`, `reservation`, `staff_notification`**, chặn cả đọc, ước lượng dưới 1 giây với dữ liệu hiện có. Có `lock_timeout` 10 s làm chốt chặn.

## 7. Việc INV phải tự làm

1. Xác nhận cách hiểu ở mục 2.3: phiếu tháng 11 vẫn phát hành, ghi "đã thu ngoài Desk", không gửi khách.
2. Cho lễ tân danh sách ngày đến thật và ngày bắt đầu HĐ của các khách dài hạn đang ở, kèm số điện nước đầu tháng 11.
3. Sau deploy, OWN nhập địa chỉ và hotline trên Desk; xem phiếu in thử, khối VietQR.
4. Hỏi kế toán về VAT điện nước và giá điện bán lại.
5. Duyệt bước Release production.

## 8. Giả định

- Image deploy là của `4d47af0d`, hoặc một tag mà thư mục migrations giống hệt.
- Danh sách `kind` của `staff_notification` trong 0100 gồm mọi loại production đang có. Điều kiện 15 kiểm điều này.
- `goLiveDeferred.cleaningByRoom = false` ẩn 12.4 trên Desk (UXD 196-06, QA E4).
- Không có ESC mới. Mục 7.1 là xác nhận cách hiểu một quyết định INV đã đưa ra; ORC hỏi cùng lượt duyệt Release.

## 9. Đổi so với lượt 1 (18/11)

- Ứng viên `5e98ec5a` → `4d47af0d`.
- Điều kiện: 2 và 10 xong; 1, 3, 5, 6, 9, 11, 12 đổi nội dung; thêm 14, 15, 16, 17.
- Kiểm `long_tx` chuyển sang `pg_locks`.
- Khung giờ phát hành từ 24–27/11 thành **23–26/11**, vì phải chừa ngày nhập đơn trước 30/11.

## 10. Xác nhận lại 20/11 – ứng viên mới `b250cd37`

- Tác giả: QC | Round 5 – bước **QC** (rút gọn) | 20/11/2026. QC không commit.
- Ứng viên: `main` @ `b250cd37` = `4d47af0d` + BE #200, FE #201 (12.4 giá dọn theo căn) + BE #203, FE #202 (BUG-R5-017).

### 10.1 Quyết định

**Cổng chuyển sang `b250cd37`: vẫn ĐẠT CÓ ĐIỀU KIỆN**, cùng khung deploy **23–26/11, giờ vắng**. Chạy thử 73 → 75 của OPS §21.2 **vẫn giữ giá trị**. Các điều kiện ở mục 4 giữ nguyên, trừ những chỗ sửa ở 10.4.

### 10.2 Bằng chứng

| Kiểm | Kết quả | Bằng chứng |
|---|---|---|
| Migration không đổi | Đạt | QC chạy lại: `git diff --quiet 4d47af0d b250cd37 -- product/services/api/src/db` → không khác (gồm `migrations/`, `migrate.ts`, `seed/`, `schema/`). `openapi-schemas.ts` là file sinh, không phải SQL |
| Vì sao §21.2 còn giá trị | Đạt | §21.2 kiểm SQL 0099 + 0100 và migrator trên bản sao dữ liệu. Cả hai giống hệt từng byte. Phần đổi là mã ứng dụng (folio, parameters, guest-portal) và FE. Không bảng, CHECK hay khóa danh mục mới. §21.3 (production 0/26, 0/3) cũng còn giá trị vì danh sách CHECK không đổi; vẫn chạy lại trong ngày deploy (§21.5 mục 4b) |
| Review | Đạt | `ARC-on-be-pr-200.md`: #200 **DUYỆT**, ARC-BE-197-03 **đóng** (hook đã có); mục D: #203 **DUYỆT**, không thẻ. `SEC-on-be-pr-200.md`: **Đạt**, 3 Minor, BE đã sửa cả ba (`responses/BE-responses.md` dòng 242–244). `UXD-on-fe-pr-201.md`: DUYỆT, 201-01 đã sửa (`86d622cb`), 201-02 dời. `UXD-on-fe-pr-202.md`: duyệt có điều kiện, 202-01 đã sửa (`e4b1042f`), câu mới đúng như QA L6 #11 thấy |
| Blocker/Major mở | Không | – |
| QA | Đạt | L5: 11/12 (Q19–Q21, Q16 smoke đạt; trượt 1 = BUG-R5-017). L6 trên staging `b250cd37`: **13/13**, BUG-R5-017 **đóng** (`qa/bug-list.md` dòng 68, 958–983). P0/P1 mở: 0. P2 mở trong phạm vi: 0 |
| CI | Đạt | Run `44570372593` (push `b250cd37`) success; run lịch `44652148256` 20/11 success |
| QC tự kiểm mẫu | Đạt | `parameters.service.ts` dòng 78, 293–295: `SAME_DAY_EDITABLE_KEYS` chỉ có `long_stay_cleaning_fee_by_room`, ghi đè chỉ khi `effectiveFrom === today`; hook kiểm chạy trước (QA L6 #10). `parameter.service.ts`: chỉ đổi mã trường thành `ALREADY_IN_FORCE`, vẫn 422. `goLive.ts`: `cleaningByRoom: true`, `catchUp: false` – 12.4 vào v1.0.7, 12.5 vẫn tắt |
| Hướng dẫn | Đạt | `go-live-guide.md` 7.1 (HEAD `e1afcb65`): OWN nhập đủ 10 căn ngay sau deploy, sửa trong ngày được, giữ dòng phần chênh tới khi thử đúng giá; chữ khớp Desk ("Thêm phát sinh", "Dọn phòng thêm") theo ghi chú QA L6 |

Ghi nhận, không chặn: #203 không có review SEC riêng. QC chấp nhận vì #203 không đổi RBAC (vẫn OWN/MGR theo A101), đi đúng đường `sameDayOverride` có audit mà SEC đã xem ở #200, và chỉ áp cho một khóa.

### 10.3 Không còn đúng từ lượt 2

- Giả định mục 8 "`goLiveDeferred.cleaningByRoom = false`": **bỏ**. 12.4 nay nằm trong v1.0.7.
- Điều kiện 3a "không ai đặt `long_stay_cleaning_fee_by_room`": **bỏ**, vì hook đã có (ARC 197-03 đóng). Thay bằng 3a mới ở 10.4.
- Rủi ro mục 6.3 "phải nhập tay tới khi 12.4 lên": nay chỉ còn trong khoảng từ deploy tới khi OWN nhập bảng và thử đúng giá.
- Điều kiện 16 "staging có `{}`": đã đạt ở thời điểm 19/11. Nay staging có bảng 10 căn do QA L6 nhập, đó là đúng ý, không cần kiểm lại.

### 10.4 Điều kiện còn mở

**Trước deploy**

1. **[Đổi] Điều kiện 1 / OPS §21.5 mục 1 và 7:** tag Release trên **`b250cd37`** (bản QA L6 đã kiểm trên staging). Commit sau đó chỉ là tài liệu; nếu tag một commit sau thì thư mục `product/services/api/src/db` phải giống hệt. Digest api `d9391f1f…f412` và chữ `OK: sha-4d47af0dd6a7 is live` ở §21.5 **không còn dùng được**: OPS lấy digest từ artifact `image-digests` của run `44570372593`, đối chiếu với digest api staging đang chạy, và sau deploy chờ `OK: sha-b250cd37… is live`. Các mục còn lại của §21.5 giữ nguyên: giờ vắng, sao lưu thủ công có `OK`, `pg_locks` = 0, hai câu đếm của §21.3 = 0/0, số đếm trước (73 · `config_parameter_def` 200). **OPS**, lúc deploy.
2. **[Giữ] Điều kiện 5:** mục 5(c) – ORC xác nhận với INV cách hiểu "phiếu tháng 11 vẫn phát hành, ghi đã thu ngoài Desk, không gửi khách". Chưa thấy ghi nhận trong decision-log. **ORC**, trước deploy.
3. **[Giữ]** INV duyệt bước Release production (mục 7.5).

**Sau deploy**

4. **[Đổi] Điều kiện 3:**
   - (a) Ngay sau deploy OPS kiểm `long_stay_cleaning_fee_by_room` = `{}` (0 dòng `config_parameter`), như §21.5 mục 7.
   - (b) Rồi OWN nhập đủ 10 căn theo guide 7.1, **trước khi gửi link trang khách cho khách dài hạn**. FDL thử giá trên một folio Studio và một folio Premium/Signature (150.000 / 200.000) rồi mới bỏ dòng phần chênh. Yêu cầu khách gửi trước lúc đó giữ 100.000, vẫn cần dòng phần chênh.
   - (c) DOM sửa BR-LS-07: đã có trong `business-rules.md`, gộp cùng điều kiện 13.
   - Người làm: **OPS, OWN, FDL**, ngày deploy.
5. **[Giữ]** Điều kiện 4 (OWN nhập địa chỉ, hotline, in thử A5, INV xem khối VietQR) và 17 (mọi đơn dài hạn `in_house` có chỉ số nhận phòng, hạn **29/11**, chậm nhất 11/12).

**Trước phiếu 12/2026 và sau phát hành:** điều kiện 6, 7, 8, 9, 11, 12, 13 giữ nguyên nội dung và hạn. Bổ sung vào danh sách backlog của điều kiện 12:
- ARC 200-S1;
- UXD 201-02 (tên tiếng Việt của các khoản khác trên giao diện EN);
- ghi chú QA L6 về vị trí nút "Chọn ngày mai";
- rủi ro ARC đã chấp nhận ở mục B phụ lục BUG-R5-017: khách mở trang yêu cầu, OWN sửa giá, khách gửi thì giá mới được chụp. Hướng round sau là `feeAcceptedVnd`.

### 10.5 QC không kiểm được

- Digest image của `b250cd37` (chỉ có trong artifact CI và trên staging).
- Staging có đúng 75 migration sau lần deploy `b250cd37`. Không có migration mới nên rủi ro thấp; OPS đọc journal staging cùng lúc với mục 10.4.1.

### 10.6 Giả định

- Staging đang chạy image của `b250cd37`, đúng như QA L6 ghi.
- Không có ESC mới.

> **Ghi chú ORC 20/11:** điều kiện 10 (2) / 5c đã có trong `01-decisions/decision-log.md`, dòng 2026-11-19 "INV xác nhận phiếu tháng 11". Phiếu vẫn phát hành, ghi "Khách đã trả ngoài app", không gửi khách, không thu tiền. Điều kiện này đóng.
