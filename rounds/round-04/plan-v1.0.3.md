# Round 4 – Kế hoạch phát hành v1.0.3 (và tách v1.0.4)

- Người lập: PO | Round 4 – đợt v1.0.3 – Bước: **Lập kế hoạch** | 03/11/2026, 17:00 (chốt phạm vi hôm nay, thay cho mốc 04/11 ở backlog 5.6)
- Căn cứ: INV 03/11 yêu cầu bắt đầu v1.0.3 ngay sau khi v1.0.2 lên production (tag `v1.0.2` @ `e5fffe05`, decision-log dòng 1080); ESC-040 A (30/10): BUG-R3-032 phải sửa **chậm nhất 09/11**, quá hạn thì SEC báo lại INV; QC v1.0.2 ĐK10–ĐK12 (`rounds/round-04/qc/v1.0.2-gate.md` mục 3); backlog 5.6 bản 03/11 (`03-backlog/backlog.md` dòng 1559–1618).
- Đọc: backlog 5.6; `rounds/round-03/qa/bug-list.md` (BUG-R3-032, 041–044, ĐX-R3-QA-01); `rounds/round-04/qa/bug-list.md` (BUG-R4-015, 017); `02-escalations/ESC-040.md`; `rounds/round-03/reviews/SEC-on-B2-readiness.md` mục 1.5 (yêu cầu bắt buộc của SEC cho BUG-R3-032); `01-decisions/decision-log.md` dòng 1065–1080; `product/docs/release-notes.md`; `product/infra/server/README.md` mục 7, 13.8; `rounds/round-04/plan-v1.0.1.md` (mẫu).
- `rounds/round-04/outputs/ARC/v1.0.3-tech-plan.md` **chưa có** lúc PO viết (17:00). Kế hoạch này chỉ đặt phạm vi, thứ tự, tiêu chí nghiệm thu. Giải pháp kỹ thuật, tên nhánh, số hợp đồng và số migration do ARC chốt. Nếu tech plan của ARC cho thấy gom được nhiều hơn mà vẫn chắc kịp 06/11, ORC quyết theo nguyên tắc ở mục 1.3.

---

## 0. Kết luận nhanh

1. **v1.0.3 chỉ gồm BUG-R3-032** (thư "Security notice" tới hộp thư riêng của chủ đầu tư) và một **toa phụ có điều kiện**: thông báo xử lý dữ liệu cho khách lưu trú bản 2 (`privacy-2026-10-v2`, để mở lại check-in online). Kèm thêm một việc chỉ sửa tài liệu (ARC chốt cách dùng ETag). Toa phụ chỉ lên nếu sẵn sàng lúc cắt nhánh **12:00 ngày 05/11**. Không sẵn sàng thì tự chuyển sang v1.0.4, v1.0.3 không chờ.
2. **Đích production v1.0.3: sáng 06/11** (thứ Sáu). Để trống 07–08/11 cho sửa lỗi hoặc quay lui. Mốc báo động là **18:00 ngày 08/11**: tới lúc đó v1.0.3 chưa lên thì SEC soạn ESC theo ESC-040, để INV quyết trước 09/11.
3. **Nhóm giữ chỗ quá hạn** (BUG-R3-042 P1, 043, 044, 041 + WA-04, ĐX-R3-QA-01) chuyển sang **v1.0.4**. Nhóm này **làm song song ngay từ 04/11** (BE-B không nằm trên đường găng của 032), có PR và lượt QA riêng. **Đích v1.0.4: 08/11, chậm nhất 10/11**. Cách tạm hiện tại (sổ tay 2.4, rà 3 mốc mỗi ngày) giữ tới khi v1.0.4 lên.
4. Lý do tách: 032 và nhóm giữ chỗ cùng cần ARC (hợp đồng) và FE-A (Desk). Nhóm giữ chỗ chạm luồng tiền cọc (`deposits.service`), cần migration (thêm kind thông báo vào CHECK, có thể trùng số với LP-v2 0091). QA lại phải chờ giữ chỗ hết hạn theo giờ thật, vì staging không có đồng hồ giả (`/v1/__test__/clock` → 404). Gom chung thì v1.0.3 khó lên trước 07–08/11, chỉ còn 1 ngày dự phòng trước hạn cứng 09/11.
5. **Việc tồn từ QC v1.0.2 phải xong trước QC v1.0.3:** ĐK10 (QA, sáng 04/11) và ĐK12 (a)–(d) (hạn 12:00 ngày 05/11). QC đã ghi: chưa xong ĐK12 (a)–(b) thì QC v1.0.3 không xét (mục 3).
6. **Không có câu hỏi mới cần INV quyết.** INV có 3 việc phải tự làm: duyệt staging và Release; tự nhập email riêng trên Desk; xác nhận đã nhận thư. Email thật không đi qua chat và không ghi vào repo (mục 6). Tách nhóm giữ chỗ sang v1.0.4 làm việc này trễ 1–3 ngày so với mốc "dự kiến 07/11" trong release notes. PO xếp việc này vào quyền PO (phạm vi bản vá, có cách tạm). ORC báo INV trong tổng kết. Nếu ORC thấy đây là "dời mốc" phải báo lên, khung ESC đã soạn sẵn ở mục 6.3.

