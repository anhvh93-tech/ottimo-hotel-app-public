# SEC – Bản sao thư bảo mật trong "Đã gửi" của `info@` (runbook v1.0.3 K8 bước 7 = "có")

- Người review: SEC | Round 4 – Bước **Review (sau phát hành v1.0.3)** | Ngày: 04/11/2026
- Đã đọc: runbook `rounds/round-04/outputs/OPS/v1.0.3-release-runbook.md` (K5b, K8 bước 7 nhánh "có", nhánh lỗi "Cảnh báo đường gửi dự phòng", mục E, F); `ARC-on-manual-1.8.md` mục 4; `DOM-on-manual-1.8.md` thẻ M18-10; decision-log 04/11 (phát hành 07:12, K8 giờ T 07:14, K9, dòng "Đã gửi info@: có"); backlog 5.6 (dòng PR33-S3 + M18-10, M18-01 phần mã, M18-08, G-BE-4); mã `integrations/notification/email-templates.ts`, `smtp.ts`, `services/api/src/jobs/email-adapter.ts`, `email-dispatch.ts`, `worker.ts`, `infra/server/mail-test.mjs`; `product/docs/security/data-risk-assessment.md` (L1, L2).
- Không SSH, không đọc `.env`, không đổi gì trên máy chủ. Không có địa chỉ email riêng, IP hay bí mật trong tệp này. `info@` ở đây là hộp thư chung của cơ sở.

## Kết luận

1. **Mức rủi ro: Low (hiện tại) → Medium nếu để nguyên khi MGR và nhân viên khác nhập email.** Chưa phải sự cố phải báo cơ quan chức năng, với điều kiện người đọc được `info@` chỉ là người của OTTIMO (giả định, INV xác nhận ở ESC-049; luật sư xác nhận cách hiểu). **Không chặn v1.0.3, không quay lui.**
2. **INV làm ngay:** xóa mọi bản sao thư OTTIMO trong "Đã gửi" của `info@` và dọn thùng rác (gồm cả thư thử `OTTIMO – Test message`). Từ nay, **mỗi lần nhận một thư OTTIMO – Security notice / Notice:, xóa bản sao trong ngày**. Trả lời 3 câu ở mục 3 (T2). Nếu không dùng Google Vault thì tắt **Lưu trữ thư toàn diện** (mục 4, B).
3. **v1.0.4:** đề xuất **B** (tắt lưu trữ thư toàn diện, INV tự làm, không tốn tiền), sau đó kiểm lại "Đã gửi" bằng một câu có/không. B không làm được (cần Vault) hoặc kiểm vẫn "có" thì chuyển sang **C1** (gửi từ một địa chỉ nhóm không có thành viên, miễn phí), cuối cùng mới **A** (hộp thư người dùng riêng chỉ để gửi, tốn 1 giấy phép). Đổi From (C1/A) phải đi **sau** BE sửa luật hộp thư chung cho chặn cả `info@` (M18-01 phần mã). Có ESC-049 vì INV phải tự làm trong Admin console, có thể tốn phí giấy phép và chỉ INV biết ai đọc `info@`.

---

## 1. Chuyện gì đã xảy ra, vì sao

- Production gửi thư bảo mật bằng đường chính `relay` (`smtp-relay.gmail.com`, xác thực theo IP máy chủ, không đăng nhập hộp thư nào), From = `info@` (`EMAIL_FROM`, K5b = 1).
- INV thấy thư "OTTIMO – Security notice…" trong "Đã gửi" của `info@`. ARC đã dự đoán ca này (mục 4): thư đi qua relay chỉ được lưu vào hộp thư của địa chỉ gửi khi Workspace bật **Lưu trữ thư toàn diện** (Comprehensive mail storage, ở mục Tuân thủ của Gmail).
- SEC hiểu như ARC, nhưng **chưa kiểm được trên tài khoản Workspace của OTTIMO**. Hai khả năng khác SEC không loại được khi chưa có câu trả lời của INV:
  - (i) `info@` là **bí danh** (alias) của một tài khoản người dùng, ví dụ tài khoản của INV. Khi đó "Đã gửi" mà INV thấy là của chính tài khoản đó, và người đọc là người dùng tài khoản đó.
  - (ii) Gói Workspace có Vault, nên đã bật sẵn lưu trữ toàn diện. SEC không chắc gói nào mặc định bật.
