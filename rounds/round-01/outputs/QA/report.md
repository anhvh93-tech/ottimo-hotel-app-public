# Báo cáo QA – Round 1 · Bước 2 Sản xuất · Đợt 4

- Vai: QA | Ngày: 15/10/2026 | Việc được giao: plan R1 mục 3.1 dòng QA, việc (1)–(3). Việc (4) (kiểm thử tài liệu, chạy CI khung) để bước 5.

> Ghi chú ORC: QA không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nội dung QA gửi, với sự đồng ý của INV. Các dòng decision-log đề xuất đã được ORC ghi.

## 1. Đã làm gì
1. **Chiến lược test** (`product/docs/qa/test-strategy.md`): 7 tầng (unit, API trên PostgreSQL thật, hợp đồng OpenAPI, ma trận quyền tự sinh từ `x-roles`, E2E Playwright, hiệu năng k6, thủ công khám phá); bộ "oracle" từ cột ví dụ của BR (`product/tests/fixtures/br-examples.json`, làm ở R2); môi trường và thiết bị tối thiểu; hai bộ dữ liệu DS-E (10 căn, chưa có đơn) và DS-0 (đơn mẫu BL 4.4, T0 = Thứ Năm 15/10/2026) + 11 tài khoản test theo vai; đồng hồ giả theo ADR-008 (bảng 17 mốc giờ gắn job J1–J16); tiêu chí vào/ra R1–R4+; ngân sách hiệu năng (kịch bản 50 yêu cầu đặt cùng một căn – đêm); mức lỗi P0–P3 cho sản phẩm và tài liệu; mẫu ghi lỗi `BUG-R<n>-xxx`.
2. **Test case** (`product/tests/test-cases/r1-main-flows.md`): **313 TC** (Cao 192 · TB 113 · Thấp 8). Phủ luồng 2–4 đầy đủ, 5–7 ở mức ca chính, L1, L8; 22 ca phân quyền/dữ liệu C3; 9 ca xuyên luồng. Ưu tiên lỗi BL 8.2: đặt trùng (cả song song), giữ chỗ hết hạn, phụ thu dài hạn, OOO chặn bán, ký quỹ (BR-208, BR-214), đơn OTA xung đột chưa gán căn (US-139, `RESERVATION_UNASSIGNED`).
3. **Ma trận truy vết** (`product/docs/qa/traceability.md`) sinh bằng `product/tests/tools/gen_traceability.py`: **74/74 story Must R2 có TC; 244/244 AC có ≥ 1 TC**; 0 `operationId` lạ, 0 tham chiếu AC sai, 0 mã TC trùng; 3 AC cần chức năng chưa có trong OpenAPI R2; **10 story Must R2 chưa có wireframe**; 26/30 lỗi BL 8.2 có TC chống tái phát (#11, #14, #22, #25 thuộc R3); 13 BR chưa được story/TC tham chiếu.
4. **Kiểm nhất quán sơ bộ**: tên trạng thái 15 máy khớp giữa state-machines, ERD, OpenAPI; 8 mã vai khớp giữa PRD, rbac, backlog, OpenAPI. Phần lệch ở mục 4.

## 2. File đã tạo/sửa
- `product/docs/qa/test-strategy.md`, `product/tests/test-cases/r1-main-flows.md`, `product/docs/qa/traceability.md` (sinh tự động), `product/tests/tools/gen_traceability.py`
- `rounds/round-01/outputs/QA/report.md` (ORC ghi hộ)

## 3. Giả định
- `[GIẢ ĐỊNH – chờ INV xác nhận]` Mọi kết quả mong đợi tính từ giá trị mặc định ở BR mục 13; INV đổi chính sách thì chỉ sửa file oracle.
- DS-0 = dữ liệu mẫu BL 4.4 với T0 = 15/10/2026; TC dùng dữ liệu riêng của AC chạy trên DS-E.
- Hoa hồng ví dụ BR-208 (CTV, NN, 6 tháng) = (7% + 1%) × 11.130.000 × 6 = 5.342.400, QA tự tính – cần DOM xác nhận.
- Khi tài liệu mâu thuẫn, TC ghi rõ đang test theo bên nào (hạn khai báo NN theo `earlier_of`; khoảng ngày khối OOO để mở).

## 4. Rủi ro / vướng mắc – lệch tài liệu sơ bộ (bước 5 đưa chính thức vào `qa/bug-list.md`)
| # | Mức | Lệch / thiếu | Vị trí | Vai |
|---|---|---|---|---|
| 1 | **P1** | Khoảng ngày khối OOO có tính ngày cuối không: BR-804 coi là bao gồm, BL 4.4 dùng nửa mở; `endDatePlanned` không nói rõ → hoặc trùng OTM-0154, hoặc mất 1 đêm khóa | BR-804; BL 4.4; erd 4.9; OpenAPI `RoomBlockCreate`; US-019, US-061 | ARC + DOM |
| 2 | **P1** | Đơn OTA nhập tay vào căn đã có khách: US-018 AC1 "bị chặn", còn OpenAPI/ERD cho tạo và server tự gán căn khác hoặc `conflictState=open` (US-139 R3 chạy từ R2, lễ tân có thể không biết căn bị đổi) | backlog US-018, US-139; OpenAPI; erd 7.2, 7.7 | PO + ARC |
| 3 | P2 | Mã lỗi khóa lạc quan: ADR-009 `409 VERSION_CONFLICT` vs OpenAPI/state-machines `412` | ADR-009; OpenAPI | ARC |
| 4 | P2 | Ví dụ BR-603 trái chế độ `earlier_of` | BR-603; architecture 9.1 | DOM (ESC-001) |
| 5 | P2 | Thời điểm xóa ảnh khách không đồng ý: "ngay" vs SEC T01 "trong 24 giờ" vs job J16 03:00 | BR-609; US-045/049; SEC T01; J16 | DOM + SEC + ARC |
| 6 | P2 | US-023 AC2 (Must R2) cần gộp hồ sơ, nhưng ERD để R3 và OpenAPI không có endpoint | backlog US-023; erd 4.4 | PO + ARC |
| 7 | P2 | US-087 AC2 cần endpoint hoa hồng (chưa có); US-003 AC3 endpoint báo cáo là R3 | OpenAPI; traceability 5.3 | ARC (PO xác nhận) |
| 8 | P2 | Màn mặc định `front_desk`: US-001/rbac "room rack" vs wireframe L1 "Hôm nay" | backlog US-001; rbac 1; wireframe 01 | UXD + PO |
| 9 | P2 | 10 story Must R2 chưa có wireframe: US-004, 005, 006, 027, 049, 050, 066, 071, 072, 125 (QC C1) | traceability 5.4 | UXD (PO quyết) |
| 10 | P3 | BR-607 thiếu trạng thái `void` | BR-607 | DOM |
| 11 | P3 | PRD 6.2 "CTV … xác nhận cọc" trái rbac A04 | PRD 6.2 | PO |
| 12 | P3 | CTV gửi yêu cầu gia hạn báo giá (A51) nhưng không theo dõi được (S23, `listApprovalRequests`) | rbac; OpenAPI | BA |
| 13 | P3 | Dữ liệu mẫu wireframe sai BR/BL: 202 có 4 khách (vượt sức chứa BR-110); giá gia hạn 402; bộ đếm giữ chỗ; `WO-031`; Emma ở 302 thay vì 102 | wireframe 02, 09 | UXD |
| 14 | P3 | 13 BR chưa có story/TC: BR-215, 313, 314, 501, 504, 505, 506, 513, 523, 705, 706, 902, 955 (đa số R3) | traceability 5.5 | PO |

**Rủi ro kiểm thử:** `FixedClock` chỉ đóng băng giờ, chưa tua được và chưa gọi job theo yêu cầu → không test E2E được giữ chỗ, khai báo, no-show, nhắc trả phòng. Đề xuất R2 `MutableClock` + endpoint/CLI kiểm thử ngoài production (thẻ cho ARC ở bước review). Kỳ vọng phụ thuộc ESC chưa quyết đã cô lập bằng tham số/oracle. Cột wireframe trong ma trận sẽ sinh lại ở bước 5.

**ESC mới:** không có.

## 5. Việc chưa xong
- Bước 5: chạy lại script truy vết; lập `rounds/round-01/qa/bug-list.md`; chạy `docker compose up` + `GET /health` (TC-X-050) và CI khung; viết `qa/test-report.md`.
- Chờ review bắt buộc của BA và PO (khuyến nghị QC).
- R2 tuần đầu: `br-examples.json`, seed DS-E/DS-0, script ma trận quyền từ `x-roles`, E2E smoke, ca cho 17 `operationId` chưa có TC.
- TC cho lỗi BL #11, #14, #22, #25 và story Must R3.
