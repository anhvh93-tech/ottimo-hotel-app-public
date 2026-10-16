# Nghiệm thu của PO – Round 2, Sprint 1 + Sprint 2

- Người nghiệm thu: PO | Ngày: 16/10/2026 (khởi động Sprint 3) | Điều kiện QC: **ĐK-S2-5** (`rounds/round-02/qc/s2-qc-gate.md`)
- **Nghiệm thu trên stack tạm (CI compose), chờ staging.** Chưa có VPS/tên miền (ESC-002/010). Mọi kết luận "Đạt" dưới đây là **"Đạt (stack tạm)"**. Theo P-R2-7, story chỉ chuyển "Xong" sau khi PO nghiệm thu lại trên staging. Lúc đó PO kiểm lại bằng tay phần giao diện của từng story trên staging.
- Bản được nghiệm thu: `main` @ `cfcf6d8` = CI run **38911271416** (6/6 job xanh; E2E 783 đạt / 0 trượt / 193 bỏ qua; số liệu do QC đọc log, `s2-qc-gate.md` K1). Đối chiếu thêm: `rounds/round-02/qa/s2-retest.md` (2 lượt sạch liên tiếp, 781/0/194, 0 flaky), `rounds/round-02/qa/s1-test-report.md` (Sprint 1, có 11 ca UI chạy tay với API thật), báo cáo BE/FE Sprint 2, `qa/bug-list.md`.
- PO không chạy lại stack. PO đọc báo cáo, file spec E2E (`product/tests/e2e/**`: ca nào có, ca nào còn `skip`/`fixme`) và đối chiếu từng AC với `product/docs/qa/traceability.md`.

## 0. Cách đọc

| Ký hiệu bằng chứng | Nghĩa |
|---|---|
| **E2E** | Ca Playwright tầng API chạy thật trên stack compose sạch ở CI 38911271416 (hoặc project `clock` dùng MutableClock) |
| **RBAC** | Runner quyền sinh từ spec (`rbac-sprint1/2.spec.ts`; Sprint 2: 363 ca đạt; tổng 660 ca đạt) |
| **TT** | Test tích hợp/đơn vị của BE hoặc FE (chạy trong job `test` của CI), không phải E2E |
| **Tay S1** | QA chạy tay bằng trình duyệt với API thật ở Sprint 1 (`s1-test-report.md` mục 2) |
| **UI chưa** | Chưa có E2E bằng trình duyệt: 18 ca `desk-chromium` đang bỏ qua, chờ ĐK-S2-4 |

| Kết quả AC | Nghĩa |
|---|---|
| **Đạt** | Đúng AC ở phần R2, có bằng chứng chạy thật |
| **Đạt một phần** | Một phần đạt; phần còn lại ghi rõ sprint đích |
| **Dời → S3/S4/R3** | Chưa làm, đã ghi vào backlog |
| **Thiếu bằng chứng** | Có thể đã làm nhưng chưa có ca chạy thật; QA bổ sung (mục 4) |
| **Trả lại** | Chạy sai AC, cần sửa |

Kết quả cấp story (cột Trạng thái của backlog):
- **Đạt (stack tạm)**: mọi AC phần R2 đạt; khi có staging chỉ còn kiểm lại giao diện.
- **Đang nghiệm thu**: còn AC đạt một phần, dời trong R2, thiếu bằng chứng hoặc bị trả lại.
- **Dời**: chưa làm phần nào.

## 1. Tổng hợp

| Nhóm | Số story | Đạt (stack tạm) | Đang nghiệm thu | Chưa làm (dời S3) |
|---|--:|--:|--:|--:|
| Sprint 1 (EP00 + CRM) | 12 | 4: US-001, 071, 072, 073 | 8: US-002, 003, 004, 005, 006, 007, 135, 142 | 0 |
| Sprint 2 (EP02 + EP11 + US-139) | 18 | 6: US-017, 023, 080, 082, 084, 087 | 11: US-016, 018, 019, 020, 021, 024, 083, 085, 086, 136, 139 | 1: US-022 |
| **Cộng** | **30** | **10** | **19** | **1** |

Không story nào bị trả lại toàn bộ. Có **1 AC bị trả lại**: US-083 AC2, văn bản báo giá tiếng Nga đang ra tiếng Anh (mục 3, phát hiện PO-S2-01).

