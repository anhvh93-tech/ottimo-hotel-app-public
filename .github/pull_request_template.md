## Tóm tắt

<!-- 1–3 câu: thay đổi gì, vì sao. Round, bước, gói (ví dụ: Round 4 – v1.0.4 – Sản xuất – P4-03). -->

## Thẻ / lỗi được xử lý

<!-- FB-…, BUG-…, US-… -->

## Kiểm đã chạy

<!-- Lệnh + kết quả (số ca đạt / tổng). Ghi rõ phần chưa chạy được và vì sao. -->

## Danh sách kiểm trước khi mở PR

- [ ] Không ghi tỷ lệ/tiền hoa hồng, thưởng theo bảng nội bộ (trong mã, seed, fixtures, test, ví dụ API, mô tả PR, thông điệp commit, ảnh). Chỉ dùng tham số thử `test_rate_*` (SEC-on-commission-numbers G3, G4).
- [ ] Không có dữ liệu khách, email/số điện thoại thật, IP, khóa, mật khẩu hay token. Dữ liệu thử dùng `…@example.test`.
- [ ] Ảnh chụp (nếu có) đã qua kiểm che: dữ liệu khách, dòng hoa hồng/thưởng (G4).
- [ ] Chỉ sửa tệp thuộc gói của mình (bản đồ chủ tệp trong kế hoạch round). Tệp sinh ra không sửa tay (`gen_strings.py`, OpenAPI).
- [ ] PR sửa tệp có dòng SEC trong `.github/CODEOWNERS` thì đã có `rounds/<round>/reviews/SEC-on-*.md` nêu commit head đã review, kết luận ĐẠT / ĐẠT CÓ ĐK, Blocker/Major đã đóng. Ghi tên tệp review ở đây. Không sửa tệp nào như vậy thì bỏ qua ô này. (Ô này do người viết PR tự khai; ORC vẫn tự so `git diff --name-only` với CODEOWNERS trước khi gộp.)
- [ ] Migration mới có `DISABLE TRIGGER`, `GRANT`, `REVOKE`, `CREATE/ALTER/DROP/SET ROLE`, đụng RLS (`ROW LEVEL SECURITY`, `POLICY`) hoặc thêm hàm `SECURITY DEFINER` (viết hoa hay thường đều tính; dòng chú thích `--` không tính) thì cũng cần `SEC-on-*.md` như ô trên, dù thư mục migration không có dòng trong CODEOWNERS. Kiểm: `git diff <base>...<head> -- '**/migrations/*.sql' | grep -E '^\+' | grep -vE '^\+[[:space:]]*--' | grep -iE 'DISABLE TRIGGER|GRANT|REVOKE|ROW LEVEL SECURITY|POLICY|SECURITY DEFINER|(CREATE|ALTER|DROP|SET)[[:space:]]+ROLE'`. Không có kết quả thì bỏ qua ô này.
- [ ] Chữ hướng khách/nhân viên theo brand OTTIMO: giọng ngắn, lịch sự, điềm tĩnh, không emoji; với khách EN dẫn, VI hỗ trợ.
- [ ] Migration mới (nếu có) đúng số đã giữ trong kế hoạch, chỉ nới hoặc thêm; journal và snapshot sinh lại, không sửa tay.
