# UXD review – Tài liệu `v1.0.0` của PO (D-T1, D-T4): chữ hướng tới khách + dàn trang tờ in

- Người review: UXD | Round 3 – Bước **Review** (điều kiện D-T1 của cổng QC v1.0, `qc/v1-gate.md` mục 4.2) | 30/10/2026
- Tài liệu được review (của PO, UXD **không sửa**):
  - `rounds/round-03/outputs/PO/v1.0.0-docs-update.md` mục 2.4, mục 4 (dòng UXD);
  - `product/docs/staff-one-pager.md` dòng 3, 49–52, 89–97;
  - `product/docs/manual/user-manual-v1.0.md` mục 0.8 điểm 4.
- Căn cứ: `00-brief/context/brand/brand-guidelines.md`; `product/design/content-guide.md` mục 1, 5.6; `reviews/SEC-sprint1.md` mục 5.2; chuỗi `gw.notice_body`, `reg2.consent_q`, `guest.oci.consent*` trong `product/design/copy/strings-*.json`.
- Đối chiếu review SEC chạy song song: `rounds/round-03/reviews/SEC-on-PO-v1.0.0-docs.md`. SEC đồng ý D-T4 (a). SEC đã sửa nội dung tờ thông báo ở mục B: thêm ý bản sao lưu 35 ngày (D03) và câu "xem, sửa, xóa" (D02). SEC giao UXD sửa giọng, độ dài và dàn trang, **miễn giữ đủ 6 ý**. Bản chữ dưới đây dựa trên **mục B của SEC**, không dựa trên bản PO.
- Phạm vi: (1) giọng văn chữ khách nghe/đọc tại quầy; (2) dàn trang in one-pager. **Không đổi nội dung pháp lý của SEC 5.2 và SEC mục B.** Hai câu lấy từ `gw.notice_body` v1 (đã duyệt) giữ nguyên văn. Câu hạn lưu giữ nguyên văn phần đầu. Chỗ nào UXD đổi đều ghi ở bảng nguồn mục 1.2 để SEC duyệt nhanh.
- Kết luận: **Đạt có điều kiện.** 0 Blocker · 4 Major · 2 Minor · 2 Suggestion. Cả 4 Major sửa được trong ngày 31/10, trước buổi đào tạo C3a và trước khi OWN in ở D−1.

---

## 1. Bản chữ đề xuất cuối

### 1.1 Câu hỏi đồng ý lưu ảnh giấy tờ (lễ tân nói tại quầy)

Thay dòng 50–52 `staff-one-pager.md` và sổ tay 0.8 điểm 4.

**Cách làm (chữ cho nhân viên):**
> Trước khi nhận giấy tờ: chỉ khách tờ **Your ID details** trên quầy (SEC D01). Tới Khối 1 "Đối chiếu và đồng ý lưu ảnh", hỏi câu dưới. Đọc đúng số ngày N Desk hiện ở câu hỏi đồng ý. Gọi khách là "anh" hoặc "chị", không đọc "anh/chị". Ghi câu trả lời trên Desk. Khách không đồng ý vẫn ở bình thường.

**EN:**
> May we keep photos of your ID for N days after check-out? They are then deleted automatically. If you'd rather not, that's fine – we use them only to register your stay, then delete them.

**VI:**
> Anh/chị có đồng ý cho OTTIMO lưu ảnh giấy tờ N ngày sau khi trả phòng không? Sau đó ảnh tự xóa. Anh/chị không đồng ý cũng không sao, chúng tôi chỉ dùng ảnh để khai báo lưu trú rồi xóa.

Ghi chú cho người sửa: N = 1 thì đọc "1 day" / "1 ngày". Hiện OWN đặt 30.

### 1.2 Tờ thông báo giấy tờ (in riêng, khách đọc)

Thay dòng 93–97 `staff-one-pager.md`. Đủ 6 ý SEC mục B yêu cầu. Bốn đoạn ngắn: mục đích, ai xem → hỏi riêng, quyền từ chối → hạn lưu kèm sao lưu → xem, sửa, xóa.

**Tiêu đề:** Your ID details · *Thông tin giấy tờ của bạn* (giữ như PO)

