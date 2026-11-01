# QC gate – gói LP-v2 (Round 4)

- Người kiểm: QC | Ngày: 01/11/2026 (tối) | Round 4 – gói LP-v2 – Bước **QC**
- Bản kiểm: `origin/lp-v2` @ `c37a0a76` (= QA lượt 3 `0a25716a` + FE lượt sửa 4 `lp-v2-fe5`). Sổ tay trên `main` @ `753c0428` (BUG-R4-010 sửa ở `8ef3ce90`).
- Căn cứ: `plan-lp-v2.md`; PO `outputs/PO/lp-v2-stories.md` (AC US-131, US-174, US-175 + mục 9); QA `qa/lp-v2-test-report.md` (lượt 1–3), `qa/bug-list.md`, `outputs/QA/report.md`; review ARC (`ARC-on-LP-v2-code.md`, `ARC-on-LP-v2-fixes.md` cả lượt 2 `c37a0a76`), SEC (`SEC-on-LP-v2-code.md`, `SEC-on-LP-v2-ops.md`), UXD (`UXD-on-LP-v2-fe.md`, `-fe2.md`, `-fe4.md`); responses trên nhánh (`responses/BE-LP-v2.md`, `FE-B-LP-v2.md`, `OPS-LP-v2.md`); FE `outputs/FE/lp-v2-fe.md` mục 11 (trên nhánh); decision-log 01/11; ESC-043, ESC-044, ESC-045.
- Không sửa mã, không commit. Chỉ dữ liệu giả. Không đụng staging/production.

---

## 1. Quyết định

| Câu hỏi | Quyết định | Một câu lý do |
|---|---|---|
| **Gộp LP-v2 vào `main`** | **ĐẠT CÓ ĐIỀU KIỆN** | Sản phẩm đúng AC, 0 P0/P1, BUG-R4-011/012 QC đã tự xác nhận. Nhưng chỉ gộp sau khi xong M1–M8 (mục 5): CI `main` đang đỏ vì gitleaks bắt chuỗi test của chính LP-v2, CI chưa từng chạy trên nhánh `lp-v2`, v1.0.1 phải lên `main` trước (thứ tự migration), và thẻ Major ARC-OPS-LPV2-01 chưa được ARC đóng chính thức. |
| **Phát hành production** | **KHÔNG ĐẠT (tại `c37a0a76`)** – không do lỗi sản phẩm, do **chưa đủ cổng** | Bản sẽ lên mạng chưa tồn tại: nhãn version thông báo còn tạm, bản dịch còn chờ người bản xứ + luật sư (sẽ đổi chữ), chưa gộp với v1.0.1, chưa có đo staging (C8, Lighthouse) và chưa kiểm dữ liệu production. Khi đủ P1–P16 (mục 6), QC chạy **QC rút gọn** trên bản RC cuối (mục 6.3) rồi mới ĐẠT. |

Không có ESC mới (Round 4, không phải KHÔNG ĐẠT ở Round 3; không ai muốn phát hành trái QC). ESC-045 câu 1 vẫn Chờ INV và là điều kiện P7.

---

## 2. Bảng kiểm từng tiêu chí

### 2.1 Quy trình review

