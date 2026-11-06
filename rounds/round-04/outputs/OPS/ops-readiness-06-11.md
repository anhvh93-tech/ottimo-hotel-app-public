# Kiểm sẵn sàng vận hành – production sau LP-v2 (06/11/2026)

Soạn: OPS · Round 4, bước **Phản hồi & sửa → Tổng kết** · giờ kiểm 18:20–18:45 (+07), tức 11:20–11:45Z.
Cách kiểm: **chỉ đọc**. SSH `ottimo-admin` theo khuôn `cd / && sudo -n -u ottimo …`. Lệnh cần root (journal, `du`, `stat` tệp bí mật) chỉ đọc qua `sudo -n`. SQL đi qua `SQLRO` (`default_transaction_read_only=on`, dòng đầu `on`). Chứng chỉ đọc từ máy OPS bằng `openssl s_client`. Không sửa `.env`, không restart, không deploy, không chạy `ops-check` bằng tay (lệnh này ghi tệp trạng thái và có thể gửi webhook). `.env` chỉ đọc **tên khóa, số dòng, độ dài, tên máy chủ của URL**, không đọc giá trị bí mật. Tệp này không có IP, bí mật, email hay digest đầy đủ.

## 0. Kết luận

Vận hành hằng ngày **chạy đúng**: 4 timer bật, lượt kiểm 30 phút một lần ra 16/16 `ok` (18:20), cảnh báo có ba đường (journal, Google Chat, Healthchecks), sao lưu đêm đều đặn, chứng chỉ còn ≥ 74 ngày, đĩa 18 %, log có giới hạn.

Lỗ hổng: **1 cao, 4 trung bình, 7 thấp** (mục 8). Cao nhất: **bản sao lưu ngoài máy đã 7 ngày không được kéo về** (lần cuối 30/10). Nếu mất VPS lúc này thì mất 7 ngày dữ liệu thật, gồm đơn, folio, thanh toán, yêu cầu web và dòng thông báo LP-v2. Việc này cần INV hoặc ORC chạy ngay hôm nay (mục 11).

## 1. Hiện trạng production

| Mục | Đọc được |
|---|---|
| App | `current_tag` = `sha-6414be25f20d` (v1.0.4 + LP-v2), `previous_tag` = `sha-da6d6f3dc22b` |
| Landing | `landing_tag` = `sha-6414be25f20d`, `landing_previous_tag` = `sha-72f9ac8e2b33` |
| Container | 11 container, tất cả `running`. Có healthcheck thì `healthy`. Restart `unless-stopped`. Postgres production chạy liên tục từ 26/10 |
| Máy | Ubuntu 24.04.5 LTS, kernel 6.8.0-147, uptime 13 ngày. RAM 4,9 GB, còn 3,78 GB. Swap 2 GB, dùng 0 |
| DB production | 18 MB, 72 migration. `archive_mode = off` (không có WAL archive) |
| Cron | Không có crontab nào (root, `ottimo`, `ottimo-admin`). `/etc/cron.d` chỉ có mục của hệ thống. Mọi lịch đều chạy bằng systemd timer |

## 2. Giám sát và cảnh báo

