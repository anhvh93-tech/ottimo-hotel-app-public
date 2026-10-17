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
- QA siết kỳ vọng: `imagesPurgeReason` phải = `retention`, không chỉ "có giá trị". **Cập nhật ~22:15 (ORC): kỳ vọng đúng là `unconfirmed`** (ARC bổ sung 3, migration 0062 của BE-C). Trên api có 0062, TC-L3-074 + (b) đạt 2/2.
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

### 6.9 E2E liền mạch A1 – TC-X-070 (T4, G4, ĐK-S3-7) (~22:05–22:30)
- **Tệp:** `product/tests/e2e/ui-clock/flow-a1.s4.spec.ts`, project `desk-clock`, một ca một chuỗi.
- **Nguyên tắc:** mọi bước ghi bấm thật trên giao diện, không `test.fail` giữa chuỗi. Request trình duyệt gửi được ghi lại và phải đúng mã. Kết quả đọc lại bằng API.
- **Chuỗi** (tiền từ oracle BR-107-01, BR-305-01, BR-411-01, BR-402-01, BR-702-01):
  1. H12 `qa.sal`: tìm căn trống, báo giá 202 7 đêm, lưu báo giá (cọc 1.600.000), Tạo giữ chỗ. VietQR cọc 1.600.000, nội dung = mã đơn.
  2. H11 `qa.fd`: Xác nhận cọc đúng giao dịch QR → `confirmed`.
  3. Ngày đến 11:00, H13: nhập tay giấy tờ; nhận sớm + xin FOC phụ thu (≈ 30 % × 713.000); tiền mặt 3.605.000 trong cùng lệnh nhận phòng → `in_house`.
  4. H17 `qa.mgr`: duyệt FOC → còn phải thu 0.
  5. Ngày đi 11:00, H16: minibar 100.000 → VietQR → Đã nhận → Hoàn tất. Kết quả: `checked_out`, `settled`, số bill `F{yy}-nnnnnn`; đã thu 1.600.000 + 3.605.000 + 100.000; căn `VD`.
  6. PWA (cổng 48082): `qa.hk` Bắt đầu dọn → Dọn xong (`VD` → `CL` → `VC`); `qa.fdl` Kiểm phòng, tick đủ checklist + ảnh → `VI`.
- **Kết quả:** 3/3 lượt riêng xanh trên api ~21:42, thêm 2/2 trên api ~22:12 (có migration 0062), `--retries=0`, cả tệp chạy 20–24 giây. TC-X-071 (S4-25) đỏ đúng dự kiến, đúng chỗ thiếu nút.
- **Ghi chú kỹ thuật:**
  - PWA: giờ trình duyệt chạy từ đúng giờ server (`clock.install`), vì `performedAt` phải trong [server − 24 giờ, + 5 phút] và sau `since` (lượt đầu: 422 `PERFORMED_AT_OUT_OF_RANGE` khi lệch 30 phút).
  - Hàng đợi PWA giữ 10 giây để hoàn tác: ca tua `fastForward` 12 giây.
  - Sau mỗi lần tua đồng hồ server, ca lấy phiên mới.
  - Harness: thêm `STAFF_URL` (`E2E_STAFF_URL`, mặc định cổng WEB_URL + 1).
- **Môi trường:** lúc ~21:58 container `web` lại bị tạo lại bằng `compose.web-fea.yml` (không có PWA, phục vụ "Skeleton – Round 1" ở 48082). QA đã tạo lại với `compose.web-qa.yml`.
- **Chưa làm:** A4 (`flow-a4.s4`) và khung `ui/ops.s4`, `ui-clock/ops.s4` – bước tiếp theo.

## 7. M1 đóng – để QC đọc ở cổng Sprint 4 (QA, 17/10/2026 ~22:45)

