# SEC review – PR #69, gỡ lời dặn "không bật 2 bước ở v1.0.x" (`v104/ba-2fa-ungate`)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: nhánh `v104/ba-2fa-ungate` @ **`77cbb496`** (`77cbb4961805d5199939ae2d97a046392abfbf94`). Chỉ đọc commit riêng của PR: `git diff ee92b607..77cbb496`. `ee92b607` là điểm đã gộp sẵn #63 và #68.
  - Diff có 7 tệp, đều là tài liệu: sổ tay và `00`–`05`, +150/−125.
  - PR chỉ gộp sau khi chủ đầu tư báo v1.0.4 đã lên production.
- Căn cứ:
  - các thẻ SEC đã gửi: `SEC-on-v104-bug-r4-032.md` (thẻ 06), `SEC-on-v104-pr68-docs.md` (S1);
  - mã trên `origin/main`: `mfa-store.ts` (`MFA_REQUIRED_ROLES`), `mfa.service.ts` (`disable`);
  - cây tệp tại `77cbb496`. SEC quét toàn bộ thân bài, không tính phần lịch sử.
- Không sửa tệp nào ngoài tệp này, không commit, không đụng nhánh BA.

## 0. Kết luận

**ĐẠT.** Không có Blocker hay Major. Có 1 Minor (thẻ 01, chữ còn sót của đợt chặn, không phải lỗi bảo mật) và 1 Suggestion (thẻ 02). Cả hai không chặn gộp.

## 1. S06 và S1 đã đúng ý chưa

| Thẻ | Lượt này ghi | SEC |
|---|---|---|
| R4032-06 (1): lễ tân trưởng không tự tắt 2 bước | `02` 1.8: "**Không tự tắt 2 bước** (Desk chưa chặn tới v1.0.5); cần tắt thì hỏi chủ đầu tư." Sổ tay 1.5 bước 7 và `01` 1.9 bước 8: "Dặn lễ tân trưởng **không tự tắt** 2 bước…; cần tắt thì hỏi anh/chị." Thêm khối **Ai bật 2 bước** (sổ tay 3.1, `01` 1.8): "lễ tân trưởng bắt buộc, không tự tắt" | **Đúng ý.** Câu khớp mã: `disable` chỉ chặn `owner` và `manager`, nên tới v1.0.5 Desk vẫn cho lễ tân trưởng tự tắt |
| R4032-06 (2): "báo đội" ở mọi chỗ | Mọi chỗ nói "đổi được" về 2 bước hoặc kiểm căn đều có "báo đội": bảng vai, dòng 0.4 / `01` 1.7, khối mới bước 3, bước 7/8, `02` 1.8, `03` 1.6, `04` 1.5, `00` | **Đúng ý.** Grep thân bài các tệp không còn chỗ "đổi được" nào thiếu "báo đội". Hai chỗ còn lại nói về **Tham số quy tắc**, không liên quan 2 bước |
| PR68-S1: chữ đậm "Desk chỉ chặn được `info@`" | Sổ tay 0.3a, `01` 1.6a: "**Desk chặn `info@` và `booking@` của cơ sở**, kể cả dạng có dấu cộng… Các hộp thư chung khác… anh/chị phải tự tránh." Cùng ý ở `02` 1.6, `05` 1.5, bảng thuật ngữ 5.0. Bước báo lỗi đổi thành "Địa chỉ là `info@` hoặc `booking@`" | **Đúng ý.** Vẫn giữ vế "tự tránh", và câu khớp `shared-mailboxes.ts` |

## 2. Còn chỗ nào dặn tắt hoặc không bật 2 bước không

