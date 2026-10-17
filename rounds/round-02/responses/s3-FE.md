# FE – phản hồi thẻ Round 2 · Sprint 3 (bước Phản hồi & sửa)

- Ngày: 17/10/2026
- Vùng: `product/apps/admin-web/**`, `product/packages/{ui,i18n,api-client}/**`
- Hợp đồng: OpenAPI **0.3.6-draft + bổ sung 1 + bổ sung 2** (`outputs/ARC/s3-contract.md` mục 7). `packages/api-client/src/generated` khớp `openapi.yaml` (`gen.mjs --check` up to date).
- Chuỗi: dùng đúng khóa UXD trong `design/copy/strings-*.json`, không có bản chữ tạm ở FE. Đợt 2 (ORC giao giữa chừng): đã nối 72 chuỗi UXD `reviews/s3-UXD.md` mục E – xem mục "Đợt 2" cuối tệp.
- Không commit.

## Kết quả lệnh (thư mục `product/`, 17/10/2026 ~00:45 – sau đợt 2)

| Lệnh | Kết quả |
|---|---|
| `prettier --check` (admin-web, ui, i18n, api-client) | xanh |
| `eslint` (cùng phạm vi) | 0 lỗi (1 cảnh báo cũ ở `mockServiceWorker.js` sinh tự động) |
| `turbo run typecheck test build` (4 gói FE) | **9/9 xanh**: admin-web **23 tệp / 165 test**, api-client 14, ui 10, i18n 4. Bundle chính 433 KB (gzip 133 KB), không có cảnh báo > 500 KB |
| `turbo run typecheck build` (toàn repo) | 16/16 xanh |
| axe-core 4.13 trong jsdom (tắt `color-contrast`, `region`), chạy tạm rồi xóa:<br>• Lần 1: H13; H16 bước 2 (thêm đêm) và bước 3; H14 bảng dữ liệu cổng; H17 nhật ký, Hoàn tiền, Cần duyệt; hộp Gia hạn.<br>• Lần 2 (sau đợt 2): H16 thêm đêm, không thêm được đêm, sau nửa đêm, bước 3, phiếu song ngữ; H17 nhật ký; hộp Gia hạn có "Giữ giá đơn"; H13 | **0 critical / 0 serious** |
| `docker build -f infra/docker/Dockerfile.web .` | **exit 0** (`ottimo-web:fe-s3c`; sau đợt 2 `fe-s3d`; sau đợt 3 `fe-s3e`; sau bổ sung 3 `fe-s3f`; sau đợt 5 `fe-s3g`; sau đợt 6 `fe-s3h`; sau đợt 7 `fe-s3i`) |

Test chạy lúc 00:0x (qua nửa đêm) nên lộ hai test phụ thuộc đồng hồ thật. Cả hai đã sửa:
- `checkout.test`: cố định `Date` (chỉ `Date`, timer thật) cho mọi ca trả phòng.
- `booking.test` ROOM_UNAVAILABLE: ngày cuối tuần căn 201 đắt hơn, nên server mock đúng khi trả `DEPOSIT_INSUFFICIENT`. Test nay nhập số tiền đã nhận đủ cho cả hai căn.

## UXD (`reviews/s3-UXD.md`)

