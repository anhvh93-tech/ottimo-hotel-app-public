# Xóa tin khách gửi theo từng kênh – kiểm lời hứa "lễ tân sẽ xóa ngay tin bạn đã gửi ở phía OTTIMO"

- Người viết: INT | Round 5 (v1.0.5) – bước Review | Ngày: 07/11/2026
- Lượt 2 (07/11/2026, ORC giao thêm): thêm kênh **Facebook Messenger của fanpage** (hộp thư Trang trong Meta Business Suite, web và app). Sửa các mục 1–7 và dòng decision-log.
- Câu hỏi của CPY (`rounds/round-05/outputs/CPY/guest-reply-card-number.md` mục 5): với từng kênh, phía OTTIMO có xóa được tin **khách gửi** khỏi hộp thư của mình không. Không xóa được thì vế "sẽ xóa" là lời hứa không làm được.
- Căn cứ quy trình: SEC `rounds/round-05/responses/SEC-responses.md` mục 6.1 (trả lời trước, xóa ngay sau, xóa trên mọi máy đang mở tài khoản, email xóa cả thùng rác, ảnh thẻ xóa cả ảnh đã lưu) và 6.3 ca bất thường số 3 ("không xóa được").
- Cách làm: chỉ đọc trang hỗ trợ chính thức của từng dịch vụ (danh sách và ngày đọc ở mục 6). Bài hướng dẫn của bên thứ ba không dùng làm căn cứ. Chỗ tài liệu không nói rõ: ghi "chưa rõ – cần lễ tân thử trên máy thật". INT không đăng nhập tài khoản nào.

---

## 1. Kênh nào OTTIMO đang thật sự dùng (theo repo)

| Kênh | Bằng chứng trong repo | Còn chưa rõ |
|---|---|---|
| **Zalo OA** – lễ tân chat trên OA Manager | ESC-021 (INV quyết A ngày 17/10: chat OA ngay khi OA được xác thực); decision-log 17/10 (SEC: mỗi nhân viên một tài khoản quản trị, OA Manager bản web trên máy cơ sở, mini app trên điện thoại chỉ OWN/MGR); `product/docs/integrations/zalo-oa.md` 4.9 | Repo **không ghi OA đã được xác thực chưa**. Sổ tay `user-manual-v1.0.md` 2.4 vẫn giữ giả định "tài khoản Zalo của cơ sở (OA hoặc số cơ sở)". ESC-020 L2: chưa có OA thì nút Zalo trên website mở Zalo của **số hotline cơ sở** |
| **Zalo của số cơ sở** (tài khoản Zalo thường, dự phòng khi chưa có OA) | ESC-020 L2; sổ tay 2.4 | Có đang dùng song song với OA không |
| **WhatsApp, Telegram, Viber** | E-brochure `00-brief/context/landing/ebrochure-text.md` (một số chung cho cả ba, dành cho khách nước ngoài); landing mục "Kênh khác" (ESC-020) | Repo không ghi WhatsApp thường hay **WhatsApp Business**. Bảng này theo giao việc của ORC: app WhatsApp Business trên điện thoại |
| **Email** (hộp thư chung) | `product/docs/integrations.md` (cập nhật 23/10: hộp thư chung trên **Google Workspace**); sổ tay 0.3a (thêm một Gmail dùng cho OTA) | Hộp thư chung có mở bằng app khác qua IMAP/POP không (Outlook, Mail trên iPhone) |
| **SMS** | Sổ tay 2.4: "tài khoản Zalo/số điện thoại của OTTIMO trên điện thoại của cơ sở" | Repo không ghi điện thoại cơ sở là **iPhone hay Android**, dùng app tin nhắn nào |
| **Messenger** (fanpage Facebook) – lượt 2 | ESC-020 (landing có link fanpage); sổ tay nhắc Messenger ở luật giấy tờ và mã cửa | Repo **không ghi ai trả lời tin fanpage, bằng công cụ nào** (Hộp thư Meta Business Suite trên web hay app, hay Messenger khi chuyển sang Trang). CPY chưa có dòng cho Messenger (xem mục 3) |
| Ngoài danh sách giao: **hộp thư OTA** | CPY đã xếp vào ca 6.3 | INT không tra lượt này |

## 2. Bảng theo kênh

