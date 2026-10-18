# Nghiệm thu của PO – Round 2, Sprint 4 (tuần Ổn định, trước cổng QC Sprint 4)

- Người nghiệm thu: PO | Ngày: 18/10/2026 | Bước: **QC – nghiệm thu** (G6.1, G6.2, M7 của `qc/s4-gate-readiness.md`)
- **Nghiệm thu trên CI + stack tạm, chờ staging.** Chưa có VPS. Mọi "Đạt" dưới đây là **Đạt (stack tạm)**. Theo P-R2-7, story chỉ lên "Xong" khi PO kiểm lại giao diện trên staging.
- Bản được nghiệm thu:
  - mã ở HEAD **`7ac11a4`** (gộp #14, BUG-R2-178);
  - bằng chứng chạy lấy từ **CI #12 `3bd4ac4`** (run 39083129953), là CI xanh gần nhất: 8/8 job xanh. Job E2E có 1.912 ca đạt, 0 ✘, 0 `retry #`, 84 ca UI, 13 ca axe (QC đã đọc log). `known-bugs.ts` có `OPEN = {}`, nên không ca nào được che bằng `test.fail`;
  - từ #12 đến #14 chỉ khác phần tiền và minibar (#13, #14). Commit chấm cổng do QC đọc lại CI (G5.1).
- Cách làm:
  - PO không chạy stack;
  - PO đọc thân ca E2E (`product/tests/e2e/ui`, `ui-clock`, `api`, `clock`), test tích hợp BE (`services/api/test/integration/*-s4*.test.ts`) và test FE/MOB (vitest + MSW);
  - PO đọc các báo cáo `outputs/BE/s4-be-c.md`, `s4-be-d.md`, `outputs/FE/s4-report.md` (FE-A, FE-B), `outputs/MOB/s4-report.md`, `qa/s4-test-report.md`, các review `reviews/s4-UXD.md`, `s4-ARC.md` (mục A), `s4-SEC.md` (đang viết) và truy vết `product/docs/qa/traceability.md` (`--strict` exit 0, 254/254 AC có TC).
- Quy tắc riêng của lượt này (ORC giao, QC-S3-09): **AC giao diện chỉ được nhận khi có ca UI bấm thật hoặc QA chạy tay có ảnh.** Ca vitest + MSW của FE/MOB và lượt dev tự xem bằng Chromium không thay được bằng chứng này.

## 0. Cách đọc

| Ký hiệu bằng chứng | Nghĩa |
|---|---|
| **E2E-UI** | Ca trình duyệt bấm thật trên API thật (`desk-chromium`, `desk-clock`, PWA cổng staff), có trong CI #12 |
| **E2E** | Ca Playwright tầng API (`api`, `clock`, `serial`), CI #12 |
| **TT** | Test tích hợp BE trên PostgreSQL thật (job `test` của CI #12) |
| **FE / MOB** | Test vitest + MSW của admin-web / PWA / guest-web. Không đủ để nhận AC giao diện |

| Kết quả AC | Nghĩa |
|---|---|
| **Đạt** | Đúng AC ở phần R2 và có bằng chứng chạy thật. AC về dữ liệu, quyền, trạng thái mà server quyết thì nhận bằng E2E/TT. AC có chữ, nút, thẻ, bố cục trên màn thì phải có E2E-UI |
| **Đạt (G1)** | Như "Đạt", nhưng số tiền nằm trong phạm vi kiểm chứng S4-38. Nếu báo cáo kiểm lại lần 6 mở lại lỗi trên AC này thì PO chuyển về "Chưa" |
| **Chờ ca UI** | Phần server đã đạt (E2E/TT). Phần giao diện chưa có E2E-UI hoặc QA chạy tay có ảnh. Ca cần thêm ghi ở mục 5 |
| **Chưa** | Chưa có bằng chứng chạy cho AC (mã có, ca chưa viết) |
| **Dời R3** | PO quyết dời phần này sang R3, có lý do và tác động (mục 2). Đã vào hàng chờ R3 của backlog (mục 5.5) |

Kết quả cấp story → cột Trạng thái backlog:
- mọi AC phần R2 "Đạt" và không bị giữ → **Đạt (stack tạm)**;
- còn lại → **Đang nghiệm thu**, kèm lý do giữ:
  - **Chờ ca UI**;
  - **Chờ G1** (story có AC tiền trong phạm vi S4-38: lên Đạt khi báo cáo lần 6 có 0 ca lệch);
  - **Chờ review**: thẻ Blocker/Major đang mở trên đúng đường mã, hoặc review bắt buộc chưa xong (SEC G2.4, ARC mục B).

## 1. Tổng hợp

| Nhóm | Số AC | Đạt | trong đó Đạt (G1) | Chờ ca UI | Chưa | Dời R3 |
|---|--:|--:|--:|--:|--:|--:|
| A. 15 story Must R2 giao trong Sprint 4 (mục 3) | 49 | 28 | 1 | 20 | 0 | 1 |
| B. Phần Sprint 4 của 24 story "Đang nghiệm thu" (mục 4) | 37 | 22 | 6 | 12 | 2 | 1 |
| **Tổng** | **86** | **50** | **7** | **32** | **2** | **2** |

- Không đếm các AC đã dời R3 từ trước theo R-C (US-012 AC2, US-086 AC3, US-119 AC5, phần mã cửa của US-108 AC2).
- **Không AC nào bị trả lại.** Không thấy chỗ nào chạy sai AC. Thiếu chủ yếu là **ca UI bấm thật** cho màn mới (H03 Hôm nay, H19/H21 PWA, H23 guest-web, các nút tiền mới trên Desk).
- **G6.2:** tệp này.
- **G6.1:** 15 story "Sẵn sàng (Sprint 4)" nay đều ≥ "Đang nghiệm thu". Không còn phần Must R2 nào "chưa làm": hai phần chưa có người làm đã có quyết định (mục 2).
- Cột Trạng thái của 71 story Must R2 sau lượt này:

| Trạng thái | Trước (17/10) | Sau (18/10) | Story đổi |
|---|--:|--:|---|
| Đạt (stack tạm) | 32 | **36** | lên: US-003, US-019, US-084, US-085 |
| Đang nghiệm thu | 24 | **35** | thêm 15 story Sprint 4, bớt 4 story vừa lên Đạt |
| Sẵn sàng (Sprint 4) | 15 | **0** | – |

- Lý do giữ 35 story "Đang nghiệm thu" (mỗi story xếp vào một nhóm, theo lý do chính):

| Lý do giữ | Story |
|---|---|
| Chờ ca UI (22) | US-006, 010, 011, 012, 016, 020, 030, 031, 032, 038, 048, 052, 054, 057, 061, 062, 083, 086, 108, 109, 112, 119 |
| Chờ G1 – báo cáo S4-38 lần 6 (7) | US-007, 024 (còn AC4 "Chưa"), 025, 028, 029, 066, 136 |
| Chờ review (4) | US-043 (SEC G2.4 nhóm D mục A), US-110 (SEC G2.4 guest-web + ARC `s4-ARC.md` mục B – EP14), US-053 và US-055 (ARC FB-R2-ARC-BE-S4-01, 02 – Major, mở) |
| Chưa có ca – S4-33 (1) | US-139 (AC3) |
| Kiểm tay trên staging (1) | US-135 (AC3 trình đọc màn hình – từ S3) |

## 2. Quyết định PO trong lượt này (thuộc quyền PO – đã ghi decision-log 18/10)

| # | Quyết định | Lý do và tác động |
|---|---|---|
| **P-S4-14** | **US-012 AC7, dòng "Đồng bộ kênh lỗi" → Dời R3**, làm cùng US-096 (đẩy phòng trống qua channel manager, Must R3) và job J18 `outbox.dispatch`. Phần "khách quen/VIP đến hôm nay" của AC7 giữ R2 và đã Đạt | **Lý do:**<br>- R2 không có kết nối kênh thật: lệnh đồng bộ chỉ được ghi lại, adapter là Mock (`architecture.md` J18; US-094 Should R2 đã cắt ở bước 1). J18 chưa có trong `worker.ts`. Vì vậy ở R2 không có lỗi đồng bộ nào thật để báo.<br>- Làm ngay thì phải dựng J18 + retry + trạng thái `dead` + nguồn `channel_sync_error` (≈ 1–1,5 ngày BE-D/INT) chỉ để chạy được bằng lỗi giả.<br>**Tác động:**<br>- R2 và bản dùng thử trên dữ liệu giả không mất gì.<br>- Lễ tân đóng bán thủ công trên extranet như hiện nay.<br>- Phải xong trước RC, cùng lúc nối channel manager (R3).<br>- Không đổi số AC; TC-L8-012 chỉ còn kiểm phần VIP (QA ghi chú) |
| **P-S4-15** | **US-031 AC1 "báo đỏ"**:<br>- R2 = thẻ "khách trả phòng hôm nay" chuyển **"Quá giờ trả phòng"** màu đỏ, có chữ, xếp đầu, trên **Hôm nay** của FD/FDL và MGR (đọc server, SSE). Phần này cần ca UI;<br>- **thông báo chủ động J4** (inbox/push cho FD + MGR lúc 12:00/12:31, BR-425) → **Dời R3**, làm cùng nhắc trả phòng tự động (US-034, US-161) | **Lý do:**<br>- push ở R2 là Mock (`s4-be-d.md` 2.4), nên thông báo J4 chỉ vào hộp thư trên Desk, cùng chỗ với thẻ đỏ đã có;<br>- hợp đồng 0.3.7 chưa có loại thông báo "quá giờ trả phòng" (chỉ `checkout_call_needed`); thêm sau đóng băng phải qua ARC;<br>- J4 chưa có job nào; trạng thái thẻ tính khi đọc (đã đạt từ S3, TC-L4-022).<br>**Tác động:**<br>- quản lý vắng mặt không nhận báo chủ động ở R2;<br>- vận hành tạm: lễ tân gọi quản lý khi thẻ đỏ có khách đến cùng căn (đằng nào trả muộn khi có khách đến cũng cần quản lý duyệt, BR-416);<br>- R3 Sprint 1, trước RC |
| **P-S4-16** | **US-061 AC1** – ngày "mở bán lại từ …":<br>- R2 nhận cách hiện **ngay sau khi lưu** (toast, drawer, tab Khóa phòng; ngày do server tính theo BR-804);<br>- hiện **trước khi lưu** → R3, Should (ARC thêm `BookingRules.oooReopenBufferDays` hoặc tính thử) | FD/MT không đọc được `ooo_reopen_buffer_days` (FE-B, MOB cùng nêu). Ngày mở bán hiện ngay khi lưu và sửa được bằng "Đổi ngày mở bán". Rủi ro báo khách sai ngày trước khi lưu là thấp |
| **P-S4-17** | **US-052 AC1** – PWA H19 hiện trạng thái buồng bằng **câu thường + icon + màu**, không hiện mã VC/VD. PO nhận cách này là "nhãn trạng thái bằng chữ" (UXD H19). Mã vẫn hiện trên Desk | Buồng phòng đọc câu nhanh hơn đọc mã. Mã chỉ dùng nội bộ lễ tân |
| **P-S4-18** | **US-066 AC2** đọc theo **BR-702-04** (DOM 18/10, minibar M-1): giá mới áp từ **lần nạp sau**; các lần kiểm trong cùng kỳ nạp giữ giá lúc nạp; dòng folio đã ghi giữ nguyên | DOM chốt mô hình kỳ nạp (decision-log 743, 759). Không đổi chữ AC (vẫn "lần kiểm sau dùng giá mới"), chỉ thêm ghi chú ở backlog |
| **P-S4-19** | **Quy tắc giữ story** (mục 0): story có AC tiền trong phạm vi S4-38 chỉ lên "Đạt (stack tạm)" khi báo cáo kiểm lại lần 6 có 0 ca lệch. Story có review bắt buộc chưa xong hoặc thẻ Major mở trên đúng đường mã thì giữ "Đang nghiệm thu" | Không ngoại lệ tiền (G1). DoD mục 10: không còn Blocker/Major mở |
| **P-S4-20** | Đưa **16 mục** vào **hàng chờ R3** (backlog mục 5.5): 11 mục ORC ghi dời ngày 18/10, cộng 2 mục QC nêu "đã dời R3 nhưng chưa có quyết định" (H24 bản 24.2 cho FDL/FD; xóa `note` yêu cầu khách sau hạn – T13), cộng 3 mục từ P-S4-14, 15, 16 | Mỗi mục có ưu tiên, sprint R3 dự kiến, vai và nguồn |

- **Không có ESC mới.** P-S4-14 và P-S4-15 chỉ dời hai câu báo (không bỏ phân hệ, không dời mốc, không đổi chính sách hay chi phí). Cả hai phụ thuộc phần chỉ có ở R3 (kết nối kênh thật, gửi tin thật). ORC báo INV một dòng ở tổng kết.
- **Ghi cho QC (11.2):**
  - hai phần trên chuyển **R3**, không dùng suất "tối đa 3 phần Must R2 sang Ổn định" của G6;
  - nếu ORC hoặc QC muốn giữ ở R2 thì phương án thay thế là giao BE-D trong tuần Ổn định:
    - J4 ≈ 0,5–1 ngày (+ ARC thêm loại thông báo sau đóng băng);
    - J18 + nguồn `channel_sync_error` ≈ 1–1,5 ngày;
  - PO không đề xuất phương án này.

## 3. 15 story Must R2 giao trong Sprint 4

### US-010 KPI đêm nay – **Đang nghiệm thu (Chờ ca UI)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 công suất 6/9, `hold` không tính, chú thích mẫu số | TT `dashboard-s4-bed` "US-010 AC1 + US-019 AC2": 6 / (10 − 1 OOO) = 66,7 %, `hold` tách riêng, khối `planned` không trừ. axe H03 (TC-X-040). **Còn:** chưa có E2E-UI xem ô KPI và chú thích mẫu số trên H03/H24 với API thật. DATA chưa đối chiếu A7 trên DS-0 (G4.4) | Chờ ca UI |
| AC2 dữ liệu đổi → KPI đổi, không số cố định | TT: KPI tính khi đọc. FE `s4-feb-dashboard` (SSE đọc lại khối). **Còn:** E2E-UI đổi đơn → H03 cập nhật | Chờ ca UI |
| AC3 02:00 ngày 21/10 → đêm 20/10 | TT "US-010 AC3: at 02:15 … still the night of 15/10" (server trả `businessDate`, Desk dùng nguyên giá trị) | Đạt |

### US-011 Khách đến/đi hôm nay – **Đang nghiệm thu (Chờ ca UI)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 không có đơn `cancelled`/`no_show`; `hold` ở mục riêng | TT "US-011 AC1/AC2": khách đến = `confirmed` + `in_house`, `hold` là danh sách riêng. **Còn:** E2E-UI H03 (mục "Giữ chỗ chưa cọc" riêng) | Chờ ca UI |
| AC2 nút Nhận phòng / Trả phòng, chip "Đã nhận"/"Đã trả" | TT `allowedActions` (parity với `Reservation.allowedActions`). **Còn:** E2E-UI bấm "Nhận phòng"/"Trả phòng" từ H03 (A1 đang mở đơn bằng URL) | Chờ ca UI |
| AC3 01:30 ngày 21/10 đơn ngày 20/10 vẫn hiện, nút dùng được | TT: ngày nghiệp vụ, cửa sổ sau nửa đêm (0.3.7 B-20). **Còn:** E2E-UI `desk-clock` 01:30 | Chờ ca UI |

### US-012 Cần chú ý – **Đang nghiệm thu (Chờ ca UI)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 dòng khai báo + hạn, bấm mở màn khai báo | Nguồn `registration_due/overdue` đạt từ S3 (`GET /attention`). **Còn:** E2E-UI bấm dòng mở H14. Lưu ý BUG-R2-170 (P2, danh sách bỏ sót khi hồ sơ mở > 1.000) – BE-C đang sửa | Chờ ca UI |
| AC2 | [Dời R3 – R-C] (ESC-012) – không tính | – |
| AC3 thị thực: mã đơn + căn; bấm trên máy được cấp | Nguồn `visa_expiring` đạt từ S3 (SR-RET-06). **Còn:** E2E-UI bấm dòng → màn giấy tờ (máy được cấp / chưa cấp) | Chờ ca UI |
| AC4 giữ chỗ sắp hết hạn, khối OOO, phiếu sửa mức Cao – mỗi loại một dòng | TT: `hold_expiring` (`dashboard-s4-bed` J2), `work_order_high_open` (`housekeeping-s4`). `room_ooo` mới có test đơn vị (`be-d-s4-units`). **Còn:** một ca H03 dựng đủ 3 loại (thay cho kiểm API riêng `room_ooo`) | Chờ ca UI |
| AC5 rỗng → "Không có việc cần chú ý" | FE (`today.empty_*`). **Còn:** E2E-UI | Chờ ca UI |
| AC6 FD không thấy dòng FOC | TT: server lọc theo vai (`attentionAudience`), FD/FDL/MGR không nhận `foc_threshold`; S4-06 `closed_reservation_credit` chỉ hệ thống đóng | Đạt |
| AC7 (phần R2) khách quen/VIP đến hôm nay | TT "US-012 AC7 vip_arrival" + `attention-dom-s4-bed` BR-956-01 (người đứng tên, không tên trong `params`). Người đi cùng VIP → R3 (DOM-S4-11 (2), đã xếp 17/10) | Đạt |
| AC7 dòng "Đồng bộ kênh lỗi" | Chưa có nguồn (J18 chưa có) | **Dời R3 – P-S4-14** |
| AC8 cảnh báo FOC (BR-435) chỉ OWN | TT "US-012 AC8 foc_threshold" + DOM-S4-08 (BR-435-02, tính cả giảm giá đặc biệt) | Đạt |

### US-052 Xem trạng thái buồng (PWA H19) – **Đang nghiệm thu (Chờ ca UI)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 điện thoại 360 px: 10 thẻ, số căn, trạng thái bằng chữ, khách đến kế tiếp, không cuộn ngang | TT "US-052: 10 rooms…". MOB `flow.test` + MOB tự xem 360 px (0 px cuộn ngang) – không thay được bằng chứng QA. P-S4-17 (câu thay mã). **Còn:** E2E-UI PWA 360×800 hoặc QA chạy tay có ảnh | Chờ ca UI |
| AC2 lọc "Cần dọn" → `VD`, `OD`, `CL` | TT (lọc). **Còn:** E2E-UI | Chờ ca UI |
| AC3 HK chỉ thấy tên khách ở căn có việc hôm nay, không kênh/giá | TT phạm vi T (HK ngoài phạm vi → không có tên, ghi → 404; MT không bao giờ thấy). MOB `guard.test`: PWA không gọi API C3/tiền | Đạt |

### US-053 Đổi trạng thái buồng hợp lệ – **Đang nghiệm thu (Chờ review – ARC Major)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 `VD` → "Bắt đầu dọn" → `CL`; "Dọn xong" → `OC`/`VC` | E2E-UI TC-X-070 (A1) và TC-X-072 (A4): HK bấm "Bắt đầu dọn" → `CL`, "Dọn xong" → `VC` trên PWA, ghi lại request `expectedFrom`. TT "US-053: R1 → R3…" có nhánh còn khách → `OC`. Nút theo `allowedEvents` của server | Đạt |
| AC2 sang `VC`/`OC` → việc dọn mở tự `done` | TT "US-053 … with the cleaning task" | Đạt |
| AC3 `VC` → "Kiểm đạt" qua checklist → `VI`; HK tự kiểm có điều kiện | E2E-UI A1/A4: FDL tick đủ checklist + ảnh → `VI`. TT "US-055 … HK self-inspection gated" | Đạt |
| AC4 chuyển bị cấm → từ chối | TT: 409 `currentState` khi `expectedFrom` lệch, 422 `performedAt`, chuyển cấm bị từ chối | Đạt |
- Giữ "Đang nghiệm thu" theo P-S4-19. `reviews/s4-ARC.md` có hai thẻ Major mở trên đúng đường mã này:
  - **FB-R2-ARC-BE-S4-01**: hàng đợi offline có hai bước trên cùng căn bị 422;
  - **FB-R2-ARC-BE-S4-02**: thứ tự khóa `room` → `hk_task`.
- BE-C sửa trong tuần Ổn định; story lên Đạt khi ARC ghi Verified.

### US-054 Việc hôm nay tự sinh – **Đang nghiệm thu (Chờ ca UI)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 trả phòng → "Dọn trả phòng" có trong danh sách HK | E2E-UI TC-X-070 (A1): sau H16 hoàn tất, thẻ việc của căn hiện trên PWA "Việc của tôi" | Đạt |
| AC2 yêu cầu "Khăn, đồ dùng" → việc có chip "App khách" + ghi chú khách | TT "EP14 port (BE-D): a guest request becomes a guest_request task (rank 3)…". MOB `flow.test` (chip). **Còn:** E2E-UI guest-web gửi → PWA thấy chip | Chờ ca UI |
| AC3 tick xong → bộ đếm x/y; lễ tân thấy cùng trạng thái | E2E-UI TC-L6-022 (E) + TC-L6-033 (E) `ui-clock/ops.s4` (S10 Desk: "Làm xong" → bộ đếm; hủy "Khác" cần ghi chú). Một nguồn dữ liệu server + SSE `hk_task.changed` | Đạt |
| AC4 sắp theo BR-807 | TT "US-054: ranks (priority > arrival room > guest request > checkout > stay-over > ad hoc)"; PWA và Desk sắp theo `priorityRank` của server. QA kiểm thứ tự hiển thị trong ca H19 (mục 5) | Đạt |

### US-055 Checklist kiểm phòng – **Đang nghiệm thu (Chờ review – ARC Major)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 chưa tick đủ mục bắt buộc → không `VI` | TT "US-055: checklist … fail → VC…, 409 CHECKLIST_OUTDATED". E2E-UI A1: nút "Kiểm đạt" chỉ mở khi đã tick đủ | Đạt |
| AC2 biên bản ghi người kiểm, thời điểm, căn, ảnh | TT `listInspections`; E2E-UI A1 (request `recordInspection` 201, mọi mục `passed`) | Đạt |
- Giữ "Đang nghiệm thu" vì ARC FB-R2-ARC-BE-S4-01 và 02 (Major) nằm trên `recordInspection`.

### US-057 Báo sự cố từ điện thoại – **Đang nghiệm thu (Chờ ca UI)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 HK báo sự cố có ảnh, mức → phiếu `new`, mã server, MT thấy; mức Cao báo MT/FD/MGR + "Cần chú ý" | TT "US-057/061/062: HK reports…, deadlines + notifications"; J11; nguồn `work_order_high_open`. E2E-UI TC-X-072 (A4): màn H21 bấm thật (vai MT, loại "hỏng", ảnh) → `createWorkOrder` 201, mã WO hiện trên Desk S11 | Đạt |
| AC2 "cần khóa phòng" → phiếu ghi đề nghị; FD/MT xác nhận tạo khối; HK không tự tạo khối (A86) | TT: HK gửi `blockRequested`, FD khóa theo đề nghị; server chặn HK tạo khối. **Còn:** E2E-UI HK tick "Đề nghị khóa căn" trên PWA → Desk "Khóa phòng theo đề nghị" | Chờ ca UI |

### US-061 Tạo phiếu sửa và khóa phòng – **Đang nghiệm thu (Chờ ca UI)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 khóa [15, 18), buồng `OOO`, chặn bán, có hai ngày | E2E-UI TC-L6-040 (E) S11: phiếu + Khóa căn → toast "khóa đêm …, mở bán lại từ …", căn `OOO`. TC-X-072: H12 không liệt kê căn. TT BR-804 (`ooo_reopen_buffer_days`). Hai ngày hiện **sau khi lưu** – P-S4-16 | Đạt |
| AC2 trùng đơn tương lai → danh sách đơn cần dời | E2E TC-L6-041 (`api/room-blocks`), TT (409 `ROOM_UNAVAILABLE` kèm mã đơn, không tên khách). Không còn đường "quản lý xác nhận vẫn khóa" (ARC 0.3.5 A-03, chặt hơn AC). **Còn:** E2E-UI danh sách đơn + link trên S11 | Chờ ca UI |
| AC3 căn có khách `in_house` → không khóa, gợi ý đổi phòng | E2E-UI TC-L6-042 (E): "Căn đang có khách – chưa khóa được" → "Tạo phiếu không khóa" | Đạt |
| AC4 thiếu mô tả → không lưu | E2E-UI TC-L6-043 (E) | Đạt |

### US-062 Cập nhật phiếu sửa – **Đang nghiệm thu (Chờ ca UI)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 `done` (xác nhận US-135) → khối `released`, `OOO` → `VD`, "Dọn sau sửa chữa", mở bán | E2E-UI TC-L6-045 (E) S11 Desk: Nhận việc → Sửa xong (ghi chú + ảnh) → hộp hậu quả, focus nút an toàn → căn `VD` + việc dọn, khối kết thúc (BUG-R2-108 đã sửa). TC-X-072 trên PWA (bản kỹ thuật) | Đạt |
| AC2 chỉ theo SM-04; nhật ký người đổi, thời điểm | TT "SM-04 with history"; BUG-R2-108 (`allowedActions` theo vai × trạng thái); `listAssignableStaff` (0.3.7 bổ sung 3). Desk chưa có ô đổi người xử lý (FE-B, NÊN) | Đạt |
| AC3 phiếu mức Cao, căn có khách, quá hạn → gợi ý đổi phòng + FOC | TT J11 "remedy suggested for an occupied room". **Còn:** E2E-UI drawer hiện gợi ý | Chờ ca UI |

### US-066 Danh mục minibar – **Đang nghiệm thu (Chờ G1)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 món "miễn phí" → không tính tiền, vẫn ghi tiêu hao | TT `minibar-catalog-s4-bed` "AC1 / BR-701"; E2E TC-L4-070 | Đạt |
| AC2 đổi giá → lần sau dùng giá mới, dòng cũ giữ | TT "AC2 / BR-006" + `minibar-m1`; E2E-UI TC-L4-133 (`ui-clock/minibar-recount.s4`). Đọc theo BR-702-04 (P-S4-18) | Đạt (G1) |
| AC3 FD/HK không sửa được danh mục, giá, giá vốn | E2E-UI TC-RB-017 (E) S13 (FD, FDL chỉ đọc, không cột giá vốn); TT A91 (FD, FDL, HK bị từ chối) | Đạt |

### US-108 Thông tin lưu trú (guest-web H23) – **Đang nghiệm thu (Chờ ca UI)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 ngày nhận/trả, giờ chuẩn, địa chỉ + "Chỉ đường" (ghim INV), nội quy kèm phí | TT "US-108: room NAME not number (BR-012), map pin from the parameter (INV pin)…". SEC đã xác nhận tên miền `maps.app.goo.gl` (`s4-SEC.md` mục B, S4-51). MOB `requests.test` (không số căn). **Còn:** E2E-UI H23 tab Thông tin (390×844) | Chờ ca UI |
| AC2 (phần Wi-Fi) ẩn trước hiệu lực, hiện trong khoảng, ẩn sau trả phòng | TT "Wi-Fi from the arrival day"; E2E TC-L7-021. Server không trả Wi-Fi ngoài khoảng. Phần mã cửa: [Dời R3 – R-C] | Đạt |

### US-109 Khách gửi yêu cầu (H23 tab Yêu cầu) – **Đang nghiệm thu (Chờ ca UI)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 gửi "Báo hỏng" → thẻ "Đã gửi"; nhãn SM-15; "Dọn thêm" có phí phải đồng ý (ESC-016 A) | TT "US-109 options", "BR-506 short stay…", "createGuestRequest validation", "paid extra cleaning … fee in the folio once". **Còn:** E2E-UI guest-web gửi yêu cầu (có/không phí) | Chờ ca UI |
| AC2 nhân viên `done` → "Hoàn thành"; `declined` → khách thấy lý do | TT "SM-15 transitions…". SEC chưa quyết luật B-15 trong `replyNote` (`s4-SEC.md` mục C). **Còn:** E2E-UI trang khách đổi trạng thái | Chờ ca UI |

### US-110 Định tuyến yêu cầu – **Đang nghiệm thu (Chờ review)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 "Báo hỏng" → phiếu sửa nguồn App khách; dọn/khăn → việc HK; xe/trả muộn/khác → lễ tân | TT "US-109/110: report at 21:59 → maintenance…; HK task for towels"; cổng EP14 của BE-C | Đạt |
| AC2 chưa "Đã nhận" quá hạn trong giờ trực → nhắc FD; ngoài giờ → trả lời tự động kèm giờ | TT J10 "guest_request.sla" (nhắc một lần: bộ phận + FD + FDL + MGR – DOM-S4-10); 22:00 → `autoReply`, hạn 07:10 | Đạt |
| AC3 HK/MT chỉ thấy yêu cầu của bộ phận mình | TT "S30 lists: FD+ everything, HK/MT only what is routed to them (US-110 AC3), SAL 403; fee hidden from HK" | Đạt |
- Mọi AC đều Đạt. Giữ "Đang nghiệm thu" tới khi xong hai review bắt buộc:
  - SEC G2.4 cho guest-web yêu cầu khách (P-R2-4, B-15);
  - ARC `s4-ARC.md` mục B (EP14).
- Hàng yêu cầu trên H03 Desk chưa có ca UI. QA thêm ca này (mục 5) để PO nghiệm thu lại trên staging.

### US-112 App khách tiếng Anh – **Đang nghiệm thu (Chờ ca UI)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 bấm "English" → mọi chữ tiếng Anh | MOB `requests.test` luồng EN không còn chữ VI cố định. **Còn:** E2E-UI H23 bằng EN | Chờ ca UI |
| AC2 hồ sơ English hoặc trình duyệt EN → mặc định EN | TT `guest-locale-s4-bed` (fr-FR → en, ru-RU → ru, vi-VN → vi, vắng → en; hồ sơ thắng trình duyệt; lựa chọn của khách giữ khi cấp lại link – P-S4-10). **Còn:** E2E-UI mở link với `Accept-Language` EN | Chờ ca UI |
| AC3 chuỗi pháp lý EN là bản đã duyệt | UXD duyệt 8 nhóm chuỗi Sprint 4 (338 chuỗi, `reviews/s4-UXD.md`); chuỗi pháp lý H18 đã duyệt từ S3. RU còn nháp 5 khóa thương hiệu – không thuộc AC này | Đạt |

## 4. Phần Sprint 4 của 24 story "Đang nghiệm thu" (sprint-4-plan mục 5.2)

| Story | AC (phần Sprint 4) | Bằng chứng | Kết quả | Trạng thái story |
|---|---|---|---|---|
| US-003 | AC2 HK xem minibar/kho không có giá vốn | TT `minibar-catalog-s4-bed` "US-003 AC2: HK sees quantities but no cost price"; E2E-UI TC-RB-003/017 (E) S13 (FD/FDL không cột giá vốn, MGR có) | Đạt | **Đạt (stack tạm)** – lên |
| US-003 | AC4 FD không thấy doanh thu, ADR, RevPAR, cảnh báo FOC | TT: `getTonightKpi` không có trường tiền, FD không nhận `foc_threshold`. R2 "Tổng quan" chỉ OWN/MGR (UXD giữ H02 2.2), FD mở Hôm nay | Đạt | ↑ |
| US-006 | AC1 điều chỉnh dòng trên Desk (S4-27) | FE-A `s4-money` (4 ca, vitest); API TC-NT-016 đạt từ S3. Không có E2E-UI | Chờ ca UI | Đang nghiệm thu |
| US-007 | AC1 xin FOC ngoài bước nhận phòng (S4-25) | E2E-UI TC-X-071 (A1), TC-L4-099, TC-L3-083 (`ui-clock/foc.s4`) | Đạt (G1) | Đang nghiệm thu (Chờ G1) |
| US-007 | AC6 lễ tân tự áp FOC minibar trên Desk | E2E-UI TC-NT-053 (`foc.s4`), TC-L4-126 (`minibar-recount.s4`) | Đạt (G1) | ↑ |
| US-135 | AC1 hộp xác nhận "Sửa xong" phiếu có khóa | E2E-UI TC-L6-045 (E): hộp nêu hậu quả, focus nút an toàn | Đạt | Đang nghiệm thu (AC3 kiểm tay trình đọc màn hình trên staging – từ S3) |
| US-016 | AC1 10 căn × 14 ngày, cột hôm nay (token DS v0.4.1) | E2E-UI TC-L2-001 (E) | Đạt | Đang nghiệm thu (Chờ ca UI) |
| US-016 | AC2 phân biệt trạng thái bằng màu + chữ | E2E-UI TC-L2-002 (E) (chú giải); axe H08 sáng + tối (TC-X-040) trên token mới | Đạt | ↑ |
| US-016 | AC3 bấm thanh đơn (chuột, bàn phím) → mở chi tiết | Không ca UI nào bấm thanh trên rack (các ca mở đơn bằng URL) | Chờ ca UI | ↑ |
| US-019 | AC1 khối OOO tạo từ màn (form Desk/PWA) chặn bán | E2E-UI TC-L6-040 (E), TC-X-072 (H12 không bán căn khóa; bán lại sau khi đóng phiếu). Rack + chặn tạo đơn đạt từ S2 | Đạt | **Đạt (stack tạm)** – lên |
| US-019 | AC2 Tổng quan và đêm khả dụng không tính căn khóa | TT `dashboard-s4-bed` (6/9, khối `planned` không trừ); E2E-UI TC-X-072 (H12) | Đạt | ↑ |
| US-020 | AC2 "Xem bill" đơn `checked_out` (S4-29) | FE-B `s4-feb-desk` (vitest); `Bill.settledAt` cho bản in lại | Chờ ca UI | Đang nghiệm thu |
| US-024 | AC4 nhánh B14 `ROOM_NOT_READY` (S4-33) | Mã có (`stay.service.ts`), TC-L2-068 chưa viết | Chưa | Đang nghiệm thu (Chờ G1) |
| US-024 | AC5 khách tự xin đổi căn – Trực tiếp/CTV | E2E-UI TC-L2-097 (a)(b)(c)(d) (`desk-writes.s4`): xem trước, tick "Đã báo khách", 409 → tính lại; E2E TC-L2-087…091, 098, 099, TC-NT-047/048 qua `previewThenMove()` | Đạt (G1) | ↑ |
| US-024 | AC6 OTTIMO đổi căn – giữ giá | E2E TC-L2-092…094, TC-L2-097 | Đạt (G1) | ↑ |
| US-024 | AC7 đơn OTA – chênh lệch so căn gốc | E2E TC-L2-095, 096, TC-L4-097 (BR-424-04) | Đạt (G1) | ↑ |
| US-136 | AC1 nhắc gọi khách (J6/J7) | TT "US-136 AC1: no-show call from 18:00 – ETA ahead left out"; E2E TC-L2-070; DOM-S4-07 (BR-311-02) | Đạt | Đang nghiệm thu (Chờ G1 – tiền no-show BR-311, B12) |
| US-136 | AC2 việc "Báo no-show trên kênh" (đơn OTA) | TT "US-136 AC2/AC4: OTA no-show → 'Báo no-show trên kênh' (FD+)…"; restore trước khi báo → hệ thống đóng dòng | Đạt | ↑ |
| US-136 | AC4 thông báo MGR | TT `no_show_marked` → OWN + MGR; `no_show_restored` trừ người khôi phục. Dòng trong đóng ca: R3 (US-124) | Đạt | ↑ |
| US-025 | AC3 "đã thu đủ" sau phụ thu/đêm B9a (S4-10) | E2E-UI TC-L3-079 (a)(b) (`stay-money.s4`, `stay.h13-h17`); E2E TC-L3-011 (c), TC-L3-078, 081, 082 (BR-402-01); BUG-R2-038 Closed | Đạt (G1) | Đang nghiệm thu (Chờ G1) |
| US-028 | AC4 việc "Dọn trả phòng" → "Dọn phòng khách đang ở" | TT "S4-31 (US-028 AC4, US-029 AC4): B13 → OD gives the room its stay-over clean…"; E2E TC-L4-004 | Đạt | Đang nghiệm thu (Chờ G1 – giá B13, BUG-R2-160…162) |
| US-029 | AC4 việc dọn ghi "dọn sau <giờ trả>" | TT cùng ca trên (`checkout_clean.notBeforeTime` = giờ trả đã chốt); E2E TC-L4-014. Mã cửa: R3 | Đạt | Đang nghiệm thu (Chờ G1 – phụ thu trả muộn) |
| US-030 | AC2 thẻ chuyển "đã trả lời" | E2E TC-L4-021 (nay chạy phần `getArrivalsDepartures.reminderState = replied`). **Còn:** E2E-UI chip trên H03 | Chờ ca UI | Đang nghiệm thu |
| US-031 | AC1 (phần R2) thẻ "Quá giờ trả phòng" đỏ trên Hôm nay của FD/MGR | Trạng thái theo mốc BR-425 đạt từ S3 (TC-L4-022). TT "S4-31 / US-031: departures…". **Còn:** E2E-UI H03 `desk-clock` trước/sau 12:00, vai FD và MGR | Chờ ca UI | Đang nghiệm thu |
| US-031 | AC1 thông báo chủ động J4 (FD + MGR) | Chưa làm | **Dời R3 – P-S4-15** | ↑ |
| US-031 | AC2 căn có khách đến → thẻ lên đầu | TT "same-day arrival first"; E2E TC-L4-023 (nay chạy phần thứ tự thẻ). Server sắp xếp, Desk giữ thứ tự | Đạt | ↑ |
| US-032 | AC1 sửa số lượng dòng đã ghi (S4-27) | FE-A vitest; API TC-NT-016 | Chờ ca UI | Đang nghiệm thu |
| US-038 | AC2 bút toán điều chỉnh sau `settled` (S4-27) | FE-A vitest; API TC-L4-054 (S3) | Chờ ca UI | Đang nghiệm thu |
| US-038 | AC3 "Ghi công nợ" MGR/OWN (S4-26) | FE-B `s4-feb-desk` (vitest); API TC-L4-055 (S3) | Chờ ca UI | ↑ |
| US-043 | AC3 khớp hồ sơ theo giấy tờ, hồ sơ "từ giấy tờ" (S4-11) | E2E TC-L3-032 (a)(b); TT `guest-document-profiles`; BUG-R2-033 Closed | Đạt | Đang nghiệm thu (Chờ review – SEC G2.4 nhóm D mục A, A.3) |
| US-048 | AC3 CRM chỉ hiện 4 ký tự cuối (S4-32) | TT: `idDocLast4` chỉ ghi khi P05. BUG-R2-063 vẫn Open trong sổ. **Còn:** E2E-UI hồ sơ khách H06 | Chờ ca UI | Đang nghiệm thu |
| US-083 | AC2 tiếng Nga trong hộp báo giá Desk (BUG-R2-080) | FE-A vitest. P-S4-3 đòi ca UI sao chép văn bản RU | Chờ ca UI | Đang nghiệm thu |
| US-084 | AC4 VietQR cọc sau giữ chỗ (S4-28) | E2E-UI TC-L5-025 (a) (`deposit-qr.s4`), TC-X-070 bước 1 (QR 1.600.000, nội dung = mã đơn) | Đạt | **Đạt (stack tạm)** – lên |
| US-085 | AC2 nhắc trước hạn (J2) + "Cần chú ý" | TT "J2 hold.remind (US-085 AC2): reminds the creator once per deadline"; dòng `hold_expiring` có `dueAt` | Đạt | **Đạt (stack tạm)** – lên |
| US-086 | AC4 ảnh biên nhận + lễ tân thấy nội dung báo cọc (S4-30, BUG-R2-081) | FE-B `s4-feb-desk` (vitest); `Reservation.depositNotices[]` (0.3.7 bổ sung 1) | Chờ ca UI | Đang nghiệm thu |
| US-139 | AC3 chặn nhận phòng khi chưa gán căn (S4-33) | Mã có; TC-L2-026 chưa viết | Chưa | Đang nghiệm thu |
| US-119 | AC3 nút "Đảo giao dịch" MGR/OWN (S4-27) | FE-A vitest (xử lý 409/422 `reversePayment` – B-10); API TC-L4-062 (S3) | Chờ ca UI | Đang nghiệm thu |

## 5. Việc để đóng "Chờ ca UI" và "Chưa" (tuần Ổn định – không sang R3)

| # | Ca cần có (E2E-UI bấm thật, hoặc QA chạy tay có ảnh lưu ở `qa/`) | AC đóng được | Vai |
|---|---|---|---|
| U1 | H03 Hôm nay (`desk-clock`), vai FD và MGR, dữ liệu dựng sẵn (6 đơn, 1 OOO, 1 `hold`, 1 phiếu Cao, 1 khai báo chưa gửi, 1 thị thực, 1 khách đi trả lời và 1 khách đi quá giờ có khách đến cùng căn). Kiểm: KPI + chú thích, khách đến/đi + nút, mục "Giữ chỗ chưa cọc", "Cần chú ý" (bấm mở H14, giấy tờ), rỗng, 01:30, thẻ đỏ 12:00/12:31, chip "đã trả lời", đổi dữ liệu → H03 cập nhật | US-010 AC1, AC2; US-011 AC1–AC3; US-012 AC1, AC3, AC4, AC5; US-030 AC2; US-031 AC1 (R2) | QA (FE-B, BE-D). DATA đối chiếu A7 trên cùng bộ dữ liệu (G4.4) |
| U2 | PWA H19 360×800 vai HK: 10 thẻ, không cuộn ngang, lọc "Cần dọn", chip "App khách" của yêu cầu từ guest-web, thứ tự nhóm; HK tick "Đề nghị khóa căn" → Desk "Khóa phòng theo đề nghị" | US-052 AC1, AC2; US-054 AC2; US-057 AC2 | QA (MOB, FE-B) |
| U3 | S11 Desk: khóa trùng đơn tương lai → danh sách đơn + link; drawer phiếu Cao quá hạn ở căn có khách → gợi ý đổi phòng + FOC | US-061 AC2; US-062 AC3 | QA (FE-B) |
| U4 | guest-web H23 390×844 bằng EN và VI: tab Thông tin (giờ, địa chỉ, "Chỉ đường" mở ghim, nội quy), gửi yêu cầu có/không phí, trạng thái đổi khi Desk `done`/`declined` | US-108 AC1; US-109 AC1, AC2; US-112 AC1, AC2 | QA (MOB) |
| U5 | Desk tiền: điều chỉnh dòng, sửa số lượng, đảo giao dịch thu, ghi công nợ (MGR), xem bill đơn đã trả, báo cọc có ảnh và hộp Xác nhận cọc thấy nội dung, báo giá RU | US-006 AC1; US-032 AC1; US-038 AC2, AC3; US-119 AC3; US-020 AC2; US-086 AC4; US-083 AC2 | QA (FE-A, FE-B) |
| U6 | Rack: bấm thanh đơn bằng chuột và bằng bàn phím → drawer; hồ sơ khách H06 hiện 4 ký tự cuối | US-016 AC3; US-048 AC3 | QA (FE-A) |
| C1 | S4-33: TC-L2-068 (B14 `ROOM_NOT_READY`), TC-L2-026 (`RESERVATION_UNASSIGNED`) | US-024 AC4; US-139 AC3 | QA |

- Khi có ca, QA gắn mã TC và chạy trong CI (nhanh nhất là đưa vào bộ chạy hằng đêm T9 – G5.2). PO chấm lại các dòng trên và đổi trạng thái trong backlog, không cần lượt nghiệm thu mới.
- U1 và U4 nên làm trước: chúng đóng nhiều AC nhất. H03 và H23 cũng là hai màn INV sẽ dùng đầu tiên.

## 6. Hàng chờ R3

16 mục, ghi ở `03-backlog/backlog.md` mục **5.5** (R3-Q01…R3-Q16), mỗi mục có ưu tiên, sprint R3 dự kiến, vai và nguồn. Trong đó:
- 11 mục ORC ghi dời ngày 18/10;
- 2 mục QC nêu chưa có dòng quyết định (H24 bản 24.2; T13);
- 3 mục từ P-S4-14, 15, 16.

- **Bổ sung 18/10 (ORC – dời có hạn các Major SEC Sprint 4):** backlog 5.5 thêm R3-Q17 (**Must**, SEC BE-65, BE-74, BE-75, BE-79 – hạn trước khi có dữ liệu thật, cùng cổng ESC-001) và R3-Q18 (Minor/Suggestion SEC BE-66…72, 76…78, MOB-03/04, OPS-04 – hạn trước bản dùng thử cuối R3). Hàng chờ R3 nay 18 mục. BE-73 không dời và đã Verified 18/10 (SEC ký S4-11/S4-32). US-043 vẫn giữ "Đang nghiệm thu" theo P-S4-19 vì BE-74, BE-75, BE-79 (Major, cùng đường mã giấy tờ – hồ sơ) còn mở, dù đã dời có hạn.

## 7. Giả định, rủi ro

- Giả định:
  - kết quả CI #12 đúng như QC đọc log (`qc/s4-gate-readiness.md`);
  - các ca `ui/ops.s4`, `ui-clock/ops.s4`, `foc.s4`, `deposit-qr.s4`, `desk-writes.s4`, `stay-money.s4`, `flow-a1/a4` nằm trong 84 ca UI đã chạy;
  - QC xác nhận lại trên commit chấm.
- Rủi ro:
  - 7 AC "Đạt (G1)" có thể quay về "Chưa" nếu báo cáo kiểm lại lần 6 mở lỗi;
  - thẻ ARC FB-R2-ARC-BE-S4-03 (housekeeping đọc thẳng bảng đơn/khách; định nghĩa "đang ở" lệch `>=`/`>`) có thể làm thẻ H19 sai ngày đi. Hai việc:
    - PO đề nghị sửa phần lệch định nghĩa trong tuần Ổn định, theo đúng đề xuất của ARC;
    - phần chuyển sang cổng đọc của BE-A thì nằm ở R3-Q04.
- Không có ESC mới. ESC-022, 023, 024 vẫn chờ INV và không chặn cổng S4.
