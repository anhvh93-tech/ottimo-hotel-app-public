# Giao thức làm việc chung – Đội build App All-in-one Khách sạn

Tài liệu này là "luật chơi" chung cho mọi vai trong đội. Mọi agent phải đọc file này trước khi làm việc và tuân thủ nó.

## 1. Các vai và mã vai

| Mã | Vai | Quyền quyết định chính |
|---|---|---|
| INV | Chủ đầu tư (người dùng thật) | Ngân sách, phạm vi lớn, chính sách kinh doanh, nghiệm thu cuối |
| ORC | Điều phối (PM / Scrum Master) | Lịch round, phân việc, phân xử tranh chấp nội bộ |
| PO | Product Owner | Ưu tiên backlog, phạm vi trong round, tiêu chí nghiệm thu |
| BA | Business Analyst | Đặc tả yêu cầu, quy trình nghiệp vụ |
| DOM | Chuyên gia nghiệp vụ khách sạn | Tính đúng đắn nghiệp vụ |
| UXR | UX Researcher | Persona, hành trình, kết quả test khả dụng |
| UXD | UI/UX Designer (kiêm UX Writer) | Giao diện, Design System, nội dung chữ |
| ARC | Tech Lead / Solution Architect | Kiến trúc, công nghệ, chuẩn code |
| MOB | Mobile Developer | Mã nguồn app khách & app nhân viên |
| FE | Frontend Web Developer | Admin dashboard, web đặt phòng |
| BE | Backend Developer | API, database, logic nghiệp vụ |
| INT | Integration Engineer | Tích hợp OTA, thanh toán, khóa cửa, POS, hóa đơn điện tử |
| OPS | DevOps / SRE | Hạ tầng, CI/CD, giám sát, sao lưu |
| QA | QA Engineer | Kế hoạch test, test case, báo lỗi, test hiệu năng |
| QC | QC Inspector | Cổng chất lượng cuối round – có quyền CHẶN phát hành |
| SEC | Security Engineer | Bảo mật, dữ liệu cá nhân – có quyền CHẶN với lỗi bảo mật nghiêm trọng |
| DATA | Data Analyst | Chỉ số, tracking, báo cáo |

QA khác QC: **QA** kiểm thử trong suốt quá trình làm (tìm lỗi, đảm bảo quy trình). **QC** kiểm tra sản phẩm cuối round theo tiêu chí nghiệm thu, đưa ra quyết định ĐẠT / ĐẠT CÓ ĐIỀU KIỆN / KHÔNG ĐẠT.

## 2. Cấu trúc thư mục dự án

Mọi agent đọc và ghi trong thư mục dự án `hotel-app/` theo đúng cấu trúc sau:

```
hotel-app/
├── 00-brief/
│   └── investor-brief.md          # Yêu cầu gốc từ chủ đầu tư
├── 01-decisions/
│   └── decision-log.md            # Mọi quyết định đã chốt (ai, khi nào, vì sao)
├── 02-escalations/
│   ├── escalations-index.md       # Danh sách việc báo lên chủ đầu tư + trạng thái
│   └── ESC-001.md ...
├── 03-backlog/
│   └── backlog.md                 # User stories + ưu tiên + trạng thái
├── 04-investor-feedback/
│   └── FB-INV-001.md ...          # Phản hồi của chủ đầu tư sau khi dùng sản phẩm
├── product/                       # PHIÊN BẢN HIỆN HÀNH của sản phẩm
│   ├── docs/                      # PRD, đặc tả, kiến trúc, API spec
│   ├── design/                    # Design system, wireframe, prototype (HTML/Figma link)
│   ├── apps/mobile/               # Mã nguồn mobile
│   ├── apps/admin-web/            # Mã nguồn web quản trị
│   ├── services/api/              # Mã nguồn backend
│   ├── integrations/              # Adapter tích hợp bên thứ ba
│   ├── infra/                     # Docker, CI/CD, cấu hình
│   └── tests/                     # Test tự động
└── rounds/
    └── round-01/
        ├── plan.md                # Mục tiêu round, phân việc, tiêu chí đạt
        ├── outputs/<MÃ_VAI>/      # Báo cáo công việc mỗi vai trong round
        ├── reviews/<NGƯỜI_REVIEW>-on-<TÁC_GIẢ>.md
        ├── responses/<TÁC_GIẢ>-responses.md
        ├── qa/test-report.md, qa/bug-list.md
        ├── qc/qc-gate.md
        └── round-summary.md       # Báo cáo gửi chủ đầu tư
```

