# Quy trình nghiệp vụ – OTTIMO Desk

- Tác giả: BA | Round 1 – Bước 2 (Sản xuất, đợt 2) | Ngày: 15/10/2026 | Phiên bản: 0.1 (chờ review DOM, ARC; khuyến nghị QA)
- Nguồn: `business-rules.md` (**BR-xxx**, nguồn sự thật duy nhất cho con số), `round-0-baseline.md` (**BL**), `baseline-issues-triage.md`, `PRD.md` mục 6, `research/journeys.md`, `security/data-risk-assessment.md` (**SEC**).
- Trạng thái và vai: theo `state-machines.md` (mã B1…, K1…) và `rbac-matrix.md` (OWN, MGR, FDL, FD, HK, MT, SAL, CTV, GST, SYS).
- Sơ đồ swimlane vẽ bằng Mermaid `flowchart`, mỗi làn (subgraph) là một vai. Mỗi quy trình có: luồng chính, luồng ngoại lệ (E), luồng lỗi (X).

## 0. Danh mục quy trình
| Mã | Quy trình | Phân hệ | Round code | Use case |
|---|---|---|---|---|
| P01 | Đặt phòng ngắn ngày (trực tiếp, CTV, OTA) – gồm giữ chỗ, cọc, hủy, no-show, overbooking | M2, M8, M9 | R2 | UC-01…UC-05 |
| P02 | Báo giá → giữ chỗ → cọc → hợp đồng dài hạn – gồm kỳ thu, gia hạn, chấm dứt sớm | M8 | R2 (kỳ thu, gia hạn R3) | UC-06…UC-09 |
| P03 | Nhận phòng + giấy tờ + khai báo lưu trú | M2, M3, M11 | R2 | UC-10…UC-12 |
| P04 | Lưu trú: gia hạn, trả muộn, nhắc trả phòng, yêu cầu khách, sự cố, đổi phòng | M2, M4, M5, M11 | R2 | UC-13…UC-17 |
| P05 | Trả phòng 3 bước + bill (ngắn ngày), trả phòng nhanh, quyết toán dài hạn | M2, M6, M12, M8 | R2 (dài hạn R3) | UC-18…UC-20 |
| P06 | Chốt điện nước tháng | M5, M12 | R2 chốt số, R3 hóa đơn | UC-21 |
| P07 | Buồng phòng / kiểm phòng | M4 | R2 | UC-22, UC-23 |
| P08 | Bảo trì: phiếu sửa chữa, khóa phòng, bảo trì định kỳ | M5 | R2 (định kỳ R3) | UC-24, UC-25 |
| P09 | Hoa hồng CTV / sale | M8 | R3 | UC-26 |
| P10 | Duyệt FOC / giảm giá đặc biệt / ngoại lệ (dùng chung) | M0 | R2 | UC-27 |

---

## P01 – Đặt phòng ngắn ngày

**Mục tiêu**: mọi đơn ngắn ngày (trực tiếp, CTV, OTA) nằm trên một room rack, không trùng phòng, cọc đúng chính sách.
**Vai**: GST, CTV/SAL, FD, MGR, SYS. **Kích hoạt**: khách hỏi qua Zalo/điện thoại/CTV, hoặc đơn OTA về. **Tiền điều kiện**: lịch giá có giá cho các đêm (BR-104), căn đang mở bán.
**Kết quả**: đơn `confirmed` (hoặc `cancelled`/`no_show` với lý do), bản ghi khai báo `none`, tồn phòng đồng bộ.

### Luồng chính – đơn trực tiếp/CTV
| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | GST → SAL/CTV/FD | Khách gửi ngày, số khách, căn mong muốn | – |
| 2 | SAL/CTV/FD | Báo giá ngắn ngày: kiểm phòng trống, giá theo lịch giá kênh Trực tiếp, giảm theo đêm, phụ thu người, cọc | BR-104, BR-107, BR-110, BR-111, BR-305; từ ngưỡng BR-108 hiện song song phương án tháng |
| 3 | SAL/CTV/FD | Gửi văn bản báo giá (VI/EN/RU) cho khách | BR-304 |
| 4 | GST | Đồng ý | – |
| 5 | SAL/CTV/FD | Tạo giữ chỗ (B1) với hạn giữ chọn trong BR-302 | BR-302, BR-906 |
| 6 | SYS | Khóa căn, đẩy đồng bộ, sinh khai báo `none`, nhắc trước hạn | BR-303, BR-905, BR-608 |
| 7 | GST | Chuyển cọc (VietQR nội dung = mã đơn) | BR-521 |
| 8 | FD/SAL (CTV báo kèm biên nhận) | Kiểm tiền vào, ghi giao dịch, xác nhận cọc (B4) | BR-305; CTV không tự xác nhận (rbac A04) |
| 9 | SYS | Đơn `confirmed`, lead `won`, gửi xác nhận + link app khách | – |

### Luồng chính – đơn OTA
| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | SYS (R3) / FD (R2 nhập tay) | Tạo đơn `confirmed` (B2): kênh, mã OTA, giá thực tế, kiểu thanh toán (OTA thu hộ / trả tại chỗ) | BR-307, BR-901 |
| 2 | SYS | Gắn/tạo hồ sơ khách theo khóa định danh | BR-951 |
| 3 | SYS | Đóng phòng các kênh khác; sinh khai báo `none` | BR-905, BR-608 |

