# SEC – Review đề xuất BUG-R4-054 và kiểm sẵn sàng vận hành 06/11 (OPS)

Round 4 · bước **Review** · SEC · 06/11/2026 (tối)
Đối tượng:
- `rounds/round-04/outputs/OPS/bug-r4-054-proposal.md` (phương án A+, 7 rủi ro, 4 câu hỏi cho SEC), cùng phát hiện "basic auth staging đi tới api";
- `rounds/round-04/outputs/OPS/ops-readiness-06-11.md` (OR-H1, OR-M1…M4, OR-L1…L7, mục 9 dữ liệu thử staging).

SEC đã đọc thêm: `product/infra/caddy/Caddyfile.landing`; `infra/server/bin/init-secrets.sh`, `pull-backups.sh`, `backup.sh`, `ops-check.sh`; `bootstrap-vps.sh` (khóa `--deploy-key`); `services/api/src/http.ts` (log của api); `estimate-token.ts`, `form-token.ts` (khóa ký token); `product/docs/security/security-requirements.md` SR-BAK, SR-LOG; `threat-model.md` TM-15, TM-52.
SEC không SSH, không gọi API. Tệp này không có IP, bí mật hay digest đầy đủ.

---

# Phần A – BUG-R4-054

## A1. Kết luận: **DUYỆT CÓ ĐIỀU KIỆN**

- **`header_up -Authorization`**: duyệt, áp cho **cả hai môi trường**, làm **trước và tách riêng** khỏi A+ (FB-R4-SEC-OPS-054-01). Đây là phần bắt buộc của v1.0.5.
- **Phương án A+** (miễn basic auth cho đúng 3 route khi mở một lượt thử): duyệt **có điều kiện** 054-02 … 054-05. Phải có cửa sổ **tự đóng**, hoặc lời nhắc tới kênh có người đọc (054-02). Staging hiện chỉ gửi cảnh báo vào journal, nên lời nhắc "mỗi 6 giờ trong journal" của R4 không tới ai.
- Đội đang chuyển sang vận hành và sẽ ít khi thử form trên staging. Vì vậy OPS **được** dời A+ sang backlog và giữ C (chèn header, README 12.3), nếu v1.0.5 chật. `header_up -Authorization` thì không dời.

## A2. Đánh giá phát hiện "mật khẩu xem trước đi tới api staging"

- **Cơ chế:** `basic_auth` của Caddy xác thực xong vẫn giữ header `Authorization`, và `reverse_proxy` trong `(public_api)` (`Caddyfile.landing` dòng 85–94) chuyển nguyên header đó. Trình duyệt thường **không** gửi header này cho 3 route, vì landing gọi `fetch` với `credentials: 'omit'`. Header chỉ đi kèm khi công cụ tự chèn: QA Playwright ở S6, và các script `curl --config` của ORC hôm nay (mỗi lượt gọi giá ở S6b–S6d). Vậy mật khẩu đã tới api staging vài trăm lần.
- **Mức: Thấp → thẻ Minor.** Lý do:
  - api không ghi header: serializer `req` chỉ ghi `id`, `method`, route mẫu; `req.headers.authorization` và `cookie` còn bị `redact` thêm (`http.ts` dòng 20–35, 348–354). Log Caddy xóa toàn bộ header (`request>headers delete`).
  - Không có dịch vụ theo dõi lỗi bên ngoài (SR-LOG-05).
  - Mật khẩu chỉ khóa **trang xem trước**, vốn có cùng nội dung với trang thật. Nó không phải mật khẩu Desk và không mở được dữ liệu khách.
  - Nhưng một bí mật không nên vượt ranh giới Caddy → api. Nếu sau này api ghi header khi gỡ lỗi, hoặc có ai gắn công cụ đo, mật khẩu sẽ nằm trong log.
- **Đổi mật khẩu xem trước: không cần.** Mật khẩu chỉ nằm trong bộ nhớ tiến trình api staging, không vào log hay đĩa.
- **Header khác:** `Cookie` không cần gỡ. Cookie Desk dùng tiền tố `__Host-` (chỉ gắn với đúng host Desk), nên không bao giờ đi tới `ottimo.vn`/`staging.ottimo.vn`.

## A3. Thẻ feedback

### FB-R4-SEC-OPS-054-01
- Mức độ: Minor
- Vị trí: `product/infra/caddy/Caddyfile.landing` `(public_api)` dòng 85–94; `infra/ci/check-caddy-landing.sh`
- Vấn đề: header `Authorization` (basic auth xem trước của staging) được chuyển nguyên tới api khi client gửi kèm (mục A2).
- Vì sao quan trọng: bí mật vượt ranh giới Caddy → api, đi ngược SR-LOG-01. Hiện chưa lộ ra log nhờ serializer/redact của api.
- Đề xuất sửa: thêm `header_up -Authorization` trong `reverse_proxy` của `(public_api)`, cho cả staging và production. Commit **riêng**, không chờ A+. CI thêm ca: api giả nhận `Authorization` rỗng, với snippet staging và snippet production, cho cả 3 route. Nên kiểm một lần trên staging sau khi deploy, qua edge thật (OPS hoặc QA).
- Trạng thái: Open