| Tiêu chí | KQ | Bằng chứng |
|---|---|---|
| FE được UXD + QA (+ARC) review | Đạt | UXD 3 lượt (fe, fe2, fe4); QA 3 lượt; ARC 2 lượt. **Chưa có UXD xem ảnh `lp-v2-fe5-*`** (FE-18…22 sửa giao diện Desk) → P12 |
| BE được ARC + QA (+SEC) review | Đạt | ARC `ARC-on-LP-v2-code.md`, SEC `SEC-on-LP-v2-code.md`; BE trả lời đủ (`responses/BE-LP-v2.md`: 4 Major ARC + 1 Major SEC = Done) |
| OPS được ARC + SEC review | **Thiếu ARC** | SEC review `lp-v2-ops` Đạt (0 Major) và ghi rõ "ý kiến SEC thay ARC, ARC xác nhận sau" (mục 2.3). Thẻ **FB-R4-ARC-OPS-LPV2-01 (Major)** – OPS đã làm đủ ý 1–8 (`outputs/OPS/lp-v2-ops.md` mục 1) – nhưng ARC chưa review `74e23925`/`0185a935` và chưa đóng thẻ; `responses/OPS-LP-v2.md` chỉ trả lời SEC → M5 |
| Thẻ Blocker | Đạt | 0 Blocker ở mọi review |
| Thẻ Major | Đạt có điều kiện | UXD FE-01…04 Done (FE-B responses, QA xác nhận tràn chữ ru); SEC BE-01, FE-01 Done (QA C8 lượt 1–3; QC chạy lại test BE-01 xanh – mục 3); ARC BE-01…04, FE-01 Done; **ARC FE-LPV2-05 đã đóng** (ARC lượt 2, `753c0428`); **ARC OPS-LPV2-01 còn mở về thủ tục** (M5) |
| Thẻ Rejected/Deferred có lý do | Đạt | SEC BE-03 Deferred v1.0.x (cần đổi hợp đồng); ARC FE-02/03/04 Deferred có đích (khi gộp main / QA staging); UXD FE-11 Deferred có lý do |

### 2.2 QA

| Tiêu chí | KQ | Bằng chứng |
|---|---|---|
| Không P0/P1 | Đạt | `bug-list.md` mục 1: 0 P0, 0 P1 cả 3 lượt |
| P2/P3 còn mở | Đạt (sau QC tự kiểm) | BUG-R4-011 (P2), 012 (P3): QC xác nhận đã sửa bằng test (mục 3) – **chưa** kiểm trên stack thật (đưa vào staging smoke P10). BUG-R4-010 (P3): QC xác nhận đã sửa trên `main` `8ef3ce90` (mục 4) |
| Bao phủ AC | Đạt có điều kiện | US-131 AC1–AC11, AC13 đạt (13/13 ca giá lệch 0 đ, 3 lượt); AC12 là cổng INV/SEC (P4, P5). US-174 AC1–AC9, AC11, AC12 đạt; **AC7 chưa có điểm Lighthouse** (P9); AC10 cổng người bản xứ/luật sư (P1, P2). US-175 AC1–AC6 đạt sau BUG-R4-010/011/012 |
| QA kiểm lại lượt sửa cuối | **Không** (QA đã đủ 3 lượt) | QC tự kiểm thay (mục 3); phần cần stack thật dời vào staging smoke (P10) |
| Chưa kiểm được (QA ghi) | Ghi nhận | Dòng bill OTA trả trước (số ít/nhiều – chỉ đọc mã); Desk giao diện tiếng Anh (chỉ đọc chuỗi); staging; Lighthouse; thiết bị thật → P10, P9 |

### 2.3 Tự kiểm mẫu (QC)

| Story / mục | Cách kiểm | KQ |
|---|---|---|
| US-175 AC4 ý 3 – BUG-R4-011 (Zalo) | admin-web vitest `r4-lp-v2-fe5` + đối chứng bản cũ + api integration thật | Đạt (mục 3) |
| US-175 AC4 ý 3 – BUG-R4-012 (quốc tịch NULL) | api integration trên Postgres 17 thật | Đạt (mục 3) |
| US-131 AC3, AC8, AC9 (giá web = Desk, không lộ dữ liệu, lỗi không chặn) + SEC C1 | api integration `lp-v2-price-estimate` 21/21 trên DB thật (gồm ca "direct = Desk quote", 429 từ lượt 31, IP khác vẫn 200, bulkhead, kill switch, BR-108 = 30) | Đạt |
| US-174 (landing 5 ngôn ngữ) | landing-web vitest 281/281 sau build (`--force`, không dùng cache) | Đạt (không thay QA Playwright) |
| US-175 AC6 (sổ tay) | đối chiếu chữ sổ tay `main` với chuỗi Desk `c37a0a76` | Đạt (mục 4) |

### 2.4 Nhất quán tài liệu ↔ thiết kế ↔ mã