### 7.1 Căn cứ
- **CI 39042881071** trên commit **`6f8d429`**: 8/8 job chạy đều `success`, deploy/publish bỏ qua đúng thiết kế.
- **E2E:** 1.858 đạt, 0 trượt, 70 bỏ qua có sẵn. TC-LP-010 là lỗi đã biết, nằm ở job landing.
- `OPEN` của `known-bugs.ts` ở commit này chỉ còn `US-151/AC7`, nên mọi ca tiền dưới đây là ca "phải đạt", không ca nào mang `test.fail`.
- QA đã đọc log job E2E và đếm theo tệp: `money-s4.api` 34/34, `money-s4.clock` 9/9, `stay-money.s4` 7/7, `checkin.s3.clock` 32/32, `checkin.s3.api` 19 đạt và 2 bỏ qua có sẵn (không thuộc M1), `desk-writes.s4` 6/6.
- Quy tắc đóng (kế hoạch 3.3): đóng khi CI của commit gộp xanh. Chi tiết từng lỗi ở `bug-list.md` mục 11.7.

### 7.2 Trạng thái M1 (sprint-4-plan mục 3, dòng M1)

| Mục M1 | Lỗi | Ca E2E (đọc `br-examples.json`) | Trạng thái |
|---|---|---|---|
| S4-01 + S4-03 | BUG-R2-055 | TC-NT-051 | **Closed** |
| S4-02 (kèm 4A→2A→4A) | BUG-R2-056 | TC-NT-047 phần S4-02, TC-NT-049 (2) | **Closed** |
| S4-05 | BUG-R2-057 | TC-L4-097 | **Closed** |
| S4-07 | BUG-R2-058 | TC-L2-084 (a)(b) | **Closed** |
| S4-18 (audit `folio.foc_cancelled`, `monthlyApprovedBy`, trạng thái FOC) | BUG-R2-059, BUG-R2-104 | TC-NT-046, TC-NT-049 (4)(6), TC-NT-049 phần tập đóng `AuditEvent.action` | **Closed** |
| S4-22 | BUG-R2-060 | TC-NT-049 (3) | **Closed** |
| S4-34 | BUG-R2-061 | TC-NT-045 (a)(b), TC-NT-046 (a) | **Closed** |
| S4-23 phần thứ tự | – | TC-NT-047, TC-NT-048 (BR-434-11/12) | Xanh |
| S4-35 | – | TC-L2-099 (c) | Xanh |
| S4-08 | – | TC-L2-102 (a)(b) | Xanh |
| #6 `expectedVersion` | BUG-R2-106 | TC-NT-050, TC-NT-052 (E) | **Closed** (BUG-R2-106) |
| S4-10 (BR-402-01) | BUG-R2-038 | TC-L3-011 (c), TC-L3-078, TC-L3-079 (a)(b), TC-L3-081, TC-L3-082 | **Closed** |
| **S4-06** (đơn hủy/no-show còn tiền dư → tự tạo yêu cầu hoàn + "Cần chú ý" `closed_reservation_credit`; DOM-S4-14) | – | **TC-L2-104** (BR-309-10), **TC-L2-105** (a)(b)(c) BR-522-05 + (d) `superseded`, **TC-L2-106** (BR-311-03) – `api/refund-credit.s4.api.spec.ts`, `clock/refund-credit.s4.clock.spec.ts`; BE: `test/integration/close-stay-dom-s4.test.ts` | Xanh trên stack QA (api ~22:30, có S4-25) 3/3 lượt; vào CI ở commit sau |
| **S4-13** (test đua duyệt FOC với B10/B11/resync) | – | Test đua của BE-B (vitest, PostgreSQL thật): `services/api/test/integration/foc-keys-s4.test.ts` – "S4-13: approve ‖ B7 re-price (5 rounds)…" (dòng 915) và "S4-13: approve ‖ B10 cancel and approve ‖ B11 no-show – never an approved FOC applied on a void booking" (dòng 951) | **Đạt** ở job `format · lint · audit · test · build` của CI 39042881071 (tệp 21/21). QC đọc kết quả này theo quyết định ORC; QA không viết E2E đua riêng |

### 7.3 Những gì M1 còn thiếu so với định nghĩa xong
- **Kiểm chứng đối kháng S4-38:** báo cáo đã có (`reviews/s4-money-verification.md`, chấm `08dabd3`) – xem **7.8**. Định nghĩa xong của M1 cần 0 ca lệch tiền trên commit sửa: **chưa đạt** cho tới lượt kiểm lại S4-38.
- **S4-06:** đã có ca API (ORC giao 17/10 ~22:20) – xem 7.5. **S4-13:** QC đọc test đua của BE-B trong CI (bảng 7.2).
- Không còn lỗi P0/P1 nào mở trong `bug-list.md`.
- **BUG-R2-107** (P3) đã sửa ở `21b175c`. CI 39044741574 xanh → **Closed** (~23:00).

