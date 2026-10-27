# SEC – quyết định trước buổi B2 (28/10/2026 09:00)

- Người viết: SEC | Round 3 – Review chéo (sẵn sàng B2, ngày chạy D = 02/11) | 27/10/2026
- Đọc:
  - `rounds/round-03/outputs/OPS/v1-production.md` mục 21 (21.4, 21.5) và `rounds/round-03/outputs/OPS/b2-runbook.md`;
  - mã trên `main` `f4970d1`: `jobs/email-dispatch.ts` (chọn người nhận), `platform.controller.ts` `receivingAccountChanged`, `identity/public/mfa-store.ts`, `mfa.service.ts`, `operator-reset.ts`;
  - yêu cầu SEC 06.15 và Q51-6 (`outputs/SEC/s1-security-requirements.md`).
- Không đăng nhập production, không đọc dữ liệu thật.

## Tóm tắt hai quyết định

| # | Việc | Quyết định SEC |
|---|---|---|
| 1 | Thư "Security notice" không có người nhận | **Chấp nhận chạy ngày 02/11** với lỗ hổng này, kèm biện pháp bù hằng ngày (mục 1.3). **Không vá tạm trong B2.** Từ chối phương án B (INV gõ SQL đặt email). BE thêm email người dùng ở **v1.0.1** (04/11), là điều kiện bắt buộc. Quá **09/11** chưa có thì SEC lập ESC. Ghi lỗi **BUG-R3-032 (P1)**. |
| 2 | Khóa giải mã sao lưu production không có passphrase, nằm cùng Mac với bản sao lưu | Dùng tệp như hiện tại cho diễn tập B2. **Trong ngày 28/10, sau khi diễn tập đạt**, xóa khỏi Mac. Khi không dùng, khóa chỉ được nằm ở 2 nơi: trình quản lý mật khẩu và bản ngoại tuyến A8 (để riêng, không chung phong bì với KEK). **Không đặt passphrase.** Từ lần diễn tập sau, khóa được đưa thẳng vào RAM của container, không ghi xuống đĩa Mac. Bỏ cách tạo lại bằng TextEdit. |

---

## 1. Thư "Security notice" không có người nhận

### 1.1 SEC kiểm lại

- `email-dispatch.ts:205–224` chỉ gửi tới `app_user.email` khác rỗng. Không có người nhận thì thư thành `dead NO_RECIPIENT` và **không bao giờ gửi lại**: thư đã chết vẫn mất kể cả khi sau này người dùng có email.
- Bốn mẫu thư bị ảnh hưởng: `receiving_account_changed`, `mfa_recovery_code_used`, `mfa_reset`, `mfa_reset_by_operator`.
- Cả bốn đều **có thông báo trong app** song song:
  - đổi tài khoản nhận tiền → mọi OWN/MGR;
  - dùng mã khôi phục / đặt lại 2 bước → chính người đó và mọi OWN.

  Phần mất chỉ là **kênh ngoài app**. SEC đặt kênh này (Q51-6) để người đã chiếm được phiên OWN không tự xóa được dấu vết: họ có thể đánh dấu đã đọc thông báo trong app, nhưng không xóa được thư đã tới hộp thư cá nhân của chủ.
- Các lớp **phòng ngừa** vẫn chạy đủ:
  - chỉ OWN đổi được tài khoản nhận (`platform.controller.ts`, 403 trước khi kiểm mật khẩu);
  - phải xác nhận lại S2 (mật khẩu + mã 2 bước), `MFA_ENFORCED=true` trên production;
  - hiệu lực **từ hôm sau**;
  - cảnh báo "vừa đổi tài khoản nhận" trên **mọi QR** trong 24 giờ của ngày hiệu lực (Q51-6);
  - audit `money` có số tài khoản che.

### 1.2 Đánh giá rủi ro

- Kịch bản xấu nhất: kẻ có **cả** mật khẩu lẫn mã 2 bước của OWN đổi tài khoản nhận, rồi xóa dấu trong app. Từ ngày hiệu lực, tiền QR của khách chảy sang tài khoản khác cho tới khi có người phát hiện.
- Không có email: mức **High** (phát hiện phụ thuộc may rủi).
- Có biện pháp bù mục 1.3 (kiểm mỗi sáng + đối soát + quy tắc QR "vừa đổi"): còn **Medium**. Lý do:
  - thay đổi chỉ có hiệu lực từ hôm sau;
  - buổi kiểm sáng phát hiện trước giờ đông khách;
  - mỗi QR trong ngày hiệu lực đều mang cảnh báo mà lễ tân được dạy phải dừng lại.
