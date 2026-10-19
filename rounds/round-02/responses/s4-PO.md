# Trả lời của PO – Round 2 Sprint 4 (sau cổng QC Sprint 4 KHÔNG ĐẠT)

- Người viết: PO | Round 2 – Sprint 4 – Bước 4 (Phản hồi & sửa) | Ngày: 19/10/2026
- Đầu vào: `rounds/round-02/qc/s4-qc-gate.md` mục 5 (K9, K10), mục 6, mục 7; `reviews/s4-SEC.md`; `03-backlog/backlog.md` mục 5.5.

## 1. Thẻ có phần việc của PO

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-SEC-BE-83 (phần "PO ghi BR-433") | Deferred | Câu chống chia nhỏ đã có trong `business-rules.md` BR-433 (a)(b)(c) và BR-525 ghi chú [R3] (DOM 18/10). Phần cài đặt (BE-B) dời R3, hạn **trước khi có dữ liệu thật**: backlog **R3-Q22**, khớp thẻ `pendingFix` `R3-SEC-BE-83` trong `product/tests/fixtures/br-examples.json`. Phần của BE-B do BE-B ghi trong `responses/` của mình |

## 2. Đối chiếu SEC Major Sprint 4 còn dời ↔ backlog (để tác giả ghi "Deferred")

QC K10 yêu cầu **tác giả** (BE-B, BE-C) ghi "Deferred" trong `responses/`. PO không ghi thay vào tệp của vai khác (protocol mục 11 điều 4); bảng dưới chỉ cho số backlog để trỏ tới.

| Thẻ SEC | Người sửa | Mục backlog | Hạn |
|---|---|---|---|
| FB-R2-SEC-BE-74 | BE-C | R3-Q17 | Trước khi có dữ liệu thật |
| FB-R2-SEC-BE-75 | BE-C | R3-Q17 | Trước khi có dữ liệu thật |
| FB-R2-SEC-BE-79 | BE-C (BE-B review) | R3-Q17 | Trước khi có dữ liệu thật |
| FB-R2-SEC-BE-83 | BE-B | R3-Q22 | Trước khi có dữ liệu thật |
| FB-R2-SEC-BE-65 | BE-C | Không dời: SEC Verified 19/10 (C.15, cây làm việc – chạy lại trên commit chấm lại); việc còn lại tách thành FB-R2-SEC-BE-84 → **R3-Q33** | Phần (a) của BE-84 trước khi có dữ liệu thật |
| FB-R2-SEC-BE-82 (Suggestion, không bắt buộc) | BE-B, ARC | R3-Q25 | Trước bản dùng thử |
