# DOM review – PR #120 (V5-58 Wi-Fi trên Desk, phía máy chủ)

- Người review: DOM | Round 5 – Review nghiệp vụ | Ngày: 07/11/2026
- Đã đọc: PR #120, nhánh `r5-v5-58` @ **`b790b09f`** (BE-D), qua `gh pr view` và `gh pr diff`. Không chạy test.
- Đối chiếu:
  - BR-012 (7) (ESC-022 B: một mạng chung "OTTIMO BOUTIQUE STAY", một mật khẩu, chủ đầu tư hoặc quản lý được giao nhập);
  - BR-808 (thẻ chào và thẻ Wi-Fi trong căn), BR-978 (Wi-Fi chỉ từ lúc nhận phòng);
  - `rules-v1.0.5.md` 7.5 (lễ tân đọc được Wi-Fi);
  - hợp đồng 0.3.13 `getPropertyWifi`, `setPropertyWifi` (bổ sung 1, 1d, 1e, 1f);
  - sổ tay `user-manual-v1.0.md`, các câu "Lỗi đang sửa – Wi-Fi".
- Không có dữ liệu khách, không có mật khẩu: tệp này chỉ dùng chuỗi giữ chỗ.

## 0. Kết luận

**DUYỆT** (nghiệp vụ) @ `b790b09f`. Không có lỗi chặn.

Ba điểm BE-D nhờ DOM:
- **Đồng ý** điểm 2 (ai là nhân viên cơ sở) và điểm 3 (lưu lại giá trị cũ vẫn ghi và vẫn có audit).
- **Đồng ý cho v1.0.5** điểm 1 (số căn phải đứng thành từ riêng mới bị chặn). Cách đọc này đúng chữ hợp đồng, nhưng hẹp hơn BR-012 (7). DOM đề xuất nới ở 0.3.14 (thẻ 120-01).

| Thẻ | Mức | Gửi |
|---|---|---|
| FB-R5-DOM-ARC-120-01 | Minor, cho 0.3.14 | ARC, BE-D |
| FB-R5-DOM-BA-120-02 | Minor, việc tài liệu khi phần Desk của V5-58 lên | BA, PO |
| FB-R5-DOM-UXD-120-03 | Suggestion | UXD, FE-A |

HEAD có thể đổi khi tác giả merge main. Commit chỉ merge main thì không cần DOM đọc lại; đổi luật kiểm thì cần.

## 1. Ba điểm BE-D hỏi

### 1.1 Số căn chỉ bị từ chối khi đứng thành từ riêng

PR làm:
- tách `ssid` thành từ ở mọi ký tự không phải chữ hoặc số;
- từ nào trùng số căn của cơ sở thì 422 `NOT_ALLOWED`.

Kết quả:

| `ssid` | Kết quả |
|---|---|
| `OTTIMO 401`, `ottimo-202`, `101` | bị chặn |
| `OTTIMO401` | được lưu |
| `OTTIMO 2026` | được lưu |

Đánh giá:
- Đúng chữ hợp đồng ("như một từ riêng (ví dụ `OTTIMO 401`)"). Cách tách từ tránh đúng lỗi chặn nhầm cần tránh: năm `2026` chứa `202`, nếu so theo chuỗi con thì tên `OTTIMO 2026` bị chặn oan.
- Nhưng BR-012 (7) viết "**không** chứa số căn". Người đọc `OTTIMO401` hiểu ngay đó là căn 401, `P401` hay `Room202` cũng vậy. Ranh giới đúng về nghiệp vụ là **số căn không dính với chữ số khác**, chứ không phải "đứng giữa hai khoảng trắng":
  - `OTTIMO401`, `P401`, `Room-202` → chặn;
  - `OTTIMO 2026`, `OTTIMO 5G` → không chặn.
- Rủi ro ở OTTIMO hiện nay thấp, nên không chặn PR:
  - chỉ có một mạng chung, tên "OTTIMO BOUTIQUE STAY" (ESC-022 B);
  - chỉ chủ đầu tư và quản lý sửa được;
  - Desk có bước xác nhận "Khách sẽ thấy: tên mạng …" trước khi lưu.

