# SEC – BUG-R4-053: trang RU ghi `notice_locale = en` (diễn tập 5.0, ô S16)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Kiểm thử** | 05/11/2026
- Đối tượng: ô S16 của `rounds/round-04/outputs/OPS/v1.0.4-staging-drill.md` và BUG-R4-053 (`rounds/round-04/qa/bug-list-v1.0.4.md`).
- Đã đọc:
  - `product/services/api/src/modules/guest-portal/internal/guest-portal.service.ts` dòng 47 và 486–492 (bản cắt `0d11db20` giống hệt), `guest-locale.ts`;
  - `product/services/api/test/integration/guest-portal.test.ts:563` (test còn khóa kết quả `en`);
  - runbook `v1.0.4-release-runbook.md` mục K11 (d) và N1–N6;
  - `SEC-on-privacy-v2-ru.md` mục 4, `outputs/MOB/v1.0.4-P4-42.md`;
  - decision-log dòng 507, 528, 536 (17/10), 1149 và 1161 (04/11).
- SEC không chạy gì trên staging hay production. Tệp này không có dữ liệu khách và không có giá trị link hay token.

---

## 0. Kết luận

- **Mức lỗi: P1.** Rủi ro bảo mật mức Medium. Nếu giữ điều kiện T1–T4 thì rủi ro còn lại là Low.
- **CHẤP NHẬN** phát hành v1.0.4 **đã cắt** (`0d11db20`, không sửa), với một điều kiện chính: **check-in online chưa mở lại (N5) tới khi bản có sửa** (hotfix v1.0.4.1 hoặc bản cắt lại) lên production và ô S16 chạy lại trên staging đạt `ru → ru`.
- **Không chấp nhận** hai cách tạm ORC nêu: lễ tân lọc khách RU, và coi `consent_record.locale` đúng là đủ (lý do ở mục 2.2).
- ESC mới: **không**. Mức lỗi và điều kiện thuộc quyền SEC. Check-in online đã đóng từ 30/10 (D-T4), nên đây không phải thay đổi mới với khách. ORC chỉ cần báo INV ở N5 rằng check-in online mở sau v1.0.4.1, không mở ngay ngày Release.

---

## 1. Mức lỗi: P1

**Vì sao không phải P0**
- Không lộ dữ liệu, không sai tiền, không mất dữ liệu đã có.
- Khách đọc đúng bản RU đã ký, cùng nghĩa với EN/VI. `notice_version` và `notice_accepted_at` đều đúng.
- Chỉ sai một cột metadata, và chỉ ở dòng mới ghi.
- Lỗi theo hướng "ghi thiếu": ghi EN, tức bản dẫn mà luật sư đã đọc. Hướng ngược lại, "ghi khống" (ghi `ru` khi trang hiện EN), mới là bằng chứng giả có lợi cho OTTIMO. Quyết định (a) ngày 17/10 cấm đúng hướng đó.

**Vì sao không phải P2**
- R-CON-02 đòi bằng chứng ghi **phiên bản và ngôn ngữ của văn bản đã hiển thị**. Ở đây bằng chứng nói khác với điều khách thật sự thấy.
- Theo ND 13/2023:
  - Đ.11: đồng ý phải ở dạng kiểm chứng được, và khi có tranh chấp thì Bên Kiểm soát (OTTIMO) phải chứng minh;
  - Đ.13: thông báo xử lý phải đưa ra trước khi xử lý, ở dạng kiểm chứng được.
  - Một khách Nga khiếu nại "không hiểu thông báo" thì chính hồ sơ của OTTIMO lại ghi là khách đọc bản EN.
  - (Đây là hiểu biết của đội. Luật sư ánh xạ sang Luật 91/2025, xem ESC-001.)
