# SEC review – Chuẩn bị bật form "Yêu cầu đặt phòng" (US-155) trên ottimo.vn

- Người review: SEC | Ngày: 30/10/2026 | Round 3 – Bước: Review.
- Đối tượng: `rounds/round-03/outputs/FE/us155-enable-readiness.md` (FE-B, 30/10). Đọc thêm:
  - `reviews/s1-SEC-on-us155.md`, `reviews/s1-SEC-on-landing.md`;
  - `outputs/QA/s1-us155-e2e.md` mục 0;
  - `product/apps/landing-web/src/content/privacy.ts`, `en.ts`/`vi.ts` (ô đồng ý);
  - `04-investor-feedback/lawyer-questions-2026-10-26.md` (Phụ lục A/B gửi luật sư);
  - migration 0086 (`privacy_notice_version`), erd 4.14;
  - decision-log 22/10–30/10; `qc/v1-gate.md` G4-12.
- Mốc mã: `v1.0.0` = `8b3aec8` (production). `git diff a1da76f..8b3aec8` trên `public-site`, `webreq` và `website-requests`: chỉ chuyển allowlist audit (SEC đã Verified ở T1, `SEC-on-rc6.md`). Màn S35 và luồng công khai không đổi. Vì vậy kết quả QA lượt 2 trên `a1da76f` vẫn đúng cho `v1.0.0`.
- Không chạy lệnh nào trên production. Không có dữ liệu thật trong tệp này.

## Kết luận

| # | Việc ORC giao | Kết luận SEC |
|---|---|---|
| 1 | Xác nhận điều kiện #1, #7; ghi #4, #5 | **#1 Đạt. #7 Đạt.** #5 Đạt và #4 (phần luật sư) Đạt **theo lời INV** 30/10. #4 phần "đã đăng + đã ghi phiên bản" chờ bước I–J. Trạng thái đủ 7 điều kiện xem mục 1. |
| 2 | 4 khoảng trống của thông báo `2026-10-24` | **Bật với bản `2026-10-24` nguyên văn trong mã. Không sửa trước khi bật, không đổi version.** Cả 4 điểm gộp vào **một** version kế tiếp, đi cùng câu đếm truy cập C+ (ESC-034). Chữ cho version đó có ở mục 2.4. |
| 3 | Bước ghi `privacy_notice_version` trên production | **Duyệt hướng FE-B**, kèm 12 yêu cầu tối thiểu ở mục 3 (thẻ 01, Major). Nói gọn: chỉ chạy bằng một script trong repo đã được ARC + SEC duyệt; không gõ SQL tay; chạy thử trước; băm lấy từ image, không gõ tay; chỉ thêm dòng; có audit. |
| 4 | Tin Google Chat (thiết kế ARC) + S1–S3 | Thiết kế ARC **Đạt có điều kiện**. **S1:** chỉ gửi mã, giờ nhận, hạn phản hồi, mức gấp "cần gọi ngay", "cần xem kỹ", link Desk có UUID. **Không gửi** ngày đến, số đêm/tháng, số khách, loại lưu trú: đây là thông tin chuyến đi, nối được với người qua mã. Gửi thì trái ESC-002 A và làm thông báo đã duyệt thành sai. **S2:** đồng ý bí mật tệp chỉ worker đọc + kiểm URL, thêm 7 ý. Không xoay định kỳ, xoay khi có sự kiện. **S3:** không thêm hạng phòng. Muốn có thông tin chuyến đi thì phải ESC + câu thông báo mới. Mục 4, thẻ GCHAT-01 (Major), GCHAT-02 (Minor). |

Không có Blocker. Không có ESC mới. Hai việc INV cần biết, không phải quyết, ở mục 2.3.

---

## 1. Bảy điều kiện SEC cho mốc "bật form" – dòng xác nhận

