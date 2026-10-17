# Bảng ca tổ hợp minibar – kiểm lại BUG-R2-135…138, 140 (mô hình M-1)

- Tác giả: QA | R2 Sprint 4 – tuần Ổn định | Ngày: 18/10/2026 | Phiên bản: **0.2** – sửa theo ARC `rounds/round-02/outputs/ARC/openapi-0.3.7.md` mục 16.5 (ARC trả lời Q1–Q4, duyệt mô hình M-1). Bản 0.1: bản nháp chờ ARC.
- Căn cứ: critic `rounds/round-02/reviews/s4-money-recheck3.md` mục "Việc chung cho 5 mã"; decision-log ORC 18/10; DOM 18/10 điểm (1) và các chốt (b), (c), (e); ARC mục 16.1–16.4 (khái niệm, quy tắc R1–R10, bảng 11 ca); BR-702, BR-703, BR-433, BR-434 v0.3.8; oracle BR-434-15, BR-434-16, BR-702-01…03, BR-703-01.
- Test: `product/tests/e2e/clock/minibar-matrix.s4.clock.spec.ts` (TC-L4-101…119). **Không đặt ở `e2e/api/`**: project `api` chạy song song trên đồng hồ thật, còn bảng này cần (1) đơn đang ở – nhận phòng trên đồng hồ ảo – và (2) sửa danh mục minibar của cơ sở, là trạng thái dùng chung. Project `clock` chạy tuần tự, 1 worker, sau mọi project dùng API. Mỗi ca trả danh mục về như cũ.
- Lỗi đã biết: `knownBug` ở dòng đầu ca theo mã (bảng mục 6); `support/known-bugs.ts` `OPEN` có BUG-R2-135…140. PR sửa của BE-B/BE-A xóa dòng của mã đã sửa.

## 1. Mô hình M-1 (ARC đã duyệt – mục 16.2)

| Mã ARC | Quy tắc | Ca kiểm |
|---|---|---|
| R1 | Tủ = (lượt, căn). Lần đếm `checkout` chỉ thay bản cũ **cùng tủ**; `roomId` vắng = căn đang gán; căn cũ của chính lượt được; căn khác → 422 `NOT_IN_LIST`. | TC-L4-118, 119 |
| R2 | **Mốc = mức lúc nhận phòng/vào căn** (DOM (b)), cài bằng chụp khi danh mục đổi: mỗi lần sửa danh mục, tủ của lượt đang ở chưa có lần nạp được ghi lần nạp bằng danh mục **trước khi sửa**. Sửa nhiều lần → chỉ lần đầu chụp. | TC-L4-107…109, 113, 119 |
| R3 | Món của tủ = món trong lần nạp gần nhất. Món tắt, định mức 0, đổi miễn phí **sau** lần nạp vẫn trong tủ, vẫn hiện, vẫn đếm. Món thêm sau lần nạp → `NOT_IN_LIST`. `checkout` phải đủ mọi món của tủ. | TC-L4-106, 108, 112 |
| R4 | Đã dùng = mốc − còn lại; còn lại > mốc → `MINIBAR_QTY_OVER_STANDARD`. | TC-L4-109, 113 |
| R5 | **Một đơn giá mỗi kỳ nạp = giá lúc nạp** (`null` = miễn phí) cho toàn bộ số đã dùng – trả lời Q1, Q2 [DOM xác nhận]. | TC-L4-102…105, 117 |
| R6 | Giữ dòng: đã dùng = **lần đếm trước** hoặc = **số trên dòng folio sống** (lễ tân đã sửa/void) → giữ dòng folio sống, FOC, nhãn; lần đếm mới chép giá, tiền, `folio_line_id` theo dòng folio. | TC-L4-104, 106, 110, 111 |
| R7 | Lần đếm thật mới → đảo dòng sống, ghi **một** dòng = đã dùng × giá R5; dùng 0 → chỉ đảo. | mọi ca B2, B3, B4 |
| R8 | FOC minibar khóa `item:minibar:<mã món>` trên folio (mọi tủ, mọi kỳ); giá trị = Σ dòng sống của món; áp_i = min(duyệt_i, giá trị − Σ áp trước); về 0 → ngủ; > 0 → tự khôi phục; hạn mức trừ một lần; chốt khi còn ngủ → hủy `settled_while_dormant`. | TC-L4-114…118 |
| R9 | B14 giữa lượt: tủ căn cũ đếm như trả phòng (`roomId` = căn cũ) → việc bổ sung tủ căn cũ; B14 không bị chặn; B18 chặn khi còn tủ chưa đếm (`CheckoutSummary.minibarUncheckedRooms`). FOC theo món qua hai tủ – **DOM đã chốt (c)**. | TC-L4-118, 119 |
| R10 | `latestCheck.totalVnd` = Σ dòng folio sống của tủ = số H16 bước 1 = số B18 thu. | mọi ca |

