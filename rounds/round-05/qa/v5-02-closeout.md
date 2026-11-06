# V5-02 – Đóng sổ lỗi đã sửa (QC Round 4 ĐK-7)

- Tác giả: QA · Round 5 (bảo trì v1.0.5) · Bước **Sản xuất**, Gói 0 · 06/11/2026 · Hạn 10/11.
- Việc: `rounds/round-05/plan.md` V5-02 và phụ lục A (A1, A2, A3, A5); `rounds/round-04/qc/round-4-closeout-gate.md` ĐK-7.
- Tệp đã sửa: `rounds/round-04/qa/bug-list.md`, `rounds/round-04/qa/bug-list-v1.0.4.md`, `rounds/round-01/qa/bug-list.md`, `rounds/round-03/qa/bug-list.md`.

## 0. Cách làm và luật đóng

QA chỉ đọc mã, test và biên bản. QA không gọi API staging hay production, không SSH, không đăng nhập Desk.

Một lỗi chuyển **Closed** khi có đủ ba thứ:
1. PR hoặc commit đã gộp `main`.
2. Commit đó là tổ tiên của bản production v1.0.4 = `6414be25`. Bản này có tag `v1.0.4`, image `sha-6414be25f20d`, Release 06/11 14:10.
3. Có ca test hoặc lượt kiểm staging **đã chạy** và có kết quả ghi lại.

Với lỗi tài liệu, điều 3 là QA đọc lại tài liệu trên `6414be25`. Thiếu một trong ba thì giữ trạng thái và ghi thiếu gì.

Nguồn bằng chứng dùng chung:

| Mã | Bằng chứng | Nguồn |
|---|---|---|
| CI | Run `41999716963` (push `6414be25`, 05/11) xanh mọi job: unit + build, E2E (`pnpm test:e2e`: API, RBAC, desk-chromium, desk-clock), API contract `--strict`, no test endpoints | `gh run view 41999716963` |
| Mã cắt | `0d11db20`. Từ `0d11db20` tới `6414be25`, mã sản phẩm chỉ đổi `guest-portal.service.ts` (BUG-R4-053) và test của 053. `admin-web/src` không đổi từ `f670d99b` tới `6414be25` | `git diff` |
| QA-13 | QA chạy trên mã cắt 05/11. Unit: api 4152, admin-web 994/994, mobile 162/162. E2E đủ bộ: 2077 ca, 0 hỏng, 0 flaky. RG-12: 0/120 lượt đỏ. Spec tạm RG-13/15/17/21/23/27/28/29, `zz-qa039` đạt | `rounds/round-04/qa/v1.0.4-qa-round2-plan.md` mục 13 |
| STG | Ca staging do ORC chạy, QA đọc kết quả. HD-*, PA-*, PR-*, RG-14, RG-23 (b), RG-34, CO-05. RG-35 ĐẠT 05/11 16:39 trên `sha-6414be25f20d` | `rounds/round-04/qa/v1.0.4-stg-api-checklist.md` mục 5 |
| PROD-RO | Gói chỉ đọc trên production, chạy 05/11 12:40 (trước P0 của v1.0.4). M1 `TONG\|0\|0\|0\|0\|0\|0\|0\|0\|0\|0`; M2 `0\|0\|0\|0\|0`; M3a, M3c, M3d, M4c đều 0 | `rounds/round-04/qa/v1.0.4-prod-readonly-pack.md` mục 5 |

Mọi commit gộp nêu ở mục 2 và 6 đều là tổ tiên của `6414be25` (đã kiểm bằng `git merge-base --is-ancestor`).

## 1. Kết quả

| Bug list | Dòng xử lý | Closed | Giữ (thiếu bằng chứng) |
|---|---|---|---|
| R4 – `bug-list.md` + `bug-list-v1.0.4.md` (28 lỗi "đã sửa, chờ QA") | 28 | **23**: P0 4 (037, 038, 046, 048) · P1 3 (035, 042, 053) · P2 5 (029, 044, 045, 047, 050) · P3 11 (010, 015, 020, 024, 025, 026, 030, 031, 033, 034, 049) | 5: P1 039 · P2 032, 011 · P3 012, 023 |
| R1 – `rounds/round-01/qa/bug-list.md` (phụ lục A5) | 14 | **13**: P2 1 (SEC-10) · P3 12 | 1: BUG-R1-023 (P3, chưa sửa) |
| R3 – `rounds/round-03/qa/bug-list.md` (phụ lục A3, loại (c)) | 14 | **13**: P1 1 (042) · P2 7 · P3 5 | 1: BUG-R3-032 (P1) → **Fixed**, chờ SEC V3-07 |

