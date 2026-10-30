# PO – Phản hồi 4 review tài liệu ngày D (`v1.0.0`, D-T1 / D-T4)

- Round 3 · Bước: **Phản hồi & sửa** · 30/10/2026 · Tác giả: PO · Hạn: trước buổi đào tạo C3a 31/10
- Review (commit `98d088f`):
  - `rounds/round-03/reviews/SEC-on-PO-v1.0.0-docs.md` – 8 thẻ (1 Major, 4 Minor, 3 Suggestion)
  - `rounds/round-03/reviews/DOM-on-PO-v1.0.0-docs.md` – 10 thẻ (4 Major, 5 Minor, 1 Suggestion) + mục A (quyết định nghiệp vụ)
  - `rounds/round-03/reviews/UXD-on-PO-v1.0.0-docs.md` – 8 thẻ (4 Major, 2 Minor, 2 Suggestion) + bản chữ mục 1.1–1.3, quyết định dàn trang mục 2
  - `rounds/round-03/reviews/BA-on-PO-manual-1.3.md` – 9 thẻ (1 Blocker, 3 Major, 3 Minor, 2 Suggestion)
- Bổ sung của ORC: QA ghi BUG-R3-042 (P1), 043 (P2), 044 (P2), 045 (P3) và ĐX-R3-QA-01 (`rounds/round-03/qa/bug-list.md`) – trả lời ở mục 6.
- Tệp đã sửa (chưa commit):
  - `product/docs/staff-one-pager.md` – sắp lại thành **Tờ 1, 2a, 2b, 3, 4** theo UXD mục 2 (chỉ chuyển chỗ, cộng các sửa nội dung theo thẻ), thêm bảng "Cách in và dán"
  - `product/docs/release-notes.md` – "Chưa có trong bản này", "Giới hạn đã biết" (ba việc hằng ngày, BUG-R3-042…045), dòng phát sinh sau trả phòng, câu giờ nhận phòng
  - `product/docs/manual/user-manual-v1.0.md` – bản nội dung 1.3 (sửa sau review): Cách đọc, 0.8, 1.1, 1.11, 2.1, 2.2, 2.4, 2.8, 2.9, 2.10, 2.11, 2.14, 4.2, 5.4, 5.6, 5.7, 5.8
  - `product/docs/day-one-guide.md` – mục 2 (dòng D−1), 4.3, 10
  - `03-backlog/backlog.md` – mục 5.6 thêm 6 dòng đích v1.0.1, một dòng lịch sử
  - `rounds/round-03/outputs/PO/v1.0.0-docs-update.md` – mục 6, ghi cập nhật sau review cho hai rủi ro
- Không động vào `product/docs/manual/ottimo-manual-v1.0.html` (D-T2). Đã dựng thử sổ tay bằng `build_manual.py` ra scratchpad để kiểm cú pháp: 6 chương, 73 mục, bảng trong khung trích hiện đúng. Không ghi tệp HTML trong repo.

## Tổng hợp

| Mức | SEC | DOM | UXD | BA | Đồng ý, đã sửa | Đồng ý một phần | Không đồng ý |
|---|---|---|---|---|---|---|---|
| Blocker | 0 | 0 | 0 | 1 | 1 | 0 | 0 |
| Major | 1 | 4 | 4 | 3 | 12 | 0 | 0 |
| Minor | 4 | 5 | 2 | 3 | 13 | 1 | 0 |
| Suggestion | 3 | 1 | 2 | 2 | 7 | 1 | 0 |
| **Cộng** | **8** | **10** | **8** | **9** | **33** | **2** | **0** |

- Không thẻ Blocker hay Major nào còn Open.
- Hai thẻ "Đồng ý một phần": **FB-R3-DOM-PO-DOC-06** (đồng ý điều kiện, nhưng ghi ở sổ giao ca thay cho "Ghi chú nội bộ" vì Desk không có ô này) và **FB-R3-SEC-PO-D07** (đồng ý đọc to, không dùng trang khách tập với khách thật).
- Thẻ trùng trả lời một lần:
  - **SEC D01 = UXD DT1-01** (thứ tự thông báo – đồng ý);
  - **BA M13-01 = DOM DOC-01…04** phần mã. BA M13-02 cũng trùng DOM A.1 phần chỗ rà. BA M13-06 trùng DOM DOC-07.

## 1. Quyết định chung đã áp vào cả 4 tài liệu

1. **Giữ chỗ quá hạn** theo DOM mục A:
   - rà **3 mốc** mỗi ngày (mở quầy ≤ 09:00, **11:00**, trước khi rời quầy ≤ 21:00), thêm mỗi lần thấy **Giữ chỗ sắp hết hạn**;
   - xử lý **trước hạn** là lối chính;
   - sau hạn Desk `v1.0.0` **chỉ còn Hủy giữ chỗ**;
   - chưa cọc: hủy ngay, tạo lại một lần (12 h);
   - có cọc: hủy – hoàn, hoặc để nguyên đơn rồi khi khách đến thì hủy – đặt lại – thu đủ – hoàn cọc cũ.
   - Đã bỏ mọi chỗ nói "chấp nhận cọc thiếu", "xác nhận sau hạn", "gia hạn sau hạn" như việc làm được trên Desk v1.0.0. Còn lại chỉ là câu "chưa có" và dòng v1.0.1.
2. **Chỗ rà và tên trên màn** theo BA:
   - rà ở **Đơn đặt phòng** → **Đang hiệu lực** → **Giữ chỗ · chờ cọc**;
   - Desk hiện "**còn 0 giờ 00 phút**". "0h00" chỉ là tên gọi tắt, giải thích một lần ở sổ tay 2.4;
   - **Hôm nay** chỉ có đơn đến hôm nay, **Sơ đồ phòng** chỉ hiện 14 ngày;
   - tên nút folio: **Folio & điều chỉnh** → **Điều chỉnh** → **Bỏ cả dòng**.
