# BUG-R4-037 – Dữ liệu production bị ảnh hưởng và đường sửa dữ liệu an toàn

- Vai: BE. Round 4, hotfix P0, bước **Phân tích**. Ngày 04/11/2026.
- Phạm vi: chỉ đọc mã và schema trong repo (tag `v1.0.0-rc.1` … `v1.0.3`, `main` @ `4bf353da`).
  - Không sửa mã.
  - Không chạy câu truy vấn nào, ở bất kỳ đâu.
  - Không chạm production hay staging.
  - Tệp này không chứa dữ liệu khách.
- Đầu vào: mục BUG-R4-037 trong `rounds/round-04/qa/bug-list-v1.0.4.md`.

## 0. Kết luận nhanh

1. **Dấu hiệu QA đoán viết sai cột, chạy sẽ ra 0 dòng và báo nhầm là "không bị ảnh hưởng".**
   - `stay_night.rate_source` không bao giờ là `'calendar'`. Ràng buộc `stay_night_rate_source_check` chỉ cho 5 giá trị. Mọi đêm tạo lúc đặt phòng đều là `short_stay_rate`.
   - Chữ `calendar` nằm ở **`reservation.pricing_snapshot -> 'nights'[i] ->> 'source'`**.
2. **Dấu hiệu đúng** (mục 1.5):
   - OTA: đêm trong bản chụp giá có `source = 'calendar'` mà không có `calendarVnd`, và `stay_night.calendar_rate_vnd IS NULL`, `room_revenue_gross_vnd > 0`.
   - Nội bộ: đêm trong bản chụp giá có `source = 'calendar'` và `room_revenue_gross_vnd > 0`.
3. **Mã liên quan giống hệt nhau từ `v1.0.0-rc.1` (lên production 26/10) tới `v1.0.3`.** Một câu truy vấn đúng cho mọi dữ liệu production.
4. **Dấu hiệu chắc chắn theo nghĩa "giá không do lễ tân gõ".** Không có đường nào khác ghi ra dấu vết này. Ca "gõ đúng giá OTA mà không đánh dấu edited" không xảy ra được.
   - Nhưng dấu hiệu chưa chắc là **sai tiền**. Có thể giá Trực tiếp điền sẵn trùng giá OTA thật, hoặc lễ tân thấy đúng nên để nguyên. Muốn biết phải so với số kỳ vọng (mục 1.7).
5. **Đã soạn câu truy vấn chỉ đọc Q0–Q4** (mục 2), chưa chạy. Chạy bằng vai **`ottimo_readonly`** của `02-roles.sh`.
   - Vai này NOLOGIN, có BYPASSRLS, chỉ có quyền SELECT.
   - Phiên quản trị nhận vai lúc kết nối, theo khối `SQLRO` của runbook v1.0.4.
6. **Trong app chỉ sửa được một phần.**
   - Đơn chưa trả phòng, folio còn mở: lễ tân hoặc quản lý mở **Folio & điều chỉnh** → **Điều chỉnh** dòng tiền phòng (A31). Thao tác có audit tiền.
   - Không làm được:
     - Đơn Nội bộ không đưa về 0 đ được, vì giá mới phải > 0.
     - Đơn đã trả phòng chỉ sửa được dòng folio (MGR/OWN, trong cửa sổ sau trả phòng). Số đêm cho báo cáo vẫn sai.
     - Folio đã khóa: không sửa được gì.
   - Đề xuất: công cụ sửa một lần trong mã máy chủ, có chế độ thử, review và INV duyệt (mục 3.3). Không dùng migration SQL để sửa tiền.
7. **Production vận hành thật từ ngày D 02/11** (decision-log 01/11: "Ngày D 02/11 chạy Desk như kế hoạch"; không có dữ liệu cũ chuyển sang).
   - Đơn tạo từ 26/10 tới 01/11 là đơn thử. Đơn tạo từ 02/11 là dữ liệu thật.
   - Q2 có cột `ngay_tao` và vai người tạo để tách hai loại này. Có đơn thật bị dính → mở ESC (mục 4).
8. **Thêm Q5** (mục 2.8): đếm đơn Nội bộ có đêm thêm (B13/B9a/B18) nguồn `default` mà gross > 0. Đây là lỗi P2 DOM tìm ra, tách khỏi 037.

## 1. Đêm bị dính trông thế nào

### 1.1 Mã ở các bản đã lên production

| Bản | Commit | `pricing.service.ts` | `reservation-store.ts` `insertNights` | Phần tạo đơn của `reservations.service.ts` | Phần giá của `BookingDialog.tsx` |
|---|---|---|---|---|---|
| `v1.0.0-rc.1` (production từ 26/10) | `29636757` | như `v1.0.3` | như `v1.0.3` | như `v1.0.3` (khác chỉ ở `stayDepartureDate`, không đụng giá) | như `v1.0.3` (khác chỉ ở `DIRECT_SOURCES`) |
| `v1.0.0`, `v1.0.1`, `v1.0.2`, `v1.0.3` | `8b3aec89`, `755cad16`, `e5fffe05`, `da6d6f3d` | giống nhau | giống nhau | giống nhau | giống nhau |
| `main` @ `4bf353da` | – | như `v1.0.3` | như `v1.0.3` | như `v1.0.3` | khác 2 dòng (`guestPrefillOf`), không đụng giá |

- Lần cuối đổi `pricing.service.ts` là `d8337bb6` (18/10). Cờ `edited` của server (`r.edited === false`) và `ratesEdited` của Desk cùng vào từ commit này, trước production.
- Bản `cf6c5575` (16/10) cũng có lỗi, nhưng khi đó chưa có `edited`, nên đêm bị lưu là `manual`. Dữ liệu thời đó không có trên production, vì production dựng cơ sở dữ liệu mới từ rc.1.

### 1.2 Đường đi của số sai

1. Desk luôn mở **Đặt phòng mới** ở kênh Trực tiếp. Riêng khi khôi phục bản nháp thì giữ kênh của bản nháp.
2. Sau 300 ms, bản xem giá (`calculateQuote`, chỉ chạy cho Trực tiếp/CTV) điền vào mỗi ô số `calendarRateVnd ?? amountVnd`. Đây là giá lịch Trực tiếp trước bậc giảm, của căn và ngày lúc đó. Đồng thời `ratesEdited = {}`.
3. Lễ tân chuyển sang OTA hoặc Nội bộ. Bản xem giá tắt, `setCalc(null)`, nhưng **ô giá giữ nguyên số**.
4. `body()`: với OTA và Nội bộ, nếu mọi ô có số thì gửi `nightlyRates`, mỗi đêm `edited: !!ratesEdited[date]` = `false`.
5. Máy chủ, `parseNightlyRates`, giữ nguyên cờ `edited`. Tiếp theo `PricingService.price()` đi nhánh giá gửi lên (dòng 258–318):
   - `source = 'calendar'` khi `edited === false`;
   - với OTA và Nội bộ **không có `calendarVnd`**, vì nhánh này chỉ ghi `calendarVnd` cho Trực tiếp/CTV;
   - `outOfRange` chỉ xét đêm `manual`, nên không có cảnh báo sàn–trần BR-105 và không phải nhập lý do. Lỗi đi qua lặng lẽ.
6. `insertNights` ghi `stay_night` với `rate_source = 'short_stay_rate'`, `calendar_rate_vnd = NULL`, gross = net = `reference_rate_vnd` = số Trực tiếp.

### 1.3 Dấu vết trong từng bảng

| Nơi | Đêm bị dính, OTA | Đêm bị dính, Nội bộ |
|---|---|---|
| `reservation.pricing_snapshot.nights[d]` | `{date, amountVnd: <số Trực tiếp>, source: "calendar"}`, **không có** `calendarVnd`, không có `uplift` | như OTA |
| `reservation` | `payment_model` = `ota_prepaid` / `ota_pay_at_property`; `total_room_vnd` = Σ số sai; `bookingRateSource = 'calendar'` | `payment_model = 'direct'`; `is_complimentary = true` **nhưng** `total_room_vnd > 0` |
| `stay_night` | `rate_source = 'short_stay_rate'`; `calendar_rate_vnd IS NULL`; `room_revenue_gross_vnd = room_revenue_vnd = reference_rate_vnd` = số sai | như OTA; `is_complimentary = true` mà gross > 0 |
| `audit_event` `reservation.priced` (lúc tạo) | `after.rateSource = 'calendar'` nếu mọi đêm không gõ, `'manual'` nếu có đêm đã gõ (ca "Nhập giá mỗi đêm" của QA bước 3); `after.nightlyRates` = số đã lưu | như OTA |
| `folio_line` | mỗi đêm một dòng `room` bằng số sai. OTA trả trước: biên nhận `ota_collect` = Σ số sai. OTA trả tại khách sạn: số phải thu của khách sai | mỗi đêm một dòng `room` > 0, nên folio còn phải thu với khách Nội bộ |
| `channel_fee` (OTA) | `base_amount_vnd` và phí ước tính tính trên Σ số sai | – |

### 1.4 Vì sao dấu hiệu QA đoán không dùng được

- QA đoán: `stay_night.rate_source = 'calendar' AND calendar_rate_vnd IS NULL`.
- Thực tế: `stay_night.rate_source` chỉ nhận `short_stay_rate | lease_allocation | extra_night_early_late | extension | odd_days` (CHECK ở `db/schema/reservations.ts`). Câu đó **luôn ra 0**.
- Nguồn giá của từng đêm (`calendar | manual | default | ota_amount | complimentary`) chỉ nằm trong `reservation.pricing_snapshot.nights[]`.

### 1.5 Dấu hiệu chốt, tính theo từng đêm

Điều kiện chung:
- `channel.channel_group IN ('ota', 'internal')`;
- `reservation.stay_type = 'short'` và không phải hợp đồng ngoài (`external_contract = false`);
- `stay_night.rate_source = 'short_stay_rate'` và `stay_night.room_revenue_gross_vnd > 0`;
- đêm cùng ngày trong `pricing_snapshot.nights[]` có `source = 'calendar'`.

Thêm cho OTA: `nights[d] ->> 'calendarVnd' IS NULL` **và** `stay_night.calendar_rate_vnd IS NULL`.

Nội bộ không thêm điều kiện về `calendarVnd`. Lý do: B9a, B13, B18 trên đơn Nội bộ chạy `writeRepricedNights`. Hàm này ghi lại các đêm giữ nguyên với `calendar_rate_vnd = gross`, và bản chụp giá có thêm `calendarVnd`. Nhưng `source` vẫn là `calendar`.

### 1.6 So với các ca đúng

| Đường ghi | `source` (bản chụp giá) | `calendarVnd` / `calendar_rate_vnd` | Có khớp dấu hiệu? |
|---|---|---|---|
| OTA, Desk không gửi giá (BUG-R2-017, đúng) | `calendar` | có, bằng số tiền | Không |
| OTA, lễ tân gõ (kể cả gõ lại đúng số cũ: Desk luôn đặt `edited: true` khi ô đổi) | `manual` | không | Không |
| OTA, gửi `otaRoomAmountVnd` (Desk hiện không gửi) | `ota_amount` | không | Không |
| OTA, đổi căn B7/B14 sau khi tạo | giữ nguồn cũ (`plannedSource` "kept") | giữ NULL | **Giữ nguyên dấu hiệu** (đúng ý: giá vẫn sai) |
| OTA, B9a/B13/B18 | đơn con kênh Trực tiếp, đơn OTA không đổi | – | Đơn con không khớp; đơn OTA giữ dấu hiệu |
| OTA, đổi ngày | bị chặn (`OTA_DATES_LOCKED`) | – | – |
| Nội bộ, không gửi giá (đúng) | `complimentary`, 0 đ | không | Không |
| Nội bộ, lễ tân gõ giá | `manual` (hoặc `complimentary` nếu 0) | không | Không |
| Nội bộ, B7 đổi ngày thêm đêm | `calendar`, **0 đ** | không | Không (điều kiện gross > 0) |
| Nội bộ, B13/B9a/B18 thêm đêm | `default` | có | Không |
| Bất kỳ đêm nào đã sửa bằng A31 sau đó | `manual` | – | Không (đã sửa, theo dõi bằng Q4) |
| Giữ chỗ / báo giá → đơn | `calendar` | tùy | Không, vì chỉ có kênh Trực tiếp/CTV |

