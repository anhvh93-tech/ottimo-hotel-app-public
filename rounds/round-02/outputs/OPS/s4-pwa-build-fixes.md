# OPS – Sửa P-24 (quyền tệp PWA trong image) và P-15 (số lễ tân lúc build)

Round 2, tuần Ổn định, bước **Phản hồi & sửa**. Người làm: OPS. Ngày 18/10/2026.
Nguồn: UXR `outputs/UXR/s4-pwa-walkthrough.md` – P-24 (dòng 33, 131, 175) và P-15 (dòng 47, 123).
Chưa commit. Không dựng lại, không khởi động lại stack demo `ottimo-demo` (8181–8183, 3100): 4 container vẫn "Up 18 hours" sau mọi lần kiểm. Không đọc, không in `product/.env` (chỉ đếm xem có khóa `VITE_DESK_PHONE` hay không: **chưa có**).

## 1. Đã làm gì

| Mục | Việc | Trạng thái |
|---|---|---|
| P-24 | `Dockerfile.web`: sau `turbo build`, chuẩn hóa quyền 3 thư mục `dist` (`chmod -R u=rwX,go=rX` → tệp 0644, thư mục 0755, chủ root). Image đúng quyền dù bản sao mã nguồn có quyền gì | Xong |
| P-24 | `Dockerfile.web`: bước chặn cuối, chạy bằng uid 10001 (user của Caddy). Tệp hoặc thư mục nào trong `/srv` không đọc được thì build dừng và in tên tệp | Xong |
| P-24 | `demo-up.sh`: `git archive \| tar -x` chạy trong subshell `umask 022`, nên bản sao giữ quyền của git (0644/0755). `$WORK` vẫn 0700, người khác trên máy không đọc được. `demo.env`, state, tệp tài khoản vẫn tạo dưới `umask 077` | Xong |
| P-24 | `check-caddy-prod.sh` (CI, chế độ image thật): thêm 2 kiểm `staff.localhost/manifest.webmanifest` → `200 application/manifest+json`, `/sw.js` → `200 text/javascript` | Xong |
| P-15 | Build arg mới của `Dockerfile.web`: `WEB_BUILD_PROFILE` (`dev` mặc định \| `demo` \| `production`) và `VITE_DESK_PHONE` | Xong |
| P-15 | Script kiểm `infra/docker/check-web-build-config.sh` (POSIX sh, chạy được trong image lẫn trên máy). Profile demo/production **dừng** khi số lễ tân thiếu, sai dạng hoặc còn là số mẫu toàn 0. Profile dev chỉ cảnh báo. Script không bao giờ in số | Xong |
| P-15 | Kiểm nằm ở stage riêng `web-config`, BuildKit chạy song song với `pnpm install`. Build thiếu số dừng sau **8–11 giây**. Đổi số không làm mất cache bước cài gói | Xong |
| P-15 | `.env.example`: mục "Web build" với `VITE_DESK_PHONE=0000 000 000` (số mẫu) và ghi rõ định dạng | Xong |
| P-15 | `docker-compose.yml` (stack dev): truyền `WEB_BUILD_PROFILE: dev` và `VITE_DESK_PHONE` từ `product/.env` | Xong |
| P-15 | `demo-up.sh`: đọc số từ biến môi trường hoặc `product/.env` (bỏ cặp nháy nếu có), kiểm **trước** khi lấy mã và build. Thiếu số thì dừng bằng câu tiếng Việt chỉ cách thêm. Số truyền vào `docker build` qua biến môi trường, không nằm trên dòng lệnh | Xong |
| P-15 | CI `publish-images` (image cho staging/production): `WEB_BUILD_PROFILE=production`, số lấy từ **biến repo** `VITE_DESK_PHONE` (Variables, không phải secret). Kiểm ngay đầu bước, trước khi build api | Xong |
| P-15 | CI `infra-scripts`: shellcheck thêm `product/infra/docker/*.sh`; bước mới chạy `infra/ci/test-web-build-config.sh` (19 ca) | Xong |
| P-15 | `turbo.json`: khai báo `VITE_DESK_PHONE` trong `env` của task `build` (để turbo chắc chắn chuyển biến vào `vite build` và tính vào cache) | Xong |
| – | Tài liệu: `infra/server/README.md` (thêm dòng biến repo), `docs/hosting-plan.md` mục 6, `outputs/OPS/demo-1.md` mục 1, `decision-log.md` (1 dòng) | Xong |

### Quy tắc số lễ tân (giống hệt app)
App (`apps/mobile/src/app/config.ts`, `apps/guest-web/src/app/config.ts`) chỉ nhận `^\+?[0-9 ]{6,20}$`, tức chỉ chữ số, dấu cách và một dấu `+` ở đầu. Viết có **dấu chấm** (kiểu `0xx.xxxx.xxxx`) hoặc gạch ngang thì app **ẩn nút gọi** mà không báo gì. Vì vậy build demo/production từ chối các dạng đó và nói rõ lý do. Hotline đã công bố phải viết lại thành dạng có dấu cách khi đặt vào `.env` (ORC có số, **không ghi vào repo**).

