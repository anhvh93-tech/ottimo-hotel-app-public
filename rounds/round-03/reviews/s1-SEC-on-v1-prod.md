# SEC review – Khởi tạo production (BE-A) và thiết kế production v1.0 (OPS)

- Người review: SEC | Ngày: 23/10/2026 | Round 3 – Bước Review (đường nhanh v1.0, điều kiện 2 và 4).
- Phạm vi:
  1. Nhánh `r3-v1-prod-bootstrap`, commit `6b5c8ae` (R3-OPS-02): lệnh quản trị `production-bootstrap`.
  2. Thiết kế production của OPS trên `main`, commit `7c2e682`, tài liệu `rounds/round-03/outputs/OPS/v1-production.md`. Gồm:
     - edge nginx (SNI + PROXY protocol);
     - `Caddyfile.prod` (listener PROXY) và `Caddyfile.landing`;
     - chốt chặn trong `deploy.sh`;
     - `release.yml`;
     - log edge mức `crit`;
     - thủ tục 06.33 lưu ngoài repo.
- Repo công khai: tệp này **không** chép nội dung thủ tục 06.33, không ghi IP, bí mật hay cách tấn công cụ thể. Dữ liệu dùng để kiểm là dữ liệu giả.

## 1. Kết luận

| Hạng mục | Kết luận |
|---|---|
| Lệnh khởi tạo production (`6b5c8ae`) | **Đạt, gộp được.** Không có Blocker hay Major. Có 2 thẻ Minor về cách bàn giao mật khẩu tạm. |
| Edge nginx + PROXY protocol | **Thiết kế tin cậy đúng**: header PROXY chỉ được nhận từ địa chỉ cố định của edge. **Có 1 Major** (FB-R3-SEC-OPS-01): edge có trần kết nối thấp và không giới hạn theo IP, nên một nguồn đơn lẻ có thể làm nghẽn cả production lẫn staging. Phải sửa trước khi production nhận người dùng thật. |
| `Caddyfile.landing` | Đạt. |
| Chốt chặn `deploy.sh` | Đạt. Có 1 Minor (OPS-03). |
| `release.yml` (chỉ chạy theo tag) | Đạt. Có 1 Minor (OPS-02, nguồn digest). |
| Log edge mức `crit` (R3-OPS-07) | **Chấp nhận.** |
| **Thủ tục 06.33** | **CHƯA duyệt.** Có 1 Major (FB-R3-SEC-OPS-04): thủ tục giao các bước xác minh và chứng kiến cho các vai trong đội agent (OPS, SEC, ORC), mà các vai này không phải người thật. Sửa xong và diễn tập trên staging thì SEC duyệt. |

- **Blocker: 0.**
- **Major: 2.** OPS-01 (edge) và OPS-04 (thủ tục 06.33).
- Minor: 5 (BOOT-01, BOOT-02, OPS-02, OPS-03, OPS-05). Suggestion: 1.

## 2. Kiểm đã chạy

1. `6b5c8ae` trên worktree tạm, Postgres 17 riêng (cổng 56633). Tạo DB trống `ottimo_bootstrap_test` giống bước CI mới.
   - `production-bootstrap.test.ts`: **8/8 đạt**, gồm từ chối DB đã có cơ sở, chạy lần hai bị từ chối và không đổi gì, audit không có mật khẩu, lần đăng nhập đầu buộc đổi mật khẩu và đăng ký 2FA.
   - `tsc --noEmit`: đạt.
   - Worktree và container đã xóa.
2. Đọc mã:
   - `production-bootstrap.ts`, `production-bootstrap-cli.ts`, `scripts/production-bootstrap.sh`, `ci.yml`;
   - `config.ts`: api từ chối khởi động production khi `MFA_ENFORCED` khác `true`;
   - `mfa-operator-reset-cli.ts` và `operator-reset.ts` trên `main`, để đối chiếu với thủ tục 06.33.