### 7.4 Luồng liền mạch (G4)
- **A1** (TC-X-070): xanh 5/5 trên stack QA (mục 6.9) và **xanh trên CI 39044741574** (`21b175c`, có trong `WRITES`).
- **A4** (TC-X-072): đã có, xanh trên stack QA – mục 7.6.

### 7.5 S4-06 – ca API mới (QA, ~22:20–22:45)
- **Môi trường:** api `ottimo-qa-s4` dựng lại lúc ~22:30 từ cây chung, có phần BE của S4-25 chưa commit. QA kiểm trước khi tạo lại: không có lượt Playwright nào khác đang chạy vào api 43000, container api đang là bản của QA (`api-dist6`). FE-A cần chạy TC-X-071 thì dùng luôn bản này (`api-dist7`) hoặc báo ORC trước khi tạo lại.
- **Ca:**
  - TC-L2-104: BR-309-10 – phí = 100 % × min(1.000.000, 700.000, 2.376.000) = 700.000, hoàn 300.000. Kết quả: một yêu cầu hoàn `pending` (quản lý duyệt) và "Cần chú ý" `closed_reservation_credit`.
  - TC-L2-105 (a)(b)(c): BR-522-05 – bổ sung 350.000 / không tạo thêm / yêu cầu mở tự hủy khi dư 0. Kết quả: phí theo cọc yêu cầu; "Cần chú ý" chỉ khi còn dư.
  - TC-L2-105 (d): DOM-S4-14 – yêu cầu mở 700.000 vượt dư 300.000 → tự hủy `superseded`, tạo lại 300.000. Số lấy từ BR-309-10; chưa có dòng oracle riêng, DOM có thể thêm BR-522-06.
  - TC-L2-106: BR-311-03 – no-show giữ 500.000, hoàn 300.000. Project `clock`.
- **Tiền điều kiện của TC-L2-105:** "yêu cầu hoàn mở trước khi hủy" **không dựng được qua API công khai**, vì `createRefundRequest` chỉ cho hoàn phần tiền thừa đã có (`unhandledCreditVnd`). Ca chèn một dòng `approval_request` bằng SQL, cùng cột như `ApprovalService.submit`. Chỉ chạy khi `E2E_COMPOSE_CONTROL=1` (CI có), không thì bỏ qua và ghi lý do.
- **Kết quả:** `refund-credit.s4.api` 3/3 × 3 lượt (2 lượt 3 worker); `refund-credit.s4.clock` 1/1 × 3 lượt. Không lỗi mới.

### 7.6 E2E liền mạch A4 – TC-X-072 (QA, ~22:35–22:50)
- **Tệp:** `product/tests/e2e/ui-clock/flow-a4.s4.spec.ts`, project `desk-clock`, một ca một chuỗi. Mọi bước ghi bấm thật, không `test.fail`.
  1. PWA `qa.mt` H21: báo sự cố + **Khóa căn** tới D+2 → `createWorkOrder` 201 kèm `block`; căn `OOO`; tồn phòng không bán.
  2. Desk S11: dòng phiếu (mã WO) ở tab Phiếu sửa và tab Khóa phòng; H12 tìm căn trống **không** liệt kê căn.
  3. PWA H22: Nhận việc → Sửa xong (ghi chú + ảnh sau sửa – bắt buộc với mức trung bình) → căn `VD` + việc "Dọn sau sửa chữa".
  4. PWA `qa.hk` dọn (`VD` → `CL` → `VC`), PWA `qa.fdl` kiểm → `VI`.
  5. H12 liệt kê lại căn; `createReservation` 201 trên căn đó.
