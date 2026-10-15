# Phản hồi của PO – Round 1, Bước 4

- Tác giả: PO | Ngày: 15/10/2026
- Phạm vi: mọi thẻ gửi PO trong `reviews/BA-on-PO.md` (15 thẻ) và `reviews/DOM-on-PO.md` (13 thẻ), cộng 11 lỗi PO tự nhận (T1–T11, cuối `reviews/PO-on-QA.md`).
- File đã sửa: `product/docs/PRD.md`, `03-backlog/backlog.md`, `product/docs/open-questions-resolution.md`, `02-escalations/ESC-001, 004, 005, 006, 007, 008, 010, 011, 012`, `02-escalations/escalations-index.md`. Không sửa ESC-003 (UXR sở hữu), không sửa file của vai khác.
- Tổng hợp: **28/28 thẻ Done** (14 Major, 11 Minor, 3 Suggestion); 0 Rejected, 0 Escalated, 0 Deferred. **Blocker/Major còn Open: 0.** T1–T11: 11/11 Done.

## 1. Thẻ của BA

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-BA-PO-01 (Major) | Done | US-018 AC1 chỉ áp cho kênh Trực tiếp/CTV/HĐ; thêm US-018 AC5 cho đơn OTA nhập tay: không chặn, không tự đổi căn im lặng, trả xung đột kèm gợi ý căn, lễ tân chọn hoặc "Lưu chưa gán căn". US-139 nâng **Must R2**, AC viết lại: cờ xung đột, không chiếm tồn phòng, làn "Chưa gán căn", báo đỏ FD + MGR, chặn nhận phòng `RESERVATION_UNASSIGNED`, gợi ý theo thứ tự DOM A2. Phần đơn về tự động giữ R3 (US-095). Theo đề xuất (3) của BA: chỉ gợi ý, không tự đổi. Báo ARC chỉnh OpenAPI |
| FB-R1-BA-PO-02 (Major) | Done | Chọn hướng (b). US-007 AC2/AC4: người duyệt xác thực lại bằng **mật khẩu đăng nhập** ở R2, **PIN duyệt** từ R3 (BR-432 "mật khẩu/PIN"). PRD M0 ghi thống nhất (R2: xác thực lại mật khẩu; R3: PIN + 2FA). Thêm US-001 AC4: tài khoản 8 vai ở R2 tạo bằng dữ liệu khởi tạo/lệnh quản trị của OPS–BE, đổi mật khẩu lần đầu; US-008 giữ Should R3 |
| FB-R1-BA-PO-03 (Major) | Done | US-023 AC2 cũ (tra mã sau gộp) chuyển sang US-074 (R3) – backlog mục "Story khác ngoài R2". US-023 AC2 mới: mã `KH-` do server cấp, không đổi khi sửa hồ sơ. QA chuyển TC-NT-023 sang US-074 |
| FB-R1-BA-PO-04 (Major) | Done | Chọn hướng (a) nhưng không thêm story: thêm **US-119 AC5** (Must R2) – ghi giao dịch thu gắn vào kỳ HĐ (A58, UC-08, SM-07 T2) → kỳ `paid`, nhắc tắt, job quá hạn không chạm kỳ đã trả. US-012 AC2 nêu rõ nhắc biến mất khi kỳ đã thu. PRD M8 + D6: "tạo HĐ và ghi thu kỳ luôn ở cùng một round" (nếu INV chọn R-C ở ESC-012 thì cả hai cùng dời R3). Trả phòng dài hạn, điện nước vẫn R3 |
| FB-R1-BA-PO-05 (Major) | Done | US-106 AC2 viết lại: sau `checked_out` mã cửa, Wi-Fi, gửi yêu cầu khóa ngay; link còn `guest_link_grace_hours` (DOM thêm vào BR mục 13; mặc định theo ADR-006/decision-log SEC M4) chỉ để xem bill + trả phát sinh. US-133 AC3 "sau khi hết ân hạn". BA cập nhật rbac 8.6 theo AC này |
| FB-R1-BA-PO-06 (Minor) | Done | PRD 6.2: "báo đã chuyển cọc kèm ảnh (CTV) / xác nhận cọc (sale nội bộ cho đơn của mình, lễ tân)" (cùng T5) |
| FB-R1-BA-PO-07 (Minor) | Done | PRD mục 4 tách U1a `owner` / U1b `manager`; cột "Không được làm" của `manager` dẫn rbac 5.3; A4 sửa "đã chốt ở rbac 5.3, chờ INV xác nhận" |
| FB-R1-BA-PO-08 (Minor) | Done | US-020 AC2 thêm "Gửi yêu cầu khôi phục" cho `front_desk`/`front_desk_lead` (A10 = D) |
| FB-R1-BA-PO-09 (Minor) | Done | Quy ước AC (mục 4) thêm phân loại: ràng buộc nhập liệu → "theo đặc tả trường" của BA (US-071 AC2, US-039 AC1, US-073 AC1, US-082 AC1, US-016 AC1); mục tiêu vận hành → ngân sách hiệu năng `architecture.md` mục 16 (US-054 AC1, US-085 AC1). Câu story US-010 bỏ "5 giây"; US-056 "theo gói dọn (BR-204/BR-807)". BA nhận ghi độ dài SĐT/MST vào spec trường R2 |
| FB-R1-BA-PO-10 (Minor) | Done | US-012 AC7: "Đồng bộ kênh lỗi" (BR-905, lớp giả lập ở R2) và "khách quen/VIP đến hôm nay"; ghi rõ "công tơ chưa chốt" thuộc R3 (US-064). Câu story US-012 cập nhật |
| FB-R1-BA-PO-11 (Minor) | Done | ESC-007 A viết lại: lễ tân **tự miễn** minibar ≤ 100.000 đ/lần và ≤ 500.000 đ/người/tháng [giả định], không cần người thứ hai duyệt, có báo cáo cuối ngày (khớp DOM SQ-3, decision-log DOM). Thêm đoạn giải thích vì sao R2 tạm "không ân hạn". ESC-006 A: "báo trước ≥ 24 giờ tính tới 12:00 (BR-401) của ngày khách muốn rời đi mới" |
| FB-R1-BA-PO-12 (Minor) | Done | `open-questions-resolution.md` đoạn mở đầu: "mục tiêu plan ≤ 9 ESC mới; thực tế 9 ESC mới + 3 ESC có từ trước"; escalations-index ghi lý do vượt |
| FB-R1-BA-PO-13 (Minor) | Done | PRD G5 = 100% (mục tiêu kinh doanh); S2 = 100% với khách nhận phòng trong giờ trực (`front_desk_hours` – BR-811) là đích nghiệm thu; ≥ 98% toàn bộ khách là ngưỡng cảnh báo của DATA (cùng T8) |
| FB-R1-BA-PO-14 (Suggestion) | Done | Thêm "bảng chọn từng dòng" (chính sách / A / B / C / mã BR-tham số / mặc định) vào ESC-004, ESC-005, ESC-006, ESC-007 |
| FB-R1-BA-PO-15 (Suggestion) | Done | Cột Nguồn: US-053 → UC-22, US-055 → UC-23, US-088 → UC-08, US-093 → UC-09, US-041 → UC-20, US-064 → UC-21, US-063 → UC-25, US-089 → UC-26; bảng 5.2 truy vết UC → story bổ sung 8 dòng |

