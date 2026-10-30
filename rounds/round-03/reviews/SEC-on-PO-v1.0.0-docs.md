# SEC review – Tài liệu ngày D theo `v1.0.0` và quyết định D-T4 (a) của PO

- Người review: SEC | Round 3 – Bước **Review** (D-T4 của cổng QC v1.0, `rounds/round-03/qc/v1-gate.md` mục 4.2) | 30/10/2026
- Tài liệu: `rounds/round-03/outputs/PO/v1.0.0-docs-update.md` (mục 2, 4, 5); `product/docs/release-notes.md`; `product/docs/staff-one-pager.md` (khối Check-in online, câu đồng ý, tờ thông báo giấy tờ); `product/docs/manual/user-manual-v1.0.md` bản nội dung 1.3 (0.1, 0.8, 0.9, 2.9, 2.11, 4.2, 5.6, 5.7, 5.8); `product/docs/day-one-guide.md` mục 4.6, 10. Bản làm việc chưa commit.
- Đối chiếu: `reviews/SEC-sprint1.md` mục 5.1–5.6; `reviews/SEC-G7-5-production.md` mục 6; `design/copy/strings-{en,vi,ru}.json` (`gw.notice_body`, `reg2.consent_q`, `guest.oci.*`); `apps/landing-web/src/content/privacy.ts` (câu sao lưu 35 ngày, quyền của khách); `services/api` migration `0052` (`guest_access_token`, `online_checkin.notice_version`), `modules/guest-portal/internal/guest-portal.service.ts` `issueLink`; decision-log 26/10 (BE-A T1: 30 / 7 / 3), 30/10 (ESC-040 A, PO D-T4).
- Bối cảnh làm nặng mức lỗi: repo `origin` công khai (ESC-025). Tờ thông báo được dán ở quầy cho khách đọc. Nhân viên học theo one-pager ở buổi C3a ngày 31/10.

## Tóm tắt

| Mức | Số thẻ |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 5 (gồm D09 ở mục F) |
| Suggestion | 4 (gồm D10 ở mục F) |

Kết luận ngắn:
- **SEC đồng ý D-T4 (a).** Phương án này đáp ứng điều kiện SEC 5.2 "trước khách thật đầu tiên dùng check-in online": khi không có link thì không khách thật nào dùng check-in online. SEC đã kiểm mã: link chỉ sinh ở một chỗ (`issueLink`, do nhân viên bấm trên Desk), không job hay tin tự động nào tạo link. Vì vậy PO-G1 đúng, và một quy tắc thao tác là đủ. Điều kiện mở lại ở mục 2.1 dùng được, SEC bổ sung ở mục C.
- **Duyệt chữ tờ thông báo về nội dung, có sửa.** Thẻ Major duy nhất (D01) là **thứ tự**: tài liệu bảo lễ tân hỏi đồng ý rồi mới chỉ tờ thông báo. Nhưng ảnh và số giấy tờ đã được nhập ở bước Giấy tờ của Nhận phòng, trước Khối 1. Thông báo phải tới khách **trước** khi nhận giấy tờ. Sửa một câu là xong, cần sửa trước buổi đào tạo 31/10.
- **Release notes không lộ chi tiết khai thác được mới.** Không có địa chỉ IP, tên máy chủ nội bộ, endpoint, định dạng token, cách đặt mã cửa, tên tài khoản hay số tài khoản. Phần BUG-R3-032 và B1–B6 đã công khai từ trước trong ESC-040, `bug-list.md` và `v1-gate.md`. Các biện pháp này cũng không dựa vào việc giữ kín (mục D).

---

## A. Trả lời S1–S5 (`v1.0.0-docs-update.md` mục 2.4)

