# SEC review – PR #63, BUG-R4-032: sổ tay "Đặt lại xác thực 2 bước"

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: nhánh `v104/ba-2fa-reset-manual` @ **`f8d87d3a`** (1 commit). Đọc bằng `git diff origin/main...f8d87d3a`. Diff có 11 tệp, đều là tài liệu:
  - sổ tay 1.12 và bộ hướng dẫn `00`–`05`;
  - `screenshot-list.md`, `screenshot-additions.md`;
  - một dòng decision-log;
  - `rounds/round-04/responses/BA-BUG-R4-032.md`.
- Căn cứ:
  - mã P4-30 trên `origin/main`: `mfa.controller.ts` (`resetUser2fa`), `mfa.service.ts` (`resetByOwner`), `mfa-store.ts` (`clear`, `email`), `strong-reauth.ts`, `users.service.ts` (khóa tài khoản), `session.service.ts`;
  - SEC "RN103-05 – SEC chốt" (`DOM-on-release-notes-v1.0.3.md`, 03/11).
- Không sửa tệp nào ngoài tệp này. Không chạy lệnh nào trên staging/production.

## 0. Kết luận

**ĐẠT.** Không có Blocker, Major hay Minor. Có 2 thẻ Suggestion, không chặn gộp.

### 0.1 Mô tả trong sổ tay so với mã

| Sổ tay ghi | Mã trên `main` | Khớp |
|---|---|---|
| Chỉ chủ đầu tư, không tự đặt lại cho mình | `x-roles: [owner]`; `userId === p.userId` → 422 `NOT_ALLOWED` ở cả controller và service | Có |
| Xác thực lại bằng **mật khẩu + mã 6 số**; sai 5 lần chờ khoảng 15 phút; mỗi lần xác nhận cần mã mới | `StrongReauth.verify` trước unit of work: mật khẩu + đúng một trong hai `totpCode` / `recoveryCode`; 5 lần sai → khóa 15 phút → 429; TOTP chống dùng lại theo bước | Có. Sổ tay không nhắc mã khôi phục: chỗ này thiếu nhưng không sai |
| Lý do bắt buộc, ít nhất 3 ký tự | `resetSchema` 3–300 ký tự sau khi cắt khoảng trắng | Có |
| Chỉ hiện với người đã bật 2 bước; 2 bước đã tắt → báo, tải lại | `!u.mfa_enabled` → 409 `INVALID_TRANSITION` | Có. Lỗi chữ 409 đã ghi ở F1 |
| **Đăng xuất mọi máy**, kể cả điện thoại bị mất (Desk và app nhân viên) | `sessions.revokeAll(tx, u.id, 'mfa_reset')`, cùng giao dịch. Phiên gồm cả `admin` lẫn `staff_pwa` | Có |
| **Mã khôi phục cũ** và mục OTTIMO trong ứng dụng cũ hết hiệu lực | `clear`: `mfa_enabled = false`, xóa `mfa_secret_enc`, `mfa_pending_secret_enc`, `mfa_recovery_codes_hash`, `mfa_last_used_step`; khóa mã hóa được hủy sau giao dịch | Có |
| **Mật khẩu giữ nguyên** | `resetByOwner` không đụng `password_hash` | Có |
| Thư tới người đó (nếu có email) và **mọi chủ đầu tư**; chuông app | `email(tx, 'mfa_reset', u.id, { owners: true })`: payload chỉ có mẫu và id, **không có lý do**; `notify(…, { owners: true })` | Có |
| **Nhật ký bảo mật**: ai, cho ai, lúc nào, lý do | `record('mfa.reset_by_owner', …, { reason, requestId, after: { targetUserId } })` | Có |
| Đặt lại được cả khi tài khoản đang khóa | `resetByOwner` không xét `status` | Có |
| Chưa gặp được ngay thì **Khóa tài khoản trước** | Khóa (`status = disabled`) cũng gọi `revokeAll(…, 'disabled')`: phiên trên điện thoại bị mất cũng bị cắt | Có. Đây chính là lý do bước khóa trước có ích (thẻ S1) |
| Lần đăng nhập sau: vai quản lý bị ép bật lại; vai khác chỉ cần mật khẩu | `MFA_REQUIRED_ROLES = owner, manager`, production `MFA_ENFORCED=true` (theo BA mục 2; mã trên `main`) | Có |

### 0.2 Sáu câu BA thêm ngoài mã (mục 3 của response)

