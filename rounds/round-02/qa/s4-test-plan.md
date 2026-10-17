# Kế hoạch kiểm thử Sprint 4 – Round 2

- Tác giả: QA | Ngày: 17/10/2026 (D1) | Bước: Sản xuất / Kiểm thử song song | Phiên bản: 1.1 (17/10 tối: thêm 3.5, 5.3, 5.4, 12 – rà ca nháp FE-A, FE-LP, FE-B; TC-L3-077) · **1.2 (17/10 ~21:40)**: 5.4 đã làm – TC-L3-077 theo 0.3.7 · **1.3 (17/10 ~22:30)**: 5.2 – A1 (TC-X-070) chạy được
- Căn cứ:
  - `rounds/round-02/sprint-4-plan.md` (ĐÓNG BĂNG D1): mục 4.1 (mốc D3/D5/D7/D8), 10 (T1–T12), 11 (G1–G8), 12.3 (bước cắt QA-1…QA-3);
  - `product/docs/qa/test-strategy.md` (tầng test, mức lỗi P0–P3, dữ liệu DS-E);
  - `product/docs/business-rules.md` v0.3.6 và `product/tests/fixtures/br-examples.json` (oracle);
  - `product/docs/api/openapi.yaml` 0.3.7 (đóng băng D1);
  - `rounds/round-02/qa/bug-list.md`, `product/tests/test-cases/r1-main-flows.md` v0.3.15.
- Người review bắt buộc (protocol mục 5): BA, PO. Khuyến nghị: QC.

## 0. Tóm tắt

1. Sprint 4 kiểm thử theo 12 nhóm T1–T12 của kế hoạch Sprint 4 mục 10. Ưu tiên cao nhất là **T1 tiền** và **T4 E2E liền mạch A1/A4**, vì đó là G1 và G4 của cổng QC.
2. **Ca tự động cho 7 lỗi tiền BUG-R2-055…061 và các quy tắc mới đã có từ D1**, cả tầng API và tầng đồng hồ (mục 4). Ca viết theo hợp đồng 0.3.7, số tiền đọc từ `br-examples.json`.
3. Lỗi chưa sửa được đánh dấu **ở dòng đầu ca** qua một danh sách chung `support/known-bugs.ts`. Phần dựng dữ liệu chạy trong `precondition()`: hỏng ở đó thì ca đỏ thật, không bị che (bài học BUG-R2-064).
4. **Đóng lỗi** = PR sửa lỗi xóa mã lỗi khỏi `OPEN` trong `known-bugs.ts`. Nếu quên, Playwright báo "expected to fail but passed" và CI đỏ. Nhờ vậy không có ca nào "xanh giả" sau khi sửa.
5. **T9 thu hẹp từ D1 (QA-1):** mỗi bản build chỉ chạy các ca UI ghi thật (`WRITES`) cùng A1/A4. Phần UI và axe còn lại chạy hằng đêm. OPS cần sửa `ci.yml` như mục 3.2.
6. Đã chạy trên ảnh dựng từ HEAD `94c711d` (stack QA riêng `ottimo-qa-s4`):
   - mọi ca lỗi đã biết hỏng **đúng chỗ của lỗi**;
   - mọi ca hồi quy xanh;
   - 2 lượt liên tiếp, 0 ca chập chờn.
   Kết quả chi tiết ở `qa/s4-test-report.md`.

## 1. Phạm vi

### 1.1 Trong phạm vi Sprint 4
- **Tiền (CỔNG, G1).** Gồm:
  - BUG-R2-055…061 (S4-01/02/03/05/07/18/22/34);
  - S4-21 + S4-04 (ESC-019 A, xem trước = lệnh ghi);
  - S4-23 phần thứ tự (BR-434-11/12), S4-06, S4-08, S4-13, S4-35;
  - #6 `expectedVersion` (B-6), BUG-R2-038 (S4-10, BR-402-01);
  - tập đóng `AuditEvent.action` (`money`);
  - phạm vi kiểm chứng đối kháng S4-38 (gồm S4-37 `otaPenaltyVnd`, S4-47 thu trước B18).
- **Bảo mật cần QA (G2).** Ca hợp đồng cho S4-39 (`removePartyMember.guestUploadPersonIndex`, `DOCUMENT_UNCLAIMED_EXISTS`), S4-11/32 (`id_doc_hmac`, `idDocLast4` chỉ khi P05), S4-17 (test cục bộ). SEC là người ghi Verified.
- **Story Must R2 mới.** EP07/EP08 (US-052…057, 061, 062 – PWA buồng phòng, bảo trì), EP14 (US-108…110, 112), EP01 (US-010…012), US-066. Kèm phần dời Sprint 4 của 24 story "Đang nghiệm thu" (kế hoạch mục 5.2).
- **Luồng liền mạch.**
  - A1: báo giá → VietQR cọc → … → trả phòng có FOC → PWA dọn, kiểm → `VI`.
  - A4: PWA báo sự cố → phiếu sửa + OOO → chặn bán → đóng phiếu → `VD` → dọn → bán lại.
  - A7: phần KPI và "Cần chú ý".
