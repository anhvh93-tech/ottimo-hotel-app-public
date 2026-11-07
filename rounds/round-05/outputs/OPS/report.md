# Báo cáo OPS – Round 5, Gói 0 (ĐK-8 và việc vận hành v1.0.5), bước Sản xuất (06/11/2026)

ORC lưu tệp này từ báo cáo bàn giao của OPS (subagent không ghi tệp báo cáo).

## 1. Đã làm gì
- **ĐK-8:** trả lời đủ thẻ SEC 06/11 trên `main` (`a26804f6`, `c224f0e8`, `3027ab01`).
- **Ba PR chờ SEC + ARC review** (OPS không tự gộp):
  - #92 `r5-ops-caddy`: V5-67, Caddy landing bỏ `Authorization`;
  - #93 `r5-ops`: V5-73, V5-62, V5-65, V5-63, thẻ ARC-07, ARC-08;
  - #95 `r5-ops-runbooks`: runbook v1.0.5 r0 (V5-70, có bước gỡ khóa V5-65) và runbook "VPS mới" (V5-64).
- **Giờ sao lưu** (đọc từ repo, không cần kiểm thêm trên máy chủ):
  - production: `ottimo-backup@ottimo-prod.timer` lúc 03:00, lượt hai 15:00;
  - staging: `ottimo-backup.timer` lúc 03:30, lượt hai 15:30;
  - mỗi môi trường đúng một timer; khoảng cách 12 giờ.