| # | Điều kiện | SEC ghi 30/10 |
|---|---|---|
| 1 | B.2.1–B.2.3 phía Desk S35 có test E2E | **Đạt.** QA lượt 2 trên `a1da76f`: TC-WR-005, 006, 007, 010. SEC đã đọc mã test của các ca này. (a) Tên `<img src=x onerror=…>` và URL trong lời nhắn hiện nguyên chữ. Đếm `img[src="x"]` = 0 và `a[href*=evil]` = 0, không có `alert()`, có nhãn `contains_url`. Thông báo và "Cần chú ý" không chứa chuỗi độc hại. (b) U+202E bị bỏ trong DB và không hiện trên Desk. (c) CCCD liền dãy hoặc có dấu cách, gạch, chấm → 422, không lưu. Log mọi container, gồm access log thật của Caddy landing, không có số. Đủ yêu cầu FB-R3-SEC-US155-03 phần B.2. |
| 2 | Caddy landing, `LANDING_BASE_URL`, khóa ký, runbook api 1 bản | **Đạt trên repo** (24/10). Bước VPS (H) chưa làm. SEC cần nhận: kết quả `ops-check`; `curl` qua `ottimo.vn` cho `form-token` 200, `/v1/me` 404, `/v1/auth/login` 404; quyền tệp secret `public_form_signing_key` (0400, chỉ in quyền, không in nội dung). |
| 3 | C-1: image landing có form do CI dựng, qua `check:dist` + Playwright, 0 request ra ngoài, CSP sạch | **Chưa.** Chờ bước F–G. SEC xác nhận khi QA chạy trên **đúng digest** `ottimo-landing:sha-…` mà bước I sẽ deploy. |
| 4 | C-3 (a): thông báo EN + VI được luật sư duyệt, đã đăng, đã ghi `privacy_notice_version` | **Phần luật sư: Đạt theo lời INV** (decision-log 30/10: "luật sư ok hết rồi"). Đội không giữ văn bản luật sư; INV giữ trong hồ sơ OTTIMO, ngoài repo. SEC không đọc văn bản đó. Bản luật sư nhận là Phụ lục A/B của thư 26/10, nguyên văn `privacy.ts` `2026-10-24`, cộng thêm một câu đếm truy cập (xem 2.3). **Phần đăng + ghi phiên bản: chưa.** Chờ bước I–J theo mục 3. |
| 5 | C-13: luật sư trả lời LZ-2, LZ-8 | **Đạt theo lời INV** (cùng dòng 30/10). Hiểu là câu 2 (giữ ô đồng ý, căn cứ "sự đồng ý") và câu 3 (bật form được) đều "Đồng ý". Đây là **lời INV**, không phải SEC tự kết luận về pháp lý. |
| 6 | SEC-G1/G2 cho Desk chạy dữ liệu thật | **Đạt.** G1 Đạt (29/10). G2 Đạt sau khi L-1 đóng (OPS 30/10, 12:46). |
| 7 | E2E US-155 trên stack có `LANDING_BASE_URL` + khóa ký + Caddy landing thật | **Đạt.** 13/13 trên `a1da76f`, gồm kill switch TC-WR-008. Landing dựng từ `Dockerfile.landing` có `check:dist`, mount `Caddyfile.landing` thật, `LANDING_PUBLIC_API=on`, api tin đúng IP landing. Lượt "staging" ở bước G chạy lại các ca này trên image phát hành, phục vụ #3, không phải điều kiện lại cho #7. |

**Mốc SEC xác nhận** khi có đủ: #2 (bằng chứng VPS), #3 (bước G), #4 phần đăng (bước J: `/privacy/` và `/vi/privacy/` trả 200, dòng phiên bản đúng `2026-10-24`, băm trong DB khớp trang thật), cùng kết quả khói bước L. Kết quả khói cần có: số đếm READ ONLY của OPS, 0 dòng chứa chuỗi thử ở `idempotency_key`, audit, outbox, thông báo; C2 = NULL sau WR8. Đủ thì SEC ghi một dòng decision-log (bước M). OWN được bật công tắc (bước K) sau khi đã có #2, #3, #4. Khói L là kiểm sau bật.

Ghi thêm cho bước L (khói): yêu cầu thử dùng `info@ottimo.vn` và tên "TEST OTTIMO" là đúng. Không dùng tên hay SĐT người thật. Không chụp màn hình có dữ liệu (cùng nguyên tắc OTM-00001).

---

## 2. Thông báo xử lý dữ liệu `2026-10-24`

### 2.1 Quyết định: bật với bản `2026-10-24`, sửa ở version kế tiếp

Lý do:
1. **Luật sư đã duyệt đúng bản này** (theo lời INV). Mọi câu sửa bây giờ sẽ là chữ **chưa** được duyệt, đi ngược mục đích của ESC-030 A.
2. **Cả 4 điểm đều là thiếu ý, không có câu nào sai sự thật.** Thông báo vẫn đúng với hệ thống đang chạy:
   - IP băm có hạn (≤ 30 ngày, ngắn hơn mọi hạn đã nêu) nhưng thông báo không ghi số.
   - "Thông báo cho khách lưu trú" có thật: Tờ 4 "Your ID details" ở quầy, khách đọc trước khi đưa giấy tờ (SEC D01).
   - Mục khiếu nại chung chung nhưng đúng.