- Thời gian phơi nhiễm dự kiến: 02/11 → 04/11 (v1.0.1), tối đa tới 09/11. SEC chấp nhận trong khoảng này.

### 1.3 Biện pháp bù – bắt buộc từ ngày B2 cho tới khi thư bảo mật tới được chủ

| # | Ai | Việc | Khi nào |
|---|---|---|---|
| B1 | OWN (INV) | Mở Desk, vào **"Tài khoản nhận chuyển khoản"**: đúng **một** dòng đang áp và **không** có dòng đã lên lịch lạ. Tên chủ tài khoản đúng. | Mỗi sáng trước 09:00, kể cả ngày nghỉ |
| B2 | OWN | Mở **chuông thông báo** và **Nhật ký thao tác**, lọc 24 giờ qua, loại `money`, `security`, `config`. Có `receiving_account_changed`, `mfa.recovery_code_used`, `mfa.reset*` mà mình không làm thì **gọi đội ngay**. Lúc đó **không** đổi lại tài khoản trên chính phiên đó: dùng 06.33 / khóa tài khoản theo hướng dẫn SEC. | Cùng lúc B1 |
| B3 | OWN | Ghi một dòng vào sổ giao ca: "Đã kiểm TK nhận + nhật ký – <giờ>". Không ghi số tài khoản. | Cùng lúc B1 |
| B4 | OWN hoặc MGR | Đối soát tiền chuyển khoản trên app ngân hàng với các khoản VietQR trên Desk của ngày hôm trước. Khoản Desk ghi nhận mà ngân hàng không có → báo OWN ngay. | Mỗi sáng |
| B5 | Lễ tân, lễ tân trưởng, MGR | QR có dòng **"vừa đổi tài khoản nhận"**: **chưa cho khách chuyển**, gọi điện cho OWN xác nhận, OWN đồng ý thì mới tiếp. Thấy thông báo đổi tài khoản trong app mà chưa nghe OWN nói → gọi OWN. | Mọi ca. Đưa vào đào tạo C3a (31/10–01/11) và `staff-one-pager.md` |
| B6 | OWN | Kênh dự phòng là **điện thoại** (06.33). Không chia sẻ mật khẩu, không cài app xác thực trên máy dùng chung. Mã khôi phục chỉ trên giấy. | Liên tục |

### 1.4 Vì sao không vá tạm trong B2 (từ chối phương án B)

- **Ghi tay vào DB production ngoài app.** Không qua kiểm tra của app, không có audit của app, ngoài quy trình bootstrap/runbook. Đã làm một lần thì thành tiền lệ.
- **Địa chỉ `info@ottimo.vn` là hộp thư chung, công khai.** Thư bảo mật của chủ không nên về hộp mà người khác (nhân viên, đơn vị làm marketing) có thể đọc hoặc xóa: đúng loại người mà kênh này cần phòng.
- **Image rc.3 không có đường an toàn nào để đặt email.** CLI bootstrap không có `--owner-email`; API/Desk không có trường email. Vá trong buổi nghĩa là sửa DB tay. SEC không duyệt.
- Dòng `dead NO_RECIPIENT` của thư `receiving_account_changed` ở phần 3 B2 là **đúng dự kiến**. QA/QC không tính là lỗi mới.

### 1.5 Việc cho BE ở v1.0.1 (04/11) – điều kiện bắt buộc

1. **Trường `email` cho người dùng** (`Me` và "Người dùng & vai"):
   - OWN tự đặt email của mình;
   - OWN đặt email cho MGR và nhân viên;
   - MGR **không** được đặt hay đổi email của OWN;
   - kiểm định dạng; độ dài ≤ 254.
2. **Đặt hoặc đổi email là thao tác bảo mật.** Nếu không có các ràng buộc dưới đây, kẻ chiếm phiên chỉ cần đổi email sang địa chỉ của họ là tắt được báo động.
   - Bắt buộc **S2** (mật khẩu + mã 2 bước của người thao tác).
   - Audit `security` `user.email_changed` (email **che**, ví dụ `a***@d***.vn`).
   - Thông báo trong app cho chính người đó và mọi OWN.
   - Thư tới **cả địa chỉ cũ** (nếu có) **lẫn địa chỉ mới**, mẫu mới `email_changed`.
