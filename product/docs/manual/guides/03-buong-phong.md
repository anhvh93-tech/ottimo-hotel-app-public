# Hướng dẫn Buồng phòng – App nhân viên OTTIMO

- Dành cho: **nhân viên buồng phòng (HK)**
- Thiết bị: **điện thoại**, địa chỉ `staff.ottimo.vn` (app nhân viên, mở bằng trình duyệt, không cần cài từ kho ứng dụng)
- Áp dụng cho: **OTTIMO Desk v1.0** (bản `v1.0.4`), chạy thật từ **thứ Hai 02/11/2026**
- Lập: BA · 30/10/2026 · Tệp này bản 1.7 (thuộc bộ hướng dẫn bản 1.16) – 07/11/2026, áp dụng ngay: bổ sung minibar luôn nạp đủ định mức, không theo số món trên việc (mục 7). Bản 1.6 – 07/11/2026: nút **Báo cần dọn** trên app từ v1.0.5 (mục 6). Bản 1.5 (thuộc bộ hướng dẫn bản 1.13, tệp không đổi chữ) – 04/11/2026 (áp dụng khi chủ đầu tư báo v1.0.4 đã lên production): gỡ lời dặn "không bật 2 bước ở v1.0.x" và cách v1.0.3 khi mất cả điện thoại lẫn mã khôi phục (`00` mục 7, bản 1.12). Các bản trước: mục **Lịch sử tệp** cuối tệp.
- Tài liệu không chứa mật khẩu, mã cửa hay thông tin khách.
- **Tài liệu nội bộ OTTIMO – không chuyển tiếp cho người ngoài OTTIMO, không gửi vào nhóm chat, không chụp, không đăng lên mạng. Nghỉ việc hoặc hết hợp tác: xóa tệp trên máy và báo chủ đầu tư.** Bộ hướng dẫn chỉ do chủ đầu tư gửi, và không bao giờ có ô đăng nhập hay hỏi mật khẩu; tệp "hướng dẫn" nhận từ người khác thì không mở, báo chủ đầu tư.

<!-- Nguồn: product/docs/manual/user-manual-v1.0.md bản 1.5 mục 0.2, 0.4, 0.6, 0.8, chương 3, 5.1, 5.5, 5.8; staff-one-pager.md Tờ 3. Tệp này thay Tờ 3 (INV 30/10). -->

## Cách đọc tệp này

- Chữ **in đậm** là tên nút, tên màn hình đúng như trên app. Ảnh màn hình có mã ở dưới ảnh (ví dụ C2-05). Khung nét đứt ghi **Chưa có ảnh** hoặc **Ảnh mới · chờ chụp** là ảnh đang chờ chụp: cứ làm theo chữ.
- Khung **Tạm ở v1.0** là việc app chưa làm được và cách làm thay. Cách tạm tới v1.0.3 và các bản sau gom ở **mục 12**.
- **Hiện OTTIMO có một người trực giữ cả 6 vai, trong đó có vai quản lý.** Người trực vào app nhân viên bằng mã 6 số và kiểm căn trên app (tệp 02 mục 14.2). Tệp này dành cho nhân viên buồng phòng có tài khoản riêng.

---

## 1. Đăng nhập

### 1.1 Anh/chị đăng nhập ở đâu

- Địa chỉ: `staff.ottimo.vn`. Mở bằng trình duyệt trên điện thoại (Chrome hoặc Safari).
- Chỉ vào bằng cách **gõ địa chỉ** hoặc biểu tượng trên màn hình chính. Không bấm link đăng nhập gửi qua Zalo, tin nhắn.
- Mỗi người **một tài khoản** do chủ đầu tư tạo. Không dùng chung.

### 1.2 Lần đầu đăng nhập

Chủ đầu tư **đưa mật khẩu tạm tận tay**. Không gửi qua chat. Lần đầu làm cùng chủ đầu tư.

**Bước A – Đổi mật khẩu tạm** (trên Desk, một lần):
1. Mở trình duyệt, gõ `desk.ottimo.vn`.
2. Nhập **Tên đăng nhập** và **Mật khẩu** (mật khẩu tạm). Bấm **Đăng nhập**.
3. Màn **Đặt mật khẩu của bạn**: nhập **Mật khẩu hiện tại** (mật khẩu tạm), **Mật khẩu mới**, **Nhập lại mật khẩu mới**.
4. Bấm **Lưu và vào ứng dụng**.
5. Desk mở trang **Buồng phòng**. Không cần làm gì thêm: bấm **tên của mình → Đăng xuất**.

