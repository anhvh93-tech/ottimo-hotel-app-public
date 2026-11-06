# QC – Cổng đóng Round 4 và chuyển sang chế độ vận hành

- Người kiểm: QC | Ngày: 06/11/2026, tối | Round 4 – bước **QC** (cổng đóng round).
- Phạm vi: khép Round 4 và mức sẵn sàng vận hành. Cổng này **không chấm lại** v1.0.1–v1.0.4 và LP-v2. Cổng của từng bản nằm trong `rounds/round-04/qc/`.
- `main` lúc chấm: `066da253` (SEC xác nhận OR-01), sau `bede5332` (OPS sửa `pull-backups.sh`). Production: app và landing `sha-6414be25f20d`. Tag `v1.0.4` và `landing-v2.0.0` trỏ `6414be25`.
- Căn cứ:
  - `round-summary.md` (bản nháp của ORC);
  - PO: `outputs/PO/round-4-metrics.md`, `outputs/PO/esc-pending-06-11.md`, `rounds/round-05/plan.md`;
  - QA: `qa/lp-v2-staging-s6.md` (mục 0, 1, S6d), `qa/bug-list.md`, `qa/bug-list-v1.0.4.md`;
  - SEC: `reviews/SEC-on-lp-v2-s6d.md`, `reviews/SEC-on-bug-r4-054.md` (gồm mục "Xác nhận OR-01" ở `066da253`);
  - OPS: `outputs/OPS/ops-readiness-06-11.md`, `outputs/OPS/lp-v2-release-runbook.md` (r2.3), `responses/OPS-LP-v2.md`;
  - tài liệu: `product/docs/so-van-hanh.md` (bản 1.1), `product/docs/tham-so-quy-tac.md`, `product/docs/manual/user-manual-v1.0.md` và `manual/guides/`;
  - `01-decisions/decision-log.md` (các dòng 06/11), `02-escalations/escalations-index.md`.
- Cách kiểm: đọc tệp, `git log/show/diff`, `gh run view` (chỉ đọc), script đếm trên tệp markdown trong repo. QC không SSH, không gọi staging hay production, không sửa sản phẩm. Tệp này không có bí mật, IP hay dữ liệu khách.

---

## 0. Quyết định: **ĐẠT CÓ ĐIỀU KIỆN**

Round 4 được đóng và OTTIMO chuyển sang vận hành. Lý do: production không còn lỗi P0/P1 chưa sửa, mọi Blocker và Major đều đã xử lý hoặc có đích, SEC 9.5 đủ 12 ca có kết luận, và mức an toàn vận hành tối thiểu đã có. Có 8 điều kiện ở mục 2; ĐK-1 (CI) đã đạt ngay trước khi QC commit, còn 7. Không điều kiện nào đổi production; phần lớn là sửa tài liệu cho khớp thực tế và khép sổ.

Điểm nặng nhất là **diễn tập khôi phục chưa làm** (SEC xếp Major). QC xếp đây là **điều kiện có cổng chặn**, không chặn việc đóng round. Lý do ở mục 3.

Không có ESC mới. Đây là quyết định trong quyền QC.

---

