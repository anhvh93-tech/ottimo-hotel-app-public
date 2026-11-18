# ARC review PR #197 (BE) – FB-INV-012 gói sửa trước ra mắt v1.0.7 (contract §12)

- Round 5, bước **Review** kỹ thuật. Người review: ARC. Ngày 18/11/2026.
- PR: #197, nhánh `r5-fb012-golive-be`, head **`a1bd464f`** (merge `origin/main` vào `27d7c402`). Base so sánh: `13d6b019`.
- Phạm vi PR: §12.1, §12.2, §12.3, §12.6, migration 0100 (đủ 5 mục §12.7, kể cả phần DB của 12.4/12.5). Code 12.4, 12.5, BE-10 và test 190-07 dời sang PR sau (theo phạm vi tối thiểu §12.10).
- Đã đọc: `gh pr diff 197` (50 file), `rounds/round-05/responses/BE-responses.md` mục "Go-live fix" (trong PR), `rounds/round-05/reviews/SEC-on-arc-contract-12.md`, `rounds/round-05/reviews/UXD-on-fe-pr-196.md` (196-01), contract §12.
- Cách kiểm:
  - worktree tạm ở scratchpad tại `a1bd464f` và `13d6b019`; đã xóa sau review;
  - `gen_traceability.py --strict`: rc 0, `ops mismatched 0`, `fields mismatched 1`. Main `13d6b019` cũng ra `fields mismatched 1`, nên đây không phải lỗi do PR;
  - `gen_rbac_cases.py --check`: OK (226 operation, 2486 ca);
  - `gen-openapi-meta.mjs --check`: up to date; `api-client gen` chạy lại: không đổi byte nào;
  - CI của `a1bd464f`: mọi job xanh (contract `--strict`, Redocly, test có PostgreSQL thật, E2E smoke, gitleaks, shellcheck). Log CI cho thấy `fb-inv-012-golive.test.ts` (11 ca), `fb-inv-012-golive-units.test.ts` (7 ca) và `migrate-lock-timeout.test.ts` (2 ca) đều chạy và xanh.
- Không dữ liệu khách, không số hoa hồng trong tài liệu này.

## 0. Kết luận

**Cập nhật 18/11 (recheck `099fd1fc`): DUYỆT gộp, không còn Major mở – xem mục 10.**

**ĐẠT CÓ ĐIỀU KIỆN** (lượt đầu, `a1bd464f`). Gộp được khi xong **thẻ 197-01** (Major: thêm 1 test tích hợp cho đường đảo và hoàn tiền của khoản `outside_desk`). Thẻ này chỉ thêm test, không đổi mã. 6 Minor, 2 Suggestion, không chặn v1.0.7. Không ESC.

Kiến trúc đúng hợp đồng:
- `checkInBackdated` là đường riêng. `checkIn` không đổi một dòng (G1).
- `outside_desk` là một khoản `payment`, không phải dòng điều chỉnh (G4).
- Liên hệ cơ sở theo mẫu Wi-Fi (G5).
- `lock_timeout` đặt sau khóa advisory (G9).
- Ba thẻ Major của SEC (12-01/02/03) đã làm đúng control SEC ghi, có test.

## 1. Đối chiếu hợp đồng

