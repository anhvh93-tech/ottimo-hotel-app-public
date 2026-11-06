# ARC đọc lại PR #129 r4 (OPS: runbook v1.0.5 r4, README 11.1, CODEOWNERS)

- Round 5 (v1.0.5), bước **Review** (đọc lại sau sửa). Người review: ARC. Ngày 07/11/2026.
- Lần trước: `rounds/round-05/reviews/ARC-on-ops-prs-126-129.md` @ `3861ccc4` (DUYỆT CÓ ĐIỀU KIỆN, thẻ OPS-129-01, 129-02, 126-01).

| PR | Nhánh | SHA đã review | Commit mới so với `3861ccc4` |
|---|---|---|---|
| #129 | `r5-ops-runbook-r3` | **`c394ea45`** | `baa32dd5` (r4), `246a6db2` (gộp `main`, không rebase), `c394ea45` (một câu chữ ngoài khối ghim). Phần của PR: runbook, `product/infra/server/README.md`, `.github/CODEOWNERS`, báo cáo và phản hồi OPS. Phần còn lại của `git diff 3861ccc4..c394ea45` là `main` gộp vào |

**Đã đọc:**
- `git diff 3861ccc4..c394ea45` của 5 tệp PR, thân PR, `OPS-responses.md` dòng 16–18;
- `SEC-on-pr-96-v5-25.md` mục 4.2 (khối trích, dòng đầu `cd` vào repo, dòng cuối `cd "$W"`);
- mã trên `main`:
  - `identity/internal/users.service.ts` (`setRoles`);
  - `audit/public/audit.service.ts`, `audit-fields.ts`, `audit/internal/audit-log.controller.ts`;
  - `folio/public/folio.service.ts` (`syncStay`, `syncCommission`, `voidCommissions`, `payeeTypeOf`), `commission-rate.ts`;
  - `sales/internal/quote-pricing.ts`, `quotes.service.ts`, `reservations/internal/sales-port.adapter.ts`, `reservations.service.ts` (đọc tỷ lệ chụp), `pricing.service.ts` (`snapshot`);
  - `platform/public/parameter.service.ts` (`get`, `set`), `property-context.ts`;
- migration 0000, 0001, 0011, 0013, 0079 (cột, khóa, CHECK, RLS, quyền).

**Đã chạy:**
- **P2c bước 2:**
  - khối SEC 4.2 nguyên văn, rồi bước 2 bản r3 và bản r4, cùng một tiến trình shell, bằng `zsh` và `bash`;
  - 5 ca lỗi của bản r4.
- **CODEOWNERS:**
  - `git merge-tree` của `main` + #126 (head `695a739c`) + #129, cả hai thứ tự;
  - API `codeowners/errors` của GitHub trên nhánh PR và `main`.
- **K13:**
  - SHA-256 câu `v530-check` và khối `v530-run` trích từ runbook @ `c394ea45`;
  - một câu `jsonb` trên Postgres 17 (`postgres:17-alpine@sha256:b0f9560a…2b24`, `--network none`, container đã xóa).

## 0. Kết luận

**#129 @ `c394ea45`: DUYỆT CÓ ĐIỀU KIỆN.**

- **Ba thẻ cũ của ARC: Done, ARC đã kiểm, đóng** (mục 1). Phần P2c, tức bước chạy lúc cắt `SHA_V105` và ngay trước P3, **không còn điều kiện ARC**.
- **Điều kiện duy nhất** nằm ở câu K13, phần ARC soát thêm (mục 2). FB-R5-ARC-OPS-129-03 phải xong **trước khi SEC ghim lại K13**. Có hai cách xong:
  - OPS sửa câu (3);
  - hoặc DOM chọn giữ ngày tạo đơn, và runbook ghi giả định với hướng lệch "đếm thiếu".

  Mục đích: SEC chỉ ghim một lần.
- K13 vẫn ghi "chờ SEC ghim lại", và chỉ chạy sau khi DOM xác nhận và SEC ghim. Vì vậy, nếu ORC cần gộp #129 sớm, 129-03 cũng có thể đi bằng PR sau, miễn là trước lần ghim.
- CODEOWNERS là đường dẫn SEC, nên cổng (b) vẫn cần tệp `SEC-on-*.md` nêu `c394ea45`. Kết luận ARC không thay cho tệp đó.

