# Biên bản staging LP-v2 – 06/11/2026 (ORC)

Đường phụ (runbook LP-v2 1.2): app và landing đều là image `sha-6414be25f20d` (v1.0.4, CI run 41999716963). Landing digest `6f224ed3…8a3d`. Nhãn thông báo `2026-11-04`.

| Bước | Kết quả |
|---|---|
| Chuẩn bị | Staging trước đó chưa từng có landing. INV thêm DNS `staging.ottimo.vn` và `www.staging.ottimo.vn` (A, TTL 300). ORC thêm vào `.env` staging (khuôn E2, sao lưu `state/env.before-lp-v2.*`, `ottimo 600`): `LANDING_HOST`, `LANDING_WWW_HOST`, `LANDING_IMAGE`, `LANDING_BASE_URL=https://staging.ottimo.vn`, `LANDING_PUBLIC_API=on`, `LANDING_LOCALES=en,vi`. Deploy lại app cùng tag: `OK: sha-6414be25f20d is live`, 72/72 migration |
| Edge | `edge.sh render` → `10 host(s) for 2 stack(s)`; `edge.sh up` (chạy bằng root, INV cho phép) 08:08:35Z `edge running`. Ngay sau đó: ottimo.vn, desk.ottimo.vn, g.ottimo.vn đều 200 |
| S0 | `on`; 72 migration; `privacy_notice_version` staging 0 dòng |
| S0b | `STG_WEBHOOK_SIZE=0` → đạt (Chat staging tắt), `RC` bỏ qua |
| S1 | Bỏ: gói infra staging đã là bản của `6414be25` (deploy in "infra bundle … v1.0.4 markers") |
| S2 | Bỏ: staging đã chạy `sha-6414be25f20d` |
| S3 | Lần 1 và 2: FAIL, vì chưa có chứng chỉ. Lần đầu, ACME chạy trước khi edge biết host mới; sau đó Caddy chờ thử lại. Khởi động lại container landing staging thì có chứng chỉ ngay. Lần 3, 08:49:37Z: `privacy: en/vi/ko/zh/ru 2026-11-04 (not published yet)`, `OK: landing sha-6414be25f20d is live on staging.ottimo.vn` |
| S4 | CHKV (`E=/opt/ottimo`, `RA=RL=6414be25`, `RUN=DOC`): `ROWS=0 NOTICE_V=CHAT_CONST=LANDING_VERSION=2026-11-04 RA_IMAGE=RUN_TAG=sha-6414be25f20d CONST_ROWS=0` → `D2_CHAT_CONST=CO`. Bước kiểm trang thật của `publish-privacy-notice.sh` trên staging cần mật khẩu xem trước (tệp chỉ root đọc được), nên chạy bằng `sudo OTTIMO_HOME=/opt/ottimo`. Chạy thử `DRY RUN OK`, rồi `--apply` 08:53:09Z: `OK: version 2026-11-04 published (en vi ko zh ru)`, operator `orc`, property DLT. 5 băm: en `f593b94ea33a`, vi `9d7bffa853fe`, ko `a9bccbb8341b`, zh `1ab9efad8c34`, ru `43e080ce6503` |
| S4 – so băm FE-B | **Không trùng** 5 mã FE-B (FE-B dựng bản thử slug `dl01`). ORC dựng lại trên Mac bằng đúng biến CI: en/vi/ko/zh trùng byte; ru chỉ khác dòng `<link>` của `fonts-ru.<hash>.css`, chữ không khác. Đang chờ SEC kết luận LPV2M-02 |
| S5 | `LANDING_LOCALES=en,vi,ko,zh,ru`: `LINES=1 VALUE_OK=1`; deploy lại cùng tag `OK … live` 08:53:50Z. form-token ban đầu 404 vì `public_booking_requests_enabled` mặc định false trên staging. ORC bật nó và `public_show_prices` bằng `qa.owner` (lý do "LP-v2 staging S6 (QA C8)") → form-token 200 |
| S6 | QA: `rounds/round-04/qa/lp-v2-staging-s6.md`. 0 ca đỏ; ca 6 (TRUST_PROXY, bộ đếm theo IP) đạt; form 5 ngôn ngữ 202. Ca giá chưa chạy được: staging thiếu `public_room_type` (BUG-R4-055). Production có đủ 10/10, 4 hạng |
| S7 | 09:28–09:29Z. Bản cũ chưa từng chạy trên staging, nên đi thẳng `deploy-landing.sh sha-72f9ac8e2b33` thì bị chặn đúng thiết kế (`FAIL: older privacy notice version …`). ORC ghi `state/landing_previous_tag` = `sha-72f9ac8e2b33`, giống trạng thái production. `--rollback` 09:28:50Z: `WARNING: older privacy notice … 7 days`, `OK: landing sha-72f9ac8e2b33 is live`; `/`, `/vi/`, `/privacy/` 200; form-token 200. Lên lại 09:29:02Z: `privacy: en…ru 2026-11-04 (same bytes as published)`, `OK: landing sha-6414be25f20d is live`. Đặt lại `LANDING_LOCALES=en,vi,ko,zh,ru` và deploy lại cùng tag: `OK` |
| S8 | `ops-check.sh` staging: tất cả `ok`, `rc=0` |

