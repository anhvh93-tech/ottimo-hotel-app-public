# SEC review – số hoa hồng/thưởng trong repo công khai (theo FB-R4-PO-DOM-PR25-01 (c))

- Người review: SEC | Ngày: 04/11/2026 | Round 4 – Bước: **Review** (đánh giá rủi ro, chỉ đọc)
- Đối tượng: nhánh `main` (HEAD `4d5fb3aa`) của repo **công khai** `anhvh93-tech/ottimo-hotel-app-public`, cùng lịch sử git và các nhánh, tag đã đẩy lên.
- Căn cứ: decision-log 01/11 dòng 1043 mục (8) (INV chốt: số hoa hồng Sale/thưởng mục 5–6 của bảng giá **không đưa lên kho mã công khai**; Desk vẫn tính theo bảng), BR v0.5.1 mục 2.0, BR-212, BR-903, thẻ FB-R4-PO-DOM-PR25-01.
- **Tệp này không ghi tỷ lệ hay số tiền hoa hồng/thưởng nào, cũ hay mới.** Chỉ ghi đường dẫn, số dòng, loại.
- Không sửa tệp nào khác, không commit, không sửa decision-log.

---

## 0. Cách kiểm

| # | Việc | Cách làm |
|---|---|---|
| K1 | Tìm số trong tệp hiện tại | Script quét mọi tệp có trong git ở HEAD, trong `product/`, `rounds/`, `00-brief/`, `01-decisions/`, `02-escalations/`, `03-backlog/`, `04-investor-feedback/`. Bắt dòng có từ khóa (`hoa hồng`, `HH`, `commission`, `thưởng`, `bonus`, `hiệu suất`, `Sale nhận`) đi gần một tỷ lệ % hoặc basis point, một khóa `commission*Pct/Bp/Vnd`, hoặc một số tiền. Bỏ các dòng chỉ có phí kênh OTA. Sau đó SEC đọc tay từng dòng để bỏ dòng bắt nhầm (số tiền cọc, công nợ, giảm kỳ hạn…). Quét riêng các ví dụ tiền hoa hồng cũ đã biết ở dạng `416_400` trong mã. Tách `br-examples.json` bằng parser JSON để lấy đúng id ca. |
| K2 | Tìm số **mới** (bảng nội bộ 01/11) | (a) Quét **toàn bộ lịch sử** của mọi ref đang có ở máy (main, 77 nhánh `origin/*`, 10 tag; fetch lúc 03/11 23:24): mọi dòng **thêm vào** có từ khóa hoa hồng/thưởng đứng gần một tỷ lệ, gộp theo giá trị. (b) Quét các dòng thêm vào từ 30/10 với từ khóa và mẫu cấu trúc của bảng mới. (c) Tìm tên khóa và tiêu đề riêng của bảng nội bộ trong mọi commit. (d) Thông điệp commit của mọi ref. (e) Tiêu đề và mô tả của 33 PR trên GitHub (`gh pr list`). (f) Thay đổi chưa commit trong thư mục làm việc: sổ tay, release notes, backlog. So theo **ngữ cảnh** (từ khóa, giá trị, ngày commit), không chỉ theo giá trị. |
| K3 | Nguồn để so | Decision-log 01/11. Bảng nội bộ `00-brief/context/pricing/OTTIMO_pricing_spec-2026-11-01.md` nằm **trong thư mục repo nhưng ngoài git** (không theo dõi, chặn bằng `.git/info/exclude`, chưa từng có trong lịch sử). SEC chỉ đọc mục 5–6 của tệp này để có giá trị đối chiếu, không chép gì ra. Không đọc tệp nào ngoài thư mục repo. |
| K4 | Mức lộ của repo | `gh repo view`: PUBLIC, tạo 19/10/2026, 0 fork. `traffic/clones` 14 ngày gần nhất: 5.796 lượt clone, 671 nguồn khác nhau (gồm cả runner CI). Commit đầu tiên (15/10, `7b2b3f63`) đã có prototype chứa tỷ lệ cũ. |

Giới hạn (chưa quét): bình luận review trong PR, issue, log CI, ảnh trong ghcr, dữ liệu staging. Ảnh chụp: chỉ xem mẫu 1 ảnh báo giá Round 4 (`rounds/round-04/qa/lp-v2/45-…png`, vai OWN, không có dòng hoa hồng), chưa đọc chữ trong mọi ảnh.

---