```mermaid
flowchart TB
  subgraph GST["Khách"]
    G1["Hỏi phòng"] --> G2["Đồng ý báo giá"]
    G3["Chuyển cọc"]
  end
  subgraph SAL["Sale / CTV / Lễ tân"]
    S1["Báo giá ngắn ngày"] --> S2{"Còn phòng?"}
    S2 -- "Không" --> S2b["Gợi ý căn khác / ngày khác"]
    S2 -- "Có" --> S3["Gửi báo giá"]
    S4["Tạo giữ chỗ - hold"]
    S5{"Tiền đã vào?"}
    S6["Xác nhận cọc - confirmed"]
  end
  subgraph SYS["Hệ thống"]
    Y1["Kiểm trùng ở server, khóa căn, đồng bộ kênh"]
    Y2["Nhắc trước hạn giữ"]
    Y3{"Hết hạn chưa cọc?"}
    Y4["Tự hủy - cancelled, mở phòng"]
    Y5["Gửi xác nhận + link app khách"]
    O1["Đơn OTA về - confirmed"]
  end
  G1 --> S1
  S3 --> G2
  G2 --> S4 --> Y1 --> Y2 --> Y3
  Y3 -- "Có" --> Y4
  Y3 -- "Chưa đến hạn" --> G3
  G3 --> S5
  S5 -- "Có" --> S6 --> Y5
  S5 -- "Chưa" --> Y2
  O1 --> Y1
```

### Ngoại lệ
| Mã | Tình huống | Xử lý | Quy tắc |
|---|---|---|---|
| E1 | Khách đặt cho hôm nay | Không giữ chỗ; thu cọc/thu đủ ngay rồi tạo `confirmed` | BR-302 |
| E2 | Sale xin thêm thời gian giữ | Gia hạn giữ 1 lần (B3) trước khi hết hạn | BR-303 |
| E3 | Số đêm vượt giới hạn ngắn ngày | Chặn, chuyển sang báo giá dài hạn (P02) | BR-108, BR-112 |
| E4 | Khách hủy giữ chỗ chưa cọc | B5, lý do bắt buộc, không phí | BR-308 |
| E5 | Khách hủy đơn đã cọc (trực tiếp/CTV) | B10; hệ thống tính phần hoàn/phí hủy theo mốc ngày; hoàn qua P10 (MGR duyệt); hoặc MGR dời ngày (B8) | BR-309, BR-522 |
| E6 | OTA hủy | Nhận trạng thái + tiền phạt từ kênh, không tự tính | BR-310 |
| E7 | Khách không đến | Sau mốc gọi BR-311 lễ tân gọi/nhắn; sau mốc đánh dấu và không liên lạc được → B11 (thủ công). Đơn OTA: tạo việc báo no-show trên kênh | BR-311 |
| E8 | Khách báo đến trễ | Ghi giờ đến dự kiến; không đánh dấu no-show | BR-311 |
| E9 | Đổi căn/ngày trước khi đến | B7, kiểm trùng, lý do | BR-906 |

### Lỗi
| Mã | Lỗi | Hành vi hệ thống / thông báo |
|---|---|---|
| X1 | Hai người cùng đặt một căn – đêm | Một người thành công; người kia: "Căn {số} đêm {ngày} vừa được đặt. Chọn căn khác." (BR-906) |
| X2 | Đơn OTA về trùng (đồng bộ trễ) | Vẫn tạo đơn, gắn cờ xung đột, cảnh báo đỏ FD + MGR; quy trình dời khách theo thứ tự ưu tiên | BR-312 |
| X3 | Tiền cọc về sau khi giữ chỗ đã tự hủy | Cảnh báo "Tiền về cho đơn đã hủy" → tạo lại đơn nếu căn trống, không thì hoàn | SM-01 mục 1.3 |
| X4 | Giá trống/0 hoặc ngoài sàn–trần | Báo lỗi tại ô, không lưu | BR-105 |
| X5 | Số khách vượt sức chứa | Chặn: "Căn {số} tối đa {n} khách" | BR-110 |
| X6 | Thiếu SĐT với đơn trực tiếp/CTV | Chặn lưu | BL 5.16 |
| X7 | Đồng bộ kênh lỗi | Cảnh báo lễ tân, tự thử lại | BR-905 |

---

## P02 – Báo giá → giữ chỗ → cọc → hợp đồng dài hạn

**Mục tiêu**: chốt khách thuê tháng đúng công thức, ký quỹ và kỳ thu đúng, hoa hồng ghi nhận đúng người.
**Vai**: GST, SAL/CTV, FD, MGR, SYS. **Kích hoạt**: khách hỏi thuê tháng, hoặc khách ngắn ngày vượt ngưỡng BR-108.
**Kết quả**: đơn dài hạn `confirmed`, HĐ `signed`, lịch kỳ thu, hoa hồng `projected`.

### Luồng chính
| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | SAL/CTV | Lập báo giá dài hạn: căn, ngày vào ở, kỳ hạn, loại khách VN/NN, số người, gói dọn, người chốt | BR-009, BR-201–205, BR-209 |
| 2 | SYS | Tính tiền thuê/tháng, phí dịch vụ, điện nước ước tính, ký quỹ, chu kỳ thu, thu khi chốt, hoa hồng; lưu snapshot; mã báo giá | BR-203–208, BR-212, BR-006, BR-007 |
| 3 | SAL/CTV | Gửi văn bản báo giá VI/EN/RU; báo giá `active`, lead `quoted` | BR-304 |
| 4 | GST | Đồng ý | – |
| 5 | SAL/CTV | Tạo giữ chỗ từ báo giá (Q2 → B1) | BR-302, BR-906 |
| 6 | GST | Chuyển ký quỹ | BR-306 |
| 7 | FD/SAL | Xác nhận ký quỹ (B4) | BR-206, BR-306 |
| 8 | SYS | Sinh HĐ `signed` + lịch kỳ thu (SM-07) + hoa hồng `projected`; lead `won` | BR-207, BR-208, BR-212 |
| 9 | SAL/FD | Xuất PDF HĐ (R3), ký giấy với khách | PRD X4 |
| 10 | FD | Ngày vào ở: thu kỳ đầu trước khi giao mã cửa → nhận phòng (P03) → HĐ `active` | BR-208 |
| 11 | SYS | Nhắc kỳ thu theo mốc, cảnh báo quá hạn | BR-207 |
| 12 | SYS | Trước hạn HĐ theo BR-211: cảnh báo "chào gia hạn" | BR-211 |