| ID | Trạng thái | Đã làm |
|---|---|---|
| FB-R2-UXD-FE-S3-01 | Done | Nhãn = `t(f.label)` (rơi về `label` khi không có khóa).<br>Ô giá trị: `valueKey` → hiện chữ đã dịch; `reg.value.empty` hoặc giá trị rỗng → hiện `reg.value.empty` và không có nút Sao chép.<br>Sao chép luôn chép `f.value` (tiếng Việt do server). `aria-label` nút = "Sao chép {nhãn}".<br>Mock trả đúng hình `portalFields()`: nhãn là khóa, 15 trường cho người nước ngoài / 8 cho VN, `valueKey` cho giới tính, diện nhập cảnh và ô rỗng.<br>Test `s3-review`: nhãn dịch, enum dịch, chép ra "Nam", ô rỗng không có nút |
| S3-02 | Done | `ManualDocDialog` đủ trường:<br>• Giới tính (Seg `reg.value.gender.*`); địa chỉ (CCCD/trẻ em).<br>• Hộ chiếu: ngày cấp, nơi cấp, diện nhập cảnh (Seg `reg.value.visa_kind.*`), số thị thực (ẩn khi `visa_exempt`), hạn thị thực, cửa khẩu, mục đích.<br>• Ô "Có dấu / chứng nhận nhập cảnh": bỏ tick → gửi `noEntryRecord: true` và ẩn ngày nhập cảnh.<br>Nút "Sửa" trên dòng giấy tờ (sau khi xem đủ số) mở cùng form với `updateGuestDocument` (If-Match).<br>Mock POST/PATCH lưu đủ trường. Test: bỏ tick → `noEntryRecord = true` |
| S3-03 | Done | `reprice = repricing.find(x => x.nights === n)`. Nút hiện `deltaVnd` (tiền trả thêm). `extend.los_reprice` chỉ hiện khi `losDiscountPct > 0`, kèm "Tổng tiền phòng: `repricedTotalVnd`". Tên kênh qua `channelName()`.<br>Test theo ví dụ BR-107: thêm 2 đêm → nút "Gia hạn 2 đêm · 1.126.000 ₫", dòng tổng 3.906.000 |
| S3-04 | Done | H13 `whyLocked` theo thứ tự: nội quy → đã báo khách → điều kiện {n} → chờ lễ tân trưởng, đặt cạnh nút + `aria-describedby`.<br>H16 "Hoàn tất": `ci.told_guest` (phụ thu chưa quyết) → `checkout.overpay.needs_reason`.<br>Hộp Trả muộn: thiếu tick → `aria-disabled` + câu `ci.told_guest`. Sau mốc cuối giữ `disabled` vì Alert `late.treat_as_extension` đã nói lý do.<br>Lưu giấy tờ: bỏ `disabled`; bấm khi thiếu ô bắt buộc → `common.required` tại ô.<br>Nút Duyệt/Từ chối chỉ khóa khi mất mạng, đã có dải `approval.offline`.<br>Test: H13 nút gửi duyệt có mô tả lý do; H16 khóa → tick → mở; giấy tờ thiếu số → "Bắt buộc" |
| S3-05 | Done | FD + buồng chưa sẵn sàng + có lý do → nút `ci.send_lead`, hộp `ci.request_title` {room} + `ci.request_effect`. Phản hồi 202 → Alert `ci.waiting_lead`. Test `s3-review` |
| S3-06 | Done | In qua portal `.print-root` (hifi.css mục 16). Portal chỉ tồn tại lúc in, rồi gọi `window.print()`.<br>Tờ phiếu: tên cơ sở + `bill.tax_code`, `bill.no` + `bill.issued_at` hoặc `bill.preview_note`, `bill.title` trong tờ, `thead` `bill.col_desc`/`col_amount`, `bill.paid` (ẩn khi 0). Có đơn vị tiền.<br>Song ngữ: `<span class="en" lang="en">` dưới mọi nhãn VI, Seg `bill.lang_label` (`aria-pressed`) mặc định theo `Bill.locale`.<br>Dòng folio hiện theo `labelKey`/`labelParams`. Ở chế độ VI–EN, dòng có khóa được dịch EN ngay ở client (`hasLineKey`); tham số chữ tự do (tên món, ghi chú) giữ như server gửi. `getBill?locale=vi_en` (0.3.7) không còn bắt buộc cho phần này |
| S3-07 | Done | VietQR theo DS 6.16, mỗi thông tin một khối:<br>• `.price-big`.<br>• `pay.qr_note` {ref} + nút `pay.copy_ref` (chỉ chép `transferContent`).<br>• `pay.qr_account`.<br>• Nút `pay.copy_amount` (số không dấu chấm).<br>QR `aria-label` = `pay.qr_label`; nút tạo = `pay.vietqr_create` {amount}. Số thẻ phòng H13 bọc trong `div.field`. Đã rà các `.stack` khác có `span` nội tuyến |
| S3-08 | Done | H13 bước mã cửa có `dl`: `ci.door_valid` = `ci.door_valid_value` (giờ nhận đã nhập hoặc giờ chuẩn + ngày đến → giờ trả đã hẹn hoặc giờ trả chuẩn + ngày đi, tham số BR-401 qua `useRules`); `ci.door_lock` = "TTLock · {room}" |
| S3-09 | Done (đủ 49 mã tập đóng – bảng UXD E.3) | Bảng `action → mlog.a_*` đủ 49 mã.<br>`payment.recorded` phân biệt sale/CTV theo `after.recordedByRole`, ghi phương thức theo `after.method`, có chip `.chip.recon` khi chờ đối soát.<br>`deposit.shortfall_accepted` {amount}, `reservation.closer_changed` {from}{to}.<br>`approval.approved`: FOC/giảm giá → `mlog.a_foc_approved`; loại khác → `mlog.a_approval_approved` · nhãn loại (`after.type`).<br>Đổi theo E.3: `folio.foc_posted` → `a_foc_posted`, `folio.foc_rejected` → `a_foc_rejected`, `approval.requested` → `a_approval_requested`, `approval.self_applied` → `a_approval_self_applied`, `config.changed` → `a_receiving_account_changed`.<br>Mã ngoài tập → `mlog.a_other` + mã chữ nhỏ.<br>Test: các mã mới, duyệt hoàn → "Duyệt yêu cầu · Hoàn tiền", mã lạ → "Thao tác tiền khác" + mã |
| S3-10 | Done | Nhãn loại: `foc.kind_*`, `refund.title`, `approval.type.*`.<br>Tiêu đề/thân theo loại: `approval.approve_title.<type>`, `approval.approve_body.<type>`; từ chối ngoài foc/discount → `approval.reject_title_generic`.<br>Không hiện số tiền khi bằng 0. Nơi nhận qua `methodText()` (`original_method` → `refund.method.original_method`). Danh sách dùng `.list-none`.<br>Test: trả muộn xung đột – nhãn riêng, không "· 0", tiêu đề duyệt/từ chối đúng loại |
| S3-11 | Done (ý 4 một phần) | (1) Cách hoàn qua `refund.method_label` {method}, map đủ 3 cách.<br>(2) Bỏ chữ "Chờ duyệt" trong hộp nơi nhận.<br>(3) Hộp chi có `refund.execute_effect_cash`/`_transfer` {amount} trên nút; nút `variant="danger"`.<br>(5) Dòng tiêu đề chỉ còn số được duyệt; số đã hoàn tách thành dòng `refund.paid` {amount}.<br>(4) Ẩn nút chi trước cho chính người tạo cần `ApprovalRequest.requestedById` (ARC dời 0.3.7). Hiện vẫn bấm → 403 → `refund.self_execute_forbidden` |
| S3-12 | Done | Đủ 8 trạng thái theo bảng:<br>• H13 mất mạng còn nợ → giữ "Còn phải thu" + `rsv.need_online`; chip "đủ" chỉ khi `balance === 0`.<br>• `checkin.verify.empty` + nút về bước 1; điều kiện lỗi có `common.retry`.<br>• Rỗng: `recon.empty_*`, `refund.empty_*`, `room_change.no_rooms`.<br>• H14: `reg2.deadline_pending`, `reg2.retention_pending` |
| S3-13 | Done | Cảnh báo dùng `checkin.warn.<code>`; mã lạ bỏ qua. Lỗi xem đủ số → `problemView(...).text`. `REFUND_EXCEEDS_APPROVED` {max} định dạng theo locale + đơn vị |
| S3-14 | Done | Thay đủ 15 dòng trong bảng:<br>• `steps_label`, `room_change.price_*`, `party.kind.adult`, `party.child_birth_year`, `party.reduce_*`; tên trẻ em qua `childDisplayName`.<br>• `stay.charge_choose`, các toast `stay.toast.*`, `recon.cash_received_toast`, `refund.method_label`.<br>• `common.duration_hm/m`, `ci.view_hide`.<br>• Ẩn "Đã thu −0"; "Buồng phòng đã kiểm" chỉ ghi tên khi có `checkedByName`; `{max}` minibar = `standardQty` của món lỗi.<br>Nút đề nghị hoàn dùng `refund.request_overpayment` {amount} (bỏ "Gửi duyệt") |
| S3-15 | Done (1 chỗ chờ ARC) | Giờ nhận/trả chuẩn lấy từ `useRules()` (BookingRules/tham số, rơi về BR khi không đọc được) ở H13, Trả muộn, Xác nhận giờ trả, Drawer, H16. Có căn thay thế → `late.arrival_warning_alt`. Quá hạn đối soát → `reconcileOverdue`/`pendingDays` của server.<br>**Còn viết cứng:** mốc 18:00 (`rules.lateLimitTime`) – BookingRules chưa có mốc cuối trả muộn (0.3.7).<br>Phiên bản thông báo / số ngày lưu ảnh H14 nay lấy từ `Registration.consentNotice` (bổ sung 3 – xem đợt 4) |
| S3-16 | Done | `money(v)` trong `@ottimo/i18n` (`common.currency_vnd`) cho mọi `{amount}` trong câu; ô số trong bảng giữ `vnd()`. Test cập nhật số có đơn vị |
| S3-17 | Done | `Chip` có icon mặc định theo tone (ok ✓ / warn ! / bad ✕ / info i), nhận `icon`/`className`. Điều kiện `.conds li.met/.unmet` có icon. `CheckRow` → `li.chk3 ok\|fail\|unknown`. Chờ đối soát → `.chip.recon` + đồng hồ cát. Danh sách thẻ → `.list-none` |
| S3-18 | Done | Bước tiến trình "xong" khi đạt thật: Giấy tờ khi có giấy tờ người đứng tên, Kiểm tra khi `reviewReady`. `document_check_block` đạt mà chưa có giấy tờ → chip trung tính `ci.cond_doc_check_pending` |
| S3-19 | Done | `dirty` + `unsavedLabels` cho Trả muộn, Đổi phòng, Thêm phát sinh, Người đi cùng, Đề nghị hoàn, Nơi nhận hoàn, Chi hoàn (cùng ManualDocDialog có sẵn) |
| S3-20 | (1) Deferred R3 · (2) Done | (1) Theo ORC. (2) Chỉ bỏ tick "đã báo khách" khi lỗi là `SURCHARGE_CHANGED`, hoặc khi người dùng đổi giờ (số phụ thu đổi) |
| S3-21 | Done | Nút "Đơn đặt phòng" sau cảnh báo `rooms.future_keep` mở `/reservations?q={roomNo}`. Danh sách đơn nhận `?q=` và tìm khớp cả số căn. Bỏ 9 style nội tuyến H04, thay bằng `.card.inset`, `.caption`, `.mt-8`, `.field.flush` |
| S3-22 | Done | `ci.full_autohide` {seconds} cạnh số giấy tờ; `reg2.portal_autohide` {minutes}. Số TK hoàn đầy đủ dùng cùng cơ chế 60 giây (`useC3Reveal`) – xem SEC FE-06 |

