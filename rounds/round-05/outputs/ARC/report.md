# Báo cáo ARC – Round 5, Gói 0, bước Sản xuất (06/11/2026)

ORC lưu tệp này từ báo cáo bàn giao của ARC (subagent không ghi tệp báo cáo).

Việc được giao (plan mục 2–3):
- chốt hợp đồng 0.3.13 cho V5-10, 13, 1A, 30, 44;
- thiết kế phần "ARC →" của V5-14, 15, 16, 18, 22, 46, 50, 57, 58, phác V5-19;
- chọn cách làm V5-63, duyệt V5-62.

Chi tiết từng việc ở `rounds/round-05/outputs/ARC/contract-0.3.13.md`. PR #94 (https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/94), nhánh `r5-contract-0313`, commit `f4c40d9b`, cắt từ `main` @ `4a36180a`. Chưa merge, chờ SEC và BE review.

## Đã làm gì
1. **Hợp đồng 0.3.13-draft.**
   - Phần lớn là thêm: trường chỉ đọc, trường tùy chọn, tham số lọc, `Problem.lockReason`, hai operation Wi-Fi.
   - Một đổi phá vỡ có chủ đích: giá đêm bắt buộc khi tạo căn hoặc đổi giá (V5-1A, BUG-R4-057). Desk không bị ảnh hưởng. Script hay công cụ nào gọi API mà thiếu giá đêm sẽ nhận 422.
   - Không migration ở các mục đã chốt.
   - Sinh lại `openapi-meta.ts`, `openapi-schemas.ts`, api-client `generated/openapi.ts`, `rbac-cases`.
2. **Quyết định chính:**
   - V5-10: máy chủ quy đổi giờ trả theo một luật, trả `CheckoutSummary.checkoutAt`; Desk gửi đúng giá trị này cho QR và Trả phòng.
   - V5-13: `openRefunds[]` theo lý do, cho FD+.
   - V5-14: giá gõ đi vào báo giá; lệnh giữ chỗ nhận trường giá thì trả 422.
   - V5-15: Trả phòng nhận đơn quá ngày đi với ngày rời thật, chỉ OWN/MGR. Nút Cần dọn không đổi hợp đồng.
   - V5-44: `lockReason` thay dò chữ `detail`; trigger 0094 trả 409 thay 500.
   - V5-58: Wi-Fi qua operation riêng, ghi vào cột trang khách đang đọc; mật khẩu không vào audit hay log.
   - V5-63: `journald` với `MaxRetentionSec=90day`, `MaxFileSec=1day`, quyền 0640; log không vào bản sao lưu ngoài máy.
   - V5-62: giữ (a); đề xuất lượt hai lúc 15:30 vì 03:30 + 14:00 để hở tới 13 giờ 30.
3. **Không đổi hợp đồng:**
   - V5-46: đã có ở 0.3.12.
   - V5-50: Desk lọc theo `listRoomStatuses`.
   - V5-57: `q` đã tìm theo tên từ 0.3.7; QA kiểm lại rồi đóng BUG-R2-077.
4. **Thứ tự PR** (contract mục 2):
   - hợp đồng gộp trước;
   - BE-A frontdesk, BE-B folio/payments, BE-C platform, BE-sales làm song song;
   - FE gộp sau phần BE tương ứng;
   - nút Cần dọn, V5-50, V5-46 không chờ BE;
   - V5-73 gộp trước PR V5-1A.
5. **Kiểm cục bộ:**
   - Redocly 0 lỗi (6 cảnh báo, giống `main`);
   - traceability `--strict` exit 0;
   - rbac-cases `--check` OK;
   - typecheck 13/13;
   - unit API 1122 đạt;
   - contract test đạt.
   Trên CI, 4 job hợp đồng xanh.

## Tệp tạo/sửa (nhánh `r5-contract-0313`)
- `product/docs/api/openapi.yaml`
- `product/services/api/src/generated/openapi-meta.ts`
- `product/services/api/src/generated/openapi-schemas.ts`
- `product/packages/api-client/src/generated/openapi.ts`
- `product/tests/fixtures/rbac-cases.json`, `rbac-cases.csv`
- `rounds/round-05/outputs/ARC/contract-0.3.13.md`
- `rounds/round-05/outputs/ARC/report.md` (tệp này, trên `main`)

## Giả định (mục 6 tệp contract)
- G1: máy chủ quy đổi giờ trả rồi trả `checkoutAt`; Desk không tự ghép ngày với giờ.
- G2: trả phòng đơn quá ngày đi chỉ OWN/MGR, không có "lễ tân ghi, quản lý hậu kiểm". Hậu kiểm cần migration, và xác nhận bằng mật khẩu tại quầy thất bại khi quản lý bật 2FA. **DOM xác nhận.**
- G3: `openRefunds` chỉ FD+, kể cả ở `Folio.totals`; SAL không thấy.
- G4: Wi-Fi qua hai operation riêng, không dùng tham số; FD không đọc được (quyền S24). **DOM/SEC xác nhận.**
- G5: bộ lọc `removalsOnly` không cần chỉ mục mới; BE đo trên staging.
- G6: giá gõ trong báo giá (`QuoteInput.nightlyRates`) chỉ FD+ và kênh khác OTA.
- G7: lượt sao lưu thứ hai 15:30. Nếu giữ 14:00 thì ghi RPO "tối đa 13 giờ 30". Phải chốt trước khi INV xác nhận RPO ngày 20/11. **PO/ORC chốt.**
- G8: chia làn BE theo module. ORC đổi người làm được, miễn giữ thứ tự phụ thuộc.
- ESC mới: không có.

## Rủi ro / vướng mắc
- V5-1A: script hay công cụ thiếu giá đêm sẽ nhận 422. BE-C rà bootstrap và công cụ nhập danh mục căn; V5-73 phải lên trước.
- V5-63: phải bỏ `max-size`/`max-file` khi đổi sang journald, nếu không Docker không khởi động. OPS diễn tập trên staging trước.
- RB-id trong `rbac-cases` dịch số từ RB-0837 trở đi (thêm 22 ca của 2 operation Wi-Fi). Tài liệu QA trích RB-id cụ thể phải dò lại.

## Migration
- Mục đã chốt: không có.
- Có thể có, chờ DOM:
  - V5-30: dòng danh mục khóa, hoặc kind "Cần chú ý" mới;
  - V5-31: khóa phí dọn theo hạng;
  - V5-15 nếu chọn hậu kiểm (để v1.0.6).
- Ngoài hợp đồng: V5-17 có thể cần migration dữ liệu.
- Theo QC R4 ĐK-2: có migration thì v1.0.5 chờ diễn tập khôi phục (V5-61).

## Việc chưa xong (chờ DOM)
- V5-16: phần chặn theo vai. Nếu DOM chọn (a) như SEC đề xuất, ARC thêm 403 kèm `requiredFlow`. Bộ lọc tuần đã có.
- V5-30: cấu trúc bảng H2; ghi gì khi thiếu tỷ lệ lúc chốt đơn.
- V5-15: xác nhận vai (G2).
- V5-11, V5-31: ARC review khi DOM chốt luật.
- V5-58 (phụ): FD có cần đọc Wi-Fi trên Desk không (G4).

ARC làm bổ sung 0.3.13 trong ngày DOM chốt.