```mermaid
flowchart TB
  subgraph GST["Khách"]
    G1["Hỏi thuê tháng"] --> G2["Đồng ý báo giá"]
    G3["Chuyển ký quỹ"]
    G4["Đến ở, trả kỳ đầu"]
  end
  subgraph SAL["Sale / CTV"]
    S1["Lập báo giá dài hạn"] --> S2["Gửi báo giá VI/EN/RU"]
    S3["Tạo giữ chỗ từ báo giá"]
    S4["Báo đã chuyển ký quỹ"]
  end
  subgraph FD["Lễ tân / Sale nội bộ"]
    F1{"Ký quỹ đã vào?"}
    F2["Xác nhận ký quỹ"]
    F3["Thu kỳ đầu, nhận phòng"]
  end
  subgraph SYS["Hệ thống"]
    Y1["Tính và lưu snapshot, mã báo giá"]
    Y2["Khóa căn, hạn giữ"]
    Y3["Sinh HĐ signed, lịch kỳ thu, hoa hồng projected"]
    Y4["Nhắc kỳ thu, chào gia hạn"]
  end
  G1 --> S1 --> Y1 --> S2 --> G2 --> S3 --> Y2 --> G3 --> S4 --> F1
  F1 -- "Có" --> F2 --> Y3 --> G4 --> F3 --> Y4
  F1 -- "Chưa" --> Y2
```

### Ngoại lệ
| Mã | Tình huống | Xử lý | Quy tắc |
|---|---|---|---|
| E1 | Báo giá hết hiệu lực trước khi khách đồng ý | Báo giá `expired`; MGR gia hạn (Q4) hoặc lập báo giá mới theo giá hiện hành | BR-304 |
| E2 | Kỳ hạn không trùng mốc | Áp mức của mốc thấp hơn gần nhất | BR-202 |
| E3 | HĐ cũ không có phí dịch vụ (thực tế Brief 5) | Sale đặt phí dịch vụ = 0 có lý do | BR-204, Q-D1 |
| E4 | Khi nhận phòng, giấy tờ khác loại khách đã báo (VN ↔ NN) | Cảnh báo MGR, **không** tự đổi giá HĐ | BR-009 |
| E5 | Thỏa thuận số tiền khác công thức | Sửa tay có lý do + MGR duyệt (P10) | BR-006 |
| E6 | Hủy trước ngày vào ở | H3: hoàn theo BR-314, MGR duyệt | BR-314, BR-522 |
| E7 | Khách báo chấm dứt sớm | H6: tính mất ký quỹ/hoàn theo BR-313, kỳ chưa bắt đầu `waived`, hoa hồng đợt 2 `void` | BR-313, BR-212 |
| E8 | Gia hạn HĐ | H4: phụ lục/HĐ mới với tham số tại thời điểm gia hạn; bù ký quỹ; NN kiểm thị thực | BR-211, BR-605 |
| E9 | Kỳ thu quá hạn | Mốc cảnh báo/chuyển quản lý theo BR-207; không khóa cửa khách | BR-207 |

### Lỗi
| Mã | Lỗi | Hành vi |
|---|---|---|
| X1 | Căn đã có đơn trong khoảng HĐ | Chặn giữ chỗ, gợi ý căn trống khác | BR-906 |
| X2 | Ngày vào ở đã qua | Chặn | – |
| X3 | Thị thực khách NN hết trước ngày kết thúc HĐ | Cảnh báo đỏ; khai báo đến hết hạn thị thực; nhắc khách gia hạn | BR-605 |

---

## P03 – Nhận phòng + giấy tờ + khai báo lưu trú

**Mục tiêu**: khách vào phòng nhanh, thu đủ tiền, giấy tờ đúng, khai báo đúng hạn.
**Vai**: GST, FD (gồm người trực đêm), FDL, MGR, HK, SYS. **Kích hoạt**: ngày đến của đơn `confirmed`.
**Kết quả**: đơn `in_house`, buồng `OC`, khai báo ≥ `sent` trước hạn, mã cửa đã giao.

### Luồng chính
| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 0 | SYS → GST | Trước ngày đến: gửi link check-in online | US-107 |
| 1 | GST | (Tùy chọn) Check-in online: tải giấy tờ từng người qua link có hạn, giờ đến dự kiến, đồng ý lưu ảnh (tách mục đích) → khai báo `pre` | SEC R-REG-08, R-CON-01 |
| 2 | FD | Mở đơn ở "Khách đến"; kiểm buồng `VI`/`VC` | BR-402, BR-803 |
| 3 | FD | Nhập/đối chiếu giấy tờ từng người (hoặc xác nhận dữ liệu `pre`) → `partial`/`review` | BR-601, BR-606, BR-612 |
| 4 | SYS | Đối chiếu tự động: tên khớp đơn, hạn hộ chiếu so thật, thị thực đến ngày trả, đủ người | BR-605 |
| 5 | FD | Xử lý cảnh báo (ghi chú); ghi đồng ý lưu ảnh có/không → `scanned` | BR-609, SEC R-REG-05 |
| 6 | FD | Thu phần còn lại (đơn trực tiếp/CTV) hoặc xác nhận OTA đã trả | BR-305, BR-307, BR-402 |
| 7 | FD | Nhập giờ nhận thực tế (mặc định giờ chuẩn); nếu sớm → hệ thống đề xuất phụ thu, FD xác nhận; FOC qua P10 | BR-401, BR-411, BR-413, BR-414 |
| 8 | FD | Bấm Nhận phòng (B9) | BR-402 |
| 9 | SYS | Đơn `in_house`, buồng `OC`, mã cửa hiệu lực, hạn khai báo bắt đầu đếm | BR-403, BR-602, BR-603 |
| 10 | FD | Giao mã cửa/thẻ (tối đa số thẻ BR-511), gửi nội quy VI/EN/RU | BR-403, BR-511 |
| 11 | FD | Khai báo bán tự động: chọn loại, sao chép dữ liệu, tự đăng nhập cổng, dán mã hồ sơ → `sent` → `confirmed` | BR-606, SEC R-REG-06/07 |
| 12 | SYS | Áp hạn lưu ảnh hoặc xóa ngay nếu không đồng ý | BR-609, BR-610 |

