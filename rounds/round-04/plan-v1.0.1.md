# Round 4 – Kế hoạch lắp ráp và phát hành v1.0.1

- Người lập: ARC (kiêm phần OPS) | Round 4 – Bước: Lập kế hoạch | 01/11/2026 tối (kiểm thực tế lúc 20:30–21:00)
- Căn cứ: INV 01/11 "làm luôn đi nha, cho kịp tiến độ"; **INV 01/11 (dòng decision-log mới nhất): "hiện tại tôi đang chưa vận hành, bạn cứ cập nhật"** → bỏ ràng buộc không đụng production 07:00–22:00 ngày D; mỗi lần lên production vẫn cần **INV duyệt Release**. ORC: ưu tiên tốc độ, chia đợt, đợt nào sẵn sàng thì lên trước.
- Đọc: `decision-log.md` (dòng 942–1047), `backlog.md` mục 5.6, `rounds/round-03/qa/bug-list.md`, review vòng 3 (`SEC-on-BE-gchat-notify.md`, `ARC-on-BE-gchat-notify.md`, `QA-on-BE-gchat-notify.md`, `SEC-on-BE-A-v1.0.1.md`, `BE-B-on-BE-A-v1.0.1.md`, `UXD-on-FE-A-v1.0.1.md`, `SEC-on-ADR-015.md`, `ARC-on-OPS-us155-enable.md`, `ARC-on-OPS-cwd-fb01.md`), vòng 4 (`ARC-on-LP-v2-code.md` mục 5, `ARC-on-LP-v2-fixes.md` mục 4, `SEC/lp-v2-privacy-and-api.md` mục 1, 2, 10, `qc/lp-v2-gate.md`), `SEC/esc041-gchat-full-details.md` mục L2.
- Kiểm bằng git (chỉ đọc): `git log/diff/merge-tree` từng nhánh với `main` @ `7c482710`; `gh pr checks 16`. Không checkout, không sửa mã, không commit.

---

## 0. Kết luận nhanh