| Mục | Kết quả | Ghi chú |
|---|---|---|
| 12.1 biên ngày đến (`shared/backdate.ts`) | Đúng | Một hàm cho cả hai đường. 45 là hằng số. Tháng trước: chỉ tới `cuối tháng + daysAfter + lateMaxDays`. Hai tháng trước → `PREVIOUS_MONTH_CLOSED`. Đọc `monthly_statement_rules` có hiệu lực ngày T. Có unit test |
| 12.1.1 `createReservation.backdatedArrival` | Đúng | Kiểm vai theo trường, sau rollback ghi một `access.denied`. Chỉ đi kèm `manualLongStay`. Chặn `closerUserId` (SEC 12-01 ý 1). Cờ `backdatedArrival` nằm trong ảnh chụp giá (để chặn đổi người chốt). `syncLeaseNights` như cũ. Thông báo OWN chỉ có mã đơn. Job no-show: BE đã rà, không có job nào quét (đúng yêu cầu "kiểm trước khi code") |
| 12.1.2 `checkInBackdated` | Đúng | Thứ tự kiểm đúng bảng. Bỏ `room_ready`, thêm `room_occupied`. 11 trường của `checkIn` → `NOT_ALLOWED`. `actual_checkin_at` = giờ bấm. Không có dòng folio, không thu tiền. Buồng → OC. Hook B9 chỉ có listener hủy/no-show, nên không gây tác dụng phụ. Hạn khai báo tạm trú tính từ giờ bấm. Dời ngày đến dùng `occupancy.update` + `syncLeaseNights` |
| 12.1.3 chỉ số nhận phòng bù | Đúng | `readOn` ∈ [ngày đến − 1, T], luôn ghi trễ, FDL+ phải có lý do. Hạn = `checkin_backdated_on + daysAfter + lateMaxDays`. SEC 12-06: không được trước lần đọc còn hiệu lực gần nhất của căn |
| 12.2 `settleBillingPeriodOutsideDesk` | Đúng, có lệch đã chấp nhận (mục 2) | `recordInTx` chỉ rẽ sang đường `outside_desk` khi có `source`, nếu không thì ném lỗi lập trình (SEC 12-03 ý 2). Phạm vi MGR đủ 3 điều kiện (SEC 12-02). `refreshPaid`, audit `money`, `money-actions.ts`, chặn `original_method`. Phiếu in không đọc `payment.note`, nên lý do không lên phiếu |
| 12.2 bảng "nơi đọc `payment.method`" | Đúng | BE rà bằng grep, danh sách ghi trong PR. Không có báo cáo "thu theo phương thức" ở server, nên dòng đó của contract chỉ áp cho FE (Nhật ký tiền) |
| 12.3 liên hệ cơ sở | Đúng | Chuẩn hóa hotline, lọc ký tự điều khiển/bidi/zero-width ở `addressLine` (SEC 12-04 b), không lặp lại giá trị đã gửi, `no-store`, audit trước/sau. `defineAuditEntity('property', …)` gọi hai lần sẽ **gộp** allowlist (`audit-fields.ts` dòng 23–24), nên audit Wi-Fi không mất trường |
| 12.6 `lock_timeout` | Đúng | Kiểm giá trị trước khi kết nối, không đưa chữ người dùng vào SQL. 55P03 → `MigrationLockTimeoutError` kèm tên migration chờ. Có `RESET`, `finally` luôn mở khóa advisory. Test Q25 dùng 1 s |
| 12.7 migration 0100 | Đúng | Xem mục 3 |
| 12.8 OpenAPI 0.3.15-draft | Đúng phần trong phạm vi | Tách enum `PaymentMethod` / `PaymentMethodInput`. `PaymentCreate.method` → Input. 4 chỗ còn `$ref PaymentMethod` đều ở phản hồi hoặc tham số lọc (`listPayments`, `ShiftReport`, `Payment`, bill `refunds`). `catchUp`, `folioId`, `priceSource` chưa có, đúng phạm vi. Thiếu mô tả vài mã trường (thẻ 197-05) |
| 12.9 RBAC | Đúng | A127–A130 có trong `.md` và `.json` (0.2.11, cùng commit). Ghi chú 50. Mục 3 và `screens.ts` không đổi |
| 12.10 BE-12 / Q16 | Đúng | Mục 5 |

## 2. Chín điểm lệch BE nêu

