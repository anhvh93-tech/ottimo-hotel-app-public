# UXD review – FE PR #98 (V5-50), #102 (V5-15), #107 (V5-46) và lệch thương hiệu khung Alert info trên trang khách

- Người review: UXD | Round 5 – bước **Review** | 06/11/2026
- Đối tượng (chỉ đọc, không đẩy lên nhánh PR):
  - #98 `r5-fe-v5-50` @ `1efe60c7`: hộp Đổi phòng chỉ liệt kê căn VI/VC.
  - #102 `r5-fe-v5-15-clean` @ `71db3338`: nút Cần dọn ở khối Trạng thái buồng (S10).
  - #107 `r5-fe-v5-46` @ `e2ffd228`: trang khách báo khi máy chủ chặn số giấy tờ.
- Cách kiểm:
  - đọc `gh pr diff`, `gh pr view` và báo cáo FE trong từng nhánh (`rounds/round-05/outputs/FE/*.md`);
  - xem 8 ảnh của FE (mock, dữ liệu giả);
  - so chữ từng ký tự bằng script giữa `strings-vi/en.json` của nhánh và nguồn đã duyệt (thẻ FB-R3-UXD-FE-A-17, `copy-v1.0.5.md` 4.12, `stay.change_effect_old` trên `main`);
  - đọc mã máy chủ trên `main` @ `d1d2fb8e` để kiểm chữ có đúng việc máy chủ làm không: `housekeeping/internal/rules.ts` (`allowedEvents`, `roomTarget`), `housekeeping.service.ts` (R8a), `checkin.service.ts` (VI/VC đạt `room_ready`), BR-806.
