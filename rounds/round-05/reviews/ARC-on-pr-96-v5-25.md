# ARC review PR #96 – V5-25 (luật lưu tham số có cấu trúc, đọc `min_stay` phòng thủ)

- Round 5 (v1.0.5), bước Review. Người review: ARC. Ngày 06/11/2026.
- PR: https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/96, nhánh `r5-v5-25`, commit `e0bdb3b8`, CI xanh (9 job), `mergeStateStatus` CLEAN.
- Đã đọc: thân PR (mục 1–6), `gh pr diff 96` (13 file, +1 870/−56), hợp đồng 0.3.13 mục 1.24 (`origin/r5-contract-0313` @ `2cb549cc`), DOM `rules-v1.0.5.md` 8.4 và 12.1–12.7 (`main`), `openapi.yaml` (`setParameter`, `cancelScheduledParameter`, bảng mã trường), `erd.md` 9.1a, `parameters.service.ts`, `production-defaults.ts`, catalogue `0002`/`0003`/`0016`.
- Đã chạy (worktree tách rời ở scratchpad, Postgres 17 tạm trong Docker với mật khẩu CI-only của `ci.yml`, không chạm staging/production):
  - unit `v5-25-parameter-shapes.test.ts` + `be-b-units.test.ts`: 398/398 qua;
  - integration `v5-25-parameter-save.test.ts`: 11/11 qua;
  - câu SQL bằng đúng lệnh production (`PGOPTIONS … role=ottimo_readonly`): chạy được, chỉ in 3 cột, kết thúc `ROLLBACK`;
  - cùng câu SQL với role `ottimo_app` (không BYPASSRLS): **0 dòng, không báo lỗi** (thẻ 02);
  - kiểm đột biến của ARC: 5/5 đột biến phía TypeScript bị test bắt; 2/4 đột biến phía SQL bị bắt, 2 đột biến còn sống đều làm câu SQL **chặt hơn** (thẻ 04);
  - gộp thử trong bộ nhớ với `r5-contract-0313`, `r5-ops`, `r5-ops-runbooks`: không xung đột.
- **Lượt 2 (07/11):** #96 @ `897ff46e` **DUYỆT**; PR xếp chồng #109 @ `f2e6733d` **DUYỆT**. ĐK-1 đã xong, ĐK-2 cập nhật ở mục 12.6. Chi tiết ở mục 12.

## Kết luận: **DUYỆT CÓ ĐIỀU KIỆN**

Mã đúng luật DOM 8.4, 12.1–12.3 và hợp đồng 1.24. Không đổi schema OpenAPI. Test tốt, có kiểm đột biến. Được gộp vào `main` khi các bước còn lại của round cho phép. Điều kiện không chặn việc gộp, chỉ chặn bước chạy câu SQL trên production và deploy `SHA_V105`:

- **ĐK-1:** BE sửa thẻ 02 và 03 (commit thêm trên `r5-v5-25` trước khi gộp, hoặc PR nhỏ sau đó) **trước khi** ORC chạy câu SQL trên production.
- **ĐK-2:** câu SQL là **bước kiểm trước deploy** v1.0.5, chạy ngay trước khi đổi sang `SHA_V105`.
  - Có dòng `min_stay` hoặc `weekend_nights` với `ok = false` thì dừng deploy, sửa giá trị rồi mới lên. Lý do ở mục 4.
  - Khóa khác `ok = false` thì vẫn deploy được, sửa qua Desk sau. DOM đã quyết "bỏ qua hay chặn" ở rules mục 13.2.
  - Nếu BE kịp làm đọc phòng thủ cho nhóm bán (thẻ DOM FB-R5-DOM-BE-PR96-03) thì `special_dates`, `*_uplift_channels`, `los_discount` có `ok = false` cũng dừng deploy. Khi đó đường đọc chặt như đường lưu, giống `min_stay`.
  - Hai dòng đếm DOM thêm (FB-R5-DOM-BE-PR96-02) khác 0 cũng dừng deploy và chờ DOM.
- **ĐK-3:** dòng mô tả `setParameter`, chữ 1.24 và erd 9.1a đi theo PR #94 (danh sách ở mục 7). Không push vào `r5-v5-25`.

Không có Blocker, không có Major.

## 1. Kiểm hai chiều `min_stay` ↔ `short_stay_max_nights` – ARC chốt cách của BE

**Chốt:** giữ đúng cách BE đã làm. Dòng mới của khóa A, hiệu lực từ `s` tới dòng kế tiếp của chính khóa A (`e`, không có thì vô hạn), được so với **mọi dòng của khóa B có hiệu lực trong [s, e)**: dòng B đang hiệu lực ở `s` và các dòng B đã hẹn ngày trong khoảng đó.

Lý do: luật cần là "mọi ngày hai khóa cùng hiệu lực thì `nights` lớn nhất ≤ `short_stay_max_nights`". Cách của BE kiểm đúng các cặp dòng cùng hiệu lực ở ít nhất một ngày, không thừa, không thiếu. Nó không "chặt hơn" luật, nó là luật viết cho đủ.

- **"Giá trị hiệu lực ở `effectiveFrom`" (DOM 12.1 viết "đang hiệu lực ngày lưu") lỏng quá.** Bỏ sót dòng B đã hẹn ngày nằm trong [s, e).
  - Ví dụ ở test integration: `short_stay_max_nights` 4 hẹn từ 20/11, sau đó lưu `min_stay` 5 đêm từ 10/11. Kiểm ở 10/11 thì thấy 27 và cho qua. Từ 20/11 hai khóa lệch, không ai biết.
- **Chữ hiện tại của 1.24 ("hiệu lực ở `effectiveFrom` hoặc đã lên lịch sau") chặt quá.** Nó so cả dòng B nằm sau `e`, lúc dòng mới đã bị dòng A kế tiếp thay.
  - Ví dụ ở unit test (ca `replaced`): `min_stay` 5 đêm từ 10/11, `min_stay` 2 đêm đã hẹn 20/11, `short_stay_max_nights` 4 hẹn 01/12. Ca này phải cho lưu, và BE cho lưu.
- **`extras` theo khoảng:**
  - lưu `min_stay` → `max` = min(7, `short_stay_max_nights` nhỏ nhất trong khoảng);
  - lưu `short_stay_max_nights` → `min` = `nights` nguyên lớn nhất của các dòng `min_stay` trong khoảng.
  - Giá trị khóa kia hỏng (không phải số nguyên, `min_stay` không phải mảng) thì không tính, đúng ý DOM 12.3: dữ liệu hỏng không chặn khóa kia.
- **Sửa chữ:** 1.24 sửa theo cách trên ở PR #94 (mục 7, ý 2). DOM sửa câu "đang hiệu lực ngày lưu" ở 12.1 thành "trong thời gian dòng mới còn hiệu lực" khi tiện. Không đổi mã.