## Production 06/11 (INV: "Cho phép phát hành"; xác nhận P1 Chat không đổi từ 03/11, P3 phòng Chat chỉ 4 vai, P4 đã ghi lịch xóa)

| Bước | Kết quả |
|---|---|
| P0 | D1 (QC merge gate LP-v2, SEC 8.1): CO. D2/P5: CHKV 09:34:29Z `RA_IMAGE=RUN_TAG=sha-6414be25f20d CONST_ROWS=0 ROWS=2` → `CO`. D3/P2–P4: CO (`retention.web_request_ip_hmac_days` mặc định 30, tối đa 30; INV xác nhận P3/P4 trong chat). D4: làm liền P9→P10→F1→K5. D5: S6 0 đỏ. D6: `public_show_prices` chưa đặt (mặc định false), `priceswitch ok`. D7: vẫn mức A. P1: CO (INV) |
| P2 | `public_room_type` 10\|10\|4; `public_booking_requests_enabled=true` |
| P2b, P3–P7 | Bỏ: đường phụ 1.2. Gói infra production đã là `6414be25` (v1.0.4); sao lưu sáng 06/11 07:08Z |
| P8 | `--check-only` với digest từ artifact CI 41999716963 (`6f224ed3…`): `CHECK ONLY: sha-6414be25f20d passes …`. Tag `landing-v2.0.0` → `6414be25`, đã push |
| P9 | Release run 42195905653: `release landing-v2.0.0 → landing sha-6414be25f20d @sha256:6f224ed3…8a3d`; duyệt môi trường production; `landing sha-6414be25f20d: ok`. **Giờ P9: 09:34:14Z** |
| P10 | Chạy thử: 5 INSERT + đúng 2 dòng supersede `2026-10-24` (en, vi), `live: … 5 privacy page(s) = 200, same sha256`. `--apply`: `OK: version 2026-11-04 published (en vi ko zh ru)`, operator `orc`. **Giờ C: 09:34:48Z**. 5 băm trùng S4: en `f593b94ea33a`, vi `9d7bffa853fe`, ko `a9bccbb8341b`, zh `1ab9efad8c34`, ru `43e080ce6503` (SEC-on-lp-v2-s4-hashes: ĐẠT) |
| F1 | `LINES=1 VALUE_OK=1 ottimo 600`; REDEPLOY: `image digests match the release`, `72 applied / 72`, `OK: sha-6414be25f20d is live` 09:35:35Z. State: current `sha-6414be25f20d`, previous `sha-da6d6f3dc22b`, landing `sha-6414be25f20d`, landing_prev `sha-72f9ac8e2b33` |
| K3/K5 | `/`, `/vi/`, `/ko/`, `/zh/`, `/ru/` đều 200; `form_token=200 application/json`; desk 200 |
| K7 | `ops-check.sh` production: tất cả `ok` (gồm `pricelimit`, `pricegap`, `priceswitch`), `EXIT: 0` |
| K8 | 15 phút: `API_5XX=0 API_ERR=0 WORKER_ERR=0`; worker `detailLevel A` = 1, `C` = 0 |
| K6 | ORC gửi một yêu cầu "TEST OTTIMO" ở `/ko/` (kênh Email, hộp thư chung, lời nhắn "TEST"). Trang báo đã nhận, mã `ZW003PG9`. OWN đóng yêu cầu rồi bấm "Xóa theo yêu cầu người gửi" (WR8), và xóa tin Chat. Lượt đếm đầu ra FAIL 5/14, vì yêu cầu mới bị đóng, chưa xóa dữ liệu. Sau WR8: `us155-smoke-counts --ref REQ-ZW003PG9 --since 2026-11-06T09:34:14Z` → **`RESULT: OK – 14/14`** |
| F2 | Chờ. ORC gán `publicRoomType` cho 10 căn trên staging giống production (qa.owner, 200 × 10). So bảng giá: tham số giá giống nhau, giá niêm yết từng căn khác. Production **The Ember** có giá đêm `11000000` (cùng hạng The Ivory là `1100000`), nghi gõ dư một số 0. INV cần sửa trên Desk trước khi bật giá. Sau đó chép giá production sang staging, QA chạy 13 ca giá |