## SEC (`reviews/s3-SEC.md`)

| ID | Trạng thái | Đã làm |
|---|---|---|
| FB-R2-SEC-FE-06 | Done | Hook dùng chung `app/c3.ts`:<br>• `useC3Reveal<T>()`: tự ẩn sau 60 giây, khi tab ẩn (`visibilitychange`), khi unmount, khi đăng xuất (`onClientDataClear`). Áp cho số giấy tờ (DocsPanel), dữ liệu cổng (120 → 60 giây), số tài khoản hoàn đầy đủ (MoneyPage).<br>• `useC3Clipboard()`: ghi `''` 60 giây sau mỗi lần chép, khi tab ẩn, khi rời màn, khi đăng xuất. Nút "Xóa bộ nhớ tạm" luôn ghi đè. Mọi lần ghi bọc try/catch (best effort, trình duyệt có thể từ chối).<br>Test `s3-review`: ẩn tab → bảng biến mất + `clipboard.writeText('')` được gọi |

## DOM (`reviews/s3-DOM.md`)

| ID | Trạng thái | Đã làm |
|---|---|---|
| FB-R2-DOM-FE-03 | Done | Bill, tóm tắt trả phòng và folio trong drawer hiện dòng qua `lineLabel()`: `labelKey`/`labelParams`, ngày ISO → dd/MM. Khóa có tham số tùy chọn dùng biến thể khi server gửi tham số (`_room`, `_count`, `_notice`, `_reason`); `{reason}` dịch qua `foc.r_*`. Chưa có khóa → dòng đêm `bill.line.room_night`, còn lại `description`.<br>Bill in `bill.refund_due` khi `creditVnd > 0`. Dữ liệu cổng hiện đúng chuỗi server trả.<br>Mock theo hình API:<br>• `description` kỹ thuật; `labelKey`/`labelParams` tính bằng `labelFor()` theo đúng `folio/public/line-labels.ts` của BE (không còn `bill.line.charge` / `room_change_difference` / `deposit_forfeit`; `chargeCode` cho `extra_night`, `overpayment_retained`, `key_card_fee`).<br>• Đơn `ota_prepaid` có một khoản `ota_collect` hệ thống; `totals` tách `otaExcessVnd`, `creditVnd` không gồm phần OTA.<br>• Bill `ota_prepaid` chỉ tính khoản tại quầy |