3. **Một người trực giữ 6 vai** (decision-log 29/10):
   - bỏ cách viết theo ca và "báo lễ tân trưởng / quản lý quyết" ở mọi khối tạm;
   - người trực quyết bằng quyền quản lý, có ghi lý do; OWN xem lại trong lượt B1–B6 và chi hoàn tiền mặt;
   - một câu chung ở one-pager Tờ 1, sổ tay "Cách đọc", day-one mục 10, release notes;
   - phần sổ tay viết theo vai cho sau này vẫn giữ.
4. **Chữ hướng tới khách** dùng nguyên văn bản UXD mục 1.1–1.2, dựa trên SEC mục B, đủ 6 ý:
   - EN dẫn, VI hỗ trợ; ngắn, điềm tĩnh, không emoji;
   - chỉ màu Ink, Stone Grey, Light Oak (quy cách ở chú thích Tờ 4).
5. **Lệch với DOM A.3, A.4 – báo DOM:**
   - DOM ghi "Ghi chú nội bộ" trên đơn. Khung đơn đã tạo **không có ô ghi chú** cho lễ tân (sổ tay 2.14a đã ghi vậy). Ô "Ghi chú nội bộ" chỉ có khi đặt đơn kênh Nội bộ (`BookingDialog.tsx`).
   - PO dùng **sổ giao ca**, cùng mẫu chữ DOM: "OTM-… Giữ – cọc thiếu …, thu khi đến – [người quyết] dd/mm", "Tạo lại từ OTM-…".
   - Ý nghiệp vụ không đổi.

## 2. Thẻ của SEC

| ID | Mức | Trả lời | Lý do | Đã sửa ở đâu |
|---|---|---|---|---|
| FB-R3-SEC-PO-D01 (= UXD DT1-01) | Major | **Đồng ý** | Thông báo phải tới khách trước khi thu giấy tờ. Trang khách cũng theo thứ tự này (bước `notice` trước giấy tờ) | One-pager Tờ 1 dòng **Nhận phòng** (chỉ Tờ 4 "trước khi nhận giấy tờ", câu mời EN/VI của UXD) và khối câu đồng ý (hỏi ở Khối 1). Sổ tay 0.8 điểm 4 (tách hai lúc), 2.10 bước 1, 2.11 bước 3, 5.8 bài (7). Day-one mục 10 dòng 1. Release notes mục check-in online |
| FB-R3-SEC-PO-D02 | Minor | **Đồng ý** | Tờ ở quầy là văn bản duy nhất khách thấy | Tờ 4 đoạn cuối EN/VI (nguyên văn SEC). Sổ tay 0.8 điểm 8. Release notes "Yêu cầu của khách về dữ liệu cá nhân" |
| FB-R3-SEC-PO-D03 | Minor | **Đồng ý** | Hai kênh (landing, quầy) phải nói cùng một hạn | Tờ 4 đoạn 3. UXD tách vế sao lưu thành câu riêng, SEC giữ quyền đòi nguyên câu mục B. Sổ tay 0.8 điểm 4. Release notes "Hạn lưu ảnh giấy tờ". Câu cho `gw.notice_body` v2: ORC chuyển UXD/FE-B (SEC C.1 ý 3) |
| FB-R3-SEC-PO-D04 | Minor | **Đồng ý** | Desk nhận phòng sớm từ 06:00 | Day-one mục 10 dòng 1: OWN đặt Tờ 4 **tối D−1 sau buổi đào tạo, muộn nhất 06:00 ngày D**. Chú thích Tờ 4 và bảng "Cách in và dán" của one-pager |
| FB-R3-SEC-PO-D05 | Minor | **Đồng ý** | Lỡ gửi là rủi ro chính còn lại của D-T4 (a) | One-pager Tờ 2a khối check-in. Sổ tay 2.9: thu hồi link ngay, ghi **mã đơn** vào sổ giao ca (không tên khách), báo chủ đầu tư trong ngày, chỉ Tờ 4 khi khách tới, không xóa ảnh, đội đếm link mỗi sáng. Với một người trực, "báo lễ tân trưởng" đổi thành "báo chủ đầu tư" |
| FB-R3-SEC-PO-D06 | Suggestion | **Đồng ý** | Quy trình nội bộ không để phía khách | Chú thích Tờ 1 và bảng "Cách in và dán": Tờ 1, 2a ở phía trong quầy; Tờ 4 trong khung mica phía khách; các tờ in tách nhau |
| FB-R3-SEC-PO-D07 | Suggestion | **Đồng ý một phần** | Đồng ý thêm câu cho lễ tân đọc to câu hạn lưu (EN) khi khách không đọc được EN/VI. **Không** dùng ý "mở thông báo tiếng của khách trên trang khách tập": trang tập là staging, không dùng với khách thật. Bản RU trên tờ: theo UXD, chờ bản dịch v2 đã duyệt | One-pager Tờ 1 khối câu đồng ý. Sổ tay 0.8 điểm 4 |
| FB-R3-SEC-PO-D08 | Suggestion | **Đồng ý** | Cần bằng chứng khách đã thấy bản chữ nào | Release notes: "đội bảo mật đã đồng ý 30/10". Chân Tờ 4: "OTTIMO · ID notice · 11/2026". Đã bỏ các chú thích "CHỜ SEC" ở one-pager, sổ tay 0.8 và 2.9 |

SEC mục A (S1–S5) và mục C:
- Đã đưa vào tài liệu: S4 (đội đếm link), S5 (thu hồi, ghi mã đơn, không xóa ảnh), điều kiện mở lại có RU và cùng chữ với tờ (release notes, chú thích sổ tay 2.9).
- Dòng decision-log C.3 và truy vấn C.2: ORC và OPS làm, PO không ghi.

