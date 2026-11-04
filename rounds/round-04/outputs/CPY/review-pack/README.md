# Bộ tệp đọc duyệt bản dịch LP-v2 – hướng dẫn cho chủ đầu tư

Round 4 · Gói LP-v2 · Bước 6 · CPY lập ngày 04/11/2026. Chữ lấy từ nhánh `lp-v2` (`93c549ea`, 01/11/2026), đối chiếu PR #21.

## Gửi tệp nào cho ai

| Người đọc | Gửi tệp | Nhờ họ làm gì |
|---|---|---|
| Người bản xứ tiếng Hàn | `lp-v2-ko-review.html` + `lp-v2-privacy-review.html` | Đọc toàn bộ tệp ko (289 dòng). Trong tệp privacy chỉ đọc cột **KO** |
| Người bản xứ tiếng Trung | `lp-v2-zh-review.html` + `lp-v2-privacy-review.html` | Đọc toàn bộ tệp zh (289 dòng). Trong tệp privacy chỉ đọc cột **ZH** |
| Người bản xứ tiếng Nga | `lp-v2-ru-review.html` + `lp-v2-privacy-review.html` | Đọc toàn bộ tệp ru (289 dòng). Trong tệp privacy chỉ đọc cột **RU** |
| Luật sư | `lp-v2-privacy-review.html` | Đọc bản EN/VI, góp ý từng mục, trả lời câu Q1–Q7 ở đầu tệp |

- Người bản xứ **cần** đọc cả thông báo dữ liệu: theo quy tắc SEC, ngôn ngữ nào người bản xứ chưa duyệt thông báo thì cả ngôn ngữ đó phải dời.
- Đầu mỗi tệp đã có hướng dẫn cho người đọc (tiếng Anh + tiếng của họ) và danh sách "Please look closely", tức những câu dễ sai nhất.
- Chỉ gửi 4 tệp `.html`. Không gửi `README.md`, thư mục `_build/` hay tài liệu nội bộ khác.

## Cách gửi và mở tệp
- Gửi tệp đính kèm qua email hoặc Zalo. Người đọc mở bằng Chrome, Safari hoặc Edge trên **máy tính**. Không cần cài gì. Có mạng thì tải font OTTIMO, không có mạng vẫn đọc được.
- Trên điện thoại vẫn đọc được (bảng tự xếp thành thẻ). Nhưng trình xem tệp trong Zalo, Mail hay Messenger thường **không cho gõ hoặc tải góp ý về**. Ai đọc trên điện thoại thì nên trả lời bằng cách 3 bên dưới.

## Nhờ họ trả lại thế nào (chọn một cách)
1. **Gõ vào ô "Comments" / "Góp ý"** (ô để trống = câu đó ổn). Góp ý được tự lưu trong trình duyệt của máy họ. Xong thì bấm **Download comments** để tải về một tệp `.txt` rồi gửi lại anh/chị, hoặc bấm **Copy comments** rồi dán vào tin nhắn.
2. **In ra** (nút Print, khổ A4 ngang), ghi tay cạnh dòng cần sửa, chụp ảnh gửi lại.
3. **Nhắn số dòng kèm câu sửa**, ví dụ "045: …". Với luật sư: "§6.4: Sửa …" hoặc "Q3: Đồng ý".

Nhận được góp ý thì anh/chị chuyển nguyên văn (tệp `.txt` hoặc ảnh) cho ORC. ORC giao CPY sửa câu trên trang, SEC sửa câu thông báo. Sửa xong, đội dựng lại tệp mới để người đọc xem lại những câu đã đổi.

## Hạn đề xuất
- Người bản xứ: **thứ Hai 09/11/2026**, khoảng 1–2 giờ đọc mỗi người.
- Luật sư: **thứ Sáu 13/11/2026**.
- Lý do: anh/chị đã chọn cho LP-v2 lên cùng một lần, sau khi đủ người bản xứ, luật sư, QA và QC. Hai việc chạy song song nên gửi cùng ngày. Nếu người bản xứ sửa câu thông báo ko/zh/ru, luật sư không cần đọc lại, vì luật sư đọc nghĩa ở bản EN/VI.

## Cần biết trước khi gửi
- **Câu cần xử lý trước khi đăng (đã ghi ở đầu tệp privacy).** Câu về dịch vụ dịch (§6.4) trong PR #21 có thêm vế "dịch vụ xử lý nội dung theo chính sách riêng của họ". Bản LP-v2 chưa có vế này, nên bản ko/zh/ru cũng thiếu. SEC đã soạn câu ko/zh/ru mới, tệp hiện cả hai bản để người đọc xem cùng lúc. Gửi ngay được, không cần chờ.
- Trong tệp có thông tin công khai của OTTIMO, giữ đúng như trên website: hotline, `info@ottimo.vn`, tên công ty, mã số thuế, địa chỉ. Tệp không có dữ liệu khách, giá thật hay khóa.
- Giá ước tính chỉ hiện dưới dạng `{amount}`, không có số thật.
- Thư mẫu gửi luật sư của SEC (`rounds/round-04/outputs/SEC/lp-v2-privacy-and-api.md` mục 8) có thêm câu về giá theo loại giấy tờ. Câu đó không nằm trong tệp này. Anh/chị gửi riêng nếu muốn hỏi luôn.

## Cho đội (không gửi ra ngoài)
Dựng lại cả bộ từ git, không đổi nhánh: `rounds/round-04/outputs/CPY/review-pack/_build/build.sh [origin/lp-v2] [origin/fe-b/notice-2026-10-31]` (Node ≥ 22.18).