"Xóa ở phía OTTIMO" = tin không còn trong hộp thư của tài khoản OTTIMO. Cột "Máy khách" = xóa ở phía OTTIMO có làm mất tin ở máy khách không.

| Kênh | Phía OTTIMO xóa được tin khách gửi? | Thao tác (tên nút) | Máy khách | Giới hạn, chỗ hay sót | Khách tự thu hồi được không |
|---|---|---|---|---|---|
| **Zalo OA** (OA Manager web, mini app) | **Chưa rõ – cần lễ tân thử trên máy thật** (mục 4, T1). Trang hướng dẫn chính thức "Quản lý hội thoại" của OA chỉ có: chỉ định nhân viên, đánh dấu spam, lọc hội thoại. **Không có thao tác xóa tin hay xóa hội thoại** | Không tìm thấy. **"Đánh dấu spam" và nhãn "Hoàn thành" chỉ ẩn hội thoại, không phải xóa**; không được coi là đã xóa | Chưa rõ | Nhận xét của INT, không phải lời tài liệu: OA Manager chạy trên web, và Zalo có API cho OA "Lấy thông tin tin nhắn trong một hội thoại", nên lịch sử chat OA nằm ở máy chủ Zalo chứ không chỉ trên một máy. Muốn đúng lời hứa thì tin phải mất khỏi **tài khoản OA**, mọi quản trị viên đều không thấy nữa, chứ không chỉ mất trên một trình duyệt | Chưa rõ: tài liệu không nói khách có thu hồi được tin đã gửi cho OA không |
| **Zalo của số cơ sở** (tài khoản thường) | **Có** | Bấm giữ tin → **Xóa** (Zalo Help nhắc thao tác này ở trang dọn dẹp dữ liệu) | Tài liệu chính thức không nói. Chưa rõ – cần thử | Zalo Help: dữ liệu tin nhắn lưu trên thiết bị đang dùng. Xóa trên điện thoại có mất cả trên Zalo PC/Zalo Web cùng tài khoản không: **chưa rõ – cần thử** (T2). Ảnh thẻ: xóa cả ảnh trong thư viện ảnh nếu máy tự lưu | **Có, trong 24 giờ** sau khi gửi ("Thu hồi") |
| **WhatsApp** (app WhatsApp Business trên điện thoại) | **Có**, cả tin gửi lẫn tin nhận | Nhấn giữ tin → **Xóa** → **Xóa ở phía tôi** ("Delete for me") | **Không mất.** Trang hỗ trợ: xóa ở phía mình không ảnh hưởng đoạn chat của người nhận | Không nêu giới hạn thời gian cho "Xóa ở phía tôi". Xóa **đồng bộ trên mọi thiết bị đang trực tuyến** đã liên kết (WhatsApp Web, máy tính). Ảnh: nếu bật "Hiển thị file phương tiện" (Android) hoặc "Lưu vào Camera Roll" (iPhone), ảnh thẻ đã vào thư viện ảnh → xóa riêng. Bản sao lưu: trang hỗ trợ nói tin đã xóa không khôi phục được **trừ khi đã có trong bản sao lưu**. Trang hỗ trợ là trang chung của WhatsApp, không có trang riêng cho app WhatsApp Business → thử một lần (T3) | **Có, trong 2 ngày** ("Xóa đối với mọi người") |
| **Telegram** | **Có**, mọi tin trong chat 1–1, không giới hạn thời gian | Nhấn giữ tin → **Delete** / **Xóa**. Có ô **"Also delete for {tên khách}"**: đánh dấu thì tin mất ở **cả máy khách** | **Tùy ô đó**: không đánh dấu thì không mất; đánh dấu thì mất ở cả hai bên | FAQ: "You can always delete any messages you sent or received for both sides in any one-on-one conversation." FAQ không nói về tài khoản Telegram Business (repo không cho thấy OTTIMO dùng). Ảnh tự lưu vào thư viện: chưa rõ, kiểm cài đặt trên máy | **Có**, xóa cho cả hai bên, mọi lúc |
| **Viber** | **Có**, chỉ xóa phía mình | Nhấn giữ tin → **Delete** → **Delete for myself** | **Không mất.** "Delete for everyone" chỉ dùng cho tin **mình gửi** | Có mất cả trên Viber Desktop không: chưa rõ – cần thử (T4). Ảnh tự lưu vào thư viện: chưa rõ, kiểm cài đặt. Trang help.viber.com chặn tải trực tiếp (403), INT đọc qua kết quả tìm kiếm trong đúng tên miền đó → lễ tân thử để chắc | **Có** ("Delete for everyone" với tin của khách, kể cả khi OTTIMO đã đọc). Thời hạn: tài liệu không nêu |
| **Messenger** (hộp thư Trang: Meta Business Suite web và app; Messenger khi chuyển sang Trang) – lượt 2 | **Chưa rõ – cần lễ tân thử trên máy thật** (T7). Trang trợ giúp Meta Business Suite chỉ nói tới: đánh dấu chưa đọc, đánh dấu cần theo dõi, chuyển hội thoại sang thư mục **Spam** hoặc **Done** (nút "Mark as Done"). **Không nói Trang xóa được tin hay xóa hội thoại.** Trang trợ giúp Messenger có thao tác xóa nhưng viết cho tài khoản cá nhân, không nhắc tới Trang | Tài khoản cá nhân: rê chuột hoặc nhấn giữ tin → **Xóa** → **Xóa ở phía bạn** (tin đã nhận chỉ có lựa chọn này); xóa cả đoạn chat: **Xóa đoạn chat** (vĩnh viễn). Hộp thư Trang: chưa thấy tài liệu. **"Done", "Spam", "Lưu trữ" chỉ chuyển chỗ hoặc ẩn, không phải xóa**; không được coi là đã xóa | Tài khoản cá nhân: **không mất** ("Xóa ở phía bạn": người khác trong đoạn chat vẫn xem được; xóa đoạn chat: đoạn chat vẫn còn trong hộp thư người kia). Hộp thư Trang: chưa rõ | Trang trợ giúp nói thao tác trong Hộp thư tùy quyền của từng người với Trang. Nhận xét của INT: hộp thư Trang là hộp thư chung của mọi người có quyền nhắn tin thay Trang, nên giống Zalo OA, tin phải mất khỏi **hộp thư Trang** (mọi người có quyền đều không thấy), không chỉ trên một máy. Ảnh thẻ: ảnh đã tải về máy thì xóa riêng | **Có**: **Xóa đối với mọi người** với tin khách tự gửi (trước gọi là "Thu hồi với mọi người"). Tài liệu không nêu thời hạn |
| **Email** (hộp thư chung Google Workspace, Gmail cho OTA) | **Có** | Chọn thư → **Delete** (vào Thùng rác) → mở **Trash** → **Delete forever**, hoặc **Empty Trash now**. Thư nằm trong một chuỗi: dùng menu **More** cạnh nút Reply để xóa riêng thư đó. Tên tiếng Việt trên máy có thể khác chữ, lễ tân đối chiếu | **Không mất.** Thư khách gửi vẫn nằm trong hộp Đã gửi của khách. Trang Gmail không nói việc này; đây là cách email vận hành (mỗi hộp thư giữ một bản) | Thùng rác tự xóa sau 30 ngày; SEC đã yêu cầu xóa ngay trong Thùng rác. **Sau "Delete forever", quản trị viên Google Workspace vẫn khôi phục được thêm 25 ngày** (sau mốc 30 ngày); có Google Vault thì có thể giữ lâu hơn. Hộp thư mở bằng app khác qua POP: bản đã tải về máy đó không tự mất → chưa rõ cấu hình, cần kiểm (T5) | **Không**: email không thu hồi được |
| **SMS** (điện thoại cơ sở) | **Có**, tùy app tin nhắn | **iPhone (Tin nhắn):** nhấn giữ tin → **More** → thùng rác. Tin vào **Recently Deleted** (Đã xóa gần đây) tối đa 30 ngày → **xóa cả ở đó**. **Android (Google Messages):** nhấn giữ tin → **Delete**; trang thùng rác của Google Messages nói hội thoại đã xóa vào **Trash** 30 ngày → mở Trash kiểm. App tin nhắn khác (của hãng máy): chưa rõ – cần thử (T6) | **Không mất.** Apple: "You can't delete messages, attachments, and conversations for anyone else" | iPhone bật Tin nhắn trên iCloud: xóa đồng bộ trên mọi máy Apple cùng tài khoản. Hai trang của Google Messages nói khác nhau (một trang: xóa là vĩnh viễn; trang thùng rác: hội thoại vào Trash 30 ngày) → tùy phiên bản app, lễ tân kiểm Trash | **Không**: SMS không thu hồi được |

