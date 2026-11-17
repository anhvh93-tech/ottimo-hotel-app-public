# FB-INV-011 – hợp đồng chung BE ↔ FE (ORC 17/11, ARC review cùng PR BE)

`GET /v1/public/properties/{slug}/monthly-rates` thêm khối **tùy chọn** `fx` (thiếu/null → landing chỉ hiện VND):
```json
"fx": {
  "base": "VND",
  "source": "vietcombank" | "manual",
  "asOf": "2026-11-17",
  "rates": { "USD": 25450, "KRW": 18.2, "CNY": 3520, "RUB": 290 }
}
```
- `rates[CCY]` = số VND cho 1 đơn vị ngoại tệ (tỷ giá BÁN Vietcombank), số dương. Chỉ 4 mã trên (allowlist).
- `fx` chỉ trả khi `asOf` ≤ 7 ngày tuổi; quá hạn → bỏ `fx`.
- Không thêm endpoint mới; cùng cache/rate-limit như cũ. Price-estimate không đổi (FE tự quy đổi từ VND).

FE quy đổi: ngoại tệ = VND ÷ rate; làm tròn lên: USD 1, KRW 1.000, CNY 1, RUB 100. Hiện: "≈ US$ 334 / month" (theo locale), dòng VND vẫn hiện, chú thích "Estimate at the {date} rate. Payment in VND."
