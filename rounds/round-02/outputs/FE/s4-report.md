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
