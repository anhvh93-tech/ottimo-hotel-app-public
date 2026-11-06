# QA – Phản hồi thẻ review, Round 5

- Tác giả: QA | Ngày: 07/11/2026

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-DOM-QA-BR438-01 | Done | `product/tests/fixtures/br-examples.json`, theo DOM review PR #110 mục 3.5:<br>- `source` của BR-438-01, -02, -05 → `minibar_check`; BR-438-04 → `checkout`;<br>- thêm khóa `typedByHand` ở BR-438-01…05; không đổi `expected`;<br>- thêm BR-438-07 (trả muộn B15 lưu `manual`, FD/FDL chặn, MGR được);<br>- thêm BR-438-08 (đếm lại minibar, ca a–g, `pendingFix` FB-R5-SEC-BE-V516-01, chờ PR BE-A2 `r5-v516-minibar`);<br>- `validate-fixtures.mjs`: 0 lỗi.<br>Ca kiểm: `rounds/round-05/qa/v1.0.5-test-cases.md` mục 2. Ý "có trong đóng ca" của BR-438-01 dời v1.0.6 (DOM 3.2). BR-438-04 hỏi lại DOM: dòng B18 luôn nằm trên folio `settled` (thẻ FB-R5-QA-DOM-BR438-01, `reviews/QA-on-DOM-br438-oracles.md`) |
