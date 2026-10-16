# UXD – Round 2, Sprint 3: ĐK-S2-3 (lưu đồng thời), rà hi-fi H13–H18, ESC-016 A cho H23, RU báo giá (PO-S2-01)

- Người viết: UXD | Bước 2 (Sản xuất), đầu Sprint 3 | Ngày: 17/10/2026
- Việc được giao (ORC): (1) ĐK-S2-3 / QC-S2-02 – chuỗi `error.CONCURRENT_UPDATE`, `error.SERVICE_UNAVAILABLE` + mẫu tự thử lại theo `Retry-After`; (2) rà hi-fi H13–H18 so với specs EP03-05 và EP06, BR v0.3.2 và các quyết định Sprint 2; (3) áp ESC-016 A vào H23; (4) việc thêm giữa chừng: PO-S2-01, thêm 5 chuỗi RU cho văn bản báo giá.
- Đầu vào: `qc/s2-qc-gate.md` (QC-S2-02, ĐK-S2-3), `specs/EP03-05-stay.md`, `EP06-registration.md`, `EP14-guest-app.md` (3.1–3.2), OpenAPI **0.3.5-draft** (đã đọc 0.3.6 nhóm B qua decision-log, chưa có trong file), `business-rules.md` v0.3.2 (BR-107, 110, 303, 506, 527), decision-log 16/10 (A-13, D-1, D-8, D-9, `doorAccessHandedOver`, closer, kênh `direct`, ESC-016/017), `apps/admin-web/src/app/problem.ts`, `outputs/PO/acceptance.md` (PO-S2-01), `services/api/src/generated/quote-copy.ts`.

## 1. Đã làm gì

### 1.1 ĐK-S2-3 – lưu đồng thời / hệ thống bận
- Thêm chuỗi VI/EN `error.CONCURRENT_UPDATE`, `error.SERVICE_UNAVAILABLE` và nhóm `retry.*`. Không còn rơi về `error.server` ("Máy chủ đang gặp sự cố").
- Thêm **mẫu DS 6.21** (`design-system.md` v0.3.4), nội dung chính:
  - Giữ nguyên form, hộp thoại và bước đang làm.
  - Hiện cảnh báo vàng tại chỗ. Nút chính đổi thành "Tự thử lại sau {seconds} giây…", kèm nút "Dừng thử lại" / "Thử lại ngay".
  - Tự gửi lại cùng `Idempotency-Key` + `If-Match`: `CONCURRENT_UPDATE` tối đa 2 lần, `SERVICE_UNAVAILABLE` 1 lần. Thiếu header thì chờ 2 giây, trần chờ 10 giây.
  - Hết lượt tự thử thì hiện câu `retry.gave_up_*`. Lệnh GET gặp 503 thì tự tải lại 1 lần.
  - PWA: thao tác vẫn nằm ở "Đang chờ gửi", **không** chuyển sang "Cần xem lại".
  - a11y: không đọc đếm lùi từng giây.
- Minh họa: H13 13.5, biến thể "Lưu đồng thời".

