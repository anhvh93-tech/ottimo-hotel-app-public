# Runbook sự cố dữ liệu khách (SR-INC-01)

- Dành cho: chủ đầu tư (OWN) và đội (ORC, SEC, OPS). Quầy làm theo `guides/02` mục 17.3 bước 5 và Tờ 1 (cùng nội dung mục 4 bước 1–2). Runbook này không phát cho quầy.
- Lập: SEC · Round 5 · 07/11/2026 · Bản 1.2 (V5-74; sửa theo DOM, OPS, BA, lịch sử cuối tệp). Review: OPS, BA, DOM. Thay lớp tạm ở sổ vận hành 1.1a (FB-R5-SEC-BA-04).
- Tài liệu nội bộ. Không có tên người, số điện thoại, email, địa chỉ máy chủ, mật khẩu hay dữ liệu khách. Liên hệ ghi theo vai.
- Căn cứ: SR-INC-01 (`security/security-requirements.md`). Nghị định 13/2023 Điều 23 và Luật 91/2025 theo hiểu biết của đội, **chưa được luật sư xác nhận** (câu Q12, `security/data-risk-assessment.md` mục 12; luật sư theo ESC-001). Tài liệu này không khẳng định OTTIMO tuân thủ pháp luật.
- **Mặc định pháp lý tạm** (đồng hồ 72 giờ ở mục 2, ngưỡng báo ở mục 3, hai mặc định khi chưa ai trả lời ở mục 2 bước 4): `[GIẢ ĐỊNH – chờ INV xác nhận]`, gắn ESC-001 / Q12. Dùng tới khi luật sư trả lời Q12.

**Dùng khi** dữ liệu khách có thể đã tới tay người không được phép. Không chắc thì dùng.
- Hai ca viết sẵn: A (gửi nhầm link, mục 4), B (lượt kéo sao lưu thoát mã 3, mục 5).
- Ca khác (tài khoản lạ đăng nhập, mất điện thoại cơ sở, ảnh giấy tờ ra ngoài): làm 5 bước ở mục 2, OWN gõ `/feedback P0`.
- Khách lỡ gửi số thẻ hoặc ảnh giấy tờ qua chat: làm theo `guides/02` mục 16.1 trước.
- Có dấu hiệu dữ liệu đã tới người ngoài thì sang mục 2 bước 3.

## 1. Ai làm gì, ai quyết

| Vai | Làm | Quyết |
|---|---|---|
| Người trực quầy (lễ tân, lễ tân trưởng, quản lý) | **Thu hồi link** khách, ghi sổ giao ca, báo OWN | – |
| Chủ đầu tư (OWN) | Báo đội qua `/feedback`; khóa tài khoản, thu hồi phiên và thiết bị (mục 2 bước 2); cho đội kết nối máy chủ để kiểm chỉ đọc; hỏi luật sư; tự gửi thông báo | Tắt máy chủ. **Có báo cơ quan chức năng không.** Có báo khách không |
| Điều phối viên (ORC) | Ghi phiếu, giữ đồng hồ 72 giờ, nhắc OWN ở giờ thứ 24 và 48, chạy lệnh chỉ đọc trong câu đồng ý của OWN, ghi decision-log | – |
| Đội bảo mật (SEC) | Đánh giá, xếp mức (mục 3), **đề xuất** có báo không, soạn nội dung báo chỉ bằng số đếm | Mức sự cố, bước kỹ thuật |
| OPS | Khoanh vùng trên máy chủ, dựng lại máy. Chỉ làm khi OWN đồng ý trong chat | – |
| Luật sư (OWN đã thuê, ESC-001) | Xác nhận có phải báo, báo cơ quan nào, theo mẫu nào, hạn tính từ đâu; đọc bản báo | Ý kiến pháp lý |

Mọi quyết định báo cơ quan chức năng hay báo khách viết một cách: **OWN quyết; SEC đề xuất; luật sư xác nhận.** Decision-log ghi người quyết là `OWN`.

Liên hệ: đội chỉ qua Claude Code (`/feedback`), không có số trực. Luật sư: OWN liên hệ. Cơ quan chức năng: theo kênh luật sư chỉ. Nhà cung cấp máy chủ: chỉ khi đội đề nghị.

