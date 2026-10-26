# SEC review – Đo truy cập ottimo.vn, phương án C+ (ESC-034 = C)

- Người review: SEC | Ngày: 26/10/2026 | Round 3 – Bước Review (trước khi FE-LP/OPS làm).
- Đối tượng: `rounds/round-03/outputs/DATA/web-analytics-proposal.md` mục 2.3, 2.4, 3.4, 5 (phương án C+). INV chọn ESC-034 = C ngày 26/10 (decision-log 26/10 "INV – FB-INV-004").
- Đối chiếu: ADR-014 mục 6.1–6.3 (5 điều kiện không cần banner), `product/infra/caddy/Caddyfile.landing`, `product/apps/landing-web/src/lib/security-headers.json`, `src/content/privacy.ts`, `infra/docker/Dockerfile.landing`, `04-investor-feedback/lawyer-questions-2026-10-26.md` Phụ lục A/B.
- Tệp này không chứa IP, mật khẩu hay dữ liệu khách nào.

## 1. Kết luận

**Đạt có điều kiện.** Blocker: 0. Major: 4. Minor: 3. Suggestion: 2.

Thiết kế C+ đúng hướng: không cookie, không bên thứ ba, không định danh, CSP giữ nguyên. Nhưng phần Caddy có **một bẫy đã kiểm thật** (FB-…-01): nếu viết hai `log` trong một site mà không chỉ định `log_name`, Caddy 2.11.7 đổ **toàn bộ** log truy cập vào logger cuối cùng. Hậu quả: log bảo mật chung mất; trang thường lẫn vào file đếm. FE-LP/OPS chỉ được gộp khi đủ các điều kiện ở mục 4. QA kiểm theo mục 5.

| Hạng mục ORC hỏi | Kết quả |
|---|---|
| 5 điều kiện ADR-014 6.3 | **Đạt về thiết kế, có điều kiện khi làm.** Chi tiết ở mục 2. Điều kiện 3 (không lưu IP/định danh) phụ thuộc cấu hình logger: FB-01, FB-02. Điều kiện 4 (thông báo) cần câu trong thông báo + dòng chân trang **trước** khi bật `/e/`: FB-03. |
| Không định danh người dùng / không fingerprint | **Đạt.** Mỗi tín hiệu chỉ gồm 6 đoạn đóng: sự kiện, vị trí, ngôn ngữ, nhóm nguồn (7 nhóm), thiết bị (1 bit từ bề rộng màn hình). Không có User-Agent, mã phiên, mã lượt tải, số ngẫu nhiên. Tổ hợp tối đa chỉ vài nghìn giá trị, dùng chung cho mọi người xem. Điều kiện giữ nguyên trạng: FB-04. |
| CSP giữ nguyên | **Đạt.** `sendBeacon` tới cùng origin thuộc `connect-src 'self'`. Không cần sửa `Caddyfile.landing` (`landing_headers`), `security-headers.json` hay `check-dist`. Module đếm nằm trong bundle `/_astro/…`, không script inline. |
| Chống bơm số | **Có điều kiện.** Ảnh Caddy đang dùng **không có** module giới hạn tần suất (kiểm thật, mục 3). SEC **không** yêu cầu thêm plugin ở bản này. Bơm số chỉ làm sai số đếm, không lộ dữ liệu. Bù lại bằng các lớp lọc rẻ (FB-05) và giới hạn dung lượng log (FB-06). |
| Câu "no cookies" trong thông báo | **Vẫn đúng.** C+ không đặt cookie, không dùng `localStorage`/`sessionStorage`; phản hồi 204 không có `Set-Cookie`. Câu "loads nothing from other companies" vẫn đúng: Search Console xác minh bằng DNS, không gắn gì vào trang. |
| Thêm câu vào Phụ lục A/B thư luật sư | **Cần (điều kiện 4 ADR-014 6.3), SEC đã thêm.** Một câu ở mục **Cookies / Cookie** của cả hai phụ lục, kèm một dòng ghi chú cho INV. Xem mục 6. |

