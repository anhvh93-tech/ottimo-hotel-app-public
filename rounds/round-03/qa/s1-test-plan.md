# Kế hoạch kiểm thử Sprint 1 – Round 3 (QA)

- Tác giả: QA | Round 3 – Sprint 1, bước **Sản xuất (chuẩn bị kiểm thử)** | Ngày: 22–23/10/2026 | Trạng thái: **bản 1 – chờ PO, DOM, SEC đọc**.
- Đầu vào:
  - `rounds/round-03/sprint-1-plan.md` (3.1, 3.2, 3.3, 6, 8);
  - `rounds/round-03/plan.md` mục 4.1 và mục 6 (đề xuất ca đồng hồ giả);
  - DOM `rounds/round-03/outputs/DOM/s1-money-oracle.md` (mục 1–10, bất biến I1–I15);
  - SEC `rounds/round-03/outputs/SEC/s1-security-requirements.md` (A.7, B, C, D, E);
  - ARC `rounds/round-03/outputs/ARC/s1-contracts.md` (OpenAPI 0.3.8-draft);
  - backlog: US-007 AC7, US-021 AC7, US-031 AC3, US-109 AC3, US-110 AC4, US-143 AC3–AC4, US-164 AC1–AC8;
  - `product/docs/qa/test-strategy.md` mục 8 (mức lỗi).
- Fixture: `product/tests/fixtures/br-examples.json` đã thêm 33 dòng (mục 7). Validator 0 lỗi, `gen_traceability.py --strict` exit 0.
- Ràng buộc:
  - Không đụng `OTM-00239` và dữ liệu R-6 trên staging.
  - Không quét VietQR bằng app ngân hàng; QR kiểm bằng giải mã payload.
  - Không ghi mã TOTP, mã khôi phục, mật khẩu, số tài khoản vào repo, log CI hay tài liệu.
  - Ca cần đồng hồ giả hoặc `__test__` chạy trên stack CI cùng commit với image staging.

---

## 0. Tóm tắt

| Nhóm | Mã ca | Số ca | Chạy ở | Khi nào |
|---|---|---|---|---|
| A. Lượt kiểm tiền (oracle DOM) | S1-M-01…65 | **65** (62 Sprint 1 + 3 `pendingFix` dời Sprint 2) | Tích hợp BE (PostgreSQL thật) + E2E API; ca có màn → E2E UI | Theo thứ tự gộp 210 → 209 → 208 → BE-83 → #8–#12 → 6a–6e |
| B. Fuzz công nợ R3-Q30 | S1-FZ-01…09 | **9 họ chuỗi** (≥ 600 chuỗi) | Stack CI riêng, đồng hồ giả | D8, trên bản có bước 1–6 |
| C. Bảo mật bắt buộc (SEC A.7, B, C, D, E) | S1-SEC-01…64 | **64** | Tích hợp BE + E2E UI admin-web | Theo PR; SEC chạy lại khi ghi Verified |
| D. Đồng hồ giả | S1-CLK-01…33 | **33 ca** (= 51 lượt chạy theo mốc) | Dự án Playwright `clock` / `ui-clock`, mọi lượt CI push | Từ khi tính năng gộp |
| E. Hồi quy ESC-023 A "phí 0" | S1-REG-01…05 | **5** | E2E API + UI | Mọi lượt push (không có mã mới) |
| F. R3-Q15 xóa `note` | S1-Q15-01…03 | **3** | Tích hợp + đồng hồ giả | Khi BE-D gộp |
| **Tổng** | | **170 ca + 9 họ fuzz** | | |

Mức lỗi:
- Mọi lệch số với oracle DOM, vi phạm I1–I15, hoặc lỗi 5xx/deadlock trên đường tiền: mặc định **P0** cho tới khi chứng minh không ảnh hưởng tiền (plan R3 4.1 bước 7).
- Lộ TOTP, mã khôi phục, `mfaToken`, bí mật hoặc số tài khoản đầy đủ: **P0** (C3).
- Lệch trong oracle: **không sửa kỳ vọng trong test**. QA ghi thẻ cho DOM kèm bằng chứng (oracle mục 0.1).

## 1. Cách chạy chung

1. **Xem trước rồi ghi.** Mỗi ca tiền có xem trước (`*-preview`, `cancellationQuote`, `move-preview`, số "khi duyệt sẽ áp") thì gọi xem trước, lưu số, gọi lệnh ghi rồi so: **xem trước = lệnh ghi = oracle**.
2. **Đọc oracle theo id.** Test đọc dòng `br-examples.json` theo id, không chép số vào test (quy ước R2):
   - dòng còn `pendingFix` → `test.skip` có nhãn mã thẻ;
   - BE gộp bản sửa → QA gỡ `pendingFix` trong cùng PR, sau khi chạy xanh trên CSDL riêng.
3. **Ghi log gốc** cho critic, mỗi ca một tệp JSONL trong artifact CI `money-raw-logs/`:
   - request và response (đã che theo `secret-fields.ts`);
   - ảnh sổ của folio sau bước: dòng phí, FOC, khoản thu, hoàn, nhật ký `reservation.debt_on_checkout`, `debt_*` của folio, yêu cầu duyệt;
   - giờ đồng hồ giả.
4. **Bất biến I1–I15** (oracle mục 8) chạy sau **mọi bước** của mọi ca nhóm A, không chỉ ở fuzz. Dùng chung hàm tham chiếu `refLedger` (mục 3.2).
5. **Ca đua** chạy hai thứ tự × 3 vòng. Đạt khi kết quả bằng một thứ tự tuần tự, deadlock 0, không có 5xx (I14).
6. **Báo cáo CI:** dẫn `gh run list --workflow CI -L 5` (C13) và commit SHA.

---

## 2. Nhóm A – Lượt kiểm tiền (theo oracle DOM)

Cột "Fixture" là dòng oracle. "Gỡ khi" là mã thẻ `pendingFix`.

### 2.1 Bước 1 – BUG-R2-210 / R3-Q21 (nợ ghi trước 0076)

| Mã | Ca oracle | Kiểm | Fixture | Gỡ khi |
|---|---|---|---|---|
| S1-M-01 | 210-A | Nợ cũ không có chu kỳ (dữ liệu tạo bằng SQL `debt_opened_at` NULL). Sau khi đảo 834.000: **B 1.004.000, O 934.000, W 70.000**, nhật ký 834.000, giữ hạn của nợ cũ, có "Cần chú ý". Mã lỗi nhận diện: O = 834.000. Đối chứng câu ARC cũ: O = 1.004.000 cũng là **sai** | BR-525-36 | BUG-R2-210 |
| S1-M-02 | 210-A tiếp | J15 17/11 10:00 → nhật ký 70.000, báo OWN + MGR, **O = B = 1.004.000**, hạn cũ, `closed` | BR-525-36 | BUG-R2-210 |
| S1-M-03 | 210-B | Nợ cũ 2.000.000, yêu cầu xóa 1.500.000 đang chờ, đảo 916.000 → **O 2.916.000**; màn duyệt "khi duyệt sẽ áp 1.500.000" | BR-525-37 | BUG-R2-210 |
| S1-M-04 | 210-B tiếp | OWN duyệt → áp 1.500.000; **không** có `applied_capped`, **không** có `debt_cleared`; **O 1.416.000**; credit 0 | BR-525-37 | BUG-R2-210 |
| S1-M-05 | 210-C | Không nợ cũ, đảo 500.000 → chu kỳ mới, O 500.000, hạn = ngày nghiệp vụ + 3 | BR-525-36 `controlNoLegacy` | BUG-R2-210 |

Điều kiện gộp bước 1: QA và SEC xác nhận `openDebtVnd` đúng trên dữ liệu ghi trước 0076 (S1-M-01…05 xanh trên CSDL riêng).

### 2.2 Bước 2 – BUG-R2-209 / R3-Q20

| Mã | Ca | Kiểm | Fixture |
|---|---|---|---|
| S1-M-06 | 209-A | Nhật ký **[100.000, 70.000]**; báo lần hai; `debt_recorded_vnd` 170.000; O 170.000; hạn **19/11** (không phải 20/11); `closed` | BR-525-02 (`pendingFix` BUG-R2-209) |
| S1-M-07 | 209-B | Khách công ty, hạn sửa tay 30/11 → O 270.000, hạn 30/11, báo lần hai | BR-525-33 |
| S1-M-08 | 209-C | Thu 100.000 lúc 16/11 18:00 → O 0, W 70.000; J15 → chu kỳ mới O 70.000, hạn **20/11**; "Cần chú ý" 16/11 18:00 → 17/11 10:00 **không** có mục công nợ | BR-525-33 `paidBeforeJ15` |
| S1-M-09 | 209-D (đua) | J15 ‖ đảo 100.000, hai thứ tự × 3 vòng: O 170.000, hạn 20/11, tập nhật ký {100.000, 70.000}, deadlock 0 | **BR-525-38** (mới) |
| S1-M-10 | 209-E | B = O, không khoản cửa sổ, J15 chỉ đóng folio: 0 nhật ký mới, 0 thông báo | (TC mới, không cần dòng) |

