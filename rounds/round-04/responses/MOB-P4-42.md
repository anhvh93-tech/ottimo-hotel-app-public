# MOB trả lời review UXD + SEC – P4-42 (trang khách, thông báo `privacy-2026-10-v2`)

Round 4 · v1.0.4 · Bước: **Phản hồi & sửa** · Nhánh `v104/guest-privacy-v2` (PR #38).
Review gốc, cùng trên `80c35dcc`:
- `rounds/round-04/reviews/UXD-on-v104-p4-42.md` (ĐẠT);
- `rounds/round-04/reviews/SEC-on-v104-p4-42.md` (ĐẠT).

Sửa trên đầu nhánh hiện tại `42d4844f`, gồm cả commit e2e của QA. Không rebase, không force-push.

## UXD

| Thẻ | Mức | Trả lời | Sửa ở đâu |
|---|---|---|---|
| FB-R4-UXD-MOB-P442-01 | Minor | **Accepted, đã sửa.** `.gw-notice > p + p { margin-top: 12px; }`, theo thang `space` của DS, khớp bản duyệt RU. Theo UXD thì không cần sửa test. | `apps/guest-web/src/styles.css` |
| FB-R4-UXD-MOB-P442-02 | Suggestion | **Deferred: lượt chữ sau, UXD đã cho dời.** Muốn hiện `privacy-2026-10-v2` bằng JetBrains Mono thì phải tách khóa `gw.notice_version` (có tham số `{v}`) thành nhãn + mã, và đó là chữ của UXD. Khi UXD có khóa nhãn (ví dụ `gw.notice_version_label`), MOB chỉ đổi một dòng ở `NoticeStep` thành `{label} <span className="mono">{version}</span>`. | – |

## SEC

| Thẻ | Mức | Trả lời | Sửa ở đâu |
|---|---|---|---|
| FB-R4-SEC-MOB-P442-01 | Minor | **Accepted, đã sửa.** Báo cáo mục 3 ý 1 nay ghi: "OWN đặt tham số Desk `privacy_notice_version` = `privacy-2026-10-v2` ở H05, **cùng ngày** thay tờ v2 (SEC-on-plan-v1.0.4 6.4 ý 5)". Kèm câu nói rõ `infra/server/publish-privacy-notice.sql` là thông báo của landing: cùng tên nhưng khác thứ, và chạy tệp đó thì trang khách vẫn đóng. **OPS:** ghi đúng bước này vào runbook v1.0.4. | `rounds/round-04/outputs/MOB/v1.0.4-P4-42.md` |
| FB-R4-SEC-MOB-P442-02 | Suggestion | **Accepted, đã làm (việc nhỏ).** `app/i18n.tsx` có thêm `LEGAL_KEYS` (đúng 11 khóa của nhóm `v1.0.4 P4-42 privacy-2026-10-v2`) và `legalLocale(locale)`. Hàm trả ngôn ngữ trang chỉ khi **mọi** khóa pháp lý đều có, và có bản đã duyệt nếu là RU. Ngược lại hàm trả `en` cho cả khối. `translateGuest` dùng hàm này cho mọi khóa pháp lý, nên không thể có khối nửa RU nửa EN. `LegalBlock` (`lang`, `gw.legal_en_notice`), nút `gw.notice_read` và `recordConsent.locale` đều dùng `legalLocale`, không còn dựa vào một khóa lẻ. Test: (1) `LEGAL_KEYS` khớp nhóm trong `gen_strings.py`, đọc từ tệp. (2) Giả lập RU thiếu `gw.notice_rights` thì `legalLocale('ru')` = `en`, cả 11 khóa hiện EN và `shownLocale` = `en`. Chữ ngoài nhóm (`common.back`) vẫn RU. Hôm nay hành vi không đổi: cả 11 khóa có RU, test flow RU vẫn ghi `locale: 'ru'` + v2. | `apps/guest-web/src/app/i18n.tsx`, `checkin/CheckinFlow.tsx`, `__tests__/units.test.ts` |

## Kiểm thử sau sửa
- `pnpm --filter @ottimo/guest-web typecheck`: sạch.
- `vitest run` (guest-web): **9 tệp, 89 test xanh**, thêm 2 test mới so với 87.
- `eslint apps/guest-web`: 0 lỗi, 1 cảnh báo cũ ở `public/mockServiceWorker.js`. `prettier --check`: sạch.
- Không đổi chữ, không đổi `gen_strings.py` hay tệp sinh ra, không đổi version thông báo.