## 2. `cancel-scheduled` có cần kiểm lại không – không làm ở v1.0.5, làm chung ở 0.3.14

Đúng là có lỗ. Ví dụ:
1. Hẹn `min_stay` 1 đêm từ 01/12, rồi hẹn `short_stay_max_nights` 1 từ 01/12. Cả hai lần lưu đều hợp lệ.
2. Hủy lịch dòng `min_stay` 01/12.
3. Dòng `min_stay` 2 đêm cũ kéo dài qua 01/12, lệch với `short_stay_max_nights` 1.

Chiều ngược lại cũng vậy.

ARC **không** đòi kiểm lại khi hủy ở PR này, vì:
- **Chỉ lệch được khi `short_stay_max_nights` ≤ 6.** `nights` có trần 7, production đang 27–29 (BR-112). Hạ ranh giới ngắn ngày xuống dưới 7 đêm là đổi mô hình kinh doanh, không phải thao tác thường.
- **Hậu quả có giới hạn.** `readMinStay` dùng cùng trần min(7, `short_stay_max_nights`), nên luật lệch bị bỏ và có log cảnh báo (DOM 12.3). Không 500, chỉ mất ở tối thiểu ở các ngày lệch.
- **Câu SQL của PR bắt được trường hợp này.** Nó kiểm hai chiều theo khoảng hiệu lực.
- **Lỗ này có ở mọi cặp khóa từ 0.3.8**, không riêng V5-25:
  - các cặp giờ (`TIME_ORDER`);
  - `rate_floor_pct`/`rate_ceiling_pct`;
  - `hold_hours_options`/`hold_hours_default`.
  - Các cặp này còn chưa xét dòng đã hẹn ngày khi lưu. Sửa từng cặp một ở PR sửa lỗi P1 thì lệch cách làm. Sửa một lần cho cả nhóm thì đúng hơn.

Việc tiếp theo (thẻ 05, 0.3.14):
- `cancelScheduledParameter` của khóa có luật chéo chạy lại luật chéo cho dòng trước đó, trên khoảng vừa được giải phóng.
- Lệch → 422 `PARAM_OUT_OF_RANGE`, `errors[{field: "effectiveFrom", code: "VALUE_OUT_OF_RANGE"}]`, kèm `min`/`max` của khóa kia. Không thêm mã mới.
- `valuesDuringOwnRow` dùng cho mọi cặp chéo.

Tới lúc đó, mô tả hai operation ghi rõ "hủy lịch không kiểm lại luật chéo". DOM thêm một dòng vào từ điển tham số: "hủy lịch `min_stay` hoặc `short_stay_max_nights` thì xem lại khóa kia".

## 3. Dạng lỗi – đúng 1.24, không cần đổi schema OpenAPI

- **Mọi lỗi mới đi qua `fail()`:**
  - Problem `PARAM_OUT_OF_RANGE`, một phần tử `errors[{field, code}]` cho điểm sai đầu tiên.
  - `extras` có kiểu `{min?, max?, allowed?}`, không có tên `extras` mới.
- **`field` theo 1.24:** `value`, `value[i]`, `value[i].<khóa>`. Với khóa dạng đối tượng là `value.<khóa>`, ví dụ `value.refundPct`. Đây là cách viết tự nhiên của 1.24 cho đối tượng, chấp nhận.
- **Mã trường đều có trong bảng mã trường của `openapi.yaml`:**
  - `REQUIRED`, `TOO_LONG`, `DATE_INVALID`, `DATE_ORDER`, `DUPLICATE`, `NOT_IN_LIST`, `VALUE_OUT_OF_RANGE`, `NOT_ALLOWED`;
  - `VALIDATION_FAILED` làm mã trường theo 0.3.7 bổ sung 3.
  - Không có `Problem.code` mới. `contract.test.ts` và job "API contract" xanh.
- **Ba điểm phải ghi vào mô tả** (mục 7, ý 1). Không đổi schema:
  - Khóa `json` sai kiểu, ví dụ `min_stay = 2`, trả Problem `PARAM_OUT_OF_RANGE` với mã trường `VALIDATION_FAILED`. Không trả Problem `VALIDATION_FAILED` như câu "sai kiểu → 422 VALIDATION_FAILED" của tham số bảo mật. Khóa `int` (`short_stay_max_nights`) vẫn qua bộ kiểm kiểu cũ.
  - `DUPLICATE` dùng cả cho hai bậc giờ chồng nhau (`field` = `value[i]`). `VALUE_OUT_OF_RANGE` không kèm `min`/`max` khi `from` ≥ `to`.
  - Luật cũ dạng số vẫn trả `errors[{field: "value", code: "PARAM_OUT_OF_RANGE"}]`. Desk phải hiểu cả hai dạng; câu chung theo mã trường do UXD lo (BE đã nêu).

## 4. Bộ kiểm mới có chặn giá trị production đang giữ không – và câu SQL

### 4.1 Rủi ro thật nằm ở đâu

- **Bộ kiểm khi lưu không đụng giá trị đã lưu.** Nó chỉ từ chối lần lưu sau.
  - Giá trị production lệch luật mới thì đường đọc vẫn y như v1.0.4. Người sửa phải nhập giá trị đúng ở lần lưu tới.
  - Desk nhập khóa `json` bằng ô JSON thô (`ParamDialog.tsx`), nên production có thể giữ bất kỳ dạng nào bản cũ cho qua. Chỉ câu SQL trả lời được.
- **Ngoại lệ là `min_stay`.** Bộ đọc phòng thủ dùng **cùng** luật 12.1 (DOM 12.3: luật hỏng thì bỏ). Một luật v1.0.4 vẫn áp được nhưng sai 12.1 sẽ **mất tác dụng ngay khi deploy**, chỉ để lại một dòng log. Ví dụ:
  - có khóa thừa như `"note"`;
  - `channels: "direct"` dạng chuỗi (v1.0.4 so chuỗi con nên vẫn khớp);
  - `nights` 8.
  - Vì vậy có ĐK-2: dòng `min_stay` `ok = false` thì dừng deploy.
  - Giá trị ORC đọc 06/11 (DOM 12.4) hợp lệ, nên đây là bước xác nhận, không phải sửa trước.
  - Sửa trên v1.0.4 vẫn làm được: lưu giá trị đúng với Hiệu lực từ = ngày mai, như DOM 12.5.
