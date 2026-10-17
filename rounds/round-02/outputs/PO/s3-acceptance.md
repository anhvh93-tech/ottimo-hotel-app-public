# Nghiệm thu của PO – Round 2, Sprint 3 (trước cổng QC)

- Người nghiệm thu: PO | Ngày: 17/10/2026 | Bước: nghiệm thu story Sprint 3 trước cổng QC Sprint 3
- **Nghiệm thu trên CI + stack tạm – chờ staging.** Chưa có VPS/tên miền (INV đang mua; demo 1 chạy localhost máy INV). Mọi "Accepted" dưới đây là **Accepted (stack tạm)**. Theo P-R2-7, story chỉ chuyển "Xong" khi PO kiểm lại giao diện trên staging.
- Bản được nghiệm thu: code **`6af7173`** (HEAD `adc0a47` chỉ thêm tài liệu) = CI run **38998735861**: 9/9 job xanh; E2E **1.777 đạt**, 82 bỏ qua có lý do, 3 `test.fail` đúng dự kiến (BUG-R2-033 (a), 038, 054); TC-L3-011 chạy lại 1 lần (S4-24). Đối chiếu thêm:
  - `qa/s3-test-report.md` (lượt `229db99`) và `qa/s3-retest.md` (`9e9fd64`: 2 lượt 1.773/0/82/3; 118 ca S3 = 105 đạt · 3 trượt dự kiến · 10 bỏ qua; RBAC S3 737/737; axe 45 lần quét, 0 vi phạm).
  - `qa/bug-list.md`: 54 lỗi; còn mở 033 (a) P2, 054 P3; 038 hoãn 0.3.7; 0 P0/P1.
  - `reviews/s3-round8-verification.md`: "ĐẠT để vào cổng QC"; api 2.187/2.187.
  - `s4-carryover.md` (S4-01…S4-24), decision-log 16–17/10.
- Cách làm: PO không chạy lại stack. PO đọc báo cáo QA/kiểm chứng, đọc thân ca E2E (`product/tests/e2e/**`: ca nào chạy, ca nào `skip`/`test.fail`), test tích hợp BE (`services/api/test/**`), test FE (`apps/admin-web/src/__tests__/**`), và đọc code ở những chỗ chưa có ca (ghi rõ "Code").

## 0. Cách đọc

| Ký hiệu bằng chứng | Nghĩa |
|---|---|
| **E2E** | Ca Playwright tầng API chạy thật trên stack compose sạch ở CI 38998735861 (project `api`, `clock` dùng MutableClock, `serial`) |
| **E2E-UI** | Ca trình duyệt (`desk-chromium`, `desk-clock`, guest-web H18 390×844) + axe, cùng CI |
| **TT** | Test tích hợp/đơn vị BE trên PostgreSQL thật (job `test` của CI) |
| **FE** | Test giao diện của admin-web (vitest + MSW), không phải E2E |
| **Code** | PO đọc code, chưa có ca test chạy → luôn kèm việc giao QA |

| Kết quả AC | Nghĩa |
|---|---|
| **Accepted** | Đúng AC ở **phần R2**, có bằng chứng chạy thật. Phần đã dời R3 theo R-C/INV quyết (mã cửa US-128, folio trên app khách US-111, HĐ dài hạn, xác minh US-141) chỉ ghi chú, không tính là thiếu |
| **Accepted một phần** | Một phần đạt; phần còn lại ghi rõ dời đi đâu (mã S4 trong `s4-carryover.md`; mã có dấu * là **đề nghị ORC thêm**, mục 4.2) |
| **Trả lại** | Chạy sai AC, phải sửa trước khi nghiệm thu |

Kết quả cấp story → cột Trạng thái backlog: **Accepted** = "Đạt (stack tạm)"; **Accepted một phần** = "Đang nghiệm thu" (kèm dòng "> Nghiệm thu S3" ở mục 4 backlog); **Trả lại** = "Đang nghiệm thu (trả lại)".

## 1. Tổng hợp

| Nhóm | Số story | Accepted | Accepted một phần | Trả lại |
|---|--:|--:|--:|--:|
| Story Sprint 3 (EP02 US-022, EP03, EP04, EP05, EP15, EP06, EP14 check-in online) | 27 | **17** | **10** | **0** |
| Story S1/S2 có phần dời sang S3 (mục 3) | 19 | 10 | 9 | 0 |

- Story S3 Accepted: US-022, 026, 027, 035, 036, 037, 039, 042, 044, 045, 046, 047, 049, 050, 106, 107, 120.
- Story S3 Accepted một phần: US-025, 028, 029, 030, 031, 032, 038, 043, 048, 119.
- S1/S2 chấm lại: lên **Accepted** US-002, 004, 005, 018, 021, 083, 142; giữ Accepted US-001, 082, 087; còn một phần US-003, 006, 007, 020, 024, 086, 135, 139; **hạ từ Đạt xuống một phần: US-084** (mã VietQR cọc chưa có trên giao diện, PO-S3-04).
- **Không AC nào bị trả lại.** Sai tiền không có trên đường dùng thường ngày; các ca biên về tiền đã có trong `s4-carryover.md` (ORC dời sau kiểm chứng vòng 4–8).
- Phần dời đều nằm trong **Round 2 (Sprint 4)**, trừ các phần đã là R3 từ trước (R-C, US-034, US-124, US-051, US-074). **Không có phần Must R2 nào dời sang R3** → không đổi phạm vi R2, không cần ESC phạm vi (mục 5). Có **1 ESC chính sách giá mới: ESC-019** (S4-21).

**Điểm PO cần QC/ORC chú ý.** Các AC thiếu nhiều nhất ở **giao diện Desk**, API đã có và đã test. Hai chỗ chạm luồng A1 của QC cuối Round 2:
- (1) **Mã VietQR cọc** khi giữ chỗ (S4-28*).
- (2) **Xin FOC lúc lưu trú/trả phòng**: trả muộn, dòng phát sinh, minibar (S4-25*). Hiện Desk chỉ xin FOC được ở bước nhận phòng.

## 2. Story Sprint 3 (27 story)

