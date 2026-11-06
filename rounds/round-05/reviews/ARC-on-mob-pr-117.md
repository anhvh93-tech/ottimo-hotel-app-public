# ARC review PR #117 – MOB V5-1B: tin giữ chỗ có câu riêng trong hộp thư app nhân viên (sửa FB-R5-ARC-MOB-V51B-01)

- Round 5 (v1.0.5), bước **Review**. Người review: ARC. Ngày 07/11/2026.
- PR: https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/117, nhánh `r5-mob-v5-1b-notif`, HEAD **`be37b682`**, gốc gộp với `main` là `18bdd279`. 3 tệp, +95/−1. Không đổi `openapi.yaml`, không migration, không đổi `strings-*.json` hay `gen_strings.py`.
- Đã đọc:
  - thân PR, `gh pr diff 117`;
  - thẻ gốc FB-R5-ARC-MOB-V51B-01 (`ARC-on-be-pr-100-d1.md`);
  - hợp đồng: `v1.0.4-contract-0.3.12.md` mục 2.5 (tên khóa chốt) và dòng việc của MOB; `openapi.yaml` schema `StaffNotification` (enum `kind`, refType `reservation`, refCode là mã đơn, "client gặp kind lạ thì dùng câu chung");
  - chữ UXD: `strings-vi.json` và `strings-en.json` dòng 3413–3415, `gen_strings.py` dòng 3990–3992, `content-guide.md` dòng 4148–4150;
  - mã: `notifications.tsx` (`NOTIF_KEYS`, `notifText`, `notifRef`), `NotificationsPage.tsx` (`target()`, `ICON`), `scripts/used-keys.ts`;
  - danh sách tệp của #97 (`d3081f93`) và #102 (`932d1c22`).
