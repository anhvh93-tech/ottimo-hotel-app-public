# Oracle lượt kiểm tiền R3 Sprint 1 (DOM)

- Tác giả: DOM | Round 3 – Sprint 1, bước Sản xuất | Ngày: 22/10/2026
- Căn cứ: `product/docs/business-rules.md` **v0.4.0** (BR-309, 416, 427, 433, 434, 437, 525, mục 13); ARC `rounds/round-02/outputs/ARC/openapi-0.3.7.md` 16.27, 16.30, **16.31**; `rounds/round-02/reviews/s4-money-recheck8.md`; `rounds/round-02/qa/bug-list.md` BUG-R2-208, 209, 210; backlog 5.5 (R3-Q01, Q10, Q19…Q24, Q29, Q30, Q39); FE `rounds/round-02/outputs/FE/s4-report.md` mục "Rà ngày kinh doanh"; ESC-023 A, 024 B, 026 A (INV 22/10); `product/tests/fixtures/br-examples.json`.
- Dùng cho: BE-A, BE-B, FE-A (đúng số khi cài), **QA** (test tích hợp, E2E, fuzz R3-Q30), **critic** của lượt kiểm tiền (so log gốc với số ở đây), SEC (ca lách hạn mức).

## 0. Cách dùng

1. **Số ở đây là chuẩn.** Mã ra khác số này → mặc định **lỗi tiền P0** tới khi chứng minh khác (plan R3 mục 4.1). Nếu người kiểm cho rằng oracle sai, ghi thẻ cho DOM kèm bằng chứng – **không tự đổi kỳ vọng trong test**.
2. Thứ tự cài và kiểm theo plan 4.1: **210 → 209 → 208** (208 có SEC review) → BE-83 + ESC-026 → #8–#12 → Q23 (17/18), Q24, Q29, Q01, Q10 → fuzz Q30 trên bản đã có tất cả.
3. Quy ước: tiền VND số nguyên; năm 2026 nếu không ghi; giờ Asia/Ho_Chi_Minh; **ngày nghiệp vụ** đổi lúc 06:00 (BR-010). "FD" = lễ tân, "LT trưởng" = lễ tân trưởng, "MGR" = quản lý, "OWN" = chủ đầu tư.
4. Giá đêm dùng chung (BR-101, BR-104 – giá Trực tiếp; cuối tuần = đêm thứ Sáu, thứ Bảy +15%):

| Căn | Ngày thường | Thứ Sáu/Bảy | Ghi chú |
|---|---|---|---|
| 101 | 667.000 | 767.000 | 8.000.000 ÷ 12 |
| 202, 203 (Studio, định mức 2) | 792.000 | 911.000 | ngày lễ 1.030.000; 7 đêm −10%: 713.000 / 820.000 |
| 302 (định mức 3) | 917.000 | – | |
| 401 | 1.042.000 | – | |

5. Mã chứng cứ fixture có sẵn ghi ở từng mục (`br-examples.json`). Mục 9 liệt kê dòng fixture **mới** QA cần thêm.

## 1. Định nghĩa dùng chung – "một định nghĩa công nợ" (BR-525 (ii), ARC 16.31)

| Ký hiệu | Định nghĩa | Ghi chú |
|---|---|---|
| **B** – còn phải thu | Σ dòng phí sống − Σ FOC/giảm sống − Σ khoản thu sống + Σ hoàn đã chi | Một số duy nhất Desk hiện để thu |
| **R** – đã ghi nợ của chu kỳ | Σ các lần ghi nợ của chu kỳ hiện tại (B18 `debt`, đảo G-4 phần tăng, J15 phần chênh) = `debt_recorded_vnd` | Mỗi lần ghi có **một** nhật ký `reservation.debt_on_checkout` |
| **D** – đã giảm từ lúc mở | Σ khoản thu sau lúc mở chu kỳ + Σ dòng FOC `debt_write_off` **còn sống** (posted, không phải dòng đảo, chưa bị đảo – sau 207) | Khoản thu trả **công nợ trước**, khoản cũ nhất trước (G-6) |
| **O** – công nợ đang mở (`openDebtVnd`) | clamp(R − D, 0, max(0, B)); **hết cửa sổ** (folio `closed` hoặc quá `post_checkout_window_until`) → O = max(0, B) | Mọi quyết định "còn công nợ" đọc O > 0, không đọc `debt_settled_at` |
| **W** – khoản trong cửa sổ | max(0, B) − O | Phát sinh sau trả phòng (BR-427 (c)) và A32 **tăng** trên folio `settled`; J15 mới chuyển thành công nợ |
| **Hạn** | Ghi thêm khi O > 0 → **giữ hạn cũ**; ghi khi O = 0 → chu kỳ mới, hạn = **ngày nghiệp vụ lúc ghi + 3** (`debt_default_due_days`, INV xác nhận 22/10) | Quá hạn khi ngày nghiệp vụ > hạn |
| **Cơ sở xóa nợ** | Giá đêm phòng cao nhất của folio (đêm `room` sống, sau BR-107; phụ thu thay đêm BR-416 tính như một đêm; dài hạn = giá đêm quy đổi BR-102) | Một số cho cả folio, BR-433 (a) |

---

## 2. BUG-R2-210 / R3-Q21 – công nợ ghi trước migration 0076 (làm đầu tiên)

**Tình huống:** folio có công nợ do app trước 0076 ghi (không có cột chu kỳ: `debt_opened_at` NULL), còn trong cửa sổ 24 giờ; sau khi deploy có một lần ghi nợ mới. Mã lỗi mở chu kỳ chỉ với phần tăng, bỏ nợ cũ khỏi O.

**Quy tắc DOM cho nợ cũ (điểm chốt mới):** khi `writeDebt` gặp folio có nợ cũ chưa có chu kỳ, X (công nợ đã có) = **nợ cũ đã ghi − phần đã thu/xóa sau đó**, **không** gồm khoản trong cửa sổ (dòng `post_checkout` và A32 tăng ghi sau lúc trả phòng, chưa qua J15). Nếu không tách được thì lấy X = B − Σ dòng sau trả phòng chưa thu. Câu "X của dòng cũ = còn phải thu trước lần ghi" ở ARC 16.31.2 gạch cuối **sai khi folio có khoản cửa sổ** (ca 210-A dưới đây sẽ ra 1.004.000) – ARC sửa câu, BE-A cài theo bảng này.