## 2. Đối chiếu 5 điều kiện ADR-014 6.3

| # | Điều kiện | C+ | Ghi chú |
|---|---|---|---|
| 1 | Không cookie/lưu trữ trên máy khách cho đo lường | Đạt | FB-04 (a): không `localStorage`/`sessionStorage`/IndexedDB/cookie trong module đếm; có test. |
| 2 | Không gửi dữ liệu cho bên thứ ba | Đạt | Tín hiệu cùng origin. Email tuần đi qua Google Workspace nhưng chỉ chứa **số tổng**, không phải dữ liệu cá nhân: FB-S2. Search Console là số Google tự tổng hợp, không có gì từ trang gửi đi. |
| 3 | Không lưu IP hay định danh | **Có điều kiện** | FB-01 (định tuyến logger), FB-02 (xóa trường, độ chính xác thời gian, ghi ra file). |
| 4 | Thông báo mô tả việc đếm | **Có điều kiện** | Câu đã thêm vào Phụ lục A/B. FE-LP đưa nguyên câu vào `privacy.ts`. Trang `/privacy/` chưa đăng nên phải có dòng chân trang **trước khi** `/e/` nhận tín hiệu: FB-03. |
| 5 | Không định danh từng người xem ở bất kỳ đâu; không gửi ngày, số khách, nội dung ô nhập | Đạt | FB-04 (b–e). Không có bộ giới hạn tần suất theo IP, nên trong RAM cũng không giữ IP. |

## 3. Kiểm đã chạy

Trên máy SEC, ảnh đúng digest đang ghim trong `Dockerfile.landing` (`caddy:2-alpine@sha256:d8542f48…`). Caddyfile thử nằm trong thư mục tạm, không đưa vào repo. Container đã xóa.
- `caddy version` → **v2.11.7**. `caddy list-modules` → **không** có module rate limit.
- `log_skip`, `log_name`, logger thứ hai ghi ra file (`mode 0600`, `roll_interval`, `roll_keep_for`), `format filter` + `wrap json { time_format … }`: **adapt được và chạy đúng** trên bản này. Giả định của DATA (mục 6, dòng 2) đã xác minh.
- **Bẫy định tuyến log.** Site có hai `log` (chung + `events`), chỉ đặt `log_name events` trong route `/e/`. Kết quả: `GET /` và `GET /missing` **cũng ghi vào file events**, stdout không còn dòng nào. `caddy adapt` cho thấy lý do: `"default_logger_name":"events"`, tức Caddyfile adapter lấy logger cuối làm mặc định. Đặt **`log_name main` ở cấp site** (trước các route), rồi ghi đè `log_name events` trong route `/e/`. Kết quả đúng: trang thường → stdout (`main`); `/e/` hợp lệ → file; `/e/` sai → 404, không ghi ở đâu cả.
- Bộ lọc đã thử. Chỉ tín hiệu hợp lệ nhận 204. Các trường hợp sau đều trả 404 và **không ghi log**:
  - có query (`?name=…`);
  - `Sec-Fetch-Site: cross-site`;
  - giá trị ngoài danh sách (thử một chuỗi số giả số điện thoại);
  - `GET`.
- Dòng log `/e/` sau bộ lọc chỉ còn: `level`, `ts` (đã cắt), `logger`, `msg`, `request{proto, method, host, uri}`, `bytes_read`, `size`, `status`. Không IP, không cổng, không header (gồm User-Agent, Referer có `fbclid`/`gclid`), không TLS.
- **Múi giờ.** Ảnh alpine không có `tzdata`: `TZ=Asia/Ho_Chi_Minh` + `time_local` vẫn ra giờ UTC. Script cộng phải tự đổi sang ngày giờ Việt Nam: FB-S1.

## 3a. Mẫu cấu hình đã kiểm (tham khảo cho OPS, không phải bản cuối)

