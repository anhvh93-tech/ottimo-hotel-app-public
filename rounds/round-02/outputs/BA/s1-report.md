# Báo cáo BA – Round 2, Sprint 1 "Đặc tả Sprint 3: EP03–EP05, EP15, EP06 + check-in online mức 1"

- Người làm: BA | Ngày: 16/10/2026 | Căn cứ: `rounds/round-02/plan.md` mục 3.1 (BA việc 1), mục 4 (Sprint 3 – BA đi trước dev một sprint); BR **v0.3.1** (BR-4xx, 5xx, 6xx, 812); OpenAPI **0.3.2-draft**; SEC `outputs/SEC/w1-review.md` mục 4 (P-R2-4 ĐK-1…6); backlog sau R-C (W12).

## 1. Đã làm gì
1. **`specs/EP03-05-stay.md`** – đặc tả mức trường cho US-025…032, 035…039, US-119 (trừ AC5), US-120 và phần folio của US-007: điều kiện nhận phòng (BR-402 + BR-613 c), phụ thu nhận sớm/trả muộn không tự áp (BR-414), B9a nhận trước 06:00 (BR-417), dài hạn tính trên giá đêm quy đổi (BR-102/413), hoàn tác B17; thu tiền, VietQR (nội dung = mã đơn/bill bỏ gạch), cờ "chờ đối soát" + danh sách đối soát + tách người ghi/người đối soát (BR-527, A46), đảo giao dịch; dòng phát sinh có bằng chứng, sửa = bút toán, FOC/giảm giá đặc biệt theo loại dòng và chặn trả phòng khi còn chờ duyệt; gia hạn, trả muộn (ân hạn 12:30 theo khách đến cùng ngày), xác nhận giờ trả, thẻ khách đi theo mốc BR-425; trả phòng 3 bước, nội dung bill VI/EN + USD, hóa đơn công ty (V-04), blocker hoàn tất, kết quả B18.
2. **Áp BR-812 (ESC-014) vào nhận/lưu trú/trả phòng** (mục 0.1 EP03-05): cảnh báo không chặn khi bộ đồ dùng chưa chuẩn bị, thêm/giảm người giữa kỳ, gia hạn/trả muộn, đổi phòng (chuyển/thu hồi), hoàn tác, thu hồi khi trả phòng, không có dòng tiền riêng trên folio, mất mền/khăn tính như hư hỏng BR-512.
3. **`specs/EP06-registration.md`** – US-042…050 + US-142: danh sách cần khai báo và cách tính hạn (giờ thật, VN/NN/`mixed`), bảng trường giấy tờ theo loại (CCCD/hộ chiếu/trẻ em/khác), đối chiếu 3 kết quả + kiểm tay + ghi chú bắt buộc, BR-613 a/b/c, đồng ý lưu ảnh không chọn sẵn (người đi cùng tự quyết), khai báo bán tự động (sao chép, xóa clipboard, mã hồ sơ, từ chối, cập nhật ngày đi), cảnh báo thị thực khi gia hạn (US-050), xóa ảnh tự động/sớm (BR-609, BR-610).
4. **Guest-web check-in online mức 1** (EP06 mục 8 – US-106, 107, 112 phần check-in): áp nguyên văn **ĐK-1…ĐK-6** của SEC thành ràng buộc màn hình/API; cấp/thu hồi link ở Desk; 4 bước (thông báo → giấy tờ → giờ đến → đồng ý), mở lại link chỉ hiện "đã có n/m", lỗi link/hết hạn/sau trả phòng, ngôn ngữ. Liệt kê chuỗi UXD **không được dùng ở R2** (OTP, mã cửa, bill) và chuỗi phải sửa (`guest.oci.done_body` đang hứa mã cửa).
5. **Xác nhận phần BA của ĐK-5**: Desk ghi `refused` đè `granted` → xóa ảnh theo BR-609 (c).
6. Ghi 5 dòng `decision-log.md`.

## 2. File đã tạo/sửa
| File | Thay đổi |
|---|---|
| `product/docs/specs/EP03-05-stay.md` | **Mới** v0.1 |
| `product/docs/specs/EP06-registration.md` | **Mới** v0.1 |
| `01-decisions/decision-log.md` | Thêm 5 dòng BA |
| `rounds/round-02/outputs/BA/s1-report.md` | Báo cáo này |

Không sửa file vai khác (OpenAPI, erd, BR, chuỗi copy, SEC). `state-machines.md`, `rbac-matrix.md` không cần đổi cho đợt này (các chuyển B9, B9a, B13–B18, K2–K13, SM-10/12/13 đã đủ; thay đổi chờ ARC trả lời E-xx).