| Ca | Số liệu vào | Kết quả đúng | Mã lỗi (để nhận diện) |
|---|---|---|---|
| 210-A | Trả phòng 16/11 10:00. Nợ cũ G-4 **100.000** (đảo khoản thu, ghi bởi app cũ). Minibar sau trả phòng **70.000** lúc 15:00 (link). Sau deploy, 17:00 MGR đảo thêm khoản thu **834.000** | B = **1.004.000**; O = **934.000** (100.000 + 834.000); W = **70.000**; nhật ký ghi nợ của lần đảo = 834.000; **hạn giữ hạn của nợ cũ**; "Cần chú ý" mở | O = 834.000 |
| 210-A tiếp | J15 17/11 10:00 | Phần chênh 70.000 ghi thêm (nhật ký 70.000, báo OWN + MGR); O = B = **1.004.000**; hạn cũ; folio `closed` | – |
| 210-B | Nợ cũ B18 **2.000.000** (app cũ). MGR xin xóa nợ **1.500.000** (> cơ sở) → chờ OWN. Sau deploy, MGR đảo khoản thu **916.000** | O = **2.916.000**; yêu cầu vẫn chờ, "khi duyệt sẽ áp **1.500.000**" | O = 916.000 |
| 210-B tiếp | OWN duyệt | `approved`, áp **1.500.000**, **không** `applied_capped`, **không** `debt_cleared`; O = **1.416.000**; credit 0 | áp 916.000 kèm `applied_capped`, hoặc tự hủy |
| 210-C (không nợ cũ) | Folio chưa từng có nợ, B = 0; MGR đảo 500.000 | Chu kỳ mới O = **500.000**, hạn = ngày nghiệp vụ + 3 | – |

Bất biến: I1, I2, I3 (mục 8) đúng sau mọi bước. Thủ tục OPS điều kiện C2 giữ tới khi 210 gộp.

---

## 3. BUG-R2-209 / R3-Q20 – J15 ghi phần chênh khi đã có công nợ

**Tình huống:** hết cửa sổ, folio đã có O > 0 và B > O. Mã lỗi: tiền đúng nhưng không nhật ký, không báo, không cộng `debt_recorded_vnd`.

| Ca | Số liệu vào | Kết quả đúng |
|---|---|---|
| 209-A (BR-525-02) | Trả phòng 16/11 10:00, B = 0. Minibar 70.000 lúc 15:00 (link). 17:00 MGR đảo 100.000 → O 100.000, hạn **19/11**. Khách không trả. J15 17/11 10:00 | Nhật ký ghi nợ **[100.000, 70.000]**; báo OWN + MGR **lần hai**; `debt_recorded_vnd` **170.000**; O = **170.000**; hạn **19/11** (giữ, không 20/11); folio `closed` |
| 209-B (BR-525-33 corporate) | B18 công nợ khách công ty 200.000, MGR sửa hạn **30/11**; minibar 70.000 không thu; J15 17/11 10:00 | Nhật ký [200.000, 70.000]; O = **270.000**; hạn **30/11**; báo lần hai |
| 209-C (BR-525-33 paidBeforeJ15) | Như 209-A, FD thu 100.000 lúc 16/11 18:00 (trả công nợ trước – G-6) → O = 0, W = 70.000. J15 17/11 10:00 | Chu kỳ mới: O = **70.000**, hạn **20/11** (ngày nghiệp vụ 17/11 + 3); nhật ký 70.000; "Cần chú ý" lúc 16/11 18:00–17/11 10:00 **không** hiện mục công nợ (O = 0 – chu kỳ "nằm im" không phải nợ) |
| 209-D (đua) | J15 và đảo 100.000 cùng lúc 17/11 10:00, hai thứ tự | Cả hai thứ tự: O = **170.000**, hạn **20/11**, tập nhật ký {100.000, 70.000}; deadlock 0 |
| 209-E (B = O) | O = 100.000, không có khoản cửa sổ, J15 | Chỉ đóng folio; không nhật ký mới, không báo |

---

## 4. BUG-R2-208 / R3-Q19 – N-7 theo số (sau 210 và 209; SEC review trước gộp)

**Quy tắc:** trên folio `settled` trong cửa sổ, A32 **giảm** (void, hạ đơn giá, giảm số lượng; phần giảm = tiền dòng trước − sau) được khi **phần giảm ≤ B − O** (= W); vượt → 409 `FOLIO_LOCKED`, mọi vai kể cả OWN, không ghi gì. O = 0 → như đơn không công nợ. Tăng → 201.

| Ca | Số liệu vào | Kết quả đúng |
|---|---|---|
| 208-A (BR-525-29) | Trả phòng 16/11 10:00; minibar 70.000 (15:00); đảo 100.000 (17:00) → B 170.000, O 100.000, W 70.000. FD thu 100.000 → O **0**, W 70.000. MGR void minibar 70.000 (ghi nhầm) | **201**; B = **0**; chu kỳ đóng. Ghi minibar **sau** khi đảo → cùng kết quả |
| 208-B (BR-525-30) | Như 208-A nhưng FD chỉ thu 50.000 → B 120.000, O 50.000, W 70.000. Void minibar 70.000 | **201**, B = O = **50.000**. Sau đó giảm thêm 1 đồng bất kỳ dòng → **409**. Biến thể: ngay từ đầu giảm dòng phòng 80.000 (> 70.000) → **409**, B giữ 120.000 |
| 208-C (BR-525-31, **ca SEC**) | Đơn 202 (cơ sở ≥ 792.000), O 5.000.000, W 0. MGR tự xóa nợ 600.000 → O 4.400.000. A32 tăng 10.000 × 9 lần trên dòng mang FOC xóa nợ (FOC đăng lại 9 lần) | Sau A32: B = **4.490.000**, O vẫn **4.400.000**, W 90.000. Void dòng nợ → **409**; giảm 90.001 → **409**; giảm 90.000 → **201**, B = O = 4.400.000. MGR **không** void được nợ không qua OWN |
| 208-D (BR-525-32, đua RE) | Đảo 100.000 → O 100.000; A32 +10.000 → W 10.000; FD thu 100.000 → O 0, W 10.000; MGR giảm 10.000 | **201**, B = 0. Đảo thứ tự A32 và thu → cùng kết quả |
| 208-E | O = 0, W = 0 (đã thu đủ, folio `settled`). MGR xin FOC `debt_write_off` 10.000 | **409 `FOLIO_LOCKED`** (không còn công nợ – đổi từ 422 `max` 0 của R2); Desk: "Không còn công nợ để xóa" |
| 208-F (N-15) | Trả phòng 16/11 10:00; 17/11 10:20 J15 chưa chạy, folio còn `settled`. MGR giảm dòng minibar | **409 `FOLIO_LOCKED`** (quá cửa sổ coi như `closed`). FD thu tiền trong khoảng hở → 409 tới J15 (≤ 1 giờ) – chấp nhận |
| 208-G (đua) | A32 giảm 70.000 ‖ FD thu 50.000 trên trạng thái 208-A trước khi thu (B 170.000, O 100.000, W 70.000), hai thứ tự | Thu trước: O 50.000, W 70.000 → giảm 70.000 **201**, B 50.000. Giảm trước: W 70.000 → **201**, B 100.000, rồi thu 50.000 → B 50.000. Cả hai: B cuối **50.000** = O |