| # | Lệch | ARC | Lý do / điều kiện |
|---|---|---|---|
| 1 | CHECK `payment_outside_desk_check` miễn `billing_period_id` + `note` cho dòng đảo (`reversal_of_id` có giá trị) | **Chấp nhận** | `reverse()` (`payments.service.ts` ~1063) chép `type`, `method`, đặt `not_required`, `shift_id` null, không chép phiếu/ghi chú. Không miễn thì A34 trên khoản này trả 500. Dòng đảo vẫn phải là `charge`, `not_required`, không ca. **Điều kiện:** có test (thẻ 197-01). Gợi ý siết thêm ở 197-S1 |
| 2 | `reference` nối vào `payment.note` (`<lý do> \| ref <tham chiếu>`), không thêm cột | **Chấp nhận** | Không cần migration thêm. `note` không giới hạn độ dài, tối đa 300 + 7 + 64 ký tự. Phiếu in và trang khách không đọc `payment.note`. Chặn số thẻ và chuỗi toàn số từ 9 chữ số |
| 3 | Dời ngày đến chỉ cho đơn một đoạn, khác → 422 `arrivalDate: NOT_ALLOWED` | **Chấp nhận** | Đơn dài hạn nhập tay chưa nhận phòng luôn chỉ có một đoạn. Ghi vào contract 12.14 |
| 4 | `USE_CHECK_IN` chỉ ở `checkInBackdated`. `createReservation` có ngày đến = T kèm `backdatedArrival` → `BACKDATE_OUT_OF_RANGE` | **Chấp nhận** | Đúng biên [T − 45, T − 1] của 12.1. Ở `createReservation`, không gửi `backdatedArrival` là đường đúng cho ngày hôm nay. Minor: mã này trả kèm `earliest` (thẻ 197-05) |
| 5 | Thông báo `statement_settled_outside_desk` chỉ có mã phiếu và id đơn, không có số tiền và người ghi | **Chấp nhận** | SEC A5 (không số tiền trong `staff_notification`) đứng trên câu chữ của 12.2. Audit `money` có đủ số tiền, ngày nhận, người ghi. Contract 12.2 sửa theo |
| 6 | `amountVnd` mặc định = còn phải thu. Với MGR, nếu khoản này lớn hơn phần thuê chưa thu thì 403 | **Chấp nhận** | Đúng 12.2 và SEC 12-02 (b). FE phải điền sẵn phần thuê cho MGR (UXD 196-08). Thẻ 197-02 giảm 403 thừa |
| 7 | 12.4, 12.5, BE-10, test 190-07 chưa làm. A130 có trong RBAC nhưng chưa gắn operation | **Chấp nhận** | Theo phạm vi tối thiểu §12.10. Hạn: 12.4 ngày 29/11, 12.5 ngày 11/12, 190-07 ngày 31/12. Phần DB đã có trong 0100, nên không cần migration thứ hai. A130: mục 4. Khóa giá dọn đã sửa được mà chưa có hook: thẻ 197-03 |
| 8 | Test SEC 12-03 đọc `openapi.yaml`, không đọc `generated/openapi-schemas.ts` | **Chấp nhận** | File sinh ra chỉ có hình dạng phản hồi, không có enum hay thân yêu cầu. Thân yêu cầu được kiểm bằng zod viết tay và `checkPaymentShape` (`R2_METHODS`), mà nguồn là spec. Test duyệt mọi `requestBody` theo `$ref` là đúng nguồn sự thật. Thêm ca tích hợp `recordPayment` → 422 `NOT_IN_LIST` là đủ cho Q13 |
| 9 | SEC 12-04 (a) chưa làm: miễn trừ hotline vẫn so 9 số cuối | **Chấp nhận dời**, hạn 31/12 | Chỉ OWN đổi được hotline, nên rủi ro thấp. Còn thiếu (d): thiết bị tin cậy và thông báo cho các OWN khác khi đổi hotline. BE responses không nhắc mục này. Thẻ 197-04 |

## 3. Migration 0100: chỉ thêm, expand-first, quay lui

**Chỉ thêm: đạt.**
- Không có `UPDATE`/`DELETE`.
- Hai cột `reservation` cho phép null, không mặc định, nên chỉ đổi metadata.
- `meter_reading.catch_up` `DEFAULT false NOT NULL`: PG ≥ 11 không ghi lại bảng. Bảng của 0099 lại chưa có dòng.
- `payment_method_check` và `staff_notification_kind_check` bỏ rồi thêm lại trong **cùng giao dịch**, mỗi lần là tập cha của tập cũ.
- CHECK mới chỉ ràng buộc giá trị mới (`outside_desk`, `catch_up = true`, cặp backdated). Dòng cũ đều thỏa, nên `convalidated` = true.
- `config_parameter_def`: `INSERT … ON CONFLICT DO NOTHING`, mặc định `{}`. `production-defaults` không ghi dòng mới.
- Journal idx 74, `when` = 0099 + 2000 ms. `0100_snapshot.prevId` = id của `0099_snapshot` (`e2fd14ab…`). `origin/main` còn ở idx 73, nên không trùng. 0101 thuộc FB-INV-013 (G8).

**Expand-first: đạt.** Không có bước contract nào (không bỏ cột, không đổi kiểu, không siết tập giá trị cũ). Mã cũ và mã mới cùng chạy được trên DB 75.