### FB-R4-SEC-OPS-054-02
- Mức độ: Major (điều kiện của A+)
- Vị trí: đề xuất mục 5 R4, mục 6 (`ops-check previewform`); `ops-readiness-06-11.md` mục 2 ("Staging: chỉ journal")
- Vấn đề: lưới an toàn khi quên tắt là `WARNING` lúc deploy và `ops-check` staging nhắc mỗi 6 giờ. Nhưng `ALERT_WEBHOOK_URL` của staging rỗng, nên lời nhắc chỉ vào journal và không ai đọc. Từ nay đội chỉ review định kỳ, nên "quên tắt" là kịch bản dễ xảy ra nhất.
- Vì sao quan trọng: 3 route api staging mở ra internet vô thời hạn (R1). Staging có thể chạy mã mới hơn production, và nhận yêu cầu có dữ liệu cá nhân thật (R2).
- Đề xuất sửa (bắt buộc **một** trong hai, SEC khuyến nghị cách 1):
  1. **Tự hết hạn.** Thay cờ `on/off` bằng `LANDING_PREVIEW_FORM_OPEN_UNTIL=<unix giây>`, mặc định 0. Caddy chỉ miễn khi giờ hiện tại nhỏ hơn mốc đó (biểu thức CEL so với `{time.now.unix}`; OPS kiểm cú pháp bằng `caddy validate` và ca CI mốc quá khứ → 401, mốc tương lai → miễn). `deploy-landing.sh` từ chối mốc quá **4 giờ** kể từ lúc chạy, và từ chối mọi mốc khác 0 khi `APP_ENV=production`. Biểu thức thời gian của Caddy không ổn định thì làm cách tương đương: `systemd-run --on-active=<≤ 4h>` tự đặt lại `off` và deploy lại.
  2. **Nhắc tới người đọc.** Mục `previewform` gửi tin vào phòng "OTTIMO – Báo động" (ví dụ ops-check production đọc trạng thái công tắc của staging, chỉ tên khóa + giá trị on/off), nhắc mỗi 6 giờ tới khi tắt.
- Trạng thái: Open

### FB-R4-SEC-OPS-054-03
- Mức độ: Minor
- Vị trí: đề xuất mục 6, matcher `@preview_gate`
- Vấn đề: phần miễn chỉ so đường dẫn, không so method. `PUT`/`DELETE`/`OPTIONS`/`GET …/booking-requests` cũng qua cổng, rồi mới bị 404 ở `@closed`. Hôm nay vô hại, nhưng phần miễn rộng hơn phần được chuyển tiếp. Sau này ai sửa thứ tự `handle` thì sẽ mở rộng ngoài ý.
- Vì sao quan trọng: nguyên tắc ít quyền nhất. Phần miễn mật khẩu phải bằng đúng 3 thao tác được proxy.
- Đề xuất sửa: phần miễn = (GET `form-token`) hoặc (GET `price-estimate` có query `^[!-~]{0,256}$`) hoặc (POST `booking-requests`), cùng regex slug với các matcher hiện có. CI thêm ca "OPEN, `PUT …/booking-requests` không mật khẩu → 401". `deploy-landing.sh` từ chối mở cửa sổ nếu `INCLUDE_TEST_SUPPORT` khác 0 (đọc 06/11 là 0; phòng một lượt thử sau bật lại).
- Trạng thái: Open

### FB-R4-SEC-OPS-054-04
- Mức độ: Minor
- Vị trí: rủi ro R1; `init-secrets.sh` (`id_hash_key`, khóa ký form)
- Vấn đề: khi mở, người ngoài tự lấy được token ước tính `pe1` và form token của **staging**. Token ước tính ký bằng khóa con HKDF của `id_hash_key`. Form token ký bằng `PUBLIC_FORM_SIGNING_KEY`. Nếu hai stack dùng chung khóa (ví dụ từng chép `secrets/` từ stack này sang stack kia), token staging có thể được production chấp nhận: giá "khách thấy" lấy từ staging xuất hiện trên Desk production (T7).
- Vì sao quan trọng: `init-secrets.sh` sinh khóa ngẫu nhiên cho từng stack, nên khả năng trùng thấp. Nhưng chưa ai kiểm, và kiểm thì gần như không tốn gì.
- Đề xuất sửa: trước lần mở đầu tiên, OPS so (bằng root, trên máy chủ) 8 ký tự đầu sha256 của `id_hash_key` và `public_form_signing_key` giữa hai stack, chỉ ghi "khác"/"trùng" vào biên bản. Trùng → dừng, báo SEC, sinh lại khóa staging.
- Trạng thái: Open

### FB-R4-SEC-OPS-054-05
- Mức độ: Minor
- Vị trí: rủi ro R2, R3; câu hỏi 4; README `infra/server` 12.3
- Vấn đề: chưa có quy trình kết thúc một lượt mở.
- Vì sao quan trọng: yêu cầu web của người lạ trên staging là dữ liệu cá nhân thật trong môi trường thử (SR-BAK-05 cấm dữ liệu thật ở staging dùng chung).
- Đề xuất sửa: biên bản mỗi lượt mở (người chạy lượt thử ghi, QA hoặc OPS) gồm: giờ mở/đóng theo log deploy; số yêu cầu web tạo trong khoảng đó, đếm bằng SQL chỉ đọc; số của đội (`@example.test`, tên QA); số còn lại. Chỉ ghi số đếm, không tên, không liên hệ. Số còn lại > 0 → xóa trên Desk staging theo WR8 trong 24 giờ, ghi "đã xóa N", báo SEC nếu N > 3 (dấu hiệu bot dò). Runbook ghi: **không mở** khi staging đang thử bảng giá chưa công bố (R3).
- Trạng thái: Open

