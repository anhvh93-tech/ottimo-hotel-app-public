# Báo cáo BA – Round 2, Đợt 0 "BA specs EP00/EP02"

- Người làm: BA | Ngày: 16/10/2026 | Căn cứ: `rounds/round-02/plan.md` mục 3.1 (BA việc 1), mục 4 (Đợt 0 – BA đi trước dev một sprint); quyết định INV 16/10 (ESC-014 và phần bổ sung bộ đồ dùng thêm); ARC `outputs/ARC/w1-report.md` (lệch SM-16 G4); DOM `outputs/DOM/w1-oracle-review.md` (trùng `NH-`); thông báo ORC: dùng BR-812 (BR v0.3.1).

## 1. Đã làm gì
1. **Đặc tả mức trường EP00** (`specs/EP00-platform.md`) cho US-001…007, 135, 142, platform (kênh, mã chứng từ, SSE, xác nhận lại) và CRM US-071…073: từng màn/hành động có trường, kiểu, bắt buộc, kiểm tra, `Problem.code`/`FieldError.code` → khóa chuỗi copy, quyền theo rbac, hệ quả, trạng thái rỗng/lỗi. Bộ kiểm tra dùng chung **V-01…V-11** (họ tên, SĐT VN/nước ngoài, email, MST, ngày lưu trú, ngày sinh, tiền, lý do, văn bản tự do lọc số thẻ, mật khẩu, danh mục). Bảng 12 hộp xác nhận US-135.
2. **Đặc tả mức trường EP02 + EP11 phần R2 + US-139 + US-017 AC5a** (`specs/EP02-reservations.md`): rack theo vai, kiểm phòng trống, tạo đơn (thứ tự kiểm ở server), chống trùng, đơn dài hạn nhập tay, đơn OTA trùng → gợi ý/làn chưa gán/gán căn/đổi chéo/dời ngoài, chi tiết đơn + bảng `allowedActions` theo trạng thái × vai, hủy, người đi cùng, đổi căn/phòng, báo giá → giữ chỗ → gia hạn/hết hạn → xác nhận cọc/báo đã chuyển cọc, phạm vi CTV, lead, no-show, khối OOO.
3. **Áp ESC-014**: sức chứa = người lớn + trẻ 6–11 (trẻ dưới 6 không tính) ≤ định mức + 1 trên mọi luồng; danh mục căn chỉ cho `maxOccupancy` ∈ {định mức, định mức + 1}; form đặt phòng/chi tiết đơn hiện "Có n người ngủ sofa".
4. **Quy trình buồng phòng** (`business-processes.md` v0.3, P07): bước 1a (tự sinh việc "Chuẩn bị bộ đồ dùng thêm" khi đơn vào `confirmed` có người vượt định mức), 4a (chuẩn bị, kho xuất khác bàn chải + đồ vệ sinh), 6 (điểm kiểm "bộ đồ dùng thêm đủ"), 9 (thu hồi khi trả phòng), ngoại lệ E-K1…E-K5 (đổi/hủy đơn, đổi căn, đổi phòng, khách đến khi việc chưa xong – không chặn nhận phòng, quá hạn); sơ đồ Mermaid thêm làn KIT; X5 P01 ghi rõ cách tính sức chứa. Mọi chỗ dẫn **BR-812**.
5. **Chốt SM-16 G4** (điểm ARC nêu): chọn **rbac A23** (khớp OpenAPI 0.3) làm nguồn duy nhất; sửa `state-machines.md` → 0.2.2: G4 = FD+, SAL/CTV phạm vi của mình (CTV chỉ đơn `hold`, không phân bổ cọc); G3 thêm phạm vi SAL `own_direct_only`, CTV `own_hold_only` cho khớp A05/A06. Đồng thời B1 (cách tính sức chứa), B2 + SM-14 (việc bộ đồ dùng thêm).
6. **Đề xuất tiền tố `NH-`**: giữ `NH-` cho nhóm đơn; nhóm hộ CRM đổi `HH-` (lý do và người làm ở mục 5).
7. Ghi 5 dòng `decision-log.md` (đặc tả theo epic + V-xx; G4 theo A23; đề nghị `NH-`/`HH-`; quy tắc sức chứa + thời điểm sinh việc; giả định Q-01).

## 2. File đã tạo/sửa
| File | Thay đổi |
|---|---|
| `product/docs/specs/EP00-platform.md` | **Mới** v0.1 |
| `product/docs/specs/EP02-reservations.md` | **Mới** v0.1 |
| `product/docs/business-processes.md` | v0.2 → 0.3: P07 bước 1a, 4a, 6, 9, ngoại lệ E-K1…5, sơ đồ; P01 X5; lịch sử |
| `product/docs/state-machines.md` | v0.2.1 → 0.2.2: SM-16 G3/G4, B1, B2, SM-14; lịch sử |
| `01-decisions/decision-log.md` | Thêm 5 dòng BA |
| `rounds/round-02/outputs/BA/d0-report.md` | Báo cáo này |

Không sửa file của vai khác (OpenAPI, erd, BR, chuỗi copy, SEC) – các thay đổi cần ở đó ghi thành đề nghị (mục 5).