Sản phẩm thật (code, design, tài liệu) luôn nằm trong `product/`. Thư mục `rounds/` chỉ chứa kế hoạch, báo cáo, review và phản hồi của từng round.

## 3. Cấu trúc một Round (7 bước)

| Bước | Tên | Ai làm | Đầu ra |
|---|---|---|---|
| 1 | Lập kế hoạch | ORC + PO (ARC, QA góp ý) | `plan.md` |
| 2 | Sản xuất | Các vai được giao | Cập nhật `product/` + `outputs/<VAI>/report.md` |
| 3 | Review chéo | Theo Ma trận review (mục 5) | `reviews/*.md` |
| 4 | Phản hồi & sửa | Tác giả | `responses/*.md` + sửa trong `product/` |
| 5 | Kiểm thử | QA (+ SEC) | `qa/test-report.md`, `qa/bug-list.md` |
| 6 | Cổng chất lượng | QC | `qc/qc-gate.md` |
| 7 | Tổng kết & báo cáo | ORC | `round-summary.md` + cập nhật escalations |

Bước 4 và 5 có thể lặp lại trong round: dev sửa lỗi, QA test lại, cho đến khi hết lỗi P0/P1 hoặc hết thời lượng round.

## 4. Lộ trình tối thiểu 3 Round

**Round 1 – Khám phá & Thiết kế nền móng**
- PO, BA, DOM, UXR: brief → persona, hành trình khách, quy trình nội bộ, PRD MVP, backlog có ưu tiên.
- UXD: wireframe các luồng chính và nền Design System.
- ARC: kiến trúc, mô hình dữ liệu, API contract bản nháp, chọn công nghệ.
- OPS: khung repo, môi trường dev, CI cơ bản.
- INT: danh sách tích hợp, tài liệu sandbox, các tài khoản/khóa cần chủ đầu tư cung cấp.
- QA: chiến lược test, test case cho luồng chính. SEC: đánh giá rủi ro dữ liệu.
- QC gate: tài liệu đủ, nhất quán, đủ để code.

**Round 2 – Xây dựng lõi MVP**
- Đặt phòng & tồn phòng, thanh toán (sandbox), check-in/out online, app buồng phòng cơ bản, dashboard lễ tân.
- UXD: UI hoàn chỉnh cho luồng R2. FE/MOB/BE/INT code. OPS: staging + deploy tự động.
- QA: test chức năng + hồi quy. SEC: review code bảo mật. QC gate: luồng chính chạy từ đầu đến cuối.

**Round 3 – Hoàn thiện, Ổn định & Bản phát hành ứng viên (RC)**
- Bổ sung phân hệ còn lại theo backlog (F&B/POS, CRM, báo cáo).
- Fix lỗi tồn đọng, tối ưu hiệu năng, hoàn thiện đa ngôn ngữ, tài liệu hướng dẫn vận hành.
- QA: test toàn diện + hiệu năng. SEC: kiểm tra bảo mật tổng. DATA: tracking + dashboard chỉ số.
- QC gate: quyết định phát hành RC cho chủ đầu tư dùng thử.

**Round 4 trở đi – Vận hành & cải tiến theo phản hồi chủ đầu tư**
- Đầu vào chính: `04-investor-feedback/`. ORC chuyển phản hồi thành thẻ công việc, phân loại, ưu tiên, giao việc.
- Chạy đủ 7 bước như các round trước.

## 5. Ma trận review chéo

Mỗi sản phẩm đầu ra phải được ít nhất 2 vai khác review.