## 1. Bảng kiểm

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Không lỗi P0/P1 mở. Mọi lỗi còn mở có đích | **Đạt, kèm ĐK-7** | 8 lỗi P0/P1 (037, 038, 046, 048; 035, 039, 042, 053) đều có bản sửa đã gộp `main` trước `6414be25`, tức đang chạy trên production. QA đã xác nhận bản sửa ở local hoặc E2E (`bug-list-v1.0.4.md`). Chưa lỗi nào chuyển **Closed**: việc này thuộc V5-02. QC v1.0.4 còn ghi 035, 039 "P1 còn mở có từ trước". QC đếm lại từ hai bug list: 57 lỗi; 20 Closed; 28 đã sửa chờ QA đóng; 9 còn mở. 8 lỗi còn mở vào v1.0.5 (017 → V5-24, 036 và 051 → V5-10, 040 → V5-22, 041 phần còn lại → V5-14, 043 → V5-17, 052 → V5-12, 057 → V5-1A). BUG-R4-054 vào backlog B-OPS (plan R5 phụ lục A1). Không lỗi nào thiếu đích |
| 2 | Không Blocker/Major Open mà thiếu đích hoặc quyết định | **Đạt, kèm ĐK-1, ĐK-8** | Bảng PO: Blocker 1/1 xử lý; Major 120/121 xử lý, 1 dời có đích (A31-01 → V5-16). QC quét các tệp `reviews/`: còn khoảng 90 thẻ Major/Blocker có dòng "Trạng thái: Open" chưa sửa. QC kiểm mẫu 12 thẻ (SEC-ARC-EM-01, SEC-OPS-PR23-01, SEC-OPS-RB-01, DOM-PO-RN103-01, SEC-ARC-P104-01/02, ARC-BE-PR71-01, SEC-BE-SENT-02, UXD-FE-PR77-01, ARC-BE-S16-01, SEC-QA-PR74-01, CPY-INT-01). Cả 12 thẻ đều có bằng chứng đóng ở tệp khác: lượt review sau, cổng QC, runbook, decision-log. Số của PO đứng được. Ba Major SEC tối 06/11: |
| | – OR-01 | **Đạt** | OPS sửa ở `bede5332` (`--ignore-existing`, so nội dung, thoát 3, `.last_pull` chỉ khi thoát 0). SEC xác nhận ĐẠT, thẻ Closed (`066da253`, mục "Xác nhận OR-01" X1–X7). CI run 42216146418: job `infra scripts` xanh, `pull-backups.test.sh` **11 passed, 0 failed**, `ops-check` 206/206. Job landing của run này bị hủy vì có lượt chạy mới hơn |
| | – OR-02 | **Có đích** | Open, chờ INV đồng ý cài launchd. Đích V5-60 (bắt buộc, Gói 6). OPS đã trả lời ("Open – chờ INV"). Tới khi xong: kéo tay ít nhất 2 ngày một lần (ĐK-3) |
| | – 054-02 | **Có quyết định, kèm ĐK-8** | Chỉ có hiệu lực khi làm A+. PO quyết A+ vào backlog (decision-log 06/11, plan R5 mục 6 ý 4). SEC cho phép dời A+ (A1). Thiếu dòng trả lời của OPS trong `responses/` |
| | – CI | **Đạt (ĐK-1 đã đạt)** | Từ lượt CI xanh đủ gần nhất trên `main` (schedule 05/11 19:57Z, `57cbd0b4`) tới nay, phần ngoài `product/docs` chỉ đổi 4 tệp: `pull-backups.sh`, test của nó, `ci.yml`, README server. Run 42216146418 (`bede5332`) bị lượt sau hủy theo luật concurrency. Run 42216567004 (`066da253`, chứa `bede5332`): **9/9 job kiểm xanh**, gồm landing Playwright, `format · lint · audit · test · build`, `infra scripts` và `docker images build · E2E smoke` (17 phút 22 giây); `publish images` xanh. Job `deploy staging` chờ người duyệt môi trường, không phải job kiểm; QC không duyệt |
| 3 | SEC 9.5 trên staging đủ 12 ca có kết luận | **Đạt** | `lp-v2-staging-s6.md` S6d.4 và `SEC-on-lp-v2-s6d.md` mục 1. Kết quả: 1, 2, 3, 5, 6, 7, 8, 11, 12 Đạt (ca 7 đo thay thế). Ca 4: phần web Đạt; phần Desk "từ – đến" là Minor (FB-R4-SEC-BE-03), xếp V5-19 kèm điều kiện kích hoạt. Ca 9: chỉ có kết quả trên stack thử, SEC giữ chấp nhận. Ca 10: Đạt bằng bằng chứng thay thế, SEC chấp nhận (mục 6.3), kèm điều kiện V5-73. Cộng BE-01 Đạt. 0 ca đỏ |
| 4 | Sổ vận hành dùng được cho người không rành kỹ thuật | **Đạt, kèm ĐK-4** | Có đủ việc hằng ngày (1.1), tuần (1.2), tháng (1.3), năm và các mốc (1.4). Có cách xử lý P0 (3.1–3.4) và cách báo lỗi bằng `/feedback`, kèm luật không gửi dữ liệu khách (3.3). Quét tệp: 0 emoji, 0 IP, 0 SĐT; email duy nhất là hộp thư chung `info@ottimo.vn`. Giọng văn ngắn, điềm tĩnh. **Lệch với quyết định 06/11:** (a) 1.2, 5.3 ý 5 và G2 dạy kéo sao lưu mỗi tuần, cho phép tới 2 tuần, ngưỡng 8 ngày; SEC và ORC chốt "ít nhất 2 ngày một lần" (decision-log 06/11, dòng ORC kéo sao lưu); (b) 1.3, mục 6, 7.2 ghi phòng "Báo động" chỉ có OWN, "không thêm ai"; trong khi tổng kết mục 4 ý 5 và SEC OR-L7 mời thêm người thứ hai. INV làm theo một tệp sẽ trái tệp kia |
| 5 | Sổ tay và từ điển không còn câu sai so với production 06/11 (kiểm mẫu) | **Không đạt, ĐK-5, ĐK-6** | Mẫu đúng: giá web đã bật (sổ tay dòng 346), form bật, một giá mọi đêm, không còn +15 %, ví dụ Studio 1.600.000 khớp ca mẫu production; từ điển `public_show_prices` "đã bật 06/11". **Sai:** (a) check-in online đã mở lại 06/11 (decision-log, dòng v1.0.4 lên production: "N5 xong… mở lại check-in online"), nhưng sổ tay và bộ hướng dẫn còn dạy **không gửi link**: sổ tay dòng 47 (0.1), 808 (2.4), 1006 (2.9), 1760 (4.2), 2013 (5.6); `guides/00-index.md` dòng 73; `guides/01` 15.4; `guides/02` 17.3; `guides/05` 8.3; `guides/screenshot-additions.md` dòng 8. V5-08 chỉ liệt kê 0.1, 2.9, 5.6, `00-index`, `02` 17.3. (b) Từ điển `night_from_month_divisor` ghi "[Đã bỏ]… không còn tác dụng" (dòng 1184). Thực tế API vẫn dùng (BUG-R4-057). Đã xếp V5-1A, DOM sửa 07–08/11. Cả hai lỗi không chạm tiền hay dữ liệu khách: lễ tân làm giấy tờ ở quầy là đường an toàn; khóa ÷12 ghi "Không sửa" |
| 6 | Kế hoạch Round 5 có mục tiêu, phạm vi, tiêu chí QC, lịch; không bỏ sót (kiểm mẫu) | **Đạt, kèm ĐK-4, ĐK-5** | Có mục tiêu (mục 1), phạm vi 7 gói với 59 việc (QC đếm lại 59; Gói 5 12 việc), tiêu chí QC 12 điều (mục 4), lịch 07–21/11. Bảng mục 7 cộng đúng: 126 + 203 + 224 = 553. Đối chiếu mẫu với SEC B3 (12 việc), OPS mục 10 (8 việc), SEC S6d mục 9 (5 việc), PO esc-pending mục 3 (7 việc): đều có mã V5 hoặc nhóm backlog. **Sót:** phạm vi V5-08 (tiêu chí 5a); việc sửa ngay nhịp kéo sao lưu và luật phòng "Báo động" trong sổ vận hành (tiêu chí 4); lượt Dependabot `minimatch` lỗi từ 03/11 (mục 5) |
| 7 | Tổng kết round đúng số liệu | **Đạt sau khi QC sửa** | Số thẻ (748; 1/121/356/253/17) khớp PO. 11 thẻ SEC tối 06/11 (3 Major, 7 Minor, 1 Suggestion) khớp tệp SEC. Bảng lỗi khớp QC đếm lại: P0 4, P1 4, P2 20, P3 29; 20/28/9 sau khi đóng BUG-R4-056. Số ESC: 8 đang chờ, khớp index. Số V5: 553/126/59/203/224 khớp plan. QC sửa 4 chỗ (mục 4). Ghi nhận: `round-4-metrics.md` mục 5 còn số cũ 534/125/193/216, khác plan; tổng kết dùng số của plan nên đúng |
| 8 | An toàn vận hành tối thiểu | **Đạt, kèm ĐK-2, ĐK-3** | Bản ngoài máy: ORC kéo khoảng 19:00 ngày 06/11, 85 tệp, bản mới nhất `db-20261106T070832Z`, sha256 khớp (decision-log 06/11). Lượt này chạy script cũ, trước `bede5332`. Kiểm tĩnh giá production: 10 căn trong cửa sổ, **0** căn thiếu giá, 0 dòng giá ≤ 0. Đây là số "theo ORC", QA và QC không có tệp thô; staging chưa có số đếm. Cảnh báo có người nhận: phòng Chat "Báo động" (OWN), Healthchecks và UptimeRobot gửi email tới hộp thư chung; lượt kiểm 18:20 ra 16/16 ok. **Diễn tập khôi phục:** chưa có trong Round 4. Lần cuối là 29/10, khi DB có 65 migration; nay là 72. `backup.sh` cũng đã đổi ngày 01/11. QC quyết: điều kiện có cổng chặn (ĐK-2, mục 3) |