---

## 5. BE-83 (R3-Q22) + ESC-026 A – chống chia nhỏ và báo chủ đầu tư

### 5.1 BR-433 (a) – xóa nợ cộng dồn theo folio (fixture `R3-SEC-BE-83`)

| Ca | Số liệu vào | Kết quả đúng |
|---|---|---|
| BR-525-21 | Cơ sở 667.000, O 5.000.000. MGR gửi 12 × 450.000 | Lần 1 tự áp (Σ 450.000, O 4.550.000); lần 2–11 **chờ OWN** (Σ 900.000 … 4.950.000; tổng chờ 4.500.000); lần 12 → **422 `max` 50.000**. MGR một mình xóa được **450.000** |
| BR-525-22 | OWN từ chối 10 yêu cầu chờ; MGR xin 217.000; rồi 1.000 | Σ **667.000** = cơ sở → tự áp; Σ 668.000 → chờ OWN |
| BR-525-23 | (a) MGR xin 2.000.000 (chờ) rồi 100.000. (b) OWN đã duyệt 3.000.000; MGR xin 100.000 | (a) Σ 2.100.000 → chờ OWN. (b) Σ 3.100.000 → chờ OWN |
| BR-525-24 | Đơn 101, 18–21/11 (667.000, 667.000, 767.000), O 1.000.000: xóa 400.000 trên đêm 18/11 rồi 367.000 trên đêm 19/11; rồi 1.000 | Cơ sở **767.000**; hai lần đầu tự áp (Σ 767.000); 1.000 → chờ OWN; đổi thứ tự dòng → cùng kết quả |
| BR-525-25 | Đơn 101, 23–26/11 (cơ sở 667.000). Chu kỳ 1: B18 nợ 1.000.000, MGR xóa 600.000 (tự áp), khách trả 400.000. Chu kỳ 2: minibar 70.000 → J15 nợ 70.000; MGR xóa 70.000 | Σ **670.000** > 667.000 → **chờ OWN** (cộng mọi chu kỳ) |
| BR-525-26 | Yêu cầu chờ 5.000.000, khách trả đủ → tự hủy `debt_cleared` | Σ = **0** |
| BR-525-27 | Hai yêu cầu 450.000 gửi cùng lúc, cơ sở 667.000 | Đúng **một** tự áp, một chờ OWN |

### 5.2 BR-433 (b) – FOC thường cộng dồn theo khóa

| Ca | Số liệu vào | Kết quả đúng |
|---|---|---|
| BR-433-04 | Khoản hư hỏng 3.000.000, lượt căn 101 (cơ sở dòng 667.000). MGR FOC 600.000, rồi 600.000 cùng khóa | Lần 1 tự áp; lần 2 Σ **1.200.000** → chờ OWN (R2: 5 × 600.000 tự áp hết) |
| BR-433-05 | 6 lon bia × 35.000 = 210.000 (một khóa – món bia). FD tự miễn 100.000, rồi 100.000 | Lần 1 tự áp; lần 2 Σ **200.000** > 100.000 → chuyển **LT trưởng** |

### 5.3 BR-433 (c) – ESC-026 A: Σ trên lượt vượt ngưỡng → báo OWN, không chặn

Σ lượt = tổng **số đang áp** của FOC, giảm giá đặc biệt và xóa nợ trên lượt ở, chỉ khoản do FD/LT trưởng/MGR duyệt hoặc tự áp. Ngưỡng = hạn mức một lần của vai cao nhất (dưới OWN) có khoản đang áp trên lượt: MGR → giá đêm cao nhất của lượt; LT trưởng → 300.000; chỉ FD tự miễn → 100.000. Kiểm **sau mỗi lần áp**.

| Ca | Số liệu vào | Kết quả đúng |
|---|---|---|
| E26-1 (ESC-026) | Căn 202, lượt có đêm thứ Sáu (ngưỡng **911.000**). MGR miễn phụ thu trả muộn 300.000, minibar 250.000, phí làm hỏng đồ 600.000 (ba khóa khác nhau) | Cả ba **áp ngay**. Sau khoản 2: Σ 550.000 → không báo. Sau khoản 3: Σ **1.150.000** → **1** thông báo OWN (kèm 3 khoản), **1** mục "Cần chú ý" của lượt. Khách trả: tổng phí − 1.150.000 |
| E26-2 | Đơn 101, 23–28/11 (4 × 667.000 + thứ Sáu 767.000 = 3.435.000; ngưỡng **767.000**). MGR tự áp giảm giá đặc biệt 100% từng đêm theo thứ tự ngày | Đêm 23: Σ 667.000, không báo. Đêm 24: Σ **1.334.000** → báo. Đêm 25, 26, 27: thêm **3** thông báo (Σ 2.001.000; 2.668.000; 3.435.000). Tổng thông báo **4**, mục "Cần chú ý" **1**. Khách trả tiền phòng **0** |
| E26-3 | Căn 203, lượt chỉ đêm thường (giá đêm cao nhất 792.000). FD tự miễn bia 70.000; LT trưởng miễn trả muộn 210.000; LT trưởng miễn minibar khác 50.000; MGR miễn 200.000 | Sau khoản 2: Σ 280.000 ≤ 300.000 → không báo. Sau khoản 3: Σ **330.000** > 300.000 → báo. Sau khoản 4: ngưỡng thành **792.000**, Σ 530.000 → **không** báo thêm |
| E26-4 (OWN không tính) | Như E26-1, khoản 600.000 do **OWN** duyệt (vượt hạn mức MGR) | Σ lượt = 550.000 → **không** báo |
| E26-5 (xóa nợ tính) | Căn 202, 2 đêm thứ Năm – thứ Sáu (ngưỡng và cơ sở xóa nợ **911.000**). MGR miễn minibar 400.000 lúc ở; sau trả phòng MGR tự áp xóa nợ 600.000 (BR-433 (a): Σ xóa nợ 600.000 ≤ cơ sở) | Xóa nợ áp ngay; Σ lượt **1.000.000** > 911.000 → báo OWN |
| E26-6 (thu hồi, khách còn ở) | Sau E26-1, OWN thu hồi khoản 600.000 | Dòng phí làm hỏng đồ thành phải thu: khách trả thêm **600.000** tại quầy; hạn mức tháng của MGR trả lại 600.000; nhật ký thu hồi có lý do; Σ lượt 550.000 |
| E26-7 (thu hồi, đã trả phòng) | Như E26-6 nhưng khách đã trả phòng lúc 11:00, OWN thu hồi lúc 15:00 cùng ngày (folio `settled`) | 600.000 thành **khoản trong cửa sổ** (W 600.000, gửi link); hết cửa sổ chưa trả → J15 công nợ 600.000, hạn = ngày nghiệp vụ J15 + 3 |
| E26-8 (folio `closed`) | OWN thu hồi sau khi folio `closed` | Không cho thu hồi trong app (409 `FOLIO_LOCKED`); OWN chỉ bấm "Đã xem" |
| E26-9 (FOC tự hủy) | E26-1 rồi khách rút đêm làm một FOC tự hủy theo BR-434 | Khoản tự hủy ra khỏi Σ; không có thông báo "dưới ngưỡng" |

