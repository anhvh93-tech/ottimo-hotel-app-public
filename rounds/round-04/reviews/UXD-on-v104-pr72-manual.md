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

---

# Lượt 2 – 05/11/2026

- Đối tượng:
  - `git diff 11794c25..origin/v104/ba-docs-r4c -- product/docs/manual/` @ `e200fea1` (gồm `03-buong-phong.md`);
  - bảng trả lời `rounds/round-04/reviews/BA-reply-v104-pr72.md` (trên nhánh).
- Đối chiếu: `strings-vi.json` trên `main` @ `7265a1fd`, không đổi so với lượt 1; mã Desk trên nhánh.
- Cách soát:
  - Máy soát lại mọi cụm **đậm** và mọi câu trong ngoặc kép ở các dòng mới. Cụm lệch chỉ là chữ nhấn mạnh, tiêu đề ý hoặc câu nhân viên tự ghi ("Trùng minibar tủ căn cũ", "Đã kiểm căn trống lúc …").
  - Đọc mã ở các chỗ sách tả hành vi mới: ô **Loại** trong `foc.tsx`; **Bỏ cả dòng** = `folio.adjust_void` và `canAdjust` (lễ tân trở lên khi folio còn mở) trong `FolioDialog.tsx`; ô tìm `rsv.search_placeholder` "Mã đơn, mã OTA, mã khách hoặc tên"; câu hộp hoàn tất `checkout.complete_confirm_body` có "xóa mã trên app khóa".
  - Dựng lại HTML trong worktree tách ở scratchpad: `rebuild_manual_html.py` ĐẠT; mọi tệp 390 và 1440 px không tràn ngang; font nhúng đủ 5 mặt; HTML không còn `<!--`. Đã chụp 7.4, 11.1 (b) và khối 2 tủ ở 390 và 1440 px. Không commit HTML.

## Kết luận lượt 2: ĐẠT

Thẻ UXD-01…08 đã đóng đúng. Thẻ 09 bị từ chối, UXD đồng ý với lý do. Còn một thẻ Minor mới (PR72-10). Thẻ này không chặn gộp; BA sửa luôn trong #72 hoặc cùng lần gộp #69. Không có ESC.

| Thẻ | Kết quả kiểm |
|---|---|
| 01 | Đóng. 7.4 và sổ tay 2.10 tách đúng khối đề xuất:<br>– ba gạch cấp 1: chưa sẵn sàng, còn khách, `OOO`;<br>– ca 1, ca 2 đánh số theo câu trong khung đỏ.<br>Đã nói nút **Đổi căn / đổi ngày** chỉ mở khung đơn. Đã có cách mở đơn cũ: mã thì gõ ở ô tìm của **Đơn đặt phòng**; không mã thì bấm căn trên **Sơ đồ phòng**. Ở 390 px mỗi ca nằm gọn trong khoảng một màn. Hai câu SEC thêm (**Lý do** ghi giờ và người kiểm; kiểm mã cũ trên app khóa) đặt đúng chỗ. |
| 02 | Đóng. (b) bước con 1 có **Loại**: **Giảm giá đặc biệt (tiền phòng)** và câu "Desk chọn sẵn **Miễn khoản phát sinh (FOC)**, phải đổi", khớp `foc.kind_*`. 9.5 bước 2 / sổ tay 2.12 theo chữ DOM (đêm bù sự cố để FOC, lý do **Bù sự cố**). `01` 14.1 có lối từ chối yêu cầu sai loại. |
| 03 | Đóng, theo chữ DOM. 9.4 bỏ **Thêm phát sinh** cho minibar căn cũ, ghi số vào sổ giao ca. 11.1 nhập số đó ở tủ căn cũ, không đếm lại. Gạch **Kiểm trùng** có ở cả khối v1.0.4 lẫn v1.0.3. `03` mục 7 khớp. Nhãn **Bỏ cả dòng** là phần đầu của `folio.adjust_void` "Bỏ cả dòng (ghi bút toán đảo, không xóa)"; cách trích này giống mọi nhãn ô tích khác trong sách, chấp nhận. |
| 04 | Đóng. Hai chỗ thành **Tiếp tục: Phụ phí**, không còn "phiếu đếm". |
| 05 | Đóng. "**Khoản**: **Đồ ăn uống**", "**Lý do miễn phí**: **Khác (ghi rõ)**, ghi …". Hết dấu chấm thừa. |
| 06 | Đóng phần sách. Câu "Bỏ qua dòng chữ nhỏ dưới ô giá … Chữ cũ, sửa ở v1.0.5." có ở cả ba chỗ. Phần Desk vẫn ở v1.0.5 (dòng decision-log lượt 1). |
| 07 | Đóng. (b) thành 5 bước con có số. Bước 8 có "Đơn **Nội bộ**: xem bước 4." |
| 08 | Đóng. Đủ ba thông báo, tách cách làm cho tủ căn cũ và tủ đang ở. |
| 09 | Rejected, UXD đồng ý: #69 đã giữ số 1.14 / 1.12. Ngày 05/11 đã ghi ở dòng "Lập:" và bảng bản, đủ để phân biệt bản in. |

