# ARC review kỹ thuật – P4-04 `v104/ops-check` (OPS, PR-M) – phần runbook

- Round 4 (v1.0.4), bước Review chéo (ma trận OPS → ARC, `plan-v1.0.4.md` 7.1), 04/11/2026
- Đầu nhánh `a183b82d` (5 commit, `447bc40d` → `a183b82d`), so với `origin/main` @ `7b5b6117`. Diff 1 tệp: `rounds/round-04/outputs/OPS/v1.0.4-release-runbook.md` (+745).
- Phạm vi:
  - Nhánh **chỉ có runbook**. Phần mã của P4-04 chờ `main@L` + P4-13 theo plan: `ops-check.sh`, test `ops-check*`, README 5.0/12.3/13.8, CI `confidential-paths`, `02-roles.sh`, có thể thêm migration GRANT. Bài này **chưa** review phần mã đó.
  - Đầu tệp ghi "r0, bản nháp", còn decision-log 04/11 gọi `a183b82d` là "r1". Bài này xem bản ở `a183b82d` như bản nháp r1 trước `main@L` (thẻ 06).
- Căn cứ:
  - `plan-v1.0.4.md`: dòng P4-04, mục 2.2 (số migration), mục 4.1, mục 6 ý 8;
  - `ARC-on-PR32.md` mục 1 (FB-R4-OPS-ARC-31-01);
  - hợp đồng 0.3.12 (`outputs/ARC/v1.0.4-contract-0.3.12.md`, câu trả lời Q1/Q4);
  - decision-log 04/11: BE-B Q2, BE-C Q3 (bỏ 0096), ORC P2d, K11, H05.

## Phán quyết: **ĐẠT CÓ ĐIỀU KIỆN** (về hướng của runbook) – PR-M **chưa gộp được**

- Không có Blocker hay Major ở runbook.
- Cách làm đúng kiến trúc:
  - quay lui chỉ đổi image, không lùi DB, không SQL tay;
  - thứ tự deploy theo P4-02;
  - P2e chặn đúng rủi ro 500 của v1.0.3 khi thiếu dòng hoa hồng;
  - H05 theo đúng thứ tự SEC;
  - LP-v2 vẫn trơ với khách;
  - SQL chỉ đếm.
- PR-M gộp sau khi có phần mã, và ARC review lại bản r1 (sau `main@L`) cùng phần mã đó.
- Trước r1, OPS sửa các thẻ 01–05. Thẻ 01 và 02 chỉ cần chép câu trả lời đã có.

## 1. Đối chiếu tiêu chí P4-04 (phần runbook)

| Tiêu chí plan | Kết quả |
|---|---|
| S0 digest (D1) | Có ở 5.0. Hai nguồn: tệp `state/digests/<tag>`, hoặc `RepoDigests` trên máy; chỉ in 8 + 4 ký tự |
| Migration 0092–0095 chỉ nới/thêm; bảng tương thích khi chạy v1.0.3 trên DB mới | Có (1.3). 0094 ghi đúng hệ quả: trigger chặn xóa thì ra lỗi máy chủ, không xóa sai. Còn lệch số GRANT (thẻ 02) |
| Quay lui `sha-da6d6f3dc22b` không lùi DB | Có (mục 5, R1–R8). `--rollback` nhận DB đi trước journal. Không restore, không xóa tay CHECK/trigger |
| Thứ tự deploy mới | Có (1.4, K1, R5, 5.0 S3/S9). P2b kiểm gói có `switch_worker`/`switch_api` (`grep -c` = 2, khớp đúng 2 dòng trong `deploy.sh` `eef44c02`) |
| LP-v2 trơ: `LANDING_LOCALES=en,vi`, `public_show_prices=false` | Có (1.5, P2b bước 4, K10). Landing không deploy lại |
| Đếm đơn dài hạn nhận phòng trước v1.0.4 có `departure_date ≠ booked_departure_date` | Có (1.6, P2, K9), chỉ đếm |
| Bỏ 0096; P2e/R2b kiểm khóa hoa hồng | Có. Câu P2e khớp `ParameterService.get`: dòng `property_id + key` có `effective_from <= asOf`, không có thì lấy `default_value`, vẫn không có thì `ParameterMissingError`. Bảng không có cột kết thúc, nên chỉ cần đếm `effective_from <= current_date`. Không đọc `value` |

## 2. Thẻ

