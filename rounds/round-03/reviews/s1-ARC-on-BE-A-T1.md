# ARC review BE-A – Round 3, việc T1 (giá trị production theo INV 26/10)

- Người review: ARC | Round 3, bước Review (trước buổi B2 production-bootstrap) | Ngày: 26/10/2026
- Đối tượng: commit `d271694` trên nhánh `worktree-agent-adb7957e376fc24f6` (`admin/production-defaults.ts`, `admin/production-bootstrap.ts`, `test/integration/production-bootstrap.test.ts`, một dòng decision-log).
- Đối chiếu: `rounds/round-03/outputs/DOM/v1-production-defaults.md` mục 4–7 (việc T1 ở mục 5), decision-log 26/10 (INV trả lời 8 câu; DOM áp BR v0.4.4), `modules/public-site` (khớp slug yêu cầu web), `parameter.service.ts` (`validate`), migration `0000` (CHECK nhãn), `0003`, `0053`, `0057`.

## Kết luận

**ĐẠT – gộp được và dùng cho B2.** Không có thẻ Blocker hoặc Major. 1 thẻ Minor, 2 Suggestion; không thẻ nào chặn B2.

Điều kiện thủ tục duy nhất (thuộc ORC/OPS, không phải lỗi của commit): B2 phải chạy từ bản đã gộp `d271694` vào `main` (image/CLI build sau khi gộp). Nếu chạy bản cũ: 6 căn Studio không có hạng phòng, 4 căn Premium/Signature có nhãn không khớp landing, hạn lưu ảnh giấy tờ 1 ngày.

**Không đụng logic tiền:** diff chỉ nằm trong `src/admin/` (công cụ bootstrap một lần) và test. Bốn khóa có liên quan tiền (`electricity_price`, `water_price`, `vat_rate`, `prices_include_vat`): không có mã API/web nào đọc hai khóa điện nước ở v1.0 (grep `services/api/src`, `apps/`; chỉ có seed mock của admin-web); `vat_rate` 8 và `prices_include_vat` true giữ nguyên giá trị, chỉ đổi nhãn nguồn. Không sửa folio, giá, thanh toán. Đóng băng tiền tới QC v1.0 được giữ.

## Đã kiểm (ARC tự chạy trên worktree ở `d271694`)

| Kiểm tra | Kết quả |
|---|---|
| `tsc --noEmit` (api) | đạt |
| `eslint` + `prettier --check` 3 tệp sửa | đạt |
| `production-bootstrap.test.ts` không DB (unit) | 4/4 đạt |
| `production-bootstrap.test.ts` **CSDL rỗng** (PostgreSQL 17 riêng, vai `ottimo_app` / `ottimo_migrator` như CI, `BOOTSTRAP_*_URL`) | **9 đạt, 1 bỏ qua** (nhóm "shared test DB" – không đặt `DATABASE_URL`). Gồm: 10 căn và hạng phòng, 3 khóa hạn lưu với nhãn đúng, mọi khóa không mặc định đã ghi trừ khóa INV nhập, lần chạy thứ hai bị từ chối |

Container thử đã xóa sau khi chạy.

## Ý kiến về 4 điểm BE-A nêu

**(1) Nhãn Premium/Signature mới – đúng hướng, ARC duyệt.** Khớp yêu cầu web với căn chỉ có một đường: `website-requests.service.ts` `roomTypes()` dựng map `slugOf(room.public_room_type)` → nhãn từ các căn `is_sellable`, và `public-booking.service.ts` dòng 640 gắn cờ `room_type_unmatched` khi slug landing không có trong map. Nhãn cũ `'Signature'` / `'Premium'` cho slug `signature` / `premium`, không bao giờ khớp `signature-two-bedrooms` / `premium-one-bedroom-1` của `apps/landing-web/src/content/en.ts` – tức là lỗi tiềm ẩn có sẵn, BE-A sửa đúng chỗ. Đã kiểm `slugOf`: "Premium · One Bedroom + 1" → `premium-one-bedroom-1`, "Signature · Two Bedrooms" → `signature-two-bedrooms`, hai nhãn Studio → `standard-studio-city-view` / `standard-studio-garden-view`. Độ dài trong CHECK `room_public_room_type_check` (1–60). Không có chỗ nào khác so chuỗi `'Signature'`/`'Premium'` cố định. Test mới đọc thẳng slug từ `en.ts` và so với tập slug của 10 căn – chặn được lệch về sau. Phương án khác (cột slug riêng hoặc bảng hạng phòng) cần migration + OpenAPI, không đáng làm trước B2 → ghi ở thẻ 01.

**(2) Nhánh khóa bảo mật trong vòng lặp tham số – đúng.** Logic giống hệt `ParameterService.validate` (dòng 205–219): `is_security` → `checkSecurityBounds` (biên OpenAPI `x-security-parameters`), còn lại → `checkValueSchema` + `checkBusinessBounds`. Cần nhánh này vì `document_profile_retention_months` có `value_schema = 'security'` (0057), nhánh cũ sẽ ném lỗi kiểu. Lỗi vẫn ném trong một transaction nên B2 thất bại thì CSDL nguyên vẹn. Ghi trực tiếp không qua `ParameterService.set` là chấp nhận được vì bootstrap đã ghi audit riêng (dòng 253, 267). Có thể gọi lại chính `validate` thay vì chép logic → thẻ 03 (Suggestion, không làm trước B2).