- Check-in online (US-107) là luồng chính. RU là thị trường mục tiêu. Khi mở lại, **mọi** khách RU đều dính lỗi.
- Không dựng lại được giá trị đúng sau này. `notice_locale` lấy từ ngôn ngữ của phiên lúc bấm "đã đọc". Ngôn ngữ đó không được lưu riêng, và khách có thể đổi ngôn ngữ sau khi đọc.
- Runbook N6 coi lệch ở K11 (d) là điều kiện dừng check-in online.

---

## 2. Phát hành `0d11db20` kèm hotfix: CHẤP NHẬN có điều kiện

### 2.1 Điều kiện tạm thời (từ Release tới khi hotfix lên production)

| # | Điều kiện | Ai | Kiểm bằng |
|---|---|---|---|
| T1 | **Không làm N5.** Lễ tân không tạo và không gửi link check-in online, như D-T4 đang áp dụng. N1–N4 làm bình thường: tờ v2 ở quầy, OWN đặt H05 = v2, SEC kiểm 6.5 | ORC, lễ tân | K11 (e), (d) pha A (mục 3) |
| T2 | **Trước N3**, đếm link còn sống trên production, chỉ đếm (K11 (e)). Phải là `0`. Nếu khác `0`: lễ tân thu hồi link của đơn đó trên Desk (`revokeGuestLink`), không dùng SQL, rồi đếm lại | SEC (ORC chạy) | K11 (e) |
| T3 | Hotfix BE theo đúng quy tắc ở mục 4. Đường phát hành do ARC chọn (v1.0.4.1, hoặc cắt lại nếu ARC thấy rẻ hơn). Cần ARC + SEC review PR, QA + QC rút gọn | BE, ARC, QA, QC | PR `v104/fix-ru-notice-locale` |
| T4 | Chạy lại S16 trên staging với bản có sửa. Ở `ru`: `online_checkin` ra `privacy-2026-10-v2\|ru\|1` và `consent_record` ra `…\|ru\|guest_app\|1`. Ở `vi` và `en`: test tích hợp là đủ. Xong T4 thì mới tới N5 | ORC/QA | K11 (d) tính từ `up_at` của bản sửa |

- SEC không đặt hạn chót cho hotfix. Mỗi ngày trễ là thêm một ngày check-in online đóng, giống như hiện nay.
- Nếu ARC chọn cắt lại thay vì hotfix thì T1–T4 vẫn áp dụng, chỉ thay tên bản.

### 2.2 Vì sao không nhận hai cách tạm kia
- **Lễ tân không gửi link cho khách chọn RU.** Lễ tân không biết trước ai sẽ thấy trang RU:
  - trang chọn ngôn ngữ theo thứ tự: khách tự chọn, rồi ngôn ngữ hồ sơ người đặt, rồi `Accept-Language` (`guest-locale.ts`);
  - đơn OTA không có ngôn ngữ hồ sơ mà khách dùng trình duyệt tiếng Nga thì tự vào RU;
  - khách nào cũng đổi sang RU được.
  - Biện pháp này dựa vào người làm, và K11 không kiểm được.
- **Coi `consent_record.locale` đúng là đủ.** Không đủ, vì ba lẽ:
  - `consent_record` chỉ là đồng ý **P02B** (giữ ảnh). Thông báo còn phủ việc xử lý **bắt buộc** P01/P02 (khai báo lưu trú), là việc không cần đồng ý. Ở đó `online_checkin.notice_*` là bằng chứng duy nhất của kênh online;
  - khách đọc thông báo rồi dừng trước bước đồng ý thì không có `consent_record`;
  - hai bảng nói hai ngôn ngữ khác nhau cho cùng một lượt thì làm yếu cả hai bằng chứng.

---

## 3. Quy tắc K11 (d), (e) / N3 / N5 / N6 sau phát hành

Mọi câu dưới đây chỉ đọc và chỉ đếm, chạy qua `SQLRO` như K11 (d) hiện có. OPS chạy thử trên schema `SHA_V104` trước, để chắc vai `ottimo_readonly` đọc được hai bảng `guest_*` (không có BYPASSRLS thì kết quả là 0 câm, không phải "ok 0").

