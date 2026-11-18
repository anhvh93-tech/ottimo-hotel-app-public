# FE – trả lời thẻ review Round 5

## FE-4 – PR #142 (V5-11 Desk: Trả sớm trong 00:00–05:59)

- Round 5, bước Phản hồi & sửa · FE-4 · 07/11/2026.
- Review đã nhận, cả ba trên `52a14957`:
  - UXD `rounds/round-05/reviews/UXD-on-fe-pr-142.md`
  - DOM `rounds/round-05/reviews/DOM-on-fe-pr-142.md`
  - ARC `rounds/round-05/reviews/ARC-on-fe-pr-142.md`
- Bản sửa trên nhánh `r5-fe-v5-11`:
  - `3927e137` (UXD-01, DOM-01);
  - `7baac854` (ARC-03, ARC-01);
  - merge `main` → head **`710209ec`**. Không rebase.
- Có hai lần push, vì thẻ ARC đến sau lần push đầu (`877c9dde`).

### FB-R5-UXD-FE-142-01 (Major, điều kiện gộp) – Done
Tình huống: hộp mở trước 00:00 rồi dùng tiếp sau 00:00. Kiểm theo 4 tiêu chí DOM mục 3.3, kèm ca R1 và R2.

**Câu 9.13 hiện cả khi máy chủ chưa trả 409.**
- Mức sàn giờ đêm = `serverMin ?? (night ? estimate : null)`.
- Khi ngày chọn thấp hơn mức sàn này, và mức sàn đang quyết định ngày tối thiểu (không phải ngày đến + 1):
  - dưới ô hiện `err.min_date` với ngày tối thiểu;
  - kèm nút `use_min_date` cùng ngày đó.
- Ngoài W, hoặc khi ngày chọn quá ngày cuối: vẫn hiện `err.date_range` như cũ.
- Không thêm khóa chữ.

**Bước ② không còn chờ một lần tính thử không chạy.**
- Đang ở bước ② mà một ô thành lỗi ở client (qua 00:00) thì:
  - về bước ①;
  - bỏ tick "Đã báo khách" và chip "Vừa đổi";
  - focus ô ngày.
- Đây là cùng đường với 409 ở lần ghi.

**Hộp tự đọc lại đồng hồ.**
- Đồng hồ hẹn giờ vẽ lại hộp lúc 00:00, cùng cách `useBusinessDay` làm ở mốc 06:00 (R3-Q36). Hộp để yên qua nửa đêm sẽ đổi sang câu 9.13 ngay lúc 00:00, không đợi cú bấm.
- Mỗi lần focus vào một ô, Desk kiểm lại đồng hồ (phòng khi đồng hồ hẹn giờ trễ sau khi máy ngủ).

**Test mới**
- R1 kèm DOM 3.3 (1)(3):
  - mở lúc 23:55 ngày D−1, bấm "Xem trước" lúc 00:05 → câu 9.13 và "Dùng D";
  - đơn 5 đêm × 700.000, trả đủ → hoàn 1.050.000, phí 1.050.000;
  - dòng phụ ghi ngày D−1; dòng phí trên folio mang ngày D−1; lần ghi gửi đúng các số đó.
- R2 / DOM 3.3 (2): tick "Đã báo khách" lúc 00:02 → về bước ①, focus vào ô ngày, không có "Đang tính thử…". Sau đó "Dùng D" và ghi xong.
- Bước ① để yên qua 00:00 (không bấm gì) → câu 9.13.
- Ca repro (2) của UXD, giữ gần nguyên văn: focus một ô sau 00:00 → câu 9.13.
- T-11-6: gõ ngày hôm qua lúc 02:00 nay ra câu 9.13. Gõ quá ngày cuối vẫn ra câu khoảng ngày.
- Tệp repro của UXD chạy nguyên văn trên bản sửa: 2/2 đạt.

### FB-R5-UXD-FE-142-02 (Suggestion) – Deferred v1.0.6
Chờ UXD viết khóa `early_departure.to_preview_fix`; FE nối khi khóa có trên `main`. Bản sửa thẻ 01 làm ca này hiếm hơn: lỗi ngày do qua 00:00 nay hiện câu 9.13 kèm nút "Dùng {date}" ngay dưới ô.

