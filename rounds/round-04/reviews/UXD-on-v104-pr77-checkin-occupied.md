# UXD review – v1.0.4 PR #77: BUG-R4-039 phía Desk, chặn nhận phòng khi căn còn khách hoặc còn đơn khác đang ở (FE-A)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review chéo** (chữ) | 05/11/2026
- Đối tượng:
  - `gh pr diff 77`, nhánh `v104/fe-checkin-occupied`, head `a44bd5ed`;
  - `pages/stay/CheckInPage.tsx` (dòng `room_ready` và lỗi 409 `ROOM_OCCUPIED`);
  - nhóm khóa "v1.0.4 BUG-R4-039 – FE-A: nhận phòng căn OC/OD" trong `gen_strings.py`, với 2 khóa `checkin.room_occupied` và `checkin.room_held`.
- Phạm vi UXD: chữ VI/EN, giọng, cách hiển thị. Logic `roomOverridable` và mock do ARC/QA xem.
- Đối chiếu:
  - `DOM-on-v104-pr68-docs.md` mục "DOM lượt 5" phần 2 (bảng giả định UXD và câu đề nghị);
  - `brand-guidelines.md` mục 2;
  - các khóa có sẵn: `checkin.room_not_ready(_lead)`, `ci.capacity_block_title`, `rsv.capacity_conflict_body`, `ci.capacity_fix_move`, `error.FOLIO_LOCKED`, `status.booking.in_house`, `status.room.*`, `attn.room_status_mismatch`;
  - `packages/ui/src/Feedback.tsx`: `Alert` tone `bad` mặc định có `role="alert"`.
- Cách kiểm: đọc diff và `git show a44bd5ed:…`. Không chạy test, không checkout, không push. Test của PR dùng `tv()` cho cả hai khóa, nên đổi chữ không làm đỏ test.

## Kết luận: ĐẠT CÓ ĐK

Cách hiển thị đúng mẫu vượt sức chứa:
- `Alert tone="bad"` nằm trong dòng `room_ready`, có link sang đơn;
- không có ô lý do, không có nút xác nhận hay xin duyệt;
- không thêm màu, lớp CSS hay `style=`.

Lỗi 409 `ROOM_OCCUPIED` dùng câu nhận phòng thay cho `error.ROOM_OCCUPIED`. Câu `error.ROOM_OCCUPIED` nói về khóa căn, nên đổi như vậy là đúng.

**Điều kiện (1 thẻ Major, FB-01):** FE thay chữ của **cả hai** khóa bằng bản dưới đây, sửa ghi chú, rồi sinh lại strings. Lý do:
- `room_held` đang ghi "chờ UXD duyệt";
- câu hiện tại chưa có lối "mời khách chờ" mà DOM yêu cầu;
- câu "Không ai…" cần đổi giọng.

Thẻ Suggestion (FB-02) dời v1.0.5. Không có ESC.

### Trả lời 3 câu ORC hỏi

| Câu | Quyết định của UXD |
|---|---|
| 1. `checkin.room_held` | **Viết lại.** (a) "còn khách của đơn khác" dễ hiểu là còn người trong căn. Ở trường hợp (b), khách có thể đã đi nhưng đơn vẫn **Đang ở**, và đó mới là chỗ chặn. Câu mới dùng đúng nhãn trạng thái đơn của Desk: "còn đơn khác đang ở" / "another stay in house". Lễ tân thấy dòng trên ghi "VD · Trống, cần dọn" thì vẫn hiểu vì sao bị chặn. (b) Thêm "mời khách chờ". (c) Đưa ba lối ra lên ngay sau câu nói vấn đề, theo thứ tự DOM: Trả phòng đơn trước, rồi mời khách chờ, rồi đổi căn. (d) Không nhắc buồng phòng, đúng DOM, vì sửa trạng thái buồng không mở được chặn (b) |
| 2. `checkin.room_occupied` có thêm "Mời khách chờ" hay câu trạng thái lệch không | **Thêm "mời khách chờ"** (3 chữ), cùng chỗ và cùng thứ tự với `room_held`. Ở `OC`/`OD`, khách cũ thường còn trong căn (trả phòng muộn, đi hôm nay), nên chờ là lối hay dùng nhất. **Câu trạng thái lệch đã có, giữ lại nhưng sửa.** Bỏ "nhờ buồng phòng", vì DOM ghi lễ tân **hoặc** buồng phòng đều làm được. Thêm "kiểm căn đã trống", vì DOM dặn kiểm thật không còn người và đồ trước khi chuyển trạng thái. Câu không liệt kê "Cần dọn → Bắt đầu dọn → Dọn xong": đó là việc của sổ tay, vì ca này hiếm và đã có mục lệch trạng thái ở Cần chú ý (`attn.room_status_mismatch`) |
| 3. "Không ai xác nhận ngoại lệ được" có đúng giọng với nhân viên không | **Giữ ý, đổi cách nói.** Câu cần có, vì lễ tân trưởng quen thấy "Bạn xác nhận ngoại lệ được", còn lễ tân thường quen "Gửi lễ tân trưởng xác nhận". Thiếu câu này thì họ sẽ gọi lễ tân trưởng hoặc đi tìm nút. Nhưng "Không ai… được" nhắm vào người và nghe như lời từ chối, chưa đúng giọng điềm tĩnh. Đổi sang câu nói về trường hợp: **"Trường hợp này không có ngoại lệ."** / **"No exception applies in this case."** Câu vẫn chặn mọi vai, nhưng không nói ai không được. Câu đặt **sau** các lối ra, để việc cần làm được đọc trước. Tiền lệ "Không ai…" ở `error.FOLIO_LOCKED` không đổi. Ở đó phiếu đã khóa hẳn, và câu cần chặn cả quản lý |