| # | Trả lời SEC | Ghi chú |
|---|---|---|
| **S1** | **Có.** (a) đáp ứng SEC 5.2. Ba điều kiện mở lại ở 2.1 được giữ, kèm 4 việc SEC kiểm trước khi ghi dòng xác nhận (mục C) | Rủi ro còn lại: lễ tân lỡ gửi link. Mức **Low**: có kiểm soát phát hiện ở S4, xử lý ở S5. Thông báo v1 vẫn đúng với từng câu đồng ý, chỉ thiếu ý hạn lưu hồ sơ điền sẵn |
| **S2** | **Đủ, không cần đọc to cho từng khách**, với 3 điều kiện: (1) tờ thông báo phải tới khách **trước khi nhận giấy tờ**, không phải sau câu hỏi đồng ý (thẻ D01); (2) tờ dán ở chỗ khách đứng làm thủ tục, chữ đọc được ở khoảng cách quầy, không bị che; (3) khách không đọc được EN/VI, hoặc khó đọc, thì lễ tân đọc to câu hạn lưu (thẻ D07). Câu hỏi đồng ý vẫn đọc to như hiện nay, vì nó có số ngày N | NĐ 13/2023 yêu cầu thông báo một lần trước khi xử lý, không bắt đọc to. SEC không nói "tuân thủ": đã cài biện pháp, cần luật sư xác nhận (ESC-001). Khách nhóm 3, 4 đang ở được nhập lại từ sổ cũ (day-one 4.6) không qua quầy: không cần gặp riêng từng người, vì mục đích vẫn là khai báo lưu trú như khi họ đến, và không chụp lại ảnh |
| **S3** | **Duyệt nội dung, có sửa.** Hai câu đầu khớp `gw.notice_body` v1 (EN/VI). Câu hạn lưu khớp SEC 5.2. Câu cuối khớp ý v1. Cần thêm: một dòng về quyền của khách và cách hỏi (thẻ D02); nửa câu về bản sao lưu (thẻ D03). Bản đề xuất đầy đủ ở mục B | UXD vẫn duyệt giọng văn và dàn trang theo brand. SEC chỉ duyệt nội dung |
| **S4** | **Có, nên làm, nhưng làm bằng truy vấn READ ONLY trong lượt kiểm sáng của OPS (D-T6 và các ngày 02/11 tới v1.0.1).** Không sửa `ops-check.sh` trước D, vì không đổi hạ tầng sát ngày chạy. Truy vấn chỉ trả số đếm (mục C.2). Kỳ vọng: 0 | Nếu > 0: OPS báo ORC **mã đơn** (không tên khách). Lễ tân trưởng kiểm link đã thu hồi chưa, rồi làm theo S5 |
| **S5** | **Gần như đồng ý PO.** Không xóa ảnh, vì ảnh cần cho khai báo lưu trú và khách đã thấy thông báo v1 cùng câu đồng ý có số ngày. Thêm hai việc nhẹ: (1) ghi **mã đơn** vào sổ giao ca (không ghi tên); (2) khi khách tới quầy, chỉ tờ thông báo như mọi khách. Như vậy khách nhận đủ ý hạn lưu hồ sơ điền sẵn còn thiếu trong v1 | `online_checkin.notice_version` đã ghi `privacy-2026-10-v1` cho lượt đó, nên đủ dấu vết. Không cần báo INV, trừ khi khách hỏi về dữ liệu (theo sổ tay 0.8 điểm 8) |

---

## B. Tờ thông báo giấy tờ – chữ SEC đề xuất (gộp thẻ D02, D03)

Phần **đậm** là phần thêm so với bản PO. UXD được sửa giọng văn, độ dài và dàn trang, miễn là giữ đủ 6 ý: mục đích, nơi nhận (công an), bảo vệ và ai xem, hạn lưu kèm sao lưu, hỏi riêng việc lưu ảnh, cách hỏi về dữ liệu.

> **Your ID details** · *Thông tin giấy tờ của bạn*
>
> OTTIMO uses your ID details to register your stay with the police, as required by Vietnamese law. ID photos are encrypted; only reception and managers can see them. ID photos and saved ID details are deleted within 3 months after check-out**, and from our encrypted backups within a further 35 days**, unless the law requires us to keep them longer. We will ask separately whether we may keep your ID photo after registration. **To see, correct or delete your details, please ask reception.**
>
> *OTTIMO dùng thông tin giấy tờ của bạn để khai báo lưu trú với cơ quan công an theo luật Việt Nam. Ảnh giấy tờ được mã hóa; chỉ lễ tân và quản lý xem được. Ảnh và thông tin giấy tờ được xóa trong vòng 3 tháng sau khi trả phòng**, và khỏi bản sao lưu đã mã hóa trong 35 ngày sau đó**, trừ phần pháp luật yêu cầu lưu lâu hơn. Chúng tôi sẽ hỏi riêng bạn có muốn cho lưu ảnh giấy tờ sau khi khai báo hay không. **Muốn xem, sửa hoặc xóa thông tin của bạn, vui lòng hỏi lễ tân.***

