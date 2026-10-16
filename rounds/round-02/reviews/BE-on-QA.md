# BE review QA – Round 2, Đợt 0 (seed DS-E)

- Người review: BE (BE-A) | Ngày: 16/10/2026 | Đối tượng: `product/tests/fixtures/seed/ds-e.json` (khối `docSequences`), phát hiện khi chạy loader `pnpm seed:ds-e`.

### FB-R2-BE-QA-01
- Mức độ: Major
- Vị trí: `product/tests/fixtures/seed/ds-e.json` – `docSequences[]` phần tử `docType: "group"`
- Vấn đề: fixture ghi tiền tố nhóm đơn `GRP-` (mã đầu `GRP-00001`), trong khi BR-007 v0.3, erd mục 10 và decision-log 16/10 (ARC, `NH-` chỉ cho nhóm đơn) chốt `NH-{n:05}`. Loader so mã server cấp với fixture và dừng: `group: server NH-00001 ≠ fixture GRP-00001`. Ngoài ra tên `docType` lệch erd: `group` (erd `reservation_group`), `receipt` (erd `payment`); `periodKey` `all`/`year` (erd `-`/năm `yy`) – loader đang ánh xạ tạm và in ra danh sách `aliases`.
- Vì sao quan trọng: mã chứng từ là hợp đồng giữa seed, test case và E2E (DS-0 "so mã… DỪNG nếu lệch"); để lệch thì `pnpm seed:ds-e` đỏ, hoặc TC tra mã nhóm theo `GRP-` sẽ không bao giờ khớp.
- Đề xuất sửa: đổi phần tử thành `{ "docType": "reservation_group", "prefix": "NH-", ... }`, `receipt` → `payment`, `periodKey` `all` → `-` (giữ `year` cho bill được – loader hiểu). Sau khi sửa, BE bỏ bảng ánh xạ tạm.
- Trạng thái: Open

Điểm tốt: fixture không chứa mật khẩu (đọc từ `QA_SEED_PASSWORD`), có cờ `fakeDataOnly`, giá trị tham số đều nằm trong biên erd 9.1a (loader kiểm và không báo lỗi nào).