## 2. Thẻ của DOM

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-DOM-PO-01 (Major) | Done | Thêm US-007 AC6 (lễ tân tự áp FOC minibar trong hạn mức lần + tháng, `approved` ngay theo SM-10 A2, ghi "tự áp trong hạn mức", báo cáo cuối ngày, tính BR-435); AC4 thêm "trừ AC6". ESC-007 A viết lại rõ "tự miễn, không cần người thứ hai duyệt, tối đa 500.000 đ/người/tháng" + câu phụ (1) hạn mức tháng |
| FB-R1-DOM-PO-02 (Major) | Done | Thêm **US-140 Đơn nhóm** (Must R3) với 4 AC: mã nhóm, cọc chung phân bổ, hủy từng căn/cả nhóm theo BR-309, bill gộp/tách, danh sách khách từng căn; tham chiếu BR nhóm DOM bổ sung (BR-315…). Không xếp Should R2 vì R2 đã vượt ước lượng (ESC-012); ở R2 lễ tân tạo các đơn rời và ghi chú nhóm. PRD M8 R3 cập nhật |
| FB-R1-DOM-PO-03 (Major) | Done | US-026 AC3 viết lại đúng đề xuất: kiểm căn trống đêm trước (BR-906); Trực tiếp/CTV thêm 1 đêm vào đầu đơn; OTA tạo đơn con kênh Trực tiếp liên kết (BR-421/422); là đêm bán (BR-904); căn không trống → không cho nhận sớm, gợi ý gửi hành lý/căn khác |
| FB-R1-DOM-PO-04 (Major) | Done | Quy ước AC mục 4: "hôm nay/đêm nay = ngày nghiệp vụ, đổi lúc 06:00 (BR-001)". Thêm ca test US-011 AC3 (01:30 ngày 21/10 vẫn thấy đơn đến 20/10), US-025 AC6 (nhận phòng 01:30 được), US-010 AC3 (KPI đêm nay lúc 02:00); US-136 AC4 tham chiếu cùng định nghĩa. PRD M0, A13 |
| FB-R1-DOM-PO-05 (Major) | Done | Thêm US-017 AC7, US-080 AC5 (khớp ví dụ BR-110), US-022 AC4 (thêm người giữa kỳ, lễ tân xác nhận như BR-414); đơn OTA không cộng phụ thu người |
| FB-R1-DOM-PO-06 (Major) | Done | PRD X3 tách: chấm công/xếp ca vẫn ngoài MVP; đóng ca/bàn giao tiền vào M2 R3. US-124 nâng **Must R3**, câu story mở rộng thành đóng ca, thêm 3 AC (đếm tiền mặt + lý do chênh, chuyển khoản ghi tay "chờ đối soát" MGR tick, biên bản bàn giao việc tồn) – tham chiếu BR-526 DOM bổ sung |
| FB-R1-DOM-PO-07 (Major) | Done | US-061 AC1: form hiện cả "dự kiến xong 17/10" và "mở bán lại từ 18/10"; khóa đêm 15, 16, 17; lưu [15/10, 18/10) (decision-log DOM, `ooo_reopen_buffer_days`) |
| FB-R1-DOM-PO-08 (Major) | Done | ESC-011 A: "ddmm + ít nhất 3 số ngẫu nhiên (ví dụ 1503472); chỉ rút còn 2 số nếu khóa tự khóa sau 5 lần sai – INT xác nhận"; phương án B ghi "bộ phận bảo mật không chấp nhận"; "Nếu chưa quyết" ghi rõ dạng mã. Cũng là yêu cầu SEC (qua ORC) |
| FB-R1-DOM-PO-09 (Major) | Done | ESC-008 bổ sung: (1) doanh nghiệp hay hộ kinh doanh + MST; (2) thuế suất và thời hạn mức giảm (cần kế toán xác nhận); (3) dài hạn cùng thuế suất không. "Nếu chưa quyết": thuế suất là tham số có ngày hiệu lực; loại hóa đơn tạm "GTGT" [giả định] |
| FB-R1-DOM-PO-10 (Minor) | Done | ESC-010 đổi câu khách Nga thành "gần như chắc chắn; cần biết khách đang trả bằng cách nào"; ESC-006 thêm dòng "khách không cọc online được → giữ chỗ ngắn + thu đủ khi đến, quản lý duyệt" (bảng chọn dòng 8); PRD M12 + ESC-010 ghi "không nhận tiền mã hóa" |
| FB-R1-DOM-PO-11 (Minor) | Done | (a) US-017 AC3: sàn–trần chặn với Trực tiếp/CTV/HĐ, đơn OTA chỉ cảnh báo + lý do. (b) US-024 AC4 tách: điều kiện `VI`/`VC` chỉ cho B14; B7 chỉ kiểm trùng + OOO |
| FB-R1-DOM-PO-12 (Minor) | Done | (a) US-086 AC3 đổi dữ liệu sang ví dụ BR-208 (căn 302, NN, 6 tháng). (b) PRD N11 theo RPO ≤ 15 phút của OPS. (c) Q-D3 ghi "giờ đến thực tế + số giờ BR-603"; US-042 AC1 và US-012 AC1 bỏ "sớm hơn mốc BR-602" |
| FB-R1-DOM-PO-13 (Suggestion) | Done | (a) ESC-004 thêm câu phụ (6) ở tối thiểu 2 đêm T6–T7/lễ, (7) mùa cao điểm Đà Lạt (hè, Festival Hoa, mùa hoa, nghỉ lễ dài), lưu ý "bằng giá" OTA; tham số `min_stay`, `special_dates[]`. (b) ESC-006 A thêm bất khả kháng: dời ngày miễn phí trong 3 tháng, không hoàn tiền mặt |