3. Đọc cấu hình OPS: `edge.sh` (phần render `nginx.conf` và mạng link), `docker-compose.edge.yml`, `docker-compose.edge-link.yml`, `Caddyfile.prod` (khối `servers`, `/health`, `/__test__`), `Caddyfile.landing`, `deploy.sh` (bước `config` và kiểm digest), `release.yml`.
   - SEC **không chạy lại** `test-edge.sh`. SEC dựa vào kết quả 15/15 của OPS, trong đó có ca "header PROXY giả từ địa chỉ khác bị bỏ qua".
4. Đọc thủ tục 06.33 trên máy INV (tệp 0600, thư mục 0700). Tham số lệnh trong thủ tục khớp với CLI trên `main`.

## 3. Lệnh khởi tạo production (`6b5c8ae`)

Bốn điểm ORC hỏi:

| Điểm | Kết luận | Căn cứ |
|---|---|---|
| In mật khẩu tạm (chỉ TTY, một lần) | **Đạt**, kèm BOOT-01 | Mật khẩu 24 ký tự base64url (144 bit), qua chính sách V-10. Chỉ băm argon2 được lưu. Mật khẩu chỉ in ra stdout một lần, không vào log, audit hay tệp. CLI từ chối khi stdout không phải TTY. |
| Chặn chạy lại | **Đạt** | Lệnh đọc `worker_list_properties()` **trước** mọi thao tác ghi và trước argon2: DB đã có cơ sở → `refused`, mã thoát 2. Hai lượt chạy song song đụng khóa duy nhất (`23505`) → `refused`, giao dịch hủy. Toàn bộ chạy trong một giao dịch. |
| Audit | **Đạt** | Hai dòng audit: `data` / `production.bootstrapped` chỉ có số đếm; `security` / `user.created_by_operator` có tên người chạy. Không có mật khẩu (test kiểm). Lệnh chạy bằng `ottimo_app` qua `assertSafeDbRole`, không dùng owner hay migrator. |
| `MFA_ENFORCED` bắt buộc | **Đạt** | Có hai lớp. CLI từ chối khi `APP_ENV=production` mà cờ khác `true`. Riêng api đã không khởi động production khi thiếu cờ (`config.ts`), mà lệnh chạy bằng `docker compose exec api`, nên không thể có production thiếu cờ đúng lúc khởi tạo. `deploy.sh` cũng chặn thêm một lớp. |

Ngoài ra:
- Lệnh không tạo khách, giá, tài khoản nhận VietQR hay mật khẩu Wi-Fi. Có kiểm `INV_ENTERS_KEYS`.
- `public_slug` của căn là chuỗi ngẫu nhiên.
- Thay đổi CI chỉ thêm một DB thử rỗng, dùng mật khẩu CI có sẵn.

### FB-R3-SEC-BOOT-01
- Mức độ: Minor
- Vị trí: `services/api/scripts/production-bootstrap.sh`; `production-bootstrap-cli.ts` (kiểm `process.stdout.isTTY`).
- Vấn đề: CLI kiểm TTY **bên trong container**. Khi gọi `docker compose exec` (không có `-T`) từ một terminal, Docker cấp TTY cho container ngay cả khi stdout phía máy chủ đang bị chuyển hướng, ví dụ qua `| tee tệp` hay `script`. Khi đó mật khẩu tạm vẫn ghi vào tệp trên máy chủ, mà CLI không biết.
- Vì sao quan trọng: mật khẩu tạm của `owner` đầu tiên nằm lại trong một tệp trên VPS.
- Đề xuất sửa: trong wrapper `.sh`, trước `exec`, thêm kiểm `[ -t 0 ] && [ -t 1 ] || { echo "run from an interactive terminal" >&2; exit 2; }`. README thêm một dòng: không chạy trong `script`/`tmux` có ghi log, và `clear` xong thì đóng phiên SSH.
- Hạn: trước lần chạy thật.
- Trạng thái: Open

