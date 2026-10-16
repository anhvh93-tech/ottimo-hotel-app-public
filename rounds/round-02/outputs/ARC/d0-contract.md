# ARC – Round 2, Đợt 0: áp đề nghị hợp đồng của BA (E00-01…06, E02-01…08)

- Vai: ARC | Ngày: 16/10/2026 | **Không commit** | Không sửa mã nguồn `product/services/api`
- Đầu vào: `product/docs/specs/EP00-platform.md` mục 13, `specs/EP02-reservations.md` mục 14, `business-rules.md` v0.3.1 (BR-110, BR-812), ESC-014 (INV đã quyết), `state-machines.md` 0.2.2 (SM-16), `rbac-matrix.md` (A05/A06/A23/A33), `rounds/round-02/outputs/SEC/w1-review.md` (FB-R2-SEC-ARC-01), tin nhắn ORC chuyển từ QA (TC-L6-053…055, TC-NT-042)
- Kết quả: OpenAPI **0.3.0-draft → 0.3.1-draft** (chỉ thêm và sửa, không đổi/xóa đường dẫn); erd **0.3.1**

## 1. Bảng thay đổi

| # | Đề nghị | Xử lý | Vị trí |
|---|---|---|---|
| E00-01 | `baseOccupancy` từng căn; `maxOccupancy` ∈ {base, base+1} | **Xong.** `Room.baseOccupancy` (1–10, `x-visible-to` như `maxOccupancy`), `RoomInput.baseOccupancy` (không bắt buộc: bỏ trống thì lấy mặc định nhóm; `maxOccupancy` bỏ trống thì = base + 1), `RoomPatch.baseOccupancy`; `maxOccupancy` 1–11; mã trường `MAX_OCCUPANCY_RANGE`; mô tả `updateRoom`; `RoomInput.roomNo` có pattern `^[0-9A-Z]{1,6}$`. erd: cột `room.base_occupancy` not null CHECK 1–10; `max_occupancy` CHECK `>= base_occupancy`; quy tắc "+1" để ở tầng ứng dụng (đổi chính sách thì không phải sửa DB); định mức được chụp vào `pricing_snapshot` của đơn | openapi `Room*`, `updateRoom`; erd 4.1, 3.1, 9.1 |
| E00-02 | `rejectRequest` xác nhận bằng mật khẩu | **Xong.** Body `authMethod` + `secret` + `reason` (bắt buộc), `pin` để `deprecated`; thêm `x-rbac: [A36]`, `x-stories: [US-007]`, 409/422 | `rejectRequest` |
| E00-03 | `USERNAME_TAKEN`, `LAST_OWNER`, mật khẩu tối thiểu 10 | **Xong.** `createUser` 409 có ví dụ `USERNAME_TAKEN`; `LAST_OWNER` là mã trường 422 (`field: roles`/`status`) ở `setUserRoles`/`updateUser` (khóa các dòng vai owner bằng `FOR UPDATE`); `initialPassword`/`resetPassword` 10–256; `setUserRoles` thêm 412/422, `updateUser` thêm 422 | users |
| E00-04 | Tiền tố `NH-`/`HH-` | **Chốt:** `NH-` chỉ dùng cho nhóm đơn; nhóm hộ CRM (R3) dùng `HH-{n:05}` cấp tổ chức | erd mục 10; decision-log |
| E00-05, E00-06 | UXD chuỗi; DOM danh mục | Không thuộc ARC | – |
| E02-01 | Trường "Nguồn" (US-017 AC8) | **Xong.** `ReservationCreate.directSource` enum `website, zalo_phone, walk_in, returning, sales_staff`: bắt buộc khi kênh thuộc nhóm `direct`, kênh khác gửi lên thì báo `DIRECT_SOURCE_NOT_ALLOWED`; `Reservation.directSource` (null = chưa rõ). erd `reservation.direct_source` đổi enum cho khớp (bản cũ `phone/zalo/facebook/referral` lệch AC8) | `ReservationCreate`, `Reservation`; erd 4.5 |
| E02-02 | `rateOverrideReason` + `RATE_OUT_OF_RANGE_WARNING` | **Xong.** Kênh OTA có giá ngoài sàn–trần mà thiếu lý do thì trả 422 mã trường cảnh báo; client hiện ô lý do rồi gửi lại. Kênh direct/agent vẫn chặn bằng `RATE_OUT_OF_RANGE`. Thêm `minStayOverrideReason` (FDL+ bỏ qua BR-113, EP02 3.2 (b)) để mã `MIN_STAY_NOT_MET` có lối ra | `ReservationCreate` |
| E02-03 | Mã lỗi còn thiếu | **Xong.** `Problem.code`: `USERNAME_TAKEN`, `PARTY_DUPLICATE`, `ROOM_NOT_READY` (409). Thêm **bảng mới `FieldError.code`** trong info gồm V-01…V-11 và `MIN_STAY_NOT_MET`, `OTA_REF_DUPLICATE`, `RATE_OUT_OF_RANGE_WARNING`, `ALLOW_UNASSIGNED_OTA_ONLY`, `LONG_STAY_REQUIRES_CONTRACT`, `MANUAL_LONG_STAY_BELOW_THRESHOLD`, `MAX_OCCUPANCY_RANGE`, `LAST_OWNER`, `OTA_AMOUNT_MISMATCH`, `OTA_PENALTY_OTA_ONLY`, `DIRECT_SOURCE_NOT_ALLOWED`. `addPartyMember` 409 và `changeRoom` 409 có ví dụ | info, `Conflict`, `FieldError` |
| E02-04 | `otaPenaltyVnd` | **Xong.** Body `cancelReservation` và `CancellationQuote.otaPenaltyVnd`: chỉ dùng cho đơn OTA, lễ tân nhập, app không tự tính (BR-310) | `cancelReservation` |
| E02-05 | `HkTaskType` bộ đồ dùng thêm (QA chặn TC-L6-053…055) | **Xong – đúng 3 giá trị** `extra_guest_kit_prepare`, `extra_guest_kit_collect`, `extra_guest_kit_transfer`; chỉ hệ thống sinh (`createHkTask` gửi tay thì báo `NOT_IN_LIST`). `HkTask.dueAt`, `reservationId`, `quantity`; `Reservation.extraGuestCount`. erd `hk_task`: `quantity`, `due_at`, CHECK `reservation_id` not null, UK một phần, sinh/hủy/chuyển **trong cùng giao dịch** với B2/B4/B7/B7a/B12, B5/B10/B11, B14 | `HkTaskType`, `HkTask`; erd 4.8 |
| E02-06 | Q-01 `manualLongStay.alreadyInHouse` | **Không thêm** – PO/DOM chưa chốt (decision-log chỉ có giả định BA). Ghi erd E9 | erd 14 |
| E02-07, E02-08 | DOM, UXD | Không thuộc ARC | – |
| SM-16 | G3/G4 khớp A05/A06/A23 | G3 đã khớp từ trước. **G4 và G1**: CTV `own` → `own_hold_only` (A23 ghi chú 36: CTV chỉ thao tác nhóm giữ chỗ), có mô tả ở `addReservationGroupMember`, `createReservationGroup` | reservation-groups |
| FB-R2-SEC-ARC-01 | Chuỗi YAML chưa đặt trong nháy | **Fixed.** Hai ví dụ đã đặt trong nháy đơn; Ruby Psych (libyaml) đọc được cả file | ~d.2082, ~d.3378 cũ |
| QA (ORC chuyển) | erd 9.1 biên min–max (TC-NT-042) | **Xong.** Mục mới **erd 9.1a**: biên cho mọi khóa `int`/`pct` của danh mục 0002 (khoảng 85 khóa), quy tắc cho khóa time/json/enum, ràng buộc chéo (sàn ≤ 100 ≤ trần, compare < required, per_time ≤ per_month…). Định dạng `bounds` `{min,max}` / `{allowed}` khớp `PARAM_OUT_OF_RANGE`. 9.1 bỏ `base_occupancy`/`max_occupancy.<group>` vì đây là cột của căn/nhóm, không phải tham số | erd 9.1, 9.1a |