### 5.4 BR-433 (d) – cơ sở hạn mức được bảo vệ (v0.4.1, SEC Blocker FB-R3-SEC-BE-B-07)

Định nghĩa: giá đêm bảo vệ = min(giá dòng `room` hiện hành, giá tham chiếu server tính – thỏa thuận chụp lúc đặt / lịch giá Trực tiếp sau BR-107, **không kể sửa tay**); cơ sở folio = giá đêm bảo vệ cao nhất; từ B18 cơ sở = min(số chụp lúc B18, cơ sở tính lại). Dùng chung cho (a), (b), (c)/ESC-026, BR-416.

| Ca | Số liệu vào | Kết quả đúng |
|---|---|---|
| BB07-1 (Q1 của SEC) | Đơn 101, giá đêm 667.000 (tham chiếu = chụp B18 = 667.000), đã trả phòng, O **5.000.000**, W 0. (1) MGR A32 nâng dòng phòng lên 5.000.000. (2) MGR xin xóa nợ 4.000.000 (có xác thực lại). (3) MGR A32 hạ dòng phòng về 667.000 | (1) **201**; B **9.333.000**, O 5.000.000, W **4.333.000**; cơ sở vẫn **667.000**. (2) Σ 4.000.000 > 667.000 → **chờ OWN** (không tự áp); "khi duyệt sẽ áp 4.000.000". (3) **201** (4.333.000 ≤ W); cuối: B = O = **5.000.000**, W 0, Σ xóa nợ đã áp **0**, `foc_stay_alert` không phát sinh (chưa có khoản áp). Mã lỗi: `201 approved eff 4.000.000`, cuối B = O = 1.000.000 |
| BB07-2 | Như BB07-1 bước (1), MGR xin xóa nợ **667.000** | Σ 667.000 = cơ sở → tự áp; O **4.333.000**; xin thêm 1.000 → chờ OWN |
| BB07-3 (trong lúc ở, (b)) | Đơn 101 đang ở, giá đêm 667.000. MGR sửa giá đêm (A31/S4-35) lên 3.000.000; MGR FOC 2.500.000 trên khoản hư hỏng 3.000.000; MGR hạ giá đêm về 667.000 | Sửa giá: 201 (nhật ký). FOC: cơ sở min(3.000.000, 667.000) = **667.000** → **chờ OWN**. Sau khi hạ giá: yêu cầu vẫn chờ, cơ sở 667.000 |
| BB07-4 (ngưỡng ESC-026) | Như BB07-3 (giá đêm đang 3.000.000), MGR miễn 300.000, 250.000, 300.000 trên ba khóa khác nhau | Cả ba áp ngay; ngưỡng **667.000**; sau khoản 2 Σ 550.000 không báo; sau khoản 3 Σ **850.000** → **báo OWN** |
| BB07-5 (thay đổi hợp lệ do hệ thống) | Đơn 101 đang ở, khách xin đổi sang 401 (B14 `guest_request`, giá tham chiếu 1.042.000) | Cơ sở **1.042.000**; MGR FOC 1.000.000 trên khoản hư hỏng → tự áp |
| BB07-6 (sửa tay giảm) | Đơn 202 giá 792.000, LT trưởng sửa giá đêm xuống 540.000 | Cơ sở **540.000** (min); MGR FOC 600.000 → chờ OWN |
| BB07-7 (sau B18 không nâng được) | Đơn 202 trả phòng với cơ sở chụp 792.000; sau đó lịch giá Trực tiếp đêm đó được sửa lên 1.000.000 (hoặc A32 nâng dòng) | Cơ sở = min(792.000, …) = **792.000** |

Bất biến bổ sung cho fuzz (I16): với mọi chuỗi có A31/A32 tăng rồi giảm giá dòng `room`, Σ miễn/xóa nợ do MGR tự áp trên folio ≤ cơ sở tính bằng giá tham chiếu (không kể sửa tay) và ≤ số chụp lúc B18; cảnh báo ESC-026 bật đúng như khi không có lần sửa tay nào. Fixture đề xuất: BR-433-11…15 (BB07-1, 3, 4, 5, 7), `pendingFix` `R3-SEC-BE-B-07`.

### 5.5 BR-433 (e) – A32 giảm sau trả phòng là một lần miễn (v0.4.3, SEC FZ-02)

Nền chung: đơn 101, 3 đêm 23–26/11 (thứ Hai–thứ Tư) × 667.000 = 2.001.000, minibar 70.000; khách đã thu đủ **2.071.000**; trả phòng 26/11 10:00 (folio `settled`, O 0, W 0); cơ sở hạn mức **667.000**.