- **`weekend_nights`** không có đọc phòng thủ mới. Bộ tính giá đọc mã thứ như cũ. Production `["FRI","SAT"]` hợp lệ.
- **Các biên [GIẢ ĐỊNH] dễ chạm giá trị thật nhất.** DOM chốt; ARC không thấy cái nào sai về kỹ thuật:
  - **`special_dates`, mỗi khoảng ≤ 31 đêm.** Nếu chủ đầu tư chọn một mùa cao điểm dài (BR-104 còn chờ bảng mùa), khoảng hè ba tháng sẽ bị từ chối. Tách thành nhiều khoảng ≤ 31 đêm thì vẫn đúng nghĩa, nên trần này chỉ tốn công nhập.
  - **`special_dates` có khóa lạ** như `pct` từng khoảng bị từ chối. Đúng, vì bộ tính giá bỏ qua khóa đó, lưu vào là sai lặng lẽ.
  - **`from` = `to`** (người nhập hiểu "gồm hai đầu") bị từ chối với `DATE_ORDER`. Đúng: ở dạng nửa mở, khoảng đó không khớp đêm nào.
  - **`weekend_uplift_channels`/`special_uplift_channels`** chỉ nhận một giá trị trong `all`/`direct`/`agent`/`ota`.
    - Chuỗi kiểu `"direct,agent"` hôm nay vẫn "chạy" nhờ so chuỗi con, nhưng không phải dạng nào trong BR. Production đang `all`.
    - Ghi chú phụ: JSDoc `ChannelScope` ở `pricing.ts` nói "hoặc danh sách", trong khi catalogue là `text`, nên danh sách không bao giờ lưu được (thẻ 06).
- **Giá trị mặc định ở catalogue** không nằm trong câu SQL. Trong 14 khóa chỉ `max_open_holds_per_user` có mặc định (`{"collaborator":3,"sales_staff":5}`) và nó hợp lệ. Bỏ qua được.

### 4.2 Logic câu SQL `v5-25-parameter-shape-check.sql`

**Đúng:**
- **Phạm vi dòng.** Dòng đang hiệu lực theo ngày kinh doanh BR-010 (giờ địa phương trừ `business_day_rollover`, vắng thì 06:00) và mọi dòng hẹn sau đó. Khoảng của mỗi dòng là `[s, e)` với `e = lead(effective_from)`.
- **Luật chéo theo khoảng.**
  - `cap`: `min_stay` gặp mọi `short_stay_max_nights` trong `[s2, e)`.
  - `need`: `short_stay_max_nights` gặp mọi `min_stay` trong `[s2, e)`.
  - `roll`: rollover tại `s2`.
  - Cả ba đúng với TypeScript (mục 1).
- **Không thể ném lỗi giữa chừng.** Mọi phép ép kiểu đều nằm trong `CASE WHEN jsonb_typeof … THEN` hoặc sau regex. Ngày được kiểm bằng `pg_input_is_valid`. Thiếu thì `NULL` rồi thành `false` qua `COALESCE`. Điều này cần vì SQL không bảo đảm thứ tự `AND`.
- **Chỉ đọc.** `BEGIN TRANSACTION READ ONLY` … `ROLLBACK` cộng `default_transaction_read_only=on`. Chỉ in `key`, `effective_from`, `ok`; không giá trị, không tên cơ sở, không cột khách.
- **Khớp TypeScript.** Test integration chạy câu SQL trên mọi ca dùng chung và so từng dòng. ARC kiểm thêm từng nhánh của 14 khóa: `ev`/`v` khớp `parameter-shapes.ts` (khóa lạ, bắt buộc, số nguyên, trùng bằng `count(DISTINCT jsonb)`, chồng bậc theo trục ngày kinh doanh).
  - Lệch không đáng kể: `name` ≤ 100 đo bằng `char_length` (code point), còn TypeScript đo `length` (UTF-16). Tên tiếng Việt dựng sẵn không bị ảnh hưởng.

**Thiếu (thẻ 02, 03):**
- **Chạy sai role thì in 0 dòng mà không báo lỗi.** ARC đã thử với `ottimo_app`. Kết quả rỗng trông giống "không có gì hỏng", trong khi đây là cổng trước deploy.
- **Lệnh trong thân PR không chạy được như viết.** Nó gọi `-f v5-25-parameter-shape-check.sql` "trong container postgres", nhưng file không có trong container.
- **Thân PR không nói cách đọc kết quả:** rỗng thì sao, `ok = false` ở khóa nào thì dừng.

## 5. Chất lượng test

**Tốt:**
- Oracle BR-113-06…30 phát lại theo id, so cả `field`, `code`, `extras`; `pendingFix` đã bỏ.
- Ca QA (a)–(f) chạy qua HTTP. Lần lưu bị từ chối không ghi dòng nào, có kiểm bằng `SELECT`.
- Có ca (d): chèn thẳng giá trị hỏng vào DB, cho cả báo giá, tạo đơn và giá ước tính web.
- Log được kiểm là không chứa giá trị và chỉ ghi một lần.
- Mọi giá trị production-defaults và DS-E đều qua bộ kiểm mới (plan V5-25 AC2).
- Một bộ ca dùng chung cho TypeScript và SQL, nên hai bên không lệch nhau được.

**Kiểm đột biến.** BE đã kiểm (d): trả giá trị thô như v1.0.4 thì hai test ra 500. ARC chạy lại và kiểm thêm:

| Đột biến | Kết quả |
|---|---|
| T1 `valuesDuringOwnRow` bỏ dòng đã hẹn ngày | bị bắt |
| T2 bỏ cận trên `< ownNext` | bị bắt (ca `replaced`) |
| T3 bỏ lớp chặn cuối trong `minStayNights` | bị bắt |
| T4 `readMinStay` trả giá trị thô | bị bắt (2 test) |
| T5 tắt kiểm ngược `short_stay_max_nights` | bị bắt (2 test) |
| S1 SQL `cap` bỏ cận trên của khoảng | bị bắt |
| S4 SQL bỏ "áp ít nhất một ngày" | bị bắt |
| S2 SQL `cap` bỏ cận dưới (tính cả dòng đã hết hiệu lực) | **sống** |
| S3 SQL `need` bỏ khoảng (tính mọi dòng `min_stay`) | **sống** |

S2 và S3 chỉ làm câu SQL báo `false` nhiều hơn: báo nhầm, không bỏ sót. Chấp nhận được với một câu kiểm chạy tay. Thêm một ca là bắt được (thẻ 04).

**Còn thiếu (thẻ 04):**
- Chiều `short_stay_max_nights` gặp dòng `min_stay` **đã hẹn ngày** mới có ở mức unit. Ở bước ba của test HTTP, dòng `min_stay` 10/11 đã hiệu lực tại 25/11, nên ca đó qua được cả khi bỏ nhánh đã hẹn ngày.
- Không có test hai lần lưu song song khác khóa (thẻ 05).

## 6. Thẻ phản hồi