### EP02 – US-022 Người đi cùng (dời từ S2) – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 thiếu người → cảnh báo "Thiếu n người" | TT `frontdesk.test.ts` "US-022 party" (`requiredCount 2, presentCount 1, missingCount 1`); FE drawer H11/H15 hiện `rsv.party_missing` từ `Reservation.partyMissingCount`. E2E TC-L2-060 chưa viết | Accepted (QA thêm E2E – S4-33*) |
| AC2 trẻ em: không hồ sơ CRM, không liên hệ, bậc tuổi riêng | TT cùng ca: tên/năm sinh trẻ mã hóa (`child_name_enc`), không có trong phản hồi; `priceAgeBand child_6_11`; E2E TC-L3-055 (thêm/bớt người) | Accepted |
| AC3 thêm trùng người → chặn | TT `409 PARTY_DUPLICATE` (cả người đứng tên) | Accepted |
| AC4 thêm người lớn khi đang ở → đề xuất phụ thu từ đêm thêm, xác nhận mới ghi | E2E TC-L3-056 (A+E); TT frontdesk-s3-fixes ARC-01/DOM-16 (150.000/đêm từ đêm thêm); đơn OTA: TC-L4-090 (nguồn đổi số người – DOM 17/10) | Accepted |

### EP03 – Nhận phòng

#### US-025 Nhận phòng – **Accepted một phần**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 `in_house`, buồng `OC`, giờ nhận, không phụ thu | E2E TC-L3-001 (A+E): H13 4 bước trên máy quầy được cấp + axe | Accepted |
| AC2 buồng `VD` → FD gửi FDL xác nhận; sau nhận `OD` + việc dọn ưu tiên | E2E TC-L3-002; BUG-R2-040 Closed (rack đọc `room_status`); TT `checkin_room_not_ready` (FD → 202 → FDL duyệt → OD); FE FE-S3-05 | Accepted |
| AC3 còn phải thu > 0 hoặc thiếu giấy tờ người đứng tên → không hoàn tất | E2E TC-L3-003, 007, 062 đạt. **Còn:** điều kiện "đã thu đủ" chưa cộng phụ thu nhận sớm/đêm B9a sắp ghi (BUG-R2-038, TC-L3-011 bước cuối `test.fail`) → nhận phòng được khi khoản này chưa thu; B18 chặn `BALANCE_DUE` nên không mất tiền | Accepted một phần → **S4-10** (OpenAPI 0.3.7) |
| AC4 khai báo chưa `sent` → hiện hạn + đơn vào "Cần chú ý" | E2E TC-L3-004: `GET /attention` có `registration_due/overdue` (BUG-R2-034 Closed). Khung trên Tổng quan nghiệm thu ở US-012 (S4) theo ghi chú PO 17/10 | Accepted |
| AC5 MGR hoàn tác nhận phòng cùng ngày | E2E TC-L3-005 (FD 403; MGR có lý do; có dòng folio mới/hôm sau → 409). Mã cửa hủy: R3 (US-128) | Accepted |
| AC6 nhận phòng 01:30 ngày D+1 (ngày nghiệp vụ) | E2E TC-L3-008 (a) – BUG-R2-052 Closed. Giao diện H13 ban đêm chưa chạy lại (s3-retest mục 6) | Accepted (QA chạy lại UI ban đêm – S4-33*) |
| AC7 ô "Đã giao mã cửa/thẻ" không bắt buộc | E2E TC-L3-073 (A+E) | Accepted |

#### US-026 Phụ thu nhận sớm – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 mặc định giờ chuẩn, phụ thu 0, chưa có dòng folio | E2E TC-L3-010 (A+E) | Accepted |
| AC2 nhận 11:00 → đề xuất BR-411, chỉ ghi khi xác nhận | E2E TC-L3-011 (bước đề xuất + ghi sau xác nhận đạt; bước "đã thu đủ" thuộc US-025 AC3), TC-L3-012 | Accepted |
| AC3 trước mốc tròn đêm → thêm đêm/đơn con OTA, không cho khi căn không trống | E2E TC-L3-008 (b) (oracle BR-417-01), TC-L3-013; TT B9a trực tiếp/OTA, BR-417-02 | Accepted |
| AC4 miễn phụ thu → luồng duyệt | E2E TC-L3-014 (`SURCHARGE_DECISION_REQUIRED`, BUG-R2-039 Closed); H13 có "xin FOC phụ thu nhận sớm" | Accepted |

#### US-027 Phụ thu cho đơn dài hạn – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 cơ sở = giá đêm quy đổi BR-102, khớp BR-413 | E2E TC-L3-015 (oracle) | Accepted (R2 qua đơn dài hạn nhập tay; HĐ đầy đủ R3) |
| AC2 miễn phí dài hạn khi căn không có khách đến | E2E TC-L3-016 | Accepted |

### EP04 – Lưu trú

#### US-028 Gia hạn – **Accepted một phần**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 tối đa min(đêm trống, BR-421); vượt → hướng báo giá dài hạn | E2E TC-L4-001 (A+E; cờ `exceedsShortStayLimit`). Báo giá dài hạn R3 (R-C) | Accepted |
| AC2 giá BR-421, ngày đặc biệt lấy giá ngày đó | E2E TC-L4-002; FE FE-S3-03, E04-07 ("Giữ giá đơn") | Accepted |
| AC3 đơn OTA → đơn con Trực tiếp + "tiết kiệm phí kênh" | E2E TC-L4-003 (BUG-R2-045 Closed); TT B13 OTA | Accepted |
| AC4 ngày đi, `OD`, đổi việc dọn, đồng bộ, khai báo NN `needs_update`, hạn thu BR-423 | E2E TC-L4-004: ngày đi, `OC → OD` (BUG-R2-047 Closed), lệnh outbox, `needs_update` đạt; hạn BR-423 hiện ở giao diện. **Còn:** đổi việc "Dọn trả phòng" → "Dọn phòng khách đang ở" chưa kiểm được (`listHkTasks` là S4) | Accepted một phần → **S4-31*** (kiểm cùng EP07) |
| AC5 hai người cùng gia hạn/đặt cùng đêm → 1 thành công | E2E TC-L4-005 (P+A) | Accepted |

#### US-029 Trả muộn – **Accepted một phần**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 15:00 → đề xuất BR-412, ghi khi xác nhận | E2E TC-L4-010 (A+E), TC-L4-011 | Accepted |
| AC2 có khách đến cùng ngày, hết căn thay → FD bị chặn, MGR duyệt | E2E TC-L4-012; TT B15 conflict (FD 409 → yêu cầu → MGR duyệt); FE FE-S3-10 | Accepted |
| AC3 sau mốc cuối → chuyển gia hạn 1 đêm | E2E TC-L4-013; TT E05-11; FE checkout.test (sau 18:00 thêm đêm) | Accepted |
| AC4 việc dọn "dọn sau giờ trả", mã cửa kéo dài, nhật ký nhắc ghi giờ chốt | E2E TC-L4-014: nhật ký nhắc + không lộ mã cửa đạt. Mã cửa: R3 (US-128). **Còn:** việc dọn "dọn sau 15:00" chưa kiểm (`listHkTasks` S4) | Accepted một phần → **S4-31*** |

