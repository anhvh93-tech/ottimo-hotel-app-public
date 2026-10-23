# FE-A – phản hồi thẻ Round 3 Sprint 1 (US-143 Desk, bước Phản hồi & sửa)

- Ngày: 23/10/2026 | Nhánh `worktree-agent-aefb4922ed24dd839`, đã rebase lên `main` `ae1c945` | OpenAPI 0.3.8-draft + bổ sung 1 (ARC `s1-contracts.md` mục 12)
- Căn cứ:
  - `rounds/round-03/reviews/s1-SEC-on-2FA.md`;
  - ARC `s1-contracts.md` mục 12.3;
  - điều kiện server của CỔNG S2 theo BE-C `8712822` + `ae836f7`, nhánh `worktree-agent-aeb2b1b2ad5190d92`. FE-A đã đọc mã controller.
- Kết quả kiểm:

  | Kiểm tra | Kết quả |
  |---|---|
  | admin-web | **535/535** (trước 529) |
  | api-client | 30/30 |
  | `tsc` admin-web, api-client, mobile, guest-web | 0 lỗi |
  | eslint | xanh |
  | prettier | xanh |
  | `check_hifi.py` | xanh |

## SEC-on-2FA

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R3-SEC-FEA-01 (Major) | Done | Xem chi tiết dưới bảng. |
| FB-R3-SEC-BEC-01 (Major, phần FE – đề xuất (3)) | Done (phần FE) | Thứ tự `/change-password` rồi `/enroll-2fa` giữ ở `RequireAuth` và `LoginPage`. Ca mới: MGR có mật khẩu tạm, cờ bật → màn "Đặt mật khẩu của bạn" trước. Phần server vẫn của BE-C |
| Ca 11 – điều kiện (c) | Done (đã có) | `StrongReauthDialog`, màn đổi mật khẩu và màn cấp thiết bị hiện **một** câu `reauth.s2_failed` cho 401 `REAUTH_FAILED`. 422 `STRONG_REAUTH_REQUIRED` hiện "Bắt buộc" ở ô mã, không nói yếu tố nào sai |
| Các thẻ còn lại (BEC-02…08) | – | Thuộc BE-C, không có phần FE |

### Chi tiết FB-R3-SEC-FEA-01

Gắn S2 vào 6 thao tác, theo đúng điều kiện server:

1. `updateUser`:
   - khóa và mở khóa (`status`), đặt lại mật khẩu (`resetPassword`) **trên người khác** → hộp `StrongReauthDialog` thay cho hộp xác nhận cũ;
   - mở khóa trước đây bấm thẳng, nay cũng qua S2;
   - đổi tên hiển thị không cần S2.
2. `setUserRoles`:
   - chỉ khi danh sách mới **thêm** `owner`/`manager` → S2. Hàm `rolesNeedS2` cùng quy tắc với `users.controller.ts`, kể cả owner → manager không tính là nâng vai;
   - đổi vai khác vẫn dùng hộp xác nhận cũ.
3. `revokeTrustedDevice`: hộp S2, giữ câu hậu quả và ô lý do.
4. `trustCurrentDevice` và `changeMyPassword`:
   - thêm ô mã TOTP / mã khôi phục (`SecondFactorField`, dùng chung với hộp S2) khi `Me.mfaEnabled`;
   - gửi `totpCode`/`recoveryCode` cạnh `currentPassword` như hợp đồng;
   - sai → một câu và xóa ô.
5. `createUser`: thêm endpoint api-client `createUser(body & {reauth})`, kiểu bắt buộc `reauth`. Màn "Thêm người dùng" (S26, US-008) là việc của FE-B, chưa có trên Desk; FE-B chỉ cần gọi `StrongReauthDialog` rồi `api.createUser`.

api-client:
- `setUserRoles(…, reauth?)`;
- `revokeTrustedDevice(…, reason, reauth, idem)` – `reauth` bắt buộc;
- `updateUser` nhận `body.reauth`.

MSW mô phỏng cổng như server:
- thiếu `reauth` → 422 `VALIDATION_FAILED` + `STRONG_REAUTH_REQUIRED`. Field là `reauth`/`reauth.totpCode`, hoặc `currentPassword`/`totpCode` cho hai thao tác có trường riêng;
- 422 trả **trước** khi kiểm mật khẩu;
- sai → 401 `REAUTH_FAILED`;
- `POST /users` mới.

Test:
- 1 ca gọi thẳng 7 request (6 thao tác, `updateUser` hai nhánh) không có `reauth` → 422;
- đổi tên hiển thị → 200;
- nâng vai lên Quản lý với 2FA (kiểm thân request có `reauth`);
- sai mã khi khóa → một câu, không đổi gì;
- đổi mật khẩu với 2FA (sai rồi đúng);
- cấp thiết bị bằng mã khôi phục;
- `users.test.tsx`: khóa, đặt lại mật khẩu, thu hồi thiết bị chuyển sang hộp S2.