## 3. Kết luận cho CPY

| Kênh | Dùng bản nào | Thay đổi so với bảng "Chọn bản" ở mục 1 tệp CPY |
|---|---|---|
| **Zalo OA** (OA Manager) | **Chưa dùng bản ngắn mục 3** (có vế "sẽ xóa"). Dùng **bản bỏ vế xóa ở mục 5** khi SEC duyệt. Trước khi SEC duyệt, theo SEC 6.3 ca 3: lễ tân gọi chủ đầu tư. Nếu lễ tân thử T1 thấy OA xóa được tin khách gửi khỏi tài khoản OA (quản trị viên thứ hai cũng không còn thấy), INT báo lại để quay về bản ngắn mục 3 | **Có đổi.** Dòng "Zalo" tách hai dòng: Zalo OA và Zalo số cơ sở |
| **Zalo của số cơ sở** | Bản ngắn mục 3, giữ nguyên | Không đổi. Thêm: Zalo đang mở trên nhiều máy thì xóa trên từng máy, tới khi T2 cho biết xóa có đồng bộ không |
| **WhatsApp** (WhatsApp Business) | Bản đầy đủ mục 2, giữ nguyên | Không đổi |
| **Telegram** | Bản đầy đủ mục 2, giữ nguyên | Không đổi. Câu "on our side" vẫn đúng dù lễ tân có đánh dấu "Also delete for {tên khách}" hay không |
| **Viber** | Bản đầy đủ mục 2, giữ nguyên | Không đổi |
| **Email** | Bản đầy đủ, thư mới, bỏ câu 4 | Không đổi: CPY bỏ câu 4 là đúng (email không thu hồi được) |
| **SMS** | Bản đầy đủ, bỏ câu 4 | Không đổi: CPY bỏ câu 4 là đúng (SMS không thu hồi được) |
| **Messenger** (fanpage) – lượt 2 | **Giống Zalo OA.** Chưa dùng bản có vế "sẽ xóa". Dùng **bản bỏ vế xóa ở mục 5** khi SEC duyệt. Trước khi SEC duyệt, theo SEC 6.3 ca 3: lễ tân gọi chủ đầu tư. Nếu lễ tân thử T7 thấy tin khách gửi mất khỏi hộp thư Trang (người có quyền thứ hai cũng không còn thấy), INT báo lại để dùng **bản đầy đủ mục 2**, vì Messenger là app chat như WhatsApp, và khách có nút "Xóa đối với mọi người" nên câu 4 ("unsend" / "thu hồi") vẫn đúng | **Có đổi:** thêm dòng Messenger, CPY chưa có dòng này |

