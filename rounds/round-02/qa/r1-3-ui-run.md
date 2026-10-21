# R-1.3 – Ca UI cho 4 story "Đang nghiệm thu" không cần VPS (QA, 21/10/2026)

- Căn cứ:
  - `rounds/round-02/outputs/PO/s4-acceptance.md` mục R-1.3: US-010, US-012, US-038, US-112;
  - `round-qc-gate.md` mục 5, Đợt 1;
  - ORC giao 21/10.
- Phạm vi: chỉ test. Không sửa `src`, không commit.
- Stack: QA riêng `ottimo-qa-r2a1` (main `72895de`, ảnh như CI có test-support, cổng 47000/4708x). Không đụng demo.
- Công cụ: Playwright 1.63, `CI=true`, `--retries=0`, project giống CI (`desk-clock` cho ca đồng hồ ảo, `desk-chromium` cho guest-web).

## 1. Ca mới / sửa, theo AC

| Story / AC | Ca | Tệp | Kết quả trên stack QA |
|---|---|---|---|
| US-010 AC1 – công suất 6/9 + chú thích mẫu số | **TC-L8-001 (E)**. Ngày ảo D: 101–103 đang ở, 201–203 đến (6 căn bán), 401 OOO, 301 chỉ giữ chỗ. H03: "6/9 căn bán được (1 đang khóa)", "+ 1 căn đang giữ chỗ (chưa tính)", 66,7 %, Đang ở 3, Khách đến 3 | `e2e/ui-clock/acceptance-r1.spec.ts` | Đạt |
| US-010 AC2 – KPI đổi khi dữ liệu đổi | **TC-L8-002 (E)** (cùng ca): hủy 202 → tải lại 5/9; đặt 302 → 6/9; nhận phòng 201 → Đang ở 4, "1 đã nhận phòng" | như trên | Đạt |
| US-012 AC1 – khai báo, bấm mở màn khai báo | **TC-L8-005 (E)** (cùng ca): dòng "Khai báo lưu trú hôm nay: 3 đơn – hạn sớm nhất 23:00" → nút "Mở" → `/registration`. **TC-X-078** sửa: bước mở H14 chạy chắc chắn | `acceptance-r1.spec.ts`; `ui-clock/gate-s4.spec.ts` | Đạt (cả hai) |
| US-012 AC3 – thị thực | **TC-L8-007 (E)** (cùng ca): khách NN, thị thực đến D+1, ở D → D+2. Dòng "Thị thực của khách hết trước ngày đi – đơn OTM-…", không có ngày hết hạn; "Mở" → đơn | `acceptance-r1.spec.ts` | Đạt – xem lưu ý 4 (1) |
| US-012 AC4 – giữ chỗ sắp hết hạn, căn khóa, phiếu Gấp | **TC-L8-008 (E)** (cùng ca, 10:30): 3 dòng riêng: giữ chỗ hết hạn 12:00, "Căn đang khóa sửa chữa: 401", "Phiếu sửa Gấp đang mở" | `acceptance-r1.spec.ts` | Đạt. Dòng giữ chỗ **thiếu mã đơn** → BUG-R2-217 (ca riêng `knownBug`) |
| US-012 AC5 – trạng thái rỗng | Chạy tay có ảnh (mục 3). Không đưa vào E2E: "Cần chú ý" đọc dữ liệu toàn cơ sở, trên stack CI dùng chung luôn có mục của ca khác | – | Đạt (chạy tay) |
| US-038 AC2 – folio `settled` | **TC-L4-054 (E)**: trả phòng xong. FD mở Folio thấy "Folio đã chốt – cần điều chỉnh thì nhờ quản lý…", 0 nút "Điều chỉnh". MGR thấy câu sau chốt, ghi điều chỉnh F&B 3 → 2 có lý do → 201, folio −75.000 / +50.000, dòng gốc còn | `acceptance-r1.spec.ts` | Đạt |
| US-112 AC2 – màn tự hiện tiếng Anh | **TC-L7-051 (E)**: hồ sơ `preferredLocale: en`, trình duyệt **vi-VN** → nút "Online check-in", ô ngôn ngữ = English. Đổi tay sang Tiếng Việt được | `e2e/ui/guest-web.h18.spec.ts` | Đạt |
| (lỗi phát hiện) | **TC-L7-053 (E)** BUG-R2-218: khách VN, trình duyệt en-US → trang tiếng Việt (đúng P-S4-10) nhưng ghi "Ngôn ngữ theo trình duyệt của bạn" | `guest-web.h18.spec.ts` (`knownBug`) | Hỏng đúng lỗi (expected fail) |
| US-048 AC3 | **TC-RB-008 (E)** đổi tên cho khớp thân ca. Bỏ chữ "Desk chưa hiện"; thêm kiểm "không hiện số đầy đủ" cho đúng tên mới | `e2e/ui/gate-s4.spec.ts` | Đạt |

