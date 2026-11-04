# FE review – v1.0.4 PR #88: chữ dự phòng `rooms.night_auto` ở hi-fi và content guide

- **Người review:** FE-A.
- **Bước:** Round 4, đợt v1.0.4, bước **Review** (review chéo nhanh). Ngày 05/11/2026.
- **Đối tượng:** `git diff origin/main...origin/v104/uxd-night-auto-docs` @ `d804f6b2`.
  - Base là `main` @ `194da502`. Base này đã có #87 (`e2d616f8`, merge `c9b64e4c`).
  - PR có 1 commit, đổi 2 tệp:
    - `product/design/hifi/04-rooms.html`, 2 dòng:
      - chữ dự phòng của `<span data-i18n="rooms.night_auto">`;
      - đoạn đặc tả "Giá tháng và giá đêm" trong `<aside class="spec">`.
    - `product/design/content-guide.md`, 3 dòng:
      - ghi chú phiên bản v0.4.6 ở đầu tệp;
      - dòng `rooms.night_auto` ở mục 8;
      - dòng lịch sử 0.4.6.
- **Cách kiểm:** dùng script so từng ký tự với `strings-vi.json`, `strings-en.json` và `tools/strings-tables.md` của `origin/main`. Không chạy test, vì PR không có mã.

## Kết luận: **ĐẠT**

Không có thẻ feedback, không có ESC.

| Điểm ORC hỏi | Kết quả |
|---|---|
| 1. Chữ khớp `strings-vi/en.json` trên `main` từng ký tự | **Khớp.** |
| 2. Khóa `data-i18n` trên phần tử hi-fi đúng | **Đúng.** |
| 3. Không chạm mã hay tệp chuỗi khác | **Đúng.** |

**Chi tiết điểm 1:**
- Hi-fi: chữ trong `<span class="help" id="r-n-h" data-i18n="rooms.night_auto">` bằng đúng `strings-vi.json` `rooms.night_auto`, 98/98 ký tự.
- Content guide mục 8:
  - ô VI và ô EN của dòng `rooms.night_auto` bằng đúng `strings-vi.json` và `strings-en.json`;
  - 4 ô đầu của dòng trùng dòng tương ứng trong `strings-tables.md`;
  - ô RU giữ `⟨chừa chỗ⟩`, vì `strings-ru.json` không có khóa này.
- Dòng lịch sử 0.4.6 chép đúng nguyên văn cả hai câu VI và EN.
- Không có ký tự lạ: không NBSP, không zero-width, không gạch không ngắt, không ký tự điều khiển.

**Chi tiết điểm 2:**
- Trong hi-fi, `rooms.night_auto` gắn trên đúng một phần tử: `span.help#r-n-h`.
- Ô giá đêm `#r-n` vẫn trỏ `aria-describedby="r-n-h r-n-w"`, nên câu này vẫn là mô tả của ô.
- Không phần tử nào khác mang câu này với một khóa khác.
- Trang nạp `../wireframes/assets/strings.js` (đã sinh lại trong #87). Khi có JS, chữ hiển thị lấy từ khóa; chữ dự phòng chỉ hiện khi không có JS. Hai nguồn nay trùng nhau.

**Chi tiết điểm 3:**
- Diff chỉ có 2 tệp tài liệu nói trên.
- Không chạm `gen_strings.py`, `copy/strings-*.json`, `strings.js`, `strings-tables.md`, cũng không chạm mã ứng dụng.
- `bk.src_weekend` và các khóa khác để sang v1.0.5 vẫn nguyên.

**Ghi nhận khác (không phải thẻ):**
- Trong PR, câu cũ ("Đêm ngày thường…", "do lịch giá cộng thêm") chỉ còn ở dòng lịch sử 0.4.6, và chỉ để ghi lại thay đổi. Hi-fi và mục 8 không còn câu cũ.
- Cột ghi chú (cột 5) của dòng `rooms.night_auto` ở mục 8 vẫn là ghi chú R3, giống ghi chú trong `gen_strings.py`. #87 chỉ đổi giá trị VI/EN, nên hai nguồn vẫn khớp nhau.
- Đoạn đặc tả trong `aside.spec` (mức tăng do Tham số quy tắc đặt, mặc định 0 từ ESC-045) khớp với chữ mới và với cách Desk hiển thị (`RoomDrawer.tsx`, `help={t('rooms.night_auto')}`).

## Dòng đề nghị ghi vào `01-decisions/decision-log.md` (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | FE review chéo PR #88 `v104/uxd-night-auto-docs` @ `d804f6b2` (chỉ tài liệu UXD): **ĐẠT**, không thẻ. Chữ dự phòng `rooms.night_auto` ở `hifi/04-rooms.html` và dòng mục 8 của `content-guide.md` khớp từng ký tự với `strings-vi/en.json` trên `main` (sau #87). Khóa `data-i18n` đúng phần tử `#r-n-h`. Không chạm mã hay tệp chuỗi sinh tự động | FE-A | Kiểm bằng script so ký tự trên `origin/main` @ `194da502`; diff chỉ 2 tệp tài liệu |
