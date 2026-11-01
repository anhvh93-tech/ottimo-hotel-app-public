# UXD review – LP-v2 FE lượt sửa lỗi 4 (`lp-v2-fe4`) và kiểm lại chữ FE3, chữ số ít/nhiều của BE

- Round 4 – Bước: Review (lượt sửa lỗi QA: B3–B5 của PO mục 9.1), 01/11/2026
- Người review: UXD. Tác giả: FE (FE-A Desk); phần (5) là chữ BE soạn (BUG-R4-009)
- Đối tượng:
  - `git show 0a25716a` (nhánh `origin/lp-v2`)
  - `rounds/round-04/outputs/FE/lp-v2-fe.md` mục 9–10
  - Ảnh `rounds/round-04/outputs/FE/screenshots/lp-v2-fe4-*.png` và `lp-v2-fe3-desk-*.png`, dữ liệu giả MSW
  - Chữ BE: `ee375e6d`, `product/design/content-guide.md` bản 0.4.4
- Đối chiếu:
  - `00-brief/context/brand/brand-guidelines.md`, `product/design/design-system.md` (C3 Field, chip)
  - `rounds/round-04/outputs/CPY/lp-v2-copy.md` mục 15.1–15.2
  - `rounds/round-04/outputs/PO/lp-v2-stories.md` US-175 AC3–AC5 (sửa 01/11) và mục 9.1
  - `rounds/round-04/reviews/UXD-on-LP-v2-fe2.md` (thẻ FE-13…17)
- Không sửa mã, không commit.

## Kết luận

**ĐẠT – không có Blocker/Major.** Có 6 Minor và 2 Suggestion. Không thẻ nào chặn QA lượt 3. Hai thẻ FE-18 và FE-19 nên sửa trước khi QA chụp lại ảnh S35, vì mỗi thẻ chỉ sửa vài dòng CSS hoặc chữ.

| Câu hỏi của ORC | Kết luận UXD |
|---|---|
| (1) Cột "Ngôn ngữ", ô lọc, dòng tổng số trên S35 ở 1366 px; hai chip xuống 2–3 dòng | **Chấp nhận cách FE chọn. Đây là quyết định bố cục cột của UXD theo AC3.** Cột "Ngôn ngữ" là cột riêng, đặt ngay sau "Trả lời qua", vì hai cột cùng trả lời câu "liên hệ khách thế nào". Hai chip dài được xuống dòng trong ô. Bảng cuộn ngang 1327/1084, ít hơn mức 1440 trước lượt này, nên đạt AC3. Có 4 lỗi nhỏ cần sửa: nhãn "Tiếng Trung (giản thể)" bị ngắt giữa ngoặc (FE-18); `min-width: 8rem` kéo cả chip ngắn "+N", "Chữ lạ" ra 128 px (FE-19); số "n yêu cầu mới" ở đầu trang đổi theo bộ lọc ngôn ngữ (FE-20); nhãn và đáy của các ô trong thanh lọc lệch nhau (FE-21). |
| (2) 4 chuỗi FE tự viết | **Duyệt nguyên văn, không đổi chữ.** Xem mục A. |
| (3) `sale.text_lang_note.*` ở hộp báo giá và giữ chỗ | **Chữ đúng CPY 15.1. Vị trí đúng chỗ UXD chốt.** Ở bước giữ chỗ, câu dùng kiểu chữ khác với bước gửi và chưa được gắn vào ô ngôn ngữ cho trình đọc màn hình (FE-22). |
| (4) Chữ FE3 FE-13/14/15 | **Đã áp đúng từng chữ và đúng trạng thái chỉ đọc C3.** Đóng cả ba thẻ. Xem mục B. |
| (5) Chữ số ít/nhiều do BE soạn ngoài báo giá | **Duyệt 3/4 chuỗi.** Riêng `guest.bill.line.room` EN "Room 1 night × {rate}" đọc như "phòng tên 1 night" và lệch với các dòng bill khác (BE-01). Xem mục C. |

