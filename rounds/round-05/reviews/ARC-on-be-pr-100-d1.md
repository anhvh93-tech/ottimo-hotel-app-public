# ARC review PR #100 – BE-D PR-D1 (V5-40, V5-43 gồm V104-07/08, `departuresDate`, V5-1B)

- Round 5 (v1.0.5), bước **Review**. Người review: ARC. Ngày 07/11/2026.
- PR: https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/100, nhánh `r5-d1`, HEAD **`69471005`**, CI xanh (9 job đạt, 3 job publish/deploy bỏ qua như mọi PR). Gộp thử trong bộ nhớ với `main` @ `ad8a7c61` (sau #104 bổ sung 1e, #107): không xung đột. Phần `main` thêm sau `ab1fc4ae` không chạm `services/api`.
- Đã đọc:
  - thân PR, `git diff origin/main...origin/r5-d1` (20 tệp, +724/−128);
  - hợp đồng trên `main`: `openapi.yaml` 0.3.13 (`getArrivalsDepartures`, `getTonightKpi`, `TonightKpi`, `ArrivalsDepartures`, `getMy2fa`, `disableMy2fa`, `login`, `Me`, bảng mã lỗi), `rounds/round-05/outputs/ARC/contract-0.3.13.md` mục 1.19, 1.21, 2;
  - DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 7 (7.1, 7.6: ngày nghiệp vụ, cửa sổ 00:00–05:59) và mục 9 (V5-1B);
  - plan V5-1B, V5-40, V5-43; release notes v1.0.4 dòng "Ai bật 2 bước"; `docs/coding-standards.md`; ADR-008;
  - mã có sẵn: migration `0079`, `password-reauth.ts` (`verifyApprover`), `strong-reauth.ts`, `mfa.service.ts`, `stay-actions.ts` (`checkOutAction`), `apps/mobile/src/app/notifications.tsx`, `apps/mobile/src/app/session.ts`, `apps/admin-web/src/pages/TodayPage.tsx`;
  - review SEC `rounds/round-05/reviews/SEC-on-be-pr-100-d1.md` (DUYỆT, thẻ D1-01…05). ARC không lặp thẻ SEC.
- Đã chạy (worktree tách rời ở scratchpad, commit `69471005`; Postgres 17 tạm trong Docker với mật khẩu CI-only của `ci.yml`, cổng riêng, đã dừng và xóa; không chạm staging/production):
  - unit `v105-be-d1-units`, `serializer.test`, `v104-holds-units`: 50/50 đạt;
  - integration `v105-be-d1-mfa-fdl`, `dashboard-s4-bed`, `v104-holds`, `r3-q51-receiving-account` (vai `ottimo_app`, RLS bật): 48/48 đạt;
  - đột biến của ARC, 4/4 bị bắt: khóa cache 2FA bỏ `roles_version` (1 ca đỏ); guard chỉ hỏi owner/manager (2 ca đỏ); `departuresDateFor` bỏ điều kiện "vắng `date`" (2 ca đỏ); `hold_expired` bỏ `front_desk_lead` (7 ca đỏ);
  - thêm tạm ca 05:59 vào T10-10: `date` = 16/10, `departuresDate` = 17/10, danh sách như 01:30. Hành vi đúng; ca này chưa có trong PR (thẻ 01).

## Kết luận: **DUYỆT**

Gộp được ở `69471005`. Mã đúng hợp đồng 0.3.13 (mục 1.19, 1.21), đúng DOM mục 9, đúng chuẩn code. Không đổi schema OpenAPI, không migration, không đổi `x-roles` hay ca rbac.

- Trên PR: **0 Blocker · 0 Major · 1 Minor · 1 Suggestion**. Không thẻ nào là điều kiện gộp.
- Ngoài PR: **1 Major cho MOB** (thẻ FB-R5-ARC-MOB-V51B-01). Nó không chặn gộp #100, nhưng thiếu nó thì V5-1B gần như mất tác dụng ở quầy. Phải lên **cùng tag v1.0.5** với #100.
- ARC đồng ý 5 thẻ SEC D1-01…05 và đồng ý đóng C0312-02, V104-07, V104-08. Với D1-05, ARC chốt cách sửa ở mục 6.1. Cách đó khác (a) của SEC một chút.
- Góc DOM: V5-1B và T10-10 **đúng luật** (mục 4, 5). Có 2 điểm lệch, đều thuộc hợp đồng của ARC, không phải lỗi của BE. ARC ghi vào danh sách ARC-16 / 0.3.14 (mục 6.3).
- ESC mới: không.

## 1. Đối chiếu hợp đồng và luật

| Việc | Nguồn | Mã ở PR | Kết quả |
|---|---|---|---|
| V5-40 FDL bắt buộc 2FA | plan V5-40; release notes v1.0.4 "Ai bật 2 bước" (FDL bắt buộc, Desk ép ở v1.0.5) | `MFA_REQUIRED_ROLES` = owner, manager, `front_desk_lead` ở một tệp, không import (`mfa-roles.ts`); `requiresMfa` (đăng nhập), `getMy2fa.required`, chặn `disableMy2fa`, `Me.mfaRequiredButMissing`, `Me.mfaEnrollmentRequired` và guard đọc cùng danh sách | Đúng. Cổng chặn giữ nguyên (`MFA_ENROLLMENT_OPERATIONS` không đổi), client đọc cờ của máy chủ |
| V5-43 `serializeSchema` | SEC FB-R4-SEC-BE-C0312-02 (a) + (b) | `walk(…, self)`; `serializeSchema` đi `self = false` nên mọi `x-self-data` bị bỏ ở mọi cấp; đường operation không đổi; test quét nơi gọi | Đúng. Hiện `src/` không có lời gọi `serializeSchema` nào, nên không đổi hành vi đang chạy, chỉ khóa đường SSE/outbox sau này. Khớp nghĩa `x-self-data` trong hợp đồng ("chỉ trả cho chính người gọi") |
| V104-07 | SEC | `main.ts` qua `writeLogLine`, ESLint `no-console` áp `main.ts` | Đúng. Ngoại lệ stderr đã có thẻ SEC D1-01 |
| V104-08 | SEC | `action: set \| cancel` lấy đúng nhánh controller | Đúng |
| `departuresDate` | hợp đồng 1.19, T10-10; `ArrivalsDepartures.departuresDate`; mô tả tham số `date` | Vắng `date` và đang trong cửa sổ (ngày lịch = ngày nghiệp vụ + 1) → `departures`, kiểm "căn có khách đến", `allowedActions` theo ngày lịch; `arrivals`, `holdsArrivingToday` theo ngày nghiệp vụ | Đúng chữ hợp đồng. `getTonightKpi` giữ ngày nghiệp vụ: hợp đồng 1.19 không nói tới KPI. Lệch với câu "luôn khớp danh sách" là lỗi chữ của ARC (mục 6.3 A3) |
| V5-1B | DOM mục 9; hợp đồng 1.21 | `HOLD_NOTICE_ROLES.hold_expired` = FD, FDL; bỏ `HOLD_NOTICE_FALLBACK_ROLES` và nhánh dự phòng; một `notify` cho người tạo, người chốt và vai; khóa chống trùng theo đơn giữ nguyên | Đúng (mục 5) |

## 2. V5-40 – kỹ thuật

- **Đúng chỗ, đúng ranh giới module.** `shared/http/auth.guard.ts` chỉ import `modules/identity/public/mfa-roles.ts` (tệp không import gì), giống cách guard đã dùng `identity/public/rate-limiter`. Không đụng `internal/` của module khác (coding-standards mục 2).
- **Đúng điều kiện cũ.** Khi `MFA_ENFORCED = false` thì `enrollmentOnly` = `s.enrollment_only`, y như trước. Khi bật cờ: owner/manager đi nhánh nhanh `s.mfa_required` (SQL 0079), chỉ người chưa bật 2FA và không có owner/manager mới chạy thêm truy vấn.
- **Cache.** Khóa `user_id:roles_version`, sống `roleCacheMs` (60 s), đúng coding-standards 8c ("cache quyền ≤ 60 giây theo `roles_version`"). SEC đã rà các đường đổi vai (mục 1.1 của SEC); ARC thử đột biến bỏ `roles_version` khỏi khóa thì test bắt được.
- **Hiệu năng.** Thêm tối đa một giao dịch đọc mỗi người mỗi 60 s, chỉ khi bật cờ và người đó chưa có 2FA (FD, HK, SAL ở production). Không ảnh hưởng ngân sách p95 300 ms.
- **Không vỡ luồng duyệt.** `verifyApprover` loại người có 2FA (fail-closed), nhưng chỉ nhận `roles: ['owner', 'manager']` (trả phòng thay đêm bằng phí trả muộn). FDL không là người xác nhận ở đó. Duyệt bằng PIN (`transitionManagerConfirmation`) chỉ OWN/MGR. `PasswordReauth.verify` không xét 2FA. `StrongReauth` hỏi TOTP khi đã bật 2FA, và chỉ dùng ở các thao tác tài khoản. FDL bật 2FA không mất thao tác nào ở quầy.
- **App nhân viên.** FDL được mở PWA (`session.ts` `SUPERVISORS`). Phiên hạn chế trên PWA đi `EnrollOnDeskPage` theo cờ của máy chủ (`api.ts` dòng 76, 83). Không cần sửa MOB.
- **Vận hành.** Release notes v1.0.4 đã báo FDL bắt buộc 2FA và chủ đầu tư kiểm bằng mắt. ARC đồng ý ghi chú của SEC mục 7 cho PO/BA: sửa câu release notes v1.0.5 thành "bị hạn chế ngay ở lượt gọi kế tiếp sau deploy", và nhắc FDL bật 2FA trước ngày deploy. `startMy2faSetup` mở cho `any_staff`, nên FDL tự bật trước được.

## 3. V5-43 – kỹ thuật

- `walk` mang thêm cờ `self`; `serializeShape` (đường operation) truyền `true`, `serializeSchema` truyền `false` và owner `null`. Ở nhánh `ref`, owner chỉ thành `schema:<tên>` khi `self` đúng, nên không có cấp nào "lọt" owner. Thay đổi nhỏ, đọc hiểu được, không thêm chi phí trên đường nóng.
- Test quét `src/` giữ `serializeShape`, `serializeResponse`, `propertyAllowed` trong `serializer.ts` và `SerializeInterceptor`. SEC D1-04 (CODEOWNERS) là lớp bổ sung; ARC đồng ý.

## 4. `departuresDate` và góc DOM của T10-10

**Kỹ thuật:** đúng. `departuresDateFor` là hàm thuần, có test đơn vị (cả cuối tháng, cuối năm). Ngày nghiệp vụ lấy từ `Clock` và `business_day_rollover` (ADR-008), nên `ngày lịch = ngày nghiệp vụ + 1` chỉ xảy ra trong 00:00 tới trước rollover. Không thêm truy vấn.

**Góc DOM – đúng luật** (BR-010; DOM 7.1 "ngày nghiệp vụ là của lúc bấm"; DOM 7.6 cửa sổ 00:00–05:59; BUG-R4-036):

- **01:30 ngày 17/10 thuộc ngày nghiệp vụ 16/10.** Khách đến muộn trong đêm vẫn là đêm 16/10, nên `arrivals` và `holdsArrivingToday` giữ 16/10 là đúng.
- **Lễ tân ca đêm cần thấy khách sẽ đi sáng 17/10.** Họ được bấm Trả phòng từ 00:00 (BUG-R4-036), vì khách có thể ra sân bay lúc 04:00. Nên `departures` theo ngày lịch 17/10 là đúng.
- **Căn có khách đến cùng ngày đi lên đầu (US-031 AC2).** Mã xét khách đến ngày 17/10, tức ngày khách cũ rời căn. Đây là ý nghĩa đúng của "căn có khách đến hôm nay": căn phải dọn kịp cho khách đến 17/10.
- **Trạng thái nhắc trong cửa sổ** là `reminded_waiting` hoặc `replied` (ngày đi > ngày nghiệp vụ). Không ra `call_needed` lúc 01:30. Hợp lý: không ai gọi khách giờ đó.
- **`getTonightKpi` giữ ngày nghiệp vụ** cho số căn đang ở, công suất, khách đến: đúng, vì "đêm nay" là đêm 16/10.

Hai điểm lệch thuộc hợp đồng (ARC nhận, mục 6.3):

- **A3:** ô "Khách đi" trên trang Hôm nay (`TodayPage.tsx` đọc `TonightKpi.departures`, `departuresCheckedOut`) nằm ngay trên danh sách. Trong cửa sổ, ô đếm khách đi 16/10, còn danh sách là khách đi 17/10. Hợp đồng (`getArrivalsDepartures` dòng 2337, `TonightKpi.departures` dòng 11233 trên `main` @ `ad8a7c61`) vẫn viết "cùng bộ đọc… luôn khớp danh sách". Test của BE ghim đúng hành vi hiện tại, nên chữ hợp đồng phải sửa.
- **A4:** trong cửa sổ, lượt có ngày đi = ngày nghiệp vụ (16/10) mà còn `in_house` không còn ở danh sách "Khách đi". Trước PR, lúc 01:30 lượt này vẫn có ở danh sách. Đúng chữ hợp đồng 1.19, và căn vẫn hiện "Đang ở" trên sơ đồ phòng. Nhưng ca đêm là lúc lễ tân còn tự bấm Trả phòng được cho lượt này. Từ 06:00, lượt chuyển sang đường "quá ngày đi" chỉ OWN/MGR (V5-15). ARC hỏi DOM ở 0.3.14, không chặn v1.0.5.

## 5. V5-1B – góc DOM

**Đúng luật DOM mục 9** ở phía máy chủ:

- Người nhận là người tạo, người chốt **và** mọi FD, FDL đang hoạt động. Nhánh "chỉ FD/FDL khi không có người tạo, người chốt" đã bỏ. MGR không nhận: đúng, DOM chỉ ghi FD, FDL. MGR đã nhận `hold_overdue_with_deposit` và `hold_overdue_cap`.
- Một tin mỗi người mỗi đơn. Khóa chống trùng theo đơn giữ nguyên; `notify` lọc trùng khi người tạo cũng là FD.
- Giữ chỗ có cọc một phần vẫn đi `hold_overdue_with_deposit`, không tự hủy (DOM D-9, BUG-R3-042).
- Tin chỉ có kind, mã đơn, id (SEC mục 4).

**Nhưng đầu cuối chưa đạt mục đích của DOM** ("lễ tân là người báo khách, nên lễ tân phải có tin"):

- Desk web không có hộp Thông báo (DOM mục 8.2 dòng 472). FD, FDL chỉ đọc được tin ở hộp Thông báo của app nhân viên (PWA).
- PWA chưa có câu cho ba kind giữ chỗ. `NOTIF_KEYS` (`apps/mobile/src/app/notifications.tsx` dòng 109–119) không có `hold_expired`, nên tin hiện "Thông báo mới – xem chi tiết trên OTTIMO Desk" kèm mã đơn. Mà Desk không có màn đó.
- Việc này ARC đã giao MOB ở hợp đồng 0.3.12 (`rounds/round-04/outputs/ARC/v1.0.4-contract-0.3.12.md` dòng 106–108, 155): "thêm 3 dòng `NOTIF_KEYS`". UXD đã có chữ (`strings-vi.json` dòng 3413–3415, ví dụ `staff.notif.k.hold_expired` = "Giữ chỗ chưa cọc đã hết hạn và tự hủy"). Trên `main` và mọi nhánh đều chưa có.
- Trước V5-1B, chỗ hở này chỉ chạm người tạo là FD/FDL. Sau V5-1B, mọi lễ tân đều nhận một dòng chung chung. Xem thẻ FB-R5-ARC-MOB-V51B-01.
- Cho PO/BA (V5-71, Tờ 2a): khi đổi Tờ 2a sang "dựa hộp Thông báo", ghi rõ là **hộp Thông báo trên app nhân viên**. Thiết bị ở quầy phải đăng nhập app nhân viên trong ca.

## 6. Chỗ BE báo cho ARC

### 6.1 Hàm SQL 0079 – ARC chốt cách sửa (vào danh sách 0.3.14)

Hiện danh sách vai bắt buộc 2FA có hai nguồn: `('owner', 'manager')` trong `auth_resolve_session()` (0079 dòng 78–79) và `MFA_REQUIRED_ROLES` trong TS. Guard lấy OR của hai nguồn nên an toàn, nhưng hai nơi có thể lệch lặng lẽ (SEC D1-05).

**ARC chốt:** ở migration kế tiếp có sẵn (cùng đợt migration nhỏ của 5B-2 ở v1.0.6, theo QC R4 ĐK-2, sau V5-61), làm như sau.

1. Đổi chữ ký thành `auth_resolve_session(p_sid_hash text, p_mfa_roles text[])`, với `mfa_required = EXISTS (… r.revoked_at IS NULL AND r.role = ANY (p_mfa_roles))`. Theo mẫu 0079: `DROP FUNCTION` bản cũ, `CREATE`, `REVOKE ALL … FROM PUBLIC`, `GRANT EXECUTE … TO ottimo_app`.
2. Guard gọi với `[...MFA_REQUIRED_ROLES]` và đọc lại `s.mfa_required` như trước PR này. **Bỏ** `mfaRequired()` và `mfaRoleCache`.
3. Danh sách chỉ còn ở TS (`mfa-roles.ts`). SQL không chứa tên vai nào.
4. Test:
   - giữ ca "phiên mở trước khi bật cờ" (khi đó ca này kiểm SQL);
   - thêm ca nhiều cơ sở của SEC D1-02;
   - thêm một đột biến: guard truyền `['owner', 'manager']` thì phải có ca đỏ.

Vì sao không chọn (a) của SEC (bỏ cột, guard luôn tự hỏi): (a) giữ một truy vấn và một cache riêng ở guard mãi mãi. Cách trên đạt đúng mục tiêu của SEC (một nguồn danh sách), còn bỏ được phần kiểm ở guard như ORC và BE đề nghị, và không thêm lượt gọi DB nào: hàm vốn chạy mỗi request. Không đổi hợp đồng OpenAPI (hàm nội bộ). SEC phản biện được một lần theo protocol mục 7.

Tới khi migration đó lên: giữ nguyên phần guard tự kiểm của PR này.

### 6.2 `openapi.yaml` còn ghi "owner/manager" – xác nhận **chỉ là chữ**

- Schema không đổi: `getMy2fa.required` vẫn là boolean, `Me.mfaRequiredButMissing` và `Me.mfaEnrollmentRequired` vẫn là boolean. Mã `MFA_ENROLLMENT_REQUIRED` đã có. `x-roles` và ca rbac không đổi: `gen-openapi-meta --check`, `gen_rbac_cases --check` đạt ở CI.
- Không client nào tự giữ danh sách vai: admin-web và PWA đọc cờ của máy chủ. Riêng mock `apps/admin-web/src/mocks/handlers.ts` dòng 37 có `MFA_ROLES`; FE-A sửa, như BE và SEC đã nêu.
- BE đếm 4 chỗ; thực tế có **6 chỗ** cần thêm `front_desk_lead`. Dòng theo `main` @ `ad8a7c61`, sau #104:

| # | Dòng | Chỗ |
|---|---|---|
| 1 | 170 | bảng mã lỗi `MFA_ENROLLMENT_REQUIRED` |
| 2 | 868–869 | mô tả `login` ("người có vai `owner`/`manager` ở bất kỳ cơ sở nào") |
| 3 | 1102 | summary `getMy2fa` |
| 4 | 1115 | `getMy2fa` → `required` ("Vai owner/manager → true") – BE chưa nêu |
| 5 | 1126 | mô tả `disableMy2fa` ("Vai owner/manager → 403") – BE chưa nêu |
| 6 | 11013 | `Me.mfaRequiredButMissing` |

- Đổi mô tả xong phải chạy lại `pnpm --filter @ottimo/api-client gen` và các bước sinh meta. Ba trong sáu câu đã nằm trong `packages/api-client/src/generated/openapi.ts` (dòng 204, 5917, 10262), nên CI sẽ bắt lệch.
- Ngoài `openapi.yaml`: `docs/erd.md` dòng 479 (`mfa_enabled` "bắt buộc owner/manager") do ARC sửa cùng PR. `docs/rbac-matrix.md` dòng 248 (A111) thuộc BA, cùng việc "BA sửa dòng Lễ tân ở `02` 1.7" của V5-40. `docs/security/security-requirements.md` dòng 24 (SR-AUTH-06 "khuyến nghị `front_desk_lead`") thuộc SEC. Mã `services/api/src/config.ts` dòng 45: thẻ 02.

### 6.3 Danh sách cho ORC chuyển vào plan (ARC-16 và 0.3.14)

**Vào PR hợp đồng ARC-16 (chỉ chữ, không chặn #100, nên gộp trước tag v1.0.5):**
- **A1:** 6 chỗ ở bảng 6.2, `erd.md` dòng 479, chạy lại tệp sinh.
- **A2:** mô tả `x-self-data` ở 0.3.12 (f) thêm một câu: "`serializeSchema` (SSE, outbox) không bao giờ trả thuộc tính `x-self-data`, với mọi vai (V5-43)".
- **A3 (phần chữ):** `getArrivalsDepartures` dòng 2337 và `TonightKpi.departures` dòng 11233 thêm ngoại lệ: "trong cửa sổ sau nửa đêm khi vắng `date`, `departures` của danh sách theo `departuresDate`; số của `getTonightKpi` vẫn theo ngày nghiệp vụ (tới 0.3.14)".

**Vào danh sách 0.3.14 (v1.0.6):**
- **0079:** cách ở mục 6.1. Đi cùng migration nhỏ của 5B-2; BE làm, ARC review.
- **A3 (phần máy chủ), ARC chốt hướng:**
  - `TonightKpi` thêm `departuresDate` (thêm trường, không phá). `departures` và `departuresCheckedOut` đi theo cùng quy tắc `departuresDateFor`, để ô và danh sách lại khớp nhau. Các số khác giữ ngày nghiệp vụ.
  - Desk ghi ngày ở ô khi `departuresDate` ≠ `businessDate`.
  - BE khoảng 0,25 ngày, không migration.
- **A4 (chờ DOM):** trong cửa sổ, có đưa lượt `in_house` có ngày đi = ngày nghiệp vụ lên đầu danh sách "Khách đi" (trạng thái `overdue`) để ca đêm còn bấm Trả phòng trước 06:00 không? DOM trả lời có thì ARC thêm vào 0.3.14. Trả lời không thì giữ như hiện nay và BA ghi vào sổ tay ca đêm: "rà sơ đồ phòng các căn Đang ở có ngày đi hôm qua".

## 7. Thẻ feedback

### FB-R5-ARC-BE-D1-01
- Mức độ: Minor
- Vị trí: `product/services/api/test/integration/dashboard-s4-bed.test.ts`, ca T10-10 (dòng 770–814 ở `69471005`)
- Vấn đề: ca T10-10 kiểm 01:30 và 06:00, chưa có 05:59. `docs/coding-standards.md` mục test (dòng 142) quy định: "Mốc ngày nghiệp vụ 06:00 có test 05:59/06:00". ARC đã thêm tạm ca này ở worktree: hành vi đúng (`date` = 16/10, `departuresDate` = 17/10, danh sách như 01:30).
- Vì sao quan trọng: ranh giới cửa sổ là chỗ dễ sai nhất của `departuresDateFor`, ví dụ ai đó đổi so sánh sang ngày lịch theo giờ cố định. Không có ca 05:59 thì một lỗi lệch một phút không bị bắt.
- Đề xuất sửa: thêm vào ca T10-10, trước dòng `// from the rollover…`:
  ```ts
  await at('2026-10-17T05:59:00+07:00');
  const late = await lists('fd');
  expect([late.date, late.departuresDate]).toEqual(['2026-10-16', '2026-10-17']);
  expect(ids(late.departures)).toEqual(ids(night.departures));
  ```
  Làm ở commit thêm trên `r5-d1` nếu còn push; không thì ở PR BE-D kế tiếp, cùng ca nhiều cơ sở của SEC D1-02.
- Trạng thái: Open

### FB-R5-ARC-BE-D1-02
- Mức độ: Suggestion
- Vị trí:
  - `product/services/api/src/modules/identity/internal/mfa.service.ts` dòng 96, 319, 333;
  - `product/services/api/src/config.ts` dòng 45;
  - `product/services/api/src/modules/reservations/internal/hold-notices.ts` dòng 18;
  - `product/services/api/src/modules/reservations/internal/reservations.service.ts` dòng 4631–4632.
- Vấn đề:
  - `mfa.service.ts` còn ba chỗ viết tay `roles.some((r) => (MFA_REQUIRED_ROLES as readonly string[]).includes(r))`, trong khi PR đã có `isMfaRequiredRole`.
  - Chú thích `config.ts` còn "MFA_ENFORCED – owner/manager must have 2FA".
  - Hai dòng chú thích mới dài quá 120 ký tự. Prettier không gói chú thích, nên lint vẫn qua.
- Vì sao quan trọng: một vị từ dùng một hàm thì sau này đổi danh sách (hoặc đổi nghĩa, ví dụ theo cơ sở – SEC D1-03) chỉ sửa một chỗ. Chú thích cũ làm người sau tin là chỉ owner/manager.
- Đề xuất sửa:
  - thay ba chỗ bằng `isMfaRequiredRole(roles)`;
  - sửa chú thích `config.ts` thành "a mandatory role (MFA_REQUIRED_ROLES)";
  - gói lại hai dòng chú thích.
  - Làm cùng thẻ 01 hoặc PR sau, không cần trước khi gộp.
- Trạng thái: Open

### FB-R5-ARC-MOB-V51B-01 (ngoài PR #100 – ORC chuyển MOB)
- Mức độ: Major
- Vị trí: `product/apps/mobile/src/app/notifications.tsx` dòng 109–119 (`NOTIF_KEYS`, `main` @ `ad8a7c61`)
- Vấn đề:
  - `NOTIF_KEYS` thiếu `hold_overdue_with_deposit`, `hold_overdue_cap`, `hold_expired`. Ba kind này rơi vào `staff.notif.k.other`: "Thông báo mới – xem chi tiết trên OTTIMO Desk", kèm mã đơn. Mà Desk không có hộp Thông báo.
  - Việc này ARC đã giao MOB ở hợp đồng 0.3.12 (`rounds/round-04/outputs/ARC/v1.0.4-contract-0.3.12.md` dòng 106–108, 155). Chữ UXD đã có từ v1.0.4 (`product/design/copy/strings-vi.json`, `strings-en.json` dòng 3413–3415), nhưng chưa nhánh nào làm.
- Vì sao quan trọng: V5-1B là việc **bắt buộc** của v1.0.5 (hạn 14/11). Mục đích là để lễ tân biết giữ chỗ chưa cọc đã tự hủy và báo khách, tránh khách chuyển cọc vào đơn đã hủy hay đến quầy khi căn đã bán (DOM mục 9). Sau #100, mọi FD, FDL đều nhận tin, nhưng chỉ đọc được "xem chi tiết trên Desk", tức không biết đã có chuyện gì.
- Đề xuất sửa:
  - Thêm 3 dòng vào `NOTIF_KEYS`: `hold_overdue_with_deposit: 'staff.notif.k.hold_overdue_with_deposit'`, `hold_overdue_cap: 'staff.notif.k.hold_overdue_cap'`, `hold_expired: 'staff.notif.k.hold_expired'`.
  - Kiểm `scripts/used-keys.ts` đưa 3 khóa vào gói PWA.
  - Thêm ca đơn vị `notifText` cho 3 kind (vi, en).
  - Bấm vào tin vẫn không chuyển màn (chủ đề của Desk, `target()` trả `undefined`); mã đơn hiện ở dòng phụ như hiện nay.
  - Không đổi hợp đồng, không migration.
  - Reviewer: UXD (chữ), QA (ca V5-1B chạy trên app nhân viên), ARC. Lên cùng tag v1.0.5 với #100.
- Trạng thái: Open

## 8. Điểm làm tốt

- V5-40 làm được mà không cần migration. Danh sách vai ở một tệp không import, ghim bằng test. Ca "phiên mở trước khi bật cờ" kiểm `auth_resolve_session` trả `false` rồi mới gọi API, nên chứng minh đúng chỗ SQL chưa biết FDL. Có thử đột biến.
- `departuresDateFor` tách thành hàm thuần có test đơn vị, và ca T10-10 so danh sách đêm với `?date=17/10` và với 06:00. Ca còn ghim luôn quyết định "KPI giữ ngày nghiệp vụ", nên lệch chữ hợp đồng lộ ra ngay (A3).
- V5-1B bỏ hẳn nhánh dự phòng thay vì vá thêm điều kiện. Mã ngắn hơn, có ca QA đủ: người tạo là sale, FD bị khóa, nhịp sau, cọc một phần.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **ARC – review PR #100 (BE-D PR-D1) @ 69471005: DUYỆT** (rounds/round-05/reviews/ARC-on-be-pr-100-d1.md). Đúng hợp đồng 0.3.13 1.19, 1.21 và DOM mục 9; góc DOM: V5-1B, T10-10 đúng luật. Thẻ trên PR: D1-01 (Minor, ca 05:59), D1-02 (Suggestion), không chặn gộp. **FB-R5-ARC-MOB-V51B-01 (Major, MOB)**: PWA thiếu `NOTIF_KEYS` cho 3 kind giữ chỗ (giao từ 0.3.12) – lên cùng tag v1.0.5. **ARC chốt (SEC D1-05)**: migration kế tiếp (đợt 5B-2) đổi `auth_resolve_session(p_sid_hash, p_mfa_roles text[])`, guard truyền `MFA_REQUIRED_ROLES`, bỏ `mfaRequired`/`mfaRoleCache`; danh sách vai chỉ ở TS. ARC-16: 6 chỗ "owner/manager" ở openapi (170, 868–869, 1102, 1115, 1126, 11013) + erd 479, câu `serializeSchema` cho `x-self-data`, ngoại lệ cửa sổ của KPI. 0.3.14: `TonightKpi.departuresDate` (A3), câu hỏi DOM về lượt đi hôm qua còn ở trong cửa sổ (A4). | ARC | Không ESC |`