### FB-R4-ARC-OPS-P404-01
- Mức độ: Minor
- Vị trí: 0.1 (dòng "Kind / topic outbox mới", "Hành vi API/Desk v1.0.3…"); 1.3 dòng 0093; 1.4 ý cuối; mục 5 "Hệ quả"; 5.0 S5/S7; R3b; mục 8 Q1, Q2, Q4.
- Vấn đề: các ô này vẫn ghi `⟨CHỜ⟩`, trong khi đã có câu trả lời:
  - **Q1 (ARC, 0.3.12):** v1.0.3 gặp kind mới vẫn trả 200, hiện câu chung; quay lui không cần thêm bước.
  - **Q2 (BE-B):** không có topic hay job mới. J1 qua `events.notify` chỉ ghi `staff_notification`, cộng dòng outbox `staff.push` (`ON CONFLICT (dedupe_key) DO NOTHING`). ARC đã kiểm: trong `jobs/` của v1.0.3 và `main@L` **không có job nào đọc `staff.push`**. Chỉ `email-dispatch.ts` và `chat-dispatch.ts` chọn dòng theo topic. Vì vậy dòng `staff.push` có kind mới nằm yên khi quay lui, không thành `dead`.
  - **Q4 (ARC):** không có job hay topic mới. `STAFF_EMAIL_TEMPLATES` trên `v104/int-email` và `v104/be-identity` vẫn đúng 5 mẫu như `main`. Trường `action` mới trong payload `receiving_account_changed` bị v1.0.3 bỏ qua, vẫn ra câu cũ (SEC-on-v104-email-identity).
- Vì sao quan trọng: P0 chặn khi 0.1 còn ô `⟨CHỜ⟩`. Ngoài ra, R3b/S5 cần một câu đếm cụ thể; "chờ P4-10" sẽ thành chỗ trống đúng lúc đang quay lui.
- Đề xuất sửa:
  1. Đóng Q1, Q2, Q4 bằng các câu trên.
  2. Mục 5 "Hệ quả": "thông báo kind mới hiện câu chung trên Desk/PWA v1.0.3".
  3. R3b và S5 dùng câu chỉ đếm sau. Đúng là `0` theo thiết kế; khác 0 thì dừng, báo ARC + INT:
     ```sql
     SELECT count(*) FROM outbox_message
      WHERE topic = 'staff.email' AND status IN ('pending', 'in_flight', 'failed')
        AND payload->>'template' NOT IN ('mfa_recovery_code_used', 'mfa_reset', 'mfa_reset_by_operator',
                                         'receiving_account_changed', 'email_changed');
     ```
  4. S5 giữ "0 dòng `dead BAD_TEMPLATE` mới".
  5. Lúc cắt `SHA_V104`, nếu danh sách mẫu đổi thì OPS chép lại từ `email-templates.ts` ở `SHA_V104`.
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-02
- Mức độ: Minor
- Vị trí: mục 0 dòng "Migration chạy ở đâu" ("dự kiến 0096"); 1.3 dòng `0096 (dự kiến)`.
- Vấn đề: runbook giữ số **0096** cho GRANT của P4-04. Plan 2.2 dòng 110 và brief BE-D ghi **0097**. Dòng 109 (ORC sửa) lại nói "số 0096 trả lại cho GRANT P4-04 nếu cần". Ba chỗ lệch nhau.
- **Quyết định ARC (quyền ARC, plan 2.2):** GRANT, nếu cần, dùng **0097**. Số **0096 không dùng lại**. Lý do:
  - nhiều tài liệu đã ghi "0096 đã bỏ" (decision-log, plan, runbook 1.3, báo cáo BE-C); dùng lại số này sẽ lẫn khi tra lịch sử;
  - tiền tố migration vốn đã có khoảng trống (69 tệp tới 0092), drizzle dựa vào journal chứ không cần tiền tố liền nhau.
- Đề xuất sửa: OPS đổi runbook sang 0097. ORC sửa dòng 109 của plan thành "0096: không dùng lại" khi ghi decision-log.
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-03
- Mức độ: Minor
- Vị trí: mục 4 (bảng `step=`), R4.
- Vấn đề: mục 4 chỉ có các ca **deploy** lỗi. Không có ca **quay lui** lỗi giữa chừng.
  - Với `--rollback`, `deploy.sh` cố ý **không** tự đưa bản trước lên lại (test (g)).
  - Theo P4-02 có thể xảy ra:
    - (a) R4 lỗi ở `switch-api`: worker v1.0.4 vẫn chạy (đúng ý), api/web v1.0.3 không lên healthy;
    - (b) R4 lỗi ở `switch-worker`: api/web đã là v1.0.3, worker ở trạng thái không rõ;
    - (c) R4 lỗi ở `smoke`.
  - Runbook dẫn "các trường hợp khác: như tờ lệnh R4 của v1.0.1", nhưng tờ đó có trước khi có hai bước mới.