| Mục | Kết quả |
|---|---|
| Timer | `ottimo-ops-check@ottimo-prod.timer` và `ottimo-ops-check.timer` (staging): bật, 30 phút một lần, lượt cuối 18:20 (+07), kết quả `success`. `ottimo-backup@ottimo-prod.timer` 03:00 (+07), `ottimo-backup.timer` (staging) 03:30, lượt cuối 06/11 thành công |
| Lượt kiểm 18:20 | Production và staging đều 16/16 `ok`: containers, j16, backup, disk, mem, tls, http5xx, email_dead, email_missing, email_changes, email_ascii, pricelimit, pricegap, priceswitch, email_config, db_triggers |
| Cảnh báo 7 ngày (journal `ottimo-alert`) | Production: `containers` 1 lần (30/10, FAIL giả lúc gắn cảnh báo, đã ghi decision-log) và `priceswitch` 1 lần (06/11, đúng ý: OWN bật giá ở F2, ORC chạy tay). Staging: `email_changes` 51 lần (03–04/11, QA thử v1.0.4) và `priceswitch` 1 lần. `webhook failed` 0 lần, `heartbeat … failed` 0 lần trong 14 ngày |
| Cảnh báo gửi đi đâu (production) | (1) journal `ottimo-alert` + `systemctl --failed`. (2) `ALERT_WEBHOOK_URL`: có giá trị, máy chủ `chat.googleapis.com`. Đây là phòng "OTTIMO – Báo động" (decision-log 30/10), **khác** phòng nhận yêu cầu đặt phòng (đã so byte, không in). Gửi khi đổi trạng thái và nhắc mỗi 6 giờ. (3) `HEARTBEAT_URL`: có giá trị, máy chủ `hc-ping.com` (Healthchecks.io, check 30 phút, grace 1 giờ, gửi email cho hộp thư chung). Đường này báo được cả khi VPS chết. (4) UptimeRobot 5 monitor từ bên ngoài (decision-log 30/10). Từ máy chủ OPS không kiểm được đường này |
| Staging | Chỉ journal. `ALERT_WEBHOOK_URL` rỗng, không có `HEARTBEAT_URL`. Đúng thiết kế |
| Unit hỏng | `systemctl --failed`: `fwupd.service`, `fwupd-refresh.service` (cập nhật firmware, không có nghĩa trên VPS). Không có unit nào của OTTIMO |

## 3. Sao lưu

| Mục | Production `/var/backups/ottimo-prod` | Staging `/var/backups/ottimo` |
|---|---|---|
| Lịch | 03:00 (+07), lệch ngẫu nhiên ≤ 5 phút, `Persistent=true` | 03:30 (+07) |
| Lần thành công cuối (`state/backup.last_ok`) | 06/11 07:08:35Z (bản chạy tay trước LP-v2, sau bản 03:05 của timer) | 05/11 20:33:57Z (06/11 03:33 +07) |
| Số bộ | 10 bộ db/blobs/counts, 8 `privacy-notice`, 20 `purge-journal`. Cũ nhất `db-20261031T200045Z` (trong cửa sổ 7 ngày) | 11 bộ, chưa có `privacy-notice` (tệp log staging mới có từ 06/11 08:53Z, bản đêm nay sẽ có) |
| Dung lượng | 7,4 MB tổng, bản db mới nhất 0,74 MB. Mỗi lượt chạy 3–4 giây | 26 MB |
| Quyền thư mục | `ottimo:ottimo 0700` | `ottimo:ottimo 0700` |
| **Bản ngoài máy** | Khóa kéo `rrsync -ro`. Theo nhật ký sshd (phân loại theo vân tay khóa, không in địa chỉ), lần kéo cuối là **30/10 16:11 (+07)**. Trên máy OPS/INV, bản mới nhất ở `~/.ottimo/backups/ottimo-prod` là `db-20261030T090820Z`. Từ đó tới nay **0 lần kéo**: các bản 31/10–06/11 chỉ nằm trên VPS | Không kéo (dữ liệu giả) |

Ghi nhận: vòng giữ tính "Chủ nhật" theo giờ UTC, nên bản giữ tuần thật ra là bản 03:00 sáng thứ Hai giờ VN. Vẫn đúng 7 ngày + 1 bản/tuần ≤ 35 ngày (SR-BAK-03). Không phải lỗi.

## 4. Khôi phục