#### US-030 Xác nhận giờ trả – **Accepted một phần**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 nhật ký nhắc "Gọi điện – khách trả lúc 11:00" | E2E TC-L4-020 (A+E) | Accepted |
| AC2 thẻ "khách trả phòng hôm nay" → "đã trả lời" | E2E TC-L4-021: trạng thái `replied` ở `listCheckoutReminders` đạt; thẻ trên màn Hôm nay (`getArrivalsDepartures`) chưa có → bước cuối `skip` | Accepted một phần → **S4-31*** (cùng US-011, EP01) |

#### US-031 Thẻ khách trả phòng hôm nay chưa trả – **Accepted một phần**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 trạng thái đổi theo mốc BR-425, "Quá giờ" báo đỏ FD + MGR | E2E TC-L4-022: trạng thái theo từng mốc (trước/sau 1 phút, giờ VN) tính lúc đọc – đạt. **Còn:** thẻ + báo đỏ cho FD/MGR trên Hôm nay/"Cần chú ý"; job J4 chưa đăng ký. Gửi nhắc tự động cho khách là US-034 (đã R3) | Accepted một phần → **S4-31*** |
| AC2 căn có khách đến → thẻ lên đầu | E2E TC-L4-023 `skip` (chờ `getArrivalsDepartures`) | Dời → **S4-31*** |

#### US-032 Dòng phát sinh / phí phạt – **Accepted một phần**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 giá BR-511, loại "Phí phạt", sửa được số lượng, có nhật ký | E2E TC-L4-030 (A+E): giá, loại, nhật ký đạt; FE hộp "Thêm phát sinh" (H15 15.5). **Còn:** sửa số lượng dòng đã ghi = điều chỉnh dòng. API có (`adjustFolioLine`, TC-NT-016) nhưng Desk chưa có nút | Accepted một phần → **S4-27*** |
| AC2 phí phạt/hư hỏng thiếu ảnh/ghi chú → chặn | E2E TC-L4-031; FE ô bằng chứng (`uploadAttachment penalty_evidence`) | Accepted |
| AC3 "Còn phải thu" cập nhật ở chi tiết đơn và app khách | E2E TC-L4-032 (A+E) phần Desk. App khách: R3 (US-111 – R-C) | Accepted |
| AC4 hư hỏng ngoài bảng giá → yêu cầu định giá MGR/OWN | E2E TC-L4-033 (dòng `pending_approval`, yêu cầu tới `manager`) | Accepted |

### EP05 – Trả phòng & bill

#### US-035 Bước 1 minibar – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 dùng 2 lon → 2 × giá bán | E2E TC-L4-040 (A+E) + E2E-UI H16 (TC-L4-053 (E)) | Accepted |
| AC2 món miễn phí → "Miễn phí", vẫn ghi tiêu hao | E2E TC-L4-041 | Accepted |
| AC3 số còn > mức chuẩn hoặc âm → chặn | E2E TC-L4-042 (A+E) | Accepted |

#### US-036 Bước 2 phụ phí – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 giờ trả mặc định = giờ đã hẹn / giờ chuẩn | E2E TC-L4-044 (A+E); FE FE-S3-04 (phụ thu trả muộn phải có quyết định của quầy) | Accepted |
| AC2 giặt ủi + "Chuyển khoản QR" → "Còn phải thu" cập nhật | E2E TC-L4-045 (E) | Accepted |
| AC3 đơn OTA thu hộ → chỉ khoản tại quầy | E2E TC-L4-046, 047, 048 (BUG-R2-044 P0 Closed ở `229db99`) | Accepted |

Ghi chú: câu chuyện của US-036 có "FOC" ở bước 2, nhưng không AC nào của US-036 kiểm phần này. Việc Desk chưa xin được FOC ở bước 2 được chấm ở US-007 AC1/AC6 (mục 3).

#### US-037 Bước 3 bill – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 3 đêm × 820.000 + minibar + phụ thu + FOC âm = 2.485.000 | E2E TC-L4-050 (A+U, oracle) | Accepted |
| AC2 khách NN → song ngữ VI–EN + USD tham khảo kèm ngày tỷ giá | E2E TC-L4-051 (A+E); FE checkout.test "bilingual … USD reference" | Accepted |
| AC3 "Đã thu" = tổng giao dịch `succeeded` | E2E TC-L4-052 | Accepted |

#### US-038 Hoàn tất trả phòng – **Accepted một phần**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 `checked_out`, folio `settled` + số bill, `VD`, việc dọn + bổ sung minibar, khai báo NN `needs_update` | E2E TC-L4-053 (A+E, H16 `desk-clock`): số bill `F26-…`, `VD`, `createdTaskIds` = 2, `needs_update`; FE hộp xác nhận nêu hậu quả. Mã cửa "đã hủy": R3 (US-128); tên/loại việc dọn kiểm ở S4 | Accepted |
| AC2 folio `settled`: FD không sửa; MGR/OWN bút toán điều chỉnh có lý do | E2E TC-L4-054 (API) đạt. **Còn:** Desk chưa có nút "Điều chỉnh" cho MGR/OWN | Accepted một phần → **S4-27*** |
| AC3 còn phải thu → FD bị chặn; chỉ MGR/OWN ghi công nợ có hạn | E2E TC-L4-055: FD `409 BALANCE_DUE`, MGR ghi công nợ, nhật ký `reservation.debt_on_checkout` đạt. **Còn:** H16 chưa có điều khiển "Ghi công nợ" cho MGR/OWN (chỉ có chuỗi `co.debt_mgr`) | Accepted một phần → **S4-26*** |
| AC4 còn FOC `pending`/`escalated` → chặn | E2E TC-L4-056 (BUG-R2-046 Closed), TC-NT-031 | Accepted |

#### US-039 Hóa đơn GTGT công ty – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 MST sai dạng → chặn tại ô | E2E TC-L4-058 (A+U) | Accepted |
| AC2 gắn bill + hồ sơ khách | E2E TC-L4-059 (BUG-R2-041 Closed). Phát hành thật: US-122 (R3) | Accepted |

### EP15 – Thu tiền