| Tác giả | Người review bắt buộc | Người review khuyến nghị |
|---|---|---|
| PO (PRD, backlog) | BA, DOM | ARC, UXD |
| BA (đặc tả, quy trình) | DOM, ARC | QA |
| DOM (quy tắc nghiệp vụ) | PO, BA | – |
| UXR (persona, hành trình, test) | PO, UXD | DOM |
| UXD (thiết kế) | UXR, PO | FE, MOB, DOM |
| ARC (kiến trúc, API contract) | BE, SEC | OPS, INT, MOB |
| BE (API, DB) | ARC, QA | SEC |
| MOB (app) | UXD, QA | ARC |
| FE (web) | UXD, QA | ARC |
| INT (tích hợp) | ARC, SEC | BE, DOM |
| OPS (hạ tầng) | ARC, SEC | – |
| QA (test plan, test case) | BA, PO | QC |
| SEC (đánh giá bảo mật) | ARC | OPS |
| DATA (chỉ số, tracking) | PO | BE |
| QC (cổng chất lượng) | ORC | PO |

## 6. Thẻ Feedback – định dạng bắt buộc

Mọi góp ý phải viết theo định dạng sau (trong file `reviews/<NGƯỜI_REVIEW>-on-<TÁC_GIẢ>.md`):

```
### FB-R{số round}-{NGƯỜI_REVIEW}-{TÁC_GIẢ}-{số thứ tự}
- Mức độ: Blocker | Major | Minor | Suggestion
- Vị trí: <file / màn hình / mục / dòng>
- Vấn đề: <mô tả cụ thể, có bằng chứng>
- Vì sao quan trọng: <ảnh hưởng tới khách / nhân viên / doanh thu / kỹ thuật>
- Đề xuất sửa: <cách sửa cụ thể>
- Trạng thái: Open
```

Ý nghĩa mức độ:
- **Blocker**: không thể đi tiếp, sai nghiệp vụ nghiêm trọng, lỗi bảo mật, mất dữ liệu, sai tiền.
- **Major**: ảnh hưởng rõ tới trải nghiệm hoặc tính đúng, phải sửa trong round.
- **Minor**: nên sửa, có thể dời sang round sau.
- **Suggestion**: ý tưởng cải thiện, tác giả tự cân nhắc.

Quy tắc review tốt: cụ thể, có bằng chứng, đề xuất cách sửa, góp ý vào sản phẩm chứ không vào người. Khen điểm làm tốt ở cuối file (1–3 ý) để tác giả biết cái gì nên giữ.

## 7. Phản hồi Feedback

Tác giả trả lời trong `responses/<TÁC_GIẢ>-responses.md`, mỗi thẻ một dòng:

```
| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-DOM-PO-01 | Done | Đã thêm chính sách no-show vào PRD mục 4.3 |
| FB-R1-ARC-PO-02 | Rejected | Lý do: ... (bắt buộc có lý do) |
| FB-R1-SEC-PO-03 | Escalated | Xem ESC-004 |
| FB-R1-UXD-PO-04 | Deferred | Dời sang Round 3, đã thêm vào backlog US-045 |
```

Quy tắc:
- Mọi thẻ **Blocker** và **Major** phải được trả lời trong round. Không được bỏ qua.
- **Rejected** phải có lý do. Người review có quyền phản biện 1 lần.
- Nếu sau 2 lượt qua lại vẫn bất đồng: ORC phân xử dựa trên bảng quyền quyết định (mục 1). Nếu vượt quyền đội → báo lên chủ đầu tư.

## 8. Báo lên Chủ đầu tư (Escalation)

### Khi nào PHẢI báo lên
- Liên quan đến **tiền**: chi phí phát sinh, dịch vụ trả phí, thay đổi ngân sách.
- **Thay đổi phạm vi lớn**: bỏ/thêm phân hệ, dời mốc phát hành.
- **Chính sách kinh doanh**: giá, chính sách hủy/hoàn tiền, đặt cọc, khuyến mãi, quy định khách sạn.
- **Pháp lý**: dữ liệu cá nhân, khai báo lưu trú, hóa đơn điện tử, điều khoản sử dụng.
- **Tài khoản & hợp đồng bên thứ ba**: khóa API, tài khoản merchant VNPay/MoMo, OTA, nhà cung cấp khóa cửa.
- **Thông tin chỉ chủ đầu tư có**: quy mô khách sạn, số phòng, loại phòng, thương hiệu, thị trường mục tiêu.
- **Rủi ro không thể giải quyết trong round**, hoặc tranh chấp nội bộ vượt quyền ORC.

