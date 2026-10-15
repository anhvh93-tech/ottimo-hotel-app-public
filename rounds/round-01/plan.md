# Kế hoạch Round 1 – Chuẩn hóa từ Baseline & Thiết kế nền móng

- Người lập: PO (cùng ORC) | Ngày: 15/10/2026 | Trạng thái: Bản nháp chờ ORC duyệt (ARC, QA góp ý ở đầu bước 2)
- Đầu vào gốc: `00-brief/investor-brief.md`, `01-decisions/decision-log.md`, `product/docs/round-0-baseline.md` (gọi tắt **BL**), `product/legacy/round-0-prototype/ottimo-desk.html`, `03-backlog/backlog.md` (đang rỗng)

---

## 1. Mục tiêu Round 1

Biến prototype Round 0 (một file HTML, dữ liệu mẫu) thành **bộ tài liệu đủ để code ở Round 2**, không khám phá lại từ con số 0.

Kết thúc Round 1 phải có:
1. **PRD MVP + backlog có ưu tiên** (MoSCoW, round dự kiến) truy được về từng mục của BL.
2. **Quy tắc kinh doanh đã chuẩn hóa** (mã BR-xxx), trong đó 30 lỗi ở BL mục 8.2 đều đã được phân loại và có hướng xử lý.
3. **Quy trình nghiệp vụ, sơ đồ trạng thái và ma trận phân quyền** cho 4 nhóm người dùng nội bộ (chủ đầu tư, lễ tân, buồng phòng/bảo trì, CTV/sale) + khách.
4. **Design System OTTIMO** (giữ kem – gỗ sồi, Lora + Be Vietnam Pro) và **wireframe các luồng chính**.
5. **Kiến trúc thật, ERD, API contract nháp, lựa chọn công nghệ** trong ngân sách hạ tầng giả định ≤ 1 triệu đ/tháng.
6. **Khung repo + môi trường dev + CI cơ bản** chạy được (CI xanh trên khung rỗng).
7. **Danh sách tích hợp** (channel manager, thanh toán, MISA meInvoice, khóa cửa thông minh, Zalo/email, khai báo lưu trú) + **so sánh channel manager**.
8. **Chiến lược test + test case luồng chính**; **đánh giá rủi ro dữ liệu cá nhân** (CCCD/hộ chiếu, Nghị định 13/2023).
9. **26 câu hỏi mở (BL mục 9)** đã được xử lý hết: hoặc đội tự chốt (ghi decision-log), hoặc gom vào ESC kèm phương án đề xuất.

## 2. Phạm vi

### 2.1 Trong phạm vi Round 1
- Tài liệu sản phẩm, nghiệp vụ, nghiên cứu (mô phỏng), thiết kế, kiến trúc, tích hợp, bảo mật, test.
- Khung repo kỹ thuật (thư mục, cấu hình, Docker dev, CI lint/test trên khung rỗng, endpoint `health`).
- Wireframe/prototype HTML tĩnh cho luồng chính (không gắn backend).
- Định nghĩa chỉ số (DATA – mức nhẹ, xem mục 3.2).
- Gom ESC cuối round.

### 2.2 Ngoài phạm vi Round 1
- Code tính năng thật (đặt phòng, folio, thanh toán, khai báo…) → Round 2.
- Kết nối thật với bên thứ ba (sandbox chỉ tìm hiểu tài liệu; không đăng ký tài khoản, không dùng khóa thật).
- UI hoàn chỉnh (hi-fi) cho mọi màn hình → Round 2 theo luồng.
- Tracking sự kiện, dashboard chỉ số chạy từ dữ liệu thật → Round 3.
- Staging/production, giám sát, sao lưu → Round 2–3 (OPS).
- Phỏng vấn người dùng thật (đội AI không làm được) → persona/hành trình là **mô phỏng**, INV kiểm chứng.
- Sửa prototype Round 0 (giữ nguyên làm tham chiếu trong `product/legacy/`).

