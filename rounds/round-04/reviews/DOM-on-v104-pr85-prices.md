# DOM review – PR #85 `v104/ba-esc045-prices`: sổ tay theo ESC-045 câu 1 và 3

- Người review: DOM | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Tác giả: BA. Bản đọc: `git diff c6b2f78e..origin/v104/ba-esc045-prices`, head `f11e928c`, 1 commit. Gốc là `main` `c6b2f78e`. PR sửa 5 tệp: `00`, `01`, `02`, `05`, sổ tay (18 dòng thêm, 14 dòng bớt). Số dòng ghi trong file này là số dòng trên nhánh @ `f11e928c`.
- Căn cứ:
  - `01-decisions/decision-log.md`: dòng 01/11 "INV – ESC-045 câu 1 = A" (không tăng giá cuối tuần, ngày lễ); dòng 01/11 "DOM – BR v0.5.1 áp ESC-045 câu 1–6"; dòng 01/11 "OWN chuyển Desk ngay … làm một lần (11 tham số + 10 căn)"; dòng 05/11 DOM lượt 8 (INV phải kiểm `weekend_uplift_pct`/`special_uplift_pct` trên production).
  - `product/docs/business-rules.md`: BR-104 và BR-110 v0.5.1 (câu 1, câu 3); BR-107, BR-108 và BR-411 v0.5.0 (bảng giá 01/11), BR-108 v0.5.1 (câu 6), BR-113.
  - `rounds/round-04/outputs/DOM/inv-price-switch-guide.md`: B1–B11, phần C (4 báo giá thử), mục "Xong rồi thì".
- Mã đối chiếu ở `main`:
  - `services/api/src/modules/sales/internal/quote-pricing.ts` dòng 199–204 và 279–297. **Báo giá** cũng áp tối thiểu số đêm (BR-113): ngày đến thứ Sáu, thứ Bảy hoặc ngày đặc biệt mà ít hơn 2 đêm thì báo `MIN_STAY_NOT_MET`, không ra số.
  - `services/api/src/admin/production-defaults.ts` dòng 229, 239, 311. Giá trị khởi tạo vẫn là 28 đêm, 27 đêm và bậc nhận sớm [10:00, 12:00) 30 %. Desk chỉ đổi khi chủ đầu tư làm B4, B5, B7.
  - Chuỗi Desk `bk.long_body`, `field.LONG_STAY_REQUIRES_CONTRACT`, `stay.long_hint` vẫn ghi "28 đêm" (chữ cũ, H10). Nhãn ô giá `rate.pre_tier`, `folio.adjust_night_price` vẫn ghi "trước giảm theo số đêm".

## Phán quyết: **ĐẠT CÓ ĐIỀU KIỆN**

Phần PR đã làm **đúng quyết định**:
- Câu 1 = A: một giá mọi đêm, cả lễ, Tết. Danh sách ngày đặc biệt vẫn giữ cho tối thiểu 2 đêm và không hoàn cọc. Muốn tăng giá Noel – Tết thì báo trước 15/12. Khớp BR-104 v0.5.1.
- Câu 3: từ 6 tuổi 150.000 đ/đêm, dưới 6 tuổi miễn. Khớp BR-110 v0.5.1.

Không có con số nào sai. Cách viết "từ ngày chủ đầu tư chuyển giá", kèm câu "Desk hiện 100.000 … báo quản lý, không tự sửa", là đúng hướng.

Điều kiện gộp:
1. **PR85-01 (Major)**: câu kiểm "báo giá thử Studio 1 đêm thứ Sáu" không làm được, vì Desk chặn tối thiểu 2 đêm. Sửa trước khi gộp.
2. **PR85-02 (Major)**: ba việc còn lại của cùng lần chuyển giá (bỏ giảm theo số đêm, dài hạn từ 30 đêm, nhận sớm miễn phí từ 11:00) vào **v1.0.4**. BA thêm 1 commit vào chính #85 và gộp trước giờ cắt 06/11 18:00. Mục 3 nói rõ phạm vi.
3. PR85-03 (Minor): ví dụ trả sớm 5.205.000 còn theo giá cũ. Làm cùng commit với thẻ 02.

---

## 1. Kiểm từng chỗ PR sửa

