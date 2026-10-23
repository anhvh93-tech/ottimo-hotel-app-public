# OTTIMO – Việc anh/chị làm cho bản chính thức (v1.0) và trang ottimo.vn

Dành cho: Chủ đầu tư · Soạn: OPS · 23/10/2026 · Kèm `v1-production.md` (cùng thư mục)
Mỗi phần ghi "khi nào làm". Phần nào chưa tới lượt thì để đó. Tổng cộng khoảng 60–75 phút, chia nhiều lần.

Repo này công khai, nên tài liệu ghi `<IP-VPS>` thay cho IP thật (vẫn là VPS Nhân Hòa đang chạy staging). **Đội gửi IP riêng trong chat.** Không gửi mật khẩu, khóa hay mã nào cho đội qua chat.

---

## Phần 1 – DNS ở Mắt Bão: thêm 5 bản ghi (10 phút) – làm ngay được

Cách vào trang và bấm giống hệt `rounds/round-02/inv-dns-steps.md` mục 2. Trước khi sửa, **chụp màn hình bảng bản ghi hiện có**.

| # | Loại | Tên (Host) | Giá trị | TTL | Dùng cho |
|---|---|---|---|---|---|
| 1 | A | `staging` | `<IP-VPS>` | 300 | Bản xem trước trang ottimo.vn (có mật khẩu) |
| 2 | A | `www.staging` | `<IP-VPS>` | 300 | Như trên, dạng có `www` |
| 3 | A | `desk` | `<IP-VPS>` | 300 | Bản chính thức – màn lễ tân/quản lý |
| 4 | A | `staff` | `<IP-VPS>` | 300 | Bản chính thức – app nhân viên |
| 5 | A | `g` | `<IP-VPS>` | 300 | Bản chính thức – trang khách |

- Năm bản ghi này **không ảnh hưởng email** và không ảnh hưởng trang `ottimo.vn` hiện tại.
- Bản ghi 3–5 thêm sớm cũng không sao: tới khi bản chính thức chạy, mở các địa chỉ đó sẽ chưa vào được, như bình thường.
- Xong thì nhắn đội "đã thêm DNS phần 1".

## Phần 2 – GitHub: môi trường `production` có người duyệt (5 phút) – làm ngay được

Giống phần 2 của `rounds/round-02/inv-github-steps.md`, khác ở tên và luật tag:
1. Repo → **Settings** → **Environments** → **New environment** → Name: `production` → **Configure environment**.
2. Tích **Required reviewers** → chọn tài khoản của anh/chị (`anhvh93-tech`). **Không** tích "Prevent self-review".
3. **Deployment branches and tags** → **Selected branches and tags** → **Add deployment branch or tag rule**:
   - chọn loại **Tag**, gõ `v*` → **Add rule**;
   - thêm một quy tắc **Tag** nữa: `landing-v*`.

   **Không** thêm nhánh `main`.
4. **Save protection rules**. Chưa thêm secret nào.

Nên bật thêm (không bắt buộc): **Settings** → **Rules** → **Rulesets** → **New tag ruleset**:
- áp cho `v*` và `landing-v*`;
- chỉ chủ repo được tạo/xóa tag.

Nếu thấy rối thì bỏ qua. Bước duyệt ở phần 5 vẫn là chốt cuối.

## Phần 3 – Khóa riêng cho deploy production (10 phút) – khi đội báo "sẵn sàng phần 3"

Khóa này **khác** khóa staging. Nó chỉ chạy được lệnh deploy của bản chính thức.

