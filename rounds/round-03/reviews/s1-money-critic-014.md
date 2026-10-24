# Critic độc lập – lượt fuzz tiền CHẠY LẠI sau bản sửa BUG-R3-014 (R3-Q30, cổng G1)

- Vai: critic độc lập. Không viết harness, không mở `product/services/api/test/fuzz/`, không chạy mã sản phẩm, không đụng git hay Docker.
- Round 3 – Sprint 1, bước **Kiểm thử**. Ngày 24/10/2026.
- Mã được thử: `origin/main` `ce38624` (BE-B BUG-R3-014, `76e21c4`), cờ `FUZZ=1 FUZZ_BE83=1 FUZZ_FZ02=1 FUZZ_K1106=1 FUZZ_ADD3=1`.
- Dữ liệu: toàn bộ là dữ liệu giả.

## 1. Kết luận

**G1 ĐẠT "0 lệch tiền, 0 Major"** (FZ-08 và I9 giữ ngoài G1 như đề bài).

- **0 lệch tiền** theo oracle: B, O, W, R, hạn, sổ cân. 0/28.250 bản ghi chính.
- **0 Blocker, 0 Major.** Không có bất đồng loại (a) nào chưa giải thích.
- **BUG-R3-014 (M-2): đóng được.** Đủ cả hai vế của hợp đồng 13.4:
  - **Bất biến K11-06:** 0 vi phạm trên 26.105 bản ghi folio `open`/`settled`. Trong đó 8.371 bản ghi ngay sau một thay đổi tiền, và 10.024 bản ghi đang có yêu cầu hoàn mở.
  - **`SELF_REFUND_FORBIDDEN`:** 0 lần người dưới OWN đã làm A32 chi hoặc đặt nơi nhận. Có 63/63 lần 403 trả đúng người. 0 lần 403 sai người.