**(3) Ghi thêm khóa có mặc định catalogue – đúng và cần.** Giá trị đều trong biên: `id_image_retention_days_after_checkout` 30 (biên 0–30, `0003` dòng 78; 90 theo INV chờ T2 v1.0.1), `id_image_unconfirmed_max_days` 7 (biên 1–7, bằng mặc định, ghi để có nguồn), `document_profile_retention_months` 3 (SEC 1–12, chỉ giảm so với mặc định 12 – hướng an toàn). Khớp DOM mục 4 #7 và mục 5 (b). Test "mọi khóa không mặc định" vẫn đúng vì nó so khóa *còn thiếu*, và đếm `config_parameter` = `PRODUCTION_PARAMETERS.length` đã gồm 3 khóa mới. Hệ quả thấy được với khách: câu đồng ý P02b hiển thị "30 ngày" – đúng DOM ("câu đồng ý vẫn nêu số ngày"). Hai khóa `document_profile_retention_months` và `id_image_unconfirmed_max_days` nằm ngoài danh sách T1 của DOM nhưng đúng giá trị DOM chốt ở mục 4 #7; ARC chấp nhận.

**(4) Nhãn `INV-DDMM` – chấp nhận cho v1.0.** `INV-2610`, `INV-2610+PL`, `INV-2610+SEC`, `INV-008+INV-2610` đều qua CHECK `^[A-Z0-9-]{1,16}(\+[A-Z0-9-]{1,16}){0,3}$` (test mới kiểm toàn bộ danh sách). `ParamsPage` chỉ dựa vào `includes('GD')` / `includes('PL')` để gắn huy hiệu, nên `INV-2610+PL` cho điện và VAT hiện huy hiệu "chờ kế toán/luật sư" – đúng với ESC-033 và DOM mục 7 câu 5. Thiếu năm → thẻ 02.

## Thẻ feedback

### FB-R3-ARC-BE-A-T1-01
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/admin/production-defaults.ts` (`STUDIO_CITY` … `SIGNATURE_TWO_BEDROOMS`); `modules/public-site/internal/website-requests.service.ts` `roomTypes()`
- Vấn đề: Khớp hạng phòng giữa landing và Desk dựa vào slug suy ra từ nhãn hiển thị. Đổi chữ nhãn (vd. UXD/CPY chỉnh "Two Bedrooms" → "Two-Bedroom") sẽ làm mọi yêu cầu web của hạng đó bị `room_type_unmatched` mà không ai báo. Ngoài ra nhãn khách thấy trên trang khách ("Signature · Two Bedrooms") khác tên trên landing ("Signature Two-Bedroom").
- Vì sao quan trọng: Yêu cầu đặt phòng web mất hạng phòng → lễ tân phải hỏi lại khách; khách thấy hai cách gọi cùng một hạng.
- Đề xuất sửa: v1.0 giữ nguyên (test slug ↔ landing đã chặn lệch trong repo). v1.1: tách slug ổn định khỏi nhãn (cột `public_room_type_slug` hoặc danh mục hạng phòng 4 dòng), ARC ghi vào backlog nợ kỹ thuật; UXD/CPY thống nhất một tên khách thấy cho mỗi hạng khi làm T3 (v1.0.1).
- Trạng thái: Open

### FB-R3-ARC-BE-A-T1-02
- Mức độ: Suggestion
- Vị trí: `production-defaults.ts` nhãn `INV-2610…`
- Vấn đề: `INV-DDMM` không có năm; từ 2027 sẽ có hai "INV-2610" khác nhau. Nhãn chỉ là nguồn hiển thị, ngày đầy đủ nằm ở decision-log, nên không sai ở v1.0.
- Vì sao quan trọng: Truy nguồn tham số sau một năm vận hành.
- Đề xuất sửa: Không sửa trước B2. Từ lần sau dùng `INV-YYMMDD` (vd. `INV-261026`, 10 ký tự, qua CHECK) và ghi quy ước vào chú thích đầu tệp; nhãn đã ghi trên production đổi qua app khi có giá trị mới, không cần migration.
- Trạng thái: Open

### FB-R3-ARC-BE-A-T1-03
- Mức độ: Minor
- Vị trí: `product/services/api/src/admin/production-bootstrap.ts` vòng lặp `PRODUCTION_PARAMETERS`
- Vấn đề: Logic kiểm tham số chép lại từ `ParameterService.validate`. Khi `validate` thêm luật (vd. luật chéo khóa ở `parameter-rules.ts` hoặc biên mới ở T2), bootstrap có thể lệch mà không ai thấy.
- Vì sao quan trọng: Hai đường kiểm cho cùng dữ liệu cấu hình; giá trị bootstrap qua được nhưng OWN sửa lại trên app thì bị từ chối (hoặc ngược lại).
- Đề xuất sửa: v1.0.1 (sau B2): tách phần thuần của `validate` thành hàm nhận `DefRow` (vd. `validateAgainstDef(def, key, value)`) trong `platform/public/parameter.service.ts`, bootstrap và `validate` cùng gọi. Không đổi hành vi, không đổi API. Không làm trước B2.
- Trạng thái: Open

## Điểm làm tốt
- Sửa luôn lỗi tiềm ẩn slug Premium/Signature thay vì chỉ làm đúng danh sách T1, và có test đọc thẳng slug landing để chặn tái phát.
- Mỗi giá trị có chú thích nguồn (BR, INV 26/10, biên hiện tại, việc T2 tiếp theo) – OPS và SEC đọc là hiểu vì sao 30 chứ không 90.
- Giữ phạm vi hẹp: không đụng tiền, không đụng API contract, test CSDL rỗng chạy xanh.
