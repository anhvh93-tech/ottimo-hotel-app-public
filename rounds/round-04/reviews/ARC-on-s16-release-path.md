# ARC – Đường phát hành v1.0.4 sau ô lệch S16 (BUG-R4-053)

- Round 4 (v1.0.4), bước **Kiểm thử**, 05/11/2026. Viết sau diễn tập 5.0 trên staging (ORC chạy 14:52–15:04): S1–S15 đạt, S16 lệch (`online_checkin.notice_locale` = `en` trên trang ru).
- ARC đã đọc:
  - runbook `v1.0.4-release-runbook.md` (0.1, P0–P2b, K11, N1–N6, 5.0);
  - `v1.0.4-staging-today.md` (A–D, R5), `v1.0.4-staging-drill.md`, `outputs/MOB/v1.0.4-P4-42.md`;
  - `reviews/SEC-on-ru-notice-locale-drill.md`, QA lượt 2 mục 9–12, 14.6;
  - mã `guest-portal.service.ts`, test `guest-portal.test.ts`, migration 0051/0052 ở `0d11db20` và tag `v1.0.3`;
  - thời gian các job của `CI_RUN` 41944658911 và 5 lượt CI PR gần nhất (chỉ đọc `gh`).
- ARC không SSH, không chạy gì trên staging hay production, không duyệt deploy, không sửa mã của vai khác.

## 0. Kết luận: chọn **A – cắt lại v1.0.4 có bản sửa**

- **Production v1.0.4 vẫn giữ đích chiều 06/11.**
  - A thêm khoảng 1 giờ 30 – 2 giờ vào đường găng, xong trước khi QA giao báo cáo (06/11 13:45).
  - B không đưa v1.0.4 lên production sớm hơn A.
- **A cho giá trị đủ ngay ngày Release, chỉ cần một lượt production.**
  - A: check-in online mở lại được theo N4–N5 như runbook.
  - B: check-in online đóng tới khi v1.0.4.1 lên (SEC T1), cần thêm một lượt production đầy đủ. Runbook v1.0.4 chưa có tờ hotfix v1.0.4.x, và phải viết lại K11/N6 (SEC NL-03).
- **Không bỏ cổng nào:**
  - PR sửa qua ARC + SEC + QA review;
  - CI mới, unit không cache;
  - staging lên bản mới, S16 chạy lại, QA chạy RG-01 và RG-35;
  - QC rút gọn chạy trên bản mới.
- **Dự phòng:** tới **06/11 10:15** mà bản mới chưa lên staging với C1–C9 và S16' đạt, ORC chuyển sang B. SEC đã chấp nhận B kèm T1–T4.
- **Không có ESC.** Chọn đường kỹ thuật là quyền ARC, không phát sinh tiền, không dời mốc.

## 1. Căn cứ kỹ thuật

1. **Chỗ lỗi:** `guest-portal.service.ts:47` và `:491`. Test `test/integration/guest-portal.test.ts:563` đang khóa `ru → en`, theo quyết định (a) 17/10 (decision-log dòng 536). Dòng này giống hệt ở `v1.0.3`. Nó đúng khi trang ru còn hiện EN, và sai từ P4-42.
2. **Phạm vi bản sửa:** một tệp api cộng test. Không migration, không `db/schema`, không đổi hợp đồng: OpenAPI `updateOnlineCheckin` đã ghi server lưu "(+ `locale` phiên)", nên giữ 0.3.12.
3. **Quay lui v1.0.3 vẫn an toàn sau khi bản mới ghi `notice_locale = 'ru'`:**
   - cột kiểu `text`, không có CHECK (`0052_guest_portal_be_c.sql:48`);
   - v1.0.3 không đọc cột này: `git grep` ở tag `v1.0.3` chỉ ra chỗ ghi `:491`, schema và test;
   - `consent_record_locale_check` đã nhận `ru` (`0051:149`), và TAG12 đã ghi `ru` vào bảng đó.
4. **`main` sau cắt chỉ có tài liệu.** `git diff --name-only 0d11db20 origin/main -- product ':!product/docs' .github` rỗng. Cây `product/infra` vẫn là `afce70ad…`. Vì vậy commit gộp PR sửa chỉ thêm đúng bản sửa vào mã.
5. **PR sửa không được đụng `product/docs/api/`.** `openapi.yaml` là đầu vào sinh mã của `api-client` và `contracts`, nên đi vào image web. Phép kiểm A1 bỏ qua `product/docs`, nên không thấy thay đổi ở đó.
6. **Thời gian CI hôm nay:**
   - CI của PR: 17–21 phút;
   - CI push `main`, từ lúc chạy tới `publish images`: 27 phút (lượt 2, 00:55:48Z → 01:22:46Z);
   - job `deploy staging`: 48 giây.