- Cài đặt **SMTP relay** (mục Định tuyến) có các tùy chọn người gửi được phép: "Chỉ người dùng đã đăng ký trong miền", "Chỉ địa chỉ trong miền của tôi", "Mọi địa chỉ". Theo hiểu biết của SEC, các tùy chọn này quyết định **ai được gửi**, không quyết định **có lưu bản sao hay không**. Trong mục relay **không có** tùy chọn "không lưu Đã gửi". Google cũng không có tùy chọn tên "Store and forward". SEC **chưa kiểm chứng** trên Admin console thật.

## 2. Mức rủi ro

### 2.1 Bản sao chứa gì

Mỗi bản sao là một thư gửi cho đúng một người nhận (`email-dispatch.ts`: một thư cho mỗi địa chỉ).

| Thành phần | Có trong bản sao | Ghi chú |
|---|---|---|
| Dòng `To:` | **Địa chỉ email riêng đầy đủ** của người nhận | Đây là phần nặng nhất. Trái luật nội bộ "địa chỉ email chỉ có trong DB và trong thư" |
| Tiêu đề, thân thư | Loại sự kiện (đổi email nhận thông báo, dùng mã khôi phục, đặt lại 2 bước, đổi tài khoản nhận cọc), **tên hiển thị** nhân viên (ở bản cho chủ, và ở bản `self`/`previous` tới khi làm xong G-BE-4), giờ, "do chủ cơ sở thực hiện" | Không có link, không có mã, không có mật khẩu |
| Thư "tài khoản nhận cọc đã thay đổi" | Ngày hiệu lực, giờ | **Không** có số tài khoản ngân hàng (đã đọc mẫu) |
| Thư thử `mail-test` (`OTTIMO – Test message…`) | Địa chỉ người nhận thử | Thư thử gửi trước đây cũng có thể nằm trong "Đã gửi" |

**Hiện có bao nhiêu:** K9 cho `done|-|1` và `user_email_change = 1`. Tức là tới giờ chỉ có **một** thư `email_changed`, gửi tới **địa chỉ riêng của chính INV**. Người có dữ liệu bị lộ cho đến nay là INV. INV cũng là người quyết định và đã xóa bản sao.

**Sẽ tăng thêm khi:**
- MGR nhập email (cần cho `email_missing` = 0 ở mục E). Mỗi lần nhập sinh 2 bản sao: thư `self` tới địa chỉ MGR và thư `owner` tới địa chỉ INV.
- Bất kỳ ai đổi email (thêm thư `previous` tới địa chỉ cũ), dùng mã khôi phục, bị đặt lại 2 bước, hoặc khi đổi tài khoản nhận cọc.
- Sau này có thư cho **khách** (OTP email SR-GST-07, xác nhận đặt phòng, bill) đi qua cùng đường SMTP. Hiện chỉ có topic `staff.email` đi qua SMTP (`worker.ts`), chưa có thư nào cho khách. Nếu có thì dữ liệu của khách cũng bị chép vào `info@`, và rủi ro lên **High** (xem S-1).

### 2.2 Ai đọc được

Chưa biết. Câu hỏi này nằm trong ESC-049. Những cách thường gặp với hộp thư chung của cơ sở nhỏ:
- nhiều người biết mật khẩu `info@` (lễ tân, sale, người nhà);
- `info@` được ủy quyền (Gmail delegation) cho tài khoản khác;
- `info@` mở bằng ứng dụng thư trên máy quầy hoặc điện thoại. Kiểu IMAP thì thư mục "Đã gửi" được đồng bộ về máy; xóa trên web thì máy cũng xóa theo, nhưng bản sao lưu của máy (nếu có) vẫn còn;
- người ngoài OTTIMO (đơn vị làm marketing, quản lý OTA, cộng tác viên) có quyền vào `info@`.