### FB-R4-UXD-BA-PR72-10
- Mức độ: Minor (không chặn gộp)
- Vị trí: `02` 11.1 bước 1 và gạch **Kiểm trùng, trước khi bấm Trả phòng** ở bước 2; sổ tay 2.14, cùng chỗ.
- Vấn đề:
  - Việc phải làm **trước khi bấm Trả phòng** lại nằm trong bước 2. Bước 2 là bước Minibar của trang **Trả phòng**, tức là lễ tân đã bấm rồi.
  - Lúc đọc tới gạch này, lễ tân phải rời trang (**Về chi tiết đơn**), sửa folio, rồi mở lại **Trả phòng**.
  - Chuỗi thao tác dừng ở **Lý do điều chỉnh**, thiếu nút cuối **Ghi điều chỉnh** (`folio.adjust_submit`). Tệp `01` 14.1 thì có nút này.
- Vì sao quan trọng: khách đứng chờ ở quầy. Biết trước thì kiểm trùng một lần; biết muộn thì phải đi vòng qua hai trang.
- Đề xuất sửa:
  - Bước 1 thêm một câu: "Khách đã đổi căn giữa kỳ: trước khi bấm, mở **Folio** kiểm trùng minibar căn cũ (gạch **Kiểm trùng** ở bước 2)."
  - Trong gạch **Kiểm trùng**, sau **Lý do điều chỉnh** "Trùng minibar tủ căn cũ" thêm "→ **Ghi điều chỉnh**".
- Trạng thái: Open

---

## #85 `v104/ba-esc045-prices` @ `f11e928c` – liếc nhanh trình bày và nhãn

- Phạm vi: `git diff origin/main...f11e928c -- product/docs/manual/` (sổ tay 1.3, 2.12, 5.2; `01` 9.1; `02` 9.2, 20.2; `05` mục 3; `00`).
- HTML dựng ĐẠT: 390 và 1440 px không tràn, kể cả hai bảng 20.2 và 5.2 có ô dài hơn trước.
- Nhãn:
  - **Tham số quy tắc** và tab **Khác** (`params.grp_other`) khớp Desk.
  - `weekend_uplift_pct`, `special_uplift_pct` viết dạng mã. Cách này đúng với Desk, vì hai tham số này chưa có nhãn: `paramLabel` hiện tên khóa thô ở tab **Khác**.
  - Studio 800.000 khớp bảng giá BR (`studio_city`, `studio_garden`).
- Giọng văn ngắn, nhất quán.

**Kết luận #85: ĐẠT CÓ ĐIỀU KIỆN.** Một thẻ Major, hai Minor, một Suggestion. Không có ESC.

### FB-R4-UXD-BA-PR85-01
- Mức độ: Major (cách kiểm không làm được như sách viết)
- Vị trí: `01` 9.1, `02` 20.2, `05` mục 3, sổ tay 1.3 và 5.2: "Báo giá thử Studio 1 đêm thứ Sáu ra khác 800.000 …".
- Vấn đề:
  - Cùng bảng 20.2 ghi **Tối thiểu số đêm: 2 đêm khi ngày đến là thứ Sáu, thứ Bảy, ngày đặc biệt**.
  - Báo giá 1 đêm đến thứ Sáu bị máy chủ từ chối với `MIN_STAY_NOT_MET` (`quote-pricing.ts`), trừ khi gặp đúng ca đêm lẻ. Desk vì vậy báo lỗi chứ không ra số tiền.
  - Người kiểm không có số để so với 800.000. Họ dễ đọc lỗi đó thành "tham số chưa về 0" và báo quản lý không cần thiết.
