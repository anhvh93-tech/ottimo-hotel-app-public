# UXD review – FE PR #162 (V5-30, ô "Người chốt" trên khung đơn theo mốc)

- Người review: UXD | Round 5 – bước **Review** | 07/11/2026
- Đối tượng: **#162** `r5-fe-closer-field` @ **`c5cc1f50`**. Chỉ đọc: không đẩy lên nhánh PR, không gộp, không đánh dấu ready. Các tệp: `CloserField.tsx` (mới), `ReservationDrawer.tsx`, `app/problem.ts`, `mocks/stay.ts`, test `v5-30-closer-field-fea.test.tsx`, tệp chữ sinh từ `gen_strings.py`, báo cáo `rounds/round-05/outputs/FE/v5-30-closer-field-fea.md`.
- Đối chiếu:
  - `rounds/round-05/outputs/UXD/copy-v1.0.5.md` mục 9.16 (bản 2.5) và 9.18 (bản 2.6);
  - `product/design/content-guide.md` (dòng `common.cancel`, `common.unsaved_discard`);
  - `00-brief/context/brand/brand-guidelines.md`;
  - DOM `DOM-on-fe-pr-162.md`, SEC `SEC-on-fe-pr-162.md` (cả hai DUYỆT).
- Cách kiểm:
  - đọc mã `CloserField.tsx` (`closerAccess`, `save`, nhánh chỉ đọc, nhánh lỗi) và chỗ gắn trong `ReservationDrawer.tsx`;
  - so 7 khóa 9.16 trong `strings-vi.json`, `strings-en.json` của PR với bảng 9.16 bằng script: **7/7 khớp từng byte, VI và EN**;
  - dựng worktree riêng ở scratchpad từ `refs/pull/162/head`, chạy mock (Vite + MSW) ở cổng 5362. Khung Browser của app không đăng ký được service worker của MSW ("An unknown error occurred when fetching the script", thử cả `localhost` và cổng khác). Vì vậy UXD chụp bằng Chromium không giao diện (Playwright 1.63 có sẵn trong repo) ở **1440 và 390 px, VI và EN**, với `qa.owner`, `qa.mgr`, `qa.fd`. Ảnh chỉ ở scratchpad, **không đưa vào repo**;
  - seed mock chỉ có một đơn có người chốt (giữ chỗ CTV). Để thấy đủ các mốc, UXD thêm **tạm, chỉ trong worktree riêng**, 3 đơn thử ở căn 203: đang ở (Sơn chốt), đã xác nhận kênh CTV với người chốt đã tắt (`qa.locked`), đã xác nhận Sale nội bộ (Sơn chốt). Không đẩy, đã xóa cùng worktree;
  - đo: tràn ngang, font và màu tính được, chiều cao ô và nút, focus sau khi lưu, vùng `aria-live` sau khi lưu.

## 0. Kết luận

**DUYỆT CÓ ĐIỀU KIỆN.** Điều kiện gộp: **162-01** (focus mất sau khi lưu, và không có câu báo đã lưu). Phần còn lại đạt:
- chữ đúng 9.16 từng byte;
- cách hiện theo vai × mốc khớp 9.16 ở mọi ca UXD đo;
- chỉ dùng lớp DS có sẵn; không thêm màu, không thêm cỡ chữ;
- không tràn ngang ở 390 px.

| Thẻ | Mức | Việc | Khi nào |
|---|---|---|---|
| FB-R5-UXD-FE-162-01 | Minor | Sau khi Lưu: trả focus về ô chọn, toast `common.saved` | **Điều kiện gộp #162** |
| FB-R5-UXD-FE-162-02 | Minor | Nút phụ "Hủy" → `common.unsaved_discard` "Bỏ thay đổi" | Nên làm trong #162; không thì trước tag v1.0.5 |
| FB-R5-UXD-FE-162-03 | Minor | Người chốt đang lưu không còn trong danh sách → `mlog.closer_inactive` (G4) | Sau khi #164 gộp: #162 gộp `main` rồi đổi. #162 gộp trước thì làm ở PR FE-A kế tiếp, trước tag |
| FB-R5-UXD-FE-162-04 | Suggestion | Khoảng cách giữa hàng Lưu/Bỏ thay đổi và hàng nút "Tạo link check-in online" | Tùy FE, hoặc v1.0.6 |
| FB-R5-UXD-FE-162-05 | Suggestion | Vai sửa được: hiện tên + nút "Đổi", bấm mới hiện ô chọn | v1.0.6, cần khóa mới |