### 2.3 Đánh giá

| Tiêu chí | Đánh giá |
|---|---|
| Dữ liệu | Email riêng + tên hiển thị + giờ + loại sự kiện bảo mật. Đây là dữ liệu cá nhân **cơ bản**, không thuộc nhóm nhạy cảm (theo cách hiểu NĐ 13 Đ.2 của đội, `data-risk-assessment.md` L2). Không có giấy tờ, thẻ, mật khẩu, mã |
| Tác hại có thể có | Người đọc `info@` biết địa chỉ nào nhận thư bảo mật của chủ và quản lý. Kẻ có ý xấu có thể giả thư "Security notice" gửi đúng địa chỉ đó để lừa đảo. Người đọc cũng biết khi nào có sự kiện bảo mật. Người đọc **không** chặn hay xóa được thư đã tới người nhận, nên thư vẫn báo động được (ARC mục 4) |
| Khả năng xảy ra | Thấp nếu chỉ người tin cậy của OTTIMO đọc `info@`. Cao hơn nếu mật khẩu dùng chung, người đã nghỉ việc còn giữ mật khẩu, hoặc có người ngoài |
| **Mức** | **Low** ở hiện tại (1 thư, dữ liệu của chính INV, đã xóa). **Medium** nếu để nguyên khi MGR và nhân viên khác có email. **High** nếu có thư cho khách đi qua đường này, hoặc có người ngoài OTTIMO đọc `info@` |

### 2.4 Có phải sự cố dữ liệu cá nhân phải báo không

Đội **không** khẳng định tuân thủ pháp luật. Dưới đây là cách hiểu của SEC, cần luật sư xác nhận cùng ESC-001 (khung hiện hành: Luật 91/2025/QH15 có hiệu lực từ 01/01/2026 cùng các nghị định hướng dẫn; NĐ 13/2023 Đ.23 có mốc báo 72 giờ):
- Dữ liệu **không rời khỏi** hệ thống của OTTIMO (Workspace của OTTIMO). Người thấy được là người OTTIMO giao quyền dùng `info@`. Đây là **lệch kiểm soát nội bộ**: lưu thêm một bản không cần thiết, nhiều người xem hơn mức cần. SEC hiểu đây **không** phải "vi phạm" theo nghĩa lộ ra bên ngoài, nên **không** phải báo trong 72 giờ. Lý do thêm: người có dữ liệu duy nhất là INV, INV đã biết và đã xóa.
- **Phải xem lại ngay là sự cố có thể phải báo** (ORC báo SEC trong ngày, SEC mở quy trình sự cố) khi một trong các điều sau đúng:
  - (a) Người **ngoài OTTIMO** đọc được `info@` trong lúc có bản sao chứa địa chỉ của người khác ngoài INV.
  - (b) Có dấu hiệu tài khoản `info@` bị đăng nhập lạ (Google báo đăng nhập lạ, thiết bị lạ).
  - (c) Bản sao có dữ liệu của **khách**.
- Ghi vào sổ xử lý dữ liệu (SEC, `data-risk-assessment.md`, lượt v1.0.4): "bản sao thư nhân viên có thể nằm trong hộp thư Workspace của địa chỉ gửi; thời hạn: xóa trong ngày".

## 3. Biện pháp tạm (từ nay tới khi xong B/C1/A)