Kiểm từng câu với hệ thống đang chạy:
- Hạn lưu: ảnh của khách đồng ý là 30 ngày; ảnh khai báo chưa xong 7 ngày; hồ sơ điền sẵn 3 tháng (BE-A T1, 26/10). Câu "trong vòng 3 tháng" đúng với cả ba.
- Sao lưu 35 ngày khớp `privacy.ts` của landing.
- "Only reception and managers": thực tế FD, MGR và OWN xem được, có step-up và ghi `c3_access_log`. Chủ đầu tư thuộc phía quản lý, nên câu vẫn đúng ý. Giữ nguyên để khớp `gw.notice_body` v1.
- Không có dữ liệu khách, số điện thoại hay email trên tờ. Không dùng `info@` (hộp chung, `release-notes.md`). Yêu cầu về dữ liệu đi qua lễ tân rồi tới chủ đầu tư, theo sổ tay 0.8 điểm 8.

---

## C. Ghi chú cho ORC (không phải thẻ của PO)

### C.1 Điều kiện SEC kiểm trước khi ghi dòng "mở lại check-in online" (bổ sung điều kiện (iii) mục 2.1)

1. Image production chứa `privacy-2026-10-v2` trong `NOTICE_TEXT_VERSIONS`, và `privacy_notice_version` đã đặt bằng giá trị đó.
2. Câu v2 có ở **mọi ngôn ngữ của trang khách**, kể cả `strings-ru.json`, không chỉ EN/VI. Thiếu RU thì khách dùng tiếng Nga vẫn thấy chữ v1.
3. Câu v2 trên trang khách nên dùng cùng chữ với tờ thông báo đã sửa (mục B, gồm ý sao lưu và cách hỏi về dữ liệu). UXD và FE-B nhận việc này cho v1.0.1.
4. **Sửa đề xuất của chính SEC ở 5.2:** khi nới `id_image_retention_days_after_checkout`, đặt biên trên **89 ngày**, không phải 90. Ba tháng lịch ngắn nhất dài 89 ngày (ví dụ 01/02 tới 01/05 năm không nhuận). Đặt 90 thì câu "trong vòng 3 tháng" sai 1 ngày với khách trả phòng đầu tháng 2. Ràng buộc `document_profile_retention_months` ≤ 3 giữ nguyên. Độ trễ của J16/J25 (chạy theo lịch hằng ngày) dưới 1 ngày. SEC chấp nhận độ trễ này và sẽ ghi vào lượt review migration của BE-C.

### C.2 Truy vấn đếm cho S4 (READ ONLY, production, mỗi sáng tới khi mở lại)

```sql
SELECT
  (SELECT count(*) FROM guest_access_token WHERE created_at >= now() - interval '24 hours') AS links_issued_24h,
  (SELECT count(*) FROM guest_access_token WHERE created_at >= timestamptz '2026-11-02 00:00+07' AND revoked_at IS NULL) AS links_open_since_d,
  (SELECT count(*) FROM online_checkin WHERE notice_accepted_at >= timestamptz '2026-11-02 00:00+07') AS notices_accepted_since_d;
```

Chỉ in số. Không chọn cột nào có dữ liệu khách. Không ghi kết quả có mã đơn vào repo. Kỳ vọng `0 / 0 / 0`. Khác 0 thì làm theo S4.

### C.3 Dòng decision-log soạn sẵn (ORC ghi, SEC không tự ghi)

| 2026-10-30 | 3 | **SEC – D-T4 (a) của PO: ĐỒNG Ý** (`rounds/round-03/reviews/SEC-on-PO-v1.0.0-docs.md`). (1) (a) đáp ứng SEC 5.2: không gửi link thì không khách thật nào dùng check-in online; link chỉ sinh khi nhân viên bấm (`issueLink`), không có đường tự động (PO-G1 đúng). (2) Kênh quầy đủ làm thông báo hạn lưu, không phải đọc to cho từng khách, với điều kiện chỉ tờ thông báo **trước khi nhận giấy tờ** (thẻ D01), tờ dán chỗ khách đọc được trước giờ nhận phòng sớm nhất ngày D (06:00), khách không đọc được EN/VI thì đọc to câu hạn lưu. (3) Tờ thông báo: duyệt nội dung, thêm ý sao lưu 35 ngày và "muốn xem, sửa, xóa thì hỏi lễ tân" (mục B); UXD duyệt chữ và dàn trang. (4) S4: OPS đếm READ ONLY mỗi sáng `guest_access_token` / `online_checkin` từ 02/11 tới khi mở lại (kỳ vọng 0), không sửa `ops-check.sh` trước D. (5) S5: lỡ gửi thì thu hồi link, ghi mã đơn vào sổ giao ca, chỉ tờ thông báo khi khách tới; không xóa ảnh. (6) Mở lại khi đủ 3 điều kiện của PO, cộng: v2 có ở mọi ngôn ngữ trang khách (gồm RU), cùng chữ với tờ thông báo. (7) Sửa SEC 5.2: biên trên ảnh khi nới là 89 ngày, không phải 90 | SEC | Quyền SEC (mức rủi ro, yêu cầu kỹ thuật về dữ liệu cá nhân); không chính sách kinh doanh mới nên không lập ESC. Biện pháp đã cài, cần luật sư xác nhận (ESC-001) |