---

## 1. Mục tiêu, hạn, khuyến nghị chia đợt

### 1.1 Mục tiêu v1.0.3
- **M1 (bắt buộc, hạn cứng):** BUG-R3-032 lên production **trước 09/11**. Chủ đầu tư nhận được thư "Security notice" ở hộp thư riêng. SEC xác nhận bỏ lượt kiểm mỗi sáng B1–B6.
- **M2 (có điều kiện):** thông báo xử lý dữ liệu bản 2 trên trang khách, ở cả 3 ngôn ngữ (vi, en, ru), cùng chữ với tờ **Your ID details** ở quầy. Khi có M2, SEC kiểm xong thì ORC báo INV mở lại check-in online.
- Không đổi luồng tiền. Không thêm tính năng ngoài hai mục trên.

### 1.2 Ba phương án đã cân nhắc

| PA | v1.0.3 gồm | Production dự kiến | Dự phòng trước 09/11 | Đánh giá |
|---|---|---|---|---|
| **A – Đề xuất** | 032 + toa phụ `privacy-2026-10-v2` (nếu kịp cắt 05/11 12:00) + ETag (tài liệu) | **06/11 sáng** | 2–3 ngày | Ít việc trên đường găng (ARC → BE-A/FE-A → SEC → QA). Nhóm giữ chỗ vẫn làm song song, lên v1.0.4 ngày 08–10/11 |
| B | A + nhóm giữ chỗ (042, 043, 044, 041, ĐX-QA-01) | 07–08/11 | 1 ngày hoặc không còn | ARC và FE-A gánh hai việc cùng lúc. Có migration. QA phải chờ giữ chỗ hết hạn qua đêm. Một lỗi ở nhóm giữ chỗ (luồng tiền) sẽ chặn luôn 032 |
| C | Chỉ 032, không toa phụ | 05/11 tối – 06/11 | 3 ngày | An toàn nhất, nhưng check-in online phải dừng thêm ít nhất một bản. Toa phụ không đụng mã của 032 nên không cần bỏ hẳn |

**PO chọn A.** Toa phụ ở A tự lùi về C nếu chưa sẵn sàng lúc cắt nhánh, nên A không bao giờ kém C về hạn.

### 1.3 Nguyên tắc cho cả đợt
1. BUG-R3-032 đi trước mọi việc. Việc nào cạnh tranh người với 032 (ARC, BE-A, FE-A, SEC, QA) thì nhường 032.
2. Mỗi phần là **một PR riêng** (032 / toa phụ / nhóm giữ chỗ). PR 032 không chứa mã của việc khác. Bỏ được bất kỳ PR nào khỏi tag mà không phải gỡ mã ra.
3. **Giờ cắt v1.0.3: 12:00 ngày 05/11.** PR nào lúc đó chưa đủ review bắt buộc và chưa có QA đạt trên stack thử thì sang v1.0.4. Không lùi giờ cắt vì toa phụ.
4. Tag đặt đúng commit có image đã kiểm trên staging (bài học ĐK1 v1.0.2). Từ giờ cắt tới khi tag, chỉ commit tài liệu lên `main`. LP-v2 gộp `main` **sau** tag v1.0.3, trừ khi ARC và ORC quyết khác.
5. v1.0.3 ưu tiên **không có migration**: cột `app_user.email` (citext) đã có trong `identity.ts`. ARC xác nhận. Nếu buộc phải có migration, làm theo luật journal (decision-log 30/10), có mục quay lui trong runbook và diễn tập trên staging như ĐK4 của v1.0.2.

---

## 2. Bảng việc v1.0.3

Người review theo protocol mục 5: ARC → BE, SEC (bắt buộc), OPS (khuyến nghị); BE → ARC, QA (bắt buộc), SEC (khuyến nghị; **bắt buộc với 032** theo SEC 1.5 ý 6); FE → UXD, QA (bắt buộc), ARC (khuyến nghị); OPS → ARC, SEC; SEC → ARC (bắt buộc), OPS (khuyến nghị); UXD → UXR, PO; BA (sổ tay) → DOM, ARC; PO (release notes, backlog) → BA, DOM.