Phần dời đều nằm trong R2 (Sprint 3 hoặc 4), không có phần nào dời sang R3. Vì vậy **không đổi phạm vi round, không cần ESC**.

## 2. Sprint 1 (12 story)

### US-001 Đăng nhập – **Đạt (stack tạm)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 vào "Hôm nay", tên trên đầu trang | Tay S1: TC-NT-001 (E). E2E: TC-NT-001 (A), TC-SEC-020. UI chưa | Đạt |
| AC2 chưa đăng nhập → về trang đăng nhập, API không trả dữ liệu | E2E TC-NT-002 (A); Tay S1: 3 URL sâu | Đạt |
| AC3 nhật ký ghi đúng người tạo/sửa đơn | E2E TC-L2-052 (nhật ký ghi người hủy + lý do), `reservation.closer_changed` (QC K4). TC-NT-004 chưa có ca riêng | Đạt (QA thêm TC-NT-004 – mục 4) |
| AC4 tài khoản 8 vai bằng seed, buộc đổi mật khẩu lần đầu | E2E TC-NT-037; seed DS-E 13 user | Đạt |

### US-002 Gán vai – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 đổi vai → menu theo vai | E2E TC-NT-007, TC-SEC-022, TC-SEC-025 (đổi vai → mọi phiên 401); Tay S1 TC-NT-006 × 8 vai. UI chưa | Đạt |
| AC2 HK gọi API tạo đơn → từ chối + nhật ký | E2E TC-NT-008 (thứ tự kiểm, `access.denied`); BUG-R2-005 Closed | Đạt |
| AC3 hai vai = hợp quyền | Chưa có ca chạy (TC-NT-009, TC-RB-024…027 không có trong E2E) | **Thiếu bằng chứng** |
| AC4 MGR mở S26/A100 → từ chối | E2E TC-NT-010 (A); BUG-R2-010 (P3, hiển thị) Fixed, chờ UI | Đạt |

### US-003 Ẩn dữ liệu nhạy cảm – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 SAL/CTV không thấy giấy tờ | E2E TC-L5-042 (hồ sơ khách không có trường giấy tờ), serializer theo vai (RBAC `getGuest`). TC-RB-001/002 cần khách có giấy tờ C3 | Đạt một phần → kiểm đủ ở **S3** (giấy tờ C3) |
| AC2 HK không thấy giá vốn minibar/kho | Chưa có minibar/kho | Dời → **S4** (cùng màn minibar/HK) |
| AC3 SAL/CTV/HK bị từ chối P&L, báo cáo kênh | R2 chưa có S20/S21; RBAC từ chối theo spec | Đạt một phần (R2 chỉ kiểm từ chối) – kiểm khi có màn ở R3 |
| AC4 FD không thấy doanh thu/ADR trên Tổng quan | Tổng quan chưa làm | Dời → **S4** |

### US-004 Danh mục căn – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 đổi giá niêm yết → giá mới cho đơn sau, đơn cũ giữ snapshot | TC-NT-018 vẫn `skip` "chờ Sprint 2" trong khi endpoint đã có. Tay S1: H04 giá BR-101 đúng (101 → 667.000) | **Thiếu bằng chứng** (phần snapshot) |
| AC2 căn "ngừng bán" không có trong danh sách chọn, rack có nhãn | TC-NT-019 vẫn `skip`. FE H09 có chip "Ngừng bán" (TT) | **Thiếu bằng chứng** |
| AC3 vượt sức chứa → chặn tại ô | E2E TC-L2-081 (Trực tiếp → `CAPACITY_EXCEEDED`), TC-L5-005 (báo giá); TC-NT-040 (e) | Đạt. Lưu ý: hạ sức chứa xuống dưới số khách của đơn tương lai vẫn lưu được (QC-S2-01, ĐK-S2-2) |