- Đã chạy. Dùng hai worktree tách rời trong scratchpad, cài gói bằng `pnpm install --offline`. Đã xóa cả hai worktree sau khi chạy xong.
  - **HEAD của PR, không gộp gì:**
    - mobile 14 tệp / 166 ca đạt;
    - `tsc --noEmit` sạch;
    - prettier và ESLint sạch trên 3 tệp;
    - chạy `gen_strings.py` không làm lệch tệp nào.
  - **Đột biến của ARC:** bỏ 3 dòng `NOTIF_KEYS` thì **4 ca đỏ**: 3/4 ca của `v105-hold-notices` và ca BUG-R4-021 trong `v104-mfa-signin`. Ca còn xanh là ca "dòng tham chiếu = mã đơn". Ca đó đúng cả trước khi sửa, giữ lại để ghim hành vi.
  - **Gộp thử:**
    - `main` @ `dce1c0fd` + #117 + #97 + #102: #117 gộp sạch với từng PR;
    - #97 và #102 xung đột với nhau ở `gen_strings.py`, `strings-tables.md`, `strings.js` (cùng thêm `hk.action.needs_cleaning`). Xung đột này đã biết: ghi chú UXD nói "PR gộp sau bỏ dòng trùng". Nó không chạm #117;
    - sau khi gỡ xung đột (lấy bản #97): mobile **15 tệp / 181 ca đạt**, `tsc` sạch;
    - `main` sau đó lên `355a2929`. Từ gốc gộp đến nay, `main` không đổi gì ở `apps/mobile`, `packages`, `design/copy`, `docs/api`. Gộp thử vẫn sạch.

## Kết luận: **DUYỆT**

Gộp được ở `be37b682` **khi CI xanh**. Mã đúng thẻ V51B-01 và đúng hợp đồng 0.3.12 mục 2.5.

- **Job đỏ duy nhất là `infra scripts (shellcheck)`.** Nó không liên quan PR này: PR không chạm tệp hạ tầng nào. Đây là test chập chờn, ARC đã tái hiện ở máy (thẻ FB-R5-ARC-OPS-11).
  - ORC chạy lại job hỏng khi run `42261019384` xong: `gh run rerun 42261019384 --failed`.
- Lúc review, `docker images build · E2E smoke` còn đang chờ máy chạy. Cần job này xanh.
- Phải lên **cùng tag v1.0.5** với #100: release notes v1.0.5 của BA (`1217858a`) đã ghi dòng `hold_expired` trong hộp thư app nhân viên.

Số thẻ:
- Trên PR: **0 Blocker · 0 Major · 0 Minor · 1 Suggestion** (117-01).
- Ngoài PR, ORC chuyển:
  - **1 Minor cho OPS** (OPS-11, test hạ tầng chập chờn);
  - **1 Suggestion cho UXD** (UXD-117-01, ghi chú người nhận đã cũ).
- Thẻ FB-R5-ARC-MOB-V51B-01: **ARC đóng (Done)** khi #117 gộp.
- ESC mới: không.

## 1. Đối chiếu từng điểm ORC giao

| Điểm | Bằng chứng | Kết quả |
|---|---|---|
| Đúng khóa chữ UXD có sẵn | `hold_overdue_with_deposit`, `hold_overdue_cap`, `hold_expired` trỏ đến `staff.notif.k.<kind>`. Khớp từng chữ với bảng tên chốt 0.3.12 mục 2.5. Có đủ ở `strings-vi.json` và `strings-en.json` (3413–3415) và ở `gen_strings.py` (3990–3992), nên lần sinh lại sau không làm mất khóa. `strings-ru.json` không có khóa `staff.*` nào: app nhân viên chỉ có VI/EN, không thiếu gì. `used-keys.ts` bắt được vì họ khóa `staff` nằm trong `FAMILIES` và khóa viết nguyên chuỗi. Ca test `isShipped` chứng minh 3 khóa có trong gói PWA | **Đạt** |
| Không đổi hợp đồng | Diff chỉ có 3 tệp mobile. `StaffNotification` lấy kiểu sinh từ hợp đồng (`Schemas['StaffNotification']`), enum đã có 3 kind từ 0.3.12, nên `Partial<Record<kind, string>>` typecheck đúng. Hành vi khớp mô tả của hợp đồng: refType `reservation`, dòng phụ là `refCode` (mã đơn, SR-PWA-06), không tên khách, không số tiền. Bấm vào tin không mở màn nào: `target()` trả `undefined` với `reservation`, đúng ý "việc trên Desk". Kind lạ vẫn dùng `staff.notif.k.other` | **Đạt** |
| Có test | `v105-hold-notices.test.tsx`, 4 ca: câu VI/EN riêng cho từng kind và không phải câu chung; dòng tham chiếu là mã đơn; khóa có trong gói; hộp thư của `fdl.hanh` (bấm vào vẫn ở hộp thư). Ca BUG-R4-021 đổi sang mong đợi câu riêng. Ca UI chỉ bơm `hold_expired` và `hold_overdue_with_deposit` cho FDL, không bơm `hold_overdue_cap`. Như vậy là **đúng** người nhận theo hợp đồng: `cap` chỉ gửi MGR, OWN. Đột biến: 4 ca đỏ (xem đầu file) | **Đạt** |
| Không xung đột với #97, #102 | Không chung tệp nào. #97 sửa `mocks/handlers.ts`, mà test của #117 dùng `mockControl.notify`. Đã chạy bộ test mobile trên bản gộp ba PR: 181/181 đạt, nên không có xung đột ngầm. Xung đột #97 ↔ #102 ở bộ chữ là việc của hai PR đó (mục 3) | **Đạt** |
| CI | 7 job đạt: contract, Redocly, format · lint · audit · test · build, gitleaks, landing, confidential paths, no test endpoints. `infra scripts` đỏ vì test `postgres-log-terse` chập chờn, không do PR (OPS-11). E2E smoke đang chờ | **Chờ chạy lại** |

## 2. Thẻ

### FB-R5-ARC-MOB-117-01
- Mức độ: Suggestion
- Vị trí: `product/apps/mobile/src/pages/NotificationsPage.tsx`, `ICON` (dòng 10–20 @ `be37b682`)
- Vấn đề: 3 kind giữ chỗ không có trong `ICON`, nên rơi về biểu tượng `bell`. `bell` cũng là biểu tượng của dòng chung "xem chi tiết trên OTTIMO Desk". Câu đã khác nhau, nhưng lướt nhanh thì tin giữ chỗ trông giống tin chung.
- Vì sao quan trọng: ở quầy, `hold_expired` là việc phải làm ngay (báo khách trước khi khách chuyển cọc hay đến nơi, DOM mục 9). Biểu tượng riêng giúp lễ tân thấy nhanh hơn. Không ảnh hưởng tính đúng.
- Đề xuất sửa: UXD chọn biểu tượng có sẵn trong `@ottimo/ui`, ví dụ `clock` cho `hold_overdue_*` và `x` cho `hold_expired`. MOB thêm 3 dòng `ICON`. Không chặn #117, có thể làm ở v1.0.6.
- Trạng thái: Open

### FB-R5-ARC-OPS-11 (ngoài PR – ORC chuyển OPS)
- Mức độ: Minor
- Vị trí: `product/infra/server/test/postgres-log-terse.test.sh`, hàm `provoke()`, vòng `pg_isready`. Job CI `infra scripts (shellcheck)`.
- Vấn đề:
  - Job đỏ ở PR không chạm hạ tầng:
    - #117 @ `be37b682` (run `42261019384`, job `128040648522`): "11 passed, 2 failed", cả hai dòng `control:` hỏng, `SETTING` rỗng;
    - #109 @ `d77e2241` (run `42259858341`): đúng 2 dòng đó;
    - `main` @ `18bdd279` (run `42259985364`) thì xanh.
  - ARC chạy test 4 lần ở máy, cùng image `postgres:17-alpine@sha256:b0f9560a…`: lần 1 "5 passed, 8 failed" (lần này container `terse` hỏng), lần 2–4 "13 passed".
  - Nguyên nhân, ARC đã kiểm bằng một container dò:
    - entrypoint của image `postgres` chạy một **server tạm chỉ nghe Unix socket** để khởi tạo. Server tạm báo "ready to accept connections", rồi bị tắt khoảng 90 ms sau, trước khi server thật nghe TCP;
    - `docker exec … pg_isready -q -U postgres` đi qua socket, nên có thể báo sẵn sàng khi đang chạy server tạm;
    - khối SQL và câu `SELECT pg_settings` rơi vào lúc server khởi động lại. `|| true` nuốt lỗi, nên test báo "lộ / không ghim" thay vì "không kết nối được".
- Vì sao quan trọng:
  - đây là job bắt buộc, đỏ ngẫu nhiên ở PR không liên quan. Từ nay đến hạn cắt v1.0.5 (14/11) đội còn gộp nhiều PR, mỗi lần đỏ là một lần chạy lại;
  - người ta quen chạy lại mà không đọc log, nên có thể bỏ sót lỗi thật của SEC FB-R5-SEC-OPS-93-03 (log lộ email).
- Đề xuất sửa:
  1. Chờ server thật bằng TCP: `pg_isready -q -h 127.0.0.1 -U postgres`. Server tạm có `listen_addresses=''`. `--network none` vẫn có loopback: ARC đã thử, `127.0.0.1:5432 - accepting connections`.
  2. Kiểm kết nối một lần trước khối SQL. Nếu không kết nối được thì báo `ko "harness: postgres not reachable"` và thoát, không để lỗi đó thành "control hỏng".
  3. Thêm một dòng vào `ci/test-*`, hoặc chạy test 10 lần ở máy, để chứng minh hết chập chờn.
- Trạng thái: Open

### FB-R5-ARC-UXD-117-01 (ngoài PR – ORC chuyển UXD)
- Mức độ: Suggestion
- Vị trí:
  - `product/design/tools/gen_strings.py` dòng 3992 (cột ghi chú của `staff.notif.k.hold_expired`);
  - kéo theo `tools/strings-tables.md` dòng 3959 và `content-guide.md` dòng 4150.
- Vấn đề: ghi chú vẫn viết người nhận là "người tạo + người chốt; không ai → FD, FDL". Từ hợp đồng 0.3.13 bổ sung 1 (DOM mục 9), tin gửi người tạo, người chốt **và mọi FD, FDL đang hoạt động**. Chữ hiển thị không sai, chỉ ghi chú đã cũ.
- Vì sao quan trọng: QA và BA đọc cột ghi chú để viết ca test và tài liệu người nhận. Ghi chú cũ dễ dẫn đến ca test sai: tin chỉ gửi FD/FDL khi không có người tạo.
- Đề xuất sửa: trong lượt sinh chữ kế tiếp (#97 hoặc #102, PR nào gộp sau và sinh lại thì làm), đổi ghi chú thành "người tạo + người chốt + mọi FD, FDL đang hoạt động (0.3.13 bổ sung 1)", rồi sinh lại. Không đổi chữ VI/EN.
- Trạng thái: Open

## 3. Ghi chú cho ORC – thứ tự gộp

1. #117 độc lập: gộp trước hay sau #97, #102 đều được. Gộp khi `infra scripts` chạy lại xanh và E2E smoke xanh.
2. #97 và #102 xung đột với nhau ở 3 tệp sinh chữ (`gen_strings.py`, `strings-tables.md`, `wireframes/assets/strings.js`), cùng một dòng `hk.action.needs_cleaning`.
   - PR gộp sau: gộp `main` vào, giữ **một** dòng `hk.action.needs_cleaning` (chữ hai bên giống nhau, chỉ khác ghi chú), rồi chạy lại `gen_strings.py`.
   - **Không** lấy nguyên bản một bên cho cả 3 tệp. ARC thử lấy bản #97 thì `gen_strings.py` mất các khóa mới của #102 (`hk.desk.needs_cleaning_toast`, `checkin.room_status_stuck_od`, `error.INVALID_TRANSITION_generic_reloaded`), và lần sinh lại làm lệch `strings-*.json`.
3. Theo gợi ý của PR:
   - UXD xem câu hiển thị trong hộp thư;
   - QA thêm ca V5-1B vào bộ hồi quy hộp thư app nhân viên: FD và FDL thấy `hold_expired` và `hold_overdue_with_deposit`; MGR thấy `hold_overdue_cap` nếu MGR dùng app nhân viên.

## 4. Điểm làm tốt

- Sửa đúng phạm vi thẻ: 3 dòng, dùng khóa có sẵn, không thêm chữ, không đụng hợp đồng. Chú thích trong mã ghi rõ nguồn: 0.3.12, 0.3.13 bổ sung 1, thẻ V51B-01.
- Test có giá trị thật: 3/4 ca mới đỏ khi bỏ bản sửa. Có ca kiểm khóa có trong gói PWA (`used-keys.ts`), là chỗ dễ hỏng âm thầm nhất. Ca UI chọn người nhận đúng hợp đồng (FDL không nhận `cap`).
- Sửa ca BUG-R4-021 cũ thay vì xóa: vẫn ghim "không bao giờ hiện mã nội bộ", chỉ đổi kết quả mong đợi của câu.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **ARC – review PR #117 (MOB V5-1B, NOTIF_KEYS cho hold_expired / hold_overdue_with_deposit / hold_overdue_cap) @ be37b682: DUYỆT** (rounds/round-05/reviews/ARC-on-mob-pr-117.md). Đúng khóa UXD chốt 0.3.12 mục 2.5 (staff.notif.k.<kind>, có ở strings vi/en và gen_strings), không đổi hợp đồng, có test (đột biến: 4 ca đỏ). Không xung đột với #97, #102 (gộp thử 3 PR: mobile 181/181). Gộp khi CI xanh: job infra scripts đỏ do test postgres-log-terse chập chờn, không do PR – chạy lại. Phải lên cùng tag v1.0.5 với #100. Thẻ: 117-01 (Suggestion, biểu tượng riêng cho tin giữ chỗ, v1.0.6). Ngoài PR: FB-R5-ARC-OPS-11 (Minor, OPS: pg_isready qua socket báo sẵn sàng khi server tạm của entrypoint còn chạy – chờ bằng -h 127.0.0.1), FB-R5-ARC-UXD-117-01 (Suggestion, ghi chú người nhận hold_expired cũ). FB-R5-ARC-MOB-V51B-01 đóng khi #117 gộp. #97/#102: PR gộp sau giữ một dòng hk.action.needs_cleaning rồi sinh lại chữ, không lấy nguyên một bên. | ARC | Không ESC |`