| Ca | Thao tác | Kết quả đúng |
|---|---|---|
| FZ02-1 | MGR void dòng phòng đêm 25/11 (667.000), lý do khiếu nại tiếng ồn | 201; B **−667.000** → **một** yêu cầu hoàn tự sinh **667.000**, `requested_by` = MGR; Σ hoàn từ A32 667.000 = cơ sở → **quản lý khác hoặc OWN** duyệt (OTTIMO một MGR → OWN); chính MGR đó duyệt → **403**. `reason_note` = "Tự sinh từ A32: void dòng tiền phòng 25/11 667.000 – <MGR> – lý do: <lý do>". Σ lượt ESC-026 = 667.000 = ngưỡng → **không** báo |
| FZ02-2 | Tiếp FZ02-1: MGR hạ minibar 70.000 → 0 | Yêu cầu hoàn tự sinh thứ hai **70.000**; Σ hoàn 737.000 > 667.000 → **chờ OWN**; Σ lượt **737.000** > 667.000 → **báo OWN** |
| FZ02-3 (sửa 24/10 – A32 mỗi lần một dòng) | Từ nền: MGR void đêm 25/11, rồi void đêm 24/11 | Lần 1: hoàn **667.000**, Σ hoàn 667.000 ≤ cơ sở 667.000 → `manager` (khác người làm). Lần 2: hoàn **667.000**, Σ hoàn **1.334.000** > cơ sở (đêm còn lại 667.000) → **`owner`**; Σ lượt 1.334.000 → báo OWN |
| FZ02-4 (sửa 24/10) | Tiếp FZ02-3: MGR void nốt đêm 23/11 | Cơ sở **null** → hoàn **667.000** → **`owner`**; tổng 3 yêu cầu: 667.000 `manager` + 667.000 `owner` + 667.000 `owner` = 2.001.000 – MGR + MGR khác chỉ hoàn được tối đa **667.000** (= cơ sở). Biến thể đơn 2 đêm (fixture BE-B): void đêm 1 → 667.000 `manager`; void đêm 2 → cơ sở null → 667.000 `owner` |
| FZ02-9 (cách BE-B tính – DOM đồng ý 24/10) | (a) Đêm 25/11 MGR hạ 667.000 → 500.000, tăng lại 667.000, hạ lại 500.000. (b) Đêm 25/11 MGR nâng 667.000 → 5.000.000 rồi hạ về 300.000. (c) Có minibar 70.000 ghi sau trả phòng chưa trả (W 70.000); MGR void đêm 25/11 667.000 | (a) Σ lượt cộng **167.000 × 2 = 334.000** (đếm theo từng lần hạ dưới số lúc khách rời – có thể báo thừa, chấp nhận vì cảnh báo không làm đổi tiền); tiền hoàn: lần hạ 1 → yêu cầu **167.000**; lần tăng lại → tiền dư 0, yêu cầu đó hủy `superseded`; lần hạ 2 → yêu cầu mới **167.000**; cuối cùng đúng **một** yêu cầu đang mở **167.000** = tiền dư (tiền không tính trùng, chỉ cảnh báo tính trùng). (b) Phần tính vào Σ = min(5.000.000, 667.000) − 300.000 = **367.000** (tăng tay không bao giờ được tính, BB07-1/I16). (c) Tiền dư = 667.000 − 70.000 = **597.000** → hoàn **597.000** = min(tiền dư chưa yêu cầu, phần giảm); Σ lượt +667.000 |
| FZ02-5 | Như nền nhưng lúc khách đang ở MGR đã FOC 300.000 trên một đêm (khách đã thu đủ số sau FOC, 1.771.000); sau trả phòng MGR hạ minibar 70.000 → 0 | Hoàn **70.000** ≤ cơ sở → MGR khác/OWN; Σ lượt 300.000 + 70.000 = **370.000** ≤ 667.000 → không báo |
| FZ02-6 | OWN tự void đêm 25/11 | Không tính vào Σ hoàn từ A32, không tính Σ lượt; yêu cầu hoàn theo đường BR-522 hiện có |
| FZ02-7 | Minibar 70.000 ghi sau trả phòng (W 70.000, chưa trả); MGR void (ghi nhầm) | Không tiền dư → **không** có yêu cầu hoàn; Σ lượt +70.000 |
| FZ02-8 | FZ02-1, OWN **từ chối** yêu cầu 667.000; MGR hạ minibar 70.000 → 0 | Σ hoàn = **70.000** (bỏ yêu cầu bị từ chối) → MGR khác/OWN; tiền dư 737.000 vẫn còn → J15 không đóng folio, "Cần chú ý" (BUG-R3-002) |

### 5.6 FZ-08 – nợ ghi trước 0076 khi khoản xóa nợ bị hủy (v0.4.3, cài v1.1)

Quy tắc: nợ cũ tính đúng như nợ mới, O = clamp(R − D, 0, max(0, B)). Khoản xóa nợ bị hủy thì D giảm, nhưng nợ chỉ trở lại trong giới hạn còn phải thu.

| Ca | Số liệu vào | Kết quả đúng |
|---|---|---|
| FZ08-1 (chuỗi fuzz) | Nợ cũ 100.000: đơn 101, 2 đêm × 667.000 = 1.334.000, đã thu 1.234.000, folio `settled`, W 0. MGR xóa nợ 100.000 trên dòng đêm 2 → O 0, B 0. MGR A32 void dòng đêm 2 | FOC xóa nợ tự hủy; B = 667.000 − 1.234.000 = **−567.000** → O **0** (nợ **không** sống lại vì tiền của dòng cũng mất); hoàn tự sinh **567.000** ≤ cơ sở 667.000 → MGR khác/OWN; Σ lượt = 667.000 (khoản xóa nợ đã hủy không còn tính) → không báo. Mô hình tham chiếu cho O = 100.000 là **sai** (thiếu kẹp [0, B]) – QA sửa `refLedger` |
| FZ08-2 | Nợ cũ 100.000 từ dòng hư hỏng 100.000 (tiền phòng đã thu đủ), hạn **19/11**. MGR xóa nợ 100.000 → O 0. OWN thu hồi khoản xóa nợ (E26-6) | Dòng còn → O **100.000** sống lại, hạn giữ **19/11**, "Cần chú ý" mở lại; xem lúc ngày nghiệp vụ 20/11 → hiện **quá hạn** ngay |
| FZ08-3 | Như FZ08-2 nhưng thay vì thu hồi, MGR A32 tăng dòng hư hỏng 100.000 → 120.000 (FOC đăng lại theo dòng mới) | FOC = min(100.000, 120.000) = 100.000; B **20.000** = W (khoản trong cửa sổ, không phải nợ cũ sống lại); O **0** |

Bất biến bổ sung (fuzz): **I17** – mọi yêu cầu hoàn tự sinh từ A32 có `requested_by` = người làm A32, `reason_note` bắt đầu "Tự sinh từ A32"; Σ hoàn từ A32 trên folio > cơ sở ⇒ `required_role = owner`; Σ lượt ESC-026 gồm phần A32 giảm sau trả phòng của vai dưới OWN. **I1–I3 cho nợ cũ** dùng cùng công thức kẹp như nợ mới. Fixture đề xuất: BR-433-16…19 (FZ02-1, 2, 4, 8), `pendingFix` `R3-SEC-FZ-02`; BR-525-42, 43 (FZ08-1, 2), `pendingFix` `R3-FZ-08` (v1.1).

Ghi chú cài đặt: "thu hồi" là đường tiền mới – ARC chốt hợp đồng và đưa vào checklist "đường mới làm thay đổi O" (16.31.3); nếu chưa kịp Sprint 1 thì Sprint 1 chỉ kiểm thông báo + "Cần chú ý" (E26-1…5, 9) và để E26-6…8 có `pendingFix`.

---

## 6. Rà ngày kinh doanh #8–#12 (R3-Q39) – đồng hồ giả

Mốc chung: **02:40 ngày 20/10/2026** (thứ Ba) → ngày nghiệp vụ **19/10** (thứ Hai). Ban ngày: **14:00 ngày 20/10** → ngày nghiệp vụ 20/10. Số trong ca #8, #9 là **ví dụ minh họa**, không phải giá INV.