**Khóa trên production:**
- Các `ALTER` lấy ACCESS EXCLUSIVE ngắn trên `payment`, `reservation`, `staff_notification`, `meter_reading`. Mỗi CHECK quét số dòng nhỏ.
- `lock_timeout` 10 s là lớp thứ hai, sau bước OPS kiểm `pg_locks`.
- Hết giờ thì cả 0099 và 0100 rollback cùng nhau (một giao dịch drizzle). Test Q25 khẳng định `__drizzle_migrations` không thêm dòng.

**Quay lui về `sha-f8791cf83b63` (image ở migration 73), DB có 0099 + 0100: an toàn.** Đã kiểm 5 điểm:
1. `rollback.sh` chỉ đổi image, không chạy migrate (dòng 6). Api và worker không bao giờ migrate.
2. Image cũ không bao giờ ghi giá trị mới. Mọi dòng nó ghi đều thỏa CHECK mới: cặp backdated null/null, `catch_up` mặc định false, các `kind` cũ.
3. Đọc khoản `outside_desk` có sẵn: `generated/openapi-schemas.ts` của image cũ không có enum, nên bộ lọc phản hồi không từ chối. Số dư folio của image cũ tính nó là `charge succeeded`, nên vẫn đúng tiền. Desk cũ hiện mã thô `outside_desk` (đúng như §12.7 đã nêu).
4. Image cũ **đảo** khoản `outside_desk` được: dòng đảo có `reversal_of_id`, nên qua được CHECK (lệch 1).
5. Image cũ **hoàn tiền** qua `original_method` từ khoản `outside_desk` (nó không có chặn mới): dòng `refund` với `method = outside_desk` vi phạm `payment_outside_desk_check` (`type` phải là `charge`), nên 500 và giao dịch rollback. Không tiền nào chi ra. Lỗi đóng chặt (fail closed), chấp nhận được trong thời gian quay lui.

## 4. A130 có trong RBAC nhưng chưa gắn operation

- **`--strict`: không sao.** `gen_traceability.py` chỉ dừng khi `x-roles` có vai thừa so với ma trận, có rò trường, hoặc `x-rbac-field` lạ. Một hành động có `operationIds: []` không sinh ra cặp nào để so. Đã có tiền lệ: hơn 30 hành động cũng rỗng (A08, A88, A89, A103…). Chạy thật: rc 0. `gen_rbac_cases.py --check` OK, không có ca nào cho A130.
- **Phát hành v1.0.7: không sao, với 3 điều kiện** (đều đã đủ):
  - (a) dòng A130 và ghi chú 50 ghi rõ "chưa có operation ở 0.3.15";
  - (b) `screens.ts` / `Me.screens` không đổi;
  - (c) FE #196 tắt `catchUp` bằng cờ `goLiveDeferred.catchUp = false`. UI không hiện nút "Đọc bù" khi server chưa nhận `catchUp`.
- Khi PR 12.5 lên: A130 là **quyền theo trường** của `recordMeterReading` (đang gắn A123), giống A127 với `createReservation`. Giữ `operationIds` rỗng, thêm `note`, thêm ca trường vào `rbac-cases` (FD/FDL gửi `catchUp` → 403). Không gắn `x-rbac: [A130]` vào `recordMeterReading`, vì làm thế FD/FDL sẽ lệch `x-roles` và `--strict` sẽ đỏ.

## 5. Q16: phiếu cuối không thu hai lần

**Đạt.** Test `BE-12 / Q16` (`fb-inv-012-golive.test.ts` ~556), chạy trên PostgreSQL thật:
- đơn tạo ngày đến 03/11, nhận phòng bù với ngày đến 01/11, đi 15/01/2027;
- phiếu 11 phát hành, ghi ngoài Desk (MGR phần thuê, OWN phần còn lại);
- phiếu 12 phát hành, OWN ghi ngoài Desk;
- phiếu cuối 01/2027: tiền thuê = 20.962.000 − thuê 11 − thuê 12.

`priorRentVnd` không đổi. Nó cộng dòng `rent` của phiếu `issued`/`partially_paid`/`paid`, không xét phiếu được thu bằng cách nào. Đúng G3: một đường tiền duy nhất.

Khác Q16 một điểm nhỏ: phiếu 12 trong test được ghi ngoài Desk, còn Q16 nói "thu thường". Không ảnh hưởng, vì công thức không đọc `payment`. QA chạy Q16 đúng nguyên văn trên staging (12.11).