Lời nhờ khách thu hồi ("If your app allows, please unsend it as well" / "If you can, please recall it too") khớp với các kênh: Zalo thường 24 giờ, WhatsApp 2 ngày, Telegram mọi lúc, Viber có. "Nếu ứng dụng cho phép" / "Nếu được" che được ca hết hạn. Không cần sửa chữ.

## 4. Việc lễ tân thử trên máy thật (5–10 phút mỗi kênh, không dùng dữ liệu khách)

Người thử: lễ tân, có chủ đầu tư hoặc quản lý đi cùng. Tin thử gửi từ tài khoản của một nhân viên tới tài khoản OTTIMO. Nội dung chỉ là chữ "TEST XOA", **không có chữ số**, không có ảnh thẻ thật. Ghi kết quả (có / không / tên nút thấy trên máy) gửi ORC; INT cập nhật bảng mục 2 và báo CPY, BA.

| Mã | Kênh | Thử gì |
|---|---|---|
| T1 | Zalo OA | Trên OA Manager bản web: tin khách gửi có nút **Xóa** không (rê chuột, bấm chuột phải, menu ba chấm). Nếu có thì xóa, rồi nhờ **quản trị viên thứ hai** mở OA Manager (web và mini app) xem tin còn không. Tài khoản Zalo đã gửi tin thử còn thấy tin không |
| T2 | Zalo số cơ sở | Xóa tin trên điện thoại cơ sở → mở Zalo PC/Zalo Web cùng tài khoản (nếu có) xem tin còn không. Máy người gửi còn thấy tin không |
| T3 | WhatsApp Business | Có **Xóa ở phía tôi** cho tin nhận không. Sau khi xóa, WhatsApp Web hoặc máy tính đã liên kết còn thấy tin không. Cài đặt lưu ảnh vào thư viện đang bật hay tắt |
| T4 | Viber | Có **Delete for myself** không. Viber Desktop (nếu có) còn thấy tin không. Cài đặt tự lưu ảnh vào thư viện |
| T5 | Email | Hộp thư chung có mở bằng app nào khác ngoài Gmail không, có dùng POP không. Sau **Delete forever**, app đó còn thư không |
| T6 | SMS | Điện thoại cơ sở là iPhone hay Android, app tin nhắn tên gì. Sau khi xóa, có mục **Đã xóa gần đây** / **Thùng rác** không. Xóa hẳn ở đó được không |
| T7 | Messenger (fanpage) – lượt 2 | Gửi tin thử từ tài khoản Facebook của một nhân viên tới fanpage. Trên **Hộp thư Meta Business Suite** (web, rồi app): tin khách gửi có nút **Xóa** không; hội thoại có **Xóa hội thoại** không, hay chỉ có Done, Spam. Nếu có thì xóa, rồi nhờ **người có quyền thứ hai** với Trang mở Hộp thư xem tin còn không. Nếu OTTIMO còn trả lời bằng Messenger khi chuyển sang Trang, thử cả đường đó. Tài khoản đã gửi tin thử còn thấy tin không |