## 2. Kết quả kiểm tra
| Công cụ | Kết quả |
|---|---|
| `openapi-spec-validator` | OK cho `openapi.yaml` 0.3.1-draft và `openapi.test.yaml` |
| `npx @redocly/cli@1.34.21 lint docs/api/openapi.yaml` | **0 lỗi**, 4 cảnh báo (như 0.3.0, đều có chủ đích: `/health`, `getPublicUnitPage`, `webhookGet`, server localhost). Có lúc lên 5 vì ví dụ `initialPassword` ngắn hơn 10 ký tự; đã sửa |
| `python3 product/tests/tools/gen_traceability.py --strict` | **exit 0**: ops mismatched 0, fields mismatched 0, `x-rbac-field` gắn 117 (thêm 2), untagged []. `product/docs/qa/traceability.md` được sinh lại |
| Ruby Psych `YAML.load_file` | OK (FB-R2-SEC-ARC-01) |

## 3. Ảnh hưởng tới BE (ARC không sửa mã)
1. **`src/generated/openapi-meta.ts` đã cũ**: `node scripts/gen-openapi-meta.mjs --check` trả exit 1, nên test `openapi-meta.test.ts` sẽ đỏ cho tới khi BE chạy `pnpm --filter @ottimo/api gen:openapi`. Meta thay đổi ở: version, `rejectRequest` (thêm `rbac: [A36]`), `x-scope` CTV của `createReservationGroup`/`add|removeReservationGroupMember` (`own_hold_only`).
2. **Migration mới (không sửa 0002 đã có)**: điền `config_parameter_def.bounds` theo erd 9.1a; `test/parameters.test.ts` nên kiểm biên này giống cách đang kiểm biên bảo mật.
3. Khi tạo bảng nghiệp vụ R2: `room.base_occupancy` (not null), `hk_task.quantity/due_at` + CHECK + UK một phần, `reservation.direct_source` CHECK theo enum mới.
4. Logic: `MAX_OCCUPANCY_RANGE`; `LAST_OWNER` có khóa `FOR UPDATE`; việc `extra_guest_kit_*` chạy trong cùng giao dịch; `rejectRequest` dùng chung bộ đếm `REAUTH_FAILED` với approve.

