# ARC review mã – P4-16 `v104/be-notice-allowlist` (BE-C)

- Round 4 (v1.0.4), bước Review mã (ma trận BE → ARC), 04/11/2026
- Commit `2975bc97`, nền `7224e8fd` (main@L, PR #34). Diff 5 tệp, +451.
- Căn cứ: thiết kế ARC "v1.0.4 notice-version allowlist" (mục 2, 3, 4.1); điều kiện SEC P416-01..03.

## Phán quyết: **ĐẠT**

## 1. Đúng thiết kế
| Mục | Kết quả |
|---|---|
| 2.1 `platform/public/notice-versions.ts` = `['privacy-2026-10-v2']` | Đúng, thêm `Object.freeze` (SEC P416-03); chú thích lý do không có v1 và chỉ một version tới khi 09(b) xong |
| 2.1 `case 'privacy_notice_version'` cạnh `property_map_url`, khớp từng ký tự | Đúng; không `trim`, không đổi hoa/thường; dùng `outOfRange({allowed})` |
| 2.1 (3) không sửa `parameters.service.ts`, `parameter.service.ts`, migration, catalogue | Đúng |
| 2.2 thứ tự kiểm | Đúng, có test (I5 403 trước 422; `VALIDATION_FAILED`; I7 ngày sau; I4) |
| 2.2 từ chối: không dòng, không audit, không `pg_notify` | I1 (LISTEN `config_changed`), I2 |
| 2.3 không nhận v1 | U2, I2, I7 |
| Cắt từ `main@L` | Nền `7224e8fd` |

## 2. Ranh giới module
`internal/parameter-rules.ts` → `../public/notice-versions` cùng module, đúng mẫu; `notice-versions.ts` không import gì; `module-boundaries.test.ts` qua; đặt ở `public/` để `registration` có thể đọc sau này.

## 3. Hợp đồng `openapi.yaml`
Đoạn 0.3.12 (SEC-BA-104-09 a) trong `setParameter` khớp mục 4.1 (608/608 ký tự sau chuẩn hóa khoảng trắng); YAML parse được; không đổi schema; `gen-openapi-meta --check` up to date trên cây P4-16 và PR #35 + P4-16.

## 4. merge-tree với PR #35 (`v104/arc-contract` @ `15718861`)
Sạch theo mọi thứ tự (arc-contract × P4-16; main+#35 rồi P4-16; main+P4-16 rồi #35) – cùng cây `69cdc156`, chỉ một bản đoạn 0.3.12, generator up to date.

## 5. Test
- Unit: U1–U5 (+ khoảng trắng đầu, `undefined`, object), không lặp giá trị đã gửi; G1 literal-only + `resolve(__dirname)`; G2 không trùng; G3 đúng 1 version; frozen.
- Integration: I1 (notify, biến thể), sai kiểu `VALIDATION_FAILED`, I2, I7, I5, I3 (audit `config`, v1 → v2, cả Desk và trang khách đọc v2, đúng 1 notify), I3b (đồng ý v1 → 422 `NOT_IN_LIST`, v2 → 201), I4, I6.
- ARC chạy lại trên main + P4-42 (`80c35dcc`) + P4-16, PostgreSQL 17 thật: 20/20; cùng `platform`, `platform-catalog`, `registration-flow`, `guest-portal`, `module-boundaries`: 87/87; eslint/prettier sạch.
- G1 đỏ khi chỉ có main (guest-web `[v1]`) – dự kiến; thứ tự gộp P4-42 → P4-16.
- Hồi quy: test dùng `privacy-2026-10-v1` chỉ đọc mặc định catalogue hoặc chèn SQL test, không gọi `setParameter` – không ảnh hưởng.

## 6. Thẻ

### FB-R4-ARC-BE-C-P416-01
- Mức độ: Suggestion
- Vị trí: `test/integration/v104-notice-allowlist.test.ts`, `notifiesNow` (chờ cố định 300 ms)
- Vấn đề: I3 khẳng định +1 notify sau 300 ms – có thể chập chờn trên runner chậm.
- Đề xuất: thăm dò tới khi đủ (≤ ~2 s, `vi.waitFor`); ca "không notify" giữ khoảng chờ. Có thể sau v1.0.4.
- Trạng thái: Open

### FB-R4-ARC-BE-C-P416-02
- Mức độ: Suggestion
- Vị trí: cùng tệp, `describe(... '(I1–I6)')`, chú thích đầu tệp unit
- Vấn đề: đã có I7 và ca đồng ý tại quầy nhưng nhãn vẫn I1–I6.
- Đề xuất: "I1–I7 + consent". Không chặn.
- Trạng thái: Open

### FB-R4-ARC-ARC-P416-03 (ARC tự nhận)
- Mức độ: Minor
- Vị trí: `openapi.yaml` mục "Thay đổi phiên bản 0.3.12-draft" (PR #35, dòng 306–331, ý (a)–(i))
- Vấn đề: changelog 0.3.12 chưa có ý cho SEC-BA-104-09(a); nhãn (i) đã dùng cho PR24PM-01.
- Đề xuất: thêm ý **(j)** "`setParameter` `privacy_notice_version`: danh sách version cho phép (SEC-BA-104-09 a), chỉ mô tả, chữ nằm ở gói P4-16". Không thêm lại đoạn văn ở `setParameter`. Sửa ghi chú thiết kế "ý (i)" → "ý (j)". **ORC 04/11:** không đổi đầu PR #35 đã được SEC duyệt; ý (j) do BE-C thêm khi rebase P4-16 lên main sau khi PR #35 đã gộp.
- Trạng thái: Open

## 7. Điểm làm tốt
Thay đổi hẹp (9 dòng logic), quay lui an toàn; G1 chống xanh giả; tự đưa điều kiện SEC vào ngay vòng đầu, kiểm cả hai chiều Desk ↔ trang khách.