### US-005 Tham số quy tắc – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 đổi hạn giữ chỗ mặc định → giữ chỗ sau dùng mức mới, cũ giữ hạn | TC-NT-011 vẫn `skip` "chờ Sprint 2"; TC-NT-012 (chặn giá trị ngoài danh sách) đạt | **Thiếu bằng chứng** (phần áp cho giữ chỗ) |
| AC2 MGR sửa vận hành được, sửa FOC/hoa hồng bị từ chối; FDL chỉ xem | E2E TC-NT-013, TC-NT-014; RBAC `setParameter` | Đạt |
| AC3 nhật ký cũ/mới/người/thời điểm/ngày hiệu lực | E2E TC-NT-015, TC-NT-041, TC-SEC-028 | Đạt |
| ESC-015 A (ngày đặc biệt) | Dữ liệu tham số, không thêm AC (mục 5) | Chờ DOM/BE cập nhật seed `special_dates` |

### US-006 Nhật ký thao tác tiền – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 thêm/điều chỉnh dòng folio → nhật ký, không xóa | `recordMoney` ở folio/cọc/hủy (QC K4); `addFolioLine`/`adjustFolioLine` chưa có; TC-NT-016 `skip` | Đạt một phần → **S3** (thêm/điều chỉnh dòng folio) |
| AC2 owner lọc nhật ký; FD chỉ thấy của mình | E2E TC-NT-017 (2)(3); (1) chờ thao tác tiền | Đạt một phần → kiểm (1) ở **S3** |

### US-007 Phê duyệt FOC – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1–AC6 | E2E TC-NT-027 (FD chỉ thấy yêu cầu của mình, 404); TT: `SELF_APPROVAL_FORBIDDEN`. TC-NT-028…036 `skip` (chờ `requestFoc` + folio + trả phòng) | Đạt một phần (nền duyệt) → AC1–AC6 nghiệm thu đủ ở **S3** (folio, trả phòng) |

### US-071 Hồ sơ khách – **Đạt (stack tạm)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 thiếu tên hoặc thiếu cả SĐT lẫn email → không lưu | E2E TC-L5-040 | Đạt |
| AC2 sai dạng → lỗi tại ô; chuẩn hóa BR-951 | E2E TC-L5-041 | Đạt |
| AC3 không có ô nhập tay số giấy tờ | E2E TC-L5-042; Tay S1 H06 | Đạt |

### US-072 Chặn trùng – **Đạt (stack tạm)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 SĐT "+84…" trùng → chặn + "Mở hồ sơ đó" | E2E TC-L5-043; Tay S1 H06 | Đạt |
| AC2 tên gần giống + ngày sinh → chỉ cảnh báo | E2E TC-L5-044; BUG-R2-008 (SAL/CTV) Closed | Đạt |

### US-073 Bộ chọn khách – **Đạt (stack tạm)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 tìm không dấu | E2E TC-L5-045; Tay S1 | Đạt |
| AC2 tạo nhanh SĐT trùng → "Dùng hồ sơ này" | E2E TC-L5-046 | Đạt |
| AC3 SAL/CTV chỉ thấy khách của mình | E2E TC-RB-010; RBAC `searchGuests` phạm vi M | Đạt |

### US-135 Xác nhận hành động không đảo ngược – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 hộp xác nhận nêu hậu quả | FE: hộp hủy đơn dùng `dryRun` nêu căn, ngày mở bán, tiền giữ/hoàn (FB-R2-UXD-FE-S2-01, TT); server từ chối `dryRun` ở thao tác ghi (E2E TC-L5-051). Còn trả phòng, mở/đóng kênh, xóa ảnh, phiếu sửa (S3–S4) | Đạt một phần (hủy, no-show) – UI chưa |
| AC2 Hủy/Esc → không đổi dữ liệu | TT (FE) | Đạt một phần – UI chưa |
| AC3 bàn phím, trình đọc màn hình | Chưa chạy axe/VoiceOver | **Thiếu bằng chứng** (ĐK-S2-4) |

### US-142 Thiết bị được cấp – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 owner cấp/thu hồi, danh sách có tên/người cấp/ngày | RBAC `listTrustedDevices/trustCurrentDevice/revokeTrustedDevice`; Tay S1 H07; BUG-R2-005 Closed | Đạt |
| AC2 thiết bị chưa cấp → từ chối mở giấy tờ C3 + nhật ký C3 | TC-SEC-010 `skip` (chưa có giấy tờ C3) | Dời → **S3** |
| AC3 trực đêm trên thiết bị đã cấp nhận phòng + khai báo đủ | Chưa có nhận phòng | Dời → **S3** |

## 3. Sprint 2 (18 story)