```mermaid
flowchart TB
  subgraph GST["Khách"]
    G1["Check-in online: giấy tờ, giờ đến, đồng ý"]
    G2["Đến quầy"]
    G3["Thanh toán phần còn lại"]
  end
  subgraph FD["Lễ tân / người trực"]
    F1{"Buồng VI hoặc VC?"}
    F1b["Ngoại lệ: FDL+ xác nhận, có lý do"]
    F2["Nhập / đối chiếu giấy tờ"]
    F3["Xử lý cảnh báo, ghi đồng ý lưu ảnh"]
    F4["Thu tiền / xác nhận OTA đã trả"]
    F5["Giờ nhận thực tế, phụ thu nếu sớm"]
    F6["Bấm Nhận phòng"]
    F7["Giao mã cửa, gửi nội quy"]
    F8["Khai báo trên cổng, nhập mã hồ sơ"]
  end
  subgraph SYS["Hệ thống"]
    Y0["Gửi link check-in"]
    Y1["Đối chiếu tự động"]
    Y2["Đơn in_house, buồng OC, mã cửa hiệu lực"]
    Y3["Tính hạn khai báo, nhắc người trực"]
    Y4["Áp hạn lưu ảnh / xóa ảnh"]
  end
  Y0 --> G1 --> G2 --> F1
  F1 -- "Có" --> F2
  F1 -- "Không" --> F1b --> F2
  F2 --> Y1 --> F3 --> G3 --> F4 --> F5 --> F6 --> Y2 --> F7 --> Y3 --> F8 --> Y4
```

### Ngoại lệ
| Mã | Tình huống | Xử lý | Quy tắc |
|---|---|---|---|
| E1 | Buồng chưa sẵn sàng, khách đến sớm | Gửi hành lý, ưu tiên dọn căn (BR-807); hoặc nhận vào buồng chưa sạch nếu FDL+ đồng ý → `OD` | BR-402, BR-807 |
| E2 | Khách đến khuya, không có lễ tân | Check-in online trước; người trực/MGR nhận thông báo, làm B9 và khai báo trên điện thoại; nhắc theo mốc BR-611 | BR-611 |
| E3 | Thiếu giấy tờ người đi cùng | Vẫn nhận phòng nếu có giấy tờ người đứng tên; bổ sung trước hạn khai báo | BR-402, BR-601 |
| E4 | Thêm người giữa chừng | Cập nhật số khách (kiểm sức chứa BR-110), nhập giấy tờ → `needs_update` khai bổ sung | BR-601 |
| E5 | Thị thực hết trước ngày đi | Cảnh báo đỏ, khai đến hết hạn thị thực, nhắc khách gia hạn | BR-605 |
| E6 | Khách không đồng ý lưu ảnh | Vẫn khai báo; ảnh xóa sau khi khai xong; chỉ giữ trường văn bản cần thiết | BR-609, SEC R-REG-05 |
| E7 | Cổng khai báo từ chối | `sent` → `scanned`, sửa dữ liệu, khai lại | SM-05 K8 |
| E8 | Đơn đến khi vẫn `hold` | Thu cọc/đủ → B4 → B9 | SM-01 |
| E9 | Nhận phòng trước mốc đêm trước (BR-003) | Lễ tân đổi ngày đến sang đêm trước (B7, kiểm trùng) rồi nhận | BR-003, BR-411 |

### Lỗi
| Mã | Lỗi | Hành vi |
|---|---|---|
| X1 | Chưa thu đủ mà bấm Nhận phòng | Chặn: "Còn phải thu {số tiền}" | BR-402 |
| X2 | Chưa có giấy tờ người đứng tên | Chặn giao mã cửa | BR-402 |
| X3 | Sắp quá hạn khai báo | Nhắc trước hạn, đưa vào "Cần chú ý"; quá hạn → cờ đỏ | BR-602, BR-603, BR-907 |
| X4 | Gửi ảnh giấy tờ qua chat | Không có đường nhập; mẫu tin hướng khách dùng link | SEC R-REG-08 |
| X5 | Tệp tải lên sai định dạng/quá lớn | Báo lỗi tại ô, cho tải lại | SEC R-REG-08 |

**Mâu thuẫn hạn khai báo khách nước ngoài**: BL dùng một mốc 23:00 cho mọi khách; BR-603 (DOM) và SEC R-REG-01 cho rằng người nước ngoài phải khai trong số giờ BR-603 kể từ khi đến. Quy trình dùng **hạn sớm hơn** giữa hai mốc `[GIẢ ĐỊNH – chờ INV/luật sư xác nhận]`.

---

## P04 – Lưu trú: gia hạn, trả muộn, nhắc trả phòng, yêu cầu, sự cố

**Vai**: GST, FD, HK, MT, MGR, SYS.

### P04a – Gia hạn
| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | GST (yêu cầu) / FD | Chọn số đêm thêm trong số đêm liên tiếp còn trống | BR-421 |
| 2 | SYS | Giá mặc định: đơn trực tiếp giữ giá đơn (trừ ngày đặc biệt); đơn OTA lấy giá trực tiếp hiện hành | BR-421 |
| 3 | FD | Xác nhận (sửa giá trong sàn–trần) | BR-105 |
| 4 | SYS | Đơn trực tiếp: kéo dài ngày đi. Đơn OTA: tạo đơn con kênh Trực tiếp liên kết; thông báo tiết kiệm phí kênh theo cấu hình | BR-422 |
| 5 | FD | Thu tiền gia hạn | BR-423 |
| 6 | SYS | Buồng `OD`, việc dọn đổi loại, đồng bộ kênh, khai báo NN `needs_update` | BR-802, BR-604, BR-905 |