| # | Việc | Ai | Ghi chú |
|---|---|---|---|
| T1 | **Xóa bản sao.** Trong "Đã gửi" của `info@`, tìm và xóa các thư có tiêu đề bắt đầu bằng **"OTTIMO – Security notice"**, **"OTTIMO – Notice:"**, **"OTTIMO – Test message"**. Rồi vào Thùng rác xóa vĩnh viễn các thư đó. **Từ nay: mỗi lần INV nhận một thư OTTIMO – Security notice / Notice:** (mọi thư bảo mật đều có một bản tới chủ cơ sở), **xóa bản sao trong ngày**. Thêm một lượt rà vào sáng thứ Hai, gộp với lượt kiểm B1–B6 | **INV tự làm** (đội không xóa hộ, không đăng nhập `info@`) | Bộ lọc Gmail chỉ chạy với thư **đến**, không xóa tự động được thư trong Đã gửi. Có Vault và quy tắc giữ thư thì thư đã xóa vẫn nằm trong Vault tới hết hạn giữ; chỉ quản trị viên (INV) xem được. Chấp nhận được |
| T2 | **Trả lời 3 câu** (ESC-049): (1) `info@` là **tài khoản người dùng riêng**, **bí danh** của tài khoản khác, hay **nhóm**? (2) Ai đang vào được `info@`: số người, có người ngoài OTTIMO không, có máy quầy hay điện thoại đồng bộ không, có ủy quyền không? (3) OTTIMO có dùng **Google Vault** hoặc cần giữ thư gửi đi vì lý do pháp lý/kế toán không? | INV | Trả lời bằng chữ, **không** gửi ảnh, **không** gửi địa chỉ hay mật khẩu |
| T3 | **Siết quyền vào `info@`** (nên làm, không bắt buộc ngay): gỡ ủy quyền không cần, đăng xuất thiết bị lạ hoặc thiết bị cũ (trang Bảo mật của tài khoản Google). Đổi mật khẩu `info@` **chỉ khi** người đã nghỉ việc hoặc người ngoài còn biết mật khẩu | INV | Nếu `info@` là bí danh của tài khoản INV, chỉ cần INV không cho ai dùng chung tài khoản |
| T4 | **Không tạm dừng app.** Thư bảo mật vẫn cần tới người nhận. Dừng gửi thư nghĩa là mất báo động, nặng hơn rủi ro bản sao | – | – |
| T5 | **Mục E (`EMAIL_NO_RECIPIENT_ALERT`) không phải dừng.** Công tắc này chỉ đổi kết quả `ops-check` (journal + Google Chat), **không gửi thư**. Lịch E (≥ 24 giờ sau K8) giữ nguyên | ORC | – |
| T6 | **MGR nhập email:** vẫn làm (cần cho điều kiện 2 của mục E). Hẹn với INV: nhập trong ngày mà INV làm được T1 ngay sau đó (sinh 2 bản sao). Nếu INV chọn B và làm trước ngày MGR nhập: MGR nhập **sau khi B có hiệu lực**, và lần nhập này dùng luôn để kiểm B (ORC hỏi INV "Đã gửi info@: có/không" như K8 bước 7) | ORC hẹn, INV + MGR làm | Không cần thêm thư thử |
| T7 | **Không chuyển sang `app_password`** trừ khi có sự cố relay, đúng như runbook. Lưu ý: ở OTTIMO, đường `relay` hiện cũng để lại bản sao. Chuyển sang dự phòng không tăng rủi ro này nhưng giữ nguyên rủi ro mật khẩu trên máy chủ (SEC EMAIL-01). `mail-test --send` chỉ gửi tới địa chỉ INV, xong thì T1 | ORC, OPS | – |
| T8 | **S-1 (SEC quyết, điều kiện cứng):** **không** cho thư nào gửi khách (OTP email, xác nhận đặt phòng, bill, thông báo lưu trú) đi qua đường SMTP này cho tới khi đã kiểm "Đã gửi: **không**" sau B, hoặc sau khi đổi From sang hộp thư không ai đọc. Vi phạm = High, SEC chặn phát hành | PO, ARC, INT ghi vào điều kiện của các story thư khách | Hiện chưa có thư khách qua SMTP |
| T9 | Lượt kiểm mỗi sáng B1–B6 và việc đóng BUG-R3-032 **không đổi**. Bản sao trong `info@` không ảnh hưởng tới việc thư có tới người nhận hay không | – | – |