## A. Bốn chuỗi FE viết – duyệt

| Khóa | VI | EN | Nhận xét |
|---|---|---|---|
| `webreq.col.locale` | Ngôn ngữ | Language | Đúng thuật ngữ ngăn chi tiết. Ngắn hơn mọi tiêu đề cột cạnh bên. |
| `webreq.filter_locale` | Lọc theo ngôn ngữ | Filter by language | Song song `webreq.filter_label` "Lọc theo trạng thái / Filter by status". |
| `webreq.locale_all` | Mọi ngôn ngữ | All languages | Dùng làm lựa chọn đầu của ô chọn. Ô đã có nhãn nên không cần "Tất cả" đứng một mình. |
| `webreq.total` | {n} yêu cầu khớp bộ lọc | Matching requests: {n} | VI trùng cách nói với `webreq.empty_filtered`. EN dạng "nhãn: số" giống `rsv.ota_guest_count`, đúng với mọi {n} (0, 1, nhiều) mà không cần dạng số nhiều. |

Đổi ghi chú nguồn trong `gen_strings.py` từ "chờ UXD duyệt" thành "UXD duyệt 01/11 (UXD-on-LP-v2-fe4)" ở lần sinh chuỗi tới. Không cần lượt riêng cho việc này.

## B. Chữ FE3 – kiểm lại (ảnh `lp-v2-fe3-desk-*`, JSON trên `origin/lp-v2`)

- **FE-13 – Đóng.**
  - `webreq.estimate_changed` vi "Khác giá web khách đã thấy: {from} → {to}" / en "Differs from the website estimate: {from} → {to}".
  - `webreq.estimate_changed_hint` vi "Giá theo lịch giá hôm nay khác số khách thấy trên web. Nói rõ lý do với khách khi gửi báo giá." / en "Today's rate differs from what the guest saw on the website. Tell the guest why when you send the quote."
  - Cả hai đúng từng chữ đề xuất. Ảnh `lp-v2-fe3-desk-quote-changed-label.png` hiện đúng ngay dưới dòng cọc.
- **FE-14 – Đóng.**
  - `rooms.public_type_help` vi/en đúng từng chữ.
  - FE đã đối chiếu hành vi BE: `PublicRatePort` bỏ các căn có `public_room_type IS NULL`, nên câu "không thuộc hạng nào trên web" là đúng.
- **FE-15 – Đóng.**
  - Manager thấy `Field` chỉ đọc: nhãn ở trên, nền Cream, trợ giúp `rooms.public_type_owner_only` ở dưới.
  - Khi "Chưa gán", câu help đứng trước câu owner_only trong cùng một caption, đúng đề xuất.
  - Nhịp dọc của ngăn sửa căn đã đều.
- **FE-16 – Đóng.** Theo số đo trong mục 9.2, `.est-line` là 15 px. Không thuộc việc được giao lượt này nhưng ghi lại để ORC biết.
- **FE-17 (Suggestion)** – vẫn Open, chưa làm. Không cần làm trước khi phát hành.

## C. Chữ số ít/nhiều do BE soạn (content guide 0.4.4)

| Khóa | Chuỗi | Kết luận |
|---|---|---|
| `gw.oci_done_card_deferred_one` en | "1 guest will show ID at reception." | **Duyệt.** "reception" là từ trang khách đang dùng (25 chỗ) và khớp `guest.oci.done_body`. Các dạng `_few/_many` trong EN không được dùng nhưng không gây hại. |
| `bill.ota_prepaid_one` en | "Room charge, 1 night – paid via {channel}" | **Duyệt.** Giữ "Room charge," như các dạng khác. VI "Tiền phòng {n} đêm – đã thanh toán qua {channel}" đúng. |
| `guest.bill.line.room_*` en | "Room 1 night × {rate}" / "Room {nights} nights × {rate}" | **Sửa – FE-BE-01** (Minor, chuỗi chưa phát hành). |
| `guest.stay.dates_*` ru | "{from} → {to} · {nights} ночь / ночи / ночей", `_other` "ночи" | **Duyệt.** Đúng cả 1/2/5/21/22 đêm. `_other` chỉ rơi vào số lẻ nên "ночи" là đúng. Bản Nga vẫn qua cổng người bản xứ (US-174 AC10). |

