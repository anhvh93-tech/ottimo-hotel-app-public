# SEC – Review PR #184 (trang tĩnh phụ `ottimo-static` sau edge dùng chung) – head `b77c51c2`

Ngày: 16/11/2026. Người làm: SEC. Việc phụ ngoài round (yêu cầu INV 16/11). Không SSH, không chạm máy chủ, không sửa code, không commit.

Căn cứ: `gh pr view 184`, `gh pr diff 184` (2 commit: `89d36f1f` golden, `b77c51c2` tính năng); `product/infra/server/bin/edge.sh`, `static-site.sh`, `product/infra/static/*`, `product/infra/edge/docker-compose.edge-static.yml`, `product/infra/ci/test-edge.sh`, `product/infra/server/README.md` mục 14; CI của PR (bước "Shared edge" chạy trong job `infra scripts (shellcheck)`: pass; gitleaks pass).

## 1. Kết luận

**DUYỆT.** Không có Blocker/Major. 4 thẻ Minor + 1 Suggestion, sửa được trong PR này hoặc PR kế tiếp, trước khi bật trang trên máy chủ thì tốt hơn (thẻ 166, 167).

## 2. Bảng kiểm

| # | Kiểm | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Route OTTIMO giữ nguyên byte | Đạt | `89d36f1f` chỉ thêm fixture + test, `edge.sh` chưa đổi, nên golden do **edge.sh cũ** sinh ra. Test: không `.env` / tên rỗng → `cmp` với golden; có trang → `grep -v static-site` bằng đúng bản OTTIMO-only và đếm đúng 4 dòng. `plan` chỉ in 4 dòng `+`, không đổi tệp đang dùng. |
| 2 | Không chiếm / chuyển hướng tên OTTIMO qua `.env` | Đạt (có thẻ Minor 167, 168) | Tên tĩnh chạy qua cùng `valid_host` (regex DNS chữ thường, không có `;`, khoảng trắng, `{`, `*`, xuống dòng). Kiểm trùng bằng `seen` **sau** khi đã nạp mọi tên của stack, nên tên tĩnh trùng tên OTTIMO thì dừng (có test). Lỗi → `die` trước `mv`, `nginx.conf` cũ giữ nguyên (có test). `.env` có mà không đọc được → dừng, không lặng lẽ bỏ route. `nginx -t` vẫn chạy. Chỉ đọc 2 khóa, ngoài ra không giá trị nào của `.env` vào `nginx.conf`. |
| 3 | PROXY protocol chỉ nhận từ IP edge | Đạt (Suggestion 170) | `PROXY_PROTOCOL_ALLOW: 172.31.3.2/32` cố định trong compose, không lấy từ `.env`. Edge ở `.2` cố định qua overlay. Địa chỉ động chỉ cấp trong `.128/25`, Caddy ở `.10`. Mạng `ottimo-link-static` chỉ có edge và Caddy tĩnh. Container tĩnh không ở mạng staging/production nên không tới thẳng backend OTTIMO. Cổng 80 (chỉ 301) không bật PROXY, Caddy không tin `X-Forwarded-For` (không có `trusted_proxies`). |
| 4 | Hardening container | Đạt | uid 10001, `read_only`, `cap_drop: [ALL]`, `no-new-privileges`, 96 MB / 100 pids, không publish cổng (test kiểm `PortBindings` = rỗng), Caddyfile + web root `:ro`, `admin off`. Base `caddy:2-alpine@sha256:d8542f48…` trùng `Dockerfile.landing`. Bỏ file capability bằng `cp` + sysctl `ip_unprivileged_port_start=0` (có namespace, không đụng host). Log journald, che IP /24, bỏ query và header. |
| 5 | CSP trang tĩnh chỉ áp cho trang tĩnh | Đạt | `(static_headers)` nằm riêng trong `Caddyfile.static`, container riêng, không OTTIMO Caddyfile nào import. Có test e2e: CSP landing OTTIMO vẫn `script-src 'self';` + `style-src 'self';`. CSP `'unsafe-inline'` + Google Fonts là yêu cầu chủ trang: **chấp nhận**. Trang lỗi (`handle_errors`) cũng có đủ header. |
| 6 | Không bí mật / IP / e-mail / tên miền thật | Đạt | Quét diff: tên miền chỉ có `ottimo.vn` và các tên con (đã công khai), `fonts.googleapis.com`/`fonts.gstatic.com`, `example.test`/`.invalid`/`*.localhost`. IP chỉ có 172.31.x, 127.0.0.1, 203.0.113.9 (TEST-NET). Không có tên miền của doanh nghiệp kia, không có IP VPS. gitleaks pass. |
| 7 | Quyền tệp web root | Đạt (có thẻ Minor 166, 169) | README: `install -d … 0755 root:root`, `rsync --chmod=D755,F644 --chown=root:root`. Mount `:ro`, uid 10001 không ghi được. `check()` từ chối khi thư mục/tệp không đọc được. Nội dung công khai nên đọc được cho mọi người là đúng. |

