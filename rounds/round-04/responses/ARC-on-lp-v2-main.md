# ARC phản hồi – review nhánh tích hợp `lp-v2-main` (SEC, BE, FE-B) + trả lời runbook r1.1

- Tác giả: ARC (người lắp ráp `lp-v2-main`) · Round 4, gói LP-v2, bước **Phản hồi & sửa** + **Review** · 04/11/2026
- Mục đích: đóng điều kiện **G3 (phần ARC)** và **G4 (responses)** của `rounds/round-04/qc/lp-v2-merge-gate.md`, và **T1 (phần ARC)** – mục "Runbook r1.1" ở cuối.
- Đối tượng: `origin/lp-v2-main` @ `4fe85e19`. Tệp này viết trên nền `origin/main` (`83875e50`); không đổi nhánh `lp-v2-main`.
- Review được trả lời:
  - `rounds/round-04/reviews/SEC-on-lp-v2-main.md` (trên `main`): FB-R4-SEC-LPV2M-01..05
  - `rounds/round-04/reviews/BE-on-lp-v2-main.md` (trên nhánh): FB-R4-BE-LPV2M-01..03
  - `rounds/round-04/reviews/FE-B-on-lp-v2-main.md` (trên nhánh): FB-R4-FE-B-LPV2M-01..02
  - Thẻ ARC tự ghi trong biên bản `rounds/round-04/outputs/ARC/lp-v2-main-merge.md` mục 6 (trên nhánh): FB-R4-ARC-LPV2M-01..02
- Mỗi thẻ do vai sửa đúng chuyên môn (BE, FE-B, OPS, ARC); ARC là người lắp ráp nên gom trạng thái về một tệp. Commit đều trên `origin/lp-v2-main`.
- Không có dữ liệu khách, khóa, mật khẩu, IP hay digest image trong tệp này.

## 1. G3 – ARC xem `2760744b` và `4fe85e19`

**ĐẠT, 0 thẻ mới.** Chi tiết: `rounds/round-04/reviews/ARC-on-lp-v2-main-be-fixes.md`.
- Hằng `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'` vẫn là hằng trong mã. Cổng ★2 không đổi: so `published_at`, không so chữ version, thiếu mốc thì A (fail-closed).
- `isCalendarDate` (dựng lại ngày rồi so chuỗi) dùng cho route giá và form (`arrival`, `departure`). Lỗi `422 VALIDATION_FAILED` có sẵn trong hợp đồng 0.3.11: **không đổi OpenAPI**, không phải báo FE/MOB/INT. `assertLocalDate` giữ nguyên tới v1.0.x là đúng (đổi sẽ thành 500 ở API nội bộ).
- `4fe85e19`: 5 ca đều cho kết quả khác nhau giữa "so giờ đăng" và "so chữ", đúng bẫy ngược SEC nêu. Chạy lại đột biến là việc của QA ở G2.

## 2. Trả lời từng thẻ (G4)

