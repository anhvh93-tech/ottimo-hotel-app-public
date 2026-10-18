# Bảng sẵn sàng trước cổng QC Sprint 4 – Round 2 (tuần Ổn định)

- Người lập: QC | Ngày: 18/10/2026 ~08:30 | Bước: **QC – kiểm tra sẵn sàng**. Đây **không** phải quyết định cổng: QC không chấm ĐẠT / KHÔNG ĐẠT ở tệp này.
- Lý do: cổng S4 đã lùi sang tuần Ổn định theo quy tắc D8 (sprint-4-plan 11.2; decision-log dòng 735). Tệp này cho ORC biết, ngoài phần tiền, còn thiếu gì và ai làm.
- Bản đọc:
  - HEAD = `origin/main` = **`7ac11a4`** (gộp #14, BUG-R2-178). Commit cha là **`723179b`** (gộp #13).
  - CI #13 (run 39085276048) bị **hủy** do `cancel-in-progress` khi #14 được push. Job build/E2E của #13 không có kết luận.
  - CI #14 (run 39085982603): lúc 08:28 có 6 job đã xanh, còn job `format · lint · audit · test · build` đang chạy, sau đó mới tới E2E.
  - CI xanh gần nhất là **#12 `3bd4ac4`** (run 39083129953). QC tự đọc log job E2E: 1.912 đạt, 70 bỏ qua, **0 dòng `retry #`**, 0 dòng ✘, `UI: 84 case(s)`, `axe 13 case(s)`, `WRITES` 11 ca.
- Phần tiền (G1; G7 phần P0/P1) chờ `reviews/s4-money-recheck6.md`. Lúc lập bảng, tệp này **chưa có**.
- Cách kiểm:
  - đọc các tệp ORC giao;
  - `gh run view` và tải log job E2E của #12;
  - đếm bảng tổng `bug-list.md` bằng script (178 dòng; khớp bảng tổng: P0 10 Closed; P1 3 Open, 7 Fixed; P2 13 Open, 3 Fixed, 1 Deferred; P3 21 Open, 4 Fixed);
  - grep mã test e2e, `ci.yml`, các tệp review và báo cáo.
- QC không chạy test, không đi luồng UI, không sửa sản phẩm, không commit. QC chỉ ghi tệp này.

Ký hiệu cột Trạng thái: **Đạt** · **Chưa** · **Chờ S4-38** (chờ báo cáo kiểm lại lần 6) · **Chờ VPS** · **Không áp dụng** (KAD).

---

## 0. Tóm tắt

| Bảng | Số dòng | Đạt | Chưa | Chờ S4-38 | Chờ VPS | KAD |
|---|--:|--:|--:|--:|--:|--:|
| 1. Tiêu chí cổng G1–G8 (mục 11.1, tách theo ý) | 23 | 4 | 16 | 2 | 0 | 1 |
| 2. Việc bắt buộc M1–M8 (mục 3; gồm mục tiêu 1.2) | 8 | 1 | 4 | 3 | 0 | 0 |
| 3. Bốn tình huống KHÔNG ĐẠT (mục 3) | 4 | 1 | 1 | 2 | 0 | 0 |
| 4. Điều kiện ĐK-S3-1…13 | 13 | 9 | 2 | 1 | 1 | 0 |
| 5. Mục CỔNG không phải tiền trong bảng phân loại (mục 6) | 15 | 6 | 8 | 1 | 0 | 0 |

Bảng 2, 3 và 5 trùng một phần với bảng 1 (ví dụ M3 = G2.1 = tình huống 3 = ĐK-S3-11). Danh sách việc **không trùng** ở mục 2.

**Kết luận sẵn sàng (không phải quyết định cổng):**
- Ngoài phần tiền, cổng **chưa sẵn sàng**. Nếu chấm hôm nay thì ba nhóm sau, riêng từng nhóm, đã đủ làm cổng KHÔNG ĐẠT:
  - **G2 (bảo mật):** chưa có dòng SEC Verified nào cho S4-39 (tình huống KHÔNG ĐẠT số 3), cho SEC-G3 và cho các PR Sprint 4 bắt buộc review;
  - **G4 (luồng):** chưa có đối chiếu A7 của DATA;
  - **G5 (CI):** chưa có lượt T9 chạy hằng đêm. Riêng việc CI xanh trên commit chấm thì đang chờ.
- Luồng A1 và A4 đã xanh trên CI và bấm thật trên giao diện. Brand (token, font tự host) đã vào cả 3 app.

---

## 1. Bảng sẵn sàng

### Bảng 1 – Tiêu chí cổng G1–G8 (sprint-4-plan 11.1)

| # | Tiêu chí | Bằng chứng | Trạng thái | Việc còn thiếu – vai |
|---|---|---|---|---|
| G1 | **Tiền** – 055…061 Closed; S4-06/08/13/23 thứ tự/35; S4-21 + S4-04; #6; BUG-038; báo cáo đối kháng 0 ca lệch; S4-37, S4-47 có kết luận | `qa/s4-test-report.md` 7.2: M1 Closed (CI 39042881071 `6f8d429`). Kiểm lại lần 2–5b tìm thêm 125…178. Decision-log 740: S4-37 `otaPenaltyVnd` "không sai tiền". Decision-log 753: S4-47 "không thu vượt" | **Chờ S4-38** | Báo cáo lần 6. Xem mục 3 (việc phần tiền ORC cần gom) – ORC, QA, critic |
| G2.1 | S4-39 / BUG-R2-085 **SEC Verified** (ĐK-S3-11, SEC-G1 b) | BE-C `s4-be-c.md` 1.1. FE: TC-L3-080 (a)(b) ✓ trong CI #12. QA đóng 085 theo CI 39042881071. **`s3-SEC.md` không có dòng Verified cho S4-39**: tệp sửa lần cuối 17/10 15:34, thẻ BE-53 còn "Open – chỉ còn phương án chính", BE-57 và BE-58 (2) còn Open | **Chưa** | SEC kiểm lại phương án chính (`guestUploadPersonIndex`, dồn số ô, PATCH chỉ `partyMemberId`, `DOCUMENT_UNCLAIMED_EXISTS` kèm id, BE-57, BE-58 (2), giấy tờ lễ tân tự nhập chưa gắn người), rồi ghi Verified ở `s3-SEC.md` mục 9 – **SEC** |
| G2.2 | SEC-G3: 8 Major Verified (BE-33…38, FE-06, MOB-01) | QC đếm thẻ trong `s3-SEC.md`: 8 Major ở trạng thái Open, chưa có dòng kiểm lại | **Chưa** | SEC kiểm lại trên commit mới nhất, ghi Verified hoặc mở lại – **SEC** |
| G2.3 | S4-17 đóng **bằng test cục bộ** | `s4-be-c.md` 1.2: `readBody` gán `body = null`; upload pipelined → 429 trước khi đọc thân; test `upload-gate-socket.test.ts`. Không có tệp review SEC (8.3: SEC review bắt buộc S4-17) | **Chưa** | SEC đọc test và mã, ghi một dòng xác nhận. Phần chạy qua Caddy thật thuộc S4-15 (VPS) – **SEC** |
| G2.4 | PR PWA, guest-web (yêu cầu khách), SSE, nhóm D mục A/A.3 có review SEC | Không có `reviews/s4-SEC.md`. `outputs/SEC/` không có tệp Sprint 4. Review SEC duy nhất của Sprint 4 là `s4-SEC-lateFee-reauth.md` (D5). BE-D (`s4-be-d.md` 2.6) còn chờ SEC quyết luật B-15 "≥ 6 chữ số" (đang chặn ghi giá tiền trong `replyNote`). MOB `s4-report.md` mục 5 ghi "chưa có review SEC" | **Chưa** | SEC review và ghi `reviews/s4-SEC.md`: PWA (không có C3, `performedAt`, ảnh), guest-web P-R2-4 + quyết B-15, SSE theo vai, nhóm D mục A/A.3, `GuestStay.roomName` – **SEC** (BE-C, BE-D, MOB sửa thẻ nếu có) |
| G2.5 | Không có Critical/High Open | Sổ lỗi và review hiện có không có Critical/High. `s4-SEC-lateFee` mục 13.5: BE-59…64 Verified; còn ARC-24, ARC-26, FE-08 (Minor) và ARC-25 (chuyển R3 – US-164 + ESC-024). Chưa đủ cơ sở kết luận vì G2.4 chưa làm | **Chưa** | SEC ghi câu kết luận ở `s4-SEC.md` sau G2.4 – **SEC** |
| G3.1 | ĐK-S3-5: Verified của SEC, DOM, ARC, UXD | QC đếm thẻ: `s3-DOM.md` 2 Blocker + 8 Major Open (sửa lần cuối 17/10 00:29). `s3-ARC.md` 3 Blocker + 18 Major Open (16/10 23:32). `s3-UXD.md` 13 Major Open (17/10 07:55). SEC xem G2.2. Đã xong: UXD duyệt chuỗi S4-41/S4-48 (decision-log 637); DOM chốt quy tắc FOC B12 và FOC chờ duyệt (decision-log 630–632) | **Chưa** | DOM: Verified 2 Blocker + 8 Major (DOM-BE-13…22), ghi decision-log. ARC: Verified 3 Blocker + 18 Major và xem phần BE 9b/9c. UXD: Verified 13 Major (UXD-FE-S3-01…12, UXD-MOB-S3-01) – **DOM, ARC, UXD** (SEC ở G2.2) |
| G3.2 | Thẻ Blocker/Major của review Sprint 4 (ngoài phần tiền) đã xử lý hoặc dời có lý do | `s4-UXD.md`: 1 Blocker + 1 Major → `responses/s4-FE.md` ghi Done. `s4-UXD-strings-2.md` chấp nhận cách làm FE-S4-01 và ghi "Không còn Blocker/Major mở". `s4-SEC-lateFee`: 6 Major Verified; ARC-25 → US-164 (Must R3, decision-log 745) + ESC-024. Thẻ của `s4-kickoff-critic.md` xử lý lúc đóng băng D1. Review landing thuộc cổng LP-v1 | **Đạt** | – (review tiền xem G1) |
| G3.3 | Review bắt buộc theo ma trận cho mã mới Sprint 4 (DoD) | ARC chỉ có review mô hình đọc `reporting` (`openapi-0.3.7.md` 11.4) và duyệt vòng sửa tiền (16.x). Không thấy review ARC cho PR module `housekeeping` (BE-C, migration 0056) hay phần EP14 của BE-D. PR PWA và guest-web có review UXD (`s4-UXD.md` mục C) | **Chưa** | ARC review kỹ thuật PR module mới (8.3 dòng ARC: "PR module mới"), ghi thẻ nếu có – **ARC** |
| G4.1 | E2E A1 liền mạch có PWA, xanh trên CI, bấm thật | TC-X-070 có trong `WRITES` (`ci.yml:490`). CI #12: ✓ #1958, #1959 (`flow-a1.s4`). QA 6.9: mọi bước ghi bấm thật, không `test.fail` | **Đạt** | Xác nhận lại trên commit chấm (G5.1) |
| G4.2 | E2E A4 xanh trên CI | TC-X-072 có trong `WRITES`. CI #12: ✓ #1960 (`flow-a4.s4`) | **Đạt** | Như trên |
| G4.3 | BUG-R2-064 Closed | Về kỹ thuật đã sửa: CI #12 có 0 dòng ✘; `known-bugs` đặt lỗi ở đầu ca. Bảng tổng `bug-list.md` vẫn ghi **Fixed** ("chờ commit + CI") | **Chưa** (thủ tục) | QA đóng 064 theo log CI của commit chấm – **QA** |
| G4.4 | A7: KPI đêm nay và "Cần chú ý" khớp số DATA trên DS-0 | **Không có `outputs/DATA/`** trong Round 2. `s4-be-d.md` 2.8 giao DATA đối chiếu K-01…K-03, S1c, "Cần chú ý"; chưa ai làm | **Chưa** | DATA tính tay trên DS-0 và đối chiếu `getTonightKpi`, `getArrivalsDepartures`, `listAttentionItems`; ghi `outputs/DATA/s4-report.md` – **DATA** (BE-D hỗ trợ) |
| G5.1 | CI xanh trên đúng commit chấm: api, E2E (0 lần chạy lại), `WRITES`, `api-contract --strict`, `contract-lint`, gitleaks, `pnpm audit` 0 high | #14 `7ac11a4`: 6/8 job xanh, build đang chạy (08:28). #13: CI bị hủy. Tham chiếu #12 `3bd4ac4`: 8 job xanh, 2 job staging/GHCR bỏ qua theo thiết kế, 0 `retry #`. `playwright.config.ts:34` đặt `retries: 1` trên CI, nên phải đếm `retry #` trong log của commit chấm | **Chưa** | Chờ CI #14 (hoặc commit chấm sau đó). QC đọc log khi chấm – **ORC** (OPS theo dõi) |
| G5.2 | Lượt T9 hằng đêm gần nhất xanh | `ci.yml` chỉ có trigger `pull_request`, `push`, `workflow_dispatch`, **không có `schedule`**. QA (`s4-test-report.md` 3) ghi đây là việc của OPS | **Chưa** | OPS thêm lịch chạy hằng đêm (ca UI + axe ngoài `WRITES`), rồi có ít nhất một lượt xanh; QA ghi lỗi của lượt đêm – **OPS**, QA |
| G6.1 | 71 story Must R2 ≥ "Đang nghiệm thu"; không phần Must nào "chưa làm" | Backlog (QC đếm): 32 Đạt (stack tạm) · 24 Đang nghiệm thu · **15 vẫn "Sẵn sàng (Sprint 4)"**, dù mã đã có (BE-C, BE-D, MOB, FE-B). Phần Must chưa có người làm: **US-012 AC7 dòng "Đồng bộ kênh lỗi"** (`channel_sync_error`, cần J18 – `s4-be-d.md` mục 6 ghi "chưa có người làm") và **US-031 báo đỏ bằng thông báo** (J4, BR-425 – BE-D không làm). AC giao diện chưa có ca bấm thật: xem bảng 5 | **Chưa** | PO rà 15 story; quyết hai phần trên: làm trong Ổn định, hoặc ORC ghi decision-log chuyển Ổn định (tối đa 3 phần, 12.3 bước 7) – **PO, ORC** (BE-D/INT nếu làm) |
| G6.2 | PO ghi kết quả Sprint 4 ở `s4-acceptance.md` | `outputs/PO/` không có `s4-acceptance.md` | **Chưa** | PO nghiệm thu từng AC. AC giao diện chỉ nhận khi có ca UI bấm thật hoặc QA chạy tay có ảnh – **PO** |
| G7.1 | 0 P0/P1 Open | Bảng tổng (QC đếm lại): P0 Open 0. P1 Open 3 (171, 172, 173). P1 Fixed chờ kiểm lại lần 6: 7 (158…163, 168). Cả 10 mã đều thuộc phần tiền/minibar. Decision-log 782: 170…177 sửa ở #13 | **Chờ S4-38** | QA đổi trạng thái theo báo cáo lần 6 và CI của commit chấm – QA |
| G7.2 | P2 Open có kế hoạch (S4-50b, S4-45) | P2 Open 13, Deferred 1 (074 → S4-45). Sổ lỗi **chưa cập nhật** cho các mục CỔNG đã làm: 063 (S4-32), 076 và 080 (S4-50a), 090 (S4-39), 093 (S4-25 – TC-L3-083 ✓ CI #12) vẫn ghi Open; 170 sửa ở #13; 174 và 175 thuộc phần tiền. P3: 062 (S4-28 – TC-L5-025 ✓), 081, 088, 091 vẫn Open. Dòng 075, 078, 079, 082 vẫn ghi "chưa có mục S4 – ORC thêm", nhưng đã có S4-50b/S4-50c | **Chưa** | QA rà sổ: kiểm và đóng mã đã sửa, sửa dòng "chưa có mục S4", sửa bảng tổng. Sau khi rà, P2 Open không thuộc phần tiền chỉ nên còn 078, 087, 089, 101, 102 (S4-50b) – **QA** |
| G8.1 | Token DS v0.4 và font tự host trên Desk, PWA, guest-web | Desk: decision-log 658 (B0 + B1 cùng bản build, `@fontsource` 5.2.8). PWA và guest-web: `MOB/s4-report.md` 1.1. Grep `fonts.googleapis`/`gstatic` trong `src` của 3 app: 0 kết quả | **Đạt** | – |
| G8.2 | AA; axe 0 lỗi nghiêm trọng trên **mọi màn** | Axe hiện chạy ở: Desk H01–H12 (`a11y.axe.spec.ts`), guest-web H18, S13 (`ops.s4`), một số ca ghi. **Chưa có axe** cho PWA H19–H22, guest-web H23, H24 Tổng quan, S10, S11, S30. `s4-UXD.md`: chưa đo chế độ tối, 375 px, trình đọc màn hình | **Chưa** | QA thêm ca axe cho các màn mới (chạy hằng đêm theo T9 cũng được); MOB, FE-B sửa lỗi nếu có – **QA**, OPS, MOB, FE-B |
| G8.3 | Màu ngoài bảng chỉ còn ngoại lệ UXD đã ghi | DS 2.4 có danh sách ngoại lệ v0.4.1 (`--bar-long` Sage Deep…). Chưa có lượt UXD rà bản dựng Sprint 4 (PWA, guest-web, các màn Desk mới) | **Chưa** | UXD rà màu và AA trên bản dựng, ghi một dòng ký duyệt (hoặc thẻ) – **UXD** |
| G8.4 | Logo vector (S4-49) | INV chưa gửi SVG trước D7, nên logo chuyển **NÊN-ÔĐ** (mục 6, S4-49) | **KAD** | Xem (b) – UXD, FE-B, MOB khi INV gửi |

### Bảng 2 – Việc bắt buộc M1–M8 (mục 3) và mục tiêu 1.2

Mục tiêu 1.2 ứng với M1 (lỗi tiền, #6), M2 (S4-21 + S4-04), M3 (BUG-085, ĐK-S3-11), M4 (BUG-038), M5 (ĐK-S3-5), M6 (ĐK-S3-7). ĐK-S3-6 = M1.

| # | Tiêu chí | Bằng chứng | Trạng thái | Việc còn thiếu – vai |
|---|---|---|---|---|
| M1 | Lỗi tiền (ĐK-S3-6), #6, báo cáo đối kháng 0 ca lệch | Xem G1 | **Chờ S4-38** | Mục 3 |
| M2 | S4-21 + S4-04: US-024 AC5–AC7 bấm thật; xem trước = lệnh ghi | TC-L2-097 (a)–(d) ✓ CI #12 (UI). Ca BR-434-06/09 qua `previewThenMove()` | **Chờ S4-38** | Số đúng do lần 6 xác nhận |
| M3 | BUG-085 / S4-39: SEC Verified | Xem G2.1 | **Chưa** | SEC |
| M4 | BUG-038 / S4-10: TC-L3-011 bỏ `test.fail`; BR-402-01 | BUG-038 Closed (CI 39042881071). TC-L3-079/081/082 ✓ CI #12 | **Chờ S4-38** | Kiểm lại B9 (xem trước = trần QR = ghi) ở lần 6 |
| M5 | ĐK-S3-5 Verified | Xem G3.1, G2.2 | **Chưa** | SEC, DOM, ARC, UXD |
| M6 | ĐK-S3-7: A1 liền mạch trong `WRITES`, xanh | Xem G4.1. Ba ca của BUG-064 không còn `test.fail` giữa ca | **Đạt** | Chỉ còn thủ tục đóng 064 (G4.3) |
| M7 | Story Sprint 4: mỗi AC có ca; PO ghi `s4-acceptance.md` | `gen_traceability --strict` exit 0, 519 TC (QA 11.22). Chưa có `s4-acceptance.md` | **Chưa** | Xem G6.1, G6.2 và bảng 5 – PO, QA |
| M8 | S4-49 thương hiệu: token, AA, axe, màu, font tự host; tên phòng BR-012 | G8.1 Đạt. G8.2, G8.3 Chưa. S4-52 Đạt (bảng 5) | **Chưa** | Xem G8.2, G8.3 |

### Bảng 3 – Bốn tình huống làm cổng KHÔNG ĐẠT (mục 3)

| # | Tình huống | Bằng chứng | Trạng thái | Việc còn thiếu – vai |
|---|---|---|---|---|
| T1 | 057 hoặc 058 chưa sửa | Cả hai Closed ở `6f8d429` (TC-L4-097, TC-L2-084 (a)(b)); không lượt kiểm lại nào mở lại | **Chờ S4-38** | Lần 6 không tái hiện |
| T2 | S4-25 phát hành khi S4-02/S4-18 chưa sửa tổng quát | S4-25 gộp ở `2442d26`, **sau** khi 056/059/061 Closed ở `6f8d429` (CI 39042881071). TC-X-071 ✓ CI #12 | **Đạt** | – |
| T3 | S4-39 (SEC-G1 b) chưa được SEC Verified | Xem G2.1 | **Chưa** | **SEC** – tình huống này đủ làm cổng KHÔNG ĐẠT |
| T4 | Còn lỗi sai tiền P0/P1 Open | Xem G7.1 | **Chờ S4-38** | – |

### Bảng 4 – Điều kiện ĐK-S3 (qc/s3-qc-gate.md V3.5 và bản 2)

| ĐK | Nội dung | Bằng chứng | Trạng thái | Việc còn thiếu – vai |
|---|---|---|---|---|
| ĐK-S3-1 | Smoke demo trên bản mới, ghi `demo-1.md` | `outputs/OPS/demo-1.md` mục 6c: SMOKE ĐẠT trên `fe4b166` | **Đạt** | – |
| ĐK-S3-2 | Limits mục B, KB3 | Xong ở bản 2 | **Đạt** | – |
| ĐK-S3-3 | Ghi điểm UXR mới vào sổ | `bug-list.md` 10.4: N1–N6 → 086…091; 092…103 | **Đạt** | – |
| ĐK-S3-4 | Mục S4 cho 075…082; mã BUG cạnh S4-01…34; PO quyết 076/080/081 | `s4-carryover.md` có mã BUG ở từng dòng, S4-50 gồm 075…082. P-S4-2…4 | **Đạt** | Sổ lỗi còn chữ "chưa có mục S4" (xử lý ở G7.2) |
| ĐK-S3-5 | Verified của SEC, DOM, ARC, UXD | Xem G3.1, G2.2 | **Chưa** | SEC, DOM, ARC, UXD. QC coi điều kiện này **bắt buộc**: hạn của nó là cổng S4, M5 bắt buộc, 12.3 ghi "không bao giờ cắt", dù G3 cho thiếu ≤ 2 dòng |
| ĐK-S3-6 | Sửa mọi mục sai tiền đã dời và chạy lại kiểm chứng | Xem G1 | **Chờ S4-38** | – |
| ĐK-S3-7 | A1 liền mạch, bấm thật, không `test.fail` giữa chuỗi, sửa 3 ca BUG-064 | Xem G4.1, M6 | **Đạt** | Thủ tục 064 (G4.3) |
| ĐK-S3-8 | Staging: deploy, SEC-G2 smoke Caddy, QA A1 trên staging, S4-15 | Chưa có VPS (INV hẹn 19/10). Không tính vào cổng S4 nếu VPS tới sau D7 (9.3), nhưng là điều kiện của **cổng cuối R2** | **Chờ VPS** | OPS, SEC, QA, PO khi có VPS |
| ĐK-S3-9 | Vòng sửa 9 lỗi Desk | Xong ở bản 3 | **Đạt** | – |
| ĐK-S3-10 | Gói demo | Xong ở bản 3 | **Đạt** | – |
| ĐK-S3-11 | SEC-G1 (b) Verified | Xem G2.1 | **Chưa** | SEC |
| ĐK-S3-12 | 083 Closed | `bug-list.md` 10.1 | **Đạt** | – |
| ĐK-S3-13 | Commit cổng S3 sạch, CI xanh | CI 39020532465 trên `02cfaba`: success | **Đạt** | – |

### Bảng 5 – Mục CỔNG không phải tiền trong bảng phân loại (mục 6)

Các mục S4-17, S4-24 (BUG-064), S4-39, S4-49 đã có ở bảng 1. Mục tiền xem G1.

| Mục | Tiêu chí | Bằng chứng | Trạng thái | Việc còn thiếu – vai |
|---|---|---|---|---|
| S4-11 / S4-32 | Hồ sơ "từ giấy tờ", `id_doc_hmac`, `idDocLast4` chỉ khi P05 (nhóm D mục A, A.3) | `s4-be-c.md` (`guest-document-profiles`, J25). TC-L3-032 (a)(b) xanh; BUG-033 Closed. BUG-R2-063 vẫn Open trong sổ | **Chưa** | SEC review nhóm D mục A (G2.4); QA đóng 063 – SEC, QA |
| S4-20 | Test `dev_clock` không chập chờn | BE-D `withDevClockLock` (decision-log 683, `s4-be-d.md` 1.7). CI #12: 0 `retry #` | **Đạt** | Xác nhận lại trên commit chấm |
| S4-25 | Xin FOC ngoài bước nhận phòng (+ BUG-093) | TC-X-071, TC-L4-099, TC-L3-083, TC-NT-053 ✓ CI #12; gộp đúng thứ tự (T2) | **Đạt** | QA đóng BUG-093 (G7.2). Phần tiền theo S4-38 |
| S4-26 | "Ghi công nợ" MGR/OWN (US-038 AC3) | FE-B `s4-report.md` 1.2; chỉ có vitest + MSW (`s4-feb-desk`), không có ca E2E nào chạy trên API thật | **Chưa** | Ca UI bấm thật hoặc QA chạy tay có ảnh – QA (FE-B hỗ trợ), PO nghiệm thu |
| S4-27 | Điều chỉnh dòng folio, đảo giao dịch thu | FE-A 1.5; vitest `s4-money` (4 ca); không có ca E2E | **Chưa** | Như S4-26 – QA (FE-A), PO |
| S4-28 | VietQR cọc H12/H11 | TC-L5-025 (a) ✓ CI #12 (`deposit-qr.s4`) | **Đạt** | QA đóng BUG-062 (G7.2) |
| S4-29 | "Xem bill" cho đơn `checked_out` | FE-B 1.3; chỉ có vitest | **Chưa** | Như S4-26 – QA, PO |
| S4-30 (+081) | Ảnh biên nhận CTV; lễ tân thấy nội dung báo cọc | FE-B 1.4; 081 làm sau khi ARC thêm trường đọc (`s4-report.md` FE-B đợt sau, `DepositNotices.tsx`); chỉ có vitest | **Chưa** | Như S4-26; QA đóng 081 – QA, PO |
| S4-31 | Thẻ "khách trả phòng hôm nay"; việc dọn sinh từ lưu trú | BE-D 1.2; BE-C `housekeeping-s4` (S4-31). Không có ca UI cho thẻ H03. Báo đỏ J4 không làm (`s4-be-d.md` mục 6) | **Chưa** | PO quyết AC "báo đỏ" (G6.1); ca UI H03 – PO, QA, BE-D |
| S4-41 | UXD duyệt 13 chuỗi vòng 9 | Decision-log 637 | **Đạt** | – |
| S4-48 | Mã TC KB7, chuỗi FE-07/KB7, `unclaimedUntil` + `personIndex` | TC-L4-096 trong `WRITES`; decision-log 637; 0.3.7 mục 8.2 #3 | **Đạt** | QA đóng BUG-088, 091 (G7.2) |
| S4-50a | BUG-076, 080, 081 | FE-A 1.3, 1.4 (vitest `booking.test.tsx`, `s4-money`); 081 xem S4-30. Ba mã vẫn Open | **Chưa** | QA kiểm trên API thật và đóng – QA, PO |
| S4-51 | Ghim bản đồ làm một nguồn cho US-108 | Decision-log 664 (giá trị mặc định `property_map_url`). Tên miền `maps.app.goo.gl` vẫn mang nhãn [GIẢ ĐỊNH – SEC xác nhận] (mục 13), chưa có xác nhận | **Chưa** | SEC xác nhận tên miền, hoặc đổi sang link `google.com/maps` – SEC |
| S4-52 | Tên phòng BR-012 (khách thấy tên, không thấy số căn) | `bill.service.ts:170`, `checkout.service.ts:831` (`settled_room_names`); `guest-web/src/app/api.ts:42` không chép `roomNo` | **Đạt** (đọc mã) | QC chưa đi tay. Bảng ghép thật chờ INV (P-S4-8) |
| S4-37 ca `otaPenaltyVnd` · S4-47 thu trước B18 | Chờ kết luận "không sai tiền" | Decision-log 740 và 753 đã có kết luận | **Chờ S4-38** | Lần 6 không tái hiện |

---

## 2. Ba nhóm việc

### (a) Việc chặn cổng ngoài phần tiền

Cột "Loại chặn":
- **Cứng** = thuộc G2, G4, G5, G7 hoặc bốn tình huống. Thiếu một mục là cổng KHÔNG ĐẠT.
- **Mềm** = thuộc G3, G6, G8. Thiếu tổng cộng ≤ 2 dòng thì vẫn có thể ĐẠT CÓ ĐIỀU KIỆN (11.2). Riêng ĐK-S3-5, QC coi là bắt buộc (xem bảng 4).

| # | Việc | Vai | Loại chặn | Tiêu chí |
|---|---|---|---|---|
| a1 | Kiểm lại và ghi **Verified S4-39** (phương án chính, BE-57, BE-58 (2), giấy tờ lễ tân tự nhập chưa gắn người) ở `s3-SEC.md` mục 9 | **SEC** | Cứng (tình huống 3) | G2.1, M3, ĐK-S3-11 |
| a2 | **SEC-G3**: Verified 8 Major (BE-33…38, FE-06, MOB-01) | **SEC** | Cứng | G2.2, M5 |
| a3 | `reviews/s4-SEC.md`: review PR PWA, guest-web (P-R2-4 + quyết luật B-15 trong `replyNote`), SSE theo vai, nhóm D mục A/A.3, `GuestStay.roomName`, S4-17 (test cục bộ), tên miền bản đồ S4-51; kết luận "0 Critical/High Open" | **SEC** (BE-C, BE-D, MOB sửa thẻ) | Cứng | G2.3–G2.5, S4-11/32, S4-51 |
| a4 | Đối chiếu A7 trên DS-0 (K-01…K-03, S1c, "Cần chú ý") → `outputs/DATA/s4-report.md` | **DATA** (BE-D) | Cứng | G4.4 |
| a5 | Đóng BUG-R2-064 theo log CI của commit chấm | **QA** | Cứng (thủ tục) | G4.3 |
| a6 | CI xanh đủ job trên commit chấm (#14 `7ac11a4` hoặc sau), 0 `retry #`, `WRITES` 11 ca | **ORC**, OPS | Cứng | G5.1 |
| a7 | Thêm lịch T9 hằng đêm vào `ci.yml` và có một lượt xanh | **OPS** (QA ghi lỗi) | Cứng | G5.2, G8.2 |
| a8 | Rà sổ lỗi: đóng 062, 063, 076, 080, 081, 088, 090, 091, 093 (và 170 sau CI) nếu kiểm đạt; sửa dòng "chưa có mục S4"; sửa bảng tổng; mỗi P2 còn mở có kế hoạch | **QA** | Cứng | G7.2 |
| a9 | ĐK-S3-5: DOM Verified 2 Blocker + 8 Major; ARC Verified 3 Blocker + 18 Major và phần BE 9b/9c; UXD Verified 13 Major | **DOM, ARC, UXD** | Mềm, QC coi là bắt buộc | G3.1, M5 |
| a10 | ARC review kỹ thuật PR module mới (`housekeeping` của BE-C, EP14 của BE-D) | **ARC** | Mềm | G3.3 |
| a11 | Ca UI bấm thật (hoặc QA chạy tay có ảnh) cho AC giao diện chưa có ca: S4-26, S4-27, S4-29, S4-30 + 081, 076, 080, H03 (S4-31, US-010/011/012 + SSE), H24, hàng yêu cầu khách Desk (US-110), guest-web H23 (US-108/109/112), PWA H19–H22 (phần ngoài A1/A4) | **QA** (FE-A, FE-B, MOB) | Mềm | G6, bảng 5 |
| a12 | `outputs/PO/s4-acceptance.md`; đưa 15 story từ "Sẵn sàng (Sprint 4)" lên ≥ "Đang nghiệm thu"; quyết **US-012 AC7 dòng "Đồng bộ kênh lỗi"** (chưa ai nhận) và **US-031 báo đỏ J4**: làm ngay, hoặc ORC ghi decision-log chuyển Ổn định (≤ 3 phần, 12.3 bước 7) | **PO**, ORC (BE-D/INT nếu làm) | Mềm | G6.1, G6.2, M7 |
| a13 | Axe 0 lỗi nghiêm trọng trên PWA H19–H22, guest-web H23, H24, S10, S11, S30; UXD rà màu ngoài bảng và AA trên bản dựng Sprint 4 | **QA, UXD** (MOB, FE-B sửa) | Mềm | G8.2, G8.3, M8 |
| a14 | Ghi decision-log **ngày chấm cổng mới** (11.2 bắt buộc; hiện chưa có). Chọn commit chấm. Ghi rõ báo cáo lần 6 (chạy trên #13) áp cho #14 như thế nào: #13 → #14 khác 8 tệp, chỉ BUG-R2-178 (`fridge.ts`, `minibar.service.ts`, test). QA đã chạy lại minibar 28/28 và desk-clock 8/8 (QA 11.23) | **ORC** | Thủ tục cho mọi G | 11.2 |

Nếu tính theo 11.2: các việc mềm a10–a13 đang làm thiếu ít nhất 5 dòng trong G3, G6, G8 (G3.3, G6.1, G6.2, G8.2, G8.3), và 6 dòng nếu tính cả G3.1. Con số này vượt mức 2 dòng cho ĐẠT CÓ ĐIỀU KIỆN, nên phải làm phần lớn các việc này trong tuần Ổn định.

### (b) Việc NÊN-ÔĐ còn mở – phải làm trong tuần Ổn định, không dời R3

| # | Việc | Bằng chứng trạng thái | Vai |
|---|---|---|---|
| b1 | **S4-33** – ca QA bổ sung: TC-L2-026, B14 `ROOM_NOT_READY`, TC-L2-060…062 E2E, TC-L2-056, TC-SEC-015, TC-RB-008/009, H13 trước 06:00. Tới khi có ca, US-024 AC4, US-139 AC3, US-022 AC1 giữ "Đang nghiệm thu" | Grep `e2e/`: chưa có mã TC nào trong số này | QA |
| b2 | **S4-36** – p95 gia hạn 62 đêm; N+1 `listRegistrations` (cùng test hiệu năng Ổn định – plan R2 mục 6) | Chưa có báo cáo đo | BE-A, BE-C, QA |
| b3 | **S4-45** – năm sinh trẻ em (Desk ghi "không bắt buộc" nhưng server bắt buộc) và **BUG-R2-103** (2 dòng "Còn phải thu") | Chưa có trong báo cáo FE | FE-A, UXD, BA |
| b4 | **S4-50b** – P2 hiển thị: 078 (BE-A đã thêm `balanceDueVnd` vào danh sách – `s4-be-a.md` mục 9; còn phần cột ở Desk), 087, 089, 101, 102. Phải xong trước lần INV thử thứ hai | Còn Open trong sổ | FE-A, BE-A, UXD |
| b5 | **S4-49 – logo** (INV chưa gửi SVG trước D7) | Chờ INV gửi; ORC nhắc ngày 19/10 | UXD, FE-B, MOB |
| b6 | **BUG-R2-123** (P3) – `move-preview` không nhận `overbookingResolution` | Decision-log 735: tuần Ổn định | BE-A, ARC |
| b7 | **BUG-R2-133** (P3, lệch tiền chỉ trên dữ liệu origin NULL trước 0059) – sửa, hoặc OPS/QA ghi truy vấn đếm = 0 trên DB dùng thử | Decision-log 735; recheck5 điều kiện 9 | BE-A, OPS, QA |
| b8 | Việc của tuần Ổn định theo plan R2 mục 4 (không ghi trong bảng phân loại nhưng chưa có bằng chứng): UXR đi thử PWA buồng phòng trên điện thoại 360/390 px; đi lại KB5, KB10; J6 trên H24. Không có `outputs/UXR/` và không có bản bổ sung `usability-report-r2.md` | Chưa có tệp | UXR |

Ghi chú – có lịch ở tuần Ổn định nhưng thuộc **cổng LP-v1**, không thuộc cổng S4: US-155 phần Desk (BE-D, FE-B) và Q-W09 (sprint-4-plan 16.1, 16.3 c).

**Nhóm Chờ VPS (điều kiện cổng cuối R2, không tính cổng S4 nếu VPS tới sau D7):**
- ĐK-S3-8: deploy staging qua CI; SEC-G2 smoke Caddy, đóng SEC-OPS-03; QA chạy A1 trên staging, có ghi hình; PO kiểm lại giao diện (N3-5).
- S4-15: upload qua Caddy thật, gồm phần kiểm S4-17.
- OPS/DATA, trước khi đưa dữ liệu vào môi trường dùng thử:
  - chạy migration theo thứ tự tới 0069;
  - chạy các truy vấn kiểm = 0 ở recheck5 điều kiện 9 và recheck5b điều kiện 7.

### (c) Việc đã dời R3 có ghi quyết định

| # | Việc | Quyết định / nguồn |
|---|---|---|
| c1 | Nâng toolchain FE (React 19, Vite 8; Dependabot #13, #14, #16) – phần còn lại của S4-16 | Decision-log 558; sprint-4-plan 1.4, mục 6 S4-16 |
| c2 | Contract-ahead R3 nhóm D: B-2, B-3, B-4, B-5, B-7, B-8, B-9, B-11, B-12 | P-S4-13; ORC quyết định đóng băng (1); decision-log 648, 652 |
| c3 | Tự gửi tin Zalo/email (US-126, US-161, US-162, US-034, US-116); Sprint 4 lễ tân báo tay | ESC-021 A; sprint-4-plan 1.4, 9.2 |
| c4 | DOM-S4-17 – "khách để lại" tiền dư cho đơn đã đóng → R3 Sprint 1, xong trước RC | Decision-log 703; sprint-4-plan 16.3 (a) |
| c5 | DOM-S4-11 phần (2) – người đi cùng VIP/Khách quen → R3 Sprint 1 (cùng US-075) | Decision-log 703, 723 (ARC C5); 16.3 (b) |
| c6 | BR-309-18 – "OTTIMO hủy vì lỗi cơ sở → hoàn đủ" → R3; R2 tạm để MGR miễn qua BR-433 | Decision-log 763 |
| c7 | US-164 – quản lý xác nhận từ xa (SEC ARC-25) → Must R3. Phần "quản lý không trả lời" chờ INV (ESC-024) | Decision-log 745; ESC-024 |
| c8 | SEC ARC-24, ARC-26, FE-08 (Minor) – xong trước bản dùng thử cuối R3; kịch bản UXR "quy tắc mật khẩu" → R3 | Decision-log 744; `s4-SEC-lateFee-reauth.md` mục 1, 6, 13.5 |
| c9 | Desk cảnh báo QR chờ khi bán đêm (R3PAY-02 phần NÊN) → R3 | `openapi-0.3.7.md` 16.7 D8; DOM (f) decision-log 741 |
| c10 | Giá nạp minibar theo danh mục lúc vào lại – tạm giữ tới R3 | Decision-log 759 (DOM (s), [GIẢ ĐỊNH – tạm tới R3]) |
| c11 | US-012 AC2 + job J12; US-086 AC3; US-108 phần mã cửa; US-119 AC5; US-081, 111, 125, 128, 141 (R-C) | ESC-012 R-C (INV 16/10); backlog |
| c12 | US-056 → đầu R3; US-008 phần "Thêm người dùng" → Must R3 | Backlog (PO R2 Sprint 2) |

**Đã dời R3 nhưng chưa có dòng quyết định** (ORC hoặc PO ghi decision-log, hoặc làm ở Ổn định):
- H24 bản 24.2 cho FDL/FD: UXD đồng ý giữ H02 2.2 cho R2, "PO quyết có đưa 24.2 vào R3 không" (`responses/s4-FE.md`, FE-B mục D).
- T13 – xóa `note` của yêu cầu khách sau `retention.guest_request_months` ("J16 phần R3" – `s4-be-d.md` mục 6).
- J4 "báo đỏ" bằng thông báo đẩy (BR-425) – nếu PO kết luận không thuộc AC Must R2 (a12).

---

## 3. Phần tiền – việc ORC cần gom khi có báo cáo lần 6 (không chấm ở đây)

- Lần 6 phải xác nhận:
  - 0 ca lệch tiền;
  - xem trước = trần QR = lệnh ghi ở B7, B14, B9a, B18;
  - đóng được 158…163, 168, 171…173 (P1); 164, 169, 174, 175 (P2 lệch tiền); 165…167 (P3, SEC đã Verified ở `s4-SEC-lateFee` mục 13).
- Commit chấm là #14 trở về sau, nên báo cáo lần 6 phải ghi phạm vi áp cho #14 (a14).
- Recheck5 điều kiện 10: ca hoa hồng S4-03 (sau B8, khi hủy, khi no-show). Nếu chưa có ca thì ORC ghi rõ việc dời.
- Việc QA ở tuần Ổn định theo `s4-test-report.md` 7.8.1:
  - E2E FOC-01 qua H16 (S4-25);
  - ca đua nhận phòng ‖ duyệt FOC và xác nhận QR ‖ B9;
  - gỡ `pendingFix` còn lại (BR-417-03, BR-602-05; BR-309-18 đã sang R3).

## 4. ESC đang mở – không chặn cổng S4

| ESC | Chủ đề | Trạng thái | Ảnh hưởng cổng |
|---|---|---|---|
| ESC-022 | Tên mạng Wi-Fi (không đặt theo số căn) | Chờ INV, Bình thường | Không chặn cổng S4. Cần trước khi khách dùng thử trang khách. Tạm dùng một mạng chung "OTTIMO-Guest" |
| ESC-023 | Rút ngắn đơn < 7 ngày mà vẫn đến ở | Chờ INV, Bình thường | Không chặn cổng S4. Tạm giữ phương án A; việc làm (nếu chọn B hoặc C) ở R3 |
| ESC-024 | Phụ thu trả muộn bằng giá 1 đêm khi quản lý không trả lời | Chờ INV, Bình thường | Không chặn cổng S4. Tạm giữ phương án A; quy tắc "không đọc mật khẩu qua điện thoại" áp ngay |

Ghi chú cho ORC: cột "Quyết định" của ESC-019, 020, 021 trong `escalations-index.md` vẫn ghi "–", dù cả ba tệp ESC đã ghi "Đã quyết". Đây là sửa chữ, không ảnh hưởng cổng.

## 5. QC chưa kiểm được ở bước này

- Phần tiền (G1, G7.1): theo giao việc.
- Log CI #14: job build và E2E còn đang chạy lúc lập bảng. CI #13 bị hủy nên không có kết quả.
- QC không chạy test, không đi luồng Desk, PWA hay guest-web. Ở bảng 5, "Đạt" dựa trên log CI #12 và đọc mã/báo cáo, không có lượt chạy tay của QC.
- QC không tự đọc mã PR Sprint 4 dưới góc bảo mật. Đó là việc của SEC (a3).
- Số liệu đếm sổ lỗi lấy từ bảng tổng `bug-list.md` lúc 08:20. QA có thể đang sửa sổ.