Có thể **bỏ bước A**: đăng nhập app bằng mật khẩu tạm (bước B), app tự mở màn **Đặt mật khẩu của bạn**: nhập **Mật khẩu hiện tại** (mật khẩu tạm), **Mật khẩu mới**, **Nhập lại mật khẩu mới**, bấm **Lưu và vào ứng dụng**. Sau mỗi lần chủ đầu tư **Đặt lại mật khẩu** cho anh/chị, đổi lại theo một trong hai cách.

Quy tắc mật khẩu: ít nhất 10 ký tự, không chứa tên hoặc số điện thoại của mình, không phải mật khẩu phổ biến.

[ẢNH: C0-02-Đặt mật khẩu lần đầu]
[ẢNH: G3-01-Desk sau khi đổi mật khẩu, tài khoản buồng phòng]

<!-- QA đã kiểm Q2 (qa3-rc1.md mục 22.2, 30/10): app không có màn đổi mật khẩu tạm (BUG-R3-052); đổi trên Desk rồi vào app được; Desk của vai chỉ Buồng phòng mở thẳng trang Buồng phòng. -->

**Bước B – Đăng nhập app nhân viên:**
1. Mở trình duyệt điện thoại, gõ `staff.ottimo.vn`.
2. Nhập **Tên đăng nhập**, **Mật khẩu** (mật khẩu mới vừa đặt, hoặc mật khẩu tạm nếu bỏ bước A). Bấm **Hiện** nếu muốn xem lại chữ vừa gõ, rồi **Ẩn**.
3. Bấm **Đăng nhập**.
4. Trình duyệt hỏi lưu mật khẩu: chọn **Không bao giờ**.
5. Chọn "Thêm vào Màn hình chính" (Safari: nút chia sẻ → **Thêm vào Màn hình chính**; Chrome: menu ⋮ → **Thêm vào màn hình chính**) để mở nhanh lần sau.

[ẢNH: C0-09-Đăng nhập app nhân viên]
[ẢNH: G3-02-Thêm app nhân viên vào màn hình chính]

### 1.3 Đăng nhập hằng ngày

1. Mở biểu tượng OTTIMO Staff trên màn hình chính (hoặc gõ `staff.ottimo.vn`).
2. Nhập **Tên đăng nhập**, **Mật khẩu**. Bấm **Đăng nhập**.
3. App mở **Việc**. Thanh dưới có 4 mục: **Việc**, **Các căn**, **Báo sự cố**, **Tôi**. Chuông **Thông báo** ở trên.
4. Đổi ngôn ngữ: **Tôi → Ngôn ngữ giao diện** (Tiếng Việt / English).

Khi đăng nhập, app có thể báo:

| App báo | Làm gì |
|---|---|
| "Tên đăng nhập hoặc mật khẩu không đúng. Quên mật khẩu? Nhờ chủ đầu tư đặt lại." | Gõ lại chậm, kiểm chữ hoa. Vẫn sai: báo chủ đầu tư |
| "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại." | Chờ đúng số phút |
| "Không có mạng. Cần kết nối để đăng nhập." | Bật Wi-Fi hoặc 4G rồi đăng nhập lại |
| "Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm Đăng nhập lần nữa." | Kiểm mạng, bấm **Đăng nhập** lần nữa |
| **Đăng nhập lại để gửi tiếp** – "… thao tác vẫn còn trên máy và sẽ gửi sau khi bạn đăng nhập." | Đăng nhập lại. Thao tác đã bấm khi mất mạng vẫn còn, sẽ tự gửi |

### 1.4 Đăng xuất

1. Bấm **Tôi** (thanh dưới).
2. Bấm **Đăng xuất**.
3. App cảnh báo "Còn … thao tác chưa gửi. Đăng xuất bây giờ sẽ mất các thao tác này.": **không** bấm **Vẫn đăng xuất**. Bật mạng, vào **Tôi → Thao tác trên máy** → **Gửi ngay**, rồi mới đăng xuất.

Đăng xuất xóa dữ liệu đã lưu trên máy. Phải đăng xuất khi: **trả máy**, đưa điện thoại cho người khác dùng, **nghỉ việc**.

