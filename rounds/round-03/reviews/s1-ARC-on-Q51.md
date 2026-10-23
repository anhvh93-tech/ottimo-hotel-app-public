# ARC review R3-Q51 – Màn tài khoản nhận VietQR (server BE-B + màn FE-A), v1.0

- Người review: ARC | Round 3 – Sprint 1, bước Review | Ngày: 23/10/2026
- Đối tượng:
  - nhánh `be-b/r3-q51-receiving-account`, HEAD `d99f6e2` (worktree `agent-a4a7a7b47e3d900bf`), đã gộp nhánh FE-A `0ca52a8`;
  - migration `0084_parameter_cancel_scheduled.sql` (chỉ `GRANT DELETE`);
  - báo cáo `outputs/BE/s1-be-b.md` mục 10.
- Đối chiếu: OpenAPI 0.3.8 (`getParameterHistory`, `setParameter`, `cancelScheduledParameter`, `EFFECTIVE_FROM_TOMORROW`); s1-contracts mục 4; SEC `s1-security-requirements.md` mục C (Q51-1…7).

## Kết luận
**Chưa gộp ở `d99f6e2`. Gộp được sau khi BE-B + FE-A sửa thẻ Q51-01** (hợp đồng 0.3.8 bổ sung 2 ARC vừa chốt, dưới đây), vì đây đúng là ca INV nhập tài khoản thật lần đầu. Không có Blocker. Thẻ Q51-02 là Minor, không chặn gộp.

**Đã chạy** (worktree tách riêng ở `d99f6e2`, PostgreSQL 17 riêng):
- `r3-q51-receiving-account` + `contract`: 11/11;
- admin-web `r3-q51-fea`: 9/9;
- `drizzle-kit generate`: không sinh file.

**Phần còn lại đúng hợp đồng:**
- chỉ OWN đọc và ghi khóa (403 + `access.denied`; danh sách bỏ khóa với vai khác);
- hiệu lực từ ngày mai, kể cả lần đầu;
- xác nhận lại S2;
- `cancelScheduledParameter`: 404 khi không có dòng, 409 khi dòng đang hiệu lực, khóa dòng `FOR UPDATE` dưới RLS, có audit `money`;
- số luôn che `•••• 1234` + `bankName`;
- thông báo + outbox `staff.email` (Q51-6) trong cùng giao dịch, khớp payload worker INT;
- màn FE-A khớp hình dạng request và mã lỗi.

## Quyết định ARC – hợp đồng 0.3.8 bổ sung 2 (đã áp `openapi.yaml`, chưa commit)

**Đồng ý đề xuất của ORC/BE-B, làm ngay cho v1.0, không dời 0.3.9.**

`getParameterHistory` 200:
- `required: [history]`; `current` **vắng mặt** (không có thuộc tính, không phải `null`) khi khóa chưa có dòng đang hiệu lực mà đã có dòng đã lên lịch.
- `history` vẫn gồm các dòng đã lên lịch như trước. Không thêm trường mới (`scheduled[]` không cần, vì Desk đã tách theo `effectiveFrom` > ngày kinh doanh).
- `current` = dòng có `effectiveFrom` lớn nhất ≤ ngày kinh doanh.
- **404** chỉ khi khóa không có dòng nào (không đang dùng, không lên lịch) và không có mặc định trong danh mục.
- Áp cho mọi khóa. Thực tế chỉ khóa không có mặc định (`payment_receiving_account`) rơi vào ca này.

Lý do chọn "vắng mặt" thay `null`: cùng quy ước repo (BUG-R2-101: trường không có thì bỏ, không trả `null`). Kiểu sinh ra thành `current?: Parameter`, nên trình biên dịch bắt mọi chỗ đọc `current` không kiểm.

**Đã sửa và sinh lại trên main checkout:**
- `product/docs/api/openapi.yaml`: mô tả `getParameterHistory`, `required`, dòng changelog "0.3.8 bổ sung 2";
- `product/packages/api-client/src/generated/openapi.ts`: `current?:`.

