# UXD review – câu trả lời khách gửi ảnh giấy tờ, câu mã cửa "at reception"

- Người review: UXD | Round 5 – Review (chủ nội dung) | Ngày: 07/11/2026
- Đã đọc:
  - `rounds/round-05/outputs/CPY/guest-reply-id-photos.md` @ `1f5fb23e`: bản A, bản ngắn Zalo số cơ sở, bản B; mỗi bản có EN, VI và hai câu cuối 5a, 5b;
  - `rounds/round-05/outputs/CPY/guest-reply-card-number.md` Lượt 4 @ `4339a184`: câu mã cửa "at reception". VI đổi "anh/chị" thành "bạn" theo ORC.
- Đối chiếu:
  - `00-brief/context/brand/brand-guidelines.md` mục 2 (ngắn, lịch sự, điềm tĩnh, EN dẫn, VI hỗ trợ, không emoji, không cảm thán);
  - content-guide mục 1 (xưng "bạn"; "anh/chị" chỉ khi lễ tân tự sửa tin);
  - chữ trang khách: `guest.cta.checkin` "Làm thủ tục trước (check-in online)" / "Online check-in", `gw.door_at_desk`, `msg.checkin_link`;
  - câu số thẻ đã duyệt (bản ngắn, bản không có vế xóa).
- Không có dữ liệu khách. Không có số giấy tờ, số thẻ hay mã cửa trong tệp này.

## 0. Kết luận

| Tệp | SHA | Kết luận | Thẻ |
|---|---|---|---|
| `guest-reply-id-photos.md` | `1f5fb23e` | **ĐẠT CÓ ĐIỀU KIỆN.** Giọng và brand đạt. Điều kiện: CPY sửa 2 thẻ Minor trước khi BA dán vào sổ tay | IDP-01 Minor, IDP-02 Minor, IDP-03 Suggestion, IDP-04 Suggestion |
| `guest-reply-card-number.md` Lượt 4 (câu mã cửa) | `4339a184` | **ĐẠT** | Không có |

Không có ESC.

## 1. Kiểm theo guideline – ảnh giấy tờ

Quét bằng script cả 12 đoạn để sao chép.

| Mục | Kết quả |
|---|---|
| Không emoji, không "!", không IN HOA để nhấn | Đạt. Chỉ "OTTIMO" và "ID" viết hoa |
| Không chữ số, không từ cấm ("Quý khách", "rất hân hạnh", "Gia đình OTTIMO") | Đạt |
| EN dẫn, VI hỗ trợ, một ngôn ngữ mỗi tin | Đạt. EN là bản gốc, VI cùng ý từng câu |
| Ngắn, điềm tĩnh | Đạt. Mỗi câu một ý. Bản A, bản B: mọi câu ≤ 20 chữ EN. Bản ngắn 23 và 21 chữ, cùng mức câu số thẻ đã duyệt. Không "luật", không "rủi ro", không trách khách |
| Lịch sự, không đổ lỗi | Đạt. Câu 1 cảm ơn việc khách định làm ("getting your documents ready"), không ngụ ý khách làm sai |
| Thuật ngữ trùng trang khách | Đạt: "reception" / "quầy lễ tân"; "online check-in" / "Làm thủ tục trước (check-in online)" lần đầu, như `guest.cta.checkin`; "personal" thay "secure" |
| Dấu | Đạt. Gạch "–" là U+2013. Gạch nối chỉ ở "check-in" |
| Hứa đúng việc làm được | Đạt. "sẽ xóa" / "will delete", không "đã xóa" (SEC 6.6). Bản B không có vế xóa |

## 2. Câu mã cửa (Lượt 4)

- EN: "For your security, OTTIMO never sends door codes by message. We will call you on the phone number in your booking, or you may collect your code at reception."
- VI (ORC chọn "bạn"): "Vì an toàn của bạn, OTTIMO không gửi mã cửa qua tin nhắn. Lễ tân sẽ gọi vào số điện thoại trong đơn đặt phòng, hoặc bạn nhận mã tại quầy."

Đánh giá:
- "at reception" trùng `gw.door_at_desk` ("Reception gives you your door code when you arrive."). Khách đọc tin và đọc trang khách thấy cùng một tên.
- VI xưng "bạn" theo content-guide mục 1. Mở câu "Vì an toàn của bạn" giống câu số thẻ. Lễ tân vẫn được đổi sang "anh/chị" cho cả tin.
- Nghĩa không đổi so với bản SEC duyệt ở R3.