### 2.3 Quyết định phạm vi của PO trong round này (ORC ghi decision-log khi commit)
| # | Quyết định | Lý do |
|---|---|---|
| P1 | **DATA tham gia nhẹ ở Round 1**: chỉ viết `metrics-definitions.md` (Occupancy, ADR, RevPAR, GOP, ALOS, tỉ lệ dài hạn/ngắn ngày, phí kênh, thực thu). Tracking + dashboard để Round 3 | BL có 5 lỗi số liệu liên quan chỉ số (8.2 #8, #11, #22, #28, #29: giữ chỗ tính là đêm đã bán, đêm khả dụng không trừ OOO, P&L lệch bảng kênh…). Nếu không chốt công thức trước khi ARC vẽ ERD thì Round 2 sẽ lưu thiếu trường (trạng thái đơn, đêm OOO, phí kênh thực tế, phân bổ doanh thu dài hạn theo kỳ thu) |
| P2 | MOB, FE, BE **không sản xuất** ở Round 1, chỉ **review** (BE review ARC bắt buộc; FE, MOB review UXD/ARC khuyến nghị) | Chưa có API contract và Design System thì code sẽ phải làm lại |
| P3 | MVP đề xuất = vận hành hằng ngày của 10 căn (xem PRD) – PO trình ESC xác nhận phạm vi (BL câu 21) | Thay đổi phạm vi lớn phải để INV quyết |
| P4 | Ngôn ngữ tối thiểu theo DoD: **Việt + Anh**; tiếng Nga là ngôn ngữ thứ 3 ưu tiên cho mẫu tin nhắn và app khách (brief mục 5) thay cho Hàn/Trung trong prototype | Brief nêu thực tế khách Nga nhiều, giao tiếp Anh – Nga |

## 3. Phân việc từng vai

Quy ước: mỗi vai **luôn** nộp `rounds/round-01/outputs/<VAI>/report.md` (Đã làm gì · File tạo/sửa · Giả định · Rủi ro/vướng mắc · Việc chưa xong). Mọi giả định ghi nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`. Mọi mục tham chiếu BL ghi rõ số mục (ví dụ "BL 5.6", "BL 8.2 #1").

### 3.1 Bảng phân việc

| Vai | Việc cụ thể | Đầu vào chính | Đầu ra trong `product/` (và nơi khác) |
|---|---|---|---|
| **PO** | (1) Viết PRD MVP: mục tiêu kinh doanh (công suất 80%, 4–6 căn dài hạn), người dùng, phân hệ (BL mục 3), phạm vi MVP / sau MVP / ngoài phạm vi, chỉ số thành công, giả định. (2) Viết backlog: user story "Là… tôi muốn… để…", tiêu chí Given/When/Then, MoSCoW, round dự kiến, cột "Nguồn BL". (3) Cùng DOM xử lý 26 câu hỏi BL mục 9 → ESC hoặc decision-log. (4) Review UXR, UXD, QA, DATA. (5) Cùng ORC lập `plan.md` Round 2 | Brief, decision-log, BL toàn bộ, báo cáo DOM/BA/UXR | `product/docs/PRD.md`; `03-backlog/backlog.md`; `02-escalations/ESC-xxx.md` + `escalations-index.md` (cùng DOM) |
| **DOM** | (1) Chuẩn hóa quy tắc kinh doanh BL mục 5 thành danh mục BR-xxx (ngắn ngày, dài hạn, giữ chỗ/cọc, nhận sớm/trả muộn, FOC, gia hạn, điện nước, phí phạt thực tế ở brief mục 5, khai báo lưu trú, minibar, trạng thái buồng). (2) Phân loại **30 lỗi BL 8.2**: Sửa / Cần INV quyết / Bỏ, kèm BR liên quan và vai xử lý. (3) Đề xuất phương án cho các câu BL mục 9 thuộc nghiệp vụ (giá, hủy, phụ thu, FOC, ký quỹ, điện nước) – đưa cho PO gom ESC. (4) Review PO, BA (bắt buộc), UXR, INT (khuyến nghị) | BL mục 5, 8.2, 9; brief mục 4–5 | `product/docs/business-rules.md`; `product/docs/baseline-issues-triage.md` |
| **BA** | (1) Quy trình nghiệp vụ (dạng bước/swimlane mermaid): đặt phòng ngắn ngày, báo giá → giữ chỗ → cọc → hợp đồng dài hạn, nhận phòng + giấy tờ + khai báo, lưu trú (gia hạn, yêu cầu, sự cố), trả phòng 3 bước + bill, chốt điện nước tháng, buồng phòng/kiểm phòng, bảo trì, hoa hồng CTV. (2) Use case chính. (3) Sơ đồ trạng thái: đơn (hold/confirmed/in-house/checked-out/cancelled/no-show/ooo), buồng (VC/VI/VD/CL/OC/OD/OOO), phiếu sửa chữa, khai báo, hợp đồng. (4) **Ma trận phân quyền** 4 nhóm + khách: theo màn hình, hành động và **trường dữ liệu nhạy cảm** (giấy tờ, giá vốn, P&L, hoa hồng) – xử lý mâu thuẫn BL mục 2 và 8.2 #27. (5) Review QA (khuyến nghị) | BL mục 2–5, BR của DOM, PRD nháp | `product/docs/business-processes.md`; `product/docs/use-cases.md`; `product/docs/state-machines.md`; `product/docs/rbac-matrix.md` |
| **UXR** | (1) Persona **mô phỏng**: chủ đầu tư, lễ tân, buồng phòng/bảo trì, CTV/sale, khách ngắn ngày nội địa, khách nước ngoài thuê tháng (làm việc từ xa, nói Nga/Anh), khách OTA. (2) Bản đồ hành trình: khách ngắn ngày (tìm phòng → đặt → thanh toán → check-in → lưu trú → check-out → đánh giá), khách dài hạn, một ca lễ tân, một ngày buồng phòng. (3) Đánh giá heuristic prototype Round 0 (gắn với BL 8.3 a11y). (4) Danh sách giả thuyết cần INV kiểm chứng với người thật. Ghi rõ đầu mỗi file: "Mô phỏng – cần INV kiểm chứng" | Brief mục 1, 5; BL mục 3, 8 | `product/docs/research/personas.md`; `product/docs/research/journeys.md`; `product/docs/research/heuristic-review-r0.md` |
| **UXD** | (1) Design System: token màu (BL 6.2, có dark mode), chữ Lora + Be Vietnam Pro (tự host), khoảng cách, bo góc, component (nút, input, chip trạng thái, bảng, drawer, modal, toast, room rack), trạng thái loading/rỗng/lỗi, quy tắc a11y (khắc phục BL 8.3). (2) Wireframe luồng chính (xem mục 3.3). (3) Hướng dẫn nội dung chữ + bảng chuỗi VI/EN cho luồng chính. (4) Review UXR (bắt buộc) | PRD nháp, persona/hành trình UXR, RBAC của BA, BL mục 6 | `product/design/design-system.md`; `product/design/tokens.json`; `product/design/wireframes/*.html` (+ `index.html`); `product/design/content-guide.md` |
| **ARC** | **Pha A** (sau PRD nháp): kiến trúc tổng thể (backend API, web quản trị, web khách/booking, app nhân viên – web responsive/PWA hay native), chọn công nghệ + ước tính chi phí hạ tầng ≤ 1 tr/tháng, chuẩn đa cơ sở (MVP 1 cơ sở), múi giờ Asia/Ho_Chi_Minh, chống đặt trùng (BL 8.2 #30). **Pha B** (sau BA + DOM + DATA): ERD, API contract nháp (OpenAPI) cho luồng R2, sinh mã an toàn (BL 8.2 #18), job theo lịch (nhắc trả phòng, hết hạn giữ chỗ, hạn khai báo 23:00), chuẩn code. (3) Cùng INT so sánh channel manager Beds24 / ezCloud / phương án khác. (4) Review BA (bắt buộc), INT, OPS, SEC | PRD, BR, BA, INT, SEC (phân loại dữ liệu), DATA | `product/docs/architecture.md`; `product/docs/erd.md`; `product/docs/api/openapi.yaml`; `product/docs/adr/ADR-*.md`; `product/docs/coding-standards.md` |
| **OPS** | (1) Khung repo theo cấu trúc ARC chọn trong `product/` (apps, services, integrations, infra, tests). (2) Môi trường dev bằng Docker Compose (DB + API khung + web khung), `.env.example` chỉ placeholder (gồm khóa INT liệt kê). (3) CI cơ bản: lint + test + build cho khung rỗng. (4) Hướng dẫn dựng máy dev. (5) Phác thảo phương án hosting khớp ngân sách (để R2 dựng staging) | ADR công nghệ của ARC (Pha A), danh sách khóa của INT | `product/infra/docker-compose.yml`; `product/.env.example`; `.github/workflows/ci.yml`; `product/docs/dev-setup.md`; `product/docs/hosting-plan.md` |
| **INT** | (1) Danh sách tích hợp, mỗi mục: mục đích, MVP hay sau, kiểu kết nối, tài liệu/sandbox, chi phí ước tính (ghi nguồn hoặc "chưa xác minh"), **tài khoản/khóa INV phải cung cấp**. Gồm: channel manager (kết nối toàn bộ OTA), VietQR, VNPay, MoMo, MISA meInvoice, khóa cửa thông minh (khả năng API: tạo mã theo ngày sinh nhật khách, mã có hạn, vân tay/thẻ – vì chưa rõ hãng, liệt kê các hãng phổ biến tại VN và tiêu chí chọn), Zalo OA/ZNS, email, khai báo lưu trú (bán tự động, cổng Bộ Công an). (2) So sánh channel manager cùng ARC → dự thảo ESC. (3) Review ARC (khuyến nghị) | Brief mục 3, 7; BL mục 5.11, 5.21, 7 | `product/docs/integrations.md`; `product/docs/integrations/channel-manager-comparison.md`; `product/docs/integrations/smart-lock.md`; `product/integrations/README.md` |
| **QA** | (1) Chiến lược test: các tầng (unit/API/E2E), dữ liệu test (lấy dữ liệu mẫu BL, 10 căn), môi trường, tiêu chí vào/ra mỗi round, mức lỗi P0–P3. (2) Test case cho luồng chính (từ tiêu chí nghiệm thu của PO + BR của DOM), ưu tiên các ca lỗi BL 8.2 (đặt trùng, giữ chỗ, phụ thu dài hạn, OOO chặn bán, ký quỹ). (3) Ma trận truy vết US ↔ BR ↔ test case. (4) Bước 5: kiểm thử tài liệu (xem mục 6) + chạy CI khung | PRD, backlog, BR, BA, ARC | `product/docs/qa/test-strategy.md`; `product/tests/test-cases/r1-main-flows.md`; `product/docs/qa/traceability.md`; `rounds/round-01/qa/test-report.md`, `qa/bug-list.md` |
| **SEC** | **Phần 1** (song song đầu round): kiểm kê và phân loại dữ liệu cá nhân (CCCD, hộ chiếu, visa, ảnh giấy tờ, SĐT, dữ liệu thanh toán, dữ liệu trẻ em), cơ sở pháp lý theo Nghị định 13/2023 (đồng ý, thông báo, đánh giá tác động), thời hạn lưu/xóa (BL 5.13 – cần luật sư), yêu cầu với khai báo lưu trú. **Phần 2** (sau ARC Pha B): threat model kiến trúc, yêu cầu xác thực/phân quyền/mã hóa/nhật ký truy cập ảnh giấy tờ, PCI DSS (không lưu số thẻ – dùng cổng). (3) Review ARC, INT, OPS (bắt buộc) | BL 5.12, 5.13, 8.2 #27; RBAC của BA; ARC | `product/docs/security/data-risk-assessment.md`; `product/docs/security/threat-model.md`; `product/docs/security/security-requirements.md` |
| **DATA** (nhẹ) | Định nghĩa chỉ số: công thức, nguồn dữ liệu, quy ước (đêm khả dụng trừ OOO; giữ chỗ không tính đêm bán; doanh thu dài hạn phân bổ theo đêm vs theo kỳ thu; phí kênh; GOP), xử lý mâu thuẫn BL 8.2 #8, #11, #22, #28, #29. Gửi ARC danh sách trường dữ liệu bắt buộc | BL 5.11, 3.20, 8.2; BR của DOM | `product/docs/metrics-definitions.md` |
| **ORC** | Giao việc theo thứ tự mục 4, theo dõi report, điều phối review, phân xử, commit sau mỗi bước, viết `round-summary.md` | – | `rounds/round-01/round-summary.md` |
| **QC** | Cổng chất lượng theo checklist mục 6 | Toàn bộ đầu ra R1 | `rounds/round-01/qc/qc-gate.md` |
| MOB, FE, BE | Không sản xuất. Review theo mục 5 | – | Chỉ file review |

### 3.2 Lý do DATA tham gia nhẹ (không để hoàn toàn sang Round 3)
Xem quyết định P1 ở mục 2.3. Tóm tắt: chỉ số quyết định dữ liệu cần lưu; sửa ERD ở Round 3 tốn hơn nhiều so với 1 tài liệu định nghĩa ở Round 1.

### 3.3 Luồng chính UXD phải wireframe (đủ để QA viết test case và FE/MOB ước lượng)
1. Đăng nhập + chọn cơ sở + điều hướng theo vai.
2. Lễ tân: room rack 14 ngày → đặt phòng mới (ngắn ngày, có chọn kênh/giá) → chi tiết đơn.
3. Nhận phòng: quét/nhập giấy tờ → kiểm tra (hạn hộ chiếu, thị thực) → khai báo lưu trú → giao mã cửa/thẻ.
4. Trả phòng 3 bước (minibar → phụ phí → bill) → thanh toán (VietQR / cổng) → hóa đơn; biến thể trả phòng dài hạn có khấu trừ ký quỹ.
5. Sale/CTV: báo giá dài hạn → giữ chỗ → cọc → hợp đồng; xem hoa hồng của mình.
6. Buồng phòng/bảo trì (mobile): việc hôm nay → kiểm phòng → đổi trạng thái → báo sự cố/khóa phòng.
7. App khách (mobile web, VI/EN): mở bằng link/QR → check-in online → gửi yêu cầu → xem hóa đơn.
8. Tổng quan chủ đầu tư: KPI + "cần chú ý".

## 4. Thứ tự chạy bước 2 (Sản xuất)

| Đợt | Vai chạy song song | Điều kiện bắt đầu | Mức "đủ dùng" cần bàn giao cho đợt sau |
|---|---|---|---|
| **Đợt 1** | PO, DOM, UXR, INT, SEC (Phần 1) | Ngay | **PO**: PRD nháp có danh sách phân hệ + ranh giới MVP + danh sách epic (chưa cần đủ AC). **DOM**: BR-xxx cho ngắn ngày, dài hạn, giữ chỗ/cọc, phụ thu, trạng thái buồng + bảng phân loại 30 lỗi. **UXR**: persona + hành trình. **INT**: danh sách tích hợp + bảng so sánh channel manager bản 1. **SEC**: phân loại dữ liệu |
| **Đợt 2** | BA, UXD, DATA, ARC (Pha A) | Có PRD nháp + BR của DOM (BA, DATA); có PRD nháp + persona (UXD); có PRD nháp + danh sách tích hợp (ARC Pha A) | **BA**: sơ đồ trạng thái + RBAC (ARC cần cho Pha B). **ARC Pha A**: ADR công nghệ + sơ đồ kiến trúc (OPS cần). **DATA**: định nghĩa chỉ số + danh sách trường dữ liệu |
| **Đợt 3** | ARC (Pha B), OPS, PO (hoàn thiện backlog AC + ESC cùng DOM) | ARC Pha B cần BA (trạng thái, RBAC), DOM, DATA, SEC Phần 1. OPS cần ADR công nghệ. PO cần BA use case để viết AC | ERD + OpenAPI nháp; khung repo + CI xanh; backlog đủ AC cho story Must của R2 |
| **Đợt 4** | QA, SEC (Phần 2), UXD (chỉnh wireframe theo API/RBAC nếu cần) | Có backlog AC, BR, BA, ARC Pha B | Test strategy + test case; threat model |

Ghi chú:
- ARC **không chờ** BA xong toàn bộ: Pha A chỉ cần PRD nháp; Pha B cần **sơ đồ trạng thái + RBAC** (không cần đủ use case).
- PO và DOM gom ESC **sau khi** DOM phân loại xong và INT/ARC có so sánh channel manager; bản ESC chốt sau bước 4 (phản hồi & sửa).
- Nếu một vai bị chặn: ghi vào report, làm tiếp với giả định có nhãn – không dừng cả đội (chỉ ESC "Gấp" mới dừng).

## 5. Ma trận review chéo áp dụng Round 1 (bước 3)

| Tác giả → sản phẩm | Review bắt buộc | Review khuyến nghị (làm nếu đủ thời gian) | File review |
|---|---|---|---|
| PO → PRD, backlog, ESC | BA, DOM | ARC, UXD | `reviews/BA-on-PO.md`, `DOM-on-PO.md` … |
| DOM → BR, phân loại lỗi BL | PO, BA | – | `PO-on-DOM.md`, `BA-on-DOM.md` |
| BA → quy trình, use case, trạng thái, RBAC | DOM, ARC | QA, **SEC (RBAC – khuyến nghị mạnh vì dữ liệu giấy tờ)** | `DOM-on-BA.md`, `ARC-on-BA.md` |
| UXR → persona, hành trình, heuristic | PO, UXD | DOM | `PO-on-UXR.md`, `UXD-on-UXR.md` |
| UXD → Design System, wireframe, nội dung | UXR, PO | FE, MOB, DOM | `UXR-on-UXD.md`, `PO-on-UXD.md` |
| ARC → kiến trúc, ERD, API, ADR | BE, SEC | OPS, INT, MOB, **DATA (ERD đủ trường chỉ số)** | `BE-on-ARC.md`, `SEC-on-ARC.md` |
| INT → danh sách tích hợp, so sánh CM, khóa cửa | ARC, SEC | BE, DOM | `ARC-on-INT.md`, `SEC-on-INT.md` |
| OPS → khung repo, dev env, CI | ARC, SEC | – | `ARC-on-OPS.md`, `SEC-on-OPS.md` |
| QA → test strategy, test case | BA, PO | QC | `BA-on-QA.md`, `PO-on-QA.md` |
| SEC → đánh giá rủi ro, threat model | ARC | OPS | `ARC-on-SEC.md` |
| DATA → định nghĩa chỉ số | PO | BE | `PO-on-DATA.md` |

Mọi thẻ theo định dạng protocol mục 6. Bước 4: tác giả trả lời tất cả thẻ trong `responses/<TÁC_GIẢ>-responses.md`; Blocker/Major phải xử lý trong round.

## 6. Bước 5 (Kiểm thử) cho round tài liệu
QA không có tính năng để test, nên kiểm thử Round 1 gồm:
- **Kiểm tra truy vết**: mỗi story Must của R2 có AC → có ≥ 1 test case; mỗi BR được ít nhất 1 story/test case tham chiếu.
- **Kiểm tra nhất quán chéo** (ghi lỗi tài liệu vào `qa/bug-list.md`, mức P0–P3): tên trạng thái, tên vai, tên thực thể khớp giữa PRD – BR – BA – ERD – OpenAPI – wireframe.
- **Kiểm tra kỹ thuật**: `docker compose up` theo `dev-setup.md` chạy được, endpoint `health` trả OK, CI xanh.
- SEC: soát lại OpenAPI/ERD theo `security-requirements.md`.

## 7. Tiêu chí QC ĐẠT – "tài liệu đủ, nhất quán, đủ để code"

QC chấm từng dòng ĐẠT / KHÔNG. **ĐẠT** = mọi dòng nhóm A–C đạt và không còn thẻ Blocker/Major Open. **ĐẠT CÓ ĐIỀU KIỆN** = nhóm A–B đạt, nhóm C thiếu ≤ 2 dòng có kế hoạch xử lý đầu R2. Còn lại **KHÔNG ĐẠT**.

### A. Đủ (tồn tại và đủ nội dung)
- [ ] A1. Tất cả file đầu ra ở bảng mục 3.1 tồn tại; 11 vai sản xuất có `outputs/<VAI>/report.md` đủ 5 mục.
- [ ] A2. PRD có: mục tiêu + chỉ số thành công có số, 5 nhóm người dùng (4 nội bộ + khách), danh sách phân hệ, bảng MVP / sau MVP / ngoài phạm vi, giả định.
- [ ] A3. Backlog: 100% story có định dạng "Là… tôi muốn… để…", MoSCoW, round dự kiến, cột nguồn BL; 100% story **Must của Round 2** có ≥ 2 tiêu chí Given/When/Then kiểm chứng được.
- [ ] A4. Backlog bao phủ luồng khách (tìm/đặt → thanh toán → check-in → lưu trú → check-out → đánh giá) và luồng nhân viên (lễ tân, buồng phòng/bảo trì, sale/CTV, chủ đầu tư) – mỗi bước ≥ 1 story.
- [ ] A5. 30/30 lỗi BL 8.2 có trạng thái phân loại (Sửa / Cần INV / Bỏ) + vai xử lý; mọi lỗi "Sửa" có BR hoặc story liên kết.
- [ ] A6. 26/26 câu hỏi BL mục 9 có kết cục: ESC-xxx **hoặc** dòng decision-log (có nhãn giả định nếu cần). Mỗi ESC đúng định dạng protocol, có phương án + đề xuất của đội.
- [ ] A7. RBAC phủ đủ 4 nhóm nội bộ + khách × (màn hình, hành động, trường nhạy cảm: giấy tờ, giá vốn, P&L, hoa hồng); giải quyết mâu thuẫn BL mục 2 và 8.2 #27.
- [ ] A8. Sơ đồ trạng thái cho: đơn/hợp đồng, buồng, phiếu sửa chữa, khai báo lưu trú – có điều kiện chuyển và vai được phép chuyển.
- [ ] A9. Wireframe đủ 8 luồng ở mục 3.3, có trạng thái loading/rỗng/lỗi cho ít nhất luồng 2, 3, 4; chuỗi VI/EN cho luồng 2–4 và 7.
- [ ] A10. Design System có token màu sáng + tối, thang chữ Lora/Be Vietnam Pro, ≥ 10 component, quy tắc a11y khắc phục từng mục BL 8.3.
- [ ] A11. ERD phủ mọi thực thể ở BL mục 4 thuộc MVP (hoặc ghi rõ "sau MVP"); OpenAPI nháp phủ các endpoint cho story Must của R2; có ADR chọn công nghệ + bảng chi phí hạ tầng ước tính ≤ 1 tr/tháng.
- [ ] A12. Danh sách tích hợp có đủ: channel manager, VietQR, VNPay, MoMo, MISA meInvoice, khóa cửa thông minh, Zalo/email, khai báo lưu trú – mỗi mục ghi MVP/sau, khóa/tài khoản INV cần cấp; có bảng so sánh ≥ 3 phương án channel manager.
- [ ] A13. Test strategy + test case cho luồng 2–4 (và 5–7 ở mức ca chính); ma trận truy vết.
- [ ] A14. Đánh giá rủi ro dữ liệu: bảng kiểm kê dữ liệu cá nhân, phân loại, cơ sở pháp lý ND 13/2023, thời hạn lưu/xóa đề xuất; threat model có ≥ 1 biện pháp cho mỗi rủi ro cao.
- [ ] A15. `metrics-definitions.md` có công thức cho Occupancy, ADR, RevPAR, GOP và quy ước xử lý BL 8.2 #8, #11, #22, #28, #29.
- [ ] A16. Persona/hành trình ghi rõ "mô phỏng – cần INV kiểm chứng" và có danh sách giả thuyết cần kiểm chứng.

### B. Nhất quán
- [ ] B1. Cùng một bộ tên cho trạng thái đơn, trạng thái buồng, vai người dùng, thực thể – khớp giữa PRD, BR, BA, ERD, OpenAPI, wireframe (QA kiểm tra, 0 lỗi P0/P1 mở trong `qa/bug-list.md`).
- [ ] B2. Không story nào mâu thuẫn BR của DOM; không wireframe nào cho vai thực hiện hành động mà RBAC cấm.
- [ ] B3. Số liệu quy tắc (giá, %, giờ, phí) trong PRD/BA/test case trùng với `business-rules.md` (một nguồn sự thật; tài liệu khác chỉ tham chiếu mã BR).
- [ ] B4. Mọi giả định đã ghi vào `decision-log.md` với nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`; không có chính sách kinh doanh do đội tự đặt mà thiếu nhãn.
- [ ] B5. Không có khóa API/mật khẩu thật trong repo; `.env.example` chỉ chứa placeholder.

### C. Đủ để code (Round 2 bắt tay được ngay)
- [ ] C1. Mỗi story Must của R2 truy được tới: wireframe + endpoint OpenAPI + bảng ERD + test case (ma trận truy vết không có ô trống).
- [ ] C2. Khung repo: dev mới làm theo `dev-setup.md` dựng được môi trường; `health` trả OK; CI chạy lint + test + build và xanh.
- [ ] C3. Các vấn đề kỹ thuật cốt lõi có thiết kế cụ thể: chống đặt trùng ở server (BL 8.2 #30), sinh mã duy nhất (#18), OOO chặn bán (#5), job theo lịch (giữ chỗ hết hạn, nhắc trả phòng, hạn khai báo 23:00), múi giờ.
- [ ] C4. Không còn thẻ Blocker/Major ở trạng thái Open; mọi Rejected có lý do.
- [ ] C5. Có `plan.md` Round 2 dự thảo (PO + ORC) chọn story từ backlog.

## 8. ESC dự kiến từ 26 câu hỏi BL mục 9 (định hướng cho PO + DOM – chốt trong bước 2–4)

Nguyên tắc: chỉ báo lên những gì thuộc protocol mục 8 (tiền, chính sách, pháp lý, tài khoản bên thứ ba, phạm vi lớn). Còn lại đội tự chốt + ghi decision-log. Mục tiêu ≤ 9 ESC, tất cả mức "Bình thường" (gom cuối round), trừ khi phát sinh việc chặn.

| Nhóm ESC dự kiến | Câu BL 9 | Vì sao cần INV |
|---|---|---|
| Chính sách giá & giảm giá (giá đêm ÷12, làm tròn, mùa/lễ, phụ thu NN, giảm theo đêm, ngưỡng chuyển dài hạn, thêm người/giường phụ) | 1, 2, 4, 5 | Chính sách giá |
| Chính sách dài hạn: chiết khấu kỳ hạn, ký quỹ, chu kỳ thu, hoa hồng CTV/sale và thời điểm chi | 3 | Chính sách + tiền |
| Hủy, hoàn cọc, chấm dứt HĐ sớm, giữ chỗ/báo giá hết hạn, khấu trừ ký quỹ khi trả phòng dài hạn | 6, 9, 11 | Chính sách hủy/hoàn tiền |
| Phụ thu nhận sớm/trả muộn (ân hạn 13:00?, dài hạn, khách OTA) + hạn mức FOC và cách phê duyệt | 7, 8 | Chính sách + kiểm soát thất thoát |
| Điện nước, phí dịch vụ, giặt ủi (đơn giá cố định hay bậc EVN; internet/rác/xe) | 10, 12 (phần giá) | Chính sách giá |
| Dữ liệu cá nhân & khai báo lưu trú (thời hạn lưu ảnh, tài khoản cổng BCA, khai báo ca tối) | 14, 15 | Pháp lý (cần luật sư) |
| Hóa đơn điện tử MISA: thuế suất VAT, giá đã gồm VAT cho dài hạn | 16 | Pháp lý/thuế |
| Channel manager (ARC + INT đề xuất, phí tháng, các OTA bán thật) | 18 | Tiền + hợp đồng bên thứ ba |
| Tài khoản bên thứ ba: Zalo OA/ZNS, merchant VNPay/MoMo, tài khoản nhận VietQR, hãng khóa cửa | 19, 20, 23 (phần khóa) | Tài khoản/hợp đồng bên thứ ba |
| Xác nhận phạm vi MVP | 21 | Phạm vi lớn |

Đội dự kiến **tự chốt** (decision-log, có nhãn giả định khi cần): 12 phần khung giờ dọn (DOM), 13 ca/chấm công → ngoài MVP (PO), 17 ký số HĐ → ngoài MVP, xuất PDF hợp đồng (PO), 22 thiết bị & offline (ARC + UXD), 23 ngôn ngữ ưu tiên → VI/EN rồi RU (PO, xem P4), 24 đa cơ sở đã giả định; tiền tệ VND, hiển thị tham khảo USD (ARC/PO), 25 cảnh báo lệch mục tiêu → backlog Could (PO), 26 P&L nhập chi phí trực tiếp trong app mức đơn giản, chưa khấu hao (PO + DATA).

## 9. Rủi ro và giả định

### 9.1 Rủi ro
| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| R1 | Nhiều chính sách kinh doanh (giá, hủy, phụ thu, ký quỹ) chưa được INV chốt | BR và AC có thể phải sửa ở R2 | Dùng số trong BL làm giả định có nhãn; thiết kế **cấu hình được** (bảng tham số) thay vì cố định trong code; ESC cuối round |
| R2 | Hãng khóa cửa chưa rõ, có thể không có API mở | Không tự động tạo mã cửa theo ngày sinh nhật | INT liệt kê tiêu chí chọn khóa; MVP giữ phương án nhập mã thủ công trong app, tích hợp để sau |
| R3 | Channel manager chưa chọn, phí có thể vượt ngân sách | Kéo dài R2, không đồng bộ OTA thật | ARC thiết kế lớp adapter trung lập; R2 chạy với giả lập/sandbox; ESC trình chi phí |
| R4 | Cổng Bộ Công an không có API cho cơ sở lưu trú | Khai báo vẫn bán tự động | Giữ luồng bán tự động như prototype + nhắc hạn 23:00 |
| R5 | Persona/hành trình là mô phỏng | Ưu tiên sai nhu cầu thật | Ghi rõ; INV kiểm chứng với lễ tân, buồng phòng (anh Long?), khách dài hạn trước R2 |
| R6 | Phạm vi MVP quá rộng (11 phân hệ) so với 2 round còn lại trước RC | Trễ RC hoặc chất lượng thấp | PO cắt MVP rõ trong PRD, phần còn lại Should/Could; ESC xác nhận phạm vi |
| R7 | Dữ liệu giấy tờ tùy thân là dữ liệu nhạy cảm theo ND 13/2023 | Rủi ro pháp lý, phạt | SEC đánh giá ngay đợt 1; ARC thiết kế mã hóa, phân quyền, nhật ký truy cập, tự xóa theo hạn |
| R8 | Ngân sách hạ tầng ≤ 1 tr/tháng hạn chế lựa chọn | Ràng buộc kiến trúc | ARC đưa bảng chi phí; không chọn dịch vụ trả phí khi chưa có ESC |
| R9 | Đợt 2–3 phụ thuộc chuỗi (PRD → BA → ARC → QA) | Một vai trễ kéo cả round | Bàn giao "mức đủ dùng" (mục 4), không chờ bản hoàn chỉnh |

### 9.2 Giả định dùng cho Round 1 (đã có trong decision-log, trừ khi ghi "mới")
- Hạ tầng ≤ 1 triệu đ/tháng, chưa gồm phí channel manager, SMS/Zalo.
- Thanh toán: VietQR + VNPay/MoMo. Hóa đơn điện tử: MISA meInvoice (INV đã chốt).
- Đa cơ sở về thiết kế, MVP 1 cơ sở; chưa dùng POS.
- Số liệu tài chính lấy từ tháng 9/2026 trong prototype.
- **Mới:** mọi con số quy tắc trong BL mục 5 là giá trị mặc định có thể cấu hình, chờ INV xác nhận qua ESC.
- **Mới:** ngôn ngữ VI + EN bắt buộc, RU thứ 3 (quyết định P4).
- **Mới:** DATA tham gia nhẹ ở Round 1 (quyết định P1).
