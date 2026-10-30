# BE – trả lời review PR #16 (tin Google Chat, v1.0.1)

- Round 3 · Bước: Phản hồi & sửa · Tác giả: BE · Ngày 30/10/2026 · Nhánh `be/gchat-booking-notify` (không force-push)
- Review: `rounds/round-03/reviews/ARC-on-BE-gchat-notify.md` (ARC, duyệt có điều kiện) và `rounds/round-03/reviews/SEC-on-BE-gchat-notify.md` (SEC, duyệt có điều kiện).
- Giao việc ORC 30/10: GC-01, SEC GCHAT-01, GC-02 + SEC 02, GC-03; nếu nhanh GC-05, GC-06, SEC 04.

## Bảng trả lời

| Thẻ | Mức | Trạng thái | Xử lý |
|---|---|---|---|
| FB-R3-ARC-BE-GC-01 | Major | **Done** | `git revert --no-edit 1420521e db29b4ca` → commit `0d13aed8`, `cac5c9cc`. PR #16 không còn migration 0090, snapshot, mục journal, allowlist `privacy_notice_version` và hai test PN-01. Báo cáo mục 1.6 và dòng decision-log BE ý (7) đã sửa. PN-01 làm lại ở `be/privacy-notice-append-only` **sau khi** BE-A 0089 gộp, theo đúng 4 bước ARC mục 3 (snapshot = nội dung 0089, idx 66, `when` = 0089 + 2000, chạy `publish-privacy-notice.test.sh`) – chưa làm ở lượt này. |
| FB-R3-ARC-BE-GC-02 | Minor | **Done** | `chatSafeText`: bỏ mọi `\p{Cf}` (ZWSP, WJ, BOM, soft hyphen, U+061C, mọi dấu bidi), chỉ giữ U+200D giữa hai pictograph (emoji ghép); U+2028/U+2029/U+0085 coi như xuống dòng (tên gộp 1 dòng); `DOMAIN_DOT` nhận `[\p{L}\p{N}\p{M}]` trước dấu chấm. Test: `evil<ZWSP>.example/login`, `evil.<ZWSP>example`, `evil<WJ>.<BOM>example`, `x̃.com`, tên có U+2028/U+2029/U+0085, U+061C + soft hyphen, emoji ZWJ còn nguyên. INT thêm 2 ca (ZWSP, dấu kết hợp) vào lượt kiểm ★5 trên phòng thử. |
| FB-R3-ARC-BE-GC-03 | Minor | **Done** | Chú thích đầu `chat-message.ts` trỏ đúng `test/gchat-units.test.ts` ("chat-message.ts is wired by src/worker-chat.ts") và `test/integration/gchat-worker-only.test.ts`. Báo cáo mục 1.6, 3, 5 và decision-log cập nhật theo GC-01. |
| FB-R3-ARC-BE-GC-04 | Minor (ORC/OPS) | Chuyển OPS | Không có mã. Checklist v1.0.1 của OPS: `init-secrets.sh` (không cờ) staging trước, production sau, kiểm `ls -l …/booking_request_chat_webhook` (uid 1000, 0400, 0 byte) trước khi đẩy tag; `appconfig` thấy `chat: off {reason: NOT_CONFIGURED}`. Đã ghi trong mô tả PR mục "For OPS". |
| FB-R3-ARC-BE-GC-05 | Suggestion | **Done** | `umask 077` đầu nhánh `--set-booking-chat`; khi lệnh kiểm trong image trả mã khác 0/3 thì in `checked: bash rule only (image tool not available)`. shellcheck sạch. |
| FB-R3-ARC-BE-GC-06 | Suggestion | **Done** | `resolveChatConfig`: staging/production chỉ đọc `ADMIN_BASE_URL`; dev/test giữ dự phòng `APP_BASE_URL`. Test: production chỉ có `APP_BASE_URL` → `off` + `CHAT_LINK_BASE_INVALID`; dev dùng được dự phòng. |
| FB-R3-ARC-BE-GC-07 | Suggestion | Ghi nhận, sau v1.0.1 | Bước CI "journal `origin/main` là tiền tố journal của nhánh, mục mới chỉ nối cuối, `when` > max trên `main`" – BE + OPS làm sau v1.0.1 (không trong PR này). |
| FB-R3-SEC-BE-GCHAT-01 | Major | **Done** | `chatSafeEmail`: email chỉ in khi khớp `CHAT_EMAIL` = `^[a-z0-9._%+-]{1,64}@(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$` (≤ 254, chữ thường); không khớp → `(email có ký tự đặc biệt – xem trên Desk)`. `chatSafeText` nay **luôn** đổi `://` → `[:]//` và `<>` → `‹›` ở mọi trường; email chỉ giữ dấu chấm tên miền (SEC Q3). Test: `https://evil.example/login@ottimo.vn`, `x\|y@example.invalid`, `*a*@example.invalid`, `‹users/all›@example.invalid`, `<users/all>@…`, `a@evil.example/login`, `a@b`, `a b@…` → thay cả trường, không còn `://`; ca render C kênh Email với email độc: không chứa `evil`, dòng có `://` duy nhất là dòng "Mở Desk". Điểm 4 (siết `normalizeEmail` ở form) chưa làm: ảnh hưởng form, cần FE-B + QA – để BE-A/ORC quyết. |
| FB-R3-SEC-BE-GCHAT-02 | Minor | **Done** | Dấu chấm của cụm IPv4 → `[.]` (`1.2.3.4/login` → `1[.]2[.]3[.]4/login`; giá `1.5`, giờ `22.30`, ngày `1.2.2026` giữ nguyên). Tên (ngoài khối mã) bỏ `*` `_` `~` (`*TEST*` → `TEST`); lời nhắn giữ nguyên vì nằm trong khối mã. INT thêm 2 ca (tên `1.2.3.4/login`, tên `*TEST*`) trên phòng thử. |
| FB-R3-SEC-BE-GCHAT-03 | Minor | **Done** (phần mã) / chuyển OPS-ORC | Chú thích trên `CHAT_DETAILS_MIN_NOTICE_VERSION`: thông báo sau này bỏ Google Chat thì phải hạ mức về A/B trước khi đăng; đổi hằng phải qua PR có SEC review. Runbook đổi mức + dòng decision-log mỗi lần đổi: việc OPS/ORC. |
| FB-R3-SEC-BE-GCHAT-04 | Suggestion | **Done** | Kết quả render mức C mang `recheck`; dispatcher chạy `SELECT status, pii_purged_at … WHERE id = $1` (không cột C2) ngay trước POST; đã purge/spam → `done` + `SKIPPED_GONE`, không gửi. Test tích hợp: xóa (purge) commit giữa claim và POST → 0 request tới webhook giả, dòng outbox `SKIPPED_GONE`. Mức A/B không có `recheck` (không mang PII). |
| FB-R3-SEC-BE-GCHAT-05 | Suggestion | Chuyển INT | `CHAT_USE_MESSAGE_ID` vẫn `false`. INT kiểm `messageId` trên phòng thử, nhận thì bật trước khi đặt C, không nhận thì ghi vào báo cáo INT. |