**EN:**
> OTTIMO uses your ID details to register your stay with the police, as required by Vietnamese law. ID photos are encrypted; only reception and managers can see them.
>
> We will ask separately whether we may keep your ID photos after registration. Saying no does not affect your stay.
>
> ID photos and saved ID details are deleted within 3 months after check-out, unless the law requires us to keep them longer. Copies in our encrypted backups are deleted within a further 35 days.
>
> To see, correct or delete your details, please ask reception.

**VI:**
> OTTIMO dùng thông tin giấy tờ của bạn để khai báo lưu trú với cơ quan công an theo luật Việt Nam. Ảnh giấy tờ được mã hóa; chỉ lễ tân và quản lý xem được.
>
> Chúng tôi sẽ hỏi riêng bạn có muốn cho lưu ảnh giấy tờ sau khi khai báo hay không. Bạn không đồng ý cũng không ảnh hưởng gì tới việc lưu trú.
>
> Ảnh và thông tin giấy tờ được xóa trong vòng 3 tháng sau khi trả phòng, trừ phần pháp luật yêu cầu lưu lâu hơn. Bản sao trong dữ liệu sao lưu đã mã hóa được xóa trong 35 ngày sau đó.
>
> Muốn xem, sửa hoặc xóa thông tin của bạn, vui lòng hỏi lễ tân.

**Nguồn từng câu (để SEC duyệt nhanh):**

| Đoạn | Nguồn | UXD đổi gì |
|---|---|---|
| 1 (2 câu) | `gw.notice_body` v1, đã duyệt | Không đổi. Nguyên văn EN và VI |
| 2 | Câu "hỏi riêng" của PO / SEC mục B | Sửa "your ID photo" (số ít) thành "your ID photos", khớp câu trước và mọi chuỗi đã duyệt. **Thêm** "Saying no does not affect your stay" / "Bạn không đồng ý cũng không ảnh hưởng gì tới việc lưu trú". Ý này đã có ở one-pager dòng 52 và `guest.oci.consent_optional`; content-guide 5.6 yêu cầu nêu quyền từ chối. Thì tương lai "We will ask" chỉ đúng khi khách được chỉ tờ **trước** câu hỏi đồng ý, tức là phải sửa thứ tự theo SEC D01 và thẻ 01 |
| 3 | SEC 5.2 + SEC mục B (D03) | Câu đầu nguyên văn SEC 5.2. **Tách** vế sao lưu của SEC mục B thành câu thứ hai: câu SEC mục B dài 33 từ, quá dài cho tờ đọc đứng ở quầy (content-guide: ≤ 20 từ). Không đổi số (3 tháng, 35 ngày), không đổi ý. **Nếu SEC thấy tách câu làm đổi phạm vi của vế "trừ phần pháp luật…", dùng nguyên câu SEC mục B, UXD không phản biện** |
| 4 | SEC mục B (D02) | Không đổi. Nguyên văn SEC |

Đặt EN trước, VI sau, độ dài bằng nhau. Đây là văn bản pháp lý in trên giấy, không chọn được ngôn ngữ, nên đủ cả hai bản.

**Trả lời SEC D07 (bản tiếng Nga trên tờ): UXD không thêm ở ngày D.** Content-guide 5.6 không cho dùng bản dịch RU chưa qua người bản ngữ duyệt làm căn cứ pháp lý. Bản RU của câu hạn lưu v2 cũng chưa có. Tới khi có, khách RU đọc bản EN, giống quyết định `gw.legal_en_notice`; lễ tân đọc to câu hạn lưu theo đề xuất D07 của SEC. Khi FE-B có bản RU v2 đã duyệt, UXD thêm khối RU vào Tờ 4 và đổi khổ theo mục 1.3. A5 hiện đã kín với EN + VI.

### 1.3 Dàn trang tờ thông báo (Tờ 4)

UXD đã dựng thử bản chữ cuối (mục 1.2) với font thật trong `admin-web/dist`. Bản thử nằm ở scratchpad, không đưa vào repo. In PDF bằng Chrome headless: **vừa một mặt A5 ở EN 11,5 pt / VI 11 pt**. Ở 12 / 11 pt thì tràn sang mặt 2, vì có thêm hai ý của SEC mục B.