Khác: chỉ cho GET/HEAD, thân ≤ 1 KB, tệp chấm và `.map` → 404 (trừ `/.well-known/`). Caddy so `path_regexp` trên đường dẫn đã giải mã, nên `%2e` không lách được. `file_server` không bật duyệt thư mục. `static-site.sh up` từ chối khi edge chưa route, nên không có lượt ACME hỏng.

## 3. Thẻ

### FB-R5-SEC-OPS-166
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/static-site.sh` `check()`; `product/infra/server/README.md` 14.1 bước 2 (`rsync -a …`)
- Vấn đề: `file_server` của Caddy đi theo symlink. `rsync -a` giữ nguyên symlink trong gói của chủ trang. Một symlink trong web root, ví dụ `k.txt → /home/caddy/data/caddy/certificates/…/<tên>.key`, sẽ phát **khóa riêng TLS và khóa tài khoản ACME** của trang tĩnh. uid 10001 đọc được thư mục đó, và tên `k.txt` không khớp `@hidden`. Phạm vi chỉ là chứng chỉ của trang tĩnh: volume và container tách khỏi OTTIMO.
- Vì sao quan trọng: nội dung do bên thứ ba bàn giao, sau này còn `rsync` lại nhiều lần. Lộ khóa cho phép giả mạo trang đó cho tới khi thu hồi chứng chỉ.
- Đề xuất sửa: trong `check()`, thêm `[ -z "$(find "$root" -type l | head -n 1)" ] || die "symlink in web root"`. README đổi `rsync -a` thành `rsync -rlt --no-links` (hoặc `--copy-unsafe-links`). Có thể thêm một ca test (symlink → `check` từ chối).
- Trạng thái: Open

### FB-R5-SEC-OPS-167
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/edge.sh` `collect_static()` + vòng `for host in $static_hosts`
- Vấn đề: hai giá trị bị nối thành `"$host $www"` rồi tách theo khoảng trắng mà không có dấu nháy. `STATIC_HOST=a.test b.test` vì thế thành **2 tên tĩnh**: cả hai qua `valid_host`, đếm vẫn như "có cả hai", và route ra 6 dòng thay vì 4. Glob (`*`) cũng bị khai triển theo thư mục hiện tại trước khi kiểm. Tên OTTIMO vẫn không chiếm được, vì mỗi tên vẫn bị kiểm trùng. Nhưng luật "đúng 2 tên, apex + www" không được bảo đảm. Ngoài ra không kiểm `STATIC_WWW_HOST = www.$STATIC_HOST`.
- Vì sao quan trọng: gõ sai trong `.env` làm route thêm tên ngoài ý muốn. Caddy cũng nhận `{$STATIC_HOST}` nhiều địa chỉ, nên redirect `https://{$STATIC_HOST}{uri}` hỏng.
- Đề xuất sửa: gọi `valid_host "$host"` và `valid_host "$www"` riêng, trên từng biến có dấu nháy, ngay trong `collect_static()`. Bắt buộc `[ "$www" = "www.$host" ]`. Lưu kết quả vào mảng, không dùng chuỗi tách khoảng trắng. Thêm test cho giá trị có khoảng trắng và cho www không khớp apex.
- Trạng thái: Open