---

### FB-R4-UXD-FE-PR77-01
- Mức độ: **Major** (điều kiện của ĐẠT CÓ ĐK)
- Vị trí: `product/design/tools/gen_strings.py`, nhóm "v1.0.4 BUG-R4-039 – FE-A: nhận phòng căn OC/OD", 2 dòng `checkin.room_occupied` và `checkin.room_held` (dòng 4141–4150 ở `a44bd5ed`).
- Vấn đề:
  - `room_held` chưa được duyệt (ghi chú "chờ UXD duyệt chữ").
  - Cả hai câu thiếu lối "mời khách chờ" mà DOM đề nghị (lượt 5 mục 2).
  - Câu "Không ai xác nhận ngoại lệ được" đứng trước các lối ra và nghe như lời từ chối.
  - `room_held` nói "còn khách", trong khi chỗ chặn là đơn còn **Đang ở**.
  - Câu trạng thái lệch của `room_occupied` chỉ giao việc cho buồng phòng, và chưa dặn kiểm căn trước.
- Vì sao quan trọng:
  - Đây là câu lễ tân đọc lúc khách đứng ở quầy.
  - Câu phải nói ngay việc cần làm, theo thứ tự đúng. Nếu không, lễ tân sẽ gọi lễ tân trưởng cho một việc không ai duyệt được, hoặc nhờ buồng phòng sửa trạng thái trong khi việc đúng là trả phòng đơn cũ (DOM: trường hợp hay gặp).