- 8 lỗi P0/P1 của ĐK-7: 7 Closed. **BUG-R4-039 chưa Closed** vì còn thiếu lần đếm trên production sau phát hành (mục 4).
- Không có P0/P1 nào hóa ra chưa sửa trên production, nên không cần hotfix theo protocol 9.3 và không cần báo INV ngay.
- Đã sửa ô P3 "Closed" ở bảng tổng của `bug-list.md`: bản trước ghi 10 nhưng liệt kê 11 mã (tổng 20 vẫn đúng). Sau V5-02: P3 Open 5 / Fixed 0 / Closed 17; Tổng Open 6 / Fixed 0 / Closed 26.
- Không mở lỗi mới. Không có ESC mới.

## 2. R4 – bảng lỗi / bằng chứng / trạng thái mới

Cột "Ca đã chạy": ca test hoặc lượt staging đã có kết quả. Ca STG nào **chưa** có kết quả ghi thì nói rõ, kèm lý do vẫn đóng được.

| Mã | Mức | PR (commit gộp) | Ca đã chạy | Cũ → Mới |
|---|---|---|---|---|
| BUG-R4-010 | P3 | Tài liệu, `8ef3ce90` (hướng dẫn 1.4, `main` 01/11) | QA đọc lại trên `6414be25`. Không còn "Đã đổi: {cũ} → {mới}". `02-le-tan.md` (dòng 1290, 1515), `05-sale-ctv.md` (280–281), `user-manual-v1.0.md` (1420) dùng đúng chữ Desk `webreq.estimate_changed`. Bảng 13.1d có dòng Tiếng Nga với câu `sale.text_lang_note.ru` (dòng 1311) | Mở lại → **Closed** |
| BUG-R4-011 | P2 | #34 (`7224e8fd`) | Test LP-v2 (QC LP-v2 mục 3). **P10 trên Desk staging chưa chạy** | Open (giữ) |
| BUG-R4-012 | P3 | #34 | Test api trên Postgres thật (QC LP-v2 mục 3). **P10 chưa chạy** | Open (giữ) |
| BUG-R4-015 | P3 | #57 (`39f496d0`) | `rooms-scheduled-prices-v101` (409 `first_price`) trong CI và QA-13. STG PR-02, PR-03 ĐẠT 05/11 | Open → **Closed** |
| BUG-R4-020 | P3 | #53 (`c0eff08b`) | Unit `v104-users-fea`, `users.test` trong CI và QA-13. MF-09…12 STG chưa có kết quả. Vẫn đóng được: có unit, đường đã lên production | Open → **Closed** |
| BUG-R4-023 | P3 | #53 | Unit `v104-users-fea`, `v103-email-fea`. **Chưa có ảnh C1-07, C1-22 và HTML sổ tay** (điều kiện đóng ghi từ 03/11) | Open (giữ) |
| BUG-R4-024 | P3 | #53 | Unit `v104-users-fea`, `v103-email-fea`, `r3-s1-feb-us008` trong CI và QA-13. MF-13 STG chưa có kết quả | Open → **Closed** |
| BUG-R4-025 | P3 | Tài liệu: PO `abb7ee48`, `870f2480`; BA `2b7d60b8`; HTML `ae7ae095`; DOM ĐẠT `a642e170` | QA đọc lại trên `6414be25`: release notes dòng 244, 277; sổ tay bỏ câu "trả phòng sau đó không tạo thêm". Chữ Desk `early_departure.row_refund_help` nêu đúng ngoại lệ BR-428 (LE-06, đọc) | Fixed → **Closed** |
| BUG-R4-026 | P3 | #52 (`386672a6`) | Unit `v104-money-labels-fea` trong CI và QA-13. ML-01, 02 STG chưa có kết quả | Open → **Closed** |
| BUG-R4-029 | P2 | #61 (`6800cc45`) | QA-13: unit chạy không cache, `production-bootstrap` 11/11 không bỏ ca nào. CI xanh | Đã gộp → **Closed** |
| BUG-R4-030 | P3 | #61 | QA-13: `api-client` 37/37 không cache | Đã gộp → **Closed** |
| BUG-R4-031 | P3 | #61 | QA-13: `integrations` 296/296 không cache | Đã gộp → **Closed** |
| BUG-R4-032 | P2 | #63 (`c2506a53`). **#69 còn OPEN** | QA2 05/11 đọc #63. Sổ tay `main` còn 5 câu "không bật đăng nhập 2 bước ở v1.0.x": `01` dòng 228; `user-manual-v1.0.md` dòng 380, 1524, 1594, 1676. MN-02 chưa làm | Đã gộp #63 (giữ) |
| BUG-R4-033 | P3 | #62 (`b2a8b2a8`) | QA-13: E2E 2077 ca, 0 flaky. CI xanh | Đã gộp → **Closed** |
| BUG-R4-034 | P3 | #62 | Như 033 | Đã gộp → **Closed** |
| BUG-R4-035 | **P1** | #67 (`217afac0`) | Unit `v104-minibar-prefill-fea` (khối "s4-144 – H16 minibar prefill race" và "BUG-R4-035 – after B14…"). E2E `ui-clock/checkout.h16`, `b14-fridges.s5`, `minibar-recount.s4` chạy trong CI trên `6414be25` và trong QA-13. QA2 05/11: gỡ từng phần sửa thì ca đỏ; tải 12 × 10 không lỗi assert. PROD-RO M4c `TONG\|0\|0\|0\|0`. Xem mục 2.1 | Đã gộp → **Closed** |
| BUG-R4-037 | **P0** | #70 (`d0ea6dc2`), #73 (`da5c3c4c`) | QA-13: RG-12 0/120, RG-17 + RG-13 `zz-qa70c` 4/4. CI xanh. PROD-RO M3a `TOTAL\|ALL\|0\|0\|0\|0` | Đã gộp → **Closed** |
| BUG-R4-038 | **P0** | #71 (`2c8cd8cf`) | Test BE trong CI và QA-13. Stack local 9/9 ca API. PROD-RO M3c `TOTAL\|ALL\|0\|0\|0\|0\|0\|0` | Đã gộp → **Closed** |
| BUG-R4-039 | **P1** | #74 (`2f535924`), #77 (`c9af9f4c`) | STG RG-14 ĐẠT 06/11 09:46 trên `sha-6414be25f20d`: FDL/FD xin ngoại lệ → 409 `CHECKIN_CONDITIONS_NOT_MET`, `held_by_other_stay`, không `overridableBy`. QA-13 `zz-qa039` 1/1. CI xanh. PROD-RO 05/11 = 0 nhưng chạy **trước** P0. **Thiếu lần đếm sau phát hành** | Đã gộp → **Đã sửa, đã xác nhận** (chưa Closed) |
| BUG-R4-042 | **P1** | #81 (`3e6a762b`) | QA-13 RG-21 `zz-qa83-race` R1–R7 7/7. Unit FE 5/5. CI xanh. PROD-RO M4c 0 | Đã gộp → **Closed** |
| BUG-R4-044 | P2 | #80 (`901fd022`) | QA-13 RG-23 12/12 + 1/1 ở múi giờ VN và UTC. STG RG-23 (b) ĐẠT 05/11 | Đã gộp → **Closed** |
| BUG-R4-045 | P2 | #83 (`0df6a67b`) | QA-13 RG-29 trong `zz-qa83-race` 7/7. CI xanh | Đã gộp → **Closed** |
| BUG-R4-046 | **P0** | #82 (`f9ff4e1f`) | QA-13 RG-27 `zz-qa82-rg27` 6/6. CI xanh. PROD-RO M3d `TONG\|0\|0\|0\|0\|0\|0\|0\|0` | Đã gộp → **Closed** |
| BUG-R4-047 | P2 | #83 | QA-13 RG-28 trong `zz-qa83-race` 7/7 | Đã gộp → **Closed** |
| BUG-R4-048 | **P0** | #83 | QA-13 R6, R7 trong `zz-qa83-race`; unit S2a. Lỗi chỉ có trên nhánh #83, chưa từng lên production | Đã gộp → **Closed** |
| BUG-R4-049 | P3 | #84 (`a9da6be4`) | Unit `bug-r4-049-fea` trong CI và QA-13 (admin-web 994/994). RG-30 (e) STG chưa chạy. Vẫn đóng được: unit đỏ trên trang cũ, xanh trên bản sửa | Đã gộp → **Closed** |
| BUG-R4-050 | P2 | #86 (`5b785535`) | RG-31 (a)–(g) đạt trên `main` `f670d99b` + #87. QA-13 desk-clock 54 đạt, 1 bỏ qua. Ca cần đồng hồ giả, nên không có ca STG. Điều kiện "chờ phát hành" đã xong | Đã gộp → **Closed** |
| BUG-R4-053 | **P1** | #91 (gộp ở chính `6414be25`) | STG RG-35 ĐẠT 05/11 16:39 trên `sha-6414be25f20d`: `consent_record` và `online_checkin` cùng `privacy-2026-10-v2\|ru`. Test BE 24/24 × 4 lượt (`rounds/round-04/reviews/QA-on-pr91.md`). N6 trên production là lượt kiểm riêng của SEC, không phải điều kiện đóng | Đã sửa → **Closed** |