### FB-R4-SEC-OPS-054-06
- Mức độ: Suggestion
- Vị trí: đề xuất mục 6 `init-secrets.sh --refresh-landing-access`; `deploy-landing.sh` smoke; OR-L5
- Vấn đề / đề xuất:
  - `--refresh-landing-access`: ghi tệp tạm rồi `mv`, giữ `0400` và chủ là UID của caddy, không in băm. Từ chối khi `APP_ENV=production`. Test kiểm quyền và chủ sau khi chạy.
  - Trong lúc mở, smoke staging kiểm luôn CSP/HSTS trên phản hồi của route công khai. Phản hồi từ api đi qua `landing_headers` nên có đủ header của trang. Cách này đóng OR-L5 mà không phải nới quyền tệp mật khẩu (xem B2).
- Trạng thái: Open

## A4. Trả lời 4 câu hỏi của OPS

1. **Chấp nhận A+?** Có, với điều kiện 054-02 … 054-05. Không bắt buộc làm A+ ở v1.0.5. Nếu chưa làm thì giữ C.
2. **Công tắc tự hết hạn?** **Có**, hoặc nhắc tới kênh có người đọc (054-02). `WARNING` + `ops-check` staging là chưa đủ, vì staging chỉ ghi journal.
3. **`header_up -Authorization` cho cả production?** **Đồng ý.** api không dùng header này trên 3 route công khai. Trên production trình duyệt không gửi nó (`credentials: 'omit'`, không có basic auth), nên áp chung chỉ là phòng thủ thêm, không đổi hành vi.
4. **Đếm yêu cầu lạ có cần ghi biên bản QA?** **Có**, theo 054-05: chỉ ghi số đếm, xóa trong 24 giờ theo WR8.

## A5. Bảy rủi ro – ý kiến SEC

| # | Mức OPS | Mức SEC | Ý kiến |
|---|---|---|---|
| R1 – mở 3 route api staging | Trung bình khi bật | Trung bình khi bật, 0 khi tắt | Chấp nhận khi có 054-02 (tự đóng), 054-03 (miễn đúng 3 thao tác), 054-04 (khóa riêng từng stack). Các chốt hiện có (16 KB, query 256 byte ASCII, giới hạn RAM theo IP, bulkhead 4, `Sec-Fetch-Site`) vẫn áp |
| R2 – dữ liệu thật vào staging | Thấp | Thấp | Chấp nhận với 054-05 |
| R3 – lộ giá staging | Thấp | Thấp | Chấp nhận: giá đã công khai từ F2. Thêm luật "không mở khi thử bảng giá chưa công bố" vào runbook |
| R4 – quên tắt | Thấp – trung bình | **Trung bình** với thiết kế hiện tại | **Chưa chấp nhận** tới khi có 054-02 |
| R5 – bật nhầm production | Rất thấp | Rất thấp | Chấp nhận. Giữ chốt `deploy-landing.sh` và thêm ca CI production + mốc mở → không đổi gì |
| R6 – mật khẩu tới api | Thấp | Thấp (Minor) | Sửa ở 054-01, làm trước |
| R7 – đổi snippet bí mật | Thấp | Thấp | Chấp nhận với 054-06 (ghi nguyên tử, giữ quyền) |

---

# Phần B – Kiểm sẵn sàng vận hành 06/11

## B1. Bảng ý kiến SEC

Ghi chú cột "Đợt": **Ngay** = làm trước khi đội rời Round 4, không chờ bản mới; **v1.0.5** = cùng đợt sửa tới; **Backlog** = khi có dịp.