- **Diễn tập khôi phục production gần nhất: 29/10**, trên bản `20261029T033257Z`, image `sha-70fe734e9077`, 65 migration: ĐẠT, 5 giây, đếm khớp 100 % (QC `rounds/round-03/qc/v1-gate.md` G4-7). Biên bản `restore-prod-20261029.txt` nằm trên máy OPS/INV, **chưa vào repo** (D-T3 vẫn mở). Bản sao lưu dùng hôm đó đã hết hạn giữ và bị xóa (bộ `counts` bị xóa đêm 05/11).
- Từ đó tới nay DB đi từ 65 lên **72 migration** (v1.0.2 → v1.0.4 + LP-v2: trigger chỉ ghi thêm của `privacy_notice_version` (0090), `user_email_change` (0091), 0092 LP-v2, trigger `room_list_price_append_only` (0094)…). Chưa diễn tập lại. Quy định là **mỗi round một lần** (SR-BAK-05, README 10), mà Round 4 chưa có lần nào.
- Diễn tập staging: README 12 vẫn ghi "(chưa)".
- Chưa từng diễn tập **dựng lại cả VPS** (RTO ≤ 4 giờ trong `hosting-plan.md` vẫn là giả định). Cần có: gói `infra/` (repo), `.env` (không có trong bản sao lưu), các tệp `secrets/`, bản ngoại tuyến `data_kek_current` do INV giữ (README 4.2), khóa giải mã `age` production do INV giữ, image (GHCR công khai), DNS.

## 5. Chứng chỉ TLS (đọc từ ngoài, 06/11)

| Host | Hết hạn | Còn |
|---|---|---|
| `ottimo.vn`, `www.ottimo.vn` | 22/01/2027 | 76 ngày |
| `desk.ottimo.vn`, `staff.ottimo.vn`, `g.ottimo.vn` | 24/01/2027 | 78 ngày |
| `staging.ottimo.vn`, `www.staging.ottimo.vn` | 04/02/2027 | 89 ngày (cấp 06/11) |
| `desk.staging…`, `staff.staging…`, `g.staging…` | 20/01/2027 | 74 ngày |

Tất cả do Let's Encrypt cấp. Caddy tự gia hạn khi còn 30 ngày, và `ops-check tls` cảnh báo khi còn dưới 14 ngày. Đạt.

## 6. Đĩa, log, logrotate

| Mục | Đọc được | Đánh giá |
|---|---|---|
| Đĩa `/` | 55 GB, dùng 8,9 GB (18 %), inode 7 % | Đạt (`ops-check disk` cảnh báo từ 80 %) |
| Docker | 19 image 2,66 GB, thu hồi được 1,49 GB. 12 volume 168 MB. Không có build cache | Đạt. Chưa có lịch dọn image (L6) |
| Log container | `daemon.json`: driver `local`, `max-size 20m`, `max-file 5`. Compose đặt cùng giá trị cho mọi service. Edge `5m × 3`. Tổng hiện 3,7 MB | Có giới hạn. Nhưng log **mất khi container được dựng lại**: hôm nay api/worker/landing/web đều dựng lại lúc 07:10–09:35Z, nên log trước đó không còn (M3) |
| journald | 274 MB, không đặt `SystemMaxUse`, nên dùng mặc định (10 % hệ thống tệp, tối đa 4 GB) | Đạt |
| logrotate | `logrotate.timer` bật, lượt cuối 06/11 00:00 thành công. Có quy tắc cho các log hệ thống (apt, rsyslog, ufw, unattended-upgrades…). **Không có quy tắc OTTIMO**, và không cần: log app nằm trong driver `local`, còn `state/*.log` chỉ vài KB (production 264 KB cả thư mục). `deploy-logs` tự giữ 30 tệp (hiện 12) | Đạt. **Không được** thêm logrotate cho `state/privacy-notice.log`: đây là bằng chứng, `deploy-landing.sh` đọc nó để so byte, và nó có trong bản sao lưu |
| `/var/log` | 429 MB (gồm journal) | Đạt |

## 7. Hệ điều hành và bảo mật cơ bản (chỉ ghi nhận)

`unattended-upgrades` bật (danh sách gói + nâng cấp hằng ngày), không tự khởi động lại. Còn 9 gói chờ, 0 gói bảo mật. Không cần khởi động lại. NTP đồng bộ, múi giờ `Asia/Ho_Chi_Minh`. ufw bật, chỉ mở 22/80/443. sshd tắt đăng nhập bằng mật khẩu và đăng nhập root. fail2ban không chạy (không cần vì sshd không nhận mật khẩu). Docker 29.9.2, compose 5.6.1. Có `qemu-guest-agent`, chưa rõ nhà cung cấp có bật snapshot tự động hay không (xem mục 11).

