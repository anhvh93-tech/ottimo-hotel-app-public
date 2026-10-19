# Cổng QC Sprint 4 – Round 2 (bản chính thức)

- Người chấm: QC | Nháp 18/10/2026 18:00–18:40 → **chính thức 19/10/2026** sau ba bộ phản biện (36 ý, mục 3) | Round 2, Sprint 4, tuần Ổn định | Bước 6 – Cổng chất lượng.
- Đọc lại theo ma trận: ORC (bắt buộc), PO (khuyến nghị).
- Căn cứ chấm: `sprint-4-plan.md` mục 3 (M1–M8), 11.1 (G1–G8), 11.2 (quyết định, quy tắc lùi cổng D8), 12.3 (thứ tự cắt), 16 (thay đổi sau đóng băng). QC **không đổi quy tắc cổng**; chỗ nào quy tắc chưa đạt thì ghi là chưa đạt và chỉ đường gỡ hợp lệ.
- Ký hiệu: **Đạt** · **Đạt có ĐK** (đạt về nội dung, còn việc nêu ở mục 6) · **Chưa** (thiếu so với chữ của tiêu chí) · **KAD** (không áp dụng ở cổng này).

## Commit chấm và bằng chứng CI (sau khi chuyển repo công khai)

Ngày 19/10 INV chuyển sang repo công khai MỚI `anhvh93-tech/ottimo-hotel-app-public`, lịch sử đã làm sạch nên **mã commit đổi**. Commit cũ vẫn còn trong bản sao cục bộ, QC đối chiếu:

| Commit cũ (repo riêng tư) | Commit mới (repo công khai) | Khác nhau (QC kiểm `git diff`) |
|---|---|---|
| `d527f9c` (gộp #20, mã 207) | `23b0c7f` | 5 tệp tài liệu đã làm sạch (`ebrochure-text.md`, `investor-brief.md`, `smart-lock.md`, decision-log); 0 tệp mã |
| `0dcf8e1` (gộp #21, chỉ test/tài liệu) | `aa0cfd6` | như trên |
| – | `2a6d61f` | `aa0cfd6` + sửa ca TC-L2-079 (test) + ESC-025 + decision-log |
| – | `9cd7747` (HEAD) | `2a6d61f` + 1 dòng decision-log |

- **Commit chấm: `2a6d61f`** (mã chạy = `23b0c7f` = `d527f9c`; `git diff 23b0c7f 9cd7747 -- services/api/src apps infra packages` chỉ còn chú thích trong `api-client/src/generated/openapi.ts`).
- **CI run 39244841718 trên `2a6d61f`: xanh 8/8** (GHCR, staging bỏ qua theo thiết kế), attempt 1. QC tự tải log:
  - build-test: API **103 tệp / 2.960 ca đạt**, 2 bỏ qua; có `test/integration/s438-r8/r8ver-01.test.ts` (5 ca) và `r8debt-01.test.ts` (3 ca) ✓; `pnpm audit --audit-level=high` → "3 moderate", 0 high;
  - E2E: `Running 2037 tests`, **1.968 đạt**, 69 bỏ qua, **0 dòng `retry #`**, 0 ✘; TC-L4-153 bản mới (A+2 09:00, `debt-collect.s5.clock.spec.ts:579`) ✓ #1886; A1 TC-X-070/071 ✓ #2005–2006, A4 TC-X-072 ✓ #2007; bước kiểm `WRITES` 11 ca qua;
  - gitleaks: **141 commit (toàn lịch sử repo mới), "no leaks found"**; Redocly, API contract `--strict`, shellcheck, landing xanh.
- Run 39246910142 trên `9cd7747` (chỉ decision-log): xanh.
- Run 39242291018 trên `229eaf3`: đỏ – TC-L2-079 (ngày "thường" today+60 rơi đúng 24/12, ngày đặc biệt) → 422 `MIN_STAY_NOT_MET`, cả lượt chạy lại. Lỗi dữ liệu ca kiểm theo ngày, không phải lỗi mã; sửa ở `2a6d61f`. Ghi thành bài học (C10).
- Lượt T9 hằng đêm: lượt lịch gần nhất (repo cũ, run 39159721535, `0dcf8e1`, 19/10 02:38) **failure – không job nào khởi động (thanh toán)**. Repo mới **chưa có lượt T9 nào** (lịch 19:17 UTC chưa tới; chưa ai chạy `workflow_dispatch t9`).
- QC tự chạy (chỉ đọc) trên HEAD: `gen_traceability.py --strict` → **exit 0** (71/71 story Must R2, AC 254/254, RBAC lệch 0).
- QC không chạy stack, không đi luồng bằng tay, không chạy lại bộ tái hiện tiền, không đụng stack demo, không in tệp env.

---

## 1. Quyết định

**KHÔNG ĐẠT** (chấm lại rút gọn sau khi xong 11 việc K1–K11 ở mục 5).

Lý do (1 câu): tiền (G1) và luồng chính đã đạt không ngoại lệ, nhưng cả ba dòng mềm G3, G6, G8 đều thiếu (11.2 chỉ cho thiếu ≤ 2), và nhóm cứng còn ba chỗ chưa đạt theo chữ: G2.2 (7/8 Major SEC-G3), G5.2 (chưa có lượt T9 xanh trên mã đang chấm), G7 (sổ lỗi chưa khớp – quy tắc Cứng của chính QC).

Đọc kỹ để không hiểu sai:
- **Không có tình huống KHÔNG ĐẠT nào trong bốn tình huống ở mục 3 của kế hoạch.** Không còn lỗi sai tiền P0/P1 Open. Cổng trượt vì thiếu việc review, thủ tục và vài ca kiểm, **không vì tiền**.
- Phần lớn việc phải làm là ghi Verified, đưa việc dời vào backlog, thêm ca axe, chạy lại hai lượt kiểm. Việc mã duy nhất là BE-65 (hạn lưu ảnh – không chạm tiền) nếu chọn đường gỡ (a) ở K1.
- Bản nháp 18/10 ghi ĐẠT CÓ ĐIỀU KIỆN. QC đổi vì phản biện đúng ở 3 chỗ quyết định: G6.1 (C-CH-01), G8.2 (C-CH-02), G3.3 (B-CH-10); và vì nháp đã tự nới quy tắc ở G2.2 (B-CH-01), G5.2 (A-CH-07, C-CH-04), G7 (A-CH-03).
- Tốt hơn so với nháp: điều kiện cứng C1 cũ ("CI #21 xanh, 0 retry, `s438-r8` xanh") **đã đạt** nhờ run 39244841718, nên G1.4, G1.5, G5.1 nay Đạt.

---

## 2. Bảng kiểm G1–G8

| # | Tiêu chí | Bằng chứng | Kết quả |
|---|---|---|---|
| G1.1 | BUG-R2-055…061, 038 Closed | `qa/bug-list.md` dòng 1480–1487; bảng tổng: P0 Open 0, P1 Open 0; lượt kiểm 8: 109…200 "0 hồi quy" (`s4-money-recheck8.md` dòng 60) | **Đạt** |
| G1.2 | S4-06, 08, 13, 23 (thứ tự), 35; #6 `expectedVersion` BE + Desk | `qa/s4-test-report.md` 7.2 dòng 258–281; #6: TC-NT-050 (API), **TC-NT-052 (E)** Desk ✓ (sửa dẫn chứng theo A-CH-12; TC-L2-097 là ca S4-21) | **Đạt** |
| G1.3 | US-024 AC5–AC7, xem trước = lệnh ghi | TC-L2-097 (a)–(d) bấm thật ✓; BR-434-06/09 qua xem trước rồi ghi ✓; fuzz 0 lệch / 37.966 phép so (`s4-money-recheck8.md` dòng 16, 38–41) | **Đạt** |
| G1.4 | Mỗi mục có test oracle, CI xanh | `validate-fixtures` 0 lỗi; BR-525-28 gỡ `pendingFix`; ca oracle của 207 (`s438-r8` 8/8) và TC-L4-153 bản mới **chạy xanh trên GitHub** (run 39244841718). `pendingFix` còn lại đều thuộc mục đã dời (A-CH-04) | **Đạt** |
| G1.5 | Kiểm chứng đối kháng 0 ca lệch tiền | Lượt 8: 0 Major; 207 sửa đúng chỉ định (`checkout.service.ts:456–467`, một điều kiện `NOT EXISTS … reversal_of_id`); QA 88/88 trên DB mới; CI công khai xanh gồm `s438-r8`. **Ghi đúng lại (A-CH-02):** 208, 209 lệch về phía thấp hoặc thiếu nhật ký; **210 có lệch tiền** (công nợ tính thấp → OWN duyệt có thể tự hủy `debt_cleared` khi khách còn nợ) nhưng chỉ trên dữ liệu nợ ghi trước 0076; OPS xác nhận không môi trường nào mang dữ liệu đó (`outputs/OPS/s4-env-0076.md`, decision-log 18/10 OPS). "0 ca lệch" = 0 ca đã biết trên mọi môi trường đích; khoảng hở chưa thử ở mục 7 | **Đạt** (giữ bằng C2) |
| G1.6 | S4-37, S4-47 | decision-log 740, 753 | **Đạt** |
| G2.1 | S4-39 / 085 SEC Verified | `s3-SEC.md` 10.1 dòng 722–744; C.10 chạy lại 53/53 sau sửa ở `8073a3d`; CI ✓ `registration-party-removal` (B-CH-05) | **Đạt** |
| G2.2 | SEC-G3: **8** Major Verified | `s3-SEC.md` 10.2–10.3: **7/8**. BE-38 điểm 2 hồi quy ở S4, chuyển BE-65 (Open; `work-orders.service.ts:599–607`, `housekeeping.service.ts:1211–1219` gọi `bindTo` không có mốc). SEC tự chấm "ĐẠT CÓ ĐIỀU KIỆN" (`s4-SEC.md` dòng 24). ORC 794 chấp nhận dời thẻ, nhưng mục 16 không đổi tiêu chí G2 | **Chưa** (K1) |
| G2.3 | S4-17 bằng test cục bộ | `s4-SEC.md` mục A; `upload-gate-socket.test.ts` 12/12 ✓ | **Đạt** |
| G2.4 | Review SEC cho PWA, guest-web, SSE, nhóm D | `s4-SEC.md` mục C, C.10, C.13. Còn hai việc thủ tục: BE-73 Verified trên cây chưa commit, chưa kiểm lại trên commit gộp (B-CH-03); 8073a3d đổi cổng mở snapshot PWA khi 502/503/504, chưa có dòng SEC (B-CH-04) | **Đạt có ĐK** (K6, C5) |
| G2.5 | Không Critical/High Open | Không thẻ Critical/High nào Open (`s4-SEC.md` dòng 19–44, C.13). SEC đánh giá khi repo **riêng tư**; nay repo công khai, tệp review công bố cách lách của 5 Major chưa sửa (BE-65, 74, 75, 79, 83) – SEC chưa đánh giá lại (B-CH-02) | **Đạt có ĐK** (K11) |
| G3.1 | ĐK-S3-5 đủ Verified (SEC, DOM, ARC, UXD) | DOM 10/10; UXD 13/13; ARC 19 Verified + S3-16 dời; **S3-15 vẫn "Mở lại"** (`s3-ARC.md` dòng 272) dù mã đã sửa (`stay-support.ts:592`, B-CH-11); SEC: BE-38 mở lại (G2.2); ARC phần "BE 9b/9c" chưa có bằng chứng (B-CH-12). Mọi dòng Verified ghi trên `7ac11a4` (B-CH-13, giả định mục 8) | **Chưa** (K1, K6, K7) |
| G3.2 | Blocker/Major review S4 xử lý hoặc dời có lý do | `s4-UXD.md`: **FE-S4-01 (Blocker, tiền) và FE-S4-02 (Major) vẫn "Open"** (dòng 21–35; tác giả Done ở `responses/s4-FE.md` 28–29) – nháp ghi sai (B-CH-08). ARC: 7 Major `s4-ARC.md` + **BE-S4-16** (`openapi-0.3.7.md` dòng 1205–1211, Open) chưa Verified. Mục dời (208–210, SEC-BE-83, ARC BE-S4-17/18/19, S3-16, S3-15 (e), S4-03/09 đọc chéo, N-11, SEC-BE-82) **không có dòng backlog** (grep `backlog.md`: 0; B-CH-09, A-CH-04). SEC Major S4 thiếu dòng "Deferred" của tác giả (B-CH-07) | **Chưa** (K6, K10) |
| G3.3 | Review ARC mã mới Sprint 4 | `s4-ARC.md` chỉ phủ housekeeping + EP14. **Không có review ARC cho mã registration của BE-C**: `removePartyMember` + `guestUploadPersonIndex` (S4-39), migration 0070 (BE-73), đọc `reservation_guest` của BUG-205 – kế hoạch ghi bắt buộc (`sprint-4-plan.md` dòng 376; B-CH-10) | **Chưa** (K7) |
| G4.1 | A1 liền mạch có PWA, bấm thật | ✓ #2005–2006 run 39244841718; trong `WRITES`; không `test.fail` giữa chuỗi; `OPEN = {}` (C-CH-07) | **Đạt** |
| G4.2 | A4 xanh | ✓ #2007; trong `WRITES` | **Đạt** |
| G4.3 | BUG-064 Closed | `bug-list.md` dòng 1695 | **Đạt** |
| G4.4 | A7 khớp số DATA trên DS-0 | 114/114 chạy 18/10 09:36/09:44 trên **cây chưa commit**; DATA tự ghi điều kiện chạy lại trên commit gộp (`s4-a7-reconciliation.md` 8.2). Sau đó 5 commit mã đổi đúng nguồn "Cần chú ý" (`cc02fba` thêm `checkout_debt`, `316b9ac` đổi luật FOC). Chưa ai chạy lại (C-CH-03). Nhóm cứng | **Chưa** (K4) |
| G5.1 | CI xanh trên commit chấm (api, E2E 0 retry, `WRITES`, contract, lint, gitleaks, audit 0 high) | Run 39244841718 trên `2a6d61f`: đủ mọi mục (phần đầu). Thay điều kiện C1 của nháp | **Đạt** |
| G5.2 | Lượt T9 hằng đêm gần nhất xanh | Lượt lịch gần nhất (39159721535) **failure** (thanh toán); lượt T9 xanh duy nhất (39089102345, `2b134fb`) đi trước 6 commit mã và trước khi có tệp ca axe `gate-s4` (thêm ở `8073a3d`). Repo mới chưa có lượt T9 (A-CH-07, C-CH-04) | **Chưa** (K2) |
| G5.3 | Contract-ahead không tính lệch | `openapi.yaml` ghi rõ phần chưa cài (208/N-15) | **Đạt** |
| G6.1 | 71 story ≥ "Đang nghiệm thu"; **không phần Must R2 nào "chưa làm"** | 36 Đạt + 35 Đang nghiệm thu = 71 (QC đếm). Nhưng US-012 AC7 "Đồng bộ kênh lỗi" và US-031 AC1 thông báo J4 **chưa làm, dời thẳng R3** (`s4-acceptance.md` dòng 115, 238) bằng quyết định PO (decision-log 786, 787). 11.2 và 12.3 bước 7 chỉ cho "chuyển sang Ổn định (không sang R3)", **ORC ghi decision-log** – chưa có dòng ORC. Nháp tự coi đây là "quyền PO" – sai, QC rút lại (C-CH-01) | **Chưa** (K9) |
| G6.2 | PO ghi kết quả S4 ở `s4-acceptance.md` | Có tệp (dòng 39–58). Số 50/32/2/2 lập trên `7ac11a4`, đã cũ (US-066 AC2 minibar đổi mã ở vòng 6–7; US-024 AC4, US-139 AC3 nay có ca xanh – C-CH-06) | **Đạt** (C4: chấm lại trước tổng kết) |
| G7.1 | 0 P0/P1 Open | Nội dung đạt: 181, 187 đã gộp, ca hồi quy xanh (A-CH-13). Sổ còn ghi "Fixed – chờ gộp + CI" | **Đạt có ĐK** (K5) |
| G7.2 | P2 Open có kế hoạch | 10 P2 Open đều có hướng xử lý, nhưng: 184–186 sổ ghi "Open – đang sửa (chưa gộp)" trong khi đã gộp ở `8073a3d`; 186 có phần đọc chéo dời R3 nên không đóng trọn được; 208/209 chỉ có kế hoạch ở decision-log, không có dòng backlog; thẻ `pendingFix` "R3-SEC-BE-83" trỏ tới mục R3-Q không tồn tại. Bảng sẵn sàng của QC xếp việc rà sổ (a8) là **Cứng** (`s4-gate-readiness.md` dòng 144, 156) – QC không tự hạ (A-CH-03, A-CH-04) | **Chưa** (K5, K10) |
| G8.1 | Token DS v0.4, font tự host | `@fontsource` 5.2.8; 0 yêu cầu Google Fonts trong mã app (C-CH-09) | **Đạt** |
| G8.2 | AA; axe 0 nghiêm trọng **trên mọi màn** | Có scan cho H19, H21, H22, H23, H24, S10, S11, S30, H03, H15-folio-adjust/reverse-payment, H16-debt. **Không có scan cho H20** (màn chính buồng phòng: căn, kiểm phòng 12 mục, "không muốn dọn", toast hoàn tác) – QC grep `ui/`, `ui-clock/`: 0. Không có hộp H15 Gia hạn/Đổi phòng, H16 bước 2–3 (UXD ghi "chưa đo", `s4-UXD-brand.md` dòng 86). BUG-R2-193 (axe `target-size` serious, H23) còn Open; ca CI H23 cuộn trước khi scan (C-CH-02) | **Chưa** (K8) |
| G8.3 | Màu ngoài bảng chỉ còn ngoại lệ UXD | UXD ký (mục G, G.1); điều kiện "`btn icon-btn` ở 3 chỗ" đúng trên HEAD; 0 HEX/rgb mới sau lượt ký (C-CH-09) | **Đạt** |
| G8.4 | Logo vector | INV chưa gửi SVG; NÊN-ÔĐ. Theo 12.3 bước 7 phải có dòng ORC (chiếm 1 trong 3 suất) – gộp vào K9 | **KAD** |

**Theo dòng G (11.1):** G1 Đạt · G2 **Chưa** (G2.2) · G3 **Chưa** · G4 **Chưa** (G4.4) · G5 **Chưa** (G5.2) · G6 **Chưa** (G6.1) · G7 **Chưa** (thủ tục Cứng) · G8 **Chưa** (G8.2).
→ Nhóm cứng (G1, G2, G4, G5, G7): 4/5 chưa đạt theo chữ. Nhóm mềm: thiếu cả 3 dòng G3, G6, G8 (đếm theo ý con: 6 ý). Theo 11.2 → **KHÔNG ĐẠT**.

## 2b. Việc bắt buộc M1–M8 và bốn tình huống

| # | Kết quả | Ghi chú |
|---|---|---|
| M1 Lỗi tiền | **Đạt có ĐK** | Nội dung = G1 Đạt. Quy tắc D8 chưa đủ: decision-log 735 ghi lùi cổng nhưng **không có ngày chấm mới** (A-CH-05) → C6 |
| M2 S4-21 + S4-04 | **Đạt** | = G1.3 |
| M3 BUG-085 / S4-39 | **Đạt** | = G2.1; 085 Closed dòng 1491 |
| M4 BUG-038 | **Đạt** | dòng 1487; `OPEN = {}` |
| M5 ĐK-S3-5 Verified | **Chưa** | = G3.1: ARC S3-15 + "BE 9b/9c"; SEC BE-38 (B-CH-12) |
| M6 A1 trong `WRITES` | **Đạt** | = G4.1, G4.3 |
| M7 Mỗi AC có ca; PO ghi | **Đạt** | trace `--strict` exit 0 (HEAD); lưu ý trace đo "có ca", không đo "phủ trọn AC" (C-CH-08) |
| M8 Thương hiệu, BR-012 | **Chưa** | "axe không lỗi nghiêm trọng trên mọi màn" chưa chứng minh (= G8.2); phần màu, font, BR-012 (`CheckOutPage.tsx:1623`) đạt |
| T1 057/058 chưa sửa | Không xảy ra | Closed `6f8d429` |
| T2 S4-25 trước S4-02/18 | Không xảy ra | gộp `2442d26` sau 056/059/061 Closed |
| T3 S4-39 chưa SEC Verified | Không xảy ra | `s3-SEC.md` 10.1 |
| T4 Sai tiền P0/P1 Open | Không xảy ra | P0/P1 Open = 0. Lưu ý: T4 đứng vững nhờ cách xếp 207 (và tiền lệ 200) ở P2, trong khi `test-strategy.md` mục 8 mặc định lỗi tiền là P0 (A-CH-09) → C1 |

---

## 3. Phản biện đã xử lý

Ba bộ phản biện trùng số thứ tự nên QC đánh tiền tố: **A** = bộ tiền/QA/CI; **B** = bộ SEC/ARC/review; **C** = bộ PO/CI/thương hiệu. "Chấp nhận" = QC tự kiểm lại bằng tệp/lệnh và thấy đúng.

| ID | Mức | Kết luận | QC kiểm gì / xử lý |
|---|---|---|---|
| A-CH-01 | condition | **Chấp nhận, nay đã gỡ** | Đúng lúc nháp: CI #20 không có `s438-r8`, TC-L4-153 bản cũ. Run 39244841718 (`2a6d61f`) có `r8ver-01` 5 ✓, `r8debt-01` 3 ✓, TC-L4-153 bản 09:00 ✓ → G1.4, G1.5 Đạt; 207 đóng được (K5) |
| A-CH-02 | condition | **Chấp nhận** | 210 có lệch tiền trên dữ liệu trước 0076 (`s4-money-recheck8.md` dòng 98; decision-log OPS 18/10). Sửa câu G1.5 và câu trình INV; thêm C2 giữ thủ tục OPS tới khi 210 sửa |
| A-CH-03 | condition | **Chấp nhận** | `s4-gate-readiness.md` dòng 144, 156 xếp a8 là Cứng; sổ dòng 218–224, 244 cũ. QC không tự đổi Cứng → Mềm. G7 Chưa → K5 (tách 186) |
| A-CH-04 | condition | **Chấp nhận** | grep backlog: 0 dòng cho 208/209/210/SEC-BE-83/BE-S4-17…19; R3-Q17 chỉ BE-65/74/75/79. K10 gắn vào G7.2 và làm **trước** chấm lại; thêm fuzz công nợ (QA, trước bản dùng thử) |
| A-CH-05 | condition | **Chấp nhận** | decision-log 735 không có ngày chấm mới. M1 Đạt có ĐK → C6 |
| A-CH-06 | condition | **Chấp nhận** | BUG-123 (`move-preview`, B7a) là đường xem trước tiền. Bỏ V3 cũ; đưa 123 vào C1 (không sửa trước khi chấm lại; gộp lượt kiểm tiền R3) |
| A-CH-07 | condition | **Chấp nhận** | `gh run list` repo cũ: 39159721535 schedule `0dcf8e1` failure. Repo mới chưa có T9. G5.2 Chưa → K2 |
| A-CH-08 | note | **Chấp nhận** | Log gốc QA (ngoài repo, scratchpad của phiên QA `qa-s4/c1-207/`): TC-L4-153 đỏ lượt 1, QA sửa ca + oracle BR-525-16 rồi xanh; lý do khớp J15 đóng đúng +24 giờ. Thêm C3: DOM xác nhận số BR-525-16 (trong cửa sổ trần 100.000; hết cửa sổ 120.000) |
| A-CH-09 | note | **Chấp nhận** | `test-strategy.md` dòng 235, 240. Không đổi kết luận T4 (207 đã sửa). C1: lượt kiểm tiền R3 xếp mức theo mục 8; bản trình INV không gọi lỗi lệch tiền là "nhỏ" |
| A-CH-10 | note | **Chấp nhận** | Thêm khoảng hở vào mục 7 và vào đề bài lượt kiểm tiền R3 (C1) |
| A-CH-11 | note | **Chấp nhận, đã cũ** | ESC-025 đã quyết và đóng 19/10 (decision-log INV, ORC). Bỏ mọi đề xuất A/B/C khỏi bản chính thức |
| A-CH-12 | claim-holds | Giữ | Sửa dẫn chứng #6 Desk = TC-NT-052 |
| A-CH-13 | claim-holds | Giữ | – |
| B-CH-01 | condition | **Chấp nhận** | `s4-SEC.md` dòng 24 (SEC tự chấm ĐCĐK), dòng 229–245 (BE-65 Open, "sửa trong round"); mục 16 không đổi G2. G2.2 Chưa → K1. Không coi ORC 794 là đổi tiêu chí |
| B-CH-02 | condition | **Chấp nhận** | Repo đã công khai (`gh repo view`: PUBLIC); `ci.yml:14` `pull_request`, `:709–716` `environment: staging` + `secrets.STAGING_SSH_KEY`. ORC 19/10 đã bật quét bí mật, bảo vệ `main`, duyệt CI người ngoài, nhưng không có dòng SEC. → K11 (SEC đánh giá lại G2.5 sau khi công khai) |
| B-CH-03 | note | **Chấp nhận** | `s4-SEC.md` dòng 31, 317, 392. Gộp K6 |
| B-CH-04 | note | **Chấp nhận** | `apps/mobile/src/app/api.ts` `unreachable()` gồm 502/503/504. → C5 |
| B-CH-05 | claim-holds | Giữ | – |
| B-CH-06 | claim-holds | Giữ | – |
| B-CH-07 | claim-holds | Giữ, thêm việc | Tác giả ghi "Deferred" cho SEC Major S4 trong `responses/` (K10) |
| B-CH-08 | condition | **Chấp nhận** | `s4-UXD.md` dòng 21–35 Open; `openapi-0.3.7.md` dòng 1205–1211 Open. Câu nháp ở G3.2 sai – đã sửa. → K6 |
| B-CH-09 | condition | **Chấp nhận** | `s3-ARC.md` dòng 272, 289; grep backlog 0. → K10 |
| B-CH-10 | condition | **Chấp nhận** | `s4-ARC.md` dòng 4–6 (phạm vi); grep `removePartyMember|guestUploadPersonIndex` trong `reviews/*ARC*`: chỉ có dòng hợp đồng, không có review mã. G3.3 Chưa → K7 |
| B-CH-11 | claim-holds | Giữ, thêm việc | Lần đọc `reservation_guest` của BUG-205 gộp với S3-15 (e) vào K10 |
| B-CH-12 | condition | **Chấp nhận** | M5 Chưa; gap gồm SEC BE-38 (K1) và ARC "9b/9c" (K7) |
| B-CH-13 | note | **Chấp nhận** | Ghi giả định ở mục 8 |
| C-CH-01 | blocks-gate | **Chấp nhận** | `s4-acceptance.md` dòng 115, 238; `sprint-4-plan.md` 11.2 (dòng 477), 12.3 bước 7 ("không sang R3"); không dòng ORC. Giả định "quyền PO" của nháp bị rút lại. G6.1 Chưa → K9 |
| C-CH-02 | condition | **Chấp nhận** | grep nhãn scan trong `ui/`, `ui-clock/`: không có H20, không hộp Gia hạn/Đổi phòng; `s4-UXD-brand.md` dòng 86; 193 Open. G8.2 Chưa → K8 |
| C-CH-03 | condition | **Chấp nhận** | `s4-a7-reconciliation.md` 8.2; G4 là nhóm cứng, không thể "Đạt nhờ điều kiện" → K4 trước chấm lại |
| C-CH-04 | condition | **Chấp nhận** | Như A-CH-07. K2 đòi lượt T9 (có retry guard và ca axe `gate-s4`) trên commit chấm lại |
| C-CH-05 | condition | **Chấp nhận một phần, phần lớn đã gỡ** | (1) Đúng: quyết định chỉ có hiệu lực khi đủ bằng chứng – bản chính thức không cho ĐCĐK "có hiệu lực trước". (2) Đường "INV gỡ billing" đã cũ – repo công khai. (3) gitleaks toàn lịch sử đã xanh (141 commit) |
| C-CH-06 | note | **Chấp nhận** | → C4: PO chấm lại trên commit chấm lại; tổng kết không dùng số 50/32/2/2 |
| C-CH-07 | claim-holds | Giữ | – |
| C-CH-08 | claim-holds | Giữ | QC chạy lại trace trên HEAD: exit 0 |
| C-CH-09 | claim-holds | Giữ | – |
| C-CH-10 | note | **Chấp nhận** | Logo S4-49 chiếm một suất 12.3 bước 7 – gộp K9 |

Không phản biện nào bị bác. Ba ý "condition" (A-CH-01, A-CH-11, C-CH-05 phần 2–3) đã được gỡ bằng bằng chứng mới sau nháp.

---

## 4. Ai làm gì – tóm tắt

| Vai | Việc trước chấm lại (K) | Việc kèm theo (C) |
|---|---|---|
| ORC | K2 (chạy T9), K3 (CI), K9 (mục 16 / decision-log cho 2 phần Must + logo) | C1 đóng băng mã tiền, C6 ngày chấm + tổng kết trình INV |
| SEC | K1 (Verified BE-65 → đóng BE-38), K6 (BE-73 trên commit), K11 (đánh giá lại sau khi công khai) | C5 (snapshot PWA 502–504), điều kiện review 208 |
| BE-C | K1 (sửa BE-65) | – |
| ARC | K6 (Verified S3-15, 7 Major S4, BE-S4-16), K7 (review mã registration BE-C) | – |
| UXD | K6 (Verified FE-S4-01, 02, 22) | – |
| QA | K5 (sổ lỗi), K8 (ca axe H20, H15, H16, H23) | C1 (xếp mức lỗi tiền), C10 (ca phụ thuộc ngày) |
| DATA | K4 (chạy lại `a7-ds0`) | – |
| PO | K10 (backlog 5.5), góp K9 | C4 (chấm lại `s4-acceptance.md`) |
| OPS | K2 (theo dõi T9) | C2 (thủ tục 0076), C9 (PR Dependabot) |
| DOM | – | C3 (số BR-525-16) |

---

## 5. Mục KHÔNG ĐẠT – quay lại Bước 4 (Phản hồi & sửa), rồi QC chấm lại rút gọn

Hạn chung: **trong tuần Ổn định, trước QC Round 2**. Chấm lại rút gọn = QC chỉ kiểm K1–K11 trên một commit chấm lại có CI xanh; không mở lại các dòng đã Đạt, trừ khi commit mới chạm vùng đó. Cả 11 việc xong thì kết quả dự kiến là ĐẠT hoặc ĐẠT CÓ ĐIỀU KIỆN.

| # | Việc | Người làm | Đạt khi | Gỡ dòng |
|---|---|---|---|---|
| **K1** | FB-R2-SEC-BE-65: đặt mốc hạn lưu cho ảnh `work_order` / `inspection` khi gắn (đóng phiếu, `inspected_at`), xóa mốc khi `reopen`, migration bù mốc cho ảnh đã gắn, test J16. Phần (b) `penalty_evidence` gắn sau trả phòng nằm ở module folio: **ARC xác nhận trước** có chạm đóng băng mã tiền (decision-log 827) hay không; nếu có, SEC quyết BE-38 có cần phần (b) để Verified không. SEC ghi Verified BE-65 và đóng BE-38 điểm 2 trong `s3-SEC.md`. Đường khác hợp lệ duy nhất: PO đề xuất, ORC duyệt đổi tiêu chí G2 trong `sprint-4-plan.md` mục 16 kèm lý do và báo INV – QC **không khuyến nghị** vì G2 là nhóm cứng và đây là hồi quy | BE-C (BE-B review), ARC, SEC | SEC Verified 8/8 SEC-G3 trên commit chấm lại; CI xanh | G2.2, G3.1, M5 |
| **K2** | Chạy T9 trên repo công khai, trên commit chấm lại: `workflow_dispatch` với `t9`, hoặc lượt lịch 19:17 UTC | ORC, OPS (QA ghi lỗi của lượt) | Lượt T9 gần nhất xanh, retry guard xanh, ca axe `gate-s4` có trong lượt | G5.2 |
| **K3** | CI push trên commit chấm lại (gồm mã K1 và ca K8) | ORC, OPS | 8/8 xanh, 0 dòng `retry #`, `WRITES` 11/11, `s438-r8` 8/8, gitleaks toàn lịch sử xanh, `pnpm audit` 0 high | G5.1 (giữ) |
| **K4** | Chạy lại `a7-ds0.test.ts` một lần trên commit chấm lại; ghi mã commit (repo công khai) và kết quả vào `outputs/DATA/s4-a7-reconciliation.md` mục 8 | DATA (BE-D hỗ trợ) | 114/114 khớp, hoặc lệch có thẻ lỗi | G4.4 |
| **K5** | Sửa `qa/bug-list.md` theo run 39244841718 (và CI của commit chấm lại): đóng 181, 187 (P1), 207; 179, 180, 182, 183, 188–192, 194; kiểm và đóng 184, 185; **tách 186** (phần đã sửa → Closed, phần đọc chéo → dòng backlog R3 Sprint 1); kiểm 078, 087, 089, 101, 102 (FE-A đợt 18); 193 theo K8; bỏ chữ "chưa có mục S4" ở 078; mỗi P2 Open trỏ tới dòng backlog; đếm lại bảng tổng | QA | Bảng tổng khớp từng dòng; 0 P0/P1 Open/Fixed | G7.1, G7.2 |
| **K6** | Ghi Verified (hoặc mở lại có lý do) trên commit chấm lại: ARC – S3-15 điểm mở lại (`s3-ARC.md` dòng 272), 7 Major `s4-ARC.md` (S4-01, 02, 03 phần định nghĩa, 07, 08, 09 phần tiền, 13; ghi rõ S4-03/S4-09 phần đọc chéo dời R3 Sprint 1 – QC chấp nhận), BE-S4-16 (`openapi-0.3.7.md`); UXD – FE-S4-01, FE-S4-02 (`s4-UXD.md`), FE-S4-22 (`s4-UXD-brand.md`); SEC – BE-73 trên commit đã gộp | ARC, UXD, SEC | Không còn Blocker/Major review S4 ở trạng thái "Open" mà tác giả đã Done | G3.1, G3.2, G2.4 |
| **K7** | ARC review kỹ thuật mã registration của BE-C: `removePartyMember` + `guestUploadPersonIndex` + dồn số ô (S4-39), phần "BE 9b/9c" của M5, migration 0070 (BE-73), lần đọc `reservation_guest` của BUG-205. Ghi vào `reviews/s4-ARC.md` mục C; Blocker/Major có trả lời của BE-C | ARC; BE-C trả lời | Có tệp review; Blocker/Major Verified hoặc dời có backlog | G3.3, M5 |
| **K8** | Thêm ca axe (chặn critical + serious): H20 (danh sách căn, kiểm phòng 20.3, hộp "không muốn dọn" 20.1/20.4, toast 20.2); H15 hộp Gia hạn và Đổi phòng; H16 bước 2–3 (hộp quản lý xác nhận); H23 form ở vị trí đầu, **bỏ `scrollTo`** trước scan, rồi đóng hoặc giữ 193 theo kết quả. Chỉ thêm test (không đổi mã tiền); nếu ca đỏ → MOB/FE-B sửa giao diện, không chạm đường tiền | QA (MOB, FE-B sửa nếu đỏ; UXD xác nhận) | Ca chạy trong K3 và K2, 0 lỗi nghiêm trọng | G8.2, M8 |
| **K9** | Hai phần Must R2 chưa làm (US-012 AC7 "Đồng bộ kênh lỗi", US-031 AC1 thông báo J4) và logo S4-49: ORC chọn **một** đường đúng quy tắc: (i) chuyển sang Ổn định theo 12.3 bước 7, ghi decision-log, làm xong trước QC Round 2; hoặc (ii) PO đề xuất, ORC duyệt ngoại lệ "sang R3" trong `sprint-4-plan.md` mục 16 + decision-log, kèm lý do (R2 không có kênh thật, push là Mock) và báo INV ở tổng kết. Logo: một dòng ORC theo 12.3 bước 7 | ORC, PO | Có dòng ORC; G6.1 khi đó tính "Đạt có ĐK" (1 dòng mềm) | G6.1 |
| **K10** | Backlog 5.5 có dòng, vai, hạn cho: BUG-R2-208, 209, 210 + ARC 16.31 (R3 Sprint 1, trước bản dùng thử, lượt kiểm tiền riêng, SEC review 208 theo thứ tự 207 → 210 → 208); FB-R2-SEC-BE-83 (trước dữ liệu thật – **tạo mã R3-Q khớp thẻ `pendingFix` "R3-SEC-BE-83"** hoặc sửa thẻ cho khớp); ARC BE-S4-17/18/19; N-11 A04; FB-R2-SEC-BE-82; ARC S4-03/S4-09 phần đọc chéo + phần 186; S3-16 `ModuleRef`; S3-15 (e) + đọc `reservation_guest` (BUG-205); BUG-R2-123; fuzz công nợ (QA, trước bản dùng thử). Tác giả ghi "Deferred" trong `responses/` cho SEC Major S4 còn dời (74, 75, 79, 83; 65 nếu chưa sửa). SEC ghi điều kiện review 208 vào `s4-SEC.md` | PO; BE-B, BE-C ghi responses; SEC | grep backlog thấy đủ mã; mọi `pendingFix` trỏ tới mục có thật | G3.2, G7.2 |
| **K11** | SEC đánh giá lại G2.5 khi repo đã công khai: (1) tài liệu review công khai mô tả cách lách của Major còn mở – rủi ro trước dữ liệu thật; (2) `environment: staging` + `STAGING_SSH_KEY` có bảo vệ (reviewer, chỉ nhánh `main`); (3) PR từ fork/Dependabot không lấy được secret; (4) 3 cảnh báo Dependabot mức trung bình; (5) lịch sử ngoài mẫu gitleaks (dữ liệu cá nhân, thông tin an ninh vật lý – ORC đã rà 19/10). Ghi kết luận vào `s4-SEC.md` | SEC (OPS hỗ trợ) | Có mục SEC; vẫn 0 Critical/High Open | G2.5 |

Thứ tự đề xuất: K10, K6, K9 (thủ tục, làm ngay) song song K1 và K8 → K3 (CI) → K2, K4, K5 trên commit đó → QC chấm lại.

---

## 6. Điều kiện kèm theo (giữ sau khi chấm lại; không chặn chấm lại)

| # | Điều kiện | Vai | Hạn |
|---|---|---|---|
| C1 | Giữ đóng băng mã tiền (decision-log 827) tới khi QC chấm lại xong. Mọi thay đổi mã tiền ở R3 – 208, 209, 210, ARC 16.31 **và BUG-R2-123** (`move-preview`, B7a) – qua một lượt kiểm tiền riêng, có critic đọc log gốc. Đề bài lượt đó gồm các khoảng hở ở mục 7. QA xếp mức lỗi tiền theo `test-strategy.md` mục 8 (mặc định P0 tới khi chứng minh) | ORC, QA | Tới chấm lại; toàn bộ R3 Sprint 1 |
| C2 | Giữ thủ tục OPS của 210 (decision-log OPS 18/10): không nâng tại chỗ lên ≥ 0076; không dùng lại `ottimo_qa24/26/27`; cấm dựng staging từ dump; demo INV chỉ cập nhật bằng `demo-up.sh` | OPS, ORC | Tới khi 210 sửa xong ở R3 |
| C3 | DOM xác nhận số BR-525-16 sau khi QA sửa ca TC-L4-153 (trong cửa sổ trần 100.000; hết cửa sổ 120.000) | DOM | Tuần Ổn định |
| C4 | PO chấm lại `s4-acceptance.md` trên commit chấm lại (7 story "Chờ G1", 32 AC "Chờ ca UI", US-024 AC4, US-139 AC3, US-066 AC2; US-053/055/110 sau K6) | PO | Trước tổng kết Round 2 |
| C5 | SEC đọc thay đổi PWA mở snapshot khi 502/503/504 (`api.ts`, `App.tsx`, `queue.ts`), ghi một dòng hoặc gộp FB-R2-SEC-MOB-03 | SEC | Trước R3 Sprint 1 |
| C6 | ORC ghi decision-log ngày chấm thực tế của cổng (nháp 18/10, chính thức 19/10, ngày chấm lại) theo quy tắc D8; tổng kết trình INV nêu: cổng trượt mốc D7/D8, 8 lượt kiểm tiền, KHÔNG ĐẠT lần 1 và lý do | ORC | Khi chấm lại; tổng kết R2 |
| C7 | ĐK-S3-8 staging, S4-15 Caddy thật, SEC-G2 smoke | OPS, SEC, QA | Cổng cuối Round 2 (khi có VPS) |
| C8 | UXR đi lại T6, T7 trên PWA sau bản sửa mức 3–4 (`UXR/s4-pwa-walkthrough.md` mục 5) | UXR | Trước QC Round 2 |
| C9 | 6 PR Dependabot trên repo công khai đang đỏ: không gộp trước khi chấm lại; OPS/SEC phân loại sau | OPS, SEC | R3 Sprint 1 |
| C10 | QA rà các ca chọn ngày tương đối (`today + N`) để tránh rơi vào ngày đặc biệt/ngày lễ như TC-L2-079 (CI đỏ theo ngày chạy) | QA | Trước QC Round 2 |

---

## 7. Hạng mục dời, khoảng hở và vai chịu trách nhiệm

| Hạng mục | Mức | Vai | Hạn | Nguồn |
|---|---|---|---|---|
| BUG-R2-208 (N-7 ngõ cụt khi công nợ mở = 0) | P2 | DOM, ARC; BE-B, BE-A, FE-A; SEC review | R3 Sprint 1, trước bản dùng thử; sau 207, 210 | decision-log ORC 18/10 |
| BUG-R2-209 (J15 không ghi nhật ký/thông báo phần tăng) | P2 | ARC, BE-A, BE-B, DOM, QA | R3 Sprint 1 | như trên |
| BUG-R2-210 (nợ ghi trước 0076 – **có lệch tiền** trên dữ liệu cũ) | P3 | BE-A; OPS giữ thủ tục (C2) | R3 | decision-log OPS, ORC 18/10 |
| BUG-R2-123 (`move-preview` B7a) | P3 | BE-A, ARC | R3, trong lượt kiểm tiền (C1) | A-CH-06 |
| FB-R2-SEC-BE-74, 75, 79, 83 (và 65 nếu không sửa ở K1) | Major, Medium | BE-C, BE-B; DOM, PO (BR-433) | Trước dữ liệu thật | decision-log 794, 800; DOM 18/10 |
| ARC BE-S4-17/18/19; N-11 A04; SEC-BE-82 | Minor | BE-A, BE-B | R3 | ORC 827; ARC 16.31 |
| ARC S4-03/S4-09 phần đọc chéo; S3-16 `ModuleRef`; S3-15 (e) | Major (phần dời), không tiền | BE-C, BE-D, BE-B | R3 Sprint 1 | `s4-ARC.md`; `s3-ARC.md` dòng 272, 289 |
| US-012 AC7 "Đồng bộ kênh lỗi"; US-031 thông báo J4; logo S4-49 | Phần Must R2 / NÊN-ÔĐ | BE-D, INT; UXD, FE-B, MOB | Theo K9 | K9 |

**Khoảng hở tiền chưa thử** (A-CH-10, đưa vào đề bài lượt kiểm tiền R3): đăng lại FOC qua nhánh dòng đêm S4-35 (lượt chạy lại 207 chỉ thử dòng fnb và dòng phòng); công nợ trên đơn con (B9a, gia hạn OTA); đơn dài hạn; nhiều tổ chức; đảo khoản thu nợ trên folio `closed` trong ma trận đua (`s4-money-recheck8.md` dòng 199, 215–221).

---

## 8. Giả định và những gì QC chưa kiểm được

Giả định:
- Bản sao cục bộ còn commit cũ nên dẫn chứng `d527f9c`, `0dcf8e1`… vẫn kiểm được; trên GitHub chỉ còn mã mới (bảng đầu tệp).
- Mã chạy `2a6d61f` = `d527f9c`, nên các dẫn chứng đọc mã ở nháp vẫn đúng.
- "Dòng" trong 11.2 có thể hiểu là dòng G (G3, G6, G8) hoặc ý con; cả hai cách đều cho KHÔNG ĐẠT ở bản này.
- Dòng Verified của DOM, ARC, UXD ghi trên `7ac11a4`. Sau đó có 7 lần gộp đổi mã; phần tiền đã kiểm lại qua lượt 6–8, phần không tiền chỉ được bảo vệ bằng CI xanh, không ai đọc lại (B-CH-13). K6 đòi ghi Verified trên commit chấm lại.
- TC-L2-079 đỏ ở `229eaf3` là lỗi dữ liệu ca kiểm theo ngày, không phải mã (QC đọc thông điệp lỗi và bản sửa ở `2a6d61f`).

QC chưa kiểm được:
- Không đi luồng bằng tay trên Desk, PWA, guest-web; không chạy lại bộ tái hiện tiền. Kết luận chạy thật lấy từ log CI do QC tự tải và việc đọc mã/test.
- Log gốc QA của 207 nằm ở scratchpad phiên QA (ngoài repo) – QC dựa vào bản đọc của phản biện A-CH-08.
- Phóng chữ 200 %, VoiceOver/TalkBack, thiết bị thật, staging, Caddy thật: chờ VPS (C7).
- Đọc mã dưới góc bảo mật và nghiệp vụ là phần của SEC, DOM; QC chỉ đọc mẫu.

---

## 9. Đầu vào cho QC Round 2 và tổng kết Round 2

**Cho QC Round 2 (cổng cuối R2):**
1. Kết quả chấm lại cổng S4 (K1–K11) – phải ĐẠT hoặc ĐCĐK trước khi chấm cổng cuối.
2. C1–C10 ở mục 6, nhất là C2 (thủ tục 210), C4 (nghiệm thu chấm lại), C7 (staging khi có VPS – điều kiện cổng cuối R2), C8, C10.
3. Phần Must R2 của K9 (nếu đi đường (i): phải xong trước cổng này).
4. CI: commit chấm cổng cuối phải có cả lượt push và lượt T9 xanh trên repo công khai, 0 retry.

**Cho tổng kết Round 2 (ORC trình INV, theo brand guideline OTTIMO: ngắn, điềm tĩnh, không emoji):**
1. Cổng Sprint 4 lần 1 **không đạt**, không vì tiền: thiếu ghi xác nhận của người review, một lỗi bảo mật về hạn lưu ảnh chưa sửa, vài ca kiểm giao diện còn thiếu. Đội làm xong trong tuần Ổn định rồi chấm lại.
2. Phần tiền đã qua 8 lượt kiểm đối kháng; cổng trượt mốc D7/D8 theo đúng quy tắc lùi cổng (C6).
3. Còn 3 lỗi tiền đã biết ở vùng công nợ sau trả phòng (208, 209, 210): sửa đầu Round 3, có lượt kiểm tiền riêng, xong trước bản dùng thử. 210 có thể làm sai số nợ, nhưng chỉ với dữ liệu cũ mà hiện không môi trường nào có; đội giữ thủ tục để điều đó không xảy ra. Không gọi đây là "lỗi nhỏ".
4. Các thẻ bảo mật mức trung bình dời tới trước khi có dữ liệu khách thật (hạn lưu ảnh và hồ sơ, gỡ dữ liệu giấy tờ khi sửa nhầm người, chia nhỏ xóa nợ để né chủ duyệt). Repo nay công khai, nên tài liệu mô tả các điểm này cũng công khai; SEC đánh giá lại (K11).
5. Hai phần nhỏ của Must R2 (dòng "Đồng bộ kênh lỗi", thông báo khách quá giờ trả phòng) và logo theo quyết định K9 của ORC.
6. Kiểm tra tự động nay chạy miễn phí trên repo công khai, đã xanh (run 39244841718). Mã commit trong tài liệu cũ là mã của repo cũ.
7. Bản demo của anh/chị vẫn là bản 17/10; cập nhật sẽ xóa dữ liệu thử và đổi mật khẩu, link khách (OPS `s4-env-0076.md` 3.1). Chưa có staging, chưa thử trên điện thoại thật của nhân viên.
8. Chờ anh/chị quyết, không chặn cổng: ESC-022 (tên Wi-Fi), ESC-023 (rút ngắn đơn < 7 ngày), ESC-024 (phụ thu trả muộn khi quản lý không trả lời).

ESC mới: **không có**. ESC-025 đã đóng 19/10. KHÔNG ĐẠT ở cổng sprint của Round 2 thuộc quyền QC, không phải báo lên.