Chữ đổi theo DOM 162-01 (`rsv.closer.readonly_manager` thêm "hoặc chủ đầu tư"): UXD đồng ý và đã ghi ở `copy-v1.0.5.md` bản 2.7. FE áp trong #162 nếu tiện (chỉ sinh lại chuỗi); không thì v1.0.6, như DOM đề xuất. Không chặn gộp.

## 1. Trả lời giả định của FE (G1–G7)

| Giả định | UXD | Ghi chú |
|---|---|---|
| G1. Ô ở khung đơn, không ở `BookingDialog` | **Đồng ý** | Đúng tiêu đề 9.16 và DOM 154-03. Hộp Đặt phòng mới vẫn giữ ô chọn người chốt lúc tạo đơn (A-06) |
| G2. Nút `common.save` / `common.cancel`, không toast | **Lưu: đồng ý. Hủy: đổi. Toast: cần** | Nút chính "Lưu" đúng. Nút phụ: thẻ 162-02. Toast `common.saved` như các chỗ lưu khác của Desk (`ChangePasswordPage`, `StayDialogs`, `CheckOutPage`, `DocsPanel`): thẻ 162-01. Đổi người chốt làm đổi hoa hồng, nên người làm cần thấy rõ là đã lưu |
| G3. "(Không bắt buộc)" sau nhãn, chữ Stone | **Đồng ý** | Đo được: nhãn Ink 13 px/500, phần ngoặc Stone Grey #6B6760 13 px/500. Desk chưa có mẫu chung cho ô không bắt buộc; khi DS thêm mẫu chung (v1.0.6) thì ô này theo mẫu đó. Không cần sửa ở #162 |
| G4. Người chốt không còn trong danh sách → `mlog.who_unlisted` | **Đổi sang `mlog.closer_inactive`** | Thẻ 162-03. Trên mock, ô chọn của quản lý và dòng chỉ đọc của lễ tân đều hiện "Người không còn trong danh sách" ở chỗ của tên, chữ Ink 500, nên đọc như tên một người. Chữ 9.18 nói đúng tình trạng, và cùng chữ với Nhật ký tiền (#164) |
| G5. Danh sách lỗi → `common.error_generic_title` + `common.retry` | **Đồng ý** | Cùng cách với DOM 159-01 ở #164, nên hai màn nói giống nhau. Không đo được trên mock: MSW trả lời trong service worker nên Playwright không chặn được yêu cầu. UXD đọc mã: tên hiện "Chưa tải được dữ liệu", dưới có nút "Thử lại"; dòng `readonly_*` vẫn hiện |
| G6. Đơn hủy, không đến: chỉ tên | **Đồng ý** | Như DOM 1.3. Không có việc gì cho người đọc làm, nên không cần dòng |
| G7. Dòng chỉ đọc là một `dl` riêng ngay dưới khối thông tin | **Đồng ý** | Trên mock dòng nằm liền "Kênh", cùng cột nhãn và cột giá trị, đọc như một dòng của khối thông tin |

## 2. Kiểm trên mock (`c5cc1f50`)

| Vai | Đơn | Khổ | Kết quả |
|---|---|---|---|
| MGR | Đã xác nhận, Sale nội bộ | 1440 VI | Ô chọn "Người chốt" 6 người (chỉ nhân viên). Chọn Hạnh → ô "Lý do đổi người chốt (Không bắt buộc)", chữ gợi ý, dòng help đủ 2 câu. Nút Lưu (đặc), Hủy (ghost) |
| MGR | cùng đơn, gõ "ab" rồi Lưu | 1440 VI, 390 VI, 1440 EN | "Ghi lý do (ít nhất 3 ký tự)." dưới dòng help, ô viền đỏ. Help vẫn hiện (SEC 1I-03). EN "Add a reason (at least 3 characters)." |
| MGR | Đang ở | 1440 VI, 390 VI | Tên "Sơn" chỉ đọc, dòng `readonly_owner`. Không ô chọn, không nút |
| MGR | Đã xác nhận, CTV, người chốt đã tắt | 1440 VI | Ô chọn chỉ có "Người không còn trong danh sách" và Mai (đúng lọc theo kênh). Thẻ 162-03 |
| MGR | Giữ chỗ CTV (Lê Minh) | 1440 VI | Ô chọn, chỉ Mai. Không có ô lý do ở giữ chỗ |
| FD | Đã xác nhận (Sale nội bộ, và CTV người chốt đã tắt) | 1440 VI, 390 EN | Chỉ đọc, dòng `readonly_manager`. Không nút |
| FD | Đang ở | 1440 VI, 390 EN | Chỉ đọc, dòng `readonly_owner` |
| FD | Giữ chỗ CTV | 1440 VI | Ô chọn (FD+ ở giữ chỗ), không ô lý do |
| OWN | Đang ở, chọn Hạnh | 1440 VI | "Lý do đổi người chốt *" (dấu * của Field), chữ gợi ý, help. Lưu với lý do 21 ký tự → lưu được, ô lý do ẩn. Thẻ 162-01: focus về `body`, không có câu báo |

- Không tràn ngang ở cả 1440 và 390 (scrollWidth = clientWidth).
- Chữ:
  - nhãn: Be Vietnam Pro 13 px/500, Ink #2B2B28;
  - help: 12 px/400, Stone Grey;
  - dòng `li-s`: 13 px/500, Stone Grey;
  - lỗi: 13 px/500, màu `--bad` có sẵn của DS.
- Ô chọn cao 36 px, ô lý do 37–39 px. Nút `sm` cao 32 px, bằng các nút khác trong khung đơn. Đích chạm dưới 40 px ở điện thoại là việc chung của DS (thẻ 145-06), không tính cho PR này.
- Dòng help ở 1440 VI có một từ rơi xuống dòng cuối ("hồng."). Đây cùng loại với FB-R5-UXD-FE-146-01 (`text-wrap: pretty` chưa áp cho `.field .help`), không thêm thẻ.

## 3. Thẻ feedback

### FB-R5-UXD-FE-162-01
- Mức độ: **Minor – điều kiện gộp #162**
- Vị trí: `CloserField.tsx`, `save()`, đoạn sau `onSaved(out.data)` (`selectRef.current?.focus()`).
- Vấn đề:
  - đo trên mock, OWN, đơn đang ở: lưu xong thì `document.activeElement` là `body`, và không có vùng `aria-live` nào báo đã lưu;
  - nguyên nhân có thể: lúc gọi `focus()`, ô chọn vẫn `disabled` vì `write.busy` chưa tắt, nên lệnh focus không có tác dụng;
  - không có toast (G2). Dấu hiệu duy nhất là ô lý do và hai nút biến mất.
- Vì sao quan trọng:
  - người dùng bàn phím, trình đọc màn hình mất chỗ đang đứng trong khung đơn và không biết lệnh đã lưu;
  - đổi người chốt làm đổi hoa hồng, nên người làm cần thấy rõ là đã lưu. Các chỗ lưu khác của Desk đều báo `common.saved`.
- Đề xuất sửa:
  - lưu xong thì toast `common.saved` ("Đã lưu" / "Saved"). Không cần câu mới;
  - trả focus về ô chọn **sau** khi hết bận, ví dụ trong một `useEffect` chạy khi `write.busy` về `false` sau lần lưu thành công;
  - thêm một ca test: sau khi lưu, `document.activeElement` là ô chọn và có toast.
- Trạng thái: Open

### FB-R5-UXD-FE-162-02
- Mức độ: Minor (nên làm trong #162; không thì trước tag v1.0.5)
- Vị trí: `CloserField.tsx`, nút phụ `t('common.cancel')`.
- Vấn đề:
  - ô nằm trong khung đơn. Khung đơn có các nút "Hủy đơn", "Hủy giữ chỗ";
  - nút ghost chữ Earth Brown "Hủy" đứng cạnh "Lưu", dưới tên người chốt. Người đọc lướt dễ hiểu là hủy cái gì đó của đơn. Thật ra nút chỉ đặt lại ô chọn;
  - `content-guide.md` ghi `common.cancel` "Chỉ dùng cho nút đóng form không lưu". Ở đây không có form nào đóng. Thẻ cũ FB-R1-UXR-UXD-12 cũng đã bỏ chữ "Hủy" đứng một mình ở chân form vì dễ nhầm.
- Vì sao quan trọng: trong khung đơn, chữ "Hủy" gắn với việc không làm lại được.
- Đề xuất sửa: dùng khóa có sẵn `common.unsaved_discard` "Bỏ thay đổi" / "Discard". Không cần khóa mới. Đã ghi ở `copy-v1.0.5.md` 9.16 bản 2.7.
- Trạng thái: Open

### FB-R5-UXD-FE-162-03
- Mức độ: Minor (G4)
- Vị trí: `CloserField.tsx`, `nameOf()` và `<option value={current}>{t('mlog.who_unlisted')}</option>`.
- Vấn đề:
  - người chốt đang lưu không có trong danh sách (đã tắt, đã khóa, đã gỡ khỏi cơ sở) thì chỗ của tên hiện "Người không còn trong danh sách";
  - chữ này viết cho ô lọc Người làm của Nhật ký tiền. Đặt ở chỗ của tên thì đọc như tên một người.
- Vì sao quan trọng: cùng một người, Nhật ký tiền (#164) sẽ ghi "Tài khoản hiện không hoạt động", còn khung đơn ghi chữ khác.
- Đề xuất sửa:
  - dùng `mlog.closer_inactive` ("Tài khoản hiện không hoạt động" / "Inactive account") ở dòng chỉ đọc và ở lựa chọn đầu của ô chọn;
  - khóa này do #164 thêm vào `gen_strings.py`. #162 gộp `main` sau khi #164 gộp rồi đổi, không thêm khóa lần hai. #162 gộp trước thì làm ở PR FE-A kế tiếp, trước tag v1.0.5;
  - lý do không ghi "đã khóa": như `copy-v1.0.5.md` 9.18 (D27, danh sách không trả trạng thái khóa).
- Trạng thái: Open

### FB-R5-UXD-FE-162-04
- Mức độ: Suggestion
- Vị trí: `ReservationDrawer.tsx`, giữa `CloserField` và khối "Tạo link check-in online".
- Vấn đề: khi đang đổi người chốt, hàng nút Lưu/Hủy nằm ngay trên hàng nút "Tạo link check-in online", "Thu hồi link". Hai hàng gần nhau, cùng cỡ `sm`, nên đọc như một nhóm nút. Thấy rõ ở 390 px.
- Đề xuất sửa: tách khối người chốt bằng khoảng cách lớn hơn ở dưới (ví dụ thêm `mt-16` cho khối kế tiếp khi form đang mở), hoặc đặt đường kẻ như các khối khác trong khung đơn. Không thêm màu.
- Trạng thái: Open (FE tùy, hoặc v1.0.6)

### FB-R5-UXD-FE-162-05
- Mức độ: Suggestion (v1.0.6)
- Vị trí: `CloserField.tsx`, nhánh `edit`.
- Vấn đề: với vai sửa được, ô chọn luôn mở giữa khối thông tin. Khối `dl` bị cắt: "Kênh" (dl), rồi ô chọn toàn chiều ngang, rồi "Giờ trả" (dl). Vai chỉ đọc lại thấy một dòng `dl` gọn.
- Đề xuất sửa: mọi vai thấy cùng dòng `dl` "Người chốt: Sơn". Vai sửa được có thêm nút nhỏ "Đổi" cạnh tên; bấm thì hiện ô chọn, ô lý do, Lưu/Bỏ thay đổi. Cần một khóa nút mới (UXD viết khi PO xếp v1.0.6).
- Trạng thái: Open (v1.0.6)

## 4. Điểm làm tốt
- 7 khóa đúng từng byte. Không có chữ viết cứng; mọi câu đi qua `t()`.
- Ô lý do chỉ hiện khi đổi người, ngoài giữ chỗ. Chọn lại người cũ thì ô ẩn và chữ đã gõ bị xóa, đúng 9.16.
- Help luôn hiện, kể cả khi có lỗi, và nằm trong `aria-describedby`.
- 403 thì đọc lại đơn trước rồi mới báo, nên dòng `readonly_*` hiện đúng mốc mới.
- Lỗi số thẻ ở ô lý do dùng cặp `FIELD_PAIR` riêng, không hiện câu "Ô ghi chú…".
- Nhãn đổi theo kênh: `bk.closer` cho CTV, `bk.closer_sales` cho Sale nội bộ.

## 5. Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **UXD – review FE PR #162 (V5-30, ô Người chốt trên khung đơn) @ c5cc1f50: DUYỆT CÓ ĐIỀU KIỆN.** 7 khóa 9.16 khớp từng byte VI/EN; mock 1440/390 VI/EN, OWN/MGR/FD (Playwright headless vì khung Browser không chạy được MSW): cách hiện theo vai × mốc đúng 9.16, không tràn ngang, chỉ lớp DS có sẵn. Điều kiện 162-01 Minor: lưu xong focus về body, không báo – toast common.saved, trả focus về ô chọn sau khi hết bận. 162-02 Minor nút phụ "Hủy" → common.unsaved_discard "Bỏ thay đổi" (khung đơn có Hủy đơn). 162-03 Minor G4: người chốt không còn trong danh sách → mlog.closer_inactive sau khi #164 gộp. 162-04, 162-05 Suggestion. G1, G3, G5, G6, G7 đồng ý. Đồng ý DOM 162-01: readonly_manager thêm "hoặc chủ đầu tư" (copy bản 2.7; FE áp nếu tiện, không thì v1.0.6). Không ESC | UXD | rounds/round-05/reviews/UXD-on-fe-pr-162.md |`