## 5. Ghi chú cho SEC và BA (không sửa tệp của vai khác)

1. **Zalo OA là kênh chat chính** (ESC-020, ESC-021). Nếu T1 cho thấy OA không xóa được tin khách gửi, thì **mọi lần khách gửi số thẻ qua OA** đều rơi vào SEC 6.3 ca 3. Messenger fanpage cũng vậy nếu T7 cho kết quả như thế (lượt 2) (gọi chủ đầu tư trong 1 giờ, kể cả ban đêm). Đề xuất SEC chọn một trong hai: (a) giữ nguyên, mỗi lần đều gọi; (b) coi "kênh không xóa được theo thiết kế" là ca thường có cách xử lý riêng: gửi bản mục 5, ghi sổ giao ca, báo chủ đầu tư trước khi hết ca. Đây là quyền SEC; INT không chọn thay.
2. **SMS có "Đã xóa gần đây" / "Thùng rác"** giống email. Câu chốt SEC 6.1 mới nhắc thùng rác email và ảnh. Đề xuất BA thêm vào câu sổ tay: "SMS thì xóa cả trong mục Đã xóa gần đây / Thùng rác của app tin nhắn", khi SEC đồng ý.
3. **Telegram** cho xóa tin của khách ở **cả máy khách** (ô "Also delete for {tên khách}"). Có nên đánh dấu ô này không là việc của SEC. Đánh dấu thì số thẻ mất ở cả hai bên mà khách không phải tự thu hồi; nhưng khách mất bản tin của mình mà không được báo trước. Chữ của CPY đúng với cả hai cách.
4. **Ảnh tự lưu vào thư viện:** WhatsApp có cài đặt "Hiển thị file phương tiện" (Android) và "Lưu vào Camera Roll" (iPhone). Đề xuất SEC/OPS cân nhắc **tắt tự lưu ảnh** trên điện thoại cơ sở cho WhatsApp, Viber, Telegram, Zalo. Khi đó bước "xóa cả ảnh đã lưu" ít bị sót. Đây là đề xuất, chưa phải quy định.
5. **Email Google Workspace:** sau "Delete forever", quản trị viên vẫn khôi phục được thêm 25 ngày, Vault (nếu bật) có thể giữ lâu hơn. Lời hứa "xóa ở phía OTTIMO" vẫn đúng với hộp thư lễ tân dùng. SEC xem phần còn khôi phục được ở phía quản trị có cần ghi vào SR-INC-01 không.
6. **Bản sao lưu** (WhatsApp lên Google Drive/iCloud, Zalo "Sao lưu và khôi phục"): bản sao lưu cũ có thể còn tin tới lần sao lưu sau. INT không đề xuất đổi chữ vì chuyện này. SEC biết để đánh giá.

