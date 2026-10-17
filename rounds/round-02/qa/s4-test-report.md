# Báo cáo kiểm thử Sprint 4 – Round 2 (QA)

- Bước: **Sản xuất / Kiểm thử song song – D1**
- Người làm: QA
- Ngày: 17/10/2026, ~17:00–19:40
- Bản kiểm: **HEAD `94c711d`** (nhánh chính; bản sửa BE-A/BE-B Sprint 4 chưa gộp)
- Hợp đồng: OpenAPI **0.3.7** (đóng băng D1). Quy tắc: BR v0.3.6. Oracle: `product/tests/fixtures/br-examples.json`.
- Kế hoạch: `qa/s4-test-plan.md`. Lỗi: `qa/bug-list.md` mục 11 (11.4 đối chiếu cây làm việc). Mục 5: cập nhật 17/10 tối. Mục 6: bước Kiểm thử ~21:10–21:45 (CI `b6153b7`, TC-L3-077).
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

## 6. Kiểm thử 17/10 ~21:10–21:45 – CI `b6153b7` đỏ TC-L3-077 (kế hoạch 5.4)

### 6.1 Môi trường
- Stack `ottimo-qa-s4`. api biên dịch lúc 21:12 từ cây làm việc = HEAD `b6153b7` + thay đổi chưa commit (có S4-39 của BE-C, #6, bản sửa S4-11/S4-12 BE-C đang làm). Migration áp đủ, health OK.
- admin-web, guest-web build từ cây làm việc lúc 21:12.
- **Lưu ý cho FE-A:** lệnh `up --force-recreate … web` của QA lúc 21:12 đã thay container `web` mà FE-A tạo trước đó (`compose.web-fea.yml`, admin-web build 20:37). Bản admin-web của QA mới hơn (21:12, cùng cây làm việc). Từ lúc nhận lưu ý của ORC, QA không tạo lại `web` nữa.
- Ngày ảo của QA: 2033-01-10 … 2033-03-08 (`qa-s4/auth`). Không trùng dải của FE-A (từ 2033-07-01). Trước mỗi lượt, QA kiểm không có tiến trình Playwright nào khác đang chạy vào api 43000 (đồng hồ ảo dùng chung).

### 6.2 TC-L3-077 – nguyên nhân đỏ và cách sửa
CI `b6153b7` đỏ cả 2 lượt. **Nguyên nhân nằm ở ca kiểm, không phải lỗi sản phẩm:**

| Lượt CI | Lỗi | Nguyên nhân | Sửa trong ca |
|---|---|---|---|
| 1 | `createReservation 301 2032-04-30` → 422 `MIN_STAY_NOT_MET` (`minStayNights` 2) | Ngày đến D+2 rơi vào thứ Sáu. BR-113: đến thứ Sáu/thứ Bảy phải ở 2 đêm, ca đặt cố định 1 đêm | Số đêm = `minStayFor(ngày đến)` (helper `s2.ts`, cùng bảng ngày đặc biệt như server) |
| 2 | `removePartyMember` → 422 `guestUploadPersonIndex` `REQUIRED` (`personIndexes` [2, 3]) | Hợp đồng 0.3.7 (S4-39) bắt buộc chọn ô "Khách n" khi còn giấy tờ khách gửi chưa gắn. Ca vẫn theo 0.3.6. Thay đổi này đã lường trước ở kế hoạch 5.4 | Xem dưới |

Theo 0.3.7, đường **bỏ người có chọn ô** hủy ngay ô được chọn, không hẹn 24 giờ. Đường này đã có TC-L3-080 (a). Hẹn 24 giờ (`unclaimedUntil`) và "Cần chú ý" `registration_party_docs_unlinked` chỉ còn ở đường **không có lựa chọn của lễ tân**: giảm số khách (`updateReservation`) hoặc đơn OTA sửa. Vì vậy TC-L3-077 đổi bước dựng dữ liệu:
- bỏ người đi cùng A; đơn 3 người lớn + B; giảm còn 2 người lớn bằng `updateReservation`;
- kiểm `unclaimedUntil` của Khách 2, Khách 3 = mốc + 24 giờ (± 1 phút);
- nhãn "Chờ gắn người – tự xóa lúc …" và dải cảnh báo tính theo `unclaimedUntil` (trước đây theo `imagePurgeAt`);
- "Gắn người": hộp mới (tên hộp và nút = `reg.link.action`). Request phải 200, thân **đúng** `{partyMemberId}` (`GuestDocumentLink`), không có request đọc C3 (`/sensitive`, `/images/`) lúc gắn;
- sau khi gắn: `partyMemberId` = B, `unclaimedUntil` rỗng, Khách 2 vẫn chờ;
- phần "Xem đủ số / ảnh" và J16 giữ nguyên.

### 6.3 Kết quả (desk-clock, `--no-deps`, `--retries=0`, mỗi lượt một lần gọi riêng)

| Lượt | Ngày ảo D (thứ) | Ngày đến | Số đêm | Kết quả |
|---|---|---|---|---|
| 1 | 2033-01-10 (Hai) | Tư | 1 | Đạt (5,2 s) |
| 2 | 2033-01-17 (Hai) | Tư | 1 | Đạt (3,7 s) |
| 3 | 2033-01-24 (Hai) | Tư | 1 | Đạt (3,7 s) |
| Thêm | 2033-03-02 (Tư) – QA đặt ngày bắt đầu trong tệp ngày ảo của mình | **Sáu** | **2** | Đạt (3,9 s) – đúng tình huống của lượt 1 CI |

Kiểm ngoài ca: `prettier`, `eslint`, `tsc` của `product/tests` sạch.

### 6.4 Desk H14/H15 có gửi `guestUploadPersonIndex` không – **không có lỗi FE**
- Desk chỉ có một chỗ gọi `removePartyMember`: H15 `apps/admin-web/src/pages/stay/StayDialogs.tsx:1162`. Chỗ này truyền số ô đã chọn. `packages/api-client/src/endpoints.ts:604-617` gửi `?guestUploadPersonIndex=`. Lỗi 422 của trường này được xử lý ở `StayDialogs.tsx:1178`.
- H14 không có nút bỏ người, nên không phải gửi trường này.
- Chạy thật TC-L3-080 (a)(b) (FE-A, `ui-clock/stay-money.s4.spec.ts`) trên cùng stack: **2/2 đạt**. (a) bấm thật gửi `DELETE …?guestUploadPersonIndex=2`; (b) "Gắn người" chỉ gửi `partyMemberId`.

### 6.5 TC-L3-074 (b) – BUG-R2-054
- Ở HEAD `b6153b7`, `BUG-R2-054` còn trong `OPEN`. CI ghi "✘" xanh ở ca này nghĩa là hỏng đúng dự kiến; ca không nằm trong 2 ca đỏ.
- Trên cây làm việc, BE-C đã bỏ `BUG-R2-054` (S4-12) và `BUG-R2-033` (S4-11) khỏi `OPEN`.
- QA siết kỳ vọng: `imagesPurgeReason` phải = `retention` (J16 xóa theo hạn lưu – erd `document_image.delete_after`; enum OpenAPI 0.3.3), không chỉ "có giá trị".
- TC-L3-074 + (b): **3/3 đạt** (project `clock`, `--no-deps`).
- Kèm theo, TC-L3-032 (a)(b) (BUG-R2-033): **2/2 đạt**. BE-C có sửa tiền điều kiện (a): ghi đồng ý P05_CRM cho người đứng tên lần trước. QA đã rà: đúng hợp đồng, vì khóa `id_doc_hmac` chỉ có khi đã đồng ý P05 (erd 0.3.7, SEC F03).
- BUG-R2-054 và BUG-R2-033 **chưa đóng**. QA chỉ đóng khi CI của commit gộp bản sửa BE-C xanh.

### 6.6 Ngoài phạm vi được giao – báo ORC
CI `b6153b7` có **2** ca đỏ, không phải 1. Ca thứ hai là **TC-L3-082** (FE-A, `ui-clock/stay-money.s4.spec.ts`): `locator.fill` quá 90 s ở cả 2 lượt. Cây làm việc đã có thay đổi của FE-A trên tệp này. QA không sửa và chưa chạy lại ca này.

### 6.7 Việc thêm của ORC (~21:30–21:45)

**(1) 409 `DUPLICATE_GUEST` khi dựng dữ liệu (FE-A gặp ở TC-L2-103) – lỗi harness, không phải lỗi sản phẩm.**
- Nguyên nhân: BR-951 bắt SĐT là duy nhất trong các hồ sơ còn hiệu lực. Bốn chỗ sinh số tự viết riêng, đều chỉ có 10⁶ hoặc 10⁷ số: `0939` + 6 số ngẫu nhiên (`s2.ts mobile`, `s3.ts namedGuest`, `rbac/sprint3-ops.ts`, `api/guests.api.spec.ts`) và `093` + 7 số (`ui/helpers.ts fakePhone`). Trên stack dùng lâu, vài nghìn hồ sơ là đã có số trùng (bài toán ngày sinh) – cùng loại breg-3 / TC-L3-013 ở S3.
- Sửa ở `support/api.ts`:
  - `fakeMobile()` – một bộ sinh dùng chung, ra số di động VN `0[35789]` + 8 số. Giá trị = đồng hồ theo 0,1 giây (mỗi tiến trình tăng nghiêm ngặt) × 100 + ô worker Playwright (`TEST_PARALLEL_INDEX`) × 10 + một chữ số ngẫu nhiên của tiến trình, lấy mod 5·10⁸.
    - Trong một lượt chạy: không trùng.
    - Giữa các lượt: không trùng trong khoảng 5,8 ngày.
    - Hai lượt chạy cùng lúc trên một stack: khác nhau ở chữ số ngẫu nhiên.
    - Mọi số đều hợp lệ với `normalizePhone` của server (kiểm 300.000 số, ô 3 và ô 9).
  - `createFakeGuest()` – gặp 409 `DUPLICATE_GUEST` trên trường `phone` thì thử lại với số mới, tối đa 3 lần, ghi annotation `harness`. Chỉ áp cho số do harness sinh. Ca kiểm trùng SĐT (TC-L5-043) vẫn gọi thẳng API.
  - `newGuest` (s2), `namedGuest` (s3) dùng `createFakeGuest`. `mobile`, `fakePhone`, rbac và guests.api dùng `fakeMobile`.
- Kiểm: `guests.api` + `checkin.s3.api` + `money-s4.api` với 4 worker → 62 đạt, 2 bỏ qua (có sẵn). TC-L2-103 (a)(b) đạt trên api dựng lại.

**(2) Rà thay đổi của FE-A trong `known-bugs.ts` – đồng ý.**
- Regex `knownBug` thêm dạng `DOM-S4-\d{2}`: đúng. `DOM-S4-xx` là mã quyết định của DOM có trong decision-log (dòng DOM 17/10, BR v0.3.8) và `br-examples.json`, nên truy được. Regex vẫn chặt: không nhận mã lạ khác.
- Lúc QA rà, BE-A đã bỏ `DOM-S4-06` khỏi `OPEN` (cùng `S4-10`). `OPEN` chỉ còn `US-151/AC7`.
- Với api cây làm việc 21:12 (chưa có bản sửa BE-A), TC-L2-103 (b) đỏ: `moveReservation` trả 200 thay vì 422. Đó là do stack cũ hơn registry, không phải lỗi. QA dựng lại api lúc 21:35 từ cây làm việc (`api-dist4`; lúc 21:31 cây còn lỗi tsc ở `folio.service.ts`, đợi BE-B sửa xong mới dựng). Sau đó TC-L2-103 (a)(b) đạt 2/2.
- Đề nghị giữ quy ước: mã nào có trong `OPEN` thì phải có dòng trong `bug-list.md` hoặc kế hoạch S4. `DOM-S4-06` đã đóng nên không cần thêm dòng.
- Hồi quy trên api 21:35 (web là admin-web của FE-A, `fea-s4/aw-dist`):
  - TC-L3-077 + TC-L3-080 (a)(b): 3/3 đạt;
  - TC-L3-074 + (b): 2/2 đạt.

**(3) A1/A4 liền mạch (kế hoạch 5.3) – mới khảo sát, chưa viết ca.** Xem kết quả trả về cho ORC.

### 6.8 Trước gộp lần 2 (DOM-S4 + S4-10) – sửa ca kiểm (~21:40–21:55)
- **Môi trường:** api `ottimo-qa-s4` biên dịch lại từ cây chung lúc ~21:42 (`api-dist5`). QA làm chủ container `web` (ORC): admin-web, guest-web và PWA `apps/mobile` build từ cây làm việc, cập nhật bằng `scratchpad/qa-s4/build-web.sh` (rsync, giữ thư mục của bind mount). PWA ở cổng 48082.
- **Ngày ảo QA:** tệp ngày ảo đã chạy tới 2033-08 (ca đồng hồ dùng dải dài), lấn vào dải FE-A để lại. QA chuyển điểm bắt đầu sang **2034-01-12**, sau dải của FE-A (FE-A dừng ở 2034-01-08), để không đụng đơn còn sót.
- **Sửa (ii) – 422 `applyDifference REQUIRED`:** helper `moveAcked()`. Chi tiết ở `bug-list.md` 11.6.
- **Sửa (i) – `stay-money.s4` cả tệp:** helper `readyRooms()`, cùng `minStayFor` cho `stay3`.
- **Kết quả** (`--retries=0`):

| Bộ | Kết quả |
|---|---|
| `money-s4.api` + `s3-kickoff.api` + `booking-conflicts.api` + `s2-fix.api` + `checkin.s3.api` (4 worker) | 78 đạt, 2 bỏ qua (có sẵn) |
| RBAC `moveReservation`, `previewMoveReservation` | 11/11 |
| `checkin.s3.clock` + `money-s4.clock` | 41/41 |
| `stay-money.s4` cả tệp, có `E2E_COMPOSE_CONTROL` | 7/7 |
| `stay-money.s4` cả tệp, **không** `E2E_COMPOSE_CONTROL` (như stack của BE-B: buồng không được dọn bằng SQL) | 6 đạt, 1 bỏ qua (TC-L3-082 cần SQL) |
| `desk-writes.s4` | 5/6 – TC-NT-052 đỏ vì **BUG-R2-107**, chỉ ở stack QA (lý do ở bug-list) |

- **Bước QA không làm:** đổi `requested_at` của các yêu cầu duyệt "tương lai" trong DB stack QA để chạy lại TC-NT-052. Lệnh sửa hàng loạt bị chặn quyền nên QA dừng ở đó, không tìm cách khác.
- **A1/A4:** tạm dừng vì việc khẩn này. Đã có: web phục vụ PWA từ cây làm việc; khảo sát luồng (H12 → H11 → H13 → H17 → H16 → PWA H19/H20). Chưa viết ca.

