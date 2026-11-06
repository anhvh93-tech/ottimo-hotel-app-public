# Báo cáo UXD – Round 5, Sản xuất, Gói 2 "Chữ và tham số theo bảng giá 01/11"

- Ngày: 06/11/2026 · Vai: UXD · Bước: Sản xuất. ORC lưu tệp này từ báo cáo bàn giao của UXD (subagent không ghi tệp báo cáo).
- Việc theo `rounds/round-05/plan.md`: V5-20, V5-21 (phần chữ), V5-22 (phần chữ), V5-23, V5-24.
- Đầu ra chính: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` (commit `6b3700c6`). Mỗi dòng gồm khóa thật trong mã, chữ cũ, chữ mới VI/EN (thêm RU ở chuỗi khách), lý do, nguồn. Kèm yêu cầu cho FE, BE và danh sách CPY duyệt.
- Không sửa mã. FE áp bảng vào `product/design/tools/gen_strings.py` sau review.

## 1. Đã làm gì
1. Rà mã `main` @ `b9f017f7`.
   - Mỗi khóa trong phạm vi: kiểm chỗ dùng thật (tệp, dòng, điều kiện hiện) và biến được truyền.
   - Kiểm các nhánh lỗi phía máy chủ để câu nói đúng điều máy chủ làm: `parameter-rules.ts`, `parameter.service.ts`, `reservations.service.ts`, `line-labels.ts`, `stay.service.ts`, `pricing.service.ts`.
2. V5-20, 22 khóa:
   - bỏ số 28, số 7, "+15 %" và chữ "trước giảm theo số đêm";
   - ngưỡng đọc từ tham số (`{n}`, `{time}`); không đọc được thì dùng câu không có số;
   - báo giá gom đêm theo số tiền (`sale.nights_at_rate_*`);
   - việc FE về số người (ARC-PR82-02).
3. V5-21, 39 khóa:
   - 29 tên `params.k.*` lấy từ từ điển: B1–B11, `rounding.*`, `early_checkin_tiers`, các khóa giá còn lại;
   - đơn vị "đêm";
   - 6 nhánh câu `PARAM_OUT_OF_RANGE`, đúng 6 dạng `extras` máy chủ trả;
   - 3 câu lỗi nhập: số, JSON, giờ;
   - câu `ota_base_rate` 2 vế.
4. V5-22, 8 khóa: chép chữ từ các thẻ PR70-03/04/06, bỏ `{group}`, thêm câu dự phòng.
5. V5-23, 67 khóa:
   - đủ mục của plan, trong đó 25 khóa EN thêm U+2011;
   - đã sửa sẵn trong mã, QA chỉ cần đóng: BUG-R2-100, BUG-R3-028 (g);
   - đã xong trên `main`: GN content-guide 1335 và phần lớn EM-13 (chỉ còn thêm `users.email_purpose`);
   - 3 khóa phát hiện thêm, PO quyết: `fo.rack.empty_body` (viết cứng "10 căn"), `desk_code.channel_off`, `error.DELIVERY_CHANNEL_DISABLED`.
6. V5-24, 7 khóa RU: "апартаменты" đổi thành "номер". 0/7 chuỗi thuộc bản thông báo dữ liệu. Kèm yêu cầu font theo BUG-R4-017.
7. Tổng 143 khóa: 63 sửa, 71 mới, 9 xóa.

| Việc | Sửa | Mới | Xóa | Cộng |
|---|---|---|---|---|
| V5-20 | 12 | 5 | 5 | 22 |
| V5-21 | 1 | 38 | 0 | 39 |
| V5-22 | 2 | 6 | 0 | 8 |
| V5-23 | 41 | 22 | 4 | 67 |
| V5-24 | 7 | 0 | 0 | 7 |

**Cần CPY duyệt** (mục 7 tệp chữ):
- C1: 7 chuỗi RU "номер".
- C2: `gw.lang_auto` EN/VI/RU.
- C3: 3 dòng phiếu phí trả sớm.
- C4: `bill.line.late_fee_as_night`.
- C5: dấu "!" ở `msg.hot_water_issue`.
- C6 (để sau v1.0.5): chữ "phụ thu" trên dòng phiếu hiện có.

**Yêu cầu cho FE và BE** (bảng đủ ở mục 6 tệp chữ):
- FE-A:
  - áp bảng vào `gen_strings.py`;
  - `RULE_DEFAULTS` 30/30;
  - `n` cho `LONG_STAY_REQUIRES_CONTRACT`;
  - báo giá gom đêm;
  - đổi số người thì tính lại tổng ("–" và `aria-busy` khi chờ);
  - `KNOWN` 29 khóa + `nights`;
  - `problemView` 6 nhánh;
  - `StepUpDialog` thêm `purpose`;
  - phí trả sớm có biến thể;
  - `money()` cho `DEPOSIT_INSUFFICIENT`;
  - `DepositQr` thêm `onFail`;
  - `expiresAt − 1 phút`;
  - sửa test so chữ cũ.
- FE-B:
  - `gw.lang_auto`;
  - 3 chuỗi RU trên trang khách;
  - kiểm từ cấm RU;
  - bỏ `test.fail` ở `TC-L7-053`.
- Font (FE-A, MOB, FE-B; SEC duyệt):
  - giữ JetBrains Mono đủ Kirin;
  - `assetsInlineLimit` trả `false` cho `.woff`/`.woff2`;
  - `check:dist` không còn `data:font`;
  - không nới CSP `font-src`.
- BE-A: `min`/`max` trong lỗi `RATE_OUT_OF_RANGE`.
- BE-B: `line-labels.ts` dùng `bill.line.late_fee_as_night`.
- BE: chạy lại `gen-quote-copy.mjs`.

## 2. File tạo/sửa
- `rounds/round-05/outputs/UXD/copy-v1.0.5.md`: mới.
- `rounds/round-05/outputs/UXD/report.md`: mới, ORC lưu.
- Không sửa `gen_strings.py`, JSON, content-guide hay mã. Không add các PNG chưa track.

## 3. Giả định
- G1: số dòng tính tại `b9f017f7`.
- G2: ARC 0.3.13 thêm `min`/`max` vào `RATE_OUT_OF_RANGE`; nếu không, dùng `booking.error.rate_out_of_range_dates`.
- G3: xem số tài khoản dùng chung `c3_stepup_minutes`.
- G4: "номер" đã duyệt cho landing RU (lp-v2-copy 16.2).
- G5: 4 mẫu `msg.*` chưa có mã nào gọi.
- G6: câu phí phạt chỉ cho `penalty`. DOM xác nhận ca `damage`.
- G7: tham số giữ nhóm "Khác".
- ESC mới: không có.

## 4. Rủi ro / vướng mắc
- R1: `msg.checkout_reminder` viết cứng "(trước 12:00)". Chuỗi khách có "14:00" giữ nguyên (cam kết FB-INV-004). Lượt sau dùng `{checkout_time}`, CPY duyệt.
- R2: chữ phụ thuộc giá trị tham số: `rooms.night_auto` theo `prices_include_vat`; `params.extra_child` ("6–11 tuổi") theo `child_free_under_age`, `adult_from_age`.
- R3: cặp giờ không cho bằng nhau thì nhập đúng mốc cũ cũng bị từ chối. Câu báo vẫn chỉ đúng hướng sửa.
- R4: cột Giá trị vẫn hiện `true`/`false` và JSON thô. Đề xuất cho PO, ngoài v1.0.5.
- R5: validator `weekend_nights` (`parameter-rules.ts:180–187`) nhận số 1–7, trong khi giá trị đang chạy và bộ tính giá dùng `["FRI","SAT"]`.
  - Lưu đúng mức từ điển đề xuất thì lỗi 422.
  - Lưu dạng số thì bộ tính giá không nhận ra đêm cuối tuần.
  - Hiện chưa sai tiền vì mức tăng cuối tuần là 0. Chuyển BE, QA.
- R6: sổ tay (V5-71) trích chữ cũ, phải đổi cùng bản Desk.
- R7: test so chữ cũ phải sửa cùng PR.

## 5. Việc chưa xong
- CPY duyệt C1–C5. FE chờ CPY với các khóa này; khóa Desk nội bộ áp ngay sau review.
- DOM xác nhận ca `damage`, và `hold_expiry_reminder_hours = 0` có nghĩa là không nhắc.
- PO quyết 3 khóa mục 4.19.
- Sau khi FE áp, UXD làm tiếp:
  - review PR;
  - đồng bộ content-guide mục 8 (v0.4.7);
  - xóa `fo.tabs.holds`;
  - sửa ô `bk.src_weekend` trong hi-fi;
  - kiểm 362 px, 1440 px và trang khách RU.
- DOM cập nhật tên tham số trong từ điển.

## 6. Cập nhật 06/11 tối – Phản hồi & sửa (commit `9f5c74a2`)
- UXD trả lời 11 thẻ CPY ngay trong `rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md` (mục 8): 10 Fixed. Thẻ 04 Open, chờ DOM. Thẻ 02 tách ba phần: (a) và (b) Fixed, (c) Deferred sang v1.0.6 (R5-B-03).
- `copy-v1.0.5.md` bản 1.1 có 150 khóa: 69 sửa, 72 mới, 9 xóa. Chia theo việc: V5-20 22, V5-21 39, V5-22 8, V5-23 73, V5-24 8. Mục mới: 4.20 (chữ "căn"), 4.21 (dấu "!"), 5.3 (5 bước kiểm tự động cho FE-B).
- Ưu tiên theo PO, quyết định 15:
  - Bắt buộc: V5-20…V5-24 bản gốc, 4.20 (a), 5.1 RU (thẻ 01).
  - Nên có, làm cùng lượt C5: 4.20 (b), 4.21, thẻ 06 và 08. Không kịp thì chuyển US-125 hoặc B-SAU, theo quy tắc dự phòng ở 5.1.
  - Làm sau: 5.3 (FE-B), khi xong 4.20 (a) và (b).
  - Chờ DOM: thẻ 04. Khóa dự phòng `bill.line.late_fee_after_limit` đã soạn ở 4.8 nhưng chưa tính vào 150.
  - Để v1.0.6: 4.20 (c), C6, xóa `gw.room`.
- Việc cho vai khác (mục 6):
  - FE-B: `gw.lang_auto_sr`, `gw.req.clean_*`, test 5.3.
  - BE: chạy lại `gen-quote-copy.mjs` (RU dòng 2 và 4, VI dòng 2).
  - BE-B: một dòng, chờ DOM.
- Còn chờ: DOM (thẻ 04, ca `damage`, `hold_expiry_reminder_hours = 0`). PO đã chốt 3 khóa mục 4.19: vào V5-23.

## 7. Cập nhật 06/11 tối – bản in, thẻ CPY 12, V5-04
- **Bản in** (`bb67605d`):
  - Tờ 1: A4 một mặt, 2 cột, **8,25 pt**. Ở 9 pt bị tràn; bớt khoảng cách cũng chỉ lên được 8,5 pt.
  - Tờ 2a: chuyển sang **A4 dọc, in riêng, 11 pt** (`to-2a-giu-cho-qua-han-a4.pdf`). Ở A5 thì chỉ vừa 8 pt.
  - Tờ 2b: không đổi chữ; tách thành `to-2b-a4-2-ban.pdf` (2 bản trên một tờ A4, cắt đôi).
  - Đã xóa `to-2a-2b-a4-cat-doi.*` để không ai in nhầm bản 30/10.
  - Nét kẻ bảng và chân tờ đổi sang Stone Grey.
- **Thẻ CPY 12** (Major) Fixed ở `copy-v1.0.5.md` bản 1.3 (`5525baab`): sale, CTV tự bấm "Gia hạn giữ chỗ (1 lần)". Vẫn 146 khóa.
- **V5-04** (`a099cb9e`): sổ tay 1.15, bộ hướng dẫn 1.13 (`01` 1.12, `02` 1.13, `05` 1.8). Đã dựng lại HTML từ `main`; bộ kiểm 390/1440 px, font khi mất mạng, ảnh chỉ từ `img/` đều ĐẠT. HTML nằm ngoài repo theo `.gitignore`.
- **Việc chuyển PO** (ORC đã giao): sửa mục "Cách in và dán" và ghi chú khổ giấy trong `staff-one-pager.md`; giữ Tờ 1 ở 8,25 pt; tùy chọn bọc "OTM-…" bằng backtick.
- **ORC ghi thêm:** khi xem bản in, ORC thấy Tờ 2a dòng 86 hướng dẫn "Tiền về trước hạn → Xác nhận đã nhận cọc" cho giữ chỗ quá hạn chưa nhận đồng nào. Desk không cho việc này (QA BUG-R5-002, `allowed-actions.ts` 72–74). Tờ 2a chưa in tới khi DOM viết chữ thay và PO sửa. Sau đó UXD dựng lại Tờ 2a. BA đang thêm lời dặn về hai tham số vào sổ tay, nên UXD dựng lại HTML sau khi BA xong.
