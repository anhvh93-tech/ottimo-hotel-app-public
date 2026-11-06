# BUG-R4-054 – Đề xuất sửa: basic auth staging chặn `fetch` của form landing

Soạn: OPS · 06/11/2026 · Round 4, bước **Phản hồi & sửa**. Lỗi: `rounds/round-04/qa/bug-list.md` BUG-R4-054 (P3, chỉ staging). Bằng chứng QA: `rounds/round-04/qa/lp-v2-staging-s6.md` mục 2.
Tài liệu này chỉ là đề xuất. **Không sửa gì trên server.** Bản sửa thuộc v1.0.5, sau khi SEC duyệt (bảng quyền: SEC có quyền chặn với lỗi bảo mật).

## 1. Tóm tắt

- **Nguyên nhân:** snippet `secrets/landing_access` của staging có `basic_auth { … }` không kèm matcher, nên basic auth áp cho **mọi** request của `staging.ottimo.vn`, gồm 3 route công khai của form. Landing gọi `fetch(…, { credentials: 'omit' })`, nên trình duyệt không gửi basic auth cho `fetch`. Caddy trả 401 cho `form-token` / `price-estimate`. Khối giá ẩn, và form báo "We could not send your request". Production không có basic auth nên không bị.
- **Đề xuất (phương án A+):** chỉ trên staging, miễn basic auth cho **đúng 3 route công khai**, và chỉ khi công tắc mới `LANDING_PREVIEW_FORM_OPEN=on` (mặc định `off`) được bật cho một lượt thử. Trang, mọi `/v1/*` khác, `/health` vẫn bị basic auth + `noindex`. Kèm `header_up -Authorization` để mật khẩu xem trước không bao giờ tới api.
- **Đã thử local** (Caddy cùng digest với CI, api giả): đúng như mong đợi ở cả 5 cấu hình (mục 4). Snippet cũ vẫn chạy được với Caddyfile mới, nên triển khai từng bước không làm vỡ gì.
- **Trong lúc chờ:** README `infra/server` 12.3 "Staging landing lần đầu" đã ghi: form staging chỉ thử được bằng công cụ chèn header `Authorization`.

## 2. Ràng buộc (giữ nguyên)

1. Không đổi `credentials: 'omit'` của landing (SEC; production cần).
2. Staging và production chạy **cùng một image** landing (cùng digest, cùng 5 băm trang thông báo – SEC LPV2M-02). Không có bản dựng riêng cho staging.
3. Trang xem trước giữ basic auth + `X-Robots-Tag: noindex` (SEC ARC-10 điểm 4: bản xem trước giống hệt trang thật, chỉ `noindex` thì chưa đủ).
4. Production không đổi hành vi.

## 3. Các phương án

| | Cách làm | Ưu | Nhược / rủi ro | OPS chọn |
|---|---|---|---|---|
| **A+** | Caddyfile có matcher `@preview_gate` = "mọi request, **trừ** đúng 3 route công khai khi `LANDING_PREVIEW_FORM_OPEN=on`". Snippet staging đổi `basic_auth {` thành `basic_auth @preview_gate {`. Mặc định `off` = như hôm nay. Thêm `header_up -Authorization` vào proxy | Trình duyệt thường thử được form khi cần (INV, UXR, QA thủ công, Lighthouse). Ngoài lượt thử thì bề mặt mở ra internet như hôm nay. Production không đổi | Trong lúc bật: internet gọi thẳng được 3 route của api staging (mục 5). Phải nhớ tắt | **Đề xuất** |
| A | Như A+ nhưng luôn miễn (không công tắc) | Đơn giản nhất, không phải bật/tắt | 3 route của api staging mở thường trực. Staging có thể chạy mã mới hơn production | Không |
| B | Miễn basic auth cho 3 route theo **IP nguồn** (danh sách cho phép trong `.env`, so `client_ip` lấy từ PROXY protocol) | Không mở ra internet | IP 4G của INV/QA đổi liên tục. Mạng di động Việt Nam dùng CGNAT nên một IP có thể là hàng nghìn người. Thêm IP vào `.env` (dữ liệu nhạy cảm) mỗi lượt | Không |
| C | Giữ nguyên, chỉ ghi tài liệu: thử form staging bằng công cụ chèn header | Không rủi ro mới | Không ai thử được form bằng trình duyệt thường. Dễ báo nhầm là lỗi sản phẩm (đúng như BUG-R4-054). Lighthouse không đi được luồng form | Tạm thời (đã ghi README) |
| D | Dựng landing riêng cho staging với `credentials: 'same-origin'` | Không mở route | Phá ràng buộc 2: byte trang khác, băm khác, kiểm S4/P10 mất nghĩa | Loại |
| E | Cookie hoặc token xem trước | – | `credentials: 'omit'` bỏ cả cookie, nên không chạy | Loại |

## 4. Thử local (06/11, máy OPS, không chạm server)