| Điểm | KQ | Bằng chứng |
|---|---|---|
| Hợp đồng 0.3.10 bổ sung 5 ↔ server ↔ client | Đạt | `openapi.yaml` dòng 325–328, `GuestInput.nationalityCode` `type: [string, 'null']`; api-client `gen.mjs --check`, `gen-openapi-meta --check`, `gen-quote-copy --check`: up to date; ARC xác nhận (lượt 2) |
| Chữ sinh từ một nguồn | Đạt | Chạy `gen_strings.py` trên `c37a0a76`: không đổi byte (bước CI mới "Copy is generated" sẽ xanh) |
| Sổ tay ↔ chữ Desk | Đạt | "Khác giá web khách đã thấy: {from} → {to}", "Khách viết bằng tiếng Nga – gửi tin bằng tiếng Nga." có trong `strings-vi.json` và trong `02-le-tan.md` 13.1c/13.1d, `05-sale-ctv.md` 6.3a, `user-manual-v1.0.md` 2.18; không còn "Đã đổi: " ở 3 tệp md và bản HTML dựng lại 18:10 |
| Landing `shortMaxNights` 29 ↔ tham số Desk | **Phụ thuộc dữ liệu** | Đúng khi OWN đặt `long_stay_required_from_nights = 30` (P6); test api xác nhận tham số 28 (DS-E) → 29 đêm là tháng, đặt 30 → 29 đêm có số |
| Nhãn version thông báo | **Chưa** | `2026-11-01` vẫn là nhãn tạm (SEC FB-R4-SEC-FE-02 Open) → P3 |

---

## 3. QC tự kiểm BUG-R4-011 và BUG-R4-012 (thay QA lượt 4)

Môi trường: worktree tạm `git worktree add --detach <scratchpad>/qc origin/lp-v2` (HEAD `c37a0a76`), `pnpm install --frozen-lockfile`, Node 22.23.3. Postgres 17 tạm riêng (container `ottimo-qcgate-pg`, cổng `127.0.0.1`, mật khẩu tạm, vai `ottimo_app`/`ottimo_migrator` dựng bằng `infra/postgres/init/02-roles.sh`), migration 66 mục tới `0091_lp_v2_price_estimate_locales`. **Đã dừng và xóa container kèm volume, đã gỡ worktree** (`git worktree list` không còn).

| # | Lệnh | Kết quả |
|---|---|---|
| Q1 | admin-web `vitest run r4-lp-v2-fe5` | **13/13 đạt** |
| Q2 | Đối chứng: thay `GuestFormDialog.tsx` bằng bản `0a25716a`, chạy lại Q1 | **9/13 đỏ** (đúng 9 ca Zalo/quốc tịch/bản nháp) → test bắt được lỗi QA báo. Đã trả tệp về `c37a0a76` |
| Q3 | admin-web toàn bộ | **65 tệp / 687 đạt** |
| Q4 | api integration `bug-r4-012-guest-nationality-null` (DB thật, không bị `skipIf`) | **5/5 đạt**: `null` → NULL, `isForeigner` false, `preferredLocale` giữ (FD và SAL); bỏ trường → `VN`; sửa hồ sơ giữ NULL, `KR` → nước ngoài, `null` xóa lại; Zalo chỉ SĐT → 422 `CONTACT_CHANNEL_EMPTY`, có `messagingHandles.zalo` → 201 |
| Q5 | api integration `lp-v2-price-estimate` | **21/21 đạt** (gồm đếm `total` sau khi đổi sang `whereAt`) |
| Q6 | api hồi quy gần: `guests.test`, `guest-locale-s4-bed`, `guest-document-profiles`, `public-site-r3-bed`, `sales*`, `lp-v2-be-units`, `bug-r4-009-plurals` | **7 tệp / 133 đạt** |
| Q7 | `turbo run build test --force` cho landing-web, i18n, guest-web, contracts | 281 + 22 + 73 + 2 đạt |
| Q8 | `gen_strings.py`, `gen-quote-copy --check`, `gen-openapi-meta --check`, api-client `gen.mjs --check` | Không đổi / up to date |

Ghép Desk ↔ server: body Desk gửi trong Q1 (`preferredContact: 'zalo'`, `messagingHandles: { zalo: <SĐT> }`, `nationalityCode: null`) **cùng dạng** body Q4 gửi vào api thật và nhận 201. Đây là điểm yếu của lượt 4 (MSW xanh, stack thật đỏ); MSW lượt 5 đã áp luật server và Q4 chạy trên DB thật.