**Xóa ảnh** chỉ có ở vai quản lý, chủ đầu tư (A74). Người trực chỉ có vai lễ tân: không **Gắn người**, ghi sổ, báo OWN ngay; OWN hoặc quản lý xóa.

## 2. Năm bước

| Bước | Việc | Ai | Hạn |
|---|---|---|---|
| 1. Phát hiện | Báo theo đường ở sổ vận hành 3.2, 3.3. Ghi giờ xảy ra và giờ phát hiện | Người thấy | Ngay |
| 2. Khoanh vùng | Chặn trước, hỏi sau, theo người làm ở bảng dưới. Không xóa sổ giao ca, nhật ký, thư mục sao lưu | Quầy, OWN, OPS | Ngay, trong ca |
| 3. Đánh giá | Dữ liệu gì, của bao nhiêu đơn, người ngoài đã thấy hay ghi được gì, còn đang lộ không. Chỉ dùng mã đơn và số đếm | SEC (+ OPS) | Trong ngày |
| 4. Quyết báo cơ quan chức năng | OWN quyết; SEC đề xuất; luật sư xác nhận. Quyết và lý do vào decision-log **chậm nhất giờ thứ 48**. Phải báo thì OWN gửi trước giờ thứ 72. Chưa ai trả lời: xem dưới bảng | OWN | ≤ 72 giờ |
| 5. Báo khách, nếu cần | Khi mức Cao, khi luật sư hay cơ quan yêu cầu, hoặc khi khách cần tự làm gì đó để giữ an toàn. CPY viết theo giọng OTTIMO, SEC duyệt, OWN gửi riêng tới liên hệ trên đơn (đã kiểm là đúng, mục 4 bước 1). Không báo người nhận nhầm, trừ khi SEC đề nghị (gửi link đúng cho người nhận nhầm là khách của đơn khác không phải là báo, mục 4 bước 2) | OWN | Theo luật sư |

**Bước 2 – ai chặn gì** (RBAC 0.2.9):

| Ai | Việc |
|---|---|
| Quầy (lễ tân trở lên) | **Thu hồi link** (A114). Nghi lộ mật khẩu của chính mình: tự đổi mật khẩu (A112). Báo OWN |
| OWN | Khóa tài khoản, đặt lại mật khẩu người khác (A100); thu hồi phiên (A115) và thiết bị được cấp (A110) – `guides/01` mục 1.9. Không duyệt phát hành. Quyết tạm tắt máy chủ |
| OPS | Khoanh vùng trên máy chủ, khi OWN đồng ý trong chat |

**Đồng hồ 72 giờ** tính từ giờ xảy ra nếu biết (ví dụ giờ gửi nhầm), không thì từ giờ phát hiện. Đây là cách tính chặt nhất, `[GIẢ ĐỊNH – chờ INV xác nhận]` (ESC-001 / Q12). Báo sau 72 giờ thì kèm lý do chậm. Nội dung báo: chuyện gì, lúc nào; loại dữ liệu và số khách liên quan; hậu quả có thể có; việc đã làm để chặn và giảm hại; người liên hệ phía OTTIMO. Biên bản và bản báo có thể có dữ liệu khách: OWN giữ ngoài kho mã, không gửi qua `/feedback`.

**Khi chưa ai trả lời** `[GIẢ ĐỊNH – chờ INV xác nhận]` (ESC-001 / Q12):
- **Mức Vừa, luật sư chưa trả lời tới giờ thứ 48:** làm như mức Cao. SEC soạn sẵn bản báo chỉ bằng số đếm; OWN quyết gửi hay không trước giờ thứ 72. Không gửi thì decision-log ghi lý do và "luật sư chưa trả lời".
- **OWN chưa trả lời:** ORC nhắc lại trong chat ở giờ thứ 24 và giờ thứ 48, kèm đề xuất của SEC và bản báo soạn sẵn. Tới giờ thứ 48 vẫn chưa có: ORC ghi decision-log "chưa có quyết định của OWN" kèm giờ đã nhắc. Đội **không** gửi thay OWN; chỉ OWN gửi được bản báo.

## 3. Mức sự cố (SEC xếp, dùng ở bước 4)