### FB-R5-DOM-ARC-120-01
- Mức độ: Minor (không chặn #120; làm ở 0.3.14)
- Vị trí: hợp đồng `setPropertyWifi`, câu "chứa một số căn của cơ sở như một từ riêng"; mã `ssidWords` và `ssidHasRoomNumber` trong `platform/internal/property-wifi.ts`.
- Vấn đề: tên dính chữ như `OTTIMO401` vẫn lưu được, trong khi BR-012 (7) cấm mọi tên mạng có số căn.
- Vì sao quan trọng: tên mạng là chữ ai đứng gần cũng thấy, không riêng khách của căn. Lý do BR-012 (7) là tên mạng không được cho biết căn nào. Hôm nay OTTIMO dùng một mạng chung nên chưa ảnh hưởng. Nhưng nếu sau này có mạng riêng từng căn, thì `OTTIMO401` chính là kiểu tên dễ được đặt nhất.
- Đề xuất sửa:
  - ARC sửa câu ở 0.3.14: "Số căn chỉ gồm chữ số: bị từ chối khi xuất hiện mà không dính với chữ số khác (trước và sau nó không phải chữ số). Số căn có chữ: giữ luật từ riêng."
  - Ví dụ cho QA (căn 101, 202, 401):

    | `ssid` | Kết quả |
    |---|---|
    | `OTTIMO401` | chặn |
    | `P-202` | chặn |
    | `OTTIMO 2026` | được |
    | `OTTIMO 4012` | được |
    | `OTTIMO BOUTIQUE STAY` | được |

  - BE-D đổi một hàm, không cần migration.
  - DOM ghi ví dụ vào BR-012 (7) khi ARC chốt chữ.
- Trạng thái: Open (ARC, BE-D)

### 1.2 "Nhân viên cơ sở" là người có bất kỳ vai nào ở cơ sở

PR làm:
- so `ssid` (không phân biệt hoa thường) với tên đăng nhập của mọi tài khoản có dòng vai ở cơ sở này;
- tính cả tài khoản đã khóa và vai đã thu hồi.

Đánh giá: **đúng nghiệp vụ, giữ như vậy.**
- Tên mạng là chữ phát cho mọi người. Lộ bất kỳ tên đăng nhập nào của OTTIMO Desk đều giúp người ngoài đoán tài khoản. Vai nào cũng vậy: buồng phòng, kỹ thuật, sale, CTV, kể cả tài khoản đã nghỉ (tài khoản đó có thể được mở lại).
- Ở OTTIMO, tài khoản đang trực giữ 6 vai. Vẫn tính, vì đó là một tên đăng nhập.
- Tài khoản chỉ có vai ở cơ sở khác cùng tổ chức thì không so. Đúng cho hôm nay, vì OTTIMO có một cơ sở. Khi có cơ sở thứ hai, ARC xem lại cùng SEC; DOM không đòi việc gì.

### 1.3 Lưu lại đúng giá trị cũ vẫn ghi và vẫn có audit

PR làm: PUT với cùng `ssid` và mật khẩu vẫn `version + 1`, vẫn ghi audit `property.wifi_changed`, trong đó `before.ssid` = `after.ssid` và `passwordChanged: false`.

Đánh giá: **đúng nghiệp vụ.**
- Việc đổi Wi-Fi rất hiếm. Một lần "lưu lại" cho biết ai đã kiểm lại cấu hình, lúc nào. Thông tin này có ích sau khi bộ phát bị đặt lại, hoặc khi khách báo không vào được mạng.
- Không cần chặn và không cần bỏ dòng. Chỉ cần chữ trên Nhật ký nói rõ là không đổi gì (thẻ 120-03).
- Lần nhập đầu ghi `passwordChanged: true`, kể cả khi để trống mật khẩu. Đúng nghĩa "đã đặt mật khẩu lần đầu".

## 2. Các giả định khác trong thân PR

| Giả định | Đánh giá nghiệp vụ |
|---|---|
| Lễ tân, lễ tân trưởng đọc được, chỉ chủ đầu tư và quản lý sửa (S36, A101) | Đúng DOM 7.5 và BR-012 (7). Buồng phòng không đọc: khách hỏi trong căn thì xem thẻ Wi-Fi |
| Trang khách đọc ngay ở lần tải sau, không cần sửa đơn; hiện từ ngày đến (T58-1) | Đúng BR-012 (7) "đổi mật khẩu áp ngay cho mọi khách đang ở" và BR-978 |
| Mạng mở (mật khẩu trống) được lưu | Hợp đồng cho phép. Chính sách OTTIMO là có mật khẩu (ESC-022 B). Rủi ro là lỡ xóa ô rồi lưu: trang khách hiện "mạng mở", bộ phát vẫn đòi mật khẩu. Desk phải nói rõ trước khi lưu (thẻ 120-03) |
| Mật khẩu không bỏ khoảng trắng đầu/cuối | Đúng. Mật khẩu WPA2 có thể chứa khoảng trắng và phải khớp bộ phát từng ký tự |
| Người sau ghi đè, không `If-Match` | Chấp nhận được. Chỉ hai người sửa, rất hiếm, audit giữ `before.ssid` |
| Không báo khách, không phát SSE, không có thông báo cho quầy | Đúng hợp đồng. Hệ quả: khi chủ đầu tư đổi mật khẩu, quầy không được báo. Việc báo khách đang ở phải nằm trong quy trình (thẻ 120-02) |
| Mật khẩu Wi-Fi trùng mật khẩu đăng nhập của chính người gọi → 422; quá 5 lần trong 24 giờ thì bỏ qua phép so, vẫn lưu | Nghiệp vụ không bị cản: chủ đầu tư vẫn lưu được mật khẩu hợp lệ. Câu lỗi chỉ hiện khi gõ trùng mật khẩu Desk của chính mình. Phần bảo mật SEC xét |

## 3. Việc khi phần Desk lên

PR này chỉ là phía máy chủ. Ô nhập trên Desk (FE-A) chưa có PR. Gộp #120 mà chưa có phần Desk thì người dùng không thấy gì khác: sổ tay và release notes giữ nguyên tới khi cả hai cùng lên một bản.

### FB-R5-DOM-BA-120-02
- Mức độ: Minor (việc tài liệu và việc ngày lên bản; không chặn PR)
- Vị trí:
  - `product/docs/manual/user-manual-v1.0.md`: khối "Lỗi đang sửa – Wi-Fi (sửa ở v1.0.3 hoặc v1.0.4)" ở mục 1.4; các câu Wi-Fi ở mục trang khách, bảng "Khách hỏi Wi-Fi", tờ hỏi nhanh, bảng giới hạn đã biết;
  - `guides/` tương ứng;
  - `release-notes.md` dòng V5-58;
  - danh sách việc ngày lên bản của PO.
- Vấn đề:
  1. Các câu "sửa ở v1.0.3 hoặc v1.0.4" đã cũ, và sẽ sai khi phần Desk lên.
  2. Sổ tay chưa có quy trình **đổi Wi-Fi**.
  3. Production chưa có Wi-Fi (trang khách đang ghi "hỏi lễ tân"), nên ngày lên bản phải có người nhập lần đầu.
- Vì sao quan trọng:
  - check-in online đã mở lại, nên khách sẽ tìm Wi-Fi trên trang khách;
  - đổi mật khẩu mà không báo khách đang ở (có khách dài hạn) thì cả cơ sở mất mạng cùng lúc, và quầy không được hệ thống báo.
- Đề xuất sửa (BA viết, PO đưa vào danh sách ngày lên bản):
  - **Ngày lên bản có ô Wi-Fi:** chủ đầu tư nhập tên mạng và mật khẩu trên Desk, rồi mở trang khách của một đơn đang ở để kiểm (đọc trên màn hình, không chụp ảnh, không chép ra chat).
  - **Quy trình đổi mật khẩu Wi-Fi** (sổ tay, phần chủ đầu tư và quản lý):
    1. Chọn giờ vắng khách.
    2. Đổi trên bộ phát trước, rồi lưu trên Desk ngay sau đó, cùng một lượt. Lưu trên Desk trước thì trang khách hiện mật khẩu bộ phát chưa nhận.
    3. Mở trang khách thử một đơn.
    4. Báo lễ tân. Lễ tân báo mọi khách đang ở, kể cả dài hạn, qua kênh đang dùng với từng khách (BR-012 (7)): "Mật khẩu Wi-Fi mới đã có trên trang khách".
    5. Thay thẻ Wi-Fi trong căn (BR-808): căn trống thay ngay; căn có khách thay lúc dọn, hoặc đưa thẻ ở quầy.
    6. Không ghi mật khẩu vào sổ giao ca, tin nhắn nội bộ hay ảnh chụp.
  - **Lễ tân khi khách hỏi Wi-Fi:** đọc trên Desk. Bỏ câu "Desk chưa có ô nhập".
  - Bỏ hoặc sửa mọi câu "Lỗi đang sửa – Wi-Fi" khi phần Desk lên. Phần Desk không kịp v1.0.5 thì sửa chữ "v1.0.3 hoặc v1.0.4" thành "v1.0.6".
- Trạng thái: Open (BA, PO; ORC báo khi phần Desk có PR)

### FB-R5-DOM-UXD-120-03
- Mức độ: Suggestion (cho phần Desk của V5-58)
- Vị trí: `copy-v1.0.5.md` phần Wi-Fi; nhãn `property.wifi_changed` trên **Nhật ký thao tác**.
- Vấn đề và đề xuất (DOM đặt nghĩa, UXD viết chữ):
  1. **Bước xác nhận khi mật khẩu trống:** hợp đồng đã có bước "Khách sẽ thấy: tên mạng …, mật khẩu …". Khi ô mật khẩu trống, câu phải nói rõ "**Mạng mở, không có mật khẩu**", kèm câu nhắc "Chỉ chọn khi bộ phát cũng để mạng mở". Không để chỗ mật khẩu trống mà không có chữ.
  2. **Nhãn audit:**
     - `before.ssid` = `after.ssid` và `passwordChanged: false`: hiện "Lưu lại Wi-Fi, không đổi";
     - `passwordChanged: true`: hiện "Đổi mật khẩu Wi-Fi";
     - tên đổi: hiện "Đổi tên mạng: … → …".

     Chủ đầu tư đọc nhật ký sẽ không tưởng mật khẩu bị đổi khi thật ra không.
  3. Mật khẩu hiện trên Desk bằng JetBrains Mono, như các chỗ hiện mã và Wi-Fi khác (brand guideline), để thấy được khoảng trắng và phân biệt `l`, `1`, `O`, `0`.
- Trạng thái: Open (UXD, FE-A)

## 4. Điểm tốt

- Trang khách và Desk đọc Wi-Fi bằng **một** hàm `wifiOf`. Lễ tân đọc trên Desk đúng chữ khách thấy.
- Có ca chặn nhầm `OTTIMO 2026`: chứng tỏ BE đã nghĩ tới năm, không chỉ tới số căn.
- Lỗi 422 không lặp lại giá trị đã gửi, và PUT không trả mật khẩu.
- Ca T58-1 kiểm luôn trang khách của một đơn đang ở thấy giá trị mới.

## 5. Giả định

1. Phần Desk (FE-A) lên cùng bản với #120. Nếu chỉ #120 lên thì thẻ 120-02 chờ.
2. Production chưa có giá trị Wi-Fi: sổ tay đang ghi trang khách hiện "hỏi lễ tân". DOM không đọc dữ liệu production.
3. OTTIMO có một cơ sở và chỉ có số căn gồm chữ số (101–402).

Dòng decision-log đề xuất (ORC ghi):

`| 2026-11-07 | 5 | DOM review nghiệp vụ #120 @ b790b09f (BE-D V5-58 Wi-Fi trên Desk) DUYỆT: nhân viên cơ sở = mọi tài khoản có vai ở cơ sở, kể cả đã khóa và vai đã thu hồi – đồng ý; lưu lại cùng giá trị vẫn ghi và vẫn audit – đồng ý; số căn chỉ chặn khi đứng thành từ riêng – chấp nhận cho v1.0.5 (đúng chữ hợp đồng); ARC-120-01 Minor 0.3.14: chặn số căn không dính chữ số khác (OTTIMO401 chặn, OTTIMO 2026 được); BA-120-02 Minor: nhập Wi-Fi lần đầu ngày lên bản, quy trình đổi mật khẩu (bộ phát trước, báo khách đang ở, thay thẻ trong căn), bỏ câu "Lỗi đang sửa – Wi-Fi" khi phần Desk lên; UXD-120-03 Suggestion: câu "Mạng mở" khi mật khẩu trống, nhãn audit "Lưu lại Wi-Fi, không đổi" | DOM | Không ESC |`