| Phần | Quy cách |
|---|---|
| Khổ | **A5 dọc, một mặt.** Đặt trong khung mica đứng trên quầy, mặt quay ra khách, chỗ khách đứng làm thủ tục, không bị che (SEC S2 điều kiện 2). Lề trên 16 mm, hai bên 14 mm, dưới 12 mm. Nhãn đầu cách tiêu đề 6 mm, dòng phụ cách thân 5 mm |
| Giấy | Giấy trắng hoặc ngà, 120–160 gsm. **Không in nền màu**: máy in văn phòng không in tràn lề, nền Ivory sẽ để lại viền trắng. In thử dưới đèn quầy 2700K (guideline mục 5) |
| Nhãn đầu | "OTTIMO", Be Vietnam Pro chữ hoa 9 pt, giãn +10, màu Stone Grey #6B6760. Chưa có SVG logo nên **không** dựng giả wordmark. Có lockup ngang của INV thì thay, rộng ≥ 180 px |
| Tiêu đề | "Your ID details", Lora 500, 24 pt, giãn +2, Ink #2B2B28. Dòng phụ "Thông tin giấy tờ của bạn", Lora 500, 13 pt, Stone Grey |
| Thân EN | Be Vietnam Pro 400, **11,5 pt**, cách dòng 1,5, Ink. Trong mức Body 11–13 pt của guideline |
| Phân cách | Nét Light Oak #B08D57 0,6 pt, dài 22 mm, cách trên dưới 5 mm. Oak chỉ làm nét kẻ, không làm chữ |
| Thân VI | Be Vietnam Pro 400, **11 pt**, cách dòng 1,5, **Ink**, chữ đứng. Không dùng nghiêng: dấu tiếng Việt khó đọc. Không dùng Stone cho đoạn pháp lý mà khách Việt phải đọc kỹ |
| Chân trang | "OTTIMO · ID notice" bên trái, "11/2026" bên phải. 8 pt, Stone Grey. Theo SEC D08: biết khách đã thấy tờ nào. Đổi chữ thì đổi dòng này |
| Ngắt dòng | Không ngắt giữa "check-out"; khoảng trắng không ngắt trong "3 months", "35 days", "3 tháng", "35 ngày" |
| Thêm RU sau này | Khi có bản RU đã duyệt: đổi sang A4 dọc (3 khối) hoặc giảm còn 10,5 pt. Không ép 3 thứ tiếng vào A5 |
| Màu | Chỉ Ink, Stone Grey, Light Oak, nền giấy. Đúng bảng 80/15/5. Ink trên trắng 14,2:1; Stone trên trắng 5,6:1 (AA) |

---

## 2. Quyết định dàn trang one-pager (quyền UXD)

**Quyết định: tách tờ, không in hai mặt.** Bộ in ngày D có 4 tờ, mỗi tờ một mặt.

| Tờ | Nội dung (theo dòng hiện tại của `staff-one-pager.md`) | Khổ, chữ | Dán ở đâu | Khi v1.0.1 lên |
|---|---|---|---|---|
| **1 – Quầy lễ tân** | URL Desk/app (9), Luôn nhớ (11–16), Giờ cần nhớ (18–27), Lễ tân: Đầu ca (30), Đặt phòng → Nhận phòng (37–45), câu đồng ý mục 1.1, Trả phòng → Miễn giảm (54–58), Kiểm phòng (67), Cuối ca (69, bỏ vế "0h00"), Khi có sự cố (83–85) | A4 một mặt, 2 cột, Be Vietnam Pro **9 pt** | Quầy, phía nhân viên | Giữ nguyên |
| **2a – Tạm tới v1.0.1** | Đầu mỗi ca – giữ chỗ "0h00" đỏ (32–35), Check-in online tạm dừng (47) | A5 một mặt, 10 pt. Viền Light Oak. Dòng đầu: "Gỡ tờ này khi quản lý báo v1.0.1 đã chạy" | Cạnh Tờ 1 | **Gỡ bỏ** |
| **2b – Khách ở quá 18:00, căn đã bán** | 5 bước (60–65) | A5 một mặt, 10 pt | Kẹp sau Tờ 1, hoặc trong bìa quầy | Giữ nguyên |
| **3 – Buồng phòng** | Luôn nhớ: các dòng buồng phòng cần (12–14), Buồng phòng (71–81), Khi có sự cố (83–85) | A4 một mặt, **10 pt** | Phòng buồng / kho đồ vải | Giữ nguyên |
| **4 – Your ID details** | Mục 1.2 | A5 dọc, mục 1.3 | Khung mica trên quầy, phía khách | Giữ, dùng cho khách làm giấy tờ tại quầy |