## 1. Kết luận

1. **Không thấy số nào của bảng nội bộ 01/11** (tỷ lệ, cơ sở tính, lịch chi, thưởng) trong `main`, trong lịch sử của mọi nhánh và tag đã đẩy, trong thông điệp commit, mô tả PR, hay thay đổi chưa commit. Mọi tỷ lệ hoa hồng từng xuất hiện cạnh từ khóa đều thuộc bộ cũ: ESC-005 16/10, prototype Round 0, bảng kênh tháng 9. Tệp bảng nội bộ chưa từng được commit.
2. Số **cũ** (hết hiệu lực từ 01/11) còn ở khoảng **60 tệp** đang theo dõi: tài liệu sống, mã, seed, test, fixtures và hồ sơ round. Danh sách ở mục 2. Về bảo mật: **Low**. Số cũ đã công khai từ 19/10, đã được clone rộng, và CTV/nhân viên đã biết qua việc chi trả. Về tính đúng tiền: **Medium**. Nhiều chỗ vẫn coi số cũ là "giá trị chính thức", và `production-defaults.ts` còn nạp số cũ làm mặc định production (mục 3, R3).
3. Rủi ro lớn nhất là **về sau**, không phải hiện tại. Số mới dễ lọt nhất khi làm hotfix **H2**, qua seed, fixtures, test, ví dụ tiền (biết cơ sở và tiền là suy ra tỷ lệ), mô tả PR, ảnh chụp. Thêm nữa, bảng nội bộ đang nằm **ngay trong thư mục repo** và chỉ được chặn bằng `.git/info/exclude`, một tệp cục bộ không đi theo repo, trong khi đường dẫn của nó đã ghi ở tài liệu công khai.
4. Đề xuất **phương án A (bản hẹp)**: không viết lại lịch sử git. Sửa nhãn và đánh dấu "hết hiệu lực" ở tài liệu sống và fixtures. Không nạp tỷ lệ từ mã. Thêm 4 biện pháp chặn số mới (G1–G4). **Không chọn B**: tốn nhiều (mục 4) mà gần như không có lợi, vì số cũ đã bị sao chép.
5. **Không cần ESC.** Việc này không thuộc loại SEC phải báo lên. INV đã quyết hướng ngày 01/11, và phương án A thực hiện quyết định đó, 0 đồng, không đổi phạm vi. Ghi một giả định vào decision-log: số cũ hết hiệu lực không coi là bí mật. Nếu INV nói ngược lại thì mới mở ESC cho phương án B.

---

## 2. Vị trí còn số hoa hồng/thưởng trên `main` (HEAD `4d5fb3aa`)

Loại: **TL-cũ** = tỷ lệ cũ (trước 01/11) · **Tiền-cũ** = ví dụ số tiền hoa hồng (hoặc cơ sở hoa hồng) tính theo tỷ lệ cũ · **LC-cũ** = lịch chi/tỷ lệ chia đợt cũ · **TL-mới** = số của bảng nội bộ 01/11.

**Không có dòng nào loại TL-mới.**

### 2.1 Tài liệu sống: cần xử lý (sửa nhãn hoặc đánh dấu hết hiệu lực)