---

## 2. Điều kiện

Hạn tính theo giờ Việt Nam. "Xong khi" là bằng chứng QC sẽ đọc.

| ĐK | Việc | Người làm | Hạn | Xong khi |
|---|---|---|---|---|
| **ĐK-1** | Có **một lượt CI xanh đủ mọi job** trên một commit `main` từ `bede5332` trở đi. Tính cả `docker images build · E2E smoke` và landing Playwright. **Đã đạt 06/11:** run 42216567004, `headSha` `066da253`, 9/9 job kiểm xanh | ORC | 07/11 12:00 | ORC ghi số run và `headSha` vào decision-log khi tổng kết. Không cần làm thêm |
| **ĐK-2** | **Diễn tập khôi phục production (V5-61)** theo đủ yêu cầu SEC: môi trường cách ly, giải mã 1 ảnh mẫu bằng KEK, áp lại `purge_journal` rồi chạy J16, xóa dữ liệu khôi phục sau khi xong, biên bản chỉ ghi số đếm. Bản dùng: bản trên Mac `db-20261106T070832Z` hoặc mới hơn, image `sha-6414be25f20d` | OPS + INV (30 phút mở khóa `age`) | Chậm nhất buổi review 20/11. **Cổng chặn:** trước khi xong, không deploy production bản nào có migration hoặc đổi sao lưu, khôi phục. Bản sửa P0 không có migration vẫn được lên, kèm sao lưu ngay trước deploy | Biên bản số đếm trong repo, SEC đọc và xác nhận. QC v1.0.5 điều 9 dựa vào biên bản này |
| **ĐK-3** | Kéo bản sao lưu ra ngoài máy **ít nhất 2 ngày một lần**, bằng `pull-backups.sh` bản `bede5332`, tới khi V5-60 tự động hóa. Lần tới chậm nhất 08/11 khoảng 19:00. Ghi giờ chạy và mã thoát. Thoát 3 ("server copy changed") là dấu hiệu máy chủ bị chiếm: xử lý như P0 bảo mật (OPS + SEC), giữ nguyên bản trên Mac | ORC (cần INV cho phép SSH trong ngày) | Mỗi 2 ngày, lần đầu 08/11 | Mỗi lần kéo có một dòng decision-log: giờ, mã thoát 0, tên bản mới nhất. Quá hạn vì INV vắng thì ORC báo INV đầu tiên ở lần INV mở phiên kế tiếp |
| **ĐK-4** | Sửa `so-van-hanh.md` cho khớp quyết định 06/11. (a) 1.2, 5.3 ý 5, G2, 2.2 dòng 1: tới khi có kéo tự động, đội kéo sao lưu **ít nhất 2 ngày một lần** khi anh/chị cho phép; anh/chị chỉ cần mở Claude Code và đồng ý. (b) 1.3, mục 6, 7.2: phòng "Báo động" có thể có thêm một người anh/chị chọn (OR-L7); tin không có dữ liệu khách. (c) Gộp luôn 2.2 dòng 4 (diễn tập 35 ngày, không còn hằng quý), nếu SEC đồng ý | BA → SEC, OPS | 08/11 | Bản 1.2 của sổ vận hành có các dòng trên; SEC hoặc OPS đọc lại |
| **ĐK-5** | Mở rộng **V5-08** và làm xong: bỏ mọi câu "check-in online tạm dừng / chưa gửi link". Chỗ cần sửa: sổ tay dòng 47, 808, 1006, 1760, 2013; `guides/00-index.md` dòng 73; `guides/01` 15.4; `guides/02` 17.3; `guides/05` 8.3; `guides/screenshot-additions.md` dòng 8. Ghi lại câu nào còn đúng, ví dụ đơn giữ chỗ chưa có link (V5-53) | BA → SEC, UXD | 10/11 (hết Gói 0) | `grep -n "tạm dừng\|chưa gửi link"` trong `product/docs/manual/` chỉ còn câu đúng sự thật. PO sửa dòng V5-08 trong plan R5 |
| **ĐK-6** | Từ điển tham số (`.md` và `.json`): mục `night_from_month_divisor` ghi đúng là khóa còn dùng ở đường API đổi giá khi không gửi giá đêm (BUG-R4-057), không sửa giá trị 12. Phần này thuộc V5-1A | DOM → BA | 08/11 | Không còn chữ "[Đã bỏ]" hay "không còn tác dụng" cho khóa này |
| **ĐK-7** | **V5-02:** chuyển Closed 28 lỗi "đã sửa, chờ QA", gồm 8 lỗi P0/P1. Kiểm lại BUG-R4-035 trên staging cùng digest qua Desk, hoặc dẫn bằng chứng E2E trên commit đã phát hành. Kiểm lại BUG-R4-039 bằng đếm chỉ đọc trên production. Không ghi thử trên production. Sửa ô P3 "Closed 10" ở bảng tóm tắt `bug-list.md` dòng 49: ô này liệt kê 11 mã | QA → QC | 10/11 | Bug list chỉ còn lỗi thật sự mở. P0/P1 nào hóa ra chưa sửa trên production thì làm theo đường hotfix (protocol 9.3) và báo INV ngay |
| **ĐK-8** | Thêm dòng trả lời trong `responses/OPS-LP-v2.md` cho FB-R4-SEC-OPS-054-02 (Major): "Deferred – chỉ có hiệu lực khi làm A+, backlog B-OPS, quyết định PO 06/11". Làm luôn các thẻ Minor của SEC tối 06/11 (054-01, 03…06; OR-03; OR-04; S6D-01), mỗi thẻ trỏ về mã V5 | OPS | 08/11 | Mọi thẻ SEC ngày 06/11 có một dòng trong `responses/` |

