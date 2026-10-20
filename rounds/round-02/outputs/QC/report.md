# Báo cáo QC – Round 2, Sprint 3 (cổng QC giữa round)

## Bản 3 – chấm lại rút gọn sau vòng sửa 9, 9b, 9c (QC tự ghi, 17/10/2026 ~16:00)

- Vai: QC | Bước 6 (cổng sprint) | Code `fe4b166`, CI 39015560449 (7 job xanh, 2 job staging/GHCR bỏ qua; api 2.201/2.201; E2E 1.786/0, 0 lần chạy lại).
- **Quyết định: ĐẠT CÓ ĐIỀU KIỆN**, có hiệu lực khi QA đóng BUG-R2-083 (ĐK-S3-12). Nếu QA giữ P0 thì cổng tự chuyển thành KHÔNG ĐẠT.
- **Demo lần 1: gửi được** sau ĐK-S3-1 (ghi smoke `fe4b166` vào `outputs/OPS/demo-1.md`). D5 hết hạn 20:45 ngày 17/10.

### 1. Đã làm gì
1. Đọc lại CI 39015560449 bằng `gh` (headSha, job, log test, E2E, các bước kiểm `WRITES`, "UI cases ran", audit). Số liệu tự đọc, không dùng số tự khai.
2. Đọc mã 4 tệp ca bấm thật (`desk-writes.s3`, `stay-writes.h15`, `party-docs.h14`, `checkout.h16`): bước ghi đi qua nút trên Desk, không giả lập API. Đối chiếu lỗi UXR #2–#7, FE-07 và KB7 với từng ca.
3. Đọc mã sửa BUG-R2-083 (`onPartyMemberRemoved`, `DocsPanel` gửi `partyMemberId`, `ci.yml` có TC-L3-077); khớp SEC 9.5/9.6.
4. Đếm lại sổ lỗi bằng script (84 lỗi; P0/P1 Open: 055…061 và 083).
5. Probe demo chỉ đọc (cổng 8181/8182/8183, `/health`, `built-from` = `fe4b166`). Grep log của UXR chỉ lấy dòng smoke/XONG/D5.
6. Chạy `gen_traceability.py --strict` trên cây làm việc: exit 1 vì backlog EP19 chưa commit. Đây là rủi ro khi commit (ĐK-S3-13).
7. Đọc mã "Đã thu −500.000": hiển thị theo kiểu khấu trừ, không sai tiền ở máy chủ.
8. Kiểm ĐK-S3-1…11. Xong: ĐK-S3-9, ĐK-S3-10. Thu hẹp: ĐK-S3-11. Thêm: ĐK-S3-12 (điều kiện hiệu lực), ĐK-S3-13. Viết mục V3 trong `qc/s3-qc-gate.md`, ghi 1 dòng decision-log.

### 2. File tạo/sửa
- `rounds/round-02/qc/s3-qc-gate.md`: thêm mục V3 (bản 3); ghi chú đầu tệp; đổi tiêu đề mục 1 thành "Quyết định bản 2". Nội dung bản 1 và bản 2 giữ nguyên.
- `01-decisions/decision-log.md`: 1 dòng QC ở cuối tệp.
- `rounds/round-02/outputs/QC/report.md`: phần bản 3 này.
- Tệp tạm ngoài repo: `scratchpad/regate/qc/` (log CI, kết quả traceability trên cây làm việc).
- Không commit.

### 3. Giả định
- Đổi trạng thái BUG-R2-083 là quyền của QA. Điều kiện QA tự đặt ("chờ SEC kết luận FE-07") đã thỏa ở `s3-SEC.md` 9.6.
- Câu SEC-G4 do UXR viết vào limits mục C được tính cho phần việc của ORC ở ĐK-S3-10, vì nội dung khớp câu SEC đưa ra ở 9.4.
- UXD chưa duyệt hộp phụ thu #7, nhưng ĐK-S3-9 vẫn tính là xong: chức năng đã có ca bấm thật, UXR đi KB6 đạt. Phần duyệt chuyển sang ĐK-S3-5.
- Ngoại lệ tiền (dòng 593 (1), dòng 597) giữ nguyên cho 055…061.