## 8. Lỗ hổng vận hành theo mức

### Cao

| ID | Vấn đề | Bằng chứng | Ảnh hưởng | Làm ngay | v1.0.5 |
|---|---|---|---|---|---|
| OR-H1 | **Bản sao lưu ngoài máy cũ 7 ngày**, và không có gì cảnh báo việc này | Lần kéo cuối 30/10 16:11 (+07). Mac có bản mới nhất `db-20261030T090820Z` | Mất VPS (hỏng đĩa, hãng khóa tài khoản, bị chiếm quyền rồi xóa) = mất 7 ngày dữ liệu thật. Bản trên VPS chỉ chống lỗi logic, không chống mất máy (SR-BAK-04) | INV hoặc ORC chạy `pull-backups.sh` hôm nay (README 12, cần rsync 3 hoặc container alpine), kiểm `.sha256` | (1) Tự động kéo hằng ngày trên máy INV (launchd, chạy cả khi máy thức dậy) và ping một check Healthchecks riêng `ottimo-offsite` (chu kỳ 1 ngày, grace 1 ngày): quá 48 giờ không kéo thì có email. Không tốn tiền. (2) Hoặc làm đúng PA2 của ESC-002 (VPS phụ ở Việt Nam tự kéo về). Có chi phí nên phải có ESC trước, chưa đề xuất ở lượt này |

### Trung bình

| ID | Vấn đề | Bằng chứng | Ảnh hưởng | v1.0.5 / việc |
|---|---|---|---|---|
| OR-M1 | Diễn tập khôi phục quá hạn: Round 4 chưa có lần nào. Lần cuối 29/10 trên DB 65 migration. Biên bản chưa vào repo | Mục 4. QC D-T3 | Chưa chứng minh bản sao lưu của DB 72 migration (trigger chỉ ghi thêm, bảng mới) khôi phục được, và api `sha-6414be25f20d` chạy được trên DB khôi phục | Diễn tập với bản sau LP-v2 + image `sha-6414be25f20d` (INV mở khóa, khoảng 30 phút, `restore-drill.sh` qua runner như 29/10). Dán dòng kết quả (chỉ số đếm) vào `v1-production.md` mục 22 và README 12. v1.0.5: `ops-check drill` đọc `state/restore-drill.last` (chỉ ngày, ORC ghi sau mỗi lần diễn tập), quá 35 ngày thì FAIL |
| OR-M2 | Không có WAL/PITR. RPO thật là 24 giờ, trong khi `hosting-plan.md` ghi "≤ 15 phút (WAL) – R3" | `archive_mode = off` | Sự cố DB lúc 02:59 mất gần trọn một ngày nhập liệu. Nhân viên phải nhập lại từ OTA, Zalo, giấy | ARC chọn: (a) thêm lượt dump 14:00 (+07), rất rẻ (~1 MB/lượt, 3–4 giây), RPO còn 12 giờ; (b) WAL archive mã hóa `age` + kéo về, RPO ~15 phút, nhưng phức tạp và phải diễn tập lại. Dù chọn gì cũng sửa `hosting-plan.md` cho đúng thực tế. OPS đề xuất (a) ở v1.0.5, (b) khi có máy phụ |
| OR-M3 | Log ứng dụng mất khi container được dựng lại (mỗi lần deploy). Không có bản lưu 90 ngày như `hosting-plan.md` (SEC T16) | Mục 6: log hiện chỉ có từ 07:10–09:35Z hôm nay | Sự cố cần đối chiếu log trước một lượt deploy (ví dụ "đêm qua form lỗi") thì không còn log. `http5xx`/`pricelimit` đếm lại từ 0 sau deploy | Trước khi dựng lại container, `deploy.sh`/`deploy-landing.sh` lưu `docker logs --since 48h` của container cũ (đã che theo SR-LOG) vào `/var/log/ottimo/<stack>/<service>-<giờ>.log.gz` (0640), kèm logrotate `maxage 90`. Hoặc đổi driver sang `journald`. ARC + SEC chọn (SR-LOG-01…04) |
| OR-M4 | Chưa từng diễn tập dựng lại cả VPS. RTO ≤ 4 giờ chưa được đo. Chưa xác nhận lại bản ngoại tuyến `data_kek_current` và khóa `age` production | Mục 4 | Mất VPS mà thiếu KEK thì ảnh giấy tờ khách không giải mã được. Thiếu `.env` thì phải dựng lại từng khóa | v1.0.5: viết runbook "VPS mới" một trang (thứ tự: bootstrap, secrets từ bản ngoại tuyến, `.env` từ mẫu, restore, edge, DNS) và diễn tập trên VPS dùng một lần. Thuê theo giờ, chi phí nhỏ nhưng vẫn là tiền, nên cần ESC khi làm. INV xác nhận có/không (mục 11) |

