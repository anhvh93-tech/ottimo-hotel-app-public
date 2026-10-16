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

---

## Bước 4 – Phản hồi & sửa (15/10/2026)

**Đã làm gì**
- Đã trả lời đủ 17 thẻ (BA 10, PO 7) trong `rounds/round-01/responses/QA-responses.md`. Kết quả: 17 Done, 0 Rejected, 0 Deferred, 0 Escalated. Không còn thẻ Major nào ở trạng thái Open (4/4 Major đã Done).
- Test case v0.2 tăng từ 313 lên **374 TC** (thêm 61). Có 38 ca gắn nhãn Smoke (S). Mục 10a mới gồm 20 ca bảo mật SR-SES, SR-DEV, SR-GST. Đã thêm ca cho các nhánh chuyển trạng thái còn thiếu (SM-10 A5/A6/A2, SM-02 O4/O5, SM-08 Q5, SM-14 hủy việc, SM-03 R9 từ CL, SM-13 settled→closed, SM-12 đối soát, B7a/B7b/B7c/B9a…). Đã thêm ca cho các AC mới mà PO viết ở bước 4 (US-141, US-142, US-001 AC4, US-018 AC5, US-139 AC3…) và 5 ca kiểm trường chỉ số.
- Đã áp các quyết định mới vào test case: khối OOO nửa mở; BR-603 khách nước ngoài +12 giờ; ngày nghiệp vụ đổi lúc 06:00; đơn OTA nhập tay vào căn đã kín → 409 kèm gợi ý; màn mặc định là "Hôm nay"; OTP hoặc mã lễ tân thay cho mã đặt phòng; thiết bị được cấp; MutableClock; xóa ảnh ngay khi `confirmed`; FOC minibar tự áp trong hạn mức tháng.
- Test-strategy v0.2:
  - tầng R/C lấy rbac-matrix làm chuẩn và có thêm bước kiểm tĩnh;
  - mục 2.0 về truy vết ba chiều;
  - sửa DS-0 (cọc OTM-0151, cách nạp dữ liệu);
  - thêm tài khoản `qa.hkmt` và các thiết bị test;
  - MutableClock và mốc 06:00;
  - bước PO nghiệm thu ở R2, UAT ở R3, bộ Smoke;
  - 2 dòng hiệu năng cho PWA nhân viên.
- Script `gen_traceability.py`:
  - sinh mục 7 "chuyển trạng thái → TC" (đọc mọi máy SM, hiện có 17 máy);
  - sinh mục 8 kiểm tĩnh rbac ↔ OpenAPI (đọc `rbac-matrix.json` cho A-xx và rbac-matrix.md cho S-xx/Dxx), có tùy chọn `--strict` cho CI;
  - thêm nhãn `[BLOCKED]`/`[UNDECIDED]`/`[GIẢ ĐỊNH QA]` và chỉ số AC chạy được ở R2;
  - thêm cột ESC, đếm Smoke, tùy chọn `--out`;
  - đọc được AC dạng "AC3 *(bước 4…)*:" và mã chuyển có hậu tố chữ (B7a).
- Chạy thử script (xuất ra scratchpad, **chưa** ghi đè `traceability.md`):
  - 145 story trong backlog, trong đó 77 Must R2; AC 267/267; AC chạy được ở R2 267/267;
  - chuyển trạng thái 101/121;
  - 0 operationId lạ, 0 tham chiếu AC sai, 0 mã TC trùng;
  - 20 operation lệch rbac ↔ OpenAPI, chờ BA/ARC xác nhận;
  - 1 tham chiếu chuyển `SM-05 review→partial` chưa có trong SM-05, đã đề nghị BA thêm.

- Đã áp tin ORC chuyển từ PO (16/10): TC-NT-023 chuyển sang US-074; ca khách đến 01:30 (BR-010, BR-602); US-141, US-142, US-139, US-119 AC5/AC6; US-136 theo BR-315 (TC-L2-074 viết lại, TC-L2-075 mới); TC-L2-053 và L4-025 áp BR-011.

**File đã sửa**
- `product/docs/qa/test-strategy.md`
- `product/tests/test-cases/r1-main-flows.md`
- `product/tests/tools/gen_traceability.py`
- `rounds/round-01/responses/QA-responses.md` (file mới)
- `rounds/round-01/outputs/QA/report.md` (phần này)

**Giả định**
- Đếm "30 ngày sau trả phòng" theo ngày lịch giờ VN.
- 5 cách hiểu biên khác được gắn nhãn `[GIẢ ĐỊNH QA – chờ DOM]`.
- D01 với người kiêm HK ∪ MT hiển thị theo màn đang mở.
- Chỉ owner được bật kênh gửi mã qua Zalo/OTA.
- Hạn mức FOC minibar tháng là 500.000 (chờ ESC-007).