[ẢNH: C3-09-Tôi, đăng xuất]

### 1.5 Quên mật khẩu, mất điện thoại

| Tình huống | Làm gì |
|---|---|
| Quên mật khẩu | **Báo chủ đầu tư.** App không có nút "quên mật khẩu". Chủ đầu tư đặt lại và đưa mật khẩu tạm tận tay. Làm lại mục 1.2 |
| Tài khoản bị khóa do sai nhiều lần | Chờ đúng số phút Desk báo, hoặc nhờ chủ đầu tư **Mở khóa**. Bị khóa mà mình **không** gõ sai: báo chủ đầu tư ngay (có thể có người dò mật khẩu) |
| **Mất điện thoại** có đăng nhập app nhân viên | **Báo chủ đầu tư ngay** để khóa tài khoản và đặt lại mật khẩu |
| Đã bật 2 bước rồi mất cả điện thoại lẫn mã khôi phục | **Báo chủ đầu tư.** Chủ đầu tư **gặp tận mặt** anh/chị rồi **Đặt lại xác thực 2 bước**. Anh/chị **giữ tài khoản cũ**: đăng nhập lại app bằng tên đăng nhập cũ và mật khẩu như cũ (hoặc mật khẩu tạm chủ đầu tư đưa tận tay), app không hỏi mã. Điện thoại bị lấy cắp, hoặc mật khẩu có lưu hay ghi trên điện thoại đó: nói với chủ đầu tư để đặt lại mật khẩu luôn. Muốn bật lại 2 bước: làm trên Desk cùng chủ đầu tư (mục 1.6) |
| Nghi người khác biết mật khẩu | Báo chủ đầu tư ngay |

**Không ai** – chủ đầu tư, quản lý, đội kỹ thuật – hỏi mật khẩu của anh/chị. Ai hỏi thì không đưa và báo chủ đầu tư.

### 1.6 Luôn nhớ về tài khoản

- **Mỗi người một tài khoản.** Không dùng chung, không đọc mật khẩu qua điện thoại, không gõ mật khẩu cho người khác.
- Không lưu mật khẩu trên trình duyệt.
- Trả máy hoặc nghỉ việc: **Đăng xuất**.
- Buồng phòng **không thấy giấy tờ khách**, giá, kênh – đúng thiết kế.
- **Đăng nhập 2 bước:** app nhân viên đăng nhập được bằng 2 bước: nhập mật khẩu, rồi **mã 6 số** trong ứng dụng xác thực (mất điện thoại: **Mất điện thoại? Dùng mã khôi phục**). **Bật hay không: tùy chọn** (mặc định đội chọn; chủ đầu tư đổi được và báo đội). Chỉ bật khi anh/chị có điện thoại riêng và giữ được 10 mã khôi phục. Không bật vẫn làm việc bình thường. **Bật 2 bước chỉ làm trên Desk** (`desk.ottimo.vn`, trên máy tính, cùng chủ đầu tư), app không có màn bật. App báo "Tài khoản của bạn cần bật xác thực 2 bước trước khi làm việc." thì làm theo câu dưới đó: mở OTTIMO Desk trên máy tính để bật, rồi đăng nhập lại app. Đã bật mà mất cả điện thoại lẫn mã khôi phục: chủ đầu tư gặp tận mặt rồi **Đặt lại xác thực 2 bước**, không tạo tài khoản mới (mục 1.5).

---

## 2. Việc mỗi ngày

