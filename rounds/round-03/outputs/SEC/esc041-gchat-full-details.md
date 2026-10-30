# SEC – ESC-041 = C: tin Google Chat gửi đủ thông tin yêu cầu đặt phòng

- Tác giả: SEC | Round 3 – Bước: Sản xuất | Ngày 30/10/2026
- Căn cứ: ESC-041 (đã quyết C, cập nhật 30/10: **chạy mức C ngay từ v1.0.1**, luật sư của INV lo phần pháp lý, INV giữ văn bản ngoài repo); decision-log 30/10 (hai dòng ESC-041); thiết kế ARC `rounds/round-03/outputs/ARC/gchat-booking-request-notify.md`; review SEC `rounds/round-03/reviews/SEC-on-us155-enable.md` mục 2.4 và 4; thông báo đang chạy `product/apps/landing-web/src/content/privacy.ts` version `2026-10-24`; thư luật sư `04-investor-feedback/lawyer-questions-2026-10-26.md`.
- Tệp này không chứa dữ liệu thật, URL webhook, mật khẩu hay khóa. Không sửa mã. SEC không kết luận pháp lý: mọi câu về luật ở mục 2 là câu hỏi để luật sư trả lời.

## 0. Kết luận nhanh

| Câu | SEC chốt |
|---|---|
| Version thông báo mới | **`2026-10-31`** (ngày dự kiến chốt chữ sau khi UXD duyệt giọng). Chốt chữ ngày khác thì lấy đúng ngày đó. Sửa lần hai trong cùng ngày thì thêm `.1`. Chỉ đổi `privacy.ts`; **không** đổi ô đồng ý A.1/A.2 trong `en.ts`/`vi.ts`. |
| Phát hành | Cùng v1.0.1, theo quyết định INV. Luật sư xem câu mới để tham khảo, **không chặn**. |
| Gửi luật sư | Đổi thành **ghi chú tham khảo** (mục 2). Không phải điều kiện bật C. |
| Điều kiện bật C | Không còn điều kiện pháp lý. Còn **8 việc kỹ thuật/vận hành bắt buộc** (mục 3.1, ký hiệu ★). Đây là yêu cầu bảo mật thuộc quyền SEC, không phải chờ luật sư. Quan trọng nhất: (1) tin trong phòng Chat **tự xóa**, nếu không thì câu "xóa trong 180 ngày" đã đăng sẽ thành sai; (2) chi tiết khách **chỉ gửi cho yêu cầu khách gửi theo thông báo mới**; (3) chống chèn định dạng/link/@all từ tên và lời nhắn; (4) thành viên phòng chỉ gồm OWN/MGR/lễ tân, tài khoản @ottimo.vn có xác minh 2 bước. |
| Thẻ cũ | FB-R3-SEC-ARC-GCHAT-01 (Major, cắt nội dung theo S1) **hết hiệu lực** vì INV đã quyết ESC-041 = C. Thay bằng các yêu cầu ở mục 3. FB-R3-SEC-ARC-GCHAT-02 (bí mật webhook, chống tin giả) **vẫn giữ**, nay quan trọng hơn. |
| ESC mới | **Không.** Chỉ có thể phát sinh nếu phòng Chat không tắt được lịch sử và cách thay thế duy nhất tốn tiền (Google Vault) – xem 3.1 ★1. |

---

## 1. Thông báo xử lý dữ liệu – version `2026-10-31`

### 1.1 Nguyên tắc

- Sửa **ít câu nhất** so với bản `2026-10-24` đã được luật sư đọc. Câu nào không đổi thì giữ nguyên văn.
- Mọi câu mới phải **đúng với hệ thống lúc đăng**. Câu nào phụ thuộc cấu hình chưa kiểm (thời gian tự xóa tin Chat) thì FE-B chỉ điền sau khi INT/INV kiểm xong trên phòng thử (★1).
- Giọng: ngắn, lịch sự, điềm tĩnh; tiếng Anh dẫn, tiếng Việt hỗ trợ; không emoji (brand guideline). UXD duyệt giọng trước khi chốt.
- Tên bên nhận ghi **"Google (Google Workspace)"**, cùng cách gọi với câu email đã có. Không ghi tên pháp nhân Google, vì đội chưa xác nhận bên ký hợp đồng Workspace với OTTIMO (xem 2, câu 5).

