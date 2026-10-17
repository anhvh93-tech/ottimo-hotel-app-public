# MOB – phản hồi thẻ Round 2 · Sprint 4 (review UXD giữa sprint)

- Ngày: 17/10/2026 | Vùng: `product/apps/mobile/**`, `product/apps/guest-web/**` | Hợp đồng: OpenAPI 0.3.7 + bổ sung 1 (`outputs/ARC/openapi-0.3.7.md` mục 11) – `@ottimo/api-client` đã sinh lại (ARC), có `RequestOptions.acceptLanguage` (FE-A).
- Đầu vào: `reviews/s4-UXD.md` (thẻ C – MOB-S4-01; mục D, E), tin ORC 17/10 (MOB-S4-01, `guest.req.auto_reply`, lỗi `tsc` `InspectionPage.tsx:66`, 0.3.7 bổ sung 1 mục 11.5 #10, #12, #13).
- Không commit.

## Thẻ

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-UXD-MOB-S4-01 | Done | `RequestsPage.tsx`: lý do từ chối dùng khóa đặt theo mã enum 0.3.7 `guest.req.decline.<code>` (`not_available_now`, `outside_service_hours`, `needs_front_desk`, `duplicate`, `other`) – cùng câu lễ tân chọn ở Desk; `unavailableReason = outside_service_hours` → `guest.req.decline.outside_service_hours`; `not_offered` giữ `guest.req.decline.not_offered`. Viết bằng **bảng khóa nguyên văn** thay vì `` `guest.req.decline.${code}` ``: bundle guest-web chỉ đóng gói khóa mã nguồn gọi tên (FB-R2-SEC-MOB-01) và `guard.test.ts` giữ tiền tố mẫu ở `gw.doc.`/`gw.doc_hint.` – kết quả hiển thị y như đề xuất. Không còn dùng `gw.req.decline.*`, `guest.req.decline.out_of_hours` (UXD đã đánh dấu CŨ) |

## Mục D – giả định của MOB
- `gw.welcome_title_plain` "Welcome to OTTIMO." – UXD **đồng ý**, giữ nguyên.

## Mục E – chuỗi UXD đã sửa
- MOB PWA (5 khóa, vd. `hk.task.complete` "Làm xong", "Đang chuẩn bị ảnh…") và guest-web (`gw.req.paid_limit` bỏ số 3, `guest.oci.done_title` gộp một dòng, bỏ "!") – mã đọc theo khóa nên không phải sửa mã; test dùng chữ từ từ điển hoặc không phụ thuộc các câu này – PWA 71/71, guest-web 63/63 xanh sau khi sinh lại chuỗi.
- `guest.req.auto_reply` (mới, UXD): trả lời tự động ngoài giờ **do server dựng** từ khóa này (BE-D đọc qua `scripts/gen-guest-request-copy.mjs`) và trả trong `GuestRequestForGuest.autoReply` theo ngôn ngữ phiên – guest-web hiện nguyên văn `autoReply` (văn bản thuần) dưới thẻ yêu cầu, không tự ghép câu; `gw.req.auto_reply` cũ không còn trong mã.
- Mục E dòng 222 (17 khóa `staff.notif.*`, `staff.photo_load_error` chưa có): đã gửi nhóm "R2 Sprint 4 – MOB đợt 2…" trong `gen_strings.py` (20 khóa, chờ UXD duyệt), `guard.test.ts` PWA xanh.

## Tin ORC khác
- **`tsc` `InspectionPage.tsx:66`**: lỗi lúc chữ ký `getInspectionChecklist(…, lang)` đổi trước khi màn được sửa (đang làm dở, ORC chạy giữa chừng). Nay `pnpm --filter @ottimo/mobile typecheck` **0 lỗi**.
- **0.3.7 bổ sung 1 #10 – `GuestRequest.roomNo` có thể `null`**: PWA **không hiện đối tượng `GuestRequest`** (việc HK `guest_request` đọc `HkTask.roomNo` – vẫn bắt buộc; thông báo `refType = guest_request` không có `refCode` thì chỉ hiện câu, không hiện số căn) – không phải sửa; `tsc` xanh với api-client mới.
- **#12 – ngôn ngữ phiên khách**: guest-web dùng nguyên `GuestSession.locale` server chọn; gửi `Accept-Language` đã quy về quy tắc P-S4-10 (`vi*` → vi, `ru*` → ru, còn lại → en – đúng kết quả server sẽ tính, để test được); nút ngôn ngữ gọi `setGuestLocale`; trạng thái theo `localeChosenByGuest`: chưa chọn → dòng nhỏ dưới lời chào `gw.lang_auto` + mô tả ô chọn (trình đọc màn hình), đã chọn → mô tả `gw.lang_chosen`. Mock theo quy tắc mới (mặc định **en**, giữ lựa chọn của khách cho phiên sau). Test: `fr-FR` → en + dòng gợi ý, chọn VI → cờ, mở lại link giữ VI; `ru-RU` → ru.
- **#13 – `Accept-Language` theo nút VI/EN của PWA**: `getInspectionChecklist`, `recordInspection` (kể cả khi gửi từ hàng đợi – ngôn ngữ lúc bấm lưu trong mục hàng đợi) truyền `acceptLanguage`; PWA chưa gọi `listInspections`. Test: giao diện EN trên trình duyệt VI → mock nhận `en` ở cả hai operation.