## 4. Phương án lâu dài (v1.0.4) – để PO/OPS xếp

| PA | Cách làm | Ưu | Nhược | Chi phí | Ai làm |
|---|---|---|---|---|---|
| **B – Tắt Lưu trữ thư toàn diện** (đề xuất số 1) | INV vào Admin console. **Đường dẫn theo tài liệu Google mà SEC biết, chưa kiểm trên tài khoản OTTIMO, chữ tiếng Việt có thể khác:** `admin.google.com` → **Ứng dụng** (Apps) → **Google Workspace** → **Gmail** → **Tuân thủ** (Compliance) → **Lưu trữ thư toàn diện** (Comprehensive mail storage) → bỏ chọn ô "Đảm bảo bản sao của mọi thư gửi và nhận được lưu trong hộp thư của người dùng liên quan" → **Lưu**. Có thể chỉ áp cho đơn vị tổ chức (OU) chứa `info@`, nếu OTTIMO có nhiều OU. Google ghi thay đổi có thể mất tới 24 giờ mới có hiệu lực. Kiểm chứng: thư bảo mật kế tiếp (T6) → INV trả lời "Đã gửi info@: có/không" | Không tốn tiền, INV làm trong khoảng 5 phút, không đổi mã, không đổi `.env`. Bỏ được bản sao cho **mọi** thư relay | Nếu OTTIMO dùng Vault hoặc cần lưu thư gửi đi thì mất phần lưu đó cho thư relay (ảnh hưởng mọi máy hay dịch vụ gửi qua relay, không chỉ app). Có người bật lại (ví dụ khi mua Vault) thì rủi ro quay lại mà đội không biết, nên cần lượt kiểm hằng tháng. Nếu nguyên nhân là (i) `info@` là bí danh thì B có thể không đủ | 0 đ | **INV** (đội không có quyền quản trị Workspace và không nhận quyền đó) |
| **C1 – From = địa chỉ nhóm không ai đọc** (đề xuất số 2) | INV tạo một **nhóm** Google (ví dụ `noreply@…`): không thành viên, chỉ chủ nhóm được đăng bài, không lưu lượt trao đổi cho thành viên. OPS đổi `EMAIL_FROM` sang địa chỉ này (đổi `.env`, INV đồng ý, bước riêng) | Không tốn giấy phép. Nhóm **không có hộp thư** nên theo hiểu biết của SEC sẽ không có chỗ chứa bản sao (**chưa kiểm chứng**). Không phụ thuộc cài đặt lưu trữ. Người đọc `info@` không còn thấy gì | Relay phải cho phép người gửi là "Chỉ địa chỉ trong miền của tôi". Nếu đang là "Chỉ người dùng đã đăng ký" thì thư bị từ chối (`550`) tới khi INV đổi cài đặt (mục **Định tuyến → Dịch vụ chuyển tiếp SMTP**, INV chỉ báo tên tùy chọn, không báo IP). Nhân viên bấm trả lời thư thì thư trả lời bị trả về (chấp nhận được, thư đã ghi "liên hệ chủ cơ sở"). **Phải làm sau BE-1 dưới đây** | 0 đ + khoảng 0,5 ngày OPS (đổi `.env`, K5b, README) | INV (tạo nhóm, xem cài đặt relay) + OPS + BE (BE-1) |
| **A – Hộp thư người dùng riêng chỉ để gửi** | INV tạo một **người dùng** Workspace (ví dụ `noreply@…`): mật khẩu ngẫu nhiên dài, bật 2 bước, không ủy quyền, không ai đăng nhập hằng ngày. OPS đổi `EMAIL_FROM` | Chắc chắn relay nhận (người dùng đã đăng ký). Tách hẳn khỏi `info@`. Nếu vẫn bật lưu trữ toàn diện thì bản sao nằm ở hộp thư không ai đọc | **Tốn 1 giấy phép người dùng mỗi tháng.** Đội không biết OTTIMO đang dùng gói nào và giá bao nhiêu; INV xem ở Admin console → **Thanh toán**. Hộp thư vẫn chứa bản sao, nên nếu tài khoản bị chiếm thì lộ cả. Vẫn **phải làm sau BE-1** | 1 giấy phép/tháng (INV xem giá) + 0,5 ngày OPS | INV + OPS + BE (BE-1) |
| C2 – Bí danh của `info@` | Thêm bí danh rồi gửi từ bí danh | – | **Loại.** Bản sao vẫn vào hộp thư `info@` | – | – |
| C3 – Dịch vụ gửi thư giao dịch bên ngoài (SES, Postmark…) | INT viết adapter mới | Không có hộp thư nào | **Loại cho v1.0.x.** Thêm bên thứ ba xử lý dữ liệu ở nước ngoài (chuyển dữ liệu ra nước ngoài, cần đánh giá tác động), thêm khóa API, thêm phí, mất DKIM/SPF đã ổn | Phí dịch vụ + vài ngày INT | – |
| C4 – Chỉ xóa tay mãi | T1 kéo dài | 0 đ | **Không chấp nhận lâu dài.** Phụ thuộc trí nhớ, dễ sót. Chỉ là biện pháp tạm | – | – |