#### US-119 Ghi nhận thu tiền – **Accepted một phần**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 2 giao dịch `succeeded`, còn phải thu 0 | E2E TC-L4-060 (A+E) | Accepted |
| AC2 OTA thu hộ → chỉ còn phát sinh | E2E TC-L4-061 (BUG-R2-044 Closed) | Accepted |
| AC3 chỉ MGR/OWN đảo giao dịch có lý do, không xóa | E2E TC-L4-062 (API) đạt. **Còn:** Desk chưa có nút "Đảo giao dịch" (`reversePayment`) | Accepted một phần → **S4-27*** |
| AC4 SAL chỉ ghi cọc đơn của mình; CTV không ghi | E2E TC-L4-063 (BUG-R2-042 Closed) | Accepted |
| AC5 | [Dời R3 – R-C] | – |
| AC6 cờ "chờ đối soát", lọc theo ngày/người ghi; sale ghi mọi cách thu đều chờ (ESC-017 A) | E2E TC-L4-069, TC-L5-052; FE Tiền (refund.test: đối soát, tự đối soát 403) | Accepted |

#### US-120 VietQR – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 QR đúng số tiền, nội dung = mã bill/đơn | E2E TC-L4-064 (A+U); FE checkout.test (QR vẽ tại máy) | Accepted (tài khoản thử – ESC-010; INV nhập tài khoản thật ở Tham số khi có staging) |
| AC2 chưa cấu hình → "Chưa cấu hình tài khoản nhận", không QR giả | E2E TC-L4-065 (A+E) | Accepted |

Ghi chú: QR cọc khi giữ chỗ chấm ở US-084 AC4 (mục 3).

### EP06 – Giấy tờ, khai báo, dữ liệu khách

#### US-042 Danh sách cần khai báo – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 hạn BR-602/603, "Đã quá hạn" có nhãn chữ | E2E TC-L3-044, 045, 046 (BUG-R2-035 Closed) | Accepted |
| AC2 mốc nhắc BR-611 → FD + MGR nhận thông báo | E2E TC-L3-048 (J5; tổng hợp 22:00) | Accepted |
| AC3 đổi tham số hạn → tính lại, không đổi code | E2E TC-L3-049 | Accepted |

#### US-043 Nhập giấy tờ – **Accepted một phần**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 `partial` → `review` | E2E TC-L3-030 (A) + E2E-UI TC-L3-030 (E) (BUG-R2-031 Closed) | Accepted |
| AC2 trẻ em: số định danh, không bắt ảnh | E2E TC-L3-031 | Accepted |
| AC3 khớp hồ sơ theo khóa định danh, không thì hồ sơ "từ giấy tờ" | E2E TC-L3-032 `test.fail` ×2: (a) không khớp được hồ sơ cũ (`guest.id_doc_hmac` không có lệnh ghi – BUG-R2-033 (a)); (b) hồ sơ "từ giấy tờ": đặc tả/hợp đồng 0.3.7 xong, cài đặt dời theo ORC 17/10. Ngay S3 đã bỏ tự gắn khi chỉ khớp tên + ngày sinh (điều kiện SEC) | Accepted một phần → **S4-11** |
| AC4 mỗi lần xem/nhập → nhật ký C3 | E2E TC-L3-033, TC-RB-022 | Accepted |

#### US-044 Đối chiếu tự động – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 hộ chiếu hết hạn ≤ ngày trả → Không đạt | E2E TC-L3-034 | Accepted |
| AC2 thiếu dữ liệu → "Chưa kiểm được", không bao giờ "Đạt" giả | E2E TC-L3-035; FE checkin.test (mục chưa kiểm cần ghi chú) | Accepted |
| AC3 "Daniel Weber" ↔ "WEBER DANIEL" → Đạt | E2E TC-L3-036 | Accepted |
| AC4 thị thực hết trước ngày trả → cảnh báo, "Cần chú ý", ngày khai đề xuất; chặn theo BR-613 | E2E TC-L3-037 (A+E; BUG-R2-034 Closed); TT `registration-flow` BR-613 (c) chặn + FDL xác nhận; FE c3-exception.test. Khung "Cần chú ý" trên Tổng quan: US-012 (S4) | Accepted |

#### US-045 Đồng ý lưu ảnh – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 phải chọn Có/Không (không tích sẵn) mới `scanned` | E2E TC-L3-038 (A+E); FE consent theo `consentNotice` (s3-review) | Accepted |
| AC2 "Không" → xóa ảnh khi `confirmed` | E2E TC-L3-039 (BUG-R2-036 Closed) | Accepted |
| AC3 đồng ý qua check-in online ghi thời điểm, hình thức, mục đích | E2E TC-L3-040, TC-L7-012 | Accepted |

#### US-046 Khai báo bán tự động – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 tiêu đề theo loại khách | E2E TC-L3-041 | Accepted |
| AC2 sao chép đủ trường, đúng thứ tự, chỉ máy được cấp, xóa bộ nhớ tạm; dd/mm/yyyy + alpha-3 (ESC-018) | E2E TC-L3-042, TC-L3-050 (định dạng theo ESC-018); FE FE-S3-01 (ẩn tab → xóa bộ nhớ tạm) | Accepted |
| AC3 `sent` → `confirmed`; từ chối → `scanned` | E2E TC-L3-043 | Accepted |

#### US-047 Mọi đơn có bản ghi khai báo – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 mọi luồng có 1 bản ghi `none`, số người = số khách | E2E TC-L3-050 (đặt mới, giữ chỗ từ báo giá, OTA nhập tay, đơn dài hạn nhập tay). HĐ dài hạn: R3 (R-C) | Accepted |
| AC2 đơn con gia hạn không sinh bản ghi mới | E2E TC-L3-051 | Accepted |
| AC3 đổi số khách → cập nhật; đã `confirmed` → `needs_update` | E2E TC-L3-052 | Accepted |

#### US-048 Quyền xem ảnh giấy tờ – **Accepted một phần**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 FD xem ảnh còn hạn, nhật ký C3 | E2E TC-RB-022 (máy quầy được cấp + xác thực lại, `no-store`, có `c3_access_log`); E2E-UI TC-X-040 H14 | Accepted |
| AC2 HK/MT/SAL/CTV bị từ chối, không trả trường | E2E TC-RB-002, TC-SEC-010 | Accepted |
| AC3 CRM chỉ hiện 4 ký tự cuối | Hồ sơ CRM không lộ số đầy đủ (TC-RB-001). **Phát hiện PO-S3-07:** hồ sơ CRM không hiện cả 4 ký tự cuối. Cột `guest.id_doc_last4` không có lệnh ghi nào (chỉ đọc ở `guests.service.ts:72`, `guest-mapper.ts:68`), cùng gốc với BUG-R2-033 (a). Bản ghi khai báo vẫn có `docNumberLast4` | Accepted một phần → **S4-32*** (gộp S4-11) |
| AC4 không có xuất hàng loạt | OpenAPI 0.3.6 không có operation xuất giấy tờ nhiều người (A75 cấm mọi vai; `gen_rbac_cases --check` OK). TC-RB-009 chưa viết | Accepted (QA thêm ca – S4-33*) |