| Khi nào | Việc |
|---|---|
| Đầu ca sáng | Đăng nhập app. Mở **Việc**, xem tiến độ **… xong** |
| **Trước 11:00** | **(1)** Căn **trống từ đêm qua, có khách đến hôm nay**: rà lại căn, dọn nếu cần, bấm **Dọn xong**, để lễ tân trưởng kiểm xong **trước 12:00** |
| Trước **12:00** | Bộ đồ dùng thêm cho người ở thêm: chuẩn bị xong |
| Khi lễ tân báo khách sắp trả | Đếm minibar căn đó, **báo lễ tân số còn lại từng món** (mục 7) |
| Ngay khi khách trả | **(2)** Căn có khách mới đến cùng ngày: dọn ngay, trước mọi việc khác trừ (1). Bấm **Dọn xong** để căn **sẵn sàng trước 14:00** |
| **Từ 09:00**, khi khách ra ngoài hoặc khách mời dọn | **(3)** Phòng khách đang ở. Desk tạo việc lúc 07:00, nhưng **không gõ cửa trước 09:00** trừ khi khách yêu cầu. Treo biển "Không làm phiền": không vào (mục 5.2) |
| Sau đó | **(4)** Căn khách trả, không có khách đến hôm nay |
| Trong ngày | Việc **Bổ sung minibar**, **Yêu cầu của khách**, **Dọn sau sửa chữa** |
| Khi thấy hỏng hóc | **Báo sự cố** kèm ảnh (mục 9) |
| Thấy đồ khách để quên | Báo lễ tân ngay |
| Cuối ca | Mọi việc đã bấm đúng. **Tôi → Thao tác trên máy** không còn thao tác chờ gửi |
| Trả máy, đổi người dùng máy | **Tôi → Đăng xuất** |

Nhiều việc cùng lúc: làm theo thứ tự **(1) → (2) → (3) → (4)**. Khách yêu cầu dọn ngay thì làm sau (1), (2).

Luôn nhớ:
- Mở **Việc**, làm theo thứ tự trên. Mỗi căn: **Bắt đầu dọn** → **Dọn xong**. Desk cập nhật ngay.
- Mất mạng vẫn bấm được.
- **Không mở cửa căn** cho người nói mình là khách, kể cả khi họ biết tên khách. Mời ra quầy hoặc gọi lễ tân.

---

## 3. Trạng thái phòng

| Mã | Trên Desk | Trên app nhân viên | Nghĩa |
|---|---|---|---|
| `VD` | VD · Trống, cần dọn | Cần dọn (khách đã đi) | Khách đã trả, chưa dọn |
| `CL` | CL · Đang dọn | Đang dọn | Đã bấm **Bắt đầu dọn** |
| `VC` | VC · Đã dọn, chờ kiểm | Đã dọn – chờ kiểm | Dọn xong, chờ lễ tân trưởng kiểm |
| `VI` | VI · Đã kiểm, sẵn sàng | Sẵn sàng đón khách | Kiểm đạt |
| `OC` | OC · Có khách, sạch | Khách đang ở – đã dọn | Có khách, phòng sạch |
| `OD` | OD · Có khách, cần dọn | Khách đang ở – cần dọn | Có khách, cần dọn |
| `OOO` | OOO · Khóa phòng, đang sửa | Đang sửa – không bán | Khóa để sửa chữa |

Lễ tân nhận khách vào căn `VC` hoặc `VI`. Mỗi sáng lúc 07:00, Desk chuyển các căn có khách sang "cần dọn" để có việc dọn trong ngày.

Ngày trên app đổi lúc **06:00**, không phải 00:00. Từ 00:00 đến 05:59 vẫn là ngày hôm trước.

---

## 4. Việc của tôi

1. Mở **Việc**. Màn **Việc của tôi**, tiến độ **… xong**.
2. Việc chia nhóm: **Làm trước** · **Khách đang ở** · **Sau khi khách trả phòng** · **Đã xong** · **Đã bỏ**.
3. Làm từ trên xuống. Mỗi việc ghi căn, loại việc, giờ cần xong, **Có khách đến hôm nay …**, **Thay ga gối** (3 đêm một lần), **Khách nhắn: "…"**.
4. Việc **Chờ khách trả phòng**: chưa bấm được tới khi lễ tân trả phòng cho khách.

[ẢNH: C3-01-Việc của tôi]

**Giờ cần xong:**

| Căn | Xong trước |
|---|---|
| Trống từ đêm qua, có khách đến hôm nay | **11:00**: rà lại căn, dọn nếu cần rồi bấm **Dọn xong**. Lễ tân trưởng kiểm xong trước **12:00** |
| Khách trả rồi khách mới đến cùng ngày | **14:00** (dọn ngay khi khách trả) |
| Phòng khách đang ở | Trong ngày; bắt đầu **từ 09:00** (sớm hơn chỉ khi khách yêu cầu) |
| Bộ đồ dùng thêm cho người ở thêm | **12:00** |

