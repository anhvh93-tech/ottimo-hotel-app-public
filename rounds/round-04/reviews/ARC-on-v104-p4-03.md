# ARC review kỹ thuật – P4-03 `v104/ops-scripts` (OPS, +INT cho `mail-test.mjs`)

- Round 4 (v1.0.4), bước Review chéo (ma trận OPS → ARC, `plan-v1.0.4.md` 7.1), 04/11/2026
- Đầu nhánh `659e1774` (3 commit: `b8f75eeb`, `c6986f39`, `659e1774`), so với `origin/main` @ `7b5b6117`. Diff 8 tệp, +332 / −47:
  - `.github/CODEOWNERS` (mới), `.github/pull_request_template.md` (mới);
  - `infra/server/bin/{mail-test,requeue-email-changed}.sh`, `infra/server/mail-test.mjs`;
  - 2 tệp test, báo cáo OPS.
- Căn cứ:
  - `plan-v1.0.4.md` dòng P4-03 và brief mục 8; mục 4.1 (`.github/**`, `infra/server/**` = OPS);
  - `ARC-on-PR30-email-alert.md` FB-R4-ARC-OPS-PR30-10; ARC PR32-06 (lệnh `known-email-templates-cli`);
  - SEC PR32-S2, PR30-10, BE-018-01 (c), OPS-01 G4, V104-05.

## Phán quyết: **ĐẠT CÓ ĐIỀU KIỆN**

Không có Blocker hay Major. Điều kiện gộp:
- (1) CI `pull_request` xanh trên đúng đầu PR, gồm job `infra scripts` có ca `flock` trên ubuntu;
- (2) có `SEC-on-*.md` nêu đúng đầu PR. Nhánh này sửa chính `.github/CODEOWNERS` và mẫu PR, đều là đường dẫn SEC theo luật V104-05;
- (3) INT xác nhận `mail-test.mjs`.

Thẻ Minor 01 nên sửa luôn trong PR này: chỉ thêm vài dòng CODEOWNERS.

## 1. Đối chiếu việc giao

| Việc (plan P4-03) | Kết quả |
|---|---|
| PR32-S2: `requeue` so tag chính xác | **Đạt.** `${images##*:}` = `<tag><API_TAG_SUFFIX>`, không nhận hậu tố khác. Có 8 ca hậu tố, gồm registry có cổng (`##*:` vẫn lấy đúng phần tag) |
| PR30-10 (SEC): cửa test chỉ mở với ssh giả + ca 4c | **Đạt.** Cần đủ 3 điều kiện, trong đó `command -v ssh` = `$MTS_DIR/bin/ssh`. Có ca 4c và 4d |
| ARC PR30-10: địa chỉ không còn trong env của container | **Đạt, tốt hơn đề xuất.** Chương trình đi trong lệnh ssh dạng base64, chỉ gồm `[A-Za-z0-9+/=]`, có kiểm regex trước khi gửi. Stdin của ssh **chỉ** là dòng địa chỉ, đi thẳng qua `sudo` → `dc run -T` vào `node`. VPS không `read`, không biến, không `-e MAIL_TEST_TO`. `mail-test.mjs` từ chối khi env có `MAIL_TEST_TO`, nên không ai gõ theo thói quen. Dòng đầu stdin giữ tối đa 256 ký tự; bỏ `\r\n` và khoảng trắng hai đầu trước khi áp luật ASCII của INT |
| ARC PR32-06: `requeue` hỏi bằng lệnh của BE-A | **Đạt.** Kiểm `fs.existsSync(dist/admin/known-email-templates-cli.js)` trước. Node thoát 1 cả khi thiếu module, nên không thể dùng mã thoát để biết lệnh có hay không; OPS tách riêng bước này là đúng. Image v1.0.3 (bản thường gặp sau quay lui) dùng câu hỏi cũ. Hợp đồng 0/1/2 khớp `known-email-templates-cli.ts` trên `v104/be-identity` |
| CODEOWNERS: `field-policy.ts` → SEC (+ V104-05) | **Đạt.** Các dòng đều khớp tệp có thật: `field-policy.ts`, `serializer.test.ts`, `shared/email.ts` trên `main`; `shared-mailboxes.ts`, `email-address.ts` trên `be-identity`/`int-email`. Chú thích nói rõ đây là chỉ dẫn, không phải cổng chặn, đúng quyết định ORC 04/11 (không bật "Require review from Code Owners"). Còn thiếu đường dẫn: thẻ 01 |
| Mẫu PR có ô hoa hồng/thưởng (SEC-OPS-01 G4) | **Đạt.** Có thêm các ô: dữ liệu thử `…@example.test`, che ảnh, ô SEC theo CODEOWNERS (đòi tên tệp `SEC-on-*.md` nêu đầu PR), brand, migration |