| ID | Mức | Trạng thái mới | Commit sửa | Ghi chú |
|---|---|---|---|---|
| FB-R4-SEC-LPV2M-01 | Major | **Done** | `2760744b` (BE), `4fe85e19` (BE, test BUG-R4-027), `cc045857` (ARC, biên bản), `aad14baa` (OPS, quy tắc đổi hằng khi đổi nhãn – BUG-R4-028) | Hằng = `2026-11-04`, SQL cổng giữ theo `published_at`, chú thích lý do P4. Test `gchat-units`/`gchat-notify` đủ 3 ca SEC đề xuất (a)(b)(c) và 5 ca chống so chữ. `env.production.example` + README 13.4 sửa câu "older than 2026-11-04". ARC sửa câu P4 sai trong biên bản mục 7. ARC đã xem mã (mục 1). Chờ SEC ghi xác nhận đóng (G3a) |
| FB-R4-SEC-LPV2M-02 | Minor | **Done** | `ef2eb4ef` (FE-B) | `VERSION = '2026-11-04'`, chú thích "TEMPORARY LABEL" thay bằng nguồn nhãn + quy tắc không dùng lại nhãn; 3 test đổi. vitest landing 283/283, Playwright 149/149, `check:dist` `ok`. 5 sha256 trang privacy dựng ghi ở `FE-B-on-lp-v2-main.md` mục 4 (S4/P10 so với số này). Đóng kèm FB-R4-SEC-FE-02 và FB-R4-ARC-LPV2M-02 |
| FB-R4-SEC-LPV2M-03 | Minor | **Done** | `917a39cf` (OPS), `aad14baa` (OPS, r1.1) | README 12.3 viết lại theo trạng thái thật (`2026-10-24` en/vi đang hiệu lực, supersede `2026-10-24 (en)`/`(vi)`, quay lui in `2026-10-24`); chú thích `publish-privacy-notice.sql`; runbook `lp-v2-release-runbook.md` có P1–P6 của notice-final mục 5 (P5 = hằng bằng nhãn đăng, kiểm bằng khối `CHKV`) |
| FB-R4-SEC-LPV2M-04 | Suggestion | **Done** | `cc045857` (ARC) | Biên bản mục 4 bước 2 có ghi chú: dữ liệu thử có `2026-10-31` **không** giống production (production chỉ `2026-10-24` en/vi). Kết luận 0092 không đổi. Diễn tập staging S0 ghi trạng thái thông báo thật trước khi chạy |
| FB-R4-SEC-LPV2M-05 | Suggestion | **Done một phần / Deferred phần còn lại** | `2760744b` (BE) | Làm: `isCalendarDate` cho route giá và form (`arrival`, `departure`), test `time.test.ts` + `lp-v2-be-units`. Dời v1.0.4 (BE, khi chạm `shared/time.ts`): đổi `assertLocalDate` sang phép so khứ hồi – phải đổi kèm nơi gọi nội bộ để ngày sai ra 422 chứ không 500. Không chặn gộp/phát hành |
| FB-R4-BE-LPV2M-01 | Major | **Done** | `2760744b` (BE) | Trùng SEC-LPV2M-01. 25/25 `gchat-notify`, 200/200 sáu tệp liên quan (BE) |
| FB-R4-BE-LPV2M-02 | Minor | **Deferred** → v1.0.4, BE-C (P4-11 `v104/be-lease-prices`, cùng tệp `platform.controller.ts`) | – | Hủy giá hẹn (`cancelScheduledRoomListPrice`) chưa gọi `hooks.changed` → bộ đệm giá ước tính lệch tối đa 60 giây. Ảnh hưởng thấp: giá công khai còn tắt tới F2, server tính lại lúc nhận yêu cầu. Sửa theo đúng đề xuất BE + 1 ca test. ARC nhắc BE-C khi rebase sau `main@L` |
| FB-R4-BE-LPV2M-03 | Suggestion | **Rejected** (không đổi mã/hợp đồng) | – | Lý do: lệch `User.email` (D27) "thiếu vai manager" là **có chủ đích** từ v1.0.3 – MGR không xem/đổi email người khác (SEC), rbac-matrix ghi chú 45; ARC đã ghi ở `outputs/ARC/v1.0.3-contract-email.md` mục 2 ("lệch có chủ đích, không làm `--strict` đỏ"). Hợp đồng 0.3.12 (P4-00) chỉ chuyển 5 thuộc tính **của chính mình** sang `x-self-data`, `User.email` giữ D27 + `x-visible-to: [owner]`. Việc nhỏ kèm theo (không chặn): BA thêm chỉ dẫn "xem ghi chú 45" vào ô MGR dòng D27 của rbac-matrix ở lượt tài liệu v1.0.4, để lần sau không ai báo lại |
| FB-R4-FE-B-LPV2M-01 | Minor | **Done** | `6ce5e444` (FE-B) | `dist.test.ts` kiểm nguyên văn trang privacy dựng cho cả 5 ngôn ngữ; FE-B có thử đột biến (thêm 1 ký tự câu Δ5 zh → 2 ca đỏ). QA đạt (`lp-v2-main-qa.md` mục 1) |
| FB-R4-FE-B-LPV2M-02 | Suggestion | **Done** | `6ce5e444` (FE-B) | Ghi chú chạy song song (`CI=1` + cổng riêng) ở đầu `playwright.config.ts` và `apps/landing-web/README.md`. Không đổi hành vi config |
| FB-R4-ARC-LPV2M-01 | Minor | **Deferred** → v1.0.4 (FE-A, BE khi chạm tệp) | – | Chú thích "OpenAPI 0.3.10" trong mã LP-v2 (admin-web, api-client, contracts, `price-estimate.service.ts`, `public-booking.service.ts`, `website-request-rules.ts`) nay nghĩa là 0.3.11. Chỉ chú thích, không đổi hành vi. Không sửa trên `lp-v2-main` để đầu PR không đổi thêm (G1/G2 không phải chạy lại) |
| FB-R4-ARC-LPV2M-02 | Minor | **Done** | `ef2eb4ef` (FE-B) | Cùng SEC-LPV2M-02: SEC chốt `2026-11-04`, FE-B đổi `VERSION` + 3 test |