Các loại việc: **Dọn trả phòng**, **Dọn phòng khách đang ở**, **Dọn theo gói dài hạn**, **Bổ sung minibar**, **Yêu cầu của khách**, **Dọn sau sửa chữa**, **Dọn phòng thêm (khách yêu cầu)**, **Dọn gấp – khách vào khi đang dọn**, chuẩn bị/thu hồi/chuyển bộ đồ dùng thêm.

---

## 5. Dọn phòng

### 5.1 Các bước

1. Bấm vào việc của căn. Màn **Căn …**.
2. Bấm **Bắt đầu dọn**. App ghi **Bắt đầu lúc …**. Desk thấy **Đang dọn**.
3. Làm theo các bước gợi ý (**Vệ sinh nhà tắm, thay khăn**, **Lau bếp, đổ rác, kiểm tủ lạnh**, **Bổ sung đồ dùng, nước suối**).
4. Bấm **Dọn xong**:
   - Căn trống: chuyển **Đã dọn – chờ kiểm**; lễ tân trưởng được báo đi kiểm.
   - Căn có khách: chuyển **Khách đang ở – đã dọn**.
5. Bấm nhầm: bấm **Hoàn tác** trong khoảng **10 giây** sau khi bấm.

[ẢNH: C3-02-Căn, bắt đầu dọn và dọn xong]

Ở v1.0 buồng phòng **không tự kiểm** phòng mình dọn (không có nút **Kiểm phòng**). Lễ tân trưởng kiểm rồi báo sẵn sàng. Lễ tân trưởng chưa kiểm thì lễ tân vẫn nhận khách vào căn **Đã dọn – chờ kiểm**, sau khi căn đã được kiểm bằng mắt (tệp 02 mục 13.2a). Từ v1.0.4 người trực kiểm trên app (tệp 02 mục 14.2).

### 5.2 Khách không muốn dọn hôm nay

1. Màn căn → **Khách không muốn dọn**.
2. Chọn **Lý do**: **Treo biển "Không làm phiền"**, **Khách nói không cần dọn**, **Lý do khác**.
3. Bấm **Bỏ việc dọn hôm nay** (hoặc **Quay lại**).

Lễ tân thấy lý do. Ngày mai vẫn có việc dọn như thường.

[ẢNH: C3-03-Khách không muốn dọn]

---

## 6. Các căn

**Các căn** hiện trạng thái mọi căn. Lọc: **Tất cả**, **Cần dọn**, **Có khách**, **Sạch**, **Đang sửa**. Mỗi căn ghi khách đến hôm nay/ngày mai. Buồng phòng chỉ thấy tên gọi của khách trong ngày, không thấy giá, kênh, giấy tờ.

**Từ v1.0.5:** màn căn **Khách đang ở – đã dọn** có nút **Báo cần dọn** khi app cho phép. Bấm thì căn chuyển **Khách đang ở – cần dọn** và có việc dọn. App không hỏi xác nhận. Mất mạng: thao tác chờ gửi như các nút khác (mục 10).

[ẢNH: C3-04-Các căn]

---

## 7. Minibar

**Bổ sung minibar:** việc ghi **Bổ sung minibar: …** kèm tên món và số lượng. Bổ sung xong bấm **Làm xong**.
- **Luôn nạp đủ định mức theo bảng trong căn**, không theo số món ghi trên việc.
- Tủ thiếu nhiều hơn số trên việc: báo lễ tân **trước khi** bấm **Làm xong**.
- Lý do: bấm **Làm xong** là Desk ghi tủ đã đủ. Tủ còn thiếu thì khách sau bị tính tiền món mình không dùng.
<!-- Nguồn: DOM-on-be-prs-101-108-110.md mục 3.3 (trả lời SEC FB-R5-SEC-BE-V516-01), BR-702, BR-703. Áp dụng ngay, không phụ thuộc bản. Nút thật là "Làm xong" (hk.task.complete). -->

**Khi khách trả phòng:**

> **Tạm ở v1.0:** app nhân viên chưa có màn đếm minibar. Cách làm:
> 1. Lễ tân báo buồng phòng khách sắp trả căn nào.
> 2. Buồng phòng đếm tủ, báo lễ tân **số còn lại từng món** (gọi điện hoặc nói trực tiếp; nhắn tin nội bộ chỉ ghi số căn và số món, không ghi tên khách).
> 3. Lễ tân nhập vào Desk khi trả phòng.
> 4. Đếm sau khi khách đã đi mà thấy thiếu: báo lễ tân ngay, kèm ảnh tủ (chụp tủ, không chụp người).