**Kết luận:** BUG-R4-011 và BUG-R4-012 – **Đã sửa, QC xác nhận bằng test tự động**. Chưa thấy trên stack thật (Desk build + api + Caddy) → một ca trong staging smoke (P10): 3 đường Báo giá / Tạo đơn / Ở dài ngày từ yêu cầu Zalo ko/zh/ru/vi, `GET /guests/{id}` không có quốc tịch. Đề nghị QA/ORC ghi trạng thái hai lỗi: "Fixed – QC xác nhận (test), đóng hẳn sau staging smoke".

## 4. QC kiểm BUG-R4-010 (sổ tay)

`8ef3ce90` sửa `02-le-tan.md` (13.1c dòng 1015, bảng tra cứu 1221, bài tập 11 dòng 1490; 13.1d dòng 1036 thêm câu tiếng Nga), `05-sale-ctv.md` 6.3a (273–278), `user-manual-v1.0.md` 2.18 (1142–1147) và lịch sử bản. `grep "Đã đổi: "` trên 3 tệp md và 9 tệp HTML dựng lại: 0 kết quả. Chữ khớp chuỗi Desk `webreq.estimate_changed*`, `sale.text_lang_note.ru` ở `c37a0a76`. **Đã sửa – QC xác nhận; đóng được.** Ghi chú: bản HTML sổ tay (`product/docs/manual/guides/html/`, `ottimo-manual-v1.0.html`) đang **chưa track** trong git – ORC xác nhận đó là chủ ý (phát ngoài repo).

---

## 5. Điều kiện để GỘP vào `main` (M1–M8)

| # | Điều kiện | Vai | Hạn |
|---|---|---|---|
| M1 | **Sửa gitleaks đỏ trên `main`.** Từ 01/11 07:16 mọi lần CI `main` đỏ ở job `gitleaks` (vd. run `41300706089` trên `8ef3ce90`): `generic-api-key` ở `product/apps/landing-web/src/scripts/booking.test.ts`, commit `a29f7395` (nhánh `lp-v2-fe`) – chuỗi token giả `pe1.…` của test. CI quét toàn bộ lịch sử mọi nhánh đã đẩy, nên đỏ cả `main`. Thêm mục allowlist **hẹp** (regex đúng giá trị giả của test, kèm lý do) vào `.github/gitleaks.toml`; SEC duyệt. Không xóa job, không mở allowlist theo cả thư mục | OPS, SEC duyệt | Trước mọi lần gộp vào `main` (gồm v1.0.1) |
| M2 | **v1.0.1 lên `main` trước** theo ARC `ARC-on-LP-v2-code.md` mục 5: PR #16 (đang OPEN) → `be-a-v1.0.1` (0089) → `fe-a-v1.0.1` → PN-01 (0090, nếu đi cùng) → lượt landing `2026-10-31` (gồm `consentMore` "from our server") | ORC, BE, FE, OPS | Trước M3 |
| M3 | Gộp `main` vào `lp-v2`: migration LP-v2 lấy số kế tiếp (**0091** nếu PN-01 đã lên; nếu chưa thì 0090 và PN-01 đổi số – ARC quyết), `when` theo luật 30/10, `idx` liền nhau, **snapshot sinh lại** từ snapshot mới nhất của `main` (hiện `0091_snapshot.json` có `prevId` = 0088, thiếu `simulation_guard` của 0089); bước CI "schema and migrations differ" và test `migrations-journal` xanh | BE, ARC xác nhận | Khi gộp |
| M4 | Cùng lượt M3: OpenAPI LP-v2 = 0.3.10-draft (bổ sung 1–5) nằm **sau** changelog 0.3.9 của v1.0.1, sinh lại meta/schemas/api-client (`contract.test.ts` xanh); `privacy.ts` en/vi lấy chữ `2026-10-31` của `main` làm gốc + Δ5 L3 (ARC FE-03) | ARC, BE, FE-B | Khi gộp |
| M5 | ARC review hạ tầng `lp-v2-ops` (`74e23925`, `0185a935`) và **đóng FB-R4-ARC-OPS-LPV2-01 (Major)**; xác nhận các ý SEC ghi "ARC xác nhận sau" (404 tiếng Anh dự phòng, G1 danh sách ngôn ngữ từ image, G2 hreflang làm manifest) | ARC | Trước gộp |
| M6 | Đóng FB-R4-ARC-OPS-LPV2-03 (turbo `test.inputs` thiếu `plural-forms.cases.json` và `design/copy/strings-*.json`) – ARC yêu cầu trước khi gộp | OPS (hoặc BE) | Trước gộp |
| M7 | Mở **PR `lp-v2` → `main`** để CI chạy đủ (format/lint/test với Postgres, OpenAPI lint, contract, landing Playwright, docker build + E2E smoke, gitleaks, bước mới "Copy is generated"). Hiện CI **chưa từng chạy trên nhánh `lp-v2`** (CI chỉ chạy push `main` và PR) – mọi số xanh đến nay là chạy tay. Gộp khi CI xanh toàn bộ trên commit gộp cuối | ORC, OPS | Trước gộp |
| M8 | Thủ tục: QA/ORC cập nhật `bug-list.md` (BUG-R4-010 Closed; 011, 012 Fixed – QC xác nhận) và ORC ghi decision-log dòng mục 10 | QA, ORC | Cùng lượt gộp |