| Mức | Dấu hiệu | Báo cơ quan chức năng |
|---|---|---|
| Thấp | Không dữ liệu khách nào tới người ngoài: link chưa được mở trước khi thu hồi **và** tin gửi kèm chỉ có link, không tên, ngày ở hay căn của khách; mã 3 hóa ra do bản ngoài máy hỏng (mục 5 bước 3) | SEC đề xuất không báo. OWN quyết, lý do vào decision-log |
| Vừa | Người ngoài đã thấy dữ liệu của **một** đơn: ở trang khách (tên gọi, mã đơn, ngày ở, căn, giờ đến), hoặc ngay trong tin gửi kèm (tên, ngày ở, căn) dù link chưa mở; có thể đã ghi vào đơn. Link đã thu hồi | OWN quyết; SEC đề xuất; luật sư xác nhận. Tới khi luật sư cho ngưỡng (Q12): hỏi luật sư mỗi ca, trước giờ thứ 48; chưa trả lời thì theo mục 2 "Khi chưa ai trả lời" |
| Cao | Nhiều đơn; ảnh hay số giấy tờ, số điện thoại, email của khách ra ngoài; máy chủ bị xâm nhập | Mặc định chuẩn bị báo. Chỉ không báo khi luật sư trả lời rõ là không cần |

## 4. Nhánh A – Lễ tân gửi nhầm link check-in online

Nguồn: FB-R5-SEC-BA-01, `guides/02` mục 17.3 bước 5, Tờ 1. Tới lúc thu hồi, người nhận nhầm thấy trang khách mức 1 và ghi được vào đơn: tải ảnh, đổi giờ đến, gửi yêu cầu. Người đó không xem được ảnh giấy tờ đã tải.

1. **Quầy, ngay:** **Thu hồi link**. Rồi xem link vừa gửi đi tới đâu (câu DOM, `rounds/round-05/reviews/DOM-on-ba-card-v574-01.md` mục 1):
   - **Gửi nhầm do người gửi** (chọn nhầm hội thoại, gõ nhầm số, gửi nhầm email), liên hệ trên đơn vẫn đúng: **Tạo link mới**, gửi riêng 1–1 tới liên hệ ghi trên đơn.
   - **Đã gửi đúng liên hệ ghi trên đơn mà người nhận không phải khách** (người đó báo không đặt phòng, hoặc trả lời sai tên, sai ngày ở), hoặc **không chắc liên hệ nào là của khách**: liên hệ trên đơn sai. **Không tạo link mới** cho đơn này. Không gửi thêm tin nào về đơn tới liên hệ đó (xác nhận, nhắc giờ đến, đường đi). Khách làm giấy tờ tại quầy khi đến, như khách không check-in online (`guides/02` mục 7.2, 8). Không hỏi lại người nhận để kiểm (không nêu tên, ngày ở của khách cho họ xác nhận).
   - Đơn OTA còn hội thoại OTA của đơn: được nhắn khách **trong hội thoại đó**, một câu mời làm thủ tục tại quầy, không kèm link, không kể chuyện gửi nhầm.
   - Không sửa liên hệ trên đơn theo lời người nhận nhầm, hay theo người nhắn từ số khác dù xưng là khách. Sửa khi chính khách xác nhận: tại quầy sau khi đối chiếu giấy tờ, hoặc trong hội thoại OTA của đơn. Đơn do sale hay CTV tạo: báo người tạo đơn số đã sai, không gửi số mới qua họ.

   Ghi sổ giao ca theo mẫu ở mục 6, gồm **tin gửi nhầm kèm gì** (chỉ link, hay có tên, ngày ở, căn của khách) và **liên hệ trên đơn sai: có/không** (không chắc thì ghi **có**). Không chụp màn hình hội thoại gửi nhầm.
   - **Báo OWN** là nhắn thẳng tới OWN (liên hệ đã lưu sẵn trên điện thoại cơ sở) đúng dòng mẫu ở mục 6, không chỉ ghi sổ. Nhắn ngay khi xong bước này, muộn nhất **trong ngày**; sau 22:00 vẫn nhắn, OWN đọc lúc thức dậy. Có ghi lạ (bước 2): gọi OWN **ngay**.