## ARC (`reviews/s3-ARC.md` mục C + `outputs/ARC/s3-contract.md` mục 7)

| Việc | Trạng thái | Đã làm |
|---|---|---|
| C – FE (a) `availableOperations` | Theo ARC (0.3.7) | Giữ cách hiện: vai FD+ × trạng thái; server vẫn kiểm 403/409 |
| C – FE (b) `PartyMemberCreate` | Giữ | Người lớn qua `GuestPicker` (tạo nhanh) |
| C – FE (c) `Reservation.depositShortfall` | Done | H13 hiện `ci.shortfall_accepted` {who}{amount}; mock trả trường này |
| Bổ sung 1 – `NOT_ALLOWED`, `SURCHARGE_DECISION_REQUIRED`, `AMOUNT_EXCEEDS_BALANCE` | Done | Qua `fieldErrors` (`field.*` hoặc `field_error.generic`). Phụ thu > 0 bắt buộc tick (H13, H16, Trả muộn), nên client không gửi thiếu quyết định |
| Bổ sung 1 – `changeRoom.effectiveDate` chỉ hôm nay | Done | FE chỉ gửi hôm nay. Mock khác hôm nay → 422 `DATE_INVALID` (`effectiveDate`) |
| 7.1-2 `checkOut` sau mốc cuối → `extraNight` | Done | `extraNightRequired` → bỏ câu phụ thu, hiện Alert `checkout.extra_night_title` + `_body` {amount} và ô `checkout.extra_night_rate_label` (+ `_rate_help`; mặc định `extraNightDefaultRateVnd`, sửa được), gửi `extraNight {rateVnd}`.<br>`extraNightAvailable = false` → Alert `checkout.extra_night_unavailable`, không cộng đêm, "Hoàn tất" khóa với chính câu đó. Mock: căn có khách đến cùng ngày → 409 `ROOM_UNAVAILABLE`; audit `reservation.extra_night_on_checkout`.<br>Tóm tắt có dòng đêm thêm. Số còn phải thu, VietQR/tiền mặt và số dư thừa đã tính đêm này, vì server cộng trong cùng giao dịch B18.<br>Lỗi `extraNight.rateVnd` / `extraNight` hiện tại ô.<br>Mock: kiểm trước, rồi thêm đêm + phụ thu + thu tiền + B18 trong một giao dịch, lỗi thì hoàn tác. Test: 19:30 → thêm đêm 708.000, không phụ thu, trả phòng xong; căn đã bán đêm nay → khóa + câu |
| `postMidnightWindow` | Done | Trong cửa sổ sau nửa đêm, giờ mặc định = giờ hiện tại, hiện `checkout.post_midnight`. Mock: ngày lịch = ngày đi và trước 06:00 → phụ thu 0, không thêm đêm. Test 02:10 |
| `unhandledCreditVnd` | Done | H16 dùng `unhandledCreditVnd` (rơi về `creditVnd`) cho chặn và `overpaymentHandling`. Mock tính trừ yêu cầu hoàn đang mở và chặn `createRefundRequest` > trần |
| `TIME_AFTER_ACTION` / `TIME_NOTE_REQUIRED` + `checkinTimeNote` / `checkoutTimeNote` | Done | Có lỗi ở ô ghi chú hoặc đã gõ ghi chú → hiện ô ghi chú (bắt buộc, 300 ký tự) và gửi kèm. Giờ mặc định không bao giờ ở tương lai: trước giờ chuẩn → giờ hiện tại.<br>Mock: dung sai 15 phút, bỏ qua trước 06:00. Test: ghi bù 12:00 lúc 16:00 → lỗi → thêm ghi chú → trả phòng được.<br>Câu lỗi `field.TIME_*` (tra tự động); ô ghi chú `checkin.time_note` / `checkout.time_note` + trợ giúp `stay.time_note_help`. Test kiểm câu lỗi gắn vào ô ghi chú |
| `SURCHARGE_DECISION_REQUIRED` (H16) | Done | Mock trả lỗi khi `applyLateSurcharge ≠ true`; FE khóa "Hoàn tất" tới khi tick; nếu server vẫn trả → `field.SURCHARGE_DECISION_REQUIRED` |
| `REFUND_SOURCE_NOT_RECONCILED` | Done | Mock `executeRefund`/`executeCashRefund` trả 409 kèm `paymentIds[]`, `unreconciledVnd`. FE hiện `error.REFUND_SOURCE_NOT_RECONCILED` với `{amount}` = `unreconciledVnd` có đơn vị.<br>Cùng lúc sửa `argsFor`: `{amount}` của lỗi cấp yêu cầu (SURCHARGE_CHANGED, BALANCE_DUE…) nay có đơn vị (FE-S3-16 còn sót). Test `s3-review` |
| Bill `labelKey`/`labelParams`, `creditVnd`; `ota_collect`/`otaExcessVnd` | Done | Xem DOM FE-03. 22 khóa `bill.line.*` + 6 biến thể. Test: biến thể theo tham số, `{reason}` dịch, EN, mock chỉ sinh khóa trong hợp đồng |
| `currentBookingRateVnd` (nút "Giữ giá đơn") | Done | Hộp Gia hạn: `currentBookingRateVnd ≠ null` → nút bật/tắt `extend.keep_rate` {amount} (`aria-pressed`) + `extend.keep_rate_help`. Bật → các đêm hiện giá đơn, gửi `nightlyRates` = giá đơn cho từng đêm chọn, nút "Gia hạn" hiện tổng giá đơn × số đêm (không dùng `repricing` vì server tính trên lịch giá). Mock trả giá đêm cuối của đơn Trực tiếp; OTA → null. Test: gửi đúng `nightlyRates` |
| `changeRoom` `DATE_INVALID` | Done | Như trên |
| Nhật ký tiền tập đóng | Done | Xem UXD S3-09 |
| 7.1-4 `ConsentInput.retentionDays` (P02b) | Done | H14 gửi `retentionDays` = `consentNotice.imageRetentionDays` (bổ sung 3). Mock: thiếu → `REQUIRED`, khác tham số → `NOT_IN_LIST` |
| 7.1-5 `AMOUNT_EXCEEDS_BALANCE` | Done | Mock `recordPayment` dùng mã này; FE hiện `field.AMOUNT_EXCEEDS_BALANCE` |

