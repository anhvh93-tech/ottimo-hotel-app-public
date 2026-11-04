# SEC review P4-11 `v104/be-lease-prices` – thẻ ED-02 (migration 0094) và phần chạm tiền/dữ liệu

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/be-lease-prices` @ **`7420885c`**. So với `origin/main` @ `7b5b6117` (`git diff origin/main...7420885c`). Nhánh gồm commit DOM `ceb05937` (P4-20, đã review riêng ở `SEC-on-v104-dom-br-fixtures.md`) và gộp `lp-v2-main`.
- Trọng tâm: **FB-R4-ARC-BE-A-ED-02** theo điều kiện SEC ở `SEC-on-plan-v1.0.4.md` mục 3.2.
- Đọc thêm (vì chạm tiền/dữ liệu): `rooms.service.ts` (`cancelScheduledListPrice`), `platform.controller.ts`, `precondition.ts`, `checkin.service.ts`, `stay.service.ts`, `stay-rules.ts`, `lease-end.ts`, `reservation-dto.ts`, `audit-entities.ts`, `production-defaults.ts`, seed `ds-0`/`ds-e`, `smoke-manifest.json`, `rounds/round-04/outputs/BE/v104-be-lease-prices.md`.
- Không tự chạy test (BE-C báo 3928 đạt, `room-list-price-append-only` 5/5; ORC chạy CI khi mở PR-G). Không sửa tệp nào ngoài tệp này.

---

## 0. Kết luận

**ĐẠT.** Không có thẻ Blocker hay Major.
- **ED-02: Verified** – đủ 8 điều kiện của SEC 3.2 (bảng mục 1).
- Một thẻ Minor (P411-01: khung 00:00 → giờ đổi ngày kinh doanh trả 500 thay vì 409). Nên làm trong PR-G, trễ thì v1.0.5, không chặn QC v1.0.4.
- Kiểm theo yêu cầu ORC:
  - không bí mật, IP, email trong diff (quét: 0);
  - không có số hoa hồng/thưởng của bảng nội bộ 01/11. Ở `production-defaults.ts`, seed `ds-e`/`ds-0`, `smoke-manifest.json` chỉ **thêm nhãn** "tỷ lệ cũ ESC-005, hết hiệu lực". Giá trị không đổi. So giá trị khóa hoa hồng trong `br-examples.json` với `main`: chỉ thêm chữ của quy ước, không thêm số;
  - fixtures/test không có PII thật (tên khách thử dạng "Khách Thuê Tháng", không số giấy tờ, điện thoại, email);
  - không có SQL ghi tay trên production. 0094 là migration chỉ thêm (hàm + trigger, không đổi dữ liệu), chạy qua `deploy.sh` bước `migrate`. Câu runbook BE-C đề xuất (mục 6 báo cáo BE) là `count(*)` chỉ đọc.
- Đánh số journal: khi 0093 (PR-F) vào trước, BE-C đổi idx/`prevId`/`when` theo luật 2.2. Đổi **chỉ** journal/snapshot thì SEC không cần review lại. Đổi thân SQL của 0094 thì phải review lại (nêu head mới).

## 1. ED-02 – đối chiếu điều kiện SEC 3.2

| # | Điều kiện | Mã 0094 | Kết quả |
|---|---|---|---|
| 1 | `BEFORE DELETE … FOR EACH ROW`; chặn khi `OLD.effective_from <= (now() AT TIME ZONE tz)::date`, tz của property của dòng; không có property → chặn; `SECURITY INVOKER`, `search_path` cố định | Đúng cả. `SELECT p.timezone … WHERE p.id = OLD.property_id`; `tz IS NULL` → chặn; tz không đọc được → `AT TIME ZONE` ném lỗi → chặn. `SET search_path = pg_catalog, pg_temp`, bảng viết đủ tên `public.property`. `REVOKE ALL … FROM PUBLIC` | Đạt |
| 2 | Thông báo cố định, không nối id/giá/ngày; lớp dịch vụ chặn trước nên trigger chỉ bắn khi lỗi lập trình → 500 chung | `RAISE EXCEPTION 'room_list_price: applied price row is append-only'`, `check_violation`. `unit-of-work.ts` không ánh xạ `23514` → 500 chung. Chữ lỗi không có giá trị nên log cũng không lộ gì | Đạt |
| 3 | Không chặn "dòng đầu/dòng cuối" ở DB | Không có. Luật nằm ở dịch vụ (409 `only_price`/`first_price`, khóa dòng `room` FOR UPDATE) | Đạt |
| 4 | Chỉ thêm; app cũ vẫn chạy; `TRUNCATE` không bị ảnh hưởng | Không đổi dữ liệu, không đổi quyền. Chú thích có câu cho runbook. Xem thẻ P411-01 về khung giờ đêm | Đạt (có ghi chú) |
| 5 | Test (a)–(e) | (a) dòng quá khứ → lỗi đúng chữ, dòng còn; (b) dòng ngày mai → xóa được; (c) cùng ngày lịch: property Kiritimati bị chặn, Pago Pago được (chứng minh dùng tz của **từng** property, không dùng tz phiên/máy chủ); thêm ca tz sai → chặn; (d) `tgenabled = 'O'`, `prosecdef = false`, `proconfig` cố định; (e) test dịch vụ BUG-R4-015 dời dòng bị hủy sang 2037, tương lai theo cả `MutableClock` lẫn đồng hồ DB | Đạt |
| 6 | Xóa thật chỉ qua migration của chủ bảng có `DISABLE TRIGGER`, có SEC review; không cờ bỏ qua cho `ottimo_app` | Ghi ở chú thích. Không có cờ, không có `session_replication_role` hay `DISABLE TRIGGER` trong mã/test. `ottimo_app` không phải chủ bảng nên không tự tắt được | Đạt |
| 7 | OPS thêm câu READ ONLY kiểm trigger (tùy chọn) | Runbook r0 K3b đã có, khớp test (d) | Đạt |
| 8 | Trễ thì sang v1.0.5 | Đã kịp | – |

Đường xóa trên bảng: vẫn chỉ có **một** (`rooms.service.ts` `DELETE FROM room_list_price WHERE id = $1`). FK từ `room_list_price` sang `room` là `ON DELETE no action`, không có cascade nào xóa dòng giá.

## 2. Phần khác của gói (chạm tiền/dữ liệu)

| Phần | Đánh giá SEC |
|---|---|
| BUG-R4-015 (`first_price`) | Kiểm sau `effective` và `only_price`, dưới khóa `room` FOR UPDATE → không đua. 409 chỉ mang `currentState`, không mang giá. Audit `room.list_price_cancelled` như cũ |
| FB-R4-BE-LPV2M-02 | `hooks.changed(propertyId, 'room')` chỉ khi 200, `propertyId` lấy từ principal (không từ đầu vào) |
| ETag `-gzip/-zstd/-br` | Regex neo hai đầu, độ dài số giới hạn 9, chỉ 3 hậu tố cố định → không ReDoS, không nới so sánh phiên bản. `version` vẫn so bằng số |
| `leaseEndDate` | Khóa jsonb `lease_end_date` ghi lúc check-in chỉ là ngày (`departure_date::text`), tên khóa truyền bằng tham số `$11`/`$3` (không ghép chuỗi). DTO đặt trong `manualLongStay`, nên đi theo luật hiển thị hiện có của `manualLongStay`; trước OpenAPI 0.3.12 serializer bỏ trường chưa khai báo. Không có dữ liệu cá nhân mới |
| Audit B16 | Thêm `earlyDepartureRule`, `leaseEndDate` vào allowlist `reservation` – chỉ mã luật và ngày |
| `production-defaults.ts` | Chỉ thêm chú thích "tỷ lệ cũ ESC-005, hết hiệu lực; bảng 01/11 không ghi ở repo, OWN nhập trên Desk ở H2". Không thêm số. FB-R4-SEC-BE-01 (Major) vẫn mở tới H2/P4-15 theo kế hoạch, không thuộc gói này |

## 3. Thẻ

### FB-R4-SEC-BE-P411-01
- Mức độ: Minor
- Người làm: BE-C (mã + chú thích 0094); OPS sửa runbook theo FB-R4-SEC-OPS-P404-01
- Vị trí: `services/api/src/modules/platform/internal/rooms.service.ts` `cancelScheduledListPrice` (kiểm `input.effectiveFrom <= pc.today`); chú thích đầu `0094_room_list_price_append_only.sql` (câu "the previous app only deletes rows dated after today").
- Vấn đề:
  - dịch vụ so với **ngày kinh doanh** (`pc.today = businessDate(…, rollover)`), trigger so với **ngày lịch theo tz property** (đúng điều kiện SEC 3.2 (1));
  - trong khung 00:00 → giờ `business_day_rollover`, ngày kinh doanh còn là hôm qua. Hủy giá hẹn cho đúng ngày lịch hôm nay thì dịch vụ cho qua, trigger chặn → **500 chung** thay vì 409 `effective`;
  - chú thích migration ghi đúng là trigger "stricter than the business date", nhưng câu cho runbook ("app cũ chỉ xóa dòng sau hôm nay nên vẫn chạy") bỏ sót khung này. v1.0.3 khi quay lui cũng gặp đúng khung này.
- Vì sao quan trọng: dữ liệu vẫn an toàn (đây là đúng việc trigger cần chặn). Nhưng lễ tân/OWN thấy lỗi máy chủ không rõ lý do, và mỗi lần như vậy để lại một dòng lỗi 500 trong log khiến cảnh báo `API_5XX` (K7) bị nhiễu.
- Đề xuất sửa:
  1. Trong `cancelScheduledListPrice`, thêm kiểm theo ngày lịch tz property (`localDate(pc.now, tz)`, hàm đã có ở `shared/time.ts`): `effectiveFrom <= max(pc.today, ngày lịch)` → 409 `INVALID_TRANSITION` `currentState: 'effective'`. Không đổi trigger.
  2. Thêm một test đơn vị với `MutableClock` đặt 01:00 giờ property (trước rollover): hủy dòng của ngày lịch hôm nay → 409, không gọi `DELETE`.
  3. Sửa câu chú thích 0094 cho runbook: "v1.0.3 chỉ xóa dòng sau ngày kinh doanh; trong khung 00:00 → rollover, hủy giá của ngày lịch hôm nay bị trigger chặn (500 chung, không mất dữ liệu)". Đổi chú thích là đổi tệp SQL: nếu làm sau review này thì nêu head mới, SEC xác nhận nhanh (chỉ chú thích).
- Trạng thái: Open

## 4. Điểm làm tốt
- 0094 làm đúng từng ý của điều kiện SEC, kể cả "đóng an toàn" khi tz hỏng và test chứng minh tz theo **từng** property (Kiritimati/Pago Pago) thay vì chỉ thử quanh nửa đêm một múi giờ.
- Dời dữ liệu test BUG-R4-015 sang 2037 để test không đỏ theo lịch thật – bắt trước một lỗi chỉ xuất hiện sau 20/11.
- Trả lời Q3 của OPS (0096 là no-op, rủi ro thật là xóa dòng `config_parameter`) giúp bỏ một migration thừa và thêm đúng kiểm P2e/R2b, không chạm giá trị hoa hồng.

## 5. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – review P4-11 be-lease-prices @ 7420885c: ĐẠT, ED-02 Verified** (rounds/round-04/reviews/SEC-on-v104-be-lease-prices.md): 0094 đủ 8 điều kiện SEC 3.2 (BEFORE DELETE theo ngày lịch tz property, đóng an toàn khi thiếu property/tz sai, SECURITY INVOKER + search_path cố định, chữ lỗi cố định → 500 chung, không chặn dòng đầu/cuối ở DB, không cờ bỏ qua, test a–e + tgenabled O); BUG-R4-015, ETag hậu tố nén, leaseEndDate, audit B16 đạt; không số hoa hồng mới, không PII, không SQL ghi tay. Đổi số journal/snapshot khi 0093 vào không cần SEC review lại; đổi thân SQL thì cần. Minor P411-01: dịch vụ so ngày kinh doanh, trigger so ngày lịch → khung 00:00 → rollover trả 500; thêm kiểm ngày lịch → 409 effective + test + sửa câu runbook | SEC | Quyền SEC |`
