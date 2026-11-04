# BA – BUG-R4-032: sổ tay có đường "Đặt lại xác thực 2 bước"

- Người làm: BA | Round 4 – v1.0.4 – Bước: **Phản hồi & sửa** | 04/11/2026
- Lỗi: BUG-R4-032 (P2, điều kiện QC v1.0.4 mục 7.4, ca TC-V104-MN-02) trong `rounds/round-04/qa/bug-list-v1.0.4.md`. Tệp bug-list này chưa có trên `main` (còn ở bản làm việc của QA), BA đọc từ đó.
- Nhánh `v104/ba-2fa-reset-manual` cắt từ `origin/main` @ `40825ee1`. Chỉ sửa tài liệu. Không đụng tệp chữ, mã, release notes.
- Bản mới: sổ tay **1.12**; bộ hướng dẫn **1.10** (`00`), `01` **1.9**, `02` **1.10**, `03` **1.4**, `04` **1.4**, `05` **1.5**. Mọi chỗ mới ghi **áp dụng từ v1.0.4**.
- Đã chạy thử `build_manual.py` và `build_guides.py` ra thư mục tạm: dựng được. Chỉ thiếu ảnh mới C1-23, hiện khung "Chưa có ảnh". Phần HTML trong repo để UXD dựng lại (MN-01).

## 1. Trả lời lỗi

