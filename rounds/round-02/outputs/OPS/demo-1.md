# OPS – Demo 1 cho chủ đầu tư (localhost, máy Mac này)

- Người viết: OPS | Ngày: 17/10/2026 | Bản dựng thử: commit `5304fc8` (sẽ dựng lại từ HEAD sau khi QC Sprint 3 đạt – xem mục 7)
- Hướng dẫn cho anh/chị (UXR viết, OPS đã điền phần dữ liệu): `rounds/round-02/demo-1-guide.md`, `demo-1-limits.md`
- **Không có mật khẩu trong tệp này.** Tài khoản, mật khẩu, link khách: `product/infra/demo/.out/demo-accounts.md` (quyền 0600, nằm trong .gitignore, không bao giờ in ra màn hình/log)

## 1. Bật, tắt, làm lại

| Việc | Lệnh (Terminal, từ thư mục `hotel-app`) | Thời gian |
|---|---|---|
| Bật (build từ git HEAD + dựng dữ liệu theo hôm nay) | `./product/infra/demo/demo-up.sh` | lần đầu 5–8 phút (build), các lần sau ~2 phút |
| Bật kèm tự kiểm (smoke) rồi dựng lại dữ liệu sạch | `./product/infra/demo/demo-up.sh --smoke` | +1–2 phút |
| Dựng từ một commit khác | `./product/infra/demo/demo-up.sh --ref <commit>` | như trên |
| Làm lại từ đầu (xóa mọi thao tác, dữ liệu theo hôm nay, mật khẩu + link mới) | `./product/infra/demo/demo-reset.sh` | ~2 phút |
| Tắt (xóa container + dữ liệu demo) | `./product/infra/demo/demo-down.sh` | vài giây |
| Chỉ dừng, giữ dữ liệu | `./product/infra/demo/demo-down.sh --keep` | |
| Gỡ hẳn (image, bản sao mã nguồn, tệp tài khoản) | `./product/infra/demo/demo-down.sh --purge` | |

Câu báo sẵn sàng: `XONG – demo từ commit <sha>:` kèm 3 địa chỉ và đường dẫn tệp tài khoản. Cần: OrbStack (Docker) đang chạy, Node 22, git.

## 2. Địa chỉ (chỉ trên máy này)

| Ứng dụng | Địa chỉ | Ghi chú |
|---|---|---|
| Desk – lễ tân, quản lý, chủ đầu tư, sale, CTV | http://localhost:8181 | dùng chữ `localhost`, không dùng `127.0.0.1` (kiểm Origin như staging) |
| App nhân viên (PWA) | http://localhost:8182 | màn buồng phòng/bảo trì là Sprint 4 |
| Web khách (check-in online) | http://localhost:8183 | link `/g/…` trong tệp tài khoản |
| API (chỉ để kiểm thử) | http://127.0.0.1:3100 | PostgreSQL không mở cổng |

Stack riêng `ottimo-demo` (container, mạng, volume riêng), **không đụng** stack dev `ottimo-dev` (3000/8081-8083) hay các stack QA. Cookie theo `localhost` dùng chung giữa các cổng: không mở song song desk của stack dev và demo trong cùng trình duyệt; đổi vai bằng Đăng xuất (hoặc cửa sổ ẩn danh).

## 3. Cách dựng (để QC/SEC kiểm)