| Tệp | Dòng | Loại | Ghi chú |
|---|---|---|---|
| `product/docs/business-rules.md` | 126 (BR-212) | TL-cũ, Tiền-cũ, LC-cũ | Đã có câu "bản cũ, chỉ để tra HĐ trước 01/11". Cột Nhãn vẫn ghi giá trị chính thức (PO-01) |
| 〃 | 168 (BR-326) | TL-cũ, Tiền-cũ | Chưa có câu "bản cũ". Cột Nhãn ghi giá trị chính thức |
| 〃 | 357 (BR-525) | TL-cũ, Tiền-cũ | Ví dụ xóa nợ và hoa hồng |
| 〃 | 448 (BR-903) | TL-cũ, Tiền-cũ | Đã có "Số dưới đây là bản cũ"; nhãn như PO-01 |
| 〃 | 563 (mục 13 `commission_payout`) | LC-cũ | Nhãn `INV-005`, **chưa** ghi "trước 01/11" |
| 〃 | 648 (mục 13 `short_stay_commission_pct`) | TL-cũ | Đã ghi "Trước 01/11" – đạt |
| 〃 | 763, 836 (nhóm ESC dài hạn, Q-D2) | TL-cũ | Phần câu hỏi đã đóng |
| 〃 | 1106, 1107, 1108, 1262, 1310 (lịch sử phiên bản) | Tiền-cũ | Lịch sử: giữ |
| `product/docs/api/openapi.yaml` | 4792 (ví dụ response `commission`), 5274 | TL-cũ, Tiền-cũ | Ví dụ API sống |
| `product/packages/api-client/src/generated/openapi.ts` | 2524 | TL-cũ, Tiền-cũ | Sinh từ `openapi.yaml`, sửa theo nguồn |
| `product/docs/metrics-definitions.md` | 140, 320, 432 | TL-cũ | 140: bảng kênh tháng 9; 432: phần cộng thêm cho khách NN |
| `product/docs/baseline-issues-triage.md` | 76 | TL-cũ | Mục X-03 đã đóng |
| `product/docs/open-questions-resolution.md` | 14 (LC-cũ), 46 (TL-cũ) | | Đã đóng |
| `product/design/hifi/11-reservation.html` | 168 | TL-cũ, Tiền-cũ | Màn mẫu |
| `product/design/hifi/12-sales-quote.html` | 82, 127, 141 | TL-cũ, Tiền-cũ | Màn mẫu báo giá |
| `product/tests/test-cases/r1-main-flows.md` | 41, 240, 465, 471, 472 | TL-cũ (465, 471), Tiền-cũ | Test case sống |
| `product/tests/e2e/smoke-manifest.json` | 354 | TL-cũ, Tiền-cũ | Tiêu đề ca smoke |

### 2.2 Fixtures `product/tests/fixtures/br-examples.json`

| Id ca | Dòng (`"id"`) | Loại | Nhãn hiện tại | PO-01 đã nêu? |
|---|---|---|---|---|
| BR-212-01 | 4378 | TL-cũ (Bp), Tiền-cũ | INV-005, NGÀNH | Có |
| BR-212-02 | 4397 | LC-cũ (`commission_payable_day`, `commission_pay_by_day`) | INV-005, NGÀNH | Có |
| BR-309-26 | 5632 | TL-cũ (Bp, trong `case` và `params`) | INV-006, NGÀNH | Có |
| BR-326-01 | 6223 | TL-cũ, Tiền-cũ | INV-005, NGÀNH | Có |
| BR-525-04 | 12546 | Tiền-cũ | GIẢ ĐỊNH, NGÀNH | DOM xem cùng lượt |
| BR-525-10 | 12732 | Tiền-cũ | GIẢ ĐỊNH, NGÀNH | DOM xem cùng lượt |
| BR-525-14 | 12905 | TL-cũ (Bp), Tiền-cũ | GIẢ ĐỊNH, NGÀNH | Có |
| BR-527-05 | 14414 | Tiền-cũ (tính theo tỷ lệ nhân viên cũ) | NGÀNH, INV-017 | **Chưa – SEC bổ sung** |
| BR-527-06 | 14455 | Tiền-cũ (tính theo tỷ lệ nhân viên cũ) | NGÀNH, INV-017 | **Chưa – SEC bổ sung** |
| BR-903-01 | 16025 | TL-cũ, Tiền-cũ | INV-005 | Có |
| BR-903-02 | 16046 | TL-cũ, Tiền-cũ | INV-005, NGÀNH | Có |
| BR-903-03 | 16067 | Tiền-cũ (kỳ chi gộp) | INV-005, NGÀNH | **Chưa – SEC bổ sung** |
| BR-903-04 | 16082 | TL-cũ, Tiền-cũ | INV-005, NGÀNH | Có |

`conventions`, `owner`, BR-201-01 (dòng 3111), BR-208-03 (4214): chỉ ghi "bảng nội bộ, không ghi ở repo", không có số. Đạt.

### 2.3 Mã, seed, test