**Q1–Q4 – ARC trả lời (mục 16.5):**
- **Q1** (dùng thêm sau khi đổi giá): **không** theo giá hiện hành – một đơn giá cho cả kỳ nạp = giá lúc nạp (R5). MX-A1-B2 = MX-A2-B2 = **70.000** (folio 862.000); MX-A1-B2-C1 ròng **35.000**.
- **Q2** (món đã chuyển miễn phí, dùng thêm): phần thêm tính giá lúc nạp, **không** 0 đ. MX-A3-B2 = MX-A4-B2 = **70.000** (folio 862.000).
- **Q3** (món đã tắt hoặc định mức 0): vẫn **hiện và đếm được** tới lần nạp sau. MX-A5-B2/B3/B4 = 70.000 / 35.000 / 0; MX-A7 như MX-A6 (mốc 2).
- **Q4** (mốc khi chưa có lần đếm trước): mức lúc nhận phòng/vào căn (R2). MX-D1-A6: tủ 203 mốc **1** (định mức đã hạ trước B14), tủ 202 mốc 2.

## 2. Trục tổ hợp

| Trục | Giá trị |
|---|---|
| **A – thay đổi danh mục giữa hai lần đếm** | A0 không đổi (đối chứng); A1 tăng giá +5.000; A2 giảm giá −5.000; A3 sang miễn phí (`null`); A4 giá 0; A5 tắt món; A6 hạ định mức 2 → 1; A7 hạ định mức 2 → 0; A8 nâng định mức (2 → 3; snack 1 → 2) |
| **B – lần đếm lại (số đã dùng so với lần đầu)** | B1 cùng số; B2 tăng; B3 giảm; B4 về 0 |
| **C – FOC** | C0 không; C1 một FOC duyệt sau lần đếm đầu; C2 thêm FOC thứ hai sau lần đếm lại (mắt chuỗi khác) |
| **D – đổi phòng giữa lượt** | D0 không; D1 B14 `property_fault`; D2 B14 `guest_request` |

Cách chạy gọn: trục B chạy **trên bốn món định mức 2 của cùng một tủ** – bia (B1), coca (B2), sữa (B3), mì (B4) – nên mỗi giá trị A chỉ cần một lượt ở. Tầng (i) 9 ca; tầng (ii) FOC 4 ca; tầng (iii) B14 2 ca; ca 8–11 của ARC 4 ca.

Dữ liệu: DS-E – bia 35.000, coca 25.000, sữa 20.000, mì 25.000 (định mức 2), snack 30.000 (định mức 1). Mỗi ca một ngày ảo riêng, nhận phòng 14:00, tiền phòng đã thu; đếm và B18 lúc 09:00 ngày đi. Số "Folio 202" dưới đây là căn 202 giá 792.000 – test so phần minibar, không so tiền phòng.

## 3. Tầng (i) – A × B, không FOC, không đổi phòng

Lần đầu: bia dùng 2, coca dùng 1, sữa dùng 2, mì dùng 2. Áp thay đổi A cho cả bốn món. Đếm lại: bia 2 (B1), coca 2 (B2), sữa 1 (B3), mì 0 (B4).

**Theo M-1 mọi thay đổi danh mục áp từ lần nạp sau → với mọi A, tiền giống A0:** bia 70.000, coca 50.000, sữa 20.000, mì 0 – tổng **140.000**; tủ vẫn liệt kê đủ bốn món, mốc 2, giá lúc nạp.

