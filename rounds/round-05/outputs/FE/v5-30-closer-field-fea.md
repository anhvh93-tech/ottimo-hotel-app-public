# FE-A – v1.0.5 V5-30 `r5-fe-closer-field`: ô Người chốt trên khung đơn đổi theo mốc

- Người viết: FE-A | Round 5 – bước **Sản xuất** | 07/11/2026
- Nhánh: `r5-fe-closer-field` cắt từ `origin/main` @ `036a7c3d`; đã gộp `main` @ `78024f17` (xung đột chỉ ở tệp chữ: giữ cả nhóm V5-50 của #98 và nhóm V5-30, sinh lại).
- Căn cứ:
  - hợp đồng 0.3.13 bổ sung 1h/1i, mô tả `updateReservation` và `ReservationPatch.closerChangeReason` (`product/docs/api/openapi.yaml`); luật máy chủ đã có trên `main` (BE-H #154, #157);
  - UXD `copy-v1.0.5.md` mục 9.16 (bản 2.5);
  - DOM `DOM-on-be-h-pr-154.md` thẻ 154-03; SEC `SEC-on-contract-0313-addendum-1i.md` thẻ 1I-03; ARC `ARC-on-be-h-pr-154.md` mục 9 ý 2.

## 1. Đã làm gì
- Khung đơn (H11, `ReservationDrawer`) có dòng **Người chốt** ngay dưới khối Căn / Ngày / Số khách / Kênh. Dòng chỉ hiện khi kênh cần người chốt (CTV, Trực tiếp nguồn "Sale nội bộ") hoặc đơn đã có người chốt. Nhãn theo kênh: `bk.closer` (CTV) hoặc `bk.closer_sales`.
- Quyền theo mốc, đúng bảng 1.29 / 1i. Vai không sửa được thì không thấy ô chọn, không có nút, nên không sinh `access.denied` (DOM 154-03):

| Mốc | OWN | MGR | FDL | FD | SAL, CTV |
|---|---|---|---|---|---|
| `hold` | Ô chọn, không ô lý do | Ô chọn, không ô lý do | Ô chọn, không ô lý do | Ô chọn, không ô lý do | Không có dòng |
| `confirmed` (chưa nhận phòng) | Ô chọn, lý do "Không bắt buộc" | Ô chọn, lý do "Không bắt buộc" | Chỉ đọc + `rsv.closer.readonly_manager` | Chỉ đọc + `rsv.closer.readonly_manager` | Không có dòng |
| `in_house` | Ô chọn, lý do bắt buộc | Chỉ đọc + `rsv.closer.readonly_owner` | Chỉ đọc + `readonly_owner` | Chỉ đọc + `readonly_owner` | Không có dòng |
| `checked_out` | Ô chọn, lý do bắt buộc | Chỉ đọc + `readonly_owner` | Chỉ đọc + `readonly_owner` | Chỉ đọc + `readonly_owner` | Không có dòng |
| `cancelled`, `no_show` | Chỉ tên | Chỉ tên | Chỉ tên | Chỉ tên | Không có dòng |

- Ô chọn giống hộp Đặt phòng mới: danh sách `listCloserCandidates` (`kind=all`), lọc theo loại của kênh. Ô lý do chỉ hiện sau khi chọn người khác, và chỉ ở đơn ngoài giữ chỗ. Chọn lại người cũ thì ô lý do ẩn và chữ đã gõ bị xóa. Nút **Lưu** / **Hủy** chỉ hiện khi người chốt đổi.
- Ô lý do: nhãn `rsv.closer.reason` (bắt buộc: dấu * và `aria-required`; không bắt buộc: thêm `(Không bắt buộc)`), chữ gợi ý `rsv.closer.reason_hint`, tối đa 500 ký tự. Dòng `rsv.closer.reason_help` (SEC 1I-03) luôn hiện khi ô hiện, kể cả khi có lỗi, và nằm trong `aria-describedby`.
- Thân PATCH (`If-Match` = version đơn): luôn chỉ có `closerUserId`, cộng `closerChangeReason` (đã bỏ khoảng trắng hai đầu) khi người chốt đổi ở đơn ngoài giữ chỗ và có gõ lý do. Không bao giờ gửi lý do khi người chốt không đổi. Vì thân chỉ có hai trường này, đơn `checked_out` nhận được (BE 1H-01).
- Kiểm tại Desk trước khi gửi: OWN sau nhận phòng để trống, hoặc lý do đã gõ dưới 3 ký tự → `field_error.reason_required`, không gửi.
- Trả lời của máy chủ:
  - 403 `FORBIDDEN_ACTION`: tải lại đơn trước, rồi hiện `error.closer_change_forbidden` (Alert warn, `role="alert"`, nhận focus). Ô thành chỉ đọc với dòng `readonly_*` của mốc mới;
  - 422 ở `closerChangeReason`: `REASON_REQUIRED` → `field_error.reason_required`; `TOO_LONG` → `field_error.too_long` với `{max}` = 500; `CARD_NUMBER_DETECTED` → `field_error.reason_card_number` (cặp trường–mã mới trong `FIELD_PAIR`, `app/problem.ts`; không bao giờ hiện câu "Ô ghi chú…" của `error.CARD_NUMBER_DETECTED`);
  - 422 `NOT_IN_LIST` ở `closerUserId`: `field_error.not_in_list` dưới ô chọn, tải lại danh sách người chốt;
  - 409 `INVALID_TRANSITION`: tải lại đơn, khung đơn hiện `rsv.transition_changed` như các thao tác khác;
  - 412 `VERSION_CONFLICT`: giữ chữ đã nhập, nút "Tải lại" đọc bản mới rồi lưu lại được;
  - 409 `CONCURRENT_UPDATE` / 503: tự gửi lại theo DS 6.21 (`useWrite`).
- Mock MSW (`mocks/stay.ts`, PATCH đơn): theo luật #154, đúng thứ tự máy chủ: 409 trạng thái → 403 theo mốc → 422 (người chốt ngoài danh sách hoặc sai kênh, lý do thiếu/ngắn/dài/có số thẻ, lý do khi người chốt không đổi). Đơn `checked_out` chỉ nhận hai trường. Mock không ghi dòng audit, để không chồng với #159.

## 2. Chữ
7 khóa mới, nguyên văn `copy-v1.0.5.md` 9.16 (đã so từng byte VI, EN): `rsv.closer.reason`, `rsv.closer.reason_help`, `rsv.closer.reason_hint`, `rsv.closer.readonly_manager`, `rsv.closer.readonly_owner`, `error.closer_change_forbidden`, `field_error.reason_card_number`. Thêm vào `gen_strings.py` (nhóm mới cuối tệp), sinh lại `strings-vi/en.json`, `strings.js`, `strings-tables.md` bằng `python3 -I design/tools/gen_strings.py`.

Dùng lại, không đổi chữ: `bk.closer`, `bk.closer_sales`, `common.optional`, `field_error.reason_required`, `field_error.too_long`, `field_error.not_in_list`, `common.save`, `common.cancel`, `common.reload`, `common.retry`, `common.loading`, `common.error_generic_title`, `mlog.who_unlisted`, `rsv.transition_changed`.

## 3. Tệp
- Mới: `product/apps/admin-web/src/pages/reservations/CloserField.tsx`, `product/apps/admin-web/src/__tests__/v5-30-closer-field-fea.test.tsx`, báo cáo này.
- Sửa: `product/apps/admin-web/src/pages/reservations/ReservationDrawer.tsx` (gắn ô, một biến `channelGroup`), `product/apps/admin-web/src/app/problem.ts` (`FIELD_PAIR`), `product/apps/admin-web/src/mocks/stay.ts` (PATCH đơn), `product/design/tools/gen_strings.py` + 4 tệp sinh.
- Không sửa `BookingDialog.tsx`: hộp này chỉ tạo đơn (`createReservation`), luật tạo đơn không đổi.

## 4. Kiểm
- Vitest `v5-30-closer-field-fea.test.tsx`, 35 ca:
  - 16 ô vai × mốc (OWN, MGR, FDL, FD × `hold`, `confirmed`, `in_house`, `checked_out`): ô chọn hay chỉ đọc, đúng dòng `readonly_*`, không có ô chọn và nút Lưu khi chỉ đọc, ô lý do có hay không, bắt buộc hay không;
  - SAL, CTV: không có dòng; đơn CTV với FD: nhãn "CTV chốt đơn", chỉ CTV trong danh sách;
  - thân lệnh: giữ chỗ chỉ `closerUserId`; MGR để trống lý do thì không có khóa `closerChangeReason`; lý do gõ thì gửi đã cắt khoảng trắng; dưới 3 ký tự bị chặn tại Desk; OWN đang ở để trống bị chặn rồi gửi đủ; `checked_out` chỉ hai khóa, `If-Match` đúng version; chọn lại người cũ thì ẩn ô lý do, không có nút Lưu, không gửi;
  - 403 (khách vừa nhận phòng ở máy khác): có lần đọc lại đơn trước câu, dòng `readonly_owner` đã hiện, ô chọn mất;
  - 422: `REASON_REQUIRED`, `TOO_LONG` ("Tối đa 500 ký tự."), `CARD_NUMBER_DETECTED` (với mã gốc `VALIDATION_FAILED` và `CARD_NUMBER_DETECTED`), số thẻ thử qua luật V-09 của mock, `NOT_IN_LIST` (tài khoản vừa bị tắt → câu dưới ô chọn, danh sách đọc lại, người đó không còn trong ô);
  - 409 (đơn vừa hủy) và 412 (giữ chữ, Tải lại, lưu được).
- Đột biến thử: cho FD/FDL sửa ở `confirmed`, luôn gửi lý do, bỏ lần đọc lại khi 403, bỏ cặp `FIELD_PAIR` → mỗi lần 4 ca đỏ.
- Toàn bộ vitest admin-web: 98 tệp, 1123 ca xanh trên `036a7c3d`; sau khi gộp `main` @ `78024f17`: 99 tệp, 1131 ca xanh. `tsc`, `eslint` (0 lỗi; 1 cảnh báo có sẵn ở `public/mockServiceWorker.js`), `prettier` sạch.
- Xem bằng mắt trên mock (Vite cổng 5391, đã tắt): 1440 và 390 px, MGR `confirmed` trước/sau khi chọn và sau khi lưu, FD `confirmed` chỉ đọc, OWN `in_house` lỗi lý do. Không tràn ngang ở 390. Chỉ dùng lớp có sẵn (`dl`, `li-s`, `field`, `help`, `err`, `stack`, `row`), không thêm màu, cỡ chữ. Ảnh chưa đưa vào kho (chờ QA kiểm che dữ liệu theo quy định ảnh).

## 5. Giả định
- G1. Chỗ đặt ô là **khung đơn** (`ReservationDrawer`), như tiêu đề 9.16 và DOM 154-03 ("Desk, khung đơn, ô Người chốt"). ORC giao ghi `BookingDialog.tsx`, nhưng hộp này chỉ tạo đơn; luật `updateReservation` chỉ áp cho đơn đã có.
- G2. Nút lưu và bỏ thay đổi dùng `common.save` / `common.cancel`. 9.16 không nêu khóa nút. Lưu xong không có toast (9.16 không có câu); ô chọn hiện người mới là đủ.
- G3. `common.optional` gắn sau nhãn trong ngoặc, chữ Stone (`li-s`): "Lý do đổi người chốt (Không bắt buộc)". Desk chưa có chỗ nào dùng `common.optional`; UXD xác nhận cách gắn.
- G4. Người chốt đang lưu không có trong danh sách (tài khoản không còn hoạt động): tên và dòng chọn hiện `mlog.who_unlisted`, như #159. Khi `mlog.closer_inactive` (9.18) lên `main`, UXD chọn có dùng ở đây không.
- G5. Đọc danh sách lỗi: tên hiện `common.error_generic_title` kèm nút `common.retry` (theo gợi ý DOM 159-01).
- G6. Đơn `cancelled`, `no_show`: chỉ hiện tên, không dòng hướng dẫn (máy chủ trả 409 cho mọi PATCH; 9.16 không có câu).
- G7. Dòng chỉ đọc là một `dl` riêng ngay dưới khối thông tin (như khối giờ trả, mã cửa của đơn đang ở), cách 12 px.

## 6. Cần review
- ARC: luật vai × mốc ở `closerAccess`, thân PATCH, thứ tự xử lý 403 → 422 → 409 phía Desk, mock theo #154.
- UXD: chữ (7 khóa), vị trí dòng, G2, G3, G4, G7.
- SEC: dòng help luôn hiện kể cả khi lỗi (1I-03); vai bị 403 không có nút; lý do không vào URL, log hay toast.
- DOM: hai dòng chỉ đọc theo mốc (154-03); SAL, CTV không có dòng.

## 7. Dòng decision-log đề xuất (ORC ghi)
`| 2026-11-07 | 5 | FE-A V5-30: ô Người chốt trên khung đơn (ReservationDrawer, không phải BookingDialog – hộp tạo đơn không đổi luật) theo mốc của 0.3.13 1h/1i (#154): hold FD+ không lý do; confirmed MGR+ lý do không bắt buộc, FD/FDL chỉ đọc + readonly_manager; in_house/checked_out chỉ OWN lý do bắt buộc, MGR/FDL/FD chỉ đọc + readonly_owner; SAL/CTV không có dòng. Thân chỉ closerUserId (+ closerChangeReason khi đổi). 403 → tải lại rồi error.closer_change_forbidden. CARD_NUMBER_DETECTED ở closerChangeReason → field_error.reason_card_number qua FIELD_PAIR. Giả định G2–G7 chờ UXD | FE | rounds/round-05/outputs/FE/v5-30-closer-field-fea.md |`