### 2.3 Bước 3 – BUG-R2-208 / R3-Q19 (SEC review trên head SHA trước khi gộp)

| Mã | Ca | Kiểm | Fixture |
|---|---|---|---|
| S1-M-11 | 208-A | Thu 100.000 → O 0, W 70.000; void minibar → **201**, B 0. Đổi thứ tự (ghi minibar sau đảo) → cùng kết quả | BR-525-29 |
| S1-M-12 | 208-B | Thu 50.000 → void 70.000 **201**, B = O = 50.000; giảm thêm 1 đồng → **409**. Biến thể: giảm dòng phòng 80.000 ngay từ đầu → **409**, B giữ 120.000 | BR-525-30 |
| S1-M-13 | 208-C (ca SEC) | A32 +10.000 × 9 trên dòng mang FOC xóa nợ → B 4.490.000, O 4.400.000, W 90.000. Void dòng nợ → 409; giảm 90.001 → 409; giảm 90.000 → 201. MGR không void được nợ khi không qua OWN | BR-525-31 |
| S1-M-14 | 208-D (đua RE) | Đảo, A32 +10.000, thu 100.000, giảm 10.000 → 201, B 0. Đổi thứ tự A32 và thu → cùng kết quả | BR-525-32 |
| S1-M-15 | 208-E | O 0, W 0, xin xóa nợ 10.000 → **409 `FOLIO_LOCKED`** (R2 là 422); Desk hiện "Không còn công nợ để xóa" | **BR-525-39** |
| S1-M-16 | 208-F (N-15) | 17/11 10:20, J15 chưa chạy: A32 giảm → 409; FD thu tiền → 409 tới khi J15 chạy (≤ 1 giờ) | **BR-525-40** |
| S1-M-17 | 208-G (đua) | A32 giảm 70.000 ‖ thu 50.000, hai thứ tự: B cuối **50.000** = O | (TC; số trong oracle 4) |

### 2.4 Bước 4 – BE-83 (R3-Q22) + ESC-026 A (US-007 AC7) + R3-Q25

| Mã | Ca | Kiểm | Fixture |
|---|---|---|---|
| S1-M-18 | BR-525-21 | 12 × 450.000: lần 1 tự áp; lần 2–11 chờ OWN; lần 12 → 422 `max` 50.000 | BR-525-21 |
| S1-M-19 | BR-525-22 | Từ chối không tính; Σ 667.000 tự áp; 668.000 chờ OWN (biên) | BR-525-22 |
| S1-M-20 | BR-525-23 | Yêu cầu chờ và yêu cầu đã duyệt đều cộng vào Σ | BR-525-23 |
| S1-M-21 | BR-525-24 | Cơ sở = giá đêm cao nhất 767.000; đổi thứ tự dòng → cùng kết quả | BR-525-24 |
| S1-M-22 | BR-525-25 | Cộng mọi chu kỳ: Σ 670.000 → chờ OWN | BR-525-25 |
| S1-M-23 | BR-525-26 | Yêu cầu tự hủy `debt_cleared` → Σ 0 | BR-525-26 |
| S1-M-24 | BR-525-27 (đua) | Hai yêu cầu 450.000 cùng lúc → đúng một tự áp | BR-525-27 |
| S1-M-25 | BR-433-04 | FOC cùng khóa 600.000 + 600.000 → lần 2 chờ OWN | BR-433-04 |
| S1-M-26 | BR-433-05 | FD bia 100.000 + 100.000 → lần 2 chuyển LT trưởng | BR-433-05 |
| S1-M-27 | E26-1 | Ba khóa khác nhau đều áp ngay; Σ 550.000 không báo; Σ **1.150.000** → **1** thông báo OWN + **1** "Cần chú ý"; nội dung không có tên/SĐT khách | **BR-433-06** |
| S1-M-28 | E26-2 | Giảm 100% từng đêm: **4** thông báo, **1** "Cần chú ý", khách trả tiền phòng 0 | **BR-433-07** |
| S1-M-29 | E26-3 | Ngưỡng theo vai cao nhất: báo ở khoản 3 (330.000 > 300.000); khoản 4 ngưỡng 792.000 → không báo thêm | **BR-433-08** |
| S1-M-30 | E26-4 | Khoản OWN duyệt không tính → không báo | **BR-433-09** |
| S1-M-31 | E26-5 | Xóa nợ MGR tự áp tính vào Σ lượt → 1.000.000 > 911.000 → báo | **BR-433-13** |
| S1-M-32 | E26-9 | FOC tự hủy (BR-434) ra khỏi Σ; không có thông báo "dưới ngưỡng" | **BR-433-14** |
| S1-M-33…35 | E26-6, 7, 8 | OWN thu hồi khoản miễn (khách còn ở / `settled` → W rồi J15 / `closed` → 409). **Dời Sprint 2** (ARC 5.4) | **BR-433-10…12** (`pendingFix` **R3-FOC-REVOKE**) |
| S1-M-36 | R3-Q25 (b) | MGR tự áp `debt_write_off` không kèm PIN → 401/422 theo hợp đồng; có PIN → áp | (TC; SEC B.5) |

### 2.5 Bước 5 – R3-Q39 #8–#12 (ngày kinh doanh)

Mỗi ca chạy ở **3 mốc** 02:40 / 05:59 / 06:00. Chi tiết mốc ở nhóm D (S1-CLK-20…24).

| Mã | Ca | Fixture |
|---|---|---|
| S1-M-37 | #8 giá niêm yết `effectiveFrom` = ngày nghiệp vụ; đơn vãng lai đêm 19/10 = **700.000**; đơn đã xác nhận giữ 667.000 | **BR-010-05** |
| S1-M-38 | #9 tham số: dòng 19/10 "đang hiệu lực", dòng 20/10 "**đã lên lịch**"; phụ thu **170.000** | **BR-010-06** |
| S1-M-39 | #10 tủ minibar = **202** (chặng chứa ngày nghiệp vụ), dòng 70.000 | **BR-010-07** |
| S1-M-40 | #11 hạn công nợ: mặc định **23/10**, nhỏ nhất 21/10, 20/10 bị Desk chặn trước khi gửi; quá hạn từ 06:00 ngày 24/10 | **BR-525-43** |
| S1-M-41 | #12 gợi ý "đã thực hiện": no-show `≤`, hủy `<` ngày nghiệp vụ | **BR-010-08** |

### 2.6 Bước 6 – nhóm đi cùng lượt