| Mục | SEC | Mức | Đợt | Ghi chú SEC |
|---|---|---|---|---|
| **OR-H1** bản ngoài máy cũ 7 ngày | **Đồng ý + sửa** | Major (hạ từ Cao vì ORC đã kéo 06/11 khoảng 19:00, bản mới nhất `db-20261106T070832Z`, checksum khớp) | Ngay: kéo tay ≥ 2 ngày/lần tới khi tự động. v1.0.5: tự động | Tự động hóa phải đạt **FB-R4-SEC-OPS-OR-01** (`--ignore-existing`) và **OR-02** (điều kiện máy nhận). Cài launchd trên máy INV là cấu hình lâu dài trên máy của INV, nên cần INV đồng ý. PA2 (máy phụ) có chi phí → ESC riêng khi đội muốn làm |
| **OR-M1** diễn tập khôi phục quá hạn | **Đồng ý** | Major (SR-BAK-05 "mỗi round", Round 4 chưa có) | Ngay (cần INV 30 phút mở khóa `age`). `ops-check drill` ở v1.0.5 | Diễn tập phải gồm: môi trường cách ly, **không** khôi phục vào staging dùng chung; giải mã 1 ảnh mẫu bằng KEK; áp lại `purge_journal` rồi chạy J16 (SR-BAK-06); xóa dữ liệu khôi phục sau khi xong. Biên bản vào repo **chỉ số đếm** (đóng D-T3). `ops-check drill` 35 ngày: đồng ý, mức Minor |
| **OR-M2** không có WAL, RPO thật 24 giờ | **Đồng ý (a)** | Minor | v1.0.5 | Thêm lượt dump 14:00: cùng mã hóa `age`, cùng chủ/quyền. Vòng xoay phải tính **theo tuổi** (mọi bản ≤ 35 ngày), không theo số bản. Sửa `hosting-plan.md`. SEC sửa SR-BAK-01 ghi "WAL chưa có; RPO 12 giờ từ v1.0.5" khi bản này lên. RPO 15 phút là `[GIẢ ĐỊNH – chờ INV xác nhận]` (decision-log 15/10), nên ORC đưa "RPO 12 giờ" vào tổng kết cho INV xác nhận. WAL (b) để khi có máy phụ |
| **OR-M3** log mất khi dựng lại container | **Đồng ý + sửa** (FB-R4-SEC-OPS-OR-04) | Minor | v1.0.5 | Yêu cầu SEC: giữ qua deploy, **trần cứng 90 ngày** (T16), không đổi cách che. Hiện driver `local` chỉ xoay theo dung lượng, nên lúc ít deploy log có thể sống quá 90 ngày. SEC nghiêng về driver `journald` + `MaxRetentionSec=90day`; ARC chọn |
| **OR-M4** chưa diễn tập dựng lại VPS | **Đồng ý** | Minor | Runbook "VPS mới" ở v1.0.5. Diễn tập: Backlog, cần ESC (chi phí) | Diễn tập trên VPS thuê theo giờ dùng **dữ liệu staging** (giả), không đưa dữ liệu production lên máy dùng một lần. Phần KEK/`age` ngoại tuyến thì kiểm trong OR-M1. Hai xác nhận có/không của INV (mục 11.3 OPS) là điều kiện của SR-BAK-03 và TM-14 |
| **OR-L1** khóa `.env` trùng | Đồng ý | Suggestion | v1.0.5 | `ops-check` chỉ in **tên** khóa trùng. Bỏ dòng rỗng ở lần sửa `.env` tới (khuôn E2) |
| **OR-L2** `fwupd` hỏng | Đồng ý | Suggestion | Ngay hoặc v1.0.5 (OPS, root, một lần) | Không ảnh hưởng bảo mật. Bớt nhiễu cho `systemctl --failed` |
| **OR-L3** `privacy-notice.log` staging thuộc root 0644 | **Đồng ý** (SEC cho phép sửa tay một lần) | Minor | Ngay hoặc v1.0.5 (staging) | `chown ottimo:ottimo` + `chmod 0600`. Tệp có id người thao tác, không nên để mọi user đọc. Không xóa, không cắt nội dung (là bằng chứng). Đồng ý (d)(e) của README 12.3 |
| **OR-L4** khóa `ottimo-ops` vào thẳng `ottimo` | **Đồng ý gỡ** (FB-R4-SEC-OPS-OR-03) | Minor | v1.0.5 (cửa sổ bảo trì đầu tiên) | Chi tiết ở thẻ OR-03 |
| **OR-L5** smoke landing staging không kiểm CSP/HSTS | **Sửa** | Thấp – chấp nhận | Backlog (gộp 054-06) | **Không** cấp `root:ottimo 0440` cho mật khẩu xem trước. `ottimo` là user của CI, nên nới quyền thì CI bị lộ cũng lộ mật khẩu. Header đã được kiểm bằng CI (`check-caddy-landing.sh`, cùng digest Caddy) và smoke production (cùng image) |
| **OR-L6** không dọn image | Đồng ý | Suggestion | Backlog | Không bao giờ xóa `current_tag`, `previous_tag`, `landing_tag`, `landing_previous_tag`, và image của lần diễn tập khôi phục gần nhất |
| **OR-L7** cảnh báo chỉ tới một người | Đồng ý | Suggestion | INV tự quyết | Tin cảnh báo chỉ có tên mục kiểm và số đếm, không có dữ liệu khách (test `ops-check-price` 1b, 5b). Thêm MGR vào phòng "Báo động" không làm lộ gì |
| Mục 9 – `TEST_SUPPORT_ALLOW_IPS` staging còn giá trị | Đồng ý làm rỗng | Suggestion | Lần sửa `.env` staging tới | Tối thiểu dữ liệu: đây là địa chỉ IP, không có tác dụng khi `INCLUDE_TEST_SUPPORT=0` |
| Mục 9 – 6 bản `env.before-*` staging | Đồng ý giữ bản mới nhất | Minor | Lần sửa `.env` staging tới | Theo SEC PR23-05: bản cũ lặp lại chuỗi kết nối DB có mật khẩu |
| Mục 9 – 8 yêu cầu "QA S6" | Không yêu cầu | – | – | Dữ liệu giả của QA. Xóa theo WR8 nếu muốn hộp thư sạch |

## B2. Thẻ feedback

### FB-R4-SEC-OPS-OR-01
- Mức độ: Major
- Vị trí: `product/infra/server/bin/pull-backups.sh` dòng 7 và 36–38
- Vấn đề: chú thích hứa "a compromised server cannot wipe this copy". Đúng là không có `--delete`, nhưng `rsync -rt` vẫn **ghi đè** tệp cục bộ khi tệp cùng tên trên máy chủ đổi cỡ hoặc giờ sửa. Kẻ chiếm VPS chỉ cần ghi rác vào các `db-*.dump.age` cũ (giữ tên, đổi nội dung, viết lại `.sha256` cho khớp). Lượt kéo sau sẽ thay bản tốt trên Mac bằng rác, và kiểm checksum vẫn qua, vì `.sha256` cũng lấy từ máy chủ.
- Vì sao quan trọng: bản ngoài máy là lưới cuối của TM-52 (ransomware hoặc xóa có chủ đích). Khi bị ghi đè như trên, nó mất tác dụng đúng lúc cần nhất. `age` có xác thực nên rác sẽ bị phát hiện, nhưng chỉ lúc giải mã khi khôi phục, tức là quá muộn.
- Đề xuất sửa: thêm `--ignore-existing`. Tệp sao lưu có tên theo giây UTC và không bao giờ được viết lại; `backup.sh` ghi vào `.tmp-*` rồi mới `mv`. Tùy chọn: so danh sách `.sha256` trên máy chủ với bản cục bộ, khác thì in `WARNING: server copy changed: <tên>` và trả rc ≠ 0. Test: máy chủ giả đổi một tệp cũ → tệp cục bộ giữ nguyên.
- Trạng thái: ~~Open~~ → **Closed – SEC xác nhận ĐẠT 06/11** (commit `bede5332`, mục "Xác nhận OR-01" cuối tệp)