## Việc cần vai khác
- **UXD**: đã nối đủ 72 chuỗi mục E và 2 khóa của đợt 3 (`ci.go_handover`, `error.field_named`). Không còn khóa thiếu cho phần FE.
- **ARC (0.3.7)**:
  - `ApprovalRequest.requestedById` (S3-11 ý 4).
  - Mốc cuối trả muộn trong `BookingRules` (S3-15).
  - `MinibarCheck.checkedByName` (S3-14).
  - Lọc `listReservations` theo căn (S3-21 – FE đang dùng `q`).
  - `getBill?locale=vi_en` nay chỉ còn cần cho tham số chữ tự do.
- **BE-A/B/C**: không có việc mới từ FE. Mock đã theo 0.3.6 bổ sung 1 + 2 và `line-labels.ts`; khi API thật sẵn, FE chạy lại với `VITE_API_MODE=server`.

## Giả định (FE tự quyết)
1. Đêm thêm khi trả phòng: số còn phải thu/thừa trên màn = tóm tắt server + giá đêm thêm (server cộng trong giao dịch B18). Thu trước ở bước 3 là thu đủ cả đêm này.
2. Ô ghi chú giờ chỉ hiện khi server báo `TIME_NOTE_REQUIRED` hoặc người dùng đã gõ. FE không tự so giờ để tránh lệch đồng hồ máy quầy.
3. (Đã bỏ ở đợt 4) H14 dùng `Registration.consentNotice`; thiếu trường thì không hỏi đồng ý.
4. "Giữ giá đơn": nút "Gia hạn" hiện giá đơn × số đêm. Server áp lại bậc BR-107 và giá ngày đặc biệt khi lưu, nên số cuối có thể khác. `repricing` của server tính trên lịch giá nên không dùng khi bật nút.
5. Bill VI–EN: dòng có `labelKey` dịch EN ở client; tham số chữ tự do (tên món, ghi chú F&B) giữ nguyên.
6. `approval.approved` không có `after.type` → `mlog.a_approval_approved` (không thêm nhãn loại).

Không có ESC mới.

## Đợt 2 – nối chuỗi UXD mục E (ORC giao giữa chừng, 17/10)
| Việc | Kết quả |
|---|---|
| `field.TIME_*`, `field.SURCHARGE_DECISION_REQUIRED` | Tra tự động `field.<CODE>`; ô ghi chú giờ dùng `checkin.time_note` / `checkout.time_note` + `stay.time_note_help` |
| `error.REFUND_SOURCE_NOT_RECONCILED` {amount} | `unreconciledVnd` → `money()`; `argsFor` nay luôn có đơn vị |
| `checkout.extra_night_*`, `checkout.post_midnight` | H16 bước 2 (title/body/rate label/help/unavailable); câu sau nửa đêm |
| `extend.keep_rate`, `_help` | Nút "Giữ giá đơn" trong hộp Gia hạn |
| `bill.line.*` + biến thể | `app/folio.ts` chọn biến thể theo tham số; `FOC_REASON`, `APPROVAL_TYPE` chuyển về `app/folio.ts`; bill VI–EN dịch dòng |
| `mlog.a_*` đủ 49 mã + `a_approval_approved` | `MoneyPage.tsx` theo bảng E.3 |
| Mock theo `line-labels.ts` | `labelFor()` trong `mocks/stay.ts`; bỏ 3 khóa ngoài hợp đồng |
| Test | admin-web 142 → 148 (`s3-review` +5, `checkout` +1) |