| Ô (theo món) | A0 | A1 (+5.000) | A2 (−5.000) | A3 (`null`) | A4 (0) | A5 (tắt) | A6 (2 → 1) | A7 (2 → 0) | A8 (2 → 3) |
|---|---|---|---|---|---|---|---|---|---|
| B1 bia (2 → 2) | 70.000 | 70.000 (BUG-R2-140: lần đếm ghi 70.000) | 70.000 | 70.000 (**137**) | 70.000 (**137**) | 70.000 | 70.000 (**138**) | 70.000 | 70.000 (**138**) |
| B2 coca (1 → 2) | 50.000 | **50.000** (Q1) | **50.000** (Q1) | **50.000** (Q2) | 50.000 (Q2) | 50.000 (Q3) | 50.000 | 50.000 | 50.000 |
| B3 sữa (2 → 1) | 20.000 | 20.000 | 20.000 | 20.000 | 20.000 | 20.000 (Q3) | 20.000 | 20.000 | 20.000 |
| B4 mì (2 → 0) | 0 | 0 | 0 | 0 | 0 | 0 (Q3) | 0 (nhập "còn 2" được) | 0 | 0 |
| TC | TC-L4-101 | TC-L4-102 | TC-L4-103 | TC-L4-104 | TC-L4-105 | TC-L4-106 | TC-L4-107 | TC-L4-108 | TC-L4-109 |
| `knownBug` | – (phải đạt) | 140 | 140 | 137 | 137 | 137 | 138 | 138 | 138 |

Thêm ở TC-L4-109: snack (định mức 1, dùng 1) nâng định mức lên 2 rồi đếm lại còn 0 → **30.000** (không 60.000); gửi "còn 2" → 422 `MINIBAR_QTY_OVER_STANDARD` (mốc 1).

Bản `42fb458` (chưa sửa) cho số khác – ví dụ A1: coca 60.000, sữa 25.000, tổng 155.000, `latestCheck` 165.000; A3/A4: mọi món về 0; A6: mốc trả 1; A8: tổng 305.000. Ca TC-L4-101 đạt.

## 4. Ca 8–11 của ARC (16.4)

| TC | Ca | Diễn biến | Đúng | `knownBug` |
|---|---|---|---|---|
| TC-L4-110 | 8 – DOM (e) folio đã sửa | Bia đếm 2 (70.000) → lễ tân sửa folio còn 1 (35.000, lý do) | `getMinibarStandard`: `adjustedAfterLastCheck = true`, `folioUsedQty = 1`, `lastCheckUsedQty = 2`. HK đếm lại dùng 2 (xác nhận lần cũ) → giữ 35.000, đúng dòng folio đã sửa; Desk gửi theo folio (dùng 1) → vẫn giữ; dùng 0 → lần đếm mới, 0 | 140 |
| TC-L4-111 | 9 – DOM (e) void | Lễ tân void dòng bia (lý do) → đếm lại dùng 2 | Giữ "không dòng" (0); dùng 1 → 35.000 | 140 |
| TC-L4-112 | 10 – món mới | OWN thêm món vào danh mục sau khi nhận phòng | Món không trong `items`; đếm món đó → 422 `NOT_IN_LIST` | 137 |
| TC-L4-113 | 11 – sửa danh mục hai lần | Định mức bia 2 → 1 → 3 khi đang ở, chưa đếm | Mốc vẫn 2; "còn 3" → 422; dùng 2 → 70.000 | 138 |

## 5. Tầng (ii) – có FOC (C1, C2)

| TC | Ô | Diễn biến | Đúng | `knownBug` |
|---|---|---|---|---|
| TC-L4-114 | MX-A0-B4-C1 → đếm lại 2 | Bia 2 → FOC 35.000 → đếm về 0 → đếm lại 2 | FOC ngủ rồi tự khôi phục 35.000; ròng 35.000 (BR-434-15 (a)) | – (phải đạt) |
| TC-L4-115 | MX-A0-B1-C2 cùng dòng | Bia 2 → FOC A 35.000 → FOC B 35.000 trên cùng dòng | Cả hai áp; ròng 0 | – (phải đạt) |
| TC-L4-116 | MX-A0-B4-C2, MX-A0-B3-C2, MX-ADJ-C2 | (a) 102: 2 → A → 0 → 2 → B → 1; (b) 202: 1 → A → 2 → B → 1; (c) 203: chỉ sửa số trên folio 1 → A → 2 → B → 1 | Giá trị món 35.000; A áp 35.000, B ngủ; ròng 0 (không âm); B18 thu 0; sau chốt B hủy `settled_while_dormant` | 135 |
| TC-L4-117 | MX-A3-B1-C1, MX-A6-B3-C2, MX-A1-B2-C1, MX-A5-B1-C1 | Một tủ: bia sang miễn phí (dùng 2 → 2, một FOC); coca hạ định mức 2 → 1 (dùng 2 → 1, hai FOC xin khi món còn 50.000); sữa tăng giá (dùng 1 → 2, một FOC); mì tắt món (dùng 2 → 2, một FOC); sau đếm lại xin FOC coca thứ ba | Bia giữ 70.000 − 35.000; coca 25.000, A áp 25.000, B ngủ, FOC thứ ba → 422 `max` 0 (Σ FOC ≤ giá trị món kiểm cả lúc xin); sữa 2 × 20.000 − 20.000 (**ròng 20.000** – Q1); mì 50.000 − 25.000; **ròng 80.000 = B18** | 135, 137, 138, 140 |

