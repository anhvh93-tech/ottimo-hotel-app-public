# Runbook sự cố dữ liệu khách (SR-INC-01)

- Dành cho: chủ đầu tư (OWN) và đội (ORC, SEC, OPS). Người trực quầy đọc mục 4 bước 1–2.
- Lập: SEC · Round 5 – Sản xuất · 07/11/2026 · Bản 1.0 (V5-74). Review: OPS, BA, DOM. Thay lớp tạm ở sổ vận hành 1.1a (FB-R5-SEC-BA-04).
- Tài liệu nội bộ. Không có tên người, số điện thoại, email, địa chỉ máy chủ, mật khẩu hay dữ liệu khách. Liên hệ ghi theo vai.
- Căn cứ: SR-INC-01 (`security/security-requirements.md`). Nghị định 13/2023 Điều 23 và Luật 91/2025 theo hiểu biết của đội, **chưa được luật sư xác nhận** (câu Q12, `security/data-risk-assessment.md` mục 12). Tài liệu này không khẳng định OTTIMO tuân thủ pháp luật.

**Dùng khi** dữ liệu khách có thể đã tới tay người không được phép. Không chắc thì dùng. Hai ca viết sẵn: A (gửi nhầm link, mục 4), B (lượt kéo sao lưu thoát mã 3, mục 5). Ca khác (tài khoản lạ đăng nhập, mất điện thoại cơ sở, ảnh giấy tờ ra ngoài): làm 5 bước ở mục 2, OWN gõ `/feedback P0`. Khách lỡ gửi số thẻ hoặc ảnh giấy tờ qua chat: làm theo `guides/02` mục 16.1 trước. Có dấu hiệu dữ liệu đã tới người ngoài thì sang bước 3.

## 1. Ai làm gì, ai quyết

| Vai | Làm | Quyết |
|---|---|---|
| Người trực quầy (lễ tân, lễ tân trưởng, quản lý) | Chặn ngay ở quầy, ghi sổ giao ca, báo OWN | – |
| Chủ đầu tư (OWN) | Báo đội qua `/feedback`; cho đội kết nối máy chủ để kiểm chỉ đọc; hỏi luật sư; tự gửi thông báo | Tắt máy chủ. **Có báo cơ quan chức năng không** (cùng SEC). Có báo khách không |
| Điều phối viên (ORC) | Ghi phiếu, giữ đồng hồ 72 giờ, chạy lệnh chỉ đọc trong câu đồng ý của OWN, ghi decision-log | – |
| Đội bảo mật (SEC) | Đánh giá, xếp mức (mục 3), đề xuất có báo không, soạn nội dung báo chỉ bằng số đếm | Mức sự cố, bước kỹ thuật |
| OPS | Khoanh vùng trên máy chủ, dựng lại máy. Chỉ làm khi OWN đồng ý trong chat | – |
| Luật sư (OWN đã thuê, ESC-001) | Xác nhận có phải báo, báo cơ quan nào, theo mẫu nào, hạn tính từ đâu; đọc bản báo | Ý kiến pháp lý |

Liên hệ: đội chỉ qua Claude Code (`/feedback`), không có số trực. Luật sư: OWN liên hệ. Cơ quan chức năng: theo kênh luật sư chỉ. Nhà cung cấp máy chủ: chỉ khi đội đề nghị.

## 2. Năm bước

| Bước | Việc | Ai | Hạn |
|---|---|---|---|
| 1. Phát hiện | Báo theo đường ở sổ vận hành 3.2, 3.3. Ghi giờ xảy ra và giờ phát hiện | Người thấy | Ngay |
| 2. Khoanh vùng | Chặn trước, hỏi sau: thu hồi link, khóa tài khoản hoặc đặt lại mật khẩu, không duyệt phát hành, tạm tắt máy chủ (OWN quyết). Không xóa sổ giao ca, nhật ký, thư mục sao lưu | Quầy, OWN, OPS | Ngay, trong ca |
| 3. Đánh giá | Dữ liệu gì, của bao nhiêu đơn, người ngoài đã thấy hay ghi được gì, còn đang lộ không. Chỉ dùng mã đơn và số đếm | SEC (+ OPS) | Trong ngày |
| 4. Quyết báo cơ quan chức năng | SEC đề xuất, OWN quyết, luật sư xác nhận. Quyết và lý do vào decision-log **chậm nhất giờ thứ 48**. Phải báo thì OWN gửi trước giờ thứ 72 | OWN + SEC | ≤ 72 giờ |
| 5. Báo khách, nếu cần | Khi mức Cao, khi luật sư hay cơ quan yêu cầu, hoặc khi khách cần tự làm gì đó để giữ an toàn. CPY viết theo giọng OTTIMO, SEC duyệt, OWN gửi riêng tới liên hệ trên đơn. Không báo người nhận nhầm, trừ khi SEC đề nghị | OWN | Theo luật sư |