3. **Đằng nào cũng phải ra version mới.** Bật đo truy cập C+ (ESC-034 = C) bắt buộc thêm câu đếm truy cập (`SEC-on-web-analytics.md` thẻ 03). Gộp 4 điểm vào cùng version đó: khách gặp một lần đổi, luật sư xem một lần, OPS ghi phiên bản một lần.
4. Sửa ngay thì tốn thêm 1,5–2 giờ, phải chạy lại test landing, rồi xin luật sư xem lại, đúng lúc sát ngày D.

### 2.2 Từng khoảng trống

| Khoảng trống (FE-B mục 2) | Quyết | Ghi chú |
|---|---|---|
| (a) IP băm không ghi hạn lưu | **Để sau**, version kế tiếp | `ip_hmac` về NULL sau `retention.web_request_ip_hmac_days` (biên 7–30). Dòng spam bị xóa cả dòng trong 7 ngày. Câu mới ở 2.4 (1). |
| (b) "Notice for staying guests" trỏ tới thông báo chưa công khai | **Để sau.** Câu hiện tại không sai: Tờ 4 có ở quầy, khách đọc trước khi đưa giấy tờ. | Gốc vấn đề **không nằm ở landing.** Hệ thống chưa có hạn lưu cho **tên/SĐT/email trong hồ sơ khách**: SR-RET chỉ quy định giấy tờ, ảnh, visa. Thông báo khách lưu trú v2 (`privacy-2026-10-v2`, v1.0.1) cũng chưa nói tới. Thiếu này áp cho **mọi** khách, kể cả khách đặt qua Zalo hay gọi điện. SEC đưa câu "hạn lưu hồ sơ khách" vào **đợt hỏi luật sư thứ 2** (gói ESC-001 còn lại) và vào yêu cầu SEC cho v1.1. Khi có hạn lưu và có trang công khai thì đổi câu landing theo 2.4 (2). |
| (c) Hạn lưu tên/SĐT trong hồ sơ khách | **Để sau**, cùng (b) | Như trên. Không viết số vào landing khi hệ thống chưa có job xóa tương ứng. Viết số mà không xóa thật thì câu sẽ thành sai. |
| (d) Mục khiếu nại chung chung | **Để sau, tùy luật sư** | Luật sư đã đồng ý câu chung. Đợt 2 xin luật sư ghi đúng tên cơ quan; có tên thì thay theo 2.4 (3). Đội không tự điền tên cơ quan. |
| (FE-B hỏi thêm) "Nhân Hòa", "Google Workspace" | **SEC xác nhận đúng** | Nhân Hòa là nhà cung cấp VPS (decision-log 22/10). Google Workspace là nhà cung cấp email `info@ottimo.vn`, gửi qua SMTP relay (23/10, 26/10). Cả hai có trong Phụ lục A/B luật sư đã duyệt. |

### 2.3 Hai điểm INV cần biết (không phải quyết)

1. **Câu đếm truy cập.** Phụ lục A/B gửi luật sư (thư 26/10) có thêm một câu ở mục Cookies: *"To see how the website is used, we count page views and taps as daily totals only…"*. Câu này **không có** trong `privacy.ts` vì đo truy cập C+ chưa làm. Bản đăng ngày bật **thiếu đúng câu đó**, các câu khác trùng nguyên văn. SEC kết luận: **giữ như vậy là đúng.** Đăng câu nói "có đếm" khi chưa đếm thì thông báo sai sự thật. Văn bản chuẩn của version `2026-10-24` là **trang đã đăng**, xác định bằng `body_sha256` ghi ở bước J. Câu đếm vào version kế tiếp, cùng bản landing C+. Khi gửi version đó cho luật sư, INV nói rõ: câu đếm đã có trong bản luật sư đọc 26/10, nay mới bật.
2. **A5 – bản chụp tự động của Nhân Hòa** (`qc/v1-gate.md` G4-12, còn mở). Thông báo landing và Tờ 4 cùng ghi "Backups expire within 35 days". Câu này đúng với bản sao lưu của OTTIMO. Với 2 bản chụp toàn máy của Nhân Hòa thì **chưa có xác nhận**. Không chặn bật form: Desk đã chạy dữ liệu thật với cùng câu này, và QC đã ghi đây là rủi ro không chặn. Nhưng INV nên hỏi Nhân Hòa sớm (checklist A5, 10 phút). Nếu hãng giữ quá 35 ngày: đề nghị hãng giảm xuống ≤ 7 ngày, hoặc đội sửa câu sao lưu ở **cả** landing và Tờ 4 trong version kế tiếp.