### 1.2 Các thay đổi (FE-B chép vào `privacy.ts`)

Ký hiệu: **[Sửa]** thay câu cũ, **[Thêm]** câu mới, **[Giữ]** không đổi.

**(1) "How we handle it" / "Cách xử lý" – đoạn 1 [Sửa]**

Câu cũ nói dữ liệu lưu ở Việt Nam và chỉ người được giao xem được. Ở mức C, một bản sao đi vào phòng Chat. Câu "chỉ người được giao" vẫn đúng **với điều kiện** phòng không có nhân viên bán phòng (★4).

- EN: `Your details are stored on our server in Viet Nam. Only our reception, our managers and the sales staff assigned to your request can see them. To alert the team on duty, a copy of your request is also posted to our private staff chat, as described below.`
- VI: `Thông tin được lưu trên máy chủ của OTTIMO tại Việt Nam. Chỉ lễ tân, quản lý và nhân viên bán phòng được giao yêu cầu của bạn mới xem được. Để báo cho nhân viên đang trực, một bản sao yêu cầu của bạn cũng được đăng vào phòng trò chuyện nội bộ của OTTIMO, như mô tả dưới đây.`

**(2) "Who else receives it" / "Bên khác nhận thông tin" – thêm đoạn 3 [Thêm]**

Đủ 5 ý ORC giao: bên nhận, dữ liệu gửi, mục đích, nơi lưu ngoài Việt Nam, thời hạn.

- EN: `When you send a request, we post your name, contact, preferred channel, dates, number of guests and message to a private chat used only by our managers and reception, on Google Chat (Google Workspace). We do this only so that the person on duty can reply to you quickly. Google stores these messages on its servers, which may be outside Viet Nam. Messages in this chat are deleted within {chatRetentionEn}.`
- VI: `Khi bạn gửi yêu cầu, OTTIMO đăng tên, liên hệ, kênh bạn chọn, ngày ở, số khách và lời nhắn của bạn vào một phòng trò chuyện chỉ dành cho quản lý và lễ tân, trên Google Chat (Google Workspace). Việc này chỉ để người đang trực trả lời bạn nhanh hơn. Google lưu các tin này trên máy chủ của họ, có thể đặt ngoài Việt Nam. Tin trong phòng này được xóa trong {chatRetentionVi}.`

Giá trị `{chatRetention…}` (FE-B điền **sau** ★1):

| Kết quả kiểm ★1 | EN | VI |
|---|---|---|
| Phòng tắt được lịch sử (Google tự xóa tin sau 24 giờ) – **SEC đề xuất** | `24 hours` | `24 giờ` |
| Không tắt được, dùng cách xóa khác chạy mỗi ngày (★1 cách 2–3) | `7 days` | `7 ngày` |

Không có cách nào xóa chắc chắn trong 7 ngày thì **không đăng câu này và không bật C** (xem ★1).

Câu "keeps your hashed IP…" không vào Chat: IP băm, trang nguồn, nhãn chiến dịch và ghi chú từ chối **không** gửi ở mức nào.

**(3) "How long we keep it" / "Thời gian lưu" – đoạn 2 [Sửa: thêm 1 câu cuối]** – khoảng trống (a) IP băm, câu đã chốt ở `SEC-on-us155-enable.md` 2.4 (1):

- EN (thêm cuối đoạn 2): `The one-way encrypted form of your IP address is deleted within 30 days.`
- VI (thêm cuối đoạn 2): `Địa chỉ IP ở dạng đã mã hóa một chiều được xóa trong 30 ngày.`

Kiểm trước khi đăng: `retention.web_request_ip_hmac_days` production ≤ 30 (biên SEC 7–30).

**(4) "Your rights" / "Quyền của bạn" – đoạn 2 [Sửa câu cuối]**

Câu cũ "we … delete the request" phải bao cả bản sao trong Chat.