2. **Quầy, khi cần:**
   - Trước giờ thu hồi, đơn đã hiện **Đã làm thủ tục trước**, giờ đến mới hay yêu cầu mới (**ghi lạ**)? Không dùng giấy tờ đó để khai báo. Ảnh không phải người trên đơn: không **Gắn người**, quản lý **Xóa ảnh**. Khi gửi link mới, hỏi lại khách giờ đến và các yêu cầu, không cần kể chuyện gửi nhầm (việc báo khách do OWN quyết, mục 2 bước 5). Không gửi link mới (liên hệ trên đơn sai): hỏi giờ đến và yêu cầu khi khách tới quầy; đơn OTA thì hỏi trong hội thoại OTA của đơn. Sửa giờ đến. Yêu cầu khách không gửi: hủy hoặc từ chối trên Desk, không tính phí. Khách đến: làm giấy tờ tại quầy như khách không check-in online (`guides/02` mục 7.2, 8).
   - Người nhận nhầm là khách của **đơn khác** của OTTIMO: gửi cho họ link của chính đơn họ, kèm một câu xin lỗi ngắn, không nói gì về đơn kia. SEC xác nhận: việc này không phải "báo người nhận nhầm". Ảnh họ đã tải lên đơn sai: không **Gắn người**, quản lý **Xóa ảnh**. Đơn của họ làm thủ tục bằng link đúng hoặc tại quầy.
3. **OWN, trong ngày:** gõ `/feedback` (không cần P0) với dòng mẫu ở mục 6.
4. **Đội, trong ngày:** khi OWN cho kết nối máy chủ, ORC đếm số lần link đã thu hồi được mở trước giờ thu hồi (truy vấn chỉ đọc theo mã đơn, chỉ ra số; OPS đang làm khối chạy, SEC ghim). Chưa đếm được thì coi như đã mở. Chưa biết tin kèm gì thì coi như có tên khách. SEC xếp mức: link 0 lần mở **và** tin chỉ có link là Thấp; link có mở, **hoặc** tin có tên, ngày ở hay căn, là Vừa; nhiều đơn bị gửi nhầm là Cao. Sau đó làm bước 4–5 ở mục 2.

## 5. Nhánh B – Lượt kéo sao lưu thoát mã 3 ("server copy changed")

**Bản ngoài máy** là bản sao lưu nằm ngoài máy chủ mà máy chủ không ghi đè, không xóa được. Hôm nay là thư mục trên Mac của INV (`pull-backups.sh` kéo về, `--ignore-existing`, README `infra/server` dòng "Bản sao lưu ngoài máy"). Khi bản sao lưu chuyển lên Google Drive công ty (INV quyết 07/11, OPS đang làm), các bước dưới giữ nguyên, "thư mục sao lưu ngoài máy" là nơi mới, **với điều kiện** máy chủ không ghi đè, không xóa được bản đã có ở đó (SEC kiểm điều kiện này khi review PR của OPS). Chưa có điều kiện đó thì bản trên Drive không dùng làm bản tin được ở bước 3, 4.

Nghĩa của mã 3: `pull-backups.sh` so nội dung từng bản đã có ở thư mục sao lưu ngoài máy với tệp cùng tên trên máy chủ. Máy chủ không bao giờ viết lại một bản sao lưu đã xong, nên khác nhau nghĩa là bản trên máy chủ đã bị đổi, có thể máy chủ bị xâm nhập. Script in `WARNING: server copy changed: <tên> – local copy kept`, vẫn kéo tệp mới, kiểm lại mọi `.sha256` ở thư mục ngoài máy, giữ nguyên bản đã có, rồi thoát 3. Mã 3 được báo thay cho mã 1, nên có thể có cả dòng `checksum mismatch` trong cùng lượt.

1. **ORC, ngay trong lượt kéo:** báo OWN trong chat: giờ chạy, mã thoát 3, số tệp bị báo, có dòng `checksum mismatch` không. Đây là P0 bảo mật (sổ vận hành 1.1a).
2. **Khoanh vùng, OWN quyết ngay:**
   - Không duyệt phát hành nào. Không xóa, không chuyển thư mục sao lưu ngoài máy.
   - **Không chạy lại `pull-backups.sh`, kể cả lịch tự động** (V5-60, hay lịch đồng bộ lên Drive khi có): tắt lịch trước. Mỗi lượt chạy kéo thêm tệp từ máy chủ đang bị nghi **và xóa bản ngoài máy quá 35 ngày**, mà bản bị xóa có thể là bản sạch cần cho bước 4. Lệnh tắt lịch: README `infra/server` (OPS thêm khi V5-60 xong).
   - Tệp kéo về **trong chính lượt thoát 3** cũng đến từ máy bị nghi: không dùng để dựng lại.
   - Không đăng nhập máy chủ tới khi SEC báo. Không dùng lại thứ gì lấy từ máy chủ: khóa, token, `.env`, bản sao lưu mới.
   - Đội có thể đề nghị tạm tắt máy chủ: Desk ngừng, quầy làm sổ giấy (sổ vận hành 3.2).