| Mã | Việc | Vai làm | Review | Tiêu chí nghiệm thu | Phụ thuộc / hạn |
|---|---|---|---|---|---|
| **V3-01** | **Hợp đồng BUG-R3-032**: trường `email` cho người dùng (`Me` và "Người dùng & vai"); đặt/đổi email là thao tác S2 (`x-step-up`); mã lỗi; audit `security` `user.email_changed`; kind thông báo và mẫu thư `email_changed`; quy tắc che email trong log/Problem; cách xử lý thư cho người **chưa** có email (không gây cảnh báo giả ở `email_dead`). Thêm việc ghi chú ETag (V3-09). Số OpenAPI (0.3.10 hoặc 0.3.11 so với LP-v2) do ARC đặt | ARC | BE-A, SEC (bắt buộc); OPS (khuyến nghị) | (1) Đủ 6 ý của `SEC-on-B2-readiness.md` 1.5. (2) Ghi rõ: OWN đặt email của mình và của MGR/nhân viên; MGR **không** đặt hay đổi email của OWN; định dạng hợp lệ, ≤ 254 ký tự; không có S2 → 401 `REAUTH_REQUIRED`; MGR đổi email OWN → 403. (3) Nói rõ có migration hay không. (4) BE-A và SEC ghi "đồng ý" trước khi BE-A gộp mã | **Trước tiên.** Xong 04/11 trước 10:00. BE-A/FE-A chỉ code khi hợp đồng đã chốt |
| **V3-02** | **BE BUG-R3-032**: API đặt/đổi email; thư `email_changed` tới **cả địa chỉ cũ lẫn địa chỉ mới**; thông báo trong app cho chính người đó và mọi OWN; audit có che email; `email-dispatch` gửi được `receiving_account_changed`, `mfa_reset_by_operator`, dùng mã khôi phục tới OWN có email | BE-A | ARC, QA, SEC (cả 3 bắt buộc) | Test tự động: đổi email không S2 → 401; MGR đổi email OWN → 403; thư `email_changed` có 2 người nhận; `receiving_account_changed` có người nhận khi OWN đã có email; log và Problem không chứa email (SR-LOG); `privacy-log-check.sh` sạch. CI xanh. Thư `dead` từ trước không gửi lại (G2) | Sau V3-01. Code 04/11, review sáng 05/11 |
| **V3-03** | **Desk BUG-R3-032**: ô email ở **Tài khoản của tôi** và ở **Người dùng & vai** (OWN); hộp xác nhận lại S2; hiện email đã che; báo khi đổi xong ("Đã gửi thư xác nhận tới địa chỉ cũ và mới"); có trạng thái đang tải / rỗng / lỗi; VI + EN | FE-A; UXD đặt chữ | UXD, QA (bắt buộc); ARC (khuyến nghị) | MGR không thấy nút sửa email của OWN; FD/FDL/SAL không sửa được email người khác; câu lỗi 401/403/422 đúng nghĩa. Đúng Design System và brand (Be Vietnam Pro, bảng màu 80/15/5, không emoji). Ảnh chụp 1366 và 1440 px | Sau V3-01; song song V3-02 |
| V3-04 | `production-bootstrap --owner-email` qua **dấu nhắc ẩn**. Không nhận email qua tham số dòng lệnh (lịch sử shell sẽ giữ) | BE-A (+ OPS README) | ARC, SEC | Chạy trên stack thử: dấu nhắc không hiện chữ; `history` không chứa email; bỏ trống thì bootstrap vẫn chạy | **Should.** Production không cần, vì OWN tự nhập trên Desk. Không kịp giờ cắt → v1.0.4 |
| **V3-05** | **Runbook OPS v1.0.3** (`rounds/round-04/outputs/OPS/v1.0.3-release-runbook.md`): sao lưu trước Release; tag và kiểm `resolve`; K-check sau Release; bước INV nhập email (mục 6.2); bật `EMAIL_NO_RECIPIENT_ALERT=1` khi OWN đã có email (README 13.8); quay lui `rollback.sh sha-e5fffe05ed55`. Nếu phải gửi thư thử tới địa chỉ thật bằng `mail-test.mjs`, địa chỉ đọc bằng `read -rs` và truyền `-e MAIL_TEST_TO` không kèm giá trị, để địa chỉ không nằm trong lịch sử lệnh hay trong repo | OPS | ARC, SEC | Đủ các mục như runbook v1.0.2 r2. Có dòng "đúng là" cho từng bước. ARC và SEC đọc mục quay lui và mục bật cảnh báo. README 13.8 đổi "đợt 3" thành điều kiện cụ thể | Nháp 04/11, chốt trước QC v1.0.3 |
| **V3-06** | **QA BUG-R3-032**: lượt 1 trên stack thử của PR; lượt 2 smoke staging sau deploy (staging `EMAIL_PROVIDER=mock`, nên kiểm trạng thái outbox `sent` và người nhận đã che) | QA | BA, PO (test case); QC (khuyến nghị) | Các ca của bug-list mục "Kiểm lại": OWN có email → đổi tài khoản nhận → thư có người nhận; đổi email không S2 → 401; MGR đổi email OWN → 403; thư `email_changed` 2 người nhận; `ops-check` `email_dead` = 0 sau 3 ca. Hồi quy: `smoke-prod` 9/9, đăng nhập 2 bước, đổi tài khoản nhận, báo giá, nhận phòng. Dữ liệu thử chỉ dùng địa chỉ giả từ seed (`…@example.test`) | Lượt 1 sáng 05/11; lượt 2 chiều 05/11 |
| **V3-07** | **SEC**: review hợp đồng V3-01 và PR V3-02. Sau production, xác nhận bằng chứng: INV báo đã nhận thư; `email_dead` = 0 trong 24 giờ. Rồi ghi decision-log "bỏ lượt kiểm B1–B6" | SEC | ARC (bắt buộc với đánh giá SEC) | Dòng decision-log của SEC có giờ, bằng chứng, và điều kiện bật lại B1–B6 (ví dụ `email_dead` > 0) | Review 04–05/11; xác nhận 07/11 sáng |
| V3-08 *(toa phụ)* | **Thông báo khách lưu trú `privacy-2026-10-v2`**: thêm câu hạn lưu thông tin giấy tờ điền sẵn (SEC 5.2) và câu về dịch tin nhắn (RR-T4); 3 ngôn ngữ trang khách vi/en/ru. Tiếng Nga phải được duyệt, không rơi về EN (`RU_UNREVIEWED_LEGAL`). `NOTICE_TEXT_VERSIONS` nhận v2. Tờ **Your ID details** ở quầy cùng chữ. Trên production, OWN đặt version thông báo bằng Desk | SEC (chữ gốc); CPY (vi/en/ru, giọng brand); UXD (giọng và tờ in); FE-B (guest-web); ARC (xem máy chủ có danh sách version phải nới không) | SEC → ARC; FE-B → UXD, QA; chữ hướng khách → UXD | Chữ SEC chốt; QA đối chiếu từng câu ở 3 ngôn ngữ và trên tờ in; khách mở link check-in thấy bản v2, đồng ý thì `consent` ghi đúng version. Sau production SEC kiểm, ORC báo INV "mở lại check-in online" | **Chỉ vào v1.0.3 nếu đạt hết trước 12:00 05/11**, không thì sang v1.0.4 |
| V3-09 | **ETag `"6-gzip"` qua Caddy** (QA smoke v1.0.2 mục 11): ghi vào hợp đồng "client dùng `version` trong thân, không dùng ETag của phản hồi nén làm `If-Match`". **Không** chỉnh Caddy ở v1.0.3 | ARC | BE-A, SEC (cùng lượt V3-01) | Một đoạn trong `openapi.yaml`/`architecture.md`; dòng backlog 5.6 đóng | Gộp cùng V3-01 |
| V3-10 | **Tài liệu**: (a) PO: release notes mục v1.0.3; đổi đích nhóm giữ chỗ, `leaseEndDate`, BUG-R4-015 sang v1.0.4; sửa dòng trạng thái v1.0.2 thành "đã phát hành". (b) BA: sổ tay mục 1.1 (bỏ B1–B6 khi SEC xác nhận; cách OWN nhập email); các chỗ "tới v1.0.3" của cách tạm giữ chỗ → v1.0.4. (c) UXD: dựng lại HTML sổ tay nếu chữ đổi. Mọi tài liệu trình INV theo brand guideline | PO; BA; UXD | Release notes → BA, DOM; sổ tay → DOM, ARC; HTML → PO | Không còn dòng nào hứa sai đích (bài học ĐK7 v1.0.2). Sổ tay ghi "áp dụng từ khi chủ đầu tư báo v1.0.3 đã lên" | Trước QC v1.0.3 (05/11 17:00) |