1. `git archive <ref> product` vào `~/.ottimo-demo/src` (ngoài repo, để không bị lint/format/docker build context quét), build 3 image: `ottimo-api:demo` (**INCLUDE_TEST_SUPPORT=0** – không có `/__test__`), `ottimo-api:demo-seed` (có endpoint kiểm thử, **chỉ dùng trong pha dựng dữ liệu**), `ottimo-web:demo`. `.env` riêng sinh bằng `infra/ci/make-ci-env.sh` (mật khẩu DB, token ngẫu nhiên), origin `http://localhost:818x`, `STAFF_REQUESTS_PER_MINUTE` = 600.
2. Compose dev của bản archive + lớp phủ `infra/demo/docker-compose.demo.yml` (cổng 8181–8183/3100, bỏ cổng PostgreSQL, image riêng).
3. **Pha 1 (đồng hồ giả)**: api/worker `ottimo-api:demo-seed`, `CLOCK_MODE=mutable`. Nạp DS-E (10 căn thật OTTIMO, kênh, 139 tham số – trong bản sao, ngày hiệu lực tham số dời về 120 ngày trước hôm nay), rồi `seed-demo.mjs past` **qua API** (đúng quy tắc nghiệp vụ): 8 tài khoản demo, thiết bị quầy tin cậy, 31 khách giả, các lượt ở bắt đầu trước hôm nay được nhận phòng **đúng ngày đến** (tua đồng hồ), giữ chỗ D5 tạo 7 giờ trước "bây giờ".
4. **Pha 2 (đồng hồ thật)**: api/worker đổi sang `ottimo-api:demo`, `CLOCK_MODE=system`, `INCLUDE_TEST_SUPPORT=0` → `seed-demo.mjs now`: tài khoản nhận VietQR, đơn hôm nay + 2 tuần, OTA chưa gán căn, OOO, báo giá CTV, link khách, tắt 13 tài khoản `qa.*`, ghi `.out/demo-accounts.md` + 2 ảnh mẫu giả.
5. `--smoke` (`smoke-demo.mjs`): 8 vai đăng nhập + đọc màn chính, rack 14 ngày + công suất, nhập giấy tờ + nhận phòng D1 trên máy tin cậy, VietQR + xác nhận tiền + trả phòng D3, mở link khách + đọc lượt ở. Đạt thì **dựng lại dữ liệu sạch** (smoke làm thay đổi kịch bản).

## 4. Tài khoản (không ghi mật khẩu ở đây)

| Vai | Đăng nhập | Tên hiển thị |
|---|---|---|
| OWN (chủ đầu tư) | `chunha` | Chủ nhà OTTIMO |
| MGR | `quanly.thao` | Quản lý Thảo |
| FDL | `truongca.khoa` | Trưởng ca Khoa |
| FD | `letan.linh` | Lễ tân Linh |
| SAL | `sale.duc` | Sale Đức |
| CTV | `ctv.minhanh` | CTV Minh Anh |
| HK | `buongphong.hoa` | Buồng phòng Hoa |
| MT | `kythuat.tam` | Kỹ thuật Tâm |

Mật khẩu: 18 ký tự ngẫu nhiên, **đổi mỗi lần dựng**, không có `mustChangePassword` (đã tự đổi qua API sau khi tạo). Tài khoản `qa.*` của DS-E bị tắt (`disabled`).

**Máy quầy tin cậy (C3)**: không thể cấp sẵn cho trình duyệt của anh/chị (quyền nằm trong cookie của chính trình duyệt) → giữ **Bước 0** của hướng dẫn (OWN → Quản trị › Thiết bị được cấp → Cấp quyền thiết bị này). Dự phòng: tệp tài khoản có 1 dòng dán vào Console (cookie của thiết bị "Máy quầy lễ tân (demo)" mà script đã cấp qua API – cùng cơ chế với thiết bị DS-E; hạn 180 ngày).

## 5. Kịch bản dữ liệu (mã đơn/căn/khách cố định; ngày tính theo hôm chạy lệnh = N)