### 4. Rủi ro / vướng mắc
- Commit backlog EP19 (Round "R2 – LP-v1") cùng lúc sẽ làm đỏ job "API contract".
- TC-L3-076 không còn bắt được lỗi đua ô chọn khách; chỉ còn unit giữ.
- Phương án dự phòng 083: lễ tân bỏ qua "Cần chú ý" quá 24 giờ thì giấy tờ của người còn ở bị xóa.
- Ba stack QA cũ khởi động lại liên tục trên máy chạy demo.
- Sprint 4 nặng thêm (S4-40…S4-49). Vẫn chưa có staging.

### 5. Việc chưa xong
- **Trước khi cổng có hiệu lực:** ĐK-S3-12 (QA).
- **Khi commit bước QC:** ĐK-S3-13 (ORC).
- **Trước khi gửi demo:** ĐK-S3-1 (OPS/ORC).
- **Trước tuần đầu Sprint 4:** ĐK-S3-3 và ĐK-S3-4 phần bản 3 (QA, ORC, PO).
- **Trước cổng QC Sprint 4:** ĐK-S3-5, 6, 7, 11.
- **Khi có VPS:** ĐK-S3-8.
- QC chưa đọc mã N1–N6; KB5 và KB10 chưa ai đi lại sau vòng 9; QC không đăng nhập demo, không chạy lại E2E hay test SEC.

---

## Bản 2 (lịch sử)

> Nội dung do QC soạn (17/10/2026). ORC ghi tệp hộ vì phiên QC không ghi được tệp này.

- Vai: QC | 17/10/2026 | Bước 6 (cổng sprint) | Code 6af7173, CI 38998735861 (7 job xanh, 2 job staging/GHCR bỏ qua)
- **Quyết định cuối: KHÔNG ĐẠT**, chấm lại rút gọn sau vòng sửa 9. Bản 2 này thay bản 1 (ĐẠT CÓ ĐIỀU KIỆN).
- Demo lần 1: chưa gửi tới khi xong ĐK-S3-10 rồi ĐK-S3-1.

## 1. Đã làm gì
1. **Bản 1:**
   - đọc log CI (test, E2E);
   - chạy `gen_traceability`, `gen_rbac_cases --check`;
   - đọc mã 5 story chính; thăm dò bản demo ở chế độ chỉ đọc;
   - kiểm ĐK-S2-1…7;
   - sửa `demo-1-limits` mục C;
   - ghi QC-S3-01…07.
2. **Bản 2**, xử lý 9 mục critic:
   - (1) Câu lý do sửa cho đúng phạm vi: 8 vòng kiểm chứng chỉ xét 7 Blocker và các chủ đề tiền, upload; khoảng 45/47 Major mới có tác giả tự ghi Done. ĐK-S3-5 mở rộng cho ARC, UXD.
   - (2) Kết quả SEC: gỡ chặn có điều kiện; thêm ĐK-S3-11 cho SEC-BE-53.
   - (3) K2: lỗi tiền BUG-R2-055…061 qua cổng nhờ ngoại lệ ORC (decision-log).
   - (4) Mục 1.1 ghi các ngoại lệ so với plan mục 4 và 7.
   - (5) Đề nghị PO hạ US-021, US-022.
   - (6) QC-S3-04 phủ TC-L3-011/032/074.
   - (7) Mốc demo: reset 12:31:47, giữ chỗ D5 hết hạn 17:31.
   - (8) Báo cáo này.
   - (9) K3: ARC-BE-S3-30 và UXD-FE-S3-20 (1) hạ xuống Minor.