### Khi nào KHÔNG báo lên
- Chi tiết kỹ thuật thuộc quyền ARC (chọn thư viện, đặt tên, cấu trúc code).
- Chi tiết giao diện thuộc quyền UXD, trừ khi liên quan nhận diện thương hiệu.
- Việc đội có thể tự quyết bằng một giả định hợp lý. Khi đó: ghi giả định vào `decision-log.md` với nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` và đi tiếp.

### Định dạng ESC
```
# ESC-{số} – <tiêu đề ngắn>
- Người tạo: <MÃ_VAI> | Round: <n> | Mức khẩn: Gấp (chặn công việc) | Bình thường (gom cuối round)
- Bối cảnh: <2–4 câu, ngôn ngữ kinh doanh, không thuật ngữ khó>
- Câu hỏi cần quyết định: <1 câu>
- Phương án:
  - A: <mô tả> – Ưu: … – Nhược: … – Chi phí/thời gian: …
  - B: …
- Đội đề xuất: <A/B và vì sao>
- Nếu chưa quyết thì: <đội sẽ tạm làm gì / bị chặn ở đâu>
- Hạn cần trả lời: <round / ngày>
- Trạng thái: Chờ INV | Đã quyết: <phương án> | Ngày
```

Quy tắc: gom các ESC "Bình thường" vào cuối round, trình trong `round-summary.md`. Chỉ ESC "Gấp" mới được dừng công việc để hỏi ngay. Luôn kèm đề xuất của đội – chủ đầu tư chọn, không phải tự nghĩ phương án.

## 9. Phản hồi từ Chủ đầu tư sau khi dùng sản phẩm

1. Chủ đầu tư viết tự do (chat, ghi chú, ảnh chụp màn hình).
2. ORC chuyển thành file `04-investor-feedback/FB-INV-{số}.md`: nguyên văn ý kiến, loại (Bug / UX / Tính năng mới / Nghiệp vụ / Hiệu năng), mức ưu tiên P0–P3, vai chịu trách nhiệm.
3. P0 (không đặt/thanh toán được, sai tiền, mất dữ liệu, sập): xử lý ngay ngoài chu trình round (hotfix), vẫn phải qua QA + QC rút gọn.
4. P1–P3: đưa vào backlog, PO xếp ưu tiên cho round kế tiếp.
5. Khi xong, ORC báo lại chủ đầu tư: đã sửa gì, ở phiên bản nào, cách kiểm tra.

## 10. Definition of Done (một hạng mục chỉ được coi là XONG khi)

- Đáp ứng đủ tiêu chí nghiệm thu của user story.
- Đã được review bởi các vai bắt buộc; không còn thẻ Blocker/Major mở.
- Code có test tự động cho logic chính; CI xanh.
- Giao diện đúng Design System; có trạng thái loading / rỗng / lỗi; hỗ trợ tối thiểu Tiếng Việt + Tiếng Anh.
- QA đã test và không còn lỗi P0/P1.
- Tài liệu liên quan trong `product/docs/` đã cập nhật.

## 11. Quy tắc chung cho mọi agent

1. **Đọc trước khi làm**: `investor-brief.md`, `decision-log.md`, `backlog.md`, `plan.md` của round hiện tại, và các review gửi cho mình.
2. **Không bịa dữ liệu thực tế**: số liệu thị trường, giá, luật… nếu không chắc thì ghi rõ là giả định hoặc tra cứu nguồn và ghi nguồn.
3. **Không dùng thông tin đăng nhập thật**: mọi khóa API, mật khẩu đều là placeholder trong `.env.example`. Khóa thật do chủ đầu tư tự điền.
4. **Không sửa sản phẩm của vai khác** khi chưa được đồng ý – hãy viết thẻ feedback.
5. **Ghi lại mọi quyết định** vào `decision-log.md`: `| Ngày | Round | Quyết định | Người quyết | Lý do |`.
6. **Báo cáo ngắn gọn**: `outputs/<VAI>/report.md` gồm: Đã làm gì, File đã tạo/sửa, Giả định, Rủi ro/Vướng mắc, Việc chưa xong.
7. **Ngôn ngữ**: tài liệu và báo cáo bằng Tiếng Việt; code, tên biến, commit bằng Tiếng Anh.
