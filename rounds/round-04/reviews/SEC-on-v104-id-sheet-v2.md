# SEC review tờ "Your ID details" v2 (`v104/uxd-id-sheet-v2`)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/uxd-id-sheet-v2` @ `82df5fea` (tác giả UXD), so với merge-base `714fe810`. Đối chiếu `origin/main` @ `7b5b6117`.
- Câu hỏi của ORC: chữ trên tờ có khớp §6.2 (`SEC-on-plan-v1.0.4.md`) và bản RU SEC đã chốt (`SEC-on-privacy-v2-ru.md` mục 2) không.
- Đã đọc:
  - `product/docs/staff-one-pager.md` (Tờ 4, Tờ 4ru);
  - 4 tệp `product/docs/print/to-4-your-id-details-{a4,a5,a4-2-ban,a4-ru}.html`;
  - 4 PDF cùng tên (siêu dữ liệu, số trang);
  - `product/design/tools/build_print_sheets.py`;
  - ảnh kiểm `rounds/round-04/outputs/UXD/id-sheet-v2/*.png`, xem bản a4 và a4-ru;
  - phần đổi ở `product/design/hifi/11-reservation.html`, `12-sales-quote.html`.
- Cách kiểm chữ: script tách chữ hiển thị của từng tệp HTML và one-pager, so từng câu với chuỗi đã duyệt (bản `strings-*.json` của `v104/guest-privacy-v2` @ `80c35dcc`, đã khớp nguyên văn §6.2 và bản RU, xem `SEC-on-v104-p4-42.md` mục 1).
- Không sửa tờ, không sửa decision-log. Không có dữ liệu khách trong tệp này.

---

## 0. Kết luận

**ĐẠT.** Không có Blocker, Major hay Minor. Có 1 Suggestion. Tờ in được, đúng thứ tự bật ở 6.4 ý 5 (thay tờ trước khi OWN đặt H05).

| Tờ | Ngôn ngữ | Khớp chữ | Ghi chú |
|---|---|---|---|
| A4, A5, A4 hai bản cắt đôi | EN + VI | Khớp từng câu với §6.2, đủ 4 khóa, đúng thứ tự body → retention → translation → rights | `gw.notice_body` tách 2 đoạn (câu 1–2, câu 3–4). Không bỏ vế, không đổi chữ. `3 months`, `35 days`, `3 tháng`, `35 ngày`, `check-out` bọc `<span class="nb">` (không ngắt dòng): kiểu chữ, chấp nhận |
| A4 EN/RU (mới) | EN + RU | 4 đoạn RU **khớp nguyên văn** bản RU đã chốt, kể cả U+00A0 ở `3⍽месяцев`, `35⍽дней`. EN y hệt tờ EN/VI | Hai cột, mỗi hàng một đoạn. Không có 7 khóa đồng ý: đúng T3 của UXD, vì tờ chỉ là thông báo |
| one-pager (nguồn để dựng tờ) | EN, VI, RU | Mọi câu của 4 khóa có mặt, nguyên văn | Có ghi chú: bản v1 giữ trong lịch sử repo (SEC D08), thay tờ trước khi đặt H05 |

## 1. Điểm kiểm khác

| # | Điểm | Kết quả |
|---|---|---|
| K1 | Chân trang `OTTIMO · ID notice · v2 · 11/2026` (6.4 ý 4) | Đạt. Hiện là hai phần trái/phải: "OTTIMO · ID notice · v2" và "11/2026". Cùng nội dung, chấp nhận |
| K2 | Bản v1 còn trong lịch sử repo (D08) | Đạt: tệp đổi bằng commit, bản cũ ở `714fe810` |
| K3 | Không có dữ liệu khách, số giấy tờ, QR hay link | Đạt. HTML không có `<img>` và không có URL ngoài: font nhúng base64, mở khi mất mạng vẫn đúng. Ảnh kiểm chỉ có chữ mẫu |
| K4 | Siêu dữ liệu PDF | Đạt. Chỉ có Title (tên tờ), Creator HeadlessChrome, Producer Skia. **Không** có Author hay tên máy. Mỗi tệp 1 trang |
| K5 | Brand | Đạt. Lora tiêu đề, Be Vietnam Pro thân (Onest cho RU, theo ghi chú UXD), chỉ Ink, Stone Grey, Light Oak trên nền trắng/ngà. Không emoji |
| K6 | Phần đổi ở hifi 11/12 (ngoài tờ) | Đạt về bảo mật. Chỉ **gắn nhãn** "ví dụ theo tỷ lệ cũ (trước 01/11/2026, hết hiệu lực)" cho số hoa hồng cũ, đúng phương án A của `SEC-on-commission-numbers.md`. **Không** thêm tỷ lệ hay số tiền nào của bảng 01/11 |

---

## 2. Thẻ feedback

### FB-R4-SEC-UXD-IDS2-01
- Mức độ: Suggestion
- Vị trí: `product/design/tools/build_print_sheets.py` (nguồn chữ là `staff-one-pager.md`, không phải `strings-*.json`).
- Vấn đề: chữ pháp lý của tờ và của trang khách hiện có **hai nguồn**: one-pager và `gen_strings.py`. Hôm nay hai nguồn khớp (đã kiểm bằng script). Về sau, chỉ cần một lượt sửa dấu câu ở một bên là tờ ở quầy lệch với trang. Mà decision-log 17/10 coi chữ là bằng chứng đã đọc của khách.
- Vì sao quan trọng: khách đọc tờ ở quầy, còn bằng chứng ghi version của trang. Hai chữ lệch nhau thì version không còn nói đúng khách đã đọc gì.
- Đề xuất sửa: thêm vào `build_print_sheets.py` một bước kiểm. Với mỗi tờ 4/4ru, so từng đoạn (bỏ thẻ `<span class="nb">`) với `strings-{en,vi,ru}.json` của 4 khóa `gw.notice_*`. Lệch thì dừng build. Hoặc đọc thẳng chữ từ JSON. Có thể để v1.0.5.
- Trạng thái: Open

---

## 3. Điểm làm tốt
- Tờ RU tách riêng, hai cột EN/RU theo từng đoạn: khách và lễ tân đối chiếu từng ý dễ.
- U+00A0 giữ đúng ở tờ RU. Chỗ tương đương ở EN/VI dùng `nowrap`, nên số và đơn vị không rời nhau trên giấy.
- Font nhúng, không có tài nguyên ngoài: in hay mở PDF ở quầy không phụ thuộc mạng, không gọi ra ngoài.
