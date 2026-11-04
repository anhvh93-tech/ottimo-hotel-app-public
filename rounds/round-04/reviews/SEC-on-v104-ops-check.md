# SEC review P4-04 `v104/ops-check` – runbook v1.0.4 r0

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** (sớm, trên bản r0) | 04/11/2026
- Đối tượng: `origin/v104/ops-check` @ **`a183b82d`** (5 commit `447bc40d` → `a183b82d`). So với `origin/main` @ `7b5b6117`: nhánh chỉ có **một** tệp, `rounds/round-04/outputs/OPS/v1.0.4-release-runbook.md` (745 dòng). Phần mã của P4-04 (`ops-check.sh`, README, CI `confidential-paths`, `02-roles.sh`) chưa có, làm sau `main@L`.
- Runbook tự ghi "ARC và SEC review bản r1". Lượt này là review **sớm** theo yêu cầu ORC: chốt hướng và các luật dữ liệu để r1 không phải làm lại. SEC vẫn review r1 (và phần mã P4-04) trước P0.
- Căn cứ: SEC-on-plan-v1.0.4 (mục 3 ED-02, mục 6.4–6.5), SEC-on-v104-email-identity (V104-04, V104-05), SEC-on-commission-numbers (G1–G4), SEC-on-PR30 (PR30-01 digest 8 + 4), SEC-on-PR32 (PR32-S1).
- Không chạy lệnh nào trên staging/production. Không sửa tệp nào ngoài tệp này.

---

## 0. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN (cho r0).** Không có thẻ Blocker hay Major. Một thẻ Minor, hai thẻ Suggestion. Điều kiện là các mục ở 0.1, kiểm lại ở r1.

Kiểm theo yêu cầu ORC:

| Kiểm | Kết quả |
|---|---|
| Bí mật (khóa, mật khẩu, token) | **Không có.** Không lệnh nào in `.env` hay `secrets/`. Đọc `.env` đều vào biến trên máy chủ, chỉ in PASS/FAIL/số |
| IP VPS | **Không có** (quét IPv4: 0). Lệnh dùng tên máy, như các runbook trước |
| Email thật | Chỉ có: tên đăng nhập SSH dạng `ottimo-admin@desk.<tên miền>` (đã có trong các runbook trước trên `main`) và `info@` ở tên miền thương hiệu trong câu kiểm K5b. Đây là địa chỉ liên hệ **công khai** của cơ sở (đã có trên landing và nhiều tệp `main`), không phải địa chỉ cá nhân. Mẫu chỉ dùng `…@example.test`. P2d đúng luật V104-04: không địa chỉ qua chat, INV/OWN tự gõ ở dấu nhắc |
| Digest đầy đủ | **Không có.** Luật đợt "chỉ in 8 + 4" có ở đầu runbook. Lệnh S0 cắt bằng `sed` từ tệp hoặc `RepoDigests`, không in chuỗi 64 ký tự. Không có chuỗi hex ≥ 20 ký tự nào trong tệp |
| SQL ghi tay trên production | **Không có.** Mọi khối SQL (P2, P2e, K2, K3, K3b, K9, K10, K11) là `SELECT`/`SHOW`, chạy qua `SQLRO` với `default_transaction_read_only=on`, dòng đầu phải là `on`. Mục 6 cấm cả `session_replication_role = replica` và `pg_restore --disable-triggers`. H05 chỉ OWN đặt trên Desk, không dùng `publish-privacy-notice.sql`. Dữ liệu lệch (LEASE_BASE, P2e, K11 d) chỉ báo vai sở hữu, không sửa bằng SQL |
| Dữ liệu cá nhân | Câu SQL chỉ chọn `count(*)`, tên trigger/ràng buộc, cờ, khóa cấu hình, `notice_version`/`locale`/`channel`. Không chọn tên, điện thoại, email, giấy tờ, `payload` |
| Số hoa hồng | P2e đếm dòng, **không** chọn `value`. Không tỷ lệ hay số tiền nào trong tệp (SEC G3). Tin nhắn tag P4 có câu nhắc không ghi số hoa hồng |
| Quay lui `sha-da6d6f3dc22b` không lùi DB | **Có** (mục 1.3, mục 5, mục 6). Không restore, không xóa tay cột/khóa/trigger. Có R2b (P2e trước quay lui) |
| ED-02 trong runbook | 0094 có ở bảng 1.3, K3b kiểm `room_list_price_append_only\|O\|f` (khớp test (d) của BE-C: `prosecdef = false`). Không bật/tắt tay. Câu mô tả ảnh hưởng quay lui cần sửa (thẻ P404-01) |
| Thông báo khách `privacy-2026-10-v2` | Thứ tự N1–N6 đúng SEC 6.4 ý 5: deploy → thay tờ → cùng ngày OWN đặt H05 → SEC kiểm → mở lại check-in online. Không đặt H05 về v1 sau N2. Lượt đồng ý thử chỉ ở staging. K11 (d) SEC chạy sau khách thật đầu tiên, chỉ số đếm. **Đạt** |