## 6. Nguồn (đọc ngày 07/11/2026)

"Trực tiếp" = INT tải trang và đọc. "Qua tìm kiếm" = trang chặn tải hoặc chỉ tải được mục lục; INT đọc đoạn trích trong kết quả tìm kiếm **giới hạn đúng tên miền chính thức**.

| # | Dịch vụ | Trang | Cách đọc |
|---|---|---|---|
| S1 | WhatsApp | How to delete messages – https://faq.whatsapp.com/1370476507114859/?cms_platform=android&locale=en_US (cả bản tiếng Việt cùng địa chỉ) | Trực tiếp |
| S2 | WhatsApp | How to stop WhatsApp from saving media to your phone – https://faq.whatsapp.com/476272750957554/?cms_platform=android | Qua tìm kiếm (faq.whatsapp.com) |
| S3 | Telegram | Telegram FAQ, mục "Can I delete my messages?" và "Can I delete my data without deleting my account?" – https://telegram.org/faq | Trực tiếp |
| S4 | Telegram | Chuỗi giao diện "Also delete for %1$s" – https://translations.telegram.org/en/android/private_chats/ | Qua tìm kiếm (translations.telegram.org) |
| S5 | Viber | Chat knowledge base – https://help.viber.com/hc/en-us/articles/9423180947869-Chat-knowledge-base | Qua tìm kiếm (help.viber.com; tải trực tiếp bị 403) |
| S6 | Zalo | Gửi, thu hồi và chia sẻ tin nhắn – https://help.zalo.me/huong-dan/chuyen-muc/nhan-tin-va-goi/nhan-tin/gui-tin-nhan-mien-phi/ | Trực tiếp |
| S7 | Zalo | Cách dọn dẹp dữ liệu Zalo trên điện thoại – https://help.zalo.me/huong-dan/chuyen-muc/quan-ly-tai-khoan-zalo/cac-setting/don-dep-zalo-giai-phong-dung-luong-dien-thoai/ | Trực tiếp |
| S8 | Zalo OA | Quản lý hội thoại – https://oa.zalo.me/home/documents/guides/quan-ly-hoi-thoai_1287955702315829050 | Trực tiếp |
| S9 | Zalo OA | Lấy thông tin Tin nhắn trong một hội thoại – https://developers.zalo.me/docs/official-account/tin-nhan/quan-ly-tin-nhan/lay-thong-tin-tin-nhan-trong-mot-hoi-thoai | Trực tiếp, chỉ đọc được tiêu đề (trang dựng bằng JavaScript) |
| S10 | Gmail | Delete messages in Gmail – https://support.google.com/mail/answer/7401 | Trực tiếp |
| S11 | Google Workspace | Restore a user's permanently deleted email – https://knowledge.workspace.google.com/admin/support/troubleshooting/restore-a-users-permanently-deleted-email | Trực tiếp |
| S12 | Apple | Delete messages and attachments in Messages on iPhone – https://support.apple.com/guide/iphone/delete-messages-and-attachments-iph2c9c4bfcb/ios ; Recover deleted messages in Messages on iPhone – https://support.apple.com/guide/iphone/recover-deleted-messages-iph16ecebf48/ios | Qua tìm kiếm (support.apple.com; tải trực tiếp chỉ ra mục lục) |
| S13 | Google Messages | Archive, delete & read conversations – https://support.google.com/messages/answer/7028817?hl=en | Trực tiếp |
| S14 | Google Messages | Manage Trash folder in Google Messages – https://support.google.com/messages/answer/16962293?hl=en | Trực tiếp |
| S15 | Messenger | Xóa tin nhắn hoặc đoạn chat trên Messenger – https://www.facebook.com/help/messenger-app/194400311449172 | Trực tiếp (lượt 2) |
| S16 | Messenger | Xóa đoạn chat trên Facebook – https://www.facebook.com/help/messenger-app/192631610782421 | Trực tiếp (lượt 2) |
| S17 | Facebook | Xem và quản lý tin nhắn (mục "Xóa và lưu trữ tin nhắn": 4 bài, không bài nào về Trang) – https://www.facebook.com/help/1117039378334299 | Trực tiếp (lượt 2) |
| S18 | Meta Business Suite | Manage messages with Inbox in Meta Business Suite – https://www.facebook.com/business/help/294426838452244 | Qua tìm kiếm (facebook.com; tải trực tiếp chỉ ra tiêu đề) (lượt 2) |
| S19 | Meta Business Suite | Manage Conversations With Leads in Your Page Inbox – https://www.facebook.com/business/help/2485294494850848 | Qua tìm kiếm (facebook.com; tải trực tiếp chỉ ra tiêu đề) (lượt 2) |

