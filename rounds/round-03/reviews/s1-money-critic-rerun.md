# Critic độc lập – lượt fuzz tiền CHẠY LẠI sau bản sửa BUG-R3-012/013 (R3-Q30, cổng G1)

- Vai: critic độc lập. Không viết harness, không mở `product/services/api/test/fuzz/`, không chạy mã sản phẩm, không đụng git. Chỉ **đọc** mã sản phẩm ở một chỗ để xác nhận nguyên nhân (ghi rõ dòng).
- Round 3 – Sprint 1, bước **Kiểm thử**. Ngày 24/10/2026.
- Mã được thử: `origin/main` `f2ba2ac` (BE-B BUG-R3-012/013 + follow-ups `69a5398`), cờ `FUZZ=1 FUZZ_BE83=1 FUZZ_FZ02=1 FUZZ_K1106=1 FUZZ_ADD3=1`.
- Dữ liệu: toàn bộ là dữ liệu giả.

## 1. Kết luận

**G1 CHƯA ĐẠT.** **0 lệch tiền** theo oracle (B, O, W, R, hạn, sổ cân), **nhưng còn 1 Major**.

- **BUG-R3-012 (B-1): đóng được.** 0/195 lần J15 `waiting_refund` khi tiền dư = 0 (trước: 40 lần / 5 chuỗi). 0 folio kẹt `settled` với tiền dư 0 sau khi J15 chạy quá cửa sổ. Năm chuỗi gây lỗi trước đây (60070, 60164, 61019, 61084, 61092) nay đều `closed_with_debt`, R = B.
- **BUG-R3-013 (M-1): đóng được phần đã báo.** Sau 1.459 bước tuần tự làm giảm tiền dư (`late` 714, `reverse` 419, A32 291, `refundPay` 30, `charge` 5), **0** lần yêu cầu chờ vượt tiền dư còn trống. **0/297** lần duyệt hoàn vượt tiền dư còn trống (trước: 12).
- **Major mới – M-2 (= claim I24 của QA, xác nhận đúng).** Đường **chi hoàn** (`RefundsService.payOut`) không chạy quy tắc K11-06 chung của hợp đồng 13.3. Hệ quả:
  - Chi hoàn đưa tiền dư về 0, nhưng yêu cầu đã duyệt còn tiền **vẫn `approved`**. Theo 13.3 điểm 1 + 3, các yêu cầu này phải đóng `superseded`.
  - Quy mô: **7 lần, 10 yêu cầu, Σ còn treo 4.827.000**.
  - Khi tiền mới vào sau đó, các duyệt cũ "nuốt" tiền mới (4 lần). Tiền mới được chi theo **duyệt cũ cấp `manager`** (2 lần, Σ **1.174.000**). Trong khi đó, theo ADD3, mọi yêu cầu hoàn mới trên các folio đó phải lên **OWN**.
  - **Loại (a).** Đề xuất **P1 (Major)**: lách kiểm soát duyệt tiền ra. Sổ không lệch đồng nào, và tiền đã chi đúng là tiền khách trả dư. **Nâng P0** nếu SEC tái hiện được biến thể tiền miễn A32 (mục 5).
- **Claim của harness "0 vi phạm cứng" đúng với bộ bất biến I1–I15 của harness.** Critic tính lại từ hàng DB và cũng ra 0. Nhưng harness **không có** bất biến cho 13.3 điểm 3, nên không bắt được M-2.

## 2. Phạm vi

**Log gốc:** `scratchpad/fzfinal3/run-g1 … run-g6`.

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
  - **FZ-13: 100 (mới)**
- Thêm 40 chuỗi `FZ-06-org2` (1.540 bản ghi) để kiểm hai tổ chức. Tổng: 750 chuỗi, 29.790 bản ghi.
- Dòng `{"scheduler":"J15"}`: 209. Ghi chú "interleave fallback": 1.008.
- Tệp `*-warnings.json`: 37.
- `refundPay-cash/transfer.jsonl`: 2 chuỗi dò có hướng, chép giống nhau ở run-g1…g5. Kiểm riêng (mục 9), đạt.

**Chuẩn đối chiếu:**

- DOM `s1-money-oracle.md`: mục 1, 5.4, 5.5, 5.6, 8 (I1–I15), I16, I17.
- BR-427 (d), BR-433, BR-522, BR-525.
- ARC `s1-contracts.md` 13.2 và **13.3** (bổ sung 6).
- Các review: `s1-ARC-on-bug-012-013.md`, `s1-SEC-on-bug-012-013.md` ("Ca thêm cho fuzz" 1–3), `s1-ARC-on-add3.md`, `s1-SEC-on-add3.md`.
- So sánh: critic cuối `s1-money-critic-final.md` (cùng hạt giống FZ-01…12).