Gộp `main` không làm landing hay ô giá hiện ra trên production: phát hành theo README 12.3 (OPS) với `LANDING_LOCALES=en,vi` và `public_show_prices = false` (mặc định). Nếu gộp vào `main` kéo theo deploy staging tự động thì càng tốt cho P8–P10.

---

## 6. Điều kiện để PHÁT HÀNH production (P1–P16)

### 6.1 Cổng nội dung, pháp lý, chính sách (INV / SEC / CPY / UXD)

| # | Điều kiện | Ai | Ghi chú |
|---|---|---|---|
| P1 | **Người bản xứ** đọc toàn bộ chữ ko, zh, ru (gồm khối giá, lời mời 30 đêm, Δ5, câu `consentMore`); INV báo "đã duyệt" từng ngôn ngữ, ORC ghi decision-log, **không** ghi tên/liên hệ người đọc vào repo (US-174 AC10 (1)) | INV mời; ORC ghi | Chữ đổi theo người bản xứ → CPY sửa nguồn, FE-B chép, chạy lại kiểm ở P11 |
| P2 | **Luật sư** đồng ý bản dịch thông báo xử lý dữ liệu ko/zh/ru và thư 6 câu (gồm câu 4 (d) về dịch giấy tờ/thanh toán) (US-174 AC10 (2)) | INV, SEC | Luật sư đổi chữ thông báo → nhãn version mới theo P3 |
| P3 | **Nhãn version thông báo thật**, lớn hơn `2026-10-31` (SEC C3, FB-R4-SEC-FE-02 còn Open); đổi nhãn tạm `2026-11-01` trong `privacy.ts` + thẻ meta/`data-notice-version` cả 5 ngôn ngữ; `dist-checks` xanh | SEC đặt nhãn, FE-B | Đặt **sau** P1–P2 để nhãn ứng với chữ cuối |
| P4 | **v1.0.1 đã đăng thông báo `2026-10-31` trên production trước** (SEC C3; INV 01/11 "v1.0.1 đi riêng, không chờ LP-v2"); `deploy-landing.sh` sẽ FAIL nếu version LP-v2 không lớn hơn | ORC, OPS | Phụ thuộc M2 |
| P5 | INV duyệt chữ khối giá EN/VI (US-131 AC12 (4)); SEC ký điều kiện phát hành mục 4 (C1 BE-01, C2 Δ5 – SEC chưa duyệt lại commit sửa trong tệp review); CPY + UXD xác nhận giọng văn và quét chuỗi cấm = 0 trên bản dịch cuối (US-174 AC10 (3)) | INV, SEC, CPY, UXD | – |
| P6 | **OWN chuyển Desk sang bảng giá mới** (ngày S, DOM đề xuất **03/11**) theo `pricing-spec-2026-11-01-reconcile.md`: giá đêm 800.000 / 800.000 / 1.100.000 / 1.300.000, `los_discount` rỗng, **`long_stay_required_from_nights = 30`** (khớp `shortMaxNights` 29 của landing – README 12.3), `short_stay_max_nights` 29; INV sửa giá Booking/Agoda/Airbnb khớp (decision-log 01/11 câu 3) | OWN, DOM kiểm, INV | Web hiện đúng số Desk tính – nhập sai là web công khai số sai |
| P7 | **ESC-045 câu 1 (GẤP)** – cuối tuần/lễ còn tăng giá không – INV trả lời và OWN đặt `weekend_uplift_pct`/`special_uplift_pct` theo câu trả lời **trước** khi bật giá. QA đã kiểm theo giả định A (0 %); chọn B/C thì chạy lại 13 ca giá trên staging | INV, OWN | Chưa trả lời thì không bật `public_show_prices` |