| # | Tình huống | Số liệu vào | Kết quả đúng | Sai thường gặp |
|---|---|---|---|---|
| 8 | Giá niêm yết căn 101 | 02:40 OWN đổi giá tháng 8.000.000 → 8.400.000 (giá đêm 667.000 → **700.000**). 02:50 khách vãng lai đặt 101 đêm 19/10 (đến 19/10, đi 20/10) | Desk mặc định và cho chọn `effectiveFrom` = **19/10**; đơn vãng lai đêm 19/10 = **700.000**. Đơn đã xác nhận trước đó giữ snapshot 667.000 (BR-006) | Desk chặn 19/10, gửi 20/10 → đêm 19/10 = 667.000 (lệch 33.000) |
| 9 | Tham số tiền | 02:40 đổi `extra_adult_fee` 150.000 → 170.000 hiệu lực 19/10; thêm một dòng hiệu lực 20/10. 02:50 đặt Studio 101 đêm 19/10, 3 người lớn (định mức 2) | Dòng 19/10 nhãn "đang hiệu lực"; dòng 20/10 nhãn **"đã lên lịch"**; phụ thu đêm 19/10 = **170.000** | Dòng 20/10 không gắn "đã lên lịch"; phụ thu 150.000 |
| 10 | Tủ minibar lúc trả phòng | Lượt 18–21/10: chặng 1 căn 202 [18/10, 20/10), chặng 2 căn 203 [20/10, 21/10) xếp trước. 02:40 lễ tân mở trang trả phòng, đếm minibar: khách dùng 2 bia | Tủ được chọn = **202** (chặng chứa ngày nghiệp vụ 19/10); dòng minibar **70.000** trên tủ 202; tủ 203 không có dòng | Chọn tủ 203 → dòng sai tủ, 202 sau đó đếm lại → 140.000 hoặc lệch tồn |
| 11 | Hạn công nợ lúc trả phòng | (a) 14:00 ngày 20/10 MGR ghi công nợ B18. (b) 02:40 ngày 21/10 (ngày nghiệp vụ 20/10) MGR ghi công nợ | (a) Hạn mặc định **23/10**; hạn nhỏ nhất chọn được **21/10**; chọn 20/10 → Desk chặn trước khi gửi. (b) Như (a): mặc định **23/10**, nhỏ nhất **21/10**. Hạn 23/10: còn hạn tới 05:59 ngày 24/10; quá hạn từ 06:00 ngày 24/10 | Desk cho chọn 20/10 ban ngày → server 422; Desk coi hạn = hôm nay là đã quá |
| 12 | Gợi ý "đã thực hiện" khi no-show / hủy | Đơn 202 đến 20/10; dòng đón sân bay 300.000 ngày 20/10; dòng tour 300.000 ngày 21/10. (a) Đánh dấu no-show 23:10 ngày 20/10. (b) Đánh dấu no-show 01:30 ngày 21/10 (ngày nghiệp vụ 20/10). (c) Hủy lúc 09:00 ngày 20/10 | No-show: dòng có ngày ≤ ngày nghiệp vụ → gợi ý **đã thực hiện**: (a) đón **có**, tour **không**; (b) như (a). Hủy: dòng có ngày < ngày nghiệp vụ → (c) đón **không**, tour **không** (cả hai tự đảo nếu lễ tân không giữ). Lễ tân theo gợi ý ở (a): giữ 300.000 (trừ vào cọc), tour tự đảo | Ban ngày Desk dùng `<` cho no-show → đón 20/10 không được gợi ý (a) |

---

## 7. Các mục đi cùng lượt

### 7.1 R3-Q23 – FB-R2-ARC-BE-S4-17 và -18 (đường xóa nợ chờ duyệt)

| Ca | Số liệu vào | Kết quả đúng |
|---|---|---|
| Q23-17a | Đơn 101 (cơ sở 667.000), O 5.000.000. MGR xin xóa nợ 5.000.000 → chờ OWN. Khách trả đủ 5.000.000 | **Cùng giao dịch** thu tiền: yêu cầu → `cancelled` `debt_cleared`, báo người gửi; hàng "Cần duyệt" không còn yêu cầu; O 0; credit 0; Σ BR-433 (a) = 0. OWN mở yêu cầu cũ và bấm duyệt → **409 `INVALID_TRANSITION`** kèm `autoCancelReason` |
| Q23-17b | Như trên nhưng công nợ về 0 bằng một yêu cầu xóa nợ khác được OWN duyệt | Yêu cầu chờ còn lại tự hủy `debt_cleared` cùng giao dịch |
| Q23-17c | O về 0 nhưng còn W (khoản cửa sổ 70.000) | Vẫn tự hủy (O = 0 theo số); W giữ nguyên chờ link/J15 |
| Q23-18a | Như Q23-17a, khách trả **4.000.000** → O 1.000.000 | Yêu cầu vẫn chờ; màn duyệt hiện **"khi duyệt sẽ áp 1.000.000"** (không phải 5.000.000); màn danh sách không lấy khóa dòng |
| Q23-18b | OWN duyệt | `approved`, áp **1.000.000**, nhật ký `approval.applied_capped` lý do `debt_collected_before_approval`; O 0; credit 0; hạn mức tính số **thực áp** 1.000.000 |

### 7.2 R3-Q24 – N-11 (A04 `confirmDeposit`)

Không đổi tiền; đổi thứ tự khóa (L2 → L3 rồi mới ghi phiếu thu, bỏ ngoại lệ E4).

| Ca | Số liệu vào | Kết quả đúng |
|---|---|---|
| Q24-a | Đơn `hold` căn 202, 9–16/11 = 5.205.000, cọc yêu cầu 1.600.000. FD xác nhận cọc 1.600.000 | Đơn `confirmed`; phiếu thu 1.600.000; B = **3.605.000**; `touch` folio chạy khi đã giữ folio `FOR UPDATE` |
| Q24-b (đua) | A04 1.600.000 ‖ ghi thu 500.000 trên cùng folio, hai thứ tự × 3 vòng | Kết quả = một thứ tự tuần tự: tổng thu **2.100.000**, B **3.105.000**, 2 phiếu thu, credit 0, deadlock 0, không 5xx |

### 7.3 R3-Q29 – BUG-R2-123 (`move-preview` cho B7a khi đơn đang xung đột)

Quy tắc: B7a là đổi căn **do OTTIMO** → giữ nguyên giá từng đêm (BR-429), phụ thu người mỗi đêm = min(phụ thu cũ, phụ thu theo căn mới) (BR-424). Xem trước và lệnh ghi dùng chung một hàm → **cùng số**.