## 6. Tầng (iii) – đổi phòng giữa lượt (D1, D2)

| TC | Ô | Diễn biến | Đúng | `knownBug` |
|---|---|---|---|---|
| TC-L4-118 | MX-D1-a | Cặp căn cùng nhóm, B14 sự cố ngày 2; HK đếm tủ căn cũ trong ngày (`roomId`) dùng 2 bia; tủ mới dùng 1; đếm lại tủ mới | Minibar 105.000; đếm lại tủ mới chỉ thay lần đếm của tủ mới; `latestCheck` tủ cũ 70.000 | 136 |
| TC-L4-118 | MX-D1-b | Như trên, tủ căn cũ chưa đếm tới ngày đi | `minibarUncheckedRooms` có căn cũ; B18 → 409; đếm tủ cũ dùng 2 → 70.000, B18 được | 136 |
| TC-L4-118 | MX-D1-c | Như (a) + FOC 70.000 trên dòng bia tủ cũ | Gộp 105.000, ròng 35.000 (FOC theo món qua hai tủ – DOM (c) đã chốt) | 136 |
| TC-L4-119 | MX-D2-a | 101 → 301 khách xin (sang căn đắt hơn), tủ cũ không dùng, tủ mới 1 snack | Minibar 30.000; xem trước B18 = lệnh ghi (gồm chênh đổi căn – QA không so tiền phòng) | 136 |
| TC-L4-119 | MX-D1-A6 | 202 dùng 2 bia → OWN hạ định mức 2 → 1 → B14 sự cố sang 203 → 203 dùng 1 | Tủ 202 mốc 2 giữ 70.000; tủ 203 mốc **1** (danh mục lúc vào căn) → 35.000; tổng 105.000 | 136, 138 |
| TC-L4-122 | MX-D-restock | (a) đếm tủ trước B14 (bia 2, coca 1) → B14; (b) B14 trước, đếm tủ căn cũ sau (`roomId`, 1 snack) | Việc `minibar_refill` của căn cũ, nguồn `system`, `reservationId` = đơn chính, `refillItems` = món đã dùng – sinh lúc B14 (a) hoặc lúc đếm (b); trước khi đếm (b), `minibarUncheckedRooms` có căn cũ | 136 |

## 7. Mỗi ca kiểm gì

1. Lệnh đếm `recordMinibarCheck` đúng mã HTTP; còn lại = mốc kỳ vọng − đã dùng (test tự tính mốc theo M-1 để bản cũ lộ lỗi ở số tiền).
2. `getMinibarStandard`: món, mốc, giá lúc nạp; các trường DOM (e).
3. Dòng folio của từng món (mô tả = tên món): tiền, đúng dòng được giữ; dòng đảo khi về 0.
4. FOC: `focState` (`applied` / `dormant` / `cancelled` + `settled_while_dormant`).
5. `latestCheck.totalVnd` = folio (R10); `checkout-summary` = số B18 thu; B18 200, folio `settled`, số dư 0.

## 8. Trạng thái

- **18/10 ~05:20 – api-dist10** (cây chung: M-1/0065 của BE-B, 139 của BE-A): `minibar-matrix` + `late-fee-qr` **22/22 đạt** với `E2E_FIXED_BUGS=BUG-R2-135…138,140`. Thêm TC-L4-122 (bổ sung tủ căn cũ); sửa TC-L4-117 (FOC thứ ba bị chặn `max` 0) và TC-L4-120 (đếm minibar trước B18). Commit gộp M-1 phải xóa các mã đã sửa khỏi `OPEN`.

