# FE – phản hồi thẻ Round 2 · Sprint 4 (review UXD giữa sprint – `reviews/s4-UXD.md`)

- Ngày: 17/10/2026 | Không commit (ORC ghép).
- FE-B ghi phần FE-B dưới đây; FE-A thêm phần của mình (thẻ FE-S4-01 … 16) vào cùng tệp.

## FE-B

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-UXD-FE-S4-17 | Done | `DepositNoticeDialog`: lỗi mạng/5xx khi tải ảnh biên nhận → Alert `rsv.receipt_upload_failed` (số tiền và ảnh giữ nguyên trong hộp, bấm lại để gửi). 422 `FILE_REJECTED` vẫn hiện câu riêng của mã. Ca `s4-feb-desk` mới: tải ảnh lỗi 500 → hiện câu này, ảnh vẫn trong hộp, không có báo nào được gửi |
| FB-R2-UXD-FE-S4-18 | Done | Bỏ `DECLINE_KEY`; `opsLabels.ts` `declineKey(code)` = `` `guest.req.decline.${code}` `` theo đúng enum 0.3.7 (5 mã). Test khóa VI/EN của bảng nhãn dùng hàm này |
| FB-R2-UXD-FE-S4-19 | Done | `attentionLine` nhận `num` (Intl, tối đa 1 chữ số thập phân theo ngôn ngữ giao diện): VI "4,2%", EN "4.2%" như ô công suất; `useAttentionLines` truyền theo locale. Ca `s4-feb-dashboard` kiểm "4,2" |
| FB-R2-UXD-FE-S4-26 | Done | (18/10, `s4-UXD-brand.md` H/E) Thanh dưới theo vai: `barOrder(roles)` trong `session/nav.ts` – vai đầu tiên theo `ROLE_ORDER` quyết. OWN/MGR **Tổng quan · Cần duyệt · Phòng · Nhật ký tiền · Thêm** ("Hôm nay" vào "Thêm"); FDL, FD, sale giữ thứ tự cũ. Test: bảng `mobileBar` theo vai (OWN, MGR, MGR+FDL, FDL, FD, sale) + đi trên điện thoại (`s4-feb-uxr.test.tsx`) |
| FB-R2-UXD-FE-S4-27 | Done | (18/10) Hết cuộn ngang ở 360 và 390 px. Hôm nay (+28 px): "Cần chú ý" trên điện thoại dùng mẫu H24 – cả dòng là link có mũi tên; `.cols-2` ≤ 860 px thành `minmax(0, 1fr)`; nút yêu cầu khách xuống dưới chữ ở ≤ 520 px. Đơn đặt phòng (+106 px): `Topbar` bọc nút vào `.topbar-acts`, ở ≤ 520 px nút xuống dòng riêng, chip người dùng ở dòng tiêu đề. Đo thêm trên Chromium cùng DOM, CSS và font thật: Tham số (+211 px, `.sr-only` trong `th` thoát khỏi `.table-wrap` → `position: relative`) và Sơ đồ phòng ở 360 px (+12 px, chip dài → xuống dòng) cũng đã sửa. 9 trang trên thanh dưới/"Thêm" đều `scrollWidth = innerWidth` ở 360 và 390 px. Test cấu trúc + CSS trong `s4-feb-uxr.test.tsx` |

**Mục D (trả lời giả định FE-B) – đã áp:**
- FE-B 4 / H24 24.2 so với H02 2.2: UXD đồng ý giữ **H02 2.2 cho R2** (FDL/FD dùng Hôm nay; PO quyết có đưa 24.2 vào R3 không) → menu và route "Tổng quan" **trở lại chỉ OWN/MGR**; `nav.test` khôi phục. Phần biến thể 24.2 đã làm (`overviewVariant`: FDL "Cần duyệt" trừ yêu cầu của mình, FD "Yêu cầu bạn đã gửi") **giữ trong mã, chưa bật**, test bằng cách dựng trực tiếp `OverviewPage`; bật lại chỉ cần thêm vai vào mục `overview` của `session/nav.ts`.
- FE-B 1, 2, 3, 5, 6: không cần sửa mã (UXD đồng ý / đã sửa chữ trong `gen_strings.py`).

**Kiểm (17/10 tối, cây làm việc chung):**
- admin-web vitest 296 ca: **295 đạt**. 1 ca đỏ là `i18n-keys`: khóa `ci.pay_received` mà FE-A dùng ở `CheckInPayment.tsx` nhưng chưa có trong chuỗi – thuộc FE-A.
- `tsc` admin-web 0 lỗi; eslint, prettier xanh.