---

## D. Release notes – kiểm chi tiết khai thác được

| Nội dung | Đánh giá |
|---|---|
| Địa chỉ `desk.`, `staff.`, `g.ottimo.vn`, `ottimo.vn` | Tên miền công khai, đã có trong DNS và landing. Không có IP VPS, cổng hay đường quản trị |
| BUG-R3-032 "thư bảo mật không tới ai", B1–B6 kèm giờ 09:00 | Đã công khai trong ESC-040, `qa/bug-list.md`, `qc/v1-gate.md`, `SEC-on-B2-readiness.md`. Muốn khai thác phải chiếm được tài khoản chủ đầu tư (mật khẩu + TOTP). Các lớp chặn (step-up, hiệu lực từ hôm sau, dòng "Tài khoản nhận vừa đổi", B5) không dựa vào việc giữ kín. **Không thêm rủi ro** |
| Mã cửa | Chỉ nêu quy tắc phòng thủ (không gửi qua tin nhắn, chỉ đọc tại quầy hoặc tự gọi ra). Không nêu cách đặt mã. Dòng cũ "mã cửa vẫn tạo và gửi khách" đã sửa đúng |
| Check-in online tạm dừng | Chỉ là thông tin vận hành, không mở đường tấn công. Link cũ trên staging không liên quan production |
| "Desk từ chối ô mật khẩu quản lý trên phiên lễ tân", "nhật ký xem giấy tờ chưa có màn tự xem" | Mô tả kiểm soát. Người trong nội bộ vốn đã biết. Không có cách vượt |
| Token, endpoint, tên bảng, cấu hình, số tài khoản, tên người dùng | Không có |

Kết luận: **không thẻ** cho release notes về mặt lộ thông tin. Chỉ có một việc thủ tục sau khi SEC xác nhận, ở thẻ D08.

---

## E. Thẻ feedback

### FB-R3-SEC-PO-D01
- Mức độ: Major
- Vị trí: `product/docs/staff-one-pager.md` khối "Hỏi khách đồng ý lưu ảnh giấy tờ" (dòng "Rồi chỉ khách tờ thông báo giấy tờ…") và dòng **Nhận phòng**; `product/docs/manual/user-manual-v1.0.md` mục 0.8 điểm 4 (dòng "Rồi chỉ khách tờ thông báo giấy tờ…"), mục 2.10 (bước Giấy tờ) và 2.11 bước 3 (Khối 1); `day-one-guide.md` mục 10 cột Việc
- Vấn đề: Tài liệu bảo lễ tân **hỏi đồng ý trước, rồi mới chỉ tờ thông báo**. Mà câu hỏi đồng ý nằm ở Khối 1 "Đối chiếu và đồng ý lưu ảnh" (sổ tay 2.11 bước 3), **sau** khi ảnh và số giấy tờ đã nhập ở bước Giấy tờ của Nhận phòng (2.10, one-pager "Nhập giấy tờ ở bước Giấy tờ"). Làm đúng tài liệu thì khách thấy thông báo hạn lưu sau khi dữ liệu đã được thu. Trên trang khách thì ngược lại: `online_checkin.current_step` bắt đầu ở `notice`, khách phải bấm "Tôi đã đọc" trước bước giấy tờ.
- Vì sao quan trọng: NĐ 13/2023 yêu cầu thông báo **trước khi** xử lý. Tờ thông báo là kênh duy nhất ở quầy nói về hạn lưu hồ sơ điền sẵn (PO-G2). Nếu chỉ tờ sau khi thu thì kênh quầy không đạt điều kiện S2. Buổi đào tạo C3a ngày 31/10 sẽ dạy theo đúng thứ tự trong tài liệu.
- Đề xuất sửa: Tách thành hai lúc.
  - **Khi xin giấy tờ** (đầu bước Giấy tờ ở Nhận phòng): "Chỉ khách tờ thông báo giấy tờ ở quầy, rồi mới nhận giấy tờ." EN gợi ý: "Before I take your ID, please see this notice on how we use it."
  - **Ở Khối 1**: hỏi câu đồng ý có số N như hiện nay.
  - Sửa cùng câu ở one-pager (dòng Nhận phòng và khối câu đồng ý), sổ tay 0.8 điểm 4, 2.10 (bước Giấy tờ), 2.11 bước 3, và bài tập 5.8 (7).
