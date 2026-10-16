# Cổng chất lượng (QC Gate) – Round 1

- Người chấm: QC Inspector | Round 1 – Bước 6 | Ngày: 16/10/2026
- Căn cứ: `rounds/round-01/plan.md` mục 7 (A1–A16, B1–B5, C1–C5) và quy tắc ra quyết định ở đó; protocol mục 6, 7, 8, 10
- Trạng thái repo được chấm: commit `7345eed` (round-1: testing – re-test pass 2) + cây làm việc hiện tại
- Nguyên tắc: QC tự mở file, tự đếm, tự chạy script. Báo cáo của QA (`qa/test-report.md`, `bug-list.md`, `sec-findings.md`) chỉ là đầu vào tham khảo; mục 4 ghi 7 điểm QC kiểm lại độc lập

---

## 1. Quyết định

# ĐẠT CÓ ĐIỀU KIỆN

Lý do: nhóm A (16/16) và nhóm B (5/5) đều đạt, có bằng chứng QC tự kiểm. Nhóm C thiếu **2 dòng**: **C2** (khung repo chưa từng chạy: chưa có `/health` OK, chưa có CI xanh) và **C4** (thẻ Major FB-R1-ARC-OPS-02 để trạng thái "Escalated" nhưng không có ESC nào nhận nó). Cả hai đều có cách xử lý cụ thể, hạn rõ, và không chặn việc bắt đầu thiết kế chi tiết R2. Số dòng thiếu nằm trong ngưỡng "nhóm C thiếu ≤ 2 dòng" của plan mục 7.

Không có P0/P1 mở. Không có thẻ Blocker/Major ở trạng thái Open. Không có lỗi bảo mật nghiêm trọng còn mở. Chưa có code tính tiền, nên chưa có rủi ro sai tiền trong phần mềm.

Ý nghĩa: Round 2 **được bắt đầu Đợt 0 (tuần 1)**. Nếu đến hết tuần 1 R2 điều kiện ĐK-2 (C2) chưa đóng, QC **chặn** việc merge code tính năng đầu tiên của R2 (xem mục 3).

---

## 2. Bảng kiểm từng tiêu chí

Ký hiệu: **ĐẠT** / **KHÔNG**. "QC tự kiểm" = QC tự mở file, đếm hoặc chạy lệnh; "Dựa QA" = QC chỉ lấy mẫu kiểm lại báo cáo của QA.

### A. Đủ

