# Critic độc lập – lượt kiểm tiền R3 Sprint 1, fuzz công nợ R3-Q30

- Vai: critic độc lập (không viết harness, không đọc mã harness `product/services/api/test/fuzz/`, không chạy mã sản phẩm, không đụng git).
- Round 3 – Sprint 1, bước **Kiểm thử**. Ngày 23/10/2026.
- Đầu vào: log gốc `scratchpad/fzfull2/run-p1 … run-p5` (11 file `FZ-*.jsonl`, 650 chuỗi, 25.536 bản ghi bước, 1.025 lần J15 theo lệnh và các dòng `{"scheduler":"J15"}`).
- Chuẩn: DOM `rounds/round-03/outputs/DOM/s1-money-oracle.md` mục 1, 2, 4, 5.4, 8 (I1–I16); `product/docs/business-rules.md` v0.4.2 (BR-433, BR-522, BR-525, BR-427).
- Dữ liệu giả, không có khóa hay mật khẩu thật.
- Script tính lại của critic: `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/critic/` (`critic.py` là bộ kiểm chính; `be83.py`, `i7.py`, `i8.py`, `harness_cmp.py`, `sample.py`, `dump.py` là các phép kiểm phụ).

## 1. Kết luận

**Lệch số giữa API và tính lại của critic: 8 / 25.536 bản ghi. Tất cả 8 thuộc loại (c) mơ hồ oracle. Không có lỗi tiền (a) nào chưa giải thích.**

- **B (còn phải thu):** 0 lệch trên 25.536 bản ghi.
  - So `dueVnd − creditVnd` của API với Σ dòng `posted` − Σ khoản thu (kể cả dòng đảo).
  - Hai cách cộng sổ trong I15 cho cùng một số ở mọi bản ghi.
- **O (`openDebtVnd`):** 8 lệch, ở 2 chuỗi FZ-02 20001 và 20038.
  - Cả 8 nằm trong khoảng từ lúc hết cửa sổ tới lúc J15 chạy, trên folio chưa từng có công nợ.
  - Đây chính là FB-R3-QA-ARC-01, xếp loại (c).

Không lệch số không có nghĩa là đạt cổng. Oracle mục 8 yêu cầu **0 vi phạm I1–I15**, nhưng log gốc vẫn còn:

| # | Mức | Bất biến | Quy mô | Tóm tắt |
|---|---|---|---|---|
| B-1 | **Blocker – P0 (mặc định oracle §0)** | I4 | 89 bản ghi / 14 chuỗi | J15 đóng folio đang dư tiền khách; dư sinh từ A32 giảm vượt W khi O = 0 |
| M-1 | Major – P1 | I9 | 161 bản ghi / 26 chuỗi | Yêu cầu xóa nợ chờ duyệt không tự hủy khi O = 0 (R3-Q23 chưa gộp). Không có tiền đi sai |
| M-2 | Major | BR-433 (a)(d) | 8 lần tự áp / 6 chuỗi | Mọi đêm phòng đã void sau B18 mà MGR vẫn tự áp xóa nợ theo số chụp; BR nói "không có đêm nào → chờ OWN" |
| M-3 | Major (b) | I13, ESC-026, I5 vế "báo" | 650 chuỗi | Log không đo được thông báo: `ownerNotifications`, `stayAlerts`, `openAttention` = 0 ở mọi bản ghi; ngưỡng ESC-026 chưa lần nào bị vượt |
| M-4 | Major (b) | I14 | 97 bước | Đường dự phòng "interleave fallback" của harness chạy một thao tác hai lần nhưng chỉ ghi một kết quả |

Hai phát hiện cứng còn lại của harness:

- **"Folio `closed` còn dư" (I4): XÁC NHẬN**, có sửa mốc bước (mục 5.1).
- **"Đua cùng thời điểm giải thích `I3?`/`I5?`": XÁC NHẬN cho 144/152 cảnh báo.** 8 cảnh báo còn lại là khoảng hở trước J15, không phải đua. Harness ghi nhãn sai "race at one instant" cho 4 trong 8 cảnh báo đó (mục 5.2).
- Ngoài ra, vi phạm cứng `I7` duy nhất của harness (FZ-02 20087 bước 18) **bị bác**: đây là lỗi tham chiếu của harness.