Không đưa vào v1.0.3 (đi v1.0.4, xem mục 4): BUG-R3-042, 043, 044, 041 + WA-04, ĐX-R3-QA-01, `leaseEndDate`, BUG-R4-015, FB-R4-ARC-BE-A-ED-02, PN-01 Minor, BUG-R4-017, mọi dòng "nên có" và P3.

---

## 3. Việc tồn từ QC v1.0.2 – phải xong trước QC v1.0.3

| # | Việc (trích `qc/v1.0.2-gate.md` mục 3) | Vai | Review | Hạn | Ghi chú lịch |
|---|---|---|---|---|---|
| **ĐK10** | Trên staging từ 06:00 ngày 04/11: B18 trả phòng sau B16 trên OTM-00378…00382 (minibar, hoàn tất, đúng 1 yêu cầu hoàn mỗi đơn, `balanceDue` 0); BR-428-02 (báo trong ngày rời) ở giờ thật. Kết quả vào bug-list. Lỗi tiền → P0/P1, hotfix theo protocol mục 9 | QA | QC đọc kết quả | **04/11, trước 10:00** | **Không deploy staging nào trước khi ĐK10 xong.** Có P0/P1 thì hotfix đi trước v1.0.3, ORC xếp lại lịch |
| **ĐK12a** | Review PR #25 (fixtures BR v0.5.1, oracle BR, nhãn cột BR) – đã trễ một lần (ĐK8a v1.0.1) | QA + BA; PO đọc phần nhãn BR so với backlog | – | **05/11, 12:00** | PO dành 04/11 chiều |
| **ĐK12b** | ARC review sau gộp PR #24 (`sensitive-number.ts`, `shared/log-line.ts` dùng chung cho form và worker), **hoặc** ghi decision-log rằng ARC giao cổng cho SEC + QA theo dòng 5 plan v1.0.1 | ARC | – | **05/11, 12:00** | Làm sau V3-01 |
| ĐK12c | SEC xác nhận lượt 2 PR26-01 (lệnh R4 có `MA THOAT`) ở `97938f9b` | SEC | – | 05/11, 12:00 | 15 phút |
| ĐK12d | ARC đổi FB-R4-ARC-BE-A-ED-01 sang Resolved | ARC | – | 05/11, 12:00 | 5 phút |