## 2. Kiểm ARC đã chạy (worktree tách riêng, đầu `659e1774`)

| Kiểm | Kết quả |
|---|---|
| `CI=true bash product/infra/server/test/mail-test-send.test.sh` (Mac, node có sẵn) | 35 passed, 0 failed (gồm phần 2: M1–M9 chạy chính `mail-test.mjs` bằng `node -e`) |
| `CI=true bash product/infra/server/test/requeue-email-changed.test.sh` (Mac) | 63 passed, 0 failed. Ca khóa deploy SKIP vì Mac không có `flock`; CI ubuntu có. OPS báo 65/65 trên `ubuntu:24.04` |
| Đọc tay lệnh từ xa của `mail-test.sh` | Bash (dấu nháy kép) và `sh -c` trên VPS (dấu nháy đơn) bóc dấu nháy đúng hai lớp: VPS nhận `-e "$(printf %s <b64> \| base64 -d)"`. Base64 dài khoảng 7,5 KB (`mail-test.mjs` 5,6 KB), xa dưới `MAX_ARG_STRLEN` 128 KB của Linux |
| `git merge-tree` với `origin/main`, `v104/ops-deploy-order` | sạch |

## 3. Thẻ

### FB-R4-ARC-OPS-P403-01
- Mức độ: Minor
- Vị trí: `.github/CODEOWNERS`.
- Vấn đề: theo luật V104-05, ORC so `git diff --name-only` với **các dòng SEC trong CODEOWNERS** để quyết PR nào cần review SEC. Đường dẫn nào không có trong tệp thì PR sửa nó không bị đòi SEC. Hiện tệp còn thiếu chính các lớp chặn SEC dựa vào:
  - `/.gitignore`: dòng `00-brief/context/pricing/` là G1 của SEC-on-commission-numbers. Bỏ dòng này thì bảng nội bộ có thể bị commit;
  - `/.github/workflows/` và `/.github/gitleaks.toml`: job `gitleaks` cùng danh sách bỏ qua (allowlist), job `confidential-paths` (G2, P4-04 sẽ thêm), và các bước test ghim. Sửa workflow hoặc thêm một dòng allowlist là tắt được cổng;
  - `/product/infra/postgres/init/02-roles.sh`: giới hạn vai `ottimo_app` (SEC H3), vai chỉ đọc/requeue P4-04;
  - `/product/infra/server/bin/mail-test.sh`, `/product/infra/server/mail-test.mjs`: đường đi của địa chỉ thử (SEC PR30-04/05/10).
- Vì sao quan trọng: CODEOWNERS ở đây là danh sách để ORC đối chiếu, không phải cổng của GitHub. Thiếu một dòng nghĩa là có một đường để sửa lớp bảo vệ mà không qua SEC.
- Đề xuất sửa: thêm các nhóm dòng trên, mỗi dòng có chú thích vai (như các dòng hiện có). Hệ quả cần biết: PR-M (P4-04, sửa `ci.yml` và `02-roles.sh`) sẽ cần `SEC-on-*.md`. Điều này đúng ý SEC-OPS-01 G2.
- Trạng thái: Open