Đã tìm mà **không thấy** trong tài liệu chính thức: thao tác xóa tin khách gửi trong OA Manager; API xóa hoặc thu hồi tin của Zalo OA; việc xóa tin trên Zalo thường có đồng bộ giữa các thiết bị không; trang riêng cho app WhatsApp Business về xóa tin; thao tác xóa tin hay xóa hội thoại trong Hộp thư Trang / Meta Business Suite; trang trợ giúp Messenger nào nói về xóa tin trong hộp thư của Trang (lượt 2).

## 7. Giả định

1. WhatsApp của OTTIMO là app WhatsApp Business trên điện thoại (theo giao việc của ORC; repo không ghi). Thao tác xóa giống app WhatsApp thường; T3 xác nhận.
2. Hộp thư chung là tài khoản Google Workspace (theo `integrations.md`). Gmail dùng cho OTA có thể là Gmail cá nhân. Thao tác xóa giống nhau; khôi phục bởi quản trị viên (mục 5 ý 5) chỉ áp cho Workspace.
3. Chưa biết OA đã được xác thực và đang dùng hay chưa. Vì thế mục 3 tách Zalo OA và Zalo số cơ sở.
4. Không có ESC: không phát sinh tiền, phạm vi, hợp đồng hay pháp lý mới. Tình trạng OA và loại điện thoại cơ sở lễ tân tự kiểm được ở T1, T6; ORC có thể hỏi chủ đầu tư gộp cuối round nếu cần.
5. (Lượt 2) Tin fanpage được trả lời bằng Hộp thư Meta Business Suite (web hoặc app), có thể cả Messenger khi chuyển sang Trang. Repo không ghi. T7 thử mọi đường OTTIMO đang dùng.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **INT – xóa tin khách gửi theo kênh, cho câu trả lời khi khách gửi số thẻ** (rounds/round-05/outputs/INT/message-deletion-by-channel.md; tra trang hỗ trợ chính thức 07/11/2026). Xóa được ở phía OTTIMO, không làm mất tin ở máy khách: WhatsApp ("Xóa ở phía tôi", đồng bộ thiết bị liên kết), Telegram (Delete; ô "Also delete for" xóa cả máy khách – SEC chọn), Viber ("Delete for myself"), email Google Workspace (Delete rồi Delete forever trong Trash; quản trị viên còn khôi phục được thêm 25 ngày), SMS (xóa cả trong Đã xóa gần đây/Thùng rác) → giữ bản đầy đủ CPY mục 2 (email, SMS bỏ câu 4). Zalo số cơ sở: có Xóa → bản ngắn mục 3. Zalo OA (OA Manager): hướng dẫn chính thức không có thao tác xóa tin khách gửi, chưa rõ → chưa dùng vế "sẽ xóa"; dùng bản bỏ vế xóa (CPY mục 5) khi SEC duyệt, tới lúc đó theo SEC 6.3 ca 3; lễ tân thử T1–T7 trên máy thật bằng tin "TEST XOA". Messenger fanpage (Hộp thư Trang / Meta Business Suite, lượt 2): trợ giúp chính thức chỉ có Done, Spam, không có xóa tin khách gửi; trợ giúp Messenger cá nhân có "Xóa ở phía bạn" nhưng không nhắc Trang → chưa rõ, xử lý như Zalo OA (bản CPY mục 5, thử T7; xóa được thì bản đầy đủ mục 2). Đề xuất SEC: cách xử lý khi OA hoặc Trang không xóa được, thêm thùng rác SMS vào câu 6.1, tắt tự lưu ảnh trên điện thoại cơ sở. Không ESC | INT | Quyền INT (kỹ thuật tích hợp kênh), theo tài liệu chính thức đối tác |`