```caddyfile
	log main { …giữ nguyên bộ lọc hiện tại (IP /24, bỏ query, bỏ header)… }
	log events {
		output file /data/events/events.log {
			mode 0600
			roll_interval 24h
			roll_keep_for 168h
			roll_size 10MiB
			roll_keep 10
		}
		format filter {
			wrap json {
				time_format "2006-01-02T15Z07:00"
			}
			fields {
				request>remote_ip delete
				request>client_ip delete
				request>remote_port delete
				request>headers delete
				request>tls delete
				request>uri regexp "\?.*$" ""
				resp_headers delete
				duration delete
				user_id delete
			}
		}
	}
	log_name main
	@event {
		method POST
		path_regexp ^/e/1/(<sự kiện>)/(<vị trí>)/(en|vi)/(google|facebook|zalo|instagram|qr|other|direct)/(m|d)$
		expression `{query} == ""`
		# + Content-Length rỗng/0, Sec-Fetch-Site, Origin, Sec-GPC – xem FB-05
	}
	handle @event {
		log_name events
		header Cache-Control "no-store"
		respond 204
	}
	handle /e/* {
		log_skip
		respond 404
	}
```

## 4. Thẻ feedback

### FB-R3-SEC-DATA-01
- Mức độ: Major
- Vị trí: đề xuất mục 2.3 bước 2 ("logger riêng", "`log_skip`"); `product/infra/caddy/Caddyfile.landing` site `{$LANDING_HOST}` (OPS sẽ sửa)
- Vấn đề: Caddy 2.11.7 (ảnh đang ghim) lấy logger **cuối cùng** khai báo trong site làm logger mặc định khi có từ hai `log` trở lên. SEC đã kiểm thật (mục 3). Nếu chỉ gắn `log_name`/`log_skip` cho `/e/`, mọi request khác sẽ:
  - rời log chung (stdout, IP /24) – mất log bảo mật SR-LOG;
  - rơi vào file đếm, và script cộng đếm nhầm.
- Vì sao quan trọng: mất log điều tra sự cố trên trang công khai (gồm form US-155 khi bật); số đếm sai; nếu sau này ai đổi bộ lọc của file events thì trang thường cũng mất che IP.
- Đề xuất sửa (OPS):
  - Đặt tên rõ cho cả hai logger (`main`, `events`).
  - `log_name main` ở **cấp site**, trước mọi route; chỉ route `/e/` hợp lệ ghi đè `log_name events`.
  - Mọi `/e/*` không hợp lệ: `log_skip` + `respond 404`. Dùng `respond`, không dùng `error`, để không đi qua `handle_errors` và không ghi lỗi.
  - Site `{$LANDING_WWW_HOST}` không đổi.
  - `infra/ci/check-caddy-landing.sh` thêm 3 kiểm:
    - (a) `GET /` và 404 thường vẫn ra stdout, với `logger` = `…access.main`;
    - (b) `POST /e/` hợp lệ **không** có trên stdout và có trong file;
    - (c) `/e/` không hợp lệ không có ở cả hai nơi.
- Trạng thái: Open

### FB-R3-SEC-DATA-02
- Mức độ: Major
- Vị trí: đề xuất mục 2.3 bước 2–3 ("xóa hẳn `remote_ip`, `client_ip`, header, query"; "Docker đang xoay vòng log 20 MB × 5")
- Vấn đề: xóa IP thôi chưa đủ để không ghép lại được từng người.
  - (1) Dòng log còn `request>remote_port`, `request>tls` (bộ mã hóa, phiên bản, tên máy chủ), `duration`, `resp_headers`.
  - (2) Header `Referer` của tín hiệu cùng origin chứa **đầy đủ URL trang**, gồm `fbclid`/`gclid`/UTM. Lý do: `strict-origin-when-cross-origin` vẫn gửi đủ URL khi cùng origin.
  - (3) Mốc thời gian chính xác tới phần nghìn giây. Ghép với log chung (có IP /24 và thời điểm `GET /`) là nối được tín hiệu với dải IP.
  - (4) Nếu logger `/e/` ghi ra stdout như đề xuất, Docker json-file **tự thêm** mốc thời gian nano giây vào mỗi dòng. Khi đó cắt `ts` trong Caddy cũng vô ích.