## Đợt 3 – sửa lỗi QA (ORC giao giữa chừng, 17/10)
| ID | Trạng thái | Đã làm |
|---|---|---|
| BUG-R2-032 (P3) | Fixed | Nút bước 3 → 4 của H13 dùng `ci.submit` không có `{room}` nên hiện nguyên "Nhận phòng căn {room}". Nay nút dùng `ci.go_handover` "Tiếp tục: Giao mã & hoàn tất" (UXD thêm 17/10). Test: bước 3 có nút này, không nút nào chứa `{room}` |
| BUG-R2-052 (phần FE) | Fixed | `useSubmit` nhận thêm tùy chọn `{ bound, labels }`, H13 dùng tùy chọn này:<br>• Lỗi ở trường có ô trên màn (`checkinTime`, `checkinTimeNote`, `roomNotReadyOverride.reason`, `documentBlockOverride.reason` – ô lý do chặn giấy tờ nay hiện lỗi tại ô): câu dưới ô, Alert `error.VALIDATION_FAILED` {n}.<br>• Lỗi ở trường không có ô (`addPriorNight`, `cardsIssued`, `houseRulesSent`, `applyEarlySurcharge`…): Alert dùng `error.field_named` {label}{message}, ví dụ: Mục "Thêm đêm và nhận phòng": Bắt buộc.<br>• Mã có câu riêng `field.<CODE>` giữ nguyên câu đó, không ghép nhãn.<br>Màn khác giữ cách cũ (câu của lỗi đầu tiên). Nguyên nhân lỗi nằm ở BE-A (giờ server 00:00–05:59 bị coi là nhận trước 06:00). Test `s3-review` |

Kết quả lệnh sau đợt 3:
- Prettier xanh, ESLint 0 lỗi.
- 4 gói FE `typecheck test build` 9/9 xanh: admin-web 19 tệp / **149 test**.
- axe H13 bước 3 + bước 4: 0 critical/serious.
- `docker build` exit 0 (`ottimo-web:fe-s3e`). Lần build đầu lỗi vì OrbStack dừng giữa chừng; đã khởi động lại OrbStack (`orb start`) rồi build lại.

## Đợt 4 – OpenAPI 0.3.6 bổ sung 3 (`s3-contract.md` mục 7.7, 17/10)
| Việc | Trạng thái | Đã làm |
|---|---|---|
| H14 `Registration.consentNotice` | Done | Bỏ hằng `NOTICE_VERSION` / `RETENTION_DAYS = 30`. Câu hỏi đồng ý dùng `reg2.consent_q` {days} = `imageRetentionDays` (UXD đổi khóa 17/10); dòng "Tự xóa…" `reg2.retention_value` cũng nhận `{days}` (thiếu `consentNotice` → `reg2.retention_pending`, không bao giờ hiện `{days}` trần); khi ghi đồng ý gửi lại đúng `noticeVersion` + `retentionDays` server đưa.<br>Thiếu `consentNotice` → không hiện câu hỏi và nút chọn, chỉ hiện `reg2.consent_not_recorded` (fail closed như MOB).<br>Mock: `consentNotice` lấy từ tham số cơ sở (để `null` được khi test); `retentionDays` khác tham số → `NOT_IN_LIST`.<br>Test: số ngày từ server có trong câu hỏi và trong body gửi đi; thiếu `consentNotice` → không có câu hỏi |
| BUG-R2-045 – `repricing[].channelFeeSavingsVnd` | Done | Câu `extend.ota_child` dùng số tiết kiệm của số đêm đang chọn; trường ở gốc chỉ dùng khi server cũ chưa có `repricing`.<br>Mock: đơn OTA có `repricing` (`losDiscountPct` 0, tiết kiệm = Σ giá × 15,5 %).<br>Test: 1 đêm 109.740 → 2 đêm 219.480 |

UXD đã đổi `reg2.consent_q` sang `{days}` và đang đổi `reg2.retention_value`. FE đã truyền `{ days }` cho cả hai; test kiểm không còn `{days}` trần trên màn. Mock trả `imageRetentionUntil` khi có người đồng ý.

Kết quả lệnh sau đợt 4:
- Prettier xanh, ESLint 0 lỗi.
- admin-web `typecheck test build` xanh, **153/153** test (sau khi đổi sang `reg2.consent_q`).
- axe H14 (có / không có `consentNotice`) và hộp Gia hạn đơn OTA: 0 critical/serious.
- `docker build` exit 0 (`ottimo-web:fe-s3f`).