- **V5-63** (PR #93):
  - log container sang `journald`, giữ 90 ngày;
  - `ops-check journal` (ARC-07): FAIL/WARN, kiểm nhóm `docker`;
  - Postgres `log_error_verbosity=terse` (ARC-08).
- **Kiểm:**
  - test infra cục bộ xanh; chạy trên mã cũ thì đỏ đúng chỗ;
  - CI job `infra scripts` của #93 xanh;
  - test API `reservation-list` đỏ một lần rồi xanh khi chạy lại (nghi chập chờn, ARC xét).
- Không SSH, không đổi gì trên máy chủ.

## 2. Con số "máy chủ mất hẳn"
Tính từ bản mới nhất trên Mac. Đã ghi ở mô tả PR #93, `product/infra/server/README.md` mục 7, `product/docs/hosting-plan.md` mục 8.

| Lịch | Tối đa | Khi kéo khoảng 19:00 |
|---|---|---|
| Trước v1.0.5, kéo tay 2 ngày một lần | 72 giờ | 64 giờ |
| Từ v1.0.5, kéo tay 2 ngày một lần | 60 giờ | khoảng 52 giờ |
| Mac tự kéo hằng ngày | khoảng 36 giờ | – |

## 3. Thẻ đã trả lời
- 054-01: Done.
- 054-02…06: Deferred → B-OPS.
- OR-01: Closed.
- OR-02: Open, chờ chủ đầu tư.
- OR-03: phần code Done; phần máy chủ làm ở W0.
- OR-04 → V5-63: đã làm.
- S6D-01: Done.
- FB-R5-SEC-ARC-07: Resolved (ý 1 Deferred).
- FB-R5-SEC-ARC-08: Resolved.
- FB-R5-SEC-ARC-09: OPS xác nhận giờ; chờ ARC sửa contract mục 1.14 và G7.

## 4. Việc trên máy chủ (cửa sổ bảo trì, cần chủ đầu tư đồng ý)
Không chạy trong 02:55–03:45 và 14:55–15:45.
- W0: gỡ khóa người `ottimo-ops`; làm trước P2b.
- P2b: làm mới gói `infra/` trên cả hai stack.
- W1: cài timer sao lưu, trước 15:00. Cài sau 15:00 thì một lượt chạy ngay, vì `Persistent=true`.
- W2: dựng lại container landing.
- W3: kiểm qua edge thật trên staging.
- W4: dọn `.env` staging.
- W5: mask `fwupd`.
- W6: chuyển log sang journald: staging, rồi production, rồi edge. Desk mất vài giây khi Postgres khởi động lại.
- W7: chạy `ops-check` đủ mục bằng `systemd-run` có nhóm `systemd-journal`.
- M4d: chạy trước lượt tính lại V5-17.

## 5. Giả định
- 15:00 cho production: chia đều 12/12, tránh giờ nhận phòng 14:00.
- Bản giữ theo tuần giữ tới 33 ngày, để mọi tệp vẫn dưới 35 ngày khi lỡ hai lượt.
- Ngưỡng `ops-check backup` 14 giờ.
- `SystemMaxUse=4G` là số đầu; đo lại 7 ngày sau W6.
- `ForwardToSyslog=no`; `RateLimitBurst=20000`/30 s.
- Câu đếm M4d là nháp, chờ SEC.
- "RPO 12 giờ" chờ chủ đầu tư xác nhận ngày 20/11.
- Hai stack dùng chung user `ottimo` và một `authorized_keys`; W0 bước 2 kiểm lại trước khi gỡ.
- ESC mới: không có.

## 6. Rủi ro / vướng mắc
- `id_hash_key` chưa có bản ngoại tuyến. Đề xuất cho SEC + ARC: chủ đầu tư giữ thêm bản này cạnh KEK. Mất hẳn VPS thì chỉ mục mù không khớp dữ liệu cũ tới khi băm lại.
- ARC-08 còn hai chỗ hở nhờ SEC xét: câu lỗi chính vẫn có thể chứa giá trị; dòng `STATEMENT` in nguyên câu SQL (`log_min_error_statement=panic` chưa thêm).
- Runbook VPS mới chưa diễn tập.
- Trên VPS hiện tại, `ops-check sshkeys` và `journal` sẽ FAIL tới khi làm W0 và W6.
- Chữ "14:00" ở sổ vận hành, release-notes, esc-pending: đã sửa thành 15:00 (BA `16eaa635`, ORC `d93d3e7c`, `1fbd6039`).

## 7. Việc chưa xong
- Ô `⟨CHỜ⟩` của runbook: điền lúc cắt bản.
- Đo `SystemMaxUse` 7 ngày sau W6.
- OR-L1 (khóa `.env` trùng): ngoài việc được giao, chưa làm.
- Việc trên máy chủ ở mục 4.

## 8. Cập nhật 06/11 tối – Phản hồi & sửa sau review ARC và SEC (#93, #95)
ORC lưu từ báo cáo bàn giao của OPS.
- **PR #93** (`r5-ops`, HEAD `59216001`):
  - đã sửa ARC OPS-06 và SEC 93-01, 93-02, 93-03;
  - CI xanh toàn bộ, MERGEABLE;
  - SEC duyệt có điều kiện, điều kiện đã đáp ứng.
- **PR #95** (`r5-ops-runbooks`, HEAD `bd175b80`):
  - runbook v1.0.5 và runbook VPS mới lên bản r1;
  - đã sửa ARC 01–05, 07 và SEC 95-01…07;
  - CI xanh toàn bộ, MERGEABLE;
  - chờ SEC và ARC đọc lại phần sửa (ORC đã giao 06/11).
- **Thứ tự gộp:** #93 trước #95. #95 gộp sau #94 (thứ tự ARC đề xuất).
- **Câu xin đồng ý mẫu theo đợt:** ở runbook r1 mục 0.2.
  - Đợt A: staging.
  - Đợt B: production, gồm W0, W5, P2.
  - Đợt C, P3–P5: chỉ sau khi diễn tập khôi phục V5-61 ĐẠT (QC R4 ĐK-2, SEC 95-02).
  - K: chạy riêng.
  - ORC dùng đúng câu mẫu khi xin chủ đầu tư; mỗi đợt xin riêng, đồng ý cho staging không thay cho production.
- **Việc chuyển:**
  - SEC 95-02 ý 4 → PO ghi vào plan ĐK-2: V5-61 chưa đạt thì v1.0.5 chưa lên production.
  - SEC 95-07 → ORC theo dõi khi cắt bản.

## 9. Cập nhật 07/11 – Phản hồi & sửa lượt 3 (sau khi #93, #95, #96, #109 gộp)
Thẻ trả lời ở `rounds/round-05/responses/OPS-responses.md`.

**PR #126 (`r5-ops-pgterse-fix`), gấp:**
- Sửa FB-R5-ARC-OPS-11: test `postgres-log-terse` chờ server thật qua TCP, báo lỗi kết nối riêng. Test này làm job `infra scripts` đỏ ngẫu nhiên ở mọi PR.
- Kiểm ở máy:
  - bản sửa 20/20 xanh khi chạy tuần tự, 12/12 xanh khi chạy song song;
  - bản cũ 10/12 khi chạy song song, đỏ đúng 2 dòng ARC thấy.
- Sửa FB-R5-SEC-BE-D1-04: CODEOWNERS thêm 4 tệp SEC.

**PR runbook r3 (`r5-ops-runbook-r3`):**
- P2c và P2 mục 8 dùng khối `v525-run` SEC ghim, chép nguyên văn. Trích ra từ runbook vẫn đúng SHA `60872413…41eb`.
- Bảng 0.1 đã điền:
  - `SHA_V525` = `897ff46e`; tệp SQL `f5db74ac…243f`, kiểm bằng `shasum`;
  - 7 khóa dừng;
  - nhãn hai dòng đếm;
  - hai merge commit #96 / #109.
- Cách đọc hai dòng đếm theo ORC 07/11 và ARC 12.6.
- K13 đếm bảng hoa hồng mới (V530-01 + DOM). Câu chờ SEC ghim; đã chạy thử trên DB dùng một lần.
- Luật `roles_version` ở luật chung và README `server` 11.1.

**Giả định:**
- K13 in ngày tạo thay cho lọc theo giờ triển khai. Lý do: câu là hằng nên ghim được, và INV có thể đã nhập bảng trên v1.0.4.
- "Đơn có người chốt" = đơn ngắn ngày, người chốt là sale/CTV, đúng luật của `syncCommission`. Chờ DOM xác nhận.

**Vướng:**
- Lúc nộp, job `gitleaks` đỏ ở PR #126. Lý do: commit `ae4a8358` trên nhánh `r5-s1-tests` (PR #123, BE) có một hằng thử dạng UUID ở `product/services/api/test/request-hash-guard-units.test.ts` dòng 20, bị luật `generic-api-key` bắt.
- Job quét mọi nhánh đã fetch, nên mọi PR đều đỏ tới khi xử lý. Không do PR của OPS.
- Cách xử lý chờ ORC/SEC quyết: một dòng allowlist neo đúng giá trị (đường dẫn SEC), hoặc BE viết lại lịch sử nhánh đó.
- **Đã xử lý:** SEC thêm allowlist theo commit trên `main` @ `ad70dc21`. ORC gộp `main` vào #126 và #129.

## 10. Cập nhật 07/11 – Phản hồi & sửa lượt 4 (review #126, #129)
Nguồn:
- `rounds/round-05/reviews/DOM-on-pr-99-delta-and-129.md`;
- `rounds/round-05/reviews/ARC-on-ops-prs-126-129.md`;
- `rounds/round-05/reviews/SEC-on-ops-prs-126-129.md`.

Thẻ trả lời ở `rounds/round-05/responses/OPS-responses.md`.

**#126:** ARC và SEC duyệt @ `d11a2700`. OPS không đẩy gì thêm vào #126. Các dòng CODEOWNERS reviewer gợi ý thêm đi vào #129.

**#129 (runbook r4, một lần đẩy):**
- **K13 đổi câu theo DOM 129-01, 129-02:**
  - dòng đếm đơn tỷ lệ cũ tính theo dòng hoa hồng chưa void và ngày chụp tỷ lệ, so tỷ lệ ngay trong câu; tách thêm phần đã đạt và phần dự kiến;
  - dòng mới đếm đơn hủy hoặc không đến mà OTTIMO giữ tiền.
- **Hệ quả:** bản ghim SEC r3 (`9fda2a80…`, `e601cfcd…`) không còn dùng được. SEC phải ghim lại câu r4 (`c13c4d68…0d71`) và khối chạy (`4f89c218…32ab`).
- **Chạy thử câu r4** trên DB dùng một lần có đủ 72 migration thật và vai thật: mọi ca DOM nêu ra đúng số kỳ vọng; không lộ chuỗi đánh dấu hay tỷ lệ; dòng gác dừng đúng.
- **Repo chỉ ghi `= 0` / `> 0`** cho các dòng đếm đơn (SEC 129-01). K13 áp đủ luật "Thêm" của P2c.
- **P2c bước 2** dùng `git -C` vào repo (ARC 129-01). OPS tái hiện lỗi cũ: chạy ngoài repo ra `fatal: not a git repository` rồi `THIEU`. Bản sửa ra `TRUNG`, `CO`, `CO`.
- **README 11.1:** thêm `granted_by`/`granted_at` khi cấp vai (ARC 129-02); thêm dòng audit tùy ARC xác nhận, và vai DB do ARC + SEC chốt (SEC 129-02).
- **CODEOWNERS:** thêm 3 dòng SEC: `postgres-log-terse.test.sh` (ARC 126-01), `scripts/*.sh`, `src/admin/` (SEC 126-01).

## 11. V5-47 – tờ in và trang khách tự so chữ khi build (Sản xuất, 07/11)
Nguồn: thẻ FB-R4-PO-UXD-IDS2-02 (`rounds/round-04/reviews/PO-on-v104-id-sheet-v2.md`) và FB-R4-SEC-UXD-IDS2-01 (`SEC-on-v104-id-sheet-v2.md`). Nhánh `r5-v5-47`, reviewer UXD, SEC, PO.

**Đã làm:**
- `product/design/tools/check_print_notice.py` (stdlib, `python3 -I`): so 4 khóa `gw.notice_*` của trang khách với Tờ 4 (EN + VI) và Tờ 4ru (EN + RU), ở hai nơi:
  - Markdown của one-pager;
  - 4 tệp HTML đã dựng (5 tờ, tính cả 2 bản của tờ A4 cắt đôi).
- Trang được đọc đúng như guest-web hiển thị: thứ tự `NOTICE_PARAGRAPHS`, luật ngôn ngữ pháp lý `legalLocale`. Chân tờ `vN` phải là version có chữ trên trang (`NOTICE_TEXT_VERSIONS`).
- Lệch thì thoát 1, in chữ trang, chữ tờ và phần khác nhau dạng `[-chữ trang-] {+chữ tờ+}`. Ký tự không thấy được hiện dạng `<U+00A0>`.
- `build_print_sheets.py` dừng trước khi ghi tệp nếu Markdown Tờ 4 lệch trang. Hàm tách đoạn được tách ra thành `notice_parts` để bộ dựng và bộ so dùng chung. HTML dựng ra không đổi byte nào: đã so 6 cách dựng `notice_sheet` trước và sau khi sửa.
- 25 ca kiểm, ở `product/design/tools/tests/test_check_print_notice.py` (2 ca thêm cho SEC 165-01: tập tờ Tờ 4 ghi cứng `EXPECTED_NOTICE_JOBS`, JOBS đổi thì thoát 2).
- CI job `build-test`: 2 bước ngay sau `Copy is generated`, chạy cả khi bước trước đỏ (`!cancelled()`).
- Thêm dòng sự cố ở `dev-setup.md` mục 8. CODEOWNERS: thêm 2 dòng SEC.

**Kết quả hôm nay:** KHỚP. 7 tờ × 4 khóa, chân tờ v2 = `privacy-2026-10-v2`. Không có chữ nào lệch, nên không có câu nào cần hỏi UXD.

**Giả định:**
- Tách `gw.notice_body` thành 2 đoạn là luật đã duyệt (SEC mục 0). Đổi cách tách thì UXD + SEC duyệt, như khi đổi chữ.
- Chữ **đậm**/*nghiêng* trên tờ không tính là đổi chữ.
- Khoảng trắng ASCII liền nhau được gộp thành một, như trình duyệt vẫn làm. Ngoài chuyện đó, U+00A0 và mọi ký tự khác phải giống hệt.

**Chưa làm / ngoài phạm vi:**
- Không so PDF (Chrome in PDF từ HTML).
- Không so nhãn, tiêu đề, dòng phụ, tháng ở chân tờ, vì các phần này chỉ có trên tờ.
- Thấy thêm khi dựng thử: HTML Tờ 1 và Tờ 4 đã commit chưa dựng lại sau các lần đổi CSS gần đây (`.snug` ngày 07/11, đường kẻ tờ nhân viên). Chữ Tờ 4 không đổi. Tờ 1 khác dòng bản in ở chân tờ. Việc này của UXD, nêu ở PR.