| # | Câu | SEC |
|---|---|---|
| 1 | Gặp tận mặt; không làm theo tin nhắn, cuộc gọi hay email, kể cả khi người nhắn biết tên đăng nhập hay xưng là đội kỹ thuật | **Đồng ý.** Đúng RN103-05. Biết tên đăng nhập không chứng minh danh tính, nên câu này chặn kiểu mạo danh "hỗ trợ kỹ thuật" |
| 2 | Chưa gặp được ngay thì Khóa trước, gặp rồi mới đặt lại, rồi Mở khóa | **Đồng ý.** Khóa chỉ chặn, không trao quyền; mã xác nhận khóa cũng cắt mọi phiên. Thứ tự đặt lại → mở khóa đúng: tài khoản không mở lại khi còn bí mật 2 bước cũ |
| 3 | Làm lúc người đó ngồi cùng, bật lại ngay, không để tài khoản chỉ còn mật khẩu qua đêm | **Đồng ý, và đây là câu quan trọng nhất.** Sau khi đặt lại, ai có mật khẩu đều tự cài 2 bước bằng điện thoại **của mình** được. Với vai quản lý, Desk còn tự mở màn bật, nên kẻ có mật khẩu sẽ được dẫn thẳng vào bước cài. Bật lại ngay trong buổi ngồi cùng sẽ đóng khoảng hở này |
| 4 | Mật khẩu giữ nguyên; nghi lộ thì Đặt lại mật khẩu, đưa mật khẩu tạm tận tay | **Đồng ý.** Có góp ý làm rõ khi nào coi là "nghi lộ" (thẻ S1) |
| 5 | Lý do ngắn, không ghi số điện thoại, số giấy tờ hay tên khách | **Đồng ý.** Lý do nằm trong nhật ký lâu dài, không vào thư. Câu này giữ dữ liệu cá nhân ra khỏi audit |
| 6 | Tra nhật ký: nhắn Điều phối viên tên đăng nhập, không kèm lý do | **Đồng ý.** Cùng cách với nhật ký giấy tờ (1.15). ORC nhận tên đăng nhập qua chat thì **không** ghi vào repo, kể cả decision-log (RN103-05 ý 3: ca thật chỉ ghi "1 tài khoản … được đặt lại" kèm giờ) |

### 0.3 Các kiểm khác

| Kiểm | Kết quả |
|---|---|
| Có dạy cách vòng làm yếu bảo mật không | **Không.** Mọi đường mới đều đòi chủ đầu tư dùng S2 trên máy riêng và gặp tận mặt. Vẫn giữ "không nhờ đội kỹ thuật đặt lại 2 bước" và "Đặt lại mật khẩu không gỡ 2 bước". Lời dặn "không bật 2 bước ở v1.0.x" chỉ hết hiệu lực từ v1.0.4, có hộp ghi rõ. Không chỗ nào gợi ý tắt 2 bước của vai quản lý, dùng chung mã hay xin mã của người khác |
| Chi tiết nội bộ không nên công khai (repo công khai) | **Không có.** Không IP, email thật, số điện thoại, tên máy chủ, đường dẫn máy chủ, tên lệnh 06.33 hay mã phiếu. Thủ tục của chủ đầu tư vẫn "không ghi trong tài liệu này". Ngưỡng "5 lần / 15 phút" là hành vi người dùng thấy được, không phải bí mật. Tên khóa chuỗi và hàm chỉ có trong response và decision-log; mã đã công khai trong repo |
| Câu dự phòng v1.0.3 (RN103-05) | **Đúng.** Sổ tay 0.4 và `01` 1.7, phần **Ở v1.0.3**: (1) khóa tài khoản ngay; (2) thêm người dùng mới, tên đăng nhập mới, đúng vai cũ; (3) mật khẩu tạm tận tay, bật 2 bước trên điện thoại mới; (4) nhập email nhận thông báo ngay sau đó (vai quản lý bắt buộc có email); tài khoản cũ khóa, không xóa; gặp tận mặt; không nhờ đội. Dòng buồng phòng, bảo trì, lễ tân trưởng: bước (1)–(3), tài khoản mới không bật 2 bước (RN103-02). Từ v1.0.4 đường chính là nút mới, 1.7 thành dự phòng, đúng câu chốt "Khi nút đó lên, nó thành cách chính, còn 1.7 thành dự phòng". Phạm vi 06.33 (chỉ chủ đầu tư duy nhất) không đổi |
| Thư "2-step verification was reset" | **Đúng.** Khi chính chủ đầu tư bấm: biết trước, không cần làm gì. Thư ghi "bởi đội kỹ thuật OTTIMO" mà chủ đầu tư không đang làm thủ tục khôi phục: gọi đội theo số đã biết, không gọi số trong thư. Mẫu `mfa_reset` không có câu đó, chỉ `mfa_reset_by_operator` có |
| Giữ câu "không bật 2 bước ở v1.0.x" tới khi v1.0.4 lên (BA mục 5) | **SEC đồng ý.** Gỡ sớm thì người dùng app nhân viên có thể bật 2 bước trên v1.0.3 và mất app (ARC RN103-02). Hộp **Áp dụng từ v1.0.4** đủ rõ. Danh sách gỡ trong một commit là cách hợp lý |

