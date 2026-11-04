# BA trả lời review PR #72 (sổ tay v1.0.4, lượt 4c)

- Round 4 – v1.0.4, bước Phản hồi & sửa · 05/11/2026 · BA
- Review: `DOM-on-v104-pr72-manual.md`, `UXD-on-v104-pr72-manual.md`, `SEC-on-v104-pr72-manual.md` (cả ba ĐẠT CÓ ĐK @ `11794c25`)
- Sửa trong #72, một lượt, sau khi gộp `main` `c6b2f78e` (BR-105 v0.5.9). Tệp sửa: sổ tay `user-manual-v1.0.md`, `guides/00-index.md`, `01`, `02`, thêm `03-buong-phong.md`.
- Nhiều thẻ trùng nhau, mỗi chỗ chỉ sửa một lần: DOM-02 = UXD-03; DOM-03 = UXD-02; SEC-01 gộp với DOM-04; DOM-05 gộp với SEC-03 ở `01` 14.1.
- HTML dựng lại trong scratchpad (`build_manual.py`, `build_guides.py`), không commit. HTML không có `<!--`, danh sách lồng nhau hiện đúng.

## Bảng thẻ

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-DOM-BA-PR72-01 | Done | Sổ tay 2.5 bước 4, `02` 5.1 bước 4: hạn sửa về 0 là **trước khi nhận phòng**. Tới lúc nhận phòng mà chưa về 0 thì chưa thu, gọi quản lý sửa từ xa. Không liên lạc được ai thì thu đủ, ghi sổ giao ca, hoàn phần dư ở bước 6 khi trả phòng (sổ tay 2.14, `02` 11.1). Thêm câu về đêm đầu miễn phí khi khách nhận sớm. `01` 14.1 dòng 1 theo chữ DOM. Sửa các dòng lịch sử bản (`00`, sổ tay, `02`, cả dòng "Lập:"). Chú thích ẩn dẫn BR-105 v0.5.9 |
| FB-R4-DOM-BA-PR72-02 | Done | **9.4 / 2.12:** chữ DOM, thêm hai ý nhỏ của DOM mục 3: bấm **Đổi sang căn …** khi khách đã sẵn sàng chuyển; buồng phòng chỉ dọn căn cũ khi khách đã ra hết đồ. **11.1 / 2.14 bước 2:** tủ căn cũ nhập số trong sổ giao ca, không đếm lại. Thêm gạch **Kiểm trùng, trước khi bấm Trả phòng**: **Bỏ cả dòng** dòng phát sinh cũ, lý do "Trùng minibar tủ căn cũ". **Vai được bỏ dòng:** lễ tân trở lên, khi folio còn mở (`FolioDialog` `canAdjust = settled ? mgr : fd`; máy chủ chỉ đòi MGR+ sau khi trả phòng). Trang Trả phòng không có nút sửa dòng folio, nên kiểm trùng trước khi bấm Trả phòng. Khối "tới v1.0.3" thêm gạch tủ căn cũ. `03` mục 7 theo chữ DOM và lên bản; sổ tay 3.7 thêm cùng câu |
| FB-R4-DOM-BA-PR72-03 | Done | Trường hợp (b): thêm ô **Loại** = **Giảm giá đặc biệt (tiền phòng)**. `02` 9.5 bước 2 và sổ tay 2.12 theo chữ DOM. Sửa chú thích ẩn ở sổ tay (trước ghi "dòng tiền phòng mở ra Giảm giá đặc biệt") |
| FB-R4-DOM-BA-PR72-04 | Done | Bước 1: xóa mã cửa ngay. Bước 2: kiểm **Ngày đi đổi thành …**, kèm ví dụ 04:30 ngày 25/11. (b) bước con 2: khách mới đang chờ. (b) bước con 4: khai báo theo chữ DOM, thêm "không dán ô ngày đi Desk hiện" (SEC-01). Hạn và cách ghi trễ: "hỏi quản lý", không đặt quy tắc mới |
| FB-R4-DOM-BA-PR72-05 | Done | `01` 14.1 dòng 2 theo chữ DOM, gộp với SEC-03. Thêm: yêu cầu ra loại FOC thì từ chối, nhờ lễ tân gửi lại đúng loại (theo DOM-03) |
| FB-R4-DOM-BA-PR72-06 | Done (PR #85) | Không sửa trong #72. PR sách riêng #85 (`v104/ba-esc045-prices` @ `f11e928c`): sổ tay 1.3, 2.12, 5.2; `01` 9.1; `02` 9.2, 20.2; `05` mục 3. Gộp sạch với #72 và #69 (`git merge-tree`) |
| FB-R4-UXD-BA-PR72-01 | Done | Sổ tay 2.10 và `02` 7.4 tách theo khối UXD đề xuất. Nút trong khung đỏ chỉ mở khung đơn. Mở đơn cũ bằng ô tìm ở **Đơn đặt phòng**, câu không có mã thì bấm căn trên **Sơ đồ phòng**. Số mục theo từng tệp (sổ tay 2.8 / 2.14; `02` 6.1 / 11.1). Giữ hai chú thích ẩn, ghi thêm nguồn |
| FB-R4-UXD-BA-PR72-02 | Done | Trùng DOM-03 |
| FB-R4-UXD-BA-PR72-03 | Done | Trùng DOM-02. Dùng chữ DOM, vì DOM đã xác nhận. Gạch kiểm trùng có ở cả khối v1.0.4 lẫn khối v1.0.3 |
| FB-R4-UXD-BA-PR72-04 | Done | Hai chỗ đổi thành **Tiếp tục: Phụ phí**. "Phiếu đếm" đổi thành "số đã nhập": tủ căn cũ theo sổ giao ca, tủ đang ở theo số buồng phòng báo |
| FB-R4-UXD-BA-PR72-05 | Done | "**Khoản**: **Đồ ăn uống**" và "**Lý do miễn phí**: **Khác (ghi rõ)**, ghi …". Bỏ dấu chấm thừa ở sổ tay 2.6 / `02` 5.3 bước 4 |
| FB-R4-UXD-BA-PR72-06 | Done (phần sách) | Câu "Bỏ qua dòng chữ nhỏ dưới ô giá … Chữ cũ, sửa ở v1.0.5." ở sổ tay 2.5, `02` 5.1, `01` 14.1. Khóa Desk `folio.adjust_night_help_internal` ở v1.0.5 (UXD cấp, FE làm, PO xếp). Khi khóa lên, BA bỏ câu này |
| FB-R4-UXD-BA-PR72-07 | Done | (b) tách thành 5 bước con: xin giảm, chờ duyệt, trả phòng, khai báo, sổ giao ca. Bước 8 thêm "Đơn **Nội bộ**: xem bước 4." |
| FB-R4-UXD-BA-PR72-08 | Done | Thêm ba thông báo **Số đếm chưa được lưu**, **Folio đã sửa sau lần đếm trước**, "lần đếm trước không phải hôm nay". Với tủ căn cũ thì nhập lại số đã ghi, không đếm lại (theo DOM-02) |
| FB-R4-UXD-BA-PR72-09 | Rejected | PR #69 (đang mở, gộp khi v1.0.4 lên production) đã dùng số sổ tay 1.14 và bộ hướng dẫn 1.12. Đổi số ở #72 sẽ trùng số. Thay vào đó, phần 05/11 ghi rõ ngày ở dòng "Lập:" và dòng bảng ("Bổ sung 05/11 …", "Sửa 05/11 theo review #72 …"). Khi #69 gộp, BA đánh lại số nếu ORC muốn |
| FB-R4-SEC-BA-PR72-01 | Done | (b): xóa mã ngay (bước 1). Không kéo dài mã (bước 2). Kiểm lại app khóa lúc hoàn tất (bước con 3). Thị thực: ghi lý do "Gia hạn để trả phòng, khách đi ngày …". Khai báo theo chữ DOM-04 (DOM chốt), không dán ô ngày đi Desk hiện, hỏi quản lý về hạn ghi trễ. Thêm vế ngoại lệ ở `02` 9.3 bước 4, `02` 8.3, sổ tay 2.12 **Gia hạn** bước 4, sổ tay 2.11. Trường hợp (a) giữ nguyên |
| FB-R4-SEC-BA-PR72-02 | Done | Sổ tay 2.10, `02` 7.4: câu **Lý do** ("Đã kiểm căn trống lúc hh:mm, người kiểm: <tên nhân viên>") và kiểm mã cũ trên app khóa. `02` 14.3, `01` 4, sổ tay 1.8: câu cho người duyệt |
| FB-R4-SEC-BA-PR72-03 | Done (phần sách) | `02` và sổ tay: "Quản lý hoặc chủ đầu tư duyệt". `01` 14.1: Desk cho quản lý duyệt từng đêm; từ 2 đêm quản lý không bấm **Duyệt**. Thêm bằng chứng app khóa: không có lần mở sau ngày đi, mã không bị kéo dài. **Deferred:** bộ lọc tuần **Nhật ký tiền** gộp với việc bộ lọc tuần SEC PR71 mục 9.5 (BA/PO). `01` 2.1 chưa có lịch rà tuần. Desk tự giữ cổng 2 đêm ở v1.0.5 (PO xếp) |
| FB-R4-SEC-BA-PR72-04 | Done | Sổ tay 2.5, `02` 5.1: "Chỉ tạo khi chủ đầu tư hoặc quản lý đã đồng ý. **Ghi chú nội bộ** ghi người cho, lý do, số đêm miễn phí." `01` 14.1: kiểm người cho trước khi sửa về 0. **Giả định:** người được cho dùng phòng Nội bộ là chủ đầu tư hoặc quản lý. BR chưa ghi; PO/DOM xác nhận ở lượt sau |

## Việc kéo theo (cho ORC)

- **Câu 9.4 về minibar căn cũ áp dụng ngay:** v1.0.3 cũng tính hai lần. #72 chưa gộp kịp thì gửi câu đó cho INV cùng các câu dặn lễ tân khác (DOM mục 4 ý 2).
- **SEC-BE-PR74-02, phần sổ tay:** SEC đóng khi #72 gộp. Phần mã vẫn ở v1.0.5.
- **DOM nghi lỗi trả phòng sau 24:00 của ngày đi** (DOM mục 4 ý 3): QA dựng ca. Nếu xác nhận mà chưa sửa kịp, BA thêm câu DOM đề xuất vào 11.1 / 2.14.
- **Xung đột khi gộp với #69:** #69 sửa cùng các dòng "Lập:" và bảng phiên bản, nay có thêm `03` dòng 6. Ai gộp sau thì giải xung đột: giữ cả hai nội dung.
