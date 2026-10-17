# Báo cáo kiểm thử Sprint 4 – Round 2 (QA)

- Bước: **Sản xuất / Kiểm thử song song – D1**
- Người làm: QA
- Ngày: 17/10/2026, ~17:00–19:40
- Bản kiểm: **HEAD `94c711d`** (nhánh chính; bản sửa BE-A/BE-B Sprint 4 chưa gộp)
- Hợp đồng: OpenAPI **0.3.7** (đóng băng D1). Quy tắc: BR v0.3.6. Oracle: `product/tests/fixtures/br-examples.json`.
- Kế hoạch: `qa/s4-test-plan.md`. Lỗi: `qa/bug-list.md` mục 11 (11.4 đối chiếu cây làm việc). Mục 5: cập nhật 17/10 tối.
- Báo cáo này cập nhật theo từng mốc D3 / D5 / D7 / D8.

## 0. Kết luận D1

| Hạng mục | Kết quả |
|---|---|
| Ca tự động cho 7 lỗi tiền 055…061 | **Có trong repo, cả tầng API và tầng đồng hồ**. Mỗi lỗi ≥ 1 ca đọc oracle (`bug-list.md` cột Trạng thái) |
| Ca cho quy tắc mới | Có cho S4-21 (BR-429-03…10), S4-04, S4-23 (BR-434-11/12), S4-35, BR-402-01, B-6 `expectedVersion`, tập đóng `AuditEvent.action` |
| Chạy trên HEAD `94c711d` | API 2 lượt × 55 ca và clock 13 ca, **0 lệch dự kiến, 0 chập chờn**. Mọi ca lỗi đã biết hỏng đúng chỗ của lỗi; mọi ca hồi quy xanh |
| Bài học BUG-R2-064 | `test.fail` chỉ còn ở dòng đầu ca qua `support/known-bugs.ts`; bước dựng dữ liệu hỏng thì ca đỏ thật (đã kiểm). BUG-R2-064 **Fixed**, chờ CI |
| CI 39028814256 (`cc218b2`) – TC-L7-010 | **Lỗi ở test, không ở API hay `0055`** (BUG-R2-105, P1). Bản sửa test đã có trên cây làm việc, QA đã rà và chạy 3/3 qua bước chụp. BE-C không cần sửa API cho ca này |
| Lỗi mới | **BUG-R2-104** (P2, BE-B): giảm giá đặc biệt luôn định tuyến lên quản lý. **BUG-R2-105** (P1, QA): mục trên |
| Lỗi tiền | 055…061 **vẫn Open** – bản sửa chưa gộp. Không hạ mức lỗi nào |
| Bước kiểm CI ở máy | `gen_traceability.py --strict` exit 0 (254/254 AC, 443 TC); `gen_rbac_cases.py --check` OK; `validate-fixtures.mjs` 0 lỗi; Prettier, ESLint, tsc `@ottimo/tests` xanh |
| ESC | **Không lập.** Mọi P0 còn hạn trong Sprint 4, có ca kiểm và người sửa |

## 1. Đã kiểm gì, kiểm thế nào

### 1.1 Môi trường
- Stack dùng một lần `ottimo-qa-s4`:
  - ảnh api dựng bằng `git archive` từ HEAD `94c711d`, `INCLUDE_TEST_SUPPORT=1`;
  - compose chuẩn + file đổi cổng (43000 / 45432 / 48081–48083);
  - seed DS-E;
  - không đụng demo hay stack của vai khác.
- Playwright 1.63, `CI=true`, `E2E_COMPOSE_CONTROL=1`, `--retries=0`.
- Ca đồng hồ chạy `--project=clock --no-deps`. Thứ tự và đồng hồ giống CI, chỉ bỏ các project đứng trước.

### 1.2 Kết quả theo tệp

| Tệp | Ca | Đạt | Hỏng đúng dự kiến (lỗi đã biết) | Lệch dự kiến |
|---|---|---|---|---|
| `e2e/api/money-s4.api.spec.ts` | 34 | 7 (hồi quy) | 27 | 0 |
| `e2e/api/checkin.s3.api.spec.ts` (gồm TC-L3-032 (a)(b) tách mới) | 21 (gồm 2 bỏ qua có chủ đích từ Sprint 3) | 17 | 2 (BUG-R2-033) | 0 |
| `e2e/clock/money-s4.clock.spec.ts` | 9 | 1 (TC-L4-098 (a)) | 8 | 0 |
| `e2e/clock/checkin.s3.clock.spec.ts` – TC-L3-011, TC-L3-074 và hai ca tách | 4 | 2 | 2 (BUG-R2-038, BUG-R2-054) | 0 |
| `e2e/ui/guest-web.h18.spec.ts` (bản sửa BUG-R2-105, ảnh web cũ) | 4 × 3 lượt | bước chụp 3/3 | – | xem 1.4 |