### FB-R5-ARC-BE-02 – Minor – Câu SQL in 0 dòng khi chạy không có BYPASSRLS (ĐK-1)
- **Hiện trạng:** role `ottimo_app` (RLS, chưa đặt ngữ cảnh) → `(0 rows)`, `ROLLBACK`, không lỗi. ops-check có dòng guard (`current_user = 'ottimo_readonly'`, `rolbypassrls AND NOT rolsuper`); câu này không có.
- **Sửa:** sau `BEGIN TRANSACTION READ ONLY;`, thêm guard. Ví dụ:
  ```sql
  DO $$ BEGIN
    IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user)
       AND COALESCE(current_setting('app.property_id', true), '') = '' THEN
      RAISE EXCEPTION 'v5-25 check: run as ottimo_readonly (BYPASSRLS) – an RLS-filtered run prints nothing';
    END IF;
  END $$;
  ```
  - `DO` được phép trong giao dịch READ ONLY.
  - Nhánh `app.property_id` giữ cho test integration, vốn chạy bằng `ottimo_owner` có ngữ cảnh tenant.
- **Test:** thêm một ca chạy bằng `ottimo_app` không ngữ cảnh → lỗi có câu trên.

### FB-R5-ARC-BE-03 – Minor – Lệnh chạy và cách đọc kết quả (ĐK-1; OPS nhận phần sổ vận hành)
- **Lệnh:** sửa lệnh ở thân PR và đầu file SQL để chạy từ thư mục `product/` trên máy chủ, đưa file qua stdin. Ví dụ:
  ```sh
  docker compose --env-file .env -f infra/docker-compose.yml exec -T postgres sh -c \
    'PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly" psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' \
    < services/api/scripts/v5-25-parameter-shape-check.sql
  ```
  OPS chỉnh cho khớp cách gọi compose ở runbook v1.0.5.
- **Cách đọc:** thêm 3 dòng.
  - Phải có ít nhất các khóa `min_stay`, `weekend_nights`, `short_stay_max_nights` cho mỗi cơ sở. Rỗng là chạy sai.
  - `min_stay`/`weekend_nights` `ok = false` thì dừng deploy (ĐK-2).
  - Khóa khác `ok = false` thì ghi lại, sửa qua Desk sau deploy.
- **OPS:** đưa câu này vào runbook v1.0.5 thành bước kiểm trước khi đổi `SHA_V105`, kèm câu đọc kết quả ở trên. Chạy trên production là bước máy chủ, theo luật xin phép đã chốt ở review SEC/ARC của #95.
- **Tùy chọn:** thêm cột `property_id` (uuid, không phải dữ liệu khách). Có hai cơ sở thì mới biết dòng nào của cơ sở nào. Không bắt buộc ở v1.0.5 (một cơ sở).

### FB-R5-ARC-BE-04 – Suggestion – Hai ca test còn thiếu
- **Ca SQL:** `short_stay_max_nights` 4 từ D1, `min_stay` 2 đêm từ D1, `min_stay` 5 đêm từ D3, `short_stay_max_nights` 29 từ D2 < D3. Dòng 4 phải `ok = true`, vì dòng 5 đêm chỉ gặp dòng 29. Ca này giết S2/S3.
- **Ca HTTP:** lưu `short_stay_max_nights` 3 cho hôm nay khi dòng `min_stay` 5 đêm chỉ **đã hẹn ngày** (chưa hiệu lực) → 422 `min` 5.

### FB-R5-ARC-BE-05 – Suggestion (0.3.14, không làm ở PR này) – Luật chéo theo khoảng cho mọi cặp, kiểm lại khi hủy lịch
- **Phạm vi:** `valuesDuringOwnRow` dùng chung cho mọi cặp chéo: cặp giờ, sàn/trần giá, `hold_hours_*`, `min_stay`/`short_stay_max_nights`.
- **Hủy lịch:** `cancelScheduledParameter` chạy lại luật chéo cho dòng trước đó trên khoảng vừa giải phóng (dạng lỗi ở mục 2).
- **Song song:** hai lần lưu khác khóa của cùng cặp có thể cùng qua kiểm (write skew ở READ COMMITTED). Khóa bằng `pg_advisory_xact_lock` theo (cơ sở, nhóm cặp) khi lưu hoặc hủy một khóa có luật chéo.
- **Lý do không gấp:** rủi ro rất nhỏ (chỉ OWN/MGR sửa), đọc phòng thủ đã chặn 500.
- ARC đưa vào hợp đồng 0.3.14; PO xếp backlog cùng R5-B-05.

### FB-R5-ARC-BE-06 – Suggestion – Hai chỗ nhỏ
- **`other(key).catch(() => null)`** trong `valuesDuringOwnRow` và ở `late_checkout_tiers` nuốt mọi lỗi. Chỉ nên bắt `ParameterMissingError`. Trong giao dịch, lỗi DB khác vẫn lộ ở câu sau, nên không sai kết quả, chỉ khó đọc khi điều tra.
- **JSDoc `ChannelScope`** ở `pricing.ts` ("'all' or a list of channel groups") lệch với catalogue `text` và bộ kiểm mới. Sửa chữ khi chạm file lần sau.

## 7. Thêm vào danh sách việc của PR #94 (phiên ARC đang sửa hợp đồng 0.3.13 – ORC chuyển)

1. **Mô tả `setParameter`.** Thêm đoạn "0.3.13 bổ sung 1 – V5-25" và nhắc một dòng ở `cancelScheduledParameter`. Không đổi schema:
   - **Khóa có bộ kiểm dạng:**
     - `weekend_nights` (DOM 8.4) và `min_stay` (DOM 12.1);
     - 11 khóa: `special_dates`, `los_discount`, `cancel_policy_direct`, `early_checkin_tiers`, `late_checkout_tiers`, `early_departure_refund`, `checkout_reminders`, `weekend_uplift_channels`, `special_uplift_channels`, `max_open_holds_per_user`, `lease_terms` (phần báo giá đọc).
   - **Lỗi:** `422 PARAM_OUT_OF_RANGE`, `errors[0]` là điểm sai đầu tiên.
     - `field`: `value` / `value[i]` / `value[i].<khóa>` / `value.<khóa>`.
     - Mã trường trong bảng có sẵn: `REQUIRED`, `VALIDATION_FAILED` (sai kiểu), `VALUE_OUT_OF_RANGE`, `NOT_IN_LIST`, `DUPLICATE` (gồm hai bậc giờ chồng nhau), `NOT_ALLOWED` (khóa lạ), `DATE_INVALID`, `DATE_ORDER`, `TOO_LONG`.
     - `extras` chỉ `min`/`max`/`allowed`.
     - Khóa `json` sai kiểu cũng là `PARAM_OUT_OF_RANGE`; luật số cũ giữ `errors[].code = PARAM_OUT_OF_RANGE`.
   - **Luật chéo `min_stay` ↔ `short_stay_max_nights`:** so với mọi dòng của khóa kia có hiệu lực trong [`effectiveFrom`, dòng kế tiếp cùng khóa). `max` = min(7, `short_stay_max_nights` nhỏ nhất); `min` = `nights` lớn nhất.
   - **`cancelScheduledParameter`:** chưa kiểm lại luật chéo (0.3.14, thẻ 05).
   - **Đọc phòng thủ `min_stay`** ở báo giá, tạo đơn, giá ước tính web: không mảng → không luật; luật hỏng → bỏ, log một lần, không 500.