## 3. Thẻ của DOM

| ID | Mức | Trả lời | Lý do | Đã sửa ở đâu |
|---|---|---|---|---|
| FB-R3-DOM-PO-DOC-01 (+ BA M13-01) | Major | **Đồng ý** | Sau hạn Desk từ chối xác nhận cọc. Tài liệu cũ dạy một thao tác luôn lỗi trước mặt khách | Sổ tay 2.4: khung mới (A.2 + A.3, bảng ví dụ căn 202), "Lưu ý" bấm xác nhận trước giờ hạn. One-pager Tờ 1 dòng **Cọc**, Tờ 2a. Release notes "Giới hạn đã biết". Lỗi đã có: **BUG-R3-042** (P1, v1.0.1 bắt buộc) |
| FB-R3-DOM-PO-DOC-02 | Major | **Đồng ý** | Desk không có ô chấp nhận cọc thiếu | Đã bỏ "chấp nhận cọc thiếu" như thao tác hiện có ở cả 4 tệp. Thay bằng "giữ – thu khi đến" (sổ tay 2.4, Tờ 2a). Sổ tay 2.4 "Lưu ý" và 5.6 có dòng "chưa có". Backlog: **BUG-R3-043** v1.0.1 bắt buộc |
| FB-R3-DOM-PO-DOC-03 | Major | **Đồng ý** | Sau hạn không có gì để quyết; giữ căn thêm làm mất bán | Sổ tay 2.4 khung bước 2 (A.4: hủy ngay → báo khách → tạo lại một lần 12 h; đến hôm nay thì thu tiền ngay; không cần báo ai). Tờ 2a. Release notes |
| FB-R3-DOM-PO-DOC-04 | Major | **Đồng ý** | OTTIMO có một người trực; kiểm soát phải có giờ cụ thể | 3 mốc: sổ tay 2.1 bước 4, 2.4, 5.6; Tờ 2a; day-one mục 10; release notes. Câu một người trực ở 4 tệp. Bỏ ý "lễ tân trưởng ký sổ" (`outputs/PO/v1.0.0-docs-update.md` mục 6). OWN xem lại trong lượt B1–B6 (sổ tay 1.1 thêm dòng). Câu "khi có thêm lễ tân…" ở Tờ 1, sổ tay 2.4, day-one |
| FB-R3-DOM-PO-DOC-05 | Minor | **Đồng ý** | Không để quá hạn thì không cần cách tạm | One-pager Tờ 1 dòng **Cọc** (gọi ngay khi chuyển thiếu, gia hạn trước hạn, bấm trước giờ hạn). Sổ tay 2.4 "Lưu ý" (3 ý mới, gia hạn chỉ trước hạn) |
| FB-R3-DOM-PO-DOC-06 | Minor | **Đồng ý một phần** | Đồng ý đổi điều kiện cuối ngày, để đơn đã quyết không bị xử lý lại. Nhưng Desk không có ô "Ghi chú nội bộ" trên đơn đã tạo (mục 1 ý 5), nên điều kiện ghi theo **sổ giao ca** | Tờ 2a "Trước khi rời quầy". Sổ tay 2.1 Cuối ca ý 1, 2.4 "Sổ giao ca". Tờ 1 "Trước khi rời quầy" bỏ vế 0h00 (theo UXD) |
| FB-R3-DOM-PO-DOC-07 (= BA M13-06) | Minor | **Đồng ý** | Không có lựa chọn "Hết hạn giữ chỗ" | Lý do **Khác (ghi rõ)** "Hết hạn giữ chỗ"; gọi không được thì **Không liên lạc được**. Sổ tay 2.4, 2.8 (liệt kê đủ lý do), Tờ 2a, release notes |
| FB-R3-DOM-PO-DOC-08 | Minor | **Đồng ý** | Hộp chỉ có 12/24/48 giờ; rà ngay sau khi nhập thì không bắt được gì | Day-one 4.3 (chọn 12 h; Desk tự cắt ở 12:00 ngày D). Day-one mục 10: lượt đầu trước khi rời quầy tối D−1, rồi 3 mốc từ ngày D |
| FB-R3-DOM-PO-DOC-09 | Minor | **Đồng ý** | Sửa thông báo mà chưa sửa lối ra thì chưa bỏ cách tạm được | Day-one mục 10 cột "Tới khi nào". Release notes: điều kiện bỏ cách tạm và 4 dòng mới ở "Chưa có trong bản này". Chú thích Tờ 2a. Backlog 5.6 |
| FB-R3-DOM-PO-DOC-10 | Suggestion | **Đồng ý** | Thủ tục ngắn và đúng người | (1) Chỉ hỏi khi có chụp ảnh; khách chuyển đổi không hỏi. (2) Hỏi từng người lớn được chụp. Cả hai ở Tờ 1 và sổ tay 0.8, 2.11. (3) "Từ điện thoại của cơ sở, không mở Zalo trên máy quầy" ở Tờ 1 dòng **Cọc** |

DOM mục A.3a (vá v1.0.1) và A.5 (người nhận thông báo): PO nhận vào phạm vi v1.0.1, xem mục 6. A.6 (dòng decision-log nhãn DOM): ORC ghi.

## 4. Thẻ của UXD

