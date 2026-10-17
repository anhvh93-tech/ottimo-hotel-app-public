# Cổng QC giữa round – Round 2, Sprint 3 (nhận phòng, lưu trú, trả phòng 3 bước, bill, VietQR, thu tiền, giấy tờ C3, khai báo, check-in online)

- Người kiểm: QC | Ngày: 17/10/2026 | **Bản 2 (chiều 17/10)**. Bản này thay bản 1 (sáng 17/10, ĐẠT CÓ ĐIỀU KIỆN, commit `97c170b`). Bản 2 xử lý 9 phát hiện của critic, dùng kết quả SEC (gỡ chặn có điều kiện), QA (sổ lỗi 64 lỗi) và UXR (đi thử demo). QC không sửa sản phẩm, không commit. QC chỉ sửa file này và thêm 1 dòng vào `decision-log.md`. Nội dung `outputs/QC/report.md` được gửi cho ORC ghi (mục 0, dòng 8).
- Bản kiểm: code **`6af7173`**, khớp `headSha` của CI run **38998735861**. HEAD `97c170b` chỉ thêm tài liệu: `git diff 6af7173 HEAD -- product` rỗng. Cây làm việc có thay đổi tài liệu chưa commit của QA, SEC, UXR và ORC. Trong `product/` chỉ có 2 tệp tài liệu QA bị đổi: `docs/qa/traceability.md` và `tests/test-cases/r1-main-flows.md`.
- Chuẩn chấm:
  - plan R2 mục 4, dòng Sprint 3: "Luồng A1 (mục 7) chạy được lần đầu trên staging";
  - plan R2 mục 7, phần thuộc Sprint 3: A1 từ cọc tới trả phòng, A6 phần C3 và app khách, B1–B5, C1–C4;
  - DoD của protocol;
  - checklist QC: "không ĐẠT nếu còn P0, lỗi bảo mật nghiêm trọng, hoặc sai tiền";
  - các điều kiện ĐK-S2-1…7 của cổng Sprint 2;
  - ngoại lệ ORC tại `decision-log.md` dòng 593 (mục 1.1).
- Đây là cổng sprint, không phải QC gate cuối Round 2.

## 0. Bản 2 sửa gì so với bản 1

| # | Phát hiện của critic, hoặc kết quả mới | Xử lý trong bản 2 |
|---|---|---|
| 1 | Câu "mọi Blocker/Major đã xử lý qua 8 vòng kiểm chứng" nói quá | Sửa câu lý do (mục 1) và K3. Mở rộng ĐK-S3-5 cho ARC và UXD |
| 2 | SEC đang chặn cổng | SEC đã gỡ chặn, có điều kiện SEC-G1…G4 (K5). Thêm ĐK-S3-11 |
| 3 | Lỗi sai tiền chưa có trong bug-list | QA đã ghi BUG-R2-055…061. K2 ghi rõ các lỗi này qua cổng nhờ ngoại lệ ORC (dòng 593), có hạn sửa (dòng 595) |
| 4 | Plan mục 7 và mục 4 bị vượt mà không ghi ngoại lệ | Thêm mục 1.1: nêu từng ngoại lệ và dẫn dòng 593 |
| 5 | PO ghi Accepted quá tay cho US-021 và US-022 | K6: QC đề nghị PO hạ cả hai về "Đang nghiệm thu". Lý do có thêm bằng chứng từ UXR |
| 6 | QC-S3-04 mới chỉ nói TC-L3-011 | Mở rộng cho TC-L3-032 và TC-L3-074, dùng kết luận của QA (BUG-R2-064, bug-list mục 7.2) |
| 7 | Mốc giờ demo cũ (D5 hết hạn 15:53) | Dùng giờ UXR reset: 12:31:47, D5 hết hạn 17:31 |
| 8 | Thiếu `outputs/QC/report.md` | QC đã soạn nội dung. Môi trường chặn subagent ghi tệp báo cáo, nên QC gửi nội dung cho ORC để ORC ghi vào `rounds/round-02/outputs/QC/report.md` |
| 9 | K3 xếp ARC-BE-S3-30 và UXD-FE-S3-20 (1) vào nhóm Blocker/Major | Sửa thành Minor |
| – | **UXR đi thử demo, tìm ra lỗi mới** | QC đọc mã và xác nhận 7 lỗi Desk có thật (QC-S3-08). Đây là lý do đổi quyết định (mục 1) |

## 1. Quyết định: **KHÔNG ĐẠT** – chấm lại rút gọn sau vòng sửa 9

**Lý do:** Phần API của nhận phòng, lưu trú, trả phòng, thu tiền, giấy tờ C3 và check-in online đã chạy đúng trên CI (API 2.187/2.187, E2E 1.777/0). 7 Blocker đã có người kiểm độc lập. SEC đã gỡ chặn. Nhưng UXR bấm thử bản demo thì thấy ba thao tác hằng ngày trên Desk **không làm được**:
- **Thêm giấy tờ cho khách tại quầy**, cả nhập tay lẫn kèm ảnh.
- **Ghi khoản chi hoàn tiền**, cả tiền mặt lẫn chuyển khoản. Thêm phát sinh hư hỏng có ảnh bằng chứng cũng hỏng theo.
- **Thêm người lớn vượt định mức khi khách đang ở.**

Ngoài ra dòng "Đã thu" trên chi tiết đơn tính sai, và Lễ tân trưởng không thấy khoản hoàn đã duyệt. CI không bắt được các lỗi này: ca UI chỉ kiểm phần hiển thị, còn các bước ghi đều chạy qua API (QC-S3-09). UXR đề xuất 2 lỗi P0 và 5 lỗi P1. QC đọc mã, xác nhận cả 7 lỗi có thật. Không ngoại lệ nào của ORC che các lỗi này, vì đây là lỗi chức năng trên đường dùng hằng ngày, không phải sai tiền ở đường hiếm.

Theo checklist QC ("không ĐẠT nếu còn P0") và plan mục 7 (B2 "0 lỗi P0/P1 Open"), cổng **không đạt**. Ngoài ra:
- 8 vòng kiểm chứng đối kháng chỉ xét 7 Blocker cùng các chủ đề tiền (FOC, hoàn tiền, OTA) và upload.
- Khoảng 45/47 Major mới có tác giả tự ghi Done, chưa có người review ghi Verified: SEC-BE-33…38, SEC-FE-06, SEC-MOB-01, DOM-BE-15…22, UXD-FE-S3-01…12, UXD-MOB-S3-01 và phần lớn ARC-BE-S3-04…21.
- Còn 1 Major SEC mới đang Open (FB-R2-SEC-BE-53).
- Mức "đủ dùng" (A1 trên staging) chưa đạt.

Bản 1 viết "không còn lỗi P0/P1, mọi Blocker/Major đã xử lý qua 8 vòng kiểm chứng". Câu đó sai và được rút lại.

### 1.1 Chuẩn chấm của plan và ngoại lệ ORC (dòng 593 của `decision-log.md`)