### FB-R3-SEC-BOOT-02
- Mức độ: Minor
- Vị trí: `production-bootstrap.ts` (owner `must_change_password`, không có hạn); README 12.1.
- Vấn đề: mật khẩu tạm không có hạn dùng. Dưới `MFA_ENFORCED`, ai đăng nhập lần đầu bằng mật khẩu tạm sẽ được vào phiên đăng ký 2FA, tức là **chính người đó** đặt TOTP cho tài khoản `owner` duy nhất.
- Vì sao quan trọng: nếu mật khẩu tạm lộ trước khi INV đăng nhập, người khác chiếm được tài khoản `owner` duy nhất. Lúc đó chỉ còn cách cứu là thủ tục 06.33.
- Đề xuất sửa (thủ tục, không bắt đổi mã cho v1.0): README 12.1 ghi rõ bốn việc phải làm **trong cùng buổi**, có người chạy lệnh ngồi cạnh:
  1. INV đăng nhập;
  2. đổi mật khẩu;
  3. đăng ký 2FA;
  4. cất mã khôi phục.

  Trước khi rời đi, người chạy lệnh kiểm `audit_event` có `mfa.enrolled` của tài khoản đó. Không xong được trong buổi thì vô hiệu tài khoản rồi chạy lại trên DB trống. Nên có (R4): mật khẩu tạm hết hạn sau 24 giờ.
- Hạn: trước lần chạy thật (phần thủ tục).
- Trạng thái: Open

## 4. Thiết kế production (`7c2e682`)

### 4.1 Edge nginx – mô hình tin cậy PROXY protocol: **đạt**

- Edge có địa chỉ cố định `.2` trên mỗi mạng link. Docker chỉ cấp địa chỉ cho container khác trong nửa trên `.128/25`, nên không container nào nhận được `.2`.
- `edge.sh` từ chối `.env` có `PROXY_PROTOCOL_ALLOW` khác `<địa chỉ edge>/32`.
- Caddy (app và landing) chỉ nhận header PROXY từ địa chỉ đó (`allow`, `fallback_policy ignore`, hạn chờ 5 giây). Nguồn khác gửi header giả thì header bị bỏ qua, và địa chỉ TCP thật vẫn là địa chỉ khách (OPS test E2E).
- Vì vậy `remote_ip private_ranges` của `/health` và `TEST_SUPPORT_ALLOW_IPS` vẫn đúng nghĩa. Khách ngoài Internet không có địa chỉ riêng, trừ trường hợp IPv6 qua docker-proxy, xem S-1.
- Cổng 80: edge không gửi PROXY, nên Caddy thấy địa chỉ của edge, là địa chỉ riêng. Điều này không sao, vì ở `:80` các site chỉ chuyển sang HTTPS và trả lời ACME. `/health` và `/__test__` chỉ có trong khối HTTPS.
- Edge không giải mã TLS. Chứng chỉ, header và log che IP vẫn nằm ở Caddy của từng stack. Container edge chạy `read_only`, `cap_drop ALL`, `no-new-privileges`, người dùng 101, image ghim digest.
- Tách stack: chấp nhận đúng phạm vi OPS ghi (khác DB, bí mật, mạng, khóa CI, khóa sao lưu). Phần chung (Docker và nhóm `docker` ≈ root của máy) INV đã chấp nhận ("cùng VPS").

### 4.2 Log edge mức `crit` (R3-OPS-07): **chấp nhận**

Ở mức `error`, nginx ghi đầy đủ địa chỉ khách, trái SR-LOG-02 (che /24). Log truy cập đã có ở Caddy, đã che. Lỗi kết nối không hiện trong log edge là đánh đổi chấp nhận được với quy mô OTTIMO. Khi cần điều tra: bật `error` tạm thời, ghi giờ bật và giờ tắt vào nhật ký vận hành, tắt trong 24 giờ, rồi xóa log của container edge (driver `local`, 5 MB × 3).

### 4.3 `Caddyfile.landing`: **đạt**

Đủ CSP, HSTS, Referrer, Permissions, COOP, CORP. `/og/*` riêng có `cross-origin`. Tệp ẩn, `.map`, `/v1`, `/health`, `/__test__`, `/ru` → 404. Giới hạn thân request 16 KB, `read_body 10s`. Log bỏ query và che IP /24 (IPv6 /48). Bản xem trước có basic auth + `noindex` (đọc qua OPS test). Lệch ADR-014 1.4 (landing chạy container riêng): SEC không phản đối, ARC xác nhận.