## 2. Chuỗi đã đọc

**Tính lại tự động:** đủ **650/650 chuỗi** của mọi họ: FZ-01 (200), FZ-02 (100), FZ-06 (40 + 40 chuỗi `org2`), FZ-07, FZ-08, FZ-09, FZ-10, FZ-11, FZ-12.

**Mẫu đối chiếu từng chuỗi:** 62 chuỗi, chọn bằng `random.seed(20261023)`.

- **Ngẫu nhiên (38):**
  - FZ-01: 10051, 10064, 10067, 10199
  - FZ-02: 20030, 20045, 20068, 20073
  - FZ-06: 20001, 20004, 20023, 20026; FZ-06-org2: 20013, 20025
  - FZ-07: 30018, 30019, 30022, 30037
  - FZ-08: 30002, 30016, 30022, 30036
  - FZ-09: 30001, 30009, 30025, 30036
  - FZ-10: 40009, 40024, 40029, 40038
  - FZ-11: 40003, 40014, 40018, 40036
  - FZ-12: 40016, 40021, 40023, 40026
- **Mọi chuỗi có `*-violations.json` (14):**
  - FZ-01: 10047, 10101, 10169, 10193
  - FZ-02: 20004, 20026, 20034, 20051, 20072, 20076, 20081, 20087, 20095
  - FZ-06: 20004
- **Chuỗi có `*-warnings.json` (14, không trùng các chuỗi trên):**
  - FZ-02: 20000, 20060, 20087
  - FZ-06: 20019
  - FZ-07: 30008, 30019
  - FZ-08: 30002
  - FZ-09: 30007, 30008, 30038, 30040
  - FZ-10: 40025, 40036
  - FZ-11: 40038

  Mẫu ngẫu nhiên còn có thêm FZ-10 40024 và FZ-09 30009 cũng có cảnh báo.
- Kết quả của 62 chuỗi mẫu:
  - B lệch: 0.
  - O lệch: 0 (8 lệch ở mục 1 nằm ở FZ-02 20001 và 20038, ngoài mẫu).
  - Các vi phạm bất biến có trong mẫu khớp với bảng mục 4.

**Đọc tay từng bước (dump hàng DB theo bước):**

- FZ-01: 10047 (bước 0–42), 10097, 10112, 10158, 10176, 10177
- FZ-02: 20001, 20011, 20038, 20072, 20078, 20087
- FZ-08: 30001, 30023
- FZ-11: 40004, 40016, 40030
- Thêm 4 bước "fallback" của FZ-01: 10024 #38, 10043 #34, 10062 #21, 10132 #46

## 3. Phương pháp và cách đọc oracle

### 3.1 Công thức tính

Chỉ dùng hàng DB (`raw`) và đồng hồ giả (`now`). Không dùng `ref` và `violations` của harness, trừ khi đối chiếu ở mục 5.

- **B** = Σ `amountVnd` của dòng `lineState = posted` (gồm dòng đảo âm và dòng FOC âm) − Σ `amountVnd` của mọi phiếu thu.
  - Phiếu gốc bị đảo vẫn dương, đổi trạng thái `reversed`. Dòng đảo là một phiếu âm riêng.
  - Log không có phiếu `refund`, nên "+ hoàn đã chi" = 0.
  - Kiểm chéo I15 bằng cách thứ hai: phí sống − FOC sống − khoản thu `succeeded` chưa đảo.
- **Hết cửa sổ:** folio `closed`, hoặc `now > windowUntil`.
- **O khi hết cửa sổ:** O = max(0, B).
- **O khi còn trong cửa sổ:**
  - Có chu kỳ (`debtOpenedAt` ≠ null): O = clamp(R − D, 0, max(0, B)), với R = `debtRecordedVnd`.
  - Không có chu kỳ: O = 0.
