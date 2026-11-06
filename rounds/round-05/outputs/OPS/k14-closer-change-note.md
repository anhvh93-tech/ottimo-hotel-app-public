# OPS – Ghi chú K14: truy vấn người chốt DOM 1H-01 (Round 5, Sản xuất, 07/11/2026)

Việc: thẻ SEC FB-R5-SEC-ARC-1I-02 (phần OPS), cho DOM FB-R5-DOM-ARC-1H-01 và hợp đồng 0.3.13 mục 1.30 (#152). Chi tiết ở runbook `v1.0.5-release-runbook.md` bước **K14**.

## 1. Đã làm gì
- **Câu đếm** `k14-closer-change-counts.sql`, tệp riêng cạnh runbook, ghim SHA-256. In 8 dòng đếm:
  - (a) đơn đổi người chốt sau nhận phòng, tách đang ở / đã trả phòng / trạng thái khác;
  - (b) đơn có dòng hoa hồng sống mà người hưởng khác người chốt, tách đã đạt / dự kiến / Desk tự sửa lúc trả phòng.
- **Câu danh sách** `k14-closer-change-list.sql` (K14-L), ghim SHA-256. Mỗi đơn một dòng: mã đơn, trạng thái, ngày, vai, nhãn việc. Chỉ chạy khi INV cần, chỉ hiện trên Terminal của Mac INV.
- **Runbook K14:** điều kiện chạy (bản có #154, SEC đã ghim, DOM xác nhận, SHA trùng), lệnh trích, hai khối chạy cùng khuôn `v530-run`, bảng "Đúng là", phép kiểm số khớp, ghi gì ở đâu, câu báo INV, hai câu đồng ý mẫu. Bảng 0.1 thêm `K14_PIN`, `MERGE_154`. Mục 0.2, 6, 7, 8 cập nhật.
- **Chạy thử** trên DB dùng một lần: `postgres:17-alpine`, `--network none`, `02-roles.sh` thật, đủ 72 migration, dữ liệu giả có chuỗi đánh dấu. 13 ca ra đúng; không lộ chuỗi đánh dấu, tỷ lệ, số tiền hay uuid; dòng gác dừng đúng; khối chạy dừng khi câu đổi một byte. Container và tệp tạm đã xóa.
- Không SSH, không chạy gì trên staging hay production.

## 2. Bản ghim OPS đề xuất (chờ SEC)

| Thứ | SHA-256 |
|---|---|
| `k14-closer-change-counts.sql` (75 dòng, 4 954 byte) | `536ecbade9a84b15d5b6a3f78f851ea4afc3b77cbc6a9e0e1914a1b89b881275` |
| Khối `k14-run` (6 dòng, 861 byte) | `9c109725ef333676c2ec2941a0a952187afe6846a7f1929f25dc847f65d28d00` |
| `k14-closer-change-list.sql` (94 dòng, 6 317 byte) | `84886b970bdf544ec129075aa03c9d1e043dd087108eb0e41dea7c8b18f1046d` |
| Khối `k14-list-run` (6 dòng, 874 byte) | `131e33920be9b8012287b7adce0f86e915c6dd846d973c9235223493dbfb5ce5` |

Các bản ghim cũ không đổi: `v525-run` `60872413…41eb`, `v530-run` `4f89c218…32ab`, `v530-check` `c13c4d68…0d71`.

## 3. Luật dữ liệu
- Câu đếm không chọn tên, username, id, mã đơn, ngày, số tiền, tỷ lệ, lý do hay cột khách. Chỉ tách theo trạng thái, không theo loại người hưởng hay theo người.
- Repo chỉ ghi `= 0` / `> 0`. Số chính xác ORC báo INV trong chat với INV, như K13.
- Danh sách chỉ có mã đơn là thứ định danh. Danh sách không vào repo, PR, commit, chat, subagent, tệp hay log. Tên người INV xem trên Desk.

## 4. Giả định (runbook mục 8, "Giả định K14")
- (a) Không lọc loại đơn, đúng chữ DOM; có thể đếm thừa.
- (b) "Sau nhận phòng" = `changed_at ≥ actual_checkin_at`.
- (c) Nhãn "Desk tự sửa lúc trả phòng" dựa vào `ensureCommission` của #154 @ `4e81c3be`.
- (d) Danh sách không có tên người: lệch cột DOM 1H-01, INV xem tên trên Desk.
- (e) INV tự dán một dòng lệnh vào Terminal trên Mac để xem danh sách. SEC chọn cách này hay cách khác.
- (f) Tệp SQL đặt cạnh runbook, bảo vệ bằng SHA. Có thể thêm dòng CODEOWNERS nếu SEC muốn.
- (g) Không thêm tên máy, IP hay bí mật mới.

## 5. Việc chưa xong, người làm tiếp
- **SEC:** duyệt và ghim bốn SHA trước lần chạy đầu. Chọn kênh (e).
- **DOM:** xác nhận định nghĩa đếm và giả định (a)–(d).
- **ARC:** một dòng ở 0.3.14 hoặc 1.30: "chạy theo khối runbook K14 đã ghim, như K13" (SEC 1I-02).
- **ORC:** điền `MERGE_154` khi #154 gộp, và `K14_PIN` khi SEC ghim. Chạy K14 ngay sau K5 của lần Release có #154. Nếu #154 vào v1.0.5, nên có bản ghim trước lúc cắt, vì đơn đang ở cần INV quyết trước lúc trả phòng.

ESC mới: không.