Chỉ `BookingDialog` gửi cờ `edited`. `LongStayDialog` không gửi giá đêm, và các ứng dụng hay tích hợp khác không tạo đơn qua `createReservation`. Một client gửi `nightlyRates` mà không có cờ thì máy chủ ghi `manual`, không ra dấu hiệu này.

### 1.7 Ca trông giống hệt, ca có thể nhầm

**Ca đúng mà trông giống hệt (dương tính giả về tiền).** Dấu hiệu vẫn đúng là "lễ tân không gõ giá", nhưng tiền có thể không sai:
- (a) **Trùng số.** Giá lịch Trực tiếp của căn trong bản xem bằng đúng giá OTA thật của đơn, hoặc bằng giá lịch OTA của nhóm căn. Dấu hiệu khớp, chênh 0.
- (b) **Lễ tân thấy số đúng nên để nguyên.** Dữ liệu không phân biệt được với lỗi. Chỉ so với sao kê OTA hoặc giá lịch OTA mới biết.
- (c) **Nội bộ cố ý thu giá Trực tiếp.** Lễ tân thấy số điền sẵn và muốn thu đúng số đó. Hiếm; DOM hỏi người tạo đơn.

Vì vậy Q1/Q2 trả "số đêm có giá không do lễ tân gõ", kèm cột chênh:
- Nội bộ: chênh chính xác, vì số kỳ vọng = 0.
- OTA: chênh ước tính thô, theo giá nền OTA của nhóm căn.

**Ca câu hỏi nêu, "OTA gõ đúng giá OTA nhưng không đánh dấu edited": không xảy ra trên các bản này.**
- Ô giá đổi bằng bàn phím luôn đặt `ratesEdited[date] = true` (dòng 1228 bản v1.0.3), kể cả khi gõ lại đúng số cũ. Đêm đó thành `manual`.
- Khả năng duy nhất là bản nháp lưu trước khi có `ratesEdited` (trước 18/10). Khóa bản nháp gắn với mã người dùng (`booking.new.<userId>`), mà người dùng production được tạo từ 26/10, nên không áp dụng.

**Âm tính giả (đêm sai mà không khớp):**
- Đêm đã được sửa bằng A31 thì thành `manual`. Đây là đúng ý; theo dõi bằng Q4.
- Ngoài ra không thấy đường nào làm mất dấu hiệu:
  - B7/B14 giữ nguồn và giữ `calendar_rate_vnd` NULL của OTA;
  - với Nội bộ, dấu hiệu không dựa vào `calendarVnd`.
- Đêm đã void do đổi ngày không còn trong bản chụp giá, nên không đếm. Đêm đó cũng không còn tiền.

### 1.8 Ngoài phạm vi 037, ghi lại để đội xem (chưa xác minh là lỗi)

- **B13 gia hạn đơn Nội bộ.** Đêm thêm lấy `addedNightRate` (giá lịch Trực tiếp, nguồn `default`). Không có nhánh riêng cho Nội bộ. DOM xem đây có phải ý muốn không, vì đơn Nội bộ mặc định 0 đ.
- **Biến thể hẹp ở Trực tiếp/CTV.** Đổi căn, ngày hay số khách rồi gõ một ô và bấm **Tạo đơn** trong khoảng 300 ms + thời gian gọi API, trước khi bản xem mới về. Khi đó các ô còn lại (của bản xem cũ) được gửi với `edited: false`, và lưu như giá lịch đúng. Người thao tác khó gặp, và dữ liệu không phân biệt được. FE nên phủ ca này trong cùng bản sửa, ví dụ gắn số điền với khóa bản xem.
- **Màn Điều chỉnh của Desk.** Ô giá nhận 0 (`p >= 0`), nhưng máy chủ trả 422 `AMOUNT_NOT_POSITIVE`. Chi tiết nhỏ, liên quan mục 3.

## 2. Câu truy vấn chỉ đọc

### 2.1 Chạy bằng gì, ai chạy

- **Vai:** `ottimo_readonly`, có sẵn trong `product/infra/postgres/init/02-roles.sh`. Production v1.0.3 đã có vai này từ R1. SELECT trên mọi bảng có qua `ALTER DEFAULT PRIVILEGES FOR ROLE ottimo_owner`.
  - Thuộc tính: NOLOGIN, BYPASSRLS, chỉ SELECT. Không có quyền TEMPORARY, nên không tạo bảng tạm. Mỗi câu dưới đây tự đủ, có khối `WITH` riêng.
  - Vì có BYPASSRLS, câu thấy mọi cơ sở. OTTIMO hiện chỉ có một cơ sở. Nếu có thêm, lọc theo `r.property_id`.
- **Cách nhận vai:** dùng khối `SQLRO` như runbook v1.0.4 (`product/infra/server/README.md` mục 13.8):
  - phiên quản trị kết nối với `PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly"`;
  - tiền tố SSH và `dc exec` như `rounds/round-04/outputs/OPS/v1.0.3-release-runbook.md` mục 2. Bản đó chỉ có `default_transaction_read_only=on`, phải **thêm `-c role=ottimo_readonly`**.
  - Lưu ý SEC P404R1-S1: `-c role=` chặn lỗi vô ý, không phải ranh giới bảo mật. Vì vậy chỉ dán đúng các câu dưới đây, không thêm câu nào.
- **Ai chạy:** ORC hoặc OPS, sau khi ORC duyệt. Đây là tra cứu sự cố, đúng mục đích của vai này (SR-OPS-04). BE không chạy.
- **Khuyến nghị trước production:** QA chạy thử Q0–Q4 trên stack local dùng một lần, với seed có đơn OTA/Nội bộ tạo bằng thao tác tái hiện của BUG-R4-037, để bắt lỗi cú pháp. Câu chưa được chạy hay phân tích cú pháp lần nào.
- **Định dạng:** khối `SQLRO` dùng `psql -tA` (không in tên cột). Với Q1–Q3, bỏ `-t` để có tên cột.
- **Dữ liệu trả về:** chỉ số đếm, số tiền, ngày đêm, trạng thái, mã đơn, mã kênh, vai người tạo. Không có tên, điện thoại, email, giấy tờ, `ota_ref`, `internal_note` hay `audit_event.reason`.
  - Kết quả Q1 được dán vào báo cáo trong repo.
  - Danh sách mã đơn Q2 **không** commit vào repo công khai. Gửi riêng cho INV/MGR để mở trong Desk.

### 2.2 Q0 – chốt phiên

```sql
SHOW default_transaction_read_only;
SELECT current_user, r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;
```
**Đúng là:** `on`, rồi `ottimo_readonly|t|f`.

**Dừng nếu khác.** Nếu vai không có BYPASSRLS thì RLS làm mọi số đếm lặng lẽ thành 0.

### 2.3 Q1 – tổng theo kênh và tháng của đêm

```sql
WITH hit AS (
  SELECT DISTINCT ON (r.id, sn.stay_date)
         r.id AS reservation_id, r.property_id, r.status, r.payment_model,
         (r.pricing_snapshot ->> 'asOf')::date AS priced_as_of,
         (r.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS created_on,
         COALESCE(r.origin_room_id, sn.room_id) AS priced_room_id,
         c.channel_group,
         CASE WHEN c.channel_group = 'internal' THEN 'internal' ELSE r.payment_model END AS bucket,
         sn.stay_date, to_char(sn.stay_date, 'YYYY-MM') AS night_month,
         sn.night_state, sn.room_revenue_gross_vnd AS recorded_vnd
    FROM reservation r
    JOIN channel c     ON c.property_id = r.property_id AND c.id = r.channel_id
    JOIN stay_night sn ON sn.property_id = r.property_id AND sn.reservation_id = r.id
    CROSS JOIN LATERAL (
      SELECT x.n
        FROM jsonb_array_elements(CASE WHEN jsonb_typeof(r.pricing_snapshot -> 'nights') = 'array'
                                       THEN r.pricing_snapshot -> 'nights' ELSE '[]'::jsonb END) AS x(n)
       WHERE x.n ->> 'date' = to_char(sn.stay_date, 'YYYY-MM-DD')
       LIMIT 1) s
   WHERE c.channel_group IN ('ota', 'internal')
     AND r.stay_type = 'short' AND NOT r.external_contract
     AND sn.rate_source = 'short_stay_rate'
     AND sn.room_revenue_gross_vnd > 0
     AND s.n ->> 'source' = 'calendar'
     AND (c.channel_group = 'internal'
          OR (s.n ->> 'calendarVnd' IS NULL AND sn.calendar_rate_vnd IS NULL))
     -- AND r.created_at < TIMESTAMPTZ '<hotfix deploy time>'   -- enable after the hotfix
   ORDER BY r.id, sn.stay_date, (sn.night_state = 'void'), sn.updated_at DESC
),
priced AS (
  SELECT h.*,
         CASE WHEN h.channel_group = 'ota' THEN (
           SELECT (cp.value ->> rg.code)::bigint
             FROM room rm
             JOIN room_group rg ON rg.id = rm.room_group_id
             JOIN config_parameter cp ON cp.property_id = rm.property_id AND cp.key = 'ota_base_rate'
                                     AND cp.effective_from <= COALESCE(h.priced_as_of, h.created_on)
            WHERE rm.id = h.priced_room_id
            ORDER BY cp.effective_from DESC
            LIMIT 1) END AS ota_base_vnd
    FROM hit h
)
SELECT COALESCE(bucket, 'TOTAL')    AS kenh,
       COALESCE(night_month, 'ALL') AS thang_dem,
       count(DISTINCT reservation_id) AS so_don,
       count(*) FILTER (WHERE night_state <> 'void') AS dem_con_hieu_luc,
       count(*) FILTER (WHERE night_state = 'void')  AS dem_da_huy,
       sum(recorded_vnd) FILTER (WHERE night_state <> 'void') AS tien_dang_ghi_vnd,
       sum(recorded_vnd) FILTER (WHERE night_state <> 'void' AND channel_group = 'internal') AS noi_bo_thua_vnd,
       sum(recorded_vnd - ota_base_vnd) FILTER (WHERE night_state <> 'void' AND channel_group = 'ota')
         AS ota_chenh_uoc_tinh_vnd,
       count(*) FILTER (WHERE night_state <> 'void' AND channel_group = 'ota' AND ota_base_vnd IS NULL)
         AS ota_dem_khong_co_gia_nen
  FROM priced
 GROUP BY ROLLUP (bucket, night_month)
 ORDER BY grouping(bucket), bucket, grouping(night_month), night_month;
```

- `kenh`:
  - `ota_pay_at_property` = OTA trả tại khách sạn;
  - `ota_prepaid` = OTA trả trước;
  - `internal` = Nội bộ;
  - `TOTAL` = tổng.