- Vì sao quan trọng: điều kiện 3 và 5 ADR-014 6.3 (không định danh ở bất kỳ đâu) – nền của việc không cần banner. Rủi ro R4 trong đề xuất.
- Đề xuất sửa (OPS):
  - Bộ lọc của `events` **xóa**: `request>remote_ip`, `request>client_ip`, `request>remote_port`, `request>headers`, `request>tls`, `resp_headers`, `duration`, `user_id`. Cắt query khỏi `request>uri`.
  - `ts` tối đa tới **giờ** (`time_format "2006-01-02T15Z07:00"`), không phút/giây.
  - Ghi ra **file** trên một volume riêng (ví dụ `landing-events`, gắn rw vào `/data/events`, container vẫn `read_only`), `mode 0600`. **Không** ghi stdout.
  - Kiểm trong `check-caddy-landing.sh`: dòng events không chứa các khóa `remote_ip`, `client_ip`, `remote_port`, `headers`, `tls`, `duration`; `ts` khớp `^\d{4}-\d{2}-\d{2}T\d{2}Z$`; `uri` không có `?`.
- Trạng thái: Open

### FB-R3-SEC-DATA-03
- Mức độ: Major
- Vị trí: đề xuất mục 3.4; `product/apps/landing-web/src/content/privacy.ts` (mục Cookies EN/VI); chân trang landing
- Vấn đề: điều kiện 4 ADR-014 6.3 bắt buộc thông báo mô tả việc đếm. Trang `/privacy/` chỉ đăng khi form bật (ESC-030), nên nếu `/e/` chạy trước thì người xem không có chỗ nào đọc được mô tả.
- Vì sao quan trọng: thiếu thông báo thì giả định "không cần banner" mất một chân. Thông báo cũng phải khớp đúng bản đã gửi luật sư (Phụ lục A/B).
- Đề xuất sửa:
  - SEC đã thêm câu vào Phụ lục A/B thư luật sư (mục 6).
  - FE-LP đưa **nguyên văn** câu đó vào `privacy.ts` (en/vi), ngay sau câu "This website sets no cookies…" / "Website này không đặt cookie…". Luật sư sửa câu thì đổi theo, tăng số phiên bản (quy tắc của Phụ lục A).
  - Cho tới khi `/privacy/` đăng: chân trang EN và VI có một dòng ngắn cùng nghĩa (UXD/CPY duyệt chữ theo Brand Guidelines: EN dẫn, VI hỗ trợ, không emoji).
  - Bản landing có `/e/` **không** được phát hành nếu thiếu dòng này. Thêm vào `check:dist`: trang chủ en/vi có dòng chân trang khi module đếm có mặt trong bundle.
- Trạng thái: Open

### FB-R3-SEC-DATA-04
- Mức độ: Major
- Vị trí: đề xuất mục 2.3 bước 1, 2.4; module đếm FE-LP sẽ viết (`main.ts`/module mới), `data-track`
- Vấn đề: thiết kế đúng, nhưng các bất biến sau chưa thành tiêu chí kiểm. Thiếu một bất biến là trái điều kiện 1 hoặc 5.
- Vì sao quan trọng: đây là điều phân biệt "đếm ẩn danh" với "theo dõi".
- Đề xuất sửa (FE-LP, điều kiện gộp):
  - (a) Module đếm **không** dùng cookie, `localStorage`, `sessionStorage`, IndexedDB. Lựa chọn ngôn ngữ đã có giữ nguyên, không đụng tới.
  - (b) Đường dẫn chỉ gồm 6 đoạn lấy từ **hằng số** trong danh sách cho phép; giá trị ngoài danh sách → `other`/`na`. Không mã lượt tải, mã phiên, số ngẫu nhiên, mốc thời gian, độ phân giải màn hình (chỉ `m`/`d`), múi giờ, ngôn ngữ trình duyệt.
  - (c) Nhóm nguồn tính tại trình duyệt bằng `utmOf`/`refHostOf` rồi rút về 7 nhóm. **Không** gửi tên miền giới thiệu, giá trị UTM thô, `fbclid`/`gclid`. `sendBeacon(url)` **không có thân**.
  - (d) Không gửi khi `navigator.globalPrivacyControl === true`. `form_start` chỉ ghi nhận việc focus lần đầu, không đọc giá trị ô nào. `form_submit` không đếm ở trình duyệt.
  - (e) Một danh sách cho phép duy nhất (JSON/TS trong `landing-web`). Unit test: mọi URL module sinh ra đều khớp regex của route Caddy. CI so danh sách với regex trong `Caddyfile.landing`, vì lệch nhau thì tín hiệu bị 404 âm thầm.
  - (f) E2E Playwright:
    - chỉ có request tới `/e/1/…` cùng origin, không query, thân rỗng;
    - không có cookie, `localStorage`/`sessionStorage` không thêm khóa nào sau khi cuộn và bấm;
    - 0 vi phạm CSP;
    - bật GPC thì 0 request `/e/`.