### FB-R5-ARC-FE-142-03 (Minor) và FB-R5-DOM-FE-142-01 (Minor) – Done
Làm theo quy tắc ARC mục 3.

**`minCalendarDay`** = max(ngày nghiệp vụ, ngày lịch).
- Đây đúng công thức `minCalendarDate` của máy chủ, không cần mốc đổi ngày.
- Khi ngày nghiệp vụ trên Desk chậm một ngày, mức sàn vẫn là ngày lịch.

**Cờ W** là hàm riêng `inEarlyHours`. W chỉ khi **cả hai** đúng (UXD 9.13, DOM-01):
- giờ máy quầy trước mốc đổi ngày;
- ngày nghiệp vụ nhỏ hơn ngày lịch.

**Ví dụ:** máy chủ đã 06:01 (ngày nghiệp vụ D), máy quầy chậm 2 phút ở 05:59.
- Mức sàn là D, không phải D+1.
- Không có dòng phụ giờ đêm.
- Ngày D đi qua tới lần ghi.

**Test**
- Ca đơn vị nay dùng đầu vào nhất quán. Ca mốc 04:00 cũ không thể xảy ra, đã thay.
- Có ca ngày nghiệp vụ chậm một ngày.
- Ca cả hộp: Me trả `businessDate` = D khi máy quầy ở 05:59.

### FB-R5-ARC-FE-142-01 (Minor) – Done
- **Ca mới:** đồng hồ Desk giữ ở 23:58 (Desk ngoài W). `failNext` trả 409 `useCheckout` cho lần ghi. Kỳ vọng:
  - đúng 1 lần ghi;
  - alert `use_checkout` nhận focus;
  - không có lỗi chặn;
  - không còn nút Xác nhận;
  - đơn đọc lại đúng 1 lần;
  - đơn đi D+2 nên chỉ có nút Đóng.
- **Ca cũ:** kỳ vọng đổi thành `toHaveLength(1)`.
- **Đột biến M10b** (409 `useCheckout` ở lần ghi thành lỗi chặn) nay làm ca mới đỏ.

### Kiểm sau sửa
- Đột biến chạy tay, mỗi lần một chỗ, rồi trả lại. Mỗi đột biến làm ít nhất một ca đỏ:
  - M10b của ARC;
  - công thức mức sàn cũ;
  - W chỉ theo giờ máy quầy;
  - bỏ mức sàn của Desk;
  - bỏ đường về bước ①;
  - bỏ đồng hồ hẹn 00:00;
  - bỏ kiểm lại khi focus.
- Admin-web: 89 tệp, 1011/1011 đạt. tsc, eslint, prettier sạch.

### FB-R5-DOM-FE-142-02 và FB-R5-ARC-FE-142-02 (Minor) – Deferred, PR riêng sau #142
- Lỗi gốc nằm ở `useBusinessDay`: mỗi component tự chụp ước tính lúc nó được mở. Lỗi có từ R3, không do PR này.
- Theo chỉ đạo của ORC, FE làm một PR nhỏ riêng sau khi #142 gộp, theo đề xuất của ARC:
  - chụp mốc một lần lúc câu trả lời Me về, trong `SessionProvider`;
  - đọc lại Me khoảng 2 phút sau mốc 06:00;
  - thêm 2 ca test: hộp mở sau 06:00 với Me đọc trước 06:00, và ca P1 của ARC.
- Không đổi hợp đồng. QA ghi bug P2.
- Trong lúc chờ: tiền và ngày ghi phí do máy chủ quyết. Chỉ chữ ngày trong dòng phụ có thể lệch một ngày. Mức sàn mới đã đỡ được trường hợp ngày nghiệp vụ chậm.

### FB-R5-DOM-FE-142-03 (Minor, chữ UXD) – Deferred, chờ UXD
- Đổi "đêm qua" thành "đêm {ngày}".
- Khi UXD chốt khóa có thêm tham số `{night}`, FE truyền ngày nghiệp vụ vào. Nên làm sau thẻ 02 để ngày đó đúng.