Kiểm thêm, không thuộc câu hỏi: RU `sale.quote_*` (взрослый/взрослых, ребёнок/ребёнка/детей, "за 1 гостя / за 2 гостей") đúng cách. VI giữ một dạng cho mọi số, đúng ngữ pháp tiếng Việt.

## Thẻ feedback

### FB-R4-UXD-FE-18
- Mức độ: Minor
- Vị trí: `WebRequestsPage.tsx` – ô `<td>{t(\`webreq.locale.${r.locale}\`)}</td>`. Ảnh `lp-v2-fe4-list-all-1366.png` (dòng T0000001, T0000002) và `lp-v2-fe4-list-filter-zh-1366.png`.
- Vấn đề: ở cột rộng khoảng 84 px, "Tiếng Trung (giản thể)" ngắt thành 3 dòng: "Tiếng / Trung (giản / thể)". Dấu ngoặc bị cắt đôi. Chữ "thể" đứng một mình ở dòng cuối.
- Vì sao quan trọng: đây là nhãn duy nhất trong cột không đọc được trong một lần lướt. Lễ tân dùng cột này để nhận ra khách tiếng Trung (AC3), nên nhãn phải đọc được ngay.
- Đề xuất sửa: không đổi chữ, vì AC3 bắt buộc đúng nhãn này.
  - Cho phép ngắt dòng **chỉ** giữa "Tiếng Trung" và "(giản thể)", mỗi phần không ngắt bên trong. Ví dụ ô dùng `white-space: nowrap` cho từng cụm, hoặc hàm hiển thị thay khoảng trắng trong ngoặc và giữa "Tiếng Trung" bằng NBSP **ở mức hiển thị**, không sửa JSON.
  - Kết quả mong đợi là 2 dòng: "Tiếng Trung / (giản thể)". Đo lại `scrollWidth` ở 1366 px, mức phải ≤ 1440.
- Trạng thái: Open

### FB-R4-UXD-FE-19
- Mức độ: Minor
- Vị trí: `product/packages/ui/src/styles/app.css` – `.webreq-table td.chips-wrap .chip { white-space: normal; min-width: 8rem; border-radius: var(--r-sm); }`
- Vấn đề:
  - (a) Quy tắc áp cho **mọi** chip trong ô "Ngày ở" và "Cần xem". Chip ngắn như "Chữ lạ" và chip đếm "+1", "+2" (`flags.length > 2`) cũng bị kéo rộng 128 px và mất dạng viên thuốc, dù không cần xuống dòng.
  - (b) Chip đã xuống dòng thì chữ căn giữa. Chữ cuối đứng lẻ, ví dụ "Ở dài ngày – / báo giá dài / hạn", và icon nằm giữa khối 3 dòng (ảnh `lp-v2-fe4-list-all-1366.png`, dòng 7K3QX9MD).
- Vì sao quan trọng: chip là thành phần DS. Chip đếm "+2" rộng 128 px trông như một nhãn trống. Chip nhiều dòng căn giữa khó đọc lướt hơn chip căn trái.
- Đề xuất sửa: giữ cách xuống dòng (UXD đã chấp nhận), nhưng:
  - Chỉ áp `min-width` và bo `--r-sm` cho chip **có chữ dài**: thêm class `chip--wrap` cho `webreq.long_stay` và các chip `webreq.flag.*`. Chip đếm "+N" giữ nguyên dạng.
  - Chip xuống dòng dùng `text-align: start; text-wrap: balance;` và icon căn với dòng đầu (`align-items: flex-start`).
  - Mong đợi: "Ở dài ngày – / báo giá dài hạn" còn 2 dòng.