### 1.2 Rà hi-fi H13–H18 (vẽ ở Sprint 1 theo 0.3.2) – chỗ lệch đã sửa
| Màn | Lệch so với spec/quyết định hiện hành | Đã sửa |
|---|---|---|
| H13 | Thiếu điều kiện `capacity_within_max` (0.3.5, DOM D-1) | Thêm dòng điều kiện và biến thể khóa "Vượt sức chứa". Biến thể này không có nút bỏ qua; lối ra là đổi căn hoặc sửa số người |
| H13 | Ô "đã giao mã" đang **khóa nút Nhận phòng**, trái quyết định PO 16/10 (không bắt buộc, US-025 AC7) | Ô `checkin.door_handed_over` không còn khóa nút. Nút Nhận phòng nay mở khi tick **"Đã gửi/giao nội quy"** (`houseRulesSent` bắt buộc, 0.3.3) |
| H13 | Thiếu `cardsIssued` (bắt buộc, 0.3.3) | Thêm stepper 0–2 (`handover.cards`) |
| H13 | Chưa có cách tick bổ sung sau khi đã nhận phòng | 13.6: chip "Chưa ghi giao mã/thẻ", nút, hộp xác nhận, toast. Drawer H15 15.1 cũng có nút |
| H13 | Chưa xử lý `SURCHARGE_CHANGED`, `expectedSurchargeVnd`, `warnings[]`; spec ghi "chưa có trong 0.3.2" | Thêm biến thể `SURCHARGE_CHANGED`: bỏ tick "đã báo khách" và xác nhận lại. Cập nhật đặc tả theo 0.3.3/0.3.5 |
| H13 | A-13 / D-9 (cọc thiếu được MGR chấp nhận) chưa thể hiện lúc nhận phòng | Biến thể `ci.shortfall_accepted`: phần còn lại vẫn phải thu đủ (`balance_paid` không đổi) |
| H14 | Chưa có mã trường của 0.3.3 (E06-05) và `CONSENT_CHANGE_NOT_ALLOWED` | Cập nhật đặc tả, thêm chuỗi `field.*` |
| H15 | Gia hạn chưa có `visaWarningAckReason`, `EXTENSION_LIMIT_EXCEEDED`, `NIGHTLY_RATES_NOT_ALLOWED`; chưa áp lại bậc giảm BR-107 khi gia hạn (D-8) | Thêm biến thể `extend.los_reprice` (ví dụ 4.079.000 → 5.205.000) và mã lỗi |
| H15 | Trả muộn chưa có `requestApproval` (202), `expectedSurchargeVnd`, `LATE_CHECKOUT_AFTER_LIMIT` | Thêm toast `late.request_sent` và cập nhật đặc tả |
| H16 | 16.6 ghi "chưa có operation liệt kê"; nay đã có `listPayments`, `confirmPaymentReceived` (0.3.3) | Cập nhật API. Thêm dòng **sale ghi tiền mặt – chờ đối soát** (BR-527 v0.3.2) kèm chip vai, ghi chú nộp quầy và câu "hoa hồng chỉ đạt sau đối soát" (ESC-017 A) |
| H16 | Thiếu `MINIBAR_NOT_CHECKED`, `MINIBAR_ITEMS_INCOMPLETE`, `AMOUNT_EXCEEDS_BALANCE`, `SURCHARGE_CHANGED` | Biến thể "Chưa kiểm minibar" đổi sang `error.MINIBAR_NOT_CHECKED`; cập nhật đặc tả |
| H17 | Nhật ký tiền thiếu các sự kiện của Sprint 2 | Thêm 3 dòng: sale ghi cọc, đổi người chốt (`reservation.closer_changed`), chấp nhận cọc thiếu |
| H18 | "Đã đóng" vẫn dùng `INVALID_TRANSITION` | Đổi sang `ONLINE_CHECKIN_CLOSED` (0.3.3) và `onlineCheckinAvailable`; thêm chi tiết `FILE_TYPE`, `FILE_TOO_LARGE`, `TOO_MANY_FILES` |
| Kênh | Đã rà: không còn tên kênh `direct_*` cũ; H13 ghi "Trực tiếp · Zalo" (kênh + nguồn) là đúng D-6 | Không phải sửa |

### 1.3 ESC-016 A – H23 (guest-web)
- **Màn chính**: khách ngắn ngày, căn đã dọn đầy đủ lúc 10:15. Màn hiện câu `gw.req.clean_second_fee` và ô tick đồng ý phí.
- **Biến thể đã thêm**:
  - Dọn bù khi hôm nay chưa dọn: miễn phí, không có ô tick.
  - Khách dài hạn: mỗi lần dọn lẻ có phí, có ô tick.
  - Thay khăn và đồ dùng: luôn miễn phí.
  - Loại yêu cầu chưa dùng được trước ngày đến.
  - `FEE_NOT_ACCEPTED`.
- **API**:
  - `listGuestRequestOptions` (ARC B-16) do server tính `feeVnd`.
  - `createGuestRequest.feeAccepted`.
- **Khi chưa có API**: dùng câu quy tắc `gw.req.clean_fee_rule`, nêu đủ 3 trường hợp.
- **Lỗi giới hạn số yêu cầu**: đổi sang `gw.req.too_many` (EP14). Sửa `gw.req.note_help` theo SR-INP-05.
- DS 6.19 đã cập nhật theo các điểm trên.

### 1.4 PO-S2-01 – RU văn bản báo giá
Đã thêm RU cho 5 khóa đang nằm trong `QUOTE_COPY_MISSING.ru`:
- `sale.quote_text`
- `sale.quote_text_extra_guest`
- `occ.adults_short`
- `occ.children_short`
- `occ.under6_short`

Tham số `{…}` khớp VI/EN (đã kiểm). Bản RU là nháp, cần người bản ngữ duyệt như các chuỗi RU khác. **BE-B sinh lại** `src/generated/quote-copy.ts` (`--check`), sau đó `QUOTE_COPY_MISSING.ru` phải rỗng.

## 2. Khóa chuỗi mới cho FE/MOB (79 khóa VI/EN + 5 RU; tổng 2039 chuỗi + 8 mẫu)
**Lưu đồng thời / bận (11) – FE admin-web, MOB PWA và guest-web:** `error.CONCURRENT_UPDATE`, `error.SERVICE_UNAVAILABLE`, `retry.countdown` {seconds}, `retry.trying`, `retry.now`, `retry.stop`, `retry.done`, `retry.gave_up_concurrent`, `retry.gave_up_unavailable` {request_id}, `retry.load_countdown` {seconds}, `hk.queue.busy_retry` (MOB)

