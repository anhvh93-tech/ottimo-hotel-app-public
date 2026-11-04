# UXD review – v1.0.4 PR #67: BUG-R4-035, lỗi race khi điền sẵn minibar ở H16 (FE-A)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** (nhanh) | 04/11/2026
- Đối tượng: `git diff origin/main...5f3649f1 -- product/apps/admin-web/src/pages/stay/CheckOutPage.tsx`.
- Phạm vi UXD: chỉ trạng thái busy của nút **Tiếp tục: Phụ phí** khi đang đọc `minibar-standard`. Phần logic điền sẵn (`minibarPrefill`, `edits` gắn với lần đọc) do ARC/QA xem.
- Đối chiếu:
  - `Button` trong `packages/ui/src/Button.tsx`;
  - `useResource` (giữ `data` cũ khi đọc lại);
  - `design-system.md` dòng 558, trạng thái **Đang tải**.
- Không xem ảnh, theo yêu cầu.

## Kết luận: ĐẠT

| Điểm | Kết quả |
|---|---|
| Đúng mẫu busy của DS | **Đúng.** Dùng `busy` và `busyLabel` của `Button`. Nút tự khóa (`disabled`), có `aria-busy`, hiện spinner `.spin` thay icon. Không thêm lớp CSS, không thêm màu, không `style=`. Khi đang lưu (`minibarAct.busy`) vẫn dùng nhãn cũ của thao tác lưu, nên hai trạng thái không lẫn nhau |
| Nhãn | **Đổi chữ là đúng, giữ `common.loading` ("Đang tải…" / "Loading…").** DS 558 quy định "nút đang xử lý đổi chữ". Nếu giữ "Tiếp tục: Phụ phí" kèm spinner, người dùng sẽ hiểu là đang chuyển bước, trong khi thật ra trang chưa có số tủ để gửi. "Đang tải…" nói đúng việc đang diễn ra. Nút ngắn lại một chút trong lúc chờ (chân trang canh phải). Mọi nút "Đang lưu…" của DS cũng vậy, nên chấp nhận được. Không cần khóa mới |
| Brand | Đạt. Chỉ dùng component DS. Chữ có trong bảng strings |

Một thẻ Minor, không chặn gộp, có thể dời sang v1.0.5. Không có ESC.

---

### FB-R4-UXD-FE-PR67-01
- Mức độ: Minor
- Vị trí: `CheckOutPage.tsx`, khối đếm minibar. Lần đầu không có dữ liệu thì hiện `LoadingBlock` (dòng khoảng 1106–1110). Khi **đọc lại** (`stdLoading` với `std.state.data` cũ) thì danh sách vẫn là của lần đọc trước. Có 2 nút liên quan: các ô tăng giảm (`editLeft`) và nút `checkout.minibar.all_full`.
- Vấn đề:
  - `useResource` giữ `data` cũ trong lúc đọc lại. Ví dụ: đổi tủ sau B14, đổi kỳ, hoặc đọc lại sau lỗi.
  - Trong lúc đó nút Tiếp tục đã chuyển sang "Đang tải…". Nhưng danh sách tủ **cũ** vẫn hiện, và các ô tăng giảm cùng nút "Tất cả còn đủ" vẫn bấm được.
  - Số người dùng sửa trong lúc này gắn với lần đọc cũ. Theo đúng cách sửa của PR, khi dữ liệu mới về thì các số đó bị bỏ, mà không có thông báo nào.
- Vì sao quan trọng: không sai tiền, vì PR đã chặn gửi số của tủ này cho tủ kia. Nhưng lễ tân có thể vừa đếm xong thì thấy số tự trở về như cũ. Màn hình nói "đang tải" ở nút, trong khi danh sách trông như đã sẵn sàng.
- Đề xuất sửa (FE-A, v1.0.5 hoặc cùng PR nếu còn giờ):
  - Khi `stdLoading`, khóa các ô tăng giảm và nút "Tất cả còn đủ".
  - Đặt `aria-busy="true"` cho khối danh sách. Tùy chọn: làm mờ danh sách bằng lớp có sẵn của DS cho trạng thái đang tải.
  - Không cần khóa chữ mới, vì nút Tiếp tục đã nói "Đang tải…".
  - Lần đọc đầu giữ `LoadingBlock` như hiện tại.
- Trạng thái: Open

## Điểm nên giữ
- Nút khóa đúng lúc trang chưa có gì để gửi, nên không còn ca bấm Tiếp tục và gửi tủ đầy ("không dùng gì").
- Phân biệt busy của việc đọc và busy của việc lưu: mỗi việc có nhãn riêng, không có nhãn nào bị ghi đè.

---

## Review lại @ d34c6104 (04/11/2026)

- Đối tượng: `git diff 5f3649f1..d34c6104 -- product/packages/ui product/apps/admin-web/src/pages/stay/CheckOutPage.tsx`. Đọc kèm CSS DS của `.stepper` (`product/design/hifi/assets/hifi.css` dòng 174–178).

### Kết luận: ĐẠT. Đóng thẻ FB-R4-UXD-FE-PR67-01

**`Stepper` prop `disabled` (DS dùng chung, `Controls.tsx`)**
- Prop chỉ thêm, có thể bỏ trống. Mặc định không đổi, nên các chỗ đang dùng `Stepper` không bị ảnh hưởng.
- Khi bật, prop khóa **cả hai** nút bằng thuộc tính `disabled` gốc của `<button>`. Đây cũng là cơ chế đang khóa nút ở biên `min`/`max`, nên trạng thái khóa dùng lại đúng mẫu disabled sẵn có của C4:
  - `.stepper button:disabled { color: var(--muted); cursor: not-allowed }`;
  - `--muted` là token Stone Grey trong bảng brand. Không thêm màu, không thêm lớp, không thêm `style=`.
- Về a11y, `disabled` gốc tự báo trạng thái khóa cho trình đọc màn hình. Nhãn `decLabel`/`incLabel` và `role="group"` giữ nguyên.
- Có test riêng trong `ui.test.tsx`: khóa cả khi giá trị nằm giữa biên.
- Ghi chú nhỏ, không cần sửa: số ở giữa (`output`) vẫn màu Ink khi hai nút khóa. Chấp nhận được, vì khối danh sách đã có `aria-busy`, và nút chính bên dưới đang nói "Đang tải…". Không cần làm mờ thêm.

**Thẻ PR67-01 trong `CheckOutPage.tsx`**
- Đọc lại tủ, gồm cả khung hình chuyển tủ mà ARC nêu ở PR67-01: điều kiện `stdForCabinet` giờ kiểm cả `roomId`.
  - Khối `table-wrap` có `aria-busy`.
  - Các `Stepper` và nút "Tất cả còn đủ" (`.btn[disabled]` của DS) đều khóa.
  - `saveMinibar` dừng sớm.
  - Số không còn bị sửa rồi mất mà không báo.
- Đọc lỗi: hiện `ErrorBlock` với "Thử lại", kể cả khi còn dữ liệu cũ. Nút Tiếp tục khóa thường, không ở trạng thái busy, nên không có spinner chạy mãi. UXD đồng ý.
- Lần đọc đầu giữ `LoadingBlock`.
- Brand đạt. Không khóa mới, không màu mới.

Không còn thẻ mở của UXD trên PR #67. Không có ESC.