2a và 2b in chung một tờ A4 rồi cắt đôi (có vạch cắt). Như vậy OWN chỉ in 4 lần: Tờ 1, Tờ 2a+2b, Tờ 3, Tờ 4.

**Lý do (có đo):**
1. **Không thể vừa một mặt.** UXD dựng phần nhân viên (dòng 1–86) bằng Be Vietnam Pro / Lora thật, A4, lề 10 mm, 2 cột, in PDF bằng Chrome headless. Kết quả: **2 trang ở mọi cỡ từ 9 pt xuống 7 pt.**
2. **Tờ dán không có mặt sau.** One-pager ghi "dán ở quầy". Dán lên rồi thì mặt sau không ai đọc được. Hai mặt chỉ hợp với tờ cầm tay, mà quầy 10 căn thì không cần tờ cầm tay.
3. **Ba nhóm người đọc, hai thời hạn.** Lễ tân, buồng phòng và khách đọc ở ba chỗ khác nhau. Khối "0h00" và "tạm dừng link" hết hiệu lực ở v1.0.1. Tách riêng thì lúc đó chỉ cần gỡ Tờ 2a, không in lại Tờ 1. Tờ 2a cũng dễ thấy hơn khi nằm riêng, có viền.
4. **Đo từng tờ:**
   - Tờ 1 với đủ phần Lễ tân **không vừa** A4 kể cả ở 8,5 pt;
   - bỏ khối "quá 18:00" (sang 2b) thì **vừa ở 9 pt**;
   - 2a và 2b mỗi tờ vừa A5 ở 10 pt;
   - Tờ 3 vừa A4 ở 10 pt.
   - 9 pt là cỡ nhỏ nhất UXD chấp nhận cho tờ tra nhanh, đọc ở khoảng cách 40–50 cm. Thấp hơn mức Body 11–13 pt của guideline, nhưng đây là tờ nội bộ dày chữ, xếp cùng cấp Label (9–11 pt).
5. **In hai mặt dễ hỏng:** OWN in ở D−1 trên máy văn phòng, dễ lật ngược mặt sau. In một mặt thì không có rủi ro này.

**Thương hiệu cho Tờ 1–3** (CLAUDE.md: mọi đầu ra áp brand):
- Tiêu đề tờ và `##` dùng Lora 500;
- thân dùng Be Vietnam Pro, chữ đậm 600;
- URL dùng JetBrains Mono;
- nét dưới tiêu đề mục là Light Oak 0,4 pt;
- nền tiêu đề bảng là Cream #EDE6D8, chữ Ink;
- in trên giấy trắng.
- Góc dưới phải: "Bản 30/10/2026 · v1.0.0" (thẻ 06).

**Ai làm:**
- PO + DOM: sắp lại `staff-one-pager.md` thành 4 phần `## Tờ 1 …` … `## Tờ 4 …` theo bảng trên. Chỉ chuyển chỗ, không viết lại. Phần buồng phòng ở Tờ 3 lấy lại 3 dòng của "Luôn nhớ".
- UXD: dựng bản in HTML từ tệp `.md` đó (cùng cách với bộ dựng sổ tay). Kiểm bằng PDF Chrome rằng mỗi tờ vừa đúng một mặt. Giao OWN trước 12:00 ngày 01/11.
- Phần này **chờ ORC giao** ở bước Phản hồi & sửa. UXD chưa tạo tệp nào trong `product/`.

**Dòng decision-log đề xuất** (ORC ghi khi gom commit):
`| 2026-10-30 | 3 | UXD – dàn trang one-pager v1.0.0: tách 4 tờ một mặt (1 Quầy lễ tân A4 9 pt; 2a Tạm tới v1.0.1 + 2b Quá 18:00 A5; 3 Buồng phòng A4; 4 Your ID details A5 khách đọc), không in hai mặt – đo bằng PDF với font thật: phần nhân viên 2 trang A4 ở mọi cỡ 7–9 pt | UXD | Quyền UXD (giao diện, dàn trang trong khuôn khổ thương hiệu) |`