| ID | Mức | Trả lời | Lý do | Đã sửa ở đâu |
|---|---|---|---|---|
| FB-R3-UXD-PO-DT1-01 | Major | **Đồng ý** – trùng SEC D01 | Xem SEC D01 | Như SEC D01. Câu mời "Before I take your ID, please read this note on how we use it." / "Trước khi nhận giấy tờ, mời anh/chị đọc tờ này về cách chúng tôi dùng thông tin." |
| FB-R3-UXD-PO-DT1-02 | Major | **Đồng ý** | Câu cũ sai ngữ pháp, số ít, thiếu quyền từ chối | Câu hỏi đồng ý EN/VI nguyên văn UXD 1.1, kèm ghi chú N = 1, dặn gọi "anh" hoặc "chị". Ở Tờ 1 và sổ tay 0.8 điểm 4 |
| FB-R3-UXD-PO-DT1-03 | Major | **Đồng ý** | Chữ duy nhất khách đọc ở quầy | Tờ 4 dùng nguyên văn UXD 1.2: 4 đoạn EN, đường phân cách, 4 đoạn VI, chân trang. Chú thích ghi nguồn từng câu và quy cách 1.3 |
| FB-R3-UXD-PO-DT1-04 | Major | **Đồng ý** | Không vừa một mặt A4; phần tạm phải gỡ được riêng | One-pager sắp lại thành Tờ 1, 2a, 2b, 3, 4 theo bảng UXD mục 2. Phần buồng phòng lấy lại 3 dòng "Luôn nhớ" và thêm "Khi có sự cố" riêng cho app. Dòng đầu: "In 4 tờ, mỗi tờ một mặt". Bảng "Cách in và dán" cuối tệp. Day-one mục 2 dòng D−1 và mục 10 |
| FB-R3-UXD-PO-DT1-05 | Minor | **Đồng ý** | Khách dễ hỏi "30 ngày hay 3 tháng" | Sổ tay 5.4: câu hỏi mới, câu trả lời EN/VI nguyên văn UXD. 0.8 điểm 4 trỏ tới đây |
| FB-R3-UXD-PO-DT1-06 | Minor | **Đồng ý** | Lịch sử sửa chiếm chỗ tờ in | Lịch sử chuyển vào `<!-- -->`. Dòng in: "Dành cho lễ tân và buồng phòng · Bản 30/10/2026 · v1.0.0 · Hướng dẫn đầy đủ: Sổ tay OTTIMO Desk v1.0 · In 4 tờ…" |
| FB-R3-UXD-PO-DT1-S01 | Suggestion | **Đồng ý** | Một câu cho cả lời nói và chữ trên màn | "Check-in is from 12:00. Your room is always ready by 14:00." / "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00." ở Tờ 1, sổ tay 2.10, release notes (mục Giờ nhận và trả phòng) |
| FB-R3-UXD-PO-DT1-S02 | Suggestion | **Đồng ý** – chuyển SEC | Truy vết bản chữ. Việc ghi decision-log thuộc SEC | Ghi chú nguồn ở sổ tay 0.8 điểm 4 (consent_record kênh desk `privacy-2026-10-v1` đi kèm tờ "ID notice 11/2026"). ORC hỏi SEC có ghi dòng decision-log không |

## 5. Thẻ của BA

| ID | Mức | Trả lời | Lý do | Đã sửa ở đâu |
|---|---|---|---|---|
| FB-R3-BA-PO-M13-01 | **Blocker** | **Đồng ý** – trả lời chung với DOM DOC-01…04 | Hai trong ba lối ra không làm được trên Desk; câu lỗi dẫn tới tạo đơn chồng | Sổ tay 2.4: khung "Lỗi đang sửa – Giữ chỗ quá hạn" viết lại. Gồm: trọng tâm trước hạn; sau hạn chỉ còn Hủy; "hủy đơn cũ trước, đặt đơn mới sau"; hộp hủy ghi "không thu phí" nhưng vẫn hoàn; duyệt hoàn ≠ chi hoàn. Đã sửa cùng lúc one-pager (Tờ 2a), release notes, day-one mục 10. Vá v1.0.1: BUG-R3-042, 043 (mục 6) |
| FB-R3-BA-PO-M13-02 | Major | **Đồng ý** | Rà theo hai màn cũ sẽ sót đơn đến xa hơn 14 ngày | Lối rà đủ ở sổ tay 2.1 bước 4, 2.4, 5.6; Tờ 2a; day-one mục 10; release notes. "còn 0 giờ 00 phút" giải thích ở 2.4. Khối **Giữ chỗ chưa cọc (n)** (đến hôm nay, gồm đơn có một phần cọc): 2.1 bước 3 và bảng 2.2 |
| FB-R3-BA-PO-M13-03 | Major | **Đồng ý** | Lễ tân đọc "đơn đã tự hủy" rồi bỏ qua | Sổ tay 2.4 khung (đầu khung, ý 3) và 5.6 (dòng mới). Tờ 2a. Release notes. Lỗi: **BUG-R3-044** |
| FB-R3-BA-PO-M13-04 | Major | **Đồng ý** | Folio khóa thì không ai ghi được; "đảo dòng" không phải tên nút | Sổ tay 1.11 viết lại (trong 24 giờ / quá 24 giờ, tên nút thật, Xóa công nợ khi còn nợ, nút còn hiện tới khoảng 1 giờ); 2.10 "Nhận nhầm"; 5.6 (dòng mới + dòng Hoàn tác). Release notes dòng "Ghi phát sinh sau trả phòng" và dòng mới "Folio đã khóa sau 24 giờ". Lỗi chữ: **BUG-R3-045** |
| FB-R3-BA-PO-M13-05 | Minor | **Đồng ý** | Ca cần bằng chứng nhất | Sổ tay 1.11: **Khoản**, **Số lượng**, **Ghi chú**, **Thêm vào folio**; **Ảnh hoặc ghi chú bằng chứng** bắt buộc; **Thêm ảnh từ buồng phòng**; xóa ảnh khỏi điện thoại sau khi đính; cảnh báo nội quy |
| FB-R3-BA-PO-M13-06 | Minor | **Đồng ý** – trùng DOM DOC-07 | Xem DOM DOC-07 | Như DOM DOC-07 |
| FB-R3-BA-PO-M13-07 | Minor | **Đồng ý** | Tờ chưa có số phiếu không được đưa khách | Sổ tay 2.14 Bill bước 1–3 (bản xem trước không đưa khách, hai lối mở phiếu, chỉ in sau khi hoàn tất) |
| FB-R3-BA-PO-M13-08 | Suggestion | **Đồng ý** | Bản mới nhất ở trên; câu Wi-Fi giống nhau ở mọi mục | 5.7 xếp 1.3 · 1.2 · 1.1 · 1.0; cột Người của 1.3: "PO; BA rà 30/10; DOM, UXD, SEC review 30/10". 5.4 câu Wi-Fi khớp 1.4 |
| FB-R3-BA-PO-M13-09 | Suggestion | **Đồng ý** – chuyển QA ở D-T2 | Ảnh giúp nhận đúng màn khi đào tạo | Chưa thêm chỗ chèn ảnh vào sổ tay. Mã "C1-11" BA gợi ý đang là ảnh tài khoản VietQR trong `screenshot-list.md`, nên QA cấp mã mới khi chụp ở D-T2: Thêm phát sinh trên đơn Đã trả phòng; giữ chỗ quá hạn có cọc (Sơ đồ phòng + khung đơn); C2-35 bản A4. Che dữ liệu khách theo quy tắc hiện hành |