**H13 nhận phòng (FE):** `checkin.cond.capacity`, `ci.cond_capacity_ok`, `ci.capacity_block_title`, `ci.capacity_fix_move`, `ci.capacity_fix_guests`, `checkin.time`, `ci.house_rules_sent`, `ci.house_rules_help`, `checkin.door_handed_over` (thay `ci.door_done` – khóa cũ giữ lại nhưng không dùng), `ci.door_optional`, `ci.submit_needs_rules`, `checkin.done`, `ci.shortfall_accepted`, `error.SURCHARGE_CHANGED` {amount ← `Problem.surchargeVnd`}, `drawer.action.door_handed_over`, `ci.door_late_title`, `ci.door_late_body`, `ci.door_late_done`, `rsv.door_not_handed`

**H14 giấy tờ/khai báo (FE):** `field.DOC_NUMBER_INVALID`, `field.MAIN_GUEST_DUPLICATE`, `field.ENTRY_DATE_FUTURE`, `field.CHECK_NOTE_REQUIRED`, `field.PORTAL_REFERENCE_REQUIRED`, `field.DOB_FUTURE`, `field.DOB_INVALID`, `field.DOB_MINOR` {age}, `field.DATE_INVALID`, `error.CONSENT_CHANGE_NOT_ALLOWED`, `field_error.generic`

**H15 lưu trú (FE):** `field.EXTENSION_LIMIT_EXCEEDED`, `field.NIGHTLY_RATES_NOT_ALLOWED`, `field.VISA_EXPIRES_BEFORE_DEPARTURE`, `field.LATE_CHECKOUT_AFTER_LIMIT`, `extend.los_reprice` {n, pct}, `late.request_sent` {time}

**H16 trả phòng/thu tiền/đối soát (FE):** `error.MINIBAR_NOT_CHECKED`, `field.MINIBAR_QTY_OVER_STANDARD` {max}, `field.MINIBAR_ITEMS_INCOMPLETE`, `field.AMOUNT_EXCEEDS_BALANCE`, `field.AMOUNT_EXCEEDS_LINE`, `field.AMOUNT_INVALID`, `field.PRICE_NOT_EDITABLE`, `field.DATE_RANGE_TOO_LONG`, `pay.recorded_by_staff` {role}, `pay.cash_hand_in`, `pay.confirm_received`, `recon.filter_role`, `recon.commission_note`

**H17 nhật ký tiền (FE):** `mlog.a_shortfall_accepted` {amount}, `mlog.a_closer_changed` {from, to}, `mlog.a_staff_payment`

**H18 check-in online (MOB guest-web):** `error.ONLINE_CHECKIN_CLOSED`, `field.FILE_TYPE`, `field.FILE_TOO_LARGE`, `field.TOO_MANY_FILES`

**H23 ESC-016 A (MOB guest-web, Sprint 4):** `gw.req.clean_makeup_free`, `gw.req.clean_second_fee` {time, amount}, `gw.req.clean_long_fee` {amount}, `gw.req.clean_what_long`, `gw.req.clean_fee_rule` {amount}, `gw.req.towels_free`, `gw.req.not_available`, `field.REQUEST_TYPE_NOT_AVAILABLE`, `field.FEE_NOT_ACCEPTED`, `gw.req.note_required`, `gw.req.card_detected`, `gw.req.too_many` {phone}

**Sửa chuỗi cũ:** `gw.req.note_help` (thêm "không ghi số giấy tờ, thông tin sức khỏe").

**RU mới (PO-S2-01):** `sale.quote_text`, `sale.quote_text_extra_guest`, `occ.adults_short`, `occ.children_short`, `occ.under6_short`.

## 3. Kiểm tra
| Kiểm | Kết quả |
|---|---|
| `python3 product/design/tools/gen_strings.py` | 2039 chuỗi + 8 mẫu, 0 khóa trùng |
| `python3 product/design/tools/check_hifi.py` | 25/25 trang ✓, exit 0 (mọi `data-i18n` có VI + EN, chữ HTML khớp chuỗi VI, a11y tham chiếu đúng) |
| Tham số `{…}` VI ↔ EN ↔ RU | 0 lệch trên toàn bộ chuỗi |
| `gen_tokens.py` | `fails: 0` (không đổi token) |
| Chưa làm | Chưa mở trình duyệt xem lại H13, H15–H17, H23 sau khi sửa (sáng/tối, EN); VoiceOver |