**Tổng:** 12 thẻ đã trả lời. Blocker 0. Major 2/2 Done. Còn chưa Done: 3 thẻ dời có chủ (SEC-LPV2M-05 phần `assertLocalDate`, BE-LPV2M-02, ARC-LPV2M-01 – đều v1.0.4, không chặn) và 1 thẻ Rejected có lý do (BE-LPV2M-03).

Liên quan, không phải thẻ review: BUG-R4-027 (BE `4fe85e19`) và BUG-R4-028 (OPS `aad14baa`) đã sửa trên nhánh, chờ QA xác nhận (G2) rồi QA chuyển Closed trong `qa/bug-list.md`.

## 3. Việc còn cho người khác (để đóng G3/G4)

| Việc | Ai |
|---|---|
| Ghi một dòng xác nhận đóng LPV2M-01, 02, 03 (05 tùy SEC) vào `reviews/SEC-on-lp-v2-main.md`; xem ca test BUG-R4-027 | SEC (G3a) |
| BUG-R4-027/028 → Closed; 011/012 "đã vào `main`, chờ P10" | QA (G2, G4b) |
| Dòng decision-log của QC gate + ghi đổi thứ tự M2/P4 + dòng mục 5 dưới đây | ORC (G4c) |

---

## Runbook r1.1

Đọc `rounds/round-04/outputs/OPS/lp-v2-release-runbook.md` r1.1 trên `origin/lp-v2-main` @ `4fe85e19`, gồm khối `CHKV`, 0.2, P0–P10, F1–F2, K1–K8, mục 5–7.

**Kết luận ARC: ĐẠT CÓ ĐIỀU KIỆN cho staging/production.** Không có lỗi chặn. Điều kiện duy nhất là thêm vào 5.4 một ghi chú về mốc 7 ngày (Q2 dưới đây, OPS ra r2). Q1 thuộc SEC.

### Q2 (ARC) – 5.4: có bắt buộc quay landing trước khi lùi app không?

**Đồng ý giữ bắt buộc, kèm một bổ sung.** ARC đã đọc mã thật:

1. **Api v1.0.3 trả lỗi sạch, không hỏng dữ liệu.** Ở `v1.0.3`, `public-booking.service.ts` có `LOCALES = ['vi', 'en', 'ru']`. Yêu cầu ko/zh nhận `422 VALIDATION_FAILED` (`locale` / `NOT_IN_LIST`): không 500, không ghi dòng nào. en/vi/ru từ trang LP-v2 vẫn được nhận, vì v1.0.3 chỉ kiểm dòng (version, locale) và `2026-11-04` đã đăng cho cả 5 ngôn ngữ. Route giá trả 404, trang ẩn khối giá như khi công tắc tắt. QA cũng đã chứng minh Desk v1.0.3 đọc được dòng ko/zh (`lp-v2-main-qa.md` mục 2.3 bước 6). Vậy **không phải vấn đề an toàn dữ liệu**.
2. **Nhưng khách ko/zh gặp lỗi sai nghĩa.** Landing không có ô cho trường `locale`, nên `showServerErrors` trả `false` và trang rơi về câu `net.network`: "We could not send your request. Check your connection and try again…". Khách đã điền xong form, được bảo kiểm mạng và gửi lại, rồi lại hỏng. Trình duyệt nào đang giữ `priceEstimateToken` (giá đã bật ở F2) cũng nhận `NOT_ALLOWED`, tức cùng câu đó cho mọi ngôn ngữ. Ngoài ra cặp "landing LP-v2 + api v1.0.3, proxy mở" chưa ai kiểm.
3. **Bất biến cần giữ** (ghi vào 5.4 thay cho câu lý do hiện tại): *không để landing LP-v2 **có proxy form mở** đứng trước api v1.0.3.* Có hai cách đúng:
   - (i) Như runbook: quay landing về `sha-72f9ac8e2b33` trước (5.2 bước 2). Form en/vi vẫn mở. **Chỉ dùng được trước mốc 7 ngày** (giờ C + 7 ngày). Lý do: v1.0.3 cũng nhận consent `2026-10-24` chỉ trong 7 ngày sau khi bị supersede (`superseded_at > now − 7 days`, cùng luật). Quá mốc thì form của landing cũ chết trên cả hai bản api.
   - (ii) Giữ landing LP-v2, đóng proxy: `LANDING_PUBLIC_API=off` (khuôn `ENVSET`) → `deploy-landing.sh ⟨TAG_L⟩ --no-pull` → `form-token` 404 HTML. Landing không còn gọi api nào (form-token và route giá đều qua proxy), nên chạy được với bất kỳ bản api nào, mọi lúc. Trang 5 ngôn ngữ vẫn hiện, form hiện khối Zalo/gọi.
   - **Đề xuất cho OPS (r2, 5.4 bước 2):** trước mốc thì làm (i). Quá mốc, hoặc khi `deploy-landing.sh --rollback` từ chối, thì làm (ii). Báo INV form website tạm đóng. Mở lại form chỉ khi app LP-v2 lên lại, hoặc sau khi đã chọn 5.2 bước 4 (a)/(b).
4. Các bước khác của 5.4 đúng với mã: bước 1 phải đi trước bước 2, vì `deploy-landing.sh` đọc `LANDING_LOCALES` từ `.env` (ca 14 của `deploy-landing-privacy.test.sh`). `rollback.sh` truyền `--rollback`, nên chấp nhận "69 applied / 68 in the image journal". Cổng Chat v1.0.3 neo `2026-10-31` (chưa đăng) nên giữ mức A. Cấm `rollback.sh` không tham số sau đó.

### Q3 (ARC) – K2 dòng 4: `pg_get_constraintdef … LIKE` đủ chưa, hay so nguyên văn?

**Đủ. Không so chuỗi nguyên văn.**
- `pg_get_constraintdef` không trả lại chữ trong 0092 (`"locale" IN ('vi', …)`) mà trả dạng đã chuẩn hóa, kiểu `CHECK ((locale = ANY (ARRAY['vi'::text, …])))`. Cách in dạng này có thể khác giữa các bản PostgreSQL. So nguyên văn sẽ dừng nhầm khi staging và production lệch bản phụ. `LIKE '%''ko''%'` khớp `'ko'::text` trên mọi bản.
- Ràng buộc chính của K2 là dòng 2 (`69|WHEN_0092`) và dòng 3 (băm = `HASH_0092`): 0092 đã chạy đúng byte. Dòng 4 chỉ để thấy CHECK mới thật sự có trên bảng. Thiếu constraint thì thiếu dòng (đúng là 3 dòng), nên vẫn bắt được.
- Không bắt buộc, OPS tự cân nhắc khi ra r2: nếu muốn chặt hơn mà vẫn không phụ thuộc định dạng, rút danh sách mã ngôn ngữ rồi so:
  ```sql
  SELECT conname || '|' || coalesce((SELECT string_agg(m[1], ',' ORDER BY m[1]) FROM regexp_matches(pg_get_constraintdef(oid), '''([a-z]{2})''', 'g') AS m), '-') FROM pg_constraint WHERE conname IN ('privacy_notice_version_locale_check', 'website_booking_request_locale_check') ORDER BY conname;
  ```
  **Đúng là** `…|en,ko,ru,vi,zh` cho cả hai. Câu này bắt thêm trường hợp mất `en`/`vi`/`ru`. `website_booking_request_price_estimate_check` vẫn đếm riêng.