### 2.4 Chữ cho version kế tiếp (FE-B chép khi làm bản landing C+)

Quy tắc version:
- Đổi **bất kỳ** câu nào trong `privacy.ts` hoặc ô đồng ý A.1/A.2 → `VERSION` mới, dạng `YYYY-MM-DD` theo ngày chốt chữ. Nếu cùng ngày có hai lần sửa thì dùng hậu tố `.1` (CHECK cho phép `^\d{4}-\d{2}-\d{2}(\.\d{1,2})?$`).
- OPS ghi dòng `vi` + `en` bằng công cụ ở mục 3. Dòng cũ đặt `superseded_at`. Bản cũ giữ nguyên trong git, đúng câu "Earlier versions are kept…".
- Bản chữ trước khi đăng: UXD duyệt giọng, rồi INV gửi luật sư các câu **mới** (không cần gửi lại cả bản).

**(1) IP băm** – thêm vào cuối đoạn 2 của "How long we keep it" / "Thời gian lưu". Làm được ngay ở version kế tiếp.
- EN: `The one-way encrypted form of your IP address is deleted within 30 days.`
- VI: `Địa chỉ IP ở dạng đã mã hóa một chiều được xóa trong 30 ngày.`

**(2) Khách đã đặt** – thay câu đầu của "How long we keep it" / "Thời gian lưu". **Chỉ dùng khi** có trang thông báo khách lưu trú công khai **và** có hạn lưu hồ sơ khách được thực thi bằng job. Chưa đủ hai điều kiện thì giữ câu cũ.
- EN: `If you book, your details move to your booking. Our notice for staying guests, at {stayNoticeUrl}, explains how long we keep them.`
- VI: `Nếu bạn đặt phòng, thông tin chuyển sang đơn đặt phòng của bạn. Thông báo dành cho khách lưu trú tại {stayNoticeUrl} nêu rõ thời gian lưu.`

**(3) Khiếu nại** – chỉ thay khi luật sư đã nêu tên cơ quan. Chưa có thì giữ câu cũ.
- EN: `If our answer does not resolve your concern, you can complain to {authorityEn}, the Vietnamese authority responsible for personal data protection.`
- VI: `Nếu câu trả lời của OTTIMO chưa giải quyết được băn khoăn của bạn, bạn có thể khiếu nại tới {authorityVi}, cơ quan có thẩm quyền về bảo vệ dữ liệu cá nhân tại Việt Nam.`

**(4) Câu đếm truy cập (C+)** – dùng nguyên văn Phụ lục A/B (đoạn 2 mục Cookies), không đổi chữ.

**(5) Tin Google Chat (mục 4):**
- Theo mẫu tối thiểu ở 4.1: **không cần** thêm câu.
- Nếu INV chọn ESC phương án B (gửi ngày ở và số khách): thêm câu EN/VI ở 4.1 vào "Who else receives it" / "Bên khác nhận thông tin" của version kế tiếp.

---

## 3. Bước ghi `privacy_notice_version` trên production – yêu cầu tối thiểu cho OPS