Khách đổi phòng: đếm minibar căn cũ **trước khi dọn**, báo lễ tân số còn lại từng món như trên. Báo xong thì **bổ sung đủ tủ** căn cũ khi dọn. Từ v1.0.4, việc **Bổ sung minibar** cho căn cũ sinh lúc lễ tân lưu số tủ căn cũ ở bước **Minibar** của trang **Trả phòng** (khi tủ có món đã dùng), không sinh lúc đổi phòng. Có việc này: kiểm tủ, đủ thì bấm **Làm xong**.

---

## 8. Bộ đồ dùng thêm

Khách vượt định mức ngủ sofa. Mỗi người thêm một bộ: 1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân (không gối).
- Việc **Chuẩn bị … bộ đồ dùng thêm – căn …, trước …** → xong bấm **Đã chuẩn bị**.
- Khách đi: **Thu hồi … bộ đồ dùng thêm** → **Đã thu hồi**.
- Khách đổi phòng: **Chuyển … bộ đồ dùng thêm sang căn …** → **Đã chuyển**.

---

## 9. Báo sự cố, hỏng hóc

1. **Báo sự cố** (thanh dưới), hoặc trong màn căn: **Báo sự cố căn này**.
2. Chọn **Căn**, **Chuyện gì xảy ra?**: **Mất nước nóng**, **Điện / đèn**, **Rò nước**, **Khóa cửa**, **Đồ hỏng**, **Khác**. Tắc thoát nước hoặc Wi-Fi: chọn **Khác** và ghi rõ trong **Mô tả** (mục 12).
3. **Mô tả**: vài chữ để kỹ thuật biết cần mang gì.
4. **Ảnh (nên có)**: bấm **Chụp**. Chỉ chụp chỗ hỏng; không chụp khách, không chụp giấy tờ.
5. **Mức độ**:
   - **Gấp**: an toàn hoặc khách đang ở bị ảnh hưởng (mất nước nóng, mất điện, khóa hỏng, rò nước).
   - **Trong ngày**: sửa xong trong 24 giờ.
   - **Không gấp**: trong 3 ngày.
6. Căn không ở được: tích **Đề nghị khóa căn – không bán đến khi sửa xong**. Lễ tân hoặc bảo trì quyết định khóa.
7. Bấm **Gửi báo sự cố**. App báo **Đã tạo phiếu …**. Phiếu Gấp: bảo trì, lễ tân, quản lý được báo; bảo trì nhận việc trong 15 phút.

[ẢNH: C3-06-Báo sự cố]

Sự cố gấp mà đang mất mạng: phiếu lưu trên máy, tự gửi sau; **gọi lễ tân ngay**, đừng chờ.

Sau khi bảo trì sửa xong căn có khóa phòng, anh/chị nhận việc **Dọn sau sửa chữa**.

---

## 10. Khi mất mạng

- App hiện thanh "Mất mạng. Bấm vẫn được – thao tác sẽ tự gửi khi có mạng".
- Thao tác chờ gửi hiện chip **Chờ gửi** và mục **… thao tác đang chờ gửi**. Xem ở **Tôi → Thao tác trên máy**; bấm **Gửi ngay** khi có mạng.
- Mục **Cần xem lại**: máy chủ không nhận (ví dụ căn đã đổi trạng thái, giờ bấm quá xa). Đọc lý do, bấm **Gửi lại "…"** hoặc **Đã hiểu**.
- **Đừng xóa dữ liệu trình duyệt hay gỡ app khi còn thao tác chờ gửi.**
- Đừng đăng xuất khi còn thao tác chờ gửi (mục 1.4).
- Báo sự cố gấp: gọi lễ tân ngay, không chờ mạng.

[ẢNH: C3-07-Thao tác trên máy]

---

## 11. Thông báo, an toàn và không được làm

### 11.1 Thông báo

Chuông **Thông báo**: **Phiếu sửa mới**, **Việc gấp đã lên đầu danh sách**, **Căn đã dọn – chờ kiểm**, **Việc đã được hủy vì đơn thay đổi**, **Yêu cầu mới của khách**. Bấm để mở việc.

[ẢNH: C3-08-Thông báo]

### 11.2 Tình huống thường gặp