**SEC đề xuất:** B nếu INV trả lời T2 câu (3) là "không dùng Vault / không cần giữ thư gửi". B không làm được, hoặc kiểm vẫn "có", hoặc T2 câu (1) cho thấy `info@` là bí danh thì **C1**. C1 bị relay từ chối mà INV không muốn đổi cài đặt relay thì **A**. Dù chọn cách nào: lượt kiểm "Đã gửi info@: có/không" chạy **một lần sau khi đổi**, rồi **mỗi tháng một lần** (gộp với lượt kiểm sao lưu hằng tháng của ORC). Câu trả lời vẫn chỉ có/không.

**Việc mã và vận hành đi kèm (v1.0.4):**
- **BE-1 (điều kiện trước khi đổi From – C1/A):** luật hộp thư chung hiện chỉ chặn đúng địa chỉ `EMAIL_FROM` (ARC M18-01). Nếu đổi From mà chưa sửa luật này thì **`info@` thành địa chỉ được phép làm email nhận thông báo**, mở lại lỗi FB-02 của sổ tay. Dòng backlog "FB-R4-ARC-BA-M18-01 (phần mã)" (danh sách hộp thư chung của cơ sở, ít nhất `info@` và `booking@`, so cả dạng `+x`) phải gộp **trước** lượt đổi `.env`. K5b và gate 2.7 đổi thành đếm "`info@` có trong danh sách hộp thư chung", không đếm `EMAIL_FROM`.
- **OPS-1:** README `infra/server` mục email và runbook mẫu: ghi "`relay` cũng lưu bản sao trong Đã gửi của địa chỉ gửi khi Workspace bật lưu trữ thư toàn diện (đã gặp ở OTTIMO 04/11)". Thêm lượt kiểm có/không ở trên. Gộp với dòng backlog PR33-S3 / M18-10 đang có.
- **SEC-1:** cập nhật `data-risk-assessment.md` (sổ xử lý: bản sao thư nhân viên trong Workspace, xóa trong ngày, điều kiện S-1).

## 5. Thẻ feedback

