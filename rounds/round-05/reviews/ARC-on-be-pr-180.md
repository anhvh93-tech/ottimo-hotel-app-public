# ARC review – PR #180 (BE) – FB-INV-010 Đợt 1: giá tháng công khai + ước tính dài hạn có số

- Round 5 – bước Review. Người review: ARC. Tác giả: BE. Head `059ba0db`.
- Phạm vi (chế độ tiết kiệm token): chỉ diff và file diff đụng – `openapi.yaml` (0.3.13 bổ sung 2), `public-site.controller.ts`, `price-estimate.service.ts`, `estimate-token.ts`, `website-requests.service.ts`, `reservations/public/public-rate(.port).ts`, test `lp-v2-be-units`, `lp-v2-price-estimate` (tên ca), `rbac-cases.json`.
- Quyết định INV đã có, không hỏi lại: giá tháng Desk đã gồm VAT; không giảm kỳ hạn (BR-201 không áp trên web, một giá tháng); landing chỉ bán dài hạn; +10 % khách NN (BR-109) không hiện trên web.

## Kết quả kiểm

| Hạng mục | Kết quả |
|---|---|
| Hợp đồng / tương thích ngược | Đạt. Chỉ thêm: operation `getPublicMonthlyRates`, schema `PublicMonthlyRates`, trường tùy chọn `longStay`, `PublicPriceEstimateRecord.monthlyVnd`, khóa token `mo` (tùy chọn, `wellFormed` kiểm số nguyên). Không bỏ trường, không bỏ enum (`monthly_offer` giữ, chỉ thu hẹp nghĩa cho ngắn ngày ≥ BR-108), không mã lỗi mới, không migration. Client sinh lại (`api-client`, `openapi-meta/schemas`) khớp. Thay đổi hành vi `stayType=long` (từ `monthly_offer` sang `ok` + `longStay`) là đúng chủ đích FB-INV-010, thay ESC-043 câu 2 – landing Đợt 1 là bên tiêu thụ duy nhất. |
| Không lộ dữ liệu | Đạt. `publicMonthlyRatesDto` và nhánh `longStay` của `publicEstimateDto` dựng theo allowlist từng trường; `monthlyToVnd` (giá cao nhất) chỉ vào snapshot Desk; `roomId` chỉ ở `priceGapRoomIds` cho cảnh báo OWN. Schema `additionalProperties: false` ở mọi tầng. Không số căn, đếm căn, OTA, hoa hồng, occupancy. Có test allowlist + chuỗi cấm cho route mới. |
| Giới hạn tần suất + cache | Đạt. Route mới đi qua `guardedEstimate` – dùng chung bucket RAM `pubest:` (30/10 phút, 200/ngày, /48), cửa sổ toàn cục 10/giây, bulkhead 2; tính mới đếm vào trần `pubest:fresh:<property>` 600/giờ. Cache RAM 60 s theo (cơ sở, ngày nghiệp vụ), xóa cùng `invalidate`; chặn cả đồng hồ lùi. Thứ tự 403 → 404 → 422 khớp mô tả. `Cache-Control: no-store`, `X-Robots-Tag: noindex`. |
| Giá hiệu lực, không trả 0 | Đạt. `room_list_price` lấy dòng `effective_from` ≤ ngày (BR-006); `monthlyListOn` loại `null`/0/không phải số nguyên an toàn (`Number(null) = 0` bị chặn bởi `m > 0`); hạng không có căn có giá bị bỏ khỏi danh sách, ước tính trả `unavailable` → `on_request`. Làm tròn `rounding.monthly_rent` (tham số có trong catalogue 0002, bounds 0003). Truy vấn READ ONLY, `statement_timeout` 1 s, lỗi → 503. |
| Test, CI | Đạt có lưu ý. Có ca unit (giá theo ngày đến, OOO loại, căn thiếu giá là gap, làm tròn, token `mo`, monthly listing không đọc đơn/giữ chỗ/OOO) và integration (200 `longStay`, `months` vắng → `totalVnd: null`, ngắn ngày ≥ BR-108 vẫn `monthly_offer` không số, route mới allowlist/422/403/cache). CI: 8/9 job xanh; **`docker images build · E2E smoke` còn pending** lúc review. |

## Thẻ feedback