- **W** = max(0, B) − O.

### 3.2 Chỗ oracle mơ hồ và cách critic đọc

Critic đọc theo bảy điểm dưới đây. Mỗi cách đọc được chọn vì khớp oracle và khớp API cao nhất trong 12 tổ hợp đã thử: 290 lệch ban đầu, so với 876 lệch nếu đọc "khoản thu còn sống".

1. **D – khoản thu:** tính khoản thu **đã nhận** sau `debtOpenedAt`, kể cả khoản về sau bị đảo.
   - Việc đảo đã ghi vào R theo G-4. Đọc "khoản thu còn sống" sẽ đếm đảo hai lần.
   - Cùng cách đọc với QA, FB-R3-QA-DOM-01 ý 1. **Critic đồng ý.**
2. **D – xóa nợ:** −Σ mọi dòng FOC gắn yêu cầu `debt_write_off` (cả dòng đảo FOC) đăng sau `debtOpenedAt`.
   - Khi A32 làm FOC đảo rồi đăng lại cùng lúc, hai dòng triệt tiêu nhau.
   - Khi xóa nợ của chu kỳ trước bị đảo trong chu kỳ này, D giảm và nợ quay lại.
   - Cùng cách đọc với FB-R3-QA-DOM-02 ý 2. **Critic đồng ý.**
   - Câu chữ mục 1 ("dòng FOC còn sống") đọc sát chữ sẽ lệch thêm 71 bản ghi.
3. **Đua tại một thời điểm giả:** khoản thu hoặc dòng FOC có thời điểm **đúng bằng** `debtOpenedAt` được tính theo cả hai thứ tự. API phải khớp một trong hai (I14).
   - Áp cho 101 bản ghi. Cả 101 thuộc chu kỳ mở ở một bước `race [`.
4. **Nợ ghi trước 0076 (FZ-08), theo oracle mục 2:**
   - Chưa có chu kỳ: R = Σ nhật ký cũ, D tính sau nhật ký cũ đầu tiên.
   - Sau lần ghi đầu tiên sau deploy: R = X + phần ghi mới, trong đó X = O cũ ngay trước lần ghi. D chỉ tính khoản thu sau lần ghi đó, để không trừ hai lần phần đã gộp vào X.
   - Áp cho 459 bản ghi chưa có chu kỳ và 425 bản ghi chu kỳ chuyển từ nợ cũ.
   - Mục 1 đọc sát chữ ("Σ khoản thu sau lúc mở chu kỳ", với `debt_opened_at` lùi về lúc trả phòng) sẽ ra O thấp hơn API, ví dụ FZ-08 30023 bước 5: 99.000 so với 100.000. Số đúng là 100.000 của API. Đây là FB-R3-QA-DOM-01 ý 2; **critic đồng ý**, DOM cần sửa câu.
5. **Cơ sở hạn mức được bảo vệ (BR-433 (d)):**
   - Mỗi đêm: min(tổng dòng `room` của đêm, `referenceRateVnd`).
   - Cơ sở = max qua các đêm còn sống, rồi lấy min với số chụp. Số chụp lấy xấp xỉ bằng cơ sở ở bản ghi đầu sau trả phòng.
   - Critic tính song song cách "đêm void giữ giá tham chiếu" để phân loại (mục 4, M-2).
6. **"Số thực áp" trong Σ BR-433 (a):** số trên dòng FOC **đang sống** của yêu cầu `approved`.
   - FOC bị hủy theo dòng thì tính 0. FOC đăng lại theo dòng đã hạ thì tính số mới.
   - Cách đọc bằng `appliedCapVnd` chỉ khác ở 3 yêu cầu (mục 4, dòng 6).
7. **Ngày nghiệp vụ:** giờ Việt Nam − 6 giờ (BR-010). Hạn chu kỳ mới = ngày nghiệp vụ lúc ghi + 3.

### 3.3 Bất biến đã kiểm sau mọi bước