Các ca axe trong ca mới: `H03-kpi-r13`, `H03-attention-r13`, `H15-folio-settled-fd`, `H15-folio-settled-mgr-adjust`. Ca sẽ đỏ nếu có lỗi critical/serious, và các ca này đều xanh.

## 2. Chạy

- Từng tệp: `acceptance-r1.spec.ts` 4/4 (gồm ca `knownBug` 217 hỏng đúng dự kiến). `guest-web.h18.spec.ts` TC-L7-051/053 + `ui/gate-s4.spec.ts` TC-RB-008: 3/3. `ui-clock/gate-s4.spec.ts` TC-X-078: 1/1.
- Cả project `desk-clock` trên CSDL mới (để chắc ca mới không làm hỏng ca khác chạy sau trong cùng project): **53/53 đạt** trong 2,9 phút (ca `knownBug` BUG-R2-217 tính là đạt vì hỏng đúng dự kiến). Không ca cũ nào đỏ vì dữ liệu ca mới để lại.
- Kiểm tĩnh: `gen_traceability.py --strict` exit 0 (254/254 AC có TC). `gen_rbac_cases.py --check` OK. `validate-fixtures.mjs` 0 lỗi. Prettier, ESLint, `tsc` của `@ottimo/tests` sạch. `docs/qa/traceability.md` sinh lại.
- **Chưa chạy trên CI.** Lượt CI đầu tiên của commit chứa các ca này là bằng chứng chính thức cho PO (C13).

## 3. US-012 AC5 – chạy tay có ảnh (CSDL mới)

- Stack `ottimo-qa-r2a1` vừa `down -v` + seed DS-E. Ngày 28/10/2026 07:30 (đồng hồ stack). Dữ liệu duy nhất: 1 giữ chỗ 301 đến hôm nay, hết hạn 10:00 (còn 2 giờ 30 phút, ngoài khoảng nhắc 2 giờ của BR-303).
- API `GET …/attention` = `{"data":[]}`. H03 (qa.fd, 1366×768): khối "Cần chú ý" hiện **"Không có việc cần chú ý."**. Bên cạnh vẫn có "Giữ chỗ chưa cọc (1)", nên trang không chuyển sang trạng thái rỗng toàn trang.
- Ảnh (ngoài repo, dữ liệu giả): `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/qa-r2a1/evidence-ac5/ac5-h03-can-chu-y-rong.png` (toàn trang), `…/evidence-ac5/ac5-khoi-can-chu-y.png` (khối).

## 4. Lưu ý cho PO khi chấm

1. **US-012 AC3.** Bấm dòng thị thực mở **drawer đơn** (`/reservations/{id}`), không mở thẳng màn giấy tờ như chữ AC ("mở màn giấy tờ của đơn, nơi thấy ngày hết hạn thị thực"). Ca chỉ kiểm tới drawer. Nhánh "thiết bị chưa cấp → thông báo US-142" chưa có ca UI. PO quyết: nhận drawer là đủ, hay đổi đích link (FE-B).
2. **US-012 AC4.** Đạt "mỗi loại một dòng". Dòng giữ chỗ thiếu mã đơn (BUG-R2-217, P3): lễ tân vẫn bấm "Mở" tới đúng đơn. Không chặn AC theo DoD (chỉ P0/P1 chặn).
3. **US-112 AC2.** Nhánh "hồ sơ English" đạt. Nhánh "trình duyệt tiếng Anh" thực tế **không xảy ra với khách VN**: server tự gán `preferredLocale` theo quốc tịch (`guests.service.ts:233`), hồ sơ luôn thắng trình duyệt (P-S4-10). Khách nước ngoài có hồ sơ `en` nên ra tiếng Anh (TC-L7-014). Câu "Ngôn ngữ theo trình duyệt của bạn" hiện sai nguồn: BUG-R2-218, P3.
4. **US-010.** Số trên màn khớp API `dashboard/tonight` và công thức `metrics-definitions.md` (OOO trừ mẫu số, giữ chỗ không tính).

## 5. Lỗi mới

| Mã | Mức | Tóm tắt | Vai |
|---|---|---|---|
| BUG-R2-217 | P3 | "Cần chú ý" dòng giữ chỗ sắp hết hạn thiếu mã đơn (`hold_expiring` không có `refCode`) | BE-A |
| BUG-R2-218 | P3 | guest-web ghi "Ngôn ngữ theo trình duyệt" cả khi ngôn ngữ lấy từ hồ sơ | MOB (+ BE-D, UXD) |
