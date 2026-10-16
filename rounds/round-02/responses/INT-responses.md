# INT – Trả lời feedback Round 2

| Thẻ | Mức | Trả lời | Chi tiết |
|---|---|---|---|
| FB-R2-SEC-INT-01 | Major | Accepted – đã sửa (Đợt 0) | Tầng B `fieldKinds` + Luhn + IIN + độ dài; `requiredKeys` → `attention[]` `card_suspect`; `droppedByRule` cho nhãn `rule`. Đủ test bắt buộc. Xem `rounds/round-02/outputs/INT/d0-report.md` |
| FB-R2-SEC-INT-02 | Major | Accepted – đã sửa | Tầng A quét mọi cửa sổ 13–19 số; 3 chuỗi đỏ của SEC thành test |
| FB-R2-SEC-INT-03 | Minor | Accepted – đã sửa | Số nguyên vượt `MAX_SAFE_INTEGER` bị xóa; `bigint` kiểm chữ số thật |
| FB-R2-SEC-INT-04 | Minor | Accepted – đã sửa | `env:<NHÓM>` trơn → `CONFIG` |
| FB-R2-SEC-INT-05 | Suggestion | Accepted – đã làm | (a) không phân biệt hoa thường; (b) cấm VNPay/MoMo `production` ngoài production |