## 1. Thẻ

### FB-R4-SEC-BA-R4032-S1
- Mức độ: Suggestion
- Vị trí: sổ tay 1.5 khối **Đặt lại xác thực 2 bước**, ý "Mật khẩu giữ nguyên…" và ý "Trước khi bấm"; `01` 1.9 cùng khối.
- Vấn đề:
  - "Nghi mật khẩu cũng đã lộ" chỉ có một ví dụ (ghi trên giấy để cùng điện thoại). Chủ đầu tư cần một quy tắc dễ áp dụng hơn. Hai trường hợp hay gặp là điện thoại **bị lấy cắp** (không phải rơi, hỏng), và mật khẩu Desk **có lưu trên chính điện thoại đó** (trình duyệt tự điền, ghi chú, trình quản lý mật khẩu không khóa riêng). Trong cả hai, kẻ cầm điện thoại có mật khẩu. Sau khi đặt lại 2 bước, tài khoản chỉ còn mật khẩu.
  - Ý "Chưa gặp được ngay: Khóa tài khoản trước" không nói vì sao. Khóa cũng **đăng xuất người đó trên mọi máy**, kể cả app nhân viên trên điện thoại bị mất. Ghi rõ ý này thì chủ đầu tư có lý do để khóa ngay, kể cả lúc nửa đêm.
- Đề xuất:
  - đổi ý mật khẩu thành: "Mật khẩu giữ nguyên. **Đặt lại mật khẩu luôn** (Khác… → Đặt lại mật khẩu, mật khẩu tạm đưa tận tay) khi điện thoại bị lấy cắp, khi mật khẩu Desk có lưu hay ghi trên điện thoại đó, hoặc khi không chắc";
  - thêm vào ý Khóa: "(Khóa cũng đăng xuất người đó trên mọi máy, kể cả điện thoại bị mất.)";
  - cùng ý ở `02` 1.7, `03`, `04`, `05` nếu có chỗ nói "mật khẩu như cũ".
- Trạng thái: Open

### FB-R4-SEC-BA-R4032-S2
- Mức độ: Suggestion
- Vị trí: `01` mục 1.7 dòng 187 "Không ai trong Desk đặt lại được mật khẩu hay 2 bước cho chủ đầu tư."; sổ tay 0.4 dòng chủ đầu tư.
- Vấn đề: câu này chỉ đúng khi OTTIMO có **một** tài khoản chủ đầu tư (ESC-027 = B). API v1.0.4 cho chủ đầu tư này đặt lại 2 bước của chủ đầu tư **khác** (đường ESC-027 A trong `openapi.yaml` 0.3.8). Menu **Khác…** cũng hiện ở mọi dòng không phải của mình, miễn người đó đã bật 2 bước. Nếu sau này INV thêm tài khoản chủ đầu tư thứ hai (đồng đầu tư, người thay mặt), câu trên thành sai, và người đọc có thể tin rằng tài khoản của mình không bị ai đặt lại được. Hiện tại thì câu đúng, và thư `mfa_reset` tới mọi chủ đầu tư vẫn báo nếu có ai đặt lại.
- Đề xuất: thêm vế "(OTTIMO chỉ có một tài khoản chủ đầu tư. Muốn thêm tài khoản chủ đầu tư thứ hai thì báo đội trước: khi đó hai chủ đầu tư đặt lại 2 bước cho nhau được)". Khi BA gỡ phần v1.0.3 (mục 5) thì làm cùng, không cần commit riêng.
- Trạng thái: Open

## 2. Điểm làm tốt
- Mỗi câu mô tả đều dẫn tới mã và chuỗi chữ thật. Câu nào BA tự thêm thì tách riêng để SEC đọc, nên SEC kiểm được từng câu.
- Hai bước "Khóa trước khi chưa gặp được" và "bật lại ngay, không để qua đêm" đóng đúng hai khoảng hở thật của tính năng: phiên còn sống trên máy bị mất, và tài khoản chỉ còn mật khẩu sau khi đặt lại.
- Giữ đường v1.0.3 đúng RN103-05 trong cùng ô, đường v1.0.4 đặt trước. Không gỡ lời dặn cũ trước ngày lên bản.

