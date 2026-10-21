# Cổng QC Sprint 4 – Round 2 (bản chính thức)

- Người chấm: QC | Nháp 18/10/2026 18:00–18:40 → **chính thức 19/10/2026** sau ba bộ phản biện (36 ý, mục 3) | Round 2, Sprint 4, tuần Ổn định | Bước 6 – Cổng chất lượng.
- Đọc lại theo ma trận: ORC (bắt buộc), PO (khuyến nghị).
- **Chấm lần 3 21/10 (mục 11, cuối tệp): ĐẠT CÓ ĐIỀU KIỆN** trên `21bb797` – K2' và K7' đạt; điều kiện còn giữ ở 11.5.
- **Chấm lại 20/10 (mục 10): KHÔNG ĐẠT lần 2** – 9/11 việc K đạt; còn K2 (lượt T9 hằng đêm gần nhất 39312874062 trên `c293ceb` đỏ, TC-X-074) và K7 (ARC chưa ghi Verified S4-21). Mục 1–9 dưới đây giữ nguyên nội dung lần chấm 19/10.
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

---

## 10. Chấm lại 20/10

- Người chấm: QC | 20/10/2026 | Round 2, Sprint 4, tuần Ổn định | Bước 6 – chấm lại rút gọn theo mục 5 (chỉ K1–K11; không mở lại dòng đã Đạt trừ khi commit mới chạm vùng đó).
- **Commit chấm lại: `c293ceb`** (mã) + `06994e5` (chỉ tài liệu K4/K5: `s4-a7-reconciliation.md`, `bug-list.md` – QC kiểm `git diff --name-only c293ceb 06994e5`).
- QC tự tải bằng `gh run view -R anhvh93-tech/ottimo-hotel-app-public` (log + `--json headSha,event,attempt`), không dùng số tự khai:

| Run | Sự kiện | Commit | Lần | Kết quả QC đọc từ log |
|---|---|---|---|---|
| 39270302984 | push | `c293ceb` | 1 | Xanh. API 104 tệp / **2.971 đạt**, 2 bỏ qua; `sec-be65-retention` 9/9, `registration-party-removal` 18/18, `s438-r8` 5 + 3 = 8/8. E2E `Running 2041 tests`: **1.972 đạt**, 69 bỏ qua, **0 dòng `retry #`**, 0 ✘. Bước "UI cases ran (… write steps …)" success (`WRITES` 11 ca). gitleaks **144 commit, no leaks**. `pnpm audit` "3 moderate", 0 high. GHCR/staging bỏ qua theo thiết kế |
| 39273997368 | workflow_dispatch (T9) | `c293ceb` | 1 | Xanh. 2.041 ca: 1.972 đạt, 69 bỏ qua; **0 dòng `retry #`**; tóm tắt guard "0 flaky, 0 masked by retry"; có `gate-s4` (desk-chromium 8 ca, desk-clock 7 ca) và `axe-k8.s4` TC-X-084…087 ✓ |
| **39312874062** | **schedule (T9 hằng đêm, 19:40 UTC = 02:40 giờ Đà Lạt 20/10)** | **`c293ceb`** | 1 | **Đỏ.** TC-X-074 (`ui/gate-s4.spec.ts:413`, desk-chromium, đồng hồ thật) ✘ lần đầu và ✘ `retry #1`: PWA "Các căn" hiện hộp lỗi "Chưa tải được trạng thái các căn", không có link "Căn nnn" (QC đọc `error-context.md` trong artifact `t9-playwright-report`). 1 failed, 1.747 đạt, 67 bỏ qua, **226 không chạy** (gồm cả `axe-k8.s4`). "T9 retry guard" **failure** |

- Lượt dispatch chạy lúc 21:59 giờ Đà Lạt và xanh. Lượt lịch chạy lúc 02:40 cùng mã và đỏ cả hai lần, nên nhiều khả năng lỗi phụ thuộc giờ trong ngày, không phải chập chờn. QC chỉ nêu giả thuyết, chưa chứng minh: PWA gọi `listHkTasks(pid, localDate())` cùng `listRoomStatuses` trong một `Promise.all` (`apps/mobile/src/app/data.tsx:86-89`). Một trong hai lời gọi có thể lỗi trong khoảng sau nửa đêm, trước khi đổi ngày kinh doanh. Nếu đúng vậy thì đây là **lỗi sản phẩm** của ca đêm buồng phòng, không chỉ là lỗi ca kiểm. QA xác định, MOB/BE-C sửa.
- **Không ai ghi lượt đỏ này.** `bug-list.md` 11.37 và `s4-a7-reconciliation.md` 8.7 chỉ dẫn 39270302984 + 39273997368 "xanh". Prompt giao việc cho QC cũng không nhắc tới lượt này. QC thấy nó khi tự chạy `gh run list`.
- **Vùng tiền đóng băng:** `git diff --name-only 2a6d61f c293ceb` không có tệp nào trong `folio/`, `payments/`, FOC, checkout hay công nợ ở `src`. Đúng như ORC báo. Chỉ có một tệp test tiền `e2e/api/refund-credit.s4.api.spec.ts` đổi theo C10: ca bỏ qua có lý do khi ngày rơi vào đêm DS-E, và luật cao điểm đã có TC-L2-053 kiểm. Hai ca C10 khác chuyển oracle sang BR-309-08. Mã `src` đổi ở `files/attachment.service.ts`, `housekeeping` (2 lời gọi đặt mốc), `registration` (S4-21) và `0078`. Đây không phải mã tiền, nên **không mở lại G1**.
- QC tự chạy `gen_traceability.py --strict` trên HEAD `06994e5` (chỉ đọc): **exit 0**, cây vẫn sạch.

