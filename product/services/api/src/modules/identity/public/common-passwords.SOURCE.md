# common-passwords.txt – nguồn, giấy phép, cách tái lập (SR-AUTH-02)

Quyết định nguồn: `rounds/round-02/outputs/SEC/s1-decisions.md` mục 2. Tệp được nạp một lần khi khởi động
(`passwords.ts`); staging/production **dừng khởi động** nếu tệp thiếu hoặc < 10.000 dòng.

## Trạng thái hiện tại (16/10/2026 – BE-B)

| Mục | Giá trị |
|---|---|
| Số dòng | **9.684** (chỉ nguồn B) – **chưa đủ 10.000** → staging/production chưa khởi động được |
| SHA-256 | `bbabf8ee6ab3151db2efaaaf2347ed255765d9754fe1633de2c6c06874c1910c` |
| Nguồn A (SecLists) | **CHƯA NHẬP** – môi trường BE không được phép tự tải tệp từ Internet; cần người có quyền tải (xem dưới) |
| Nguồn B | danh sách tự soạn `common-password-bases.json` (từ gốc tiếng Việt/khách sạn/thương hiệu theo SEC + họ, tên phổ biến) × hậu tố năm 2020–2030, `123…`, `@123`, `!`… và ghép đôi từ gốc |

## Nguồn

| # | Nguồn | Giấy phép | Ghi chú |
|---|---|---|---|
| A | SecLists – `https://github.com/danielmiessler/SecLists`, thư mục `Passwords/Common-Credentials/` (tệp top 1.000.000 của bộ "10-million-password-list" và `100k-most-used-passwords-NCSC.txt`) | MIT (repo SecLists). Tệp NCSC có nguồn gốc Pwned Passwords – nếu có ghi chú CC BY 4.0 thì ghi công ở đây. **Kiểm lại giấy phép tại thời điểm tải** | Ghi commit hash + ngày tải vào bảng dưới khi nhập |
| B | Tự soạn (SEC + DOM + BE) | Nội bộ, không ràng buộc | `common-password-bases.json` |
| Không dùng | Pwned Passwords API trực tuyến; rockyou.txt và bản dump không giấy phép rõ | – | SR-AUTH-02 yêu cầu offline |

## Tái lập

```bash
# 1. Người có quyền tải (OPS/INV) lấy 2 tệp SecLists ở commit đã ghi, đặt vào thư mục tạm NGOÀI repo.
# 2. Từ product/services/api:
node scripts/build-common-passwords.mjs \
  --seclists /đường/dẫn/10-million-password-list-top-1000000.txt \
  --seclists /đường/dẫn/100k-most-used-passwords-NCSC.txt
# 3. Ghi số dòng + SHA-256 in ra vào bảng "Lần nhập" dưới; chạy pnpm --filter @ottimo/api test
#    (test/be-b-units.test.ts kiểm SHA-256 của tệp khớp dòng mới nhất của bảng này).
```

Chuẩn hóa (giống lúc kiểm): `NFKC` → chữ thường → bỏ khoảng trắng đầu/cuối; giữ độ dài 10–256; bỏ trùng;
sắp xếp theo code point; UTF-8 không BOM, mỗi dòng một mục.

## Lần nhập

| Ngày | Người | Nguồn A (commit SecLists) | Số dòng | SHA-256 |
|---|---|---|---|---|
| 16/10/2026 | BE-B | – (chưa nhập) | 9684 | bbabf8ee6ab3151db2efaaaf2347ed255765d9754fe1633de2c6c06874c1910c |