- Trạng thái: Open

### FB-R3-SEC-DATA-05
- Mức độ: Major
- Vị trí: đề xuất mục 2.3 nhược điểm, mục 5 R6 ("Route chỉ nhận đúng mẫu; không ghi 404; cờ ngày bất thường")
- Vấn đề:
  - Ảnh Caddy v2.11.7 không có module rate limit (đã kiểm). Edge nginx chỉ giới hạn **số kết nối** theo IP (OPS-01), không giới hạn số request trong một kết nối h2.
  - Bất kỳ trang web nào cũng gọi được `navigator.sendBeacon('https://ottimo.vn/e/1/…')` từ trình duyệt của khách **họ** (bơm số chéo trang, không cần bot).
  - Đề xuất chưa nêu lọc theo `Origin`/`Sec-Fetch-Site`, thân request, `Sec-GPC` phía máy chủ.
- Vì sao quan trọng: số đếm sai làm INV quyết sai (kênh nào hiệu quả). Không lộ dữ liệu, nên mức Major chứ không phải Blocker.
- Đề xuất sửa (OPS; SEC **không** yêu cầu build Caddy kèm plugin ở bản này):
  - Route `/e/` hợp lệ khi **đủ** các điều kiện:
    - `POST`;
    - regex neo `^…$` theo danh sách cho phép;
    - không query;
    - `Content-Length` rỗng hoặc `0`;
    - `Sec-Fetch-Site`, nếu có, bằng `same-origin`;
    - `Origin`, nếu có, bằng `https://{$LANDING_HOST}`.
  - Còn lại `log_skip` + 404.
  - `Sec-GPC: 1` → `log_skip` + 204 (tôn trọng GPC ở cả phía máy chủ – ADR-014 6.1).
  - Script cộng: mỗi ngày có tổng > 20 lần trung vị 7 ngày, hoặc một tổ hợp chiếm > 50 % ngày đó, thì gắn cờ; email tuần ghi "số ngày X có dấu hiệu bất thường, chưa tính vào so sánh".
  - Xem lại rate limit (plugin `caddy-ratelimit` hoặc Desk API ADR-014 6.1) **chỉ khi** cờ bất thường xuất hiện > 2 lần/tháng. Lúc đó, khóa giới hạn theo IP chỉ được nằm trong RAM trong cửa sổ giới hạn (điều kiện 5).
- Trạng thái: Open

### FB-R3-SEC-DATA-06
- Mức độ: Minor
- Vị trí: đề xuất mục 2.3 bước 3 ("log thô `/e/` giữ tối đa 7 ngày rồi xóa")
- Vấn đề:
  - Đề xuất dựa vào xoay vòng log Docker (20 MB × 5) để giới hạn. Với logger ghi file (FB-02), giới hạn đó không còn áp dụng.
  - `roll_keep_for` của Caddy chỉ xóa các file **đã xoay**. File đang ghi không xoay nếu thiếu `roll_interval`.
  - Không giới hạn dung lượng thì một đợt bơm số làm đầy đĩa của VPS đang chạy Desk production.