## ARC 0.3.8 bổ sung 1 – mục 12.3 (FE-A Q1)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| G-FE-A-1 (giả định tạm) | Done – bỏ | Xem chi tiết dưới bảng. |

### Chi tiết G-FE-A-1

Đã bỏ thông báo tạm `mfa.recovery_used_*` và chuyển hướng tới `/security`. Luồng mới:
- Đăng nhập bằng mã khôi phục → server trả phiên hạn chế (`Me.mfaEnrollmentRequired = true` khi 2FA vẫn bật) → route guard mở **cùng màn** `/enroll-2fa`.
- Ở chế độ đăng ký lại, màn dùng tiêu đề `mfa.reenroll_title` "Đăng ký lại trên điện thoại mới" và câu dẫn `mfa.reenroll_lead`. Hai chuỗi chờ UXD.
- Setup → QR mới → confirm → bí mật và cả bộ 10 mã được thay → phiên `amr = totp` → quay lại trang đang mở.

MSW theo 12.3:
- (a) `loginMfa` bằng mã khôi phục → phiên hạn chế cho mọi người có 2FA;
- (b) setup khi 2FA đang bật chỉ được từ phiên `recovery_code`, còn lại 409;
- (c) confirm thay bí mật và bộ mã.

Ca test bao trọn luồng:
- API khác 403;
- bí mật mới khác bí mật cũ, mã cũ hết hiệu lực;
- phiên `totp` gọi setup → 409.

## Thẻ còn mở (FE-A)

- **Ca A.7 #16 E2E Playwright** (đồng hồ giả): chờ server US-143 + cổng S2 gộp trên stack CI. FE-A làm cùng QA.
- **Chuỗi chờ UXD**: 2 chuỗi mới (`mfa.reenroll_title`, `mfa.reenroll_lead`) và nhóm "R3 Sprint 1 – FE-A". Đã bỏ 2 khóa `mfa.recovery_used_*`.
- **Thứ tự gộp**: theo SEC, gộp `ae836f7` + nhánh này + phần E2E của QA trong **một** lần. Nhánh này đã gửi `reauth` nên chạy được cả khi server chưa có cổng: schema zod của `users.controller.ts`/`devices.controller.ts` ở `bd0fb4f` không `.strict()`, nên trường `reauth` thừa bị bỏ qua (FE-A đã đọc mã).

---

# R3-Q51 – phần FE trả lời review ARC (`s1-ARC-on-Q51.md`) và SEC (qua `s1-BE-B.md`) – 23/10

- Nhánh: `fe-a/r3-q51-followup` tách từ `be-b/r3-q51-receiving-account` `cf0ce2f`, chỉ chồng thêm commit FE nên ORC fast-forward được. Agent FE-A bị giới hạn trong worktree riêng, không commit thẳng vào worktree của BE-B.
- Kết quả kiểm:

  | Kiểm tra | Kết quả |
  |---|---|
  | admin-web | **555/555** (`r3-q51-fea` 14/14) |
  | api-client | 30/30 |
  | `tsc`, eslint, prettier, `check_hifi.py` | xanh |

| ID | Trạng thái | Ghi chú |
|---|---|---|
| FB-R3-ARC-Q51-01 (Major, phần FE) | Done | Theo 0.3.8 bổ sung 2: khi `getParameterHistory` không có `current`, dòng "Đang dùng" hiện `rcv.none_in_use` "Chưa có tài khoản đang dùng – tài khoản dưới đây có hiệu lực từ {ngày}". Dòng "Đã lên lịch" vẫn có nút Hủy. 404 vẫn hiện "chưa cấu hình". Kiểu api-client đổi `current?`. MSW: 200 không có `current` khi chỉ có dòng đã lên lịch, 404 khi không có dòng nào. Ca test: đặt lần đầu → hiện đúng → hủy → 404 |
| FB-R3-SEC-Q51-01 (Minor, phần FE) | Done | Thêm gợi ý `rcv.reason_help` "Không ghi số tài khoản vào lý do." dưới ô lý do, ở cả hộp đặt và hộp hủy. Desk kiểm trước khi gửi bằng cùng quy tắc server (dãy từ 6 chữ số, nhóm cách nhau bằng dấu cách tính là một dãy, hoặc chứa số vừa gõ) nên không tốn mã S2. Server trả 422 `reason` `ACCOUNT_NUMBER_NOT_ALLOWED` → lỗi hiện dưới ô lý do (`rcv.reason_no_account`). MSW kiểm trước S2 như server. Ngày ISO vẫn được nhận |
| FB-R3-ARC-Q51-02, FB-R3-SEC-Q51-02/03 | – | Phần của BE-B / QA |

- Chuỗi mới chờ UXD duyệt: `rcv.none_in_use`, `rcv.reason_help`, `rcv.reason_no_account`.