- Bảy chuỗi M-2 cũ đọc lại: không còn trạng thái "tiền dư 0 mà yêu cầu đã duyệt còn tiền". Không còn duyệt cũ nuốt tiền mới. Người làm A32 bị 403 khi đặt nơi nhận (64023 #42/#43, 64026 #50/#51/#55, 64053 #54).
- Còn 4 Minor mới, đều loại (b) hoặc (c), không lệch tiền: bảng 4 dòng 5, 6, 7, 8.

## 2. Phạm vi

**Log gốc:** `scratchpad/fzfinal4/run-g1 … run-g6`.

- **710 chuỗi chính, 28.250 bản ghi bước:**
  - FZ-01: 200
  - FZ-02: 100
  - FZ-06: 40
  - FZ-07: 50
  - FZ-08: 40
  - FZ-09: 50
  - FZ-10: 50
  - FZ-11: 40
  - FZ-12: 40
  - FZ-13: 100
- Thêm 40 chuỗi `FZ-06-org2` (1.540 bản ghi) để kiểm hai tổ chức.
- Dòng lịch J15: 209. Ghi chú "interleave fallback": 996.
- Tệp `*-warnings.json`: 38.
- Hai chuỗi dò `refundPay-cash/transfer.jsonl`.
- Cùng hạt giống với lượt trước (`fzfinal3`) để so sánh.

**Chuẩn đối chiếu:**

- DOM `s1-money-oracle.md` (I1–I17).
- `business-rules.md`: BR-427, BR-433, BR-522, BR-525.
- `rbac-matrix.md` mục 38–39 (SEC-37: người đặt nơi nhận không được duyệt).
- ARC `s1-contracts.md` 13.2, 13.3, **13.4**.
- Các review: `s1-ARC-on-bug-012-013.md`, `s1-SEC-on-bug-012-013.md`, `s1-ARC-on-bug-014.md`, `s1-SEC-on-bug-014.md`.
- Critic lượt trước: `s1-money-critic-rerun.md`.

**Không tính vào G1:** họ FZ-08 (nợ trước 0076, P3) và I9 (R3-Q23 chưa gộp).

**Script:** thư mục `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/critic/`. Mọi script chạy một tiến trình.

- Tái dùng bộ kiểm của critic trước, chỉ đổi nguồn log sang `fzfinal4` (`loadf4.py`):
  - `critic4.py` (từ `critic3.py`);
  - `critic4x.py` (từ `critic3x.py`);
  - `recheck4`, `uhover4`, `j15chk4`, `i7race4`, `orgs4`.
- Viết mới cho lượt này:
  - `critic4y.py`: toàn bộ 13.4;
  - `sec014.py`: SEC (ii) cộng dòng dõi bản thay;
  - `replnote4.py`, `replnote3cmp.py`;
  - `a32norow4.py`, `a32norow4b.py`;
  - `m2chains4.py`, `invcount4.py`, `compact4.py`, `compact4o.py`, `dumpf4.py`.
- Kết quả thô: `findings_014.json`, `findings_014_x.json`, `findings_014_y.json`, `out4_*.txt`.

## 3. Phương pháp

Như critic lượt trước (mục 3 của `s1-money-critic-rerun.md`). Chỉ dùng `raw`, `code`, `outcomes`, `label`, `now`. Trường `ref`/`violations` của harness chỉ dùng để đối chiếu ở mục 7.

**Kiểm mới cho 13.4:**

| Mã | Cách kiểm |
|---|---|
| **K11-06** | Tính trên mọi bản ghi, cả bước đua. Folio `open`/`settled`: Σ `pending` + Σ (`amountVnd − refundedVnd`) của `approved` ≤ `rawCredit`, với `rawCredit` = max(0, −B tính từ hàng). Đối chiếu thêm `rawCredit` = `creditVnd` của API. Folio `closed`: 0 tiền dư, 0 yêu cầu mở. |
| **I24 / I24b** | Không bản ghi nào có tiền dư 0 mà còn yêu cầu đã duyệt còn tiền. Không có bước nào tiền mới vào khi một duyệt cũ còn treo ở tiền dư 0. |
| Lập lại kế hoạch trên yêu cầu đã duyệt | Mỗi bước có `approved → cancelled superseded`. Kiểm bốn điều: (1) yêu cầu bị cắt mới hơn yêu cầu được giữ; (2) cắt tối thiểu: giữ + yêu cầu bị cắt cũ nhất > tiền dư; (3) sau bước, Σ mở = tiền dư (xin lại đúng phần còn lại); (4) bản thay giữ nguồn, ghi chú, người xin, `originActorIds`, cấp duyệt ≥ cấp cũ. Cấp được so cả cùng nguồn lẫn mọi nguồn bị thay. |
| Không duyệt cũ nào hút tiền A32 | Mỗi lần A32 giảm tuần tự làm tăng tiền dư trên folio `settled` (786 lần) phải đạt bốn điều: trước bước, Σ mở ≤ tiền dư; phần còn lại của yêu cầu đã duyệt không tăng; `unhandledCreditVnd` không tăng; có yêu cầu mới nhận phần tăng. |
| Phủ của mỗi lần chi | Với mỗi phiếu hoàn: tại **mọi** bản ghi từ lúc duyệt tới lúc chi, Σ đã duyệt còn tiền ≤ tiền dư. Chi sau một A32 dưới OWN: đọc tay từng ca. |
| `SELF_REFUND_FORBIDDEN` theo hàng | Phiếu hoàn có `recordedBy` ∈ người làm A32 dưới OWN với `at` ≤ `createdAt` → lỗi. Lần đặt nơi nhận mới (`destinationSetAt` đổi) có `destinationSetBy` ∈ người làm A32 với `at` ≤ `destinationSetAt` → lỗi. |
| `SELF_REFUND_FORBIDDEN` theo lần thử | Tên trong nhãn (`by mgr`…) được ánh xạ ra id theo từng (run, tệp), lấy từ các bước tuần tự có đúng một hàng quy được (A32, đặt nơi nhận, chi, duyệt). Kết quả: 0 tên mơ hồ. Mỗi 403 phải là người làm A32 trước bước. Mỗi 2xx của người làm A32 dưới OWN → lỗi. 403 trên lần chi không được để lại phiếu. |
| `SELF_APPROVAL_FORBIDDEN` | Mỗi 403 phải có lý do: người duyệt là người xin, thuộc `originActorIds`, đã làm A32, hoặc là người đặt nơi nhận (SEC-37). |
| SEC (ii) mở rộng (`sec014.py`) | Áp cho mọi lần duyệt. Thêm hai điều: người duyệt ≠ người đặt nơi nhận (trừ OWN); và dòng dõi người xin của các yêu cầu mà bản thay kế thừa. |

## 4. Bảng bất đồng

Phân loại: (a) lỗi tiền sản phẩm, (b) lỗi harness hoặc tham chiếu, (c) oracle hoặc hợp đồng mơ hồ.

| # | Chuỗi, bước | API | Critic / hợp đồng | Loại | Mức |
|---|---|---|---|---|---|
| 1 | `I3?` 37 bản ghi / 6 chuỗi (61012, 61046, 62030, 64022, **64052 mới**, 64063) | O khớp một thứ tự tuần tự của bước đua | O của critic (xét cả hai thứ tự) khớp API ở **mọi** bản ghi. Đọc tay 64052 #5 `reverse 2.000.000 ‖ collect 793.000`, đảo trước: R = 2.000.000, D = 793.000, O = min(1.207.000; B 1.250.000) = 1.207.000. Tiếp #8 thu 792.000: O = min(415.000; 458.000) = 415.000. API khớp cả hai; harness xếp lần thu trước lúc mở chu kỳ | (b) | – |
| 2 | `I5?` 220 / 13; `I6?` 2 / 2 | – | R = Σ đoạn cuối nhật ký; 1.118 nhật ký mới, ΔR = Σ mới, hạn đúng. Giống lượt trước | (b) | – |
| 3 | `I7?` 6 / 4 (FZ-08) và 4 ca nợ cũ có O = 0 (62004 #15/#16, 62023 #10/#15) | 409 ở 6 ca; 201 ở 4 ca | 6 ca chặt hơn quy tắc (nợ cũ). 4 ca O = 0 là heuristic của critic: nợ cũ đã trả hết thì 201 đúng | (a) đã biết / (b) | FZ-08 P3, ngoài G1 |
| 4 | `I9?` 146 / 19 (critic 149, gồm 3 ở org2) | Yêu cầu xóa nợ chờ khi O = 0 | Q23-17a | (a) đã biết | Ngoài G1 |
| 5 | **Thứ tự "mới nhất trước"** – 2 ca: 64062 #17, 60030 #57 | Cắt theo **thời điểm tạo** (`requestedAt`). Ở 64062 #17, yêu cầu 50.000 MGR duyệt (tạo sau) bị cắt cùng yêu cầu 900.000 OWN vừa duyệt, dù giữ 50.000 vẫn nằm gọn trong tiền dư 425.000 | 13.4 chỉ ghi "mới nhất trước". Theo thời điểm tạo: 96/96 bước tuần tự đúng thứ tự và cắt tối thiểu. Theo thời điểm duyệt thì 2 ca cắt thừa. Không mất tiền, chỉ thêm một lần duyệt lại | (c) | Minor – ARC ghi rõ khóa sắp xếp |
| 6 | **Bản thay nguồn `other` không giữ ghi chú, người xin.** Có yêu cầu đã duyệt bị thay: 19/30 bản thay ghi chú `null`, 11/30 người xin = người thao tác. Chỉ yêu cầu chờ: 150/367 và 124/367. Đã có y hệt ở `fzfinal3`, chỉ yêu cầu chờ: 151/354 và 122/354. Nguồn `a32` giữ đủ (784/789) | Gộp nhiều yêu cầu `other` thành một, người xin = người bấm, ghi chú trống | 13.3 điểm 2 và 13.4 điểm 1 ghi "giữ … ghi chú, người xin". `originActorIds` vẫn là hợp đủ (0 thiếu) và cấp duyệt không hạ (0/1.204) | (c), có từ trước 014 | Minor – ARC chốt luật gộp |
| 6b | Hệ quả của dòng 6 lên tách nhiệm: 9 lần duyệt mà người duyệt là người xin của một yêu cầu tổ tiên cùng nguồn. 7 lần là OWN; 2 lần là MGR (64023 #36 MGR2, 64029 #41 MGR) | 200 | Trên chính yêu cầu được duyệt: 0 vi phạm SEC (ii). Tiền là khách trả dư qua QR, không phải tiền A32: người làm A32 vẫn nằm trong `originActorIds` và bị chặn | (c) | Minor, gộp với dòng 6 |
| 7 | **Bản thay đổi nguồn:** 10 yêu cầu `other` đã duyệt bị thay chỉ bằng một yêu cầu `a32` (61015 #30, 61044 #10, 64023 #41, 64024 #23…). Tổng cộng 18 bản thay khác nguồn | Gộp vào yêu cầu `a32`; người xin = người làm A32; cấp `owner`/`manager` ≥ cấp cũ | Chặt hơn, không lách: cấp không hạ, origin đủ. Nhưng tiền khách trả dư mang nhãn A32 | (c) | Minor, gộp với dòng 6 |
| 8 | Độ phủ 13.4 | – | Chỉ 18 lần chi thành công (lượt trước 34), cả 18 ở FZ-13. 0 lần OWN chi hay đặt nơi nhận sau A32 (vế "OWN không bị chặn" chỉ có test của SEC). 403 `SELF_REFUND_FORBIDDEN` chỉ thử với `mgr`, chưa với `mgr2` sau A32 của chính `mgr2`. Lớp chặn ở bước duyệt (13.3 điểm 5) vẫn chưa được kích | (b) độ phủ | Minor |
| 9 | 37 lần A32 `lower` dưới OWN làm tăng tiền dư mà **không** có hàng `folio_settled_reduction` | 201, có yêu cầu `a32` khi phù hợp | 37/37 chỉ hạ dòng về **không thấp hơn** số đã ghi lúc đầu, tức hoàn tác một lần `raise` trước đó. Không có tiền miễn mới nên không phải người làm A32 | (b) critic | – |
| 10 | 4 lần 403 `SELF_APPROVAL_FORBIDDEN` mà người duyệt không là người xin, không thuộc origin, không làm A32 (64006 #22, 64055 #5, 64081 #13, 64087 #12) | 403 | Người duyệt là **người đặt nơi nhận** (SEC-37, `rbac-matrix` mục 39). Đúng | (b) critic | – |
| 11 | 187 bản ghi `postedAt` của dòng FOC chưa ghi sổ đổi (93 / 54 / 40) | – | Như lượt trước (dòng 6 cũ). Không vào B | (c) | Minor (giữ) |
| 12 | 3 dòng lịch J15 (60162 #58, 61019 #39, 61084 #19) | `closed_with_debt` | Thứ tự ghi log | (b) | Minor (giữ) |
| 13 | FZ-07, 16 bước đua A32 ‖ … trên folio `closed` | 412 | 409 `FOLIO_LOCKED`; chỉ sai mã | (a) đã biết, 0 hàng tiền | Minor (giữ) |
| 14 | FZ-10 63029, FZ-11 63026 | MGR tự áp xóa nợ | Σ theo `appliedCapVnd` > cơ sở; Σ FOC sống ≤ cơ sở | (c) | Minor (giữ) |
| 15 | FZ-01 60139 #33 (A32 ‖ hủy yêu cầu); FZ-02 61053 #21 (`SEC-i-source`); 7 bước I17 FZ-02 đua A32 ‖ `late`; 195 `I17-strict`; 115 `I14-orphan` | – | Như dòng 8–12 bảng 4 lượt trước. 194/194 `I17-strict` là bản thay giữ cấp `owner`. Tính lại trên yêu cầu còn sống: 0 vi phạm I17. Đếm theo thao tác con: 0 hàng thừa | (b) | – |

**Đã hết so với lượt trước:**

- M-2: 0 trạng thái I24; 0 lần tiền mới bị nuốt; 0 lần chi theo duyệt cũ.
- Dòng 4 cũ: đổi nơi nhận đưa yêu cầu về `pending` vượt dư. Lượt này 0 trạng thái "chờ > tiền dư còn trống" (trước: 22).
- 429 bản ghi `UH-over` của lượt trước: nay 0.

## 5. Blocker / Major

**Không có.**

Không bất đồng nào thuộc loại (a) chưa giải thích. Ba lỗi (a) còn lại đều đã biết:

- FZ-08: P3, ngoài G1;
- I9: R3-Q23, ngoài G1;
- mã 412: Minor.

## 6. Phán quyết BUG-R3-014 – **ĐÓNG ĐƯỢC**

### Vế 1 – bất biến K11-06 (13.4 điểm 1)

| Kiểm | Kết quả |
|---|---|
| Σ chờ + đã duyệt còn tiền ≤ tiền dư | **0 vi phạm / 26.105 bản ghi `open`/`settled`** (24.162 tuần tự, 2.344 sau bước đua, 1.122 folio `open`). Folio `closed`: 2.145 bản ghi, 0 tiền dư, 0 yêu cầu mở |
| I24: tiền dư 0 mà còn duyệt treo | 0 (trước: 7 lần, 10 yêu cầu) |
| I24b: tiền mới vào khi còn duyệt treo | 0 (trước: 4) |
| Đóng yêu cầu **đã duyệt** | 123 yêu cầu, gồm 78 yêu cầu khi tiền dư còn > 0 (cắt phần vượt, mới có từ 13.4) và 45 yêu cầu khi tiền dư = 0. Do `late`, `reverse`, A32 `raise` (tuần tự) và các bước đua, kể cả đua với chi hoàn |
| Thứ tự "mới nhất trước" | 96/96 bước tuần tự theo thời điểm tạo. Xem bảng 4 dòng 5 cho cách hiểu theo thời điểm duyệt |
| Cắt tối thiểu | 96/96 |
| Xin lại đúng phần còn lại | 61/61 bước tuần tự còn tiền dư: Σ mở sau bước = tiền dư |
| Bản thay | Cấp: 0 lần thấp hơn trên 1.204 bản thay, xét mọi nguồn bị thay. Riêng bản thay của yêu cầu đã duyệt: `manager → manager` 39, `manager → owner` 5, `owner → owner` 24. `originActorIds` ⊇ hợp các yêu cầu bị thay: 0 thiếu. Ghi chú và người xin của nguồn `other`: bảng 4 dòng 6 |
| A32 giảm không bị duyệt cũ hút | 786 lần A32 tuần tự làm tăng tiền dư. 0 lần Σ mở trước bước > tiền dư. 0 lần phần còn lại của yêu cầu đã duyệt tăng. 0 lần `unhandledCreditVnd` tăng. Phần tăng thành yêu cầu mới: 537 lần A32 dưới OWN → yêu cầu `a32` (291 `manager`, 246 `owner`); 201 lần A32 của OWN → yêu cầu `other` (đúng BR-433 (e)); 37 ca không có hàng xem bảng 4 dòng 9 |
| Phủ của mỗi lần chi | 18/18 lần chi (Σ 12.639.000) có yêu cầu nằm gọn trong tiền dư ở **mọi** bản ghi từ lúc duyệt tới lúc chi. 5 lần chi sau một A32 dưới OWN (64013 #21, 64038 #31, 64044 #28, 64057 #9, 64094 #18), đọc tay cả 5: yêu cầu đã duyệt nằm gọn trong tiền dư trước A32; phần A32 thành yêu cầu `a32` riêng, đa số cấp `owner`; người chi không phải người làm A32 |
| Chi: kẹp, người chi | 0 vượt số duyệt còn lại; 0 vượt tiền dư; 0 làm folio thành nợ; `refundedVnd` = Σ phiếu. Thử chi tuần tự: 17 lần trong kẹp → 201; 4 → 403 `SELF_REFUND_FORBIDDEN` (đúng người); 3 → 409 `REFUND_SOURCE_NOT_RECONCILED`; 1 ngoài kẹp → 422; **0 lần trong kẹp bị 422**. Người chi: tiền mặt (lễ tân trưởng 9, MGR 2), chuyển khoản (MGR 7); 0 vi phạm luật người chi. Hai chuỗi dò `refundPay`: đạt |

### Vế 2 – `SELF_REFUND_FORBIDDEN` (13.4 điểm 2)

| Kiểm | Kết quả |
|---|---|
| Chi bởi người làm A32 dưới OWN, sau lần A32 đầu của người đó trên folio | **0 / 18** phiếu hoàn |
| Đặt nơi nhận bởi người làm A32 dưới OWN | **0 / 577** lần đặt. Người đặt: FD 516, MGR 61; cả 61 lần của MGR đều trên folio mà MGR chưa làm A32 |
| 403 trả đúng người | 63/63: 59 lần đặt nơi nhận, 4 lần chi, đều do `mgr` sau A32 của chính `mgr` trên folio. Phạm vi gồm cả yêu cầu nguồn `other`, ví dụ 64003 #11, 64026 #55 |
| 403 sai người | **0**. 17 lần chi thành công, 2 lần chi ở chuỗi dò `refundPay`, và 61 lần MGR đặt nơi nhận đều của người chưa làm A32 trên folio đó; không lần nào bị chặn |
| 403 không để lại hàng | 0 phiếu, 0 nơi nhận mới ở các bước 403 |
| Duyệt bởi người làm A32 | 0 / 306 lần duyệt (SEC (ii) và ADD3) |

### Bảy chuỗi M-2 cũ (`m2chains4.py`)

| Chuỗi | Diễn biến lượt này |
|---|---|
| 60023 | #40 `late +834.000`: duyệt `a32` 916.000 bị cắt, thay bằng `a32` 229.000 `owner`. Không trạng thái treo |
| 64023 | #41 `late +834.000`: cắt cả `other` 1.815.000 và `a32` 300.000, thay bằng `a32` 1.281.000 `owner`. Lượt trước, chỗ này để treo 534.000 rồi chi tiền mới ở #50. #42/#43: MGR (đã làm A32 ở #34) đặt nơi nhận → 403. #45: QR 900.000 thành yêu cầu `other` `owner` riêng, không bị nuốt |
| 64026 | #25 cắt phần vượt khi tiền dư > 0; #38 tiền dư về 0 thì đóng duyệt `other` 900.000; #50/#51/#55: MGR → 403 |
| 64029 | #31, #46 cắt phần vượt (tiền dư > 0); #53 đóng phần còn lại khi tiền dư = 0 |
| 64034 | #9, #26 cắt phần vượt, thay giữ cấp |
| 64053 | #17 cắt phần vượt; không còn lần chi theo duyệt cũ. #54: MGR (đã làm A32 ở #31) đặt nơi nhận → 403 |
| 64062 | #17 cắt hai duyệt, xin lại 425.000 (bảng 4 dòng 5); #30 chi 425.000 theo duyệt mới |

0 vi phạm K11-06 trên cả 7 chuỗi.

Kết luận: **FB-R3-ARC-BUG014-01/02 đã được xác nhận bằng fuzz. BUG-R3-014 chuyển Closed được, mức P1 như SEC chốt.**

## 7. Phán xử cảnh báo của harness

**Toàn bộ là `?`, không có vi phạm cứng.**

| Lớp | Số bản ghi / chuỗi | Phán xử |
|---|---|---|
| `I3?` | 37 / 6 | **(b) toàn bộ** (bảng 4 dòng 1). 62030 thuộc FZ-08 |
| `I5?` | 220 / 13 | **(b)**. R đúng ở mọi bản ghi |
| `I6?` | 2 / 2 (62000, 62023) | **(b)**. Bộ kiểm hạn của critic: 0 lệch |
| `I7?` | 6 / 4 (FZ-08) | Khớp 6/6 với critic. Nợ cũ, chặt hơn quy tắc. **P3, ngoài G1**. Ngoài FZ-08: chấm theo W của chính API, 1.609 lần A32 giảm tuần tự trong cửa sổ (112 lần ngay sau một bước đua), **0 lệch** |
| `I9?` | 146 / 19 | R3-Q23 chưa gộp, **ngoài G1**. Khớp 146/146 |

**Claim "0 vi phạm cứng" của harness: đúng.** Critic tính lại cũng ra 0, kể cả bất biến 13.4 mà harness có cờ `FUZZ_K1106`.

## 8. Các kiểm đạt, 0 vi phạm (710 chuỗi + org2)

| Kiểm | Kết quả |
|---|---|
| B, I15 | 0 lệch / 29.790 bản ghi, hai cách cộng, gồm 18 phiếu hoàn. `rawCredit` = `creditVnd` ở mọi bản ghi. 0 hàng tiền bị xóa hay sửa số. Cột bất biến của yêu cầu hoàn không đổi. `refundedVnd` chỉ tăng. 84 lần `approved → pending`, đều ở bước đặt nơi nhận; 0 lần trên yêu cầu đã chi dở |
| O, W, I1, I2 | 0 lệch: 15.286 bản ghi có chu kỳ, 340 nợ cũ, 441 nợ cũ đã chuyển, 2.461 hết cửa sổ |
| I4, SEC (iii) | Folio `closed` (2.162 bản ghi): 0 tiền dư, 0 yêu cầu mở. 1.888/1.888 lần thu do người bấm không để lại dư chưa xử lý. 2.718 lần A32: 1 ngoại lệ (b) (bảng 4 dòng 15). 237/237 bản ghi hết cửa sổ còn dư có "Cần chú ý" |
| I5, I6 | 1.118 nhật ký mới: số > 0, ΔR = Σ mới, hạn đúng |
| I11 | 0 dòng hay yêu cầu hoàn mới trên folio `closed`. A32 trên `closed`: 372 lần 409, 16 lần 412 |
| I8, I16 | 638 yêu cầu xóa nợ: định tuyến đúng, người duyệt ≥ `manager`, `limitBasisVnd` ≤ cơ sở. 2 ca (c) |
| I17, I18 | 1.483 yêu cầu `a32` mới: người xin ∈ origin, ghi chú "Tự sinh từ A32". 959 yêu cầu `other` trên folio có A32 dưới OWN: 959 `owner`. 955 trên folio không có A32: `manager` |
| SEC (i) | 1.542 lần `superseded`, 1.182 bản thay: 0 mất origin, 0 hạ cấp. 1 cảnh báo (b) |
| SEC (ii) | 306 lần duyệt: 0 do người xin, 0 do người trong origin, 0 do người làm A32 trước lúc duyệt, 0 dưới `manager`, 0 yêu cầu `owner` do người không phải OWN duyệt, 0 do người đặt nơi nhận (trừ OWN). 121/121 lần 403 `SELF_APPROVAL_FORBIDDEN` có lý do |
| BUG-R3-012 (hồi quy) | 1.002/1.002 lần J15 dạng thao tác ra đúng quyết định (991 `skipped`, 9 `waiting_refund`, 2 `closed_with_debt`). 186 `waiting_refund` theo lịch: đều có tiền dư và yêu cầu mở. 7 trạng thái "J15 chưa chạy lại" (60070, 61048) giống hệt lượt trước |
| BUG-R3-013 (hồi quy) | 0 lần chờ vượt tiền dư sau 1.449 bước tuần tự làm giảm tiền dư (`late` 717, `reverse` 420, A32 290, chi 17, `charge` 5). 0/306 lần duyệt vượt tiền dư còn trống (265 tuần tự, 41 đua) |
| ESC-026 / I13 | 1.297 lần áp dưới OWN; 520 lần vượt ngưỡng → 520 lần báo, đúng 1 mục "Cần chú ý"; 0 lần báo khi không vượt |
| I14 | 0 hàng thừa, đếm theo thao tác con |
| Hai tổ chức | `FZ-06` so với `FZ-06-org2`: 0 id trùng (1.160/1.167 hàng, 40/40 folio) |

## 9. Đọc tay – 23 chuỗi

- **FZ-13 (12):**
  - 64023 (#0–52, toàn chuỗi), 64026 (#18–59), 64053 (#12–54), 64044 (#0–28), 64013 (#0–21), 64038 (#14–31);
  - 64057, 64094, 64003 (#0–12);
  - 64062 (#16–17, #30), 64006 (#20–22), 64052 (#3–8).
- **FZ-01 (4):** 60023 (#38–50), 60026 (#33), 60030 (#55–57), 60162 (#54–59).
- **FZ-02 (2):** 61015 (#20–31), 61053 (#18–22).
- **Họ khác (5):** FZ-06 61019 (#34–40), FZ-07 62003 (#0–14), FZ-09 62047 (#0–10), FZ-10 63027 (#0–12), FZ-11 63018 (#0–8). Thêm FZ-12 63009 (#0–10) để xem nhánh folio `open`.

Gồm mọi chuỗi M-2 cũ, mọi lần chi sau A32, các ca 403, chuỗi `I3?` mới (64052) và mẫu mỗi họ.

**Ví dụ tính tay, FZ-13 64013:**

| Bước | Thao tác | Kết quả |
|---|---|---|
| #12 | MGR duyệt `other` 900.000 | Tiền dư 900.000 |
| #16 | MGR A32 void 911.000 | Tiền dư 1.821.000. Sinh yêu cầu `a32` 911.000 `owner`. Duyệt cũ không đổi: 910.000 ≤ tiền dư trước A32 |
| #19, #20 | `late +300.000`, `late +70.000` | Tiền dư 1.501.000. Chỉ yêu cầu `a32` chờ bị thu lại còn 591.000. Duyệt 900.000 và 10.000 vẫn nằm gọn |
| #21 | MGR2 (không làm A32) chi chuyển khoản 900.000 | 201. Tiền dư 601.000 = 10.000 + 591.000: đúng bằng Σ mở |

Khớp API ở mọi bước.

## 10. Kết luận dạng chuẩn

**Lệch tiền theo oracle: 0** (B, O, W, R, hạn; 0/28.250 bản ghi chính).

**Blocker 0, Major 0.**

**BUG-R3-014: đóng được.** Cả hai vế 13.4 đạt trên toàn bộ 710 chuỗi.

Minor mới, không chặn G1:

| Bảng 4 dòng | Nội dung | Ai làm |
|---|---|---|
| 5 | Khóa sắp xếp "mới nhất trước" | ARC ghi rõ |
| 6, 6b, 7 | Luật gộp bản thay nguồn `other`: ghi chú, người xin, đổi nguồn. Có từ trước 014 | ARC chốt; DOM/SEC xem tách nhiệm |
| 8 | Độ phủ | QA thêm ca: OWN chi/đặt nơi nhận sau A32; `mgr2` tự làm A32 rồi chi; kích lớp chặn 13.3 điểm 5 |

Minor giữ từ lượt trước: bảng 4 dòng 11–14.

**G1 ĐẠT "0 lệch tiền, 0 Major".** FZ-08 và I9 giữ ngoài G1 như đề bài.