**K11 (e) – mới, chạy trước N3:**
```sql
SHOW default_transaction_read_only;
SELECT current_user;
SELECT count(*) FROM guest_access_token WHERE revoked_at IS NULL AND expires_at > now();
SELECT count(*) FROM guest_session      WHERE revoked_at IS NULL AND expires_at > now();
```
**Đúng là:** `on`, `ottimo_readonly`, `0`, `0`.

**Pha A – sau Release `0d11db20`, trước hotfix**
- N3 không đổi. Thêm một điều kiện vào trước N3: K11 (e) đúng.
- N5: **không làm** (T1).
- N6 → đổi thành **N6a**: chạy sau lượt đồng ý thật đầu tiên **tại quầy**, dùng K11 (d) với `⟨RELEASE_AT⟩`. **Đúng là:**
  - `consent_record` sau N3 chỉ có `privacy-2026-10-v2`, kênh `desk` hoặc `paper`, `locale` là `vi` hoặc `en`;
  - kênh `guest_app`: 0 dòng;
  - `online_checkin`: **0 dòng**.
- Ghi chú cho N6a: kênh quầy không có `ru` là **đúng**, không phải lệch.
  - Desk v1.0.4 chỉ nhận `vi`/`en` (`registration.controller.ts:394`).
  - Tờ EN/RU có chữ EN, nên ghi `en` vẫn đúng với tờ đã đưa khách. Xem thẻ SEC-BE-02.
- Có dòng `online_checkin` hoặc dòng `guest_app` nào: báo SEC ngay, không sửa dữ liệu, làm theo mục 5.

**Pha B – sau khi hotfix lên production**
- **N5:** chỉ làm khi T3 + T4 xong. ORC báo INV mở lại check-in online.
- **N6b – mới:** chạy sau lượt **đọc thông báo online** thật đầu tiên sau N5, dùng K11 (d) với `⟨HOTFIX_AT⟩` (giờ hotfix lên) thay cho `⟨RELEASE_AT⟩`.
  - **Đúng là:** `notice_locale` và `locale` thuộc `vi`, `en`, `ru`; trang ru ghi `ru` (runbook dòng 588 giữ nguyên, chỉ tính từ `⟨HOTFIX_AT⟩`).
  - Thêm câu đối chiếu (chỉ đếm):
```sql
SELECT count(*) AS locale_mismatch
  FROM online_checkin o
  JOIN registration r   ON r.reservation_id = o.reservation_id
  JOIN consent_record c ON c.registration_id = r.id
 WHERE o.notice_accepted_at >= '⟨HOTFIX_AT⟩'
   AND c.channel = 'guest_app'
   AND c.notice_version = o.notice_version
   AND c.recorded_at >= o.notice_accepted_at
   AND c.locale <> o.notice_locale;
```
  - **Đúng là:** `0`.
  - Khác `0`: lễ tân tạm ngừng gửi link, SEC kiểm trong ngày. Khách đổi ngôn ngữ giữa bước đọc và bước đồng ý là hợp lệ, hiếm gặp. Không sửa dữ liệu.
- Runbook N6 "lệch thì check-in online dừng" giữ nguyên, áp cho N6b. Người cùng sửa là **SEC + BE**, không phải SEC + MOB.

---

## 4. Quy tắc ghi `notice_locale` (cho BE)

1. **`notice_locale` = ngôn ngữ của văn bản thông báo thật sự hiện cho khách.** Công thức: lấy `g.locale` nếu nó nằm trong danh sách ngôn ngữ đã duyệt của **phiên bản thông báo hiện hành**; nếu không, lấy `en`.
2. **Danh sách đã duyệt đi theo từng phiên bản**, thay cho hằng `APPROVED_NOTICE_LOCALES` chung:
   - `privacy-2026-10-v1` → `vi`, `en`;
   - `privacy-2026-10-v2` → `vi`, `en`, `ru`;
   - phiên bản chưa có trong bảng → `vi`, `en`. EN là bản dẫn, mọi phiên bản phải có EN + VI luật sư đã đọc. Trang khách cũng đóng an toàn với phiên bản lạ (`NOTICE_TEXT_VERSIONS`).