### 1.3 Lượt chẩn đoán: ca hỏng có đúng lỗi không
Đặt `E2E_FIXED_BUGS` = mọi mã thì ca lỗi đã biết chạy như "phải đạt" và in hết chỗ hỏng (gồm cả `expect.soft` của trường hợp đồng mới).

| Mã | Chỗ hỏng đầu tiên về tiền |
|---|---|
| BUG-R2-055 | B7 kéo 7 đêm đơn CTV có FOC 1.000.000 → **500 `INTERNAL_ERROR`** |
| BUG-R2-056 | BR-434-07: FOC về **900.000**, không khôi phục 1.000.000. BR-434-08: FOC phụ thu người **0** khi quay lại 4 người lớn |
| BUG-R2-057 | BR-424-04: đêm ngày 2 còn **250.000** (cộng dồn, không so căn gốc) |
| BUG-R2-058 | BR-429-08: phụ thu người giữ **300.000** sau nâng hạng 202 → 302 |
| BUG-R2-059 | BR-434-09: duyệt xong FOC áp **0**. BR-434-10: yêu cầu vẫn **`pending`** khi đêm bị bỏ. BR-433-03 / hủy đơn: không có `focState`, không audit `folio.foc_cancelled` |
| BUG-R2-060 | BR-315-06: no-show không trả hạn mức (1.200.000 thay vì 1.500.000); khôi phục không đưa FOC về |
| BUG-R2-061 | BR-412-15: FOC **0** (đúng 210.000). BR-412-16: FOC **210.000** (đúng 350.000). BR-412-17: duyệt mà FOC áp **0** |
| S4-21 | `previewMoveReservation` **404**; `moveReservation` không đòi `applyDifference`, bỏ qua `expectedDeltaVnd` (lưu với số sai vẫn 200) |
| S4-04 | B14 302 → 202, FOC 917.000: xem trước **−125.000**, ghi thật **0** |
| S4-23, S4-35 | Chờ S4-21 (xem trước); `effectiveAmountVnd` chưa có |
| B-6 | Duyệt/từ chối hoàn **không** gửi `expectedVersion` vẫn 200; `ApprovalRequest.version` không có trong danh sách |
| BUG-R2-038 | `CheckInPreview.amountDueAtCheckinVnd` không có; `checkIn.payment` chưa nhận |
| BUG-R2-104 | Giảm giá đặc biệt 300.000 tạo với `requiredRole = manager` |

Trường hợp đồng 0.3.7 D1 (`focState`, `effectiveAmountVnd`, `lineChangedNote`, `autoCancelReason`, `ApprovalRequest.version`) chưa có trong phản hồi của HEAD. Đây là phần việc của S4-02/S4-18/S4-22 (BE-B) và B-6.

### 1.4 CI 39028814256 – TC-L7-010
- **Log CI:** cả hai lượt hỏng ở `getByRole('button', { name: 'Chụp' }).nth(1)` (hết 90 giây).
- **Trace:** lệnh tải ảnh khách 1 xong trước lệnh bấm 6 ms. Khi đó ô khách 1 chỉ còn "Gửi lại" (đúng thiết kế), nên chỉ còn một nút "Chụp".
- **Không do API hay migration:** mọi lệnh API 2xx; PostgreSQL không có lỗi CHECK; `cc218b2` không đổi `apps/` hay `tests/e2e/`.
- **Đã có từ trước:** ca đã chập chờn cùng chỗ ở CI 38980363276.
- **Bản sửa trên cây làm việc** (không do QA viết, QA đã rà): chọn nút theo `aria-describedby` của từng khách, chờ tải xong.
- **QA chạy lại:** 3 lượt trên stack QA, cả 3 qua bước chụp của 2 khách.
  - Bước cuối hỏng vì ảnh web cũ chưa có chuỗi `guest.oci.done_title` UXD mới đổi trên cây làm việc. Đây là giới hạn môi trường của QA, không phải lỗi.
  - Có 1 lượt TC-L7-010 và 1 lượt TC-L7-013 không thấy tiêu đề trong 15 giây trên ảnh cũ. QA theo dõi ở CI đầu tiên dựng ảnh mới. Nếu lặp lại, QA ghi lỗi riêng.

## 2. Độ bao phủ T1 (tiền) so với kế hoạch Sprint 4 mục 10

