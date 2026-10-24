# Critic độc lập – lượt fuzz tiền CUỐI R3 Sprint 1 (R3-Q30, cổng G1)

> Ghi chú QA 24/10: trong sổ lỗi, B-1 = **BUG-R3-012** (P0), M-1 = **BUG-R3-013** (P1). Số 007/008 đã có lỗi khác dùng.


- Vai: critic độc lập. Không viết harness, không mở `product/services/api/test/fuzz/`, không chạy mã sản phẩm, không đụng git. Chỉ đọc mã sản phẩm ở hai chỗ để xác nhận nguyên nhân (ghi rõ dòng).
- Round 3 – Sprint 1, bước **Kiểm thử**. Ngày 24/10/2026.
- Mã được thử: `origin/main` `91de0e7` + harness của QA.
- Dữ liệu: toàn bộ là dữ liệu giả.

## 1. Kết luận

**G1 CHƯA ĐẠT.** Còn **1 lệch tiền loại (a)** và **1 Major**.

- **B-1 (Blocker, P0 mặc định theo oracle §0).** J15 gặp folio có một yêu cầu hoàn đã duyệt nhưng không chi được (tiền dư đã về 0), khách còn nợ. J15 trả `waiting_refund` mãi:
  - không ghi phần cửa sổ thành công nợ;
  - không đóng folio.

  Hậu quả:
  - FZ-01 60164 #29–34: `openDebtVnd` = 0, trong khi oracle là 173.000.
  - FZ-01 60164 #35–39 và FZ-02 61092 #56: 173.000 và 20.000 nằm trong O nhưng không có nhật ký ghi nợ.
  - 5 chuỗi folio kẹt `settled`.
- **M-1 (Major, P1).** Yêu cầu hoàn đang mở lớn hơn tiền dư mà không được lập lại (`refundPlan`):
  - sau phát sinh sau trả phòng (`late`), sau J15 và sau A32 giảm;
  - trái BR-522 ("thừa thì yêu cầu chờ duyệt tự hủy và tạo lại") và ARC 13.2 (`openRefundVnd > rawCreditVnd` → `closeStayCredit`).

  Đây là gốc gây ra B-1.

Ngoài hai mục này, các bất biến tiền đều đạt trên toàn bộ dữ liệu. Chi tiết ở mục 4 và 5.

- Tính lại **B** từ hàng DB: **0 lệch** trên 24.266 bản ghi (sau khi đọc đúng phiếu QR `expired`, xem dòng 3 bảng 4).
- Tính lại **O**: chỉ lệch 6 bản ghi của B-1.
- **Claim của harness "không có vi phạm cứng" là sai một chỗ.** Ở FZ-01 60164, harness hạ `I1?`/`I3?` thành cảnh báo với lý do "J15 not run yet". Thực tế J15 đã chạy 7 lần, lần nào cũng trả `200 waiting_refund`.

## 2. Phạm vi

**Log gốc:** `scratchpad/fzfinal2/run-g1 … run-g5`.

- **610 chuỗi chính, 24.266 bản ghi bước:**
  - FZ-01: 200
  - FZ-02: 100
  - FZ-06: 40
  - FZ-07: 50
  - FZ-08: 40
  - FZ-09: 50
  - FZ-10: 50
  - FZ-11: 40
  - FZ-12: 40
- **Thêm 40 chuỗi `FZ-06-org2`** (1.540 bản ghi), dùng để kiểm hai tổ chức. Tổng cộng 650 chuỗi, 25.806 bản ghi.
- **Bản ghi khác:** 896 ghi chú "interleave fallback (no re-send)" và các dòng `{"scheduler":"J15"}`.
- Có 40 tệp `*-warnings.json`.

**Chuẩn đối chiếu:**

- DOM `s1-money-oracle.md`: mục 1, 2, 4, 5.4, 5.5 (FZ02-1…9), 5.6 (FZ-08), 8 (I1–I15), I16, I17.
- BR v0.4.3: BR-433 (a)(c)(d)(e), BR-522, BR-525, BR-427 (d).
- ARC: `s1-contracts.md` 13.2; `s1-ARC-on-add3.md` (ADD3-01 và lượt 2).
- SEC: `s1-SEC-on-add3.md` (I18).
- Critic lượt trước: `s1-money-critic.md`.