## Đợt 5 – OpenAPI 0.3.6 bổ sung 4 (`s3-contract.md` 7.8) + link check-in online (17/10)
Đã đợi ARC xong bổ sung 4 (api-client do ARC sinh lại) rồi mới làm. Chuỗi theo UXD `reviews/s3-UXD.md` mục H; không còn khóa tạm.

| Việc | Trạng thái | Đã làm |
|---|---|---|
| (1) `partyChangeSource` khi đổi số khách đơn OTA trước nhận phòng | Done | `pages/stay/PartySource.tsx` dùng chung:<br>• `fieldset` có legend `rsv.party_source.legend`; hai radio `guest_direct` (chọn sẵn) / `ota_modification` {channel}; câu trợ giúp theo lựa chọn; `rsv.ota_guest_count` {n}.<br>• Ô `rsv.ota_mod_ref` (+ help) chỉ khi chọn `ota_modification`; lỗi `REQUIRED` hiện tại ô.<br>Chỉ hiện khi đơn có `otaGuestCount` và đang `hold`/`confirmed`. Áp ở H13 "Sửa số khách" và ở bước giảm số khách khi bỏ người trong hộp Người đi cùng. Drawer hiện `rsv.ota_guest_count` cạnh số khách.<br>Phụ thu người hiện **theo đúng dòng folio server ghi**: H13, điều kiện "Đã thu đủ", liệt kê các dòng `extra_person` bằng nhãn bill + số tiền; FE không tự tính.<br>Mock: thiếu nguồn → `REQUIRED`; OTA sửa đơn thiếu mã → `REQUIRED` (`otaModificationRef`); đơn không phải OTA → `NOT_ALLOWED`. `ota_modification` cập nhật `otaGuestCount`, không phụ thu; `guest_direct` ghi phụ thu người vượt max(định mức, `otaGuestCount`) từng đêm.<br>Test `ota-rules`: chọn sẵn, phụ thu theo dòng server; OTA sửa đơn cần mã rồi cập nhật số OTA |
| (2) Không FOC trên đêm OTA trả trước | Done (phần áp dụng được) | Mã `field.FOC_NOT_ALLOWED_OTA_PREPAID` tra tự động. Mock `requestFoc` chặn dòng `room` của đơn `ota_prepaid`.<br>Hiện FE **không có nút FOC trên từng dòng folio**: FOC tại quầy chỉ có ở H13 cho phụ thu nhận sớm, không phải dòng phòng. Vì vậy chưa dùng `folio.foc_ota_prepaid_note`; khi làm FOC theo dòng (R3), dòng phòng `ota_prepaid` sẽ thay nút bằng câu này |
| (3) `otaPenaltyChannelFeeVnd` | Done | Hộp hủy đơn OTA: ô tùy chọn `cancel.ota_penalty_channel_fee` (+ help) chỉ hiện khi đã nhập tiền phạt; gửi kèm `otaPenaltyVnd`. Mock: có phí mà không có tiền phạt → `NOT_ALLOWED`. Test gửi đúng hai trường |
| (4) `EarlyDepartureResult.extraPerson*` | Chưa áp dụng | FE chưa làm màn trả sớm B16 (đã ghi từ đợt 1) |
| Link check-in online (A22a) | Done | `GuestLinkPanel` trong drawer (H11/H15), FD+, đơn `hold`/`confirmed`, có mạng:<br>• `rsv.guest_link.create` tạo link ngay. Link hiện **một lần**: `once_warning` (Alert, trên link), link chữ đơn cách, nút `rsv.guest_link.copy`, `copied` qua `aria-live`, `expires`, `send_note`, mã QR vẽ tại chỗ.<br>• Sau khi đã tạo trong phiên: `rsv.guest_link.reissue` hỏi `gw.link_reissue_title` trước.<br>• `rsv.guest_link.revoke` hỏi `gw.link_revoke_title` → toast `revoked_toast`.<br>SEC:<br>• Token chỉ ở bộ nhớ component (không storage, không URL), ẩn khi đóng hộp, sau 5 phút, khi rời drawer, khi đăng xuất.<br>• Link đã chép bị ghi đè `''` sau 60 giây, khi rời màn, khi đăng xuất, khi thu hồi.<br>• **Không** xóa khi tab bị ẩn, vì lễ tân phải chuyển sang Zalo để dán (thêm tùy chọn `onTabHidden: false` vào `useC3Reveal` / `useC3Clipboard`; mặc định giữ như SEC FE-06).<br>api-client thêm `issueGuestLink` / `revokeGuestLink` (`GuestLinkIssued`). Mock: token ngẫu nhiên mỗi lần, không lưu token.<br>Test `guest-link`: tạo → link một lần + chép + QR + không có trong storage/URL → đóng là mất → tạo lại có hỏi → thu hồi xóa clipboard; đơn đang ở không có nút |

Chuỗi UXD mục H chưa dùng: `attn.dq_stay_not_closed*` (màn Cần chú ý – ORC chưa giao cho FE đợt này), `folio.foc_ota_prepaid_note` (xem (2)), `field.NOT_ALLOWED` (tra tự động khi server trả).

Kết quả lệnh sau đợt 5:
- Prettier xanh, ESLint 0 lỗi.
- 4 gói FE `typecheck test build` 9/9 xanh: admin-web 21 tệp / **158 test**; bundle chính 436 KB.
- axe 0 critical/serious: drawer + hộp link, H13 sửa số khách có chọn nguồn + dòng phụ thu, hộp hủy OTA có phí kênh.
- `docker build` exit 0 (`ottimo-web:fe-s3g`).