## 4. Ảnh hưởng tới FE/MOB/QA/vai khác
- FE: form đặt phòng có ô "Nguồn" (bắt buộc với kênh direct), luồng cảnh báo giá OTA, ô lý do bỏ qua ở tối thiểu (FDL+), ô tiền phạt OTA ở hộp hủy; danh mục căn có cột định mức; hộp từ chối duyệt dùng mật khẩu; dòng "người ngủ sofa" lấy từ `extraGuestCount`.
- MOB (app buồng phòng): 3 loại việc mới, hiển thị `quantity`/`dueAt`; enum `HkTaskType` mở rộng nên client phải chịu được giá trị lạ.
- QA: TC-L6-053…055 hết bị chặn; TC-NT-042 dùng erd 9.1a; seed DS-E/DS-0 cần `baseOccupancy` cho từng căn.
- SEC: sửa ví dụ D10 `NH-` → `HH-`. DOM: ghi chú BR-007 về `HH-`, xem lại biên 9.1a.

## 5. Giả định và việc còn mở
- **Giả định ARC**: `directSource` thêm `sales_staff` ("Sale nội bộ", metrics Q-11) ngoài 4 giá trị AC8; BA/UXD cần thêm nhãn.
- **Giả định ARC**: biên 9.1a là biên kỹ thuật do ARC đặt, không phải giá trị nghiệp vụ; chờ DOM review.
- **Giả định ARC**: `minStayOverrideReason` thêm để khớp EP02 3.2 (b); BA chưa đề nghị tên trường.
- **Lệch mở E8** (erd 14): danh mục kênh nhóm `direct` trong erd và seed QA có 5 kênh, còn metrics Q-11/AC8 mô tả 1 kênh + nguồn. Hợp đồng dùng được cho cả hai cách; PO + DATA chốt. Nếu gộp thì QA đổi seed.
- **E9 / Q-01**: chưa thêm `alreadyInHouse`.
- Không có ESC mới.

## 6. File đã tạo/sửa
- Sửa: `product/docs/api/openapi.yaml` (0.3.1-draft), `product/docs/erd.md` (0.3.1), `01-decisions/decision-log.md` (5 dòng ARC)
- Sinh lại (bằng công cụ): `product/docs/qa/traceability.md`
- Tạo: `rounds/round-02/outputs/ARC/d0-contract.md`