- Trạng thái: Open

### FB-R3-SEC-PO-D02
- Mức độ: Minor
- Vị trí: `product/docs/staff-one-pager.md`, mục "Tờ thông báo giấy tờ", đoạn EN và VI
- Vấn đề: Tờ thông báo không nói khách làm gì nếu muốn xem, sửa hoặc xóa dữ liệu của mình. Trên web, landing có câu này (`privacy.ts`). Ở quầy thì tờ thông báo là văn bản duy nhất khách thấy. Trong khi đó sổ tay 0.8 điểm 8 đã có quy trình (lễ tân ghi lại, chuyển chủ đầu tư), và release notes ghi "chủ đầu tư xử lý bằng tay".
- Vì sao quan trọng: Thông báo nên cho chủ thể dữ liệu biết cách thực hiện quyền của mình. Thêm một câu không tốn gì, và giúp khách khỏi hỏi qua `info@` (hộp chung, không theo dõi việc này).
- Đề xuất sửa: Thêm câu cuối: EN "To see, correct or delete your details, please ask reception." / VI "Muốn xem, sửa hoặc xóa thông tin của bạn, vui lòng hỏi lễ tân." (mục B). Không ghi email hay số điện thoại cá nhân lên tờ.
- Trạng thái: Open

### FB-R3-SEC-PO-D03
- Mức độ: Minor
- Vị trí: `product/docs/staff-one-pager.md` tờ thông báo, câu hạn lưu (EN/VI); trích lại ở sổ tay 0.8 điểm 4 và `release-notes.md` (Giới hạn đã biết – Hạn lưu ảnh giấy tờ)
- Vấn đề: Câu "deleted within 3 months after check-out" chưa nói tới bản sao lưu. Ảnh và hồ sơ đã xóa còn trong bản sao lưu mã hóa tới 35 ngày (`SEC-sprint1.md` 5.3). Landing đã ghi "Backups expire within 35 days". Đây là **thiếu sót của chính câu SEC đề xuất ở 5.2**, PO chép đúng.
- Vì sao quan trọng: Đọc theo nghĩa đen thì câu hứa xóa hẳn trong 3 tháng, trong khi bản sao lưu có thể giữ tới khoảng 4 tháng. Thông báo không chính xác về hạn lưu là điểm yếu nếu có khiếu nại. Hai kênh (landing và quầy) cũng nói khác nhau.
- Đề xuất sửa: Dùng câu ở mục B: "…deleted within 3 months after check-out, and from our encrypted backups within a further 35 days, unless…" / "…xóa trong vòng 3 tháng sau khi trả phòng, và khỏi bản sao lưu đã mã hóa trong 35 ngày sau đó, trừ…". Sửa cùng chỗ trích ở sổ tay 0.8 điểm 4. ORC chuyển cùng câu cho UXD/FE-B để dùng ở `gw.notice_body` v2 (mục C.1 ý 3).
- Trạng thái: Open

### FB-R3-SEC-PO-D04
- Mức độ: Minor
- Vị trí: `product/docs/day-one-guide.md` mục 10, dòng 1 ("In và dán tờ thông báo **trước 12:00 ngày D**")
- Vấn đề: Desk nhận phòng sớm từ 06:00 (phụ thu 50 %, sổ tay 2.10). Khách đầu tiên của ngày D có thể đưa giấy tờ trước 12:00. Hạn 12:00 vì vậy có thể tới sau lần nhận giấy tờ đầu tiên trên production.
- Vì sao quan trọng: Đây là kênh thông báo duy nhất ở quầy (PO-G2). Khách nhận phòng sớm sáng D sẽ không có thông báo hạn lưu.
- Đề xuất sửa: "In và dán tờ thông báo **trước khi nhận giấy tờ đầu tiên trên Desk thật – đề xuất tối D−1 (01/11) sau buổi đào tạo, muộn nhất 06:00 ngày D**." Thêm một dòng tick vào bảng kiểm sáng D nếu có.
- Trạng thái: Open