| Tình huống | Làm gì |
|---|---|
| Có người nói "tôi quên mã, mở cửa giúp" | **Không mở.** Mời ra quầy hoặc gọi lễ tân, kể cả khi họ biết tên khách |
| Khách hỏi mã cửa | Mời khách ra quầy hoặc gọi lễ tân. Không đọc, không nhắn mã |
| Khách hỏi Wi-Fi | Chỉ thẻ Wi-Fi trong căn |
| Căn treo biển "Không làm phiền" | Không vào. Bấm **Khách không muốn dọn** (mục 5.2) |
| Không thấy giấy tờ của khách trên app | Đúng như thiết kế |
| Việc biến mất, có thông báo **Việc đã được hủy vì đơn thay đổi** | Đơn đổi (khách đổi phòng, rời sớm). Làm việc tiếp theo |
| Bấm nhầm **Dọn xong** | **Hoàn tác** trong 10 giây; quá 10 giây thì gọi lễ tân |
| Thấy đồ khách để quên | Báo lễ tân ngay |
| App báo lỗi, không làm tiếp được | Ghi bằng lời: căn, giờ, đã bấm gì, app báo gì. Báo lễ tân hoặc chủ đầu tư (mục 14) |

### 11.3 Không được làm

- Không chụp ảnh khách, giấy tờ, màn hình Desk bằng điện thoại cá nhân.
- Không gửi thông tin khách vào nhóm Zalo.
- Không gửi mã cửa qua tin nhắn.
- **Không mở cửa căn** cho người nói mình là khách, kể cả khi họ biết tên khách.
- Không dùng tài khoản của người khác, không đưa mật khẩu cho người khác.
- Không vào căn đang có khách treo biển "Không làm phiền".
- Không chụp màn hình có dữ liệu khách để gửi ai, kể cả gửi đội kỹ thuật.
- Không xóa dữ liệu trình duyệt, không gỡ app khi còn thao tác chờ gửi.

---

## 12. Tạm thời tới v1.0.3 và các bản sau

Các việc dưới đây làm theo cách tạm tới khi chủ đầu tư báo bản có sửa đã lên (v1.0.3 hoặc bản sau). Bản v1.0.1 (đã lên 03/11) chưa sửa các việc này.

| Việc | Cách tạm |
|---|---|
| App chưa có màn đếm minibar | Đếm, báo lễ tân số còn lại từng món (mục 7) |
| Việc **Bổ sung minibar** còn nằm dưới **Khách đang ở** sau khi khách đã trả | Vẫn làm và bấm **Làm xong** như thường |
| App thiếu loại sự cố "Tắc thoát nước", "Wi-Fi" | Chọn **Khác**, ghi rõ trong **Mô tả** |
| Khách rời sớm trước ngày đi | Lễ tân hủy việc dọn các ngày sau và tạo việc **Dọn trả phòng** cho ngày khách rời. Làm theo việc mới trong app |
| Trang khách chưa hiện Wi-Fi | Khách xem thẻ Wi-Fi trong căn |

---

## 13. Bảng giờ

| Giờ | Việc |
|---|---|
| **06:00** | Ngày mới trên app. Trước 06:00 vẫn là ngày hôm trước |
| 07:00 | Desk chuyển căn có khách sang "cần dọn" |
| **09:00** | Bắt đầu dọn phòng khách đang ở (sớm hơn chỉ khi khách yêu cầu) |
| **Trước 11:00** | Rà căn trống từ đêm qua có khách đến hôm nay, bấm **Dọn xong** |
| **12:00** | Giờ trả phòng. Lễ tân trưởng kiểm xong căn trống từ đêm qua có khách đến. Bộ đồ dùng thêm xong |
| **14:00** | Mọi căn có khách đến hôm nay **chắc chắn sẵn sàng** (căn khách trả và khách mới đến cùng ngày) |

---

## 14. Khi có sự cố – gọi ai