### G7 của runbook (ARC xác nhận một lần) – băm drizzle

**Xác nhận.** `drizzle-orm` 0.45.4 (bản trong `pnpm-lock.yaml` của nhánh), `migrator.js` `readMigrationFiles`: đọc `<tag>.sql` bằng `readFileSync(...).toString()` rồi `createHash("sha256").update(query)`. Như vậy `drizzle.__drizzle_migrations.hash` = sha256 của nội dung tệp SQL (UTF-8), trùng với `shasum -a 256` của tệp. K2 dòng 3 so thẳng với `HASH_0092` (`b1f16b35…2b41`), không cần bước quy đổi. OPS điền "ARC xác nhận 04/11" vào 0.1.

### Ghi nhận khác khi đọc (không chặn)
- `CHKV` đạt: so **giá trị** của ba nguồn, regex neo cả dòng. Nếu prettier đổi định dạng dòng hằng/`VERSION` thì in `?` → `KHONG`, tức dừng (fail-closed). Gọi ở 0.2, P4 (trước push tag) và P10 bước 0 là đủ ba thời điểm cần.
- Đường phụ 1.2 (v1.0.4 lên trước): `CHKV` lấy `RA` = tag v1.0.4 là đúng. Hằng Chat đi cùng mã, không cần bước riêng.
- Q1 (SEC) ARC không trả lời thay. Về khả thi kỹ thuật: bảng P0 có đủ bước kiểm trong runbook cho từng ô D1–D7. D3 phần P3/P4 là xác nhận của người, không có lệnh kiểm. Việc này thuộc quyền SEC chấp nhận.

## 4. Giả định
- Đầu PR `lp-v2-main` → `main` vẫn là `4fe85e19`, hoặc thêm commit chỉ gồm tài liệu G4. Vì vậy các thẻ Deferred **không** sửa trên nhánh lúc này (tránh G1/G2 phải chạy lại).
- Thẻ ARC tự ghi trong biên bản được trả lời ở đây cùng các thẻ khác của nhánh, vì cùng đối tượng `lp-v2-main`.

## 5. Dòng decision-log đề xuất (ORC ghi)

| 2026-11-04 | 4 | **ARC – G3/G4/T1 của QC cổng gộp `lp-v2-main`**: (G3) xem `2760744b` + `4fe85e19`: ĐẠT, 0 thẻ, không đổi OpenAPI (`reviews/ARC-on-lp-v2-main-be-fixes.md`); (G4) `responses/ARC-on-lp-v2-main.md`: 12 thẻ LPV2M (SEC 5, BE 3, FE-B 2, ARC 2) – Major 2/2 Done; Deferred v1.0.4: SEC-05 phần `assertLocalDate` (BE), BE-02 (BE-C P4-11), ARC-01 (FE-A/BE); Rejected BE-03 (lệch D27 có chủ đích, ghi chú rbac 45); (T1) runbook r1.1 ĐẠT CÓ ĐK: Q2 giữ "quay landing trước khi lùi app" + bổ sung mốc 7 ngày → quá mốc dùng `LANDING_PUBLIC_API=off` giữ landing LP-v2 (OPS r2); Q3 `LIKE` đủ, không so nguyên văn; G7 băm drizzle = sha256 tệp SQL (drizzle-orm 0.45.4) | ARC | Quyền ARC (review kỹ thuật, quy trình quay lui phần kỹ thuật) |