## 6. Bổ sung của ORC: BUG-R3-042…045 và ĐX-R3-QA-01

**Release notes "Giới hạn đã biết"** gom thành một mục "Giữ chỗ quá hạn – Desk không báo, và sau hạn chỉ còn nút Hủy". Mục này gồm BUG-R3-041, WA-04, 042, 043, 044:
- cách tạm theo DOM A.2 + A.3 (phòng trước; rà 3 mốc; chưa cọc thì hủy ngay; có cọc thì hủy – hoàn, hoặc để nguyên rồi hủy – đặt lại – thu đủ – hoàn cọc cũ khi khách đến);
- với **044**, nhắc rõ: "**Đừng tin dòng 'Không thu phí' này:** Desk vẫn tạo yêu cầu hoàn đủ số đã nhận" (cùng câu ở sổ tay 2.4, 2.8, 5.6 và Tờ 2a);
- **045** có dòng riêng "Folio đã khóa sau 24 giờ";
- "Chưa có trong bản này" thêm 4 dòng v1.0.1.

**Phạm vi v1.0.1 – quyết định PO** (quyền PO: phạm vi trong bản; ghi ở `03-backlog/backlog.md` mục 5.6):

| Mục | Đích | Ghi chú |
|---|---|---|
| BUG-R3-042 (P1) – V1 | **Bắt buộc** | Giữ chỗ đã nhận > 0 đ thì FD+ ghi thêm và xác nhận được tới khi nhận phòng; giữ chỗ chưa cọc giữ "tiền về trước hạn". ARC duyệt hợp đồng, SEC xem lại SEC-BE-22 |
| BUG-R3-043 (P2) – V2 | **Bắt buộc** | Ô "Chấp nhận cọc thiếu – lý do" cho OWN/MGR; API đã có. UXD đặt chữ |
| BUG-R3-041 + WA-04 – V4 | **Bắt buộc** (đã xếp) | Người nhận theo DOM A.5 |
| BUG-R3-044 (P2) – V3 + M13-03 | Nên có | Tài liệu đã có cách đọc đúng |
| **ĐX-R3-QA-01** – V5 | **Nhận, nên có, gộp với BUG-R3-041** | Nhận AC 1–3 của QA (mục 4 bug-list) và đổi tên khối "Giữ chỗ chờ cọc (n)" (UXD). Không có thì lượt rà tay ở **Đơn đặt phòng** vẫn bắt được, nên không bắt buộc |
| BUG-R3-045 (P3) | v1.0.1, dời v1.0.2 nếu quá tải | Chỉ là chữ; tài liệu đã ghi đúng |

- Ba dòng bắt buộc đứng trước mọi lỗi P3 trong bảng 5.6.
- Điều kiện bỏ cách tạm giữ chỗ (DOM-09): v1.0.1 có đủ V1, V2, V4 và QA thử lại cả ba lối ra BR-303 trước và sau hạn trên staging.
- Nếu V1 hoặc V2 không kịp v1.0.1 (04/11): ORC nêu với INV trong tóm tắt (khách phải nhận hoàn rồi trả lại), theo DOM A.3a. Hiện **chưa cần ESC**: hướng xử lý không đổi chính sách cọc hay hoàn của ESC-006.

## 7. Dòng decision-log đề xuất (ORC ghi khi commit)

| 2026-10-30 | 3 | **PO – Phản hồi review tài liệu ngày D (`v1.0.0`)** (`rounds/round-03/responses/PO-to-v1.0.0-docs-reviews.md`): 35 thẻ (SEC 8, DOM 10, UXD 8, BA 9) – 33 đồng ý, 2 đồng ý một phần, 0 Blocker/Major mở. Tài liệu theo DOM mục A (rà 3 mốc; sau hạn Desk v1.0.0 chỉ còn Hủy; có cọc để nguyên – làm lại khi khách đến; chưa cọc hủy ngay – tạo lại 1 lần), chỗ rà ở Đơn đặt phòng (BA), Tờ 4 "Your ID details" trước khi nhận giấy tờ (SEC D01), chữ UXD 1.1–1.2, one-pager 4 tờ một mặt (UXD). Ghi sổ giao ca thay "Ghi chú nội bộ" (Desk không có ô trên đơn đã tạo). **Phạm vi v1.0.1**: BUG-R3-042, 043, 041 + WA-04 bắt buộc; 044 và ĐX-R3-QA-01 (gộp 041) nên có; 045 P3 | PO | Quyền PO (phạm vi trong bản, tài liệu vận hành); không đổi chính sách ESC-006 |

## 8. Giả định PO đã dùng

