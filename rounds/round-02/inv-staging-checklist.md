# OTTIMO – Chuẩn bị máy chủ staging

Dành cho: Chủ đầu tư · Soạn: OPS · 21/10/2026 · Dùng cho việc R-5 (`qc/round-qc-gate.md` mục 5)

Staging là bản chạy thử trên Internet, chỉ có dữ liệu giả. Có staging, đội chấm lại được cổng Round 2. Từ lúc anh/chị gửi thông tin ở Phần 1, đội cần tối đa 3 ngày làm việc để dựng xong.

Căn cứ: `product/docs/hosting-plan.md` (ESC-002: dữ liệu ở Việt Nam, gói H-B), SEC `reviews/s4-SEC.md` E.6.

---

## Một quy tắc duy nhất

Không gửi cho đội, qua chat hay bất kỳ kênh nào:
- mật khẩu (VPS, nhà đăng ký tên miền, GitHub);
- khóa riêng: tệp **không** có đuôi `.pub`;
- token GitHub, mã xác thực 2 lớp;
- ảnh màn hình có những thứ trên.

Đội không bao giờ cần chúng. Nếu lỡ gửi, báo đội ngay để đổi khóa.

---

## Phần 1 – Gửi trong chat (chỉ 4 dòng)

```
IP VPS:           (ví dụ 203.0.113.10)
Tên miền:         (ví dụ ottimo.vn)
Nhà cung cấp:     (ví dụ BizFly Cloud – Hà Nội)
Hệ điều hành:     (Ubuntu 24.04 hoặc 22.04)
```

Kèm theo, chỉ trả lời có/không: anh/chị đã làm xong những bước nào ở Phần 2.

Đội không ghi IP vào repo (repo công khai). IP chỉ nằm trên máy chủ và trong secret của GitHub.

---

## Phần 2 – Anh/chị tự làm

Làm theo thứ tự. Mỗi bước khoảng 5–10 phút.

### Bước 1. Thuê VPS
- Cấu hình: 2 vCPU · 4 GB RAM · ổ ≥ 40 GB · **đặt tại Việt Nam** · Ubuntu 24.04 LTS.
  Ví dụ BizFly Cloud gói 4, khoảng 264.000 đ/tháng đã có VAT (hosting-plan mục 3–4).
- **Tắt** sao lưu/snapshot tự động của hãng. Nếu hãng bắt buộc, để tối đa 7 ngày.
- Xin hóa đơn VAT đứng tên công ty.