Một biến dùng chung cho 2 app: nút "Gọi lễ tân" của PWA nhân viên và số trên trang "Liên kết đã hết hạn" của web khách.

## 2. Kiểm tra đã làm

Image kiểm tra dựng từ `git archive HEAD` (`2b134fb`) cộng 3 tệp đã sửa (`Dockerfile.web`, `check-web-build-config.sh`, `turbo.json`). Số thử là số giả `+84 00 …` (mã vùng 00 không tồn tại). Bản sao nằm trong scratchpad của phiên, không nằm trong repo.

| # | Kiểm | Kết quả |
|---|---|---|
| 1 | Hiện trạng (trước sửa): `docker run --rm --network none ottimo-web:demo` (container dùng một lần, không phải container demo) | `/srv/mobile/manifest.webmanifest` quyền **0600**, chủ root, uid 10001 không đọc được. Image demo hiện tại (build 17/10 08:18) chưa có `sw.js` |
| 2 | Bản sao giải nén dưới `umask 077` (cách cũ) / dưới subshell `umask 022` (cách mới) | Cách cũ: 3 tệp `public/` của mobile đều 0600. Cách mới: 0644, thư mục gốc vẫn 0700 |
| 3 | `docker build` **profile demo, không có số**, từ bản sao 0600 | Dừng sau **11 giây** ở stage `web-config`, lỗi ghi rõ thiếu `VITE_DESK_PHONE` và cách thêm |
| 4 | Build **`ottimo-web:opscheck`** (profile demo, số giả) **từ bản sao 0600** (cố tình giữ lỗi cũ của demo) | Xong sau 109 giây. Trong image: **231 tệp 0644, 7 thư mục 0755, 0 tệp** thiếu quyền đọc cho "others". Bước chặn uid 10001 đạt |
| 5 | **Image production:** profile production, không có số | Dừng sau **8 giây** |
| 6 | **Image production `ottimo-web:opscheck-prod`** (profile production, số giả, bản sao 0644 như checkout CI) | Xong sau 134 giây. Quyền giống #4. Số giả có trong 1 bundle của mobile và 1 bundle của guest-web, không có trong admin-web. `docker history` không chứa số |
| 7 | Caddy phục vụ thật (`Caddyfile.dev`, container riêng cổng 38182/38282, gỡ ngay sau đó) | Image mới: `manifest.webmanifest` → `200 application/manifest+json` (nội dung JSON "OTTIMO Staff"), `sw.js` → `200 text/javascript`. Image demo cũ: `manifest.webmanifest` → `200 text/html` (trả `index.html`) – **đúng triệu chứng UXR tả** |
| 8 | `check-caddy-prod.sh ottimo-web:opscheck-prod` (Caddyfile.prod, chạy cứng hóa như production) | Mọi kiểm đạt, gồm 2 kiểm mới. Chạy lại trên `ottimo-web:demo` cũ: 2 kiểm mới **đỏ**, nên guard bắt được lỗi này. `--stub` vẫn đạt |
| 9 | `test-web-build-config.sh` (19 ca) bằng `/bin/sh` của macOS; 6 ca bằng busybox `sh` (node:22-alpine) | Đạt hết |
| 10 | `demo-up.sh`: `bash -n`; harness chạy hàm `desk_phone` + `build_image` thật bằng **bash 3.2** của macOS, `docker` thay bằng stub in tham số; 6 dạng dòng `.env` và trường hợp biến môi trường đè `.env` | Đọc đúng cả khi có nháy đơn/kép. Dạng có dấu chấm, số mẫu, dòng trống đều bị từ chối trước build. `docker build` chỉ nhận **tên** biến `VITE_DESK_PHONE`, không nhận giá trị. Lệnh build api vẫn đúng (`INCLUDE_TEST_SUPPORT=0`, mảng rỗng không lỗi `set -u`) |
| 11 | `check-compose.sh` và `docker compose config` của stack dev | Đạt. Web build args: `WEB_BUILD_PROFILE=dev`, `VITE_DESK_PHONE` lấy từ tệp env |
| 12 | `ci.yml`: đọc bằng PyYAML; 50 khối `run:` qua `bash -n` | 0 lỗi |

**Chưa chạy được ở máy:** shellcheck và actionlint (máy không có, không cài từ Internet). Job `infra-scripts` trên CI sẽ chạy shellcheck cho 2 script mới. Đã tự rà các lỗi thường gặp: quote, mảng rỗng, `local`.

## 3. Lần dựng lại demo sau – ORC cần biết trước