1. **Chỉ PR #16 (Google Chat) sẵn sàng lên ngay**: đủ ARC + SEC + QA, CI 8/8 xanh trên `98ff43bb`, GitHub báo `MERGEABLE / CLEAN`, `merge-tree` với `main` không xung đột.
2. **Bộ "trả phòng sớm + giá đã lên lịch"** (`arc-contract-v1.0.1` + `be-a-v1.0.1` + `fe-a-v1.0.1`) đã code xong từ 27/10 nhưng **chưa có ARC review mã BE-A, chưa có QA**, và cũ 171 commit so với `main` (xung đột 5 tệp, đều giải được). Cần khoảng 1 ngày.
3. **PN-01 (0090) chưa có nhánh**. Mã đã có sẵn: commit `db29b4ca` + `1420521e` (SEC đã đọc ở lượt 1 PR #16), bị revert khỏi PR #16. Cần dựng lại sau 0089.
4. **Thông báo `2026-10-31` chưa có trên `main`**. Chữ en/vi chỉ nằm trong `privacy.ts` của `lp-v2`, trộn với Δ5 và ko/zh/ru. `consentMore` trên `main` vẫn ghi "within 180 days" (SEC-LP2-01 Major). Cần một PR landing riêng.
5. **Phần lớn danh sách "v1.0.1 bắt buộc" của PO chưa có dòng mã nào**: BUG-R3-032 (P1, hạn ESC-040 là 09/11), BUG-R3-042 (P1), 043, 041 + WA-04, thông báo khách lưu trú `privacy-2026-10-v2`. Các mục này không thể kịp cùng đợt Chat.
6. Đề xuất **chia 3 đợt** (mục 3). Đợt 1 = Chat mức A, lên production sớm nhất **02/11 sáng**. Đợt 2 = trả sớm + giá hẹn + PN-01 + làm sạch chữ Chat, khoảng **03/11**. Đợt 3 = lỗi giữ chỗ + thư Security notice, **chậm nhất 07/11**. Mức C bật sau đợt 2, khi đủ điều kiện SEC.

---

## 1. Bảng thành phần → trạng thái thực tế → việc còn lại

| # | Thành phần | Nhánh / commit (kiểm 01/11) | Đã review / QA | Còn thiếu | Vai | Đợt |
|---|---|---|---|---|---|---|
| T1 | **PR #16 – tin Google Chat** (outbox `staff.chat`, mức A/B/C, `chatSafeText`, nhắc 07:30, tin quá hạn) | `origin/be/gchat-booking-notify` = `98ff43bb` (worktree `agent-a40f8c2b…`; nhánh local cùng tên còn ở `9520cec1`, kém origin 1 commit). 9 commit trên `main`, 32 tệp, **không migration** | ARC lượt 2 Duyệt (GC-01…06 đóng, GC-04 → OPS, GC-07 Deferred); SEC lượt 3 Đạt (BUG-R3-057 đóng); QA lượt 2: 057 đã sửa, api 3387/0 lỗi; CI PR xanh 8/8 | Gộp `main` (sạch). Trước khi deploy: OPS chạy `init-secrets.sh` (GC-04). **Không đặt C** ở đợt này | ORC gộp; OPS | 1 |
| T2 | **SEC GCHAT-07 + BUG-R3-058 + QA FB-06** (luật chung V-09: nhóm số liền nhau, gạch Unicode, nhiều dấu cách, xuống dòng, hộ chiếu chữ thường) | **Chưa có nhánh** | – | Sửa `website-request-rules.ts` (`looksLikeIdNumber`/`GROUPED_DIGITS`), `looksLikeSensitiveNumber` dùng lại; test theo bảng SEC lượt 3 | BE-D (BE-A dự phòng); SEC + QA review | 2 (**trước khi đặt C**, không chặn deploy) |
| T3 | **SEC mục 10** (`chatSafeText` với `。` `．` `｡`, tên miền chữ Kirin, `xn--`, số giấy tờ Hàn/Trung/Nga) | **Chưa có nhánh** | – | Gộp chung PR với T2 (cùng hàm, cùng bộ test). SEC chỉ bắt buộc trước khi mở ko/zh/ru ở mức C. ARC đề nghị làm **trước khi đặt C**: khách trên form en/vi hiện nay vẫn gõ được `evil。com`, và sửa rẻ | BE-D; SEC, QA | 2 |
| T4 | **Hợp đồng 0.3.9** (B16 `dryRun`, `scheduledListPrices` + `cancel-scheduled`, `stayDepartureDate`, tách hoàn A, ADR-015) | `arc-contract-v1.0.1` = `c63a4571` (4 commit). `be-a`/`fe-a` đã có bổ sung 1–2, **thiếu bổ sung 3** (`c63a4571`, chỉ đổi mô tả: 20 dòng `openapi.yaml` + api-client sinh) | SEC duyệt ADR-015 (thẻ 01–03 đã đáp ứng); BE-A/BE-B/FE-A cài theo | Gộp cùng PR đợt 2. Chỉ xung đột `decision-log.md` | ARC | 2 |
| T5 | **BE-A v1.0.1** (B16 tính thử ADR-015, giá đã lên lịch + hủy, migration **0089** `simulation_guard` + `GRANT DELETE room_list_price`) | `be-a-v1.0.1` = `1552e495` (7 commit, 40 tệp). Gốc `a54cd6f2` (27/10), **kém `main` 171 commit**. 0089: idx 65, `when` = 0088 + 2000 → **vẫn đúng** (schema `main` không đổi từ 27/10, `main` chưa có migration nào sau 0088) | SEC lượt 2: chấp nhận gộp (thẻ 01–04, 08 đóng; 05–07 → v1.1). BE-B lượt 1: 1 Major (01) → BE-A sửa theo phương án A ở `1552e49`, **BE-B chưa xác nhận lượt 2**. **ARC chưa review mã. QA chưa test** | (a) Giải 5 xung đột: `decision-log.md`, `business-rules.md`, `br-examples.json`, `frontdesk.module.ts`, `platform.module.ts`. Hai module này `main` đã tách sang `worker-hooks.ts` / `audit-entities.ts` (fix worker audit registry, J15) → phải nối lại hook/port mới của BE-A ở **cả api lẫn worker**. (b) Chạy lại ảnh chụp 72 bảng + toàn bộ api (điều kiện SEC). (c) SEC Minor: test `AuditService.record`/`recordMoney` chỉ dùng `tx.query` + chú thích. (d) ARC review mã. (e) BE-B xác nhận FB-01 | BE-A; ARC, BE-B, SEC (đọc lại diff gộp) | 2 |
| T6 | **FE-A v1.0.1** (hộp Trả sớm 3 bước, danh sách giá hẹn + hủy trên ngăn kéo căn) | `fe-a-v1.0.1` = `43a3a5a7` (9 commit). Gốc như T5 | UXD lượt 2 Đạt có điều kiện; thẻ 13–15 đã sửa ở `43a3a5a`, **UXD chưa xác nhận lượt 3**. DOM đã duyệt chữ (ED-01…07). **QA chưa test** | Xung đột `decision-log.md` + `strings.js` (tệp sinh → chạy `gen_strings.py`). UXD xác nhận 13–15. QA | FE-A; UXD, QA | 2 |
| T7 | **PN-01** – migration **0090** (trigger chỉ-thêm-dòng `privacy_notice_version`, chặn cả `ottimo_owner`) + đăng ký audit entity | **Chưa có nhánh** (xác nhận). Mã có ở `db29b4ca` + `1420521e` (đã revert khỏi PR #16 ở `cac5c9cc`/`0d13aed8`) | SEC đọc 0090 ở lượt 1 PR #16 ("vượt yêu cầu"); ARC chốt số 0090, idx 66 | Nhánh mới từ `main` **sau T4–T6**: cherry-pick 2 commit, journal idx 66, `when` = 0089 + 2000 = `1792782169681`, snapshot sinh lại từ 0089 (không đổi schema). Đã kiểm: `publish-privacy-notice.sql` chỉ `UPDATE … SET superseded_at = now() WHERE superseded_at IS NULL` (trigger cho qua); e2e `us155-website-requests.r3.spec.ts` dùng `session_replication_role = replica` nên trigger không chạy (không gãy). ARC + SEC xem lại diff (30 phút) | BE (BE-D hoặc BE-A); ARC, SEC | 2 |
| T8 | **Landing – thông báo `2026-10-31` (en, vi)**: ESC-041 C (Google Chat là bên nhận ngoài VN), ESC-042 B (không nêu hạn xóa trong Chat, câu 180 ngày chỉ cho máy chủ), SEC-LP2-02, **SEC-LP2-01 Major `consentMore` → "…from our server within 180 days"** | **Chưa có trên `main`**: `main` vẫn `2026-10-24`, `en.ts:266` vẫn "within 180 days". Chữ en/vi `2026-10-31` chỉ có trong `privacy.ts` của `origin/lp-v2`, trộn Δ5 + ko/zh/ru + nhãn tạm `V3` | Chữ gốc: SEC `esc041…` mục L2 + `lp-v2-privacy-and-api.md` mục 1, 3 | (a) **SEC chốt chữ en/vi cuối cùng của `2026-10-31`** (gồm câu hỏi Δ5 dưới đây). (b) FE-B: nhánh từ `main`, chỉ `landing-web` (`privacy.ts` en/vi + `VERSION = '2026-10-31'`, `consentMore` en/vi). (c) UXD duyệt giọng; QA đối chiếu chữ từng câu + băm 2 trang (như D1). (d) **K1 phải kiểm trước khi đăng** (quản lý phòng xóa được tin do webhook đăng), nếu không câu "including any copy left in our staff chat" thành sai. Phát hành bằng tag `landing-v1.2.0`, rồi `publish-privacy-notice --apply` | SEC, FE-B, UXD, QA, OPS | 1b |
| T9 | **Cherry-pick `ee375e6d`** (BUG-R4-009, số ít/nhiều câu báo giá và tin khách: "(1 nights)") | `ee375e6d` trên `lp-v2-be3`. ARC mô phỏng lên `main`: chỉ xung đột `strings.js` (tệp sinh) | ARC Đạt (`ARC-on-LP-v2-fixes.md` mục 4); QA LP-v2 lượt 3 xác nhận đã sửa | PR riêng: `git cherry-pick -x ee375e6d`, **chỉ commit này** (không `2f7b55f7`). Sinh lại `gen_strings.py`, `gen-quote-copy.mjs --check`, chạy test i18n/guest-web/api theo mục 4.4 ARC. **ARC nới thứ tự**: được đi trước T5–T6. FE-A sinh lại chuỗi khi gộp T6 | BE (BE-B); QA đối chiếu nhanh | 1 (nếu xanh trước khi cắt tag, không thì 2) |
| T10 | **BUG-R3-050** (ngôn ngữ/liên hệ sang hồ sơ khi báo giá) | Nằm trong `lp-v2-fe4` `0a25716a` (chung commit với BUG-R4-007/008, hợp đồng 0.3.10 bổ sung 4). Phần quốc tịch phải đi cùng `lp-v2-fe5` (bổ sung 5, ARC Major FE-LPV2-05) | ARC: phần ngôn ngữ Đạt; quốc tịch Đạt ở fe5; QC tự kiểm | **Không tách sang v1.0.1** (quyết định ARC): tách thì phải kéo theo hợp đồng 0.3.10 bổ sung 4–5 và chuỗi LP-v2. Tách nửa vời sẽ quay lại lỗi quốc tịch `VN` (Major). BUG-R3-050 là P3; PO đã cho phép phương án "không kịp v1.0.1 thì LP-v2 bắt buộc" | PO ghi lại đích | LP-v2 |
| T11 | **OPS `ops-check-no-recipient`** (`email_dead`: đếm `staff.email dead NO_RECIPIENT`, chỉ báo cáo tới khi bật; phần giám sát của BUG-R3-032) | `212cda0a`, **chỉ local, chưa push**. Gốc `972e1699`, kém `main` 156. Xung đột `infra/server/README.md`; `ops-check.sh` và `ci.yml` tự gộp | **Chưa có ARC/SEC review** (OPS: ARC + SEC bắt buộc). ARC đã đòi gộp PR #18 trước (đã xong) và gộp CWD-03 vào nhánh này | Rebase lên `main`; làm CWD-03 (hàm chung `cmd_failed`, không đẩy dòng lỗi `.env` ra webhook cho `j16` và `email_dead`); push, mở PR; ARC + SEC review | OPS; ARC, SEC | 1 (đi kèm nếu kịp, không chặn) |
| T12 | **OPS – `init-secrets.sh` webhook Chat (GC-04)** | Mã có trong PR #16 (`init-secrets.sh`, `docker-compose.prod.yml`, `check-compose.sh`). `deploy.sh` **từ chối** khi thiếu tệp bí mật → staging deploy sau khi gộp PR #16 sẽ hỏng nếu chưa chạy | – | Staging: chạy `sudo …/init-secrets.sh` (không cờ) **trước** khi duyệt deploy staging. Tệp rỗng thì `chat: off {reason: NOT_CONFIGURED}`; muốn thử thật thì dán webhook **phòng thử** (ESC-046). Production: chạy trong khung deploy đợt 1, rồi **INV tự dán** URL phòng "OTTIMO – Yêu cầu đặt phòng" bằng `--set-booking-chat` (URL không qua chat/repo). Kiểm `uid 1000, 0400` (rỗng 0 byte trước khi dán). Làm mới bundle infra trên cả hai máy (compose có secret mới) | OPS; INV dán URL production | 1 |
| T13 | **OPS – README** (khối v1.0.1) | Chưa có. PR #16 không sửa README | – | Thêm khối "v1.0.1 – Google Chat": GC-04; lọc log `chat dead` (QA-GCHAT-04); quy trình đổi mức A→C (★3: báo INV trước, ORC ghi decision-log cũ → mới, giờ, người làm; lưu dòng log `chat detail level`); ★2-bis tạm: chụp `\dp privacy_notice_version` cho tới khi PN-01 lên; K1 và cách xóa tin khi WR8 (SEC L2.2) | OPS | 1 |
| T14 | **OPS – FB-04** (`publish-privacy-notice --candidate-digest` + `--verify`) và **CWD-02** (sao lưu `state/privacy-notice.log`, cảnh báo khi mất log) | Chưa có | – | **Không chặn đợt 1b**: dùng quy trình tạm README 12.3 (ghi version ngay sau deploy landing, cùng phiên SSH). Khoảng hở form trả 422 chỉ 1–2 phút, và hiện chưa vận hành. **Bắt buộc trước LP-v2** (5 ngôn ngữ, đổi version lần nữa). CWD-02 bước 2 (cảnh báo, ~3 dòng) nên làm ngay | OPS; ARC, SEC | 2 (FB-04), 1 (CWD-02 bước 2 nếu kịp) |
| T15 | **INT – K1, ★5, ★5-bis (`messageId`), `threadKey`** | **Không có báo cáo INT** trong repo. Decision-log **không ghi INV bỏ phòng thử**: INV chỉ bỏ ★1 (tự xóa sau 24 giờ, 30/10) | – | **K1**: kiểm được trên phòng thật sau khi đợt 1 lên (yêu cầu "TEST OTTIMO" ở mức A → INV xóa tin webhook → tìm `REQ-…`). Phải xong **trước T8**. **★5 / ★5-bis / `threadKey`**: cần đăng tin mức C có chuỗi tấn công giả → **chỉ làm trên phòng thử** nối staging (ESC-046). Không có phòng thử thì không đạt ★5, tức không đặt được C | INT; INV tạo phòng thử | 1 (K1), C (★5) |
| T16 | **Kiểm mức C** (★2-bis, ★3, ★4, ★5, ★7, ★8, "v1.0.1 lên production và mức A chạy ổn ít nhất một tin") | – | SEC giữ bảng ★ (`SEC-on-BE-gchat-notify.md` lượt 2) | Thứ tự ở mục 4. SEC ghi một dòng decision-log xác nhận → báo INV → OPS đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C` và chỉ khởi động lại worker | SEC, OPS, INV | C |
| T17 | **Danh sách "v1.0.1 bắt buộc" của PO chưa có mã**: BUG-R3-032 (P1, thư Security notice không tới ai; hạn ESC-040 **09/11**; cần ARC thêm trường email người dùng vào hợp đồng), BUG-R3-042 (P1, giữ chỗ có cọc quá hạn), 043, 041 + WA-04, 044, ĐX-R3-QA-01; thông báo khách lưu trú `privacy-2026-10-v2` (mở lại check-in online, kèm câu dịch RR-T4); 045, 046, 047, 052, 053, 036, Wi-Fi `property_wifi`, lọc căn VD, bảng P3 mục 5.6 | **Không có nhánh / commit nào** (`git log --all --grep`) | – | PO chốt lại phạm vi đợt 3. ARC làm hợp đồng cho BUG-R3-032 và 042 ngay để kịp 09/11 | PO, ARC, BE-A/BE-B, FE-A, SEC, UXD | 3 |

### Câu SEC cần chốt ở T8 (không phải câu hỏi INV)
- **Δ5 (câu dịch vụ dịch) có vào `2026-10-31` không?** SEC đặt Δ5 chỉ ở `V3` (LP-v2). Nhưng INV đã cho dùng Google Dịch **ngay từ bây giờ**, trên mọi màn hình Desk (ESC-044, 01/11 câu 9). Đăng `2026-10-31` mà thiếu Δ5 thì thông báo thiếu một bên nhận đang có thật. `2026-10-31` chưa đăng, nên còn thêm được câu. **ARC đề nghị đưa Δ5 en/vi (bản L3 của `SEC-on-LP-v2-code.md`) vào `2026-10-31`**. `V3` vẫn bắt buộc cho LP-v2 (nút ngôn ngữ làm đổi byte trang en/vi), chỉ không còn khác về chữ en/vi. Quyền quyết thuộc SEC.
- Nhãn giữ `2026-10-31`, vì hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` đã dùng nhãn này. Thứ tự thời gian do `published_at` quyết, theo SEC 2.3.

---

## 2. Thứ tự gộp vào `main` và PR cần mở

Luật migration giữ nguyên (decision-log 30/10): mục mới nối cuối, `when` = max trên `main` + 2000, không chèn trước mục đã có.

| Thứ tự | PR | Nội dung | Điều kiện gộp | Ai mở / ai gộp |
|---|---|---|---|---|
| 1 | **#16** (có sẵn) | T1 | OPS đã chạy `init-secrets.sh` trên staging (để deploy staging không bị từ chối). CI `main` sau gộp xanh | ORC gộp |
| 2a | **OPS-v101** (mới) | T11 + CWD-03 + T13 + CWD-02 bước 2 | ARC + SEC duyệt; CI shellcheck + `test-ops-check.sh` xanh | OPS mở; ORC gộp. Chỉ hạ tầng, đi bằng bundle infra, không cần tag image |
| 2b | **cherry-pick `ee375e6d`** (mới) | T9 | Test mục 4.4 ARC xanh; `gen_strings.py` + `git diff --exit-code` sạch | BE mở; ORC gộp |
| 2c | **landing-2026-10-31** (mới) | T8 | SEC chốt chữ; UXD + QA đạt; gộp được bất cứ lúc nào, **phát hành** (tag `landing-v1.2.0`) chỉ sau K1 | FE-B mở; ORC gộp |
| → | **Tag `v1.0.1`** (đợt 1) | 1 + 2b (nếu kịp) | QA smoke staging + QC rút gọn | ORC gắn tag; INV duyệt Release |
| 3 | **v1.0.2-ed** (mới, một PR) | T4 + T5 + T6: merge `arc-contract-v1.0.1` → `be-a-v1.0.1` → `fe-a-v1.0.1` vào nhánh mới cắt từ `main` | Ba nhánh dùng chung OpenAPI 0.3.9 (đã so: `be-a` = `fe-a`, `arc` thêm bổ sung 3), nên gộp một PR để chạy CI một lần. Điều kiện: ARC review mã, BE-B xác nhận FB-01, UXD xác nhận 13–15, ảnh chụp 72 bảng + api + admin-web xanh, QA đạt | BE-A mở (FE-A cùng làm); ORC gộp |
| 4 | **PN-01** (mới) | T7, migration 0090 | Sau PR 3. ARC + SEC xem diff | BE mở; ORC gộp |
| 5 | **gchat-hardening** (mới) | T2 + T3 (không migration) | Sau PR #16. SEC + QA duyệt | BE-D mở; ORC gộp |
| → | **Tag `v1.0.2`** (đợt 2) | 3 + 4 + 5 | QA đạt (B16 tiền theo oracle BR-428-01…09), QC rút gọn | ORC; INV duyệt Release |
| 6 | `lp-v2` → `main` (QC M3/M4) | OpenAPI LP-v2 → **0.3.10** sau 0.3.9; migration LP-v2 **0091 idx 67** (đã đúng tên và `when`, chỉ đổi idx + sinh lại snapshot từ 0090); `privacy.ts` en/vi lấy `2026-10-31` trên `main` làm gốc; `ops-check.sh`/README gộp với PR 2a | Sau PR 3–4 | LP-v2 theo QC gate |

Đánh số tag: đợt 1 nhận `v1.0.1`, đợt 2 nhận `v1.0.2`, đợt 3 nhận `v1.0.3`. Danh sách "v1.0.2" cũ của PO (backlog 5.6) dời sang `v1.0.4` hoặc gộp vào đợt 3, tùy PO. PO/BA sửa các chỗ trong release notes và sổ tay đang ghi "v1.0.1 (04/11)" cho trả phòng sớm. Đây là đề xuất ARC; quyền chốt thuộc ORC/PO.

---

## 3. Ba đợt phát hành, việc, ước giờ

### Đợt 1 – `v1.0.1`: tin Google Chat mức A (+ số ít/nhiều, + ops-check nếu kịp)
| Việc | Vai | Ước giờ | Phụ thuộc |
|---|---|---|---|
| `init-secrets.sh` (không cờ) trên staging; làm mới bundle infra staging; dán webhook phòng thử nếu INV tạo (ESC-046) | OPS (INV dán URL phòng thử) | 0,5 h | – |
| Gộp PR #16; duyệt deploy staging | ORC | 0,5 h + CI ~30 phút | việc trên |
| README khối v1.0.1 (T13); PR OPS-v101 (T11 + CWD-03 + CWD-02 bước 2) | OPS | 2 h | – |
| Review PR OPS-v101 | ARC, SEC | 0,5 h mỗi vai | PR OPS-v101 |
| Cherry-pick `ee375e6d` (T9) | BE-B | 1 h | – |
| QA staging: smoke-prod 9/9; `appconfig` thấy `chat: off NOT_CONFIGURED` (hoặc `on` + tin `[staging]` mức A nếu có phòng thử); BUG-R4-009 câu EN/VI/RU; nhắc 07:30 và tin quá hạn bằng cách đọc log/outbox | QA | 1,5 h | staging chạy commit mới |
| QC rút gọn đợt 1 | QC | 0,5 h | QA |
| Production: sao lưu tay; `init-secrets.sh` + **INV `--set-booking-chat`**; làm mới bundle infra; INV duyệt Release `v1.0.1`; `ops-check` 7/7; `appconfig` thấy `chat: on`, mức A | OPS + INV | 1 h | QC |
| Khói: INV gửi "TEST OTTIMO" (gõ đúng chuỗi thử, tắt tự điền – bài học 30/10) → tin mức A tới phòng → **K1**: INV xóa tin webhook, tìm `REQ-…` → WR8 xóa yêu cầu thử → lệnh đếm | INV, OPS, INT ghi kết quả | 0,5 h | deploy xong |

**Lên production sớm nhất: 02/11 khoảng 09:00–11:00** nếu đội bắt đầu ngay tối nay (cần khoảng 5 giờ làm việc thực). Có thể đêm 01/11 sau 00:30 nếu INV còn thức để duyệt Release và dán URL, nhưng ARC không khuyên thao tác bí mật production lúc khuya.

### Đợt 1b – `landing-v1.2.0`: thông báo `2026-10-31`
| Việc | Vai | Ước giờ |
|---|---|---|
| Chốt chữ en/vi `2026-10-31` (Δ5, SEC-LP2-02, SEC-LP2-01) | SEC | 1 h |
| PR landing (T8) | FE-B | 1–1,5 h |
| Duyệt giọng; đối chiếu chữ + băm 2 trang trên digest CI | UXD; QA | 0,5 h; 1 h |
| Sau K1: tag `landing-v1.2.0`, INV duyệt Release, `deploy-landing.sh` rồi `publish-privacy-notice` chạy thử → `--apply` **cùng phiên SSH**; kiểm `form-token` 200, băm khớp | ORC, OPS, INV | 0,5 h |

**Sớm nhất: 02/11 chiều**, ngay sau K1 của đợt 1. Đợt 1b không đụng Desk.

### Đợt 2 – `v1.0.2`: trả phòng sớm + giá hẹn + PN-01 + làm sạch chữ Chat
| Việc | Vai | Ước giờ |
|---|---|---|
| Nhánh `v1.0.2-ed`: gộp T4 → T5 → T6, giải 5 + 2 xung đột, nối hook/port của BE-A vào cấu trúc `worker-hooks.ts`/`audit-entities.ts` mới trên `main` (api **và** worker), sinh lại chuỗi | BE-A + FE-A | 4 h |
| Test: ảnh chụp 72 bảng, api toàn bộ, `b16-preview-v101`, `rooms-scheduled-prices-v101`, admin-web; SEC Minor `recordMoney` | BE-A, FE-A | 1,5 h |
| Review mã BE-A v1.0.1 + diff gộp; BE-B xác nhận FB-01; UXD xác nhận 13–15 | ARC 2 h; BE-B 0,5 h; UXD 0,5 h | – |
| PN-01 (T7) | BE | 1,5 h (+ ARC/SEC 0,5 h) |
| gchat-hardening (T2 + T3) | BE-D 3–4 h; SEC 1 h; QA 1 h | – |
| QA staging: B16 tính thử ↔ ghi thật theo oracle BR-428-01…09 (gồm trần số dư, đổi phòng, OTA), giá hẹn + hủy, PN-01 (UPDATE/DELETE bị chặn, `publish-privacy-notice` vẫn chạy), hồi quy | QA | 5–6 h |
| QC rút gọn; production: sao lưu, INV duyệt Release `v1.0.2` (migration 0089 + 0090), `ops-check` | QC, OPS, INV | 1,5 h |

**Sớm nhất: 03/11 chiều**. Vẫn sớm hơn mốc cũ 04/11.

### Mức C (cấu hình, không cần tag mới)
Thứ tự: đợt 1 chạy mức A ổn (ít nhất một tin) → K1 đạt → đợt 1b đăng `2026-10-31` (★8) → đợt 2 có PN-01 (★2-bis) và gchat-hardening (GCHAT-07, BUG-R3-058, FB-06, mục 10) → INT chạy ★5 + 2 ca ARC + 2 ca SEC + thẻ 06 + Q3 điều kiện 2 (`mailto:`) + ★5-bis `messageId` + `threadKey` trên **phòng thử** ở mức C → INV xác nhận ★4 (thành viên phòng, 2 bước) và ★7 (điện thoại) → SEC ghi dòng xác nhận → **báo INV** (đổi `.env` production) → OPS đặt C, khởi động lại worker, ORC ghi decision-log (★3).
**Sớm nhất: 03/11 tối – 04/11.** Cho tới lúc đó tin Chat chỉ có mã, giờ nhận, hạn phản hồi, mức gấp và link Desk.

### Đợt 3 – `v1.0.3`: lỗi giữ chỗ + thư Security notice + thông báo khách lưu trú
- BUG-R3-032 (P1): ARC thêm trường email người dùng vào hợp đồng (0.3.11, sau LP-v2 0.3.10 – hoặc 0.3.10 nếu lên trước LP-v2; ARC đánh số lúc gộp), BE-A/FE-A, `production-bootstrap` đặt email chủ. **Hạn cứng 09/11** (ESC-040).
- BUG-R3-042 (P1), 043, 041 + WA-04, 044, ĐX-R3-QA-01; `privacy-2026-10-v2` + câu dịch (RR-T4) để mở lại check-in online; các P2/P3 còn lại do PO xếp.
- **Đích: chậm nhất 07/11**. PO chốt phạm vi trong 02/11.

---

## 4. Rủi ro

| # | Rủi ro | Mức | Xử lý |
|---|---|---|---|
| R1 | `be-a`/`fe-a` cũ 5 ngày. `main` đã tách đăng ký hook/audit cho worker (J15, worker audit registry). Gộp sai thì worker thiếu hook mới, hoặc tính thử B16 mất chốt | Cao (logic tiền) | Gộp trong một PR; ARC review riêng phần nối hook; test worker-only + ảnh chụp 72 bảng; QA theo oracle. Hiện chưa vận hành nên lỗi chưa chạm khách thật |
| R2 | Quên GC-04 → deploy staging/production bị `deploy.sh` từ chối | Thấp (từ chối sạch, không gián đoạn) | `init-secrets.sh` đứng trước việc gộp PR #16 trong checklist |
| R3 | K1 sai (quản lý phòng không xóa được tin webhook) → câu "Your rights" của `2026-10-31` sai, không bật được C | Trung bình | Kiểm K1 trước đợt 1b. Sai thì SEC sửa câu trước khi đăng; đường dự phòng là Chat app tự xóa (≈ 3 công, ARC) |
| R4 | Không có phòng thử → ★5 không đạt → không đặt được C | Trung bình | ESC-046 |
| R5 | Khoảng hở 422 khi đổi version thông báo (FB-04 chưa có) | Thấp (hiện chưa vận hành) | Ghi version cùng phiên SSH; FB-04 làm trước LP-v2 |
| R6 | Thông báo `2026-10-31` thiếu Δ5 trong khi đã dùng Google Dịch | Trung bình (pháp lý) | SEC chốt (mục 1). ARC đề nghị đưa vào |
| R7 | Gộp LP-v2 sau v1.0.1: OpenAPI, journal, `privacy.ts`, `ops-check.sh`, README đều xung đột | Trung bình | Đã định ở bảng mục 2 dòng 6 (QC M3/M4) |
| R8 | BUG-R3-032 (P1) trễ quá 09/11 → vi phạm điều kiện ESC-040 | Trung bình | Tách đợt 3 ngay, ARC làm hợp đồng trong 02/11. Trễ thì SEC báo INV như ESC-040 đã định |
| R9 | ESC-045 câu 2–6 (trẻ từ 6 tuổi 150.000, đóng tiền tháng ngày 05, tháng đầu tính lẻ, mất ký quỹ khi trả sớm) có thể cần sửa mã giá/HĐ tháng. **Không nằm trong v1.0.1** | – | ORC giao DOM/BA chốt BR, ARC đánh giá mã nào là tham số (OWN tự đặt) và mã nào phải sửa, rồi xếp vào đợt 3 hoặc một bản giá riêng |

---

## 5. Giả định
- G1: Hiện chưa có khách thật trên production (theo lời INV 01/11), nên mỗi đợt được deploy bất cứ giờ nào INV duyệt. Khởi động lại api mất khoảng 3,5 giây (đo ở G3 ngày 30/10).
- G2: Phòng "OTTIMO – Yêu cầu đặt phòng" đã có (INV 31/10). Webhook cho phòng do INV tạo trong Google Chat và tự dán lên máy chủ.
- G3: Staging vẫn chưa nhận form (`LANDING_BASE_URL` api staging rỗng, 30/10). QA kiểm Chat end-to-end trên stack thử với webhook giả như lượt PR #16. Kiểm với Chat thật thì cần phòng thử.
- G4: Cách đánh số tag theo đợt (mục 2) do ORC/PO chốt. Kế hoạch giữ được nếu đổi tên tag.