## 3. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – PR #63 BUG-R4-032 (v104/ba-2fa-reset-manual @ f8d87d3a, chỉ tài liệu): ĐẠT** (rounds/round-04/reviews/SEC-on-v104-bug-r4-032.md): khối Đặt lại xác thực 2 bước khớp mã P4-30 trên main (chỉ OWN, không tự làm cho mình, S2 mật khẩu + mã, lý do 3–300, revokeAll gồm app nhân viên, xóa bí mật + mã khôi phục, giữ mật khẩu, thư mfa_reset không chứa lý do tới người đó + mọi OWN, audit mfa.reset_by_owner); 6 câu BA thêm đều đồng ý; không chi tiết nội bộ; dự phòng v1.0.3 đúng RN103-05. Suggestion S1 (đặt lại mật khẩu luôn khi điện thoại bị lấy cắp hoặc có lưu mật khẩu; khóa cũng đăng xuất mọi máy), S2 (câu "không ai đặt lại cho chủ đầu tư" chỉ đúng khi một OWN) | SEC | Quyền SEC |`

## Phản hồi BA (04/11/2026, lượt 2 của PR #63)

- **FB-R4-SEC-BA-R4032-S1 – Fixed.** Khối mới (sổ tay 1.5, `01` 1.9): "Đặt lại mật khẩu luôn… khi điện thoại bị lấy cắp, khi mật khẩu Desk có lưu hay ghi trên điện thoại đó, hoặc khi không chắc"; thêm gạch "Chưa gặp được ngay: Khóa tài khoản trước. Khóa cũng đăng xuất người đó trên mọi máy, kể cả điện thoại bị mất" ở **Trước khi bấm** và cùng vế ở dòng sổ tay 0.4 / `01` 1.7.
  - Người mất máy được dặn "nói với chủ đầu tư để đặt lại mật khẩu luôn" ở `02` 1.7, `03` 1.5, `04` 1.5, `05` 1.6.
- **FB-R4-SEC-BA-R4032-S2 – Fixed.** Sổ tay 0.4 dòng chủ đầu tư và `01` 1.7 câu cuối: "OTTIMO chỉ có một tài khoản chủ đầu tư, nên không ai trong Desk đặt lại được mật khẩu hay 2 bước cho chủ đầu tư. Muốn thêm tài khoản chủ đầu tư thứ hai thì báo đội trước: khi đó hai chủ đầu tư đặt lại được mật khẩu và 2 bước cho nhau." Vế "mật khẩu" theo `users.service` (resetPassword, status chỉ chặn chính mình). Làm ngay ở lượt này, không chờ nhánh gỡ v1.0.3.

## SEC review lại @ 8192e26b (04/11/2026, lượt 2 của PR #63)

- Đối tượng: `git diff f8d87d3a..8192e26b` (`8192e26bcc9f6559ae6a242b283e5ae6dd6aea55`). Diff có 8 tệp, đều là tài liệu: sổ tay, `00`–`05`, `rounds/round-04/responses/BA-BUG-R4-032.md`.
- Căn cứ:
  - mã trên `origin/main` @ `58183764`: `mfa-store.ts` (`MFA_REQUIRED_ROLES`), `auth.service.ts` (ép 2 bước khi `mfaEnforced`), `mfa.service.ts` (`disable`, `assertState`), `users.service.ts` (`updateUser`: `resetPassword`, `status`), `schema/identity.ts` (`STAFF_ROLES`), `strings-vi.json`, `infra/server/env.production.example`;
  - PR #65 `origin/v104/users-2fa-stale` @ `6b346d85`: khóa `users.reset_2fa_stale`, `UsersPage.stale2fa`;
  - `rounds/round-04/reviews/PO-on-v104-bug-r4-032.md` (thẻ 01–04), ESC-027 (= B).
- Không sửa tệp nào ngoài tệp này, không commit, không đụng nhánh BA. Thử gộp bằng `git merge-tree`: không tạo nhánh, không đổi ref.

### Kết luận lượt 2: ĐẠT

- Không Blocker, không Major. Có 1 Minor (thẻ 03) và 3 Suggestion (thẻ 04–06). Không thẻ nào chặn gộp.
- Thứ tự gộp theo PO thẻ 04: #65 gộp trước hoặc cùng #63. Gộp #63 trước thì sổ tay tả một câu Desk chưa có. Đây là lỗi đúng/sai chữ, không phải lỗi bảo mật.

### 1. S1, S2 đã đúng ý chưa