2. **Mục 1.24 của `contract-0.3.13.md`.** Thay "(hiệu lực ở `effectiveFrom` hoặc đã lên lịch sau)" bằng khoảng ở ý 1 (mục 1 review này). Thêm ý "hủy lịch không kiểm lại, 0.3.14".
3. **`erd.md` 9.1a.** Thay các gạch "Khóa dạng khác" của các khóa trên bằng một bảng theo khóa: dạng, biên, đánh dấu [GIẢ ĐỊNH – DOM chốt] như PR #96 mục 6. Sửa thêm:
   - "mốc … tăng dần không trùng" → "không trùng, thứ tự tùy ý". `cancel_policy_direct` production xếp giảm dần 7/3/0; bộ kiểm chỉ chặn trùng.
   - `early_departure_refund` là đối tượng `{minNoticeDays 0–365, refundPct 0–100}`, không phải danh sách.
   - Thêm `special_dates`, `checkout_reminders`, `*_uplift_channels` (`text`: `all`/`direct`/`agent`/`ota`), `max_open_holds_per_user`, `lease_terms` (chỉ phần báo giá đọc).
   - Dòng `weekend_nights` trỏ DOM 8.4, không phải "mục 11".
   - Ghi rõ các luật chéo 9.1a liệt kê nhưng **chưa có trong mã**: `long_stay_required_from_nights` > `short_stay_max_nights`, `long_stay_compare_from_nights` < `long_stay_required_from_nights`, `late_grace_until` ≤ mốc đầu `late_checkout_tiers`. Đánh dấu "R5-B-05" hoặc chuyển vào thẻ 05.
   - Các khóa R5-B-05 còn lại ghi "chưa có bộ kiểm dạng (R5-B-05)".

## 8. Thứ tự gộp

- #96 không chung file với #92, #93, #94, #95; gộp thử không xung đột.
- Gộp được bất cứ lúc nào sau các bước review còn lại của round, không phải chờ #94 (plan quyết định 19).
- Thứ tự đã chốt cho nhóm OPS/hợp đồng giữ nguyên: #92 → #93 → #94 → #95.
- Không có điểm SEC mới: log không chứa giá trị hay dữ liệu khách, câu SQL chỉ in 3 cột. SEC xem hay không là việc ORC quyết.

## 9. Liên quan review DOM (`DOM-on-pr-96-v5-25.md`, rules mục 13)

- **FB-R5-DOM-BE-PR96-01** (phần trăm tối đa 2 chữ số thập phân, `max_open_holds_per_user` đủ hai vai, `cancel_policy_direct` không rỗng): ARC đồng ý. Dạng lỗi giữ đúng mục 3:
  - quá 2 chữ số thập phân → `VALIDATION_FAILED` kèm `min: 0, max: 100`;
  - thiếu vai → `REQUIRED`, `field` = `value.<vai>`;
  - danh sách rỗng → `REQUIRED`, `field` = `value`.
  - Sửa cả câu SQL lẫn bộ ca dùng chung, để test so hai bên vẫn bắt lệch.
- **FB-R5-DOM-BE-PR96-02** (hai dòng đếm): làm cùng thẻ 02/03 của ARC.
  - Hai dòng đếm là các `SELECT` mới. Test hiện kiểm "đúng một `SELECT`, 3 cột", cần sửa theo.
  - Hai dòng chỉ in số. Guard của thẻ 02 đứng trước cả ba câu.
- ARC đọc phần chênh khi ORC báo SHA mới.

## 10. Mã lỗi chung cho tham số không dùng được (DOM 13.2) – ARC chốt

**v1.0.5 (hợp đồng 0.3.13): không thêm mã mới.**
- Đường bắt buộc ở v1.0.5 là bộ kiểm khi lưu cộng câu SQL. Hai việc này không cần mã lỗi mới.
- `early_departure_refund` hỏng dùng lại `409 PAYMENT_NOT_CONFIGURED`. Đây là mã `earlyDeparture` đang trả khi khóa null, đã khai ở mô tả `earlyDeparture`.
  - `detail` chỉ ghi tên khóa, ví dụ `early_departure_refund (BR-428) is not usable`. Không ghi giá trị.
- Các đường chặn khác ở 13.2 (`cancel_policy_direct` khi tạo hoặc hủy đơn, `max_open_holds_per_user`, bậc giờ khi cần) thuộc R5-B-05. Trước 0.3.14, BE **không** tự đặt mã cho chúng.

**0.3.14: thêm mã `PARAM_NOT_USABLE`** (ARC ghi vào danh sách 0.3.14):

| Mục | Chốt |
|---|---|
| HTTP | `409` (yêu cầu đúng, cấu hình của cơ sở làm thao tác không tính được; giống `PAYMENT_NOT_CONFIGURED`) |
| Nghĩa | Tham số cơ sở cần cho thao tác này đang **thiếu** hoặc **sai dạng**; không ghi gì |
| Trường mở rộng của `Problem` | `parameterKey` (string, tên khóa, ví dụ `cancel_policy_direct`) và `parameterState` (`missing` \| `invalid`) – không bao giờ có giá trị tham số |
| Không dùng | `PARAM_OUT_OF_RANGE` (riêng cho `setParameter`, 422 là lỗi của người gửi); `INTERNAL_ERROR` |
| Thứ tự | Sau 401/403 và kiểm thân lệnh; chỉ khi thao tác thật sự cần khóa đó (bậc giờ: chỉ khi nhận trước `checkin_time` hoặc trả sau `late_grace_until` – DOM 13.2) |
| Log | Một dòng cảnh báo mỗi giá trị như `readMinStay`: khóa, cơ sở, không giá trị, không dữ liệu khách |
| Operation khai thêm | `createReservation`, `createReservationGroup` kênh trực tiếp (`cancel_policy_direct`); `cancelReservation` khi cả bản chép trong đơn lẫn chính sách đang hiệu lực đều hỏng; `earlyDeparture` (`early_departure_refund` – chuyển từ `PAYMENT_NOT_CONFIGURED` cho cả `missing` lẫn `invalid`; `PAYMENT_NOT_CONFIGURED` từ đó chỉ còn cho tài khoản VietQR); `createHoldFromQuote`, `createReservation` giữ chỗ của SAL/CTV (`max_open_holds_per_user`); `previewCheckIn`, `checkIn`, `setLateCheckout`, `getCheckoutSummary`, `checkOut` (bậc giờ) – BE liệt kê đủ operationId lúc làm R5-B-05 |
| Desk | UXD viết hai câu theo `parameterState`; tên hiển thị lấy từ từ điển tham số theo `parameterKey`. Câu DOM đề xuất dùng cho `invalid` |

Đổi `earlyDeparture` từ `PAYMENT_NOT_CONFIGURED` sang mã mới phải đi cùng bản Desk của cùng phát hành. Không có giai đoạn Desk phải hiểu cả hai mã.