- Đề xuất sửa: FE thay chữ và ghi chú của 2 dòng, chạy `python3 -I product/design/tools/gen_strings.py`, rồi kiểm lần chạy thứ hai không đổi gì.

  | Khóa | VI | EN |
  |---|---|---|
  | `checkin.room_occupied` | Căn {room} còn khách của đơn trước, chưa trả phòng. Trả phòng đơn đó trước, hoặc mời khách chờ, hoặc đổi đơn này sang căn trống. Trường hợp này không có ngoại lệ. Nếu đơn trước đã trả phòng: kiểm căn đã trống rồi sửa trạng thái buồng. | Room {room} still has the previous guest, not checked out yet. Check out that stay first, ask this guest to wait, or move this booking to a vacant room. No exception applies in this case. If that stay is already checked out, check the room is empty, then correct the room status. |
  | `checkin.room_held` | Căn {room} còn đơn khác đang ở, chưa trả phòng. Trả phòng đơn đó trước, hoặc mời khách chờ, hoặc đổi đơn này sang căn trống. Trường hợp này không có ngoại lệ. | Room {room} still has another stay in house. Check out that stay first, ask this guest to wait, or move this booking to a vacant room. No exception applies in this case. |

  - Ghi chú `room_occupied`: "v1.0.4 BUG-R4-039 (BR-402 (1)). Alert bad trong dòng room_ready khi buồng OC/OD, và câu của 409 ROOM_OCCUPIED. Không ô lý do, không nút duyệt. Thứ tự lối ra theo DOM lượt 5 mục 2: trả phòng đơn trước, mời khách chờ, đổi căn. Câu cuối chỉ cho trạng thái lệch (lễ tân hoặc buồng phòng). UXD duyệt 05/11 (FB-R4-UXD-FE-PR77-01). {room} = số căn"
  - Ghi chú `room_held`: "v1.0.4 BUG-R4-039 (BR-402 (1), DOM lượt 5 mục 2 (b)). Alert bad trong dòng room_ready khi buồng không phải OC/OD/OOO nhưng căn còn lượt Đang ở của đơn khác (room_ready không có overridableBy). Không nhắc buồng phòng. 'đang ở' = status.booking.in_house. UXD duyệt 05/11 (FB-R4-UXD-FE-PR77-01). {room} = số căn"
  - Câu đầu của `room_occupied` giữ nguyên bản đã duyệt. Hai câu cùng khung (vấn đề, ba lối ra, không ngoại lệ), nên lễ tân nhận ra ngay là cùng một loại chặn. Chỉ câu đầu khác: căn có khách, hay đơn khác đang ở.
  - Độ dài: `room_occupied` VI 234 / EN 279 ký tự; `room_held` VI 158 / EN 169. `room_occupied` dài hơn bản cũ khoảng 30 ký tự vì có "mời khách chờ" và "kiểm căn đã trống". Câu nằm trong `Alert` của một dòng điều kiện, cùng cỡ với `rsv.capacity_conflict_body`, nên không vỡ bố cục.
  - "Mời khách chờ" / "ask this guest to wait": "this guest" ghép đôi với "this booking", nên không lẫn với khách cũ.
  - Tên nhóm `g(...)` có thể đổi thành "nhận phòng căn còn khách hoặc còn đơn khác đang ở" cho khớp 2 trường hợp. Việc này không bắt buộc.
  - BA (sổ tay nhận phòng, mục căn chưa sẵn sàng): thêm 1 dòng cho trường hợp trạng thái lệch, theo DOM: kiểm căn trống, rồi "Cần dọn" → "Bắt đầu dọn" → "Dọn xong". Lễ tân hoặc buồng phòng làm, với căn trong phạm vi được giao.
- Trạng thái: Open

### FB-R4-UXD-FE-PR77-02
- Mức độ: Suggestion (v1.0.5; BE + FE, UXD cấp khóa)
- Vị trí: `CheckInPage.tsx`, `Alert` chặn của dòng `room_ready`, link `drawer.action.move` sang `/reservations/{id}`.
- Vấn đề:
  - Lối ra đầu tiên là "Trả phòng đơn đó trước", nhưng Alert không chỉ đơn đó là đơn nào. Lễ tân phải ra sơ đồ phòng, bấm vào căn rồi mới tìm thấy đơn.
  - Link duy nhất là "Đổi căn / đổi ngày", và nó mở đơn **này**. Mẫu vượt sức chứa thì có nhãn riêng cho đúng lối ra: "Đổi sang căn đủ chỗ".
- Vì sao quan trọng: khách đứng chờ ở quầy. Thêm một cú bấm thẳng tới đơn cũ là bớt một lần dò trên sơ đồ phòng.
- Đề xuất sửa (v1.0.5):
  - BE thêm mã và id của lượt đang giữ căn vào điều kiện `room_ready` khi không có `overridableBy` (ARC duyệt hợp đồng).
  - Desk thêm link đầu tiên "Mở đơn {code}" (VI) / "Open booking {code}" (EN) tới đơn đó; `{code}` hiện bằng mono, như các mã đơn khác.
  - Đổi nhãn link đổi căn sang khóa riêng "Đổi sang căn trống" / "Move to a vacant room", khớp câu.
  - Không cần cho hotfix: chữ ở FB-01 đã đủ để lễ tân làm đúng.
- Trạng thái: Open

---

## Ghi chú, không phải thẻ
- `Alert` tone `bad` mặc định có `role="alert"`, nên trình đọc màn hình đọc câu khi trang nhận phòng tải xong. Mẫu vượt sức chứa cũng vậy, nên chấp nhận. Màu `--bad` / `--bad-bg` là màu chức năng đã ghi ở DS 2.4, không phải lệch mới so với guideline.
- `OOO` vẫn dùng `ci.ooo_never` dạng `li-s`, không phải Alert. Việc này có từ trước, không thuộc PR này. Nếu muốn mọi kiểu chặn cùng một mẫu, để v1.0.5.