### 6.2 Cổng kỹ thuật (OPS / QA / ARC / UXD)

| # | Điều kiện | Ai | Ghi chú |
|---|---|---|---|
| P8 | **Kiểm `public_room_type` trên production – chỉ đọc** (truy vấn đọc hoặc `listRooms` bằng OWN): đủ 10 căn mang nhãn công khai đúng 4 hạng (`production-defaults.ts`). Thiếu → web hiện "giá theo yêu cầu" ở mọi hạng (BUG-R4-004). Nếu phải gán: OWN gán trên Desk, không SQL | OPS + OWN | Không ghi gì vào production ở bước kiểm |
| P9 | **Staging qua Caddy thật:** SEC C8 đủ 12 ca SEC 9.5 + ca BE-01 (đặc biệt ca 6: IP khách tới được api qua `TRUST_PROXY`); **Lighthouse** di động Performance ≥ 90 / Accessibility ≥ 95 / SEO ≥ 95, LCP ≤ 2,5 s (4G), CLS ≤ 0,1 trên trang chủ × 5 ngôn ngữ (US-174 AC7 – hiện chỉ có đo CDP thủ công) | QA (+OPS dựng staging) | Trên bản RC cuối (sau P1–P3) |
| P10 | **Staging smoke** trên bản RC cuối: BUG-R4-011/012 trên stack thật (3 đường Báo giá / Tạo đơn / Ở dài ngày, yêu cầu Zalo ko/zh/ru/vi, hồ sơ lưu `zalo` + quốc tịch NULL); dòng bill OTA trả trước số ít/nhiều (QA 12.6 chưa kiểm); Desk giao diện tiếng Anh (cột "Language", "Matching requests", câu "Guest wrote in…"); form gửi được ở 5 ngôn ngữ; 13 ca giá theo bảng đã nhập ở P6–P7 | QA | Lượt kiểm thu hẹp, không phải QA lượt 4 đầy đủ |
| P11 | Nếu chữ đổi sau P1–P3: chạy lại `pages.spec` 15 trang × 5 ngôn ngữ (tràn 0 ở 320/360/375/1024, axe 0, hreflang, 0 mẫu tiền), `est.spec` (nhãn ≥ 15 px, ru không tràn), `check:dist` 14/14, `copy.test` | QA (+FE-B) | Gộp chung với P9–P10 |
| P12 | UXD xem ảnh `lp-v2-fe5-*` (FE-18…22: chip 9rem, thanh lọc cùng đáy, câu `help`), xác nhận bảng S35 1360/1084 px ở 1366 | UXD | Minor – không chặn gộp, chặn phát hành |
| P13 | Thứ tự phát hành theo ARC 3.6 (5) / README 12.3: api (giữ `LANDING_LOCALES=en,vi`) → landing → `publish-privacy-notice` 5 ngôn ngữ → `LANDING_LOCALES=en,vi,ko,zh,ru` → QA form 5 ngôn ngữ → **OWN bật `public_show_prices` cuối cùng**, chỉ khi P6–P7 xong và QA giá đạt trên bảng mới. Đường quay lui (README) đã đọc trước | OPS, OWN, QA | – |
| P14 | **Google Chat (C7):** nếu production đặt mức **C** cho tin yêu cầu website thì mục 10 SEC (`chatSafeText` với `。．｡`, tên miền Kirin/`xn--`, số giấy tờ nước ngoài) + GCHAT-07/BUG-R3-058 phải xong **trước** khi mở ko/zh/ru; giữ mức A thì không chặn | ORC, BE, SEC | PR #16 còn OPEN |
| P15 | Cherry-pick BUG-R4-009 (`ee375e6d`) sang v1.0.1 theo ARC `ARC-on-LP-v2-fixes.md` mục 4 (chỉ commit đó, không `2f7b55f7`) – để khi gộp không có hai bản khác nhau của câu báo giá | BE, ARC | Thuộc v1.0.1 |
| P16 | INV duyệt Release LP-v2 sau khi QC rút gọn (6.3) đạt | INV | Ràng buộc cứng của plan |