Caddy `caddy:2-alpine@sha256:d8542f48…` (cùng digest với `infra/ci/check-caddy-landing.sh`), `Caddyfile.landing` của `main` cộng phần sửa ở mục 6, api giả trả lại method, path và header `Authorization` nhận được. `LANDING_PUBLIC_API=on` ở mọi cấu hình. Tệp thử để ở scratchpad của OPS, không vào repo.

| Request | Staging, snippet mới, `OPEN=on` | Staging, snippet mới, `OPEN=off` | Staging, **snippet cũ** (v1.0.4), `OPEN=on` | Production, `OPEN=off` | Production, `OPEN=on` |
|---|---|---|---|---|---|
| `GET /` không mật khẩu | 401 | 401 | 401 | 200 | 200 |
| `GET /` có mật khẩu | 200 | 200 | 200 | 200 | 200 |
| `GET …/dlt/form-token` | **200, tới api** | 401 | 401 | 200 | 200 |
| `GET …/dlt/price-estimate?a=1` | **200, tới api** | 401 | 401 | 200 | 200 |
| `POST …/dlt/booking-requests` | **200, tới api** | 401 | 401 | 200 | 200 |
| `POST …/form-token` (sai method) | 404 (không tới api) | 401 | 401 | 404 | 404 |
| `GET …/dlt/availability`, `GET /v1/me` | 401 | 401 | 401 | 404 | 404 |
| `GET …/form-token/` (thừa `/`) | 401 | 401 | 401 | 404 | 404 |
| `GET /privacy/` | 401 | 401 | 401 | 200 | 200 |
| `X-Robots-Tag: noindex, nofollow` | mọi phản hồi | mọi phản hồi | mọi phản hồi | không có | không có |

- `caddy validate`: cả ba snippet (staging mới, staging cũ, production) đều **Valid configuration**. Matcher không dùng tới (production) không gây lỗi.
- **Phát hiện thêm (có từ trước, không do đề xuất):** với Caddyfile hiện tại, khi client có gửi basic auth (trình duyệt cho điều hướng, hoặc QA chèn header ở S6), header `Authorization: Basic …` (chứa mật khẩu xem trước) được chuyển **nguyên** tới api staging. api không ghi header vào log (SR-LOG-02), nhưng mật khẩu vẫn không nên rời Caddy. Thêm `header_up -Authorization` thì api nhận `auth=` rỗng (đã thử trên cả staging và production).

## 5. Rủi ro của A+ để SEC duyệt

| # | Rủi ro | Mức (OPS) | Giảm thiểu |
|---|---|---|---|
| R1 | Khi bật, internet gọi thẳng được 3 route công khai của **api staging**. Staging có thể chạy mã mới hơn production (CI deploy staging sau mỗi lần gộp `main`, INV duyệt), nên lỗi chưa lên production có thể bị dò trước | Trung bình khi bật, 0 khi tắt | Mặc định `off`, chỉ bật trong lượt thử có ghi giờ. Chỉ đúng 3 route (regex khớp nguyên đường dẫn, sai method thì 404). Mọi route khác, `/health`, `/__test__/*` vẫn đóng. Mọi chốt hiện có vẫn áp: body ≤ 16 KB tại Caddy, query ASCII ≤ 256 byte, giới hạn bước 0 theo IP + trần 4 request công khai đang chạy của api, Origin/`Sec-Fetch-Site` của api. Staging `INCLUDE_TEST_SUPPORT=0` (đọc 06/11) |
| R2 | Người lạ gửi yêu cầu thật vào DB staging, tức dữ liệu cá nhân thật nằm trong môi trường thử. Tên `staging.ottimo.vn` có trong nhật ký Certificate Transparency công khai, nên bot quét có thể thử. Người thường không thấy form vì trang vẫn khóa | Thấp | Công tắc tắt ngoài lượt thử. Hết lượt: ORC đếm yêu cầu web tạo trong khoảng bật (SQL chỉ đọc, chỉ số đếm). Có yêu cầu không phải của đội thì xóa theo WR8. Staging: webhook Chat rỗng, email `mock`, nên không có tin hay thư nào gửi ra ngoài |
| R3 | Giá ước tính của staging lộ ra | Thấp | Staging dùng cùng bảng giá với production, và giá web đã công khai từ F2 (06/11). Nếu một lượt thử bảng giá **chưa công bố** thì không bật công tắc |
| R4 | Quên tắt công tắc | Thấp – trung bình | `deploy-landing.sh` in `WARNING: staging form routes open without the preview password` mỗi lần chạy khi công tắc bật. `ops-check` staging thêm mục báo khi `on` (nhắc mỗi 6 giờ trong journal). Runbook: bật/tắt nằm trong cùng phiên thử, ghi giờ vào biên bản |
| R5 | Bật nhầm trên production | Rất thấp | Snippet production không có `basic_auth`, nên matcher không có tác dụng (đã thử: `OPEN=on` không đổi gì). Thêm chốt: `deploy-landing.sh` từ chối `LANDING_PREVIEW_FORM_OPEN=on` khi `APP_ENV=production` |
| R6 | Mật khẩu xem trước tới api (đang xảy ra hôm nay khi client gửi basic auth) | Thấp | `header_up -Authorization` trong `(public_api)`, áp cho cả hai môi trường. Trình duyệt trên production không bao giờ gửi header này vì `credentials: 'omit'` |
| R7 | Đổi snippet bí mật `landing_access` trên staging (tệp do `init-secrets.sh` tạo một lần, không tự ghi lại) | Thấp | Snippet cũ vẫn hợp lệ với Caddyfile mới, hành vi như hôm nay. Triển khai: Caddyfile mới trước, snippet sau (`init-secrets.sh --refresh-landing-access`, chỉ đổi dòng `basic_auth {`, giữ nguyên băm mật khẩu). Snippet production không đổi |