### US-016 Room rack – **Đang nghiệm thu** (story giao diện)
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 10 căn × 14 ngày, đánh dấu hôm nay | `getRack` 0.3.5 (E2E qua các ca rack), FE H08 (TT). TC-L2-001 (E) `skip` | Đạt một phần – UI chưa |
| AC2 phân biệt loại thanh bằng màu + chữ | `RackBar` có loại/cờ; FE TT. TC-L2-002 (E) `skip`; axe chưa chạy | Đạt một phần – UI chưa |
| AC3 bấm thanh (chuột/bàn phím) → chi tiết | FE drawer H11 (focus, Esc – TT) | Đạt một phần – UI chưa |
| AC4 HK/MT không thấy tên/kênh/giá; SAL/CTV chỉ thấy còn/hết | RBAC + serializer; `conflicts[]` ẩn mã/tên (TC-L6-041) | Đạt |

### US-017 Tạo đơn – **Đạt (stack tạm)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 đơn Booking `confirmed`, khai báo `none`, lệnh đồng bộ | E2E TC-L2-010 | Đạt |
| AC2 Trực tiếp/CTV thiếu SĐT → chặn | E2E TC-L2-011 | Đạt |
| AC3 giá mặc định theo lịch, 0/trống lỗi, sàn–trần (OTA chỉ cảnh báo) | E2E TC-L2-012 (b), TC-L2-013, TC-L2-082; BUG-R2-017/018 Closed | Đạt |
| AC4 cửa sổ bán sau 31/12/2026 | E2E TC-L2-014 | Đạt |
| AC5 đạt ngưỡng HĐ → không lưu ngắn ngày | E2E TC-L2-015 | Đạt |
| AC5a đơn dài hạn nhập tay | E2E TC-L2-076, 077, 078; FE H10. TC-L2-076 (E) `fixme` | Đạt – UI chưa |
| AC6 SAL/CTV không có màn đặt phòng | E2E TC-L2-016; RBAC | Đạt |
| AC7 phụ thu thêm người (OTA không cộng) | E2E TC-L2-081, TC-L2-019 (phần folio) | Đạt |
| AC8 danh sách kênh + "Nguồn" bắt buộc với Trực tiếp + ô email | TT `listChannels` (BE-B), FE H09 `directSource`. TC-L2-006 chưa có ca E2E | Đạt (TT) – UI chưa |
| AC9 người chốt bắt buộc với CTV và `sales_staff` | E2E TC-L2-080 (BUG-R2-023 Closed ở CI 38911271416). FE: ô người chốt kênh CTV đã có; nhãn cho sale nội bộ chờ UXD | Đạt – UI chưa |

Ghi chú: ca bổ sung TC-L2-079 (a) (đêm lẻ BR-113 a) vẫn `fixme`. Ca này không thuộc AC nào, nhưng QA cần viết lại ở S3 (mục 4).

### US-018 Chống đặt trùng – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 trùng → chặn, nêu khoảng ngày | E2E TC-L2-020 | Đạt |
| AC2 hai người lưu đồng thời → 1 thành công, người kia "Căn vừa được đặt" | E2E TC-L2-021 (8 × 20 vòng), TC-X-001 (50 → 1 × 201); EXCLUDE ở PostgreSQL (QC K3). **Giao diện:** bên thua nhận `CONCURRENT_UPDATE` thì thấy "Máy chủ đang gặp sự cố" (QC-S2-02) | Đạt một phần – câu báo trên UI sai → **S3 tuần 1** (ĐK-S2-3) |
| AC3 ngày đi = ngày đến không trùng | E2E TC-L2-022 | Đạt |
| AC4 cùng quy tắc ở mọi luồng | E2E TC-L2-023, TC-X-002 (giữ chỗ, cọc, đổi căn B7, OOO, khôi phục no-show). Gia hạn B13 và đổi phòng B14 chưa có | Đạt một phần → B13/B14 kiểm ở **S3** |
| AC5 đơn OTA trùng không chặn, gợi ý căn | E2E TC-L2-024, TC-L2-027 | Đạt |