---

## 3. Thẻ feedback

### FB-R3-UXD-PO-DT1-01
- Mức độ: Major
- Vị trí: `staff-one-pager.md` dòng 52 ("Rồi chỉ khách tờ thông báo…"); sổ tay 0.8 điểm 4, gạch đầu dòng thứ 3
- Vấn đề: Lễ tân **hỏi đồng ý trước, rồi mới** chỉ tờ thông báo. Như vậy khách quyết định khi chưa đọc thông tin hạn lưu (3 tháng) và ai xem được ảnh. Trên trang khách thì ngược lại: `gw.notice_body` hiện **trước** câu `guest.oci.consent`, khách phải bấm "I've read this".
- Vì sao quan trọng: Thông báo cần đến trước câu đồng ý thì sự đồng ý mới là đồng ý có hiểu biết. Đây cũng là lý do SEC 5.2 yêu cầu câu hạn lưu nằm trong thông báo. Kênh quầy và kênh app nên cùng thứ tự để SEC trả lời S2 trên một quy tắc chung.
- Đề xuất sửa: **Trùng ý với FB-R3-SEC-PO-D01.** SEC đã chốt mốc chặt hơn: chỉ tờ **trước khi nhận giấy tờ** (đầu bước Giấy tờ), không chỉ trước câu hỏi đồng ý. Làm theo D01 của SEC. Đoạn "Cách làm" ở mục 1.1 đã viết theo mốc đó. Câu EN gợi ý của SEC, viết lại theo giọng thương hiệu: "Before I take your ID, please read this note on how we use it." / VI: "Trước khi nhận giấy tờ, mời anh/chị đọc tờ này về cách chúng tôi dùng thông tin." PO sửa một lần cho cả hai thẻ, trả lời hai thẻ cùng một dòng.
- Trạng thái: Open

### FB-R3-UXD-PO-DT1-02
- Mức độ: Major
- Vị trí: `staff-one-pager.md` dòng 50–51; sổ tay 0.8 điểm 4 (EN, VI)
- Vấn đề:
  - (a) EN "If you prefer not, we use it…" thiếu động từ ("prefer not to"), nghe như dịch. Câu không nói rõ từ chối là được, mà content-guide 5.6 yêu cầu câu pháp lý "nêu thời hạn và **quyền từ chối**".
  - (b) "a photo … it" số ít, lệch mọi chuỗi đã duyệt ("ID photos", `guest.oci.consent` "photos of my ID"). CCCD có 2 mặt, hộ chiếu có thể nhiều trang.
  - (c) VI "Nếu không, chúng tôi chỉ dùng để…" thiếu tân ngữ, "nếu không" dễ nghe thành "nếu không thì…".
  - (d) Không dặn lễ tân chọn "anh" hoặc "chị". Đọc nguyên chữ "anh/chị" sẽ thành máy móc.
- Vì sao quan trọng: Lễ tân sẽ học thuộc câu này ở buổi C3a và nói với mọi khách, 10 căn, mỗi ngày. Đây là điểm chạm thương hiệu (ngắn, lịch sự, điềm tĩnh) và cũng là câu xin đồng ý pháp lý.
- Đề xuất sửa: thay bằng bản EN/VI và ghi chú ở mục 1.1. Giữ "OTTIMO", "N ngày sau khi trả phòng", "tự xóa", "chỉ dùng để khai báo lưu trú rồi xóa", nên nghĩa pháp lý không đổi. Xưng hô "anh/chị" ở lời nói tại quầy là đúng content-guide mục 1 (giao tiếp trực tiếp do lễ tân nói, không phải chữ trên màn).
- Trạng thái: Open

### FB-R3-UXD-PO-DT1-03
- Mức độ: Major
- Vị trí: `staff-one-pager.md` dòng 95 và 97, câu cuối của tờ thông báo
- Vấn đề:
  - (a) "We will ask separately whether we may keep your ID photo after registration" chỉ đúng nếu khách đọc tờ **trước** khi được hỏi. Theo cách làm hiện tại (hỏi rồi mới chỉ tờ), khách đọc câu "sẽ hỏi" sau khi đã được hỏi. Hết lệch khi sửa thứ tự theo thẻ 01 / SEC D01.
  - (b) "your ID photo" số ít, lệch câu ngay trước ("ID photos").
  - (c) Không nói từ chối thì sao. Content-guide 5.6 yêu cầu chữ pháp lý nêu quyền từ chối. One-pager dòng 52 đã nói ý này với nhân viên, nhưng khách không đọc tờ đó.
  - (d) Bốn câu dồn một khối. Khi gộp thêm hai ý SEC mục B (sao lưu, xem/sửa/xóa) thì khối dài hơn 80 từ, khó đọc lướt khi khách đang đứng ở quầy. Câu hạn lưu bản SEC mục B dài 33 từ.