### Thấp

| ID | Vấn đề | Bằng chứng | Đề xuất |
|---|---|---|---|
| OR-L1 | `.env` production có hai dòng `ALERT_WEBHOOK_URL` và hai dòng `HEARTBEAT_URL`: dòng mẫu rỗng ở trên, dòng có giá trị ở cuối. `envval` lấy dòng cuối nên chạy đúng | Đếm tên khóa trùng (không đọc giá trị) | Khi sửa `.env` lần tới (khuôn E2), bỏ hai dòng rỗng. v1.0.5: `ops-check` báo tên khóa trùng (chỉ tên) |
| OR-L2 | `fwupd.service`, `fwupd-refresh.service` hỏng, làm nhiễu `systemctl --failed` (một đường cảnh báo của README 7) | Mục 2 | `systemctl mask fwupd.service fwupd-refresh.service fwupd-refresh.timer` (root, một lần) |
| OR-L3 | Staging `state/privacy-notice.log` thuộc `root:root 0644`, vì lần đăng 06/11 chạy bằng root và tạo tệp. Nếu sau này chạy công cụ bằng `ottimo`, giao dịch DB xong rồi mới hỏng ở bước ghi log. Khi đó `deploy-landing.sh` không thấy dòng `apply` và không chặn được "cùng nhãn khác byte" | `stat` | README 12.3 đã ghi "staging luôn chạy bằng root". v1.0.5 đề xuất (d)(e) ở README 12.3 "Staging landing lần đầu". Sửa tay một lần (cần SEC đồng ý): `chown ottimo:ottimo` tệp này |
| OR-L4 | Khóa người `ottimo-ops` vào thẳng user deploy `ottimo` (nhóm `docker`, tương đương root) mà không qua `sudo`. Đúng thiết kế `bootstrap-vps.sh --deploy-key`, nhưng thừa vì đã có `ottimo-admin`. 14 ngày qua không dùng (nhật ký sshd chỉ thấy khóa CI và khóa kéo sao lưu) | Phân loại 4 khóa trong `authorized_keys` của `ottimo` | SEC xét gỡ dòng này. Chỉ còn khóa CI và khóa kéo, cả hai có forced command |
| OR-L5 | Deploy landing staging bằng `ottimo` (CI) bỏ qua kiểm CSP/HSTS của trang thật, vì mật khẩu xem trước là `root 0400` (phản hồi 401 không mang header của trang) | `deploy-landing.sh` smoke | Gộp vào BUG-R4-054 v1.0.5: khi `LANDING_PREVIEW_FORM_OPEN` bật thì kiểm header trên route công khai. Hoặc SEC cho `root:ottimo 0440` |
| OR-L6 | Không có lịch dọn image cũ (1,49 GB thu hồi được) | Mục 6 | v1.0.5: sau lượt deploy thành công, `deploy.sh` giữ 3 tag mới nhất mỗi repo, luôn giữ `previous_tag`/`landing_previous_tag`. Chưa gấp, đĩa còn 43 GB |
| OR-L7 | Cảnh báo chỉ tới một người: phòng Chat "Báo động" chỉ có INV, email Healthchecks/UptimeRobot vào hộp thư chung. Không có người thứ hai, đêm không có báo đẩy | decision-log 30/10, ESC-029 A | Không tốn tiền: INV thêm MGR hoặc FDL vào phòng "Báo động" (tin không có dữ liệu khách), hoặc thêm email thứ hai ở Healthchecks. INV tự quyết |