### US-019 Phòng khóa chặn bán – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 khối OOO chặn đơn/giữ chỗ/báo giá | E2E TC-L2-030, TC-L6-044 (clock) | Đạt |
| AC2 rack hiện "Khóa phòng"; phòng trống/đêm khả dụng không tính căn khóa | E2E TC-L2-031 (rack + `searchAvailability`); Tổng quan và đêm khả dụng (BR-904) chưa có | Đạt một phần → phần Tổng quan/KPI ở **S4** |
| Phần dời | **Màn tạo/sửa khối OOO** (S4 Bảo trì). Tới S4, khối OOO chỉ tạo được qua API/seed, lễ tân chưa tự khóa phòng trên web | **S4** |

### US-020 Chi tiết đơn – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 đơn `hold`: tiến trình + nút hợp lệ theo vai | E2E TC-L2-040; `allowedActions`; FE drawer H11 | Đạt – UI chưa |
| AC2 `in_house` có "Trả phòng"; `checked_out` chỉ "Xem bill"; khôi phục no-show theo vai | Chưa có nhận/trả phòng, bill. Nút khôi phục no-show có (TC-L2-074/075) | Đạt một phần → **S3** |
| AC3 CTV mở đơn người khác bị từ chối; đơn mình chỉ thấy tổng phòng + cọc | RBAC phạm vi M (404), serializer `getFolio` CTV chỉ `roomVnd` + `depositHeldVnd` (TT) | Đạt |
| AC4 chuyển không hợp lệ bị từ chối | E2E TC-L2-042 | Đạt |
| Phần dời | **Xem folio đầy đủ** (dòng phát sinh, giao dịch thu) trên chi tiết đơn | **S3** (cùng folio/bill) |

### US-021 Hủy đơn – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 thiếu lý do → không lưu | E2E TC-L2-050 | Đạt |
| AC2 hộp xác nhận nêu căn, ngày mở bán, khoản giữ/hoàn | E2E TC-L2-051 (`dryRun` xem trước); FE TT | Đạt – UI chưa |
| AC3 hủy → mở phòng, đồng bộ, khai báo/hoa hồng `void`, nhật ký | E2E TC-L2-052, TC-X-010 | Đạt |
| AC4 phí hủy/hoàn BR-309, hoàn cần duyệt; OTA nhập tiền phạt | E2E TC-L2-053 (a)(b): đảo dòng phòng + 1 dòng phí 350.000, khoản hoàn chờ duyệt. FE có ô "Tiền phạt theo kênh". **Chi tiền hoàn** (`refund`) chưa có | Đạt một phần → chi hoàn ở **S3** |
| AC5 MGR "Dời ngày" một lần giữ cọc; FD không có | API B8 có (BE-A); TC-L2-055 chưa có ca E2E | **Thiếu bằng chứng** |
| AC6 đơn `in_house` không có nút Hủy | Chưa có nhận phòng | Kiểm ở **S3** |

### US-022 Người đi cùng – **Dời (chưa làm) → Sprint 3**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1–AC4 | Chưa có `listParty/addPartyMember/removePartyMember` (cần mã hóa dữ liệu trẻ em C3 – `s2-be-a.md` mục 8); FE chưa có màn | Dời → **S3** (cùng giấy tờ/khai báo). Vẫn Must R2 |

### US-023 Mã duy nhất – **Đạt (stack tạm)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 mã do server cấp, liên tục, không trùng, không dùng lại | `DocNumberService` (TT); seed 7/7 mã khớp; TC-X-001 tạo song song không trùng mã. Bill, phiếu sửa, yêu cầu app khách kiểm khi có (S3–S4) | Đạt phần đã có |
| AC2 sửa thông tin không đổi mã KH | E2E TC-NT-038 | Đạt |

### US-024 Đổi căn/ngày/phòng – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 đơn `confirmed` đổi căn/ngày: kiểm trùng, giữ snapshot, OTA không đổi ngày | E2E TC-L2-082 (đổi số đêm, BR-107), TC-L2-023 (B7 trùng); `swapRoom` B7 × 2 (TT). FE chưa có `swapRoom`/`updateReservation` | Đạt một phần (API) → FE ở **S3** |
| AC2 đổi phòng khách đang ở: giá theo lý do (BR-424) | B14 chưa có | Dời → **S3** |
| AC3 sau đổi phòng: căn cũ cần dọn, mã cửa cũ "đã hủy" | B14 chưa có | Dời → **S3** |
| AC4 B14 cần căn sạch; B7 chỉ kiểm trùng/OOO; thiếu lý do → chặn | Phần B7: E2E TC-L2-023 + lý do bắt buộc (`MoveReasonCode`). Phần B14 chưa có | Đạt một phần → B14 ở **S3** |