Ghi nhận phần A (DOM xác nhận câu hỏi): PO dùng các kết luận A2 (tự gán căn OTA chỉ trong nhóm), A3 (nhận trước 06:00 = đêm bán), A5 (BR-603 = giờ đến + 12 giờ), A8 (OOO nửa mở) trong AC đã sửa. Phần B là lỗi trong `business-rules.md` của DOM – PO không sửa; các AC đã trỏ tới BR mới DOM hứa thêm (BR-001 ngày nghiệp vụ, BR-315… đơn nhóm, BR-526 đóng ca, hạn mức tháng BR-433, `guest_link_grace_hours`, `min_stay`). Xác nhận story "Mới" của DOM: US-124 đã nâng Must R3 như DOM yêu cầu.

## 3. Lỗi PO tự nhận (T1–T11, cuối PO-on-QA.md)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| T1 | Done | US-001 AC1: màn mặc định `front_desk`/`front_desk_lead` = "Hôm nay". BA sửa rbac mục 1 |
| T2 | Done | Như FB-R1-BA-PO-01 (US-018 AC5, US-139 Must R2, `RESERVATION_UNASSIGNED`) |
| T3 | Done | Như FB-R1-BA-PO-03 |
| T4 | Done | US-087 AC2 thu hẹp ở R2 (chỉ hoa hồng dự kiến trên báo giá/đơn của mình; API đơn người khác → 404); S17 chuyển sang US-089 (R3); US-003 AC3 ghi R2 chỉ kiểm bị từ chối truy cập |
| T5 | Done | Như FB-R1-BA-PO-06 |
| T6 | Done | Gắn 13 BR vào cột Nguồn: BR-215, BR-902 → US-100; BR-313, BR-314 → US-093; BR-501, BR-504, BR-505 → US-064 (BR-501, BR-505 cả US-065); BR-506 → US-065; BR-513 → US-118 (story "đồ khách để quên" đã có, không thêm story mới); BR-523 → US-122; BR-705, BR-706 → US-067; BR-955 → US-078 |
| T7 | Done | Thêm US-141 xác minh nhẹ app khách (Must R2: OTP email / mã lễ tân cấp; kênh OTA/Zalo mặc định tắt), US-142 thiết bị được cấp cho C3 (Must R2, gồm ca đêm trên thiết bị của cơ sở), US-143 2FA cho owner/manager (Must R3) |
| T8 | Done | PRD S1 trỏ S1a/S1b/S1c của DATA; S2 gắn `front_desk_hours` (BR-811) |
| T9 | Done | ESC-001 thêm câu phụ 1 (hai cách tính hạn khai báo, đang dùng `hours_only`) và 5 (nhận phòng khi hộ chiếu/thị thực "Không đạt"); ESC-007 thêm câu phụ (2) cơ sở phụ thu đơn OTA |
| T10 | Done | US-017 AC8: kênh = BR-901 (Traveloka chỉ khi INV xác nhận) + "Nội bộ"; "Trực tiếp" có trường "Nguồn"; ô email không bắt buộc (PHÂN XỬ ORC) |
| T11 | Done | Thêm US-144 "Chốt số liệu tháng" (Could R3); đối chiếu R-01…R-07 thành AC của US-100 (R3) |