## 6. Đồng bộ OpenAPI / RBAC / file sinh

| Kiểm | Kết quả |
|---|---|
| `openapi-meta.ts`, `openapi-schemas.ts` | `--check` up to date. Meta của `checkInBackdated` và `settleBillingPeriodOutsideDesk` đều có `trustedDevice: true`, `idempotencyKey`, `ifMatch`. `setPropertyContact` có `roles: ['owner']` |
| `api-client/src/generated/openapi.ts` | Sinh lại không đổi byte nào. `types.ts` xuất `PaymentMethodInput` |
| `rbac-matrix.md` ↔ `.json` | Cùng 0.2.11, cùng commit, `--strict` rc 0 |
| `rbac-cases.json/csv` | `--check` OK |
| `erd.md` | Có cột mới, phương thức mới, dòng lịch sử |
| FE trong PR BE | 5 file `admin-web` đổi kiểu `PaymentMethod` → `PaymentMethodInput`. Bắt buộc phải đổi: `PaymentCreate.method` nay hẹp hơn, giữ kiểu cũ thì typecheck đỏ. Không đổi hành vi. Xem 197-S2 về thứ tự gộp với #196 |

## 7. Thẻ feedback

### FB-R5-ARC-BE-197-01
- Mức độ: Major
- Vị trí: `test/integration/fb-inv-012-golive.test.ts`; `payments.service.ts` `reverse()` (~1039–1100); `refunds.service.ts` (~846); CHECK `payment_outside_desk_check` (0100).
- Vấn đề: lệch 1 nới một CHECK DB đúng để đường đảo A34 chạy được trên khoản `outside_desk`. Chặn hoàn tiền là mã mới. Nhưng PR không có test nào gọi `reversePayment` hay `createRefund` trên khoản này (grep `reverse|refund` trong file test: 0 kết quả). Contract §12.11 Q14 có ca này. BE-12 giao "mục QA phần BE".
- Vì sao quan trọng: đây là đường sửa sai duy nhất khi ghi nhầm "ngoài app" lúc ra mắt. Nếu listener đảo không lùi `paid_vnd` và trạng thái phiếu, hoặc CHECK chặn dòng đảo, thì 500 ngay đúng lúc cần sửa tiền. Đọc mã thấy đúng, nhưng chưa có gì chứng minh khi chạy.
- Đề xuất sửa: thêm **một** ca tích hợp (không đổi mã):
  1. MGR ghi ngoài Desk một phần phiếu 11 → `partially_paid`;
  2. MGR `reversePayment` khoản đó → 200, dòng đảo `method = outside_desk`, `reversal_of_id` có giá trị, `shift_id` null; phiếu lùi về `issued`, `paidVnd` = 0;
  3. tạo tình huống có số dư âm (hoặc dùng mẫu sẵn của `refunds` test) với khoản thu gần nhất là `outside_desk`, gọi `createRefund` `original_method` → 422 `refundMethod: NOT_ALLOWED`.
- Trạng thái: Closed (recheck `099fd1fc`): ca tích hợp mới chứng minh đảo → phiếu về `issued`, `paidVnd` 0, dòng đảo `outside_desk` âm, không ca; `executeRefund` `original_method` → 422 `refundMethod: NOT_ALLOWED`. Đổi thứ tự trong `refunds.service.ts` chấp nhận (mục 10)

### FB-R5-ARC-BE-197-02
- Mức độ: Minor
- Vị trí: `statements.service.ts` `actions()` (~924).
- Vấn đề: MGR thấy `settle_outside_desk` trên **mọi** phiếu còn nợ, kể cả phiếu 12 trở đi và đơn không nhận phòng bù. Bấm vào thì 403, kèm một `access.denied` vào nhật ký bảo mật của OWN. FE chỉ ẩn/hiện theo `availableActions` (5.1).
- Vì sao quan trọng: nút hiện ra rồi bị từ chối là lỗi trải nghiệm. Thêm vào đó, các `access.denied` sinh ra do UI (không phải do cố vượt quyền) làm nhiễu đúng tín hiệu SEC 12-02 muốn OWN theo dõi.
- Đề xuất sửa: với MGR (không OWN), chỉ thêm `settle_outside_desk` khi đủ điều kiện (a): đơn có `checkin_backdated_on` và kỳ thuê chứa ngày đến. `view()` đã có `stay`, nên chỉ thêm một cột vào `loadLongStay` (đã có `checkinBackdatedOn`). (b) và (c) vẫn kiểm lúc ghi. Có thể làm cùng PR 12.4/12.5.
- Trạng thái: Closed (recheck `099fd1fc`): `actions()` dùng chung `holdsBackdatedArrival` với lúc ghi; test MGR thấy ở phiếu 11, không thấy ở phiếu 12