**Không tính vào G1 (theo đề bài):**

- Họ FZ-08: nợ trước 0076, P3 theo ARC.
- I9: R3-Q23 chưa gộp.

**Script:** thư mục `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/critic/`.

- Script mới:
  - `critic2.py`: bộ kiểm chính;
  - `loadf.py`, `dumpf.py`, `trace.py`;
  - `uhover.py`, `uhover2.py`, `refplan.py`, `stuckj15.py`, `wr.py`;
  - `raceorder.py`, `reduced.py`, `i16.py`.
- Tái dùng `engine.py` của lượt trước.
- Kết quả thô: `findings_final.json`.

## 3. Phương pháp và cách đọc oracle

### 3.1 Công thức

Chỉ dùng `raw` và `now`. Trường `ref` và `violations` của harness chỉ dùng để đối chiếu ở mục 6.

- **B** = Σ dòng `posted` (gồm dòng đảo âm và dòng FOC âm) − Σ phiếu thu có trạng thái `succeeded`/`reversed` (gồm phiếu đảo âm).
  - Phiếu QR `expired` không phải tiền. Đây là ý định QR bị QR mới thay thế.
  - Không có phiếu chi hoàn nào: `refundPay` thành công 0/340 lần. Vì vậy "+ hoàn đã chi" = 0.
  - Kiểm chéo I15 bằng cách thứ hai: phí sống − FOC sống − phiếu thu `succeeded` chưa đảo.
- **O** = clamp(R − D, 0, max(0, B)). Hết cửa sổ (folio `closed` hoặc `now > windowUntil`) thì O = max(0, B). **W** = max(0, B) − O.
  - **Phiếu thu về sau bị đảo:** D tính khoản thu **đã nhận** sau lúc mở chu kỳ, kể cả phiếu về sau bị đảo. Lý do: lần đảo đã đi vào R theo G-4. Cùng cách đọc với lượt trước và FB-R3-QA-DOM-01.
  - **Xóa nợ bị hoàn tác:** D xóa nợ = −Σ mọi dòng FOC gắn yêu cầu `debt_write_off`, kể cả dòng đảo FOC, đăng sau lúc mở. Khi FOC tự hủy hoặc bị đảo, D giảm và nợ quay lại, nhưng vẫn bị kẹp bởi max(0, B) (FZ08-1).
  - **Nợ trước 0076 (FZ-08), theo oracle 2/5.6:**
    - chưa có chu kỳ: R = Σ nhật ký cũ;
    - sau lần ghi chuyển: R = X + Σ nhật ký mới, và D chỉ tính khoản thu sau lần ghi chuyển.
- **Đua tại một thời điểm giả:** khoản thu hoặc FOC trùng đúng `debtOpenedAt` được tính theo cả hai thứ tự; API phải khớp một trong hai (I14). Hai bằng chứng phụ:
  - I5: chu kỳ = một đoạn cuối của nhật ký `debt_on_checkout`, xếp theo **id tuần tự**, bắt đầu bằng một nhật ký đóng dấu đúng `debtOpenedAt`;
  - `raceorder.py`: so quyết định "mở chu kỳ mới / nối" với thứ tự chèn UUIDv7 (phần ms) của phiếu đảo và phiếu thu.
- **Cơ sở hạn mức bảo vệ (BR-433 (d)):**
  - mỗi đêm: min(Σ dòng `room` sống của đêm, `referenceRateVnd`);
  - cơ sở = max qua các đêm có tiền, rồi lấy min với số chụp ở bản ghi đầu sau trả phòng;
  - không còn đêm nào thì cơ sở = null.
- **Ngày nghiệp vụ** = giờ Việt Nam − 6 giờ. Chu kỳ mới có hạn = ngày nghiệp vụ lúc ghi + 3.

### 3.2 Đã kiểm sau mọi bước, trên cả 650 chuỗi