| Bất biến | Cách kiểm |
|---|---|
| I1, I2 | Trên số của API, và O của API nằm trong [0, max(0, B)] |
| I3 | Đủ ba vế: O; trần gửi xóa nợ trong 422 `max` ≤ O − Σ chờ (gán đúng kết quả cho từng thao tác theo thứ tự chạy của bước đua); số áp |
| I4 | (a) folio `closed` ⇒ B ≥ 0; (b) Σ xóa nợ áp trong bước ≤ O trước bước, có xét thứ tự đua |
| I5 | R = Σ nhật ký `debt_on_checkout` từ `debtOpenedAt`; ΔR = Σ nhật ký mới; nợ cũ thì R = X + Σ mới |
| I6 | Theo nhật ký mới |
| I7 | Hai chiều, trên bước tuần tự |
| I9 | Từng bản ghi |
| I11 | Hàng mới trên folio `closed`, và mã trả về của mọi A32 |
| I15 | Bất biến số, cộng không xóa và không sửa hàng: dòng, phiếu thu, nhật ký nợ, yêu cầu duyệt |
| BE-83 | Σ (đã áp + chờ + mới) so với cơ sở; `requiredRole`; vai duyệt; `limitBasisVnd` so với cơ sở bảo vệ |
| ESC-026 | Σ lượt của các vai dưới OWN so với ngưỡng, ngay sau mỗi lần áp |
| Hai tổ chức (FZ-06) | 0 id trùng giữa `FZ-06` và `FZ-06-org2` |

## 4. Bảng lệch và vi phạm

Phân loại: (a) lỗi tiền của sản phẩm, (b) lỗi harness hoặc tham chiếu, (c) oracle mơ hồ.

