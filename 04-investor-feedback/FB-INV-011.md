# FB-INV-011 – Landing: giá ước tính theo tiền tệ của ngôn ngữ đang chọn

- Ngày: 17/11/2026 | Người gửi: INV | Ghi: ORC | Loại: tính năng (landing ottimo.vn, Desk tham số) | Ưu tiên: P2 | Đích: v1.0.6 (bản vá landing + api) | **Trạng thái: Xong (production 17/11, landing-v2.2.0 + v1.0.6)**

## Nguyên văn
> trang landing page, tôi cần một chuyện là ở cái việc tuỳ chọn ngôn ngữ á. khi mình chọn ngôn ngữ nào nó sẽ ra tiền tệ của quốc gia đó (estimate, còn tiền tệ thật thanh toán vẫn là vnd)

## INV chốt (17/11)
- EN → **USD**; KO → **KRW**; ZH → **CNY**; RU → **RUB**; VI → **VND** (không quy đổi).
- Tỷ giá **tự cập nhật hằng ngày** từ tỷ giá bán Vietcombank; Desk cho OWN xem và ghi đè; nguồn lỗi thì giữ tỷ giá gần nhất.

## Hiểu của ORC
- Số chính vẫn là VND (giá thật, thanh toán VND). Bên cạnh hiện "≈ số ngoại tệ" kèm chú thích ngắn: ước tính theo tỷ giá ngày X, thanh toán bằng VND.
- Áp cho thẻ phòng "From X / month" và ô giá trong form.
- Không có tỷ giá hợp lệ (quá cũ > 7 ngày, lỗi) → chỉ hiện VND, không hiện số ngoại tệ sai.