| Mã | Ca | Kiểm | Fixture |
|---|---|---|---|
| S1-M-42 | Q23-17a | Khách trả đủ → yêu cầu `cancelled` `debt_cleared` **cùng giao dịch**; OWN duyệt yêu cầu cũ → 409 `INVALID_TRANSITION` + `autoCancelReason` | **BR-525-41** a |
| S1-M-43 | Q23-17b | O về 0 bằng một xóa nợ khác → yêu cầu còn lại tự hủy | BR-525-41 b |
| S1-M-44 | Q23-17c | O 0 nhưng W 70.000 → vẫn tự hủy, W giữ | BR-525-41 c |
| S1-M-45 | Q23-18a | Trả 4.000.000 → "khi duyệt sẽ áp **1.000.000**"; màn danh sách không lấy khóa dòng | **BR-525-42** |
| S1-M-46 | Q23-18b | OWN duyệt → áp 1.000.000, `approval.applied_capped`, hạn mức tính 1.000.000 | BR-525-42 |
| S1-M-47 | Q24-a | A04 xác nhận cọc 1.600.000 → B **3.605.000**; `touch` folio khi đã giữ khóa `FOR UPDATE` (kiểm bằng log khóa trong test) | (TC) |
| S1-M-48 | Q24-b (đua) | A04 ‖ thu 500.000 × 3 vòng → tổng thu 2.100.000, B 3.105.000, 2 phiếu, deadlock 0 | (TC) |
| S1-M-49 | Q29-a | `move-preview` B7a khi đang xung đột → **200**, 1.584.000, chênh 0; lệnh ghi cùng số | (TC) |
| S1-M-50 | Q29-b | 3 người lớn sang 302 → phụ thu min(150.000, 0) = 0 → 1.584.000 | (TC) |
| S1-M-51 | Q29-c | Sang 101 (667.000) → vẫn 1.584.000 | (TC) |
| S1-M-52 | Q29-d | Đơn không xung đột gửi `overbookingResolution` → lỗi xác thực, không ghi | (TC) |
| S1-M-53 | Q01-a | Lỗi cơ sở: phí 0, hoàn 500.000, đúng **một** yêu cầu hoàn | BR-309-18 |
| S1-M-54 | Q01-b | Hủy 1 ngày trước → hoàn **1.000.000** | **BR-309-21** |
| S1-M-55 | Q01-c | Đêm Giỗ Tổ → hoàn 600.000 | **BR-309-22** |
| S1-M-56 | Q01-d | Đơn rút muộn → hoàn **1.600.000** (so sánh khách tự hủy: phí 1.584.000) | **BR-309-23** |
| S1-M-57 | Q01-e | Đã dời vì bất khả kháng → hoàn 500.000 | **BR-309-24** |
| S1-M-58 | Q01-f | Dòng đón sân bay: gợi ý đảo → hoàn 700.000; LT trưởng giữ dòng → hoàn 400.000 | **BR-309-25** |
| S1-M-59 | Q01-g | RBAC: FD 403, FDL 403, MGR/OWN được; thiếu ghi chú → 422 `REASON_REQUIRED` | (TC RBAC) |
| S1-M-60 | Q01-h | CTV: hoa hồng 0, không dòng FOC, không trừ hạn mức, báo cáo hủy tách mã | **BR-309-26** |
| S1-M-61 | Q10-a…e | Chuỗi đếm theo kỳ: 35.000 → (không `periodId`) 422 không ghi → (kỳ 1) 409 → (kỳ 2 còn 2) 35.000 → (kỳ 2 còn 1) 70.000 | **BR-703-05** |
| S1-M-62 | Q10-f | Chỉ có kỳ nhận phòng, HK không gửi `periodId` → 422 `REQUIRED` (ARC chọn "bắt buộc với vai HK") | BR-703-05 |
| S1-M-63 | Q10 FD+ | FD gửi không `periodId` → giữ hành vi cũ (hồi quy BR-703-01…04) | BR-703-01…04 |
| S1-M-64 | US-164 AC4 (a), (d) | Hoàn tất khi hết hạn: số = số server khóa lúc gửi (**792.000**); thân có số tiền/FOC → 422 hoặc bị bỏ qua; số ghi vẫn 792.000 | **BR-416-08** |
| S1-M-65 | US-164 AC8 | Xem lại: miễn 50% → hoàn **396.000** (BR-522); trả lời trong hạn kèm miễn 100% → khách trả 0 | **BR-416-09** |

R3-Q02 (6d): mặc định không mở, không có ca. Nếu Sprint 1 mở đường ghi vào folio đã đóng, QA thêm ca theo BR-522-06.

---

## 3. Nhóm B – Fuzz công nợ R3-Q30

### 3.1 Bộ sinh

- **Nơi chạy:** `product/tests/fuzz/debt-fuzz.ts` (mới, D6–D7).
  - Chạy qua HTTP trên stack CI riêng, có `__test__/clock` và `__test__/jobs/{jobKey}/run` (J15).
  - Mỗi chuỗi dùng **một cơ sở mới** (seed riêng), để chuỗi này không ảnh hưởng chuỗi khác.
- **Chuỗi:** 20–60 bước. Đồng hồ giả tiến 0–6 giờ mỗi bước, lấy mẫu có chủ đích qua 00:00, 05:59, 06:00, `post_checkout_window_until` ± 1 phút.
- **Thao tác** (oracle mục 8), mỗi thao tác chọn vai ngẫu nhiên trong tập hợp lệ + 10% vai sai để kiểm 403:
  - B18 thường / B18 `debt` (hạn hợp lệ hoặc biên);
  - dòng phí sau trả phòng;
  - link: khách trả một phần / đủ / dư;
  - FD thu nợ;
  - đảo khoản thu (trong cửa sổ và trên `closed`);
  - A32 tăng / giảm / void;
  - FOC thường;
  - FOC `debt_write_off`: gửi / tự áp / OWN duyệt / OWN từ chối / tự hủy;
  - J15 đúng giờ hoặc trễ ≤ 1 giờ;
  - thu hồi FOC (chỉ khi R3-FOC-REVOKE đã cài);
  - **đua từng cặp**: hai request bắn cùng lúc, hai thứ tự.
- **Thu nhỏ khi lỗi:** bỏ dần bước để có chuỗi ngắn nhất còn vi phạm. Ghi seed và chuỗi rút gọn vào sổ lỗi.

### 3.2 Hàm tham chiếu `refLedger` (độc lập với mã)

- Chỉ đọc sổ qua API đọc và truy vấn SQL chỉ đọc (role `qa_readonly` trên stack CI):
  - dòng phí, dòng FOC (trạng thái sống/đảo);
  - khoản thu, hoàn đã chi;
  - nhật ký `reservation.debt_on_checkout`;
  - giờ đồng hồ giả;
  - `checked_out_at`, `post_checkout_window_until`.
- Tính B, R, D, O, W và hạn đúng theo bảng mục 1 của oracle. **Không** import mã từ `services/api`. Người viết khác người cài BE.
- Tự kiểm: chạy `refLedger` trên mọi ca nhóm A (S1-M-01…46) phải ra đúng số oracle trước khi dùng cho fuzz.

### 3.3 Họ chuỗi bắt buộc (khoảng hở QC mục 7)

| Mã | Họ | Ràng buộc sinh | Số chuỗi tối thiểu |
|---|---|---|---|
| S1-FZ-01 | Một folio ngắn ngày, mọi thao tác | Ngẫu nhiên đều | 200 |
| S1-FZ-02 | Đua từng cặp (I14) | ≥ 30% bước là cặp đua; gồm cặp SEC D (a)–(c): A32 giảm ‖ A32 giảm, A32 ‖ thu, J15 ‖ đảo | 100 |
| S1-FZ-03 | FOC qua nhánh dòng đêm (S4-35) | FOC trên dòng `room` từng đêm, A32 đổi giá đêm, FOC đăng lại | 50 |
| S1-FZ-04 | Công nợ trên đơn con (B9a, gia hạn OTA) | "Lượt" = đơn gốc; Σ ESC-026 theo chuỗi | 50 |
| S1-FZ-05 | Đơn dài hạn | Cơ sở xóa nợ = giá đêm quy đổi BR-102 | 40 |
| S1-FZ-06 | Hai tổ chức/cơ sở song song | Hai cơ sở chạy xen kẽ; kiểm không rò số, `openDebtVnd` và "Cần chú ý" không lẫn | 40 |
| S1-FZ-07 | Folio `closed`: đảo ‖ thu nợ (RD) | Bắt đầu sau J15; chỉ ba đường tiền (I11) | 50 |
| S1-FZ-08 | Nợ cũ trước 0076 (210) | Mở đầu bằng nợ chèn SQL `debt_opened_at` NULL | 40 |
| S1-FZ-09 | Chia nhỏ xóa nợ + ESC-026 (SEC B.5 ca 1–4) | Nhiều yêu cầu nhỏ, nhiều khóa FOC, nhiều vai | 50 |

Tổng ≥ **620 chuỗi**, khoảng 25.000 bước. Ước lượng ≤ 40 phút trên runner CI. Nếu lâu hơn thì chạy 4 phân mảnh song song, mỗi phân mảnh một stack.

### 3.4 Bất biến và kết luận

- Kiểm I1–I15 (oracle mục 8) **sau mọi bước**. Riêng I12 (hoa hồng) chỉ chạy ở chuỗi có đơn CTV (FZ-01, FZ-04).
- I14 so trạng thái cuối với `refLedger` chạy lại tuần tự theo thứ tự commit do server ghi (`audit_event.occurred_at` + id).
- **Đạt:** 0 vi phạm trên toàn bộ chuỗi + nhóm A đúng số. Bất kỳ vi phạm nào là lỗi tiền **P0**, tới khi DOM + ARC chứng minh bất biến sai (khi đó DOM sửa oracle, không phải QA).

### 3.5 Critic độc lập

- **Người làm:** một agent/vai **không** viết bộ fuzz, không viết `refLedger` và không cài mã (đề xuất: ORC gọi phiên critic như `s4-money-recheck*` của R2).
- **Đầu vào chỉ có:**
  - artifact `money-raw-logs/` (JSONL gốc, không qua tóm tắt của QA);
  - oracle DOM;
  - BR 0.4.0.