### FB-R5-ARC-BE-197-03
- Mức độ: Minor
- Vị trí: 0100 (khóa `long_stay_cleaning_fee_by_room`); `billing.module.ts` / hook `setParameter`.
- Vấn đề: sau 0100, OWN/MGR gọi `setParameter` với khóa này được, với **mọi** JSON, vì chưa có hook kiểm (BE-8 dời). Chưa có mã nào đọc khóa. FE #196 đã ẩn khối sửa (`goLiveDeferred.cleaningByRoom = false`), nên chỉ gọi API thẳng mới ghi được.
- Vì sao quan trọng: go-live-guide 5.3 dặn lễ tân bỏ dòng phần chênh "khi đã đặt bảng giá". Nếu có người đặt được bảng trước khi BE-8 lên, lễ tân có thể bỏ dòng chênh trong khi giá thật chưa đổi, nên thu thiếu. Giá trị sai dạng ghi trước khi có hook cũng làm `cleaningFeeFor` sau này phải xử lý.
- Đề xuất sửa: PR 12.4 thêm hook kiểm trước tiên. Tới lúc đó, DOM ghi rõ trong go-live-guide 5.3: "chỉ bỏ dòng phần chênh sau khi bản có giá dọn theo căn lên production". ORC báo DOM. Không cần sửa PR này.
- Trạng thái: Ghi nhận – mở tới PR 12.4 (hook đi đầu); DOM ghi cảnh báo go-live-guide 5.3

### FB-R5-ARC-BE-197-04
- Mức độ: Minor
- Vị trí: `openapi.yaml` `setPropertyContact`; `property-contact.controller.ts`; SEC 12-04 (a), (d).
- Vấn đề: (a) đã được ghi là dời. (d) (`x-requires-trusted-device: true` + `staff_notification` cho các OWN khác khi đổi hotline) không có trong PR và cũng không được nhắc trong BE responses.
- Vì sao quan trọng: hotline in trên phiếu và trang công khai. Đổi hotline là đường lừa khách gọi số giả. SEC đã nêu.
- Đề xuất sửa: ghi (d) vào BE responses là "dời, hạn 31/12" cùng (a), hoặc làm luôn trong PR 12.4/12.5. (d) chỉ là một dòng spec, một lần gọi `notify`, thêm một `kind` (cần nới CHECK `staff_notification_kind_check` ở migration sau, nên gom vào migration kế tiếp có sẵn).
- Trạng thái: Dời, hạn 31/12 (BE responses đã ghi (a)+(d))

### FB-R5-ARC-BE-197-05
- Mức độ: Minor
- Vị trí: `openapi.yaml` bảng mã trường trong `info.description`; `settleBillingPeriodOutsideDesk`; `createReservation`.
- Vấn đề:
  1. Contract 12.8 yêu cầu thêm `BACKDATE_OUT_OF_RANGE`, `PREVIOUS_MONTH_CLOSED`, `USE_CHECK_IN` và `unmet` `room_occupied` vào bảng mã. PR chỉ nhắc các mã này trong mô tả operation và changelog.
  2. `receivedOn` > T trả `DATE_IN_FUTURE`. Mã này không có trong mô tả.
  3. `createReservation` với ngày đến = T trả `BACKDATE_OUT_OF_RANGE` nhưng **không có** `earliest`, trong khi spec ghi "kèm `earliest`".
- Vì sao quan trọng: FE và QA đọc bảng mã để dịch lỗi. Mã lạ sẽ hiện thành câu chung.
- Đề xuất sửa: thêm 4 dòng vào bảng mã. Ghi `DATE_IN_FUTURE` vào mô tả settle. Ở `reservations.service.ts`, khi đổi `USE_CHECK_IN` thành `BACKDATE_OUT_OF_RANGE`, trả kèm `earliest = T − 45`. Làm cùng PR sau cũng được.
- Trạng thái: Closed (recheck `099fd1fc`): bảng mã OpenAPI thêm 4 mã; `DATE_IN_FUTURE` ở mô tả settle; ngày đến = T trả kèm `earliest` (có test). `room_occupied` ở mô tả `checkInBackdated` là đủ (không phải mã trường)