- Bước PWA dọn/kiểm chuyển thành hàm dùng chung `e2e/ui/flows.ts` (`desk`, `staffApp`, `pastUndo`, `roomStatusOf`, `pwaCleanInspect`); A1 dùng cùng hàm.
- **Kết quả** (cả hai tệp `flow-a1` + `flow-a4`, `--retries=0`, chạy 14–15 giây):
  - **4/6 lượt xanh hết** (1, 3, 4, 6). TC-X-071 nay cũng xanh: FE-A đã làm S4-25, `OPEN` đã rỗng.
  - **2 lượt đỏ (2, 5) đều trùng lúc FE-A chạy `desk-clock` vào cùng api 43000** (`fea-s4/run-s425*.log` 22:39–22:40). Đồng hồ ảo dùng chung bị tua giữa ca, nên lỗi rơi vào chỗ ngẫu nhiên: thẻ việc PWA, `receivedAt DATE_INVALID`, căn chưa `OOO`. Đây không phải lỗi ca hay lỗi sản phẩm.
  - Lượt 6 chạy sau khi kiểm không còn tiến trình nào khác: xanh 3/3.
- **Đề nghị ORC:** trên `ottimo-qa-s4` chỉ chạy **một** lượt project `clock`/`desk-clock` tại một thời điểm. Ai chạy thì báo trước (hoặc dùng tệp khóa `scratchpad/qa-s4/clock.lock`). Đưa **TC-X-070, TC-X-072** vào `WRITES` (đều xanh ≥ 2 lượt sạch liên tiếp).

### 7.7 Ca UI màn vận hành (FE-B) và mã TC landing LP-v1.2.1 (QA, ~22:45–23:15)
- **`e2e/ui-clock/ops.s4.spec.ts`** (desk-clock, chạy theo khóa `qa-s4/clock-lock.txt`):
  - TC-L6-043 (E) + TC-L6-040 (E): S11 phiếu thiếu mô tả không lưu; phiếu + Khóa căn → toast "khóa đêm …, mở bán lại từ …", căn `OOO`. **Đạt**.
  - TC-L6-042 (E): căn có khách → "Căn đang có khách – chưa khóa được" → "Tạo phiếu không khóa". **Đạt**.
  - TC-L6-022 (E) + TC-L6-033 (E): S10 việc tay, "Làm xong" → bộ đếm; hủy "Khác" phải ghi chú. **Đạt**.
  - TC-L6-045 (E): Desk Nhận việc → Sửa xong. **BUG-R2-108 mới (P1, BE-C)**: `WorkOrder.allowedActions` luôn rỗng nên Desk không có nút chuyển trạng thái phiếu. `knownBug` ở đầu ca, hỏng đúng bước.
- **`e2e/ui/ops.s4.spec.ts`** (desk-chromium): S13 `/settings/minibar` – lễ tân và lễ tân trưởng chỉ đọc (không cột giá vốn, không nút Thêm/Sửa); quản lý thấy giá vốn và mở được hộp sửa (không lưu, vì giá minibar là dữ liệu chung của oracle). 3/3 **Đạt**.
- **Chưa viết** (bước tiếp theo, kế hoạch 5.3): H03 hàng yêu cầu khách (US-110); khóa có kế hoạch – Đổi ngày mở bán, Hủy khóa, Mở khóa sớm (US-019); đổi giá minibar (TC-L4-071 (E), cần project `serial`).
- **Landing LP-v1.2.1:**
  - QA gắn mã **TC-LP-011…018** cho 8 định nghĩa ca của FE-LP (10 lượt chạy):
    - `sections.landing.spec.ts`: TC-LP-011 (EN/VI), TC-LP-012, TC-LP-013, TC-LP-014;
    - `form.landing.spec.ts`: TC-LP-015 (375/1280 px), TC-LP-016, TC-LP-017, TC-LP-018.
  - Thêm dòng TC vào `r1-main-flows.md` (mục 10b, v0.3.28).
  - Chạy lại trên bản dựng `landing-web` 22:59: **10/10 đạt**.
  - `--strict-track LP-v1`: AC Must có TC tăng từ 17/53 lên 23/53. Cổng riêng LP-v1 vẫn chưa đủ, không thuộc `--strict` của CI.

