# Round 5 – Phản hồi thẻ của BE

ORC ghi theo báo cáo của từng lượt BE (BE không tự push lên `main`). Trạng thái "Done" nghĩa là đã có trên nhánh PR; thẻ đóng hẳn khi PR gộp với CI xanh.

## BE-A1 (07/11)

| ID | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-ARC-BE-A1-01 | Done | ARC đã kiểm (#127) |
| FB-R5-ARC-BE-V546-01 | Done | ARC đã kiểm (#113, đã gộp) |
| FB-R5-DOM-BE-PR106-01, FB-R5-SEC-BE-A1A-01, FB-R5-SEC-BE-A1B-01 | Done | #127 |
| FB-R5-SEC-BE-127-01 | Done | `6a670f3a` (#127) |
| FB-R5-ARC-BE-127-01 | Done | `ad507f94` (#127) |
| FB-R5-DOM-BE-PR114-01, FB-R5-ARC-BE-114-01, FB-R5-ARC-BE-114-02 | Done (lên ở lần push #114, sau khi #127 gộp) | `6a086d41`, `8a5f8145`, `9aafc549` |
| FB-R5-SEC-BE-113-01, FB-R5-ARC-BE-113-01 | Done ở PR test bổ sung (chưa mở) | `d574b518` |

## PR #180 – FB-INV-010 Đợt 1 (giá tháng công khai) – head b2d60596, CI xanh (gồm E2E smoke)
| Thẻ | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-ARC-BE-180-01 | Done | Câu trong mô tả `getPublicMonthlyRates` + changelog (d) + PR, `b2d60596` |
| FB-R5-ARC-BE-180-02 | Done | Release note trong changelog (e) + PR, không đổi code |
| FB-R5-ARC-BE-180-03 | Done | Gom theo slug, `slice(0,20)`, thêm 1 ca unit, `b2d60596` |
| FB-R5-ARC-BE-180-04 | Done | Changelog ghi ARC duyệt, `b2d60596` |
| FB-R5-ARC-BE-180-05 | Done | E2E smoke xanh ở `b2d60596` |

Câu hỏi DOM trong PR – ORC đóng theo quyết định INV 16/11: (1) không giảm kỳ hạn trên web (một giá tháng); (2) web không ghi +10 % khách NN – báo giá xử lý; (3) `rounding.monthly_rent` 10.000 vs BR-005 1.000 – kết quả như nhau với bảng giá hiện tại, để DOM rà ở Đợt 2.