- `noi_bo_thua_vnd` là **chênh chính xác**: đơn Nội bộ đúng ra là 0 đ.
- `ota_chenh_uoc_tinh_vnd` là **ước tính thô**:
  - số đang ghi trừ giá nền OTA (`ota_base_rate`) của nhóm căn đã đặt, theo tham số ngày báo giá (`pricing_snapshot.asOf`);
  - chưa cộng phụ thu cuối tuần hay ngày đặc biệt;
  - không thấy giá trị mặc định của danh mục tham số. Đêm như vậy đếm ở `ota_dem_khong_co_gia_nen`.
  - Số chính xác chỉ có ở bước chạy thử của công cụ sửa (mục 3.3), dùng lại `PricingService.price()` cho kênh OTA không có giá gửi lên. Hoặc lấy theo sao kê OTA của từng đơn.
- Một đơn kéo dài qua 2 tháng được đếm ở cả 2 tháng. Dòng `TOTAL` đếm mỗi đơn một lần.

### 2.4 Q2 – danh sách mã đơn để mở trong Desk

Q2 là khối dán nguyên (QA-037-01). Phần `WITH` chép nguyên từng chữ từ Q1. Phần `SELECT` giữ nguyên như bản QA đã chạy thử, chỉ thêm `LIMIT 200` (SEC 3 (b)).

**Cách chạy:** như khối Q5 ở mục 2.8.
- Mỗi khối là một lần gọi đầy đủ: tiền tố `SQLRO` có sẵn `statement_timeout=30s` và `lock_timeout=3s`, câu chốt phiên nằm ở đầu heredoc, CTE có sẵn.
- Người chạy dán **nguyên khối**, không ghép, không gõ lại.
- Staging: thay `/opt/ottimo-prod` bằng `/opt/ottimo`.
- QA chạy thử local: chỉ thay dòng `ssh`, giữ nguyên từng chữ phần trong heredoc.
- `-tA` không in tên cột. Thứ tự cột ghi dưới mỗi khối.

**Chỉ gọi Q2** khi dòng `TOTAL` của Q1 có `so_don` (cột thứ 3) > 0 (SEC 3 (a)). Gọi bằng một lần riêng, sau khi đã đọc Q1.

**Khối Q2 (dán nguyên):**

```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\''' <<'SQL'
SHOW default_transaction_read_only;
SHOW statement_timeout;
SHOW lock_timeout;
SELECT current_user, r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;
WITH hit AS (
  SELECT DISTINCT ON (r.id, sn.stay_date)
         r.id AS reservation_id, r.property_id, r.status, r.payment_model,
         (r.pricing_snapshot ->> 'asOf')::date AS priced_as_of,
         (r.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS created_on,
         COALESCE(r.origin_room_id, sn.room_id) AS priced_room_id,
         c.channel_group,
         CASE WHEN c.channel_group = 'internal' THEN 'internal' ELSE r.payment_model END AS bucket,
         sn.stay_date, to_char(sn.stay_date, 'YYYY-MM') AS night_month,
         sn.night_state, sn.room_revenue_gross_vnd AS recorded_vnd
    FROM reservation r
    JOIN channel c     ON c.property_id = r.property_id AND c.id = r.channel_id
    JOIN stay_night sn ON sn.property_id = r.property_id AND sn.reservation_id = r.id
    CROSS JOIN LATERAL (
      SELECT x.n
        FROM jsonb_array_elements(CASE WHEN jsonb_typeof(r.pricing_snapshot -> 'nights') = 'array'
                                       THEN r.pricing_snapshot -> 'nights' ELSE '[]'::jsonb END) AS x(n)
       WHERE x.n ->> 'date' = to_char(sn.stay_date, 'YYYY-MM-DD')
       LIMIT 1) s
   WHERE c.channel_group IN ('ota', 'internal')
     AND r.stay_type = 'short' AND NOT r.external_contract
     AND sn.rate_source = 'short_stay_rate'
     AND sn.room_revenue_gross_vnd > 0
     AND s.n ->> 'source' = 'calendar'
     AND (c.channel_group = 'internal'
          OR (s.n ->> 'calendarVnd' IS NULL AND sn.calendar_rate_vnd IS NULL))
     -- AND r.created_at < TIMESTAMPTZ '<hotfix deploy time>'   -- enable after the hotfix
   ORDER BY r.id, sn.stay_date, (sn.night_state = 'void'), sn.updated_at DESC
),
priced AS (
  SELECT h.*,
         CASE WHEN h.channel_group = 'ota' THEN (
           SELECT (cp.value ->> rg.code)::bigint
             FROM room rm
             JOIN room_group rg ON rg.id = rm.room_group_id
             JOIN config_parameter cp ON cp.property_id = rm.property_id AND cp.key = 'ota_base_rate'
                                     AND cp.effective_from <= COALESCE(h.priced_as_of, h.created_on)
            WHERE rm.id = h.priced_room_id
            ORDER BY cp.effective_from DESC
            LIMIT 1) END AS ota_base_vnd
    FROM hit h
)
SELECT r.code AS ma_don,
       p.bucket AS kenh, c.code AS ma_kenh, p.status AS trang_thai_don, f.status AS trang_thai_folio,
       CASE
         WHEN p.status IN ('cancelled', 'no_show') THEN 'D - don huy/no-show: kiem dong phi'
         WHEN f.status = 'closed' OR (f.status = 'settled' AND f.post_checkout_window_until <= now())
           THEN 'C - folio da khoa: khong sua duoc trong app'
         WHEN p.status = 'checked_out' THEN 'B - MGR/OWN sua dong folio (A32), stay_night khong doi'
         WHEN p.channel_group = 'internal' THEN 'A- - A31 khong ve 0 d duoc'
         ELSE 'A - Dieu chinh dong tien phong (A31)'
       END AS duong_sua,
       min(p.stay_date) AS dem_dau, max(p.stay_date) AS dem_cuoi,
       count(*) FILTER (WHERE p.night_state <> 'void') AS dem_dinh,
       count(*) FILTER (WHERE p.night_state = 'void')  AS dem_dinh_da_huy,
       (SELECT count(*) FROM stay_night a
         WHERE a.reservation_id = p.reservation_id AND a.night_state <> 'void') AS tong_dem_cua_don,
       string_agg(to_char(p.stay_date, 'DD/MM') || '=' || p.recorded_vnd, ' ' ORDER BY p.stay_date) AS gia_tung_dem,
       sum(p.recorded_vnd) FILTER (WHERE p.night_state <> 'void') AS tien_dang_ghi_vnd,
       sum(p.recorded_vnd - p.ota_base_vnd) FILTER (WHERE p.night_state <> 'void' AND p.channel_group = 'ota')
         AS ota_chenh_uoc_tinh_vnd,
       (SELECT e.after ->> 'rateSource' FROM audit_event e
         WHERE e.entity_type = 'reservation' AND e.entity_id = p.reservation_id::text
           AND e.action = 'reservation.priced'
         ORDER BY e.occurred_at LIMIT 1) AS nguon_luc_tao,
       p.created_on AS ngay_tao,
       (SELECT string_agg(DISTINCT u.role, ',') FROM user_property_role u
         WHERE u.user_id = r.created_by AND u.property_id = r.property_id AND u.revoked_at IS NULL) AS vai_nguoi_tao
  FROM priced p
  JOIN reservation r ON r.id = p.reservation_id
  JOIN channel c     ON c.property_id = r.property_id AND c.id = r.channel_id
  JOIN folio f       ON f.property_id = r.property_id AND f.id = r.folio_id
 GROUP BY p.reservation_id, r.code, r.created_by, r.property_id, p.bucket, c.code, p.status, f.status,
          f.post_checkout_window_until, p.channel_group, p.created_on
 ORDER BY duong_sua, dem_dau, ma_don
 LIMIT 200;
SQL
```

Kết quả:
- 4 dòng đầu là `on`, `30s`, `3s`, `ottimo_readonly|t|f`.
- Rồi tới mỗi đơn một dòng, cột theo thứ tự: `ma_don|kenh|ma_kenh|trang_thai_don|trang_thai_folio|duong_sua|dem_dau|dem_cuoi|dem_dinh|dem_dinh_da_huy|tong_dem_cua_don|gia_tung_dem|tien_dang_ghi_vnd|ota_chenh_uoc_tinh_vnd|nguon_luc_tao|ngay_tao|vai_nguoi_tao`.
- **Đúng là:** số dòng đơn bằng `so_don` của dòng `TOTAL` ở Q1.

**Dừng và báo BE nếu:**
- 4 dòng chốt phiên khác giá trị trên;
- ra đủ 200 dòng đơn;
- số dòng đơn khác `so_don` của `TOTAL` ở Q1;
- có lỗi, kể cả `permission denied`. Không chạy lại bằng vai quản trị.

Kết quả Q2 có mã đơn và số tiền, nên chỉ hiện trên màn hình người chạy và trong chat với INV (SEC 3 (c)). Repo chỉ ghi số đơn theo từng `duong_sua` (SEC 3 (d)).

- `nguon_luc_tao` lấy từ audit lúc tạo, dùng để đối chiếu:
  - `calendar` = mọi đêm không gõ;
  - `manual` = có đêm đã gõ (đơn trộn, như QA bước 3).
- `vai_nguoi_tao` giúp tách đơn thử của INV hay của đội. Cột chỉ có vai nhân viên, không có tên.
- `gia_tung_dem` giúp quản lý thấy ngay số nào là giá Trực tiếp, ví dụ `04/11=667000`.

### 2.5 Q3 – phân bố để kiểm chéo dấu hiệu (không cần mã đơn)

```sql
SELECT c.channel_group, r.payment_model,
       COALESCE(s.n ->> 'source', '(khong co trong ban chup gia)') AS nguon,
       (s.n ->> 'calendarVnd' IS NOT NULL) AS chup_co_lich,
       (sn.calendar_rate_vnd IS NOT NULL)  AS dem_co_lich,
       (sn.room_revenue_gross_vnd > 0)     AS co_tien,
       sn.night_state,
       count(*) AS so_dem, count(DISTINCT r.id) AS so_don
  FROM reservation r
  JOIN channel c     ON c.property_id = r.property_id AND c.id = r.channel_id
  JOIN stay_night sn ON sn.property_id = r.property_id AND sn.reservation_id = r.id
  LEFT JOIN LATERAL (
    SELECT x.n
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(r.pricing_snapshot -> 'nights') = 'array'
                                     THEN r.pricing_snapshot -> 'nights' ELSE '[]'::jsonb END) AS x(n)
     WHERE x.n ->> 'date' = to_char(sn.stay_date, 'YYYY-MM-DD')
     LIMIT 1) s ON true
 WHERE c.channel_group IN ('ota', 'internal') AND sn.rate_source <> 'lease_allocation'
 GROUP BY 1, 2, 3, 4, 5, 6, 7
 ORDER BY 1, 2, 3, 4, 5, 6, 7;
```

**Đúng là**, với đêm không void:
- OTA chỉ có các nhóm:
  - `calendar|t|t|t`: đường lịch OTA, đúng;
  - `manual|f|f|t`: lễ tân gõ;
  - `calendar|f|f|t`: bị dính, tổng phải bằng Q1.
- Nội bộ chỉ có các nhóm:
  - `complimentary|…|f`;
  - `manual|…`;
  - `calendar|…|f`: đổi ngày, 0 đ;
  - `default|…`: B13/B9a/B18;
  - `calendar|…|t`: bị dính.