| Tệp | Dòng | Loại | Ghi chú |
|---|---|---|---|
| `product/services/api/src/admin/production-defaults.ts` | 472 (`short_stay_commission_pct`) | TL-cũ | **Mặc định production**, nhãn `INV-005` |
| 〃 | 496–497, 505–506, 514–515, 523–524, 532–533 (bảng kỳ hạn) | TL-cũ | Hoa hồng thuê tháng theo 5 mốc cũ |
| 〃 | 254–255 (`commission_payable_day`, `commission_pay_by_day`) | LC-cũ | Nhãn `INV-005` |
| `product/services/api/src/modules/folio/public/folio.service.ts` | 540 | TL-cũ | Chú thích |
| `product/services/api/src/modules/folio/internal/foc.service.ts` | 251 | TL-cũ, Tiền-cũ | Chú thích |
| `product/services/api/test/be-b-s2-units.test.ts` | 64–67, 157, 166, 179 | TL-cũ, Tiền-cũ | |
| `product/services/api/test/integration/folio-payments.test.ts` | 215, 225, 339, 354, 363, 366 | TL-cũ, Tiền-cũ | |
| `product/services/api/test/integration/sales.test.ts` | 154–158, 164–165, 291 | TL-cũ, Tiền-cũ | |
| `product/services/api/test/integration/reversal-debt-g4.test.ts` | 245, 892 | TL-cũ, Tiền-cũ | |
| `product/services/api/test/integration/payments-s3.test.ts` | 1956 | Tiền-cũ | Chú thích |
| `product/apps/admin-web/src/__tests__/quotes.test.tsx` | 37, 84 | TL-cũ | Chuỗi UI kỳ vọng |
| `product/tests/e2e/api/quotes-holds.api.spec.ts` | 104 | (tiêu đề ca, dẫn BR-903-01) | Số lấy từ fixtures |
| `product/tests/e2e/clock/debt-collect.s5.clock.spec.ts` | 20 | Tiền-cũ | Chú thích |
| `product/tests/fixtures/seed/ds-e.json` | 517, 524 (LC-cũ); 1287–1290 (TL-cũ); 1365–1366, 1374–1375, 1383–1384, 1392–1393, 1401–1402 (TL-cũ) | | Bản sao QA của BR mục 13, nguồn của `production-defaults.ts` |
| `product/tests/fixtures/seed/ds-0.json` | 904–908, 931–936 | TL-cũ (Bp), Tiền-cũ | HĐ mẫu Daniel/Emma |

### 2.4 Hồ sơ lịch sử: giữ nguyên (bằng chứng quyết định, không phải giá trị đang dùng)

| Tệp | Dòng | Loại |
|---|---|---|
| `02-escalations/ESC-005.md` | 3, 6, 16, 17, 20 | TL-cũ, Tiền-cũ, LC-cũ |
| `01-decisions/decision-log.md` | 179 (LC-cũ), 816, 819 (TL-cũ, Tiền-cũ) | |
| `product/docs/round-0-baseline.md` | 336, 367–373 (bảng 5.2), 393, 399, 401, 407, 475, 661, 662 | TL-cũ, Tiền-cũ |
| `product/legacy/round-0-prototype/ottimo-desk.html` | 834, 835, 859 | TL-cũ |
| `rounds/round-01/` | `outputs/QA/report.md` 20; `qc/qc-gate.md` 53; `responses/DOM-responses.md` 80; `reviews/BA-on-DOM.md` 178; `reviews/DOM-on-PO.md` 132, 168; `round-summary.md` 52 | TL-cũ, Tiền-cũ |
| `rounds/round-02/` | `outputs/ARC/openapi-0.3.7.md` 1123, 1124; `outputs/BE/s2-be-b.md` 12, 38; `outputs/FE/s2-report.md` 16; `outputs/PO/s4-acceptance.md` 264; `outputs/QA/d0-report.md` 19; `outputs/QA/w1-report.md` 33; `outputs/UXD/d0-report.md` 52; `qa/bug-list.md` 655, 1809, 1836; `responses/s2-BE-B.md` 16; `responses/s3-BE-B.md` 18; `reviews/s2-DOM.md` 24, 171; `reviews/s3-round6-verification.md` 89; `reviews/s4-38-findings-raw.md` 75, 88; `reviews/s4-money-recheck8.md` 32; `reviews/s4-money-verification.md` 128, 155; `reviews/s4-money-reverification.md` 225 | TL-cũ, Tiền-cũ |
| `rounds/round-03/outputs/DOM/s1-money-oracle.md` | 227 | TL-cũ |

Sạch (không có số hoa hồng/thưởng): `00-brief/` (tệp đang theo dõi), `03-backlog/backlog.md` (kể cả bản đang sửa), `04-investor-feedback/`, `rounds/round-04/` (kể cả `outputs/DOM/pricing-spec-2026-11-01-reconcile.md`, `inv-price-switch-guide.md`, thẻ PO), sổ tay `product/docs/manual/` (kể cả bản HTML chưa commit), `product/design/copy/` (chuỗi dùng tham số `{pct}`).