**Không còn.** Đã gỡ hết các chỗ sau:
- "không bật 2 bước ở v1.0.x" và "Lỡ bật → **Tắt xác thực 2 bước**": sổ tay 1.5 bước 7, 3.1, 3.6, 4.1; `01` 1.8, 1.9 bước 8; `02` 1.8; `03`; `04`;
- câu app báo "Đăng nhập 2 bước sẽ có ở bản sau. Nhờ chủ đầu tư hỗ trợ đăng nhập.";
- cách v1.0.3 "khóa tài khoản cũ, tạo tài khoản mới, **không bật 2 bước**";
- các khung "**Áp dụng từ v1.0.4**" bọc phần đăng nhập app nhân viên (sổ tay 3.1, `01` 1.8, `02` 1.8) và cột **Thao tác**. Còn một khung ở mục kiểm phòng của sổ tay (dòng 1508), nhưng khung này không dặn gì về việc bật hay tắt, nên không ảnh hưởng.

Grep thân bài các tệp với các cụm "không bật", "tắt xác thực", "tự tắt", "v1.0.x", "lỡ bật", "sẽ có ở bản sau", "chưa đăng nhập được". Chỉ còn ba loại kết quả:
- **Câu đúng, nên giữ:**
  - "không tự tắt" (lễ tân trưởng);
  - "Người không bật lại đăng nhập app bằng mật khẩu": vai tùy chọn, khớp DOM B.1;
  - phần "Không phải anh/chị: coi như người cầm điện thoại bị mất đã vào tài khoản và tự tắt 2 bước. **Đặt lại mật khẩu ngay**": thẻ R4032-03 đã vào ở #63.
- **`01` 14.2 "Không bật 2 bước, không in hay tải mã khôi phục trên máy quầy."** Câu này có từ trước, và ý đúng là không làm việc đó trên máy quầy. Nhưng đọc lướt có thể hiểu là "không bật 2 bước" (thẻ 02).
- **`01` mục 1 (bảng thiết bị):** "App nhân viên `staff.ottimo.vn` | – | **Chưa đăng nhập được** ở v1.0 (mục 1.8)". Đây là chữ còn sót của đợt chặn và ngược với mục 1.8 mới (thẻ 01). Câu không dặn tắt 2 bước, nên không phải lỗi bảo mật.

Các dòng "tới v1.0.3" khác (giữ chỗ, Wi-Fi, HĐ thuê tháng, tiêu đề thư cũ) không thuộc 2 bước, nên ngoài phạm vi PR này.

## 3. Có lộ đường vòng hay chi tiết nội bộ không

**Không.**
- Đường mất cả điện thoại lẫn mã khôi phục chỉ còn một: chủ đầu tư **gặp tận mặt** rồi **Đặt lại xác thực 2 bước**. Vẫn giữ các câu "Không nhờ đội kỹ thuật đặt lại 2 bước", "Đặt lại mật khẩu không gỡ 2 bước", "không làm theo tin nhắn". Bước 7/8 có thêm "Không nhờ đội đặt lại 2 bước, không làm theo tin nhắn."
- Cách v1.0.3 "tài khoản mới, không bật 2 bước" đã gỡ. Không còn lời dặn nào để người dùng sống không có 2 bước ở vai bắt buộc.
- SEC đã quét mọi dòng thêm mới:
  - email chỉ có `info@`, `booking@` (và dạng `+…`), `info@ottimo.vn`, `booking@ottimo.vn`, đều là hộp thư chung công khai, đã có trên `main`; cộng `ten.rieng@example.test` (ví dụ);
  - không IP, không chuỗi số dài, không tên đăng nhập, không tên máy chủ hay đường dẫn, không lệnh 06.33;
  - không nhắc `EMAIL_*` hay `MFA_*`;
  - không ảnh.
- Phần **Lịch sử tệp** mới ở cuối tệp chỉ chuyển nguyên chữ đã có ở dòng "Lập:" xuống dưới. Không thêm chi tiết nào.

## 4. Thẻ

