# QC gate – FB-INV-012 phiếu thanh toán tháng khách dài hạn (ứng viên v1.0.7)

- Tác giả: QC | Round 5 – bước **QC** | 18/11/2026
- Ứng viên: `main` @ `5e98ec5aec1b` (BE #190 + FE #189 + BE #194 + FE #195), image `ottimo-api:sha-5e98ec5aec1b` đang chạy trên staging từ 17:40 18/11.
- Phạm vi: chỉ FB-INV-012. Không gồm các việc v1.0.6 đã lên, không gồm BUG-R5-002/007 (có sẵn trên production từ trước, ngoài phạm vi bản này).
- QC không commit (theo giao việc). ORC ghi quyết định vào `01-decisions/decision-log.md`.

## 1. Quyết định

**ĐẠT CÓ ĐIỀU KIỆN** – được deploy production trước 30/11. Phát hành phiếu tháng 12/2026 có điện nước trên production còn chờ các điều kiện ở mục 3.

Lý do ngắn:
- 0 P0, 0 P1. Mọi lỗi FB-INV-012 (BUG-R5-008…013) đã đóng 18/11.
- Phần tiền kiểm được đều khớp tính tay: kỳ lẻ, tiền thuê trả trước, làm tròn xuống, folio, VietQR, hủy và lập lại. QC tự kiểm lại công thức VAT (mục 2.3).
- Mọi thẻ Major của ARC, SEC và UXD đã đóng. Còn lại chỉ Minor, đều có hạn.
- 0099 đã chạy thử trên bản sao staging: sạch, 721 ms, số đếm khớp.
- Còn hở 4 ca cửa sổ chốt công tơ chưa chạy trên staging thật (1.9, 1.14, 2.3, 3.6) và 1 ca ghi trễ dương (R3). Đây chưa phải "đã kiểm"; CI dùng đồng hồ giả mới là bằng chứng thay thế. Vì vậy QC chặn bước **phát hành phiếu có điện nước** trên production, không chặn bước deploy.

## 2. Bảng kiểm

### 2.1 Quy trình review

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| ARC review BE | Đạt | `reviews/ARC-on-be-pr-190.md`: lượt 2 **APPROVE**, 01–06, 08, 11, 12 Closed. 10 (CI audit) gỡ bằng OPS #191 + ngoại lệ picomatch (decision-log 18/11). 07 đóng nhờ OPS §19. `ARC-on-be-pr-194.md`: APPROVE, còn 194-01/02 Minor |
| ARC review FE | Đạt | `ARC-on-fe-pr-189.md`: lượt 2 approve có điều kiện; 05/06 làm sau khi BE merge. #189 đã merge sau CI xanh. 189-09 phần UI có trong #195 (QA L2 R5, R6) |
| SEC | Đạt | `SEC-on-be-pr-190.md` lượt 2 **APPROVE**: Major 01 (thời hạn lưu ảnh đồng hồ), 02 (audit sửa nháp) Closed; 03, 04, 06 Closed; 05 dời có đồng ý. Còn **07, 08 Minor**, SEC ghi "không chặn production" |
| UXD | Đạt | `UXD-on-fe-pr-189.md` L2 **DUYỆT**, 4 Major đóng; 189-12…16 Done (`responses/FE-responses.md`). `UXD-on-fe-pr-195.md` **DUYỆT**, 195-01…05 Done |
| DOM | Đạt | `fb-inv-012/DOM-rules.md` BR-LS-01…16 theo INV 17/11. BR-LS-17 mới là đề xuất, `[GIẢ ĐỊNH]` trong decision-log |
| Thẻ Major/Blocker còn Open | Không có | Như trên |

### 2.2 QA

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| P0/P1 mở | 0 | `qa/bug-list.md`: BUG-R5-008…013 Đóng 18/11. BUG-R5-002, 007 (P2) ngoài phạm vi |
| Lượt 1 | 43 ca: 33 đạt, 6 trượt (đã sửa), 4 chưa chạy | `qa/fb-inv-012-staging.md` mục 0 |
| Lượt 2 | 18 ca: 17 đạt, 1 chưa chạy (R3) | như trên, L2.1 |
| Phủ tiêu chí INV | Có: đầu kỳ nhập bắt buộc, hao hụt không tính khách (1.10, 1.12), cuối < đầu bị chặn (1.11), dịch vụ trong kỳ (2.4), không có phí 200.000 (2.5), hạn ngày 05 (2.7), quá hạn (R18) | QA mục 2–3 |
| Chưa chạy trên staging thật | **1.9** chốt cuối kỳ M + đầu kỳ M+1; **1.14** cảnh báo trên nháp; **2.3** điện 4.000 + VAT 8 %, nước 25.000 + VAT 5 %; **3.6** mức nhắc 05/06/08/15; **R3** ghi trễ dương theo ngày nhập | Thay bằng CI `desk-clock` E2E (`fb012-monthly-statement.r5.spec.ts`) trên `f871ab1e`, vitest FE 31 ca, BE vitest Postgres. QC coi đây là bằng chứng có điều kiện, **chưa** thay được lần chạy thật |

### 2.3 QC tự kiểm mẫu (đọc code trên `5e98ec5a`)

| Mẫu | Kết quả |
|---|---|
| Image ứng viên = code đã review | `git diff f871ab1e 5e98ec5a -- migrations` rỗng. `HEAD` không đổi gì trong `product/services`, `apps`, `packages` sau `5e98ec5a` |
| Cửa sổ chốt (`meter-readings.service.ts` `windowOf`, `gate`) | Cuối kỳ 11 và đầu kỳ 12 cùng cửa sổ [30/11, 01/12] (`daysBeforeMonthEnd` 0, `daysAfter` 1). Tính trễ theo **ngày nhập** (`entered > w.to`), có lý do và FDL+ mới qua, tới `lateUntil` = 11/12. Khớp contract §11.2 và bản sửa BUG-R5-008 |
| VAT điện nước (`statement-math.ts` dòng 444–463) | Ví dụ DOM: 142 kWh × 4.320 = 613.440, net 568.000, VAT **45.440**; 3,4 m³ × 26.250 = 89.250, net 85.000, VAT **4.250**. Khớp BR-LS-08 và UXD 189-01 (Cộng 9.453.000, làm tròn −690, Tổng 9.502.000) |
| Làm tròn tổng (`roundDownTotal`) | Làm tròn xuống, phần dư là dòng âm, đúng BR-LS-09 |

### 2.4 Hạ tầng và migration

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| 0099 trên staging | Đạt | OPS §18.1: 74/74, 0 ERROR |
| 0099 trên bản sao staging (ARC-07) | Đạt | OPS §19: 721 ms, SQL 25,7 ms, 0 chờ khóa; 124/125 bảng md5 giống hệt (bảng còn lại +3 khóa danh mục, đúng thiết kế); 3 folio mẫu khớp; api mới `/health` ok |
| Rủi ro khóa production | Thấp | OPS §18.3: `payment` 3 dòng. Còn `lock_timeout` chưa đặt trong migrator → OPS checklist §19.6 mục 4 (`long_tx` = 0, khác 0 thì hoãn) |
| Quay lui | Có | `rollback.sh sha-f8791cf83b63`; 0099 chỉ thêm. Chưa kiểm api cũ trên DB 74 (OPS §19.6 mục 7 nói rõ). QC chấp nhận vì luật "expand first" |

### 2.5 Nhất quán tài liệu – thiết kế – code

| Điểm | Kết quả |
|---|---|
| Contract §11 ↔ code | Khớp ở các mẫu QC đọc (2.3) |
| DOM-rules ↔ code | Khớp, trừ **giá dọn thêm**: BR-LS-07 ghi 150.000/200.000 theo hạng; `production-defaults.ts` dòng 395 và staging ghi `adhoc_cleaning_fee` = 100.000; `tham-so-quy-tac.md` có `long_stay_cleaning_fee_by_room` với bảng giá 01/11 (100/120/130/150). Ba nguồn lệch nhau. Đây là dữ liệu tham số, không phải mã, nhưng **làm đổi tiền trên phiếu** → điều kiện 3 |
| DOM-rules ↔ business-rules.md | BR-LS-01…16 chưa gộp vào `product/docs/business-rules.md` (file đang có sửa chưa commit của vai khác). Không chặn, có hạn ở mục 4 |

### 2.6 QC không kiểm được

- **Dữ liệu production**: `property.addressLine`, `hotline`; tài khoản nhận `payment_receiving_account`; giá dọn; số đơn dài hạn đang ở và ngày đến của các đơn đó. QC không có quyền đọc production.
- 4 ca cửa sổ và R3 trên staging thật (chưa tới ngày).
- In giấy thật trên máy in quầy (QA chỉ kiểm PDF A5/A4).
- Câu chữ VAT với kế toán (DOM-rules câu hỏi 3).

## 3. Điều kiện (có hạn)

Nhóm A – trước khi deploy production.

1. **Làm đủ checklist OPS §19.6** (mục 1–6): tag đúng commit có 0099 giống `5e98ec5a`, đối chiếu digest; giờ vắng; sao lưu thủ công; `long_tx` = 0 ngay trước khi duyệt, khác 0 thì hoãn; số đếm trước/sau; `migrations: 74 applied / 74`. **OPS**, lúc deploy.
2. **Kiểm dữ liệu production chỉ đọc (`SQLRO`, chỉ in số đếm hoặc có/không)**. **OPS**, trước hoặc ngay sau deploy, trước phiếu đầu tiên:
   - `property.addressLine`, `hotline` có giá trị (null thì chân phiếu trống như staging);
   - `payment_receiving_account` có bản hiệu lực hôm nay;
   - số đơn dài hạn đang ở, chia theo "đến trước 01/11" / "đến trong tháng 11", và đã có lần đọc `checkin` hoặc `period_start` 11/2026 chưa.

Nhóm B – trước khi phát hành phiếu đầu tiên trên production (kể cả phiếu tháng nhận phòng).

3. **OWN chốt giá dọn thêm cho khách dài hạn**, rồi đặt tham số trên production cho khớp: `adhoc_cleaning_fee` và/hoặc `long_stay_cleaning_fee_by_room`. DOM sửa BR-LS-07 theo giá INV chọn. **INV/OWN + DOM**, hạn **29/11**.
4. **Chân phiếu đủ địa chỉ và hotline** (theo kết quả điều kiện 2). Có in thử một phiếu A5 trên máy in quầy; INV xem bank, chủ tài khoản, 4 số cuối trên khối VietQR. **OWN + QA**, trước phiếu đầu tiên.
5. **Hướng dẫn cho khách đang ở từ trước khi có Desk** (DOM, 1 trang, UXD soát chữ nếu có câu cho khách). Cần vì:
   - khách đến trước 01/11 chưa có đầu kỳ 11/2026. Hạn ghi trễ của đầu kỳ 11 (`lateUntil` 11/11) đã qua. Thiếu đầu kỳ thì phiếu 12/2026 bị `METER_READING_MISSING`, **kể cả tiền thuê tháng 12** cũng không phát hành được;
   - khách được nhập với ngày đến trong tháng 11 sẽ hiện "phiếu tháng nhận phòng" (tiền thuê kỳ lẻ). Nếu khách đã trả tháng 11 ở nền tảng cũ thì **không được phát hành** phiếu đó.

   Hướng dẫn phải nói rõ: phiếu nào phát hành, phiếu nào bỏ; đầu kỳ 11 lấy ở đâu. Cách gỡ tạm không cần mã: OWN nâng `lateMaxDays` lên 31 (hạn mới tới 02/12), FDL ghi đầu kỳ 11 kèm lý do, rồi hạ về 10. Chỉ ghi số đọc thật, ngày đọc thật; không có số thật thì bỏ trống. Nếu không gỡ kịp thì phiếu 12/2026 của các căn này làm ngoài app. **DOM + ORC**, hạn **27/11**.

Nhóm C – trước khi phát hành phiếu 12/2026 có điện nước trên production.

6. **Chạy lại các ca cửa sổ trên staging, trước production**. **QA**:
   - **sáng 30/11**: 1.9 (cuối kỳ 11 + đầu kỳ 12 với OTM-00408/00409);
   - **sáng 01/12**: 1.14 (cảnh báo nháp) và 2.3 (VAT điện nước, tính tay);
   - **02/12**: R3 (ghi trễ dương).

   Phải đạt 1.9, 1.14, 2.3 thì lễ tân production mới phát hành phiếu 12/2026. Ghi chỉ số trên production ngày 30/11–01/12 vẫn làm bình thường, không phải chờ QA: lần đọc còn hủy được khi chưa lên phiếu đã phát hành, và hạn phiếu là 05/12 nên vẫn còn 3–4 ngày. Nếu 1.9/1.14/2.3 trượt: không phát hành phiếu có điện nước, BE sửa nóng trước 05/12; tiền thuê tháng 12 thu tạm bằng đường thu hiện có.
   - Nếu OPS bật được image `-test` (đồng hồ giả) trên staging trước 30/11, QA chạy 4 ca + R3 sớm và điều kiện này đóng trước deploy. QC khuyến nghị thử cách này trước.
7. **3.6 (mức nhắc 05/06/08/15)**: QA kiểm trên staging ngày 05, 06 và 08/12. Không chặn phát hành phiếu, vì chỉ là nhắc, không đổi tiền. Tới lúc đó, lễ tân dùng tab "Quá hạn" ở S16 để theo dõi. **QA**.
8. **Kế toán xác nhận VAT điện 8 % / nước 5 %** (DOM-rules câu 3, INV 17/11 "chờ kế toán"). Nên có trước 01/12. Chưa có thì phát hành theo mức đề xuất; tham số OWN đổi được, nhưng phiếu đã phát hành thì không đổi. **INV**.

Nhóm D – sau phát hành (Minor, có hạn).

9. **BR-LS-17 đọc bù** (`DOM-late-entry-proposal.md`): INV xác nhận giả định (MGR/OWN được đọc bù), rồi ARC → BE → FE → SEC → QA làm như bản sửa nhỏ. Hạn **trước 11/12** (`lateUntil` của kỳ chốt 11). Tới lúc đó, lỡ hạn thì dùng cách gỡ tạm ở điều kiện 5, và OPS/ORC ghi vào sổ vận hành cho lễ tân. **DOM, ARC, BE, FE**.
10. **`lock_timeout` cho migrator** (`src/db/migrate.ts`, OPS §18.3). Làm trong cùng PR với migration kế tiếp: BR-LS-17 nhiều khả năng cần 0100 (cột `catch_up`). Hạn: trước bản production có migration kế tiếp. **BE + ARC**.
11. **SEC 190-07** (test J16 xóa ảnh `meter`) và **190-08** (đặt mốc lưu ảnh khi đơn bị hủy sau hoàn tác nhận phòng): gộp vào PR BR-LS-17. Hạn: cuối Round 5, chậm nhất **31/12**. **BE, SEC duyệt**.
12. **ARC 194-01/02** (ghi chú OpenAPI, nhánh `allOf` trong bộ sinh), QA ghi chú 9.3 (in "Thay phiếu …" trên phiếu lập lại), 9.4 (tên tab "Quá hạn"), 9.5 (đổi căn ngay ngày đến): đưa vào backlog, làm cùng BR-LS-17 hoặc round sau. **BE, FE, UXD, DOM**.
13. **DOM gộp BR-LS-01…16 (+17 khi chốt) vào `product/docs/business-rules.md`** sau khi phần sửa đang dở của file đó được commit. Hạn **30/11**. **DOM**.

## 4. Khuyến nghị thời điểm phát hành

**Phát hành trước 30/11**: nên vào khoảng **24–27/11**, giờ vắng, sau khi xong điều kiện 2 và có hướng dẫn của điều kiện 5. Không nên đợi tới sau lượt chạy lại.

Lý do:
- Cửa sổ chốt tháng 11 chỉ có **30/11–01/12**. Nếu lên sau 01/12, mọi chỉ số chốt tháng 11 đều thành "ghi trễ": cần FDL+ kèm lý do cho từng lần đọc, có cảnh báo `READING_LATE` trên mọi nháp, và lễ tân phải ghi giấy rồi khai lại ngày đọc cũ. Dữ liệu kém sạch hơn, và tháng đầu tiên dễ phát sinh lỗi vận hành.
- Rủi ro của 4 ca chưa chạy nằm ở bước **phát hành phiếu**, không ở bước **ghi chỉ số**. Điều kiện 6 tách hai bước này: production ghi chỉ số đúng ngày, còn phát hành chờ QA đạt trên staging. Staging chạy trước production nửa ngày tới một ngày, và hạn phiếu 05/12 vẫn đủ chỗ.
- Deploy chạm DB rất nhẹ: 0099 dưới 30 ms SQL; `payment` production có 3 dòng.

Không phát hành nếu: `long_tx` ≠ 0 lúc duyệt; sao lưu thủ công không có `OK`; hoặc điều kiện 2 cho thấy chưa có tài khoản nhận VietQR hiệu lực. Khi đó lùi sang lượt giờ vắng kế tiếp, nhưng vẫn trước 30/11.

## 5. Hạng mục trượt / chưa đủ và vai chịu trách nhiệm

| Hạng mục | Vai |
|---|---|
| 4 ca cửa sổ + R3 chưa chạy trên staging thật | QA (OPS nếu bật image `-test`) |
| Giá dọn thêm lệch ở 3 nguồn | DOM + OWN |
| Chưa có hướng dẫn cho khách đang ở từ trước | DOM + ORC |
| BR-LS-17: chưa có đường cho quản lý khi lỡ hạn ghi trễ | DOM → ARC → BE/FE |
| `lock_timeout`, SEC 190-07/08, ARC 194-01/02 | BE, ARC |

## 6. Rủi ro chủ đầu tư cần biết

1. **Tháng đầu, khách đang ở từ trước**: nếu không có chỉ số đầu tháng 11 thật, phiếu 12/2026 của các căn đó không phát hành được trong app (cả tiền thuê). Có cách gỡ tạm bằng tham số, nhưng chỉ đúng khi có số đọc thật. Không có số thật thì phần điện nước tháng 11 của căn đó thu ngoài app hoặc OTTIMO chịu.
2. **Phần VAT điện nước** chỉ mới được chứng minh bằng test tự động với đồng hồ giả. Lần chạy thật đầu tiên rơi đúng ngày chốt tháng. Biện pháp: staging chạy trước, production phát hành sau (điều kiện 6).
3. **Lỡ hạn ghi trễ** (quá 10 ngày sau cửa sổ) chặn cả phiếu của căn đó cho tới khi có BR-LS-17. Gỡ tạm: OWN nâng `lateMaxDays`, áp cho cả cơ sở.
4. **Thuế suất** đang theo đề xuất DOM; kế toán chưa xác nhận. Phiếu đã phát hành không tự đổi khi sửa tham số.

## 7. Việc INV phải tự làm

1. **Chọn giá dọn thêm** cho khách dài hạn: theo căn (bảng giá 01/11) hay theo hạng (150.000/200.000). Sau đó OWN đặt tham số trên Desk production (điều kiện 3).
2. **Cung cấp hoặc kiểm địa chỉ, hotline** in ở chân phiếu. Xem phiếu in thử đầu tiên: khối VietQR phải đúng ngân hàng, chủ tài khoản, 4 số cuối (điều kiện 4). Số tài khoản do INV/OWN nhập trên Desk; đội không nhập.
3. **Cho biết khách đang ở có chỉ số điện nước đầu tháng 11 không** (ghi ở nền tảng cũ hay sổ giấy), và tháng 11 khách đã trả ở đâu, để DOM viết hướng dẫn (điều kiện 5).
4. **Hỏi kế toán** VAT điện 8 %, nước 5 % và giá điện bán lại 4.000 đ/kWh (điều kiện 8).
5. **Xác nhận giả định BR-LS-17**: MGR và OWN được đọc bù, hay chỉ OWN (điều kiện 9).
6. **Duyệt bước Release production** như các lần trước.

## 8. Giả định QC dùng

- Image deploy production là đúng digest `sha-5e98ec5aec1b` mà QA và OPS đã kiểm, hoặc một tag mà thư mục migrations giống hệt (OPS §19.6 mục 1).
- Khách dài hạn trên production đã nhập dạng đơn dài hạn của FB-INV-010 Đợt 1. Số liệu cụ thể chờ điều kiện 2.
- `payment_receiving_account` production đã có từ luồng VietQR v1.0.5. Chưa kiểm, xem điều kiện 2.
- Không tạo ESC mới. Các câu hỏi cho INV ở mục 7 là việc tham số/dữ liệu và xác nhận giả định đã có trong decision-log, gom về ORC hỏi một lần.