**Không tính vào G1:** họ FZ-08 (nợ trước 0076, P3) và I9 (R3-Q23 chưa gộp).

**Script:** thư mục `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/critic/`.

- Script mới, critic viết, không dùng mã harness:
  - `loadf3.py`, `critic3.py`: bộ kiểm chính của lượt trước (`critic2.py`), sửa cho hàng hoàn đã chi;
  - `critic3x.py`: B-1, M-1, SEC (i)(ii)(iii), đường chi hoàn, I24;
  - `recheck3.py`, `uhover3.py`, `j15chk3.py`, `i7race3.py`, `stale3.py`, `orgs3.py`, `dumpf3.py`, `compact3.py`.
- Kết quả thô: `findings_rerun.json`, `findings_rerun_x.json`.

## 3. Phương pháp

Như critic cuối (mục 3.1–3.2 của bản đó). Chỉ dùng `raw`, `code`, `outcomes`, `now`. Trường `ref`/`violations` của harness chỉ dùng để đối chiếu ở mục 8.

Thay đổi so với lượt trước:

- **B** = Σ dòng `posted` − Σ phiếu `succeeded`/`reversed`. Phiếu chi hoàn (`type = refund`, số âm, `succeeded`) tự đi vào vế "+ Σ hoàn đã chi". Kiểm chéo I15 bằng cách thứ hai: phí sống − FOC sống − thu sống, cũng gồm phiếu hoàn.
- **Tiền hoàn đang mở** = Σ yêu cầu `pending` + Σ (`amountVnd − refundedVnd`) của yêu cầu `approved`. **Tiền dư còn trống** = `creditVnd` − phần còn lại của các yêu cầu đã duyệt khác (13.3 điểm 5).
- **I15, yêu cầu hoàn** – các chuyển trạng thái được phép:
  - `approved → cancelled/superseded` (13.3 điểm 3);
  - `approved → pending` khi đặt lại nơi nhận (thiết kế "đổi nơi nhận thì duyệt lại");
  - `refundedVnd` chỉ tăng.
- **I7** chấm theo **W của chính API** ngay trước bước: W = max(0, B) − `openDebtVnd` (ARC BUG012-02 (b)).
- **I17** định tuyến tính trên các yêu cầu `a32` **còn sống** sau bước (bỏ yêu cầu vừa bị thay trong cùng bước). Yêu cầu thay thế được giữ cấp cao nhất của yêu cầu bị thay (FB-1213-01).
- **I14 (hàng thừa)** đếm theo số thao tác con có mặt trong bước, gồm cả chi hoàn và các bước đua "fallback" không ghi kết quả.

**Kiểm mới:**

| Mã | Cách kiểm |
|---|---|
| B-1 | Mỗi lần J15 chạy (1.002 bước thao tác + 209 dòng lịch): quyết định khớp 13.3 điểm 4, tính trên trạng thái trước lần chạy. `waiting_refund` ⇒ tiền dư > 0 và có yêu cầu mở. Quá cửa sổ, tiền dư 0 ⇒ `closed`/`closed_with_debt`. Không folio `settled` với tiền dư 0 sau khi J15 chạy quá cửa sổ. |
| M-1 | Sau mỗi bước tuần tự làm **giảm** tiền dư trên folio `settled`: Σ chờ ≤ tiền dư còn trống (điểm 2). Tiền dư = 0 ⇒ không yêu cầu đã duyệt nào còn tiền (điểm 3, kiểm I24). Lúc duyệt: số duyệt ≤ tiền dư còn trống (điểm 5). |
| SEC (i) / I19 | Mỗi bước có yêu cầu bị `superseded` và có yêu cầu mới: `originActorIds` của bản thay ⊇ hợp origin của các yêu cầu bị thay. Có yêu cầu `a32` bị thay ⇒ có bản thay `a32`. Cấp duyệt của bản thay ≥ cấp cao nhất của yêu cầu cùng nguồn bị thay. |
| SEC (ii) / I20 | **Mọi lần duyệt** (mỗi cặp id + `decidedAt`), kể cả bản do J15 tạo và yêu cầu sau đó bị `superseded`: người duyệt ≠ người xin, ∉ `originActorIds`, không phải người dưới OWN đã làm A32 trên folio trước lúc duyệt, vai ≥ `manager`, yêu cầu định tuyến `owner` thì OWN duyệt. |
| SEC (iii) | Folio `closed` ⇒ tiền dư 0 và không còn yêu cầu `pending`/`approved` còn tiền. |
| Chi hoàn | Với mỗi phiếu `type = refund` mới: số chi ≤ min(duyệt − đã chi, tiền dư trước bước); bước tuần tự không làm B > 0; `refundedVnd` = Σ phiếu hoàn của yêu cầu ≤ số duyệt; yêu cầu phải `approved` trước bước. Chi tiền mặt: người chi ≠ người xin. Chi chuyển khoản: người chi ∉ {người xin, người duyệt, người đặt nơi nhận}, trừ OWN. Vai lấy từ `recordedByRole` trong body. Bước chi tuần tự có số ≤ min(còn lại, tiền dư) mà bị 422 `REFUND_EXCEEDS_APPROVED` ⇒ lỗi. |