3. Đọc mã, xác nhận 7 lỗi UXR (QC-S3-08). Phát hiện QC-S3-09: ca E2E-UI không bấm thật các bước ghi tiền và C3.
4. Đổi quyết định sang KHÔNG ĐẠT; lập ĐK-S3-9/10/11; ghi decision-log.

## 2. File tạo/sửa
- `qc/s3-qc-gate.md` (bản 2)
- `01-decisions/decision-log.md` (1 dòng)
- Bản 1 (đã commit 97c170b): `demo-1-limits.md` mục C

## 3. Giả định
- QA chốt mức lỗi UXR. B2 không đạt kể cả khi #2–#7 chỉ là P1.
- BUG-R2-061 cùng lớp S4-02/18 nên áp chung ngoại lệ ORC. ORC đã ghi rõ trong decision-log.
- Lỗi khóa #1 chỉ có ở demo/dev. Prod dùng `*_FILE` và chế độ strict.
- QC không đăng nhập demo; kết quả bấm giao diện lấy từ UXR.

## 4. Rủi ro / vướng mắc
- Sprint 4 quá tải.
- CI xanh chưa chứng minh giao diện chạy được (QC-S3-09).
- Chưa có staging, có nguy cơ không đạt nhóm A và B5 ở cổng cuối Round 2.
- Lượt 1 của TC-L3-011 hỏng mà bị lần chạy lại che đi, chưa rõ nguyên nhân.
- Cấm dùng dữ liệu khách thật tới khi xong SEC-G1, SEC-G2.

## 5. Việc chưa xong
- **Chấm lại rút gọn** khi đủ: ĐK-S3-9, CI xanh trên commit mới, ĐK-S3-3 bản 2, ĐK-S3-4.
- **Trước demo:** ĐK-S3-10, rồi ĐK-S3-1.
- **Trước cổng S4:** ĐK-S3-5, 6, 7, 11.
- **Khi có VPS:** ĐK-S3-8.
- QC chưa đọc mã UXR #8–#11; chưa chạy lại test SEC R1–R6; chưa kiểm thiết bị thật, VoiceOver, p95, Caddy prod.

---

# Cổng QC Sprint 4 – 19/10/2026

## 1. Đã làm gì
- Kiểm lại 36 ý của 3 bộ phản biện bằng tệp, `git`, `gh run view` (repo công khai), `gen_traceability.py --strict`. Chấp nhận tất cả; 3 ý đã gỡ nhờ CI mới.
- Đối chiếu mã commit cũ ↔ mới sau khi làm sạch lịch sử (`d527f9c` ↔ `23b0c7f`, `0dcf8e1` ↔ `aa0cfd6`, chỉ khác tài liệu).
- Tải log run 39244841718 (`2a6d61f`): 8/8 xanh, API 2.960, E2E 1.968, 0 `retry #`, `s438-r8` 8/8, TC-L4-153 bản mới, gitleaks 141 commit sạch.
- Đổi quyết định nháp ĐCĐK → **KHÔNG ĐẠT**, lập K1–K11 (quay lại bước 4) và C1–C10; ghi decision-log.

## 2. File tạo/sửa
- `rounds/round-02/qc/s4-qc-gate.md` (bản chính thức)
- `01-decisions/decision-log.md` (1 dòng)
- `rounds/round-02/outputs/QC/report.md` (mục này)

## 3. Giả định
- Mã chạy `2a6d61f` = `d527f9c`; dẫn chứng commit cũ kiểm bằng bản sao cục bộ.
- "Dòng" trong 11.2 hiểu theo dòng G hay ý con đều cho KHÔNG ĐẠT.
- TC-L2-079 đỏ ở `229eaf3` là lỗi dữ liệu ca kiểm theo ngày.