## 2. So sánh

| | A – cắt lại | B – phát hành `0d11db20`, hotfix v1.0.4.1 |
|---|---|---|
| Bản lên production 06/11 | `SHA_V104b`, có bản sửa | `0d11db20`, lỗi còn, chặn bằng T1 (không N5) |
| Check-in online mở lại | Ngày Release, theo N4–N5 | Sau v1.0.4.1, sớm nhất 07/11 |
| Số lượt production | 1 | 2. Chạy P2–K11 hai lần, INV đồng ý hai lần, đóng băng `main` hai lần, Desk gián đoạn thêm 15–30 giây |
| Runbook | Chỉ đổi giá trị ở 0.1 và hằng trong tờ lệnh | Thêm K11 (e), N6a/N6b, `HOTFIX_AT` (SEC NL-03). Viết tờ v1.0.4.1, vì runbook v1.0.4 chưa có mục hotfix v1.0.4.x |
| Công thêm | Đường găng khoảng 2 giờ, khoảng 4 giờ công | Toàn bộ việc của A (cho v1.0.4.1), cộng: tờ hotfix + review khoảng 1 giờ 30, runbook r3 + review khoảng 1 giờ, QA + QC rút gọn lần 2 khoảng 2 giờ, production lần 2 khoảng 1 giờ 30 |
| Rủi ro còn lại | Bản mới lỗi trên staging: chuyển B lúc 06/11 10:15 | Lỡ T1–T2 thì có dòng sai. Theo SEC mục 5, chỉ sửa được bằng migration có audit |

## 3. Đường A: làm lại gì, giữ gì

### 3.1 Điều kiện giữ kết quả cũ (A1': OPS/ORC chạy, chỉ dùng git)

- `git diff --name-only 0d11db20 <SHA_V104b> -- product ':!product/docs' .github` chỉ ra tệp trong `product/services/api/src/modules/guest-portal/` và `product/services/api/test/`. Dự kiến 2 tệp.
- `git diff --name-only 0d11db20 <SHA_V104b> -- product/docs/api` rỗng.
- `git rev-parse <SHA_V104b>:product/infra` = `afce70adc393…`. Journal có 72 mục và đúng 1 dòng `0095`.
- Lệch bất kỳ ý nào thì **R5 của tờ staging áp đủ** (làm lại S0–S16), ARC xem lại.

### 3.2 Bảng 0.1 và biên bản cắt

| Mục | A | Lý do |
|---|---|---|
| `SHA_V104`, `TAG12`, `CI_RUN` | **Làm lại** | Commit mới, lượt CI mới |
| B4 digest api/web (cả landing) | **Làm lại** | Mọi image build lại. Digest web đổi dù guest-web không đổi. K1 production so với digest mới |
| P0: gitleaks và `publish images` của `CI_RUN` | **Làm lại** | Theo lượt CI mới |
| P0: unit không cache (BUG-R4-029) | **Làm lại** trên toàn repo, cùng cách ở dòng 0.1 (`turbo run test --force --continue`) | Đầu vào task `test` của `api` đã đổi. Mất khoảng 3 phút chạy, 10 phút dựng PG. **Đúng là:** 14/14, `Cached: 0`, bootstrap 11/11, `api` đạt hết, số ca không giảm |
| `N_V104` = 72, băm 4 migration, tên CHECK, PR-H/0095, 5 mẫu R3b, kind/topic, SQL chạy thử trên schema 72 | **Giữ** | Không có migration, không đổi mẫu thư. A1' xác nhận |
| P1 (31 tệp `product/infra`) | **Giữ** danh sách. Ngày Release vẫn chạy lệnh P1 với `SHA_V104b` | Cây `infra` không đổi |
| P2b | **Giữ** A3–A7 đã làm trên staging. Production vẫn đóng gói từ cây `afce70ad…` | Cùng cây, `.env` staging không đổi |
| Bản quay lui `sha-da6d6f3dc22b`, đồng hồ staging, compose | **Giữ** | Không liên quan |

### 3.3 Staging và diễn tập 5.0