Ngoại lệ: vượt giới hạn BR-421 hoặc tổng vượt ngưỡng BR-108 → báo giá dài hạn (P02). Không còn đêm trống liên tiếp → gợi ý căn cùng nhóm (đổi phòng P04e).

### P04b – Nhắc trả phòng và trả muộn
| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | SYS | Nhắc khách theo các mốc (tối hôm trước, sáng ngày trả) kèm lựa chọn Trả đúng giờ / Ở thêm / Trả muộn | BR-425 |
| 2 | GST | Chọn (R3 tự phục vụ; R2 trả lời qua chat, lễ tân ghi) | US-113 |
| 3 | SYS | Chưa trả lời đến mốc → báo lễ tân gọi; quá giờ trả → báo đỏ FD + MGR | BR-425 |
| 4 | FD | Ghi giờ trả đã xác nhận / đặt trả muộn: phụ thu theo bậc; có khách đến cùng ngày và không có căn thay thế → chặn (MGR duyệt); sau mốc 100% → gia hạn | BR-412, BR-416 |
| 5 | FD | FOC nếu có → P10 | BR-431 |

### P04c – Yêu cầu từ app khách
| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | GST | Gửi yêu cầu (6 loại) | BR-811 |
| 2 | SYS | Định tuyến: dọn/khăn → HK (việc); báo hỏng → MT (phiếu mức mặc định); xe/tour, trả muộn, khác → FD | BR-811 |
| 3 | Bộ phận nhận | "Đã nhận" trong thời hạn BR-811; ngoài giờ trực SYS trả lời tự động kèm giờ xử lý | BR-811 |
| 4 | Bộ phận nhận | Xử lý; phát sinh có phí (dọn lẻ, giặt) ghi folio khi xong | BR-506, BR-507 |
| 5 | SYS | Khách thấy trạng thái cập nhật | SM-15 |

### P04d – Sự cố (mất nước nóng, khóa hỏng, mất thẻ, đồ để quên)
| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | GST/HK/FD | Báo sự cố → phiếu sửa (P08); FD nâng mức nếu ảnh hưởng khách | BR-809 |
| 2 | FD | Gửi mẫu tin xin lỗi đúng ngôn ngữ khách | US-125 |
| 3 | MT | Nhận phiếu trong thời hạn mức Cao | BR-809 |
| 4 | FD/MGR | Hết thời hạn phương án mà chưa sửa xong → đổi phòng (P04e) + FOC bù sự cố (P10) | BR-809, BR-424, BR-431 |
| 5 | FD | Mất thẻ phòng: thu phí theo BR-511, cấp thẻ mới, hủy thẻ cũ | BR-511, BR-403 |
| 6 | HK/FD | Đồ để quên: ghi sổ có ảnh, báo khách, lưu giữ; đồ giá trị bàn giao MGR có biên bản | BR-513 |

### P04e – Đổi phòng
FD chọn căn trống `VI`/`VC` (B14), ghi lý do; giá theo BR-424 (lỗi OTTIMO giữ giá cũ, khách yêu cầu tính giá căn mới); căn cũ → `VD`/`OD` + việc dọn; hủy mã cửa cũ, cấp mã mới; khai báo không khai lại (BR-424).

```mermaid
flowchart TB
  subgraph GST["Khách"]
    G1["Gửi yêu cầu / báo sự cố / trả lời nhắc trả phòng"]
  end
  subgraph SYS["Hệ thống"]
    Y1{"Loại yêu cầu"}
    Y2["Nhắc trả phòng theo mốc"]
    Y3["Quá mốc chưa trả lời: báo lễ tân"]
  end
  subgraph HK["Buồng phòng"]
    H1["Việc dọn / khăn / đồ dùng"]
  end
  subgraph MT["Bảo trì"]
    M1["Phiếu sửa chữa"]
    M2{"Sửa kịp hạn?"}
  end
  subgraph FD["Lễ tân"]
    F1["Xe, tour, trả muộn, khác"]
    F2["Gia hạn / trả muộn có phụ thu"]
    F3["Đổi phòng + FOC bù sự cố"]
    F4["Gọi khách"]
  end
  G1 --> Y1
  Y1 -- "Dọn, khăn" --> H1
  Y1 -- "Báo hỏng" --> M1 --> M2
  M2 -- "Không" --> F3
  Y1 -- "Khác" --> F1
  Y2 --> G1
  Y2 --> Y3 --> F4 --> F2
```

### Lỗi chung P04
| Mã | Lỗi | Hành vi |
|---|---|---|
| X1 | Đêm gia hạn vừa bị đặt | Từ chối, gợi ý căn khác (BR-906) |
| X2 | Trả muộn khi có khách đến | Chặn, đề xuất gửi hành lý; MGR duyệt nếu có căn thay thế (BR-416) |
| X3 | Đổi phòng sang căn OOO/không sạch | Chặn (SM-03) |

---

## P05 – Trả phòng 3 bước + bill

**Mục tiêu**: thu đúng mọi khoản trong ≤ thời gian chờ mục tiêu BR-426, bill khóa, buồng chuyển cần dọn.
**Vai**: GST, FD, HK, MGR, SYS. **Kích hoạt**: khách báo trả hoặc đến quầy ngày đi.