**ĐẠT.** BA đổi ở hai chỗ CPY đã chỉ (`user-manual-v1.0.md` 2.21, `guides/02-le-tan.md` 7.5), đổi cả EN và VI. Khi BA đổi xong, UXD dựng lại HTML sổ tay.

## 3. Thẻ – ảnh giấy tờ

### FB-R5-UXD-CPY-IDP-01
- Mức độ: Minor
- Vị trí: `guest-reply-id-photos.md`, tiêu đề mục 2: "Bản A – kênh xóa được (Zalo số cơ sở, WhatsApp, Telegram, Viber, email, SMS)".
- Vấn đề: tiêu đề ghi Zalo số cơ sở dùng bản A, nhưng bảng "Chọn bản" ở mục 1 và chữ dán cho BA ở mục 5 ghi Zalo số cơ sở dùng bản ngắn (mục 2a).
- Vì sao quan trọng: BA dán nguyên tiêu đề mục vào sổ tay. Lễ tân ở Zalo, kênh dùng nhiều nhất, có thể gửi bản 6 câu thay cho bản ngắn 2 câu.
- Đề xuất sửa: bỏ "Zalo số cơ sở" khỏi tiêu đề mục 2: "Bản A – kênh xóa được (WhatsApp, Telegram, Viber, email, SMS)".
- Trạng thái: Open (CPY)

### FB-R5-UXD-CPY-IDP-02
- Mức độ: Minor
- Vị trí: bản ngắn (mục 2a), câu 1 EN, ở bảng và ở 4 đoạn để sao chép:
  - "…so we will delete them on our side."
- Vấn đề:
  - VI có "ngay" ("sẽ xóa ngay ảnh bạn đã gửi"), EN thì không có. Hai thứ tiếng nói khác nhau về lúc xóa.
  - Bản ngắn câu số thẻ đã duyệt viết "we are deleting your message on our side now". Hai mẫu cùng kênh nói việc xóa theo hai cách.
- Vì sao quan trọng:
  - Chữ "ngay" là ý của SEC ("xóa ngay, không chờ khách thu hồi").
  - Khách quốc tế ở Zalo đọc EN, nên chỉ thấy "sẽ xóa", không biết lúc nào.
- Đề xuất sửa: đổi thành "…so we are deleting them on our side now." (24 chữ). Đây đúng dạng SEC đã duyệt ở câu số thẻ (6.5.1), không phải "đã xóa", và VI giữ nguyên. Nếu CPY muốn giữ thì tương lai, dùng "…so we will delete them on our side straight away." ORC xem có cần SEC đọc lại một dòng này không.
- Trạng thái: Open (CPY)

### FB-R5-UXD-CPY-IDP-03
- Mức độ: Suggestion
- Vị trí: câu 5a VI ở bản A, bản B và bản ngắn: "…link làm thủ tục trước (check-in online), qua liên hệ trong đơn đặt phòng."
- Vấn đề: "liên hệ" dùng như danh từ ("contact") nghe như dịch máy. Dấu phẩy trước "qua" cắt câu không cần.
- Vì sao quan trọng: đây là câu khách đọc để biết chờ link ở đâu. Câu phải tự nhiên với khách Việt.
- Đề xuất sửa:
  - bản A, bản B: "Lễ tân sẽ gửi riêng cho bạn link làm thủ tục trước (check-in online) qua thông tin liên hệ trong đơn đặt phòng.";
  - bản ngắn: "…link check-in online qua thông tin liên hệ trong đơn đặt phòng."

  Khớp EN "contact details in your booking". Không đổi nghĩa.
- Trạng thái: Open (CPY)

### FB-R5-UXD-CPY-IDP-04
- Mức độ: Suggestion
- Vị trí: `guest-reply-id-photos.md` mục 1.
- Vấn đề: mục 1 của câu số thẻ có hai luật lễ tân cần, mà mục 1 ở tệp này chưa có:
  - "Chưa rõ tên thì viết 'Hello,' / 'Chào bạn,'";
  - "Khách lớn tuổi thì đổi sang 'anh/chị' cho cả tin".
- Vì sao quan trọng: thiếu hai luật này thì có thể có tin gửi đi còn nguyên "{name}", hoặc tin trộn "bạn" với "anh/chị".
- Đề xuất sửa: chép hai gạch đó từ mục 1 câu số thẻ sang. BA dán một lần dưới bảng tình huống, dùng cho cả ba mẫu (số thẻ, ảnh giấy tờ, mã cửa).
- Trạng thái: Open (CPY, BA)