- Vì sao quan trọng: đảm bảo hạn lưu ≤ 7 ngày là thật; tránh hết đĩa.
- Đề xuất sửa (OPS):
  - `roll_interval 24h`, `roll_keep_for 168h`, `roll_size 10MiB`, `roll_keep 10` (đã kiểm adapt). Tối đa khoảng 100 MB, tối đa khoảng 8 ngày.
  - Script cộng, khi cộng xong một ngày thành công, xóa các file đã xoay chứa trọn ngày đó. Giữ 7 ngày chỉ là mức trần khi script lỗi.
  - Script chạy với quyền tối thiểu, đọc được volume `landing-events`. CSV chỉ có 7 cột (ngày, 5 đoạn, số lượt), không có dòng log thô.
- Trạng thái: Open

### FB-R3-SEC-DATA-07
- Mức độ: Minor
- Vị trí: đề xuất mục 2.3 (không nói tới staging); `{$LANDING_HOST}` dùng chung cho `staging.ottimo.vn`
- Vấn đề:
  - Bản xem trước staging dùng cùng ảnh và cùng Caddyfile, nên cũng nhận `/e/`.
  - Số của người duyệt nội bộ có thể lẫn vào CSV/email nếu script đọc nhầm volume.
  - Staging có basic auth, nhưng logger events xóa header nên không lộ.
- Vì sao quan trọng: số sai, và tránh thêm một nơi giữ log.
- Đề xuất sửa (OPS):
  - Biến `LANDING_EVENTS` (mặc định `off`) giống `LANDING_PUBLIC_API`. `off` → `/e/*` trả 204 + `log_skip`, để trang không báo lỗi.
  - Chỉ production đặt `on`. Script cộng và cron chỉ cài trên stack production.
- Trạng thái: Open

### FB-R3-SEC-DATA-08
- Mức độ: Minor
- Vị trí: đề xuất mục 2.3 bước 2 ("`robots.txt` thêm `Disallow: /e/`")
- Vấn đề: chưa nói tới header phản hồi của 204/404 trên `/e/`.
- Vì sao quan trọng: không để bộ đệm trung gian giữ phản hồi; giữ đủ header bảo mật như mọi đường dẫn khác.
- Đề xuất sửa (OPS):
  - Phản hồi `/e/` có `Cache-Control: no-store`.
  - Vẫn qua `import landing_headers`; không có `Set-Cookie`, thân rỗng.
  - `check-caddy-landing.sh` kiểm 3 điều trên.
- Trạng thái: Open

### FB-R3-SEC-DATA-S1
- Mức độ: Suggestion
- Vị trí: đề xuất mục 2.3 bước 3 ("chạy 00:15 hằng ngày (giờ VN) đọc log `/e/` của ngày trước")
- Vấn đề: ảnh `caddy:2-alpine` không có `tzdata` (đã kiểm), nên `ts` luôn là UTC. Ngày theo UTC lệch ngày Việt Nam 7 giờ.
- Vì sao quan trọng: số theo ngày (W-01…W-07) sai ranh giới ngày.
- Đề xuất sửa:
  - Giữ `ts` UTC tới giờ (FB-02). Script đổi `+07:00` rồi cộng theo ngày Việt Nam. Chạy lúc 00:15 VN, tức 17:15 UTC: dòng của giờ 16Z đã ghi xong.
  - Không cài `tzdata` vào ảnh chỉ để làm việc này.
- Trạng thái: Open

### FB-R3-SEC-DATA-S2
- Mức độ: Suggestion
- Vị trí: đề xuất mục 2.3 bước 4 (email tuần qua SMTP relay Google Workspace)
- Vấn đề: email đi qua Google. Điều này hợp lệ vì nội dung chỉ là **số tổng** (không phải dữ liệu cá nhân, không trái ESC-002 A), nhưng cần giữ nguyên trạng.
- Vì sao quan trọng: tránh lần sau ai đó đính kèm log thô "cho tiện".
- Đề xuất sửa:
  - Email chỉ có bảng số và nhận xét. Không đính kèm log thô. CSV chỉ đính kèm nếu đúng 7 cột tổng.
  - Gửi tới hộp thư chung trên tên miền OTTIMO.
  - Thông tin đăng nhập SMTP lấy từ secret có sẵn trên máy chủ, không ghi vào repo hay script.