- Vì sao quan trọng: đây là cách duy nhất sách đưa cho lễ tân, sale và chủ đầu tư để biết ESC-045 đã chạy trên Desk.
- Đề xuất sửa (cùng chữ ở mọi chỗ): "Kiểm nhanh: báo giá thử Studio **2 đêm, đến thứ Sáu** (một ngày không phải ngày đặc biệt). Mỗi đêm phải là 800.000, tổng 1.600.000. Ra số khác: dừng, báo quản lý, không tự sửa giá."
  - Bảng tiền phòng của hộp báo giá vẫn tách dòng "{n} đêm thứ Sáu, thứ Bảy × …". Cùng giá thì vẫn đúng. Xem ý kiến về chuỗi bên dưới.
- Trạng thái: Open

### FB-R4-UXD-BA-PR85-02
- Mức độ: Minor
- Vị trí: `02` 20.2 dòng **Cuối tuần, ngày đặc biệt**; sổ tay 5.2, cùng dòng.
- Vấn đề:
  - Ở v1.0.3, cột **Nguồn giá** của hộp đặt phòng ghi "Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104)" ở **mọi** đêm thứ Sáu, thứ Bảy. Desk chọn nhãn theo thứ trong tuần, không theo tham số (`BookingDialog.tsx` @ `v1.0.3`: `weekend(r.date) ? 'bk.src_weekend' : …`).
  - Chủ đầu tư chuyển giá trước khi v1.0.4 lên thì ô giá ghi 800.000 mà nhãn bên cạnh vẫn ghi +15%.