**Kiểm sau khi sửa:**
- `openapi_spec_validator`: OK;
- `gen-openapi-meta --check`: up to date (hình dạng request không đổi);
- `gen_rbac_cases --check`: OK, 205 operation, mismatch [];
- `gen_traceability --strict`: exit 0. Tệp `docs/qa/traceability.md` sinh lại có lệch **không do thay đổi này** (backlog 22/10) nên tôi trả về như cũ; QA sinh lại ở lần kế tiếp;
- `tsc` api-client, admin-web, api: 0 lỗi (main chưa có màn Q51);
- vitest api-client 30/30, api `contract` 5/5;
- prettier: xanh;
- Redocly **không chạy được** trên máy này (CLI không có trong `node_modules`) – CI `contract-lint` sẽ chạy.

## Thẻ feedback

### FB-R3-ARC-Q51-01
- Mức độ: Major (điều kiện gộp)
- Vị trí:
  - server `platform/internal/parameters.service.ts` (`getParameterHistory` → 404 khi không có `current`);
  - FE `apps/admin-web/src/pages/ReceivingAccount.tsx`, `src/mocks/handlers.ts`;
  - test `r3-q51-receiving-account.test.ts`, `r3-q51-fea.test.tsx`.
- Vấn đề: lần đặt đầu chỉ tạo một dòng đã lên lịch (hiệu lực từ ngày mai). Khi đó `getParameterHistory` trả 404, màn hiện "chưa cấu hình", OWN không thấy và không hủy được dòng vừa nhập cho tới ngày hiệu lực. Đây đúng là ca INV nhập tài khoản ngân hàng thật lần đầu: nhập sai số thì không có cách sửa trên màn.
- Vì sao quan trọng: tiền khách chuyển vào tài khoản sai từ ngày hiệu lực. OWN không có đường hủy qua app, mà Q51-5 lại cố ý không có đường "hiệu lực ngay".
- Đề xuất sửa (theo 0.3.8 bổ sung 2 ở trên; BE + FE **cùng PR**, đúng cổng đã ghi cho operation đã cài):
  - **BE-B**:
    - khóa có dòng nhưng không có dòng ≤ ngày kinh doanh → 200, bỏ `current`, `history` đủ dòng đã lên lịch;
    - 404 chỉ khi không có dòng nào và không có mặc định;
    - test: đặt lần đầu → GET 200, không có `current`, `history` 1 dòng đã lên lịch (số che) → hủy → GET 404; MGR vẫn 403 ở cả hai trạng thái.
  - **FE-A**:
    - `current` vắng → khối "Đang dùng" ghi "Chưa có tài khoản đang dùng – tài khoản dưới đây có hiệu lực từ {ngày}", vẫn hiện khối "Đã lên lịch" có nút Hủy;
    - 404 giữ "chưa cấu hình";
    - sửa MSW cho ca này, thêm test.
  - Chữ theo brand OTTIMO, Việt/Anh.
- Trạng thái: Open

### FB-R3-ARC-Q51-02
- Mức độ: Minor
- Vị trí: `0084_parameter_cancel_scheduled.sql` (`GRANT DELETE ON config_parameter TO ottimo_app`)
- Vấn đề: quyền DELETE mở cho **mọi** dòng `config_parameter` của cơ sở (RLS chỉ giới hạn theo cơ sở), trong khi chỉ cần xóa dòng chưa hiệu lực. Bảng này là lịch sử ("không sửa giá trị quá khứ"). Hiện chỉ `cancelScheduled` xóa và có kiểm ngày dưới khóa dòng, nên chưa có lỗi.
- Đề xuất sửa (commit kế tiếp, không chặn gộp): thêm test kiến trúc, `DELETE FROM config_parameter` chỉ được xuất hiện trong `ParametersService.cancelScheduled`. Cân nhắc thêm một chính sách RLS `FOR DELETE` giới hạn `effective_from > ngày lịch hiện tại theo múi cơ sở − 1`. Ở R3 không bắt buộc, vì ngày kinh doanh đổi lúc 06:00 nên cần hàm SQL riêng.
- Trạng thái: Open

## Điểm làm tốt
- Hủy dòng đã lên lịch dùng S2 và khóa dòng `FOR UPDATE`, audit `money` có giá trị đã che. Q51-6 được nối vào outbox `staff.email` khớp payload của worker INT.
- Phía server chặn hiệu lực từ ngày mai kể cả lần đầu, nên không có đường "đổi tài khoản nhận tiền ngay lập tức".
- Rebase sạch lên 0083, snapshot sinh lại đúng (`drizzle-kit generate` không sinh file).