### US-136 No-show – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 qua mốc gọi khách → FD nhận nhắc | Job J6/J7 + "Cần chú ý" chưa có | Dời → **S4** |
| AC2 đánh dấu no-show: giữ cọc, mở bán, khai báo/hoa hồng `void`; không tự đánh dấu | E2E (clock) TC-L2-071, TC-L2-072; đảo folio. Việc "Báo no-show trên kênh" cho đơn OTA đi cùng "Cần chú ý" | Đạt một phần → việc báo kênh ở **S4** |
| AC3 chưa ghi liên lạc/chưa tới mốc → khóa nút | E2E TC-L2-073 (`REASON_REQUIRED`, `INVALID_TRANSITION` + `availableFrom`) | Đạt |
| AC4 FD tự khôi phục khi đủ điều kiện BR-315 | E2E TC-L2-074 (BR-315-01). Thông báo cho `manager` + dòng đóng ca (BR-526) chưa có | Đạt một phần → thông báo ở **S4**; đóng ca ở R3 (US-124) |
| AC5 thiếu điều kiện → gửi duyệt, MGR duyệt | E2E TC-L2-075 (BR-315-02) | Đạt |

### US-080 Báo giá ngắn ngày – **Đạt (stack tạm)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 tổng khớp BR-107, cọc BR-305, hoa hồng BR-903, không cộng dồn BR-111 | E2E TC-L5-001, TC-L5-002 (oracle) | Đạt |
| AC2 CTV thấy "Sale nhận", không thấy "OTTIMO còn lại" | E2E TC-L5-003 | Đạt |
| AC3 phương án thuê tháng BR-108 | E2E TC-L5-004 | Đạt |
| AC4 vượt sức chứa/ngày qua/ngoài cửa sổ → lỗi; hết phòng → gợi ý | E2E TC-L5-005 | Đạt |
| AC5 phụ thu thêm người BR-110 | E2E TC-L5-006 | Đạt |

### US-082 Kiểm phòng trống khi báo giá – **Đạt (stack tạm)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 chip "Trùng lịch"/"Đang khóa" + căn khác còn trống | TT `sales.test.ts` (US-082); `searchAvailability` gợi ý cùng nhóm/nhóm cao hơn (BUG-R2-020 Closed); FE H09 chip | Đạt – UI chưa |
| AC2 ngày đã qua → báo + khóa tạo giữ chỗ | E2E TC-L5-005 (ngày qua → 422); TC-L5-020 chưa có ca riêng | Đạt (QA gắn TC-L5-020 ở S3) |

### US-083 Lưu và gửi báo giá – **Đang nghiệm thu (trả lại AC2 phần tiếng Nga)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 mã duy nhất, `active`, hạn BR-304, snapshot | E2E (clock) TC-L5-015 (biên 23:59:59/00:00:00); TT `saveQuote` | Đạt |
| AC2 văn bản báo giá đúng ngôn ngữ Anh/Nga, có ngày hết hạn | `getQuoteText` VI/EN đúng (TT). **Tiếng Nga ra tiếng Anh**: `product/services/api/src/generated/quote-copy.ts` có `QUOTE_COPY_MISSING.ru` = 5 khóa (`sale.quote_text`, `sale.quote_text_extra_guest`, `occ.*_short`), `design/copy/strings-ru.json` chưa có các khóa này. TC-L5-016 chưa có ca E2E | **Trả lại** (phần RU) – phát hiện **PO-S2-01** |
| AC3 báo giá `expired` → lập lại hoặc MGR gia hạn; SAL/CTV gửi yêu cầu | E2E TC-L5-017 (clock + s2-fix (d)); `extendQuote` SAL → 202, MGR → 200 | Đạt |

**PO-S2-01 – Văn bản báo giá tiếng Nga đang ra tiếng Anh** (đề nghị QA ghi **P2**: sai AC Must, PRD M13 cam kết mẫu tin nhắn VI/EN/RU, sale gửi tiếng Anh cho khách Nga mà không biết; không sai tiền). Vai sửa: UXD (5 chuỗi RU), BE-B sinh lại `quote-copy.ts` (`--check` đang chỉ cảnh báo). Hạn: tuần 1 Sprint 3. QA thêm ca TC-L5-016 kiểm `lang=ru` không còn chữ Latin của mẫu EN.