Ngoài phạm vi quyết định 01/11: **phí kênh OTA** (`commissionPct` của kênh trong `production-defaults.ts` 153–170, `ds-e.json` 1420–1476, `sales-fixture.ts` 101–110, `sales.test.ts` 110, BR-901, `round-0-baseline.md` 458, ESC-043 15…). Đây là phí OTA thu, không phải hoa hồng Sale/thưởng của bảng nội bộ. Không cần xử lý.

---

## 3. Đánh giá rủi ro

| Mã | Rủi ro | Khả năng | Ảnh hưởng | Mức | Ghi chú |
|---|---|---|---|---|---|
| R1 | Số của bảng nội bộ mới lọt vào repo công khai khi làm H2 và các việc sau: seed, fixtures, test vàng, ví dụ tiền, mô tả PR, thông điệp commit, ảnh chụp màn hoa hồng vai SAL/CTV/OWN, báo cáo QA | Trung bình (H2 bắt buộc phải test hoa hồng theo cấu trúc mới) | Cao: trái quyết định INV 01/11; lộ chính sách trả người bán cho đối thủ và CTV; **không thu hồi được** khi đã đẩy lên | **Medium** | Chưa xảy ra. Ví dụ tiền cũng là lộ, vì có cơ sở và số tiền thì suy ra tỷ lệ |
| R2 | Bảng nội bộ nằm trong `00-brief/context/pricing/` của thư mục repo, chỉ được chặn bằng `.git/info/exclude` (cục bộ, không đi theo repo, không có trong `.gitignore`). Đường dẫn đã ghi ở `rounds/round-04/outputs/DOM/pricing-spec-2026-11-01-reconcile.md` dòng 4. Nhiều agent có quyền commit cùng làm trong thư mục này | Thấp (`git add -f`, chép tệp sang thư mục khác hoặc worktree, công cụ không đọc exclude) | Cao: lộ cả bảng mục 1–8 | **Medium** | Biện pháp rẻ: G1, G2 |
| R3 | Số cũ trong tệp hiện tại bị hiểu là giá trị chính thức. Nhãn `INV-005` ở BR-212/326/903, mục 13 dòng 563, fixtures, và `production-defaults.ts` nạp tỷ lệ cũ làm mặc định khi bootstrap production. Sau ngày chuyển S, nếu dựng lại DB trống (khôi phục lỗi, môi trường mới) mà OWN không nhập lại, Desk sẽ tính hoa hồng theo số cũ mà không báo gì | Thấp – Trung bình | Trung bình: sai tiền trả CTV/sale | **Medium** (tính đúng) | Về bảo mật chỉ Low, vì số đã hết hiệu lực |
| R4 | Số cũ trong lịch sử git công khai | Đã xảy ra từ 19/10 (có từ commit đầu 15/10) | Thấp: hết hiệu lực từ 01/11, đã có ở hàng trăm bản clone, CTV/nhân viên đã biết | **Low** | Không có biện pháp kỹ thuật nào xóa được các bản đã clone |
| R5 | Tài liệu công khai mô tả **cấu trúc** chính sách mới (một mức cho nhân viên và CTV, có thưởng quản lý, các khoản gồm hoặc không gồm trong cơ sở, theo BR-903 và reconcile.md dòng 74, 101, 117), không ghi số | Đã có | Thấp | **Low** | INV chỉ cấm **số**. SEC không đề nghị xóa, chỉ đề nghị không mô tả thêm. H2 ghi chi tiết ngoài kho mã như ORC đã làm |

Không có Critical/High. SEC không chặn v1.0.3. PR #25 và các tệp trên không đụng luồng tiền đang chạy.

---

## 4. Phương án

### A – Xóa hoặc đánh dấu số cũ ở tệp hiện tại, giữ lịch sử (**đề xuất, bản hẹp**)