### FB-R4-SEC-OPS-SENT-01
- Mức độ: Minor
- Vị trí: `product/infra/server/README.md` mục email + 13.8; runbook mẫu từ v1.0.4 (mục chuyển `app_password`, K8 bước 7)
- Vấn đề: tài liệu ghi `relay` "thường không" lưu bản sao. Ở OTTIMO, đường `relay` **có** lưu (K8 bước 7 = "có", 04/11). Hướng dẫn xóa tay hiện chỉ gắn với đường dự phòng.
- Vì sao quan trọng: người vận hành sau này tưởng `relay` an toàn nên không xóa, địa chỉ riêng của nhân viên nằm lại trong hộp thư chung.
- Đề xuất sửa: ghi đúng như OPS-1 mục 4. Runbook có lượt kiểm "Đã gửi info@: có/không" sau mỗi lần đổi From hoặc cài đặt Workspace, và mỗi tháng một lần. Gộp vào dòng backlog PR33-S3 / M18-10.
- Trạng thái: Open

### FB-R4-SEC-BE-SENT-02
- Mức độ: Major (chỉ khi chọn C1/A; với B thì là Minor như dòng M18-01 đang có)
- Vị trí: luật `EMAIL_SHARED_MAILBOX` (API `setMyEmail` / đặt email cho người khác); dòng backlog "FB-R4-ARC-BA-M18-01 (phần mã)"
- Vấn đề: luật chỉ so với `EMAIL_FROM`. Đổi From sang một địa chỉ chỉ để gửi thì `info@` không còn bị chặn.
- Vì sao quan trọng: thư bảo mật lại có thể tới hộp thư chung, đúng lỗi BUG-R3-032 đã tránh (người khác đọc và xóa được thư báo của mình).
- Đề xuất sửa: BE-1 ở mục 4. Danh sách hộp thư chung là tham số cấu hình, không suy ra từ `EMAIL_FROM`. Thêm test "đổi `EMAIL_FROM` thì `info@` vẫn bị từ chối". ARC chốt thứ tự: PR này gộp và lên production **trước** lượt đổi `.env`.
- Trạng thái: Open

### FB-R4-SEC-PO-SENT-03
- Mức độ: Minor
- Vị trí: các story có thư gửi khách qua email (OTP email SR-GST-07, xác nhận đặt phòng, bill, thông báo lưu trú)
- Vấn đề: chưa có điều kiện nào ngăn thư khách đi qua đường SMTP đang để lại bản sao trong `info@`.
- Vì sao quan trọng: dữ liệu khách (email, tên, ngày ở) bị chép vào hộp thư chung là rủi ro High và có thể thành sự cố phải báo.
- Đề xuất sửa: thêm S-1 (mục 3 T8) vào AC/DoD của các story đó: "đã kiểm Đã gửi = không (sau B), hoặc From là hộp thư không ai đọc (C1/A)".
- Trạng thái: Open

## 6. ESC

**ESC-049** (`02-escalations/ESC-049.md`), mức **Bình thường**, hạn **07/11/2026** (trước khi MGR nhập email cho mục E và trước khi chốt phạm vi v1.0.4). Vì sao phải báo lên: (1) cài đặt Workspace chỉ INV làm được; (2) A tốn phí giấy phép; (3) chỉ INV biết ai đọc `info@` và có dùng Vault không. Dòng cho `escalations-index.md` (ORC thêm):

`| ESC-049 | Thư bảo mật để lại bản sao (có địa chỉ email riêng) trong "Đã gửi" của info@: B tắt Lưu trữ thư toàn diện (INV tự làm, 0 đ) / C1 gửi từ địa chỉ nhóm không ai đọc (0 đ) / A hộp thư riêng chỉ để gửi (1 giấy phép) + 3 câu: info@ là tài khoản/bí danh/nhóm, ai đọc, có dùng Vault | SEC | 4 | Bình thường (hạn 07/11/2026; không chặn v1.0.3) | Chờ INV | – (đội đề xuất B, dự phòng C1) |`