| Quy định | Thực tế ở Sprint 3 | Ngoại lệ |
|---|---|---|
| Plan mục 7: ĐẠT CÓ ĐIỀU KIỆN chỉ khi nhóm A và nhóm B đạt | Nhóm A không chạy trên staging. B2 còn P0/P1. B5 chưa có staging | Dòng 593 (1): các lỗi **sai tiền đã biết ở đường hiếm** (S4-01/02/05/07/18/22, tức BUG-R2-055…060) không chặn cổng Sprint 3, nhưng **phải sửa xong trước cổng QC Sprint 4**. Còn sót lỗi nào thì cổng cuối Round 2 KHÔNG ĐẠT. BUG-R2-061 (S4-34) cùng lớp và đã nằm trong thứ tự (3), nên QC áp cùng ngoại lệ. ORC ghi rõ khi chốt |
| Plan mục 4: mức "đủ dùng" của đợt trước là điều kiện để đợt sau bắt đầu | Mức "đủ dùng" của Sprint 3 KHÔNG ĐẠT (K7) | Dòng 593 (2): Sprint 4 được bắt đầu dù chưa đạt mức "đủ dùng". Lý do: staging chờ INV cấp VPS, không do đội; A1 đã chạy trên CI và trên demo localhost. ĐK-S3-8 bắt buộc khi có VPS |
| Checklist QC: không ĐẠT nếu còn P0 | Còn 6 P0 tiền (đã có ngoại lệ). Có thêm lỗi chức năng UXR, đề xuất P0/P1 | **Không có ngoại lệ** cho lỗi chức năng UXR → KHÔNG ĐẠT |

QC không xin ngoại lệ mới. Các ngoại lệ ở dòng 593 vẫn giữ nguyên khi QC chấm lại.

### 1.2 Hệ quả và cách chấm lại
- **Sprint 3 chưa được đóng.** Mọi story Sprint 3 vẫn ở trạng thái "Đạt (stack tạm)" hoặc "Đang nghiệm thu", chưa story nào "Xong".
- **Sprint 4:** QC không thay quyết định (2) của ORC. Tuy vậy, vòng sửa 9 (ĐK-S3-9) phải làm **trước** mọi việc Sprint 4 của FE, và trước việc của BE cho lỗi #4. Lý do: S4-25…S4-30 sẽ xây tiếp trên chính các màn đang hỏng.
- **QC chấm lại rút gọn** khi đủ 4 điều kiện:
  1. ĐK-S3-9 xong: 6 lỗi Desk đã sửa, mỗi lỗi có ca E2E bấm qua giao diện thật;
  2. CI xanh trên commit mới (đủ 7 job như K1);
  3. QA đã ghi và đóng các lỗi UXR mức P0/P1. Lỗi nào QA hạ mức thì phải ghi lý do trong bug-list. Đây là phần bản 2 của ĐK-S3-3;
  4. ORC đã thêm S4-39 (phần còn lại của ĐK-S3-4).

  Nếu đủ, QC dự kiến chấm **ĐẠT CÓ ĐIỀU KIỆN** với các điều kiện còn lại: ĐK-S3-5, 6, 7, 8, 11.
- **Không cần ESC.** Đây là cổng sprint Round 2, thuộc quyền QC. Nếu đội muốn gửi demo cho INV trước khi xong ĐK-S3-10, đó là "phát hành dù QC đánh trượt". Khi đó INV phải được báo rõ và tự quyết (mục 10).