- Tài liệu sống (mục 2.1) và fixtures (mục 2.2): làm theo PO-01 (a), (b). Thêm 3 ca SEC bổ sung ở 2.2. Thêm BR-326 dòng 168 và mục 13 dòng 563, để mọi số cũ đều có chữ "trước 01/11 – hết hiệu lực", và nhãn không còn ghi là giá trị chính thức. `openapi.yaml` 4792 và 5274: thay ví dụ bằng tham số thử, hoặc ghi rõ là ví dụ cũ. Màn mẫu hifi và test case: ghi chú "ví dụ theo tỷ lệ cũ".
- Mã: tỷ lệ hoa hồng **không lấy từ mã**. Trong H2, đưa `short_stay_commission_pct` và hoa hồng thuê tháng vào nhóm "INV nhập trên Desk" (như `INV_ENTERS_KEYS` đang làm với giá phòng): không có mặc định, Desk chặn tính và báo "chưa có tỷ lệ". Không thay số cũ bằng số mới trong `production-defaults.ts`, `ds-e.json`, migration.
- Hồ sơ (mục 2.4): **giữ nguyên**. Đó là bằng chứng quyết định. Sửa lại sẽ làm hỏng truy vết và không giảm rủi ro, vì lịch sử vẫn còn.
- Cái giá: khoảng 0,5 ngày DOM + QA (cùng lượt PO-01), một phần việc BE trong H2. Không đổi SHA, tag, image.
- Hạn chế: số cũ vẫn còn trong lịch sử. Chấp nhận được (R4 Low).

### B – Viết lại lịch sử git (`git filter-repo` hoặc BFG) để xóa số cũ

Cái giá:
- **SHA**: số cũ có từ commit đầu tiên (15/10, prototype), nên gần như **toàn bộ khoảng 792 commit** của `main` đổi SHA, cùng khoảng 75 nhánh trên `origin`.
- **Tag** `v1.0.0-rc.1…rc.6`, `v1.0.0`, `v1.0.1`, `v1.0.2`, `landing-v1.0.0…1.1.1` phải tạo lại. `release.yml` đòi **một lượt CI xanh trên đúng `head_sha`**, nên mỗi tag tạo lại phải chạy lại CI, nếu không thì không phát hành hay rollback được.
- **Image**: ghcr gắn tag `sha-<12>` theo commit. Sau khi viết lại, mọi image đang chạy và mọi image để rollback (runbook v1.0.3) không còn khớp commit nào. Mất truy vết image về mã, đúng lúc đang phát hành v1.0.3.
- **PR**: 33 PR giữ `refs/pull/*/head` cũ. GitHub không cho xóa, nên trang diff PR vẫn hiện số cũ. Phải gửi yêu cầu GitHub Support xóa ref và cache, và không chắc được chấp thuận.
- **Fork/clone**: 0 fork, nhưng 671 nguồn clone trong 14 ngày (runner CI, bot quét, có thể có kho lưu trữ mã công khai). Các bản này **không bị ảnh hưởng**.
- **Đội**: khoảng 70 worktree và nhánh agent phải clone lại hoặc rebase. Hàng trăm SHA dẫn trong decision-log, review, QC gate, runbook (ví dụ `74e8833f`, `4d5fb3aa`) thành đường dẫn chết. Phải force-push `main` (tắt bảo vệ nhánh). Remote `private` có lịch sử riêng, sẽ lệch thêm.
- **Thời gian**: khoảng 1–2 ngày OPS + đóng băng kho, với rủi ro làm vỡ phát hành v1.0.3 và H2.
- **Lợi ích**: gần như không có. Số đã hết hiệu lực và đã bị sao chép.

### C – Giữ nguyên

- Cái giá 0, nhưng nhãn vẫn sai (PO-01, R3), mặc định production vẫn là số cũ, và không có biện pháp nào chặn số mới (R1, R2). **Không đạt.**

### Đội đề xuất: **A (bản hẹp) + G1–G4**

| Mã | Biện pháp | Ai | Hạn |
|---|---|---|---|
| G1 | Chuyển `00-brief/context/pricing/OTTIMO_pricing_spec-2026-11-01.md` **ra ngoài thư mục repo** (thư mục riêng của INV/ORC). Thêm `00-brief/context/pricing/` vào `.gitignore` đang theo dõi để chặn dự phòng. Đường dẫn đã công khai, nên ghi vào `.gitignore` không lộ thêm gì | ORC (INV giữ bản gốc) | Ngay, trước H2 |
| G2 | Job CI `confidential-paths`: đỏ nếu có tệp đang theo dõi khớp `00-brief/context/pricing/**` hoặc `*OTTIMO_pricing_spec*`. Không dùng danh sách số trong CI, vì chính danh sách đó sẽ làm lộ số | OPS | Trước H2 |
| G3 | Quy tắc cho H2 và mọi việc về hoa hồng sau này: tỷ lệ thật chỉ có trong cấu hình Desk do OWN nhập. Seed, migration, fixtures, test, ví dụ API, mô tả PR, thông điệp commit, báo cáo QA chỉ dùng **tham số thử đặt tên rõ** (`test_rate_*`). Không ghi số tiền hoa hồng tính theo tỷ lệ thật | BE, QA, DOM, ARC | Áp từ H2 |
| G4 | Ảnh chụp: kiểm tra che giấu trước khi commit ảnh (như quy định đang áp cho dữ liệu khách), thêm mục "dòng hoa hồng/thưởng". Ảnh vai SAL/CTV/OWN trên môi trường đã nhập bảng thật (sau ngày S) phải che số hoặc chụp ở môi trường thử dùng tham số thử. Mẫu PR thêm một ô đánh dấu: "Không ghi tỷ lệ/tiền hoa hồng, thưởng theo bảng nội bộ" | QA, OPS (mẫu PR) | Trước QC v1.0.4 |

