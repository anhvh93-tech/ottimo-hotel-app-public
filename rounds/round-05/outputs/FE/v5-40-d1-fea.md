# FE-A – Desk theo PR-D1 (BE PR #100): V5-40 lễ tân trưởng bắt buộc 2FA, tiêu đề "Khách đi" theo `departuresDate`

- Round 5, bước Sản xuất · FE-A · 07/11/2026
- Nguồn: ORC giao từ BE PR #100 (đã gộp `91606094`); hợp đồng 0.3.13 mục 1.19; `rounds/round-05/reviews/ARC-on-be-pr-100-d1.md` mục 6 (mock `MFA_ROLES` do FE-A sửa).
- Nhánh `r5-fe-d1` cắt từ `origin/main` `ba2dc355`. Thân PR ghi "gộp sau #100" (#100 đã gộp).

## 1. V5-40 – lễ tân trưởng bắt buộc bật xác thực 2 bước
- Desk không tự giữ danh sách vai. Màn đăng ký 2FA bắt buộc, lời nhắc và trang Bảo mật đều đọc cờ của máy chủ: `Me.mfaEnrollmentRequired`, `Me.mfaRequiredButMissing`, `getMy2fa.required`. Vì vậy không sửa mã màn hình.
- Mock `apps/admin-web/src/mocks/handlers.ts`:
  - `MFA_ROLES` = owner, manager, `front_desk_lead`, như `MFA_REQUIRED_ROLES` của máy chủ;
  - tách `PRIVILEGED_ROLES` = owner, manager cho hai chỗ V5-40 **không** đổi: lời nhắc thiếu email bảo mật (`securityEmailMissing`, `me.service` `privileged`) và bước S2 khi thêm vai (`users.controller` `S2_ROLES`). Trước đây hai chỗ này dùng chung `MFA_ROLES`, nên nếu chỉ thêm FDL thì mock sẽ lệch máy chủ.
- Vitest `v5-40-d1-fea.test.tsx`:
  - MFA_ENFORCED: `qa.fdl` chưa có 2FA đăng nhập → màn đăng ký bắt buộc, API trả 403 `MFA_ENROLLMENT_REQUIRED`; `qa.fd` không bị ép;
  - chưa ép: `qa.fdl` thấy lời nhắc 2FA, `qa.fd` không thấy;
  - `qa.fdl` đã bật 2FA: có câu "bắt buộc", không có nút tắt;
  - `qa.fdl` thiếu email: không có lời nhắc email (giữ owner/manager).

## 2. `departuresDate` – tiêu đề danh sách khách đi
- Hợp đồng 1.19: lúc 01:30, nếu không gửi `date`, `departures` theo **ngày lịch** và máy chủ trả `departuresDate`. Khách đến và KPI theo **ngày nghiệp vụ**.
- `TodayPage.tsx` (`Board`):
  - khi `departuresDate` có và khác `date`: tiêu đề là "Khách đi (n) · Thứ Bảy 07/11/2026", dùng `weekdayDate` như phụ đề trang;
  - khi `departuresDate` vắng (máy chủ cũ) hoặc bằng `date`: tiêu đề như cũ.
- Khách đến và KPI không đổi. Phụ đề trang vẫn ghi ngày nghiệp vụ.
- Mock `dashboard.ts` luôn trả `departuresDate` = `date`, vì mock phục vụ một ngày cho mọi khối (ngày lịch, như trước). Ca cửa sổ sau nửa đêm được dựng trong vitest bằng cách bọc `api.getArrivalsDepartures`.
- Vitest có 3 ca: cửa sổ 01:30 (tiêu đề có ngày, khách đến không đổi), `departuresDate` = `date`, và máy chủ cũ không có trường.

## 3. Việc cần vai khác (không ESC)
- **UXD (chữ, cần trước khi phát hành v1.0.5)**: 3 câu hiện chỉ nói "chủ đầu tư và quản lý", nay hiện cả cho lễ tân trưởng:
  - `mfa.enroll_required` ("Vai chủ đầu tư và quản lý bắt buộc bật xác thực 2 bước…");
  - `mfa.required_note` ("Bắt buộc với vai chủ đầu tư và quản lý.");
  - `mfa.nudge` ("Tài khoản chủ đầu tư/quản lý nên bật…").

  FE không tự viết chữ. Khi UXD chốt, FE thay trong `gen_strings.py`.
- **UXD xác nhận**: phần thêm vào tiêu đề chỉ là ngày định dạng sẵn, " · Thứ Bảy 07/11/2026", không có chữ mới. Nếu UXD muốn một câu riêng (ví dụ khóa `today.departures_on`), FE đổi sau.

## 4. Kiểm
- vitest admin-web 1003/1003; `tsc`; `eslint`; `prettier`.
- Không đổi `openapi.yaml` hay tệp sinh. Không có E2E mới: ca T10-10 (01:30) đã có ở BE #100 trên máy chủ thật. Ca Desk trong cửa sổ 01:30 cần đồng hồ ảo; QA thêm vào gói desk-clock nếu cần.
- Không có ảnh chụp: tiêu đề mới chỉ hiện trong cửa sổ 00:00–06:00, mà mock trên trình duyệt không dựng được cửa sổ này. Nếu UXD cần ảnh, FE chụp bằng một kịch bản mock riêng.

## 5. Giả định, ESC
- Không có ESC mới.
- Giả định:
  - `weekdayDate` của phụ đề trang đủ làm cách ghi ngày cho tiêu đề (chờ UXD xác nhận);
  - KPI "Khách đi hôm nay" giữ ngày nghiệp vụ tới 0.3.14 (ARC A3).

## 6. Sửa theo review (07/11, sau merge main)
Review: UXD `rounds/round-05/reviews/UXD-on-prs-97-116-117-118-122.md` (#118 @ `e96070a1`), ARC `rounds/round-05/reviews/ARC-on-fe-mob-prs-97-116-118-122.md`. Chữ theo `copy-v1.0.5.md` bản 2.0 mục 9.10.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-UXD-FE-PR118-01 (Major) | Done | Áp nguyên văn 3 câu mục 9.10, không kể tên vai: `mfa.enroll_required`, `mfa.required_note`, `mfa.nudge`. EN có U+2011 trong "2‑step". Ghi chú khóa thêm "v1.0.5 V5-40: không kể tên vai (UXD-on-prs-97-116-117-118-122; copy-v1.0.5 9.10)". Sinh lại 4 tệp. Mọi test so chữ qua `tv()` (`v5-40-d1-fea`, `r3-s1-fea`, `v103-email-fea`); 126/126 |
| FB-R5-ARC-FE-118-01 (Suggestion) | Done | Ca mới trong `v5-40-d1-fea.test.tsx`: chủ đầu tư gán vai lễ tân trưởng cho `qa.fd` thì không cần S2; gán vai quản lý thì 422 `STRONG_REAUTH_REQUIRED`. Đổi điều kiện S2 sang `MFA_ROLES` thì ca này đỏ |
| Tiêu đề "Khách đi (n) · <thứ ngày>" | – | UXD duyệt, không cần khóa mới (mục 2.2) |

Kiểm: `tsc`; `eslint`; `prettier`; vitest các tệp liên quan 126/126, toàn bộ admin-web 1005/1005.
