# BA – Báo cáo: Bộ hướng dẫn OTTIMO Desk v1.0 theo bộ phận

- Round 3 · Bước: Sản xuất (tài liệu ngày D) · 30/10/2026 · Hạn: tối 31/10 (đào tạo C3a), ngày D 02/11
- Yêu cầu INV 30/10 (nguyên văn): "ko cần in 5 tờ hướng dẫn, tôi muốn bạn làm một bộ manual, bao gồm cho từng bộ phận về cách hướng dẫn đăng nhập và sử dụng"
- Nguồn: `product/docs/manual/user-manual-v1.0.md` bản nội dung 1.5 (Desk `v1.0.0` = `8b3aec8`), `staff-one-pager.md` (Tờ 1, 2a, 2b, 3, 4), `day-one-guide.md` mục 6, 9, 10, `screenshot-list.md`, decision-log 29/10 (1 tài khoản giữ 6 vai) và 30/10 (ORC phân xử C1). Đối chiếu thêm chuỗi chữ `product/design/copy/strings-vi.json` và mã nguồn app nhân viên/Desk cho phần đăng nhập.
- Không sửa `user-manual-v1.0.md` hay tệp đã có. Chưa commit.

## 1. Đã làm gì

- Tách sổ tay 1.5 và 4 tờ in cho nhân viên thành **5 tệp theo bộ phận + 1 tệp mục lục**, mỗi tệp đọc độc lập. Mỗi tệp mở đầu bằng chương **Đăng nhập** viết riêng cho vai (địa chỉ đúng, lần đầu, 2 bước nếu có, hằng ngày, máy quầy nếu liên quan, đăng xuất, quên mật khẩu, mất điện thoại), rồi **Việc mỗi ngày** theo giờ, các thao tác theo thứ tự công việc thật, tình huống thường gặp và **không được làm**, cuối tệp là **Tạm thời tới v1.0.1**, **Bảng giờ**, **Khi có sự cố – gọi ai**, bài tập.
- Quy tắc, con số, tên nút giữ đúng chữ sổ tay 1.5. Câu nói với khách giữ nguyên văn EN/VI đã duyệt (giờ nhận phòng, mời đọc tờ thông báo, đồng ý lưu ảnh có N ngày, "N ngày hay 3 tháng", từ chối gửi mã cửa, chống giả danh, hẹn hoàn cọc 24 giờ). Tờ "Your ID details" chép nguyên văn vào tệp lễ tân (mục 7.2) kèm yêu cầu cho khách xem **trước khi nhận giấy tờ**, bằng bản in trong khung mica hoặc trên màn hình/máy tính bảng ở quầy.
- Tệp mục lục nói rõ: bộ hướng dẫn thay Tờ 1, 2a, 2b, 3; **Tờ 4 vẫn phải có ở quầy** vì là thông báo cho khách (điều kiện SEC D-T4), không phải hướng dẫn nhân viên.
- Gom phần "Tạm thời tới v1.0.1" theo vai: rà giữ chỗ 3 mốc, không dùng lý do "Khác (ghi rõ)", check-in online tạm dừng, chủ đầu tư duyệt và chi hoàn, trả phòng sớm, kiểm bảo mật buổi sáng, các lỗi đang sửa.
- Lập danh sách 19 ảnh mới `G…` theo quy tắc chụp của `screenshot-list.md`.

## 2. Tệp tạo mới

| Tệp | Chương (`##`) | Mục con (`###`) | Dòng | Ảnh dùng lại (mã `C`) | Ảnh mới (`G`) |
|---|---:|---:|---:|---:|---:|
| `product/docs/manual/guides/00-index.md` | 7 | 2 | 121 | 0 | 0 |
| `product/docs/manual/guides/01-chu-dau-tu-quan-ly.md` | 18 + "Cách đọc" | 42 | 764 | 28 | 6 |
| `product/docs/manual/guides/02-le-tan.md` | 20 + "Cách đọc" | 71 | 1266 | 55 (C2-19 đặt 2 lần) | 7 |
| `product/docs/manual/guides/03-buong-phong.md` | 15 + "Cách đọc" | 11 | 347 | 10 | 2 |
| `product/docs/manual/guides/04-bao-tri.md` | 12 + "Cách đọc" | 11 | 303 | 10 (C4-01 đặt 2 lần) | 2 |
| `product/docs/manual/guides/05-sale-ctv.md` | 11 + "Cách đọc" | 20 | 349 | 11 | 2 |
| `product/docs/manual/guides/screenshot-additions.md` | – | – | – | – | 19 + 2 ảnh cũ thiếu |
| `rounds/round-03/outputs/BA/department-guides.md` | Báo cáo này | | | | |