| Mã | Cách kiểm |
|---|---|
| B, I15 | B của API so với hai cách cộng sổ. Không xóa hay sửa hàng (dòng, phiếu, nhật ký nợ, yêu cầu duyệt, yêu cầu hoàn, `folio_settled_reduction`). Các cột của yêu cầu hoàn bất biến. |
| I1, I2, I3 | O theo 3.1. Thêm vế trần gửi xóa nợ trong 422 `max` ≤ O − Σ chờ. |
| I4 | (1) folio `closed` ⇒ không dư, không có yêu cầu hoàn mở. (2) Sau một khoản thu do người bấm (`collect`, `qrLate`) trên `settled` ⇒ `unhandledCreditVnd` = 0. (3) A32 không làm tăng `unhandledCreditVnd`. (4) Hết cửa sổ mà còn dư ⇒ "Cần chú ý" `closed_reservation_credit` mở. Thêm: tính lại `unhandledCreditVnd` = max(0, dư − Σ yêu cầu hoàn mở). |
| I5, I6 | R = Σ nhật ký của chu kỳ. ΔR = Σ nhật ký mới. Mỗi nhật ký > 0. Hạn: giữ hạn cũ hoặc ngày nghiệp vụ + 3, đúng theo O trước bước (bước tuần tự). |
| I7 | A32 giảm tuần tự trên `settled` trong cửa sổ, hai chiều. O > 0: 201 ⇔ phần giảm ≤ W. O = 0: 201. |
| I8, I16 | Mọi `debt_write_off` có `requiredRole` và vai duyệt ≥ `manager`. Σ (đã áp + chờ + mới) > cơ sở ⇒ `owner`. Dạng trạng thái: Σ xóa nợ sống do vai dưới OWN duyệt > cơ sở hiện hành ⇒ OWN đã được báo. |
| I11 | Folio `closed`: không thêm dòng ngoài FOC xóa nợ; không có yêu cầu hoàn mới; mã trả của mọi A32. |
| I17, I18 | A32: `requestedBy ∈ originActorIds`, `reasonNote` bắt đầu "Tự sinh từ A32", Σ hoàn A32 (chờ + duyệt) so với cơ sở cả hai chiều, cơ sở null ⇒ `owner`. Yêu cầu `other` trên folio có A32 dưới OWN ⇒ `owner` và mảng nguồn chứa người làm A32. Lúc duyệt: không phải người xin, ≥ `manager`, `owner` khi định tuyến `owner`, không phải người đã làm A32 trước lúc duyệt. Không yêu cầu A32 nào bị hủy tay. |
| A32 `reducedVnd` | = max(0, min(dòng trước, dòng lúc khách rời[, giá tham chiếu]) − dòng sau). Đây là cách ARC đồng ý trong `s1-ARC-on-add3` ý 2. |
| ESC-026 / I13 | Σ lượt = FOC/xóa nợ sống do FD/LT trưởng/MGR duyệt + Σ `reducedVnd` của vai dưới OWN. Ngưỡng theo vai cao nhất (MGR → cơ sở bảo vệ). Sau mỗi lần áp mà Σ > ngưỡng ⇒ `alertCount` tăng và đúng 1 mục "Cần chú ý" mở. Thêm: không có báo khi không vượt; `openAttention` ≤ 1. |
| I14 | Không có hàng thừa so với số thao tác ở 1.011 bước đua "fallback". Thứ tự đua (UUIDv7). |
| Hai tổ chức | `FZ-06` so với `FZ-06-org2`: 0 id trùng (2.033 hàng, 80 folio). |

### 3.3 Đọc tay từng bước: 27 chuỗi, đủ mọi họ

- FZ-01: 60001, 60070, 60143, 60164
- FZ-02: 61024, 61046, 61048, 61056, 61073, 61084, 61092
- FZ-06: 61019
- FZ-06-org2: 61012
- FZ-07: 62000, 62003, 62023, 62030, 62033
- FZ-08: 62019, 62030
- FZ-09: 62007, 62047
- FZ-10: 63014, 63029
- FZ-11: 63018
- FZ-12: 63009, 63021

Gồm mọi chuỗi có cảnh báo I1?, I3?, I6?. Các chuỗi I5? và I7? lấy mẫu (62000, 62003, 62030, 62033, 61073, 62019).

## 4. Bảng lệch

Phân loại: (a) lỗi tiền sản phẩm, (b) lỗi harness hoặc tham chiếu, (c) oracle mơ hồ.