| Ca | Số liệu vào | Kết quả đúng (xem trước = lệnh ghi) |
|---|---|---|
| Q29-a | Đơn Trực tiếp 202, 25–27/11 (thứ Tư, thứ Năm) = 2 × 792.000 = **1.584.000**, cọc 500.000, xung đột mở (bán trùng). Xem trước B7a sang 302 kèm `overbookingResolution` | **200** (không 422); tiền phòng **1.584.000**, chênh **0**, cọc yêu cầu 500.000; ghi lệnh → cùng số |
| Q29-b | Như trên, 3 người lớn (phụ thu 150.000 × 2 = 300.000, tổng 1.884.000), B7a sang 302 (định mức 3) | Phụ thu mỗi đêm min(150.000, 0) = **0** → tổng **1.584.000** |
| Q29-c | B7a sang 101 (giá hiện hành 667.000) | Vẫn **1.584.000** (OTTIMO dời không làm giảm giá khách đã mua) |
| Q29-d | Đơn không xung đột gửi `overbookingResolution` | Lỗi xác thực theo hợp đồng ARC; không ghi |

### 7.4 R3-Q01 – OTTIMO hủy đơn vì lỗi của cơ sở (BR-309 (vii); gỡ `pendingFix` BR-309-18)

| Ca | Số liệu vào | Kết quả đúng |
|---|---|---|
| Q01-a (BR-309-18) | Đơn Trực tiếp, cọc đã thu 500.000; MGR hủy mã lỗi cơ sở | Phí **0**, hoàn **500.000** (một yêu cầu hoàn BR-522) |
| Q01-b | Đơn 202 đến 20/11, cọc yêu cầu 700.000, khách chuyển 1.000.000; hủy 19/11 (1 ngày) | Phí **0**, hoàn **1.000.000** (không áp bậc < 3 ngày) |
| Q01-c | Đơn 15–17/4/2027 có đêm Giỗ Tổ, cọc 600.000; hủy 14/4/2027 | Hoàn **600.000** (không áp "đêm cao điểm không hoàn") |
| Q01-d | Đơn 203 rút muộn (BR-309-11 x6bLate: tiền phòng 1.584.000, mức giữ 1.600.000, đã thu 1.600.000); OTTIMO hủy vì lỗi cơ sở | Hoàn **1.600.000** (mức giữ không áp; so sánh: khách tự hủy → phí 1.584.000, hoàn 16.000) |
| Q01-e | Đơn đã dời vì bất khả kháng (trần hoàn 0), cọc 500.000; OTTIMO hủy vì lỗi cơ sở | Hoàn **500.000** |
| Q01-f | Đơn 202 có đón sân bay 300.000 ngày đến, xe đã đón (gợi ý "đã thực hiện"), cọc 700.000 | Gợi ý **đảo** dòng đón; theo gợi ý: khách chịu 0, hoàn **700.000**. LT trưởng giữ dòng có lý do → hoàn **400.000** |
| Q01-g | FD gọi lệnh hủy mã lỗi cơ sở | **403**; LT trưởng → 403; MGR, OWN → được; ghi chú bắt buộc (thiếu → 422 `REASON_REQUIRED`) |
| Q01-h | Đơn CTV 8% bị OTTIMO hủy vì lỗi cơ sở | Hoa hồng **0** (không `earned`); không dòng FOC; hạn mức BR-433 không bị trừ; báo cáo FOC không có dòng; báo cáo hủy tách mã này |

### 7.5 R3-Q10 – minibar buồng phòng bắt buộc `periodId` (K11-08)

Quy tắc tiền: một lần đếm chỉ được thay đổi dòng của **kỳ nó ghi tên**; tiền minibar của lượt = Σ tiêu thụ từng kỳ (BR-703).

| Ca | Số liệu vào | Kết quả đúng |
|---|---|---|
| Q10-a | Căn 202, tủ 2 lon bia × 35.000. 21/10 10:00 HK đếm kỳ nhận phòng: còn 1 → dòng **35.000**; HK nạp lại → kỳ 2 bắt đầu (2 lon) | Minibar lượt **35.000** |
| Q10-b (lỗi K11-08) | 22/10 PWA HK gửi lần đếm "còn 1" **không có `periodId`** (bản soạn từ kỳ 1, gửi trễ khi mạng yếu) | **Từ chối** (mã lỗi theo ARC chốt, không ghi gì); minibar giữ **35.000** (mã R2: 70.000 – thừa 35.000) |
| Q10-c | Gửi lại có `periodId` của **kỳ 1** | **409**, không ghi; minibar 35.000 |
| Q10-d | Gửi đúng `periodId` kỳ 2, còn 2 | Không thêm dòng; minibar **35.000** |
| Q10-e | Gửi đúng `periodId` kỳ 2, còn 1 | Thêm **35.000**; minibar **70.000** |
| Q10-f | Tủ chỉ có kỳ nhận phòng, HK gửi không `periodId` | Tiền như có `periodId` kỳ nhận phòng (mã trạng thái theo lựa chọn ARC: bắt buộc với vai HK → từ chối; bắt buộc khi có kỳ khác → nhận) |

---

## 8. Bất biến cho fuzz công nợ R3-Q30

**Thao tác sinh ngẫu nhiên** (mỗi chuỗi 20–60 bước, đồng hồ giả tiến 0–6 giờ mỗi bước, gồm qua 00:00 và 06:00): B18 thường / B18 `debt` (MGR, hạn tùy chọn hợp lệ); ghi phát sinh sau trả phòng; gửi link và khách trả qua link (một phần / đủ / dư); FD thu nợ; đảo khoản thu (trong cửa sổ và trên `closed`); A32 tăng / giảm / void (mọi vai); FOC thường; FOC `debt_write_off` gửi / tự áp / OWN duyệt / OWN từ chối / tự hủy; J15 (chạy đúng giờ và trễ ≤ 1 giờ); thu hồi FOC của OWN (nếu đã cài); đua từng cặp (hai thứ tự).

**Đề bài phải phủ** (khoảng hở QC mục 7): FOC qua nhánh dòng đêm (S4-35); công nợ trên đơn con (B9a, gia hạn OTA); đơn dài hạn (cơ sở = giá đêm quy đổi); hai tổ chức/cơ sở chạy song song (không rò số); đảo khoản thu trên folio `closed` ‖ thu nợ (RD); nợ cũ trước 0076 (210).

**Hàm tham chiếu** (độc lập với mã, chỉ đọc sổ): tính B, R, D, O, W, hạn theo mục 1 từ các bảng dòng phí, dòng FOC, khoản thu, nhật ký ghi nợ, đồng hồ giả.