**Ảnh:** 88 mã `C` khác nhau được đặt trong bộ hướng dẫn = **86 ảnh có sẵn** + 2 mã chưa có tệp (C1-15, C2-34 – QA chưa chụp được, cần ca ESC-031). Trong 87 ảnh có sẵn, chỉ **C0-10** (trang khách sau check-in online) không dùng vì check-in online đang tạm dừng. **19 ảnh mới** còn thiếu: G1 6 · G2 7 · G3 2 · G4 2 · G5 2, thứ tự ưu tiên chụp ở cuối `screenshot-additions.md`.

## 3. Chỗ bộ hướng dẫn khác hoặc thêm so với sổ tay 1.5 (cần người xem)

Ngoài việc tách và đánh số lại, BA thêm hoặc suy ra các điểm dưới đây. Mỗi điểm có chú thích `<!-- … BA-GUIDES … -->` tại đúng chỗ trong tệp.

| # | Chỗ | Nội dung | Căn cứ | Ai xem |
|---|---|---|---|---|
| A1 | `03` mục 1.2, `04` mục 1.2, `02` mục 1.8, `01` mục 1.9 | **Buồng phòng, bảo trì đổi mật khẩu tạm trên Desk trước, rồi mới vào app nhân viên.** Sổ tay 3.1 ghi "Lần đầu: đổi mật khẩu tạm" trên app | App nhân viên `v1.0.0` không có màn đổi mật khẩu (`product/apps/mobile/src/pages/` không có trang này; `LoginPage.tsx` không xử lý `mustChangePassword`); API chặn mọi thao tác trừ `changeMyPassword` khi còn mật khẩu tạm (`auth.guard.ts`). Chưa thử trên staging | **QA (Q2)**, SEC |
| A2 | `00` mục 2.1, `01` mục 1.8, `03`, `04` đầu tệp | **Tài khoản 6 vai hiện nay không vào được app nhân viên** (có vai quản lý → 2 bước → app chặn). Hệ quả: việc dọn đánh dấu trên Desk (**Buồng phòng → Làm xong**), phiếu sửa xử lý trên Desk, **không ai kiểm phòng** – lễ tân nhận khách vào `VC` như thường | Ghép sổ tay 3.1 (OWN/MGR chưa vào app), 3.6 (ngày không ai kiểm: nhận `VC`), 2.19 (Làm xong thay buồng phòng) với decision-log 29/10 | **DOM**, ORC (câu hỏi mở 1) |
| A3 | `04` mục 4.4 | Người trực xử lý phiếu sửa trên Desk: **Nhận việc**, **Lưu – chờ vật tư**, **Sửa xong**, ảnh "chọn ảnh ở đây". Sổ tay chỉ tả phiếu trên app và khóa phòng trên Desk | Chuỗi `wo.*` dùng trong `WorkOrderDrawer.tsx` | **QA (Q3)** |
| A4 | `02` mục 7.2, `00` mục 4 | Cho khách xem tờ **Your ID details** bằng bản in **hoặc trên màn hình/máy tính bảng ở quầy** (theo giao việc ORC 30/10). BA thêm điều kiện: màn hình lúc đó chỉ hiện tờ thông báo, không hiện Desk hay dữ liệu khách khác. Không có tờ thì không nhận giấy tờ | Giao việc ORC; SEC D-T4, S2 (khung mica), D08 (đúng chữ và dòng chân) | **SEC (S1)**, UXD (bản điện tử của tờ) |
| A5 | `01` mục 1.7 | Chủ đầu tư **quên mật khẩu** → làm theo thủ tục khôi phục riêng đã diễn tập với đội kỹ thuật. Sổ tay chỉ ghi thủ tục này cho trường hợp mất cả điện thoại lẫn mã | Desk không có "quên mật khẩu"; chỉ có 1 chủ đầu tư | **SEC (S2)** |
| A6 | `05` mục 5.1 | Sale nội bộ gửi mã VietQR **từ tài khoản OTTIMO trên điện thoại cơ sở** (theo sổ tay 4.2 dẫn về 2.4). Sale làm việc ngoài quầy thì chưa rõ gửi từ đâu | Sổ tay 2.4, 4.2 | **SEC (S3)**, DOM |
| A7 | `05` mục 4.2 | Sale/CTV **không tự hủy giữ chỗ đã có cọc**, nhắn lễ tân (vì bước **Nhập nơi nhận hoàn** chỉ làm được trên máy quầy đã cấp quyền). Sổ tay không cấm | Sổ tay 0.5, 1.12, 5.3 (CTV "M – hủy giữ chỗ") | **DOM (D2)** |
| A8 | `01` mục 13 | Việc tuần đầu của chủ đầu tư thêm: (a) **một lượt kiểm VietQR trước ngày D** bằng giữ chỗ "TEST OTTIMO" ngày 17/11, hủy ngay với lý do **Khách đổi ý** – theo ORC phân xử C1 ngày 30/10, trái chữ sổ tay 1.7 "không tạo đơn thử" (tệp 01 ghi rõ là ngoại lệ một lần); (b) lưu số chủ đầu tư/quản lý vào danh bạ điện thoại cơ sở; (c) đặt tờ Your ID details trước 06:00 ngày 02/11 | decision-log 30/10 (ORC); sổ tay 2.13 ("số đã lưu sẵn"); `staff-one-pager.md` cuối tệp | DOM, SEC (đối chiếu với sổ tay 1.7 bản sau) |
| A9 | `04` mục 1.3, 5 | Bảo trì **đăng nhập Desk** khi khóa phòng có kế hoạch. Sổ tay 4.1 ghi "bảo trì hoặc lễ tân, trên Desk" nhưng bảng menu 0.7 không có cột bảo trì | Sổ tay 4.1, 5.3 (MT ✔ khóa phòng) | **QA (Q4, ảnh G4-01)** |
| A10 | `02` mục 13.3 | Ca đêm: khách đến sau 22:00 → "cho xem tờ Your ID details như mọi khách" thay cho câu sổ tay "đã làm thủ tục trước" (vì check-in online tạm dừng) | Sổ tay 2.9, 2.20 | DOM |
| A11 | `04` mục 4.2, 8.2 | Bảo trì không vào căn treo "Không làm phiền" (sổ tay chỉ ghi cho buồng phòng); báo lễ tân đổi phòng trước khi khóa căn có khách | Sổ tay 3.12, 4.1 bước 3 | DOM |
| A12 | Bài tập | Thêm bài: `01` (6) thêm/đặt lại/khóa người dùng giả, (7) duyệt và chi khoản hoàn người khác tạo; `02` (1) đăng nhập lần đầu, chỉ chip máy quầy; `04` (5) phiếu sửa có khóa căn trên Desk tập | Sổ tay 5.8 + chương Đăng nhập mới | PO |
| A13 | `03` mục 1.3, `04` mục 1.3, `05` mục 1.3 | Bảng câu báo khi đăng nhập (sai mật khẩu, thử quá nhiều lần, không có mạng, đăng nhập lại để gửi tiếp, "Bạn không có quyền mở trang này" → **Về trang chủ của tôi**) | Chuỗi `auth.login.error_generic`, `error.RATE_LIMITED`, `login.offline`, `login.error_network`, `hk.queue.relogin_*`, `shell.no_access_*`, `shell.go_home` | UXD, QA |

