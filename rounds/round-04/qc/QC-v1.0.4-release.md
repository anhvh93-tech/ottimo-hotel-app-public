# QC – Quyết định phát hành production v1.0.4 (rút gọn) – 06/11/2026

Round 4 – Bước QC. Nguồn: `reviews/QC-on-drill-5.0-r3.md` (ĐK-1..6), `outputs/OPS/v1.0.4-staging-drill.md` mục 5.x/5.y, `qa/v1.0.4-stg-api-checklist.md` mục 5, `qa/bug-list-v1.0.4.md`, `reviews/PO-SEC-on-hd23-sal.md`, `reviews/SEC-on-pr91.md` (kết luận), `outputs/OPS/v1.0.4-release-runbook.md` r3.

QC **không duyệt deploy** và không chạy gì trên production. Quyết định này chỉ là cổng chất lượng.

## 0. Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

Chất lượng bản `sha-6414be25f20d` đủ cho production. Điều kiện còn lại là thủ tục phát hành: bảng 0.1 runbook chưa điền ô r3 (mục 2), và các bước bắt buộc trong lúc phát hành (mục 3).

## 1. Đối chiếu 6 điều kiện của QC-on-drill-5.0-r3

| ĐK | Yêu cầu | Bằng chứng | QC |
|---|---|---|---|
| ĐK-1 | C8 = RG-01 smoke-prod staging r3, 0 đỏ | 8/8 (checklist QA) | Đạt |
| ĐK-2 | K11 (c) 33/33 v2 | 33/33 v2 | Đạt |
| ĐK-3 | S14 (2)(3) INV chạy D6 | INV chạy 06/11 09:47, đúng 2 dòng `failed (…)` | Đạt |
| ĐK-4 | Ca 06/11 + chốt HD-23 | HD-28..31, CO-05(b) đạt; HD-27 inbox/attention đạt, chân SSE = hạn chế đo (cùng đường notify với HD-14, QA kết luận không bug); HD-23 PO+SEC ký lệch chấp nhận, ORC kiểm 2 điều kiện SEC trên staging (thân 404 giống nhau; confirm-deposit cùng 403/428) | Đạt |
| ĐK-5 | SEC đóng FB-R4-SEC-BE-RU-NL-01 | `SEC-on-pr91.md` kết luận: đóng; đường B không cần | Đạt (ORC xác nhận ô "Kết quả" 5.5 đã điền khi phát hành) |
| ĐK-6 | Production lên đúng `sha-6414be25f20d` | `git diff --name-only 6414be25 main -- product .github` rỗng: không commit mã sau 6414be25. Tag `v1.0.4` **chưa có trên origin** lúc QC đọc (`git ls-remote` rỗng) – ORC tạo tag trỏ `6414be25f20d51877e803fd5e71472c6b4b3c80b` | Đạt có ĐK (mục 3) |

Bug list: P0 037/038/046 (và 048 nhánh #83) đã sửa, đã gộp, đã qua staging trong các lượt trên; không lỗi P0/P1 mới từ diễn tập r3 và ca 06/11. P1 còn mở có từ trước (035, 039) không phải hồi quy v1.0.4, giữ như quyết định trước. Thẻ v1.0.5 (changeLocale, G-RU) không chặn.

## 2. Runbook 0.1 r3 – ô chưa điền (ORC phải điền trước P0/P5)

QC đếm 7 chỗ còn `⟨CHỜ SHA_V104 r3⟩` trong runbook (dòng trạng thái, `SHA_V104`, `TAG12`, `CI_RUN`, `API_DIGEST`/`WEB_DIGEST` + landing). Giá trị ORC phải ghi:

| Ô | Giá trị |
|---|---|
| `SHA_V104` | `6414be25f20d51877e803fd5e71472c6b4b3c80b` (merge PR #91) |
| `TAG12` | `sha-6414be25f20d` |
| `CI_RUN` | `41999716963` |
| digest api / web / landing (8+4) | `a3671e38…6423` / `68a47e58…3b47` / `6f224ed3…8a3d` |
| Dòng trạng thái đầu tệp (dòng 10) | bỏ "chờ gộp PR #91 rồi cắt lại", ghi r3 đã cắt |
| `RELEASE_AT` | điền lúc P6 (bình thường, không phải lỗi) |

Luật runbook: còn ô `⟨CHỜ …⟩` thì ORC không chạy bước nào trên production. Đây là điều kiện chặn số 1.

## 3. Điều kiện bắt buộc trong lúc phát hành

1. Điền đủ mục 2, commit local trước khi đẩy tag (luật đóng băng `main`: từ đẩy tag `v1.0.4` tới khi job `deploy production` xong không push `main`; commit tài liệu push sau).
2. Tag `v1.0.4` → `6414be25`; `release.yml` `resolve` thấy `CI_RUN` 41999716963 `completed success`.
3. **Sao lưu trước deploy** theo runbook (backup DB production, kiểm tệp tồn tại và kích thước khác 0) – không có bản sao lưu đạt thì dừng.
4. P1 ra đúng 31 tệp `product/infra`; P2b gói từ cây `afce70ad…`. Lệch thì dừng.
5. Sau deploy: K1 digest trùng mục 2; K2 72 migration + 4 băm; K3/K5 `ops-check` EXIT 0; N1–N6 (N4 = RG-35 như staging); RG-01 smoke-prod 0 đỏ; K11 bundle chỉ v2. T1–T4/N6a/N6b không áp dụng (đường A).
6. Bản quay lui = `sha-da6d6f3dc22b` (v1.0.3). Bất kỳ K/N nào đỏ: quay lui theo runbook mục 5, báo QC; `0d11db20` không lên production.
7. Ghi kết quả K/N vào runbook và gửi QC xác nhận sau phát hành.

ESC mới: không.