- Vì sao quan trọng: quay lui là lúc đang có sự cố. Thiếu dòng hướng dẫn thì người chạy dễ làm điều sai, chẳng hạn chạy tay `dc up worker` với v1.0.3 trong khi api v1.0.4 có thể vẫn trả lời.
- Đề xuất sửa: thêm bảng nhỏ "R4 lỗi". Mọi ca đều bắt đầu bằng K1 + K2 chỉ đọc và đọc `tail deploy-history.log`.
  - (a): **không** chạy worker cũ. Chạy lại R4 một lần; vẫn lỗi thì R8 (lên lại v1.0.4).
  - (b): chạy lại R4 (đã có `api web` v1.0.3, lệnh `up` của nhóm này là no-op).
  - (c): xem log, ORC + ARC quyết.

  Cả ba ca: báo INV.
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-04
- Mức độ: Minor (đi cùng Major FB-R4-ARC-OPS-P402-01)
- Vị trí: K4b (`WORKER_UP` = `ps --status running`), K4, R6, 5.0 S4/S9.
- Vấn đề: giống P402-01. Mọi service có `restart: unless-stopped`, nên worker chết lặp vẫn thường được thấy ở trạng thái `running` khi lấy mẫu. ARC đã thử: container chết sau 1,5 giây vẫn hiện `running` ở 7/12 mẫu, mỗi mẫu cách nhau một giây. `WORKER_UP=1` do đó không chứng minh worker sống.
- Đề xuất sửa: K4b in thêm `WORKER_RESTARTS=$(docker inspect -f '{{.RestartCount}}' <id>)`. Đúng là `0`. R6, S4, S9 dùng cùng kiểm.
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-05
- Mức độ: Minor
- Vị trí: "Việc còn lại trước Release (r1)".
- Vấn đề: danh sách chỉ có các việc email (P2c/P2d/README 13.8). Còn thiếu nhiều việc mã của P4-04 theo plan và theo quyết định ORC 04/11:
  - CI `confidential-paths` (SEC-OPS-01 G2), bắt buộc trước QC v1.0.4 (plan dòng 63);
  - `ops-check.sh`:
    - `via owner: <n>` (PR32-02 b);
    - `email_missing` gồm `locked` (PR30-08);
    - kiểm chỉ đọc chạy bằng `ottimo_readonly` READ ONLY, câu trả lời không phải số → `FAIL` (PR32-S1, PR30-09);
    - vai requeue chỉ có `SELECT` + `UPDATE` 4 cột;
    - câu READ ONLY kiểm 2 trigger PN-01 (P4-13);
  - README 5.0: thứ tự deploy. Báo cáo P4-02 mục 3 ghi "để P4-04 ghi";
  - README 12.3 + chú thích `privacy.ts`: quy tắc `CONST_ROWS` cho nhãn thông báo, "không đổi `CHAT_DETAILS_MIN_NOTICE_VERSION` sau lần đăng đầu nêu Chat", dòng SEC duyệt chữ (SEC LPV2RB-02/05, RB-05; ORC 04/11). Plan đề xuất "OPS cùng P4-02 hoặc BE-A". **P4-02 không làm** vì không chạm README, nên phần README thuộc P4-04. Chú thích `privacy.ts` không thuộc tệp của OPS: ORC cần giao rõ cho BE-A (rebase `be-identity`) hoặc FE-B;
  - các Suggestion P403-04 (`setup-node`) và P403-03 (S14 hai lượt `--send` trên staging), nếu OPS nhận.
- Vì sao quan trọng: QC v1.0.4 chấm theo plan. Mất một mục ở đây thì dễ thành "Không đạt" sát giờ cắt 06/11 18:00.
- Đề xuất sửa: đổi "Việc còn lại" thành bảng gồm: việc, thẻ, tệp, trạng thái. Lấy đủ các cột "Việc" và "Tiêu chí đạt" của dòng P4-04 trong plan, cộng các dòng ORC 04/11 (README 12.3).
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-06
- Mức độ: Suggestion
- Vị trí: đầu tệp ("r0, bản nháp"; "ARC và SEC review bản r1 (sau `main@L`), không review r0"); decision-log 04/11 ghi "runbook v1.0.4 r1 (`v104/ops-check` a183b82d)".
- Vấn đề: tên bản trong tệp lệch với decision-log. Người review có thể đọc nhầm bản.
- Đề xuất: đầu tệp ghi "r0.4 (a183b82d)", hoặc theo cách đánh số OPS chọn. "r1" để dành cho bản sau `main@L` mà ARC + SEC review chính thức.
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-07
- Mức độ: Suggestion
- Vị trí: 5.0 S0 và P2.
- Vấn đề: G1 của P4-02 nói lệnh `up` của một nhóm không tạo lại nhóm kia. ARC chỉ mới thử G1 trên Compose v5.5.0 tại máy. Hành vi `depends_on` và `--wait` có thể khác giữa các bản compose.
- Đề xuất:
  - S0 (staging) và P2 (production) in `docker compose version --short`;
  - nếu hai máy khác bản, S3/S9 của staging không thay được K1 của production, và K1 trên production là kiểm bắt buộc (hiện nay K1 sai thứ tự chỉ "ghi + báo");
  - thêm vào S3/S9: sau bước `switch-api`, giờ `StartedAt` của `worker` không đổi.
- Trạng thái: Open

## 3. Điểm làm tốt
- P2e và R2b: tìm đúng đường 500 thật của v1.0.3 (`ParameterMissingError` ở báo giá và tính hoa hồng). Câu kiểm chỉ đếm, không đọc `value`, nên giữ được luật số hoa hồng.
- Bảng H05 × bản app (1.8) và luật "quay lui khi H05 đã là v2 thì không đặt H05 về v1". Đúng ràng buộc bằng chứng đồng ý, áp được cho cả quay lui.
- Production đang chạy thật nên mọi lượt thử có ghi dữ liệu dời sang staging (S15/S16). P2d không đưa địa chỉ nào qua chat hay repo.