## 4. Điểm cần từng vai xem (trước buổi C3a tối 31/10)

**DOM**
- D1. A2: cách vận hành buồng phòng/bảo trì khi người trực không vào được app (không ai kiểm phòng; nhận `VC`). Có cần thêm việc gì (ví dụ người trực tự rà căn `VC` trước khi giao) không – nếu có, DOM quyết, BA ghi.
- D2. A7: sale/CTV không tự hủy giữ chỗ có cọc.
- D3. Bảng "Việc mỗi ngày" theo giờ của `02` mục 2, `03` mục 2, `04` mục 2, `05` mục 2 – BA ghép từ các mốc giờ rải trong sổ tay; DOM kiểm thứ tự và mốc.
- D4. A10, A11.

**SEC**
- S1. A4: hiện tờ Your ID details trên màn hình – điều kiện "chỉ hiện tờ thông báo" đủ chưa; có cần ghi thiết bị nào (chỉ máy tính bảng của cơ sở?).
- S2. A5: chủ đầu tư quên mật khẩu.
- S3. A6: sale nội bộ gửi mã VietQR từ đâu khi không ở quầy; CTV nhắn khách từ Zalo của CTV (bản chất CTV) – có cần câu nào thêm.
- S4. Chương Đăng nhập của 5 tệp: kiểm lại thứ tự "lần đầu", 2 bước, mã khôi phục, mất điện thoại cho đúng sổ tay 0.2–0.4 và SEC B1–B6.

**UXD**
- U1. Câu nói với khách: đối chiếu nguyên văn với `UXD-on-PO-v1.0.0-docs.md` mục 1.1–1.2 (BA chép từ sổ tay 1.5, không sửa chữ).
- U2. Bản điện tử của tờ Your ID details để hiện trên màn hình/máy tính bảng (A4) – cùng chữ, cùng dòng chân "OTTIMO · ID notice · 11/2026", theo brand OTTIMO.
- U3. Nếu chủ đầu tư cần bản HTML/in cho từng tệp: dựng theo brand guideline (Ivory/Cream/Stone Grey/Ink, Light Oak/Earth Brown, Sage; Lora, Be Vietnam Pro, JetBrains Mono). Bộ dựng hiện tại (`product/design/tools/build_manual.py`) đọc mã ảnh dạng `Cx-yy`; mã `Gx-yy` cần bộ dựng nhận thêm tiền tố `G`.
- U4. A13: câu báo lỗi đăng nhập.