| Ý của BUG-R4-032 | Trạng thái | Ghi chú |
|---|---|---|
| (a) Chưa có đường **Khác… → Đặt lại xác thực 2 bước** | Fixed (chờ QA đọc lại MN-02, SEC đọc câu ở mục 3) | Thêm khối **Đặt lại xác thực 2 bước** ở sổ tay 1.5 và `01` 1.9, gồm: ai dùng, gặp tận mặt, 5 bước, các câu Desk báo, Desk tự làm gì, người đó làm tiếp ra sao theo vai. Thêm khung **Khác…** (cột **Thao tác** chỉ còn **Sửa vai**, **Khác…**, **Mở khóa**) và một gạch **Đặt lại xác thực 2 bước** trong danh sách **Các việc khác** |
| (b) 2 hàng "mất cả điện thoại lẫn mã khôi phục" vẫn dạy Khóa rồi tạo tài khoản mới | Fixed | Sổ tay 0.4 và `01` 1.7: đường chính **Từ v1.0.4** là Đặt lại xác thực 2 bước, người đó giữ tài khoản cũ. Cách cũ (4 bước, tên đăng nhập mới) chuyển xuống phần **Ở v1.0.3** của cùng ô, theo SEC chốt RN103-05: "1.7 thành dự phòng". Cùng ý ở `02` 1.7, 1.8; `03` 1.5, 1.6; `04` 1.5; `05` 1.6 (thêm hàng cho người đã bật 2 bước); sổ tay 3.1; `00` 2.1; `01` 1.8, 14.1, 17, 18.2 bài tập 6 |
| (b') Dòng 160: thư "Security notice: 2-step verification was reset" không nói ai bấm, bấm ở đâu | Fixed | Sổ tay 0.3a và `01` 1.6a: từ v1.0.4, chủ đầu tư nhận thư này mỗi lần chính mình bấm **Đặt lại xác thực 2 bước**; thư không có chữ "bởi đội kỹ thuật OTTIMO"; việc mình biết trước, không cần làm gì |
| (c) Câu "không bật 2 bước ở v1.0.x" còn ở `01` 1.9 bước 8, `03`, `04` | Đề xuất cho QC 7.4 chốt | BA giữ tới ngày INV báo v1.0.4 đã lên, rồi gỡ trong một commit theo danh sách ở mục 5. Lý do và danh sách ở mục 5 |

## 2. Mô tả lấy từ mã (main @ `40825ee1`)

| Điểm | Mã nói gì | Sổ tay ghi |
|---|---|---|
| Ai làm | `resetUser2fa` `x-roles: [owner]`. Trang Người dùng & vai chỉ OWN (`nav.ts` `roles: ['owner']`). Quản lý gọi API → 403 (test `mfa-us143`) | Chỉ chủ đầu tư, trên máy riêng |
| Khi nào thấy nút | `UserMoreMenu`: mục chỉ có khi `user.mfaEnabled`; dòng của chính mình không có **Khác…** (máy chủ cũng chặn: 422 `NOT_ALLOWED`); nút mờ khi mất mạng | Chỉ hiện với người đã bật 2 bước; dòng của mình không có; mất mạng thì mờ |
| Đặt cho OWN khác | Được (`openapi.yaml` 0.3.8, đường ESC-027 A) | Không ghi: OTTIMO chỉ có một OWN (ESC-027 = B). Câu "Không ai trong Desk đặt lại được… cho chủ đầu tư" giữ nguyên |
| Hộp | Tiêu đề `users.reset_2fa_title`, thân `users.reset_2fa_confirm`, ô `users.reset_2fa_reason` (bắt buộc, 3–300 ký tự sau khi bỏ khoảng trắng, `resetSchema`), rồi `reauth.s2_help`, **Mật khẩu đăng nhập** + mã 6 số, nút `users.reset_2fa` (kiểu nguy hiểm), **Hủy** | Đúng chữ của `strings-vi.json`. Lý do được kiểm trước khi gửi (`validate`): sai thì "Ghi lý do (ít nhất 3 ký tự)." và mã chưa bị dùng |
| Sai mật khẩu/mã | `reauth.s2_failed`; hộp vẫn mở; lý do giữ nguyên (test `v104-users-fea` dòng 214) | Ghi đúng câu, "lý do vẫn còn", sai 5 lần chờ khoảng 15 phút |
| Thành công | 204, toast `users.reset_2fa_done`, danh sách tải lại (`mfaEnabled: false`) | "Đã đặt lại xác thực 2 bước cho {tên}."; mục không còn trong **Khác…** |
| Desk tự làm | `mfa.clear` (xóa bí mật + mọi mã khôi phục, `mfa_enabled = false`); `sessions.revokeAll(…, 'mfa_reset')`; **mật khẩu không đổi**; audit `mfa.reset_by_owner` (người làm, người bị đặt lại, lý do); thông báo `account_security_change` cho người đó + mọi OWN; thư `mfa_reset` cho người đó + mọi OWN | Đăng xuất mọi máy, mã khôi phục cũ hết hiệu lực, mật khẩu giữ nguyên, thư tới người đó (nếu có email) và mọi chủ đầu tư kể cả người bấm, chuông app (`staff.notif.sec.mfa_reset_self/_other`), nhật ký bảo mật |
| Thư | Tiêu đề "Security notice: 2-step verification was reset" / "Thông báo bảo mật: xác thực 2 bước đã được đặt lại"; bản cho người đó có câu "Lần đăng nhập tới bạn sẽ cài lại."; không có "bởi đội kỹ thuật OTTIMO" (chỉ `mfa_reset_by_operator` mới có) | Như cột trái |
| Lần đăng nhập sau | `MFA_REQUIRED_ROLES = owner, manager`; production `MFA_ENFORCED=true` (CI chặn khác) → phiên hạn chế, Desk mở `Enroll2faPage` (**Bật xác thực 2 bước**). Vai khác: 2 bước tắt, đăng nhập bằng mật khẩu. Bảo mật tài khoản khi tắt có nút `mfa.nudge_cta` **Bật ngay** | Vai quản lý: Desk tự mở màn bật, chưa xong không làm việc khác. Lễ tân trưởng: tự vào **Bảo mật tài khoản → Bật ngay** (quy định OTTIMO). Buồng phòng, bảo trì, sale, CTV: tùy chọn |
| App nhân viên (P4-50) | Phiên bị thu hồi → về màn đăng nhập; OWN/MGR chưa bật → `error.MFA_ENROLLMENT_REQUIRED` + `staff.mfa_enroll_desk`; người đã bật lại → bước nhập mã | `01` 1.8, sổ tay 3.1, `02` 1.8, `03`, `04` |
| Lỗi khác | 409 `INVALID_TRANSITION` (2 bước đã tắt ở chỗ khác) → đóng hộp, tải lại danh sách. 403 khi người đó có vai ở cơ sở khác (OTTIMO một cơ sở: không xảy ra) | Ghi 409 kèm cách đọc câu báo (xem F1) |

## 3. Câu BA thêm ngoài mã – xin SEC đọc (bug ghi "SEC đọc câu gặp tận mặt")

1. **Gặp tận mặt** giữ đúng SEC RN103-05. Thêm "không làm theo email; kể cả khi người nhắn biết tên đăng nhập hoặc xưng là đội kỹ thuật".
2. **Chưa gặp được ngay thì Khóa tài khoản trước**, gặp rồi mới đặt lại, rồi **Mở khóa**. Khóa không cần gặp vì chỉ chặn. Đặt lại 2 bước được cả với tài khoản đang khóa (`resetByOwner` không xét trạng thái; menu chỉ xét `mfaEnabled`).
3. **Làm lúc người đó ngồi cùng, bật lại ngay, "không để tài khoản chỉ còn mật khẩu qua đêm".** Sau khi đặt lại, tài khoản chỉ còn mật khẩu. Ai biết mật khẩu cũng tự bật 2 bước bằng điện thoại của mình được.
4. **Mật khẩu giữ nguyên**: nghi mật khẩu cũng lộ thì bấm thêm **Đặt lại mật khẩu**, đưa mật khẩu tạm tận tay.
5. **Lý do** (lưu trong nhật ký): ghi ngắn, không ghi số điện thoại, số giấy tờ hay tên khách.
6. **Tra nhật ký**: Desk chưa có màn xem. Chủ đầu tư nhắn Điều phối viên tên đăng nhập, không kèm lý do (cùng cách với nhật ký giấy tờ ở sổ tay 1.15).

## 4. Phát hiện kèm (không thuộc quyền BA sửa)

- **F1 – cho QA ghi lỗi, UXD + FE-A sửa (đề xuất P3).** Ở **Người dùng & vai**, khi đặt lại 2 bước nhận 409 `INVALID_TRANSITION`, `UsersPage.fail` → `problemView` hiện `error.INVALID_TRANSITION`: "Đơn vừa chuyển sang \"{status}\" nên thao tác này không còn dùng được. Tải lại để xem các nút hiện có." Câu nói về **Đơn**, và `{status}` không được thay: `argsFor` không có `status` cho lỗi này, mà `interpolate` giữ nguyên chỗ trống. Test `v104-users-fea` dòng 178 chỉ kiểm hộp đóng và danh sách tải lại, không kiểm chữ. Đề xuất: thêm khóa riêng (ví dụ `users.reset_2fa_stale`: "Xác thực 2 bước của {name} đã được tắt hoặc đặt lại. Danh sách vừa tải lại."), FE dùng khóa này cho `reset2fa`. Sổ tay đã ghi tạm: câu báo "có thể mở đầu bằng 'Đơn vừa chuyển sang…': lỗi chữ, đã báo đội". Sửa xong thì BA bỏ câu đó.
- **F2 – PO, release notes v1.0.4.** `release-notes.md` chưa có mục v1.0.4, nên BA không sửa. Khi viết, đề xuất một dòng ở "Có trong bản này": "**Đặt lại xác thực 2 bước** cho người khác (chủ đầu tư, **Người dùng & vai → Khác…**): người mất cả điện thoại lẫn mã khôi phục giữ tài khoản cũ; chủ đầu tư gặp tận mặt, ghi lý do, xác nhận bằng mật khẩu và mã. Thay cách khóa tài khoản rồi tạo tài khoản mới (sổ tay 1.5, `01` 1.9)." Dòng "Chưa có nút…" ở mục v1.0.3 giữ, vì đó là lịch sử.
- **F3 – QA chụp, UXD dựng.** Ảnh mới **C1-23** (hộp **Đặt lại xác thực 2 bước**, định nghĩa ở `screenshot-list.md`): người dùng giả vai Lễ tân trưởng đã bật 2 bước, email `qa.*@example.test`, ô trống, bấm **Hủy**. **C1-07** chụp lại trên v1.0.4 cho thấy **Khác…**, cùng lượt BUG-R4-023 (TC-V104-MF-15). Sau đó UXD dựng lại HTML (MN-01).
- **F4 – nhỏ, có từ trước, cho PO/DOM xem sau.** `05` mục 1.2 ghi "Sale/CTV không cần đăng nhập 2 bước", còn `01` 1.9 bước 8 ghi "Sale nội bộ, CTV… tự bật được, nên bật". BA không đổi ở lỗi này. Hàng mới ở `05` 1.6 viết cho người "đã tự bật".

## 5. Câu "không bật 2 bước ở v1.0.x" và phần "Ở v1.0.3" – đề xuất cho QC 7.4

**Đề xuất:** giữ tới ngày INV báo v1.0.4 đã lên production. Ngày đó BA gỡ trong **một commit** và dựng lại HTML cùng UXD.

**Lý do:**
- v1.0.3 đang chạy. Gỡ sớm thì buồng phòng, bảo trì, lễ tân trưởng có thể bật 2 bước trên v1.0.3 và mất app nhân viên (ARC RN103-02).
- Mỗi đoạn đã có hộp **Áp dụng từ v1.0.4** ngay dưới, ghi rõ đoạn cũ hết hiệu lực.
- Từ bản này, đường mất cả điện thoại lẫn mã luôn đặt **Từ v1.0.4** trước, **Ở v1.0.3** sau.

QC nhận hộp là đạt thì không cần làm gì thêm trước QC.

**Danh sách gỡ** (theo dòng trên nhánh này; chỉ thân bài, không đụng dòng lịch sử và dòng "Lập:"):

| Tệp | Chỗ |
|---|---|
| `user-manual-v1.0.md` | 0.4 phần **Ở v1.0.3** của 2 dòng (dòng 167, 168); 1.5 bước 7 nửa đầu tới "Sale nội bộ, CTV… nên bật." (375); câu dẫn khối **Đặt lại xác thực 2 bước** "Ở v1.0.3 chưa có nút…" (435); hộp **Khác…** bỏ vế "tới lúc đó các nút nằm thẳng trên dòng"; 3.1 hai đoạn "Chủ đầu tư và quản lý (có 2 bước) chưa đăng nhập được app…" và "Buồng phòng… không bật…" (1426, 1428), hộp 3.1 bỏ gạch "Lời dặn… hết hiệu lực"; 3.6 bước 1 "(không bật… – mục 3.1)" (1498); 4.1 câu dẫn "(không bật… – mục 3.1)" (1578) |
| `01-chu-dau-tu-quan-ly.md` | 1.7 phần **Ở v1.0.3** của 2 dòng (175, 176); 1.8 hai đoạn đầu (191 và đoạn "Hệ quả cho OTTIMO hiện nay"); 1.9 bảng vai cột 2 bước "Chưa (từ v1.0.4: …)" → giá trị v1.0.4; 1.9 bước 8 nửa đầu (228); đoạn "Nhân viên buồng phòng… đổi mật khẩu tạm trên `desk.ottimo.vn` trước…" (234); câu dẫn khối **Đặt lại xác thực 2 bước** (296); 17 dòng "Chủ đầu tư/quản lý chưa đăng nhập được app nhân viên" (932) |
| `02-le-tan.md` | 1.3 câu "chưa đăng nhập được app nhân viên ở v1.0" (76); 1.7 phần **Ở v1.0.3** (148); 1.8 đoạn đầu "Chỉ cho tài khoản Lễ tân trưởng không có vai quản lý…" (157), đoạn "Không bật…" (167), đoạn "Lần đầu… đổi mật khẩu tạm trên Desk trước" (169), hộp bỏ gạch "Đoạn… hết hiệu lực" (175) |
| `03-buong-phong.md` | Cách đọc (16); 1 câu "App nhân viên chưa có màn đổi mật khẩu tạm" (39); 1.3 dòng bảng "Ngay lần đăng nhập đầu… Chưa tải được việc hôm nay" (74); 1.6 gạch "Không bật…" (106) và vế "Lời dặn… hết hiệu lực" (108); 12 dòng "App chưa có màn đổi mật khẩu tạm" (320) |
| `04-bao-tri.md` | Cách đọc (16); 1 câu "App nhân viên chưa có màn đổi mật khẩu tạm" (43); 1.5 đoạn "Không bật…" (109) và vế "Lời dặn… hết hiệu lực" (111); 9 dòng "App chưa có màn đổi mật khẩu tạm" (284) |
| `05-sale-ctv.md` | 1.6 vế "Ở v1.0.3: …" (93) |
| `00-index.md` | 2.1 gạch "Chưa vào được app nhân viên…" (44) viết lại theo dòng **Từ v1.0.4** ngay dưới |

Cùng commit đó: bỏ chữ "**Từ v1.0.4:**" thừa ở các ô đã chỉ còn một đường, và đổi dòng "Áp dụng cho" ở đầu mỗi tệp sang `v1.0.4`.

## 6. Tệp đã sửa

- `product/docs/manual/user-manual-v1.0.md` – đầu tệp, 0.3a, 0.4, 1.5 (hộp **Khác…**, danh sách, khối mới), 3.1, 5.7 (dòng 1.12)
- `product/docs/manual/guides/00-index.md` – đầu tệp, 2.1, 7 (dòng 1.10)
- `product/docs/manual/guides/01-chu-dau-tu-quan-ly.md` – đầu tệp, 1.6a, 1.7, 1.8, 1.9 (hộp **Khác…**, danh sách, bước 8, khối mới), 14.1, 17, 18.2
- `product/docs/manual/guides/02-le-tan.md` – đầu tệp, 1.7, 1.8
- `product/docs/manual/guides/03-buong-phong.md` – đầu tệp, 1.5, 1.6
- `product/docs/manual/guides/04-bao-tri.md` – đầu tệp, 1.5
- `product/docs/manual/guides/05-sale-ctv.md` – đầu tệp, 1.6
- `product/docs/manual/screenshot-list.md` – C1-23, ghi chú C1-07
- `product/docs/manual/guides/screenshot-additions.md` – ghi chú v1.0.4
- `01-decisions/decision-log.md` – một dòng BA (cách trình bày, mục 5)

Không có ESC mới. Không có dữ liệu khách hay địa chỉ thật; ví dụ email chỉ dùng `@example.test` (có sẵn).