| Nội dung T1 | Ca | Trạng thái |
|---|---|---|
| BR-434 4A→2A→4A, X2b, BR-434-06…12 | TC-NT-047/048/049, BR-434-06 B7 + B14 | Có |
| BR-434-02/03 qua endpoint `move` | – | Chưa (S4-24 phần NÊN) |
| BR-424 căn gốc (BR-424-04) | TC-L4-097 | Có |
| BR-429-03…10 (ESC-019) | TC-L2-084, 087…100 | Có (TC-L2-094, 096, 098 viết khi BE-A giao) |
| BUG-061 ba ca | TC-NT-045 (a)(b), TC-NT-046 (a) | Có |
| B12 + FOC | TC-NT-049 (3) | Có |
| S4-06, S4-08 | – | Viết khi BE-B giao (D3–D5) |
| Xem trước = lệnh ghi (B7, B14) | `previewThenMove()` ở mọi ca S4-21; TC-NT-046 B7 + xem trước; TC-L4-098 | Có |
| `checkIn.payment` + BR-402-01 | TC-L3-011 (c), TC-L3-078 | Có |
| Tập đóng `AuditEvent.action` | TC-NT-049 (1) + kiểm `folio.foc_*` trong từng ca | Có |
| `otaPenaltyVnd` (S4-37), thu trước B18 (S4-47) | – | Trong S4-38 (D5–D7) |

## 3. Chưa kiểm được và vì sao
- **A1/A4 liền mạch:** chưa viết. Cần S4-28, S4-25, PWA H19/H20 và module HK (BE-C). Thiết kế và lịch ở kế hoạch mục 5.
- **UI trên ảnh web từ HEAD:** ảnh `ottimo-web:qa-s4` chưa dựng xong (cài gói chậm). Ca UI dùng ảnh `qa-r9` (cùng mã guest-web).
- **Ca S4-06, S4-08, S4-13, S4-37, S4-47:** chưa có, chờ phần server tương ứng.
- **T5–T8, T11:** chưa tới lượt, phụ thuộc MOB, BE-C, BE-D, FE-LP.
- **`ci.yml` (T9 hằng đêm, báo đỏ khi ca có annotation `bug` bị chạy lại):** việc của OPS, đã ghi ở kế hoạch mục 3.2.

## 4. Việc tiếp theo của QA
1. Theo dõi CI của commit gộp bản sửa BUG-R2-105. Xanh thì đóng 105 và 064.
2. Review PR S4-07 / S4-05 (BE-A), S4-02 / S4-18 (BE-B) theo mốc D3, kiểm bằng `E2E_FIXED_BUGS`. Đóng lỗi khi CI của commit gộp xanh.
3. Viết ca S4-06, S4-08 và BR-434-02/03 qua `move`. Chuẩn bị phạm vi S4-38 cùng ORC.

## 5. Cập nhật 17/10 tối (~20:00–20:35) – việc ORC giao thêm

### 5.1 (1) guest-web H18 – lời chào mới + BUG-R2-105
- MOB đổi lời chào sang `gw.welcome_title` / `gw.welcome_title_plain` (tiếng Anh ở mọi ngôn ngữ – DS 11.2). `guest-web.h18.spec.ts` nay tìm tiêu đề theo hai khóa này (`WELCOME`), không dùng `guest.hello`.
- Chạy trên guest-web build từ cây làm việc, api HEAD: **3 lượt riêng × 4 ca = 12/12 xanh** (TC-L7-010, 011, 013, 014).
- Một lượt `--repeat-each=3` trong một lần chạy bị chặn "Bạn đã thử quá nhiều lần". Đây là giới hạn phiên khách theo IP; CI chạy mỗi ca một lần, `global-setup` reset giới hạn – không phải lỗi.

### 5.2 (2) Rà ca nháp của dev