### 0.1 Điều kiện cho r1 (SEC kiểm lại trước P0)
1. `SQLRO` và các kiểm DB của `ops-check` chạy bằng vai `ottimo_readonly` trong giao dịch READ ONLY (PR32-S1, PR30-09). r0 vẫn dùng `$POSTGRES_USER` với `PGOPTIONS` read-only: chấp nhận cho r0 vì câu là hằng trong runbook, nhưng r1 phải đổi khi P4-04 có vai này.
2. Job CI `confidential-paths` (G2) có trên `main` và đã thử đỏ (thêm tệp khớp đường dẫn bảng nội bộ), trước P0. Không đưa danh sách số vào CI.
3. Ô `⟨CHỜ P4-10⟩` của R3b/S5 là câu `count(*)`, không chọn `payload`.
4. Câu kiểm dạng địa chỉ ở P2c bước 2 và P2d bước 3 chuyển vào `ops-check` dùng chung luật với `email_ascii` (đã ghi ở "Việc còn lại"), để shell và adapter không lệch luật.
5. Sửa câu 0094 theo thẻ P404-01.

## 1. Thẻ

### FB-R4-SEC-OPS-P404-01
- Mức độ: Minor
- Người làm: OPS (runbook r1); cùng nội dung với FB-R4-SEC-BE-P411-01 (BE-C sửa chú thích migration)
- Vị trí: runbook mục 1.3 dòng 0094 cột "Ghi chú cho quay lui"; R7 (hệ quả quay lui)
- Vấn đề: runbook ghi "v1.0.3 hủy giá có hẹn của dòng giá đầu tiên (BUG-R4-015) có thể bị trigger chặn". Câu này không đúng cơ chế:
  - trigger chỉ chặn dòng có `effective_from` ≤ **ngày lịch hôm nay theo tz của property**;
  - lớp dịch vụ (cả v1.0.3 lẫn v1.0.4) chỉ cho hủy dòng có ngày > **ngày kinh doanh** (`businessDate`, đổi ngày ở `business_day_rollover`);
  - nên trường hợp thật sự bị chặn là: hủy giá hẹn cho **đúng ngày lịch hôm nay** trong khoảng 00:00 → giờ đổi ngày kinh doanh. Khi đó dịch vụ cho qua, trigger chặn, Desk thấy lỗi máy chủ chung (500). Dòng giá đầu tiên ở tương lai thì trigger **không** chặn.
- Vì sao quan trọng: ORC báo sai hệ quả cho lễ tân/INV ở R7. Người trực sẽ tìm lỗi ở chỗ không có lỗi.
- Đề xuất sửa: thay câu bằng ý trên, cho cả v1.0.3 và v1.0.4. Hệ quả: an toàn về dữ liệu (không xóa được giá đã đến ngày), chỉ là một lỗi chung trong khung giờ đêm. Cách làm: chờ qua giờ đổi ngày kinh doanh rồi đặt giá mới thay vì hủy. Nếu BE-C làm thẻ P411-01 (dịch vụ trả 409 `effective` theo ngày lịch) thì v1.0.4 không còn 500, chỉ còn v1.0.3 khi quay lui.
- Trạng thái: Open

### FB-R4-SEC-OPS-P404-S1
- Mức độ: Suggestion
- Vị trí: P2d bước 2a và 2b (`state/env.before-shared-mailboxes.*`)
- Vấn đề: mỗi lượt sửa `.env` để lại một bản sao `.env` đầy đủ trong `state/` (quyền giữ nguyên nhờ `cp -p`). Khuôn E2 của v1.0.3 cũng vậy. Bản sao có thể chứa giá trị cấu hình nhạy cảm, tồn tại lâu, và nằm ngoài quy trình xoay vòng bí mật.
- Đề xuất sửa: sau K5b đạt, xóa bản sao của lượt này (hoặc giữ tối đa tới hết ngày Release). Ghi số `BACKUPS` sau khi xóa. Không in nội dung.
- Trạng thái: Open

### FB-R4-SEC-OPS-P404-S2
- Mức độ: Suggestion
- Vị trí: 5.0 S16 ("Chụp màn chỉ khối thông báo"), và bất kỳ ảnh nào của biên bản `v1.0.4-staging-drill.md`
- Vấn đề: staging dùng dữ liệu thử, nhưng ảnh vẫn phải qua kiểm che trước khi commit (luật G4 và luật ảnh dữ liệu khách).
- Đề xuất sửa: thêm một câu "Ảnh chỉ commit sau khi QA kiểm che (dữ liệu khách, dòng hoa hồng/thưởng)" ở S16.
- Trạng thái: Open

## 2. Điểm làm tốt
- Luật dữ liệu của đợt đặt ngay đầu runbook và lặp lại ở mục 6 "Khi nào dừng".
- P2d xử lý đúng bài toán hộp thư chung mà không ai phải gõ hay đọc địa chỉ trong chat: tên miền lấy từ `EMAIL_FROM` trên máy chủ, INV tự gõ ở dấu nhắc nếu có thêm.
- P2e/R2b bắt đúng rủi ro quay lui thật của hoa hồng (v1.0.3 trả 500) mà không chạm giá trị tỷ lệ.

## 3. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – review sớm runbook v1.0.4 r0 (ops-check @ a183b82d): ĐẠT CÓ ĐK** (rounds/round-04/reviews/SEC-on-v104-ops-check.md): không bí mật, IP, email cá nhân, digest đầy đủ; mọi SQL READ ONLY, chỉ số, không SQL ghi tay, quay lui không lùi DB; N1–N6 đúng SEC 6.4. Điều kiện r1: SQLRO/ops-check bằng ottimo_readonly, CI confidential-paths có và đã thử đỏ trước P0, câu R3b/S5 chỉ count(*), luật địa chỉ chung trong ops-check, sửa câu 0094 (Minor P404-01: chặn chỉ ở khung 00:00 → giờ đổi ngày kinh doanh). Suggestion S1 (xóa bản sao .env sau K5b), S2 (kiểm che ảnh S16). SEC review lại r1 + mã P4-04 | SEC | Quyền SEC |`
