# SEC review – PR BE #190 `r5-fb012-be-statements` (FB-INV-012, phiếu thanh toán tháng khách dài hạn)

- Round 5 – bước Review. Người review: SEC. Tác giả: BE.
- Phiên bản đã đọc: head `abcafa10` (đọc bằng `gh pr diff 190` và `git show abcafa10:<file>`, không checkout trong checkout chung).
- Căn cứ: `rounds/round-05/fb-inv-012/contract.md` mục 4, 5, 6.6, 8, 9; `attachment.service.ts` (SEC I5, BE-65).

## Kết luận

**ĐẠT CÓ ĐIỀU KIỆN.** Không có Blocker. Có 2 thẻ Major phải xử lý trong round, trước khi bật trên production:
1. Ảnh đồng hồ không có mốc retention. Ảnh không bao giờ bị xóa, và lưới an toàn `anchorMissing` cũng không đếm loại ảnh này.
2. Điều chỉnh kỳ trước (tiền, FDL+) không được ghi nhật ký lúc đặt. Lúc phát hành, nhật ký cũng không ghi khoản này.

Merge vào main được nếu tính năng chưa mở trên production cho tới khi 2 thẻ Major đóng. Quyết định merge thuộc ORC.

## Đối chiếu điểm SEC (contract mục 9)

| # | Điểm | Kết quả |
|---|---|---|
| 9.1 | Dữ liệu cá nhân trên trang in | Đạt phần chính. `print` trả `guest.fullName`, số căn, kỳ và số tiền. `property.email = null`. Không có SĐT, email, quốc tịch hay số giấy tờ của khách; test khẳng định điều này ở dòng 546. Nhân viên chỉ hiện chữ viết tắt (tối đa 4 ký tự). Danh sách và ứng viên chỉ trả `shortGuestName`. Còn lệch: dữ liệu in mang theo `note`, `priorAdjustment.reason`, `voidReason`, `ratesSnapshot` và `folioId` (thẻ 03). |
| 9.2 | VietQR | Chấp nhận, giống QR lúc nhận/trả phòng. Payload do server dựng từ `receivingAccountInEffect`. Số tài khoản đầy đủ chỉ nằm trong payload QR, phần chữ chỉ hiện 4 số cuối. Nội dung chuyển khoản = `normalizeTransferContent(code)`: chỉ mã phiếu (có số căn), không tên khách. Không có QR khi số dư bằng 0 hoặc phiếu chưa phát hành. Ghi thu đi qua `payments.recordInTx` có sẵn (test dòng 298: `reconciliation: 'pending'`). Thiếu test có tài khoản nhận (thẻ 04). |
| 9.3 | Ảnh đồng hồ | `assertUsable(…, 'meter', {reservationId})` và `bindTo` dạng compare-and-set: đúng. **Chưa có mốc retention** (thẻ 01). |
| 9.4 | IDOR, tenant | Đạt. 3 bảng mới đều `ENABLE` + `FORCE RLS`, policy `tenant_isolation` có cả `USING` và `WITH CHECK`. Mọi FK đều kèm `property_id`, trừ `photo_attachment_id` (thẻ 05). `excludedFolioLineIds` chỉ nhận dòng dịch vụ của đúng folio và đúng kỳ, sai → `NOT_IN_LIST`. `roomId` phải thuộc segment của đơn. Có test RLS cơ sở khác → 404. |
| 9.5 | Nhật ký | Có `meter_reading.recorded/exception/voided` và `billing_period.issued/voided/printed/payment_recorded/payment_status_changed`. Allowlist chỉ có số và trạng thái, không có ghi chú hay dữ liệu khách. `note`, `void_reason`, `prior_adjustment_reason` và `reason` đều qua `freeText` (lọc số thẻ qua `optionalText`, lọc số giấy tờ qua `looksLikeIdNumber`). **Thiếu nhật ký khi sửa phiếu nháp** (thẻ 02). Thay đổi 3 tham số đi qua `setParameter` có sẵn, đã ghi trước/sau. |
| 9.6 | Giá điện bán lại | Không phải lỗ hổng. Vẫn chờ kế toán (rủi ro pháp lý đã ghi ở contract). |

## Phân quyền

- 12 operation đều có `x-roles: [owner, manager, front_desk_lead, front_desk]`. HK, MT, SAL và CTV → 403, có test cho cả 4 vai trên đọc, in, tạo và ghi thu. MT bị loại khỏi A123 đúng theo SEC D18 (MT không thấy tên khách).
- Điều kiện FDL+ được kiểm ở service:
  - ngoại lệ đồng hồ và miễn ảnh → FD 403;
  - `priorAdjustment` → FD 403;
  - hủy phiếu đã phát hành → FD 403.
- `availableActions` khớp với các điều kiện trên.
- 3 tham số `utility_unit_price`, `utility_vat_rate`, `monthly_statement_rules` có `edit_roles '{owner}'` trong migration. Có hook kiểm biên. Test: MGR → 403, ngoài biên → 422.
- Không thấy đường nào để client tự gắn `billingPeriodId` vào payment: `checkPaymentShape` vẫn từ chối, chỉ module billing được truyền.

