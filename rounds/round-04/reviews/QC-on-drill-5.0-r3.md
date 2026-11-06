# QC – Quyết định "5.0 ĐẠT ghép" (v1.0.4 r3, staging) – 05/11/2026

Round 4 – Bước QC. Nguồn: `outputs/OPS/v1.0.4-staging-drill.md` (mục 3, 5.4, 5.5, 5.x), `reviews/ARC-on-s16-release-path.md`, `ARC-on-pr91.md`, `SEC-on-pr91.md`, `SEC-on-ru-notice-locale-drill.md`.

## 0. Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

5.0 ĐẠT ghép = S1–S15 trên CUT_R2 (`sha-0d11db201343`, lùi về `sha-da6d6f3dc22b` và lên lại) + S0'/C1–C7, C9 + S16' = RG-35 trên r3 `sha-6414be25f20d` (`SHA_V104` `6414be25f20d…`, `CI_RUN` 41999716963). QC **không duyệt deploy production**; quyết định này chỉ cho phép đi tiếp tới cổng P0/Release khi đủ điều kiện ở mục 2.

## 1. Căn cứ

| Phần | Bằng chứng | QC |
|---|---|---|
| S1–S15 CUT_R2 | Mục 3: mọi ô đạt (lệch 4, 6, 7 đã ghi, không ảnh hưởng). Cơ chế lùi nằm ở gói infra, image v1.0.3 và DB 72 không đổi ở r3 (ARC đường A) nên giữ được | Đạt |
| A1'' | 5 tệp, `INFRA_TREE=afce70ad…`, `JOURNAL=72`, `DOCS_API=0`, `DB_DIR=0`, `OUT_OF_SCOPE=0` – đúng phạm vi ARC cho phép ghép | Đạt |
| SEC ĐK1 | CI `9216394f` xanh, hai tệp test BUG-R4-053 chạy thật (9 + 4 ca), gộp đúng head | Đạt |
| B2–B6 | Digest mới khác r2, duyệt **chỉ staging** | Đạt |
| S0' = C1 | `current=sha-6414be25f20d previous=sha-0d11db201343`, digest trùng B4, 72/72, worker trước api 16 giây, `true 0` ×3 | Đạt |
| C2–C7, C9 | 72 migration, 4 băm trùng 0.1, `db_triggers` ok, worker/email sạch, `ops-check` 16 ok EXIT 0, guest-web chỉ v2, 0 lỗi 5xx sau 108 phút | Đạt |
| S16' = RG-35 (SEC ĐK2/T4) | `consent_record …\|ru\|guest_app\|1`, `online_checkin …\|ru\|1`, không dòng `\|en\|` | Đạt – BUG-R4-053 đã khép trên staging |

## 2. Điều kiện còn lại trước production (chặn nếu chưa đủ)

| # | Điều kiện | Chủ | Hạn |
|---|---|---|---|
| ĐK-1 | **C8 = RG-01** `smoke-prod` staging trên r3: 0 ca đỏ (PS-06 bỏ qua được chấp nhận như r2) | QA | trước B7 production |
| ĐK-2 | **K11 (c)** chuỗi bundle r3: 33/33 v2 | QA | trước B7 |
| ĐK-3 | **S14 (2)(3)**: INV chạy lệnh D6 (terminal tương tác), ra đúng hai dòng `failed (…)` như 5.4 | INV (ORC nhắc) | trước N1 production; nếu chưa chạy thì ORC báo INV đây là việc của INV, không thay bằng bước khác |
| ĐK-4 | Các ca hẹn 06/11 (gồm chốt HD-23 `qa.sal` 404 thay 403 – ghi rõ là lệch chấp nhận hay lỗi, có PO/SEC ký) xong và ghi vào biên bản | QA + PO/SEC | 06/11 trước giờ production |
| ĐK-5 | SEC đóng FB-R4-SEC-BE-RU-NL-01 (đã đủ ĐK1 + ĐK2) và ORC điền ô "Kết quả" mục 5.5 | SEC, ORC | trước B7 |
| ĐK-6 | Production deploy đúng `sha-6414be25f20d` (cùng digest B4 r3); `0d11db20` không lên production. N1–N6 theo runbook, T1–T4/N6a/N6b không áp dụng vì đã đi đường A | ORC/OPS | ngày Release |

Bất kỳ ĐK-1, ĐK-2 nào đỏ: 5.0 chuyển KHÔNG ĐẠT, quay lại ARC/SEC. Mốc 06/11 10:15 (chuyển đường B) không còn cần vì S16' đã đạt.

## 3. Ghi chú QC

- Ghép kết quả hai bản cắt chỉ hợp lệ vì A1'' chứng minh r3 không đụng infra/migration/`docs/api`. Lần sau nếu bản sửa chạm các vùng đó thì phải chạy lại S1–S15.
- Thẻ v1.0.5 (changeLocale lỗi mạng; G-RU dựa đủ khóa RU) giữ ở backlog, không chặn v1.0.4.

ESC mới: không. S14 (2)(3) là việc INV đã biết từ D6, không phải quyết định mới.