- Trạng thái: Open

## 5. Điều kiện gộp – checklist cho FE-LP / OPS / QA

| # | Điều kiện | Vai | Thẻ |
|---|---|---|---|
| 1 | `log_name main` cấp site + `log_name events` chỉ trong route `/e/` hợp lệ; 3 kiểm định tuyến log trong `check-caddy-landing.sh` | OPS | 01 |
| 2 | Logger events ghi **file** (volume riêng, `0600`), xóa IP/cổng/header/TLS/duration, cắt query, `ts` tới giờ | OPS | 02 |
| 3 | Câu đếm trong `privacy.ts` (nguyên văn Phụ lục A/B) + dòng chân trang en/vi có trước khi `/e/` chạy; `check:dist` kiểm | FE-LP, UXD/CPY | 03 |
| 4 | Module đếm: không lưu trữ trình duyệt, 6 đoạn từ hằng số, không thân, GPC, một danh sách cho phép + test khớp regex Caddy, E2E | FE-LP | 04 |
| 5 | Lọc: POST, regex neo, không query, thân rỗng, `Sec-Fetch-Site`/`Origin` cùng origin, `Sec-GPC` bỏ qua, sai → `log_skip` 404; cờ bất thường trong script | OPS, DATA | 05 |
| 6 | `roll_interval 24h`, `roll_keep_for 168h`, `roll_size`/`roll_keep` giới hạn; xóa sau khi cộng | OPS | 06 |
| 7 | `LANDING_EVENTS=off` mặc định, chỉ production `on` | OPS | 07 |
| 8 | `Cache-Control: no-store`, đủ header bảo mật, không `Set-Cookie` trên `/e/` | OPS | 08 |

SEC xem lại diff của FE-LP + OPS (0,25 ngày) trước khi gắn tag `landing-v*`. Không cần ESC mới.

## 6. Thay đổi SEC đã làm trong thư luật sư

`04-investor-feedback/lawyer-questions-2026-10-26.md`:
- Phụ lục A, mục **Cookies**, thêm sau câu hiện có:
  - *To see how the website is used, we count page views and taps as daily totals only – without cookies, IP addresses or anything that identifies you.*
- Phụ lục B, mục **Cookie**, câu tương ứng:
  - *Để biết website được xem thế nào, OTTIMO chỉ đếm tổng lượt xem và lượt bấm theo ngày – không dùng cookie, không lưu địa chỉ IP hay bất cứ thông tin nào nhận diện bạn.*
- Ghi chú cho INV (phần không gửi) thêm một dòng: câu này mới, sẽ vào mã nguồn cùng bản landing đo truy cập (ESC-034 = C); không đổi câu hỏi nào.

Về chữ:
- Câu bám ý ADR-014 6.3 và đề xuất DATA 3.4.
- Đổi "no IP address" thành "without … IP addresses" gắn với việc **đếm**, vì log bảo mật chung vẫn giữ IP đã che /24. Viết như vậy để câu đúng với thực tế.
- CPY có thể biên tập giọng, nhưng không bỏ 3 ý: chỉ số tổng theo ngày; không cookie; không IP hay định danh.

## 7. Điểm làm tốt nên giữ

- Chọn dữ liệu theo nguyên tắc "không xử lý dữ liệu cá nhân" thay vì dựa vào ngoại lệ pháp lý. Thiết bị suy từ bề rộng màn hình thay cho User-Agent, còn chặt hơn ADR-014 6.1.
- `form_submit` lấy từ Desk thay vì trình duyệt, và tách rõ "dữ liệu đo" với "dữ liệu khách" (mục 3). Ô nhận ưu đãi để sau luật sư, đúng US-151 AC6.
- Đề xuất tự nêu rủi ro ghép log (R4) và bơm số (R6). Review này chỉ cần làm cụ thể cách giảm thiểu.