### FB-R3-SEC-PO-D05
- Mức độ: Minor
- Vị trí: `product/docs/staff-one-pager.md` khối "Check-in online – tạm dừng…"
- Vấn đề: One-pager, tức tờ lễ tân nhìn hằng ngày, không nói phải làm gì khi **lỡ gửi link**. Bước này chỉ có trong sổ tay 2.9 ("Thu hồi link ngay, báo lễ tân trưởng"). Bước ghi mã đơn mà SEC thêm ở S5 thì chưa có ở đâu.
- Vì sao quan trọng: Lỡ gửi là rủi ro còn lại chính của (a). Phát hiện nhờ số đếm của OPS (S4) chỉ có tác dụng khi lễ tân thu hồi ngay và để lại mã đơn để đối chiếu.
- Đề xuất sửa: Thêm vào khối: "Lỡ gửi link: mở đơn → **Thu hồi link** ngay, báo lễ tân trưởng, ghi **mã đơn** vào sổ giao ca (không ghi tên khách). Khách tới quầy thì chỉ tờ thông báo như mọi khách." Thêm ý ghi mã đơn vào sổ tay 2.9.
- Trạng thái: Open

### FB-R3-SEC-PO-D06
- Mức độ: Suggestion
- Vị trí: `product/docs/staff-one-pager.md` dòng 3 ("In một mặt giấy A4, dán ở quầy")
- Vấn đề: One-pager có quy trình chống lừa đảo: điều kiện đọc mã cửa, cách xử lý mã VietQR "Tài khoản nhận vừa đổi", "không gõ mật khẩu quản lý". Chữ "dán ở quầy" có thể hiểu là dán phía khách nhìn thấy, cạnh tờ thông báo.
- Vì sao quan trọng: Rủi ro thấp, vì các quy tắc này đều là quy tắc phòng thủ. Nhưng người ngoài không cần đọc quy trình nội bộ, và nếu UXD gộp hai tờ (`v1.0.0-docs-update.md` mục 4) thì dễ dán nhầm.
- Đề xuất sửa: Ghi rõ: "One-pager dán **phía trong quầy** (chỗ nhân viên). Tờ thông báo giấy tờ dán **phía khách**." UXD giữ hai tờ tách nhau khi dàn trang.
- Trạng thái: Open

### FB-R3-SEC-PO-D07
- Mức độ: Suggestion
- Vị trí: `product/docs/staff-one-pager.md` tờ thông báo; sổ tay 0.8 điểm 4
- Vấn đề: Tờ chỉ có EN/VI. Trang khách có tiếng Nga (`strings-ru.json` có `gw.notice_body`), và release notes ghi tiếng Nga trên Desk ở v1.3. Khách không đọc được EN/VI, hoặc khó đọc, thì không nhận được thông báo.
- Vì sao quan trọng: Đây là điều kiện (3) của S2. Thiếu cách xử lý thì thông báo ở quầy chỉ đúng với một phần khách.
- Đề xuất sửa: Thêm một câu cho lễ tân ở 0.8 điểm 4: "Khách không đọc được tờ thông báo: đọc to câu hạn lưu (EN), hoặc mở thông báo tiếng của khách trên trang khách tập nếu có." UXD cân nhắc thêm bản tiếng Nga dưới cùng tờ (dùng câu đã dịch của `gw.notice_body`, cộng câu hạn lưu khi FE-B có bản RU của v2).
- Trạng thái: Open

### FB-R3-SEC-PO-D08
- Mức độ: Suggestion
- Vị trí: `product/docs/release-notes.md` (Giới hạn đã biết – "Check-in online tạm dừng…": "chờ đội bảo mật xác nhận trước 01/11"); chú thích HTML ở `staff-one-pager.md` dòng 5 và tờ thông báo, sổ tay 0.8 điểm 4 và 2.9
- Vấn đề: Sau review này, chữ "chờ SEC xác nhận" đã cũ. Tờ thông báo in ra cũng chưa có dấu phiên bản. Khi chữ đổi ở v1.0.1, sẽ khó biết khách ở quầy đã thấy bản nào.
- Vì sao quan trọng: Thủ tục, và bằng chứng về thông báo (bên kiểm soát dữ liệu phải chứng minh được đã thông báo gì, lúc nào).
- Đề xuất sửa: Đổi thành "đội bảo mật đã đồng ý 30/10 (`reviews/SEC-on-PO-v1.0.0-docs.md`)". Thêm chân tờ thông báo một dòng nhỏ, ví dụ "OTTIMO · ID notice · 11/2026". Đổi chữ thì đổi dòng này và giữ bản cũ trong lịch sử repo.
- Trạng thái: Open

---

## F. Sổ tay 1.4 – tách nhiệm hoàn tiền (SEC, 30/10 khuya, trước C3a)

