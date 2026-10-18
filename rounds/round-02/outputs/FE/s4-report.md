# Báo cáo FE – Round 2, Sprint 4 (bước Sản xuất)

Tệp chung của hai luồng FE Desk. Mỗi luồng ghi phần của mình. FE-B thêm phần "FE-B" ở cuối tệp.

---

## Phần FE-A (Desk – tiền, lưu trú) – đợt 1: mục 1–4 (17/10/2026)

- Người làm: FE-A | Đầu vào: `sprint-4-plan.md` (ĐÓNG BĂNG D1) mục 4, 8.3, 11; OpenAPI 0.3.7 (`openapi-0.3.7.md` mục 2, 6, 10); DS v0.4.1, content-guide; backlog US-084 AC4, US-024 AC5–AC7, US-025 AC3, US-021/US-136 (S4-08).
- Trạng thái: **mục 1–4 xong mã + unit test trên MSW theo 0.3.7.** Chưa chạy với API thật: BE-A/BE-B đang làm `previewMoveReservation`, `checkIn.payment`, `retainLines`. Riêng S4-28 dùng API đã có (`createVietQr`, `confirmPaymentReceived`, `confirmDeposit.existingPaymentId`) nên chạy được với API thật ngay. Ca E2E-UI đã viết, **chưa chạy trên stack** (không đụng stack demo; QA chạy trên stack QA).
- Không commit (ORC ghép). Mục 5–7 (#6 `expectedVersion`, S4-39 FE, BUG-076/080, S4-27) làm ở đợt sau. **S4-25 không gộp.**

### 1. Đã làm

#### 1.1 S4-28 – VietQR cọc ở H12 và H11 (US-084 AC4, US-120; BUG-R2-062)
- **H12, sau khi giữ chỗ:** màn tự gọi `createVietQr` `purpose=deposit` một lần.
  - Số tiền = cọc còn thiếu (`depositRequiredVnd − depositPaidVnd`), tức cọc BR-305 server đã tính. Client không gõ số (SEC F1).
  - Mã QR vẽ trong bundle từ `qrPayload` (SEC F2). Kèm số tiền, nội dung chuyển khoản dạng mono = mã đơn bỏ gạch, nút sao chép nội dung và sao chép số tiền.
  - Hiện tài khoản nhận dạng che. Tài khoản đổi trong 24 giờ thì có cảnh báo (SEC F3).
  - Chưa cài tài khoản nhận (`PAYMENT_NOT_CONFIGURED`): báo bằng câu có sẵn, không vẽ QR giả. Lỗi khác: câu `dep.qr_failed` + nút Thử lại.
  - Gửi lại dùng cùng Idempotency-Key. Có ref chặn gọi hai lần khi StrictMode chạy effect đôi.
- **CTV:** `createVietQr` không có vai `collaborator` nên CTV không gọi. Thay chữ:
  - trước khi giữ chỗ: `sale.qr_after_ctv` thay `sale.qr_after`;
  - sau khi giữ chỗ: `sale.hold_next_ctv` thay `sale.hold_next`.
- **BUG-R2-062:** với sale và lễ tân, câu `sale.qr_after` ("tạo ngay sau khi giữ chỗ") nay đúng vì QR có thật. Với CTV, câu không hứa QR nữa. Không sửa chữ của `sale.qr_after` vì hi-fi H12 và `check_hifi.py` đang so khớp chuỗi này.
- **H11 "Xác nhận cọc":**
  - Mở hộp không tự tạo QR. Lý do: QR mới làm hết hạn QR khách đang chuyển theo.
  - Hộp đọc `getFolio`. Nếu có giao dịch VietQR cọc `pending` còn hạn (tạo ở H12): báo `dep.qr_pending` (số tiền, hạn hiệu lực) kèm nút "Tạo mã mới" và câu cảnh báo mã cũ hết hiệu lực. Nếu chưa có: nút "Tạo VietQR · {số}".
  - Bấm "Xác nhận đã nhận cọc" với cách VietQR và **đúng số trên mã**:
    1. gọi `confirmPaymentReceived` (pending → succeeded, chờ đối soát);
    2. tải lại đơn lấy If-Match mới;
    3. gọi `confirmDeposit {existingPaymentId}`.
    Kết quả: folio chỉ có một khoản cọc, không còn QR treo chờ hết hạn.
  - Số khác số trên mã: ghi chuyển khoản tay như cũ, có câu `dep.qr_amount_differs`.
  - QR đã hết hạn (409 `currentState=expired`): báo `dep.qr_expired`; lần bấm sau ghi tay.
  - Bấm lại sau khi bước 1 đã xong thì chỉ chạy bước 3.
- Thành phần mới: `components/VietQrCard.tsx` (thẻ QR dùng chung) và `pages/reservations/DepositQr.tsx`.

#### 1.2 S4-21 – Hộp đổi căn có tính thử (ESC-019 A, US-024 AC5–AC7, BR-429 v0.3.5)
- **Tính thử:** mỗi lần đổi căn, ngày hoặc lý do, hộp gọi `previewMoveReservation` (debounce 300 ms, chỉ khi có thay đổi). Nút Lưu khóa cho tới khi bản tính thử khớp **đúng** đầu vào đang chọn. Lý do khóa hiện cạnh nút: `move.save_needs_preview` hoặc `move.save_needs_told`.
- **Hộp tính thử (`MovePreviewBox`), mọi số lấy từ server:**
  - câu cơ sở giá theo `pricingBasis`; đơn OTA + khách xin thì dùng câu BR-424;
  - bảng từng đêm: giá cũ → giá mới, chênh lệch OTA, giá gợi ý `suggestedRateVnd`; đêm thêm ghi "đêm thêm";
  - đêm bị bỏ;
  - tiền phòng cũ → mới; dòng giảm theo số đêm (BR-107) hoặc mã khách quay lại (BR-111);
  - phụ thu người cũ → mới; chênh lệch đổi căn OTA; FOC đi theo;
  - "Khách trả thêm / Khách được giảm / Không đổi tiền";
  - cọc đã thu (giữ nguyên); còn phải thu khi nhận phòng;
  - FOC chờ duyệt "khi duyệt sẽ áp X" (không cộng vào chênh lệch); cảnh báo `MANUAL_RATE_REPRICED`.
- **Phân biệt ai xin đổi:** lý do chia ba nhóm (optgroup): "Khách xin đổi – tính giá căn mới", "OTTIMO đổi – giữ giá đã đặt", "Khác – giữ giá đã đặt".
- **Ô "Đã báo khách số tiền mới"** bắt buộc khi lý do `guest_request` và có đổi căn. Bắt buộc cả khi chênh lệch = 0, đúng hợp đồng. Lưu gửi `applyDifference=true` và `expectedDeltaVnd` = `folioDeltaVnd` đang hiển thị.
- **409 `SURCHARGE_CHANGED`:** hiện `move.delta_changed` kèm số mới, tính thử lại, bỏ tick để lễ tân báo lại khách.
- **Ràng buộc lý do:** ẩn `inventory_optimize` khi `roomDisclosedToGuest = true` (BR-012 (4)). Giữ các ràng buộc cũ: `upgrade` chỉ FDL+, `overbooking` chỉ đơn xung đột, `force_majeure` chỉ khi dời ngày.
- **Lỗi kiểm của server:** 409/422 khi tính thử hiện ngay trên hộp. Nút "Dùng căn X" nay chỉ chọn căn để tính thử lại, không lưu thẳng.

#### 1.3 S4-10 – H13 thu theo số cần thu khi nhận phòng (BUG-R2-038, US-025 AC3, BR-402 v0.3.6)
- **Mục "Thu tiền" (`CheckInPayment`)** hiện bảng:
  - còn phải thu hiện tại (`balanceDueVnd`);
  - phụ thu nhận sớm hoặc tiền đêm trước B9a sẽ ghi;
  - FOC đang xin trên phụ thu (trừ ra, không thu bây giờ);
  - **Cần thu để nhận phòng** = `amountDueAtCheckinVnd` − FOC xin.
- **Tiền mặt / chuyển khoản / thẻ POS:**
  - gửi **cùng lệnh nhận phòng** (`checkIn.payment`, `type=charge`, số = cần thu). Nhận phòng không thành thì không ghi tiền (câu `ci.pay_inline`);
  - tiền mặt tính tiền thối; chuyển khoản ghi mã giao dịch và mang chip "Chờ đối soát"; POS chỉ nhập mã chuẩn chi.
- **VietQR:** `createVietQr` `purpose=check_in` cho đúng số cần thu, kèm `checkinTime`/`addPriorNight`/`priorNightRateVnd` để server tính cùng trần. Xác nhận đã nhận trước B9. Số cần thu đổi thì bỏ QR cũ.
- **Điều kiện `balance_paid`** coi là đạt khi số cần thu = 0 hoặc đã chọn cách thu kèm B9. Nút Nhận phòng khóa kèm lý do `ci.submit_needs_pay`. Hộp xác nhận và mục "Kết quả" có dòng "Ghi khoản thu {số} – {cách}".
- **FD gửi yêu cầu phòng chưa sạch (202):** không kèm khoản thu.
- H16 (trả phòng) vẫn dùng `PaymentPanel`, không đổi.

#### 1.4 S4-08 – Hủy đơn / no-show: dòng dịch vụ giữ kèm lý do (BR-309; `serviceLines`/`retainLines`)
- **Hộp Hủy đơn:**
  - danh sách `CancellationQuote.serviceLines`: nhãn bill, số ròng, chip "Đã thực hiện" (`performed`);
  - tick "Giữ" thì phải nhập lý do (≥ 3 ký tự);
  - tóm tắt "Đảo {x} · giữ {y}" lấy từ `serviceReversedVnd`/`serviceRetainedVnd`;
  - `retainLines` gửi **giống hệt** ở tính thử và lần lưu. Nút Hủy đơn chờ tính thử khớp đầu vào (lý do, tiền phạt OTA, dòng giữ);
  - dòng giữ thiếu lý do thì không gửi, hiện `svc.reason_needed`;
  - hiện `refundRequestVnd` khi khác `refundableVnd` (S4-06).
- **Hộp No-show:** không có tính thử. Danh sách dòng lấy từ `getFolio`: dòng dịch vụ đã đăng, chưa đảo, cộng FOC đi kèm. `performed` gợi ý = ngày dịch vụ < hôm nay. Tải lỗi thì có nút Thử lại; nút No-show khóa tới khi tải xong.
- Thành phần mới: `pages/reservations/ServiceLines.tsx`.

#### 1.5 api-client, mock, chuỗi
- **api-client:**
  - thêm `previewMoveReservation` (GET, không Idempotency-Key, không If-Match);
  - `markNoShow` nhận thân `{contactAttemptNote, retainLines}`, vẫn nhận chuỗi như cũ;
  - kiểu mới: `MovePreview`, `MovePreviewQuery`, `MarkNoShowBody`, `RetainLine`.
- **MSW (theo 0.3.7, sửa nhỏ, chỉ thêm):**
  - một hàm tính `movePlan` dùng chung cho `move-preview` và `move`: giá theo `reasonCode`, chênh lệch OTA so với căn gốc, phụ thu người theo BR-429, `applyDifference`/`expectedDeltaVnd` → 422/409, `inventory_optimize` khi đã báo căn;
  - `confirm-deposit` nhận `existingPaymentId`;
  - VietQR của giữ chỗ (`purpose=deposit`), `check_in` có trần, một QR chờ trên mỗi folio, `expiresAt`, idempotency;
  - `confirm-received` cọc cộng vào cọc đã thu;
  - `check-in-preview` có `balanceDueVnd` và `amountDueAtCheckinVnd`;
  - `check-in` nhận `payment`, xét `balance_paid` sau phụ thu và khoản thu, trừ FOC xin;
  - cancel và no-show: `serviceLines`/`retainLines`, đảo dòng không giữ;
  - folio tạo khi dùng lần đầu cho đơn tạo sau seed;
  - cổng `setFolioPort` từ mock stay sang mock reservations (không import vòng).
- **Chuỗi:** 60 khóa mới, nhóm riêng ở cuối `gen_strings.py`: "R2 Sprint 4 – FE-A tiền… (chờ UXD duyệt)" (`dep.*`, `sale.*_ctv`, `move.*`, `ci.due_*`, `ci.pay_*`, `ci.submit_needs_pay`, `ci.effect_pay`, `svc.*`, `cancel.refund_request`). Đã chạy lại `gen_strings.py`. `check_hifi.py` vẫn đạt.

### 2. Kiểm thử
- **Unit/component (vitest, MSW 0.3.7):** `src/__tests__/s4-money.test.tsx` có 13 ca.
  - **S4-28 (5 ca):** sale giữ chỗ thì QR vẽ đúng cọc, nội dung = mã đơn, có đúng 1 giao dịch pending loại cọc; CTV không gọi QR và đọc câu mới; `PAYMENT_NOT_CONFIGURED`; H11 xác nhận đúng QR đã gửi ở H12, chỉ một khoản; H11 tạo QR khi bấm, số khác thì ghi tay.
  - **S4-21 (4 ca):** khách xin đổi (bảng từng đêm, ô bắt buộc, gửi đúng chênh lệch, đổi hai chiều, cọc giữ nguyên, `roomDisclosedToGuest`); OTTIMO đổi giữ giá, không có ô; 409 `SURCHARGE_CHANGED` báo lại; ẩn `inventory_optimize`.
  - **S4-10 (2 ca):** nhận sớm 11:00 – cần thu = số dư + 275.000, VietQR `check_in` đúng số, xác nhận, B9 ghi phụ thu, không có khoản thứ hai; FOC xin trên phụ thu được trừ, POS thu phần còn lại cùng B9, nút khóa có lý do.
  - **S4-08 (2 ca):** hủy – dòng từ tính thử, giữ cần lý do, `retainLines` đến lần lưu, chỉ dòng không giữ bị đảo; no-show – dòng từ folio, giữ + lý do gửi kèm `markNoShow`.
- **Sửa ca cũ theo hành vi mới:**
  - `quotes.test.tsx`: QR có thật sau giữ chỗ;
  - `reservation.test.tsx`: đổi căn chờ tính thử; 409 thì "Dùng căn" chọn căn rồi tick; hủy chờ tính thử khớp;
  - `checkin.test.tsx`: tiền mặt thu cùng B9, không ghi trước.
- **api-client:** thêm 3 ca trong `endpoints.test.ts`: `previewMoveReservation` là GET không khóa; `moveReservation` gửi `applyDifference`/`expectedDeltaVnd`; `markNoShow` có `retainLines`.
- **Kết quả (17/10 tối, cây làm việc chung):**

  | Kiểm | Kết quả |
  |---|---|
  | admin-web vitest | 30 tệp, 263/263 đạt (gồm ca của FE-B) |
  | api-client | 23/23 |
  | i18n | 19/19 |
  | `tsc` admin-web, api-client, tests | 0 lỗi |
  | `turbo typecheck --continue` | 12/13 gói xanh. Gói `@ottimo/mobile` đỏ: `src/main.tsx` thiếu `./mocks/browser` – việc MOB đang làm dở, không thuộc FE-A |
  | eslint (admin-web, api-client, spec mới) | 0 lỗi |
  | prettier | xanh trên mọi tệp FE-A. `apps/admin-web/src/mocks/dashboard.ts` (tệp mới của FE-B) chưa format |

- **E2E-UI bấm thật (bản nháp FE-A, QA rà và đưa vào bộ chạy):** `product/tests/e2e/ui/desk-writes.s4.spec.ts`, project `desk-chromium`, ca **S4-28 / TC-L5-025 (a)**:
  - báo giá 202, 7 đêm, bắt đầu thứ Hai (oracle BR-107-01/BR-305-01) → sale bấm "Tạo giữ chỗ" → request `createVietQr {purpose: deposit, amountVnd: 1.600.000}` trả 201, `transferContent` = mã đơn bỏ gạch, ảnh QR có nhãn đúng;
  - lễ tân mở "Xác nhận cọc", thấy QR đang chờ → bấm xác nhận → `confirmPaymentReceived` (đúng id giao dịch QR) trả 200 → `confirmDeposit {existingPaymentId}` trả 200;
  - đọc lại API: đơn `confirmed`, cọc 1.600.000, folio có đúng 1 khoản thu `vietqr` loại cọc.
  - Đã `tsc`, lint, `playwright --list` thấy ca. **Chưa chạy trên stack.**
- **Ca E2E-UI của S4-21 (TC-L2-097), S4-10 (phần UI của TC-L3-011) và S4-08:** viết khi BE-A/BE-B gộp phần 0.3.7 tương ứng. Đề xuất QA đặt mã TC cho phần UI của S4-08, hiện chưa có trong `r1-main-flows.md`.

### 3. File đã tạo / sửa
Tạo mới:
- `product/apps/admin-web/src/components/VietQrCard.tsx`
- `product/apps/admin-web/src/pages/reservations/DepositQr.tsx`
- `product/apps/admin-web/src/pages/reservations/MovePreviewBox.tsx`
- `product/apps/admin-web/src/pages/reservations/ServiceLines.tsx`
- `product/apps/admin-web/src/pages/stay/CheckInPayment.tsx`
- `product/apps/admin-web/src/__tests__/s4-money.test.tsx`
- `product/tests/e2e/ui/desk-writes.s4.spec.ts` (nháp cho QA)

Sửa:
- `product/apps/admin-web/src/pages/quotes/QuoteDialog.tsx` (H12 sau giữ chỗ)
- `product/apps/admin-web/src/pages/reservations/ReservationDialogs.tsx` (DepositDialog, MoveDialog, CancelDialog, NoShowDialog)
- `product/apps/admin-web/src/pages/stay/CheckInPage.tsx` (mục Thu tiền, điều kiện, thân B9)
- `product/apps/admin-web/src/mocks/reservations.ts`, `product/apps/admin-web/src/mocks/stay.ts` (tệp dùng chung – chỉ thêm, đọc lại trước khi sửa)
- `product/apps/admin-web/src/__tests__/quotes.test.tsx`, `reservation.test.tsx`, `checkin.test.tsx`
- `product/packages/api-client/src/endpoints.ts`, `types.ts`, `endpoints.test.ts`
- `product/design/tools/gen_strings.py` (nhóm FE-A ở cuối) → sinh lại `product/design/copy/strings-{vi,en}.json`, `strings-tables.md`, `wireframes/assets/strings.js`
- `01-decisions/decision-log.md` (1 dòng FE-A)

### 4. Giả định
- `[GIẢ ĐỊNH FE-A – ARC xác nhận]` FD gửi `roomNotReadyOverride` (sẽ thành 202) thì **không** kèm `checkIn.payment`. Lễ tân thu sau khi lễ tân trưởng duyệt, hoặc thu trước bằng VietQR. Hợp đồng chưa nói rõ khoản thu có được ghi khi B9 trả 202 hay không.
- `[GIẢ ĐỊNH FE-A]` H11 chỉ dùng giao dịch QR cọc đang chờ khi lễ tân chọn VietQR **và** số đã nhận bằng đúng số trên mã. Số khác thì ghi tay (chờ đối soát); QR cũ tự hết hạn ở mốc đổi ngày.
- `[GIẢ ĐỊNH FE-A – UXD duyệt]` Chữ của 60 khóa mới do FE viết theo content guide. Chưa có hi-fi cho hộp tính thử, mục thu khi nhận phòng, danh sách dòng dịch vụ: bố cục theo mẫu sẵn có (bảng `sum`, DS 6.3 "phụ thu chủ động", ô tick bắt buộc như `ci.told_guest`).
- `[GIẢ ĐỊNH FE-A]` Gợi ý "Đã thực hiện" ở hộp no-show = ngày dịch vụ < hôm nay theo đồng hồ máy quầy. Chỉ là gợi ý; server không dựa vào giá trị này.

### 5. Rủi ro / vướng mắc
- **Hành vi gây vỡ, cần BE cùng bản:**
  - Desk gửi `checkIn.payment`, `retainLines`, `applyDifference`/`expectedDeltaVnd` và gọi `move-preview`.
  - Server cũ (trước 0.3.7) thì:
    - tính thử đổi căn trả 404 → hộp báo "Chưa tính thử được", nút Lưu khóa;
    - B9 với `payment` → có thể 422 do trường lạ.
  - Cần gộp sau hoặc cùng BE-A (S4-21, M4) và BE-B (S4-08), không gộp trước.
- **Tệp dùng chung với FE-B** (`ReservationDialogs.tsx`, `CheckInPage.tsx`, `QuoteDialog.tsx`, mocks, `gen_strings.py`): đã đọc lại trước mỗi lần sửa. Chỉ thay khối của FE-A, giữ thay đổi B1 (`monoArgs`, `Code`) của FE-B. Khi ghép, ORC nên chạy lại toàn bộ vitest admin-web.
- `PaymentPanel` (H16) còn khối QR riêng, trùng với `VietQrCard`. Để sau khi FE-B xong B1, tránh sửa chồng.
- Mock không cập nhật dòng folio khi đổi căn, chỉ cập nhật tiền trên đơn. Số folio sau đổi căn chỉ kiểm được trên API thật (TC-L2-087, 097).

### 6. Việc chưa xong (đợt sau, theo thứ tự giao)
1. Nhóm D #6 `expectedVersion` khi duyệt/từ chối hoàn tiền: làm trên nhánh, **bàn giao cùng BE-B**.
2. S4-39 FE: hộp chọn ô khi bỏ người, PATCH `GuestDocumentLink`, 409 `DOCUMENT_UNCLAIMED_EXISTS` mở đúng giấy tờ.
3. BUG-076, BUG-080; S4-27.
4. Chạy lại mục 1–4 với API thật khi BE-A/BE-B gộp. Viết ca E2E-UI S4-21/S4-10/S4-08 cùng QA.
5. S4-25: chỉ sau khi QA đóng 056/059/061.

---

## Phần FE-A – đợt 2: #6, S4-39, BUG-076, BUG-080, S4-27 (17/10/2026)

- Trạng thái: **xong mã + unit test trên MSW theo 0.3.7.** Chưa chạy với API thật (BE-B #6, BE-C S4-39, BE-A/BE-B S4-35 chưa gộp). Không commit.
- **#6 phải ghép một PR với BE-B.** Phần FE của #6:
  - `apps/admin-web/src/pages/approvals/ApprovalsPage.tsx`;
  - khối `versionCheck` + `version` trong `apps/admin-web/src/mocks/stay.ts`;
  - khóa `approval.changed_since_open`;
  - describe "#6 expectedVersion" trong `s4-money.test.tsx`.
  Server cũ có thể từ chối trường lạ `expectedVersion` → duyệt hoàn hỏng. Vì vậy không gộp phần này trước BE-B.
- Đã xử lý ghi chú ORC: `PaymentPanel` (H16) nay dùng chung `VietQrCard`. Nội dung chuyển khoản và tài khoản nhận dùng `monoArgs`: chỉ giá trị ở `.mono`, câu quanh giữ font UI.

### 1. Đã làm

#### 1.1 #6 – `expectedVersion` khi duyệt / từ chối hoàn tiền (0.3.7 B-6)
- Desk gửi `expectedVersion` = `ApprovalRequest.version` đang hiển thị. **Chỉ gửi với `type = refund`** (đúng phạm vi bắt buộc). FOC và loại khác giữ luồng cũ; ca QA "FOC không cần trường" đạt.
- **412 `VERSION_CONFLICT`:** hộp báo `approval.changed_since_open` ("Yêu cầu này vừa được sửa sau khi bạn mở…") kèm nút "Tải lại". Bấm thì đóng hộp và đọc lại hàng chờ; người duyệt mở lại và quyết trên bản mới.
- **Mock:** thiếu `expectedVersion` với `refund` → 422 `REQUIRED`; lệch → 412 kèm `currentVersion`. Sửa nơi nhận làm tăng `version`.

#### 1.2 S4-39 – bỏ người khỏi đoàn, gắn người, giấy tờ trùng (BUG-R2-085, 090, 091)
- **Hộp "Bỏ khỏi đơn"** (H15 – Người ở):
  - **Khi hỏi:** người bị bỏ chưa có giấy tờ gắn **và** còn giấy tờ khách gửi qua link chưa gắn. Hộp hỏi "Ảnh giấy tờ khách gửi qua link nào là của {tên}?", lựa chọn Khách 2…n hoặc "Không có", **không chọn sẵn**. Nút "Bỏ khỏi đơn" khóa tới khi chọn, kèm lý do.
  - **Gửi đi:** `guestUploadPersonIndex` = số ô hoặc `none`.
  - **Biết trước bằng cách nào:** hộp đọc khai báo dạng che (`getRegistration`, không có dữ liệu C3). Đọc không được thì server hỏi (422 `REQUIRED` + `personIndexes[]`): hộp giữ mở, hiện lựa chọn, chưa xóa gì.
  - Có link "Mở giấy tờ để đối chiếu ảnh (tab mới)" sang H14. Xem ảnh đi qua đường C3 có sẵn (step-up, tự ẩn).
  - Thay hộp cũ thiếu thông tin (BUG-090).
- **"Gắn người"** (H13/H14):
  - mở hộp riêng `LinkDocDialog`, gửi `PATCH` thân `GuestDocumentLink {partyMemberId}` – **không step-up, không đọc C3, không nhập lại** (BUG-085 phần "phải nhập lại", BUG-091);
  - chọn người còn trong đoàn, không chọn sẵn; người đã có giấy tờ bị khóa; không còn ai thì nói lý do;
  - 409 `PARTY_DUPLICATE` hoặc 422 `NOT_IN_LIST` → đọc lại đoàn;
  - nút "Sửa" vẫn là hộp nhập đủ trường. Đầu hộp nay báo "Còn {n} ô cần sửa" thay vì chỉ "Bắt buộc" (BUG-091).
- **"Nhập tay" trùng số giấy tờ đang chờ gắn:** 409 `DOCUMENT_UNCLAIMED_EXISTS` → câu `reg.link.dup_unclaimed` (ô Khách n) + nút mở **đúng** giấy tờ theo `documentId`: tới dòng đó và mở hộp Gắn người của nó. Hết lỗi "mở nhầm khi ≥ 2 giấy tờ chờ". Server cũ trả `PARTY_DUPLICATE` không có id thì giữ đường cũ.
- **Danh sách chờ gắn** lấy theo `unclaimedUntil` (0.3.7, S4-48) – hết đoán từ `imagePurgeAt`/"Cần chú ý". Nhãn hạn dùng `unclaimedUntil`. Dòng giấy tờ khách gửi hiện "Khách n" (`personIndex`), trùng số với hộp bỏ người.
- **Mock 0.3.7:**
  - `regView` có `personIndex`, `unclaimedUntil`;
  - `addGuestDocument` trả `DOCUMENT_UNCLAIMED_EXISTS`;
  - PATCH thân chỉ có `partyMemberId`;
  - `removePartyMember` có `guestUploadPersonIndex`: 422 `REQUIRED`/`NOT_ALLOWED`/`NOT_IN_LIST`; hủy ô đã chọn, dồn số ô sau, không hẹn xóa 24 giờ;
  - bỏ hàm dự phòng 0.3.6 không còn dùng.

#### 1.3 BUG-076 – "Dùng căn …" xem giá trước khi tạo (P-S4-2)
- H09 Đặt phòng mới: nút "Dùng căn X" (409 đặt trùng) và "Dùng căn … (đêm lẻ)" (ở tối thiểu) **chỉ chọn căn, không tạo đơn**.
- Sau khi chọn, hộp "Đổi sang căn X – xem giá trước khi tạo đơn" hiện giá từng đêm, phụ thu người, tổng. Nguồn số:
  - đơn Trực tiếp/CTV: server `calculateQuote` của đúng căn đó (đợi `calc.roomId` = căn);
  - đơn OTA: số lễ tân đã nhập.
- Một bấm "Tạo đơn ở căn X". Nút khóa khi giá chưa tính xong.

#### 1.4 BUG-080 – báo giá tiếng Nga (US-083 AC2, P-S4-3)
- H12 bước gửi: thêm "Русский" bên cạnh Tiếng Việt / English, gọi `getQuoteText locale=ru` (API đã có). Mock thêm bản RU nháp.

#### 1.5 S4-27 – điều chỉnh dòng folio, đảo giao dịch thu (US-006 AC1, US-032 AC1, US-038 AC2, US-119 AC3)
- **Cửa vào:** drawer có nút "Folio & điều chỉnh" (FD+, đơn khác `hold`) mở `FolioDialog`. Hộp liệt kê mọi dòng (chip "Bút toán đảo" / "Đã điều chỉnh" / "Chờ duyệt"), còn phải thu và các giao dịch thu.
- **"Điều chỉnh" dòng** (`adjustFolioLine`, đường `…/lines/{lineId}/adjustments`):
  - Quyền: folio `open` → FD+ (A31); đã chốt → chỉ MGR/OWN (A32), FD chỉ xem kèm câu giải thích.
  - Dòng thường: số lượng mới, đơn giá mới hoặc "Bỏ cả dòng" (`voidLine`). Dòng đêm (`room`, `extra_person`): chỉ "Giá đêm mới (trước giảm theo số đêm)" (S4-35). Không sửa dòng FOC, giảm giá, giữ cọc.
  - Lý do bắt buộc. Hộp xem trước "Ghi bút toán đảo {cũ} và dòng mới {mới}". If-Match = `Folio.version`; 412 → "Tải lại".
  - Lỗi trường (ví dụ `RATE_OUT_OF_RANGE`) hiện tại ô.
- **"Đảo giao dịch"** (`reversePayment`): chỉ MGR/OWN (A34), chỉ giao dịch `succeeded` chưa đảo. Hộp xác nhận nêu số tiền, cách thu và hệ quả; lý do bắt buộc. 409 `INVALID_TRANSITION` → câu riêng (B-10). Giao dịch gốc giữ lại, chip "Đã đảo".
- **Phụ thuộc S4-35:** dòng đêm đang 422 `NOT_ALLOWED` trên server tới khi BE-A/BE-B gộp S4-35. Desk hiện câu lỗi của server.
- **Mock:** handler `adjustments` (đảo + dòng mới, quyền theo trạng thái folio, dòng đêm chỉ giá, sàn–trần đơn giản); `reverse` đòi lý do và chỉ đảo giao dịch `succeeded`.

### 2. Kiểm thử (đợt 2)
- **`s4-money.test.tsx`** – thêm 9 ca, tổng 22:
  - **#6 (2):** duyệt gửi đúng phiên bản; đổi giữa chừng → 412 → tải lại → duyệt lại với phiên bản mới; từ chối hoàn có trường, duyệt FOC không có.
  - **S4-39 (2):** chọn ô (không chọn sẵn, nút khóa) → ô đó bị hủy, ô sau dồn số, không hẹn xóa; server hỏi (422) → lựa chọn hiện trong hộp → "Không có" không xóa gì.
  - **BUG-080 (1):** chọn Русский → `getQuoteText locale=ru`, hiện bản RU.
  - **S4-27 (4):** FD sửa số lượng 3 → 2 (gửi đúng thân và If-Match, dòng gốc còn, có bút toán đảo + dòng mới); dòng đêm chỉ có ô giá, ngoài sàn–trần báo tại ô; đảo giao dịch – FD không có nút, MGR có, lý do bắt buộc; folio đã chốt – FD chỉ xem, MGR điều chỉnh được.
- **`s3-fe07.test.tsx`** viết lại 3 ca theo 0.3.7: Gắn người chỉ gửi `{partyMemberId}`, không đọc C3; không còn ai để gắn; trùng số → mở đúng "Khách 3". Thêm 1 ca đường cũ `PARTY_DUPLICATE`.
- **`booking.test.tsx`:** "Dùng căn 201" không tạo đơn ngay – hiện giá căn 201, xác nhận mới tạo.
- **`checkout.test.tsx`:** sửa 1 dòng kiểm cho nội dung chuyển khoản dạng mono (`VietQrCard` dùng chung).
- **api-client:** thêm 2 ca – `removePartyMember` query `guestUploadPersonIndex`; `updateGuestDocument` thân `GuestDocumentLink`. Tổng 25/25.
- **Kết quả (17/10 tối, cây làm việc chung):**

  | Kiểm | Kết quả |
  |---|---|
  | admin-web vitest | 30 tệp, 273/273 đạt |
  | api-client | 25/25 |
  | eslint, prettier (tệp FE-A) | sạch |
  | `check_hifi.py` | đạt |
  | `tsc` admin-web | còn 1 lỗi ở `src/pages/ops/WorkOrderForms.tsx` – tệp FE-B đang làm, không thuộc FE-A |

### 3. File đã tạo / sửa (đợt 2)
Tạo mới:
- `product/apps/admin-web/src/pages/stay/FolioDialog.tsx`

Sửa:
- `product/apps/admin-web/src/pages/approvals/ApprovalsPage.tsx` (#6)
- `product/apps/admin-web/src/pages/registration/DocsPanel.tsx` (`LinkDocDialog`, `DOCUMENT_UNCLAIMED_EXISTS`, BUG-091)
- `product/apps/admin-web/src/pages/registration/partyDocs.ts` (`unclaimedUntil`, `deadlineOf`, `unclaimedSlots`)
- `product/apps/admin-web/src/pages/stay/StayDialogs.tsx` (hộp chọn ô khi bỏ người)
- `product/apps/admin-web/src/pages/stay/PaymentPanel.tsx` (dùng `VietQrCard`)
- `product/apps/admin-web/src/pages/booking/BookingDialog.tsx` (BUG-076)
- `product/apps/admin-web/src/pages/quotes/QuoteDialog.tsx` (BUG-080)
- `product/apps/admin-web/src/pages/reservations/ReservationDrawer.tsx` (nút + hộp Folio – 3 chỗ nhỏ, giữ phần S4-29 của FE-B)
- `product/apps/admin-web/src/mocks/stay.ts`, `product/apps/admin-web/src/mocks/reservations.ts`
- `product/apps/admin-web/src/__tests__/s4-money.test.tsx`, `s3-fe07.test.tsx`, `booking.test.tsx`, `checkout.test.tsx`
- `product/packages/api-client/src/endpoints.ts` (`adjustFolioLine`, `removePartyMember` + slot, `updateGuestDocument` + `GuestDocumentLink`), `types.ts`, `endpoints.test.ts`
- `product/design/tools/gen_strings.py`: nhóm "R2 Sprint 4 – FE-A đợt 2 …", 39 khóa mới, chờ UXD duyệt. Đã sinh lại `copy/strings-{vi,en}.json`, `tools/strings-tables.md`, `wireframes/assets/strings.js`.
- `01-decisions/decision-log.md` (1 dòng FE-A đợt 2)

### 4. Giả định (đợt 2)
- `[GIẢ ĐỊNH FE-A]` #6 chỉ gửi `expectedVersion` với `refund`. Muốn mở rộng cho FOC (chống duyệt số đã đổi) thì chỉ sửa một điều kiện, nhưng cần BE-B/QA đồng ý vì ảnh hưởng ca S4-13.
- `[GIẢ ĐỊNH FE-A – SEC xác nhận]` Hộp bỏ người đọc `getRegistration` (dạng che, không C3) để biết trước các ô chưa gắn. Link đối chiếu ảnh mở H14 ở tab mới. Ảnh vẫn chỉ xem qua đường C3 có sẵn (step-up, tự ẩn 60 giây).
- `[GIẢ ĐỊNH FE-A]` Không cho điều chỉnh dòng `foc`, `discount`, `deposit_forfeit` trong hộp Folio: các dòng này sửa bằng luồng duyệt FOC hoặc hủy đơn.
- `[GIẢ ĐỊNH FE-A – UXD duyệt]` Hộp Folio, hộp Gắn người, hộp chọn ô và hộp xem giá "Dùng căn" chưa có hi-fi. Bố cục theo mẫu sẵn có (bảng `table`/`sum`, `ConfirmDialog`, radio không chọn sẵn như DS 6.1).

### 5. Rủi ro / vướng mắc (đợt 2)
- **Phải gộp cùng hoặc sau BE**, không gộp trước:
  - #6 cùng BE-B;
  - S4-39 cùng BE-C: server cũ không nhận `guestUploadPersonIndex`, thân `GuestDocumentLink` có thể 422;
  - phần dòng đêm của S4-27 cùng S4-35.
- `ReservationDrawer.tsx`, `StayDialogs.tsx`, `DocsPanel.tsx`, mocks là tệp dùng chung. Đã đọc lại trước khi sửa, chỉ thêm khối của FE-A.

### 6. Việc chưa xong
1. Chạy lại đợt 1 + đợt 2 với API thật khi BE gộp. Viết ca E2E-UI cùng QA: S4-21 (TC-L2-097), S4-10, S4-08, #6 (ca có/thiếu/lệch phiên bản), S4-39, S4-27.
2. Ngoài danh sách ORC giao (theo bảng 8.3, chưa làm): nhãn "có thể là khách quen" (nhóm D mục A, chờ BE-C S4-11); hàng chờ FOC hiện `lineChangedNote`/`effectiveAmountVnd`/`focState` (chờ BE-B S4-02/18); bản in bill dùng `Bill.roomName` (BR-012).
3. S4-25: chỉ sau khi QA đóng 056/059/061.

---

## Phần FE-A – đợt 3: ca E2E-UI bấm thật cho S4-21, S4-10, S4-08, #6, S4-39 (17/10/2026)

Viết theo quy ước QA Sprint 4: `knownBug(...)` là dòng **đầu** ca, dựng dữ liệu trong `precondition()`, số tiền đọc oracle. **Chưa chạy trên stack**: không đụng demo; các phần BE chưa gộp nên mọi ca đều đang mang `test.fail` qua `OPEN`. Đã kiểm `tsc`, eslint, `playwright --list`.

### 1. Ca và mã TC (r1-main-flows.md v0.3.16 – QA rà)

| Tệp (project) | Ca | TC | Lỗi đã biết (`OPEN`) |
|---|---|---|---|
| `e2e/ui/desk-writes.s4.spec.ts` (desk-chromium) | Xem trước khi đổi căn BR-429-03; Lưu khóa khi chưa tick; khách không đồng ý → không ghi; tick → lưu đúng `expectedDeltaVnd` | TC-L2-097 (a)(b)(c) – đã có | S4-21 |
| nt | Số tiền đổi trước lúc lưu → 409 → báo số mới, tính thử lại, bỏ tick → tick lại → lưu | TC-L2-097 (d) | S4-21 |
| nt | Hủy đơn giữ dòng dịch vụ kèm lý do, `retainLines` giống hệt ở tính thử và lần lưu, dòng kia bị đảo | **TC-L2-102 (a)** – mới | S4-08 |
| nt | Duyệt hoàn: nơi nhận đổi sau khi mở → 412 → "Tải lại" → duyệt với phiên bản mới | **TC-NT-052** – mới | B-6 |
| `e2e/ui-clock/stay-money.s4.spec.ts` (desk-clock) | H13 11:00: cần thu 1.710.000 → xin FOC phụ thu còn 1.500.000; tiền mặt gửi cùng `checkIn.payment` | **TC-L3-079 (a)** – mới | BUG-R2-038 |
| nt | H13 VietQR `purpose=check_in` 1.710.000 → xác nhận → cần thu 0 → B9 không kèm `payment` | **TC-L3-079 (b)** | BUG-R2-038 |
| nt | No-show 23:30 giữ dòng dịch vụ → `markNoShow.retainLines` | **TC-L2-102 (b)** | S4-08 |
| nt | Bỏ người chọn "Khách 2" (`?guestUploadPersonIndex=2`), ô sau dồn số, không hẹn xóa; Gắn người chỉ gửi `{partyMemberId}`, không đọc C3 | **TC-L3-080 (a)** – mới | BUG-R2-085 |
| nt | Nhập tay trùng giấy tờ chờ → 409 `DOCUMENT_UNCLAIMED_EXISTS` → mở đúng giấy tờ, gắn người, không tạo giấy tờ mới | **TC-L3-080 (b)** | BUG-R2-085 |

- Ca có màn mới đều quét axe (`scan`).
- Ca S4-21 (d) giả bản tính thử lệch 125.000 bằng `page.route` (chỉ lần đầu). Nhờ vậy lệnh ghi thật của server trả 409 mà không cần đổi giá trên stack.

### 2. Tệp đã tạo / sửa (đợt 3)
- Tạo:
  - `product/tests/e2e/ui-clock/stay-money.s4.spec.ts`
- Sửa:
  - `product/tests/e2e/ui/desk-writes.s4.spec.ts`: thêm 4 ca, viết lại phần đầu tệp.
  - `product/tests/e2e/support/known-bugs.ts`: `OPEN` thêm `S4-08`, `BUG-R2-085`. PR sửa của BE xóa dòng tương ứng.
  - `product/tests/test-cases/r1-main-flows.md`: v0.3.16, thêm TC-L2-102, TC-L3-079, TC-L3-080, TC-NT-052. Mã lấy tiếp theo số lớn nhất lúc viết (L2 101, L3 078, NT 051), không trùng.
  - `product/docs/qa/traceability.md`: sinh lại khi chạy `gen_traceability.py`; `--strict` exit 0.
  - `product/apps/admin-web/src/pages/registration/DocsPanel.tsx`: nút "Gắn người" hiện cho **mọi** giấy tờ khách gửi chưa gắn người, không chỉ giấy tờ đang chờ. Lý do: 0.3.7 không hẹn xóa các ô còn lại sau khi bỏ người, lễ tân vẫn cần gắn. Nút chính khi đang chờ, nút phụ khi không chờ.
  - `product/apps/admin-web/src/__tests__/s4-money.test.tsx`: thêm 1 ca theo xác nhận của ARC – FD gửi yêu cầu phòng chưa sạch (202) khi còn tiền phải thu thì nút khóa kèm lý do, không gửi lệnh nào kèm `payment`.
- Kết quả: admin-web 31 tệp, 290/290; eslint sạch.

### 3. Việc cho QA khi gộp
- **TC-L3-077** (`ui-clock/party-docs.h14.spec.ts`) đang kiểm "Gắn người" kiểu 0.3.6: hộp nhập đủ trường, nút "Lưu giấy tờ", thân có đủ trường. Bỏ người bằng API cũng không kèm `guestUploadPersonIndex`. Khi BE-C gộp S4-39, ca này phải sửa theo hộp Gắn người 0.3.7 và lựa chọn ô.
- **TC-L3-080 (b)** dựng giấy tờ "chờ gắn" bằng `updateReservation adults 3 → 2` – đường giảm người không có lựa chọn, theo [GIẢ ĐỊNH ARC – SEC xác nhận]. Nếu BE-C cài khác, bước này đỏ ở `precondition` (không bị `test.fail` che).
- **Cần stack có tài khoản nhận VietQR:** TC-L3-079 (b) và TC-L5-025 (a).

### 4. Vùng đang sửa – tránh đè với FE-B
- `DepositDialog` (`ReservationDialogs.tsx`): phần của FE-A **đã xong**, không còn thay đổi dở.
- Vùng FE-A đã sửa:
  - state `pending`/`qr`/`qrReceived`/`qrExpired`/`qrAct`;
  - `useEffect` đọc folio;
  - `submitViaQr` và nhánh `viaQr` trong `submit`;
  - khối `<DepositQr>` dưới số cọc;
  - các dòng `dep.qr_amount_differs`, `dep.qr_expired`, `qrAct.view()`.
- FE-B thêm `depositNotices[]` ngoài các vùng này thì không đụng nhau.

### 5. Việc (2) – review UXD
`rounds/round-02/reviews/s4-UXD.md` **chưa có** lúc viết báo cáo. Khi UXD gửi, FE-A sửa theo các thẻ dành cho FE-A.

---

## Phần FE-A – đợt 4: `acceptLanguage` trong api-client, sửa tsc (17/10/2026)

- `product/packages/api-client/src/client.ts`:
  - `RequestOptions.acceptLanguage?: 'vi' | 'en' | 'ru'`; có thì gửi header `Accept-Language` (ARC 0.3.7 11.3 (9), 11.5 #13). MOB truyền theo nút ngôn ngữ của PWA khi gọi 3 operation kiểm phòng.
  - Không truyền thì không gửi header.
  - Không sửa `endpoints.ts`: PWA gọi `client.request` trực tiếp.
- `product/packages/api-client/src/client.test.ts`: thêm 2 ca – gửi đúng giá trị cho GET và lệnh ghi (vi/en/ru); không truyền → không có header. api-client 30/30, `tsc` sạch.
- `product/apps/admin-web/src/__tests__/s4-money.test.tsx:392`: bỏ tùy chọn `exact` không hợp lệ của `getByRole` (Testing Library mặc định so khớp cả chuỗi). `tsc` admin-web 0 lỗi; `s4-money` 23/23.
- `turbo typecheck`: 12/13 gói xanh. `@ottimo/mobile` đỏ ở `src/pages/InspectionPage.tsx:66` (TS2554 "Expected 3 arguments, but got 2"). Tệp này MOB đang sửa đồng thời với `src/app/api.ts`; lỗi không do thay đổi của api-client, vì `acceptLanguage` là tùy chọn và không đổi chữ ký hàm nào.

---

## Phần FE-A – đợt 5: sửa theo review UXD giữa sprint (`reviews/s4-UXD.md`, thẻ FE-S4-01 … 16) (17/10/2026 tối)

Phản hồi từng thẻ: `rounds/round-02/responses/s4-FE.md` (mục FE-A). Tóm tắt:

### 1. Blocker FE-S4-01 – số ghi thu ở H13 là số lễ tân thật sự nhận
- `CheckInPayment.tsx` – hàm `inlinePayment(pay, due)` (thay `inlinePayReady`) quyết định khoản thu đi cùng B9:
  - **Tiền mặt**: ô "Tiền khách đưa" **bắt buộc**. Trống → khóa ("Nhập số tiền đã nhận để nhận phòng."). Ít hơn số cần thu → khóa, câu `ci.submit_cash_short` nói thiếu bao nhiêu, gắn vào nút (`aria-describedby`), **không gọi B9**. Đủ/dư → hiện "Thối lại …", ghi đúng **số cần thu**.
  - **Chuyển khoản / POS**: ô mới "Số tiền đã nhận" (`ci.pay_received`) bắt buộc, ghi **đúng số nhập**. Thiếu → khóa (`ci.submit_pay_short`). Dư → khóa (`ci.submit_pay_over`), vì BE trả 422 `AMOUNT_EXCEEDS_BALANCE`; phần dư ghi riêng ở folio. POS thiếu mã chuẩn chi → khóa (`ci.submit_pos_code`).
  - "Số cần thu" giữ nguyên công thức S4-10: `amountDueAtCheckinVnd` trừ phần FOC phụ thu đang xin (BR-402 v0.3.6).
- **Khác đề xuất UXD:** UXD đề xuất ô trống được coi là khách đưa đủ. FE-A không làm vậy, theo yêu cầu ORC "số ghi thu phải là số thật lễ tân nhập". Ô trống nghĩa là chưa nhập số, nên nút khóa. UXD duyệt lại câu `ci.submit_pay_amount_needed`.

### 2. Major FE-S4-02 – nhánh 202 (lễ tân, buồng chưa sẵn sàng)
- Khi nút là "Gửi lễ tân trưởng xác nhận": `balance_paid` **không chặn**. Mục Thu tiền chỉ còn VietQR (thu trước) và câu `ci.pay_after_lead`. Không còn `ci.pay_inline`. Hộp xác nhận không có dòng "Ghi khoản thu". Thân B9 **không có `payment`**.
- **Làm thêm để luồng không kẹt** (0.3.7 `checkIn` bổ sung 1 (a)). Trước đây, sau khi lễ tân trưởng duyệt, Desk không có cách nhận phòng: mở lại H13 sẽ gửi thêm một yêu cầu nữa. Nay:
  - H13 đọc `listApprovalRequests(status=approved)` (lễ tân chỉ thấy yêu cầu của mình). Nếu có yêu cầu `checkin_room_not_ready` của đơn này, duyệt trong ngày, thì điều kiện buồng hiện chip "{tên} đã duyệt nhận phòng khi buồng chưa sẵn sàng…" (`ci.room_approved` – chuỗi mới, chờ UXD duyệt).
  - Bốn cách thu hiện lại. B9 gửi `roomNotReadyOverride.approvalRequestId` **cùng** `payment`.
  - Thông báo "Đang chờ lễ tân trưởng xác nhận" có nút "Tải lại" để đọc lại.
- Mock `stay.ts`: nhánh 202 gửi kèm `payment` → 422 `NOT_ALLOWED`. B9 kèm `approvalRequestId` thì kiểm yêu cầu đã duyệt trong ngày, đúng đơn (sai → 422 `NOT_IN_LIST`), không tạo yêu cầu thứ hai, không đòi lý do.

### 3. Minor / Suggestion (FE-S4-03 … 16) – đã làm hết
- **FE-S4-03**: số ở dòng bảng dùng số trần `vnd()`, dòng tổng dùng `money()`. Áp cho `MovePreviewBox`, `CheckInPayment`, `FolioDialog`.
- **FE-S4-04**: thứ tự trong hộp tính thử: tiêu đề → cơ sở giá → cảnh báo `MANUAL_RATE_REPRICED` → bảng đêm → bảng tổng. Chênh lệch có dấu "+…đ"/"−…đ"; FOC chờ duyệt nằm ngay dưới chênh lệch.
- **FE-S4-05**: cột Đêm "T5 22/10". Chênh lệch đổi căn OTA thành dòng phụ `move.night_ota_diff`.
- **FE-S4-06**: đơn quá 7 đêm thì bảng đêm gói trong `<details>` (`move.nights_toggle`).
- **FE-S4-07**: tiêu đề hộp dùng `h3.label-h` + `aria-labelledby`.
- **FE-S4-08**: bản tính thử cũ giữ trên màn, làm mờ (`.stale`, `aria-busy`), "Đang tính thử…" ở đầu hộp.
- **FE-S4-09 … 12** (H13):
  - `ci.recon_ok` chỉ hiện với chuyển khoản, đặt sau chip.
  - Chip "Đã thanh toán đủ" có icon.
  - Khối VietQR dùng `.card.inset`.
  - Dòng "Còn phải thu hiện tại" chỉ hiện khi có dòng cộng/trừ.
- **FE-S4-13** (No-show):
  - Đang tải → `svc.loading` (`role=status`).
  - Lỗi → Alert có `id`. Nút khóa trỏ tới câu này khi chưa có dòng dịch vụ.
- **FE-S4-14**: tick "giữ" mà chưa có lý do → dòng tóm tắt đổi thành `svc.reason_needed` (`role=status`). Ô lý do có gợi ý này ngay khi tick.
- **FE-S4-15** (Hủy đơn): thứ tự hậu quả → hoàn tiền → **Lý do hủy** (+ phạt OTA) → dịch vụ → tóm tắt.
- **FE-S4-16**: mỗi dòng dịch vụ là lưới 3 cột [ô tick + dòng] [chip] [số] (`.svc-line`). Tên truy cập của ô tick vẫn là `svc.keep`.
- CSS: thêm `.stale`, `.svc-line` vào cuối `packages/ui/src/styles/app.css` (giá trị theo lưới 4px).

### 4. Kiểm thử
- admin-web vitest **307/307**. `tsc` 0 lỗi; eslint, prettier xanh. `@ottimo/i18n` 19/19. `check_hifi.py` xanh. `gen_traceability.py --strict` exit 0.
- Unit mới, `s4-money.test.tsx`:
  - Khách đưa 500.000 cho 2.468.000 → khóa, câu thiếu 1.968.000 đ gắn vào nút, 0 lệnh B9, 0 khoản thu.
  - Khách đưa 3.000.000 → "Thối lại 532.000 đ", `payment.amountVnd` = 2.468.000.
  - Chuyển khoản: trống / thiếu / dư / đúng số.
  - 202: gửi được, chỉ VietQR, không có `payment`.
  - Sau khi duyệt: "Tải lại" → B9 kèm `approvalRequestId` + tiền mặt.
- Unit mới, `s4-uxd-fea.test.tsx`: bố cục FE-S4-03…08, dòng dịch vụ FE-S4-14/16, trạng thái tải của No-show FE-S4-13.
- Unit sửa: `checkin.test.tsx` (nhập "Tiền khách đưa"), ca POS S4-10 (nhập "Số tiền đã nhận"), ca hủy S4-08 (tóm tắt nhường chỗ).
- E2E-UI bấm thật (`r1-main-flows.md` **v0.3.18**), `e2e/ui-clock/stay-money.s4.spec.ts`:
  - **TC-L3-081 (mới)** – FE-S4-01: đưa thiếu 500.000/1.500.000 → khóa, 0 lệnh `checkIn`; đưa 2.000.000 → thối 500.000, ghi 1.500.000.
  - **TC-L3-082 (mới)** – FE-S4-02: (a) 202 không `payment`, chỉ VietQR; (b) `qa.fdl` duyệt → "Tải lại" → B9 kèm `approvalRequestId` + tiền mặt. Cần `E2E_COMPOSE_CONTROL=1` (`needCleanRooms`) để giả lập buồng VD.
  - **TC-L3-079 (a) sửa**: nhập "Tiền khách đưa".
  - `e2e/ui/desk-writes.s4.spec.ts` sửa theo bố cục mới: số trần, chênh lệch có dấu, `svc.reason_needed` là `role=status`.
  - Chưa chạy trên stack (QA chạy khi gộp). `--list` nhận đủ ca, `tsc`/eslint của tests xanh.
- Chưa kiểm bằng mắt trên trình duyệt (tránh đụng Browser pane chung). Bố cục kiểm bằng jsdom.

### 5. File đã tạo / sửa (đợt 5)
- `product/apps/admin-web/src/pages/stay/CheckInPayment.tsx`, `CheckInPage.tsx` (vùng thu tiền + yêu cầu đã duyệt; không đụng phần `Code`/mono của FE-B), `FolioDialog.tsx`
- `product/apps/admin-web/src/pages/reservations/MovePreviewBox.tsx`, `ServiceLines.tsx`, `ReservationDialogs.tsx` (`MoveDialog`, `CancelDialog`, `NoShowDialog` – không đụng `DepositDialog`)
- `product/apps/admin-web/src/mocks/stay.ts` (handler `check-in`)
- `product/packages/ui/src/styles/app.css` (thêm cuối tệp)
- `product/design/tools/gen_strings.py` (nhóm "FE-A sửa theo review UXD…": 6 chuỗi, chờ UXD duyệt) + sinh lại `copy/strings-*.json`, `wireframes/assets/strings.js`, `tools/strings-tables.md`
- Test: `src/__tests__/s4-money.test.tsx`, `checkin.test.tsx`, `s4-uxd-fea.test.tsx` (mới)
- E2E: `product/tests/e2e/ui-clock/stay-money.s4.spec.ts`, `product/tests/e2e/ui/desk-writes.s4.spec.ts`; `product/tests/test-cases/r1-main-flows.md` (v0.3.18); `product/docs/qa/traceability.md` (sinh lại)

### 6. Giả định
- Yêu cầu "duyệt trong ngày": FE so ngày của `decidedAt` với hôm nay theo giờ cơ sở (lịch). Server mới là nơi quyết định theo ngày nghiệp vụ (mốc 06:00). Yêu cầu đã hết hạn → 422 `NOT_IN_LIST`, hiện lỗi chung của trường.
- Chuyển khoản/POS dư không ghi ở H13 (BE cũng chặn 422). Lễ tân ghi phần dư ở folio sau khi nhận phòng.

---

## Phần FE-A – đợt 6: sửa ca đỏ trên stack `ottimo-qa-s4` + BUG-R2-106 (17/10/2026 tối)

Chạy trên stack `ottimo-qa-s4`: api bản QA (cây làm việc + patch B-6). Container `web` được tạo lại để dùng admin-web build từ cây làm việc (`scratchpad/fea-s4/aw-dist`, `compose.web-fea.yml`); không dựng ảnh mới. Mỗi ca chạy 3 lượt, `--retries=0`.
- **TC-L3-079 (a)**: 3/3 đạt. Ca chờ dòng phụ thu "+210.000" (số không kèm "đ", có dấu, FE-S4-03) – đã sửa ở HEAD.
- **TC-L3-081**: 3/3 đạt. Lỗi 401 cũ do tua đồng hồ hai lần sau khi đã đăng nhập. `br40201(request, '14:30')` nay mở ngày ảo thẳng ở 14:30 nên không phải tua lần hai (đã có ở HEAD).
- **TC-L3-082**: 3/3 đạt. Lỗi `locator.fill` quá 90s do tìm nhãn `getByLabel('Lý do', { exact: true })`, mà nhãn có dấu `*` của ô bắt buộc nằm trong `<label>`. Đổi sang regex `^Lý do(\s*\*)?$`. DB xác nhận mỗi lượt có 1 yêu cầu `approved` và 1 khoản tiền mặt 1.500.000.
- **TC-NT-052 / BUG-R2-106**: 9/9 đạt (3 + 6 lượt). Nguyên nhân: sau "Tải lại", thẻ cũ (version cũ) còn trên màn trong lúc đọc lại hàng chờ; mở hộp duyệt từ thẻ đó sẽ gửi `expectedVersion` cũ. Sửa ở `ApprovalsPage.tsx`: nút Duyệt/Từ chối khóa cho tới khi lần đọc lại xong (`rereading`), nên hộp duyệt luôn mở trên dữ liệu vừa tải lại. Unit: giữ lần đọc lại → nút khóa → thả → nút mở → gửi đúng version mới.

---

## Phần FE-A – đợt 7: DOM-S4-06 – báo khách khi đổi căn/ngày làm đổi tiền (BR-429 (d1) v0.3.8) (17/10/2026 tối)

- `MoveDialog` (`ReservationDialogs.tsx`): ô "Đã báo khách số tiền mới" bắt buộc trong hai trường hợp:
  - Bản tính thử đang hiện có `folioDeltaVnd ≠ 0`, với mọi lý do và mọi kiểu đổi (B7 đổi ngày, dời B8, đổi căn do OTTIMO làm đổi phụ thu…).
  - Khách tự xin đổi căn, kể cả khi chênh 0. Trừ đơn hợp đồng giấy (`pricingBasis = external_contract`, BR-429 (h)).
- Khi phải tick, lệnh ghi gửi `applyDifference: true` + `expectedDeltaVnd` = số đang hiện. Chênh 0 và không phải khách xin đổi căn thì không cần tick, không gửi hai trường này.
- `MovePreviewBox` không phải sửa: dòng tổng đã hiện chênh có dấu.
- Không thêm chuỗi mới: `move.told_guest` và `move.save_needs_told` đã đủ nghĩa cho mọi trường hợp.
- Mock `reservations.ts`: theo luật mới, thiếu cờ thì 422 `applyDifference` `REQUIRED`, lệch số thì 409 `SURCHARGE_CHANGED`.
- Unit (`s4-money.test.tsx`):
  - Khách dời ngày, giữ căn: nút khóa, không gửi lệnh tới khi tick; lệnh ghi có `applyDifference` + `expectedDeltaVnd` = chênh thật, không có `roomId`.
  - API mock từ chối khi thiếu cờ.
  - `reservation.test.tsx` (ca 412 khi đổi ngày) sửa thêm bước tick.
  - admin-web 309/309; `tsc`, eslint xanh.
- E2E **TC-L2-103** (`r1-main-flows.md` v0.3.20), tệp `e2e/ui/desk-writes.s4.spec.ts`; chạy trên stack `ottimo-qa-s4`, mỗi ca 3 lượt:
  - **(a)** Desk bấm thật, oracle BR-429-12 (+119.000, tổng 2.495.000): đạt 3/3. Lượt đầu có 1 lần đỏ ở bước dựng dữ liệu, do `createGuest` trả 409 `DUPLICATE_GUEST` (số điện thoại ngẫu nhiên `mobile()` trùng). Đây là lỗi môi trường, `precondition()` đã báo đúng.
  - **(b)** Server: `knownBug('DOM-S4-06')`, đã thêm vào `OPEN`, regex nhận mã `DOM-S4-xx`. Stack (api cây làm việc lúc 20:22) vẫn trả 200 khi thiếu cờ, nên lỗi còn mở. Code BE-A trong cây làm việc đã chặn. Khi gộp BE-A phải xóa dòng `DOM-S4-06` khỏi `OPEN`; trước đó kiểm bằng `E2E_FIXED_BUGS=DOM-S4-06`.
- Ghi chú stack: lần đầu build lại admin-web, container `web` vẫn phục vụ bản cũ vì `vite --emptyOutDir` tạo lại thư mục mà bind mount không theo. Đã tạo lại container (`--force-recreate`); từ nay build qua `scratchpad/fea-s4/build-aw.sh` (rsync vào thư mục cũ). Các ca của đợt 6 đã chạy trên bản build có đủ thay đổi của đợt đó.

---

## Phần FE-A – đợt 8: BUG-R2-107 – H17 đọc đủ hàng chờ duyệt (17/10/2026 tối)

- `packages/api-client/src/endpoints.ts`: `listApprovalRequests(P, status?, cursor?)` – thêm `cursor` (hợp đồng 0.3.7, `page.nextCursor`).
- `apps/admin-web/src/app/approvals.ts` (mới) – hàm `listApprovals(propertyId, statuses, { find?, maxPages? })`:
  - Lọc `status` ở server, đọc hết các trang theo `nextCursor` (chặn an toàn 50 trang × 100).
  - Gộp các trạng thái, bỏ trùng, xếp mới nhất trước.
  - Có `find` thì dừng ở bản ghi khớp đầu tiên.
- H17 (`ApprovalsPage.tsx`) đọc `pending` + `escalated` bằng hàm này, không còn "100 bản mới nhất mọi trạng thái rồi lọc ở máy". H13 (`CheckInPage.tsx`, tìm yêu cầu buồng chưa sẵn sàng đã duyệt) cũng dùng hàm này, tối đa 10 trang.
- Mock `stay.ts`: danh sách yêu cầu duyệt trả theo trang (`limit`, `cursor`, `page.nextCursor`) như server.
- Unit: 130 yêu cầu (10 đã duyệt + 120 chờ duyệt); yêu cầu cần thấy là bản chờ duyệt thứ 120. Kết quả: thẻ hiện ra, mọi lần gọi đều có `status`, có lần đọc trang 2 (`cursor=100`). admin-web 310/310, api-client 30/30, `tsc`/eslint xanh.
- E2E trên stack `ottimo-qa-s4` (hơn 700 yêu cầu chờ duyệt): TC-NT-052 3/3 đạt, TC-L3-082 3/3 đạt. Bản build trước khi sửa tái hiện đúng lỗi QA báo (TC-NT-052 0/3).
- Cùng kiểu lỗi, chưa sửa vì không thuộc vùng FE-A: `pages/money/MoneyPage.tsx:498` (hàng chờ hoàn) và `pages/dashboard/useDashboard.ts:75` (khối Cần duyệt) vẫn đọc 1 trang mọi trạng thái. Có thể dùng `listApprovals` của `app/approvals.ts`.

---

## Phần FE-A – đợt 9: S4-25 phần Desk – xin miễn phí ngoài bước nhận phòng (CỔNG) (17/10/2026 tối)

API dùng theo `outputs/BE/s4-be-b.md` mục 9 (bản vá BE-B ORC đã áp vào cây chung). Không đổi hợp đồng.

### 1. Đã làm
- `pages/stay/foc.tsx` (mới) dùng chung cho mọi chỗ xin miễn:
  - `FOC_REASONS`: danh sách lý do (H13 nay cũng dùng).
  - `focHeadroom`: số tối đa còn được xin trên một dòng, cùng cách tính với `reductionHeadroomVnd` của server (S4-23 (6)).
  - `canAskFoc`: dòng nào được xin.
  - `FocStateChip`: chip trạng thái dòng miễn theo BR-434 – chờ duyệt / đã áp / không còn áp.
  - `SurchargeFocFields`: công tắc "Xin miễn phụ thu (gửi duyệt)" + lý do + ghi chú, theo mẫu H13 13.4.
  - `FocRequestDialog`: hộp H17 17.1 – loại (giảm giá đặc biệt chỉ cho đêm phòng), số tiền mặc định bằng số tối đa và không cho vượt (lỗi ở ô, cả khi server trả `max`), lý do bắt buộc, ghi chú bắt buộc khi chọn "Khác", câu định tuyến người duyệt.
  - Khối tự áp minibar (BR-436): lễ tân / lễ tân trưởng, dòng minibar, ≤ 100.000 → nhập mật khẩu → `authMethod`/`secret`. Server không cho tự áp thì yêu cầu đi luồng duyệt và Desk báo `foc.over_self_limit`.
- **H15 Trả muộn** (`LateCheckoutDialog`): sau ô "đã báo khách" có thêm "Xin miễn phụ thu"; lệnh lưu kèm `requestFocForSurcharge`. Bật mà chưa có lý do thì nút Lưu khóa và nói vì sao.
- **H16 bước 2**:
  - Phụ thu trả muộn chưa có trên folio, nên "Xin miễn phụ thu" đi cùng lệnh ghi phụ thu lúc bấm "Tiếp tục: Bill" (`setLateCheckout.requestFocForSurcharge`).
  - Bảng folio của màn trả phòng có nút "Mở form miễn phí / giảm giá" trên các dòng đã ghi: minibar vừa đếm, phát sinh, phụ thu đã ghi từ H15. Có chip trạng thái dòng miễn.
  - Bước 3 (bill) cũng báo `co.foc_pending` (BR-426 chặn Hoàn tất).
- **Folio & điều chỉnh** (`FolioDialog`): mỗi dòng phát sinh còn được xin có nút "Mở form miễn phí / giảm giá"; dòng miễn có chip trạng thái.
- **Thêm người khi đang ở** (`PartyDialog`, BUG-R2-093):
  - Sau ô "Ghi phụ thu … – tôi đã báo khách" có thêm "Xin miễn phụ thu".
  - Thêm người xong, Desk gửi `requestFoc` cho **mỗi đêm**. Số xin = phần của người mới (dòng `extra_person` của đêm sau − trước), không vượt số tối đa.
  - Thông báo số yêu cầu đã gửi; đêm nào gửi lỗi thì báo để gửi lại ở Folio.
  - Bỏ câu `party.surcharge_waiver_note` (cũ: "Desk chưa có nút xin miễn").
- Mock `stay.ts`:
  - `requestFoc` kiểm số tối đa (422 `VALUE_OUT_OF_RANGE` + `max`), mật khẩu, tự áp minibar BR-436.
  - `late-checkout` nhận `requestFocForSurcharge`.
  - Kiểu `MockApproval` thêm `selfApplied`.

### 2. Kiểm thử
- admin-web vitest **318/318**:
  - `s4-25-foc.test.tsx` (mới, 5 ca): H16 bước 2; H15 "Khác" + ghi chú; số tối đa / vượt / gửi trên dòng phát sinh; tự áp minibar sai rồi đúng mật khẩu; thêm người kèm FOC (2 đêm × 150.000).
  - `s3-fix9` sửa theo nút mới.
  - `tsc`, eslint, prettier xanh; i18n 19/19; `check_hifi` xanh.
- E2E trên stack `ottimo-qa-s4` (api `api-dist7` có S4-25; admin-web build bằng `qa-s4/build-web.sh admin-web`), `desk-clock`, `--retries=0`, **mỗi ca 3 lượt đều đạt**:
  - **TC-X-071** 3/3. Đã viết lại theo cách Desk làm, bỏ `knownBug('S4-25')`, xóa `S4-25` khỏi `OPEN`.
  - **TC-L4-099** 3/3 (mới).
  - **TC-L3-083** 3/3 (mới).
  - **TC-NT-053** 3/3 (mới).
  - Hai lượt đầu (22:38–22:41) chạy trùng lượt của QA nên có ca đỏ giả: 401 vì đồng hồ ảo chung bị tua. Lượt sạch 22:42:45–22:43:25 đạt 12/12. Đã ghi `qa-s4/clock-lock.txt`; `run-e2e.sh` của FE-A nay chờ hết tiến trình Playwright khác và tự ghi khóa.
- `r1-main-flows.md` **v0.3.26**; `traceability.md` sinh lại (`--strict` exit 0).

### 3. Quyết định / giả định
- **TC-X-071 đổi bước** (QA viết trước khi có giao diện): ở H16 bước 2, phụ thu trả muộn chưa nằm trên folio. Vì vậy Desk không gọi `requestFoc` trên dòng, mà gửi đề nghị cùng lệnh ghi phụ thu (`setLateCheckout.requestFocForSurcharge`). Cách này theo đúng ORC giao, hi-fi H15 15.3 và mẫu H13. Nút "Mở form miễn phí" dùng cho dòng đã ghi. QA rà lại ca.
- Desk không biết lễ tân đã dùng bao nhiêu hạn mức tự miễn trong tháng (hợp đồng không có số này). Desk chỉ gợi ý theo mức một lần (100.000, BR-436) bằng câu mới `foc.self_apply_short`; server quyết. Không áp được thì yêu cầu thành chờ duyệt và Desk báo `foc.over_self_limit`.
- Thêm người kèm FOC: mỗi đêm một yêu cầu (BE-B, ORC: 0.3.7 không có `PartyMemberCreate.requestFocForSurcharge`).

### 4. File (đợt 9)
- Tạo: `apps/admin-web/src/pages/stay/foc.tsx`, `apps/admin-web/src/__tests__/s4-25-foc.test.tsx`, `tests/e2e/ui-clock/foc.s4.spec.ts`.
- Sửa: `apps/admin-web/src/pages/stay/{StayDialogs,CheckOutPage,FolioDialog,CheckInPage}.tsx`, `apps/admin-web/src/mocks/stay.ts`, `apps/admin-web/src/__tests__/s3-fix9.test.tsx`, `tests/e2e/ui-clock/flow-a1.s4.spec.ts`, `tests/e2e/support/known-bugs.ts`, `tests/test-cases/r1-main-flows.md`, `docs/qa/traceability.md`, `design/tools/gen_strings.py` (+ `copy/strings-*.json`, `wireframes/assets/strings.js`, `tools/strings-tables.md`).

---

## Phần FE-A – đợt 10: DOM S4-38 (BR-107 v0.3.8) + ARC 0.3.7 bổ sung 4 – giá lịch, số cần thu của máy chủ, cọc (17/10/2026 khuya)

### Đã làm
- **H09 đặt phòng**:
  - Ô giá từng đêm là **giá lịch, trước giảm dài ngày** (`rate.pre_tier`), điền sẵn `calendarRateVnd`.
  - Đêm chưa sửa: hiện cạnh ô "Sau giảm 10%: …" và tổng tiền phòng, đều lấy từ `calculateQuote`.
  - Đêm đã sửa: không tự tính, chỉ ghi "giảm áp khi lưu" (`rate.tier_on_save`). Lệnh tạo đơn gửi giá lịch cho mọi đêm.
  - Máy chủ không gửi `calendarRateVnd` mà lượt ở có bậc giảm thì ô giá **chỉ đọc** (`rate.tier_locked`), để không giảm hai lần.
- **S4-35 sửa giá đêm (Folio)**: ô giá điền giá lịch của đêm (`Reservation.nightlyRates[].calendarRateVnd`). Gợi ý "Đêm này hiện tính … sau giảm (giá lịch …)". Câu kết quả không tự tính số sau giảm.
- **B13 gia hạn**: nhãn danh sách đêm ghi "giá lịch, trước giảm dài ngày". Tổng sau giảm vẫn là `repricing` của máy chủ.
- **H13 / B9a**:
  - Câu đêm B9a nói rõ đây là giá lịch.
  - Bỏ phần cộng ở client khi thiếu `amountDueAtCheckinVnd`.
  - Chỉ còn trừ FOC đang xin trong chính lệnh B9 (preview không biết khoản này – BR-402).
- **H16**:
  - Số còn phải thu = `amountDueAtCheckoutVnd`, bỏ phép tự cộng phụ thu/đêm thêm/tiền thừa.
  - Lễ tân gõ giá đêm thêm khác mặc định: Desk hỏi máy chủ bằng QR `check_out` kèm `extraNightRateVnd` với số rất lớn → 422 `AMOUNT_EXCEEDS_BALANCE` `max` (không ghi gì), theo ARC bổ sung 4 #1.
  - Đang tính thì nút "Tiếp tục: Bill" khóa, có câu báo. Không đọc được thì báo, và B18 tính lại khi hoàn tất.
  - Ô giá đêm thêm ghi rõ là giá lịch; dòng đêm thêm trong bảng có đuôi "giá lịch".
- **Cọc (ARC #2)**: drawer chỉ ghi "Cọc cần thu" khi đơn `hold`; từ `confirmed` ghi "Cơ sở phí hủy (cọc theo tiền phòng hiện tại)". Hộp cọc, QR cọc vốn chỉ dùng cho đơn giữ chỗ.
- Mock: tạo đơn áp bậc lên giá gõ; `checkout-summary` có `amountDueAtCheckoutVnd`; QR `check_out` có trần theo giờ và giá đêm thêm.
- 13 chuỗi mới, nhóm "FE-A: giá lịch…" trong `gen_strings.py`, chờ UXD duyệt.

### Kiểm thử
- admin-web vitest **323/323**: `s4-38-fea.test.tsx` mới 5 ca; `booking`, `checkout` sửa nhãn. `tsc`, eslint, prettier xanh; i18n 19/19; `check_hifi` xanh.
- E2E trên `ottimo-qa-s4` qua `qa-s4/clock-run.sh` (admin-web build bằng `build-web.sh`), mỗi ca 3 lượt:
  - `desk-clock` TC-L4-053/040, TC-L4-096, TC-X-070, TC-X-071: **12/12**.
  - `desk-chromium` TC-L2-021 (tạo đơn trên Desk): **6/6**.
  - Không thêm ca mới: chưa có ca E2E nào gõ giá đêm ≥ 7 đêm hay giá đêm thêm khác mặc định.

### Cần vai khác (báo ORC)
1. **BE-A**: `calculateQuote` chưa trả `nightlyRates[].calendarRateVnd` (trường đã có trong hợp đồng), vì `quote-pricing.ts` chỉ trả số sau bậc. Chưa có trường này thì trên máy chủ thật, đơn ≥ 7 đêm ở H09 bị khóa sửa giá (cố ý, để không giảm hai lần).
2. **BE-A**: `ExtensionOptions.currentBookingRateVnd` đang là giá **ròng** (gross − giảm). "Giữ giá đơn" gửi số này làm giá gõ, và theo BR-107 v0.3.8 máy chủ áp bậc lần nữa → giảm hai lần khi tổng ≥ 7 đêm. Theo DOM, "giữ giá sửa tay = giữ giá lịch", nên nên trả giá lịch.
3. **ARC**: chưa có xem trước của máy chủ cho giá gõ ở H09, B13, S4-35. Desk ghi tỷ lệ giảm và "áp khi lưu", không tự tính số sau bậc. Nếu cần số chính xác ngay khi gõ, cần một xem trước có `nightlyRates`.

---

## Phần FE-A – đợt 11: BUG-R2-127 (P1) – đêm trước ngày đến đã có khách (18/10/2026)

- `CheckInPage.tsx` đọc `CheckInPreview.priorNight.available`. Khi `false`:
  - Không coi là B9a: không có ô "đã báo khách", không gửi `addPriorNight`/`priorNightRateVnd`, QR `check_in` không kèm đêm đó.
  - Số cần thu = số dư hiện tại, không cộng đêm trước.
  - Thay câu B9a bằng câu báo `checkin.prior_night_taken` (chuỗi mới, chờ UXD duyệt). Nút Nhận phòng khóa, gắn câu đó, vì trước mốc đổi ngày máy chủ không cho nhận phòng nếu thiếu B9a (BR-417).
- Mock: `priorNight.available` tính theo đơn khác giữ căn đêm trước; preview không cộng đêm đó; B9 kèm `addPriorNight` khi đêm đã có khách → 422 `NOT_ALLOWED` (như BE-A).
- Unit: 1 ca mới trong `s4-38-fea.test.tsx`; admin-web **324/324**; `tsc`, eslint xanh. Không có ca E2E UI nào chạm B9a, nên không chạy E2E.

---

## Phần FE-A – đợt 12: BUG-R2-139 (P2) và BUG-R2-141 (P3) ở H16 (18/10/2026)

- **BUG-R2-139** (`CheckOutPage.tsx`) – khi `extraNightAvailable = false` (đêm nay căn đã có khách):
  - "Còn phải thu" = số dư folio của máy chủ (`balanceDueVnd`), không lấy `amountDueAtCheckoutVnd` vì số đó đã cộng đêm thêm theo giá mặc định.
  - Không gửi đêm thêm vào QR. Dòng dưới tổng nói rõ lý do (`checkout.due_without_extra_night`, chuỗi mới chờ UXD).
  - Chưa làm cách tính thay thế (vd quản lý duyệt phụ thu trả muộn thay đêm), chờ DOM chốt.
- **BUG-R2-141** (`hooks/useResource.ts`) – lỗi: một handler tạo ở lần render cũ gọi `reload`, lần tải này dùng đầu vào cũ và về sau cùng nên đè phản hồi đúng.
  - Sửa: `reload` gọi `runRef.current()`, nên luôn đọc bằng đầu vào mới nhất; tham chiếu `reload` không đổi giữa các lần render.
  - Mọi trang admin-web dùng chung hook này nên cùng được sửa. Mobile/guest-web không có bản sao hook.
  - Đã xóa `BUG-R2-141` khỏi `OPEN` (TC-L4-100 phải đạt).
- Kiểm thử:
  - Unit: `use-resource.test.tsx` (mới); thêm 1 ca BUG-R2-139 trong `s4-38-fea.test.tsx`. admin-web **326/326**; `tsc`, eslint xanh.
  - E2E qua `clock-run.sh` (admin-web build lại), 3 lượt: TC-L4-100, TC-L4-053/040, TC-L4-096, TC-X-070 đạt **12/12**.

---

## Phần FE-A – đợt 13: ARC 0.3.7 bổ sung 4 mục 16.6 (d)(e)(f) + FB-R2-SEC-FE-08 (18/10/2026)

Căn cứ: `rounds/round-02/outputs/ARC/openapi-0.3.7.md` mục 16 (DOM chốt 18/10), `reviews/s4-SEC-lateFee-reauth.md` thẻ FE-08. Server (BE-A/BE-B) đang cài nên phần này chạy trên mock; E2E làm khi server xong.

- **(d) BR-416-06 – phụ thu trả muộn bằng giá 1 đêm** (`CheckOutPage.tsx`, `PaymentPanel.tsx`):
  - Khi `extraNightRequired` và `extraNightAvailable = false` mà máy chủ gửi `lateFeeAsNightVnd`: bước 2 báo "thu phụ thu bằng giá 1 đêm"; "Còn phải thu" = `amountDueAtCheckoutVnd` (đã gồm phụ thu, không gồm đêm); dòng phụ `co.late_fee_as_night_line`. Máy chủ cũ (không có trường) giữ cách của BUG-R2-139.
  - QR `check_out` gửi `lateFeeAsNight: true`, không gửi `extraNightRateVnd`.
  - Bước 3 có hộp "Quản lý xác nhận": lý do, FOC tùy chọn (dùng lại form FOC, nhãn riêng `co.late_fee_foc` vì quản lý áp ngay, không gửi duyệt), bảng 3 số (phụ thu, miễn/giảm, khách trả), tên đăng nhập + mật khẩu quản lý. OWN/MGR bỏ trống tên = tự xác nhận. Nút Hoàn tất khóa tới khi đủ.
  - B18 gửi `lateFeeInsteadOfNight { amountVnd, reason, approverUsername?, authMethod: 'password', secret, requestFoc? }`; `requestFoc` không có `authMethod`/`secret`. Số cần thu trừ FOC đang gửi (ví dụ 50 %: khách trả nửa phụ thu). Tiền thu trước cho khoản này không bị coi là tiền thừa.
- **FB-R2-SEC-FE-08** (cùng hộp trên):
  - Không có `<form>`, ô tên `name` khác `username`, `autoComplete="off"`, `maxLength` 100; ô mật khẩu che, `autoComplete="new-password"`.
  - Mật khẩu bị xóa sau mỗi lần gửi, khi rời bước 3/đóng hộp, và khi phụ thu hoặc FOC đổi (quản lý phải thấy đúng số mình cho phép).
  - 401 `REAUTH_FAILED` hiện **một câu chung** (`co.late_fee_auth_failed`), không phân biệt sai tên hay sai mật khẩu, ở ô mật khẩu và ô lỗi chung. 429 hiện `co.late_fee_locked` ({minutes} từ `Retry-After`).
  - Việc ngoài FE: checklist SR-DEV-07 (trình duyệt quầy tắt trình quản lý mật khẩu bằng chính sách) – OPS/SEC.
- **(e) Minibar M-1** (`CheckOutPage.tsx`, `endpoints.ts`):
  - `getMinibarStandard(R, roomId?)`. Bước 1 có chọn tủ khi `minibarUncheckedRooms` có căn cũ; tự chọn tủ căn cũ trước; lưu xong chuyển sang tủ còn lại rồi mới sang bước 2. `recordMinibarCheck` gửi `roomId` (vắng = căn đang gán).
  - `adjustedAfterLastCheck`: cảnh báo "Folio đã sửa sau lần đếm trước", liệt kê từng món (folio/lần đếm), mặc định điền `còn lại = standardQty − folioUsedQty` để máy chủ giữ dòng (R6).
- **(f) Xác nhận QR vượt** (`VietQrCard.tsx` `qrOverDue`, `PaymentPanel.tsx`, `CheckInPayment.tsx`, `CheckInPage.tsx`):
  - So `amountVnd` với `Payment.amountDueNowVnd`, hoặc đọc 422 `REASON_REQUIRED` ở `note` + `max`: hiện cảnh báo vượt, ô ghi chú bắt buộc (≥ 3), chặn nút xác nhận tới khi có ghi chú.
  - H13: QR nhận phòng tạo trước còn `pending` (`qrPurpose = check_in`) được hiện lại để xác nhận (kèm nút tạo mã mới).
  - Chưa làm "NÊN" (cảnh báo QR chờ khi bán đêm) – R3 theo ARC D8.
- **Mock** (`mocks/stay.ts`): `lateFeeAsNightVnd`, due gồm phụ thu, QR `lateFeeAsNight`/`NOT_ALLOWED`, lệnh B18 đường `lateFeeInsteadOfNight` (kiểm nghiệp vụ trước, 401 giống nhau, 429 sau 5 lần, 409 `SURCHARGE_CHANGED`, 422 `VALUE_OUT_OF_RANGE`, 403 `APPROVAL_LIMIT_EXCEEDED` – hạn mức MGR giả định 1.000.000), `Payment.qrPurpose/amountDueNowVnd`, `confirm-received` 422 `REASON_REQUIRED` + `max`, tủ minibar theo căn (`minibarOldRooms`, `minibarUncheckedRooms`, `roomId`, 5 trường DOM (e), giữ dòng R6). Cờ test `legacyNoLateFeeAsNight` giả lập máy chủ cũ.
- **Chuỗi**: 23 khóa mới, nhóm "R2 Sprint 4 – FE-A: phụ thu trả muộn bằng giá 1 đêm …" trong `gen_strings.py` – **chờ UXD duyệt**.
- Kiểm thử:
  - Unit: `s4-416-fea.test.tsx` (mới, 8 ca: BR-416-06 FD + FOC 50 % + 401 + B18; MGR tự xác nhận + QR `lateFeeAsNight`; 429; xóa mật khẩu khi rời bước; QR vượt ở H16 (422) và H13 (`amountDueNowVnd`); tủ căn cũ trước; folio đã sửa giữ dòng). Hai ca cũ BUG-R2-139 chạy với cờ máy chủ cũ. admin-web **334/334**, api-client 30/30; `tsc`, eslint xanh.
  - E2E: **chưa chạy** – chờ BE-A/BE-B xong và QA dựng lại api trên `ottimo-qa-s4`.
- Rủi ro cần theo dõi:
  - H16 bước 3 ghi thu tiền mặt/chuyển khoản (`recordPayment`) **trước** B18 cho khoản chưa ghi folio (đêm thêm, phụ thu giá 1 đêm): máy chủ thật có thể đòi `overBalanceReason`/ghi chú. Đường thiết kế là `finalPayment` của B18 – kiểm khi E2E.
  - DepositDialog (FE-B) xác nhận QR không có ô ghi chú: nếu QR cọc vượt số còn thiếu thì máy chủ trả 422 `REASON_REQUIRED` – FE-B cần đọc lỗi này.

---

## Phần FE-A – đợt 14: BUG-R2-144 phần Desk (DOM (b), BR-703-02) + N-1 (18/10/2026)

Căn cứ: ARC 16.13 (kỳ nạp, quay lại tủ đã đếm), BR-702/703 v0.3.8 bổ sung 18/10, `reviews/s4-money-recheck4.md` (R4MINI-01, Note N-1). Phía server BE-B làm sau khi ARC viết xong câu chữ kỳ nạp – Desk chạy trên mock.

- **H16 bước 1 – tủ cần đếm lại** (`CheckOutPage.tsx`):
  - Tủ có trong `minibarUncheckedRooms` mà `latestCheck = null` và vẫn có lần đếm/dòng tính của kỳ (`lastCheckUsedQty`/`folioLineId`) → cảnh báo "Tủ căn {room} cần đếm lại" (khách vào lại căn hoặc gia hạn sau lần đếm).
  - Số điền sẵn: số folio đã sửa (DOM (e)) → lần đếm sau mốc → **lần đếm trước của kỳ** (`standardQty − lastCheckUsedQty`) → tủ đủ. Trước đây khi `latestCheck = null` Desk điền "tủ đủ" = "không dùng gì", bấm tiếp là đảo khoản đã tính.
  - Kỳ mới (đã bổ sung): tủ đủ, đếm ghi dòng riêng; dòng kỳ trước giữ nguyên (máy chủ quyết, Desk không cộng).
  - Sửa lỗi đua: hiệu ứng tự chọn tủ căn cũ chạy khi bản tóm tắt về trước đơn → gửi nhầm `roomId` của căn đang ở. Nay chờ có đơn.
- **N-1 (NÊN)** (`FolioDialog.tsx`, hộp Điều chỉnh): dòng minibar có miễn/giảm (FOC theo món – cùng `labelParams.item`, vì `FolioLine` không có mã món), tick "Hủy dòng" hoặc giảm dưới số miễn/giảm → cảnh báo `folio.void_minibar_foc`.
- **Mock** (`mocks/stay.ts`): kỳ nạp theo tủ (`minibarPeriods`, `MockLine.minibarPeriod`), đánh dấu đếm lại (`minibarRecount`); B13 sau khi đã đếm → đếm lại (DOM (b)); B14 rời căn → tủ căn cũ, về lại căn đã đếm → kỳ mới (mock coi việc bổ sung đã xong); `latestCheck` chỉ khi có lần đếm sau mốc; giữ/đảo dòng chỉ trong kỳ.
- **Chuỗi**: 3 khóa mới (`co.minibar_recount_title`, `co.minibar_recount_body`, `folio.void_minibar_foc`) – nhóm FE-A mới trong `gen_strings.py`, **chờ UXD duyệt**.
- Kiểm thử: `s4-144-fea.test.tsx` (mới, 3 ca: gia hạn sau khi đếm → báo đếm lại, điền theo lần đếm trước, giữ dòng; B14 201 → 203 → 201 → kỳ mới, dòng 50.000 giữ + dòng 25.000; N-1 cảnh báo khi tick/bỏ tick). admin-web **340/340**, `tsc`, eslint, prettier xanh. E2E chờ BE-B.
- Giả định / còn mở:
  - Kỳ mới sau bổ sung: hợp đồng không có tín hiệu "đếm lại" (mọi trường của kỳ đều rỗng) nên Desk không hiện cảnh báo "cần đếm lại" ở ca này, chỉ cho đếm như lần đầu. Nếu cần câu cảnh báo cho cả ca này: đề nghị ARC thêm `minibarUncheckedRooms[].recount` (tùy chọn).
  - N-1 so món theo tên trên bill (`labelParams.item`); nên có `FolioLine.chargeCode` trong hợp đồng.

---

## Phần FE-A – đợt 14 (bổ sung): ARC 16.14 – `minibarUncheckedRooms[].reason`, `FolioLine.chargeCode` (18/10/2026, vòng sửa 4)

ARC đồng ý hai đề nghị ở đợt 14 (`openapi-0.3.7.md` 16.14, api-client đã sinh lại); BE-B đang điền phía server.

- **H16 bước 1** (`CheckOutPage.tsx`): câu "Tủ căn {room} cần đếm lại" theo `reason` của tủ đang đếm – `stay_continued`, `new_fill` và mọi giá trị lạ → hiện; `never_counted` → không (đếm lần đầu như cũ). Máy chủ chưa có `reason` → giữ cách đoán của đợt 14. Nay hiện được cả ca kỳ mới sau bổ sung (trước đây không có tín hiệu).
- **N-1** (`FolioDialog.tsx`): so món theo `FolioLine.chargeCode` (dòng sửa giữ mã), bỏ so theo tên trên bill; dòng không mã chỉ xét FOC gắn thẳng vào dòng.
- **Mock** (`mocks/stay.ts`): `reason` theo thứ tự `stay_continued` > `new_fill` > `never_counted` (gia hạn sau khi đếm, về lại căn đã đếm → `stay_continued`; tập `minibarNewFill` cho ca R3 bổ sung giữa kỳ); dòng folio mock đã có `chargeCode`.
- Kiểm thử: `s4-144-fea.test.tsx` 5 ca (thêm: `new_fill` hiện câu và điền tủ đủ, `never_counted` không hiện; hai món trùng tên "Bia" khác mã – chỉ dòng cùng mã với dòng có FOC mới cảnh báo; các ca cũ kiểm thêm `reason`). admin-web **342/342**, `tsc`, eslint, prettier xanh. Không thêm chuỗi. E2E chờ BE-B.

---

## Phần FE-A – đợt 15: khóa kỳ khi đếm minibar – `periodId`, 409 `MINIBAR_PERIOD_CHANGED` (ARC 16.16 (ab)) (18/10/2026, vòng sửa 4c, trước cổng QC S4)

Lý do (ARC): lần đếm soạn trên kỳ cũ có thể bị áp vào kỳ mới sau lần nạp → tính thừa (ví dụ 70.000). Server khóa tủ rồi so `periodId`.

- **H16 bước 1** (`CheckOutPage.tsx`) – nơi duy nhất ở admin-web ghi lần đếm minibar:
  - Gửi `MinibarCheckInput.periodId` = `MinibarStandard.periodId` của tủ đang đếm (cả `null` khi tủ chưa có lần nạp; máy chủ cũ không có trường → không gửi).
  - 409 `MINIBAR_PERIOD_CHANGED`: không ghi gì; Desk tải lại `minibar-standard` (và bản tóm tắt), giữ lễ tân ở bước đếm, số điền sẵn theo kỳ mới, hiện cảnh báo "Tủ vừa được bổ sung" + "Số vừa nhập theo lượt nạp trước nên chưa được lưu. Vui lòng đếm lại tủ." thay cho thông báo lỗi chung. Không tự gửi lại. Đổi tủ thì xóa cảnh báo.
- **Mock** (`mocks/stay.ts`): `periodId` theo kỳ của tủ (`null` ở kỳ 0); `periodId` gửi kèm khác kỳ hiện tại → 409, không ghi.
- **Chuỗi**: `co.minibar_period_changed_title`, `co.minibar_period_changed_body` – nhóm "FE-A đợt 15" trong `gen_strings.py`, **chờ UXD duyệt**.
- Kiểm thử: `s4-144-fea.test.tsx` thêm 2 ca – gửi `periodId: null` khi tủ chưa nạp; HK bổ sung trong lúc đếm → 409 → không ghi, có đọc lại `minibar-standard`, ở lại bước 1 với câu nhắc, số về tủ đủ, đếm lại gửi `periodId` của kỳ mới rồi sang bước 2. admin-web **344/344**, `tsc`, eslint, prettier xanh. E2E chờ BE-B.
- Idempotency-Key (ORC 18/10): sau 409 `MINIBAR_PERIOD_CHANGED`, lần đếm lại là lệnh mới nên Desk **sinh khóa mới** (`useWrite.renewKey`, qua `useSubmit.renewKey` – thêm hàm, không đổi hành vi cũ); ca test 409 kiểm hai lần gửi có hai khóa khác nhau (đã thử bỏ dòng sinh khóa → ca đỏ). BE-B đồng thời bảo đảm không lưu khóa khi trả 409.

---

## Phần FE-A – đợt 16: chỉ gửi giá đêm khi lễ tân sửa ô (ARC 16.18, BR-417 phụ lục 5A – vòng sửa 5, P1 162) (18/10/2026)

Từ vòng sửa 5 máy chủ suy nguồn đêm từ việc Desk **có gửi** giá: có = nhập tay (`manual`), vắng = mặc định (`default`). Desk dùng cờ "đã sửa ô", không so số (gõ lại đúng số gợi ý/số lịch vẫn là nhập tay – AN-22).

| Màn | Trước | Nay |
|---|---|---|
| H16 B18 đêm thêm (`CheckOutPage.tsx`) | luôn gửi `extraNight.rateVnd` (cả khi để gợi ý) | gửi `rateVnd` chỉ khi ô đã sửa; QR `check_out` gửi `extraNightRateVnd` theo cùng quy tắc. Khoảng nhập lấy `extraNightFloorVnd`–`extraNightCeilingVnd` (câu `checkout.extra_night_range` nối sau gợi ý); ngoài khoảng → lỗi ở ô và khóa "Tiếp tục: Bill & thu tiền" kèm lý do |
| H13 B9a (`CheckInPage.tsx`) | luôn gửi `priorNightRateVnd` = số gợi ý (lệnh và QR) | không gửi – H13 **không có ô** sửa giá đêm trước, nên đêm luôn là mặc định |
| H15 B13 (`StayDialogs.tsx` ExtendDialog) | nút "Giữ giá đơn" gửi `nightlyRates` mọi đêm = `currentBookingRateVnd` | bỏ nút: gợi ý `nights[].defaultRateVnd` của máy chủ đã theo giá thỏa thuận/min (AN-45), và gửi giá sẽ thành "nhập tay" dù lễ tân không gõ. H15 không có ô giá từng đêm → không gửi `nightlyRates` |
| S4-35 sửa giá đêm ở Folio (`FolioDialog.tsx`) | chỉ lưu được khi số khác giá lịch | cờ "đã sửa ô": gõ lại đúng giá lịch vẫn lưu được và gửi `newUnitPriceVnd` (nhập tay); chưa đụng ô → nút lưu khóa. Dòng không phải đêm giữ cách cũ |
| H09 đặt phòng (`BookingDialog.tsx`) | gửi đủ mọi đêm khi đã sửa một ô | **giữ nguyên**: lệnh B1 của máy chủ đòi đủ mọi đêm khi có `nightlyRates` (`pricing.service.ts` → 422 `REQUIRED` nếu thiếu đêm), nên không gửi được từng đêm. Nếu DOM cần nguồn từng đêm ở B1 thì ARC phải cho B1 nhận danh sách một phần |

- **Mock** (`mocks/stay.ts`): tóm tắt có `extraNightFloorVnd`/`extraNightCeilingVnd` (50 %–200 % giá niêm yết); B18 vắng `rateVnd` = đêm mặc định, có `rateVnd` thì kiểm khoảng (422 `RATE_OUT_OF_RANGE` + `min`/`max`); B13 nhận danh sách một phần (đã có).
- **Chuỗi**: `checkout.extra_night_range` – nhóm "FE-A đợt 16" trong `gen_strings.py`, **chờ UXD duyệt**. `extend.keep_rate`, `extend.keep_rate_help` không còn dùng (UXD quyết giữ hay bỏ).
- Kiểm thử: `s4-418-fea.test.tsx` (mới, 5 ca: B18 không sửa → `extraNight` không có giá, folio 708.000; sửa và gõ lại đúng số → có `rateVnd` + QR có `extraNightRateVnd`; khoảng theo hai trường mới, ngoài khoảng khóa bước; B9a QR có `addPriorNight`, không có giá; S4-35 gõ lại đúng giá lịch → gửi `newUnitPriceVnd`). Sửa ca "Giữ giá đơn" trong `s3-review.test.tsx` (nay: không có nút, lệnh không có `nightlyRates`) và ca gợi ý ô đêm thêm trong `s4-38-fea.test.tsx`. admin-web **349/349**, `tsc`, eslint, prettier xanh. E2E chờ BE-A.

---

## Phần FE-A – đợt 16 (bổ sung): `NightRate.edited` (ARC 16.18 bổ sung) + tự gửi lại 409 CONCURRENT_UPDATE (ARC 16.17 bổ sung (af)) (18/10/2026)

- **H09 (B1)** (`BookingDialog.tsx`): vẫn gửi đủ mọi đêm, mỗi đêm kèm `edited` theo cờ "đã sửa" của ô (`form.ratesEdited`; gõ lại đúng giá lịch vẫn là sửa). Danh sách được gửi khi có số khác giá lịch **hoặc** có ô đã sửa. Máy chủ định giá lại (đổi căn/ngày/khách) → ô về giá máy chủ, cờ xóa. Bản nháp cũ chưa có cờ → coi như chưa sửa ô nào.
- **B13**: H15 vẫn không gửi `nightlyRates` (không có ô giá); nếu sau này có ô thì gửi kèm `edited` từng đêm. **B9a/B18**: giữ cách đợt 16 (vắng = mặc định).
- **409 CONCURRENT_UPDATE ở B13, B14, B18** (`useWrite.tsx` thêm `WriteOptions` theo từng thao tác; `STAY_WRITE_RETRY` trong `stay/common.tsx`; dùng ở ExtendDialog, ChangeRoomForm, CheckOutPage): tự gửi lại **một** lần, **cùng** Idempotency-Key, sau `Retry-After` (vắng → 1 giây); vẫn lỗi mới hiện thông báo. Các thao tác khác giữ mặc định cũ (2 lần, chờ 2 giây). Không áp cho 409 `MINIBAR_PERIOD_CHANGED` (vẫn tải lại, khóa mới – đợt 15).
- Kiểm thử: `s4-418-fea.test.tsx` thêm 4 ca (H09 gõ lại đúng giá đêm giữa → chỉ đêm giữa `edited: true`; B18 409 không header → gửi lại sau ~1 giây cùng khóa, trả phòng xong; B14 409 rồi thành công → 2 lần gửi cùng khóa; B13 409 hai lần → đúng 2 yêu cầu rồi hiện lỗi). admin-web **353/353**, `tsc`, eslint, prettier xanh.

---

## Phần FE-A – đợt 17: K11-03 (P1) – lần đếm minibar luôn định danh tủ, căn hiện tại theo đoạn hôm nay (ARC 16.19) (18/10/2026, vòng sửa 5b, sau `3bd4ac4`)

Lỗi (`reviews/s4-money-recheck5b.md` K11-03 (b)): Desk lấy `segments[0]` làm căn hiện tại; sau B14 giữa lượt, chọn tủ căn cũ thì gửi vắng `roomId` → lần đếm ghi vào tủ căn mới (70.000 cho 1 bia, B18 kẹt `MINIBAR_NOT_CHECKED`).

- **Căn hiện tại** = `currentSegment(segments, hôm nay)` (`app/reservations.ts`): đoạn `fromDate ≤ hôm nay < toDate`; ngày đi (kể cả cửa sổ sau nửa đêm) → đoạn cuối (giả định (a), ORC chấp nhận); trước ngày đến → đoạn đầu. Dùng ở H16 (`CheckOutPage.tsx`: tự chọn tủ, tiêu đề, hộp xác nhận), các hộp lưu trú (`StayDialogs.tsx` `roomOf` – cả danh sách căn đích của Đổi phòng), Drawer (`ReservationDrawer.tsx` – dòng Căn, cảnh báo sức chứa), hộp Dời/đổi căn (`ReservationDialogs.tsx` MoveDialog). H13 (`CheckInPage`) giữ `segments[0]` (B9 là đoạn đầu); DepositDialog (FE-B) không đụng.
- **H16 bước 1**: `countingRoomId = tủ đang hiển thị ?? căn hôm nay`. GET `minibar-standard` **luôn** có `roomId` (chưa có đơn thì chưa đọc). Lần đếm gửi `roomId` = `MinibarStandard.roomId` (tủ của bản chuẩn đã soạn; vắng → `countingRoomId`) và `periodId` của bản chuẩn đó (vắng → `null`); chỉ gửi khi bản chuẩn đã về (`ready`). 409 `MINIBAR_PERIOD_CHANGED` (cả "lần nạp không thuộc tủ") giữ cách đợt 15. `reason` `not_today` → "cần đếm lại" (nhánh "mọi giá trị khác `never_counted`" đã có từ đợt 14).
- **Mock** (`mocks/stay.ts`): B14 cắt đoạn đang ở tại ngày hiệu lực, thêm đoạn căn mới (về lại căn cũ = đoạn thứ ba, không gộp); B13 kéo dài đoạn cuối; `currentCabinet`, nhãn dòng đêm (theo ngày của đêm), nhãn dòng mới, phiếu đăng ký, bill, xung đột trả muộn đều theo đoạn hôm nay; `minibar-standard` trả `roomId`; lần đếm có `periodId` mà vắng `roomId` → 422 `REQUIRED`; `periodId` riêng từng tủ (lần nạp tủ khác không bao giờ khớp).
- Kiểm thử: `s4-144-fea.test.tsx` thêm 3 ca (B14 402 → 202 giữa lượt: H16 đếm 402 gửi `roomId` 402, rồi 202 gửi `roomId` 202, mọi GET có `roomId`, 1 lon = 25.000 ở tủ 402, tóm tắt không còn tủ chưa đếm; Drawer hiện 202; 422 `REQUIRED` khi vắng `roomId`, GET trả `roomId`). Sửa ca cũ đọc `segments[0]` sau B14 hoặc chờ `roomId` vắng (`change-room.test.tsx` – dữ liệu đơn con thật hơn, `s4-416-fea`, `s4-418-fea`); lời gọi API trong test gửi đủ `roomId`/`periodId` (bắt buộc theo api-client mới). admin-web **356/356**, `tsc`, eslint, prettier xanh. E2E (QA – `ui-clock` chưa có ca B14 rồi H16) chờ BE-B.

---

## Phần FE-A – đợt 18: NÊN-ÔĐ – S4-45 (năm sinh trẻ em), BUG-R2-103, S4-50b (078, 087, 089, 101, 102) (18/10/2026, tuần Ổn định – Sản xuất)

| Mã | Sửa | Tệp |
|---|---|---|
| **S4-45** năm sinh trẻ em | Theo BA (`EP02-reservations.md` mục 8 – bắt buộc khi `role = child`, khớp server): ô "Năm sinh" có dấu bắt buộc; trống → nút "Thêm" khóa, lý do cạnh nút `party.child_birth_year_required`; ngoài 2000 … năm của ngày nghiệp vụ → `field_error.value_out_of_range` ở ô; 422 `REQUIRED` của máy chủ hiện cùng câu BA. Không cần BE nới | `StayDialogs.tsx` (PartyDialog) |
| **BUG-R2-103** 2 dòng "Còn phải thu" | Lỗi ở **drawer** đơn đang ở (sổ lỗi, không phải H16): khi có danh sách dòng folio, bảng đầu chỉ còn tiền phòng/cọc; "Đã thu" và "Còn phải thu" nói một lần, sau các dòng | `ReservationDrawer.tsx` |
| **BUG-R2-101** giữ chỗ chưa cọc "Còn phải thu 0 đ" | Chưa có dòng và chưa thu → thay dòng 0 đ bằng `drawer.folio.nothing_posted`; số cần thu của đơn giữ chỗ vẫn ở dòng "Cọc cần thu" | `ReservationDrawer.tsx` |
| **BUG-R2-102** đã hủy và đã hoàn | Thêm dòng "Đã hoàn +…" (Σ giao dịch `refund` đã chi trong `getFolio.payments`) ở cả hai bảng | `ReservationDrawer.tsx` |
| **BUG-R2-087** H16 khung Folio | Thêm dòng dự tính cho phần máy chủ đã tính mà chưa có dòng folio: phụ thu trả muộn mới / tính lại (phần chênh) / đảo phụ thu đã ghi; ở đường BR-416-06 thêm dòng phụ thu bằng giá 1 đêm và dòng miễn/giảm. Các dòng nay cộng ra "Còn phải thu"; số vẫn là của máy chủ | `CheckOutPage.tsx` |
| **BUG-R2-089** giấy tờ chỉ có ảnh | Tiến độ "Đã có giấy tờ x/y" theo `Registration.submittedCount` (cùng số với danh sách); dòng chưa nhập trường mang chip "Cần nhập thông tin" thay "Đã có". Mock đếm như server | `DocsPanel.tsx`, `mocks/stay.ts` |
| **BUG-R2-078** cột danh sách | Desk đã đọc `ReservationSummary.balanceDueVnd`; BE-A đã thêm trường (`s4-be-a.md` mục 9) – thêm ca hồi quy | – |

- **Chuỗi**: 8 khóa mới, nhóm "FE-A đợt 18" trong `gen_strings.py` – **chờ UXD duyệt**.
- **Cần BE/ARC (ORC chuyển)**:
  - BUG-R2-101: nghĩa `Reservation.balanceDueVnd` trước nhận phòng (hiện 0 khi chưa có dòng folio) – ARC chốt (ví dụ "tiền phòng còn phải thu" hoặc vắng trước khi có folio). Desk đã không hiện "0 đ" gây hiểu nhầm.
  - BUG-R2-102: nên có `Folio.totals.refundedVnd` (BE-B/ARC) để Desk không phải cộng từ danh sách giao dịch.
- **Bổ sung theo ARC 16.20** (api-client sinh lại): 101 – `Reservation.balanceDueVnd` **vắng** (đơn giữ chỗ chưa có dòng `posted`) → drawer hiện "Tiền phòng" + "Cọc cần thu" = `depositRequiredVnd − depositPaidVnd` (khi > 0), không "Đã thu"/"Còn phải thu"; folio 0 đ mà chưa có dòng `posted` → "Chưa có khoản nào trên folio"; bỏ cách đoán theo trạng thái. 102 – "Đã thu" = `paidVnd`, "Đã hoàn" = `Folio.totals.refundedVnd`; bỏ phần Desk tự cộng giao dịch hoàn. Mock: đơn `hold` không trả `balanceDueVnd` (chi tiết và danh sách), folio có `refundedVnd`. Sửa ca UXR #6 trong `s3-fix9.test.tsx` theo nghĩa mới; ca 101/102 trong `s4-50b-fea.test.tsx` kiểm số cọc còn thiếu, tiền phòng, `paidVnd`/`refundedVnd`. admin-web **363/363**, `tsc`, eslint, prettier xanh. Hai việc BE/ARC nêu ở trên nay thuộc BE-A (`reservation-dto.ts` vắng `balanceDueVnd`) và BE-B (`refundedVnd`) theo 16.20.
- **Chưa làm (NÊN, không thuộc NÊN-ÔĐ)**: phần ngân hàng của S4-45 (BUG-R2-074, 099) – chờ INT có danh sách ngân hàng VietQR.
- Kiểm thử: `s4-50b-fea.test.tsx` (mới, 7 ca – mỗi mã một ca, 078 là hồi quy). admin-web **363/363**, `tsc`, eslint, prettier xanh. Một lần chạy cả bộ, ca `booking.test.tsx` "direct booking" quá giờ 5 giây rồi tự xanh khi chạy lại (máy bận) – không liên quan thay đổi.

---

## Phần FE-A – đợt 18b: thẻ UXD `reviews/s4-UXD-brand.md` – FE-S4-22, FE-S4-23 (18/10/2026, trước cổng)

- **FE-S4-22 (Major, BR-012 – S4-52)**: tờ phiếu thanh toán (H16 bước 3, drawer đơn đã trả phòng – cùng `BillDialog`) ghi `{khách} · {tên phòng} · ngày`, dùng `Bill.roomName` (số căn chỉ khi căn chưa có tên, DS 11.3), cả trên màn và bản in `.print-root`. Rà các bản in/chứng từ khác của Desk: chỉ có phiếu thanh toán in cho khách (các màn còn lại hiện số căn là màn nội bộ). Mock: `getBill` trả `roomName` và nhãn dòng (`room`, `from`, `to`) theo tên phòng như server (0.3.7 bổ sung D1). Ca test: phiếu và bản in có "The Mist", không có "201".
- **FE-S4-23 (Minor)**: câu dưới "Tủ căn … cần đếm lại" theo `reason` – `stay_continued`, `new_fill`, `not_today` có câu riêng của UXD; giá trị lạ hoặc máy chủ chưa có `reason` → câu chung `co.minibar_recount_body`. Mock thêm đánh dấu `not_today` (K11-09) cho test. Ca test `not_today` và `stay_continued` trong `s4-144-fea.test.tsx`; sửa ca gia hạn cũ sang câu `stay_continued`.
- `hifi.css` UXD vừa sửa (`h3` Be Vietnam Pro 600, `.btn.brand`): chạy lại toàn bộ – admin-web **366/366**, `@ottimo/ui` xanh; không ca nào hỏng. `tsc`, eslint, prettier xanh. Không thêm chuỗi (dùng chuỗi UXD đã sinh lại).

---

## Phần FE-A – đợt 19: SEC FB-R2-SEC-BE-73 / ARC 16.22 – giấy tờ không mặc định "của người đặt" (18/10/2026, trước cổng)

- **H14 nhập tay giấy tờ** (`DocsPanel.tsx` `ManualDocDialog`, thêm mới): ô **"Người trong đoàn"** bắt buộc, không chọn sẵn; danh sách người trong đơn (người đặt có nhãn "Người đứng tên") + **"Người ở chưa có trong đơn"** (không gửi `partyMemberId` → server khớp/tạo hồ sơ "từ giấy tờ"). Chưa chọn → `reg.person_required` ở ô. Không còn điền sẵn tên người đặt; chọn người thì điền tên người đó vào ô tên khi ô trống. `isMain` thành ô **"Khách chính của khai báo lưu trú"** (mặc định bật cho giấy tờ đầu tiên), không quyết định giấy tờ của ai. Người đặt chỉ bị khóa khi đã có giấy tờ gắn với chính họ (bỏ luật "đã có giấy tờ chính = người đặt đã có giấy tờ", cả ở hộp "Gắn người").
- **Đồng ý giữ ảnh giấy tờ** (`RegistrationPage.tsx`): gửi `partyMemberId` của người gắn với giấy tờ – bỏ dự phòng `doc.id`; giấy tờ chưa gắn người → hai lựa chọn khóa, câu `reg2.consent_needs_person`. Desk chưa có màn hỏi P05_CRM riêng; khi làm thì theo cùng quy tắc.
- **Bổ sung theo BE-C (`s4-be-c.md` mục 15)**: người đặt trong `party[]` có id = **id đơn**; chọn người đặt thì Desk gửi `partyMemberId` = id đơn (đã đúng vì Desk gửi id lấy từ `listParty`), không còn thêm người đặt thành "người đi cùng". Mock: người đặt có id = id đơn như server. Ca test mới: chọn "· Người đứng tên" → thân lệnh `partyMemberId` = id đơn, danh sách đoàn không thừa người, đồng ý giữ ảnh gửi id đơn. admin-web **376/376**.
- **Mock**: `addGuestDocument` nhận `partyMemberId` (ngoài đoàn → 422 `NOT_IN_LIST`, đã có giấy tờ → 409 `PARTY_DUPLICATE`); vắng → khớp tên trong đoàn, không khớp → tạo người đi cùng "từ giấy tờ". `consents` bắt buộc `partyMemberId` (vắng → 422 `REQUIRED`), chỉ ghi lên giấy tờ của đúng người – bỏ dự phòng "giấy tờ đầu tiên".
- **Chuỗi**: 5 khóa, nhóm "FE-A đợt 19" – **chờ UXD duyệt**.
- Kiểm thử: `s4-be73-fea.test.tsx` (mới, 2 ca: đặt hộ X cho Y – không chọn sẵn, bắt chọn người, "Người ở chưa có trong đơn" → giấy tờ thuộc người mới Y ≠ X, đồng ý gửi `partyMemberId` của Y; giấy tờ chưa gắn người không ghi được đồng ý). Cập nhật các ca nhập tay cũ chọn người (`checkin`, `s3-review`, `s3-fix9`, `s3-fe07`; dữ liệu mẫu giấy tờ chính của người đặt gắn `partyMemberId`). admin-web **368/368**, `tsc`, eslint, prettier xanh.

---

## Phần FE-A – đợt 20: UXR `s4-pwa-walkthrough.md` (P-17, P-18, P-19, P-23, P-26, P-32, P-34) + S4-13 hướng B (ARC 16.23) (18/10/2026)

| Mã (mức) | Sửa | Tệp |
|---|---|---|
| **P-17** (2) | Dòng "Cơ sở phí hủy" chỉ hiện với đơn **đã xác nhận, không trả trước qua OTA** (không còn ở đơn OTA đã trả, khách đang ở, sau đó). "Còn phải thu" một dòng – đã sửa ở BUG-R2-103 (đợt 18). Câu "Mở được từ 23:00…" đặt cạnh nút "Đánh dấu không đến" ở chân khung, không ở đầu. Phần hướng dẫn KB5 thuộc UXR | `ReservationDrawer.tsx` |
| **P-18** (2) | Bảng minibar bớt một cột: "Chuẩn" gộp vào ô "Còn lại / chuẩn" (nút tăng giảm + "/ 2"); món miễn phí cột tiền ghi 0 (tên món đã ghi "Miễn phí") → cột Tiền không còn bị cắt ở 1366×768. Chưa đo lại trên trình duyệt (jsdom không dàn trang) – nhờ UXR/QA xem lại ảnh 1366 | `CheckOutPage.tsx` |
| **P-19** (2) | Cột Lý do của Nhật ký thao tác tiền hiện câu VI/EN: câu hệ thống tiếng Anh của máy chủ ("FOC on the current line…", "B12 – night sold again…", "checked out (B18)"…), mã hủy/đổi căn/FOC, mã hệ thống (`hold_expired`, `no_show`, `focCancelReason`…). Dòng "Gửi yêu cầu duyệt" hiện lý do lễ tân chọn (+ ghi chú). Lý do người dùng gõ giữ nguyên. Gộp BUG-R2-100 | `app/auditReason.ts` (mới), `MoneyPage.tsx` |
| **P-23** (2) | Chờ đối soát: câu đầu trang nói đúng nội dung (chuyển khoản/VietQR đối chiếu sao kê + tiền mặt sale nộp quầy); "Đã khớp sao kê" mở hộp xác nhận ("Đã thấy {số} của {mã} trong sao kê?" – không hoàn tác được). Không có lệnh bỏ đối soát ở máy chủ nên không có nút hoàn tác | `MoneyPage.tsx` |
| **P-26** (1) | Câu "…bật 'Khách nhận sớm' ở bước 4" → "…ở trên"; hộp xác nhận nhận phòng thêm dòng "Gửi kèm yêu cầu miễn {số} – chờ duyệt" khi có xin miễn phụ thu | `CheckInPage.tsx`, `gen_strings.py` |
| **P-32** (1) | Một kiểu dấu trừ: số âm trên folio (miễn phí, đảo, phụ thu dự tính) in "−" (U+2212) như dòng Đã thu – hàm `signed()`; dùng ở H16, bill, Folio, drawer, dòng dịch vụ, H13 | `app/folio.ts` + các màn trên |
| **P-34** (1) | `co.late_switch_hint`, `co.late_switch_hint_time`: "drawer đơn" → "khung chi tiết đơn" (EN "booking details") | `gen_strings.py` |
| **S4-13 hướng B** | H09 không có ô tải ảnh cho khoản thu ban đầu (không cần bỏ). Thêm ô "Mã giao dịch / ghi chú" gửi `initialPayment.note` + gợi ý; câu nhắc gắn ảnh sau khi tạo đơn: FD+ "Giữ chỗ đến …" rồi xác nhận cọc kèm ảnh; SAL/CTV "Báo đã chuyển cọc". `BookingDialog.tsx` không thuộc vùng FE-B | `BookingDialog.tsx` |

- **Chuỗi**: 25 khóa mới + sửa chữ 3 khóa (`ci.time_default_help`, `co.late_switch_hint`, `co.late_switch_hint_time`) – nhóm "FE-A đợt 20", **chờ UXD duyệt**.
- **Cần BE (ORC chuyển)**: P-19 – máy chủ nên ghi **mã** lý do cho mọi bước hệ thống (hiện còn câu tiếng Anh trong `folio.service.ts` 2045/2373/2878/2905, `checkout`…); Desk đang ánh xạ theo câu, đổi câu là mất ánh xạ (rơi về hiện nguyên văn).
- Không đụng màn FE-B đang sửa (H24, Cần duyệt, Tham số, Khai báo).
- Kiểm thử: `s4-uxr-fea.test.tsx` (mới, 6 ca: P-19, P-23, P-18, P-32, P-34, S4-13); sửa ca "Cơ sở phí hủy" (`s4-38-fea`) sang đơn trực tiếp + ca P-17 (OTA trả trước, đang ở – không hiện); chỉ số ô minibar trong `s4-144-fea`. admin-web **375/375**, `tsc` xanh, eslint/prettier xanh trên mọi tệp FE-A. Cây hiện có 1 lỗi eslint (`components/AppShell.tsx:49` biến `session` không dùng) và 1 cảnh báo prettier (`app/approvalTarget.ts`) – tệp FE-B đang sửa, không phải của FE-A.

---

## Phần FE-A – đợt 21: BUG-R2-194, BUG-R2-179 (P2 – QA) (18/10/2026, sau gộp #15 `8073a3d`)

- **BUG-R2-194** (`CheckInPage.tsx`): trước 06:00 (B9a) số tiền Desk nêu và gửi là **tiền đêm** `priorNight.defaultRateVnd` (phụ thu `earlyCheckinSurcharge.amountVnd` = 0 ở đường này) → câu "Khách nhận trước 06:00 – thêm đêm …" hiện đúng số, ô "Đã báo khách" hiện lại, `expectedSurchargeVnd` = tiền đêm (khớp kiểm `SURCHARGE_CHANGED` của máy chủ). Mock làm như máy chủ: B9a phụ thu 0, tiền đêm ở `priorNight.defaultRateVnd`, B9 ghi dòng đêm (`prior_night`), thiếu/lệch `expectedSurchargeVnd` → 422/409.
- **BUG-R2-179** (`GuestFormDialog.tsx`, H06 – không thuộc màn FE-B đang sửa): hồ sơ khách hiện **"Giấy tờ (4 số cuối)" `…7890`** khi API trả `idDocLast4` (chỉ khi khách đã đồng ý P05), kèm câu gợi ý số đầy đủ chỉ ở màn khai báo.
- Gỡ cả hai mã khỏi `OPEN` (`tests/e2e/support/known-bugs.ts`) – TC-L3-085, TC-RB-008 phải đạt.
- Chuỗi: `crm.f_id_doc`, `crm.f_id_doc_help` – nhóm "FE-A đợt 21", chờ UXD duyệt.
- Kiểm thử: `s4-p2-fea.test.tsx` (mới, 2 ca; ca 194 đỏ khi bỏ bản sửa). admin-web **444/444**, `tsc` (admin-web, tests), eslint, prettier xanh.

---

## Phần FE-B (Desk – vận hành, thương hiệu) – đợt 1: mục 1–4 (17/10/2026)

- Người làm: FE-B | Đầu vào: `sprint-4-plan.md` (ĐÓNG BĂNG D1) mục 4, 8.3 dòng FE-B, 11; DS **v0.4.1** mục 11 (B0–B6), `tokens.css`; Brand Guidelines (CLAUDE.md "Thương hiệu OTTIMO"); OpenAPI **0.3.7** (`getTonightKpi`, `getArrivalsDepartures`, `listAttentionItems`, `resolveAttentionEvent`, `streamEvents`, `checkOut.debt`, `createDepositNotice.attachmentId`, `uploadAttachment`, `getBill`); hi-fi H03, H24; spec EP01, EP03-05 4.4; dòng BE-D trong decision-log (luật lọc vai, đóng mục).
- Trạng thái: **mục 1–4 xong mã + unit test**; H03/H24 chạy trên MSW theo 0.3.7 (BE-D đang làm API đọc). Mục 5 (OOO + phiếu sửa, hàng yêu cầu khách, bảng việc buồng phòng, minibar) **chưa bắt đầu** – làm ở đợt sau. Không commit, không đụng stack demo.

### 1. Đã làm

#### 1.1 B0 + B1 trong cùng một bản build (S4-49, DS 11.6)
- **B0:** `@ottimo/ui` đã import `design/wireframes/assets/tokens.css` (bản v0.4.1: `--ink #2B2B28`, `--bar-cf #BEA174`, `--mono` "JetBrains Mono"…). Không cần sửa mã; bản build kế tiếp nhận màu mới. Có test khóa thứ tự import và giá trị v0.4.1.
- **B1 (a) font tự host:** cài `@fontsource/jetbrains-mono` **5.2.8** (ghim đúng, cùng bản Lora/Be Vietnam Pro) vào `@ottimo/ui` bằng pnpm; import 400 + 500 trong `packages/ui/src/styles/index.css`, ngay sau Be Vietnam Pro. `vite build` admin-web: 18 tệp `jetbrains-mono-*.woff(2)` nằm trong `dist/assets`, 0 URL font ra tên miền ngoài (SEC C-1). Bundle chính 479,5 KB (< 500 KB).
- **B1 (b) `.mono`:** chỉ **giá trị** dùng JetBrains Mono, câu quanh giữ font UI – helper `app/mono.tsx` (`monoArgs(t, key, args, ['code'])`, `<Code>`), FE-A cũng đang dùng. Đã áp:
  - mã đơn: đầu drawer H11, tiêu đề phụ H13/H16, dòng Hôm nay/Tổng quan, Cần duyệt;
  - số phiếu: câu "Phiếu … đã cấp" sau trả phòng (`co.done_tasks`), bill (đã có);
  - mã hồ sơ khai báo: `reg2.sent_note` (H14);
  - nội dung chuyển khoản VietQR: `PaymentPanel` đã có `.mono`; khối QR cọc mới của FE-A dùng `monoArgs`.
  - Wi-Fi: Desk không hiện Wi-Fi; phần G5 (guest-web 16px) thuộc MOB.
- **B1 (c) KB7 – S4-48 (BUG-R2-088):** H16 bước 2 lý do khóa "Tiếp tục" = `co.go_bill_needs_told`; bước 3 `whyLocked` = `checkout.complete_needs_told`; gợi ý "Trả muộn ở drawer" = `co.late_switch_hint_time` với `{time}` = giờ trả chuẩn từ `BookingRules` (thay `co.late_switch_hint` viết cứng 12:00). Sửa theo: `checkout.test.tsx`, `s3-review.test.tsx` và **1 dòng** `tests/e2e/ui-clock/checkout.h16.spec.ts` (dòng 214 – QA xem lại).
- **Chip `ink`/`long`** thêm vào kiểu `tone` của `Chip` (DS 2.3, B0b); màn mới dùng `ink` + icon. Đổi các chip `info` cũ sang `ink` (B0b) làm khi chạm từng tệp – bí danh CSS đã cho kết quả đúng.

#### 1.2 S4-26 – "Ghi công nợ" ở H16 bước 3 (US-038 AC3, BR-525, A19)
- Chỉ OWN/MGR, chỉ khi còn phải thu > 0: công tắc "Ghi công nợ – khách trả sau" → hạn thanh toán (≥ hôm nay theo múi giờ cơ sở) + lý do (≥ 3 ký tự).
- Nút chính đổi thành "Ghi công nợ {số} – hoàn tất"; thiếu/sai thì khóa kèm lý do `co.debt_needs` (aria-describedby). Hộp xác nhận thêm dòng "Ghi công nợ {số}, hạn {ngày}…". Gửi `checkOut.debt {dueDate, reason}`; lỗi trường của server hiện tại ô.
- FD/FDL không thấy lựa chọn (server cũng trả 403). Mock: kiểm `debt` bắt buộc + ghi nhật ký `reservation.debt_on_checkout`.

#### 1.3 S4-29 – "Xem Phiếu thanh toán" cho đơn đã trả (US-020 AC2)
- Drawer đơn `checked_out` (FD+): nút "Xem Phiếu thanh toán" → `getBill` (chỉ đọc) → `BillDialog` có sẵn: số phiếu (mono), VI / Việt–Anh, in lại. Lỗi đọc hiện trong drawer.

#### 1.4 S4-30 – Ảnh biên nhận khi CTV "Báo đã chuyển cọc" (US-086 AC4)
- Hộp "Báo đã chuyển cọc" có ô ảnh (JPG/PNG/WebP, chụp bằng camera trên điện thoại) + câu hướng dẫn. Gửi: `uploadAttachment purpose=deposit_receipt` (kèm `reservationId`, khóa idempotency suy từ khóa của lần bấm) → `createDepositNotice {amountVnd, note, attachmentId}`. Ảnh chỉ trong bộ nhớ.
- **BUG-R2-081 (lễ tân thấy số tiền, giờ, ghi chú, ảnh CTV đã báo trong hộp "Xác nhận cọc") – BỊ CHẶN bởi hợp đồng:** 0.3.7 không có cách ĐỌC lại báo chuyển cọc (bảng `deposit_notice` có ở ERD, không có trường/operation trả về). Đề nghị ARC ở mục 5.

#### 1.5 `roomLabel()` – "401 · The Pine" (BR-012, DS 11.3 – B3)
- `@ottimo/i18n`: `roomLabel(room, 'staff' | 'guest', {disclosed, fallback})`, `roomMatches` (gõ "401", "pine", "The Pine", "the pi" đều ra), `compareRoomNo`. Không chứa chữ giao diện: biến thể khách nhận `fallback` từ chuỗi UXD `gw.room_fallback` (chưa có trong `gen_strings.py` – UXD/MOB thêm ở B4). **Một helper cho Desk và MOB** – MOB dùng lại, không viết riêng.
- Desk: `app/rooms.ts` `useStaffRoomLabel` tra tên từ `listRooms` (seed DS-E = ánh xạ tạm BL 4.1). Đã áp: danh sách đơn, Hôm nay (số căn to + tên dưới), "Cần chú ý" ("Căn 401 · The Pine đang khóa…"). Rack và drawer đã có tên từ trước. Bảng của INV 19/10 chỉ là sửa danh mục căn (H04), không sửa mã.

#### 1.6 H03 Hôm nay + H24 Tổng quan + "Cần chú ý" + SSE (US-010, US-011, US-012, US-031/S4-31, US-136 AC2)
- **Dữ liệu (`pages/dashboard/useDashboard.ts`):** mỗi khối đọc riêng (KPI, khách đến/đi, Cần chú ý, Cần duyệt) – một khối lỗi không làm mất khối khác (H24 24.1). "Hôm nay/đêm nay" lấy `businessDate` của API (BR-010).
- **SSE (`app/live.ts` `useLiveEvents`):** nghe 8 loại sự kiện 0.3.7; gộp 1 giây; chỉ đọc lại khối bị chạm (`attention.changed` → Cần chú ý; `reservation.changed` → KPI, đến/đi, Cần chú ý, Cần duyệt…); rớt rồi nối lại → đọc lại tất cả; chưa từng nối được → hỏi lại 30 giây (giữ BUG-R2-029). "Cần chú ý" tự đọc lại mỗi 60 giây (mục có hạn theo giờ). `useLiveReload` cũ dựng trên hàm mới, các màn khác không đổi.
- **H03 (FD/FDL):** 4 ô KPI (đang ở; khách đến + "n đã nhận phòng"; khách đi + "n đã trả phòng"; công suất 1 chữ số thập phân "66,7%", `null` → "–", chú thích mẫu số, "+ n căn đang giữ chỗ (chưa tính)", "+ n đơn OTA chưa gán căn" → rack). Cột trái "Cần chú ý" + số đếm; cột phải: Khách đến (chưa nhận trước, chưa gán căn đầu, theo giờ đến; chip khai báo; "Còn phải thu"; nút Nhận phòng theo `allowedActions` – máy chưa cấp quyền thì khóa kèm lý do), Khách đi = thẻ "khách trả phòng hôm nay" S4-31 (cùng căn có khách đến lên đầu, rồi Quá giờ > Gọi xác nhận > Chờ trả lời > Đã trả lời; chip trạng thái nhắc có chữ; nút Trả phòng), Giữ chỗ chưa cọc đến hôm nay (đếm ngược). Rỗng cả ba khối + không có mục chú ý → `today.empty_*`. Mất mạng: nút ghi khóa (`rsv.need_online`).
- **H24 (OWN/MGR, nav "Tổng quan" bật):** Cần duyệt (bấm mở H17, không duyệt một chạm) → Cần chú ý (cả dòng là liên kết) → Đêm nay (công suất rộng, "Khách đến / đi", đang ở, chú thích `ov.kpi_note`). Chấm trạng thái luôn có chữ: Trực tiếp / Đang kết nối lại · tự tải lại mỗi 30 giây / Ngoại tuyến (vòng rỗng). Mục mới sau sự kiện: chip "Mới", sáng nền 2 giây (tắt khi giảm chuyển động), đọc một lần `ov.sse_new_announce` (polite, không cướp focus).
- **"Cần chú ý" (`app/attention.ts`):** một câu cho **mọi 28 `kind` của 0.3.7** (kind lạ vẫn hiện bằng câu chung), tham số chỉ là mã/số căn/số đếm/giờ (`visa_expiring` chỉ mã đơn – SR-RET-06), mở đúng màn xử lý. Mục `event` có "Đã xử lý" (`ota_no_show_report`: "Đã báo kênh") → hộp ghi chú (bắt buộc với mục critical) → `resolveAttentionEvent`; mục tự đóng (`overbooking`, `unassigned_with_free_room`, `closed_reservation_credit`) và mục chỉ OWN đóng không có nút với vai khác. FOC vượt ngưỡng gắn chip "Chỉ chủ đầu tư thấy".
- **Mock EP01 (`mocks/dashboard.ts`):** KPI/đến-đi/Cần chú ý **tính** từ mock đơn + khối OOO (ví dụ DS-0: 6/9 = 66,7%), lọc vai theo dòng BE-D (FD không nhận `foc_threshold`, `reconcile_overdue`), luật đóng mục như BE-D (409 cho mục tự đóng, critical cần ghi chú). Đăng ký trước `stay.ts`; mục giấy tờ chờ gắn người (S4-39) lấy qua `stay.registrationAttention()` (tách hàm, không đổi hành vi).

#### 1.7 Chuỗi
- 41 khóa mới, nhóm riêng "R2 Sprint 4 – FE-B vận hành… (chờ UXD duyệt)" ngay sau nhóm FE-A trong `gen_strings.py`: `co.debt_*`, `co.complete_debt`, `rsv.receipt_*`, `today.*` (rỗng từng khối, ghi chú KPI, cùng căn có khách đến, gán căn trước, còn phải thu, `today.dep_replied`), `attn.*` cho 9 kind 0.3.7 chưa có câu + `attn.other`, `attn.resolve*`, `attn.reported_channel`, `ov.approvals_*`, `ov.kpi_error`. Đã chạy `gen_strings.py` (0 khóa trùng).

### 2. Kiểm thử

| Kiểm | Kết quả (17/10 tối, cây làm việc chung) |
|---|---|
| admin-web vitest | **30 tệp, 265/265 đạt** (gồm FE-A, lần chạy cuối). Mới của FE-B: `s4-feb-desk.test.tsx` 7 ca (S4-26 MGR/FD, S4-29, S4-30 có/không ảnh, roomLabel danh sách, mono drawer, gợi ý KB7 theo giờ chuẩn), `s4-feb-dashboard.test.tsx` 41 ca (KPI 66,7%; đến/đi + nút theo `allowedActions`; Cần chú ý theo vai; đóng mục critical có ghi chú; US-136 AC2 "Đã báo kênh"; KPI lỗi không làm mất khối khác; Tổng quan OWN/MGR; mục mới "Mới" + thông báo, không cướp focus; FD không mở được Tổng quan; 28 kind không lộ khóa thô; `useLiveEvents` gộp loại + nối lại đọc tất cả). Sửa ca cũ: `checkout`, `s3-review` (KB7), `nav` (Hôm nay nay có dữ liệu) |
| `@ottimo/ui` | 13/13 (mới `styles.test.ts` 3 ca: token v0.4.1, JetBrains Mono 400/500 sau Be Vietnam Pro + ghim bản, mọi `url()` font là tệp trong gói) |
| `@ottimo/i18n` | 19/19 (mới `roomLabel.test.ts` 15 ca) |
| `@ottimo/api-client` | 23/23 (mới 2 ca: `getTonightKpi`/`getArrivalsDepartures` đọc thuần, `resolveAttentionEvent` có Idempotency-Key không If-Match) |
| guest-web | 50/50 (không đổi, kiểm vì dùng chung ui/i18n) |
| `tsc` admin-web, ui, i18n, api-client, guest-web | 0 lỗi |
| eslint (admin-web, packages) · prettier (admin-web, packages) | 0 lỗi · xanh |
| axe-core 4.14 chạy tạm trong jsdom (bỏ tương phản màu) | H03, H24, H16 bước 3 có ghi công nợ, hộp báo chuyển cọc, phiếu thanh toán từ drawer: **0 vi phạm** (tệp chạy tạm đã xóa; CI `a11y.axe.spec.ts` vẫn là nguồn chính thức) |
| Toàn repo | `eslint .` đỏ ở vùng khác đang làm dở: `apps/mobile` (ReportPage, QueueProvider), `services/api` (checkin.service, move-pricing.test), `apps/landing-web/.astro`; `turbo typecheck` 12/13 (đỏ `@ottimo/landing-web`). Không thuộc FE-B |

**QA sau bước B0 + B1 (theo kế hoạch):** chụp so sánh H08 rack, H11, H16, H18 + axe 7 luồng trên bản build có font. Lưu ý: e2e chạy với API thật – trước khi BE-D gộp API đọc, H03 hiện khối lỗi "Chưa tải được…" (đúng thiết kế, có nút Thử lại).

### 3. File đã tạo / sửa (FE-B)
Tạo mới:
- `product/apps/admin-web/src/app/mono.tsx`, `app/rooms.ts`, `app/attention.ts`
- `product/apps/admin-web/src/pages/OverviewPage.tsx`, `pages/dashboard/useDashboard.ts`, `pages/dashboard/parts.tsx`
- `product/apps/admin-web/src/mocks/dashboard.ts`
- `product/apps/admin-web/src/__tests__/s4-feb-desk.test.tsx`, `__tests__/s4-feb-dashboard.test.tsx`
- `product/packages/i18n/src/roomLabel.ts`, `roomLabel.test.ts`
- `product/packages/ui/src/styles.test.ts`

Sửa:
- `product/packages/ui/package.json`, `product/pnpm-lock.yaml` (+ `@fontsource/jetbrains-mono` 5.2.8), `packages/ui/src/styles/index.css`, `packages/ui/src/Feedback.tsx` (tone `ink`, `long`)
- `product/packages/i18n/src/index.ts`; `product/packages/api-client/src/endpoints.ts`, `types.ts`, `endpoints.test.ts` (khối "dashboard" riêng)
- `product/apps/admin-web/src/pages/TodayPage.tsx` (viết lại), `app/live.ts`, `app/routes.tsx`, `session/nav.ts` (Tổng quan `ready`)
- `product/apps/admin-web/src/pages/stay/CheckOutPage.tsx` (KB7, S4-26, mono), `pages/stay/CheckInPage.tsx` (1 dòng mono), `pages/reservations/ReservationDrawer.tsx` (S4-29, mono), `pages/reservations/ReservationDialogs.tsx` (chỉ `DepositNoticeDialog` – S4-30), `pages/reservations/ReservationsPage.tsx` (roomLabel), `pages/registration/RegistrationPage.tsx` (mono mã hồ sơ)
- Mock dùng chung (đọc lại trước khi sửa, sửa nhỏ): `mocks/handlers.ts` (đăng ký EP01), `mocks/stay.ts` (kiểm `debt` + nhật ký; tách `registrationAttention()`), `mocks/reservations.ts` (báo chuyển cọc giữ `note`, `attachmentId`)
- Test cũ: `__tests__/checkout.test.tsx`, `s3-review.test.tsx`, `nav.test.tsx`; `product/tests/e2e/ui-clock/checkout.h16.spec.ts` (1 dòng)
- `product/design/tools/gen_strings.py` (nhóm FE-B) → sinh lại `design/copy/strings-*.json`, `strings-tables.md`, `wireframes/assets/strings.js`
- `product/apps/admin-web/README.md`; `01-decisions/decision-log.md` (2 dòng FE-B)

### 4. Giả định
- `[GIẢ ĐỊNH FE-B – PO xác nhận]` Ảnh biên nhận ở "Báo đã chuyển cọc" **không bắt buộc** (hợp đồng không bắt buộc `attachmentId`); có câu hướng dẫn nên gửi ảnh. Bắt buộc thì chỉ đổi điều kiện nút (decision-log).
- `[GIẢ ĐỊNH FE-B – BE-D xác nhận]` Mục `room_ooo`: ngày mở bán lại đọc `params.endDate`, không có thì phần ngày của `dueAt`; số căn đọc `params.roomNo` hoặc `roomNos[0]`. `registration_due`: `dueAt` = hạn sớm nhất, `roomNos` = các căn (hiện dưới câu). Nếu BE-D trả khác thì chỉ sửa `app/attention.ts`.
- `[GIẢ ĐỊNH FE-B]` Khách đi `replied`: `ReservationSummary` không có giờ đã hẹn → chip "Đã trả lời" (chuỗi mới `today.dep_replied`), không dùng `stay.card_answered` (cần `{time}`).
- `[GIẢ ĐỊNH FE-B]` Tổng quan chỉ OWN/MGR như menu hiện có (FDL/FD mở Hôm nay). Bản rút gọn H24 24.2 cho FDL/FD chưa làm.
- `[GIẢ ĐỊNH – chờ INV 19/10]` Tên phòng theo ánh xạ tạm BL 4.1 trong seed (P-S4-8).
- `[GIẢ ĐỊNH FE-B – UXD duyệt]` 41 chuỗi mới FE viết theo content guide; Hôm nay/Tổng quan theo hi-fi H03/H24 và lớp sẵn có của `hifi.css` (không thêm CSS).

### 5. Rủi ro / vướng mắc – việc cần vai khác
| Gửi | Nội dung |
|---|---|
| **ARC** (chặn BUG-R2-081, phần thứ hai của S4-30) | Hợp đồng chưa có cách ĐỌC báo chuyển cọc. Đề xuất (contract-ahead nếu sau đóng băng): `Reservation.depositNotices[]` cho FD+/SAL (`own`) – `{id, amountVnd, note, attachmentId, createdAt, createdByName, status: open\|handled}` (chỉ bản `open`), ảnh xem bằng `getAttachment` đã có (`deposit_receipt` – FD+). Desk sẽ hiện trong hộp "Xác nhận cọc" (H11). Thay đổi thêm trường, không gãy client cũ |
| ARC | `Bill` không có thời điểm chốt: `BillDialog` in "Lập lúc {giờ hiện tại}" – sai khi in lại phiếu cũ (S4-29). Đề xuất `Bill.settledAt` (folio `settled`) |
| BE-D | Đối chiếu `mocks/dashboard.ts` (tham số từng `kind`, `allowedActions` của khách đến/đi, mốc `reminderState`) khi viết test hợp đồng; khác thì báo FE-B |
| QA | (1) Chụp so sánh + axe sau B0 + B1 như kế hoạch; (2) dòng 214 `ui-clock/checkout.h16.spec.ts` đã đổi sang `co.go_bill_needs_told` – gắn mã TC KB7 (S4-48); (3) ca UI cho H03/H24, S4-26, S4-29, S4-30 trên stack QA |
| UXD | Duyệt nhóm chuỗi FE-B; thêm `gw.room_fallback`/`gw.room_label` (DS 11.2.2) để `roomLabel` phía khách dùng; BE-D trả 2 dòng `foc_threshold` (`params.check` = `foc_pct_of_room_revenue` {pct, threshold} / `foc_count_per_approver` {count, max}) – Desk đang dùng chung câu `attn.foc_threshold`, đề nghị 2 câu riêng (EP01 3.3 `today.foc_alert_pct`, `today.foc_alert_count`) |
| MOB | `roomLabel`/`roomMatches` đã ở `@ottimo/i18n` – PWA/guest-web dùng chung, không viết riêng |
| FE-A | `PaymentPanel` để nguyên câu `pay.qr_note` bọc `.mono` cả câu – khi gộp `VietQrCard` thì dùng `monoArgs` cho riêng nội dung CK |

### 6. Việc chưa xong (đợt sau, theo thứ tự giao)
1. **Mục 5:** form khối OOO + phiếu sửa trên Desk (US-019, 061, 062, US-135 hộp xác nhận `done`); hàng yêu cầu khách (US-110) – kèm khối "Yêu cầu của khách" ở H03; bảng việc buồng phòng cho lễ tân (US-054 AC3); danh mục minibar (US-066, US-003 AC2).
2. Phần còn lại của B3/S4-52 trên Desk: ô chọn/tìm căn theo tên (`roomMatches`), H04 nhập `publicRoomType`, tiêu đề H13/H16 "401 · The Pine", nút "Đã báo căn cho khách" (`roomDisclosedToGuest`), chuông thông báo hiện 3 loại mới (`approval_cancelled`, `no_show_marked`, `no_show_restored`).
3. BUG-R2-081 khi ARC thêm trường đọc (mục 5).
4. B0b dọn chip `info` → `ink` khi chạm tệp; B5 (mẫu tin, bill song ngữ EN trên – VI dưới) tuần 2; B6 logo khi INV gửi SVG.
5. US-003 AC2/AC4 kiểm trên API thật khi BE-D/BE-B giao; Should R2 (US-137, US-013, `swapRoom`) chỉ khi còn chỗ.

---

## Phần FE-B – đợt 2: mục 5 (17/10/2026)

- Người làm: FE-B | Đầu vào: giao việc ORC (mục 5; BUG-081 chờ hợp đồng; bản rút gọn H24 cho FDL/FD để sau); spec EP07-08 §3, §6, EP14 §4; backlog US-019, US-054, US-061, US-062, US-066, US-110, US-135, US-003 AC2; OpenAPI 0.3.7 (`listRoomStatuses`, `listHkTasks`, `createHkTask`, `transitionHkTask`, `listWorkOrders`, `createWorkOrder`, `getWorkOrder`, `updateWorkOrder`, `transitionWorkOrder`, `listRoomBlocks`, `createRoomBlock`, `updateRoomBlock`, `transitionRoomBlock`, `listGuestRequests`, `transitionGuestRequest`, `listItems`, `createItem`, `updateItem`); hi-fi H19, H22, H23 (bản Desk dựng theo cùng chuỗi và lớp `hifi.css`).
- Trạng thái: **mục 5 có mã và unit test trên MSW theo 0.3.7** (BE-C/BE-D/BE-B đang làm API). Không commit, không đụng stack demo.

### 1. Đã làm
- **S10 Buồng phòng – Desk (US-054 AC3, AC1; US-052)** `/housekeeping`:
  - việc hôm nay theo thứ tự BR-807 của server, bộ đếm "x/y xong" (`summary`);
  - mỗi việc: căn số + tên, loại việc, trạng thái có chữ, chip "App khách", "Từ hôm trước", "Thay ga gối", hạn giờ, ghi chú khách, bổ sung minibar, lý do hủy;
  - FD+: "Đã làm xong", "Hủy việc" (chọn lý do; "Khác" bắt buộc ghi chú), "Việc mới" (4 loại được tạo tay, từ hôm nay);
  - khối 10 căn có lọc kèm số đếm (Tất cả / Cần dọn / Có khách / Sạch / Đang sửa), trạng thái `status.room.*`, "Kiểm chưa đạt", khách đến hôm nay/kế tiếp, số việc mở;
  - SSE `hk_task.changed` / `room.status_changed` → đọc lại. Trả phòng xong → "Dọn trả phòng" có ngay trong danh sách (AC1).
- **S11 Bảo trì – Desk (US-061, US-062, US-135)** `/maintenance`:
  - danh sách phiếu: lọc Đang mở / Gấp / Chờ vật tư / Đã xong (kèm số đếm); quá hạn lên đầu, rồi theo mức, rồi theo hạn; cột hạn "Nhận việc trước… / Quá hạn… / Hạn tạm dừng…"; chip "Khách báo qua app", "Đề nghị khóa", "Đang khóa – mở bán lại…";
  - drawer phiếu: mô tả, người báo, người xử lý, khối khóa, gợi ý phương án khi quá hạn (`remedySuggested` – AC3), đổi mức (If-Match), nhật ký (AC2 – người, lúc, cũ → mới), **chỉ nút server cho phép** (`allowedActions`): Nhận việc, Chờ vật tư (vật tư + ngày, bắt buộc với Trong ngày/Không gấp), Sửa tiếp, Sửa xong (kết quả + ảnh sau sửa, bắt buộc với Gấp/Trong ngày), Hủy (lý do; nêu việc mở bán lại nếu có khóa), Mở lại (ghi chú), "Khóa phòng theo đề nghị";
  - **"Sửa xong" khi có khóa → hộp xác nhận nêu hậu quả** (mở bán lại mọi kênh, căn "Cần dọn", việc "Dọn sau sửa chữa"), focus ở nút an toàn (US-135, US-062 AC1);
  - **tạo phiếu (US-061)**: căn, tiêu đề, mô tả bắt buộc (AC4), loại sự cố → mức gợi ý BR-809 theo căn có/không khách (đổi được), ảnh, công tắc "Khóa căn" + "Khóa từ" + "Dự kiến xong" + lý do (điền sẵn bằng tiêu đề). Sau khi lưu, toast nêu "Căn khóa đêm … – …, mở bán lại từ …" theo ngày server tính (AC1);
  - 409: có khách đang ở → không khóa, hiện mã đơn + "Tạo phiếu không khóa" (AC3); trùng đơn tương lai → danh sách đơn kèm link mở từng đơn, **không có đường "lưu vẫn khóa"** (AC2, ARC A-03); trùng khóa khác → hướng dẫn sang tab Khóa phòng.
- **Khóa phòng có kế hoạch (US-019)**, tab "Khóa phòng":
  - danh sách khối (30 ngày qua → 4 tháng tới): căn, trạng thái, khóa đêm, mở bán lại từ, lý do, phiếu;
  - "Khóa phòng có kế hoạch" dùng cùng form và cùng cách xử lý 409;
  - "Đổi ngày mở bán" (If-Match; kéo dài thì kiểm trùng);
  - "Hủy khóa" (khối chưa bắt đầu) và "Mở khóa sớm" (chỉ MGR+, khối không còn phiếu mở). Cả hai qua hộp xác nhận có hậu quả + lý do;
  - khối mới chặn ngay rack, đặt phòng và KPI (dùng chung dữ liệu mock EP02).
- **Hàng yêu cầu khách trên H03 (US-110, S30)**:
  - khối "Yêu cầu của khách (n)" ở cột phải Hôm nay, gồm mọi bộ phận;
  - sắp xếp: quá hạn nhận lên đầu (chip "Quá hạn nhận"), rồi cũ trước;
  - mỗi dòng: căn, loại, lời khách, giờ gửi, "Chuyển: Buồng phòng / Bảo trì / Lễ tân", phí (nếu có), link sang việc hoặc phiếu;
  - nút: "Đã nhận"; "Xong" (chỉ yêu cầu chuyển lễ tân – yêu cầu HK/MT tự xong theo việc hoặc phiếu); "Không thực hiện được" (lý do khách thấy + lời nhắn, bắt buộc khi "Khác", có nhắc không ghi mã cửa/giấy tờ/SĐT – server chặn chuỗi số);
  - SSE `guest_request.changed`. "Cần chú ý" có thêm `guest_request_overdue` và `work_order_high_open` (từ mock).
- **Danh mục minibar (US-066, US-003 AC2)** `/settings/minibar` (menu mới "Minibar", S13):
  - OWN/MGR: thêm/sửa mặt hàng (mã, tên VI/EN, đơn vị, giá bán hoặc "Miễn phí – vẫn ghi tiêu hao", giá vốn, mức chuẩn mỗi tủ, tồn tối thiểu, đang dùng);
  - câu "giá mới áp cho lần kiểm sau, dòng folio cũ giữ nguyên" (AC2);
  - FD/FDL/HK: chỉ đọc, không có cột giá vốn (AC3, US-003 AC2). Mock dùng chung danh mục với bước minibar khi trả phòng, nên giá mới có hiệu lực ngay ở lần kiểm sau.
- **api-client:** thêm 18 hàm EP07/EP08/EP14/EP09 (khối riêng "Sprint 4 FE-B"), kiểu tương ứng; `AttachmentPurpose` thêm `work_order`, `inspection`.
- **Chuỗi:** nhóm mới "R2 Sprint 4 – FE-B Desk…" (127 khóa: `hk.desk.*`, `hk.task.carried_over`, `wo.*` còn thiếu, `ooo.*`, `req.desk.*`, `mb.*`, `nav.minibar`) – tái dùng tối đa `hk.*`, `wo.*`, `guest.req.*` sẵn có. Chờ UXD duyệt.
- **Bundle:** H03 chuyển sang tải theo route → bundle đầu **469 KB** (< 500 KB). Lúc chưa chuyển, bundle đầu là 506 KB.

### 2. Kiểm thử (đợt 2)
| Kiểm | Kết quả (17/10 tối) |
|---|---|
| admin-web vitest | **31 tệp, 289/289 đạt** (gồm FE-A). Mới: `s4-feb-ops.test.tsx` **16 ca** (S10: bộ đếm cập nhật khi tick xong, việc khách có chip + ghi chú, trả phòng → "Dọn trả phòng", hủy "Khác" cần ghi chú, tạo việc tay; S11: phiếu + khóa lưu nửa mở `[hôm nay, xong + 1)`, thiếu mô tả không lưu, có khách → không khóa + "Tạo phiếu không khóa", trùng đơn → danh sách + link, "Sửa xong" có khóa → hộp hậu quả focus nút an toàn → buồng `VD` + việc dọn + khối kết thúc, Nhận việc → Chờ vật tư cần ngày (mức TB), khóa theo đề nghị xóa cờ; khóa có kế hoạch → hủy có lý do; H03 yêu cầu: quá hạn đầu, Đã nhận, từ chối "Khác" cần lời nhắn, chuỗi số bị chặn; S13: OWN sửa giá → lần kiểm sau dùng giá mới, thêm hàng miễn phí; FD chỉ đọc, không giá vốn; mọi khóa chuỗi của bảng nhãn có VI + EN). Sửa ca `nav.test` (menu không còn màn "đang làm") |
| api-client | 28/28 (mới 3 ca: `transitionWorkOrder` If-Match + khóa; `updateRoomBlock`/`transitionRoomBlock`; đọc HK/yêu cầu/minibar) |
| i18n · ui · guest-web | 19/19 · 13/13 · 61/61 |
| `tsc` admin-web · eslint + prettier (admin-web, packages) | 0 lỗi · xanh |
| axe-core 4.14 tạm trong jsdom (bỏ tương phản) | S10, S11 drawer, S11 tạo phiếu + khóa, S11 tab Khóa phòng, H03 hàng yêu cầu, S13: **0 vi phạm** |
| `vite build` admin-web | bundle đầu 469 KB; trang mới tải theo route (S10 8,9 KB, S11 25,9 KB, S13 5,5 KB, H03 23,3 KB) |

### 3. File đã tạo / sửa (đợt 2)
Tạo mới:
- `product/apps/admin-web/src/pages/ops/{opsLabels.ts, HousekeepingPage.tsx, MaintenancePage.tsx, WorkOrderDrawer.tsx, WorkOrderForms.tsx, GuestRequests.tsx}`
- `product/apps/admin-web/src/pages/MinibarPage.tsx`
- `product/apps/admin-web/src/mocks/ops.ts`
- `product/apps/admin-web/src/__tests__/s4-feb-ops.test.tsx`

Sửa:
- `product/packages/api-client/src/{endpoints.ts, types.ts, endpoints.test.ts}` (khối riêng)
- `product/apps/admin-web/src/app/routes.tsx` (S10, S11, S13; H03 tải theo route), `session/nav.ts` (Buồng phòng, Bảo trì `ready`; mục Minibar)
- `product/apps/admin-web/src/pages/TodayPage.tsx` (khối yêu cầu khách), `pages/dashboard/useDashboard.ts` (khối `requests` + SSE)
- Mock dùng chung (đọc lại trước khi sửa, sửa nhỏ): `mocks/handlers.ts` (đăng ký ops; "Cần chú ý" lấy thêm mục của ops), `mocks/stay.ts` (chỉ `export` danh mục `MINIBAR`)
- `product/apps/admin-web/src/__tests__/nav.test.tsx`
- `product/design/tools/gen_strings.py` (nhóm FE-B đợt 2) → sinh lại `copy/strings-*.json`, `strings-tables.md`, `wireframes/assets/strings.js`
- `product/apps/admin-web/README.md`; `01-decisions/decision-log.md` (1 dòng FE-B đợt 2)

### 4. Giả định (đợt 2)
- `[GIẢ ĐỊNH FE-B – ARC xác nhận]` Desk **không tính trước** ngày mở bán lại (FD/MT không đọc `ooo_reopen_buffer_days`). Form có câu giải thích; ngày do server tính hiện ngay khi lưu (toast + drawer + tab Khóa phòng). US-061 AC1 ("form hiện rõ cả hai ngày") **chỉ đạt sau khi lưu**. Muốn hiện trước khi lưu: đề nghị ARC thêm `BookingRules.oooReopenBufferDays` (FD đọc được).
- `[GIẢ ĐỊNH FE-B]` Hàng yêu cầu khách của lễ tân nằm ở H03 (hi-fi H03 có khối "Yêu cầu của khách"), không thêm menu S30. Nút "Xong" chỉ có cho yêu cầu chuyển lễ tân; yêu cầu HK/MT xong theo việc/phiếu (SM-15) để không lệch trạng thái.
- `[GIẢ ĐỊNH FE-B]` Hủy việc buồng phòng trên Desk dùng 3 lý do của HK (`guest_refused`, `dnd`, `other`) – hợp đồng chỉ có các mã này.
- `[GIẢ ĐỊNH FE-B]` Danh mục minibar: `listItems` không trả tên tiếng Anh nên khi sửa, ô "Tên tiếng Anh" để trống. Bỏ trống thì có thể xóa tên EN đang có ở server (tùy BE-B xử lý `name.en` vắng) – BE-B xác nhận.
- `[GIẢ ĐỊNH FE-B]` Đổi người xử lý phiếu (`assigneeUserId`) chưa có trên Desk: `listUsers` chỉ OWN gọi được, hợp đồng chưa có danh sách người có vai MT cho FD.

### 5. Rủi ro / vướng mắc – việc cần vai khác (đợt 2)
| Gửi | Nội dung |
|---|---|
| ARC | (1) `BookingRules.oooReopenBufferDays` (hoặc `dryRun` cho khối OOO) để form hiện ngày mở bán lại trước khi lưu – US-061 AC1. (2) Danh sách người xử lý cho FD (người có vai MT) để đổi người trên phiếu – US-062 AC2 phần "người xử lý". (3) `Item.nameI18n` (hoặc trả `name` đủ vi/en) để sửa mặt hàng không mất tên EN |
| BE-C, BE-D, BE-B | Đối chiếu `mocks/ops.ts` khi viết test hợp đồng: thứ tự kiểm 409 của khóa (có khách → khóa khác → đơn tương lai), `complete` phiếu có khóa (khối `released` từ ngày kế tiếp, buồng `VD`, `after_repair_clean`), `cancel` phiếu có khóa đang chạy (mở từ hôm nay), `transitionGuestRequest` chặn chuỗi ≥ 6 chữ số, minibar `costPriceVnd` chỉ OWN/MGR |
| QA | Ca UI trên stack QA cho S10, S11 (tạo phiếu + khóa, 409, Sửa xong có hộp xác nhận), khóa có kế hoạch, hàng yêu cầu H03, S13; nối vào A4 (sự cố → phiếu + OOO → chặn bán → đóng phiếu → `VD` → dọn) |
| UXD | Duyệt nhóm chuỗi FE-B đợt 2. Ghi nhận: `gen_strings.py` có khóa trùng `guest.oci.done_title` (dòng 382 và 2748 – bản G4 mới thắng; không phải của FE-B) |
| MOB | Nhãn Desk dùng chung `hk.*`, `wo.*` với PWA – đổi chữ PWA thì Desk đổi theo |

### 6. Việc chưa xong
1. Bản rút gọn H24 cho FDL/FD (ORC: để sau).
2. BUG-R2-081 khi ARC thêm `Reservation.depositNotices[]`; `Bill.settledAt` cho bản in lại (ORC đã chuyển ARC).
3. Phần còn lại của B3/S4-52: ô tìm căn theo tên (`roomMatches`) ở các ô chọn căn, H04 nhập `publicRoomType`, tiêu đề H13/H16 "401 · The Pine", nút "Đã báo căn cho khách", chuông 3 loại thông báo mới.
4. B0b (chip `info` → `ink`), B5, B6 (logo); Should R2 (US-137, US-013, `swapRoom`) nếu còn chỗ.
5. Chạy lại toàn bộ màn đợt 1 + đợt 2 với API thật khi BE-C/BE-D/BE-B gộp.

---

## Phần FE-B – đợt 3: theo 0.3.7 bổ sung 1 (17/10/2026 tối)

- Đầu vào: `outputs/ARC/openapi-0.3.7.md` mục 11; api-client đã sinh lại (ARC). Giao việc ORC (1)–(4); (5) bản rút gọn H24 cho FDL/FD **chưa làm** (ORC: nếu còn thời gian).

| # | Việc | Đã làm | Kiểm |
|---|---|---|---|
| 1 | **BUG-R2-081** – H11 "Xác nhận cọc" hiện báo chuyển cọc của CTV/sale | Thành phần mới `pages/reservations/DepositNotices.tsx`, chèn **một khối riêng** vào `DepositDialog` (dưới số cọc, trên khối QR của FE-A). Không đụng state/hàm/khối của FE-A; đã đọc lại tệp ngay trước khi sửa. Nội dung: bản `open` của `Reservation.depositNotices[]` gồm người báo, số tiền, giờ lần báo gần nhất (`updatedAt`), ghi chú, câu nhắc đối chiếu sao kê. Ảnh biên nhận chỉ tải khi bấm "Xem ảnh biên nhận" (`getAttachment` – thêm vào api-client), giữ bằng object URL và thu hồi khi ẩn hoặc đóng. Mock: `createDepositNotice` chỉ nhận đơn `hold` (khác → 409); mỗi đơn tối đa một bản `open`, báo lại = cập nhật; `getReservation` trả `depositNotices` (SAL/CTV không có `note`, `createdByName`); `GET …/attachments/:id` | `s4-feb-desk`: CTV báo kèm ảnh, rồi FD mở "Xác nhận cọc" thấy người báo, số tiền, ghi chú và mở được ảnh |
| 2 | `BillDialog` in giờ chốt | "Lập lúc" = `Bill.settledAt`; `null` (folio `open`) mới dùng giờ hiện tại. Mock trả `settledAt` (B18 ghi lúc chốt) | `s4-feb-desk`: in lại phiếu đã chốt hôm trước, giờ in ra là giờ chốt |
| 3 | `GuestRequest.roomNo` có thể `null` | `mocks/ops.ts` lọc `null` khi gom `roomNos`. Hàng yêu cầu trên H03 hiện chip "Chưa gán căn" (chuỗi mới `req.desk.no_room`, chờ UXD) | `tsc` admin-web: 0 lỗi ở phần FE-B |
| 4 | `room_ooo` chỉ có `count` + `roomNos` | Bỏ giả định `params.endDate`/`dueAt`. Câu mới `attn.room_ooo_rooms` "Căn đang khóa sửa chữa: {rooms}" (không có ngày), bấm mở Bảo trì › Khóa phòng – ngày mở bán xem ở đó. Mock gộp mọi căn khóa đêm nay thành một dòng. Thêm: `foc_threshold` có 2 câu theo `params.check` (`attn.foc_pct`, `attn.foc_count`); vắng `pct` thì dùng câu chung | `s4-feb-dashboard`: 1 ca mới (room_ooo không ngày, 2 câu FOC, khóa dòng khác nhau) + sửa ca H03 |

- **Chuỗi:** thêm 14 khóa vào nhóm FE-B đợt 2 (`attn.room_ooo_rooms`, `attn.foc_pct`, `attn.foc_count`, `req.desk.no_room`, `rsv.notice.*`). Chờ UXD duyệt.
- **Kết quả (cây làm việc chung, 17/10 tối):**
  - admin-web vitest: 31 tệp, **293/293**;
  - api-client: 28/28;
  - prettier và eslint (admin-web, packages): xanh;
  - `tsc` admin-web: **1 lỗi ở `__tests__/s4-money.test.tsx:392`** (tệp của FE-A, đang làm: `getByRole(..., { exact: true })` không có trong `ByRoleOptions`). Không thuộc FE-B.
- **File (đợt 3):**
  - tạo `pages/reservations/DepositNotices.tsx`;
  - sửa `pages/reservations/ReservationDialogs.tsx` (1 import + 1 khối + chú thích của `DepositNoticeDialog`), `pages/stay/CheckOutPage.tsx` (dòng "Lập lúc"), `pages/ops/GuestRequests.tsx`, `app/attention.ts`;
  - mock: `mocks/{reservations,stay,dashboard,ops,handlers}.ts`;
  - `packages/api-client/src/endpoints.ts` (`getAttachment`);
  - test: `__tests__/s4-feb-desk.test.tsx`, `__tests__/s4-feb-dashboard.test.tsx`;
  - `design/tools/gen_strings.py` → sinh lại chuỗi.
- **Còn lại:**
  - bản rút gọn H24 cho FDL/FD;
  - `pct` của `foc_threshold` đang in số thô (`4.2`), chưa định dạng theo ngôn ngữ (`4,2`) – sửa khi UXD duyệt câu.

---

## Phần FE-B – đợt 4: H24 bản rút gọn cho FDL/FD (17/10/2026 tối)

- **Đã làm (hi-fi H24 24.2, rbac S02):**
  - "Tổng quan" có trong menu của FDL/FD; màn mặc định của hai vai này vẫn là Hôm nay. Cần duyệt, Cần chú ý và KPI vẫn do server lọc theo vai: FD không nhận mục tiền/FOC, chỉ OWN có cảnh báo FOC.
  - **FDL:** khối "Cần duyệt" gồm các yêu cầu chờ/chuyển cấp mà server trả trong hạn mức, **trừ yêu cầu do chính mình gửi** (không được tự duyệt); bấm mở H17. Không có số tiền tháng.
  - **FD:** thay khối "Cần duyệt" bằng "Yêu cầu bạn đã gửi (n)": 5 yêu cầu mới nhất, mỗi dòng có trạng thái bằng chữ (Chờ duyệt / Đã duyệt / Bị từ chối…). Các dòng không phải link, vì FD không mở được H17.
  - OWN/MGR giữ nguyên như trước.
  - Nhận yêu cầu "của mình": dùng `requestedById` khi server trả (contract-ahead R3); khi vắng thì so `requestedBy` với tên hiển thị của người đăng nhập `[GIẢ ĐỊNH FE-B]`.
  - `useDashboard` trả mọi yêu cầu server cho phép; màn tự chọn theo vai.
- **Chuỗi:** `ov.my_requests_n`, `ov.my_requests_empty` (nhóm FE-B, chờ UXD).
- **Kiểm:**
  - `s4-feb-dashboard` thêm 2 ca: FD thấy 3 yêu cầu của mình có trạng thái, không có link, không có cảnh báo FOC; FDL thấy 1 yêu cầu (không gồm của mình), link sang H17.
  - `nav.test`: FDL/FD có "Tổng quan" trong menu.
  - admin-web vitest 31 tệp **294/294**; `tsc` admin-web 0 lỗi; eslint, prettier xanh.
- **Cần UXD:** thẻ vai H02 2.2 ghi FDL/FD không có "Tổng quan" trong menu, ngược với H24 24.2. FE theo H24 24.2 (bản Sprint 4) – UXD xác nhận rồi sửa một trong hai.
- **File:** `pages/OverviewPage.tsx`, `pages/dashboard/useDashboard.ts`, `session/nav.ts`, `__tests__/{nav,s4-feb-dashboard}.test.tsx`, `design/tools/gen_strings.py` (+ tệp sinh), `01-decisions/decision-log.md`.

### Chuẩn bị US-155 "Yêu cầu đặt phòng từ website" (đã đọc, **chưa dựng** – chờ ORC báo hợp đồng chốt sau review SEC)
- **Hợp đồng đọc được (0.3.7 bổ sung 2, `x-round: R3`):**
  - `listWebsiteBookingRequests`: mặc định `new,in_progress`, sắp `new` theo `replyBy`; tìm theo `refCode` 8 ký tự, không tìm SĐT/tên qua URL;
  - `getWebsiteBookingRequest`;
  - `transitionWebsiteBookingRequest`: `claim` / `release` / `decline` (`reasonCode`; `other` bắt buộc `note`) / `mark-spam` / `reopen`, có If-Match + Idempotency-Key, sai trạng thái → 409 `INVALID_TRANSITION`;
  - chuyển thành giữ chỗ qua luồng sẵn có: `saveQuote.websiteBookingRequestId` → `createHoldFromQuote`, hoặc `ReservationCreate.websiteBookingRequestId`; `directSource = website` + `directSubSource` (facebook/instagram/google/zalo/qr/other);
  - "Cần chú ý" `website_request_new`; thông báo `website_request_new`, `website_request_cap_reached`; SSE `website_request.changed`.
- **Phạm vi:** FD+ thấy mọi yêu cầu; SAL thấy yêu cầu `new` chưa giao và yêu cầu giao cho mình; CTV/HK/MT không có quyền. Trường C2 vắng sau khi đã xóa theo hạn (`piiPurgedAt`) hoặc sau khi chuyển thành đơn – màn phải hiện được trạng thái "đã xóa dữ liệu".
- **Dự kiến trên Desk:**
  - mục menu "Yêu cầu từ website" cho FD+ và SAL;
  - hàng chờ có hạn trả lời (`replyBy`), "Nhận xử lý" / "Trả lại hàng chờ";
  - nút "Liên hệ qua Zalo": mở link Zalo theo SĐT, lễ tân xác nhận ngoài app;
  - "Lập báo giá → giữ chỗ" mở H12 với `websiteBookingRequestId`, hoặc "Tạo đơn" mở H09; "Từ chối" kèm lý do; "Spam"; "Mở lại";
  - dòng "Cần chú ý" `website_request_new` (thêm vào `app/attention.ts`); MSW theo hợp đồng.
- **Câu hỏi để hỏi khi bắt đầu** (không chặn bây giờ):
  - (a) danh sách `reasonCode` của `decline` và chữ khách thấy – BA/UXD;
  - (b) link Zalo: có được dựng từ SĐT khách (C2) trên máy quầy không – SEC;
  - (c) màn mặc định của SAL có chuyển sang hàng chờ này khi có yêu cầu mới không – PO.

---

## Phần FE-B – đợt 5: phản hồi review UXD giữa sprint (17/10/2026 tối)

- **Thẻ:** FB-R2-UXD-FE-S4-17, 18, 19 đều **Done** – chi tiết ở `responses/s4-FE.md` (phần FE-B).
  - S4-17: lỗi tải ảnh biên nhận hiện `rsv.receipt_upload_failed`, giữ nguyên số tiền và ảnh.
  - S4-18: lý do từ chối dùng `` `guest.req.decline.${code}` `` theo enum 0.3.7; bỏ `DECLINE_KEY`.
  - S4-19: `pct` của `foc_threshold` định dạng theo ngôn ngữ ("4,2%").
- **Mục D – UXD giữ H02 2.2 cho R2:**
  - "Tổng quan" trở lại chỉ OWN/MGR (menu và route); `nav.test` khôi phục;
  - biến thể H24 24.2 (đợt 4) **giữ trong mã, chưa bật**: test bằng cách dựng trực tiếp trang; bật lại bằng cách thêm vai vào `session/nav.ts`. PO quyết R3;
  - decision-log có dòng mới thay dòng FE-B "H24 bản rút gọn".
- **Kiểm:**
  - admin-web vitest **295/296**. Ca đỏ: `i18n-keys` thiếu `ci.pay_received`, khóa FE-A dùng ở `CheckInPayment.tsx` – thuộc FE-A/UXD;
  - `tsc` 0 lỗi; eslint, prettier xanh.
- **File:**
  - mã: `pages/reservations/ReservationDialogs.tsx` (chỉ `DepositNoticeDialog`), `pages/ops/{opsLabels.ts, GuestRequests.tsx}`, `app/attention.ts`, `pages/dashboard/parts.tsx`, `session/nav.ts`;
  - test: `__tests__/{nav, s4-feb-desk, s4-feb-dashboard}.test.tsx`;
  - tài liệu: `rounds/round-02/responses/s4-FE.md` (tệp mới), `01-decisions/decision-log.md`.

---

## Phần FE-B – đợt 6: BUG-R2-107 – hàng chờ hoàn tiền và khối "Cần duyệt" đọc đủ (17/10/2026 tối)

Hai chỗ cùng kiểu lỗi FE-A đã nêu ở đợt 8 nay dùng `listApprovals` (`app/approvals.ts`): lọc `status` ở server, đọc theo `nextCursor`.

- **Hàng chờ hoàn tiền** (`pages/money/MoneyPage.tsx`, `Refunds`):
  - Đọc `pending`, `escalated`, `approved`, mỗi trạng thái đọc hết trang (chặn an toàn 50 trang của hàm chung), rồi chỉ giữ `type = refund`.
  - Hiển thị không đổi: yêu cầu đã duyệt vẫn hiện, kể cả khi đã chi đủ.
  - Lưu ý: API chưa lọc theo `type`, nên lượt đọc `approved` gồm cả FOC/giảm giá đã duyệt. Số lượt đọc tăng theo lịch sử, khoảng vài trang/năm ở 10 căn. Đề xuất ARC (R3): thêm `type=refund` hoặc bộ lọc "hoàn chưa chi xong" ở `listApprovalRequests`.
- **Khối "Cần duyệt" H24 Tổng quan** (`pages/dashboard/useDashboard.ts`, `pages/OverviewPage.tsx`):
  - `useDashboard(…, { approvals: <danh sách trạng thái> })`: OWN/MGR/FDL đọc `pending` + `escalated`. Biến thể FD (có trong mã, chưa bật ở R2) đọc cả 5 trạng thái, lọc yêu cầu của chính mình, giữ 5 bản mới nhất.
  - **Giới hạn:** khối này là bản tóm tắt nên đọc tối đa `OVERVIEW_APPROVAL_PAGES = 3` trang (300 bản) mỗi trạng thái. Nếu còn trang sau, tiêu đề hiện "Cần duyệt (300+)". Hàng đầy đủ nằm ở H17 (đọc hết trang). 300 yêu cầu chờ ở 10 căn là dấu hiệu có sự cố khác.
  - Hôm nay (H03) không đọc yêu cầu duyệt (chỉ đọc `/attention` của server), nên không phải sửa.
- **Tệp dùng chung `app/approvals.ts` (FE-A):** thêm tùy chọn `onCapped(status)`, gọi khi `maxPages` dừng lúc còn trang. Thay đổi chỉ bổ sung, H17/H13 không đổi hành vi.
- **Unit** `__tests__/s4-feb-approvals-paging.test.tsx`:
  - Hoàn tiền: 150 FOC đã duyệt (mới hơn) + 1 yêu cầu hoàn chờ duyệt cũ hơn → thẻ hoàn 654.000 vẫn hiện. Mọi lần gọi có `status`, có lần đọc `approved` trang 2 (`cursor=100`).
  - Tổng quan MGR: 10 đã duyệt + 120 chờ duyệt → "Cần duyệt (121)", hiện bản cũ nhất (777.000). Có lần đọc `cursor=100`.
  - Tổng quan OWN: 320 chờ duyệt → "Cần duyệt (300+)", đúng 3 lượt đọc `pending`.
- **Kiểm:** admin-web vitest **313/313**; `tsc` 0 lỗi; eslint và prettier xanh trên các tệp đã sửa.
- **File:** `apps/admin-web/src/{app/approvals.ts, pages/money/MoneyPage.tsx, pages/dashboard/useDashboard.ts, pages/OverviewPage.tsx, __tests__/s4-feb-approvals-paging.test.tsx (mới)}`.

---

## Phần FE-B – đợt 7: H11 xác nhận QR cọc vượt số cọc còn thiếu (ARC 0.3.7 bổ sung 4 mục 16, DOM (f)) (18/10/2026)

- **`DepositDialog`** (`pages/reservations/ReservationDialogs.tsx`) dùng lại `qrOverDue` của FE-A (`components/VietQrCard.tsx`). Cảnh báo vượt và ô ghi chú bắt buộc hiện trong hai trường hợp:
  - biết trước khi bấm: lễ tân xác nhận theo QR (số đã nhận bằng số trên mã) và `amountVnd > Payment.amountDueNowVnd` của QR đang chờ;
  - server báo: `confirmPaymentReceived` trả 422 `REASON_REQUIRED` ở `note`, kèm `max`. Số `max` được giữ theo mã QR, nên ô ghi chú không biến mất khi bấm lại.
- **Cách hiện:**
  - cảnh báo `pay.qr_over_note` (chuỗi FE-A) ghi số khách chuyển và số còn phải thu;
  - ô "Lý do thu vượt" bắt buộc, cần ít nhất 3 ký tự, lỗi `field_error.reason_required` hiện sau lần bấm đầu;
  - thiếu ghi chú thì không gọi API;
  - `note` gửi kèm `confirmPaymentReceived`, rồi chạy B4 `existingPaymentId` như cũ;
  - lỗi chung của `qrAct` ẩn khi đã có cảnh báo vượt (cùng kiểu `PaymentPanel`).
- **Không đổi:** luồng QR hết hạn, QR đã ghi nhận, số khác mã QR (ghi như chuyển khoản tay) và `DepositQr`.
- **Chuỗi:** nhóm mới trong `gen_strings.py` có `dep.qr_over_reason` ("Lý do thu vượt" / "Reason for the extra amount"); đã chạy lại `strings-*.json`.
- **Unit** `__tests__/s4-feb-deposit-qr-over.test.tsx`, 3 ca:
  - 422 → cảnh báo kèm số đúng, ô bắt buộc, bấm lại thiếu ghi chú không gửi, có ghi chú thì QR `succeeded` có `note` và đơn `confirmed`;
  - QR chờ có `amountDueNowVnd` thấp hơn → cảnh báo hiện ngay, không gọi API cho tới khi có ghi chú;
  - QR không vượt → không có ô, gửi `{}`.
- **Kiểm:** admin-web vitest **337/337**; `tsc` 0 lỗi; eslint, prettier xanh. Chưa xem trên trình duyệt: Browser pane đang dùng chung với FE-LP.
- **File:** `apps/admin-web/src/pages/reservations/ReservationDialogs.tsx` (chỉ `DepositDialog`), `apps/admin-web/src/__tests__/s4-feb-deposit-qr-over.test.tsx` (mới), `design/tools/gen_strings.py` và `design/copy/strings-{vi,en,ru}.json`, `design/tools/strings-tables.md`, `design/wireframes/assets/strings.js` (sinh lại).

---

## FE-B – UXR S4 (18/10/2026, tuần Ổn định – Phản hồi & sửa)

Nguồn: `rounds/round-02/outputs/UXR/s4-pwa-walkthrough.md` (P-02, P-03, P-06 mức 3; P-20, P-22 mức 2; P-21 mức 1) và việc ORC giao thêm: luật B-15 cho `replyNote` (EP14 v0.3 mục 4.4, SEC C.6). Brand OTTIMO giữ nguyên: chỉ dùng token màu sẵn có (Ink, Oak, Ivory/Cream, màu chức năng đã ghi ngoại lệ), Lora / Be Vietnam Pro / JetBrains Mono (mã đơn), câu ngắn, không emoji.

### 1. Đã sửa

| Mục UXR | Mức | Đã làm |
|---|---|---|
| **P-02** Desk dưới 1024 px không có menu | 3 | Từ ≤ 860 px (đúng điểm `hifi.css` ẩn thanh bên) Desk dùng **thanh dưới theo hi-fi H24** (`.m-nav`): 4 mục theo vai + **"Thêm"**. Chủ đầu tư/quản lý: Tổng quan · Cần duyệt · Hôm nay · Phòng · Thêm. Lễ tân trưởng: Cần duyệt · Hôm nay · Phòng · Buồng phòng · Thêm. "Thêm" mở ngăn kéo có cơ sở, **mọi mục còn lại** (Nhật ký tiền, Tham số quy tắc, Danh mục căn…) và chip thiết bị. Mỗi lúc chỉ có một menu (thanh bên không dựng trên điện thoại). Trang không nằm trên thanh có nút **"Quay lại"** ở đầu trang: quay lại trang trước, hoặc về trang chủ của vai khi mở thẳng bằng đường dẫn. Mục "Thêm" sáng khi đang ở một trang trong đó. |
| **P-03** Cần duyệt vỡ bố cục ở 390 px | 3 | Thẻ H17 dựng lại (`.appr-card`): chữ – chip trạng thái – khối 2 nút. Điện thoại: chip cạnh chữ, 2 nút xuống hàng riêng và chia đều; từ 861 px giữ một hàng như cũ. Hết cột chữ ~60 px, số tiền không còn bị chip che. **Thẻ ghi rõ khoản và căn**: "Giặt ủi · 2.5 kg · 402 · The Ember" (H17) và thêm lý do trên H24, ví dụ trong test: "Phụ thu nhận sớm (nhận lúc 09:15) · 402 · The Ember · Khách quen / VIP". `ApprovalRequest` chưa có căn/khoản nên Desk tự đọc: `listReservations?q=<mã đơn>` (căn) và folio của đơn (dòng được miễn qua `folioLineId` → `relatedLineId`). Mỗi đơn đọc một lần, tối đa 20 thẻ (H17) / 10 thẻ (H24); lỗi đọc thì thẻ vẫn hiện như cũ. Dòng tiêu đề `mã · loại · số tiền` giữ nguyên để không vỡ test của FE-A. |
| **P-06** "Khai báo quá hạn" là ngõ cụt trên máy chưa cấp | 3 | `/registration` trên máy chưa cấp quyền không còn chỉ báo "Máy này chưa được cấp quyền". Trang giữ tiêu đề đó, kèm câu "Đây là danh sách đơn cần khai báo, không kèm giấy tờ…" và **danh sách**: căn · tên gọi, mã đơn (JetBrains Mono), trạng thái, "Giấy tờ n/N", hạn. Đơn quá hạn lên đầu, viền đỏ, có chữ "Đã quá hạn …". Dữ liệu lấy từ `listRegistrations`: không có C3, API không đòi máy được cấp. Các dòng không bấm được; chi tiết và giấy tờ vẫn chỉ mở trên máy được cấp. Trang con có "Quay lại" và thanh dưới (P-02). |
| **P-20** H24 ở 390 px: tiêu đề bị bóp, ô Giao diện đè nhãn | 2 | ≤ 520 px: nút tài khoản chỉ hiện chữ cái đầu (vùng bấm 44 px). Tên và vai vẫn là tên đọc của nút cho trình đọc màn hình. Thanh đầu trang thu lề còn 12 px. Trong menu tài khoản, 3 lựa chọn Giao diện xuống dòng dưới nhãn ở mọi khổ: popover 280 px cũng không đủ chỗ cho nhãn và 3 lựa chọn trên một dòng. |
| **P-21** "…hạn sớm nhất" bị lửng | 1 | Mục `registration_due` chưa có `dueAt` dùng câu mới `attn.registration_due_no_time` "Khai báo lưu trú hôm nay: {n} đơn". Có giờ thì giữ câu cũ. Sửa nhỏ nên làm luôn. |
| **P-22** Tham số: hiệu lực từ, lịch sử | 2 | Dòng tham số có giá trị đã lưu cho ngày sau hiện chip "35% từ 19/10" dưới giá trị đang áp. Desk đọc thêm `listParameters?asOf=<10 năm sau>`; api-client có thêm tham số `asOf` (không đổi hợp đồng). Lịch sử trong hộp sửa có thêm cột **"Hiệu lực từ"**; dòng chưa tới ngày có chip "Chưa hiệu lực". |
| **B-15 `replyNote`** (ORC giao thêm) | – | Mock MSW (`mocks/replyNote.ts`, dùng ở `mocks/ops.ts`) chép đúng luật BE-D `hasSensitiveDigits` và thứ tự kiểm của server: > 300 → `TOO_LONG`; số thẻ (Luhn, văn bản gốc) → 422 `CARD_NUMBER_DETECTED`; luật B-15 → `SENSITIVE_DATA_DETECTED`; ngoại lệ hotline công khai (`mockControl.ops.publicPhone`, seed không có). Kết quả: nhận `Phòng 202, 203, 204` và `Phòng 202; 203`; chặn `202,203,204`, `202 203 204`, `482,913`, `0912.345.000đ`. Ghi chú của khách (`note`) không qua luật. Câu nhắc dưới ô "Lời nhắn cho khách" dùng `req.desk.reply_help`: UXD đã viết lại theo E14-13 trong `gen_strings.py` và FE đã sinh lại JSON. Lỗi `SENSITIVE_DATA_DETECTED` dùng câu `field.SENSITIVE_DATA_DETECTED` của UXD, hiện dưới ô, nội dung đã gõ giữ nguyên. |

### 2. Kiểm thử

- `__tests__/s4-feb-uxr.test.tsx` (mới, 12 ca), giả lập điện thoại bằng `matchMedia('(max-width: 860px)')`:
  - P-02: thanh dưới OWN và FDL, "Thêm" có Nhật ký tiền/Tham số, chuyển trang rồi "Quay lại"; mở thẳng bằng đường dẫn thì "Quay lại" về trang chủ; máy quầy rộng vẫn dùng thanh bên, không có thanh dưới;
  - P-03: H17 hiện khoản + căn, chip nằm ngoài khối nút, khối nút `.appr-acts`; H24 hiện khoản · căn · lý do; quy tắc CSS xếp dọc;
  - P-06: máy chưa cấp có câu thiết bị, danh sách xếp quá hạn trước, không có link/nút; máy được cấp vẫn ra bảng H14 đầy đủ;
  - P-20: tên đọc của nút tài khoản, lớp `menu-row-wrap`, quy tắc CSS;
  - P-21: câu không giờ / có giờ;
  - P-22: lưu 35% từ ngày mai thì dòng vẫn "30%" kèm chip "35% từ dd/MM"; lịch sử có cột Hiệu lực từ và chip "Chưa hiệu lực".
- `__tests__/s4-feb-b15-reply.test.tsx` (mới, 45 ca):
  - toàn bộ bảng "Không bị chặn / Bị chặn" của EP14 v0.3 mục 4.4, gồm 5 ca SEC thêm ngày 18/10;
  - số thẻ được kiểm trước;
  - hotline công khai viết theo 3 cách vẫn qua, số khác bị chặn;
  - trên H03: câu nhắc là mô tả của ô; `Phòng 202,203,204…` và `0912.345.000đ` bị từ chối, hiện lỗi dưới ô, giữ nội dung; `Phòng 202, 203, 204… 350.000 đ` và `Phòng 202; 203` đi qua; ghi chú khách có 10 chữ số liền vẫn đóng được yêu cầu.
- **admin-web vitest 45 tệp / 433 ca xanh.** `tsc` admin-web và api-client 0 lỗi. Vitest api-client 30/30, ui 13/13. eslint xanh trên `apps/admin-web/src` và `packages/api-client/src`; prettier xanh.
- **Chưa xem bằng mắt trên trình duyệt:**
  - Browser pane không chạy MSW (không có service worker – UXR mục 1) và không mở được tệp HTML tạm;
  - bố cục 390 px mới chỉ kiểm qua DOM (jsdom) và đọc lại CSS;
  - đề nghị UXR/QA đi lại J6 trên stack `ottimo-uxr` sau khi dựng lại từ cây có thay đổi này.

### 3. File đã tạo / sửa (chưa commit)

- Mới:
  - `product/apps/admin-web/src/hooks/useMedia.ts`;
  - `product/apps/admin-web/src/app/approvalTarget.ts`;
  - `product/apps/admin-web/src/pages/registration/RegistrationReadOnly.tsx`;
  - `product/apps/admin-web/src/mocks/replyNote.ts`;
  - `product/apps/admin-web/src/__tests__/s4-feb-uxr.test.tsx`;
  - `product/apps/admin-web/src/__tests__/s4-feb-b15-reply.test.tsx`.
- Sửa trong admin-web:
  - `components/AppShell.tsx`: thanh dưới, "Thêm", "Quay lại";
  - `components/UserMenu.tsx`: 2 lớp CSS;
  - `session/nav.ts`: `short`, `mobileBar`, `itemOfPath`;
  - `app/routes.tsx`: trang cho máy chưa cấp;
  - `app/attention.ts`: chỉ nhánh `registration_due`;
  - `pages/approvals/ApprovalsPage.tsx`: chỉ thẻ danh sách, `DecideDialog` không đổi;
  - `pages/OverviewPage.tsx`: chỉ khối Cần duyệt;
  - `pages/ParamsPage.tsx`, `pages/ParamDialog.tsx`;
  - `mocks/handlers.ts`: `listParameters?asOf`;
  - `mocks/ops.ts`: `replyNote`, `publicPhone`.
- Sửa ngoài admin-web:
  - `product/packages/api-client/src/endpoints.ts`: `listParameters(…, asOf?)`;
  - `product/packages/ui/src/styles/app.css`: khối cuối P-02/P-20/P-03, mọi giá trị là token hoặc bội số 4 px.
- Chuỗi và tài liệu:
  - `product/design/tools/gen_strings.py`: nhóm mới "FE-B tuần Ổn định: sửa theo UXR S4", 5 chuỗi **chờ UXD duyệt**: `reg.untrusted_body`, `reg.untrusted_ids`, `attn.registration_due_no_time`, `params.pending`, `params.not_yet`;
  - sinh lại `design/copy/strings-{vi,en,ru}.json`, `design/tools/strings-tables.md`, `design/wireframes/assets/strings.js` (gồm cả chuỗi đang chờ của vai khác trong `gen_strings.py`);
  - `01-decisions/decision-log.md`: 1 dòng FE-B.
- **Không đụng** CheckOutPage, DocsPanel, ReservationDrawer, StayDialogs (FE-A), RegistrationPage.tsx (đang có thay đổi của vai khác), `mocks/stay.ts`, `mocks/reservations.ts`.

### 4. Giả định

- **SEC đã đồng ý (18/10, `s4-SEC.md` C.11)** – trước đây là giả định chờ SEC: danh sách cần khai báo không có C3 (căn, mã đơn, tên gọi, hạn) được hiện trên máy chưa cấp. API cho phép, không đòi máy được cấp. EP06 mục 0 chỉ khóa đọc/ghi giấy tờ. SEC không đồng ý thì đổi về `DeviceBlocked` bằng cách bỏ 1 dòng trong `UNTRUSTED_PAGES` (`app/routes.tsx`).
- Điểm gãy 860 px theo `hifi.css`. UXR ghi "dưới 1024 px" vì đã thử ở 768 và 390. Từ 861 đến 1023 px vẫn có thanh bên.
- Thanh dưới theo hi-fi H24, "Nhật ký tiền" nằm trong "Thêm". UXR đề xuất đưa Nhật ký tiền lên thanh. UXD quyết nếu muốn đổi: chỉ cần đổi `BAR_ORDER` trong `session/nav.ts`.
- P-22 chỉ hiện giá trị hẹn **xa nhất** của mỗi khóa (`asOf` xa). Hai lần hẹn liên tiếp cho cùng khóa thì lịch sử trong hộp sửa vẫn đủ.

### 5. Cần vai khác

- **UXD:**
  - duyệt 5 chuỗi mới;
  - xem thanh dưới, ngăn kéo "Thêm" và thẻ Cần duyệt xếp dọc. Bố cục dùng lại `.m-nav`, `.drawer`, `.task` của hi-fi; không thêm màu.
- **ARC/BE (R3):** thêm vào `ApprovalRequest` các trường `roomNo`/`roomName` và nhãn khoản được miễn (`lineLabelKey` + `labelParams`). Khi có, Desk bỏ phần tự đọc ở `app/approvalTarget.ts` và bớt 1–3 lượt gọi mỗi đơn.
- **SEC (đã xong):** đồng ý P-06 với 3 điều kiện (C.11). Mã đã kiểm: không có trường giấy tờ; dòng là `<li>` thường, không link/nút/tabindex/role/handler; dữ liệu chỉ ở bộ nhớ (`useResource`), không gọi storage. Test thêm trong `s4-feb-uxr.test.tsx`, nhóm "SEC C.11 conditions", 3 ca:
  - (2) quét mọi phần tử của dòng; bấm vào dòng vẫn ở danh sách và không gọi `getRegistration`;
  - (3) theo dõi `Storage.setItem` và `indexedDB.open`, cộng chặn mã nguồn trang không có lệnh storage;
  - (1) API trả thêm trường giấy tờ thì trang không hiện.

  Tổng tệp này còn 15 ca, xanh.
- **QA/UXR:** đi lại J6 trên điện thoại 390 px (P-02, P-03, P-06, P-20) và ca E14-11 B-15 trên Desk.

### 6. Danh sách R3 (FE-B)

1. P-06: cột "người đang xử lý" của danh sách khai báo – API chưa có trường. Cần BE thêm vào `RegistrationSummary`.
2. P-03: chuyển phần tự đọc căn/khoản sang trường của API (mục 5).
3. P-22: nếu cần hiện mọi lần hẹn, không chỉ lần xa nhất: API trả `upcoming[]` trong `listParameters`.
4. UXR J6 bước 4: truy nguồn KPI (bấm số công suất ra danh sách đơn) – UXR đã ghi R3.
5. EP14 4.4 cho phép `replyNote` khi "Xong" (ví dụ trả muộn nêu giờ đã duyệt), nhưng Desk mới có ô lời nhắn ở "Không thực hiện được". Cần UXD vẽ ô cho "Xong".
6. P-19, P-23 (FE + UXD: lý do hệ thống ở Nhật ký tiền, hoàn tác "Đã khớp sao kê") không nằm trong phần ORC giao FE-B lượt này.

### 7. Thẻ UXD FE-S4-26, FE-S4-27 (`reviews/s4-UXD-brand.md` mục H và E) – 18/10

- **FE-S4-26 – thanh dưới theo vai.** `session/nav.ts` có `barOrder(roles)`: vai đầu tiên theo `ROLE_ORDER` quyết thứ tự.
  - OWN/MGR: **Tổng quan · Cần duyệt · Phòng · Nhật ký tiền · Thêm**. "Hôm nay" chuyển vào "Thêm".
  - FDL, FD, sale/CTV: giữ thứ tự cũ.
  - `mobileBar(items, roles)` dùng ở `AppShell` (thanh dưới và nút "Quay lại").
- **FE-S4-27 – cuộn ngang ở 390 px.** Lỗi tái hiện đúng số UXD đo: Hôm nay +28 px, Đơn đặt phòng +106 px. Cách tái hiện:
  - lấy DOM điện thoại do jsdom dựng;
  - ghép CSS thật (tokens, hifi, `app.css`) và font tự host;
  - đo `scrollWidth` bằng Chromium (Playwright của `product/tests`). Script nằm trong scratchpad, không đưa vào repo.
- **Đã sửa:**
  - **Hôm nay:** "Cần chú ý" trên điện thoại dùng mẫu H24, cả dòng là link có mũi tên (`AttentionBlock` dùng `useNarrow`). Máy quầy giữ nút "Mở". `.cols-2` ở ≤ 860 px thành `minmax(0, 1fr)`: `1fr` của hifi để bề rộng tối thiểu của thẻ kéo giãn trang. Dòng yêu cầu khách (`.req-row`) đưa 2 nút xuống dưới chữ ở ≤ 520 px.
  - **Đơn đặt phòng:** `Topbar` bọc nút hành động vào `.topbar-acts`. Ở ≤ 520 px, khối có nút xuống dòng riêng và tự xuống dòng tiếp; chip người dùng ở lại dòng tiêu đề. Huy hiệu "Trực tiếp" của Tổng quan không phải nút nên vẫn cùng dòng tiêu đề.
  - **Tìm thêm khi đo:**
    - Tham số +211 px: `<span class="sr-only">` trong `th` có `position: absolute` nên thoát khỏi khung cuộn `.table-wrap`. Sửa bằng `.table-wrap { position: relative }`, áp cho mọi bảng.
    - Sơ đồ phòng ở 360 px +12 px: chip dài, nay cho xuống dòng ở ≤ 520 px.
- **Kết quả đo sau sửa:** 9 trang (Hôm nay, Đơn đặt phòng, Tổng quan, Cần duyệt, Nhật ký tiền, Buồng phòng, Sơ đồ phòng, Khai báo, Tham số) đều `scrollWidth = innerWidth` ở 360 và 390 px. Bảng dài vẫn cuộn trong khung riêng, UXD đã chấp nhận ở R2.
- **Test:** `s4-feb-uxr.test.tsx` thêm 1 ca bảng thứ tự theo vai và 5 ca FE-S4-27. Ca chủ đầu tư đi trên điện thoại sửa theo thanh mới. Test liên kết thẳng đổi sang `/settings/parameters`, vì `/audit` nay nằm trên thanh. jsdom không đo được bề rộng, nên phần pixel dựa vào phép đo Chromium ở trên.
- **Kiểm:** admin-web vitest 45 tệp / 442 ca xanh; `tsc` 0 lỗi; eslint, prettier xanh.
- **File:**
  - mã: `session/nav.ts`, `components/AppShell.tsx`, `pages/dashboard/parts.tsx` (chỉ `AttentionBlock`), `pages/ops/GuestRequests.tsx` (2 lớp CSS), `packages/ui/src/styles/app.css` (khối cuối);
  - test: `__tests__/s4-feb-uxr.test.tsx`;
  - phản hồi: `rounds/round-02/responses/s4-FE.md` (2 dòng Done).
- **Đề xuất QA (R3):** thêm ca E2E đo `scrollWidth ≤ innerWidth` ở 360 và 390 px cho các trang trên thanh dưới, trên stack có API thật.