| Dòng | Kết quả | Bằng chứng (QC tự kiểm) |
|---|---|---|
| A1 | **ĐẠT** | 36/36 file đầu ra ở plan mục 3.1 tồn tại (kiểm từng đường dẫn, kèm số dòng; ví dụ `openapi.yaml` 6.988 dòng, `erd.md` 1.279, `backlog.md` 848). 13 ADR trong `product/docs/adr/`. 10 trang wireframe + `index.html`. 11/11 vai sản xuất (PO, DOM, BA, UXR, UXD, ARC, OPS, INT, QA, SEC, DATA) có `outputs/<VAI>/report.md`, mỗi file có đủ 5 mục: Đã làm gì, File tạo/sửa, Giả định, Rủi ro/vướng mắc, Việc chưa xong (grep tiêu đề). Ghi chú: UXD đặt tên mục đợt 4 là "Đ4.x", nhưng nội dung vẫn đủ |
| A2 | **ĐẠT** | `PRD.md`: mục tiêu kinh doanh 3.1; chỉ số S1–S7 có đích bằng số (0 lần đặt trùng, 100%, ≤ 5 phút, ≤ 3 phút, ≥ 40%, ≤ 3 phút, 100%). Mục 4 có 5 nhóm U1–U5 (4 nội bộ + khách). Có bảng phân hệ M0–M15 (mục 5.2) với cột MVP-R2 / MVP-R3 / Sau MVP. Ngoài phạm vi X1–X11 (mục 5.3). Giả định ở mục 9 |
| A3 | **ĐẠT** | Script QC tự viết (không dùng script QA) đọc backlog: 145/145 story theo mẫu "Là… tôi muốn… để…", có MoSCoW, có round, có cột Nguồn BL không rỗng (0 lỗi). Chia theo nhóm: Must R2 77, Must R3 19, Should R3 32, Should R2 5, Could R3 8, Could R4+ 4. Mục 4: 77/77 story Must R2 có ≥ 2 AC dạng Given/When/Then. Đọc mẫu US-018 (5 AC), US-019, US-026: AC có số cụ thể, kiểm chứng được |
| A4 | **ĐẠT** | PRD 6.1 phủ đủ 7 bước của khách: tìm, đặt, thanh toán, check-in, lưu trú, check-out, đánh giá. Bước "đánh giá" có US-105 và US-116 (R3). PRD 6.2 phủ 4 luồng nhân viên. Backlog có epic EP00–EP18 phủ các bước |
| A5 | **ĐẠT** | `baseline-issues-triage.md`: đủ 30/30 dòng (#1–#30). Phân loại: Sửa 25, Cần INV 4, Bỏ 1. Có cột "Vai xử lý". 25/25 dòng "Sửa" có mã BR hoặc US liên kết (script QC) |
| A6 | **ĐẠT** | `open-questions-resolution.md` có đủ 26/26 câu, mỗi câu dẫn tới ESC-xxx hoặc decision-log. Hai câu không ghi mã ESC (#24, #26) đã được QC dò ngược: cả hai có dòng decision-log mang nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` (decision-log dòng 50 và 89). Cả 12 ESC (001–012) đủ 8 trường định dạng protocol (Người tạo, Bối cảnh, Câu hỏi, Phương án, Đội đề xuất, Nếu chưa quyết, Hạn, Trạng thái) |
| A7 | **ĐẠT** | `rbac-matrix.md` có: ma trận theo màn hình (mục 3), theo hành động 4.1–4.7, theo trường nhạy cảm (mục 6: giấy tờ, giá vốn, P&L S21, hoa hồng S17). Mục 7 riêng giải quyết mâu thuẫn BL mục 2 và 8.2 #27. Có 8 mã vai + khách. QC tự chạy script truy vết: rbac ↔ OpenAPI có 0 operation lệch, 0 trường lệch, 0 mã lạ |
| A8 | **ĐẠT** | `state-machines.md`: SM-01 đơn, SM-06 hợp đồng, SM-03 buồng, SM-04 phiếu sửa, SM-05 khai báo (đủ K1–K13), cùng 12 máy khác. Mỗi bảng chuyển có cột "Điều kiện (server kiểm)" và "Ai được chuyển" |
| A9 | **ĐẠT** | Có 8 luồng bắt buộc (trang 01–08) và 2 trang thêm (09, 10). Trang 02, 03, 04 đều có loading, rỗng và lỗi (grep đếm: 02 = 6/13/10, 03 = 4/8/6, 04 = 3/5/5). `content-guide.md` mục 8 có bảng chuỗi VI/EN cho Luồng 2, 3, 4 và 7 |
| A10 | **ĐẠT** | `tokens.json` có `color.light` và `color.dark`. Thang chữ Lora + Be Vietnam Pro (design-system mục 3). Có 32 component (mục 5, ≥ 10). Mục 8 có A1–A7 khắc phục đủ 7 gạch đầu dòng của BL 8.3, kèm A8–A15 bổ sung |
| A11 | **ĐẠT** | `erd.md` mục 13.1 đối chiếu 21/21 thực thể BL 4.1–4.21 sang bảng, có cột R2/R3. QC lấy mẫu 11 bảng: cả 11 có định nghĩa. OpenAPI hợp lệ (QC tự chạy `openapi_spec_validator`: OK). 77/77 story Must R2 có endpoint (script `--strict`). ADR-001…013. ADR-010 ước tính chi phí phương án A ~450.000–900.000 đ/tháng, dưới 1 triệu |
| A12 | **ĐẠT** | `integrations.md` mục 2 có I1–I9: channel manager, VietQR, VNPay, MoMo, MISA meInvoice, khóa cửa, Zalo, email, khai báo lưu trú. Mỗi mục có cột Round và cột "INV phải cung cấp". Mục 4 gom danh sách khóa/tài khoản. `channel-manager-comparison.md` so sánh 4 phương án (Beds24, ezCloud, Channex, Cloudbeds) |
| A13 | **ĐẠT** | `test-strategy.md`, `r1-main-flows.md` (383 TC), `traceability.md`. QC tự chạy `gen_traceability.py --strict --out <scratch>` (để không ghi đè file của QA): **exit 0**. Bản QC sinh ra trùng khớp từng dòng với `traceability.md` đã commit |
| A14 | **ĐẠT** | `data-risk-assessment.md`: kiểm kê (mục 4), phân loại C0–C3 (mục 3), cơ sở pháp lý ND 13/2023 (mục 5; 6 lần dẫn), thời hạn lưu/xóa đề xuất (mục 7, ghi rõ cần luật sư). `threat-model.md`: QC tự đếm 62 mối đe dọa, trong đó 28 mức High/Critical. Cả 28 đều có cột "Biện pháp chính" có nội dung |
| A15 | **ĐẠT** | `metrics-definitions.md` có K-03 Occupancy, K-04 ADR, K-05 RevPAR và GOP. Quy ước Q-01…Q-15 xử lý các mục #8, #11, #22, #28, #29 (grep: mỗi mã xuất hiện 3–5 lần) |
| A16 | **ĐẠT** | Đầu `personas.md`, `journeys.md`, `heuristic-review-r0.md` có ghi "mô phỏng". `personas.md` mục 9 là danh sách giả thuyết cần INV kiểm chứng. ESC-003 gom 7 điều cần kiểm chứng |

### B. Nhất quán

| Dòng | Kết quả | Bằng chứng |
|---|---|---|
| B1 | **ĐẠT** | QC tự trích enum từ OpenAPI và so với BR-301, ERD, SM, rbac: trạng thái đơn `hold, confirmed, in_house, checked_out, cancelled, no_show` khớp BR-301 và ERD dòng 564. Mã buồng `VC, VI, VD, CL, OC, OD, OOO` khớp. Phiếu sửa `new, in_progress, waiting_parts, done, cancelled` khớp SM-04. Khai báo (10 trạng thái) khớp SM-05. 8 mã vai khớp giữa `Role` trong OpenAPI, rbac mục 1 và wireframe 01. `bug-list.md`: P0 1 Closed, P1 1 Closed, **0 P0/P1 mở**. Còn 4 lỗi P3 Open về chữ/ví dụ (014, 015, 017, 023), đã có kế hoạch W11 |
| B2 | **ĐẠT** | Mẫu story ↔ BR khớp: US-018 AC5 ↔ BR-317 (đơn OTA trùng không bị chặn); US-026 ↔ BR-411/414; TC-L3-015 ↔ BR-413 (111.000). Mẫu wireframe ↔ RBAC khớp: trang 06 (buồng phòng) ghi rõ "không giá vốn, không giá bán"; trang 05 (sale/CTV) không hiện số giấy tờ. Hợp đồng quyền có 0 lệch với rbac. Toàn bộ 13 thẻ DOM-on-PO đều Done. Giới hạn: QC và QA mới đọc tay một phần wireframe (QA 4/10, QC 2 trang thêm) |
| B3 | **ĐẠT** | QC lấy mẫu số trong test case và so với BR: TC-L3-015 (11.130.000 ÷ 30 → 30% = 111.000) khớp BR-413. TC-L5-001 (−10%, làm tròn 713.000, hoa hồng CTV 8% = 399.280) khớp BR-107, BR-005, BR-903. Các tài liệu BA (`business-processes`, `use-cases`, `state-machines`) không có % nào không dẫn mã BR (grep). Còn sót: một chỗ ghi cứng ở state-machines dòng 113 (BUG-019, chấp nhận) và ví dụ `billNo` cũ trong OpenAPI (BUG-014, P3) |
| B4 | **ĐẠT** | 150/150 BR có cột nguồn/nhãn (GIẢ ĐỊNH / NGÀNH / pháp lý / BL…), script QC đếm 0 dòng thiếu. Decision-log có 250 dòng, 33 dòng mang nhãn giả định. QC lọc các dòng không có nhãn nhưng chứa chữ "phí / giá / % / FOC / hoa hồng": tất cả là quy ước kỹ thuật, quy ước ngành hoặc quy tắc kiểm soát. Không có con số chính sách kinh doanh nào thiếu nhãn. Chính sách (giá, hủy, phụ thu, VAT) đều nằm ở ESC-004…008 |
| B5 | **ĐẠT (tĩnh)** | `.env.example` chỉ có placeholder `change_me_*_dev_only`, provider để `off` / `mock` / `manual`. QC tự dò mẫu khóa (AKIA, sk_live_, private key, ghp_, xox, AIza) trên toàn repo: không có khóa thật (khớp duy nhất là câu mô tả trong báo cáo OPS). Không có file `.env`. Chưa có gitleaks chạy trên lịch sử git (cần CI, gắn ĐK-2) |

### C. Đủ để code

| Dòng | Kết quả | Bằng chứng |
|---|---|---|
| C1 | **ĐẠT (có ghi chú)** | `--strict` exit 0: Must R2 77/77, AC 267/267 có TC, không story nào thiếu endpoint, wireframe hoặc ERD. QC tự kiểm 3 story: US-018 có 8 TC, 5 operation, ERD 3 chỗ dẫn; US-044 có 4 TC, 4 operation; US-141 có 5 TC, 3 operation, L7 màn OTP (có thật trong `07-guest-app.html`). **Ghi chú độ tin cậy**: (1) cột wireframe của 27 story lấy từ bảng `WF_QA` QA tự ghi tay trong script. QC kiểm 2 ánh xạ (US-018 → L2 §2.2 "có lỗi trùng lịch"; US-141 → L7 OTP): đúng. (2) Cột ERD được suy theo *tag* của operation ra *mục* ERD, không phải bảng hay cột cụ thể. Ví dụ US-141 không được ERD nhắc tên nhưng vẫn ra "4.5, 4.11". Ma trận đạt về hình thức; độ chi tiết ERD cho từng AC chưa được chứng minh (rủi ro 3) |
| C2 | **KHÔNG** | Chưa có bằng chứng chạy. `which node pnpm docker` trên máy (QC chạy 16/10): cả ba đều *not found*. Không có `product/pnpm-lock.yaml`. Repo không có remote (`git remote -v` rỗng), nên CI GitHub chưa từng chạy lần nào. Mã `/health` có trong `services/api/src/health/`, `dev-setup.md` có hướng dẫn, `ci.yml` có 5 job parse được, nhưng **chưa có lần chạy nào**. Kiểm tĩnh của QA (bash -n, YAML, `check-no-test-surface.sh`) không thay được tiêu chí "dựng được, /health OK, CI xanh" |
| C3 | **ĐẠT** | Chống đặt trùng: ADR-009 dùng một bảng `room_occupancy` với `EXCLUDE USING gist (room_id WITH =, stay_range WITH &&)`. Mã duy nhất: `doc_sequence` + RLS (erd dòng 77–78, 129). OOO chặn bán: `room_block` 1–1 `room_occupancy` (erd dòng 189). Job theo lịch: architecture J1 `hold.expire`, J2, J4 `checkout.reminders`, J5 `registration.deadline` (hạn theo BR-602/603), J9 `ooo.activate`. Múi giờ: ADR-008 Asia/Ho_Chi_Minh, `daterange` nửa mở |
| C4 | **KHÔNG** | Script QC tự đối chiếu **286 thẻ** ở 24 file review với `responses/*`: 286/286 có trả lời. Blocker 3 (3 Done), Major 106 (105 Done, **1 Escalated**), Minor 134, Suggestion 43. **0 Open. 0 Rejected.** Phần trượt: **FB-R1-ARC-OPS-02 (Major)** – trạng thái "Escalated" (OPS-responses dòng 23), nhưng **không ESC nào nhận câu này**. Đã kiểm 12 file ESC và index, không có nội dung về GitHub, repo, CI, Node hay Docker. OPS-responses mục 6 đề xuất ESC "cho phép đưa mã lên GitHub riêng tư", nhưng ORC chưa tạo hay gộp. Plan R2 R2-2 cũng dẫn tới "ESC repo của OPS" không tồn tại. Thẻ này đúng là nguyên nhân gốc của C2, nên coi như **Major chưa được giải quyết** |
| C5 | **ĐẠT** | Có `rounds/round-02/plan.md` (PO + ORC, 16/10, ghi rõ "Dự thảo – chờ INV trả lời ESC"). Plan chọn 72/77 story Must R2 theo phương án R-C và liệt kê theo epic (mục 2.1, dẫn 24 mã story). Có W1–W18 chuyển từ R1. Các đề xuất của QA (test-report mục 7) đã vào plan: SEC-10 → W15, SEC-11 → W16, SEC-07 phần BE → W17, SEC-06/08 → W18, BUG-023 → W11. Tiêu chí chỉ đòi bản *dự thảo*, nên đạt. Plan còn phụ thuộc ESC-012 (theo dõi ở mục 3) |

### Kiểm tra quy trình bổ sung (skill QC)

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Review bắt buộc theo ma trận plan mục 5 | Đủ 20/20 | BA-on-PO, DOM-on-PO, PO-on-DOM, BA-on-DOM, DOM-on-BA, ARC-on-BA, PO-on-UXR, UXD-on-UXR, UXR-on-UXD, PO-on-UXD, BE-on-ARC, SEC-on-ARC, ARC-on-INT, SEC-on-INT, ARC-on-OPS, SEC-on-OPS, BA-on-QA, PO-on-QA, ARC-on-SEC, PO-on-DATA (+ 4 review khuyến nghị: DATA-on-ARC, DOM-on-INT, DOM-on-UXR, SEC-on-BA) |
| Review khuyến nghị QC → QA | Không làm | Không có `reviews/QC-on-QA.md`. Đây là review *khuyến nghị*, không bắt buộc. Nhận xét chính của QC về QA nằm ở C1 (cách script tính độ phủ) |
| Lỗi P0/P1 | 0 mở | bug-list: SEC-01 (P0), SEC-02 (P1) Closed, QC đã kiểm lại (mục 4) |

---

## 3. Điều kiện kèm theo (bắt buộc đóng; QC kiểm lại)

| # | Dòng | Việc | Ai | Hạn | Cách đóng (bằng chứng QC cần thấy) |
|---|---|---|---|---|---|
| **ĐK-1** | C4 | Tạo ESC cho thẻ FB-R1-ARC-OPS-02. Có thể tạo ESC-013 "Cho phép đưa mã nguồn lên GitHub riêng tư để chạy kiểm tra tự động + cài Node 22/pnpm/Docker trên một máy dev", theo đề xuất OPS-responses mục 6, hoặc gộp thành câu phụ của ESC-002. Viết theo định dạng protocol, có phương án và đề xuất của đội, mức khẩn **Gấp** vì chặn W4. Cập nhật `escalations-index.md`. Sửa ghi chú thẻ trong `OPS-responses.md` thành "Xem ESC-0xx". Sửa plan R2 R2-2 dẫn đúng mã ESC | ORC (OPS soạn nội dung) | **Trước khi gửi `round-summary.md` R1 cho INV (Bước 7 R1)** | File ESC có đủ 8 trường; index có dòng mới; response và plan R2 trỏ đúng mã |
| **ĐK-2** | C2 | Làm W4 + W18 (+ W3 phần lockfile): trên máy có Node 22/pnpm/Docker, làm đúng `dev-setup.md` từ đầu. Chạy `docker compose up`, `GET /health` trả OK có `db: up` (TC-X-050). Commit `pnpm-lock.yaml`. Có **một lần chạy CI xanh đủ 5 job** (build-test, test-surface-guard, contract-lint, secrets-scan, docker-build) kèm link. Chạy TC-X-065 (4 vai DB trên PG 17 thật) và TC-X-066. Đóng BUG-R1-SEC-06, SEC-08 | OPS (chạy) + QA (xác nhận, cập nhật test-report) + SEC (đóng SEC-06/08) | **Hết tuần 1 R2 (Đợt 0)** – phụ thuộc INV trả lời ĐK-1 | Link lần chạy CI xanh; log/ảnh `/health` OK; QA ghi Đạt cho TC-X-050/065/066. **Nếu quá hạn: QC chặn merge code tính năng đầu tiên của R2 (Sprint 1)** cho tới khi đóng |

Việc phải theo dõi nhưng **không** phải điều kiện cổng R1 (đã có trong plan R2, QC sẽ kiểm ở cổng R2):
- **BUG-R1-SEC-10 (P2, W15)**: QC tự xác nhận trong `openapi.yaml`: `getDoorCredential` chỉ có responses `200, 404`, không có `x-step-up`, không có `x-c3-log`. Còn `renderDoorCodeMessage` thì có đủ. Bắt buộc sửa contract **trước khi BE cài A21**. Nếu không, mã cửa C3 xem được mà không qua step-up.
- **ESC-012**: PO + ORC chốt plan R2 trong 2 ngày sau khi INV trả lời. Nếu INV chọn R-A hoặc R-B, áp mục 2.4 và QA sinh lại traceability (W12).
- **W11**: BUG-R1-014, 015, 017 (phần ARC), 023 (P3).
- ORC ghi vào `decision-log.md` dòng: "QC Round 1: ĐẠT CÓ ĐIỀU KIỆN (ĐK-1 C4, ĐK-2 C2)". QC không tự ghi vì lần này được giao chỉ ghi `qc-gate.md`.

---

## 4. Lấy mẫu kiểm lại báo cáo QA (7 điểm, QC tự làm)

| # | Khẳng định của QA | QC kiểm thế nào | Kết quả |
|---|---|---|---|
| 1 | `--strict` exit 0, 77/77, 267/267, 383 TC, 0 lệch rbac | Tự chạy script, ghi ra thư mục tạm, rồi so với file đã commit | **Đúng.** Exit 0, số liệu khớp, file sinh lại trùng khớp |
| 2 | OpenAPI 0.2.1-draft hợp lệ | Tự chạy `python3 -m openapi_spec_validator` | **Đúng** (OK) |
| 3 | BUG-R1-SEC-01 (P0) Closed | Đọc `renderMessage` và `renderDoorCodeMessage` | **Đúng.** `renderMessage` từ chối mẫu C3 với mọi vai (`C3_TEMPLATE_USE_DEDICATED_ENDPOINT`). Endpoint riêng có FD+, thiết bị tin cậy, step-up, `x-c3-log`, 401/403/429 |
| 4 | BUG-R1-SEC-02 (P1) Closed | Đọc `setParameter` + `rbac-matrix.json` A119 | **Đúng.** Có `x-security-parameters` và biên cứng → `422 PARAM_OUT_OF_RANGE`; A119 chỉ cho `owner`. Phần thiếu A119 trong `x-rbac` là SEC-11 (đã Deferred), khớp với QA |
| 5 | BUG-R1-005 Closed | Đọc `x-roles` của `listRooms` và `listRoomGroups` | **Đúng.** Không còn `housekeeping` và `maintenance` |
| 6 | BUG-R1-014 vẫn Open | Grep `billNo` | **Đúng.** Ví dụ `F-261022-0003` còn ở dòng 2095 và 6186 |
| 7 | "Thẻ Blocker/Major đều đã trả lời" (C4 Đạt) | Script đối chiếu 286 thẻ | **Đúng một phần.** 0 Open, nhưng QA **bỏ sót** FB-R1-ARC-OPS-02 "Escalated" mà không có ESC → QC chấm C4 KHÔNG |

Thêm: QC kiểm 2 thẻ Major/Blocker đã báo Done (FB-R1-BE-ARC-01 → erd 2.4 có 7 hàm `SECURITY DEFINER`; FB-R1-SEC-INT-01 → README INT có `scrubCardData`). Cả hai có nội dung thật trong tài liệu. Riêng `scrubCardData` mới ở mức tài liệu, phần cài đặt là W9 R2.

---

## 5. Hạng mục trượt và vai chịu trách nhiệm

| Dòng | Hạng mục | Vai chịu trách nhiệm |
|---|---|---|
| C2 | Khung repo chưa chạy, chưa có lockfile, chưa có CI xanh, chưa có repo từ xa | OPS (thực hiện), ORC (lấy quyết định của INV), INV (cài công cụ / cho phép repo) |
| C4 | Thẻ Major FB-R1-ARC-OPS-02 "Escalated" nhưng không có ESC | ORC (tạo/gộp ESC), OPS (soạn nội dung) |

## 6. QC không kiểm được / giới hạn

- Không chạy được ứng dụng, Docker, PostgreSQL, CI (máy không có công cụ). C2 vì vậy chấm theo việc **không có** bằng chứng.
- Không đọc hết 6.988 dòng OpenAPI hay toàn bộ 286 thẻ. Thẻ "Done" chỉ được lấy mẫu (2 thẻ Major/Blocker + 4 lỗi QA).
- Không mở wireframe trên trình duyệt (chỉ đọc mã HTML). Chưa kiểm tương phản thực tế và bàn phím.
- Không đánh giá tính đúng pháp lý của ND 13/2023 và thời hạn lưu (chờ luật sư – ESC-001). Không xác minh giá hosting thật (ADR-010 tự ghi "[Chưa xác minh]" ở một số dòng).
- Không tạo `outputs/QC/report.md` và không ghi decision-log vì Điều phối viên giao chỉ ghi `qc-gate.md`. ORC ghi dòng decision-log như mục 3.

---

## 7. Ba rủi ro chất lượng lớn nhất cho Round 2

1. **Khung kỹ thuật chưa từng chạy, nhưng đã chứa nhiều lựa chọn dễ vỡ.** Gồm: Node ≥ 22.12 với `require(esm)` và TypeScript 5.8 `nodenext`; cú pháp `GRANT … WITH INHERIT FALSE, SET TRUE` cần PG ≥ 16; 4 vai DB + RLS + 7 hàm `SECURITY DEFINER`; bước bundle phụ thuộc `/app/dist`. Tất cả mới được kiểm tĩnh. Lần chạy đầu rất có thể đỏ ở nhiều chỗ cùng lúc, và mọi tiêu chí R2 (CI xanh, staging, E2E) đều đứng sau lần chạy này. Thêm vào đó, quyết định repo/công cụ còn chưa được hỏi INV (ĐK-1). → Giảm thiểu: ĐK-1 mức Gấp; ĐK-2 là việc số 1 của tuần 1; QC chặn merge tính năng nếu trễ.
2. **Năng lực BE và phạm vi chưa chốt.** BE ước 20–25 tuần-người, ARC ước 9–11. Plan R2 chạy theo giả định R-C khi ESC-012 chưa có trả lời. Chính sách ESC-004…008 đang dùng giá trị mặc định. Thẻ BE-ARC 01–07 chưa chốt (W10). Nguy cơ: đội cắt góc test ở các phần tiền (folio, phụ thu, cọc), hoặc phải làm lại khi INV trả lời khác mặc định. → Giảm thiểu: ORC chốt số luồng BE tuần 1; mọi con số chính sách đi qua tham số và `br-examples.json` (W7); QC R2 sẽ không cho qua nếu thiếu test tự động cho logic tiền.
3. **Lỗ hổng hợp đồng cho dữ liệu C3 và độ mịn ERD.** SEC-10 (xem mã cửa không có step-up/nhật ký) và SEC-11 (operation C3 thiếu `x-c3-log`, 401/403) còn mở trên contract. US-141 (xác minh khách) bị dời theo R-C trong khi app khách vẫn hiện thông tin lưu trú. Ma trận truy vết chỉ chứng minh ERD ở mức *mục*, không ở mức *cột*, nên BE có thể phát hiện thiếu cột giữa sprint. → Giảm thiểu: W15 xong trước A21; SEC review bắt buộc mọi PR guest-web (P-R2-4); QA thêm luật SEC-11 vào `--strict` (W5) và làm mịn cột ERD theo bảng/cột cho story Must R2.