## Đợt 6 – điều kiện SEC §8 cho link check-in online + lỗi thanh OOO trên rack (17/10)
| Việc | Trạng thái | Đã làm |
|---|---|---|
| SEC §8 (1) – ngoại lệ chỉ ở `GuestLinkPanel` | Done | Test `c3-exception` quét `src`: ngoài `pages/reservations/GuestLinkPanel.tsx` mà có `onTabHidden: false` thì đỏ. Chú thích `c3.ts` ghi rõ đây là ngoại lệ SEC, không dùng cho C3 |
| SEC §8 (2) – xóa bù khi quay lại | Done | `useC3Clipboard`: lần ghi đè rỗng khi trang đang ẩn / mất focus được giữ cờ "chờ xóa", ghi lại ngay khi trang hiện lại (`visibilitychange`) hoặc có focus (`focus`). Cũng áp cho "Xóa bộ nhớ tạm". Test: hết hạn khi tab ẩn (trình duyệt từ chối ghi) → hiện lại thì `writeText('')` được gọi; tương tự với sự kiện focus |
| SEC §8 (3) – token không lọt ra ngoài | Done | Token chỉ ở bộ nhớ màn; toast chỉ có mã đơn; QR vẽ bằng `QrCode` trong bundle. Test `guest-link` kiểm: không có trong storage, URL, `console.*`, chữ trên màn sau khi đóng |
| SEC §8 (4) – câu nhắc gửi riêng | Done | `rsv.guest_link.send_private` đặt ngay dưới nút Sao chép |
| Rack H08: thanh OOO hiện "Khóa · status.b…" | Fixed | API trả `RackBar.label` = khóa `status.block.ooo` (rack.service `LABEL`), FE lại đưa nó vào `{reason}` của `rack.note.ooo`. Nay `oooText()` (`rackModel.ts`): nhãn là khóa có trong chuỗi UXD → hiện chữ của khóa ("Khóa phòng"); chữ tự do (mock cũ / server cũ) → "Khóa · {reason}". Áp cho lưới, chế độ Danh sách và aria-label.<br>Mock đổi theo API (label là khóa).<br>Test: lưới và Danh sách không có khóa thô `status.*` / `rack.*` / `fo.*` trong chữ, aria-label, title; `oooText` cho cả hai kiểu nhãn |

Ghi cho ARC/UXD (không chặn): hi-fi H08 có lý do khóa trên thanh ("Khóa · hỏng bình nóng lạnh"), nhưng `RackBar` không có lý do (chỉ `roomBlockId`), nên nay thanh hiện "Khóa phòng". Muốn hiện lý do, ARC cần thêm trường lý do khóa vào `RackBar` (FE đã sẵn nhánh `rack.note.ooo`).

Kết quả lệnh sau đợt 6:
- Prettier xanh, ESLint 0 lỗi.
- 4 gói FE `typecheck test build` 9/9 xanh: admin-web 22 tệp / **163 test**.
- axe rack (lưới + danh sách) và hộp link: 0 critical/serious.
- `docker build` exit 0 (`ottimo-web:fe-s3h`).

## Đợt 7 – B14 đổi phòng theo đơn chính (BE-A 17/10)
| Việc | Trạng thái | Đã làm |
|---|---|---|
| Drawer đang mở đơn con | Done | Nút "Đổi phòng" hiện cho FD+ khi đơn con đang ở (kể cả khi `allowedActions` của đơn con không có `change_room`). Hộp đổi phòng đọc `parentReservationId`, tải đơn chính, rồi gọi `previewChangeRoom` / `changeRoom` trên đơn chính (đúng `version` của đơn chính). Lưu xong, drawer tải lại đơn con, không thay bằng đơn chính |
| Danh sách đêm | Done | Bảng mọi đêm trong `preview.nights` (đêm của đơn con cũng có), cột `bk.night` / `bk.rate`: giá cũ → giá mới. Tìm căn trống tính tới ngày đi muộn nhất (đơn chính / đơn con đang xem) |
| 409 `ROOM_UNAVAILABLE` | Done | Câu lỗi có căn và khoảng đêm trùng (kèm tên khách khi server gửi – chỉ FD+). Thêm nút `bk.use_room` cho từng căn server gợi ý; bấm là chọn căn đó và xem trước lại |
| Mock | Done | Gọi trên đơn con → 409 `INVALID_TRANSITION` (như BE `assertPrimary`). Đổi cả kỳ ở (đơn chính + con đang ở); kiểm trống tới ngày đi hiệu lực; 409 kèm `conflicts[].nights`, mã đơn, tên khách và `suggestions[]` |
| Test | Done | `change-room.test.tsx`: mở từ đơn con → gọi đơn chính, bảng đủ đêm (cả đêm đơn con), cả hai đơn sang căn mới; căn bận đêm cuối của đơn con → 409 + "Dùng căn 103" → xem trước lại |

Kết quả lệnh sau đợt 7:
- Prettier xanh, ESLint 0 lỗi.
- 4 gói FE `typecheck test build` 9/9 xanh: admin-web 23 tệp / **165 test**.
- axe hộp đổi phòng (lỗi 409 + gợi ý, bảng đêm): 0 critical/serious.
- `docker build` exit 0 (`ottimo-web:fe-s3i`).