### Bước 2. Tạo khóa SSH trên máy của anh/chị
Mở Terminal trên Mac, chạy:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ottimo_ops -C "ottimo-ops"
```

Đặt một cụm mật khẩu cho khóa khi được hỏi. Lệnh tạo hai tệp:
- `~/.ssh/ottimo_ops`: khóa **riêng**, giữ trên máy, không gửi ai;
- `~/.ssh/ottimo_ops.pub`: khóa **công khai**, dán được vào VPS.

Rồi cho máy nhớ cụm mật khẩu, để đội làm việc từ máy này không phải hỏi lại:

```bash
ssh-add --apple-use-keychain ~/.ssh/ottimo_ops
```

### Bước 3. Đặt khóa công khai vào VPS và tạo người dùng quản trị
Xem nội dung khóa công khai bằng `cat ~/.ssh/ottimo_ops.pub` (một dòng bắt đầu bằng `ssh-ed25519`).

**Cách A – hãng có ô "SSH key" khi tạo VPS (nên dùng):** dán dòng đó vào ô SSH key. Xong bước này. Đội sẽ tự tạo người dùng triển khai `ottimo` và tắt đăng nhập bằng mật khẩu.

**Cách B – hãng chỉ cho mật khẩu root:** mở "Console" trên trang quản lý VPS, đăng nhập root, chạy:

```bash
adduser --disabled-password --gecos "" ottimo-admin
usermod -aG sudo ottimo-admin
echo 'ottimo-admin ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/90-ottimo-admin
install -d -m 700 -o ottimo-admin -g ottimo-admin /home/ottimo-admin/.ssh
echo 'DÁN-DÒNG-ssh-ed25519-Ở-ĐÂY' > /home/ottimo-admin/.ssh/authorized_keys
chown ottimo-admin: /home/ottimo-admin/.ssh/authorized_keys && chmod 600 /home/ottimo-admin/.ssh/authorized_keys
```

Lưu ý:
- Dùng đúng tên `ottimo-admin`.
- **Không** tự tạo người dùng tên `ottimo`. Script của đội tạo người dùng này với mã số cố định.
- Sau khi đội dựng xong, đăng nhập bằng mật khẩu và đăng nhập root đều bị tắt.

### Bước 4. Tạo bản ghi DNS cho staging
**Với `ottimo.vn` (22/10/2026): làm theo `inv-dns-steps.md`** – DNS ở Mắt Bão, đã có email Google và trang Google Sites, nên cần thêm CAA `pki.goog` và **không** thêm `v=spf1 -all`. Bảng dưới là mẫu chung.

Tại nhà đăng ký tên miền (hoặc Cloudflare ở chế độ **chỉ DNS**, đám mây xám). TTL 300.

| Loại | Tên | Giá trị |
|---|---|---|
| A | `desk.staging` | IP VPS |
| A | `staff.staging` | IP VPS |
| A | `g.staging` | IP VPS |
| CAA | `@` | `0 issue "letsencrypt.org"` |

Không tạo bản ghi AAAA (IPv6). Không tạo bản ghi `*`.

Nếu tên miền chưa dùng để gửi email, thêm hai dòng chống giả mạo:

| Loại | Tên | Giá trị |
|---|---|---|
| TXT | `@` | `v=spf1 -all` |
| TXT | `_dmarc` | `v=DMARC1; p=reject; adkim=s; aspf=s` |

Nếu tên miền đã có email (Google Workspace, Zoho…), giữ nguyên bản ghi email cũ và báo đội.

Bảo vệ tài khoản tên miền (hosting-plan mục 10, 0 đ):
- tài khoản đứng tên công ty;
- bật xác thực 2 lớp;
- bật khóa chuyển nhượng;
- bật tự gia hạn.

### Bước 5. Cài đặt GitHub – môi trường `staging`
Làm **trước** mọi bước có khóa. Đây là điều kiện của SEC.

Vào repo `ottimo-hotel-app-public` → Settings → Environments → New environment, tên `staging`:
1. **Required reviewers:** chọn tài khoản của anh/chị. Mỗi lần deploy, GitHub chờ anh/chị bấm "Approve".
2. **Deployment branches and tags:** chọn "Selected branches and tags", thêm `main`.
3. **Không** bật "Prevent self-review". Hiện chỉ anh/chị duyệt; bật lên thì chính anh/chị không duyệt được.
4. Bấm "Save protection rules". Chưa tạo secret nào ở bước này: secret chỉ tạo **sau** khi môi trường đã có người duyệt (Bước 6).

Ở Settings → Secrets and variables → Actions → **Variables** (cấp repo), thêm:
- `VITE_DESK_PHONE` = số lễ tân công khai, chỉ chữ số và dấu cách.

Chưa đặt `PUBLISH_IMAGES` và `STAGING_DEPLOY`. Đội báo khi tới lúc (Bước 8).

Nên làm thêm (không bắt buộc): Settings → Actions → General → "Artifact and log retention" đặt **30 ngày** (mặc định 90). Log của repo công khai ai cũng đọc được, nên lưu ngắn thì bớt thời gian lộ nếu sót.

### Bước 6. Khóa cho CI (làm khi đội báo VPS đã dựng xong)
Chạy trong Terminal:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ottimo_ci_deploy -N "" -C "ottimo-ci-deploy"
```

Rồi báo đội. Đội đưa tệp `.pub` lên VPS với giới hạn `command=…deploy-from-ci.sh,restrict`:
- khóa chỉ ra được lệnh "deploy", không mở được phiên làm việc, không chép được tệp;
- khóa này **riêng cho CI**, khác khóa `ottimo_ops` của Bước 2. Script của đội từ chối nếu hai khóa trùng nhau.

Khi đội báo xong, chạy (cần `gh` đã đăng nhập bằng tài khoản của anh/chị):

```bash
gh secret set STAGING_SSH_KEY --env staging < ~/.ssh/ottimo_ci_deploy
ssh-keyscan -t ed25519 <IP-VPS> | gh secret set STAGING_SSH_KNOWN_HOSTS --env staging
printf '%s' '<IP-VPS>' | gh secret set STAGING_SSH_HOST --env staging
rm ~/.ssh/ottimo_ci_deploy
```