## Điểm nên giữ
- Tách 2 trường hợp theo `detail` và `overridableBy`, đúng cách đọc DOM và ARC đã xác nhận. Desk vẫn đúng khi máy chủ chưa có #74, nên gộp trước hay sau #74 đều được.
- Không giữ lý do đã gõ khi căn chuyển sang không cho ngoại lệ (`roomNotReadyOverride`). Lễ tân không vô tình gửi một yêu cầu mà máy chủ sẽ từ chối.
- Test có ca đối chứng `VD` không có ai (vẫn có ô lý do và nút xin duyệt). Test cũng kiểm 409 không hiện `error.ROOM_OCCUPIED`. Dùng `tv()` nên đổi chữ ở FB-01 không làm đỏ test.

---

## Lượt 2 @ 99d2c01b (05/11/2026): **ĐẠT.** Đóng thẻ FB-R4-UXD-FE-PR77-01

UXD đọc `git show ce859f59` và so bằng script từng ký tự với bản ở thẻ FB-01. Kết quả cho cả hai khóa `checkin.room_occupied` và `checkin.room_held`:
- chữ VI, chữ EN và ghi chú trong `gen_strings.py` **khớp nguyên văn**;
- mỗi khóa chỉ có 1 dòng;
- các tệp sinh ra (`strings-vi.json`, `strings-en.json`, `strings-tables.md`, `strings.js`) đều có đúng chữ mới;
- không còn câu "Không ai xác nhận ngoại lệ được" nào.