### P05a – Ngắn ngày (luồng chính)
| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 0 | HK | Khi khách báo trả: kiểm minibar, hư hỏng, thẻ phòng qua app nhân viên | BR-426, BR-703 |
| 1 | FD | **Bước 1 – Minibar**: xác nhận số còn lại; tự tính đã dùng, tiền; đồ miễn phí không tính tiền | BR-701, BR-702 |
| 2 | FD | **Bước 2 – Phụ phí**: giặt ủi, ăn uống, hư hỏng (bảng giá), phí phạt có bằng chứng, giờ trả thực tế (mặc định giờ chuẩn) → phụ thu trả muộn; FOC → P10 | BR-412, BR-414, BR-507, BR-511, BR-512 |
| 3 | FD | **Bước 3 – Bill**: tiền phòng từng đêm, phát sinh, dòng FOC âm, trừ đã cọc/đã thu, còn phải thu; VI/EN, quy đổi USD tham khảo; VAT tách khi xuất hóa đơn | BR-004, BR-434, BR-523 |
| 4 | GST | Thanh toán (VietQR / thẻ qua cổng / tiền mặt / đã thu qua OTA), có thể nhiều lần | BR-521 |
| 5 | FD | Ghi giao dịch; nhập thông tin hóa đơn công ty nếu khách cần | BR-521, BR-524 |
| 6 | FD | Bấm Hoàn tất (B18) – chỉ khi còn phải thu = 0 | BR-426 |
| 7 | SYS | Đơn `checked_out`, folio `settled`, số bill server cấp; buồng `VD`; việc "Dọn trả phòng", "Bổ sung minibar"; hủy mã cửa; khai báo NN `needs_update`; hóa đơn điện tử; hoa hồng `earned`; gửi bill + lời cảm ơn/mã quay lại | BR-007, BR-403, BR-524, BR-604, BR-903 |

```mermaid
flowchart TB
  subgraph GST["Khách"]
    G1["Báo trả phòng"]
    G2["Thanh toán"]
  end
  subgraph HK["Buồng phòng"]
    H1["Kiểm minibar, hư hỏng, thẻ"]
  end
  subgraph FD["Lễ tân"]
    F1["Bước 1: minibar"]
    F2["Bước 2: phụ phí, giờ trả, FOC"]
    F3["Bước 3: bill"]
    F4{"Còn phải thu = 0?"}
    F5["Hoàn tất trả phòng"]
    F6["MGR ghi công nợ có hạn"]
  end
  subgraph SYS["Hệ thống"]
    Y1["checked_out, bill khóa, buồng VD"]
    Y2["Tạo việc dọn + bổ sung minibar, hủy mã cửa"]
    Y3["Hóa đơn điện tử, cập nhật ngày đi khai báo NN"]
  end
  G1 --> H1 --> F1 --> F2 --> F3 --> G2 --> F4
  F4 -- "Có" --> F5 --> Y1 --> Y2 --> Y3
  F4 -- "Không" --> F6 --> F5
```

### P05b – Trả phòng nhanh qua app (không có người ở quầy)
GST bấm "Trả phòng" (B18 – chỉ khi còn phải thu = 0) → SYS gửi bill qua email/Zalo → HK kiểm minibar sau → phát sinh ghi vào folio `settled` và gửi khách link thanh toán trong thời hạn BR-427.

### P05c – Trả phòng dài hạn và quyết toán ký quỹ (R3)
| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | SYS | Nhắc trước ngày trả theo BR-425 (dài hạn) | BR-425 |
| 2 | MT/FD | Chốt công tơ ngày trả (ảnh bắt buộc) | BR-502 |
| 3 | HK + FD | Kiểm phòng có ảnh: hư hỏng, mùi thuốc lá, thẻ phòng | BR-214, BR-511 |
| 4 | FD | Lập quyết toán: ngày lẻ chưa thu + điện nước kỳ cuối + minibar/dọn lẻ + phạt/bồi thường − ký quỹ | BR-210, BR-214 |
| 5 | FD | Hoàn tất trả phòng (B18); HĐ → `settling` | – |
| 6 | MGR | Duyệt quyết toán (P10) | BR-214, BR-522 |
| 7 | FD/MGR | Dương → thu thêm; âm → hoàn trong thời hạn BR-214 (giao dịch hoàn) | BR-214 |
| 8 | SYS | HĐ `closed` | SM-06 H9 |

### P05d – Trả sớm
FD ghi ngày rời mới (B16); hoàn theo BR-428 qua P10; mở bán các đêm còn lại; khai báo NN `needs_update`.

### Ngoại lệ và lỗi
| Mã | Tình huống | Xử lý |
|---|---|---|
| E1 | Khách tranh chấp minibar | FD FOC trong hạn mức (BR-704), vượt → FDL |
| E2 | Khách công ty trả sau | MGR ghi công nợ có hạn, cảnh báo quá hạn (BR-525) |
| E3 | Đơn OTA thu hộ | Bill ghi "Đã thu qua OTA"; chỉ thu phát sinh (BR-307, BR-415) |
| E4 | Phát hiện phát sinh sau khi hoàn tất | Ghi bút toán vào folio `settled` (FD trong thời hạn BR-427, sau đó MGR), gửi link thanh toán |
| X1 | Bấm Hoàn tất khi còn phải thu > 0 | Chặn: "Còn phải thu {số tiền}" (BR-426) |
| X2 | Còn FOC chờ duyệt | Chặn: "Có khoản chờ duyệt" (SM-10) |
| X3 | Phát hành hóa đơn điện tử lỗi | Bill vẫn khóa; hóa đơn vào hàng chờ thử lại, cảnh báo FD (R3) |
| X4 | MST sai định dạng | Báo lỗi tại ô (BL 5.16) |

---

## P06 – Chốt điện nước tháng

**Vai**: MT/FD (chốt), MGR (duyệt bất thường), GST (xem/thanh toán), SYS. **Kích hoạt**: ngày chốt theo BR-502; nhận phòng/trả phòng dài hạn.

| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | SYS | Tạo danh sách căn dài hạn cần chốt, nhắc trong khung ngày chốt | BR-502 |
| 2 | MT/FD | Nhập chỉ số điện, nước mới + ảnh công tơ (bắt buộc) | BR-502 |
| 3 | SYS | Kiểm: mới < cũ → chặn (lý do + MGR duyệt); tiêu thụ vượt hệ số bất thường → cảnh báo kiểm tra | BR-503 |
| 4 | MGR | Duyệt trường hợp bất thường (P10) | BR-503 |
| 5 | SYS | Tính tiền theo đơn giá; sinh hóa đơn điện nước tháng (kỳ thu SM-07), hiện trong app khách, hạn thanh toán | BR-501, BR-504 |
| 6 | GST | Xem, thanh toán | BR-521 |
| 7 | FD | Ghi thu; hóa đơn điện tử | BR-524 |

