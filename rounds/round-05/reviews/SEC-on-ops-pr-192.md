# SEC review – PR OPS #192 `r5-ops-e2e-timeout` (cache .deb Playwright, timeout CI)

- Round 5 – bước Review (chuỗi cung ứng, SR-SUP-01…05, TM-48). Người review: SEC. Tác giả: OPS.
- Phiên bản đã đọc: head `6efd8ce1`.
- Diff gồm `.github/workflows/ci.yml` và `product/infra/ci/playwright-deps.sh`. SEC đọc thêm toàn bộ `ci.yml` ở head (trigger, `permissions`, các job `publish-images` và `deploy-staging`).

## Kết luận

**APPROVE.** Không có Blocker hay Major.
- Nhánh hoặc PR không đầu độc được cache `.deb` mà main dùng.
- Không thêm action mới: `actions/cache/restore` và `actions/cache/save` là đường dẫn con của cùng repo, ghim cùng SHA `55cc8345…` (v6.1.0) với `actions/cache` đang dùng.
- Đường mạng vẫn được apt kiểm chữ ký.
- Một điểm yếu thật: gói lấy từ cache được cài bằng `dpkg -i`, không qua kiểm chữ ký của apt. Mức Minor, vì gói chỉ cài trên VM E2E dùng một lần, không có secret và không sinh artifact phát hành. Đề xuất sửa ở thẻ 01.

## Các câu hỏi được giao

### 1. PR hoặc nhánh có đầu độc được cache main dùng không?

**Không**, theo phạm vi cache của GitHub Actions:
- Cache ghi trong một lần chạy `pull_request` thuộc scope `refs/pull/<n>/merge`. Chỉ chính PR đó đọc được; main không restore cache của PR. PR từ fork cũng vậy, và workflow không dùng `pull_request_target`.
- Main chỉ restore cache của scope main. Scope này chỉ được ghi bởi các lần chạy `push` lên main, `schedule` (chỉ chạy ở nhánh mặc định) và `workflow_dispatch` chọn nhánh main, tức là đều chạy code đã merge.
- `workflow_dispatch` trên nhánh khác chỉ ghi vào scope của nhánh đó.
- PR đọc được cache của main (scope base), nhưng chiều ngược lại thì không.
- Giới hạn còn lại: ai đã đưa được code độc vào main thì cũng ghi được cache của main. Rủi ro này không mới: cache `~/.cache/ms-playwright` (binary trình duyệt) và cache pnpm hiện có cũng cùng mức tin cậy.

**Bán kính ảnh hưởng nếu cache bị đầu độc** (đã kiểm thêm):
- Gói `.deb` chỉ được cài trên VM của job `landing-e2e` và `docker-build` (E2E). Các job này `permissions: contents: read`, không dùng `secrets.*` (`.env` sinh mật khẩu ngẫu nhiên mỗi lần chạy) và không upload image.
- `publish-images` (GHCR, `packages: write`) build lại từ đầu trên VM riêng, không dùng cache `.deb`, không nhận artifact của job E2E.
- `deploy-staging` (`STAGING_SSH_KEY`) chỉ phụ thuộc `publish-images`.
- Như vậy gói `.deb` độc không đi tới image phát hành hay staging. Tệ nhất là E2E cho kết quả sai, hoặc lạm dụng chính VM đó.

### 2. Gói còn được apt kiểm chữ ký không?

- **Đường mạng (bước 2 và 3): có.** Vẫn là `playwright install-deps` → `apt-get update/install`, apt kiểm chữ ký `InRelease` và SHA256 của từng gói. Đổi mirror sang `archive.ubuntu.com` chỉ đổi host, vẫn dùng keyring của Ubuntu. Không có `--allow-unauthenticated` hay `trusted=yes`.
- **Đường cache (bước 1): không.** `dpkg -i` không kiểm chữ ký hay hash. Tính toàn vẹn chỉ dựa vào phạm vi cache ở mục 1. `--refuse-downgrade` và `--skip-same-version` giúp tránh hạ phiên bản gói hệ thống, nhưng không chống được gói bị sửa (thẻ 01).
- Đường cache chỉ chứa gói vừa tải trong lần chạy đó (`apt-get clean` trước khi cài), nên không lẫn gói lạ có sẵn trên runner.

