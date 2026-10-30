# FE-B – Round 3 – Sản xuất (chuẩn bị, chỉ đọc) – Sẵn sàng bật form "Yêu cầu đặt phòng" (US-155) trên ottimo.vn

- Vai: FE-B (chủ US-155 phía web). Ngày: 30/10/2026. Bước: Sản xuất – chuẩn bị. **Không sửa mã, không deploy, không đổi tham số production, không commit.**
- Bối cảnh: ESC-030 = A (INV 26/10: form bật khi luật sư trả lời LZ-2/LZ-8). INV vừa nói "triển khai đi"; ORC đang hỏi lại INV có chấp nhận rủi ro bật **trước** khi luật sư trả lời không. File này để đội làm ngay khi INV xác nhận.
- Mốc mã: `main` = `e7ac80f`; `v1.0.0` = `8b3aec8` (production app đang chạy image rc.6 = commit này); `landing-v1.0.0` = `70fe734` (ottimo.vn đang chạy `sha-70fe734e9077`).
- Kiểm trực tiếp trên mạng (GET, chỉ đọc, 30/10): `https://ottimo.vn/privacy/` 404, `/vi/privacy/` 404, `/v1/public/properties/dlt/form-token` 404, trang chủ 200 không có `<form>`. `robots.txt` vẫn `Disallow: /v1/` (SEC landing S-1, chưa làm).
- Mã landing, `Caddyfile.landing`, `Dockerfile.landing`, `release.yml` **không đổi** từ `70fe734` tới `main` (`git log 70fe734..main` trên các đường đó rỗng). Toàn bộ mã US-155 (server, Desk S35, form landing) là tổ tiên của cả `v1.0.0` và `main`.

---

## 1. Điều kiện ARC / SEC / QA trước khi bật form trên production

Nguồn: `reviews/s1-SEC-on-us155.md` (bảng "Điều kiện còn lại… đủ cả 7", kiểm lại 24/10), `reviews/s1-ARC-on-us155.md`, decision-log 24/10 (ORC review ARC + SEC), `outputs/QA/s1-us155-e2e.md` mục 0, `qa/bug-list.md`, `reviews/SEC-G7-5-production.md`, `qc/v1-gate-checklist.md` G7-2.

### 1.1 Thẻ review phải sửa trước khi bật