Chưa xong ĐK12 (a)–(b) thì QC v1.0.3 không xét. Khi đó ORC giao lại ngay và lùi QC, nhưng **không** lùi quá 07/11.

---

## 4. v1.0.4 – làm song song từ 04/11, phát hành riêng

**Đích: 08/11, chậm nhất 10/11.** Thứ tự ưu tiên trong v1.0.4: (1) nhóm giữ chỗ, (2) `leaseEndDate`, (3) giá hẹn, (4) phần còn lại nếu kịp. Không kịp thì sang v1.0.5. Luôn giữ các dòng hiển thị tiền.

| Mã | Việc | Vai | Review | Tiêu chí nghiệm thu (tóm tắt; chi tiết ở bug-list) | Phụ thuộc |
|---|---|---|---|---|---|
| **V4-01** | Hợp đồng nhóm giữ chỗ: BR-303 (1) cho giữ chỗ đã nhận > 0 đ (FD+ ghi thêm tiền và xác nhận sau hạn); `receivedAt` trên Desk; kind `hold_overdue_with_deposit`, `hold_overdue_cap`, `hold_expired` vào `staff_notification`; nguồn "Cần chú ý" `hold_overdue` / `hold_overdue_cap`; số migration so với LP-v2 0091 | ARC | BE-B, SEC | Mốc cuối khớp với DOM (G3). SEC-BE-22 được xem lại. Ghi rõ số migration | Bắt đầu 04/11 chiều, **sau** V3-01 |
| **V4-02** | **BUG-R3-042 (P1)**: hold đã nhận > 0 đ, quá hạn → FD+ ghi thêm tiền và xác nhận được; hold chưa cọc giữ quy tắc "tiền về trước hạn" (US-085 AC4) | BE-B; FE-A (ô **Giờ nhận tiền**, ẩn nút với hold chưa cọc đã quá hạn) | ARC, QA, SEC | Ca tái hiện trong bug-list: v1.0.4 trả 200, `confirmed`, **Nhận phòng** mở vào ngày đến. Ca phụ: hold chưa cọc, `receivedAt` trước hạn → 200; sau hạn → `HOLD_EXPIRED` | V4-01 |
| **V4-03** | **BUG-R3-043**: ô **Chấp nhận cọc thiếu – lý do** cho OWN/MGR (≥ 3 ký tự), FD/FDL/SAL không thấy | FE-A; UXD chữ | UXD, QA | Theo bug-list (API có sẵn, ARC xác nhận hợp đồng không đổi) | Đi cùng PR với V4-02 |
| **V4-04** | **BUG-R3-044**: khung đơn, câu `HOLD_EXPIRED`, hộp hủy hiện số sẽ hoàn với hold có cọc; VI + EN | FE-A; UXD chữ | UXD, QA | 3 chỗ trong bug-list mục "Mong đợi" | Đi cùng PR với V4-02 |
| **V4-05** | **BUG-R3-041 + WA-04 + ĐX-R3-QA-01**: thông báo J1 đi qua `events.notify` (hộp thư + SSE); "Cần chú ý" có mục đỏ `hold_overdue` mọi ngày đến, không tắt được bằng "Đã xử lý"; `hold_overdue_cap` cho MGR/OWN sau 12:00 ngày đến; khối Hôm nay đổi tên "Giữ chỗ chờ cọc (n)"; hold có yêu cầu giảm giá/FOC tự hủy được | BE-B; FE-A (đổi tên khối); DOM xác nhận người nhận (A.5) | ARC, QA, SEC (khuyến nghị) | AC 1–3 của ĐX-R3-QA-01. Người nhận đúng DOM A.5 | V4-01 |
| V4-06 | **QA nhóm giữ chỗ + DOM thử lại 3 lối ra** (xác nhận cọc, chấp nhận cọc thiếu, hủy hoàn) trước và sau hạn; điều kiện bỏ cách tạm DOM-09 | QA; DOM | QC | Staging không có đồng hồ giả: QA tạo hold ngắn nhất cho phép vào tối hôm trước rồi kiểm sau hạn, hoặc dùng stack thử có đồng hồ giả (QA chọn) | V4-02…05 |
| V4-07 | **`leaseEndDate`** (FB-R4-DOM-FE-A-01 phần còn lại + FB-R4-DOM-BE-A-04): DTO `manualLongStay.leaseEndDate`; hộp Trả sớm dùng trường này; nhật ký chọn BR-313/BR-428 theo ngày kết thúc HĐ; chữ `lease_rule_paid` thêm "phát sinh chưa thu" | ARC → BE-A → FE-A; UXD/CPY chữ | ARC, QA, UXD, DOM | DOM đóng FB-01. Hết giới hạn "HĐ đã gia hạn" trong release notes v1.0.2 | BE-A/FE-A rảnh sau 032 (05/11) |
| V4-08 | **BUG-R4-015 + FB-R4-ARC-BE-A-ED-02**: hủy dòng giá đầu của căn có `activeFrom` tương lai → 409; trigger DB chặn xóa dòng đã áp dụng (SEC quyết có cần không) | BE-A; ARC (mã lỗi); FE-A (chữ) | ARC, QA, SEC | Các bước 1–4 của lỗi, bước 4 phải trả 409 | Sau V4-07 |
| V4-09 | PN-01 Minor (FB-R4-ARC-BE-PR29-01/02/S1/S2, FB-R4-SEC-BE-PN01-01/02/03) + `ops-check` kiểm 2 trigger | BE-D; OPS | ARC, SEC | Như backlog 5.6 | Cùng migration kế tiếp; muộn nhất trước lần đổi version thông báo của LP-v2 |
| V4-10 *(nếu kịp)* | Hiển thị tiền P3: BUG-R2-216, 219, 103, 097; rồi BUG-R3-046, 052, 053, BUG-R4-017, BUG-R3-045, 024 và các dòng "v1.0.3 nếu kịp" cũ | FE-A, FE-B, MOB, BE-A theo bug-list | Theo ma trận | Theo bug-list | Không được làm trễ V4-02…05 |