**Đồng hồ 72 giờ** tính từ giờ xảy ra nếu biết (ví dụ giờ gửi nhầm), không thì từ giờ phát hiện. Đây là cách tính chặt nhất, dùng tới khi luật sư trả lời. Báo sau 72 giờ thì kèm lý do chậm. Nội dung báo: chuyện gì, lúc nào; loại dữ liệu và số khách liên quan; hậu quả có thể có; việc đã làm để chặn và giảm hại; người liên hệ phía OTTIMO. Biên bản và bản báo có thể có dữ liệu khách: OWN giữ ngoài kho mã, không gửi qua `/feedback`.

## 3. Mức sự cố (SEC xếp, dùng ở bước 4)

| Mức | Dấu hiệu | Báo cơ quan chức năng |
|---|---|---|
| Thấp | Không dữ liệu khách nào tới người ngoài: link chưa được mở trước khi thu hồi; mã 3 hóa ra do bản trên Mac hỏng | Đội đề xuất không báo. OWN quyết, lý do vào decision-log |
| Vừa | Người ngoài đã thấy dữ liệu của **một** đơn ở trang khách (tên gọi, mã đơn, ngày ở, căn, giờ đến), có thể đã ghi vào đơn. Link đã thu hồi | OWN quyết cùng SEC. Tới khi luật sư cho ngưỡng (Q12): hỏi luật sư mỗi ca, trước giờ thứ 48 |
| Cao | Nhiều đơn; ảnh hay số giấy tờ, số điện thoại, email của khách ra ngoài; máy chủ bị xâm nhập | Mặc định chuẩn bị báo. Chỉ không báo khi luật sư trả lời rõ là không cần |

## 4. Nhánh A – Lễ tân gửi nhầm link check-in online

Nguồn: FB-R5-SEC-BA-01, `guides/02` mục 17.3 bước 5, Tờ 1. Tới lúc thu hồi, người nhận nhầm thấy trang khách mức 1 và ghi được vào đơn: tải ảnh, đổi giờ đến, gửi yêu cầu. Người đó không xem được ảnh giấy tờ đã tải.

1. **Quầy, ngay:** **Thu hồi link**, rồi **Tạo link mới**, gửi đúng liên hệ trên đơn. Ghi sổ giao ca theo mẫu ở mục 6. Báo OWN **trong ngày**.
2. **Quầy:** trước giờ thu hồi, đơn đã hiện **Đã làm thủ tục trước**, giờ đến mới hay yêu cầu mới mà khách nói mình chưa gửi? Khi đó: không dùng giấy tờ đó để khai báo; khách đến thì đối chiếu bản gốc; ảnh không phải người trên đơn thì không **Gắn người**, quản lý **Xóa ảnh**; báo OWN **ngay trong ca**.
3. **OWN, trong ngày:** gõ `/feedback` (không cần P0): dòng mẫu ở mục 6, thêm "đơn có ghi lạ trước giờ thu hồi: có/không".
4. **Đội, trong ngày:** khi OWN cho kết nối máy chủ, ORC đếm số lần link đã thu hồi được mở trước giờ thu hồi (truy vấn chỉ đọc theo mã đơn, chỉ ra số). Chưa đếm được thì coi như đã mở. SEC xếp mức: 0 lần mở là Thấp; có mở là Vừa; nhiều đơn bị gửi nhầm là Cao. Sau đó làm bước 4–5 ở mục 2.

