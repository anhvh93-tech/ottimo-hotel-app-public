# SEC review – BUG-R3-014: chi hoàn lập lại kế hoạch hoàn; bất biến K11-06; người làm A32 không chi, không đặt nơi nhận

- Người review: SEC | Ngày: 24/10/2026 | Round 3 – Phản hồi & sửa (review PR tiền)
- Nhánh: `be-b/r3-bug-014`, **SHA `76e21c4`**. Mã nằm ở `8d54fbf` và `6bb20f7`; `76e21c4` chỉ thêm báo cáo.
- Căn cứ:
  - `qa/bug-list.md` BUG-R3-014;
  - critic `reviews/s1-money-critic-rerun.md` mục 5 (M-2, cùng biến thể "tiền miễn A32 bị chi theo duyệt cũ");
  - hợp đồng 0.3.8 bổ sung 6–7 (13.3, 13.4);
  - review trước của SEC: `s1-SEC-on-add3.md`, `s1-SEC-on-bug-012-013.md`.
- Đã đọc diff:
  - `folio.service.ts`: `replanRefundsAfterPayout`; `refundsDownToCredit` cắt cả yêu cầu đã duyệt, mới nhất trước;
  - `refunds.service.ts`: `assertNotA32Maker` ở `setRefundDestination` và `payOut` (tiền mặt + chuyển khoản), cùng việc lập lại kế hoạch sau khi chi.
- Dữ liệu dùng để kiểm: toàn bộ là dữ liệu giả. Máy đang tải cao nên chỉ chạy các tệp liên quan; container Postgres tạm đã gỡ ngay sau khi chạy.

## Kết luận

**Gộp được** ở `76e21c4`. **Không có Blocker, không có Major.**

**Biến thể của critic đã đóng: không tái hiện được.** Vì vậy BUG-R3-014 giữ mức **P1** và đóng được sau QA; **không nâng P0**.

| Hạng mục | Kết luận SEC |
|---|---|
| Bất biến K11-06 (BUG014-01) | Đạt. Sau mọi thay đổi tiền, gồm cả lần chi hoàn: Σ(yêu cầu chờ + phần còn phải chi của yêu cầu đã duyệt) ≤ `rawCreditVnd`. Phần vượt bị đóng `superseded`: cả yêu cầu chờ lẫn **yêu cầu đã duyệt**, mới nhất trước. Mỗi lần đóng có audit, báo người xin và người duyệt, và chạy hook xóa tài khoản nhận. Sau đó xin lại đúng phần còn lại, giữ nguồn, người xin và cấp duyệt. Không yêu cầu đã duyệt nào còn "giữ chỗ" cho tiền đến sau. |
| `SELF_REFUND_FORBIDDEN` cho người làm A32 (BUG014-02) | Đạt. Người làm A32 dưới OWN trên folio thì không đặt được nơi nhận, không chi được tiền mặt, không chi được chuyển khoản cho **mọi** yêu cầu hoàn của folio đó, kể cả yêu cầu nguồn `other`. Kiểm dưới khóa folio. OWN không bị chặn. |
| Lập lại kế hoạch sau khi chi | Đạt. Gọi trong cùng giao dịch và dưới khóa của lần chi. Folio `closed` thì không có lần chi nào. |

## Kiểm đã chạy
1. `r3-bug-014-payout-replan` (ca của ARC 13.4 + bất biến), `fuzz/bug-r3-014`, cùng ca dò biến thể của SEC: **6/6 đạt**.
2. Ca dò biến thể critic M-2 (không commit, đã xóa):

| Bước | Kết quả |
|---|---|
| MGR void dòng F&B 300.000 đã trả → yêu cầu `a32` 300.000, OWN duyệt, nơi nhận tiền mặt | `approved` |
| Lễ tân trưởng chi 100.000 → còn L = 200.000 | 201 |
| Ghi phát sinh 200.000 → tiền dư **0** | Yêu cầu đã duyệt (còn 200.000) → **`cancelled` `superseded`**, không còn duyệt cũ treo |
| MGR A32 hạ một đêm 150.000 → tiền dư 150.000 | Sinh **yêu cầu `a32` riêng** 150.000 (`pending`, origin = [MGR]); không bị duyệt cũ "nuốt" |
| Chi 150.000 theo duyệt cũ | **409** |
| MGR đặt nơi nhận cho yêu cầu mới / MGR duyệt / MGR chi | **403 / 403 / 403** |
| FD đặt nơi nhận, OWN duyệt, lễ tân trưởng chi | 200 / 200 / 201 – đường hợp lệ vẫn chạy |

Tiền miễn A32 không còn ra khỏi quỹ theo một lần duyệt cũ. Người làm A32 cũng không chạm được vào bất kỳ bước nào của yêu cầu hoàn trên folio đó.

## Thẻ feedback

### FB-R3-SEC-014-01
- Mức độ: Suggestion
- Vị trí: `refundsDownToCredit`, thứ tự cắt yêu cầu đã duyệt (mới nhất trước).
- Ý kiến:
  - Khi bất biến phải cắt một yêu cầu đã duyệt mà OWN vừa duyệt, rồi xin lại phần còn lại, thì bản xin lại giữ cấp duyệt (FB-1213-01), nhưng **OWN phải duyệt lại**. Như vậy là đúng về kiểm soát.
  - Đề xuất DOM/UXD: câu thông báo cho người duyệt nên nói rõ "duyệt trước đã đóng vì tiền dư giảm còn X", để OWN không tưởng là lỗi.
  - QA thêm bất biến fuzz I24 (critic): "không lần chi nào vượt phần tiền dư có lúc yêu cầu được duyệt".
- Trạng thái: Open

## Điểm làm tốt
1. Sửa bằng một **bất biến** áp ở mọi đường làm đổi tiền, không vá từng đường. Đường chi hoàn, đường critic chỉ ra là còn sót, nay đi qua cùng hàm.
2. Chặn người làm A32 ở cả ba bước còn lại của dòng tiền: đặt nơi nhận, duyệt, chi. Không còn khe "duyệt bởi người khác nhưng chi bởi chính mình".