3. **Bootstrap `--owner-email` (tùy chọn).** Nhập qua dấu nhắc ẩn, như mật khẩu. Không nhận qua tham số dòng lệnh, vì lịch sử shell sẽ giữ lại.
4. **Không in email ra log/Problem.** Trường email trong log bị che (SR-LOG).
5. **Test:**
   - đổi email không có S2 → 401;
   - MGR đổi email OWN → 403;
   - thư `email_changed` tới cả hai địa chỉ;
   - `receiving_account_changed` có người nhận sau khi OWN có email.
6. Hợp đồng do ARC (OpenAPI 0.3.9 hoặc 0.3.10). SEC review PR.

**Việc cho OPS:**
- (a) `ops-check` thêm một dòng đếm `staff.email` `dead NO_RECIPIENT` trong 24 giờ, chỉ đếm, không đọc nội dung. Sau v1.0.1, số > 0 thì cảnh báo.
- (b) Sau khi INV nhập email trên Desk (v1.0.1): gửi thư thử tới đúng địa chỉ đó **qua đường thật**. INV tự đổi một tham số không quan trọng có thông báo, hoặc QA làm ca tương đương trên staging trước. Rồi xác nhận thư "Security notice" tới.

**Ngưỡng báo lên:** v1.0.1 không có trường email trước **09/11** thì SEC lập ESC cho INV: chấp nhận rủi ro tiếp hay hoãn mở QR.

---

## 2. Khóa giải mã sao lưu production trên Mac

### 2.1 Đánh giá

- `~/.ottimo/backup/ottimo-prod-backup-identity.txt` không có passphrase. Nó nằm cạnh `~/.ottimo/backups/ottimo-prod/`, nơi chứa các bản sao lưu đã kéo về.
- Ai có Mac (mất máy, mượn máy, phần mềm độc hại) là đọc được toàn bộ bản dump: tên khách, SĐT, đơn, folio, tài khoản nhận tiền, nhật ký.
- Ảnh giấy tờ còn lớp KEK (KEK không nằm trong bản sao lưu), nhưng dữ liệu C2 thì lộ hết.
- Mức **High** nếu để lâu. Trong ngày B2 thì chấp nhận được, vì phải dùng để diễn tập.

### 2.2 Quyết định

1. **Sáng 28/10:** dùng tệp hiện có cho phần 5 (10:13), không đổi runbook phút chót.
2. **Trước 09:00 28/10, INV kiểm FileVault.** Terminal: `fdesetup status` phải in `FileVault is On.`.
   - Nếu tắt: vẫn làm B2. Nhưng **trong ngày** phải bật FileVault, hoặc xóa cả khóa lẫn các bản sao lưu khỏi Mac sau diễn tập.
   - Đĩa Mac không mã hóa thì không được giữ dữ liệu khách, kể cả bản đã mã hóa bằng `age` mà khóa nằm cạnh.
3. **Xóa khóa khỏi Mac trong ngày 28/10.** Chỉ xóa khi đủ ba điều kiện:
   - (a) diễn tập phần 5 **ĐẠT**;
   - (b) bản trong **trình quản lý mật khẩu** là đúng khóa. Kiểm mà không lộ khóa: chép khóa từ trình quản lý mật khẩu, rồi chạy

     `pbpaste | docker run -i --rm ottimo-drill-runner:local age-keygen -y; pbcopy </dev/null`

     Lệnh in khóa **công khai** `age1…`. Nó phải trùng dòng trong `recipients.txt` trên máy chủ (OPS đọc dòng này, khóa công khai không phải bí mật);
   - (c) có **bản ngoại tuyến A8** (giấy niêm phong hoặc USB mã hóa) cất két, **phong bì riêng, không chung với KEK**. KEK cộng khóa sao lưu là mở được cả ảnh giấy tờ.

   Xóa xong: `rm ~/.ottimo/backup/ottimo-prod-backup-identity.txt`, rồi `ls ~/.ottimo/backup` không còn tệp đó.
