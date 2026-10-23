# QA review hợp đồng/hành vi ARC 16.31 – Round 3 Sprint 1 (fuzz R3-Q30)

- Người review: QA | Ngày: 23/10/2026 | Đối tượng: ARC `openapi-0.3.7.md` 16.31.1 và 208-F (N-15), so với DOM oracle mục 1 "hết cửa sổ → O = max(0, B)". Mã trên `main` @ `5834c6a`.
- Nguồn: fuzz FZ-02 seed 2000 bước 30–31, log gốc ở thư mục chạy fuzz `FZ-02.jsonl`.

### FB-R3-QA-ARC-01
- Mức độ: Minor (chỉ là số hiển thị, tồn tại tạm thời ≤ 1 giờ, không ghi sai tiền)
- Vị trí:
  - `ReservationHooks.openDebt` / `openDebtVndView` (đọc O);
  - DOM oracle mục 1, dòng O.
- Vấn đề:
  - Tình huống: folio `settled`, chưa từng có công nợ (`checkout_mode = desk`), có khoản trong cửa sổ B = 177.000. Đồng hồ đã qua `post_checkout_window_until` nhưng J15 chưa chạy.
  - API trả `openDebtVnd` = 0 (`openDebt` = null). Định nghĩa của DOM cho ra O = max(0, B) = 177.000.
  - Trong khoảng hở này, `debt_write_off` trả 409 `FOLIO_LOCKED`. Điều này khớp 208-F: thu tiền và giảm dòng trong khoảng hở đều 409 tới khi J15 chạy.
  - Hệ quả: hiển thị lệch định nghĩa tối đa 1 giờ. Không có đường tiền nào dùng số 0 này để cho phép ghi.
- Đề xuất: ARC và DOM chọn một trong hai.
  - (a) `openDebt` áp đúng câu "hết cửa sổ → O = max(0, B)" kể cả khi chưa có chu kỳ;
  - (b) DOM ghi rõ ngoại lệ "trước J15, đơn chưa có công nợ thì O = 0".
  - Fuzz đang ghi trường hợp này là cảnh báo (`I1?`, `I3?`), không phải lỗi. Runner mô phỏng J15 chạy mỗi giờ, nên không để khoảng hở kéo dài quá 60 phút.
- Trạng thái: Open