## 4. Giả định
1. Thời gian tự thử lại: thiếu `Retry-After` thì chờ 2 giây, trần 10 giây; `CONCURRENT_UPDATE` 2 lần, `SERVICE_UNAVAILABLE` 1 lần `[GIẢ ĐỊNH UXD – trong quyền UXD]`.
2. Số thẻ phòng trên UI 0–2 (BR-511, giả định BA), trong khi schema `cardsIssued` cho tới 4.
3. Đổi phòng khi đang ở (`changeRoom`) mà vượt sức chứa: UI chặn cứng `CAPACITY_EXCEEDED`, không có hộp cảnh báo kèm lý do.
4. guest-web khi chưa có `listGuestRequestOptions`: hiện câu quy tắc đủ 3 trường hợp, vẫn bắt tick; mức 100.000 lấy từ cấu hình build.
5. Câu phụ ESC-016 (HĐ dài hạn có hẹn dọn cố định) chưa có trả lời → giữ giả định PO: không có HĐ nào như vậy.
6. Dữ liệu minh họa ngoài DS-0: OTM-0166 (sale Lan ghi tiền mặt 1.600.000), OTM-0160 (đổi người chốt), OTM-0158 (chấp nhận cọc thiếu), giờ dọn 10:15 của căn 103.

## 5. Đề nghị cho vai khác (ghi thẻ ở bước review)
| # | Gửi | Nội dung |
|---|---|---|
| 1 | FE | `problem.ts`: hai mã mới đã có chuỗi nên không còn rơi về `error.server`. Cần thêm: tham số `{seconds}` (hiện `Retry-After` chỉ đổi thành `{minutes}`), `surchargeVnd` → `{amount}`, và hành vi DS 6.21 (giữ form, tự gửi lại cùng khóa). Bản sửa này đóng ĐK-S2-3 cùng test đơn vị |
| 2 | FE | `fieldErrorText` rơi về `field_error.not_in_list` khi gặp mã lạ. Nên đổi sang `field_error.generic`, theo OpenAPI ("tập mã mở") |
| 3 | ARC (0.3.6) | E03-06 `ReservationPatch.doorAccessHandedOver`. Tên sự kiện kiểm toán khi chấp nhận cọc thiếu (`deposit.shortfall_accepted` + `shortfallVnd`). `Payment.recordedByRole` trong `listPayments` + bộ lọc theo vai |
| 4 | ARC | `ExtensionOptions.repricedTotalVnd` + `losDiscountPct` (D-8) để client không tự tính lại bậc giảm |
| 5 | ARC | Xác nhận `changeRoom` không nhận `capacityWarningAckReason` (giả định 3). Thống nhất `cardsIssued` max 2 hay 4 với BA/DOM (giả định 2) |
| 6 | ARC + SEC | `listGuestRequestOptions` thêm `feeReason` (`second_full_clean` \| `long_stay_adhoc`) + `lastFullCleanTime` (chỉ giờ) để hiện đúng câu ESC-016 A |
| 7 | BA/DOM | Vênh: BR-527 nói **lễ tân** tick tiền mặt sale nộp quầy, nhưng `reconcilePayment` chỉ cho MGR+ (rbac A46). Cần chốt ai tick |
| 8 | BE-B | Sinh lại `quote-copy.ts` sau khi có RU (PO-S2-01) |
| 9 | MOB | PWA: `CONCURRENT_UPDATE` và 503 giữ thao tác ở hàng đợi chờ gửi (`hk.queue.busy_retry`), không chuyển sang "Cần xem lại" |

**Không có ESC mới.** Mọi việc trên đều trong quyền UXD hoặc đã chuyển cho vai khác.

## 6. File tạo / sửa
- Sửa: `product/design/hifi/13-check-in.html`, `14-registration.html`, `15-stay.html`, `16-check-out.html`, `17-approvals-moneylog.html`, `18-guest-checkin.html`, `23-guest-requests.html`
- Sửa: `product/design/design-system.md` (v0.3.4: 6.16, 6.19, 6.21 mới, lịch sử), `product/design/content-guide.md` (mục 8 sinh lại, lịch sử 0.3.7), `product/design/tools/gen_strings.py`
- Sinh lại: `product/design/copy/strings-{vi,en,ru}.json`, `product/design/wireframes/assets/strings.js`, `product/design/tools/strings-tables.md`
- Mới: `rounds/round-02/outputs/UXD/s3-report.md`

## 7. Việc chưa xong
- Chưa xem lại trong trình duyệt các màn đã sửa (EN, sáng/tối, phóng chữ).
- Màn Desk cho lễ tân thấy yêu cầu dọn của khách là "dọn bù" hay "lần hai" (DOM: app tự gợi ý) chưa vẽ riêng; khi tới Sprint 4 sẽ làm cùng H19/H03.
- Style nội tuyến cũ trong H13–H18 chưa chuyển hết sang lớp DS 4.1.