Không thuộc 28 lỗi nên không đổi: 017, 054, 057 (`bug-list.md`); 036, 040, 041, 043, 051, 052 (`bug-list-v1.0.4.md`). Plan R5 đã xếp các lỗi này vào (a) hoặc (b).

### 2.1 BUG-R4-035 – kiểm lại theo ĐK-7

ĐK-7 cho hai cách: Desk staging cùng digest, hoặc bằng chứng E2E trên commit đã phát hành. QA dùng cách thứ hai.
- Mã: `admin-web/src` của `6414be25` giống hệt `f670d99b`, chứa #67.
- Test chống tái phát:
  - `v104-minibar-prefill-fea` có khối riêng cho cuộc đua ở s4-144 và cho tủ B sau B14;
  - ba spec E2E của H16 và B14 chạy trong job E2E của CI `41999716963` (desk-clock không bị bỏ qua: CI chặn junit thiếu ca UI).
- Dữ liệu production: M4c = 0 lần đếm minibar về 0 thay lần trước có tính tiền (05/11 12:40).
- Desk staging không làm thêm được gì. Cuộc đua phụ thuộc thời điểm, khó tái hiện bằng tay. C9 "2 tủ" (06/11) đã bỏ vì thiếu căn.

## 3. Lỗi còn thiếu bằng chứng (giữ trạng thái)