Đọc: sổ tay bản nội dung 1.4 (commit `3482f82`) mục 1.8, 1.12, 2.4, 2.8, 2.17; `responses/PO-to-v1.0.0-docs-reviews.md` mục 10.4. Đối chiếu mã trên `8b3aec8` (không đổi tới `HEAD` ở `modules/payments`, `modules/approvals`, migrations): `approval.service.ts` `assertNotSelf`; `refunds.service.ts` `payOut`, `assertNotA32Maker`; CHECK `approval_request_refund_no_self_approval` (0040), `approval_request_refund_destination_not_approver` và `payment_refund_not_requester_check` (0042); quy tắc F8 (`round-02/outputs/SEC/s3-checklist.md`) và SEC-37 / PO 17/10.

**Kết luận: Đạt, kèm một câu sửa chữ (D09, Minor) và một câu nên sửa (D10, Suggestion). Không chặn C3a.** Không có câu nào dạy vòng qua tách nhiệm. Mọi chỗ sổ tay sai đều sai theo hướng **chặt hơn** Desk. Không chỗ nào cho phép điều Desk cấm.

| Câu trong sổ tay | Mã `8b3aec8` | Kết quả |
|---|---|---|
| 1.8 câu 1: người tạo yêu cầu hoàn **không tự duyệt**, kể cả quản lý, chủ đầu tư | `assertNotSelf`: refund + `requested_by = actor` → 403 `SELF_APPROVAL_FORBIDDEN`, không ngoại lệ; CHECK 0040 | **Khớp** F8 |
| 1.8 câu 1: người tạo yêu cầu hoàn **không tự chi**, kể cả chủ đầu tư | Tiền mặt: người tạo không bao giờ chi (403 `SELF_REFUND_FORBIDDEN`, CHECK 0042 `method <> 'cash'`). **Chuyển khoản: chủ đầu tư chi được khoản do mình tạo** (`ownerTransfer`, có hỏi xác thực lại, Nhật ký tiền đánh dấu `ownSelfApprovedAndPaid`) | **Lệch, sổ tay chặt hơn mã.** Mâu thuẫn với câu "Riêng chủ đầu tư…" hai dòng dưới. Có thể gây tắc: chủ đầu tư tạo yêu cầu hoàn chuyển khoản, quản lý duyệt. Theo sổ tay thì không ai chi được (quản lý không vừa duyệt vừa chi, chủ đầu tư "không tự chi"), dù Desk cho chủ đầu tư chi → thẻ D09 |
| 1.8 câu 2: hoàn **tiền mặt**, người nhập nơi nhận không duyệt được, kể cả chủ đầu tư; người duyệt chi được tiền mặt | CHECK 0042: người nhập nơi nhận ≠ người duyệt, trừ chủ đầu tư với khoản không phải tiền mặt. `payOut` tiền mặt chỉ cấm người tạo yêu cầu (và người giảm A32), không cấm người duyệt | **Khớp** |
| 1.8 dòng chuyển khoản; 1.12 bước 1; 2.4 bảng (dòng "Không đi nữa", "Khách đó tới quầy" (a), (d)); 2.17 "không chi được khoản do chính mình tạo" | Người trực (vai quản lý) tạo yêu cầu + nhập nơi nhận → chủ đầu tư duyệt → chủ đầu tư chi (tiền mặt: chủ đầu tư không phải người tạo; chuyển khoản: ngoại lệ chủ đầu tư) | **Khớp**, luồng chạy được trên Desk |
| 2.8 bước 4: "**quản lý hoặc chủ đầu tư** khác người hủy duyệt **và chi**" | Quản lý đã duyệt khoản **chuyển khoản** thì không chi được khoản đó (403) | **Lệch nhẹ**: Desk chặn, không phải lỗ hổng, nhưng dạy một việc sẽ bị từ chối → D10 |

Kiểm "vòng qua": sổ tay không bảo ai dùng tài khoản người khác, không bảo gõ hộ mật khẩu (1.8 cấm rõ), không bảo tách khoản hoàn cho dưới hạn mức. Không có lối hoàn ngoài Desk: khung 2.4 cấm nhận thêm tiền vào đơn cũ sau hạn, khoản dư đi qua yêu cầu hoàn. Câu "người tạo nhập nơi nhận **trước**, rồi người khác duyệt" là thứ tự đúng để giữ tách nhiệm, không phải mẹo lách.