Không phải lỗ hổng: lịch kiểm, đường cảnh báo, chứng chỉ, đĩa, giới hạn log, journald, cập nhật bảo mật tự động, tường lửa, sshd.

## 9. Dữ liệu thử còn trên staging (giữ nguyên, không xóa)

Đọc 06/11 18:40 (+07), SQL chỉ đọc. Staging được giữ làm môi trường thử, nên OPS **không xóa gì**. Danh sách để ORC/QA biết mà dọn khi cần:

| Loại | Còn lại | Ghi chú |
|---|---|---|
| Yêu cầu web | **8 yêu cầu "QA S6 …"**, tạo 06/11, trạng thái `new`: en 4, vi 1, ko 1, zh 1, ru 1. 7 yêu cầu gắn cờ `room_type_unmatched` (gửi trước khi sửa BUG-R4-055), 1 có `price_estimate`. Ngoài ra không có yêu cầu web nào từ 01/11 | Tên giả của QA. Không đọc SĐT hay email. Xóa theo WR8 trên Desk staging nếu muốn hộp "Yêu cầu website" sạch cho lượt thử sau |
| Công tắc đã bật | `public_booking_requests_enabled = true` và `public_show_prices = true` (06/11 15:55, `qa.owner`, lý do "LP-v2 staging S6 (QA C8)") | Giữ nếu QA còn thử form hoặc giá. Tắt thì `priceswitch` staging FAIL một lượt, đúng ý |
| Tham số | `weekend_uplift_pct = 0` từ 06/11 ("Mirror production 06/11 (LP-v2 F2)"; dòng 15 từ 01/10 vẫn còn, dòng mới thắng theo ngày hiệu lực). `hold_hours_options = [1, 12, 24, 48]` từ 05/11, đã có dòng trả về `[12, 24, 48]` hiệu lực 07/11 (QA v1.0.4). `privacy_notice_version` (H05) = `privacy-2026-10-v2` từ 05/11 (QA v1.0.4). `long_stay_required_from_nights` = 28 ở cả staging và production | Bảng tham số giá chính đang giống production |
| Nhãn hạng căn | 10/11 căn có nhãn, 4 hạng. `QAT1` không nhãn | ORC/OWN thử gán khi sửa BUG-R4-055 |
| Thông báo dữ liệu | `privacy_notice_version` `2026-11-04` × 5 ngôn ngữ, đang hiệu lực (S4, 06/11) | Bảng chỉ ghi thêm, **không xóa được và không được xóa** (README 13.7) |
| `.env` staging | `LANDING_PUBLIC_API=on`, `LANDING_LOCALES=en,vi,ko,zh,ru`, `LANDING_BASE_URL=https://staging.ottimo.vn`. `INCLUDE_TEST_SUPPORT=0`, nhưng `TEST_SUPPORT_ALLOW_IPS` vẫn còn giá trị cũ (không có tác dụng khi `INCLUDE_TEST_SUPPORT=0`) | Có thể làm rỗng `TEST_SUPPORT_ALLOW_IPS` ở lần sửa `.env` tới |
| `state/` staging | `landing_previous_tag` = `sha-72f9ac8e2b33` (ghi tay ở S7). `privacy-notice.log` thuộc root (OR-L3). 4 bản `env.before-lp-v2.*` (06/11) + `env.before-edge.*` + `env.before-mfa.*`, đều `ottimo 0600` | Bản sao `.env` cũ: chỉ cần giữ bản mới nhất (như quy tắc SEC PR23-05 ở 13.4) |
| Bộ đếm | `rate_limit_counter` 12 dòng (bộ đếm form theo IP, tự hết hạn) | Không cần làm gì |
| Production | 1 yêu cầu web từ 06/11 09:34Z, là yêu cầu thử K6 "TEST OTTIMO" đã xóa theo WR8 (`us155-smoke-counts` 14/14) | Đúng thiết kế, không còn dữ liệu thử |