**Rủi ro / vướng mắc**
- OpenAPI chưa có endpoint gửi OTP email và endpoint đổi giai đoạn lead (TC ghi "—").
- `x-visible-to` chưa gắn mã Dxx nên phải dùng bảng ánh xạ của QA.
- Các vai khác đang sửa song song nên số liệu có thể đổi. Phải chạy lại script ở bước 5.

**Việc chưa xong (bước 5)**
- Sinh lại `traceability.md`.
- Lập `qa/bug-list.md`: lỗi tài liệu P2 cho DOM từ các nhãn giả định, 20 lệch rbac ↔ OpenAPI.
- Chạy CI khung và `GET /health`.
- TC cho SM-16, SM-17 và SM-06 H3–H9 khi có story/AC.

---

## Bước 5 – Kiểm thử (16/10/2026)

**Đã làm gì**
- **Sinh lại ma trận truy vết** `product/docs/qa/traceability.md` v0.3, bản cuối R1. Script được sửa ba điểm:
  - đọc đủ wireframe 01–10 qua dòng `wf-meta` (bản cũ bỏ sót L10);
  - thêm cột **ERD**, gồm mục `erd.md` 4.x nêu US và mục suy từ tag của operation;
  - bỏ 6 lệch quyền báo giả.
- **Kết quả truy vết:**
  - 77/77 story Must R2 có đủ TC, endpoint, wireframe và ERD; 0 ô trống QC C1;
  - AC 267/267, AC chạy được ở R2 267/267;
  - chuyển trạng thái 101/121;
  - BR được tham chiếu 150/150;
  - BL 8.2 có TC 26/30 (#11, #14, #22, #25 thuộc R3).
- **Kiểm nhất quán chéo:** đối chiếu bằng script và đọc tay:
  - 15/15 enum trạng thái khớp;
  - mã lỗi khớp, trừ wireframe 10;
  - định dạng mã chứng từ;
  - 20 lệch rbac ↔ `x-roles`: 6 báo giả, còn 14 operation đã phân loại vào bug.
- **Kiểm kỹ thuật:**
  - chưa có node, pnpm, docker, nên TC-X-050 và CI là **BLOCKED (môi trường)**, không báo đạt;
  - 29/29 YAML/JSON hợp lệ; OpenAPI qua openapi-spec-validator;
  - không tìm thấy bí mật thật; `.env.example` chỉ chứa placeholder.
- **Lập `qa/bug-list.md`:** 22 lỗi, gồm **P0 0 · P1 0 · P2 9 · P3 13**. Đã đóng 3 lỗi: 2 lỗi QA tự sửa (mẫu số bill trong TC, script) và ví dụ BR-107 đã khớp. Lập `qa/test-report.md`, có đánh giá QA cho từng dòng QC A1–C5.

**File đã tạo/sửa**
- `product/docs/qa/traceability.md` (sinh lại, v0.3)
- `product/tests/tools/gen_traceability.py`
- `product/tests/test-cases/r1-main-flows.md` (v0.2.1: TC-NT-022, TC-L4-053 theo BR-007 v0.2)
- `rounds/round-01/qa/bug-list.md`, `rounds/round-01/qa/test-report.md` (mới)
- `rounds/round-01/outputs/QA/report.md` (phần này)

**Giả định**
- Cột ERD được suy từ tag OpenAPI qua bảng `TAG_ERD` của QA. Cột này chứng minh mỗi story có bảng, chưa chứng minh đủ cột.
- Kiểm quyền: nếu operation có mã A-xx thì bỏ mã màn hình S-xx; nhiều mã A-xx tính hợp. `listRooms` cho HK/MT được xếp **P2** thay vì P1 mặc định, sau khi xem lại từng trường: giá đã che bằng `x-visible-to`, không lộ C2/C3.

**Rủi ro / vướng mắc**
- C2 chưa có bằng chứng `/health` OK và CI xanh.
- Kiểm wireframe ↔ RBAC mới đọc tay 4/10 trang.
- `gen_traceability.py --strict` còn exit 1 cho đến khi đóng BUG-R1-005.

**ESC mới:** không có. Việc chờ cài công cụ không cần INV quyết.

**Việc chưa xong**
- Chạy TC-X-050 và CI ngay khi máy có node, pnpm, Docker (test-report mục 5).
- Kiểm lại các lỗi khi tác giả báo Fixed.
- R2 tuần 1: BUG-R1-016 (quy ước mã DS-0) và -020; TC cho 2 mã lỗi mới (BUG-R1-007).