- **Thương hiệu (G8).** Token DS v0.4 (B0 + B1), axe AA, font tự host.
- **Truy vết (T10).** `gen_traceability.py --strict` exit 0 ở mọi commit.

### 1.2 Ngoài phạm vi Sprint 4
- Mục **contract-ahead R3** (kế hoạch mục 8.2b: B-2, B-3, B-4, B-5, B-7, B-8, B-9, B-11, B-12). QA không viết ca, QC không tính là lệch hợp đồng.
- Tự gửi tin Zalo/email (US-126, US-161, US-162 – R3). Riêng tình huống #14 theo BR-978 là NÊN (T12).
- Landing LP-v1 (T11): cổng riêng; dừng cùng FE-LP (QA-2).
- Hiệu năng p95 gia hạn 62 đêm (S4-36), làm ở giai đoạn Ổn định.
- Staging qua Caddy thật (S4-15), làm khi có VPS.

## 2. Nhóm kiểm thử T1–T12

"Tầng": **A** = API trên stack thật, **E** = UI bấm thật, **⏱** = project `clock` (đồng hồ giả, tuần tự).

| Nhóm | Nội dung | TC chính | Tầng – tệp | Mục S4 / lỗi | Trạng thái D1 |
|---|---|---|---|---|---|
| **T1** Tiền – hồi quy và oracle | BR-434 (4A→2A→4A, X2b, BR-434-02…12); BR-424 căn gốc; BR-429-03…10 (ESC-019); BUG-061 ba ca; B12 + FOC; S4-06, S4-08; `checkIn.payment` (BR-402-01); tập đóng `AuditEvent.action`; ca `otaPenaltyVnd`, thu trước B18 | TC-L2-084, 087…100; TC-NT-045…051; TC-L3-011 (c), TC-L3-078; TC-L4-097, 098 | A `e2e/api/money-s4.api.spec.ts`; ⏱ `e2e/clock/money-s4.clock.spec.ts` | 055…061, S4-21, S4-04, S4-23, S4-35, BUG-038 | **Đã có ca** (mục 4). S4-06, S4-08, S4-37, S4-47: viết khi BE-B giao (D3–D5) |
| **T2** Đồng thời | S4-13: duyệt FOC đua với B10/B11/resync; chống trùng B7 có xem trước; **#6** có/thiếu/lệch `expectedVersion` | TC-NT-050; S4-13 (TC mới khi BE-B giao) | A | S4-13, B-6 | **#6 đã có ca** (API). Phần UI của #6 viết cùng PR FE-A. S4-13: D4–D5 |
| **T3** Kiểm chứng đối kháng | ORC + QA theo phạm vi S4-38 | – | báo cáo `reviews/s4-money-verification.md` | S4-38, S4-37, S4-47, S4-23 | Bắt đầu khi M1 xong mã (muộn nhất D5); báo cáo **trước hết D7** |
| **T4** E2E liền mạch | A1, A4 bấm thật bước ghi; không `test.fail` giữa chuỗi; vào `WRITES` | TC-X (A1), TC-X (A4) | E `e2e/ui/flow-a1.s4.spec.ts`, `flow-a4.s4.spec.ts` | ĐK-S3-7, BUG-064 | **BUG-064 đã sửa ở test** (mục 6). A1/A4: thiết kế ở mục 5, viết theo nhịp giao S4-28 → S4-25 → PWA |
| **T5** PWA | 360×800, 390×844; banner mất mạng, đọc offline; hoàn tác 10 giây không gọi server; `performedAt` ngoài khoảng bị từ chối; không có C3 | TC-L6-0xx | E project `mobile-webkit`, `android-chromium` | US-052…062 | Chờ khung PWA (MOB) + module HK (BE-C, trước D4) |
| **T6** Yêu cầu khách | SM-15, định tuyến BR-811 (đồng hồ trước/sau hạn, trong/ngoài giờ trực), phí dọn thêm BR-506; guest-web không lộ dữ liệu nhạy cảm | TC-L7-0xx | A + ⏱ + E guest-web | US-108…110 | Chờ BE-D (EP14) |
| **T7** Tổng quan | K-01…K-03 khớp DATA; "Cần chú ý" đủ loại (gồm `closed_reservation_credit`, `ota_no_show_report`, `registration_party_docs_unlinked`); SSE mất/kết nối lại, đúng vai | TC-L8-0xx | A + E | US-010…012 | Chờ BE-D |
| **T8** Quyền | Ma trận sinh từ `x-roles` cho operation HK/MT/yêu cầu khách/minibar; HK không thấy giá vốn | `fixtures/rbac-cases.json` | A `e2e/rbac/` | US-003 AC2 | Runner sẵn có. Thêm `sprint4-ops.ts` khi operation có trên build |
| **T9** Giao diện + thương hiệu | axe trên màn mới và màn cũ sau token DS v0.4; font tự host, 0 yêu cầu font ra ngoài | TC-X-040… | E | S4-49, G8 | **Cách chạy mới từ D1** (mục 3.2) |
| **T10** Truy vết | TC cho mọi AC Must R2; `--strict` exit 0 | – | `tools/gen_traceability.py` | R-S4-8 | **Xanh** (254/254 AC, 443 TC) |
| **T11** LP-v1 | 3 cỡ màn × 2 ngôn ngữ; link Zalo/WhatsApp/gọi/email; 0 yêu cầu bên thứ ba; LCP; bàn phím | TC-LP-xx | `e2e/landing/` (FE-LP đã dựng khung) | ESC-020 | Cổng riêng. Dừng cùng FE-LP (QA-2) |
| **T12** Còn nợ | S4-24 (BUG-064 trước), S4-20 `dev_clock`; S4-33 (sang Ổn định ở bước cắt 6); tình huống #14 theo BR-978 | TC-L2-026, 056, 060…062… | A/⏱ | S4-24, S4-20, S4-33 | **BUG-064 xong ở test.** S4-20: D5–D6 |