### 3. Action mới có ghim SHA không?

**Có.** Không có `uses:` nào mới ngoài `actions/cache/restore@55cc8345863c7cc4c66a329aec7e433d2d1c52a9` và `actions/cache/save@55cc8345…`, cùng SHA với `actions/cache` đã duyệt (SR-SUP-04).

### Khác

- Timeout: bước cài deps 12 phút; job landing 25, job docker 45. Bước lỗi thì job đỏ, không bỏ qua test. Không ảnh hưởng bảo mật.
- Khóa cache theo `ImageOS-ImageVersion`. Gói từ cache vì vậy tự làm mới khi runner image đổi (thường hằng tuần), không bị kẹt mãi ở phiên bản cũ thiếu bản vá.
- `$*` trong `bash -c` chỉ nhận tên trình duyệt viết cứng trong workflow, không có đầu vào ngoài.

## Thẻ feedback

### FB-R5-SEC-OPS-192-01
- Mức độ: Minor
- Vị trí: `product/infra/ci/playwright-deps.sh`, bước 1 (`sudo dpkg -i … "$CACHE_DIR"/*.deb`).
- Vấn đề: gói từ cache được cài bằng quyền root mà không kiểm hash hay chữ ký. Lớp bảo vệ duy nhất là phạm vi cache của GitHub.
- Vì sao quan trọng: phòng thủ nhiều lớp cho TM-48. Nếu phạm vi cache bị cấu hình sai về sau (ví dụ thêm `pull_request_target`, hoặc lưu cache từ job có code chưa duyệt), gói độc sẽ chạy với root mà không lớp nào phát hiện.
- Đề xuất sửa (chọn một):
  - (a) Trước `dpkg -i`, đối chiếu SHA256 của từng `.deb` với chỉ mục apt. Ví dụ: `apt-get download --print-uris <pkg>=<ver>` sau `apt-get update`, hoặc trường `SHA256` trong `/var/lib/apt/lists/*_Packages` nếu có sẵn. Lệch → xóa cache, đi đường mạng. Bước `apt-get update` chỉ tải chỉ mục (nhỏ, có chữ ký), nhanh hơn nhiều so với tải gói.
  - (b) Tối thiểu: lưu kèm danh sách `sha256sum`. Danh sách này không chống được kẻ ghi cả cache, nhưng phát hiện được hỏng dữ liệu. Kết hợp với thẻ 02.
  - Làm (a) trong round sau được, không chặn PR này.
- Trạng thái: Open

### FB-R5-SEC-OPS-192-02
- Mức độ: Suggestion
- Vị trí: `ci.yml`, hai bước "Save Playwright OS deps cache (.deb)".
- Vấn đề: lần chạy của PR cũng lưu cache. Không nguy hiểm vì cache nằm trong scope của PR, nhưng tạo nhiều bản cache trùng, đẩy cache main ra khỏi hạn mức 10 GB của repo và làm mất cache tốt.
- Đề xuất sửa: thêm điều kiện `github.ref == 'refs/heads/main'` vào `if:` của bước save. PR vẫn restore được cache của main. Nguồn cache khi đó chỉ còn code đã merge, rõ ràng hơn.
- Trạng thái: Open

## Điểm làm tốt

- Giữ nguyên nguyên tắc "lỗi thì đỏ, không bỏ test". Có giới hạn thời gian cho từng tầng, cảnh báo rõ khi rơi sang mirror dự phòng.
- Không thêm action hay nguồn tải mới, không tắt kiểm chữ ký apt ở đường mạng.
- Khóa cache gắn với runner image và phiên bản Playwright, tránh cài gói lệch thư viện hệ thống.