| Mã | Bất biến (kiểm **sau mọi bước**) |
|---|---|
| I1 | O + W = max(0, B) (BR-525 (ii)); hết cửa sổ → W = 0 |
| I2 | 0 ≤ O ≤ max(0, B); 0 ≤ W |
| I3 | O của mã (`openDebtVnd`, `Folio.totals.openDebtVnd` nếu có) = O của hàm tham chiếu; trần gửi xóa nợ = O − Σ số xin đang chờ; số "khi duyệt sẽ áp" = min(số xin, dòng − Σ áp khác, O) |
| I4 | Không bao giờ dư thừa (B < 0) trên folio `closed`; mọi FOC `debt_write_off` lúc áp ≤ O lúc áp |
| I5 | Σ nhật ký `reservation.debt_on_checkout` của chu kỳ hiện tại = `debt_recorded_vnd` = R; mỗi lần ghi nợ đúng **một** nhật ký và một lượt báo OWN + MGR |
| I6 | Hạn: ghi thêm khi O > 0 → hạn không đổi; ghi khi O = 0 → hạn = ngày nghiệp vụ lúc ghi + 3; quá hạn ⇔ ngày nghiệp vụ > hạn và O > 0 |
| I7 | A32 giảm trên `settled` được ⇔ phần giảm ≤ W (và chưa quá cửa sổ); cùng trạng thái tiền → cùng kết quả bất kể lịch sử thao tác |
| I8 | Σ xóa nợ (áp + chờ) do MGR tự áp trên folio ≤ cơ sở xóa nợ; mọi khoản làm Σ vượt cơ sở có `requiredRole = owner` |
| I9 | Không còn yêu cầu `debt_write_off` `pending`/`escalated` khi O = 0 (sau Q23-17) |
| I10 | Mọi yêu cầu `approved` ⇒ FOC đang áp, đang ngủ, tạm dừng hoặc bị hủy có nhật ký (BR-434) |
| I11 | Folio `closed` ⇒ chỉ ba đường tiền: thu nợ, xóa nợ, đảo khoản thu; mọi A32 → 409 |
| I12 | Hoa hồng `earned` ⇔ B = 0 và mọi khoản thu chuyển khoản đã đối soát (BR-903, BR-525 (d)); cơ sở hoa hồng trừ phần xóa nợ nằm trên dòng tiền phòng |
| I13 | ESC-026: thông báo Σ lượt gửi ⇔ ngay sau một lần áp, Σ lượt (không tính khoản OWN) > ngưỡng vai cao nhất; mỗi lượt tối đa một mục "Cần chú ý" mở |
| I14 | Đua hai thao tác bất kỳ = kết quả của một thứ tự tuần tự; deadlock 0; không 5xx |
| I15 | Sổ cân: Σ dòng sống − Σ FOC sống − Σ thu + Σ hoàn đã chi = B ở mọi folio; không dòng nào bị xóa (BR-008) |

Kết luận đạt của lượt kiểm (plan 4.1 bước 8): **0 vi phạm I1–I15** trên toàn bộ chuỗi fuzz + mọi ca mục 2–7 ra đúng số; critic đọc log gốc.

---

## 9. Đề xuất dòng fixture mới cho QA (`br-examples.json`, BR v0.4.0)

| Đề xuất id | Nội dung | `pendingFix` |
|---|---|---|
| BR-525-34, 35 | 210-A, 210-B (mục 2) | BUG-R2-210 |
| BR-525-36 | 209-D đua J15 ‖ đảo (hạn 20/11, tập nhật ký {100.000, 70.000}) | BUG-R2-209 |
| BR-525-37, 38 | 208-E (xóa nợ khi O = 0 → 409), 208-F (N-15) | BUG-R2-208 |
| BR-525-39, 40 | Q23-17a, Q23-18a/b | R3-ARC-BE-S4-17-18 |
| BR-433-06…09 | E26-1, E26-2, E26-3, E26-4 | R3-ESC-026 |
| BR-433-10 | E26-6 (thu hồi) | R3-ESC-026-REVOKE |
| BR-309-19, 20 | ESC-023 A: rút 07/11 → phí 0, thừa 16.000; rút rồi hủy → phí 1.584.000 (đã đạt ở R2 – không cần `pendingFix`) | – |
| BR-309-21…24 | Q01-b, c, d, e | R3-OTTIMO-FAULT-CANCEL |
| BR-416-08, 09 | ESC-024 B: hết hạn 15 phút → 792.000 không miễn được; quản lý xem lại miễn 50% → FOC 396.000, hoàn 396.000 | R3-US-164 |
| BR-525-41 | #11 hạn công nợ theo ngày nghiệp vụ | R3-Q39 |
| BR-703-03 | Q10-a…e | R3-Q10 |

Cùng lúc: gỡ `pendingFix` BR-309-18 (Q01), BR-433-04/05 và BR-525-21…27 (BE-83), BR-525-02/29…33 (208, 209) khi các mục tương ứng gộp và chạy đúng số; nâng `source.version` của fixture lên 0.4.0.

## 10. Phụ lục – hai quyết định INV không đổi mã tiền Sprint 1 nhưng cần ca hồi quy

**ESC-023 A (không thu phí khi rút ngắn rồi vẫn đến ở)** – không có mã mới; giữ ca để không ai cài nhầm phương án B:
- Căn 202, 9–16/11 = 5.205.000, cọc 1.600.000. 07/11 (2 ngày) rút còn 9–11/11 = 1.584.000 → xem trước và lệnh ghi **không có dòng phí**; khách đến ở, không phát sinh → tiền thừa **16.000** hoàn lúc trả phòng; có minibar 35.000 → khách trả thêm **19.000**.
- Rút 07/11 rồi 08/11 hủy hẳn → phí **1.584.000**, hoàn **16.000** (BR-309-11 x6bLate – giữ).
- Rút 02/11 (7 ngày) rồi 08/11 hủy → phí **500.000**, hoàn **1.100.000**.

**ESC-024 B (US-164, Sprint 1–2)** – chuẩn khi làm:
- Căn 203, 16–18/04/2030, rời 20:30 thứ Năm 18/04, đêm ngày đi không bán được. 20:32 FD gửi yêu cầu; 20:47 hết hạn (15 phút) → FD hoàn tất: phụ thu **792.000**, không có ô sửa/miễn (gửi kèm FOC → 403/422), lý do bắt buộc, trạng thái "hết hạn – lễ tân tự ghi", báo MGR + OWN.
- 19/04 09:00 MGR xem lại, miễn 50% → FOC **396.000**, yêu cầu hoàn **396.000** (BR-522). Quá 19/04 20:30 chưa xem → báo OWN; folio `closed` theo J15.
- MGR trả lời 20:40 (trong hạn) xác nhận kèm miễn 100% → FOC **792.000**, khách trả **0**.
- Đêm ngày đi thứ Sáu → **911.000**; ngày lễ → **1.030.000**. Đêm bán được → không vào đường này ("Trả phòng – tính thêm 1 đêm").