**QA**
- Q2 (gấp nhất, trước khi tạo tài khoản buồng phòng/bảo trì thật): trên staging, tạo tài khoản chỉ có vai **Buồng phòng** – (1) đăng nhập app nhân viên bằng mật khẩu tạm thấy gì; (2) đổi mật khẩu tạm trên Desk rồi vào app được không; (3) Desk hiện gì cho vai chỉ có Buồng phòng. Chụp G3-01. Nếu app không cho đổi mật khẩu: đề xuất ghi lỗi (app thiếu màn đổi mật khẩu tạm) – mức do QA đánh giá.
- Q3: tên nút thật trên khung phiếu sửa của Desk (A3), chụp G4-02.
- Q4: Desk của tài khoản chỉ có vai **Bảo trì** – menu có **Bảo trì** không (A9), chụp G4-01.
- Q5: chụp 19 ảnh G và 2 ảnh cũ C1-15, C2-34 theo `screenshot-additions.md`; kiểm che trước khi commit.

## 5. Giả định đã dùng

- `[GIẢ ĐỊNH BA – trình bày]` Bộ hướng dẫn là bản tách của sổ tay 1.5, không thay sổ tay. Khi sổ tay đổi, bộ hướng dẫn đổi theo (`00` mục 1). Số mục, cách chia chương thuộc quyền trình bày của BA.
- `[GIẢ ĐỊNH BA]` Tài khoản 6 vai hiện nay không vào được app nhân viên (A2) – suy từ sổ tay 3.1 + decision-log 29/10 (quản lý đã đăng ký 2 bước); chưa thử bằng chính tài khoản đó.
- `[GIẢ ĐỊNH BA]` Buồng phòng/bảo trì đổi mật khẩu tạm trên Desk (A1) – suy từ mã nguồn, chờ QA Q2.
- `[GIẢ ĐỊNH BA]` Hiện tờ Your ID details trên màn hình là cách thứ hai bên cạnh bản in, theo giao việc của ORC; bản in trong khung mica vẫn là cách chính (A4).
- `[GIẢ ĐỊNH BA]` Không nêu số điện thoại, địa chỉ Desk tập trong tài liệu; "chủ đầu tư đưa trong buổi đào tạo" (theo sổ tay 5.8, PO thẻ 03).

## 6. Câu hỏi mở (cho ORC)

1. **Tài khoản 6 vai và app nhân viên (A2).** Hiện không ai kiểm phòng được và không ai dùng app nhân viên. Đội có thể tự giữ cách làm trên Desk (đề xuất BA: giữ – đúng sổ tay 3.6, không tốn gì). Nếu chủ đầu tư muốn người trực dùng app trên điện thoại (dọn, kiểm phòng, báo sự cố có ảnh), phương án là tạo thêm cho người đó một tài khoản chỉ có vai Lễ tân trưởng + Buồng phòng + Bảo trì – trái nguyên tắc "mỗi người một tài khoản" nên cần SEC và chủ đầu tư quyết. BA **không tạo ESC**; ORC cân nhắc có đưa vào câu hỏi cho INV ở buổi C3a không.
2. **Bản HTML/in của bộ hướng dẫn**: INV muốn "bộ manual" để hướng dẫn từng bộ phận – có cần UXD dựng HTML theo brand cho từng tệp trước 31/10 không (U3)? BA chỉ giao bản markdown.
3. **Bộ dựng ảnh**: mã `Gx-yy` cần bộ dựng `build_manual.py` nhận thêm (U3), nếu dựng HTML.
4. **Lỗi có thể có ở app nhân viên** (A1/Q2): nếu QA xác nhận app không có màn đổi mật khẩu tạm, ORC xếp mức và bản sửa.

## 7. Rủi ro, việc chưa xong

- 19 ảnh G và 2 ảnh C chưa có; không kịp thì bản dựng giữ mô tả chữ.
- A1, A3, A9 dựa trên đọc mã, chưa thử trên staging (Q2–Q4).
- Chưa qua review DOM/SEC/UXD. Các điểm ở mục 3 là nơi dễ sai nhất.
- `staff-one-pager.md` và `day-one-guide.md` (dòng D−1 "in 4 tờ") vẫn nhắc in 4 tờ; tác giả (PO) cập nhật sau khi bộ hướng dẫn được duyệt: giữ in Tờ 4, bỏ in Tờ 1–3.
