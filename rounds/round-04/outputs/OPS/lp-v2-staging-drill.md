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
| S6 | QA đang chạy: `rounds/round-04/qa/lp-v2-staging-s6.md` |
| S7–S8 | Làm sau S6 |
