# SEC – PR #91: `notice_locale` theo ngôn ngữ đã duyệt của phiên bản thông báo (BUG-R4-053)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** (bản sửa cho lần cắt lại, ARC đường A) | 05/11/2026
- Đối tượng: PR #91 `v104/fix-ru-notice-locale`, merge-base `7b2d79ec`. Báo cáo BE `rounds/round-04/outputs/BE/v1.0.4-fix-ru-notice-locale.md`.
  - SEC review bản sửa ở head `19c9a2e7`.
  - Trong lúc SEC review, BE đẩy thêm `9216394f` theo thẻ ARC FB-R4-ARC-BE-PR91-01 (`ARC-on-pr91.md`). SEC đã xem phần thêm ở mục 1, dòng 8. **Head hiện hành là `9216394f`.**
- Tiêu chí: quy tắc SEC `SEC-on-ru-notice-locale-drill.md` mục 4 (thẻ FB-R4-SEC-BE-RU-NL-01). Phạm vi theo ARC `ARC-on-s16-release-path.md` mục 3.1 (A1').
- Đã đọc:
  - `gh pr diff 91` (4 tệp ở `19c9a2e7`), diff `19c9a2e7..9216394f` (1 dòng `turbo.json`) và mô tả PR;
  - ở head: toàn bộ `GuestPortalService.update`, `view`, `noticeOk`;
  - `online-checkin.read.ts`, `guest-request-jobs.ts` (các chỗ khác ghi `online_checkin`);
  - guest-web: `config.ts:23`, `i18n.tsx:31–68`, `CheckinFlow.tsx:40–60` và `:410–450`, `GuestShell.tsx:109–118`, `App.tsx:27–56`, `__tests__/units.test.ts:122–142`; `NOTICE_TEXT_VERSIONS` ở tag `v1.0.3`;
  - `services/api/turbo.json`, `.github/workflows/ci.yml` (bước Postgres, Turbo cache);
  - runbook r3 (đang sửa, chưa commit) mục K11, N1–N6.
- SEC **chỉ chạy trên máy**: một worktree tạm ở `19c9a2e7` và một Postgres tạm bằng Docker, dùng mật khẩu CI-only của `ci.yml`. Đã xóa cả hai sau khi chạy. SEC không chạy gì trên staging hay production, và không sửa mã.
- Tệp này không có dữ liệu khách, giá trị link hay token.

---

## 0. Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

- **Không có thẻ Blocker hay Major.** Còn mở 2 Minor và 1 Suggestion, không thẻ nào chặn v1.0.4. Thẻ 01 (Minor) đã được sửa ở `9216394f`.
- Bản sửa đúng quy tắc SEC mục 4:
  - đúng bảng phiên bản → ngôn ngữ;
  - không có đường nào ghi `ru` cho trang hiện chữ EN;
  - đủ 4 ca bắt buộc, cả 4 đều đúng;
  - chỉ có một chỗ ghi `notice_locale`;
  - `consent_record.locale` không đổi;
  - không lộ dữ liệu mới.
- **Điều kiện:**
  - **ĐK1.** Job `format · lint · audit · test · build` phải xanh trên head **`9216394f`**, ở lượt CI mới. Lượt `41993899061` là của `19c9a2e7`, không dùng được. Lúc SEC nộp, PR chưa báo check nào cho head mới.
    - Trong log, hai tệp mới phải **chạy thật**, không bị bỏ qua: `bug-r4-053-notice-locale` 9 ca, `bug-r4-053-ru-notice-locale` 4 ca. Tệp tích hợp có `describe.skipIf(!HAS_DB)`, nên nếu thiếu DB nó bỏ qua mà không báo đỏ.
    - ORC gộp bằng `--match-head-commit 9216394f`. Nếu PR có thêm commit nữa, SEC xem lại phần thêm.
  - **ĐK2.** S16' (RG-35) trên staging, `TAG12` r3, đơn thử mới, tính từ `up_at` r3. Kết quả phải ra:
    - `online_checkin`: `privacy-2026-10-v2|ru|1`;
    - `consent_record`: `privacy-2026-10-v2|ru|guest_app|1`.
    - SEC dùng kết quả này cho N4. Lệch thì không làm N5, báo SEC + BE, và ORC xét mốc chuyển sang B (06/11 10:15).
- Đủ ĐK1 + ĐK2 thì SEC đóng FB-R4-SEC-BE-RU-NL-01.
- **ESC mới: không.** Việc này thuộc quyền SEC (mức rủi ro, yêu cầu kỹ thuật), không phát sinh tiền, không dời mốc.

---

## 1. Kết quả theo từng mục

| # | Mục kiểm | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Bảng phiên bản → ngôn ngữ | **Đúng** | `guest-portal.service.ts:60–69`: v1 = `vi, en`; v2 = `vi, en, ru`; phiên bản khác = `vi, en`. Bảng và từng danh sách đều đóng băng. `noticeLocaleShown` (`:75–80`) chỉ đọc khóa riêng (`Object.hasOwn`), so khớp chính xác, ngôn ngữ ngoài danh sách ra `en`. Test T1 khóa đúng danh sách SEC |
| 2 | Không ghi `ru` cho trang hiện chữ EN | **Đúng**, còn một ca hiếm đã biết (thẻ 03) | Xem mục 1.1 |
| 3 | 4 ca bắt buộc | **Có, đúng** | Tích hợp (HTTP + Postgres thật, `bug-r4-053-ru-notice-locale.test.ts`): (a) `:94`, (b) `:124`, (c) `:135` và `guest-portal.test.ts:566`, (d) `:140`. Đơn vị: U-a…U-d. Ca (a) còn kiểm đồng ý P02B cùng lượt ra `privacy-2026-10-v2\|ru\|guest_app`, tức cặp S16 khớp nhau. SEC chạy lại, xem mục 2 |
| 4 | Không có đường ghi `notice_locale` khác | **Đúng** | `git grep` ở head, bỏ snapshot và tài liệu: chỉ có `guest-portal.service.ts:525`. Các lệnh `UPDATE online_checkin` khác (`:489`, `:663`, `:760`, `:804`, `online-checkin.read.ts:55`, `guest-request-jobs.ts:153`) không đụng cột này. Desk không ghi cột này. Không có migration hay seed nào ghi cột này |
| 5 | `consent_record.locale` không đổi hành vi | **Đúng** | Diff chỉ có 2 hunk: khối hằng số và dòng `set('notice_locale', …)`. `recordGuestConsent` không đổi, vẫn lấy `locale` client gửi lên và kiểm theo CHECK `0051`. Ca (a) cho thấy đồng ý `ru` vẫn được nhận (201) |
| 6 | Không lộ dữ liệu mới ở log hay response | **Đúng** | `view()` vẫn đúng 11 khóa ĐK-2, không trả `notice_locale`. Audit `online_checkin.updated` vẫn chỉ ghi `hasNote` và tên trường. Hàm mới không ghi log. Không có mã lỗi mới. Test chỉ dùng dữ liệu giả (IP `10.53.0.x`, token sinh trong test, không in ra). gitleaks xanh |
| 7 | Phạm vi A1' / A1'' | **Đúng** | SEC chạy lại bằng git trên `9216394f`: 5 tệp, gồm 4 tệp trong `guest-portal/**` và `services/api/test/**`, cộng `services/api/turbo.json` (ARC nhận ở A1''). `product/docs/api` không đổi. `product/infra` = `afce70adc393…`, giống `0d11db20`. Không có migration |
| 8 | Phần thêm `9216394f` | **Đúng** | Chỉ thêm 1 dòng `"$TURBO_ROOT$/apps/guest-web/src/app/i18n.tsx"` vào `tasks.test.inputs`. JSON hợp lệ. Thay đổi này không vào image: theo ARC, `Dockerfile.api` chỉ build `src`. Không đụng mã chạy, nên kết quả chạy lại ở mục 2 (trên `19c9a2e7`) vẫn đúng cho `9216394f`. Sửa đúng thẻ 01 |

### 1.1 Khi nào server ghi `ru`, và trang hiện gì lúc đó

Server chỉ ghi `ru` khi phiên bản hiện hành là v2 **và** phiên ở `ru`. Bốn tình huống có thể xảy ra:

| Trang khách | H05 | Trang hiện | Server ghi | Khớp |
|---|---|---|---|---|
| v1.0.4 | v2 | RU đã ký. `RU_UNREVIEWED_LEGAL` trống, `legalLocale('ru') = 'ru'` (test `units.test.ts:122–142`) | `ru` | Có |
| v1.0.4 | v1 (từ Release tới N3) | Đóng an toàn: `NOTICE_TEXT_VERSIONS = [v2]` (`config.ts:23`), không có nút "đã đọc" | không ghi | – |
| Tab v1.0.3 cũ còn mở | v2 | Đóng an toàn: `NOTICE_TEXT_VERSIONS = [v1]` ở tag `v1.0.3` | không ghi | – |
| Tab v1.0.3 cũ còn mở | v1 | EN, vì `RU_UNREVIEWED_LEGAL` có 8 khóa | `en` (ca c) | Có |

- Ngôn ngữ của trang lấy từ phiên ngay khi mở (`App.tsx:55`), nên thường trùng ngôn ngữ phiên.
- Chỉ lệch nhau khi khách đổi ngôn ngữ mà lệnh `PUT /v1/guest/locale` lỗi mạng (`GuestShell.tsx:109–118`). Xem thẻ 03.

---

## 2. SEC chạy lại (chỉ trên máy, head `19c9a2e7`)

`9216394f` chỉ thêm 1 dòng vào `turbo.json`, không đổi mã hay test, nên các kết quả dưới đây vẫn đúng cho head mới.

- Test đơn vị (`bug-r4-053-notice-locale`, `v104-notice-allowlist`, `guest-portal-boundaries`, `module-boundaries`): **30/30 xanh**.
- Test tích hợp (`bug-r4-053-ru-notice-locale`, `guest-portal`) trên Postgres 17 tạm, đủ 72 migration: **15/15 xanh**.

Thử đột biến. Sửa tạm trong worktree tạm, rồi trả về như cũ:

| # | Đột biến | Đỏ |
|---|---|---|
| M1 | Danh sách "phiên bản lạ" thêm `ru` (ghi khống) | U-d, T1 |
| M2 | v1 thêm `ru` (ghi khống cho trang EN của v1) | U-c, T1 |
| M3 | Bỏ hàm, ghi thẳng `g.locale` | Đơn vị: không ca nào. Tích hợp: (c), (d), `guest-portal.test.ts` (c). Đây là lý do của ĐK1: CI phải chạy cả phần có DB |
| M4 | Thêm lại `gw.notice_body` vào `RU_UNREVIEWED_LEGAL` | G-RU |
| M5 | Mã cũ (`guest-portal.service.ts` của `0d11db20`) | (a). Khớp với báo cáo BE: 1 đỏ, 14 xanh |

---

## 3. Thẻ feedback

### FB-R4-SEC-BE-PR91-01
- Mức độ: Minor
- Vị trí: `product/services/api/turbo.json`, mục `tasks.test.inputs`; test G-RU trong `test/bug-r4-053-notice-locale.test.ts`.
- Vấn đề:
  - G-RU đọc `apps/guest-web/src/app/i18n.tsx`. Nhưng `inputs` của task `test` (api) chỉ có `apps/guest-web/src/app/config.ts`, không có `i18n.tsx`.
  - CI khôi phục cache Turbo theo `restore-keys`.
  - Vì vậy một PR chỉ sửa `RU_UNREVIEWED_LEGAL` sẽ trúng cache của `api`, và G-RU không chạy lại. Đó đúng là kiểu lệch đã gây ra lỗi này.
- Vì sao quan trọng: chốt chặn giữa client và server bị mù đúng lúc cần nó.
- Đề xuất sửa: thêm `"$TURBO_ROOT$/apps/guest-web/src/app/i18n.tsx"` vào `inputs`.
- Trạng thái: **Done** ở `9216394f`, trước khi SEC nộp review.
  - Thẻ này trùng FB-R4-ARC-BE-PR91-01 (ARC xếp Major, và đã nhận thêm tệp này vào phạm vi A1'').
  - SEC đã xem dòng thêm (mục 1, dòng 8). BE không cần trả lời riêng thẻ này.

### FB-R4-SEC-BE-PR91-02
- Mức độ: Suggestion (v1.0.5, gộp vào SEC mục 4 ý 6 / FB-R4-ARC-BE-S16-03)
- Vị trí: G-RU (`test/bug-r4-053-notice-locale.test.ts`).
- Vấn đề:
  - G-RU chỉ so `ru` phía server với việc `RU_UNREVIEWED_LEGAL` có trống hay không.
  - Nhưng `legalLocale('ru')` của guest-web còn về EN khi **thiếu** một chuỗi RU của `LEGAL_KEYS` (`i18n.tsx:51–64`).
  - Hiện chưa có rủi ro: test guest-web khóa `legalLocale('ru') = 'ru'` cho v2. Rủi ro chỉ xuất hiện khi có phiên bản sau thiếu một đoạn RU.
- Đề xuất sửa: khi sinh danh sách dùng chung từ `gen_strings.py`, dựa vào việc đủ mọi khóa RU của nhóm, không dựa vào `RU_UNREVIEWED_LEGAL`.
- Trạng thái: Open

### FB-R4-SEC-MOB-PR91-03
- Mức độ: Minor (v1.0.5; ARC cùng xem)
- Vị trí: `apps/guest-web/src/pages/GuestShell.tsx:109–118` (`changeLocale`).
- Vấn đề:
  - Trang đổi ngôn ngữ trước, rồi mới gọi `PUT /v1/guest/locale`. Nếu lỗi mạng, phiên ở server giữ ngôn ngữ cũ.
  - Trước bản sửa, phiên `ru` luôn ghi `en`. Từ bản sửa, phiên `ru` mà trang đã đổi sang vi/en sẽ ghi `ru`. Đây là hướng "ghi khống".
  - Với vi/en, kiểu lệch này đã có từ trước (BE giả định 1).
- Vì sao quan trọng:
  - Rủi ro **Low**: cả ba bản vi/en/ru của v2 đều đã ký và cùng nghĩa. Chỉ sai nhãn ngôn ngữ, không phải khẳng định khách đọc một văn bản chưa duyệt.
  - Ca này hiếm: phải lỗi mạng đúng lúc đổi ngôn ngữ, rồi bấm "đã đọc" mà không tải lại trang.
  - Khi khách đi tiếp tới bước đồng ý thì `consent_record.locale` (client gửi, theo trang) sẽ khác `notice_locale`, nên vẫn phát hiện được.
- Đề xuất sửa (chọn một):
  - lỗi mạng thì trả trang về ngôn ngữ cũ;
  - hoặc khóa nút "đã đọc" tới khi ngôn ngữ phiên đã đồng bộ;
  - hoặc (ARC, đổi hợp đồng) client gửi ngôn ngữ đã hiện, server kiểm theo bảng.
- Không chặn v1.0.4.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR91-04
- Mức độ: Minor (ghi vào runbook r3 nếu còn kịp; không chặn)
- Vị trí: runbook r3, N4 và N6 (`v1.0.4-release-runbook.md`, bảng N1–N6).
- Vấn đề:
  - N4 ghi "kết quả S15–S16 trên staging". Với đường A, phải là S15 (trên `CUT_R2`) cộng S16' (RG-35, trên `TAG12` r3). Dòng S16 lúc 15:01 là bằng chứng lỗi, không phải kết quả đạt.
  - N6 ghi "tới khi SEC + MOB sửa". Lệch ở `notice_locale` là việc của SEC + BE.
- Đề xuất sửa: N4 đổi thành "S15 + S16' (RG-35, `TAG12` r3)". N6 đổi thành "SEC + BE (`notice_locale`) hoặc SEC + MOB (`consent_record.locale`)".
- Trạng thái: Open

---

## 4. Đường A: SEC áp gì

- Đã ghi ngắn vào đầu `SEC-on-ru-notice-locale-drill.md`.
- T1–T4, N6a/N6b, K11 (e) và thẻ NL-03 **không áp dụng**.
- N1–N6 giữ như runbook. Thay cho T4 là ĐK2 ở trên.
- Mục 4 (quy tắc) và mục 5 (dòng đã ghi sai) vẫn giữ.
- ORC chuyển sang B lúc 06/11 10:15 thì tệp cũ áp dụng lại nguyên văn.

---

## 5. Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-05 | 4 | **SEC – PR #91 (BUG-R4-053, head 9216394f): ĐẠT CÓ ĐK.** Đúng bảng v1: vi,en; v2: vi,en,ru; lạ: vi,en. Không có đường nào ghi ru cho trang EN. Một chỗ ghi notice_locale duy nhất. consent_record.locale không đổi. Không lộ dữ liệu mới. SEC chạy lại trên máy: đơn vị 30/30, tích hợp 15/15, đột biến M1–M5 đều đỏ đúng chỗ. Phần thêm 9216394f (i18n.tsx vào test.inputs api) đúng, sửa thẻ SEC-BE-PR91-01 = ARC-BE-PR91-01. ĐK1: CI lượt mới trên head 9216394f xanh, hai tệp test mới chạy thật (không bỏ qua), gộp --match-head-commit 9216394f. ĐK2: S16'/RG-35 staging TAG12 r3 ra online_checkin privacy-2026-10-v2\|ru\|1 và consent_record …\|ru\|guest_app\|1 (dùng cho N4). Với đường A: T1–T4, N6a/N6b, K11 (e), NL-03 không áp dụng, N1–N6 như runbook; chuyển B lúc 06/11 10:15 thì áp lại. Thẻ v1.0.5: changeLocale lỗi mạng (MOB + ARC), G-RU dựa vào đủ khóa RU (BE, gộp danh sách dùng chung) | SEC | rounds/round-04/reviews/SEC-on-pr91.md; quyền SEC |`

---

## 6. Giả định

1. CI của PR dùng cùng bước Postgres như `ci.yml`, nên hai tệp tích hợp chạy thật. ĐK1 sẽ xác nhận.
2. Staging `TAG12` r3 phục vụ guest-web có `NOTICE_TEXT_VERSIONS = [v2]` và `RU_UNREVIEWED_LEGAL` trống. Lý do: guest-web không đổi từ `0d11db20`, và K11 (a) của S16' sẽ xác nhận.
3. Trên staging, H05 = v2 lúc chạy S16'. Không thì trang đóng an toàn và S16' không ghi gì.

---

Điểm nên giữ:
- Chọn danh sách **theo từng phiên bản**, không chỉ thêm `ru` vào danh sách chung. Nhờ vậy giữ đúng quyết định (a) cho tab v1.0.3 cũ còn mở.
- G-RU đỏ khi không tìm thấy khai báo, không lặng lẽ bỏ qua. Mỗi ca kèm câu báo lỗi chỉ rõ cách sửa và ai phải ký.
- PR đúng phạm vi A1', có ghi lệnh và kết quả. Báo cáo nằm ngoài PR để không làm lệch phép kiểm.

## Phản hồi & sửa (05/11): ĐÓNG FB-R4-SEC-BE-RU-NL-01

- **ĐK1 – đạt.** CI PR #91 trên head `9216394f` xanh, gồm cả docker E2E smoke. Log có `bug-r4-053-notice-locale.test.ts` 9 ca và `integration/bug-r4-053-ru-notice-locale.test.ts` 4 ca chạy thật, không bỏ qua. Gộp ra merge commit `6414be25`, không có commit thêm sau head SEC đã xem. A1'' đạt.
- **ĐK2 – đạt.** Staging `sha-6414be25f20d`. RG-35 (S16', đơn thử mới R-PV2) tính từ `up_at_r3` 09:38:54Z: `consent_record` `privacy-2026-10-v2|ru|guest_app|1`, `online_checkin` `privacy-2026-10-v2|ru|1`, không dòng `|en|`. Kèm C7 `GW_V1_FILES=0`, C4 `AT_IN_LOG=0`. Nguồn: `rounds/round-04/outputs/OPS/v1.0.4-staging-drill.md` bảng 5.x.
- **Kết luận:** đóng FB-R4-SEC-BE-RU-NL-01. Kết quả RG-35 dùng làm N4. **Đường B (T1–T4) không cần**, mốc 06/11 10:15 bỏ. Hai thẻ v1.0.5 (changeLocale lỗi mạng; G-RU dựa vào đủ khóa RU) vẫn mở, không chặn v1.0.4.
- ESC mới: không.
