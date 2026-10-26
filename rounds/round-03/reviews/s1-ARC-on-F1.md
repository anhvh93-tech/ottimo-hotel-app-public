# ARC review BE-A – Round 3, việc F1 (FB-INV-004: nhận phòng từ 12:00)

- Người review: ARC | Round 3, bước Review nhanh | Ngày: 26/10/2026
- Đối tượng: commit `6ff1af2` nhánh `worktree-agent-a2dce234d682985d6` – `services/api/src/admin/production-defaults.ts`, `services/api/test/integration/production-bootstrap.test.ts`.
- Đối chiếu: `rounds/round-03/outputs/DOM/v1-production-defaults.md` mục 8.1–8.5 (F1, F8), `product/docs/business-rules.md` v0.4.6 BR-401/BR-411, `frontdesk/public/stay-rules.ts` `earlyCheckinSurcharge`, `platform/internal/parameter-rules.ts` `TIME_ORDER`.

## Kết luận

**ĐẠT – gộp được trước D 02/11.** Không thẻ Blocker/Major. 2 thẻ Minor (dời v1.0.1), 1 Suggestion.

Ghi cho ORC (thủ tục phát hành, không phải lỗi commit): F1 phải lên **cùng đợt** với F3 (`guest.oci.done_body`). Trang khách lấy giờ từ `checkin_time` qua `guest-portal.service.ts`; nếu F1 lên trước F3, khách check-in online xong sẽ đọc "Your room is ready from 12:00" – hứa sai (DOM 8.3 #6). Nếu B2 production đã chạy trước khi gộp: OWN đổi hai khóa trên màn Tham số (DOM 8.2).

## Đã kiểm

| Kiểm tra | Kết quả |
|---|---|
| Diff khớp DOM 8.2 bảng khóa: `checkin_time` `'12:00'` nhãn `INV-2610`; `early_checkin_tiers` `[{10:00→12:00, 30},{06:00→10:00, 50}]` nhãn `INV-007+INV-2610` | khớp từng giá trị |
| Khớp BR-401 (a) `checkin_time` = 12:00; BR-411 0 % từ 12:00, 30 % 10:00–11:59, 50 % 06:00–09:59 | khớp |
| Nhãn qua CHECK `^[A-Z0-9-]{1,16}(\+[A-Z0-9-]{1,16}){0,3}$` | đạt (test sẵn có kiểm toàn danh sách) |
| Luật thứ tự giờ `hold_latest_time_on_arrival` (12:00) ≤ `checkin_time` (12:00), `allowEqual: true` | đạt – OWN đổi trên màn Tham số cũng không bị chặn |
| `vitest production-bootstrap.test.ts` (không DB) | 5 đạt, 6 bỏ qua (nhóm cần DB) |
| `tsc --noEmit`, `eslint`, `prettier --check` 2 tệp | đạt |
| Không đụng logic tiền | đúng – `earlyCheckinSurcharge` không đổi; test mới đi qua chính hàm này: 05:59 → đêm B9a, 06:00/09:59 → 50 %, 10:00/11:59 → 30 %, 12:00/12:10/13:59 → 0 |

## Rà "14:00" viết cứng còn lại (`services/api/src`, `integrations/`)

| Chỗ | Bản chất | Ảnh hưởng ở v1.0 | Quyết định ARC |
|---|---|---|---|
| `production-defaults.ts` `extension_payment_deadline` `'14:00'` | BR-423, không gắn giờ nhận phòng (DOM 8.1) | Không | Giữ |
| `reporting/internal/attention-sources.ts:52` `?? '14:00'` | Dự phòng khi thiếu khóa `checkin_time`; chỉ dùng làm `dueAt` của mục `vip_arrival` (mức `info`) khi đơn chưa có giờ đến | Không chạy: catalogue có khóa, bootstrap B2 ghi giá trị. Không phải mốc tiền | **v1.0.1** (thẻ 01); BE-A được gộp sớm nếu còn chạm tệp |
| `integrations/doorlock/access.ts:78` `checkInTime ?? '14:00'` (+ chú thích dòng 31) | Dự phòng trong `computeDoorValidity` | Không: hàm **không được API gọi** (grep `services/api/src` không có import doorlock); v1.0 lễ tân giao mã tay lúc nhận phòng (BR-403) | **v1.0.1 / khi làm TTLock** cùng F8 (thẻ 02) |
| `housekeeping/internal/attention-sources.ts:112` | Chỉ chú thích | Không | Giữ |

Mọi chỗ còn lại (`checkin.service`, `dashboard.service`, `housekeeping.service`, `reservations.*`, `extra-guest-kit`, `guest-portal.service`, `pricing.service`) đọc tham số `checkin_time` – xác nhận kết luận DOM 8.2 "chỉ đổi tham số". Ngoài API (FE `RULE_DEFAULTS`, `eta.ts`, chuỗi khách, landing) là F3–F5, không thuộc commit này.

## Thẻ feedback

### FB-R3-ARC-BE-A-F1-01
- Mức độ: Minor
- Vị trí: `product/services/api/src/modules/reporting/internal/attention-sources.ts` dòng 52
- Vấn đề: dự phòng `?? '14:00'` lệch BR-401 v0.4.6.
- Vì sao quan trọng: không chạy ở v1.0 (khóa luôn có giá trị) nhưng là bẫy khi tạo cơ sở mới / CSDL test thiếu khóa – nhắc khách VIP sẽ hẹn 14:00.
- Đề xuất sửa: đổi thành `'12:00'` hoặc bỏ dự phòng và để thiếu khóa ném lỗi cấu hình như các service khác. v1.0.1.
- Trạng thái: Open

### FB-R3-ARC-BE-A-F1-02
- Mức độ: Minor
- Vị trí: `product/integrations/doorlock/access.ts` dòng 31, 78 (`computeDoorValidity`)
- Vấn đề: mặc định `checkInTime` `'14:00'`. Cùng tệp còn `DOOR_CODE_DEFAULT_DIGITS = 6` / `DOOR_CODE_MIN_DIGITS = 6`, lệch BR-403 (8 số, INV 19/10) và khóa `door_code_min_digits` 8.
- Vì sao quan trọng: khi bật TTLock tự động, mã cửa hiệu lực theo giờ cũ và độ dài cũ nếu bên gọi quên truyền tham số.
- Đề xuất sửa: gộp vào F8 (INT, khi làm TTLock): bỏ mặc định giờ (bắt buộc truyền từ tham số), hiệu lực theo BR-403 v0.4.6 (12:00 khi căn sẵn sàng; căn trả–đến cùng ngày từ lúc dọn xong / `room_ready_guaranteed_time`), độ dài mã đọc `door_code_min_digits`. Không chặn D.
- Trạng thái: Open

### FB-R3-ARC-BE-A-F1-03
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/modules/platform/internal/parameter-rules.ts` (TODO kiểm bậc nhận sớm)
- Vấn đề: catalogue chưa kiểm `early_checkin_tiers[*].to` ≤ `checkin_time`. Commit này đổi đúng cả hai, nhưng OWN sửa một khóa trên màn Tham số thì dữ liệu lệch (kết quả tiền vẫn đúng vì `earlyCheckinSurcharge` xét `checkin_time` trước).
- Vì sao quan trọng: màn Tham số hiển thị bậc không khớp chính sách, dễ gây hiểu nhầm khi đối soát.
- Đề xuất sửa: v1.0.1 thêm luật vào `TIME_ORDER`/kiểm riêng cùng lúc thêm `room_ready_guaranteed_time` (F8): `max(tiers.to) ≤ checkin_time ≤ room_ready_guaranteed_time`.
- Trạng thái: Open

## Điểm làm tốt
- Diff tối thiểu, đúng 2 khóa DOM chỉ định, nhãn nguồn rõ (`INV-2610`), chú thích trỏ BR v0.4.6.
- Test không chỉ ghim giá trị mà đi qua `earlyCheckinSurcharge` với đủ biên (05:59, 06:00, 09:59, 10:00, 11:59, 12:00, 13:59) và ca DOM 8.1 (12:10 trước thu 238.000, nay 0).