- EN: `If you withdraw your consent, we stop contacting you and delete the request, including any copy left in our staff chat.`
- VI: `Khi bạn rút lại sự đồng ý, OTTIMO ngừng liên hệ và xóa yêu cầu, kể cả bản sao còn lại trong phòng trò chuyện nội bộ.`

**(5) Ba khoảng trống còn lại – [Giữ] trong version này**

| Khoảng trống | Quyết | Lý do |
|---|---|---|
| (b) "notice for staying guests" chưa công khai | Giữ câu cũ | Chưa có trang thông báo khách lưu trú công khai. Câu thay ở 2.4 (2) chỉ dùng khi có trang đó. |
| (c) Hạn lưu tên/SĐT trong hồ sơ khách | Giữ câu cũ | Chưa có job xóa tương ứng. Viết số mà không xóa thật thì câu thành sai. Vẫn trong yêu cầu SEC cho v1.1. |
| (d) Tên cơ quan nhận khiếu nại | Giữ câu cũ, **trừ khi** luật sư nêu tên trước ngày chốt chữ | Có tên thì dùng câu 2.4 (3). Đội không tự điền tên cơ quan. Đã đưa vào ghi chú luật sư (câu 6). |

**(6) Câu đếm truy cập C+ (Cookies, đoạn 2)** – chỉ thêm nếu bản landing phát hành cùng version này **đã bật** đếm C+. Chưa bật thì không thêm (đăng "có đếm" khi chưa đếm là sai). Nguyên văn Phụ lục A/B thư 26/10:
- EN: `To see how the website is used, we count page views and taps as daily totals only – without cookies, IP addresses or anything that identifies you.`
- VI: `Để biết website được xem thế nào, OTTIMO chỉ đếm tổng lượt xem và lượt bấm theo ngày – không dùng cookie, không lưu địa chỉ IP hay bất cứ thông tin nào nhận diện bạn.`

**(7) Ô đồng ý trên form – [Giữ]**

Câu "only to reply to this request" vẫn đúng: tin Chat chỉ phục vụ việc trả lời yêu cầu. Giữ nguyên ô đồng ý để version mới chỉ đổi trang thông báo. Nếu luật sư muốn ô đồng ý nêu riêng việc gửi ra nước ngoài (ghi chú luật sư, câu 4) thì đổi cả hai và version tăng `.1`. Câu gợi ý có sẵn cho trường hợp đó:
- EN (dòng nhỏ dưới ô, thêm cuối): `To alert our team, your request is also posted to our staff chat on Google Workspace, outside Viet Nam.`
- VI: `Để báo cho nhân viên, yêu cầu của bạn cũng được đăng vào phòng trò chuyện nội bộ trên Google Workspace, ngoài Việt Nam.`

### 1.3 Quy trình phát hành version