## Giả định ARC hỏi (mục 2 review ARC)

- Giả định 2 (tin xóa có "Mở Desk") và 5 (bỏ nhắc sáng khi đã có tin quá hạn sáng nay): ARC chấp nhận – không đổi.

## Kiểm tra sau sửa

- Unit `test/gchat-units.test.ts`: 58/58 (thêm 17 ca).
- Tích hợp `gchat-notify.test.ts` 22/22 (thêm ca re-check), `gchat-worker-only.test.ts` 2/2, `worker-audit-registry`, `migrations-journal`, `module-boundaries` xanh trên PostgreSQL 17 cục bộ (vai `ottimo_app`).
- `pnpm --filter @ottimo/api typecheck`, ESLint các tệp sửa, `prettier --check .`, shellcheck `init-secrets.sh`: sạch.
- CI của PR: xem PR #16 (head mới sau commit lượt 2).

## Lượt 3 – trả lời review QA (31/10)

Review: `rounds/round-03/reviews/QA-on-BE-gchat-notify.md` (QA, duyệt có điều kiện, head `9520cec1`). Giao việc ORC: sửa FB-01 trong PR #16.

| Thẻ | Mức | Trạng thái | Xử lý |
|---|---|---|---|
| FB-R3-QA-BE-GCHAT-01 (BUG-R3-057) | Major | **Done** | `chatSafeText` kiểm số giấy tờ/thẻ (`looksLikeSensitiveNumber`) trên chữ gốc, **sau** mọi bước bỏ ký tự (Cc, `\p{Cf}`, `_*~` của tên, gộp dòng, backtick) và trước bước `[.]`, rồi lần cuối trên chữ in ra (`[.]` đọc như dấu chấm). Hàm kiểm chạy luật cũ trên chữ gốc, trên bản NFKC + chữ số `\p{Nd}` về ASCII, và trên bản coi một `_` `/` `,` giữa hai chữ số là dấu tách nhóm. Test TC-GC-01 (5 ca bảng FB-01 + toàn độ rộng + Ả Rập, `/`, `,`, NBSP, tab, backtick, dạng IPv4, CMND, hộ chiếu), TC-GC-02, SĐT hợp lệ ở mức C vẫn hiện, 7 ca không che nhầm. Không đổi luật form. |
| FB-R3-QA-BE-GCHAT-02 (BUG-R3-058) | Minor | Chuyển BE-D | Luật form trên `main` (`website-request-rules.ts`), không thuộc PR #16 – ORC giao BE-D. Hàm `looksLikeSensitiveNumber` trong `chat-message.ts` có thể dùng làm mẫu (NFKC, `\p{Nd}` → ASCII, `_ / ,`). |
| FB-R3-QA-BE-GCHAT-03 | Minor | Chuyển PO/BA | Chọn dạng mã dùng chung. BE giữ `ref_code` thô (8 ký tự) như hiện tại; nếu PO chọn cách 2 thì BE thêm tiền tố `REQ-` ở `chat-message.ts` (một dòng) cùng lúc FE-B đổi Desk. |
| FB-R3-QA-BE-GCHAT-04 | Suggestion | Chuyển OPS/INT | Không sửa mã (đúng thiết kế ARC 8.9). OPS ghi lọc `chat dead` vào runbook v1.0.1; INT kiểm `messageId` trước khi đặt C. |

Test case QA đề nghị: thêm TC-GC-01, TC-GC-02 (P1), TC-GC-06 (tin C ≤ 4 KB), TC-GC-10 (mốc 22:00:00 / 06:59:59 / 07:00:00, tick 07:29:59 / 07:30:00). Còn TC-GC-03–05, 07–09, 11–14: chưa làm.

Kiểm tra (Postgres 17 tạm, vai `ottimo_app`, webhook giả): `gchat-units` 91/91, Chat (unit + `gchat-notify` + `gchat-worker-only`) 116/116, toàn bộ api 141 tệp đạt / 2 bỏ qua, 3387 ca đạt / 19 bỏ qua, 0 lỗi; typecheck, ESLint, Prettier sạch trên tệp sửa.