| Mã | Tình huống | Căn | Khách | Đơn | Ghi chú |
|---|---|---|---|---|---|
| D1 | Đến hôm nay, cọc ~30 % (trực tiếp) | 102 (VC) | Nguyễn Thu Trang | OTM-00007 | N→N+2, còn phải thu ~1,1 tr; **chưa** nhập giấy tờ (KB4 nhập tay) |
| D2 | OTA trả trước, đến hôm nay | 302 (VC) | Anna Petrova | OTM-00008 | Agoda, 3 NL, còn phải thu 0 |
| D3 | Đang ở, trả hôm nay, còn nợ | 103 | Trần Minh Quân | OTM-00002 | ở từ N−2; nợ 60.000 đ giặt ủi; minibar căn có 4 món chuẩn |
| D4 | Đang ở giữa kỳ | 202 | Lê Hoàng Yến | OTM-00003 | N−2→N+3, 2 NL / định mức 2 → thêm NL có phụ thu; trống N+3, N+4 để gia hạn |
| D5 | Giữ chỗ đếm ngược | 201 | Nghiêm Hải Yến | OTM-00006 | sale giữ 12 giờ, **hết hạn ~5 giờ sau lúc chạy lệnh** (giờ cụ thể trong tệp tài khoản) |
| D6 | Báo giá CTV | 402 | Vương Thị Hồng | BG-00002 | N+8, 3 đêm; CTV đang giữ 0 chỗ (giới hạn 3) |
| D7 | Dài hạn nhập tay | 301 | Đặng Quốc Bảo | OTM-00001 | từ N−30, 182 đêm, CTV chốt, HĐ ngoài, nhãn "Nhập tay" |
| D8 | OOO | 203 | – | – | khóa N+2→N+4 "Thay bình nóng lạnh…" (hôm nay 203 có khách Booking.com) |
| D9 | OTA chưa gán căn | (làn đỏ) | Elena Ivanova | OTM-00027 | Expedia, 4 NL, N+6→N+8; nhóm 2 phòng ngủ kín → gán được vào 402 |
| D10 | Đến mai + link check-in online | 402 | Võ Ngọc Ánh | OTM-00011 | 2 NL; link `http://localhost:8183/g/…` trong tệp tài khoản |

Thêm: 2 khách nữa đến hôm nay (203 Booking.com OTM-00009, 201 khách quen OTM-00010 cọc chuyển khoản – "chờ đối soát"), khách CTV đang ở 101 (OTM-00005), khách Booking.com đang ở 401 (OTM-00004), 14 đơn tương lai (trực tiếp, sale, Airbnb, Booking.com, Agoda). **Sơ đồ 14 đêm tới: 76/140 đêm-phòng ≈ 54 %** + 2 đêm OOO. Phòng D1/D2 ở trạng thái VC (sạch, chờ kiểm).

**VietQR**: tham số `payment_receiving_account` được đặt **qua API bằng OWN** (xác nhận lại mật khẩu) từ 3 dòng `PAYMENT_VIETQR_*` đã comment trong `product/.env` – đọc từ tệp, không in ra đâu (đã kiểm: không có trong log script, log container). Đội không biết đó là tài khoản thật hay thử; hướng dẫn ghi rõ chỉ quét để xem. Không có 3 dòng đó → tệp tài khoản ghi "CHƯA cấu hình – OWN nhập ở Tham số".

## 6. Kiểm chứng (17/10/2026, OrbStack, commit 5304fc8)

| Kiểm | Kết quả |
|---|---|
| `demo-up.sh --smoke` (build + 2 pha + smoke + dựng lại) | exit 0, 1 phút 30 (image đã cache) |
| Smoke | **ĐẠT**: 8/8 vai đăng nhập + màn chính; rack 14 ngày; công suất 54 %; nhập giấy tờ + nhận phòng OTM-00007 (phụ thu nhận sớm theo xem trước); VietQR 60.000 đ + xác nhận + trả phòng OTM-00002; mở link khách + đọc lượt ở căn 402 |
| Giao diện (Chromium không đầu, vai lễ tân) | sơ đồ phòng hiện đúng: làn đỏ "Chưa gán căn" + khung báo, giữ chỗ có đồng hồ cát, OOO có sọc khóa, dài hạn "Nhập tay", tên khách tiếng Việt; không lỗi CSP |
| Bí mật | 0 mật khẩu/token/link/số tài khoản trong log script và log container; `.out/demo-accounts.md` 0600; `.out`, `~/.ottimo-demo` không vào git/docker build context (`.dockerignore` thêm `infra/demo/.out`, `.work`) |
| `prettier --check infra/demo`, `eslint infra/demo`, shellcheck `infra/demo/*.sh` | sạch (CI `infra-scripts` thêm `infra/demo/*.sh`) |

### 6b. Kiểm chứng lại sau vòng sửa 9 (17/10/2026 chiều, ORC ghi – ĐK-S3-1, ĐK-S3-10)

