# SEC – Báo cáo Round 3, Bước 2 Sản xuất (chuẩn bị Sprint 1)

- Ngày: 22/10/2026 | HEAD `ca369cd` | Chi tiết: `rounds/round-03/outputs/SEC/s1-security-requirements.md`
- Ghi chú: ORC ghi file này thay SEC (công cụ chặn subagent ghi `report.md`; INV cho phép 23/10).

## Đã làm gì
1. **SR-AUTH-06 chi tiết cho US-143 / US-164** theo ESC-027 B (mục A, 06.1–06.35): TOTP duy nhất, cờ `mfa_enforced` + phiên chỉ-đăng-ký; mã khôi phục 10 × ≥ 80 bit, dùng một lần nguyên tử, email khi dùng; `mfaToken` 5 phút một lần; TOTP ±1 bước, chống phát lại; sai TOTP tính vào khóa đăng nhập; step-up hai mức (S1 giữ như cũ, S2 = mật khẩu + TOTP cho từng thao tác nhạy cảm); US-164 theo ESC-024 B (nhánh hết hạn chỉ ghi số server tính); khôi phục kỹ thuật chỉ ghi yêu cầu, thủ tục để ngoài repo; 16 ca test bắt buộc.
2. **Điều kiện Verified cho 6 thẻ** BE-65 (kiểm lại), BE-74, BE-75, BE-79, BE-83 (+ ESC-026 A), BE-84 (a): điều kiện chung B.0 (commit đã gộp, worktree sạch, DB mới, kiểm lại trên RC) và ca bắt buộc từng thẻ; thêm R3-Q15.
3. **R3-Q51** (mục C): chỉ OWN, che số ở mọi đường đọc, không điền sẵn/không lưu ở client, nhập hai lần, S2, hiệu lực từ ngày mai, audit che số + email OWN, INV tự nhập tài khoản thật trên staging.
4. **BUG-R2-208** (mục D): giữ 5 điều kiện ở `s4-SEC.md` F, cập nhật: 207 đã Closed; 208 sau 210 Verified; review trên head SHA của PR; 208 không phụ thuộc BE-83 để gộp nhưng lượt kiểm tiền cần cả hai.
5. **R3-Q31** (mục E): đọc `dependabot/alerts` bằng `gh api` (chỉ đọc). 3 cảnh báo mở (esbuild, react-router ×2), cả 3 **Low** theo cách dùng thực tế; **không cái nào phải nâng phụ thuộc trong Sprint 1**; Sprint 1 chỉ thêm test chặn chuyển hướng ngoài cho `useAfterLoginPath`; nâng react-router v7 cùng S4-16 trước bản dùng thử; phân loại 6 PR Dependabot phiên bản. Không cần Security Advisory nháp.
6. Cập nhật SR-AUTH-06 trong `product/docs/security/security-requirements.md` (trỏ tới mục A) và lịch sử thay đổi.

## File tạo/sửa
- Tạo: `rounds/round-03/outputs/SEC/s1-security-requirements.md`, `rounds/round-03/outputs/SEC/report.md`
- Sửa: `product/docs/security/security-requirements.md` (dòng SR-AUTH-06, mục 22), `01-decisions/decision-log.md` (1 dòng SEC)

## Giả định
- Cờ `mfa_enforced` là cấu hình triển khai (không phải màn Tham số); bật trên staging trước cổng dữ liệu thật.
- Mã khôi phục băm SHA-256 là đủ vì entropy ≥ 80 bit (không cần argon2).
- R3-Q51: `manager` không cần xem màn tài khoản nhận (ORC/PO có thể phản biện; khi đó chỉ cho MGR xem bản che, không sửa).
- Hạn xem lại cảnh báo esbuild: 22/01/2027.

## Rủi ro / vướng mắc
- OpenAPI có `IdempotencyKey` trên `startMy2faSetup` → thân phản hồi chứa bí mật TOTP có thể bị lưu vào `idempotency_key` (trái SR-C3-02). ARC phải sửa trước khi BE code (06.9). → **Đã sửa ở 0.3.8-draft (ARC 22/10).**
- Định dạng che số tài khoản `<4 số BIN>••••1234` giống số thẻ – Suggestion đổi sang tên ngân hàng + `•••• 1234` (ARC đã áp ở 0.3.8-draft).
- Thủ tục khôi phục kỹ thuật (06.33) cần OPS viết và diễn tập trên staging trước dữ liệu thật; nếu trễ thì US-143 không Verified.

## Việc chưa xong
- Review PR US-143, US-164, R3-Q51, 208 khi có; Verified 6 thẻ theo B.0; kiểm tra bảo mật tổng (Sprint 4); đọc `Set-Cookie` lúc PO nghiệm thu (E.13).
- ORC/OPS: đóng cảnh báo Dependabot #1 (SEC không tự đổi trạng thái).

## ESC mới
- Không có.