| Mã | Mức | Có gì | Thiếu gì | Ai, việc nào |
|---|---|---|---|---|
| BUG-R4-039 | P1 | Bản sửa trên production; RG-14 ĐẠT trên staging cùng digest | Đếm chỉ đọc M1/M2/M2b trên production **sau** 06/11 14:10. Lần 05/11 12:40 trước P0, còn hở khoảng 25,5 giờ lỗi còn chạy | ORC, theo mục 4. Đạt thì ORC chuyển Closed, không cần QA chạy lại |
| BUG-R4-032 | P2 | #63 đã gộp: có đường Đặt lại xác thực 2 bước | #69 (`v104/ba-2fa-ungate`) còn OPEN, MN-02 chưa làm; 5 câu dặn sai còn trong sổ tay | ORC gộp #69: điều kiện "sau khi v1.0.4 lên production" đã đủ. BA làm MN-02 rồi QA đọc lại |
| BUG-R4-011 | P2 | Bản sửa trong `6414be25` | P10 trên Desk staging: 3 đường từ yêu cầu Zalo ko/zh/ru/vi, hồ sơ lưu `zalo` | V5-03. Bước ở `rounds/round-04/qa/lp-v2-staging-s6.md` mục 4 |
| BUG-R4-012 | P3 | Bản sửa trong `6414be25` | P10: hồ sơ tạo nhanh lưu quốc tịch NULL, Desk hiện "–" | V5-03, cùng lượt với 011 |
| BUG-R4-023 | P3 | Mã đã sửa ở #53 | Ảnh `C1-07.png`, `C1-22.png` chụp lại và sổ tay HTML dựng lại | V5-04 (UXD chụp, QA kiểm che) |
| BUG-R1-023 | P3 | – | Chưa sửa (mục 5) | BA, sửa `product/docs/rbac-matrix.json` |
| BUG-R3-032 | P1 | v1.0.3 trên production từ 04/11; K8 04/11 07:14 INV đã nhận thư; E1 05/11 11:50 `email_dead` = 0 trong 24 giờ | SEC V3-07 (QC v1.0.3: "chỉ đóng sau K8 và SEC V3-07"). E1 còn `email_missing` = 1: tài khoản quản lý chưa nhập email | Tài khoản quản lý tự nhập email (sổ tay `01` 1.6a), ORC chạy lại E1, rồi SEC ghi V3-07 |