```mermaid
flowchart TB
  subgraph MT["Bảo trì / Lễ tân"]
    M1["Nhập chỉ số + ảnh"]
  end
  subgraph SYS["Hệ thống"]
    Y1["Danh sách căn cần chốt"]
    Y2{"Mới nhỏ hơn cũ?"}
    Y3{"Tiêu thụ bất thường?"}
    Y4["Tính tiền, sinh hóa đơn tháng, hiện trong app khách"]
  end
  subgraph MGR["Quản lý"]
    Q1["Duyệt lý do: thay công tơ / quay vòng"]
    Q2["Kiểm tra trước khi gửi khách"]
  end
  subgraph GST["Khách dài hạn"]
    G1["Xem và thanh toán"]
  end
  Y1 --> M1 --> Y2
  Y2 -- "Có" --> Q1 --> Y4
  Y2 -- "Không" --> Y3
  Y3 -- "Có" --> Q2 --> Y4
  Y3 -- "Không" --> Y4
  Y4 --> G1
```

Lỗi: thiếu ảnh → chặn lưu; chỉ nhập một trong hai chỉ số → lưu nháp, chưa tính tiền (BL 5.10); quá khung ngày chốt → "Cần chú ý" (BR-907). Điện nước kỳ cuối khi trả phòng: chốt theo ngày trả (P05c).

---

## P07 – Buồng phòng / kiểm phòng

**Vai**: HK, FDL/MGR (kiểm), FD, SYS. **Kích hoạt**: đầu ca; sự kiện trả phòng, gia hạn, yêu cầu khách, lịch dọn dài hạn.

| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | SYS | Sinh việc hôm nay: dọn trả phòng, dọn phòng khách ở (theo mốc hằng ngày, thay ga theo chu kỳ), lịch gói dài hạn, bổ sung minibar, yêu cầu khách; sắp theo ưu tiên | BR-802, BR-807 |
| 2 | HK | Mở điện thoại, xem việc theo thứ tự ưu tiên (căn có khách đến hôm nay trước) | BR-807 |
| 3 | HK | Bắt đầu dọn (R1: `VD`/`OD` → `CL`) | BR-802 |
| 4 | HK | Kiểm minibar khi dọn phòng có khách; báo sự cố/đồ thất lạc nếu có | BR-703, BR-513 |
| 5 | HK | Dọn xong (R2/R3: → `OC` hoặc `VC`); việc tự xong | BR-802 |
| 6 | FDL/MGR (hoặc HK tự kiểm khi được phép) | Checklist kiểm phòng đủ mục (+ ảnh) → `VI` | BR-802, BR-808 |
| 7 | HK | Bổ sung minibar → kho tự trừ | US-068 |
| 8 | SYS | Đối chiếu buồng – đơn theo mốc, cảnh báo lệch; `VC`/`VI` quá hạn → kiểm lại | BR-805, BR-806 |

```mermaid
flowchart TB
  subgraph SYS["Hệ thống"]
    Y1["Sinh việc hôm nay, sắp ưu tiên"]
    Y2["Đối chiếu buồng - đơn, cảnh báo lệch"]
  end
  subgraph HK["Buồng phòng"]
    H1["Bắt đầu dọn: CL"]
    H2["Kiểm minibar, báo sự cố"]
    H3["Dọn xong: VC hoặc OC"]
    H4["Bổ sung minibar"]
  end
  subgraph CHK["Người kiểm (FDL/MGR hoặc HK được phép)"]
    C1{"Checklist đủ?"}
    C2["Đạt: VI"]
    C3["Không đạt: trả lại HK"]
  end
  Y1 --> H1 --> H2 --> H3
  H3 -- "Căn trống" --> C1
  C1 -- "Có" --> C2 --> H4
  C1 -- "Không" --> C3 --> H1
  H3 -- "Còn khách" --> H4
  H4 --> Y2
```

Ngoại lệ: khách từ chối dọn → việc `cancelled` có lý do (BR-807); khách treo biển không làm phiền → hoãn, báo FD; mất mạng → thao tác lưu trên máy và gửi lại khi có mạng (US-058, ARC quyết cách làm). Lỗi: chuyển trạng thái không hợp lệ (ví dụ `VD` → `VI`) → server từ chối (SM-03).

---

## P08 – Bảo trì: phiếu sửa chữa, khóa phòng, bảo trì định kỳ

**Vai**: MT, HK, FD, MGR, GST, SYS.

| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | HK/FD/MT/GST | Báo hỏng: căn, mô tả, ảnh, mức độ (W1) | BR-809, BR-811 |
| 2 | FD/MT | Nếu cần khóa phòng: chọn khoảng ngày dự kiến → khối OOO (O1). Căn có khách → đổi phòng trước; trùng đơn tương lai → danh sách đơn cần dời | BR-804 |
| 3 | SYS | Mức Cao → báo ngay MT + FD + MGR; đo thời hạn nhận/xử lý | BR-809, BR-907 |
| 4 | MT | Nhận phiếu (W2) → xử lý → chờ vật tư nếu cần (W3) | BR-809 |
| 5 | MT | Sửa xong (W4), ảnh sau sửa | – |
| 6 | SYS | Khối OOO `released` → buồng `VD` → việc dọn; mở bán, đồng bộ kênh; yêu cầu khách `done` | BR-804, BR-905 |
| 7 | SYS | Bảo trì định kỳ: hoàn thành → sinh kỳ kế tiếp; sắp đến hạn → cảnh báo | BR-810 |

