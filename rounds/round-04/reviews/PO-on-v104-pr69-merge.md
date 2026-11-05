# PO review – PR #69 sau khi BA gộp `main` (giải xung đột)

- Người review: PO | Ngày: 05/11/2026 | Round 4 – v1.0.4 – Bước: **Review** (chỉ đọc)
- Đối tượng:
  - Nhánh `v104/ba-2fa-ungate` @ `b66e3b07378058e0475bc2abcfb3905b8775055f`.
  - Commit merge: `b9e40a04` (head #69 trước đó) + `main` @ `202254f8`. BA không rebase.
  - Phần giải xung đột: `git show --remerge-diff b66e3b07`.
- PO chỉ tạo tệp này. Không commit, không gộp #69.

---

## 0. Kết luận

- **ĐẠT.**
- Giữ điều kiện cũ cho #69: chỉ gộp sau khi chủ đầu tư báo v1.0.4 đã lên production và CI xanh hết.
- Có 1 Suggestion (FB-R4-PO-BA-PR69-04). Thẻ này chỉ đụng chữ ở phần lịch sử, không chặn gộp.
- Không ESC mới.

## 1. Cách kiểm

- **Phần giải xung đột:** đọc `--remerge-diff`. Có 5 tệp, mọi chỗ sửa đều ở dòng **Lập:**, bảng lịch sử bản và mục **Lịch sử tệp**.
- **So bằng máy, cả 7 tệp sổ tay** (sổ tay, `00`–`05`). Hai diff được so là:
  - từ `main` @ `202254f8` sang `b66e3b07`;
  - diff riêng của #69, từ merge-base `ba841ea2` sang `b9e40a04`.
- **Kết quả so:**
  - Ngoài dòng **Lập:** và các dòng lịch sử, hai diff trùng nhau từng dòng. Ở `04` và `05`, hai diff trùng hoàn toàn.
  - Ngoài 7 tệp này, `b66e3b07` giống `main`.
- **Dòng `main` thêm sau merge-base:** mọi dòng đều còn ở `b66e3b07`, trừ hai nhóm sau.
  - 5 dòng **Lập:** đã thay bằng dòng **Lập:** ngắn của #69.
  - 2 đoạn "Sửa 05/11/2026, chưa đánh số bản" chỉ được chèn thêm một ngoặc.
- **Phần `main` đã thêm vào 5 dòng Lập: (ngày 04–05/11):**
  - `01`, `02`, `03`: khớp chuỗi nguyên văn ở mục **Lịch sử tệp** của từng tệp.
  - Sổ tay và `00`: nội dung này đã có sẵn ở hàng **1.13** (sổ tay) và **1.11** (`00`) của `main`. BA giữ hai hàng đó nguyên chữ.
    - PO đối chiếu từng ý: sổ tay 24 ý, `00` 18 ý. Ý nào cũng có.
    - Hai chỗ khác chữ nhưng cùng nghĩa: "trường hợp (b)" so với "(b)", và "đêm gõ tay" so với "đêm gõ".
    - Bỏ đoạn này khỏi dòng **Lập:** không làm mất thông tin.
- **Câu dặn "không bật / chưa bật 2 bước":** quét lại toàn bộ sổ tay sau khi gộp. Chỉ còn hai loại, đều đúng:
  - các hàng lịch sử bản;
  - câu "Trên máy quầy: không bật 2 bước" (`01` mục 14.2 "Không được làm"). Đây là quy tắc cho máy dùng chung, không phải lời dặn của v1.0.x.
- **`merge-tree` với `origin/main` @ `43ddddde`:** sạch. Sau `202254f8`, `main` chỉ thêm một dòng decision-log.
- **CI lúc review:** 7 kiểm đạt, 2 đang chạy (E2E smoke, landing LP-v1).

## 2. Kiểm theo 3 ý ORC giao

| # | Ý | Kết quả | Ghi chú |
|---|---|---|---|
| 1 | Dòng **Lập:** và cách đánh số bản (PR69-01, UXD-PR72-09) | **Đạt** | (a) Cả 7 tệp dùng dòng **Lập:** ngắn của #69. `01`–`05` vẫn ghi "Tệp này bản X (thuộc bộ hướng dẫn bản 1.12)", nên PR69-01 vẫn đúng. (b) Số bản sau gộp (trong ngoặc là số trên `main`): sổ tay 1.14 (1.13), bộ hướng dẫn 1.12 (1.11), `01` 1.11 (1.10), `02` 1.12 (1.11), `03` 1.5 (1.4), `04` 1.5 (1.4), `05` 1.7 (1.6). Mọi số đều cao hơn `main`, không trùng. (c) UXD-PR72-09 lo hai nội dung khác nhau cùng mang một số bản. BA đã từ chối thẻ này ở #72 với lý do "#69 sẽ đánh số". Nay 1.14 và 1.12 gồm cả phần 05/11, ghi ở ghi chú "Lượt 2". Bản in trước #69 ghi 1.13/1.11, bản sau #69 ghi 1.14/1.12. Vậy chỗ UXD lo đã hết. Dòng **Lập:** vẫn ghi ngày 04/11: xem thẻ 04 ý (a) |
| 2 | Không câu nào của #72, #85, #88, #89 bị mất hay bị đổi | **Đạt** | Xem mục 1. Thân tài liệu (ngoài dòng **Lập:** và lịch sử) giữ đúng chữ của `main` và chỉ có thay đổi của #69. #88 không đụng sổ tay. Phần #89 sửa ở `05` mục 3 và sổ tay 4.2 còn nguyên: không có tỷ lệ hoa hồng nào quay lại |
| 3 | Câu chèn "(sau bản …)" | **Đạt, chấp nhận** | "(sau bản 1.13, có trong bản 1.14; …)" và "(sau bản 1.11, có trong bản 1.12; …)" nói đúng thứ tự: phần 05/11 làm sau 1.13/1.11 và nằm trong 1.14/1.12. Đặt cạnh nhãn cũ "chưa đánh số bản", câu này đọc hơi vướng: xem thẻ 04 ý (b) |

## 3. Thẻ

### FB-R4-PO-BA-PR69-04
- Mức độ: **Suggestion**. Không chặn gộp #69 và không cần sửa trước khi gộp.
  - Nơi làm: lượt dọn tài liệu v1.0.5, cùng danh sách ở PR69-03.
  - Nếu BA còn phải sửa #69 vì lý do khác thì làm luôn trong lượt đó.
- Vị trí và đề xuất:
  - (a) Dòng **Lập:** của sổ tay "Bản nội dung 1.14 (04/11/2026, …)", dòng **Lập:** của `00` "Bản 1.12 (04/11/2026, …)", và hai hàng 1.14, 1.12 trong bảng lịch sử. Các chỗ này ghi ngày 04/11, nhưng bản đã gồm phần 05/11. Đề xuất ghi "04/11/2026, lượt 2 05/11/2026", hoặc ghi ngày gộp thật khi #69 gộp.
  - (b) Sổ tay và `00`, nhãn "**Sửa 05/11/2026, chưa đánh số bản** (sau bản 1.13, có trong bản 1.14; …)". Hai chữ "chưa đánh số" và "có trong bản 1.14" đứng cạnh nhau đọc như mâu thuẫn. Đề xuất "**Sửa 05/11/2026** (sau bản 1.13, gộp vào bản 1.14; …)". Ở `00` sửa tương tự với 1.11 và 1.12.
  - (c) Câu mở mục **Lịch sử tệp** của `01`, `02`, `03`. Đổi "phần bổ sung 05/11 chuyển vào ngày 05/11" thành "phần bổ sung 05/11 chuyển vào đây ngày 05/11".
- Vì sao chỉ là Suggestion: cả ba ý chỉ đụng chữ ở phần lịch sử. Người ở quầy đọc số bản ở dòng **Lập:**, và số đó đúng. Không ý nào làm đổi cách làm việc.
- Trạng thái: Open

## 4. Ghi chú cho ORC

- **Khi nào gộp #69:**
  - chủ đầu tư báo "v1.0.4 đã lên";
  - CI xanh hết;
  - `merge-tree` với `main` lúc đó sạch.
- **Nếu `main` có thêm sửa sổ tay trước lúc gộp:** BA gộp `main` lần nữa theo đúng cách lần này (giữ dòng **Lập:** ngắn, chuyển chữ nguyên văn vào lịch sử). Gọi PO đọc lại phần remerge. #66 chỉ sửa `release-notes.md`, nên gộp #66 không đụng #69.
- **Sau khi #69 gộp:** PO cập nhật dòng **Hướng dẫn** ở release notes sang 1.14 / 1.12, như #66 đã hẹn.
- Không ESC mới.

## 5. Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-05 | 4 | **PO – review giải xung đột #69 @ `b66e3b07` (BA gộp `main` @ `202254f8`, không rebase): ĐẠT** (rounds/round-04/reviews/PO-on-v104-pr69-merge.md). So máy 7 tệp sổ tay: ngoài dòng Lập: và lịch sử, diff với `main` trùng diff riêng của #69 (`ba841ea2..b9e40a04`); `04`, `05` trùng hẳn. Phần 05/11 ở dòng Lập: của `main`: `01`/`02`/`03` chuyển nguyên chữ vào Lịch sử tệp; sổ tay và `00` đã có ở hàng 1.13 / 1.11 giữ nguyên chữ (đối chiếu 24 + 18 ý, đủ). Số bản đều cao hơn `main` (sổ tay 1.14, bộ 1.12, `01` 1.11, `02` 1.12, `03`/`04` 1.5, `05` 1.7); PR69-01 vẫn đúng; UXD-PR72-09 hết lo trùng số. Không còn câu dặn "không bật 2 bước". merge-tree với `main` @ `43ddddde` sạch. 1 Suggestion FB-R4-PO-BA-PR69-04 (ngày 1.14/1.12, nhãn "chưa đánh số bản", câu mở Lịch sử tệp), làm ở lượt dọn v1.0.5. Gộp #69 khi chủ đầu tư báo v1.0.4 đã lên và CI xanh hết | PO | Chỉ chữ ở dòng Lập: và lịch sử; không mất câu nào của #72/#85/#88/#89 |`