---

## 5. Thẻ feedback

### FB-R4-SEC-DOM-01
- Mức độ: Minor
- Vị trí: `br-examples.json` BR-527-05 (dòng 14414), BR-527-06 (14455), BR-903-03 (16067); `business-rules.md` dòng 168 (BR-326), dòng 563 (mục 13 `commission_payout`)
- Vấn đề: PO-01 chưa liệt kê các chỗ này. Ba ca fixtures có số tiền hoa hồng tính theo tỷ lệ nhân viên cũ, nhãn không nói là số cũ. BR-326 và dòng 563 chưa ghi "trước 01/11".
- Vì sao quan trọng: có số tiền và cơ sở thì suy ra tỷ lệ. Nếu sau H2 ai đó "cập nhật" các ca này theo bảng mới, số mới sẽ lọt ra (R1). Nếu để nguyên mà không ghi chú, BE dễ dùng nhầm làm đáp án (R3).
- Đề xuất sửa: làm cùng PO-01 (b). Về bảo mật, cả hai cách của PO đều đạt **với ca cũ**. Với **ca mới của H2**, chỉ được dùng cách (b)(1): tham số thử, không dùng số thật.
- Trạng thái: Open

### FB-R4-SEC-BE-01
- Mức độ: Major
- Vị trí: `product/services/api/src/admin/production-defaults.ts` dòng 472, 496–533, 254–255; `product/tests/fixtures/seed/ds-e.json` 1287–1290, 1365–1402; hotfix H2
- Vấn đề: mặc định production vẫn là tỷ lệ cũ với nhãn `INV-005`. Hướng "cập nhật mặc định cho đúng bảng mới" sẽ đưa số mới vào repo công khai.
- Vì sao quan trọng: (1) trái quyết định INV 01/11 nếu nạp số mới vào mã; (2) dựng lại DB sau ngày S sẽ âm thầm quay về số cũ, gây sai tiền trả CTV/sale.
- Đề xuất sửa: trong H2, đưa các khóa hoa hồng (ngắn ngày, thuê tháng, lịch chi theo cấu trúc mới) vào nhóm "INV nhập trên Desk", không có giá trị mặc định. Thiếu tỷ lệ thì Desk báo "chưa có tỷ lệ hoa hồng" và **không tự tính bằng 0 hay bằng số cũ**. Test H2 dùng tham số thử (G3). ARC xác nhận cách này trong contract H2.
- Trạng thái: Open

### FB-R4-SEC-OPS-01
- Mức độ: Minor
- Vị trí: `.github/workflows/ci.yml`, `.gitignore`, mẫu PR
- Vấn đề: không có lớp chặn nào đi theo repo cho bảng nội bộ (chỉ có `.git/info/exclude` cục bộ).
- Vì sao quan trọng: R2. Chỉ một lần `git add -f` hay chép nhầm tệp là lộ cả bảng, không thu hồi được.
- Đề xuất sửa: G2 (job `confidential-paths`), thêm dòng `.gitignore` của G1, và ô đánh dấu trong mẫu PR (G4).
- Trạng thái: Open

### FB-R4-SEC-ORC-01
- Mức độ: Major
- Vị trí: `00-brief/context/pricing/OTTIMO_pricing_spec-2026-11-01.md` (ngoài git, trong thư mục repo)
- Vấn đề: bảng nội bộ (gồm mục 5–6) nằm ngay trong thư mục mà mọi agent đọc, ghi và commit.
- Vì sao quan trọng: R2 (Medium). Khả năng thấp nhưng nếu xảy ra thì không thu hồi được. Cách sửa gần như không tốn gì.
- Đề xuất sửa: G1. Chuyển tệp ra ngoài thư mục repo. Khi cần cho DOM/BE, ORC đưa đúng phần cần dùng qua kênh ngoài kho mã, như đang làm với H2.
- Trạng thái: Open

