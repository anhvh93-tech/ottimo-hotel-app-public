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
- [ ] PR sửa `product/services/api/src/shared/serialization/field-policy.ts` thì đã có review của **SEC** (`.github/CODEOWNERS`). Không sửa thì bỏ qua ô này.
- [ ] Chữ hướng khách/nhân viên theo brand OTTIMO: giọng ngắn, lịch sự, điềm tĩnh, không emoji; với khách EN dẫn, VI hỗ trợ.
- [ ] Migration mới (nếu có) đúng số đã giữ trong kế hoạch, chỉ nới hoặc thêm; journal và snapshot sinh lại, không sửa tay.
