# BE – phản hồi thẻ Round 2

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-SEC-BE-01 | Done | `config.ts` `parseTrustProxy`: mọi môi trường từ chối tiền tố < /8 (IPv4), < /16 (IPv6) (gồm `0.0.0.0/0`, `::/0`, `0.0.0.0/1`); staging/production chỉ nhận dải nằm trọn trong loopback, RFC 1918, `fc00::/7`. Test: `test/config.test.ts` (đủ các ca SEC nêu: `8.8.8.8` staging → lỗi; `172.18.0.2`, `172.18.0.0/16`, `127.0.0.1` → nhận). Kết quả: `rounds/round-02/outputs/BE/d0-foundation.md` |
| FB-R2-SEC-BE-02 | Done | Staging/production thiếu hoặc `TRUST_PROXY=false` → `ConfigError("TRUST_PROXY is required when APP_ENV=…")`. Fixture test staging/production đặt `TRUST_PROXY=172.18.0.2`. OPS cần ghi chú "bắt buộc ở staging/production" trong `.env.example` và đặt giá trị trong compose staging |