## 11. Giả định ARC dùng
- Production có một cơ sở.
- `short_stay_max_nights`: số đúng là 29 (DOM 13.3). Production hiện thấp hơn 29 vì chủ đầu tư chưa làm B5, nhưng vẫn ≥ 7 (DOM: trần `nights` vẫn là 7), nên kết luận mục 2 không đổi.
- Các biên [GIẢ ĐỊNH] ở thân PR mục 6 do DOM chốt, không cần chủ đầu tư.
- Không có ESC mới.

## 12. Lượt 2 (07/11) – PR #96 @ `897ff46e`, PR #109 @ `f2e6733d`

- **Đã đọc:**
  - phần chênh `e0bdb3b8..897ff46e` của #96 (10 tệp: câu SQL, `stay.service.ts`, `parameter-rules.ts`, `parameter-shapes.ts`, `min-stay-read.ts`, `pricing.ts`, ca dùng chung, ba tệp test);
  - toàn bộ #109 (`r5-v5-25-damage`, base `r5-v5-25`, 9 tệp, 3 commit; `2077c53a` là commit gộp #96 @ `897ff46e`);
  - mã gọi quanh hai chỗ đọc `damage_catalog` (`folio.controller.ts`, `bill.service.ts`, `folio-lines.service.ts`) và đường hủy, dời ngày đọc `pricing_snapshot.cancelPolicy` (`reservations.service.ts`);
  - DOM lượt 2 (`DOM-on-pr-96-v5-25.md` mục 5), SEC lượt 2 (`51793f0f`), quyết định ORC 07/11 trong `01-decisions/decision-log.md`.
- **CI:** cả hai HEAD 9 job xanh, 3 job bỏ qua (deploy, publish), kể cả `docker images build · E2E smoke`. `mergeStateStatus` CLEAN.
- **Ghim SQL:** ARC tự tính SHA-256 của `v5-25-parameter-shape-check.sql` ở cả hai nhánh: `f5db74ac17e7…a2243f`, 28 081 byte, trùng bản SEC ghim lại. #109 không đổi tệp này.
- **Không chạy lại test trên máy.** CI đã chạy integration trên Postgres 17. Image CI cùng digest với `docker-compose.prod.yml` (`postgres:17-alpine@sha256:b0f9…2b24`). ARC chỉ chạy một container tạm, không mật khẩu, không mở cổng, để thử `lower()` (mục 12.5).

### 12.1 Kết luận lượt 2