- [GIẢ ĐỊNH] Khung đơn đã tạo không có ô ghi chú cho lễ tân (theo sổ tay 2.14a và `BookingDialog.tsx`: ô "Ghi chú nội bộ" chỉ khi kênh Nội bộ). Nếu QA thấy có ô ghi chú trên đơn: thêm "ghi ở **Ghi chú nội bộ**" bên cạnh sổ giao ca, không bỏ sổ giao ca.
- [GIẢ ĐỊNH] Đặt phòng mới ở quầy (đơn Trực tiếp) lưu thành **Đã xác nhận** và nhận phòng được khi thu đủ ở bước nhận phòng (day-one 4.1 bước 3). Dựa trên đọc mã của DOM, chưa thử trên staging. Đề nghị QA thử luồng "hủy – đặt lại – thu đủ – nhận phòng – hoàn cọc cũ" trên staging trước buổi C3a nếu kịp.
- Câu "Desk không cho người tạo yêu cầu tự chi tiền mặt" lấy từ DOM A.3 (đọc mã). OWN chi hoàn tiền mặt.

## 9. Việc còn lại

**UXD – bản in (trước 12:00 ngày 01/11):**
- Dựng bản in HTML từ `product/docs/staff-one-pager.md` theo 4 phần `## Tờ …`. Kiểm bằng PDF Chrome rằng mỗi tờ vừa đúng một mặt.
- **Tờ 2a dài hơn bản UXD đã đo**, vì có thêm khối giữ chỗ theo DOM. Không vừa A5 ở 10 pt thì báo PO cắt chữ (bảng đầy đủ đã nằm ở sổ tay 2.4), hoặc in 2a riêng trên A4. Không giảm dưới 9 pt.
- Tờ 4 theo quy cách 1.3, chân trang "OTTIMO · ID notice · 11/2026".
- Duyệt lại câu mời "Before I take your ID…" (đã dùng bản UXD) và câu một người trực ở Tờ 1.
- Chữ v1.0.1: BUG-R3-043 (nhãn ô chấp nhận cọc thiếu), 044 ("đơn đã tự hủy", `HOLD_EXPIRED`, hộp hủy), 045 (`FOLIO_LOCKED`), khối "Giữ chỗ chờ cọc (n)".

**INV / OWN:**
- D−1 (01/11): in 4 tờ một mặt trên máy văn phòng. In thử Tờ 4 trên giấy trắng hoặc ngà, xem dưới đèn quầy.
- Đặt Tờ 4 trong khung mica phía khách **tối 01/11 sau buổi đào tạo, muộn nhất 06:00 ngày 02/11**.
- Dán Tờ 1 và 2a phía trong quầy; kẹp 2b sau Tờ 1; Tờ 3 ở phòng buồng.
- In thử một phiếu thanh toán A4.
- Từ ngày D: chi hoàn tiền mặt mà người trực đã duyệt. Xem lại các dòng "giữ chỗ" trong sổ giao ca và các yêu cầu hoàn trong lượt B1–B6.
- Báo "gỡ Tờ 2a" khi đội báo v1.0.1 đủ điều kiện.

**ORC / QA / SEC:**
- ORC: ghi decision-log (mục 7, dòng SEC C.3, DOM A.6, UXD dàn trang); commit.
- QA: chụp ảnh M13-09 ở D-T2; nếu kịp, thử luồng làm lại đơn có cọc trên staging (mục 8).
- SEC: quyết dòng decision-log UXD S02; duyệt việc UXD tách câu sao lưu ở Tờ 4.
- Buổi C3a 31/10 dạy theo sổ tay 2.4 mới và bài tập 5.8 (6), (7) đã sửa.

## 10. Trả lời QA thử luồng giữ chỗ quá hạn (`qa/qa3-rc1.md` mục 20.7) – PO, 30/10 khuya

Bước **Phản hồi & sửa**, trước buổi đào tạo C3a 31/10. Nguồn: `qa/qa3-rc1.md` mục 20.1–20.7, `qa/bug-list.md` BUG-R3-046, 047 (commit `441c159`). Không đổi chính sách: quy tắc tách nhiệm hoàn tiền (SEC F8) giữ nguyên, PO chỉ sửa tài liệu cho đúng Desk.

### 10.1 Kết quả các giả định ở mục 8

| Giả định PO (mục 8) | QA | PO xử lý |
|---|---|---|
| Khung đơn đã tạo không có ô ghi chú cho lễ tân | **Đúng** (G1) | Giữ sổ giao ca. Không sửa |
| Đơn Trực tiếp mới lưu **Đã xác nhận**, nhận phòng được khi thu đủ ở bước nhận phòng | **Đúng một phần** (G2): đơn mới phải đủ **cọc yêu cầu ngay lúc đặt** (422 `DEPOSIT_INSUFFICIENT`) | Sửa: bước (b) thu cọc, bước (c) chỉ thu phần còn lại (việc 3 dưới) |
| Người tạo yêu cầu không tự chi tiền mặt | **Đúng** (G3) | Giữ, nói rõ thêm |
| (DOM A.3, sổ tay 2.4) Người trực hủy **và duyệt** | **Sai** (G4): 403 `SELF_APPROVAL_FORBIDDEN`, không ngoại lệ | Sửa: OWN duyệt và chi (việc 2 dưới) |

### 10.2 Bốn việc ở 20.7 – đã sửa

