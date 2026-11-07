# PO review – PR #165 (OPS, V5-47: so chữ tờ in Tờ 4 với trang khách)

- Round 5 – Bước: Review. Người review: PO. Ngày: 07/11/2026.
- PR: #165, nhánh `r5-v5-47`, head `38c9c398`. Tác giả: OPS (bộ dựng tờ in của UXD).
- Tiêu chí: `rounds/round-05/plan.md` V5-47 (Gói 4, bắt buộc): "Tờ in và trang khách tự so chữ khi build, để không lệch nhau". Nguồn: thẻ PO FB-R4-PO-UXD-IDS2-02 (`rounds/round-04/reviews/PO-on-v104-id-sheet-v2.md`), SEC FB-R4-SEC-UXD-IDS2-01.
- Phạm vi PO: tiêu chí V5-47 và câu release notes. Chữ và bộ dựng là việc UXD. Luật so, CI gate, CODEOWNERS là việc SEC. PO không duyệt thay hai vai này.

## 1. Kết luận

**PO ĐẠT** theo tiêu chí V5-47 @ `38c9c398`. Gộp khi UXD và SEC duyệt cùng SHA (hoặc SHA sau lần gộp `main` mà diff phần V5-47 không đổi).

## 2. Đối chiếu tiêu chí

| Tiêu chí (thẻ PO IDS2-02, plan V5-47) | Kết quả | Căn cứ PO tự chạy |
|---|---|---|
| So từng đoạn Tờ 4 và Tờ 4ru với `strings-{en,vi,ru}.json`, 4 khóa `gw.notice_*` | **Đạt** | `check_print_notice.py` đọc khóa và thứ tự từ `NOTICE_PARAGRAPHS` (`config.ts`), so Markdown Tờ 4, Tờ 4ru và cả 5 tờ HTML đã commit (7 tờ). Trên PR và trên bản gộp thử với `main` @ `511d7f23`: `KHỚP: 7 tờ × 4 khóa, chân tờ đúng version`, thoát 0 |
| Lệch thì dừng khi in | **Đạt** | PO sửa một chữ ở đoạn Tờ 4 VI của `staff-one-pager.md`: bộ so báo 2 chỗ lệch kèm phần khác nhau; `build_print_sheets.py --only to-4-your-id-details-a5` dừng với câu "Chữ Tờ 4 lệch trang khách: không dựng tờ in", không ghi tệp nào. Trả lại tệp như cũ |
| Tự động, "khi build" | **Đạt** | 2 bước mới ở job `build-test` của CI (self-test 23 ca, rồi bộ so), chạy cả khi bước trước đỏ. Tên job không đổi nên branch protection giữ nguyên. Check CI của PR xanh |
| Bắt được lệch khó thấy (chữ pháp lý ND13) | **Đạt** | PO bỏ U+00A0 ở `3 месяцев` (Tờ 4ru): bộ so đỏ, hiện `3<U+00A0>месяцев`. Self-test 23/23 OK (gồm U+200B, chân tờ v3, RU về EN, thiếu/thừa tệp HTML) |
| Không đổi chữ khách hay chữ tờ | **Đạt** | Diff chỉ có bộ so, test, CI, CODEOWNERS, `dev-setup.md`, báo cáo OPS, và phần tách hàm `notice_parts` trong bộ dựng (OPS ghi HTML dựng ra không đổi byte) |
| Bộ so không tự chọn bên đúng | **Đạt** | Câu cuối khi lệch: UXD (chữ) + SEC (chữ pháp lý) quyết; trỏ đúng nơi sửa mỗi bên |

Ghi chú gộp: nhánh chưa có `main` mới nhất. PO đã gộp thử với `main` @ `511d7f23`: không xung đột, bộ so vẫn KHỚP, self-test OK. Không cần chạy lại phần PO sau lần gộp `main` nếu `staff-one-pager.md`, `docs/print/to-4-*.html`, `gen_strings.py` và 3 tệp Python của PR không đổi.

## 3. Release notes v1.0.5

- Câu đang có ở dòng **Bảo mật nhỏ**: "Tờ in ở quầy và trang khách luôn cùng chữ." **Giữ nguyên**, đúng khi #165 có trong tag. Lúc cắt, PO bỏ V5-47 khỏi cột "07/11 còn".
- Tờ đã dán ở quầy là bản giấy, bộ so không kiểm được. v1.0.5 không đổi chữ thông báo (`privacy-2026-10-v2`), nên không phải in lại. Bản nào đổi version chữ thì PO thêm việc "in lại và dán Tờ 4 ngày lên" vào **Việc anh/chị làm ngày lên**.
- Thiếu #165 lúc cắt: V5-47 bắt buộc, dời phải có dòng decision-log PO + ORC (QC điều 1). Khi đó bỏ câu trên, và QA vẫn so tay ở checklist P4-42.