**Dừng và báo BE nếu:**
- có nhóm `(khong co trong ban chup gia)` ở đêm không void;
- có OTA `calendar|t|f`, `calendar|f|t` hay `ota_amount`. Desk không tạo các nhóm này, nên dấu hiệu cần xem lại.

### 2.6 Q4 – theo dõi sau khi sửa

Quy ước: mọi lần sửa ghi lý do có chữ `BUG-R4-037`.

Q4 là khối dán nguyên (QA-037-01). So với bản QA chạy thử trước đó, Q4 có ba thay đổi:
- giờ in theo `Asia/Ho_Chi_Minh` (QA-037-03);
- thêm cột `kenh` và `noi_bo_dem_con_tien` (QA-037-02);
- thêm `LIMIT 200`.

**Cách chạy:** như khối Q5 ở mục 2.8.
- Mỗi khối là một lần gọi đầy đủ: tiền tố `SQLRO` có sẵn `statement_timeout=30s` và `lock_timeout=3s`, câu chốt phiên nằm ở đầu heredoc, CTE có sẵn.
- Người chạy dán **nguyên khối**, không ghép, không gõ lại.
- Staging: thay `/opt/ottimo-prod` bằng `/opt/ottimo`.
- QA chạy thử local: chỉ thay dòng `ssh`, giữ nguyên từng chữ phần trong heredoc.
- `-tA` không in tên cột. Thứ tự cột ghi dưới mỗi khối.

**Khối Q4 (dán nguyên):**

```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\''' <<'SQL'
SHOW default_transaction_read_only;
SHOW statement_timeout;
SHOW lock_timeout;
SELECT current_user, r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;
SELECT e.entity_code AS ma_don,
       CASE WHEN c.channel_group = 'internal' THEN 'internal' ELSE r.payment_model END AS kenh,
       count(*) AS so_lan_sua_gia,
       to_char(max(e.occurred_at) AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI') AS lan_cuoi_gio_vn,
       CASE WHEN c.channel_group = 'internal' THEN
         (SELECT count(*) FROM stay_night sn
           WHERE sn.reservation_id = r.id AND sn.night_state <> 'void'
             AND sn.rate_source = 'short_stay_rate' AND sn.room_revenue_gross_vnd > 0)
       END AS noi_bo_dem_con_tien
  FROM audit_event e
  JOIN reservation r ON r.id::text = e.entity_id
  JOIN channel c     ON c.property_id = r.property_id AND c.id = r.channel_id
 WHERE e.entity_type = 'reservation' AND e.action = 'reservation.repriced'
   AND e.reason ILIKE '%BUG-R4-037%'
 GROUP BY e.entity_code, r.id, r.payment_model, c.channel_group
 ORDER BY 1
 LIMIT 200;
SQL
```

Kết quả:
- 4 dòng đầu là `on`, `30s`, `3s`, `ottimo_readonly|t|f`.
- Rồi tới mỗi đơn đã sửa một dòng, cột theo thứ tự: `ma_don|kenh|so_lan_sua_gia|lan_cuoi_gio_vn|noi_bo_dem_con_tien`.
- `lan_cuoi_gio_vn` là giờ Việt Nam, dạng `YYYY-MM-DD HH24:MI`.
- `noi_bo_dem_con_tien`: chỉ có với đơn Nội bộ. Là số đêm còn hiệu lực có tiền > 0 (gross > 0, `short_stay_rate`). Đơn OTA để trống.
- **Đúng là:** trước khi sửa thì không có dòng đơn nào.

**Dừng và báo BE nếu:**
- 4 dòng chốt phiên khác giá trị trên;
- ra đủ 200 dòng;
- có lỗi, kể cả `permission denied`.

Q4 có mã đơn, nên áp SEC 3 (c), (d) như Q2.

**Sau khi sửa, chạy lại Q2.**
- Đơn đã sửa hết đêm thì rời danh sách, trừ đơn ở nhóm B, C, D.
- **Nhóm `A-` (Nội bộ) cũng rời Q2 sau A31, nhưng tiền vẫn chưa đúng** (QA-037-02):
  - A31 không cho giá 0, nên đêm được sửa thành một số > 0 và nguồn đổi sang `manual`;
  - vì vậy đơn rời Q1/Q2, dù vẫn còn tiền.
- Không coi đơn Nội bộ rời Q2 là đã xong. Đơn Nội bộ chỉ xong khi `noi_bo_dem_con_tien` của Q4 = 0, tức đã sửa bằng PA B (mục 3.2).
- Đơn Nội bộ sửa bằng A31 mà **không** ghi `BUG-R4-037` trong lý do sẽ không hiện ở Q4. Đơn đó vẫn đếm được ở Q3, nhóm `internal|direct|manual|f|f|t|sold`.
  - Nhóm này cũng gồm đơn Nội bộ cố ý có thu, nên DOM xem từng đơn.
  - Vì vậy bắt buộc ghi `BUG-R4-037` trong lý do.

### 2.7 Giới hạn

- Câu chưa chạy ở đâu cả.
- Tham số `ota_base_rate` lấy theo cột `config_parameter.value` (đối tượng `{mã nhóm căn: số}`), đúng như `PricingService.load`.
- `DISTINCT ON` chọn đêm còn hiệu lực trước đêm void cùng ngày của cùng một đơn.

### 2.8 Q5 – đơn Nội bộ có đêm thêm lấy giá Trực tiếp (lỗi P2 DOM, ngoài 037)

Q5 thêm theo yêu cầu ORC 04/11. Q0–Q4 giữ nguyên.

**Dấu hiệu, đọc mã trên `main`:**
- B13, B9a, B18 trên đơn Nội bộ ghi đêm thêm qua `writeRepricedNights`, với giá từ `addedNightRate` (giá lịch Trực tiếp).
- Đêm đó có:
  - `stay_night.rate_source = 'extension'` (B13) hoặc `'extra_night_early_late'` (B9a, B18);
  - nguồn trong bản chụp giá là `default`, hoặc `manual` nếu lễ tân gõ;
  - gross > 0.
- B9a là đêm trước ngày đến lúc đặt (`booked_arrival_date`). B18 là đêm sau.
- Q5 không trùng Q1/Q2. Q1/Q2 chỉ lấy đêm `short_stay_rate` nguồn `calendar`.

**Cột `manual` chỉ để tham khảo.** Lễ tân không gõ được 0 (`AMOUNT_NOT_POSITIVE`), cũng không gõ được dưới sàn Trực tiếp. Vì vậy một đêm `manual` > 0 có thể là cố ý thu, hoặc là bị buộc gõ một số. Nguồn này cũng có thể do sửa bằng A31 về sau. DOM xem từng đơn.

**Điều kiện chạy (SEC):**
- Khối `SQLRO` với `PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s"`.
- Không chạy khi `deploy.sh`/`migrate` đang chạy.
- QA chạy thử trên stack local trước.
- Không có cột dữ liệu khách hay số tiền.
- Chỉ chạy Q5b khi dòng `TOTAL` của Q5a có `so_don_default` > 0.
- Kết quả Q5b theo đúng điều kiện 3 (c), (d) của SEC: chỉ trên màn hình và trong chat với INV; repo chỉ ghi số đếm.

**Cách chạy (S1, SEC điều kiện Q5 (a), (b), (d)):**
- Mỗi khối dưới đây là **một lần gọi đầy đủ**. Khối có sẵn tiền tố `SQLRO` của runbook v1.0.4 mục 2, với `PGOPTIONS` thêm `statement_timeout=30s` và `lock_timeout=3s`. Câu chốt phiên nằm ở đầu heredoc; Q5b có sẵn CTE.
- Người chạy dán **nguyên khối**, không ghép, không gõ lại.
- Q5a và Q5b chạy bằng **hai lần gọi riêng**. Chỉ gọi Q5b sau khi đã đọc dòng `TOTAL` của Q5a.
- Staging: thay `/opt/ottimo-prod` bằng `/opt/ottimo`.
- QA chạy thử trên local: chỉ thay dòng đầu (lệnh `ssh …`) bằng lệnh `psql` của stack local, với cùng `PGOPTIONS` và cùng `-X -v ON_ERROR_STOP=1 -tA`. Giữ nguyên từng chữ phần từ dòng sau `<<'SQL'` tới dòng `SQL`.
- `-tA` không in tên cột. Thứ tự cột ghi ngay dưới mỗi khối.

**Khối Q5a – chỉ số đếm (dán nguyên):**

```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\''' <<'SQL'
SHOW default_transaction_read_only;
SHOW statement_timeout;
SHOW lock_timeout;
SELECT current_user, r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;
WITH added AS (
  SELECT DISTINCT ON (r.id, sn.stay_date)
         r.id AS reservation_id,
         CASE WHEN sn.rate_source = 'extension' THEN 'B13'
              WHEN sn.stay_date < COALESCE(r.booked_arrival_date, r.arrival_date) THEN 'B9a'
              ELSE 'B18' END AS buoc,
         s.n ->> 'source' AS nguon,
         sn.stay_date,
         to_char(sn.stay_date, 'YYYY-MM') AS thang,
         (sn.created_at >= TIMESTAMPTZ '2026-11-02 00:00:00+07') AS tu_ngay_d,
         sn.night_state
    FROM reservation r
    JOIN channel c     ON c.property_id = r.property_id AND c.id = r.channel_id
    JOIN stay_night sn ON sn.property_id = r.property_id AND sn.reservation_id = r.id
    CROSS JOIN LATERAL (
      SELECT x.n
        FROM jsonb_array_elements(CASE WHEN jsonb_typeof(r.pricing_snapshot -> 'nights') = 'array'
                                       THEN r.pricing_snapshot -> 'nights' ELSE '[]'::jsonb END) AS x(n)
       WHERE x.n ->> 'date' = to_char(sn.stay_date, 'YYYY-MM-DD')
       LIMIT 1) s
   WHERE c.channel_group = 'internal'
     AND sn.rate_source IN ('extension', 'extra_night_early_late')
     AND sn.room_revenue_gross_vnd > 0
     AND s.n ->> 'source' IN ('default', 'manual')
   ORDER BY r.id, sn.stay_date, (sn.night_state = 'void'), sn.updated_at DESC
)
SELECT COALESCE(buoc, 'TOTAL') AS thao_tac,
       COALESCE(thang, 'ALL')  AS thang_dem,
       count(DISTINCT reservation_id) FILTER (WHERE nguon = 'default') AS so_don_default,
       count(*) FILTER (WHERE nguon = 'default' AND night_state <> 'void') AS dem_default,
       count(*) FILTER (WHERE nguon = 'default' AND night_state <> 'void' AND tu_ngay_d) AS dem_default_tu_ngay_d,
       count(*) FILTER (WHERE nguon = 'default' AND night_state = 'void') AS dem_default_da_huy,
       count(DISTINCT reservation_id) FILTER (WHERE nguon = 'manual') AS so_don_go_tay,
       count(*) FILTER (WHERE nguon = 'manual' AND night_state <> 'void') AS dem_go_tay
  FROM added
 GROUP BY ROLLUP (buoc, thang)
 ORDER BY grouping(buoc) DESC, buoc, grouping(thang) DESC, thang
 LIMIT 200;
SQL
```

Kết quả:
- 4 dòng đầu là `on`, `30s`, `3s`, `ottimo_readonly|t|f`.
- Rồi tới các dòng đếm, cột theo thứ tự: `thao_tac|thang_dem|so_don_default|dem_default|dem_default_tu_ngay_d|dem_default_da_huy|so_don_go_tay|dem_go_tay`.
- **Dòng đếm đầu tiên luôn là `TOTAL|ALL|…`** (S2). Sau đó là từng bước (`B13`, `B18`, `B9a`): dòng tổng `…|ALL|…` trước, rồi tới từng tháng.
- Cột `dem_default_tu_ngay_d` đếm đêm được ghi từ ngày D 02/11, tức dữ liệu thật.