BUG-R3-032 không cần ESC: ESC-040 coi lỗi là "đã sửa" khi v1.0.3 chạy production và INV nhận thư ở K8. Cả hai đã xong trước hạn 09/11.

## 4. Bước ORC chạy cho BUG-R4-039 (production, chỉ đọc)

Không cần Desk staging. Cần một lần đọc trên production bằng gói đã duyệt:
- gói: `rounds/round-04/qa/v1.0.4-prod-readonly-pack.md`;
- SEC duyệt 05/11; vai `ottimo_readonly`, giao dịch READ ONLY.

1. **Thời điểm.** Gộp vào lần SSH kéo sao lưu ĐK-3 (chậm nhất 08/11 khoảng 19:00), khi INV cho phép SSH trong ngày. Hỏi INV cho phép cả việc chạy lại gói chỉ đọc này. Quyền ngày 05/11 chỉ dành cho lần chạy trước. Không chạy khi `deploy.sh` hoặc migrate đang chạy (luật 1 của gói).
2. **Trích và kiểm.** Làm đúng mục 2.1 của gói, từ commit `331bbbd6` (commit đã dùng 05/11):
   - trích khối bằng `git show`;
   - `shasum -a 256` phải khớp cả 12 dòng của bảng 2.1. Dòng `pack1.sql` = `8c85549a…0ad2`.
   - Lệch một dòng thì không chạy, báo SEC.
3. **Chạy** `bash "$W/pack1.sh"`, một lần gọi. Không `tee`, không `>`. Không chạy khối chat (`pack2`–`pack4`, `be1`, `be4`) nếu cổng số đếm không mở.
4. **Đúng là:**
   - 5 dòng chốt phiên: `on`, `ottimo_readonly`, `30s`, `3s`, `t|f`.
   - M1: `TONG|0|0|0|0|0|0|0|0|0|0`.
   - M2: `0|0|0|n|k`, với `n` ≤ 10 và `n` khớp số căn "Đang ở" trên rack Desk.
   - M2b: không dòng nào, hoặc mọi dòng có `buong_oc_od` = 0 và `can_con_luot_dang_o_khac` = 0.
   - Dòng cuối là `#END`.
   - M3a, M3c, M3d, M4c chạy cùng khối. "Đúng là" 0 như mục 3.4–3.10. Đây là kiểm lại cho 037, 038, 046, 035/042, không phải điều kiện của 039.
5. **Ghi.** Dán nguyên các dòng vào mục 5 của gói, thêm cột "Lúc chạy". Chỉ ghi số đếm, không ghi mã đơn, số căn hay ngày từng ca. Nếu M1 và M2 đúng như bước 4:
   - ORC chuyển BUG-R4-039 sang **Closed** ở `rounds/round-04/qa/bug-list-v1.0.4.md`, cả bảng Tóm tắt và dòng Trạng thái;
   - ghi "Closed <ngày> – PROD-RO sau phát hành đạt";
   - không cần QA chạy lại.
6. **Khác "Đúng là":** làm theo ngưỡng ở mục 3.1–3.3 của gói, gồm báo INV trong chat, hỏi trước khi chạy CHAT-M1 và để SEC tạo ESC Gấp nếu `ca_tu_ngay_d` ≥ 1. Có thêm ca (a) hoặc (b) thì BUG-R4-039 giữ trạng thái, và QA mở lại phần tác động dữ liệu.
7. **Lỗi khi chạy.** Câu hỏi có thể vấp schema mới của v1.0.4: gói viết cho 68 migration, staging v1.0.4 có 72. Nếu `ERROR` hoặc thiếu `#END`: dừng, chỉ báo QA mục `#M…` và loại lỗi (luật 4 của gói). QA sửa gói và gửi SEC duyệt lại. Không sửa câu tại chỗ.