#### US-049 Tự xóa ảnh giấy tờ – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 quá hạn BR-610 → job xóa, giữ chữ, nhật ký | E2E TC-L3-070 (J16); TC-L3-074 (khai báo chưa `confirmed`: xóa đúng hạn, nhật ký C3 purge). BUG-R2-054 (không ghi `imagesPurgedAt` → H14 thiếu dòng "Ảnh đã xóa lúc…") không thuộc nội dung AC | Accepted (BUG-R2-054 → S4-12) |
| AC2 không đồng ý → xóa khi `confirmed` | E2E TC-L3-071 | Accepted |
| AC3 MGR/OWN xóa sớm qua hộp xác nhận; FD không có | E2E TC-L3-072 (A+E) | Accepted |

#### US-050 Ngày đi thực tế & hạn tạm trú – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 gia hạn/trả sớm/trả phòng → `needs_update` + việc "Cập nhật ngày đi" | E2E TC-L3-053 | Accepted |
| AC2 ngày đi > hạn thị thực → chặn mềm có lý do, ngày khai không vượt, nhắc trước BR-605 | E2E TC-L3-054 (BUG-R2-037 Closed: `VISA_EXPIRES_BEFORE_DEPARTURE` → nhập lý do); nhắc = nguồn `visa_expiring` (khung S4 – US-012) | Accepted |

### EP14 – Check-in online (guest-web)

#### US-106 Mở app khách bằng link/QR – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 lễ tân "Gửi link check-in", mở thẳng trang đơn | E2E TC-L7-001 (A+E); FE guest-link.test (link hiện 1 lần, sao chép + QR, không lưu, thu hồi; `GuestLinkPanel` – `c52d149`) | Accepted |
| AC2 link A không xem B; sau trả phòng khóa ngay, còn ân hạn BR-427 | E2E TC-L7-002 (a); clock TC-L7-002 (b) + TC-L7-013: `403 GUEST_STAY_ENDED`, link sống tới 12:00 ngày đi + 24 giờ rồi `401`. Xem bill/thanh toán trên app khách: R3 (US-111, R-C) | Accepted |
| AC3 phần nhạy cảm cần xác minh (US-141) | R2 theo P-R2-4: E2E TC-L7-003 – route mức 2 + mã cửa `404` với mọi chủ thể; khách mức 1 chỉ thấy dữ liệu ĐK-2. Xác minh nhẹ: R3 (US-141) | Accepted (phần R2) |

#### US-107 Check-in online – **Accepted**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 4 bước → khai báo `pre`, FD thấy giờ đến + thông báo | E2E TC-L7-010 (A + E-UI H18 VI + axe) | Accepted |
| AC2 bỏ dở → mở lại tiếp từ bước dở | E2E-UI TC-L7-011 (không hiện lại ảnh – P-R2-4) | Accepted |
| AC3 không đồng ý vẫn hoàn tất | E2E TC-L7-012 | Accepted |
| AC4 tệp sai/quá lớn; link hết hạn/sai → trang lỗi | E2E TC-L7-013 (A+E) | Accepted |
| AC5 tiếng Anh đã duyệt | E2E-UI TC-L7-014 (EN + axe). RU: chuỗi pháp lý giữ EN đã duyệt (ORC 17/10) | Accepted |

Ghi chú EP14: chỉ chạy trên Chromium giả lập 390×844, chọn tệp thay cho camera; chưa thử iPhone/Android thật (ảnh HEIC, ảnh 48 MP). Phần này kiểm lại trên staging. QA đề xuất kế hoạch đa thiết bị ở R3. MOB đã làm sớm tab Thông tin lưu trú (US-108) và chuyển ngôn ngữ (US-112); hai story này nghiệm thu ở S4, cùng phần EP14 còn lại.

## 3. Phần S1/S2 đã dời sang S3 (các dòng "→ S3" của `acceptance.md`)