Không đổi: `noindex` trên mọi phản hồi staging (đã thử), CSP và các header bảo mật của landing, cách api xác định IP khách (`TRUST_PROXY`, ca 6 S6).

## 6. Phần sửa v1.0.5 (OPS làm sau khi SEC duyệt)

Thay đổi trong `Caddyfile.landing`, đúng như bản đã thử ở mục 4:
```caddyfile
(public_api) {
	reverse_proxy {$LANDING_API_UPSTREAM:api:3000} {
		header_up -Authorization
		…
	}
}
{$LANDING_HOST} {
	import access_log
	@preview_gate {
		not {
			path_regexp preview_open ^/v1/public/properties/[a-z0-9-]{2,40}/(form-token|price-estimate|booking-requests)$
			expression `"{$LANDING_PREVIEW_FORM_OPEN:off}" == "on"`
		}
	}
	import /run/secrets/landing_access
	…
```
Snippet staging: `basic_auth @preview_gate { ottimo <băm> }` + `header X-Robots-Tag "noindex, nofollow"`.

Các tệp khác:
- `infra/docker-compose.prod.yml`: `LANDING_PREVIEW_FORM_OPEN: ${LANDING_PREVIEW_FORM_OPEN:-off}` cho service `landing`.
- `infra/server/env.example`: `LANDING_PREVIEW_FORM_OPEN=off` (kèm chú thích). `env.production.example` không có khóa này.
- `infra/server/bin/init-secrets.sh`: snippet staging mới có `@preview_gate`. Tùy chọn `--refresh-landing-access` cho stack đã có snippet: chỉ đổi dòng `basic_auth {`, quyền giữ nguyên, không in băm.
- `infra/server/bin/deploy-landing.sh`: (1) production + `on` → `FAIL`. (2) Staging + `on` → `WARNING`, và smoke thêm `GET form-token` không mật khẩu phải khác 401. (3) Staging + `off` → `form-token` không mật khẩu phải 401.
- `infra/server/bin/ops-check.sh`: mục `previewform` (chỉ staging): `on` → FAIL "preview form routes open", nhắc mỗi 6 giờ.
- Test: `infra/ci/check-caddy-landing.sh` thêm 10 ca của bảng mục 4 (snippet staging mới với `OPEN` on/off, snippet cũ, production với `OPEN=on`), cộng ca "api không nhận `Authorization`". `infra/ci/test-edge.sh` thêm một ca staging qua edge thật.
- README `infra/server` 12.3: cách bật cho một lượt thử: `ENVSET LANDING_PREVIEW_FORM_OPEN on` → `deploy-landing.sh <tag đang chạy> --no-pull` (staging gián đoạn khoảng 1 giây) → thử → `ENVSET … off` → deploy lại → đếm yêu cầu lạ (R2).

Ước lượng: khoảng nửa ngày OPS cộng một lượt SEC review. Không tốn chi phí, không cần INV.

## 7. Câu hỏi cho SEC

1. Chấp nhận A+ (mặc định tắt, bật theo lượt thử) không? Hay SEC muốn giữ C (chỉ dùng công cụ chèn header)?
2. Có cần công tắc **tự hết hạn** không (ví dụ `LANDING_PREVIEW_FORM_OPEN_UNTIL=<giờ>`, quá giờ thì Caddy coi như `off`)? Caddy làm được bằng `expression` so `{time.now.unix}`, đổi lại cấu hình phức tạp hơn. OPS thấy WARNING + `ops-check` là đủ.
3. `header_up -Authorization` áp cho cả production: SEC có đồng ý không? Api không dùng header này trên 3 route công khai.
4. Hết lượt thử: đếm yêu cầu lạ như R2, có cần ghi vào biên bản QA không?

## 8. Dòng decision-log đề nghị (ORC ghi khi SEC trả lời)

`| 2026-11-06 | 4 | OPS – đề xuất sửa BUG-R4-054 (P3, staging): phương án A+ – Caddyfile.landing có matcher @preview_gate (mọi request trừ đúng 3 route công khai form-token/price-estimate/booking-requests khi LANDING_PREVIEW_FORM_OPEN=on, mặc định off), snippet staging basic_auth @preview_gate, header_up -Authorization trên proxy; deploy-landing từ chối on ở production; thử local 5 cấu hình đạt; snippet cũ tương thích. Làm ở v1.0.5 sau khi SEC duyệt; tạm thời thử form staging bằng công cụ chèn header (README 12.3) | OPS | Quyền OPS (hạ tầng); chờ SEC |`
