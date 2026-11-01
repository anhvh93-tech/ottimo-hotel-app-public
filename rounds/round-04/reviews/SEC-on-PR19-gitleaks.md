# SEC duyệt PR #19 – allowlist gitleaks cho token giả `pe1` (Round 4 · QC điều kiện M1)

- PR: anhvh93-tech/ottimo-hotel-app-public#19 · nhánh `ops/gitleaks-test-token` · commit `43f4d545` · base `main`
- Thay đổi: 1 file `.github/gitleaks.toml`, +6/-0 (5 dòng chú thích + 1 regex trong `[allowlist].regexes`)
- Người duyệt: SEC · Ngày: 01/11/2026

## Kết luận: **DUYỆT**

Chuỗi là giả, không mở được gì; allowlist khớp đúng một giá trị, không tắt rule, không allowlist đường dẫn hay commit; job `gitleaks` trên PR xanh sau khi quét cả lịch sử có chứa commit gây lỗi. Điều kiện M1 về phía bảo mật đã đạt.

## Bằng chứng

### 1. Chuỗi là giả (không phải token HMAC thật)
- Vị trí: `product/apps/landing-web/src/scripts/booking.test.ts` dòng 452 (commit `a29f7395`), giá trị mẫu `estimateToken` trong fixture unit test của landing.
- Giải mã base64url từng phần:
  - `eyJydCI6InN0YW5kYXJk` → `{"rt":"standard` (JSON bị cắt, không parse được)
  - `c2ln` → `sig` (3 byte)
- Đối chiếu bộ kiểm token thật `product/services/api/src/modules/public-site/internal/estimate-token.ts` (nhánh `lp-v2`): token thật = `pe1.` + payload + `.` + base64url(HMAC-SHA256, 32 byte ≈ 43 ký tự), khóa là sub-key HKDF dẫn xuất lúc chạy, không nằm trong repo. Hàm verify so độ dài rồi `timingSafeEqual` trước khi parse payload, nên chuỗi `c2ln` bị loại ngay ở bước chữ ký (`reason: 'signature'`); dù qua được thì payload cũng hỏng (`reason: 'format'`).
- Bản chất token: chỉ ràng buộc một báo giá tham khảo trên web công khai, không phải token xác thực hay phiên; kể cả token thật cũng không mở quyền truy cập dữ liệu khách. Rủi ro lộ: không có.

### 2. Allowlist đủ hẹp
- Regex: `'''^pe1\.eyJydCI6InN0YW5kYXJk\.c2ln$'''`. Có neo `^…$`, dấu chấm được escape, không có ký tự đại diện. Nó chỉ khớp đúng một chuỗi literal.
- Nằm trong `[allowlist].regexes`; gitleaks v8.21.2 mặc định so regex này với **giá trị secret phát hiện được** (regexTarget = secret), không so với cả dòng hay cả file.
- Không đụng `[extend] useDefault = true`: rule `generic-api-key` và mọi rule mặc định vẫn bật.
- Không thêm `paths` (file `booking.test.ts` vẫn được quét toàn bộ), không thêm `commits`, không thêm `stopwords`.
- Mọi chuỗi `pe1.` khác (kể cả token thật nếu có ai lỡ dán vào repo) vẫn bị quét như cũ.
- Chú thích ghi rõ lý do, vị trí, commit và mục QC M1, đúng quy ước "mỗi mục allowlist có lý do" ở đầu file.

### 3. CI gitleaks xanh trên PR
- `gh pr checks 19`: `gitleaks` **pass** (30s), run `41303465606`, job `124839003422`.
- Log job: checkout `fetch-depth: 0` lấy mọi nhánh, gồm `origin/lp-v2-fe` (chứa `a29f7395`); `581 commits scanned … no leaks found`.
- Đối chứng: run trên `main` cùng thời điểm (run `41303287472`, job `124838796990`) **failure** với đúng 1 phát hiện: `RuleID generic-api-key · File booking.test.ts · Line 452 · Commit a29f7395` (580 commits). PR chỉ thêm 1 commit, và phát hiện duy nhất đó biến mất. Như vậy allowlist khớp đúng giá trị và không che phát hiện nào khác.
- Ghi chú: lúc duyệt, 2 job không liên quan tới thay đổi này (`docker images build · E2E smoke`, `landing LP-v1 · Playwright`) còn pending. PR chỉ sửa file cấu hình gitleaks nên SEC không chờ hai job này, nhưng vẫn phải để branch protection xử lý khi merge.

## Thẻ feedback

### FB-R4-SEC-OPS-01
- Mức độ: Suggestion
- Vị trí: quy ước viết test (landing-web, api); `.github/gitleaks.toml` `[allowlist].regexes`
- Vấn đề: Đây là mục allowlist thứ 3 sinh ra chỉ vì giá trị giả trong test trông giống khóa có entropy cao. Test BE (`lp-v2-be-units.test.ts:513`) dùng `pe1.abc.def` thì không bị bắt.
- Vì sao quan trọng: Allowlist càng dài thì càng khó rà soát, và người sau dễ quen tay thêm mục rộng hơn.
- Đề xuất sửa: Từ nay, token giả trong test dùng dạng entropy thấp, nhìn là biết giả (ví dụ `pe1.abc.def`, `pe1.e30.c2ln`). Không cần sửa lại commit cũ: lịch sử đã có `a29f7395`, nên allowlist của PR này vẫn cần. Nếu sau này FE đổi fixture thì giữ nguyên mục allowlist, vì lịch sử vẫn còn chuỗi cũ.
- Trạng thái: Open

## Điểm làm tốt
- Neo đúng một giá trị thay vì allowlist file hay commit, nên mọi rule vẫn bật cho phần còn lại của file test.
- Chú thích đủ lý do, vị trí, commit, đối chiếu với cơ chế ký thật, nên người rà sau không phải đoán.
- Có đối chứng CI đỏ trên `main` và xanh trên PR với số commit quét chênh đúng 1.