| Story | Phần dời sang S3 | Bằng chứng | Kết quả AC | Story sau chấm |
|---|---|---|---|---|
| US-001 | AC3: thêm TC-NT-004 (N-2) | E2E TC-NT-004 (người tạo/sửa, trường cũ/mới) | Accepted | Accepted (giữ) |
| US-002 | AC3 hợp quyền 2 vai (N-2) | E2E TC-NT-009 (`qa.fdsal`: quyền FD ∪ SAL, hoa hồng chỉ của mình). Câu hỏi Q-QA-S3-01: PO trả lời ở mục 6 | Accepted | **Accepted** (lên) |
| US-003 | AC1 kiểm với khách có giấy tờ C3 | E2E TC-RB-001 (JSON SAL/CTV không có khóa giấy tờ, kể cả 4 số cuối), TC-RB-002 | Accepted | Một phần (AC2, AC4 vẫn S4 như S2) |
| US-004 | AC1, AC2 thiếu bằng chứng (N-1); ĐK-S2-2 | E2E TC-NT-018, TC-NT-019 (`serial`); TC-NT-039/040 (b)(c) – BUG-R2-025 Closed | Accepted | **Accepted** (lên) |
| US-005 | AC1 (N-1) | E2E TC-NT-011 (`serial`); seed `special_dates` theo ESC-015 (QA s3-kickoff) | Accepted | **Accepted** (lên) |
| US-006 | AC1 thêm/điều chỉnh dòng folio | Thêm dòng: TC-L4-030 + FE. Điều chỉnh: API TC-NT-016 (nhật ký trước/sau, không xóa) đạt; **Desk chưa có nút điều chỉnh** | Accepted một phần → **S4-27*** | Một phần |
| US-006 | AC2 (1) lọc nhật ký tiền | E2E TC-NT-017 (1); E2E-UI TC-X-040 H17 (Nhật ký tiền 3 tab) | Accepted | ↑ |
| US-007 | AC1 gửi FOC, không ô chọn người duyệt, người duyệt nhận thông báo | API: E2E TC-NT-027 (luồng). Màn duyệt H17 không có ô chọn người duyệt. **Desk chỉ xin FOC được ở H13 (phụ thu nhận sớm)**. Chưa xin được ở trả muộn, dòng phát sinh, bước 2 trả phòng (`requestFoc` chỉ gọi ở `CheckInPage.tsx`) → luồng A1 của QC "FOC có duyệt" chưa làm được trên giao diện | Accepted một phần → **S4-25*** | Một phần |
| US-007 | AC2 FDL duyệt bằng mật khẩu; dòng phát sinh + FOC âm | E2E TC-NT-028; FE refund.test (duyệt FOC bằng mật khẩu đăng nhập) | Accepted | ↑ |
| US-007 | AC3 vượt hạn mức → `escalated` | E2E TC-NT-029 (BUG-R2-046 Closed) | Accepted | ↑ |
| US-007 | AC4 tự duyệt bị chặn, mật khẩu sai | E2E TC-NT-030 | Accepted | ↑ |
| US-007 | AC5 FOC chờ → chặn trả phòng | E2E TC-NT-031, TC-L4-056 | Accepted | ↑ |
| US-007 | AC6 FD tự áp FOC minibar trong hạn mức | API: E2E TC-NT-032 đạt. **Desk chưa có nút tự áp** ở bước 1 trả phòng. Báo cáo đóng ca: R3 (US-124). Cảnh báo BR-435: US-012 AC8 (S4) | Accepted một phần → **S4-25*** | ↑ |
| US-135 | AC1 hành động S3 (hoàn tất trả phòng, xóa sớm ảnh) | E2E-UI TC-L4-053 (E) H16 + FE checkout.test (hộp hậu quả); TC-L3-072 (E). Còn: phiếu sửa `done` (S4, EP08); đóng/mở bán kênh (R3, channel manager); gộp hồ sơ (US-074, Should R3) | Accepted một phần → S4 (phiếu sửa) | Một phần |
| US-135 | AC3 bàn phím, trình đọc màn hình | axe 45 lần quét H01–H18, 0 vi phạm (ĐK-S2-4 đạt). Kiểm tay VoiceOver: UXR làm trên staging | Accepted một phần → staging | ↑ |
| US-142 | AC2 thiết bị chưa cấp → từ chối + nhật ký | E2E TC-RB-022, TC-SEC-010 (7 endpoint → `403 DEVICE_NOT_TRUSTED`); E2E-UI TC-X-040 H14 máy chưa cấp | Accepted | **Accepted** (lên) |
| US-142 | AC3 trực đêm trên máy được cấp | E2E TC-L3-008 (a) nhận phòng 01:30 trên máy quầy được cấp; cổng thiết bị không phụ thuộc giờ (TC-SEC-010). TC-SEC-015 chưa viết | Accepted (QA thêm ca – S4-33*) | ↑ |
| US-018 | Câu báo UI khi lưu đồng thời (ĐK-S2-3) | BUG-R2-026 Closed: `ui/s3-retest.spec.ts`, TC-L2-021 (E); FE s3-fix | Accepted | **Accepted** (lên) |
| US-018 | AC4 B13, B14 | B13: E2E TC-L4-005 (P+A). B14: TT frontdesk-s3-fixes "fix round 5 (B)" (căn mới không trống đủ đêm → `409 ROOM_UNAVAILABLE` trước khi lưu); FE change-room.test | Accepted | ↑ |
| US-020 | AC2 "Trả phòng" / "Xem bill" | "Trả phòng" khi ngày đi = hôm nay: `allowed-actions.ts:94`, nút ở drawer H11/H15. Đơn `checked_out`: không còn nút đổi, folio hiện trong drawer; **không có "Xem bill"** (mở lại bill đã chốt có số bill để in lại) | Accepted một phần → **S4-29*** | Một phần |
| US-020 | Xem folio đầy đủ trên chi tiết đơn | Drawer H11/H15: tiền phòng, dòng phát sinh (chip chờ duyệt), đã thu, còn phải thu, nút yêu cầu hoàn khi thừa (`ReservationDrawer.tsx:499–575`); E2E-UI TC-L3-001 (E) quét H15 | Accepted | ↑ |
| US-021 | AC4 chi tiền hoàn | E2E TC-L4-062 (tách nhiệm: `SELF_APPROVAL_FORBIDDEN`, `SELF_REFUND_FORBIDDEN`, chi vượt số duyệt bị chặn); FE refund.test + màn Tiền; OTA tiền phạt TC-L2-083. Quy tắc mới áp S4: S4-06 (D), S4-08 | Accepted | **Accepted** (lên) |
| US-021 | AC5 dời ngày (N-2) | E2E TC-L2-055 | Accepted | ↑ |
| US-021 | AC6 đơn `in_house` không có Hủy | Code: `allowed-actions.ts:87–98` (`in_house` không có `cancel`), cơ chế chuyển sai bị từ chối đã test (TC-L2-042). TC-L2-056 chưa viết | Accepted (QA thêm ca – S4-33*) | ↑ |
| US-024 | AC1 FE đổi căn/ngày, `swapRoom`, `updateReservation` | FE dời căn/ngày (reservation.test: 409 nêu đơn đang chiếm + căn trống, 412 giữ dữ liệu); `updateReservation` (sửa số khách ở H13/H15). **`swapRoom` (đổi chéo 2 đơn) chưa có trên Desk**: không thuộc chữ AC, PO xếp S4 nếu kịp, không thì R3. Phụ thu người khi đổi sang căn khác định mức: S4-07 | Accepted | Một phần |
| US-024 | AC2 B14 giá theo lý do | TT `frontdesk.test.ts` B14: `property_fault` giữ giá; `guest_request` xem trước `folioDeltaVnd > 0`; OTA chênh lệch theo đêm (TT fix round 4 (2)). So với căn gốc khi đổi nhiều lần: S4-05; xem trước khi FOC > giá mới: S4-04 | Accepted | ↑ |
| US-024 | AC3 sau đổi phòng: căn cũ cần dọn, khai báo không khai lại | TT: căn cũ `VD`, việc `checkout_clean`; Code: `registration.port.ts:39` (BR-424 – không đổi khai báo). Mã cửa: R3 | Accepted | ↑ |
| US-024 | AC4 B14 cần căn `VI`/`VC`; thiếu lý do/OOO → chặn | Lý do bắt buộc, OOO: đạt từ S2. **Nhánh B14 căn chưa sạch** → `ROOM_NOT_READY`: có ở code (`stay.service.ts:782`) + câu báo FE, **chưa có ca chạy**. Lựa chọn "chỉ chuyển tới hết đơn gốc": S4-09 | Accepted một phần → **S4-33*** | ↑ |
| US-082 | AC2 gắn TC-L5-020 | E2E TC-L5-020 (A) | Accepted | Accepted (giữ) |
| US-083 | AC2 tiếng Nga (trả lại ở S2, PO-S2-01) | E2E TC-L5-016 (en, ru) – BUG-R2-027 Closed | Accepted | **Accepted** (lên) |
| US-084 | AC4 VietQR cọc (S2 chuyển sang US-120) | Số tiền cọc + nội dung chuyển khoản theo mã đơn có (H12 `pay.qr_note`). API QR cọc có (`createVietQr` cho đơn `hold`, TT `payments-s3.test.ts:503`). **Phát hiện PO-S3-04:** H12/H11 không vẽ mã QR cọc, trong khi H12 ghi "Mã QR có nội dung là mã đơn, tạo ngay sau khi giữ chỗ" (`sale.qr_after`). Luồng A1 "VietQR cọc" chưa làm được trên giao diện | Accepted một phần → **S4-28*** | **Một phần** (hạ từ Đạt) |
| US-086 | AC4 ảnh biên nhận | CTV "Báo đã chuyển cọc" đạt từ S2 (TC-L5-034). Ảnh: API có (`attachmentId`, tải `deposit_receipt` cho CTV/SAL – TT files-attachments); **Desk chưa có ô ảnh** (`ReservationDialogs.tsx:1240`) | Accepted một phần → **S4-30*** | Một phần (AC3 R3) |
| US-086 | AC5 đối soát ESC-017 A | E2E TC-L5-052, TC-L4-069, TC-L5-035 | Accepted | ↑ |
| US-087 | AC3 kiểm với khách có giấy tờ | E2E TC-RB-001 (CTV, khách có giấy tờ C3) | Accepted | Accepted (giữ) |
| US-139 | AC3 chặn nhận phòng khi chưa gán căn | Code: `checkin.service.ts:326` (`conflict_state = open` → `409 RESERVATION_UNASSIGNED`), `allowed-actions.ts:64` (ẩn "Nhận phòng"). **Không có ca test nào kiểm điều này** (TC-L2-026 chưa viết) | Accepted một phần → **S4-33*** | Một phần |
| US-017 | Ghi chú: viết lại TC-L2-079 (a) | E2E TC-L2-079 (a1)(a2)(a3) | Xong | – |
| N-5 | Giao diện các story S1/S2: E2E UI + axe | ĐK-S2-4 đạt: E2E-UI chạy trong CI (desk-chromium, desk-clock, H18), axe 0 vi phạm. Còn staging | Chờ staging | – |