Ghi chú cho DOM (D-QA-4 của PO, chỉ là dữ kiện mã, DOM quyết nghiệp vụ): với yêu cầu **không phải hoàn tiền** (giảm giá, FOC), `assertNotSelf` cho quản lý và chủ đầu tư tự duyệt yêu cầu của chính mình, rồi mới kiểm hạn mức của vai. Lễ tân và lễ tân trưởng tự duyệt thì nhận 403. Vì vậy câu 2.4 "người trực tự duyệt bằng quyền quản lý" chạy được trên Desk khi số tiền ≤ hạn mức quản lý (giá 1 đêm/lần). Câu này không chạm tách nhiệm hoàn tiền.

### FB-R3-SEC-PO-D09
- Mức độ: Minor
- Vị trí: `product/docs/manual/user-manual-v1.0.md` mục 1.8, "Quy tắc tách nhiệm", gạch đầu dòng 2
- Vấn đề: Câu "không tự chi, kể cả quản lý, chủ đầu tư" chặt hơn F8 / SEC-37 trên mã. Desk cho chủ đầu tư chi khoản **chuyển khoản** do chính mình tạo, sau khi người khác duyệt. Câu này mâu thuẫn với dòng "Riêng chủ đầu tư…" ngay dưới. Với khoản chủ đầu tư tạo và quản lý duyệt, sổ tay không để lại ai được chi.
- Vì sao quan trọng: Danh sách này có nhãn "Desk tự kiểm", nên không được ghi điều Desk không kiểm. Học viên C3a sẽ hỏi đúng chỗ mâu thuẫn này. Phần **duyệt** (không ngoại lệ) giữ nguyên, vì đó là lõi F8.
- Đề xuất sửa: PO thay nguyên gạch đầu dòng bằng:
  > - **Hoàn tiền – không tự duyệt, không ngoại lệ:** người tạo yêu cầu hoàn (hủy đơn, sửa dòng…) không duyệt được khoản đó, kể cả quản lý, chủ đầu tư. Desk từ chối, yêu cầu vẫn chờ người duyệt khác. Người tạo yêu cầu cũng không chi khoản đó. Riêng chủ đầu tư được chi khoản **chuyển khoản** do mình tạo, sau khi người khác đã duyệt.

  Không cần sửa bản in: Tờ 1 ghi "người tạo yêu cầu không tự duyệt, không tự chi – hiện chủ đầu tư duyệt và chi", đúng với luồng người trực tạo. Bản in chặt hơn, không sai về an toàn.
- Trạng thái: Open

### FB-R3-SEC-PO-D10
- Mức độ: Suggestion
- Vị trí: sổ tay mục 2.8 bước 4; 2.17 dòng "Hoàn chuyển khoản do quản lý làm"
- Vấn đề: "quản lý hoặc chủ đầu tư khác người hủy duyệt **và chi**" đúng với tiền mặt, nhưng sai với chuyển khoản khi người duyệt là quản lý (Desk 403). 2.17 "do quản lý làm" bỏ sót chủ đầu tư, và bỏ sót điều kiện người chi khác người duyệt.
- Vì sao quan trọng: Không phải lỗ hổng, vì Desk chặn. Chỉ tránh dạy một thao tác sẽ bị từ chối.
- Đề xuất sửa:
  - 2.8 bước 4, thay câu thứ ba: "Người hủy nhập nơi nhận hoàn; **quản lý hoặc chủ đầu tư khác người hủy** duyệt. Tiền mặt: người duyệt chi được. Chuyển khoản: quản lý đã duyệt thì người khác chi; chủ đầu tư được vừa duyệt vừa chi (mục 1.8)." Giữ nguyên hai câu sau ("Người hủy không tự duyệt…", "Hiện một người trực…").
  - 2.17: "Hoàn chuyển khoản do quản lý hoặc chủ đầu tư làm, người chi khác người tạo yêu cầu và khác quản lý đã duyệt (mục 1.8). Báo khách thời hạn."
- Trạng thái: Open

---

## Điểm làm tốt (để giữ)

- PO chọn (a) bằng lý lẽ quy trình phát hành rõ ràng (tag đã gắn, không deploy sát D). Điều kiện mở lại **gắn với bản sửa, không gắn với ngày**. Đây đúng là cách SEC muốn cho mọi biện pháp tạm.
- Câu hỏi đồng ý tại quầy bắt lễ tân **đọc số N trên Desk**, không đọc số cố định. Nhờ vậy câu luôn khớp tham số và `consent_record.retention_days`, kể cả khi OWN đổi hạn ở v1.0.1.
- Release notes sửa hai dòng sai theo hướng an toàn hơn: mã cửa không gửi qua tin nhắn, và `info@` không phải hộp thư bảo mật. Không có dữ liệu khách, IP hay bí mật nào trong các tệp đã sửa.
