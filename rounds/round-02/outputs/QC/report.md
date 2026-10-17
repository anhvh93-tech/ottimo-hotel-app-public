# Báo cáo QC – Round 2, Sprint 3 (cổng QC giữa round)

> Nội dung do QC soạn (17/10/2026). ORC ghi tệp hộ vì phiên QC không ghi được tệp này.

- Vai: QC | 17/10/2026 | Bước 6 (cổng sprint) | Code 6af7173, CI 38998735861 (7 job xanh, 2 job staging/GHCR bỏ qua)
- **Quyết định cuối: KHÔNG ĐẠT**, chấm lại rút gọn sau vòng sửa 9. Bản 2 này thay bản 1 (ĐẠT CÓ ĐIỀU KIỆN).
- Demo lần 1: chưa gửi tới khi xong ĐK-S3-10 rồi ĐK-S3-1.

## 1. Đã làm gì
1. **Bản 1:**
   - đọc log CI (test, E2E);
   - chạy `gen_traceability`, `gen_rbac_cases --check`;
   - đọc mã 5 story chính; thăm dò bản demo ở chế độ chỉ đọc;
   - kiểm ĐK-S2-1…7;
   - sửa `demo-1-limits` mục C;
   - ghi QC-S3-01…07.
2. **Bản 2**, xử lý 9 mục critic:
   - (1) Câu lý do sửa cho đúng phạm vi: 8 vòng kiểm chứng chỉ xét 7 Blocker và các chủ đề tiền, upload; khoảng 45/47 Major mới có tác giả tự ghi Done. ĐK-S3-5 mở rộng cho ARC, UXD.
   - (2) Kết quả SEC: gỡ chặn có điều kiện; thêm ĐK-S3-11 cho SEC-BE-53.
   - (3) K2: lỗi tiền BUG-R2-055…061 qua cổng nhờ ngoại lệ ORC (decision-log).
   - (4) Mục 1.1 ghi các ngoại lệ so với plan mục 4 và 7.
   - (5) Đề nghị PO hạ US-021, US-022.
   - (6) QC-S3-04 phủ TC-L3-011/032/074.
   - (7) Mốc demo: reset 12:31:47, giữ chỗ D5 hết hạn 17:31.
   - (8) Báo cáo này.
   - (9) K3: ARC-BE-S3-30 và UXD-FE-S3-20 (1) hạ xuống Minor.
3. Đọc mã, xác nhận 7 lỗi UXR (QC-S3-08). Phát hiện QC-S3-09: ca E2E-UI không bấm thật các bước ghi tiền và C3.
4. Đổi quyết định sang KHÔNG ĐẠT; lập ĐK-S3-9/10/11; ghi decision-log.

## 2. File tạo/sửa
- `qc/s3-qc-gate.md` (bản 2)
- `01-decisions/decision-log.md` (1 dòng)
- Bản 1 (đã commit 97c170b): `demo-1-limits.md` mục C

## 3. Giả định
- QA chốt mức lỗi UXR. B2 không đạt kể cả khi #2–#7 chỉ là P1.
- BUG-R2-061 cùng lớp S4-02/18 nên áp chung ngoại lệ ORC. ORC đã ghi rõ trong decision-log.
- Lỗi khóa #1 chỉ có ở demo/dev. Prod dùng `*_FILE` và chế độ strict.
- QC không đăng nhập demo; kết quả bấm giao diện lấy từ UXR.

## 4. Rủi ro / vướng mắc
- Sprint 4 quá tải.
- CI xanh chưa chứng minh giao diện chạy được (QC-S3-09).
- Chưa có staging, có nguy cơ không đạt nhóm A và B5 ở cổng cuối Round 2.
- Lượt 1 của TC-L3-011 hỏng mà bị lần chạy lại che đi, chưa rõ nguyên nhân.
- Cấm dùng dữ liệu khách thật tới khi xong SEC-G1, SEC-G2.

## 5. Việc chưa xong
- **Chấm lại rút gọn** khi đủ: ĐK-S3-9, CI xanh trên commit mới, ĐK-S3-3 bản 2, ĐK-S3-4.
- **Trước demo:** ĐK-S3-10, rồi ĐK-S3-1.
- **Trước cổng S4:** ĐK-S3-5, 6, 7, 11.
- **Khi có VPS:** ĐK-S3-8.
- QC chưa đọc mã UXR #8–#11; chưa chạy lại test SEC R1–R6; chưa kiểm thiết bị thật, VoiceOver, p95, Caddy prod.