- **Việc của critic:**
  - (1) chọn ngẫu nhiên ≥ 30 chuỗi (gồm mọi họ) và mọi chuỗi QA đã đánh dấu vi phạm hoặc đã rút gọn;
  - (2) tự tính lại B, R, D, O, W, hạn từ log gốc **bằng tay hoặc bằng hàm của riêng mình**;
  - (3) so với số trong response và với kết luận của `refLedger`;
  - (4) đọc toàn bộ nhóm A theo log gốc;
  - (5) ghi `rounds/round-03/reviews/s1-money-critic.md`: số chuỗi đọc, lệch, Major.
- **Kết luận lượt kiểm tiền (G1):** 0 lệch tiền, 0 Major của critic, 0 vi phạm fuzz.

### 3.6 Trạng thái harness và kết quả lượt chạy (QA 23/10, nhánh `qa/r3-s1-booking-flaky-fuzz`, mã `origin/main` @ `7100f3b`)

**Mã** ở `product/services/api/test/fuzz/`, dựng trên fixture tiền `test/integration/s438-r8/fixture.ts` (app HTTP thật, PostgreSQL thật, đồng hồ giả, J15 thật, giữ khóa folio để ép thứ tự đua):
- `ref-ledger.ts`: `refLedger`, không import mã sản phẩm;
- `invariants.ts`: I1–I16;
- `runner.ts`: bộ sinh có seed, rút gọn chuỗi, log JSONL từng bước, J15 chạy mỗi giờ;
- `debt-fuzz.test.ts`: điểm chạy;
- `bug-r3-00{2,3,4}.test.ts`: ca tái hiện tất định, chạy với `FUZZ_KNOWN_BUGS=1`.

**Cách chạy** (không chạy trong `pnpm test`):
- `FUZZ=1` (số chuỗi theo 3.3) hoặc `FUZZ=smoke`;
- `FUZZ_BE83=1`: bật I8, I13, I16 và các họ FZ-09…12;
- `FUZZ_Q23=1`: biến I9 thành lỗi cứng, bật khi R3-Q23 gộp;
- `FUZZ_FAMILIES`, `FUZZ_SEED`, `FUZZ_SHRINK=1`, `FUZZ_LOG_DIR`.

**Họ chuỗi** – có: FZ-01, 02, 06, 07, 08, 09, 10, 11, 12 (FZ-12: đang ở → B18, A31/A32 đêm, đổi căn lên/xuống, gia hạn giá gõ, FOC khóa khác; FB-09 chỉ quan sát). Chưa có: FZ-03 (FOC trên chính dòng đêm), FZ-04 (đơn con B9a), FZ-05 (dài hạn), I12 (hoa hồng).

