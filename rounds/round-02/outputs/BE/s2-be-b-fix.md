# BE-B – Round 2, Sprint 2: Phản hồi & sửa (OpenAPI 0.3.5, BR v0.3.2)

- Vai: BE (luồng BE-B) | Ngày: 16/10/2026 | Không commit | Trả lời từng thẻ: `responses/s2-BE-B.md`
- Làm song song BE-A (đang sửa reservations). Dùng cổng BE-A định nghĩa `reservations/public/folio-sync-port.ts` (`FOLIO_STAY_SYNC`), đổi lại BE-B viết `reservations/public/stay-night-allocation.ts`.

## 1. Việc đã làm
| Nhóm | Nội dung |
|---|---|
| Folio – đảo bút toán (DOM-BE-01 Blocker) | `FolioService` cài `FolioStaySync`. `voidStay` đảo dòng phòng/phụ thu người của các đêm void kèm các dòng FOC/giảm đã áp lên chúng, ghi một dòng `cancellation_fee`/`no_show_fee` = phần giữ lại, có audit `folio.stay_reversed`. Hoa hồng void qua `onReservationVoided` (giữ chữ ký cũ) |
| Folio – đồng bộ (DOM-BE-02/03) | `onReservationConfirmed` = `resyncStay` = một hàm `syncStay` (gọi lại nhiều lần vẫn cho cùng kết quả): dòng phòng còn giữ khi giá gộp (gross) = giá đêm + phần giảm đã duyệt, khác thì đảo rồi ghi lại; phụ thu người theo số người hiện tại; B12 đảo `no_show_fee`; hoa hồng `projected` void + tạo lại khi người chốt/cơ sở/% đổi; phí kênh OTA cập nhật + audit; phân bổ lại xuống `stay_night` |
| Ranh giới module (ARC S2-07) | Folio không còn tự ghi bảng `stay_night`; ghi qua `StayNightAllocationService` (`setCommissions`, `setChannelFees`, `addDiscount`). Hook FOC dùng cùng dịch vụ này; FOC được duyệt sau khi dòng gốc đã bị đảo → chuyển `rejected` |
| Cọc (A-13, SEC-22 theo DOM E.2, BR-527 v0.3.2) | Thiếu cọc mà đã ghi tiền → 200 + đơn `hold` + `depositPaidVnd`. 422 `DEPOSIT_INSUFFICIENT` chỉ khi không ghi gì. Khoản do SAL/CTV ghi luôn `pending` + `recordedByRole` + push `deposit_unverified` (thay tạm cho "Cần chú ý"). Giờ nhận lùi ≤ `staff_payment_backdate_max_hours`; giữ chỗ quá hạn chỉ FD+ xác nhận. Trần một lần thu = số còn phải thu (FD+ vượt được nếu có lý do); `HOLD_EXPIRED`+`expiredAt`, `INVALID_TRANSITION`+`currentState`; thông báo cọc gắn `handled_payment_id` |
| Thông báo cọc (SEC-28) | 1 thông báo mở mỗi đơn: báo lại thì cập nhật bản cũ, không push lại trong 10 phút |
| Báo giá (A-02/05/14/18) | Thêm trường tách tiền + `roomId/roomNo`; nhóm căn thiếu đêm tối thiểu thì ưu tiên căn đêm lẻ; `MIN_STAY_NOT_MET` có `minStayNights`+`suggestions`; `CAPACITY_EXCEEDED` có `roomNo/max`; `QUOTE_EXPIRED`+`expiredAt`; **`extendQuote`** (200 MGR+; 202 + `quote_extension` cho SAL/CTV, hook duyệt chạy Q4); `nights` ≤ 60 |
| identity (A-06) | **`listCloserCandidates`**: user `active`, vai còn hiệu lực, `agent`/`staff`, không có dữ liệu cá nhân |
| dryRun (SEC-21) | `shared/http/dry-run.ts` – 9 endpoint của BE-B từ chối `dryRun` (422) |
| Migration | **0019_deposit_notice_fk_be_b**: FK cặp `deposit_notice → payment`; catalogue `staff_payment_backdate_max_hours` (mặc định 24, biên 0–72) |