---

## 5. Lịch dự kiến

| Ngày | Giờ | Việc | Vai |
|---|---|---|---|
| **03/11 (T3)** | tối | Kế hoạch này; ARC soạn tech plan + nháp hợp đồng V3-01/V3-09; OPS bắt đầu runbook V3-05; SEC bắt đầu chữ V3-08 | PO, ARC, OPS, SEC |
| **04/11 (T4)** | 06:00–10:00 | **ĐK10** trên staging | QA |
| | 08:00–10:00 | Chốt V3-01: BE-A + SEC đọc và đồng ý | ARC, BE-A, SEC |
| | 10:00–18:00 | Code V3-02, V3-03 (+ V3-04 nếu kịp); UXD đặt chữ Desk; ĐK12b/d (ARC), ĐK12c (SEC) | BE-A, FE-A, UXD, ARC, SEC |
| | chiều | ĐK12a (review PR #25); ARC bắt đầu V4-01, BE-B bắt đầu V4-02/V4-05; CPY dịch V3-08 vi/en/ru | QA, BA, PO; ARC, BE-B; CPY |
| **05/11 (T5)** | 08:00–11:30 | Review PR 032: ARC, SEC, QA lượt 1 trên stack thử; UXD + QA cho Desk; toa phụ: SEC → ARC, UXD, QA | ARC, SEC, QA, UXD |
| | **12:00** | **Giờ cắt v1.0.3.** ORC gộp PR đủ điều kiện; CI `main` xanh | ORC |
| | 13:00 | **INV duyệt deploy staging** | INV, ORC |
| | 13:30–16:30 | QA lượt 2 trên staging (V3-06) + smoke | QA |
| | 17:00–18:30 | **QC rút gọn v1.0.3** (cần ĐK10, ĐK12 xong) | QC |
| **06/11 (T6)** | 08:30–10:30 | Production: sao lưu, tag, **INV duyệt Release**, K-check theo runbook | ORC, OPS, INV |
| | sau K-check | **INV tự nhập email trên Desk** (S2) → thư `email_changed` tới → INV báo "đã nhận"; OWN nhập email cho tài khoản quản lý (nếu có); OPS bật `EMAIL_NO_RECIPIENT_ALERT=1`. Nếu có toa phụ: OWN đặt version thông báo bản 2, SEC kiểm | INV, OPS, SEC |
| | cả ngày | v1.0.4: FE-A làm V4-03/04/02 (FE); QA tạo hold cho V4-06 vào buổi tối | FE-A, QA |
| **07/11 (T7)** | sáng | `email_dead` = 0 sau 24 giờ → SEC ghi bỏ B1–B6 (V3-07). Dự phòng sửa lỗi v1.0.3 | SEC |
| | cả ngày | QA + DOM thử nhóm giữ chỗ sau hạn (V4-06); QC v1.0.4 | QA, DOM, QC |
| **08/11 (CN)** | sáng | **Đích v1.0.4** (INV duyệt Release) | ORC, OPS, INV |
| | **18:00** | **Mốc báo động:** v1.0.3 chưa lên production thì SEC soạn ESC theo ESC-040 (chấp nhận rủi ro thêm / hoãn mở QR) để INV quyết trước 09/11 | SEC, ORC |
| **09/11 (T2)** | – | **Hạn cứng BUG-R3-032** | – |
| **10/11 (T3)** | – | Hạn muộn nhất của v1.0.4 | – |

Sau mỗi bước, ORC commit theo dạng `round-4: <bước> – <tóm tắt>`. Kế hoạch này chưa commit.

---

## 6. Việc của INV

### 6.1 Câu hỏi cần INV quyết
**Không có câu hỏi mới.** Phạm vi và thứ tự bản vá thuộc quyền PO. Thời điểm lên production vẫn do INV duyệt từng lần như v1.0.1 và v1.0.2.

### 6.2 INV cần tự làm (không phải quyết định)
1. Duyệt deploy staging (05/11 khoảng 13:00) và duyệt Release production (06/11 sáng).
2. Sau khi v1.0.3 lên: vào Desk → **Tài khoản của tôi**, nhập **hộp thư riêng** (không dùng `info@ottimo.vn`), xác nhận bằng mật khẩu và mã 2 bước. Mở hộp thư, thấy thư xác nhận từ OTTIMO thì báo đội "đã nhận". **Không dán địa chỉ email vào chat.** Đội không ghi địa chỉ vào repo hay tài liệu. Trên Desk, email luôn hiện ở dạng đã che.
3. Nếu OPS cần gửi thư thử trên máy chủ, INV tự gõ địa chỉ tại **dấu nhắc ẩn** (như lúc dán webhook ở v1.0.1).
4. Nếu toa phụ lên: đặt version thông báo bản 2 trên Desk theo hướng dẫn của đội. Chờ đội báo "mở lại check-in online" rồi mới gửi link cho khách.
5. Tiếp tục lượt kiểm B1–B6 mỗi sáng **tới khi SEC báo bỏ** (dự kiến 07/11), không bỏ ngay ngày 06/11.

### 6.3 Báo INV qua tổng kết (ORC) – khung ESC dự phòng
- **Nội dung báo:** v1.0.3 tập trung vào thư báo bảo mật để chắc kịp 09/11. Các sửa lỗi giữ chỗ quá hạn (ghi thêm cọc và xác nhận sau hạn, ô chấp nhận cọc thiếu, báo vào **Cần chú ý**, chữ đúng cho giữ chỗ có cọc) lên ở v1.0.4, dự kiến 08/11, chậm nhất 10/11, thay cho mốc "dự kiến 07/11". Cách làm tạm hiện nay giữ nguyên tới lúc đó.
- **Nếu ORC thấy cần ESC** (dời mốc phát hành): đề xuất `ESC-049 – Tách sửa lỗi giữ chỗ quá hạn sang v1.0.4`. Mức Bình thường, không chặn việc. PA A tách (đề xuất, như kế hoạch này); PA B gom vào v1.0.3 (production 07–08/11, chỉ còn 0–1 ngày dự phòng trước 09/11, một lỗi ở phần giữ chỗ sẽ chặn luôn thư báo bảo mật). Chưa quyết thì đội làm theo A. Hạn trả lời 05/11 12:00 (giờ cắt). PO **chưa tạo** tệp ESC này.

---

## 7. Rủi ro

| # | Rủi ro | Mức | Xử lý |
|---|---|---|---|
| R1 | Thư thật chỉ chứng minh được trên production: staging dùng `EMAIL_PROVIDER=mock`. Thư thử 8b (B2) mới chứng minh đường gửi tới `info@ottimo.vn`, chưa chứng minh tới hộp thư ngoài tên miền | Trung bình | OPS kiểm cấu hình SMTP relay Google Workspace có cho gửi tới địa chỉ ngoài tên miền (V3-05). Thư `email_changed` lúc INV nhập email chính là lượt kiểm trọn vòng. Thư không tới thì quay về B1–B6, OPS điều tra; **không** quay lui app vì lỗi này |
| R2 | ĐK10 ra lỗi tiền (P0/P1) trên B18 sau B16 | Trung bình | Hotfix đi trước v1.0.3. ORC dời lịch mục 5 nhưng giữ mốc 08/11 18:00 |
| R3 | ARC là điểm nghẽn (V3-01, V3-09, ĐK12b/d, V4-01, LP-v2) | Cao | Thứ tự cứng: V3-01 → ĐK12b/d → V4-01. LP-v2 chờ sau tag v1.0.3 |
| R4 | FE-A là điểm nghẽn (V3-03 rồi V4-02/03/04/05/07) | Trung bình | V3-03 trước. v1.0.4 cắt từ cuối bảng mục 4 nếu thiếu người |
| R5 | Nhân viên chưa có email → thư cho họ (ví dụ `mfa_reset_by_operator`) vẫn `dead NO_RECIPIENT`. Bật `EMAIL_NO_RECIPIENT_ALERT` sẽ báo động giả | Trung bình | ARC/SEC định cách xử lý trong V3-01 (G1). OPS chỉ bật cảnh báo khi quy tắc này đã có |
| R6 | Migration của v1.0.4 trùng số với LP-v2 (0091) | Trung bình | ARC chốt thứ tự gộp trong tech plan; luật journal (decision-log 30/10) |
| R7 | Kẻ chiếm phiên đổi email để tắt báo động | Thấp sau khi sửa | Bắt buộc S2, thư tới cả địa chỉ cũ, thông báo cho mọi OWN (SEC 1.5 ý 2) |
| R8 | v1.0.3 có migration ngoài dự kiến | Thấp | Nguyên tắc 1.3 ý 5: runbook có mục quay lui, diễn tập trên staging |

---

## 8. Giả định

- **G1** `[GIẢ ĐỊNH – chờ SEC/ARC xác nhận trong V3-01]`: email **bắt buộc** cho tài khoản OWN, và cho MGR nếu có tài khoản quản lý riêng. Với nhân viên khác, email **tùy chọn**. Thư bảo mật về tài khoản nhân viên chưa có email gửi tới OWN, hoặc ghi trạng thái riêng không tính vào `email_dead`, do ARC và SEC chọn. Thêm email cá nhân của nhân viên là dữ liệu cá nhân, nên không bắt buộc khi chưa cần.
- **G2:** thư `dead NO_RECIPIENT` sinh ra trước v1.0.3 không gửi lại. Lượt kiểm B1–B6 đã phủ khoảng thời gian đó.
- **G3** (cho v1.0.4): mốc xử lý giữ chỗ đã có cọc mà quá hạn là **tới khi nhận phòng** (DOM A.6). MGR/OWN nhận `hold_overdue_cap` sau 12:00 ngày đến. DOM sửa chữ BR-303 cho khớp trước khi BE-B code (bug-list BUG-R3-042 "Mong đợi").
- **G4:** INV chưa vận hành (decision-log 01/11), nên deploy được bất cứ giờ nào INV duyệt.
- **G5:** v1.0.3 không cần migration (cột `app_user.email` đã có). ARC xác nhận.
- **G6:** LP-v2 gộp `main` sau tag v1.0.3.
- **G7:** "Dự kiến 07/11" trong release notes là mốc dự kiến, chưa phải cam kết với INV như hạn 09/11 của ESC-040. Vì vậy tách nhóm giữ chỗ sang v1.0.4 không cần ESC (mục 6.3).