**Lượt chạy:**
- Lượt 2: 610 chuỗi, 23.951 bước, đủ số theo 3.3.
- Lượt 3: 280 chuỗi, 11.713 bước – FZ-09…12 đủ số, FZ-01/02 thêm mỗi họ 50 chuỗi, có thêm mức số tiền "nửa cơ sở" để chạm ngưỡng ESC-026.
- Cả hai lượt: deadlock 0, 5xx 0.
- Ca SEC có hướng (B.5 #1–#4, BB07-1, void rồi xóa lại): xanh.
- Critic độc lập tự tính lại 650/650 chuỗi của lượt 2 từ log gốc: `reviews/s1-money-critic.md`.

**Vi phạm cứng** – cả ba đều có ca tái hiện tất định:

| Bất biến | Số chuỗi (lượt 2 + 3) | Lỗi | Mức |
|
#### 3.7 Lượt fuzz cuối cho G1 – harness đã sẵn (QA 24/10, nhánh `qa/r3-s1-fuzz-final` từ `main` @ `0281e20`)

**Đã đổi so với lượt trước:**
- **`refLedger` theo BR v0.4.3, mục 5.6:**
  - O tính bằng phát lại sự kiện, kẹp [0, max(0, B)] ở **từng thời điểm**. Khoản xóa nợ bị hủy làm nợ sống lại trong giới hạn còn phải thu; nợ đã mất vì B về 0 không sống lại khi B tăng sau đó. Nợ cũ và nợ mới cùng công thức.
  - Bỏ khoản xóa nợ đang chờ duyệt ra khỏi D.
  - Ca có hướng "FZ08-1 / FZ08-3" khớp API và `refLedger`.
  - Chênh còn lại của nợ trước 0076 (công thức cũ `B − W_cũ` của mã) ghi `I3?` kèm nhãn "FZ-08 đã biết – P3, không tính G1" (ARC `s1-ARC-on-fuzz-fixes.md`).
- **BR-433 (e) / I17** (bật bằng `FUZZ_FZ02=1` khi BE-B gộp; trước đó chỉ cảnh báo):
  - yêu cầu hoàn "Tự sinh từ A32": `requested_by` = người làm A32; Σ hoàn từ A32 > cơ sở ⇒ `owner`;
  - không ai duyệt yêu cầu hoàn của chính mình, vai dưới MGR không duyệt;
  - Σ lượt ESC-026 cộng phần A32 giảm sau trả phòng của vai dưới OWN.
  - Ca có hướng FZ02-1/2, 4, 7, 8. FZ02-7 đã đạt; các ca còn lại đỏ đúng dự kiến tới khi BE-B gộp.
- **SEC fuzz-fixes #1–#4** (I8 mở rộng):
  - `debt_write_off` không bao giờ định tuyến hay được duyệt dưới MGR (cả dòng cũ, FB-R3-SEC-FZ-01);
  - tiền dư sau thao tác của người trên folio `settled` = 0 (`FUZZ_K1106=1` khi BE-B gộp ARC bổ sung 3);
  - hết cửa sổ mà còn tiền dư ⇒ phải có "Cần chú ý" `closed_reservation_credit`;
  - J15 không bao giờ đóng folio còn dư (I4).
- **Thao tác mới (ARC mục 13.2):**
  - `qrLate`: QR về muộn dư, lễ tân bấm xác nhận;
  - `sysCredit`: khoản thu không người bấm. Chưa có endpoint đối soát tự động, nên giả lập bằng SQL và ghi rõ nhãn;
  - `refundReq`: FD tạo yêu cầu hoàn trên folio `settled`;
  - `refundApprove`: duyệt, gồm cả vai không được phép;
  - `refundPay`: chi tiền mặt kèm chứng từ.
  - Có trong FZ-01, FZ-02.

**Chạy thử** trên `main` (6 chuỗi × 9 họ + ca có hướng): xanh. Không còn vi phạm cứng; BUG-R3-002/003/004 không tái phát.

**ADD3-01 / I18** (QA 24/10, theo `reviews/s1-ARC-on-add3.md`, `s1-SEC-on-add3.md`, decision-log ORC ADD3-01; bật bằng `FUZZ_ADD3=1` khi BE-B gộp):
- Áp cho folio `settled` có A32 giảm sau trả phòng của vai dưới OWN:
  - (a) mọi yêu cầu hoàn **không** do A32 tự sinh có `required_role = owner`;
  - (b) không ai làm A32 trên folio đó được duyệt bất kỳ yêu cầu hoàn nào của folio;
  - (c) người làm A32 hủy yêu cầu tự sinh của mình thì mọi yêu cầu sau vẫn về owner; OWN đã từ chối một yêu cầu thì mọi yêu cầu sau vẫn về owner.
- Thêm thao tác: người xin (hoặc người khác) hủy yêu cầu hoàn (`refundCancel`); FD/LT trưởng/MGR lập yêu cầu hoàn bằng tay (`refundReq`). Có trong FZ-01, 02, 11.
- Ca có hướng: probe ARC × 2 (OWN từ chối; người xin hủy), SEC P1, SEC P2, ARC "recordPayment dư trên folio có A32 → owner; folio không có A32 → manager".
- Kết quả trên `main` `784db59`, khi BE-B chưa sửa:
  - 4 ca đỏ đúng lỗ ADD3-01 hoặc đúng phần K11-06 chưa gộp;
  - SEC P1 qua: hủy hoặc lập tay không đi tiếp tới bước duyệt;
  - fuzz 4 chuỗi × 9 họ với cờ mặc định: xanh.

**Chỉnh theo quy tắc đã chốt** (BE-B `s1-be-b.md` mục 13, `43abb0b`; QA 24/10, chưa chạy lại vì Docker treo):
- **I4:**
  - khoản thu của người bấm (thu, xác nhận QR) phải đưa toàn bộ tiền dư chưa yêu cầu vào yêu cầu hoàn;
  - A32 chỉ xin phần của lần giảm đó (FZ02-8, quy tắc min): tiền dư chưa yêu cầu **không tăng** qua bước A32;
  - bước trả 4xx không bị kiểm.
- **I17:** nhận diện yêu cầu A32 bằng `refund_source = 'a32'` (0085); kiểm `requested_by ∈ origin_actor_ids`. Không ghép với lần A32 gần nhất nữa.
- **I13 / ESC-026 / I18:** đọc `folio_settled_reduction` (chỉ phần xuống dưới số lúc khách rời – FZ02-9 (b)). Trước 0085 thì dùng audit.
- **Duyệt và từ chối** (thao tác fuzz và mọi ca có hướng) luôn gửi `expectedVersion` (`decideV`).
- **FZ02-4** theo oracle DOM 24/10, đơn 2 đêm: void đêm 1 → `manager`; void đêm 2 → `owner`.

**Lệnh cho lượt đầy đủ** (sau khi BE-B gộp BR-433 (e), ARC bổ sung 3 và ADD3-01; thêm `FUZZ_ADD3=1`):
`FUZZ=1 FUZZ_BE83=1 FUZZ_FZ02=1 FUZZ_K1106=1 [FUZZ_Q23=1 nếu R3-Q23 đã gộp] pnpm --filter @ottimo/api exec vitest run test/fuzz/debt-fuzz.test.ts`
- chạy 5 tiến trình theo họ như lượt 2;
- critic đọc log JSONL gốc.

**Fixture BR v0.4.3:**
- BR-433-22…25 (FZ02-1, 2, 4, 8 – `pendingFix R3-SEC-FZ-02`). DOM đề xuất 16…19, nhưng các số này đã dùng.
- BR-525-44 (FZ08-1, không `pendingFix` – mã đúng).
- BR-525-45 (FZ08-2 – `pendingFix R3-FZ-08`, cần đường thu hồi). DOM đề xuất 42/43, nhưng các số này đã dùng.


#### 3.8 Kết quả lượt fuzz cuối G1 (QA 24/10, `origin/main` @ `91de0e7`)

**Cách chạy:**
- Cờ: `FUZZ=1 FUZZ_BE83=1 FUZZ_FZ02=1 FUZZ_K1106=1 FUZZ_ADD3=1`.
- 5 tiến trình, PostgreSQL 17 riêng, dữ liệu giả.
- Harness có thêm `ambiguousOrder` cho mọi cặp đua giữa một bên ghi nợ và một thao tác bất kỳ trừ `advance` (ARC add3); ca có hướng "QR về muộn trả hết nợ → đóng chu kỳ"; ca quan sát SEC "tăng tay rồi hạ lại".

**Chỉnh harness trong lượt** (theo kết quả lượt 1, cùng seed):
- Cờ `add3` chưa được truyền vào harness, nay đã truyền.
- I18 (b) chỉ xét lần duyệt **sau** lần A32 của chính người duyệt. 22/22 ca bị báo đều duyệt trước khi người đó làm A32.
- O theo đúng công thức DOM clamp(R − D, 0, max(0, B)), bỏ cách kẹp "dính". Hai chuỗi FZ-10 63048 và FZ-11 63008 cho thấy cách kẹp dính lệch công thức.
- I13 xét Σ theo số tại từng lần áp.

**Kết quả lượt 2 (lượt chấm):**
- 610 chuỗi, 24.266 bước; deadlock 0, 5xx 0.
- 482 lần Σ lượt vượt ngưỡng: lần nào cũng báo OWN và có đúng một mục "Cần chú ý".
- Ca có hướng (FZ08, FZ02-1…9, ADD3 ×5, B.5, BB07, QR về muộn): 28/28 đạt.
- Harness báo 0 vi phạm cứng.

**Critic độc lập** (`reviews/s1-money-critic-final.md`, tự tính lại 610 chuỗi, đọc tay 27 chuỗi):
- B lệch 0.
- **1 Blocker – BUG-R3-012 (P0):** J15 chờ hoàn mãi trong khi khách đang nợ. 5 chuỗi.
  - Harness đã ghi nhầm thành cảnh báo khoảng hở J15. Nay đã sửa harness; chạy lại seed 60164 ra I1 + I3 cứng.
  - Có ca tái hiện tất định `bug-r3-012.test.ts`.
- **1 Major – BUG-R3-013 (P1):** yêu cầu hoàn không được tính lại khi tiền dư giảm.
- Cảnh báo còn lại:
  - `I3?`/`I5?`/`I6?`: lỗi của hàm tham chiếu khi đua trong cùng một giây giả. API đúng theo một thứ tự tuần tự; critic xác nhận bằng thứ tự id.
  - `I7?`: FZ-08, P3, không tính G1.
  - `I9?`: R3-Q23 chưa gộp.
- Phần đạt (0 vi phạm): I2, I4, I5, I6, I8/I16 (636 yêu cầu xóa nợ), I15, I17/I18, ESC-026, hai tổ chức không rò số.

**Kết luận G1: CHƯA ĐẠT** – còn BUG-R3-012 (P0) và BUG-R3-013 (P1).
- Đã đóng BUG-R3-002, 003, 004.
- Khi BE-B sửa: chạy lại `bug-r3-012` cùng lượt fuzz đầy đủ (cùng cờ và seed 60000–63000), critic đọc lại log.

---|---|---|---|
| I4 – folio `closed` còn tiền dư | 15 + 4 | BUG-R3-002: tiền dư phát sinh sau B18 (A32 khi O = 0) không thành yêu cầu hoàn; J15 đóng folio | P0 |
| I8 – xóa nợ vượt cơ sở nhưng `required_role` ≠ owner | 0 + 1 (lượt 1: 1) | BUG-R3-003: định tuyến cho lễ tân trưởng; lễ tân trưởng duyệt được | P0 |
| I16 (+ I13 cùng gốc) – MGR tự áp xóa nợ khi không còn đêm phòng sống | 0 + 9 (critic lượt 2: 6) | BUG-R3-004: mã giữ số chụp B18 khi void hết đêm, trái BR-433 (a) | P1 |

**Cảnh báo (`?`, không làm đỏ):**
- `I9?`: R3-Q23 chưa gộp.
- `I3?` / `I5?`: đua hai thao tác ghi tiền trong cùng một giây giả. Critic xác nhận API đúng theo thứ tự chạy thật.
- `I1?` / `I3?` trong khoảng hở trước J15: FB-R3-QA-ARC-01.
- `FB09?`: quan sát theo SEC – Σ vượt cơ sở **sau** khi cơ sở giảm.

**Kết luận lượt kiểm tiền (G1): CHƯA ĐẠT.**
- Còn 2 lỗi tiền P0 và 1 lỗi P1.
- I9 chờ R3-Q23.
- Đạt: FB-07 (FZ-10, FZ-12 trước và sau B18, BB07-1…7 test BE), B.5 #1–#4, ESC-026 khi cơ sở > 0, hai tổ chức không rò số.

**Giả định cần DOM xác nhận:** FB-R3-QA-DOM-01, FB-R3-QA-DOM-02 ý 2. Ý 1 đã rút – xem BUG-R3-004.

---

## 4. Nhóm C – Bảo mật bắt buộc

### 4.1 A.7 – US-143 / SR-AUTH-06 (16 ca SEC + E2E)

Stack có `MFA_ENFORCED=true` cho bộ 2FA. Mã TOTP sinh **trong test** từ URI đăng ký (thư viện TOTP, không in ra log). Quét log ở ca 12.

| Mã | Ca SEC A.7 |
|---|---|
| S1-SEC-01 | 1 – mật khẩu đúng, không TOTP → không có phiên; `/v1/me` bằng `mfaToken` → 401 |
| S1-SEC-02 | 2 – TOTP đúng → phiên mới, cookie cũ chết, `amr = totp` |
| S1-SEC-03 | 3 – bước −1, 0, +1 nhận; −2, +2 từ chối (đồng hồ giả – S1-CLK-14) |
| S1-SEC-04 | 4 – cùng mã dùng 2 lần, kể cả 2 request song song → lần 2 `401 MFA_INVALID` |
| S1-SEC-05 | 5 – `mfaToken` dùng lại → 401; sau 5 phút → 401; 5 sai trên một token → token chết |
| S1-SEC-06 | 6 – 5 TOTP sai → khóa tạm; 3 khóa/24 giờ → khóa cứng; `security_alert` cho OWN; phiên đang sống **không** bị đá |
| S1-SEC-07 | 7 – body lỗi giống hệt cho 5 nhánh (so byte-by-byte, bỏ `traceId`) |
| S1-SEC-08 | 8 – mã khôi phục dùng 1 lần; 2 request song song → đúng 1 thành công; email (mock) + thông báo + audit; còn ≤ 3 → nhắc |
| S1-SEC-09 | 9 – `MFA_ENFORCED`: MGR chưa bật → chỉ 5 endpoint 06.4 trả 200, `GET /reservations` → `403 MFA_ENROLLMENT_REQUIRED`; đăng ký xong → phiên mới |
| S1-SEC-10 | 10 – vai bắt buộc `disableMy2fa` → 403; FD tự nguyện → tắt với S2, mọi phiên bị thu hồi |
| S1-SEC-11 | 11 – S2: đổi tài khoản nhận / đổi vai lên MGR với mật khẩu không TOTP → 422 `STRONG_REAUTH_REQUIRED` hoặc 401 theo ARC 1.2; TOTP đã dùng cho thao tác trước → 401 |
| S1-SEC-12 | 12 – quét `audit_event`, `idempotency_key`, `outbox_message`, Problem, log stdout API/worker của cả bộ test: 0 lần xuất hiện mã TOTP, mã khôi phục, `mfaToken`, bí mật, `otpauth://` (so với tập giá trị test đã sinh) |
| S1-SEC-13 | 13 – gửi lại `POST /v1/me/2fa/setup` / F5 → bí mật **mới**, QR cũ hết hiệu lực; `confirmMy2fa` lần 2 → 409; không có `idempotency_key` cho 3 endpoint |
| S1-SEC-14 | 14 – US-164: duyệt từ phiên chưa qua bước 2 (người có `mfa_enabled`) → 401; PIN sai 5 lần → khóa duyệt; hết hạn → nhánh 06.30 (S1-M-64) |
| S1-SEC-15 | 15 – SR-AUTH-11: người xác nhận tại quầy có `mfa_enabled` chỉ đưa mật khẩu → 401 đồng nhất; PIN hoặc mật khẩu + TOTP → được |
| S1-SEC-16 | 16 – E2E admin-web: đăng ký (quét URI), đăng nhập 2 bước, nhập mã khôi phục, màn hạn chế 06.4, câu `auth.enroll.single_owner`; axe 0 nghiêm trọng; một ca đồng hồ giả |

Thêm cho AC3 (b) của US-143: **lệnh quản trị** khôi phục chạy trên stack CI. Kiểm audit `mfa.reset_by_operator`, email mock, phiên cũ 401. Ca nằm trong S1-SEC-16 phần CI. Test không chép thủ tục xác minh.

### 4.2 B – sáu thẻ SEC + R3-Q15

| Mã | Thẻ | Ca |
|---|---|---|
| S1-SEC-17…18 | B.1 BE-65 | `sec-be65-retention` 9 ca + `registration-party-removal` 18 ca xanh trên commit gộp, DB migrate từ đầu; ca P1 gốc (J16 trước hạn còn ảnh, sau hạn + 1 ngày → `purged_at`, GET 404) |
| S1-SEC-19…23 | B.2 BE-74 | 5 ca: (a)/(b) theo lựa chọn BE-C; sau J25 không còn cột định danh (kiểm **từng cột** bảng `guest`); khách quay lại cùng SĐT không tạo hai hồ sơ sống; migration bù chạy 2 lần không đổi thêm; audit chỉ số đếm |
| S1-SEC-24…28 | B.3 BE-75 | 5 ca: đơn hủy 14 tháng; no-show và thành viên bị bỏ; hồ sơ không gắn đơn; **hai cơ sở cùng tổ chức**, có đơn mở ở B → không ẩn danh; hồi quy `checked_out` gần |
| S1-SEC-29…35 | B.4 BE-79 | 7 ca đúng thẻ (A → B gỡ khóa/last4; P05 về trước đó + audit không số giấy tờ; B có/không P05; B quay lại gắn B; A → B → A; ép lỗi giữa giao dịch; CHECK `convalidated`) |
| S1-SEC-36…44 | B.5 BE-83 | 9 ca SEC = S1-M-18…24 + ESC-026 (S1-M-27) + gỡ `pendingFix` R3-SEC-BE-83 + đưa ca 1–4 vào fuzz (S1-FZ-09) |
| S1-SEC-45…46 | B.6 BE-84 (a1) | "Cần chú ý" `attachment_retention_anchor_missing`: OWN/MGR thấy đúng số đếm, FD/HK không; hết ảnh thiếu mốc → mục biến mất; J16 không xóa ảnh thiếu mốc |
| S1-SEC-47…48 | B.7 R3-Q15 | = S1-Q15-01, 02 (mục 7.2) |

### 4.3 C – R3-Q51 tài khoản nhận VietQR

| Mã | Ca |
|---|---|
| S1-SEC-49 | RBAC 4 vai cho đọc lịch sử / đặt / hủy dòng lên lịch: OWN 200; MGR, FD, HK 403; `listParameters` của vai khác không có khóa |
| S1-SEC-50 | Quét JSON mọi đường đọc (hiện hành, lịch sử, dòng lên lịch, audit, thông báo, SSE, outbox, `idempotency_key`, log): chỉ `•••• 1234` + `bankName`; số đầy đủ chỉ có trong `qrPayload` |
| S1-SEC-51 | Đặt với mật khẩu sai → 401, không ghi; thiếu TOTP khi đã bật 2FA → 422 `STRONG_REAUTH_REQUIRED` |
| S1-SEC-52 | `effectiveFrom` = ngày kinh doanh → 422 `EFFECTIVE_FROM_TOMORROW` (kể cả lần đặt đầu; ca 02:40 ở S1-CLK-26) |
| S1-SEC-53 | Đặt + hủy → 2 dòng audit `money` che số; thông báo OWN/MGR; email mock cho mọi owner; hủy dòng đang hiệu lực → 409 |
| S1-SEC-54 | QR sinh ngày hiệu lực có cảnh báo `pay.receiving_account_changed`; sau 24 giờ không còn (đồng hồ giả) |
| S1-SEC-55 | E2E: ô số không điền sẵn, `autocomplete=off`; ô xác nhận khác → không cho lưu; rời màn rồi quay lại → form trống; `localStorage`/`sessionStorage` không có số |
| S1-SEC-56 | Kiểm đầu vào `parseReceivingAccount` (BIN 6 số, 6–19 chữ số, tên NAPAS, chặn số thẻ trong tên, trường thừa); không có số trong URL/query |
| S1-SEC-57 | axe 0 nghiêm trọng; không có nút "xem đầy đủ số"; chữ theo brand OTTIMO |

### 4.4 D – điều kiện SEC trước khi gộp 208

| Mã | Điều kiện SEC D |
|---|---|
| S1-SEC-58 | 3 (a) A32 tăng lặp rồi giảm vẫn 409; `openDebtVnd` chỉ giảm khi thu tiền hoặc xóa nợ đã duyệt (= S1-M-13) |
| S1-SEC-59 | 3 (b) biên = B − O được, +1 đồng 409 (= S1-M-12) |
| S1-SEC-60 | 3 (c) hai A32 giảm song song cộng lại vượt W → đúng một 409 (đọc dưới khóa folio 16.19) |
| S1-SEC-61 | 3 (d) `openDebt` trả `null` khi 0 không làm mất kiểm tra ở xóa nợ (S1-M-15) và J15 |
| S1-SEC-62 | 4 – mọi đường ghi `folio_line` trên `settled` trong cửa sổ (A32 tăng/giảm, void, đảo, đổi giá, chuyển dòng, FOC đăng lại): mỗi lần giảm được phép có audit vai, số giảm, `openDebtVnd` trước/sau; không đường nào giảm phần đã thành nợ |
| S1-SEC-63 | 5 – `Folio.totals.openDebtVnd`: chỉ FD+ (ca RBAC tự sinh) |

Điều kiện 1 (thứ tự), 2 (SEC review head SHA) và 6 do SEC/ORC kiểm. QA chỉ xác nhận CI xanh trên head SHA đó.

### 4.5 E – Dependabot

| Mã | Ca |
|---|---|
| S1-SEC-64 | Unit `useAfterLoginPath` (FE-A): `/\\evil.example`, `//evil.example`, `/%5Cevil.example`, `/overview\\@evil.example`, `https://evil.example` → luôn về `homePath`. QA review PR |

---

## 5. Nhóm D – Ca đồng hồ giả (đề xuất plan R3 mục 6)

Quy tắc:
- Đặt giờ bằng `setClock` (`e2e/support/clock.ts`: `freeze` rồi `set`), giờ Asia/Ho_Chi_Minh.
- Mỗi ca kiểm **ngay trước** và **ngay tại/sau** mốc.
- Chạy trong **mọi lượt CI push** (dự án `clock` / `ui-clock`).
- Màn mới có ô ngày hoặc gọi API theo ngày phải có ít nhất một ca ở đây (quy tắc đề xuất cho QC).

### 5.1 J4 – quá giờ trả phòng (US-031 AC3, R3-Q13)

| Mã | Mốc | Kỳ vọng |
|---|---|---|
| S1-CLK-01 | Căn có khách đến hôm nay, 11:59:59 → 12:00:00 | 11:59 không có thông báo `checkout_overdue`; 12:00 FD trong ca + MGR nhận (chuông + SSE), nội dung số căn, mã đơn, "có khách đến hôm nay", không tên/SĐT |
| S1-CLK-02 | Không có khách đến, 12:30:59 → 12:31:00 | 12:30 không có; 12:31 có (sau ân hạn BR-412) |
| S1-CLK-03 | Chạy J4 lại lúc 12:05 và 13:00 | Không gửi trùng (một thông báo/đơn/ngày) |
| S1-CLK-04 | Đơn đã trả phòng, đã gia hạn, đã xác nhận trả muộn trước mốc | Không gửi |
| S1-CLK-05 | Ngày đi = **ngày nghiệp vụ**: đơn đi 21/10, đồng hồ 21/10 05:59 (ngày nghiệp vụ 20/10) | J4 không tính đơn này là "đi hôm nay" |
| S1-CLK-06 | FD hết ca / không trong ca lúc 12:00 | Chỉ FD đang trong ca + MGR nhận |

### 5.2 US-164 – 15 phút (AC4) và 24 giờ (AC8)

| Mã | Mốc | Kỳ vọng |
|---|---|---|
| S1-CLK-07 | Gửi 20:32:00; 20:46:59 / 20:47:00 | 20:46:59: `pending`, **không** có nút "Hoàn tất – thu đúng số máy tính" (UI + API 409); 20:47:00: `expired`, có nút. [GIẢ ĐỊNH QA] mốc 15:00 phút là đã hết hạn – ARC xác nhận |
| S1-CLK-08 | MGR duyệt lúc 20:47:01 | 409 `CONFIRMATION_EXPIRED` |
| S1-CLK-09 | FD hoàn tất 20:48; MGR trả lời 20:50 | Yêu cầu đã đóng; MGR thấy "đã hoàn tất theo quy tắc hết hạn"; AC8 mở |
| S1-CLK-10 | Tham số `remote_confirm_timeout_minutes` = 5 và 60 (biên), 4/61 → 422 | Mốc hết hạn theo tham số; chỉ OWN đổi được |
| S1-CLK-11 | Đêm ngày đi trở nên bán được giữa lúc gửi và lúc hoàn tất (có đơn mới vào căn) | Server từ chối nhánh 06.30 (đọc dưới khóa) → đường "Trả phòng – tính thêm 1 đêm" |
| S1-CLK-12 | Hoàn tất 20:47; 20:46:59 và 20:47:00 ngày hôm sau | Mục "Cần chú ý" `late_fee_post_review` đổi sang đỏ đúng lúc 24:00 giờ; OWN được báo (BR-416-09 `notReviewed`) |
| S1-CLK-13 | Xem lại 19/04 09:00, miễn 50% | Hoàn 396.000 qua BR-522; "Đã xem – giữ nguyên" đóng mục; tham số `late_fee_post_review_hours` 12/48 biên |

### 5.3 TOTP và thời hạn bảo mật

| Mã | Mốc | Kỳ vọng |
|---|---|---|
| S1-CLK-14 | Bước TOTP −2, −1, 0, +1, +2 | Chỉ −1, 0, +1 nhận (S1-SEC-03) |
| S1-CLK-15 | Giây 29 → 30 của một bước; dùng mã bước N rồi mã bước N−1 (vẫn trong ±1) | Mã bước ≤ bước đã dùng → 401 (chống phát lại `mfa_last_used_step`) |
| S1-CLK-16 | Hai thao tác S2 trong cùng 30 giây | Thao tác 2 cần mã bước kế tiếp (ARC 1.2); FE hiện "Chờ mã mới" |
| S1-CLK-17 | `mfaToken` 4:59 / 5:00 | 4:59 dùng được; 5:00 → 401 `MFA_INVALID` |
| S1-CLK-18 | 5 sai trong 14:59 phút / 5 sai trải 15:01 phút | Lần 1 → 429; lần 2 không 429 |
| S1-CLK-19 | 3 lần khóa trong 23:59 giờ / trải 24:01 giờ | Lần 1 → khóa cứng; lần 2 không |

### 5.4 R3-Q39 – mốc 02:40 / 05:59 / 06:00

| Mã | Ca | 02:40 (ngày nghiệp vụ hôm trước) | 05:59 | 06:00 |
|---|---|---|---|---|
| S1-CLK-20 | #8 giá niêm yết (BR-010-05) | `effectiveFrom` mặc định 19/10, đêm 19/10 = 700.000 | như 02:40 | mặc định 20/10 |
| S1-CLK-21 | #9 tham số (BR-010-06) | dòng 20/10 "đã lên lịch" | như 02:40 | dòng 20/10 "đang hiệu lực" |
| S1-CLK-22 | #10 tủ minibar (BR-010-07) | tủ 202 | tủ 202 | tủ 203 (chặng chứa 20/10) |
| S1-CLK-23 | #11 hạn công nợ (BR-525-43) | mặc định ngày nghiệp vụ + 3; nhỏ nhất + 1 | như 02:40 | dịch một ngày; quá hạn đổi đúng 06:00 |
| S1-CLK-24 | #12 gợi ý "đã thực hiện" (BR-010-08) | no-show `≤` ngày nghiệp vụ | như 02:40 | theo ngày mới |
| S1-CLK-25 | Bộ có sẵn: TC-X-088, TC-L2-109, TC-L2-110, TC-L6-060 | 3 mốc mỗi ca | | |
| S1-CLK-26 | R3-Q51 `effectiveFrom` (S1-SEC-52) | đặt hiệu lực 20/10 lúc 02:40 ngày 20/10 (ngày nghiệp vụ 19/10) → **được** (= ngày nghiệp vụ + 1) | như 02:40 | 422 |

S1-CLK-20…26 chạy ở 3 mốc → 21 lượt. S1-CLK-25 gồm 4 ca có sẵn × 3 mốc = 12 lượt (đã tính trong 21 lượt ở dòng 25 khi đếm theo ca).

### 5.5 Các mốc khác của Sprint 1

| Mã | Ca |
|---|---|
| S1-CLK-27 | Hạn công nợ 3 ngày (BR-525 (i)): ghi lúc 23:59 và 00:00 cùng ngày nghiệp vụ → cùng hạn |
| S1-CLK-28 | J15 trễ 59 phút vs đúng giờ: cùng kết quả tiền (fuzz FZ-01 phủ thêm) |
| S1-CLK-29 | R3-Q15: `note` còn ở `retention.guest_request_months` − 1 ngày, mất ở + 1 ngày (S1-Q15-01) |
| S1-CLK-30 | US-143 AC3 (a) còn ≤ 3 mã: nhắc ở mỗi lần đăng nhập kế (không phụ thuộc giờ, chạy cùng bộ clock vì phiên theo `Clock.now()`) |
| S1-CLK-31 | Web Push/SSE US-164 khi điện thoại quản lý mất mạng 16 phút (mô phỏng) → đã hết hạn khi mở; màn duyệt hiện "đã hết hạn" |
| S1-CLK-32 | Mã cửa 8 số US-128 theo ngày lưu trú dự kiến: hiệu lực từ giờ nhận phòng tới giờ trả phòng (mốc theo BR-403 0.3.9 – ca chỉ kiểm mốc, không ghi cách đặt mã) |
| S1-CLK-33 | Hàng chờ yêu cầu website R3-Q06: job `web_request.stale` 06:05 (06:04/06:05) |

Tổng nhóm D: **33 ca**, khoảng **51 lượt** khi tính các mốc.

---

## 6. Nhóm E – Hồi quy ESC-023 A "phí 0"

| Mã | Ca | Fixture |
|---|---|---|
| S1-REG-01 | Rút ngắn 07/11 (còn 2 ngày) 9–16/11 → 9–11/11: xem trước **không có dòng phí**, lệnh ghi không có dòng phí | BR-309-19 |
| S1-REG-02 | Khách đến ở, không phát sinh → hoàn **16.000** lúc trả phòng | BR-309-19 |
| S1-REG-03 | Biến thể minibar 35.000 → khách trả thêm **19.000** | BR-309-19 |
| S1-REG-04 | Rút 07/11 rồi 08/11 hủy → phí **1.584.000**, hoàn **16.000** | BR-309-20 `lateShorten` (= BR-309-11 x6bLate) |
| S1-REG-05 | Rút 02/11 (7 ngày) rồi 08/11 hủy → phí **500.000**, hoàn **1.100.000**; Desk không hiện chữ "phí rút ngắn" ở bất kỳ màn nào (UI) | BR-309-20 `earlyShorten` |

Không có `pendingFix` (DOM: đạt ở R2). Đỏ → P0 (ai đó cài nhầm phương án B).

## 7. Nhóm F – R3-Q15 (US-109 AC3, US-110 AC4)

| Mã | Ca |
|---|---|
| S1-Q15-01 | Trước hạn còn `note`; sau hạn (J16/T13) `note` rỗng; dòng yêu cầu, loại, trạng thái, phí giữ nguyên; Desk và trang khách hiện "Ghi chú đã xóa theo hạn lưu"; `purge_journal` có id; audit chỉ số đếm |
| S1-Q15-02 | Phiếu sửa/việc HK/việc lễ tân sinh từ yêu cầu không còn bản sao chữ của khách (Desk + API PWA) |
| S1-Q15-03 | PWA offline giữ bản cũ → lần đồng bộ kế tiếp xóa chữ (E2E PWA, mạng tắt rồi bật) |

---

## 8. Fixture đã thêm vào `br-examples.json` (BR 0.4.0)

- `source.version` 0.3.8 → **0.4.0**; `updated` 22/10.
- Validator `tools/validate-fixtures.mjs`: **0 lỗi**. Trước khi thêm có 1 lỗi: BR-437 mới của DOM chưa có dòng oracle; dòng BR-437-01 đóng lỗi này.
- `gen_traceability.py --strict`: exit 0. prettier: xanh.

| Id | Ca | `pendingFix` |
|---|---|---|
| BR-010-05…08 | R3-Q39 #8, #9, #10, #12 | R3-Q39 |
| BR-309-19, 20 | ESC-023 A phí 0; rút rồi hủy | – |
| BR-309-21…24 | Q01-b, c, d, e | R3-OTTIMO-FAULT-CANCEL |
| BR-309-25, 26 | Q01-f, Q01-h (QA thêm) | R3-OTTIMO-FAULT-CANCEL |
| BR-416-08, 09 | ESC-024 B hết hạn 15 phút; xem lại 24 giờ | R3-US-164 |
| BR-433-06…09 | E26-1…4 | R3-ESC-026 |
| BR-433-13, 14 | E26-5, E26-9 (QA thêm) | R3-ESC-026 |
| BR-433-10…12 | E26-6…8 thu hồi (dời Sprint 2) | **R3-FOC-REVOKE** |
| BR-437-01 | Chủ đầu tư tạm mất đăng nhập | R3-US-164 |
| BR-525-36, 37 | 210-A (+ tiếp, + 210-C), 210-B (+ tiếp) | BUG-R2-210 |
| BR-525-38 | 209-D đua | BUG-R2-209 |
| BR-525-39, 40 | 208-E, 208-F | BUG-R2-208 |
| BR-525-41, 42 | Q23-17a/b/c, Q23-18a/b | R3-ARC-BE-S4-17-18 |
| BR-525-43 | #11 hạn công nợ | R3-Q39 |
| BR-703-05 | Q10-a…f | R3-Q10 |

**Đánh lại id so với đề xuất DOM mục 9** (id DOM đề xuất đã có dòng khác):

| DOM đề xuất | Đã có trong fixture | QA dùng |
|---|---|---|
| BR-525-34, 35 (210-A, 210-B) | G-6, N-13 | BR-525-36, 37 |
| BR-525-36 (209-D) | – | BR-525-38 |
| BR-525-37, 38 (208-E, F) | – | BR-525-39, 40 |
| BR-525-39, 40 (Q23) | – | BR-525-41, 42 |
| BR-525-41 (#11) | – | BR-525-43 |
| BR-703-03 (Q10) | K11-09 | BR-703-05 |
| BR-433-10 `R3-ESC-026-REVOKE` | – | giữ id, đổi mã thành `R3-FOC-REVOKE` (theo ARC 5.4 + ORC) |

**Gỡ `pendingFix` sau này** (QA làm trong PR gộp, sau khi chạy xanh trên CSDL riêng):
- BR-309-18…26 khi gộp R3-Q01;
- BR-433-04/05 và BR-525-21…27 khi gộp BE-83;
- BR-525-02, 33, 38 khi gộp 209;
- BR-525-29…32, 39, 40 khi gộp 208;
- BR-525-36, 37 khi gộp 210;
- các mã R3 khác theo mục.

---

## 9. Điểm lệch giữa các vai (QA ghi, không phải ESC)

| # | Lệch | Ai chốt | Ảnh hưởng test |
|---|---|---|---|
| 1 | Id đề xuất ở oracle mục 9 trùng dòng đã có (BR-525-34/35, BR-703-03) | DOM xác nhận bảng đánh lại ở mục 8 | Không đổi số |
| 2 | BR-416-09: DOM ghi "FOC 396.000" khi xem lại; ARC 2.2 ghi miễn sau hậu kiểm qua **A32** (mã lý do `late_fee_waived_post_review`); backlog AC8 ghi "đường miễn giảm có sẵn trong hạn mức BR-433" | DOM + ARC | QA chỉ kiểm số (hoàn 396.000, khách trả ròng 396.000) và có yêu cầu hoàn; cơ chế chờ chốt. Ảnh hưởng báo cáo FOC (DATA) |
| 3 | BR-416-09: oracle DOM ghi báo OWN khi "quá 19/04 20:30" (theo giờ rời); US-164 AC8 tính 24 giờ từ lúc hoàn tất (20:47) | DOM | QA dùng 20:47 (AC8) tới khi DOM xác nhận |
| 4 | Mốc hết hạn 15 phút: `expired` ⇔ `now ≥ expiresAt` hay `>` | ARC | S1-CLK-07 theo `≥` [GIẢ ĐỊNH QA] |
| 5 | Tên `pendingFix` thu hồi: DOM `R3-ESC-026-REVOKE`, ARC/ORC `R3-FOC-REVOKE` | – | Đã dùng `R3-FOC-REVOKE` |
| 6 | US-164 dùng tài nguyên `ManagerConfirmation` thay `approval_request` (SEC 06.29) | SEC xác nhận (ARC đã nêu) | Ca S1-SEC-14 viết theo hợp đồng ARC |
| 7 | Q10-f: DOM để hai lựa chọn mã trạng thái; ARC chọn 422 `REQUIRED` cho vai HK | – | Theo ARC |

## 10. Chưa test được ở bước này và vì sao

- **Chưa chạy ca nào trên mã mới:** chưa có PR Sprint 1 gộp. Bước này chỉ chuẩn bị ca và oracle.
- `refLedger` và bộ sinh fuzz: viết D3–D7, chạy D8. Cần stack CI có role `qa_readonly` (OPS thêm). [GIẢ ĐỊNH QA] OPS cấp được trong Sprint 1.
- E26-6…8: hợp đồng thu hồi dời Sprint 2 (0.3.9).
- US-128, US-141, US-161/162, R3-Q13 (loại thông báo), R3-Q01 (`property_fault`): chờ "0.3.8 bổ sung 1" của ARC (D3). Ca ở đây viết theo AC; test viết khi hợp đồng có.
- Email: adapter mock. Gửi thật ngoài phạm vi Sprint 1.
- Màn duyệt trên điện thoại (Desk đáp ứng): Playwright 360/390 px. Thiết bị iOS thật cho Web Push chưa có; dùng SSE + hộp thông báo làm đường kiểm. Không cần ESC lúc này.
- **R-6 A1 phần 2 (staging, `OTM-00239`) chưa chạy trong phiên này.** QA không đăng nhập staging bằng mật khẩu đọc từ máy khi yêu cầu chỉ do agent chuyển lời. Cần INV xác nhận trực tiếp trong phiên chính, hoặc INV/PO tự đăng nhập. Xem báo cáo QA gửi ORC.

## 11. Truy vết

- Khi mã gộp, ca chuyển vào `product/tests/test-cases/r1-main-flows.md` theo nhóm có sẵn:
  - S1-M → TC-L4-159…;
  - S1-SEC → TC-SEC-031…;
  - S1-CLK → TC-X-089…;
  - S1-REG → TC-L2-111…;
  - S1-Q15 → TC-L7-034….
- AC R3 giữ nhãn `[Dời R3 – R3 Sprint 1]`, nên không đổi số Must R2.
- `gen_traceability.py --strict` chạy lại ở mỗi PR thêm TC.