### 4.4 Chốt chặn `deploy.sh`: **đạt**

Production dừng ở bước `config`, trước khi kéo image, khi:
- `MFA_ENFORCED` khác `true`;
- `CLOCK_MODE` khác `system`;
- có cờ hoặc token test;
- tag `-test`;
- thiếu digest.

Kéo image xong thì so digest trong registry với digest được truyền vào. Rollback kiểm digest đã ghi. Lệnh ép `deploy-from-ci.sh` chỉ nhận đúng mẫu lệnh, có 24 ca bị từ chối. Thẻ OPS-03 nói về trường hợp `.env` production ghi sai `APP_ENV`.

### 4.5 `release.yml`: **đạt**

- Chỉ chạy khi đẩy tag `v*` / `landing-v*`.
- Tag phải trỏ vào commit thuộc `main`, và CI push của commit đó phải xanh.
- Workflow không build lại.
- Environment `production` chờ INV duyệt.
- Khóa SSH dùng `StrictHostKeyChecking=yes` và bị xóa sau job.
- Quyền mặc định `contents: read`.

INV cần đặt cho environment `production`: người duyệt là INV, chỉ cho tag `v*` / `landing-v*` (theo `inv-production-steps.md`). Nên thêm ruleset bảo vệ tag `v*` (không xóa, không ghi đè).

### FB-R3-SEC-OPS-01
- Mức độ: **Major**
- Vị trí: `infra/server/bin/edge.sh` (phần render `nginx.conf`: `worker_processes 1`, `worker_connections 1024`, khối `stream`/`http` không có `limit_conn`, không đặt `preread_timeout`); `docker-compose.edge.yml` (`mem_limit 64m`, `pids_limit 50`).
- Vấn đề: edge là **điểm vào duy nhất** của cả production lẫn staging, nhưng chỉ chịu được vài trăm kết nối đồng thời: mỗi phiên TLS chuyển tiếp chiếm hai kết nối của worker. Edge không giới hạn số kết nối theo IP, và dùng hạn chờ đọc SNI mặc định. Trước khi có edge, Caddy (Go) nhận kết nối trực tiếp và không có trần cố định thấp như vậy. Một nguồn đơn lẻ giữ nhiều kết nối mở là đủ làm lễ tân và buồng phòng không vào được app.
- Vì sao quan trọng: lễ tân không check-in hay thu tiền được trong giờ cao điểm, và thiết kế mới tạo thêm điểm hỏng chung cho mọi stack (SR-AVL).
- Đề xuất sửa:
  - `worker_rlimit_nofile` + `worker_connections` đủ lớn (ví dụ 8192), có thể `worker_processes auto`;
  - trong `stream`: `limit_conn_zone $binary_remote_addr` + `limit_conn` theo IP (ví dụ 50, đủ cho một khách sạn có NAT chung), `preread_timeout 5s`;
  - trong `http :80`: `limit_conn` theo IP và `client_header_timeout` ngắn;
  - nâng `mem_limit` nếu cần, có tính vào bảng RAM mục 3;
  - thêm ca vào `test-edge.sh`: một IP mở quá giới hạn thì kết nối thừa bị đóng, IP khác vẫn vào được.
- Hạn: **trước khi production có người dùng thật** (app production). Landing có thể lên trước, vì chỉ ảnh hưởng tính sẵn sàng của trang tĩnh.
- Trạng thái: Open