## 3. Cách chạy

### 3.1 Mỗi bản build (PR / push nhánh chính)

| Project | Phạm vi | Ghi chú |
|---|---|---|
| `smoke`, `rbac`, `api`, `limits`, `rbac-logout`, `serial` | Toàn bộ | Gồm `money-s4.api.spec.ts` |
| `clock` | Toàn bộ | Gồm `money-s4.clock.spec.ts`. Tuần tự, sau mọi project API |
| `desk-chromium`, `desk-clock`, `mobile-*` | **Chỉ** ca có tag `@write`, `@a1`, `@a4` (danh sách `WRITES` trong `ci.yml`) | QA-1. Xem 3.2 |
| `db-outage` | Toàn bộ | Chạy cuối |

Bước kiểm CI phải giữ xanh (G5):
- `gen_traceability.py --strict`;
- `gen_rbac_cases.py --check`;
- `validate-fixtures.mjs`;
- Prettier;
- ESLint + tsc (`@ottimo/tests`).

### 3.2 T9 – ca UI và axe còn lại chạy hằng đêm (QA-1, áp từ D1)

Việc của OPS trong `ci.yml` (QA không tự sửa `ci.yml`, ghi ở đây để OPS làm trong S4):
1. **Mỗi bản build**:
   - gọi Playwright cho các project UI với `--grep "@write|@a1|@a4"`;
   - bước "UI cases ran" chỉ kiểm `WRITES`, `WRITES` thêm mã ca A1/A4 khi QA báo;
   - bỏ điều kiện "axe ≥ 9 ca" khỏi bước này (chuyển sang lượt đêm).
2. **Lượt hằng đêm**:
   - thêm `on: schedule` (ví dụ `cron: '0 19 * * *'` UTC = 02:00 giờ Đà Lạt) chạy toàn bộ project UI (`desk-chromium`, `desk-clock`, `mobile-webkit`, `android-chromium`) cùng bước "axe ≥ 9 ca";
   - tải `junit.xml` và `test-results` lên ở **mọi** lượt (`if: always()`).
3. **Chống che lỗi khi chạy lại (BUG-R2-064 điểm 2):** sau bước E2E, đọc `junit.xml`. Ca có annotation `bug` và có lượt chạy lại (`retry` > 0) thì báo đỏ. Ca `precondition-failed` luôn đỏ.
4. **Lỗi đêm nào thì QA ghi sổ sáng hôm sau** (`qa/bug-list.md`), và chạy lại ca đó ở stack QA trước 10:00.

Tới khi OPS sửa xong, CI vẫn chạy đủ mọi ca UI như Sprint 3. Không có ca nào bị bỏ, chỉ chậm hơn.

### 3.3 Lỗi đã biết và cách đóng (`support/known-bugs.ts`)

- Ca có lỗi chưa sửa:
  - gọi `knownBug('BUG-R2-0xx', …)` ở **dòng đầu**, trước mọi bước;
  - dựng dữ liệu trong `precondition('…', async () => …)`;
  - ca chỉ chứa các bước của lỗi đó.
- `knownBug` thêm annotation `bug` cho junit/HTML. Còn ít nhất một mã đang mở thì đánh `test.fail`. Mã sai dạng → ca dừng ngay.
- **Đóng:**
  1. PR sửa lỗi xóa mã khỏi `OPEN` và phải chạy E2E xanh.
  2. QA review PR đó.
  3. QA đóng lỗi trong `bug-list.md` sau khi tự kiểm lại trên CI của commit gộp.
- **Kiểm nhánh sửa ở máy không cần sửa tệp:** đặt `E2E_FIXED_BUGS=BUG-R2-056,S4-21`. Ca của các mã đó chạy như đã sửa và in đủ lỗi nếu còn trượt.
- **Lưu ý cho BE-B (17/10):** cây làm việc đã bỏ `pendingFix` của BR-315-06, BR-412-15/16/17, BR-433-03, BR-434-07/08 (đang sửa S4-02/18/22/34). PR gộp bản sửa đó phải xóa luôn BUG-R2-056, 059, 060, 061 khỏi `OPEN`. Nếu không, các ca E2E tương ứng "expected to fail but passed" và CI đỏ.