| Sự cố | Gọi ai | Trong lúc chờ |
|---|---|---|
| Hỏng hóc gấp (mất nước nóng, mất điện, khóa hỏng, rò nước) | **Báo sự cố** mức **Gấp** + **gọi lễ tân** | Không chờ mạng: gọi lễ tân ngay |
| Mất điện cả khu | Lễ tân | Khóa cửa chạy pin vẫn mở bằng mã/thẻ. Làm theo lễ tân |
| Có người lạ xin mở cửa căn | Lễ tân | Không mở |
| App báo lỗi, không làm tiếp được | Lễ tân hoặc chủ đầu tư | Ghi bằng lời căn, giờ, đã bấm gì, app báo gì. **Không** ghi tên khách, **không** chụp màn hình có dữ liệu khách |
| Mất mạng | – | App vẫn bấm được; thao tác tự gửi khi có mạng |
| Quên mật khẩu, mất điện thoại, tài khoản bị khóa | Chủ đầu tư | – |
| Đồ khách để quên | Lễ tân ngay | – |

Số điện thoại lễ tân và chủ đầu tư: chủ đầu tư đưa trong buổi đào tạo.

---

## 15. Bài tập đào tạo (1 giờ)

Tập trên **app tập** bằng **tài khoản tập** chủ đầu tư đưa tận tay trong buổi đào tạo. Mật khẩu tập khác mật khẩu thật. Chỉ mở bản tập bằng địa chỉ chủ đầu tư đưa; không bấm link "trang tập" gửi qua Zalo.

1. Đăng nhập, đổi ngôn ngữ, đăng xuất.
2. **Bắt đầu dọn** → **Dọn xong**; bấm **Hoàn tác** trong 10 giây.
3. **Khách không muốn dọn**.
4. **Báo sự cố** có ảnh (chụp đồ vật), **Đề nghị khóa căn**.
5. Bấm một việc khi tắt mạng, xem **Thao tác trên máy**, bật mạng lại, **Gửi ngay**.
6. Nói được: vì sao không mở cửa cho người tự nhận là khách; báo minibar cho lễ tân thế nào.

## Lịch sử tệp

Chuyển từ dòng **Lập:** đầu tệp (04/11/2026; phần bổ sung 05/11 chuyển vào ngày 05/11, giữ nguyên chữ). Mới nhất ở trên.

- Bản 1.7 – 07/11/2026 (bộ hướng dẫn 1.16), **áp dụng ngay** (BA, theo DOM review PR #101, #108, #110 mục 3.3, trả lời SEC FB-R5-SEC-BE-V516-01): mục 7 – bổ sung minibar luôn nạp đủ định mức theo bảng trong căn, không theo số món trên việc; tủ thiếu nhiều hơn số trên việc thì báo lễ tân trước khi bấm **Làm xong**.
- Bản 1.6 – 07/11/2026 (bộ hướng dẫn 1.15), **áp dụng từ v1.0.5** (BA, V5-71 phần V5-15; UXD `copy-v1.0.5.md` 9.7): mục 6 – nút **Báo cần dọn** ở màn căn có khách.
- Bản 1.4 – 04/11/2026, bổ sung 05/11 (**áp dụng ngay**): khách đổi phòng thì đếm minibar căn cũ **trước khi dọn**, báo lễ tân số còn lại từng món, bổ sung đủ tủ căn cũ khi dọn (mục 7; DOM #72 thẻ 02); bản 1.4 **áp dụng từ v1.0.4**: đã bật 2 bước mà mất cả điện thoại lẫn mã khôi phục thì chủ đầu tư gặp tận mặt rồi **Đặt lại xác thực 2 bước**, anh/chị giữ tài khoản cũ (mục 1.5; BUG-R4-032; sửa cùng ngày theo review SEC: điện thoại bị lấy cắp hoặc có lưu mật khẩu thì chủ đầu tư đặt lại mật khẩu luôn)
- Bản 1.3 – 04/11/2026, **áp dụng từ v1.0.4** (bản đang chạy là v1.0.3): app nhân viên có bước nhập mã 2 bước, đổi mật khẩu tạm ngay trên app, bật 2 bước làm trên Desk, bật hay không là tùy chọn (mặc định đội chọn, sửa theo review DOM cùng ngày; mục 1.6, 5.1, 12) (mục 1.2, 1.6, 12)
- Bản 1.1 (tách từ Sổ tay sử dụng OTTIMO Desk v1.0, bản nội dung 1.5; sửa theo review DOM, SEC, UXD, QA ngày 30/10; bản 1.2 ngày 03/11: không bật đăng nhập 2 bước ở v1.0.x vì app nhân viên chưa đăng nhập được bằng 2 bước – mục 1.6, FB-R4-DOM-PO-RN103-02)