| Tệp | Kết quả | QA đã làm |
|---|---|---|
| FE-A `ui/desk-writes.s4.spec.ts` | TC-L2-097 (a)(b)(c)(d) xanh; TC-L2-102 (a) xanh (S4-08 đã có); TC-NT-052 (E) **chập chờn 1/4** → BUG-R2-106 | Bấm nút `aria-disabled` bằng `force` (trước đó chờ hết giờ); thêm `serviceDate` cho dòng dịch vụ (422 `DATE_INVALID`); chờ danh sách vẽ lại trước khi mở lại hộp duyệt; báo lỗi rõ hơn lần duyệt thứ hai |
| FE-A `ui-clock/stay-money.s4.spec.ts` | TC-L2-102 (b), TC-L3-080 (a)(b) xanh (S4-08, S4-39 đã có); TC-L3-079 (b) hỏng ở `createVietQr purpose=check_in` 422 → mã mới **`S4-10`** trong `OPEN`. **Còn đỏ, chờ FE-A:** TC-L3-079 (a) – giao diện in "+210.000", ca chờ "210.000 đ"; TC-L3-081, TC-L3-082 (ca mới) – 401 vì dùng phiên cũ sau khi tua đồng hồ | Thêm ngày sinh khi "Nhập tay" (server kiểm trường trước khi kiểm trùng → 422); thêm tài khoản nhận VietQR cho ngày ảo của TC-L3-079 (b); bỏ đánh dấu S4-08, BUG-R2-085 ở các ca đã xanh |
| FE-A S4-28 / TC-L5-025 (a) | **Chuyển sang `ui-clock/deposit-qr.s4.spec.ts`** (project `desk-clock`): cần tài khoản nhận, mà ngày thật phải giữ "chưa cấu hình" cho TC-L4-065. **Xanh** | Ngày ảo riêng + `ensureReceivingAccount(D)` |
| FE-LP `e2e/landing/` | 27/27 đúng dự kiến (2 lượt); TC-LP-001 lặp 6 lần không chập chờn | Gắn **TC-LP-001…009**, thêm cỡ 768 px, đo axe ở đầu trang (target-size chập chờn khi đo ở vị trí cuộn bất kỳ), thêm **TC-LP-010** (US-151 AC7 – lỗi đã biết `US-151/AC7`); r1-main-flows mục 10b. Luồng LP-v1: 17/53 AC Must có TC |

### 5.3 Việc BE-A, BE-B, BE-D gửi QA
- **Harness `checkIn` (BE-A (1)):** khi ca không nói về tiền, tiền phòng đã đủ và chỉ thiếu phụ thu nhận sớm / đêm B9a sắp ghi (409 `balance_paid`, preview `balanceDueVnd` 0), harness thu đúng `amountDueAtCheckinVnd` trong cùng B9. Ca về tiền tự gửi `payment` hoặc `autoPay: false` (TC-L3-011 (c)). TC-NT-029/036 xanh trên api cây làm việc.
- **TC-L2-095 / TC-L2-099 trùng căn (BE-A (2)):** `money-s4.api.spec.ts` chạy tuần tự trong tệp (`mode: 'default'`). Tệp khác vẫn song song.
- **S4-37 / TC-L2-057 (BE-A (3)):** `action()` gửi lại khi 409 `CONCURRENT_UPDATE` theo `Retry-After`, tối đa 2 lần, khóa mới. Kết luận "không phải lỗi nghiệp vụ" ghi ở `bug-list.md` 11.4.
- **Patch B-6 (BE-B (2)):** helper `approve()` tự gửi `expectedVersion` (đọc từ hàng chờ khi server trả 422 `REQUIRED`). Ca B-6 của QA tự gửi. QA đã chạy với patch: xanh (mục 5.4). Patch vẫn áp được vào `known-bugs.ts` sau các sửa của QA (`git apply --check`).
- **`withDevClockLock` (BE-D (1)):** E2E không ghi `dev_clock` trực tiếp. Đồng hồ đổi qua `/__test__/clock`; project `clock` và `desk-clock` chạy 1 worker, tuần tự sau mọi project dùng API; stack E2E tách khỏi DB test tích hợp. Không có đua cùng loại, không cần áp. Nếu server muốn tự khóa trong `/__test__/clock` thì là việc của BE (S4-20).

### 5.4 Đối chiếu trên cây làm việc (api 20:18 / 20:25 + patch B-6)
Chi tiết ở `bug-list.md` 11.4. Tóm tắt:
- **Xanh:** mọi ca của mã BE-A/BE-B đã xóa khỏi `OPEN` (055…061, 104, S4-21, S4-04, S4-23). S4-35, S4-08, BUG-R2-085 cũng đã xanh.
- **Còn mở:** B-6 (chờ patch), BUG-R2-033 (a) (kỳ vọng cần viết lại theo 0.3.7 mục A), BUG-R2-054, S4-10 (VietQR `check_in`), US-151/AC7 (landing v1.2).
- **Lỗi đóng khi CI của commit gộp xanh** (QA không đóng trên cây làm việc).
- **Dòng S4-35, S4-08, BUG-R2-085 giữ trong `OPEN`** (không còn ca nào dùng) để patch B-6 áp đúng ngữ cảnh. ORC/BE xóa sau khi áp patch.