## 4. Phần dời

### 4.1 Khớp `s4-carryover.md`
| Mã S4 | Story/AC bị ảnh hưởng | Ghi chú PO |
|---|---|---|
| S4-10 (BUG-R2-038) | US-025 AC3 | Một phần |
| S4-11 (BUG-R2-033 a/b) | US-043 AC3; gộp S4-32* (US-048 AC3) | Một phần |
| S4-12 (BUG-R2-054) | US-049 (hiển thị H14) | Không thuộc AC, story Accepted |
| S4-01, 02, 03, 13, 18, 22, 23 (FOC theo dòng mới, duyệt FOC) | US-007, US-024, US-037 (ca biên) | Đường thường đạt; ca biên đã có kiểm chứng đối kháng |
| S4-04, 05, 09 (B14) | US-024 AC2/AC4 | Ghi chú |
| S4-06, 08 (hoàn tiền khi hủy) | US-021 AC4, US-136 | Quy tắc DOM 17/10 "áp S4" |
| S4-07 (phụ thu người khi B7 đổi định mức) | US-024 AC1, US-022 | Quy tắc BR-429 bổ sung "áp S4" |
| S4-21 (B7 đổi căn đắt hơn giữ giá cũ) | US-024 AC1 | **Chính sách giá → ESC-019** (mục 5) |
| S4-15, 17 (upload sau Caddy thật) | US-043, US-107 | Làm khi có staging |
| S4-24 (QA) | TC-L3-011 retry, TC-L3-013 | – |

### 4.2 Đề nghị ORC thêm vào `s4-carryover.md` (chưa có; PO đánh số tiếp theo, ORC có thể đổi)
| Mã đề nghị | Hạng mục | Mức (PO) | Vai | Story/AC |
|---|---|---|---|---|
| S4-25* | Desk xin FOC ngoài bước nhận phòng: phụ thu trả muộn (H15 hộp trả muộn, H16 bước 2), dòng phát sinh, FD tự áp FOC minibar trong hạn mức ở bước 1. API `requestFoc` có | Must R2 – **cần cho QC A1** | FE (+UXD nếu thiếu hi-fi) | US-007 AC1, AC6; US-036 |
| S4-26* | H16: điều khiển "Ghi công nợ" (hạn thanh toán + lý do) chỉ cho MGR/OWN. API có (TC-L4-055) | Must R2 | FE | US-038 AC3 |
| S4-27* | Desk: điều chỉnh dòng folio (FD sửa số lượng dòng phát sinh; MGR/OWN bút toán điều chỉnh sau `settled`) và "Đảo giao dịch thu" có lý do cho MGR/OWN. API `adjustFolioLine`, `reversePayment` có | Must R2 | FE | US-006 AC1, US-032 AC1, US-038 AC2, US-119 AC3 |
| S4-28* | Vẽ mã VietQR cọc cho đơn giữ chỗ (H12 sau khi giữ chỗ, hộp Xác nhận cọc H11) bằng `createVietQr` (`purpose=deposit`). Nếu chưa kịp thì sửa chuỗi `sale.qr_after` để không hứa QR. PO-S3-04 – đề nghị QA ghi lỗi P3 cho câu chữ sai | Must R2 – **cần cho QC A1** | FE | US-084 AC4, US-120 |
| S4-29* | "Xem bill" cho đơn `checked_out`: mở lại bill đã chốt (số bill, song ngữ, in lại) | Must R2 | FE | US-020 AC2 |
| S4-30* | Ô ảnh biên nhận khi CTV "Báo đã chuyển cọc" (`attachmentId`) | Must R2 | FE | US-086 AC4 |
| S4-31* | Thẻ "khách trả phòng hôm nay" trên màn Hôm nay: trạng thái theo mốc BR-425, báo đỏ FD/MGR, "đã trả lời", xếp đầu khi có khách đến (cùng US-011 `getArrivalsDepartures`). Kiểm việc dọn sinh từ lưu trú khi có `listHkTasks`: gia hạn đổi tên việc, trả muộn "dọn sau giờ", trả phòng "Dọn trả phòng" + "Bổ sung minibar" | Must R2 | BE-A, FE, QA | US-028 AC4, US-029 AC4, US-030 AC2, US-031, US-038 AC1 |
| S4-32* | `guest.id_doc_last4` không được ghi → hồ sơ CRM không hiện 4 ký tự cuối. Gộp S4-11 (cùng chỉ mục giấy tờ trên hồ sơ; SEC chốt điều kiện ghi như `id_doc_hmac` 0.3.7). PO-S3-07 – đề nghị QA ghi P3 | Must R2 | BE-C, BE-B, SEC | US-048 AC3 |
| S4-33* | QA bổ sung ca còn thiếu: TC-L2-026 (US-139 AC3); nhánh B14 `ROOM_NOT_READY` (US-024 AC4); TC-L2-060…062 E2E (US-022 – hiện chỉ có TT); TC-L2-056 (US-021 AC6); TC-SEC-015 (US-142 AC3); TC-RB-008/009 (US-048); chạy lại H13 trước 06:00 (US-025 AC6) | Không chặn cổng | QA | như cột trước |