ĐK-1, ĐK-4, ĐK-5, ĐK-6, ĐK-7 và ĐK-8 không cần INV. ĐK-2 và ĐK-3 cần INV. Hai việc này đã nằm trong tổng kết mục 4 (việc 1 và 3).

---

## 3. Diễn tập khôi phục: vì sao là điều kiện, không chặn đóng round

- **Rủi ro có thật.** Chưa chứng minh được bản sao lưu của DB 72 migration khôi phục được. Từ 29/10 tới nay đã thêm trigger chỉ ghi thêm, bảng mới, và `backup.sh` đổi ngày 01/11. SEC xếp Major (SR-BAK-05: mỗi round một lần).
- **Chặn đóng round không làm việc này nhanh hơn.** Chỉ INV mở được khóa `age`. INV đang vắng. Chặn round thì đội đứng yên, còn v1.0.5 (có lỗi tiền ở quầy và H2 hạn 01/12) bị chậm.
- **Đóng round không đổi production.** Rủi ro ở đây là mất máy chủ trước khi diễn tập. Có các lớp giảm thiểu:
  - bản ngoài máy mới, kiểm sha256 ngày 06/11;
  - `age` có xác thực;
  - lần diễn tập 29/10 đạt với cùng đường sao lưu;
  - bản trên VPS vẫn giữ 7 ngày cộng các bản tuần.
