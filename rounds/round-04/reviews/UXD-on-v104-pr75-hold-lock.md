# UXD review – v1.0.4 PR #75: BUG-R4-041, khóa "Giữ chỗ" khi có giá đã gõ ở H09 (FE-B)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review chéo** | 05/11/2026
- Đối tượng:
  - `gh pr diff 75`, nhánh `v104/fe-hold-typed-rate-lock`, head `9c277c7a`;
  - tệp mã: `pages/booking/BookingDialog.tsx`;
  - test `v104-hold-typed-rate-lock.test.tsx` (5 ca);
  - khóa mới `booking.hold.typed_rate_locked` trong `gen_strings.py`, `strings-vi.json`, `strings-en.json`, `strings-tables.md`, `strings.js`.
- Phạm vi UXD: chữ, vị trí, trạng thái nút, cách trình đọc màn hình đọc, token. Logic `typedRate` và `hold()` do ARC/QA xem.
- Đối chiếu:
  - `00-brief/context/brand/brand-guidelines.md` mục 2, 5, 6;
  - `design-system.md` C1 (dòng 407: disabled = `aria-disabled` + lý do gần nút), mục 2 (dòng 60–61, 124, 142);
  - `packages/ui/src/Button.tsx`;
  - `hifi.css` `.modal-f` (340–341), `.btn[aria-disabled]` (132), `.li-s` (258); `.modal.lg` 720 px;
  - các footer có nút khóa kèm lý do: `CheckOutPage.tsx` 1906–1936, `EarlyDepartureDialog.tsx` 474–503, `ReservationDialogs.tsx` 1181–1199;
  - thẻ UXD trước: `UXD-on-v104-pr70-rate-carryover.md`;
  - điểm 2 và 3 của DOM trong `ARC-on-v104-pr70-rate-carryover.md` (dòng 314–352).
- Cách kiểm:
  - đọc mã bằng `git show 9c277c7a:…`, không checkout;
  - dựng một trang tĩnh trong scratchpad, dùng `tokens.css` và `hifi.css` của nhánh, chỉ có phần footer. Đo ở 1366×768: chiều cao footer và hàng của từng phần tử;
  - **không chạy test**, vì máy tải nặng và UXD không đổi mã. FE báo 5/5 xanh, trong đó 4 ca đỏ trên `main`.

## Kết luận: ĐẠT CÓ ĐK

Cơ chế khóa đúng hướng. Desk không còn lặng lẽ bỏ giá đã gõ. Nút khóa có câu nói vì sao, và "Tạo đơn" vẫn là lối ra.

**Điều kiện (1 thẻ Major, FB-01):** FE đổi chữ của `booking.hold.typed_rate_locked` sang bản dưới đây. Việc này chỉ sửa 1 dòng trong `gen_strings.py` rồi sinh lại strings. Test dùng `tv()` nên không phải sửa test.

Hai thẻ Minor (FB-02, FB-03): mỗi thẻ chỉ đổi 1–2 dòng mã. UXD khuyến nghị làm luôn trong lượt sửa chữ. Nếu không kịp thì dời v1.0.5, không chặn gộp.

Không có ESC.