### 6.3 QC rút gọn trên bản RC cuối

QC chỉ kiểm: (1) commit RC = `main` sau M1–M8 + chữ cuối P1–P3, CI xanh trên đúng commit đó; (2) bằng chứng P1–P15 có trong decision-log/báo cáo; (3) kết quả P8–P12 của QA/OPS/UXD; (4) không còn thẻ Blocker/Major mở. Đạt → ĐẠT phát hành; thiếu bất kỳ mục nào → giữ KHÔNG ĐẠT.

---

## 7. Hạng mục còn trượt và vai chịu trách nhiệm

| Hạng mục | Mức | Vai | Đích |
|---|---|---|---|
| CI `main` đỏ (gitleaks, test fixture LP-v2) | Chặn gộp mọi thứ vào `main` | OPS + SEC | Ngay (M1) |
| FB-R4-ARC-OPS-LPV2-01 chưa đóng (thủ tục, việc đã làm) | Major | ARC | Trước gộp (M5) |
| FB-R4-ARC-OPS-LPV2-03 turbo inputs | Minor (ARC yêu cầu trước gộp) | OPS | M6 |
| Nhãn version thông báo tạm (SEC FE-02) | Chặn phát hành | SEC, FE-B | P3 |
| Lighthouse chưa đo, C8 chưa trên staging | Chặn phát hành | QA, OPS | P9 |
| UXD chưa xem fe5 | Minor | UXD | P12 |
| Thẻ Minor/Suggestion mới của ARC lượt 2 (BE-LPV2-11 handle SĐT không `+`, DATA-LPV2-01 nhóm "Chưa rõ" quốc tịch, ARC-LPV2-01/02 tài liệu, DOM-LPV2-01, FE-LPV2-07/08) | Minor/Suggestion | BE, DATA, ARC, DOM, FE | v1.1 – PO xếp; **DATA-LPV2-01 nên xong trước khi INV đọc báo cáo cơ cấu khách** |
| SEC BE-03 (Desk thấy số "đến" của khoảng giá) | Minor, Deferred | ARC, FE-A | v1.0.x |

---

## 8. Rủi ro chủ đầu tư cần biết

1. **Giá trên web là giá công khai và lấy thẳng từ Desk.** Nhập bảng giá mới sai một số hay chọn sai câu ESC-045 câu 1 thì web hiện ngay số đó cho mọi khách. Vì thế công tắc hiện giá chỉ bật sau cùng, sau khi đã kiểm 13 ca trên bảng đã nhập (P6, P7, P13).
2. **Khách chưa rõ quốc tịch được đếm là "khách Việt"** trong báo cáo cơ cấu khách cho tới khi DATA sửa (thẻ ARC DATA-LPV2-01). Khai báo lưu trú và phụ thu khách nước ngoài **không** bị ảnh hưởng (theo giấy tờ / theo báo giá – ARC lượt 2, K11).
3. **Thông báo cho khách đang lưu trú chưa nói việc dùng Google Dịch** (SEC RR-T4, mức Trung bình) trong khi INV đã cho dịch mọi màn hình Desk, kể cả giấy tờ/thanh toán. Ngoài phạm vi LP-v2; SEC đề nghị đi cùng v1.0.1 và hỏi luật sư cùng thư câu 4 (d).
4. **Thời gian:** phát hành một lần nên chậm nhất là cổng người bản xứ + luật sư. Mỗi lần chữ đổi sau đó phải đặt lại nhãn thông báo và chạy lại kiểm hiển thị (P3, P11) – nên gom một lượt sửa chữ duy nhất.
5. **Tin Google Chat:** nếu muốn tin chi tiết (mức C) khi mở ko/zh/ru thì phải xong phần làm sạch chữ Hàn/Trung/Nga của SEC trước (P14).