### 7.8 S4-38 – kiểm chứng đối kháng tiền: kết quả và trạng thái lỗi (để QC đọc ở cổng)
- **Báo cáo:** `rounds/round-02/reviews/s4-money-verification.md` (critic), bản thô `reviews/s4-38-findings-raw.md`.
  - Chấm commit **`08dabd3`**; 5 hướng kiểm (`foc`, `move`, `cancel`, `pay`, `regr`); mỗi phát hiện 2 người tái hiện độc lập trên PostgreSQL thật.
  - Kết luận của critic với `08dabd3`: **G1 không đạt** (còn ca lệch tiền), **G7 không đạt** (còn P1 mở).
- **QA cấp số** (ORC chốt), chi tiết ở `bug-list.md` mục BUG-R2-109…124:

| Nhóm | Mã | Trạng thái |
|---|---|---|
| Major P1 – sai tiền / đơn kẹt / xem trước ≠ ghi | BUG-R2-109…119 (FOC-01, FOC-03, FOC-04, MOVE-01…05, REGR-02/03, PAY-01/03/04, REGR-01, S438-DOM-01, CANCEL-01/02) | **Fixed** ở `72fa486` (BE-A mục 12, BE-B mục 11) |
| Minor P2 | BUG-R2-120 (FOC-02), BUG-R2-121 (CANCEL-03) | **Fixed** ở `72fa486` |
| Minor P3 | BUG-R2-122 (CANCEL-04) | **Fixed** ở `72fa486` |
| Minor P3 | BUG-R2-123 (`move-preview` thiếu `overbookingResolution`) | **Open** – tuần Ổn định |
| Minor P3 | BUG-R2-124 (`restoreNoShow` ghi UUID phòng vào lịch sử) | **Open** – BE-A đang sửa |
| Kèm theo | BUG-R2-095 (P3, cùng gốc FOC-01) | **Fixed** ở `72fa486` (BE-B) |

- **Điều kiện đóng** (critic, mục "Khuyến nghị cổng QC Sprint 4"): CI của commit sửa xanh **và** lượt kiểm lại S4-38 trên commit đó đạt:
  - 0 ca lệch tiền;
  - xem trước = lệnh ghi ở B7, B14, B9a, B18;
  - chạy lại test `test/s438/v-*` và 5 harness sau khi đổi kỳ vọng sang số BR;
  - FOC-01 kiểm qua đường S4-25 trên Desk (H16 bước 1).
  - **Chưa ai chấm `72fa486`.**
- **Phía QA cần làm cho G1** (theo khuyến nghị critic, điểm 4 và 6):
  - ca E2E cho các gap chạm tiền: hoa hồng sau B8 (S4-03), luồng làn chưa gán sau B12, sửa giá đêm gia hạn/B9a, đua nhận phòng ‖ duyệt FOC, xác nhận QR ‖ B9, FE `CheckOutPage.tsx` dùng `amountDueAtCheckoutVnd`;
  - gỡ `pendingFix` cũ của 10 dòng oracle;
  - viết test đọc các dòng oracle chưa có test (ít nhất BR-315-03…05, BR-429-01/02/13).
- **Luật mới BR v0.3.8** (giá gõ tay = giá lịch, bậc 7 đêm áp mọi đêm, cọc yêu cầu và cờ cao điểm tính lại sau B7/B8, FOC trên `room_change_difference` tạm dừng khi no-show): QA chờ CI `72fa486`. Ca E2E nào ghi số theo luật cũ sẽ sửa theo oracle mới (danh sách ca có thể ảnh hưởng đã báo ORC).

#### 7.8.1 Lượt kiểm lại S4-38 trên `2f77889` – **cổng QC Sprint 4 lùi sang tuần Ổn định** (18/10)
- **Căn cứ:** báo cáo `rounds/round-02/reviews/s4-money-reverification.md` (critic chấm `2f77889`); CI **39052448947** xanh trên `2f77889` (E2E 1.875 đạt).
- **Mã cũ:**
  - **Closed:** 095, 108, 109, 110, 112…122, 124.
  - **Fixed:** 111 – phần `incidentalNet` tách thành BUG-R2-131; đóng khi QC đồng ý tách hoặc khi 131 đóng.
  - **Open:** 123 (tuần Ổn định).