3. **Muốn thêm một ngôn ngữ vào một phiên bản** thì cần ba thứ:
   - SEC ký nghĩa và UXD ký giọng **cho đúng phiên bản đó**;
   - phía client bỏ khóa khỏi `RU_UNREVIEWED_LEGAL` (hoặc danh sách tương ứng) **trong cùng bản phát hành**;
   - có test ở cả client và server.
   - Đây là cách đọc đúng quyết định (a) ngày 17/10: bản RU được ký, và phiên bản đã tăng từ v1 lên v2.
4. Hotfix **không** đổi hợp đồng API. Server vẫn suy ra ngôn ngữ từ phiên, không nhận ngôn ngữ do client gửi lên cho bước thông báo.
5. Test bắt buộc trong PR (thay test ở `guest-portal.test.ts:563`):
   - (a) `ru` + v2 → `ru`;
   - (b) `vi` → `vi`, `en` → `en`;
   - (c) `ru` + v1 → `en` (giữ quyết định (a) cho v1);
   - (d) `ru` + phiên bản không có trong bảng → `en`.
6. **v1.0.5, không thuộc hotfix:**
   - `recordGuestConsent` kiểm `body.locale` theo cùng danh sách của phiên bản hiện hành, không thuộc danh sách thì trả 422 `NOT_IN_LIST`;
   - ARC cân nhắc sinh danh sách ngôn ngữ theo phiên bản từ `gen_strings.py`, dùng chung cho guest-web và API, để hai bên không lệch nhau lần nữa.

---

## 5. Dòng đã ghi sai: cách xử lý

- **Staging:** giữ nguyên dòng 15:01 (đơn thử, là bằng chứng của BUG-R4-053). Không sửa. S16 chạy lại tính từ `up_at` của bản sửa, nên không lẫn với dòng này.
- **Production:** nếu giữ T1–T2 thì dự kiến **không có dòng sai nào**. Pha A đã có câu kiểm việc này.
- Nếu pha A vẫn thấy dòng `online_checkin` v2 ghi `en` trong khung `[RELEASE_AT, HOTFIX_AT)`:
  - **Không SQL tay.** SEC ghi số đếm vào decision-log.
  - BE viết một migration riêng, ARC + SEC review. Migration chỉ sửa `en` → `ru` khi **chứng minh được** trang hiện RU: cùng đơn có `consent_record` kênh `guest_app`, cùng phiên bản, `locale = ru`, ghi sau `notice_accepted_at`.
  - Mỗi dòng sửa ghi một audit `online_checkin.notice_locale_corrected`, có giá trị trước/sau và mã BUG-R4-053.
  - Dòng không chứng minh được thì để nguyên, ghi là sai sót bằng chứng đã biết. Khách đó vẫn có bằng chứng ở quầy khi làm khai báo (tờ v2 + đồng ý tại quầy).

---

## 6. Thẻ feedback

### FB-R4-SEC-BE-RU-NL-01
- Mức độ: Blocker (chỉ chặn N5, không chặn Release `0d11db20`)
- Vị trí: `guest-portal.service.ts:47` và `:491`; test `guest-portal.test.ts:563`.
- Vấn đề: server vẫn đổi `ru` → `en` theo quyết định (a) ngày 17/10, trong khi v1.0.4 đã hiện bản RU đã ký của v2 (P4-42).
- Vì sao quan trọng: bằng chứng thông báo (R-CON-02) sai với mọi khách RU dùng check-in online.
- Đề xuất sửa: làm theo mục 4, ý 1–5. Cập nhật mô tả `notice_locale` trong `erd.md` (ARC) và dòng decision-log 536.
- Trạng thái: Open