## 3. Giả định (nhãn trong specs)
- G-1 Thứ tự chọn màn mặc định khi một tài khoản nhiều vai: OWN, MGR, FDL, FD, SAL, CTV, HK, MT.
- G-2 Định dạng SĐT: VN sau chuẩn hóa `84` + 9–10 số (di động/cố định); nước ngoài bắt buộc `+mã nước`, 8–15 số. MST không kiểm số kiểm tra ở R2.
- G-3 Bộ chọn khách: chờ 300 ms sau lần gõ cuối (UXD đổi được); 5 kết quả (OpenAPI).
- G-4 Kênh Nội bộ cho phép giá 0, bắt buộc ghi chú (DOM xác nhận có tính đêm bán không).
- G-5 Đơn OTA nhập tay vượt sức chứa: không chặn, gắn cờ xung đột "sức chứa" (theo SM-01 B7c) – DOM xác nhận.
- G-6 Nhật ký thao tác lọc tối đa 92 ngày/lần (ARC xác nhận hiệu năng); danh sách người dùng không phân trang (≤ 50).
- G-7 **Q-01**: khách dài hạn đang ở – tạm nhập ngày vào = hôm nay rồi nhận phòng B9; đề xuất `manualLongStay.alreadyInHouse`.
- G-8 Danh mục `tags`/`serviceNotes` hồ sơ khách và lý do đổi căn tạm do BA đặt – DOM bổ sung.

## 4. Rủi ro / vướng mắc
| # | Vấn đề | Ảnh hưởng | Đề xuất |
|---|---|---|---|
| R-1 | Hợp đồng chưa có `Room.baseOccupancy` (erd `room` cũng chưa có) trong khi định mức là thuộc tính từng căn (302/402 ≠ 301/401) | BE không tính được phụ thu người, BR-812 không biết khi nào sinh việc | ARC thêm trước Sprint 1 (E00-01) |
| R-2 | Thiếu trường/mã lỗi: `directSource` (US-017 AC8), `rateOverrideReason` (AC3), `otaPenaltyVnd` (BR-310), `MIN_STAY_NOT_MET`, `OTA_REF_DUPLICATE`, `PARTY_DUPLICATE`, `ROOM_NOT_READY`, `USERNAME_TAKEN`, `LAST_OWNER`; `HkTaskType` chưa có loại bộ đồ dùng thêm | FE/BE tự đặt tên lệch nhau | ARC bổ sung OpenAPI 0.3.1 (E00-01…03, E02-01…05) |
| R-3 | `rejectRequest` đòi `pin` trong khi R2 duyệt bằng mật khẩu | Không từ chối được yêu cầu ở R2 | ARC sửa (E00-02) |
| R-4 | Chuỗi copy lệch hợp đồng: nhãn đăng nhập "SĐT hoặc email" (hợp đồng là `username`), `booking.error.phone` "ít nhất 9 chữ số", `error.REAUTH_FAILED` ghi PIN, `auth.code_label.pin` 4–6 số (hợp đồng 6), `crm.duplicate_new_anyway` trái BR-951; 5 mã lỗi chưa có chuỗi; `error.FILE_REJECTED` nhắc HEIC/PDF trong khi server từ chối hai loại này (ngoài EP00/02 – báo để UXD sửa) | Người dùng nhận hướng dẫn sai | UXD sửa cùng hi-fi Đợt 0 (E00-05, E02-08) |
| R-5 | Q-01 chưa có quyết định | Rack R2 thiếu lịch sử khách dài hạn đang ở (vẫn đúng tồn phòng từ hôm nay) | PO + DOM quyết trong Sprint 1 |

## 5. Đề nghị gửi vai khác (ORC chuyển; chi tiết trong mục 13 EP00 và mục 14 EP02)
- **ARC**: E00-01 `baseOccupancy` + kiểm `MAX_OCCUPANCY_RANGE`; E00-02 body `rejectRequest`; E00-03 mã `USERNAME_TAKEN`, `LAST_OWNER`, `minLength` mật khẩu tạm 10; E02-01…05 trường/mã lỗi/`HkTaskType`; đặt mã sự kiện máy đọc cho G4 (state-machines mục 18 chưa có, ví dụ `add_group_member`/`remove_group_member`) khi cài R3.
- **ARC + DOM + SEC – tiền tố `NH-`**: giữ `NH-{n:05}` cho nhóm đơn (đã ở erd mục 10, `ReservationGroup.code`, BR-007/321, oracle QA BR-321-01); nhóm hộ CRM (R3, chưa có bảng/code) dùng `HH-`. DOM thêm ghi chú vào BR-007; SEC sửa ví dụ D10 `security/data-risk-assessment.md`.
- **UXD**: thêm chuỗi "(mới)" VI/EN, sửa 5 chuỗi lệch (R-4).
- **DOM**: G-4, G-5, G-8; xác nhận Q-01 cùng PO.
- **PO**: Q-01 (phạm vi AC5a).

## 6. Việc chưa xong
- Đặc tả EP03–EP06, EP15 (Sprint 3) – làm trong Sprint 1 để đi trước dev một sprint; EP07/08/14 trong Sprint 2.
- Lỗi R1 giao cho BA (plan 3.1 việc 2: BUG-R1-001, 005, 006, 011, 019): đã kiểm `rounds/round-01/qa/bug-list.md` – cả 5 lỗi đều **Closed**, không còn việc.
- `rbac-matrix.md/.json`: không cần đổi cho G4 (A23 đã đúng); sẽ cập nhật khi ARC thêm mã/trường ở E00/E02.
- Chờ review bắt buộc DOM, ARC (khuyến nghị QA) cho hai file specs – `reviews/DOM-on-BA.md`, `ARC-on-BA.md`.