- **Vì vậy ĐK-2 có cổng chặn thật**, như ở mục 2. Không bản nào có migration hoặc đổi sao lưu được lên production trước khi diễn tập đạt. Nếu tới 20/11 chưa diễn tập, v1.0.5 dời production theo plan R5 điều 9. Khi đó H2 dùng quy tắc tách bản 25/11; bản tách H2 cũng phải tuân ĐK-2 nếu có migration.
- Gợi ý, không phải điều kiện: nếu khóa `age` của staging có trên máy đội, OPS có thể diễn tập trước bằng bản sao lưu staging trên stack cục bộ dùng một lần (không phải staging dùng chung). Cách này kiểm được `restore-drill.sh`, 72 migration và `backup.sh` mới mà không cần INV. Lượt SSH lấy bản staging vẫn cần INV cho phép.

---

## 4. Đã sửa trong `round-summary.md`

QC chỉ sửa những chỗ sai sự thật hoặc thiếu cập nhật. Không đổi bố cục hay phần đề xuất của ORC.

| Chỗ | Trước | Sau | Vì sao |
|---|---|---|---|
| Mục 2 | Để trống | Điền quyết định QC | Việc được giao |
| Mục 1, ý giá web | "đo được sau 2,5 giây" | "đo trên bản thử: khoảng 2,5 giây" | Ca 8 chạy trên staging, chưa đo trên production |
| Mục 1, sổ tay | "Sổ tay người dùng đã sửa khớp thực tế 06/11" | Phần web và giá đã khớp; còn câu cũ "check-in online tạm dừng", sửa trước 10/11 | Sai so với production (tiêu chí 5a) |
| Mục 3, OR-01 | "đã sửa ngay trong Round 4" | Thêm "SEC đã xác nhận, thẻ đóng (`066da253`)" | Cập nhật sau xác nhận của SEC |
| Mục 3, bảng lỗi, tiêu đề cột cuối | "Còn mở (đều vào v1.0.5)" | "Còn mở (8 vào v1.0.5, BUG-R4-054 vào backlog)" | BUG-R4-054 xếp backlog B-OPS (plan R5 phụ lục A1) |