**Dừng, không chạy Q5b, báo BE nếu:**
- 4 dòng chốt phiên khác giá trị trên;
- dòng đếm đầu tiên không phải `TOTAL|ALL|…`, hoặc không có dòng `TOTAL` nào;
- có đủ 200 dòng đếm;
- có lỗi, kể cả `permission denied`. Không chạy lại bằng vai quản trị.

Chỉ gọi Q5b khi cột thứ 3 (`so_don_default`) của dòng `TOTAL` > 0. Repo chỉ được ghi kết quả Q5a (SEC điều kiện Q5 (e)).

**Khối Q5b – mã đơn, chỉ khi `so_don_default` của `TOTAL` > 0 (dán nguyên, lần gọi riêng):**

```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\''' <<'SQL'
SHOW default_transaction_read_only;
SHOW statement_timeout;
SHOW lock_timeout;
SELECT current_user, r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;
WITH added AS (
  SELECT DISTINCT ON (r.id, sn.stay_date)
         r.id AS reservation_id,
         CASE WHEN sn.rate_source = 'extension' THEN 'B13'
              WHEN sn.stay_date < COALESCE(r.booked_arrival_date, r.arrival_date) THEN 'B9a'
              ELSE 'B18' END AS buoc,
         s.n ->> 'source' AS nguon,
         sn.stay_date,
         to_char(sn.stay_date, 'YYYY-MM') AS thang,
         (sn.created_at >= TIMESTAMPTZ '2026-11-02 00:00:00+07') AS tu_ngay_d,
         sn.night_state
    FROM reservation r
    JOIN channel c     ON c.property_id = r.property_id AND c.id = r.channel_id
    JOIN stay_night sn ON sn.property_id = r.property_id AND sn.reservation_id = r.id
    CROSS JOIN LATERAL (
      SELECT x.n
        FROM jsonb_array_elements(CASE WHEN jsonb_typeof(r.pricing_snapshot -> 'nights') = 'array'
                                       THEN r.pricing_snapshot -> 'nights' ELSE '[]'::jsonb END) AS x(n)
       WHERE x.n ->> 'date' = to_char(sn.stay_date, 'YYYY-MM-DD')
       LIMIT 1) s
   WHERE c.channel_group = 'internal'
     AND sn.rate_source IN ('extension', 'extra_night_early_late')
     AND sn.room_revenue_gross_vnd > 0
     AND s.n ->> 'source' IN ('default', 'manual')
   ORDER BY r.id, sn.stay_date, (sn.night_state = 'void'), sn.updated_at DESC
)
SELECT r.code AS ma_don, r.status AS trang_thai_don, f.status AS trang_thai_folio,
       CASE
         WHEN r.status IN ('cancelled', 'no_show') THEN 'D - don huy/no-show'
         WHEN f.status = 'closed' OR (f.status = 'settled' AND f.post_checkout_window_until <= now())
           THEN 'C - folio da khoa'
         WHEN r.status = 'checked_out' THEN 'B - MGR/OWN sua dong folio (A32)'
         ELSE 'A- - dang o: khong thu tien, bao quan ly truoc khi tra phong'
       END AS duong_sua,
       string_agg(DISTINCT a.buoc, ',') AS thao_tac,
       count(*) FILTER (WHERE a.nguon = 'default' AND a.night_state <> 'void') AS dem_default,
       count(*) FILTER (WHERE a.nguon = 'manual' AND a.night_state <> 'void') AS dem_go_tay,
       min(a.stay_date) AS dem_dau, max(a.stay_date) AS dem_cuoi,
       bool_or(a.tu_ngay_d) AS co_dem_tu_ngay_d,
       (SELECT string_agg(DISTINCT u.role, ',') FROM user_property_role u
         WHERE u.user_id = r.created_by AND u.property_id = r.property_id AND u.revoked_at IS NULL) AS vai_nguoi_tao
  FROM added a
  JOIN reservation r ON r.id = a.reservation_id
  JOIN folio f       ON f.property_id = r.property_id AND f.id = r.folio_id
 GROUP BY r.id, r.code, r.status, r.created_by, r.property_id, f.status, f.post_checkout_window_until
HAVING count(*) FILTER (WHERE a.nguon = 'default') > 0
 ORDER BY duong_sua, dem_dau, ma_don
 LIMIT 200;
SQL
```

Kết quả:
- 4 dòng chốt phiên như Q5a.
- Rồi tới mỗi đơn một dòng, cột theo thứ tự: `ma_don|trang_thai_don|trang_thai_folio|duong_sua|thao_tac|dem_default|dem_go_tay|dem_dau|dem_cuoi|co_dem_tu_ngay_d|vai_nguoi_tao`.
- **Đúng là:** số dòng đơn bằng `so_don_default` của dòng `TOTAL` ở Q5a.

**Dừng và báo BE nếu:**
- 4 dòng chốt phiên khác giá trị trên;
- ra đủ 200 dòng đơn;
- số dòng đơn khác `so_don_default` của Q5a.

Kết quả Q5b chỉ hiện trên màn hình người chạy và trong chat với INV (SEC 3 (c)). Repo chỉ ghi số đơn theo từng `duong_sua`, không ghi mã đơn, đêm đầu/cuối hay `vai_nguoi_tao`.

**Đường sửa:** như bảng 3.1. Lưu ý DOM: Desk chưa đưa đêm thêm của đơn Nội bộ về 0 đ được, nên làm tạm theo DOM (không thu tiền người ở, báo quản lý). Bản sửa mã v1.0.5 cần có hướng gỡ dữ liệu; BE nêu khi làm.

## 3. Đường sửa dữ liệu không dùng SQL tay

### 3.1 Trong Desk hiện tại

Thao tác: Desk → mở đơn (khung đơn) → **Folio & điều chỉnh** → dòng tiền phòng của đêm → **Điều chỉnh** → nhập giá mới (giá đêm trước bậc giảm) + lý do (≥ 3 ký tự).
- API là `adjustFolioLine`, `x-roles: [owner, manager, front_desk_lead, front_desk]`, `x-rbac: [A31, A32]`.
- Nút có cho FD+ khi trực tuyến, đơn có folio và không ở trạng thái giữ chỗ.

| Trạng thái đơn / folio | Ai sửa được | Máy chủ làm gì | Audit | Còn thiếu |
|---|---|---|---|---|
| `confirmed` / `in_house`, folio `open` (nhóm A) | FD, FDL, MGR, OWN (A31) | `StayNightPricingPort.setNightRate` trong cùng giao dịch: `stay_night` gross/net = giá mới (OTA, Nội bộ: không bậc giảm; `calendar_rate_vnd` giữ NULL); đêm trong bản chụp giá thành `manual`; `total_room_vnd` tính lại; rồi đảo dòng folio, ghi dòng mới, đồng bộ lại biên nhận `ota_collect` | `reservation.repriced` (tiền: trước/sau `nightlyRates`, lý do) + `folio_line.adjusted` (tiền) + bút toán đảo | (1) **Nội bộ không về 0 đ được**: `adjust` từ chối `newUnitPriceVnd ≤ 0` (`AMOUNT_NOT_POSITIVE`). (2) OTA: giá mới phải trong sàn–trần BR-105 của nhóm căn, nếu không thì 422 `RATE_OUT_OF_RANGE`. (3) `channel_fee` không tính lại: `syncChannelFee` chỉ chạy trong `syncStay`, `adjust` không gọi. Cần BE-B xác nhận. (4) `reference_rate_vnd` giữ số sai theo thiết kế (BR-433 (d): sửa tay không đổi gốc hạn mức). (5) Mỗi đêm một lần thao tác, đêm thành `manual` (đúng ý, theo dõi bằng Q4) |
| `checked_out`, folio `settled`, còn trong cửa sổ sau trả phòng (nhóm B) | **Chỉ MGR, OWN** (A32) | `setNightRate` **không** chạy, vì đơn không còn ở trạng thái đồng bộ đêm. Chỉ đảo và ghi lại dòng folio | `folio_line.adjusted` (tiền); giảm trên folio đã chốt còn ghi phần miễn (BR-433 (e)) | `stay_night`, bản chụp giá, `total_room_vnd`, `channel_fee` **không đổi**, nên doanh thu, ADR và báo cáo đọc từ `stay_night` vẫn sai. Giảm tiền có thể sinh yêu cầu hoàn (overpayment, cần người duyệt khác) và bị giới hạn công nợ BR-525 N-7. Nội bộ vẫn không về 0 |
| Folio `closed`, hoặc `settled` đã quá `post_checkout_window_until` (nhóm C) | Không ai | 409 `FOLIO_LOCKED` cho mọi vai | – | Không có đường trong app. Điều chỉnh sau đóng chờ hóa đơn điều chỉnh (hợp đồng 0.3.7 bổ sung 4) |
| `cancelled` / `no_show` (nhóm D) | – | Đêm đã void, dòng phòng đã đảo. Phí giữ lại tính từ cọc: OTA và Nội bộ không có cọc, nên 0. Phí phạt OTA do lễ tân nhập, chỉ bị chặn trên bởi `total_room_vnd` | – | Thường không lệch tiền folio. Đêm void vẫn mang số sai, nên chỉ số đơn hủy bị lệch. Kiểm từng đơn có dòng phí |

Các đường khác trong app, **không khuyến nghị**:
- **Đề nghị miễn (FOC) dòng tiền phòng của đơn Nội bộ.** Cần duyệt, trừ vào hạn mức FOC (BR-433) và vào báo cáo FOC. Sai nghĩa, vì Nội bộ không phải miễn phí.
- **Hủy rồi đặt lại** đơn Nội bộ chưa nhận phòng, sau khi bản sửa FE lên. Sạch về tiền nhưng làm lệch chỉ số hủy.
  - Không dùng cho OTA: đơn mới mang mã đơn khác cho cùng một đặt phòng OTA, nên rối đối soát với OTA. Chỉ số hủy của kênh cũng bị lệch.

### 3.2 Phương án cho PO, ARC, SEC chọn