### FB-R5-ARC-BE-180-01
- Mức độ: Minor
- Vị trí: `public-rate.port.ts` `monthlyFrom` so với `public-rate.ts` `estimatePublicRate` (nhánh `long`); `openapi.yaml` mô tả `getPublicMonthlyRates`
- Vấn đề: Hai con số "From X / month" có thể lệch nhau cho cùng một hạng. `monthly-rates` tính tại **ngày nghiệp vụ**, không loại căn OOO, không xét sức chứa; ước tính `stayType=long` tính tại **ngày đến**, loại căn OOO chồng khoảng, chỉ căn vừa đoàn. Ví dụ: căn rẻ nhất của hạng đang OOO tháng 12 → thân trang hiện 8,5 triệu, form (đến 01/12) hiện 9 triệu. Cả hai đều đúng theo định nghĩa riêng, nhưng khách có thể thấy mâu thuẫn.
- Đề xuất: Không đổi code ở PR này. Ghi rõ trong mô tả `getPublicMonthlyRates` một câu: "giá danh mục tại hôm nay; con số của form (`getPublicPriceEstimate`) là con số theo ngày đến và đoàn của khách – khi lệch, trang hiện số của form". FE/CPY dùng chữ "From" cho thân trang. Có thể làm ở lần chạm contract kế tiếp.
- Trạng thái: Open

### FB-R5-ARC-BE-180-02
- Mức độ: Minor
- Vị trí: `public-rate.port.ts` `canonical({... monthlyRentUnit, rooms: { l: r.listPrices } })`
- Vấn đề: `priceVersion` nay băm thêm `monthlyRentUnit` và `monthlyVnd` trong `listPrices` → mọi token ngắn ngày phát trước khi deploy (TTL 24 giờ) sẽ có `pv` khác với lần tính lại lúc gửi form, dù giá đêm không đổi. Không vỡ luồng (`tokenMatches` so đầu vào, không so `pv`), nhưng snapshot Desk có thể hiển thị như "giá đã đổi" cho yêu cầu gửi trong 24 giờ đầu.
- Đề xuất: Chấp nhận; ghi một dòng vào release note Đợt 1 cho OPS/FD ("yêu cầu web gửi trong 24 giờ sau deploy có thể báo lệch phiên bản giá – bỏ qua nếu số khớp"). Không cần sửa code.
- Trạng thái: Open

### FB-R5-ARC-BE-180-03
- Mức độ: Minor
- Vị trí: `price-estimate.service.ts` `publicMonthlyRatesDto`; `public-rate.ts` `monthlyFromByType`
- Vấn đề: Gom theo **nhãn** `public_room_type` rồi mới đổi sang slug. Hai nhãn khác chữ hoa/khoảng trắng nhưng cùng slug (ví dụ "Studio Garden" và "Studio garden") sẽ ra 2 phần tử trùng `roomType` – trang không biết chọn số nào. `maxItems: 20` trong schema cũng không được DTO cưỡng chế. Rủi ro thấp (10 căn) nhưng là lỗi dữ liệu nhập Desk thật sự có thể xảy ra.
- Đề xuất: Trong `publicMonthlyRatesDto` (hoặc `monthlyFromByType`) gom theo slug, giữ giá nhỏ nhất và nhãn đầu tiên theo thứ tự ổn định; `slice(0, 20)`; thêm 1 ca unit. Có thể làm trong PR này nếu BE còn chạm, hoặc PR nhỏ sau – không chặn merge.
- Trạng thái: Open

### FB-R5-ARC-BE-180-04
- Mức độ: Minor
- Vị trí: `openapi.yaml` changelog "0.3.13 bổ sung 2 (… BE đề xuất, chờ ARC duyệt)"
- Vấn đề: Changelog còn trạng thái "chờ ARC duyệt".
- Đề xuất: Đổi thành "ARC duyệt 16/11 – `rounds/round-05/reviews/ARC-on-be-pr-180.md`" trước khi merge (một dòng, không đổi hợp đồng).
- Trạng thái: Open

### FB-R5-ARC-BE-180-05
- Mức độ: Suggestion
- Vị trí: CI PR #180
- Vấn đề: Job `docker images build · E2E smoke` còn pending tại head `059ba0db`.
- Đề xuất: Chỉ merge khi job này xanh. Nếu đỏ do PR này → quay lại ARC; nếu đỏ do hạ tầng → OPS chạy lại.
- Trạng thái: Open

## Quyết định

**DUYỆT (approved)** – không Blocker/Major. 4 Minor + 1 Suggestion; điều kiện merge: E2E smoke xanh và sửa dòng changelog (thẻ 04). Thẻ 01–03 BE trả lời trong `responses/BE-responses.md` (Done hoặc Deferred có lý do).

| Ngày | Round | Quyết định |
|---|---|---|
| 2026-11-16 | 5 | ARC duyệt PR #180 (head 059ba0db, OpenAPI 0.3.13 bổ sung 2): hợp đồng chỉ thêm, allowlist sạch, chung bucket/bulkhead/trần/cache với price-estimate, không trả 0; 4 Minor + 1 Suggestion, merge khi E2E smoke xanh |