1. UXD duyệt giọng (đặc biệt độ dài câu ở 1.2 (2)) → chốt chữ, đặt `VERSION`.
2. INT/INV xong ★1 → FE-B điền `{chatRetention…}`.
3. FE-B dựng landing, CI qua `check:dist` + Playwright. QA đối chiếu chữ trên trang với tệp này.
4. OPS ghi `privacy_notice_version` cho `vi` + `en` **chỉ bằng** `publish-privacy-notice` (PR #15), dòng `2026-10-24` được đặt `superseded_at`. Không SQL tay.
5. INV gửi luật sư phần chữ mới (mục 2, Phụ lục) để tham khảo. Luật sư sửa câu nào thì làm version kế tiếp, không gỡ trang đang chạy.

Thứ tự giữa landing và api v1.0.1 không quan trọng về mặt dữ liệu nhờ ★2: yêu cầu nào khách gửi theo `2026-10-24` thì không bao giờ được gửi chi tiết vào Chat.

---

## 2. Ghi chú để INV chuyển luật sư tham khảo (1 trang)

> **Ghi chú cho anh/chị (INV) – không gửi phần này.** Anh/chị đã báo luật sư xác nhận việc này không vướng và luật sư lo phần pháp lý, nên đội **không chờ** trả lời để chạy. Ghi chú dưới đây chỉ giúp luật sư có đủ dữ kiện kỹ thuật khi lập hồ sơ (nếu cần). Có trả lời thì chuyển nguyên văn cho ORC; đội chỉ sửa câu chữ theo trả lời. Không đính kèm URL webhook, mật khẩu, hay dữ liệu khách thật.

---

**Kính gửi Luật sư ……………………,**

Bổ sung cho thư ngày 26/10/2026, OTTIMO Boutique Stay (Công ty Cổ phần UTMG Living, MST 5801551657) xin gửi Luật sư dữ kiện về một thay đổi chạy từ bản phần mềm 04/11/2026, để Luật sư tham khảo khi hoàn thiện hồ sơ pháp lý.

**Thay đổi.** Mỗi khi khách gửi form "Yêu cầu đặt phòng" trên ottimo.vn, hệ thống tự đăng một tin vào phòng trò chuyện nội bộ trên **Google Chat (Google Workspace, tài khoản @ottimo.vn)**. Tin có: mã yêu cầu, giờ nhận, hạn phản hồi, ngày ở, số đêm hoặc số tháng, số người lớn và số trẻ em theo nhóm tuổi, **tên, số điện thoại hoặc email, kênh khách chọn (Zalo/WhatsApp/gọi/email), lời nhắn**. Không gửi IP, giấy tờ, thông tin thanh toán. Mục đích duy nhất: người đang trực biết ngay để trả lời khách. Thành viên phòng chỉ gồm chủ, quản lý và lễ tân. Máy chủ Google có thể đặt ngoài Việt Nam; dữ liệu gốc vẫn lưu trên máy chủ tại Việt Nam. Tin trong phòng tự xóa sau {24 giờ / 7 ngày}. Khách tích ô đồng ý (không tích sẵn) trước khi gửi; thông báo xử lý dữ liệu version `2026-10-31` (đính kèm phần chữ mới) nêu rõ việc này. Trước đây, OTTIMO đã dùng email Google Workspace để trả lời khách, và thông báo `2026-10-24` đã nêu việc đó.

**Câu hỏi để Luật sư tham khảo** (trả lời "Đồng ý" hoặc "Sửa: …"):

1. **Văn bản áp dụng.** Chúng tôi hiểu Nghị định 13/2023/NĐ-CP (Điều 25 về chuyển dữ liệu cá nhân ra nước ngoài) đã được thay bằng Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 và Nghị định 356/2025/NĐ-CP từ 01/01/2026. Nhờ Luật sư xác nhận văn bản và điều khoản áp dụng cho việc này. Hiểu của chúng tôi lấy từ tài liệu tổng hợp, có thể sai.
2. **Có phải "chuyển dữ liệu cá nhân ra nước ngoài" không?** Dữ liệu chỉ đi vào tài khoản Google Workspace của chính OTTIMO, do Google lưu thay. Việc dùng email Google Workspace để trả lời khách từ trước có thuộc cùng diện không?
3. **Hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài.** (a) Có phải lập không, hay doanh nghiệp quy mô của OTTIMO thuộc diện được miễn/hoãn? (b) Nếu phải lập: một hồ sơ chung cho Google Workspace (Chat + email) có đủ không; nội dung tối thiểu; nộp cho cơ quan nào (chúng tôi hiểu là Bộ Công an – Cục A05), nộp bản giấy hay trực tuyến; hạn nộp tính từ ngày nào (theo Nghị định 13 là 60 ngày kể từ khi xử lý – nay còn đúng không); khi nào phải cập nhật. (c) Có phải thông báo riêng cho cơ quan sau khi chuyển không. Nếu cần, đội kỹ thuật soạn sẵn phần mô tả hệ thống, dữ liệu và biện pháp bảo vệ để Luật sư hoàn thiện.
4. **Sự đồng ý.** Form đã có ô đồng ý không tích sẵn với câu "chỉ dùng để trả lời yêu cầu này". Như vậy đã đủ chưa, hay ô đồng ý phải nêu riêng việc gửi ra nước ngoài? Chúng tôi có sẵn một câu bổ sung (Phụ lục, mục "Ô đồng ý") nếu Luật sư thấy cần.
5. **Hợp đồng với Google.** Chấp nhận Phụ lục xử lý dữ liệu của Google (Cloud Data Processing Addendum) trong trang quản trị Workspace có đủ làm thỏa thuận với bên xử lý dữ liệu không? Bên ký hợp đồng Workspace với OTTIMO là pháp nhân Google nào (anh/chị INV kiểm trên hóa đơn) – có ảnh hưởng gì không?
6. **Thông báo version `2026-10-31`.** Các câu mới (Phụ lục) đã đủ chưa? Nhân tiện, xin Luật sư nêu đúng tên cơ quan nhận khiếu nại về dữ liệu cá nhân để chúng tôi ghi vào mục "Complaints".
7. **Yêu cầu xóa.** Khi khách yêu cầu xóa, bản sao trong Google Chat tự xóa trong {24 giờ / 7 ngày}, còn Google xóa khỏi bản sao lưu của họ theo chính sách riêng. Như vậy có đáp ứng thời hạn xử lý yêu cầu xóa không?

Trân trọng,
…………………… – Công ty Cổ phần UTMG Living – OTTIMO Boutique Stay · info@ottimo.vn

**Phụ lục (đính kèm):** nguyên văn các câu [Sửa]/[Thêm] ở mục 1.2 (1), (2), (3), (4) của tệp này, EN và VI, đã điền thời hạn; câu ô đồng ý dự phòng 1.2 (7).

---

## 3. Việc kỹ thuật và vận hành trước khi chuyển cấu hình sang C

Mặc định mã v1.0.1 vẫn là **A** (ESC-041 điều kiện 1). OPS chỉ đặt **C** trên production khi đủ 8 việc ★ dưới đây. SEC xác nhận bằng một dòng decision-log. Không có việc nào chờ luật sư.

### 3.1 Bắt buộc (★)

**★1 – Tin trong phòng tự xóa (INT kiểm, INV cài đặt). Mức: Blocker cho C.**
- Lý do: mặc định Google Chat **giữ tin vô thời hạn**. Thông báo đã đăng hứa "xóa chậm nhất 180 ngày" và "xóa khi khách rút đồng ý". Bản sao trong Chat không xóa thì cả hai câu thành sai.
- Cách làm, theo thứ tự ưu tiên (INT kiểm trên **phòng thử**, có webhook thật, dữ liệu giả):
  1. **Tắt lịch sử của phòng** (history off: tin tự xóa sau 24 giờ), và trong Admin console khóa không cho thành viên bật lại. Kiểm: tin webhook có bị xóa sau 24 giờ không; tin nhắc lại trả lời trong luồng còn chạy không. **SEC đề xuất cách này**: nó cũng giải quyết luôn yêu cầu xóa WR8.
  2. Nếu phòng không tắt được lịch sử: một quy tắc lưu giữ tự động cho phòng (Google Vault). Vault chỉ có ở một số gói Workspace. Nếu phải nâng gói thì đó là **chi phí → ORC mở ESC**, chưa bật C.
  3. Hoặc: ARC đổi webhook sang **Chat app** gửi bằng tài khoản dịch vụ, để app tự xóa tin của chính nó sau 7 ngày (job hằng ngày, lưu `name` của tin do Google trả về – không phải dữ liệu khách). Việc này là thay đổi thiết kế, ARC ước lượng công.
- Xóa tay định kỳ **không** được dùng làm cách duy nhất.
- Kết quả kiểm ghi vào báo cáo INT; FE-B điền `{chatRetention…}` theo đó.

**★2 – Chỉ gửi chi tiết cho yêu cầu khách gửi theo thông báo mới (ARC/BE). Mức: Blocker cho C.**
- Renderer chỉ dựng mẫu B/C khi `website_booking_request.consent_version` ≥ hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` (= version ở mục 1). Thấp hơn thì dựng **mẫu A**, dù cấu hình là C.
- Lý do: khách gửi theo `2026-10-24` đã đọc câu "lưu tại Việt Nam" và không có Google Chat trong danh sách bên nhận. Không áp ngược điều khoản mới cho họ.
- Nhờ điều này, landing và api phát hành lệch ngày nhau cũng không sai.
- Test: yêu cầu `consent_version = 2026-10-24` + cấu hình C → chữ tin không chứa tên, SĐT, lời nhắn, ngày đến, số khách.

**★3 – Cấu hình mức nội dung an toàn (ARC/BE/OPS).**
- Một giá trị duy nhất, ví dụ `BOOKING_REQUEST_CHAT_DETAIL_LEVEL` = `A|B|C`, chỉ worker đọc. Thiếu hoặc sai → **A**. ARC chọn cơ chế (env hay `config_parameter`). Nếu là `config_parameter` thì chỉ OWN được đổi và mỗi lần đổi ghi `audit_event` `security`.
- Worker log một lần lúc khởi động `info 'chat detail level' {level}`, không log gì khác.
- Đổi giá trị trên production là thay đổi `.env` production → báo INV trước theo luật đã có.
- Staging: được đặt C **chỉ khi** webhook trỏ phòng thử và dữ liệu là dữ liệu thử.

**★4 – Thành viên phòng và tài khoản (INV làm, OPS ghi runbook).**
- Chỉ tài khoản **@ottimo.vn**. Tắt cho người ngoài tổ chức tham gia phòng.
- Chỉ **OWN, MGR, FDL, FD** (khớp vai thấy mọi yêu cầu trên Desk, rbac ghi chú 42). **Không** SAL, CTV, HK, MT; không tài khoản dùng chung. Thêm SAL thì câu "only … the sales staff assigned to your request" sẽ sai.
- Bắt buộc **xác minh 2 bước** cho mọi tài khoản trong phòng (Admin console).
- Không có ứng dụng hay webhook nào khác trong phòng ngoài "Desk OTTIMO".
- Người nghỉ việc: gỡ khỏi phòng **cùng lúc** khóa tài khoản Desk (checklist nghỉ việc). OWN rà danh sách thành viên mỗi tháng.

**★5 – Chống chèn định dạng, link và nhắc tên từ dữ liệu khách (BE/INT). Mức: Major.**
- Vấn đề: tên và lời nhắn do người ngoài gõ. Google Chat hiểu cú pháp trong chữ của tin: `<users/all>` (nhắc tất cả), `<https://…|Mở Desk>` (link giả mang chữ thật), `*đậm*`, `_nghiêng_`, `~gạch~`, dấu `` ` ``, và tự biến URL trần thành link. Kẻ gian có thể gửi form với lời nhắn giả làm tin Desk, kèm link lừa, vào đúng phòng nhân viên tin tưởng.
- Yêu cầu tối thiểu cho mọi trường do khách nhập (tên, lời nhắn; SĐT/email đã qua kiểm định dạng):
  1. Bỏ ký tự điều khiển và ký tự đổi hướng chữ (đã có ở bước nhận, renderer kiểm lại).
  2. Thay `<` `>` bằng `‹` `›`; bỏ dấu `` ` ``; đặt lời nhắn trong khối mã (` ``` `) để Chat hiển thị nguyên chữ.
  3. Vô hiệu URL và tên miền: `://` → `[:]//`, dấu chấm trong cụm dạng tên miền → `[.]`. Khi có nhãn `contains_url`, thêm cụm "có link – không bấm, xem trên Desk".
  4. Tên ≤ 80 ký tự, một dòng; lời nhắn ≤ 500 ký tự, cắt thì thêm "… (xem đủ trên Desk)". Thân tin ≤ 4 KB (ARC).
  5. Dòng "Mở Desk" luôn là dòng **cuối**, do mã dựng từ `ADMIN_BASE_URL` đã kiểm.