| Phần | A | Lý do |
|---|---|---|
| A0 (SSH) | INV chỉ cho phép "trong hôm nay". Bước nào sang 06/11 thì ORC xin lại trong chat | decision-log 05/11 |
| A1 | **Làm lại**, thành A1' | Mục 3.1 |
| A2–A8 (P2b/P2c/P2d staging) | **Giữ** | Cùng cây `infra`. Staging lên tiếp từ TAG12, không lùi |
| B1–B6 | **Làm lại** với `S`, `CI_RUN` mới. Đổi hằng trong các lệnh B2–B6, C5, D5, D6 | Đóng băng `main` từ lúc gộp PR sửa tới khi `deploy staging` xong |
| C1–C9 (S0, K2–K7, K10, K11 (a), K6 smoke = RG-01) | **Làm lại**, khoảng 25 phút (C9 chạy ở T0' + 15) | Container mới. Số migration vẫn phải là 72/72 |
| S1–S11 (lùi, thứ tự, số đếm, băm, outbox, `ops-check`) | **Giữ** kết quả trên TAG12 | Cơ chế lùi/lên nằm ở gói `infra`, image v1.0.3 và DB 72, cả ba đều không đổi. Dữ liệu mới duy nhất là `notice_locale = 'ru'`, mà v1.0.3 không đọc (mục 1, ý 3). Chạy lại vòng lùi bây giờ còn **có hại**: giữ chỗ H1–H6 và RG-23 (b) của QA sẽ hết hạn dưới J1 v1.0.3 (R6, ARC P410-02) |
| S12, S14, S15 | **Giữ** | S12 không đi qua dòng sửa. S14 là script `infra`. S15 là hành vi của v1.0.3 |
| S13 | Gộp vào C4 (`AT_IN_LOG` từ T0') | Rẻ |
| **S16** | **Làm lại, gọi là RG-35**, trên một đơn thử **mới** chưa đọc thông báo (không dùng R-PV1). Chạy K11 (a); trên trang ru: đọc rồi đồng ý; chạy K11 (d) từ `up_at` của bản mới | **Đúng là:** `online_checkin` `privacy-2026-10-v2\|ru\|1`, `consent_record` `…\|ru\|guest_app\|1` (SEC T4). Với vi/en, test tích hợp là đủ (SEC T4) |
| QA lượt 2 | **Giữ**, chạy thêm RG-01, K11 (c), RG-35. QA ghi SHA mới (QA E7) | Chỉ ca ghi thông báo mới đi qua dòng sửa, và với vi/en kết quả không đổi |
| Dòng 5.0 của P0 ("ĐẠT trên đúng TAG12") | ARC + QC ghi decision-log: **5.0 ĐẠT ghép** = S1–S15 trên `sha-0d11db201343` + S0', S16' trên TAG12 mới | Cùng kiểu với quyết định bỏ 5.0b đã có ở runbook 5.0 |

**Khi nào duyệt deploy staging:** ORC + QA chọn một khoảng lặng.
- Không duyệt lúc SSE đang đo (HD-14, HD-27…31).
- Không duyệt trong khung 06/11 08:00–10:15 (RG-14, CO-05 a, RG-34).
- Staging lên tiếp từ TAG12, không lùi, nên giữ chỗ hết hạn vẫn chạy dưới J1 v1.0.4. Lúc đổi container, kết nối SSE bị ngắt: QA mở lại.

### 3.4 Ước lượng thời gian (đường găng)

| Bước | Thời gian |
|---|---|
| PR sửa + CI PR; ARC/SEC/QA review song song | 25–30 phút |
| Gộp, CI push tới `deploy staging: waiting`. Song song: A1', unit `--force`, 0.1 r3 | khoảng 30 phút |
| Duyệt staging + deploy | 5 phút |
| C1–C9, RG-01, K11 (c), S16'/RG-35 | 25–30 phút |
| Dòng quyết định ARC + QC | 10 phút |
| **Tổng** | **Khoảng 1 giờ 30 – 2 giờ**, chưa tính thời gian chờ khoảng lặng của QA |

## 4. Đường B (dự phòng)

- **Điều kiện:** SEC T1–T4 (`SEC-on-ru-notice-locale-drill.md` mục 2.1). ARC đã soát: câu K11 (e) và câu `locale_mismatch` của SEC dùng đúng tên cột của schema 72.
  - `0052`: `expires_at`, `revoked_at`;
  - `0051`: `registration_id`, `channel`, `notice_version`, `recorded_at`, `locale`.
- **Phần kỹ thuật của ô S16:** ARC chấp nhận lý do lệch. Lệch không thuộc cơ chế phát hành hay quay lui. Dòng sai bị chặn bằng T1: trang khách chỉ mở bằng link, và không có link mới.
- **Việc thêm so với A:**
  - runbook r3 theo SEC NL-03;
  - tờ lệnh v1.0.4.1, theo khuôn `bug-r4-037-hotfix-path.md` mục 3.4. Bản quay lui gần nhất là `sha-0d11db201343`;
  - QA + QC rút gọn lần 2;
  - production lần 2.
- v1.0.4.1 vẫn phải qua A1' và S16' như mục 3.

## 5. Việc theo thứ tự (đường A)

1. **BE** hoàn tất PR `v104/fix-ru-notice-locale` theo SEC mục 4:
   - danh sách ngôn ngữ theo từng phiên bản thông báo;
   - test (a)–(d) thay test ở `:563`;
   - sửa chú thích ở `:489–490`.
   Chỉ đụng tệp trong phạm vi mục 3.1.
2. **ARC + SEC + QA** review PR, song song với CI của PR. ARC kiểm phạm vi và chạy A1' trên head PR.
3. **ORC** push các commit tài liệu đang ở local **trước**, rồi gộp PR (`--match-head-commit`). Đóng băng `main` từ lúc gộp tới khi `deploy staging` xong.
4. **OPS**, song song với CI push: chạy A1', chạy unit `--force` trên worktree `SHA_V104b`, viết bảng 0.1 r3, đổi hằng trong tờ lệnh staging. Chỉ commit local.
5. **ORC** chạy B3–B6 với `CI_RUN` mới, duyệt **chỉ** env `staging`, vào khoảng lặng của QA.
6. Kiểm sau deploy:
   - **ORC:** C1–C9;
   - **QA:** RG-01, K11 (c);
   - **ORC + QA:** S16' (RG-35).
   Ghi kết quả vào biên bản 5.0, mục mới "Bổ sung trên TAG12 mới".
7. Ghi quyết định:
   - **ARC + QC:** dòng decision-log "5.0 ĐẠT ghép";
   - **SEC:** đóng FB-R4-SEC-BE-RU-NL-01;
   - runbook N1–N6 giữ nguyên, tính từ `RELEASE_AT`. Với A, SEC NL-03 chỉ còn K11 (e), nếu SEC muốn giữ làm kiểm thêm trước N3.
8. QA giao báo cáo → QC rút gọn trên `SHA_V104b` → production theo runbook.
9. Sau production, ngoài lúc đóng băng:
   - ARC sửa `erd.md` (mô tả `notice_locale`) và mô tả OpenAPI ở 0.3.13;
   - v1.0.5 làm danh sách ngôn ngữ dùng chung (SEC mục 4, ý 6).

**Mốc chuyển sang B: 06/11 10:15.**

## 6. Thẻ feedback

### FB-R4-ARC-BE-S16-01
- Mức độ: Major
- Vị trí: PR `v104/fix-ru-notice-locale`
- Vấn đề: chỉ giữ được S1–S15 khi bản sửa nằm đúng phạm vi mục 3.1.
- Vì sao quan trọng: một tệp ngoài phạm vi làm A1' sai và buộc chạy lại cả 5.0. Nguy nhất là `product/docs/api/openapi.yaml`, đầu vào của `api-client`.
- Đề xuất sửa:
  - chỉ đụng `src/modules/guest-portal/**` và test;
  - không migration, không module `registration`, không `docs/api`;
  - mô tả PR ghi lệnh A1' và kết quả.
- Trạng thái: Open

### FB-R4-ARC-OPS-S16-02
- Mức độ: Major
- Vị trí: runbook 0.1; tờ `v1.0.4-staging-today.md` mục 0, B2–B6, C5, D5, D6, R5
- Vấn đề:
  - `SHA_V104`, `CI_RUN`, `TAG12` ghi cứng trong lệnh;
  - A1 chưa kiểm `product/docs/api`;
  - R5 ghi "làm lại S0–S16" cho mọi lần cắt lại.
- Vì sao quan trọng: lệnh duyệt B6 tự chặn khi sai SHA, nhưng C5, D5, D6 và S14 vẫn chạy được trên bản cũ.
- Đề xuất sửa:
  - viết 0.1 r3 theo bảng 3.2;
  - đổi hằng;
  - thêm ý `product/docs/api` vào A1';
  - R5 trỏ tới tệp này.
- Trạng thái: Open

### FB-R4-ARC-BE-S16-03
- Mức độ: Suggestion (v1.0.5)
- Vị trí: danh sách ngôn ngữ trong `guest-portal.service.ts`; `LEGAL_KEYS`/`legalLocale` trong `apps/guest-web/src/app/i18n.tsx`
- Vấn đề: hai danh sách ở hai nơi, và đã lệch nhau một lần (chính là lỗi này).
- Đề xuất sửa: đồng ý với SEC mục 4, ý 6. Sinh danh sách từ `gen_strings.py` và thêm test hợp đồng giữa hai bên.
- Trạng thái: Open

## 7. Giả định

1. PR của BE chỉ đụng tệp trong phạm vi mục 3.1, và làm theo quy tắc SEC mục 4.
2. Thời gian CI giống hôm nay. Có một khoảng lặng QA trước 06/11 08:00.
3. Quyền SSH INV cho hôm 05/11 chỉ có hiệu lực trong ngày. Bước nào sang 06/11 thì ORC xin lại.

Điểm nên giữ:
- Biên bản và bug list ghi đúng nguyên nhân tới số dòng.
- SEC đã làm sẵn đường B có điều kiện, nên phương án dự phòng không phải chờ ai.