## 4. Bảng lệch

Phân loại: (a) lỗi tiền sản phẩm, (b) lỗi harness hoặc tham chiếu, (c) oracle hoặc hợp đồng mơ hồ.

| # | Chuỗi, bước | API | Critic | Loại | Mức |
|---|---|---|---|---|---|
| 1 | Chi hoàn đưa tiền dư về 0, 7 lần: FZ-01 60023 #41; FZ-13 64023 #42, 64026 #29, 64029 #36, 64034 #10, 64062 #29; 64053 #27 (đua với `advance`, tức thực chất tuần tự) | 10 yêu cầu `approved` còn tổng 4.827.000 vẫn `approved` khi `creditVnd` = 0 | 13.3 điểm 1 + 3: đóng `cancelled`/`superseded`, có nhật ký, xóa nơi nhận | **(a)** | **Major P1 (M-2)** |
| 2 | Tiền mới vào khi còn duyệt cũ treo, 4 lần: 64023 #45 (QR 900.000 → yêu cầu mới 66.000); 64026 #35 (900.000 → 800.000); 64034 #11 (50.000 → **không** có yêu cầu); 64053 #28 (900.000 → 260.000) | Phần bằng số còn lại của duyệt cũ không sinh yêu cầu mới | Duyệt cũ đã phải đóng, nên toàn bộ tiền mới phải thành yêu cầu mới, định tuyến theo ADD3 (`owner` trên folio có A32 dưới OWN) | (a) | thuộc M-2 |
| 3 | Chi tiền mới theo duyệt cũ, 2 lần: 64023 #50 (534.000 tiền mặt, lễ tân trưởng chi, duyệt `manager` cũ); 64053 #54 (640.000 chuyển khoản; người chi = MGR **đã làm A32** trên folio) | 201 | Theo ADD3, tiền này phải đi yêu cầu mới cấp `owner` (người làm A32 không được duyệt) | (a) | thuộc M-2 |
| 4 | Đặt nơi nhận trên yêu cầu **đã duyệt** khi tiền dư < số duyệt: 22 bản ghi / 8 chuỗi (60176 #22, 60182 #17, 64006 #17, 64029 #50/#52, 64039 #25, 64049 #37, 64074 #16/#18, 64075 #6) | Yêu cầu về `pending` với số > tiền dư còn trống, không lập lại kế hoạch | 13.3 điểm 2 chỉ nói "thay đổi làm giảm tiền dư". Đổi nơi nhận không làm giảm tiền dư, nhưng biến yêu cầu `approved` (được giữ khi dư > 0) thành `pending` vượt dư. Lớp chặn ở bước duyệt (điểm 5) sẽ bắt. Thực tế 0 lần duyệt vượt; trạng thái tự hết ở thao tác giảm tiền dư kế tiếp (ví dụ 64039 #28) | (c) | Minor |
| 5 | Lớp chặn ở bước duyệt (13.3 điểm 5) | 0 lần 409 `superseded` khi duyệt | Fuzz chưa từng kích lớp chặn này | (b) độ phủ | Minor |
| 6 | 187 bản ghi / 96 chuỗi | `postedAt` của dòng FOC **chưa ghi sổ** đổi: `pending_approval → posted` 93, `pending_approval → rejected` 54, **`rejected → rejected`** 40, lúc OWN duyệt một khoản xóa nợ khác | BR-008 chỉ khóa dòng đã ghi sổ; dòng này không vào B, O tính lại vẫn khớp. Ở `fzfinal2`: 0 lần | (c), hỏi BE-B: đây là cột `updated` hay lỗi | Minor |
| 7 | 3 dòng lịch J15: 60162 #58, 61019 #39, 61084 #19 | `closed_with_debt` khi bản ghi trước còn tiền dư | Dòng lịch được ghi trước bản ghi, nhưng J15 chạy **sau** thao tác của bước đó (đảo khoản thu đưa B > 0). Quyết định đúng theo điểm 4 | (b) thứ tự ghi log | Minor |
| 8 | FZ-02 61053 #21: đua QR ‖ `late` | Yêu cầu `a32` 8.000 bị `superseded`, yêu cầu mới là `other` 273.000 | Thứ tự thật là `late` trước: tiền dư về 0 nên yêu cầu `a32` đóng; QR sau tạo yêu cầu `other`, `owner`, origin đủ hai người làm A32. Không phải bản thay, không lách | (b) heuristic của critic | – |
| 9 | 7 bước đua A32 ‖ `late` (FZ-02 61044, 61047, 61048, 61052, 61078, 61086; FZ-13 64094) | `a32` `manager` | Bộ đếm cũ cộng cả yêu cầu vừa bị thay. Tính trên yêu cầu còn sống thì Σ ≤ cơ sở | (b) critic | – |
| 10 | 167 yêu cầu `a32` `owner` với Σ ≤ cơ sở | `owner` | Cả 166/166 yêu cầu mới thuộc loại này đều là bản thay của một yêu cầu `owner`: FB-1213-01 "không hạ cấp", đúng | (b) | – |
| 11 | 132 cảnh báo "hàng thừa" ở lượt đầu | – | Phiếu chi hoàn bị đếm như khoản thu, và bước "fallback" không có kết quả. Đếm theo thao tác con có mặt: **0** hàng thừa | (b) critic | – |
| 12 | FZ-01 60139 #33, FZ-02 61082 #17 (A32 ‖ hủy yêu cầu hoàn) | `unhandledCreditVnd` tăng | Phần tăng do hủy yêu cầu hoàn, không do A32. Giống lượt trước | (b) | – |
| 13 | FZ-07, 16 bước đua A32 ‖ thu/đảo/xóa nợ trên folio `closed` | 412 `VERSION_CONFLICT` | 409 `FOLIO_LOCKED` | (a), chỉ sai mã, 0 hàng tiền. Đã có từ trước | Minor |
| 14 | FZ-10 63029, FZ-11 63026 | MGR tự áp xóa nợ | Σ theo `appliedCapVnd` > cơ sở; Σ theo FOC sống ≤ cơ sở | (c), giống lượt trước | Minor |
| 15 | FZ-08 62019 #1, 62032 #18, 62034 #4, 62039 #10/#12/#14 | 409 | Nợ cũ, O > 0, phần giảm ≤ W ⇒ 201 | (a), chặt hơn quy tắc. **FZ-08: P3, không tính G1** | – |
| 16 | 149 bản ghi (146 ngoài org2) / 19 chuỗi (I9) | Yêu cầu xóa nợ chờ khi O = 0 | Q23-17a | (a) đã biết, R3-Q23 chưa gộp. **Không tính G1.** Khớp 146/146 với harness | – |
| 17 | Đường chi hoàn: 34 lần chi thành công, chỉ ở FZ-13 (32) và FZ-01 (2) | – | Chưa phủ `original_method` và chi nhiều lần trên cùng một yêu cầu ở họ khác | (b) độ phủ | Minor |

## 5. Blocker / Major

**Không có Blocker.**

### M-2 – chi hoàn không lập lại kế hoạch hoàn (13.3 điểm 1 + 3)

Loại (a). Đề xuất **Major P1**. Không phải lệch sổ: B, O và mọi giới hạn chi đều đúng. Đây là lách kiểm soát duyệt tiền ra.

**Mã gây ra** (chỉ đọc):

- `product/services/api/src/modules/payments/internal/refunds.service.ts`, hàm `payOut` (dòng 447 trở đi):
  - kẹp chi `min(left, rawCreditVnd)` ở dòng ~515;
  - sau `INSERT` phiếu hoàn chỉ gọi `this.folios.touch` (dòng ~597) và `approvals.addRefunded`;
  - **không** gọi `afterSettledMoneyChange`, `replanSettledRefunds` hay `refundsDownToCredit`.
- Ngược lại, `payments.service.ts` dòng 308 và 609, `folio-lines.service.ts` dòng 357, 384, 751 đều gọi.
- Hợp đồng 13.3 điểm 1 ghi rõ đường "hoàn tiền" phải gắn quy tắc này.

**Đọc tay FZ-13 64023:**

| Bước | Thao tác | Kết quả |
|---|---|---|
| #31 | `late` +140.000 | Yêu cầu `other` 1.815.000 (`manager`), người xin FD |
| #34 | MGR (`…5d81`) A32 void 300.000 | Folio có A32 dưới OWN ⇒ từ đây mọi yêu cầu `other` mới phải lên `owner` |
| #36 | MGR2 duyệt 1.815.000 | Đúng luật: yêu cầu tạo trước A32, MGR2 không phải người làm A32 |
| #37 | OWN duyệt yêu cầu `a32` 300.000 | Đúng luật |
| #41 | `late` +834.000 | Tiền dư 1.281.000 < còn lại 1.815.000. Yêu cầu đã duyệt được giữ (dư > 0), đúng 13.3 |
| #42 | Lễ tân trưởng chi tiền mặt 1.281.000 | Tiền dư **0**. Yêu cầu 1.815.000 còn **534.000**, yêu cầu `a32` 300.000 vẫn **`approved`** ⇒ trái điểm 3 |
| #43 | Chi 534.000 | 422 `max 0`: kẹp đúng |
| #45 | QR về muộn 900.000 | Chỉ sinh yêu cầu mới **66.000** (`owner`, origin = [MGR]), vì 834.000 được coi là "đã có yêu cầu" |
| #47 | QR 300.000 | Yêu cầu 300.000 `owner` |
| #50 | Lễ tân trưởng chi tiền mặt **534.000** theo duyệt `manager` cũ | 201. Tiền dư 1.200.000 → 666.000 |

Tiền chi ở #50 hoàn toàn là tiền **mới** (tiền dư ở #43 = 0). Nó đi ra theo một lần duyệt cấp `manager` làm cho khoản tiền khác. Nếu điểm 3 chạy, 900.000 + 300.000 đều phải chờ OWN.

**FZ-13 64053, cùng mẫu:**

- #27: chi 225.000 đưa dư về 0; yêu cầu `other` 865.000 (MGR2 duyệt ở #16) còn 640.000.
- #28: QR 900.000 → yêu cầu mới chỉ 260.000.
- #31, #50: MGR `…5d81` làm A32 void 300.000 và hạ 34.000 trên folio.
- #54: **chính MGR `…5d81` chi 640.000** chuyển khoản theo duyệt cũ. Luật người chi cho chuyển khoản vẫn đạt: người chi ≠ người xin, người duyệt, người đặt nơi nhận.

**Quy mô trên 710 chuỗi:**

- 7 lần chuyển vào trạng thái "dư 0 + duyệt còn tiền", 10 yêu cầu (6 `other`, 4 `a32`), Σ còn treo 4.827.000.
- 4 lần tiền mới bị nuốt.
- 2 lần chi tiền mới theo duyệt cũ, Σ 1.174.000.
- Trạng thái kết thúc:
  - 4 chuỗi tự lành ở thao tác giảm tiền dư kế tiếp: 60023 #49 `late`, 64026 #38 `reverse`, 64029 #38, 64034 #12 `late`. Các đường này đã gắn `refundsDownToCredit`, xác nhận bản sửa 013 ở đó chạy đúng.
  - 2 chuỗi đã chi: 64023, 64053.
  - 2 chuỗi còn treo tới cuối: 64023 (`a32` 300.000), 64062.

**Vì sao chưa đề P0, và khi nào nâng:**

- Hai lần chi đều là tiền khách trả dư qua QR, trả cho chính khách. Sổ đúng, B/O đúng, chi ≤ tiền dư.
- Biến thể nguy hiểm **suy ra được từ mã**, chưa thấy trong log:
  1. Đã có duyệt cũ còn L khi dư = 0.
  2. MGR làm A32 giảm d ≤ L. Tiền dư lên d, nhưng `openRefundVnd` = L ≥ d, nên **không sinh yêu cầu `a32` nào**. Yêu cầu đã duyệt được giữ vì dư > 0.
  3. Người khác người xin chi tiền mặt min(L, d), kể cả chính MGR đó.

  Đây là **tiền miễn A32 đi ra mà không qua OWN và không qua người duyệt thứ hai độc lập**, đúng lớp FB-R3-SEC-ADD3-01 (Blocker). 64034 #11 cho thấy bước "nuốt trọn, không sinh yêu cầu" xảy ra thật (QR 50.000, còn treo 100.000).
- Đề nghị SEC viết ca dò có hướng. Tái hiện được thì nâng **P0**.

**Đề xuất sửa (ARC chốt, BE-B làm, SEC review):**

1. `payOut`: sau khi ghi phiếu hoàn, dưới cùng khóa folio, gọi `refundsDownToCredit` (hoặc `afterSettledMoneyChange`). Tiền dư về 0 thì mọi yêu cầu `approved` còn tiền đóng `cancelled`/`superseded`, kể cả chính yêu cầu vừa chi dở. Ghi nhật ký, báo người xin và người duyệt, xóa nơi nhận (SEC-BE-45).
2. Thêm phòng thủ lớp hai ở `payOut` (tùy ARC): khi folio có A32 dưới OWN tạo **sau** `decidedAt` của yêu cầu, hoặc tiền dư đã từng về 0 sau lúc duyệt, thì chặn chi và lập lại kế hoạch.
3. QA:
   - thêm bất biến **I24**: "sau mọi bước, folio `settled` và `creditVnd` = 0 ⇒ không yêu cầu `approved` nào còn tiền";
   - thêm I24b: "tiền vào sau khi dư = 0 không bị duyệt cũ nuốt";
   - ca hồi quy 64023 #31–#50 và 64053 #14–#54;
   - ca dò biến thể A32 ở trên.

## 6. Phán quyết BUG-R3-012 và BUG-R3-013

| Lỗi | Bằng chứng chạy lại | Phán quyết |
|---|---|---|
| **BUG-R3-012** (J15 `waiting_refund` mãi) | 195 lần `waiting_refund` (186 lịch + 9 thao tác): 195/195 có tiền dư > 0 và có yêu cầu mở. 21 lần `closed_with_debt` + 4 lần `closed`, đều đúng điểm 4. 1.002/1.002 lần J15 dạng thao tác ra đúng quyết định critic tính (991 `skipped`, 9 `waiting_refund`, 2 `closed_with_debt`). 0 folio `settled` dư 0 kẹt sau J15 quá cửa sổ. Hai trạng thái nghi ngờ (60070 #40–42, 61048 #46–49) đọc tay đều là "J15 chưa chạy lại": 60070 đóng ở lần chạy theo giờ kế tiếp; 61048 hết chuỗi. Các chuỗi gốc 60164, 61092: `closed_with_debt`, R = B = 197.000 / 20.000 | **Đóng được** |
| **BUG-R3-013** (yêu cầu mở vượt tiền dư không lập lại) | 0 lần sau 1.459 bước tuần tự giảm tiền dư. 68 lần `approved → superseded` ở đường `late`/`reverse`/A32/J15 khi dư về 0 (điểm 3 chạy). 0/297 lần duyệt vượt tiền dư còn trống. Bản thay: 1.056 lần, 0 mất origin, 0 hạ cấp. Còn: đường chi hoàn (M-2) và đường đổi nơi nhận (bảng 4 dòng 4, Minor) | **Đóng được phần đã báo** (M-1: `late`, J15, A32, hủy). 13.3 chưa đạt trọn vì đường chi hoàn → mở lỗi mới cho M-2, liên kết 013. QC có thể chọn mở lại 013 thay vì mở lỗi mới |

## 7. Phán quyết claim I24 của QA

**Đúng cả hai ý.**

- (1) Đúng 6 bước tuần tự QA nêu: 60023 #41, 64023 #42, 64026 #29, 64029 #36, 64034 #10, 64062 #29. Critic tìm thêm **64053 #27**: đua `advance` ‖ chi, tức thực chất tuần tự.
- (2) "Lách duyệt" ở 64023 là thật: #45 sinh yêu cầu 66.000; #50 chi 534.000 tiền mới theo duyệt `other` `manager` cũ.
- Critic tìm thêm một lần cùng loại: 64053 #54, 640.000, người chi là MGR đã làm A32.
- Đây là lách **định tuyến ADD3**, không phải lách luật người chi.
- Loại **(a)**. Đề xuất **P1**, nâng **P0** nếu biến thể tiền miễn A32 tái hiện (mục 5).

## 8. Phán xử cảnh báo của harness

| Lớp | Số bản ghi / chuỗi | Phán xử |
|---|---|---|
| `I3?` | 31 / 5 (61012 ×8, 61046 ×3, 62030 ×9, 64022 ×3, 64063 ×8) | **(b) toàn bộ.** O của critic khớp API ở **mọi** bản ghi. Ví dụ đọc tay 64022 #17: `reverse 600.000 ‖ QR 2.120.000`. API khớp thứ tự đảo trước: O > 0 → nối, R 2.000.000 + 600.000 = 2.600.000. QR làm D = 2.120.000 → O = min(480.000, B 550.000) = 480.000. Harness chọn QR trước. 64063 #34 giống hệt (R 700.000, O 408.000). 62030 thuộc FZ-08. |
| `I5?` | 220 / 13 | **(b) toàn bộ.** R = Σ đoạn cuối nhật ký xếp theo id ở mọi bản ghi; 1.119 nhật ký mới, ΔR = Σ mới. Ví dụ FZ-07 62003 #9: hai lần đảo tuần tự → R 1.416.000, hạn 17/11 = ngày nghiệp vụ 14/11 + 3. |
| `I6?` | 2 / 2 (62000, 62023) | (b). Bộ kiểm hạn của critic: 0 lệch. |
| `I7?` | 6 / 4 (FZ-08) | Khớp 6/6 với critic: nợ cũ, chặt hơn quy tắc. **P3, không tính G1.** Chấm trên **W của chính API**: 1.609 lần A32 giảm tuần tự trong cửa sổ ngoài FZ-08 (112 lần ngay sau một bước đua), **0 lệch**. Hạt giống "FZ-02 1006" ARC chạy là hạt giống cục bộ; 61006 ở lượt này không có mẫu đua `QR ‖ reverse` rồi A32 giảm khi O > 0. Lớp lệch kiểu ARC BUG012-02 đã được phủ bằng 112 ca sau đua. |
| `I9?` | 146 / 19 | R3-Q23 chưa gộp, **không tính G1.** Khớp 146/146. |

**Claim "0 vi phạm cứng":** đúng với I1–I15 + I16/I17 của harness. Critic tính lại cũng ra 0. Claim **không** bao M-2, vì harness không có bất biến 13.3 điểm 3.

## 9. Các kiểm đạt, 0 vi phạm

| Kiểm | Kết quả |
|---|---|
| B, I15 | 0 lệch / 29.790 bản ghi, hai cách cộng, gồm 34 phiếu chi hoàn. 0 hàng tiền bị xóa hay sửa số. Cột yêu cầu hoàn (`amountVnd`, `requestedBy`, `requiredRole`, `originActorIds`, `source`, `reasonNote`) bất biến. `refundedVnd` chỉ tăng. 89 lần `approved → pending` đều ở bước đặt nơi nhận, 0 lần trên yêu cầu đã chi dở. |
| O, W, I1, I2 | 0 lệch (15.286 bản ghi có chu kỳ, 340 nợ cũ, 441 nợ cũ đã chuyển, 2.461 hết cửa sổ). Các đua tại một thời điểm giả đều khớp một thứ tự tuần tự (I14). |
| I4 | Folio `closed` (2.162 bản ghi): 0 tiền dư, 0 yêu cầu mở = **SEC (iii) đạt**. 1.888/1.888 lần thu do người bấm không để lại dư chưa xử lý. 2.717 lần A32: 2 ngoại lệ (b) ở bảng 4 dòng 12. 237/237 bản ghi hết cửa sổ còn dư có "Cần chú ý". `unhandledCreditVnd` tính lại (gồm phần đã chi) khớp ở mọi bản ghi. |
| I5, I6 | 1.119 nhật ký mới: số > 0, ΔR = Σ mới, hạn đúng. |
| I7 | Như mục 8. |
| I11 | 0 dòng hay yêu cầu hoàn mới trên folio `closed`. A32 trên `closed`: 372 lần 409, 16 lần 412 (bảng 4 dòng 13). |
| I8, I16 | 638 yêu cầu xóa nợ: định tuyến và vai duyệt ≥ `manager`; yêu cầu định tuyến `owner` chỉ OWN duyệt; `limitBasisVnd` ≤ cơ sở bảo vệ. 2 ca (c) ở bảng 4 dòng 14. |
| I17 | 1.380 yêu cầu `a32` mới: `requestedBy ∈ originActorIds` và ghi chú "Tự sinh từ A32" đều đạt. Định tuyến trên Σ còn sống: 711 `owner` (Σ > cơ sở hoặc null), 489 `manager` (Σ ≤ cơ sở), 166 `owner` khi Σ ≤ cơ sở đều là bản thay giữ cấp. |
| I18 | 945 yêu cầu `other` trên folio có A32 dưới OWN: 945 `owner`, origin đủ. 908 yêu cầu trên folio không có A32: `manager`. 0 yêu cầu A32 bị người xin hủy tay. |
| **SEC (i) / I19** | 1.453 lần `superseded`, 1.056 bản thay (13 do J15): 0 mất origin, 0 hạ cấp, 0 bản thay đổi nguồn (1 cảnh báo (b) ở bảng 4 dòng 8). |
| **SEC (ii) / I20** | 298 lần duyệt (gồm duyệt mà sau đó bị `superseded`, và bản do J15 tạo): 0 do người xin, 0 do người trong `originActorIds`, 0 do người dưới OWN đã làm A32 trước lúc duyệt, 0 dưới `manager`, 0 yêu cầu `owner` do người không phải OWN duyệt. |
| **Chi hoàn** | 34 lần chi (30 tuần tự + 4 đua; Σ 19.797.000): 0 vượt số duyệt còn lại; 0 vượt tiền dư trước bước; 0 làm folio thành nợ; `refundedVnd` = Σ phiếu ≤ số duyệt ở mọi bản ghi; 0 lần chi một yêu cầu chưa `approved`; 0 lần chi không có nơi nhận. Người chi: tiền mặt 17 (FD 1, LT trưởng 13, MGR 3), chuyển khoản 17 (MGR 16, OWN 1); 0 vi phạm luật người chi. Thử chi tuần tự: 30 lần trong kẹp → 201; 4 lần trong kẹp → 409 `REFUND_SOURCE_NOT_RECONCILED` (đúng: phần dư chưa đối soát); 12 lần ngoài kẹp → 422; **0 lần trong kẹp bị 422**; `max` của 422 = min(còn lại, dư) ở mọi lần. Hai chuỗi dò `refundPay-cash/transfer`: đạt. |
| ESC-026 / I13 | 1.298 lần áp dưới OWN; 520 lần vượt ngưỡng → 520 lần báo và đúng 1 mục "Cần chú ý"; 0 lần báo khi không vượt. |
| I14 | 0 hàng thừa (đếm theo thao tác con, gồm chi hoàn và 1.008 bước "fallback"). |
| Hai tổ chức | `FZ-06` so với `FZ-06-org2`: 0 id trùng (1.160/1.167 hàng, 40/40 folio). |

## 10. Đọc tay từng bước – 24 chuỗi

- **FZ-13 (10):** 64022, 64023, 64026, 64029, 64034, 64039, 64053, 64062, 64063, 64074.
- **FZ-01 (3):** 60023, 60070, 60162.
- **FZ-02 (6):** 61006, 61012, 61019, 61048, 61053, 61084.
- **Họ khác (5):** FZ-07 62003, FZ-09 62047, FZ-10 63027, FZ-11 63018, FZ-12 63009.

Gồm mọi chuỗi M-2, mọi chuỗi có `I3?` của FZ-13, các chuỗi B-1 cũ, và mẫu mỗi họ.

Ví dụ một phép tính đọc tay, FZ-11 63018 #5:
- MGR hạ đêm 05/12 911.000 → 1.000. FOC xóa nợ 35.000 đi theo dòng: min(35.000, 1.000) = 1.000.
- B = 2.000.000 − 910.000 + 34.000 = 1.124.000. O = 1.000.000 − 1.000 = 999.000.
- I7: 910.000 ≤ W 1.035.000 → 201.
- Σ lượt 911.000 > cơ sở 792.000 → báo OWN.
- Khớp API.

## 11. Kết luận dạng chuẩn

**Lệch tiền theo oracle: 0** (B, O, W, R, hạn; 0/28.250 bản ghi chính).

**Blocker 0, Major 1** (M-2 = I24, loại (a), P1, nâng P0 nếu biến thể A32 tái hiện).

Minor:
- bảng 4 dòng 4: đổi nơi nhận đưa yêu cầu về `pending` vượt dư;
- dòng 5: lớp chặn ở bước duyệt chưa được fuzz kích;
- dòng 6: `postedAt` của dòng FOC chưa ghi sổ thay đổi;
- dòng 7: thứ tự ghi dòng lịch J15;
- dòng 13: mã 412;
- dòng 14: cách tính số thực áp khi FOC đi theo dòng;
- dòng 17: độ phủ chi hoàn.

**BUG-R3-012: đóng được. BUG-R3-013: đóng được phần đã báo; 13.3 chưa trọn vẹn ở đường chi hoàn.**

**G1 CHƯA ĐẠT "0 lệch tiền, 0 Major":** đạt vế "0 lệch tiền", không đạt vế "0 Major".

Điều kiện để đạt:
1. BE-B gắn `refundsDownToCredit` vào `payOut` (mục 5, đề xuất 1), ARC + SEC review.
2. SEC chạy ca dò biến thể A32 để chốt mức P1 hay P0.
3. QA thêm I24/I24b vào harness, ca hồi quy 64023 và 64053, một ca kích lớp chặn ở bước duyệt.
4. Chạy lại họ FZ-13 cùng FZ-01/FZ-02; critic đọc lại.

FZ-08 và I9 giữ ngoài G1 như đề bài.
