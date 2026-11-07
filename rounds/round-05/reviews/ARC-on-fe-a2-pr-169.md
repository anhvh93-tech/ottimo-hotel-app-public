# ARC review PR #169 (FE-A2) – V5-12, BUG-R4-052: "Tổng cộng" ở bước Bill khi trả phòng

- Round 5 (v1.0.5), bước **Review** kỹ thuật, bản ngắn. Người review: ARC. Ngày 07/11/2026.
- PR: [#169](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/169), head **`d8712188`**, `base = main`.
  - Mã đổi: một hằng `billTotalVnd` trong `CheckOutPage.tsx` và một chỗ hiện `money(billTotalVnd)`.
  - Test mới `v5-12-bill-total-fea.test.tsx`, 7 ca.
  - Máy chủ và `openapi.yaml` không đổi.
- Đối chiếu:
  - `architecture.md` ("client không tự tính số chính thức");
  - `checkout.service.ts` (`dueAtCheckout`, `extraNightDelta`);
  - BR-107, BR-110, BR-416, ESC-031;
  - DOM `DOM-on-fe-a2-pr-169.md` (DUYỆT, thẻ 169-01, 169-02).
- Cách kiểm:
  - ref riêng, worktree tạm `arc-wt169` ở scratchpad, gộp thử với `main` @ `da4e5604`;
  - đã xóa worktree và ref sau review;
  - không dữ liệu khách, không số hoa hồng.
- CI của `d8712188` lúc viết: contract, Redocly, gitleaks, shellcheck, landing đều xanh. `format · lint · audit · test · build` còn đang chạy.

## 0. Kết luận

**DUYỆT** – gộp khi CI xanh. Thêm 2 thẻ: 169-03 (Minor, v1.0.6) và 169-04 (Suggestion). Không ESC.

- **Thiết kế đúng cho v1.0.5.** "Tổng cộng" là tổng các dòng bảng đang hiện. Đây là số xem trước, không phải số chính thức.
  - Số chính thức vẫn của máy chủ: "Còn phải thu", trần QR `check_out`, trần `finalPayment` và phiếu in lúc hoàn tất.
  - Vì vậy PR không trái luật `architecture.md`.
  - Lấy tổng từ máy chủ thì đúng hơn, nhưng hợp đồng chưa có trường này. Việc đó để v1.0.6 (mục 2).
- **Câu bậc BR-107:** ARC đồng ý với DOM. Chấp nhận ở v1.0.5, vì `los_discount = []`. Ca còn xảy ra được là mã khách quay lại: màn hiện cao hơn, lệch có lợi cho khách.
- **ARC tìm thêm một chỗ lệch còn xảy ra thật, theo chiều ngược lại** (thẻ 169-03, mục 2):
  - Đêm thêm của B18 mang phụ thu người BR-110 khi căn có người vượt định mức.
  - "Còn phải thu" có phụ thu này. Bảng và "Tổng cộng" không có.
  - Lỗi này có trước PR. PR không làm nó nặng thêm.

## 1. Gộp thử, test, đột biến

- `main` @ `da4e5604` + #169: git tự gộp. `gen_strings.py` không lệch, `tsc` sạch.
- Admin-web **100 tệp / 1107 ca xanh**.
- Đột biến ARC trên `billTotalVnd`, chạy tệp test của PR (7 ca):

| Mã | Đột biến | Kết quả |
|---|---|---|
| A1 | Bỏ đêm thêm | **Đỏ** (2 ca) |
| A2 | Bỏ phụ thu trả muộn đổi theo giờ (`lateDelta`) | **Đỏ** |
| A3 | Phụ thu 1 đêm không trừ phần miễn gửi kèm | **Đỏ** |
| A4 | Đêm thêm lấy giá mặc định thay vì giá ở ô | **Đỏ** |
| A5 | Cắt `lateDelta` âm về 0 (B15 bị đảo) | **Đỏ** |
| A6 | Tổng = Đã thu + "Còn phải thu" của máy chủ | **Xanh** |
| A7 | Như A6 khi còn phải thu > 0, ngược lại dùng tổng các dòng | **Xanh** |

- A1–A5 cho thấy các ca test bắt đủ từng phần của tổng.
- A6 và A7 xanh vì mock trả "Còn phải thu" đúng bằng tổng các dòng trừ Đã thu, và không có ca nào khách trả thừa.
  - Trên dữ liệu thật, A6 sai khi khách trả thừa: "Còn phải thu" dừng ở 0, nên tổng bị cắt.
  - Bảng đối chiếu của DOM (mục 3, dòng "Khách trả thừa") nói tổng **không** bị cắt, nhưng chưa có ca test nào giữ điều này. Xem thẻ 169-04.

## 2. Thẻ

### FB-R5-ARC-FE-169-03 – Minor – BE + FE-A2 + DOM, v1.0.6 (gộp với DOM 169-01)

- **Hiện trạng.**
  - `extraNightDelta` của máy chủ cộng phụ thu người BR-110 của đêm thêm: `addedNightFee`, 150.000/đêm cho mỗi người vượt định mức.
  - Desk có một dòng đêm thêm bằng giá ở ô, không có dòng phụ thu người. `billTotalVnd` cũng không có.
- **Ca xảy ra được ở OTTIMO.** Studio có 3 người (định mức 2), trả sau giờ cuối, có đêm thêm.
  - "Còn phải thu" = tổng các dòng trừ Đã thu, cộng thêm 150.000.
  - Màn hiện tổng **thấp hơn** số khách thật sự trả. Chiều này bất lợi cho khách, ngược với ca mã khách quay lại DOM đã duyệt.
  - Ca này cũng xảy ra với 302 và 402 khi có 4 người.
- **Không thu sai.** Số thu, các trần thu và phiếu in đều là số máy chủ, đã gồm phụ thu. Lỗi chỉ nằm ở bảng và tổng xem trước.
- Phần bù FOC chia lại theo đêm mới (S4-38, `previewStayReductions`) cũng vào "Còn phải thu" mà không có dòng. Ca này hiếm.
- **Đề xuất (hợp đồng 0.3.14, v1.0.6), làm cùng DOM 169-01.** `CheckoutSummary` trả phần xem trước của đêm thêm, theo giá đang gõ:
  - `extraNightPreview { roomVnd, extraPersonVnd, focDeltaVnd }`: giá đêm đã tính bậc và mã, phụ thu người, phần bù FOC;
  - `projectedTotalVnd`: tổng folio sau B18.
  - Desk hiện từng dòng từ đó và hiện `projectedTotalVnd` làm "Tổng cộng". Khi đó Tổng cộng − Đã thu = Còn phải thu là điều máy chủ bảo đảm.
  - Trường mới phải xong trước khi bật lại `los_discount`, như DOM 169-01 nói.
- **Tới khi đó.** Sổ tay thu đúng "Còn phải thu" (DOM 169-02) là đủ, vì lễ tân không thu theo hiệu số.
  - ARC đề nghị BA thêm một câu vào thẻ 169-02: "khách vượt định mức có đêm thêm: Còn phải thu có thêm phụ thu người của đêm đó".
- ARC **không** đề nghị sửa trên Desk ở v1.0.5 theo kiểu A7. Desk sẽ hiện tổng của máy chủ, nhưng các dòng bên trên không cộng ra được tổng đó. Lỗi V5-12 sẽ quay lại ở dạng khác.

### FB-R5-ARC-FE-169-04 – Suggestion – FE-A2, v1.0.5 nếu kịp

- Thêm một ca khách đã trả thừa, ví dụ Đã thu > tổng các dòng: "Tổng cộng" vẫn là tổng các dòng, "Còn phải thu" = 0.
  - Với ca này, A6 sẽ đỏ.
- Khi có `extraNightPreview` (169-03), thêm ca khách vượt định mức có đêm thêm.

## 3. Ghi chú cho ORC

- Chuyển thẻ 169-03 cho DOM. Review của DOM chưa xét ca phụ thu người của đêm thêm. ARC không thấy cần đổi kết luận DUYỆT.
- Tài nguyên tạm đã xóa: worktree `arc-wt169`, ref `refs/scratch/arc-pr169`.

## 4. Dòng đề xuất cho `01-decisions/decision-log.md`

| Ngày | Round | Quyết định | Người quyết | Tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | ARC DUYỆT FE-A2 #169 (V5-12, BUG-R4-052, Tổng cộng ở bước Bill) @ `d8712188`, gộp khi CI xanh. Tổng các dòng đang hiện là số xem trước, không trái luật "client không tự tính số chính thức": số thu, trần QR/`finalPayment` và phiếu in vẫn của máy chủ. Câu bậc BR-107: đồng ý DOM, chấp nhận ở v1.0.5. Gộp thử `main` @ `da4e5604`: `gen_strings` không lệch, `tsc` sạch, admin-web 100 tệp / 1107 ca xanh. 7 đột biến ARC: A1–A5 đỏ; A6/A7 (tổng = Đã thu + Còn phải thu) xanh vì thiếu ca khách trả thừa. Thẻ 169-03 Minor v1.0.6: đêm thêm mang phụ thu người BR-110 (và phần bù FOC S4-38) vào Còn phải thu mà không có dòng nào, nên màn hiện tổng thấp hơn khi khách vượt định mức; gộp với DOM 169-01 thành `CheckoutSummary.extraNightPreview` + `projectedTotalVnd` (0.3.14); tới đó thu đúng Còn phải thu (DOM 169-02, thêm câu khách vượt định mức). Thẻ 169-04 Suggestion: ca khách trả thừa. Không ESC | ARC | rounds/round-05/reviews/ARC-on-fe-a2-pr-169.md |