## 4. Yêu cầu chuyển tiếp từ SEC (qua ORC, bước 4)

| Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|
| ESC-011 A "+ 2 số" → ≥ 3 số | Done | Xem FB-R1-DOM-PO-08 |
| Gom Q11 (lưu ý sức khỏe D12) vào ESC-001 | Done | ESC-001 câu phụ 6 (6a đề xuất / 6b) |
| ESC-010: chi phí thiết bị ca tối + rủi ro còn lại khi gửi mã qua OTA/Zalo | Done | ESC-010 câu phụ (4) T-A/T-B (máy tính bảng ~4–8 triệu đ, ước tính chưa xác minh, chi phí của INV) và (5) Z-A/Z-B (rủi ro Trung bình – TM-21, TM-61, threat-model mục 9; mặc định tắt) |

## 5. Thay đổi phạm vi do bước 4 (PO tự quyết trong quyền ưu tiên backlog)
- Backlog: 139 → **144 story**; Must R2: 74 → **77** (+US-139 nâng từ R3, +US-141, +US-142); Must R3: 17 → **19** (+US-140, +US-143, +US-124 nâng; −US-139). Phần ghi thu kỳ HĐ thêm vào US-119 (không thêm story).
- Vì Must R2 tăng trong khi ước lượng BE đã gấp đôi ARC, câu hỏi phạm vi R2 được đưa vào ESC-012 (câu phụ R-A/R-B/R-C, đội đề xuất R-C). Plan R2 lập theo R-C nếu INV chưa trả lời.