| Điểm ORC hỏi | Kết quả |
|---|---|
| 1. Chữ VI/EN | **Cần sửa (FB-01).** Câu ngắn, điềm tĩnh, không emoji, và nói đủ hai lối: đã nhận cọc thì Tạo đơn, chưa nhận thì xóa giá đã gõ rồi giữ chỗ. Còn hai chỗ chưa ổn. (a) VI dùng "số đã gõ" ở câu 3, trong khi câu 2 và cả bộ `booking.rates_cleared_*` dùng "giá đã gõ". EN cũng lệch: "your typed rates" ở câu 2, "the typed rates" ở câu 3. (b) Lối "chưa nhận cọc" dừng ở "giữ chỗ". Lễ tân làm đúng theo màn hình thì giá thỏa thuận mất hẳn: xem điểm 3 |
| 2. Vị trí, trạng thái, trình đọc màn hình | **Dùng được cho bản sửa.** Hai chỗ nên chỉnh. (a) Nút dùng `disabled` gốc của HTML. DS C1 quy định `aria-disabled` kèm lý do gần nút, và các footer Nhận phòng, Trả phòng, Rời sớm, Đổi căn đều làm vậy. Với `disabled` gốc, phím Tab bỏ qua nút, nên người dùng trình đọc màn hình đi Tab không bao giờ nghe được câu lý do (FB-02). (b) Câu dài hơn chỗ trống trong footer, nên footer vỡ thành 3 hàng và "Đóng (giữ nháp)" nằm riêng một hàng trên cùng (FB-03). Phần đúng: không `aria-busy`; `aria-describedby` trỏ đúng dòng (test kiểm `toHaveAccessibleDescription`); dòng chỉ hiện khi có nút Giữ chỗ (Trực tiếp/CTV, đến từ mai, có mạng); không thêm vùng live, giống các footer khác |
| 3. Có trỏ tới cách làm tạm của DOM không | **Có, một vế ngắn.** Câu hiện tại bảo lễ tân xóa giá thỏa thuận rồi giữ chỗ, mà không nói giá đó lấy lại ở đâu. Theo điểm 3 của DOM, đơn chỉ về đúng giá thỏa thuận nếu lễ tân **Điều chỉnh** ở Folio sau khi xác nhận cọc. Thiếu vế này thì sai tiền vẫn xảy ra, chỉ là lễ tân không còn bị "lặng lẽ" bỏ giá. Chỉ thêm vế Folio. Các bước khác (ghi sổ giao ca, báo khách đúng số cọc Desk hiện, giá dưới sàn) để ở sổ tay 2.5 bước 10 (BA, PR #72) |
| 4. Token, brand | **Đạt, không lệch mới.** PR không thêm màu, lớp CSS hay `style=`. Dòng `li-s`: Be Vietnam Pro 13 px, `--muted` = Stone Grey #6B6760 trên `--surface` #FBF9F4, 5,34:1 sáng / 6,33:1 tối, đạt AA (DS dòng 142). Nút khóa theo DS dòng 124: nền Cream #EDE6D8, chữ Stone, viền đứt `--line-strong`, không dùng `opacity`. Lệch guideline duy nhất là `--surface` #FBF9F4 (Ivory pha trắng 50 %). Đây là ngoại lệ đã ghi ở DS dòng 60, có từ trước, không do PR này |
| Nhóm khóa | **Đúng ghi chú ở thẻ PR70.** Khóa nằm trong **cùng một** nhóm `g("v1.0.4 booking – FE-B: …")` với hai khóa `rates_cleared_*`, không tạo nhóm trùng tên. Đã sinh lại 4 tệp, mỗi tệp thêm đúng 1 dòng. Cột RU "⟨chừa chỗ⟩" chấp nhận được, vì Desk chỉ có VI/EN |

---

### FB-R4-UXD-FE-PR75-01
- Mức độ: **Major** (điều kiện của ĐẠT CÓ ĐK)
- Vị trí: `product/design/tools/gen_strings.py`, dòng `booking.hold.typed_rate_locked`, nhóm "v1.0.4 booking – FE-B: …" (diff dòng 4138).
- Vấn đề:
  - Câu 3 của VI dùng "xóa **số** đã gõ". Câu 2 cùng câu và hai câu `booking.rates_cleared_*` đều dùng "**giá** đã gõ". Lễ tân đọc hai cách gọi cho cùng một thứ trên cùng hộp. EN lệch tương tự: "your typed rates" ở câu 2, "the typed rates" ở câu 3, còn `rates_cleared_*` dùng "Typed rates".
  - Lối "chưa nhận cọc" dừng ở "rồi giữ chỗ". Theo DOM điểm 3, giữ chỗ chỉ có giá niêm yết. Đơn chỉ về đúng giá thỏa thuận khi lễ tân xác nhận cọc xong rồi **Điều chỉnh** dòng tiền phòng ở Folio. Màn hình bảo lễ tân xóa giá thỏa thuận mà không nói phải lấy lại ở đâu.
  - EN "If the deposit is in" hơi suồng sã. Nhãn Desk là "Confirm deposit received" (`drawer.action.confirm_deposit`).
  - PR ghi câu là bản UXD cấp 04/11. Bản đó chưa tính tới điểm 3 của DOM, nên UXD sửa lại.
- Vì sao quan trọng:
  - Lỗi gốc là sai tiền với khách. Nếu lễ tân làm đúng theo câu trên màn hình, khách vẫn bị tính giá niêm yết khi nhận phòng, cao hơn giá đã báo.
  - Khóa tạm chỉ đổi lỗi "lặng lẽ" thành lỗi "đã báo". Muốn hạ BUG-R4-041 xuống P2 thì câu phải dẫn tới kết quả đúng.
- Đề xuất sửa: FE thay **đúng một dòng** trong `gen_strings.py`, chạy `python3 -I product/design/tools/gen_strings.py`, rồi kiểm lần chạy thứ hai không đổi gì.

  | | Chữ |
  |---|---|
  | VI | Giữ chỗ chỉ theo giá niêm yết. Đã nhận cọc thì bấm Tạo đơn để lưu giá đã gõ. Chưa nhận cọc thì xóa giá đã gõ rồi giữ chỗ, xác nhận cọc xong thì Điều chỉnh giá ở Folio. |
  | EN | Holds use the list price only. If the deposit is received, use Create booking to keep the typed rates. If not, clear them and hold, then adjust the rates in the Folio after confirming the deposit. |
  | Ghi chú | v1.0.4 booking (FB-R4-UXD-FE-PR75-01). Dòng li-s trong footer H09, là aria-describedby của nút Giữ chỗ. Tên nút khớp booking.create và folio.adjust; Folio là drawer.folio.title. Cách làm tạm: DOM điểm 3, sổ tay 2.5 bước 10. Bỏ khi Q1 nhận giá thỏa thuận (v1.0.5) |

  - Hai câu đầu giữ nguyên, nên câu BA trích ở sổ tay vẫn khớp. Chỉ đổi "số" thành "giá" và thêm một vế.
  - Độ dài: VI 167 ký tự, EN 196 ký tự. Trong footer 684 px (hộp `lg`), cả hai câu nằm gọn trong 2 dòng (đo ở mock).
  - "Điều chỉnh" viết hoa vì là tên nút (`folio.adjust`), giống "Tạo đơn". EN viết thường "adjust", vì nút "Adjust" tự rõ nghĩa.
  - BA: nếu sổ tay 2.5 bước 10 trích nguyên câu này thì cập nhật theo bản mới.
- Trạng thái: Open

### FB-R4-UXD-FE-PR75-02
- Mức độ: Minor (khuyến nghị làm cùng FB-01; nếu không thì v1.0.5)
- Vị trí: `BookingDialog.tsx`, footer, nút Giữ chỗ: `disabled={busy !== null || longStay || typedRate}` (dòng 908 ở `9c277c7a`).
- Vấn đề:
  - DS C1 (dòng 407) quy định nút disabled dùng `aria-disabled` kèm lý do gần nút. Khi đó nút vẫn nhận focus, và trình đọc màn hình đọc câu `aria-describedby` lúc nút được focus.
  - PR dùng `disabled` gốc (qua prop `disabled` của `Button`). Phím Tab đi thẳng từ "Đóng (giữ nháp)" sang "Tạo đơn". Người dùng trình đọc màn hình đi bằng Tab không nghe câu lý do, và không biết nút Giữ chỗ còn đó.
  - Desk đang có hai cách làm. Các footer có câu lý do (Nhận phòng, Trả phòng, Rời sớm, Đổi căn) dùng `aria-disabled`. Một số chỗ cũ (thêm khách ở `StayDialogs`, từ chối yêu cầu web) dùng `disabled`. PR nói "theo DS C1", nhưng C1 là `aria-disabled`.
- Vì sao quan trọng:
  - Nhẹ với lễ tân nhìn màn hình, vì câu vẫn hiện ngay cạnh nút.
  - Nhưng đây là mẫu DS và mẫu chung của các footer có lý do. Giữ một mẫu thì lần sau FE không phải chọn.
- Đề xuất sửa (FE, 2 dòng mã và vài dòng test):
  - `disabled={busy !== null || longStay}` và `aria-disabled={typedRate || undefined}`. Giữ `aria-describedby` như hiện tại.
  - `hold()` đã dừng sớm khi `typedRate`, nên bấm nút lúc khóa không làm gì. Đây là đúng mẫu `CheckOutPage` 1932–1936.
  - CSS sẵn có: `hifi.css` 132 tô `[aria-disabled="true"]` giống hệt `[disabled]`. Hover cũng không đổi, vì `.btn:hover` cùng nền Cream. Không thêm CSS.
  - Test: ở 3 chỗ, đổi `toBeDisabled()` / `toBeEnabled()` thành kiểm `aria-disabled`. Thêm 1 lệnh: bấm nút lúc khóa thì không có POST `create-hold`.
- Trạng thái: Open

### FB-R4-UXD-FE-PR75-03
- Mức độ: Minor (khuyến nghị làm cùng FB-01; nếu không thì v1.0.5)
- Vị trí: `BookingDialog.tsx`, footer của `Modal` (từ dòng 894 ở `9c277c7a`). `span.li-s` đứng sau "Đóng (giữ nháp)" và trước nút Giữ chỗ.
- Vấn đề:
  - Phần nội dung của `.modal-f` rộng 684 px (hộp `lg` 720 px trừ lề). Footer là flex xuống dòng.
  - Câu dài hơn mọi chỗ trống trong hàng, nên bị đẩy xuống hàng riêng. Đo ở mock 1366×768 với CSS của nhánh:
    - footer cao **152 px**, chia **3 hàng**;
    - hàng 1 chỉ có "Đóng (giữ nháp)";
    - hàng 2 là câu, 2 dòng;
    - hàng 3 là [Giữ chỗ đến …] [Tạo đơn].
  - Bố cục quen của footer bị phá: "Đóng" bên trái, nút việc bên phải, trên cùng một hàng. "Đóng (giữ nháp)" lơ lửng phía trên câu.
- Vì sao quan trọng:
  - Không sai tiền. Nhưng mỗi lần lễ tân gõ giá, footer nhảy từ 1 hàng lên 3 hàng.
  - Nút "Đóng" tách khỏi các nút còn lại dễ làm lễ tân bấm nhầm, hoặc phải tìm lại nút.
- Đề xuất sửa (FE, chỉ chuyển 1 khối JSX, không thêm CSS):
  - Đưa `span.li-s` lên **đầu** footer, trước nút "Đóng (giữ nháp)". Giữ nguyên điều kiện hiện (`directLike && form.arrivalDate > today && online && typedRate`).
  - Đo ở mock: câu tự chiếm hàng 1 và dàn hết chiều rộng. Hàng 2 là "Đóng" bên trái, [Giữ chỗ] [Tạo đơn] bên phải. Footer còn **108 px**, đúng **2 hàng**, với cả câu VI và EN mới của FB-01.
  - Thứ tự đọc thành: câu lý do, rồi Đóng, Giữ chỗ, Tạo đơn. Đổi căn (`ReservationDialogs` 1181–1186) cũng đặt câu lý do đầu footer.
  - Nếu sau này câu ngắn đi và lọt vào hàng 1 cạnh nút, UXD sẽ thêm lớp `.modal-f > .foot-why{flex-basis:100%}` vào `hifi.css`. Hiện chưa cần.
- Trạng thái: Open

---

## Ghi chú, không phải thẻ
- Khóa bật cả khi giá lễ tân gõ **bằng** giá niêm yết (`ratesEdited` + có số). Lễ tân sẽ thấy câu "chỉ theo giá niêm yết" trong khi số đã đúng giá niêm yết. Ca này hiếm, và lễ tân xóa ô là xong. Nếu QA gặp trên STG thì ARC/FE cân nhắc so với giá của bản xem. Không cần đổi chữ.
- Lối "xóa giá đã gõ" để ô **trống**, không điền lại giá niêm yết. Ở v1.0.4 chấp nhận được: giữ chỗ không dùng ô, và hộp giữ chỗ sau khi tạo hiện đúng số cọc. v1.0.5 bỏ khóa khi Q1 nhận giá thỏa thuận, nên không cần nút "Về giá niêm yết".
- `useId` sinh id dạng `:r1:`, hợp lệ cho `aria-describedby`. Test đã kiểm mô tả truy cập.

## Điểm nên giữ
- Điều kiện khóa dùng đúng phép thử của #70 (`ratesEdited[d] && rates[d]`, chỉ các đêm của lượt ở). Câu khóa và câu `rates_cleared_*` vì vậy luôn nói về cùng một tập "giá đã gõ". Test 4 chứng minh đêm nằm ngoài lượt ở không khóa.
- Có hai lớp chặn: nút khóa, và `hold()` tự dừng. `hold()` còn bỏ qua lỗi ô giá. Nhờ vậy lối "xóa rồi giữ chỗ" không bị câu "Nhập giá mỗi đêm" của #70 chặn (test 2).
- Nút "Tạo đơn" vẫn mở và lưu đúng `edited:true` với cọc 30 % theo giá đã gõ (test 3). Đây là ca chặn tái phát xanh ở cả hai bản. Không thêm màu, CSS hay `style=`; khóa chữ vào đúng nhóm.