### FB-R3-SEC-OPS-02
- Mức độ: Minor
- Vị trí: `.github/workflows/release.yml` job `resolve` (`docker buildx imagetools inspect` theo tag `sha-<12>`); `v1-production.md` mục 4.
- Vấn đề: job release đọc digest từ GHCR **tại thời điểm phát hành**, theo tag. `deploy.sh` rồi so với chính registry đó. Như vậy hai đầu cùng một nguồn. Nếu tag `sha-…` trên GHCR bị ghi đè sau khi CI build (ai đó có `packages: write`), release sẽ nhận image bị ghi đè. Tài liệu ghi "digest mà CI đọc lúc phát hành", điều này chưa đúng hẳn với SEC E.10.2 (4).
- Vì sao quan trọng: chuỗi cung ứng image production.
- Đề xuất sửa: job `publish-images` của CI ghi digest vừa đẩy (artifact của lần chạy, hoặc build provenance / `actions/attest-build-provenance`). `resolve` lấy digest từ đúng lần chạy CI xanh đó (cùng `head_sha`), hoặc `gh attestation verify`, rồi so với digest trên GHCR. Lệch thì dừng. Sửa câu trong tài liệu.
- Hạn: trước tag `v1.0.0` nếu kịp, muộn nhất R4.
- Trạng thái: Open

### FB-R3-SEC-OPS-03
- Mức độ: Minor
- Vị trí: `infra/server/bin/deploy.sh` (`app_env=$(envval APP_ENV)`, chốt chặn chỉ chạy khi giá trị này là `production`).
- Vấn đề: stack production được nhận ra theo thư mục (`.ottimo-home` = `/opt/ottimo-prod`) và theo `EDGE_NAME=production`. Nhưng chốt chặn chỉ dựa vào `APP_ENV`. Nếu `.env` production ghi nhầm `APP_ENV=staging`, chốt chặn bị bỏ qua, mà api ở chế độ staging lại cho phép test support khi có cờ.
- Vì sao quan trọng: cấu hình nhầm một dòng là mở đường test vào production.
- Đề xuất sửa: khi thư mục là thư mục production hoặc `EDGE_NAME=production`, bắt buộc `APP_ENV=production`, khác thì dừng. Thêm một ca vào `test-deploy-from-ci.sh`.
- Hạn: trước deploy production đầu tiên.
- Trạng thái: Open

### Suggestion S-1 (OPS)
Giữ **không có bản ghi AAAA** cho các tên miền production. Nếu VPS nhận IPv6, `docker-proxy` thay địa chỉ khách bằng địa chỉ gateway riêng, kéo theo hai hậu quả: (1) `/health` mở cho mọi khách IPv6 (`private_ranges`); (2) giới hạn thử đăng nhập theo IP gom mọi khách IPv6 vào một địa chỉ. Muốn bật IPv6 thì phải bật `userland-proxy: false` / `ip6tables` trước, và có test.

## 5. Thủ tục 06.33 (ngoài repo): **CHƯA duyệt**

Phần đạt:
- Thủ tục lưu ngoài repo, tệp 0600.
- Đủ 4 điều kiện được dùng, có danh sách trường hợp không được dùng.
- Xác minh hai kênh. Gọi lại số đã có từ trước, không dùng số người yêu cầu đọc.
- Không ghi giấy tờ hay câu trả lời xác minh.
- Không chạy lệnh từ CI hay bằng khóa CI.
- Tham số lệnh khớp CLI trên `main`.
- Có biên bản chỉ ghi kết quả, có mục diễn tập staging.
- Kết quả lệnh đúng 06.33: hủy 2FA và mã khôi phục, thu hồi phiên, buộc đăng ký lại, ghi `mfa.reset_by_operator`, gửi email qua outbox.