### FB-R4-SEC-BA-PR69-01
- Mức độ: Minor (chữ đúng/sai, không phải lỗi bảo mật; làm trong PR này nếu tiện, không chặn gộp).
- Vị trí: `01-chu-dau-tu-quan-ly.md` mục 1, bảng thiết bị, dòng "App nhân viên `staff.ottimo.vn` | – | **Chưa đăng nhập được** ở v1.0 (mục 1.8)".
- Vấn đề: đây là câu của đợt chặn (chủ đầu tư, quản lý có 2 bước chưa vào được app). Mục 1.8 mới ghi ngược lại: app nhân viên có bước nhập mã, và chủ đầu tư, quản lý bấm **Kiểm phòng** được.
- Vì sao quan trọng: chủ đầu tư đọc bảng này đầu tiên. Đọc bảng thì nghĩ mình không vào được app, nên có thể tiếp tục kiểm căn bằng mắt (13.2a) thay vì dùng app.
- Đề xuất sửa: "App nhân viên `staff.ottimo.vn` | `staff.ottimo.vn` | Điện thoại riêng: mật khẩu rồi mã 6 số (mục 1.8)".
- Trạng thái: Closed (SEC lượt 2 @ `b9e40a04`; BA sửa @ `b6d4ecb8`)

### FB-R4-SEC-BA-PR69-02
- Mức độ: Suggestion
- Vị trí: `01` mục 14.2, gạch "Không bật 2 bước, không in hay tải mã khôi phục trên máy quầy."
- Vấn đề: PR này đã gỡ mọi lời dặn "không bật 2 bước". Câu này đứng một mình ở đầu danh sách **Không được làm**, nên người đọc lướt có thể hiểu là "không bật 2 bước".
- Đề xuất: "Trên máy quầy: không bật 2 bước, không in hay tải mã khôi phục."
- Trạng thái: Closed (SEC lượt 2 @ `b9e40a04`; BA sửa @ `b6d4ecb8`)

## 5. Ghi chú cho ORC

- PR này bỏ cách v1.0.3 cho người mất cả điện thoại lẫn mã khôi phục. Vì vậy, nếu v1.0.4 phải quay về v1.0.3 sau khi gộp, revert PR này **cùng lúc**. Nếu không, sổ tay sẽ trỏ tới nút **Đặt lại xác thực 2 bước** mà bản đang chạy không có. Gộp đúng như BA ghi: chỉ khi chủ đầu tư báo v1.0.4 đã lên production.
- Không ESC mới.

## 6. Điểm làm tốt

- Gỡ trọn trong một commit, có danh sách mục ở dòng 1.14. Lời dặn cũ không còn sót ở `03`, `04`, nơi người dùng app nhân viên đọc.
- Khối **Ai bật 2 bước** gom mặc định theo vai vào một câu, kèm "không tự tắt" và "báo đội".

## 7. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – PR #69 gỡ "không bật 2 bước ở v1.0.x" (v104/ba-2fa-ungate @ 77cbb496, commit riêng ee92b607..77cbb496, chỉ tài liệu): ĐẠT** (rounds/round-04/reviews/SEC-on-v104-pr69-ungate.md): R4032-06 (lễ tân trưởng không tự tắt, "báo đội" mọi chỗ) và PR68-S1 ("Desk chặn info@ và booking@ của cơ sở") đúng ý; không còn lời dặn tắt/không bật 2 bước; một đường duy nhất khi mất cả điện thoại lẫn mã (gặp tận mặt → Đặt lại xác thực 2 bước); không lộ đường vòng hay chi tiết nội bộ. Minor 01 (`01` bảng thiết bị "App nhân viên chưa đăng nhập được"), Suggestion 02 (`01` 14.2 "trên máy quầy"); không chặn gộp. Gộp chỉ khi v1.0.4 đã lên production; quay về v1.0.3 thì revert cùng lúc | SEC | Quyền SEC |`

## Phản hồi BA (04/11/2026, PR #69 @ `b6d4ecb8`)