### 3.4 Hai cách xem kết quả của QA
- **Thường:** `pnpm test:e2e` (ca lỗi đã biết tính là "expected").
- **Chẩn đoán:** `E2E_FIXED_BUGS=<mọi mã>` + `--reporter=json`. Mỗi ca lỗi đã biết in đúng chỗ hỏng, dùng để xác nhận ca hỏng **đúng lỗi**, không hỏng vì dữ liệu.

### 3.5 Quy ước cho ca UI do dev viết (FE-A, FE-B, FE-LP, MOB) – QA rà
- **Cùng quy ước** `knownBug()` ở dòng đầu + `precondition()`. Mã lỗi đã biết: `BUG-R2-xxx`, `S4-xx`, `B-x`, hoặc **`US-xxx/ACn`** cho phần story chưa gộp (ví dụ `US-151/AC7`).
- **Thêm mã mới vào `OPEN` thì chỉ thêm dòng, không chép đè cả khối.** Ngày 17/10 tối, mã rời `OPEN` theo đúng quy trình 3.3: BE-A xóa BUG-R2-038, 057, 058, S4-21, S4-04 (`outputs/BE/s4-be-a.md`); BUG-R2-055, 056, 059, 060, 061, 104 và S4-23 cũng đã rời `OPEN`. QA đối chiếu bằng ca chạy trên ảnh dựng từ cây làm việc (`s4-test-report.md` mục 5) trước khi đóng lỗi.
- **Tham số chung chỉ đặt cho ngày ảo.** Ví dụ tài khoản nhận VietQR (`payment_receiving_account`): ca cần nó chạy ở `desk-clock`/`clock`, gọi `ensureReceivingAccount(request, D)`. Ngày thật phải giữ "chưa cấu hình" cho TC-L4-065. Vì vậy QA đã chuyển TC-L5-025 (a) (S4-28) sang `ui-clock/deposit-qr.s4.spec.ts`, và thêm tài khoản nhận cho TC-L3-079 (b).
- **Chuỗi giao diện đọc từ `design/copy/strings-*.json` của cùng commit**, không gõ cứng. Lời chào guest-web nay là `gw.welcome_title` / `gw.welcome_title_plain` (tiếng Anh ở mọi ngôn ngữ – DS 11.2), thay `guest.hello`.
- **Mã TC:** dev lấy số tiếp theo trong `r1-main-flows.md` và ghi một dòng phiên bản. QA rà cột Story/AC (đúng 9 cột) và chạy `gen_traceability.py --strict` trước khi trả.

### 3.6 Mặc định của harness (17/10 tối – theo 0.3.7)
Mỗi lần harness tự làm thay ca, nó ghi annotation `harness` để người đọc kết quả thấy. Ca có chủ đề là việc đó thì tự gửi giá trị của mình, harness không can thiệp.

| Helper | Mặc định | Ca muốn tự kiểm thì |
|---|---|---|
| `checkIn` (`support/s3.ts`) | Tiền phòng đã đủ, chỉ thiếu phụ thu nhận sớm / đêm B9a sắp ghi (409 `balance_paid`) → thu tiền mặt đúng `amountDueAtCheckinVnd` trong cùng B9 (BR-402 v0.3.6, `checkIn.payment`) | Gửi `payment` hoặc `{ autoPay: false }` |
| `approve` (`support/s3.ts`) | 422 `expectedVersion:REQUIRED` (B-6) → đọc `version` từ hàng chờ của người duyệt, gửi lại một lần | Gọi `approveRequest` trực tiếp (`decideWith`) |
| `action` (`support/s2.ts`) | 409 `CONCURRENT_UPDATE` (khóa dòng do ca song song, fail-fast) → gửi lại tối đa 2 lần theo `Retry-After`, khóa Idempotency mới | Truyền `idempotencyKey` dạng chuỗi |
| `money-s4.api.spec.ts` | Chạy tuần tự trong tệp (các ca tranh cùng căn đích) | – |

## 4. Ca tự động tiền đã có từ D1

Số tiền đều đọc từ `br-examples.json`. Ngày được chuyển sang cửa sổ trống **cùng thứ trong tuần** với ví dụ BR (`support/s4-money.ts` `mapper()`), nên giá đêm thường/cuối tuần đúng như ví dụ.