```mermaid
flowchart TB
  subgraph REP["Người báo (HK / FD / Khách)"]
    R1["Báo hỏng: căn, mô tả, ảnh"]
  end
  subgraph FD["Lễ tân / Bảo trì"]
    F1{"Cần khóa phòng?"}
    F2{"Căn có khách?"}
    F3["Đổi phòng trước"]
    F4["Tạo khối OOO có khoảng ngày"]
  end
  subgraph MT["Bảo trì"]
    M1["Nhận phiếu"]
    M2["Xử lý / chờ vật tư"]
    M3["Sửa xong + ảnh"]
  end
  subgraph SYS["Hệ thống"]
    Y1["Phiếu new, đo hạn theo mức"]
    Y2["Chặn bán, đồng bộ kênh"]
    Y3["Mở khóa: buồng VD, việc dọn, mở bán"]
  end
  R1 --> Y1 --> F1
  F1 -- "Có" --> F2
  F2 -- "Có" --> F3 --> F4
  F2 -- "Không" --> F4
  F4 --> Y2 --> M1
  F1 -- "Không" --> M1
  M1 --> M2 --> M3 --> Y3
```

Lỗi: khóa căn đang có khách → chặn; tạo phiếu thiếu mô tả → chặn; mở khóa tay không qua phiếu → chỉ MGR+ có lý do.

---

## P09 – Hoa hồng CTV / sale

**Vai**: SAL/CTV (xem của mình), SYS, OWN/MGR (chi). **Kích hoạt**: đơn/HĐ có người chốt được xác nhận.

| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | SAL/CTV | Ghi người chốt khi báo giá/giữ chỗ | BR-212, BR-903 |
| 2 | SYS | Xác nhận cọc → hoa hồng `projected` với tỷ lệ, cơ sở snapshot | BR-006 |
| 3 | SYS | Ngắn ngày: đơn `checked_out` + thu đủ → `earned`. Dài hạn: đợt 1 khi kỳ đầu `paid`; đợt 2 khi qua mốc thời hạn | BR-212, BR-903 |
| 4 | SYS | Đơn hủy/no-show, HĐ chấm dứt sớm trước đợt 2 → `void` | BR-212, BR-903 |
| 5 | SYS | Đến kỳ chi → `payable` (gộp theo tháng – chờ DOM SQ-4) | – |
| 6 | OWN/MGR | Chi, đánh dấu `paid` (ngày, cách chi, chứng từ) | – |
| 7 | SAL/CTV | Xem hoa hồng của mình theo trạng thái | US-087, US-089 |

```mermaid
flowchart TB
  subgraph SAL["Sale / CTV"]
    S1["Báo giá ghi người chốt"]
    S2["Xem hoa hồng của mình"]
  end
  subgraph SYS["Hệ thống"]
    Y1["Cọc xác nhận: projected"]
    Y2{"Điều kiện ghi nhận đạt?"}
    Y3["earned"]
    Y4["Hủy / no-show / chấm dứt sớm: void"]
    Y5["Kỳ chi: payable"]
  end
  subgraph OWN["Chủ đầu tư / Quản lý"]
    O1["Chi và đánh dấu paid"]
  end
  S1 --> Y1 --> Y2
  Y2 -- "Có" --> Y3 --> Y5 --> O1 --> S2
  Y2 -- "Đơn bị hủy" --> Y4
```

Mâu thuẫn còn mở: tỷ lệ CTV ngắn ngày ở báo giá khác báo cáo kênh (BR-903, Q-D2) – dùng tỷ lệ BR-903, báo cáo lấy từ hoa hồng thực tế từng đơn.

---

## P10 – Duyệt FOC / giảm giá đặc biệt / ngoại lệ (dùng chung)

| Bước | Ai | Việc | Quy tắc |
|---|---|---|---|
| 1 | FD/FDL/SAL/MT | Gửi yêu cầu: loại, giá trị, lý do từ danh mục | BR-432 |
| 2 | SYS | Trong hạn mức tự áp của vai (chỉ MGR/OWN, hoặc FD với FOC minibar) → `approved`; còn lại → `pending`, báo người có quyền | BR-432, BR-433 |
| 3 | Người duyệt | Xác nhận bằng PIN/mật khẩu của chính mình; không duyệt yêu cầu của chính mình | BR-432 |
| 4 | SYS | Vượt hạn mức lần/tháng → chuyển cấp trên | BR-433 |
| 5 | SYS | Duyệt: folio có dòng phát sinh + dòng FOC âm; nhật ký; cộng hạn mức tháng; kiểm cảnh báo thất thoát gửi OWN | BR-434, BR-435 |

```mermaid
flowchart TB
  subgraph REQ["Người gửi (FD / FDL / SAL / MT)"]
    A1["Gửi yêu cầu + lý do"]
  end
  subgraph SYS["Hệ thống"]
    Y1{"Được tự áp?"}
    Y2["pending, báo người duyệt"]
    Y3{"Trong hạn mức người duyệt?"}
    Y4["Ghi folio: phát sinh + FOC âm, nhật ký"]
    Y5["Kiểm ngưỡng thất thoát, báo chủ đầu tư"]
  end
  subgraph APP["Người duyệt (FDL / MGR / OWN)"]
    P1["Xác nhận bằng PIN của chính mình"]
    P2["Từ chối có lý do"]
  end
  A1 --> Y1
  Y1 -- "Có" --> Y4
  Y1 -- "Không" --> Y2 --> Y3
  Y3 -- "Có" --> P1 --> Y4 --> Y5
  Y3 -- "Không: chuyển cấp trên" --> P1
  Y2 --> P2
```

Lỗi: người duyệt = người gửi (không phải MGR/OWN) → từ chối; PIN sai → không duyệt, khóa tạm sau số lần sai do SEC quy định; yêu cầu còn `pending` → chặn hoàn tất trả phòng.

---

## Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 (đợt 2) | Bản đầu: 10 quy trình, swimlane Mermaid, ngoại lệ + lỗi | BA |