- Đề xuất sửa: thêm vào dòng đó (không sửa 5.1 bước 8, để khỏi xung đột với #72): "Tới v1.0.3, đêm thứ Sáu, thứ Bảy cột **Nguồn giá** vẫn ghi "Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104)": nhãn cũ. Đọc số trong ô giá. Từ v1.0.4 không còn nhãn này."
- Trạng thái: Open

### FB-R4-UXD-BA-PR85-03
- Mức độ: Minor
- Vị trí: `01` 9.1 / 9.2; sổ tay 1.3.
- Vấn đề:
  - Sách của lễ tân (`02` 9.2) và sale (`05` mục 3) dặn: "Desk hiện 100.000 cho trẻ 6–11 tuổi: báo quản lý".
  - Sách của chủ đầu tư và quản lý (`01`) lại không nói phải sửa tham số nào. Phần tăng giá cuối tuần thì `01` có nêu tên hai tham số.
- Đề xuất sửa: thêm vào `01` 9.1 một gạch: "Phụ thu trẻ 6–11 tuổi (ESC-045): **Tham số quy tắc** → tab **Số người & phụ thu** → **Phụ thu trẻ 6–11 tuổi vượt định mức (mỗi đêm)** = 150.000, cùng ngày chuyển giá. Kiểm nhanh: thêm 1 trẻ 6–11 tuổi vượt định mức, Desk hiện 150.000."
  - Nhãn lấy theo `params.grp_occupancy` và `params.extra_child`.
- Trạng thái: Open

### FB-R4-UXD-BA-PR85-04
- Mức độ: Suggestion (v1.0.5)
- Vị trí: `01` 9.1, sổ tay 1.3 (tên khóa thô `weekend_uplift_pct`, `special_uplift_pct`).
- Đề xuất: khi v1.0.5 có nhãn cho hai tham số này (xem bên dưới), BA đổi tên khóa thô thành nhãn Desk.
- Trạng thái: Open

---

## Ý kiến UXD về `bk.src_weekend` và các chuỗi ghi số cố định

**1. `bk.src_weekend`: không cần sửa trong v1.0.4. Desk v1.0.4 đã không hiện chuỗi này.**
- Trên `main`, `BookingDialog.tsx` chỉ dùng `bk.src_typed`, `bk.src_list` và "–" (UXD-on-v104-src-typed mục 3).
- Test `v104-rate-source-typed` kiểm rằng chuỗi này không hiện. Không còn mã nào khác gọi tới khóa.
- Chuỗi chỉ còn ở ba nơi: `strings-*.json`, `gen_strings.py` / `strings-tables.md` (đã ghi "Không dùng ở Desk từ v1.0.4"), và ảnh mẫu `hifi/09-booking.html`.
- Vì vậy BA thấy "+15%" là đúng với v1.0.3 đang chạy, nhưng v1.0.4 đã sửa.
- Việc v1.0.3: chỉ cần câu trong sách (thẻ PR85-02).
- v1.0.5 (UXD, dọn chữ):
  - xóa `bk.src_weekend` khỏi `gen_strings.py` và sinh lại VI/EN/RU;
  - ảnh mẫu `09-booking.html` đổi ô đó sang `bk.src_list`.
- Nếu sau này chủ đầu tư bật lại mức tăng:
  - nhãn lấy theo nguồn từng đêm máy chủ trả và **số % lấy theo tham số**, không viết số cố định, không đoán theo thứ trong tuần;
  - chỉ hiện khi mức tăng của đêm đó > 0.
  - Chữ dành sẵn (chưa thêm khóa, chưa cần):
    - `bk.src_weekend`: VI "Lịch giá: thứ Sáu, thứ Bảy +{pct}% (BR-104)" / EN "Rate calendar: Friday, Saturday +{pct}% (BR-104)";
    - `bk.src_special`: VI "Lịch giá: ngày đặc biệt +{pct}% (BR-104)" / EN "Rate calendar: special date +{pct}% (BR-104)".

**2. Rà `strings-vi.json` (và EN, RU) tìm số cố định hoặc ý "cuối tuần tăng giá".** Desk v1.0.4 chỉ còn một chuỗi sai nghĩa.

| Khóa | Chữ hiện tại | Ý kiến | Khi nào |
|---|---|---|---|
| `rooms.night_auto` (chữ phụ ô giá đêm ở **Danh mục căn**, `RoomDrawer.tsx`) | VI "Đêm ngày thường, kênh Trực tiếp, đã gồm VAT. Cuối tuần, ngày đặc biệt do lịch giá cộng thêm." / EN "Weekday night, Direct channel, VAT included. The rate calendar adds weekend and special-date increases." | Sai sau ESC-045: chủ đầu tư hoặc quản lý đọc câu này khi sửa giá niêm yết, và sẽ nghĩ cuối tuần vẫn tự tăng. Sửa theo tham số, không ghi số (chữ chốt sau review #87, `UXD-on-v104-pr87-night-auto.md`: EN dùng đúng tên trang **Rule settings**, VI không lặp nhãn ô "Giá đêm"):<br>VI "Mọi đêm, kênh Trực tiếp, đã gồm VAT. Mức tăng cuối tuần, ngày đặc biệt (nếu có) ở Tham số quy tắc."<br>EN "Every night, Direct channel, VAT included. Any weekend or special-date uplift is set in Rule settings." | **Nên vào v1.0.4 nếu kịp cắt 06/11 18:00.** Chỉ sửa chữ: 1 khóa VI/EN trong `gen_strings.py`, sinh lại tệp chữ, không đổi mã. Không kịp thì v1.0.5; không chặn phát hành, vì `01` 9.1 (#85) đã nói đúng. |
| `sale.nights_weekend` / `sale.nights_weekday` (hộp báo giá, `QuoteDialog.tsx`) | "{n} đêm thứ Sáu, thứ Bảy × {rate}" / "{n} đêm thường × {rate}" | Không có số cố định, nên vẫn đúng. Nhưng một giá mọi đêm thì Desk hiện hai dòng cùng giá, thừa một dòng. Mã còn lấy giá đêm đầu tiên của nhóm làm `{rate}`, sai nếu các đêm trong nhóm khác giá; lỗi này có từ trước. Đề xuất v1.0.5 (FE): các đêm cùng giá gộp thành một dòng, khóa mới `sale.nights_all` VI "{n} đêm × {rate}" / EN "{n} nights × {rate}"; khác giá thì tách theo giá, không theo thứ. | v1.0.5 |
| `extend.keep_rate_help` | "… ngày đặc biệt theo giá ngày đó." | Không mã nào gọi tới khóa này. Không hại. | v1.0.5, dọn chữ |
| `params.extra_child`, `occ.children*`, `sale.quote_kids_*`, `webreq.children`, landing `ages6to11` | "Trẻ 6–11 tuổi …" | Đây là **nhóm tuổi** dùng để đếm số người (BR-110), không phải giá. ESC-045 đổi **số tiền** (tham số `child_fee_6_11` = 150.000), không bỏ nhóm tuổi. Giữ nguyên. | – |
| Không có nhãn: `weekend_uplift_pct`, `special_uplift_pct` | (Desk hiện tên khóa thô ở tab **Khác**) | v1.0.5 (UXD + FE): thêm vào `KNOWN` của `paramCatalog.ts`, đơn vị `pct`.<br>`params.k.weekend_uplift_pct`: VI "Tăng giá đêm thứ Sáu, thứ Bảy" / EN "Friday and Saturday rate uplift".<br>`params.k.special_uplift_pct`: VI "Tăng giá ngày đặc biệt" / EN "Special-date rate uplift". | v1.0.5 |

Các chuỗi có `{pct}` (phụ thu nhận sớm, trả muộn, giảm theo số đêm) đều lấy số từ máy chủ, không đổi. Chữ khách (landing, trang khách) không có câu nào nói tăng giá cuối tuần.

## Dòng decision-log đề xuất (lượt 2)

```
| 2026-11-05 | 4 | **UXD lượt 2 PR #72** @ `e200fea1`: ĐẠT. FB-R4-UXD-BA-PR72-01…08 đóng đúng (soát máy nhãn mới với `strings-vi.json` `main` @ `7265a1fd`, đọc mã `foc.tsx` / `FolioDialog.tsx`; HTML dựng ĐẠT 390/1440, font nhúng đủ). Đồng ý BA từ chối -09 (#69 giữ số 1.14 / 1.12). Thẻ mới -10 (Minor, không chặn): kiểm trùng minibar căn cũ đưa lên bước 1 trước khi bấm Trả phòng, thêm **Ghi điều chỉnh**. | UXD | Sách khớp Desk; việc còn lại là thứ tự đọc ở quầy. |
| 2026-11-05 | 4 | **UXD liếc #85** @ `f11e928c` (ESC-045 giá trong sách): ĐẠT CÓ ĐIỀU KIỆN. FB-R4-UXD-BA-PR85-01 Major: "báo giá thử Studio 1 đêm thứ Sáu" bị chặn tối thiểu 2 đêm (`MIN_STAY_NOT_MET`) – đổi thành 2 đêm đến thứ Sáu, tổng 1.600.000. -02 Minor: nhãn v1.0.3 "+15%" ở cột Nguồn giá. -03 Minor: `01` nêu tham số **Phụ thu trẻ 6–11 tuổi vượt định mức (mỗi đêm)** = 150.000. -04 Suggestion v1.0.5. | UXD | Cách kiểm duy nhất sách đưa ra phải chạy được trên Desk. |
| 2026-11-05 | 4 | **UXD – chuỗi giá cố định sau ESC-045**: `bk.src_weekend` không sửa ở v1.0.4 (Desk v1.0.4 không hiện; v1.0.5 xóa khóa, sửa ảnh mẫu `09-booking.html`; nếu bật lại mức tăng thì nhãn theo nguồn từng đêm, số % theo tham số). `rooms.night_auto` đổi thành VI "Mọi đêm, kênh Trực tiếp, đã gồm VAT. Mức tăng cuối tuần, ngày đặc biệt (nếu có) ở Tham số quy tắc." / EN "Every night, Direct channel, VAT included. Any weekend or special-date uplift is set in Rule settings." – vào v1.0.4 nếu kịp cắt 06/11 18:00 (chỉ chữ), không thì v1.0.5. v1.0.5: `sale.nights_all`, `params.k.weekend_uplift_pct`, `params.k.special_uplift_pct`. Giữ nhãn nhóm tuổi "6–11". | UXD | Chữ Desk không được ghi một mức tăng mà tham số không còn áp. |
```