| Điều kiện | Trạng thái trên `main` / `v1.0.0` | Bằng chứng |
|---|---|---|
| ARC **US155-01** (Major) – `public_resolve_property` chỉ trả khi đúng 1 cơ sở khớp slug, migration mới | **Xong** | BE-D `32e5fda` (migration 0087), gộp `61255f1`; SEC đọc kèm "đạt góc bảo mật" (`s1-SEC-on-us155.md`, bảng trạng thái thẻ) |
| ARC **US155-02** (Minor) – chỉ xóa được dòng `spam` | **Xong** | `32e5fda` (trigger trong 0087); SEC đọc kèm |
| ARC US155-03 (Minor, Sprint 2) / US155-04 (Minor) | Không chặn bật form. 04 đã thành runbook "api 1 bản" + `ops-check` | `product/infra/server/README.md` 12.2 |
| SEC **FB-01** (Major) – không lưu C2 trong bộ đệm idempotency | **Verified** | `32e5fda`; SEC quét độc lập 0 dòng trên `61255f1` |
| SEC **FB-02** (Minor) – `bodyLimit` 8 KB + Caddy 16 KB | **Verified** (server + OPS repo) | server `32e5fda`, 20 KB → 413; OPS `751ce79`, `check-caddy-landing.sh` 16/16 (SEC kiểm 24/10, commit `ca06365`) |
| SEC **FB-03** (Minor) – ca Phụ lục B | **Verified phần server**; B.2.1–B.2.3 phía Desk do QA làm E2E (xem #1 dưới) | `32e5fda`; QA `9f4d886`/`12f6d37` |
| SEC FB-04 (Suggestion), FB-05 (Suggestion – `/` làm dấu nhóm, hộ chiếu chữ thường) | Không chặn. FB-05 vẫn Open | `cd12d92` |
| QA **BUG-R3-007/008/009** (P1, chặn mốc bật form), 010/011 (P2) | **Closed** – QA kiểm lại trên `a1da76f` | `qa/bug-list.md` dòng 105–109; commit `9f4d886` |

### 1.2 Bảy điều kiện SEC cho mốc "bật form" (`s1-SEC-on-us155.md`)

| # | Điều kiện | Trạng thái | Bằng chứng / còn thiếu |
|---|---|---|---|
| 1 | B.2.1–B.2.3 phía Desk S35 có test E2E/FE | **Đạt về phía QA, chờ SEC ghi xác nhận** | QA lượt 2 trên `a1da76f`: TC-WR-005/006/007/010 đạt, log Caddy landing thật sạch (`s1-us155-e2e.md` 0.2, 0.4). QC G7-2 ghi "SEC cần xác nhận lượt QA 13/13 có đủ cho #1, #7 không" – **chưa thấy dòng SEC xác nhận** |
| 2 | Caddy landing chỉ proxy 2 đường, 16 KB; `LANDING_BASE_URL` https; secret khóa ký riêng; runbook api 1 bản | **Đạt trên repo**; **bước VPS chưa làm** | `751ce79`, SEC 24/10. VPS: `LANDING_IP=172.30.1.11` đã có (OPS `v1-production.md` 15, 25/10); còn `LANDING_BASE_URL=https://ottimo.vn`, `LANDING_PUBLIC_API=on`, deploy lại api; sau đó `ops-check` + 1 lần gọi thật qua landing gửi SEC |
| 3 | C-1: bản dựng landing **có form** qua `check:dist` + Playwright, 0 request ra ngoài, không lỗi CSP | **Đạt trên bản thử, chưa có trên image phát hành** | CI chạy `build:booking-live-test` (slug `dl01`) + 54 ca E2E landing ở mọi push; QA dựng image từ `Dockerfile.landing` với `dlt` (có `check:dist`) ở lượt 2. **Chưa có** image `ottimo-landing:sha-…` do CI dựng với `LANDING_BOOKING_FORM=true` + `dlt` (biến repo chưa đặt) |
| 4 | C-3 (a): thông báo xử lý dữ liệu EN + VI **luật sư duyệt**, đã đăng, đã ghi `privacy_notice_version` | **Chưa** | Bản đội soạn có trong mã (mục 2). Luật sư chưa duyệt; trang chưa đăng; bảng `privacy_notice_version` production trống (server sẽ trả 422 `PUBLIC_FORM_NOT_READY` nếu bật lúc này) |
| 5 | C-13: luật sư trả lời LZ-2, LZ-8 (hoặc OTTIMO đã làm thủ tục) | **Chưa** – đây chính là ESC-030 | ESC-030 = A (26/10). Nếu INV đổi sang "bật trước" thì #4 (phần luật sư) và #5 thành **ngoại lệ INV chấp nhận rủi ro**, cần dòng decision-log + SEC ghi nhận ngoại lệ |
| 6 | SEC-G1/G2 cho Desk chạy dữ liệu thật | **G1 Đạt; G2 Đạt có điều kiện** | `SEC-G7-5-production.md` (29/10). Còn L-1 đăng xuất – đã kiểm trên production (`172c8e4`, 30/10). Ý 6 làm ở ngày D |
| 7 | E2E US-155 trên stack có `LANDING_BASE_URL` + khóa ký, landing Caddy thật | **Đạt về phía QA, chờ SEC ghi xác nhận** | 13/13 trên `a1da76f` (`s1-us155-e2e.md` 0.2), gồm kill switch TC-WR-008 |

### 1.3 Điều kiện ngoài mã còn thiếu (FE-B phát hiện khi rà)

1. **Không có công cụ ghi `privacy_notice_version` trên production.** README 12.3 bước 5 ghi "OWN ghi `privacy_notice_version`", nhưng Desk không có màn/endpoint nào ghi bảng này (app chỉ SELECT; schema ghi "rows written by the landing release (OPS data migration)"). Chỉ test E2E có câu SQL mẫu (`tests/e2e/ui/us155-website-requests.r3.spec.ts` `publishNotices()`, dùng `body_sha256` giả). **Cần OPS viết bước dữ liệu** (INSERT `organization_id`, `version = 2026-10-24`, `locale` vi/en, `body_sha256` = sha256 của `/privacy/index.html` và `/vi/privacy/index.html` lấy từ đúng image phát hành, `url_path`, `published_at`), ARC + SEC duyệt câu lệnh, chạy bằng vai chủ DB. Không làm thì OWN bật công tắc sẽ nhận 422.
2. **Release notes** (`product/docs/release-notes.md` dòng 133) ghi "chủ đầu tư bật trên Desk trong 1 phút" – không đúng: còn dựng lại landing, phát hành tag, cấu hình VPS, ghi phiên bản thông báo (mục 3). ESC-030 phương án B cũng ghi "luật sư góp ý sau thì đổi bản thông báo, không sửa phần mềm" – thực tế chữ thông báo nằm trong mã landing (`src/content/privacy.ts`), đổi chữ = bản dựng landing mới + phiên bản mới. PO sửa câu khi cập nhật release notes.
3. **Không còn staging landing.** Bản xem trước `staging.ottimo.vn` đã bỏ từ 24/10 (OPS `v1-production.md` 13). "Kiểm trên staging" ở mục 3 nghĩa là: QA chạy stack thử `ottimo-qa155` (overlay `tests/e2e/support/us155-stack/compose.us155.yml`) với **đúng image landing CI vừa dựng**, rồi kiểm trên production khi công tắc còn tắt.

**Kết luận mục 1:** toàn bộ điều kiện thuộc **mã** (ARC, SEC, QA) đã xong trên `main` và `v1.0.0`. Còn: SEC ghi xác nhận #1, #7; image landing có form do CI dựng (#3); bước VPS (#2); bước ghi phiên bản thông báo (1.3.1); và #4/#5 phần luật sư – chỉ vượt được bằng quyết định INV chấp nhận rủi ro.

---

## 2. Thông báo xử lý dữ liệu EN/VI (`/privacy/`, `/vi/privacy/`)

| Câu hỏi | Trả lời |
|---|---|
| Có trên ottimo.vn chưa? | **Chưa.** Cả hai trang trả 404 (kiểm 30/10). Trang và link chân trang chỉ được dựng khi bản dựng có form (`PRIVACY_PAGE_PUBLISHED = BOOKING_FORM_RENDERED \|\| site.features.privacyPage`, `src/lib/booking-request.ts:54`). |
| Version nào? | `2026-10-24` (`src/content/privacy.ts`, hằng `VERSION`). Form gửi đúng giá trị này làm `consentVersion`; production phải có dòng `privacy_notice_version` cùng version cho `vi` và `en`. Luật sư chưa duyệt. |
| Khớp hạn lưu hiện hành (SEC 5.2)? | **Khớp.** SEC 5.2 kết luận thông báo landing chỉ nói về form, không nói về giấy tờ, nên không phải sửa khi đổi hạn lưu giấy tờ 3 tháng. Số trong thông báo là **biên trên** của tham số SEC ở migration 0086: tự đóng ≤ 60 ngày (`retention.web_request_stale_days` 7–60), xóa C2 ≤ 180 ngày (`web_request_max_age_days` 90–180; `declined_days` tối đa 90 vẫn nằm trong 180), spam ≤ 7 ngày (1–7), sao lưu 35 ngày (SEC-on-PO-v1.0.0-docs: "khớp `privacy.ts`"). Câu luôn đúng dù OWN đặt số nào trong biên. |
| Mâu thuẫn với tờ "Your ID details" (Tờ 4, A4) vừa duyệt? | **Không mâu thuẫn.** Hai văn bản nói về hai loại dữ liệu khác nhau: landing = yêu cầu đặt phòng (tên, liên hệ, lời nhắn – "không ghi số giấy tờ"); Tờ 4 = giấy tờ khi nhận phòng (3 tháng, trừ phần luật yêu cầu). Câu sao lưu thống nhất (35 ngày). Người xem: landing "lễ tân, quản lý, nhân viên bán phòng được giao" – Tờ 4 "chỉ lễ tân và quản lý" xem ảnh giấy tờ: khác dữ liệu nên đúng cả hai. Kênh yêu cầu quyền: landing "Zalo/email", Tờ 4 "hỏi lễ tân" – bổ sung cho nhau. |

Khoảng trống (không phải mâu thuẫn, để SEC quyết có sửa trước khi bật không – sửa thì đổi version, xem 3.B):
- Landing nói "If you book… the notice for staying guests applies", nhưng thông báo khách lưu trú (`gw.notice_body`, `privacy-2026-10-v1`) không đăng công khai, check-in online đang tạm dừng (D-T4 (a)) và bản v2 có câu hạn lưu chờ v1.0.1. Khách từ web thành khách lưu trú chỉ thấy Tờ 4 (về giấy tờ); hạn lưu **tên/SĐT trong hồ sơ khách** chưa được nêu ở đâu công khai.
- IP băm một chiều được nói tới nhưng **không nêu thời hạn** (`retention.web_request_ip_hmac_days` tối đa 30 ngày).
- Mục "Khiếu nại" để chung "cơ quan có thẩm quyền"; bên nhận "Nhân Hòa", "Google Workspace" lấy từ decision-log 22/10 – FE-B đã nhờ SEC/OWN xác nhận từ 24/10, chưa thấy dòng xác nhận.
- Khi bật đo truy cập C+ (ESC-034 = C), SEC bắt buộc thêm câu đếm vào `privacy.ts` (`SEC-on-web-analytics.md` thẻ 03) → lại một version mới.

---

## 3. Các bước triển khai (theo thứ tự, ai làm, thời gian)

Điều kiện đầu vào: **INV xác nhận bằng lời** chấp nhận rủi ro bật trước khi luật sư trả lời (đổi ESC-030 A → B). ORC ghi decision-log; SEC ghi #4 (phần luật sư) và #5 là ngoại lệ INV chấp nhận.

| # | Việc | Ai | Thời gian |
|---|---|---|---|
| A | Ghi quyết định INV vào decision-log + `ESC-030` trạng thái; SEC ghi một dòng xác nhận #1, #7 (từ QA lượt 2) và ngoại lệ #4/#5 | ORC, SEC | 20–30 phút |
| B | (Tùy SEC) Sửa chữ thông báo theo mục 2 "Khoảng trống" → version `2026-10-31` (định dạng `YYYY-MM-DD`), UXD duyệt giọng EN dẫn/VI hỗ trợ, chạy lại test landing. **Bỏ qua bước này nếu SEC chấp nhận bản `2026-10-24`.** | SEC quyết; FE-B làm; UXD duyệt | 0 hoặc 1,5–2 giờ |
| C | FE-B kiểm lại trên `main` hiện tại: `pnpm --filter @ottimo/landing-web test`, dựng thử `LANDING_BOOKING_FORM=true LANDING_PROPERTY_SLUG=dlt` + `check:dist`, E2E landing 54 ca; xác nhận trang chủ không đổi ngoài khối form + link chân trang | FE-B | 30–45 phút |
| D | OPS viết bước ghi `privacy_notice_version` (mục 1.3.1): lấy sha256 hai trang từ image phát hành, câu INSERT chạy một lần bằng vai chủ DB, có chế độ chạy thử; ARC + SEC duyệt | OPS; ARC + SEC review | 45 phút + 20 phút review |
| E | Đặt biến repo GitHub `LANDING_BOOKING_FORM=true`, `LANDING_PROPERTY_SLUG=dlt` (đúng mã cơ sở production `DLT` viết thường – `production-defaults.ts`). Lưu ý: từ lúc này **mọi** push `main` dựng landing có form | INV (quyền repo) hoặc OPS được INV cho phép | 5 phút |
| F | Push một commit lên `main` (ví dụ release notes mục `landing-v1.1.0` + sửa câu 1.3.2) để CI `publish-images` dựng `ottimo-landing:sha-<12>` có form; job landing chạy `check:dist` trong `Dockerfile.landing` | PO/ORC commit; CI | 30–40 phút (CI) |
| G | "Staging": QA chạy lại TC-WR-* trên stack `ottimo-qa155` dùng **đúng image landing vừa dựng** (pull theo digest) + api của `v1.0.0`; kèm C-1 (0 request ra ngoài, CSP sạch) trên image đó. SEC đọc kết quả → xác nhận #3 | QA, SEC | 60 phút |
| H | VPS production: `/opt/ottimo-prod/.env` thêm `LANDING_BASE_URL=https://ottimo.vn`, `LANDING_PUBLIC_API=on` (`LANDING_IP` đã có); kiểm secret `public_form_signing_key` có (0400); `deploy.sh` để api nhận biến (api khởi động lại 30–60 giây – **ngoài giờ khách**, tốt nhất gộp với lượt deploy `v1.0.1`). Landing cũ chưa có form nên `/v1/public/…` lúc này vẫn 404 (công tắc tắt) | OPS | 20–30 phút |
| I | Tag `landing-v1.1.0` (có chú thích) trên commit của bước F → `release.yml` kiểm main + CI xanh + digest → **INV duyệt** environment `production` → `deploy-landing.sh`. Từ đây trang chủ có form nhưng gửi sẽ hiện "Online requests are paused… Zalo / call" (token 404) cho tới bước K | ORC tag; INV duyệt | 10–15 phút |
| J | Ghi `privacy_notice_version` (vi, en) bằng bước D, dùng sha256 từ image vừa chạy; kiểm `/privacy/`, `/vi/privacy/` 200 và dòng phiên bản đúng `2026-10-24` | OPS | 10 phút |
| K | **OWN bật** `public_booking_requests_enabled = true`, `effectiveFrom` = hôm nay, trên Desk (H05 tham số). Server tự kiểm khóa ký + thông báo vi/en, thiếu → 422 `PUBLIC_FORM_NOT_READY` kèm `missing[]` | INV (OWN) | 2 phút |
| L | Khói production (mục 3.1) | INV gửi + xóa; OPS/QA đọc kết quả; SEC nhận bằng chứng | 30 phút |
| M | Ghi decision-log, release notes, `v1-gate-checklist` G7-2; SEC ghi xác nhận mốc | ORC, PO, SEC | 15 phút |

**Tổng:** khoảng **4–5 giờ làm việc** nếu bỏ bước B; **6–7 giờ** nếu sửa chữ thông báo. Làm được trong 1 ngày. Đề xuất: **không** khởi động lại api trong 01–02/11 (sát ngày D); gộp bước H vào lượt deploy `v1.0.1`, rồi làm I–L ngay sau, giờ vắng khách (trước 07:00 hoặc sau 22:00 thì không ai trả lời yêu cầu thật trong lúc khói – nên chọn đầu giờ trực 07:00–08:00 để người trực thấy ngay).

### 3.1 Kiểm thử khói production (bước L)

1. OPS: `ops-check` xanh (api đúng 1 bản); `curl` qua landing: `GET /v1/public/properties/dlt/form-token` 200, `/v1/me` 404, `/v1/auth/login` 404 trên `ottimo.vn`.
2. INV trên điện thoại (trình duyệt thật, 4G) gửi **1 yêu cầu thử**: tên "TEST OTTIMO", liên hệ **email chung `info@ottimo.vn`** (không dùng SĐT/email cá nhân của ai), ngày đến cách ≥ 14 ngày (tránh cảnh báo "đến hôm nay"), lời nhắn "Smoke test – please erase". Trang cảm ơn hiện mã yêu cầu và câu hứa. Không chụp màn hình có dữ liệu.
3. Desk: số trên menu "Yêu cầu từ website" = 1, "Cần chú ý" có dòng, thông báo tới OWN/MGR/FDL; mở chi tiết thấy đúng dữ liệu thử.
4. **Xóa theo quy trình WR8:** OWN/FDL bấm "Xóa theo yêu cầu người gửi" → xác minh `same_contact` = `info@ottimo.vn` → xóa ngay, không mở lại được. Không dùng "đánh dấu spam" (giữ tới 7 ngày).
5. OPS đọc, `BEGIN READ ONLY … ROLLBACK`, chỉ in số đếm: dòng yêu cầu có C2 = NULL; `idempotency_key`, audit, outbox, thông báo: 0 dòng chứa chuỗi "TEST OTTIMO"/`info@ottimo.vn`.
6. **Không tắt công tắc sau khói.** Tắt cùng ngày thì không bật lại được tới ngày nghiệp vụ sau (06:00) – thiết kế BUG-R3-008.

### 3.2 Công tắc khẩn tắt form

| Mức | Cách làm | Ai | Hiệu lực |
|---|---|---|---|
| 1 – tắt nhanh (spam, sự cố, luật sư yêu cầu dừng) | Desk → Tham số → `public_booking_requests_enabled = false`, `effectiveFrom` = hôm nay. Có hiệu lực ngay (ghi đè dòng hôm nay, audit `sameDayOverride`, báo OWN + MGR). Nếu đã có dòng `true` lên lịch cho ngày sau thì **hủy thêm** dòng đó (`cancelScheduledParameter`) | OWN | Ngay. Landing tự hiện câu tạm dừng + Zalo/gọi. Bật lại sớm nhất ngày nghiệp vụ sau |
| 2 – cắt đường vào ở Caddy | `.env`: `LANDING_PUBLIC_API=off` → `deploy-landing.sh <tag hiện tại> --no-pull` | OPS | ~10 giây; mọi `/v1/*` trên ottimo.vn 404 |
| 3 – gỡ form khỏi trang | `deploy-landing.sh --rollback` → `landing-v1.0.0` (`sha-70fe734e9077`, không form, không `/privacy/`); bỏ biến repo `LANDING_BOOKING_FORM` để bản dựng sau không có form | OPS (+ INV với biến repo) | ~10–30 giây |

Yêu cầu đã nhận vẫn ở hàng chờ Desk và theo hạn lưu, kể cả khi tắt.

---

## 4. Rủi ro còn lại nếu bật trước khi luật sư trả lời (không phải kết luận pháp lý)

1. **LZ-8 – thủ tục website TMĐT (Luật TMĐT 2025, NĐ 248/2026):** nếu website có form thuộc diện phải thông báo/đăng ký mà chưa làm, OTTIMO có thể bị yêu cầu dừng hoặc xử phạt hành chính. Giảm thiểu: tắt ngay bằng công tắc mức 1 khi luật sư nói cần thủ tục.
2. **LZ-2 – căn cứ xử lý và nội dung thông báo:** bản EN/VI do đội soạn, chưa luật sư duyệt; có thể thiếu ý luật yêu cầu (mục 2 "Khoảng trống": hạn lưu IP băm, hồ sơ khách sau khi đặt, cơ quan khiếu nại, truyền tin qua Zalo/WhatsApp/Gmail có máy chủ ngoài Việt Nam – LZ-7). Sửa = bản dựng landing mới + version mới (1–2 giờ), không phải "chỉ đổi tham số".
3. **Dữ liệu người lạ từ Internet vào Desk:** spam, gửi hộ số người khác, khách tự gõ số giấy tờ. Đã có lọc CCCD/thẻ, giới hạn tần suất, trần ngày, bẫy, PoW tắt sẵn; còn lọt dạng `079/203/012/345` và hộ chiếu chữ thường (SEC FB-05, chấp nhận). Mọi yêu cầu chờ người xử lý tối đa 180 ngày.
4. **Vận hành:** một người trực giữ 6 vai từ ngày D, câu hứa công khai "trả lời trong 1 giờ, 07:00–22:00; ngoài giờ trước 09:00". Trễ hứa là rủi ro uy tín, và yêu cầu chưa ai nhận sẽ lên "Cần chú ý".
5. **Thời điểm:** cần khởi động lại api một lần (bước H). Làm sát ngày D 02/11 cộng thêm biến động cho Desk đang bắt đầu dùng thật – nên gộp với lượt `v1.0.1`.

---

## Giả định

- [GIẢ ĐỊNH] Tag kế tiếp là `landing-v1.1.0` (thêm tính năng: form + 2 trang thông báo; chưa có tag/kế hoạch `landing-v1.x` nào khác). Nhánh giá "chỉ từ" (`landing-f9-from-price`) vẫn chưa vào `main`, nên bản này không có giá.
- [GIẢ ĐỊNH] Giữ version thông báo `2026-10-24` nếu SEC không yêu cầu sửa chữ (bước B).
- [GIẢ ĐỊNH] Yêu cầu thử dùng email chung `info@ottimo.vn` làm liên hệ để không đưa dữ liệu cá nhân thật vào production và để xác minh xóa `same_contact`.
- [GIẢ ĐỊNH] Stack thử `ottimo-qa155` đủ thay staging cho bước G vì staging không còn landing (OPS 13).