- **Mã mới:**
  - **BUG-R2-125…130 (P1, Open)** – 125 và 126 là **hồi quy do chính vòng sửa**;
  - BUG-R2-131, 132 (P2, Open);
  - BUG-R2-133 (P3, tuần Ổn định).
  - Chi tiết, người sửa và số đúng ở `bug-list.md` mục 11.10.
- **Kết luận critic với `2f77889`:**
  - **G1 không đạt** – còn 7 phát hiện sai tiền (6 mã 125…130), trong đó 125 và 127 là "xem trước ≠ lệnh ghi" ở B9a/B18;
  - **G7 không đạt** – 6 mã P1 Open.
- **Quyết định:** áp quy tắc lùi cổng (sprint-4-plan mục 11.2; decision-log 18/10): **cổng QC Sprint 4 lùi sang tuần Ổn định**, không cấp ngoại lệ tiền.
- **Điều kiện vào cổng** (critic, mục "Khuyến nghị cổng QC Sprint 4"):
  1. Đóng BUG-R2-125…130, mỗi mã có test oracle với số ở bảng "Major-fix-now theo gốc".
  2. Sửa cùng vòng BUG-R2-131 (rồi đóng 111) và BUG-R2-132. BUG-R2-123 và 133 sang tuần Ổn định, kèm kế hoạch. Với 133: OPS/QA xác nhận DB dùng thử không có đơn origin NULL từ trước 0059, hoặc đã sửa các đơn đó.
  3. DOM chốt (không chặn BE sửa 125–130): (a) BR-434 không có ngoại lệ (m); (b) BR-309-11 "tiền phòng hiện hành" gồm giá sửa S4-35 + ngoại lệ < 7 ngày; (c) chữ BR-309-11 cho chuỗi rút muộn rồi kéo dài (cùng ESC-023); (d) R2FOC-03; (e) MOVE-06.
  4. ARC sửa mô tả `CheckInPreview.amountDueAtCheckinVnd` và `ExtensionOptions.currentBookingRateVnd`; FE-A sửa `CheckInPage.tsx` đọc `priorNight.available`.
  5. Lượt kiểm lại trên commit sửa: chạy **toàn bộ** `test/s438/r2*/` và `w-r2*/`; 0 ca đỏ ngoài Note; xem trước = trần QR = lệnh ghi ở B9a và B18, kể cả đơn có định mức bảo vệ; critic chấm lại một lượt ngắn. FOC-01 qua Desk H16 thật **chưa chạy**.
  6. ORC ghi decision-log: S4-37 `otaPenaltyVnd` "không sai tiền"; S4-47 chỉ kết luận sau khi đóng BUG-R2-125.
  7. **QA:**
     - gỡ `pendingFix` cho 14 dòng (11 dòng khớp oracle trên `2f77889`: BR-110-10/11/12, BR-416-03, BR-522-02, BR-412-12/13/14, BR-424-02/03, BR-428-04; 3 dòng đang xanh: BR-416-02, BR-527-06, BR-903-04);
     - cập nhật bug-list (124 đã sửa, tách 131) – **đã làm** (mục 11.10).
  8. G5: api và E2E xanh trên đúng commit chấm; thêm ca cho gap chạm tiền còn thiếu: hoa hồng S4-03 sau B8, khi hủy, khi no-show; đua nhận phòng ‖ duyệt FOC; đua xác nhận QR ‖ B9. Không kịp thì ORC ghi rõ việc dời sang tuần Ổn định.
- **Việc QA trong tuần Ổn định:**
  - gỡ `pendingFix` (điều kiện 7);
  - ca E2E cho FOC-01 qua H16 (S4-25) và các gap ở điều kiện 8;
  - chạy lại E2E trên commit sửa 125…132 và kiểm các ca E2E có số theo luật BR v0.3.8.