| Kiểm | Kết quả |
|---|---|
| `demo-up.sh --smoke` từ commit **9a221ee** (vòng sửa 9: khóa mã hóa demo ổn định, lỗi ghi trên Desk) | exit 0, dòng XONG 13:42:48. **SMOKE ĐẠT**: thêm bước trả muộn sau giờ ân hạn (phụ thu 259.000 đ ghi vào bill) → VietQR 319.000 đ → xác nhận → trả phòng OTM-00002 |
| Hai lần smoke đỏ trước đó (13:3x) | Không phải lỗi sản phẩm: smoke chưa xử lý quyết định phụ thu trả muộn sau 12:30 (afe34f1, 9a221ee sửa – ghi trả muộn B15 trước khi thu, như quy trình quầy) |
| UXR đi lại KB1–KB4, KB6–KB8 bằng Chromium không đầu trên bản 9a221ee | Mọi KB đi được; KB7 sau 12:30 phải bấm **Trả muộn** trước (lỗi P1 màn Trả phòng – đang sửa, hướng dẫn v1.2 đã ghi) |
| Khóa mã hóa (BUG-R2-065) | Khởi động lại api + worker vẫn mở lại được số và ảnh giấy tờ |
| Làm mới cho chủ đầu tư | `demo-reset.sh` – dòng XONG **14:20:08**, giữ chỗ D5 hết hạn **19:19**; 8181/8182/8183 và /health trả 200 |

### 6c. Kiểm chứng sau vòng sửa 9b/9c (17/10/2026 chiều, ORC ghi – ĐK-S3-1 bản 3)

| Kiểm | Kết quả |
|---|---|
| `demo-up.sh --smoke` từ commit **fe4b166** (UXR chạy) | **SMOKE ĐẠT** 18/18 dòng, dòng XONG 15:20:02 |
| UXR đi lại KB1–KB4, KB6–KB9 + FE-07 | Đạt; KB7 vào thẳng Trả phòng sau 12:30 được (không cần đi vòng); 6 lỗi mới mức P3 (N1–N6, QA ghi sổ) |
| QC kiểm chỉ đọc 15:51 | 8181/8182/8183 và `/health` trả 200, `built-from` = fe4b166 |
| Làm mới cho chủ đầu tư | `demo-reset.sh` – XONG **15:46:04**, giữ chỗ D5 hết hạn **20:45 ngày 17/10**. Thử ngày khác: chạy `demo-reset.sh` trước |

## 7. Việc khi QC Sprint 3 đạt

`./product/infra/demo/demo-up.sh --smoke` ngay trước buổi demo (dựng từ HEAD mới, ~2–8 phút), gửi anh/chị câu "XONG" + nhắc mở tệp tài khoản. Nếu HEAD đổi thứ tự/quy tắc làm smoke đỏ, script dừng và in lỗi – OPS sửa `seed-demo.mjs` theo hợp đồng mới.

## 8. Phát hiện cho vai khác

| Ai | Việc |
|---|---|
| FE | Sơ đồ phòng: thanh khóa OOO hiện khóa i18n thô `Khóa · status.b…` (thiếu chuỗi cho trạng thái khối `planned`) |
| FE/PO | Desk dùng `localhost:8181`, staff `localhost:8182`: cookie phiên `ottimo_sid` dùng chung theo host (khác cổng vẫn chung) – khi demo hai vai song song phải dùng cửa sổ ẩn danh. Staging tách tên miền nên không gặp |
| QA | `smoke-demo.mjs` có thể dùng làm bài kiểm nhanh trước mỗi lần giao bản demo |

## 9. File tạo/sửa
- Tạo: `product/infra/demo/demo-up.sh`, `demo-reset.sh`, `demo-down.sh`, `lib.sh`, `seed-demo.mjs`, `smoke-demo.mjs` (cùng `docker-compose.demo.yml`, `.gitignore` đã có trong HEAD)
- Sửa: `product/.dockerignore` (bỏ `infra/demo/.out`, `.work` khỏi build context), `.github/workflows/ci.yml` (shellcheck `infra/demo/*.sh`), `rounds/round-02/demo-1-guide.md` (điền ô OPS), `rounds/round-02/demo-1-limits.md` (dòng VietQR, hạn giữ chỗ)
- Không commit: `.out/` (tài khoản, link, ảnh mẫu), `~/.ottimo-demo/` (bản sao mã nguồn, demo.env, state.json)