| Chỗ | #85 ghi | Đúng ESC-045 / BR? |
|---|---|---|
| `01` 9.1 gạch 2–3 (613–614); sổ tay 1.3 (299–300) | Một giá mọi đêm; `weekend_uplift_pct` = `special_uplift_pct` = 0; Noel – Tết báo trước 15/12; ngày đặc biệt không tăng giá, vẫn tối thiểu 2 đêm, không hoàn cọc | Đúng BR-104 v0.5.1. Câu "Kiểm nhanh" sai cách thử (thẻ 01) |
| `02` 9.2 bước 3 (717); sổ tay 2.12 **Thêm người đi cùng** (1118) | Từ 6 tuổi 150.000, dưới 6 miễn; Desk hiện 100.000 thì báo quản lý | Đúng BR-110 v0.5.1 và B8 |
| `02` 20.2 (1681–1693); sổ tay 5.2 (1778–1791) | Dòng **Cuối tuần, ngày đặc biệt** và dòng **Phụ thu người** | Hai dòng này đúng. Còn 2 dòng số cũ cùng lần chuyển (**Phụ thu nhận sớm**, **Giảm theo số đêm**) – thẻ 02 |
| `05` mục 3 (146, 149) | Một giá; phụ thu người | Đúng. Gạch 148 (giảm 7/14 đêm, 28 đêm) còn số cũ – thẻ 02 |
| `00` (174), sổ tay lịch sử (1951) | Ghi phạm vi, "áp dụng từ ngày chủ đầu tư chuyển giá" | Đúng; thêm phạm vi của thẻ 02 khi sửa |

**Chỗ còn số cũ của câu 1** (sót):
- Ví dụ trả sớm: `02` 960, `01` 520 – thẻ 03.
- Ví dụ ở bước 8 tạo đơn: `02` 5.1 bước 8 (341), sổ tay 2.5 bước 8 (856). Số 5.205.000 / 713.000 / 642.000 / 519.000 có cả +15 % lẫn giảm 10 % – thẻ 02.

**Phí trẻ:** ngoài chỗ #85 đã sửa, không còn chỗ nào ghi 100.000. "**Trẻ 6–11 tuổi**" ở `02` 5.1 bước 3 (333) và sổ tay 2.5 bước 3 (848) là tên ô của Desk, giữ nguyên: số trẻ vẫn cần cho khai báo lưu trú (BR-110 giữ `adult_from_age` 12).

**Ngoài sách (không chặn):**
- `product/docs/day-one-guide.md` dòng 24 (PO) còn ghi "+15 %/+30 %". Đây là tài liệu ngày đầu chuyển đổi, mà OTTIMO không có dữ liệu cũ (BR-107 v0.5.1). PO sửa khi đụng tới tệp.
- Chuỗi `bk.src_weekend` còn "+15%", nhưng v1.0.4 không hiện nữa (`BookingDialog.tsx` 1409, test `v104-rate-source-typed`). Không cần làm gì.

---

## 2. Thẻ feedback

### FB-R4-DOM-BA-PR85-01
- Mức độ: Major
- Vị trí: `01` 9.1 gạch 2 (613); sổ tay 1.3 gạch 2 (299); `02` 20.2 dòng **Cuối tuần, ngày đặc biệt** (1686); sổ tay 5.2 cùng dòng (1784); `05` mục 3 gạch 1 (146).
- Vấn đề: câu kiểm là "Báo giá thử Studio 1 đêm thứ Sáu ra khác 800.000 …". Ngày đến thứ Sáu thì Desk bắt ở tối thiểu 2 đêm (BR-113). Báo giá chặn ngay: `quote-pricing.ts` trả `MIN_STAY_NOT_MET`, Desk hiện "Ngày này cần ở tối thiểu 2 đêm.", không ra số. Chính sổ tay dòng 1405 cũng ghi "Báo giá thứ Sáu 1 đêm chỉ báo 'tối thiểu 2 đêm'". Người làm theo chỉ thấy câu lỗi. Chủ đầu tư không kiểm được. Lễ tân và sale thì hoặc báo nhầm (thấy 1.600.000 sau khi đổi sang 2 đêm, tưởng là "khác 800.000"), hoặc bỏ qua.
- Vì sao quan trọng: trong sách, đây là cách duy nhất để thấy Desk còn cộng +15 %. Tham số khởi tạo là 15/30, và decision-log 05/11 (DOM lượt 8) ghi INV phải tự kiểm. Nếu câu kiểm hỏng, khách đặt cuối tuần bị tính 920.000 thay vì 800.000 mà không ai biết. Đây là sai tiền với khách.
- Đề xuất sửa (giống C1 của hướng dẫn chuyển giá):
  - `01` 9.1 và sổ tay 1.3: "Kiểm nhanh: báo giá thử một Studio (101–203), **ngày đến thứ Sáu, 2 đêm**, 2 người lớn. Phải ra **1.600.000** (2 × 800.000). Ra 1.840.000 là `weekend_uplift_pct` chưa về 0. Ra số khác là giá căn chưa đổi (mục 9.1)."
  - `02` 20.2, sổ tay 5.2, `05` mục 3: "Báo giá thử một Studio, ngày đến thứ Sáu, 2 đêm: phải ra 1.600.000. Ra số khác: dừng, báo quản lý, không tự sửa giá."