## 2. Bảng kiểm

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| K1 | CI chạy thật, xanh (B1) | **Đạt** | `gh run view 38998735861`: `headSha` = `6af7173…`, conclusion success.<br>**7 job chạy, đều xanh:** format·lint·audit·test·build; API contract `--strict`; Redocly; gitleaks; no test endpoints; shellcheck; docker build + E2E.<br>**2 job bị bỏ qua:** `deploy staging` và `publish images (GHCR)`, vì chưa có staging. "9/9 xanh" nghĩa là 7 job xanh và 2 job bỏ qua.<br>Job test: api `Tests 2187 passed (2187)`. `pnpm audit --audit-level=high`: 3 lỗi mức moderate, 0 mức high.<br>Log E2E: `1777 passed`, `82 skipped`, 0 failed. Số đạt gồm 3 ca `test.fail` đúng dự kiến: TC-L3-032, TC-L3-011, TC-L3-074.<br>TC-L3-011: lượt 1 có lỗi thật bị lượt chạy lại che. Không tìm được nguyên nhân. Chạy riêng 300 lần trên `6af7173`: 0 lần hỏng sớm (QA, bug-list mục 7.2). Xem QC-S3-04 |
| K2 | 0 lỗi P0/P1 Open (B2) | **Không đạt** | `qa/bug-list.md` mục 1 (QA đếm lại từng dòng, 64 lỗi): P0 có 7 (6 Open, 1 Closed); P1 có 13 (1 Open); P2 có 26 (2 Open, 1 Deferred); P3 có 18 (3 Open).<br>• **6 P0 Open, đều sai tiền:** BUG-R2-056 (S4-02), 057 (S4-05, với tới từ Desk), 058 (S4-07, với tới từ Desk), 059 (S4-18), 060 (S4-22, P0 tạm, chờ DOM), 061 (S4-34, QA tái hiện 3/3: khách trả thừa 210.000 hoặc 140.000).<br>• **1 P1 Open:** 055 (S4-01, đổi đơn trả 500, không sai tiền).<br>Các lỗi này **qua cổng nhờ ngoại lệ ORC** (dòng 593 (1)). Hạn sửa: trước cổng QC Sprint 4 (QA, dòng 595). P0 nào không sửa kịp trong Round 2 thì QA lập ESC.<br>• Bản 1 ghi "0 P0/P1 mở". Câu đó sai từ lúc các lỗi tiền được ghi vào sổ.<br>• **Chưa có ngoại lệ:** UXR đề xuất 2 P0 và 5 P1, chưa có trong sổ lỗi. QC đọc mã, xác nhận cả 7 (QC-S3-08) → ĐK-S3-3 (bản 2), ĐK-S3-9.<br>• P2 Open: 033 (a) → S4-11, 063 → S4-32. P2 Deferred: 038 → S4-10. P3 Open: 054 → S4-12, 062 → S4-28, 064 → S4-24 |
| K3 | Thẻ Blocker/Major Sprint 3 đóng hoặc dời có lý do (C4) | **Đạt một phần** | Có 54 thẻ trong `reviews/s3-*.md`: ARC 3 Blocker + 18 Major, DOM 2 Blocker + 8 Major, SEC 2 Blocker + 8 Major, UXD 13 Major. Thẻ nào cũng có dòng trả lời trong `responses/s3-*.md` (QC đã đối chiếu bằng script ở bản 1).<br>• **7 Blocker:** đều có người kiểm độc lập (`s3-blocker-verification.md`, `s3-blocker-reverification.md`). SEC đã tự ký SEC-BE-32 Verified (`s3-SEC.md:120`) và SEC-OPS-03 Verified phần cấu hình + CI (`:129`). SEC-OPS-03 chỉ đóng sau smoke staging. DOM và ARC chưa tự ký Blocker của mình.<br>• **47 Major:** 8 vòng kiểm chứng chỉ chạm vài Major ARC cùng chủ đề tiền/upload (ARC-BE-S3-05, 13, 14, 18). Khoảng 45/47 Major mới có tác giả tự ghi Done → ĐK-S3-5 mở rộng.<br>• **Major mới Open:** FB-R2-SEC-BE-53 (`s3-SEC.md:437`). Đã kiểm mã: `registration.service.ts:1931` hủy giấy tờ chưa gắn người theo `person_index > persons` → ĐK-S3-11.<br>• **Sửa bản 1:** ARC-BE-S3-30 (`s3-ARC.md:485`) và UXD-FE-S3-20 (`s3-UXD.md:205`) là **Minor**, không thuộc nhóm Blocker/Major. Cả hai dời có lý do: S4-36, và sang R3 theo ORC.<br>• Major-defer phát sinh từ các vòng kiểm chứng (không phải thẻ review): S4-01, 02, 05, 06, 07, 08, 17, 18, 22 |
| K4 | Tiền đúng (phần tiền của A1, B4) | **Đạt có điều kiện, nhờ ngoại lệ** | **Đã có bằng chứng:**<br>• Các oracle `br-examples.json` đọc từ tệp, không gõ tay.<br>• TC-L4-050: bill 2.485.000. TC-L4-061: đơn OTA thu hộ chỉ còn phát sinh.<br>• Vòng 8: 28/29 ca tiền đúng trên PostgreSQL thật.<br>• QA chạy lại 12 ca TC-NT-016…036 trên `6af7173`: đạt.<br>**Còn sai tiền ở đường hiếm:** BUG-R2-055…061 (K2). Hai lỗi với tới từ Desk: 057, 058. QC-S3-03 nay là lỗi thật (BUG-R2-061). QA đã viết TC-NT-045/046 và TC-L2-084.<br>**Hiển thị tiền sai trên Desk:** dòng "Đã thu" = tiền phòng − còn phải thu (`ReservationDrawer.tsx:515`, UXR #6). Số trong folio và bill vẫn đúng.<br>Quy tắc "không ĐẠT nếu sai tiền" áp đầy đủ ở cổng Sprint 4 và cổng cuối (ĐK-S3-6) |
| K5 | Bảo mật phần Sprint 3 (B3, A6) | **Đạt có điều kiện** | • **SEC gỡ chặn cổng** (dòng 594, `s3-SEC.md` mục 9):<br>&nbsp;&nbsp;– SEC-BE-32 Verified: `registration-flow.test.ts` 22/22; Major (a) đạt, kể cả ảnh khách tải qua link.<br>&nbsp;&nbsp;– SEC-OPS-03 Verified phần cấu hình + CI: `check-caddy-prod.sh` 33/33; chờ smoke staging.<br>• **A-38 tái hiện được** → FB-R2-SEC-BE-53: Major, rủi ro Trung bình, không lộ dữ liệu.<br>• Điều kiện SEC-G1…G4 → ĐK-S3-11, ĐK-S3-8, ĐK-S3-5, ĐK-S3-10.<br>• C3: TC-SEC-010, TC-RB-001/002/022 ✓ trong CI. RBAC S3 737/737. `gen_rbac_cases --check` OK.<br>• Demo: `/__test__/clock` trả 404. Prod compose đọc khóa qua `*_FILE` và chế độ strict (`docker-compose.prod.yml:42-44`, `keyring.ts:47`). Vì vậy lỗi khóa của demo (UXR #1) không ảnh hưởng prod.<br>• **Vẫn cấm** gửi link cho khách thật và nhập dữ liệu khách thật, tới khi SEC-G1 và SEC-G2 xong |
| K6 | Story Sprint 3 đạt AC (C1 phần S3) | **Đạt một phần**; PO ghi Accepted quá tay | `outputs/PO/s3-acceptance.md`: 27 story có 17 Accepted, 10 Accepted một phần. QC **đề nghị PO hạ**:<br>• **US-022 → Đang nghiệm thu.** AC1 chưa có E2E (TC-L2-060 chưa viết). AC4 chỉ có test API (TC-L3-056 chỉ dùng `request`), trên Desk thì không làm được (UXR #7, `StayDialogs.tsx:988/996` luôn gửi `applyExtraPersonSurcharge: false`). S4-07 (BUG-R2-058) chạm phụ thu người.<br>• **US-021 (chấm lại S1/S2) → Đang nghiệm thu.** AC4 "chi tiền hoàn" chỉ có test API (TC-L4-062). Trên Desk thì không ghi được khoản chi (UXR #2), và Lễ tân trưởng không thấy khoản đã duyệt (UXR #4). AC2: hộp hủy ghi sai khi hoàn 100 % cọc (UXR #5). S4-06 và S4-08 là quy tắc của chính AC4.<br>• **Ghi chú cho story đã "một phần":** US-043 AC1 dựa vào E2E-UI TC-L3-030, nhưng ca này chỉ kiểm hiển thị giấy tờ tạo qua API; trên Desk không thêm được giấy tờ (UXR #3). US-020 "Xem folio" có dòng "Đã thu" sai (UXR #6).<br>Nếu PO đồng ý: Sprint 3 còn 16 Accepted, 11 một phần; phần chấm lại S1/S2 còn 6 story lên Accepted. Không phần Must R2 nào phải đẩy sang R3. Theo P-R2-7, mọi "Accepted" hiện chỉ là trên stack tạm |
| K7 | **Mức "đủ dùng" Sprint 3: A1 chạy lần đầu trên staging** | **Không đạt** (có ngoại lệ ORC (2)) | Mục 4 |
| K8 | Staging, deploy tự động từ CI (B5) | **Không đạt** | Job `deploy staging` bị skipped. Chưa có VPS và tên miền (INV đang mua). OPS đã diễn tập trên máy: deploy 18 giây, tự quay về bản trước, sao lưu và khôi phục (`pending-for-INV.md` mục 1) |
| K9 | Giao diện, a11y, VI/EN (C2) | **Đạt một phần** | • a11y: CI có 39 ca UI và 13 ca axe. `qa/s3-retest.md`: 45 lần quét H01–H18, 0 vi phạm.<br>• **Chưa trọn:** câu báo còn ký hiệu thô `{room}`/`{from}`/`{to}` và `{n}` (UXR #9). Lỗi 403 hiện "Máy chủ đang gặp sự cố" (UXR #8). Ô "Ngân hàng nhận" xóa chữ mà không báo (UXR #10).<br>• 39 ca UI không có ca nào bấm thật các thao tác ghi: thêm giấy tờ, chi hoàn, thêm người có phụ thu (QC-S3-09).<br>• Chưa kiểm: thiết bị thật, VoiceOver |
| K10 | Truy vết, tài liệu (C3) | **Đạt** | `traceability.md` sinh lại (QA, 17/10): 152 BR, **0 BR không được tham chiếu**. BR-429 có TC-L2-084 (QC-S3-07 đã đóng). Bản 1: 71/71 story, AC 251/251, 0 operation lệch rbac. OpenAPI 0.3.7 còn là nháp (S4-10) |
| K11 | ĐK-S2-1…7 của cổng Sprint 2 | **Đạt 6/7**, ĐK-S2-6 một phần | Mục 3 |
| K12 | Bản demo localhost cho INV | **Chưa đạt để gửi** | • Stack `ottimo-demo` dựng từ `adc0a47` (`~/.ottimo-demo/built-from`). UXR reset lúc **12:31:47**. QC probe lúc 12:38: `/health` và các cổng 8181, 8182, 8183 trả 200.<br>• UXR đi đủ Bước 0 và KB1–KB10. 7 KB đạt hoặc chỉ cần sửa hướng dẫn. KB4 và KB6 đi vòng được. **KB8 không làm trọn được.**<br>• **Lỗi của cách dựng demo (UXR #1):** `x-api-env` (`docker-compose.yml:21-51`) không truyền `DATA_KEK_CURRENT`/`ID_HASH_KEY`. Vì vậy mỗi tiến trình (seed, api, worker) tự sinh khóa ngẫu nhiên (`keyring.ts:56-68`), và api không đọc được giấy tờ của các đơn dựng sẵn.<br>• ĐK-S3-1 chưa xong: `outputs/OPS/demo-1.md` mục 6 vẫn chỉ ghi smoke trên `5304fc8`. ĐK-S3-2 đã xong. Câu SEC-G4 chưa có trong limits mục C.<br>• → Mục 10 |

## 3. Kiểm từng ĐK-S2

| ĐK | Kết quả | Bằng chứng |
|---|---|---|
| ĐK-S2-1 sổ lỗi | **Đạt** | `outputs/QA/s3-kickoff.md` dòng 10–12: BUG-R2-014 Closed, bảng tổng đã sửa, QC-S2-01/02 đã ghi thành BUG-R2-025/026 |
| ĐK-S2-2 sức chứa (`CAPACITY_BELOW_BOOKINGS`) | **Đạt** | BUG-R2-025 Closed. Log CI 38998735861: TC-NT-039 ✓, TC-NT-040 ✓ (3 ca). Cảnh báo ngừng bán là A-39 `warnings[]` (decision-log dòng 471) |
| ĐK-S2-3 câu báo khi lưu đồng thời | **Đạt** | BUG-R2-026 Closed. Log CI: "BUG-R2-026 (E)" ✓ (2 ca), TC-L2-021 (E) ✓. Mẫu DS 6.21 tự thử lại theo `Retry-After` |
| ĐK-S2-4 E2E UI + axe | **Đạt** | Bước CI "UI cases ran": `UI: 39 case(s), 2 allowed skip(s), axe 13 case(s) ran`. CI báo đỏ nếu ca UI bị bỏ qua vì môi trường |
| ĐK-S2-5 PO nghiệm thu S2 + backlog | **Đạt** | `outputs/PO/acceptance.md` (S1+S2) và `s3-acceptance.md` mục 3. Cột Trạng thái của backlog khớp. Xem đề nghị hạ ở K6 |
| ĐK-S2-6 staging, nâng "Gấp" | **Một phần** | Decision-log dòng 444 ghi đã nâng mức Gấp. `pending-for-INV.md` mục 1 có "Gấp – Máy chủ chạy thử". INV đang mua VPS và tên miền. Staging vẫn chưa có → K7, K8 |
| ĐK-S2-7 SEC/DOM kiểm lại thẻ S2 | **Đạt** | SEC: decision-log dòng 446 và `s2-SEC.md:145-164`. DOM: decision-log dòng 462 |

## 4. Mức "đủ dùng" của Sprint 3: "Luồng A1 chạy được lần đầu trên staging"

### 4.1 Kết luận: **KHÔNG ĐẠT**

Sprint 4 vẫn được bắt đầu nhờ ngoại lệ ORC (dòng 593 (2)). Phần A1 thuộc Sprint 3 chạy đúng trên CI, theo từng đoạn ở tầng API. Nhưng có 4 thiếu sót:
- chưa chạy trên staging;
- chưa có lượt nào chạy liền một mạch, cả E2E lẫn QA chạy tay có ghi hình;
- 2 bước chưa có trên Desk;
- **bước giấy tờ khi nhận phòng không làm được trên Desk** (UXR #3).

| Bước A1 (plan mục 7) | API, E2E trên CI | Giao diện, E2E-UI | Demo localhost | Còn thiếu |
|---|---|---|---|---|
| Báo giá ngắn ngày → giữ chỗ (căn bị chặn bán) | Đạt (S2: TC-L5-001…025) | Đạt (H12) | KB3 | – |
| **VietQR cọc** | Đạt: `createVietQr` cho đơn `hold` (TT `payments-s3.test.ts:503`) | **Không**: chỉ hiện số tiền và nội dung chuyển khoản, không vẽ mã QR (`QuoteDialog.tsx:658/684`) | – | **S4-28** (BUG-R2-062) |
| Xác nhận cọc → `confirmed` | Đạt (TC-X-003, TC-L5-034) | Đạt | KB3 | Ảnh biên nhận của CTV: S4-30 |
| Check-in online qua link (VI/EN) | Đạt (TC-L7-001…014) | Đạt (H18 390×844 + axe) | KB9 | Chưa thử trên điện thoại thật |
| Nhận phòng: giấy tờ, đối chiếu, đồng ý lưu ảnh, khai báo `sent` → `confirmed` | Đạt (TC-L3-001…054) | **Một phần**: H13/H14 chỉ hiển thị giấy tờ tạo qua API. Desk **không thêm được giấy tờ**: phần `data` gửi dạng Blob nên bị server bỏ qua (`endpoints.ts:769`, `multipart.ts:70`) | KB4, đi vòng qua link khách | **ĐK-S3-9** (UXR #3); S4-10, S4-11 |
| Lưu trú: thêm phát sinh, gia hạn 1 đêm | Đạt (TC-L4-001…033) | Đạt (H15). Phát sinh có ảnh bằng chứng thì hỏng (UXR #2) | KB6 trên D1 (D4 báo 500 vì UXR #1) | ĐK-S3-9, ĐK-S3-10 |
| Lưu trú: yêu cầu khách | – | – | – | Sprint 4 (EP14) |
| Trả phòng 3 bước: minibar, phụ thu trả muộn | Đạt (TC-L4-040…048) | Đạt (H16, desk-clock) | KB7 | – |
| **FOC có duyệt ở bước trả phòng** | Đạt (TC-NT-027…032) | **Không**: Desk chỉ xin được FOC phụ thu nhận sớm | KB4 + KB10 dùng FOC nhận sớm thay thế | **S4-25**, chỉ phát hành sau S4-02/18 (S4-34) |
| Bill VI/EN đúng công thức, số `F26-xxxxxx` | Đạt (TC-L4-050, 051, 053) | Đạt (H16) | KB7 | Mở lại bill sau khi trả phòng: S4-29 |
| Thu VietQR hoặc ghi thu, "chờ đối soát" | Đạt (TC-L4-060…069) | Đạt | KB7, KB10 | – |
| Hoàn tất → buồng `VD` + việc dọn tự sinh | Đạt (TC-L4-053: `VD`, `createdTaskIds` = 2) | Đạt | KB7 | Xem việc dọn: Sprint 4 (`listHkTasks`) |
| Buồng phòng dọn, kiểm checklist trên PWA → `VI` | – | – | – | Sprint 4 (EP07) |
| Mọi số tiền khớp `br-examples.json` | Đạt (oracle) | "Đã thu" trên drawer sai (UXR #6) | – | Sai tiền ở đường hiếm (K4) |
| **Chạy trên staging** | Không | Không | – | Chưa có VPS |
| **Một chuỗi A1 liền mạch** (E2E + QA chạy tay có ghi hình) | Chưa có | Chưa có | `smoke-demo.mjs` chạy được một phần chuỗi (trên `5304fc8`) | ĐK-S3-7 |

### 4.2 Hệ quả của việc chưa có staging
1. **Sprint 3 không đạt mức "đủ dùng" theo đúng chữ của plan.** Sprint 4 bắt đầu được nhờ ngoại lệ ORC (dòng 593 (2)), vì việc của Sprint 4 không cần staging.
2. **Chưa story nào "Xong".** Theo P-R2-7, story chỉ dừng ở "Đạt (stack tạm)". PO phải kiểm lại giao diện trên staging (s3-acceptance N3-5).
3. **Cổng QC cuối Round 2:** nhóm A (A1–A7) phải chạy trên staging, kèm một lượt QA chạy tay có ghi hình. B5 cũng cần staging. Nếu tới lúc đó chưa có staging thì **KHÔNG ĐẠT ở nhóm A và B5**. Khi đó Round 2 không được ĐẠT, cũng không được ĐẠT CÓ ĐIỀU KIỆN theo plan mục 7. Ngoại lệ ở dòng 593 chỉ áp cho cổng sprint.
4. **Các việc chỉ staging mới chứng minh được, hiện chưa ai kiểm:**
   - deploy tự động có migration chạy thành bước riêng;
   - Caddyfile prod với tên miền thật, HTTPS/HSTS, cookie và Origin tách theo tên miền (SEC-OPS-03, SEC-G2);
   - upload qua Caddy thật (S4-15, S4-17);
   - check-in online trên điện thoại thật (camera, ảnh HEIC hay 48 MP, mạng yếu);
   - p95 của sơ đồ phòng trên VPS;
   - sao lưu hằng ngày;
   - email SPF/DKIM.
5. **Thử với nhân viên thật (C5 – UXR):** nếu chỉ có localhost thì phải ngồi tại máy Mac của INV. Lễ tân và buồng phòng không dùng được điện thoại của mình.
6. **Thời gian:** OPS đã có sẵn kịch bản. Từ lúc INV gửi IP và tên miền, cần khoảng 1 ngày cho DNS, chứng chỉ, deploy và smoke. Để còn giai đoạn Ổn định chạy A1–A7 trên staging, INV nên gửi chậm nhất trước khi Sprint 4 kết thúc (ĐK-S3-8).

### 4.3 Demo localhost có thay tạm được cho buổi INV bấm thử không?
**Có, về nguyên tắc**, cho việc INV tự bấm thử để góp ý nghiệp vụ và giao diện:
- demo chạy cùng mã với CI;
- image là bản build production (`/__test__` trả 404);
- dùng đồng hồ thật;
- dữ liệu dựng qua API;
- kiểm Origin giống staging.

**Nhưng bản đang chạy chưa nên gửi** (mục 10).

**Không thay được staging ở các việc sau:**
- tiêu chí QC nhóm A và B5;
- nghiệm thu "Xong" của PO;
- thử trên điện thoại, nhiều người dùng cùng lúc;
- thử với lễ tân và buồng phòng thật;
- kiểm cấu hình bảo mật thật.

**Rủi ro riêng của bản demo:**
- chỉ chạy trên một máy;
- các cổng localhost dùng chung cookie, nên vai thứ hai phải dùng cửa sổ ẩn danh;
- mỗi lần reset thì mật khẩu và link khách đổi;
- **trước khi sửa UXR #1:** tắt hoặc bật lại Docker thì mọi giấy tờ đã lưu không mở lại được;
- giữ chỗ D5 của bản đang chạy (reset **12:31:47 ngày 17/10**) hết hạn lúc **17:31**. Sau khi dựng lại theo ĐK-S3-10, mốc mới là giờ dựng cộng khoảng 5 giờ; OPS ghi mốc này vào câu "XONG".

## 5. Tự kiểm mẫu của QC và phát hiện

**Đọc code 5 story chính (bản 1, vẫn đúng):**

| Story | Kết quả | Vị trí đã kiểm |
|---|---|---|
| US-025, US-139 AC3 (cổng nhận phòng) | Đúng ở API | `checkin.service.ts:201-226` và `:326-328`. Đơn OTA trả trước được tính là đã thu đủ. Đơn chưa gán căn trả `RESERVATION_UNASSIGNED`. Phần "đã thu đủ" chưa cộng phụ thu nhận sớm có chú thích rõ, khớp BUG-R2-038 |
| US-038 AC3 (trả phòng còn nợ) | Đúng | `checkout.service.ts:275-279`: chỉ MGR/OWN được ghi công nợ. `:412-413`: `BALANCE_DUE`. Có nhật ký `reservation.debt_on_checkout` |
| US-120 (VietQR) | Đúng | `integrations/payment/vietqr/emvco.ts:116-139`: trường 54 là số tiền; 62/08 là nội dung chuẩn hóa, chỉ gồm A–Z0–9, có CRC. Không có tên hay số điện thoại khách |
| US-021 AC4 (hoàn khi hủy) | Đúng ở API; **trên Desk thì không chi được** | `reservations.service.ts:2477-2490` tự tạo yêu cầu hoàn. Phần chi trên Desk hỏng (QC-S3-08 #2, #4) |
| US-048, US-142 (C3) | Đúng | `registration.service.ts:2291` `requiresTrustedDevice`, `C3LogService`. Có ca CI tương ứng (K5) |

Bản 2, QC kiểm thêm:
- đọc mã cho 7 lỗi UXR (QC-S3-08) và cho SEC-BE-53 (`registration.service.ts:1921-1932`);
- `git diff 6af7173 HEAD -- product` (rỗng);
- probe demo, chỉ đọc;
- đối chiếu bug-list, `s4-carryover.md`, traceability và decision-log dòng 592–595.

### QC-S3-01 – Hướng dẫn demo KB3 bảo CTV "đính 1 ảnh" – **đã xong**
`demo-1-guide.md` v1.1 đã bỏ chữ "đính 1 ảnh". Limits mục C dòng 66 có ghi câu "bỏ qua phần đính 1 ảnh". Phần FE còn lại thuộc S4-30.

### QC-S3-02 – `demo-1-limits.md` mục C có 2 dòng mô tả sai – **QC đã sửa ở bản 1**
Không đổi so với bản 1. Hai dòng đó là "Hủy đơn… không tự tạo yêu cầu hoàn" và "dòng dịch vụ… lễ tân đảo tay". Hai dòng FOC tiền phòng đã gộp thành một dòng "không gặp trong demo".

### QC-S3-03 – Làm S4-25 sẽ đưa lỗi FOC lên đường dùng hằng ngày – **nay là lỗi thật: BUG-R2-061 (P0)**
- QA tái hiện 3/3 trên `6af7173` (bug-list mục 7.3). Đổi giờ trả thì FOC trên phụ thu trả muộn bị giảm hoặc mất: khách trả thừa 210.000 hoặc 140.000. Hạn mức của người duyệt vẫn bị trừ 210.000 cho một FOC không được áp.
- Đã có S4-34. QA đã thêm TC-NT-045 và TC-NT-046 (046 chờ DOM).
- Đề xuất giữ như bản 1: không mở thêm nút xin FOC trên Desk trước khi S4-02/S4-18 được sửa cho mọi loại dòng. DOM chốt quy tắc FOC khi dòng trả muộn bị đặt lại (ĐK-S3-5).

### QC-S3-04 – `test.fail()` gọi giữa ca che lỗi thật của lượt chạy đầu: **TC-L3-011, TC-L3-032, TC-L3-074** – đã ghi thành BUG-R2-064 (P3)
- **Vị trí** (bug-list BUG-R2-064):
  - `e2e/clock/checkin.s3.clock.spec.ts`: TC-L3-011 (`:773`, `test.fail` ở `:834` – BUG-R2-038) và TC-L3-074 (`:2098`, `test.fail` ở `:2215` – BUG-R2-054);
  - `e2e/api/checkin.s3.api.spec.ts`: TC-L3-032 (`:231`, `test.fail` ở `:257` và `:268` – BUG-R2-033 (a)(b)).
- **Cơ chế:** khi lỗi xảy ra trước dòng `test.fail`, Playwright chạy lại ca. Lượt 2 tới được `test.fail` và hỏng đúng dự kiến, nên cả ca được tính "expected", không ghi flaky. Reporter không in lỗi của lượt 1, còn artifact chỉ được tải lên khi job đỏ.
- **Kết luận của QA về TC-L3-011** (bug-list mục 7.2), QC dùng nguyên:
  - **Có che lỗi thật.** Lượt 1 hỏng trước `:834`, sau 966 ms.
  - **Không xác định được nguyên nhân.** Run không có artifact, log không in lỗi.
  - 17 lượt chạy đủ trước đó và 300 lần chạy riêng trên `6af7173` đều không tái hiện.
  - Có thể là lỗi chập chờn của sản phẩm (409 do khóa) hoặc của harness (trùng số điện thoại).
  - US-026 AC2 giữ "Accepted (stack tạm)", kèm điều kiện: nếu sau khi tách ca mà phần AC2 đỏ ở bất kỳ run nào, AC2 quay về "Đang nghiệm thu".
- Ở run 38998735861, TC-L3-032 (#1555) và TC-L3-074 (#1804) tới được `test.fail` ngay lượt đầu, nên không bị che. Tuy vậy cùng cơ chế vẫn có thể che lỗi ở lần chạy sau.
- **Sửa:**
  - QA (S4-24, đã gồm cả 3 ca): tách bước lỗi đã biết thành ca riêng, đặt `test.fail` ở đầu ca;
  - QA: CI báo đỏ khi một ca có annotation BUG bị chạy lại;
  - OPS: tải `junit.xml` và `test-results` lên ở mọi lần chạy (`if: always()`);
  - Thuộc ĐK-S3-7.

### QC-S3-05…07 (ghi chú nhỏ)
- **QC-S3-05:** "9/9 job xanh" phải đọc là "7 job xanh, 2 job bỏ qua" (K1).
- **QC-S3-06:** BUG-R2-053 đã **Closed** (QA, CI 38998735861).
- **QC-S3-07:** BR-429 đã có TC-L2-084. Traceability còn 0 BR không được tham chiếu. **Đã xong.**

### QC-S3-08 – Lỗi UXR tìm khi đi thử demo: QC đọc mã, xác nhận có thật (chờ QA ghi sổ và chốt mức)
| UXR | Mức UXR đề xuất | Lỗi | Bằng chứng mã (QC đã đọc) | Vai sửa |
|---|---|---|---|---|
| #1 | P0 (OPS, chỉ demo) | api, worker và pha seed của demo không nhận `DATA_KEK_CURRENT`/`ID_HASH_KEY`. Mỗi tiến trình tự sinh khóa ngẫu nhiên → giấy tờ của đơn dựng sẵn báo 500 DecryptionError; khởi động lại thì mất khả năng đọc giấy tờ | `infra/docker-compose.yml:21-51` (`x-api-env` không có 2 biến); `keyring.ts:56-68` (`ephemeral` khi biến rỗng và APP_ENV=dev). Prod dùng `*_FILE` + strict (`docker-compose.prod.yml:42-44`) nên không bị | OPS |
| #2 | P0 | Tải ảnh đính kèm từ Desk luôn trả 422: `Idempotency-Key` = `${idem}-a` không phải UUID. API lại bắt buộc ảnh chứng từ khi chi hoàn. Kết quả: không ghi được khoản chi hoàn, cả tiền mặt lẫn chuyển khoản. Phát sinh "hư hỏng, mất đồ" có ảnh cũng hỏng | `MoneyPage.tsx:771`, `StayDialogs.tsx:645`; `auth.guard.ts:575` (`UUID.test`); `refunds.service.ts:533-535` (`EVIDENCE_REQUIRED`) | FE |
| #3 | P1 | Desk không thêm được giấy tờ (nhập tay và kèm ảnh): `data` gửi dạng Blob nên có filename; `textPart` bỏ qua phần có filename → 422 `data REQUIRED` | `packages/api-client/src/endpoints.ts:769`; `files/public/multipart.ts:70-72`; `DocsPanel.tsx:280` | FE (api-client) |
| #4 | P1 | Lễ tân trưởng không thấy khoản hoàn quản lý đã duyệt, nên không chi được bằng vai này | `approval.service.ts:704-707` (FDL chỉ thấy yêu cầu do mình tạo, mình duyệt, hoặc `required_role = front_desk_lead`) | BE-A (approvals) |
| #5 | P1 | Hộp Hủy đơn ghi "chưa thu tiền" khi khách được hoàn 100 % cọc | `ReservationDialogs.tsx:262-279`: thiếu nhánh `refundableVnd > 0 && retainedVnd = 0` | FE |
| #6 | P1 | "Đã thu" trên drawer = tiền phòng − còn phải thu. D5 chưa cọc hiện −1.416.000 | `ReservationDrawer.tsx:515` | FE (+ BE nếu cần trả số đã thu) |
| #7 | P1 | Thêm người lớn vượt định mức khi khách đang ở bị chặn: Desk luôn gửi `applyExtraPersonSurcharge: false`, không có ô xác nhận số tiền → 422 `SURCHARGE_DECISION_REQUIRED` | `StayDialogs.tsx:988`, `:996` | FE + UXD |
| #8–#11 | P2/P3 | 403 hiện "máy chủ sự cố"; ký hiệu thô `{room}`/`{n}`; ô Ngân hàng nhận; 9 điểm P3 | QC chưa đọc mã | QA ghi sổ, PO xếp S4 |

### QC-S3-09 – Ca E2E-UI không bấm thật các thao tác ghi tiền và C3
- **Mức:** Major (lỗ hổng phủ test).
- **Vai sửa:** QA (FE hỗ trợ).
- **Vị trí:**
  - TC-L3-030 (E) (`ui/stay.h13-h17.spec.ts:174-191`) chỉ kiểm giấy tờ tạo qua API có hiện lên không;
  - TC-L3-056 "(A+E)" (`clock/checkin.s3.clock.spec.ts:1866-1870`) chỉ dùng `request`;
  - TC-L4-062 chạy qua API;
  - test FE (`refund.test`…) giả lập API, nên không bắt được UUID hay multipart.
- **Hậu quả:** CI xanh trong khi 3 thao tác Must bị hỏng trên Desk. PO nghiệm thu dựa trên các ca này.
- **Đề xuất:**
  - mỗi lỗi ở ĐK-S3-9 có một ca UI bấm thật tới API thật: thêm giấy tờ nhập tay và kèm ảnh, chi hoàn tiền mặt và chuyển khoản, phát sinh có ảnh, thêm người có phụ thu;
  - QA rà lại các ca ghi "(E)" mà thực chất chỉ chạy API, và sửa nhãn;
  - từ nay PO chỉ nhận AC giao diện khi có ca UI bấm thật, hoặc QA chạy tay có ảnh.

## 6. Điều kiện kèm theo

| # | Điều kiện | Vai | Hạn | Trạng thái (17/10 chiều) | Cách xác nhận |
|---|---|---|---|---|---|
| ĐK-S3-1 | Ngay trước khi gửi INV: chạy `./product/infra/demo/demo-up.sh --smoke` trên **bản dựng mới** (sau ĐK-S3-10). Ghi commit, giờ, kết quả vào `outputs/OPS/demo-1.md` mục 6, rồi gửi câu "XONG" kèm mốc D5 | OPS | Trước khi gửi demo | **Còn**. Mục 6 vẫn chỉ ghi `5304fc8`. Lần reset 12:31 của UXR không phải smoke | Dòng smoke ĐẠT trong `demo-1.md`, commit ≥ commit của vòng sửa 9 |
| ĐK-S3-2 | ORC sửa `demo-1-limits.md` mục B theo PO; UXR sửa KB3 bước 2 | ORC, UXR | Trước khi gửi demo | **Xong**. Mục B không còn ô "[PO …]", đã bỏ dòng "Gửi link check-in". Guide v1.1 KB3 không còn "đính 1 ảnh" | – |
| ĐK-S3-3 | `qa/bug-list.md` đúng thực tế | QA | Trước khi QC chấm lại | **Phần bản 1: xong** (053 Closed; 062, 063, 064; TC-L2-084; 0 BR không được tham chiếu).<br>**Phần bản 2: còn** – ghi lỗi UXR #1–#11 và FB-R2-SEC-BE-53 có mức và vai sửa. Lỗi nào QA hạ mức thì ghi lý do | Bảng tổng khớp từng dòng; có dòng cho #1–#7 |
| ĐK-S3-4 | `s4-carryover.md` đầy đủ | ORC | Trước khi QC chấm lại | **Phần bản 1: xong** (S4-25…S4-38; S4-34; S4-24 gồm cả TC-L3-011/032/074; thứ tự tuần đầu).<br>**Còn:**<br>• thêm S4-39 (FB-R2-SEC-BE-53; BE-C, BE-A, ARC, FE, UXD);<br>• ghi mã BUG cạnh S4-01…S4-34 theo bảng QA;<br>• thêm mục cho lỗi UXR P2/P3 không sửa ở vòng 9;<br>• ghi rõ BUG-R2-061 thuộc ngoại lệ dòng 593 | QC đối chiếu |
| ĐK-S3-5 | **Mở rộng:** người review ghi "Verified" (hoặc mở lại) cho thẻ Blocker/Major Sprint 3 của mình, trên commit mới nhất:<br>• **SEC:** 8 Major (BE-33…38, FE-06, MOB-01 – SEC-G3);<br>• **DOM:** 2 Blocker + 8 Major (DOM-BE-13…22), và chốt quy tắc FOC cho B12 (BUG-R2-060) và cho FOC chờ duyệt khi dòng bị đặt lại (TC-NT-046, BUG-R2-061 (c));<br>• **ARC:** 3 Blocker + 18 Major;<br>• **UXD:** 13 Major (UXD-FE-S3-01…12, UXD-MOB-S3-01) | SEC, DOM, ARC, UXD | SEC, DOM: trước lần deploy staging đầu tiên và trước cổng QC Sprint 4. ARC, UXD: trước cổng QC Sprint 4 | **Còn**. SEC đã xong 2 Blocker (SEC-BE-32; SEC-OPS-03 phần cấu hình + CI) | Dòng Verified trong 4 file `s3-*.md`; dòng DOM trong decision-log |
| ĐK-S3-6 | Sửa xong mọi mục sai tiền đã dời: BUG-R2-055…061 (S4-01/03, 02, 05, 07, 18, 22, 34) và S4-06, S4-08. Mỗi mục có test đọc `br-examples.json`, rồi chạy lại kiểm chứng đối kháng phần FOC. **Không mở thêm nút xin FOC trên Desk trước khi S4-02/S4-18 xong** | BE-A, BE-B, QA (DOM cho ví dụ) | Trước cổng QC Sprint 4. Còn sót mục nào thì cổng cuối Round 2 KHÔNG ĐẠT | **Còn** (ngoại lệ dòng 593 (1)) | Ca mới xanh trên CI; có báo cáo kiểm chứng Sprint 4 |
| ĐK-S3-7 | Viết một E2E **liền mạch cho A1**: báo giá → giữ chỗ → cọc VietQR → xác nhận → check-in online → nhận phòng → gia hạn + phát sinh → trả phòng 3 bước + FOC có duyệt → bill → VietQR → hoàn tất → `VD` + việc dọn. Khi Sprint 4 xong thì nối thêm dọn và kiểm trên PWA → `VI`.<br>Yêu cầu: số tiền đọc từ oracle; **các bước ghi trên Desk đi qua giao diện thật** (QC-S3-09); không có `test.fail` giữa chuỗi; sửa cả 3 ca của BUG-R2-064 | QA (FE, BE hỗ trợ; OPS sửa `ci.yml`) | Trước cổng QC Sprint 4 | **Còn** | Ca chạy xanh trong CI |
| ĐK-S3-8 | Khi INV gửi VPS và tên miền:<br>• OPS deploy qua CI, `deploy staging` = success;<br>• SEC smoke Caddy (SEC-G2), đóng SEC-OPS-03;<br>• QA kiểm S4-15/S4-17 qua Caddy thật;<br>• QA chạy A1 phần Sprint 3 trên staging, có ghi hình;<br>• PO kiểm lại giao diện (N3-5).<br>ORC ghi vào lần báo INV tới **ngày chậm nhất cần VPS**: trước khi Sprint 4 kết thúc | ORC, OPS, SEC, QA, PO | Ngay khi có VPS; chậm nhất trước giai đoạn Ổn định cuối Round 2 | **Còn** | Run CI có `deploy staging` success; có báo cáo QA trên staging |
| **ĐK-S3-9** (mới) | **Vòng sửa 9 – lỗi Desk:** sửa UXR #2, #3, #4, #5, #6, #7 (QC-S3-08). Mỗi lỗi có ca E2E-UI bấm tới API thật (QC-S3-09). UXD duyệt hộp xác nhận phụ thu (#7) | FE, BE-A, UXD, QA | **Trước khi QC chấm lại cổng Sprint 3** | **Còn** | CI xanh trên commit mới; ca UI mới chạy; QA đóng lỗi; UXR đi lại KB4, KB6, KB8 đạt |
| **ĐK-S3-10** (mới) | **Gói demo trước khi gửi INV:**<br>• OPS sửa UXR #1: truyền `DATA_KEK_CURRENT` và `ID_HASH_KEY` từ `demo.env` vào api, worker và pha seed; kiểm bằng cách khởi động lại api rồi mở giấy tờ D4;<br>• bản dựng có bản sửa #2;<br>• ORC thêm câu SEC-G4 vào limits mục C;<br>• UXR đi lại KB4, KB6, KB8, cập nhật limits/guide (bỏ dòng đã sửa) và mốc D5;<br>• rồi làm ĐK-S3-1 | OPS, FE, ORC, UXR | Trước khi gửi demo cho INV | **Còn** | Câu XONG có commit mới; KB8 làm trọn được; limits có câu SEC-G4 |
| **ĐK-S3-11** (mới) | SEC-G1: sửa FB-R2-SEC-BE-53 theo đề xuất của thẻ (BE-C bỏ điều kiện `person_index > persons`; ARC/BE-A thêm `guestUploadPersonIndex`; FE/UXD làm hộp chọn ô; gọi `onPartyChanged`). Test trên PostgreSQL thật; SEC kiểm lại | BE-C, BE-A, ARC, FE, UXD, SEC | Trước cổng QC Sprint 4 **và** trước dữ liệu khách thật (mốc nào tới trước) | **Còn** | SEC ghi Verified trong `s3-SEC.md` mục 9 |

Nếu tới cổng QC Sprint 4 vẫn còn một trong ba tình huống sau thì QC chấm Sprint 4 **KHÔNG ĐẠT**:
- BUG-R2-057 hoặc 058 (S4-05, S4-07) chưa sửa;
- S4-25 đã phát hành mà S4-02/S4-18 chưa được sửa tổng quát;
- FB-R2-SEC-BE-53 chưa được SEC Verified.

## 7. Hạng mục trượt và vai chịu trách nhiệm
- **Lỗi Desk (ĐK-S3-9):** FE (#2, #3, #5, #6, #7), BE-A (#4), UXD (#7), QA (ca UI, ghi sổ).
- **Demo (ĐK-S3-10, ĐK-S3-1):** OPS (#1, smoke), ORC (SEC-G4), UXR (đi lại, sửa tài liệu).
- **Staging (K7, K8):** INV cấp VPS và tên miền; sau đó OPS deploy, ORC theo dõi.
- **A1 trên giao diện:**
  - VietQR cọc (S4-28, FE);
  - xin FOC ở bước trả phòng (S4-25, FE + BE-B, sau S4-34);
  - dọn và kiểm trên PWA (EP07, MOB + BE).
- **Story Accepted một phần:**
  - FE: S4-26…S4-30;
  - BE-A + FE: S4-31;
  - BE-C: S4-11/32;
  - BE-A + ARC: S4-10;
  - QA: S4-33, TC-L2-060…062.
  - PO xem đề nghị hạ US-021 và US-022 (K6).
- **Sai tiền (ĐK-S3-6):** BE-A, BE-B; DOM chốt quy tắc B12 và FOC chờ duyệt.
- **Bảo mật:** BE-C, BE-A, ARC, FE, UXD (ĐK-S3-11); SEC kiểm lại 8 Major (ĐK-S3-5).
- **Chữ ký review:** SEC, DOM, ARC, UXD (ĐK-S3-5).

## 8. Rủi ro mang sang Sprint 4
1. **Sprint 4 quá tải.** Việc vốn có là EP07, EP08, EP01, phần còn lại của EP14 và US-066. Cộng thêm 39 mục carry-over (gồm S4-39), vòng sửa 9, 6 lỗi P0 tiền và các điều kiện ở đây. Nếu phải đẩy phần Must nào sang R3 thì đó là đổi phạm vi: PO lập ESC. ORC nên chốt sớm thứ tự cắt.
2. **FOC là vùng dễ hỏng.** Đã qua 8 vòng sửa, và vòng 6, vòng 7 từng làm hỏng lại chỗ đã đúng. Mọi thay đổi FOC ở Sprint 4 phải qua kiểm chứng đối kháng trên PostgreSQL thật.
3. **CI xanh chưa chứng minh giao diện chạy được** (QC-S3-09). Các màn S4-25…S4-31 sẽ lặp lại rủi ro này nếu không có ca UI bấm thật.
4. **Vẫn chưa có staging.** Nhóm A và B5 của cổng cuối Round 2 sẽ không đạt. Upload qua Caddy thật và SEC-OPS-03 cũng chưa được kiểm.
5. **Test chập chờn có thể che hồi quy:**
   - TC-L3-013: số điện thoại sinh ngẫu nhiên bị trùng;
   - lượt chạy lại che lỗi ở TC-L3-011, TC-L3-032, TC-L3-074 (BUG-R2-064);
   - bảng `dev_clock` dùng chung (S4-20);
   - TC-L2-057: lỗi `CONCURRENT_UPDATE`.
6. **Đổi hợp đồng 0.3.7** (BUG-R2-038; S4-09; `guestUploadPersonIndex` của SEC-BE-53). Phải đi qua ARC → BE → FE → QA trong cùng sprint.
7. **Chưa thử thiết bị thật.** Check-in online chưa chạy trên iPhone/Android.
8. **Nâng thư viện (S4-16).** Gộp PR Dependabot thì phải chạy lại CI đầy đủ.
9. **Pháp lý và chính sách còn chờ:**
   - ESC-001: luật sư, trước khi có dữ liệu khách thật; gồm cả thời hạn giữ ảnh ở SEC-BE-53;
   - ESC-019: giá khi đổi căn trước ngày đến;
   - câu pháp lý tiếng Nga đang dùng bản tiếng Anh.

## 9. Rủi ro chủ đầu tư cần biết (ORC đưa vào round-summary, không cần ESC mới)
- Phần nhận phòng, trả phòng, bill, thu tiền và giấy tờ khách đã chạy đúng trên hệ thống kiểm tra tự động, ở tầng máy chủ.
- Đội tự bấm thử bản demo và thấy 3 thao tác trên màn lễ tân chưa làm được:
  - nhập giấy tờ khách tại quầy;
  - ghi khoản đã hoàn tiền cho khách;
  - thêm người khi khách đang ở mà có phụ thu.

  Đội sửa trước khi mời anh/chị thử, nên buổi thử dời lại một chút.
- **Vẫn chưa có máy chủ chạy thử.** Nếu anh/chị chưa gửi VPS và tên miền trước khi Sprint 4 kết thúc, cổng QC cuối Round 2 sẽ không đạt ở phần "chạy trên môi trường thật". Lễ tân và buồng phòng cũng chưa thử được bằng điện thoại của họ.
- Đội đã biết một số trường hợp hiếm làm lệch tiền: đổi căn khác định mức trước ngày đến; đơn OTA đổi phòng nhiều lần; miễn phí (FOC) rồi đổi ngày hoặc đổi giờ trả. Đội phải sửa xong trong Sprint 4. Trong lúc chờ, màn lễ tân chưa mở thêm nút xin miễn phí.
- **Chưa dùng dữ liệu khách thật:** chưa gửi link check-in cho khách thật, chưa nhập giấy tờ thật. Phải chờ có máy chủ chạy thử đã được kiểm bảo mật, và chờ sửa lỗi xóa nhầm ảnh khi bỏ người khỏi đoàn.

## 10. Kết luận cho demo lần 1: **KHÔNG – chưa gửi ngay**

Bản đang chạy (reset 12:31:47) an toàn về dữ liệu: dữ liệu giả, localhost, SEC không chặn. Nhưng nó chưa đủ tốt để INV dành thời gian bấm thử:
- **KB8 (hoàn tiền) không làm trọn được**, và không có cách đi vòng;
- các đơn dựng sẵn báo lỗi máy chủ khi gia hạn hoặc thêm người (D4);
- nếu Docker khởi động lại giữa buổi thì giấy tờ đã nhập không mở lại được;
- chưa có câu cảnh báo SEC-G4.

UXR cũng đề nghị sửa #1 và #2 trước buổi thử.

**Còn thiếu cụ thể (ĐK-S3-10, rồi ĐK-S3-1):**
1. OPS: truyền khóa mã hóa cố định vào api, worker và pha seed của demo (UXR #1). Kiểm bằng cách khởi động lại api rồi mở giấy tờ D4.
2. FE: sửa `Idempotency-Key` khi tải ảnh (UXR #2). Chi hoàn tiền mặt và chuyển khoản ghi được.
3. ORC: thêm câu SEC-G4 vào `demo-1-limits.md` mục C ("Bỏ người khỏi đoàn khi khách đã gửi ảnh giấy tờ qua link: hệ thống có thể xóa nhầm ảnh của người còn ở – đang sửa ở Sprint 4").
4. OPS: dựng lại từ commit mới bằng `demo-up.sh --smoke`, ghi `demo-1.md` mục 6.
5. UXR: đi lại KB4, KB6, KB8; bỏ các dòng đã sửa khỏi limits mục C; cập nhật mốc D5. Sau đó OPS gửi câu "XONG".

**Nên gộp vào cùng bản dựng**, vì đều là sửa nhỏ ở FE: UXR #3 (nhập giấy tờ), #7 (thêm người có phụ thu), #6 ("Đã thu"), #5, và #4 (BE). Lỗi nào chưa sửa thì giữ dòng của nó trong limits mục C. Các dòng đó đã có.

Nếu ORC muốn gửi bản đang chạy ngay thì đó là gửi khi QC chưa cho qua. ORC phải báo INV rõ 3 chỗ đang vướng (limits mục C đã ghi) và để INV tự quyết. QC không đề xuất cách này.

Buổi thử này **không thay** cho việc chạy A1 trên staging và thử với nhân viên thật.

## 11. QC không kiểm được
- **Không đăng nhập bản demo, không bấm giao diện.** Phiên này không có yêu cầu trực tiếp từ chủ đầu tư để dùng tài khoản demo. Kết quả bấm thử lấy từ UXR. QC xác nhận lỗi bằng cách đọc mã (QC-S3-08) và probe chỉ đọc (`/health`, các cổng).
- **Không chạy lại stack, E2E, bộ api hay test SEC.** Số liệu lấy từ log CI 38998735861 và từ báo cáo QA, SEC, các vòng kiểm chứng. Riêng SEC-BE-53, QC đọc mã khớp với mô tả của SEC (`registration.service.ts:1931`), nhưng không chạy lại R1–R6.
- **Chưa đọc mã cho UXR #8–#11.**
- **Không biết lượt 1 của TC-L3-011 hỏng vì sao.** QA cũng không tìm được: không có artifact.
- **Không kiểm:** thiết bị thật, VoiceOver, hiệu năng p95, Caddy prod với tên miền thật.