### US-084 Tạo giữ chỗ – **Đạt (stack tạm)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 `hold`, hạn theo BR-302, chặn bán, báo giá → `converted`, lead → `holding` | E2E TC-L5-021, TC-L5-022 (clock), TC-X-010 | Đạt |
| AC1 bổ sung ESC-017 A: giới hạn giữ chỗ đang mở theo vai | E2E TC-L5-050 (CTV giữ chỗ thứ 4 → `HOLD_LIMIT_REACHED`; xác nhận cọc 1 đơn → giữ được) | Đạt |
| AC2 ngày đến hôm nay → không tạo giữ chỗ | E2E TC-L5-023 | Đạt |
| AC3 chưa có SĐT → không tạo | E2E TC-L5-024 | Đạt |
| AC4 hiện số tiền cần thu + VietQR/nội dung chuyển khoản | E2E TC-L5-025 (số cọc). Mã VietQR thuộc **US-120 (S3)** | Đạt phần số tiền; VietQR nghiệm thu ở US-120 |

### US-085 Hết hạn giữ chỗ – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 hết hạn → job hủy, mở phòng, lead → `quoted`, người tạo nhận thông báo | E2E (clock) TC-L5-026 (J1, đúng biên 1 giây), TC-X-010 | Đạt (thông báo qua push `staff.push`; mục "Cần chú ý" ở S4) |
| AC2 nhắc trước hạn + "Cần chú ý" | J2 chưa có; TC-L5-028 `skip` | Dời → **S4** |
| AC3 gia hạn một lần, không vượt trần | E2E TC-L5-029 | Đạt |
| AC4 có cọc trước hạn → không hủy; tiền về sau khi hủy → cảnh báo | E2E TC-L5-030, TC-X-004; DOM D-9 (cọc thiếu không tự hủy) | Đạt |

### US-086 Xác nhận cọc – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 đủ cọc → `confirmed`, lead `won`, hoa hồng `projected` | E2E TC-L5-031; TT `folio-payments.test.ts` | Đạt |
| AC2 thiếu → ghi giao dịch, giữ `hold`, "còn thiếu" | E2E TC-L5-032 (A-13 → 200, `depositPaidVnd`) | Đạt |
| AC3 sinh HĐ dài hạn | – | Dời R3 (R-C, đã có từ W12) |
| AC4 CTV chỉ "Báo đã chuyển cọc" kèm ảnh biên nhận | E2E TC-L5-034 (`createDepositNotice` 202, FD/sale nhận push). **Ảnh biên nhận** cần `uploadAttachment` | Đạt một phần → ảnh ở **S3** |
| AC5 nhật ký tiền: số tiền, cách thu, người xác nhận | `recordMoney` ở `deposits.service.ts`, `payment.service.ts` (QC K4); TT "audit tiền đủ"; TC-X-003 hai người cùng xác nhận → 1 lần | Đạt (QA gắn TC-L5-035 vào E2E ở S3) |
| AC5 bổ sung ESC-017 A: tiền do sale ghi chờ đối soát, hoa hồng người ghi chỉ đạt sau đối soát | Đã làm (BE-B fix, push `deposit_unverified`); chưa có ca E2E riêng; tick đối soát và "Cần chú ý" ở S3–S4 | **Thiếu bằng chứng** → **S3** (cùng `reconcilePayment`) |

### US-087 CTV chỉ thấy phần của mình – **Đạt (stack tạm)**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 CTV chỉ thấy báo giá/đơn/lead của mình | RBAC phạm vi M lọc trong SQL, trả 404 (SEC K6); E2E TC-RB-010 | Đạt |
| AC2 chỉ hoa hồng dự kiến của mình; API mục người khác → 404 | `listCommissions` chỉ của mình (TT); E2E TC-L5-003 | Đạt |
| AC3 không thấy trường giấy tờ | E2E TC-L5-042 + serializer; kiểm với khách có giấy tờ ở S3 (như US-003 AC1) | Đạt |

