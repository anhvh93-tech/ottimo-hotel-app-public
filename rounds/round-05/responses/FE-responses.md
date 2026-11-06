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