3a. Terminal trên máy Mac:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/ottimo_ci_production -N "" -C "ottimo-ci-production"
```
Nhắn đội "đã tạo khóa CI production". Đội cài nửa công khai lên máy chủ và đối chiếu vân tay.

3b. Khi đội báo "đã cài khóa CI production", chép khối sau vào Terminal (thay `<IP-VPS>` ở **2 chỗ**):
```bash
R=anhvh93-tech/ottimo-hotel-app-public
gh secret set PRODUCTION_SSH_KEY --env production -R "$R" < ~/.ssh/ottimo_ci_production
ssh-keyscan -t ed25519 <IP-VPS> 2>/dev/null | gh secret set PRODUCTION_SSH_KNOWN_HOSTS --env production -R "$R"
printf '%s' '<IP-VPS>' | gh secret set PRODUCTION_SSH_HOST --env production -R "$R"
rm ~/.ssh/ottimo_ci_production
gh secret list --env production -R "$R"
```
Kết quả cuối phải liệt kê đúng 3 tên: `PRODUCTION_SSH_HOST`, `PRODUCTION_SSH_KEY`, `PRODUCTION_SSH_KNOWN_HOSTS`.

## Phần 4 – Khóa sao lưu và khóa dữ liệu của bản chính thức (15 phút) – khi đội dựng production

4a. **Khóa sao lưu riêng cho production.** Đội chạy giúp trên máy Mac của anh/chị; khóa riêng không rời máy:
- khóa riêng: `~/.ottimo/backup/ottimo-prod-backup-identity.txt`;
- chỉ khóa công khai lên máy chủ.

Anh/chị cất **thêm 2 bản** của tệp khóa riêng:
- một bản trong trình quản lý mật khẩu;
- một bản ngoại tuyến (USB mã hóa hoặc giấy in, cất két).

Mất khóa này thì không đọc được bản sao lưu.

4b. **Khóa dữ liệu (KEK)** – dùng để mã hóa ảnh giấy tờ khách. Khi đội báo "đã tạo bí mật production":
- đội hướng dẫn anh/chị tự đọc khóa này **một lần** trên máy chủ, ngay trước mặt anh/chị;
- anh/chị chép **ngoại tuyến**: giấy niêm phong hoặc USB mã hóa, cất két;
- không chụp ảnh, không gửi chat.

Mất KEK là mất toàn bộ ảnh giấy tờ.

4c. **Bản sao lưu ngoài máy chủ.** Máy Mac của anh/chị tự kéo bản sao lưu đã mã hóa về mỗi ngày, bằng một khóa chỉ được đọc thư mục sao lưu. Đội cài sẵn. Mac chỉ cần bật máy ít nhất vài lần mỗi tuần.

## Phần 5 – Duyệt deploy bản chính thức (2 phút mỗi lần) – mỗi lần phát hành

Cách phát hành:
- Đội (ORC) đẩy một tag:
  - `v1.0.0`, `v1.0.1`… cho app;
  - `landing-v1.0.0`… cho trang ottimo.vn.
- GitHub tự kiểm:
  - tag nằm trên `main`;
  - CI của commit đó xanh;
  - image đã có.

  Sau đó GitHub gửi email "Review deployments".

Cách duyệt:
1. Mở email hoặc trang Actions → lượt chạy **Release** → **Review deployments** → tích `production` → **Approve and deploy**.
2. Log chỉ có một dòng: `deploy sha-…: ok` (hoặc `landing sha-…: ok`). Nếu là `failed`, máy chủ đã tự trả lại bản trước. Đội xem chi tiết trên máy chủ.
3. Không bấm duyệt thì bản chính thức đứng yên ở bản cũ.

**Chỉ duyệt** khi:
- đội đã báo trong chat số tag và nội dung bản;
- QC đã ghi "đạt cổng v1.0" (lần đầu) hoặc "đạt hotfix" (bản vá).

## Phần 6 – Báo động miễn phí (20 phút) – sau khi quyết ESC-029 (đội đề xuất A)

6a. **Healthchecks.io** (báo cả khi máy chủ sập):
1. Vào https://healthchecks.io → **Sign Up** bằng hộp thư nhóm `@ottimo.vn` (gói Hobbyist miễn phí).
2. **Add Check**:
   - Name `ottimo-production`;
   - Period `30 minutes`, Grace `1 hour`.
3. Mục **Integrations**: email của anh/chị + email OPS.
4. Gửi đội **địa chỉ ping** của check (dạng `https://hc-ping.com/…`) qua kênh riêng. Địa chỉ này không phải mật khẩu nhưng đừng đăng công khai.

6b. **UptimeRobot** (kiểm từ bên ngoài):
1. https://uptimerobot.com → đăng ký miễn phí bằng hộp thư nhóm.
2. **New monitor** → HTTP(s), 5 phút, lần lượt:
   - `https://desk.ottimo.vn/`
   - `https://staff.ottimo.vn/`
   - `https://g.ottimo.vn/`
   - `https://ottimo.vn/`
   - `https://www.ottimo.vn/`
3. Alert contact: email.

6c. **Google Chat** (thông báo trên điện thoại):
1. Mở Google Chat bằng tài khoản `@ottimo.vn` → tạo phòng (space) "OTTIMO – Báo động", thêm OPS.
2. Trong phòng: **Apps & integrations** → **Webhooks** → **Add** → tên `ottimo-alert` → **Save** → chép URL.
3. Gửi URL cho đội qua kênh riêng. Ai có URL đều đăng được tin vào phòng, nên đừng dán công khai.

## Phần 7 – Chuyển `ottimo.vn` từ Google Sites sang VPS (20 phút, buổi tối) – sau khi duyệt bản xem trước

Email Google Workspace **không bị ảnh hưởng** nếu làm đúng bảng dưới.