### US-139 Xung đột đơn OTA trùng – **Đang nghiệm thu**
| AC | Bằng chứng | Kết quả |
|---|---|---|
| AC1 đơn OTA trùng → `confirmed`, cờ xung đột, làn "Chưa gán căn", báo đỏ | E2E TC-L2-024, TC-L2-027. Báo đỏ hiện bằng chip trên rack; "Cần chú ý" ở S4 | Đạt (báo đỏ đầy đủ ở S4) |
| AC2 gợi ý căn theo BR-316; gán căn → tắt cờ | E2E TC-L2-028; BUG-R2-020 Closed | Đạt |
| AC3 còn cờ/chưa gán căn → chặn nhận phòng `RESERVATION_UNASSIGNED` | Nhận phòng chưa có | Kiểm ở **S3** (TC-L2-026) |

## 4. Việc giao lại để hoàn tất nghiệm thu (PO đề nghị, ORC giao)

| # | Việc | Vai | Hạn |
|---|---|---|---|
| N-1 | Bỏ `skip` "chờ Sprint 2" ở `platform.api.spec.ts` cho các ca mà endpoint đã có: TC-NT-011, 018, 019, 039, 040 (a–d). Đây là bằng chứng cho US-004 AC1/AC2 và US-005 AC1 | QA | Tuần 1 S3 |
| N-2 | Thêm ca E2E cho các AC đang thiếu bằng chứng: TC-NT-009 (US-002 AC3 hợp vai), TC-L2-055 (US-021 AC5 dời ngày), TC-NT-004 (US-001 AC3), TC-L5-016 (US-083 AC2, gồm `ru`), TC-L5-035 (US-086 AC5), TC-L5-020 (US-082 AC2), ca đối soát tiền sale ghi (ESC-017 A); viết lại TC-L2-079 (a) | QA | Trước cổng QC S3 |
| N-3 | Ghi PO-S2-01 vào bug-list (đề nghị P2) | QA | 17/10 |
| N-4 | Sửa PO-S2-01: 5 chuỗi RU, sinh lại `quote-copy.ts`; đổi `--check` để báo lỗi khi thiếu khóa thay vì chỉ cảnh báo (ARC/BE quyết cách làm) | UXD, BE-B | Tuần 1 S3 |
| N-5 | Phần giao diện mọi story trên: nghiệm thu lại khi ĐK-S2-4 (E2E UI + axe) xanh và khi có staging | QA, OPS → PO | Cổng QC S3 / staging |

## 5. Quyết định INV 16/10 đã áp vào backlog/PRD

| ESC | Quyết định | Áp vào | Ghi chú |
|---|---|---|---|
| ESC-015 A | Thêm Giỗ Tổ Hùng Vương (owner nhập ngày dương lịch hằng năm) và đêm 1/9 vào ngày đặc biệt, đủ 3 hệ quả BR-104/BR-113/BR-309 | Ghi chú dưới US-005 (backlog mục 4); PRD mục 10 | Không thêm AC: AC của US-005/080/021 đã dẫn BR-104/113/309, danh sách là dữ liệu tham số. DOM bỏ nhãn chờ INV ở BR-104 và cập nhật `br-examples`; BE/QA cập nhật seed `special_dates` |
| ESC-016 A | Khách ngắn ngày: dọn bù miễn phí; lần dọn đầy đủ thứ hai trong ngày tính phí BR-506; thay khăn/bổ sung đồ miễn phí | US-109 AC1 (bổ sung); PRD mục 10 | Câu phụ (HĐ dài hạn nào đang có lịch dọn cố định) INV chưa trả lời. PO giữ giả định: **không có**, như decision-log 16/10 |
| ESC-017 A | Giữ chỗ đang mở tối đa theo vai (BR-302); tiền sale/CTV ghi luôn chờ đối soát, hoa hồng người ghi đạt sau đối soát (BR-527) | US-084 AC1, US-086 AC5, US-119 AC6 (bổ sung); PRD mục 10 | Đã làm và đã test ở S2 (TC-L5-050); phần đối soát nghiệm thu ở S3 |

Thêm vào AC có sẵn (không thêm số AC mới) để `gen_traceability.py --strict` vẫn chạy được trong CI. QA cần cập nhật TC-L5-050 từ `US-084/–` thành `US-084/AC1` khi sinh lại ma trận truy vết.