- Vì sao quan trọng: Đây là chữ duy nhất khách tại quầy được đọc về giấy tờ (PO-G2), và SEC sẽ duyệt nguyên văn (S3).
- Đề xuất sửa: dùng bản ở mục 1.2, dựa trên SEC mục B. Đủ 6 ý SEC yêu cầu. Chép nguyên văn hai câu `gw.notice_body` v1, câu hạn lưu SEC 5.2 và câu xem/sửa/xóa của SEC. UXD chỉ đổi số nhiều, thêm vế "Saying no…", tách vế sao lưu thành câu riêng và chia 4 đoạn ngắn. Dàn trang theo 1.3.
- Trạng thái: Open

### FB-R3-UXD-PO-DT1-04
- Mức độ: Major
- Vị trí: `staff-one-pager.md` dòng 3 ("In một mặt giấy A4, dán ở quầy"); `day-one-guide.md` D−1 ("Phát `staff-one-pager.md`") và mục 10 (OWN in, dán tờ thông báo)
- Vấn đề: Tài liệu ghi "một mặt A4" nhưng nội dung không vừa. Phần nhân viên ra **2 trang A4 ở mọi cỡ 7–9 pt** (đo bằng PDF Chrome với font thật). OWN in ở D−1 sẽ ra 2 tờ, không có hướng dẫn dán tờ nào ở đâu. Khối tạm (0h00, tạm dừng link) lẫn trong khối cố định, nên khi v1.0.1 lên phải in lại cả tờ.
- Vì sao quan trọng: Chặn việc in ngày D−1 (điều kiện ngày D trong `qc/v1-gate.md`). Tờ dán mà lễ tân không tìm thấy dòng cần đọc thì vô dụng đúng vào tuần đầu.
- Đề xuất sửa: theo **quyết định ở mục 2**: 4 tờ một mặt, sắp lại `.md` thành 4 phần (PO + DOM), UXD dựng bản in. Sửa dòng 3 thành "In 4 tờ một mặt – xem cuối tệp". `day-one-guide.md` D−1 và mục 10 ghi rõ: in Tờ 1–4, dán Tờ 1 và 2a ở quầy, Tờ 3 ở phòng buồng, Tờ 4 trong khung mica phía khách.
- Trạng thái: Open

### FB-R3-UXD-PO-DT1-05
- Mức độ: Minor
- Vị trí: sổ tay 0.8 điểm 4 và 5.4 (FAQ); `staff-one-pager.md` câu đồng ý
- Vấn đề: Khách nghe lễ tân nói "30 days", rồi đọc tờ thấy "within 3 months". Hai con số đều đúng (3 tháng là mức tối đa cho mọi dữ liệu giấy tờ, kể cả hồ sơ điền sẵn). Nhưng khách dễ hỏi lại, và lễ tân chưa có câu trả lời mẫu.
- Vì sao quan trọng: Lễ tân trả lời lúng túng về dữ liệu cá nhân làm khách mất tin. Câu trả lời tự nghĩ ra có thể sai pháp lý (ví dụ hứa "xóa ngay").
- Đề xuất sửa: thêm vào sổ tay 5.4 (FAQ), không cần đưa lên tờ dán:
  - EN: "Your photos are deleted N days after check-out. The 3 months on the notice covers all ID details, including those saved for your next stay."
  - VI: "Ảnh anh/chị đồng ý lưu sẽ xóa sau N ngày kể từ khi trả phòng. Mốc 3 tháng trên tờ thông báo áp cho mọi thông tin giấy tờ, kể cả thông tin lưu sẵn cho lần ở sau."
  - Câu không nhắc sao lưu, để giữ ngắn. Khách hỏi tiếp thì chỉ đoạn 3 của tờ. Không viết "longest" hay "dài nhất", vì bản sao lưu còn thêm 35 ngày (SEC D03). Nhờ SEC xem cùng S3.