Quyết định phạm vi trong round của PO (ghi decision-log 17/10):
- **US-066** (danh mục mặt hàng minibar, Must R2) chưa thuộc sprint nào: QA đang bỏ qua TC-L4-070/071. PO xếp vào **Sprint 4**. Minibar khi trả phòng ở S3 đang dùng danh mục seed.
- **US-137** (trả phòng sớm, Should R2): API + test đã có (TC-L4-025, TC-L4-092, TT B16), Desk chưa có màn. Làm ở S4 nếu kịp, không thì R3 (plan R2 mục 2.1: Should không ảnh hưởng QC).
- **`swapRoom` trên Desk** (đổi chéo 2 đơn): S4 nếu kịp, không thì R3. Lễ tân vẫn đổi được bằng 2 lần dời căn.

### 4.3 Phần dời sang R3
Không có phần Must R2 nào mới dời sang R3. Các phần R3 nêu trong file này đều đã có từ trước:
- mã cửa (US-128), folio trên app khách (US-111), xác minh nhẹ (US-141), HĐ dài hạn (US-081, US-086 AC3, US-119 AC5): theo R-C, INV quyết ESC-012;
- nhắc trả phòng tự động (US-034, Should R3), đóng ca (US-124), quét QR CCCD/MRZ (US-051), gộp hồ sơ (US-074), channel manager thật;
- nâng toolchain FE (S4-16, ORC quyết thay INV).

## 5. Phạm vi R2 và ESC

- **Phạm vi R2 không đổi.** Mọi phần dời của Sprint 3 vẫn trong Round 2 (Sprint 4) → **không cần ESC phạm vi**.
- **Rủi ro tải Sprint 4.** S4-25*…S4-30* là 6 việc giao diện Desk cho Must R2, cộng EP07/EP08/EP01/EP14 vốn của S4 và 24 mục `s4-carryover`. Nếu ORC thấy S4 không đủ sức:
  - PO đề xuất thứ tự: S4-28* và S4-25* trước (cần cho luồng A1 của QC), rồi S4-26*, S4-27*, S4-29*, S4-30*.
  - Nếu phải đẩy phần Must nào sang R3 thì đó là đổi phạm vi → PO lập ESC lúc đó.
- **ESC mới: ESC-019 – Giá khi khách tự xin đổi sang căn khác trước ngày đến (S4-21).** Đây là chính sách giá, phải hỏi INV. Mức khẩn Bình thường, gom tổng kết Round 2.
  - Đội đề xuất A: tính theo lịch giá của căn mới như khi đổi phòng lúc đang ở (BR-424).
  - Chưa quyết thì app giữ cách hiện tại (BR-429 giữ giá cũ) và lễ tân báo quản lý trước khi đổi sang căn đắt hơn.
  - Không chặn việc nào của Sprint 4.

## 6. Trả lời các ô đang chờ PO

| Nơi | Câu hỏi | PO trả lời |
|---|---|---|
| `demo-1-limits.md` mục B – "Nút 'Gửi link check-in online' trên Desk – `[PO xếp lịch – điền sau]`" | – | **Đã có** từ `c52d149` (drawer chi tiết đơn H11/H15 "Gửi link check-in": link hiện 1 lần, sao chép + QR, thu hồi). Dòng này bỏ khỏi mục B |
| `demo-1-limits.md` mục B – "Trả phòng sớm, ghi công nợ…, quét QR CCCD…, xin miễn phí trên từng dòng phát sinh – Round 3 `[PO xác nhận]`" | – | Tách 4 ý:<br>• **Ghi công nợ** và **xin miễn phí trên dòng phát sinh/trả muộn/minibar** là Must R2 → **Sprint 4** (S4-26*, S4-25*), không phải R3.<br>• **Trả phòng sớm** (Should) → Sprint 4 nếu kịp, không thì R3.<br>• **Quét QR CCCD/MRZ** → R3 (US-051) |
| `qa/s3-kickoff.md` Q-QA-S3-01 – màn Sale của người FD+SAL lọc "của mình" bằng gì | – | Quyền là hợp hai vai: thấy mọi báo giá là **đúng** (US-002 AC3, rbac quy tắc 2), API không cần tham số phạm vi. Bộ lọc "Của tôi" bật sẵn trên màn Báo giá là tiện ích, không phải ràng buộc quyền. UXD/FE thêm nếu rẻ (Could, S4/R3), không chặn nghiệm thu |

ORC chuyển các câu trả lời mục B vào `demo-1-limits.md` (file của UXR/ORC, PO không sửa trực tiếp).

## 7. Việc giao lại để hoàn tất nghiệm thu (PO đề nghị, ORC giao)

| # | Việc | Vai | Hạn |
|---|---|---|---|
| N3-1 | Thêm S4-25*…S4-33* vào `s4-carryover.md` (hoặc đổi số), cập nhật `demo-1-limits.md` mục B, C theo mục 6 | ORC | Trước cổng QC S3 |
| N3-2 | Ghi PO-S3-04 (chuỗi `sale.qr_after` hứa QR không có) và PO-S3-07 (`guest.id_doc_last4` không được ghi) vào bug-list, đề nghị **P3** | QA | 17/10 |
| N3-3 | Viết ca S4-33* | QA | Sprint 4 |
| N3-4 | Trình ESC-019 trong tổng kết Round 2 | ORC | Cuối R2 |
| N3-5 | Khi có staging: PO kiểm lại giao diện mọi story Accepted (P-R2-7); UXR kiểm tay VoiceOver (US-135 AC3) và check-in online trên điện thoại thật (US-107); OPS/QA làm S4-15 | PO, UXR, QA, OPS | Staging |