- Đối chiếu: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` bản 1.6, `00-brief/context/brand/brand-guidelines.md`, `product/design/design-system.md` v0.4.1 (mục 2.3, 2.4, 4, C3, C19), `content-guide.md`.
- Thương hiệu: chữ Desk là chữ nội bộ, VI và EN. Chữ trang khách đã do CPY duyệt, PR không đổi. Mục 4 xét màu khung Alert info trên trang khách theo bảng 80/15/5.

## 0. Kết luận

| PR | Kết luận | Điều kiện, thẻ |
|---|---|---|
| **#98** V5-50 | **DUYỆT** | Hai câu khớp nguyên văn thẻ FB-R3-UXD-FE-A-17. Thẻ PR98-01 (Minor, câu mới khi mọi căn trống còn bẩn) nên làm trong PR này, không chặn gộp |
| **#102** V5-15 | **DUYỆT CÓ ĐIỀU KIỆN** | Điều kiện: **PR102-01 (Major)** đổi chữ nút thành **"Báo cần dọn" / "Mark for cleaning"** trong PR này trước khi gộp. Chỉ sửa 1 dòng `gen_strings.py` rồi sinh lại. Không cần hộp xác nhận. Vị trí nút đạt. Thẻ PR102-02 (Minor): đổi câu `checkin.room_status_stuck` ngay ở v1.0.5, nên làm trong PR này. PR102-03, -04 dời được |
| **#107** V5-46 | **DUYỆT** | Chấp nhận câu ở khung báo lỗi chung của tab Yêu cầu cho v1.0.5. Thẻ PR107-01 (Minor): v1.0.6 đưa câu số thẻ và số giấy tờ xuống dưới ô, hoặc làm luôn trong PR này nếu FE-B còn thời gian |
| Lệch thương hiệu | **Có lệch** | **GW-01 (Major)**: khung Alert info trên trang khách đổi sang nền Cream #EDE6D8, viền Sage #8A9079, chữ và icon Ink #2B2B28. Sửa ở **PR riêng nhỏ của FE-B**, không trong #107. Không chặn #107 |

Tổng: 7 thẻ, gồm 2 Major (PR102-01, GW-01), 4 Minor (PR98-01, PR102-02, PR102-03, PR107-01), 1 Suggestion (PR102-04). Không có Blocker. **Không có ESC**: nhãn nút, câu chữ, màu trong bảng thương hiệu đều thuộc quyền UXD.

Chữ mới, chữ đổi nằm ở `copy-v1.0.5.md` **bản 1.7**, mục 9.7. `content-guide.md` dòng 731 đã sửa theo #98 trong lượt này.

---

## 1. PR #98 – hộp Đổi phòng chỉ liệt kê căn VI/VC

### 1.1 Chữ

| Khóa | Kiểu | Kết quả |
|---|---|---|
| `room_change.ready_only` | Sửa | **Khớp nguyên văn** câu "khi danh sách đã lọc" (v1.0.1) của thẻ FB-R3-UXD-FE-A-17, cả VI và EN, ở cả 4 tệp sinh. Câu nay đúng sự thật: danh sách chỉ giữ VI/VC (`READY_FOR_MOVE`), và chỉ căn `available` (căn khóa OOO không có) |
| `room_change.ready_unfiltered` | Mới | **Khớp nguyên văn** câu v1.0.0 của thẻ 17. Chỉ hiện khi `listRoomStatuses` lỗi. Câu nói thật là danh sách có thể còn căn chưa dọn, và máy chủ vẫn chặn 409 `ROOM_NOT_READY`. Không cần câu riêng cho ca lỗi: câu này đã đủ, và UXD đã duyệt ở R3 |

Nhãn trạng thái trong câu ("VI · Đã kiểm, sẵn sàng", "VC · Đã dọn, chờ kiểm") khớp chip trên Desk (ảnh #102 cho thấy cùng chữ). Ghi chú khóa trong `gen_strings.py` đúng.

### 1.2 Hành vi và ảnh
- Danh sách chỉ hiện khi có đủ cả hai kết quả, nên không nháy danh sách chưa lọc. Đạt HR-20 (trạng thái hệ thống trung thực).
- Ảnh 1366 và 390: khung cảnh báo "Không còn căn sẵn sàng…" và câu `ready_only` cùng hiện, không tràn. Tiêu đề xuống dòng ở 390 là chuyện có từ trước, không thuộc PR này.
- G1 (căn không có trong `listRoomStatuses` thì coi như chưa sẵn sàng) và G2 (không tự tải lại khi hộp đang mở) đều hợp lý.
- Phát sinh từ chính bộ lọc: khi mọi căn trống đều còn bẩn, lễ tân không còn thấy căn nào trống. Câu `no_rooms` chỉ bảo "Hỏi quản lý, hoặc giữ khách ở căn hiện tại", trong khi lối ra nhanh nhất là nhờ buồng phòng dọn trước một căn. Xem thẻ PR98-01.

### 1.3 `content-guide.md` dòng 731
FE nói đúng: dòng này còn câu R2 ("Sẵn sàng" hoặc "Trống, sạch"). UXD đã sửa trong lượt này: dòng 731 nay là câu `ready_only` của #98, thêm một dòng `room_change.ready_unfiltered` ngay dưới. Phần còn lại của mục 8 đồng bộ một lượt sau khi Gói 2 lên (v0.4.7, `copy-v1.0.5.md` mục 6, dòng UXD).

---

## 2. PR #102 – nút Cần dọn trên Desk

### 2.1 Chữ

| Khóa | Kết quả |
|---|---|
| `hk.action.needs_cleaning` "Cần dọn" / "Needs cleaning" | **Đổi chữ**: VI **"Báo cần dọn"**, EN **"Mark for cleaning"** (thẻ PR102-01). Giữ tên khóa |
| `hk.desk.needs_cleaning_toast` | **Duyệt nguyên văn.** Khớp `stay.change_effect_old` trên `main` (script). Câu đúng với máy chủ: R8 chuyển OC → OD; R8a tạo việc dọn nếu căn chưa có việc dọn ở lại. Có sẵn việc thì "có việc dọn" vẫn đúng |
| `error.INVALID_TRANSITION_generic_reloaded` | **Duyệt nguyên văn** (`copy-v1.0.5.md` 4.12, script). Câu đúng chỗ: sau 409, `onChanged` tải lại cả danh sách căn và danh sách việc, nên "Danh sách đã tải lại" là thật. Khóa này cũng có trong Gói 2: PR nào gộp sau thì bỏ dòng trùng, giữ một dòng |

### 2.2 Vị trí nút – **đạt**
- Nút nằm ở cuối dòng căn, khối **Buồng phòng → Trạng thái buồng**. Chỗ này cùng cách bố trí nút ở dòng việc bên trái ("Làm xong", "Hủy việc"). Kiểu nút viền thường, nhẹ hơn nút chính, hợp với lệnh phụ.
- Chỉ hiện khi máy chủ trả `needs_cleaning` trong `allowedEvents`. Desk không tự suy quyền, đúng EP07 2.1.
- G2 (không thêm nút ở Sơ đồ phòng hay drawer đơn): đồng ý cho v1.0.5. Mục Cần chú ý `attn.room_status_mismatch` đã dẫn tới `/housekeeping`, nên lễ tân vào đúng trang có nút.
- Ảnh 390: nút nằm cạnh chip, không tràn. Nút cao 32 px, chưa đạt 44 px ở màn điện thoại (thẻ PR102-03).

### 2.3 Có cần hộp xác nhận không – **không cần**, đồng ý G1 của FE
- DS 6.1 chỉ bắt xác nhận với lệnh phá hủy hoặc đụng tiền. Lệnh này không đụng tiền, không gửi gì cho khách, không xóa gì.
- Kết quả hiện ngay: chip đổi sang "OD · Có khách, cần dọn", có toast, có việc mới ở danh sách bên trái. Bấm nhầm thì thấy ngay.
- Gỡ được: hủy việc dọn ở danh sách việc (đã có lý do bắt buộc, SM-14). Căn ở "cần dọn" tới lần dọn kế tiếp. Cái giá tệ nhất là một lần dọn ở lại thừa.
- Máy chủ kiểm `expectedFrom`, nên không có chuyện bấm hai lần ra hai lệnh.
- Thêm hộp xác nhận sẽ làm chậm ca dùng thật: khách đang ở gọi xin dọn, hoặc DOM 7.1 dặn "buồng phòng vẫn bấm Cần dọn" khi chờ quản lý.

### 2.4 `checkin.room_status_stuck` – **đổi ngay ở v1.0.5**, cùng tag với nút
Câu này có ghi chú "v1.0.5 có nút Cần dọn thì UXD đổi câu". UXD đã hứa đổi ở UXD-on-v104-pr77 lượt 4, và DOM lượt 7 mục 3 cũng ghi vào backlog v1.0.5.

Kiểm máy chủ trên `main`:
- Căn OC không còn lượt Đang ở: bấm Báo cần dọn thì thành OD (R8) và có việc dọn (R8a).
- Bắt đầu dọn chuyển căn sang CL. Dọn xong khi không còn ai Đang ở thì căn thành VC (R3, `roomTarget` với `inHouse = false`).
- `room_ready` đạt với VI/VC (`checkin.service.ts` 386).

Vậy lễ tân tự đưa được căn kẹt về quy trình dọn, không phải chờ đội kỹ thuật sửa tay như v1.0.4. Câu cũ vẫn đúng sự thật nhưng chỉ lối chậm: lễ tân báo quản lý, rồi quản lý nhờ đội kỹ thuật.

Câu mới nằm ở `copy-v1.0.5.md` 9.7, gồm hai khóa vì OD không có nút:
- `checkin.room_status_stuck` (OC): kiểm căn đã trống, bấm **Báo cần dọn** ở Buồng phòng → Trạng thái buồng; khách không chờ được thì đổi căn.
- `checkin.room_status_stuck_od` (OD, mới): kiểm căn đã trống và nhờ buồng phòng dọn.

Hai câu bỏ vế "báo quản lý để sửa trạng thái căn", vì lễ tân đã tự làm được. Quản lý vẫn thấy căn lệch ở Cần chú ý qua BR-806 (OC/OD mà không có đơn Đang ở thì tự cảnh báo).

`checkin.room_occupied` (ca máy chủ không trả `cause`) giữ nguyên. Máy chủ v1.0.5 đã trả `cause`, nên câu này chỉ còn cho ca lạ, và vẫn đúng.

Phải đổi **sau hoặc cùng lúc** nhãn nút (PR102-01), vì câu nhắc tên nút.

### 2.5 Hành vi khác
- Mất mạng thì nút tắt. Đầu trang (`AppShell`) đã có băng `shell.offline_readonly` ("chỉ xem, chưa lưu thay đổi được"), nên không cần câu riêng.
- Nút có `aria-describedby` trỏ tới số căn. Trình đọc màn hình sẽ đọc "Báo cần dọn, 301", tốt.
- Khung báo 409 nằm trong dòng căn và ở lại tới khi rời trang. Nếu sau đó căn quay lại OC (dọn xong, R2), nút hiện lại cạnh một câu đã cũ (thẻ PR102-04).

---

## 3. PR #107 – trang khách báo số giấy tờ

### 3.1 Chữ
- Dùng nguyên khóa CPY đã duyệt `error.ID_NUMBER_DETECTED` (EN, VI, RU), không viết chữ mới. Câu không nhắc lại chữ khách gõ. Giọng lịch sự, điềm tĩnh, không emoji. SEC đã duyệt (`SEC-on-fe-prs-98-102-107.md`).
- Sửa kèm: tab Yêu cầu nay hiện đúng câu số thẻ `gw.req.card_detected` khi máy chủ trả mã cấp trên `CARD_NUMBER_DETECTED`. Trước đây khách thấy câu "lỗi máy chủ". Đây là sửa chữ đúng chỗ, UXD đồng ý.

### 3.2 Bước Giờ đến (check-in online)
Đạt. Câu nằm ngay dưới ô "Ghi chú cho lễ tân" / "Note for reception", viền ô đỏ, có `role="alert"`, `aria-invalid`, `aria-describedby`. Chữ khách gõ còn nguyên để sửa, khách ở lại bước. Cách làm giống câu số thẻ (DS C3). Ảnh VI, EN ở 390 không tràn.

### 3.3 Tab Yêu cầu – câu ở khung báo lỗi chung, không dưới ô: **chấp nhận cho v1.0.5**
Lý do chấp nhận:
- Ở 390, khung lỗi và ô nhập cùng một màn, khách không phải cuộn.
- Khung có `role="alert"`, nên trình đọc màn hình đọc câu ngay.
- Chữ khách đã gõ còn nguyên.
- Câu số thẻ đang hiện cùng chỗ, nên hai câu cùng loại nhất quán với nhau.

Vẫn nên đổi (thẻ PR107-01, Minor):
- Trên cùng trang, câu "mô tả ngắn" (`gw.req.note_required`) do máy khách kiểm đã nằm dưới ô. Bước Giờ đến cũng đặt câu dưới ô.
- Trong ảnh, khung "Lễ tân trả lời từ 07:00" nằm giữa ô và câu lỗi, nên câu lỗi cách xa ô.
- Ô không có `aria-invalid` khi máy chủ chặn.

Sửa một lần cho cả số thẻ và số giấy tờ, như FE-B đề nghị.

Ghi chú cho CPY, không thành thẻ:
- Câu `error.ID_NUMBER_DETECTED` kết bằng "send again" / "gửi lại". Ở bước Giờ đến, nút lại là **Continue** / **Tiếp tục**. Khách vẫn hiểu, nên không sửa ở v1.0.5.
- Ở v1.0.6, CPY cân nhắc "try again" / "thử lại", và cân nhắc cho `error.CARD_NUMBER_DETECTED` ("Remove it – OTTIMO doesn't store card numbers.") cùng giọng "Please…" với câu số giấy tờ. Hai câu nằm cùng một ô.

---

## 4. Lệch thương hiệu – khung Alert tone info trên trang khách

### 4.1 Hiện trạng
- `.alert.info` (`hifi.css` 368) dùng nền `--info-bg` #E0E8EF, viền và icon `--info` #3E5E78. Cả hai là xanh lam, không có trong bảng 80/15/5.
- Trên guest-web chỉ có **một** chỗ dùng: `RequestsPage.tsx` 486, khung "Lễ tân trả lời từ 07:00" / ngoài giờ, kèm nút "Gọi người trực". Trang khách không có chip `info` nào.
- `StateView icon="info"` và hàng "Nội quy" chỉ dùng hình icon, không dùng màu `--info`.

### 4.2 Có lệch không – **có**
DS 2.4 (v0.4.1) cho phép ok/warn/bad/info ở alert trang khách như "ngoại lệ chức năng". Với ba màu ok, warn, bad, ngoại lệ có lý do: khách phải nhận ra ngay lỗi, cảnh báo, thành công. DS cũng đã đề xuất guideline v1.1 thêm mục "màu chức năng" (DS 2.5).

Với `info` thì không có lý do đó:
- Một khung thông tin không cần một sắc riêng để an toàn.
- Trên trang khách nền Ivory/Cream, xanh lam là sắc lạnh duy nhất. Nó đi ngược tính cách "Calm · Warm" của guideline.
- Guideline thắng (CLAUDE.md), nên bỏ xanh lam khỏi trang khách.

Giữ nguyên ở v1.0.5:
- ok, warn, bad trên trang khách (lỗi ô nhập, lỗi gửi, xác nhận);
- `info` trên Desk, theo DS 2.4: màn nhân viên, chờ guideline v1.1. UXD xét lại ở DS v0.5.

### 4.3 Màu thay (đều trong bảng)

| Phần | Màu | Đo tương phản |
|---|---|---|
| Nền khung | **Cream #EDE6D8** (`--cream`) | – |
| Viền 1px | **Sage #8A9079** (`--sage`) | 3,15:1 trên nền thẻ `--surface` #FBF9F4. Đạt 3:1 cho đường viền nhận diện khung |
| Chữ tiêu đề, chữ thân, icon | **Ink #2B2B28** (`--ink`) | 11,43:1 trên Cream |
| Nút "Gọi người trực" trong khung (giữ `.btn`) | viền `--line-strong` #857E71; focus Earth Brown #7A5C44 | 3,24:1 và 4,91:1 trên Cream |
| Chữ phụ (nếu có) | Stone Grey #6B6760 | 4,53:1 trên Cream, chỉ dùng chữ ≥ 12 px (DS 2.1) |

Vì sao viền Sage, không phải Light Oak hay Earth Brown:
- Khung `warn` đã là nâu vàng (#8A5214 trên #F5E8D3). Viền gỗ dễ làm khách đọc khung thông tin thành cảnh báo.
- Sage (nhóm Botanical 5%) là sắc riêng trong bảng, dịu, và ở đây chỉ làm viền. Guideline chỉ tránh dùng Sage làm **chữ** trên nền sáng.

### 4.4 Sửa ở đâu – **PR riêng nhỏ của FE-B**, không trong #107
- #107 không tạo ra khung này. SEC cho #107 gộp ngay; không nên kéo thêm việc CSS vào đó.
- Chỉ sửa CSS trong phạm vi guest-web (`apps/guest-web/src/styles.css`):

  ```css
  .guest-app .alert.info { background: var(--cream); border-color: var(--sage); color: var(--ink); }
  ```

  - Không sửa `@ottimo/ui`, không đổi token `--info`, vì Desk vẫn dùng.
  - Trang khách chỉ có chế độ sáng (DS 11.5), nên không cần bản tối.
- Lên v1.0.5 được, không phụ thuộc máy chủ. Chi tiết ở thẻ GW-01.
- UXD ghi lại vào DS 2.4 (trang khách không dùng `info` xanh lam) khi PR này lên.

---

## 5. Thẻ

### FB-R5-UXD-FE-PR98-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/stay/StayDialogs.tsx` – `ChangeRoomForm`, nhánh `listed && options.length === 0`; `gen_strings.py`
- Vấn đề:
  - Sau bộ lọc VI/VC, khi mọi căn trống trong khoảng đổi đều còn VD/CL, hộp chỉ hiện `room_change.no_rooms`: "Không còn căn sẵn sàng… Hỏi quản lý, hoặc giữ khách ở căn hiện tại."
  - Trước PR, lễ tân còn thấy các căn đó trong danh sách. Nay thông tin "có căn trống, chỉ chưa dọn" mất. Ảnh 1366 và 390 của FE chụp đúng ca này.