| Thẻ | Lượt 2 ghi | Đối chiếu mã | SEC |
|---|---|---|---|
| S1 ý 1: đặt lại mật khẩu luôn | Sổ tay 1.5 và `01` 1.9, phần **Desk tự làm**: "**Đặt lại mật khẩu luôn**… khi điện thoại bị lấy cắp, khi mật khẩu Desk có lưu hay ghi trên điện thoại đó (trình duyệt tự điền, ghi chú, giấy để cùng điện thoại), hoặc khi không chắc". Người mất máy được dặn "nói với chủ đầu tư để đặt lại mật khẩu luôn" ở `02` 1.7, `03` 1.5, `04` 1.5, `05` 1.6 | `resetByOwner` không đụng `password_hash`, nên mật khẩu cũ còn hiệu lực | **Đúng ý.** Đủ ba trường hợp, có ví dụ dễ nhận ra. Vế "hoặc khi không chắc" cho chủ đầu tư một quy tắc mặc định an toàn |
| S1 ý 2: khóa cũng đăng xuất | **Trước khi bấm**: "Khóa cũng đăng xuất người đó trên mọi máy, kể cả điện thoại bị mất. Gặp rồi mới đặt lại, xong thì **Mở khóa**". Cùng vế ở sổ tay 0.4 và `01` 1.7 | `updateUser` `status = disabled` → `revokeAll(tx, userId, 'disabled')`, cắt cả phiên `admin` lẫn `staff_pwa` | **Đúng ý** |
| S2: câu "không ai đặt lại cho chủ đầu tư" | Sổ tay 0.4 và `01` 1.7: "OTTIMO chỉ có một tài khoản chủ đầu tư, nên không ai trong Desk đặt lại được mật khẩu hay 2 bước cho chủ đầu tư. Muốn thêm tài khoản chủ đầu tư thứ hai thì báo đội trước: khi đó hai chủ đầu tư đặt lại được mật khẩu và 2 bước cho nhau." | `updateUser` chỉ chặn chính mình (`NOT_ALLOWED_FOR_SELF`). Riêng email thì chặn khi người đó là OWN (`assertNotOwnerAccount`). `resetPassword` và `status` lên OWN khác thì không chặn. `resetByOwner` chỉ chặn chính mình. Mọi `users.*` chỉ OWN gọi được, nên quản lý không làm được | **Đúng ý.** BA thêm vế "mật khẩu" và đã kiểm `users.service` trước khi viết, nên câu đúng hơn đề xuất của SEC. Còn một chỗ nên làm rõ: tài khoản thứ hai phải là của người khác (thẻ 05) |

### 2. Lượt 2 có câu nào làm yếu bảo mật không

| Câu mới | SEC |
|---|---|
| **Trước khi bấm**: "**Quản lý và lễ tân trưởng** … bật lại 2 bước ngay buổi đó, không để tài khoản chỉ còn mật khẩu qua đêm. Vai khác: bước 4, 5" (PO 01) | **Đồng ý.** Khoảng hở "ai có mật khẩu cũng tự cài 2 bước bằng điện thoại của mình" nặng nhất ở vai quản lý, vì Desk tự mở màn bật. Lễ tân trưởng bắt buộc theo mặc định nên cũng thuộc nhóm này. Vai tùy chọn trở về đúng trạng thái trước khi bật. Phần mật khẩu của các vai này đã có S1 lo |
| Bước 4: "**Sale nội bộ, CTV:** … **Nên bật lại ngay buổi đó** như bước 3 (không bắt buộc)" | **Đồng ý.** Khớp mã (mục 3) |
| Bước 5: "**Buồng phòng, bảo trì:** tùy chọn. Không bật lại thì tài khoản chỉ có mật khẩu, như trước khi bật" | **Đồng ý.** Đúng DOM B.1 (decision-log 04/11). Đây không phải vai quản lý, và câu không gợi ý tắt 2 bước của ai |
| Lễ tân trưởng: "bắt buộc – mặc định đội chọn…; anh/chị đổi được" (PO 03) | **Không làm yếu.** Câu nói đúng hai điều: Desk chưa ép, và chủ đầu tư chưa chốt. Góp ý thêm: ghi "báo đội" ở mọi chỗ (thẻ 06) |
| 409: "Hộp tự đóng, danh sách tải lại, rồi Desk báo 'Đã có người đổi xác thực 2 bước của {tên} trước bạn…'. Không bấm lại." | **Khớp #65:** `stale2fa` đóng hộp, tải lại danh sách rồi hiện câu thông tin. Chữ đúng `strings-vi.json` của #65. Câu chỉ hiện cho OWN, không lộ gì thêm. **Thiếu** việc làm tiếp khi 409 không do chính chủ đầu tư gây ra (thẻ 03) |
| `05` 1.2: cách bật 2 bước, 4 bước | **Đúng chữ Desk:** `mfa.installed`, `mfa.enroll_start`, `mfa.manual_key_label`, `auth.enroll.download`, `mfa.codes_ack_apart`, `mfa.finish`, `mfa.nudge_cta`, `shell.account_security`. Có "Không in, không tải trên máy quầy. Không chụp ảnh, không gửi qua chat". Thiếu hai vế so với `02` 1.3 (thẻ 04) |