### FB-R5-ARC-BE-197-06
- Mức độ: Minor
- Vị trí: `reservations.service.ts` (~1466), chặn đổi người chốt trên đơn nhập bù.
- Vấn đề: lần 403 này ghi `auditReason: CLOSER_CHANGE_AFTER_CHECKIN`, kể cả khi đơn còn `confirmed` (tạo bằng `backdatedArrival`, chưa nhận phòng bù). Nhật ký `access.denied` sẽ ghi "đổi sau nhận phòng" cho một đơn chưa nhận phòng.
- Vì sao quan trọng: SEC 12-07 muốn OWN lọc nhanh được "nhập bù / ngoài Desk" hằng tháng. Lý do ghi sai làm bộ lọc trượt.
- Đề xuất sửa: thêm hằng số `CLOSER_CHANGE_BACKDATED_STAY` và đưa vào danh sách `recordUseCaseDenial` của controller. Thêm một assert vào test SEC 12-01 (2).
- Trạng thái: Closed (recheck `099fd1fc`): `CLOSER_CHANGE_BACKDATED_STAY`, có trong danh sách `recordUseCaseDenial`, test kiểm `access.denied.reason`

### FB-R5-ARC-BE-197-07
- Mức độ: Minor
- Vị trí: `checkin.service.ts` `moveArrival`; test §12.1.2.
- Vấn đề: test chỉ phủ trường hợp dời ngày đến sớm hơn và thành công (03/11 → 01/11). Còn thiếu hai ca: (i) căn có lượt khác trên các đêm thêm → 409 `ROOM_UNAVAILABLE`, không ghi gì; (ii) dời muộn hơn (trả đêm). Contract Q4/Q5 có hai ca này.
- Vì sao quan trọng: đổi tồn phòng quá khứ là chỗ dễ đặt trùng. Đây là đường duy nhất trong gói ghi đè lên đêm đã qua.
- Đề xuất sửa: thêm 2 ca vào PR sau. QA phủ Q4/Q5 trên staging trước khi tag.
- Trạng thái: Closed (recheck `099fd1fc`): Q4 → 409 `ROOM_UNAVAILABLE`, không ghi gì; Q5 dời muộn → đêm thừa `void` (`date_change`), occupancy từ ngày mới

### FB-R5-ARC-BE-197-S1
- Mức độ: Suggestion
- Vị trí: CHECK `payment_outside_desk_check`.
- Vấn đề / đề xuất: miễn trừ cho dòng đảo có thể hẹp hơn: `reversal_of_id IS NOT NULL AND amount_vnd < 0`. Khi đó không đường nào khác mượn được `reversal_of_id` để tạo khoản `outside_desk` dương không có phiếu. Hôm nay chỉ `reverse()` đặt `reversal_of_id`, nên không gấp. Nếu làm thì gom vào migration kế tiếp (DROP + ADD trong cùng giao dịch, quét ít dòng).
- Trạng thái: Closed (recheck `099fd1fc`): CHECK siết `reversal_of_id IS NOT NULL AND amount_vnd < 0`, sửa thẳng trong 0100 (chấp nhận – mục 10); test đổi dòng đảo thành dương → lỗi CHECK