1. **Stack demo đang chạy vẫn là image cũ.** Trên 8182, manifest vẫn trả `index.html` cho đến khi dựng lại. Bản sửa chỉ có hiệu lực ở lần `demo-up.sh` (có build) kế tiếp. ORC báo chủ đầu tư trước khi dựng lại, đúng như đã hẹn.
2. **Trước lần dựng lại đó, `product/.env` của máy chủ đầu tư phải có thêm 1 dòng** `VITE_DESK_PHONE=<số lễ tân>`, viết bằng chữ số và dấu cách. Hiện tệp **chưa có** dòng này, nên `demo-up.sh` sẽ dừng sau vài giây (trước khi lấy mã và build) và in cách thêm. Người thêm: chủ đầu tư, hoặc ORC khi chủ đầu tư đồng ý. OPS không sửa tệp `.env`. Có thể chạy một lần không cần sửa tệp: `VITE_DESK_PHONE='<số>' ./product/infra/demo/demo-up.sh`.
3. `--no-build` và `demo-reset.sh` không cần biến này.
4. Sau khi dựng lại, PWA trên 8182 có manifest và service worker. Chrome Android vẫn **chưa** gợi ý "Cài ứng dụng" vì manifest chưa có icon (P-25, chờ logo SVG của chủ đầu tư).

## 4. Giả định

- `[GIẢ ĐỊNH]` Staging và production dùng **cùng một** image web: build một lần ở `publish-images`, profile production, cùng một số lễ tân. Không có số riêng cho staging.
- `[GIẢ ĐỊNH]` Số lễ tân là thông tin công khai, nên để trong biến repo GitHub (Variables) và nằm trong bundle JS là chấp nhận được. Repo vẫn không chứa số thật, chỉ có số mẫu toàn 0.
- Profile dev **không** bắt buộc số, để stack dev, image `ottimo-web:ci` và các stack riêng của QA/UXR/FE (đều build không có build arg) không bị gãy. Dev có số mẫu `0000 000 000` (chép từ `.env.example`) thì nút gọi hiện và gọi tới số giả.
- Không tạo ESC: không phát sinh chi phí, số hotline đã công bố. Bật biến repo `VITE_DESK_PHONE` thuộc cùng bước dựng staging đang chờ (ESC-002/ESC-010), không phải câu hỏi mới.

## 5. Rủi ro, việc chưa xong, việc cho vai khác

| Ai | Việc |
|---|---|
| ORC / INV | Thêm dòng `VITE_DESK_PHONE` vào `product/.env` trước lần dựng lại demo (mục 3). Khi bật `PUBLISH_IMAGES=true`, đặt luôn biến repo `VITE_DESK_PHONE`; thiếu thì `publish-images` đỏ ngay từ bước đầu |
| MOB | `apps/mobile/README.md` dòng 23 và `apps/guest-web/README.md` dòng 29 còn ghi "Biến tùy chọn". Nên đổi thành "bắt buộc cho bản demo/production, tùy chọn khi dev". OPS không sửa tệp của MOB. Đề xuất của UXR (thiếu số thì ghi số ở màn Tôi) do MOB/UXD quyết; build demo/production nay không thể thiếu số |
| QA / UXR | Sau lần dựng lại demo, đi lại: (a) `http://localhost:8182/manifest.webmanifest` ra JSON; (b) service worker đăng ký được (Browser pane không đăng ký được SW, cần Chrome thật); (c) màn báo sự cố khi mất mạng có nút "Gọi lễ tân" với `tel:` đúng số; (d) trang link hết hạn của web khách có số. Lúc đó mới đóng P-24, P-15 |
| QA | Stack E2E trên CI build web bằng profile dev với `.env` sinh từ `.env.example`. PWA trong E2E vì vậy **có** nút gọi tới số mẫu. Đã grep: hiện không ca nào kiểm "không có nút gọi" |
| CI | Lần chạy đầu sau khi commit: cache turbo của task `build` bị tính lại một lần, vì `turbo.json` đổi |
| Dọn | 2 image kiểm tra còn giữ để QA/ORC xem: `ottimo-web:opscheck`, `ottimo-web:opscheck-prod`. Gỡ bằng `docker image rm ottimo-web:opscheck ottimo-web:opscheck-prod`. Các container kiểm tra đã gỡ hết |

## 6. File đã tạo/sửa

- Tạo: `product/infra/docker/check-web-build-config.sh`, `product/infra/ci/test-web-build-config.sh`, báo cáo này.
- Sửa: `product/infra/docker/Dockerfile.web`, `product/infra/demo/demo-up.sh`, `product/infra/ci/check-caddy-prod.sh`, `product/infra/docker-compose.yml`, `product/.env.example`, `product/turbo.json`, `.github/workflows/ci.yml`, `product/infra/server/README.md`, `product/docs/hosting-plan.md`, `rounds/round-02/outputs/OPS/demo-1.md`, `01-decisions/decision-log.md` (thêm 1 dòng cuối).