### 7.9 Tuần Ổn định – CI 39059529608 trên `42fb458`: TC-X-070 đỏ, TC-L4-004 chập chờn (QA, 18/10 ~02:00–03:00)
- **Kết luận TC-X-070 (A1):** đỏ ở H16 bước 2 → 3 (`Tổng cộng` không hiện), không ở H13. Nguyên nhân là kẽ hở đua ở FE: lưu minibar tải lại tóm tắt trả phòng bằng `sum.reload` của lần render cũ (chưa có giờ trả), nên số cần thu tính theo 12:00 trong khi ô giờ là 11:00, và nút "Tiếp tục: Bill & thu tiền" chờ mãi. Ca kiểm bấm nhanh hơn người nên lộ ra. Không do `priorNight.available` (FE-A) hay số cần thu phía server (BE-A): H13 qua bình thường, tóm tắt server trả đúng cho cả hai cách hỏi.
  - Lỗi: **BUG-R2-141** (P3, **FE-A**), chi tiết và bằng chứng ở `bug-list.md` mục 2 và 11.11.
  - Ca kiểm đã sửa: H16 mở bằng `openCheckOut` (chờ tóm tắt có `checkoutTime` = 200 rồi mới bấm) ở TC-X-070, TC-X-071, TC-L4-053, TC-L4-096. Nội dung và kỳ vọng các ca không đổi.
  - Ca hồi quy mới **TC-L4-100** (`ui-clock/checkout.h16.spec.ts`, `knownBug('BUG-R2-141')`): dựng đúng thứ tự request của CI bằng cổng chặn route, không phụ thuộc tốc độ máy. Hiện = "expected failure"; với `E2E_FIXED_BUGS=BUG-R2-141` đỏ đúng chỗ CI. Đóng lỗi = PR sửa xóa dòng `OPEN`.
  - Chạy lại trên `ottimo-qa-s4` (cây = `42fb458`, có khóa đồng hồ): `checkout.h16` + `flow-a1.s4` – 5 ca đạt (TC-L4-100 expected failure). `gen_traceability --strict` exit 0. Prettier, ESLint, tsc sạch.
  - Ca có thể cùng kiểu, chưa sửa vì không phải tệp của QA: `ui-clock/foc.s4.spec.ts` TC-NT-053 (E) (bấm minibar ngay khi mở H16, rồi mở form FOC ở bước 2 – không qua nút Bill nên ít khả năng treo). FE-A có thể dùng `openCheckOut`.
- **TC-L4-004 (clock):** lượt 1 nhận `OD` thay `OC` ngay sau nhận phòng, lượt chạy lại đạt. **Không liên quan bản sửa** – worker chạy bù J8 `hk.daily` của ngày ảo mới sau khi ca vừa nhận phòng (tick 60 giây, `catchUp: 'always'`, chung MutableClock) → R8 `OC → OD`. Lúc đầu QA ghi là chập chờn, không mở mã. **Cập nhật 18/10:** DOM chốt khách đến hôm nay không phải khách ở tiếp (oracle BR-807-01) → QA cấp **BUG-R2-142** (P3, BE-C); không đổi `vday()` (ORC). Cách làm ca bền hơn (chưa làm, cần ORC đồng ý vì chạm mọi ca dùng `vday`): chạy `/__test__/jobs/hk.daily/run` sau khi tua sang ngày ảo, trước khi nhận phòng. Ghi chú cho BE-C/DOM ở `bug-list.md` 11.11 (J8 chạy bù muộn coi khách đến hôm nay là khách ở tiếp).