### FB-R5-DOM-FE-142-04 (Suggestion) – Không phải việc FE
Thuộc BA (sổ tay ca đêm) và UXD (`new_date_help`). FE không đổi gì.

## FE-A / FE-B – PR #98, #102, #107 và khung Alert info trang khách


- Người trả lời: FE (FE-A, FE-B) · 06/11/2026 · Bước: Phản hồi & sửa.
- Review: `rounds/round-05/reviews/UXD-on-fe-prs-98-102-107.md` (UXD, 06/11). Chữ theo `rounds/round-05/outputs/UXD/copy-v1.0.5.md` bản 1.7 mục 9.7.
- Sửa trên nhánh PR có sẵn, không rebase, không force-push. GW-01 ở PR mới nhánh `r5-fe-gw-alert-brand` (cắt từ `origin/main`).

### Trả lời UXD – PR #98, #102, #107 và khung Alert info trang khách

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-UXD-FE-PR98-01 (Minor) | Done | #98: khóa `room_change.no_rooms_not_ready` (nguyên văn 9.7). Danh sách đã lọc rỗng **và** có căn trống (`available`, khác căn đang ở) đang VD/CL → khung `warn` với `{rooms}` tăng dần nối ", " thay `room_change.no_rooms`. Không có căn VD/CL → giữ `no_rooms`; danh sách chưa lọc → không dùng câu này. Thêm ca vitest. Ảnh #98 chụp lại |
| FB-R5-UXD-FE-PR102-01 (Major) | Done | #102: `hk.action.needs_cleaning` = "Báo cần dọn" / "Mark for cleaning", giữ tên khóa; ghi chú khóa và tên nhóm "UXD duyệt 06/11". Sinh lại 4 tệp. Ảnh `v5-15-*` chụp lại. Trùng với MOB #97: PR gộp sau bỏ dòng trùng |
| FB-R5-UXD-FE-PR102-02 (Minor) | Done | #102: câu mới `checkin.room_status_stuck` (OC) và khóa mới `checkin.room_status_stuck_od` (OD), nguyên văn 9.7. `roomBlockedMessage`: `cause = room_status` + OD → `_od`. Ghi chú khóa: "v1.0.5 V5-15: theo nút Báo cần dọn". Test BUG-R4-039 có ca OD và ca OC nhắc tên nút |
| FB-R5-UXD-FE-PR102-03 (Minor) | Done | #102: lớp `room-acts` trên khối nút của dòng căn; `@media (max-width: 520px)` → `.room-acts .btn { min-height: 44px }` trong `packages/ui/src/styles/app.css`. Đo trên mock: 32 px ở 1366, 44 px ở 390 |
| FB-R5-UXD-FE-PR102-04 (Suggestion) | Deferred | v1.0.6: xóa câu 409 khi trạng thái căn khác lúc báo. ORC không giao trong lượt này |
| FB-R5-UXD-FE-PR107-01 (Minor) | Deferred | v1.0.6 theo ORC: câu số thẻ và số giấy tờ của tab Yêu cầu chuyển xuống dòng trợ giúp dưới ô, kèm `aria-invalid`; sửa một lần cho cả hai. Đã ghi vào thân #107 |
| FB-R5-UXD-FE-GW-01 (Major) | Done | PR mới FE-B `r5-fe-gw-alert-brand`: `.guest-app .alert.info` nền Cream, viền Sage, chữ và icon Ink, chỉ trong `apps/guest-web/src/styles.css`. Không đụng `@ottimo/ui`, token `--info`, Desk. Ảnh trước/sau trên mock |

### Trả lời ARC – `rounds/round-05/reviews/ARC-on-fe-prs-98-102-107.md` (07/11)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-ARC-FE-102-01 (Major) | Done | #102: E2E lấy phiên `fd16` sau `at(D, '16:00')`, dùng cho GET `hk-tasks` và R8 qua API |
| FB-R5-ARC-FE-102-02 (Minor) | Done | #102: mock R8a xét việc `stayover_clean` `open`/`in_progress`; `inScope` (phạm vi T) cho HK-only ở `allowedEvents` và lệnh trạng thái (404 ngoài phạm vi); 2 ca vitest |
| FB-R5-ARC-FE-102-03 (Suggestion) | Deferred | v1.0.6: cần UXD viết câu `PERFORMED_AT_OUT_OF_RANGE` cho Desk |

