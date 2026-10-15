# Phản hồi của DOM – Round 1, Bước 4

- Tác giả: DOM | Ngày: 15/10/2026
- Phạm vi: mọi thẻ gửi DOM: `reviews/BA-on-DOM.md` (17 thẻ), `reviews/PO-on-DOM.md` (9 thẻ), và 21 lỗi tự nhận ở `reviews/DOM-on-PO.md` mục B (B.1–B.21). Tổng **47 thẻ**.
- Sản phẩm đã sửa: `product/docs/business-rules.md` **v0.2** (lịch sử thay đổi ở mục 18), `product/docs/baseline-issues-triage.md` **v0.2** (mục 5).
- Nguyên tắc: mã BR cũ giữ nguyên, không đánh số lại; quy tắc mới dùng số mới.

## Tổng hợp trạng thái

| Trạng thái | Số thẻ | Ghi chú |
|---|--:|---|
| Done | 47 | Gồm 13 Major (BA-DOM-01…09, PO-DOM-01…04), 11 Minor, 2 Suggestion và 21 mục B tự nhận |
| Rejected | 0 | Một phần đề xuất của BA-DOM-01 (lấy `earlier_of` làm mặc định) không theo – lý do ghi ở dòng thẻ; phần mâu thuẫn đã sửa xong nên thẻ là Done |
| Escalated | 0 | Không tạo ESC mới. Các câu cần INV quyết được **đề xuất bổ sung vào ESC đang có** (mục "Đề xuất bổ sung ESC" bên dưới) – PO gom |
| Deferred | 0 | – |
| **Blocker/Major còn Open** | **0** | |

---