| PA | Mô tả | Ưu | Nhược | Ai làm |
|---|---|---|---|---|
| **A – Làm tay trên Desk** | Nhóm A: MGR/OWN dùng **Điều chỉnh**, lý do "BUG-R4-037 …". Nhóm B: MGR/OWN sửa dòng folio trong cửa sổ. Nhóm C, D: chỉ ghi biên bản | Không cần mã, có audit sẵn, làm ngay được | Nội bộ không về 0; `channel_fee` và `reference_rate_vnd` vẫn sai; đơn đã trả phòng vẫn sai báo cáo; nhiều thao tác nếu nhiều đêm | MGR/OWN, QA kiểm bằng Q2/Q4 |
| **B – Công cụ sửa một lần trong mã máy chủ** (BE đề xuất nếu Q2 có đơn thật) | Lệnh bảo trì TypeScript trong `services/api`, chạy trong container api bằng `ottimo_app` với ngữ cảnh cơ sở (RLS bật), gọi đúng các service: (1) đầu vào là danh sách mã đơn + đêm + giá đích MGR/INV đã duyệt (tệp không PII, không vào repo); (2) **mặc định chạy thử**: in mã đơn, đêm, số đang ghi, số đích (OTA: `PricingService.price()` kênh OTA không giá gửi lên = đúng số BUG-R2-017 sẽ ra, hoặc số sao kê nếu PO/DOM chọn), chênh; không ghi gì; (3) `--apply` + mã xác nhận: mỗi đơn một giao dịch; bỏ qua đêm không còn khớp dấu hiệu, nên chạy lại an toàn; nhóm A qua `setNightRate` + `adjust` + `resyncStay` (tính lại `channel_fee`); Nội bộ về `complimentary` 0 đ qua một cổng nội bộ mới (ARC chốt); nhóm C chỉ sửa số báo cáo (`stay_night`, bản chụp giá, `reference_rate_vnd`), **không** đụng folio đã đóng; (4) mỗi đêm ghi audit tiền `reservation.repriced`, người thực hiện là OWN được chỉ định, lý do cố định | Sửa đủ mọi bảng mà vẫn giữ bất biến của folio, `ota_collect` và audit; kiểm được bằng test; có chế độ thử | Cần code, review và test (ước 1–1,5 ngày BE + ARC/SEC review + QA); phải mở cổng cho Nội bộ về 0 | ARC thiết kế, BE code, SEC review quyền và log, DOM/PO chốt giá đích, QA test (dựng ca tái hiện trên stack local), INV duyệt trước khi chạy production |
| **C – Migration dữ liệu SQL có review** (khuôn 0064/0068) | Một migration viết tay sửa trực tiếp các bảng | Một bước, đi theo deploy | **Không dùng cho tiền.** Migration chạy `ottimo_owner` và tắt RLS. `folio_line`, `audit_event` chỉ cho thêm, không sửa. Đi đường này là bỏ qua bất biến folio, `ota_collect`, reductions và audit tiền. 0064/0068 chỉ ghi bản chụp giá, "No amount changes". Chỉ hợp nếu cần đánh dấu báo cáo, ví dụ thêm cờ `bug037` vào bản chụp giá để DATA lọc | ARC, SEC |
| **D – Không sửa dữ liệu** | Nếu Q2 chỉ có đơn thử (tạo trước ngày D 02/11): ghi biên bản số đếm, hủy hoặc bỏ qua đơn thử theo PO | Không rủi ro | Đơn thử sai giá còn lại trong báo cáo, nếu không hủy | PO/ORC |

**BE đề xuất:**
- Sau khi hotfix FE lên, chạy Q0–Q3.
- Q2 = 0 hoặc chỉ có đơn thử (tạo trước 02/11) → **D**. Đơn thử còn mở thì hủy với lý do ghi rõ, tùy PO.
- Có đơn thật, chỉ ở nhóm A và không có Nội bộ → **A**.
- Có đơn thật ở nhóm B/C hoặc có Nội bộ → **B**, kèm ESC trình INV (mục 4).
- **Không chọn C cho tiền.**

## 4. ESC và giả định

**ESC: chưa tạo**, vì chưa có số liệu. Production vận hành thật từ ngày D 02/11, nên mọi đơn tạo từ 02/11 là đơn thật.

ORC mở ESC "Gấp" khi Q2 có đơn tạo từ 02/11, hoặc khi INV xác nhận một đơn tạo trước đó là đơn thật. Nội dung gợi ý:
- Câu hỏi: đơn OTA/Nội bộ bị ghi giá Trực tiếp thì sửa theo số nào, và có báo khách không.
- PA1: OTA sửa theo giá lịch OTA của hệ thống, Nội bộ về 0 đ.
- PA2: OTA sửa theo sao kê OTA từng đơn.
- PA3: giữ số đã thu với khách đã trả phòng, chỉ sửa số báo cáo.
- Với khách OTA trả tại khách sạn đã bị thu sai: hoàn hoặc thu thêm là chính sách tiền của INV.
- Đội đề xuất: PA2 cho đơn có sao kê, PA1 cho đơn còn lại. Khách đã trả phòng: INV quyết từng đơn.

**Giả định đã dùng:**
1. Production chỉ chạy các bản `v1.0.0-rc.1` … `v1.0.3` (decision-log 26/10–04/11), và cơ sở dữ liệu production dựng mới từ rc.1 (`production-bootstrap`). Không có dữ liệu từ trước 18/10. Không chuyển dữ liệu cũ sang (INV 01/11). Từ 26/10 tới 01/11 chỉ có đơn thử; **dữ liệu thật có từ ngày D 02/11** (decision-log 01/11, sửa theo ORC 04/11).
2. Chỉ Desk `BookingDialog` gửi `nightlyRates` có cờ `edited` cho OTA/Nội bộ. Đã rà `apps/*/src` và `integrations`: không có nơi khác gọi `createReservation` với giá đêm.
3. Theo DOM/BUG-R2-017, giá đúng của đơn OTA không gõ giá là giá lịch OTA của nhóm căn. Giá đích thật (lịch OTA hay sao kê OTA) do PO/DOM chốt.
4. Nhận định "`adjust` không tính lại `channel_fee`" dựa trên đọc mã (`syncChannelFee` chỉ được gọi trong `syncStay`). BE-B cần xác nhận trước khi chọn PA A.
5. Mục 1.8 chỉ là quan sát khi đọc mã, chưa có bằng chứng chạy.

## SEC review (04/11/2026, hotfix P0 BUG-R4-037, trước khi chạy trên production)

**Kết luận: ĐẠT CÓ ĐK.** Q0, Q1, Q3 được chạy. Q2 và Q4 được chạy kèm điều kiện. Căn cứ: runbook v1.0.4 mục 2 (khối `SQLRO`), `02-roles.sh` trên `main`.

1. **Chỉ đọc: đạt.**
   - Q0–Q4 chỉ có `SHOW` và `SELECT`.
   - CTE (`WITH hit`, `priced`) không chứa `INSERT`, `UPDATE`, `DELETE`.
   - Không có `FOR UPDATE`/`FOR SHARE`, không có `SET`/`RESET ROLE`.
   - Không gọi hàm có tác dụng phụ (`nextval`, `set_config`, `pg_advisory_*`, `dblink`, `lo_*`, `COPY`). Hàm dùng trong câu (`jsonb_array_elements`, `to_char`, `string_agg`, `now()`) không ghi gì.
   - Khối `SQLRO` thêm hai lớp chặn: `default_transaction_read_only=on`, và vai `ottimo_readonly` chỉ có `SELECT`, không có `TEMPORARY`.
   - `-c role=` không phải ranh giới bảo mật (SEC P404R1-S1). Vì vậy chỉ dán đúng các câu trong tệp này, đưa vào bằng heredoc `<<'SQL'`, giữ `ON_ERROR_STOP=1`. Gặp `permission denied` thì dừng, không chạy lại bằng vai quản trị.
2. **Dữ liệu khách: không lộ.**
   - Không câu nào chọn tên, liên hệ, giấy tờ, `ota_ref`, `internal_note` hay `audit_event.reason`. Q4 chỉ dùng `reason` trong `WHERE`.
   - `vai_nguoi_tao` chỉ là vai, không có id hay tên.
   - Điều kiện: số tiền (`tien_dang_ghi_vnd`, `noi_bo_thua_vnd`, `ota_chenh_uoc_tinh_vnd`, `gia_tung_dem`) là doanh thu thật của cơ sở. Các số này **không vào repo công khai**. Repo chỉ ghi các cột đếm của Q1/Q3 (`so_don`, `dem_*`, `so_dem`), tức là sửa ý "Kết quả Q1 được dán vào báo cáo trong repo" ở mục 2.1.
3. **Q2 (và Q4) có mã đơn: chấp nhận, kèm điều kiện.**
   - Lý do chấp nhận: mã đơn là mã nội bộ, không chứa danh tính khách. Desk lại không có bộ lọc theo dấu hiệu này, nên "chỉ đếm rồi MGR tự lọc" buộc MGR mở từng đơn OTA/Nội bộ, dễ sót. Danh sách mã đơn là ngoại lệ có chủ đích của luật "chỉ ra con số" ở runbook, chỉ cho lần tra sự cố này.
   - Điều kiện:
     - (a) Chỉ chạy Q2 khi dòng `TOTAL` của Q1 có `so_don` > 0.
     - (b) Thêm `LIMIT 200` vào cuối Q2. Nếu ra đủ 200 dòng, hoặc số dòng khác `so_don` của Q1, thì dừng và báo BE.
     - (c) Kết quả chỉ hiện trên màn hình người chạy và trong chat với INV. Không chép vào tệp, repo, commit, ESC, decision-log, Google Chat hay ảnh chụp. Sổ giao ca chỉ ghi mã đơn khi MGR sửa từng đơn.
     - (d) Trong repo chỉ ghi số đơn theo từng `duong_sua` (A, A-, B, C, D).
4. **Tải và khóa: rủi ro thấp, kèm điều kiện.**
   - `SELECT` chỉ lấy `AccessShareLock`, nên không chặn app ghi. Dữ liệu nhỏ: 10 căn, từ 26/10.
   - Điều kiện:
     - (a) Lần chạy này thêm vào `PGOPTIONS`: `-c statement_timeout=30s -c lock_timeout=3s`. `SET` được phép trong giao dịch READ ONLY.
     - (b) Không chạy khi `deploy.sh`/`migrate` đang chạy. Câu đọc dài giữ khóa có thể làm migration phải chờ lấy `ACCESS EXCLUSIVE`, và khi đó mọi câu của app xếp hàng sau migration.
     - (c) Đồng ý với khuyến nghị của BE: QA chạy thử Q0–Q4 trên stack local trước, vì các câu chưa được phân tích cú pháp lần nào.
   - Không có ESC.

**Q5 (04/11): ĐẠT CÓ ĐK.** Q5a và Q5b ở mục 2.8 được chạy trên production, theo các điều kiện dưới đây. Q0–Q4 và kết luận trên giữ nguyên. Căn cứ: mục 2.8, runbook v1.0.4 mục 2 (khối `SQLRO`), `product/infra/server/README.md` mục 13.8, schema trên `main` (`reservations.ts`, `folio.ts`, `identity.ts`). Mọi cột Q5 dùng đều có trong schema.

1. **Chỉ đọc: đạt.**
   - Chốt phiên Q5 chỉ có `SHOW` và một `SELECT` trên `pg_roles`. Q5a, Q5b chỉ có `SELECT`; CTE `added` không có câu ghi.
   - Không có `FOR UPDATE`/`FOR SHARE`, `SET`/`RESET ROLE`, `SESSION AUTHORIZATION`, `set_config`, `READ WRITE`, `COPY`.
   - Hàm dùng: `jsonb_typeof`, `jsonb_array_elements`, `to_char`, `COALESCE`, `count`, `min`, `max`, `bool_or`, `string_agg`, `now()`. Không hàm nào ghi, và câu chỉ lấy `AccessShareLock`.
   - Chốt phiên Q5 kiểm thêm `statement_timeout` và `lock_timeout`, chặt hơn Q0. Giữ.
2. **Dữ liệu khách và số tiền: đạt.**
   - Q5a chỉ có số đếm.
   - Q5b có mã đơn, trạng thái đơn và folio, `duong_sua`, bước, số đêm, đêm đầu/cuối, cờ ngày D, vai người tạo.
   - Không có tên, liên hệ, giấy tờ, `ota_ref`, `internal_note`, `audit_event.reason`. Không có cột tiền: `room_revenue_gross_vnd` chỉ nằm trong `WHERE`. `r.id`, `r.created_by` chỉ dùng trong `GROUP BY` và câu con, không chọn ra.
   - Mã đơn cùng đêm đầu/cuối là lịch ở của người dùng phòng Nội bộ (người nhà, nhân viên). Cùng loại với Q2, nên áp điều kiện 3 (c), (d).