7a. **Xem và duyệt bản xem trước:**
- mở `https://staging.ottimo.vn`;
- đăng nhập tên `ottimo`, mật khẩu đội đưa qua kênh riêng;
- duyệt câu chữ, ảnh, nút Zalo/gọi;
- nhắn đội "duyệt landing" kèm ghi chú nếu cần sửa.

7b. **Trước 1 ngày:** ở Mắt Bão, sửa TTL của bản ghi `@` (4 dòng A) và `www` (CNAME) xuống `300`, nếu có ô TTL.

7c. **Chọn về `mail.ottimo.vn`:** đội đề xuất **xóa** bản ghi CNAME `mail` (đường tắt cũ vào Gmail). Lý do: trang mới bật chế độ "luôn HTTPS" cho mọi tên miền con, còn `mail.ottimo.vn` không có HTTPS. Gmail vẫn vào bằng `mail.google.com` hoặc app Gmail; email không ảnh hưởng gì. Nhắn đội: "xóa mail" hoặc "giữ mail".

7d. **Buổi tối hẹn với đội** (đội đã đẩy tag `landing-v…` và job đang chờ duyệt):

| Bản ghi ở Mắt Bão | Làm gì |
|---|---|
| `@` – 4 dòng **A** (địa chỉ Google, dạng `216.239.x.21`) | **Xóa cả 4** |
| `@` – **A** mới | **Thêm**: Tên `@`, Giá trị `<IP-VPS>`, TTL 300 |
| `www` – **CNAME** `ghs.googlehosted.com` | **Xóa** |
| `www` – **A** mới | **Thêm**: Tên `www`, Giá trị `<IP-VPS>`, TTL 300 |
| `mail` – CNAME | Theo lựa chọn 7c |
| `@` **MX** `smtp.google.com` | **KHÔNG ĐỤNG** |
| `@` **TXT** `v=spf1 include:_spf.google.com ~all` | **KHÔNG ĐỤNG** |
| `@` **TXT** `google-site-verification=…` | **KHÔNG ĐỤNG** |
| `google._domainkey` **TXT** (`v=DKIM1…`) | **KHÔNG ĐỤNG** |
| `desk.staging`, `staff.staging`, `g.staging`, `staging`, `www.staging`, `desk`, `staff`, `g` | **KHÔNG ĐỤNG** |

Ngay sau khi lưu DNS:
- mở GitHub → lượt **Release** đang chờ → **Approve and deploy**;
- máy chủ tự xin chứng chỉ HTTPS cho `ottimo.vn` và `www`, rồi tự kiểm trang.

Đội báo "ottimo.vn đã lên VPS" trong vài phút.

Trong vài giờ đầu:
- có người vẫn thấy trang Google Sites cũ do bộ nhớ đệm DNS. Bình thường;
- kiểm email ngay: gửi một thư từ ngoài vào `@ottimo.vn` và gửi một thư ra ngoài. Phải chạy như cũ.

7e. **Sau 1–2 ngày chạy ổn:**
- vào Google Sites → **Settings** → **Custom domains** → gỡ `ottimo.vn` / `www.ottimo.vn`;
- **không xóa** trang Google Sites, để còn đường quay lại.

Cách quay lại nếu cần: đặt lại 4 dòng A của Google và CNAME `www` → `ghs.googlehosted.com` theo ảnh chụp đã lưu.

## Phần 8 – Email gửi đi của hệ thống (Amazon SES – ESC-010 B) – cần trước v1.0

Không có phần này thì:
- check-in online không gửi được mã xác minh qua email;
- email cảnh báo 2FA cũng không đi.

Đội (INT) sẽ gửi hướng dẫn riêng: tạo tài khoản AWS, chọn vùng Singapore, xác minh tên miền.

Ở Mắt Bão, phần này chỉ **thêm** bản ghi mới:
- 3 bản ghi CNAME dạng `xxxx._domainkey`;
- tùy chọn: một bản ghi `_dmarc`.

**Không sửa** MX, SPF hay DKIM của Google.

---

## Tóm tắt thứ tự

1. Phần 1, 2: làm ngay.
2. Phần 3, 4: khi đội dựng production.
3. Phần 7: khi duyệt landing (có thể trước v1.0).
4. Phần 6: sau ESC-029.
5. Phần 8: trước v1.0.
6. Phần 5: mỗi lần phát hành.

## Khi cần thu hồi (sự cố, lộ khóa, đổi người)

Xóa secret `PRODUCTION_SSH_KEY` trong environment `production` thì GitHub không deploy được nữa. Báo đội gỡ khóa CI production trên máy chủ. Khóa của staging không bị ảnh hưởng, và ngược lại.