- Nhánh đã gộp `origin/main`, có #63, #64, #65 (`1c8a654f`). #68 chưa vào main nên gộp nhánh #68 @ `1fb521cf` (lượt 3: DOM 06, đơn Nội bộ ở thêm) tại `8b2b0204`, không force.
- Dòng "Lập:" giữ bản ngắn của #69. Ghi chú mới của #68 vào hàng bảng phiên bản (sổ tay 1.13, `00` 1.11) và **Lịch sử tệp** của `02`.
- Đã kiểm sau khi gộp: phần gỡ của #69 so với nhánh #68 khớp từng dòng với `ee92b607..77cbb496`; chỉ khác ở các ghi chú lịch sử nói trên.

### FB-R4-SEC-BA-PR69-01 – Fixed @ `b6d4ecb8`
- Sửa dòng của `01` 1.1 (bảng thiết bị) thành: "App nhân viên (kiểm phòng) | `staff.ottimo.vn` | **Điện thoại riêng**: mật khẩu rồi mã 6 số (mục 1.8)".
- Cột **Việc** ghi "App nhân viên (kiểm phòng)" chứ không lặp địa chỉ, cho khớp hai cột còn lại của bảng.
- Tìm lại trên toàn `product/docs/manual`: không còn "chưa đăng nhập được", trừ dòng lịch sử của `03`, `04`.

### FB-R4-SEC-BA-PR69-02 – Fixed @ `b6d4ecb8`
- `01` 14.2: "Trên máy quầy: không bật 2 bước, không in hay tải mã khôi phục."

### Ghi chú quay về v1.0.3
- Đã ghi vào PR body: nếu v1.0.4 phải quay về v1.0.3 sau khi #69 đã gộp, revert #69 cùng lúc.

## Lượt 2 (SEC, 04/11/2026, PR #69 @ `b9e40a04`)

- Đối tượng: nhánh `v104/ba-2fa-ungate` @ **`b9e40a04`**, chỉ tài liệu.
  - `b6d4ecb8` sửa thẻ 01, 02.
  - `b9e40a04` gộp #68 @ `ba841ea2`.
  - Phần #68 SEC chưa đọc: `1fb521cf` (DOM 06), vào nhánh ở `8b2b0204`; `ba841ea2` (DOM 07–10), vào nhánh ở `b9e40a04`. SEC đọc `git diff 31588f0d..ba841ea2`: 4 tệp, đều là sổ tay.
- Không sửa tệp nào ngoài tệp này, không commit, không đụng nhánh BA.

**Kết luận: ĐẠT.** Thẻ 01 và 02 đã đóng. Phần gộp #68 không đưa vào chi tiết nhạy cảm nào. Gộp #69 chỉ sau khi chủ đầu tư báo v1.0.4 đã lên production, như lượt 1.

1. **Thẻ 01, 02: đóng.**
   - 01: `01` 1.1 thành "App nhân viên (kiểm phòng) | `staff.ottimo.vn` | **Điện thoại riêng**: mật khẩu rồi mã 6 số (mục 1.8)". Đúng ý, và khớp mục 1.8.
   - 02: `01` 14.2 thành "Trên máy quầy: không bật 2 bước, không in hay tải mã khôi phục." Đúng chữ SEC đề xuất.
   - Cả hai còn nguyên sau khi gộp `b9e40a04` (`git show b9e40a04:…`, dòng 31 và 873).
2. **Gộp #68 không làm hỏng phần gỡ của #69.**
   - Bỏ dòng lịch sử ra thì các dòng đổi của `b6d4ecb8..b9e40a04` khớp từng dòng với `1fb521cf..ba841ea2`. Như vậy bản gộp không thêm, không bớt gì ngoài #68.
   - SEC grep lại thân bài tại `b9e40a04` với các cụm của lượt 1 ("không bật 2 bước", "tắt xác thực", "v1.0.x", "lỡ bật", "chưa đăng nhập được", "chỉ chặn được").
     - Chỉ còn các câu đúng đã ghi ở mục 2: "không tự tắt", "Đặt lại mật khẩu ngay", "Trên máy quầy: …".
     - Còn lại là dòng lịch sử.
   - Câu đậm "Tới v1.0.3, Desk chỉ chặn được `info@`" của #68 không quay lại. Thân bài giữ "**Desk chặn `info@` và `booking@` của cơ sở**".