---

## 9. QC không kiểm được

- Mọi thứ trên staging/production (theo lệnh: không đụng): C8 qua Caddy staging, Lighthouse, dữ liệu `public_room_type` production, thứ tự phát hành.
- BUG-R4-011/012 trên Desk build thật + api + Caddy (chỉ kiểm bằng vitest admin-web + integration api trên DB thật).
- Chất lượng bản dịch ko/zh/ru (cổng người bản xứ).
- Chạy gitleaks tại máy (dựa vào log CI run `41300706089`).
- Toàn bộ bộ test api (chỉ chạy 9 tệp liên quan, 159 ca; FE báo bộ đầy đủ 3356 ca đạt – M7 sẽ chứng minh trên CI).

---

## 10. Đề nghị dòng decision-log (ORC ghi)

`| 2026-11-01 | 4 | QC – gate LP-v2 (origin/lp-v2 @ c37a0a76): Gộp main = ĐẠT CÓ ĐIỀU KIỆN (M1–M8: sửa gitleaks đỏ trên main do token giả trong booking.test.ts của lp-v2-fe; v1.0.1 lên main trước; migration LP-v2 số kế tiếp + snapshot sinh lại; OpenAPI 0.3.10 sau 0.3.9; ARC đóng OPS-LPV2-01 và OPS-LPV2-03; PR lp-v2→main CI xanh). Phát hành production = KHÔNG ĐẠT tại c37a0a76 – chưa đủ cổng, không do lỗi sản phẩm (P1–P16: người bản xứ, luật sư, nhãn version > 2026-10-31, v1.0.1 đăng 2026-10-31 trước, OWN chuyển giá + long_stay_required_from_nights = 30, ESC-045 câu 1, kiểm public_room_type production chỉ đọc, staging C8 + Lighthouse + smoke, UXD fe5, thứ tự bật giá cuối); mở lại bằng QC rút gọn trên RC cuối. QC tự kiểm BUG-R4-011/012: admin-web r4-lp-v2-fe5 13/13 (bản cũ 9/13 đỏ), 687/687; api integration bug-r4-012 5/5 + lp-v2-price-estimate 21/21 trên Postgres tạm. BUG-R4-010 đã sửa (main 8ef3ce90). 0 P0/P1 | QC | Quyền QC (quyết định cổng chất lượng); rounds/round-04/qc/lp-v2-gate.md |`

---

## 11. Báo cáo QC (Đã làm · Giả định · Việc chưa xong)

- **Đã làm:** đọc plan, AC + mục 9 PO, báo cáo QA 3 lượt, bug-list, mọi review R4 (ARC 2 tệp gồm lượt 2, SEC 2, UXD 3) và responses trên nhánh, FE mục 11, decision-log 01/11, ESC-043/044/045; tự kiểm BUG-R4-011/012 (mục 3), BUG-R4-010 (mục 4), hợp đồng/chữ sinh (2.4); tra CI GitHub (phát hiện gitleaks đỏ); kiểm thứ tự migration (`lp-v2` 0088 → 0091, `be-a-v1.0.1` có 0089, PN-01 chưa có nhánh).
- **File tạo:** `rounds/round-04/qc/lp-v2-gate.md` (tệp này). Không sửa mã, không commit.
- **Giả định:** (1) "Không được ĐẠT khi còn Major Open" hiểu là không ĐẠT thẳng; ĐẠT CÓ ĐIỀU KIỆN cho gộp được, với điều kiện đóng thẻ trước khi gộp. (2) ARC-OPS-LPV2-01 coi là Major còn mở về thủ tục (việc đã làm, SEC đã duyệt, ARC chưa đóng). (3) ESC-045 câu 2–6 không chặn LP-v2 (không ảnh hưởng giá web; giá tháng không hiện). (4) BUG-R4-011/012 coi là đã sửa dựa trên test tự động; đóng hẳn sau P10.
- **Việc chưa xong:** QC rút gọn trên RC cuối (6.3) khi P1–P16 xong.