- **#96 @ `897ff46e`: DUYỆT.**
  - ĐK-1 xong: thẻ 02 và 03 Done.
  - ĐK-2 còn, bản cập nhật ở 12.6. Đây là điều kiện chạy câu SQL và lên `SHA_V105`, không chặn việc gộp.
  - ĐK-3 (PR #94) giữ nguyên, không chặn #96.
- **#109 @ `f2e6733d`: DUYỆT.**
  - Gộp sau #96 theo thứ tự ở 12.7.
  - `SHA_V105` phải chứa cả hai PR. Điều kiện ở 12.6 ý 2a dựa vào điều này.
- Không có Blocker, Major hay Minor mới. Một Suggestion mới: FB-R5-ARC-BE-109-01.

### 12.2 Trạng thái thẻ

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-ARC-BE-02 | Done | Guard SQL thuần, đạt thẻ. Lý do ở 12.3 |
| FB-R5-ARC-BE-03 | Done | Lệnh chạy đưa tệp qua stdin, `PGOPTIONS` gồm role `ottimo_readonly`, read-only, `statement_timeout`, `lock_timeout`. Đầu tệp có 5 ý đọc kết quả. Production dùng khối SEC ghim. Cột `property_id` (tùy chọn) không thêm: chấp nhận, vì v1.0.5 chỉ có một cơ sở |
| FB-R5-ARC-BE-04 | Done | **Ca HTTP:** `short_stay_max_nights` 3 cho hôm nay gặp dòng `min_stay` 5 đêm chỉ mới hẹn ngày, hiệu lực [15/11, 18/11) → 422 `min` 5, không ghi dòng. **Ca SQL:** D1 < D2 < D3 đúng như thẻ. Ca này đòi dòng `short_stay_max_nights` 4 từ D1 có `ok = true`. Vì vậy hai đột biến S2/S3 (so dòng đó với mọi dòng `min_stay` sau nó, không dừng ở `e`) sẽ bị bắt. ARC suy từ ca test, chưa chạy lại đột biến |
| FB-R5-ARC-BE-05 | Deferred | Hợp đồng 0.3.14, như cũ |
| FB-R5-ARC-BE-06 | Done | `missingAsNull` chỉ đổi `ParameterMissingError` thành null (ở `valuesDuringOwnRow` và `late_checkout_tiers`). Có test "connection lost" không bị nuốt. JSDoc `ChannelScope` đã sửa |
| FB-R5-DOM-BE-PR96-01 (DOM 13.1) | Done (ARC kiểm cách sửa) | Xem ngay dưới bảng |

**Cách sửa DOM 13.1:**
- **Phần trăm tối đa 2 chữ số thập phân**, ở cả 6 chỗ: `los_discount`, `cancel_policy_direct`, hai khóa bậc giờ, `early_departure_refund`, `lease_terms`. Sai thì trả `VALIDATION_FAILED` kèm `min 0`, `max 100`.
- **`cancel_policy_direct` = `[]`** trả `REQUIRED` ở `value`.
- **`max_open_holds_per_user` thiếu vai** trả `REQUIRED` ở `value.<vai>`.
- **Câu SQL đổi cùng lúc:** `round(p, 2)`, 1–10 tầng, bắt buộc đủ hai vai. Hai giá trị `{}` và `[]` chuyển từ ca tốt sang ca hỏng trong bộ ca dùng chung. Nhờ vậy test so SQL với bộ kiểm khi lưu vẫn bắt lệch. Có unit T-13-2…4.
- **Ghi chú kỹ thuật:**
  - TS so `Number(v.toFixed(2)) !== v` trên số double. SQL so `round(p, 2)` trên numeric, đúng các chữ số đã lưu.
  - Với mọi số có tối đa 2 chữ số thập phân trong 0–100, hai bên cùng nhận.
  - Hai bên chỉ khác ở chuỗi số rất dài như `12.3400000000000001`: SQL chặt hơn. Không ai nhập số như vậy, chấp nhận.

### 12.3 Guard SQL thuần (không dùng `DO`) – có đạt thẻ 02 không: **Có**

**Đạt đúng hai yêu cầu của thẻ:**
- Chạy sai thì dừng và nói rõ lý do.
- Chạy đúng thì không in thêm gì.
- Không có `DO`, `SET` hay lệnh ghi, nên hợp checklist SEC.

**Cơ chế:**
- `CASE` xét điều kiện theo thứ tự và chỉ tính nhánh đầu tiên đúng.
- Nhánh lỗi trả một chuỗi, rồi chuỗi đó bị ép sang `boolean`. Postgres báo lỗi `invalid input syntax for type boolean: "v5-25 check stopped: …"`.
- Có `ON_ERROR_STOP=1` nên psql dừng ngay với mã thoát khác 0. Các câu sau không chạy, giao dịch READ ONLY bị bỏ.
- Nhánh đúng ép `'false'`. Mệnh đề thành `WHERE false`, ra 0 dòng, và `-tA` không in gì.

**Rủi ro "tính sớm hằng số" – không xảy ra ở đây:**
- Postgres có thể tính sẵn biểu thức hằng lúc lập kế hoạch, kể cả trong nhánh `CASE` không chạy. Tài liệu Postgres có cảnh báo này.
- Ở đây phép ép nằm **ngoài** `CASE`, trên một kết quả phụ thuộc subquery, nên không bị tính sớm.
- Chữ trong các nhánh `THEN` chỉ là hằng chuỗi. Có tính sớm cũng không lỗi.
- Test chứng minh cả hai đường trên Postgres 17 trong CI, cùng digest với production. SEC cũng đã chạy thử ba nhánh dừng bằng `ottimo_readonly`.

**Test:**
- `ottimo_app` không có tenant → dừng ở nhánh 1, đúng ca ARC tìm ra ở lượt 1.
- `ottimo_owner` với tenant không tồn tại → dừng ở nhánh 3.
- Tenant thật nhưng không có dòng nào của ba khóa → dừng ở nhánh 3.
- Lần chạy đúng: guard ra `[]`, sau đó là đúng 4 câu `SELECT` với cột đúng thứ tự.

**Ghi chú, không phải điều kiện:**
- **Nhánh 2 ("no property is visible")** không bao giờ chạy dưới `ottimo_owner`, vì policy `entry_function_read ON property … USING (true)` (migration `0001`) cho owner thấy mọi cơ sở. Nhánh này chỉ có nghĩa khi chạy BYPASSRLS trên DB trống. Không hại gì.
- **Guard chỉ kiểm "có ít nhất một dòng của ba khóa"**, không kiểm từng cơ sở. Ý đọc thứ hai ở đầu tệp ("mỗi cơ sở có đủ ba khóa") phủ phần còn lại. v1.0.5 có một cơ sở.
- **Câu báo lỗi bắt đầu bằng `invalid input syntax for type boolean`.** Người chạy chỉ cần tìm chữ `v5-25 check stopped`, như đầu tệp đã viết. OPS chép nguyên câu này vào runbook v1.0.5.

### 12.4 `early_departure_refund` hỏng → `409 PAYMENT_NOT_CONFIGURED`: đúng mục 10

- **Một chỗ kiểm duy nhất:** `earlyDeparture` kiểm ngay sau bước kiểm null. Chỗ này dùng chung cho `dryRun` và lệnh ghi. Không đường nào tính tiền hoàn từ giá trị hỏng.
- **T-13-8 đủ:**
  - thử ba dạng hỏng: số trơn, `refundPct` 150, `minNoticeDays` là chuỗi;
  - cả ba trả 409 kèm `detail`, body không lộ giá trị;
  - đơn vẫn `in_house`, ngày đi không đổi;
  - không sinh `approval_request`.
- **Không đổi hợp đồng:** `earlyDeparture` đã khai 409 `PAYMENT_NOT_CONFIGURED` cho ca khóa null.
- **0.3.14:** chuyển sang `PARAM_NOT_USABLE` kèm `parameterKey`/`parameterState`. Dòng log cảnh báo đã nằm trong bảng mục 10, nên không cần thẻ mới.

### 12.5 PR #109 – `damage_catalog`

**Hai chỗ đọc có phủ đủ năm thao tác không: Có.** Hai chỗ đọc là `FolioLinesService.catalog` và `BillService.catalogNames`.

| Thao tác | Đi qua chỗ đọc nào | Test (d), bảng hỏng đã lưu sẵn |
|---|---|---|
| `getChargeCatalog` | `catalog()` → `readDamageCatalog` | 200, 3 món tốt, 1 cảnh báo |
| `addFolioLine` | `add()` tra mã trong `catalog()`. Thân folio trả về đi `folioBody` → `labelContext` → `catalogNames` | 201, 50.000 đ, nhãn "Ly" |
| `getFolio` | `folioBody` → `labelContext` → `catalogNames` | 200 |
| `getBill` | `BillService.bill` → `catalogNames(today)` | 200 |
| `adjustFolioLine` | `adjust()` không đọc bảng. Thân folio trả về đi `folioBody` → `catalogNames` | 201 |

- **Không còn chỗ đọc nào khác.** Tìm `damage_catalog` trong `src` của nhánh #109 chỉ ra hai chỗ này; seed và `production-defaults.ts` chỉ ghi giá trị.
  - Mọi thao tác folio khác trả `folioBody` cũng qua `catalogNames`, nên cũng được phủ.
  - Admin-web chỉ gọi `getChargeCatalog` qua API.
- **Đọc khi giá trị hỏng, đúng DOM 13.2:**
  - Giá trị không phải danh sách → bảng rỗng. Đền bù đi đường "ngoài bảng", MGR+ duyệt (test (e)).
  - Món hỏng hoặc trùng → bỏ món đó, các món tốt vẫn dùng. Không ném lỗi.
  - Log một lần cho mỗi cặp (cơ sở, giá trị). Tập đã log có trần 500. Log không chứa giá trị, đường field qua `logSafeField`.
  - Lúc đọc tham số chỉ nuốt `ParameterMissingError`, cùng tinh thần thẻ 06.
- **Bộ kiểm khi lưu khớp DOM 13.4 và khớp dòng đếm (b) của SQL.** 28 ca hỏng và 4 ca tốt dùng chung chạy cả hai bên.
  - `code` theo `^[a-z0-9_]{1,40}$`: chặn `damage.glass`, `Glass`, `ly_đá`.
  - Tên dài 1–100 điểm mã, không trùng. So trùng sau khi bỏ khoảng trắng hai đầu, không phân biệt hoa thường.
  - `priceVnd` là số nguyên 1.000–20.000.000.
  - Tối đa 100 món, chỉ kiểm lúc lưu. Đúng ba khóa `code`, `name`, `priceVnd`.
- **Điểm DOM ghi [CHƯA XÁC MINH] về `lower()` ở SQL: ARC đã thử.**
  - Môi trường thử: image ghim `postgres:17-alpine@sha256:b0f9…2b24`, khởi tạo mặc định (`en_US.utf8`, provider libc). Compose không đặt locale.
  - Kết quả: `lower('KHĂN TẮM') = lower('khăn tắm')` là đúng; `lower('ĐÈN')` ra `đèn`.
  - Vậy SQL và TS so trùng tên tiếng Việt giống nhau, nếu DB production cũng khởi tạo mặc định [GIẢ ĐỊNH: chưa xem trực tiếp production].
- **ORC cần biết khi số đếm (b) khác 0 – hành vi đổi so với v1.0.4:**
  - v1.0.4 vẫn hiện món thiếu tên (lấy `code` làm tên) và món có giá lẻ, âm hay trên 20 triệu.
  - v1.0.5 bỏ các món đó khỏi danh mục, chỉ ghi log. Lễ tân không thấy món, phải ghi "ngoài bảng" (MGR+ duyệt) tới khi sửa trên Desk.
  - Dòng folio cũ mang mã của món bị bỏ sẽ hiện nhãn mặc định.
  - Không có 500. Trước đây món giá âm gây 500 lúc ghi (`folio_line_sign_check`); nay trả 422 `NOT_IN_LIST` (test (f)).

### FB-R5-ARC-BE-109-01
- Mức độ: Suggestion
- Vị trí: `folio-lines.service.ts` `catalog()` (ngày kinh doanh, `this.today()` có rollover) so với `bill.service.ts` `labelContext()`/`bill()` (`localDate(now, tz)`, ngày lịch). Lệch này có từ trước #109.
- Vấn đề: từ 00:00 tới giờ rollover (06:00), nếu có dòng `damage_catalog` hẹn cho ngày mới, danh mục và nhãn trên folio/bill đọc hai dòng khác nhau.
- Vì sao quan trọng: sau #109 không còn 500, chỉ lệch nhãn và danh mục trong vài giờ đêm. Chú thích ở `catalogNames` cũng ghi "tới ngày kinh doanh sau", không đúng với ngày lịch.
- Đề xuất sửa: ở R5-B-05, cả hai chỗ dùng ngày kinh doanh (BR-010). Không làm trong #109.
- Trạng thái: Open

### 12.6 ĐK-2 cập nhật – ý kiến ARC về quyết định ORC 07/11

ORC đã quyết theo đề xuất DOM: (1) ô `V525_STOP_KEYS` gồm 6 khóa; (2) hai dòng đếm khác 0 không dừng lên bản. ARC đồng ý cả hai và thêm các điểm sau.

1. **Đồng ý 6 khóa, đề xuất thêm `lease_terms` thành khóa thứ 7.**
   - **Lý do kỹ thuật:** `lease_terms` chỉ được đọc ở báo giá sales (`sales/internal/quote-pricing.ts`, phương án một tháng BR-108, khi số đêm ≥ `long_stay_compare_from_nights`).
   - Mã chỉ thay `null` bằng `[]`. Giá trị không phải danh sách thì `.find` lỗi; có phần tử `null` thì `t.months` lỗi. Cả hai làm báo giá dài ngày trả 500, cùng loại với bốn khóa DOM thêm.
   - **Chi phí gần bằng 0:** giá trị production ORC đọc ngày 06/11 hợp lệ. Câu SQL đã kiểm `lease_terms`, nên không phải sửa SQL hay ghim lại. Chỉ cần thêm khóa vào ô `V525_STOP_KEYS` khi cắt bản.
   - **Các khóa còn lại giữ "ghi lại, sửa trên Desk sau" theo DOM 13.2:** `cancel_policy_direct`, hai khóa bậc giờ, `early_departure_refund`, `checkout_reminders`, `max_open_holds_per_user`, `short_stay_max_nights`.
   - Riêng `short_stay_max_nights`: nếu mâu thuẫn thật với `min_stay`, dòng `min_stay` cũng ra `ok = false`, vì hai bên được kiểm trên cùng khoảng giao. Ca đó đã dừng qua `min_stay`.
2. **Đồng ý hai dòng đếm khác 0 không dừng lên bản, kèm ba điều kiện kỹ thuật:**
   - **a. `damage_catalog_rows_broken`:** chỉ được bỏ qua khi `SHA_V105` chứa cả #96 lẫn #109. Nếu cắt v1.0.5 mà thiếu #109, số khác 0 vẫn phải dừng: dòng hỏng đang hiệu lực hay đã hẹn ngày làm mọi folio/bill trả 500 (BUG-R5-004).
   - **b. `open_bookings_cancel_policy_broken`:** đúng là v1.0.5 không làm ca này tệ hơn. #96 không đổi đường hủy hay dời ngày (`reservations.service.ts` không có trong diff #96 so với `main`). ORC và DOM cần biết hệ quả với các đơn bị đếm:
     - hủy (cả bước xem trước) và dời ngày của đơn đã cọc sẽ trả 500, khi bản chép không phải danh sách hoặc có phần tử `null`;
     - hoặc hoàn 0 % mà không báo gì, khi bản chép là `[]`;
     - quy tắc DOM 13.2 "bản chép hỏng thì dùng chính sách đang hiệu lực" **chưa có** trong #96. Nó thuộc phần "còn lại: R5-B-05" của DOM. PO giữ nó cùng việc đọc phòng thủ nhóm bán, dùng lại `cancelPolicyIssue`.
   - **c. Câu SQL chỉ in số, không in mã đơn.** Đúng thiết kế, SEC đã ghim. Nếu số (a) khác 0, DOM cần mã đơn và ngày đến để xử lý từng đơn.
     - Khi đó cần câu đọc thứ hai, chỉ in `reservation.code`, `arrival_date`, `status`, không có cột khách. SEC duyệt và ghim trước khi chạy. Chỉ viết khi số khác 0.
     - Không `UPDATE` tay `reservation.pricing_snapshot` trên production. Bản chép là bằng chứng giá đã bán. Nếu phải sửa dữ liệu thì làm script một lần, có ARC và SEC review.

### 12.7 Thứ tự gộp (cập nhật mục 8)

1. Gộp #96 vào `main` bằng merge commit, như các PR khác của repo.
2. Đổi base của #109 sang `main`. GitHub tự đổi nếu nhánh `r5-v5-25` bị xóa khi gộp; nếu không, ORC đổi tay.
   - Repo gộp bằng merge commit, nên các commit của #96 đã nằm trong `main`. Diff của #109 chỉ còn 3 commit của nó.
   - Chờ CI xanh trên base mới rồi gộp.
3. Sau đó không đổi tệp SQL. Đổi một byte là phải ghim lại (SEC) và đọc lại (ARC).
4. ĐK-3 (#94) không chặn hai PR này.

### 12.8 Giả định ARC dùng ở lượt 2
- Không chạy lại test hay đột biến trên máy. Kết luận dựa vào CI xanh ở hai HEAD (có integration trên Postgres 17) và việc đọc mã.
- DB production khởi tạo bằng locale mặc định của image ghim. Compose production không ghi đè locale.
- Hệ quả ở 12.6 ý 2b (500 hay hoàn 0 %) là ARC đọc từ mã, chưa chạy.
- Không có ESC mới. Các điểm ở 12.6 thuộc quyền ORC/DOM theo khung ĐK-2, không cần chủ đầu tư.