Phần còn lại của lượt sửa:
- `CheckInPage.tsx` không đổi so với `a44bd5ed`.
- Commit merge `99d2c01b` chỉ kéo `main` vào nhánh (#70: `BookingDialog.tsx` và test của nó), ngoài phạm vi thẻ này.
- Tên nhóm `g(...)` giữ nguyên. Việc đổi tên không bắt buộc, nên chấp nhận.

Còn mở: FB-02 (Suggestion, v1.0.5). Không còn thẻ Blocker hay Major. Không có ESC.

---

## Lượt 3 (05/11/2026): câu có mã đơn đang giữ căn, cho PR xếp chồng `v104/fe-checkin-cause`

Theo #74, máy chủ trả thêm `heldByReservationCode` khi một lượt Đang ở khác còn giữ căn. Câu dưới đây giữ nguyên khung của `checkin.room_held` đã duyệt: cùng thứ tự ba lối ra, cùng câu "Trường hợp này không có ngoại lệ." Chỉ "đơn khác" được thay bằng mã đơn.

| Khóa mới | VI | EN |
|---|---|---|
| `checkin.room_held_code` | Căn {room} còn đơn {code} đang ở, chưa trả phòng. Trả phòng đơn đó trước, hoặc mời khách chờ, hoặc đổi đơn này sang căn trống. Trường hợp này không có ngoại lệ. | Room {room} still has booking {code} in house. Check out that booking first, ask this guest to wait, or move this booking to a vacant room. No exception applies in this case. |

- Ghi chú cho `gen_strings.py`: "v1.0.4 BUG-R4-039 (#74 heldByReservationCode). Như checkin.room_held, khi máy chủ trả mã đơn đang giữ căn. {code} = heldByReservationCode, hiện mono (monoArgs ['code']); {room} = số căn. Chọn câu: OOO → ci.ooo_never; có {code} → khóa này; OC/OD → checkin.room_occupied; còn lại → checkin.room_held. UXD duyệt 05/11 (UXD-on-v104-pr77 lượt 3)"
- Độ dài: VI 160, EN 174 ký tự, gần bằng `room_held` (158 / 169). Khóa thêm vào cùng nhóm `g(...)` BUG-R4-039 với hai khóa kia.
- Mã đơn chỉ xuất hiện **một lần**. Câu 2 nói "đơn đó" / "that booking", vì mã đã ở ngay câu trước. Lặp mã mono hai lần trong 2 dòng chỉ làm rối mắt. EN dùng "that booking" đối với "this booking", nên lễ tân phân biệt ngay đơn cũ với đơn đang nhận.
- `{code}` hiện bằng mono (JetBrains Mono, theo guideline mục 6), qua `monoArgs(t, 'checkin.room_held_code', { room, code }, ['code'])`, như các mã đơn khác của Desk.
- **Thứ tự chọn câu (quyết định của UXD):**
  1. `OOO` → `ci.ooo_never`.
  2. Có `heldByReservationCode` → `checkin.room_held_code`, **kể cả khi buồng `OC`/`OD`**. Khi đã có mã, chắc chắn có một lượt Đang ở thật. Câu "trạng thái lệch" của `room_occupied` không đúng nữa, và lối ra là trả phòng đúng đơn đó.
  3. `OC`/`OD` mà không có mã → `checkin.room_occupied` (có thể do trạng thái lệch).
  4. Còn lại (máy chủ chưa có trường mới) → `checkin.room_held`.
  - ARC/DOM xác nhận: máy chủ chỉ trả mã khi có lượt Đang ở thật của đơn khác. Nếu đúng vậy, bước 2 an toàn.
- Lỗi 409 `ROOM_OCCUPIED` ở cuối trang vẫn dùng `checkin.room_occupied`, như lượt 1.
- Việc này đáp một nửa thẻ FB-02: lễ tân biết đơn nào phải trả phòng trước. Nửa còn lại là link "Mở đơn {code}" / "Open booking {code}" tới đơn đó. Phần này cần máy chủ trả thêm id của đơn, nên FB-02 vẫn mở (Suggestion, v1.0.5). Nếu PR xếp chồng có id thì UXD cấp khóa link khi FE cần.

---

## Lượt 4 (05/11/2026): đổi đuôi `checkin.room_occupied` theo DOM lượt 7 mục 3, cho PR xếp chồng `v104/fe-checkin-cause`

- Căn cứ: `DOM-on-v104-pr68-docs.md` lượt 7 mục 3. Ở v1.0.4, không trang Desk, mục Cần chú ý hay màn app nhân viên nào đưa được căn ra khỏi `OC`. Việc 07:00 cũng không tự sửa. Vì vậy đuôi câu UXD duyệt ở lượt 1 ("kiểm căn đã trống rồi sửa trạng thái buồng") bảo lễ tân làm một việc không làm được. UXD rút lại đuôi đó.
- Đối chiếu hợp đồng: `ARC-on-v104-pr74-checkin-occupied.md` phụ lục A. `cause` là `room_status`, `held_by_other_stay` hoặc `no_room`, ưu tiên `held_by_other_stay`. `heldByReservationCode` chỉ có khi `cause = held_by_other_stay`. Điều này xác nhận giả định ở lượt 3.

### Quyết định: duyệt ý của DOM, chỉnh câu chữ cho khớp hai câu đã duyệt

| Khóa | VI | EN |
|---|---|---|
| `checkin.room_occupied` (sửa đuôi) | Căn {room} còn khách của đơn trước, chưa trả phòng. Trả phòng đơn đó trước, hoặc mời khách chờ, hoặc đổi đơn này sang căn trống. Trường hợp này không có ngoại lệ. Nếu đơn trước đã trả phòng: đổi căn cho đơn này và báo quản lý để sửa trạng thái căn. | Room {room} still has the previous guest, not checked out yet. Check out that stay first, ask this guest to wait, or move this booking to a vacant room. No exception applies in this case. If that stay is already checked out, move this booking and tell the manager so the room status can be fixed. |
| `checkin.room_status_stuck` (mới) | Căn {room} vẫn hiện có khách, nhưng không còn đơn nào đang ở. Đổi đơn này sang căn trống và báo quản lý để sửa trạng thái căn. Trường hợp này không có ngoại lệ. | Room {room} still shows as occupied, but no stay is in house. Move this booking to a vacant room and tell the manager so the room status can be fixed. No exception applies in this case. |

Chỗ chỉnh so với câu DOM gợi ý:
- "xếp khách sang căn trống khác" thành **"đổi căn cho đơn này"**. Lý do: dùng đúng việc của Desk (link "Đổi căn / đổi ngày" nằm ngay dưới câu) và cùng cách nói với lối ra phía trước. Trong `room_occupied` không lặp "sang căn trống" lần hai, vì câu trước đã nói.
- EN "If the previous booking…" thành **"If that stay…"**, khớp "Check out that stay first" ở câu trước. Giữ nguyên "tell the manager so the room status can be fixed", vì câu không nói ai sửa: quản lý chuyển cho đội kỹ thuật, theo DOM.
- Bỏ "kiểm căn đã trống". Ở v1.0.4, lễ tân không nhận khách vào căn này, nên không cần kiểm căn trước.

Vì sao thêm khóa `room_status_stuck`:
- Khi có `cause`, Desk biết chắc căn kẹt trạng thái: `cause = room_status` và buồng `OC`/`OD` nghĩa là không còn lượt Đang ở nào. Lúc đó câu "Trả phòng đơn đó trước" của `room_occupied` sai, vì lễ tân sẽ đi tìm một đơn đã trả phòng.
- Câu riêng chỉ còn đúng lối ra làm được. "Đang ở" là nhãn `status.booking.in_house`.
- `room_occupied` vẫn cần đuôi mới cho hai chỗ:
  - máy chủ chưa có C2 (ARC mục 4.3 cho phép dời `cause` sang v1.0.5);
  - lỗi 409 `ROOM_OCCUPIED`.

### Thứ tự chọn câu, thay cho lượt 3
1. `detail = OOO` → `ci.ooo_never`.
2. `cause = held_by_other_stay` → `checkin.room_held_code` với `{code}` = `heldByReservationCode`, hiện mono. Thiếu mã thì dùng `checkin.room_held`.
3. `cause = room_status` và `detail` là `OC`/`OD` → `checkin.room_status_stuck`.
4. Không có `cause` (máy chủ chưa có C2): `OC`/`OD` → `checkin.room_occupied`; còn lại → `checkin.room_held`.
5. 409 `ROOM_OCCUPIED` ở cuối trang → `checkin.room_occupied`.

### Ghi chú cho `gen_strings.py` (cùng nhóm BUG-R4-039)
- `checkin.room_occupied`: thay đoạn "Câu cuối chỉ cho trạng thái lệch (lễ tân hoặc buồng phòng)" bằng: "Câu cuối chỉ cho trạng thái kẹt khi máy chủ chưa có cause (v1.0.4 không có nút đưa căn khỏi OC: đổi căn và báo quản lý, DOM lượt 7 mục 3). Có cause = room_status thì dùng checkin.room_status_stuck. UXD duyệt lại 05/11 (UXD-on-v104-pr77 lượt 4)". Phần còn lại của ghi chú giữ nguyên.
- `checkin.room_status_stuck`: "v1.0.4 BUG-R4-039 (#74 C2). Alert bad trong dòng room_ready khi cause = room_status và buồng OC/OD: không còn lượt Đang ở nào, trạng thái buồng kẹt. Không ô lý do, không nút duyệt; link Đổi căn / đổi ngày như các câu chặn khác. 'đang ở' = status.booking.in_house. v1.0.5 có nút Cần dọn thì UXD đổi câu. UXD duyệt 05/11 (UXD-on-v104-pr77 lượt 4). {room} = số căn"

### Lưu ý phát hành
- #77 gộp với đuôi cũ. PR xếp chồng `v104/fe-checkin-cause` phải vào cùng bản v1.0.4.
- Nếu PR xếp chồng trễ: cherry-pick riêng dòng `checkin.room_occupied` trong `gen_strings.py` lên v1.0.4, rồi sinh lại strings. Như vậy câu bảo làm việc không làm được không ra production. Không cần sửa mã.
- Độ dài:
  - `room_occupied`: VI 248, EN 296 ký tự. Đây là câu dài nhất của bộ chặn, nhưng đuôi chỉ là ca hiếm, nằm cuối câu.
  - `room_status_stuck`: VI 160, EN 185 ký tự.
- v1.0.5 (DOM backlog: nút **Cần dọn** trên Desk và app nhân viên, mục Cần chú ý mở thẳng căn): UXD sẽ đổi lại hai câu theo hướng "kiểm căn đã trống rồi bấm Cần dọn".
- BA: sổ tay đi theo DOM lượt 7 mục 3, kể cả bước "không có căn khác thì quản lý gọi đội trong ca, khách chờ ở sảnh". Bước đó không đưa vào câu chặn.

Thẻ UXD trên #77 không đổi trạng thái: FB-01 đã đóng, FB-02 vẫn mở (Suggestion, v1.0.5). Không có ESC.

---

## Lượt 5 – PR #79 `v104/fe-checkin-cause` @ b5fd9bd3 (xếp chồng trên #77), 05/11/2026

- Đối tượng: `gh pr diff 79`. Gồm `CheckInPage.tsx` (`roomBlockedMessage`, bỏ nhánh 409 `ROOM_OCCUPIED`), `gen_strings.py` và 4 tệp sinh ra, mock và test. Chỉ đọc, không chạy test.
- Cách kiểm: so từng ký tự bằng script với chữ ở lượt 3 và lượt 4. Chạy trên `gen_strings.py`, `strings-vi/en.json`, `strings-tables.md` và `strings.js` của `b5fd9bd3`.

### Kết luận: **ĐẠT**

Có 1 thẻ Minor cho ghi chú (FB-01 dưới đây). FE-A dán luôn trong PR này. Thẻ chỉ sửa ghi chú, không đổi chữ, và không chặn gộp.

| Câu ORC hỏi | Kết quả |
|---|---|
| 1. Chữ khớp không | **Khớp nguyên văn, cả VI và EN**, ở cả 5 tệp, mỗi khóa 1 dòng: `room_occupied` với đuôi mới của lượt 4, `room_held_code` (lượt 3), `room_status_stuck` (lượt 4). `room_held` không đổi. Đuôi cũ "kiểm căn đã trống rồi sửa trạng thái buồng" đã hết. Ghi chú của `room_held_code` và `room_status_stuck` đúng bản UXD, nhưng `room_held_code` nay đã cũ (câu 2) |
| 2. Ghi chú cũ | **Đúng, hai ghi chú đã cũ.** Thêm ghi chú của `room_held` cũng cũ một phần: khóa này nay còn dùng cho `held_by_other_stay` thiếu mã, ở mọi trạng thái buồng. Ghi chú của `room_occupied` còn lặp "UXD duyệt" hai lần, do FE-A làm đúng từng chữ cách sửa ở lượt 4. Bản thay nằm ở thẻ FB-01 |
| 3. Chỉ đọc mã khi `cause = held_by_other_stay` | **Xác nhận.** Cách đọc này khớp lượt 4 bước 2 và hợp đồng ARC phụ lục A.2: `heldByReservationCode` chỉ có khi `cause = held_by_other_stay`. Quy tắc ở lượt 3 ("có mã thì dùng `room_held_code`") được thay bằng cách đọc này. Cách này chặt hơn và an toàn hơn: nếu máy chủ gửi mã kèm một `cause` khác, Desk không gọi tên một đơn không giữ căn. Có `held_by_other_stay` mà không có mã thì dùng `room_held`, đúng lượt 4 |

Ghi chú thêm về logic hiển thị. Phần này thuộc ARC/QA; UXD chỉ xem phần câu nào hiện ra.
- `roomBlockedMessage` chọn câu đúng thứ tự lượt 4:
  - `OOO` → `ci.ooo_never`;
  - `no_room` → không có câu, vì dòng `not_unassigned` đã nói;
  - `held_by_other_stay` → `room_held_code`, hoặc `room_held` khi thiếu mã;
  - `room_status` trên `OC`/`OD` → `room_status_stuck`;
  - không có `cause`, hoặc `cause` lạ → đọc như DOM lượt 5, và chỉ khi đơn đã có căn (`hasRoom`).
- Điều kiện `hasRoom` là điểm cộng. Đơn chưa xếp căn đọc ra `detail: "VC"`, nên không bị báo nhầm "còn đơn khác đang ở".
- `cause = room_status` trên `VD`/`CL` mà không có `overridableBy` sẽ rơi xuống nhánh dự phòng và hiện `room_held`. Theo hợp đồng thì ca này không xảy ra, vì `VD`/`CL` không có lượt giữ căn thì luôn có ngoại lệ. Nếu QA gặp ca này thì ghi lỗi, không cần đổi chữ.
- Bỏ nhánh 409 `ROOM_OCCUPIED` là đúng, theo ARC: `checkIn` không trả mã đó. Bước 5 của lượt 4 không còn áp dụng.
  - 409 khi căn bị lấy sau bản xem nay đọc lại bản xem, rồi hiện câu của điều kiện mới (test "ARC PR77-03").
  - Như vậy lễ tân luôn thấy câu theo `cause` mới nhất, tốt hơn một câu cố định.
- Mã đơn hiện mono qua `monoArgs(..., ['code'])`, đúng lượt 3. Không thêm màu, CSS hay `style=`.

### FB-R4-UXD-FE-PR79-01
- Mức độ: Minor (dán trong PR #79; không chặn gộp)
- Vị trí: `product/design/tools/gen_strings.py`, nhóm "v1.0.4 BUG-R4-039 – FE-A: nhận phòng căn OC/OD", cột ghi chú của `checkin.room_occupied`, `checkin.room_held` và `checkin.room_held_code`.
- Vấn đề:
  - `room_occupied` vẫn ghi "câu của 409 ROOM_OCCUPIED", trong khi nhánh đó đã bỏ. Ghi chú cũng lặp "UXD duyệt" hai lần.
  - `room_held_code` vẫn ghi thứ tự chọn câu của lượt 3.
  - `room_held` vẫn ghi "khi buồng không phải OC/OD/OOO". Nay khóa này còn dùng cho `held_by_other_stay` thiếu mã, ở mọi trạng thái buồng.
- Vì sao quan trọng: `strings-tables.md` là nguồn để UXD, BA, QA tra chữ nào hiện ở ca nào. Ghi chú sai dẫn tới test case sai, hoặc dẫn tới sửa nhầm ở v1.0.5 khi đổi câu theo nút Cần dọn.
- Đề xuất sửa: FE-A thay **nguyên** ghi chú (đối số thứ 5) của 3 dòng bằng các câu dưới đây, rồi chạy `python3 -I product/design/tools/gen_strings.py` hai lần (lần hai không đổi gì). Chữ VI/EN không đổi.
  - `checkin.room_occupied`:
    > v1.0.4 BUG-R4-039 (BR-402 (1)). Alert bad trong dòng room_ready khi buồng OC/OD và máy chủ không trả cause (API trước #74 C2) hoặc trả cause lạ, chỉ khi đơn đã có căn. Không ô lý do, không nút duyệt. Thứ tự lối ra theo DOM lượt 5 mục 2: trả phòng đơn trước, mời khách chờ, đổi căn. Câu cuối cho trạng thái kẹt (v1.0.4 không có nút đưa căn khỏi OC: đổi căn và báo quản lý, DOM lượt 7 mục 3). Có cause: held_by_other_stay → checkin.room_held_code / checkin.room_held; room_status trên OC/OD → checkin.room_status_stuck. UXD duyệt 05/11 (FB-R4-UXD-FE-PR77-01; UXD-on-v104-pr77 lượt 4, 5). {room} = số căn
  - `checkin.room_held`:
    > v1.0.4 BUG-R4-039 (BR-402 (1), DOM lượt 5 mục 2 (b)). Alert bad trong dòng room_ready khi căn còn lượt Đang ở của đơn khác mà Desk không có mã đơn: cause = held_by_other_stay thiếu heldByReservationCode (mọi trạng thái buồng), hoặc không có cause và buồng không phải OC/OD/OOO (room_ready không có overridableBy, đơn đã có căn). Không nhắc buồng phòng. 'đang ở' = status.booking.in_house. UXD duyệt 05/11 (FB-R4-UXD-FE-PR77-01; UXD-on-v104-pr77 lượt 5). {room} = số căn
  - `checkin.room_held_code`:
    > v1.0.4 BUG-R4-039 (#74 C2, heldByReservationCode). Như checkin.room_held, khi cause = held_by_other_stay và máy chủ trả mã đơn gốc đang giữ căn, kể cả khi buồng OC/OD. Chỉ đọc mã khi cause = held_by_other_stay. {code} = heldByReservationCode, hiện mono (monoArgs ['code']); {room} = số căn. Chọn câu (UXD lượt 4): OOO → ci.ooo_never; no_room → không câu (not_unassigned); held_by_other_stay → khóa này, thiếu mã → checkin.room_held; room_status trên OC/OD → checkin.room_status_stuck; không có cause → OC/OD: checkin.room_occupied, còn lại: checkin.room_held. UXD duyệt 05/11 (UXD-on-v104-pr77 lượt 3, 5)
  - Ghi chú của `checkin.room_status_stuck` giữ nguyên. Ghi chú đầu nhóm (dòng `#` UXD lượt 4) giữ nguyên.
- Trạng thái: Open

Thẻ UXD còn mở trên chuỗi #77/#79:
- PR79-01 (Minor, ghi chú);
- PR77-02 (Suggestion, link "Mở đơn {code}", v1.0.5).

Không có ESC.