3. **Đánh giá, SEC + OPS, trong ngày, chỉ đọc, trong câu đồng ý của OWN.** Băm tin được là `.sha256` ở **thư mục ngoài máy**, không phải `.sha256` trên máy chủ: người đã sửa `X.age` trên máy chủ cũng sửa được `X.age.sha256` cho khớp.
   1. **Lấy bản máy chủ của đúng các tệp bị báo** bằng khóa kéo chỉ đọc (cùng lệnh `rsync` của script, chỉ đúng tên tệp đó). Kéo vào một thư mục **mới, trống, nằm ngoài** thư mục sao lưu. Không đăng nhập máy chủ, không chạy lệnh nào trên máy chủ. ORC chạy dòng lệnh OPS soạn ở README `infra/server` (dòng "Bản sao lưu ngoài máy"), chỉ in mã thoát và 8 ký tự băm.
   2. **Tính băm ở máy ngoài** (không dùng `sha256sum` của máy chủ), so với `.sha256` ở thư mục ngoài máy của tệp đó.
   3. **Kết luận:**
      - bản máy chủ khớp `.sha256` ngoài máy, và bản ngoài máy không khớp → bản ngoài máy hỏng, không phải xâm nhập: **mức Thấp**. Xử lý tệp hỏng theo cách xử lý mã 1 ở README `infra/server` (chuyển vào `quarantine/`, không xóa). SEC quyết khi nào xóa `quarantine/` (hạn 35 ngày, SR-BAK-03);
      - chỉ `.sha256` bị báo (`.age` không bị báo), và bản `.age` ngoài máy khớp `.sha256` vừa lấy từ máy chủ → `.sha256` ngoài máy hỏng: **mức Thấp**, xử lý như trên;
      - mọi ca khác (cả `.age` và `.sha256` cùng bị báo; hoặc không khớp bên nào; hoặc bản ngoài máy khớp `.sha256` của nó mà bản máy chủ khác) → coi như máy chủ đã bị xâm nhập, **mức Cao**. Đồng hồ 72 giờ tính từ giờ lượt kéo.
   4. Xong thì để nguyên thư mục tạm cho SEC xem. Không chép vào thư mục sao lưu.
4. **Mức Cao – SEC + OPS, khi OWN đồng ý trong chat:**
   - Dựng lại theo `runbook-vps-moi.md`, khối "Nghi bị chiếm quyền" (ca máy còn chạy và việc với máy cũ: tắt, giữ, hủy thuê – OPS ghi ở đó).
   - SEC chọn bản ngoài máy trước lúc nghi bị vào. `.last_pull` (lượt thoát 0 gần nhất) chỉ cho biết tệp bị sửa **sau** giờ đó, không cho biết lúc bị vào: SEC chọn theo dấu hiệu khác, không chắc thì lùi thêm một bản.
   - Xoay KEK và `id_hash_key`; bí mật tích hợp mới.
   - Coi mọi dữ liệu trên máy chủ, kể cả ảnh giấy tờ, là có thể đã lộ, vì khóa giải mã nằm cùng máy.
   - Sau đó làm bước 4–5 ở mục 2.

## 6. Mẫu dòng ghi

Dùng cho sổ giao ca, tin nhắn báo OWN, `/feedback` và decision-log. Chỉ có mã đơn, ngày giờ, kênh, tin kèm gì (chỉ loại, không chép nội dung) và việc đã làm:

- `SR-INC · nhánh A · đơn OTM-… · gửi nhầm 07/11 10:12 · tin: chỉ link / có tên / có ngày ở / có căn · thu hồi 10:20 · kênh Zalo · liên hệ trên đơn sai: có/không · link mới: đã tạo / không tạo · ghi lạ: có/không · ảnh đã xóa: có/không · báo OWN 10:25`
- `SR-INC · nhánh B · không có đơn · lượt kéo 08/11 19:05 · mã thoát 3 · 1 tệp bị báo · không có checksum mismatch · báo OWN 19:06`
- Decision-log (ORC): `| <ngày> | <round> | SR-INC nhánh <A/B> đơn OTM-…: mức <Thấp/Vừa/Cao>; SEC đề xuất <báo/không báo>; báo cơ quan chức năng <có, gửi lúc … / không, lý do …>; báo khách <có/không> | OWN | runbook-su-co-du-lieu-khach.md |`

