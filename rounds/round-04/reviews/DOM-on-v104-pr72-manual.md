# DOM review – PR #72 `v104/ba-docs-r4c`: sách hướng dẫn v1.0.4, lượt 4c

- Người review: DOM | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Tác giả: BA. Bản đọc là `git diff origin/main...origin/v104/ba-docs-r4c -- product/docs/manual/`, head `11794c25`, gốc chung `06626ead`. Có 4 tệp:
  - `user-manual-v1.0.md` (sổ tay);
  - `guides/00-index.md`;
  - `guides/01-chu-dau-tu-quan-ly.md`;
  - `guides/02-le-tan.md`.
- Diff gồm cả các lượt nháp trước (`b7ab5d23`, `6831f9fd`, `fbaaac23`, `ebb14cb0`). DOM đọc hết, nhưng tập trung vào 5 điểm ORC giao. Phần giá đã gõ (#70), giá thỏa thuận (#75), OTA để trống ô giá (#73) và cột **Nguồn giá** (#82) khớp các câu DOM đã trả lời trước (ARC-03/UXD-05, DOM điểm 3, BR-103 v0.5.4), nên không có thẻ mới.
- Số dòng ghi trong file này là số dòng của tệp trên nhánh PR.
- Mã đối chiếu ở `main` `0c41cda2`, đã có mọi PR mã của v1.0.4:
  - `frontdesk/internal/checkin.service.ts` dòng 368–411 (`amountDueAtCheckinVnd` dòng 369, `roomOverridable` dòng 387, `balance_paid` dòng 409);
  - `frontdesk/internal/checkout.service.ts` dòng 654–686 (`postMidnight`, `departure`) và 1629–1636 (giờ gõ so với đồng hồ máy chủ);
  - `inventory/public/minibar-checkout.port.ts` dòng 50–95 (`fridgeState`) và 308–352 (`uncheckedRooms`);
  - `folio/internal/folio-lines.service.ts` dòng 422–490 (A31 nhận giá 0);
  - `reservations/internal/allowed-actions.ts` dòng 107–119; `stay.service.ts` dòng 848–850 (`stayScope` mặc định `whole_stay`);
  - admin-web: `CheckOutPage.tsx` dòng 372, 509–511, 1310–1345, 1788–1790; `foc.tsx` dòng 205, 310–321; `BookingDialog.tsx` dòng 539–566;
  - `strings-vi.json` (khóa nêu ở từng mục). App nhân viên (`apps/mobile/src`) không có màn đếm minibar, chỉ có việc `minibar_refill`.
- DOM chỉ đọc mã, không chạy stack.

## Phán quyết: **ĐẠT CÓ ĐIỀU KIỆN**

Kết quả theo 5 điểm ORC giao:

| # | Điểm | Kết quả |
|---|---|---|
| 1 | Nhận phòng vào căn còn khách | Đúng |
| 2 | Minibar hai tủ | Phần tả Desk đúng. Nhưng phần này va với bước **Đổi phòng** cũ, nên lễ tân có thể tính minibar căn cũ hai lần: **Major 02** |
| 3 | Khách ở quá hạn, trường hợp (b) | Đúng với mã. Thiếu ô **Loại** (Minor 03) và 4 chi tiết vận hành (Minor 04) |
| 4 | Đơn Nội bộ theo BR-105 | Đúng, trừ mốc của (4): phải xong **trước khi nhận phòng**, không phải trước khi trả phòng: **Major 01**. Lỗi gốc nằm ở BR-105 v0.5.8 của DOM; DOM đã sửa ở v0.5.9 |
| 5 | 3 dòng quản lý ở `01` 14.1 | Dòng 1 sửa theo thẻ 01. Dòng 2 thiếu bước kiểm chứng trước khi duyệt giảm 100 % (Minor 05). Dòng 3 đúng |

- **2 Major phải sửa trước khi gộp #72.** Cả hai chỉ sửa chữ.
- **4 Minor:**
  - 03, 04, 05 nên sửa cùng lần;
  - 06 ngoài phạm vi #72, làm PR sách riêng trước cắt bản 06/11 18:00.
- Không có ESC mới.
- Một nghi lỗi sản phẩm ngoài sách: trả phòng sau 24:00 của ngày đi. Xem mục 4, ghi chú 3.

---

## 1. Kết quả kiểm theo 5 điểm

| # | Điểm | Kết quả | Căn cứ |
|---|---|---|---|
| 1 | Nhận phòng vào căn còn khách: sổ tay 2.10 (dòng 1071), `02` 7.4 (dòng 620), `01` 4 (dòng 407), `02` dòng 1510 | **Đúng.** Sổ tay tả đúng cái Desk làm: dòng **Buồng sẵn sàng (VI hoặc VC)** hiện khung đỏ, không có ô **Lý do**, chỉ còn **Đổi căn / đổi ngày**. Câu chặn trích đúng nguyên văn. Thứ tự (1)(2)(3) theo DOM lượt 7 mục 3. Đơn quá ngày đi thì Gia hạn rồi Trả phòng (BR-402 v0.5.7). Không dùng **Khóa phòng** để đặt lại trạng thái. Có bước kiểm căn trước ngoại lệ `VD`/`CL` (SEC-BE-PR74-02). Không thấy chỗ nào làm sai tiền hay sai trạng thái căn | `checkin.service.ts` 383–387 (`roomOverridable = room && !holder && VD/CL`); chuỗi `checkin.cond.room_ready`, `checkin.room_held_code`, `checkin.room_status_stuck`, `drawer.action.move` |
| 2 | Minibar hai tủ: sổ tay 2.14 bước 2 (dòng 1226–1231), `02` 11.1 bước 2 (dòng 855–861) | **Phần tả Desk đúng.** Đúng nhãn **Tủ minibar cần đếm**, **Căn … (đã chuyển đi)** / **(đang ở)**. Tủ căn cũ đứng trước. Đúng nút **Tiếp tục: Tủ căn …**, câu "Đã lưu số đếm tủ căn …", **Tủ căn … cần đếm lại**, câu `MINIBAR_NOT_CHECKED` và nút **Quay lại**. **Nhưng** phần này va với bước **Đổi phòng** cũ (`02` 9.4, sổ tay 2.12): ở đó minibar căn cũ ghi bằng **Thêm phát sinh**. Câu mới "Desk mở sẵn tủ căn cũ: đếm tủ đó trước" lại bảo đếm tủ căn cũ lúc trả phòng. Hệ quả là tính hai lần, hoặc đếm một tủ đã bổ sung, có khi đã có khách khác. Xem **Major 02** | chuỗi `co.minibar_*`; `minibar-checkout.port.ts` `uncheckedRooms` (B18 đòi đếm mọi tủ của lượt ở); `03` mục 7 "Tạm ở v1.0: app nhân viên chưa có màn đếm minibar" |
| 3 | Khách ở quá hạn (b): sổ tay 2.14 (dòng 1257–1266), `02` 11.1 (dòng 888–897) | **Đúng với mã.** Chi tiết ở bảng ngay sau. Còn thiếu: ô **Loại** (Minor 03); xóa mã cửa ngay, khai báo lưu trú, "hôm nay" trước 06:00, khách mới đang chờ căn (Minor 04) | `CheckOutPage.tsx` 372, 509–511, 1788–1790; `checkout.service.ts` 654–686, 1629–1636 |
| 4 | Đơn Nội bộ: sổ tay 2.5 bước 4 (dòng 852–857), `02` 5.1 bước 4 (dòng 337–342) | **Đúng** ở các ý (1), (2), (3), (5), (7) của BR-105: câu Desk trích đúng (`booking.error.rate_empty_internal`, `booking.error.rate_zero_internal`); đường A31 và nhãn đúng; "không dùng FOC, không giảm 100 %" đúng; khối "tới v1.0.3" đúng (BUG-R4-046). **Mốc của ý (4) sai**: sổ tay ghi "muộn nhất trước khi trả phòng", nhưng Desk thu đủ tiền phòng lúc nhận phòng. Xem **Major 01** | `checkin.service.ts` 368–370, 408–411; `folio-lines.service.ts` 422–490; `BookingDialog.tsx` 539–566 |
| 5 | `01` 14.1 (dòng 865–867) | Dòng 1: sửa theo thẻ 01. Dòng 2: thiếu bước kiểm chứng trước khi duyệt giảm 100 % (Minor 05). Dòng 3 (căn vẫn hiện có khách sau khi đơn trước đã trả phòng): **đúng** DOM lượt 7 mục 3 | – |

Chi tiết điểm 3 (giờ trả phòng ở trường hợp (b)):

| Trường hợp | Desk làm gì | Kết quả |
|---|---|---|
| Không gõ gì | Giờ Desk điền là giờ bấm. Giờ gửi lên = ngày đi của đơn (sau gia hạn) + giờ đó | – |
| Gõ giờ muộn hơn lúc bấm | Desk báo `TIME_AFTER_ACTION` | Không nhận |
| Gõ giờ sớm hơn lúc bấm quá ngưỡng | Desk bắt **Ghi chú giờ trả** | Sổ tay đã dặn |
| Từ 12:00 gõ 12:00 | Không phụ thu | Đúng |
| Làm lúc 00:00–05:59 | Giờ điền sẵn rơi vào cửa sổ sau nửa đêm của ngày đi mới | Cũng 0 đ, không sai tiền |

---

## 2. Thẻ feedback

### FB-R4-DOM-BA-PR72-01
- Mức độ: **Major** (sai tiền; sửa trước khi gộp #72)
- Vị trí:
  - sổ tay 2.5 bước 4, gạch **Đơn Nội bộ có cả đêm thu và đêm miễn phí** và gạch "Lễ tân và lễ tân trưởng không sửa được về 0" (dòng 854–855);
  - `02` 5.1 bước 4, cùng hai gạch (dòng 339–340);
  - `01` 14.1 dòng 1 (dòng 865);
  - dòng lịch sử bản ở `00` và `02` "Lập:" ("trả phòng mà đêm miễn phí chưa về 0 thì gọi quản lý trước khi thu").
- Ba câu sai mốc:
  - "Làm ngay sau khi tạo đơn, muộn nhất trước khi trả phòng."
  - "Tới lúc trả phòng mà đêm đó vẫn chưa về 0: dừng ở bước **Bill & thu tiền**, gọi quản lý sửa rồi mới thu."
  - "Làm trước khi trả phòng: sau khi trả phòng Desk không nhận giá 0 nữa."
- Vấn đề:
  - **Desk thu đủ tiền phòng lúc nhận phòng, với mọi kênh trừ OTA trả trước.** Điều kiện `balance_paid` ở `checkin.service.ts` 368–370 tính `amountDueAtCheckinVnd = còn phải thu − tiền dư + phụ thu nhận sớm/đêm B9a − notYetDue`. `notYetDue` chỉ khác 0 với đơn OTA trả trước. Đơn Nội bộ có thu không được miễn điều kiện này.
  - Vì vậy đêm miễn phí chưa về 0 lúc nhận phòng thì bị thu luôn.
  - Tới bước **Bill & thu tiền** lúc trả phòng, tiền phòng đã thu xong. Quản lý sửa về 0 lúc này thì đêm đó thành tiền trả thừa. Desk báo "Khách đã trả thừa … Chọn cách xử lý." (`02` 11.1 bước 6), và khoản hoàn phải có người duyệt. Câu "dừng ở bước Bill, gọi quản lý sửa rồi mới thu" vì vậy không chặn được gì.
  - Phụ thu nhận sớm cũng tính theo giá đêm đầu tại lúc nhận phòng. Đêm đầu miễn phí mà sửa sau khi nhận phòng thì dòng phụ thu đã ghi theo giá cũ, trái BR-105 (5).
- Ví dụ (căn 202 của BR-105): 3 đêm 12–15/11, gõ 300.000 × 3, đêm 14/11 miễn phí.
  - Quản lý chưa sửa: ngày 12/11 Desk đòi thu **900.000** mới cho nhận phòng.
  - Ngày 15/11 quản lý sửa đêm 14/11 về 0: tiền trả thừa **300.000**, phải tạo yêu cầu hoàn, quản lý hoặc chủ đầu tư duyệt.
  - Đúng ra: quản lý sửa trước 12/11, Desk thu **600.000**.
- Lỗi gốc: BR-105 (4) v0.5.8 do DOM viết ghi "làm trước khi trả phòng". **DOM đã sửa ở BR-105 v0.5.9** (chưa commit; validator 0 lỗi, 1 cảnh báo có từ trước).
- Vì sao quan trọng: lễ tân làm đúng sách mà vẫn thu thừa tiền của người nhà nhân viên, rồi tốn thêm một lần hoàn có duyệt. Với đêm đầu miễn phí còn ghi sai phụ thu nhận sớm.
- Đề xuất sửa (giữ nguyên các câu khác):
  - Gạch **Đơn Nội bộ có cả đêm thu và đêm miễn phí** (sổ tay, `02`): thay "Làm ngay sau khi tạo đơn, muộn nhất trước khi trả phòng." bằng:
    > Làm ngay sau khi tạo đơn, muộn nhất **trước khi nhận phòng**: lúc nhận phòng Desk thu đủ tiền phòng, kể cả đêm chưa về 0.
  - Gạch "Lễ tân và lễ tân trưởng không sửa được về 0": thay câu "Tới lúc trả phòng …" bằng:
    > Tới lúc **nhận phòng** mà đêm đó chưa về 0 (Folio còn tiền của đêm miễn phí): **chưa thu**. Gọi quản lý hoặc chủ đầu tư sửa (làm được từ xa trên Desk), kiểm lại **Còn phải thu**, rồi mới thu và nhận phòng. Không liên lạc được ai: thu đúng số Desk đòi, ghi sổ giao ca "OTM-…: thu dư … cho đêm miễn phí dd/mm, chờ quản lý sửa 0 đ". Quản lý sửa trước khi trả phòng. Lúc trả phòng, bước **Bill & thu tiền** báo khách trả thừa: hoàn phần dư như mục 11.1 bước 6 (sổ tay 2.14 bước 6).
  - Gạch "Đêm đầu hoặc đêm cuối đã về 0…", thêm câu:
    > Đêm đầu miễn phí mà khách nhận sớm: đêm đó phải về 0 trước khi nhận phòng thì phụ thu nhận sớm mới là 0.
  - `01` 14.1 dòng 1: thay "Làm trước khi trả phòng: sau khi trả phòng Desk không nhận giá 0 nữa." bằng:
    > Làm ngay khi nhận tin, **trước khi người ở nhận phòng**: lúc nhận phòng Desk thu đủ tiền phòng. Sửa sau khi đã thu thì phần đó thành tiền trả thừa, hoàn lúc trả phòng. Sau khi trả phòng Desk không nhận giá 0 nữa.
  - Dòng lịch sử bản: thay "trả phòng mà đêm miễn phí chưa về 0 thì gọi quản lý trước khi thu" bằng "nhận phòng mà đêm miễn phí chưa về 0 thì chưa thu, gọi quản lý sửa (DOM #72 thẻ 01, BR-105 v0.5.9)".
- Trạng thái: Closed (BA Fixed @ `e200fea1`; DOM đọc lại 05/11 – xem lượt 2, mục 7)

### FB-R4-DOM-BA-PR72-02
- Mức độ: **Major** (sai tiền; sửa trước khi gộp #72)
- Vị trí:
  - (a) bước đổi phòng, có từ trước, đang ở `main`:
    - `02` 9.4 bước 5, gạch đầu (dòng 771);
    - sổ tay 2.12 **Đổi phòng khi đang ở**, bước 4 (dòng 1167).
    - Câu: "Nhờ buồng phòng đếm minibar căn cũ. Món đã dùng ghi vào folio ngay bằng **Thêm phát sinh**."
  - (b) khối mới hai tủ:
    - `02` 11.1 bước 2 (dòng 856);
    - sổ tay 2.14 bước 2 (dòng 1226).
    - Câu: "Desk mở sẵn tủ căn cũ: đếm tủ đó trước."
  - (c) `03-buong-phong.md` mục 7 (dòng 226): "Khách đổi phòng: lễ tân nhờ đếm minibar căn cũ. Đếm và báo số như trên." Tệp này ngoài diff.
- Vấn đề:
  1. **Ở v1.0.x, số đếm minibar chỉ ghi được ở bước Minibar của trang Trả phòng.**
     - App nhân viên không có màn đếm (`03` mục 7).
     - Desk không có lối đếm lúc **Đổi phòng**.
     - Vì vậy tủ căn cũ luôn còn "chưa đếm" tới lúc trả phòng. B18 đòi đếm mọi tủ của lượt ở (`uncheckedRooms`, lý do `never_counted`), và từ v1.0.4 Desk mở sẵn tủ đó.
  2. **Tính hai lần.** Lễ tân làm theo 9.4 thì đã ghi món căn cũ bằng **Thêm phát sinh**. Lúc trả phòng, khối mới lại bảo:
     - nhập số đếm tủ căn cũ;
     - "không bấm **Không dùng gì – tủ đủ** khi chưa có số";
     - "bill phải có minibar của cả hai tủ".
     - Kết quả: món của căn cũ bị tính hai lần. Ví dụ BR-703, khách đổi 202 → 203 và đã dùng 2 bia ở 202 (70.000). Lúc đổi, lễ tân ghi **Thêm phát sinh** 70.000. Lúc trả phòng, lễ tân nhập 202 còn 0/2, Desk tính thêm 70.000. Khách trả **140.000** cho 2 bia.
  3. **Đếm nhầm tủ.** "Đếm tủ đó trước" lúc trả phòng, có khi vài ngày sau khi đổi:
     - lúc đó tủ căn cũ đã được dọn, có thể đã bổ sung, có thể đã có khách khác ở;
     - tủ đã bổ sung thì khách đổi phòng không bị tính gì, OTTIMO mất tiền;
     - khách mới đã dùng thì món của khách mới bị tính cho khách đổi phòng, và lễ tân phải gõ cửa phòng khách khác.
  4. **Không ai bổ sung tủ căn cũ ngay.** Việc **Bổ sung minibar** chỉ sinh khi có lần đếm có dùng (BR-703), tức là sau khi khách trả phòng. Nếu căn cũ bán cho khách mới với tủ còn thiếu, lúc khách mới trả phòng Desk tính các món thiếu cho khách mới, vì "chuẩn" của khách mới là mức tủ lúc nhận phòng (BR-702).
- Vì sao quan trọng:
  - sai tiền theo cả hai chiều, có khi tính nhầm người;
  - đổi phòng giữa kỳ ở OTTIMO không hiếm (nước nóng, ồn, khách xin đổi hạng);
  - khối mới v1.0.4 làm rủi ro này dễ xảy ra hơn, vì nó bảo lễ tân đếm tủ căn cũ lúc trả phòng.
- Đề xuất sửa:
  - `02` 9.4 bước 5 và sổ tay 2.12 Đổi phòng bước 4: thay gạch minibar bằng:
    > Nhờ buồng phòng đếm minibar căn cũ **ngay, trước khi dọn**, báo **số còn lại từng món**. Ghi sổ giao ca: "OTM-… đổi 202 → 203 lúc hh:mm dd/mm – minibar 202 còn: Bia Đà Lạt 0/2, snack 1/1 (người đếm)". Không ghi tên khách. **Không** ghi minibar căn cũ bằng **Thêm phát sinh**: lúc trả phòng, Desk hỏi tủ căn cũ và tính tiền một lần. Báo buồng phòng **bổ sung đủ tủ căn cũ** khi dọn, trước khi căn đó nhận khách mới.
  - Khối hai tủ (`02` 11.1 bước 2, sổ tay 2.14 bước 2): thay "Desk mở sẵn tủ căn cũ: đếm tủ đó trước." bằng:
    > Desk mở sẵn tủ căn cũ: **nhập số còn lại đã ghi lúc đổi phòng** (sổ giao ca). **Không** đếm lại tủ căn cũ lúc trả phòng: tủ đó đã dọn, đã bổ sung, có thể đã có khách khác. Sổ giao ca không có số: hỏi buồng phòng. Vẫn không có: hỏi khách đã dùng gì ở căn cũ, nhập theo lời khách, ghi chú "chưa đếm", báo quản lý. Folio đã có dòng **Thêm phát sinh** minibar căn cũ (ghi theo cách cũ): vẫn nhập số tủ căn cũ, rồi trước khi thu, **Bỏ cả dòng** phát sinh đó (**Folio & điều chỉnh** → **Điều chỉnh**), lý do "Trùng minibar tủ căn cũ". Desk không cho bỏ thì báo quản lý. Tủ căn đang ở: đếm như thường.

    BA kiểm vai nào bấm được **Bỏ cả dòng** với dòng phát sinh. Theo RBAC A31, lễ tân được sửa dòng.
  - `03` mục 7, dòng "Khách đổi phòng": thay bằng:
    > Khách đổi phòng: đếm minibar căn cũ **trước khi dọn**, báo lễ tân số còn lại từng món như trên. Báo xong thì **bổ sung đủ tủ** căn cũ khi dọn. Sau khi khách trả phòng, Desk có thể tạo việc **Bổ sung minibar** cho căn cũ: kiểm tủ, đủ thì bấm **Làm xong**.

    BA thêm `03` vào PR và lên bản.
  - Khối "tới v1.0.3" (BUG-R4-042) giữ nguyên. Ở v1.0.3 lỗi là chuyện tủ thứ hai, còn chuyện tính hai lần do 9.4 có ở cả hai bản. Câu sửa 9.4 áp dụng ngay.
- QA kiểm (không chặn gộp): làm ca BR-703 202 → 203 trên stack.
  - Đổi phòng, không ghi **Thêm phát sinh**.
  - Trả phòng: nhập tủ 202 còn 0/2, tủ 203 đủ.
  - Kỳ vọng: minibar 70.000, một dòng. Việc bổ sung tủ 202 sinh sau khi trả phòng.
- Trạng thái: Closed (BA Fixed @ `e200fea1`; DOM đọc lại 05/11 – xem lượt 2, mục 7)

### FB-R4-DOM-BA-PR72-03
- Mức độ: Minor (sửa cùng lần với 01, 02)
- Vị trí:
  - khối **Đơn quá ngày đi**, trường hợp (b): `02` 11.1 (dòng 893), sổ tay 2.14 (dòng 1262);
  - `02` 9.5 bước 2 (dòng 781), sổ tay 2.12 **Miễn phí, giảm giá** bước 2 (dòng 1184). Hai chỗ này có từ trước.
- Vấn đề:
  - Với dòng tiền phòng, hộp **Miễn phí · …** có ô **Loại** với hai lựa chọn, **mặc định là Miễn khoản phát sinh (FOC)** (`foc.tsx` 205 `useState('foc')`, 310–321).
  - Mục 9.5 bước 2 ghi "Loại do dòng quyết định: … dòng tiền phòng → giảm giá đặc biệt". Câu này sai với Desk.
  - Khối (b) không nhắc ô **Loại**, nên lễ tân sẽ để mặc định, và yêu cầu thành FOC.
- Vì sao quan trọng: BR-421 (b) và BR-431 gọi khoản này là **giảm giá đặc biệt**, tức giảm tiền phòng ngoài chính sách. FOC trên dòng phòng chỉ dành cho đêm bù sự cố. Chọn sai loại không đổi số tiền, nhưng có hai hệ quả:
  - báo cáo FOC tháng xếp sai loại;
  - DATA khó lọc các đêm "quên bấm", trong khi BR-421 v0.5.7 nói DATA nhận diện chúng qua giảm giá đặc biệt và lý do.
- Đề xuất:
  - Khối (b): ngay sau "**Mở form miễn phí / giảm giá**", thêm "→ **Loại**: **Giảm giá đặc biệt (tiền phòng)**".
  - 9.5 bước 2 (cả sổ tay), thay bằng:
    > Dòng phát sinh: Desk để miễn phí (FOC). Dòng tiền phòng: có ô **Loại**, mặc định **Miễn khoản phát sinh (FOC)** – chọn **Giảm giá đặc biệt (tiền phòng)**, trừ đêm bù sự cố của OTTIMO (để FOC, lý do **Bù sự cố**).
- Trạng thái: Closed (BA Fixed @ `e200fea1`; DOM đọc lại 05/11 – xem lượt 2, mục 7)

### FB-R4-DOM-BA-PR72-04
- Mức độ: Minor (sửa cùng lần)
- Vị trí: khối **Đơn quá ngày đi**: `02` 11.1 bước 1–3 (dòng 889–893), sổ tay 2.14 (dòng 1258–1262).
- Vấn đề: cách làm đúng tiền, nhưng thiếu 4 chi tiết vận hành.
  1. **Mã cửa còn hiệu lực.**
     - Ở (b), khách đã đi từ ngày đi mà chưa bấm Trả phòng, nên mã cửa của khách trên app khóa thường chưa xóa.
     - "Trả phòng như các bước trên" chỉ nhắc xóa mã ở hộp Hoàn tất, tức sau khi có kết quả duyệt.
     - Trong lúc đó, người có mã cũ vẫn mở được căn mà khách mới sắp vào.
  2. **Khai báo lưu trú.**
     - Hộp Gia hạn ghi "khách nước ngoài cần cập nhật khai báo trong ngày" (`extend.effects`).
     - Ở (b), ngày đi thật là ngày đi cũ. Nếu lễ tân làm theo hộp Gia hạn, cổng khai báo sẽ ghi sai ngày khách rời.
  3. **"Hôm nay" lúc 00:00–05:59.**
     - Ca đêm hay gặp đơn quá hạn khi khách xe đêm tới.
     - Lúc 04:30 ngày 25/11, ngày làm việc của Desk vẫn là 24/11. Đơn có ngày đi 23/11 chỉ cần **Ở thêm 1** đêm.
     - Lễ tân đếm theo lịch sẽ gõ 2 đêm (tới 25/11). Khi đó thừa 1 đêm, phải xin giảm thêm, và nút Trả phòng không hiện tới 06:00. Đêm 24/11 bị chiếm, nên khách xe đêm cũng không nhận phòng trước 06:00 được (B9a).
  4. **Khách mới đang chờ căn.**
     - Ở (b), phải có kết quả duyệt mới hoàn tất được.
     - Trong lúc đó, khách mới của căn bị chặn nhận phòng (BR-402).
     - Sổ tay chưa nói lễ tân làm gì với khách đang đứng chờ.
- Vì sao quan trọng: (1) là an ninh khách. (2) là dữ liệu gửi cơ quan công an. (3) làm thừa đêm và kẹt ca đêm. (4) là khách đứng chờ ở quầy.
- Đề xuất, thêm vào khối **Đơn quá ngày đi**:
  - Bước 1, thêm:
    > (b) khách đã đi: **xóa mã cửa** của khách trên app khóa ngay, không chờ duyệt; ghi sổ giao ca.
  - Bước 2, thêm:
    > Kiểm dòng **Ngày đi đổi thành …** là ngày hôm nay. Trước 06:00, "hôm nay" là ngày hôm qua theo lịch. Ví dụ 04:30 ngày 25/11, ngày đi 23/11: **Ở thêm** 1 đêm, ngày đi đổi thành 24/11.
  - Trường hợp (b), thêm:
    > Không cập nhật ngày đi mới lên cổng khai báo lưu trú, dù hộp Gia hạn nhắc. Ngày khách rời là ngày đi trên đơn cũ: chưa ghi thì ghi ngày đó, và ghi sổ giao ca là ghi trễ.

    Hạn và cách ghi trễ trên cổng khai báo cần chủ đầu tư hoặc luật sư xác nhận, như BR mục 15. Sổ tay chỉ dặn "ghi đúng ngày rời thật".
  - Trường hợp (b), thêm:
    > Khách của căn này đang chờ: gọi quản lý duyệt ngay, không chỉ chờ thông báo. Chờ lâu thì **Đổi căn / đổi ngày** cho khách mới sang căn trống sẵn sàng (mục 6.1).
- Trạng thái: Closed (BA Fixed @ `e200fea1`; DOM đọc lại 05/11 – xem lượt 2, mục 7)

### FB-R4-DOM-BA-PR72-05
- Mức độ: Minor (sửa cùng lần)
- Vị trí: `01` 14.1 dòng 2 (dòng 866). Câu hiện tại: "Hỏi buồng phòng hoặc xem sổ giao ca khách đi ngày nào. Khách đã đi đúng ngày: duyệt…"
- Vấn đề:
  - Đây là khoản giảm 100 % tiền phòng, và người giải thích là chính người gửi yêu cầu (lễ tân đã quên bấm).
  - Câu chỉ cần một nguồn, và sổ giao ca cũng do lễ tân ghi.
  - Đây là lối dễ lạm dụng: cho người quen ở đêm đó, rồi xin giảm "quên bấm". Mỗi lần là trọn một đêm phòng, ví dụ Studio 800.000.
- Vì sao quan trọng: thất thoát doanh thu. Cảnh báo BR-435 chỉ báo khi tổng vượt 3 % doanh thu tháng, tức là đã muộn.
- Đề xuất: thay hai câu trên bằng:
  > Duyệt khi có **ít nhất hai** dấu hiệu khách đã đi đúng ngày: buồng phòng xác nhận căn trống hoặc đã dọn từ ngày đó; thẻ hoặc chìa đã trả; app khóa (nếu có nhật ký mở cửa) không có lần mở bằng mã của khách sau ngày đi; sổ giao ca ngày đó. Còn nghi: từ chối, lễ tân thu đêm thêm như (a), hoặc báo chủ đầu tư. Cùng một người gửi lý do này nhiều lần trong tháng: báo chủ đầu tư. Kiểm mã cửa của khách đã xóa.
- Trạng thái: Closed (BA Fixed @ `e200fea1`; DOM đọc lại 05/11 – xem lượt 2, mục 7)

### FB-R4-DOM-BA-PR72-06
- Mức độ: Minor (ngoài phạm vi #72; PR sách riêng, trước cắt bản 06/11 18:00)
- Vị trí: các câu có từ trước, đang ở `main`.
  - Tăng giá cuối tuần và ngày đặc biệt:
    - sổ tay dòng 299 ("Desk **tự cộng** … +15 % … +30 %") và bảng tóm tắt dòng 1827;
    - `02` bảng dòng 1730;
    - `01` dòng 613.
  - Phụ thu trẻ 6–11 tuổi 100.000:
    - sổ tay 2.12 **Thêm người đi cùng** (dòng 1138) và bảng dòng 1834;
    - `02` 9.2 bước 3 (dòng 737) và bảng dòng 1736.
- Vấn đề: chủ đầu tư quyết ESC-045 ngày 01/11, nhưng sách vẫn dạy giá cũ.
  - Câu 1 (BR-104 v0.5.1): một giá mọi đêm, không tăng cuối tuần và ngày lễ. Danh sách ngày đặc biệt chỉ còn dùng cho ở tối thiểu 2 đêm (BR-113) và không hoàn cọc (BR-309).
  - Câu 3 (BR-110 v0.5.1): từ 6 tuổi trở lên 150.000/đêm.
  - Sách vẫn ghi +15 %, +30 % và 100.000.
  - Desk tính theo tham số production `weekend_uplift_pct`, `special_uplift_pct`, `child_fee_6_11`. Các số này chỉ về giá mới khi chủ đầu tư làm bước B1, B2, B8 của `rounds/round-04/outputs/DOM/inv-price-switch-guide.md`. Repo chưa có xác nhận đã làm (DOM lượt 8 mục 4.1).
- Vì sao quan trọng: lễ tân báo giá miệng và qua Zalo theo sách. Khách sẽ nghe "cuối tuần đắt hơn" và "trẻ 8 tuổi 100.000", trái quyết định của chủ đầu tư và lời hứa một giá của OTTIMO. Nếu production đã chuyển giá, Desk sẽ ra số khác lời lễ tân, và khách khiếu nại.
- Ý kiến về chỗ xử lý (câu BA hỏi):
  - **Không sửa trong #72.** BA đúng: phần này ngoài phạm vi, và không nên giữ #72 lại vì nó.
  - BA làm **một PR sách nhỏ riêng** trước cắt bản.
  - Cùng lúc, ORC gửi chủ đầu tư câu kiểm 1 phút ở DOM lượt 8 mục 4.1, **thêm dòng B8**: `child_fee_6_11` phải là 150.000.
  - Chữ PR theo chính sách đã chốt, không phụ thuộc kết quả kiểm. Chủ đầu tư trả lời còn 15 / 30 / 100.000 thì làm B1, B2, B8 trước; chữ sách vẫn đúng. Gợi ý chữ:
    > Một giá mọi đêm, kể cả thứ Sáu, thứ Bảy, lễ, Tết (từ ngày chủ đầu tư chuyển giá, ESC-045). Ngày đặc biệt vẫn: ở tối thiểu 2 đêm, không hoàn cọc khi hủy. Báo giá thử Studio 1 đêm thứ Sáu ra khác 800.000: dừng, báo quản lý, không tự sửa giá.
    >
    > Phụ thu người vượt định mức: từ 6 tuổi trở lên 150.000 đ/đêm; dưới 6 tuổi miễn.
  - Nếu chủ đầu tư bật lại mức tăng Noel – Tết (BR-104: báo trước 15/12), BA sửa lại sách cùng lúc với Desk và OTA.
- Trạng thái: Closed (chuyển sang PR #85 `v104/ba-esc045-prices` @ `f11e928c`; DOM review riêng ở `DOM-on-v104-pr85-prices.md` – xem lượt 2)

---

## 3. Ý kiến về 3 chỗ BA nêu

| Chỗ | Ý kiến DOM | Xử lý ở đâu |
|---|---|---|
| (i) Mục +15 %/+30 % cuối tuần, ngày đặc biệt | Trái BR-104 v0.5.1. Cùng gốc với câu trẻ 6–11 tuổi 100.000 (ESC-045 câu 3), nên làm cùng | PR sách riêng (BA) trước cắt bản; ORC gửi câu kiểm tham số, thêm B8. Thẻ 06 |
| (ii) Chữ phụ dưới ô giá A31 (`folio.adjust_night_help`: "Ngoài sàn–trần… thấp hơn sàn thì xin giảm giá đặc biệt") với đêm Nội bộ | Không sai tiền: Desk vẫn lưu 0 cho đêm Nội bộ. Chỉ quản lý và chủ đầu tư thấy câu này, và `01` 14.1 dòng 1 đã nói rõ "không áp, 0 lưu được, không dùng FOC hay giảm 100 %". Rủi ro còn lại: người duyệt làm theo câu phụ, xin giảm giá đặc biệt, nên đêm vào báo cáo FOC và BR-435 thay vì thành đêm miễn phí. Sổ tay đã chặn rủi ro này | **v1.0.5**: UXD viết câu riêng cho đêm của đơn Nội bộ (ý: "Đêm của đơn Nội bộ: không áp sàn–trần; nhập 0 nếu đêm này miễn phí"); FE chọn câu theo kênh (1 chuỗi, 1 nhánh). PO xếp backlog. Không cần cho v1.0.4 |
| (iii) SEC-BE-PR74-02: khách quay về căn cũ | **Đồng ý cách BA**: bước kiểm căn tận nơi đủ cho v1.0.4. DOM xác nhận Desk và app không gửi `stayScope`; máy chủ mặc định `whole_stay` (`stay.service.ts` 848–850). Vì vậy ca "ngày về căn cũ chưa ghi" không xảy ra được từ giao diện ở v1.0.4. Ca thật hay gặp hơn là đổi phòng trong hôm nay mà khách chưa dọn hết đồ khỏi căn cũ: căn cũ `VD`, không còn lượt nào giữ căn, nên ngoại lệ vẫn mở. Câu của BA bắt đúng ca này | Mã: v1.0.5, cùng ARC-PR74-04/05 (BE). Khi FE thêm nút "chuyển tới hết đơn gốc" hoặc "đã chuyển về", BA thêm bước ghi. **SEC đóng được phần sổ tay.** Thêm một ý nhỏ cho 9.4 (không cần thẻ): bấm **Đổi sang căn …** khi khách đã sẵn sàng chuyển; buồng phòng chỉ dọn căn cũ khi khách đã ra hết đồ |

---

## 4. Ghi chú cho ORC

1. **BR-105 v0.5.9 – DOM đã sửa, chưa commit.**
   - Ý (4): hạn sửa đêm miễn phí về 0 là "trước khi nhận phòng", thay cho "trước khi trả phòng".
   - Thêm cách làm khi tới lúc nhận phòng mà chưa sửa.
   - Ví dụ căn 202 thêm hai số 900.000 / 300.000.
   - Có dòng đề xuất decision-log ở mục 17 và lịch sử ở mục 18 của tệp BR.
   - Không đổi con số nào. Validator `product/tests/tools/validate-fixtures.mjs`: 0 lỗi, 1 cảnh báo có từ trước.
   - BA dẫn BR v0.5.9 khi sửa thẻ 01.
2. **Thứ tự sửa:**
   - thẻ 01 và 02 (Major) sửa trong #72 trước khi gộp;
   - thẻ 03, 04, 05 sửa cùng lần, chỉ chữ;
   - thẻ 06 làm PR sách riêng;
   - thẻ 02 có sửa `03-buong-phong.md`, BA thêm tệp này vào PR.
   - Câu 9.4 ở thẻ 02 **áp dụng ngay** trên production (v1.0.3 cũng tính hai lần). Nếu #72 chưa kịp gộp, ORC gửi câu đó cho INV cùng các câu dặn lễ tân khác.
3. **Nghi lỗi sản phẩm, đề nghị QA dựng ca trên stack đồng hồ giả.** DOM chỉ đọc mã, chưa chạy.
   - Ca: trả phòng sau 24:00 của ngày đi, ví dụ khách đi xe đêm 00:30.
   - Cách Desk dựng giờ: luôn lấy **ngày đi của đơn** + giờ gõ (`CheckOutPage.tsx` 509–511, 1788–1790).
   - Ví dụ: ngày đi 24/11, lễ tân bấm Trả phòng lúc 00:20 ngày 25/11. Ngày làm việc vẫn là 24/11, nên Desk có nút.
     - Giờ điền sẵn 00:20 thành "00:20 ngày 24/11", tức cửa sổ sau nửa đêm của chính ngày đi.
     - Máy chủ chấp nhận (`checkout.service.ts` 682–683), không phụ thu, **không tính đêm thêm**. Desk chỉ đòi ghi chú giờ, vì giờ ghi sớm hơn lúc bấm 24 giờ.
     - Theo BR-416, rời sau 18:00 ngày đi thì thêm 1 đêm, hoặc phụ thu thay đêm có quản lý xác nhận. Với Studio là mất 800.000.
   - Xe đêm Đà Lạt – Sài Gòn chạy 22:00–01:00, nên ca này có thật ở OTTIMO.
   - Mức DOM đề xuất: **P2** (sai tiền, ít gặp). QA chốt mức.
   - Hướng sửa (ARC, FE): khi giờ gõ trước 06:00, chọn thời điểm gần nhất mà không muộn hơn lúc bấm, trong khoảng 00:00 ngày đi tới 06:00 hôm sau. Cách này giữ đúng ca "khách đi 04:30, trả phòng trên Desk từ 06:00" của PR #68.
   - Nếu QA xác nhận và chưa kịp sửa, sổ tay thêm câu: "Khách ở tới sau 24:00 của ngày đi: làm **Trả phòng** trước 24:00, giờ trả là giờ bấm; đêm thêm hoặc phụ thu theo mục 11.3, 11.4."
4. **Kiểm của QA (không chặn gộp):**
   - Thẻ 01: tạo đơn Nội bộ 3 × 300.000, chưa sửa đêm thứ ba. Lúc nhận phòng Desk phải đòi 900.000. Quản lý sửa về 0 trước khi nhận phòng thì Desk đòi 600.000.
   - Thẻ 02: ca BR-703, như ghi ở thẻ.
5. Không có ESC mới. Việc chủ đầu tư phải làm vẫn là kiểm tham số (DOM lượt 8 mục 4.1), nay thêm B8. Đây không phải quyết định mới.

---

## 5. Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **DOM – review PR #72 @ `11794c25` (sách v1.0.4, lượt 4c): ĐẠT CÓ ĐK.** 2 Major sửa trước khi gộp: PR72-01 – đêm miễn phí của đơn Nội bộ phải về 0 **trước khi nhận phòng** (BR-105 v0.5.9); PR72-02 – minibar căn cũ khi đổi phòng không ghi **Thêm phát sinh**, số còn lại ghi sổ giao ca rồi nhập lúc trả phòng, không đếm lại tủ căn cũ lúc trả phòng, buồng phòng bổ sung tủ căn cũ ngay (sửa cả `03` mục 7). Minor 03 (ô **Loại** = Giảm giá đặc biệt), 04 (quá hạn (b): xóa mã cửa ngay, khai báo lưu trú ghi ngày rời thật, "hôm nay" trước 06:00, khách mới đang chờ), 05 (quản lý cần hai dấu hiệu trước khi duyệt giảm 100 % "Quên bấm"), 06 (ESC-045 câu 1, 3 chưa vào sách – PR sách riêng trước cắt). Ý kiến 3 chỗ BA nêu: (i) PR riêng; (ii) chữ phụ A31 cho đêm Nội bộ ở v1.0.5; (iii) SEC-BE-PR74-02 giữ bước kiểm căn, SEC đóng phần sổ tay | DOM | Đọc mã `main` `0c41cda2`: `balance_paid` mọi kênh trừ OTA trả trước; số đếm minibar chỉ ghi được ở trang Trả phòng; `foc.tsx` mặc định FOC |
| 2026-11-05 | 4 | **BR-105 v0.5.9** (DOM): đêm miễn phí của đơn Nội bộ có thu được quản lý hoặc chủ đầu tư sửa về 0 (A31) **trước khi nhận phòng**. Tới lúc nhận phòng mà chưa sửa: lễ tân chưa thu, gọi quản lý sửa từ xa; không liên lạc được thì thu đủ, phần dư xử lý như tiền trả thừa khi trả phòng | DOM | v0.5.8 ghi "trước khi trả phòng" là sai mốc, gây thu thừa (ví dụ 300.000) |
| 2026-11-05 | 4 | **ORC (đề xuất)** – câu kiểm tham số gửi INV (DOM lượt 8 mục 4.1) thêm B8: `child_fee_6_11` = 150.000. BA làm PR sách riêng cho ESC-045 câu 1 và 3 trước cắt 06/11 18:00. QA dựng ca "trả phòng sau 24:00 của ngày đi" (nghi lỗi, DOM đề xuất P2) | ORC | DOM #72 thẻ 06, mục 4 ghi chú 3 |

---

## 6. Điểm làm tốt nên giữ

1. Mục 2.10 và `02` 7.4 tả đúng cái Desk v1.0.4 làm với từng ca chặn: có mã đơn, căn kẹt trạng thái, `OOO`. Thứ tự (1)(2)(3) giúp lễ tân biết mở đơn nào trước. Bước kiểm căn thật trước ngoại lệ `VD`/`CL` bắt được cả ca đổi phòng dở dang, không chỉ ca SEC nêu.
2. Khối **Đơn quá ngày đi** viết theo đúng hành vi máy chủ:
   - trước 12:00 giữ giờ Desk điền, từ 12:00 gõ 12:00;
   - có câu về ghi chú giờ;
   - có ví dụ 800.000 / 0;
   - có chú thích nguồn ẩn trỏ tới TC-V104-RG-26.
3. Khối Nội bộ trích đúng nguyên văn câu Desk, tách rõ "tới v1.0.3" với "từ v1.0.4", và có chú thích nguồn ẩn. Lễ tân đọc là làm được ngay.

---

## 7. DOM lượt 2 – PR #72 @ `e200fea1` (05/11/2026)

- Bản đọc: `git diff 11794c25..origin/v104/ba-docs-r4c -- product/docs/manual/` (5 tệp: sổ tay, `00`, `01`, `02`, `03`; 106 dòng thêm, 59 dòng bớt) và bảng trả lời `rounds/round-04/reviews/BA-reply-v104-pr72.md` trên nhánh. Số dòng dưới đây là số dòng trên nhánh @ `e200fea1`.
- Mã đối chiếu ở `main` `ff2560f1`:
  - `admin-web/src/pages/stay/FolioDialog.tsx` dòng 60–68 (`canAdjust = !locked && (settled ? mgr : fd)`), 27 và 77–82 (dòng FOC, giảm giá, dòng đã đảo không có nút **Điều chỉnh**);
  - `folio/internal/folio-lines.service.ts` dòng 522 (folio đã trả phòng: chỉ OWN/MGR, `FORBIDDEN_ACTION`), 553 (dòng `foc`/`discount`/`adjustment` hoặc đã đảo: `INVALID_TRANSITION`);
  - `frontdesk/internal/checkout.service.ts` dòng 981 và 1252 (yêu cầu duyệt còn chờ thì chặn hoàn tất, `PENDING_APPROVALS`).

### Phán quyết lượt 2: **ĐẠT** – gộp được

6/6 thẻ DOM đóng đúng (06 chuyển sang #85). Có 1 thẻ Minor mới (07), không chặn gộp. Giả định SEC-04 của BA: DOM xác nhận và đã ghi vào BR-105 (8), v0.5.10.

| Thẻ | Mức | Đã sửa ở | DOM kiểm | Kết quả |
|---|---|---|---|---|
| PR72-01 | Major | `02` 5.1 bước 4 (339–341); sổ tay 2.5 bước 4 (855–857); `01` 14.1 (866) | Hạn sửa là "muộn nhất **trước khi nhận phòng**". Tới lúc nhận phòng mà đêm chưa về 0: **chưa thu**, gọi quản lý. Không gọi được ai: thu đủ, ghi sổ giao ca, hoàn phần dư ở bước Bill. Có câu cho ca đêm đầu miễn phí mà khách nhận sớm. Khớp BR-105 (4) v0.5.9 và điều kiện `balance_paid` | Closed |
| PR72-02 | Major | `02` 9.4 bước 5 (782), 11.1 bước 2 (868–881); sổ tay 2.12 **Đổi phòng** bước 4 (1179), 2.14 bước 2 (1239–1252); `03` mục 7 (226) | (i) Không ghi **Thêm phát sinh**. Số còn lại ghi vào sổ giao ca, mẫu câu không có tên khách. (ii) Lúc trả phòng nhập số đã ghi, không đếm lại tủ căn cũ. (iii) **Kiểm trùng trước khi bấm Trả phòng**, lễ tân **Bỏ cả dòng** khi folio còn mở: đúng mã. `canAdjust` cho lễ tân trở lên khi folio `open`; máy chủ chỉ đòi OWN/MGR khi folio đã `settled`. Folio còn mở tới lúc hoàn tất **Trả phòng**, nên lễ tân làm được. Dòng **Đồ ăn uống** không thuộc nhóm bị khóa. Câu "Desk không cho bỏ thì báo quản lý" phủ ca dòng đã đảo. (iv) Xem bill có khoản minibar của cả hai tủ và không còn dòng trùng. (v) `03`: buồng phòng đếm trước khi dọn và bổ sung ngay; việc **Bổ sung minibar** sau trả phòng chỉ còn là kiểm lại | Closed |
| PR72-03 | Minor | sổ tay 2.12 **Miễn phí, giảm giá** bước 2; `02` 9.5 bước 2; khối (b) bước con 1; `01` 14.1 | Chọn **Giảm giá đặc biệt (tiền phòng)**. Câu nói rõ Desk chọn sẵn FOC, phải đổi. Người duyệt từ chối yêu cầu loại FOC. Khớp `foc.tsx` (`useState('foc')`) | Closed |
| PR72-04 | Minor | khối **Đơn quá ngày đi** (`02` 903–914, sổ tay 1273–1285); `02` 8.3 và 9.3 bước 4; sổ tay 2.11 và 2.12 **Gia hạn** bước 4 | Đủ 5 ý: xóa mã ngay; kiểm "Ngày đi đổi thành …" (ví dụ 04:30 ngày 25/11 → 24/11, đúng ngày làm việc BR-010); không kéo dài mã; khai báo ngày rời thật, không dán ô ngày đi Desk hiện; khách mới đang chờ. Bước "Chờ duyệt … Desk chưa cho hoàn tất" đúng mã (`PENDING_APPROVALS`). Câu "hạn ghi trễ: hỏi quản lý": DOM đồng ý, không đặt quy tắc mới | Closed |
| PR72-05 | Minor | `01` 14.1 (867) | Cần ít nhất hai dấu hiệu, 4 dấu hiệu đúng thực tế. Từ 2 đêm thì chủ đầu tư duyệt, khớp hạn mức 1 đêm của BR-421 (b). Có câu cho ca một người gửi nhiều lần trong tháng. Có câu kiểm mã đã xóa | Closed |
| PR72-06 | Minor | chuyển sang PR #85 | Xem `DOM-on-v104-pr85-prices.md` | Closed ở #72 |

### Giả định của BA ở SEC-04: DOM xác nhận, đã ghi BR-105 (8) v0.5.10

1. Giả định "chỉ chủ đầu tư hoặc quản lý được cho dùng phòng Nội bộ" **đúng chuẩn ngành**: phòng dùng nội bộ hay phòng tặng (house use / complimentary) cần tổng quản lý hoặc chủ duyệt. Ở OTTIMO quy định này càng cần, vì kênh Nội bộ bỏ qua sàn–trần và bậc giá (BR-105 v0.5.8). Nếu lễ tân trưởng tự cho được thì đó là đường giảm giá không qua duyệt.
2. Quy định áp cho **mọi** đơn Nội bộ, kể cả đơn có thu. Câu sách hiện tại ("Chỉ tạo khi chủ đầu tư hoặc quản lý đã đồng ý. **Ghi chú nội bộ** ghi người cho, lý do, số đêm miễn phí.") đứng đầu gạch Nội bộ nên đã phủ đủ, **không cần sửa chữ**. Lần sửa sách tới, BA thêm "BR-105 (8) v0.5.10" vào chú thích nguồn ẩn (không chặn).
3. Desk v1.0.x **không** chặn theo vai: lễ tân vẫn chọn được kênh Nội bộ. Kiểm soát dựa vào quy định, Ghi chú nội bộ, và người tạo ghi trên đơn. Đề xuất PO đưa vào backlog v1.0.5 trở đi (không gấp): Desk chỉ cho lễ tân trưởng trở lên chọn kênh Nội bộ, hoặc gửi yêu cầu duyệt cho OWN/MGR như FOC.
4. Không cần ESC. Chủ đầu tư muốn chặt hơn (chỉ chủ đầu tư được cho) thì báo qua `/feedback`, không phải sửa mã.

### Thẻ mới

### FB-R4-DOM-BA-PR72-07
- Mức độ: Minor
- Vị trí: `01` 14.1, dòng "Đơn Nội bộ có đêm miễn phí…" (866); `02` 5.1 bước 4 gạch thứ hai (340); sổ tay 2.5 bước 4 gạch thứ hai (856). Đây là nhánh "Không liên lạc được ai".
- Vấn đề: ca đêm đầu miễn phí chỉ được sửa về 0 **sau** khi người ở đã nhận phòng sớm. Lúc nhận phòng, Desk đã ghi dòng **phụ thu nhận sớm** theo giá đêm đầu lúc đó. Sửa giá đêm về 0 (A31) không tính lại dòng phụ thu này (`folio-lines.service.ts` không đụng dòng `early_checkin`). Sách mới nói phần dư tiền phòng thành tiền trả thừa, còn dòng phụ thu nhận sớm vẫn bị thu thừa.
- Vì sao quan trọng: thu thừa người được cho phòng. Ví dụ gõ 800.000, nhận 10:30 → 240.000 (theo bậc 30 % sau khi chuyển giá). Số nhỏ và ca hiếm (đơn Nội bộ trộn, đêm đầu miễn phí, nhận sớm, không gọi được ai), nên không chặn gộp.
- Đề xuất sửa: thêm một câu vào dòng `01` 14.1: "Sửa đêm đầu về 0 sau khi người ở đã nhận phòng sớm: Folio còn dòng phụ thu nhận sớm tính theo giá cũ → dòng đó → **Điều chỉnh** → **Bỏ cả dòng**, **Lý do điều chỉnh** 'Đêm đầu miễn phí – đơn Nội bộ'." BA làm cùng commit bổ sung của #85 nếu kịp trước 06/11 18:00, không thì để v1.0.5.
- Trạng thái: Open

### Dòng decision-log đề xuất (lượt 2, ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **DOM – #72 lượt 2 @ `e200fea1`: ĐẠT, gộp được.** Đóng DOM-01..05: đọc diff `11794c25..e200fea1` và mã. FolioDialog `canAdjust`: lễ tân **Bỏ cả dòng** được khi folio còn mở, máy chủ chỉ đòi OWN/MGR sau trả phòng. Yêu cầu giảm còn chờ duyệt thì chặn hoàn tất trả phòng. DOM-06 chuyển sang #85. Thẻ mới PR72-07 Minor: đêm đầu Nội bộ về 0 sau khi đã nhận phòng sớm thì dòng phụ thu nhận sớm vẫn theo giá cũ; không chặn gộp | DOM | Review lượt 2 |
| 2026-11-05 | 4 | **BR-105 (8) v0.5.10** (DOM xác nhận giả định BA ở SEC-04): mọi đơn Nội bộ, miễn phí hay có thu, chỉ tạo khi chủ đầu tư hoặc quản lý đã đồng ý. Ghi chú nội bộ ghi người cho, lý do, số đêm miễn phí. Desk v1.0.x không chặn theo vai; PO xếp việc chặn hoặc gửi duyệt ở bản sau. BR-421: ngưỡng dài hạn khi gia hạn theo BR-108 (30 đêm từ ngày chuyển giá) | DOM | Kênh Nội bộ bỏ qua sàn–trần và bậc giá; chuẩn ngành house use / complimentary; SEC đồng ý hướng chặt hơn |