- Vì sao quan trọng:
  - Ca đổi phòng vì sự cố thường gấp: khách đang đứng chờ, ví dụ máy lạnh hỏng.
  - Buổi sáng sau giờ trả phòng, căn trống thường còn VD. Lối ra nhanh nhất là nhờ buồng phòng dọn trước một căn, nhưng câu hiện tại không nói tới.
- Đề xuất sửa:
  - Thêm khóa `room_change.no_rooms_not_ready` (`copy-v1.0.5.md` 9.7, nguyên văn ở đó).
  - Câu hiện thay `no_rooms` khi danh sách đã lọc rỗng **và** có căn trống (`available`, khác căn đang ở) đang `VD` hoặc `CL`.
  - `{rooms}` là các số căn đó, tăng dần, nối bằng ", ". `{from}` và `{to}` như `no_rooms`.
  - Không có căn VD/CL nào thì giữ `no_rooms`. Danh sách chưa lọc (`ready_unfiltered`) thì không dùng câu mới.
  - Thêm 1 ca vitest: 2 căn trống VD + CL, không có VI/VC → câu có "202, 203".
  - Nên làm trong #98. Không kịp thì v1.0.6, không chặn gộp.
- Trạng thái: Open

### FB-R5-UXD-FE-PR102-01
- Mức độ: Major (điều kiện gộp #102)
- Vị trí: `gen_strings.py` – `hk.action.needs_cleaning` (+ 4 tệp sinh); ghi chú nhóm "v1.0.5 V5-15 … Chờ UXD duyệt"
- Vấn đề:
  - Nhãn nút "Cần dọn" / "Needs cleaning" là chữ trạng thái, không phải động từ. Content-guide C1 yêu cầu nút là động từ, như "Bắt đầu dọn", "Dọn xong", "Làm xong".
  - Trong cùng khối Trạng thái buồng đã có bộ lọc **"Cần dọn (5)"** (ảnh 1366, 390). App nhân viên có trạng thái **"Cần dọn (khách đã đi)"** / "Needs cleaning (guest left)" (`hk.status.VD`).
  - Hệ quả: căn 301 có nút "Cần dọn" nhưng không nằm trong bộ lọc "Cần dọn". Buồng phòng có thể đọc nút như nhãn báo căn đã cần dọn, không phải lệnh để báo.
- Vì sao quan trọng:
  - Đây là tính năng mới cho hai app (Desk #102, app nhân viên #97 dùng chung khóa). Sổ tay và release notes v1.0.5 sẽ dạy theo nhãn này.
  - Đổi ngay thì rẻ: 1 dòng chữ, không đổi tên khóa. Đổi sau thì phải dạy lại.
- Đề xuất sửa:
  - VI **"Báo cần dọn"**, EN **"Mark for cleaning"**. Giữ tên khóa `hk.action.needs_cleaning`.
  - Sửa ghi chú khóa và tên nhóm từ "Chờ UXD duyệt" thành "UXD duyệt 06/11 (UXD-on-fe-prs-98-102-107; copy-v1.0.5 9.7)".
  - Sinh lại tệp; test lấy chữ bằng `tv()` nên không phải sửa.
  - Ảnh 1366 "trước" chụp lại sau khi đổi.
  - MOB #97 thêm cùng dòng này. PR nào gộp sau thì lấy dòng trên `main`, bỏ dòng của mình.
  - "Thao tác trên máy" của app nhân viên sẽ hiện "Báo cần dọn · …", vẫn đọc đúng.
- Trạng thái: Open

### FB-R5-UXD-FE-PR102-02
- Mức độ: Minor
- Vị trí: `gen_strings.py` – `checkin.room_status_stuck` (+ khóa mới `checkin.room_status_stuck_od`); `product/apps/admin-web/src/pages/stay/CheckInPage.tsx` `roomBlockedMessage` (dòng 83); test `bug-r4-039-fea.test.tsx`
- Vấn đề:
  - Câu hiện tại bảo lễ tân "đổi căn và báo quản lý để sửa trạng thái căn". Đó là lối của v1.0.4, khi chưa có nút nào đưa căn khỏi OC.
  - Với #102, lễ tân tự đưa căn kẹt về quy trình dọn được (mục 2.4). Ghi chú khóa và UXD-on-v104-pr77 lượt 4 đã hẹn đổi câu ở v1.0.5.
- Vì sao quan trọng: Câu cũ vẫn đúng sự thật nhưng chỉ lối chậm. Khách đứng chờ trong lúc quản lý và đội kỹ thuật sửa một việc lễ tân làm được trong một lần bấm.
- Đề xuất sửa:
  - Áp hai dòng ở `copy-v1.0.5.md` 9.7.
  - Trong `roomBlockedMessage`, ca `cause = room_status` và `detail = OD` trả `checkin.room_status_stuck_od`; OC giữ `checkin.room_status_stuck`.
  - Sửa ghi chú khóa: bỏ "v1.0.5 có nút Cần dọn thì UXD đổi câu", ghi "v1.0.5 V5-15: theo nút Báo cần dọn (UXD-on-fe-prs-98-102-107)".
  - Thêm 1 ca test cho OD.
  - Nên làm trong #102, cùng tag với nút; làm sau hoặc cùng lúc PR102-01, vì câu nhắc tên nút. Không kịp thì v1.0.6, câu cũ vẫn đúng.
- Trạng thái: Open

### FB-R5-UXD-FE-PR102-03
- Mức độ: Minor
- Vị trí: `HousekeepingPage.tsx` `RoomRow` – `<Button size="sm">`; ảnh `v5-15-needs-cleaning-390-before.png`
- Vấn đề: `.btn.sm` cao 32 px. Desk trên điện thoại (≤ 520 px) không có lớp `.touch`, nên nút vẫn 32 px. DS mục 4 yêu cầu điện thoại ≥ 44×44 px.
- Vì sao quan trọng: Lễ tân hay quản lý mở Desk trên điện thoại ở hành lang để báo dọn. Nút nhỏ cạnh chip dễ bấm trượt.
- Đề xuất sửa:
  - Ở `@media (max-width: 520px)`, nút trong dòng căn có `min-height: 44px`, ví dụ lớp `.room-acts .btn` trong `app.css`, như cách `.userchip` đã làm.
  - Dời v1.0.6 được, gộp vào một lượt rà vùng chạm Desk trên điện thoại.
- Trạng thái: Open

### FB-R5-UXD-FE-PR102-04
- Mức độ: Suggestion
- Vị trí: `HousekeepingPage.tsx` `RoomRow` – `act.code === 'INVALID_TRANSITION'`
- Vấn đề: Khung `error.INVALID_TRANSITION_generic_reloaded` ở lại trong dòng căn tới khi rời trang. Căn sau đó quay về OC (dọn xong, R2) thì nút hiện lại cạnh một câu đã cũ.
- Vì sao quan trọng: Câu báo cũ cạnh một nút dùng được làm lễ tân ngại bấm.
- Đề xuất sửa: Lưu trạng thái căn lúc hiện câu (sau lần tải lại). Khi `r.status` khác giá trị đó thì xóa lỗi của `act`.
- Trạng thái: Open

### FB-R5-UXD-FE-PR107-01
- Mức độ: Minor
- Vị trí: `product/apps/guest-web/src/pages/RequestsPage.tsx` 351–366 (`setError` cho `card`, `id`); ảnh `v5-46-request-id-number-390-vi.png`
- Vấn đề:
  - Câu số thẻ và số giấy tờ do máy chủ trả hiện ở khung lỗi chung dưới form. Câu "mô tả ngắn" của cùng ô thì nằm dưới ô (`#gw-req-note-help`).
  - Khung "Lễ tân trả lời từ 07:00" nằm giữa ô và câu lỗi.
  - Ô không có `aria-invalid` khi máy chủ chặn.
- Vì sao quan trọng: Khác cách làm ở bước Giờ đến (cùng câu, nằm dưới ô) và DS C3 ("lỗi gắn `aria-describedby`, `aria-invalid`"). Không chặn: câu vẫn hiện, có `role="alert"`, chữ khách còn.
- Đề xuất sửa:
  - Khi máy chủ trả `card` hoặc `id`, đặt câu vào dòng trợ giúp dưới ô (lớp `help err`, như `note_required`) và gắn `aria-invalid` cho ô.
  - Khung lỗi chung chỉ còn cho lỗi không thuộc ô (quá nhiều yêu cầu, mất mạng, máy chủ).
  - Khách sửa ô thì câu mất.
  - Làm v1.0.6, hoặc trong #107 nếu FE-B còn thời gian. #107 được gộp không cần thẻ này.
- Trạng thái: Open

### FB-R5-UXD-FE-GW-01
- Mức độ: Major
- Vị trí: guest-web, `RequestsPage.tsx` 486 (`<Alert tone="info">` ngoài giờ); màu từ `hifi.css` 368 `.alert.info`; sửa ở `product/apps/guest-web/src/styles.css`
- Vấn đề: Khung thông tin trên trang khách dùng xanh lam (`--info` #3E5E78, `--info-bg` #E0E8EF), không có trong bảng 80/15/5. Ngoại lệ ở DS 2.4 không có lý do chức năng với mức `info` (mục 4.2).
- Vì sao quan trọng: INV yêu cầu mọi đầu ra áp dụng brand guideline, và guideline thắng tài liệu cũ. Khung này hiện mỗi khi khách gửi yêu cầu ngoài giờ.
- Đề xuất sửa:
  - Mở PR riêng nhỏ của FE-B, ví dụ `r5-fe-gw-alert-info`. Không gộp vào #107.
  - Thêm vào `styles.css`:

    ```css
    .guest-app .alert.info { background: var(--cream); border-color: var(--sage); color: var(--ink); }
    ```

    Nền Cream #EDE6D8, viền Sage #8A9079, chữ và icon Ink #2B2B28.
  - Không đổi `@ottimo/ui`, token `--info` hay Desk.
  - Kiểm:
    - ảnh 390 tab Yêu cầu ngoài giờ ở VI, EN, RU;
    - axe 0 critical/serious;
    - một kiểm trong E2E trang khách (Playwright, vì jsdom không tính `var()`) đọc `getComputedStyle` của khung: nền `rgb(237, 230, 216)`, viền `rgb(138, 144, 121)`.
  - Lên v1.0.5 được, không phụ thuộc máy chủ. QA thêm 1 dòng hồi quy.
- Trạng thái: Open

---

## 6. Việc của người khác (không phải thẻ FE)

- **DOM, BE – loại việc của R8a trên căn không còn khách.**
  - `housekeeping.service.ts` (R8a) luôn tạo `stayover_clean` ("Dọn phòng khách đang ở"), kể cả khi căn không còn lượt Đang ở (`reservationId = null`).
  - Với căn kẹt (mục 2.4), khách trước đã đi. Buồng phòng cần dọn như trả phòng (thay ga, kiểm minibar), không phải dọn ở lại.
  - DOM xem có cần R8 tạo việc dọn trả phòng khi `inHouse = false` không. Không chặn #102 và không đổi chữ của UXD.
- **BA (sổ tay), PO/ORC (`product/docs/release-notes.md` dòng 32, 206, 230):** nhãn nút trên màn hình là **"Báo cần dọn"** (thẻ PR102-01). Tên việc "nút Cần dọn" trong plan, hợp đồng, luật giữ được. Chỗ nào dạy người dùng bấm gì thì ghi nhãn mới.
- **MOB #97:** cùng khóa, cùng chữ mới; xem thẻ PR102-01 về dòng trùng trong `gen_strings.py`. UXD chưa review #97 trong lượt này.
- **CPY:** gợi ý v1.0.6 ở mục 3.3.

## 7. Điểm làm tốt
- FE-A không tự viết câu. Cả ba câu Desk đều lấy nguyên văn chữ UXD đã duyệt, và nêu nguồn trong ghi chú khóa. Nhờ vậy UXD kiểm bằng script trong vài giây.
- #98 chỉ hiện danh sách khi có đủ hai kết quả, và nói thật khi không lọc được. Đúng tinh thần thẻ 17 ở R3: chữ không hứa điều sản phẩm không làm.
- #107 bắt được lỗi cũ (máy chủ trả mã cấp trên `CARD_NUMBER_DETECTED`, khách thấy câu "lỗi máy chủ") và có ca test riêng. Bước Giờ đến làm đủ a11y: `role="alert"`, `aria-invalid`, `aria-describedby`.

## 8. Tệp UXD sửa trong lượt này
- `rounds/round-05/reviews/UXD-on-fe-prs-98-102-107.md` (tệp này).
- `rounds/round-05/outputs/UXD/copy-v1.0.5.md` → **bản 1.7**: mục 9.7 mới (V5-50, V5-15, căn kẹt), cùng mục 0, 6, 8.
- `product/design/content-guide.md`: dòng `room_change.ready_only` theo #98, thêm `room_change.ready_unfiltered`.
- `01-decisions/decision-log.md`: 1 dòng UXD.