### 7.10 Kiểm lại lần 3 S4-38 trên `42fb458` – trạng thái mã (QA ghi theo critic và ORC, 18/10 ~03:30)
- **Căn cứ:** `rounds/round-02/reviews/s4-money-recheck3.md`; decision-log ORC 18/10. Chi tiết: `bug-list.md` mục 2 "BUG-R2-134…140" và mục 11.12.
- **Closed:** 111, 125…130 (P1), 131, 132 (P2) – 10/10 mã vòng sửa 2 đã sửa, có số.
- **Open mới:** BUG-R2-134 (P1, BE-A – giá thỏa thuận sau B14 khách xin); 135…138 (P1, BE-B – minibar: hai FOC hai mắt chuỗi, đổi phòng giữa lượt, món sang miễn phí, đổi định mức); 139 (P2, BE-A + FE-A – B18 đêm thêm không bán được, sửa trước cổng); 140 (P3, BE-B + FE-A). Thêm 141 (P3, FE-A – H16, mục 7.9), 142 (P3, BE-C – J8 chạy bù) và **143** (P1, BE-A – dời ngày muộn rồi hủy, oracle BR-309-15; ORC chốt 18/10); cả hai đã có bản sửa ở cây làm việc → **Fixed** (141 QA kiểm lại đạt: TC-L4-100 phải đạt và đạt, H16 + A1 5/5; 142 QA chưa kiểm lại).
- **G1, G7 chưa đạt:** 6 mã P1 Open (134…138, 143) và 2 ca "xem trước ≠ lệnh ghi" (134, 139). Cổng QC Sprint 4 vẫn ở tuần Ổn định.
- **Oracle:** 3 dòng lượt 2 còn thiếu (BR-417-08, BR-417-09, BR-429-20) và dòng cho 135, 137 (BR-434-16, BR-702-03) – QA thêm; dòng cho 134, 136, 138, 139 – DOM thêm. Bỏ `pendingFix` 16 dòng. `validate-fixtures` 0 lỗi.
- **Việc QA tiếp theo:** bảng ca tổ hợp minibar (`product/tests/test-cases/s4-minibar-matrix.md`) → test API gắn `knownBug` theo mã sau khi ARC duyệt mô hình; lượt kiểm lại lần 4 chạy lại toàn bộ `r3*`, `x-r3*`.

### 7.11 Ca hồi quy minibar M-1 và BUG-R2-139 (QA, 18/10 ~03:45–04:30)
- `s4-minibar-matrix.md` v0.2 sửa theo ARC mục 16.5 (Q1–Q4 đã trả lời; M2–M4 thay bằng R1–R10; bỏ chú thích "DOM (c) chưa chốt"; thêm ca 8–11).
- Test: `e2e/clock/minibar-matrix.s4.clock.spec.ts` (TC-L4-101…119) và `e2e/clock/late-fee-qr.s4.clock.spec.ts` (TC-L4-120, 121), gắn `knownBug` theo mã. Đặt ở project `clock`, không ở `e2e/api/` (cần đồng hồ ảo và sửa danh mục dùng chung).
- Trên `ottimo-qa-s4` (api `42fb458`): 21/21 đúng kỳ vọng (3 đối chứng đạt, 18 `knownBug` hỏng đúng lỗi). Chi tiết: `bug-list.md` mục 11.13. TC-L4-071 sửa theo R5, chạy lại đạt.
- **Cập nhật ~05:20:** stack QA dựng lại api-dist10 từ cây chung (M-1/0065 của BE-B, 139 của BE-A) → 22/22 đạt (thêm TC-L4-122 – việc `minibar_refill` tủ căn cũ). BUG-R2-135…139 → Fixed (QA kiểm đạt); 140 còn phần Desk. Commit gộp phải xóa mã đã sửa khỏi `OPEN`.

### 7.12 Kiểm lại lần 4 S4-38 – việc của QA (18/10 ~05:10)
- Đóng 134…139, 141, 142, 143 (CI 39069264514 xanh trên `2efec17`); 140 chờ kiểm phần Desk. Cấp BUG-R2-144…154 (critic) và 155…157 (DOM). Tiêu đề 129 sửa theo N-1.
- Oracle 144, 145 (BR-703-02, BR-417-11); ca SEC `login-locked` TC-L4-123 (`knownBug('BUG-R2-146')`) hỏng đúng lỗi trên `365486f`.
- 209 ca cũ: 178 `superseded`, 31 giữ (133, Note) – `scratchpad/qa-s4/s438-superseded.json`. `pendingFix`: gỡ BR-522-03/04, giữ BR-417-03, BR-602-05. Chi tiết: `bug-list.md` 11.15.

### 7.13 Vòng sửa 4 – Kiểm thử minibar kỳ nạp và Desk (QA, 18/10 ~05:20)
- S4-09 Agoda quay về (TC-L4-124), Desk 144 (TC-L4-125) và N-1 (TC-L4-126), DOM R9 r9_t (TC-L4-131): đạt trên cây chung. DOM R9 r9_16/16b/16c/18 (TC-L4-127…130): `knownBug('BUG-R2-144')` – chờ BE-B/BE-A làm theo R9. Chi tiết: `bug-list.md` 11.16; bảng ca `s4-minibar-matrix.md` mục 9.