Các số khác QC đã đối chiếu và để nguyên.

---

## 5. Ghi nhận nhỏ (không phải điều kiện)

1. **Dòng trạng thái thẻ trong `reviews/`.** Nhiều thẻ đã đóng nhưng tệp review vẫn ghi "Open": QC đếm được khoảng 90 thẻ Major/Blocker như vậy. Mẫu 12/12 đã có bằng chứng đóng ở nơi khác. Ở chế độ vận hành, người đọc sau dễ hiểu nhầm. Đề xuất: từ Round 5, người review sửa dòng trạng thái ngay ở thẻ khi đóng. Thẻ R4 cũ để nguyên, bảng phụ lục C của plan R5 là nguồn tra.
2. **Dependabot `minimatch`.** Lượt cập nhật bảo mật lỗi từ 03/11 (run 41573607059, 42216172237). Lockfile đã có `minimatch` 3.1.5, 5.1.9, 10.2.6, đều nằm ngoài các dải bị ảnh hưởng ghi trong job; job `audit` của CI xanh. OPS xem vì sao job lỗi (B-KYTHUAT). Cổng v1.0.1 và v1.0.2 đã ghi nhận việc này nhưng chưa có mã việc.
3. **CI bị hủy theo dây chuyền.** Mỗi commit tài liệu hủy lượt CI trước, nên từ 05/11 09:06Z `main` chưa có lượt push nào xanh đủ. Khi cắt bản v1.0.5, ORC chờ CI xong rồi mới commit tiếp, hoặc dùng lượt schedule (QC v1.0.5 điều 4).
4. **`esc-pending-06-11.md`:** mục 3 việc 4 ghi lượt sao lưu "03:30"; production chạy 03:00 (OPS mục 2, 3; sổ vận hành 2.1). Mục 3 việc 6 còn ghi "giá City View 800.000" như việc phải làm, trong khi production đã nhập từ 06/11. Tổng kết đã ghi đúng. PO sửa ở lần chạm tệp tới.
5. **`round-4-metrics.md` mục 5** còn số xếp loại cũ (534/125/193/216). Plan R5 mục 7 là số đúng (553/126/203/224).
6. **Kiểm tĩnh `pricegap` trên staging** chưa có số đếm. Không chặn: QAT1 không nhãn, các căn khác có giá từ 06/11.
7. Bảng phân quyền trong sổ tay (mục 5) dùng ký hiệu dấu tích U+2714. Đây là ký hiệu chữ, không có biến thể emoji, trong tài liệu nội bộ. Chấp nhận.

---

## 6. Rủi ro chủ đầu tư cần biết