- Trạng thái: Open

### FB-R3-UXD-PO-DT1-06
- Mức độ: Minor
- Vị trí: `staff-one-pager.md` dòng 3
- Vấn đề: Dòng đầu chứa lịch sử sửa 26/10, 27/10, tối 27/10, 30/10 và tên vai (PO, DOM, BA, SEC). Khi in, khoảng 5 dòng đầu tờ dán là nhật ký nội bộ. Nhân viên chỉ cần biết đang cầm bản nào.
- Vì sao quan trọng: Chiếm chỗ của Tờ 1, vốn chỉ vừa A4 ở 9 pt. Làm nhiễu tờ tra nhanh.
- Đề xuất sửa: chuyển lịch sử sửa vào chú thích `<!-- -->` (bản in bỏ qua). Dòng in chỉ còn: "Dành cho lễ tân và buồng phòng · Bản 30/10/2026 · v1.0.0 · Hướng dẫn đầy đủ: Sổ tay OTTIMO Desk v1.0".
- Trạng thái: Open

### FB-R3-UXD-PO-DT1-S01
- Mức độ: Suggestion
- Vị trí: `staff-one-pager.md` dòng 43 (EN "Check-in from 12:00, your room is always ready by 14:00")
- Vấn đề: Hai mệnh đề độc lập nối bằng dấu phẩy. Chuỗi khách đã duyệt `guest.oci.done_body` viết khác ("Check-in from {time}, once your room is ready – it is always ready by 14:00").
- Vì sao quan trọng: Lễ tân nói một câu, khách đọc một câu khác trên trang khách (khi mở lại ở v1.0.1).
- Đề xuất sửa: "Check-in is from 12:00. Your room is always ready by 14:00." Hoặc dùng nguyên câu `guest.oci.done_body`. Nghĩa không đổi, DOM không phải duyệt lại.
- Trạng thái: Open

### FB-R3-UXD-PO-DT1-S02
- Mức độ: Suggestion (chuyển SEC qua PO, kèm S2/S3)
- Vị trí: mục 2.4 S2–S3 của `v1.0.0-docs-update.md`; Desk `reg2.consent_*`
- Vấn đề: Đồng ý ghi trên Desk lưu `consent_record.notice_version` (migration `0051`), lấy từ tham số `privacy_notice_version` (`registration.service.ts`), hiện là `privacy-2026-10-v1`. Trong khi đó khách ở quầy đọc tờ giấy có chữ mới hơn v1 (hạn lưu, sao lưu, xem/sửa/xóa). Nhìn bản ghi, không biết khách tại quầy đã thấy chữ nào.
- Vì sao quan trọng: Truy vết khi có khiếu nại về dữ liệu cá nhân. SEC D08 đã đề xuất chân tờ "OTTIMO · ID notice · 11/2026". UXD đưa dòng này vào dàn trang (mục 1.3). Thẻ này bổ sung phía bản ghi.
- Đề xuất sửa: SEC quyết có cần một dòng decision-log không, ví dụ: "Từ 02/11, mọi `consent_record` kênh `desk` có `notice_version = privacy-2026-10-v1` đi kèm tờ ID notice 11/2026 (nội dung ở `reviews/UXD-on-PO-v1.0.0-docs.md` mục 1.2)". UXD không đề xuất đổi mã.
- Trạng thái: Open

---

## 4. Điểm làm tốt (nên giữ)

- Câu hạn lưu SEC 5.2 và hai câu của `gw.notice_body` được chép nguyên văn cả EN và VI, không tự diễn lại. Nhờ vậy UXD sửa giọng mà không động vào phần pháp lý.
- Câu hỏi đồng ý bắt lễ tân **đọc đúng số ngày Desk hiện** thay vì ghi cứng "30". Câu đúng cả khi OWN đổi tham số, khớp cách làm `{days}` của SEC.
- D-T4 (a) được viết thành việc cụ thể cho nhân viên (không tạo, không gửi; lỡ gửi thì Thu hồi), có điều kiện mở lại không gắn ngày. Dễ đưa lên một tờ tạm riêng (2a).