### FB-R3-SEC-OPS-04
- Mức độ: **Major**
- Vị trí: `~/.ottimo/runbooks/2fa-operator-reset-06.33.md`, mục 2 (xác minh) và mục 3 (ai chạy, ai chứng kiến).
- Vấn đề: thủ tục giao việc "gặp trực tiếp, đối chiếu mặt" cho **OPS**, và giao vai "người chứng kiến" cho **SEC/ORC**. OPS, SEC, ORC là vai của đội agent, không phải người thật, không gặp hay gọi video được, cũng không giữ khóa SSH. Ở OTTIMO hiện nay, người duy nhất có SSH vào VPS và là `owner` duy nhất có lẽ là chính INV. Viết như hiện tại thì thủ tục không chạy được. Tệ hơn, nó có thể bị hiểu là "một người tự làm, không ai chứng kiến".
- Vì sao quan trọng: 06.33 là đường cuối để vào lại tài khoản `owner`, và cũng là đường kẻ xấu nhắm tới khi lừa đảo qua điện thoại. Nó chỉ an toàn khi người chạy và người chứng kiến là người thật, xác định trước.
- Đề xuất sửa:
  - (1) Ghi rõ **người thật** cho từng vai bằng chức danh, không ghi tên hay số điện thoại trong repo: người chạy lệnh là người có khóa SSH cá nhân lên VPS (INV hoặc người kỹ thuật INV chỉ định bằng văn bản); người chứng kiến là người thứ hai do INV chỉ định trước (ví dụ người đồng sở hữu, kế toán), không phải người yêu cầu.
  - (2) Thêm nhánh **"INV vừa là người yêu cầu vừa là người chạy"**:
    - yếu tố xác thực là khóa SSH cá nhân có passphrase trên máy INV, cộng với người chứng kiến thật;
    - sau khi chạy, báo cho người chứng kiến;
    - kiểm `audit_event` có `mfa.reset_by_operator`.
  - (3) Ghi rõ lệnh **không** đổi mật khẩu. Người yêu cầu vẫn phải biết mật khẩu. Nếu quên cả mật khẩu thì thủ tục phải nói đi tiếp thế nào: hiện chưa có đường cho trường hợp chỉ có một `owner`, nên ghi là "giới hạn đã biết" và báo ORC.
  - (4) Thông báo cho `owner`: khi production chưa có email (R3-OPS-01), SEC **chấp nhận tạm** việc gọi điện theo số có sẵn kèm ghi biên bản. Điều kiện: bật email ngay khi có SES, và release notes có dòng "Giới hạn đã biết".
- Điều kiện SEC duyệt: sửa (1)–(4), diễn tập một lần trên staging với tài khoản giả và người chứng kiến thật, biên bản chỉ ghi kết quả, OPS báo ORC. Khi đó SEC ghi "06.33: SEC duyệt ngày …" vào repo (06.33 chỉ cho ghi đúng dòng này).
- Hạn: trước dữ liệu thật (điều kiện Verified US-143 / SR-AUTH-06).
- Trạng thái: Open

### FB-R3-SEC-OPS-05
- Mức độ: Minor
- Vị trí: thủ tục 06.33 mục 4 (biến lịch sử shell). README `infra/server` mục 12 (dòng "có thủ tục, lưu ngoài repo").
- Vấn đề: cách tránh ghi lệnh vào lịch sử chỉ đúng với một kiểu shell, và chỉ khi người chạy gõ đúng. Tham số lệnh vẫn hiện trong danh sách tiến trình của máy chủ lúc chạy (rủi ro thấp, chỉ người dùng trên VPS thấy). README chưa có ngày SEC duyệt.
- Vì sao quan trọng: tên đăng nhập `owner` và mã phiếu nằm lại trên máy chủ. Mức thấp.
- Đề xuất sửa: thủ tục ghi thêm bước kiểm lịch sử shell sau khi chạy, và xóa dòng nếu có. Khi duyệt, README thêm "SEC duyệt ngày …, diễn tập staging ngày …".
- Hạn: cùng OPS-04.
- Trạng thái: Open

## 6. Điểm làm tốt

1. Lệnh khởi tạo chạy bằng role ứng dụng, trong một giao dịch, từ chối trước khi ghi. Mật khẩu tạm chỉ tồn tại trên màn hình, và test kiểm cả audit lẫn lần đăng nhập đầu.
2. Mô hình tin cậy PROXY protocol được khóa ở ba chỗ: địa chỉ cố định, `edge.sh` kiểm `.env`, Caddy chỉ nhận header từ `allow`. OPS có test E2E cho header giả.
3. Đường phát hành production: chỉ chạy theo tag trên `main`, CI phải xanh, không build lại, INV duyệt, lệnh SSH bị ép, so digest. Đây là bước tiến rõ so với staging.