| # | Việc QA đề nghị | Quyết định PO | Chỗ đã sửa |
|---|---|---|---|
| 1 | Bỏ "Khác (ghi rõ)" khỏi hướng dẫn hủy (BUG-R3-046) | **Đồng ý.** Tới v1.0.1 dùng **Không liên lạc được** (gọi không được; giữ chỗ chưa cọc tới hạn) hoặc **Khách đổi ý** (khách không đi; làm lại đơn khi khách đến). Điều cần giải thích ghi sổ giao ca kèm mã đơn, không ghi tên khách. Áp cho cả **Hủy giữ chỗ** và **Hủy đơn** (hộp dùng chung) | Sổ tay 2.4 (bước 2 chưa cọc, dòng "Không đi nữa", dòng "Khách đó tới quầy" (a), khung mới "Hủy với lý do Khác"), 2.8 (bước 1 + khung "Lỗi đang sửa"), 5.6 (dòng mới). One-pager Tờ 2a (dòng "Lý do hủy" mới, bỏ "Khác" ở "Chưa cọc" và "Đã có cọc"; lý do thật vào dòng "Sổ giao ca"). Day-one mục 10. Release notes: khối giữ chỗ + mục mới BUG-R3-046 trong "Giới hạn đã biết" |
| 2 | Người trực không tự duyệt khoản hoàn do mình tạo | **Đồng ý.** Câu chuẩn: "người trực hủy và **nhập nơi nhận hoàn**; **chủ đầu tư duyệt và chi**". Người trực nhập nơi nhận **trước** (nếu OWN tự nhập nơi nhận tiền mặt thì OWN không duyệt được khoản đó). Bỏ "mở **Cần duyệt** để duyệt hoàn" khỏi việc của người trực. **OWN vắng thì khách chưa nhận lại cọc tại quầy được**, kể cả người trực có quyền quản lý: người trực nói thật với khách và hẹn một trong hai cách – OTTIMO chuyển khoản lại trong ngày sau khi OWN duyệt, hoặc khách nhận tiền mặt ở quầy khi OWN có mặt trong thời gian ở; ghi cách đã hẹn vào sổ giao ca | Sổ tay 1.1 (dòng ~212: "duyệt và chi các khoản hoàn người trực tạo"), 1.8 (bảng: "không phải người tạo yêu cầu"; thêm 2 quy tắc tách nhiệm: hoàn không ngoại lệ, người nhập nơi nhận tiền mặt không duyệt), 1.12 bước 1, 2.4 (dòng "Không đi nữa", dòng "Khách đó tới quầy" (a), (d) + câu OWN vắng; Lưu ý "khách chuyển thiếu"), 2.8 (bước 1 gạch đầu dòng, bước 4), 2.17, 5.8 bài (6). One-pager Tờ 1 (tách **Hoàn tiền** khỏi dòng hạn mức: "người tạo yêu cầu không tự duyệt, không tự chi – hiện chủ đầu tư duyệt và chi"), Tờ 2a "Đã có cọc". Day-one mục 9 dòng 1, mục 10 dòng "Rà giữ chỗ". Release notes: khối giữ chỗ + gạch đầu dòng "Người trực không tự duyệt…" |
| 3 | Bước (b) phải thu cọc ngay khi đặt đơn mới | **Đồng ý.** (b) **Số tiền đã nhận** ít nhất bằng **Cọc cần thu** (ví dụ 700.000), chọn cách thanh toán; (c) ở bước nhận phòng thu phần còn lại (ví dụ 1.676.000). Tổng khách trả không đổi. Dòng "lỡ chuyển nốt sau hạn": phần đã chuyển ghi ở (b); chưa đủ cọc thì khách chuyển thêm phần thiếu ngay, ghi chung một khoản chuyển khoản, ghi chú cả hai lần chuyển (Desk chỉ nhận một cách thanh toán khi đặt và khi nhận phòng) | Sổ tay 2.4 (dòng "Khách đó tới quầy" (b), (c); dòng "lỡ chuyển nốt sau hạn"), 5.6. One-pager Tờ 2a ("thu đủ cọc ngay → nhận phòng, thu phần còn lại"). Day-one mục 10. Release notes khối giữ chỗ |
| 4 | Các phần còn lại của cách tạm đúng trên staging | **Ghi nhận.** Không sửa | – |
| (047) | BUG-R3-047: khung đơn giữ chỗ hiện nút link check-in online | **Thêm nhắc "không bấm"** (check-in online đằng nào cũng tạm dừng theo D-T4). One-pager Tờ 2a **không** thêm: khối "Check-in online – tạm dừng" đã ghi "Không tạo, không gửi link" cho mọi đơn | Sổ tay 2.4 (Lưu ý), 2.9 (khung tạm dừng + bước 1 "Mở đơn **đã xác nhận**"), 5.6. Day-one mục 10 dòng check-in. Release notes "Lỗi nhỏ còn mở" |

Sổ tay lên **bản nội dung 1.4** (dòng đầu tệp, 5.7, release notes). Ghi chú nguồn ở cuối khung 2.4 đã thêm tham chiếu QA 20.

### 10.3 Bản in (Tờ 1, 2a đã hết chỗ – theo `outputs/UXD/print-sheets-v1.0.0.md`)

Chạy `python3 -I product/design/tools/build_print_sheets.py --pdf`: **thoát mã 0, cả 4 tờ vừa một mặt, cỡ chữ không đổi.**

| Tờ | Kết quả | Chỗ trống còn lại | Cắt chữ để bù (cùng tờ) |
|---|---|---|---|
| 1 – Quầy lễ tân (9 pt) | Vừa | 0,5 mm (như trước) | Rút câu khách tới 12:00–14:00 thành "giữ hành lý, hẹn giờ; không phụ thu, không giảm giá" (gợi ý của UXD); bỏ vế "Desk sẽ từ chối" ở câu mật khẩu |
| 2a – Tạm tới v1.0.1 (10 pt) | Vừa (lần đầu tràn, thoát mã 1; cắt tiếp tới khi vừa) | **0 mm** – không thêm được chữ nào nữa | Bỏ chú thích "(Hôm nay chỉ có đơn đến hôm nay; Sơ đồ phòng chỉ 14 ngày)" – đã có ở sổ tay 2.4; rút "màu đỏ (gọi tắt…) sau hạn" thành "đỏ ("0h00")"; rút câu hoàn ở "Đã có cọc"; gộp "lý do thật" vào dòng Sổ giao ca |
| 2b, 3 | Vừa, không đổi chữ | 49 mm, 60,5 mm | – |
| 4 – Your ID details | Vừa, **không đổi chữ** (không qua SEC D08) | 2 mm | – |