## 5. Nhánh B – Lượt kéo sao lưu thoát mã 3 ("server copy changed")

Nghĩa: `pull-backups.sh` so nội dung từng bản đã có trên Mac với tệp cùng tên trên máy chủ. Máy chủ không bao giờ viết lại một bản sao lưu đã xong, nên khác nhau nghĩa là bản trên máy chủ đã bị đổi, có thể máy chủ bị xâm nhập. Script in `WARNING: server copy changed: <tên> – local copy kept`, vẫn kéo và kiểm tệp mới, giữ nguyên bản trên Mac, rồi thoát 3. Mã 3 che mã 1: có thể có dòng `checksum mismatch` cùng lúc.

1. **ORC, ngay trong lượt kéo:** báo OWN trong chat: giờ chạy, mã thoát 3, số tệp bị báo, có dòng `checksum mismatch` không. Đây là P0 bảo mật (sổ vận hành 1.1a).
2. **Khoanh vùng, OWN quyết ngay:** không duyệt phát hành nào. Không xóa, không chuyển thư mục sao lưu trên Mac. Không kéo lại, không đăng nhập máy chủ tới khi SEC báo. Không dùng lại thứ gì lấy từ máy chủ: khóa, token, `.env`, bản sao lưu mới. Đội có thể đề nghị tạm tắt máy chủ: Desk ngừng, quầy làm sổ giấy (sổ vận hành 3.2).
3. **Đánh giá, SEC + OPS, trong ngày, chỉ đọc, trong câu đồng ý của OWN:**
   - Tệp bị báo cũng có `checksum mismatch` trên Mac: so tay với `.sha256` trên máy chủ (README `infra/server`, dòng "Bản sao lưu ngoài máy"). Bản trên Mac hỏng mà bản máy chủ khớp: không phải xâm nhập, mức Thấp, xử lý như mã 1.
   - Bản trên Mac khớp `.sha256` của nó mà bản máy chủ khác: coi như máy chủ đã bị xâm nhập, **mức Cao**. Đồng hồ 72 giờ tính từ giờ lượt kéo.
4. **Mức Cao:** dựng lại theo `runbook-vps-moi.md`, khối "Nghi bị chiếm quyền": SEC chọn bản trên Mac trước lúc nghi bị vào; xoay KEK và `id_hash_key`; bí mật tích hợp mới. Coi mọi dữ liệu trên máy chủ, kể cả ảnh giấy tờ, là có thể đã lộ, vì khóa giải mã nằm cùng máy. Sau đó làm bước 4–5 ở mục 2.

## 6. Mẫu dòng ghi

Dùng cho sổ giao ca, `/feedback` và decision-log. Chỉ có mã đơn, giờ, kênh và việc đã làm:

- `SR-INC · nhánh A · đơn OTM-… · gửi nhầm 10:12 · thu hồi 10:20 · kênh Zalo · đã tạo link mới · báo OWN 10:25`
- `SR-INC · nhánh B · không có đơn · lượt kéo 19:05 · mã thoát 3 · 1 tệp bị báo · không có checksum mismatch · báo OWN 19:06`
- Decision-log (ORC): `| <ngày> | <round> | SR-INC nhánh <A/B> đơn OTM-…: mức <Thấp/Vừa/Cao>; báo cơ quan chức năng <có, gửi lúc … / không, lý do …>; báo khách <có/không> | OWN + SEC | runbook-su-co-du-lieu-khach.md |`

**Không bao giờ ghi:** tên, số điện thoại, email, số giấy tờ, ảnh của khách; tên hay số của người nhận nhầm; tên nhân viên (chỉ ghi vai); địa chỉ máy chủ, mật khẩu, khóa. Mọi thứ gõ qua `/feedback` vào kho mã công khai của dự án.

## Lịch sử

| Ngày | Bản | Người | Nội dung |
|---|---|---|---|
| 07/11/2026 | 1.0 | SEC | Bản đầu (V5-74, Round 5 – Sản xuất), theo `rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md` mục 5 ý 1. Chờ review OPS, BA, DOM |