- Test (INT chạy trên phòng thử, chụp chữ – không ảnh có dữ liệu thật): tên `<users/all>`, lời nhắn `<https://evil.example|Mở Desk>`, `evil.example/login`, ```` ``` ````, `*x*`. Kết quả: không ai bị nhắc, không link nào bấm được ngoài link Desk.

**★6 – Chỉ tin đầu có chi tiết (ARC/BE).**
- Tin nhắc lại (quá hạn, 07:30 sáng) giữ **mẫu A** trong cùng luồng. Lý do: không nhân thêm bản sao dữ liệu khách; người trực đã có chi tiết ở tin đầu hoặc trên Desk.
- Giữ các luật ARC: outbox chỉ có id; chữ dựng lúc gửi rồi bỏ; không log chữ, URL hay phản hồi; tại thời điểm gửi bỏ qua yêu cầu `spam`, đã xóa, `pii_purged_at` (`SKIPPED_GONE`); quá 12 giờ thì không gửi (`SKIPPED_STALE`).
- Test 3 của ARC đổi thành theo mức: mức A/B thì câu SQL và chữ tin không chứa trường C2; mức C thì chứa, và chỉ khi qua ★2.

**★7 – Điện thoại và thông báo của thành viên (INV phổ biến, BA ghi sổ tay).**
- Khóa màn hình bắt buộc. Thông báo Google Chat **ẩn nội dung trên màn hình khóa** (iOS: Show Previews = When Unlocked; Android: ẩn nội dung nhạy cảm). Nếu không, tên và SĐT khách hiện cho bất kỳ ai cầm máy.
- **Tắt email thông báo tin chưa đọc** của Google Chat cho từng thành viên. Nếu không, Gmail nhận một bản sao tin, và bản này **không** bị xóa theo ★1.
- Bật quản lý thiết bị di động cơ bản của Workspace để xóa tài khoản khỏi máy khi mất máy.
- Không đăng nhập phòng bằng tài khoản cá nhân. Không chụp, chép, chuyển tiếp chi tiết khách từ phòng sang Zalo cá nhân hay nơi khác. Mọi trả lời đi từ kênh chính thức.

**★8 – Thông báo version mới đã đăng và đã ghi phiên bản (FE-B/OPS).**
- Landing có `2026-10-31` (mục 1) trên production; `publish-privacy-notice --apply` đã ghi `vi` + `en`, băm khớp trang thật.
- Câu `{chatRetention…}` khớp kết quả ★1.
- Nhờ ★2, việc này không làm hỏng dữ liệu nếu chậm. Nhưng chưa xong thì đặt C cũng chưa có tác dụng với yêu cầu mới, vì form vẫn gửi version cũ.

### 3.2 Nên làm cùng đợt (không chặn C)

| # | Việc | Ai |
|---|---|---|
| N1 | Xóa khi khách yêu cầu (WR8): nếu ★1 là 24 giờ, sổ tay ghi "bản sao trên Chat tự xóa trong 24 giờ"; nếu yêu cầu xóa tới trong 24 giờ đầu và quản lý phòng xóa được tin của webhook thì xóa tay ngay. INT kiểm quản lý phòng có xóa được tin webhook không. Nếu ★1 là 7 ngày: sổ tay thêm bước xóa tay tin `REQ-…` khi làm WR8. | INT, BA |
| N2 | Tắt Google Takeout cho Google Chat với nhóm tài khoản nhân viên, để không ai xuất lịch sử phòng ra ngoài. | INV |
| N3 | INV chấp nhận Cloud Data Processing Addendum trong Admin console (Account settings → Legal and compliance) và lưu bản chấp nhận cùng hồ sơ luật sư. | INV |
| N4 | Bản đồ dữ liệu (`product/docs/security-requirements.md`, phần bên nhận/nơi lưu): thêm Google Chat, dữ liệu, thời hạn. ESC-002 A ghi "ngoại lệ cho kênh này theo ESC-041 C". | SEC (round sau, khi sửa tài liệu) |
| N5 | Các ý của FB-R3-SEC-ARC-GCHAT-02 (query chỉ `key`/`token`; kiểm URL trước khi ghi tệp bí mật; kiểm `ADMIN_BASE_URL`; khi nào xoay URL; câu chống tin giả trong sổ tay). Thêm vào sổ tay: "Tin thật từ Desk luôn kết thúc bằng một dòng Mở Desk tới desk.ottimo.vn; lời nhắn của khách nằm trong khung chữ đơn sắc và mọi link trong đó đã bị vô hiệu." | INT, OPS, BA |
| N6 | SEC review diff BE/INT của v1.0.1 phần Chat; QA ca 10 trên phòng thử gửi SEC **chữ** tin thử ở cả 3 mức để kiểm. | SEC, QA |

### 3.3 Rủi ro còn lại sau khi đủ ★1–★8

| # | Rủi ro | Mức | Ghi chú |
|---|---|---|---|
| RR1 | Pháp lý: chuyển dữ liệu ra nước ngoài, có thể cần hồ sơ đánh giá tác động | Không do SEC chấm | INV đã nhận phần này, luật sư lo; đội không giữ văn bản. SEC không xác nhận "tuân thủ". |
| RR2 | Bản sao ở Google còn trong sao lưu của Google sau khi tin bị xóa, theo chính sách của Google | Thấp | Ngoài tầm OTTIMO; thông báo không hứa gì về sao lưu của Google. Ghi chú luật sư câu 7. |
| RR3 | Mất hoặc lộ điện thoại thành viên: lộ tên, SĐT, lời nhắn | Trung bình | ★7 giảm; còn phụ thuộc người dùng tuân thủ. |
| RR4 | URL webhook lộ: người ngoài đăng tin giả hoặc link lừa vào phòng | Trung bình | GCHAT-02 + ★5 (tin thật luôn có dạng cố định). Xóa webhook trong Chat là công tắc tắt khẩn. |
| RR5 | Nhân viên chép chi tiết khách ra ngoài phòng | Trung bình | Chỉ chặn bằng quy định (★7, N2), không chặn được bằng kỹ thuật. Trước đây người trực cũng chép được từ Desk, nhưng nay chi tiết tới cả người không cần trả lời yêu cầu đó (OWN, MGR). |
| RR6 | Cài đặt phòng bị đổi về sau (bật lại lịch sử, thêm thành viên ngoài) | Thấp | ★1 khóa ở Admin console; OWN rà tháng (★4). |
| RR7 | Lời nhắn khách tự ghi thông tin nhạy cảm (sức khỏe, giấy tờ dạng chữ) | Thấp | Form đã nhắc và chặn số CCCD; phần còn lại đi vào Chat nguyên văn trong khối mã, cắt ≤ 500 ký tự. |
| RR8 | Mức C nhân dữ liệu cá nhân thêm một nơi lưu, so với mức B đội đề xuất | Đã chấp nhận | INV quyết ESC-041 = C. |

---

## 4. Dòng decision-log đề xuất

| 2026-10-30 | 3 | **SEC – ESC-041 C: thông báo, ghi chú luật sư, điều kiện kỹ thuật** (`rounds/round-03/outputs/SEC/esc041-gchat-full-details.md`): thông báo xử lý dữ liệu version **`2026-10-31`** (theo ngày chốt chữ) nêu Google Chat (Google Workspace) là bên nhận ngoài Việt Nam, dữ liệu gửi, mục đích, thời hạn tự xóa; thêm câu IP băm 30 ngày; giữ ô đồng ý và 3 khoảng trống còn lại; phát hành cùng v1.0.1, luật sư xem tham khảo. OPS chỉ đặt mức C khi đủ ★1–★8: tin Chat tự xóa (đề xuất tắt lịch sử phòng, 24 giờ), chỉ gửi chi tiết cho yêu cầu có `consent_version` ≥ version mới, mức mặc định A, phòng chỉ OWN/MGR/FDL/FD @ottimo.vn có 2 bước, chống chèn định dạng/link/@all, tin nhắc lại giữ mẫu A, ẩn thông báo màn hình khóa + tắt email thông báo Chat, thông báo mới đã đăng. FB-R3-SEC-ARC-GCHAT-01 hết hiệu lực theo quyết định INV; GCHAT-02 giữ. | SEC | Quyền SEC (yêu cầu bảo mật kỹ thuật); mức C và phần pháp lý theo INV (ESC-041) |