## 4. Rủi ro / vướng mắc
- K1 có thể chạm module folio (phần `penalty_evidence`) – ARC xác nhận đóng băng mã tiền trước khi sửa.
- Repo công khai: tài liệu review công bố cách lách của Major chưa sửa (K11).
- Ca kiểm chọn ngày tương đối có thể đỏ theo ngày chạy (C10).

## 5. Việc chưa xong
- Chấm lại rút gọn khi K1–K11 xong trên một commit có CI push + T9 xanh.
- QC chưa đi luồng bằng tay, chưa đọc log gốc QA của 207 (dựa vào phản biện A-CH-08).

---

# Cổng QC Sprint 4 – chấm lại rút gọn 20/10/2026

- Vai: QC | Round 2, Sprint 4, Bước 6 | Commit `c293ceb` (mã) + `06994e5` (tài liệu K4/K5) | **Quyết định: KHÔNG ĐẠT (lần 2)**, chi tiết ở `qc/s4-qc-gate.md` mục 10.

## 1. Đã làm gì
- Tự tải bằng `gh run view` (repo công khai) log 3 lượt trên `c293ceb`, đếm `retry #` từng lượt:
  - push 39270302984: xanh, 0 retry;
  - dispatch T9 39273997368: xanh, 0 retry;
  - **lịch T9 39312874062: đỏ**, TC-X-074 đỏ cả lượt chạy lại, 226 ca không chạy. Lượt này không được ORC nêu. QC thấy qua `gh run list`.
- Tải artifact `t9-playwright-report` của lượt đỏ, đọc `error-context.md`: PWA "Các căn" báo "Chưa tải được trạng thái các căn". Nêu giả thuyết lỗi theo giờ đêm, chưa chứng minh.
- `git diff 2a6d61f c293ceb`: không chạm `folio`/`payments`/FOC/checkout ở `src`. Đọc diff mã BE-65 và S4-21, đối chiếu SEC C.15 và ARC C.K7/E.1.
- Đếm lại `bug-list.md` bằng script: 210 lỗi, khớp bảng tổng, 0 P0/P1 mở.
- Kiểm backlog 5.5 (R3-Q19…Q35), `pendingFix` ↔ backlog, `sprint-4-plan.md` 16.5, decision-log, `s4-SEC.md` mục E, `s4-UXD*.md`, `s3-ARC.md`, `openapi-0.3.7.md`.
- Chạy `gen_traceability.py --strict` (chỉ đọc): exit 0.
- Chấm K1–K11: 9 việc đạt (K8 đạt có điều kiện); K2, K7 chưa. Lập K2', K7', thêm C11–C13.

## 2. File tạo/sửa
- `rounds/round-02/qc/s4-qc-gate.md` (thêm mục 10 "Chấm lại 20/10" và một dòng trỏ ở đầu tệp)
- `01-decisions/decision-log.md` (1 dòng)
- `rounds/round-02/outputs/QC/report.md` (mục này)

## 3. Giả định
- CI trên `c293ceb` đã chạy đúng 2 tệp test SEC yêu cầu chạy lại. QC coi đó là bước kiểm lại BE-65 trên commit chấm lại, vì mã khớp mô tả C.15.
- "Lượt T9 gần nhất" tính trên commit chấm lại, tại lúc QC chấm.

## 4. Rủi ro / vướng mắc
- Lượt T9 đêm đỏ có thể là lỗi sản phẩm: PWA buồng phòng không tải được danh sách căn sau nửa đêm. Nhân viên ca đêm sẽ gặp lỗi này.
- Hai báo cáo (QA K5, DATA K4) ghi "T9 xanh" theo lượt dispatch, trong khi lượt lịch sau đó đã đỏ. Đã thêm C13.
- 2 PR Dependabot mới đỏ (C9).

## 5. Việc chưa xong
- Chấm lại lần 3 chỉ K2', K7' (mục 10.4).
- QC chưa tái hiện lỗi giờ đêm, chưa đi luồng bằng tay, chưa chạy test DB.