- **Chưa chứng minh khôi phục được** từ bản sao lưu hiện nay (ĐK-2). Cần anh/chị khoảng 30 phút.
- **Bản ngoài máy chỉ mới nếu anh/chị cho phép kéo** khoảng 2 ngày một lần. Chưa có gì tự báo khi bản này cũ. Phải tới V5-60 và khi anh/chị đồng ý cài lịch tự kéo.
- **Mức mất dữ liệu thật là 24 giờ**: mỗi ngày một lượt sao lưu lúc 03:00. Sau v1.0.5 còn 12 giờ.
- **Cảnh báo chỉ tới một người** và ban đêm không có báo đẩy.
- **Giá production còn lệch sổ tay** (B2–B11, `rounding.ota_rate`). Desk và web ra số lai tới khi anh/chị chỉnh.
- Sổ tay còn dặn không gửi link check-in online tới khi BA sửa (ĐK-5). Lễ tân sẽ tiếp tục làm giấy tờ ở quầy. Cách này an toàn, chỉ chậm hơn cho khách.

---

## 7. QC không kiểm được

- Production và staging trực tiếp. Số kiểm tĩnh giá, số tệp đã kéo và kết quả `ops-check` là số do ORC và OPS báo.
- Khả năng khôi phục thật của bản sao lưu.
- Toàn bộ 748 thẻ: QC chỉ kiểm mẫu 12 thẻ Major. Suggestion không kiểm.
- UptimeRobot và Healthchecks từ phía nhà cung cấp.
- Job `deploy staging` của run 42216567004: đang chờ người duyệt môi trường. Lượt CI của commit QC (chỉ tài liệu) sẽ thay lượt này theo luật concurrency.

---

## 8. Dòng decision-log (quyền QC)

`| 2026-11-06 | 4 | **QC – cổng đóng Round 4 và chuyển sang vận hành: ĐẠT CÓ ĐIỀU KIỆN** (rounds/round-04/qc/round-4-closeout-gate.md). Đạt: 0 P0/P1 chưa sửa trên production (8 lỗi đã sửa trong sha-6414be25f20d, chờ QA đóng sổ); mọi Blocker/Major có xử lý hoặc đích (OR-01 Closed, SEC 066da253, test 11/11; OR-02 → V5-60 chờ INV; 054-02 theo A+ ở backlog); SEC 9.5 đủ 12 ca, 0 đỏ; sổ vận hành đủ ngày/tuần/tháng/năm, P0, /feedback, không bí mật/IP/PII; bản ngoài máy db-20261106T070832Z, pricegap tĩnh production 0, cảnh báo có người nhận. 8 điều kiện: ĐK-1 CI xanh đủ job trên main ≥ bede5332 (ORC, 07/11 12:00) – đã đạt: run 42216567004 @066da253, 9/9 job kiểm xanh; ĐK-2 diễn tập khôi phục V5-61 (OPS + INV, chậm nhất 20/11; trước đó không deploy production bản có migration hay đổi sao lưu); ĐK-3 kéo bản ngoài máy ≥ 2 ngày/lần bằng script bede5332, lần tới 08/11, thoát 3 = P0 bảo mật (ORC, cần INV cho SSH); ĐK-4 sổ vận hành sửa nhịp kéo 2 ngày và luật phòng Báo động (BA, 08/11); ĐK-5 bỏ câu "check-in online tạm dừng" ở sổ tay và guides, mở rộng V5-08 (BA, 10/11); ĐK-6 từ điển night_from_month_divisor (DOM, 08/11); ĐK-7 V5-02 đóng 28 lỗi, kiểm lại 035/039 (QA, 10/11); ĐK-8 OPS trả lời 054-02 và các thẻ SEC 06/11 (OPS, 08/11). Diễn tập khôi phục là điều kiện có cổng chặn, không chặn đóng round: chỉ INV mở được khóa, đóng round không đổi production. QC sửa round-summary 5 chỗ (điền mục 2; đo 2,5 giây trên bản thử; sổ tay còn câu check-in online; OR-01 SEC đã đóng; BUG-R4-054 vào backlog) | QC | Quyền QC (quyết định ĐẠT/KHÔNG ĐẠT của round) |`
