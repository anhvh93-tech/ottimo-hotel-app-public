# SEC review code P4-42 – trang khách `privacy-2026-10-v2` (`v104/guest-privacy-v2`)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/guest-privacy-v2` @ `80c35dcc` (tác giả MOB), so với merge-base `917a39cf`. Đối chiếu `origin/main` @ `7b5b6117`.
- Lần trước SEC chỉ duyệt chữ (`SEC-on-plan-v1.0.4.md` mục 6, `SEC-on-privacy-v2-ru.md`). Lần này review **mã**: chọn version, đồng ý, ngôn ngữ ghi làm bằng chứng, PII.
- Đã đọc: `guest-web/src/app/config.ts`, `app/i18n.tsx`, `checkin/CheckinFlow.tsx`, `mocks/handlers.ts`, `styles.css`, 2 tệp test; `design/tools/gen_strings.py`, `design/copy/strings-{en,vi,ru}.json`; `rounds/round-04/outputs/MOB/v1.0.4-P4-42.md`; phía server: CHECK `consent_record.locale`, mặc định `privacy_notice_version` (migration 0050), `infra/server/publish-privacy-notice.sql`.
- Đã chạy (worktree tạm, không đẩy gì): `vitest run` của guest-web: **9 tệp, 87 test xanh**. Script so từng chuỗi 11 khóa trong `strings-*.json` của nhánh với chữ gốc.
- Không sửa mã, không sửa decision-log. Không có dữ liệu khách trong tệp này.

---

## 0. Kết luận

**ĐẠT.** Không có Blocker hay Major.

- Chữ trên trang khớp **từng ký tự** với chữ SEC đã chốt: EN/VI theo 6.2, RU theo `SEC-on-privacy-v2-ru` mục 2–3. Chỉ một chỗ khác là U+00A0 trong `{days}⍽дн.`, do UXD thêm. SEC chấp nhận: đây là kiểu chữ, không đổi nghĩa (mục 1).
- Đóng an toàn đúng 6.4 ý 1. Máy chủ còn v1 thì trang không hiện thông báo, không hỏi đồng ý.
- Bằng chứng đồng ý đúng: `noticeVersion` lấy theo máy chủ, `locale` theo chữ thực sự hiện ra.
- Không thêm log, URL, lưu trữ hay mạng mới. Không lộ PII.
- 1 thẻ Minor (báo cáo MOB chỉ sai cách đặt tham số), 1 Suggestion (chống lệch ngôn ngữ về sau). Không chặn merge.

---

## 1. Chữ: so khớp từng khóa (script)

| Nhóm | Kết quả |
|---|---|
| EN và VI của 4 khóa `gw.notice_*` so với 6.2 | Khớp nguyên văn cả 8 chuỗi |
| EN và VI của 7 khóa đồng ý/nút | **Không đổi** so với `main`. Đúng 6.2: chỉ `gw.notice_body` đổi, cộng 3 khóa mới |
| RU của 4 đoạn so với khối `python` ở `SEC-on-privacy-v2-ru` mục 2 | Khớp nguyên văn. U+00A0 nằm ở `3⍽месяцев` và `35⍽дней` |
| RU của 7 khóa ở mục 3 | 6 khóa khớp nguyên văn. `guest.oci.consent` chỉ khác U+00A0 ở `{days}⍽дн.` (UXD G2). SEC **chấp nhận**: kiểu chữ, không đổi nghĩa, không đổi version |
| 3 chỗ khóa nghĩa ("После удаления … не более 35⍽дней", "если закон не обязывает…", "их могут видеть только…") và `guest.oci.why` | Còn nguyên |
| Khóa khác trong `strings-*.json` | EN/VI chỉ đổi 4 khóa `gw.notice_*`. RU đổi đúng 9 khóa (7 khóa có RU mới, `consent_q` và `consent_optional` giữ nguyên RU cũ đã được duyệt). Không đổi khóa nào khác |

`gen_strings.py`: 11 khóa gom vào **một** nhóm `v1.0.4 P4-42 privacy-2026-10-v2`. Ghi chú mỗi khóa có câu "đổi chữ = đổi version". Hàng cũ và bản nháp `RU_EXTRA` đã xóa, nên không còn hai nguồn cho cùng một khóa. Tốt cho việc kiểm về sau.

## 2. Mã