### FB-R5-ARC-BE-197-S2
- Mức độ: Suggestion
- Vị trí: 5 file `admin-web` trong PR (`PaymentMethodInput`); FE PR #196.
- Vấn đề / đề xuất: gộp #197 trước, rồi #196 rebase lên main. #196 có đụng `PaymentPanel` / `DebtCollectDialog` thì giữ `PaymentMethodInput`. CI #196 sau rebase phải xanh trước khi gộp. ORC theo thứ tự này.
- Trạng thái: Ghi nhận – việc của ORC (thứ tự gộp #197 rồi #196)

## 8. Ghi chú thêm (không thành thẻ)

- **Hoàn tiền từ số dư có nguồn `outside_desk`:** PR chặn `original_method` khi khoản thu gần nhất là `outside_desk`. Khi đó OWN/MGR vẫn hoàn bằng `cash` hoặc `bank_transfer` được. ARC giữ cách này: tiền thật đã vào cơ sở (trên nền tảng cũ), nên hoàn hay không là quyết định vận hành, đã có duyệt SM-10. Ghi vào contract 12.14.
- **Hoa hồng khi nhận phòng bù một đơn đã có người chốt từ trước:** `syncCommission` chỉ chạy cho `stay_type = 'short'`. Đơn dài hạn hôm nay không sinh dòng `commission`, nên không có rủi ro. Khi PR-M (hoa hồng dài hạn) lên, áp điều kiện SEC 12-05 cho cả đơn có `checkin_backdated_on`.

## 9. Điểm làm tốt

- Đường `outside_desk` có 3 lớp độc lập: enum tách ở spec, `source` nội bộ (thiếu thì ném lỗi lập trình), CHECK DB. Test duyệt mọi `requestBody` theo `$ref`, nên một thân lệnh mới sau này mà lỡ dùng `PaymentMethod` sẽ đỏ ngay.
- `checkInBackdated` tách hẳn khỏi `checkIn` nhưng dùng lại `evaluate`, `syncLeaseNights`, hook B9. BE còn rà listener B9 để chắc không có tác dụng phụ. Đúng G1.
- `migrate.ts` kiểm `MIGRATION_LOCK_TIMEOUT` trước khi kết nối. Lỗi 55P03 nêu tên migration đang chờ. Test Q25 chứng minh không file nào được ghi.

## 10. Kiểm lại (recheck) – head `099fd1fc`, 18/11

- Đọc: `git diff a1bd464f 099fd1fc` (mã, migration, OpenAPI, test) và mục "PR #197 – Phản hồi & sửa" của `BE-responses.md`. CI của `099fd1fc`: mọi job xanh (contract `--strict`, Redocly, test có PostgreSQL thật, E2E smoke, gitleaks).
- **Kết luận: DUYỆT gộp.** Không còn Major mở. Thẻ đóng: 197-01, 02, 05, 06, 07, S1. Còn mở (Minor/Suggestion, không chặn): 197-03 (tới PR 12.4), 197-04 (31/12), S2 (ORC).
- **Sửa thẳng migration 0100 (chưa tạo 0101): chấp nhận.** Đã kiểm:
  - `origin/main` @ `7a906d86` có journal 74 mục (idx 0–73), mục cuối là 0099, nên 0100 chưa vào `main`;
  - job `deploy staging` của `ci.yml` chỉ chạy khi `push` lên `refs/heads/main`; `release.yml` chỉ nhận tag trỏ commit của `main`. Vậy 0100 chưa từng chạy trên staging hay production, và luật "migration đã áp thì không sửa" không bị phạm;
  - schema `folio.ts`, SQL và `0100_snapshot.json` đổi cùng nhau; CHECK mới hẹp hơn bản cũ nhưng mọi dòng hợp lệ (dòng đảo luôn âm) vẫn qua.
  - Điều kiện: DB cục bộ hoặc DB thử của QA/OPS đã chạy 0100 bản cũ sẽ **không** tự cập nhật (drizzle không chạy lại file đã ghi). Phải tạo lại DB, hoặc chạy tay DROP/ADD `payment_outside_desk_check` như BE đã làm. Từ khi #197 gộp vào `main`, 0100 coi như đã đóng băng: mọi sửa sau đi vào migration mới.
- **Đổi thứ tự kiểm trong `refunds.service.ts`: chấp nhận.** Phần xác định phương thức gốc là một câu đọc, chỉ được dời lên trước kiểm số dư. Lỗi duy nhất mới được ném sớm hơn là `outside_desk` → 422. Chặn `cash`/`ota_collect` và nhánh 409 thiếu chuyển khoản vẫn nằm sau kiểm số dư như cũ, nên các đường hoàn khác giữ nguyên thứ tự lỗi. Test hoàn S3 và chi hoàn vẫn xanh.
- Ghi nhận thêm (không thành thẻ):
  - `assertManagerGoLiveScope` chặn MGR khi phiếu có khoản `reversed` hoặc khoản thu thật nhận sau `checkin_backdated_on`. Cách này đúng hướng SEC 197-02 và không đổi luật OWN;
  - kiểm thiết bị tin cậy của `backdatedArrival` (SEC 12-07) chạy ở controller, trước khi kiểm thân lệnh. Đã thống nhất với kiểm thiết bị cấp operation.