- **Đường vòng, dùng chung mã:** Không câu nào dạy đường vòng, gợi ý tắt 2 bước cho vai quản lý, dùng chung mã hay xin mã của người khác. Vẫn giữ các câu "không nhờ đội kỹ thuật đặt lại 2 bước", "Đặt lại mật khẩu không gỡ 2 bước", "không làm theo tin nhắn hay cuộc gọi".
- **Chi tiết nội bộ:** không lộ. Đã quét mọi dòng thêm mới. Email chỉ có `info@` dạng hộp thư chung. Không IP, không chuỗi số dài, không tên đăng nhập thật, không tên máy chủ, đường dẫn hay lệnh 06.33. Tên khóa chuỗi (`users.reset_2fa_stale`…) chỉ nằm ở dòng lịch sử và tệp phản hồi; mã đã công khai trong repo.

### 3. "Không bắt buộc – nên bật" cho sale/CTV so với `MFA_ENFORCED`

**Khớp.**
- `MFA_REQUIRED_ROLES = ['owner', 'manager']` (`mfa-store.ts:73`). Lúc đăng nhập, Desk chỉ ép khi `mfaEnforced === true && requiresMfa(...)` (`auth.service.ts:204`). Production `MFA_ENFORCED=true`: `env.production.example`, `deploy.sh` từ chối nếu khác.
- `sales_staff` và `collaborator` không có trong danh sách. Vì vậy Desk không ép họ. Họ tự bật được trên Desk (từ v1.0.3), và tự tắt được (`disable` chỉ chặn vai bắt buộc).
- Người kiêm vai quản lý vẫn bị ép. Bước 2 "Vai quản lý (kể cả người trực)" đã nói ý này.
- Bảng vai không ghi "từ v1.0.4" cho sale/CTV. Đúng, vì họ chỉ dùng Desk và bật được từ v1.0.3.

### 4. Thẻ mới

#### FB-R4-SEC-BA-R4032-03
- Mức độ: Minor. Không chặn gộp. Làm trong nhánh gỡ "v1.0.x" (PO thẻ 05, trước QC 08/11), hoặc ngay nếu BA còn lượt 3.
- Vị trí: sổ tay 1.5, khối **Đặt lại xác thực 2 bước**, gạch "Hộp tự đóng, danh sách tải lại, rồi Desk báo 'Đã có người đổi…'". `01` 1.9, cùng gạch.
- Vấn đề:
  - Câu mới dừng ở "Không bấm lại. Trong **Khác…** của người đó không còn **Đặt lại xác thực 2 bước**." Câu không nói chủ đầu tư làm gì tiếp.
  - Khối này dùng khi người đó đã mất cả điện thoại lẫn mã khôi phục, và OTTIMO chỉ có một chủ đầu tư. Khi đó 409 chỉ có hai nguồn: (a) chính chủ đầu tư vừa làm ở tab hay máy khác; (b) người có mật khẩu và đang cầm chiếc điện thoại bị mất đã **Tắt xác thực 2 bước**. Tắt cần mật khẩu và mã, mà ứng dụng xác thực nằm trên máy bị mất. Người đó không tự tắt được, vì đã mất cả hai.
  - Ca (b) xảy ra được với mọi vai ngoài chủ đầu tư và quản lý, kể cả lễ tân trưởng: `MfaService.disable` chỉ chặn `MFA_REQUIRED_ROLES`.
  - Khi tắt, Desk chỉ báo cho chính người đó (`notify(tx, userId, 'mfa.disabled')`, không có `owners`, không gửi thư). Chủ đầu tư không có tín hiệu nào khác ngoài câu 409 này. Sau đó tài khoản chỉ còn mật khẩu, mà người kia biết mật khẩu.
  - Lễ tân trưởng (bắt buộc theo mặc định) đọc "Không bấm lại" thì dễ bỏ luôn bước bật lại.
- Vì sao quan trọng: câu 409 là dấu hiệu duy nhất cho thấy người cầm máy có thể đã vào tài khoản. Vế S1 "Đặt lại mật khẩu luôn… khi không chắc" nằm ở phần **Desk tự làm**, phần chỉ xảy ra khi đặt lại thành công. Người gặp 409 dễ không đọc tới đó.
- Đề xuất sửa: thay hai câu cuối của gạch bằng: "Không bấm lại. Anh/chị không vừa làm ở tab hay máy khác: coi như người cầm điện thoại đã vào tài khoản. **Đặt lại mật khẩu** ngay (**Khác… → Đặt lại mật khẩu**, mật khẩu tạm đưa tận tay), rồi người đó làm tiếp như phần **Người đó làm tiếp**."
  - Lệnh tắt đã đăng xuất người đó trên mọi máy (`revokeAll(…, 'mfa_disabled')`), nên chỉ còn mật khẩu phải đổi.
  - Vai quản lý không tự tắt được. 409 ở vai quản lý chỉ do chính anh/chị, nên làm tiếp từ bước 2. Không cần ghi câu này nếu muốn ngắn.