### FB-R4-SEC-OPS-OR-02
- Mức độ: Major
- Vị trí: OR-H1 phương án (1) – launchd trên máy INV + Healthchecks `ottimo-offsite`
- Vấn đề: đề xuất chưa nêu điều kiện an toàn của máy nhận và của lời báo "đã kéo".
- Vì sao quan trọng: máy nhận giữ bản sao DB có dữ liệu khách, dù đã mã hóa. Thông báo xử lý dữ liệu hứa dữ liệu đã xóa hết khỏi bản sao lưu trong ≤ 35 ngày (SR-BAK-03, SR-BAK-07, TM-15). Lời hứa này áp cho **mọi** bản sao.
- Đề xuất sửa:
  1. Ping thành công chỉ khi script trả rc = 0 **và** bản `db-*.dump.age` mới nhất trên máy nhận ≤ 36 giờ tuổi. Trường hợp khác gửi `/fail`. Không dựa vào `.last_pull`: tệp này vẫn được ghi cả khi checksum lệch.
  2. URL ping của Healthchecks chỉ nằm trong cấu hình launchd hoặc Keychain trên máy, không vào repo.
  3. Thư mục nhận (`~/.ottimo/backups/…`) phải **loại khỏi Time Machine** (`tmutil addexclusion`) và không nằm trong thư mục iCloud Drive. Nếu không, Time Machine giữ bản sao quá 35 ngày.
  4. Khóa riêng `age` **không** nằm thành tệp trên cùng máy với bản sao lưu (SR-BAK-02: hai bản ngoại tuyến, INV + trình quản lý mật khẩu).
  5. Máy nhận bật FileVault.
  6. Khóa kéo giữ `restrict` + `rrsync -ro` như hiện có. Khóa không passphrase chấp nhận được vì đã bị giới hạn lệnh và chỉ đọc.
- Trạng thái: Open

### FB-R4-SEC-OPS-OR-03
- Mức độ: Minor
- Vị trí: `authorized_keys` của user `ottimo` trên VPS; `infra/server/bootstrap-vps.sh` `--deploy-key` (dòng 8, 34, 64)
- Vấn đề: khóa người `ottimo-ops` vào thẳng `ottimo` (nhóm `docker`, tương đương root), không có `command=`, không qua `sudo`, nên không để lại dòng nhật ký `sudo`. 14 ngày không dùng. Đường quản trị đúng là `ottimo-admin` + `sudo`.
- Vì sao quan trọng: thêm một đường vào máy với quyền root mà không có dấu vết lệnh. Nếu đây là một khóa khác khóa của `ottimo-admin` thì còn thêm một bí mật phải giữ.
- Đề xuất sửa:
  1. OPS gỡ dòng này ở cửa sổ bảo trì đầu tiên của v1.0.5. Trước khi gỡ, kiểm vẫn vào được `ottimo-admin` và vẫn `sudo -n -u ottimo` được. Biên bản ghi 8 ký tự đầu vân tay khóa, không ghi khóa.
  2. Sau khi gỡ, `authorized_keys` của `ottimo` chỉ còn khóa CI và khóa kéo, cả hai có `command=…,restrict`.
  3. `ops-check` thêm mục `sshkeys`: mọi dòng trong `authorized_keys` của `ottimo` phải có `command=`, nếu không → FAIL (chỉ in số dòng vi phạm).
  4. README bootstrap ghi rõ: khóa `--deploy-key` chỉ là đường vào lúc dựng máy lần đầu (để khỏi bị khóa ngoài), gỡ ngay khi `ottimo-admin` đã chạy.
- Trạng thái: Open

### FB-R4-SEC-OPS-OR-04
- Mức độ: Minor
- Vị trí: `daemon.json` / compose `logging` (driver `local`, 20m × 5); `hosting-plan.md`; SR-LOG-05 (T16)
- Vấn đề: log mất khi container dựng lại (mỗi lần deploy). Còn khi lâu không deploy, log không có trần thời gian, nên có thể sống quá 90 ngày (driver `local` chỉ xoay theo dung lượng).
- Vì sao quan trọng: điều tra sự cố bảo mật (dò form, lạm dụng route giá, truy cập Desk bất thường) cần log trước lượt deploy gần nhất. T16 đặt **trần** 90 ngày cho log kỹ thuật.
- Đề xuất sửa: ARC chọn cách, SEC chỉ đặt yêu cầu:
  - giữ log qua lần dựng lại container;
  - trần cứng 90 ngày;
  - tệp hoặc journal không cho mọi user đọc (0640, nhóm quản trị);
  - không thay đổi cách che hiện có (Caddy bỏ query/header, IP /24; api chỉ ghi route mẫu);
  - không đưa log vào bản sao lưu ngoài máy.

  Gợi ý: driver `journald` + `MaxRetentionSec=90day` + `SystemMaxUse` vừa phải. `ops-check` vẫn đọc được bằng `dc logs`. Nếu giữ driver `local` thì dùng cách lưu log cũ khi deploy mà OPS đề xuất, cộng logrotate `maxage 90`. Khi đó cần thêm một trần cho log của container đang chạy.
