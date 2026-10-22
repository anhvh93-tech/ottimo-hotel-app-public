# OTTIMO – Cài GitHub và kho image cho staging

Dành cho: Chủ đầu tư · Soạn: OPS · 22/10/2026 · Việc R-5 (`qc/round-qc-gate.md` mục 5)
Thay cho Bước 5–8 của `inv-staging-checklist.md`. Tổng cộng khoảng 40 phút, chia 6 phần. Làm **đúng thứ tự**: thứ tự này là điều kiện an toàn D0–D6 của SEC (`reviews/s4-SEC.md` E.8, E.9).

Repo công khai, nên tài liệu ghi `<IP-VPS>` thay cho IP thật. **IP đội gửi riêng trong chat.**

---

## Quy tắc chung

- Mọi thứ có mật khẩu hoặc token: **anh/chị tự gõ hoặc dán trong Terminal hay trang GitHub**. Không dán vào chat, không chụp màn hình có token.
- Lệnh trong khung xám: chép nguyên khối, dán vào Terminal, bấm Enter. Chỗ có `<IP-VPS>`: thay bằng IP đội gửi (không giữ dấu `<` `>`).
- Đội đã kiểm: Terminal trên máy này đã đăng nhập GitHub (`gh`) bằng tài khoản `anhvh93-tech`. Repo: `anhvh93-tech/ottimo-hotel-app-public`.
- Xong mỗi phần: nhắn đội "xong phần N". Có thông báo lỗi: chụp màn hình (không có token) gửi đội.

## Trạng thái hiện tại (đội đã làm, 22/10)

| Việc | Trạng thái |
|---|---|
| D0 – khóa `ottimo_ops` có passphrase | Xong (ORC kiểm) |
| Máy chủ: tường lửa, chỉ đăng nhập bằng khóa, Docker | Xong |
| DNS `desk/staff/g.staging.ottimo.vn` | Xong. CAA: Mắt Bão không hỗ trợ, đội ghi rủi ro trước production |
| Cấu hình staging, khóa bí mật của ứng dụng, khóa sao lưu | Xong. Bí mật sinh ngay trên máy chủ, không ai thấy |
| HTTPS | Đã thử xin chứng chỉ thử nghiệm cho cả 3 tên miền: đạt |
| Đăng nhập kho image, image đầu tiên, deploy | **Chờ anh/chị** – phần 1–4 dưới đây |
| Deploy tự động từ GitHub | **Chờ anh/chị** – phần 5–6 |

---

## Phần 1 – Số điện thoại lễ tân (2 phút)

Bản build cần số này cho nút "Gọi lễ tân". Thiếu số thì bước tạo image dừng ngay.

1. Mở https://github.com/anhvh93-tech/ottimo-hotel-app-public
2. Bấm **Settings** (tab trên cùng, bên phải).
3. Cột trái: **Secrets and variables** → **Actions**.
4. Chọn tab **Variables** (không phải Secrets) → **New repository variable**.
5. Name: `VITE_DESK_PHONE`. Value: số lễ tân công khai, **chỉ chữ số và dấu cách** (ví dụ dạng `0xx xxxx xxxx`).
6. Bấm **Add variable**.

## Phần 2 – Môi trường `staging` có người duyệt (5 phút) – D1, phần 1

Phải làm **trước** khi tạo bất kỳ secret nào.

1. Vẫn trong **Settings** của repo, cột trái: **Environments** → **New environment**.
2. Name: `staging` → **Configure environment**.
3. Tích **Required reviewers**, gõ `anhvh93-tech`, chọn tài khoản của anh/chị.
4. **Không** tích "Prevent self-review" (nếu tích, chính anh/chị sẽ không duyệt được).
5. Mục **Deployment branches and tags**: chọn **Selected branches and tags** → **Add deployment branch or tag rule** → gõ `main` → **Add rule**.
6. Bấm **Save protection rules**.
7. Chưa thêm secret hay variable nào trong trang này.