## Migration 0099

- Chỉ thêm: 3 bảng mới và 3 dòng `config_parameter_def` với `ON CONFLICT DO NOTHING`. Không `UPDATE`/`DELETE` dữ liệu cũ.
- Quyền tối thiểu, tốt:
  - `meter_reading`: chỉ cho `UPDATE` các cột hủy;
  - `billing_period_line`: chỉ `UPDATE (active)`;
  - `billing_period`: các cột định danh (đơn, folio, tháng, loại, phiếu thay) chỉ ghi lúc `INSERT`;
  - không cấp `DELETE` cho `ottimo_app`.
- CHECK độ dài 3–300 cho mọi trường chữ tự do; CHECK kiểu jsonb là `object`.
- Chưa chạy trên bản sao staging (BE đã nêu). Đây là việc QA/OPS theo tiêu chí 8.11, không phải lỗi bảo mật.

## Test data và bí mật

- Dữ liệu test là dữ liệu giả: "Nguyễn Văn Minh", "Test property 0" và các số liệu của DOM.
- Token phiên lấy từ fixture (`t.users[u].sessionToken`), không viết cứng.
- Quét toàn bộ diff (trừ snapshot): không có khóa API, mật khẩu, JWT hay số tài khoản/số thẻ dạng thật. Test VietQR chỉ có trường hợp `vietqr: null`, nên không có số tài khoản nào trong repo.

## Thẻ feedback

### FB-R5-SEC-BE-190-01
- Mức độ: Major
- Vị trí: `modules/billing/internal/meter-readings.service.ts` dòng 461 (`bindTo` không có `retentionAnchorAt`); `modules/files/public/attachment.service.ts` dòng 366–371 (`anchorMissing` chỉ đếm `work_order`, `inspection`, `penalty_evidence`); `registration.service.ts` dòng 2506 (checkout chỉ đặt mốc cho `penalty_evidence`).
- Vấn đề:
  - Ảnh `purpose=meter` được gắn vào `meter_reading` nhưng không luồng nào đặt `retention_anchor_at`.
  - `purgeDue` chỉ xóa khi có mốc, hoặc khi ảnh chưa gắn. Ảnh đồng hồ đã gắn vì vậy được giữ vô thời hạn.
  - Lưới an toàn BE-65 (b2) không liệt kê `meter`, nên J16 cũng không báo thiếu mốc.
  - Ảnh của lần đọc đã hủy cũng nằm lại mãi.
- Vì sao quan trọng:
  - SR SEC I5 yêu cầu mọi ảnh có thời hạn lưu. Contract 9.3 giả định hết hợp đồng + 12 tháng (`attachment_ops_retention_months`, mặc định 12).
  - Ảnh chụp trong căn của khách có thể lọt cả đồ dùng cá nhân hoặc người. Giữ vô thời hạn trái nguyên tắc tối thiểu hóa dữ liệu (Nghị định 13/2023, cần xác nhận pháp lý).
- Đề xuất sửa:
  - (a) Khi đơn dài hạn trả phòng, kể cả khi hủy/no-show với ảnh đã có, đặt mốc cho mọi ảnh `meter` gắn với `meter_reading` của đơn. Cách làm: `setRetentionAnchorForRef` theo từng lần đọc, hoặc `setRetentionAnchor({reservationId, purpose:'meter'})` nếu chắc ảnh upload có `reservation_id`. Hiện `assertUsable` vẫn cho ảnh có `reservation_id` null, nên an toàn hơn là đặt theo lần đọc.
  - (b) Thêm `meter` vào danh sách `anchorMissing` của J16.
  - (c) Thêm test: trả phòng → ảnh có mốc; mốc + 12 tháng → J16 xóa.
  - Ảnh của lần đọc đã hủy theo cùng mốc với đơn, để còn đối chiếu nếu khách khiếu nại.
- Trạng thái: Open

### FB-R5-SEC-BE-190-02
- Mức độ: Major
- Vị trí: `statements.service.ts` `update()` dòng 1276–1350; `issue()` dòng 1520–1536; `modules/billing/audit-entities.ts`.
- Vấn đề:
  - `updateBillingPeriod` ghi `prior_adjustment_vnd` (tới ±1 tỷ, âm là giảm cho khách) và `excluded_folio_line_ids` (bỏ dòng dịch vụ khỏi phiếu) mà không ghi nhật ký.
  - Nhật ký `billing_period.issued` chỉ có `totalVnd`, không có khoản điều chỉnh hay số dòng bị loại.
  - Hệ quả: FDL đặt một khoản giảm, sau đó FD phát hành, thì nhật ký chỉ ghi FD. Không truy được ai đã quyết khoản tiền.
- Vì sao quan trọng: đây là thao tác đổi tiền khách phải trả. SR-AUD yêu cầu ghi ai, khi nào và trước/sau với mọi thay đổi về tiền. Đây cũng là đường dễ bị lạm dụng (giảm tiền cho người quen).
- Đề xuất sửa:
  - Ghi `billing_period.updated` khi `priorAdjustment` hoặc `excludedFolioLineIds` đổi, với `before`/`after` là `{priorAdjustmentVnd, excludedFolioLineCount}`. Lý do điều chỉnh đi vào trường `reason` của audit (đã qua `freeText`).
  - Thêm `priorAdjustmentVnd` và `excludedFolioLineCount` vào allowlist `billing_period`, đồng thời vào `after` của `issued`.
  - Thêm 1 test.