- Trạng thái: Closed (BA Fixed @ `f9302d82`; DOM đọc lại 05/11 – xem lượt 2, mục 7)

### FB-R4-DOM-BA-PR85-02
- Mức độ: Major
- Vị trí (trên nhánh #85):
  - (a) Giảm theo số đêm: `01` 9.1 gạch 4 (615); sổ tay 1.3 (301); `02` 5.1 bước 8 (341); sổ tay 2.5 bước 8 (856); `02` 20.2 dòng **Giảm theo số đêm** (1689); sổ tay 5.2 cùng dòng (1786); `05` mục 3 gạch 3 (148).
  - (b) Dài hạn từ 28 đêm: `02` 5.1 (352) và 5.4 bước 2 (396); sổ tay 867 và 913; `02` 1689 và sổ tay 1786 (vế "≥ 28 đêm là dài hạn"); `05` 127, 148, 306; sổ tay 1655, 1665.
  - (c) Nhận sớm 10:00–11:59 30 %: `02` 7.1 bảng (474); sổ tay cùng bảng (1011); `02` 20.2 dòng **Phụ thu nhận sớm** (1685); sổ tay 5.2 cùng dòng (1782).
- Vấn đề: #85 chỉ sửa câu 1 và câu 3. Ba quyết định khác của bảng giá 01/11 vẫn ghi số cũ:
  - (a) bỏ giảm theo số đêm: BR-107 v0.5.0, `los_discount` = `[]` (B3);
  - (b) dài hạn từ 30 đêm: BR-108 v0.5.0, B4/B5; chỉ chào thuê tháng từ 30 đêm: ESC-045 câu 6, B9;
  - (c) nhận sớm miễn phí từ 11:00, [10:00, 11:00) 30 %: BR-411 v0.5.0, B7.
- Vì sao quan trọng: xem mục 3. Tóm lại có hai lý do. Thứ nhất, cả ba đổi cùng lúc với câu 1, nên sách sửa một nửa sẽ tự mâu thuẫn. Thứ hai, (a) và (b) làm sale chào sai tiền.
- Đề xuất sửa: chữ đề xuất từng chỗ ở mục 3.3.
- Trạng thái: Closed (BA Fixed @ `f9302d82`; DOM đọc lại 05/11 – xem lượt 2, mục 7)

### FB-R4-DOM-BA-PR85-03
- Mức độ: Minor
- Vị trí: `02` ví dụ trả sớm (960); `01` ví dụ trả sớm (520).
- Vấn đề: ví dụ ghi "đơn căn 202 từ 9/11 đến 16/11, 5.205.000 đ … 820.000 + 713.000 = 1.533.000 → hoàn 767.000, phí 766.000". Số này dùng giá cũ của căn 202 (792.000), +15 % đêm thứ Bảy và giảm 10 % cho 7 đêm. Sau khi chuyển giá: 7 × 800.000 = **5.600.000**. Hai đêm bỏ là 14/11 và 15/11: 2 × 800.000 = 1.600.000. Khách báo trước 2 ngày nên hoàn 50 % = **800.000**, phí trả phòng sớm **800.000** (BR-428). Câu "Các đêm đã ở không tính lại mức giảm 7 đêm" không còn nghĩa.
- Vì sao quan trọng: ví dụ dùng để lễ tân và chủ đầu tư đối chiếu với số Desk ra. Số cũ làm người đọc tưởng Desk tính sai. Không sai tiền, vì Desk tự tính.
- Đề xuất sửa: đổi số như trên. Bỏ câu "không tính lại mức giảm", hoặc thay bằng "(từ ngày chuyển giá không còn giảm theo số đêm)". Câu chính sách ở `01` 516 ("Các đêm đã ở không tính lại mức giảm theo số đêm") sửa theo.
- Trạng thái: Closed (BA Fixed @ `f9302d82`; DOM đọc lại 05/11 – xem lượt 2, mục 7)

---

## 3. Phạm vi ba việc BA để ngoài sách – DOM chốt

### 3.1 Kết luận

**Vào v1.0.4, không để sau.** BA thêm 1 commit vào chính **#85**: cùng người review, cùng câu "từ ngày chủ đầu tư chuyển giá". #85 gộp khi đã có commit đó, trước giờ cắt **06/11 18:00**. Nếu không kịp sửa trong #85 thì làm PR sách riêng, nhưng vẫn phải gộp trước giờ cắt. Không chuyển sang v1.0.5.

### 3.2 Vì sao

1. **Cùng một lần chuyển giá.** Hướng dẫn chuyển giá bắt làm B1–B11 trong một lần (decision-log 01/11). Vì vậy, từ ngày câu 1 đúng thì ba việc này cũng đúng. Nếu chỉ sửa một nửa, bảng 20.2/5.2 sẽ ghi "một giá mọi đêm" ngay trên dòng "≥ 7 đêm 10 %", và lễ tân không biết tin dòng nào.
2. **Sai tiền khi bán**:
   - (a) Sale báo khách 7 đêm Studio là 7 × 800.000 × 90 % = 5.040.000, nhưng Desk tính 5.600.000, lệch 560.000. Nếu giữ lời với khách thì OTTIMO mất phần lệch, phải xin giảm giá đặc biệt.
   - (b) `05` mục 3 dạy "từ 28 đêm là thuê dài hạn: hợp đồng làm ngoài app". Khách ở 28–29 đêm sẽ bị chào hợp đồng tháng (Studio 101: 8.500.000 + phí dịch vụ 200.000) thay vì giá đêm (28 × 800.000 = 22.400.000). Cách chào này trái ESC-045 câu 6: chỉ hiện phương án thuê tháng từ 30 đêm; khách tự hỏi thuê tháng thì bán đủ 1 tháng, ở ít hơn không hoàn.
   - (c) Lễ tân báo khách đến 11:30 phải trả 240.000, trong khi Desk tính 0. Không mất tiền, nhưng nói sai với khách.
3. **Không cần quyết định mới.** Cả ba đã là quyết định của chủ đầu tư (bảng giá 01/11) và đã ở BR v0.5.0. Mục cuối của hướng dẫn chuyển giá cũng đã hứa "đội sửa sổ tay … bỏ giảm 7/14 đêm, 28 → 30 đêm".
4. **Việc nhỏ.** Khoảng 20 chỗ, chỉ đổi chữ, không đụng mã.

### 3.3 Chữ đề xuất

Mọi câu mới đều mở bằng "(từ ngày chủ đầu tư chuyển giá)", hoặc nằm trong khối đã có câu đó.

**(a) Không giảm theo số đêm**
- `01` 9.1 gạch 4, sổ tay 1.3: "Không giảm theo số đêm (bảng giá 01/11): `los_discount` là `[]`. Kiểm: báo giá căn 401, 7 đêm từ thứ Hai, 5 người lớn: phải ra **10.150.000**, không có dòng 'Đã giảm …'." (C2 của hướng dẫn chuyển giá.)
- `02` 5.1 bước 8, sổ tay 2.5 bước 8: bỏ câu "Đơn từ 7 đêm Desk tự giảm 10 % …" và ví dụ 5.205.000 / 713.000 / 642.000 / 519.000. Thay bằng: "Desk không giảm theo số đêm: gõ đúng giá đã chốt với khách. Ô giá còn ghi 'trước giảm theo số đêm' là chữ cũ. Đơn từ 7 đêm mà Desk hiện dòng 'Đã giảm …%': dừng, báo quản lý."
- `02` 20.2, sổ tay 5.2, dòng **Giảm theo số đêm**: "Không giảm theo số đêm · từ **30 đêm** là thuê tháng (hợp đồng)".
- `05` mục 3 gạch 3: "Không giảm theo số đêm. Từ **30 đêm** là thuê dài hạn: hợp đồng vẫn làm ngoài app; nhắn lễ tân giữ phòng bằng đơn dài hạn nhập tay. Khách dưới 30 đêm tự hỏi thuê tháng: bán đủ 1 tháng theo bảng tháng, ở ít hơn không hoàn (ESC-045 câu 6). Hỏi quản lý trước khi báo khách."
- Sổ tay 768, `05` 135 (danh sách dòng của **Báo giá** có "giảm theo số đêm"): nên bỏ vế này, không bắt buộc.

**(b) Dài hạn từ 30 đêm**
- `02` 5.1 (352), sổ tay 867: "Từ **30 đêm** trở lên: Desk mở **… đêm là thuê dài hạn** → **Tạo đơn dài hạn nhập tay**. Câu Desk 'Từ 28 đêm …' là chữ cũ, số đúng là 30: đơn 28–29 đêm vẫn là đơn ngắn ngày."
- `02` 5.4 bước 2 (396), sổ tay 913: "Dưới **30 đêm**: Desk đề nghị tạo đơn ngắn ngày."
- `05` 127 và 306, sổ tay 1655 và 1665: "từ 30 đêm".

**(c) Nhận sớm miễn phí từ 11:00**
- `02` 7.1 bảng, sổ tay cùng bảng:

  | Khách vào căn lúc | Desk tính |
  |---|---|
  | Từ **11:00** (căn đã sạch hoặc đã kiểm – `VC`/`VI`) | **Không phụ thu** |
  | **10:00–10:59** | Phụ thu **30 %** giá đêm đầu |
  | **06:00–09:59** | Phụ thu **50 %** giá đêm đầu |
  | Trước **06:00** | Không phải phụ thu: Desk **thêm đêm trước** |

  Ví dụ Studio 800.000: nhận 11:00 → 0; 10:30 → 240.000; 08:00 → 400.000.
- **Câu nói với khách giữ nguyên** ("Check-in is from 12:00. Your room is always ready by 14:00."). Miễn phí từ 11:00 là việc lễ tân làm khi căn đã sẵn sàng, không hứa trước với khách. Lý do: BR-411 cần căn sẵn sàng, và giờ công bố vẫn là 12:00.
- `02` 20.2, sổ tay 5.2, dòng **Phụ thu nhận sớm**: "06:00–09:59: 50 % · 10:00–10:59: 30 % giá đêm đầu · từ 11:00: 0 · trước 06:00: thêm 1 đêm".

**Lịch sử:** dòng "Sửa 05/11/2026" ở `00` (174) và sổ tay (1951) thêm 3 việc này.

---

## 4. Ghi chú cho ORC

1. Chưa rõ chủ đầu tư đã làm hướng dẫn chuyển giá trên production hay chưa (DOM lượt 8 ghi INV phải kiểm). Dù chưa làm, #85 và phần sửa của thẻ 02 vẫn đúng, vì câu nào cũng ghi "từ ngày chủ đầu tư chuyển giá" và có câu kiểm. Câu kiểm tham số ORC gửi INV (đã thêm B8) nên ghi gọn: "chạy đủ 4 báo giá thử ở phần C (1.600.000 · 10.150.000 · 23.200.000 cho 29 đêm · 2.500.000)". 4 báo giá này kiểm được B1, B3, B4/B5, B8, B9. B7 (nhận sớm) không kiểm được bằng báo giá, nhưng được lưu cùng lần. Không cần ESC mới.
2. BR v0.5.10 (DOM, lượt này): BR-421 bỏ "tổng ≥ 28 đêm", đọc ngưỡng theo BR-108 (30 đêm từ ngày chuyển giá); ví dụ đêm thứ Bảy 1.198.000 ghi rõ là số theo mức tăng cũ. Không đổi con số nào.
3. Chữ cũ trên Desk cho PO/UXD xếp v1.0.5 cùng H10: `bk.long_body`, `field.LONG_STAY_REQUIRES_CONTRACT`, `stay.long_hint` ("28 đêm"); `rate.pre_tier`, `rate.pre_tier_short`, `rate.prior_night_tier`, `folio.adjust_night_price`, `checkout.extra_night_rate_help_tier` ("trước giảm theo số đêm"). Các chuỗi này không sai tiền: giảm = 0 nên số trước và sau giảm bằng nhau.
4. #72 và #85 cùng sửa dòng lịch sử ở `00` và sổ tay. BA xử lý xung đột khi gộp; #85 đã ghi "Số bản ghi cùng lần gộp PR #69".

---

## 5. Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **DOM – review PR #85 @ `f11e928c` (sổ tay theo ESC-045 câu 1, 3): ĐẠT CÓ ĐK.** Đúng câu 1 = A (một giá mọi đêm, ngày đặc biệt giữ cho tối thiểu 2 đêm và không hoàn cọc, Noel – Tết báo trước 15/12) và câu 3 (từ 6 tuổi 150.000, dưới 6 miễn); không sai số. 2 Major sửa trước khi gộp: PR85-01 – câu kiểm "báo giá Studio 1 đêm thứ Sáu" bị chặn tối thiểu 2 đêm, đổi thành 2 đêm từ thứ Sáu = 1.600.000 (1.840.000 = còn +15 %); PR85-02 – ba việc cùng lần chuyển giá vào chính #85. Minor PR85-03: ví dụ trả sớm 5.600.000 → hoàn 800.000, phí 800.000 | DOM | Review |
| 2026-11-05 | 4 | **DOM chốt phạm vi sổ tay v1.0.4:** bỏ giảm theo số đêm (BR-107), dài hạn từ 30 đêm (BR-108, ESC-045 câu 6), nhận sớm miễn phí từ 11:00 (BR-411) vào sổ tay **v1.0.4**, cùng #85, gộp trước giờ cắt 06/11 18:00. Không để v1.0.5. Câu nói với khách về giờ nhận phòng giữ nguyên 12:00 | DOM | Quyết định của INV (bảng giá 01/11) đã ở BR v0.5.0; cùng một lần chuyển B1–B11; sửa nửa chừng thì sách tự mâu thuẫn và sale chào sai (28–29 đêm thành HĐ tháng, giảm 10 % không còn) |

---

## 6. Điểm làm tốt nên giữ

1. Câu "Desk hiện 100.000 cho trẻ 6–11 tuổi: báo quản lý, không tự sửa" chặn đúng ca chưa chuyển tham số, và không để lễ tân tự sửa giá.
2. Giữ danh sách ngày đặc biệt, kèm hai hệ quả còn hiệu lực (tối thiểu 2 đêm, không hoàn cọc). Người đọc không hiểu nhầm "bỏ tăng giá" thành "bỏ ngày đặc biệt".
3. Mọi chỗ đều ghi "từ ngày chủ đầu tư chuyển giá", nên sách vẫn đúng khi production chưa chuyển.
4. PR tách riêng, diff nhỏ, dễ đọc lại.

---

## 7. DOM lượt 2 – PR #85 @ `f9302d82` (05/11/2026)

- Bản đọc: chỉ phần #85 sau khi gộp `main` (#72): `git diff 20358556..origin/v104/ba-esc045-prices -- product/docs/manual/` (`20358556` là gốc chung với `main`; 7 tệp, 72 dòng thêm, 60 dòng bớt). Đọc kèm bảng thẻ trong thân PR #85. Số dòng dưới đây là số dòng trên nhánh @ `f9302d82`.
- Mã và tài liệu đối chiếu:
  - chuỗi `sale.los_applied` ("Đã giảm {pct}% vì ở từ 7 đêm (BR-107)") – sách trích đúng;
  - `rounds/round-04/reviews/ARC-on-v104-bug050-rule.md` mục 1–2 (CO-05: B18 chỉ gửi `checkoutTime`; gõ 04:30 lúc 06:10 thì máy chủ đọc là 04:30 hôm sau, trả 422);
  - phụ thu trả muộn ở bảng 20.2 / 5.2 (đến 12:30 khi không có khách đến: 0 · đến 15:00: 30 %).

### Phán quyết lượt 2: **ĐẠT** – gộp được

3/3 thẻ DOM của #85 và thẻ DOM #72-07 đóng đúng. Chữ CO-05 đúng. Có 2 thẻ Minor mới (04, 05), không chặn gộp: BA làm cùng commit nếu kịp trước 06/11 18:00, không thì để v1.0.5. Riêng chữ của thẻ 04 nên đi cùng release notes #66.

| Thẻ | Mức | Đã sửa ở | DOM kiểm | Kết quả |
|---|---|---|---|---|
| PR85-01 | Major | `01` 9.1 (614), sổ tay 1.3 (299): câu dài; `02` 20.2 (1755), sổ tay 5.2 (1853), `05` 3 (146): câu ngắn | Đủ 5 chỗ. Ngày đến thứ Sáu, 2 đêm, 2 người lớn = 1.600.000; 1.840.000 = còn +15 %; ra số khác thì báo quản lý, không tự sửa giá. Báo giá này qua được tối thiểu 2 đêm | Closed |
| PR85-02 (a) | Major | `01` 9.1, sổ tay 1.3 (câu kiểm 10.150.000); `02` 5.1 bước 4 và 8, sổ tay 2.5 bước 4 và 8; Gia hạn `02` 9.3 bước 2, sổ tay 2.12; danh sách dòng **Báo giá** (`02` 4.2, sổ tay 2.4, `05` 3); bảng 20.2, 5.2; `01` 7.3 câu chính sách | Đã bỏ ví dụ 5.205.000. Câu "Ô giá còn ghi 'trước giảm theo số đêm' là chữ cũ" có ở cả ô giá lúc tạo đơn lẫn gạch **Tiền về**. Câu kiểm 401 × 7 đêm, 5 người lớn: 7 × 1.300.000 + 7 × 150.000 = 10.150.000, đúng C2 | Closed |
| PR85-02 (b) | Major | `02` 5.1 (370), 5.4 bước 2 (414); sổ tay 2.5 (887), 2.7 (933), 4.2 (1724, 1734); bảng 20.2, 5.2; `05` 2 (127), 3 (148), 7.1 (306) | 30 đêm ở mọi chỗ. Có câu "Từ 28 đêm … là chữ cũ, đơn 28–29 đêm vẫn là đơn ngắn ngày". Câu chào thuê tháng ở `05` 3 đúng ESC-045 câu 6 | Closed |
| PR85-02 (c) | Major | Bảng `02` 7.1, sổ tay 2.10; bảng 20.2, 5.2; câu dưới bảng 5.2; `screenshot-list` C2-18 | Bậc mới đúng BR-411 v0.5.0. Ví dụ 0 / 240.000 / 400.000 đúng. Câu nói với khách vẫn là 12:00, có thêm "không hứa trước với khách". Câu "đang chờ chủ đầu tư xác nhận" ở 5.2 đã được thay, vì ESC-035 đã chốt. Ảnh C2-18 đổi sang 10:30, vẫn có phụ thu để chụp | Closed |
| PR85-03 | Minor | `02` 11.5.2 (1026); `01` 7.3 (521, câu chính sách 517); sổ tay 2.14a (1318) | 5.600.000 → hoàn 800.000, phí 800.000 ở cả 3 chỗ. BA tìm thêm được chỗ thứ ba ở sổ tay mà DOM chưa liệt kê | Closed |
| DOM-PR72-07 | Minor | `01` 14.1 (867) | Câu **Bỏ cả dòng** phụ thu nhận sớm, có **Ghi điều chỉnh**, đúng chữ đề xuất | Closed |

### CO-05: chữ "trước 12:00" – DOM duyệt

1. **Đúng.** Desk điền sẵn giờ hiện tại vào ô **Giờ trả phòng thực tế**, và phụ thu trả muộn tính theo giờ trong ô. Làm **Trả phòng** sau 12:00 với giờ điền sẵn thì Desk tính phụ thu cho khách đã đi từ trước 06:00 và đã trả đủ tiền. Khi có khách đến, phụ thu tính ngay sau 12:00; khi không có khách đến thì từ sau 12:30. Mốc "trước 12:00" là mốc an toàn chung cho cả hai ca, dễ nhớ. Giữ nguyên.
2. Các ý còn lại đều khớp ARC mục 2: từ 06:00 để nguyên giờ Desk điền; không gõ giờ trước 06:00; số tiền đúng vì Desk không phụ thu, không thêm đêm; giờ rời thật ghi ở sổ giao ca.
3. Còn thiếu ca "quá 12:00 mới làm được" (ca sáng quên, hoặc ca sáng tới muộn) – thẻ 04. Release notes #66 (PO) dùng chữ này là được, **kèm** câu của thẻ 04.

### Cách viết "câu kiểm đặt sau 'từ ngày chủ đầu tư chuyển giá', kèm câu 'Desk còn tính … báo quản lý'": chấp nhận

- Sách đúng trong cả hai tình huống: production đã chuyển hay chưa chuyển. Lễ tân không phải biết ngày chuyển. Thấy Desk ra số cũ (+15 %, giảm 10 %, phụ thu 11:00–11:59, trẻ 100.000) thì lễ tân dừng và báo quản lý, không tự sửa giá. Như vậy không ai thu sai mà không biết.
- Khi chủ đầu tư báo 4 báo giá thử đều đúng, đội có thể bỏ cụm "từ ngày chủ đầu tư chuyển giá" ở lần đánh số bản sau (v1.0.5) cho sách gọn hơn. Không bắt buộc.

### Thẻ mới

### FB-R4-DOM-BA-PR85-04
- Mức độ: Minor
- Vị trí: `02` 11.5.1, gạch **Khách đi trước 06:00** (997); sổ tay 2.14a cùng gạch (1313). Release notes #66 (PO), dòng **Trả sớm trước 06:00**, cũng cần câu này.
- Vấn đề: chữ mới chỉ nói "Từ 06:00 (hoặc đầu ca sáng, **trước 12:00**)", nhưng không nói phải làm gì nếu tới 12:00 mà chưa ai bấm **Trả phòng**. Lúc đó để nguyên giờ Desk điền thì Desk tính phụ thu trả muộn (ví dụ Studio 800.000, làm lúc 13:00 → 30 % = 240.000), trong khi khách đã đi từ trước 06:00. Còn gõ 04:30 thì kẹt lỗi của ARC mục 2.
- Vì sao quan trọng: ở OTTIMO chỉ có một người trực, nên ca này có thể xảy ra. Tiền không bị thu sai mà không ai biết: Desk báo **Còn phải thu** nên chưa hoàn tất được. Nhưng lễ tân bị kẹt, rồi có thể tự xin giảm cho khoản phụ thu đó.
- Đề xuất sửa: thêm một câu ngay sau "để nguyên giờ Desk điền sẵn …": "Quá 12:00 mới làm được: gõ **12:00** ở **Giờ trả phòng thực tế** (không gõ giờ trước 06:00). Desk đòi **Ghi chú giờ trả (vì sao ghi bù)** thì ghi 'Khách rời hh:mm, trả phòng trên Desk lúc hh:mm' rồi hoàn tất lại. Không phụ thu." Cách này giống khối **Đơn quá ngày đi** (b) bước 3: 12:00 sớm hơn lúc bấm nên Desk đòi ghi chú, máy chủ nhận (TC-V104-RG-26).
- Trạng thái: Open

### FB-R4-DOM-BA-PR85-05
- Mức độ: Minor
- Vị trí: `01` 14.1, dòng "Lễ tân hỏi cách ghi trễ ngày đi trên cổng khai báo lưu trú …" (870).
- Vấn đề: câu "Hạn ghi trễ chưa có quy định" dễ bị hiểu là luật không đặt hạn. Thật ra đội chưa có câu trả lời: BR mục 15 (v0.5.11) vừa ghi đây là câu hỏi cho luật sư.
- Vì sao quan trọng: chủ đầu tư có thể đọc là "trễ bao lâu cũng được" và hoãn việc ghi, trong khi việc khai báo cho khách nước ngoài có hạn theo giờ (BR-603…606).
- Đề xuất sửa: "Hạn ghi trễ: đội đang hỏi luật sư (BR mục 15). Tới khi có câu trả lời, ghi ngay trong ngày phát hiện và báo chủ đầu tư."
- Trạng thái: Open

### Ngoài sách

BR v0.5.11 (ORC giao, DOM làm lượt này): mục 15, dòng **Khai báo tạm trú người nước ngoài + cập nhật ngày đi**, cột Ghi chú thêm "Hạn và cách ghi trễ ngày đi thật trên cổng (khách ở quá ngày đi, lễ tân quên bấm Trả phòng) – hỏi luật sư (SEC-PR72-06, DOM-PR72-04)". Không đổi con số nào. Validator: OK – 0 lỗi, 1 cảnh báo.

### Dòng decision-log đề xuất (lượt 2, ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **DOM – #85 lượt 2 @ `f9302d82`: ĐẠT, gộp được.** Đóng PR85-01 (câu kiểm 2 đêm từ thứ Sáu = 1.600.000, đủ 5 chỗ), PR85-02 (không giảm theo số đêm, dài hạn từ 30 đêm, nhận sớm không phụ thu từ 11:00; câu nói với khách giữ 12:00), PR85-03 (5.600.000 / 800.000 / 800.000, cả sổ tay 2.14a), DOM-PR72-07. CO-05 "trước 12:00" đúng, vì sau mốc đó giờ Desk điền sẵn gây phụ thu trả muộn; release notes #66 dùng cùng chữ. Chấp nhận cách viết "từ ngày chủ đầu tư chuyển giá" kèm "Desk còn tính … báo quản lý". 2 Minor không chặn: PR85-04 (quá 12:00 mới làm thì gõ 12:00 kèm ghi chú – thêm vào cả #66), PR85-05 ("chưa có quy định" → "đang hỏi luật sư") | DOM | Review lượt 2 |
| 2026-11-05 | 4 | **BR v0.5.11** (ORC giao): mục 15 thêm câu hỏi luật sư về hạn và cách ghi trễ ngày đi thật trên cổng (đơn quá ngày đi, lễ tân quên bấm Trả phòng); không đổi con số nào | DOM | SEC-PR72-06, DOM-PR72-04 |