- Trạng thái: Open

## B3. Việc SEC muốn đưa vào v1.0.5 (gộp cả `SEC-on-lp-v2-s6d.md`)

| # | Việc | Vai | Mức | Liên quan bảo mật |
|---|---|---|---|---|
| 1 | `pull-backups.sh --ignore-existing` (OR-01) | OPS | **Major** | Có – TM-52 |
| 2 | Tự động kéo bản sao lưu + Healthchecks theo điều kiện OR-02 (cần INV đồng ý cài launchd trên máy INV) | OPS + INV | **Major** | Có – SR-BAK-03/04, TM-15 |
| 3 | `header_up -Authorization` trong `(public_api)`, cả hai môi trường, kèm ca CI (054-01) | OPS | Minor | Có |
| 4 | `ops-check pricegap` thêm kiểm tĩnh READ ONLY, cửa sổ 365 ngày (FB-R4-SEC-OPS-S6D-01) | OPS | Minor | Có, gián tiếp (toàn vẹn giá web) |
| 5 | Gỡ khóa `ottimo-ops` khỏi `ottimo` + `ops-check sshkeys` (OR-03) | OPS | Minor | Có |
| 6 | Giữ log qua deploy, trần 90 ngày (OR-04) | ARC + OPS | Minor | Có – SR-LOG-05 |
| 7 | `ops-check drill` (hạn 35 ngày) | OPS | Minor | Có – SR-BAK-05 |
| 8 | Lượt dump 14:00, vòng xoay theo tuổi; sửa `hosting-plan.md`; SEC sửa SR-BAK-01 | OPS + ARC + SEC | Minor | Có – sẵn sàng/khôi phục |
| 9 | `privacy-notice.log` staging về `ottimo:ottimo 0600` (OR-L3) | OPS | Minor | Có, nhỏ |
| 10 | A+ cho BUG-R4-054 **nếu làm**: 054-02 (Major, điều kiện) … 054-06 | OPS | theo thẻ | Có |
| 11 | Runbook "VPS mới" một trang (OR-M4) | OPS | Minor | Có – TM-14 |
| 12 | `ops-check` báo khóa `.env` trùng; mask `fwupd` | OPS | Suggestion | Không |
| – | BUG-R4-057 (÷12) | ARC + BE + DOM | P3 (QA) | **Không** phải lỗi bảo mật (lý do ở `SEC-on-lp-v2-s6d.md` mục 7.3). SEC chỉ đặt 2 ràng buộc khi gỡ |

**Ngoài v1.0.5, làm trước khi rời Round 4 (không cần bản mới):** diễn tập khôi phục production (OR-M1, cần INV); kéo tay bản sao lưu ≥ 2 ngày/lần tới khi mục 2 xong (ORC/INV); ORC chạy một lần truy vấn tĩnh `pricegap` trên production (`SEC-on-lp-v2-s6d.md` mục 6.4).

**Backlog:** FB-R4-SEC-BE-03 (Desk "từ – đến", kích hoạt trước khi hai căn cùng hạng khác giá); diễn tập dựng lại VPS (ESC chi phí); dọn image (OR-L6); OR-L5 qua 054-06.

## B4. Việc cần INV (ORC gom vào tổng kết; không có ESC mới)

1. **Hẹn 30 phút** mở khóa `age` production cho diễn tập khôi phục (OR-M1). Đây là việc bắt buộc mỗi round (SR-BAK-05).
2. **Xác nhận có/không**, không gửi giá trị:
   - (a) snapshot/backup tự động của nhà cung cấp VPS đang tắt, hoặc giữ ≤ 7 ngày;
   - (b) bản ngoại tuyến `data_kek_current` và khóa `age` production vẫn còn và INV mở được;
   - (c) máy Mac giữ khóa SSH quản trị và bản sao lưu đã bật FileVault.
3. **Đồng ý hay không** cho OPS cài lịch kéo tự động (launchd) trên máy INV (OR-H1/OR-02).
4. **Xác nhận** RPO 12 giờ (sau lượt dump 14:00) thay cho giả định 15 phút (OR-M2). Câu hỏi này không tốn tiền.
5. Tùy chọn: thêm người thứ hai vào phòng "Báo động" (OR-L7).

## B5. Dòng decision-log đề xuất (ORC chép, SEC là người quyết)

`| 2026-11-06 | 4 | SEC – BUG-R4-054 (rounds/round-04/reviews/SEC-on-bug-r4-054.md): DUYỆT CÓ ĐIỀU KIỆN. header_up -Authorization trong (public_api) cả hai môi trường, làm trước và riêng (Minor – mật khẩu xem trước hiện tới api staging khi client gửi kèm; api không ghi header nên không cần đổi mật khẩu). A+ chỉ khi cửa sổ tự đóng ≤ 4 giờ hoặc lời nhắc tới phòng Báo động (staging chỉ có journal), miễn đúng 3 thao tác (method + path), khóa ký token khác nhau giữa hai stack, biên bản đếm yêu cầu lạ + xóa WR8 trong 24 giờ; được dời A+ sang backlog (giữ C) | SEC | Quyền SEC (yêu cầu bảo mật kỹ thuật) |`