| # | Chuỗi, bước | API | Critic | Loại | Mức |
|---|---|---|---|---|---|
| 1 | FZ-02 20001 #23–26; FZ-02 20038 #12–15 (8 bản ghi, I1 + I3) | `openDebtVnd` 0 | O = max(0, B) = 2.819.000 / 1.111.000 | (c) mục 1 "hết cửa sổ (… quá `post_checkout_window_until`) → O = max(0, B)" mâu thuẫn 208-F/ARC khi đơn chưa có chu kỳ. Không đường tiền nào dùng số 0 này: `debt_write_off` và A32 đều 409 | Minor |
| 2 | 14 chuỗi I4 (danh sách ở 5.1), 89 bản ghi | Folio `closed`, `creditVnd` 1.000 … 1.484.000 | Vi phạm I4 | (a) theo oracle §0. Gốc gây ra là (c), xem B-1 | **Blocker / P0** |
| 3 | 282 chuỗi, 723 bước (604 bước tuần tự): A32 giảm phần vượt W khi O = 0 | 201 | I7 đọc sát chữ: 409 | (c) mục 4 "O = 0 → như đơn không công nợ" mâu thuẫn I7 "được ⇔ phần giảm ≤ W". Đây là nguồn gốc của dòng 2 | Major (gộp B-1) |
| 4 | 26 chuỗi, 161 bản ghi I9 (ví dụ FZ-11 40004 #4–8, FZ-10 40024 #15–29) | Yêu cầu `debt_write_off` vẫn `pending` khi O = 0 | Phải `cancelled debt_cleared` **cùng giao dịch thu** (Q23-17a) | (a), đã biết: R3-Q23 chưa gộp (`pendingFix` BR-525-41). Không có tiền đi sai | Major / P1 |
| 5 | FZ-01 10047 #42, 10136 #53; FZ-06 và FZ-06-org2 20006 #49, 20012 #50–51 (8 lần tự áp) | MGR tự áp xóa nợ 1.000–2.000, `limitBasisVnd` = số chụp 1.055.000 / 792.000 / 958.000 / 911.000 / 750.000 / 767.000 | Không còn đêm `room` sống ⇒ "không có đêm nào → chờ OWN" (BR-433 (a)) | (a), nghiêng về lỗi; DOM xác nhận (xem M-2) | Major |
| 6 | FZ-02 20011 #29; FZ-11 40016 #14; FZ-11 40030 #25 | Tự áp, Σ sống ≤ cơ sở | Σ tính theo `appliedCapVnd` vượt cơ sở (1.196.000 / 751.000 / 771.000) | (c) BR-433 (a) "số **thực áp**" khi FOC bị hủy hoặc đăng lại nhỏ hơn theo dòng. Critic chọn số FOC đang sống, khớp API | Minor |
| 7 | 20 bước đua A32 ‖ thu/đảo/xóa nợ trên folio `closed` (FZ-07 ×15, FZ-02 ×4, FZ-08 ×1) | 412 `VERSION_CONFLICT` | I11: 409 | (a), chỉ sai mã. 0 hàng tiền được ghi. A32 chạy tuần tự trên `closed`: 349/349 lần là 409; trong bước đua: 171 lần 409, 20 lần 412 | Minor |
| 8 | FZ-08 30002 #5, 30007 #6, 30026 #15, 30033 #4 (nợ cũ, chưa chu kỳ) | 409 | I7: phần giảm ≤ W (835.000 / 1.703.000 / 1.802.000 / 70.000) ⇒ 201 | (a), chặt hơn quy tắc, không mất tiền | Minor |
| 9 | 9 bước ghi nợ trong khoảng hở trước J15 (ví dụ FZ-01 10097 #26, 10176 #37) | Chu kỳ mới, hạn = ngày nghiệp vụ + 3 | I6 sát chữ: O (= max(0, B) khi hết cửa sổ) > 0 ⇒ giữ hạn cũ | (c). Ví dụ 209-D của chính oracle ra chu kỳ mới, nên API đúng. Cùng chỗ: API trả `openDebtDueDate` của chu kỳ đã đóng trong khoảng hở (10176 #36) | Minor |
| 10 | FZ-02 20087 #18 (vi phạm `I7` cứng của harness) | 409 | W = 0 thật: thu 70.000 chạy trước, đảo 1.056.000 mở chu kỳ mới | (b): harness tính D gồm cả khoản thu cùng thời điểm | – (bác) |
| 11 | 144 cảnh báo `I3?` (45) và `I5?` (99) | API | Khớp API | (b): tham chiếu của harness sai thứ tự ở bước đua cùng thời điểm | – |
| 12 | 97 bước "interleave fallback": 23 dòng phát sinh thừa, 44 phiếu thu thừa, 30 phiếu đảo thừa so với kết quả HTTP được ghi | Hàng tồn tại; kết quả ghi lại là của lần gọi thứ hai (409/403/422) | – | (b): nhãn và kết quả không phản ánh thao tác thật. Ví dụ: 10062 #21 có hai phiếu 1.103.000 nhưng chỉ một 201; 10024 #38 có phiếu 996.000 nhưng kết quả ghi 409 | Major (M-4) |
| 13 | 63 chuỗi: J15 chạy trễ hơn 60 phút sau `windowUntil`, tới 416 phút (FZ-01 10097) | – | Mô hình "J15 mỗi giờ" | (b). Không chuỗi nào lệch ngày hạn vì trễ | Minor |
| 14 | 54 cảnh báo `FB09?` (FZ-06 20019) | Khoản đã áp giữ nguyên khi cơ sở giảm sau đó | Khớp API | (c), nhưng BR-433 (d)(4) đã nói rõ "khoản đã áp không xét lại" | – |

Các kiểm khác **đạt**, 0 vi phạm:

- **B và I15:** không hàng nào bị xóa hay sửa số.
- **I5:** R khớp Σ nhật ký ở mọi bản ghi, kể cả 425 bản ghi chu kỳ chuyển từ nợ cũ.
- **I4 (b):** 5 trường hợp "áp > O trước bước" đều là đua có đảo chạy trước, kết quả ghi thứ tự `200 reversed` rồi `201 approved`. Số áp ≤ O sau khi đảo.
- **I3, vế trần gửi:** 8 trường hợp "trần > O − chờ" đều cùng kiểu đảo-trước.
- **I11, hàng tiền:** 0 dòng phí, dòng giảm hay FOC thường mới trên folio `closed`.
- **I7 khi O > 0:** phần giảm > W ⇒ 409 ở 358/358 lần; phần giảm ≤ W ⇒ 201 ở 406/410 lần (4 lần còn lại là dòng 8).
- **BE-83:**
  - 688 yêu cầu; `limitBasisVnd` ≤ cơ sở bảo vệ ở 688/688.
  - 239/239 yêu cầu có Σ > cơ sở được chuyển `owner`; không yêu cầu nào chuyển `owner` bị vai dưới OWN duyệt.
  - Cơ sở của mã: đọc sát chữ (bỏ đêm void) ở 61/61 yêu cầu void một phần; dùng số chụp ở 17/17 yêu cầu void toàn bộ.
- **Thu trong khoảng hở:** 15 lần, cả 15 trên folio đang có O > 0 (đường thu nợ), đúng I11.
- **Hai tổ chức:** không rò số.

## 5. Hai phát hiện cứng của harness

### 5.1 "Folio `closed` còn dư" (I4) – XÁC NHẬN

**FZ-01 10047, run-p1**, đọc từng hàng:

- **#2:** MGR void đêm phòng 1.055.000 trên folio `settled`, khi B = 0 và O = 0. Kết quả 201, B = −1.055.000.
- **#7:** OWN hạ một đêm 50.000 → B −1.005.000.
- **#19:** MGR void dòng F&B 300.000 → B −101.000.
- **#20:** MGR void đêm 1.005.000 → B −1.106.000.
- **Trước #22:** J15 trả `200 closed`. Folio `closed` từ #22 tới #26, credit 1.106.000.
- **#27:** OWN đảo khoản thu 1.410.000 trên folio `closed` → B +304.000.

Hiệu chỉnh mốc bước: ở **#19–21 folio còn `settled`**. Dư trên `settled` là hợp lệ, vì đó là khoản hoàn BR-522. Vi phạm I4 đúng là ở **#22–26**, trùng file vi phạm của harness.

Mười bốn chuỗi có cùng mẫu:

- FZ-01: 10047, 10101, 10169, 10193
- FZ-02: 20004, 20026, 20034, 20051, 20072, 20076, 20081, 20095
- FZ-06: 20004; FZ-06-org2: 20004

Ở cả 14 chuỗi, tiền dư sinh từ **A32 giảm hoặc void với phần giảm vượt W khi O = 0**, rồi J15 đóng folio mà không có yêu cầu hoàn. Log không có phiếu `refund` hay yêu cầu hoàn nào. Ở 10101 và 10169, tiền dư chỉ giảm về sau nhờ **đảo khoản thu** trên folio `closed`.

Vì sao xếp P0:

- I4 viết rõ: "Không bao giờ dư thừa (B < 0) trên folio `closed`".
- I11 chỉ cho folio `closed` ba đường tiền: thu nợ, xóa nợ, đảo khoản thu. Chi hoàn không nằm trong đó, nên tiền của khách có thể bị kẹt.
- Oracle §0 quy định mặc định P0 tới khi DOM chứng minh khác.

Gốc gây ra là chỗ oracle tự mâu thuẫn (dòng 3, mục 4). DOM cần chọn một trong hai:

- (i) Sau trả phòng, A32 giảm khi O = 0 chỉ được tới max(0, B) (không tạo dư); hoặc tạo dư thì tự tạo yêu cầu hoàn BR-522, và J15 không đóng folio còn "dư thừa chưa xử lý";
- (ii) Sửa I4 và I11 để cho phép, đồng thời mở đường chi hoàn trên folio `closed`.

Sửa xong thì BE và QA phải chạy lại cả 14 chuỗi.

### 5.2 Đua cùng thời điểm giả và các cảnh báo `I3?`, `I5?` – XÁC NHẬN (144/152)

- Mọi 45 cảnh báo `I3?` và 99 cảnh báo `I5?` không thuộc khoảng hở đều nằm trên chu kỳ có `debtOpenedAt` trùng `now` của một bước `race [`.
- Hai thao tác trong bước đua có cùng mốc giờ đến từng mili giây, nên tham chiếu của harness không biết khoản thu đứng trước hay sau lúc mở chu kỳ.
- Cách chấm của critic: chấp nhận nếu API khớp một trong hai thứ tự. Kết quả: 101/101 bản ghi khớp, đúng thứ tự in trong `outcomes`.
- Ví dụ:
  - **FZ-02 20078 #2:** đảo 100.000 chạy trước rồi thu 71.000 → O 29.000, API đúng.
  - **FZ-01 10112 #15:** thu 99.000 trước, chu kỳ cũ về 0, đảo 2.000.000 mở chu kỳ mới → R 2.000.000, API đúng. Harness cộng nhầm nhật ký chu kỳ cũ, ra 2.100.000.
- **8 cảnh báo `I3?` còn lại (FZ-02 20001 #23–26, 20038 #12–15) không phải đua.** Đó là khoảng hở trước J15 (dòng 1, mục 4). Harness ghi nhãn sai "race at one instant" cho 4 cảnh báo của 20001.
- Đề xuất cho harness: ghi kèm id phiếu hoặc thứ tự commit trong bước đua, để tham chiếu không phải đoán.

## 6. Danh sách Blocker và Major

- **B-1 (Blocker, P0, (a) theo oracle §0 kèm gốc (c)):** folio `closed` còn dư. Chi tiết ở 5.1. Chủ: DOM chốt quy tắc, BE-B sửa (đường A32 giảm khi O = 0, và J15). QA thêm ca hồi quy cho 14 chuỗi.
- **M-1 (Major, P1):** I9 / Q23-17a.
  - Yêu cầu chờ chỉ tự hủy khi OWN bấm duyệt (`200 cancelled eff 0 debt_cleared`), không tự hủy trong giao dịch thu.
  - Đã kiểm: không có lần nào áp xóa nợ khi O = 0, nên không có tiền đi sai. Vẫn chặn điều kiện "0 vi phạm I1–I15" tới khi R3-Q23 gộp.
- **M-2 (Major):** void toàn bộ đêm phòng rồi MGR tự áp xóa nợ.
  - Mã đọc sát chữ khi void một phần, nhưng rơi về số chụp khi void hết. BR-433 (a) nói "không có đêm nào → chờ OWN".
  - Số tự áp vẫn ≤ số chụp, nên không phải đường lách không giới hạn.
  - DOM chốt, rồi BE-B sửa hoặc DOM sửa BR.
  - FB-R3-QA-DOM-02 ý 1 ("mã giữ số chụp khi đêm bị void") **chỉ đúng khi void toàn bộ**. Với void một phần, mã bỏ đêm void (ví dụ FZ-01 10158 #16: cơ sở 750.000, không phải 863.000).
- **M-3 (Major, (b)):** fuzz không kiểm được thông báo.
  - `ownerNotifications` = 0, `stayAlerts` = [], `openAttention` = 0 ở 25.536/25.536 bản ghi, kể cả sau J15 `closed_with_debt` (BR-427 (d) yêu cầu báo OWN + MGR).
  - Σ lượt của vai dưới OWN chưa lần nào vượt ngưỡng ngay sau một lần áp. Lần gần nhất là bằng ngưỡng: FZ-06 20019 #12, MGR tự áp 1.055.000 = cơ sở 1.055.000.
  - Hệ quả: ESC-026/I13 và vế "một lượt báo OWN + MGR" của I5 **chưa được fuzz chứng minh**. QA sửa phần chụp thông báo và thêm thao tác sinh Σ vượt ngưỡng (ví dụ ba khoản miễn khác khóa như E26-1).
- **M-4 (Major, (b)):** "interleave fallback" chạy lặp thao tác.
  - 97 bước có hàng tiền mà không có kết quả HTTP thành công tương ứng.
  - Tính lại của critic dựa trên trạng thái nên không bị ảnh hưởng. Nhưng kết luận I14 ("đua = một thứ tự tuần tự") của harness ở các bước này không có giá trị.
  - QA cần cho biết lần gọi lại có dùng **cùng** `Idempotency-Key` không. Nếu có, hai phiếu 1.103.000 ở 10062 #21 là **lỗi idempotency P0 của sản phẩm**. Nếu không, đây chỉ là lỗi harness.

## 7. Ý kiến về câu hỏi mở của QA

| Thẻ | Ý kiến critic |
|---|---|
| FB-R3-QA-DOM-01 ý 1 (D gồm khoản thu đã bị đảo) | **Đồng ý.** Đọc "khoản thu sống" lệch API 876 bản ghi; đọc "đã nhận" lệch 290 trước khi xử lý nợ cũ và thứ tự đua, rồi 8 |
| FB-R3-QA-DOM-01 ý 2 (I5 với nợ trước 0076) | **Đồng ý.** Đã kiểm R = X + Σ mới: 0 vi phạm. Đề nghị DOM sửa thêm định nghĩa D: chu kỳ chuyển từ nợ cũ chỉ tính khoản thu sau lần ghi chuyển, không tính từ `debt_opened_at` lùi ngày |
| FB-R3-QA-DOM-02 ý 1 (đêm void) | **Đồng ý một phần.** Mô tả hành vi mã chưa đúng (xem M-2). Đề xuất: void một phần thì bỏ đêm void (như mã đang làm); void toàn bộ thì chờ OWN (như BR-433 (a)) |
| FB-R3-QA-DOM-02 ý 2 (xóa nợ chu kỳ trước bị hoàn tác) | **Đồng ý**, cùng cách đọc 3.2 điểm 2 |
| FB-R3-QA-ARC-01 (O = 0 trong khoảng hở) | **Đồng ý mức Minor.** Hai lưu ý: (1) harness **không** giữ khoảng hở ≤ 60 phút như thẻ viết (63 chuỗi trễ hơn, tới 416 phút); (2) trong khoảng hở, API trả `openDebtDueDate` của chu kỳ đã đóng cùng O = max(0, B). Nếu hạn cũ đã qua, Desk có thể hiện "quá hạn" sai tối đa tới khi J15 chạy. Đề xuất phương án (a) |

## 8. Ca bổ sung đề xuất (critic không thấy trong log, cần SEC và QA viết ca riêng)

1. **Xóa nợ "mọc lại" khi nâng dòng.**
   - Đã thấy trong log: FOC xóa nợ đi theo dòng và lớn trở lại khi dòng được nâng. FZ-11 40030 #22: FOC 1.000 → 3.000, trần là `appliedCapVnd` 767.000.
   - Kịch bản cần thử:
     1. MGR tự áp xóa nợ bằng đúng cơ sở trên đêm N.
     2. MGR hạ đêm N về 1.000 (dùng W).
     3. MGR tự áp thêm một khoản (Σ sống vẫn ≤ cơ sở).
     4. MGR nâng đêm N trở lại.
   - Nếu FOC mọc lại tới trần, Σ MGR tự áp sẽ vượt cơ sở mà không qua OWN, vi phạm I8 theo trạng thái.
   - Fuzz chưa gặp. Kiểm I8 theo trạng thái: chỉ FZ-06 20019 vượt, và đó là trường hợp BR-433 (d)(4) cho phép.
2. **Chi hoàn trên folio `closed` còn dư**, sau khi DOM chốt B-1.
3. **ESC-026 vượt ngưỡng trong fuzz** (xem M-3).

## 9. Kết luận dạng chuẩn

**8 lệch số (B: 0, O: 8 – cả 8 thuộc loại (c)); 0 lỗi tiền (a) chưa giải thích.**

Lượt kiểm **CHƯA ĐẠT** điều kiện oracle mục 8 ("0 vi phạm I1–I15"), vì còn:

- 1 Blocker: I4, 89 bản ghi / 14 chuỗi.
- 4 Major: I9 R3-Q23; cơ sở xóa nợ khi void toàn bộ đêm; không đo được thông báo / ESC-026; harness chạy lặp thao tác ở "fallback".