| # | Chuỗi, bước | API | Critic | Loại | Mức |
|---|---|---|---|---|---|
| 1 | FZ-01 60164 #29–34 (6 bản ghi; harness I1?/I3?) | `openDebtVnd` 0; folio `settled`; J15 ×7 `200 waiting_refund` | Hết cửa sổ ⇒ O = max(0, B) = **173.000**; J15 phải ghi 173.000 thành công nợ (BR-427 (d), I5) rồi đóng | **(a)** | **Blocker P0** (B-1) |
| 2 | FZ-01 60164 #35–39; FZ-02 61092 #56 | O 273.000 với R 100.000; O 20.000 với phần đã ghi nợ 0; J15 vẫn `waiting_refund` | Phần 173.000 và 20.000 vào O mà không có nhật ký `debt_on_checkout` và không báo OWN + MGR | **(a)** | thuộc B-1 |
| 3 | 8 bước đua `qrLate ‖ qrLate` (FZ-01 60086 #42; FZ-02 61009, 61015, 61017, 61024, 61041, 61060, 61080), kéo theo 101 bản ghi | B = due − credit, không tính phiếu `expired`; một nhánh 409 `INVALID_TRANSITION` | Lúc đầu critic cộng cả phiếu `expired` (lệch 10.000 … 1.514.000) | (b) tham chiếu critic: API đúng. Kèm câu hỏi (c) cho DOM: tiền khách thật sự trả vào QR đã bị QR mới làm hết hạn thì xác nhận bằng đường nào | Minor |
| 4 | 241/610 chuỗi, 2.406 bản ghi (`UH-over`) | Σ yêu cầu hoàn đang mở > tiền dư. Ví dụ FZ-01 60001 #11–24: chờ 2.513.000, dư 1.679.000 → 1.749.000 | BR-522: phần thừa của yêu cầu chờ duyệt phải tự hủy và tạo lại. ARC 13.2: `openRefundVnd > rawCreditVnd` → `closeStayCredit`/`refundPlan` | **(a)**; hợp đồng ARC 13.2 không liệt kê `postLine` (`late`) – (c) | **Major P1** (M-1) |
| 5 | 12 lần duyệt tuần tự. Ví dụ FZ-02 61002 #37 (300.000, dư 0); FZ-11 63028 #33 (50.000, dư 0); FZ-01 60109 #3 (900.000, dư 66.000); FZ-02 61002 #19 (1.384.000, dư 850.000) | `200 approved` | Yêu cầu vượt tiền dư lẽ ra đã bị lập lại trước khi tới tay người duyệt (dòng 4). Duyệt khi dư 0 sinh ra yêu cầu "mồ côi", là gốc của dòng 1 | (a) | thuộc M-1 |
| 6 | FZ-07, 16 bước đua A32 ‖ (thu / đảo / xóa nợ) trên folio `closed` | 412 `VERSION_CONFLICT` | I11: 409 `FOLIO_LOCKED` | (a), chỉ sai mã, 0 hàng tiền. Đã có từ lượt trước | Minor |
| 7 | FZ-08 62019 #1, 62032 #18, 62034 #4, 62039 #10/#12/#14 (harness I7?) | 409 | Nợ cũ, O > 0, phần giảm ≤ W ⇒ 201 | (a), chặt hơn quy tắc, không mất tiền. **FZ-08: P3, không tính G1** | – |
| 8 | FZ-10 63029 #35; FZ-11 63022 #29; FZ-11 63026 #35 | MGR tự áp xóa nợ 1.000 / 996.000 / 1.000 | Σ tính theo `appliedCapVnd` vượt cơ sở; Σ tính theo FOC sống ≤ cơ sở | (c) "số thực áp" khi FOC đi theo dòng (cùng mục 6 của lượt trước). Critic chọn FOC sống, khớp API | Minor |
| 9 | FZ-02 61056 #16 `race [approve refund 900.000 by mgr] ‖ [a32 void by mgr]` | approved | Người duyệt là người làm A32 cùng thời điểm giả | (b). Duyệt hoàn khóa folio trước (`RefundsService.lockFolioOf`), A32 cũng khóa folio. Hai thao tác chạy tuần tự; duyệt thành công nghĩa là duyệt chạy trước A32. Không vi phạm | – |
| 10 | FZ-01 60139 #33; FZ-02 61082 #17 (A32 ‖ hủy yêu cầu hoàn) | `unhandledCreditVnd` tăng | I4 vế A32 | (b): phần tăng do hủy yêu cầu hoàn (không thuộc K11-06), không do A32 | – |
| 11 | 143 bản ghi / 20 chuỗi (I9?) | Yêu cầu `debt_write_off` chờ khi O = 0 | Q23-17a | (a) đã biết, R3-Q23 chưa gộp. **Không tính G1.** Khớp 143/143 với harness | – |
| 12 | 791 bản ghi bước đua "fallback" | `outcomes` rỗng | – | (b): harness không ghi kết quả HTTP. Đã sửa lỗi gửi lặp (M-4 lượt trước): 0 hàng thừa trên 1.011 bước | Minor |
| 13 | Mọi bản ghi | `ownerNotifications` = Σ `alertCount` ở 25.806/25.806 | Không có số báo của lần ghi nợ (I5 vế "một lượt báo OWN + MGR") | (b) độ phủ | Minor |
| 14 | `refundPay`: 0/340 lần thành công (69 × 409 `REFUND_DESTINATION_REQUIRED`, còn lại "(none)") | – | Đường chi hoàn (tiền thật đi ra) chưa được fuzz. Chặn "chi ≤ dư" chỉ xác nhận bằng đọc mã (`refunds.service.ts` ~dòng 515: `min(left, rawCreditVnd)`) | (b) độ phủ | Minor (nâng lên nếu M-1 không sửa) |

## 5. Blocker / Major

### B-1 – J15 `waiting_refund` khi tiền dư = 0 và khách còn nợ

- Loại (a). **P0** mặc định theo oracle §0, vì mã ra khác số oracle.
- **Mã gây ra:** `folio.service.ts` `closeAfterWindow`, dòng ~1375: `if (b.openRefundVnd > 0) return 'waiting_refund';`.
  - Dòng này đứng **trước** nhánh ghi nợ `recordDebt`.
  - Nó không xét `rawCreditVnd`.
- **Chuỗi FZ-01 60164**, đọc tay:

  | Bước | Thao tác | Kết quả |
  |---|---|---|
  | #15 | OWN duyệt yêu cầu hoàn A32 50.000 | dư 650.000 |
  | #22 | Đảo khoản thu 300.000 | dư 350.000 |
  | #23 | Đua A32 tăng 958.000 ‖ phát sinh 140.000 | dư 0, B 748.000; yêu cầu chờ bị `superseded`; yêu cầu **đã duyệt 50.000** còn lại, không chi được nữa |
  | #25 | Thu 575.000 | B 173.000 |
  | #29–35 | Hết cửa sổ 05/12 04:00Z; J15 chạy 7 lần | `200 waiting_refund`; O 0; không nhật ký; không báo |
  | #31, #33 | A32 | 409 |
  | #35 | Đảo 100.000 | Mở chu kỳ R 100.000; O nhảy lên 273.000 (gồm 173.000 chưa từng ghi nợ) |
  | #36–40 | J15 | Vẫn `waiting_refund` |

- **Quy mô:** 40 lần J15 `waiting_refund` khi dư = 0 và B > 0, trên 5 chuỗi: FZ-01 60070, 60164; FZ-02 61019, 61084, 61092.
  - 2 chuỗi có tiền khách nợ không vào sổ nợ: 60164 (173.000) và 61092 (20.000).
  - Cả 5 chuỗi có folio kẹt `settled` vô thời hạn, "Cần chú ý" `closed_reservation_credit` mở trong khi không có tiền dư.
- **Đề xuất (ARC chốt, DOM xác nhận):**
  1. J15 chỉ chờ (`waiting_refund`) khi `rawCreditVnd > 0`.
  2. Khi dư = 0, yêu cầu hoàn đã duyệt mà chưa chi tự đóng hoặc tự hủy, có nhật ký. Sau đó J15 ghi nợ và đóng folio như BR-427 (d).
  3. Bổ sung câu cho ARC 13.2 điểm 3.
  4. QA thêm ca hồi quy từ 60164 và 61092.
  5. Thêm bất biến: "hết cửa sổ và J15 đã chạy ⇒ không có folio `settled` với dư 0 và B > 0".

### M-1 – yêu cầu hoàn đang mở lớn hơn tiền dư không được lập lại

- Loại (a) so với BR-522; hợp đồng có kẽ hở (c). **Major P1.**
- **Bằng chứng** (`refplan.py`, bước tuần tự có thao tác thành công trên `settled`):
  - `late` (phát sinh sau trả phòng, người bấm) làm yêu cầu mở vượt dư: 347 lần mới vượt + 104 lần vượt sẵn, lần nào cũng không lập lại;
  - J15: 81 lần;
  - A32 giảm hoặc void khi đang vượt: 51 lần vẫn vượt, không `superseded`;
  - `refundCancel`: 7 lần;
  - ngược lại `collect`, `qrLate`, `reverse` và A32 tăng luôn lập lại.
  - Kết quả: 2.406 bản ghi / 241 chuỗi, 90 chuỗi kết thúc khi còn vượt. Có 12 lần MGR/OWN duyệt yêu cầu lớn hơn tiền dư lúc duyệt, 2 lần khi dư = 0.
- **Ảnh hưởng tiền:**
  - Tiền chưa đi sai: chi hoàn bị chặn ở `min(left, rawCreditVnd)` (đọc mã), và fuzz chưa chi lần nào.
  - Người duyệt thấy và duyệt số sai.
  - Σ hoàn từ A32 bị thổi lên (an toàn về định tuyến).
  - Sinh yêu cầu đã duyệt "mồ côi", dẫn tới B-1.
- **Đề xuất:**
  - `afterSettledMoneyChange` chạy cho **mọi** thao tác tiền do người bấm trên `settled`, gồm `postLine` sau trả phòng, với điều kiện `openRefundVnd > rawCreditVnd`. A32 giảm cũng chạy khi điều kiện đúng.
  - Lúc duyệt, kiểm số ≤ tiền dư hiện tại, hoặc lập lại kế hoạch hoàn trước khi duyệt.
  - ARC thêm `postLine` vào danh sách 13.2.
  - QA cho `refundPay` có nơi nhận (`setRefundDestination`) để fuzz đường chi.

## 6. Phán xử cảnh báo của harness

| Lớp | Số bản ghi / chuỗi | Phán xử |
|---|---|---|
| `I3?` | 26 / 4 | **6 (FZ-01 60164) là lỗi thật (a) = B-1**, và nhãn "J15 not run yet" của harness sai. **20 còn lại là (b):** FZ-02 61012 ×8, 61046 ×3, FZ-08 62030 ×9. API khớp một thứ tự tuần tự của bước đua cùng thời điểm giả, có thể ở một bước trước đó. Ví dụ 61046 #15: khoản thu 50.000 trùng lúc mở chu kỳ được tính sau lúc mở → O 1.053.000 đúng. Riêng 62030 (FZ-08) khớp công thức nợ cũ ở mọi bản ghi. |
| `I5?` | 170 / 13 | **(b) toàn bộ.** Ở mọi bản ghi, R = Σ một đoạn cuối nhật ký xếp theo id tuần tự. Nguồn là đua `reverse ‖ (collect / QR / reverse)` cùng thời điểm giả; tham chiếu harness đoán sai thứ tự rồi lệch kéo dài. Ví dụ: 62003 #9: R 1.500.000 = 500.000 + 1.000.000, API đúng, harness ra 1.000.000. 62033 #28: harness báo ở một bước duyệt tuần tự, nhưng R vẫn bằng Σ nhật ký. 61073 #23: QR 1.046.000 ‖ đảo 600.000; không có yêu cầu hoàn dư 50.000 nào được tạo, chứng tỏ đảo chạy trước, nên nối chu kỳ là đúng. Kiểm thứ tự chèn UUIDv7 cho 24 bước đua `reverse ‖ receipt`: 23 khớp; bước còn lại (61073) là phiếu QR được tạo lúc lập QR, trước lúc xác nhận. |
| `I6?` | 2 / 2 | **(b).** FZ-07 62000 #16: UUID cho thấy đảo chạy trước (O trước 997.000 > 0) → giữ hạn 13/11, đúng. FZ-07 62023 #0: R 1.084.000 = 100.000 nợ cũ + 984.000 → đảo chạy trước khi O > 0, giữ hạn 22/11, đúng. |
| `I1?` | 6 / 1 | **(a) = B-1** (FZ-01 60164). |
| `I7?` | 6 / 4 | FZ-08 nợ cũ, chặt hơn quy tắc. **P3, không tính G1.** Khớp 6/6 với critic. 4 lần critic tìm thêm là O = 0 → 201, đúng quy tắc. |
| `I9?` | 143 / 20 | R3-Q23 chưa gộp, **không tính G1.** Khớp 143/143. Không có lần nào xóa nợ được áp khi O = 0. |

## 7. Các kiểm đạt, 0 vi phạm

| Kiểm | Kết quả |
|---|---|
| B, I15 | 0 lệch / 24.266 bản ghi. 0 hàng bị xóa hay sửa số. Cột của yêu cầu hoàn và `folio_settled_reduction` bất biến. |
| O, I2 | 0 lệch ngoài B-1 (13.972 bản ghi có chu kỳ; 807 nợ cũ; 2.461 hết cửa sổ). |
| I4 | 0 folio `closed` còn dư hoặc còn yêu cầu hoàn mở. 1.357/1.357 lần thu do người bấm trên `settled` không để lại dư chưa xử lý. 2.464 lần A32 không làm tăng dư chưa xử lý (2 ngoại lệ là dòng 10). 248/248 bản ghi hết cửa sổ còn dư có "Cần chú ý". `unhandledCreditVnd` tính lại khớp ở mọi bản ghi. |
| I5, I6 | 1.052 nhật ký mới: số > 0; ΔR = Σ mới; hạn đúng. |
| I7 (ngoài FZ-08) | O > 0: phần giảm > W ⇒ 409, phần giảm ≤ W ⇒ 201, đúng ở mọi lần tuần tự. O = 0: 826/826 lần 201. |
| I11 | 0 dòng hay yêu cầu hoàn mới trên folio `closed`. A32 trên `closed`: 364 lần 409, 16 lần 412 (dòng 6). |
| I8, I16 | 636 yêu cầu xóa nợ: định tuyến và vai duyệt ≥ `manager`; yêu cầu định tuyến `owner` chỉ OWN duyệt; `limitBasisVnd` ≤ cơ sở bảo vệ. Dạng trạng thái: 64 bản ghi Σ xóa nợ dưới OWN > cơ sở hiện hành (cơ sở giảm sau khi đã áp, BR-433 (d)(4)), và **cả 64 đã báo OWN**. |
| I17 | 824 yêu cầu A32: `requestedBy ∈ originActorIds` 824/824; ghi chú đúng 824/824. Định tuyến Σ đúng cả hai chiều: 422 `manager` (Σ ≤ cơ sở), 402 `owner` (Σ > cơ sở hoặc cơ sở null). 28 yêu cầu thay thế chuyển `owner` → `manager` vẫn đúng quy tắc Σ (BR-433 (e) bỏ yêu cầu đã hủy). |
| I18 | 527 yêu cầu `other` trên folio có A32 dưới OWN: 527 `owner`, mảng nguồn đủ. 425 yêu cầu trên folio không có A32: `manager`. 128 lần duyệt: 0 do người xin, 0 dưới `manager`, 0 yêu cầu `owner` do MGR duyệt, 0 do người làm A32 (dòng 9). 0 yêu cầu A32 bị hủy tay (người xin hủy → 403). |
| `reducedVnd` | 970/970 hàng khớp công thức. |
| ESC-026 / I13 | 1.191 lần áp dưới OWN; 482 lần vượt ngưỡng → 482 lần `alertCount` tăng và đúng 1 mục "Cần chú ý". 0 lần báo khi không vượt. `openAttention` ≤ 1. M-3 của lượt trước (không đo được) **đã đóng** cho ESC-026. |
| I14 | 0 hàng thừa ở 1.011 bước "fallback" (M-4 lượt trước đã đóng). Thứ tự đua: xem mục 6. |
| Hai tổ chức | 0 id trùng. |

## 8. Kết luận dạng chuẩn

**Lệch tiền: 6 bản ghi O (FZ-01 60164), loại (a), và 2 trường hợp tiền nợ vào O mà không có nhật ký (60164, 61092). B: 0 lệch.**

**Blocker 1 (B-1), Major 1 (M-1).** Minor: dòng 3, 6, 8, 12, 13, 14.

**G1 CHƯA ĐẠT "0 lệch tiền, 0 Major".**

Điều kiện để đạt:
- sửa B-1 và M-1 (BE-B, review ARC + SEC);
- QA thêm ca hồi quy 60164 và 61092, bật `refundPay` có nơi nhận;
- chạy lại đủ họ, critic đọc lại.

FZ-08 và I9 giữ ngoài G1 như đề bài.