## 1. Thẻ của BA (`reviews/BA-on-DOM.md`)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-BA-DOM-01 (Major) | Done | BR-603 viết lại: hạn = **giờ đến thực tế + 12 giờ**, không áp mốc 23:00 cho khách NN (khách VN giữ 23:00, BR-602). Định nghĩa "giờ đến" = thời điểm nhận phòng thực tế trong app (check-in online: lúc khách xác nhận đã đến hoặc lần mở cửa đầu, lấy mốc sớm hơn); không dùng ngày đến của đơn, không dùng ngày nghiệp vụ. Ví dụ: 08:00 → 20:00; 21:30 → 09:30 hôm sau; 23:40 → 11:40 hôm sau; 01:30 → 13:30. S3, S8 sửa; thêm khóa `registration_reminder_before_minutes` = 120 và `registration_deadline_foreigner_mode`. **Không theo** đề xuất "mặc định `earlier_of`". Lý do: quy định 12 giờ (theo hiểu biết DOM về Luật 47/2014 Điều 33) không có mốc 23:00 cho người nước ngoài. Ghép mốc 23:00 vào sẽ tạo hạn giả: lúc 21:30 người trực đêm phải khai trong 90 phút, ca đêm bị dồn việc mà không có căn cứ luật. Quyết định đã ghi decision-log (dòng "THAY dòng DOM trước về BR-603"). Vẫn giữ lựa chọn `earlier_of` để bật nếu luật sư yêu cầu (ESC-001). BA có quyền phản biện 1 lần |
| FB-R1-BA-DOM-02 (Major) | Done | Ví dụ BR-432 viết lại: người gửi **không** chọn người duyệt, hệ thống định tuyến tới mọi tài khoản có quyền duyệt, người duyệt xác nhận bằng PIN của mình. Trả lời SQ-3 trong BR-432: "không ai duyệt yêu cầu của chính mình, trừ khi giá trị nằm trong hạn mức tự áp của vai mình". BR-436 mới (lễ tân tự miễn FOC minibar ≤ 100.000/lần và ≤ 500.000/người/tháng). BR-433 và BR-704 sửa khớp. BA cập nhật SM-10 A2 và rbac ghi chú 24 theo BR-436 |
| FB-R1-BA-DOM-03 (Major) | Done | BR-804: khối OOO nửa mở **[ngày bắt đầu, ngày mở bán lại)** như BR-002. Mở bán lại = ngày xong + `ooo_reopen_buffer_days` (1). Ví dụ: dự kiến xong 17/10 → lưu [15/10, 18/10) = 3 đêm → 307 đêm khả dụng (BR-904 giữ đúng số). BL 4.4 đọc là [15/10, 17/10) = 2 đêm, không trùng OTM-0154. Đề nghị ARC đổi `endDatePlanned` → `reopenDatePlanned` (ARC quyết) |
| FB-R1-BA-DOM-04 (Major) | Done | BR-803 thêm "trừ ngoại lệ BR-402 (1)" (lễ tân trưởng+, có lý do, căn → OD, dọn ưu tiên). BR-402 (1) ghi rõ ngoại lệ **không** áp cho đổi phòng khách đang ở (đồng ý với BA), và buồng OOO thì không bao giờ. BR-424 thêm "căn mới phải VI/VC". Đổi căn cho đơn tương lai chỉ kiểm trùng và OOO. QA chỉnh TC-L2-068 (chặn đổi phòng sang VD là **đúng**) |
| FB-R1-BA-DOM-05 (Major) | Done | BR-427 tách 5 ý: (a) nút trả phòng chỉ bật khi còn phải thu = 0; (b) hệ quả: `checked_out`, folio `settled`, cấp số bill; (c) phát sinh sau trả phòng ghi thành dòng riêng trên folio `settled`, FD+ ghi trong `post_checkout_charge_hours` = 24, có ảnh; (d) quá hạn chưa thu → tự chuyển công nợ BR-525, báo quản lý; (e) hóa đơn điện tử xuất khi folio `closed`. Có ví dụ số |
| FB-R1-BA-DOM-06 (Major) | Done | BR-609: (a) không đồng ý → xóa ảnh **ngay khi khai báo `confirmed`**, `id_image_purge_max_hours` = 24 là hạn trên cho job dự phòng (theo decision-log SEC); (b) đơn hủy/no-show trước khi khai (`void`) → xóa ngay khi `void`; (c) rút đồng ý → như (a). Khóa đã thêm mục 13 |
| FB-R1-BA-DOM-07 (Major) | Done | BR-011 mới: số ngày báo trước = ngày mốc − ngày nghiệp vụ lúc báo (ngày lịch). Ngày mốc: hủy → ngày đến; trả sớm → ngày rời đi mới; chấm dứt HĐ → ngày trả phòng khách báo; hủy HĐ trước vào ở → ngày vào ở. BR-428 đổi "≥ 24 giờ" thành "≥ 1 ngày". BR-309, 313, 314, 428 có ví dụ đúng biên (đến 22/10: báo 15/10 → 100%; 16/10 → 50%; 19/10 → 50%; 20/10 → 0) |
| FB-R1-BA-DOM-08 (Major) | Done | Mục 13 thêm đủ các khóa BA liệt kê: `post_checkout_charge_hours`, `registration_digest_times`, `extension_payment_deadline`, `hk_self_inspection_enabled`, `room_status_reconcile_time`, `maintenance_due_warning_days`, `expiry_warning_days`, `long_stay_cleaning_window`, `meter_anomaly_default_kwh/m3`, `reschedule_max_times`, `reschedule_window_months`, `cancel_peak_no_refund`, `lost_found_notify_hours`, `long_stay_checkout_inspection_deadline`, `registration_reminder_before_minutes`, `minor_data_age_threshold`, và `late_grace_requires_no_same_day_arrival`. Mục 0.2 thêm nguyên tắc 4 ("không có khóa thì không dùng trong code") và nguyên tắc 5 (biên khoảng thời gian [A, B), "đủ N là quá"). Tên khóa: nếu ARC (erd 9.3) đã đặt tên khác thì dùng tên ARC |
| FB-R1-BA-DOM-09 (Major) | Done | BR-010 mới: ngày nghiệp vụ đổi 06:00, áp cho "hôm nay", B9, phạm vi T, KPI "đêm nay", không áp cho hạn pháp lý. SQ-1 → BR-315 (khôi phục no-show; FD tự làm khi đủ 3 điều kiện, còn lại MGR+). SQ-2 → BR-809 (Cao không dừng; TB/Thấp dừng khi `waiting_parts` có ngày dự kiến). SQ-4 → BR-212/903 (gộp theo tháng lịch, `payable` ngày 1, chi trước ngày 10). Ngưỡng tuổi → BR-612 `minor_data_age_threshold` (dưới 16, chờ ESC-001). QA thống nhất TC-L8-010 theo BR-010 (cắt ngày 06:00) |
| FB-R1-BA-DOM-10 (Minor) | Done | BR-607 đủ 10 tên theo SM-05, có `void`; luồng chuyển chi tiết trỏ SM-05 K1–K11 |
| FB-R1-BA-DOM-11 (Minor) | Done | BR-007 ghi phạm vi và chu kỳ từng loại mã. Đơn, báo giá, phiếu sửa, phiếu thu: liên tục theo cơ sở. Bill `F26-000123`: liên tục theo cơ sở trong năm, đặt lại 1/1. Khách: theo tổ chức. Yêu cầu số bill riêng của MISA (nếu có) do INT/kế toán xác nhận ở R3 |
| FB-R1-BA-DOM-12 (Minor) | Done | BR-110: sức chứa là thuộc tính từng căn (`room.<no>.max_occupancy`), giá trị nhóm chỉ là mặc định khi tạo căn |
| FB-R1-BA-DOM-13 (Minor) | Done | BR-805: "VI quá 3 ngày → VC; tính từ lúc kiểm đạt; đủ 72 giờ là quá" (khớp QA TC-L6-029). BR-811: giờ trực [07:00, 22:00), 22:00 là ngoài giờ (khớp TC-L7-035) |
| FB-R1-BA-DOM-14 (Minor) | Done | BR-303: gia hạn giữ chỗ không vượt trần 12:00 ngày đến, có ví dụ. BR-411/412 và khóa `early_checkin_tiers`/`late_checkout_tiers`: bỏ bậc 100%. Trước 06:00 → BR-417 (đêm bán); sau 18:00 → gia hạn (BR-416/421). Cả hai không ghi phụ thu |
| FB-R1-BA-DOM-15 (Minor) | Done | BR-107: giảm áp trên giá đêm đã làm tròn 792.000 → 712.800 → 713.000 (kết quả 4.991.000 không đổi); thêm câu về cơ sở tính |
| FB-R1-BA-DOM-16 (Minor) | Done | Triage v0.2: cột Round theo backlog đợt 3 (#6 R3, #14 R3, #16 R3, #21 R3, #20 R3, #17 R3, X-08 R3…), thêm câu "backlog là chuẩn khi lệch" |
| FB-R1-BA-DOM-17 (Suggestion) | Done | Triage v0.2 thêm cột "Story" (US-xxx) cho cả 30 lỗi, lấy từ cột Nguồn của backlog |

## 2. Thẻ của PO (`reviews/PO-on-DOM.md`)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-PO-DOM-01 (Major) | Done | Như BA-DOM-03: OOO nửa mở [15/10, 18/10) = 3 đêm → 307 (giữ số của DATA K-01/K-03 và BR-904). Ngày mở bán lại = ngày xong + 1. Cần báo DATA, ARC (`reopenDatePlanned`), QA (DS-0): BL 4.4 = [15/10, 17/10) |
| FB-R1-PO-DOM-02 (Major) | Done | Như BA-DOM-01 (cả 3 ca khách đến sau nửa đêm/sau 23:00 đã có ví dụ). Chế độ mặc định là `hours_only`, không phải `earlier_of` (lý do ở BA-DOM-01). Đề nghị PO đưa **đúng hai chế độ** vào ESC-001 với mặc định `hours_only` |
| FB-R1-PO-DOM-03 (Major) | Done | BR-415: cơ sở phụ thu sớm/muộn của đơn OTA = **giá kênh Trực tiếp hiện hành** của đêm đó, cùng nguồn với BR-421. Ví dụ Ji-woo: 30% × 792.000 = 237.600 → **238.000**, khớp cách tính của wireframe L3 sau khi làm tròn (UXD cập nhật số 237.600 → 238.000 nếu có). Nhãn [GIẢ ĐỊNH]; khóa `ota_surcharge_base`. Đề nghị PO thêm vào ESC-007 |
| FB-R1-PO-DOM-04 (Major) | Done | BR-613 mới: hệ quả khi kiểm giấy tờ NN "Không đạt". (a) Thị thực hết trước ngày đi → không chặn, khai đến hết hạn. (b) Hộ chiếu hết trong kỳ ở → không chặn, cảnh báo. (c) Hộ chiếu/thị thực đã hết tại ngày nhận, hoặc thiếu dấu nhập cảnh → chặn giao mã cửa, lễ tân trưởng+ mới nhận tiếp, có lý do. Nhãn PHÁP LÝ. Khớp K5, SEC R-REG-03, L3 3.2 cho (a)(b); (c) chặt hơn – BA/UXD cập nhật K5 và L3. Đề nghị PO thêm vào ESC-001 |
| FB-R1-PO-DOM-05 (Minor) | Done | BR-607 thêm `void` (như BA-DOM-10) |
| FB-R1-PO-DOM-06 (Minor) | Done | BR-609 thống nhất với SEC (như BA-DOM-06). ARC chỉnh J16 thành job dự phòng, QA chỉnh TC-L3-070…072: kỳ vọng xóa ngay khi `confirmed`, hạn trên 24 giờ |
| FB-R1-PO-DOM-07 (Minor) | Done | Triage: #14 → R3 (US-078). #16 → R3 (US-074). #15 → "R2 chặn trùng SĐT/email (US-072); R3 so khớp gần đúng tên (US-079)" |
| FB-R1-PO-DOM-08 (Minor) | Done | BR-805 (như BA-DOM-13) |
| FB-R1-PO-DOM-09 (Suggestion) | Done | BR-215: "÷ số đêm của tháng hợp đồng", bỏ "tháng lịch", trỏ `metrics-definitions.md` Q-10, ví dụ HĐ bắt đầu 15/10 (đã nhận thêm yêu cầu của DATA qua ORC ở bước 4 – cùng nội dung) |

## 3. Lỗi tự nhận (`reviews/DOM-on-PO.md` mục B)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| B.1 – BR-603 mâu thuẫn ví dụ; S3, S8 | Done | BR-603, S3, S8 sửa. Dòng decision-log cũ đã được ORC thay. Mục 17 của BR đánh dấu dòng cũ "đã thay" |
| B.2 – BR-007 bill `F-yymmdd` | Done | `F26-000123` |
| B.3 – BR-110 sức chứa | Done | Theo căn |
| B.4 – BR-804 khoảng OOO | Done | Nửa mở + `ooo_reopen_buffer_days` |
| B.5 – BR-607 thiếu `void` | Done | – |
| B.6 – BR-411 bậc trước 06:00 | Done | BR-417 mới: kiểm căn trống đêm trước. Đơn trực tiếp thêm đêm; đơn OTA tạo đơn con Trực tiếp vào thẳng `in_house`. Là đêm bán. Ví dụ căn 302, 917.000 |
| B.7 – BR-215 tháng lịch | Done | Tháng hợp đồng + ví dụ giữa tháng (6.103.548 cho 17 đêm tháng 10) |
| B.8 – BR-432 ví dụ chọn người duyệt | Done | Định tuyến tự động, form không có ô chọn người duyệt |
| B.9 – BR-433 thiếu hạn mức tháng của lễ tân | Done | BR-436: 500.000/người/tháng [GIẢ ĐỊNH, ESC-007]; khóa `foc_self_apply.front_desk.*` |
| B.10 – BR-403 mã sinh nhật 2 số | Done | ddmm + ≥ 3 số; 2 số chỉ khi khóa có giới hạn thử sai; mặc định ≥ 6 số ngẫu nhiên |
| B.11 – Ngày nghiệp vụ | Done | BR-010; BR-404, 311 tham chiếu |
| B.12 – Khôi phục no-show | Done | BR-315 |
| B.13 – BR-809 hạn khi chờ vật tư | Done | Theo SQ-2 |
| B.14 – Lịch chi hoa hồng | Done | BR-212, BR-903 |
| B.15 – BR-312 + tự gán căn OTA | Done | BR-312 viết lại đủ 7 điểm; BR-316 (tự gán, chỉ trong nhóm, thứ tự nhóm theo cấu hình); BR-317 (thời hạn 60 phút, đồng bộ lỗi > 15 phút → đóng bán thủ công, ghi nhận xung đột) |
| B.16 – Đoàn, đóng ca, mất mạng, min stay | Done | BR-321…326 (đơn nhóm); BR-526 (đóng ca), BR-527 (chuyển khoản chờ đối soát, không nhận tiền mã hóa, khách không cọc online được); BR-961…964 (mất mạng/mất điện); S7 mở rộng, thêm S11, S12; BR-113 (ở tối thiểu, mặc định tắt) |
| B.17 – BR-609 thời điểm xóa | Done | Như BA-DOM-06 |
| B.18 – Khóa tham số thiếu (ARC M2) | Done | Như BA-DOM-08. Gồm BR-427 (`post_checkout_charge_hours`), BR-611 (`registration_digest_times`), S8 (`registration_reminder_before_minutes`), HK tự kiểm (`hk_self_inspection_enabled`), ngưỡng tuổi trẻ em (`minor_data_age_threshold`); thêm `s2_shift_end_buffer_minutes` = 60 theo DATA |
| B.19 – Nhắc gia hạn thị thực | Done | Dài hạn 30 ngày, ngắn ngày 14 ngày (`visa_expiry_warning_days.long_stay/.short_stay`); ví dụ Emma nhắc từ 21/10 |
| B.20 – VAT, loại hình kinh doanh | Done | BR-523: `vat_rate` có ngày hiệu lực. BR-524: `business_entity_type`, phát hành theo sự kiện nghiệp vụ (`invoice_trigger`), không theo từng lần thu (khớp DOM-INT-02) |
| B.21 – Số hoa hồng trong ví dụ | Done | BR-208: 5.342.400 (đợt 1 = đợt 2 = 2.671.200; NV chốt 4.006.800) |

## 4. Yêu cầu của DATA chuyển qua ORC trong bước 4 (không phải thẻ – ghi để truy vết)
| Yêu cầu | Xử lý |
|---|---|
| BR-215 "÷ số đêm của tháng hợp đồng" | Done (như PO-DOM-09) |
| Thêm `s2_shift_end_buffer_minutes` = 60 | Done – mục 13, gắn BR-603 (mục tiêu nội bộ, không phải hạn luật) |
| `cancel_reason_code` có `guest_cancelled` | Done – BR-308 thêm danh mục mã: `guest_cancelled`, `guest_changed_mind`, `found_other`, `price`, `date_change`, `unreachable`, `hold_expired`, `ota_cancelled`, `overbooking_relocated`, `group_partial`, `other` |

## 5. Việc kéo theo cho vai khác (DOM không sửa file của họ)
- **BA**: SM-10 A2 + rbac ghi chú 24 theo BR-436. SM-01 B12 theo BR-315 (FD/FDL có điều kiện). Chuyển "Thêm đêm trước" theo BR-417 thay E9/A3. K5 theo BR-613 (c). Quy trình P11 (đóng ca, BR-526/527), P12 (mất mạng, BR-961…964), UC đơn nhóm (BR-321…326).
- **ARC**: `reopenDatePlanned`; đối chiếu tên khóa mục 13 với erd 9.3; bảng `booking_group`; cờ `reconciled_at/by` trên giao dịch; dòng "phát sinh sau trả phòng" trên folio `settled`; J16 thành job dự phòng.
- **QA**: TC-L3-046 (BR-603 `hours_only`), TC-L2-032 + DS-0 (OOO nửa mở), TC-L2-068 (đổi phòng sang VD bị chặn là đúng), TC-L8-010 (cắt ngày 06:00), TC-NT-022 (`F26-000123`), TC-NT-032 (lên mức Cao, có oracle BR-436), TC-L3-070…072 (xóa ảnh), TC-L2-053/TC-L4-025 (biên BR-011), `br-examples.json` theo ví dụ v0.2.
- **PO**: US-007 AC4/AC6 theo BR-436; US-026 AC3 theo BR-417; story đơn nhóm và đóng ca (US-124 Must R3) tham chiếu BR mới; US-042 AC1 bỏ "(sớm hơn mốc BR-602)".
- **DATA**: K-01/K-03 giữ 307; đơn con trước 06:00 là đêm bán; bản ghi xung đột BR-317.
- **UXD**: L3 phụ thu Ji-woo làm tròn 238.000; form OOO hiện "dự kiến xong" + "mở bán từ"; màn đóng ca.

## 6. Đề xuất bổ sung ESC (PO đang gom – DOM KHÔNG sửa `02-escalations/`)
| ESC | Đề xuất thêm | BR |
|---|---|---|
| ESC-001 (pháp lý) | (1) Hạn khai báo khách NN: hai chế độ – `hours_only` (giờ đến + 12 giờ, **đội đề xuất**) / `earlier_of` (sớm hơn giữa +12 giờ và 23:00); luật sư chọn. (2) Hệ quả giấy tờ NN không đạt (BR-613 a/b/c), đội đề xuất như BR-613. (3) Xác nhận không nhận tiền mã hóa | BR-603, 613, 527 |
| ESC-004 (giá) | (1) Ở tối thiểu 2 đêm cho đến thứ Sáu, thứ Bảy, ngày lễ (mặc định tắt cho đến khi INV chọn). (2) Các mùa/sự kiện Đà Lạt muốn tăng giá (hè 6–8, Festival Hoa, mùa hoa) – lưu ý điều khoản bằng giá với OTA | BR-113, 104 |
| ESC-005 (dài hạn) | Lịch chi hoa hồng: gộp theo tháng, chi trước ngày 10 tháng sau | BR-212, 903 |
| ESC-006 (hủy, cọc) | (1) Bất khả kháng (đèo sạt lở, sân bay hủy chuyến) → dời ngày miễn phí trong 3 tháng, không hoàn tiền mặt. (2) Khách không cọc online được → giữ chỗ ngắn + thu đủ khi đến, quản lý duyệt. (3) Đơn đoàn: cọc chung 30%, hủy từng căn theo BR-309 trên cọc phân bổ, hạn danh sách khách 3 ngày trước ngày đến. (4) Đưa ví dụ biên của cách đếm ngày (BR-011) vào bản trình INV | BR-309, 527, 322–324, 011 |
| ESC-007 (phụ thu, FOC) | (1) Cơ sở phụ thu đơn OTA = giá Trực tiếp hiện hành. (2) Lễ tân **tự miễn** minibar ≤ 100.000/lần và ≤ 500.000/người/tháng, không cần người thứ hai duyệt, có báo cáo đóng ca. (3) Ân hạn trả phòng gắn điều kiện "căn không có khách đến cùng ngày". (4) Thời hạn ghi phát sinh sau trả phòng nhanh: 24 giờ | BR-415, 436, 412, 427 |
| ESC-008 (VAT, hóa đơn) | (1) Loại hình kinh doanh (doanh nghiệp/hộ kinh doanh) + MST. (2) Thuế suất và **thời hạn** của mức giảm. (3) Dài hạn có cùng thuế suất không. (4) Hóa đơn theo sự kiện nghiệp vụ, không theo từng lần thu | BR-523, 524 |
| ESC-011 (khóa cửa) | Mã sinh nhật = ddmm + ≥ 3 số ngẫu nhiên; mã đúng ngày sinh không được SEC chấp nhận; khóa có hoạt động khi mất điện không | BR-403, 964 |

---

## Dòng decision-log đề xuất
(ORC ghi khi commit. Không lặp lại các dòng DOM đã có trong decision-log: BR-603, OOO nửa mở, sức chứa theo căn, `F26-000123`, `void`, BR-411/215, tự gán căn OTA, FOC minibar tự miễn, ngày nghiệp vụ 06:00, ưu tiên OTA và trực tiếp.)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 1 | `business-rules.md` v0.2: mã BR cũ giữ nguyên, quy tắc mới dùng số mới; con số không có khóa ở mục 13 thì không được dùng trong code; khung giờ "A–B" hiểu là [A, B), "quá N" = đủ N là quá | DOM | BA-DOM-08, BA-DOM-13 |
| 2026-10-15 | 1 | Số ngày báo trước (hủy, trả sớm, chấm dứt HĐ) đếm theo ngày lịch giữa ngày nghiệp vụ lúc báo và ngày mốc (BR-011); trả sớm "≥ 1 ngày" thay "≥ 24 giờ" | DOM | BA-DOM-07 |
| 2026-10-15 | 1 | Khôi phục no-show: FD/FDL tự làm khi còn trong ngày nghiệp vụ, căn chưa bán lại, không có tiền ra; còn lại MGR+ duyệt; đơn OTA đã báo kênh luôn MGR+ (BR-315) | DOM | BA SQ-1 |
| 2026-10-15 | 1 | Nhận phòng trước 06:00: kiểm căn trống đêm trước; đơn trực tiếp thêm đêm, đơn OTA tạo đơn con kênh Trực tiếp vào thẳng `in_house`; không ghi phụ thu (BR-417). Trả sau 18:00 xử lý như gia hạn | DOM | DOM-PO-03, BA-DOM-14 |
| 2026-10-15 | 1 | Nhận phòng khi buồng VD/CL: chỉ lễ tân trưởng+ với lý do, căn → OD, dọn ưu tiên; không áp cho đổi phòng khách đang ở (BR-402, 803, 424) | DOM | BA-DOM-04 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-007] Trả phòng nhanh chỉ khi còn phải thu = 0; phát sinh sau trả phòng ghi dòng riêng trên folio `settled` trong 24 giờ, quá hạn → công nợ; hóa đơn điện tử xuất khi folio `closed` (BR-427) | DOM | BA-DOM-05 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-007] Cơ sở phụ thu nhận sớm/trả muộn của đơn OTA = giá kênh Trực tiếp hiện hành của đêm đó (BR-415) | DOM | PO-DOM-03 |
| 2026-10-15 | 1 | [PHÁP LÝ – chờ ESC-001] Giấy tờ NN không đạt: thị thực hết trước ngày đi hoặc hộ chiếu hết trong kỳ ở → không chặn; đã hết hạn tại ngày nhận hoặc thiếu dấu nhập cảnh → chặn giao mã cửa, lễ tân trưởng+ quyết (BR-613) | DOM | PO-DOM-04 |
| 2026-10-15 | 1 | Đơn nhóm: mã nhóm liên kết đơn căn; kiểm tồn mọi căn trong một giao dịch; cọc chung phân bổ theo tiền phòng; hủy từng căn theo BR-309 trên cọc phân bổ; bill gộp mặc định, tách được; một bản ghi hoa hồng (BR-321…326) | DOM | DOM-PO-02 |
| 2026-10-15 | 1 | Đóng ca bắt buộc: tiền mặt đếm thực tế, chênh lệch có lý do; chuyển khoản ghi tay mang cờ "chờ đối soát" tới khi MGR+ tick theo sao kê; không nhận tiền mã hóa (BR-526, 527) | DOM | DOM-PO-06, DOM-BA-03 |
| 2026-10-15 | 1 | Vận hành dự phòng: bảng dự phòng hằng ngày (không có số giấy tờ, mã cửa); mất mạng thì không nhận đơn điện thoại khi chưa xem tồn; nhập bù theo giờ thực tế có lý do trong 24 giờ (BR-961…964) | DOM | DOM-BA-04 |
| 2026-10-15 | 1 | Xung đột OTA: phương án trong 60 phút nếu khách đến trong 24 giờ; đồng bộ lỗi > 15 phút → quản lý đóng bán thủ công trên extranet; mỗi xung đột có bản ghi chi phí (BR-317) | DOM | DOM-INT-01 |
| 2026-10-15 | 1 | Hạn sửa chữa: mức Cao không dừng khi chờ vật tư; TB/Thấp dừng khi `waiting_parts` có ngày dự kiến (BR-809) | DOM | BA SQ-2 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-005] Hoa hồng gộp theo tháng lịch: `payable` ngày 1, chi trước ngày 10 tháng sau; điều chỉnh sau khi chi trừ vào kỳ sau (BR-212, 903) | DOM | BA SQ-4 |
| 2026-10-15 | 1 | Thuế suất VAT là tham số có ngày hiệu lực; hóa đơn điện tử phát hành theo sự kiện nghiệp vụ BR-524, không theo từng lần thu (BR-523, 524) | DOM | DOM-PO-09, DOM-INT-02 |
| 2026-10-15 | 1 | Nhắc gia hạn thị thực: khách dài hạn trước 30 ngày, ngắn ngày trước 14 ngày (BR-605) | DOM | DOM-UXR J2-7 |
| 2026-10-15 | 1 | Ở tối thiểu (min stay) có tham số, mặc định tắt đến khi INV chọn (BR-113) | DOM | DOM-PO-13 |
| 2026-10-15 | 1 | Danh mục mã lý do hủy chuẩn `cancel_reason_code` (có `guest_cancelled`, `hold_expired`, `ota_cancelled`…) dùng chung mọi luồng hủy (BR-308) | DOM | Đề nghị DATA |