## 7. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-04 | 4 | SEC – K8 bước 7 "Đã gửi info@: có" (relay + lưu trữ thư toàn diện của Workspace, chưa kiểm trên Admin console): mức Low hiện tại (1 thư email_changed tới địa chỉ riêng của chính INV, đã xóa) → Medium nếu để nguyên khi MGR/nhân viên có email; dữ liệu = email riêng trong To + tên hiển thị + giờ + loại sự kiện, không link/mã/số tài khoản. SEC hiểu chưa phải sự cố phải báo (dữ liệu không rời Workspace OTTIMO, người đọc là người OTTIMO giao quyền – GIẢ ĐỊNH chờ INV xác nhận ở ESC-049, luật sư xác nhận cùng ESC-001); xem lại là sự cố trong ngày nếu có người ngoài đọc info@, đăng nhập lạ, hoặc có dữ liệu khách. Không quay lui, không dừng gửi thư, mục E không phải dừng (không gửi thư). Tạm: INV xóa bản sao "OTTIMO – Security notice"/"Notice:"/"Test message" trong Đã gửi + thùng rác, mỗi lần nhận thư bảo mật thì xóa trong ngày, rà thêm sáng thứ Hai; MGR nhập email vào ngày INV xóa được ngay (hoặc sau khi B có hiệu lực, dùng làm lượt kiểm). S-1 (SEC chặn): không thư khách nào qua SMTP tới khi Đã gửi = không hoặc From đổi sang hộp không ai đọc. v1.0.4: B (tắt Lưu trữ thư toàn diện, INV tự làm) → kiểm có/không; không được thì C1 (From = nhóm không thành viên) rồi A (người dùng riêng, 1 giấy phép); đổi From chỉ sau BE sửa luật hộp thư chung chặn info@ độc lập với EMAIL_FROM (FB-R4-SEC-BE-SENT-02). Lượt kiểm có/không mỗi tháng. Mở ESC-049 | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật); rounds/round-04/reviews/SEC-on-info-sent-copies.md |`

## 8. Dòng backlog 5.6 đề xuất (PO xếp)

`| **SEC-SENT – bản sao thư bảo mật trong "Đã gửi" của info@** (K8 bước 7 = "có", 04/11) | (1) Theo ESC-049: B (INV tắt Lưu trữ thư toàn diện) hoặc C1/A (đổi EMAIL_FROM sang hộp thư chỉ để gửi; OPS bước đổi .env, K5b/gate 2.7 đếm theo danh sách hộp thư chung). (2) FB-R4-SEC-BE-SENT-02: luật EMAIL_SHARED_MAILBOX dùng danh sách hộp thư chung cấu hình được (gộp với M18-01 phần mã), test "đổi EMAIL_FROM vẫn chặn info@" – **gộp trước** mọi lượt đổi From. (3) FB-R4-SEC-OPS-SENT-01: README/runbook ghi relay cũng lưu bản sao khi bật lưu trữ toàn diện; lượt kiểm "Đã gửi info@: có/không" sau mỗi thay đổi và mỗi tháng (gộp dòng PR33-S3 / M18-10). (4) FB-R4-SEC-PO-SENT-03: điều kiện S-1 vào AC/DoD mọi story có thư gửi khách | **v1.0.4 – bắt buộc** cho (2) nếu chọn C1/A, và cho (3); (1) theo ngày INV quyết ESC-049; (4) trước story thư khách đầu tiên | INV (Admin console) + OPS; BE-A → ARC, SEC, QA; PO (AC) | rounds/round-04/reviews/SEC-on-info-sent-copies.md; ESC-049 |`

## 9. Điểm làm tốt

- ARC đoán trước đúng ca này (ARC-on-manual-1.8 mục 4), và runbook có sẵn bước 7. Nhờ vậy lỗi lộ ra 30 phút sau thư đầu tiên, lúc chỉ có địa chỉ của chính INV.
- Bước 7 chỉ hỏi có/không: không ai mở thư, không ai dán địa chỉ vào chat hay repo. Ảnh INV gửi trong chat không vào repo.
- Đường chính `relay` không có mật khẩu trên máy chủ (SEC EMAIL-01 A) vẫn đúng. Rủi ro mới nằm ở cài đặt Workspace, không ở mã, nên không cần hotfix.