## 10. Đề xuất v1.0.5 (gom; OPS làm, ARC + SEC review)

1. Kéo bản sao lưu tự động + Healthchecks `ottimo-offsite` (OR-H1).
2. Lượt dump 14:00 và sửa `hosting-plan.md` cho đúng RPO thật (OR-M2, ARC quyết).
3. Giữ log container cũ khi deploy + logrotate 90 ngày, hoặc driver `journald` (OR-M3, ARC + SEC).
4. `ops-check drill` (hạn diễn tập 35 ngày) và runbook "VPS mới" (OR-M1, OR-M4).
5. `ops-check` báo khóa `.env` trùng; mask `fwupd` (OR-L1, OR-L2).
6. Landing staging tự xử lý các bước dựng lần đầu: README 12.3 "Staging landing lần đầu", đề xuất (a)–(h), gồm `privacy-notice.log` đúng chủ (OR-L3).
7. BUG-R4-054: `rounds/round-04/outputs/OPS/bug-r4-054-proposal.md` (gồm OR-L5).
8. Dọn image theo số tag (OR-L6).

## 11. Việc cần INV

1. **Hôm nay:** kéo bản sao lưu production về máy (OR-H1). Lệnh ở README `infra/server` mục 12, dòng "Bản sao lưu ngoài máy". Máy OPS này có sẵn khóa kéo, nên ORC chạy thay được nếu INV đồng ý. Kiểm: thư mục đích có `db-20261106T070832Z.dump.age` và `.sha256` khớp.
2. **Trong Round 4 (trước round sau):** hẹn 30 phút để INV mở khóa `age` production cho buổi diễn tập khôi phục (OR-M1).
3. **Xác nhận có/không** (không gửi giá trị): (a) snapshot hoặc backup tự động của nhà cung cấp VPS đang tắt, hoặc giữ ≤ 7 ngày (SR-BAK-03); (b) bản ngoại tuyến `data_kek_current` và khóa giải mã `age` production vẫn còn và INV mở được (OR-M4).
4. Tùy chọn, không tốn tiền: thêm người thứ hai nhận cảnh báo (OR-L7).

Không có ESC mới. Hai việc có chi phí (máy phụ PA2 ở OR-H1, VPS dùng một lần ở OR-M4) chỉ được nêu làm hướng, chưa đề xuất. Khi đội muốn làm thì lập ESC trước.

## 12. Dòng decision-log đề nghị (ORC ghi khi commit)

`| 2026-11-06 | 4 | OPS – kiểm sẵn sàng vận hành sau LP-v2 (chỉ đọc; rounds/round-04/outputs/OPS/ops-readiness-06-11.md): timer ops-check/backup chạy đúng (16/16 ok 18:20), cảnh báo journal + Google Chat + Healthchecks + UptimeRobot, chứng chỉ ≥ 74 ngày, đĩa 18 %, log có giới hạn. Lỗ hổng: cao OR-H1 bản sao ngoài máy cũ 7 ngày (kéo cuối 30/10); trung OR-M1 diễn tập khôi phục R4 chưa có (lần cuối 29/10, 65 migration), OR-M2 không WAL (RPO 24 giờ ≠ hosting-plan), OR-M3 log mất khi dựng lại container, OR-M4 chưa diễn tập dựng lại VPS; 7 thấp. Đề xuất v1.0.5 mục 10; INV: kéo bản sao lưu hôm nay, hẹn diễn tập, xác nhận snapshot hãng + KEK ngoại tuyến | OPS | Quyền OPS (vận hành) |`