Nên làm thêm (không bắt buộc): **Settings** → **Actions** → **General** → mục "Artifact and log retention" → đặt `30` ngày → **Save**. Log của repo công khai ai cũng đọc được; lưu ngắn thì bớt rủi ro.

## Phần 3 – Token đọc image và đăng nhập kho trên máy chủ (10 phút)

Máy chủ cần quyền **chỉ đọc** image từ GitHub. Token đi thẳng từ trình duyệt vào máy chủ, không qua chat, không lưu ở máy Mac.

**3a. Tạo token**
1. Mở https://github.com/settings/tokens/new (GitHub → ảnh đại diện → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → Generate new token (classic)).
2. Note: `ottimo-staging-ghcr-read`.
3. Expiration: **90 days** (đội nhắc gia hạn trước hạn).
4. Chỉ tích **một ô**: `read:packages`. Không tích ô nào khác.
5. Bấm **Generate token**. GitHub hiện token **một lần**. Bấm biểu tượng sao chép bên cạnh. Để nguyên trang đó.

**3b. Đăng nhập kho trên máy chủ** (Terminal)
```bash
ssh ottimo@<IP-VPS>
```
Thấy dấu nhắc kiểu `ottimo@...:~$` thì gõ:
```bash
docker login ghcr.io -u anhvh93-tech
```
- Hiện `Password:` → bấm **Cmd-V** để dán token, rồi bấm Enter. Trong lúc dán **không hiện ký tự nào**; đó là bình thường.
- Thấy `Login Succeeded` là xong. Dòng cảnh báo "credentials are stored unencrypted" là bình thường: tệp đó chỉ người dùng `ottimo` đọc được, token chỉ có quyền đọc.
- Gõ `exit` để thoát máy chủ.

**3c.** Đóng trang token trên GitHub. Không lưu token ở nơi nào khác. Mất token thì tạo token mới và làm lại 3b.

## Phần 4 – Bật tạo image, kiểm gói Private (5 phút + chờ CI) – D3

1. **Settings** → **Secrets and variables** → **Actions** → tab **Variables** → **New repository variable**:
   - Name `PUBLISH_IMAGES`, Value `true` → **Add variable**.
2. Báo đội. Lần đẩy code kế tiếp lên `main`, CI tạo image (khoảng 15–25 phút). Đội báo khi xong.
3. **Ngay khi đội báo**, mở https://github.com/anhvh93-tech?tab=packages
   - Phải thấy `ottimo-api` và `ottimo-web`, mỗi gói ghi **Private**.
   - Thấy **Public** ở gói nào: **báo đội ngay**, không làm gì thêm. Gói đã Public không đổi lại Private được, phải xóa và tạo lại.
4. Gói đều Private: đội tự deploy bản đầu lên staging và kiểm an toàn. Anh/chị không cần làm gì thêm ở phần này.

Tới đây staging đã chạy được, cập nhật bằng tay (đội deploy). Phần 5–6 để GitHub tự deploy sau mỗi lần anh/chị duyệt.

## Phần 5 – Khóa riêng cho GitHub deploy (10 phút) – D1, phần 2 và D4

Chỉ làm **sau phần 2** và khi đội báo "sẵn sàng phần 5".

**5a. Tạo khóa** (Terminal trên máy Mac):
```bash
ssh-keygen -t ed25519 -f ~/.ssh/ottimo_ci_deploy -N "" -C "ottimo-ci-deploy"
```
Nhắn đội "đã tạo khóa CI". Đội cài nửa công khai (`.pub`) lên máy chủ: khóa này chỉ chạy được lệnh deploy, không mở được phiên làm việc, không chép được tệp, và khác khóa `ottimo_ops`.