| Mã lỗi / mục | Ca (oracle) | Tệp | Trên HEAD `94c711d` hỏng tại |
|---|---|---|---|
| BUG-R2-055 (S4-01) | TC-NT-051 (BR-434-07, đơn CTV) | api | 500 `INTERNAL_ERROR` khi kéo 7 đêm |
| BUG-R2-056 (S4-02) | TC-NT-047 phần S4-02 (BR-434-07); TC-NT-049 (2) (BR-434-08) | api | FOC kẹt 900.000; FOC phụ thu người không quay lại (0 thay vì 150.000) |
| BUG-R2-057 (S4-05) | TC-L4-097 (BR-424-04) | clock | đêm ngày 2 còn 250.000 – cộng dồn |
| BUG-R2-058 (S4-07) | TC-L2-084 (a), (b) (BR-429-08) | api | phụ thu người giữ 300.000 sau nâng hạng |
| BUG-R2-059 (S4-18) | TC-NT-046 phần B7 (BR-434-09); TC-NT-049 (4), (5), (6) (BR-433-03, BR-434-10); TC-NT-046 (a) (BR-412-17) | api + clock | duyệt xong FOC không áp (0); yêu cầu vẫn `pending` khi đêm bị bỏ; không `focState`/audit |
| BUG-R2-060 (S4-22) | TC-NT-049 (3) (BR-315-06) | clock | no-show không trả hạn mức; khôi phục mất FOC |
| BUG-R2-061 (S4-34) | TC-NT-045 (a), (b) (BR-412-15/16); TC-NT-046 (a) (BR-412-17) | clock | FOC 0 / 210.000 thay vì 210.000 / 350.000 |
| S4-21 (ESC-019 A) | TC-L2-084 (b), 087, 088 (a), 089, 091 (a)(c)(d), 092 (xem trước), 093 (b), 095, 099 (a)(b)(c), 100; BR-434-06 B7; TC-NT-047/048 | api | `previewMoveReservation` 404; `moveReservation` bỏ qua `expectedDeltaVnd` |
| S4-04 | TC-L4-098 (b) (B14 FOC > giá mới) | clock | số ghi (0) ≠ số xem trước (−125.000) |
| S4-23 | TC-NT-047 (BR-434-11, cả bước 5 đảo thứ tự), TC-NT-048 (BR-434-12) | api | chờ S4-21; thiếu `effectiveAmountVnd` |
| S4-35 | TC-L2-099 (c) (`adjustFolioLine` 937.000) | api | chờ S4-21 |
| B-6 (#6) | TC-NT-050 (duyệt/từ chối hoàn có/thiếu/lệch phiên bản) | api | thiếu `expectedVersion` vẫn duyệt được; `version` không có trong `ApprovalRequest` |
| BUG-R2-038 (S4-10) | TC-L3-011 (c), TC-L3-078 (BR-402-01) | clock | thiếu `amountDueAtCheckinVnd`; `payment` chưa có |
| **BUG-R2-104** (mới) | TC-NT-049 (4) phần hạn mức (BR-433-03) | clock | giảm giá đặc biệt 300.000 định tuyến lên quản lý, lễ tân trưởng không duyệt được |
| Hồi quy (phải xanh) | TC-L2-084 (c), 092 (a), 093 (a)(c)(e), 099 (d); BR-434-06 do OTTIMO; TC-NT-049 (1) tập đóng money; B-6 FOC không cần `expectedVersion`; TC-L4-098 (a) | api + clock | **xanh** |

Chưa có ca, sẽ viết khi BE giao (không cần đổi hợp đồng):
- S4-06: đơn hủy/no-show còn tiền dư → yêu cầu hoàn tự tạo + `closed_reservation_credit`.
- S4-08: `serviceLines` / `retainLines`.
- S4-13: đua duyệt FOC với B10/B11/resync.
- S4-37: trần `otaPenaltyVnd` cộng phụ thu người.
- S4-47: thu trước B18 vượt số còn phải thu.
- BR-434-02/03 qua endpoint `move` (S4-24 phần NÊN).

## 5. E2E liền mạch A1 / A4 (T4, ĐK-S3-7, M6)

### 5.1 Nguyên tắc
- **Một ca một chuỗi**, các bước ghi bấm thật trên giao diện. Phần dựng dữ liệu không phải chủ đề thì dùng API.
- **Không** `test.fail` giữa chuỗi. Bước nào chưa có thì ca chưa vào bộ chạy (`test.fixme` cả ca, có lý do), không che từng bước.
- Số tiền đọc từ oracle. Mỗi bước ghi đọc lại bằng API (`write-steps.ts` ghi request trình duyệt gửi).
- Chạy ở `desk-clock` (cần đồng hồ). Thêm mã ca vào `WRITES` khi xanh 2 lượt liên tiếp ở stack QA.

### 5.2 Chuỗi A1 và phụ thuộc

| Bước | Màn | Phụ thuộc |
|---|---|---|
| 1. Báo giá, giữ chỗ | H12 | Có (Sprint 3) |
| 2. VietQR cọc, Xác nhận cọc | H12, H11 | S4-28 (FE-A; ca nháp `ui/desk-writes.s4.spec.ts` đã có) |
| 3. Nhận phòng (giấy tờ, thu trong B9) | H13 | S4-10 (BE-A, FE-A) |
| 4. FOC có duyệt khi trả phòng | H15/H16 | S4-25 (gộp sau khi đóng 056, 059, 061) |
| 5. Bill → VietQR → hoàn tất | H16 | Có (Sprint 3) |
| 6. PWA dọn, kiểm → `VI` | H19, H20 | MOB, BE-C (module HK trước D4) |

**Dự kiến:** bước 1–5 xanh ở D6, đủ chuỗi ở D7–D8.

**Đã làm (17/10 ~22:30): A1 chạy được, xanh 3/3 trên stack QA.**
- Ca: TC-X-070, `e2e/ui-clock/flow-a1.s4.spec.ts`, project `desk-clock`. Chuỗi đủ 6 bước: H12 → H11 → H13 → H17 → H16 → PWA dọn, kiểm → `VI`.
- FOC trong chuỗi: xin lúc nhận sớm, duyệt ở H17 (ORC 17/10). Phần "xin FOC ở bước trả phòng" tách thành ca **TC-X-071**, `knownBug('S4-25')` ở dòng đầu (đã thêm `S4-25` vào `OPEN`). Ca này đỏ đúng chỗ thiếu nút "Mở form miễn phí / giảm giá".
- **18/10 (CI 39059529608 trên `42fb458`):** TC-X-070 đỏ ở bước 5 (H16 bước 2 → 3) do BUG-R2-141 (P3, FE-A – lưu minibar tải lại tóm tắt không kèm giờ trả). Các ca H16 mở màn bằng `openCheckOut` (chờ số cần thu theo giờ mặc định rồi mới bấm); ca hồi quy riêng TC-L4-100. Chi tiết: `s4-test-report.md` mục 7.9.
- Đề nghị OPS/ORC đưa **TC-X-070** vào `WRITES`. TC-X-071 vào khi S4-25 gộp. Chuỗi A4 đi H21 → H22 → form OOO Desk → `VD` → dọn → bán lại, phụ thuộc BE-C, MOB, FE-B, dự kiến D7–D8.

### 5.3 Ca UI cho màn vận hành của FE-B (nối vào A4)

FE-B đợt 2 đã có màn trên MSW theo 0.3.7, unit test xanh. API của BE-C, BE-D, BE-B chưa gộp. QA viết ca UI bấm thật trong `e2e/ui/ops.s4.spec.ts` (đồng hồ thật) và `e2e/ui-clock/ops.s4.spec.ts` (cần ngày ảo). Ca nào phụ thuộc API chưa gộp thì đánh `knownBug` bằng mã story.

| Màn | Ca | Story/AC | `knownBug` tới khi gộp |
|---|---|---|---|
| S10 `/housekeeping` | Tick "Đã làm xong" → bộ đếm "x/y xong" đổi; hủy "Khác" bắt buộc ghi chú; tạo việc tay; trả phòng xong → "Dọn trả phòng" có ngay | US-054/AC1, AC3; US-052 | `US-054` (BE-C) |
| S11 `/maintenance` – tạo phiếu | Phiếu + "Khóa căn": toast nêu khóa đêm …, mở bán lại từ … (ngày server); thiếu mô tả không lưu | US-061/AC1, AC4 | `US-061` (BE-C) |
| S11 – 409 ba nhánh | Có khách đang ở → không khóa, "Tạo phiếu không khóa"; trùng đơn tương lai → danh sách đơn kèm link, không có đường "vẫn khóa"; trùng khóa khác → hướng dẫn sang tab Khóa phòng | US-061/AC2, AC3 | `US-061` |
| S11 – "Sửa xong" | Hộp hậu quả, focus nút an toàn → căn `VD` + việc "Dọn sau sửa chữa" + khối kết thúc | US-062/AC1; US-135 | `US-062` |
| Khóa có kế hoạch | Tạo khối, "Đổi ngày mở bán" (If-Match), "Hủy khóa", "Mở khóa sớm" (MGR+) | US-019 | `US-019` (BE-C) |
| H03 hàng yêu cầu khách | Quá hạn nhận lên đầu; "Đã nhận"; "Xong" chỉ với yêu cầu chuyển lễ tân; "Không thực hiện được" + lý do; chặn chuỗi số | US-110/AC1–AC3 | `US-110` (BE-D) |
| S13 `/settings/minibar` | OWN/MGR đổi giá (áp lần kiểm sau, dòng folio cũ giữ); FD/FDL/HK chỉ đọc, không cột giá vốn | US-066/AC1–AC3; US-003/AC2 | `US-066` (BE-B) |

**A4 liền mạch** (`ui-clock/flow-a4.s4.spec.ts`, một ca, không `test.fail` giữa chuỗi):
1. PWA H21 báo sự cố;
2. Desk S11 thấy phiếu + khối OOO;
3. rack / đặt phòng / phòng trống bị chặn;
4. MT H22 đóng phiếu;
5. căn `VD` + việc "Dọn sau sửa chữa";
6. PWA H20 dọn, kiểm → `VI`;
7. bán lại được.

Ca chuỗi A4 viết khi đủ: PWA H21/H22 (MOB), API phiếu sửa + khối OOO + `room_status` (BE-C). Trước đó từng màn có ca riêng ở bảng trên. Dự kiến D7–D8.

**Đã làm (17/10 ~22:50):** A4 = **TC-X-072** (`e2e/ui-clock/flow-a4.s4.spec.ts`), xanh trên stack QA (report 7.6). **Đã làm (~23:10):** `ui-clock/ops.s4.spec.ts` (S11 tạo phiếu + khóa, 409 căn có khách, S10 việc tay/làm xong/hủy; S11 Desk Sửa xong = `knownBug('BUG-R2-108')`), `ui/ops.s4.spec.ts` (S13 quyền xem/sửa minibar). Còn: H03 (US-110), khóa có kế hoạch (US-019), đổi giá minibar (project `serial`).

### 5.4 Ca phải sửa cùng lúc BE-C gộp S4-39
- **TC-L3-077** (`ui-clock/party-docs.h14.spec.ts`, đang trong `WRITES`) kiểm "Gắn người" kiểu 0.3.6 và bỏ người không gửi số ô.
- Khi BE-C gộp S4-39, QA sửa ca này trong **cùng PR**: hộp Gắn người mới chỉ gửi `{partyMemberId}`, hộp chọn ô "Khách n" (`guestUploadPersonIndex`). Ca mới TC-L3-080 (a)(b) của FE-A đã có.
- Không sửa trước. Nếu sửa trước, ca trong `WRITES` đỏ trên nhánh chính.
- **Đã làm (17/10 ~21:40, bước Kiểm thử – CI `b6153b7` đỏ TC-L3-077 cả 2 lượt).** Ca chuyển sang đường **giảm số khách** (`updateReservation` 3 → 2 người lớn): đây là đường duy nhất còn hẹn 24 giờ (`unclaimedUntil`) và "Cần chú ý" `registration_party_docs_unlinked` theo 0.3.7. Đường bỏ người có chọn ô thuộc TC-L3-080 (a). Số đêm theo `minStayFor(ngày đến)` (BR-113). "Gắn người" kiểm thân đúng `{partyMemberId}`, không đọc C3. Kết quả: 3/3 đạt + 1 lượt ép ngày đến thứ Sáu đạt (`s4-test-report.md` mục 6). Desk gửi `guestUploadPersonIndex` đúng (H15 `StayDialogs.tsx`, TC-L3-080 (a) đạt) – không có lỗi FE.

## 6. Bài học BUG-R2-064 – đã sửa ở test (S4-24 phần CỔNG)

Ba ca có `test.fail` gọi giữa ca được tách. Phần lỗi đã biết nay là ca riêng, `knownBug` ở dòng đầu:
- TC-L3-011 → TC-L3-011 (xanh) + **TC-L3-011 (c)** (BUG-R2-038);
- TC-L3-032 → **TC-L3-032 (a)** và **(b)** (BUG-R2-033);
- TC-L3-074 → TC-L3-074 (xanh) + **TC-L3-074 (b)** (BUG-R2-054; nhận dữ liệu từ ca trước trong cùng file, project `clock` 1 worker).

Trong `product/tests/e2e` không còn lệnh `test.fail(` nào ngoài `known-bugs.ts`. Phần CI (báo đỏ khi ca có annotation `bug` bị chạy lại; tải báo cáo ở mọi lượt) là việc của OPS, mục 3.2.

## 7. Dữ liệu kiểm thử
- **DS-E** (seed CI), dữ liệu giả, tài khoản `qa.*`. Mật khẩu và token chỉ lấy từ env của stack dùng một lần; không ghi vào repo.
- **Project `api`:** ngày đến trong hôm nay + 200…360 ngày (trong `booking_window_days` 365). Mọi căn mà ca sẽ đổi sang đều được kiểm trống trước, ca song song không chiếm được. Đơn được hủy ở `afterEach`.
- **Project `clock`:** mỗi ca một ngày ảo riêng (> hôm nay + 800). Ca có kiểm hạn mức tháng BR-433 dùng ngày đầu của một tháng lịch mới (`ownMonthDay`): hạn mức của `qa.fdl` bắt đầu từ 0, kiểm được số tuyệt đối.
- **Người duyệt:** ca không kiểm hạn mức thì dùng `qa.mgr`, để hạn mức tháng của `qa.fdl` ở tháng thật không làm ca đỏ khi chạy lại trên stack dùng chung.

## 8. Môi trường
- **CI:** stack compose dùng một lần (`docker images build · E2E smoke`), `E2E_COMPOSE_CONTROL=1`, `retries: 1`.
- **Stack QA riêng `ottimo-qa-s4`:**
  - ảnh dựng bằng `git archive` từ commit đang kiểm, `INCLUDE_TEST_SUPPORT=1`;
  - cổng 43000 (api), 48081–48083 (web), 45432 (PostgreSQL);
  - QA **không** đụng `ottimo-demo` (8181–8183, 3100), `ottimo-dev`, `ottimo-fe07`;
  - ba stack cũ `ottimo-qa-s3a/b/c` vẫn khởi động lại liên tục (đã báo ở S3) – cần ORC/chủ máy dừng.
- **Staging (ĐK-S3-8):** khi INV gửi VPS (dự kiến 19/10), QA chạy A1 phần Sprint 3, S4-15 qua Caddy thật và PWA trên điện thoại thật.

## 9. Tiêu chí vào / ra

### 9.1 Vào (QA nhận một hạng mục để kiểm)
- Có PR hoặc commit, CI xanh phần `build-test`.
- Hợp đồng không đổi so với bản đóng băng D1. Có đổi thì ARC đã báo trong ngày.
- Lỗi tiền: BE nêu rõ ca oracle nào đã xanh ở test của BE, và đã xóa mã lỗi khỏi `OPEN`.

### 9.2 Theo mốc (kế hoạch mục 4.1)

| Mốc | QA kiểm | Báo |
|---|---|---|
| **D3** | Ca E2E của S4-07, S4-05, S4-02, S4-18 xanh trên nhánh của PR (`E2E_FIXED_BUGS` hoặc đã xóa khỏi `OPEN`) | QA → ORC (cùng BE-A, BE-B) |
| **D5** | M1 đủ ca xanh: 055…061, S4-23 thứ tự, #6, BUG-038. QA bắt đầu kiểm lại và S4-38 | QA → ORC |
| **D7** | Báo cáo `reviews/s4-money-verification.md` (0 ca lệch tiền, kết luận S4-37, S4-47) | ORC + QA |
| **D8** | **G1 xanh** trên CI của commit chấm. Không xanh → cổng lùi sang tuần Ổn định (11.2) | QA → ORC, QC |

### 9.3 Ra (QA chuyển cho QC chấm cổng Sprint 4)
- **G1:**
  - BUG-R2-055…061 và BUG-R2-038 **Closed**;
  - mọi mã tiền đã rời `OPEN`;
  - ca tiền ở mục 4 xanh 0 lần chạy lại;
  - có báo cáo S4-38.
- **G4:** A1 và A4 xanh trên CI, nằm trong `WRITES`; BUG-R2-064 Closed.
- **G5:**
  - CI xanh trên đúng commit chấm, E2E 0 lần chạy lại;
  - `--strict` exit 0;
  - lượt hằng đêm T9 gần nhất xanh.
- **G7:** 0 P0/P1 Open; P2 Open có kế hoạch.
- QA ghi trung thực những gì chưa kiểm được trong `qa/s4-test-report.md`.

## 10. Lịch QA và bước cắt

| Ngày | Việc QA |
|---|---|
| D1 | Test plan; ca tiền tự động (mục 4); sửa BUG-064; điều tra CI 39028814256; stack `ottimo-qa-s4` |
| D2–D3 | Kiểm PR S4-07, S4-05, S4-02, S4-18 (mốc D3); ca S4-06, S4-08 theo hợp đồng; ca PWA (T5) trên MSW nếu MOB có khung |
| D4–D5 | Kiểm M1 đủ (mốc D5); S4-13 (T2); bắt đầu S4-38; ca HK/MT (T5, T8) khi BE-C giao |
| D6–D7 | A1 bước 1–5; báo cáo S4-38 trước hết D7; ca EP01/EP14 (T6, T7) |
| D8 | A1 đủ + A4; kiểm G1; báo ORC/QC |
| D9–D10 | Kiểm lại sau sửa; hồi quy đủ (lượt đêm + mọi project); `s4-test-report.md` bản cuối |

**Bước cắt của QA (kế hoạch 12.3):**
- **QA-1** (đã áp từ D1): T9 thu hẹp (mục 3.2).
- **QA-2:** T11 dừng cùng FE-LP.
- **QA-3:** S4-33 sang Ổn định ở bước cắt 6.
- **Không bao giờ cắt:** T1, T2 (#6, S4-13), T3, T4.

## 11. Rủi ro kiểm thử

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| Q-1 | PR sửa lỗi gộp mà không xóa mã khỏi `OPEN` → CI đỏ "expected to fail but passed" | Mục 3.3; QA review mọi PR tiền; báo BE-B ngay (cây làm việc đã bỏ `pendingFix`) |
| Q-2 | Ca song song chiếm căn đích của B7 → 409 trong ca lỗi đã biết (bị che) | Cửa sổ 200–360 ngày, mọi căn đích kiểm trống trước; khi lỗi đã sửa, ca chuyển "phải đạt" nên chập chờn lộ ra |
| Q-3 | Kỳ vọng TC-L3-032 cũ hơn hợp đồng 0.3.7 nhóm D mục A (P05, `possibleReturningGuest`) | QA viết lại kỳ vọng cùng PR S4-11 của BE-C |
| Q-4 | Ca UI chậm khi đổi token DS v0.4 | T9 hằng đêm; bước ghi + A1/A4 mỗi bản build |
| Q-5 | QA thiếu ≈ 2,5 ngày (12.1) | QA-1…QA-3; ưu tiên T1, T4 |

## 12. LP-v1 (T11) – trạng thái ca 17/10
- Ca E2E của FE-LP (`e2e/landing/`) đã có mã **TC-LP-001…009**. QA rà và thêm cỡ 768 px (US-153 AC6). QA viết thêm **TC-LP-010** (US-151 AC7 – mock v1.2, lỗi đã biết `US-151/AC7`).
- axe đo ở **đầu trang** sau khi cuộn hết. Lý do: `target-size` báo vùng bị đầu trang hoặc thanh cố định che nếu đo ở vị trí cuộn bất kỳ (1/10 lượt).
- Chạy trên bản dựng hiện có: **27/27 đúng dự kiến, 2 lượt** (26 xanh + 1 ca lỗi đã biết hỏng đúng chỗ). Lặp 6 lần TC-LP-001 không chập chờn.
- **Truy vết luồng LP-v1:** 17/53 AC Must có TC. Cổng LP-v1 (`--strict --strict-track LP-v1`) còn đỏ cho tới khi QA viết TC nội dung: US-146 AC1, AC3–AC7, US-147, US-149, US-150, US-154, US-155. Việc này làm ở tuần 2 khi FE-LP dựng mock v1.2. **Không** ảnh hưởng `--strict` của R2.