### FB-R3-SEC-OPS-US155-01
- Mức độ: **Major** (điều kiện #4, phải có trước bước J)
- Vị trí: `us155-enable-readiness.md` mục 1.3.1, bước D/J; `product/infra/server/README.md` 12.3 bước 5; bảng `privacy_notice_version` (migration 0086: PK `organization_id, version, locale`, CHECK version/sha, RLS FORCE, `ottimo_app` chỉ SELECT).
- Vấn đề:
  - Hiện chỉ có câu `INSERT` mẫu trong test E2E (`publishNotices()`, `body_sha256` giả). Không có đường nào trên production.
  - Nếu ai đó gõ SQL tay bằng vai chủ DB, sai một ký tự là dòng ghi băm hoặc version không khớp trang đã đăng. Bằng chứng "khách đồng ý với văn bản nào" (`consent_version` FK) khi đó mất giá trị, và không có dấu vết ai đã ghi.
- Vì sao quan trọng: dòng này là căn cứ duy nhất nối mỗi yêu cầu đặt phòng với văn bản khách đã đọc. Nó cũng là khóa cuối để OWN bật được form (`PUBLIC_FORM_NOT_READY`).
- Đề xuất sửa – yêu cầu tối thiểu:
  1. **Một công cụ trong repo, đã review.** Ví dụ `infra/server/bin/publish-privacy-notice.sh` hoặc lệnh CLI trong image api. Có test, ARC + SEC duyệt trước khi chạy lần đầu. **Không SQL gõ tay**, không `psql` tương tác cho việc này. Tệp có ghi chú "chỉ đường này được ghi bảng `privacy_notice_version`".
  2. **Ai chạy:** OPS, qua SSH tài khoản `ottimo-admin`, theo runbook. Chạy xong báo ORC/INV. Không chạy trong giờ khói nếu chưa xong bước I.
  3. **Đầu vào chỉ có tag/digest landing và mã cơ sở `DLT`.** Công cụ tự suy ra phần còn lại, người chạy không gõ:
     - `organization_id`: qua `public_resolve_property`/bảng cơ sở, phải đúng **một** kết quả, nếu không thì dừng;
     - `version`: đọc từ trang trong image (dòng "Version …"), đối chiếu với tham số. Lệch thì dừng;
     - `locale`: cố định `vi`, `en`;
     - `url_path`: cố định `/vi/privacy/`, `/privacy/`;
     - `published_at`: `now()`.
  4. **Băm lấy từ image, không gõ tay.** sha256 của `/privacy/index.html` và `/vi/privacy/index.html` lấy trong **container landing đang chạy**, và digest container đó phải đúng digest của tag phát hành. Sau đó tải `https://ottimo.vn/privacy/` và `/vi/privacy/` với `Accept-Encoding: identity`; băm phải trùng với băm trong image. Lệch thì dừng. Định nghĩa "băm văn bản" (cả tệp HTML) ghi vào ERD để lần sau làm giống hệt.
  5. **Mặc định chạy thử.** Không có `--apply` thì chỉ in ra: version, locale, url, sha, org (dạng mã cơ sở) và câu lệnh sẽ chạy. Không ghi gì.
  6. **Một giao dịch:** cả `vi` và `en` cùng vào, hoặc không dòng nào. Ở version sau thì đặt `superseded_at` cho dòng cũ trong cùng giao dịch đó.
  7. **Chạy lại được an toàn.** Dòng đã có với cùng băm → báo "đã có", không làm gì. Dòng đã có mà khác băm → dừng, báo lỗi. **Không bao giờ** UPDATE nội dung hay DELETE. Chỉ thêm dòng; `superseded_at` chỉ đặt một lần. Nếu migration chưa REVOKE UPDATE/DELETE như erd 4.14 ghi, ARC bổ sung trigger.
  8. **Tham số hóa.** Giá trị đưa vào SQL bằng tham số (`psql -v` + `:'var'`, hoặc tham số của driver). Không nối chuỗi.
  9. **Vai DB:** dùng vai chủ schema với `SET LOCAL` org context, để RLS FORCE vẫn áp. Không dùng superuser `postgres`. Nếu bắt buộc phải dùng, OPS ghi lý do và ARC duyệt.
  10. **Audit, trong cùng giao dịch:** một dòng `audit_event`, `category = security`, action kiểu `privacy_notice.published`, actor = system, kèm tên người chạy (định danh nhân viên, không email cá nhân), version, locale, sha, digest landing. Công cụ in kết quả ra stdout. OPS lưu vào nhật ký vận hành trên VPS và chép phần không bí mật vào báo cáo OPS.
  11. **Kiểm sau khi ghi:** công cụ gọi lại readiness (hoặc OWN mở H05). `missing[]` không còn `privacy_notice` cho vi/en.
  12. **Không đụng tham số `config_parameter.privacy_notice_version`.** Tham số này là thông báo khách lưu trú, `privacy-2026-10-v1`/`v2`, do OWN đặt trên Desk, mở lại check-in online theo D-T4. Hai thứ trùng tên nhưng khác nhau. Runbook ghi rõ để không nhầm.

  QA thêm một ca trên stack `ottimo-qa155`: chạy công cụ với image thật. Kiểm: chạy thử không ghi; `--apply` ghi đúng 2 dòng; chạy lại không đổi gì; image có trang khác băm → dừng.
- Trạng thái: Open

---

## 4. Tin Google Chat cho yêu cầu mới – review thiết kế ARC và trả lời S1–S3

Đối tượng: `rounds/round-03/outputs/ARC/gchat-booking-request-notify.md` (commit `7163371`, 30/10).

Kết luận: thiết kế **Đạt có điều kiện**.
- Các phần sau đúng hướng SEC: outbox chỉ giữ id; renderer không đọc cột C2, có khóa bằng test; bí mật dạng tệp chỉ worker đọc; kiểm host tuyệt đối; `redirect: 'error'`; log không có URL; phòng Chat riêng; tệp rỗng thì tắt; không gửi ở các nhánh honeypot, 422, 429 hay trùng.
- Điều kiện duy nhất về dữ liệu: **cắt nội dung tin theo S1**. Bản hiện tại gửi thông tin chuyến đi của khách.

### 4.1 S1 – danh sách trường có nằm ngoài dữ liệu cá nhân (ESC-002 A) không?

**Không, chưa đúng với toàn bộ danh sách.** SEC chia hai nhóm.

| Nhóm | Trường | SEC |
|---|---|---|
| **Thông tin về việc phải làm**: do hệ thống sinh, không mô tả khách | mã yêu cầu; giờ nhận; hạn phản hồi; link Desk `/website-requests/<UUIDv7>` (phải đăng nhập, chủ và quản lý có 2 bước); cụm "cần xem kỹ" (không nêu tên cờ); mức gấp "cần gọi ngay" (thay cho "đến đêm nay"); tiền tố `[staging]` | **Được gửi.** Không cần ESC, không đổi thông báo. |
| **Thông tin về chuyến đi**: khách tự khai | ngày đến; số đêm hoặc số tháng; số người lớn, trẻ em, trẻ dưới 2 tuổi; loại lưu trú (ngắn ngày / theo tháng) | **Không gửi** ở phạm vi hiện tại. |

Lý do không gửi nhóm 2:
1. **Đây là dữ liệu cá nhân, dù đã bí danh hóa.** Đứng một mình ở Google thì nó không chỉ ra ai. Nhưng OTTIMO giữ khóa nối: mã yêu cầu và UUID nối thẳng tới tên và liên hệ trong DB. Với bên giữ khóa, dữ liệu bí danh hóa vẫn là dữ liệu cá nhân. Số trẻ em theo nhóm tuổi còn là thông tin về gia đình. ESC-002 A ghi "toàn bộ dữ liệu khách ở Việt Nam".
2. **Thông báo `2026-10-24` vừa được luật sư duyệt sẽ thành sai.** Thông báo ghi dữ liệu "stored on our server in Viet Nam". Bên nhận chỉ gồm Nhân Hòa, và Zalo/WhatsApp/Google Workspace khi **OTTIMO trả lời**. Gửi ngày ở và số khách vào Google Chat là một bên nhận chưa được nêu.
3. **Không cần cho việc phải làm.** Muốn trả lời khách thì người trực phải mở Desk để thấy liên hệ. Ngày ở và số khách đã có ngay ở đó. Tin Chat chỉ cần cho biết "có việc, gấp tới đâu, hạn lúc nào".

Mẫu tin SEC đồng ý, ARC/BE dùng thay mục 2.2:

```
Yêu cầu đặt phòng mới · REQ-7K3P9QXA
Nhận lúc 14:05 · hạn phản hồi 14:20
Mở Desk: https://desk.ottimo.vn/website-requests/<requestId>
```

- Yêu cầu đến đêm nay (`call_now`): dòng 1 thành `Yêu cầu đặt phòng mới – cần gọi ngay · REQ-…`. Renderer được đọc `arrival_date` để tính mức gấp, nhưng không in ngày ra.
- Có cờ nghi ngờ: thêm ` · cần xem kỹ` vào cuối dòng 2.
- Tin nhắc lại: giữ nguyên mẫu ARC (đã không có thông tin chuyến đi).
- Test 3 của ARC bổ sung: đưa vào một dòng có ngày đến, số khách và loại lưu trú. Chữ đầu ra không chứa ngày `dd/MM` của ngày đến, không chứa "người lớn", "trẻ em", "đêm", "tháng", "Theo tháng" hay "Ngắn ngày".

Nếu INV/PO muốn tin có ngày ở và số khách, **đây là việc phải báo INV** (pháp lý dữ liệu cá nhân). Cách làm:
- ORC mở ESC. Phương án A (đề xuất) là mẫu tối thiểu ở trên. Phương án B là thêm nhóm 2.
- Chọn B thì phải đưa câu sau vào thông báo **version kế tiếp** (cùng đợt C+, mục 2.4), xin luật sư xem, và chỉ bật nhóm 2 sau khi version đó đã đăng và đã ghi `privacy_notice_version`:
  - EN (thêm vào "Who else receives it"): `To alert our team, we send your dates and the number of guests – never your name or contact – to our staff chat on Google Workspace.`
  - VI: `Để báo cho nhân viên, OTTIMO gửi ngày ở và số khách – không bao giờ gửi tên hay liên hệ – vào phòng trò chuyện nội bộ trên Google Workspace.`

### 4.2 S2 – bí mật tệp chỉ worker đọc và kiểm URL chống SSRF

**Đồng ý với mục 3.2–3.3 của ARC**: tệp 0400, uid 1000, chỉ worker nhận; `PLAIN_SECRETS`; kiểm `https`, host tuyệt đối, không userinfo, không cổng, path theo mẫu, ≤ 512; URL sai thì coi như tắt và log mã lỗi, không làm dừng các job khác.

Bổ sung bắt buộc:
1. **Query trong tệp bí mật chỉ được có `key` và `token`.** Có tham số khác thì coi là không hợp lệ. `threadKey`, `messageId`, `messageReplyOption` chỉ do mã nối thêm qua `URLSearchParams`. Thêm vào test 1.
2. **`init-secrets.sh --set-booking-chat`:**
   - đọc bằng `read -s`; không echo; không ghi vào lịch sử shell; `umask 077`;
   - ghi tệp tạm rồi `mv`;
   - **kiểm URL bằng đúng luật trên trước khi ghi**: sai thì không ghi, chỉ báo "URL không hợp lệ", không in lại URL;
   - in ra chỉ `chat webhook: set` và độ dài.
3. **`ADMIN_BASE_URL` dùng để dựng link** phải là `https` và đúng host Desk của môi trường. Worker kiểm lúc khởi động; sai thì tắt Chat (`CHAT_LINK_BASE_INVALID`). Như vậy cấu hình sai không thể biến tin thành link tới chỗ khác.
4. **Không xoay URL định kỳ.** Bí mật này chỉ cho quyền đăng tin vào một phòng; xoay định kỳ thêm việc mà không giảm rủi ro đáng kể. **Bắt buộc xoay** khi:
   - nghi lộ URL;
   - một người có quyền root/`ottimo-admin` trên VPS nghỉ;
   - URL từng bị dán ra ngoài máy chủ (chat, email, tài liệu).

   Cách xoay: INV xóa webhook trong Chat (có hiệu lực ngay, đây cũng là **công tắc tắt khẩn**), tạo webhook mới, OPS chạy `--set-booking-chat`, khởi động lại worker. Ghi vào runbook OPS.
5. **Chống tin giả mạo khi URL lộ** (rủi ro R2 của ARC). Sổ tay và phần giới thiệu phòng ghi:
   - "Tin trong phòng này chỉ do Desk OTTIMO đăng";
   - "Link chỉ mở `desk.ottimo.vn`";
   - "Không bao giờ có tin xin mật khẩu, mã 2 bước hay chuyển tiền".

   Tin nào khác những điều trên thì báo chủ và không bấm.
6. **Phòng Chat** (INV, mục I1):
   - tắt thành viên ngoài tổ chức;
   - chỉ chủ và người trực là thành viên;
   - người nghỉ việc thì gỡ khỏi phòng cùng lúc khóa tài khoản Desk (thêm vào checklist nghỉ việc);
   - không dùng phòng để trao đổi chi tiết khách: chi tiết chỉ xem trên Desk.
7. **Staging** dùng phòng thử riêng hoặc để tệp rỗng. Không bao giờ dùng URL production. Đồng ý với R4 của ARC.

### 4.3 S3 – thêm hạng phòng khách chọn vào tin?

**Không**, ở phạm vi hiện tại. Hạng phòng khách muốn là thông tin về chuyến đi (nhóm 2 ở 4.1), cùng lý do. Hạng phòng không nhận diện được người, nhưng nó không cần cho việc "mở Desk và trả lời". Thêm vào thì cũng phải sửa thông báo và qua ESC phương án B. Nếu INV chọn B, hạng phòng có thể đi cùng nhóm 2, với câu thông báo: EN `…your dates, room type and the number of guests…`, VI `…ngày ở, hạng phòng và số khách…`.

### FB-R3-SEC-ARC-GCHAT-01
- Mức độ: **Major** (phải sửa trước khi BE code)
- Vị trí: `outputs/ARC/gchat-booking-request-notify.md` mục 0 (dòng "Nội dung"), 2.1 (danh sách cột), 2.2 (mẫu tin), 5.2 test 3.
- Vấn đề: tin gửi ngày đến, số đêm/tháng, số người lớn/trẻ em/trẻ dưới 2 tuổi và loại lưu trú. Đây là thông tin chuyến đi do khách khai, nối được với người qua mã yêu cầu. Nó đi ra Google (có thể ngoài Việt Nam), không có trong thông báo đã duyệt.
- Vì sao quan trọng: trái ESC-002 A, làm thông báo `2026-10-24` thành sai, và kéo theo version mới cùng ý kiến luật sư.
- Đề xuất sửa: dùng mẫu tin ở 4.1. Renderer chỉ in mã, giờ nhận, hạn phản hồi, mức gấp, "cần xem kỹ", link. Thêm ca vào test 3. Muốn thêm thông tin chuyến đi thì ORC mở ESC (A/B như 4.1).
- Trạng thái: Open

### FB-R3-SEC-ARC-GCHAT-02
- Mức độ: Minor (làm cùng v1.0.1)
- Vị trí: mục 3.2–3.3 (kiểm URL, `init-secrets.sh`), 5.4 R2, runbook OPS, sổ tay.
- Vấn đề: còn thiếu các ý 1–6 ở 4.2: luật query chỉ có `key`/`token`; kiểm URL trước khi ghi tệp; kiểm `ADMIN_BASE_URL`; khi nào phải xoay URL; câu chống tin giả trong sổ tay; quy tắc thành viên phòng Chat.
- Vì sao quan trọng: URL lộ thì người ngoài đăng được tin hoặc link lừa vào phòng nhân viên. Đây là đường lừa đảo nhắm vào người trực.
- Đề xuất sửa: thêm ý 1–3 vào thiết kế và test (INT/OPS). Ý 4 vào runbook OPS. Ý 5–6 vào sổ tay (BA/PO) và hướng dẫn I1 cho INV.
- Trạng thái: Open

Ghi nhận khác của SEC về thiết kế (không thẻ):
- Thứ tự phát hành: ARC đề xuất bật form sau v1.0.1. Đây là việc của PO/INV. SEC không đòi Chat có trước khi bật form, vì thông báo trong Desk đã đạt C-12 (c) và INV đã chốt cách tạm Desk luôn mở.
- `threadKey = requestId` (UUID): được, không phải dữ liệu khách.
- Giới hạn 5 tin mỗi tick cộng trần yêu cầu mỗi ngày là đủ chống ngập tin. Không cần thêm tham số.
- Không có tham số bật/tắt riêng: chấp nhận. Có hai cách tắt đủ nhanh: tệp rỗng, hoặc xóa webhook trong Chat (có hiệu lực ngay).
- Lịch sử phòng Chat: Google Workspace giữ theo cài đặt của tổ chức. Với mẫu tối thiểu thì tin không chứa dữ liệu khách, nên không cần đặt hạn xóa riêng.
- SEC review diff BE/INT/OPS khi có mã (0,25 công như ARC tính). Ca QA 10 trên staging: SEC nhận ảnh hoặc chữ tin thử để kiểm mẫu.

## 5. Ghi chú khác

- **S-1 (robots `Disallow: /v1/`, `s1-SEC-on-landing.md`): SEC rút gợi ý.** Khi form bật, `/v1/public/…` có thật trên `ottimo.vn`. Dòng `Disallow` giúp bot tuân thủ không gọi `form-token`, không tiêu hạn mức 30 lần/giờ. Giữ nguyên.
- FE-B 1.3.2 (release notes ghi "bật trong 1 phút"): đồng ý với FE-B, PO sửa câu. Đổi chữ thông báo = bản dựng landing mới + version mới + bước ghi ở mục 3.
- Thứ tự H → I → J → K của FE-B: đồng ý. Gộp H vào lượt deploy `v1.0.1`, ngoài giờ khách. **Không bật công tắc (K) trước khi** bước J xong và kiểm băm khớp. Server cũng tự chặn trường hợp này (422).

## Điểm làm tốt
1. FE-B kiểm trực tiếp trên mạng (404 của `/privacy/`, `form-token`) và đối chiếu `git log` theo đường dẫn, nên biết chắc production đang ở trạng thái nào, không suy đoán.
2. Phát hiện thiếu công cụ ghi `privacy_notice_version` trước khi tới ngày bật. Nếu không, OWN sẽ gặp 422 đúng lúc khói, và người ta dễ chữa bằng SQL tay.
3. Tách đúng "khoảng trống" khỏi "mâu thuẫn", và giữ số trong thông báo là biên trên của tham số. Nhờ vậy SEC quyết được "bật với bản đã duyệt", không phải sửa gấp.
