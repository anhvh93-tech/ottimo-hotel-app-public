# ARC phản hồi – review hợp đồng OpenAPI 0.3.13-draft (PR #94)

- Tác giả: ARC · Round 5 (v1.0.5), bước **Phản hồi & sửa** · 06/11/2026
- Nhánh `r5-contract-0313` (PR #94), commit mới trên nhánh, không rebase, không force. Hợp đồng vẫn `0.3.13-draft`; phần sửa gom ở **bổ sung 1** (mục "Thay đổi phiên bản 0.3.13-draft" của `openapi.yaml`; `rounds/round-05/outputs/ARC/contract-0.3.13.md` mục 1.16–1.24).
- Review được trả lời:
  - `rounds/round-05/reviews/SEC-on-contract-0.3.13.md` (`6c92e73b`): FB-R5-SEC-ARC-01…14;
  - `rounds/round-05/reviews/BE-on-contract-0.3.13.md` (`32fab4d0`): FB-R5-BE-ARC-C0313-01…21;
  - BA `rounds/round-05/outputs/BA/report.md` (`5f4a1080`): A07b/A33, ghi chú 46b;
  - QA `rounds/round-05/qa/bug-list.md` (`233b9b5d`): BUG-R5-001, 002, 003 (phần hợp đồng);
  - DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 2–5, 7, 9, 11, 12 (trả lời các mục ARC chờ; `e9e0e2e4`, `5ad26fc1`);
  - SEC `rounds/round-05/reviews/SEC-on-bug-r5-002.md` (`406af104`): FB-R5-SEC-BE-B002-01, FB-R5-SEC-ARC-B002-02, 03.
- Không có dữ liệu khách, tỷ lệ/số tiền hoa hồng, mật khẩu Wi-Fi hay bí mật trong tệp này.

## 1. SEC – FB-R5-SEC-ARC

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R5-SEC-ARC-01 | Major | Done | Báo giá chỉ kênh `direct`/`agent` (`internal`, `ota` → 422 `NOT_IN_LIST`); bỏ nhánh Nội bộ BR-421 khỏi `nightlyRates`. `QuoteInput.channelId`, `QuoteInput.nightlyRates`, `saveQuote`. Contract 1.17, T14-8, T14-9 |
| FB-R5-SEC-ARC-02 | Major | Done | Phần mở rộng mới `x-write-roles` (meta `writeRoles`, `fieldCases` 21 ca); 403 sau tra Idempotency, trước mọi kiểm thân lệnh, không trường mở rộng; hợp quyền nhiều vai. Gắn `calculateQuote`, `saveQuote`, `createReservationGroup`. Ca theo trạng thái viết tay H-01…H-09 (contract 1.16). Gắn cho luật trường cũ: 0.3.14 (không chặn) |
| FB-R5-SEC-ARC-03 | Major | Done | DOM chọn (a): MGR ≤ 1 đêm, từ 2 đêm chỉ OWN (403 `requiredRole`, `nightsNotBilled`); audit `nightsNotBilled`; `listAuditEvents.overdueOnly`; `CheckoutSummary.nightsNotBilled`; không migration. Contract 1.18 |
| FB-R5-SEC-ARC-04 | Major | Done | Luật client chống tự điền (không `type="password"`, `autocomplete="off"`, tên ô, bước xác nhận) + máy chủ chặn `ssid` trùng tên đăng nhập nhân viên và mật khẩu trùng mật khẩu người gọi (argon2 một lần, không đếm khóa, không log). `setPropertyWifi`; contract 1.23, T58-9, T58-10 |
| FB-R5-SEC-ARC-05 | Minor | Done | `ssid` ≤ 32 byte UTF-8, không ký tự điều khiển; mật khẩu ASCII in được; 422 không lặp giá trị đã gửi |
| FB-R5-SEC-ARC-06 | Minor | Done | Đêm `edited` ≠ `true`: máy chủ dùng giá lịch của chính nó, bỏ `amountVnd` gửi lên (báo giá). B1 giữ như cũ ở bản này – ghi rõ là khác có chủ đích; SEC muốn B1 theo thì 0.3.14. T14-11 |
| FB-R5-SEC-ARC-07 | Minor | Not ARC | Thẻ của OPS – OPS đã trả lời ở `3027ab01` (làm ở PR #93). ARC không đổi hợp đồng |
| FB-R5-SEC-ARC-08 | Minor | Not ARC | Thẻ của OPS (`log_error_verbosity=terse`) – OPS đã trả lời ở `3027ab01` (làm ở PR #93) |
| FB-R5-SEC-ARC-09 | Suggestion | Done (Resolved trong tệp SEC) | OPS xác nhận giờ theo repo (`3027ab01`). ARC sửa theo `ARC-on-ops-prs-92-93-95.md` 1.7: mục 0 dòng V5-62; 1.14 – production `ottimo-backup@ottimo-prod.timer` (tệp `ottimo-backup@.timer`) 03:00 + 15:00, staging `ottimo-backup.timer` 03:30 + 15:30, khoảng lớn nhất nếu chọn 14:00 là 13 giờ, vòng xoay < 33 ngày đo bằng giây, test `backup-schedule.test.sh`; G7 bỏ "đề xuất"; mục 8; 1.15 và mục 7 khớp PR #93 |
| FB-R5-SEC-ARC-10 | Suggestion | Done (bổ sung 1d) | DOM 7.5 muốn FD đọc Wi-Fi, SEC không phản đối. BA thêm S36 "Xem Wi-Fi cơ sở" (rbac 0.2.8, `4bb9e68d`); `getPropertyWifi` `x-rbac` S24 → S36, `x-roles` thêm `front_desk`; sửa vẫn A101 (OWN, MGR). `Me.screens` thêm S36. Contract 1.23. SEC đóng thẻ |
| FB-R5-SEC-ARC-11 | Suggestion | Not ARC | Việc INV/OPS (tách mạng khách, client isolation), SEC thêm SR-NET-01. Không đổi hợp đồng |
| FB-R5-SEC-ARC-12 | Suggestion | Done | Sửa câu changelog (Desk không có màn tạo căn); cảnh báo không chặn `NIGHTLY_PRICE_UNUSUAL` ở `createRoom` (201 + `warnings[]`) và `updateRoom` khi giá đêm < giá tháng ÷ 30 (BR-101 (4)) hoặc > giá tháng ÷ 5 (DOM `1568e523`; so số nguyên, đúng bằng biên không cảnh báo – bổ sung 1d). Desk xác nhận lại trước khi lưu (không thêm trường lý do – `createRoom` không có chỗ ghi lý do; audit đã ghi giá) |
| FB-R5-SEC-ARC-13 | Suggestion | Done | Id ổn định `RB-<operationId>-<subject>`, ca trường `RBF-<operationId>-<field>-<subject>`; kiểm trùng id khi sinh; `x-round: R5` cho 3 operation mới. Id cũ trong tài liệu trước 0.3.13 tra theo git |
| FB-R5-SEC-ARC-14 | Suggestion | Not ARC | ORC thêm câu L7 vào danh sách hỏi luật sư ESC-001. V5-63 giữ 90 ngày |

## 2. BE – FB-R5-BE-ARC-C0313

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R5-BE-ARC-C0313-01 | Major | Done | QR `check_out`, `amountDueNow` kiểm `TIME_AFTER_ACTION` như B18 qua một hàm `resolveCheckoutAt`; `CheckoutSummary.checkoutAtAfterNow`. T10-9 |
| FB-R5-BE-ARC-C0313-02 | Major | Done | `getArrivalsDepartures` vắng `date` trong cửa sổ sau nửa đêm → `departures` theo ngày lịch, trả `departuresDate`; `arrivals` giữ ngày nghiệp vụ. Làn BE-D (PR-D1). T10-10 |
| FB-R5-BE-ARC-C0313-03 | Major | Done | Mọi B18 có `checkoutAt` ghi `actual_checkout_at` (đơn + đăng ký) = `stay_ended_at` = `checkoutAt`; `recordedAt` chỉ cho audit và cửa sổ sau trả phòng. SEC xác nhận mốc giữ chứng cứ (contract mục 3) |
| FB-R5-BE-ARC-C0313-04 | Major | Done | BR-438: xét trên dòng gốc chuỗi `related_line_id`; thêm `before.rootLineId`, `before.rootLineManual`; allowlist `folio_line` 4 khóa. PR-B2 |
| FB-R5-BE-ARC-C0313-05 | Major | Done | `nightlyRates` cùng nghĩa B1 (phủ mọi đêm, giá lịch trước BR-107/BR-111, sàn–trần, không 0 đ); dùng chung `PricingService.price`; snapshot lưu `nights[].source`. T14-7 oracle. PR-S1 ≤ 08/11 |
| FB-R5-BE-ARC-C0313-06 | Major | Done | `min_stay` chỉ `MinStayRule[]` (mỗi phần tử có ngày áp dụng, khóa lạ → lỗi, `errors[].field` = `value[i].x`); bộ đọc phòng thủ không 500. Không đổi schema. PR-C2 (V5-25, BUG-R5-003) |
| FB-R5-BE-ARC-C0313-07 | Minor | Done | Bỏ câu "Luật mới chỉ đổi kết quả…"; thêm ứng viên (ngày đi − 1, `t`) khi đang ở cửa sổ sau nửa đêm và `t` ≥ rollover (giữ hành vi hiện có). T10-8 |
| FB-R5-BE-ARC-C0313-08 | Minor | Done | `createVietQr.checkoutAt` vắng → quy đổi như `checkOut`; Desk chỉ chuyển tiếp `checkoutAt` của lần tóm tắt có gửi giờ |
| FB-R5-BE-ARC-C0313-09 | Minor | Done | `check_out`, cửa sổ sau nửa đêm, `overdue` theo ngày đi hiệu lực `stayDepartureDate`; `ActionContext` thêm ngày lịch. T15-15 |
| FB-R5-BE-ARC-C0313-10 | Minor | Done | `checkoutTime` tùy chọn khi có `checkoutAt` (một trong hai bắt buộc, gửi cả hai phải khớp); cổng minibar `countFrom` ở PR-A1b, người giữ inventory review |
| FB-R5-BE-ARC-C0313-11 | Minor | Done | `lockReason` + `invoice_issued`; thu nợ trên folio mở → 409 `INVALID_TRANSITION`; hàm chung `folioLocked(reason)` |
| FB-R5-BE-ARC-C0313-12 | Minor | Done | `min`, `max` ở mọi nơi trả `RATE_OUT_OF_RANGE(_WARNING)`; B13 thêm `dates[]`, giữ `date` |
| FB-R5-BE-ARC-C0313-13 | Minor | Done | `depositUnverifiedVnd` = min(`depositPaidVnd`, Σ cọc chờ đối soát) |
| FB-R5-BE-ARC-C0313-14 | Minor | Done | T13-5 sửa đẳng thức; `OpenRefund.reasonCode` = mọi mã lý do yêu cầu hoàn; BE liệt kê đủ trong PR-B1 cho UXD |
| FB-R5-BE-ARC-C0313-15 | Minor | Done | = SEC ARC-12. Sửa câu changelog; bootstrap tạo căn `isSellable = false` khi thiếu giá; danh sách việc kèm của BE ghi vào contract 1.24 (PR-C1) |
| FB-R5-BE-ARC-C0313-16 | Minor | Done | Đọc như `wifiOf` (phẳng + theo ngôn ngữ), ghi phẳng; `UPDATE … WHERE id`, RLS; thực thể audit `property`; mật khẩu ASCII in được; không SSE; `x-round: R5`. T58-7, T58-8 |
| FB-R5-BE-ARC-C0313-17 | Minor | Done | `missing[]` lọc vai như `data`; bắt `ParameterMissingError` → `rate_missing` mọi chỗ; hoa hồng thuê dài chuyển sang khóa mới `long_stay_commission` (DOM 4) – hết vướng `lease_terms` lồng; bỏ số ở `production-defaults.ts` không đổi giá trị production. T30-5 |
| FB-R5-BE-ARC-C0313-18 | Minor | Done | `weekend_nights` = `Weekday[]`; sửa bộ kiểm, không sửa bộ tính giá; `erd.md` 9.1, 9.1a đã sửa. PR-C2 |
| FB-R5-BE-ARC-C0313-19 | Suggestion | Done | Bắt theo SQLSTATE `23514` + tiền tố câu trong `SAVEPOINT`; lỗi 23514 khác ném lại. T44-4 |
| FB-R5-BE-ARC-C0313-20 | Suggestion | Done | `removalsOnly`, `reductionsOnly` ghim `category = money`, `action = folio_line.adjusted` (dùng index có sẵn) |
| FB-R5-BE-ARC-C0313-21 | Suggestion | Done (ý 3 Rejected) | PUT trả `passwordSet`, không `password`; `no-store` cả PUT. **Không thêm `If-Match`** – lý do: tần suất sửa rất thấp (một mạng chung, OWN/MGR), audit giữ `before.ssid`, thêm header buộc Desk đọc lại trước mỗi lần lưu mà không giảm rủi ro thật |

**Đề xuất làn của BE:** đồng ý tách PR-A1a (V5-10) / PR-A1b (V5-15); V5-40, V5-43 và `departuresDate` sang BE-D. Thứ tự mới ở contract mục 2.

## 3. BA

| Điểm | Trạng thái | Ghi chú |
|---|---|---|
| (a) `rbac-matrix.json` A07b, A33 trỏ `channelWebhook`, `paymentCallback` (không có trong OpenAPI) | Done (BA rbac 0.2.8, `4bb9e68d`) | Đường hệ thống thật là `webhookPost`/`webhookGet` (`x-roles: [system]`, R3). BA đã bỏ hai operationId và ghi chú ở A07b/A33. Hợp đồng không đổi |
| (b) Ghi chú 46b – nhiều vai có FD gửi `nightlyRates` | Done | Hợp quyền: một vai có trong `x-write-roles` là qua. Ghi ở changelog bổ sung 1 (a), `QuoteInput.nightlyRates`, contract 1.16; `fieldCases` có ca nhiều vai `pass` |
| Mới – dòng rbac đọc Wi-Fi cho FD (DOM 7.5) | Done (bổ sung 1d) | BA S36 (ghi chú 47); ARC đổi `getPropertyWifi` (`x-rbac: [S36]`, thêm `front_desk`) |
| Mới – dòng rbac `getManagerPerformanceBonus` | Done (bổ sung 1d) | BA A120 (ghi chú 48); ARC gắn `x-rbac: [A120]`, giữ `x-scope: { manager: own }` |
| Mới – SM-01 `cancelled → hold` (lý do `hold_expired`) | Done (BA B19; tên chốt ở bổ sung 1d) | Tên hành động **`restore_hold`** (`AllowedAction.action`); áp từ 0.3.14. Contract 1.21 ý 4 |

## 4. QA – phần hợp đồng của bug

| Bug | Trạng thái (phần ARC) | Ghi chú |
|---|---|---|
| BUG-R5-001 `weekend_nights` | Done | Như BE 18. Không đổi schema |
| BUG-R5-002 tiền về sau tự hủy (V5-48, V5-5B) | Done (quyết định) | Theo DOM 11.4 (`e9e0e2e4`, `5ad26fc1`) và SEC `SEC-on-bug-r5-002.md`; bản đầu của ARC (đóng đường) bỏ. Chi tiết mục 6 dưới và contract 1.21 |
| BUG-R5-003 `min_stay` | Done | V5-25 **chỉ thêm dòng mô tả `setParameter`**; không schema mới, không trường mở rộng mới (`PARAM_OUT_OF_RANGE` có sẵn `min`, `max`, `allowed[]`, `errors[]`). Luật DOM 12.1 (0–20 luật, khóa cho phép, `nights` ≤ min(7, `short_stay_max_nights`), `channels` bắt buộc không `internal`, mỗi luật áp ít nhất một ngày, `[]` hợp lệ) + kiểm ngược `short_stay_max_nights`; lỗi báo điểm sai đầu tiên `errors[0].field = value[i].<khóa>` với mã trường có sẵn; bộ đọc phòng thủ bỏ luật hỏng, không 500 |

## 5. DOM – các mục ARC chờ

Đã làm hết (contract mục 3). DOM `1568e523` chốt nốt: biên trên cảnh báo giá đêm ÷ 5 (G9, so số nguyên, đúng bằng biên không cảnh báo), câu BR-428 (00:00–05:59 dùng Trả phòng, gọi thẳng → 409 `useCheckout`), 7.1 (`nightsNotBilled` theo ngày nghiệp vụ lúc bấm kể cả `dryRun`; ngày đi = `stayDepartureDate`, gồm gia hạn B13 và đơn con OTA). Hợp đồng đã viết đúng các ý này; bổ sung 1d chỉ sửa ÷ 3 → ÷ 5.

## 6. SEC – BUG-R5-002 (`SEC-on-bug-r5-002.md`) và DOM B002-04

| ID | Mức | Trạng thái (phần ARC) | Ghi chú |
|---|---|---|---|
| FB-R5-SEC-BE-B002-01 | Major | Done (hợp đồng) – BE-B làm | V5-48 vào 0.3.13 (không giữ #94): trên đơn `cancelled`/`no_show`, mọi vai kể cả OWN – `recordPayment` chỉ `bank_transfer`/`vietqr` (422 `NOT_IN_LIST` ở `method`), thiếu ảnh 422 `REQUIRED`, ảnh của báo sale 422 `NOT_IN_LIST`, luôn `pending`, audit `afterClosure` + `reservationStatus`; `confirmPaymentReceived` và `createVietQr` → 409 `INVALID_TRANSITION` + trường mới `reservationStatus`; lỗi không ghi gì; SAL giữ mã chặn hiện nay. Làn PR-B1, tách riêng nếu PR-B1 trễ |
| FB-R5-SEC-ARC-B002-02 | Major | Done (hướng chốt 06/11, trước hạn 10/11) | 5B-1 = nhánh `recordPayment` + S1–S8: hoàn `payment_after_cancel` đứng tên người ghi, người ghi vào `origin_actor_ids` (S2); nơi nhận cố định `original_method`, `setRefundDestination` → 409, không chi tiền mặt (S3); `possibleDuplicateCodes` trên `Payment`, `ApprovalRequest` – bắt buộc khi 5B-1 lên (S4 tối thiểu); `bankReference` tùy chọn, trùng → 409 `DUPLICATE_BANK_REFERENCE` (S4 bản tốt, không migration); trần S5 nên có; `Payment.afterClosure` + `listAuditEvents.afterClosureOnly` (S6); `createDepositNotice` đơn đã đóng → 202 + `deposit_after_cancel`, ảnh không dùng làm chứng từ, audit (S7); "Không thấy tiền" có ghi chú + audit (S8). 5B-2 theo SEC mục 4 (FD/FDL/MGR/OWN không cần duyệt chỉ khi đủ 3 điều kiện, không SAL/CTV, không khi còn yêu cầu hoàn mở, audit `cancelled → hold/confirmed`, báo OWN và MGR) – 0.3.14, có migration nhỏ (kind thông báo) |
| FB-R5-SEC-ARC-B002-03 | Minor | Deferred – v1.0.6 | Tách nhiệm người ghi khoản thu trên mọi folio, thu dư tiền mặt/thẻ qua API trên đơn mở, chi tiền mặt chỉ khi có tiền mặt đủ – ARC đưa vào hợp đồng 0.3.14 cùng ô mã giao dịch ở bước đối soát |
| DOM B002-04 ý 1–4 | – | Done | (1) hoàn chỉ chuyển khoản về tài khoản đã chuyển, không đổi nơi nhận – đã ở `setRefundDestination`; (2) lỡ ghi hai lần qua `disputed` → `reversePayment` → `superseded`, không đổi hợp đồng; luật "một dòng sao kê một khoản" ở máy chủ cùng ô mã đối soát: **v1.0.6**; (3) chứng từ là thông báo tiền vào tài khoản OTTIMO – ghi ở mô tả, nhãn UXD; (4) S4 tối thiểu bắt buộc; **`bankReference` tùy chọn thêm ở 0.3.13** |


## 7. Bổ sung 1e – thẻ sau khi #94 được duyệt (PR tài liệu riêng, sau #94)

Chỉ sửa chữ `description` trong `openapi.yaml` và tệp `.md`: không đổi schema, `enum`, `required`, `x-roles`, `x-rbac`, phần mở rộng; không mã lỗi mới; không migration. Chi tiết ở contract 1.25.

| ID | Mức | Trạng thái (phần ARC) | Ghi chú |
|---|---|---|---|
| FB-R5-BE-ARC-C0313-22 | Minor | Done (chữ) – BE làm ở PR V5-48 | Theo SEC `SEC-responses.md` mục 1: `Payment.afterClosure` tính lúc đọc, chỉ để hiển thị, so `payment.created_at` của máy chủ với `cancelled_at`/`no_show_marked_at`; `afterClosureOnly` lọc theo `after.afterClosure` trong `audit_event`; allowlist `payment` (+ `afterClosure`, `reservationStatus`), `deposit_notice` (+ `afterClosure`) bắt buộc; thêm thực thể `attention_event` cho audit đóng mục `deposit_after_cancel` (S8); `refundRequestId` chưa trả tới 0.3.14; test đọc lại bảng và ca khôi phục |
| FB-R5-BE-ARC-C0313-23 | Suggestion | Done (chữ) – BE làm ở PR V5-58 | Dẫn SR-RL-10 (bổ sung 1f đổi số thành **SR-RL-15**) của SEC vào mô tả `setPropertyWifi`: đếm mỗi lần so, 5 lần / 24 giờ / người, bộ đếm PostgreSQL khóa riêng, không khóa tài khoản, quá ngưỡng bỏ qua phép so, không 429, giao dịch riêng commit trước 422. T58-11…13 |
| FB-R5-SEC-ARC-15 | Minor | Done (chữ) – BE làm ở PR-B3 | `bankReference`: chuẩn hóa chữ hoa, `CARD_NUMBER_DETECTED`, 5 điều kiện SEC 5.3; người gọi không có vai FD+ nhận 409 **không** có `duplicateReservationCode` (chọn cách này thay `x-write-roles` vì PR chỉ chữ) |
| FB-R5-SEC-ARC-16 | Minor | Done ở bổ sung 1f (PR #111) – mục 8 | `x-visible-to` cho `ApprovalRequest.possibleDuplicateCodes` đổi serializer sinh, không hợp PR chỉ chữ. ARC làm ở PR hợp đồng nhỏ riêng #111, gộp trước PR-B3 |
| FB-R5-SEC-ARC-17 | Minor | Done (chữ) – test ở PR-B1 | `confirmPaymentReceived`, `createVietQr`: 409 đơn đã đóng đi sau 403 vai và 404 phạm vi |
| FB-R5-SEC-ARC-18 | Suggestion | Deferred – 0.3.14 | Vào danh sách 0.3.14 (contract 1.25) |
| ARC review PR #96 mục 7 | – | Done | Mô tả `setParameter` (13 khóa, mã trường, luật chéo theo khoảng), `cancelScheduledParameter` (chưa kiểm lại luật chéo – 0.3.14), contract 1.24, `erd.md` 9.1a (bảng theo khóa) |
| UXD copy r1.5 mục 9.5 | – | Deferred – 0.3.14 | `FolioLine` trường chỉ đọc (`source`, `businessDate`, `rootLineId`, cờ sửa giảm cho người gọi); v1.0.5 Desk dựa vào 403 `requiredFlow = foc_request` |

## 8. Bổ sung 1f – PR #111 (gộp trước PR-B3)

Chi tiết ở contract 1.26. Một chỗ đổi phần mở rộng (ARC-16), một giá trị thêm vào tập đóng `money` cùng hằng (ARC-20); còn lại chỉ mô tả. Không mã lỗi mới, không migration.

| ID | Mức | Trạng thái (phần ARC) | Ghi chú |
|---|---|---|---|
| FB-R5-SEC-ARC-16 | Minor | Done | `ApprovalRequest.possibleDuplicateCodes` `x-visible-to` FD+; serializer sinh lại; test `serializer.test.ts` |
| FB-R5-SEC-ARC-20 | Minor | Done (hợp đồng + hằng + câu Desk) – BE-D ghi audit ở PR-B3 | `attention_event.resolved` vào tập đóng `money`, `money-actions.ts`, `mlog.a_money_not_found` (UXD rà). Hạn SEC 07/11: gộp trước PR-B3 |
| FB-R5-SEC-ARC-21 | Minor | Done (chữ) – BE-D ở PR-B3 | `duplicateReservationCode` chỉ FD+ ở bảng mã, bảng trường mở rộng, `Problem` |
| FB-R5-SEC-ARC-22 | Suggestion | Done (chữ) | `setPropertyWifi` (login_lockout, ngoại lệ bộ đếm và audit `security`), `Payment.afterClosure` (tính lúc đọc) |
| FB-R5-BE-ARC-C0313-24 | Minor | Done (chữ) – BE làm ở PR V5-58 | SR-RL-15; `rate_limit_counter` khóa `wifi_pw_cmp:<user_id>`; không `x-rate-limit`; T58-14…16. ARC chốt: câu UPSERT ra hàm dùng chung ở `shared/`, `public-site` gọi lại (contract 1.26) |
| FB-R5-BE-ARC-C0313-25 | Minor | Done (chữ; bổ sung 1g cập nhật theo SR-PAY-10 bản 07/11, mục 9) – BE làm ở PR-B3 và bản sửa `executeRefund` | Luật số thẻ riêng cho ô mã: chỉ toàn bộ giá trị 13–19 chữ số qua Luhn; bảng mã, `recordPayment` (B), `PaymentCreate.bankReference`, `executeRefund.bankReference`. `pattern` cho `executeRefund` vào 0.3.14 |
| QA review PR #103 (T14-4) | – | Done (chữ tài liệu) | Contract 1.3: T14-4 theo 1.17 – OTA → `NOT_IN_LIST` (`channelId`); `type = long` kèm `nightlyRates` → `NOT_ALLOWED`. `openapi.yaml` không đổi |
| DOM review #101/#108/#110 (3.1, 4, 101-02, 3.5) | – | Done (chữ); A4, 101-02, `typedByHand` – 0.3.14 | BR-438 "dòng gõ tay" = A30 hoặc đếm minibar, không xét riêng `source` (contract 1.20, `adjustFolioLine`, `reductionsOnly`); danh sách 0.3.14 ở contract 1.26 |
| ARC review PR #100 mục 6.3 A1–A3 | – | Done (chữ); A3 máy chủ và A4 – 0.3.14 | 6 chỗ 2FA + `erd.md`; `serializeSchema` không trả `x-self-data`; ngoại lệ cửa sổ sau nửa đêm của KPI "Khách đi" |

## 9. Bổ sung 1g – PR tài liệu sau #111 (nhánh `r5-contract-docs-1g`)

Chi tiết ở contract 1.28. Chỉ mô tả và tệp `.md`; không đổi schema, không mã lỗi mới, không migration.

| ID | Mức | Trạng thái (phần ARC) | Ghi chú |
|---|---|---|---|
| FB-R5-UXD-ARC-111-01 | Minor | Done | "8 chữ số cuối" (UXD `pay.bank_reference_card_like`, copy-v1.0.5 bản 2.1 mục 9.8) ở `recordPayment` (B), api-client sinh lại, contract 1.26 dòng C0313-25 |
| FB-R5-SEC-ARC-23 | Suggestion | Done (chữ 0.3.14) – BE-D khi làm migration | `auth_resolve_session` nhận `p_mfa_roles text[]` từ `MFA_REQUIRED_ROLES`; SQL không chứa tên vai; bỏ `mfaRequired`/`mfaRoleCache` cùng PR migration; ba điều kiện SEC (không lọc theo cơ sở; ca nhiều cơ sở D1-02 và ca ghim danh sách; test đột biến) – contract 1.26, mục 7 |
| FB-R5-SEC-ARC-24 | Suggestion | Done (chữ) – BE-D ở PR-B3 | `recordPayment` (B) thêm gạch test bắt buộc ở PR-B3: ARC-21 (SAL `recordPayment` cọc, SAL `confirmDeposit`, FD), `SEC-responses.md` 4.3, mục 5; ý 2 như UXD 111-01 |
| ORC – erd 4.14, SR-RL-15 | – | Done (trước PR này) | `erd.md` 4.14 khóa `wifi_pw_cmp:<user_id>` đã làm ở ARC review #120 (`df07ccbc`); PR này giữ bản trên `main`. Mô tả `setPropertyWifi` đã ghi SR-RL-15 từ 1f (#111) |
| FB-R5-UXD-ARC-112-02 | Suggestion | Deferred – 0.3.14 | Mã nhập tay A32 không dùng lại giá trị `CancelReasonCode`; nhóm mã lý do hủy và câu "Desk gom theo nhãn" ở `OpenRefund.reasonCode` |
| FB-R5-DOM-ARC-120-01 | Minor | Deferred – 0.3.14 (contract 1.27, ARC review #120) | Số căn chỉ gồm chữ số bị chặn khi không dính chữ số khác (`OTTIMO401`, `P-202` chặn; `OTTIMO 2026`, `OTTIMO 4012` được) |
| FB-R5-DOM-BE-121-02 | Suggestion | Deferred – 0.3.14 (contract 1.27: 422 `NOT_ALLOWED`, `field` = `isSellable`) | Chặn bật "Đang bán" khi căn chưa có giá niêm yết; Desk khóa công tắc |
| FB-R5-BE-ARC-C0313-26 | Minor | Done (chữ) – BE-D chuyển tệp ở #120 | Giữ `shared/rate-limit-counter.ts`; `public-site/public` tạo phụ thuộc vòng `identity` ↔ `public-site` |
| FB-R5-BE-ARC-C0313-27 | Minor | Done (chữ) – BE-D (test #120), QA | Cửa sổ = ngày UTC (00:00Z = 07:00 giờ Việt Nam), như SR-RL-11; T58-11 đồng hồ thử, T58-15 kiểm `app_user.failed_login_count`/`locked_until`/`status`, thêm T58-17 |
| FB-R5-BE-ARC-C0313-28 | Minor | Done (chữ) – BE-D ở PR-B3 | `resolveAttentionEvent`: `deposit_after_cancel` bắt `note` 3–500 (`REASON_REQUIRED`), audit `money` `attention_event.resolved` không có `note`; mô tả 422 và trường `note` cập nhật |
| FB-R5-BE-ARC-C0313-29 | Suggestion | Done (chữ) – BE-D ở PR-B3 | (a) hàm ở #119, PR-B3 dùng lại, `executeRefund` sửa cùng #119; (b) ARC chọn lỗi dạng trước, `CARD_NUMBER_DETECTED` chỉ khi không còn lỗi dạng (như `note`; `executeRefund` đã đúng). `PaymentCreate` làm ở PR-B3 cùng việc khai `bankReference` ở các bộ đọc (ARC 119-01), không mở lại #119. Chữ luật C0313-25 cập nhật theo SR-PAY-10 bản 07/11 (SEC 119-01, ARC 119-03) |
| FB-R5-BE-ARC-C0313-30 | Suggestion | Done (chữ) | T14-4: "OTA không có `nightlyRates`, hoặc `nightlyRates` đúng dạng" |

## 10. Bổ sung 1h – ARC review BE-H #110/#123/#131 (mục 4, 6) và ARC review #140 mục 7

Chi tiết ở contract 1.29 (đổi người chốt) và danh sách 0.3.14 ở 1.26. Có đổi schema, chỉ thêm (`ReservationPatch.closerChangeReason`, phản hồi 403/409 của `updateReservation`). Không mã lỗi mới, không migration.

| ID | Mức | Trạng thái (phần ARC) | Ghi chú |
|---|---|---|---|
| FB-R5-ARC-BE-131-02 (DOM 131-01) | Major | Done (hợp đồng 1h) – BE-H làm ở `r5-h1c`; FE-A ô lý do | Sau nhận phòng chỉ OWN, lý do bắt buộc; hoa hồng đồng bộ cùng giao dịch; 409 khi đã `payable`/`paid` |
| FB-R5-ARC-BE-131-01 (SEC 131-01) | Major | Done (`architecture.md` 5.1 + câu 0.3.14 (b)) – BE-H làm PR che hoa hồng trước tag | Cổng `audit/public/audit-visibility.ts`, dùng ở `listAuditEvents` và `getReservationHistory` |
| FB-R5-ARC-BE-110-01 | Minor | Done (câu 0.3.14 (a)) | Khung tháng kinh doanh của số đếm khác ngày lịch của danh sách |
| #123 – hai thay đổi hành vi, B13 `dates[]` | – | Deferred – 0.3.14 (c), (d) | 403 khi thân phát lại khác; multipart sau khi mất vai → 403; `dates[]` mọi đêm |
| SEC 123-01 | – | Deferred – 0.3.14 (e) | Quá 32 tầng → 422; lỗi băm ở guard → 403, không 5xx |
| T58-9, DOM FE-125-01, ARC FE-128-02 | – | Deferred – 0.3.14 (f), (g), (h) | "lần lượt"; câu `checkoutTimeNoteRequired`; `action` giữ tham số lặp |

## 11. Bổ sung 1i – BE review 1g (`BE-on-contract-0313-addendum-1g.md`), BE-H, DOM và SEC review 1h

Chi tiết ở contract 1.30. Chỉ mô tả, không đổi schema.

| ID | Mức | Trạng thái (phần ARC) | Ghi chú |
|---|---|---|---|
| FB-R5-BE-ARC-C0313-31 | Minor | Done – phương án B | Ô mã giống số thẻ báo trước; #148 không đổi mã, thêm ca (iv) |
| FB-R5-BE-ARC-C0313-32 | Minor | Done (chữ) – BE-D2 thêm ca SAL `confirmDeposit` 409 và ca (iv) ở #148 | SR-PAY-10 bản 07/11; ca HTTP từng đường; `GroupDepositInput` R3; câu "từ chối trường lạ" sửa |
| FB-R5-BE-ARC-C0313-33 | Suggestion | Deferred – 0.3.14 (i) | `DEFAULT NULL`, DROP + cấp quyền lại |
| FB-R5-BE-ARC-1H-01 | Suggestion | Done (ghi ngay ở 1i) | Đơn `checked_out` chỉ nhận người chốt |
| FB-R5-BE-ARC-1H-02 | Suggestion | Done | Luật đạt của B18; `recognized_at` = lúc sửa |
| FB-R5-DOM-ARC-1H-01 | Minor | Done (chữ) – OPS làm ở runbook | Hai danh sách từ `reservation_change`, chạy sau khi `r5-h1c` lên; repo chỉ ghi 0 / > 0 |
| FB-R5-DOM-ARC-1H-02 | Minor | Không thuộc ARC – BA, PO | Sổ tay và release notes cùng tag có `r5-h1c` |
| FB-R5-DOM-ARC-1H-03 | Minor | Deferred v1.3 (US-089) | v1.0.5 giữ 409 |
| FB-R5-DOM-ARC-1H-04 | Suggestion | Đồng ý hướng – BE-H quyết làm trong `r5-h1c` hay v1.0.6 | Không đổi chữ hợp đồng |
| FB-R5-DOM-ARC-1H-05 | Suggestion | Ghi ở `updateReservation` (nên có) – FE-A, UXD | Không đổi hợp đồng |
| FB-R5-SEC-ARC-1H-01 | Minor | Done (chữ) – BE-H sửa `r5-h1c` trước khi gộp | Lý do ở cột `reason` của audit; không thêm `reason` vào allowlist `reservation` |
| FB-R5-SEC-ARC-1H-02 | Minor | Done (chữ, phương án (a)) – BE làm ở PR-M | Không ghi số thưởng vào audit; 0.3.14 (b), `architecture.md` 5.1 |
| FB-R5-SEC-ARC-1H-03 | Suggestion | Ý 1, 2 Done (chữ) – BE-H ở `r5-h1c`; ý 3 Deferred 0.3.14 (j) – BA | `access.denied` cả hai nhánh 403; thứ tự 403 → 422 → 409 |