Ghi chú:
- Không có ESC mới.
- Ảnh đổi trong lượt này chỉ có dữ liệu giả từ mock MSW; SEC kiểm lại ảnh mới.

## FE-A2 – PR #145 (V5-15 Desk: Trả phòng quá ngày đi)

- Round 5, bước Phản hồi & sửa · FE-A2 · 07/11/2026.
- Review đã nhận, cả bốn trên `011d44e7`: UXD `UXD-on-fe-prs-145-146.md`, DOM `DOM-on-fe-pr-145.md`, ARC `ARC-on-fe-prs-145-146.md`, SEC `SEC-on-fe-pr-145.md`. Chữ theo `copy-v1.0.5.md` bản 2.4 mục 9.15, chép đúng dòng `gen_strings.py` UXD đưa.
- Nhánh `r5-fe-v5-15-overdue`, head mới **`b834ea56`**:
  - `5bd6d126` gộp `main` @ `92635b39`, `c2f883a4` gộp `main` @ `c2d5588d` (#130). Chỉ xung đột `strings.js`; giải bằng `python3 -I design/tools/gen_strings.py` (3518 chuỗi + 8 mẫu), không sửa tay;
  - `c937ffd0` bản sửa; `b834ea56` báo cáo FE mục 6.
  - Không rebase, không force-push. PR hết xung đột (`MERGEABLE`). Không gộp PR.
- admin-web: 95 tệp / 1075 ca xanh; `tsc` sạch. `v5-15-overdue-fea.test.tsx` 15 → 21 ca. 8 đột biến đỏ (báo cáo FE mục 6).

### Trả lời UXD

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-UXD-FE-145-01 (Major) | Done | Bảng A: sửa `overdue_time_help`, `overdue_after_limit`, EN `no_notice`; thêm `overdue_time_help_agreed` (có `agreedCheckoutTime` → câu này, `{time}` = giờ hẹn; không có → `overdue_time_help`). Bỏ `co.time_from_late` trên nhánh quá ngày đi, nhánh thường giữ như `main`. Ghi chú khóa "UXD duyệt 07/11". Gộp `main`, sinh lại chữ. Ca vitest giờ hẹn 17:00: dưới ô có "giữ 17:00 (giờ trả muộn đã hẹn)", không có "12:00", "(giờ trả chuẩn)", "Theo giờ trả muộn đã hẹn" |
| FB-R5-UXD-FE-145-02 (Minor) | Done | (a) `overdue_time_early` theo điều kiện ARC 3.4, thay `after_limit` ở lỗi ô giờ và `overdueWhy`. (b) `overdue_extend_hint` sau câu `need_*` ở màn chỉ dẫn và trong cùng `span` của ngăn đơn, chỉ khi có `extend_stay` |
| FB-R5-UXD-FE-145-03 (Minor) | Done | Sau 403 của B18, focus vào Alert màn chỉ dẫn (`div tabIndex=-1`, một lần). Mở trang thẳng vào màn chỉ dẫn thì không dời focus. Có ca vitest |
| FB-R5-UXD-FE-145-04 (Suggestion) | Deferred | v1.0.6: tách `overdue_effect` lên đầu hộp xác nhận, chữ 600, cần thêm một lớp CSS. Không đổi chữ |
| FB-R5-UXD-FE-145-05 (Suggestion) | Done | `overdue_reason_evidence` đứng trước câu D12c trong cùng dòng `help`. Nút gợi ý 1, 2 điền chữ rồi đặt con trỏ cuối ô, không thêm dấu phẩy |
| FB-R5-UXD-FE-145-06 (Suggestion) | Deferred | v1.0.6 cùng lượt DS của UXD (`Seg` trên điện thoại) |

### Trả lời DOM

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-DOM-FE-145-01 (Major) | Done | Như UXD 145-01. Ca vitest: đơn quá ngày đi, hẹn 17:00 (phụ thu 350.000 đã ghi) → ô 17:00, câu "có hẹn", không đòi tick; đổi 14:00 → `late_recalc` 350.000 → 210.000, không đòi tick |
| FB-R5-DOM-FE-145-02 (Minor) | Done | `overdue_time_early`. Ca vitest: gõ 03:00 → câu mới, không có `overdue_after_limit`, nút khóa; đổi 06:00 → hộp xác nhận "06:00 ngày D", B18 200, lý do giữ giờ thật. Thêm ca đơn đã gia hạn mà vẫn quá ngày đi |
| FB-R5-DOM-FE-145-03 (Minor) | Done | `overdue_extend_hint` (UXD đặt sau câu gọi ai). Ca vitest ngăn đơn FD: câu gọi ai rồi câu Gia hạn, nút Gia hạn bấm được |
| FB-R5-DOM-FE-145-04 (Suggestion) | Done | Cả hai cách: dòng nhắc `overdue_reason_evidence`, và con trỏ cuối ô sau nút gợi ý. Không tăng độ dài tối thiểu |
| FB-R5-DOM-FE-145-05 (Suggestion) | Deferred | v1.0.6: chờ DOM, PO chốt; khóa `checkout.overdue_told_guest` UXD để sẵn ở bảng C |

### Trả lời ARC

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| ARC mục 3.4 (DOM 145-02 vào #145) | Done | Điều kiện lấy từ `checkoutAt` của máy chủ (`overdueEarlyAt` ở `overdue.tsx`), không so giờ gõ với 06:00; `{rollover}` = `property.businessDayRollover`. Câu tự tắt khi máy chủ v1.0.6 đặt giờ lên ngày đi (có ca hàm thuần). Đột biến "so giờ gõ với 06:00" vẫn xanh vì với máy chủ v1.0.5 hai cách cho cùng kết quả |
| FB-R5-ARC-FE-145-01 (Suggestion) | Done một phần | Mock dò số thẻ bằng `containsCardNumber` (V-09), có ca lý do chứa giờ và ngày không bị báo nhầm. Phần kiểm ngày `checkoutAt` của mock: Deferred v1.0.6 (Desk không gặp), cùng lượt mock `resolveCheckoutAt` của V515-01. Chỗ `note` dòng 1548 không đổi trong PR này |
| FB-R5-ARC-FE-145-03 (Suggestion) | Deferred | v1.0.6: lỗi 403 của QR đi qua `overdueDenial` và bật màn chỉ dẫn |
| FB-R5-FE-ARC-V515-01 | Deferred | Theo quyết định ARC 3.2: v1.0.6 / 0.3.14. Phần FE-A2 cùng tag: không hiện `checkout.post_midnight` khi `overdue`, dòng nhắc cách đọc giờ, mock không dựng (D+1, `t`) |
| FB-R5-ARC-QA-145-02 (Minor) | – | Thẻ của QA. FE-A2 bỏ ép kiểu trong `overdue-checkout.r5.spec.ts` sau khi QA thêm trường vào `tests/e2e/support` |

### Trả lời SEC

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-SEC-FE-145-01 (Suggestion) | Deferred | v1.0.6: UXD sửa chữ `checkout.overdue_reason_help` (thêm "số thẻ"), FE-A2 sinh lại |
| FB-R5-SEC-FE-145-02 (Suggestion) | Done | Mock trả `422 CARD_NUMBER_DETECTED` với `errors: [{ field: overdueReason }]` như `Fields.done()`. Ca 422 kiểm mô tả của ô = câu lỗi + dòng help (cả câu D12c), và dạng trả lời của mock. Đột biến SEC M3 (ẩn help khi lỗi) nay đỏ |

Ghi chú:
- Không có ESC mới. Chữ, chỗ hiện do UXD chốt; FE không viết lại câu nào.
- Không có dữ liệu khách thật: test và mock chỉ dùng dữ liệu mẫu ("Phạm Huy", số thẻ thử công khai). Không chụp ảnh mới.
- FB-R5-UXD-FE-146-01 thuộc PR #146, không phải của FE-A2.


## FE – PR #189 (FB-INV-012: phiếu thanh toán tháng S16, chốt công tơ S12, trang in A5/A4)

- Round 5, bước Phản hồi & sửa · 18/11/2026.
- Review đã nhận trên `279ee4a6`:
  - ARC `rounds/round-05/reviews/ARC-on-fe-pr-189.md`
  - UXD `rounds/round-05/reviews/UXD-on-fe-pr-189.md` (mục 2 = chữ in chốt EN + VI)
- Bản sửa trên nhánh `r5-fb012-fe-statements`, từ `e1ea6e3e` đến head **`2e9639ef`**, các commit nhỏ, không rebase, không force-push.
- Đối chiếu OpenAPI nhánh BE `r5-fb012-be-statements` @ `f522aa60` (0.3.14-draft). BE #190 chưa merge, nên kiểu vẫn gõ tay (thẻ ARC-05, ARC-06 chờ).
- Ảnh và PDF mới (dữ liệu mock, không có khách thật): thư mục scratchpad `fb012fe/`, tên tệp `r5-*`.

### Trả lời ARC

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-ARC-FE-189-01 (Major) | Done (xem ghi chú 1) | Đầu kỳ là lần đọc riêng. S12 tháng M có hai nhóm ô cho mỗi đồng hồ: **Closing M** (`period_end`, đầu kỳ M chỉ đọc, tiêu thụ xem trước) và **Opening M+1** (`period_start`, ô bắt buộc, không điền sẵn, "Cuối kỳ trước" = số cuối đang gõ hoặc đã lưu, hao hụt xem trước). Lưu = 2 lần tải ảnh + 2 POST, mỗi lần một `Idempotency-Key`. Hàng theo `candidate.rooms[]`. Lịch sử đọc `previousClosing`, `gap` trên lần đọc đầu kỳ và `consumption` trên lần đọc cuối kỳ. Sau khi lưu chỉ hiện số server trả về. Tháng nhận phòng: S12 nhận `checkin`/`room_change_in` làm đầu kỳ |
| FB-R5-ARC-FE-189-02 (Major) | Done | Cuối kỳ < đầu kỳ: giữ hộp BR-LS-12 (FD chỉ "Nhập sai", Thay đồng hồ / Quay vòng cho FDL+). Đầu kỳ < cuối kỳ trước: client thấy trước hoặc server trả 422 `OPENING_BELOW_PREVIOUS_CLOSING` → hộp 3 lựa chọn (Nhập sai / Thay đồng hồ FDL+ / Vẫn lưu). "Vẫn lưu" gửi lại với `acknowledgeLowerThanPrevious: true` và key mới (`renewKey()` sau mọi 4xx). Phiếu nháp hiện cảnh báo `OPENING_BELOW_PREVIOUS_CLOSING` trong danh sách phải xác nhận. Ghi trễ (BE-190-03): FD thấy "nhờ lễ tân trưởng", nút Lưu tắt; FDL+ nhập lý do (≥ 3 ký tự) gửi `lateReason`; nháp có cảnh báo `READING_LATE` |
| FB-R5-ARC-FE-189-03 (Major) | Done | Ghi thu đọc `{billingPeriod, payment}`; hủy đọc `BillingPeriod` phẳng + `canReplace`; ứng viên dùng `draftId`, `rooms[]`, `reservationCode`, `kind`, `readingStatus` có `not_needed`; `BillingPeriodSummary` có `reservationId`, `kind`. Mock viết lại theo OpenAPI. Test mới `fb012-mock-schema.test.ts` kiểm mọi phản hồi mock (lần đọc, ứng viên, danh sách, phiếu, in, ghi thu, nháp, hủy) theo schema: trường thiếu, sai kiểu, trường không khai báo đều đỏ. Chạy với spec nhánh BE: 2/2 xanh. Trên `main` (chưa có schema billing) test tự bỏ qua, sẽ chạy thật khi #190 merge |
| FB-R5-ARC-FE-189-04 (Minor) | Done | `excludedLines` bắt buộc (`[]` khi đã phát hành), `replacesCode` đọc từ BE. Nút "Đưa lại" vẫn gửi `excludedFolioLineIds` |
| FB-R5-ARC-FE-189-05 (Minor, điều kiện merge) | Open – chờ BE #190 merge | Khi #190 vào `main`: merge `origin/main` vào nhánh (không rebase), thay interface bằng `ResponseOf`/`BodyOf` của `@ottimo/api-client`, chuyển hàm gọi vào `endpoints.ts`, giữ phần tiện ích trong `statements.ts`. Hiện kiểu gõ tay đã khớp từng trường với OpenAPI `f522aa60` (test schema ở thẻ 03 chứng minh phía mock) |
| FB-R5-ARC-FE-189-06 (Minor) | Open – chờ BE #190 merge | Bỏ `'meter' as AttachmentPurpose` sau khi sinh lại client, cùng đợt với thẻ 05 |
| FB-R5-ARC-FE-189-07 (Minor) | Done | Bỏ `PRICE_CHANGED_SINCE_DRAFT`; thêm `OPENING_BELOW_PREVIOUS_CLOSING`, `READING_LATE`. `StatementWarning.code` là `string` + trường mở. Mã lạ hiện câu chung `stmt.warning.unknown` và vẫn phải xác nhận trước khi phát hành |
| FB-R5-ARC-FE-189-08 (Suggestion) | Done | `parseMeter` cắt theo chuỗi: điện lấy số nguyên, nước 1 số lẻ (38,67 → 38,6), không qua số thực. Hiệu số vẫn `Math.round(x * 10) / 10`. Số trước khi lưu ghi "(xem trước)"; sau khi lưu hiện `consumption` của server |

### Trả lời UXD

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-UXD-FE-189-01 (Major) | Done | Điện, nước in thành tiền chưa VAT; một dòng "VAT on electricity and water / VAT điện, nước"; cột VAT ghi "incl. / đã gồm" cho tiền thuê và dịch vụ. Cột tiền cộng đúng Subtotal. Ví dụ DOM: 568.000 + 85.000, Cộng 9.453.000, VAT 49.690, Làm tròn −690, Tổng 9.502.000. Ngăn S16 cùng cách |
| FB-R5-UXD-FE-189-02 (Major) | Done | Phiếu in có "Rent period / Kỳ thuê" và "Utilities & services / Điện nước, dịch vụ", bỏ ô "Tháng". Dòng điện, nước ghi tháng ("Electricity · Nov 2026 / Điện tháng 11/2026"), lấy `labelParams.month` hoặc `periodMonth` |
| FB-R5-UXD-FE-189-03 (Major) | Done | A5 9pt, dòng VI `max(7pt, 0.8em)`. Ngưỡng 6 dòng in (không tính Làm tròn), từ 7 dòng mặc định A4. Chặn tràn: bản A5 dựng ẩn được đo; cao hơn 194 mm thì mặc định A4 và thanh công cụ báo "Đã chuyển sang A4 để vừa một trang". Bố cục A5 gọn lại để 6 dòng vừa một trang: ô thông tin một hàng, nội dung dòng không xuống hàng, khối QR hai cột, dòng "Printed" cùng hàng liên hệ. Đo thật (Chromium): 5 dòng 185 mm, 6 dòng 194 mm → A5 1 trang; 7 dòng → A4 1 trang. PDF: `r5-print-6lines-a5.pdf`, `r5-print-7lines-a4.pdf` |
| FB-R5-UXD-FE-189-04 (Major) | Done | "Dời sang phiếu sau" ở hàng riêng dưới dòng, vùng chạm 44 px. Bảng ngăn còn 3 cột (Nội dung, VAT, Thành tiền); SL × đơn giá và chỉ số công tơ nằm dưới nội dung. Cột tiền `nowrap`, rộng tối thiểu 6,5rem, `overflow-x` giữ làm lưới an toàn. Đã kiểm 1280 px và 390 px: `r5-drawer-1280.png`, `r5-drawer-390.png` |
| FB-R5-UXD-FE-189-05 (Minor) | Done | Dùng nguyên bảng chữ mục 2 (EN + VI): "Đã thanh toán / Còn phải thanh toán", "Vui lòng thanh toán đến hết ngày {date}.", "Cộng", tiêu đề cột, câu VAT, liên hệ, dấu "Đã thanh toán" |
| FB-R5-UXD-FE-189-06 (Minor) | Done | `issuedAt` sau `dueDate` thì in "Payment due on receipt. / Vui lòng thanh toán khi nhận phiếu." Desk giữ cách tính quá hạn |
| FB-R5-UXD-FE-189-07 (Minor) | Done | Dòng dịch vụ là `{service} · {date}`, bỏ "× 1" (in và ngăn S16) |
| FB-R5-UXD-FE-189-08 (Minor) | Done | Dòng phiếu tháng vào cùng danh sách "Cần chú ý", cùng component dòng (icon trong vòng tròn, viền Oak khi đến hạn, Earth Brown khi quá hạn), cộng vào số đếm. Link `?tab=overdue` (hoặc `?tab=issued` khi chỉ đến hạn hôm nay). Chữ "Phiếu tháng quá hạn: {n} · {amount} đ". Ảnh `r5-today-attention.png` |
| FB-R5-UXD-FE-189-09 (Minor) | Done | Ẩn input file, nút DS có icon máy ảnh "Chụp hoặc chọn ảnh"; sau khi chọn hiện ảnh nhỏ, tên tệp, "Đổi ảnh". Ảnh `r5-meters-entry.png` |
| FB-R5-UXD-FE-189-10 (Minor) | Done | Nháp: tiêu đề "Phiếu tháng" + chip "Nháp"; đã phát hành: "Phiếu tháng TT-…" |
| FB-R5-UXD-FE-189-11 (Suggestion) | Done một phần | Đã thêm "Scan to pay / Quét mã để thanh toán" và "Please keep this reference unchanged. / Vui lòng giữ nguyên nội dung này."; số tài khoản giữ 4 số cuối. Tên phòng ("The Mist · 203") **chưa làm**: `BillingPeriodPrint` của BE không có tên phòng. Đề xuất BE thêm `roomNames` (hoặc `rooms[{roomNo, roomName}]`) ở đợt sau; FE làm ngay khi có |

### Ghi chú

1. **Lần đọc `checkin` khi nhận phòng giữa tháng (`753429ec`, theo yêu cầu Điều phối viên).** Hàng S12 thiếu đầu kỳ có nút "Nhập chỉ số nhận phòng". Hộp nhập gồm ngày nhận phòng (trong tháng chốt, không sau hôm nay), điện, nước, ảnh; lưu một POST `kind=checkin`. Thấp hơn cuối kỳ trước của căn → cùng hộp cảnh báo hai bước (Nhập sai / Thay đồng hồ FDL+ / Vẫn lưu gửi `acknowledgeLowerThanPrevious` với key mới); ảnh đã tải được dùng lại cho lần gửi sau. Mock kiểm `readOn` không trước ngày đến, không sau hôm nay (`DATE_INVALID`), một lần `checkin` mỗi đơn. Không còn đề xuất backlog.
2. **Câu chữ mới** (UXD duyệt lại khi rảnh, không chặn): `meters.group_closing`, `meters.group_opening`, `meters.below_inline`, `meters.checkin_*`, `meters.below_*`, `meters.late*`, `meters.photo_pick`, `meters.photo_change`, `stmt.warning.OPENING_BELOW_PREVIOUS_CLOSING`, `stmt.warning.READING_LATE`, `stmt.warning.unknown`, `stmt.paper_switched`. Tất cả trong `design/tools/gen_strings.py`, EN + VI, không emoji.
3. **Kiểm sau sửa:** admin-web vitest 1126 xanh (2 bỏ qua = test schema trên spec của `main`), `tsc`, ESLint, Prettier toàn repo sạch; i18n, ui, guest-web, mobile, booking-web xanh. Spec Playwright có điều kiện vẫn để ngoài PR (CI không cho ca UI bị bỏ qua).
4. **Không có ESC mới.** Không dữ liệu khách thật: test và mock dùng tên mẫu, `@example.test`, số tài khoản thử. Ảnh 6 và 7 dòng có thêm dịch vụ giả qua lớp bọc `fetch` ở phía trình duyệt (chỉ để kiểm bố cục; payload QR là của server, không đổi).
