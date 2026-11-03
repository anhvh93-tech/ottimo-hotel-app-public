# UXD – Dựng lại HTML sổ tay (nguồn 1.9) + bộ hướng dẫn (nguồn 1.7) (QC v1.0.3 ĐK11a/b)

- Người làm: UXD | Round 4 – đợt v1.0.3 – bước **Sản xuất** | 03/11/2026
- Căn cứ: `rounds/round-04/qc/v1.0.3-gate.md` (S7, ĐK11); thẻ `FB-R4-UXD-FE-EM-09` (`rounds/round-04/reviews/UXD-on-v1.0.3-email-desk.md`); brand `00-brief/context/brand/brand-guidelines.md`.
- Tên tệp báo cáo giữ `manual-1.8-…` theo giao việc. Nội dung đã cập nhật cho lượt dựng thứ hai.

## 0. Các lượt dựng

| Lượt | Nguồn Markdown của BA (không sửa) | Ảnh kiểm | Kết quả |
|---|---|---|---|
| 1 | Sổ tay **1.8**, bộ hướng dẫn **1.6** @ `0d12cbc5` | `manual-1.8-check-1440.png`, `manual-1.8-check-390.png` | ĐẠT. Đã thay bằng lượt 2 |
| **2 (hiện hành)** | Sổ tay **1.9**, bộ hướng dẫn **1.7**. BA sửa theo DOM `FB-R4-DOM-BA-M18-01…07, 09` và ARC `FB-R4-ARC-BA-M18-01…05`. Chưa commit (bản trong thư mục làm việc, 8 tệp `.md` đổi so với `0d12cbc5`) | `manual-1.9-check-1440.png`, `manual-1.9-check-390.png` | **ĐẠT** |

Ở lượt 2, BA không thêm hay bớt mã ảnh nào (`[ẢNH: …]` không đổi). Ảnh vẫn là `product/docs/manual/img/` (6 ảnh mới @ `8a399f17`, đã qua QA kiểm che). Băm md5 các tệp `.md` trước và sau khi dựng giống nhau, tức là lệnh dựng không ghi gì vào Markdown.

## 1. Lệnh dựng lại (một lệnh)

Chạy từ gốc repo (lượt 2 dùng `--tag manual-1.9`):

```
python3 -I product/design/tools/rebuild_manual_html.py --out-dir rounds/round-04/outputs/UXD --tag manual-1.9
```

Lệnh chạy khoảng 1 phút. Cần Chrome (đường dẫn mặc định của macOS, hoặc biến `CHROME`). Chỉ dùng thư viện chuẩn Python. Lỗi thì thoát mã 1. Cuối log ghi `KẾT QUẢ: ĐẠT` hoặc danh sách lỗi. `--tag` chỉ đổi tên ảnh kiểm (`<tag>-check-1440.png`, `<tag>-check-390.png`). Nếu DOM sửa thêm và BA nâng bản, chạy lại lệnh với tag mới, ví dụ `manual-2.0`.

Lệnh gọi lần lượt các công cụ có sẵn từ Round 3, không viết lại công cụ nào:

1. `build_manual.py` → `product/docs/manual/ottimo-manual-v1.0.html`
2. `build_guides.py --check-dir <tạm>` → `product/docs/manual/guides/html/*.html`, đo tràn 390/1440 từng tệp, in thử A4 tệp `02`
3. `check_manual.py --out-dir <tạm>` → đo tràn sổ tay 390/1440
4. Soát:
   - mọi ảnh nhúng khớp từng byte với một tệp trong `img/`, không ảnh nào trỏ ra ngoài;
   - 6 mã `C0-06, G1-01, C1-07, C0-12, C0-13, C1-22` có ảnh thật, không phải khung trống;
   - "Bảo mật tài khoản" có trong sổ tay và tệp `01`;
   - không còn link mục bị cắt chữ cái.
5. Chụp `<tag>-check-1440.png` (sổ tay tại C0-06, mục 0.2) và `<tag>-check-390.png` (sổ tay tại C0-12/C0-13, mục 0.3a)

Tùy chọn khác:
- `--codes`, `--phrase`, `--shot-1440`, `--shot-390`: đổi mã ảnh hoặc cụm chữ cần soát. Nếu BA thêm mã ảnh mới, thêm mã đó vào `--codes`.
- `--extra-dir <thư mục>`: chụp thêm từng mã ảnh ở 1440 và 390, ở mỗi tệp có mã đó.

