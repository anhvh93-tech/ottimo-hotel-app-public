# UXD review – v1.0.4 PR #72: sách hướng dẫn (sổ tay, `00`, `01`, `02`) theo mã v1.0.4 đã gộp

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 05/11/2026
- Đối tượng: `git diff origin/main...origin/v104/ba-docs-r4c -- product/docs/manual/` @ `11794c25` (gốc so sánh `06626ead`; `main` hiện `a08374bb`, sau #84 chỉ thêm decision-log). Tệp: `user-manual-v1.0.md`, `guides/00-index.md`, `guides/01-chu-dau-tu-quan-ly.md`, `guides/02-le-tan.md`.
- Đối chiếu:
  - `product/design/copy/strings-vi.json` và `product/design/tools/strings-tables.md` trên `main`;
  - mã Desk trên `main`: `CheckInPage.tsx` (khung chặn dòng buồng), `CheckOutPage.tsx` (tủ minibar), `BookingDialog.tsx` (giá Nội bộ, cột Nguồn giá, khóa Giữ chỗ), `FolioDialog.tsx` (A31), `foc.tsx` (hộp miễn phí / giảm giá); máy chủ `foc.service.ts`, `stay-night-pricing.ts`, `minibar.service.ts`;
  - tag `v1.0.3` cho nhãn nút của khối "tới v1.0.3";
  - `UXD-on-v104-pr77-checkin-occupied.md` (thẻ PR77-02 còn mở, v1.0.5).
- Cách soát:
  - Máy soát mọi cụm **đậm** và mọi câu trong ngoặc kép ở các dòng PR thêm, so với giá trị trong `strings-vi.json` (`{room}`, `{code}`… coi như "…").
  - Đọc mã ở từng chỗ sách tả hành vi (nút nào hiện, Desk chọn sẵn gì).
  - Dựng HTML bằng `rebuild_manual_html.py` trong worktree riêng ở scratchpad. Kết quả ĐẠT: 390 và 1440 px không tràn ngang, font nhúng đủ 5 mặt. Đã chụp 7.4 và 11.1 ở 390 và 1440 px. Không commit HTML.

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

**Nhãn và câu trích khớp `main` từng chữ, gồm cả mọi chỗ trọng tâm.** Cụm đậm còn lệch chỉ là chữ nhấn mạnh hoặc tiêu đề ý, không phải nhãn Desk. Ngoại lệ: thẻ 04 (một nhãn ở khối v1.0.3) và thẻ 05 (dấu câu).

| Chỗ trong sách | Khóa trên `main` | Khớp |
|---|---|---|
| "Căn … còn đơn OTM-… đang ở, chưa trả phòng. …" | `checkin.room_held_code` | Có |
| "Căn … vẫn hiện có khách, nhưng không còn đơn nào đang ở. …" | `checkin.room_status_stuck` | Có |
| **Buồng sẵn sàng (VI hoặc VC)**, **Lý do** | `checkin.cond.room_ready`, `ci.reason` | Có |
| Nút **Đổi căn / đổi ngày** | `drawer.action.move` | Có (xem thẻ 01: nút mở khung đơn) |
| Câu `OOO` "không bao giờ nhận phòng được" | `ci.ooo_never` | Có |
| **Tủ minibar cần đếm**, **Căn … (đã chuyển đi)**, **Căn … (đang ở)** | `co.minibar_cabinet`, `_old`, `_room` | Có |
| **Tiếp tục: Tủ căn 202** / **Tiếp tục: Phụ phí** | `co.go_next_cabinet` / `co.go_extras` | Có |
| "Đã lưu số đếm tủ căn …" | `co.minibar_cabinet_saved` | Có |
| **Tủ minibar đang đếm**, **Tủ căn … cần đếm lại** | `co.minibar_cabinet_counting`, `co.minibar_recount_title` | Có |
| "Chưa kiểm minibar. Làm bước 1 trước khi hoàn tất." | `error.MINIBAR_NOT_CHECKED` | Có |
| **Quay lại** | `common.back` (chỉ có từ bước 2; bước 1 là "về đơn") | Có |
| "Miễn phí: để trống ô. Có thu: nhập giá lớn hơn 0." (gõ 0) | `booking.error.rate_zero_internal` | Có |
| "Đơn Nội bộ: nhập giá cho mọi đêm, hoặc để trống hết nếu miễn phí cả đơn." (gõ một phần) | `booking.error.rate_empty_internal` | Có |
| Ô A31 **Giá đêm mới (trước giảm theo số đêm)**, **Lý do điều chỉnh**, **Ghi điều chỉnh** | `folio.adjust_night_price`, `folio.adjust_reason`, `folio.adjust_submit` | Có |
| Cột **Nguồn giá**: **Giá đã gõ** / **Giá niêm yết (BR-101)** / "–" | `bk.rate_source`, `bk.src_typed`, `bk.src_list` | Có |
| Hai câu "Đã xóa giá đã gõ vì …", câu khóa **Giữ chỗ đến …** | `booking.rates_cleared_*`, `booking.hold.typed_rate_locked` | Có |
| OTA gõ một phần: "Nhập giá mỗi đêm (lớn hơn 0)." | `booking.error.rate_empty` | Có (thẻ 05: dấu chấm thừa) |
| **Mở form miễn phí / giảm giá**, **Số tiền miễn**, **Lý do miễn phí**, **Khác (ghi rõ)**, **Gửi duyệt** | `foc.open_form`, `foc.amount`, `handover.foc_reason`, `foc.r_other`, `foc.send` | Có (thẻ 02: thiếu ô **Loại**) |
| **Ghi chú giờ trả (vì sao ghi bù)**, **Giờ trả phòng thực tế**, **Ở thêm** | `checkout.time_note`, `checkout.departure_time`, `extend.nights` | Có |

**Cần sửa trước khi gộp:**
- Ba thẻ Major:
  - 01: 7.4 thành một khối chữ rất dài.
  - 02: bước xin giảm 100 % đêm thêm bỏ sót ô **Loại**, mà Desk chọn sẵn ô đó sai.
  - 03: khối 2 tủ minibar mới mâu thuẫn với 9.4, khách có thể bị tính tiền minibar hai lần. Cần DOM xác nhận.
- Hai thẻ Minor nhỏ (04, 05): chỉ sửa chữ, vài phút.

**Thẻ 06 (Minor) trả lời câu BA hỏi về chữ phụ dưới ô A31:**
- Phần sách: sửa trong PR này.
- Phần chữ Desk: UXD làm ở v1.0.5.

Ba thẻ Suggestion (07–09): BA tự cân nhắc. Không có ESC.

---

### FB-R4-UXD-BA-PR72-01
- Mức độ: Major (chỉ sắp lại chữ, không đổi nội dung nghiệp vụ)
- Vị trí: `02` mục 7.4, gạch **Căn chưa sẵn sàng** (dòng 620); sổ tay 2.10, **Trường hợp đặc biệt** (dòng 1071).
- Vấn đề:
  - Ba tình huống dồn vào **một** gạch đầu dòng khoảng 1.700 ký tự. Lên HTML thành 23 dòng ở 1440 px và hơn 50 dòng ở 390 px, không ngắt ý (đã chụp). Ba tình huống đó là: ngoại lệ `VD`/`CL`, bước kiểm căn trước khi xác nhận, và căn còn khách bị chặn (có 3 bước con viết liền "(1)… (2)… (3)…").
  - Ca hay gặp nhất (căn còn đơn khác đang ở, khách cũ đã đi, chỉ cần **Trả phòng** đơn cũ) nằm ở giữa đoạn. Chữ "tới v1.0.3 / từ v1.0.4" lại xen vào giữa.
  - Hai chỗ sách chưa nói, đối chiếu với `CheckInPage.tsx`:
    - (a) Nút **Đổi căn / đổi ngày** trong khung đỏ chỉ mở khung đơn **này** (`/reservations/{id}`), chưa mở hộp đổi căn. Lễ tân phải bấm **Đổi căn / đổi ngày** lần nữa trên khung đơn (mục 6.1 bước 1).
    - (b) Câu có mã đơn chỉ hiện khi máy chủ gửi mã. Không có mã thì Desk hiện `checkin.room_held` ("… còn đơn khác đang ở …"). Khung đỏ cũng không có link tới đơn cũ (thẻ PR77-02, v1.0.5). Sách bảo "mở đơn trước của căn" nhưng chưa nói mở bằng cách nào.
- Vì sao quan trọng: lễ tân đọc đoạn này khi khách mới đứng ở quầy. Phải dò cả đoạn mới thấy việc cần làm, dễ bỏ sót bước kiểm căn hoặc làm theo câu của v1.0.3.
- Đề xuất sửa (cùng chữ ở `02` và sổ tay; giữ nguyên hai ghi chú `<!-- -->`):
  ```
  - **Căn chưa sẵn sàng** (`VD`, `CL`): gửi **Gửi lễ tân trưởng xác nhận** kèm **Lý do**. Lễ tân trưởng tự xác nhận được; buồng chuyển "Có khách, cần dọn" và có việc dọn gấp.
    - Trước khi gửi hoặc xác nhận: kiểm căn (hoặc hỏi buồng phòng) không còn người, không còn đồ của khách, nhất là căn có khách **đổi phòng** hôm nay chưa chuyển xong. Còn người hoặc đồ: không xác nhận; chờ khách chuyển xong, hoặc đổi đơn mới sang căn trống khác.
  - **Căn còn khách: không có ngoại lệ, kể cả lễ tân trưởng.** Gồm căn `OC`, `OD`, và căn còn đơn khác **Đang ở** dù buồng hiện trạng thái nào.
    - Từ v1.0.4: dòng **Buồng sẵn sàng (VI hoặc VC)** hiện khung đỏ, không có ô **Lý do**, chỉ có nút **Đổi căn / đổi ngày**. Nút này mở khung đơn; bấm **Đổi căn / đổi ngày** trên khung đơn (mục 6.1). Tới v1.0.3 Desk vẫn cho gửi xác nhận: đừng gửi.
    - Đọc câu trong khung đỏ, làm theo đúng ca:
      1. "Căn … còn đơn OTM-… đang ở, chưa trả phòng. …" (hoặc "… còn đơn khác đang ở …"): mở đơn đó (gõ mã vào ô tìm ở **Đơn đặt phòng**; câu không có mã thì bấm căn trên **Sơ đồ phòng**).
         - Khách cũ đã đi: kiểm căn rồi **Trả phòng** đơn đó (hay gặp nhất). Đơn đã quá ngày đi thì không có nút **Trả phòng**: làm theo mục 11.1, **Đơn quá ngày đi**.
         - Khách cũ còn ở: giữ hành lý, mời khách mới chờ, hoặc đổi đơn mới sang căn trống.
      2. "Căn … vẫn hiện có khách, nhưng không còn đơn nào đang ở. …": **không** nhận khách vào căn này. Đổi đơn sang căn trống sẵn sàng khác (cùng hạng; không có thì nâng hạng, OTTIMO chịu chênh) và **báo quản lý ngay** … (giữ nguyên phần còn lại của bước (3) hiện tại).
  - **Căn khóa sửa chữa** (`OOO`): không bao giờ nhận phòng được.
  ```
- Trạng thái: Open

### FB-R4-UXD-BA-PR72-02
- Mức độ: Major
- Vị trí: `02` 11.1 **Đơn quá ngày đi**, trường hợp (b) (dòng 888+); sổ tay 2.14 (dòng 1257+); `02` 9.5 bước 2 (dòng 781) và sổ tay 2.12 (dòng 1184), câu "Loại do dòng quyết định".
- Vấn đề:
  - Với dòng tiền phòng, hộp **Miễn phí · …** có ô **Loại** (`foc.kind`) với hai lựa chọn: **Miễn khoản phát sinh (FOC)** và **Giảm giá đặc biệt (tiền phòng)**. Desk **chọn sẵn FOC** (`foc.tsx`: `useState('foc')`, ô **Loại** chỉ hiện khi `line.category === 'room'`). Máy chủ nhận cả hai cho dòng tiền phòng (`foc.service.ts`), lưu thành hai loại dòng khác nhau (`foc` hoặc `discount`).
  - Bước (b) đi qua **Số tiền miễn** → **Lý do miễn phí** → **Gửi duyệt**, không nhắc ô **Loại**. Lễ tân để nguyên thì yêu cầu thành FOC.
  - Tệp `01` mục 14.1 lại bảo chủ đầu tư tìm "Yêu cầu giảm giá đặc biệt 100 % tiền phòng". Hai tệp vì vậy không khớp nhau.
  - 9.5 bước 2 (có từ trước PR này) nói "dòng tiền phòng → giảm giá đặc biệt", như thể Desk tự chọn. Câu này sai so với Desk.
- Vì sao quan trọng:
  - Đêm thêm vì quên bấm Trả phòng sẽ vào báo cáo FOC thay vì giảm giá tiền phòng. Doanh thu phòng và số FOC của tháng lệch.
  - Người duyệt đọc theo tệp `01` thì không thấy đúng loại yêu cầu đã hẹn.
- Đề xuất sửa (DOM xác nhận loại cho ca (b); `01` 14.1 cho thấy ý định là giảm giá đặc biệt):
  - (b): "**Mở form miễn phí / giảm giá** → **Loại**: chọn **Giảm giá đặc biệt (tiền phòng)** (Desk chọn sẵn **Miễn khoản phát sinh (FOC)**, phải đổi) → **Số tiền miễn**: để nguyên số Desk điền (cả dòng) → **Lý do miễn phí**: **Khác (ghi rõ)**, ghi "Quên bấm Trả phòng, khách đi ngày …" → **Gửi duyệt**."
  - 9.5 bước 2 và sổ tay 2.12: "Dòng phát sinh: Desk chỉ có miễn phí (FOC). Dòng tiền phòng: Desk hiện ô **Loại**, chọn sẵn **Miễn khoản phát sinh (FOC)**; giảm tiền phòng thì chọn **Giảm giá đặc biệt (tiền phòng)**."
  - Đổi chọn sẵn của Desk theo loại dòng là việc của v1.0.5 (FE). UXD không đề xuất hotfix: chữ trong sách đủ để lễ tân làm đúng.
- Trạng thái: Open

### FB-R4-UXD-BA-PR72-03
- Mức độ: Major (tiền của khách; DOM xác nhận trước khi BA sửa)
- Vị trí: `02` 9.4 bước 5, gạch đầu (dòng 771), và sổ tay 2.12 **Đổi phòng khi đang ở** (dòng 1167), câu "Nhờ buồng phòng đếm minibar căn cũ. Món đã dùng ghi vào folio ngay bằng **Thêm phát sinh**.". Đối chiếu với khối mới **Khách đã đổi căn giữa kỳ, có 2 tủ minibar** ở 11.1 / 2.14.
- Vấn đề:
  - Khối mới (đúng với `CheckOutPage.tsx` và BR-703-01) nói: lúc trả phòng Desk mở tủ căn cũ trước, lễ tân nhập số đếm, Desk tính tiền tủ đó (`minibar.service.ts` R7 ghi dòng folio theo số đếm).
  - 9.4 vẫn dặn ghi món minibar căn cũ vào folio bằng **Thêm phát sinh** ngay lúc đổi phòng.
  - Theo cả hai chỗ, minibar căn cũ được tính hai lần: dòng **Thêm phát sinh** lúc đổi phòng, và dòng minibar lúc đếm tủ căn cũ khi trả phòng. Ở bản v1.0.3 cũng có hai tủ ở bước Minibar, nên lỗi này có từ bây giờ, không chờ v1.0.4.
  - Bước kiểm "xem bill có khoản minibar của cả hai tủ" chỉ tìm khoản **thiếu**, không tìm khoản **trùng**.
- Vì sao quan trọng: khách trả hai lần cho cùng một món. Lễ tân khó thấy, vì dòng **Thêm phát sinh** và dòng minibar có tên khác nhau.
- Đề xuất sửa (chữ, áp dụng ngay):
  - 9.4 / 2.12: "Nhờ buồng phòng đếm minibar căn cũ và báo số còn lại từng món. Ghi vào sổ giao ca: mã đơn, căn cũ, món × số. **Không** ghi minibar căn cũ bằng **Thêm phát sinh**: lúc trả phòng Desk mở tủ căn cũ trước và tính tiền theo số đếm đó (mục 11.1)."
  - Thêm một gạch vào khối 2 tủ (cả bản v1.0.4 lẫn bản tới v1.0.3): "Folio đã có khoản minibar căn cũ ghi bằng **Thêm phát sinh** lúc đổi phòng: dừng, chưa bấm hoàn tất, báo quản lý để bỏ một trong hai."
  - Nếu DOM muốn giữ cách ghi ngay lúc đổi phòng thì phải nói lúc trả phòng làm gì với tủ căn cũ. Cách đó khó hơn cho lễ tân, UXD không khuyên.
- Trạng thái: Open

### FB-R4-UXD-BA-PR72-04
- Mức độ: Minor (sửa trong PR này)
- Vị trí: `02` 11.1 khối **… 2 tủ minibar – tới v1.0.3** (dòng 864, 865); sổ tay 2.14 (dòng 1234, 1235); khối **từ v1.0.4** (dòng 861; sổ tay 1231).
- Vấn đề:
  - (a) Khối v1.0.3 viết "bấm **Tiếp tục**" hai lần. Ở `v1.0.3` nút này là **Tiếp tục: Phụ phí** (`co.go_extras`). Desk không có nút chỉ ghi "Tiếp tục" ở bước Minibar.
  - (b) "khớp phiếu đếm" (3 chỗ). Sách chưa có "phiếu đếm": buồng phòng báo số bằng lời (`03` mục 7, "Tạm ở v1.0").
- Vì sao quan trọng: lễ tân tìm nút đúng chữ trong sách. "Phiếu đếm" làm lễ tân đi tìm một tờ giấy không có.
- Đề xuất sửa:
  - (a) "bấm **Tiếp tục: Phụ phí**" ở cả hai chỗ.
  - (b) "khớp số buồng phòng báo" (hoặc "khớp số đã ghi ở sổ giao ca", nếu theo thẻ 03).
- Trạng thái: Open

### FB-R4-UXD-BA-PR72-05
- Mức độ: Minor (sửa trong PR này)
- Vị trí: `02` 11.1 (b) và khối minibar v1.0.3 gạch "Lỡ bị đảo"; `02` 5.3 bước 4 (dòng 397); cùng chỗ ở sổ tay.
- Vấn đề:
  - Hai nhãn đậm đứng liền nhau, không có dấu ngăn: "**Khoản** **Đồ ăn uống**", "**Lý do miễn phí** **Khác (ghi rõ)**:". Lên HTML chúng thành một cụm đậm liền, như thể Desk có ô tên "Lý do miễn phí Khác (ghi rõ)" (đã chụp ở 1440 px).
  - `Desk báo "Nhập giá mỗi đêm (lớn hơn 0).".`: thừa một dấu chấm sau ngoặc kép.
- Vì sao quan trọng: sách đang dạy đọc từng nhãn đậm là một chỗ trên Desk. Hai nhãn dính nhau thì phá quy ước đó.
- Đề xuất sửa: theo mẫu đã có ở mục 9.1 / 2.12 ("**Khoản**: …").
  - "**Khoản**: **Đồ ăn uống**"
  - "**Lý do miễn phí**: **Khác (ghi rõ)**, ghi "…""
  - Bỏ dấu chấm sau ngoặc kép.
- Trạng thái: Open

### FB-R4-UXD-BA-PR72-06
- Mức độ: Minor
  - Câu trong sách: sửa trong PR này.
  - Chữ Desk: v1.0.5, UXD cấp khóa, FE làm.
- Vị trí:
  - `02` 5.1 bước 4, gạch **Đơn Nội bộ có cả đêm thu và đêm miễn phí** (dòng 339); sổ tay 2.5 (dòng 854); `01` 14.1 (dòng 865): câu "Dòng chữ nhỏ dưới ô giá nhắc sàn–trần: đêm của đơn Nội bộ không áp, 0 lưu được."
  - Desk: `FolioDialog.tsx`, ô A31, `folio.adjust_night_help`.
- Vấn đề (ý kiến UXD về câu BA hỏi):
  - Chữ phụ dưới ô A31 sai với đêm Nội bộ ở hai chỗ:
    - (1) "Ngoài sàn–trần của nhóm căn thì không lưu được": máy chủ không áp sàn–trần cho đêm Nội bộ (`stay-night-pricing.ts`, nhánh `channel_group !== 'internal'`), và 0 lưu được.
    - (2) "thấp hơn sàn thì xin giảm giá đặc biệt": đây đúng là việc sách **cấm** cho đêm Nội bộ ("Không dùng FOC hay giảm giá đặc biệt 100 %").
  - Ô để trống thì Desk báo "Nhập số tiền lớn hơn 0." (`field_error.amount_not_positive`), trong khi 0 là số đúng.
  - Câu hiện trong sách chỉ nói "nhắc sàn–trần", chưa nói chữ phụ còn chỉ sang giảm giá đặc biệt. Câu cũng chưa theo mẫu sách đã dùng cho chữ sai trên Desk ("Bỏ qua dòng chữ nhỏ … – chữ cũ, đang sửa", ví dụ ở 11.1 bước 5).
- Vì sao quan trọng: người sửa về 0 là quản lý hoặc chủ đầu tư, làm việc này ít khi. Chữ ngay dưới ô bảo "không lưu được" và "xin giảm giá đặc biệt", nên họ dễ dừng lại hoặc làm sai cách.
- Đề xuất sửa:
  - **Sách (PR này)**, cả ba chỗ: "Bỏ qua dòng chữ nhỏ dưới ô giá (nói sàn–trần và xin giảm giá đặc biệt): đêm của đơn Nội bộ không áp sàn–trần, gõ 0 lưu được. Chữ cũ, sửa ở v1.0.5."
  - **Desk (v1.0.5)**: UXD thêm khóa mới `folio.adjust_night_help_internal`, FE hiện khóa này thay `folio.adjust_night_help` khi đêm thuộc đơn kênh Nội bộ (giữ phần `rate.night_now` ghép sau như hiện nay).
    - VI: "Đêm của đơn Nội bộ: không áp sàn–trần. Miễn phí đêm này thì nhập 0 (quản lý, chủ đầu tư)."
    - EN: "Internal stay night: no floor or ceiling. To make this night free, enter 0 (manager or owner)."
    - Cùng điều kiện đó, ô trống báo câu mới `folio.adjust_night_empty_internal`: VI "Nhập giá đêm. Miễn phí thì nhập 0." / EN "Enter the night's rate. Enter 0 if it is free." (thay "Nhập số tiền lớn hơn 0.").
    - FE cần biết kênh của đơn ở dòng folio. ARC xem hợp đồng nếu dòng chưa có thông tin này.
  - Khi v1.0.5 lên thì BA bỏ câu "Bỏ qua dòng chữ nhỏ…".
- Trạng thái: Open

### FB-R4-UXD-BA-PR72-07
- Mức độ: Suggestion
- Vị trí: `02` 11.1 **Đơn quá ngày đi**, trường hợp (b); `02` 5.1 bước 8; cùng chỗ ở sổ tay.
- Vấn đề:
  - (b) là một gạch dài gồm 5 việc theo thứ tự thời gian: xin giảm từng đêm, chờ duyệt, giờ trả, ghi chú giờ trả, sổ giao ca. Việc "chờ có kết quả rồi mới hoàn tất" nằm ở giữa.
  - Luật giá của đơn Nội bộ nằm ở bước 4 (Kênh), nhưng người gõ giá đọc ở bước 8. Bước 8 không chỉ sang bước 4.
- Đề xuất sửa:
  - (b) tách thành bước con 1–4:
    1. Xin giảm từng đêm thêm (theo thẻ 02).
    2. Chờ duyệt; còn chờ thì Desk chưa cho hoàn tất.
    3. **Trả phòng**: giờ trả và ghi chú giờ trả.
    4. Ghi sổ giao ca.
  - Bước 8 thêm một dòng: "Đơn **Nội bộ**: xem bước 4."
- Trạng thái: Open

### FB-R4-UXD-BA-PR72-08
- Mức độ: Suggestion
- Vị trí: `02` 11.1 khối **2 tủ minibar – từ v1.0.4**; sổ tay 2.14.
- Vấn đề: ba thông báo bước Minibar có thể hiện mà sách chưa nói (các khóa có trên `main` từ Round 2):
  - **Số đếm chưa được lưu** (`co.minibar_period_changed_title`): tủ vừa được bổ sung hoặc lượt ở vừa đổi trong lúc đếm.
  - **Folio đã sửa sau lần đếm trước** (`co.minibar_folio_adjusted`): khi **Quay lại**, số hiện theo folio, không phải "lần đếm trước" như sách viết.
  - Lý do đếm lại "Lần đếm trước không phải trong hôm nay" (`co.minibar_recount_body_not_today`): sách chỉ kể "vào lại căn, gia hạn, bổ sung".
- Đề xuất sửa:
  - Gạch **Tủ căn … cần đếm lại**: thêm "hoặc lần đếm trước không phải hôm nay".
  - Gạch **Quay lại**: "số hiện là lần đếm trước (Desk báo **Folio đã sửa sau lần đếm trước** thì số theo folio)".
  - Thêm một gạch: "Desk báo **Số đếm chưa được lưu**: đếm lại tủ đó rồi bấm nút chính lần nữa."
- Trạng thái: Open

### FB-R4-UXD-BA-PR72-09
- Mức độ: Suggestion
- Vị trí: sổ tay, bảng thay đổi dòng **1.13** (ngày 04/11); `00` dòng đầu và bảng dòng **1.11** (ngày 04/11).
- Vấn đề: nội dung thêm ngày 05/11 được gộp vào hai dòng bản ghi ngày 04/11, số bản không đổi. Một bản HTML/in lưu hôm 04/11 và bản sau PR này cùng ghi "1.13" / "1.11".
- Đề xuất sửa: tách phần 05/11 thành bản mới, ghi ngày 05/11: sổ tay **1.14**, bộ hướng dẫn **1.12**. Như vậy quầy và QA biết đang cầm bản nào.
- Trạng thái: Open

---

## Ghi chú cho DOM (ngoài phạm vi UXD, không phải thẻ)

- Ca (b) và `01` 14.1 ghi "quản lý duyệt tới 1 đêm; từ 2 đêm trở lên thì chủ đầu tư duyệt".
- Desk xét hạn mức theo **từng yêu cầu** ("Quản lý ≤ giá 1 đêm/lần"). Mỗi dòng tiền phòng là một yêu cầu riêng, mỗi yêu cầu nhỏ hơn hoặc bằng 1 đêm. Vì vậy quản lý vẫn duyệt được cả hai đêm, Desk không chuyển sang chủ đầu tư.
- Quy tắc "từ 2 đêm" hiện chỉ có trên giấy. DOM chọn một trong hai:
  - nói rõ trong sách: "đơn có từ 2 đêm thêm thì quản lý không duyệt, chuyển chủ đầu tư";
  - hoặc đưa vào backlog v1.0.5.

## Điểm làm tốt

- Nhãn trích khớp từng chữ ở mọi chỗ trọng tâm: khung chặn nhận phòng, 2 tủ minibar, hai câu lỗi Nội bộ của #82, ô A31, cột **Nguồn giá**. Câu có biến đều thay đúng bằng "…" / "OTM-…". Ghi chú `<!-- -->` ghi đủ khóa chuỗi và số PR, nên lần sau soát lại rất nhanh.
- Khối 2 tủ minibar từ v1.0.4 đúng mẫu nên giữ: mỗi gạch là một việc, theo thứ tự trên màn, mở đầu bằng nhãn Desk. Hành vi được viết đúng như mã: mở sẵn tủ căn cũ, nút nêu tên tủ kế tiếp, tủ đã đếm không hiện lại, tự về tủ còn thiếu.
- Tách "tới v1.0.3 / từ v1.0.4" nhất quán ở mọi khối. Sổ tay và `02` cùng chữ (chỉ khác số mục). Giọng văn ngắn, ra lệnh rõ, không đổ lỗi.

## Dòng decision-log đề xuất

```
| 2026-11-05 | 4 | **UXD review PR #72** @ `11794c25` (sổ tay, `00`, `01`, `02`): ĐẠT CÓ ĐIỀU KIỆN. Mọi nhãn và câu trích khớp `strings-vi.json` trên `main` từng chữ (soát máy mọi cụm đậm/ngoặc kép + đọc mã Desk); HTML dựng ĐẠT 390/1440, font nhúng đủ. Trước khi gộp, BA sửa: FB-R4-UXD-BA-PR72-01 (tách 7.4 / sổ tay 2.10 thành từng ca, nói nút **Đổi căn / đổi ngày** mở khung đơn), -02 (ca quên bấm Trả phòng chọn **Loại** **Giảm giá đặc biệt (tiền phòng)** – Desk chọn sẵn FOC; sửa 9.5 bước 2), -03 (đổi phòng không ghi minibar căn cũ bằng **Thêm phát sinh** – tránh tính hai lần với tủ căn cũ lúc trả phòng; DOM xác nhận), -04, -05 (chữ). Suggestion 07–09 BA tự cân nhắc. | UXD | Lễ tân làm theo đúng nhãn trong sách; ba chỗ Major ảnh hưởng thao tác ở quầy, loại dòng trong báo cáo và tiền minibar. |
| 2026-11-05 | 4 | **UXD – chữ phụ ô A31 cho đêm Nội bộ (v1.0.5)**: thêm `folio.adjust_night_help_internal` (VI "Đêm của đơn Nội bộ: không áp sàn–trần. Miễn phí đêm này thì nhập 0 (quản lý, chủ đầu tư)." / EN "Internal stay night: no floor or ceiling. To make this night free, enter 0 (manager or owner).") và `folio.adjust_night_empty_internal` (VI "Nhập giá đêm. Miễn phí thì nhập 0." / EN "Enter the night's rate. Enter 0 if it is free."); FE hiện thay `folio.adjust_night_help` / `field_error.amount_not_positive` khi đêm thuộc đơn kênh Nội bộ. Tới v1.0.5 sách ghi "Bỏ qua dòng chữ nhỏ dưới ô giá…" (FB-R4-UXD-BA-PR72-06). | UXD | `folio.adjust_night_help` nói "ngoài sàn–trần không lưu được, thấp hơn sàn thì xin giảm giá đặc biệt" – sai với đêm Nội bộ và chỉ sang đúng việc sách cấm. |
```