## 4. Thẻ feedback

### FB-R5-PO-UXD-165-01
- Mức độ: Suggestion
- Vị trí: `product/docs/print/to-1-*.html` và các tờ nhân viên khác (PR #165 phần "điều thấy thêm").
- Vấn đề: OPS dựng thử thì HTML đã commit của Tờ 1 khác bản dựng mới (dòng bản in ở chân tờ, cụm không ngắt ở tên tờ). Bộ so V5-47 chỉ giữ Tờ 4. Tờ 1 không phải văn bản pháp lý nên không thuộc V5-47, nhưng tờ in lệch Markdown vẫn làm lễ tân đọc bản cũ.
- Vì sao quan trọng: Tờ 1 vừa có câu PO sửa ngày 07/11 (decision-log "PO Tờ 1"). In từ HTML cũ là in câu cũ.
- Đề xuất sửa: UXD dựng lại Tờ 1 cùng lần dựng sổ tay V5-71, trước QC 19/11. Một bước CI "HTML đã commit = bản dựng lại" cho mọi tờ vào backlog v1.0.6 (cần Onest trên máy CI cho tờ RU).
- Trạng thái: Open, không chặn #165.

## 5. Các việc PO được giao kèm lượt này

### 5.1 Đếm số lần mở link khách đã thu hồi (OPS đề xuất, `OPS-on-sec-v5-74.md` mục 3): **xếp v1.0.6**

Quyết định PO (thứ tự ưu tiên trong round, quyền PO):
- Không vào danh sách cắt code 13/11. Ghi vào backlog cải tiến, đích v1.0.6, mức nên có.
- Lý do:
  - runbook V5-74 bước 4 đã có câu an toàn "chưa đếm được thì coi như đã mở", nên thiếu bộ đếm không làm sai việc xử lý sự cố, chỉ làm nặng tay hơn (báo khách nhiều hơn mức cần);
  - làn OPS tới 13/11 đã kín: V5-41 `r5-deps`, V5-61 diễn tập khôi phục (chặn production), việc mới INV 07/11 chuyển sao lưu lên Google Drive công ty;
  - SEC là nút thắt review trước 13/11 (#160, #165, V5-74 hạn 14/11, V5-41, V5-45). Thêm một lượt ghim SHA lúc này đẩy việc bắt buộc ra sau.
- Được làm sớm: bộ đếm là tệp `.sql` chạy tay theo khuôn K14, không vào image, không gắn tag. OPS làm được ngay khi rảnh sau 13/11, SEC ghim khi có lượt review, không cần chờ ngày lên v1.0.6. Khi có, SEC sửa một dòng ở runbook V5-74 mục 4 bước 4.
- Việc đếm thêm số `ip_hmac` khác nhau là quyết của SEC, không đổi phạm vi trên.

### 5.2 Ghi chú SEC #160 (nhãn "OWN tự duyệt và chi"): **không thêm dòng release notes**

SEC (`SEC-on-be-d2-prs-160-163.md` mục A.1, ghi chú cho PO, UXD): cờ audit `ownSelfApprovedAndPaid` nay bật cả khi OWN chỉ là người gốc của khoản hoàn. Nghĩa thật là "OWN chi theo đường tự chi".

PO kiểm Desk trên `main`: Desk **không hiện** cờ này.
- **Nhật ký tiền** dịch sự kiện `refund.paid` thành "Ghi đã hoàn chuyển khoản" (`mlog.a_refund_paid`, `MoneyPage.tsx`).
- Không có chuỗi nào của `admin-web` hay `design/copy` đọc `ownSelfApprovedAndPaid`.

Cờ chỉ nằm trong audit máy chủ và trong câu tài liệu (BR-522, `rbac-matrix.md` ghi chú 39 và A47, `EP03-05-stay.md`).

Chủ đầu tư chỉ thấy một thay đổi, ở một ca hẹp:
- ca đó: OWN ghi khoản chuyển khoản sau khi đơn đã đóng, rồi chi yêu cầu hoàn sinh ra từ khoản đó;
- thay đổi: Desk hỏi lại mật khẩu khi chi;
- việc này đúng với luật đã có (OWN chi theo đường tự chi thì xác thực lại), theo chiều chặt hơn, không lộ tiền.

Vì vậy không thêm dòng release notes. Khi cắt, PO kiểm lại: tag có PR Desk nào hiện cờ thì xem lại quyết định này.

### FB-R5-PO-BA-160-01
- Mức độ: Suggestion
- Vị trí: `product/docs/business-rules.md` BR-522 (câu "nhật ký ghi rõ 'OWN tự duyệt và chi'"); `product/docs/rbac-matrix.md` ghi chú 39, dòng A47 và mục cuối; `rbac-matrix.json` ghi chú A47; `specs/EP03-05-stay.md` mục tách nhiệm hoàn chuyển khoản.
- Vấn đề: tài liệu viết cờ là "OWN tự duyệt và chi". Từ PO 17/10, cờ đã bật cả khi OWN chỉ đặt nơi nhận. Từ #160 (SEC 148-01), cờ bật cả khi OWN chỉ là người gốc của khoản thu. Desk chưa hiện cờ.
- Vì sao quan trọng: người đọc audit hoặc tài liệu sau này hiểu nhầm là OWN đã duyệt.
- Đề xuất sửa: BA (DOM xem chữ BR) đổi câu thành "nhật ký ghi cờ OWN chi theo đường tự chi (OWN duyệt, đặt nơi nhận, hoặc là người gốc của khoản thu)". Làm cùng lượt sổ tay V5-71 hoặc v1.0.6. Không đổi luật. Sửa `rbac-matrix.md`/`.json` thì chạy kiểm `screens.ts` như các lần trước, để `main` không đỏ. Nếu sau này Desk hiện cờ ở **Nhật ký tiền**, UXD chốt chữ theo nghĩa này và theo brand guideline OTTIMO.
- Trạng thái: Open, không chặn.

### 5.3 Mục 4b của plan

PO đã thêm các PR mới vào `rounds/round-05/plan.md` mục 4b:
- #171 (V5-20, V5-22), #166 (V5-21, V5-25 câu Desk), #168 (V5-16 Desk), #172 (V5-17), #170 (V5-42), #165 (V5-47);
- việc vận hành song song của INV 07/11: chuyển sao lưu lên Google Drive công ty, gom dự án lên Drive trước khi có thể bán laptop. Việc này không chặn cắt code.

Ghi chú thêm cho ORC khi xếp thứ tự gộp:
- #172 có migration `0097` (số tạm). Bản v1.0.5 vốn đã có migration và đã có quyết định 25 (V5-61 chặn production cả bản), nên #172 không đổi điều kiện lên production.
- Cần ORC xác nhận số migration, vì V5-45 cũng cần một migration nhỏ.
- 07/11, `gitleaks` đỏ trên #170, #171, #172 và `build-test` đỏ trên #170. Chủ PR xem trước khi xin gộp.

## 6. ESC

Không có ESC. Các việc trên thuộc quyền PO (thứ tự ưu tiên, phạm vi trong round, câu release notes) và không đổi chính sách kinh doanh.

| 2026-11-07 | 5 | **PO – review OPS PR #165 (V5-47 so chữ tờ in Tờ 4 với trang khách) @ 38c9c398: ĐẠT theo tiêu chí V5-47.** PO tự chạy: KHỚP 7 tờ × 4 khóa trên PR và trên gộp thử main @ 511d7f23; sửa một chữ Tờ 4 VI → bộ so đỏ, build_print_sheets dừng, không ghi tệp; bỏ U+00A0 ở RU → đỏ; self-test 23/23. Gộp khi UXD, SEC duyệt cùng SHA. Câu release notes "Tờ in ở quầy và trang khách luôn cùng chữ" giữ. Thẻ FB-R5-PO-UXD-165-01 (Suggestion: Tờ 1 HTML lệch bản dựng, dựng lại cùng V5-71). **Xếp chỗ:** đếm lượt mở link khách đã thu hồi (OPS-on-sec-v5-74 mục 3) → v1.0.6, nên có, không vào cắt 13/11; làm sớm được sau 13/11 vì là SQL chạy tay khuôn K14, không vào image. **SEC #160 nhãn "OWN tự duyệt và chi":** không thêm dòng release notes, vì Desk không hiện cờ ownSelfApprovedAndPaid (Nhật ký tiền ghi "Ghi đã hoàn chuyển khoản"); thẻ FB-R5-PO-BA-160-01 Suggestion sửa câu BR-522, rbac 39/A47, EP03-05. Plan 4b thêm #171, #166, #168, #172, #170, #165 và việc vận hành song song INV 07/11 (sao lưu và dự án lên Google Drive công ty), không chặn cắt code. Không ESC | PO | Quyền PO (tiêu chí nghiệm thu, thứ tự ưu tiên, phạm vi trong round); rounds/round-05/reviews/PO-on-ops-pr-165.md |