Đổi mẫu nhánh A thì SEC báo BA chép lại vào `guides/02` 17.3 bước 5 và sổ tay 2.9 bước 6.

**Không bao giờ ghi:** tên, số điện thoại, email, số giấy tờ, ảnh của khách; tên hay số của người nhận nhầm; tên nhân viên (chỉ ghi vai); địa chỉ máy chủ, mật khẩu, khóa. Mọi thứ gõ qua `/feedback` vào kho mã công khai của dự án.

## Lịch sử

| Ngày | Bản | Người | Nội dung |
|---|---|---|---|
| 07/11/2026 | 1.2 | SEC | Round 5 – Phản hồi & sửa, theo OPS `rounds/round-05/reviews/OPS-on-sec-v5-74.md` và BA `BA-on-sec-v5-74.md` (trả lời ở `rounds/round-05/responses/SEC-responses.md` mục 8). OPS-01: nhánh B bước 3 so bản máy chủ với `.sha256` **ngoài máy**, lấy tệp bằng khóa kéo chỉ đọc vào thư mục tạm, không đăng nhập; ba ca kết luận. OPS-02: không chạy lại script, tắt lịch, tệp của lượt mã 3 không dùng. OPS-03: tệp hỏng theo cách xử lý mã 1 ở README (`quarantine/`). OPS-04: trỏ ca máy còn chạy và máy cũ sang runbook VPS mới. OPS-05: `.last_pull` không cho biết lúc bị vào. Nhánh B viết theo "bản ngoài máy" để dùng được khi sao lưu chuyển lên Google Drive công ty (INV 07/11). BA-01 (câu DOM `DOM-on-ba-card-v574-01.md` mục 1, nguyên văn, SEC thêm "không hỏi lại người nhận để kiểm"): nhầm do người gửi thì tạo link mới tới liên hệ trên đơn; liên hệ trên đơn sai hoặc không chắc thì không tạo link mới, không nhắn thêm, khách làm giấy tờ tại quầy; OTA mời qua hội thoại OTA; không sửa liên hệ theo lời người khác; mẫu dòng thêm "liên hệ trên đơn sai", "link mới: đã tạo / không tạo". BA-02: bước 2 tách theo người làm (A100, A110, A112, A114, A115). BA-03: một câu "OWN quyết; SEC đề xuất; luật sư xác nhận", decision-log người quyết `OWN`. BA-04: mặc định khi luật sư hay OWN chưa trả lời. BA-05: quầy dùng 17.3 và Tờ 1. BA-07: dòng "Dùng khi" thành gạch, bước 4 nhánh B có người làm, câu mã 3. BA-08: mặc định pháp lý tạm ghi `[GIẢ ĐỊNH – chờ INV xác nhận]` (ESC-001 / Q12) |
| 07/11/2026 | 1.1 | SEC | Round 5 – Phản hồi & sửa, theo DOM `rounds/round-05/reviews/DOM-on-sec-v5-74.md`. V574-01: mức Thấp cần cả link chưa mở **và** tin gửi kèm chỉ có link; tin có tên, ngày ở, căn là Vừa; mẫu dòng ghi tin kèm gì. V574-02: người nhận nhầm là khách đơn khác (gửi link đơn của họ, không phải "báo người nhận nhầm"), hỏi lại giờ đến và yêu cầu, hủy yêu cầu lạ không tính phí, làm giấy tờ tại quầy. V574-03: báo OWN là nhắn thẳng dòng mẫu, không chụp hội thoại, có ghi lạ thì gọi. V574-04: Xóa ảnh chỉ quản lý, chủ đầu tư (A74). Mẫu dòng thêm ngày, ghi lạ, ảnh đã xóa. `guides/02` 17.3 bước 5 sửa tối thiểu cho khớp |
| 07/11/2026 | 1.0 | SEC | Bản đầu (V5-74, Round 5 – Sản xuất), theo `rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md` mục 5 ý 1. Chờ review OPS, BA, DOM |