**Desk staging:** V5-02 không cần lượt Desk staging nào. P10 của 011/012 thuộc V5-03; ảnh của 023 thuộc V5-04.

## 5. R1 – dọn 14 dòng (phụ lục A5)

Kiểm trên `6414be25`.

| Mã | Mức | Cũ | Mới | Lý do, bằng chứng |
|---|---|---|---|---|
| BUG-R1-010 | P3 | Deferred R2 | **Closed** | OpenAPI 0.3.12 có nhóm đơn SM-16 (`createReservationGroup`, `addReservationGroupMember`, `allocateGroupDeposit`…) và ca SM-17 (`openShift`, `startShiftClosing`, `reopenShift`…), `x-round: R3` |
| BUG-R1-014 | P3 | Open | **Closed** | `BillNo` `^F\d{2}-\d{6,}$`, ví dụ `F26-000123` (BR-007); không còn `F-yymmdd-nnnn` |
| BUG-R1-015 | P3 | Open | **Closed** (theo quy ước) | `test-strategy.md` 4.5 (16/10): `WO-031` trong wireframe là nhãn seed, không phải mã thật. Hifi, `design-system.md`, `content-guide.md`, OpenAPI, schema dùng `WO-00034`. Wireframe L1–L10 còn 7 chỗ `WO-031`/`WO-034`, không chặn |
| BUG-R1-016 | P3 | Fixed (quy ước) | **Closed** | Quy ước nhãn seed ở `test-strategy.md` 4.5; `validate-fixtures` OK (QA-13) |
| BUG-R1-017 | P3 | Open | **Closed** | `product/docs` không còn "74 story"; OpenAPI ghi "77 story Must R2 (BUG-R1-017)" |
| BUG-R1-020 | P3 | Deferred R3 | **Closed** (thay thế) | Chuyển còn "TRỐNG" ở `traceability.md` thuộc tính năng chưa có mã (SM-16, SM-17: `x-round: R3`, chưa có trong API/Desk). Phần đã làm có ca trong test case theo từng bản (R2–R4) |
| BUG-R1-021 | P3 | Deferred R2 | **Closed** | CI job "API contract (spec validator · RBAC --strict)" chạy `openapi-spec-validator` và `gen_traceability.py --strict`; xanh ở CI |
| BUG-R1-022 | P3 | Deferred R3 | **Closed** (thay thế) | US-041, US-064 dời v1.3 trong backlog; endpoint và wireframe làm khi story vào bản. US-137 (Trả sớm) đã ra ở v1.0.2 |
| BUG-R1-023 | P3 | Open | **Open** (giữ) | Chưa sửa: `openapi_check.differences` còn 3 mục cũ (`cancelRequest`, `listApprovalRequests` ghi thiếu `collaborator`, nhưng OpenAPI đã có; `setMyApprovalPin`). `A22.note` còn "OpenAPI x-rbac A22 = issueGuestLink…", trong khi `issueGuestLink` dùng `A22a` và `A22.operationIds` = `[]` |
| BUG-R1-SEC-06 | P3 | Deferred R2 | **Closed** | `infra/postgres/init/02-roles.sh`: `ottimo_owner` NOLOGIN; có `ottimo_migrator` (LOGIN, NOINHERIT); CI dùng đúng các vai này |
| BUG-R1-SEC-07 | P3 | Deferred R2 | **Closed** | `services/api/src/config.ts`: `GUEST_CODE_SIGNING_KEY` là khóa bắt buộc khi khởi động, dùng cho HMAC `code_hash`, tách khỏi `ID_HASH_KEY` |
| BUG-R1-SEC-08 | P3 | Deferred R2 | **Closed** | CI job "no test endpoints in production contract" và bước chặn `TestSupportModule` / `/__test__` trong image production; smoke production PS-02 đạt 06/11 |
| BUG-R1-SEC-10 | P2 | Deferred R2 | **Closed** | `getDoorCredential`, `setDoorCredential` có `x-step-up: true`, `x-c3-log`, response 401/403 |
| BUG-R1-SEC-11 | P3 | Deferred R2 | **Closed** | `x-c3-log` ở 22 operation; `setParameter` `x-rbac` có A119; `--strict` xanh |