## 3. Giả định (nhãn `[GIẢ ĐỊNH BA]` trong specs)
- G-1 **R2 chặn nhận phòng B9** thay cho "chặn giao mã cửa" (BR-402 (3), BR-613 c) vì mã cửa dời R3 – DOM xác nhận.
- G-2 `cardsIssued` 0–2 **mỗi đơn** (BR-511 "mỗi khách") – DOM xác nhận mỗi đơn hay mỗi người.
- G-3 Khung miễn BR-413 chỉ áp trả muộn dài hạn; nhận sớm dài hạn theo bậc BR-411 trên giá quy đổi – DOM xác nhận.
- G-4 VietQR không vượt "còn phải thu"; QR `pending` cũ hết hiệu lực khi tạo QR mới hoặc hết ngày nghiệp vụ.
- G-5 R2 chưa có ca → tiền mặt `shiftId = null` (erd 4.6 cho phép khi đóng ca R3).
- G-6 Kiểm minibar lần 2 thay lần 1 (server đảo dòng cũ); mỗi món có tiền một dòng folio; món miễn phí không tạo dòng tiền.
- G-7 So tên giấy tờ: mọi từ tên trên đơn phải có trên giấy tờ, không xét thứ tự (tên đệm thêm vẫn Đạt) – DOM xác nhận.
- G-8 Người dưới `minor_data_age_threshold`: không hỏi đồng ý, ảnh xóa khi khai báo xong; guest-web chỉ hỏi đồng ý cho Khách 1 – SEC xác nhận.
- G-9 Ràng buộc nhập liệu số giấy tờ (CCCD/định danh 12 số; hộ chiếu 6–12 chữ/số), quốc tịch ISO alpha-3; tự ẩn số đầy đủ và tự xóa clipboard sau 60 giây.
- G-10 Thẻ khách đi R2 dùng nhãn "Chờ khách trả lời" thay "Đã nhắc" vì nhắc tự động là US-034 (R3).
- G-11 Gia hạn đơn AC5a không sinh dòng tiền phòng (tiền thu tay) – ARC xác nhận.

## 4. Rủi ro / vướng mắc
| # | Vấn đề | Ảnh hưởng | Đề xuất |
|---|---|---|---|
| R-1 | Hợp đồng thiếu thao tác `pending → succeeded` cho VietQR và **không có endpoint liệt kê giao dịch** để đối soát | US-120 AC1 và US-119 AC6 không làm trọn được | ARC E05-02, E05-03 trước khi BE-B làm folio (Sprint 3) |
| R-2 | `DocumentCheck.result` chỉ có `ok/warning` – không phân biệt "Không đạt" với "Chưa kiểm được"; thiếu 3 mục kiểm tại ngày nhận (BR-613 c) | Trái US-044 AC2 (HR-07); không tính được `blocksDoorCode` | ARC E06-01 |
| R-3 | Chuỗi guest-web hiện có hứa mã cửa/bill/OTP (`guest.oci.done_body`, `guest.late.*`, `guest.verify.*`) | Vi phạm ĐK-6 → US-141 phải quay lại R2 | UXD dùng bản R2 (EP06 8.1); SEC review PR guest-web |
| R-4 | Thiếu mã lỗi/trường: B9a, `cardsIssued`, `houseRulesSent`, `MINIBAR_*`, `EXTENSION_LIMIT_EXCEEDED`, `LATE_CHECKOUT_AFTER_LIMIT`, `EVIDENCE_REQUIRED`, `VISA_EXPIRES_BEFORE_DEPARTURE`, `SELF_RECONCILE_FORBIDDEN`, `ONLINE_CHECKIN_CLOSED`… | FE/BE tự đặt tên lệch | ARC gom vào 0.3.3 (E03-01…E06-07) |
| R-5 | Chuỗi `handover.foc_approver` (ô chọn người duyệt) và `approval.pin_*` (PIN) trái BR-432 / quyết định R2 duyệt bằng mật khẩu | Giao diện sai quy tắc duyệt | UXD sửa (E05-07) |
| R-6 | Mọi BR-6xx còn nhãn PHÁP LÝ (ESC-001 – luật sư rà trước dữ liệu thật) | Hạn khai báo, hạn lưu ảnh có thể đổi | Đã viết theo tham số, đổi không sửa code (US-042 AC3) |

## 5. Đề nghị gửi vai khác (chi tiết ở mục 7 EP03-05 và mục 9 EP06)
- **ARC**: E03-01…05, E04-01…03, E05-01…05, E06-01…07 (gom thành OpenAPI 0.3.3). E06-06 phải qua **SEC** (ĐK-2: thêm trường vào `OnlineCheckin`).
- **DOM**: E05-06 (a–d), E06-08 (G-1, G-2, G-3, G-7).
- **SEC**: E06-09 (G-8, câu rút đồng ý ĐK-5, danh sách chuỗi cấm R2, thời gian tự ẩn/xóa clipboard).
- **UXD**: E05-07, E06-10 (chuỗi mới VI/EN, sửa chuỗi lệch).
- **QA**: E05-08, E06-11 (đồng hồ giả lập cho BR-412/425/602/603/609, test ĐK-2/ĐK-3, đồng thời ghi thu/gia hạn).

## 6. Việc chưa xong
- Đặc tả EP07/EP08 (PWA buồng phòng, phiếu sửa) và EP14 còn lại (US-108 thông tin lưu trú, US-109/110 yêu cầu khách), EP01 dashboard – làm trong Sprint 2 cho Sprint 4.
- US-137 trả sớm (Should) chỉ có khung (EP03-05 4.6) – viết chi tiết hộp hoàn khi PO kéo vào sprint.
- Chờ review bắt buộc DOM, ARC (khuyến nghị QA) cho hai file – `reviews/DOM-on-BA.md`, `ARC-on-BA.md`; sẽ cập nhật specs khi ARC trả lời E-xx.
- Không tạo ESC mới: các điểm pháp lý đã nằm trong ESC-001 (luật sư); các điểm còn lại thuộc DOM/SEC/ARC nội bộ.