`| 2026-11-06 | 4 | SEC – kiểm sẵn sàng vận hành 06/11 của OPS: đồng ý OR-H1 (hạ Major sau lần kéo 06/11; tự động hóa cần pull-backups --ignore-existing, ping theo rc + tuổi bản ≤ 36 giờ, loại thư mục nhận khỏi Time Machine/iCloud, khóa age không nằm cùng máy, FileVault), OR-M1 (diễn tập trước khi rời R4, cách ly, giải mã 1 mẫu, áp purge_journal + J16), OR-M2 (a), OR-M3 (giữ log qua deploy, trần cứng 90 ngày), OR-M4 (runbook; diễn tập bằng dữ liệu staging, ESC chi phí), OR-L1/L2/L6/L7; OR-L3 cho phép chown ottimo 0600; OR-L4 gỡ khóa ottimo-ops + ops-check sshkeys; OR-L5 không cấp 0440 mật khẩu xem trước | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |`

## B6. Điểm làm tốt

- OPS tự phát hiện việc mật khẩu xem trước đi tới api, và đã thử bản sửa ở cả hai môi trường trước khi hỏi.
- Kiểm sẵn sàng làm hoàn toàn chỉ đọc: `.env` chỉ đọc tên khóa và độ dài, không chạy `ops-check` bằng tay để khỏi gửi webhook. Tệp báo cáo không có IP hay bí mật.
- `pull-backups.sh` đã đúng hướng ở những chỗ quan trọng: kéo chỉ đọc, không `--delete`, tự cắt 35 ngày, kiểm checksum. Thẻ OR-01 chỉ còn đóng chỗ ghi đè.

---

# Xác nhận OR-01

Round 4 · bước **Phản hồi & sửa → xác nhận của người review** · SEC · 06/11/2026 (tối)
Đối tượng: commit `bede5332` – `product/infra/server/bin/pull-backups.sh`, `product/infra/server/test/pull-backups.test.sh` (mới), `.github/workflows/ci.yml` job `infra-scripts`, README `infra/server` dòng "Bản sao lưu ngoài máy", `rounds/round-04/responses/OPS-LP-v2.md` (OR-01, OR-L3).
SEC không SSH, không chạy kéo thật.

## X1. Kết luận: **ĐẠT** – thẻ FB-R4-SEC-OPS-OR-01 **Closed**

Bản sửa đóng đúng lỗ đã nêu: một máy chủ bị chiếm không còn xóa **và** không còn ghi đè được bản sao trên máy nhận, kể cả `.sha256`. Việc máy chủ đổi tệp cũ được báo ra rõ ràng (`WARNING …`, thoát 3, không ghi `.last_pull`). Không có điều kiện chặn. Các gợi ý ở X4 không bắt buộc.

## X2. SEC đã kiểm

| Điểm | Kết quả |
|---|---|
| Không bao giờ thay tệp đã có | Lượt kéo thật là `rsync -rt --ignore-existing`, không `--delete` (dòng 63). Bảo vệ không phụ thuộc lượt so trước, nên tệp bị đổi **giữa** lượt so và lượt kéo cũng không thay được bản cục bộ |
| Phát hiện máy chủ đổi tệp | Lượt chạy thử `-rtn --checksum --itemize-changes` (chỉ đọc hai phía). Bộ lọc `awk` (dòng 60) lấy dòng `>f…` trừ tệp mới `>f+++`. Chỉ đổi giờ (`.f..t`) không bị coi là đổi nội dung. Cùng cỡ, cùng giờ sửa mà khác byte vẫn bị bắt nhờ `--checksum` |
| Mã thoát và `.last_pull` | 0/1/2/3 ghi ở đầu script và README. `.last_pull` chỉ ghi khi thoát 0 (dòng 95), cũng là điểm 1 của OR-02. Không liệt kê được máy chủ → thoát 2, không kéo gì |
| Phạm vi tệp | Chỉ `*.age` + `*.age.sha256` ở thư mục gốc. `--exclude '*'` chặn thư mục `.tmp-*` của `backup.sh`. Không có `-l`, nên symlink trên máy chủ không bị kéo (SEC thử thêm, ca B ở X3) |
| Test | 11 ca, đi qua **rrsync thật `-ro`** sau ssh giả, đúng đường khóa kéo trên VPS. Ca 3/3b/4 là đúng kịch bản TM-52 của thẻ. Theo OPS, script cũ trượt 4 ca |
| CI | Thêm vào shellcheck và một bước riêng trong `infra-scripts`. Bước này cài `rsync` nếu thiếu và bắt buộc có dòng `== N passed, 0 failed`. Test tự bỏ qua (thiếu rsync 3/rrsync) thì không có dòng đó, nên bước **đỏ**. Shell mặc định của Actions là `bash -eo pipefail`, nên mã thoát của test đi qua `tee` |
| README | Có mã thoát, câu WARNING, cách xử lý khi cùng tệp vừa `checksum mismatch` vừa WARNING (có thể bản trên Mac mới là bản hỏng: so tay với `.sha256` trên máy chủ), và đánh đổi về tốc độ |

## X3. SEC chạy lại độc lập (06/11, máy SEC, container có sẵn `ottimo-rsync-test:local`, `--pull=never --network none`, rsync 3.2.7 + `/usr/bin/rrsync`, cùng bản với VPS Ubuntu 24.04)

