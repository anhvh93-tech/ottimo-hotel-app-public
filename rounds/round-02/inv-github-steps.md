# OTTIMO – Cài GitHub và kho image cho staging

Dành cho: Chủ đầu tư · Soạn: OPS · 22/10/2026 · Việc R-5 (`qc/round-qc-gate.md` mục 5)
Thay cho Bước 5–8 của `inv-staging-checklist.md`. Tổng cộng khoảng 30 phút, chia 6 phần.
Cập nhật 22/10 theo SEC E.10 (`reviews/s4-SEC.md`): gói image để **công khai** là được chấp nhận; máy chủ kéo image **không cần đăng nhập**, nên **bỏ** việc tạo token và `docker login`. Làm **đúng thứ tự**: thứ tự này là điều kiện an toàn D0–D6 của SEC (`reviews/s4-SEC.md` E.8, E.9).

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
| Image đầu tiên (`sha-4fd0651b7be3`), deploy tay lần đầu | **Xong 22/10**: https://desk.staging.ottimo.vn, https://staff.staging.ottimo.vn, https://g.staging.ottimo.vn (chứng chỉ thật, dữ liệu giả, sao lưu hằng ngày) |
| Khóa CI (phần 5a) | **Xong 22/10**: anh/chị đã tạo; đội đã cài lên máy chủ (chỉ chạy được lệnh deploy) và đối chiếu vân tay máy chủ – **làm tiếp phần 5b** |
| Deploy tự động từ GitHub | **Chờ anh/chị** – phần 5b, 6 |

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

## Phần 3 – Xóa token GitHub đã tạo (2 phút) – theo SEC E.10

Máy chủ không cần token nữa. Nếu anh/chị đã tạo token cho bước "đăng nhập kho image" (bản hướng dẫn trước), hãy xóa nó: token không dùng thì không nên tồn tại.

1. Mở https://github.com/settings/tokens
2. Tìm token tên `ottimo-staging-ghcr-read` (hoặc token bắt đầu bằng `ghp_` tạo hôm nay cho việc này).
3. Bấm **Delete** → xác nhận.
4. Nếu đã lỡ chạy `docker login` trên máy chủ: báo đội, đội xóa thông tin đăng nhập đó trên máy chủ.

Chưa tạo token nào thì bỏ qua phần này. **Không** cần tạo token mới.

## Phần 4 – Bật tạo image (2 phút) – D3

1. **Settings** → **Secrets and variables** → **Actions** → tab **Variables**: `PUBLISH_IMAGES` = `true`. (ORC đã bật lại ngày 22/10 – chỉ kiểm.)
2. Mỗi lần code lên `main` có CI xanh, GitHub tạo image mới ở https://github.com/anhvh93-tech?tab=packages: `ottimo-api`, `ottimo-web`.
3. Hai gói hiện ghi **Public**. Theo SEC E.10, như vậy là **được**: image chỉ chứa mã đã công khai trong repo; mật khẩu và khóa chỉ nằm trên máy chủ. Không cần xóa hay đổi gói.
4. Quy tắc giữ an toàn (đội làm, anh/chị không cần làm gì): không bao giờ đưa mật khẩu hay khóa vào image; lỡ đưa nhầm thì xóa phiên bản đó **và** đổi khóa ngay.

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
| D3 | Gói image Public được chấp nhận (SEC E.10); máy chủ **không** `docker login`; image đúng tag `sha-<commit>` | Đội + SEC | Đạt |
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
| Thu hồi khóa CI | Báo đội gỡ khóa trên máy chủ; Environments → `staging` → xóa 3 secret; làm lại phần 5 |
| Lỡ dán token hoặc khóa vào chat | Thu hồi ngay theo dòng tương ứng ở trên, rồi báo đội |