### 10.1 Bảng K1–K11

| # | Đạt khi (mục 5) | Bằng chứng QC kiểm | Kết quả |
|---|---|---|---|
| K1 | SEC Verified 8/8 SEC-G3 trên commit chấm lại; CI xanh | SEC `s4-SEC.md` C.15 đã Verified BE-65 và đóng BE-38 điểm 2 (`s3-SEC.md` 10.4, dòng 179) **trên cây làm việc**. SEC tự nêu điều kiện "chạy lại 2 tệp test trên commit chấm lại". CI push trên `c293ceb` đã chạy đúng 2 tệp đó: `sec-be65-retention` 9/9, `registration-party-removal` 18/18. QC đọc diff `c293ceb` và thấy khớp từng điểm C.15: `setRetentionAnchorForRef` theo một bản ghi; `complete`/`cancel`/`reopen`; mốc kiểm phòng = `performedAt`; `STAY_ENDED` khi upload; `onReservationVoided` đặt mốc trước `if (!reg) return`; `anchorMissing` chỉ đếm; 0078. Không đụng folio/payments. Phần còn lại tách thành BE-84 (R3-Q33). BE-B chưa có dòng review mã (thủ tục, xem C11) | **Đạt** → G2.2 Đạt (8/8), M5 phần SEC |
| K2 | **Lượt T9 gần nhất xanh**, retry guard xanh, có ca axe `gate-s4` | Lượt T9 gần nhất trên `c293ceb` là **39312874062 (lịch) – đỏ**, retry guard đỏ, `axe-k8` không chạy. Lượt dispatch 39273997368 xanh nhưng **không phải lượt gần nhất**. G5.2 ghi đúng chữ "lượt T9 hằng đêm gần nhất xanh". Lần chấm 19/10, QC đã rút lại việc tự nới G5.2 (A-CH-07, C-CH-04), nên lần này cũng không nới | **Chưa** → G5.2 Chưa |
| K3 | 8/8 xanh, 0 `retry #`, `WRITES` 11/11, `s438-r8` 8/8, gitleaks toàn lịch sử, audit 0 high | Run 39270302984 (bảng trên) | **Đạt** → G5.1 giữ Đạt |
| K4 | `a7-ds0` 114/114 trên commit chấm lại | `s4-a7-reconciliation.md` 8.7: `c293ceb`, cây sạch, DB mới, 5/5 test, 21/21 mã; kết quả giống từng byte lượt 3 (114 phép so). A7-01/02/03 Verified | **Đạt** → G4.4 Đạt |
| K5 | Bảng tổng khớp từng dòng; 0 P0/P1 Open/Fixed | QC đếm lại bằng script: 210 lỗi, P0 10/10 Closed, P1 66/66 Closed. P2: 76 Closed, 2 Open (208 → R3-Q19, 209 → R3-Q20), 1 Deferred (074). P3: 40 Closed, 15 Open. **Khớp bảng tổng.** 186 đã tách, 193 Closed (TC-X-087 không `knownBug`). Chưa có dòng nào cho lượt đỏ 39312874062. Dòng đó thuộc K2 mới, không làm hỏng việc đếm | **Đạt** → G7 Đạt (đếm trên `06994e5`) |
| K6 | Không còn Blocker/Major review S4 "Open" mà tác giả đã Done | ARC `s4-ARC.md` E.2: S3-15, S4-01/02/03 (định nghĩa)/07/08/09 (tiền)/13 Verified. `openapi-0.3.7.md` BE-S4-16 Verified. `s3-ARC.md` S3-15 Verified. UXD: FE-S4-01/02 (`s4-UXD.md`), FE-S4-22 (`s4-UXD-brand.md`) Verified. SEC BE-73 C.14 Verified trên `50db5cd`. Từ `50db5cd` tới `c293ceb`: không đổi trang FE của Desk. `registration` chỉ đổi định nghĩa "không gắn ai" (S4-21), không chạm `guestOfPerson`, `keepDocKey`, `recordCrmConsent` (C.14). `housekeeping` chỉ thêm lời gọi đặt mốc trong giao dịch đã giữ khóa phiếu (ARC E.1), không đổi thứ tự khóa S4-02 | **Đạt** → G3.1, G2.4 phần BE-73 |
| K7 | Có tệp review; Blocker/Major Verified hoặc dời có backlog | `s4-ARC.md` C.K7 có: 0 Blocker, 1 Major (**S4-21**), 3 Minor, 1 Suggestion. S4-21: BE-C ghi "Done – chờ ARC kiểm" (`responses/s4-BE-C.md` dòng 33). Mã đã vào `c293ceb`: `isLinkedToNobody`, `LINKED_TO_NOBODY_SQL`, `UNCLAIMED_DOC_SQL` ở `isOpenGuestSlot` và 4 câu SQL; CI 18/18. Nhưng `s4-ARC.md` dòng S4-21 vẫn ghi **"Trạng thái: Open"**, ARC chưa ghi Verified. Chính ARC đặt điều kiện "ARC kiểm lại trên commit chấm lại". QC không Verified thay ARC (protocol: người review ghi Verified). S4-22: phần 0078 xong (ca 6b); phần chạy script trên demo chuyển OPS. S4-23 → R3-Q34, S4-24 → R3-Q28, S4-25 → R3-Q35 | **Chưa** (chỉ thủ tục: ARC ghi Verified S4-21) → G3.3, M5 phần "BE 9b/9c" |
| K8 | Ca axe chạy trong K3 và K2, 0 lỗi nghiêm trọng | `axe-k8.s4.spec.ts` TC-X-084…087 ✓ trong push 39270302984 và dispatch 39273997368. TC-X-077 bỏ `scrollTo` ✓. BUG-R2-193 Closed. UXD chấp nhận cách sửa (`s4-UXD-brand.md` G.2). Lượt lịch 39312874062 **không chạy** `axe-k8` (dừng sau ca đỏ) | **Đạt có ĐK** (ca chạy lại trong lượt T9 của K2' – C12) → G8.2 |
| K9 | Có dòng ORC; G6.1 = "Đạt có ĐK" | `sprint-4-plan.md` 16.5: ORC tick "Duyệt (ii)", có lý do. Decision-log 19/10 "ORC – K9". Logo S4-49 chuyển Ổn định theo 12.3 bước 7. Ô "Ngày / Dòng decision-log" ở 16.5 còn trống (thủ tục nhỏ, C11) | **Đạt** → G6.1 **Đạt có ĐK** (1 dòng mềm) |
| K10 | grep backlog thấy đủ mã; mọi `pendingFix` trỏ tới mục có thật | Backlog 5.5 R3-Q19…Q35: 208, 209, 210, 16.31, SEC-BE-83 (`R3-SEC-BE-83` → R3-Q22; 3 thẻ `pendingFix` trong `br-examples.json`), BE-S4-17/18/19 (R3-Q23), N-11, SEC-BE-82, S4-03/09 phần đọc chéo + 186, S3-16 `ModuleRef`, S3-15 (e) + BUG-205, BUG-R2-123, fuzz công nợ, BE-84, S4-23, S4-25. Còn thiếu hai việc phụ của K10 (không nằm trong "Đạt khi"): (a) BE-B/BE-C chưa ghi "Deferred" cho SEC-BE-74, 75, 79, 83 trong `responses/`, mới có bảng trỏ của PO (`responses/s4-PO.md` mục 2); (b) backlog R3-Q19 ghi "điều kiện SEC review 208 ghi ở `s4-SEC.md`", nhưng `s4-SEC.md` chưa có câu đó | **Đạt** (2 việc phụ → C11) → G3.2, G7.2 |
| K11 | Có mục SEC; vẫn 0 Critical/High Open | `s4-SEC.md` mục E (E.1–E.7): 0 Critical/High. BE-83, BE-79 thành điều kiện cứng trước dữ liệu thật. E.6 là đề xuất cài đặt GitHub cho ORC/OPS | **Đạt** → G2.5 Đạt |

### 10.2 Dòng G sau chấm lại

- Nhóm cứng: G1 Đạt (không mở lại) · G2 **Đạt** (G2.2 8/8, G2.4 Đạt có ĐK do C5 còn, G2.5 Đạt) · G4 **Đạt** · **G5 Chưa (G5.2 – K2)** · G7 **Đạt**.
- Nhóm mềm: G3 **Chưa** (G3.3 – K7, chỉ thủ tục) · G6 **Đạt có ĐK** (16.5) · G8 **Đạt có ĐK** (K8).
- Không có tình huống nào trong bốn tình huống KHÔNG ĐẠT ở mục 3. Không có lỗi tiền P0/P1 Open.

### 10.3 Quyết định chấm lại: **KHÔNG ĐẠT (lần 2)**

Lý do (1 câu): theo 11.2, ĐẠT hoặc ĐẠT CÓ ĐIỀU KIỆN đòi G5 đạt. Nhưng **lượt T9 hằng đêm gần nhất trên chính commit chấm lại đỏ**: một ca PWA buồng phòng lỗi lúc 02:40, đỏ cả hai lần chạy. Lỗi chưa ai ghi hay phân loại, nên chưa loại trừ được đây là lỗi sản phẩm của ca đêm.

Đọc kỹ để không hiểu sai:
- 9/11 việc K đạt. Tiền vẫn đạt và không mở lại.
- Cổng trượt vì **một lượt kiểm đỏ chưa được giải thích** và **một dòng Verified còn thiếu**. Đã có thêm 8/8 SEC-G3, sổ lỗi khớp, A7 114/114, axe K8 xanh.
- Nếu lượt đêm chỉ đỏ do ca kiểm phụ thuộc giờ, việc sửa là sửa ca kiểm. Nhưng QA phải chứng minh điều đó bằng log, không suy đoán. QC không tự coi lượt dispatch xanh là "lượt gần nhất".

### 10.4 Việc còn lại để chấm lại lần 3 (rút gọn, chỉ 2 dòng)

| # | Việc | Người làm | Đạt khi | Gỡ dòng |
|---|---|---|---|---|
| **K2'** | (1) QA ghi lượt 39312874062 vào `bug-list.md`: tái hiện TC-X-074 với đồng hồ PWA/máy chủ đặt ở khoảng 00:00–06:00 giờ Đà Lạt, tìm lời gọi API lỗi (mã, thông điệp), xếp mức theo `test-strategy.md` mục 8. (2) Lỗi sản phẩm → MOB/BE-C sửa (không chạm mã tiền), thêm ca `desk-clock` ở giờ đêm. Lỗi ca kiểm → QA sửa ca, ghi lý do. (3) Commit mới → CI push xanh như K3 → lượt T9 **chạy trong khung giờ đêm** (lượt lịch 19:17 UTC, hoặc dispatch sau 17:00 UTC) xanh, và là lượt T9 gần nhất lúc QC chấm | QA; MOB/BE-C nếu lỗi sản phẩm; ORC, OPS chạy CI | Có dòng bug-list cho lượt đỏ (Closed). Lượt T9 gần nhất xanh, chạy trong khung giờ đêm, retry guard xanh, 0 `retry #`, có `gate-s4` + `axe-k8.s4`. CI push trên cùng commit xanh như K3 | G5.2, G8.2 (C12) |
| **K7'** | ARC kiểm lại FB-R2-ARC-BE-S4-21 trên `c293ceb` (hoặc commit chấm lần 3): mã + 2 ca mới trong `registration-party-removal.test.ts`. Ghi Verified, hoặc mở lại có lý do, ở `s4-ARC.md` | ARC | Dòng S4-21 ghi "Verified" kèm commit | G3.3, M5 |

- Khi chấm lần 3, QC chỉ kiểm K2' và K7'. Nếu commit mới đổi `src`, QC kiểm `git diff` để xem có chạm vùng các K đã đạt hay vùng tiền không. Chạm thì mở lại đúng dòng đó. Không chạm thì giữ nguyên bảng 10.1.
- Dự kiến khi xong K2' và K7': G5 Đạt, G3 Đạt. Mềm còn G6, G8 "Đạt có ĐK" (2 dòng ≤ 2) → **ĐẠT CÓ ĐIỀU KIỆN**.

### 10.5 Điều kiện còn giữ (sau chấm lại)

- **C1–C10 (mục 6) giữ nguyên.** C1 đóng băng mã tiền giữ tới chấm lần 3. C9 (6 PR Dependabot): QC thấy 2 PR Dependabot mới đỏ (39336320266, 39336300552, 19/10 22:38 UTC) – không gộp.
- **C11 (mới – thủ tục, trước QC Round 2):**
  - (a) BE-B ghi một dòng review mã BE-65 (K1 ghi "BE-B review"), hoặc ORC ghi miễn vì SEC đã đọc mã;
  - (b) BE-B, BE-C ghi "Deferred" cho SEC-BE-74, 75, 79, 83 trong `responses/`, trỏ R3-Q17/R3-Q22;
  - (c) SEC ghi điều kiện review 208 (thứ tự 207 → 210 → 208, review trước gộp) vào `s4-SEC.md`, như backlog R3-Q19 đã dẫn;
  - (d) ORC điền "Ngày / Dòng decision-log" ở `sprint-4-plan.md` 16.5;
  - (e) UXD xác nhận kết quả axe H23 (G.2 "khi ORC nhắn") và ghi Verified MOB-S4-05 (a) – QC thấy `-webkit-tap-highlight-color: transparent` đã có trong `c293ceb` (2 tệp `styles.css`).
- **C12 (mới):** ca `axe-k8.s4` phải có trong lượt T9 của K2'. Lượt lịch 39312874062 dừng trước khi chạy tới ca này.
- **C13 (mới – quy trình):** từ nay, mỗi báo cáo "CI/T9 xanh" (QA, DATA, ORC) phải dẫn **lượt T9 gần nhất** trên commit đó, kèm `gh run list --workflow CI -L 5`, không chỉ lượt chọn. Lý do: lần này hai báo cáo dẫn lượt dispatch xanh, trong khi lượt lịch sau đó đã đỏ 6 giờ.

### 10.6 Giả định và những gì QC chưa kiểm được (chấm lại)

- Giả định: SEC Verified BE-65 trên cây làm việc. Mã BE-65 trong `c293ceb` khớp mô tả C.15 (QC đọc diff), và CI trên `c293ceb` chạy đúng 2 tệp SEC yêu cầu. Vì vậy QC coi đó là lần "chạy lại trên commit chấm lại" mà SEC đặt ra.
- Giả định: "lượt T9 gần nhất" tính trên commit chấm lại, tại lúc QC chấm (20/10 sáng). Lượt push 39355296057 trên `06994e5` (chỉ tài liệu) đang chạy và không phải T9.
- QC chưa tái hiện TC-X-074 lúc 02:40, chưa chứng minh giả thuyết `listHkTasks`/ngày kinh doanh. Việc này của QA (K2'). Log API trong "Compose logs" chỉ còn 150 dòng cuối, sau thời điểm lỗi, nên không thấy được lời gọi lỗi.
- QC không chạy stack, không chạy test DB, không đi luồng bằng tay, không đụng stack demo, không in tệp env. Mọi số liệu CI lấy từ log GitHub QC tự tải.

ESC mới: **không có**. KHÔNG ĐẠT cổng sprint ở Round 2 thuộc quyền QC; không ảnh hưởng mốc RC hay bản dùng thử (Round 3).

---

## 11. Chấm lần 3 (rút gọn) 21/10

- Người chấm: QC | 21/10/2026 (giờ VN; lúc chấm 20/10 ~17:30 UTC) | Round 2, Sprint 4, tuần Ổn định | Bước 6 – chấm lần 3 rút gọn theo 10.4: chỉ K2', K7'; kiểm `git diff` xem có chạm vùng các K đã đạt hay vùng tiền không.
- **Commit chấm: `21bb797`** (main). Từ `c293ceb`: `e3b0efb` (BUG-R2-211/212/213, MOB + FE-A), `aa2f11b` (hẹn giờ admin-web), `21bb797` (ca desk-clock chạy J8/J11 trước khi đọc bộ đếm).
- QC tự tải bằng `gh run list/view -R anhvh93-tech/ottimo-hotel-app-public` (log + `--json headSha,event,attempt`), không dùng số tự khai. Theo C13, `gh run list --workflow CI -L 5` lúc chấm:

| Run | Sự kiện | Commit | Lần | Kết quả QC đọc từ log |
|---|---|---|---|---|
| **39462961483** | workflow_dispatch (T9) | **`21bb797`** | 1 | **Xanh.** Tạo 17:05:09Z; E2E chạy 17:14–17:25 UTC = **00:14–00:25 giờ VN** (khung giờ đêm, trước mốc 06:00). `Running 2045 tests`: **1.976 đạt**, 69 bỏ qua, **0 dòng `retry #`**, 0 ✘. Guard "T9: 2045 case(s), 0 flaky, 0 masked by retry"; bảng project: `unexpected` 0, `flaky` 0 ở mọi project (desk-chromium 60, desk-clock 50, clock 159, rbac 1.474…). "UI: 112 case(s), 2 allowed skip(s), axe 13 case(s) ran". **TC-X-074** (desk-chromium `ui/gate-s4.spec.ts:413`, đồng hồ thật) ✓ lúc 17:17:05Z = **00:17 giờ VN** – đúng ca, đúng khung giờ đã đỏ ở 39312874062. Ca giờ đêm: **TC-L6-060** (clock) ✓, **TC-X-088**, **TC-L2-109**, **TC-L2-110** (desk-clock) ✓. **`axe-k8.s4`** TC-X-084…087 ✓. gitleaks 148 commit, no leaks; audit "3 moderate", 0 high. GHCR/staging bỏ qua theo thiết kế |
| **39364680576** | push | **`21bb797`** | 1 | **Xanh 8/8.** API 104 tệp / **2.971 đạt**, 2 bỏ qua. E2E `Running 2045 tests`: 1.976 đạt, 69 bỏ qua, **0 `retry #`**, 0 ✘; "UI: 112 case(s)…, axe 13 case(s) ran" (bước kiểm `WRITES` qua); 4 ca giờ đêm + `axe-k8.s4` ✓. gitleaks **148 commit, no leaks**. `pnpm audit` "3 moderate", 0 high |
| 39361269566 | push | `aa2f11b` | 1 | Đỏ – TC-L6-022/033 (desk-clock) ✘: lỗi ca test (J8/J11 chạy bù giữa hai lần đọc bộ đếm), QA `bug-list.md` 11.40; sửa ở `21bb797`. Không phải commit chấm |
| 39358556872 | push | `e3b0efb` | 1 | Đỏ – job build-test, tác vụ `@ottimo/admin-web:test` (QC đọc `--log-failed`): hẹn giờ admin-web không dọn khi gỡ (ca vitest chập chờn), sửa ở `aa2f11b` (`toast.tsx`). Không phải commit chấm |
| 39355296057 | push | `06994e5` | 1 | Xanh (chỉ tài liệu) |

- **Lượt lịch 19:17 UTC hôm nay (20/10) chưa chạy** lúc QC chấm (17:28 UTC). Lượt T9 gần nhất trên `21bb797` là 39462961483. Lượt lịch đêm nay là đối chứng: xem C14.
- **Vùng tiền và vùng đã đạt:** `git diff --name-only c293ceb 21bb797` (46 tệp) **không có tệp nào** ở `product/services` hay `product/packages` (`git diff c293ceb 21bb797 -- product/services product/packages` rỗng); không tệp nào có tên folio/payment/pricing/foc/checkout/debt/refund. Mã đổi chỉ ở client: `apps/mobile` (`time.ts`, `data.tsx`, `tasks.ts`, 5 trang, mock), `apps/admin-web` (`businessDay.ts`, `dates.ts`, `toast.tsx`, 9 trang/thành phần, mock), cùng test và tài liệu. Không chạm `registration` (K7), `files`/`housekeeping` server (K1), A7 (K4). **G1 không mở lại; bảng 10.1 giữ nguyên.**
- QC tự chạy (chỉ đọc) `gen_traceability.py --strict` trên `21bb797`: **exit 0**, 71/71 story Must R2, AC 254/254, RBAC lệch 0; cây làm việc không đổi sau khi chạy.

### 11.1 Bảng K2', K7'

| # | Đạt khi (10.4) | Bằng chứng QC kiểm | Kết quả |
|---|---|---|---|
| K2' (1) | Có dòng bug-list cho lượt đỏ 39312874062, tái hiện giờ đêm, mức theo test-strategy mục 8 | `bug-list.md` 11.38: tái hiện trên `ottimo_qa31` lúc 02:40 – `GET hk-tasks?date=2026-10-20` 422 `NOT_IN_LIST`, đối chứng giờ thật xanh → **BUG-R2-211 P1 (MOB), lỗi sản phẩm**. Rà cùng gốc trên Desk: **212 P1** (Đổi phòng 422), **213 P0** (đặt đơn đêm tính thêm đêm – sai tiền phía client). ORC giữ P0 cho 213 (decision-log 20/10). Giả thuyết của QC ở 10 (`listHkTasks(pid, localDate())`) được QA chứng minh bằng trace | **Đạt** |
| K2' (2) | Lỗi sản phẩm → MOB/BE-C sửa, không chạm mã tiền; thêm ca giờ đêm | MOB bỏ `date`, dùng `businessDate()`, `Promise.allSettled` (`s4-report.md` mục 10); FE-A `useBusinessDay` đọc `getBookingRules().businessDate`/`getRack().today` (đợt 27). Ca mới `ui-clock/night-business-day.s4.spec.ts` (TC-X-088 02:40/05:59/06:00, TC-L2-109, TC-L2-110) và `clock/night-business-day.s4.clock.spec.ts` (TC-L6-060). Kiểm ngược: 3 ca UI đỏ đúng lỗi trên web `c293ceb` (11.39). ARC `s4-ARC.md` mục F: đúng hợp đồng (`x-scope today`, `ctx.today`), không đổi hợp đồng, **0 Blocker, 0 Major**; 2 Minor (FE-S4-01 không hẹn giờ 06:00; MOB-S4-01 hằng 06:00) + 1 Suggestion dời R3 Sprint 1 – không sai tiền vì server luôn kiểm lại | **Đạt** |
| K2' (2b) – 213 theo C1 | 213 là P0 sai tiền phía client; C1 đòi lượt kiểm tiền hoặc ARC review trước khi Closed | ORC decision-log 20/10: ARC review thay lượt kiểm tiền vì chỉ đổi ngày client gửi. QC kiểm độc lập: (a) 0 dòng mã tiền phía server đổi (trên); (b) ARC F nêu rõ server kiểm `DATE_IN_PAST`/`effectiveDate === ctx.today`, nên client không có đường ghi tiền nào khác trước; (c) TC-L2-109 kiểm **số đêm đã lưu** (`nightlyRates` = `[D-1]`, `night-business-day.s4.spec.ts:143–147`), không chỉ giá trị ô ngày; (d) ca đỏ trên bản cũ. Bộ tái hiện tiền và A7 không cần chạy lại vì máy tính tiền không đổi. **QC chấp nhận ARC review thay lượt kiểm tiền cho 213.** Giới hạn: TC-L2-109 không đi tiếp tới nhận phòng + B9a; phần đó do máy tính tiền server không đổi bảo đảm | **Đạt** |
| K2' (3) | Commit mới → CI push xanh như K3 → lượt T9 trong khung giờ đêm xanh, là lượt T9 gần nhất lúc chấm; retry guard xanh, 0 `retry #`, có `gate-s4` + `axe-k8.s4` | Push 39364680576 xanh 8/8 như K3 (0 `retry #`, `WRITES` qua, gitleaks toàn lịch sử, audit 0 high; `s438-r8` nằm trong 2.971 ca API không đổi so với K3 – QC không grep riêng lần này). T9 39462961483: dispatch sau 17:00 UTC (00:05 giờ VN), E2E 00:14–00:25 giờ VN, xanh, guard 0 flaky / 0 masked, 0 `retry #`, `gate-s4` (desk-chromium + desk-clock) và `axe-k8.s4` có mặt; là lượt T9 gần nhất trên `21bb797` (`gh run list -L 5`) | **Đạt** → G5.2 Đạt |
| K7' | ARC ghi Verified FB-R2-ARC-BE-S4-21 kèm commit | `s4-ARC.md` dòng 176: "**Verified 20/10** (ARC, commit `c293ceb`, CI push 39270302984 xanh)", kèm điểm kiểm mã (`isLinkedToNobody`, 2 hằng SQL, 4 câu SQL, 3 ca "ARC S4-21" trong `registration-party-removal.test.ts`). S4-22 Verified phần 0078 + quy tắc (phần OPS chạy script trên demo còn lại). `21bb797` không đổi `registration` → Verified trên `c293ceb` còn giá trị | **Đạt** → G3.3 Đạt, M5 |

### 11.2 Dòng G sau chấm lần 3

- Nhóm cứng: G1 **Đạt** (không mở lại) · G2 **Đạt** (G2.4 Đạt có ĐK do C5) · G4 **Đạt** · G5 **Đạt** (G5.1 push 39364680576; G5.2 T9 39462961483) · G7 **Đạt** (0 P0/P1 Open hoặc Fixed sau khi đóng 211/212/213 – mục 11.4).
- Nhóm mềm: G3 **Đạt** (K7') · G6 **Đạt có ĐK** (16.5 – C11 d) · G8 **Đạt** (G8.2: C12 xong – `axe-k8.s4` chạy trong T9 của K2'; G8.3 vẫn Đạt, MOB-S4-05 (a) đã có trong mã, chỉ thiếu dòng Verified của UXD – C11 e).
- Thiếu mềm: 1 dòng có ĐK (≤ 2 theo 11.2). Không có tình huống nào trong bốn tình huống KHÔNG ĐẠT ở mục 3. Không lỗi tiền P0/P1 Open.

### 11.3 Quyết định chấm lần 3: **ĐẠT CÓ ĐIỀU KIỆN**

Lý do (1 câu): mọi dòng cứng G1, G2, G4, G5, G7 đạt trên `21bb797` – lượt T9 gần nhất chạy lúc 00:14–00:25 giờ VN xanh, gồm đúng ca đã đỏ lúc 02:40 và 4 ca giờ đêm mới, 0 retry – còn nhóm mềm chỉ G6 "Đạt có ĐK", và các điều kiện ở 11.5 không chặn Sprint 4 nhưng phải xong đúng hạn.

Đọc kỹ để không hiểu sai:
- Cổng lần 2 trượt vì một lượt T9 đỏ chưa giải thích. Lượt đó hóa ra là **lỗi sản phẩm thật** (BUG-R2-211) và kéo ra thêm một **lỗi tiền P0 phía client** (213). Cả ba đã sửa, có ca giờ đêm, kiểm ngược đỏ trên bản cũ, nay Closed.
- Mã tiền phía server **không đổi** từ lần chấm 1. 213 được đóng bằng ARC review + ca kiểm số đêm, theo ORC decision-log 20/10, không bằng lượt kiểm tiền riêng.
- Lượt lịch đêm 20/10 (19:17 UTC) **chưa chạy** lúc chấm. QC không chờ nó, vì 10.4 cho phép dispatch sau 17:00 UTC. Nhưng nếu lượt đó đỏ, quyết định này mở lại (C14).

### 11.4 Đóng BUG-R2-211, 212, 213

- **QC đóng cả ba** trong `qa/bug-list.md` (dòng 211–213, tổng hợp mục 1, mục 11.41), theo đúng điều kiện QA đã đặt ở 11.39: "Closed sau CI của commit gộp"; riêng 213 thêm C1, đã đạt ở dòng K2' (2b). QC không đổi mức lỗi.
- Bảng tổng sau khi đóng: 213 lỗi; P0 11/11 Closed; P1 68/68 Closed; P2 76 Closed, 2 Open (208, 209), 1 Deferred (074); P3 40 Closed, 15 Open. **0 P0/P1 Open hoặc Fixed.**

### 11.5 Điều kiện còn giữ (sau chấm lần 3)

| # | Điều kiện | Vai | Hạn | Tình trạng lúc chấm |
|---|---|---|---|---|
| C1 | Đóng băng mã tiền **tới đây hết hiệu lực cho Sprint 4** (QC chấm xong). Phần R3 giữ nguyên: 208, 209, 210, ARC 16.31, BUG-R2-123 qua lượt kiểm tiền riêng có critic đọc log gốc | ORC, BE-A/B | R3 Sprint 1 | Giữ (phần R3) |
| C2–C10 | Giữ nguyên mục 6 | như mục 6 | như mục 6 | Chưa kiểm lại ở lần này (ngoài phạm vi rút gọn) |
| C11 (a) | BE-B review mã BE-65 | BE-B | Trước QC Round 2 | **Xong** – `responses/s4-BE-B.md` mục 1: "OK – không mở thẻ", đọc 5 vùng (attachment, work-orders, housekeeping, registration, 0078) |
| C11 (b) | BE-B, BE-C ghi Deferred SEC-BE-74, 75, 79, 83 | BE-B, BE-C | Trước QC Round 2 | **Xong** – `s4-BE-B.md` mục 2 (83 → R3-Q22; 74/79 review, 75 → R3-Q17); `s4-BE-C.md` (74, 75, 79 → R3-Q17, hạn trước dữ liệu thật) |
| C11 (c) | SEC ghi điều kiện review 208 | SEC | Trước QC Round 2 | **Xong** – `s4-SEC.md` mục F: thứ tự 207 → 210 → 208, SEC review trên commit gộp, 5 nhóm test bắt buộc, không mở đường MGR void nợ |
| C11 (d) | ORC điền "Ngày / Dòng decision-log" ở `sprint-4-plan.md` 16.5 | ORC | Trước QC Round 2 | **Chưa** – dòng 644 vẫn "Ngày: ____ · Dòng decision-log: ____" (decision-log 19/10 "ORC – K9" đã có, chỉ cần trỏ) |
| C11 (e) | UXD xác nhận axe H23 (G.2) và ghi Verified MOB-S4-05 (a) | UXD | Trước QC Round 2 | **Chưa** – G.2 vẫn "UXD xác nhận kết quả axe khi ORC nhắn"; thẻ MOB-S4-05 "Trạng thái: Open" dù phần (a) đã kiểm. Dẫn chứng cho UXD: TC-X-087 (H23) ✓ trong push 39364680576 và T9 39462961483 |
| C12 | `axe-k8.s4` có trong lượt T9 của K2' | QA, ORC | – | **Xong** – TC-X-084…087 ✓ trong 39462961483 |
| C13 | Báo cáo "CI/T9 xanh" dẫn lượt T9 gần nhất + `gh run list -L 5` | QA, DATA, ORC | Từ nay | Giữ |
| **C14 (mới)** | Lượt T9 lịch đầu tiên trên `21bb797` (hoặc commit con chỉ đổi tài liệu) – dự kiến 20/10 19:17 UTC = 02:17 giờ VN – phải xanh, 0 `retry #`. **Nếu đỏ:** QA ghi bug-list trong ngày, QC mở lại G5.2 và quyết định này. ORC dẫn run đó trong tổng kết Round 2 | ORC, QA | Trước tổng kết Round 2 | Chưa tới giờ |
| (kiểm thêm) | Ba thẻ ARC mục F dời R3 có dòng backlog | PO | – | **Xong** – `backlog.md` R3-Q36 (FE-S4-01), R3-Q37 (MOB-S4-01), R3-Q38 (FE-S4-02, hợp đồng 0.3.8). Không thành điều kiện |

### 11.6 Giả định và những gì QC chưa kiểm được (chấm lần 3)

- Giả định: "khung giờ đêm" của 10.4 = 00:00–05:59 giờ VN (trước mốc `business_day_rollover` 06:00). Lượt dispatch tạo 00:05, E2E chạy 00:14–00:25 giờ VN, nên TC-X-074 (đồng hồ thật) chạy trong khung. Lượt đỏ gốc lúc 02:40 cũng trong khung này.
- Giả định: chấp nhận ARC review thay lượt kiểm tiền cho 213 theo ORC decision-log 20/10, vì QC xác nhận độc lập 0 dòng mã tiền phía server đổi. Nếu INV hay DOM thấy cần đi tiếp tới nhận phòng + B9a lúc đêm, đó là ca bổ sung R3, không mở lại 213.
- Giả định: S4-21 Verified trên `c293ceb` vẫn có giá trị ở `21bb797` vì `registration` không đổi.
- QC chưa đếm riêng `s438-r8` và `WRITES` 11/11 trong push 39364680576 (bước kiểm `WRITES` success; tổng API 2.971 = đúng số của K3). QC chưa đọc artifact `t9-playwright-report` của lượt xanh.
- QC không chạy stack, không chạy test DB, không đi luồng bằng tay, không đụng stack demo, không in tệp env. Mọi số liệu CI lấy từ log GitHub QC tự tải.

ESC mới: **không có**. Quyết định cổng sprint ở Round 2 thuộc quyền QC.

### 11.7 Cập nhật điều kiện 21/10 (khi chấm cổng QC Round 2)

- **C14: Đạt.** Lượt T9 theo lịch **39485554354** (schedule) trên `21bb797`, tạo 2026-10-20T19:41:10Z = 02:41 giờ VN 21/10, **xanh**. QC tự tải log: `Running 2045 tests`, 1.976 đạt, 69 bỏ qua, 0 ✘, **0 dòng `retry #`**; TC-X-074 ✓ (#1792), `axe-k8.s4` TC-X-084…087 ✓; API 2.971 đạt; gitleaks 148 commit no leaks. Quyết định ĐẠT CÓ ĐIỀU KIỆN ở 11.3 **không mở lại**; G5.2 giữ Đạt.
- **C11 (d): Đạt** – `sprint-4-plan.md` dòng 644 đã có "Ngày: 19/10/2026 · Dòng decision-log: 'ORC – K9 (cổng QC Sprint 4)' ngày 2026-10-19".
- **C11 (e): Đạt** – `s4-UXD-brand.md` dòng 499 (MOB-S4-05 (a) Verified 21/10, `21bb797`) và dòng 549 (K8 axe Verified, gồm H23).
- C3 (DOM BR-525-16) và C8 (UXR T6/T7) chưa thấy bằng chứng – chuyển vào cổng QC Round 2 (`round-qc-gate.md` R-4). Các điều kiện còn lại chuyển sang `round-qc-gate.md` mục 3 và 6.