Bảng tổng R1 sau dọn: 34 lỗi = Open 1 / Reopened 0 / Closed 33 / Deferred 0.

## 6. R3 – dọn 14 dòng loại (c) (phụ lục A3)

| Mã | Mức | PR (commit gộp) | Bằng chứng | Mới |
|---|---|---|---|---|
| BUG-R3-018 (phần 1) | P2 | #22 (`4ace6073`, v1.0.2) | `v101-scheduled-prices-fea`, `rooms-scheduled-prices-v101` trong CI; STG PR-02, PR-03 ĐẠT 05/11 | **Closed** (cả lỗi) |
| BUG-R3-024 | P3 | #64 (`9fded27f`) | Unit `v104-checkout-feb` khối BUG-R3-024, `checkout.test` trong CI. CO-02 STG chưa có kết quả | **Closed** |
| BUG-R3-029 | P3 | #39 (`0aec8b7a`) | Unit mobile `v104-mfa-signin`: không còn câu "Đăng nhập 2 bước sẽ có ở bản sau". Mobile 162/162 (QA-13) | **Closed** |
| BUG-R3-032 | P1 | #31 (`958e8da0`, v1.0.3) | K8 04/11 INV nhận thư; E1 05/11 `email_dead` 0. Chờ SEC V3-07 (mục 3) | **Fixed** (chưa Closed) |
| BUG-R3-040 | P3 | #14 (`8b3aec89`), ngăn tái phát | Ghi nhận, bản ghi cũ không sửa được (audit chỉ ghi thêm). 2 CLI `import '../audit-entities'`; test `worker-audit-registry` trong CI | **Closed** |
| BUG-R3-041 | P2 | #50 (`4f9267d9`) | STG HD-09…HD-13 ĐẠT 05/11; HD-27 ĐẠT 06/11 (SSE: giới hạn đo) | **Closed** |
| BUG-R3-042 | P1 | #50, #54 (`e5fb9578`) | HD-05…HD-08 đạt trên head đã gộp; unit `v104-holds-feb`, `v104-holds` trong CI; STG HD-20 ĐẠT 05/11 và 06/11 | **Closed** |
| BUG-R3-043 | P2 | #54 | STG HD-23/HD-26, HD-24, HD-25 ĐẠT 05/11 | **Closed** |
| BUG-R3-044 | P2 | #54 | STG HD-19 ĐẠT 05/11; HD-29, HD-31 ĐẠT 06/11; HD-22 đạt trên head đã gộp | **Closed** |
| BUG-R3-045 | P3 | #52 (`386672a6`) | Unit `v104-money-labels-fea` khối BUG-R3-045 trong CI. ML-06, 07 STG chưa có kết quả | **Closed** |
| BUG-R3-046 | P2 | #54 | STG HD-30 ĐẠT 05/11 và 06/11; HD-32 ĐẠT 05/11 | **Closed** |
| BUG-R3-050 | P3 | – (tách lỗi) | R4 lượt 3 xác nhận phần ngôn ngữ, SĐT/WhatsApp, mở lại báo giá. Phần còn lại là BUG-R4-011, 012 | **Closed** (thay thế) |
| BUG-R3-052 | P2 | #39 | Unit mobile `v104-mfa-signin` khối BUG-R3-052 trong CI. MF-07, 08 STG chưa có kết quả | **Closed** |
| BUG-R3-053 | P2 | #44 (`c280617b`) | Unit `v104-maint-rooms-fea` trong CI. MT-01 STG chưa có kết quả | **Closed** |

Bảng tổng R3 sau dọn: 58 lỗi = Open 19 / Fixed 1 / Closed 38.

## 6a. R2 – 4 dòng loại (c) (phụ lục A4, ORC giao thêm 06/11)