## 6. Dòng decision-log đề xuất (ORC ghi – PO không sửa decision-log)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 1 | Duyệt FOC ở R2: người duyệt xác thực lại bằng mật khẩu đăng nhập của chính mình; PIN duyệt riêng ở R3; tài khoản 8 vai ở R2 tạo bằng dữ liệu khởi tạo/lệnh quản trị, đổi mật khẩu lần đầu | PO | FB-R1-BA-PO-02; BR-432 |
| 2026-10-15 | 1 | Lễ tân tự áp FOC minibar trong hạn mức lần + tháng không cần người thứ hai (US-007 AC6); vượt hạn mức đi luồng duyệt | PO (theo DOM) | FB-R1-DOM-PO-01; SM-10 A2 |
| 2026-10-15 | 1 | US-139 (đơn OTA trùng: cờ xung đột, làn "Chưa gán căn", chặn nhận phòng khi chưa gán) nâng Must R2; US-018 chặn trùng chỉ áp cho kênh Trực tiếp/CTV/HĐ | PO | FB-R1-BA-PO-01; BR-312 |
| 2026-10-15 | 1 | Ghi nhận đã thu từng kỳ HĐ dài hạn (US-119 AC5) làm cùng round với sinh HĐ (R2), để kỳ đã trả không bị báo quá hạn | PO | FB-R1-BA-PO-04 |
| 2026-10-15 | 1 | Link app khách sau `checked_out`: mã cửa, Wi-Fi, gửi yêu cầu khóa ngay; ân hạn `guest_link_grace_hours` chỉ xem bill và trả phát sinh | PO | FB-R1-BA-PO-05; SEC M4; ADR-006 |
| 2026-10-15 | 1 | Nhận phòng trước mốc tròn 1 đêm: Trực tiếp/CTV thêm đêm vào đơn, OTA tạo đơn con Trực tiếp; căn không trống thì không cho nhận sớm (US-026 AC3) | PO (theo DOM) | FB-R1-DOM-PO-03 |
| 2026-10-15 | 1 | Đơn OTA nhập tay: giá ngoài sàn–trần chỉ cảnh báo + lý do; sàn–trần chặn với Trực tiếp/CTV/HĐ và khi sửa lịch giá | PO (theo DOM) | FB-R1-DOM-PO-11 |
| 2026-10-15 | 1 | Đóng ca/bàn giao ca (US-124) là kiểm soát tiền, nâng Must R3; X3 chỉ còn xếp ca/chấm công | PO | FB-R1-DOM-PO-06 |
| 2026-10-15 | 1 | Thêm US-140 Đơn nhóm nhiều căn (Must R3); ở R2 dùng đơn rời + ghi chú nhóm | PO | FB-R1-DOM-PO-02; R2 đã vượt ước lượng |
| 2026-10-15 | 1 | Thêm story bảo mật: US-141 xác minh nhẹ app khách (Must R2), US-142 thiết bị được cấp cho C3 (Must R2), US-143 2FA owner/manager (Must R3); US-144 chốt số liệu tháng (Could R3). Backlog 144 story, 77 Must R2, 19 Must R3 | PO | T7, T11; decision-log SEC |
| 2026-10-15 | 1 | Không tạo ESC mới ở bước 4: câu hỏi phát sinh gom vào ESC-001, 004, 006, 007, 008, 010, 011, 012 (câu phụ có phương án + đề xuất); ESC-004…007 có bảng chọn từng dòng; tổng vẫn 12 ESC | PO | Protocol mục 8; FB-R1-BA-PO-14 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-012] Nếu INV chưa trả lời, plan R2 theo phương án R-C: dời báo giá/HĐ dài hạn + ghi thu kỳ, app khách nâng cao (bill, mã cửa, OTP), nhắc kỳ thu/gia hạn tự động, mẫu tin sang đầu R3; không cắt nền tảng, chống trùng, folio/thu tiền, bảo vệ giấy tờ | PO | FB-R1-BE-ARC-16; PHÂN XỬ ORC |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-007] Phụ thu nhận sớm/trả muộn của đơn OTA tính trên giá trực tiếp hiện hành của căn | PO | T9; ESC-007 câu phụ (2) |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-008] Thuế suất VAT là tham số có ngày hiệu lực; loại hóa đơn tạm "hóa đơn GTGT" | PO (theo DOM) | FB-R1-DOM-PO-09 |
