# BE – FB-INV-011: tỷ giá Vietcombank cho giá ước tính theo ngôn ngữ (máy chủ)

- Người làm: BE | Round 5 – Bước: **Sản xuất** | 17/11/2026
- Nhánh `r5-fb011-be-fx` cắt từ `origin/main` `ab4733f2`. Căn cứ: `04-investor-feedback/FB-INV-011.md`, hợp đồng `rounds/round-05/fb-inv-011/contract.md`.
- FE song song: PR #186 (`r5-fb011-fe-currency`). Khối `fx` đúng hợp đồng, không đổi tên trường.

## 1. Đã làm

| Việc | Cách làm |
|---|---|
| Nguồn tỷ giá | XML công khai của Vietcombank `https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10`. Đã kiểm 17/11/2026 12:16: HTTP 200, `text/xml`, 2.565 byte, gốc `<ExrateList>`, `<DateTime>M/D/YYYY h:mm:ss AM/PM</DateTime>` (giờ VN), mỗi mã một `<Exrate … Sell="…"/>`. Lấy cột **Sell**. File ghi "tối đa 1 lần / 5 phút"; job hỏi nhiều nhất 1 lần / giờ |
| Đọc an toàn | Không dùng thư viện XML. Có DOCTYPE, ENTITY, CDATA, chỉ thị xử lý (trừ prolog `<?xml?>`) hoặc tham chiếu thực thể lạ thì từ chối. Thân tối đa 64 KiB, đếm cả khi đọc luồng nên Content-Length sai cũng không lọt. Chỉ đọc `DateTime` và 4 mã USD/KRW/CNY/RUB; các mã khác bỏ qua. Số phải là số thập phân thường, nằm trong dải hợp lý: USD 10.000–60.000, KRW 7–50, CNY 1.400–9.000, RUB 100–800 (nằm trong dải landing tự kiểm ở PR #186, nên số máy chủ nhận thì trang không ẩn). Đủ cả 4 mã, mỗi mã một lần |
| Egress | Chỉ HTTPS tới đúng host `portal.vietcombank.com.vn`, không cổng lạ, không theo redirect (`redirect: 'error'`), timeout 10 giây. Giao dịch DB đang mở trong lúc gọi mạng, 10 giây vẫn dưới `idle_in_transaction_session_timeout` 30 giây của `ottimo_app` |
| Job `fx.refresh` | Chạy ở worker (tick mỗi phút, tự gác). Lần tick đầu sau khi worker khởi động thì gọi ngay nếu chưa có bảng của hôm nay. Sau đó tối đa 1 lần / giờ, chỉ từ 07:30 giờ VN, tới khi có bảng mang ngày hôm nay. `FX_RATES_FETCH`: `vietcombank` \| `off`; để trống thì staging/production bật, các môi trường khác tắt (CI, dev, test không gọi mạng). Job cũng đăng ký ở api (cho test-support) nhưng ở api luôn tắt |
| Lưu | Khóa danh mục `fx_rates.vietcombank` (json). Giá trị `{asOf, publishedAt, rates}`, dòng có hiệu lực từ ngày nghiệp vụ. Trong ngày, khi có bảng mới hơn thì ghi đè dòng của hôm nay. Dòng quá khứ không bao giờ sửa. Có bảng cũ hơn bảng đã lưu thì không ghi. Sau khi ghi gửi `pg_notify config_changed` |
| Khi lỗi | Giữ tỷ giá cũ, không ghi gì. Log một dòng `warn` có mã lỗi (không có nội dung trả về). Mở mục "Cần chú ý" `data_quality`, `check = fx_rate_fetch_failed`: mức `warning`, chỉ OWN thấy, tối đa một mục mới mỗi ngày (OWN đóng rồi thì trong ngày không mở lại). Lần lấy được kế tiếp tự đóng mục này |
| OWN ghi đè | Khóa `fx_rate_overrides` (json, chỉ OWN, mặc định `{}`), sửa bằng `setParameter` có sẵn, có "Hiệu lực từ". Ví dụ `{"USD": 25500}`. Hook public-site kiểm: mã ngoài allowlist → 422 `VALIDATION_FAILED`/`NOT_ALLOWED`; số ngoài dải → 422 `PARAM_OUT_OF_RANGE` kèm `min`/`max`. `fx_rates.vietcombank` chỉ worker ghi: `setParameter` trả 403 cho mọi vai và ghi `access.denied` |
| `monthly-rates` | Thêm khối `fx` tùy chọn, đúng hợp đồng: `base`, `source`, `asOf`, `rates`. Đọc trong cùng giao dịch READ ONLY, dùng chung cache 60 giây, giới hạn RAM và trần tính mới như cũ. Không có endpoint mới, `price-estimate` không đổi |
| OpenAPI | 0.3.13 **bổ sung 3**: `PublicMonthlyRates.fx` + schema `PublicFxRates` (`additionalProperties: false`, 4 mã), `AttentionItem` `data_quality` `check = fx_rate_fetch_failed`, 2 khóa danh mục. Đã sinh lại `openapi-meta.ts`, `openapi-schemas.ts`, api-client `generated/openapi.ts` |
| Migration | **Có**, chỉ dữ liệu: `0098_fx_rates_fb_inv_011.sql` thêm 2 dòng `config_parameter_def`, không đổi schema (snapshot = 0095). Số tạm: 0096 đã bỏ hẳn (ARC 04/11), 0097 là PR #172. `when` = 0095 + 4000 nên 0097 vẫn xếp trước được. ORC xác nhận số |

## 2. Luật hiển thị `fx` (BE tự quyết, xin ARC xác nhận khi review)

1. Với từng mã: nếu có tỷ giá tay của OWN đang hiệu lực và ≤ 7 ngày tuổi thì dùng tỷ giá tay, `asOf` = ngày hiệu lực. Nếu không, dùng tỷ giá Vietcombank ≤ 7 ngày tuổi, `asOf` = ngày của bảng Vietcombank. Tuổi so với ngày nghiệp vụ.
2. Tỷ giá tay quá 7 ngày thì nhường lại tỷ giá Vietcombank còn mới. Muốn giữ số tay, OWN lưu lại.
3. Mã không có tỷ giá hợp lệ thì **vắng** trong `rates`; landing chỉ hiện VND cho ngôn ngữ đó. Không còn mã nào thì bỏ cả khối `fx`.
4. `source = manual` khi ít nhất một mã dùng tỷ giá tay. `asOf` = ngày **cũ nhất** trong các tỷ giá đã trả.

## 3. Test

- `test/fb-inv-011-fx-units.test.ts` (18 ca, không DB): đọc bảng thật 17/11 và giờ 12h/24h; từ chối DOCTYPE/ENTITY (billion laughs, XXE), CDATA, PI, thực thể lạ; trần kích thước; ngày sai; thiếu mã, trùng mã, số sai định dạng, ngoài dải; bỏ qua mã ngoài allowlist; fetcher (host khác, http, cổng, host giả, status, content-type, Content-Length, luồng vô hạn, lỗi mạng, timeout); luật 7 ngày, ghi đè, nhường lại; kiểm `fx_rate_overrides`; DTO allowlist so với OpenAPI `PublicFxRates`; `FX_RATES_FETCH`.
- `test/integration/fb-inv-011-fx.test.ts` (6 ca, PostgreSQL thật, nguồn giả, không gọi mạng): lưu lần khởi động và không gọi lại trong ngày; lỗi thì giữ tỷ giá cũ, log mã, một cảnh báo OWN mỗi ngày, thử lại theo giờ; bảng sai dải; hook 403/422; quá 7 ngày thì bỏ `fx`; ghi đè `manual` trộn với Vietcombank.
- Toàn bộ api trên Postgres 17 cục bộ: xem mục 5 của PR.

## 4. Cho OPS

- Egress: **chỉ worker** cần ra `https://portal.vietcombank.com.vn:443` (Akamai, IP đổi, nên mở theo tên host nếu tường lửa lọc theo IP). api không gọi.
- Biến mới `FX_RATES_FETCH` (không bí mật): để trống là đủ; đặt `off` nếu muốn tắt. Nên thêm vào `.env.example` và runbook ở PR OPS.
- Theo dõi: log `fx rates fetch failed – stored rates kept` (`code`), mục "Cần chú ý" `fx_rate_fetch_failed`. Không đổi cấu hình Caddy (đường `monthly-rates` đã có).

## 5. Việc còn lại / cho vai khác

- **FE Desk (không bắt buộc)**: màn Tham số đã hiện 2 khóa ở nhóm "Khác" và sửa được dạng JSON. Nếu muốn thì thêm nhãn tiếng Việt cho 2 khóa và câu cho `attn.dq_*` của `fx_rate_fetch_failed` (hiện đang hiện câu chung của `data_quality`).
- **BA/DOM**: thêm 2 khóa vào `product/docs/tham-so-quy-tac.*` và `erd.md` 9.3. Bill vẫn dùng `fx_usd_vnd` (OWN/MGR nhập tay); có gộp với nguồn Vietcombank không là câu hỏi DOM, PR này không đổi.
- **SEC**: review phần đọc XML và egress.