| Mã | Mức | PR (commit gộp) | Bằng chứng | Mới |
|---|---|---|---|---|
| BUG-R2-097 | P3 | #52 (`386672a6`, P4-41) | `MoneyPage.tsx` dòng 872 dùng `Math.abs`. Unit `v104-money-labels-fea` khối "BUG-R2-097 – refund paid sentence" trong CI và QA-13. ML-05 STG chưa có kết quả | **Closed** |
| BUG-R2-103 | P3 | Đã sửa từ R2 Sprint 4 (`20f69f8d`, 18/10) | `ReservationDrawer.tsx` `linesShown`: có danh sách dòng thì chỉ một "Còn phải thu". Unit `s4-50b-fea` ca "103 … chỉ một dòng" trong CI và QA-13. Dòng trạng thái R2 chưa cập nhật từ R2. ML-04 STG chưa có kết quả | **Closed** |
| BUG-R2-216 | P3 | #60 (`58183764`) | Unit `v104-hold-dialog-feb`. HD-01 3/3 lượt local; `zz-qa104-holds` 4/4 trên mã cắt (QA-13) | **Closed** |
| BUG-R2-219 | P3 | #60 | Unit `v104-hold-dialog-feb`. HD-02 3/3 lượt local; `zz-qa104-holds` 4/4 trên mã cắt | **Closed** |

Bảng tổng R2 sau dọn (bảng chỉ đếm 213 lỗi đầu, chưa cộng 214–222): P3 Open 12 / Closed 43; Tổng Open 12 / Deferred 1 / Closed 200.

## 7. Phát hiện khác (không phải lỗi mới)

1. **Plan R5 có 3 chỗ không khớp bằng chứng.** ORC sửa phụ lục khi tiện:
   - A2 ghi BUG-R4-032 "#63 và #69 đã gộp". Thực tế #69 còn OPEN.
   - A5 ghi BUG-R1-023 "đã xử lý". Thực tế chưa sửa.
   - A3 ghi BUG-R3-032 "Sửa ở v1.0.3". Đúng về mã, nhưng điều kiện đóng của QC v1.0.3 còn SEC V3-07.
2. **Sổ tay còn hộp "Lỗi nhỏ đã biết" tả lỗi v1.0.4 đã sửa.** Số dòng tính tại `b9f017f7`. Đề xuất gộp vào V5-08 (BA):
   - BUG-R4-025: `02-le-tan.md` dòng 1033, `user-manual-v1.0.md` dòng 2020;
   - BUG-R4-026: `01-chu-dau-tu-quan-ly.md` dòng 563, `user-manual-v1.0.md` dòng 639;
   - lỗi R2 sửa ở v1.0.4 (216, 219, 097), nay đã Closed (mục 6a): `02-le-tan.md` dòng 300, 1153.
3. **R2 loại (c):** ORC giao thêm ngày 06/11. Cả 4 dòng đã Closed (mục 6a).
4. **`product/docs/qa/traceability.md` bảng SM chưa cập nhật từ R2.** Ví dụ SM-06 H4 "Gia hạn HĐ" vẫn ghi TRỐNG, dù có ca ở test case v1.0.2–v1.0.4. Việc của QA, xếp B-KYTHUAT.
5. **Ca STG của v1.0.4 chưa có kết quả ghi.** `v1.0.4-traceability.md` vẫn ghi "Chưa chạy" ở các ca MF-09…15, ML-01…07, CO-02, MT-01, LE-06, RG-07…11, RG-18, RG-30. QA không dựa vào các ca này để đóng lỗi. Khi ORC có kết quả thì QA chép vào traceability.
6. **Máy QA không chạy được vitest của admin-web** (thiếu liên kết `@ottimo/contracts` trong `node_modules`). Đây là lỗi môi trường local, không phải lỗi sản phẩm. QA không chạy `pnpm install` trên bản làm việc chung. Bằng chứng unit lấy từ CI `41999716963` và QA-13.

## 8. Giả định

- CI `41999716963` trên `6414be25` có chạy thật các tệp test nêu ở mục 2 và 6. Job unit không còn phát lại kết quả test cũ (BUG-R4-029 đã sửa); job E2E có bước chặn khi junit thiếu ca UI.
- Kết quả QA-13 trên `0d11db20` dùng được cho `6414be25`. Lý do: hai bản chỉ khác ở `guest-portal` (BUG-R4-053), và 053 đã có RG-35 trên staging cùng digest.
- Ca staging do ORC chạy và điền ở checklist mục 5 được coi là đã chạy như ghi. QA không có tài khoản staging.
- Lỗi tài liệu (R4-010, R4-025, R1) đóng bằng việc QA đọc lại trên `6414be25`. Không cần lượt staging.