---

## 6. ESC

**Không tạo ESC.**

- Không thuộc loại SEC phải báo lên. Không có rủi ro Critical/High không sửa kịp. Không phải câu hỏi pháp lý về dữ liệu cá nhân. Không có chi phí kiểm thử xâm nhập.
- Chính sách đã có: INV chốt 01/11 mục (8). Phương án A thực hiện đúng quyết định đó, không tốn tiền, không đổi phạm vi hay mốc. Mức rủi ro và biện pháp kỹ thuật thuộc quyền SEC.
- Giả định ghi vào decision-log: **[GIẢ ĐỊNH – chờ INV xác nhận]** quyết định 01/11 áp cho **số của bảng mới**; số cũ (ESC-005, hết hiệu lực từ 01/11) không coi là bí mật, nên đội không viết lại lịch sử git.
- Chỉ mở ESC nếu INV trả lời rằng số cũ cũng phải coi là bí mật. Khi đó trình phương án B kèm cái giá ở mục 4 (khoảng 1–2 ngày OPS, tạo lại tag, chạy lại CI, mất truy vết image, PR cũ vẫn hiện số, bản clone không thu hồi được). Đội vẫn đề xuất không làm B.
- ORC chỉ cần nêu một dòng trong `round-summary.md` Round 4 (để INV biết, không cần quyết): "Repo công khai còn số hoa hồng cũ đã hết hiệu lực; số mới không có trong repo; đội không viết lại lịch sử".

---

## 7. Dòng decision-log đề nghị (ORC ghi khi commit)

`| 2026-11-04 | 4 | **SEC – số hoa hồng/thưởng trong repo công khai** (FB-R4-PO-DOM-PR25-01 (c); HEAD 4d5fb3aa + lịch sử mọi nhánh/tag đã đẩy, commit message, 33 PR): **không có số nào của bảng nội bộ 01/11**; bảng nội bộ chưa từng được commit. Số cũ (ESC-005, hết hiệu lực 01/11) còn ở khoảng 60 tệp (tài liệu sống, mã, seed, test, fixtures, hồ sơ round) – bảo mật **Low**, tính đúng **Medium** (nhãn "chính thức", `production-defaults` nạp số cũ). Chọn **A bản hẹp**: không viết lại lịch sử git (B: khoảng 792 commit đổi SHA, tạo lại 10 tag + CI theo head_sha, mất truy vết image sha-<12>, PR cũ vẫn hiện số, 671 nguồn clone/14 ngày); đánh dấu "trước 01/11" ở tài liệu sống/fixtures (cùng PO-01, thêm BR-527-05/06, BR-903-03, BR-326, mục 13 `commission_payout`); hoa hồng không có mặc định trong mã, OWN nhập trên Desk (H2); G1 chuyển bảng nội bộ ra ngoài thư mục repo + `.gitignore`, G2 CI `confidential-paths`, G3 H2 chỉ dùng tham số thử, G4 che ảnh + ô đánh dấu PR. [GIẢ ĐỊNH – chờ INV xác nhận] quyết định 01/11 chỉ áp cho số mới; số cũ không coi là bí mật. Không ESC. Thẻ: SEC-DOM-01 (Minor), SEC-BE-01 (Major), SEC-OPS-01 (Minor), SEC-ORC-01 (Major) | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật); rounds/round-04/reviews/SEC-on-commission-numbers.md |`

---

## 8. Điểm làm tốt (nên giữ)

- DOM tách bảng nội bộ khỏi kho mã từ đầu. BR mục 2.0, BR-201/212/903 và reconcile.md chỉ ghi "xem bảng nội bộ", và bảng chưa từng vào lịch sử git.
- PR #25 đã bỏ các ca hoa hồng thuê tháng với lý do đúng. Ngoài ra còn thêm cờ `commissionInPublicDocs: false` ở BR-201-01, giúp kiểm tự động về sau.
- PO tự dừng ở mức "không ghi số" trong thẻ review và hỏi SEC trước khi đề xuất xử lý lịch sử. Nên làm như vậy với mọi dữ liệu nội bộ của INV.