- `pull-backups.test.sh`: **11 passed, 0 failed**, trùng với OPS.
- Ba ca SEC thêm, script thử để ở scratchpad của SEC, không vào repo:

| Ca | Kết quả | Đánh giá |
|---|---|---|
| A – tệp trên Mac hỏng (cùng cỡ), máy chủ vẫn đúng | thoát 3; `checksum mismatch: <tên>.sha256` + `WARNING: server copy changed: <tên>`; bản trên Mac giữ nguyên | Đúng đánh đổi OPS đã nêu; README có cách xử lý |
| B – máy chủ đặt symlink `db-….dump.age` trỏ ra ngoài thư mục | thoát 0; **không** kéo | Đạt |
| C – máy chủ đặt tệp mang ngày tương lai `db-2999…` | thoát 0; được kéo và **không bao giờ bị cắt** (tuổi theo tên âm) | Gợi ý X4.1, không chặn |

## X4. Đánh đổi và gợi ý (không bắt buộc)

**Hai đánh đổi OPS nêu – SEC chấp nhận cả hai:**
- **Không tự sửa bản hỏng trên Mac.** Đây là lựa chọn đúng cho TM-52: máy nhận không được tin máy chủ hơn bản của chính nó. Ổ của Mac có mã hóa và kiểm toàn vẹn, nên hỏng bit là hiếm. Khi xảy ra thì có thoát ≠ 0, không có `.last_pull`, và có ping `/fail` theo OR-02, tức là có người được báo.
- **`--checksum` đọc hết tệp ở hai phía.** Production hiện khoảng 7,4 MB (OPS `ops-readiness-06-11.md` mục 3), nên không đáng kể. Phía máy chủ chỉ đọc qua `rrsync -ro`. Lần kéo tay tới ghi thời gian chạy như OPS đã hẹn.

**Gợi ý (Suggestion, backlog hoặc cùng đợt OR-02):**
1. Tên mang ngày lớn hơn hôm nay + 1 ngày (ca C) là bất thường, vì `backup.sh` đặt tên theo giờ UTC lúc chạy. Không kéo tệp đó, in `WARNING: future-dated name`, thoát 3.
2. Trần cho một lượt kéo, ví dụ quá 50 tệp mới hoặc quá 2 GB theo lượt chạy thử thì dừng, thoát 3. Mục đích: máy chủ bị chiếm không làm đầy ổ máy nhận.
3. Thêm ca A vào `pull-backups.test.sh`, để ghi lại hành vi "bản trên Mac hỏng".
4. **Rủi ro còn lại, Thấp, ghi nhận:** máy chủ bị chiếm vẫn có thể đẩy tệp **mới** là rác mã hóa đúng khóa công khai. Không có khóa riêng thì không phát hiện được lúc kéo. Máy nhận cắt bản theo 35 ngày, nên nếu bị chiếm lâu hơn 35 ngày mà không ai thấy, mọi bản tốt sẽ lần lượt bị cắt. Lưới chặn là diễn tập khôi phục ≤ 35 ngày (SR-BAK-05, `ops-check drill` ở v1.0.5 mục 7). SEC đề nghị diễn tập OR-M1 khôi phục từ **bản trên máy nhận** chứ không từ bản trên VPS, để kiểm trọn chuỗi ngoài máy.

## X5. OR-L3 (cùng commit)

**Đạt** theo bằng chứng OPS (`responses/OPS-LP-v2.md`): `ls -l` trước `root root 0644`, sau `ottimo ottimo 0600`; cỡ và giờ sửa không đổi; không xóa, không cắt nội dung. Đúng phạm vi SEC cho phép (B1). Sửa gốc vẫn là README 12.3 (e) ở v1.0.5.

## X6. Còn mở

- **FB-R4-SEC-OPS-OR-02** (Major) vẫn Open: chờ INV đồng ý cài launchd. Khi làm, ping thành công chỉ khi thoát 0 **và** bản `db-*` mới nhất ≤ 36 giờ. Thoát 1/2/3 → `/fail`.
- Tới khi OR-02 xong: kéo tay ít nhất 2 ngày một lần (B3), ghi thời gian chạy.

## X7. Dòng decision-log đề xuất (ORC chép, SEC là người quyết)

`| 2026-11-06 | 4 | SEC – xác nhận FB-R4-SEC-OPS-OR-01 ĐẠT, thẻ Closed (commit bede5332; rounds/round-04/reviews/SEC-on-bug-r4-054.md mục "Xác nhận OR-01"): pull-backups.sh kéo --ignore-existing, không --delete, so nội dung bằng --checksum --dry-run qua rrsync -ro → WARNING + thoát 3, .last_pull chỉ khi thoát 0; test 11/11 SEC chạy lại độc lập (rrsync 3.2.7, không mạng) + 3 ca thêm (bản Mac hỏng → thoát 3, symlink không kéo, tên ngày tương lai không bị cắt → gợi ý); chấp nhận hai đánh đổi (không tự sửa bản Mac, --checksum đọc hết tệp); rủi ro còn lại Thấp: tệp mới là rác chỉ lộ khi diễn tập – diễn tập OR-M1 khôi phục từ bản trên máy nhận. OR-L3 Đạt. OR-02 vẫn chờ INV | SEC | Quyền SEC (xác nhận bản sửa thẻ bảo mật) |`
