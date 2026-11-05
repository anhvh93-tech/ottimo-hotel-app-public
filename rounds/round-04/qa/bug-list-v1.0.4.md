# Danh sách lỗi – v1.0.4, QA lượt local 1

- Tác giả: QA | Round 4 – v1.0.4 – Bước **Kiểm thử** (kéo sớm, chạy local) | 04/11/2026 18:00–19:00 giờ VN
- Bản thử: `origin/main` @ `40825ee1` (đủ 22 PR của v1.0.4). Stack dùng một lần `ottimo-qa104` trong worktree tạm (đã dọn). Chi tiết chạy: `rounds/round-04/qa/v1.0.4-local-run-1.md`.
- Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8 (QA quyết, không hạ vì tiến độ).
- Mã tiếp theo sau `BUG-R4-028` của `rounds/round-04/qa/bug-list.md`. Khi gộp vào tệp chính, ORC cấp lại số nếu đã có luồng khác dùng các số này.
- Dữ liệu: chỉ DS-E (tài khoản `qa.*`, khách giả, email `@example.test`). Không bí mật, không số tài khoản thật. Ảnh bằng chứng nằm ngoài repo (scratchpad), chưa che QR, nên **không commit** (RG-06).
- Có **năm lỗi P0** đã ghi. Từ 05/11 01:30 còn **ba** P0 mở ở `main` và production (037, 038, 046), vì BUG-R4-041 hạ P2 khi khóa tạm #75 đạt. Từ 05/11 02:30 có thêm BUG-R4-048, chỉ nằm trên nhánh #83, chưa vào `main`:
  - BUG-R4-037, thêm 04/11 khuya. Lỗi có từ trước v1.0.1, nên đang ở production. Từ 05/11 00:35: **đã sửa – đã gộp vào `main` @ `d0ea6dc2`, đạt local, chờ STG**.
  - BUG-R4-038, thêm 04/11 khuya. Lỗi có từ trước production. DOM đề xuất P2, QA chốt P0 theo luật lỗi tiền. ORC giữ **P0**, sửa trong v1.0.4. Từ 04/11 23:15: **đã sửa – chờ gộp #71**. 05/11 01:00: phần đổi ở head `02c34bc9` đạt.
  - BUG-R4-041, thêm 04/11 khuya. Lỗi có từ trước v1.0.1, đang ở production. QA chốt P0 khi chưa có khóa tạm. Từ 05/11 01:00: **đã sửa – chờ gộp #75**, khóa tạm đạt, **hạ P2**.
  - BUG-R4-046, QA3 thêm 05/11 01:30 theo thẻ ARC FB-R4-ARC-FE-PR82-01. Lỗi có từ trước v1.0.1, đang ở production. ARC đề xuất P2, QA chốt **P0** theo luật lỗi tiền. Từ 05/11 02:00: **đã sửa – chờ gộp #82** (QA3 đạt ở `0e48686c`).
  - BUG-R4-048, QA3 thêm 05/11 02:30 theo thẻ ARC FB-R4-ARC-FE-PR83-01. Lỗi do #83 sinh ra, chỉ có trên nhánh `v104/fe-minibar-followup` @ `19cfa3f7`. Chưa vào `main`, không có ở production. ARC ghi Major; QA chốt **P0** theo luật lỗi tiền. Từ 05/11 02:50: **đã sửa – chờ gộp #83** (QA3 đạt ở head `e411cb22`), không còn chặn #83.
- Có **ba lỗi P1** (BUG-R4-036 đã hạ P2 lúc 05/11 08:00, xem dòng dưới):
  - BUG-R4-035, thêm 04/11 tối;
  - ~~BUG-R4-036~~ **đã hạ P2 lúc 05/11 08:00** (ORC): #66 gộp `main` @ `0d11db20`, đủ điều kiện ghi dưới. Trước đó: nâng từ P2 lúc 05/11 05:30 (QA2) theo điều kiện ghi ở mục lỗi: cách làm tạm trong sổ tay (CO-05) không chạy trên Desk. Từ 05/11 06:00, CO-05 bản 0.15 đạt trên `main`. Hạ lại P2 khi #66 gộp (#85 đã gộp `main` `0dd3fcb3`; câu ở #66 @ `99d103a0` khớp, QA2 05/11 07:15). ORC hạ, không cần QA chạy lại;
  - BUG-R4-039, thêm 04/11 khuya. Lỗi có từ trước v1.0.1, nên đang ở production;
  - BUG-R4-042, QA2 thêm 05/11. Lỗi có từ v1.0.1, đang ở production. Từ 05/11 02:00: **đã gộp `main` @ `3e6a762b`, chờ staging** (QA3 đạt ở `054d40c0`). 05/11 02:50: hồi quy trên #83 @ `e411cb22` đạt.
  - Lượt local 1 lúc 19:00 chưa có lỗi P0/P1 nào.
- Cập nhật 04/11 19:30 (QA, bước Phản hồi & sửa): BUG-R4-033/034 đã sửa ở PR #62, chờ merge. BUG-R2-216: mục "Mong đợi" sửa theo UXD. BUG-R2-216/219: PR #60 (UXD đạt) chưa vào `main`, nên chưa chạy lại HD-01/02.
- Cập nhật 04/11 19:45 (QA, bước Kiểm thử, chạy lại):
  - **BUG-R2-216/219: đạt local.** PR #60 đã vào `main` (merge `58183764`, head `c2c2edd2`). QA chạy lại HD-01, HD-02 trên `main` @ `58183764`: stack dùng một lần `ottimo-qahd`, Desk Chromium 1366×768, project `desk-clock`.
    - Kết quả: 4/4 ca đạt, chạy **3 lượt liên tiếp**. Unit `v104-hold-dialog-feb` đạt 4/4.
    - Trạng thái mới: **Đã sửa – đạt local, chờ xác nhận STG** (HD-01/02, 06/11 C3). Chi tiết ở mục của từng lỗi.
  - **Thêm BUG-R4-035 (P1).** Lỗi ở trang Trả phòng: số điền sẵn của tủ minibar có một khoảng hở, nên Desk có thể gửi "tủ đầy" và đảo dòng minibar đã tính. FE-A tái hiện ở CI PR #65; QA xác nhận cơ chế bằng đọc mã trên `main` @ `58183764`. Vì là P1, lỗi phải đóng trước QC. FE-A sửa ở PR `v104/fix-s4-144-flake`, gộp sau #64.
- Cập nhật 04/11 tối (QA): **thêm BUG-R4-036 (P2)**.
  - Lỗi: trong 00:00–05:59, Desk không có lối vào Trả phòng cho khách rời trong cửa sổ sau nửa đêm, dù máy chủ nhận. DOM tìm ra (`DOM-on-v104-pr68-docs.md`); QA đọc lại mã trên `main` @ `58183764`.
  - Mức: DOM/ORC đề xuất P3. QA chốt **P2**, vì đây là thiếu chức năng có cách làm tạm, không phải lỗi chữ hay thẩm mỹ (`test-strategy.md` mục 8). Lý do chi tiết ở mục của lỗi.
  - Dời v1.0.5 có kế hoạch, với điều kiện sổ tay và release notes có cách làm tạm. Test case 0.2 thêm TC-V104-CO-05 để kiểm cách làm tạm trên STG.
- Cập nhật 04/11 khuya (QA, bước Kiểm thử):
  - **BUG-R4-029/030/031: đã sửa – chờ gộp #61.** QA đọc log CI của PR #61 (`v104/ci-turbo-inputs`) và báo cáo OPS trên nhánh. Cả 3 lỗi được sửa. Chi tiết ở mục của từng lỗi.
  - **Chạy tải nặng 2 test admin-web mà OPS báo flaky** (A-20 của `s2-fix.test.tsx`, ca US-139 của `booking.test.tsx`). Worktree tạm từ `origin/main` @ `4bf353da`.

    | Số tiến trình song song | `s2-fix` | `booking` | `s4-144-fea` |
    |---|---|---|---|
    | 6 (như FE-A) | 0/36 đỏ | 0/36 đỏ | – |
    | 16 | 0/32 đỏ | 0/32 đỏ | **1/32 đỏ** |
    | 24 (tải máy ~88) | **3/40 đỏ** | **1/40 đỏ** | – |

  - Hai test này đỏ **vì sản phẩm sai, không phải vì test**. QA ghi **BUG-R4-037 (P0)**: hộp Đặt phòng mới giữ giá điền từ bản xem giá kênh Trực tiếp sau khi lễ tân chuyển sang OTA hoặc Nội bộ.
    - Ở tốc độ người, lỗi xảy ra mọi lần, không cần máy chậm.
    - Lỗi có từ `cf6c5575` (16/10), trước v1.0.1, nên đang ở production. ORC quyết đường hotfix.
  - Lượt đỏ 1/32 của `s4-144-fea` là bằng chứng thêm cho BUG-R4-035: cùng dấu hiệu, mức vẫn P1.
  - QA không sửa mã. Đã xóa test chẩn đoán tạm và worktree.
- Cập nhật 04/11 21:10 (QA, hotfix P0 BUG-R4-037, bước Kiểm thử):
  - QA chạy thử câu truy vấn Q0–Q5 của BE trên stack local dùng một lần: đúng. Kết quả ở mục "QA chạy thử local" của `rounds/round-04/outputs/BE/bug-r4-037-data-impact.md`.
  - **Thêm BUG-R4-038.** Lỗi: gia hạn đơn Nội bộ (B13) ghi đêm thêm theo giá Trực tiếp, không phải 0 đ. Nguồn: mục DOM của tệp BE. QA tái hiện trên stack local.
    - Mức: DOM đề xuất P2. QA chốt **P0**, vì folio của đơn miễn phí bị cộng tiền phòng. Đây là "sai tiền" theo `test-strategy.md` mục 8. Lý do chi tiết ở mục của lỗi.
- Cập nhật 04/11 21:30 (QA, hotfix P0 BUG-R4-037, bước Kiểm thử):
  - **BUG-R4-037: đã sửa – chờ gộp #70.** QA xác minh PR #70 (`v104/fix-booking-rate-carryover` @ `822094b7`) trong worktree tạm và trên stack local dùng một lần. Đạt cả 3 phần:
    - 3 ca tái hiện của QA;
    - tải 24 tiến trình × 40 lượt;
    - Desk thật trên stack.
  - Chi tiết ở mục "Xác minh bản sửa" của lỗi. Test case hồi quy: TC-V104-RG-07…RG-12 (`v1.0.4-test-cases.md` bản 0.3).
  - Chạy lại Q2 và Q4 của BE (khối dán nguyên mới) trên cùng stack: đúng. Kết quả ở mục "QA chạy thử local" của tệp BE.
  - BUG-R4-038: ORC giữ P0, sửa trong v1.0.4 (BE, nhánh `v104/fix-internal-added-night`).
- Cập nhật 04/11 21:55 (QA, bước Kiểm thử): **thêm BUG-R4-039 (P1).**
  - Lỗi: lễ tân trưởng xác nhận được ngoại lệ "buồng chưa sẵn sàng" cho căn **còn đơn Đang ở** (`OC`/`OD`). Vì vậy nhận được đơn thứ hai vào căn đang có khách. Trái BR-402 (1).
  - Nguồn: DOM lượt 3, mục 4 của `rounds/round-04/reviews/DOM-on-v104-pr68-docs.md`. QA tái hiện qua API trên stack local dùng một lần: 5/5 lượt.
  - Mức: DOM đề xuất P1, QA chốt **P1**. Lý do ở mục của lỗi.
  - ORC đã quyết chặn ở máy chủ trong v1.0.4. BE đang sửa trên nhánh `v104/fix-checkin-occupied-exception`.
- Cập nhật 04/11 22:10 (QA, hotfix P0 BUG-R4-037, chạy lại #70 ở head mới `94a28258`, thẻ UXD PR70-01 và PR70-06):
  - **PR70-01 đạt.** Ca mới: OTA để trống ở nhóm căn chưa có `ota_base_rate`.
    - Máy chủ thật trả 422 `VALIDATION_FAILED`, `nightlyRates` `REQUIRED`. Thân lỗi khớp đúng mock trong test của FE.
    - Desk của #70 hiện "Nhập giá mỗi đêm (lớn hơn 0)." và giữ hộp mở.
  - **Thêm BUG-R4-040 (P3, dời v1.0.5, không chặn #70) theo thẻ PR70-06.** Máy chủ trả `RATE_OUT_OF_RANGE` cấp Problem, không kèm `min`/`max`. Desk hiện nguyên chữ `{min}`, `{max}`, `{group}`.
  - Kết quả 3 ca tái hiện và tải 24 × 40 ở mục "Xác minh bản sửa" của BUG-R4-037.
- Cập nhật 04/11 22:30 (QA): **thêm BUG-R4-041.**
  - Lỗi: nút **Giữ chỗ** của hộp Đặt phòng mới bỏ giá đêm lễ tân đã gõ. Vì vậy giữ chỗ và cọc 30 % tính theo giá niêm yết, không theo giá thỏa thuận.
  - Nguồn: DOM, mục "DOM trả lời ARC-03/UXD-05" của `rounds/round-04/reviews/ARC-on-v104-pr70-rate-carryover.md`. QA xác nhận bằng đọc mã và hợp đồng.
  - ORC gọi lỗi này là BUG-R4-040. Nhưng số 040 đã cấp lúc 22:10 cho lỗi câu `{min}`/`{max}`, nên QA cấp **041**.
  - Mức: DOM đề xuất P1 khi không có khóa tạm, P2 khi có. QA chốt:
    - **P0** trong lúc chưa có khóa tạm, vì đây là lỗi sai tiền với khách và không ai được báo, cùng luật với BUG-R4-037;
    - **hạ P2** khi khóa tạm (PR `v104/fe-hold-typed-rate-lock`) vào v1.0.4 và QA xác minh đạt.
  - Lý do ở mục của lỗi.
- Cập nhật 04/11 23:15 (QA, bước Kiểm thử): **BUG-R4-038: đã sửa – chờ gộp #71.**
  - QA xác minh PR #71 (`v104/fix-internal-added-night` @ `7557e485`, CI xanh) trên stack local dùng một lần từ chính nhánh này. 9/9 ca API đạt, gồm B13, B9a, B18, đối chứng Trực tiếp và A31.
  - Q5a của BE chạy nguyên khối sau bản sửa: đơn Nội bộ mới gia hạn **không còn bị đếm**.
  - Hồi quy 3 tệp clock có B9a/B13/B18 (`checkin.s3`, `stay-checkout.s3`, `late-fee-qr.s4`): 76 đạt, 1 bỏ qua, 0 đỏ.
  - QA rà phần sửa `tests/tools/validate-fixtures.mjs` và oracle BR-421-04…11 theo lời nhờ của BE: đạt. Còn thiếu 1 dòng oracle cho B9a Nội bộ, đây là đề xuất, không phải lỗi.
  - Chi tiết ở mục "Xác minh bản sửa" của lỗi.

- Cập nhật 05/11 00:35 (QA, bước Kiểm thử): **BUG-R4-037: đã gộp vào `main` @ `d0ea6dc2`, đạt local, chờ STG.**
  - #70 (head cuối `98d8a3ad`) và #73 (`v104/ota-rate-fallback`, OTA lấy giá niêm yết khi thiếu `ota_base_rate`) đã vào `main` @ `d0ea6dc2`. QA chạy lại toàn bộ xác minh #70 trên `main`, trong worktree tạm và trên stack local dùng một lần dựng từ `d0ea6dc2`.
  - 3 ca tái hiện của QA: xanh 3/3. Tệp `v104-booking-rate-carryover.test.tsx` của FE: 28/28.
  - Desk thật trên stack:
    - đổi kênh sang OTA hoặc Nội bộ thì giá đã gõ bị xóa, câu `booking.rates_cleared_channel` hiện;
    - ở Trực tiếp, đổi sang căn khác nhóm thì giá đã gõ bị xóa, câu `booking.rates_cleared_room_group` hiện, có số căn;
    - đổi sang căn cùng nhóm thì giữ giá đã gõ.
  - Tải 24 × 40: 2 lượt trên `main` với giới hạn mặc định 15 s. Lượt 1: 1/120 đỏ, chỉ là quá giờ của bộ chạy lúc tải 67–81, không có lỗi assert. Lượt 2: 0/120 đỏ ở tải 36–144.
  - TC-V104-RG-13 đổi kỳ vọng theo #73 (ARC nhờ). OTA để trống khi thiếu `ota_base_rate` thì ra 201 theo giá niêm yết. Câu `rate_empty` chỉ còn cho căn thiếu giá niêm yết. Cả 2 nhánh đạt trên stack. Test case bản 0.5 thêm RG-16 (BUG-R4-038) và RG-17 (hai câu báo xóa giá).
  - BUG-R4-041 vẫn tái hiện trên `main`. Điều này đúng kế hoạch, vì khóa tạm nằm ở PR riêng. Lỗi vẫn P0.
  - Chi tiết ở mục "Chạy lại ở head cuối và trên `main`" của BUG-R4-037.
- Cập nhật 05/11 00:45 (QA2, bước Kiểm thử, các stack local dùng một lần, đã dọn):
  - **BUG-R4-035: đã sửa – đã gộp #67** (`main` @ `217afac0`, head `ceda9278`).
    - Gỡ từng phần sửa thì đúng các ca chống tái phát đỏ, ổn định 3/3 lượt, đều là lỗi assert.
    - Tải 12 × 10: lượt đỏ chỉ có ở một đỉnh tải 100–131, đều là quá giờ hoặc kéo theo từ ca quá giờ. Không có lỗi assert do mã sản phẩm.
    - Desk thật: 2 ca đạt. Chi tiết ở mục "Xác minh bản sửa" của lỗi.
  - **BUG-R4-039: đã sửa – chờ gộp #74** (head `9646029d`). C1–C5 đạt. Đối chứng trên `main` @ `d0ea6dc2` (chưa có #74): C1, C2, C5 đỏ như mong đợi.
  - **PR #73 (RG-13): đạt** trên `main` @ `d0ea6dc2` và trên nhánh @ `78ef6196`. Q1 của BE không đếm đơn mới (không dương tính giả).
  - **Thêm BUG-R4-042 (P1).** Trang Trả phòng sau B14: đếm xong tủ thứ hai, Desk quay lại tủ đã đếm khi bản tóm tắt tải lại chậm.
    - Lễ tân bấm "tủ đủ" ở màn đó thì dòng minibar đã tính bị đảo.
    - Lỗi có từ v1.0.1, đang ở production. Không do #67 gây ra.
    - Tìm thấy khi tìm nguyên nhân lượt đỏ đầu của TC-L4-138 trên stack #67.

- Cập nhật 05/11 01:00 (QA, bước Kiểm thử):
  - **BUG-R4-041: đã sửa – chờ gộp #75, hạ P2.**
    - QA xác minh PR #75 (`v104/fe-hold-typed-rate-lock`) ở head `9c277c7a`. Sau đó chạy lại phần đổi ở head mới `e71ab25f` (thẻ UXD PR75-01/02/03).
    - Unit và Desk thật trên stack local dùng một lần đều đạt. Có giá đã gõ thì nút **Giữ chỗ** khóa và có câu. Bấm chuột, Enter, Space đều không tạo giữ chỗ. Xóa giá đã gõ thì giữ chỗ theo giá niêm yết (1.500.000).
    - Chi tiết ở mục "Xác minh bản sửa" của lỗi.
  - **BUG-R4-038: phần đổi của #71 ở head `02c34bc9` đạt.**
    - `bug-r4-038-internal-added-night.test.ts`: 11/11, 2 lượt, trên một Postgres dùng một lần.
    - Gỡ dòng ghi `actorRole` vào audit thì ca A31 đỏ.
    - CI của #71 và #75 chỉ đỏ ở 2 ca "Hôm nay" của `v104-holds-feb`. Nguyên nhân là ngày UTC trong test; PR #76 sửa. Theo ARC, `main` đỏ từ 00:00 tới 06:59, không phải tới 06:00.
  - **Thêm BUG-R4-043 (P2, dời v1.0.5 có kế hoạch).**
    - Lỗi: cờ `is_complimentary` đi theo kênh, không theo tiền. Vì vậy đêm "Nội bộ có thu" bị tính là đêm miễn phí.
    - Nguồn: quan sát của QA ở BUG-R4-038; DOM kết luận ở lượt 6 của `DOM-on-v104-pr68-docs.md`.
    - Mức: DOM/ORC đề xuất P3. QA chốt **P2**, vì đây là dữ liệu lưu sai, không phải lỗi chữ. Vẫn dời v1.0.5 như đề xuất. Lý do ở mục của lỗi.
  - **Thêm BUG-R4-044 (P2): đã sửa – chờ gộp #80.**
    - Lỗi: hộp **Gia hạn giữ chỗ** hiện hạn sớm một ngày khi hạn rơi vào 00:00–06:59.
    - Nguồn: thẻ ARC FB-R4-ARC-FE-PR76-01 (Minor).
    - QA xác minh PR #80 (`v104/fe-extend-hold-local-date` @ `796a0cee`): 12 ca giờ giả, ở múi giờ VN và UTC, đều đạt. Trên mã cũ, 8 ca đỏ.
  - Test case bản 0.7: thêm RG-22 (BUG-R4-043, N/A ở v1.0.4) và RG-23 (BUG-R4-044); RG-15 đổi kỳ vọng theo #75 @ `e71ab25f`.
- Cập nhật 05/11 01:10 (QA2, bước Kiểm thử, một stack local dùng một lần, đã dọn):
  - **BUG-R4-039: head mới `0950313e` của #74 (ARC C1–C3) đạt**, vẫn "Đã sửa – chờ gộp #74".
    - Lượt quá ngày đi chưa trả phòng, căn chuyển `OC → OD → CL` bằng 2 bước buồng phòng: không còn ngoại lệ. Cả 5 lối nhận 409, không tạo yêu cầu duyệt.
    - Xem trước có `cause` và `heldByReservationCode` đúng 3 nhánh.
    - Đối chứng ở head cũ `9646029d`: lễ tân trưởng nhận được phòng, căn có 2 lượt Đang ở.
  - Xác nhận phát hiện của BE: lượt quá ngày đi không trả phòng thẳng được. Phải gia hạn B13 tới hôm nay, việc này ghi thêm 1 đêm, rồi mới trả phòng (B18). Chi tiết và đề xuất cho DOM/BA ở mục BUG-R4-039.
  - Oracle BR-402-04 (ghi chú mới) và BR-402-05 đúng. Bản vá bỏ nhãn "[GIẢ ĐỊNH QA]" của BR-402-05 để ở scratchpad, BE áp vào #74.

- Cập nhật 05/11 01:30 (QA3, bước Kiểm thử, worktree tạm và một stack local dùng một lần `ottimo-qa81`, đã dọn):
  - **BUG-R4-042: đã sửa – chờ gộp #81** (`v104/fe-checkout-minibar-race` @ `054d40c0`). Phán quyết **ĐẠT**.
    - Unit: test FE 5/5; 7 tệp minibar/checkout của FE 60/60; 5 ca tạm của QA đạt. Thay `CheckOutPage.tsx` bằng bản `7f0ef3fb` thì 4 ca QA đỏ, có ca chuỗi tiền (folio minibar về 0).
    - E2E Desk thật, `page.route` giữ bản tóm tắt: R1 (đua + "tủ đủ") đạt 5/5 lượt, R2 (đua + Quay lại) đạt 4/4; TC-L4-138 đạt 5/5. Đối chứng image web cũ: R1 đỏ đúng lỗi, mất 35.000.
    - Hồi quy: admin-web 943/943; E2E `checkout.h16`, `minibar-recount.s4`, `b14-fridges.s5` 8/8.
    - Hai giả định của FE: không sai tiền ở cả hai. Nhưng QA ghi hai lỗi P2 (045, 047). Chi tiết ở mục BUG-R4-042.
  - **Thêm BUG-R4-045 (P2).** Do #81 sinh ra (G-FE-042-2), đường hiếm, không chặn #81. Tủ đã đếm trên trang mà máy chủ đòi đếm lại thì không được đưa lại. Câu lỗi B18 bảo "Làm bước 1", nhưng bước 1 không có tủ đó.
  - **Thêm BUG-R4-046 (P0)** theo thẻ ARC FB-R4-ARC-FE-PR82-01, ORC chuyển. Đơn Nội bộ gõ giá một phần số đêm thì lưu 0 đ mọi đêm, không báo. ARC đề xuất P2; QA chốt P0 theo luật lỗi tiền, cùng cách với 037/038/041. FE đang sửa trong #82.
  - **Thêm BUG-R4-047 (P2).** Có từ trước v1.0.1, không do #81. Quay lại bước ① rồi bấm Tiếp tục cho tủ vừa đếm lần đầu thì nhận 409 với câu "Tủ vừa được bổ sung…". Mock MSW không tái hiện được.

- Cập nhật 05/11 02:00 (QA3, bước Kiểm thử, worktree tạm và stack local dùng một lần `ottimo-qa82`, đã dọn):
  - **BUG-R4-046: đã sửa – chờ gộp #82** (`v104/fe-rate-source-typed` @ `0e48686c`). Phán quyết **ĐẠT**. Mức vẫn P0 tới khi gộp và đạt STG.
    - Unit: 2 ca của FE (Nội bộ và OTA gõ một phần) đạt; 10 ca tạm của QA đạt. Thay `BookingDialog.tsx` bằng bản `9b45cef3` (trước #82) thì ca tiền đỏ: Desk gửi đơn không có `nightlyRates` và báo "Đã tạo đơn".
    - E2E Desk thật, 6 ca, đạt 2 lượt. Đơn Nội bộ gõ một phần thì bị chặn, 0 POST. Gõ đủ thì máy chủ ghi 500.000 × 2, nguồn `manual`. Để trống hết, hoặc gõ rồi xóa, thì 0 đ `complimentary`. Đối chứng image web cũ: đơn gõ một phần được tạo, 0 đ cả 2 đêm, mất 500.000.
    - Nhãn cột "Nguồn giá" của #82 khớp bảng UXD (`UXD-on-v104-src-typed.md` mục 2): đạt ở unit và trên stack, kể cả khi `page.route` giữ bản xem.
    - Hồi quy: admin-web 947/947 (cộng 10 ca QA là 957/957); `typecheck`, ESLint, Prettier sạch; `gen_strings.py` không ra diff; E2E `rack-booking.smoke` 5/5.
    - Điều kiện gộp: #82 xung đột với `main` ở 3 tệp chữ sinh ra (`strings-vi.json`, `strings-en.json`, `strings.js`). FE gộp `main` rồi sinh lại bằng `gen_strings.py`.
    - Không có lỗi mới. Hai điều thấy được đều đã có chỗ ghi: đêm "Nội bộ có thu" vẫn có `is_complimentary = true` (BUG-R4-043, v1.0.5); ô gõ 0 của đơn Nội bộ báo câu "(lớn hơn 0)" (thẻ UXD FB-R4-UXD-FE-PR82-04, Minor).
  - **BUG-R4-042 và BUG-R4-044: đã gộp `main` @ `3e6a762b` (#81, #80), chờ staging** (ORC báo 05/11 02:00). QA chưa chạy lại trên `main`.

- Cập nhật 05/11 02:30 (QA3, bước Kiểm thử, **head cũ** của #83). Môi trường: worktree tạm, stack local dùng một lần `ottimo-qa83`. Đối chứng bằng image web có `CheckOutPage.tsx` của `main` @ `53500bcd`.
  - **#83 (`v104/fe-minibar-followup`) @ `19cfa3f7`: chưa có phán quyết cuối.**
    - ARC đánh KHÔNG ĐẠT vì thẻ PR83-01. FE đang sửa và gộp `main`.
    - QA chạy lại toàn bộ ở head mới: R1–R6, TC-L4-138, bộ H16, unit đủ bộ.
    - Mọi kết quả dưới đây là của head cũ.
  - **BUG-R4-045: phần sửa đạt ở head cũ.**
    - Unit, ca D của QA: sau khi đếm 202, trang đưa lại 402, không sang bước ②. Đạt.
    - E2E trên máy chủ thật (R5), 3 lượt:
      - Hoàn tất nhận 409 `MINIBAR_NOT_CHECKED`;
      - trang về bước ①, tủ đang đếm là "Căn 202 (đã chuyển đi)", câu lỗi vẫn hiện;
      - đếm 202 nhận 201; câu lỗi mất ở bước ②;
      - B18 nhận 200, folio minibar 35.000.
    - Đối chứng `main`:
      - sau 409, trang đứng ở bước ③ với câu "Chưa kiểm minibar…";
      - Quay lại 2 lần thì bước ① chỉ có "Căn 101 (đang ở)", không đếm được 202.
      - Đây là lần đầu QA tái hiện 045 trên máy chủ thật.
  - **BUG-R4-047 (RG-28): phần sửa đạt ở head cũ.** E2E R2, R3, R4, 3 lượt:
    - lệnh đếm lại nhận 201, có `periodId`, không có câu "Số đếm chưa được lưu";
    - R4 (Quay lại, sửa thành bia dùng 2): folio minibar 70.000 một dòng.
    - Đối chứng `main`: R2, R3, R4 nhận 409 `MINIBAR_PERIOD_CHANGED` và hiện câu "Số đếm chưa được lưu".
    - Ở R4 trên `main`, số bia dùng 2 lễ tân đã sửa bị đọc lại về 35.000, nên phải gõ lại.
  - **UXD-PR81-01: đạt ở head cũ.**
    - Tủ đầu có nút "Tiếp tục: Tủ căn 101", tủ cuối có nút "Tiếp tục: Phụ phí".
    - Toast "Đã lưu số đếm tủ căn 202." hiện.
  - **BUG-R4-042: R1, R2 đạt 3/3 lượt ở head cũ.** Đây chưa phải lượt hồi quy cuối; chạy lại ở head mới (ORC dặn giữ lại).
  - **Thêm BUG-R4-048 (P0):** thẻ ARC FB-R4-ARC-FE-PR83-01, tái hiện trên máy chủ thật bằng R6, 3/3 lượt đỏ.
    - Sau 409 `MINIBAR_NOT_CHECKED`, lễ tân Quay lại, chọn 202 và gõ bia dùng 1 trong lúc bản tóm tắt còn đang tải.
    - Khi bản tóm tắt về, Desk đọc lại bản chuẩn của 202, nên số bia về đủ chuẩn, cột Tiền về 0, không có câu báo.
    - Lệnh **Tiếp tục** gửi số chuẩn và nhận 201. Folio không có dòng minibar, thiếu 35.000.
    - Đối chứng `main`: không tới được bước này (ngõ cụt của 045), nên không sai tiền.
  - **Hồi quy ở head cũ:**
    - unit admin-web 951/951 (gồm 5 ca tạm của QA); 12 ca của FE đạt;
    - E2E: 23 ca đạt, gồm `b14-fridges.s5` (TC-L4-138, nay bấm nút `co.go_next_cabinet`), `checkout.h16`, `minibar-recount.s4`, `foc.s4`, `debt-collect.s5`, `flow-a1.s4`, `stay-money.s4`.
  - Test case bản 0.10 thêm TC-V104-RG-29, gồm đường 045 và lỗi 048.

- Cập nhật 05/11 02:50 (QA3, bước Kiểm thử, **head mới** của #83 `e411cb22`). Head mới gồm lần gộp `main` `51217a2c` và bản sửa các thẻ review. Stack `ottimo-qa83` dựng lại từ head này (image API và web mới, DB giữ nguyên vì không có migration mới). Dọn sau khi chạy.
  - **#83 @ `e411cb22`: QA ĐẠT CÓ ĐIỀU KIỆN.**
    - Điều kiện gộp: `main` đã có #82 (`e84cb5fa`). Gộp thử `e411cb22` với `main` thì xung đột ở một tệp sinh ra, `product/design/wireframes/assets/strings.js`.
    - FE gộp `main`, sinh lại chữ bằng `gen_strings.py`, rồi chờ CI xanh.
    - Nếu lần gộp đó không đổi `CheckOutPage.tsx`, QA không cần chạy lại.
  - **BUG-R4-048: ĐẠT.**
    - E2E R6 trên máy chủ thật: xanh 3/3 lượt (đỏ 3/3 ở `19cfa3f7`). Sau 409, lễ tân chọn 202 và gõ bia dùng 1. Khi bản tóm tắt về: ô bia vẫn 35.000, không đọc lại bản chuẩn, tủ không đổi. Lệnh đếm 202 có bia `remainingQty` 1, folio minibar 35.000.
    - E2E R7 (ca mới, nhánh thứ hai của PR83-01): xanh 3/3 lượt. Sau 409, lễ tân ở lại tủ căn 101 và gõ bia dùng 1 trước khi bản tóm tắt về.
      - Khi bản tóm tắt về, ô bia vẫn 35.000, tủ đang chọn vẫn là 101. Nhóm chọn tủ có 202 rồi 101, nút ghi "Tiếp tục: Tủ căn 202".
      - Đếm lại 101 nhận 201, có `periodId`, không có 409. Trang sang 202; đếm 202 nhận 201.
      - Thu 35.000, B18 nhận 200, folio minibar 35.000.
    - Unit: ca S2a và N7 của FE đạt. Đối chứng bằng `CheckOutPage.tsx` của `19cfa3f7`: S2a đỏ.
  - **BUG-R4-045: ĐẠT.** Ca D (unit) và R5 (E2E) đạt 3/3 lượt, kết quả như ở head cũ.
  - **BUG-R4-047 (RG-28): ĐẠT.** R2, R3, R4 đạt 3/3 lượt: đếm lại nhận 201 có `periodId`, không có câu "Số đếm chưa được lưu". R4: folio 70.000 một dòng.
  - **Hồi quy BUG-R4-042: đạt.** R1, R2 đạt 3/3 lượt; ca A, B, C, E của QA đạt.
  - **UXD:** nhãn "Tiếp tục: Tủ căn 101" rồi "Tiếp tục: Phụ phí" vẫn đúng; toast có hiện. Thứ tự tủ cố định, căn cũ trước (UXD PR83-01).
  - **Hồi quy chung:**
    - unit admin-web 959/959 (gồm 5 ca tạm của QA); tệp FE `bug-r4-042-fea` 14/14;
    - `typecheck` sạch, ESLint sạch ở 2 tệp đổi; `gen_strings.py` không ra diff;
    - E2E bộ H16 23/23: `b14-fridges.s5` (TC-L4-138), `checkout.h16`, `minibar-recount.s4`, `foc.s4`, `debt-collect.s5`, `flow-a1.s4`, `stay-money.s4`.
  - Không có lỗi mới. Test case bản 0.11 thêm (d) vào RG-29, theo ca R7.
- Cập nhật 05/11 03:00 (QA2, bước Kiểm thử, phía Desk của BUG-R4-039, PR #77). Môi trường: worktree tạm, stack local dùng một lần `ottimo-qa2p77`, đã dọn.
  - **#77 ĐẠT ở head `055e92d5`.** QA2 chạy ở `5d74eb02` (= `main` `f9ff4e1f` + #77), rồi dựng lại web và chạy lại ở `055e92d5`. Head này chỉ đổi kiểu `room_ready` sang kiểu sinh ra, không đổi logic.
    - Căn còn lượt Đang ở hiện đúng câu `checkin.room_held_code`, có mã đơn đang giữ căn. Ca gồm lượt đi hôm nay sau B13 và lượt quá ngày đi + `CL`.
    - Bốn vai FD, FDL, MGR, OWN đều không có ô lý do, không có nút xin duyệt, không gửi POST.
    - `room_status` `VD`/`CL` giữ lối ngoại lệ cũ: FDL nhận phòng được, 200. Căn `OC` không có lượt Đang ở hiện `checkin.room_status_stuck`. Đơn chưa gán căn không có câu chặn.
    - API không có `cause` đọc đúng theo DOM lượt 5 và không gửi ghi đè.
    - Hồi quy: unit admin-web 967/967, `bug-r4-039-fea` 13/13, `typecheck` sạch. E2E nhận phòng API, clock và UI đều xanh.
    - Chi tiết ở mục "Xác minh phía Desk – PR #77" của BUG-R4-039.
  - **Thêm BUG-R4-049 (P3).** Ở H13 của đơn chưa gán căn, dòng buồng vẫn in "Căn · VC · Đã dọn, chờ kiểm". Lỗi có từ trước #77, đang ở production, không chặn #77.
  - Test case bản 0.12 thêm RG-30, phần Desk của RG-14, RG-24, RG-25.
- Cập nhật 05/11 03:35 (QA2, bước Kiểm thử, PR #84 `v104/fe-polish-049`). Môi trường: worktree tạm, stack local dùng một lần `ottimo-qa2p84`, đã dọn.
  - **BUG-R4-049: đã gộp `main` `a9da6be4` (#84, 05/11).** QA2 ĐẠT ở head `7c7eaadb`.
    - Head này gồm `3fa3428f` (ẩn `ci.cond_room`) và bản sửa thẻ UXD PR84-01 (ẩn `ci.cond_capacity_ok`).
    - Đơn chưa gán căn: không còn dòng phụ "Căn · VC · …" và "… khách · căn  tối đa –". Đơn có căn: hai dòng phụ vẫn y như trước.
  - **`ci.cond_capacity_ok` không ghi lỗi mới.** FE ghi chú dòng này cũng in số căn trống và "–" khi đơn chưa có căn. QA2 thấy cùng loại với BUG-R4-049, mức P3. Đã sửa trong #84 theo thẻ UXD PR84-01, nên gộp vào BUG-R4-049 và không cấp số mới.
  - Hồi quy xanh:
    - unit admin-web 970/970, `typecheck` và ESLint sạch;
    - E2E nhận phòng API, clock và UI;
    - test tạm Desk của #77 (D1–D6).
  - Chi tiết ở mục "Xác minh bản sửa – PR #84" của BUG-R4-049.
- Cập nhật 05/11 05:00 (QA2, bước Kiểm thử, các ca DOM nhờ ở review #72: mục 4 ghi chú 3–4, thẻ 01 và 02). Môi trường: `main` @ `c6b2f78e` (đã có #83, #84), worktree tạm, stack local dùng một lần `ottimo-qa2d72` (`CLOCK_MODE=mutable`, seed DS-E), Desk Chromium. Đã dọn stack, image, worktree.
  - **Thêm BUG-R4-050 (P2).** Trả phòng sau 24:00 của ngày đi (khách đi xe đêm): Desk dựng thời điểm cho VietQR bằng **ngày đi của đơn** + giờ gõ, nên sớm hơn thật 24 giờ.
    - VietQR (cách thu mặc định của H16) bị từ chối: "Số tiền lớn hơn số còn phải thu".
    - Sửa giá đêm thêm thì Desk không tính lại được số cần thu. Bill hiện số theo giá gợi ý, và Hoàn tất bị chặn tới khi gõ lại tiền.
    - **Không sai tiền.** B18 của Desk gửi `checkoutTime`, nên máy chủ vẫn đòi và ghi 1 đêm thêm đúng BR-416.
    - Điều DOM nghi ("không tính đêm thêm") **không xảy ra qua Desk**. Nó chỉ xảy ra khi một client API gửi `checkoutAt` = 00:20 ngày đi kèm ghi chú giờ. Desk không gửi `checkoutAt` cho B18.
    - **Có ở v1.0.3 trên production**: theo mã, các dòng liên quan giống hệt; không chạy trên stack v1.0.3.
  - **DOM thẻ 01 (đơn Nội bộ 3 × 300.000): ĐẠT.**
    - Chưa sửa đêm 3: bản xem trước `amountDueAtCheckinVnd` 900.000. H13 ghi "Còn phải thu 900.000 đ".
    - FD và FDL sửa đêm 3 về 0: 403 (`an Internal night goes back to 0 by OWN/MGR`). MGR sửa: 201.
    - Sau đó bản xem trước 600.000, H13 ghi "Còn phải thu 600.000 đ". Nhận phòng thu 600.000: 200, folio không còn phải thu.
  - **DOM thẻ 02 (BR-703-01 ca b, 202 → 203, không ghi Thêm phát sinh): ĐẠT.**
    - H16 có hai tủ, tủ 202 chọn trước. Tủ 202: bia còn 0/2. Tủ 203: đủ.
    - Bill có đúng một dòng "Minibar – Bia Larue lon × 2", 70.000. Sau B18, folio có một dòng minibar 70.000.
    - Việc **Bổ sung minibar** cho 202 (`minibar_refill`, hệ thống tạo, 2 bia) sinh **lúc lưu số đếm tủ 202 ở bước Minibar của trang Trả phòng**, vài giây trước **Hoàn tất**. Lúc đổi phòng (B14) chưa có việc này. Sau B18 việc vẫn mở.
    - **Bỏ cả dòng** trên dòng phát sinh (Đồ ăn, uống):
      - Folio đang mở: FD, FDL, MGR đều làm được (201). HK: 403.
      - Desk FD có ô "Bỏ cả dòng (ghi bút toán đảo, không xóa)" ở dòng phát sinh. Dòng tiền phòng không có ô này. Máy chủ trả 422 `NOT_ALLOWED` khi bỏ dòng đêm, kể cả với MGR.
      - Sau khi trả phòng (folio `settled`): FD và FDL nhận 403 `FORBIDDEN_ACTION`. MGR làm được, folio thành tiền trả thừa 70.000.
  - Test case bản 0.14 thêm RG-31 (BUG-R4-050) và RG-32 (thẻ 01, 02).
- Cập nhật 05/11 05:30 (QA2, bước Kiểm thử, PR #86 `v104/fe-checkout-after-midnight` cho BUG-R4-050, và ca CO-05 của BUG-R4-036). Môi trường: worktree tạm, stack local dùng một lần `ottimo-qa2p86` (`CLOCK_MODE=mutable`, seed DS-E), Desk Chromium, `qa.fd`. Đã dọn stack, image, worktree.
  - **#86 @ `9010e65f`: dừng, không kết luận.** ARC KHÔNG ĐẠT (quy tắc chọn ngày), ORC báo dừng. Tới lúc đó QA2 chỉ chạy unit (admin-web 986/986).
  - **#86 @ `45d2cfed`: ĐẠT.** BUG-R4-050 thành **Đã gộp `main` `5b785535` (#86, 05/11)** – trước đó: Đã sửa.
    - RG-31 theo bảng U1–U12 của ARC: unit 19/19 (12 ca của ARC và 3 ca biên của QA2, một số ca có nhiều dòng). E2E Desk 8 ca đạt: (a), (b), (b) qua VietQR, (c), U3, U4, U5, U11.
    - **RG-31 (b), ca ORC nhờ** (cách đóng thứ hai của FB-R4-ARC-FE-PR86-02). Lúc 00:20 hôm sau ngày đi, gõ giá đêm thêm 692.000 (giá gợi ý 792.000).
      - Lệnh dò giá gửi `checkoutAt` 00:20 hôm nay và `extraNightRateVnd`. Máy chủ trả `max` 692.000.
      - Bill ghi "Còn phải thu 692.000 đ". Thu tiền mặt, Hoàn tất 200. Folio có `extra_night` 692.000.
      - Cùng ca qua VietQR (567.000): QR 201, Hoàn tất 200.
    - B18 vẫn chỉ gửi `checkoutTime`. Đêm thêm vẫn tính như trước (BR-416).
    - Hồi quy xanh:
      - unit admin-web 1012/1012, `tsc` và ESLint sạch;
      - E2E desk-clock 23/23: H16, hai tủ sau B14, minibar kỳ nạp, giá đêm thêm AN, ngày làm việc trước 06:00, H13, H15;
      - E2E clock (API): 71 đạt, 2 bỏ qua (có sẵn).
    - Thử đột biến:
      - bỏ nhánh `hhmm < mốc → +1`: 9 ca đỏ;
      - bỏ kiểm biên: U8, U11 đỏ;
      - đưa trang Trả phòng về mã `585cf0ba`: 2 ca trang đỏ.
    - Chi tiết ở mục "Xác minh bản sửa – PR #86" của BUG-R4-050.
  - **BUG-R4-036 nâng P1** theo điều kiện ghi ở mục lỗi. CO-05 đỏ trên stack, ở cả `main` `585cf0ba` lẫn `45d2cfed`.
    - Gõ 04:30 lúc 06:10 ngày đi: Desk hiện hộp đêm thêm và "Còn phải thu 792.000 đ".
    - Hoàn tất: B18 422 `TIME_AFTER_ACTION`, với câu "Giờ này muộn hơn hiện tại…". Đơn vẫn Đang ở, không ghi tiền.
    - Cách làm tạm mới theo ARC đạt, tiền đúng: giữ giờ Desk điền sẵn, ghi giờ thật vào sổ giao ca. Không phụ thu, không đêm thêm, chỉ thu minibar.
    - Hạ lại P2 (vẫn dời v1.0.5) khi sổ tay và release notes dùng cách làm tạm mới, và CO-05 bản 0.15 đạt.
    - v1.0.3 có cùng hành vi (theo mã).
  - **Thêm BUG-R4-051 (P2).** Đây là gốc của việc CO-05 đỏ.
    - Desk chỉ gửi `checkoutTime` cho bản tóm tắt và B18. Vì vậy giờ gõ trước mốc 06:00 mà bấm sau mốc bị đọc là sáng hôm sau.
    - Hệ quả: Desk không ghi lùi được giờ khách rời trong cửa sổ sau nửa đêm.
    - Có ở v1.0.3 (theo mã). Đề xuất sửa ở v1.0.5 (ARC mục 2).
  - **Thêm BUG-R4-052 (P3).** Ở bước Bill, "Tổng cộng" không gồm đêm thêm sắp ghi. Trong khi đó, folio ngay dưới có dòng đêm thêm và "Còn phải thu" có tính.
    - Ví dụ: "Tổng cộng 792.000", "Đã thu −792.000", "Còn phải thu 792.000".
    - Không sai tiền. Có ở v1.0.3 (theo mã).
  - Test case bản 0.15: RG-31 theo bảng của ARC; CO-05 theo cách làm tạm mới.
- Cập nhật 05/11 06:00 (QA2, bước Kiểm thử, một lượt chạy chung). Bản thử: `main` @ `f670d99b` (đã có #86, merge `5b785535`) gộp tại chỗ với #87 `v104/fe-night-auto-copy` @ `e2d616f8`. Gộp không commit, không xung đột. Môi trường: worktree tạm, stack local dùng một lần `ottimo-qa2m87` (`CLOCK_MODE=mutable`, seed DS-E), Desk Chromium. Đã dọn stack, image, worktree.
  - **#87 @ `e2d616f8`: ĐẠT.** Kiểm ở trang **Danh mục căn** (`/settings/rooms`) với `qa.mgr`, hộp **Sửa căn 101**, chữ phụ dưới ô **Giá đêm niêm yết**.
    - VI đúng từng chữ: "Mọi đêm, kênh Trực tiếp, đã gồm VAT. Mức tăng cuối tuần, ngày đặc biệt (nếu có) ở Tham số quy tắc."
    - EN đúng từng chữ: "Every night, Direct channel, VAT included. Any weekend or special-date uplift is set in Rule settings."
    - "Tham số quy tắc" / "Rule settings" trùng tên mục menu (`nav.params`). Ô giá vẫn nối với chữ phụ qua `aria-describedby`.
    - Không tràn ở 390 và 1440: chữ nằm trong hộp; `scrollWidth` của chữ, của hộp và của trang không vượt khung. Ở 390, chữ xuống 2 dòng; ở 1440 (cột 188 px), 4 dòng.
    - Chữ dùng Be Vietnam Pro 12 px, màu Stone Grey #6B6760. Không còn chữ cũ, không lộ khóa.
    - Không đổi gì khác:
      - so `strings-vi.json`, `strings-en.json` và `strings.js` với `f670d99b`: chỉ khác khóa `rooms.night_auto`; RU không có khóa này;
      - chạy lại `gen_strings.py`: không ra diff;
      - unit admin-web 994/994, `@ottimo/i18n` 22/22.
    - Ghi chú không chặn: `design/content-guide.md` dòng 1335 còn câu cũ (mục "Ghi chú không phải lỗi").
  - **RG-31 (a)–(g) trên `main` sau #86: ĐẠT.** Cả 8 ca Desk như ở `45d2cfed`:
    - (a) 00:20 → `checkoutAt` 00:20 hôm sau ngày đi, QR 201, B18 200;
    - (b) giá đêm thêm đã sửa 692.000: dò giá trả `max` 692.000, Bill "Còn phải thu 692.000 đ", Hoàn tất 200; làm lại qua VietQR với 567.000: 201, rồi 200;
    - (c) tiền mặt giá gợi ý: 200, có `extra_night`, không có `late_checkout`;
    - (d) U5: 04:30 gõ lúc 06:10 → `<ngày đi+1>T04:30`;
    - (e) U3: 00:25 gõ lúc 00:20 → `T00:25`;
    - (f) U4: 00:05 gõ lúc 23:55 → `T00:05`;
    - (g) U11: lượt gia hạn bằng đơn con → `<stayDepartureDate>T11:00`, QR 201, B18 200.
    - #86 gộp ở head `f14954af`. Head này chỉ thêm ca trang cho lệnh dò giá (PR86-02), không đổi mã sản phẩm so với `45d2cfed`.
  - **CO-05 bản 0.15: ĐẠT, tiền đúng.** Từ 06:00, Trả phòng với giờ Desk điền sẵn:
    - 06:05, không minibar: "Còn phải thu 0 đ", B18 `{checkoutTime:"06:05"}` 200, folio `settled` chỉ có tiền phòng;
    - 06:10, 1 bia: thu 35.000, B18 200;
    - 11:55, 2 bia: thu 70.000, B18 200;
    - không có đêm thêm, không có phụ thu trả muộn; `actualCheckoutAt` là giờ bấm;
    - đối chứng gõ 04:30 lúc 06:10 vẫn 422 `TIME_AFTER_ACTION` như mô tả (BUG-R4-051, giới hạn đã biết).
    - QA2 đọc câu cách làm tạm ở #85 (`v104/ba-esc045-prices` @ `f9302d82`) và #66 (`v104/po-release-notes` @ `8f2557f7`). Các bước trong câu khớp các bước đã chạy.
    - Như vậy BUG-R4-036 chỉ còn chờ #85 và #66 gộp để hạ P2. CO-05 vẫn chạy lại trên STG 07/11; nếu đỏ thì nâng lại P1.
  - Test case bản 0.16: ghi kết quả RG-31, CO-05; thêm RG-33 (#87), tổng 201 → 202.
- Cập nhật 05/11 07:15 (QA2, bước Review, góc QA, #66 `v104/po-release-notes` @ `99d103a0`, so với `main` `2268b139`):
  - **Câu cách làm tạm và câu "đã sửa" ở #66 khớp các lượt QA đã chạy.**
    - BUG-R4-036 (mục "Khách đi trước 06:00"): các bước khớp CO-05 bản 0.15 (06:05, 06:10, 11:55).
    - BUG-R4-050 (#86): khớp RG-31 trên `main`.
    - BUG-R4-051, BUG-R4-052: ghi là giới hạn đã biết, sửa ở v1.0.5.
    - Trả sớm báo trong ngày rời có phụ thu người: khớp BR-428, ghi "QA kiểm lại trên staging 07/11" (RG-34 chưa chạy).
    - Các lỗi ghi "đã sửa" đều đã gộp `main`: 029–031 (#61 `6800cc45`), 032 (#63 `c2506a53`), 033/034 (#62 `b2a8b2a8`), 035 (#67), 037 (#70), 038 (#71), 039 (#74, #77 `c9af9f4c`), 041 (#75 `ebca5a95`), 042, 044, 045–049, 050.
  - **BUG-R4-036:** #85 đã gộp (`0dd3fcb3`). Câu ở #66 đủ điều kiện, nên **hạ P2 khi #66 gộp**. ORC hạ, không cần QA chạy lại.
  - **Hai điểm còn lại, không chặn #66:**
    - (a) Nhánh "Quá 12:00 mới làm được: gõ 12:00, Desk đòi Ghi chú giờ trả, không phụ thu" (DOM-PR85-04) có ở sổ tay `main` và ở #66, nhưng QA chưa chạy. Đọc mã trên `main` thì nhánh đúng:
      - `lateCheckoutSurcharge`: giờ ≤ giờ trả chuẩn (BR-401, 12:00) thì 0 đ;
      - `checkTypedTime`: giờ sớm hơn lúc bấm quá 30 phút thì đòi `checkoutTimeNote`, và không có trần ghi lùi.
      - Test case bản 0.18 thêm CO-05 (b) trên STG 07/11 12:35–13:00.
    - (b) Dòng BUG-R4-050 cho bản đang chạy nên thêm "thu theo giá gợi ý, không sửa giá đêm thêm" (PO quyết).
  - Bảng tóm tắt: sửa trạng thái 029–034, 039, 041 theo các lần gộp ở trên.

## Tóm tắt

| Mã | Mức | Chỗ | Vai sửa | Trạng thái |
|---|---|---|---|---|
| BUG-R4-029 | P2 | CI `build-test` xanh giả: turbo phát lại kết quả cũ của `api-client`, `integrations`; 5 ca `production-bootstrap` luôn bị bỏ qua | OPS (+ ARC duyệt) | **Đã gộp `main` `6800cc45` (#61)** – trước đó: Đã sửa (head `d0b8fd58`; CI job `126574160088`: mọi task test cache miss, `production-bootstrap` 11/11 không bỏ qua) |
| BUG-R4-030 | P3 | `api-client` `src/generated/openapi.ts` lệch `openapi.yaml` (thiếu mô tả 0.3.12 của P4-16); test drift đỏ khi chạy không cache | BE-C (+ ARC) | **Đã gộp `main` `6800cc45` (#61)** – trước đó: Đã sửa (sinh lại client; `api-client` 37/37 cache miss trên CI) |
| BUG-R4-031 | P3 | `integrations` test đối chiếu luật email với `ops-check.sh` đỏ từ P4-04: bóc phải chữ `$EMAIL_RULE_RE` | OPS + INT | **Đã gộp `main` `6800cc45` (#61)** – trước đó: Đã sửa (test đọc giá trị `EMAIL_RULE_RE`; `integrations` 296/296 cache miss trên CI) |
| BUG-R4-032 | P2 | Sổ tay v1.0.4 chưa có đường **Đặt lại xác thực 2 bước**; hàng "mất điện thoại" vẫn dạy Khóa + tạo tài khoản mới (MN-02) | BA (+ SEC đọc câu) | **Đã gộp `main` `c2506a53` (#63)**. QA2 05/11 đọc trên `main`: có đường **Đặt lại xác thực 2 bước** (`01` 1.7 hàng 175–176 và 1.9; `00`, `02`–`05`). Câu "không bật đăng nhập 2 bước ở v1.0.x" còn ở `01` dòng 228: QC 7.4 chốt như đã ghi. Chờ MN-02 |
| BUG-R4-033 | P3 | Bộ test: S1-SEC-16 (API) flaky khi chạy song song – 429 của giới hạn đăng nhập theo IP | QA | **Đã gộp `main` `b2a8b2a8` (#62)** – trước đó: Đã sửa, chờ merge |
| BUG-R4-034 | P3 | Bộ test: TC-L2-033 flaky – ca song song khóa OOO cùng đêm của căn 401 | QA | **Đã gộp `main` `b2a8b2a8` (#62)** – trước đó: Đã sửa, chờ merge |
| BUG-R4-035 | **P1** | Trả phòng (H16): số điền sẵn của tủ minibar chỉ được gán trong `useEffect` sau khi `minibar-standard` tải xong. Bấm **Tiếp tục** đúng khoảng hở thì Desk gửi "tủ đầy" và đảo dòng minibar đã tính (sai tiền). Bấm lúc đang tải thì sang bước sau mà không đếm tủ | FE-A | **Đã sửa – đã gộp #67** (`main` @ `217afac0`, head `ceda9278`). QA2 05/11: gỡ từng phần sửa thì đúng ca đỏ, 3/3 lượt. Tải 12 × 10 không có lỗi assert do mã sản phẩm. Desk thật 2 ca đạt. Chờ STG (RG-18) |
| BUG-R4-036 | **P2** (hạ lại 05/11 08:00 khi #66 gộp `0d11db20`; trước đó P1 từ 05:30, CO-05 đỏ) | 00:00–05:59: khung đơn và trang Hôm nay không có nút **Trả phòng** cho khách rời trong cửa sổ sau nửa đêm (`allowed-actions.ts:115` so ngày nghiệp vụ; Hôm nay chỉ lấy khách đi của ngày nghiệp vụ). Máy chủ B18 vẫn nhận cửa sổ này. Cách làm tạm trong sổ tay (từ 06:00 gõ giờ thực tế 04:30) **không chạy trên Desk**: B18 422 `TIME_AFTER_ACTION` (BUG-R4-051) | BE (+ FE nếu cần); DOM/BA (sổ tay, release notes), ORC chốt | Mở – **P1**. 05/11 07:15 (QA2, review #66 @ `99d103a0`): #85 đã gộp `main` `0dd3fcb3`; câu ở #66 khớp CO-05 bản 0.15, nên **hạ P2 khi #66 gộp**. Nhánh "Quá 12:00: gõ 12:00, ghi chú giờ trả, không phụ thu" (DOM-PR85-04) QA chưa chạy; đọc mã thì đúng; CO-05 (b) trên STG 07/11. 05/11 06:00: CO-05 bản 0.15 **đạt** trên `main` `f670d99b` + #87 (QA2): 06:05, 06:10, 11:55, giờ Desk điền sẵn, tiền đúng. Câu ở #85 @ `f9302d82` và #66 @ `8f2557f7` khớp các bước đã chạy. **Hạ P2 khi #85 và #66 gộp** (ORC hạ, không cần QA chạy lại; CO-05 chạy lại trên STG 07/11). Trước đó: P1 tới khi sổ tay và release notes dùng cách làm tạm mới (ARC `ARC-on-v104-bug050-rule.md` mục 2: từ 06:00 giữ giờ Desk điền sẵn, giờ thật ghi sổ giao ca) và CO-05 bản 0.15 đạt. Sau đó hạ P2, dời v1.0.5 có kế hoạch. QA2 05/11 05:30: cách làm tạm mới đạt trên stack (`585cf0ba`, `45d2cfed`), tiền đúng |
| BUG-R4-037 | **P0** | Đặt phòng mới (H09): giá mỗi đêm do bản xem giá kênh **Trực tiếp** điền sẵn vẫn nằm trong ô sau khi chuyển sang **OTA** / **Nội bộ**. Nếu mọi đêm có số, Desk gửi số đó làm giá của đơn (`edited:false`). Nếu chỉ một phần đêm có số, Desk chặn với câu "Nhập giá mỗi đêm" gây hiểu nhầm. Đây là gốc của 2 test flaky A-20 và US-139. Có từ trước v1.0.1, đang ở production | FE (BookingDialog) | **Đã sửa – đã gộp vào `main` @ `d0ea6dc2`, đạt local** (#70 head cuối `98d8a3ad`, cùng #73). QA chạy lại trên `main` 05/11 00:35: 3 ca tái hiện xanh, tệp test của FE 28/28. Tải 24 × 40: 2 lượt trên `main` với giới hạn mặc định 15 s. Lượt 1: 1/120 đỏ, chỉ là quá giờ của bộ chạy lúc tải 67–81, không có lỗi assert. Lượt 2: 0/120 đỏ ở tải 36–144. Desk thật trên stack: hai câu `rates_cleared_channel`, `rates_cleared_room_group` hiện đúng lúc; RG-13 theo #73 đạt. Chờ STG RG-07…RG-11, RG-13, RG-17. Còn hotfix production: ORC quyết |
| BUG-R4-038 | **P0** | Gia hạn (B13), đêm B9a, đêm thêm ở B18 của đơn **Nội bộ** lấy giá lịch Trực tiếp thay vì 0 đ, vì `addedNightRate` thiếu nhánh `internal`. Folio của đơn miễn phí hiện **Còn phải thu** sai, doanh thu và ADR bị cộng thêm. Desk không đưa về 0 được | BE (+ ARC) | **Đã gộp `main` @ `2c8cd8cf` (#71, 05/11, ORC) – chờ staging**. Trước đó: Đã sửa – chờ gộp #71 (đạt ở head `7557e485`. Phần đổi ở head `02c34bc9`: tệp test BE 11/11; CI đỏ chỉ ở 2 ca "Hôm nay" của `v104-holds-feb`, PR #76 sửa). Stack local: 9/9 ca API đạt. B13, B9a, B18 Nội bộ đều 0 đ `complimentary`, folio không còn phải thu. Đối chứng Trực tiếp không đổi. A31: MGR đưa về 0 được khi có lý do; FD và FDL nhận 403. Q5a sau bản sửa: `TOTAL` 0. Hồi quy clock: 76 đạt, 0 đỏ |
| BUG-R4-039 | **P1** | Nhận phòng (B9): máy chủ cho lễ tân trưởng trở lên xác nhận ngoại lệ `room_ready` với **mọi** trạng thái buồng trừ `OOO` (`checkin.service.ts` 359–361, 588). Vì vậy nhận được đơn thứ hai vào căn còn đơn **Đang ở** (`OC`/`OD`): căn có 2 lượt Đang ở, và khi khách cũ trả phòng thì căn về `VD` dù khách mới đang ở. Trái BR-402 (1), chỉ cho ngoại lệ với `VD`/`CL`. Có từ `bad6f599` (16/10), đang ở production | BE-A (+ ARC; FE/UXD cho câu chặn) | **Máy chủ đã gộp `main` @ `2f535924` (#74). Desk: QA2 ĐẠT ở #77 @ `055e92d5` (05/11 03:00), đã gộp `main` `c9af9f4c` (#77), chờ staging.** Desk: câu chặn theo `cause` đúng cho 4 vai, không có lối ngoại lệ hay POST; `VD`/`CL` giữ ngoại lệ; API cũ đọc theo DOM lượt 5 (RG-30). Trước đó: Đã sửa – chờ gộp #74 (head `0950313e`, ARC C1–C3). QA2 05/11 01:05, API trên stack local, 3/3 lượt: lượt quá ngày đi + `CL` không còn ngoại lệ; `cause`/`heldByReservationCode` đúng. Đối chứng `9646029d`: lễ tân trưởng nhận được, căn 2 lượt Đang ở. Lượt trước ở `9646029d`: C1–C5 đạt. Căn `OC`/`OD`: 409 với 5 lối, không tạo yêu cầu duyệt. `VD`/`CL` vẫn cho ngoại lệ. Căn còn khách mà trạng thái bị sửa tay sang `VD` vẫn bị chặn. Đối chứng `main` chưa có #74: C1, C2, C5 đỏ. Phần Desk chưa kiểm (RG-14) |
| BUG-R4-040 | P3 | Đặt phòng mới (H09): giá Trực tiếp / CTV ngoài sàn–trần cứng (BR-105). Máy chủ trả Problem `RATE_OUT_OF_RANGE` chỉ có `dates`, không có `min`/`max`/`group`. Desk hiện câu chung `error.RATE_OUT_OF_RANGE` với nguyên chữ: "Giá phải từ {min} đến {max} (giá sàn – trần nhóm {group})." Câu nằm ở đầu hộp, ngoài khung nhìn khi bấm **Tạo đơn**. Có từ trước v1.0.1 | BE (thêm `min`/`max`/`group` hoặc trả theo đêm) + FE (nhánh `RATE_OUT_OF_RANGE`, đặt dưới bảng giá) + UXD | Mới – dời v1.0.5 có kế hoạch (ORC, thẻ UXD PR70-06). Không chặn #70 |
| BUG-R4-041 | **P2** (hạ từ P0 lúc 05/11 01:00, khóa tạm #75 đạt) | Đặt phòng mới (H09), nút **Giữ chỗ đến …**: `hold()` gọi `saveQuote` không kèm giá đêm (hợp đồng `QuoteInput` không có `nightlyRates`). Giá lễ tân đã gõ bị bỏ mà không báo: giữ chỗ, cọc 30 % và VietQR tính theo giá niêm yết. Khi đơn được xác nhận, giá đơn cao hơn giá đã thỏa thuận. Có từ trước v1.0.1, đang ở production | FE (khóa tạm v1.0.4) + ARC/BE (Q1 nhận giá thỏa thuận, v1.0.5) + UXD (câu) + BA (sổ tay 2.5 bước 10) | **Đã gộp `main` `ebca5a95` (#75)** – trước đó: Đã sửa – chờ gộp #75 (head `e71ab25f`). Có giá đã gõ thì nút **Giữ chỗ** khóa (`aria-disabled`) và có câu. Bấm chuột, Enter, Space đều không tạo giữ chỗ. Xóa giá đã gõ thì giữ chỗ theo giá niêm yết 1.500.000. Phần giữ chỗ theo giá thỏa thuận dời v1.0.5. Hotfix production và cách làm tạm gửi INV: ORC quyết |
| BUG-R4-042 | **P1** | Trả phòng (H16), lượt có B14 giữa kỳ và còn 2 tủ phải đếm. `nextCabinet` tìm tủ kế tiếp trong `toCount` của lần render lúc bấm. Nếu bản tóm tắt tải lại sau lần đếm tủ đầu chưa về khi lễ tân đếm xong tủ thứ hai, Desk quay lại tủ đầu (đã đếm) và đứng ở bước ①. Khi bản tóm tắt về, bảng của tủ đó không còn ghi tên tủ, còn tiêu đề vẫn ghi căn đang ở. Bấm "Không dùng gì – tủ đủ" rồi **Tiếp tục** thì dòng minibar đã tính bị đảo (sai tiền). Có từ v1.0.1 (S4-38), đang ở production | FE-A (+ ARC xem; UXD nhãn tủ) | **Đã gộp `main` @ `3e6a762b`, chờ staging** (#81 head `054d40c0`, QA3 đạt 05/11 01:30). Unit FE 5/5 và 5 ca QA; E2E giữ bản tóm tắt R1 5/5, R2 4/4 lượt; đối chứng mã cũ đỏ (folio minibar về 0). Còn: RG-21 E2E trên `main`, STG. Hồi quy trên #83 @ `e411cb22` đạt (QA3 05/11 02:50) |
| BUG-R4-043 | P2 | Dữ liệu chỉ số: cờ `is_complimentary` của đêm và đơn đi theo kênh, không theo tiền. Đêm "Nội bộ có thu" (> 0 đ) mang `true`. A31 đổi giá mà không tính lại cờ; giảm giá thì có tính lại. Khi có báo cáo, ADR K-04 và số đêm miễn phí K-02 sẽ sai. Không sai tiền; ở v1.0.x chưa màn nào đọc cờ | BE (+ OPS tính lại dữ liệu; DATA Q-05, BA EP02, ARC `erd.md`, DOM BR-904) | Mới – dời v1.0.5 có kế hoạch. Sửa mã và tính lại dữ liệu trước báo cáo ADR đầu tiên. Tới lúc đó DATA tính đêm miễn phí bằng `room_revenue_vnd = 0` |
| BUG-R4-044 | P2 | Gia hạn giữ chỗ (B3, `ExtendHoldDialog`): giờ của hạn theo giờ VN, nhưng ngày lấy theo UTC. Vì vậy hạn rơi vào 00:00–06:59 hiện **sớm một ngày** ở nút "Gia hạn đến …" và ở thông báo sau khi gia hạn. Lễ tân báo khách sai hạn. Không sai tiền | FE | **Đã gộp `main` @ `3e6a762b`, chờ staging** (#80 `796a0cee`). 12 ca giờ giả (02:00, 06:30, 14:00, 23:30) ở múi giờ VN và UTC đều đạt; trên mã cũ thì 8 ca đỏ. Còn: RG-23 trên STG 07/11 |
| BUG-R4-045 | P2 | Trả phòng (#81): một tủ đã đếm trên trang bị máy chủ đòi đếm lại (B14, B13 hay nạp tủ ở phiên khác; đổi ngày làm việc). Desk không đưa lại tủ đó, kể cả khi Quay lại. Câu B18 "Làm bước 1 trước khi hoàn tất" chỉ tới bước không có tủ đó. Không sai tiền (B18 chặn `MINIBAR_NOT_CHECKED`) | FE-A (+ ARC) | **Đã gộp `main` `0df6a67b` (#83, 05/11)** – trước đó: Đã sửa (head `e411cb22`, QA3 ĐẠT 05/11 02:50). Unit ca D đạt. E2E R5 đạt 3 lượt ở cả head cũ và head mới. Đối chứng `main` `53500bcd`: không đếm được 202. Gộp: FE gộp `main` (có #82), sinh lại `strings.js`, CI xanh. Rồi chạy RG-29 |
| BUG-R4-046 | **P0** | Đặt phòng mới (H09), kênh Nội bộ: gõ giá cho một phần số đêm thì `validate()` cho qua, `body()` không gửi `nightlyRates`. Máy chủ ghi 0 đ cho mọi đêm, không báo. Có từ trước v1.0.1, đang ở production | FE (+ DOM luật, UXD, ARC) | **Đã gộp `main` @ `f9ff4e1f` (#82, 05/11, ORC) – chờ staging**. Trước đó: Đã sửa – chờ gộp #82 (head `0e48686c`, QA3 05/11 02:00). Unit 2 ca FE và 10 ca QA; E2E 6 ca × 2 lượt; đối chứng mã cũ: đơn 0 đ. ORC nhận P0; đi cùng v1.0.4, không làm v1.0.3.1. Gộp: sinh lại chữ sau khi gộp `main`, CI xanh; rồi RG-27 trên STG |
| BUG-R4-047 | P2 | Trả phòng (H16): Quay lại bước ① rồi bấm Tiếp tục cho tủ vừa đếm lần đầu (tủ chưa từng nạp) thì nhận 409 `MINIBAR_PERIOD_CHANGED` với câu "Tủ vừa được bổ sung…". Bấm lại thì lưu. Không sai tiền. Có từ trước v1.0.1; mock MSW không tái hiện | FE-A (+ ARC, UXD) | **Đã gộp `main` `0df6a67b` (#83, 05/11)** – trước đó: Đã sửa (head `e411cb22`, QA3 ĐẠT 05/11 02:50). RG-28 (E2E R2, R3, R4) đạt 3 lượt ở cả head cũ và head mới. Đối chứng `main`: 409. Không dời v1.0.5 |
| BUG-R4-048 | **P0** | Trả phòng (#83): Hoàn tất nhận 409 `MINIBAR_NOT_CHECKED`. Lễ tân Quay lại bước ① và gõ số trước khi bản tóm tắt về. Effect `minibarResync` đọc lại bản chuẩn, số đã gõ về số chuẩn, không báo. **Tiếp tục** ghi tủ đủ, folio thiếu tiền minibar. Chỉ có trên nhánh #83, chưa vào `main` | FE-A (+ ARC) | **Đã gộp `main` `0df6a67b` (#83, 05/11)** – trước đó: Đã sửa (head `e411cb22`, QA3 ĐẠT 05/11 02:50). R6 đỏ 3/3 lượt ở `19cfa3f7`, xanh 3/3 ở `e411cb22`. R7 xanh 3/3. Unit S2a: xanh ở head mới, đỏ ở trang cũ. Không còn chặn #83. Đóng khi #83 gộp; lỗi chưa từng vào `main`, nên không cần STG riêng |
| BUG-R4-049 | P3 | Nhận phòng (H13), đơn chưa gán căn (OTA ở làn chưa gán): dòng "Buồng sẵn sàng" vẫn in "Căn · VC · Đã dọn, chờ kiểm" (số căn trống, trạng thái không có thật), vì bản xem trước trả `roomStatus: 'VC'` lấp chỗ khi không có căn. Desk vẫn chặn nhận phòng; dòng "Đơn đã được gán căn" ngay trên nói đúng. Có từ Sprint 3, đang ở production | FE-A (+ UXD nếu đổi câu; ARC nếu bỏ `roomStatus` ở hợp đồng) | **Đã gộp `main` `a9da6be4` (#84, 05/11)** – trước đó: Đã sửa (head `7c7eaadb`, QA2 ĐẠT 05/11 03:35). Đơn chưa gán căn không còn dòng phụ `ci.cond_room` và `ci.cond_capacity_ok` (thẻ UXD PR84-01, cùng loại, không cấp số mới). Đơn có căn: hai dòng như cũ. Unit 049 đỏ trên trang cũ, xanh trên head mới; E2E Desk đạt. Còn: STG theo RG-30 (e). Trước đó: Mới (QA2 05/11 03:00, thấy khi kiểm #77) |
| BUG-R4-050 | P2 | Trả phòng (H16) sau 24:00 của ngày đi (giờ 00:00–05:59, ngày làm việc vẫn là ngày đi): Desk dựng `checkoutAt` cho VietQR bằng ngày đi của đơn + giờ gõ (`CheckOutPage.tsx` 509–511, 1788–1790), sớm hơn thật 24 giờ. Máy chủ hiểu là cửa sổ sau nửa đêm của ngày đi, trần QR 0 đ. **VietQR bị từ chối** ("Số tiền lớn hơn số còn phải thu"). **Giá đêm thêm đã sửa không tính lại được**: Bill hiện số theo giá gợi ý, Hoàn tất 422 tới khi gõ lại. Không sai tiền: B18 của Desk gửi `checkoutTime`, đêm thêm vẫn tính đúng BR-416. Có ở v1.0.3 (theo mã) | FE-A (+ ARC xem quy tắc chọn ngày; BA câu sổ tay tạm) | **Đã gộp `main` `5b785535` (#86, 05/11), đạt trên `main`** (QA2 05/11 06:00: RG-31 (a)–(g) trên `f670d99b` + #87). Ca này cần đồng hồ giả, nên không có ca STG. Chờ phát hành v1.0.4 để đóng. Trước đó: Đã sửa (head `45d2cfed`, QA2 ĐẠT 05/11 05:30). Unit U1–U12 của ARC 19/19. E2E Desk 8 ca, gồm RG-31 (b) giá đêm thêm đã sửa. Hồi quy desk-clock 23/23, clock 71 đạt. Head `9010e65f`: dừng, ARC KHÔNG ĐẠT. Trước đó: Mới (QA2 05/11 05:00, ca DOM nhờ ở review #72) |
| BUG-R4-051 | P2 | Trả phòng (H16): giờ gõ trước mốc 06:00 mà bấm sau mốc bị đọc là **sáng hôm sau**. Lý do: Desk chỉ gửi `checkoutTime` cho bản tóm tắt và B18, và máy chủ đọc theo trục ngày làm việc của lúc bấm. Ví dụ: 04:30 gõ lúc 06:10 ngày đi thì Desk hiện đêm thêm và "Còn phải thu 792.000 đ", rồi B18 422 `TIME_AFTER_ACTION`. Desk không ghi lùi được giờ khách rời trong cửa sổ sau nửa đêm. Không sai tiền (B18 từ chối). Từ #86, VietQR nhận số 792.000 cho ca này. Có ở v1.0.3 (theo mã) | FE-A (+ ARC) | Mới (QA2 05/11 05:30). Đề xuất dời v1.0.5: Desk gửi một `checkoutAt` cho bản tóm tắt, VietQR và B18 (ARC mục 2). Cách làm tạm v1.0.4 ở BUG-R4-036 |
| BUG-R4-052 | P3 | Trả phòng (H16), bước Bill: "Tổng cộng" (`CheckOutPage.tsx` 1753, `totalVnd` của bản tóm tắt) không gồm đêm thêm sắp ghi. Folio ngay dưới có dòng đêm thêm, và "Còn phải thu" có tính, nên ba con số không khớp nhau. Không sai tiền. Có ở v1.0.3 (theo mã) | FE-A (+ UXD nhãn) | Mới (QA2 05/11 05:30). Đề xuất dời v1.0.5. Không chặn #86 |
| BUG-R2-216 | P3 | Thấy lại: hộp "Giữ chỗ" sau khi tạo in 2 lần số cọc và nội dung chuyển khoản | FE-B + UXD | **Đã sửa – đạt local** (PR #60, `main` @ `58183764`, HD-01 3/3 lượt). Chờ xác nhận STG 06/11 C3 |
| BUG-R2-219 | P3 | Thấy lại: hộp "Giữ chỗ" khi khách đến hôm nay vẫn hiện bộ chọn 12/24/48 h và mốc hạn đã qua | FE-B + UXD (chữ) | **Đã sửa – đạt local** (PR #60, `main` @ `58183764`, HD-02 3/3 lượt). Chờ xác nhận STG 06/11 C3 |

Ghi chú không phải lỗi (cuối tệp): khóa chữ `fo.tabs.holds` không còn dùng; gói P4-32 chưa vào `main`.

---

### BUG-R4-029 – CI `build-test` xanh giả: turbo phát lại kết quả test cũ, bỏ qua 5 ca `production-bootstrap`
- **Mức:** P2. Không sai tiền, không lộ dữ liệu. Nhưng cổng CI mà QC và PR dựa vào báo xanh trong khi 2 bộ test thật sự đỏ (BUG-R4-030, 031). Đây là "xanh giả" cùng họ với BUG-R4-013 và FB-R4-QA-DOM-PR25-01.
- **Môi trường:** CI run `41819582803` trên `main` @ `40825ee1` (job "format · lint · audit · test · build", xanh). Đối chiếu: chạy lại các bước của job này trong worktree `40825ee1` trên máy QA, **không** cache turbo, PG 17 thật (`ottimo_app`).
- **Liên quan:** TC-V104-CT-01, TC-V104-RG-04, TC-V104-EM-14, TC-V104-EM-21.
- **Các bước tái hiện:**
  1. Mở log job build-test của run `41819582803`.
  2. Tìm dòng của `@ottimo/api-client:test` và `@ottimo/integrations:test`.
  3. Tìm dòng `production-bootstrap.test.ts`.
  4. Trên máy: `corepack pnpm turbo run test --force` (hoặc `pnpm --filter @ottimo/api-client test`, `pnpm --filter @ottimo/integrations test`) ở `40825ee1`.
- **Thực tế:**
  - (a) `@ottimo/api-client:test` → "cache hit, replaying logs `4f966ba224123b11`" (37/37 xanh). Chạy thật: **1 đỏ** (`src/generated.test.ts`, BUG-R4-030). Gói này không có `turbo.json` riêng. Đầu vào của task test chỉ là tệp trong gói, nên đổi `docs/api/openapi.yaml` (d22fb078, P4-16) không làm mất cache.
  - (b) `@ottimo/integrations:test` → "cache hit, replaying logs `b217c3fcf60d1891`" (295/295 xanh). Chạy thật: **1 đỏ** (`notification/email-address.test.ts`, BUG-R4-031). Test này đọc `infra/server/bin/ops-check.sh`, nhưng tệp đó không nằm trong đầu vào của task, nên đổi ở P4-04 (488a3044) cũng không làm mất cache.
  - (c) `production-bootstrap.test.ts (11 tests | 5 skipped)` trên CI. Job có đặt `BOOTSTRAP_DATABASE_URL` và `BOOTSTRAP_MIGRATION_DATABASE_URL` (ci.yml dòng 66–67). Nhưng `product/turbo.json` task `test` chỉ khai `env: [DATABASE_URL, MIGRATION_DATABASE_URL]`. Turbo chạy chế độ env chặt, nên vitest không thấy 2 biến, và `describe.skipIf(...)` bỏ qua 5 ca "cơ sở dữ liệu trống mới" (tạo property, 10 căn, chủ đầu tư đầu tiên, chạy lần 2 bị từ chối…). Chạy thẳng vitest với 2 biến: **11/11 xanh**.
  - Khóa cache của CI là `turbo-${runner.os}-${sha}`, `restore-keys` lùi về tiền tố `turbo-${runner.os}-`. Nghĩa là kết quả cũ của SHA trước luôn được nạp lại.
- **Mong đợi:**
  - Đổi hợp đồng hay `ops-check.sh` thì test đọc chúng phải chạy lại.
  - Ca `production-bootstrap` chạy đủ 11 trên CI.
  - Ít nhất SHA được cắt cho bản phát hành chạy test không cache.
- **Đề xuất sửa (OPS, ARC duyệt):**
  - `product/packages/api-client/turbo.json`: `test.inputs` = `$TURBO_DEFAULT$` + `$TURBO_ROOT$/docs/api/openapi.yaml`.
  - `product/integrations/turbo.json`: `test.inputs` thêm `$TURBO_ROOT$/infra/server/bin/ops-check.sh`.
  - `product/turbo.json`: thêm `BOOTSTRAP_DATABASE_URL`, `BOOTSTRAP_MIGRATION_DATABASE_URL` vào `test.env` (hoặc `passThroughEnv`).
  - Job kiểm tra lại: rà mọi test đọc tệp ngoài gói (`readFileSync` tới `$TURBO_ROOT$`) và khai vào `inputs`; với SHA cắt bản (06/11 18:00) chạy `turbo run test --force`.
- **Bằng chứng:**
  - Log CI: `gh run view 41819582803 --log` (job build-test), dòng "cache hit" của 2 gói và dòng `production-bootstrap.test.ts (11 tests | 5 skipped)`.
  - Log máy QA (scratchpad, không commit): `qa104/unit/test.clean.log` (integrations 294/295, api-client 36/37).
- **Vai chịu trách nhiệm:** OPS (cấu hình turbo/CI). ARC duyệt danh sách đầu vào.
- **Trạng thái:** **Đã gộp `main` `6800cc45` (#61)** – trước đó: Đã sửa – chờ gộp #61 (QA xác nhận 04/11 khuya). PR #61 nhánh `v104/ci-turbo-inputs`, head `d0b8fd58`.
  - Cách sửa (báo cáo OPS `rounds/round-04/outputs/OPS/v1.0.4-ci-turbo-inputs.md` trên nhánh): mỗi gói có `turbo.json` riêng, khai đầu vào test ngoài gói qua `$TURBO_ROOT$` (gồm `openapi.yaml`, `ops-check.sh`); thêm `BOOTSTRAP_*` vào `test.env`; thêm `tsconfig.base.json` vào `globalDependencies`.
  - Bằng chứng: log job `126574160088` "format · lint · audit · test · build" (run `41828458647`, head `4f972805`, lượt 2, xanh). Lệnh: `gh run view --job 126574160088 --log`.
    - Mọi task test là **cache miss**: `api-client` 37/37, `integrations` 296/296, `api` 4125 đạt / 19 bỏ qua / 1 todo, `admin-web` 874, `mobile` 162, `guest-web` 89.
    - Dòng `production-bootstrap.test.ts (11 tests)`, **không còn ca bị bỏ qua**.
    - "Cached: 4 cached, 14 total". Cả 4 task cache hit đều đã chạy thật (cache miss) ở bước trước của **chính job này**, nên không phải kết quả của SHA cũ. Đó là `contracts:build`, `integrations:build`, `landing-web:build` và `landing-web:test`.
  - Head `d0b8fd58` chỉ khác `4f972805` ở 2 tệp tài liệu (báo cáo OPS, runbook). Run `41832423127` trên `d0b8fd58`: mọi check xanh.
    - Run `41828458647` báo "cancelled" chỉ vì job docker-build bị lượt mới thay. Job test `126574160088` của run đó xanh.
    - Ở `d0b8fd58`, task test có thể cache hit từ `4f972805`. Điều này hợp lệ, vì đầu vào test của hai SHA giống nhau.
  - Còn lại sau khi gộp: với SHA cắt bản 06/11 18:00, QA đối chiếu log CI có cache miss ở các task test (TC-V104-CT-01, RG-04).

### BUG-R4-030 – `api-client`: `src/generated/openapi.ts` lệch `openapi.yaml`, test drift đỏ khi không cache
- **Mức:** P3. Chỉ thiếu 3 dòng chú thích (doc comment), kiểu dữ liệu không đổi, không ảnh hưởng lúc chạy. Nhưng test drift của hợp đồng (CT-01) đang đỏ thật.
- **Môi trường:** worktree `40825ee1`, `corepack pnpm --filter @ottimo/api-client test`, không cache.
- **Liên quan:** TC-V104-CT-01, TC-V104-RG-04. Commit gây lệch: d22fb078 (P4-16 `v104/be-notice-allowlist`) sửa mô tả `privacy_notice_version` trong `docs/api/openapi.yaml` mà không sinh lại client.
- **Các bước tái hiện:**
  1. `corepack pnpm --filter @ottimo/api-client test`.
  2. Hoặc `corepack pnpm --filter @ottimo/api-client gen` rồi `git diff -- product/packages/api-client/src/generated/openapi.ts`.
- **Thực tế:** `src/generated.test.ts` đỏ (36/37). Bản sinh lại có thêm 3 dòng mô tả "0.3.12 (SEC-BA-104-09 a): `privacy_notice_version` chỉ nhận chuỗi đúng từng ký tự … `422 PARAM_OUT_OF_RANGE` kèm `allowed[]`". Bản đã commit không có 3 dòng đó.
- **Mong đợi:** tệp sinh khớp `openapi.yaml`, test drift xanh.
- **Đề xuất sửa:** `pnpm --filter @ottimo/api-client gen`, commit tệp sinh, kèm sửa BUG-R4-029 (a) để lần sau CI tự bắt.
- **Bằng chứng:** log `qa104/unit/test.clean.log` (scratchpad) dòng `src/generated.test.ts (1 test | 1 failed)`. Bản sinh lại tạm đã xóa lúc dọn; tái hiện bằng bước 2.
- **Vai chịu trách nhiệm:** BE-C (chủ P4-16). ARC (chủ hợp đồng) xác nhận.
- **Trạng thái:** **Đã gộp `main` `6800cc45` (#61)** – trước đó: Đã sửa – chờ gộp #61 (QA xác nhận 04/11 khuya).
  - PR #61 sinh lại `src/generated/openapi.ts` (thêm đúng 3 dòng mô tả 0.3.12).
  - Job `126574160088`: `@ottimo/api-client:test` cache miss, 37/37 đạt (gồm `src/generated.test.ts`).
  - Đầu vào test đã có `openapi.yaml` (BUG-R4-029 (a)), nên lần lệch sau CI sẽ tự bắt.

### BUG-R4-031 – `integrations`: test đối chiếu luật email với `ops-check.sh` đỏ từ P4-04
- **Mức:** P3. Luật thật vẫn khớp nhau: QA thay hằng vào bản chép tạm, test chạy 39/39. Nhưng bộ test của EM-14 đang đỏ, và nếu để vậy thì lần lệch thật tiếp theo sẽ không ai thấy.
- **Môi trường:** worktree `40825ee1`, `corepack pnpm --filter @ottimo/integrations test`, không cache.
- **Liên quan:** TC-V104-EM-14, TC-V104-RG-04, TC-V104-OP-08. Commit gây lệch: 488a3044 (P4-04 `ops-check`).
- **Các bước tái hiện:**
  1. `corepack pnpm --filter @ottimo/integrations test`.
  2. Xem `product/integrations/notification/email-address.test.ts` dòng 100–129: test lấy regex bằng `/a\.e ~ '([^']+)'/` trong hàm `check_email_ascii()` của `infra/server/bin/ops-check.sh`.
  3. Xem `ops-check.sh`: từ P4-04, câu SQL viết `a.e ~ '$EMAIL_RULE_RE'`, hằng `EMAIL_RULE_RE=` khai ở dòng 194.
- **Thực tế:** test bóc được chuỗi `$EMAIL_RULE_RE` (tên biến shell), dựng regex từ chuỗi đó, nên `owner@example.test` không khớp. Kết quả: 1 đỏ (294/295).
- **Mong đợi:** test đọc giá trị của `EMAIL_RULE_RE` (hoặc `ops-check.sh` in luật ra bằng một lệnh phụ để test gọi), so với luật TS dùng chung, và xanh.
- **Đề xuất sửa:** sửa test cho đọc dòng `EMAIL_RULE_RE='…'` khi gặp `$EMAIL_RULE_RE`. Kèm sửa BUG-R4-029 (b).
- **Bằng chứng:** log `qa104/unit/test.clean.log` dòng `notification/email-address.test.ts (39 tests | 1 failed)`. Bản chép tạm đã thay hằng (đã xóa): 39/39.
- **Vai chịu trách nhiệm:** OPS (P4-04 đổi `ops-check.sh`) sửa test cùng INT (chủ bộ test `notification`).
- **Trạng thái:** **Đã gộp `main` `6800cc45` (#61)** – trước đó: Đã sửa – chờ gộp #61 (QA xác nhận 04/11 khuya).
  - PR #61 sửa test: khi câu SQL dùng `$EMAIL_RULE_RE`, test đọc giá trị thật của hằng `EMAIL_RULE_RE` trong `ops-check.sh`. Thêm 1 ca, nên tổng là 296 ca.
  - Job `126574160088`: `@ottimo/integrations:test` cache miss, 296/296 đạt.
  - Đầu vào test đã có `ops-check.sh` (BUG-R4-029 (b)).

### BUG-R4-032 – Sổ tay v1.0.4 chưa có đường "Đặt lại xác thực 2 bước"
- **Mức:** P2. Tài liệu dẫn người dùng tới cách vòng tốn công, trong khi v1.0.4 đã có nút (BUG-R4-020, P4-30). Theo cách vòng, người mất điện thoại bị tạo **tài khoản mới**: lịch sử thao tác bị tách làm hai, phải gán lại vai và email. Có cách khắc phục, nên chưa tới P1.
- **Môi trường:** `product/docs/manual/guides/*.md` trên `40825ee1` (01 bản 1.6, 03 và 04 bản 1.3, 00 bản 1.9 – đều "áp dụng từ v1.0.4"). Chỉ đọc tài liệu.
- **Liên quan:** TC-V104-MN-02 (QC 7.4), BUG-R4-020, TC-V104-MF-09…12.
- **Các bước tái hiện:**
  1. `grep -rn "Đặt lại xác thực" product/docs/manual/guides/` → không có kết quả.
  2. Mở tệp 01, mục "Các việc khác" (khoảng dòng 235–242): chỉ có **Đặt lại mật khẩu**, **Khóa tài khoản**, **Sửa email**.
  3. Bảng "Mất điện thoại" (dòng 175–176): quản lý hoặc vai dùng app nhân viên mất cả điện thoại lẫn mã khôi phục → "(1) Khóa tài khoản … tên đăng nhập mới".
- **Thực tế:**
  - Không có hướng dẫn **Khác… → Đặt lại xác thực 2 bước** (hộp S2, lý do ≥ 3 ký tự, thư `mfa_reset` tới email bảo mật của người đó).
  - Dòng 160 đã nhắc thư "Security notice: 2-step verification was reset", nhưng không nói ai bấm, bấm ở đâu.
  - Câu "không bật đăng nhập 2 bước ở v1.0.x" còn ở 01 dòng 227 (mục 1.9 bước 8), 03 dòng 105, 04 dòng 108. Mỗi chỗ đã có hộp "Áp dụng từ v1.0.4" ghi câu cũ hết hiệu lực (01 dòng 199). Phần này BA giữ có chủ đích vì v1.0.3 đang chạy. QC 7.4 cần chốt: gỡ câu cũ lúc deploy, hay giữ hộp là đạt.
- **Mong đợi (MN-02):** có đường **Đặt lại xác thực 2 bước** cho chủ đầu tư, kèm luật gặp tận mặt của SEC. Đường này thay bước "Khóa + tạo tài khoản mới" ở 2 hàng mất điện thoại, áp dụng từ v1.0.4. Câu "chưa bật 2 bước" được gỡ hoặc được QC chấp nhận ở dạng hộp.
- **Bằng chứng:** grep ở bước 1 (0 kết quả); trích dòng 175–176, 199, 227, 237 của `01-chu-dau-tu-quan-ly.md`.
- **Vai chịu trách nhiệm:** BA (sổ tay). SEC đọc lại câu "gặp tận mặt", UXD dựng lại HTML (MN-01).
- **Trạng thái:** **Đã gộp `main` `c2506a53` (#63)**. QA2 05/11 07:15 đọc trên `main`: có đường **Đặt lại xác thực 2 bước** (`01` 1.7 hàng 175–176 và 1.9; `00`, `02`–`05`). Câu "không bật đăng nhập 2 bước ở v1.0.x" còn ở `01` dòng 228: QC 7.4 chốt. Còn: MN-02. Trước đó: Mới.

### BUG-R4-033 – Bộ test: S1-SEC-16 (API) flaky khi chạy song song – 429 của giới hạn đăng nhập theo IP
- **Mức:** P3 (bộ test). Sản phẩm đúng: giới hạn SR-RL-01 `loginPerIp` 20 lần / 15 phút làm đúng việc.
- **Môi trường:** stack `ottimo-qa104`, `pnpm test:e2e` như job docker-build của CI (`CI=1`, retries 1), 04/11 18:24 giờ VN.
- **Liên quan:** `product/tests/e2e/api/mfa-s2.r3s1.api.spec.ts:230` (S1-SEC-16 + ARC 12.3 #1–#3). CI từng gặp flaky ở ca này.
- **Các bước tái hiện:** chạy trọn bộ E2E với nhiều worker. Mọi worker đăng nhập từ cùng `127.0.0.1`.
- **Thực tế:**
  - Lần 1 đỏ ở bước "mã TOTP của bí mật cũ bị từ chối": mong 401, nhận **429** (`Retry-After` ~851 giây). Lý do: cửa sổ 20 lần đăng nhập/IP đã bị các ca song song dùng hết. Lần thử lại (retry 1) xanh.
  - Chạy riêng 3 lần (`--project=api --project=desk-chromium --no-deps --retries=0 --grep S1-SEC-16`): **3/3 xanh** cả bản API lẫn bản UI.
  - Tỉ lệ ca API: 4 đạt / 5 lần thử; lần đỏ duy nhất là lúc chạy song song đủ tải.
- **Mong đợi:** ca không phụ thuộc số lần đăng nhập của ca khác.
- **Đề xuất sửa (QA):** `loginMfa`/ca S1-SEC-16 gặp 429 ở bước đăng nhập thì gọi điểm test xóa bộ đếm (như các ca `limits`), hoặc đưa ca vào project tuần tự sau `api`. Không nới giới hạn của sản phẩm.
- **Bằng chứng:** `qa104/e2e-full/report.json` (status `flaky`, lỗi lần 1), `qa104/e2e-sec16-1..3/` (scratchpad). Trace lần đỏ đã xóa vì có thân yêu cầu đăng nhập.
- **Vai chịu trách nhiệm:** QA.
- **Trạng thái:** **Đã gộp `main` `b2a8b2a8` (#62)** – trước đó: Đã sửa, chờ merge. PR #62 (nhánh `v104/qa-flaky-fixes`, head `9fb9cef3`).
  - Cách sửa: `loginMfa()` gặp 429 `RATE_LIMITED` thì gọi `POST /__test__/rate-limits/reset` (`resetRateLimits`, giống `login()`) rồi gửi lại đúng body đó **một** lần. Limiter chạy trước khi đọc token và mã, nên lần 429 không tiêu gì. Khóa tài khoản `qa.e2e.*` không bị reset, nên khóa thật của SR-AUTH-04 vẫn làm ca đỏ. Giới hạn của sản phẩm giữ nguyên.
  - Chạy lại (stack `ottimo-qaflaky`, `--retries=0`), kèm một vòng đăng nhập sai liên tục để làm đầy cửa sổ IP:
    - bản cũ: **0/2**;
    - bản sửa: **5/5** (`--repeat-each=5`; vòng đăng nhập sai nhận 111/146 lần 429).
  - Toàn bộ project `api` với bản sửa: 214 đạt, 4 bỏ qua, 0 đỏ, 0 flaky.
  - Đóng sau khi PR #62 vào `main` và CI E2E xanh.

### BUG-R4-034 – Bộ test: TC-L2-033 flaky – ca song song khóa OOO cùng đêm của căn 401
- **Mức:** P3 (bộ test). Sản phẩm đúng: khối trùng khối khác bị từ chối `409 ROOM_BLOCKED`.
- **Môi trường:** như BUG-R4-033, 04/11 18:24 giờ VN.
- **Liên quan:** `product/tests/e2e/api/room-blocks.api.spec.ts:174` (TC-L2-033, BR-804-01). Cùng họ với BUG-R2-024 (đã đóng 16/10, khi đó lý do là đặt phòng song song).
- **Các bước tái hiện:** chạy trọn bộ E2E với nhiều worker. `freeWindow()` chỉ xét đơn đặt khi chọn khoảng đêm trống cho căn 401. Trong lúc đó, một ca khác của cùng tệp tạo khối OOO trên căn 401.
- **Thực tế:** lần 1 `createRoomBlock` → **409 `ROOM_BLOCKED`** (`conflicts: [{roomNo: "401", nights: ["2027-01-18"], kind: "ooo"}]`). Lần thử lại xanh.
- **Mong đợi:** ca tự chọn lại khoảng đêm khi gặp `ROOM_BLOCKED`, như vòng thử `WindowTakenError` đã làm cho đơn đặt. Hoặc mỗi ca khóa dùng một căn riêng.
- **Bằng chứng:** `qa104/e2e-full/report.json` (status `flaky`).
- **Vai chịu trách nhiệm:** QA.
- **Trạng thái:** **Đã gộp `main` `b2a8b2a8` (#62)** – trước đó: Đã sửa, chờ merge. PR #62 (head `9fb9cef3`).
  - Phạm vi mở rộng: chạy 40 lần đã lộ cùng lỗi ở TC-L2-030, nên cả 4 ca khóa của tệp đều được sửa.
  - Cách sửa:
    - Thêm `blockOnFreeWindow()`: nếu `createRoomBlock` trả 409 `ROOM_BLOCKED` hoặc `ROOM_UNAVAILABLE`, chọn khoảng trống khác, tối đa 4 lần, có ghi log. Mọi mã khác vẫn làm ca đỏ.
    - Khe thứ hai của TC-L2-033: ca khác khóa căn 401 đúng đêm mở bán lại. Ca chỉ chấp nhận `blocked` ở đêm đó khi `listRoomBlocks` cho thấy một khối khác còn hiệu lực che đêm này, và khối của ca này kết thúc đúng ngày mở lại.
  - Chạy lại (`--retries=0`):
    - bản cũ: TC-L2-033 **9/10** (6 worker);
    - bản sửa đầu: TC-L2-033 39/40, TC-L2-030 39/40 (8 worker);
    - bản cuối, hai lượt `--repeat-each=40` (8 worker): TC-L2-030, TC-L2-031 + 032 và TC-L2-033 đều **40/40 và 40/40**.
    - Trong hai lượt cuối, các nhánh thử lại đều đã chạy thật: chọn khoảng khác 5 lần, đêm mở lại bị khối khác che 1 lần.
  - Đóng sau khi PR #62 vào `main` và CI E2E xanh.

### BUG-R4-035 – Trả phòng: số điền sẵn của tủ minibar gán trễ, Desk có thể gửi "tủ đầy" và đảo dòng minibar đã tính
- **Mức:** **P1** (QA chốt 04/11).
  - Lỗi này ảnh hưởng tiền. Ở khoảng hở, Desk gửi "tủ đầy", máy chủ hiểu là khách không dùng gì và đảo dòng minibar đã tính. Khách sạn mất khoản đó mà không ai được báo. Đây đúng là họ lỗi BUG-R2-144 / BR-703-02 (khi đó mức P1).
  - Lý do không xếp P0: khoảng hở chỉ dài vài tác vụ render, từ lúc dữ liệu tủ hiện ra tới lúc số điền sẵn được gán. Người bấm tay khó rơi đúng lúc đó. Hiện chỉ thấy ở test tự động chạy song song. Ngoài ra, nhánh "đang tải" vẫn bị máy chủ chặn ở B18 (`minibar_not_checked`), nên không mất tiền.
  - **Nâng P0** nếu tái hiện được bằng thao tác tay (máy chậm, staging) hoặc thấy dòng minibar bị đảo trên dữ liệu thật.
  - Là P1 nên lỗi phải đóng trước QC rút gọn 08/11.
- **Môi trường:**
  - Desk (admin-web), trang `/reservations/{id}/check-out`, bước ① Minibar.
  - FE-A thấy lần đầu ở CI của PR #65, test unit đỏ.
  - QA đọc mã trên `main` @ `58183764`. PR #64 (P4-32) không chạm phần minibar này.
- **Liên quan:**
  - `product/apps/admin-web/src/pages/stay/CheckOutPage.tsx` (dòng theo `58183764`);
  - test `product/apps/admin-web/src/__tests__/s4-144-fea.test.tsx`, ca "gia hạn sau khi đã đếm (DOM (b))…" (dòng 60);
  - BUG-R2-144 / BR-703-02 (điền sẵn theo lần đếm trước, không bao giờ từ tủ đầy); K11-03 (đếm nhiều tủ sau B14).
- **Các bước tái hiện:**
  1. Đơn đang ở đã đếm tủ (có dòng minibar đã tính). Gia hạn (B13), nên tủ phải đếm lại (`stay_continued`).
  2. Mở Trả phòng. Bấm **Tiếp tục** (`co.go_extras`) ngay khi câu "cần đếm lại" hiện. Câu này đến từ `CheckoutSummary`, có thể hiện trước khi `minibar-standard` tải xong.
  3. Tự động: `corepack pnpm --filter @ottimo/admin-web exec vitest run src/__tests__/s4-144-fea.test.tsx -t "gia hạn sau khi đã đếm"`, chạy 6 tiến trình song song.
     - FE-A: đỏ 1/30 khi chạy song song, 0/20 khi chạy riêng.
     - Máy QA (04/11 19:41, 30 lần, 6 tiến trình): 0/30 đỏ. Tỉ lệ phụ thuộc tải máy, nên QA dựa vào đọc mã để xác nhận cơ chế.
     - Máy QA (04/11 khuya, `main` @ `4bf353da`, 32 lần, **16 tiến trình**): **1/32 đỏ**. Lượt đỏ ở đúng ca "gia hạn sau khi đã đếm", báo `expected 2 to be +0`, tức `remainingQty` của coke là số chuẩn thay vì 0. Dấu hiệu này khớp nhánh (a).
     - Vẫn chỉ tái hiện được bằng test tự động khi máy quá tải, nên mức giữ P1.
- **Thực tế (QA đọc mã):**
  - (a) **Khoảng hở "tủ đầy" – sai tiền.**
    - `left` (số còn trong tủ) chỉ được gán trong `useEffect` (dòng 245–267), chạy sau khi render có `std.state.data`.
    - Ở render đó `std.state.status = 'ready'`, nhưng `left` vẫn là `{}`. Hàm bấm `saveMinibar` (dòng 580) đọc `left` của chính render đó, rồi gửi `remainingQty: left[i.itemId] ?? i.standardQty` (dòng 604), tức **tủ đầy**.
    - Máy chủ ghi lần đếm "không dùng gì" và đảo dòng đã tính. Ca test kiểm `remainingQty` của coke phải bằng 0, nhận về số chuẩn.
  - (b) **Bấm lúc đang tải – bỏ bước đếm.**
    - Khi `minibar-standard` chưa có dữ liệu, `items = []`, nên `chargeable = false` (dòng 421).
    - `saveMinibar` đi nhánh `!chargeable` (dòng 581): sang bước ② mà **không** gửi lần đếm. Ca test chờ 1 lệnh `POST …/minibar-checks` và nhận 0.
    - Máy chủ vẫn chặn B18 bằng blocker `minibar_not_checked`, nên không sai tiền. Nhưng lễ tân phải quay lại bước ①.
  - (c) Cùng khoảng hở, QA đọc mã, **chưa tái hiện**: sau B14, khi chuyển sang tủ thứ hai.
    - `useResource` giữ dữ liệu cũ trong lúc tải tủ mới. Lúc đó `status ≠ 'ready'`, nên bấm không gửi gì (đúng).
    - Nhưng ở render đầu tiên có dữ liệu tủ mới, `left` vẫn là số của **tủ trước**. Nếu hai tủ cùng mã món, Desk có thể gửi số của tủ trước cho tủ mới, có thể tính **thừa** cho khách.
    - FE-A xem cùng lúc khi sửa.
- **Mong đợi:**
  - Số gửi đi luôn là số điền sẵn của **đúng** lần đọc `minibar-standard` đang hiện, theo BR-703-02: lần đếm trước, hoặc số đã sửa trên folio. Không bao giờ là tủ đầy mặc định, không bao giờ là số của tủ khác.
  - Khi `minibar-standard` chưa sẵn sàng thì **Tiếp tục** bị khóa hoặc không làm gì; không được sang bước ② mà bỏ qua lần đếm.
  - Ví dụ cách sửa (FE-A quyết):
    - tính số điền sẵn ngay trong render, khóa theo lần đọc (`loadedAt` / `roomId` + `periodId`), thay cho `useEffect`;
    - hoặc trong `saveMinibar`, từ chối gửi khi `left` chưa được gán cho đúng lần đọc này.
  - Test chống tái phát: một ca bấm **Tiếp tục** ngay ở render đầu có `std` (không chờ `useEffect`), và một ca bấm lúc `std` đang tải. Cả hai phải đỏ trên mã cũ một cách ổn định, không phụ thuộc tải máy.
- **Bằng chứng:**
  - log CI PR #65 (FE-A), job `format · lint · audit · test · build`;
  - log 30 lần chạy của QA (scratchpad, không commit, không có bí mật): `qahd/flake/run-*.log`, `summary.txt`;
  - log 32 lần chạy ở 16 tiến trình (scratchpad, không commit): `qarace/p16/s4-144-fea-*.log`, lượt đỏ là `s4-144-fea-6.log`;
  - các dòng mã nêu trên.
- **Vai chịu trách nhiệm:** FE-A (chủ H16 minibar). ARC xem cách khóa số điền sẵn theo lần đọc. QA chạy lại ca s4-144 ở chế độ song song, cộng ca chống tái phát, sau khi PR vào `main`.
- **Xác minh bản sửa (QA2, 05/11 00:45):**
  - Bản thử: nhánh `v104/fix-s4-144-flake` @ `ceda9278`. Đây đúng là head đã gộp vào `main` (`217afac0`).
    - Worktree tạm và stack local dùng một lần `ottimo-qa2p67` (api, web, worker, postgres). Seed DS-E, `CLOCK_MODE=mutable`. Đã dọn.
    - Không chạy gì trên staging hay production.
  - **(1) Gỡ từng phần sửa thì đúng ca đỏ.** Chạy 3 tệp `s4-144-fea`, `v104-minibar-prefill-fea`, `bug-r4-038-fea` (23 ca), mỗi biến thể 3 lượt. 3 lượt cho kết quả giống nhau:

    | Biến thể | Phần bị gỡ | Kết quả |
    |---|---|---|
    | HEAD | không gỡ | 23/23 xanh |
    | V0 | `CheckOutPage.tsx` và `Controls.tsx` về bản trước #67 (`ea979fe7`) | 10 đỏ: 2 ca s4-144 (bấm ở đúng commit hiện tủ; bấm lúc đang đọc chuẩn), BUG-R4-035 (sửa tủ A rồi chuyển tủ B), ARC 01 (a) và (b), ARC 03, UXD 01, `minibarPrefill` (tủ đầy), 2 ca BUG-R4-038 |
    | V1 | chỉ `lateFeeFree` (BUG-R4-038 phía Desk) | 2 đỏ, đúng 2 ca `bug-r4-038-fea` |
    | V2 | chỉ `cabinetSettled` (ARC 03) | 1 đỏ, đúng ca ARC 03 |
    | V3 | chỉ `stdForCabinet` và `Stepper disabled` (ARC 01, UXD 01) | 3 đỏ, đúng ARC 01 (a), (b) và UXD 01 |

    Mọi ca đỏ là lỗi assert, không có quá giờ.
  - **(2) Tải 12 tiến trình × 10 lượt** (`load.sh` của FE: `s4-144-fea` và `v104-minibar-prefill-fea`, 20 ca mỗi lượt):

    | Lượt | Giới hạn mỗi ca | Tải 1 phút (thấp – cao) | Đỏ / 120 | Loại |
    |---|---|---|---|---|
    | A | mặc định 15 s | 41,6 – 130,8 | 12 | 11 lượt đỏ cùng một lúc (lượt thứ 8 của cả 12 tiến trình), đúng lúc tải lên 100–131. Thêm 1 lượt mà hook khởi động quá giờ, nên 20 ca bị bỏ qua. Trong 11 lượt đó: 47 ca quá giờ, 2 hook quá giờ, 13 lần `findBy…` hết giờ chờ. Có 4 assert `'2'` khác `'1'` ở ca UXD 01: lỗi này kéo theo từ ca quá giờ ngay trước, vì 2 ca dùng chung `screen` và mock. Không có lỗi assert do mã sản phẩm |
    | A2 | mặc định 15 s (cùng lệnh) | 66,6 – 100,6 | 0 | – |
    | B | 60 s | 57,3 – 90,4 | 0 | – |

  - **(3) Desk thật** (Chromium, project `desk-clock`, đồng hồ giả, test tạm của QA2, xóa cùng worktree):
    - **Ca 2 tủ sau B14.**
      - Diễn biến:
        1. Tủ cũ 202 được chọn trước.
        2. Lễ tân chuyển sang tủ căn đang ở trong lúc bản tóm tắt tính theo giờ bị giữ lại, rồi gõ bia dùng 1.
        3. Nhả bản tóm tắt: trang vẫn ở tủ đã chọn, số đã gõ còn nguyên.
        4. **Tiếp tục**: Desk đếm tủ căn đang ở, rồi sang 202. Gõ bia dùng 1, bấm ngay.
      - Kết quả: 2 lệnh 201, đúng `roomId`. Bill, thu tiền mặt, **Hoàn tất**: folio `settled`, 2 dòng minibar 35.000, không có dòng đảo. Đạt 2/2 lượt.
    - **Ca lõi BUG-R4-035.**
      - Diễn biến: D+1 đếm bia dùng 1, rồi B13 thêm 1 đêm. Ngày đi, bấm **Tiếp tục** ngay khi câu "cần đếm lại" hiện.
      - Kết quả: lệnh gửi `remainingQty` bia = số chuẩn − 1 (theo lần đếm trước), không phải tủ đầy. Dòng minibar giữ nguyên, không có dòng đảo. Đạt.
    - **TC-L4-138** (spec có sẵn): lượt đầu đỏ (quá giờ, tải 45–64), 2 lượt sau xanh.
      - Nguyên nhân là lỗi mới BUG-R4-042, có từ trước #67, không phải hồi quy của #67.
  - **Kết luận: ĐẠT.**
  - Gợi ý cho FE, không chặn: ca UXD 01 nên tự dọn khi ca trước quá giờ (render riêng, đặt lại mock). Như vậy khi tải nặng, ca này không đỏ kéo theo.
- **Trạng thái:** **Đã sửa – đã gộp #67** (`main` @ `217afac0`), đạt local (QA2 05/11). Chờ STG ở TC-V104-RG-18.
  - Trước đó: Mới, FE-A sửa ở PR `v104/fix-s4-144-flake`.

### BUG-R4-036 – 00:00–05:59: Desk không có nút Trả phòng cho khách rời trong cửa sổ sau nửa đêm
- **Mức:** **P1** (QA2 nâng 05/11 05:30 theo điều kiện ghi dưới, vì CO-05 đỏ trên stack). Trước đó là **P2** (QA chốt 04/11); DOM và ORC đề xuất P3.
  - Theo `product/docs/qa/test-strategy.md` mục 8, P3 dành cho thẩm mỹ, chính tả, câu chữ. Lỗi này là thiếu chức năng ở một luồng chính (Trả phòng), có cách làm tạm. Mô tả đó khớp P2: "chức năng phụ sai; UX gây nhầm có cách khắc phục".
  - Không xếp cao hơn, vì không sai tiền nếu làm theo cách làm tạm (Trả phòng từ 06:00, ghi giờ thực tế). Cách làm tạm cũng không tốn công.
  - P2 được dời có kế hoạch. Điều kiện: sổ tay và release notes có cách làm tạm, và CO-05 đạt trên STG.
  - Nếu CO-05 đỏ (Desk không nhận giờ 04:30, hoặc tính phụ thu), cách làm tạm không dùng được. Khi đó nâng **P1**.
  - Nếu ORC không đồng ý mức này, ORC phân xử.
  - **05/11 05:30: điều kiện trên đã xảy ra.** Desk không nhận giờ 04:30 (mục "Xác minh cách làm tạm – CO-05" dưới). QA2 nâng **P1**.
    - Hạ lại P2 và dời v1.0.5 như cũ khi đủ hai điều kiện: (1) sổ tay và release notes đổi sang cách làm tạm mới (ARC `ARC-on-v104-bug050-rule.md` mục 2); (2) CO-05 bản 0.15 đạt trên STG.
    - QA2 đã chạy cách làm tạm mới trên stack: đạt, tiền đúng.
  - **05/11 06:00:** CO-05 bản 0.15 đạt trên `main`, và câu ở #85, #66 khớp (mục "Xác minh CO-05 bản 0.15" dưới). Theo ORC, điều kiện (2) là lượt local này; CO-05 trên STG 07/11 là lần xác nhận lại. Còn điều kiện (1): khi #85 và #66 gộp thì ORC hạ P2, QA không cần chạy lại.
- **Môi trường:** đọc mã trên `main` @ `58183764`. DOM tìm khi đọc mã cho PR #68 (sổ tay). Chưa chạy trên stack. Lỗi có từ khi có luật cửa sổ sau nửa đêm (DOM S3-9), tức từ v1.0.2.
- **Liên quan:**
  - `rounds/round-04/reviews/DOM-on-v104-pr68-docs.md` mục 2 và ghi chú cho ORC (mục 4);
  - `product/services/api/src/modules/reservations/internal/allowed-actions.ts` dòng 115;
  - `reservations.service.ts` dòng 451 (`today: ctx.today`);
  - `product/apps/admin-web/src/pages/dashboard/useDashboard.ts` dòng 79;
  - `product/services/api/src/modules/reporting/internal/stay-lists.ts` `departureRows` (dòng 83);
  - `product/services/api/src/modules/frontdesk/internal/checkout.service.ts` `postMidnight()` (dòng 651) và `departure()`;
  - TC-V104-CO-05 (cách làm tạm).
- **Các bước tái hiện** (ví dụ của DOM):
  1. Khách đang ở, ngày đi 03/11.
  2. Lúc 04:30 ngày 03/11, ngày nghiệp vụ vẫn là 02/11 (đổi ngày lúc 06:00). Mở khung đơn của khách.
  3. Mở trang **Hôm nay**, mục khách đi.
- **Thực tế (đọc mã):**
  - Khung đơn không có nút **Trả phòng**. Lý do: `allowed-actions.ts:115` chỉ thêm `check_out` khi `c.today === c.departureDate`, mà `today` là ngày nghiệp vụ (02/11). Vai lễ tân, quản lý và chủ đầu tư đều đi qua luật này, nên cũng không thấy nút.
  - Trang **Hôm nay** gọi `getArrivalsDepartures` không kèm ngày, nên máy chủ lấy ngày nghiệp vụ. `departureRows` chỉ lấy đơn có ngày đi bằng ngày đó, nên khách đi 03/11 chưa có trong danh sách.
  - Trong khi đó, máy chủ B18 nhận cửa sổ này: `postMidnight()` đúng khi ngày nghiệp vụ = ngày đi − 1 và ngày lịch = ngày đi. Trong cửa sổ, không phụ thu trả muộn, không thêm đêm.
  - Kết quả: Desk không có lối vào trang Trả phòng trong 00:00–05:59. Sổ tay cũ dạy "khung đơn → Trả phòng; không thấy nút thì hỏi quản lý", nên lễ tân đi vào ngõ cụt.
- **Mong đợi:** trong cửa sổ sau nửa đêm, khách có ngày đi = ngày lịch hôm nay phải có nút **Trả phòng** ở khung đơn (và có mặt ở trang Hôm nay), đúng luật máy chủ đã nhận.
- **Cách làm tạm cho v1.0.4 – bản mới** (ARC `ARC-on-v104-bug050-rule.md` mục 2; DOM/BA sửa sổ tay và release notes, ORC chốt):
  - Không làm Trả phòng trước 06:00. Ghi giờ khách rời thật vào sổ giao ca.
  - **Từ 06:00** (trước 12:00): khung đơn → **Trả phòng**. Giữ **giờ Desk điền sẵn** (giờ hiện tại). **Không gõ giờ trước 06:00.**
  - Trước 12:00 không có phụ thu, nên tiền đúng. Giờ trả trên bill là giờ bấm, không phải giờ khách rời.
- **Cách làm tạm cũ (sai, không dùng)**, theo thẻ 01 của DOM: từ 06:00, ở bước Phụ phí ghi **Giờ trả phòng thực tế** đúng giờ khách đi, ví dụ 04:30. DOM giả định Desk không phụ thu, không thêm đêm. Thử trên stack 05/11: **đỏ** (mục dưới).
- **Xác minh cách làm tạm – CO-05 (QA2 05/11 05:30):**
  - Môi trường: stack local dùng một lần `ottimo-qa2p86` (`CLOCK_MODE=mutable`, seed DS-E, mốc đổi ngày 06:00, giờ trả chuẩn 12:00), Desk Chromium, `qa.fd`. Web chạy ở `main` `585cf0ba`, rồi ở #86 `45d2cfed`. Máy chủ cùng mã ở cả hai lần. Đã dọn.
  - Ca: đơn Trực tiếp 1 đêm, ngày đi D+1, đã trả đủ. Đồng hồ 06:10 ngày D+1, mở Trả phòng.
  - (1) Cách làm tạm cũ: gõ **04:30** ở Giờ trả phòng thực tế, rồi Hoàn tất.
    - Bản tóm tắt `checkoutTime=04:30` ra `extraNightRequired: true`. Desk hiện hộp "Trả sau mốc trả muộn", "Còn phải thu 792.000 đ". Ô ghi chú giờ không hiện.
    - B18 `{checkoutTime:"04:30", extraNight:{}, finalPayment:{cash 792.000}}` → **422** `checkoutTime TIME_AFTER_ACTION`. Desk báo "Giờ này muộn hơn hiện tại. Ghi đúng giờ đã diễn ra – không ghi giờ chưa tới."
    - Đơn vẫn Đang ở, không ghi tiền. Lễ tân bị kẹt.
    - Kết quả như nhau ở `585cf0ba` và `45d2cfed`. Gốc ở BUG-R4-051.
  - (2) Cách làm tạm mới: giữ giờ điền sẵn 06:10, khách dùng 1 bia, thu tiền mặt.
    - Không có hộp đêm thêm, không phụ thu. Bill: tiền phòng và minibar 35.000; "Còn phải thu 35.000 đ".
    - B18 `{checkoutTime:"06:10"}` → 200. `actualCheckoutAt` 06:10. Folio `settled`, không có dòng `extra_night` hay `late_checkout`. Ngày đi giữ D+1. **Tiền đúng.**
  - (3) Đối chứng API: B18 kèm `checkoutAt` 04:30 ngày D+1 và ghi chú → 200, 0 đ phụ thu. Đây là đường ghi lùi (ARC mục 4, dời v1.0.5). Desk không có đường này.
  - (4) Lúc 04:30, trong cửa sổ: `allowedActions` không có `check_out`, đúng mô tả lỗi. B18 gọi thẳng qua API → 200, 0 đ.
  - **v1.0.3 (production): có cùng hành vi** (theo mã, không chạy stack v1.0.3).
    - Desk ở `v1.0.3` gửi B18 chỉ với `checkoutTime` (`CheckOutPage.tsx` dòng 664).
    - Luật đọc giờ gõ không đổi từ `v1.0.3` tới `585cf0ba`: `checkTypedTime`, `businessMinutes`, dung sai `manual_time_tolerance_minutes` ở `stay-support.ts`.
  - Bằng chứng (scratchpad, không commit, dữ liệu giả): `qa2-pr86-out/co05-main-data.txt`, `e2e-t4/data.txt`, `zz-qa2-co05.spec.ts.bak`, `zz-qa2-pr86.spec.ts.bak`.
- **Xác minh CO-05 bản 0.15 (QA2 05/11 06:00):**
  - Bản thử: `main` `f670d99b` (đã có #86) gộp tại chỗ với #87 `e2d616f8`. Stack local dùng một lần `ottimo-qa2m87`, giống lượt trước. Đã dọn.
  - Ca: đơn Trực tiếp 1 đêm, ngày đi D+1, đã trả đủ. Giả định khách rời 04:30 và giờ này đã ghi vào sổ giao ca. Trả phòng giữ giờ Desk điền sẵn.

    | Đồng hồ ngày D+1 | Minibar | Desk | B18 | Sau trả phòng |
    |---|---|---|---|---|
    | 06:05 | không | Không có hộp đêm thêm; "Còn phải thu 0 đ"; nút "Đã thu 708.000 đ – hoàn tất" | `{checkoutTime:"06:05"}` → 200 | `settled`, chỉ dòng tiền phòng 708.000; `actualCheckoutAt` 06:05 |
    | 06:10 | 1 bia | "Còn phải thu 35.000 đ"; thu tiền mặt | `{checkoutTime:"06:10"}` → 200 | `settled`, tiền phòng và minibar 35.000 |
    | 11:55 | 2 bia | "Còn phải thu 70.000 đ"; thu tiền mặt | `{checkoutTime:"11:55"}` → 200 | `settled`, tiền phòng và minibar 70.000; không phụ thu trả muộn |

  - Không ca nào có `extra_night` hay `late_checkout`. Ngày đi giữ D+1. **Tiền đúng.**
  - Đối chứng: gõ 04:30 lúc 06:10 vẫn bị B18 trả 422 `TIME_AFTER_ACTION`. Đơn vẫn Đang ở, không ghi tiền (BUG-R4-051).
  - Câu cách làm tạm:
    - #85 `v104/ba-esc045-prices` @ `f9302d82`: sổ tay 2.14a bước 2 và `02` 11.5.1.
    - #66 `v104/po-release-notes` @ `8f2557f7`: mục "Khách đi trước 06:00".
    - Cả hai dạy: từ 06:00, trước 12:00, để nguyên giờ Desk điền sẵn; không gõ giờ trước 06:00; nếu lỡ gõ thì không thu theo số đó, không tạo VietQR, làm lại; giờ thật ghi sổ giao ca. Khớp các bước QA2 đã chạy. QA2 chỉ so các bước, không review câu chữ (việc của DOM/UXD).
  - Bằng chứng (scratchpad, không commit, dữ liệu giả): `qa2-m87-out/e2e-rg/data.txt` (T4, T5), `zz-qa2-m87.spec.ts.bak`.
- **Review câu #66 @ `99d103a0` (QA2 05/11 07:15):**
  - Mục "Khách đi trước 06:00" của #66 vẫn khớp các bước của CO-05 bản 0.15. #85 đã gộp `main` `0dd3fcb3`. Điều kiện hạ P2 về câu đã đủ khi #66 gộp.
  - Nhánh "Quá 12:00 mới làm được" (DOM-PR85-04) có ở sổ tay `main` (`02` 11.5.1) và #66: gõ 12:00, Desk đòi **Ghi chú giờ trả (vì sao ghi bù)**, không phụ thu. QA chưa chạy. Đọc mã trên `main`:
    - `lateCheckoutSurcharge` (`stay-rules.ts`) trả 0 đ khi giờ ≤ giờ trả chuẩn (BR-401, 12:00);
    - `checkTypedTime` (`stay-support.ts`): giờ sớm hơn lúc bấm quá `manual_time_tolerance_minutes` (30) thì đòi `checkoutTimeNote`, không có trần ghi lùi.
    - Như vậy theo mã nhánh này đúng. Chạy CO-05 (b) trên STG 07/11 12:35–13:00 (test case bản 0.18).
- **Đề xuất sửa (v1.0.5):**
  - BE: thêm cửa sổ sau nửa đêm vào `allowedActions` (`check_out` khi `postMidnight(now)` với ngày đi của lượt), cùng một hàm với `checkout.service.ts`, để hai bên không lệch.
  - FE: xem trang Hôm nay có cần xin thêm danh sách khách đi của ngày lịch trong cửa sổ không. `stay-actions.ts` 43–45 đã tính cửa sổ, nhưng trang không bao giờ xin danh sách đó.
  - QA thêm ca E2E đồng hồ ảo lúc 04:30: có nút, B18 200, phụ thu 0.
- **Bằng chứng:** các dòng mã nêu trên ở `58183764`; mục 2 của review DOM. Không có ảnh.
- **Vai chịu trách nhiệm:** BE (`allowedActions`). FE xem trang Hôm nay. DOM/BA đổi câu cách làm tạm trong sổ tay và release notes theo ARC mục 2; UXD đọc câu; ORC chốt.
- **Trạng thái:** Mở – **P1** từ 05/11 05:30. 05/11 07:15: #85 đã gộp `0dd3fcb3`; câu ở #66 @ `99d103a0` khớp. **Hạ P2 khi #66 gộp** (ORC hạ). Nhánh "Quá 12:00" chạy ở CO-05 (b) trên STG. 05/11 06:00: CO-05 bản 0.15 đạt trên `main`; câu ở #85 và #66 khớp. CO-05 chạy lại trên STG 07/11; đỏ thì nâng lại P1. Trước đó: hạ P2 khi sổ tay và release notes có cách làm tạm mới và CO-05 bản 0.15 đạt. Sau đó dời v1.0.5 có kế hoạch như cũ. Sửa thật đi cùng BUG-R4-051 ở v1.0.5. Trước đó: Mới – dời v1.0.5 có kế hoạch (04/11).

### BUG-R4-037 – Đặt phòng mới: giá mỗi đêm của bản xem giá kênh Trực tiếp vẫn còn sau khi chuyển sang OTA / Nội bộ
- **Mức:** **P0** (QA chốt 04/11 khuya).
  - **Lỗi sai tiền và không ai được báo.** Desk gửi giá Trực tiếp của căn mặc định làm giá mỗi đêm của đơn OTA hoặc Nội bộ, kèm `edited:false`. Máy chủ lưu nguyên số đó với nguồn `calendar`, nên trên đơn nó trông như giá lịch do hệ thống tính.
    - Đơn OTA trả tại khách sạn (`ota_pay_at_property`): khách bị thu theo số sai.
    - Đơn OTA trả trước: doanh thu, ADR và số đối soát với OTA sai.
    - Đơn Nội bộ: lẽ ra 0 đ (`complimentary`), nhưng bị ghi giá Trực tiếp.
  - **Tái hiện bằng thao tác tay, mọi lần.** Hộp thoại luôn mở ở kênh Trực tiếp, ngày hôm nay, 1 đêm, căn đầu danh sách. Sau 300 ms, bản xem giá đã điền ô của đêm hôm nay. Người bấm tay luôn chậm hơn 300 ms.
    - Điểm khác BUG-R4-035: ở 035, khoảng hở chỉ dài vài render và chỉ test song song mới gặp. Ở 037, cứ thao tác ở tốc độ người là gặp.
  - `test-strategy.md` mục 8 quy định lỗi tiền mặc định P0, cho tới khi chứng minh không ảnh hưởng tiền. Ở đây QA đã thấy số sai trong yêu cầu Desk gửi đi.
  - Yếu tố giảm nhẹ, chưa đủ để hạ mức:
    - số sai hiện trong ô và sửa được;
    - chỉ các đêm mà bản xem giá đã điền mới bị dính. Đêm hôm nay luôn bị dính. Mọi đêm bị dính nếu lễ tân nhập ngày hoặc căn trước rồi mới chọn kênh.
  - Lỗi có từ `cf6c5575` (16/10), trước v1.0.1. Tag `v1.0.1`, `v1.0.2`, `v1.0.3` đều có, nên **đang ở production**.
    - Protocol quy định P0 sai tiền được hotfix ngoài chu trình round, vẫn qua QA và QC rút gọn. ORC quyết đường hotfix.
- **Môi trường:**
  - Desk (admin-web), hộp **Đặt phòng mới** (H09), `main` @ `4bf353da`.
  - QA tìm ra khi chạy tải nặng 2 test flaky mà OPS báo.
  - QA xác nhận bằng test chẩn đoán tạm, đã xóa. Test này chờ bản xem giá trả về rồi mới bấm kênh, tức đúng nhịp người. Chạy trên MSW, chưa chạy trên stack thật.
- **Liên quan:**
  - `product/apps/admin-web/src/pages/booking/BookingDialog.tsx` (dòng theo `4bf353da`):
    - bản xem giá `calcInput` dòng 282–292 chỉ bật khi `directLike` (Trực tiếp / CTV);
    - effect dòng 302–305: khi bản xem tắt thì chỉ `setCalc(null)`, **không xóa `rates`**;
    - dòng 326–337: kết quả bản xem gán `rates` cho mọi đêm và đặt `ratesEdited: {}`;
    - đổi kênh dòng 985–988: `set({ group })`, giữ nguyên `rates`;
    - `validate` dòng 434–435: OTA có ô có số và ô trống thì báo `booking.error.rate_empty`;
    - `body` dòng 455–463: với OTA và Nội bộ, nếu mọi ô có số thì gửi `nightlyRates`, và `edited` = false vì `ratesEdited` rỗng.
  - `product/services/api/src/modules/reservations/public/pricing.service.ts`:
    - dòng 258–290: giá mỗi đêm gửi lên được dùng nguyên; `edited:false` cho nguồn `calendar`; không có `calendarVnd` với OTA và Nội bộ;
    - dòng 321–337: OTA không gửi giá thì dùng lịch OTA của kênh (BUG-R2-017);
    - dòng 355–356: Nội bộ không gửi giá thì ghi 0 đ.
  - Test: `product/apps/admin-web/src/__tests__/s2-fix.test.tsx` dòng 56 (A-20); `product/apps/admin-web/src/__tests__/booking.test.tsx` dòng 125 (US-139).
  - Lỗi cùng họ: BUG-R2-017 (giá OTA khi không nhập), BUG-R3-005 (số tiền theo báo giá mới nhất).
- **Các bước tái hiện (tay, DS-E, lễ tân `qa.fd`):**
  1. Mở **Đặt phòng mới**. Giữ kênh Trực tiếp, ngày và căn mặc định. Chờ 1 giây: ô giá đêm hôm nay hiện giá Trực tiếp của căn mặc định (căn 101, 667.000).
  2. Bấm **OTA**, đổi căn sang 203, giữ ngày. Chọn khách, nhập mã OTA. Bấm **Tạo đơn**.
  3. Làm lại bước 1. Bấm **OTA**, đổi căn sang 201, đổi ngày đi thành hôm nay + 2. Bấm **Tạo đơn**.
  4. Làm lại bước 1. Bấm **Nội bộ**, nhập ghi chú, chọn khách. Bấm **Tạo đơn**.
- **Thực tế** (test chẩn đoán, 4 lượt cho bước 2–3, 1 lượt cho bước 4, kết quả giống nhau mọi lượt):
  - Bước 2: sau khi chuyển OTA, ô vẫn là `667.000`. Desk gửi `POST /reservations` cho căn 203, kênh OTA, với `nightlyRates=[{"date":"2026-11-04","amountVnd":667000,"edited":false}]`. Không có cảnh báo nào.
    - Theo mã máy chủ: đơn lưu 667.000 với nguồn `calendar`, thay cho giá lịch OTA của kênh. Số này còn là giá của **căn khác** (101).
  - Bước 3: ô là `["667.000", ""]`. Desk chặn với câu "Nhập giá mỗi đêm (lớn hơn 0)" và không tạo đơn. Cảnh báo sức chứa và câu xung đột không hiện.
    - Câu này dẫn lễ tân đi điền ô trống, còn ô đầu vẫn giữ giá Trực tiếp. Kết quả là đơn trộn giá Trực tiếp với giá OTA.
  - Bước 4: đơn Nội bộ gửi `nightlyRates=[{…"amountVnd":667000,"edited":false}]`, thay vì để máy chủ ghi 0 đ.
- **Vì sao 2 test flaky đỏ: lỗi ở sản phẩm, test đúng ý.**
  - Cả A-20 và US-139 bấm **OTA** ngay sau khi mở hộp, rồi đặt ngày đến hôm nay, ngày đi hôm nay + 2.
  - Máy nhanh: test bấm OTA trước mốc 300 ms, bản xem giá bị tắt trước khi trả về, ô trống, test xanh.
  - Máy quá tải: bản xem giá trả về trước khi bấm, nên rơi vào bước 3. Test không thấy câu nó chờ (cảnh báo sức chứa căn 201; "Căn 101 đã kín"). DOM của mọi lượt đỏ đều có câu "Nhập giá mỗi đêm (lớn hơn 0)".
  - Số lần chạy trên máy QA (worktree tạm từ `origin/main` @ `4bf353da`, mỗi tệp chạy riêng):

    | Số tiến trình song song | `s2-fix` | `booking` |
    |---|---|---|
    | 6 (như FE-A) | 0/36 đỏ | 0/36 đỏ |
    | 16 | 0/32 đỏ | 0/32 đỏ |
    | 24 (tải máy ~88) | **3/40 đỏ**: lượt 14, 17, 18, ca A-20 | **1/40 đỏ**: lượt 31, ca US-139 |

  - Không sửa 2 test này bằng retry, tăng thời gian chờ, hay cố bấm OTA trước 300 ms. Sau khi sản phẩm được sửa, chúng phải xanh ở mọi mức tải.
- **Mong đợi:**
  - Giá do bản xem giá điền chỉ có hiệu lực với đúng kênh, căn và ngày của bản xem đó.
  - Khi bản xem tắt (OTA, Nội bộ, dài hạn, quá sức chứa) hoặc khi đổi kênh hay căn, mọi ô lễ tân **chưa gõ** phải trống lại, hoặc được điền lại theo đúng kênh và căn mới. Ô lễ tân đã gõ thì giữ.
  - Đơn OTA không gõ giá thì máy chủ dùng lịch OTA (BUG-R2-017). Đơn Nội bộ không gõ giá thì ghi 0 đ.
  - Với đơn OTA hoặc Nội bộ, Desk không bao giờ gửi `nightlyRates` mà lễ tân không gõ.
- **Ví dụ cách sửa (FE quyết, ARC xem):**
  - xóa `rates` của các đêm chưa gõ khi `!p.on` hoặc khi đổi nhóm kênh;
  - hoặc gắn mỗi lần điền với một khóa bản xem (`roomId` + `channelId` + ngày), và `body()` chỉ coi là giá lễ tân gõ khi `ratesEdited[date]`.
- **Test chống tái phát (QA đề xuất):** 3 ca đều chờ ô giá được điền rồi mới bấm kênh, tức đúng nhịp người như test chẩn đoán. Cả 3 phải đỏ ổn định trên mã cũ.
  - OTA, 1 đêm hôm nay: yêu cầu gửi đi không có `nightlyRates`.
  - OTA, 2 đêm: không hiện câu "Nhập giá mỗi đêm"; có cảnh báo sức chứa.
  - Nội bộ, 1 đêm: không có `nightlyRates`.
- **Rà dữ liệu production (chỉ đọc):**
  - Dấu hiệu QA đoán ban đầu sai cột. `stay_night.rate_source` không bao giờ là `'calendar'`, nên câu đó luôn ra 0. BE đã sửa.
  - Dấu hiệu đúng (BE, mục 1.5 của `rounds/round-04/outputs/BE/bug-r4-037-data-impact.md`):
    - đêm có `pricing_snapshot.nights[].source = 'calendar'`;
    - với OTA: không có `calendarVnd`, `stay_night.calendar_rate_vnd IS NULL`, gross > 0;
    - với Nội bộ: gross > 0.
  - BE soạn câu Q0–Q5. QA chạy thử trên stack local ngày 04/11 21:10: đúng (mục "QA chạy thử local" của tệp BE). OPS chạy trên production theo điều kiện SEC.
  - 04/11 21:30: BE viết lại Q2 (mục 2.4) và Q4 (mục 2.6) thành khối dán nguyên. QA chạy lại nguyên văn trên stack local: đúng (cùng mục của tệp BE).
  - Nếu có đơn thật bị dính, việc sửa giá trên đơn hoặc báo khách là việc về tiền, nên ORC báo lên chủ đầu tư.
- **Bằng chứng** (scratchpad, không commit, không có bí mật, chỉ khách giả DS-E):
  - `qarace/p6/`, `qarace/p16/`, `qarace/p24/`: log từng lượt chạy, lượt đỏ là `p24/s2-fix-14.log`, `-17.log`, `-18.log` và `p24/booking-31.log`;
  - `qarace/diag.txt`, `qarace/diag-rerun.txt`, `qarace/diag-internal.txt`: kết quả test chẩn đoán;
  - các dòng mã nêu trên.
- **Xác minh bản sửa (QA, 04/11 21:00–21:30):**
  - **Bản sửa:** PR #70, nhánh `v104/fix-booking-rate-carryover` @ `822094b7`, một commit trên `4bf353da`. QA xác minh trong worktree tạm ở scratchpad (đã dọn) và không sửa mã.
  - **Cách sửa (đọc mã):**
    - Ô giá chỉ hiện số khi lễ tân đã gõ, hoặc khi số đó do bản xem giá của **đúng** kênh, căn, ngày đến và số đêm đang trên màn điền vào.
    - Với Trực tiếp / CTV: khi bản xem giá của lượt ở mới chưa về, nút **Tạo đơn** khóa và báo bận.
    - OTA và Nội bộ chỉ gửi `nightlyRates` khi mọi đêm do lễ tân gõ (`edited:true`).
  - **1. Ba ca tái hiện của QA** (test tạm, chạy ở nhịp người: chờ bản xem giá Trực tiếp điền ô rồi mới bấm kênh), mỗi ca có assert:

    | Ca | Trên `822094b7` | Trên `4bf353da` |
    |---|---|---|
    | QA-1: OTA, căn 203, 1 đêm. Ô trống, không gửi `nightlyRates` | Xanh | Đỏ |
    | QA-2: OTA, căn 201, 2 đêm, 4 khách. Có cảnh báo sức chứa, không có câu "Nhập giá mỗi đêm" | Xanh | Đỏ |
    | QA-3: Nội bộ, 1 đêm. Không gửi `nightlyRates` | Xanh | Đỏ |

    - Tệp test của FE `v104-booking-rate-carryover.test.tsx` đạt 10/10. Tệp này gồm 3 ca chống tái phát QA đề xuất, các ca đổi căn / đổi kênh / bản xem giá đang về, và cách làm tạm trên v1.0.3.
  - **2. Tải nặng:** 24 tiến trình song song × 40 lượt, mỗi tệp chạy riêng.
    - `s2-fix` (A-20): **0/40 đỏ**, mỗi lượt 8/8 ca.
    - `booking` (US-139): **0/40 đỏ**, mỗi lượt 9/9 ca.
    - `v104-booking-rate-carryover`: **0/40 đỏ**, mỗi lượt 10/10 ca.
    - Trước bản sửa, cùng cách chạy cho 3/40 và 1/40 đỏ.
    - Tải máy lần này khoảng 65, thấp hơn lượt đỏ trước (~88). Các ca ở phần 1 chạy ở nhịp người, không phụ thuộc tải. Vì vậy QA coi kết quả là đủ.
  - **3. Stack local dùng một lần** `ottimo-qa70`. Image dựng từ `822094b7`, seed DS-E, chỉ khách giả `@example.test`. Desk chạy thật trong Chromium, gọi API thật:
    - **Q-A, Trực tiếp: đổi căn 101 → 401 rồi gửi form ngay** (`requestSubmit` trong trang, 5–66 ms sau khi đổi căn), 3/3 lượt:
      - lúc gửi: nút **Tạo đơn** có `aria-busy=true` và `disabled`; ô giá trống, không còn `667.000` của căn 101;
      - kết quả: 0 yêu cầu `POST /reservations`;
      - sau khi bản xem giá của 401 về, bấm lại: Desk gửi căn 401, không có `nightlyRates`, để máy chủ tự tính.
      - Thêm 3 lượt bấm ép bằng Playwright. Cú bấm rơi sau khi bản xem giá mới về (+500–900 ms). Desk cũng gửi căn 401, không có giá cũ.
    - **Q-B, OTA gõ mọi đêm** (2 đêm, 830.000): ngay sau khi bấm OTA, cả 2 ô trống. Desk gửi đúng số gõ với `edited:true`.
    - **Q-C, Nội bộ để trống ô:** ô trống. Desk không gửi `nightlyRates`.
    - **Đối chiếu bằng câu của BE:** sau 11 đơn tạo qua Desk, Q1 của BE có `TOTAL` 0. Q3 xếp đơn Nội bộ vào nhóm `complimentary`, đơn OTA gõ giá vào nhóm `manual`.
  - **CI của #70 trên `822094b7`:** 9 check xanh, check cuối là "docker images build · E2E smoke", xong lúc 21:34. 3 job bỏ qua đúng luật vì PR chưa gộp: publish GHCR, deploy staging, landing preview.
  - **Không phải lỗi:** khi nút **Tạo đơn** khóa trong lúc giá đang tải, Desk không hiện câu nào. Nút đã khóa và báo bận (`aria-busy`), nên QA không ghi lỗi.
- **Chạy lại ở head mới `94a28258` (QA, 04/11 22:00–22:20).** Commit này thêm thẻ UXD PR70-01: mọi lỗi 422 trên `nightlyRates` hiện câu dưới bảng giá hoặc dưới ô của đêm. Chỉ đổi FE, máy chủ không đổi.
  - **3 ca tái hiện của QA:** xanh 3/3. Tệp `v104-booking-rate-carryover.test.tsx` đạt 12/12, gồm 2 ca mới của PR70-01.
  - **Tải 24 × 40, mỗi tệp chạy riêng:** **0/120 lượt đỏ**. `s2-fix` 8/8 ca mỗi lượt, `booking` 9/9, `v104-booking-rate-carryover` 12/12.
    - Lúc chạy, máy bị các vai khác dùng nặng (tải 53–69; khoảng 45 tiến trình vitest khác). Mỗi tệp chạy lâu gấp khoảng 2 lần so với lượt ở `822094b7`, nên áp lực nhịp còn nặng hơn.
    - Lần thử đầu với giới hạn mặc định 15 giây mỗi ca có 100 lỗi, tất cả đều là "Test timed out". Lỗi này rơi cả vào ca không liên quan tới bản sửa (US-135 hủy đơn, cọc Trực tiếp, số điện thoại AC2). Không có lỗi assert nào, và DOM không có câu "Nhập giá mỗi đêm".
    - Vì vậy QA chạy lại với `--testTimeout=60000`. Đây chỉ là giới hạn của bộ chạy. Thời gian chờ của `findBy`/`waitFor` vẫn 5 giây, nên nếu có tranh chấp nhịp làm sai DOM thì ca vẫn đỏ. Không thêm retry.
    - Log 2 lần chạy ở `qa70b/p24-starved-timeout15s/` và `qa70b/p24/`.
  - **Ca mới (PR70-01): OTA để trống ở nhóm căn chưa có `ota_base_rate`.** Chạy trên stack local `ottimo-qa039`: API `c2506a53`, Desk dựng từ image web của `94a28258`. Trên stack dùng một lần, QA tạm bỏ khóa `N` khỏi `ota_base_rate`, rồi trả lại như cũ.
    - Máy chủ trả 422 `VALIDATION_FAILED`, `errors=[{field: nightlyRates, code: REQUIRED}]`, có `detail`. Thân lỗi khớp đúng mock trong test của FE.
    - Desk hiện "Nhập giá mỗi đêm (lớn hơn 0)." Hộp vẫn mở, không tạo đơn.
  - **Thẻ PR70-06:** gửi giá Trực tiếp ngoài sàn–trần thì máy chủ trả Problem `RATE_OUT_OF_RANGE` không có `min`/`max`. Desk hiện nguyên chữ `{min}`/`{max}`/`{group}`. QA ghi **BUG-R4-040 (P3)**, dời v1.0.5, không chặn #70.
  - **CI #70 @ `94a28258`:** 9 check xanh, 3 job bỏ qua đúng luật vì PR chưa gộp.
- **Chạy lại ở head cuối và trên `main` @ `d0ea6dc2` (QA, 04/11 23:15 – 05/11 00:35).**
  - **Các head đã chạy:**
    - `d3da532d`: thêm quy tắc giữ/xóa giá đã gõ, câu `booking.rates_cleared_channel`, và sửa lỗi Trực tiếp → OTA → Trực tiếp dưới 300 ms. Lượt tải đầu bị dừng giữa chừng vì head đổi, nên không tính;
    - `f8fa5030`: thêm câu `booking.rates_cleared_room_group` khi đổi sang căn khác nhóm làm xóa giá đã gõ;
    - `98d8a3ad`: `f8fa5030` cộng commit gộp `main` (chỉ sinh lại strings);
    - `main` @ `d0ea6dc2`: gồm #70 (`98d8a3ad`) và #73. Đây là lượt tính kết quả.
  - **Quy tắc mới (đọc mã):**
    - Giá đã gõ bị xóa khi đổi kênh sang hoặc rời OTA / Nội bộ.
    - Ở Trực tiếp / CTV, giá đã gõ bị xóa khi đổi sang căn thuộc nhóm căn khác. Đổi sang căn cùng nhóm thì giữ.
    - Mỗi lần xóa, Desk hiện một câu dưới bảng giá (`span.help`, `role=status`) và gọi lại bản xem giá. Câu ẩn khi lễ tân gõ lại, hoặc khi quay về Trực tiếp.
  - **1. Ba ca tái hiện của QA:** xanh 3/3 ở `98d8a3ad` và ở `main`. Tệp `v104-booking-rate-carryover.test.tsx` đạt 28/28 ở cả hai.
  - **2. Tải 24 tiến trình × 40 lượt, mỗi tệp chạy riêng.** FE thấy 6/40 lượt quá giờ khi máy tải 30–90, nên QA chạy nhiều lượt và ghi tải máy:

    | Lượt | SHA | Giới hạn mỗi ca | Tải máy (trung bình 1 phút) | `s2-fix` (A-20) | `booking` (US-139) | `v104-booking-rate-carryover` |
    |---|---|---|---|---|---|---|
    | r1 | `98d8a3ad` | 15 s (mặc định) | 47–92 | 22/40 đỏ | 25/40 đỏ | 30/40 đỏ |
    | r2 | `98d8a3ad` | 60 s | 39–63 | **0/40 đỏ** | **0/40 đỏ** | **0/40 đỏ** |
    | main-r1 | `d0ea6dc2` | 15 s (mặc định) | 42–81 | 1/40 đỏ (lượt 23, A-20 quá 15 s) | **0/40 đỏ** | **0/40 đỏ** |
    | main-r2 | `d0ea6dc2` | 15 s (mặc định) | 36–144 | **0/40 đỏ** | **0/40 đỏ** | **0/40 đỏ** |

    - Mọi lượt đỏ của r1 đều do máy bị các vai khác dùng nặng (khoảng 60 tiến trình vitest cùng lúc):
      - 74 tệp log có "Test timed out" ở mốc 15 s, 2 tệp có "Hook timed out";
      - 4 tệp có `findBy` quá 5 giây, vì bảng lịch (`grid`) hoặc hộp khách chưa kịp hiện;
      - 0 lỗi assert. DOM của các lượt đỏ không có câu "Nhập giá mỗi đêm". Chữ này chỉ có trong tên một ca.
    - Lượt r2 chỉ nâng giới hạn của bộ chạy. Thời gian chờ của `findBy` / `waitFor` vẫn 5 giây, không thêm retry.
    - Hai lượt trên `main` chạy với giới hạn mặc định 15 s. Lượt main-r1 có 1/120 lượt đỏ: A-20 ở lượt 23 quá 15 s lúc tải 67–81. Ca này không có lỗi assert, không có `findBy` hụt, DOM không có câu "Nhập giá mỗi đêm". Lượt main-r2 xanh 120/120, kể cả khi tải lên 144 vào cuối lượt. Mỗi lượt ca A-20 đạt 8/8, US-139 đạt 9/9, tệp của FE đạt 28/28. QA coi RG-12 đạt.
    - Log ở `qa70c/p24-98-r1/`, `qa70c/p24-98-r2-t60/`, `qamain/p24-main-r1/`, `qamain/p24-main-r2/` (scratchpad).
  - **3. Desk thật trên stack local dùng một lần.** Stack `ottimo-qa70c` dựng từ `98d8a3ad` và `ottimo-qamain` dựng từ `d0ea6dc2`. Seed DS-E, `qa.fd`, Desk Chromium thật, gọi API thật. Hai stack cho cùng kết quả ở C1, C2:
    - **C1, đổi kênh:**
      - Trực tiếp, căn 101, 2 đêm, gõ 617.000 cho đêm đầu. Bấm **OTA**: cả 2 ô trống, câu "Đã xóa giá đã gõ vì đổi kênh." hiện.
      - Quay về Trực tiếp: ô hiện giá niêm yết 667.000, câu ẩn.
      - Làm lại với **Nội bộ**: cùng kết quả.
      - Ở OTA, gõ lại một ô thì câu ẩn.
    - **C2, đổi căn ở Trực tiếp:**
      - Căn 101, gõ 627.000. Đổi sang 203, cùng nhóm L12: giữ 627.000, không có câu.
      - Đổi sang 301, nhóm N: số đã gõ bị xóa, ô về giá niêm yết của 301 (958.000). Câu "Đã xóa giá đã gõ vì căn 301 thuộc nhóm căn khác. Kiểm lại giá mỗi đêm trước khi tạo đơn." hiện, không còn chữ `{room}`.
      - Gõ lại thì câu ẩn. Bấm **Tạo đơn**: 201, Desk gửi số vừa gõ (`edited:true`), không gửi 627.000.
    - **RG-13 theo #73 (chỉ trên `main`):**
      - (a) Tạm bỏ khóa `N` khỏi `ota_base_rate`. OTA để trống, căn 301: 201, Desk không gửi `nightlyRates`. Máy chủ ghi 960.000, nguồn `calendar`, tức giá niêm yết 958.000 làm tròn theo luật OTA. Không có câu `rate_empty`.
      - (b) Thêm điều kiện: căn 401 không có giá niêm yết cho đêm đó. Bảng `room_list_price` chỉ cho thêm, không cho xóa, nên QA tạm dời ngày hiệu lực giá của 401 qua sau kỳ ở. OTA để trống, căn 401: 422 `VALIDATION_FAILED`, `nightlyRates` `REQUIRED`, detail "no ota_base_rate for the room group and no list price for the night". Hộp vẫn mở, câu `rate_empty` hiện.
      - Sau ca, QA trả lại khóa `N` và ngày hiệu lực giá của 401 như cũ.
    - **BUG-R4-041** vẫn tái hiện trên cả hai stack. Xem mục của lỗi.
    - Ảnh `qa70c/data.txt.*.png`, `qamain/data.txt.*.png` để ở scratchpad. Dữ liệu giả, **không commit**.
- **Vai chịu trách nhiệm:** FE (chủ H09 `BookingDialog`). ARC xem cách sửa. BE/DATA rà dữ liệu production. QA chạy lại A-20, US-139 ở 24 tiến trình và các ca RG-07…RG-12 trên SHA được cắt.
- **Trạng thái:** **Đã sửa – đã gộp vào `main` @ `d0ea6dc2`, đạt local** (QA 05/11 00:35).
  - Trước đó: chờ gộp #70, đạt ở `822094b7` rồi `94a28258`. #70 gộp ở head cuối `98d8a3ad`, cùng #73.
  - RG-12 (tải) đã chạy trên `main`. RG-13 đã đổi kỳ vọng theo #73.
  - Còn: RG-07…RG-11, RG-13, RG-17 trên STG 07/11. Đóng khi các ca này đạt.
  - Hotfix production (P0 sai tiền, protocol): ORC quyết. Rà dữ liệu production chạy theo tệp BE.
  - P0 chưa đóng thì QC không qua.

### BUG-R4-038 – Đơn Nội bộ: đêm thêm khi gia hạn (B13), B9a, B18 lấy giá Trực tiếp thay vì 0 đ
- **Mức:** **P0** (QA chốt 04/11 21:10). DOM đề xuất P2. ORC giữ P0 (04/11 khuya).
  - `test-strategy.md` mục 8 xếp "sai tiền" vào P0; ví dụ của mức này là "bill cộng sai phụ thu". Luật còn ghi lỗi tiền mặc định P0 cho tới khi chứng minh không ảnh hưởng tiền/dữ liệu.
  - Ở lỗi này, QA đã thấy trên stack local:
    - folio của đơn miễn phí có dòng tiền phòng > 0, tức **Còn phải thu** sai;
    - `total_room_vnd` > 0 trên đơn `is_complimentary = true`;
    - `stay_night` ghi doanh thu > 0, nên doanh thu phòng và ADR báo cho chủ đầu tư bị cộng thêm.
  - Lý do DOM xếp P2 ("không đụng tiền khách thật", "ca hiếm", "bản cắt đang mang P1") không có trong định nghĩa mức. QA không hạ mức vì tiến độ.
  - Yếu tố giảm nhẹ, chưa đủ để hạ mức:
    - lỗi không lặng lẽ: folio hiện số phải thu, lễ tân thấy được;
    - gia hạn đơn Nội bộ hiếm;
    - có cách làm tạm (của DOM).
  - Mã có từ `feb75035` (18/10), có trong `v1.0.0-rc.1` … `v1.0.3`. ORC báo production vận hành từ 02/11, nên dữ liệu thật có thể đã dính. Q5a/Q5b của BE đếm được.
- **Môi trường:**
  - Stack local dùng một lần từ `origin/main` @ `c2506a53`, seed DS-E, lễ tân `qa.fd`, gọi API. Đã dọn.
  - Đường B13 đã chạy 2 lần trên 2 stack, kết quả giống nhau. Đường B9a và B18 mới chỉ đọc mã (DOM, BE), chưa chạy.
- **Liên quan:**
  - `product/services/api/src/modules/frontdesk/internal/stay-support.ts` `addedNightRate` (dòng 281, theo `c2506a53`): luôn lấy `directRate`, không có nhánh `internal`;
  - `product/services/api/src/modules/frontdesk/internal/stay.service.ts`: `options` (dòng 164–194), `extend` (dòng 282). `AMOUNT_NOT_POSITIVE` ở dòng 349 chặn gõ 0;
  - mục DOM và mục 2.8 (Q5) của `rounds/round-04/outputs/BE/bug-r4-037-data-impact.md`;
  - EP02 mục kênh Nội bộ, BR-904/D-7, `metrics-definitions.md` Q-05: kênh Nội bộ không thu tiền;
  - BUG-R4-037 (cùng vùng giá Nội bộ).
- **Các bước tái hiện:**
  1. Tạo đơn Nội bộ 1 đêm, đến hôm nay, không nhập giá. Đơn được ghi 0 đ, nguồn `complimentary`.
  2. Nhận phòng (B9).
  3. Gia hạn 1 đêm (B13, `extendStay` `{nights: 1}`), không nhập giá.
  4. Mở folio của đơn.
- **Thực tế (stack local):**
  - B13 trả 200. Đêm thêm có giá bằng giá lịch Trực tiếp của căn; `stay_night.rate_source = 'extension'`; nguồn trong bản chụp giá là `default`.
  - Đơn vẫn `is_complimentary = true`, nhưng `total_room_vnd` > 0. Folio có 2 dòng `room`, tổng > 0, nên còn phải thu.
  - Đơn Nội bộ đối chứng không gia hạn vẫn 0 đ.
  - Theo DOM: trên Desk không đưa về 0 được. B13 trả `AMOUNT_NOT_POSITIVE` khi gõ 0 và `RATE_OUT_OF_RANGE` khi gõ dưới sàn Trực tiếp. A31 cũng chặn 0.
- **Mong đợi:**
  - Đêm thêm của đơn Nội bộ (B13, B9a, B18) mặc định 0 đ, nguồn `complimentary`, không áp sàn–trần giá Trực tiếp, và cho gõ 0.
  - Ca hiếm "Nội bộ có thu": lễ tân gõ giá > 0, nguồn `manual`.
- **Cách làm tạm** (DOM; BA viết vào sổ tay, PO ghi vào giới hạn của bản):
  - đơn Nội bộ cần ở thêm thì **không bấm Gia hạn**; tạo một đơn Nội bộ mới 0 đ cho các đêm thêm, cùng căn, ghi lý do;
  - đã lỡ gia hạn thì không thu tiền người ở, và báo quản lý trước khi trả phòng.
- **Đề xuất sửa (BE, ARC xem):**
  - thêm nhánh `internal` ở `addedNightRate` và ở B13 `options`/`extend`;
  - kèm hướng gỡ dữ liệu cho đơn đã dính, vì Desk hiện không gỡ được;
  - QA đề xuất **gộp vào hotfix BUG-R4-037**, vì cùng vùng giá Nội bộ và DOM cũng nêu ngoại lệ này.
- **Test chống tái phát (QA đề xuất):** API: gia hạn đơn Nội bộ 1 đêm, kiểm đêm thêm 0 đ, nguồn `complimentary`, folio không còn phải thu. Thêm 1 ca B18, 1 ca B9a, và 1 ca gõ 0 được nhận.
- **Bằng chứng** (scratchpad, không commit, chỉ dữ liệu thử DS-E):
  - `qa037/data.txt`: dòng E1 và dòng `[B] E1`, giá từng đêm sau B13;
  - `qa037/out-q5a-*.txt`, `qa037/out-q5b-*.txt`, `qa037/out-q3-*.txt`.
- **Vai chịu trách nhiệm:** BE (`addedNightRate`, B13). ARC xem. DOM chốt quy tắc. BA/PO lo cách làm tạm. DATA/OPS chạy Q5 trên production theo mục 2.8 của tệp BE.
- **Xác minh bản sửa** (QA, 04/11 23:00–23:15):
  - **Bản thử:**
    - PR #71, nhánh `v104/fix-internal-added-night`, head `7557e485`. CI của PR xanh 9/9 job; 3 job deploy bị bỏ qua như thường lệ.
    - Stack local dùng một lần `ottimo-qa038` dựng từ chính nhánh này: `CLOCK_MODE=mutable`, seed DS-E, project `clock`, gọi API.
    - Không chạy gì trên staging hay production.
  - **Tái hiện B13 của QA – đạt.** Đơn Nội bộ 1 đêm (căn 301), đã nhận phòng, 20:00 gia hạn `{nights: 1}`, không gõ giá.
    - `extension-options` trả `defaultRateVnd` 0, không có `floorVnd`/`ceilingVnd`; `currentBookingRateVnd` null.
    - B13 trả 200. Đêm thêm: gross 0, `rate_source = 'extension'`, `is_complimentary = true`, nguồn trong bản chụp giá là `complimentary`.
    - Đơn: `is_complimentary = true`, `total_room_vnd` 0. Folio: tổng 0, **còn phải thu 0**, credit 0.
    - Gõ 0 cho đêm thêm thứ hai: được nhận (200), nguồn `complimentary`, folio vẫn 0.
  - **B9a Nội bộ – đạt.** Đơn Nội bộ đến ngày A, nhận lúc 04:30 với `addPriorNight`, không gửi giá và không gửi `expectedSurchargeVnd`.
    - Bản xem nhận phòng: `addsPreviousNight` true; đêm trước có `defaultRateVnd` 0 và không có sàn–trần; `amountDueAtCheckinVnd` 0.
    - B9 trả 200, ngày đến lùi về A−1.
    - Đêm A−1: gross 0, `extra_night_early_late`, nguồn `complimentary`. Folio 0.
  - **B18 Nội bộ, đêm ngày đi đã bán – đạt.** Đơn Nội bộ căn 103, đêm sau đó đã có đơn Trực tiếp.
    - 19:00, `checkout-summary`: `extraNightRequired` true, `extraNightAvailable` false, `lateFeeAsNightVnd` 0, `amountDueAtCheckoutVnd` 0. Bậc phụ thu là 100 % nhưng số tiền 0.
    - B18 `{checkoutTime: '19:00'}` không kèm `lateFeeInsteadOfNight` (không cần quản lý xác nhận): 200, `checked_out`.
    - Folio không có dòng `late_checkout`, không thêm đêm, tổng 0.
  - **Đối chứng Trực tiếp – hành vi không đổi.**
    - B13: đêm thêm mặc định theo giá lịch Trực tiếp (708.000, sàn 530.000, trần 1.900.000), nguồn `default`, `is_complimentary = false`. Gõ 0 bị từ chối: 422 `nightlyRates` `AMOUNT_NOT_POSITIVE`.
    - A31: quản lý đưa đêm Trực tiếp về 0 bị từ chối: 422 `newUnitPriceVnd` `AMOUNT_NOT_POSITIVE`.
    - B18 sau 18:00: hiện giá đêm thêm kèm sàn–trần; `extraNight.rateVnd` 0 bị từ chối: 422 `AMOUNT_NOT_POSITIVE`.
    - B18 khi đêm ngày đi đã bán: phụ thu bằng 1 đêm vẫn > 0 (792.000), đúng BR-416-06.
    - B9a: đêm trước có giá lịch và sàn–trần. `priorNightRateVnd` 0 bị từ chối: 422 `AMOUNT_NOT_POSITIVE`. Thiếu `expectedSurchargeVnd` bị từ chối: 422 `REQUIRED`.
  - **A31 đưa đêm Nội bộ về 0 – đạt.** Đơn Nội bộ căn 202, gia hạn 1 đêm có gõ 300.000 ("Nội bộ có thu"). Đêm này gross 300.000, nguồn `manual`, folio còn phải thu 300.000.
    - FD sửa 300.000 → 250.000: 201. Vậy FD có quyền A31, và mã 403 dưới đây là do luật "0 đ", không phải do thiếu quyền A31.
    - FD đưa về 0: **403 `FORBIDDEN_ACTION`**. FDL đưa về 0: 403 `FORBIDDEN_ACTION`.
    - MGR đưa về 0 mà không có lý do: 422 `reason` `REQUIRED`. Lý do chỉ có khoảng trắng: 422 `REASON_REQUIRED`. Các lần bị từ chối không đổi dòng nào.
    - MGR đưa về 0 có lý do: **201**. Bản chụp giá đổi sang `complimentary`; `stay_night` gross 0. Đơn `total_room_vnd` 0. Folio có tổng 0, còn phải thu 0, credit 0, và các dòng đảo/ghi lại đầy đủ.
    - Nhật ký `reservation.repriced` có 2 dòng, đều có lý do: `manual` 250.000 rồi `complimentary` 0.
  - **Q5a của BE sau bản sửa – đạt.** Khối trong mục 2.8 của `rounds/round-04/outputs/BE/bug-r4-037-data-impact.md` được dán nguyên; chỉ dòng `ssh` được thay bằng lệnh `psql` của stack local, với cùng `PGOPTIONS` và cùng cờ. 4 dòng chốt phiên ra `on`, `30s`, `3s`, `ottimo_readonly|t|f` ở mọi lần.

    | Lúc chạy | Dòng `TOTAL` (`so_don_default`, `dem_default`, …, `so_don_go_tay`, `dem_go_tay`) |
    |---|---|
    | Seed mới, trước mọi ca | `TOTAL\|ALL\|0\|0\|0\|0\|0\|0` |
    | Sau đêm B13 gõ 300.000 (`manual`) | `TOTAL\|ALL\|0\|0\|0\|0\|1\|1`, dòng `B13` 1 đơn gõ tay |
    | Sau A31 MGR đưa về 0 | `TOTAL\|ALL\|0\|0\|0\|0\|0\|0` |
    | Cuối lượt (đã có 3 đơn Nội bộ mới qua B13, B9a, B18) | `TOTAL\|ALL\|0\|0\|0\|0\|0\|0` |

    - Đơn Nội bộ mới gia hạn không còn vào cột `default`. Cột tham khảo `manual` vẫn bắt được đêm gõ > 0, và bỏ đêm đó ra khi A31 đưa về 0.
    - Đối chứng với mã cũ: trên `main` @ `c2506a53` cùng khối Q5a đếm `TOTAL|ALL|1|1|1|0|0|0` sau 1 lần B13 Nội bộ (`qa037/out-q5a-A.txt`, `-B2.txt`).
  - **Hồi quy:** trên cùng stack, `checkin.s3`, `stay-checkout.s3`, `late-fee-qr.s4` (project `clock`, có B9a, B13, B18, BR-416-06): 76 đạt, 1 bỏ qua, 0 đỏ. Tải máy lúc chạy khoảng 25–43.
  - **Rà `tests/tools/validate-fixtures.mjs` và oracle BR-421-04…11 (BE nhờ) – đạt.**
    - `CALC.extension` có nhánh Nội bộ: giá gõ hoặc 0; nguồn `manual` khi > 0, `complimentary` khi 0; không áp sàn–trần.
    - `CALC.lateCheckout` nhận thêm kênh và "đêm ngày đi bán được". Nội bộ sau 18:00 mà đêm đã bán thì phụ thu 0 và không ghi dòng. Nội bộ sau 18:00 mà đêm bán được thì đêm thêm 0 đ `complimentary`. Mọi kết quả có thêm `surchargeLineWritten`.
    - Validator chạy trên nhánh: "OK – 0 lỗi, 1 cảnh báo" (558 dòng, 217 dòng tính lại).
    - Thử đột biến: sửa số kỳ vọng của BR-421-04, -06, -08, -11 thì validator báo đúng 4 lỗi. Tệp đã trả lại nguyên.
    - Số trong oracle khớp số DOM: 202 + 2 đêm = 0 đ; gõ 300.000 là `manual`; 15:00 = 90.000; 17:00 = 150.000; 19:00 thì đêm thêm 0 đ; đêm đã bán thì phụ thu 0, không ghi dòng.
    - Đề xuất, không phải lỗi: thêm 1 dòng oracle cho B9a Nội bộ (BR-417), vì hiện chỉ test tích hợp của BE và ca QA-038-02 giữ ca này.
  - **Quan sát, chuyển DOM/DATA xem.** Ngày 05/11, DOM lượt 6 kết luận đây là sai nghiệp vụ; QA ghi **BUG-R4-043**. Nội dung: đêm "Nội bộ có thu" (gõ 300.000) có `stay_night.is_complimentary = true` mà gross 300.000, và đơn vẫn `is_complimentary = true`.
    - Đây là cách đơn Nội bộ gõ giá lúc tạo vẫn ghi: QA thử trên cùng stack, ra cùng cờ. Đúng ý "giống hệt lúc tạo đơn" của BR-421 v0.5.3 (b).
    - DATA cần xác nhận báo cáo Q-05 tính đêm này vào doanh thu hay vào đêm miễn phí.
  - Mã ca trong spec tạm: QA-038-Q0, -01…-06, -04b, -Q9. Spec tạm đã xóa cùng worktree.
  - **Bằng chứng** (scratchpad, không commit, chỉ dữ liệu thử DS-E): `qa038/data-r2.txt` (đủ số từng bước), `qa038/out-q5a-*.txt`, `qa038/e2e-r2/run.log`, `qa038/e2e-reg/run.log`.
- **Chạy lại phần đổi ở head `02c34bc9` (QA, 05/11 00:45–00:50).**
  - Từ `7557e485` có 3 commit:
    - mô tả hợp đồng (chỉ chữ) và sinh lại `api-client`;
    - các thẻ review: ghi `actorRole` vào audit khi A31 đưa đêm Nội bộ về 0 đ (thẻ SEC PR71-02); thêm ca test audit, ca B9a gõ giá trên đơn Nội bộ, ca `lateFeeInsteadOfNight` của đơn Nội bộ trả 422, và BR-421-11;
    - mô tả hợp đồng về số phải thu khi `lateFeeAsNightVnd` = 0.
  - Mã sản phẩm chỉ đổi 2 chỗ:
    - `folio-lines.service.ts`: truyền `actorRole`;
    - `stay-night-pricing.ts`: ghi `actorRole` vào audit `reservation.repriced` khi nguồn là `complimentary`.
    - Phần 422 của `lateFeeInsteadOfNight` đã có từ `7557e485`. Commit mới chỉ thêm test cho phần này.
  - Theo lời ORC, QA chỉ chạy `bug-r4-038-internal-added-night.test.ts`. Chạy trong worktree tạm, trên một Postgres dùng một lần, với các vai `ottimo_app` / `ottimo_migrator` như CI. Đã dọn.
    - Kết quả: **11/11 đạt, 2 lượt**.
    - Gỡ dòng ghi `actorRole` trong `stay-night-pricing.ts` thì ca BR-421-04/05/06 (A31) đỏ vì assert. Sau đó QA trả lại dòng này. Vậy test bắt đúng phần sửa.
  - CI của #71 @ `02c34bc9`: job "format · lint · audit · test · build" đỏ ở 2 ca "Hôm nay" của `v104-holds-feb.test.tsx` (admin-web, `Test Files 1 failed | 79 passed`).
    - Nguyên nhân là ngày UTC trong test, không do #71. PR #76 sửa.
    - Theo ARC, `main` đỏ từ 00:00 tới 06:59, không phải tới 06:00.
  - Không chạy lại stack Desk/API, vì phần đổi chỉ là audit, test và chữ hợp đồng. Kết quả 9/9 ca API ở `7557e485` vẫn dùng được.
- **Trạng thái:** **Đã sửa – chờ gộp #71** (QA xác nhận 04/11 23:15 ở `7557e485`; phần đổi ở `02c34bc9` đạt 05/11 01:00).
  - Sau khi #71 vào `main`: QA chạy lại B13 Nội bộ trên STG bằng tài khoản `qa.*`, trong lượt C3 ngày 06/11.
  - Dữ liệu production đã dính: theo Q5a/Q5b ở mục 2.8 của tệp BE. Đơn nào cần gỡ thì quản lý đưa về 0 bằng A31, có lý do, như ca A31 ở trên. DATA/OPS chạy theo điều kiện SEC; ORC quyết.

---

### BUG-R4-039 – Nhận phòng: lễ tân trưởng xác nhận được ngoại lệ cho căn còn đơn Đang ở (`OC`/`OD`)
- **Mức:** **P1** (QA chốt 04/11 khuya). DOM đề xuất P1.
  - **Vì sao không thấp hơn:**
    - Đây là luồng chính (nhận phòng) sai quy tắc nghiệp vụ BR-402 (1), đúng định nghĩa P1 của `test-strategy.md` mục 8.
    - Hậu quả ngoài đời rất nặng: khách mới được giao cửa của căn đang có người ngủ. Đó là sự cố an ninh và riêng tư.
    - Ca này hay gặp ở OTTIMO: khách đi xe đêm tới lúc 05:00–06:30, trong khi khách cũ của căn đi hôm nay và còn ngủ.
  - **Vì sao QA chưa xếp P0.** Luật mục 8 coi lỗi tồn phòng và C3 là P0 cho tới khi chứng minh không ảnh hưởng. QA đã kiểm từng điểm:
    - **Tồn phòng không đổi.** Đêm của hai đơn không trùng nhau. Đơn thứ ba cho căn 202 đúng đêm của đơn mới vẫn bị từ chối (409 `ROOM_UNAVAILABLE`).
    - **Không sai tiền.** Trên stack, folio của đơn mới (nhận phòng bằng ngoại lệ) chỉ có 1 dòng tiền phòng, bằng đúng dòng của đơn cũ. Không có dòng thu thêm hay dòng bị đảo.
    - **Không lộ dữ liệu C3 qua hệ thống.** Desk không cấp hay hiện mã cửa của khách cũ cho khách mới. Việc giao cửa do lễ tân làm tay (`doorAccessHandedOver`).
    - **Cần một người có quyền quyết.** Lễ tân trưởng trở lên phải tự xác nhận và ghi lý do. Câu Desk đưa ra có ghi trạng thái thật, ví dụ "Căn 202 đang 'Có khách, sạch'". Lễ tân thường chỉ gửi được yêu cầu duyệt, không tự nhận phòng.
    - **Dữ liệu sai sửa được:** chỉ trạng thái buồng (SM-03) sai, và căn có 2 lượt Đang ở cho tới khi khách cũ trả phòng.
  - **Nâng lên P0 nếu** thấy một trong các điều sau:
    - một đường làm việc này mà không cần người có quyền xác nhận;
    - tích hợp khóa cửa tự cấp mã cho căn đang có khách;
    - lỗi này làm sai tiền, hoặc làm bán trùng đêm.
- **Môi trường:**
  - API, `origin/main` @ `c2506a53` (bằng mã của nhánh BE lúc tạo). Stack local dùng một lần `ottimo-qa039`, `CLOCK_MODE=mutable`, seed DS-E.
  - Chỉ dùng tài khoản `qa.fd`, `qa.fdl` và khách giả `@example.test`. Ngày ảo năm 2029.
- **Liên quan:**
  - BR-402 (1). `business-rules.md` v0.5.3 đã ghi rõ `OC`/`OD` không có ngoại lệ.
  - `product/services/api/src/modules/frontdesk/internal/checkin.service.ts` (dòng theo `c2506a53`):
    - xem trước, dòng 354–362: `room_ready` có `overridableBy: FDL_UP` khi trạng thái **khác `OOO`**, kể cả `OC`, `OD`;
    - lúc ghi, dòng 588–606: lễ tân trưởng xác nhận, hoặc lễ tân gửi xin duyệt, đều qua được điều kiện này. Không có chỗ nào kiểm "căn còn đơn Đang ở".
  - `checkout.service.ts` 1399–1407: B18 đặt căn về `VD` khi trạng thái khác `CL`, không xét đơn khác đang ở.
  - Chữ Desk `checkin.room_not_ready_lead` (`product/design/copy/strings-vi.json` dòng 172) mời lễ tân trưởng xác nhận, dù căn có khách.
  - Có từ `bad6f599` (16/10, Sprint 3). Tag `v1.0.1`, `v1.0.2`, `v1.0.3` đều có, nên **đang ở production**.
  - Cùng vùng: thẻ FB-R4-DOM-BA-PR68-08 (sổ tay 2.10, `02` 7.4 đang ghi `OD` vào danh sách được ngoại lệ).
- **Các bước tái hiện (API, đồng hồ giả):**
  1. Ngày ảo D, 14:30. Tạo đơn A, Trực tiếp, căn 202, D → D+1, trả đủ, có giấy tờ. Lễ tân nhận phòng A.
  2. Tạo đơn B, căn 202, D+1 → D+2, trả đủ, có giấy tờ.
  3. Chỉnh đồng hồ tới D+1, 14:30. Đơn A chưa trả phòng (khách cũ còn trong căn).
  4. Xem trước nhận phòng B (`previewCheckIn`), với `qa.fd` và với `qa.fdl`.
  5. `qa.fd` nhận phòng B, không xin ngoại lệ.
  6. `qa.fd` nhận phòng B, kèm `roomNotReadyOverride.reason` (gửi lễ tân trưởng duyệt).
  7. `qa.fdl` nhận phòng B, kèm `roomNotReadyOverride.reason`.
  8. Sau đó, khách cũ trả phòng đơn A: kiểm tủ minibar, rồi `checkOut` lúc 11:00, có ghi chú giờ.
- **Thực tế** (5/5 lượt giống nhau, mỗi lượt một ngày ảo riêng):
  - Bước 3: A vẫn `in_house`, căn 202 có trạng thái `OC`.
  - Bước 4: `room_ready` có `met:false`, `detail:"OC"` và `overridableBy:["front_desk_lead","manager","owner"]`, với cả hai vai.
  - Bước 5: 409 `CHECKIN_CONDITIONS_NOT_MET`, `unmet=["room_ready"]`. Bước này đúng.
  - Bước 6: **202**. Desk tạo yêu cầu duyệt `checkin_room_not_ready` ở trạng thái `pending`, thay vì từ chối.
  - Bước 7: **200**, B thành `in_house`.
    - Đơn B ghi `checkin_room_status_before = OC`, và ghi người xác nhận.
    - Yêu cầu duyệt ở bước 6 chuyển thành `cancelled`.
    - Căn 202 lúc này có **2 đơn `in_house`**, trạng thái buồng chuyển `OD`.
  - Bước 8: trả phòng A được (200). Ngay sau đó căn 202 có trạng thái **`VD`** ("Trống, cần dọn"), dù B đang ở. Có việc dọn đang mở cho căn.
  - Kiểm thêm: đơn thứ ba cho căn 202 đêm D+1 bị từ chối (409 `ROOM_UNAVAILABLE`). Tồn phòng không đổi.
  - Trạng thái `OD` lúc xem trước: QA không dựng được qua API. Theo mã, nhánh `OD` đi cùng nhánh `OC` (điều kiện "khác `OOO`").
- **Mong đợi** (BR-402 (1), `business-rules.md` v0.5.3):
  - Căn `OC`/`OD`, tức căn còn đơn Đang ở: **không có ngoại lệ** với mọi vai, kể cả lối xin duyệt.
    - Xem trước: không có `overridableBy`.
    - Lúc ghi: lễ tân trưởng xác nhận thì bị từ chối. Lễ tân gửi xin duyệt cũng bị từ chối, không tạo yêu cầu duyệt.
  - Desk hiện câu riêng (UXD viết), ví dụ: "Căn 202 đang có khách. Trả phòng đơn đang ở trước, hoặc gán căn khác." Không mời xác nhận ngoại lệ.
  - `VD`/`CL`: vẫn giữ ngoại lệ như cũ.
  - Có chặn thêm theo "căn còn đơn `in_house`" hay không là do ARC chọn. Nếu chặn, ca bước 7 phải bị từ chối ngay cả khi trạng thái buồng bị sửa tay sang `VD`.
- **Test chống tái phát (QA đề xuất, BE viết ở API, QA chạy lại):**
  - Ca chính như các bước trên: bước 4 không có `overridableBy`; bước 6 và 7 bị từ chối; A, B giữ nguyên trạng thái.
  - Lặp lại với căn `OD`.
  - Ca đối chứng: căn `VD` và `CL` vẫn được lễ tân trưởng xác nhận ngoại lệ; căn `OOO` vẫn không.
  - Nếu ARC chọn chặn theo đơn `in_house`: thêm ca trạng thái buồng `VD` mà căn còn đơn Đang ở, kết quả phải bị chặn.
  - FE: căn `OC`/`OD` hiện câu chặn, không có ô lý do, không có nút xác nhận.
- **Cách làm tạm tới khi có bản sửa:** sổ tay theo thẻ FB-R4-DOM-BA-PR68-08: "không xác nhận ngoại lệ khi căn có khách, dù Desk cho bấm". ORC gửi INV như cách làm tạm của BUG-R4-037.
- **Bằng chứng** (scratchpad, không commit, chỉ dữ liệu giả, không bí mật): test tạm `zz-qa039.clock.spec.ts` (xóa cùng worktree), log `qa039/data.txt`, `qa039/e2e-r1` … `qa039/e2e-r5`.
- **Vai chịu trách nhiệm:** BE-A sửa máy chủ, ARC chốt cách chặn, UXD viết câu, FE làm nhánh Desk. BA sửa sổ tay (thẻ 08). QA chạy lại.
- **Xác minh bản sửa (QA2, 05/11 00:20, chỉ API):**
  - Bản thử: nhánh `v104/fix-checkin-occupied-exception` @ `9646029d`.
    - Stack local dùng một lần `ottimo-qa2pr74` (api, postgres). Seed DS-E, `CLOCK_MODE=mutable`. Test tạm `zz-qa2-pr74.clock.spec.ts`, xóa cùng worktree.
    - Đối chứng: `main` @ `d0ea6dc2` (chưa có #74), stack `ottimo-qa2main`. Đã dọn cả hai.
  - "5 lối" là: `qa.fd` không xin ngoại lệ; `qa.fd` xin duyệt có lý do; `qa.fdl`, `qa.mgr`, `qa.owner` xác nhận có lý do.

    | Ca | Dựng | Trên #74 | `main` chưa có #74 |
    |---|---|---|---|
    | C1 | Căn 202 `OC`: A đang ở, đi hôm nay. B đến hôm nay | Xem trước: `room_ready` `detail:OC`, không có `overridableBy` (với `qa.fd` và `qa.fdl`). Cả 5 lối nhận 409 `CHECKIN_CONDITIONS_NOT_MET` `["room_ready"]`. FD xin duyệt không còn ra 202, không có yêu cầu duyệt nào. A `in_house`, B `confirmed`, căn vẫn `OC` | Đỏ: có `overridableBy` |
    | C2 | Căn 203 `OD`. Chèn sẵn một yêu cầu duyệt `approved` cho B, như yêu cầu tạo trên v1.0.3 | `detail:OD`, không có `overridableBy`. Cả 5 lối nhận 409, kể cả khi đã có yêu cầu được duyệt. A, B giữ trạng thái | Đỏ: có `overridableBy` |
    | C3 | Căn 301 `VD`, không có khách | Có `overridableBy` (FDL trở lên). FD xin duyệt: 202, yêu cầu `pending`. FDL xác nhận: 200, B `in_house`, yêu cầu chuyển `cancelled` | Xanh, như cũ |
    | C4 | Căn 302 `CL` | Như C3 | Xanh, như cũ |
    | C5 | Căn 401: A đang ở, trạng thái bị sửa tay thành `VD` | `detail:VD`, không có `overridableBy`. Cả 5 lối nhận 409 | Đỏ: có `overridableBy` |

  - **Kết luận: ĐẠT** phần máy chủ.
  - Phần Desk (câu chặn riêng, không có ô lý do) chưa kiểm ở lượt này. Kiểm ở TC-V104-RG-14.
- **Xác minh lại ở head `0950313e` (QA2, 05/11 01:05, chỉ API).** Head này thêm C1–C3 của ARC (`ARC-on-v104-pr74-checkin-occupied.md`).
  - Môi trường:
    - một stack local dùng một lần `ottimo-qa2pr74b` (api, postgres), seed DS-E, `CLOCK_MODE=mutable`;
    - test tạm `zz-qa2-pr74b.clock.spec.ts`, xóa cùng worktree;
    - chạy 3 lượt (`r3`, `r4`, `r5`), mỗi lượt một ngày ảo riêng, cả 3 đạt;
    - đối chứng: dựng lại image API từ `9646029d` trên cùng stack, chạy cùng test (lượt `ctl2`).

    | Ca | Dựng | Trên `0950313e` | Đối chứng `9646029d` |
    |---|---|---|---|
    | K1 (C1, BR-402-05) | Căn 301. A ở D → D+1, đến D+2 vẫn Đang ở (quên B18). Ngày D+2 lúc 15:00: `needs_cleaning` (`OC → OD`), rồi `start_cleaning` (`OD → CL`) qua `status-transitions`. B đến D+2 | Xem trước (`qa.fd`, `qa.fdl`): `met:false`, `detail:CL`, `cause:held_by_other_stay`, `heldByReservationCode` = mã đơn A, **không có `overridableBy`**. Cả 5 lối nhận 409 `CHECKIN_CONDITIONS_NOT_MET` `["room_ready"]`. Không có yêu cầu duyệt. A `in_house`, B `confirmed`, căn vẫn `CL`, căn có 1 lượt Đang ở | **Đỏ.** Có `overridableBy`. FD xin duyệt ra 202 `pending`. FDL nhận phòng được (200), căn có **2 lượt Đang ở**. Sau đó B18 của A đặt căn về `VD` trong khi B đang ở |
    | K2a (C2) | Căn 202. A ở D → D+1, gia hạn B13 thêm 1 đêm, nên đi D+2. Ngày D+2 lúc 09:30 căn đã `OD`, `start_cleaning` thành `CL` | `cause:held_by_other_stay`, `heldByReservationCode` = mã đơn A, `detail:CL`, không có `overridableBy`. FDL nhận 409 | Không có `cause` |
    | K2b (C2) | A202 trả phòng lúc 10:00 (căn vẫn `CL`) | `cause:room_status`, `detail:CL`, không có `heldByReservationCode`, `overridableBy` gồm FDL, MGR, OWN | Không có `cause` |
    | K3 (C2) | Đơn OTA để ở làn chưa gán căn (`allowUnassigned`, `conflictState:open`) | `cause:no_room`, **không có `detail`**, không có `heldByReservationCode` và `overridableBy` | `detail:VC`, không có `cause` (đây đúng là lỗi ARC nêu ở mục 4) |

  - Các điểm chưa kiểm:
    - B13 cùng kênh gia hạn ngay trên đơn, không tạo đơn con. Vì vậy ca "`heldByReservationCode` là mã đơn gốc khi có đơn con" chưa chạy qua E2E. Ca này dựa vào test của BE.
    - `VI`/`VC` cạnh một lượt quá ngày đi chỉ dựng được bằng sửa DB tay, nên không chạy. Theo mã, `met` vẫn đạt ở trường hợp này: đây là giới hạn đã biết của v1.0.4, dời v1.0.5 (FB-R4-ARC-BE-PR74-05).
  - Ở lượt `r3`, `qa.hk` gửi `needs_cleaning` cho 301 nhận 404 `NOT_FOUND`. Lý do: căn nằm ngoài phạm vi việc của buồng phòng hôm đó (`inScope`). `qa.fd` làm thay thì được. Ở `r4`, `r5`, `qa.hk` làm được cả hai bước. QA không coi đây là lỗi của #74.
  - **Oracle (thẻ FB-R4-ARC-QA-PR74-01):**
    - BR-402-05 khớp mọi khóa `expected` khi chạy thật, nên bỏ nhãn "[GIẢ ĐỊNH QA]" được. Câu giả định nên ghi "buồng phòng (hoặc lễ tân) bấm" cho khớp phần ví dụ. Bản vá nằm trong scratchpad (`qa2-pr74b-out/br-402-05-untag.patch`), BE áp vào #74. `validate-fixtures.mjs` đạt, 0 lỗi.
    - Ghi chú mới của BR-402-04 đúng với mã và với BR-402 (1) v0.5.6.
    - BR-402-03 vẫn để nhãn, vì việc dọn ưu tiên sau ngoại lệ chưa được kiểm riêng theo lượt.
  - **Kết luận: ĐẠT** phần máy chủ ở `0950313e`.
- **Ghi chú – lượt đã quá ngày đi không trả phòng thẳng được (phát hiện của BE, QA2 xác nhận 05/11 trên stack).**
  - Diễn biến trên stack:
    - Lượt A301 quá ngày đi một ngày. B18 nhận 409 `INVALID_TRANSITION` ("check-out on the departure business day"). Gõ giờ 15:00 hay gửi `checkoutAt` là 11:00 hôm trước kèm ghi chú đều bị từ chối như nhau.
    - Gia hạn B13 thêm 1 đêm được (200). Folio thêm 1 dòng tiền phòng 958.000, còn phải thu 958.000.
    - B18 với giờ thực tế 15:00 nhận 422 `applyLateSurcharge` `SURCHARGE_DECISION_REQUIRED`, tức đòi thêm phụ thu trả muộn.
    - B18 với giờ gõ 11:00 kèm `checkoutTimeNote` thì được (200). A `checked_out`, folio `settled`, căn giữ `CL`.
    - Xem trước của B lúc này: `cause:room_status`, có `overridableBy`. Lễ tân trưởng nhận phòng B được (200), căn thành `OD`, căn có 1 lượt Đang ở.
  - Hệ quả cho vận hành:
    - Cách duy nhất hiện có buộc khách sạn ghi thêm 1 đêm, và gõ một giờ trả phòng không đúng thực tế.
    - Nếu khách thật ra đã đi đúng ngày, đêm thêm đó là thu sai. Quản lý phải đưa đêm đó về 0 có lý do (A31), nếu không thì doanh thu và báo cáo bị cộng thêm.
    - BR-402 (1) v0.5.6 đang ghi "trả phòng A trước (B18, căn `VD`)". Trên mã, lượt quá ngày đi không B18 thẳng được. Và nếu buồng đã `CL` thì sau B18 căn vẫn `CL`, không về `VD`.
  - Đề xuất, không chặn #74:
    - DOM sửa câu BR-402 và ví dụ căn 301.
    - BA ghi cách làm trong sổ tay: B13 tới hôm nay, B18 có giờ gõ và ghi chú, rồi quản lý đưa đêm thêm về 0 khi khách đã đi đúng ngày.
    - ORC xem có cần ghi lỗi P2 dời v1.0.5 ("B18 bù cho lượt quá ngày đi") hay không.
- **Xác minh phía Desk – PR #77 `v104/fe-checkin-occupied` (QA2, 05/11 03:00).** #79 đã gộp vào #77.
  - Bản thử:
    - Head `5d74eb02`. Đây là #77 @ `5aca248e` gộp `main` `f9ff4e1f` (có #74 và #82), chữ sinh lại. `5aca248e` gộp thẳng với `main` mới thì xung đột ở 3 tệp chữ sinh ra, nên QA dựng từ head FE đã gộp. Ở `5d74eb02` chạy: unit toàn bộ, E2E hồi quy, image API (máy chủ = `main`).
    - Head `055e92d5`. FE-A thay kiểu tạm `RoomReadyCondition` bằng `CheckInCondition` sinh ra, và ép kiểu `cause` lạ trong test. Không đổi logic, không đổi máy chủ. QA dựng lại image web, chạy lại test tạm Desk, `bug-r4-039-fea`, unit nhận phòng, `typecheck` và E2E UI nhận phòng.
    - Stack local dùng một lần `ottimo-qa2p77` (postgres, api, web), seed DS-E, `CLOCK_MODE=mutable`. Desk Chromium 1366×768, `vi-VN`.
    - Test tạm `zz-qa2-pr77.spec.ts` (project `desk-clock`), xóa cùng worktree. Đã dọn stack, image và worktree.
    - Dữ liệu chỉ có khách giả, ngày ảo năm 2030.
  - Mọi ca đều ghi các POST `…/actions/check-in` của trình duyệt. "Bấm ép" là bấm nút **Nhận phòng** đang `aria-disabled` bằng `force`.

    | Ca | Dựng | Kết quả |
    |---|---|---|
    | D1 (C1, lượt đi hôm nay) | Căn 202: A ở D → D+1, gia hạn B13 thêm 1 đêm, nên đi D+2. Ngày D+2 lúc 09:30, căn `OD`. B đến D+2 | API: `held_by_other_stay`, `heldByReservationCode` = mã A (mã đơn gốc), không có `overridableBy`. `qa.fd` và `qa.fdl` thấy hộp đỏ đúng nguyên câu `checkin.room_held_code`: "Căn 202 còn đơn OTM-… đang ở, chưa trả phòng. …" Mã in chữ mono. Link "Đổi căn / đổi ngày" về đơn B. Không có ô Lý do, nút "Gửi lễ tân trưởng xác nhận" hay câu ngoại lệ. Nút **Nhận phòng căn 202** `aria-disabled`; bấm ép không gửi POST |
    | D2 (C1, lượt quá ngày đi + `CL`) | Căn 301: A ở D → D+1, đến D+2 15:00 vẫn Đang ở. Buồng `OC → OD → CL`. B đến D+2 | API: `detail:CL`, `held_by_other_stay`, mã A, không có `overridableBy`. `qa.fd`, `qa.fdl`, `qa.mgr`, `qa.owner` đều thấy như D1. Không vai nào có lối ngoại lệ hay gửi POST |
    | D3 (C2, `room_status` `VD`/`CL`) | A202 trả phòng lúc 10:00, căn `VD`. Lúc 14:30 | API: `cause:room_status`, có `overridableBy` (FDL, MGR, OWN). `qa.fd` thấy câu cũ `checkin.room_not_ready`: "Căn 202 đang "VD · Trống, cần dọn" – chưa sẵn sàng. …", có ô Lý do. Gõ lý do thì nút thành "Gửi lễ tân trưởng xác nhận", bấm được (QA không gửi). Buồng `start_cleaning` sang `CL`: `qa.mgr`, `qa.owner` thấy `checkin.room_not_ready_lead` và ô Lý do. `qa.fdl` nhận phòng bằng ngoại lệ: POST 200 kèm `roomNotReadyOverride.reason`, B `in_house` |
    | D4 (C2, `room_status` `OC` không có lượt) | Căn 203 có trạng thái lưu `OC` (sửa DB như căn kẹt trạng thái), không có lượt Đang ở. B đến D+2 | API: `cause:room_status`, `detail:OC`, không có `overridableBy`. `qa.fd` và `qa.fdl` thấy `checkin.room_status_stuck`: "Căn 203 vẫn hiện có khách, nhưng không còn đơn nào đang ở. …" Không có ô lý do, không có POST |
    | D5 (C2, `no_room`) | Đơn OTA để ở làn chưa gán căn (`conflictState:open`) | API: `cause:no_room`, không có `detail`. Desk: dòng "Đơn đã được gán căn" báo "Đơn chưa được gán căn (xung đột OTA). …". Dòng buồng không có hộp đỏ, không có câu nào trong 4 câu chặn, không có ô lý do. Còn dòng phụ "Căn · VC · Đã dọn, chờ kiểm" (BUG-R4-049, có từ trước) |
    | D6 (C3, API cũ) | `page.route` bỏ `cause`, `heldByReservationCode` khỏi `room_ready`. Đơn chưa gán căn thêm `detail:"VC"` như máy chủ trước #74 | D1 (`OD`) → `checkin.room_occupied`. D2 (`CL`, có lượt) → `checkin.room_held`, không có mã. D4 (`OC`) → `checkin.room_occupied`. D5 → không có câu. D3 (`VD`) → vẫn là lối ngoại lệ (Desk theo `overridableBy`). Ở mọi ca chặn, `qa.fd` và `qa.fdl` không gửi ghi đè |

  - Chữ: so nguyên câu với `strings-vi.json` @ `055e92d5` (`room_held_code`, `room_held`, `room_occupied`, `room_status_stuck`; câu ngoại lệ cũ `room_not_ready`, `room_not_ready_lead`).
    - Chạy lại `gen_strings.py` không ra diff.
    - Sau lần gộp `main`, 4 khóa chữ của #82 vẫn còn đủ ở VI và EN.
    - Câu EN chỉ đọc diff, vì Desk chạy `vi-VN`.
  - axe (WCAG, chặn ở mức serious/critical): đạt ở H13 căn bị giữ (D2, `qa.fd`) và H13 căn `VD` (D3, `qa.fd`).
  - Hồi quy:
    - Ở `5d74eb02`:
      - unit admin-web toàn bộ 967/967 (86 tệp);
      - E2E `checkin.s3.api`: 19 đạt, 2 bỏ qua có chủ đích (mã cửa, TC-L3-060/061);
      - E2E `checkin.s3.clock` 32/32;
      - UI `stay-money.s4` + `gate-s4` (TC-L3-079, 081, 082, 085 và 3 ca cùng tệp) 7/7;
      - UI `stay.h13-h17` 6/6.
    - Ở `055e92d5`:
      - `typecheck` sạch;
      - `bug-r4-039-fea` 13/13; 8 tệp unit nhận phòng 95/95;
      - test tạm Desk (D1–D6) đạt;
      - UI `stay-money.s4` + `gate-s4` 7/7, `stay.h13-h17` 6/6.
  - Chưa kiểm:
    - `OOO` (`ci.ooo_never`), chỉ dựa vào unit;
    - trên STG: RG-14 và RG-30, nếu có cặp đơn phù hợp.
  - **Kết luận: ĐẠT** phía Desk ở `055e92d5`. Không có lỗi chặn #77. BUG-R4-049 (P3) có từ trước, không do #77.
  - Bằng chứng (scratchpad, không commit, dữ liệu giả): `qa2-pr77-out/e2e-t2/data.txt`, `e2e-api`, `e2e-clock`, `e2e-uiclock`, `e2e-ui`, `e2e-uiclock2`, `e2e-ui2`, `vitest-all.log`, `vitest-checkin2.log`, `tsc.log`, bản sao test tạm `zz-qa2-pr77.spec.ts.bak`.
- **Trạng thái:** **Máy chủ đã gộp `main` @ `2f535924` (#74). Desk: QA2 ĐẠT ở #77 @ `055e92d5`, đã gộp `main` `c9af9f4c` (#77), chờ staging (RG-14, RG-24, RG-25, RG-30).**
  - Trước đó: Đã sửa – chờ gộp #74 (QA2 05/11, đạt local; xác minh lại ở `0950313e` đạt).
  - Trước đó nữa: Mới – ORC quyết chặn ở máy chủ trong v1.0.4, BE sửa trên nhánh `v104/fix-checkin-occupied-exception`.
  - P1 còn mở thì QC không qua (`test-strategy.md` mục 8). Nếu không kịp bản cắt 06/11 18:00, ORC phân xử, và theo protocol mục 8 cần ESC.

---

### BUG-R4-040 – Đặt phòng mới: câu "giá ngoài sàn–trần" hiện nguyên chữ `{min}`, `{max}`, `{group}`
- **Mức:** P3 (QA chốt 04/11 khuya). Thẻ UXD PR70-06 (Minor). ORC đã quyết dời v1.0.5, không chặn #70.
  - Đây là lỗi câu chữ: hiện mã giữ chỗ thô (`test-strategy.md` mục 8, mục 0.5 của bộ test case).
  - **Không sai tiền.** Máy chủ vẫn chặn đơn (422), nên không có đơn nào được tạo với giá ngoài sàn–trần.
  - Lễ tân không biết khoảng giá đúng là bao nhiêu, nên phải đoán số.
- **Môi trường:**
  - Desk của PR #70 @ `94a28258`: image web dựng từ head này, Chromium 1366 × 768.
  - API `origin/main` @ `c2506a53`. Phía máy chủ, #70 không đổi gì.
  - Stack local dùng một lần `ottimo-qa039`, seed DS-E, lễ tân `qa.fd`, khách giả.
- **Liên quan:**
  - BR-105 (sàn–trần theo nhóm căn).
  - `reservations.service.ts` 739–743 (`c2506a53`): `throw problem('RATE_OUT_OF_RANGE', { errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE' }], extras: { dates } })`. Không có `min`, `max`, `group`.
  - `BookingDialog.tsx` (@ `94a28258`):
    - nhánh `RATE_OUT_OF_RANGE` (dòng 636) chỉ nằm trong `VALIDATION_FAILED`, nên Problem `RATE_OUT_OF_RANGE` rơi xuống `setRequestError`;
    - `problemView` dùng `error.RATE_OUT_OF_RANGE`, chỉ điền `min`/`max` khi Problem có hai trường đó;
    - `interpolate` (`packages/i18n/src/translate.ts`) giữ nguyên `{name}` khi thiếu giá trị.
  - Test mới của FE trong #70 giả lập `RATE_OUT_OF_RANGE` dưới dạng `VALIDATION_FAILED` kèm `min`/`max`. Máy chủ thật không bao giờ trả dạng này, nên test xanh nhưng không phủ ca thật.
  - Có từ trước v1.0.1: chữ `error.RATE_OUT_OF_RANGE` có từ `592e4df0` (15/10). Thân lỗi của máy chủ như trên đã có ở tag `v1.0.3`.
- **Các bước tái hiện:**
  1. Mở **Đặt phòng mới**. Giữ kênh Trực tiếp, chọn căn 101, 1 đêm. Chờ ô giá được điền (667.000).
  2. Gõ `100000` vào ô giá đêm. Chọn khách. Bấm **Tạo đơn**.
  3. Lặp lại với `90000000`.
- **Thực tế** (2/2 lượt, mỗi lượt 2 mức giá):
  - `POST /reservations` trả 422, thân lỗi có `code: RATE_OUT_OF_RANGE`, `dates: [ngày]` và `errors[0]` là `nightlyRates` / `RATE_OUT_OF_RANGE`.
  - Desk hiện ở đầu hộp (`role=alert`): "Giá phải từ {min} đến {max} (giá sàn – trần nhóm {group})."
  - Khi bấm **Tạo đơn**, câu nằm ngoài khung nhìn. Lễ tân phải cuộn lên mới thấy.
  - Dưới bảng giá không có câu nào.
- **Mong đợi:**
  - Câu có số sàn, số trần và tên nhóm căn thật, theo mẫu "Giá phải từ … đến … (giá sàn – trần nhóm L12)."
  - Câu nằm dưới bảng giá, hoặc dưới ô của đêm sai, như các lỗi `nightlyRates` khác sau thẻ PR70-01.
  - Nếu chưa có số, dùng câu không có chỗ trống, ví dụ "Giá ngoài khoảng sàn – trần của nhóm căn." Không bao giờ hiện `{…}`.
- **Ví dụ cách sửa (BE + FE quyết, ARC xem):**
  - BE: thêm `min`, `max`, `group` (hoặc `floorVnd`/`ceilingVnd` theo từng đêm) vào Problem.
  - FE: xử lý Problem `RATE_OUT_OF_RANGE` như lỗi của ô giá.
  - Sửa mock trong test cho khớp thân lỗi thật.
  - Cùng mẫu thân lỗi ở B9a (`checkin.service.ts` 185) và gia hạn (`stay.service.ts` 375). UXD/FE kiểm hai chỗ này cùng lần.
- **Bằng chứng** (scratchpad, không commit, dữ liệu giả): `qa039/data70b.txt`, ảnh `qa039/data70b.txt.u2-*.png`.
- **Vai chịu trách nhiệm:** BE + FE, UXD duyệt câu.
- **Trạng thái:** Mới – dời v1.0.5 có kế hoạch (ORC). Ghi vào backlog v1.0.5.

---

### BUG-R4-041 – Đặt phòng mới: "Giữ chỗ" bỏ giá đêm đã gõ, giữ chỗ và cọc tính theo giá niêm yết
- **Mức:** **P2** từ 05/11 01:00, vì khóa tạm của PR #75 đạt. Trước đó là **P0** khi chưa có khóa tạm (QA chốt 04/11 khuya). Nếu #75 không vào bản cắt, lỗi trở lại P0. DOM đề xuất P1 khi không có khóa tạm, P2 khi có.
  - **Vì sao P0 lúc này:**
    - Đây là lỗi sai tiền với khách, và không ai được báo.
    - Lễ tân đã gõ giá thỏa thuận và thấy số đó trong ô. Bấm **Giữ chỗ** thì Desk tính lại theo giá niêm yết, không có câu nào.
    - Khách nhận mã VietQR cọc 30 % cao hơn số đã báo.
    - Khi đơn được xác nhận, giá đơn là giá niêm yết. Lúc trả phòng, khách bị đòi theo giá đó, trừ khi có người nhớ sửa lại.
    - `test-strategy.md` mục 8 quy định lỗi tiền mặc định P0, cho tới khi chứng minh không ảnh hưởng tiền. Ở đây tiền bị ảnh hưởng.
    - QA dùng cùng luật với BUG-R4-037, nơi số sai cũng hiện trong ô nhưng Desk gửi đi mà không báo.
  - **Yếu tố giảm nhẹ, chưa đủ để hạ mức:**
    - sau khi giữ chỗ, hộp kết quả có in số cọc, nên lễ tân cẩn thận có thể thấy số lệch;
    - giá đơn sửa được sau, trong sàn–trần, có lý do.
  - **Vì sao hạ P2 khi có khóa tạm:**
    - Khi có ô đã gõ, Desk khóa **Giữ chỗ** và nói rõ lý do. Desk không còn bỏ giá lặng lẽ, nên không còn đường sai tiền.
    - Phần còn lại là thiếu chức năng (giữ chỗ theo giá thỏa thuận), có cách làm khác: thu cọc rồi **Tạo đơn**. Đó là mức P2, dời v1.0.5 có kế hoạch theo thẻ ARC-05.
- **Môi trường:** đọc mã PR #70 @ `94a28258` và tag `v1.0.3`; hợp đồng `origin/main` @ `c2506a53`. Từ 04/11 23:50 đã tái hiện trên stack dựng từ `v1.0.3` và stack dựng từ #70 @ `98d8a3ad`. Ngày 05/11 00:15 tái hiện thêm trên `main` @ `d0ea6dc2` (mục "Thực tế trên stack").
- **Liên quan:**
  - `product/apps/admin-web/src/pages/booking/BookingDialog.tsx`:
    - @ `94a28258`, `hold()` dòng 681–724: thân `saveQuote` gồm căn, ngày đến, số đêm, số khách, kênh, khách, yêu cầu website. **Không có `nightlyRates`.** Sau đó gọi `createHoldFromQuote` với `depositMethod: 'vietqr'`;
    - @ `v1.0.3`, cùng mã ở dòng 607–640;
    - nút hiện khi `directLike && arrivalDate > today && online` (dòng 840–845). Không xét ô đã gõ.
  - `product/docs/api/openapi.yaml`, `QuoteInput`: không có trường giá đêm. Vì vậy FE không gửi được giá thỏa thuận dù muốn.
  - BR-106, BR-305 (cọc 30 % tiền phòng), BR-429 (g). Thẻ FB-R4-ARC-FE-PR70-03 và -05.
  - Cách làm tạm trên production (sổ tay 2.5 bước 10, BA): giá thỏa thuận thì **không bấm Giữ chỗ**. Báo khách cọc 30 % theo giá thỏa thuận; khách chuyển rồi mới **Tạo đơn** với giá đã gõ.
- **Các bước tái hiện** (lễ tân `qa.fd`, DS-E):
  1. Mở **Đặt phòng mới**, Trực tiếp, căn 101, ngày đến từ mai trở đi, 2 đêm. Chờ ô giá được điền.
  2. Gõ giá thỏa thuận cho cả 2 đêm, trong sàn–trần, thấp hơn giá lịch. Ví dụ giá lịch 667.000, gõ 600.000.
  3. Chọn khách. Bấm **Giữ chỗ đến …**.
- **Thực tế** (theo mã, chưa chạy):
  - Yêu cầu `saveQuote` không có giá đã gõ. Báo giá và giữ chỗ tính theo giá lịch (667.000 × 2).
  - Cọc 30 % và mã VietQR tính trên số đó, không trên 600.000 × 2.
  - Không có câu nào báo giá đã gõ bị bỏ.
- **Thực tế trên stack** (QA 04/11 23:50, đã tái hiện):
  - **v1.0.3:** stack local dùng một lần `ottimo-qa103`, dựng API và Desk từ tag `v1.0.3` (`da6d6f3d`). Seed DS-E, `qa.fd`, Desk Chromium thật.
    - Thao tác: Trực tiếp, căn 103, 2 đêm, ngày đến cách hôm nay hơn 1 tháng. Giá lịch 750.000/đêm. Gõ 690.000 cho cả 2 đêm. Nút **Giữ chỗ đến …** vẫn bấm được.
    - `POST /quotes` không có `nightlyRates`. `create-hold` trả 201.
    - Đơn giữ chỗ ghi `total_room_vnd` = **1.500.000** (750.000 × 2, nguồn `calendar`), không phải 1.380.000 như đã gõ. Cọc phải thu 500.000.
    - Desk không có câu nào báo giá đã gõ bị bỏ.
  - **#70 @ `98d8a3ad`:** cùng ca, cùng kết quả. Đây là điều đúng theo kế hoạch, vì #70 không sửa nút này; khóa tạm nằm ở PR riêng.
  - **`main` @ `d0ea6dc2`** (stack `ottimo-qamain`, 05/11 00:15): căn 102, giá lịch 750.000/đêm, gõ 690.000 cho cả 2 đêm. Cùng kết quả: `POST /quotes` không có `nightlyRates`, đơn giữ chỗ ghi 1.500.000 nguồn `calendar`, cọc phải thu 500.000, không có câu.
  - Ảnh `qa103/data.txt.h1-*.png`, `qa70c/data.txt.h1-*.png`, `qamain/data.txt.h1-*.png` nằm trong scratchpad, không commit.
  - Với ví dụ này, QA chưa tách được cọc 30 % theo giá đã gõ với cọc theo giá lịch. Lý do: chưa đọc luật làm tròn cọc. Dấu hiệu sai tiền đã rõ ở tiền phòng của đơn.
  - Cập nhật 05/11: trên stack của #75, cùng căn và cùng giá, **Tạo đơn** với 690.000 × 2 ghi cọc phải thu 400.000. Giữ chỗ theo giá niêm yết ghi 500.000. Vậy trước bản sửa, ở ví dụ này khách bị đòi cọc cao hơn 100.000.
- **Mong đợi:**
  - v1.0.4 (khóa tạm, chỉ FE): khi có ô đã gõ, nút **Giữ chỗ** bị khóa và có câu (UXD viết). Ví dụ: "Giữ chỗ chưa nhận giá đã gõ. Thu cọc rồi Tạo đơn, hoặc xóa giá đã gõ để giữ theo giá niêm yết."
  - Không có ô đã gõ thì giữ chỗ như cũ.
  - v1.0.5: giữ chỗ nhận giá thỏa thuận. ARC đổi hợp đồng Q1; cọc 30 % tính trên giá đó.
- **Test chống tái phát (QA đề xuất):**
  - UNIT (FE): gõ 1 đêm thì nút khóa và có câu. Xóa hết ô đã gõ thì nút mở lại, và `saveQuote` gửi đi không có giá.
  - E2E trên stack: như các bước trên. Có khóa thì không có yêu cầu `saveQuote` nào. Đối chứng: không gõ giá thì giữ chỗ được, cọc theo giá lịch.
  - Kiểm cả kênh CTV (`agent`), vì nút cũng hiện với kênh này.
- **Xác minh bản sửa (QA, 05/11 00:30–00:55): PR #75 `v104/fe-hold-typed-rate-lock`.**
  - **Head đã chạy:**
    - `9c277c7a`: lượt đầu;
    - `e71ab25f`: thẻ UXD PR75-01/02/03 (câu mới, `aria-disabled`, câu lý do đứng đầu footer). Kết quả dưới đây là của head này.
    - Worktree tạm và stack local dùng một lần dựng từ từng head. Đã dọn.
  - **Cách sửa (đọc mã):**
    - `typedRate` đúng khi có ít nhất một đêm **của kỳ ở** mà lễ tân đã gõ và ô còn số.
    - Khi đó nút **Giữ chỗ đến …** mang `aria-disabled="true"` và vẫn nhận focus. `aria-describedby` trỏ tới câu `booking.hold.typed_rate_locked`, đứng đầu footer.
    - `hold()` tự dừng khi `typedRate`, nên bấm chuột, Enter hay Space đều không làm gì. `Button` mặc định `type="button"`, nên Enter trên nút không gửi form.
    - Ô đã gõ rồi xóa không còn chặn giữ chỗ bằng lỗi ô giá.
    - Hộp này chỉ có một đường `saveQuote` → `createHoldFromQuote`. `QuoteDialog` không có ô giá gõ tay.
  - **Unit (admin-web):**
    - `v104-hold-typed-rate-lock` 6/6 (ở `9c277c7a` là 5/5);
    - `v104-booking-rate-carryover` 28/28, `booking` 9/9;
    - 3 ca tái hiện BUG-R4-037 của QA: 3/3.
    - Thay `BookingDialog.tsx` bằng bản của `main` @ `d0ea6dc2` thì tệp test khóa đỏ 5/6. Ca còn xanh là ca đối chứng "Tạo đơn với giá đã gõ".
  - **Desk thật trên stack** `ottimo-qa75` (seed DS-E, `qa.fd`, Chromium, gọi API thật; căn 102/103, giá niêm yết 750.000/đêm):
    - **L1**, Trực tiếp, 2 đêm, gõ 690.000 cho đêm 2:
      - nút có `aria-disabled="true"`, không có `disabled`, không `aria-busy`, nhận được focus;
      - câu "Giữ chỗ chỉ theo giá niêm yết. Đã nhận cọc thì bấm Tạo đơn để lưu giá đã gõ. Chưa nhận cọc thì xóa giá đã gõ rồi giữ chỗ, xác nhận cọc xong thì Điều chỉnh giá ở Folio." hiện, lớp `li-s`, là phần tử đầu footer. `aria-describedby` trỏ đúng câu này;
      - nút trông như nút khóa của DS: nền Cream, chữ Stone Grey, viền đứt, con trỏ not-allowed;
      - bấm chuột, focus + Enter, focus + Space: 0 yêu cầu `/quotes` hay `create-hold`, 0 yêu cầu `/reservations`, hộp vẫn mở;
      - nút **Tạo đơn** vẫn bấm được.
    - **L2**, gõ 690.000 cho cả 2 đêm rồi xóa từng ô:
      - xóa 1 ô thì vẫn khóa;
      - xóa cả 2 thì nút mở, câu ẩn, không còn `aria-describedby`;
      - bấm **Giữ chỗ**: `POST /quotes` không có `nightlyRates`, `create-hold` 201. Đơn giữ chỗ ghi **1.500.000** (750.000 × 2, nguồn `calendar`), cọc 500.000. Không có câu `rate_empty`.
    - **L3**, đã nhận cọc: gõ 690.000 × 2, bấm **Tạo đơn**: 201, `nightlyRates` có `edited:true`. Đơn ghi **1.380.000** nguồn `manual`, cọc phải thu 400.000. 0 yêu cầu `/quotes`.
    - **L4**, kênh **CTV / môi giới**: cùng khóa, cùng câu.
    - Hành vi của #70 không đổi: C1 và C2 chạy lại ở cả 2 head, kết quả giống hệt trên `main` (mục BUG-R4-037).
  - **Ghi nhận, không phải lỗi của #75:** Enter trong một ô giá sẽ gửi form, tức là **Tạo đơn** ngay (đơn `confirmed` với giá đã gõ), không qua giữ chỗ. Đây là hành vi cũ của form H09. Gửi UXD cân nhắc.
  - **CI #75 @ `e71ab25f`:** job test đỏ ở cùng 2 ca "Hôm nay" của `v104-holds-feb` như #71 (ngày UTC, PR #76 sửa). Không có ca nào của #75 đỏ.
  - Spec tạm `zz-qa75.spec.ts` (không commit) và ảnh `qa75/data-e7.txt.*.png` để ở scratchpad. Dữ liệu giả.
- **Vai chịu trách nhiệm:** FE (khóa tạm), UXD (câu), ARC/BE (hợp đồng Q1, v1.0.5), BA (sổ tay). ORC quyết hotfix production và việc gửi cách làm tạm cho INV. Đây là việc về tiền với khách.
- **Trạng thái:** **Đã gộp `main` `ebca5a95` (#75)** – trước đó: Đã sửa – chờ gộp #75 (QA xác nhận 05/11 01:00 ở head `e71ab25f`). Mức hạ **P2**.
  - Trước đó: Mới, P0, chờ PR `v104/fe-hold-typed-rate-lock`.
  - Phần còn lại (giữ chỗ nhận giá thỏa thuận, hợp đồng Q1) dời v1.0.5 có kế hoạch, theo thẻ ARC-05.
  - Nếu #75 có commit mới, QA chạy lại phần đổi. Nếu #75 không vào bản cắt 06/11 18:00, lỗi trở lại P0.
  - Sau khi gộp: RG-15 trên STG 07/11.
  - Production (v1.0.3) vẫn có lỗi tới khi phát hành v1.0.4. Cách làm tạm: sổ tay 2.5 bước 10. ORC quyết hotfix.

---

### BUG-R4-042 – Trả phòng sau B14: đếm xong tủ thứ hai, Desk quay lại tủ đã đếm khi bản tóm tắt tải lại chậm
- **Mức:** **P1** (QA2 chốt 05/11).
  - **Ảnh hưởng tiền**, qua thao tác của lễ tân trên một màn hình gây nhầm.
    - Desk đưa lại tủ 202 đã đếm, nhưng bảng không ghi tên tủ, còn tiêu đề vẫn là "Trả phòng · Căn 101".
    - Lễ tân tưởng đó là tủ căn 101 vừa đếm, bấm "Không dùng gì – tủ đủ". Kết quả: dòng minibar 35.000 của tủ 202 bị đảo. QA2 đã tái hiện.
    - Cùng họ với BUG-R4-035 (P1) và BUG-R2-144.
  - **Lý do không xếp P0.** Lỗi chỉ xảy ra khi có đủ 3 điều kiện:
    1. lượt có B14 giữa kỳ, và lúc trả phòng còn từ 2 tủ chưa đếm;
    2. bản tóm tắt tải lại sau lần đếm tủ đầu về chậm hơn lúc lễ tân đếm xong tủ thứ hai;
    3. lễ tân sửa số, hoặc bấm "tủ đủ", trên tủ đã đếm.

    Nếu lễ tân chỉ bấm **Tiếp tục** lần nữa thì tiền không sai (đếm lại cùng số).
  - **Nâng P0** nếu tái hiện được bằng thao tác tay trên staging, hoặc thấy dòng minibar bị đảo sau B14 trên dữ liệu thật.
  - Là P1 nên phải đóng trước QC rút gọn 08/11. Không kịp thì ORC phân xử.
- **Môi trường:**
  - Desk, Chromium, project `desk-clock`, đồng hồ giả.
  - Stack local dùng một lần `ottimo-qa2p67`, mã `ceda9278`, tức `main` @ `217afac0`. Seed DS-E.
  - Đoạn mã có từ S4-38 (`feb75035`, round 2). Tag `v1.0.1`, `v1.0.2`, `v1.0.3` đều có `const next = nextCabinet(counted)`, nên lỗi **đang ở production**.
  - #67 không gây ra lỗi này và cũng không sửa nó.
- **Liên quan:**
  - `product/apps/admin-web/src/pages/stay/CheckOutPage.tsx` (dòng theo `ceda9278`):
    - `toCount` dòng 707;
    - `nextCabinet` dòng 708–709;
    - `saveMinibar` dòng 710–763: nhánh `!chargeable` ở đầu hàm, và sau lệnh POST là `sum.reload(); const next = nextCabinet(counted)`;
    - `cabinets` dòng 498–504: nhóm chọn tủ ẩn khi `cabinet` không còn trong `minibarUncheckedRooms`.
  - BR-703-01; K11-03 (màn hình luôn nêu tên tủ đang đếm); TC-L4-138 (`e2e/ui-clock/b14-fridges.s5.spec.ts:102`).
- **Các bước tái hiện:**
  1. Ngày ảo D: khách vào 202, ở 2 đêm. D+1 lúc 10:00: B14 do sự cố, 202 chuyển sang căn cùng nhóm (101). Không đếm tủ lúc đổi.
  2. D+2 lúc 09:00: mở Trả phòng (H16). Tủ cũ 202 được chọn trước. Gõ bia dùng 1, bấm **Tiếp tục: Phụ phí**. Desk gửi `POST …/minibar-checks`, nhận 201 cho 202.
  3. Desk chuyển sang tủ 101. Bấm **Tiếp tục: Phụ phí** trước khi `GET …/checkout-summary` (tải lại sau bước 2) về. Desk gửi `POST`, nhận 201 cho 101.
  - Tự động, tái hiện ổn định: test E2E tạm giữ mọi `checkout-summary` sau bước 2 bằng `page.route`. Tái hiện 3/3 lượt.
  - Tự nhiên: lượt đầu của TC-L4-138, khi máy tải 45–64. Trace cho thấy sau 2 lệnh 201, trang vẫn ở bước ①, và lệnh bấm **Tiếp tục: Bill & thu tiền** chờ tới hết giờ.
- **Thực tế:**
  - Sau bước 3: trang vẫn ở bước ① Minibar, nút "Căn 202 (đã chuyển đi)" được chọn lại. Desk không sang bước ② Phụ phí.
  - Khi bản tóm tắt về:
    - nhóm chọn tủ ẩn đi, vì không còn tủ chưa đếm;
    - bảng hiện tủ 202 với số của lần đếm trước: bia còn 1, dùng 1, "Tổng minibar: 35.000";
    - tiêu đề là "Trả phòng · Căn 101". Không chỗ nào ghi đây là tủ 202.
  - Nếu lễ tân bấm **Tiếp tục** lần nữa: Desk gửi lệnh thứ ba, 201 cho 202 (đếm lại cùng số), rồi sang bước ②. Folio có 1 dòng minibar 35.000, không có dòng đảo. Dù vậy vẫn thừa một lần đếm và một bước gây nhầm.
  - Nếu lễ tân bấm **Không dùng gì – tủ đủ** rồi **Tiếp tục**: Desk gửi 201 cho 202 với tủ đầy. Dòng 35.000 bị đảo, minibar trên folio còn 0. Khách sạn mất 35.000, tức **sai tiền**.
- **Nguyên nhân (QA đọc mã):**
  - `saveMinibar` là closure của lần render lúc bấm, nên `toCount` là `s?.minibarUncheckedRooms` của lần render đó.
  - Sau khi `await` lệnh POST, `nextCabinet(counted)` tìm tủ kế tiếp trong danh sách cũ ấy. Nếu bản tóm tắt sau lần đếm trước chưa về lúc bấm, tủ đã đếm vẫn nằm trong `toCount` và được chọn lại.
  - `sum.reload()` gọi ngay trước đó không đổi được biến đã chụp trong closure.
- **Mong đợi:**
  - Đếm xong tủ cuối thì sang bước ②, dù bản tóm tắt về chậm. Trong một lần mở trang, không bao giờ quay lại tủ đã đếm (BR-703-01: mỗi tủ đếm một lần).
  - Màn hình luôn nêu tên tủ đang đếm (K11-03), kể cả khi tủ đó không còn trong `minibarUncheckedRooms`.
  - Ví dụ cách sửa (FE quyết, ARC xem), áp cho cả nhánh `!chargeable`:
    - giữ tập các tủ đã đếm được 201 trong lần mở trang (ref), và loại các tủ đó khỏi `nextCabinet`;
    - hoặc chờ `sum.reload()` xong rồi chọn tủ kế tiếp từ bản tóm tắt mới, thay vì dùng `toCount` của closure.
- **Test chống tái phát:**
  - UNIT (MSW): giữ `checkout-summary` từ sau lần đếm thứ nhất tới sau lần đếm thứ hai. Kỳ vọng: sang bước ②, đúng 2 lệnh `POST`, không chọn lại tủ đầu. Ca này phải đỏ ổn định trên `ceda9278`.
  - E2E: thêm cho TC-L4-138 một biến thể giữ bản tóm tắt, như test tạm của QA2.
  - Hồi quy: TC-V104-RG-21.
- **Bằng chứng** (scratchpad, không commit, chỉ dữ liệu giả, không bí mật):
  - test tạm `zz-qa2-pr67.spec.ts`, ca "race", xóa cùng worktree;
  - log `qa2-pr67-out/e2e-race1` … `e2e-race3` (`data.txt`);
  - trace lượt đầu TC-L4-138: `qa2-pr67-out/trace-reg/`;
  - ảnh `data.txt.race-held.png`: chưa qua kiểm che, không commit.
- **Vai chịu trách nhiệm:** FE-A (H16 minibar) sửa, ARC xem cách sửa, UXD xem nhãn tủ đang đếm, QA chạy lại.
- **Xác minh bản sửa (QA3, 05/11 01:08–01:30): PR #81 `v104/fe-checkout-minibar-race` @ `054d40c0`.** Commit sửa `c605e919`, rebase lên `main` @ `7f0ef3fb`.
  - **Môi trường:**
    - worktree tạm từ đúng head;
    - stack local dùng một lần `ottimo-qa81`: compose của dự án cộng overlay riêng, image dựng từ worktree. Cổng api `127.0.0.1:3481`, Desk `localhost:8581`;
    - `.env` sinh bằng `infra/ci/make-ci-env.sh` (giá trị ngẫu nhiên dùng một lần), `CLOCK_MODE=mutable`, seed DS-E;
    - không chạm staging, production hay stack khác trên máy. Đã dọn.
  - **Cách sửa (đọc mã):**
    - `doneRef` và `doneCabinets` nhớ các tủ đã đếm (nhận 201) và tủ bỏ qua vì không có món tính tiền, trong lần mở trang.
    - `goNextCabinet` lấy tủ kế tiếp từ bản tóm tắt mới nhất (`latestSummary`), bỏ mọi tủ đã đếm.
    - Nhóm chọn tủ và effect BR-703-01 cũng bỏ tủ đã đếm. Lượt có từ 2 tủ thì có dòng "Tủ minibar đang đếm: …".
    - Lệnh POST gửi `roomId` = `counted` (`read.roomId`), đúng tủ ghi vào `done`. Không đổi máy chủ hay hợp đồng.
  - **Unit (MSW, `server.use` giữ `checkout-summary`):**
    - Test FE `bug-r4-042-fea`: 5/5. 7 tệp minibar/checkout FE liệt kê: 60/60.
    - Test tạm của QA `zz-qa81-bug-r4-042.test.tsx` (không commit), 5 ca:

      | Ca | Bước | Trên `054d40c0` | Trên `CheckOutPage.tsx` của `7f0ef3fb` |
      |---|---|---|---|
      | A, chuỗi tiền | 402 bia dùng 1 → giữ bản tóm tắt → đếm 202 → nhả. Nếu còn nút "Không dùng gì – tủ đủ" thì bấm, rồi **Tiếp tục** | Sang bước ②, không còn nút. 2 lệnh `[402, 202]`. Folio `[402: 35.000]` | **Đỏ**: lệnh thứ ba 201 cho 402 (tủ đầy), folio minibar `[]` |
      | B, Quay lại (G-FE-042-1) | Như A, sang bước ②, Quay lại, **Tiếp tục** | Dòng tên tủ ghi "Căn 202 (đang ở)", 402 không được đưa. Bảng giữ số đã gửi. Lệnh thứ ba cho 202, cùng số. Folio giữ 35.000 | Đỏ (không tới được bước ②) |
      | C, như B, có dùng ở cả 2 tủ | 402 và 202 mỗi tủ bia dùng 1 | Quay lại: bảng 202 vẫn "dùng 1", không về tủ đầy. Đếm lại: folio 2 dòng 35.000, không có dòng âm | Đỏ |
      | D, tủ đã đếm phải đếm lại (G-FE-042-2) | Sau lần đếm 402, máy chủ đánh dấu 402 phải đếm lại | B18 409 `MINIBAR_NOT_CHECKED`, folio 35.000, nhưng trên trang không đếm được 402. Xem **BUG-R4-045** | Trang chuyển sang 402 (nhóm chọn tủ có 402 và 202) |
      | E, đọc bản tóm tắt lỗi | Mọi lần đọc bản tóm tắt sau lần đếm đầu trả 500 | Vẫn nêu tên 202, 402 không được đưa. 2 lệnh, sang bước ②, folio 35.000 | Đỏ: 402 vẫn được đưa lại |

    - Thay `CheckOutPage.tsx` bằng bản `7f0ef3fb`: 4 tệp FE ra **7 đỏ / 26 xanh**, khớp báo cáo FE.
    - Hồi quy: 20 tệp admin-web có H16 hoặc minibar, cộng tệp QA: 207/207. Toàn bộ admin-web: **943/943** (83 tệp).
    - Kiểm tĩnh: `tsc --noEmit` đạt; eslint và prettier trên 5 tệp đổi đạt; chạy lại `gen_strings.py` không ra diff.
  - **E2E Desk thật trên stack** (project `desk-clock`, Chromium 1366×768, MutableClock):
    - Spec tạm `ui-clock/zz-qa81-race.spec.ts` (không commit). Dựng như TC-L4-138: B14 202 → 101 ngày D+1, trả phòng D+2 lúc 09:00. `page.route` giữ mọi `GET …/checkout-summary` từ lần đếm đầu.
    - **R1, đua + "tủ đủ":**
      - lúc bản tóm tắt còn giữ, nhóm chọn tủ ẩn, dòng "Tủ minibar đang đếm: Căn 101 (đang ở)" hiện;
      - đếm 101 thì sang bước ② khi 2 lần đọc còn bị giữ, không đọc lại bản chuẩn tủ nào;
      - nhả bản tóm tắt: không còn nút "tủ đủ";
      - B18 xong: folio `settled`, minibar 1 dòng 35.000 của tủ 202, đúng 2 lệnh đếm.
    - **R2, đua + Quay lại:** không sai tiền. Gặp 409 ở lệnh đếm lại, xem G-FE-042-1 bên dưới và **BUG-R4-047**.
    - Số lượt: R1 5/5, R2 4/4. Lượt đỏ đầu của R2 là do test tạm chưa xử lý 409 (BUG-R4-047), không phải lỗi của #81. TC-L4-138 (spec có sẵn) 5/5. Tải 1 phút lúc chạy 2–56 vì máy có việc khác.
    - **Đối chứng:** dựng lại image web với `CheckOutPage.tsx` của `7f0ef3fb` trên cùng stack. R1 **đỏ đúng lỗi**:
      - sau lần đếm thứ hai, trang ở bước ①, nút "Căn 202 (đã chuyển đi)" được chọn, bản chuẩn 202 được đọc lại;
      - bấm "tủ đủ" rồi **Tiếp tục**: lệnh thứ ba 201 cho 202, folio minibar `[]`, mất 35.000.
    - Hồi quy E2E trên image #81: `checkout.h16` 3 ca, `minibar-recount.s4` 4 ca, `b14-fridges.s5` 1 ca: 8/8.
  - **G-FE-042-1, quay lại bước ①: không sai tiền.**
    - Unit B và C đạt như bảng trên.
    - Máy chủ thật khác mock. Lệnh đếm lại nhận **409 `MINIBAR_PERIOD_CHANGED`** (R2; R3 là lượt 1 tủ, không B14). Lý do:
      - lần đếm đầu của tủ chưa từng nạp đã ghi kỳ `check_in` (`registerFridge` trong `record()`);
      - bản chuẩn trên trang vẫn của kỳ cũ, `periodId = null`.
    - Desk hiện "Số đếm chưa được lưu" và đọc lại bản chuẩn. Lễ tân bấm **Tiếp tục** lần nữa thì nhận 201, folio đúng 35.000. Không ghi gì sai.
    - Lỗi có từ trước #81: R3 trên mã cũ ra như nhau. QA ghi **BUG-R4-047 (P2)**.
    - Câu của FE "gửi lại cùng số, máy chủ giữ dòng (R6)" chỉ đúng khi tủ đã có kỳ.
  - **G-FE-042-2, tủ đã đếm phải đếm lại trong cùng lần mở trang: không sai tiền, nhưng màn hình cụt.**
    - B18 chặn `MINIBAR_NOT_CHECKED` (mock, ca D; máy chủ `checkout.service.ts` dòng 1223).
    - Trên trang, tủ đó không được đưa lại, kể cả khi Quay lại. Mở lại trang thì có tủ đó và câu "Cần đếm lại" (`co.minibar_recount_title`).
    - Trên `main`, trang chuyển sang tủ này ngay sau lần đếm kế tiếp. QA ghi **BUG-R4-045 (P2)**, không chặn #81.
  - **Chưa kiểm:**
    - Lúc xác minh, UXD chưa duyệt khóa `co.minibar_cabinet_counting`. Từ 05/11 01:40, UXD đã duyệt (ĐẠT).
    - QA chưa đọc CI của #81.
    - Không chạy tải 60–110. FE đã chạy 12 × 2.
    - Ca D chỉ chạy ở unit. Muốn dựng "đếm lại" trên máy chủ thật giữa lúc trang đang mở thì phải làm B14 hoặc B13 ở phiên khác.
  - **Kết luận: ĐẠT.**
  - Bằng chứng (scratchpad, không commit, chỉ dữ liệu giả, không bí mật): `qa81/logs/`, `qa81/e2e-run3/`, `qa81/e2e-pr-final/`, `qa81/e2e-old2/`, `qa81/e2e-old3/` (`data.txt`, `run.log`); hai test tạm ở `qa81/tests/`. Trace Playwright đã xóa vì có mật khẩu seed dùng một lần của stack.
- **Trạng thái:** **Đã gộp `main` @ `3e6a762b`, chờ staging** (ORC báo 05/11 02:00; QA3 xác nhận 05/11 01:30 ở head `054d40c0`). Mức vẫn **P1**.
  - Trước đó: Mới – báo ORC 05/11 00:45; theo ORC, đội sửa bằng PR mới.
  - Đã xong: UXD duyệt `co.minibar_cabinet_counting` và dòng tên tủ (ĐẠT, `UXD-on-v104-pr81-minibar-race.md`); ARC review (ĐẠT CÓ ĐK, `ARC-on-v104-pr81-minibar-race.md`).
  - Điều kiện CI của ARC: xong, ORC đã gộp #81 (05/11).
  - Còn lại: CI `main` chạy TC-L4-138; QA chạy lại RG-21 phần E2E trên `main` (chưa chạy); RG-21 trên STG.
  - Production (v1.0.3) vẫn có lỗi tới khi phát hành v1.0.4.

### BUG-R4-043 – Cờ đêm miễn phí `is_complimentary` đi theo kênh, không theo tiền: đêm "Nội bộ có thu" bị tính là đêm miễn phí
- **Mức:** **P2** (QA chốt 05/11). DOM và ORC đề xuất P3. Dời v1.0.5 có kế hoạch.
  - **Vì sao không P0/P1:**
    - không sai tiền. Doanh thu phòng, folio, chốt ca, công nợ, FOC và cảnh báo FOC đều không đọc cờ (bảng chỉ số ở DOM lượt 6, mục 2);
    - ở v1.0.x, không màn nào và không API nào đọc cờ này;
    - cờ tính lại đúng được bất cứ lúc nào từ cột tiền, nên không mất thông tin.
  - **Vì sao không P3:**
    - `test-strategy.md` mục 8 dành P3 cho thẩm mỹ, chính tả, căn lề, câu chữ.
    - Đây là dữ liệu lưu sai, và sẽ làm sai 2 chỉ số báo cho chủ đầu tư (ADR K-04, số đêm miễn phí K-02).
    - Lỗi khớp mức P2: "chức năng phụ sai", có cách làm tạm, được dời có kế hoạch.
  - Mức P2 không làm chậm v1.0.4. Lỗi vẫn dời v1.0.5 như DOM đề xuất.
- **Môi trường:** stack local dùng một lần từ PR #71 @ `7557e485` (04/11 23:15), seed DS-E. Đọc mã trên `main` @ `476fd9b8` (DOM lượt 6).
- **Liên quan:**
  - BR-904 (câu kênh Nội bộ), BR-421 v0.5.3 (b) (Nội bộ có thu), EP02 kênh Nội bộ;
  - `metrics-definitions.md` Q-05, K-02, K-04; `erd.md` dòng `is_complimentary`;
  - quyết định DOM lượt 6 trong `rounds/round-04/reviews/DOM-on-v104-pr68-docs.md`;
  - BUG-R4-038, nơi QA thấy lỗi.
  - Mã (theo DOM, `main` @ `476fd9b8`):
    - tạo đơn: cờ đơn = `group === 'internal' || tổng 0` (`reservations.service.ts` 803). Cờ đêm = `w.isComplimentary || n.amountVnd === 0` (`reservation-store.ts`, `insertNights` dòng 239; dòng 881 gọi với `group === 'internal'`);
    - đêm thêm B13/B9a/B18 chép cờ của đơn (dòng 2769, 3823);
    - A31 (`stay-night-pricing.ts` dòng 185) đổi giá và tiền nhưng không đổi cờ;
    - `setDiscount`/`addDiscount` (`stay-night-allocation.ts`) lại tính lại cờ khi gross > 0.
- **Các bước tái hiện** (stack local, `qa.fd`, DS-E):
  1. Tạo đơn Nội bộ, gõ giá 300.000 cho 1 đêm ("Nội bộ có thu").
  2. Đọc `stay_night.is_complimentary` và `reservation.is_complimentary` của đơn.
  3. Với một đơn Nội bộ đang ở, gia hạn 1 đêm (B13) và gõ 300.000. Đọc lại cờ của đêm thêm và của đơn.
- **Thực tế** (QA thấy 04/11 23:15 khi xác minh #71, ca QA-038-05 và QA-038-06):
  - bước 1–2: đêm gross 300.000 có `is_complimentary = true`. Đơn cũng `true`, dù `total_room_vnd` = 300.000;
  - bước 3: đêm thêm gross 300.000 cũng `true`; đơn `true`, tổng 300.000.
  - Theo mã: A31 sửa đêm 0 đ lên 300.000 vẫn để `true`; đêm 300.000 có giảm một phần thì thành `false`. Vì vậy cờ của cùng một đêm tùy vào lịch sử thao tác.
- **Mong đợi** (DOM lượt 6): cờ đi theo tiền, ở mọi kênh.
  - Đêm: `is_complimentary = true` khi và chỉ khi tiền phòng sau giảm của đêm bằng 0.
  - Đơn: `true` khi tổng tiền phòng bằng 0, và tính lại mỗi khi giá đổi.
  - Đêm "Nội bộ có thu" là đêm bán có thu tiền, nên vào ADR.
- **Ảnh hưởng:**
  - ADR K-04 cao hơn thật. Ví dụ của DOM: 853.000 thay vì 844.554, khoảng 1 %.
  - Số đêm miễn phí và số đêm bán có thu (K-02) bị đếm sai loại.
  - Không sai: công suất, doanh thu phòng, RevPAR, FOC, chốt ca, folio.
  - Câu Q1–Q5 của 037/038 không dùng cờ. Lưu ý cho DATA/BE: không dùng `is_complimentary = true AND gross > 0` làm dấu hiệu đơn Nội bộ dính 037, vì điều kiện này bắt cả đơn Nội bộ có thu đúng.
- **Cách làm tạm tới v1.0.5:** DATA tính đêm miễn phí bằng `room_revenue_vnd = 0`, không dùng cờ.
- **Việc ở v1.0.5** (theo DOM lượt 6 và ORC):
  - BE: cờ đêm = `room_revenue_vnd = 0` ở mọi đường ghi (`insertNights`, A31 `setNightRate`, `setDiscount`/`addDiscount`, B9a/B13/B18). Cờ đơn = tổng tiền phòng bằng 0. ARC chọn cách và xem thêm `lease-nights.ts`.
  - OPS/BE: tính lại cờ một lần trên dữ liệu đã có, theo điều kiện SEC, ORC duyệt.
  - DATA sửa Q-05; BA sửa EP02; ARC sửa `erd.md`; DOM sửa BR-904 khi ORC đồng ý.
  - **Hạn:** trước báo cáo ADR đầu tiên (R3, hoặc số tháng DATA gửi chủ đầu tư).
- **Test chống tái phát (QA đề xuất):** TC-V104-RG-22, N/A ở v1.0.4, chạy ở v1.0.5.
  - Mỗi đường ghi giá một ca: tạo đơn Nội bộ 0 đ và có thu; A31 từ 0 lên 300.000 và từ 300.000 về 0; giảm giá về 0; B9a/B13/B18 Nội bộ gõ > 0 và gõ 0; đơn Trực tiếp giảm 100 % thì `true`.
  - Câu đọc: không còn đêm nào có `is_complimentary` khác với `room_revenue_vnd = 0`, trước và sau lượt tính lại của OPS. Repo chỉ ghi số đếm.
- **Bằng chứng:** `qa038/data-r2.txt`, dòng QA-038-05 và QA-038-06 (scratchpad, không commit, chỉ dữ liệu thử DS-E).
- **Vai chịu trách nhiệm:** BE (sửa mã), OPS (tính lại dữ liệu), DATA, BA, ARC, DOM (tài liệu). QA chạy RG-22 ở v1.0.5.
- **Trạng thái:** Mới – dời v1.0.5 có kế hoạch (ORC 05/11). Không chặn v1.0.4.

### BUG-R4-044 – Gia hạn giữ chỗ: hạn rơi vào 00:00–06:59 hiện sớm một ngày
- **Mức:** **P2** (QA chốt 05/11). ARC ghi Minor.
  - Lễ tân đọc hạn này và báo lại cho khách. Báo sớm một ngày thì khách vội chuyển cọc, hoặc ca sau tưởng giữ chỗ đã hết hạn.
  - Không sai tiền. Hạn lưu trên máy chủ đúng, việc tự hủy chạy theo hạn đúng.
  - Có chỗ khác xem đúng hạn: băng "Giữ chỗ hết hạn sau …" trong khung đơn (`ReservationDrawer.tsx` dòng 485). Máy chủ trả mốc giờ có `+07:00`, nên cắt chuỗi lấy ngày ra ngày VN.
  - Lỗi khớp P2: "UX gây nhầm có cách khắc phục". Không phải P3, vì đây là ngày sai, không phải lỗi trình bày.
- **Môi trường:** đọc mã `origin/main` @ `373ec195`. Xác nhận bằng unit trên mã cũ (`ReservationDialogs.tsx` của `373ec195` trong worktree tạm, đã dọn).
- **Liên quan:**
  - `product/apps/admin-web/src/pages/reservations/ReservationDialogs.tsx` dòng 912, `ExtendHoldDialog`: `fmt` lấy giờ theo VN (`timeHHmm`) nhưng lấy ngày bằng `d.toISOString().slice(0, 10)`, tức ngày UTC;
  - chữ `rsv.extend_submit` ("Gia hạn đến {time}") và `rsv.toast.hold_extended`;
  - B3, US-085 AC3, BR-302; thẻ ARC FB-R4-ARC-FE-PR76-01 trong `rounds/round-04/reviews/ARC-on-v104-pr76-pin-daytime.md`.
- **Các bước tái hiện:**
  1. Có một giữ chỗ hết hạn lúc 01:00 ngày mai. Ví dụ: giữ chỗ 12 giờ tạo trong khoảng 12:00–18:59.
  2. Mở khung đơn, bấm **Gia hạn giữ chỗ (1 lần)**.
  3. Đọc chữ trên nút, rồi bấm gia hạn và đọc thông báo.
- **Thực tế** (unit trên mã cũ, ngày chạy 05/11): nút ghi "Gia hạn đến 01:00 06/11". Hạn đúng là 01:00 07/11 (01:00 ngày mai + 24 giờ). Thông báo cũng sớm một ngày.
- **Mong đợi:** ngày của hạn theo giờ VN, giống giờ của hạn và giống `holdUntil` ở `BookingDialog.tsx`.
- **Xác minh bản sửa (QA, 05/11 00:45–00:55): PR #80 `v104/fe-extend-hold-local-date` @ `796a0cee`.** Đây là 1 commit trên `main` @ `373ec195`.
  - Cách sửa: `fmt` lấy ngày bằng `todayLocal('Asia/Ho_Chi_Minh', d)`.
  - Test của FE `v104-extend-hold-local-date`: 1/1 đạt.
  - Test tạm của QA `zz-qa80.test.tsx` (không commit): giả đồng hồ `Date` (bộ đếm giờ vẫn thật, như `pinDaytime`) ở 4 giờ chạy (02:00, 06:30, 14:00, 23:30), với 3 mốc hạn ngày mai (01:00, 06:59, và 07:00 làm đối chứng). Mỗi ca gia hạn +24 giờ, rồi kiểm chữ trên nút và thông báo.
    - Trên `796a0cee`: **12/12 đạt** khi máy chạy theo múi giờ VN, và **12/12** khi chạy theo UTC (như CI).
    - Trên mã cũ (`373ec195`, TZ=UTC): **8 ca đỏ**, là các ca hạn 01:00 và 06:59. 4 ca đối chứng 07:00 xanh. Test của FE cũng đỏ trên mã cũ.
    - Lượt chạy thật diễn ra lúc 00:50, tức cũng là giờ đêm.
  - QA không dựng stack cho PR này. Phần sửa chỉ là cách định dạng ngày trong một hộp, unit đã render đúng hộp đó. Desk thật được kiểm ở RG-23 trên STG.
  - CI #80: đang xếp hàng lúc 00:55. QA chưa đọc kết quả.
- **Test chống tái phát:** test của FE ở trên; TC-V104-RG-23 trên STG.
- **Bằng chứng:** `qa80/logs/` (scratchpad, không commit).
- **Vai chịu trách nhiệm:** FE (B3), ARC đã xem.
- **Trạng thái:** **Đã gộp `main` @ `3e6a762b`, chờ staging** (ORC báo 05/11 02:00; QA xác nhận 05/11 01:00 ở `796a0cee`). Còn lại: RG-23 trên STG 07/11.

### BUG-R4-045 – Trả phòng (#81): tủ đã đếm trên trang mà máy chủ đòi đếm lại thì không được đưa lại; câu lỗi B18 chỉ tới bước 1 không có tủ đó
- **Mức:** **P2** (QA3 chốt 05/11).
  - **Không sai tiền.** Còn tủ phải đếm thì B18 chặn `MINIBAR_NOT_CHECKED` (máy chủ `checkout.service.ts` dòng 1223; mock cùng luật). Không có gì được ghi.
  - **UX gây nhầm, có cách khắc phục.** Câu lỗi là "Chưa kiểm minibar. Làm bước 1 trước khi hoàn tất.", nhưng bước 1 không đưa tủ đó. Cách vòng: mở lại trang Trả phòng.
  - **Hiếm.** Chỉ xảy ra khi, trong lúc trang đang mở, một tủ đã đếm lại thành "phải đếm". Ví dụ: ở tab hay máy khác có B14 quay lại căn đó, có B13, buồng phòng nạp tủ khi lượt còn ở căn, hoặc ngày làm việc đổi (`not_today`).
  - **Do #81 sinh ra** (giả định G-FE-042-2). Trên `main` @ `7f0ef3fb`, trang đưa lại tủ đó (nhóm chọn tủ; theo mã có câu `co.minibar_recount_title`).
- **Môi trường:**
  - Unit admin-web (MSW) trong worktree #81 @ `054d40c0`, đối chứng với `CheckOutPage.tsx` của `7f0ef3fb`.
  - Chưa chạy E2E. Muốn dựng "đếm lại" trên máy chủ thật giữa lúc trang đang mở thì phải làm B14 hoặc B13 ở phiên khác.
- **Liên quan:**
  - `product/apps/admin-web/src/pages/stay/CheckOutPage.tsx` @ `054d40c0`: `doneRef`/`doneCabinets`, `goNextCabinet`, `cabinets`;
  - `checkout.service.ts` dòng 1223; `minibar-checkout.port.ts` `uncheckedRooms` (`stay_continued`, `not_today`);
  - BR-703-01/02; BUG-R4-042; G-FE-042-2 trong `rounds/round-04/outputs/FE/bug-r4-042-minibar-race.md` (trên nhánh).
- **Các bước tái hiện** (unit, ca D của `zz-qa81-bug-r4-042.test.tsx`):
  1. Kim, B14 402 → 202, ngày đi lúc 11:00. Mở H16; tủ 402 được chọn trước. Bia dùng 1, bấm **Tiếp tục**: 201.
  2. Ngay sau đó, máy chủ đánh dấu 402 phải đếm lại (`stay_continued`; ở mock là `minibarRecount`). Bản tóm tắt mới liệt kê 402 (`stay_continued`) và 202 (`never_counted`).
  3. Trang ở tủ 202. Đếm, bấm **Tiếp tục**: 201.
  4. Gọi B18.
  5. Quay lại bước ①. Sau đó mở lại trang.
- **Thực tế (#81):**
  - bước 3: trang sang bước ②, dù bản tóm tắt vẫn liệt kê 402;
  - bước 4: 409 `MINIBAR_NOT_CHECKED`. Folio minibar vẫn 35.000;
  - bước 5: bước ① chỉ nêu "Căn 202 (đang ở)". Không có nhóm chọn tủ, không có câu `co.minibar_recount_title`. Không có đường nào để đếm 402;
  - mở lại trang: nhóm chọn tủ có "Căn 402 (đã chuyển đi)", đang được chọn, và có câu `co.minibar_recount_title` (căn 402).
  - Trên mã cũ: sau bước 3, trang chuyển sang 402 theo bản tóm tắt, nhóm chọn tủ có 402 và 202.
- **Mong đợi:**
  - Máy chủ đòi đếm lại một tủ trên bản tóm tắt đọc **sau** lần đếm, thì Desk đưa lại tủ đó, kèm câu "Cần đếm lại" (BR-703-02).
  - Desk chỉ bỏ qua tủ đã đếm khi bản tóm tắt còn cũ hơn lần đếm. Đó đúng là phần sửa của BUG-R4-042.
- **Gợi ý sửa** (FE quyết, ARC xem), chọn một:
  - mỗi tủ đã đếm ghi kèm số thứ tự lần đọc bản tóm tắt lúc đếm. Bản tóm tắt **bắt đầu đọc** sau lần đếm mà vẫn liệt kê tủ, thì bỏ tủ khỏi `done`;
  - hoặc tối thiểu: B18 trả `MINIBAR_NOT_CHECKED` thì xóa `done`, đọc lại bản tóm tắt, về bước ① và chọn tủ máy chủ liệt kê.
- **Test chống tái phát:**
  - ca D ở trên, đổi kỳ vọng: sau bước 3 trang chuyển sang 402 có câu "Cần đếm lại", hoặc sau 409 trang về bước ① có 402;
  - ca A–C, E của QA và 5 ca của FE vẫn phải xanh.
- **Bằng chứng:** `qa81/logs/qa-D-notes-pr81.txt`, `qa81/logs/qa-D-notes-old.txt` (scratchpad, không commit, dữ liệu giả).
- **Vai chịu trách nhiệm:** FE-A sửa, ARC xem. UXD xem câu `MINIBAR_NOT_CHECKED` nếu đổi.
- **Trạng thái:** Mới – FE đang sửa ở một PR mới chồng lên #81 (ORC 05/11 01:40). Không chặn #81.
  - Trùng thẻ ARC FB-R4-ARC-FE-PR81-01 (Minor; `rounds/round-04/reviews/ARC-on-v104-pr81-minibar-race.md`). Cách ARC đề xuất: khi B18 trả `MINIBAR_NOT_CHECKED`, đặt lại tập tủ đã đếm theo bản tóm tắt mới. Cách làm tạm trong sổ tay: tải lại trang.
  - QA chạy lại ca D khi có PR.
  - **Cập nhật 05/11 02:30 (QA3): đã sửa ở #83, head cũ `19cfa3f7` đạt; chờ head mới.**
    - Unit, ca D: máy chủ đòi đếm lại 402. Đếm 202 xong, trang không sang bước ② mà đưa lại "Căn 402 (đã chuyển đi)". Đạt.
    - E2E trên máy chủ thật, ca R5 của spec tạm `zz-qa83-race.spec.ts`, 3 lượt:
      - lượt B14 202 → 101; giữ bản tóm tắt từ lúc mở trang;
      - đếm tủ căn 101, nhả bản tóm tắt, sang Bill, bấm **Hoàn tất**: 409 `MINIBAR_NOT_CHECKED`;
      - trang về bước ①, tủ đang đếm là "Căn 202 (đã chuyển đi)", câu lỗi vẫn hiện;
      - đếm 202 nhận 201, câu lỗi mất ở bước ②; B18 nhận 200; folio minibar 35.000.
    - Đối chứng `main` @ `53500bcd`: trang đứng ở bước ③. Quay lại 2 lần thì bước ① chỉ có "Căn 101 (đang ở)", không có đường đếm 202. Lỗi tái hiện trên máy chủ thật.
    - Phần sửa này sinh ra **BUG-R4-048** (P0), chặn gộp #83.
  - **Cập nhật 05/11 02:50 (QA3): ĐẠT ở head mới `e411cb22`. Trạng thái: Đã sửa – chờ gộp #83.** Ca D (unit) và R5 (E2E) đạt 3/3 lượt, kết quả như head cũ. Thứ tự tủ nay cố định, căn cũ trước. Đóng khi #83 gộp và RG-29 đạt.

### BUG-R4-046 – Đặt phòng mới (H09), kênh Nội bộ: gõ giá cho một phần số đêm thì đơn lưu 0 đ cho mọi đêm, không báo
- **Mức:** **P0** (QA3 chốt 05/11). ARC đề xuất P2 (thẻ FB-R4-ARC-FE-PR82-01, mức Major).
  - **Sai tiền, và không ai được báo.** Lễ tân gõ đêm 1 = 500.000 (Nội bộ có thu, BR-421 v0.5.3 (b), BR-904 v0.5.5), để trống đêm 2.
    - `validate()` cho qua. `body()` gửi `nightlyRates = undefined`.
    - Máy chủ ghi 0 đ `complimentary` cho cả 2 đêm. Folio 0 đ: khách sạn không thu khoản đã thỏa thuận, và đêm bị tính là miễn phí.
  - Lỗi xảy ra mọi lần ở tốc độ người, không cần máy chậm.
    - Desk không cho gõ 0 (`rate_empty` khi ≤ 0).
    - Vì vậy muốn "đêm 1 có thu, đêm 2 miễn phí" thì lễ tân chỉ có cách để trống, tức đúng đường gây lỗi.
  - Cùng luật với BUG-R4-037, 038, 041: lỗi tiền mặc định P0 cho tới khi có bản sửa (`test-strategy.md` mục 8).
    - Sửa tay sau khi tạo được (A31), nếu lễ tân thấy. Nhưng Desk không cho dấu hiệu nào để thấy.
    - Từ #82, cạnh số đã gõ còn có nhãn "Giá đã gõ", làm lễ tân tin là số đã được lưu.
  - Bản sửa (A) vào v1.0.4 và QA xác minh đạt thì lỗi đóng.
    - Phần còn lại là một giới hạn, không phải lỗi tiền: không ghi được "đêm có thu + đêm miễn phí" trong một lần tạo đơn.
    - Cách làm theo BR-105 v0.5.8 (4): gõ giá cho mọi đêm, ghi đêm miễn phí ở Ghi chú nội bộ, rồi quản lý hoặc chủ đầu tư sửa đêm đó về 0 ở Folio (A31, có lý do) trước khi trả phòng.
- **Môi trường:**
  - Đọc mã `origin/main` @ `268bea08` và tag `v1.0.1`, `v1.0.2`, `v1.0.3`.
  - Probe của ARC: unit, test tạm đã xóa, trên #82 @ `e8b1c4e9`.
  - QA3 tái hiện 05/11 02:00 trên stack dùng một lần, với image web có `BookingDialog.tsx` của `9b45cef3` (trước #82). Xem mục "Xác minh bản sửa".
- **Liên quan:**
  - `product/apps/admin-web/src/pages/booking/BookingDialog.tsx` (`origin/main` @ `268bea08`):
    - `validate()` dòng 539–540: luật "gõ một phần" chỉ áp cho `ota`;
    - `body()` dòng 571–577 (`nightly`): OTA và Nội bộ chỉ gửi giá khi **mọi** đêm đã gõ;
    - tag `v1.0.3`: dòng 456–460, `rateList.every((r) => r.raw)`.
  - BR-421 v0.5.3 (b), BR-904 v0.5.5.
  - Thẻ ARC FB-R4-ARC-FE-PR82-01 trong `rounds/round-04/reviews/ARC-on-v104-pr82-rate-source.md` mục 2.2 và 5.
  - BUG-R4-037 (#70), BUG-R4-043.
- **Các bước tái hiện** (theo probe của ARC):
  1. Mở Đặt phòng mới. Chọn kênh Nội bộ, ghi chú nội bộ ≥ 3 ký tự.
  2. Căn 203, 2 đêm. Gõ đêm 1 = 500.000, để trống đêm 2.
  3. Bấm **Tạo đơn**.
- **Thực tế:**
  - Đơn được tạo, không có câu lỗi. Yêu cầu không có `nightlyRates`.
  - Máy chủ ghi 0 đ `complimentary` cho cả 2 đêm.
  - Cùng các bước với kênh OTA: không tạo đơn, hiện "Nhập giá mỗi đêm (lớn hơn 0)."
- **Mong đợi:**
  - Desk không bao giờ bỏ số lễ tân đã gõ mà không báo.
  - Theo BR-105 v0.5.8 (1)–(3), DOM chốt theo đề xuất (A) của ARC: đơn Nội bộ có ô đã gõ mà còn ô trống thì Desk chặn và không gửi. Câu lỗi ở khung giá là câu riêng cho Nội bộ, `booking.error.rate_empty_internal` (thẻ DOM FB-R4-DOM-UXD-PR82-01; UXD lượt 3 duyệt bản VI). OTA giữ `booking.error.rate_empty`.
  - Gõ đủ mọi đêm thì gửi `nightlyRates` với `edited:true`. Xóa hết thì đơn miễn phí 0 đ.
- **Ảnh hưởng production:**
  - Lỗi có từ trước v1.0.1. #70 không sinh ra lỗi này; ARC không bắt được ở review #70.
  - Số đã gõ không được gửi lên máy chủ, nên dữ liệu không cho biết đơn nào bị mất số.
  - Đề xuất cho ORC:
    - hỏi lễ tân về các đơn Nội bộ có thu đã tạo;
    - BE/DATA liệt kê đơn Nội bộ tạo trên Desk, mọi đêm 0 đ, sau đó có A31 hoặc có thu tiền. Đây là dấu hiệu lễ tân đã thấy và sửa tay.
  - ORC quyết hotfix.
- **Test chống tái phát** (theo ARC):
  - Nội bộ, 2 đêm, gõ đêm 1: phải thấy `rate_empty_internal`, không có POST `…/reservations`.
  - Gõ đủ 2 đêm: POST có `nightlyRates` 2 đêm, `edited:true`; máy chủ ghi đúng số, nguồn `manual`.
  - Ca hồi quy: TC-V104-RG-27 (UNIT + E2E + STG, test case bản 0.9).
- **Bằng chứng:**
  - Probe của ARC (mục 2.2, 5 của tệp review); QA3 đọc mã như mục "Liên quan".
  - QA3 05/11 (scratchpad, không commit, chỉ dữ liệu giả, không bí mật): `qa82out/logs/` (`unit-*.txt`, `notes-*.txt`, `admin-full.txt`), `qa82out/e2e-new1/`, `qa82out/e2e-new2/`, `qa82out/e2e-old1/`, `qa82out/e2e-old2/` (`data.txt`, `run.log`); test tạm ở `qa82out/tests/`. Chạy Playwright với `--trace=off`; thư mục `artifacts` đã xóa.
- **Xác minh bản sửa (QA3, 05/11 01:40–02:00)**, #82 `v104/fe-rate-source-typed` @ `0e48686c`, chồng trên #75:
  - Cách làm:
    - Worktree tạm ở `0e48686c`.
    - Unit: 2 ca của FE trong `v104-booking-rate-carryover.test.tsx` (FB-R4-ARC-FE-PR82-01/03), cộng 10 ca tạm của QA.
    - Đối chứng: thay `BookingDialog.tsx` bằng bản `9b45cef3`, là cha của commit đầu của #82.
    - Stack dùng một lần `ottimo-qa82` từ `docker compose` của dự án, seed DS-E. Desk Chromium 1366×768. Ghi mọi POST `…/reservations`, rồi đọc đơn qua API và bảng `reservation` (`pricing_snapshot`).
    - Image web cũ (`BookingDialog.tsx` của `9b45cef3`) để chạy đối chứng.
  - Kết quả unit và E2E:

    | Ca | Bản sửa `0e48686c` | Mã cũ `9b45cef3` |
    |---|---|---|
    | A0. Nội bộ 3 đêm, gõ đêm 1 và 3, để trống đêm 2 (unit, chỉ xét tiền) | 0 POST, không có "Đã tạo đơn" | **Đỏ:** 1 POST không có `nightlyRates`, báo "Đã tạo đơn" |
    | A. Như A0, kèm câu lỗi, số đã gõ và nhãn | Câu `rate_empty_internal` ở khung giá (khung `invalid`), không có câu OTA. Hai số đã gõ còn nguyên. Nhãn: "Giá đã gõ" / "–" / "Giá đã gõ". Gõ nốt đêm 2 thì gửi 3 đêm, mỗi đêm `edited:true` | Đỏ |
    | B. Nội bộ 2 đêm, để trống cả hai (unit) | Tạo đơn, không có `nightlyRates`. Câu `bk.internal_help` mới hiện | Đạt |
    | C, D. Gõ rồi xóa; hoặc bị chặn rồi xóa ô đã gõ (unit) | Tạo đơn miễn phí, không có `nightlyRates`. Nhãn về "–" | Đỏ (nhãn); phần tiền như bản sửa |
    | E. Gõ 500.000 và 0 (unit) | Lỗi `rate_empty` tại ô gõ 0, 0 POST. Đúng BR-105 (7): v1.0.x chưa nhận 0 lúc tạo đơn. Câu tại ô là thẻ UXD PR82-04 | Đạt |
    | F. Đơn đã gõ đủ, thêm 1 đêm (unit) | Đêm mới trống, nhãn "–", bị chặn, 0 POST | **Đỏ:** gửi đơn |
    | a. Stack: Nội bộ 2 đêm, gõ đêm 1 = 500.000 | Bị chặn, 0 POST, ô vẫn giữ 500000. Đạt 2 lượt | **Đỏ:** 201, máy chủ ghi 0 đ `complimentary` cả 2 đêm, tổng 0 (mất 500.000). Đạt nghĩa là tái hiện đúng lỗi, 2 lượt |
    | b. Stack: gõ đủ 500.000 × 2 | 201. Yêu cầu có 2 đêm `edited:true`. Máy chủ ghi `[500000, 500000]`, nguồn `manual`, tổng 1.000.000 | Phần tiền như bản sửa; nhãn đỏ |
    | c, d. Stack: để trống hết; gõ rồi xóa | 201, không có `nightlyRates`, `[0, 0]` `complimentary`, tổng 0 | Như bản sửa |
    | e. Stack, đối chứng OTA: gõ 1 trong 2 đêm | Bị chặn bằng câu "Nhập giá mỗi đêm (lớn hơn 0).", 0 POST | Như bản sửa (luật OTA có từ #70) |

  - Nhãn cột "Nguồn giá" so với bảng UXD (`UXD-on-v104-src-typed.md` mục 2, lượt 2 và 3):

    | Dòng của bảng UXD | Kết quả |
    |---|---|
    | Ô có số lễ tân đã gõ → "Giá đã gõ", kể cả khi đang chờ bản xem | Đạt: Trực tiếp, OTA, Nội bộ. Gõ lại đúng số niêm yết vẫn là "Giá đã gõ" và gửi `edited:true` cho đêm đó, đêm kia `edited:false`. Trên stack, khi `page.route` giữ bản xem: "Giá đã gõ", ô giữ 880000 |
    | Ô trống → "–" (đã xóa; đang chờ bản xem; OTA hay Nội bộ chưa gõ) | Đạt ở cả ba trường hợp |
    | Ô điền từ bản xem của lượt ở đang hiện → "Giá niêm yết (BR-101)" | Đạt. Đêm thứ Sáu, thứ Bảy trên stack: 0 nhãn "+15%". Mã cũ hiện "Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104)" cạnh cùng số |
    | Chờ bản xem: `aria-busy` ở `.rate-table` và bảng tổng; tiền phòng, Tổng tiền đơn và Cọc cần thu hiện "–" | Đạt. Cho 2 → 3 đêm, giữ bản xem: cả hai bảng có `aria-busy="true"`, đêm 2 và 3 hiện "–", Tổng hiện "–", nút Tạo đơn bận. Nhả bản xem thì gỡ hẳn thuộc tính (không để lại `"false"`), đêm 2 và 3 hiện "Giá niêm yết", Tổng 2.583.000 đ. Mã cũ: không có `aria-busy`, Tổng vẫn 880.000 đ của lượt trước |
    | Nội bộ → Trực tiếp sau khi gõ (ARC-03) | Câu "Đã xóa giá đã gõ vì đổi kênh." hiện; nhãn về "Giá niêm yết" khi bản xem về |

  - Hồi quy:
    - admin-web cả bộ 84 tệp: 957/957, trong đó 947 ca của dự án và 10 ca tạm của QA. FE `v104-rate-source-typed` 6/6, `v104-booking-rate-carryover` 30/30.
    - `typecheck` admin-web sạch. ESLint và Prettier sạch trên 3 tệp đổi. `gen_strings.py` không ra diff.
    - E2E trên stack: `rack-booking.smoke` 5/5 (2 ca bỏ qua có sẵn).
  - Điều kiện gộp:
    - `git merge-tree` với `main` @ `8c29a64f`: xung đột ở `strings-vi.json`, `strings-en.json`, `strings.js`, đều là tệp sinh ra. FE gộp `main` vào nhánh rồi chạy lại `gen_strings.py`.
    - Sau đó CI xanh. Nếu có commit mới, kể cả thẻ UXD PR82-03 (chữ EN) và PR82-04, QA chạy lại ca A0–F và a–e.
  - Thấy thêm, không ghi lỗi mới:
    - Đơn Nội bộ có thu (ca b) vẫn có `is_complimentary = true` ở đơn và ở từng đêm, dù đêm 500.000. Đây là BUG-R4-043 (P2, v1.0.5), không do #82, không đổi tiền folio.
    - Ô gõ 0 của đơn Nội bộ báo "Nhập giá mỗi đêm (lớn hơn 0)." (ca E). Đã có thẻ UXD FB-R4-UXD-FE-PR82-04 (Minor). Không sai tiền vì không có POST.
  - **Kết luận: ĐẠT.**
- **Vai chịu trách nhiệm:** FE sửa trong #82; DOM chốt luật; UXD cấp câu riêng cho Nội bộ (đã có, `booking.error.rate_empty_internal`); ARC xem; BA sổ tay (cách ghi đêm miễn phí trong đơn có thu).
- **Trạng thái:** **Đã sửa – chờ gộp #82** (QA3 xác nhận 05/11 02:00 ở head `0e48686c`). Mức vẫn **P0** tới khi gộp và đạt STG.
  - Trước đó: Mới – FE sửa trong #82. Theo thẻ ARC, #82 không vào bản phát hành nếu thiếu bản sửa này.
  - 05/11 01:40: ORC nhận mức **P0** (mức lỗi do QA quyết). ARC đề xuất P2.
  - Đường xử lý như BUG-R4-037 cách A: bản sửa đi cùng v1.0.4 trong #82, không làm bản v1.0.3.1 riêng. Cách làm tạm cho lễ tân đã gửi INV.
  - Điều kiện gộp: gộp `main` vào nhánh, sinh lại chữ bằng `gen_strings.py`, CI xanh. ARC lượt 3 ĐẠT CÓ ĐK, UXD lượt 3 ĐẠT.
  - Sau khi gộp: CI chạy 2 ca của FE; RG-27 trên STG 07/11.
  - Còn mở ngoài bản sửa: rà dữ liệu production theo mục "Ảnh hưởng production" (ORC quyết).
  - Production (v1.0.3) vẫn có lỗi tới khi phát hành v1.0.4.

### BUG-R4-047 – Trả phòng: Quay lại bước ① rồi bấm Tiếp tục cho tủ vừa đếm lần đầu thì nhận 409, câu "Tủ vừa được bổ sung…"
- **Mức:** **P2** (QA3 chốt 05/11).
  - **Không sai tiền.** Lệnh 409 không ghi gì. Trang đọc lại bản chuẩn, số điền sẵn là số vừa đếm. Bấm **Tiếp tục** lần nữa thì nhận 201, folio đúng (35.000 một dòng, ở R2 và R3).
  - **UX gây nhầm, có cách khắc phục.**
    - Câu nêu lý do sai: không ai nạp tủ.
    - Theo mã, số lễ tân sửa sau khi quay lại bị bỏ (bản chuẩn đọc lại), nên phải gõ lại.
  - **Không do #81.** Mã cũ cho kết quả như nhau (R3 trên `7f0ef3fb`). Tag v1.0.1–v1.0.3 có cùng đường:
    - lần đếm đầu ghi kỳ `check_in`;
    - Desk không đọc lại bản chuẩn khi đổi bước.
  - Xảy ra với mọi tủ chưa từng nạp trong lượt, thường là tủ căn đang ở, vì nhận phòng không ghi kỳ. Lỗi lặp lại mỗi lần lễ tân quay lại bước ① rồi bấm Tiếp tục.
  - Mock MSW không ghi kỳ ở lần đếm đầu, nên unit không bắt được (ca B của QA xanh).
- **Môi trường:**
  - Stack `ottimo-qa81`: #81 @ `054d40c0`, và đối chứng bằng image web với `CheckOutPage.tsx` của `7f0ef3fb`.
  - Desk Chromium, project `desk-clock`, seed DS-E. Ca R2, R3 của spec tạm.
- **Liên quan:**
  - `minibar.service.ts` `record()`: `assertPeriod`, và `registerFridge` (tủ chưa từng nạp được ghi kỳ `check_in` ở lần đếm đầu);
  - `CheckOutPage.tsx`: `std` (`useResource` theo `countingRoomId`, không đọc lại khi đổi bước), nhánh `MINIBAR_PERIOD_CHANGED` của `saveMinibar`;
  - khóa `co.minibar_period_changed_title` / `_body`;
  - ARC 16.16 bổ sung 2 (ab), 16.19 (ac); G-FE-042-1.
- **Các bước tái hiện** (R3):
  1. Lượt 1 đêm căn 203, không B14. Ngày đi lúc 09:00.
  2. H16: bia dùng 1, bấm **Tiếp tục**: 201, `periodId: null`.
  3. Ở bước ②, bấm **Quay lại**, rồi **Tiếp tục**.
- **Thực tế:**
  - Lệnh thứ hai nhận 409 `MINIBAR_PERIOD_CHANGED`.
  - Desk hiện "Số đếm chưa được lưu" – "Tủ vừa được bổ sung hoặc lượt ở vừa thay đổi trong lúc đếm, nên số vừa nhập chưa được lưu. Đếm lại tủ rồi lưu." Desk đọc lại bản chuẩn.
  - Bấm **Tiếp tục** lần nữa: 201 (có `periodId`), sang bước ②. Folio minibar 35.000 một dòng.
  - R2 (sau B14, tủ căn đang ở 101) cho cùng kết quả.
- **Mong đợi:**
  - Quay lại bước ① rồi Tiếp tục với cùng số thì sang bước ② không lỗi, hoặc lưu lại theo R6.
  - Không có câu nói tủ vừa được nạp khi không có ai nạp.
- **Gợi ý sửa** (FE quyết, ARC xem):
  - sau mỗi lần đếm 201, hoặc khi quay về bước ①, đọc lại bản chuẩn của tủ đang hiện (để có `periodId` mới, `latestCheck` là lần vừa đếm). Giữ số lễ tân đã sửa nếu vẫn cùng kỳ;
  - hoặc lấy `periodId` từ phản hồi 201.
- **Test chống tái phát:**
  - ca R3 (E2E, máy chủ thật);
  - sửa mock MSW cho khớp `registerFridge` để unit bắt được;
  - Ca hồi quy: TC-V104-RG-28 (test case bản 0.9).
- **Bằng chứng:** `qa81/e2e-pr-final/data.txt`, `qa81/e2e-old2/data.txt`, spec tạm `qa81/tests/zz-qa81-race.spec.ts` (scratchpad, không commit, dữ liệu giả). Trace đã xóa.
- **Vai chịu trách nhiệm:** FE-A sửa; ARC xem; UXD xem câu; FE/BE sửa mock.
- **Trạng thái:** Mới. Không chặn #81. Đề xuất dời v1.0.5 có kế hoạch; ORC quyết.
  - **Cập nhật 05/11 02:30 (QA3): đã sửa ở #83, head cũ `19cfa3f7` đạt; chờ head mới.** Khi quay về bước ①, Desk đọc lại bản chuẩn của tủ đang hiện.
    - E2E trên máy chủ thật, 3 lượt:
      - R2 (sau B14, tủ căn đang ở 101): lần đếm thứ ba nhận 201, có `periodId`;
      - R3: lệnh đếm lại nhận 201, có `periodId`, không có câu "Số đếm chưa được lưu";
      - R4 (Quay lại, sửa thành bia dùng 2): nhận 201, folio minibar 70.000 một dòng.
    - Đối chứng `main` @ `53500bcd`:
      - R2, R3, R4 nhận 409 `MINIBAR_PERIOD_CHANGED` và hiện câu "Số đếm chưa được lưu";
      - ở R4, số bia dùng 2 lễ tân đã sửa bị đọc lại về 35.000, nên phải gõ lại.
    - RG-28 không còn N/A nếu #83 gộp trong v1.0.4.
  - **Cập nhật 05/11 02:50 (QA3): ĐẠT ở head mới `e411cb22`. Trạng thái: Đã sửa – chờ gộp #83.** R2, R3, R4 đạt 3/3 lượt: đếm lại nhận 201 có `periodId`, không có câu "Số đếm chưa được lưu"; R4: folio 70.000. Đóng khi #83 gộp và RG-28 đạt.

### BUG-R4-048 – Trả phòng (#83): sau 409 `MINIBAR_NOT_CHECKED`, số lễ tân gõ ở bước ① trước khi bản tóm tắt về bị đặt lại về số chuẩn; folio thiếu tiền minibar
- **Mức:** **P0** (QA3 chốt 05/11 02:30). Thẻ ARC FB-R4-ARC-FE-PR83-01 ghi Major.
  - **Sai tiền, không báo.**
    - Lễ tân gõ bia dùng 1 (35.000). Bảng về số chuẩn, cột Tiền về 0.
    - **Tiếp tục** ghi tủ đủ. Folio không có dòng minibar.
    - Theo `test-strategy.md` mục 8, lỗi tiền mặc định P0.
  - **Không hiếm khi mạng chậm.** Câu lỗi B18 bảo "Làm bước 1", và lễ tân làm đúng như vậy. Chỉ cần bản tóm tắt đọc lại sau 409 về chậm hơn lúc lễ tân gõ.
  - **Chỉ có trên nhánh #83** @ `19cfa3f7`, do phần sửa BUG-R4-045 sinh ra. Chưa vào `main`, không có ở production.
  - Trên `main` @ `53500bcd`, đường này không tới được. Sau 409, trang đứng ở bước ③, và bước ① không đưa 202 (ngõ cụt của 045). Lễ tân bị chặn, nhưng không sai tiền.
- **Môi trường:**
  - Stack `ottimo-qa83` với #83 @ `19cfa3f7`. Đối chứng bằng image web có `CheckOutPage.tsx` của `main` @ `53500bcd`.
  - Desk Chromium, project `desk-clock`, seed DS-E.
  - Ca R6 của spec tạm `zz-qa83-race.spec.ts`; bản tóm tắt được giữ bằng `page.route`.
- **Liên quan:**
  - `product/apps/admin-web/src/pages/stay/CheckOutPage.tsx` @ `19cfa3f7`. Nhánh B18 `MINIBAR_NOT_CHECKED` gọi `setMinibarResync(true)`.
  - Effect `minibarResync` chạy khi bản tóm tắt mới về, kể cả khi trang đã ở bước ①: `minibarAct.reset()`, `std.reload()` khi tủ đã ở trên màn hình, `setCabinet`, `setStep(0)`.
  - `rounds/round-04/reviews/ARC-on-v104-pr83-minibar-followup.md` (thẻ PR83-01, kịch bản unit S2a); BUG-R4-045; BUG-R4-042.
- **Các bước tái hiện** (R6, máy chủ thật):
  1. Lượt có B14 202 → 101 (cùng nhóm) ngày D+1, ngày đi D+2 lúc 09:00. Tủ 202 chưa đếm.
  2. Giữ `GET …/checkout-summary` từ lúc mở H16.
  3. Tủ hiện là 101. Bấm **Tiếp tục**: 201. Nhả bản tóm tắt.
  4. Sang Bill. **Giữ lại** bản tóm tắt, rồi bấm **Hoàn tất**: 409 `MINIBAR_NOT_CHECKED`.
  5. Bấm **Quay lại** 2 lần, về bước ①. Nhóm chọn tủ có "Căn 202 (đã chuyển đi)" và "Căn 101 (đang ở)".
  6. Chọn 202. Bia: bấm **Giảm** 1 lần (dùng 1, cột Tiền 35.000).
  7. Nhả bản tóm tắt, rồi bấm **Tiếp tục**.
- **Thực tế** (`19cfa3f7`, 3/3 lượt):
  - Sau bước 7, Desk gọi lại `GET …/minibar-standard` của 202 một lần. Ô bia về 2/2, cột Tiền 0, không có câu báo.
  - Lệnh đếm 202 nhận 201 với bia `remainingQty: 2`, tức là số chuẩn.
  - Folio trước B18: minibar `[]`, Còn phải thu 0. Thiếu 35.000.
- **Mong đợi:**
  - Số lễ tân gõ sau khi trang về bước ① được giữ.
  - Bản tóm tắt về sau đó không đặt lại số đang gõ, và không đổi tủ dưới tay lễ tân. Nếu cần báo tủ khác phải đếm, Desk chỉ thêm tủ đó vào nhóm chọn.
  - Folio có dòng minibar 35.000.
- **Gợi ý sửa** (FE quyết, ARC xem):
  - ARC đề xuất thêm `if (step === 0) return;` ngay sau `setMinibarResync(false)`;
  - hoặc chỉ resync khi trang chưa ở bước ①, hoặc khi lễ tân chưa sửa ô nào.
- **Test chống tái phát:**
  - E2E R6, chạy trên máy chủ thật với bản tóm tắt bị giữ;
  - ca unit S2a của ARC;
  - TC-V104-RG-29 (test case bản 0.10).
  - R1–R5 và 12 ca của FE vẫn phải xanh.
- **Bằng chứng:** `qa83out/e2e-r6b/data.txt`, `e2e-r6c/data.txt`, `e2e-r6d/data.txt`, và đối chứng `e2e-r6main/data.txt`. Các tệp nằm ở scratchpad, không commit, dữ liệu giả. Trace tắt.
- **Vai chịu trách nhiệm:** FE-A sửa, cùng lần gộp `main`. ARC xem.
- **Trạng thái:** **Đã gộp `main` `0df6a67b` (#83, 05/11)** – trước đó: Đã sửa (QA3 ĐẠT 05/11 02:50 ở head `e411cb22`). Không còn chặn #83.
  - Trước đó: Mới, chặn gộp #83 (05/11 02:30, head `19cfa3f7`).
  - Bản sửa của FE: effect `minibarResync` dừng khi trang đã ở bước ① (`if (step === 0) return;`). Tủ đang hiện không bị đổi, cũng không đọc lại. Tủ còn phải đếm được đưa vào nhóm chọn tủ và có tên trên nút chính.
  - **Xác minh ở `e411cb22`:**
    - E2E R6 xanh 3/3 lượt. Ô bia giữ 35.000, không đọc lại bản chuẩn, lệnh đếm 202 có bia `remainingQty` 1, folio minibar 35.000.
    - E2E R7 (nhánh thứ hai: lễ tân ở lại tủ 101 và gõ ở đó) xanh 3/3 lượt.
      - Số gõ giữ nguyên, tủ không đổi, nút ghi "Tiếp tục: Tủ căn 202".
      - Đếm lại 101 nhận 201, rồi đếm 202 nhận 201.
      - B18 nhận 200, folio minibar 35.000.
    - Unit S2a và N7 của FE đạt. Thay `CheckOutPage.tsx` bằng bản `19cfa3f7` thì S2a đỏ.
    - R1–R5, ca A–E của QA, 14 ca của FE và bộ H16 23/23 đều xanh.
  - Lỗi chưa từng vào `main`, nên không có ở production và không cần STG riêng. Đóng khi #83 gộp.
  - Bằng chứng thêm: `qa83out/e2e-new1`, `e2e-new2`, `e2e-new3` (`data.txt`), `qa83out/logs/unit-fea-oldpage.txt` (scratchpad, không commit, dữ liệu giả).

---

### BUG-R4-049 – Nhận phòng (H13), đơn chưa gán căn: dòng "Buồng sẵn sàng" vẫn in "Căn · VC · Đã dọn, chờ kiểm"
- **Mức:** P3 (QA2 chốt 05/11 03:00). Đây là một dòng phụ có chữ gây hiểu nhầm; luồng không sai:
  - Desk vẫn chặn nhận phòng, cả `not_unassigned` lẫn `room_ready` đều "Còn thiếu".
  - Dòng "Đơn đã được gán căn" ngay trên nói rõ phải gán căn trước.
  - Không sai tiền, không đổi dữ liệu, không lộ dữ liệu.
  - **Nâng P2 nếu** thấy lễ tân hiểu "VC" là căn đã sẵn sàng rồi làm sai, ví dụ khi UXR hay INV dùng thử.
- **Môi trường:** #77 @ `055e92d5` trên `main` `f9ff4e1f`, stack local dùng một lần `ottimo-qa2p77`, seed DS-E, ngày ảo năm 2030. Thấy ở ca D5 và D6 khi xác minh #77 (mục BUG-R4-039).
- **Các bước tái hiện:**
  1. Tạo đơn OTA (Airbnb) cho một căn đã có đơn khác cùng đêm, kèm `allowUnassigned`. Đơn nằm ở làn chưa gán căn (`conflictState: open`).
  2. Đến ngày đến, `qa.fd` mở H13 Nhận phòng của đơn này.
- **Thực tế:**
  - Dòng "Buồng sẵn sàng (VI hoặc VC)" có dòng phụ "Căn · VC · Đã dọn, chờ kiểm": số căn để trống, trạng thái `VC`, kèm chip "Còn thiếu".
  - Gốc: `checkin.service.ts` (dòng 264–266 ở `055e92d5`) trả `roomStatus: 'VC'` ở mức trên của bản xem trước khi đơn không có căn. Đây là giá trị lấp chỗ, vì hợp đồng để `roomStatus` bắt buộc.
  - `CheckInPage.tsx`, hàm `condDetail`, luôn in `ci.cond_room` với trạng thái lấy từ `roomStatus`.
  - #74 đã bỏ `detail` của `room_ready` cho ca này, nhưng không chạm `roomStatus`. #77 đúng khi không in câu chặn, và không đổi dòng phụ.
  - `ci.cond_room` và nhánh `'VC'` có ở `main` trước #77 (từ Sprint 3), nên lỗi **đang ở production**. Không do #77.
- **Mong đợi:** đơn chưa có căn thì dòng buồng không in số căn và trạng thái, hoặc in một câu như "Chưa gán căn" (UXD chọn câu). Không hiện trạng thái của một căn không có.
- **Đề xuất sửa:**
  - FE: `condDetail` không in `ci.cond_room` khi đơn chưa có căn. Dùng cùng điều kiện `hasRoom` mà #77 đã dùng cho `roomBlockedMessage` (`not_unassigned` đạt và có số căn). Khoảng 1 dòng mã và 1 unit.
  - Cách triệt để (ARC chọn, v1.0.5): bản xem trước để trống `roomStatus` khi không có căn. Cách này đổi hợp đồng.
- **Test chống tái phát:** unit H13 cho đơn chưa gán căn: dòng buồng không có "Căn ·" và không có trạng thái buồng. E2E như ý (e) của TC-V104-RG-30.
- **Vai chịu trách nhiệm:** FE-A sửa; UXD nếu đổi câu; ARC nếu bỏ `roomStatus` ở hợp đồng. QA chạy lại.
- **Cùng loại – dòng phụ `ci.cond_capacity_ok` (ghi chú của FE ở #84, thẻ UXD FB-R4-UXD-FE-PR84-01).**
  - Đơn chưa có căn thì máy chủ trả `capacity_within_max` đạt. Desk in thêm dòng phụ "{n} khách · căn {room} tối đa {max}" với số căn trống và `max` là "–", ví dụ "2 khách · căn  tối đa –".
  - QA2 coi đây là lỗi, cùng gốc và cùng mức P3 với lỗi trên. Đã sửa trong cùng #84, nên ghi vào mục này, không cấp số mới.
- **Xác minh bản sửa – PR #84 `v104/fe-polish-049` (QA2, 05/11 03:35).**
  - Bản thử:
    - Head `3fa3428f`, base `main` `e99eba55` (đã có #77, #79, #82). Head này chỉ ẩn `ci.cond_room`.
    - Rồi head `7c7eaadb`. FE-A ẩn thêm `ci.cond_capacity_ok` khi không có căn (`c.met && hasRoom`), và thêm ý vào unit 049.
    - `main` sau đó lên `a35a5625`, nhưng chỉ đổi tài liệu, không đổi `product/`. #84 gộp vào `main` mới không xung đột.
    - Stack local dùng một lần `ottimo-qa2p84` (postgres, api, web), seed DS-E, `CLOCK_MODE=mutable`. Image web dựng lại ở `7c7eaadb`. Máy chủ không đổi so với `main`.
    - Desk Chromium 1366×768, `vi-VN`. Test tạm `zz-qa2-pr84.spec.ts`, xóa cùng worktree. Đã dọn stack, image và worktree.

    | Ca | Dựng | Kết quả ở `7c7eaadb` |
    |---|---|---|
    | N1 – đơn chưa gán căn | Đơn OTA ở làn chưa gán căn. API: `roomStatus:"VC"`, `not_unassigned` chưa đạt, `capacity_within_max` đạt | Dòng buồng chỉ còn "Buồng sẵn sàng (VI hoặc VC) · Còn thiếu". Không có "Căn ·", không có trạng thái buồng nào. Dòng sức chứa chỉ còn "Số khách không vượt sức chứa căn · Đã đủ", không có "… khách · căn  tối đa –". Dòng "Đơn đã được gán căn" vẫn báo "Đơn chưa được gán căn (xung đột OTA). …". Trên bước đang hiện, không còn chữ hay nút nào ghi số căn trống |
    | N2 – đối chứng, căn `VC` | Đơn Trực tiếp căn 202, sạch | Dòng buồng đúng nguyên câu "Căn 202 · VC · Đã dọn, chờ kiểm", chip "Đã đủ". Dòng sức chứa "2 khách · căn 202 tối đa 3". Y như trước |
    | N2 – đối chứng, căn `VD` | Đơn Trực tiếp căn 203, trạng thái `VD` | "Căn 203 · VD · Trống, cần dọn", kèm câu ngoại lệ `checkin.room_not_ready` và ô Lý do như cũ. Dòng sức chứa "2 khách · căn 203 tối đa 3" |

  - Đối chứng bằng unit:
    - `bug-r4-049-fea` của head `7c7eaadb`, chạy với `CheckInPage.tsx` của `e99eba55` (trước #84): ca chưa gán căn đỏ.
    - Cùng tệp test, chạy với trang của `3fa3428f` (chưa ẩn dòng sức chứa): cũng đỏ.
    - Trên head mới: 2/2 xanh. Trên `main` có #77, ca D5 của lượt kiểm #77 đã cho thấy "Căn · VC · …".
  - Ca chỉ thêm test cho ARC-PR82-05 (Trực tiếp gõ 0 → `rate_empty`, không có POST): xanh.
    - Đột biến Z1 (câu Nội bộ cho mọi kênh): đỏ.
    - Đột biến Z3 (bỏ phép thử ≤ 0): đỏ.
    - QA2 tự làm lại cả hai đột biến, rồi trả mã về như cũ.
  - Hồi quy:
    - `typecheck` và ESLint sạch ở 3 tệp đổi;
    - unit admin-web toàn bộ 970/970 (87 tệp) ở cả `3fa3428f` và `7c7eaadb`; 10 tệp unit nhận phòng và đặt phòng 129/129;
    - E2E `checkin.s3.api`: 19 đạt, 2 bỏ qua có chủ đích (mã cửa);
    - E2E `checkin.s3.clock` 32/32;
    - UI `stay-money.s4` + `gate-s4` (TC-L3-079, 081, 082, 085…) 7/7, `stay.h13-h17` 6/6;
    - test tạm Desk của #77 (D1–D6, cả API cũ) đạt. Câu chặn của BUG-R4-039 không đổi.
  - Lúc QA kiểm (03:34), CI của #84 còn chạy job `format · lint · audit · test · build`. Các job khác đã xanh.
  - **Kết luận: ĐẠT** ở `7c7eaadb`.
  - Bằng chứng (scratchpad, không commit, dữ liệu giả): `qa2-pr84-out/e2e-n2/data.txt`, `e2e-api`, `e2e-clock`, `e2e-uiclock`, `e2e-ui`, `e2e-p77`, `vitest-all2.log`, `vitest-049-on-*.log`, `mut-z1.log`, `mut-z3.log`, `zz-qa2-pr84.spec.ts.bak`.
- **Trạng thái:** **Đã gộp `main` `a9da6be4` (#84, 05/11)** – trước đó: Đã sửa (QA2 ĐẠT ở `7c7eaadb`). Gộp khi CI xanh. Sau đó chạy RG-30 (e) trên STG nếu có đơn OTA chưa gán căn.
  - Trước đó: Mới. Không chặn #77.

### BUG-R4-050 – Trả phòng sau 24:00 của ngày đi: VietQR bị từ chối và giá đêm thêm đã sửa không tính lại được, vì Desk lấy ngày đi của đơn làm ngày của giờ trả
- **Mức:** P2 (QA2 chốt 05/11 05:00; DOM đề xuất P2 vì nghi sai tiền).
  - Không sai tiền. B18 của Desk gửi `checkoutTime`, nên máy chủ vẫn đòi 1 đêm thêm (BR-416). Máy chủ cũng không nhận thu quá số phải thu.
  - Nhưng ca này có thật ở OTTIMO (xe đêm Đà Lạt – Sài Gòn 22:00–01:00). Khi đó:
    - cách thu mặc định của H16 (VietQR) hỏng, câu lỗi bảo "giảm về đúng số còn phải thu" mà không có số nào giảm được;
    - nếu sửa giá đêm thêm, Bill hiện sai số cần thu, và Hoàn tất bị chặn.
  - Có đường vòng: thu tiền mặt hoặc thẻ POS theo giá gợi ý.
  - **Nâng P1 nếu** khách không có tiền mặt hay thẻ, mà quầy chỉ nhận chuyển khoản lúc nửa đêm.
- **Môi trường:** `main` @ `c6b2f78e`, stack local dùng một lần `ottimo-qa2d72` (`CLOCK_MODE=mutable`), seed DS-E, ngày ảo năm 2029, `business_day_rollover` 06:00, giờ trả chuẩn 12:00. Desk Chromium, `qa.fd`. Test tạm `zz-qa2-dom72.spec.ts` (I1, I1b), xóa cùng worktree.
- **Các bước tái hiện:**
  1. Đơn Trực tiếp 1 đêm, ngày đến D, ngày đi D+1, đã thu đủ tiền phòng. Nhận phòng D 14:00.
  2. Đồng hồ D+2 00:20 (ngày làm việc vẫn là D+1 = ngày đi, nên đơn còn nút Trả phòng). `qa.fd` mở Trả phòng.
  3. Bước Minibar: không dùng gì. Bước Phụ phí: giờ điền sẵn "00:20". Desk hiện hộp "Trả sau mốc trả muộn" với đêm thêm theo giá gợi ý (căn 203: 792.000 đ; căn 201: 708.000 đ).
  4. (a) Căn 203. Bước Bill, cách thu mặc định **VietQR**: bấm "Tạo VietQR · 792.000 đ".
  5. (b) Căn 201, lượt khác. Ở bước Phụ phí, sửa **Giá đêm thêm** từ 708.000 thành 600.000. Sang Bill, thu tiền mặt đúng số Bill hiện, bấm Hoàn tất.
- **Thực tế:**
  - (a) Desk gửi `createVietQr` với `checkoutAt: "<D+1>T00:20:00+07:00"`, tức 00:20 **ngày đi**. Máy chủ trả 422 `AMOUNT_EXCEEDS_BALANCE`, `max: 0`. Desk báo "Số tiền lớn hơn số còn phải thu. Giảm về đúng số còn phải thu."
  - (b) Lệnh dò giá của Desk gửi `checkoutAt` 00:20 ngày đi + `extraNightRateVnd: 600000`. Máy chủ trả 422 `extraNightRateVnd NOT_ALLOWED`, vì ở 00:20 ngày đi không có đêm thêm.
    - Desk báo "Chưa tính được số cần thu theo giá này…".
    - Bill ghi dòng "Đêm thêm … 600.000" nhưng "Còn phải thu 708.000 đ".
    - Thu tiền mặt 708.000, rồi Hoàn tất: B18 422 `finalPayment.amountVnd AMOUNT_EXCEEDS_BALANCE`, `max: 600000`. Câu lỗi như (a). Đơn vẫn Đang ở.
  - Phần đúng:
    - B18 của Desk gửi `{checkoutTime:"00:20", extraNight:{}, finalPayment:{cash 792.000}}`. Kết quả 200. Folio có dòng `extra_night` đêm D+1, ngày đi thành D+2.
    - Thiếu `extraNight` thì 422 `LATE_CHECKOUT_AFTER_LIMIT`. Desk không đòi ghi chú giờ.
    - Bản tóm tắt theo `checkoutTime=00:20` và theo thời điểm thật (`checkoutAt` = 00:20 ngày D+2) đều ra `extraNightRequired: true`, 708.000. VietQR theo thời điểm thật hay theo đồng hồ máy chủ: trần đúng 708.000.
  - Gốc:
    - `CheckOutPage.tsx` dựng `` `${r.departureDate}T${hhmm}:00+07:00` `` ở lệnh dò giá (509–511) và ở `PaymentPanel` (1788–1790).
    - Máy chủ (`checkout.service.ts`, `postMidnight`, 653–663): 00:20 ngày đi có ngày làm việc = ngày đi − 1 và ngày lịch = ngày đi. Đó là cửa sổ sau nửa đêm hợp lệ, nên không phụ thu, không đêm thêm, trần QR 0 đ.
- **Về điều DOM nghi (máy chủ nhận, không tính đêm thêm):**
  - Qua Desk thì **không** xảy ra, vì B18 của Desk không gửi `checkoutAt`.
  - Qua API thì xảy ra. B18 `{checkoutTime:"00:20", checkoutAt:"<D+1>T00:20+07:00"}` nhận 422 `TIME_NOTE_REQUIRED`. Thêm `checkoutTimeNote` thì 200: không đêm thêm, không phụ thu, ngày đi giữ D+1.
  - Đây là đường ghi lùi giờ có ghi chú (E03-07), đúng hợp đồng nếu khách rời thật lúc 00:20 ngày đi. Không ghi thành lỗi riêng.
  - Khi sửa lỗi này, FE **không** được đem `checkoutAt` ngày đi vào B18. ARC cân nhắc chặn ghi lùi quá xa so với lúc bấm.
- **v1.0.3 (production): có cùng lỗi.** Căn cứ là mã, không chạy stack v1.0.3:
  - `CheckOutPage.tsx` ở tag `v1.0.3` có cùng cách dựng ở dòng 357–358 và 1477–1478. B18 gửi `checkoutTime` ở dòng 664.
  - `postMidnight`, `departure`, `amountDueForQr` của `checkout.service.ts` giống `c6b2f78e`. Diff `v1.0.3..c6b2f78e` của tệp này chỉ chạm nhánh đêm miễn phí Nội bộ (BUG-R4-038).
- **Mong đợi** (sửa 05/11 05:30 theo quy tắc ARC, `ARC-on-v104-bug050-rule.md` mục 1 và 6). Hướng DOM ở bản trước ("thời điểm gần nhất không muộn hơn lúc bấm") đã bỏ.
  - Desk dựng thời điểm theo **trục ngày làm việc của lúc bấm**, như cách máy chủ đọc `checkoutTime`. Giờ gõ trước mốc đổi ngày → ngày làm việc + 1. Giờ khác → ngày làm việc.
  - Thời điểm nằm ngoài `[ngày đi của lượt 00:00, ngày đi của lượt + 1 lúc mốc)` thì Desk không gửi `checkoutAt`. "Ngày đi của lượt" là `stayDepartureDate` nếu lượt được gia hạn bằng đơn con, nếu không là `departureDate`.
  - Ví dụ, với ngày đi D+1:
    - 00:20 bấm lúc 00:20 ngày D+2 → `<D+2>T00:20`;
    - gõ 00:25 lúc 00:20 ngày D+2 → `<D+2>T00:25`;
    - gõ 00:05 lúc 23:55 ngày D+1 → `<D+2>T00:05`;
    - **gõ 04:30 lúc 06:10 ngày D+1 → `<D+2>T04:30`**, cùng cách đọc với bản tóm tắt và B18. Ca #68 này thuộc BUG-R4-051.
  - Lệnh dò giá và VietQR dùng chung thời điểm này. B18 giữ `checkoutTime`.
  - VietQR có trần 792.000. Giá đêm thêm đã sửa thì Bill hiện số theo giá đó.
- **Đề xuất sửa:**
  - FE-A: một hàm `checkoutInstant(departureDate, hhmm, now, rollover)` thay cho 2 chỗ dựng chuỗi, kèm unit cho các ca:
    - 00:20 lúc 00:20 D+2;
    - 23:50 lúc 00:20 D+2;
    - 04:30 lúc 06:10 ngày đi (theo ARC: `<ngày đi + 1>T04:30`);
    - 01:00 lúc 01:00 ngày đi (cửa sổ sau nửa đêm hợp lệ, phải giữ D);
    - giờ ban ngày.
  - ARC: xác nhận quy tắc chọn ngày. Nếu muốn đơn giản hơn, máy chủ có thể nhận `checkoutTime` cho `createVietQr`, như B18 và bản tóm tắt; cách này đổi hợp đồng.
  - BA (tạm, tới khi sửa): sổ tay dặn "Trả phòng sau 24:00 của ngày đi: thu tiền mặt hoặc thẻ POS, không dùng VietQR, không sửa giá đêm thêm". Câu của DOM ("làm Trả phòng trước 24:00") cũng tránh được lỗi, nhưng giờ trả ghi sớm hơn giờ khách rời.
- **Test chống tái phát:** unit cho hàm trên. E2E desk-clock theo TC-V104-RG-31 (a)–(c).
- **Bằng chứng** (scratchpad, không commit, dữ liệu giả): `qa2-dom72-out/e2e-i1/data.txt`, `e2e-i1b/data.txt`, `zz-qa2-dom72.spec.ts.bak`.
- **Xác minh bản sửa – PR #86 `v104/fe-checkout-after-midnight` (QA2 05/11 05:30):**
  - Môi trường: worktree tạm, stack local dùng một lần `ottimo-qa2p86` (`CLOCK_MODE=mutable`, seed DS-E, ngày ảo năm 2029, mốc 06:00, giờ trả chuẩn 12:00), Desk Chromium 1366×768, `qa.fd`. PR chỉ đổi 3 tệp admin-web, nên máy chủ là mã `main`. Đã dọn stack, image, worktree.
  - **Head `9010e65f` (base `main` `585cf0ba`): dừng, không kết luận.** ARC KHÔNG ĐẠT (FB-R4-ARC-FE-PR86-01, quy tắc chọn ngày), và ORC báo dừng. Tới lúc đó QA2 chỉ chạy unit: admin-web 986/986.
  - **Head `45d2cfed`: ĐẠT.**
  - Unit:
    - bảng U1–U12 của ARC, chép thành test tạm của QA2: 19/19. Thêm 3 ca biên: mốc dạng `'06:00:00'`; 00:00 với ngày làm việc D → `DT00:00`; 23:59 với ngày làm việc D → không gửi;
    - tệp FE `bug-r4-050-fea` cùng test tạm: 33/33. Toàn bộ admin-web: 1012/1012 (89 tệp). `tsc` và ESLint sạch;
    - thử đột biến: bỏ nhánh `hhmm < mốc → +1` thì 9 ca đỏ (gồm 2 ca trang). Bỏ kiểm biên thì U8, U11 đỏ. Đưa `CheckOutPage.tsx` về `585cf0ba` thì 2 ca trang đỏ.
  - E2E Desk, đồng hồ giả. QA2 ghi mọi POST `…/vietqr`, `…/confirm-received`, `…/actions/check-out`.

    | Ca | Đồng hồ / giờ gõ | `checkoutAt` của VietQR | Bill, B18, folio |
    |---|---|---|---|
    | RG-31 (a), U1 | ngày đi + 1, 00:20 / điền sẵn 00:20 | `<ngày đi+1>T00:20` | QR 201, 792.000. Ghi nhận 200. B18 `{checkoutTime:"00:20", extraNight:{}}` → 200. Folio `extra_night` 792.000 |
    | RG-31 (b) | như trên; gõ giá đêm thêm 692.000 (gợi ý 792.000) | dò giá: `<ngày đi+1>T00:20` và `extraNightRateVnd` 692.000 → 422, `max` 692.000 | Bill "Còn phải thu 692.000 đ", nút "Tạo VietQR · 692.000 đ". Tiền mặt 692.000, Hoàn tất → 200. Folio `extra_night` 692.000 |
    | RG-31 (b), qua VietQR | như trên; gõ 567.000 (gợi ý 667.000) | `<ngày đi+1>T00:20` và `extraNightRateVnd` 567.000 | QR 201, 567.000. Ghi nhận 200. B18 `extraNight.rateVnd` 567.000 → 200. Folio `extra_night` 567.000 |
    | RG-31 (c) | như trên; tiền mặt theo giá gợi ý 708.000 | – | B18 200. Folio `extra_night` 708.000, không có `late_checkout` |
    | U3 | 00:20 / gõ 00:25 | `<ngày đi+1>T00:25` | QR 201, 750.000. B18 `checkoutTime` 00:25 → 200. Folio `extra_night` 750.000 |
    | U4 | ngày đi 23:55 / gõ 00:05 | `<ngày đi+1>T00:05` | QR 201, 708.000. B18 200. Folio `extra_night` 708.000 |
    | U5, RG-31 (d) | ngày đi 06:10 / gõ 04:30 | `<ngày đi+1>T04:30` | QR 201, 792.000, bằng số Bill (đêm thêm), cùng cách đọc với bản tóm tắt. B18 của ca này là BUG-R4-051: 422 `TIME_AFTER_ACTION` |
    | U11 | đơn OTA 1 đêm, gia hạn 1 đêm bằng B13 (đơn con, `stayDepartureDate` = ngày đi + 1); đồng hồ `stayDepartureDate` 11:00 | `<stayDepartureDate>T11:00` | QR 201, 827.000 (đêm gia hạn và 1 bia). B18 200, folio `settled`. Đối chứng API: `checkoutAt` theo `departureDate` của đơn gốc → 422 `DATE_INVALID` |

  - **Ca ORC nhờ ở RG-31 (b): đạt.** Đây là cách đóng thứ hai của điều kiện FB-R4-ARC-FE-PR86-02. Trên `c6b2f78e` ca này đỏ: dò giá 422 `NOT_ALLOWED`, Hoàn tất 422.
  - B18 vẫn gửi đúng thân như trước (`checkoutTime`, `extraNight`, `finalPayment`). Đêm thêm vẫn tính như trước theo BR-416.
  - Hồi quy E2E:
    - desk-clock 23/23: `checkout.h16`, `b14-fridges.s5` (hai tủ sau B14), `minibar-recount.s4`, `an-rates.s5` (giá đêm thêm, BR-416/417), `night-business-day.s4`, `stay-money.s4`, `stay-writes.h15`;
    - clock (API): 71 đạt, 2 bỏ qua có sẵn (ESC-031 cần stack MFA; TC-L4-024 cần dừng worker). Gồm `late-fee-qr.s4`, `stay-checkout.s3`, `night-business-day.s4`, `qa-esc031.r3`, `minibar-matrix.s4`.
  - Không có lỗi mới do #86. Hai lỗi mới thấy khi chạy là BUG-R4-051 và BUG-R4-052; cả hai có từ trước.
  - Bằng chứng (scratchpad, không commit, dữ liệu giả): `qa2-pr86-out/e2e-t1b`, `e2e-t23`, `e2e-t4`, `e2e-rgd`, `e2e-rgc` (`data.txt`, `run.log`); `vitest-45d-*.log`, `mut-*.log`; `zz-qa2-pr86.spec.ts.bak`, `zz-qa2-arc-u.test.ts.bak`.
- **Vai chịu trách nhiệm:** FE-A sửa. ARC duyệt quy tắc chọn ngày. BA viết câu sổ tay tạm. QA chạy lại.
- **Trạng thái:** **Đã gộp `main` `5b785535` (#86, 05/11)** – trước đó: Đã sửa (head `45d2cfed`, QA2 ĐẠT 05/11 05:30). Head `9010e65f` dừng vì ARC KHÔNG ĐẠT.
  - Điều kiện gộp của ARC: CI xanh, và PR86-02 đóng (ca trang của FE, hoặc RG-31 (b) đạt; QA2 đã chạy đạt).
  - 05/11 06:00: RG-31 (a)–(g) chạy lại trên `main` (mục "Chạy lại trên `main`" dưới): **đạt**. Ca này cần đồng hồ giả, nên không chạy trên STG. Chờ phát hành v1.0.4 để đóng.
  - Trước đó: Mới (QA2 05/11 05:00).
- **Chạy lại trên `main` sau khi gộp #86 (QA2 05/11 06:00):**
  - Bản thử: `main` `f670d99b` (merge `5b785535`, head #86 `f14954af`) gộp tại chỗ với #87 `e2d616f8`. Stack `ottimo-qa2m87`, đã dọn.
  - `f14954af` so với `45d2cfed` chỉ thêm 23 dòng test ở `bug-r4-050-fea.test.tsx` (PR86-02), không đổi mã sản phẩm.
  - E2E Desk: 8 ca đạt, cùng số liệu với lượt `45d2cfed`:
    - (a) `checkoutAt` 00:20 hôm sau ngày đi, QR 201 792.000, B18 200, `extra_night` 792.000;
    - (b) dò giá `max` 692.000, Bill 692.000, B18 200, `extra_night` 692.000; qua VietQR 567.000: 201, rồi 200;
    - (c) tiền mặt 708.000, B18 200;
    - (d) U5 `<ngày đi+1>T04:30`, QR 201 = số Bill;
    - (e) U3 `T00:25`, B18 200;
    - (f) U4 `T00:05`, B18 200;
    - (g) U11 `<stayDepartureDate>T11:00`, QR 201, B18 200; theo `departureDate` của đơn gốc thì `DATE_INVALID`.
  - Unit admin-web trên bản thử: 994/994, gồm ca trang mới của PR86-02.
  - Ghi thêm: `actualCheckoutAt` là giờ bấm, không phải giờ gõ. Ví dụ (e) ghi 00:20, (f) ghi 23:55. Phí vẫn tính theo giờ gõ. Đúng hợp đồng hiện tại (B18 không nhận `checkoutAt` từ Desk), nên không ghi lỗi; BUG-R4-051 sẽ xử lý ở v1.0.5.
  - Bằng chứng: `qa2-m87-out/e2e-rg/data.txt` (T1–T3), `run.log`, `vitest-all.log`.

### BUG-R4-051 – Trả phòng: giờ gõ trước 06:00 mà bấm sau 06:00 bị đọc là sáng hôm sau; Desk không ghi được giờ khách rời trong cửa sổ sau nửa đêm
- **Mức:** P2 (QA2 05/11 05:30).
  - Không sai tiền: B18 từ chối và không ghi gì. Làm lại với giờ Desk điền sẵn thì tiền đúng (cách làm tạm mới ở BUG-R4-036).
  - Nhưng lễ tân bị kẹt, và Desk hiện số sai: hộp đêm thêm và "Còn phải thu 792.000 đ", trong khi khách không nợ gì.
  - Từ #86 (`45d2cfed`), VietQR của ca này nhận 792.000 (201), vì đọc giờ như bản tóm tắt. Trước #86, VietQR từ chối (`max` 0).
    - Nếu khách quét và lễ tân Ghi nhận, folio có 792.000 trong khi B18 vẫn 422. Làm lại với giờ điền sẵn thì thành tiền trả thừa, phải hoàn.
    - Ca này khó xảy ra, vì khách đã rời lúc 04:30.
  - Phần "cách làm tạm hỏng" đã tính vào mức P1 của BUG-R4-036. Lỗi này giữ P2 để theo dõi bản sửa thật ở v1.0.5.
- **Môi trường:** như mục "Xác minh cách làm tạm – CO-05" của BUG-R4-036. Thấy ở `main` `585cf0ba` và ở #86 `45d2cfed`.
- **Liên quan:**
  - BUG-R4-036 (cách làm tạm), BUG-R4-050;
  - `rounds/round-04/reviews/ARC-on-v104-bug050-rule.md` mục 2 và 4;
  - `product/services/api/src/modules/frontdesk/internal/stay-support.ts` `checkTypedTime` (đọc giờ gõ theo `businessMinutes`);
  - `checkout.service.ts` `departure()`;
  - `CheckOutPage.tsx`: bản tóm tắt và B18 chỉ nhận `checkoutTime` từ Desk;
  - TC-V104-CO-05, TC-V104-RG-31 (d).
- **Các bước tái hiện:**
  1. Đơn Trực tiếp 1 đêm, ngày đi D+1, đã trả đủ. Khách rời lúc 04:30 ngày D+1, trong cửa sổ sau nửa đêm.
  2. Lúc 06:10 ngày D+1 (đã qua mốc 06:00), `qa.fd` mở Trả phòng.
  3. Bước Phụ phí: gõ **04:30** ở Giờ trả phòng thực tế. Sang Bill, thu tiền mặt theo số Bill hiện, bấm Hoàn tất.
- **Thực tế:**
  - Bản tóm tắt `checkoutTime=04:30` ra `extraNightRequired: true`. Desk hiện hộp đêm thêm, "Còn phải thu 792.000 đ". Ô ghi chú giờ không hiện.
  - B18 `{checkoutTime:"04:30", extraNight:{}, finalPayment:{cash 792.000}}` → 422 `checkoutTime TIME_AFTER_ACTION`, câu "Giờ này muộn hơn hiện tại…". Đơn vẫn Đang ở.
  - Gốc:
    - Máy chủ đọc `checkoutTime` theo trục ngày làm việc của lúc bấm: giờ trước mốc được cộng 1440 phút (`businessMinutes`).
    - Vì vậy 04:30 lúc 06:10 là 04:30 **sáng hôm sau**, muộn hơn lúc bấm 22 giờ 20 phút, quá dung sai 30 phút.
    - Desk không có cách nói "04:30 hôm nay", vì không gửi `checkoutAt` cho bản tóm tắt và B18.
  - Qua API thì làm được: B18 kèm `checkoutAt` 04:30 ngày D+1 và ghi chú → 200, không phụ thu, không đêm thêm.
- **Mong đợi:** lễ tân ghi được giờ khách rời thật trong cửa sổ sau nửa đêm, kể cả khi bấm sau 06:00, theo đường ghi lùi có ghi chú (E03-07). Desk không hiện đêm thêm cho giờ đó. Bill, VietQR và B18 dùng cùng một thời điểm.
- **v1.0.3 (production): có cùng lỗi** (theo mã, không chạy stack v1.0.3).
  - Desk `v1.0.3` gửi B18 chỉ với `checkoutTime` (`CheckOutPage.tsx` dòng 664).
  - Luật đọc giờ gõ ở `stay-support.ts` không đổi từ `v1.0.3` tới `585cf0ba`.
- **Đề xuất sửa (v1.0.5, theo ARC mục 2):**
  - Desk tính một thời điểm và gửi `checkoutAt` (kèm `checkoutTime`) cho bản tóm tắt, VietQR và B18. Không đổi hợp đồng.
  - Quy tắc: trong `[ngày đi 00:00, ngày đi + 1 lúc mốc)`, chọn thời điểm muộn nhất có giờ gõ mà không muộn hơn lúc bấm + `manual_time_tolerance_minutes`.
  - Làm cùng việc chặn ghi lùi quá xa qua API (ARC mục 4).
- **Test chống tái phát:**
  - Unit cho hàm chọn thời điểm ở v1.0.5: 04:30 lúc 06:10 → 04:30 ngày đi, có ghi chú; 00:05 lúc 23:55 → 00:05 hôm sau.
  - E2E đồng hồ ảo: CO-05 bản gốc (gõ 04:30 lúc 06:10) → B18 200, 0 đ phụ thu, không đêm thêm.
- **Bằng chứng** (scratchpad, không commit, dữ liệu giả): `qa2-pr86-out/co05-main-data.txt`, `e2e-t4/data.txt`, `e2e-t23/data.txt` (U5).
- **Vai chịu trách nhiệm:** FE-A (Desk gửi `checkoutAt`). ARC (quy tắc, mục 2 và 4). BE nếu cần chặn ghi lùi. DOM/BA: câu sổ tay tạm, chung với BUG-R4-036.
- **Trạng thái:** Mới (QA2 05/11 05:30). Đề xuất dời v1.0.5 có kế hoạch (ARC mục 2). Cách làm tạm cho v1.0.4 là cách mới ở BUG-R4-036. ORC và PO chốt.

### BUG-R4-052 – Trả phòng, bước Bill: "Tổng cộng" không gồm đêm thêm sắp ghi
- **Mức:** P3 (QA2 05/11 05:30).
  - Không sai tiền: "Còn phải thu", nút VietQR và B18 đều đúng.
  - Con số hiển thị không khớp các dòng ngay dưới, nên lễ tân và khách dễ hiểu nhầm.
- **Môi trường:** như mục "Xác minh bản sửa – PR #86" của BUG-R4-050. Thấy ở `c6b2f78e` (dữ liệu DOM #72), `585cf0ba` và `45d2cfed`.
- **Các bước tái hiện:** như RG-31 (a). Đơn 1 đêm 792.000 đã trả đủ, trả phòng lúc 00:20 hôm sau ngày đi (có đêm thêm). Sang bước Bill.
- **Thực tế:**
  - Thẻ Bill ghi "Tổng cộng: 792.000 đ".
  - Folio ngay dưới ghi "Tiền phòng đêm … 792.000", "Đêm thêm … 792.000", "Đã thu −792.000", "Còn phải thu 792.000 đ".
  - Khi sửa giá đêm thêm thành 692.000: vẫn "Tổng cộng: 792.000 đ", còn "Còn phải thu 692.000 đ".
  - Gốc: `CheckOutPage.tsx` dòng 1753 in `totalVnd` của bản tóm tắt. Số này là tổng folio đã ghi, chưa gồm đêm thêm mà B18 sẽ ghi.
  - Dòng minibar ghi ở bước ① thì có trong tổng. Ví dụ ca U11: "Tổng cộng 1.647.000" có 1 bia.
  - Chưa kiểm phụ thu trả muộn (B18 cũng ghi khoản này), phiếu in và bản xem trước phiếu.
- **Mong đợi:** "Tổng cộng" bằng tổng các dòng Bill đang hiện, gồm đêm thêm (và phụ thu) sắp ghi. Cách khác là đổi nhãn cho rõ đây là tổng đã ghi. UXD chọn.
- **v1.0.3: có cùng cách hiển thị** (theo mã: `CheckOutPage.tsx` ở tag `v1.0.3`, dòng 1442).
- **Đề xuất sửa:** FE cộng đêm thêm và phụ thu đang chọn vào số hiển thị, hoặc máy chủ trả thêm tổng dự kiến trong bản tóm tắt. UXD xem nhãn.
- **Vai chịu trách nhiệm:** FE-A (+ UXD nhãn; ARC nếu thêm trường).
- **Trạng thái:** Mới (QA2 05/11 05:30). Đề xuất dời v1.0.5. Không chặn #86.

---

## Lỗi cũ thấy lại (không cấp số mới)

### BUG-R2-216 – Hộp "Giữ chỗ" sau khi tạo in 2 lần số cọc và nội dung chuyển khoản (thấy lại trên v1.0.4)
- **Mức:** P3 (giữ như bản gốc `rounds/round-02/qa/bug-list.md`).
- **Môi trường:** stack `ottimo-qa104` (`40825ee1`), Desk Chromium 1366×768, `qa.sal`, đồng hồ ảo `desk-clock`. Ca tạm của QA `ui-clock/zz-qa104-holds.spec.ts` (không commit, đã xóa cùng worktree).
- **Liên quan:** TC-V104-HD-01. Plan v1.0.4 nhóm (5) "nếu kịp", P4-40 giai đoạn B. Báo cáo FE-B `rounds/round-04/outputs/FE/v1.0.4-fe-holds.md` dòng 60 vẫn liệt kê là việc còn lại.
- **Các bước tái hiện:** Báo giá & giữ chỗ → ngày đến thứ Hai tới, 2 đêm, 1 người lớn → Tìm kiếm → **Báo giá** căn 202 → chọn khách giả → **Lưu báo giá** → **Giữ chỗ** → **Tạo giữ chỗ**.
- **Thực tế:** sau khi tạo, hộp có `.price-big` **2 lần** (500.000 đ) và dòng "Nội dung chuyển khoản: OTM00619" **2 lần**. Khối tóm tắt hiện trước, rồi `DepositQr`/`VietQrCard` lặp lại cùng hai dòng. Mã: `QuoteDialog.tsx` dòng 764–790 (khối tóm tắt dòng 776–783, rồi `<DepositQr … auto />` dòng 785) và `components/VietQrCard.tsx` dòng 23–25. Từ v1.0.3 (`da6d6f3d`) tới `40825ee1`, các commit chạm hai tệp này chỉ là LP-v2 (ghi chú ngôn ngữ, c9372e52, 0a25716a, c37a0a76). Phần giữ chỗ không đổi.
- **Mong đợi** (theo UXD, review PR #60): khối tóm tắt hiện cho CTV, và cho sale khi chưa có thẻ QR (đang tạo / tạo lỗi / chưa cấu hình tài khoản nhận). Mỗi thứ (số cọc, nội dung chuyển khoản) chỉ in **một** lần.
- **Bằng chứng:** ảnh `qa104/evidence/hd01-hold-dialog.png` (scratchpad; dữ liệu giả, số tài khoản nhận đã che sẵn, **QR chưa che** nên không commit).
- **Vai chịu trách nhiệm:** FE-B. UXD chốt bố cục.
- **Trạng thái:** **Đã sửa – đạt local, chờ xác nhận STG.**
  - Trước đó: Open, chưa sửa ở `40825ee1`. PR #60 (head `c2c2edd2`) vào `main` qua merge `58183764`.
  - **Chạy lại 04/11 19:37–19:38** trên `main` @ `58183764`:
    - Stack dùng một lần `ottimo-qahd`, Desk Chromium 1366×768, project `desk-clock`, đồng hồ ảo.
    - Spec tạm `ui-clock/zz-qa104-holds.spec.ts`, viết lại vì bản cũ đã xóa cùng worktree. Không commit.
    - Cả 3 ca HD-01 đạt, **3 lượt liên tiếp**. Mỗi ca tạo giữ chỗ căn 202, cọc 500.000 đ:
      - (a) `qa.sal`, chưa cài tài khoản nhận (`createVietQr` → 409 `PAYMENT_NOT_CONFIGURED`). Khối tóm tắt hiện **một** lần: "Cọc cần thu" ×1, `.price-big` ×1, "Nội dung chuyển khoản:" ×1, kèm câu lý do. Không có thẻ VietQR.
      - (b) `qa.sal`, có tài khoản nhận (VietQR 201, nội dung = mã đơn). Chỉ còn thẻ VietQR: `.price-big` ×1, "Nội dung chuyển khoản: OTM000xx" ×1, nút "Sao chép nội dung" ×1. Không có "Cọc cần thu" phía trên.
      - (c) `qa.ctv1`: khối tóm tắt ×1, `.price-big` ×1, "Nội dung chuyển khoản:" ×1, câu `sale.qr_after_ctv`. 0 lệnh `createVietQr`.
    - Unit `v104-hold-dialog-feb.test.tsx`: 4/4 đạt.
  - Trên staging nhiều khả năng ra nhánh (a), vì không dùng VietQR thật (test case 0.2).
  - Ghi nhận, không phải lỗi: ở nhánh (a), hộp xanh vẫn ghi "Gửi mã QR cho khách…", ngay trên câu đỏ "Chưa cài tài khoản nhận…". Hai câu đọc cùng nhau vẫn hiểu được. Chỗ này không đổi ở PR #60; gửi UXD cân nhắc ở v1.0.5.
  - Đóng khi HD-01 đạt trên STG 06/11 C3.
  - Ảnh `qahd/evidence/hd01a-sale-no-account.png`, `hd01b-sale-vietqr.png`, `hd01c-ctv.png` để ở scratchpad. Dữ liệu giả. Ảnh (b) có QR chưa che, nên **không commit**.

### BUG-R2-219 – Hộp "Giữ chỗ" khi khách đến hôm nay vẫn hiện bộ chọn 12/24/48 h và mốc hạn đã qua (thấy lại trên v1.0.4)
- **Mức:** P3 (giữ như bản gốc).
- **Môi trường:** như trên, đồng hồ ảo 18:30 ngày đến.
- **Liên quan:** TC-V104-HD-02.
- **Các bước tái hiện:** Báo giá & giữ chỗ → ngày đến = hôm nay, 2 đêm → Báo giá căn 202 → chọn khách → Lưu báo giá → **Giữ chỗ**.
- **Thực tế:**
  - Thông báo "Khách đến hôm nay thì không giữ chỗ được. Thu tiền và tạo đơn ngay." hiện đúng. Nút **Tạo giữ chỗ** bị khóa (đúng). Không có lệnh `create-hold` nào được gửi.
  - Hộp vẫn hiện "Giữ trong" 12 h / 24 h / 48 h và "Hết hạn 12:00 [ngày đến] – chưa cọc thì tự hủy, mở bán lại.", là mốc **đã qua** (lúc đó 18:30).
  - Mã: `QuoteDialog.tsx` dòng 792–808 vẫn vẽ `Seg` + `sale.hold_until` khi `arrivesToday`.
- **Mong đợi:** khi không được giữ chỗ thì ẩn bộ chọn thời hạn và dòng hết hạn (hoặc thay bằng hướng dẫn tạo đơn đã thu). Không hiện mốc giờ trong quá khứ.
- **Bằng chứng:** ảnh `qa104/evidence/hd02-hold-today.png` (scratchpad; dữ liệu giả, không QR).
- **Vai chịu trách nhiệm:** FE-B. UXD lo phần chữ.
- **Trạng thái:** **Đã sửa – đạt local, chờ xác nhận STG.**
  - Trước đó: Open, chưa sửa ở `40825ee1`. PR #60 (head `c2c2edd2`) vào `main` qua merge `58183764`.
  - **Chạy lại 04/11 19:37–19:38** trên `main` @ `58183764`, cùng stack và spec như BUG-R2-216. Ca đạt **3 lượt liên tiếp**.
  - Kịch bản: `qa.sal`, ngày đến = hôm nay, đồng hồ ảo **18:30**. Hộp chỉ còn:
    - thông báo "Khách đến hôm nay thì không giữ chỗ được. Thu tiền và tạo đơn ngay." và câu `sale.today_handoff`;
    - nút **Tạo giữ chỗ** bị khóa. Bấm ép vẫn **0** lệnh `create-hold`.
  - Các thứ phải mất đều đã mất (×0): "Giữ trong", nút 12/24/48 h, "Hết hạn …", "Mã QR … tạo ngay sau khi giữ chỗ", "Cọc cần thu".
  - Đối chứng trong cùng lượt (ngày đến tương lai, trước khi tạo): "Giữ trong" ×1, 3 nút 12/24/48 h, "Hết hạn" ×1, câu QR ×1. Như vậy selector của ca vẫn bắt được các thành phần này khi chúng có mặt.
  - Unit `v104-hold-dialog-feb.test.tsx` (ca 219): đạt.
  - Đóng khi HD-02 đạt trên STG 06/11 C3.
  - Ảnh `qahd/evidence/hd02-arrival-today.png` để ở scratchpad. Dữ liệu giả, không có QR.

---

## Ghi chú không phải lỗi

- **`design/content-guide.md` dòng 1335 còn câu cũ của `rooms.night_auto`** ("Đêm ngày thường… lịch giá cộng thêm"). QA2 thấy 05/11 06:00 khi kiểm #87 @ `e2d616f8`.
  - #87 đã đổi `strings-vi.json`, `strings-en.json`, `strings.js`, `strings-tables.md` và `gen_strings.py`, nhưng chưa đổi bảng trong content guide.
  - Desk đọc từ `strings-*.json`, nên app đúng. Không chặn #87.
  - UXD sửa dòng này trong lần sửa content guide kế tiếp, để người viết câu sau không lấy lại câu cũ.

- **Khóa `fo.tabs.holds` không còn dùng.** Từ PR #54, `e2e/ui-clock/gate-s4.spec.ts:637` và Desk dùng `today.holds_waiting` ("Giữ chỗ chờ cọc"). `design/tools/gen_strings.py:115` vẫn giữ khóa cũ với ghi chú "chưa xóa, đợi FE-B rebase và gộp P4-40". P4-40 đã vào `main`, và `product/apps` không còn chỗ nào dùng khóa này. UXD dọn ở v1.0.5 (không chặn).
- **Gói P4-32 `v104/fe-checkout` chưa vào `main`.** Không có nhánh hay commit nào. Khóa `checkout.pending_refund_line`, `checkout.use_early_departure` đã có trong bảng chữ, nhưng `product/apps` không dùng. Vì vậy TC-V104-CO-01…03 (GN-R4-QA-03, BUG-R3-024) là **N/A – chưa vào main**. ORC chốt lúc cắt 06/11 18:00: P4-32 vào bản cắt hay dời v1.0.5 (test case 0.1 quy định gói không vào thì ca chuyển "N/A – dời v1.0.5", không xóa).
  - Cập nhật 04/11 19:45: P4-32 nay là PR #64 (`v104/fe-checkout` @ `94ac2ade`), vẫn chưa vào `main`.
  - Test case bản 0.2 đã sửa mục 6 theo ARC A1 và UXD U4/U5:
    - CO-01 thêm tiền điều kiện;
    - thêm CO-01b (giới hạn đã biết, mong đợi "không có dòng"), không ghi thành lỗi;
    - thêm CO-04 (đọc lỗi: câu chữ Stone, không chặn Hoàn tất);
    - CO-03 N/A – dời v1.0.5.