3. **LIMIT: đạt.** Q5a và Q5b đều có `LIMIT 200`. Q5b chỉ chạy khi `so_don_default` của dòng `TOTAL` > 0, và có hai điều kiện dừng (đủ 200 dòng, lệch số đơn với Q5a). Khớp điều kiện 3 (a), (b).
4. **Điều kiện cũ: áp đúng.** `PGOPTIONS` của mục 2.8 có đủ bốn tham số (`default_transaction_read_only=on`, `role=ottimo_readonly`, `statement_timeout=30s`, `lock_timeout=3s`), khớp 4 (a). Có 4 (b) (không chạy khi `deploy.sh`/`migrate` chạy) và 4 (c) (QA chạy thử local). Kết quả Q5b theo 3 (c), (d).

**Điều kiện chạy Q5 (thêm vào điều kiện của mục 2.8):**
- (a) Mỗi lần gọi khối `SQLRO` là một phiên mới. Đặt câu chốt phiên Q5 ở đầu **mỗi** heredoc: một lần cho Q5a, một lần cho Q5b. Kết quả khác `on`, `30s`, `3s`, `ottimo_readonly|t|f` thì dừng.
- (b) Q5b chạy bằng heredoc riêng, sau khi người chạy đã đọc dòng `TOTAL` của Q5a. Không dán Q5a và Q5b trong cùng một lần gọi.
- (c) Q5a ra đủ 200 dòng, hoặc không có dòng `TOTAL`, thì dừng, không chạy Q5b, báo BE. Thẻ S2.
- (d) Giữ điều kiện 1: heredoc `<<'SQL'`, `ON_ERROR_STOP=1`, chỉ dán đúng văn bản đã được review. Gặp `permission denied` thì dừng, không chạy lại bằng vai quản trị.
  - Q5b phải ghép tay khối `WITH added AS (…)` của Q5a (thẻ S1). Vì vậy QA chạy thử trên local **đúng khối Q5b đã ghép** sẽ dán lên production, và người chạy dán nguyên khối đó, không gõ lại.
- (e) Repo được ghi kết quả Q5a (chỉ số đếm) và số đơn Q5b theo từng `duong_sua`. Không ghi mã đơn, đêm đầu/cuối, `vai_nguoi_tao` theo từng đơn.

### FB-R4-SEC-BE-037Q5-S1
- Mức độ: Minor
- Vị trí: `rounds/round-04/outputs/BE/bug-r4-037-data-impact.md` mục 2.8, Q5b ("Khối `WITH added AS (…)` chép nguyên từ Q5a")
- Vấn đề: người chạy phải tự ghép CTE của Q5a vào Q5b ngay trên máy quản trị production. Câu ghép tay không còn là văn bản đã được review, trong khi luật SEC P404R1-S1 là chỉ dán đúng câu trong tệp.
- Vì sao quan trọng: lớp READ ONLY vẫn chặn ghi, nên ghép sai chỉ làm câu lỗi hoặc ra số sai. Nhưng đây đúng là loại lỗi vô ý mà khối `SQLRO` muốn tránh, và bản QA chạy thử có thể khác bản dán lên production.
- Đề xuất sửa: BE viết Q5b thành một khối đầy đủ, tự đủ (gồm cả CTE), để dán nguyên. Tới khi có, áp điều kiện chạy Q5 (d).
- Trạng thái: Open

### FB-R4-SEC-BE-037Q5-S2
- Mức độ: Suggestion
- Vị trí: mục 2.8, Q5a, `ORDER BY grouping(buoc), … LIMIT 200`
- Vấn đề: dòng `TOTAL` đứng cuối. Nếu Q5a ra đủ 200 dòng thì `TOTAL` bị cắt, mà cổng chạy Q5b đọc dòng này. Thực tế khó xảy ra (3 bước × số tháng, cộng dòng tổng phụ).
- Vì sao quan trọng: thiếu dòng `TOTAL` thì người chạy có thể đọc nhầm sang dòng tổng phụ và mở Q5b sai cổng.
- Đề xuất sửa: thêm vào "Dừng và báo BE" của Q5: Q5a ra đủ 200 dòng hoặc không có dòng `TOTAL`. Tới khi có, áp điều kiện chạy Q5 (c).
- Trạng thái: Open

- Không có ESC cho Q5.

## DOM (04/11 tối) – trả lời mục 1.8, ý 1 (B13 gia hạn đơn Nội bộ; đọc mã `stay.service.ts` B13 `options`/`extend`, `stay-support.ts` `addedNightContext`/`addedNightRate` trên main @ `c2506a53`)

- **Sai nghiệp vụ, không phải ý muốn.** Kênh Nội bộ là phòng dùng nội bộ, không thu tiền: lúc tạo đơn cho giá 0 và đặt `is_complimentary` (EP02 mục kênh Nội bộ; `metrics-definitions.md` Q-05; BR-904/D-7), và B7 thêm đêm cũng ra 0 đ. B13 lại không có nhánh `internal` nên lấy giá lịch Trực tiếp. Hai lỗi cùng gốc `addedNightRate` là đêm B9a và đêm thêm của B18. Đúng phải là: đêm thêm của đơn Nội bộ mặc định 0 đ, đánh dấu `complimentary`, không áp sàn và trần giá Trực tiếp, cho gõ 0. Ca hiếm "Nội bộ có thu" thì lễ tân gõ giá > 0 (`manual`).
- **Mức P2: sai tiền nội bộ và sai báo cáo, không đụng tiền khách thật.** Folio đơn Nội bộ hiện **Còn phải thu** = giá Trực tiếp × số đêm thêm. Hoặc Hoàn tất trả phòng bị chặn, hoặc lễ tân thu nhầm của người nhà hay nhân viên. Doanh thu phòng và ADR bị cộng một đêm lẽ ra là đêm miễn phí. Trên Desk không đưa về 0 được: B13 trả `AMOUNT_NOT_POSITIVE` khi gõ 0 và `RATE_OUT_OF_RANGE` khi gõ dưới sàn Trực tiếp; A31 cũng chặn 0. Theo INV 01/11 production chưa vận hành, nên dữ liệu thật nhiều khả năng chưa dính. BE nên thêm vào Q2 ca "đơn Nội bộ có đêm nguồn `default` mà gross > 0" để chắc chắn.
- **Đề xuất sửa ở v1.0.5**: BE thêm nhánh `internal` ở `addedNightRate` và B13 `options`/`extend`, ARC và QA cùng vòng. Không kéo vào v1.0.4, vì ca hiếm, không có tiền khách thật, và bản cắt 06/11 đang mang P1. Ngoại lệ: bản sửa 037 đụng cùng đoạn giá Nội bộ thì gộp luôn (ARC quyết). Tới khi sửa, cách làm tạm (BA viết vào sổ tay, PO ghi vào giới hạn v1.0.4): đơn Nội bộ cần ở thêm thì **không bấm Gia hạn**, mà tạo một đơn Nội bộ mới 0 đ cho các đêm thêm, cùng căn, ghi lý do. Đã lỡ gia hạn thì không thu tiền người ở và báo quản lý trước khi trả phòng. Desk chưa có cách gỡ: BE cho biết hướng gỡ khi sửa.

## QA chạy thử local (04/11/2026 21:00–21:10, hotfix P0 BUG-R4-037, bước Kiểm thử)

**Kết luận: ĐÚNG.**
- Q0–Q4 và Q5a, Q5b chạy không lỗi cú pháp, không lỗi quyền.
- Mọi câu đếm và trả đúng đơn bị dính, không đếm nhầm đơn đối chứng nào.
- Mỗi câu chạy dưới 25 ms.
- Không câu nào cần sửa. QA có 3 đề xuất (mục cuối), không đề xuất nào chặn việc chạy trên production.

**Môi trường**
- Hai stack dùng một lần, dựng từ `origin/main` @ `c2506a53`:
  - stack A `ottimo-qa037`: Q0–Q4 và Q5;
  - stack B `ottimo-qa037b`: cổng dừng của Q5.
- Seed DS-E. Chỉ tài khoản `qa.*` và khách giả `@example.test`.
- Không chạm staging hay production. Đã dọn cả hai stack sau khi chạy.
- Schema của các bảng Q0–Q5 dùng **không đổi từ `v1.0.3` tới `main`**. Migration 0092–0095 chỉ đụng `privacy_notice_version`, `website_booking_request`, `staff_notification` và trigger của `room_list_price`. Vì vậy câu chạy được như nhau trên production v1.0.3 và v1.0.4.

**Dữ liệu tạo thử** (qua API, lễ tân `qa.fd`)
- QA tạo đơn bằng API, không qua Desk UI.
  - Thân yêu cầu của 2 đơn dính là đúng thân Desk gửi sau khi bản xem giá Trực tiếp đã điền ô. QA lấy thân này từ test chẩn đoán ngày 04/11: `nightlyRates` mang giá xem trước Trực tiếp của căn 101, `edited:false`.
  - Giá đó lấy bằng `calculateQuote`, giống cách Desk làm.
- Danh sách đơn:

| Nhãn | Loại | Kỳ vọng ở Q1/Q2/Q3 | Kỳ vọng ở Q5 |
|---|---|---|---|
| H1 | OTA trả tại khách sạn, giá điền sẵn không gõ | **dính** | – |
| H2 | Nội bộ, giá điền sẵn không gõ | **dính** | – |
| C1 | OTA để trống giá (đường lịch OTA) | không | – |
| C2 | OTA gõ tay giá (`edited:true`) | không | – |
| C3 | Nội bộ để trống (0 đ) | không | không |
| C4 | Trực tiếp | không (ngoài phạm vi kênh) | – |
| E1 | Nội bộ đang ở, gia hạn 1 đêm (B13) | không | **dính** |
| E0 | Nội bộ đang ở, không gia hạn | không | không |

**Cách chạy**
- Q0–Q4: lệnh `psql` của stack local thay cho dòng `ssh`.
  - `PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s"`, `psql -X -v ON_ERROR_STOP=1`.
  - Đầu mỗi lần gọi có 2 dòng của khối `SQLRO`. QA thêm `\timing on` để đo; dòng này chỉ là lệnh của `psql`, không đổi câu SQL.
  - Cờ: `-tA` cho Q0, `-A` cho Q1–Q4 (để có tên cột, như mục 2.1).
- Q2 được ghép tự động từ văn bản của tệp, không gõ lại: khối `WITH` của Q1, rồi phần `SELECT` của Q2, rồi `LIMIT 200` (SEC 3 (b)).
- Q5a, Q5b: phần trong heredoc **giữ nguyên từng chữ**, chỉ thay dòng `ssh`, cùng `PGOPTIONS`, cùng `-X -v ON_ERROR_STOP=1 -tA`. Mỗi khối một lần gọi; Q5b chỉ gọi sau khi đọc dòng `TOTAL` của Q5a.
- Trước khi ghi báo cáo, QA so lại văn bản đã chạy với tệp lúc 21:10. Q0–Q4 và hai heredoc Q5 giống hệt. SHA-256, 12 ký tự đầu:
  - Q1 `bf994e322081`, Q2 ghép (chưa có `LIMIT`) `7a5040927aaf`, Q3 `98038d7ff3e0`, Q4 `9645f7285e29`;
  - Q5a `4ef6cf4797a2`, Q5b `5bd80973ea05`.
- Phần dưới chỉ ghi số đếm và tên nhóm, không ghi số tiền, theo SEC mục 2. Mã đơn là mã thử của stack local, nên cũng không ghi.

**Kết quả**