- PDF mới: `product/docs/print/pdf/to-1-quay-le-tan.pdf`, `to-2a-2b-a4-cat-doi.pdf` (HTML cùng tên trong `product/docs/print/`). PDF Tờ 3, 4 khôi phục về bản đã commit vì chữ không đổi (bộ dựng ghi lại byte khác nhưng nội dung như cũ).
- PO đã xem ảnh trang 2a + 2b: chữ đủ, chân tờ còn nguyên.
- **OWN in lại Tờ 1 và Tờ 2a/2b** từ PDF mới ngày 01/11 (Tờ 3, 4 không đổi).

### 10.4 Việc cần xác nhận

**DOM (nghiệp vụ, trước C3a):**
- D-QA-1: duyệt cách chọn lý do tạm: chưa cọc quá hạn → **Không liên lạc được**; có cọc khách không đi → **Khách đổi ý** / **Không liên lạc được**; làm lại khi khách đến → **Khách đổi ý**. Báo DATA: K-22a (lý do hủy) lệch tới v1.0.1, đọc kèm sổ giao ca.
- D-QA-2: sửa câu "Tài khoản 6 vai tự duyệt được" trong `reviews/DOM-on-PO-v1.0.0-docs.md` mục A.3 (tệp của DOM) cho khớp sổ tay.
- D-QA-3: duyệt câu hẹn khách khi OWN vắng ("chuyển khoản lại trong ngày sau khi OWN duyệt" hoặc "tiền mặt khi OWN có mặt trong thời gian ở"). Câu "trong ngày" là cam kết của OWN – nếu OWN không chắc làm được, DOM đổi thành "trong 24 giờ".
- D-QA-4 (PO thấy thêm, **chưa sửa**): sổ tay 2.4 bước 2 "Đến từ ngày mai" ghi "Giảm giá hoặc FOC của đơn cũ phải xin lại (người trực tự duyệt bằng quyền quản lý, có lý do)". Mục 1.8 ghi "không ai tự duyệt yêu cầu của chính mình, trừ khoản nằm trong hạn mức tự áp của vai". Cần DOM (đọc BR-433/436) và QA (nếu kịp) xác nhận người trực có tự duyệt được giảm giá/FOC do chính mình gửi không. Nếu không: đổi thành "chủ đầu tư duyệt".
- D-QA-5: duyệt cách ghi ca "lỡ chuyển nốt sau hạn" khi phần đã chuyển chưa đủ cọc (gộp với phần chuyển thêm thành một khoản chuyển khoản ở bước (b)).

**SEC:** không đổi quy tắc, không cần duyệt lại. Đề nghị SEC đọc 2 câu mới ở sổ tay 1.8 (hoàn tiền không ngoại lệ; người nhập nơi nhận tiền mặt không duyệt được, kể cả OWN) cho khớp F8. Nếu ở buổi C3a chủ đầu tư muốn người trực tự hoàn tại quầy: đó là đổi F8, SEC + INV quyết, không vào v1.0.1. PO **không** tạo ESC lúc này.

**QA (nếu kịp trước C3a):** xác nhận trên Desk (không chỉ API) lễ tân mở được **Nhật ký tiền → Hoàn tiền → Nhập nơi nhận hoàn** trên máy quầy cho khoản do mình tạo.

**UXD / BA:** dựng lại HTML sổ tay theo bản nội dung 1.4 nếu bản HTML dùng cho C3a; ảnh không đổi.

### 10.5 Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-10-30 | 3 | **PO – Sửa tài liệu ngày D theo QA thử luồng giữ chỗ quá hạn** (qa3-rc1.md 20.7; PO-to-v1.0.0-docs-reviews.md mục 10): tới v1.0.1 không dùng lý do hủy "Khác (ghi rõ)" (BUG-R3-046) – chọn "Không liên lạc được"/"Khách đổi ý", lý do thật ghi sổ giao ca; người tạo yêu cầu hoàn không tự duyệt, không tự chi (SELF_APPROVAL_FORBIDDEN/SELF_REFUND_FORBIDDEN, không ngoại lệ) → người trực hủy và nhập nơi nhận, **OWN duyệt và chi**, OWN vắng thì hẹn khách; đặt lại đơn khi khách đến phải thu đủ cọc ngay (DEPOSIT_INSUFFICIENT), nhận phòng thu phần còn lại; không bấm link check-in online trên giữ chỗ (BUG-R3-047). Sổ tay 1.4; bản in Tờ 1, 2a dựng lại vừa một mặt, Tờ 4 không đổi | PO | Quyền PO (tài liệu vận hành theo quy tắc đã chốt; không đổi chính sách hoàn tiền, không đổi SEC F8) |`

### 10.6 Giả định

- [GIẢ ĐỊNH] Lễ tân nhập được nơi nhận hoàn trên Desk ở **Nhật ký tiền → Hoàn tiền** (QA thử bằng API với cookie máy tin cậy: 200; sổ tay 1.12 ghi tab này có **Nhập nơi nhận hoàn**).
- [GIẢ ĐỊNH] Ô **Số tiền đã nhận** khi đặt đơn và khoản thu khi nhận phòng chỉ nhận **một** cách thanh toán (đọc mã FE `initialPayment`, `InlinePay`), nên ca chuyển sau hạn chưa đủ cọc ghi gộp một khoản chuyển khoản.
- Ví dụ số tiền giữ theo sổ tay (2.376.000, cọc 700.000, đã chuyển 300.000).