- Trạng thái: Open

### FB-R4-UXD-FE-20
- Mức độ: Minor
- Vị trí: `WebRequestsPage.tsx` dòng 121 và 185 – `newCount = all.filter(r => r.status === 'new')`, hiện ở `Topbar sub`. Ảnh `lp-v2-fe4-list-filter-zh-1366.png`.
- Vấn đề:
  - Khi lọc "Tiếng Trung", đầu trang ghi "1 yêu cầu mới", trong khi huy hiệu menu cùng màn hình ghi **4**. Ngay dưới bảng lọc lại có "3 yêu cầu khớp bộ lọc".
  - Ba con số trên một màn hình, trong đó hai số "mới" mâu thuẫn nhau.
  - Trước lượt này, số ở đầu trang đã phụ thuộc bộ lọc trạng thái và trang đã tải. Bộ lọc ngôn ngữ làm lỗi này dễ thấy hơn.
- Vì sao quan trọng: owner dùng S35 để đếm khách theo ngôn ngữ (AC5). Một số "mới" đổi theo bộ lọc dễ bị đọc nhầm là số đếm.
- Đề xuất sửa: số ở đầu trang không phụ thuộc bộ lọc.
  - Lấy cùng nguồn với huy hiệu menu.
  - Nếu chưa có nguồn đó, **ẩn** `sub` khi `filtered === true`, vì số đếm theo bộ lọc đã có ở dòng `webreq.total`.
  - Không cần chữ mới.
- Trạng thái: Open

### FB-R4-UXD-FE-21
- Mức độ: Minor
- Vị trí: `WebRequestsPage.tsx` – `.webreq-filters`: nhóm trạng thái (`span.label-h`), `Field` "Lọc theo ngôn ngữ", form tìm mã. Ảnh `lp-v2-fe4-list-all-1366.png`.
- Vấn đề: trên cùng một hàng có hai kiểu nhãn và ba đường đáy khác nhau.
  - Kiểu nhãn: "LỌC THEO TRẠNG THÁI" viết hoa, giãn chữ (eyebrow), còn "Lọc theo ngôn ngữ" và "Tìm theo mã yêu cầu" là nhãn Field thường.
  - Đáy: nút trạng thái ở khoảng y 224, ô chọn ngôn ngữ và ô tìm ở khoảng 210, nút "Tìm" ở khoảng 205.
  - Lệch giữa trạng thái và ô tìm đã có từ R3. Ô ngôn ngữ mới làm hàng có ba khối nên lệch rõ hơn.
- Vì sao quan trọng: thanh lọc là nơi owner thao tác nhiều nhất khi đếm (AC5). Theo DS C3, nhãn đặt trên, viết thường kiểu câu. Các control trên cùng hàng phải chung một đường đáy.
- Đề xuất sửa:
  - Nhãn nhóm trạng thái dùng cùng class nhãn của `Field` (viết thường kiểu câu), giữ `role="group"` và `aria-labelledby`.
  - Ba khối đặt `align-items: flex-end`, và bỏ phần chừa chỗ cho help/error dưới `Field` khi không có lỗi (hoặc chừa chỗ như nhau cho cả ba), để nút trạng thái, ô chọn và ô tìm cùng đáy.
  - Ảnh 1366 px chụp lại.
- Trạng thái: Open

### FB-R4-UXD-FE-22
- Mức độ: Minor
- Vị trí: `QuoteDialog.tsx` – `LangNote`: bước gửi là `<span className="help">`, bước giữ chỗ là `<p className="li-s mt-8">`. Ảnh `lp-v2-fe4-quote-send-ko.png`, `lp-v2-fe4-hold-ko.png`, `lp-v2-fe4-hold-created-ko.png`.
- Vấn đề:
  - (a) Cùng một câu nhưng hai kiểu chữ: 13 px `help` ở bước gửi, khoảng 14 px `li-s` ở bước giữ chỗ. CPY 15.1 ghi "cùng kiểu chữ `help`".
  - (b) Ở bước gửi, câu đứng ngay dưới `Seg` "Ngôn ngữ gửi khách" nhưng không gắn với nó bằng `aria-describedby`. Người dùng trình đọc màn hình vào nhóm lựa chọn sẽ không nghe lời dặn "gửi tin bằng tiếng Anh".