### FB-R5-SEC-OPS-168
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/edge.sh` `render()` (tập `seen`)
- Vấn đề: tên tĩnh chỉ bị so với tên của stack `EDGE_MODE=edge` đang được nạp. Tên con chưa route của OTTIMO (ví dụ `api.ottimo.vn`, `ottimo.vn` của một stack `direct`) vẫn được nhận làm trang tĩnh. Caddy tĩnh sẽ xin chứng chỉ cho tên đó nếu DNS trỏ về VPS.
- Vì sao quan trọng: lỗi vận hành (gõ nhầm, copy `.env`) có thể đưa một tên thuộc thương hiệu OTTIMO sang trang của doanh nghiệp khác, kèm CSP lỏng. Muốn khai thác phải có quyền root, nên đây chỉ là rào chắn lỗi người, không phải lỗ hổng leo quyền.
- Đề xuất sửa: từ chối tên tĩnh bằng hoặc kết thúc bằng `.<apex>` của mọi `LANDING_HOST` / `DESK_HOST` đã nạp (apex = bỏ nhãn đầu nếu có `www.`). Đơn giản hơn: chặn cứng hậu tố `ottimo.vn`. Thêm 1 ca test.
- Trạng thái: Open

### FB-R5-SEC-OPS-169
- Mức độ: Minor
- Vị trí: `product/infra/static/env.example` dòng 2 (`chmod 0640 root:ottimo`) và `product/infra/server/README.md` 14.1 bước 2 (`install -o root -g root -m 0600`)
- Vấn đề: hai chỗ ghi hai quyền khác nhau cho `/opt/ottimo-static/.env`. Nếu dùng 0600 root:root, user deploy (đầu `edge.sh` ghi "root or the deploy user") chạy `edge.sh render/up` sẽ dừng với "cannot be read". Đây là dừng an toàn, không mất route, nhưng chặn một thao tác được tài liệu cho phép.
- Vì sao quan trọng: hướng dẫn mâu thuẫn dễ dẫn tới chmod vội (ví dụ 0666) khi gặp lỗi lúc đang phát hành.
- Đề xuất sửa: thống nhất 0640 `root:ottimo` (tệp không có bí mật) ở cả README lẫn env.example. Ghi rõ tệp và thư mục chỉ root ghi được: đó là ranh giới bảo vệ tên miền OTTIMO.
- Trạng thái: Open

### FB-R5-SEC-OPS-170
- Mức độ: Suggestion
- Vị trí: `product/infra/ci/test-edge.sh` phần (b) trang tĩnh; `product/infra/server/bin/static-site.sh` `check()`
- Vấn đề: (1) có test chống giả PROXY header cho mạng production, nhưng chưa có cho `ottimo-link-static`. (2) `static-site.sh` không kiểm dạng tên trước khi đưa `STATIC_HOST` vào Caddyfile, mà chỉ `grep -E` với tên đã escape dấu chấm, nên ký tự regex khác vẫn lọt. Thực tế vẫn an toàn nhờ edge đã kiểm tên.
- Đề xuất sửa: (1) thêm ca: container ở 172.31.3.77 gửi PROXY header giả tới 172.31.3.10:443, log phải ra `172.31.3.0` (/24), không phải địa chỉ giả. (2) dùng chung `valid_host` (hoặc `grep -F`) trong `check()`. Nếu muốn, thêm `includeSubDomains` cho HSTS khi chủ trang đồng ý (hiện giữ như gói bàn giao).
- Trạng thái: Open

## 4. Điểm làm tốt
- Golden do edge.sh **trước** tính năng sinh ra, ở commit riêng. Đây là bằng chứng "OTTIMO không đổi byte" kiểm được, không chỉ là lời hứa.
- Đọc tên từ tệp, không từ biến shell, nên `sudo edge.sh up` cho OTTIMO không làm rơi route. `.env` không đọc được thì dừng.
- IP edge cố định ở compose, không cấu hình được. Mạng riêng, không publish cổng.
- `plan` cho xem diff trước `up`. `static-site.sh up` chặn ACME sớm.
- Test e2e chạy trên compose và image thật, gồm cả kiểm CSP landing OTTIMO không đổi.

## 5. Dòng decision-log (ORC chép khi gộp)

| 2026-11-16 | 5 | **SEC – review PR #184 @ b77c51c2 (trang tĩnh phụ `ottimo-static` sau edge): DUYỆT** (rounds/round-05/reviews/SEC-on-ops-pr-184.md). Route OTTIMO giữ nguyên byte (golden do edge.sh cũ sinh ở `89d36f1f`, test không trang / tên rỗng / bỏ 4 dòng); tên tĩnh qua `valid_host` + kiểm trùng stack, lỗi → giữ `nginx.conf` cũ; PROXY protocol chỉ từ 172.31.3.2 cố định; container uid 10001, read_only, cap_drop ALL, nnp, không cổng, base pin digest như landing; CSP riêng chỉ ở `Caddyfile.static`, CSP landing OTTIMO không đổi (test); không tên miền/IP/e-mail thật trong repo; `'unsafe-inline'` + Google Fonts chấp nhận theo yêu cầu chủ trang. Thẻ Minor: SEC-OPS-166 (symlink trong web root → lộ khóa TLS trang tĩnh; `find -type l` + `rsync --no-links`), 167 (tách tên theo khoảng trắng → thêm tên; kiểm từng biến, www = www.apex), 168 (chặn tên thuộc `ottimo.vn`), 169 (quyền `.env` 0600 vs 0640 mâu thuẫn); Suggestion 170 (test chống giả PROXY trên mạng static, kiểm tên trong static-site.sh). Nên sửa 166–167 trước khi bật trên máy chủ. Không ESC | SEC | Quyền SEC (review bảo mật) |