**Giao diện cho BE-A** (đã nối, test end to end xanh):
- `FOLIO_STAY_SYNC` → `FolioService`:
  - `voidStay(tx, {reservationId, reservationCode, folioId, voidedStayNightIds, retainedVnd, retainedKind, reason, requestId?}, {userId})`
  - `resyncStay(tx, ConfirmedStay, {userId, requestId?})`
- Thứ tự gọi khi hủy/no-show: `onReservationVoided` (hoa hồng) → `voidStay`. Gọi `voidStay` cho đơn giữ chỗ không có dòng nào thì không làm gì.
- `StayNightAllocationService` đang được FolioModule cung cấp; BE-A có thể chuyển sang ReservationsModule.
- **Còn thiếu:** gọi `LeadsService.onHoldEnded(tx, quoteId)` ở B5/B6.

## 2. Test (DB `ottimo_test_beb`, xóa và tạo lại sạch)
| File | Ca | Mới |
|---|---|---|
| `be-b-s2-units.test.ts` | 14 | oracle BR-304-02, BR-903-02 |
| `integration/sales.test.ts` | 27 | A-14; A-05 (nhóm chọn 202 đêm lẻ, `suggestions`); `CAPACITY_EXCEEDED` roomNo/max; `QUOTE_EXPIRED` expiredAt; `extendQuote` (MGR 200, SAL 202 → MGR duyệt → active, 403/404/409/422); dryRun 422; SAL khác 404; `listCloserCandidates` |
| `integration/folio-payments.test.ts` | 17 | A-13 (200 hold → đủ → confirmed); SEC-22 (pending + push + `recordedByRole`, lùi > 24 h 422, trần = còn phải thu, FD vượt trần có lý do); quá hạn: SAL 409 + expiredAt; dryRun; **hủy → 14 dòng đảo + phí, tổng phòng 0, hoa hồng void**; **PATCH người → phụ thu về 0**; **BR-107-04 / 03 (5→7→5 đêm: 4.079.000 → 5.205.000 → 4.079.000)** |
| `integration/rbac-sprint2-beb.test.ts` | 199 | thêm `extendQuote`, `listCloserCandidates` |

## 3. Kết quả lệnh (toàn repo, 16/10/2026)
| Lệnh | Kết quả |
|---|---|
| `pnpm -s test` | **Xanh** – Turbo 12/12; `@ottimo/api` 30 file / **1123** ca |
| `pnpm -s build` | **Xanh** – 6/6 |
| `pnpm -s lint` | **0 lỗi**, 1 cảnh báo cũ (FE `mockServiceWorker.js`) |
| typecheck api | **1 lỗi của BE-A**: `test/reservations-pricing.test.ts:69` thiếu `otaBaseRates` (BE-A đang sửa `PricingParams`) |
| `pnpm -s format:check` | **Đỏ, không có file nào của BE-B**: `modules/reservations/**` và snapshot 0015–0018 (BE-A đang làm), `eslint.config.js` (đang có người sửa), `tests/test-results/.last-run.json` (kết quả QA, nên đưa vào `.prettierignore`) |
| `drizzle-kit generate` (bản sao) | No schema changes (0000…0019) |

## 4. Giả định / còn lại
- "Cần chú ý" cho khoản sale ghi và cọc chưa đối soát: R2 dùng push `deposit_unverified`; mục "Cần chú ý" thật chờ bảng `attention_event` (Sprint 4).
- Quy tắc "hoa hồng của người tự ghi cọc chỉ đạt khi khoản cọc đã đối soát" (BR-527): R2 chưa có bước `earned`. Job ghi nhận ở R3 (US-089) phải kiểm `payment.reconciliation` của khoản cọc do chính người nhận hoa hồng ghi.
- Trần một lần thu = tổng báo giá (tiền phòng + phụ thu) − cọc đã thu. Đơn không đi từ báo giá thì dùng `totalRoomVnd` của đơn.
- Hủy có hoàn tiền: số dư folio âm (= khoản phải hoàn) cho tới khi luồng `refund` chi tiền (Sprint 3).
- Làm tròn hoa hồng ở kỳ chi (BR-903-03): R3.
- Không có ESC mới.