### FB-R4-ARC-OPS-P403-02
- Mức độ: Suggestion
- Vị trí: `bin/requeue-email-changed.sh`, kiểm 2 (`[ "${images##*:}" = "$want_tag" ]`).
- Vấn đề: lệnh chỉ so phần tag, không so tên repository của image. Compose dựng tên image từ `API_IMAGE` nên rủi ro thật gần như bằng 0. Nhưng `deploy.sh` kiểm cả tham chiếu đầy đủ, nên hai nơi đang không đối xứng.
- Đề xuất: so `"$images" = "$(envval API_IMAGE):$want_tag"`. Giữ ca "registry có cổng".
- Trạng thái: Open

### FB-R4-ARC-OPS-P403-03
- Mức độ: Suggestion
- Vị trí: `mail-test.mjs` (kiểm `EMAIL_PROVIDER` đứng **trước** lúc đọc stdin); runbook v1.0.4 5.0 S14.
- Vấn đề: chưa có cách chứng minh G3 trên VPS thật (G3: `dc run -T` chuyển stdin vào container) trước lần `--send` thật đầu tiên trên production.
  - S14 chạy `--verify-only` trên staging (`EMAIL_PROVIDER=mock`). Lượt này chứng minh đường `node -e`, nhưng `--verify-only` không đọc stdin.
  - Chạy `--send` trên staging cũng không chứng minh được: chương trình dừng ở kiểm provider trước khi đọc dòng địa chỉ.
- Đề xuất: khi không phải `--verify-only`, đọc và kiểm dòng địa chỉ **trước**, rồi mới kiểm provider. S14 thêm hai lượt `--send` trên staging:
  - gõ dòng rỗng: phải ra `failed (address on stdin is missing or invalid)`;
  - gõ một địa chỉ `…@example.test`: phải ra `failed (EMAIL_PROVIDER is not smtp)`.

  Hai kết quả khác nhau chứng minh stdin tới được node. Không có thư nào được gửi, vì staging dùng `mock`. Thêm ca M10 vào test.
- Trạng thái: Open

### FB-R4-ARC-OPS-P403-04
- Mức độ: Suggestion
- Vị trí: `.github/workflows/ci.yml` job `infra-scripts` (không có `setup-node`); báo cáo OPS G1.
- Vấn đề: phần 2 của `mail-test-send.test.sh` dùng node có sẵn trên runner. Với `CI=true`, thiếu node thì test đỏ, không lặng lẽ qua; nhưng phiên bản node thì phụ thuộc vào image runner.
- Đề xuất: P4-04 (chủ `ci.yml`) thêm `actions/setup-node` ghim đúng SHA như các job khác, `node-version` bằng bản của image api.
- Trạng thái: Open

### FB-R4-ARC-OPS-P403-05
- Mức độ: Suggestion
- Vị trí: `bin/requeue-email-changed.sh` nhánh `has_cli=0`.
- Vấn đề: nếu lệnh `known-email-templates-cli.js` bị lỗi lúc nạp (ngoại lệ không bắt), node thoát 1, và script hiểu là "không biết mẫu" với câu gợi ý "(v1.0.2?) – go up to v1.0.3". Hướng xử lý vẫn an toàn (`REFUSED`), nhưng câu báo dẫn người chạy sai hướng.
- Đề xuất: ở nhánh có tệp lệnh, mã 1 báo "worker image does not render email_changed (or the command failed)". Hoặc hỏi `--list` và kiểm JSON có `email_changed`.
- Trạng thái: Open

## 4. Điểm làm tốt
- Đường đi của địa chỉ thử nay chỉ còn stdin và bộ nhớ của node, gọn hơn đề xuất của ARC. Lệnh từ xa không thể vỡ vì dấu nháy.
- Không dùng mã thoát của node để đoán "có lệnh không". Bẫy "thiếu module cũng thoát 1" được tách riêng và có test.
- CODEOWNERS ghi rõ đây chỉ là chỉ dẫn, không phải cổng, và nêu cổng thật nằm ở đâu. Repo một tài khoản thì không đặt kỳ vọng sai về GitHub.