Thẻ mới:
- **0 Blocker · 0 Major · 1 Minor · 3 Suggestion**.
  - Minor: OPS-129-03.
  - Suggestion: OPS-129-04, OPS-129-05, BE-V530-01.
- ESC mới: không.

| Thẻ | Trạng thái | Bằng chứng |
|---|---|---|
| FB-R5-ARC-OPS-129-01 (Minor) | **Đóng** | Mục 1.1 |
| FB-R5-ARC-OPS-129-02 (Suggestion) | **Đóng** | Mục 1.2 |
| FB-R5-ARC-OPS-126-01 (Suggestion) | **Đóng** (có hiệu lực khi #129 gộp) | Mục 1.3 |

## 1. Ba thẻ cũ

### 1.1 OPS-129-01: P2c bước 2

Bản r4 dùng `git -C ~/Desktop/hotel-app` cho cả hai lệnh, không `cd`. Vì vậy `$W` của bước 1 vẫn dùng được ở bước 3. Khối SEC 4.2 mở đầu bằng `cd /Users/anhvh/Desktop/hotel-app`. Trên Mac của INV, `~` ra đúng thư mục đó: cả `zsh` và `bash` đều mở `~` ở đầu từ.

**Chạy lại khối SEC 4.2 rồi bước 2, cùng một tiến trình shell, thư mục chạy nằm ngoài repo.** Thay `⟨SHA_V525⟩ = 897ff46e`, `⟨SHA_V105⟩ = origin/main`:

| Bản | `zsh` | `bash` |
|---|---|---|
| Sau bước 1 | shell đứng ở `$W`; hai dòng `shasum` ra `f5db74ac…243f`, `60872413…41eb` | như `zsh` |
| r3 (`git` không `-C`) | `git diff` ngoài repo tự chuyển sang `--no-index`: in `warning:` + bảng `usage:` dài, rồi `BAN GHIM: KHAC`; hai lần `fatal: not a git repository` → `be64cdf4: THIEU`, `c7431973: THIEU` | như `zsh` |
| **r4** | **`BAN GHIM: TRUNG`, `be64cdf4: CO`, `c7431973: CO`**: đúng 3 dòng | như `zsh` |

Các ca lỗi của bản r4, để thử bảng "Đúng là" mới:

| Ca | Kết quả | Bảng "Đúng là" r4 đọc ra |
|---|---|---|
| Thư mục `-C` không có | 3 dòng `fatal: cannot change to …`, kèm `KHAC`, `THIEU`, `THIEU` | Có `fatal:`, không dùng được: **đúng** |
| Thư mục có nhưng không phải repo | Dòng 1 in bảng `usage:`, **không có `fatal:`**. Hai dòng `merge-base` có `fatal: not a git repository` | Vẫn bắt được: có `fatal:`, và lệch "đúng 3 dòng". **Đúng** |
| Gõ sai `SHA_V105` | `fatal: bad revision '…'`, `fatal: Not a valid object name …` | **Đúng** |
| Gõ sai `SHA_V525` | Chỉ dòng 1 có `fatal: bad revision`, còn `CO`, `CO` | Có `fatal:`, chạy lại bước 2: **đúng** |
| Gói thật thiếu #109 (`SHA_V105 = be64cdf4`) | `TRUNG`, `CO`, `THIEU`, không có `fatal:` | `THIEU` thật: **đúng** (dừng nếu `damage_catalog_rows_broken` khác 0) |
| Gói thật trước #96 (cha của `897ff46e`) | `KHAC`, `THIEU`, `THIEU`, không có `fatal:` | `KHAC` thật: dừng, báo SEC + BE. **Đúng** |

Kiểm thêm:
- Khối `v525-run` không đổi: trích bằng `awk` của SEC 4.2 từ runbook @ `c394ea45` vẫn ra `60872413…41eb`.
- Chỉ có một cặp dấu `# >>> v525-run` / `# <<< v525-run` (dòng 533, 538).
- P2 mục 8 vẫn trỏ "P2c bước 1–3, nguyên văn", nên tự nhận bản sửa.

Ghi chú, không thẻ:
- Hai ví dụ câu `fatal:` trong runbook là `ambiguous argument …` và `Not a valid commit name …`. Git 2.54 in `bad revision '…'` và `Not a valid object name …`.
- Luật r4 dựa vào tiền tố `fatal:` và "đúng 3 dòng", nên ví dụ lệch chữ không đổi cách đọc. OPS sửa ví dụ khi nào tiện cũng được.

### 1.2 OPS-129-02: README 11.1

| Ý của thẻ | README @ `c394ea45` | Đối chiếu mã, migration | Đúng? |
|---|---|---|---|
| Cấp vai như `setRoles` | `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_by, granted_at) … ON CONFLICT (user_id, property_id, role) DO UPDATE SET revoked_at = NULL, granted_by = EXCLUDED.granted_by, granted_at = EXCLUDED.granted_at` | Trùng từng cột với `users.service.ts` `setRoles`. Đích `ON CONFLICT` là khóa chính `user_property_role_pkey (user_id, property_id, role)` (0000) | Đúng |
| `granted_by` = người duyệt, không trống | Có, kèm lý do: lần sửa ngoài app không có dòng audit | Cột `granted_by uuid` cho phép NULL, nên ràng buộc phải nằm ở README. `setRoles` ghi id của OWN thực hiện | Đúng |
| `granted_at = now()`, kể cả khi cấp lại | Có, kèm lý do K13 (1) (`granted_at ≤ created_at`) | `granted_at` là `NOT NULL`, nên "rỗng" không xảy ra; rủi ro thật là để giá trị cũ khi cấp lại. `now()` trong một giao dịch là một thời điểm cho mọi câu, tốt cho script này | Đúng |
| Bước 4: vai trước, vai sau | Có, chỉ tên vai | – | Đúng |
| Vai DB, cách mở giao dịch | "ARC + SEC chốt trong lần review của chính script" | – | Đúng chỗ. Một rủi ro cần ghi: thẻ 129-05 |

**Hôm nay có dòng audit không?**
- **Không.** Sửa vai bằng SQL tay theo README hôm nay **không ghi dòng `audit_event` nào**.
- Chỉ `setRoles` trong app ghi, trong cùng giao dịch: `security` / `user.roles_changed`, `entity_type = 'app_user'`, before/after `roles`.
- README r4 nói đúng: Nhật ký bảo mật trên Desk không tự có dòng cho lần sửa tay.

**ARC xác nhận (README bước 4 chờ ý này): bảng cho phép script ghi dòng đó.** Bằng chứng:

| Điều kiện | Trên `main` |
|---|---|
| Quyền | `ottimo_app` có `SELECT, INSERT` trên `audit_event` và `USAGE` trên `audit_event_id_seq` (0001). Không có trigger nào trên `audit_event`. Không cần `UPDATE`/`DELETE` |
| Phân vùng | Phân vùng theo tháng, tạo sẵn 2026-10 tới 2027-12 (0001); J16 tạo các tháng sau; có phân vùng `DEFAULT`. Phân vùng con `REVOKE ALL` với `ottimo_app`. `INSERT` vào bảng cha vẫn được: Postgres chỉ kiểm quyền trên bảng cha khi chuyển dòng xuống phân vùng con. Đây cũng là cách app đang ghi |
| RLS | `FORCE ROW LEVEL SECURITY`. `WITH CHECK`: `organization_id = app_current_org()`, `property_id` trống hoặc bằng `app_current_property()`. Thiếu ngữ cảnh thì `INSERT` lỗi (thẻ 129-05) |
| Cột bắt buộc | `organization_id`, `occurred_at` (không có giá trị mặc định), `actor_type` (`user`/`guest`/`system`), `category`, `action` |

Khuôn dòng ARC đề xuất. Giống `setRoles`, để Desk đọc được như dòng của app:
- `category = 'security'`, `action = 'user.roles_changed'`, `entity_type = 'app_user'`, `entity_id` = id người được đổi vai;
- `before`, `after` = `{"roles":[{"propertyId": …, "role": …}]}`. Chỉ khóa `roles`, đúng danh sách `audit-fields.ts` cho `app_user`, không thêm trường khác;
- `reason` = mã sự cố, không có dữ liệu cá nhân, vì Desk hiện `reason`;
- `occurred_at = now()` của giao dịch;
- `property_id` = cơ sở, như `setRoles`;
- `actor_type = 'system'`, `actor_user_id` trống:
  - không ghi id của INV/OWN như thể người đó làm trong app;
  - người duyệt đã có ở `granted_by` và decision-log;
  - controller trả dòng `system` không kèm tên, và OWN xem được.

Script cụ thể vẫn qua ARC + SEC review như README ghi. Xác nhận này chỉ trả lời câu "bảng có cho ghi không". README không cần sửa vì ý này: lần review script dùng mục này.

### 1.3 OPS-126-01 và hai dòng SEC mới ở cuối CODEOWNERS

Ba dòng mới (dòng 72–80 @ `c394ea45`), cả ba `@anhvh93-tech`, mỗi dòng có chú thích nguồn:
- `/product/infra/server/test/postgres-log-terse.test.sh`, thẻ ARC 126-01;
- `/product/services/api/scripts/*.sh`, thẻ SEC 126-01;
- `/product/services/api/src/admin/`, thẻ SEC 126-01.

| Kiểm | Kết quả |
|---|---|
| Thứ tự (luật "mẫu khớp sau cùng thắng", dòng 20 của tệp) | Không mẫu nào **trước** các dòng mới khớp cùng tệp: không có mẫu rộng kiểu `/product/infra/server/` hay `/product/services/api/`. `scripts/*.sql` (từ #126) và `scripts/*.sh` không giao nhau. Không mẫu nào **sau** các dòng mới, vì chúng nằm cuối tệp. Không dòng nào thiếu chủ (dòng thiếu chủ sẽ xóa chủ của dòng trước). Đặt ở cuối không gây lỗi thứ tự |
| Đường dẫn có thật trên `main` | `postgres-log-terse.test.sh` có. `scripts/*.sh` khớp đúng 2 tệp (`mfa-operator-reset.sh`, `production-bootstrap.sh`); không khớp 6 tệp `.mjs`; `scripts/` không có thư mục con, mà `*` không qua `/`. `src/admin/` gồm 5 tệp, trong đó có `production-defaults.ts` (danh sách khóa INV tự nhập, SEC G3). Tệp này nên là đường dẫn SEC |
| Gộp chung với #126 | `#126` (head nay `695a739c`) thêm 7 dòng sau dòng 26 (`serializer.test.ts`). `git merge-tree`: `main`+#126+#129 và `main`+#129+#126 đều **sạch** và ra **cùng một cây**. Tệp gộp có 30 luật, thứ tự giữ đúng |
| Cú pháp | API `codeowners/errors` của GitHub: `{"errors":[]}` trên `r5-ops-runbook-r3` và trên `main` |

## 2. K13: soát cột và luật `syncCommission` (phần tùy chọn)

SHA trích từ runbook @ `c394ea45` trùng số OPS:
- câu `v530-check`: `c13c4d68…0d71`, 106 dòng, 7 245 byte;
- khối `v530-run`: `4f89c218…32ab`.

Mỗi khối chỉ có một cặp dấu: `-- >>> v530-check` dòng 674/779, `# >>> v530-run` dòng 787/792.

| Điểm | Mã trên `main` | Câu K13 r4 | Khớp? |
|---|---|---|---|
| Cột | `commission`: `rate_pct_snapshot numeric(5,2) NOT NULL`, `payee_type` (`agent`/`staff`), `status` (`projected`/`earned`/`payable`/`paid`/`void`), `lease_contract_id`, `reservation_id` (0000, 0011). `reservation`: `stay_type`, `parent_reservation_id`, `closer_user_id`, `quote_id`, `pricing_snapshot`, `status` (có `cancelled`, `no_show`) (0000, 0013). `folio_line`: `category`, `line_state` (`posted`/`pending_approval`/`rejected`), `reversal_of_id`, `amount_vnd` (0011). `config_parameter`, `property.timezone`, `user_property_role` (0000) | Dùng đúng tên và giá trị. OPS đã chạy trên DB đủ migration | Khớp |
| Người hưởng | `syncCommission`: vai hiện có (`revoked_at IS NULL`) tại cơ sở, `app_user.status = 'active'`. `payeeTypeOf`: `collaborator` → `agent`, `sales_staff` → `staff`. `commissionPctFor`: `agent` → khóa con `collaborator` | (3): `EXISTS` cùng điều kiện, vai `IN ('sales_staff','collaborator')`. (2): `agent` → `collaborator`, còn lại → `staff` | Khớp |
| Tỷ lệ chụp | `reservations.service.ts`: `snap.commissionRatePct ?? snap.quote?.commissionRatePct`, chỉ nhận số. Đơn từ báo giá mang bản chép báo giá ở khóa `quote` (`sales-port.adapter.ts`). Hiện không đường nào ghi `commissionRatePct` ở gốc (`PricingService.snapshot` không có khóa đó) | `CASE jsonb_typeof(…) = 'number'` cùng thứ tự | Khớp. Nhánh "ở gốc" hiện không dùng tới, giữ để an toàn |
| Đơn không có tỷ lệ chụp | `syncStay`: `today = localDate(now, tz)`, tức ngày lịch → `shortStayCommissionRate(…, today)`; `commission.created_at = now` | (2): `cm.created_at AT TIME ZONE p.timezone` | **Khớp đúng ngày**. Chỗ lệch OPS nêu cho (2) là đúng mã |
| Đơn có tỷ lệ báo giá | `quote-pricing.ts`: tỷ lệ đọc theo `property.now(tx).today` = **ngày kinh doanh** (`businessDate(now, tz, business_day_rollover)`, BR-010), ghi vào `pricing_snapshot.calculatedOn`. Bản chép báo giá chỉ ghi lúc `INSERT`, không `UPDATE` | (2), (3): `COALESCE(q.created_at, rv.created_at)` theo **ngày lịch** | Lệch từ 00:00 tới giờ chuyển ngày, chỉ theo hướng đếm thừa: thẻ 129-04 |
| Chọn hàng bảng | `params.get`: `effective_from ≤ asOf ORDER BY effective_from DESC LIMIT 1`. Khóa duy nhất `(property_id, key, effective_from)`. Hủy hàng đã hẹn ngày là `DELETE` (`parameters.service.ts`) | Cùng thứ tự; `GREATEST(…)` cho ngày trước hàng mới đầu tiên | Khớp. Không có hàng "đã hủy" nên không cần lọc |
| So tỷ lệ | `rate_pct_snapshot numeric(5,2)` so với số `jsonb` trong bảng | `to_jsonb(rate_pct_snapshot) IS DISTINCT FROM value -> sub_key` | ARC thử trên Postgres 17. Số nguyên so với cùng số có 2 chữ số lẻ: **bằng**. Số 1 chữ số lẻ so với dạng 2 chữ số lẻ: **bằng**. Thiếu khóa con: **lệch** (đếm thừa, an toàn, như runbook ghi). Bảng có hơn 2 chữ số lẻ: lệch (BE-V530-01 ý b) |
| Đơn hủy, không đến | `voidCommissions`: dòng `projected`/`earned` → `void`, **không xóa** | (3) không đọc dòng hoa hồng; đơn không qua báo giá dùng ngày tạo đơn | **Lệch theo hướng đếm thiếu**: thẻ 129-03 |
| Phí giữ lại | `cancellation_fee`/`no_show_fee`, `posted`, dòng đảo trỏ `reversal_of_id` | `posted`, `reversal_of_id IS NULL`, chưa bị đảo, `amount_vnd > 0` | Khớp |

Nếu câu đổi theo 129-03 hoặc 129-04, SHA đổi theo. Khi đó SEC chỉ ghim bản cuối.

## 3. Thẻ mới

### FB-R5-ARC-OPS-129-03
- Mức độ: Minor. Xong trước khi SEC ghim lại K13, không phải điều kiện của P2c hay cắt `SHA_V105`.
- Vị trí: `rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md` @ `c394ea45`:
  - K13 câu (3), nhánh `ELSE rv.created_at` của `CASE` ngày chụp (dòng 95–98 của khối `v530-check`);
  - đoạn "Ngày chụp tỷ lệ", câu cuối gạch thứ 3: "Dòng `closer_bookings_cancelled_or_no_show` không dựa vào dòng hoa hồng, nên ca này dùng ngày tạo đơn".
- Vấn đề:
  - Câu (2) đã đổi sang ngày tạo dòng hoa hồng, vì đơn không qua báo giá lấy tỷ lệ của ngày `syncCommission` tạo dòng. Câu (3) vẫn dùng ngày tạo đơn.
  - Đơn hủy hoặc không đến **vẫn còn** dòng hoa hồng: `voidCommissions` chuyển dòng sang `void`, không xóa. Dòng tạo sau cùng mang đúng ngày lấy tỷ lệ.
  - Lấy chính ví dụ của OPS: giữ chỗ 31/10, xác nhận 02/11 (dòng hoa hồng mang tỷ lệ của 02/11), rồi hủy có phí giữ lại. Câu (3) bỏ đơn này, vì ngày tạo đơn là 31/10.
- Vì sao quan trọng:
  - Dòng (3) là số đơn INV phải tự tính hoa hồng trên tiền giữ lại (BR-903 (2), ESC-051 câu 1 A; Desk chưa tính).
  - Đếm thiếu là hướng không an toàn: ra `= 0` khi thật ra `> 0` thì OWN có thể không đi tìm đơn trên Desk ở kỳ chi 01/12.
- Đề xuất sửa:
  - Ở câu (3), nhánh không có tỷ lệ chụp dùng `COALESCE((SELECT max(c.created_at) FROM commission c WHERE c.reservation_id = rv.id AND c.property_id = rv.property_id AND c.lease_contract_id IS NULL), rv.created_at)`, đổi sang giờ cơ sở như các nhánh khác.
    - Lấy mọi trạng thái, kể cả `void`.
    - Đơn chưa từng có dòng (ví dụ giữ chỗ bị hủy) thì dùng ngày tạo đơn.
  - Sửa câu chữ "Ngày chụp tỷ lệ" cho khớp.
  - DOM xác nhận cùng lúc với chỗ lệch của câu (2). DOM chọn giữ ngày tạo đơn thì ghi thành giả định ở mục 8, nói rõ hướng lệch là đếm thiếu.
- Trạng thái: Open

### FB-R5-ARC-OPS-129-04
- Mức độ: Suggestion
- Vị trí: runbook @ `c394ea45`, K13 câu (2) (dòng 47–50 của khối) và câu (3) (dòng 95–98): nhánh `pricing_snapshot.quote.commissionRatePct` lấy `COALESCE(q.created_at, rv.created_at)` theo ngày lịch.
- Vấn đề:
  - Báo giá đọc bảng tỷ lệ theo **ngày kinh doanh** (`quote-pricing.ts` dòng 225 và 470: `property.now(tx).today`, có `business_day_rollover`, BR-010).
  - Báo giá ghi chính ngày đó vào bản chép: `calculatedOn` (dòng 546), có từ round 2. Khi đổi báo giá thành đơn, bản chép nằm ở `reservation.pricing_snapshot -> 'quote'`.
  - Câu K13 dùng ngày lịch của `created_at`. Hai ngày khác nhau với báo giá tạo từ 00:00 tới giờ chuyển ngày.
- Vì sao quan trọng:
  - Chỉ đếm thừa, vì ngày kinh doanh không bao giờ sau ngày lịch. Ví dụ: báo giá đêm 31/10 sang 01/11 mang tỷ lệ cũ là đúng luật, nhưng câu vẫn đếm vào (2) hoặc (3). Ngày bắt đầu của mỗi hàng mới cũng vậy.
  - Khung giờ hẹp, hướng an toàn, nên chỉ là Suggestion.
- Đề xuất sửa:
  - Nếu sửa 129-03 (câu đổi, SEC đằng nào cũng ghim lại) thì sửa luôn ý này: dùng `rv.pricing_snapshot -> 'quote' ->> 'calculatedOn'` khi có dạng `YYYY-MM-DD` (kiểm bằng biểu thức trước khi đổi sang `date`, để không có câu lỗi ép kiểu). Không có thì giữ như hiện tại.
  - Không sửa thì ghi vào giả định mục 8: "báo giá tạo từ 00:00 tới giờ chuyển ngày có thể bị đếm thừa".
- Trạng thái: Open

### FB-R5-ARC-OPS-129-05
- Mức độ: Suggestion
- Vị trí: `product/infra/server/README.md` mục 11.1, ý "Vai DB chạy script và cách mở giao dịch" (@ `c394ea45`)
- Vấn đề:
  - Năm bảng script đụng tới đều `FORCE ROW LEVEL SECURITY` theo `organization_id`: `user_property_role`, `app_user`, `user_session`, `mfa_login_challenge`, `audit_event` (0001, 0079).
  - Chạy bằng vai không BYPASSRLS mà thiếu ngữ cảnh thì `UPDATE`/`DELETE` đụng **0 dòng và không báo lỗi**. Chỉ `INSERT` lỗi ở `WITH CHECK`. `coding-standards.md` mục 6 ("Migration dữ liệu và RLS") đã ghi đúng hiện tượng này với `ottimo_owner`.
  - Kết quả: script "chạy xong" mà `roles_version` không tăng, phiên không bị thu hồi. Đây đúng là hai lỗi README muốn chặn.
- Vì sao quan trọng: script một lần chạy trên production lúc có sự cố, ít người nhìn. Một câu báo "UPDATE 0" rất dễ bị bỏ qua.
- Đề xuất sửa:
  - Thêm một ý: câu đầu của giao dịch đặt ngữ cảnh như app (`set_config('app.organization_id', …, true)`, và `app.property_id` nếu ghi dòng audit; `coding-standards.md` mục 6 "Ngữ cảnh RLS").
  - Mỗi câu ghi kiểm số dòng: `app_user` đúng 1, `user_property_role` ít nhất 1. Lệch thì `RAISE` để cả giao dịch lùi. Số phiên bị thu hồi được phép bằng 0.
  - Làm ở lần sửa README sau, hoặc ngay trong script khi ARC + SEC review. Không chặn #129.
- Trạng thái: Open

### FB-R5-ARC-BE-V530-01
- Mức độ: Suggestion. Gửi BE (chủ V5-30) và DOM. Không chặn v1.0.5.
- Vị trí:
  - `product/services/api/src/modules/folio/public/folio.service.ts`, `syncStay` dòng 1966 (`today = localDate(now, tz)`) → `syncCommission` dòng 4009–4012;
  - so với `sales/internal/quote-pricing.ts` dòng 225, 470 (`property.now(tx).today`);
  - `syncCommission` dòng 4031–4038 (so `Number(c.rate_pct_snapshot) === desired.ratePct`);
  - khóa `short_stay_commission_pct` (0002: kiểu `json`, không có `value_schema`).
- Vấn đề:
  - (a) Từ 00:00 tới giờ chuyển ngày, báo giá lấy bảng tỷ lệ của hôm trước (ngày kinh doanh), còn đơn không qua báo giá lấy bảng của hôm nay (ngày lịch). ADR-008 nói "hôm nay" là ngày kinh doanh, đổi ngày lúc `business_day_rollover`.
  - (b) Bảng nhận số có hơn 2 chữ số lẻ, còn dòng lưu `numeric(5,2)` làm tròn. Khi đó phép so không bao giờ bằng:
    - mỗi lần đồng bộ, dòng cũ bị `void` (`resync`) và dòng mới được tạo, kèm dòng audit;
    - số tiền tính theo tỷ lệ chưa làm tròn, khác tỷ lệ in trên dòng.
- Vì sao quan trọng: cả hai ca đều hiếm. Nhưng K13 bám đúng luật của mã: đổi luật thì K13 đổi theo, và SEC phải ghim lại.
- Đề xuất sửa:
  - (a) DOM chọn một "hôm nay" cho tỷ lệ hoa hồng. ARC đề xuất ngày kinh doanh, như báo giá và ADR-008. Nếu đổi, BE chỉ đổi cho lần đọc bảng tỷ lệ trong `syncCommission`, không đổi `today` của cả `syncStay`.
  - (b) Kiểm khi lưu bảng: mỗi khóa con là số từ 0 tới 100, tối đa 2 chữ số lẻ.
  - PO xếp vào backlog sau v1.0.5.
- Trạng thái: Open

## 4. Điểm làm tốt

- **P2c bước 2:**
  - sửa đúng chỗ, không đụng khối ghim, nên SEC không phải ghim lại;
  - bảng "Đúng là" tách ca `fatal:` (chạy sai) khỏi ca `KHAC`/`THIEU` thật. ARC thử 6 ca: đọc đúng cả 6.
- **README 11.1:**
  - câu `INSERT … ON CONFLICT` trùng từng cột với `setRoles`;
  - lý do của `granted_by`/`granted_at` nối đúng vào K13 (1);
  - để vai DB và dòng audit cho lần review script, không đặt sẵn.
- **CODEOWNERS:**
  - đặt dòng mới ở cuối để không đụng hunk của #126: gộp sạch cả hai thứ tự;
  - chọn `scripts/*.sh` thay cho cả thư mục, có ghi lý do.
- **K13:** câu bám sát mã (thứ tự `??`, `payeeTypeOf`, cách chọn hàng `params.get`). Chỗ lệch của câu (2) được nêu thẳng cho DOM, có ví dụ.

## 5. Giả định

- G1: Khi ORC chạy P2c, `~` trên Mac là `/Users/anhvh`, trùng dòng đầu khối SEC 4.2.
- G2: `property.timezone` của `syncStay` và của câu K13 là cùng một cột `property.timezone`.
- G3: Phần ARC soát ở K13 là cột và luật lấy tỷ lệ. Định nghĩa đếm (nghiệp vụ) và cách 1/cách 2 thuộc DOM và SEC. ARC không chạy câu K13 trên dữ liệu; OPS đã chạy trên DB dùng một lần đủ migration.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **ARC – đọc lại PR #129 r4 @ c394ea45: DUYỆT CÓ ĐIỀU KIỆN** – 3 thẻ ARC Done, đã kiểm, đóng. OPS-129-01: P2c bước 2 dùng git -C ~/Desktop/hotel-app; ARC chạy khối SEC 4.2 rồi bước 2 bằng zsh và bash, r3 ra KHAC/THIEU/THIEU, r4 ra TRUNG/CO/CO; sai thư mục, thư mục không phải repo, sai SHA đều có dòng fatal hoặc lệch "đúng 3 dòng"; v525-run vẫn 60872413…41eb. OPS-129-02: README 11.1 cấp vai trùng setRoles (khóa chính user_id, property_id, role), vai trước/sau vào decision-log; hôm nay sửa vai bằng SQL tay không ghi audit_event; ARC xác nhận script ghi được một dòng security/user.roles_changed (actor_type system, before/after chỉ roles, reason = mã sự cố, cần ngữ cảnh RLS). OPS-126-01: test terse và 2 dòng SEC ở cuối CODEOWNERS không đè luật nào, gộp với #126 @ 695a739c sạch cả hai thứ tự, GitHub báo 0 lỗi. P2c không còn điều kiện ARC. K13: cột và luật syncCommission khớp mã, SHA c13c4d68…0d71 / 4f89c218…32ab trùng OPS. Điều kiện: OPS-129-03 (Minor) xong trước khi SEC ghim lại – câu (3) đơn không qua báo giá dùng ngày tạo đơn nên bỏ sót đơn xác nhận từ 01/11; dùng ngày dòng hoa hồng cuối, kể cả void; hoặc DOM chọn giữ và ghi giả định "đếm thiếu". Suggestion: OPS-129-04 (ngày báo giá = calculatedOn, ngày kinh doanh), OPS-129-05 (README: thiếu ngữ cảnh RLS thì UPDATE đụng 0 dòng không báo lỗi), BE-V530-01 (syncCommission dùng ngày lịch, báo giá dùng ngày kinh doanh; tỷ lệ hơn 2 chữ số lẻ). Không ESC | ARC | rounds/round-05/reviews/ARC-on-ops-pr-129-r4.md |`