4. **Time Machine / iCloud.**
   - Nếu Mac bật Time Machine: chạy `tmutil addexclusion ~/.ottimo` **trước khi** xóa khóa. INV xem ổ Time Machine có mã hóa không (System Settings → General → Time Machine → ổ đĩa ghi "Encrypted"). Ổ không mã hóa mà đã sao lưu `~/.ottimo` từ 26/10 thì báo SEC: phải thay cặp khóa sao lưu (P5-b của runbook).
   - `~/.ottimo` nằm ngoài Desktop/Documents nên không bị iCloud đồng bộ. Giữ nguyên chỗ này.
5. **Không đặt passphrase cho tệp khóa.** `age` hỏi passphrase cần một terminal. Runner chạy `docker run` không tương tác nên sẽ hỏng, và passphrase lại thành bí mật thứ ba phải cất. Cách an toàn hơn là **không để khóa nằm trên đĩa**.
6. **Lần diễn tập sau, OPS sửa `b2-runbook.md` 2.5:**
   - Bỏ cách tạo lại khóa bằng **TextEdit**. TextEdit tự lưu phiên bản vào kho Versions của macOS, nên xóa tệp không xóa các bản đó.
   - Thay bằng: chép khóa từ trình quản lý mật khẩu, đưa thẳng vào tmpfs của container, xóa clipboard ngay sau đó:

     `pbpaste | docker run -i --rm --tmpfs /tmp … ottimo-drill-runner:local bash -c 'umask 077; cat > /tmp/id && infra/server/bin/restore-drill.sh --identity /tmp/id --from /backups …'; pbcopy </dev/null`

     Khóa chỉ có trong RAM của container chạy một lần.
   - OPS thử đường này trên **khóa tổng hợp** trước khi dùng với khóa production.
7. **Bản sao lưu đã mã hóa trên Mac:** giữ được (FileVault bật). Thư mục 0700, tệp 0600 như hiện tại.
8. **Ghi nhận 21.5 #5** (bí mật production thuộc `ottimo-admin`): SEC chấp nhận. Tài khoản này đã có `sudo` không mật khẩu nên không mở thêm quyền. Ghi vào rủi ro còn lại, xem lại khi có người vận hành thứ hai.

---

## 3. Việc INV phải làm

| Khi | Việc |
|---|---|
| Trước 09:00 28/10 | `fdesetup status` → `FileVault is On.` Báo trong chat "FileVault bật/tắt", không gửi ảnh. Nếu có Time Machine: `tmutil addexclusion ~/.ottimo`. |
| Trong B2, phần 3 | Thấy dòng outbox `receiving_account_changed` `dead NO_RECIPIENT` là bình thường. Không làm gì thêm. |
| 28/10, sau khi diễn tập ĐẠT | Kiểm bản khóa trong trình quản lý mật khẩu (mục 2.2 bước 3b) → cất bản ngoại tuyến A8, phong bì riêng với KEK → `rm` tệp khóa trên Mac. Báo "đã xóa khóa khỏi Mac" trong chat. |
| Mỗi sáng từ 29/10 tới khi thư bảo mật tới được | B1–B4 mục 1.3: kiểm "Tài khoản nhận chuyển khoản", chuông, nhật ký 24 giờ, đối soát ngân hàng; ghi một dòng sổ giao ca. |
| Đào tạo C3a (31/10–01/11) | Dạy lễ tân quy tắc B5: QR "vừa đổi tài khoản nhận" → dừng, gọi OWN. |
| Sau v1.0.1 (04/11) | Tự nhập **email cá nhân** (không dùng hộp chung `info@`) vào Desk; xác nhận nhận được thư thử "Security notice". |

## 4. Ghi chú cho ORC

- Không có ESC lúc này. Cả hai việc thuộc quyền SEC (mức rủi ro, yêu cầu kỹ thuật). ESC chỉ lập nếu v1.0.1 không có email trước 09/11.
- Đã thêm **BUG-R3-032 (P1, BE-A + ARC, v1.0.1)** vào `rounds/round-03/qa/bug-list.md`.
- Cần giao thêm:
  - BA/UXD thêm quy tắc B5 vào `staff-one-pager.md` và sổ tay;
  - OPS sửa runbook 2.5 và thêm đếm `dead NO_RECIPIENT` vào `ops-check`.
- SEC ghi `decision-log.md` hai quyết định này ở bước Phản hồi & sửa. Lần này không commit nên chưa ghi.