## 2. Tệp đầu ra (lượt 2)

| Tệp | Cỡ | Ảnh có / mã | "Bảo mật tài khoản" |
|---|---|---|---|
| `product/docs/manual/ottimo-manual-v1.0.html` | 7,6 MB | 90/92 (thiếu C1-15, C2-34, như Round 3) | 15 |
| `product/docs/manual/guides/html/00-index.html` | 0,36 MB | – | 4 |
| `…/01-chu-dau-tu-quan-ly.html` | 3,8 MB | 36/37 (thiếu C1-15) | 11 |
| `…/02-le-tan.html` | 5,8 MB | 61/65 (thiếu G2-03, G2-05, G2-06, C2-34) | 6 |
| `…/03-buong-phong.html` | 0,9 MB | 11/12 (thiếu G3-02) | 2 (mới ở 1.7: dòng 2 bước) |
| `…/04-bao-tri.html` | 0,9 MB | 12/12 | 2 (như trên) |
| `…/05-sale-ctv.html` | 1,3 MB | 13/13 | 3 |
| `…/your-id-details-tablet.html` | 85 KB | – | – (chữ khớp nguyên văn tờ A4) |

Vị trí 6 ảnh mới:

| Ảnh | Sổ tay | Bộ hướng dẫn |
|---|---|---|
| C0-06 | 0.2 | `01` 1.6, `02` 1.6, `05` 1.5 |
| G1-01 | – | `01` 1.4 |
| C1-07 | 1.5 | `01` 1.9 |
| C0-12 | 0.3a | `01` 1.6a, `02` 1.6 |
| C0-13 | 0.3a | `01` 1.6a |
| C1-22 | 1.5 | `01` 1.9 |

Các ảnh còn thiếu là ảnh cũ chờ chụp, không thuộc v1.0.3. Trong HTML, chỗ đó hiện khung trống có mã và mô tả.

Phần mới ở bản 1.9/1.7 đã có trong HTML: bảng **Thư nào – làm gì** cho 4 loại thư xuất hiện 8 lần trong sổ tay, 6 lần trong `01`, 1 lần trong `00`.

Các tệp HTML vẫn **chưa commit**, đúng luật được giao. ORC quyết có commit hay không (ĐK11). HTML chỉ nhúng ảnh trong `img/`, và mọi ảnh trong `img/` đã commit sau khi QA kiểm che.

## 3. Sửa trong công cụ dựng (từ lượt 1)

Lỗi tìm thấy ở lượt 1: mục có chữ cái cuối (**0.3a**, **1.6a**) không được nhận là mục có số. Vì vậy mục lục không có số `0.3a`, `1.6a`. Link "mục 0.3a" chỉ nối tới 0.3, và chữ "a" nằm lẻ ngoài link. Lỗi rơi đúng vào phần mới của v1.0.3.

Đã sửa, không đụng Markdown:
- `build_manual.py`: số mục nhận thêm một chữ cái cuối. Link "mục 0.3a" nối tới `#s-0-3a`. Nếu không có mục đó thì nối về mục gốc.
- `build_guides.py`: sửa tương tự cho tiêu đề mục, cho link "mục 1.6a" (kể cả trong chuỗi "mục 1.6, 1.6a") và cho kết quả tìm trong trang.
- Thêm mới: `rebuild_manual_html.py` (mục 1).

Các mục cũ có chữ cái (2.5a, 2.14a, 9.1a, 13.1a–d, 13.2a, 6.3a) cũng đúng theo. Lượt 2 soát lại: 0 link bị cắt chữ cái trong cả 8 tệp.

## 4. Kết quả kiểm 1440 px và 390 px (lượt 2)