- Trạng thái: Open

### FB-R5-SEC-BE-190-03
- Mức độ: Minor
- Vị trí: `statements.service.ts` `print()` dòng 1778–1790 (`...statement`).
- Vấn đề: dữ liệu trang in trải toàn bộ view nội bộ: `note`, `priorAdjustment.reason`, `voidReason`, `ratesSnapshot`, `folioId`, `excludedFolioLineIds`, `availableActions`, `folioLineId` từng dòng. Contract 9.1 nói giấy chỉ có họ tên, căn, kỳ và tiền, không có ghi chú nội bộ. Người gọi vẫn là nhân viên có quyền xem phiếu, nên chưa lộ ra đối tượng mới. Nhưng chỉ cần FE in nhầm một trường là ghi chú nội bộ ra giấy khách.
- Vì sao quan trọng: tối thiểu hóa dữ liệu ngay ở nguồn, thay vì dựa vào FE nhớ không in.
- Đề xuất sửa: `print()` trả một view theo allowlist, đúng bố cục contract 6.6: mã, tháng, kỳ, hạn, căn, họ tên, dòng (nhãn, chỉ số, số lượng, đơn giá, VAT, thành tiền), tổng, VietQR, hotline, giờ in, chữ viết tắt. Kèm test `not.toMatch(/note|reason|folioId/)`.
- Trạng thái: Open

### FB-R5-SEC-BE-190-04
- Mức độ: Minor
- Vị trí: `test/integration/fb-inv-012-statements.test.ts` dòng 533–558.
- Vấn đề: chỉ có test `vietqr: null` (không có tài khoản nhận). Chưa có test khẳng định:
  - (a) `transferContent` chỉ là mã phiếu, không chứa tên khách;
  - (b) `accountNoMasked` chỉ hiện 4 số cuối và số tài khoản đầy đủ chỉ nằm trong `payload`;
  - (c) `amountVnd` của QR = số dư còn lại;
  - (d) số dư bằng 0 → không có QR.
- Vì sao quan trọng: đây là các bất biến SEC đã chấp nhận ở 9.2. Hồi quy sau này sẽ không bị phát hiện.
- Đề xuất sửa: seed một tài khoản nhận giả (STK test kiểu `0000000000`, BIN công khai của ngân hàng) rồi thêm 4 assert trên. Không dùng số tài khoản thật.
- Trạng thái: Open

### FB-R5-SEC-BE-190-05
- Mức độ: Suggestion
- Vị trí: `0099_monthly_statement_fb_inv_012.sql` dòng 150 (`meter_reading_photo_fk` chỉ trên `attachment(id)`).
- Vấn đề: các FK khác đều kèm `property_id`, riêng FK ảnh thì không. Hiện đã có RLS trên `attachment` và `assertUsable` chặn, nên chưa khai thác được.
- Đề xuất sửa: khi nào `attachment` có unique `(property_id, id)` thì đổi sang FK ghép, cho đồng bộ phòng thủ nhiều lớp. Không cần làm trong PR này.
- Trạng thái: Open

### FB-R5-SEC-BE-190-06
- Mức độ: Suggestion
- Vị trí: `statements.service.ts` `void()` dòng 1555–1558.
- Vấn đề: FD hủy phiếu đã thu nhận `409 STATEMENT_HAS_PAYMENTS` kèm `paidVnd` trước khi bị kiểm quyền. Lộ thông tin rất nhỏ, vì FD vốn xem được số đã thu.
- Đề xuất sửa: kiểm `isFdlPlus` trước, ngay khi `status !== 'draft'`, để thứ tự lỗi nhất quán: 403 trước 409.
- Trạng thái: Open

## Ghi nhận (chấp nhận, không cần sửa)

- `previousClosing` lấy lần đọc cuối của căn, kể cả của khách trước, để tính `gap`. FD+ vì vậy thấy chỉ số và ngày đọc của khách trước. Đây chỉ là số đồng hồ, không phải dữ liệu cá nhân, nên SEC chấp nhận.
- Mã phiếu (`TT-2612-202`) có số căn và đi vào nội dung chuyển khoản trên sao kê ngân hàng. Như vậy chấp nhận được, vì không có tên khách.
- `GET …/print` có ghi nhật ký: đúng ý contract 9.5.

## Điểm làm tốt

- Quyền DB tối thiểu theo cột: dòng phiếu chỉ đổi được `active`, lần đọc chỉ hủy được, không sửa giá trị. Đây là mẫu nên giữ cho các bảng tiền sau này.
- Mọi chữ tự do qua một bộ lọc chung (số thẻ và số giấy tờ). Allowlist audit chỉ có số và trạng thái.
- Có test RBAC đủ 8 vai, test RLS cơ sở khác, test UK chống một dòng folio nằm trên hai phiếu.