## FE-A

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-UXD-FE-S4-01 | Done | `inlinePayment()` thay `inlinePayReady`: tiền mặt bắt buộc "Tiền khách đưa"; thiếu → nút khóa, `ci.submit_cash_short` gắn `aria-describedby`, không gọi B9; đủ/dư → thối lại, ghi đúng số cần thu. Chuyển khoản/POS: ô "Số tiền đã nhận" bắt buộc, ghi đúng số nhập, thiếu/dư đều khóa. Bỏ dòng `pay.cash_short` riêng. **Khác đề xuất**: ô trống KHÔNG coi là đưa đủ (ORC: số ghi thu phải là số lễ tân nhập) → câu `ci.submit_pay_amount_needed` (chờ UXD duyệt). Unit 3 ca + E2E-UI **TC-L3-081** |
| FB-R2-UXD-FE-S4-02 | Done | Nhánh 202: `balance_paid` không chặn, chỉ VietQR + `ci.pay_after_lead`, không `ci.effect_pay`, thân B9 không `payment`. Thêm đoạn sau duyệt (0.3.7 bổ sung 1 (a)) để luồng không kẹt: H13 thấy yêu cầu đã duyệt trong ngày → chip `ci.room_approved` (mới, chờ UXD), B9 gửi `approvalRequestId` + `payment`; nút "Tải lại" ở thông báo chờ. Unit 2 ca + E2E-UI **TC-L3-082** (a)(b) |
| FB-R2-UXD-FE-S4-03 | Done | `vnd()` ở dòng, `money()` ở dòng tổng: `MovePreviewBox`, `CheckInPayment`, `FolioDialog` |
| FB-R2-UXD-FE-S4-04 | Done | Thứ tự: cơ sở giá → Alert `MANUAL_RATE_REPRICED` → đêm → tổng; chênh lệch có dấu là dòng `total`; `move.pending_foc` là `tr.sub` ngay dưới |
| FB-R2-UXD-FE-S4-05 | Done | Cột Đêm "T5 22/10"; ô giá mới một số + dòng phụ `move.night_ota_diff` |
| FB-R2-UXD-FE-S4-06 | Done | > 7 đêm: `<details>` + `move.nights_toggle`, mặc định đóng; bảng tổng luôn hiện |
| FB-R2-UXD-FE-S4-07 | Done | `h3.label-h` + `aria-labelledby` (tên vùng không đổi) |
| FB-R2-UXD-FE-S4-08 | Done | Giữ bản cũ, mờ (`.stale`), `aria-busy`, "Đang tính thử…" `role=status` ở đầu hộp; nút Lưu vẫn khóa tới khi bản mới về |
| FB-R2-UXD-FE-S4-09 | Done | `ci.recon_ok` chỉ khi chuyển khoản, sau chip; bỏ `rsv.reconcile_note` ở H13 |
| FB-R2-UXD-FE-S4-10 | Done | Chip `icon="check"` |
| FB-R2-UXD-FE-S4-11 | Done | `card inset stack` |
| FB-R2-UXD-FE-S4-12 | Done | `ci.due_balance` chỉ khi có dòng cộng/trừ |
| FB-R2-UXD-FE-S4-13 | Done | Đang tải `svc.loading` (`role=status`); lỗi Alert có `id`; `confirmHelpId` trỏ vào đó khi chưa có dòng |
| FB-R2-UXD-FE-S4-14 | Done | Tick mà chưa đủ lý do → tóm tắt thay bằng `svc.reason_needed` (`role=status`); ô lý do có `help` ngay khi tick, lỗi đỏ chỉ sau khi bấm |
| FB-R2-UXD-FE-S4-15 | Done | Hậu quả → `cancel.refund_request` → Lý do hủy (+ phạt OTA, phí kênh) → Dịch vụ → tóm tắt |
| FB-R2-UXD-FE-S4-16 | Done | Lưới 3 cột `.svc-line` (app.css); `aria-label` của ô tick = `svc.keep` (giữ tên cho test, trình đọc màn hình) |

**Mục D (FE-A):** FE-A 1 đã theo (thẻ FE-S4-02). Gợi ý FE-A 4 (dùng ngày nghiệp vụ cho gợi ý "Đã thực hiện") chưa làm: chỉ là gợi ý, không có thẻ. Sẽ làm khi `getBusinessDate` có sẵn ở Desk.

**Kiểm (17/10 tối):** admin-web vitest 307/307; `tsc`, eslint, prettier xanh; i18n 19/19; `check_hifi` xanh. Ca `i18n-keys` đỏ mà FE-B báo (khóa `ci.pay_received`) đã xanh sau khi FE-A thêm chuỗi và sinh lại.

**DOM-S4-06 (phần FE-A, BR-429 (d1) v0.3.8):** Done. Mọi B7/B8 có `folioDeltaVnd ≠ 0` bắt buộc tick "Đã báo khách số tiền mới" và gửi `applyDifference` + `expectedDeltaVnd`. Khách tự xin đổi căn bắt buộc tick kể cả khi chênh 0, trừ đơn hợp đồng giấy. Unit + E2E **TC-L2-103** (a) đạt; (b) phía server để `knownBug('DOM-S4-06')`, chờ BE-A.