### Lượt đầu (18/10 ~04:30)

- Chạy trên `ottimo-qa-s4` (api `42fb458`, chưa có M-1): 21/21 đúng kỳ vọng – TC-L4-101, 114, 115 đạt; 16 ca `knownBug` hỏng đúng chỗ của lỗi (xem `rounds/round-02/qa/bug-list.md` mục 11.13); danh mục trả về đúng sau mỗi ca.
- Món thêm của TC-L4-112 (`mx_e2e_new`) ở lại danh mục, **đã tắt** sau mỗi lượt (mã món không xóa được).
- Ca đã đổi theo M-1: **TC-L4-071** (US-066 AC2) – lượt nhận phòng sau khi đổi giá mới dùng giá mới; lượt đang ở từ trước giữ giá cũ tới lần nạp sau (R5).

## 9. Kỳ nạp – tủ quay lại trong lượt (BUG-R2-144; ARC 16.13; DOM R9 18/10 – `business-rules.md` ghi chú dưới bảng mục 9)

Quy tắc (DOM R9, thay giả định ARC "hủy việc bổ sung"): lượt ở tiếp tủ đã đếm có tính tiền mà việc `minibar_refill` chưa xong → kỳ `carry` (mốc = còn lại; món mốc 0 không còn trong tủ), **việc giữ mở**; gia hạn B13 sau lần đếm có tính tiền → **sinh việc ngay**; HK xong việc khi lượt đang ở căn → kỳ `refill`, mốc = số theo hệ thống + số nạp; xong việc trước khi lượt vào lại → kỳ `refill` theo danh mục lúc vào lại (nhánh ARC giữ). "Có tính tiền" xét theo số lượng món có giá (FOC 100 % vẫn tính).

| TC | Ô (oracle BR-703-02) | Diễn biến | Đúng | `knownBug` |
|---|---|---|---|---|
| TC-L4-124 | `s409Agoda` | Agoda + đơn con B13; B14 `until_parent_departure`; tủ căn gốc 2 bia; HK xong việc; ghi khách về (`roomReturnRecorded`); kỳ sau 1 bia | 105.000 (70.000 giữ + 35.000); B18 đòi đếm lại căn gốc | – (đạt trên cây chung) |
| TC-L4-127 | `r9_16` | Về căn gốc khi T1 chưa xong; khách ăn 1 snack | T1 giữ mở; 100.000; sau B18 T1 + T2 | 144 |
| TC-L4-128 | `r9_16b` | HK xong T1 khi khách đã vào lại; dùng 1 bia + 1 snack | mốc bia 2, snack 1; 135.000 | 144 |
| TC-L4-129 | `r9_16c` | 09:00 HK đếm snack 0; 09:01 xong T1; 11:00 B18 đếm bia 2/2 | 100.000 (không 130.000) | 144 |
| TC-L4-130 | `r9_18` | B13 sau lần đếm 2 bia; (a) chưa nạp, (b) đã nạp | B13 sinh T1 ngay; 70.000 cả hai | 144 |
| TC-L4-131 | `r9_t` | FOC 100 % rồi về căn gốc | kỳ `carry` mốc bia 0; 70.000, FOC 70.000, ròng 0 | – (đạt) |
| TC-L4-125 (E, Desk) | `r9_18` (phần Desk) | Đếm 2 bia, B13, mở H16 ngày đi mới | "Tủ căn 202 cần đếm lại"; lưu bước 1 không đảo 70.000 | – (đạt) |
| TC-L4-126 (E, Desk) | Note N-1 | Folio → Điều chỉnh dòng bia có FOC → tick "Bỏ cả dòng" | cảnh báo `folio.void_minibar_foc`; bỏ tick ẩn; không lưu | – (đạt) |

Chạy 18/10 ~05:15 trên `ottimo-qa-s4` dựng lại từ cây chung (api-dist12: 0066 BE-B, BE-A đang sửa; admin-web FE-A đợt 14): 124, 131, 125, 126 đạt; 127…130 hỏng đúng phần DOM R9 chưa cài (T1 bị hủy → HK 404; B13 chưa sinh việc). Đã sửa ca: giờ `performedAt` của HK phải ≤ giờ máy chủ + 5 phút; `listHkTasks` ngày đã qua trả 422; món mốc 0 ở kỳ `carry` không gửi trong lần đếm (`NOT_IN_LIST`).