| Kiểm | Kết quả |
|---|---|
| Tràn ngang | Không tràn ở 390 px (DPR 2, mobile) và 1440 px, trên sổ tay và 6 tệp hướng dẫn. Tờ máy tính bảng vừa khung ở 1180×820, 820×1180 và 1024×768. In thử `02`: 101 trang A4 |
| Ảnh kiểm chính | `rounds/round-04/outputs/UXD/manual-1.9-check-1440.png`: thanh bên có `0.3a Email nhận thông báo bảo mật (có từ v1.0.3)`; câu "Trang Bảo mật tài khoản có hai khối…"; link `mục 0.3a` liền một khối; ảnh C0-06 (menu có "Bảo mật tài khoản"). `…/manual-1.9-check-390.png`: thanh chip chương; ảnh C0-12, C0-13 rộng 358 px; câu lỗi mới của 1.9 ("Tài khoản không có 2 bước…", "Sai 5 lần…") xuống dòng gọn, không tràn |
| Bảng mới "Thư nào – làm gì" | Ở 390 px, bảng rộng đúng khung (356/356 px), 3 cột, không phải cuộn ngang. Ở 1440 px, bảng rộng 718/718 px. Ảnh chụp lưu ở scratchpad, không commit |
| Ảnh phụ | Chụp từng mã trong 6 mã ở 1440 và 390, trên sổ tay và tệp `01` (`--extra-dir`, lưu scratchpad, không commit). Mã nào cũng hiện ảnh, không tràn |
| Font | Thân chữ Be Vietnam Pro, tiêu đề Lora (đo bằng `getComputedStyle`). Số mục và mã ảnh JetBrains Mono (theo CSS `--f-mono`) |
| Nền / chữ | `body` nền #F4F0E8 (Ivory), chữ #2B2B28 (Ink) |

## 5. Brand OTTIMO (lượt 2)

| Mục | Kết quả |
|---|---|
| Màu | Cả 7 tệp chỉ dùng Ivory, Cream, Stone Grey, Ink, Light Oak, Earth Brown, Sage, 3 tint đã ghi trong DS (`--line` #E0D8CA, `--line-strong` #857E71, `--deco` #9A948A, xem `design-system.md`) và #FFFFFF cho nền khung ảnh. Không có màu mới |
| Chữ | Lora / Be Vietnam Pro / JetBrains Mono |
| Emoji | Không có emoji. `00-index.html` có ký tự ★ (U+2605) ở dòng lịch sử bản 1.2 ("★4, ★7", ký hiệu mục của SEC). Ký tự này có từ trước và nằm trong chữ của BA. Xem L2 |
| Dữ liệu cá nhân | 6 ảnh mới chỉ có tài khoản `qa.*` và địa chỉ `*@example.test` (QA đã kiểm che, QC S6 đạt). Không thêm ảnh nào ngoài `img/` |

Lệch nhỏ, không chặn:
- **L1** (có từ Round 3): sổ tay một tệp (`ottimo-manual-v1.0.html`) tải font từ Google Fonts, còn bộ hướng dẫn nhúng font. Mở sổ tay khi không có mạng sẽ thấy font hệ thống. Đề xuất cho `build_manual.py` dùng chung cách nhúng font của `build_guides.py` (tệp nặng thêm khoảng 0,3 MB). Ghi backlog v1.0.4. Lượt này không làm để thay đổi trước ngày Release ít nhất.
- **L2** (có từ bản 1.2): ★ trong bảng lịch sử của `00-index.md`. Đây là ký hiệu chữ, không phải emoji màu. Nếu theo đúng tinh thần "không emoji", BA có thể đổi thành "mục 4, 7" ở lần sửa sau. Không chặn.

## 6. Ghi chú cho ORC

- HTML lượt 2 dựng từ sổ tay 1.9 / bộ hướng dẫn 1.7, đã gồm các sửa theo DOM và ARC. Nếu DOM đọc lại xong có sửa thêm, gọi UXD chạy lại lệnh ở mục 1 với tag mới.
- G1-01 và C0-12 là cùng một tệp ảnh (cùng mã băm), vì trang Bảo mật tài khoản có cả hai khối. Mô tả của cả hai mã đều khớp ảnh, nên không cần chụp thêm.
- Ảnh cũ C1-09 (đã commit từ Round 3) có tên nhân viên ở tiêu đề hộp "Mật khẩu tạm của …". Ảnh này không thuộc 6 ảnh của lượt này. Đề nghị QA xác nhận đó là tên giả khi rà ảnh đợt sau.
- Ảnh kiểm lượt 1 (`manual-1.8-check-*.png`) vẫn nằm trong thư mục, chưa commit, không xóa. ORC chọn: chỉ commit ảnh của lượt 2, hoặc bỏ ảnh lượt 1.
- Việc chưa xong, không thuộc UXD: DOM đọc lại sổ tay 1.9/1.7 (ĐK11c); ORC quyết có commit HTML hay không.