- Cả ba là **secret của môi trường `staging`**: không phải biến (Variables), không phải secret cấp repo. Secret được GitHub che trong log; biến thì không.
- Chỉ chạy khi môi trường `staging` đã có người duyệt (Bước 5).
- Lệnh đọc thẳng từ tệp, nên không cần sao chép, dán khóa.
- Dòng cuối xóa khóa riêng khỏi máy sau khi đã lưu lên GitHub.
- Đội đối chiếu vân tay máy chủ trước khi anh/chị chạy dòng `ssh-keyscan`.

### Bước 7. Token đọc image cho VPS
GitHub → Settings (tài khoản) → Developer settings → Personal access tokens → Tokens (classic) → Generate:
- chỉ tích quyền `read:packages`;
- hạn 1 năm.

Không dán token vào chat. Anh/chị tự đưa vào VPS bằng lệnh sau:

```bash
ssh -i ~/.ssh/ottimo_ops ottimo@<IP-VPS> 'docker login ghcr.io -u <tên-tài-khoản-GitHub> --password-stdin'
```

Lệnh chờ mà không hiện gì: dán token, bấm Enter, rồi bấm Ctrl-D. Thấy `Login Succeeded` là xong.

### Bước 8. Bật tạo image, rồi bật deploy tự động
**8a. Khi đội báo (ngày đầu, cần image để deploy tay):**
1. Variables cấp repo: thêm `PUBLISH_IMAGES` = `true`.
2. **Ngay sau** lượt CI đầu tạo image, vào GitHub → Packages:
   - kiểm `ottimo-api` và `ottimo-web` đang ở chế độ **Private**;
   - nếu thấy Public, báo đội ngay, chưa làm bước tiếp theo. Gói đã Public thì không chuyển lại Private được, chỉ xóa đi rồi tạo lại.

**8b. Chỉ khi đội báo đủ điều kiện D1–D5 của SEC (`reviews/s4-SEC.md` E.8). D6 kiểm ngay sau lượt đầu; không đạt thì tắt lại `STAGING_DEPLOY`:**

| # | Điều kiện | Ai |
|---|---|---|
| D0 | Khóa SSH `ottimo_ops` trên máy anh/chị đã có mật khẩu bảo vệ (passphrase) – đặt bằng `ssh-keygen -p -f ~/.ssh/ottimo_ops`, rồi `ssh-add --apple-use-keychain ~/.ssh/ottimo_ops`. Phải xong trước khi đội cài khóa bí mật và đăng nhập kho ảnh trên VPS (SEC E.9) | Anh/chị |
| D1 | Môi trường `staging` có anh/chị duyệt, chỉ `main`; 3 secret `STAGING_SSH_KEY`, `STAGING_SSH_KNOWN_HOSTS`, `STAGING_SSH_HOST` là secret của môi trường, tạo sau khi có người duyệt | Anh/chị (Bước 5, 6) |
| D2 | Bản sửa "CI chỉ nhận một dòng tóm tắt" đã gộp, có kết quả test | Đội |
| D3 | Gói `ottimo-api` và `ottimo-web` là Private | Anh/chị (8a) |
| D4 | Khóa CI trên VPS bị giới hạn chỉ lệnh deploy, khác khóa của người | Đội |
| D5 | Staging chỉ có dữ liệu giả | Đội |
| D6 | Sau lượt deploy đầu, SEC đọc log Actions: không có IP, đường dẫn, biến môi trường | SEC |

Rồi:
1. Variables cấp repo: thêm `STAGING_DEPLOY` = `true`.
2. Từ đó, mỗi lần CI xanh trên `main`, GitHub hiện "Review deployments". Anh/chị bấm **Approve and deploy** khi muốn cập nhật staging.
3. Log của lượt deploy chỉ có một dòng: `ok`, hoặc `failed` kèm mã tra cứu. Đội xem chi tiết trên máy chủ.

---

## Phần 3 – Đội làm (anh/chị không cần làm)

- Kiểm DNS, cài máy chủ: tường lửa, chỉ đăng nhập bằng khóa, tự vá bảo mật, Docker.
- Sinh mọi mật khẩu và khóa của ứng dụng ngay trên VPS. Không ai nhìn thấy, không đi qua chat.
- Cấp chứng chỉ HTTPS, deploy bản đầu, kiểm an toàn sau deploy.
- Bật sao lưu hằng ngày lúc 03:30 và diễn tập khôi phục.
- Bàn giao cho QA, SEC, PO kiểm thử trên staging (R-6).

Thắc mắc ở bước nào, nhắn đội số bước. Đội trả lời bằng hướng dẫn, không xin mật khẩu.