- Trạng thái: Open

#### FB-R4-SEC-BA-R4032-04
- Mức độ: Suggestion
- Vị trí: `05-sale-ctv.md` mục 1.2, đoạn **Đăng nhập 2 bước**, bước 3.
- Vấn đề:
  - Bước này ghi "Bấm **In** hoặc **Tải về (.txt)**, cất 2 nơi tách khỏi điện thoại (tải về thì chép xong xóa tệp)". Câu ngắn hơn `02` 1.3 bước 5 và sổ tay 0.3 bước 5: thiếu "lấy giấy ngay khỏi máy in", "chép vào trình quản lý mật khẩu" và "dọn thùng rác".
  - Sale/CTV hay dùng Desk trên điện thoại (bảng vai `01` 1.9: "Desk (điện thoại hoặc máy tính)"). Bấm **Tải về** trên chính điện thoại có ứng dụng xác thực thì mã khôi phục nằm cùng máy với ứng dụng. Mất máy là mất cả hai, đúng ca phải nhờ chủ đầu tư đặt lại.
- Đề xuất: dùng nguyên câu của `02` 1.3 bước 5, thêm "Làm trên điện thoại thì không tải mã về chính điện thoại đó."
- Trạng thái: Open

#### FB-R4-SEC-BA-R4032-05
- Mức độ: Suggestion
- Vị trí: sổ tay 0.4, dòng "Chủ đầu tư mất cả điện thoại lẫn mã khôi phục". `01` 1.7, câu cuối.
- Vấn đề:
  - Câu "Muốn thêm tài khoản chủ đầu tư thứ hai" có thể bị đọc là thêm một tài khoản thứ hai **cho chính anh/chị**, để tự đặt lại cho mình khi mất máy.
  - Cách đó bỏ qua luật "không ai tự đặt lại 2 bước cho mình" và bước xác minh danh tính của thủ tục khôi phục đã diễn tập. Nó cũng tạo thêm một tài khoản toàn quyền phải giữ.
  - INV đã chọn ESC-027 = B (một tài khoản chủ). Phương án A của ESC-027 nói về **người khác** mà anh/chị tin cậy, ví dụ đồng sở hữu.
- Đề xuất: "Muốn thêm tài khoản chủ đầu tư cho một người khác anh/chị tin cậy (ví dụ đồng sở hữu) thì báo đội trước: người đó có toàn quyền như anh/chị, và hai chủ đầu tư đặt lại được mật khẩu và 2 bước cho nhau. Không tạo tài khoản chủ đầu tư thứ hai cho chính mình."
- Trạng thái: Open

#### FB-R4-SEC-BA-R4032-06
- Mức độ: Suggestion, làm ở nhánh gỡ "v1.0.x".
- Vị trí:
  - sổ tay 0.4 và `01` 1.7, dòng "Buồng phòng, bảo trì, lễ tân trưởng…";
  - khối mới bước 3;
  - bảng vai, dòng lễ tân trưởng ("anh/chị đổi được");
  - `02` 1.8 ("chủ đầu tư đổi được");
  - `02` 1.7, đoạn "Lỡ bật… **Tắt xác thực 2 bước**".
- Vấn đề:
  - Lễ tân trưởng bắt buộc 2 bước theo mặc định. Nhưng Desk v1.0.4 vẫn cho lễ tân trưởng tự tắt (`disable` chỉ chặn owner, manager), và không báo chủ đầu tư khi tắt. Khi gỡ đoạn v1.0.x, đoạn "Lỡ bật → Tắt" mất đi. Sau đó `02` không còn câu nào nói về việc tắt, kể cả câu dặn lễ tân trưởng không tự tắt.
  - Bước 7/8 ghi "(anh/chị đổi được, báo đội)", còn các chỗ mới chỉ ghi "anh/chị đổi được".
  - v1.0.5 dự kiến thêm `front_desk_lead` vào `MFA_REQUIRED_ROLES` (decision-log 04/11, DOM mục (a)). Nếu chủ đầu tư đổi mặc định mà đội không biết, v1.0.5 sẽ ép ngược ý chủ đầu tư.
- Đề xuất, khi gỡ đoạn v1.0.x:
  - (1) `02` 1.8 thêm: "Không tự tắt 2 bước (Desk chưa chặn tới v1.0.5). Cần tắt thì hỏi chủ đầu tư.";
  - (2) ghi thống nhất "anh/chị đổi được, báo đội" ở mọi chỗ.
- Trạng thái: Open