| # | Điểm kiểm | Kết quả | Bằng chứng |
|---|---|---|---|
| C1 | `NOTICE_TEXT_VERSIONS = ['privacy-2026-10-v2']`, bỏ v1 (6.4 ý 1) | Đạt | `config.ts`. `legalTextReady` giữ điều kiện cũ: phải có version trong danh sách **và** `imageRetentionDays` nguyên dương. Test fail-closed thêm ca "the server still on v1" |
| C2 | 4 đoạn đúng thứ tự 6.2, dưới tiêu đề, trước nút (6.4 ý 2) | Đạt | `NOTICE_PARAGRAPHS` + `NoticeStep`. Test so thứ tự DOM: tiêu đề → đoạn → nút. Dòng version hiện `privacy-2026-10-v2` |
| C3 | Lượt đồng ý gửi version máy chủ báo | Đạt | `recordConsent({ noticeVersion })`, với `noticeVersion = oci.currentNoticeVersion`, **không** lấy hằng số của trang. Lượt "đã đọc" cũng gửi version này |
| C4 | `RU_UNREVIEWED_LEGAL` bỏ cả 8 khóa trong một lượt, không thêm 3 khóa mới (điều kiện 4.3) | Đạt | `i18n.tsx`: tập rỗng. Chú thích ghi luật: khóa pháp lý chưa duyệt về sau phải quay lại danh sách **cùng cả nhóm** |
| C5 | Ở `ru`, `shownLocale` trả `ru` cho cả 11 khóa. Lượt đồng ý thử ghi `ru` + v2 (điều kiện 4.4) | Đạt | `units.test.ts` (11 ca). `flow.test.tsx` ca RU: `consents` = `{ purpose: P02B_ID_IMAGE_RETENTION, decision: granted, noticeVersion: v2, retentionDays: 30, locale: 'ru', channel: guest_app }`. Phía server `consent_record_locale_check` nhận `ru` |
| C6 | Câu đồng ý không chọn sẵn | Đạt (không đổi) | `canSubmit` chỉ mở khi đã chọn Có/Không |
| C7 | PII: log, URL, lưu trữ | Đạt | Diff không thêm `console`, `localStorage`, query string hay lệnh mạng nào. Mock và test không có email (ca mới không cần email). Chữ thông báo không chứa dữ liệu khách |
| C8 | Thứ tự bật production (6.4 ý 5) | Đạt về mã | Mặc định server vẫn v1 (migration 0050). Deploy v1.0.4 thì trang **đóng an toàn**, tới khi OWN đặt H05 = v2. Đúng ý đồ: tờ ở quầy phải là v2 trước |
| C9 | Giao diện | Không ảnh hưởng bảo mật | `.gw-notice` chỉ đổi khoảng cách đoạn |

---

## 3. Thẻ feedback

### FB-R4-SEC-MOB-P442-01
- Mức độ: Minor
- Vị trí: `rounds/round-04/outputs/MOB/v1.0.4-P4-42.md` mục 3 ý 1 ("ví dụ qua `infra/server/publish-privacy-notice.sql`").
- Vấn đề: tệp này ghi **thông báo của landing** vào bảng `privacy_notice_version`. Đầu tệp nói rõ nó **không** đụng tham số Desk `config_parameter.privacy_notice_version` (cùng tên, khác thứ). Tham số trang khách cần do OWN đặt trên Desk H05 (6.4 ý 5 bước 3).
- Vì sao quan trọng: OPS chép câu này vào runbook thì chạy đúng script mà trang khách vẫn đóng. Tệp đã có chặn, nên không ghi sai dữ liệu. Nhưng lượt bật sẽ mất thời gian, và có thể gây nhầm giữa hai loại version.
- Đề xuất sửa: thay bằng "OWN đặt tham số Desk `privacy_notice_version` = `privacy-2026-10-v2` ở H05, **cùng ngày** thay tờ v2 (SEC-on-plan-v1.0.4 6.4 ý 5)". OPS ghi đúng như vậy vào runbook v1.0.4.
- Trạng thái: Open

### FB-R4-SEC-MOB-P442-02
- Mức độ: Suggestion
- Vị trí: `guest-web/src/checkin/CheckinFlow.tsx` `LegalBlock` (`shownLocale(locale, 'gw.notice_body')`). Phía đồng ý: `shownLocale(locale, 'guest.oci.consent')`.
- Vấn đề: ngôn ngữ của khối pháp lý (`lang`, dòng `gw.legal_en_notice`) và ngôn ngữ ghi làm bằng chứng mỗi chỗ chỉ dựa vào **một** khóa. Hôm nay đúng vì cả 11 khóa đều có RU, và test `LEGAL_V2` đã khóa điều đó. Về sau, một version mới (v3, hoặc thêm ngôn ngữ) có thể thiếu RU ở một đoạn. Đoạn đó rơi về EN theo từng khóa, mà bằng chứng vẫn ghi `ru`.
- Vì sao quan trọng: bằng chứng đồng ý phải đúng ngôn ngữ khách đã đọc (decision-log 17/10, R-CON-02).
- Đề xuất sửa: một hàm `legalLocale(locale)`: trả `locale` chỉ khi **mọi** khóa trong nhóm pháp lý (`guest.oci.why`, `NOTICE_PARAGRAPHS`, 6 khóa đồng ý, `gw.notice_read`) đều hiện ở `locale`, ngược lại trả `en` cho cả khối. Dùng hàm này cho cả `LegalBlock` và `recordConsent`. Có thể để v1.0.5.
- Trạng thái: Open

---

## 4. Ngoài phạm vi, để vai khác biết (không phải thẻ)
- QA: e2e (`tests/e2e/support/s3.ts`, `rbac/sprint3-ops.ts`, `ui/guest-web.h18.spec.ts`) còn đặt hoặc kiểm v1. Stack e2e phải đặt tham số v2 trước khi chạy H18. Không thì ca thủ tục trước sẽ dừng ở màn "đến quầy" (đúng hành vi đóng an toàn).
- `admin-web/src/mocks/stay.ts` còn v1: chỉ là mock, không ảnh hưởng.
- Kiểm sau production (6.5 của tệp plan) **vẫn còn hiệu lực**. SEC làm sau khi OWN đặt H05.

## 5. Điểm làm tốt
- Một nhóm chữ duy nhất cho 11 khóa, có ghi chú nguồn duyệt và commit. Về sau kiểm chữ pháp lý chỉ cần đọc một chỗ.
- Test chữ RU dùng `normalizer` giữ nguyên U+00A0, nên một lần "dọn khoảng trắng" về sau sẽ bị bắt.
- Báo cáo MOB nêu rõ hệ quả đóng an toàn khi server còn v1, không giấu thành "lỗi".