**5b. Khi đội báo "đã cài khóa CI, đã đối chiếu vân tay máy chủ"**, chép nguyên khối sau vào Terminal (thay `<IP-VPS>` ở **2 chỗ**):
```bash
R=anhvh93-tech/ottimo-hotel-app-public
gh secret set STAGING_SSH_KEY --env staging -R "$R" < ~/.ssh/ottimo_ci_deploy
ssh-keyscan -t ed25519 <IP-VPS> 2>/dev/null | gh secret set STAGING_SSH_KNOWN_HOSTS --env staging -R "$R"
printf '%s' '<IP-VPS>' | gh secret set STAGING_SSH_HOST --env staging -R "$R"
rm ~/.ssh/ottimo_ci_deploy
gh secret list --env staging -R "$R"
```
- Kết quả cuối phải liệt kê đúng 3 tên: `STAGING_SSH_HOST`, `STAGING_SSH_KEY`, `STAGING_SSH_KNOWN_HOSTS`. GitHub không bao giờ hiện lại giá trị: đúng như thiết kế.
- Ba dòng đầu đọc thẳng từ tệp, nên không cần sao chép hay dán khóa.
- Dòng `rm` xóa khóa riêng khỏi máy Mac sau khi đã lưu lên GitHub. Tệp `.pub` còn lại không phải bí mật.
- Đây là **secret của môi trường `staging`**, không phải Variables, không phải secret cấp repo. Secret được che trong log công khai; Variables thì không.

Nhắn đội "xong phần 5".

## Phần 6 – Bật deploy tự động (2 phút) – chỉ khi đội báo "đủ D1–D5"

| # | Điều kiện | Ai | Trạng thái |
|---|---|---|---|
| D0 | Khóa `ottimo_ops` có passphrase | Anh/chị | Xong |
| D1 | Môi trường `staging` có người duyệt, chỉ `main`; 3 secret tạo sau đó | Anh/chị | Phần 2 + 5 |
| D2 | CI chỉ nhận một dòng tóm tắt khi deploy | Đội | Đã có trong code, SEC duyệt |
| D3 | Gói `ottimo-api`, `ottimo-web` Private | Anh/chị | Phần 4 |
| D4 | Khóa CI chỉ chạy lệnh deploy, khác khóa người | Đội | Khi cài khóa ở phần 5 |
| D5 | Staging chỉ có dữ liệu giả | Đội | Có |
| D6 | Sau lượt deploy tự động đầu, SEC đọc log: không có IP, đường dẫn, biến môi trường | SEC | Sau bước 3 dưới đây |

Khi đội báo đủ D1–D5:
1. **Settings** → **Secrets and variables** → **Actions** → tab **Variables** → **New repository variable**: Name `STAGING_DEPLOY`, Value `true` → **Add variable**.
2. Lần đẩy code kế tiếp lên `main`, sau khi CI xanh, GitHub gửi email/thông báo "Review deployments". Mở lượt chạy đó → **Review deployments** → tích `staging` → **Approve and deploy**.
3. Log của bước deploy chỉ có **một dòng**: `deploy sha-…: ok`, hoặc `failed` kèm mã tra cứu. Chi tiết nằm trên máy chủ, đội xem.
4. SEC đọc log lượt đầu (D6). Không đạt thì đội nhờ anh/chị sửa `STAGING_DEPLOY` thành `false` cho tới khi sửa xong.

Từ đó: muốn cập nhật staging thì bấm **Approve and deploy**; không bấm thì staging đứng ở bản cũ.

---

## Khi cần thu hồi (sự cố, lộ khóa, đổi người)

| Việc | Cách làm |
|---|---|
| Dừng deploy tự động | Variables → `STAGING_DEPLOY` → sửa thành `false` |
| Thu hồi token đọc image | https://github.com/settings/tokens → `ottimo-staging-ghcr-read` → **Delete**. Báo đội; tạo token mới và làm lại phần 3 |
| Thu hồi khóa CI | Báo đội gỡ khóa trên máy chủ; Environments → `staging` → xóa 3 secret; làm lại phần 5 |
| Lỡ dán token hoặc khóa vào chat | Thu hồi ngay theo dòng tương ứng ở trên, rồi báo đội |