### 5. Ghi chú cho ORC
- Thứ tự gộp: #65 → #63 → #68.
- #68 xung đột với #63 ở 4 tệp, nhưng chỉ ở dòng "Lập:" và bảng phiên bản (xem `SEC-on-v104-pr68-docs.md` mục 5). Gộp thử xong, các câu S1, S2 vẫn còn.
- Đề xuất cho backlog v1.0.5, cùng việc thêm `front_desk_lead` vào `MFA_REQUIRED_ROLES`: khi một vai không bắt buộc tự tắt 2 bước, gửi chuông và thư tới mọi OWN (`notify`/`email` với `owners: true` cho `mfa.disabled`). Việc này không thuộc PR #63.
- Không ESC mới.

### 6. Điểm làm tốt (lượt 2)
- Trước khi viết vế "mật khẩu" của S2, BA đã đối chiếu `users.service`. Nhờ vậy câu đúng hơn đề xuất của SEC.
- Bước 4 và 5 được tách theo vai. Chủ đầu tư làm đúng mức với từng người: không ép vai tùy chọn, không bỏ sót vai bắt buộc.
- `05` có cách bật 2 bước ngay trong tệp của sale/CTV, và giữ đủ "không in, không tải trên máy quầy; không chụp, không gửi qua chat".

### 7. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC review lại PR #63 BUG-R4-032 (v104/ba-2fa-reset-manual @ 8192e26b, chỉ tài liệu): ĐẠT** (rounds/round-04/reviews/SEC-on-v104-bug-r4-032.md mục "SEC review lại @ 8192e26b"): S1 (đặt lại mật khẩu luôn khi bị lấy cắp/lưu mật khẩu/không chắc; khóa cũng đăng xuất mọi máy) và S2 (một OWN; vế "hai OWN đặt lại mật khẩu và 2 bước cho nhau" khớp users.service) đúng ý; lượt 2 không dạy đường vòng, không gợi ý tắt 2 bước vai quản lý, không lộ chi tiết nội bộ; "Không bắt buộc – nên bật" cho sale/CTV khớp MFA_REQUIRED_ROLES = owner, manager. Minor 03 (câu 409 users.reset_2fa_stale: không phải chính OWN làm thì Đặt lại mật khẩu ngay), Suggestion 04 (05 1.2 cất mã khôi phục như 02 1.3), 05 (OWN thứ hai là người khác, theo ESC-027 = B), 06 (nhánh gỡ: FDL không tự tắt 2 bước, "báo đội"); không chặn gộp, gộp sau hoặc cùng #65 | SEC | Quyền SEC |`

## Phản hồi BA (04/11/2026, lượt 3 của PR #63)

- **FB-R4-SEC-BA-R4032-03 – Fixed** ở `0e47791d`. Sổ tay 1.5 và `01` 1.9, gạch câu `users.reset_2fa_stale` tách hai ca. Anh/chị vừa đặt lại ở tab hay máy khác thì người đó làm tiếp. Không phải anh/chị thì coi như người cầm điện thoại bị mất đã vào tài khoản và tự tắt 2 bước: **Đặt lại mật khẩu ngay** (**Khác… → Đặt lại mật khẩu**, mật khẩu tạm đưa tận tay), rồi người đó làm tiếp.
- **FB-R4-SEC-BA-R4032-04 – Fixed.** `05` 1.2 bước 3 dùng câu của `02` 1.3 bước 5 (lấy giấy ngay khỏi máy in; chép vào trình quản lý mật khẩu; xóa tệp và dọn thùng rác). Có thêm "Làm trên điện thoại thì không tải mã về chính điện thoại đó."
- **FB-R4-SEC-BA-R4032-05 – Fixed.** Sổ tay 0.4 và `01` 1.7: tài khoản chủ đầu tư thứ hai chỉ cho **một người khác** anh/chị tin cậy (ví dụ đồng sở hữu), có toàn quyền như anh/chị. Không tạo cho chính mình (ESC-027 = B).
- **FB-R4-SEC-BA-R4032-06 – Fixed ở PR #69** (`v104/ba-2fa-ungate` @ `77cbb496`, gộp sau khi v1.0.4 lên production).
  - `02` 1.8: "**Không tự tắt 2 bước** (Desk chưa chặn tới v1.0.5); cần tắt thì hỏi chủ đầu tư". Bước của chủ đầu tư (sổ tay 1.5 bước 7, `01` 1.9 bước 8) dặn điều này.
  - Mọi chỗ ghi "anh/chị đổi được, báo đội" (`02`: "chủ đầu tư đổi được và báo đội").
- Ngoài thẻ: #63 xung đột với `main` ở decision-log, do dòng BA đã có từ lượt 1. BA merge main, giữ mọi dòng của main và đặt dòng BA sau cùng. Head mới `ae69f913`.