### FB-R4-SEC-BE-RU-NL-02
- Mức độ: Suggestion (v1.0.5)
- Vị trí: `registration.controller.ts:394`, đồng ý tại quầy chỉ nhận `vi`/`en`.
- Vấn đề: khách đọc tờ EN/RU thì ghi `en`. Như vậy vẫn đúng với phần EN của tờ, nhưng không cho thấy khách đọc phần RU.
- Đề xuất sửa: ARC + SEC xem có cho Desk ghi `ru` khi đưa tờ EN/RU không (R-CON-06). Không chặn v1.0.4.
- Trạng thái: Open

### FB-R4-SEC-OPS-RU-NL-03
- Mức độ: Major
- Vị trí: runbook v1.0.4, các mục K11 (d), N3, N5, N6.
- Vấn đề: runbook mở N5 ngay ngày Release, và chỉ có một mốc N6 tính từ `⟨RELEASE_AT⟩`.
- Đề xuất sửa: thêm K11 (e); thêm điều kiện T1–T4; tách N6a/N6b theo mục 3; ghi `⟨HOTFIX_AT⟩` vào bảng 0.1 và dòng decision-log ở mục 7 của runbook. PO thêm một câu vào release notes: check-in online mở lại sau v1.0.4.1.
- Trạng thái: Open

### FB-R4-SEC-MOB-RU-NL-04
- Mức độ: Minor
- Vị trí: `outputs/MOB/v1.0.4-P4-42.md:17`.
- Vấn đề: câu "server ghi trường này vào `notice_locale`" sai. Server lấy `notice_locale` từ ngôn ngữ phiên, không lấy từ `locale` của bản đồng ý.
- Đề xuất sửa: sửa câu, trỏ sang BUG-R4-053.
- Trạng thái: Open

**SEC tự ghi:** điều kiện 3–4 ở `SEC-on-privacy-v2-ru.md` mục 4 chỉ giao cho MOB, và bỏ sót quy tắc phía server (decision-log dòng 536). Từ nay, khi SEC gỡ một giới hạn ngôn ngữ, điều kiện phải nêu cả chỗ ở client lẫn chỗ ở server.

---

## 7. Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-05 | 4 | **SEC – BUG-R4-053 (S16 diễn tập 5.0): P1; CHẤP NHẬN phát hành v1.0.4 0d11db20 không sửa, kèm hotfix** (rounds/round-04/reviews/SEC-on-ru-notice-locale-drill.md). Điều kiện: không làm N5 (không link check-in online) tới khi bản có sửa lên production và S16 staging ru → ru; trước N3 đếm link sống = 0 (K11 e); N6 tách N6a (quầy, online_checkin = 0 dòng) / N6b (online đầu tiên, từ HOTFIX_AT, đối chiếu locale = 0). Quy tắc mới: notice_locale = g.locale nếu thuộc danh sách đã duyệt của phiên bản hiện hành (v1: vi,en; v2: vi,en,ru; lạ: vi,en), không thì en; thay dòng 17/10 "notice_locale chỉ vi/en". Không nhận: lọc khách RU ở quầy, hoặc dựa vào consent_record.locale. Dòng sai: không SQL tay; nếu có thì migration có audit, chỉ sửa dòng chứng minh được | SEC | R-CON-02; ND 13 Đ.11, Đ.13 (luật sư ánh xạ Luật 91/2025); quyền SEC |`

---

## 8. Giả định

1. Từ D-T4 (30/10) tới nay, production chưa tạo link khách nào. Việc tạo link chỉ đi qua `issueLink` (nhân viên bấm). K11 (e) sẽ xác nhận điều này.
2. Ở v1.0.4, trang `ru` hiện đủ 11 khóa pháp lý bằng RU. SEC dựa vào test MOB và kiểm chuỗi bundle K11 (c). Diễn tập gọi API thay cho trình duyệt nên không chụp trang.
3. Câu K11 (e) dùng `now()` của DB. Đây là câu chỉ đọc trên production, không dính quy ước Clock của mã (ADR-008).
4. Trích ND 13/2023 là hiểu biết của đội, chưa được luật sư xác nhận (ESC-001).