| Câu | Kỳ vọng | Thực tế | Thời gian | Đạt |
|---|---|---|---|---|
| Q0 (+ 2 dòng `SQLRO`) | `on`, `ottimo_readonly`, `on`, `ottimo_readonly\|t\|f`. `statement_timeout` = `30s`, `lock_timeout` = `3s` | đúng như kỳ vọng | < 3 ms | Đạt |
| Q1 | `TOTAL` 2 đơn: 1 `ota_pay_at_property`, 1 `internal` | `TOTAL\|ALL\|2\|2\|0\|…`. Mỗi nhóm 1 đơn, 1 đêm còn hiệu lực. `ota_dem_khong_co_gia_nen` = 0. C1–C4, E0, E1 không vào | 15 ms | Đạt |
| Q2 (`LIMIT 200`) | 2 dòng, đúng H1, H2; số dòng = `so_don` của Q1 | 2 dòng, đúng H1 (đường sửa `A`) và H2 (`A-`). `nguon_luc_tao` = `calendar`, `vai_nguoi_tao` = `front_desk`, `dem_dinh` 1 | 23 ms | Đạt |
| Q3 | OTA chỉ có `calendar\|t\|t\|t`, `manual\|f\|f\|t`, `calendar\|f\|f\|t` (= Q1). Nội bộ chỉ có các nhóm của mục 2.5 | OTA: C1 `calendar\|t\|t\|t`, C2 `manual\|f\|f\|t`, H1 `calendar\|f\|f\|t`. Nội bộ: `complimentary\|f\|f\|f` 2 đơn (C3, E0); `complimentary\|t\|t\|f` 1 (đêm đầu của E1, sau `writeRepricedNights`); `default\|t\|t\|t` 1 (đêm gia hạn của E1); `calendar\|f\|f\|t` 1 (H2 = Q1). Không có nhóm "dừng" nào | 6 ms | Đạt |
| Q4, trước khi sửa | 0 dòng | 0 dòng | 15 ms | Đạt |
| Q4, sau A31 trên H1, H2 (lý do có `BUG-R4-037`) | đúng 2 mã đơn | 2 dòng, đúng H1 và H2, mỗi đơn `so_lan_sua_gia` = 1 | 11 ms | Đạt |
| Q1/Q2/Q3, sau A31 | H1, H2 rời Q1/Q2 | Q1 `TOTAL\|ALL\|0\|…`, Q2 0 dòng. Q3: H1 thành `ota_pay_at_property\|manual\|f\|f\|t`, H2 thành `internal\|manual\|f\|f\|t` | 5–11 ms | Đạt (xem đề xuất QA-037-02) |
| Q5a, stack B: 2 đơn Nội bộ đang ở, **chưa gia hạn** | dòng đầu `TOTAL\|ALL\|0\|…`, nên **không chạy Q5b** | 4 dòng chốt phiên đúng, rồi đúng 1 dòng `TOTAL\|ALL\|0\|0\|0\|0\|0\|0`. Cổng dừng đọc được; QA không gọi Q5b | 6 ms | Đạt |
| Q5a, sau khi gia hạn E1 (stack A và stack B) | `TOTAL` đứng đầu, `so_don_default` = 1 | `TOTAL\|ALL\|1\|1\|1\|0\|0\|0`, rồi `B13\|ALL\|…`, `B13\|2026-11\|…`. Đơn không gia hạn (E0, C3) không vào | 6–12 ms | Đạt |
| Q5b | số dòng = 1 | 1 dòng (E1): `A- - dang o…`, `B13`, `dem_default` 1, `dem_go_tay` 0, `co_dem_tu_ngay_d` = `t` | 4–20 ms | Đạt |

- Thời gian: mọi câu dưới 25 ms (`\timing`). Một lần gọi, kể cả `docker compose exec`, mất 0,1–1,3 giây.
- Dữ liệu local nhỏ, cỡ production: 10 căn, vài chục đơn. Chưa đo trên tập lớn.

**BUG-R4-038 thấy lại trên local** (QA ghi vào `rounds/round-04/qa/bug-list-v1.0.4.md`)
- E1 sau B13 có đêm thêm như sau:
  - `stay_night.rate_source = 'extension'`, nguồn trong bản chụp giá là `default`, gross > 0, bằng giá lịch Trực tiếp của căn;
  - đơn vẫn có `is_complimentary = true`, nhưng `total_room_vnd` > 0 và folio có dòng `room` > 0.
- Đơn E0 (không gia hạn) vẫn 0 đ.

**Đề xuất cho BE** (QA không sửa câu trong tệp)
- **QA-037-01 (Minor, cùng loại SEC S1): Q0–Q4 chưa phải khối dán nguyên như Q5.**
  - Người chạy phải tự làm ba việc:
    - ghép khối `WITH` của Q1 vào Q2;
    - thêm `LIMIT 200` (SEC 3 (b));
    - bỏ `-t` ở dòng `ssh` cho Q1–Q3.
  - Lần chạy thử này dùng bản QA ghép bằng máy. Bản gõ tay trên production có thể khác.
  - Đề xuất: viết Q0+Q1, Q2 (đủ CTE và `LIMIT 200`), Q3, Q4 thành khối `SQLRO` đầy đủ như mục 2.8. QA so SHA với bản đã chạy, hoặc chạy lại nhanh, trước khi OPS dán.
- **QA-037-02 (Suggestion): sau A31, đơn Nội bộ rời Q1/Q2 dù tiền vẫn > 0.**
  - A31 không cho về 0, nên H2 được sửa thành một số > 0 và nguồn đổi thành `manual`. Đơn rời Q1/Q2, nhưng vẫn còn tiền.
  - Câu ở mục 2.6 ("đơn đã sửa hết đêm thì không còn trong danh sách, trừ nhóm B, C, D") nên thêm: nhóm `A-` cũng rời danh sách mà chưa đúng tiền.
  - Theo dõi nhóm này bằng Q4 và nhóm Q3 `internal|…|manual|…|t`, hoặc chọn PA B cho đơn Nội bộ.
- **QA-037-03 (Suggestion):**
  - Q4 in `lan_cuoi` theo UTC (`+00`), vì phiên `psql` trong container dùng UTC. Có thể đổi sang `AT TIME ZONE 'Asia/Ho_Chi_Minh'` cho dễ đọc.
  - ORC báo production vận hành từ **02/11**, nên giả định "production chưa vận hành" ở mục 0 ý 7 và mục 4 đã cũ.
    - Q2 đã có `ngay_tao`, đủ để tách đơn từ ngày đó.
    - Q1 có thể thêm cột đếm "từ ngày D" như `dem_default_tu_ngay_d` của Q5a.

### Chạy lại Q2 và Q4 (khối dán nguyên mới) – QA, 04/11/2026 21:20–21:30

**Kết luận: ĐÚNG.** QA chạy Q2 (mục 2.4) và Q4 (mục 2.6) nguyên văn heredoc, chỉ thay dòng `ssh`. Q0, Q1, Q3, Q5 không đổi nên không chạy lại; Q1 chỉ dùng để đối chiếu.

**Môi trường:**
- Stack local dùng một lần `ottimo-qa70`. Image dựng từ PR #70 @ `822094b7`; máy chủ không đổi so với `main`. Seed DS-E, chỉ khách giả `@example.test`. Đã dọn sau khi chạy.
- Dòng thay cho `ssh`: `docker compose … exec -T` với **cùng** `PGOPTIONS` (`default_transaction_read_only=on`, `role=ottimo_readonly`, `statement_timeout=30s`, `lock_timeout=3s`) và cùng `psql -X -v ON_ERROR_STOP=1 … -tA`. Phần heredoc đưa vào nguyên văn qua stdin.
- Phần trong heredoc đúng từng byte với tệp này lúc 21:30:
  - Q2: dòng 257–336, 80 dòng, SHA-256 bắt đầu bằng `fe89c9b4157d`. Phần câu giống hệt bản QA ghép cho lần chạy 21:00 (CTE của Q1 + `LIMIT 200`). Khối `WITH` giống hệt Q1.
  - Q4: dòng 419–439, 21 dòng, SHA-256 bắt đầu bằng `ad78e7e05d01`.
- Dữ liệu (dựng lại như lần 21:00, ngày ở = hôm nay + 50, rơi vào ngày thường):
  - 2 đơn dính, tạo qua API với đúng thân yêu cầu Desk cũ gửi (giá Trực tiếp, `edited:false`): H1 OTA trả tại khách sạn, H2 Nội bộ.
  - 3 đơn đối chứng: C1 OTA để trống, C2 OTA gõ giá (`edited:true`), C3 Nội bộ để trống.
  - 11 đơn tạo qua Desk thật của PR #70 (Trực tiếp, OTA gõ giá, Nội bộ để trống).

**Kết quả** (repo chỉ ghi số đếm theo SEC 3 (c); mã đơn và số tiền chỉ xem trên màn hình QA):

| Câu | Kỳ vọng | Thực tế | Thời gian | Đạt |
|---|---|---|---|---|
| Q4, trước A31 | 4 dòng chốt phiên, 0 dòng đơn | `on`, `30s`, `3s`, `ottimo_readonly\|t\|f`; 0 dòng đơn | 18 ms | Đạt |
| Q1 (đối chiếu) | `TOTAL` 2 đơn | `TOTAL` 2: 1 `ota_pay_at_property`, 1 `internal`. 11 đơn qua Desk của #70 không vào | – | Đạt |
| Q2, trước A31 | Số dòng = `so_don` của Q1; đúng H1, H2 | 4 dòng chốt phiên + **2 dòng**, đúng H1 (đường sửa `A`) và H2 (`A-`). C1–C3 và 11 đơn qua Desk không vào | 32 ms | Đạt |
| Q4, sau A31 trên H1, H2 (lý do có `BUG-R4-037`) | 2 dòng, cột `kenh` đúng, giờ VN, `noi_bo_dem_con_tien` chỉ có ở đơn Nội bộ | **2 dòng**: H1 `kenh` = `ota_pay_at_property`, `so_lan_sua_gia` 1, `noi_bo_dem_con_tien` trống. H2 `kenh` = `internal`, `so_lan_sua_gia` 1, `noi_bo_dem_con_tien` = **1** | 18 ms | Đạt |
| Q2, sau A31 | H1, H2 rời danh sách | 0 dòng đơn | – | Đạt |

- `lan_cuoi_gio_vn` in đúng giờ Việt Nam. Giờ in ra khớp giờ máy theo `Asia/Ho_Chi_Minh` lúc sửa, không còn lệch 7 giờ như bản UTC (QA-037-03 đã xử lý).
- `noi_bo_dem_con_tien` của H2 = 1 là đúng.
  - A31 không cho giá 0, nên H2 được sửa thành một số > 0.
  - Sau A31, `stay_night.rate_source` của đêm vẫn là `short_stay_rate`, gross > 0. Vì vậy đêm vẫn được đếm.
  - Đơn rời Q2 nhưng vẫn hiện ở Q4 với 1 đêm còn tiền, đúng như câu "Không coi đơn Nội bộ rời Q2 là đã xong" ở mục 2.6. QA-037-02 đã xử lý.
- Chưa thử được ca `noi_bo_dem_con_tien` = 0. Ca này cần PA B (mục 3.2) để đưa đêm về 0 đ, mà PA B chưa có trên stack.
- C3 (Nội bộ 0 đ, không sửa) không có trong Q4, vì không có sự kiện `reservation.repriced`. Đúng.
- Không gặp lỗi, không có `permission denied`. Không có câu nào ra đủ 200 dòng.