## 4. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **UXD – review chữ khách: trả lời khách gửi ảnh giấy tờ** (guest-reply-id-photos.md @ 1f5fb23e): ĐẠT CÓ ĐIỀU KIỆN, giọng và brand đạt (EN dẫn, không emoji, không "!", không chữ số, "reception", "Online check-in" như trang khách, "sẽ xóa" không "đã xóa"). Điều kiện trước khi BA dán: tiêu đề mục 2 bỏ "Zalo số cơ sở" (IDP-01); bản ngắn EN thêm lúc xóa "we are deleting them on our side now" như câu số thẻ (IDP-02). Suggestion: VI "thông tin liên hệ" (IDP-03); chép luật tên trống và "anh/chị" cho cả tin (IDP-04). **Câu mã cửa "at reception"** (guest-reply-card-number.md Lượt 4 @ 4339a184), VI xưng "bạn": ĐẠT. Không ESC | UXD | rounds/round-05/reviews/UXD-on-cpy-id-photos.md |`

---

## Lượt 2 – CPY @ `f40e1480` (IDP-01…04, câu 5c cho khách đang ở)

- Ngày: 07/11/2026 | Round 5 – Review
- Đã đọc: `git diff 1f5fb23e f40e1480 -- rounds/round-05/outputs/CPY/guest-reply-id-photos.md`. Quét lại bằng script cả 18 đoạn để sao chép: không emoji, không "!", không chữ số, không từ cấm.

| Thẻ | Kết quả | Ghi chú |
|---|---|---|
| IDP-01 (Minor) | **Done** | Tiêu đề mục 2 không còn "Zalo số cơ sở". Khớp bảng "Chọn bản" và chữ cho BA |
| IDP-02 (Minor) | **Done** | Bản ngắn EN: "…so we are deleting them on our side now." Đổi ở bảng và cả 3 đoạn EN để sao chép của bản ngắn (5a, 5b, 5c). VI giữ "sẽ xóa ngay". Hai mẫu cùng kênh nay nói việc xóa cùng một cách |
| IDP-03 (Suggestion) | **Done** | "qua thông tin liên hệ trong đơn đặt phòng", không còn dấu phẩy, ở bản A, bản B và bản ngắn |
| IDP-04 (Suggestion) | **Done** | Mục 1 có luật tên trống ("Hello," / "Chào bạn,", không gửi tin còn "{name}") và luật "anh/chị" cho cả tin |

**Câu 5c (khách đang ở): ĐẠT về giọng.**
- EN "Please bring the original documents to reception today, and we will complete the registration for you." (16 chữ). Bản ngắn 21 chữ, bằng câu 2 (5a).
- Cùng khuôn với 5b: "Please bring…", "reception", "quầy lễ tân", lịch sự và điềm tĩnh. Hẹn "today" / "trong hôm nay", không nêu giờ, nên không hứa điều quầy không giữ được.
- Câu 1 dạng 5c bỏ "ahead of your stay": "Hello {name}, thank you for getting these documents ready." / "Chào {name}, cảm ơn bạn đã chuẩn bị giấy tờ." Đúng, vì khách đã ở rồi.
- "complete the registration" / "làm thủ tục": rõ nghĩa với khách, không dùng từ pháp lý ("khai báo tạm trú", "Nghị định"). Hợp luật "không nhắc luật" ở mục 1.
- Vẫn là lối "bản gốc tại quầy" của SEC 6.6 (b), không mở lối mới.

**Kết luận: `guest-reply-id-photos.md` @ `f40e1480` ĐẠT.** Hết điều kiện từ phía UXD, BA dán được. Không có thẻ mới, không có ESC.

Dòng decision-log đề xuất (ORC ghi):

`| 2026-11-07 | 5 | **UXD – trả lời khách gửi ảnh giấy tờ, lượt 2 @ f40e1480: ĐẠT** (rounds/round-05/reviews/UXD-on-cpy-id-photos.md, Lượt 2): IDP-01…04 Done (tiêu đề mục 2 bỏ Zalo số cơ sở; bản ngắn EN "we are deleting them on our side now"; VI "thông tin liên hệ"; luật tên trống và "anh/chị" cho cả tin). Câu 5c cho khách đang ở ĐẠT về giọng (EN 16 chữ, "reception today", không nêu giờ, câu 1 bỏ "ahead of your stay"). BA dán được. Không ESC | UXD | Lượt 2 trong tệp review |`