3. **Không có đường vòng, cấu hình hay dữ liệu khách.**
   - Quét mọi dòng thêm của #68: không IP, URL, tên máy chủ, đường dẫn, biến `EMAIL_*`/`MFA_*`, không email ngoài các hộp thư đã có trên `main`, không chuỗi số dài, không số điện thoại, không mã két hay mã cửa, không ảnh. Mã đơn chỉ là khuôn `OTM-…`.
   - **Trả phòng đêm (DOM 06):**
     - thu tiền mặt hoặc thẻ qua máy POS, sau đó chỉ nhập **Mã chuẩn chi trên phiếu POS**. Mã chuẩn chi không phải dữ liệu thẻ, và không có chỗ nào bảo ghi số thẻ;
     - sổ giao ca chỉ ghi mã đơn, giờ, số tiền và cách thu;
     - khách chỉ chuyển khoản được thì ghi số còn thu, không hỏi số tài khoản.
   - **Đơn Nội bộ ở tiếp (DOM 06, 07):**
     - đổi căn thì vẫn thu thẻ và xóa mã căn cũ;
     - cùng căn thì chỉ kéo dài mã. Câu "không xóa" chỉ áp cho ca ở tiếp cùng căn, đúng phạm vi;
     - nhập lại giấy tờ cho đơn mới: cần cho khai báo theo đơn, và không có chỗ nào bảo chép giấy tờ ra ngoài Desk.
   - **Căn đang có khách (DOM 08):** cấm xác nhận ngoại lệ nhận phòng vào căn `OC`/`OD`, kể cả lễ tân trưởng. Câu "Desk hiện vẫn cho bấm" chỉ nói tới nút lễ tân trưởng vốn đã có. Câu này không mở thêm quyền, và quy tắc vẫn cấm. Theo ORC (BUG-R4-039), máy chủ chặn trong v1.0.4.
4. **Thẻ mới:** không. **ESC:** không.

**Ghi chú cho ORC (không chặn gộp):**
- Phần #68 có câu "**Từ v1.0.4:** bấm **Gia hạn** như đơn khác" (BUG-R4-038) và "Desk chặn từ v1.0.4" (BUG-R4-039).
  - Trước khi gộp #69, kiểm ghi chú phát hành v1.0.4 có cả hai bản sửa.
  - Nếu một bản sửa trượt khỏi v1.0.4, BA sửa câu tương ứng trước khi gộp. Bản 039 trượt thì không lộ gì, vì quy tắc vẫn cấm, nhưng câu sẽ sai.
- Lưu ý quay về v1.0.3 ở lượt 1 mục 5 vẫn giữ nguyên.

Dòng decision-log đề xuất (ORC ghi khi commit):

`| 2026-11-04 | 4 | **SEC – PR #69 lượt 2 (v104/ba-2fa-ungate @ b9e40a04, chỉ tài liệu): ĐẠT** (rounds/round-04/reviews/SEC-on-v104-pr69-ungate.md "Lượt 2"): thẻ FB-R4-SEC-BA-PR69-01 (`01` 1.1 app nhân viên đăng nhập bằng mật khẩu rồi mã 6 số) và PR69-02 (`01` 14.2 "Trên máy quầy: …") đóng @ b6d4ecb8; gộp #68 @ ba841ea2 khớp từng dòng với #68, không làm hỏng phần gỡ của #69, không thêm đường vòng, cấu hình hay dữ liệu khách (trả phòng đêm chỉ ghi mã chuẩn chi POS; ở tiếp khác căn vẫn xóa mã cũ). Gộp chỉ khi v1.0.4 đã lên production; trước khi gộp kiểm v1.0.4 có bản sửa BUG-R4-038 và BUG-R4-039 | SEC | Quyền SEC |`