- Vì sao quan trọng: đây là lời dặn duy nhất để lễ tân không gửi tin tiếng Việt cho khách Hàn/Trung (US-175 AC4 ý 2). Lời dặn phải giống nhau ở mọi chỗ và đến được với mọi người dùng.
- Đề xuất sửa:
  - Cả hai chỗ dùng `help` (giữ `mt-8` ở bước giữ chỗ để tách khỏi thẻ cọc).
  - Cho câu ở bước gửi một `id`, rồi thêm id đó vào `aria-describedby` của `Seg` (`q-lang`).
  - Không đổi chữ.
- Trạng thái: Open

### FB-R4-UXD-FE-23
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/mocks/reservations.ts` dòng 1787 – văn bản báo giá giả của MSW. Ảnh `lp-v2-fe4-quote-send-ko.png`, `lp-v2-fe4-quote-reopened-ko.png`.
- Vấn đề:
  - Mock tự dựng câu EN cố định: `(${q.nights} nights), ${q.input.adults} adults.`, không có trẻ em, không có câu phụ thu.
  - Vì vậy ảnh ghi "(2 nights), 2 adults." với tổng 2.022.000 đ, mà tổng này đã gồm phụ thu 1 người. Yêu cầu là 2 người lớn và 1 trẻ 6–11 tuổi.
  - Server thật (`quotes.service.ts`, `ee375e6d`) đã dựng đủ trẻ em và câu phụ thu bằng khóa đếm. Chỉ mock là lệch.
- Vì sao quan trọng: ảnh FE là bằng chứng QA/PO/INV đọc. Câu báo giá trong ảnh khác câu khách thật nhận, nên người xem có thể kết luận sai về BUG-R4-009 (thiếu trẻ em, "1 nights" khi 1 đêm).
- Đề xuất sửa:
  - Mock dựng câu bằng cùng khóa `sale.quote_text`, `sale.quote_nights_*`, `sale.quote_adults_*`, `sale.quote_kids_*`, `sale.quote_text_extra_guest_*` và `pluralForm()` của `@ottimo/i18n`.
  - Nếu không làm vậy, ghi rõ dưới ảnh "văn bản báo giá từ mock, không phải server".
  - Chụp lại 2 ảnh trên.
- Trạng thái: Open

### FB-R4-UXD-BE-01
- Mức độ: Minor
- Vị trí: `strings-en.json` / `gen_strings.py` – `guest.bill.line.room_one/_few/_many/_other` (content guide 0.4.4)
- Vấn đề: "Room 1 night × {rate}" đọc như tên phòng "Room 1" hoặc "Room 1 night". Chuỗi này lệch với các dòng bill cùng loại: `bill.ota_prepaid` "Room charge, {n} night – …", `bill.line.room_night` "Room, night of {date}", và bản VI của chính khóa này "Tiền phòng {nights} đêm × {rate}". Đây là lỗi có từ trước, BE chỉ tách dạng. Chuỗi chưa phát hành (copy only, theo commit).
- Vì sao quan trọng: dòng bill khách đọc phải rõ đó là tiền phòng. Thuật ngữ trong bill cần một cách gọi duy nhất ("Room charge" = "Tiền phòng").
- Đề xuất sửa: EN tất cả các dạng: `_one` "Room charge, {nights} night × {rate}", `_few/_many/_other` "Room charge, {nights} nights × {rate}". VI và RU không đổi. Sửa qua `gen_strings.py`, rồi sinh lại.
- Trạng thái: Open

### FB-R4-UXD-FE-24
- Mức độ: Suggestion
- Vị trí: S35 ở 1366 px – thứ tự cột. Ảnh `lp-v2-fe4-list-filter-zh-1366.png`: cột "Người xử lý" và "Trạng thái" nằm ngoài khung, "TRẠ…" bị cắt.
- Vấn đề: bảng vẫn cuộn ngang 243 px (có từ R3). Cột bị đẩy ra ngoài lại là "Trạng thái", trong khi bộ lọc mặc định gộp hai trạng thái (Mới + Đang xử lý) và AC5 cho lọc thêm "Đã thành đơn" / "Đã đóng". Muốn biết dòng nào thuộc trạng thái nào thì phải cuộn. Trên macOS thanh cuộn ẩn, nên không có dấu hiệu là còn cột.
- Vì sao quan trọng: khi lọc gộp, trạng thái là thông tin cần thấy ngay sau mã yêu cầu.
- Đề xuất sửa (v1.0.1, không chặn LP-v2): đưa cột "Trạng thái" lên ngay sau "Mã yêu cầu". Có thể gộp "Nguồn" thành dòng phụ, chữ mờ, dưới "Gửi lúc" để bớt khoảng 85 px. Không đổi chữ. Nếu FE làm ngay trong lượt này thì UXD không phản đối.
- Trạng thái: Open

### FB-R4-UXD-FE-25
- Mức độ: Suggestion
- Vị trí: `WebRequestsPage.tsx` – `total !== null` cùng với `StateView` `webreq.empty_filtered`
- Vấn đề: khi bộ lọc ra 0 dòng, màn hình sẽ hiện hai câu cùng ý liền nhau: "0 yêu cầu khớp bộ lọc" và "Không có yêu cầu khớp bộ lọc.". UXD suy ra điều này từ mã, chưa có ảnh.
- Vì sao quan trọng: lặp chữ trong trạng thái rỗng làm màn hình nặng hơn mà không thêm thông tin.
- Đề xuất sửa: ẩn dòng `webreq.total` khi `total === 0`, vì trạng thái rỗng đã nói "không có". AC5 vẫn đạt vì số 0 được nói bằng câu rỗng.
- Trạng thái: Open

## Ghi chú cho vai khác (không phải thẻ UXD)

- **Hồ sơ khách mới** (`lp-v2-fe4-guest-quick-create-ko.png`):
  - Ô "Số điện thoại / Zalo" cao khoảng 48 px và thấp hơn ô Email khoảng 10 px, vì lưới kéo ô theo chiều cao của trợ giúp bên Email (`crm.contact_rule`). Lỗi có từ trước, không do lượt này. FE xếp v1.0.1 cùng việc dọn `GuestFormDialog`.
  - Lựa chọn quốc tịch trống hiện "–". Ký tự này chấp nhận được trong Desk, nhưng trình đọc màn hình đọc thành "gạch". Khi dọn form thì nên dùng chữ "Chưa chọn", giống cách `rooms.public_type_none` ghi "Chưa gán" (cần khóa mới, UXD viết khi FE xếp việc).
- **DOM/PO:** giả định FE "mở lại báo giá: ngôn ngữ của yêu cầu liên kết đứng trước ngôn ngữ hồ sơ" hợp với lời dặn trong câu ghi chú. Về UX, UXD đồng ý.

## Điểm làm tốt (giữ)

- Dòng tổng số lấy `total` của server và **ẩn khi bật "Chỉ yêu cầu tôi đang xử lý"**. Không hiện một con số có thể sai là đúng tinh thần "chữ không nói điều sai".
- Câu ghi chú ngôn ngữ đặt đúng ba chỗ (dưới ô ngôn ngữ, dưới thẻ cọc trước và sau khi tạo giữ chỗ), chỉ hiện với ko/zh/ru, và giữ nguyên khi nhân viên đổi ô. Đúng ý CPY về lời dặn.
- Đưa chuỗi qua `gen_strings.py` và phát hiện, đồng bộ 3 bộ chữ cũ của BE về đúng bản đã phát hành. Nhờ vậy nguồn chữ của đội lại là một.
