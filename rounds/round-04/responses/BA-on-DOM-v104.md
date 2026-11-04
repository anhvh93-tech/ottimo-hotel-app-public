# BA trả lời DOM – Tài liệu BA v1.0.4 (sổ tay 1.11, bộ hướng dẫn 1.9)

- Người trả lời: BA | Round 4 – v1.0.4 – Bước: **Phản hồi & sửa** | 04/11/2026
- Review: `rounds/round-04/reviews/DOM-on-v104-ba-docs.md` (DOM, `v104/ba-docs` @ `488d9392`, ĐẠT CÓ ĐIỀU KIỆN).
- Sửa trên nhánh `v104/ba-docs`, cùng commit với tệp này. Số bản giữ nguyên (sổ tay 1.11, bộ hướng dẫn 1.9) vì hai bản này chưa gộp; dòng lịch sử ghi "sửa cùng ngày theo review DOM".
- Thứ tự gộp không đổi: `v104/uxd-id-sheet-v2` trước `v104/ba-docs`. Không đụng tệp của UXD (`product/docs/print/*`, `staff-one-pager.md`).

## 1. Trả lời từng thẻ

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-DOM-BA-104-01 (Major) | Done | `00-index` mục 4 viết lại thành 9 bước cho chủ đầu tư; `02` 7.2 thêm khối **Ngày thay tờ** 9 bước cho người trực. Đủ 7 ý DOM: chuẩn bị (EN/RU chỉ in khi bản RU đã duyệt, chưa có thì đọc to câu hạn lưu); khung **09:00–11:00**, không sau 12:00; thay rồi đặt **≤ 15 phút**, nhắn "Đã thay tờ v2 – hh:mm" / "Đã đặt v2 – hh:mm"; **không nhận giấy tờ khách mới** lúc chờ; sổ giao ca; khách làm trước giờ thay không xem lại; tờ v1 cất khỏi quầy rồi hủy. Dòng **Mở quầy** (`02` mục 2 và mục 18) kiểm **chân tờ có chữ v2**, cả tờ trong ngăn quầy. Cách chủ đầu tư đặt tham số ghi đúng Desk, **không có SQL**: **Quản trị → Tham số quy tắc** → nhóm **Khác** → `privacy_notice_version` → **Sửa** → sửa `"privacy-2026-10-v1"` thành `"privacy-2026-10-v2"` (giữ ngoặc kép) → **Hiệu lực từ** hôm nay → **Lý do** → **Lưu thay đổi**. Thêm: `01` 9.2 một dòng "chỉ đổi đúng ngày thay tờ"; câu "không nhờ đội đặt hộ hay sửa thẳng dữ liệu" (decision-log 04/11, MOB P4-42). Thêm một nhánh dự phòng, xem G-BA-104-4 |
| FB-R4-DOM-BA-104-02 (Major) | Done | Sổ tay 1.5 và `01` 1.9: dòng "Người nghỉ hẳn" trỏ tới khối mới **Ngày cuối của người nghỉ** (áp dụng ngay), 8 bước theo đúng thứ tự DOM: (1) tiền mặt + sổ giao ca, chủ đầu tư ký nhận, làm trước khi khóa; (2) việc dở: yêu cầu website đã **Nhận xử lý**, phiếu sửa đã **Nhận việc**, việc dọn dở, yêu cầu hoàn còn mở do người đó tạo (người khác nhập nơi nhận; chỉ còn chủ đầu tư thì nhập chuyển khoản); (3) **Khóa tài khoản**, bị cho thôi việc thì khóa ngay lúc báo, trước bước 1; (4) **Xóa email**, câu báo trước thư chỉ áp khi nghỉ êm; (5) gỡ khỏi phòng Google Chat; (6) chìa cơ, tài khoản ủy quyền app khóa, mã két, Wi-Fi quản trị; bị cho thôi việc thì đổi mã cửa các căn đang có khách; (7) **Thu hồi** máy đã cấp quyền; (8) rà **Cần chú ý** các giữ chỗ người đó tạo hoặc chốt. Khối CTV có câu hoa hồng còn nợ (không ghi số; theo bảng nội bộ). `01` 12.1 và `00-index` mục 5 trỏ về khối này. Lệch nhỏ so với đề xuất DOM: xem mục 2 ý 2 |
| FB-R4-DOM-BA-104-03 (Minor) | Done | Sổ tay 1.8 bước 4 và `01` mục 4: "… vẫn **không** duyệt được yêu cầu mới, **trừ chủ đầu tư với khoản chuyển khoản** (như cũ …)". Thêm câu cùng ý ở gạch đổi nơi nhận. `02` 11.5.2 không có câu tuyệt đối nên không sửa |
| FB-R4-DOM-BA-104-04 (Minor) | Done | Sổ tay 1.8 bước 4, `01` mục 4, `02` 11.5.2 thêm đủ 4 ý: yêu cầu cũ không có nơi nhận thì không tính (BE-D ca (c)); **duyệt không mang sang** (yêu cầu thay thế ở **Chờ duyệt**); yêu cầu thay thế tạo **trước** ngày v1.0.4 lên vẫn trống; dòng nhật ký **Chép nơi nhận hoàn sang yêu cầu thay thế** là việc Desk tự làm. Chữ dòng nhật ký lấy từ `strings-vi.json` trên `v104/uxd-strings` (`mlog.a_refund_destination_carried`), Desk map ở `v104/fe-money-labels` @ `852bbfa3` |
| FB-R4-DOM-BA-104-05 (Minor) | Done | Đã kiểm mã Desk: `MoneyPage.tsx` hiện nút **Nhập nơi nhận hoàn** (`refund.set_destination`) ở mọi dòng còn tiền chưa chi khi có mạng, **kể cả dòng đã có nơi nhận** (cả trên `v104/fe-money-labels`). Máy chủ (`refunds.service.ts` `setDestination`, `v104/be-refund-dest`) ghi đè nơi nhận, đổi người nhập thành người vừa lưu, và đưa yêu cầu đã duyệt về **Chờ duyệt** (SEC F8). Vậy đổi nơi nhận làm được trên Desk, **không** cần cách đi vòng và không có việc mới cho PO. Đã ghi: sổ tay 1.8 bước 4 và `01` mục 4 gạch "Cách hoàn mang sang không còn hợp" (tiền mặt mà khách đã về, khách đổi tài khoản → không duyệt, liên hệ khách 1–1, bấm lại **Nhập nơi nhận hoàn**, chọn lại **Cách hoàn**, **Lưu**; người vừa lưu không duyệt được, trừ chủ đầu tư với chuyển khoản); `02` 12.2 thêm gạch **Đổi nơi nhận**; `02` 11.5.2 trỏ về 12.2 |
| FB-R4-DOM-BA-104-06 (Suggestion) | Done | Thay hai câu "theo chủ đầu tư / chủ đầu tư quyết" bằng mặc định đội chọn (DOM B.1, B.2; decision-log 04/11), luôn kèm "chủ đầu tư đổi được". Chi tiết mục 3 |

## 2. Chỗ BA làm khác hoặc thêm so với đề xuất DOM (xin DOM xác nhận ở lượt 2)

1. **Thẻ 01, nhánh quá 15 phút (G-BA-104-4).** DOM chưa nói khi chủ đầu tư không trả lời được. BA thêm: quá 15 phút chưa có tin "Đã đặt v2" và không gọi được chủ đầu tư thì người trực **đặt lại tờ v1**, nhận khách như cũ, ghi sổ giao ca; chủ đầu tư thấy tin muộn thì **không** đặt tham số nữa, hẹn ngày khác. Lý do: giữ đúng luật SEC 6.4 ý 5 (Desk ghi bản nào thì khách đọc bản đó) mà không chặn khách nhận phòng nhiều giờ. Vì vậy tờ v1 chỉ **cất** khỏi quầy, chỉ hủy sau tin "Đã đặt v2".
2. **Thẻ 02:**
   - **CTV:** DOM đề xuất "chỉ bước 3, 4, 5". BA ghi "bước 3, 4 và 8; lỡ có trong phòng Chat thì bước 5": theo `01` 12.1, CTV không bao giờ ở phòng Chat; còn CTV tạo giữ chỗ (BR-302, tối đa 3), nên rà giữ chỗ (bước 8) vẫn cần.
   - Bước 5 thêm một câu: người nghỉ có tài khoản `@ottimo.vn` riêng thì tạm ngưng trong Admin console (phòng Chat chỉ cho tài khoản `@ottimo.vn`, `01` 12.1).
   - Bước 2: Desk v1.0.4 không có nút đổi người nhận phiếu sửa hay yêu cầu website trên giao diện (máy chủ có trường `assigneeUserId` nhưng Desk chưa dùng). Sổ tay chỉ ghi "ghi mã vào sổ giao ca, giao người khác làm tiếp", không hứa nút.
   - Thêm một câu cuối: người nghỉ là người trực duy nhất thì sắp xếp người trực quầy **trước** khi khóa.
3. **B.2 ý 4 (nhận phòng):** DOM viết "căn còn `VC` … làm như 7.4". Mục 7.4 (**Gửi lễ tân trưởng xác nhận**) chỉ hiện với căn `VD`, `CL`, `OD`; Desk coi `VC` là nhận được (`02` 13.2). Nên BA ghi: căn còn `VC` lúc khách tới thì kiểm trên app ngay rồi nhận; không kiểm trên app được thì kiểm bằng mắt theo 13.2a, ghi sổ giao ca, rồi nhận.
4. **`02` 14.2:** câu cũ "Chủ đầu tư và quản lý không kiểm được ở đâu" giữ cho v1.0.3, thêm khối **Áp dụng từ v1.0.4**: A81 cho OWN, MGR, FDL; mã app `canInspect` (`apps/mobile/src/app/session.ts`) cho cả `owner`, `manager`, `front_desk_lead`.

## 3. Mặc định đội chọn đã ghi vào tài liệu (DOM mục B; báo INV cuối round, không ESC)

**B.1 – 2 bước sau v1.0.4:** lễ tân trưởng **bắt buộc** (quy định OTTIMO; Desk chưa ép, dự kiến v1.0.5 thêm `front_desk_lead` vào `MFA_REQUIRED_ROLES` – việc của ARC + SEC, BA không đưa vào backlog); buồng phòng, bảo trì **tùy chọn** (chỉ bật khi có điện thoại riêng và giữ được mã khôi phục).
- Chỗ sửa: `01` 1.8 (khối v1.0.4), 1.9 (bảng vai cột 2 bước; bước 8 thêm 3 việc của chủ đầu tư khi tạo tài khoản lễ tân trưởng: tạo, ngồi cùng bật trên Desk, nhìn tận mắt khối **Xác thực 2 bước** đã bật rồi mới giao việc); sổ tay 1.5 bước 7, 3.1, 3.6; `02` 1.8; `03` 1.6; `04` 1.5.
- Nếu SEC muốn phương án A (bắt buộc cả ba vai): sửa lại đúng các chỗ trên, và theo DOM thì khi đó mới thành câu hỏi cho INV.

**B.2 – kiểm căn:** từ v1.0.4 người trực **kiểm căn trên app nhân viên**; 13.2a giữ làm **dự phòng**. Ghi đủ 4 điều của DOM: giữ mốc 11:00 / 14:00 / căn trống quá 3 ngày; trình tự **Làm xong** → kiểm trên app → `VI`, người dọn theo giờ thì người trực bấm **Làm xong** thay; dự phòng ghi sổ giao ca "Kiểm bằng mắt căn … – hh:mm – lý do"; nhận phòng (xem mục 2 ý 3).
- Chỗ sửa: `02` 1.8, 2 (bảng việc), 13.2, 13.2a, 14.2, 18, 20.3 bài tập 10; `01` 1.8; sổ tay 3.1, 3.6; `03` đầu tệp, 5.1, 12; `00-index` 2.1, 5.

## 4. Đã kiểm
- `build_guides.py` chạy trên bản sao tạm (bộ hướng dẫn của nhánh này + `to-4-your-id-details-a4.html` của `v104/uxd-id-sheet-v2`): "Chữ tờ Your ID details trong 02-le-tan.md khớp nguyên văn bản A4 (10 đoạn + nhãn, tiêu đề, chân tờ)". Khối nguyên văn tờ v2 trong `02` 7.2 không đổi một byte. Khối **Ngày thay tờ** dựng ra danh sách đánh số trong khung trích. HTML không đưa vào repo (như các lần trước).
- Sửa liên kết chéo: viết `00-index.md` mục 4 (không phải `00-index` mục 4) để HTML trỏ đúng tệp.
- Không có dữ liệu khách thật, email thật, số tài khoản, mã cửa hay số hoa hồng trong phần sửa.

## 5. Còn mở / chờ
- DOM xác nhận lượt 2 (nhất là mục 2 ý 1–3). SEC xem khối **Ngày cuối của người nghỉ** (M18-08) và nhánh dự phòng của ngày thay tờ.
- Không có ESC mới.

## 6. Dòng decision-log đề xuất (ORC ghi khi gộp)
`| 2026-11-04 | 4 | **BA – sửa tài liệu v1.0.4 theo DOM** (v104/ba-docs; rounds/round-04/responses/BA-on-DOM-v104.md): 6/6 thẻ Done. Ngày thay tờ v2: khung 09:00–11:00, OWN đặt privacy_notice_version trên Tham số quy tắc ≤ 15 phút sau khi thay, không nhận giấy tờ khách mới lúc chờ, quá 15 phút thì đặt lại tờ v1 [GIẢ ĐỊNH BA – G-BA-104-4]; khối Ngày cuối của người nghỉ 8 bước (áp dụng ngay); yêu cầu hoàn thay thế đủ 4 ý + đổi nơi nhận bằng nút Nhập nơi nhận hoàn (đã kiểm mã Desk). Mặc định đội chọn ghi vào tài liệu: FDL bắt buộc 2 bước, HK/MT tùy chọn; người trực kiểm căn trên app, 13.2a dự phòng | BA | Quyền BA (cách trình bày đặc tả); DOM-on-v104-ba-docs.md |`

---

## 7. Lượt 2 (04/11) – trả lời DOM lượt 2 (thẻ 07, 08, 09) và SEC (thẻ 01–09)

- Đọc: `rounds/round-04/reviews/DOM-on-v104-ba-docs.md` mục "Lượt 2 (04/11)"; `rounds/round-04/reviews/SEC-on-v104-ba-docs.md` (bản trên origin/main @ `e1f6899b`); hướng phân xử của ORC 04/11 cho DOM 07 + SEC 03 (bỏ mốc 10 phút, gọi trước mọi lần Lưu, không có ngoại lệ "báo đội kỹ thuật sửa dữ liệu", kéo SEC 09(a) vào v1.0.4).
- Sửa trên `v104/ba-docs` (đầu cũ `39b61dec`): `guides/00-index.md` mục 4; `guides/02-le-tan.md` 7.2 khối **Ngày thay tờ**; `guides/01-chu-dau-tu-quan-ly.md` 1.9 và 9.2; `user-manual-v1.0.md` 1.5. Không đụng tệp của UXD; khối chữ tờ v2 trong `02` 7.2 giữ nguyên từng byte.

### 7.1 Bảng thẻ

| ID | Trạng thái | Đã sửa |
|---|---|---|
| FB-R4-DOM-BA-104-07 (Major) | Done | `00-index` mục 4 bước 3–5 và `02` 7.2 bước 2–7 viết lại, cùng một nội dung. **Mốc** = giờ trong tin "Đã thay tờ v2 – hh:mm". Cảnh báo in đậm "Đã bấm Lưu thì trong ngày không quay về v1 được". Chủ đầu tư **gọi người trực trước mọi lần Lưu** ("Tờ v2 còn trên quầy chứ?"), Lưu trong lúc còn gọi; không gọi được hoặc đã có tin "Đặt lại v1" thì không Lưu. **Dán** `"privacy-2026-10-v2"` (gồm ngoặc kép, không gõ tay); Lưu xong mở lại dòng, **Lịch sử thay đổi** phải có dòng hôm nay đúng từng ký tự rồi mới nhắn "Đã đặt v2 – hh:mm". Người trực chờ tối đa 15 phút; đang gọi mà được bảo "chờ" thì chờ tiếp; quá hạn thì nhắn "Đặt lại v1 – hh:mm" **trước** rồi mới đặt lại tờ v1, tờ v2 cất cạnh chưa hủy. Tin đi chéo: xem ý 4 SEC 03. Lưu sai giá trị: theo ORC, **không** có ngoại lệ "báo đội kỹ thuật" – ghi "Desk v1.0.4 chỉ nhận các giá trị đã có tờ, nên không lưu được giá trị sai; Desk báo lỗi khi Lưu thì kiểm lại chữ đã dán"; giữ câu "không nhờ đội kỹ thuật đặt hộ hay sửa thẳng dữ liệu". Nhầm **Hiệu lực từ** sang ngày mai: sửa lại với hôm nay (gọi người trực trước), kiểm lịch sử. `00-index` mục 4 bước 2: ngày thay tờ chỉ làm **sau khi** bản v1.0.4 có danh sách giá trị cho phép đã lên. `01` 9.2 viết lại cùng ý |
| FB-R4-DOM-BA-104-08 (Minor) | Done | `02` 7.2 bước 5 và `00-index` bước 3.7: nhận tin "Đã đặt v2" thì F5 mọi trang giấy tờ đang mở trên máy quầy. Câu lỗi theo SEC 08 (dưới) |
| FB-R4-DOM-BA-104-09 (Suggestion) | Done | Bước 6 khối **Ngày cuối của người nghỉ** (sổ tay 1.5, `01` 1.9): "Căn HĐ thuê tháng mà người đó biết mã: hẹn khách đổi mã trong 7 ngày, kể cả khi nghỉ êm." |
| FB-R4-SEC-BA-104-01 (Major) | Done | Thêm khối **Thứ tự** đầu danh sách: người nghỉ êm làm bước 1 → 8, bước 3, 5, 6, 7 cuối ca cuối cùng; người **bị cho thôi việc** ngay lúc báo, cùng một lần ngồi máy: bước 3 → phần app khóa của bước 6 (gỡ ủy quyền, vô hiệu mã/thẻ nhân viên) → bước 5 → bước 7 → phần còn lại của bước 6, sau đó mới 1, 2, 4, 8. Bỏ chữ "trong ngày" ở bước 5. Bước 1 đổi "Làm trước khi khóa" thành "Người nghỉ êm làm trước khi khóa" cho khỏi trái với thứ tự mới |
| FB-R4-SEC-BA-104-02 (Major) | Done | Bước 6 thành danh sách "Chìa, mã, mật khẩu dùng chung (những thứ người đó biết hoặc được giao)": chìa cơ, thẻ tổng, thẻ nhân viên; app khóa (ủy quyền, mã/thẻ nhân viên); extranet OTA (gỡ tài khoản riêng hoặc đổi mật khẩu từng kênh); hộp thư chung `booking@`, hộp thư quầy, Gmail OTA (đổi mật khẩu, đăng xuất mọi phiên); mã mở máy điện thoại cơ sở, máy tính bảng, máy quầy, Zalo cơ sở đăng xuất/đăng nhập lại; mã két, Wi-Fi quản trị, mật khẩu phát Wi-Fi (4G); mã cửa (cho thôi việc + HĐ thuê tháng). Thêm "Không ghi mật khẩu, mã mới vào sổ giao ca, nhóm chat hay giấy dán quầy" |
| FB-R4-SEC-BA-104-03 (Major, bản sửa) | Done | Ý 1–3 như DOM 07 ở trên. Ý 4 (tin đi chéo) ghi đủ ở `00-index` bước 4 và `02` bước 7: ngừng nhận giấy tờ, đặt ngay tờ v2 (khung mica, ngăn quầy, máy tính bảng); với mỗi khách nhận giấy tờ trong khoảng giữa, sổ giao ca **chỉ** ghi mã đơn, giờ nhận giấy tờ, giờ cho xem v2 (không tên, số giấy tờ, quốc tịch, SĐT); cho xem v2 lần gặp tiếp, trước khi trả phòng; **không** hỏi lại/ghi lại đồng ý, không xóa/nhập lại giấy tờ; khách không đồng ý xem hoặc đã về: ghi "chưa xem v2", **không** đưa tin của khách đó qua dịch vụ dịch (`02` trỏ mục 13.1d); chủ đầu tư nhắn đội chỉ số lượng "Lệch tờ ngày dd/mm: n đơn". Ý 5 theo ORC: không SQL, chờ 09(a) |
| FB-R4-SEC-BA-104-04 (Minor) | Done | Máy tính bảng: "chép tệp v2; tệp v1 đổi tên hoặc chuyển ra thư mục riêng, chỉ xóa khi có tin 'Đã đặt v2'". Nhánh đặt lại v1: "mở lại tệp v1, xóa tệp v2 (không còn tệp v1 thì hôm đó không dùng máy tính bảng)". Tin đi chéo: máy tính bảng mở lại tệp v2 |
| FB-R4-SEC-BA-104-05 (Minor) | Done | Bước 7: dữ liệu đọc ngoại tuyến của app nhân viên còn tới khi **Đăng xuất**; người nghỉ êm bấm **Tôi → Đăng xuất** trước mặt chủ đầu tư, **trước** bước 3; người bị cho thôi việc: nhờ xóa dữ liệu trang hoặc gỡ app, không làm thì ghi sổ giao ca, không ép. Khối CTV thêm "bước 7 nếu máy của CTV đã được cấp quyền" |
| FB-R4-SEC-BA-104-06 (Minor) | Done | Bước 3 và dòng **Người nghỉ hẳn**: "Tài khoản người nghỉ hẳn **không Mở khóa lại**"; bước 3 thêm lý do (mật khẩu, 2 bước, mã khôi phục cũ còn hiệu lực) và "Tuyển lại thì tạo tài khoản mới (tên đăng nhập mới, mật khẩu tạm mới, bật 2 bước lại nếu vai cần)" |
| FB-R4-SEC-BA-104-07 (Suggestion) | Done | Bước 4 viết lại: "Sau bước 3, tài khoản này không nhận thư bảo mật về chính mình nữa, **trừ một** thư **Security notice: notification email changed** gửi tới địa chỉ cũ ở bước này (thư không có dữ liệu khách)." |
| FB-R4-SEC-BA-104-08 (Minor) | Done | `02` 7.2 bước 5: "Khách đang làm dở mà Desk báo "Chọn một giá trị trong danh sách." ở Khối 1 khi lưu câu trả lời đồng ý lưu ảnh: cho khách xem tờ v2, tải lại (F5), hỏi lại câu đồng ý lưu ảnh (mục 8.2). **Không chọn sẵn thay khách.**" Chuỗi lỗi lấy từ mã: `RegistrationPage.tsx` lưu đồng ý qua `useSubmit()` không có bảng lỗi riêng, nên lỗi `VALIDATION_FAILED` / `NOT_IN_LIST` của `noticeVersion` hiện bằng `field_error.not_in_list` = "Chọn một giá trị trong danh sách." (giống nhau trên origin/main và origin/v104/uxd-strings) |
| FB-R4-SEC-BA-104-09 (gửi ARC) | Không phải việc BA | Tài liệu đã viết theo giả định 09(a) có trong v1.0.4: "Desk v1.0.4 chỉ nhận các giá trị đã có tờ" và ngày thay tờ chỉ làm sau khi bản đó lên. ARC/FE chốt chuỗi lỗi khi Lưu giá trị lạ thì BA thêm đúng chữ (hiện tài liệu chỉ ghi "Desk báo lỗi khi Lưu"). 09(b) (ghi đè trong 30 phút) chưa ghi vào tài liệu; có thì BA sửa lại câu "trong ngày không quay về v1 được" |

### 7.2 G-BA-104-4 viết lại

Thay bản lượt 1. **Giả định BA (đã có hướng ORC):** ngày thay tờ không có giới hạn giờ cho chủ đầu tư Lưu; điều kiện Lưu là đang gọi điện với người trực và người trực xác nhận tờ v2 còn trên quầy. Người trực chờ tối đa 15 phút từ mốc, trừ khi đang nói chuyện với chủ đầu tư và được bảo chờ. Quá hạn thì người trực **nhắn "Đặt lại v1 – hh:mm" trước**, rồi mới đặt lại tờ v1 (tờ v2 và tệp v2 cất cạnh). Tin đi chéo vẫn có thể xảy ra (chủ đầu tư Lưu mà không gọi), nên có nhánh xử lý riêng (SEC 03 ý 4); SEC ghi đây là sai lệch quy trình, không phải lộ dữ liệu. Giá trị sai không còn là rủi ro vì máy chủ v1.0.4 chặn (SEC 09(a)); nếu 09(a) **không** kịp v1.0.4 thì ngày thay tờ lùi tới bản có 09(a), tài liệu không cần sửa (bước 2 đã ghi điều kiện).

### 7.3 Chỗ BA làm khác đề xuất reviewer

1. **Tên tin nhắn đặt lại v1.** DOM 07 ý 4 và SEC 03 ý 3 đề xuất "Đã đặt lại tờ v1 – hh:mm" (nhắn sau khi đặt). BA để người trực nhắn **"Đặt lại v1 – hh:mm" trước khi đặt** tờ v1: chủ đầu tư thấy tin là biết không được Lưu nữa, khoảng đi chéo ngắn hơn. Chữ "Đã" bỏ vì tin gửi trước việc làm.
2. **"Không hỏi lại hay ghi lại câu đồng ý"** (SEC 03 ý 4 viết "không ghi lại đồng ý"): BA thêm "hỏi lại" vì với người trực, ghi lại đồng ý bắt đầu bằng hỏi lại. Khác với SEC 08 (khách **đang làm dở**, Desk chưa lưu được): ở đó phải hỏi lại, và tài liệu ghi rõ hai tình huống tách nhau.
3. **Người trực báo chủ đầu tư số đơn lệch** (không gửi mã đơn qua tin nhắn); mã đơn chỉ nằm trong sổ giao ca.

### 7.4 Đã kiểm

- `build_guides.py` dựng lại trên bản chép (tờ A4 v2 lấy từ `origin/v104/uxd-id-sheet-v2`): "Chữ tờ Your ID details trong 02-le-tan.md khớp nguyên văn bản A4 (10 đoạn + nhãn, tiêu đề, chân tờ)"; không có cảnh báo trỏ mục. Ảnh thiếu như lượt 1 (chờ chụp).
- `git diff` khối chữ tờ v2 trong `02` 7.2: không đổi. Không có mật khẩu, mã, email thật trong phần sửa.

### 7.5 Còn mở

- Chờ DOM, SEC xác nhận thẻ 07–09 và SEC 01–08.
- SEC 09 (ARC): khi chốt, BA thêm chuỗi lỗi khi Lưu giá trị lạ, và sửa câu "trong ngày không quay về v1 được" nếu 09(b) vào v1.0.4.

### 7.6 Dòng decision-log đề xuất (thêm vào dòng mục 6)

`| 2026-11-04 | 4 | **BA – sửa tài liệu v1.0.4 lượt 2 (DOM 07–09, SEC 01–08)**: ngày thay tờ v2 – mốc là tin "Đã thay tờ v2", OWN gọi người trực trước mọi lần Lưu, dán giá trị và kiểm Lịch sử thay đổi rồi mới nhắn "Đã đặt v2"; người trực chờ tối đa 15 phút, nhắn "Đặt lại v1" trước khi đặt lại tờ v1; tin đi chéo: sổ giao ca chỉ mã đơn + giờ, không hỏi lại đồng ý, "chưa xem v2" thì không dịch tin của khách đó, OWN nhắn đội chỉ số lượng; không có ngoại lệ sửa dữ liệu, ngày thay tờ chỉ sau khi bản có danh sách giá trị cho phép (SEC 09a) lên [G-BA-104-4 bản 2]. Ngày cuối của người nghỉ: thứ tự riêng khi cho thôi việc, không Mở khóa lại, chìa/mã/mật khẩu dùng chung, đăng xuất app nhân viên, HĐ thuê tháng đổi mã trong 7 ngày | BA | Quyền BA; DOM-on-v104-ba-docs.md Lượt 2, SEC-on-v104-ba-docs.md, ORC 04/11 |`

### 7.7 Bổ sung sau hướng ORC (P4-16)

ARC chốt: v1.0.4 (gói P4-16) máy chủ chỉ nhận `privacy-2026-10-v2`; giá trị khác Desk báo câu có sẵn (khóa `error.PARAM_OUT_OF_RANGE`, `product/design/copy/strings-vi.json`, `{allowed}` = `privacy-2026-10-v2`) "Giá trị này nằm ngoài khoảng cho phép. Chọn một trong: privacy-2026-10-v2."
- `00-index` mục 4 bước 2: ngày thay tờ chỉ làm sau khi v1.0.4 **có gói P4-16** đã lên. Bước 3.4: Desk báo câu trên nghĩa là **chưa lưu gì** – dán lại `"privacy-2026-10-v2"` có ngoặc kép rồi Lưu (vẫn trong cuộc gọi).
- `02` 7.2 bước 1: chỉ làm sau khi chủ đầu tư báo v1.0.4 (có P4-16) đã lên. Bước 3: cùng câu "chưa lưu gì", tờ v2 vẫn để trên quầy.
- Không có đường "OPS/đội kỹ thuật sửa dữ liệu" ở bất kỳ chỗ nào; giữ câu "Không nhờ đội kỹ thuật đặt hộ hay sửa thẳng dữ liệu".
- SEC 09: (a) đã có trong P4-16, tài liệu dùng đúng chuỗi lỗi; G-BA-104-4 bỏ nhánh "09(a) không kịp" (ngày thay tờ gắn với P4-16). 09(b) chưa vào tài liệu.

---

## 8. Lượt 3 (04/11) – DOM lượt 3 (thẻ 10, 11, ghi chú) và SEC xác nhận (thẻ 10, 11, 12, P416-03c)

DOM lượt 3 và SEC: gộp **ĐẠT**; DOM 07–09 và SEC 01–08 **Closed**; đồng ý 3 chỗ BA làm khác (mục 7.3). Sửa trên `v104/ba-docs` (đầu cũ `97d7ae5d`). Khối chữ tờ v2 trong `02` 7.2 không đổi.

| ID | Trạng thái | Đã sửa |
|---|---|---|
| FB-R4-DOM-BA-104-10 (Minor) | Done | Hai dòng **Mở quầy** (`02` mục 2, mục 18) và `02` 7.2 bước 11, `00-index` mục 4 bước 9: "**Từ hôm sau ngày sổ giao ca có dòng "Thay tờ v2 hh:mm – tham số v2 hh:mm"**: chân tờ có chữ v2, cả tờ trong ngăn quầy. Chưa có dòng đó: tờ v1 là đúng, **không** tự thay tờ v2." Nhánh đặt lại v1 (`02` bước 6, `00-index` bước 3.8): tờ v2 cất **khỏi quầy**, trong phong bì ghi "Tờ v2 – chờ chủ đầu tư hẹn ngày thay", chưa hủy; sổ giao ca ghi "Đặt lại v1 hh:mm – tờ v2 cất ở …" |
| FB-R4-DOM-BA-104-11 (Suggestion) | Done | `00-index` 3.3: "Lưu xong, nói "**Đã Lưu**" với người trực **trước khi gác máy**." `02` bước 3: chủ đầu tư nói "Đã Lưu" trước khi gác máy; nghe "Đã Lưu" thì giữ tờ v2, kể cả khi đã nhắn "Đặt lại v1". `02` bước 6: "Đã nhắn "Đặt lại v1" mà chưa đặt tờ v1, chủ đầu tư gọi tới: nói rõ "vừa nhắn đặt lại v1, tờ v2 còn trên quầy" và làm theo lời chủ đầu tư. Nghe "**Đã Lưu**" thì giữ tờ v2, bỏ việc đặt lại v1." `00-index` 3.8 trỏ sang |
| DOM ghi chú | Done | Sổ tay 1.5, `01` 1.9: "Người nghỉ êm: bước 1 → 8 theo số (riêng **Đăng xuất** app nhân viên ở bước 7 làm trước bước 3)" |
| FB-R4-SEC-BA-104-10 (Suggestion) | Done | `00-index` 3.4: Desk báo **bất kỳ lỗi nào** ở ô **Giá trị mới** (ví dụ "Chọn một giá trị trong danh sách." khi thiếu ngoặc kép, hoặc "Giá trị này nằm ngoài khoảng cho phép. Chọn một trong: privacy-2026-10-v2.") nghĩa là chưa lưu gì; "Chỉ tin bảng **Lịch sử thay đổi**". `02` bước 3 cùng ý (người trực không thấy Desk nên ghi "chủ đầu tư nói Desk báo lỗi…") |
| FB-R4-SEC-BA-104-11 (Minor) | Done | Nhánh tin đi chéo (`00-index` bước 4, `02` bước 7): "khách xem v2 rồi nói không muốn dịch: ghi "không dịch" cạnh mã đơn, không đưa tin của khách đó qua dịch vụ dịch". `02` 13.1d phần 3 thêm câu chung cho mọi khách: ghi "không dịch" cạnh mã đơn trong sổ giao ca; trước khi dịch, người đọc tin kiểm sổ giao ca, mã đơn có "không dịch" hoặc "chưa xem v2" thì không dịch |
| FB-R4-SEC-BA-104-12 (Suggestion) | Done | `01` 12.1: "gỡ khỏi phòng theo thứ tự ở mục 1.9, khối **Ngày cuối của người nghỉ** (người bị cho thôi việc: ngay lúc báo, cùng lần **Khóa tài khoản**)" |
| SEC P416-03(c) | Done, có giả định | `00-index` mục 4 bước 1 thêm ý **Kiểm lịch đã đặt** (trước ngày thay và sáng ngày thay, trước bước 3): mở **Quản trị → Tham số quy tắc** → **Khác** → `privacy_notice_version` → **Sửa**, bảng **Lịch sử thay đổi** không được có dòng ngày hiệu lực sau hôm nay (nhãn **Chưa hiệu lực**, chuỗi `params.not_yet`); có thì hủy bằng nút hủy trên dòng đó rồi mới làm tiếp; không hủy được trên Desk thì không thay tờ hôm đó, báo đội, không nhờ sửa thẳng dữ liệu. Không SQL |

### 8.1 Chỗ BA làm khác hoặc cần đội xác nhận

1. **Nút hủy dòng đã lên lịch (P416-03c) – G-BA-104-5.** Trên `origin/main`, hộp sửa tham số (`ParamDialog.tsx`) **chưa có** nút hủy dòng đã lên lịch; máy chủ đã có `cancelScheduledParameter` (`POST …/parameters/{key}/actions/cancel-scheduled`), nhưng Desk chỉ gắn nút ở trang tài khoản nhận tiền (`ReceivingAccount.tsx`, nhãn `rcv.cancel_scheduled`). BA viết "nút hủy trên chính dòng ấy", không ghi tên nút. **Giả định:** gói P4-16 (hoặc FE v1.0.4) thêm nút này vào bảng **Lịch sử thay đổi** của `ParamDialog`. Khi FE chốt nhãn, BA ghi đúng tên. Nếu v1.0.4 không có nút: tài liệu đã có nhánh "không hủy được trên Desk thì không thay tờ hôm đó, báo đội", nhưng khi đó chủ đầu tư không tự gỡ được dòng lên lịch – ORC cân nhắc giao FE.
2. **Tệp v2 trên máy tính bảng khi đặt lại v1** (DOM 10 ghi "tờ v2 (và tệp v2) cất khỏi quầy"): BA giữ bước "máy tính bảng xóa tệp v2" (SEC 04, để máy tính bảng chỉ có tệp v1), thêm "anh/chị vẫn giữ tệp v2 gốc" ở `00-index`. Tờ in v2 vào phong bì như DOM.

### 8.2 Đã kiểm

- `build_guides.py` dựng lại trên bản chép (tờ A4 v2 từ `origin/v104/uxd-id-sheet-v2`): khớp nguyên văn bản A4 (10 đoạn + nhãn, tiêu đề, chân tờ); không có cảnh báo trỏ mục.
- Không có mật khẩu, mã, email thật trong phần sửa.

### 8.3 Còn mở

- Chờ DOM, SEC xác nhận thẻ 10, 11, 12, P416-03(c), ghi chú DOM.
- G-BA-104-5 (nút hủy dòng đã lên lịch): chờ FE/ARC xác nhận có trong v1.0.4 và tên nút.

### 8.4 Bổ sung sau SEC xác nhận lượt 3 (SEC 13, 14b)

SEC xác nhận @ `45d09e5a`: ĐẠT; 10, 11, 12 Closed; P416-03(c) chờ nhãn nút ở P4-34 (thay giả định G-BA-104-5: nút hủy dòng đã lên lịch đến từ P4-34; khi có nhãn, BA ghi đúng tên).

| ID | Trạng thái | Đã sửa |
|---|---|---|
| FB-R4-SEC-BA-104-13 (Minor) | Done | Sổ tay 2.18 ý 3: thêm đúng quy tắc "không dịch" như `02` 13.1d – khách không muốn dịch thì ghi "không dịch" cạnh mã đơn trong sổ giao ca, không đưa tin qua dịch vụ dịch; trước khi dịch kiểm sổ giao ca, có "không dịch" hoặc "chưa xem v2" thì không dịch. Dòng lịch sử 1.11 ghi thêm |
| FB-R4-SEC-BA-104-14 (b) (Suggestion) | Done | `00-index` mục 4 bước 1 **Kiểm lịch đã đặt**: "lần 1 vào **hôm trước** ngày thay; lần 2 sáng ngày thay, trước bước 3". Bước 3.4 thêm: "Lỗi ở ô khác (ví dụ **Hiệu lực từ**), hoặc Lịch sử không có dòng v2 hôm nay, thì **không** nhắn "Đã đặt v2", báo đội." |
| FB-R4-SEC-BA-104-14 (a) | Chưa làm (theo ORC) | Chỉ dùng nếu P4-34 trượt |

### 8.5 Nhãn nút P4-34 (đóng G-BA-104-5)

ORC báo nhãn đã chốt (UXD duyệt, gói P4-34). `00-index` mục 4 bước 1 **Kiểm lịch đã đặt** thay "nút hủy trên chính dòng ấy" bằng đường đi đầy đủ: **Quản trị → Tham số quy tắc** → nhóm **Khác** → dòng `privacy_notice_version` → **Sửa** (hộp "Sửa: privacy_notice_version") → bảng **Lịch sử thay đổi** → dòng có chip **Chưa hiệu lực** → **Hủy lịch** → hộp **Hủy giá trị đã lên lịch?** → **Lý do** → **Hủy lịch** → Desk báo "Đã hủy lịch đổi …". Thêm: chỉ chủ đầu tư thấy nút với khóa này; câu SEC "**Hủy lịch** chỉ dùng cho dòng hẹn từ ngày mai trở đi; dòng đã có hiệu lực hôm nay không hủy được – không dùng nút này để sửa một lần Lưu sai."

Đã kiểm trên `origin/v104/fe-param-cancel`:
- Nhóm **Khác**: `paramCatalog.ts` không có khóa `privacy_notice_version` trong `KNOWN` → `paramMeta()` trả `group: 'other'`; `GROUP_LABEL.other` = `params.grp_other` = "Khác". Đúng nhóm **Khác**.
- Chuỗi: `params.not_yet` "Chưa hiệu lực", nút `rcv.cancel_scheduled` "Hủy lịch" (ParamDialog dùng lại khóa này), `params.cancel_title` "Hủy giá trị đã lên lịch?", `params.reason` "Lý do", `params.cancelled` "Đã hủy lịch đổi {name}.", `params.edit_title` "Sửa: {name}".
- Cột nút chỉ hiện khi có dòng ngày hiệu lực sau hôm nay và người xem được quyền sửa khóa (`mayCancel`; khóa chỉ OWN).

G-BA-104-5 đóng.

## 9. Lượt 4 (04/11) – DOM lượt 4 (thẻ 12, 13)

DOM lượt 4 @ `4a842a14`: **ĐẠT CÓ ĐIỀU KIỆN**, DOM 10, 11 và ghi chú DOM **Closed**. Sửa thẻ 12, 13 trên `v104/ba-docs` (đầu cũ `8ddde2ae`), trước ngày thay tờ v2. Khối chữ tờ v2 trong `02` 7.2 không đổi. Nhãn đối chiếu `strings-vi.json` trên `origin/v104/fe-param-cancel` @ `2502f179`.

| ID | Trạng thái | Đã sửa |
|---|---|---|
| FB-R4-DOM-BA-104-12 (Minor) | Done, làm khác đề xuất (mục 9.1) | `02` 13.1d viết lại: "không dịch" (và "chưa xem v2") ghi vào **trang Không dịch** – trang riêng ở **đầu** sổ giao ca, dùng chung mọi ca và mọi ngày, không sang trang theo ca. Mỗi dòng: mã đơn `OTM-…` (khách website chưa có đơn: mã yêu cầu `REQ-…`) · chữ · ngày ghi; chỉ mã. Lập đơn từ yêu cầu có trong trang: ghi thêm mã đơn vào cùng dòng. Sổ giao ca của ca đó vẫn ghi dòng nhắc "Trang Không dịch: thêm OTM-…". Câu kiểm: "**Trước khi dịch tin của một khách**, mở trang Không dịch: mã đơn hoặc mã yêu cầu của khách có trong trang thì **không** dịch." `02` mục 2 dòng **Mở quầy**: đọc thêm trang Không dịch. `02` 7.2 bước 7, `00-index` mục 4 bước 4: ghi mã đơn và chữ vào trang Không dịch. Sổ tay 2.18 ý 3 cùng ý, trỏ `02` 13.1d; dòng lịch sử 1.11 ghi thêm |
| FB-R4-DOM-BA-104-13 (Minor) | Done | `00-index` mục 4: **bước 1** câu SEC thành "Nút **Hủy lịch** chỉ có ở dòng hẹn từ ngày mai trở đi (chip **Chưa hiệu lực**), kể cả dòng Lưu nhầm **Hiệu lực từ** sang ngày mai: dòng đó hủy được, và phải hủy ngay trong ngày (bước 5). Dòng đã có hiệu lực hôm nay không có nút và không hủy được: **Hủy lịch** không sửa được một lần Lưu sai giá trị hôm nay." **Bước 3.4**: Desk báo "Đã lưu …, hiệu lực từ" ngày mai hoặc Lịch sử có dòng v2 **Chưa hiệu lực** → làm ngay bước 5; chỉ "báo đội" khi Desk báo lỗi ở ô khác (**Hiệu lực từ**, **Lý do**) hoặc Lịch sử không có dòng v2 hôm nay **lẫn** dòng **Chưa hiệu lực**. **Bước 3.5**: thêm "không có dòng **Chưa hiệu lực**". **Bước 5** viết lại thành 4 ý: (1) **Hủy lịch** ở dòng **Chưa hiệu lực** ngay trong ngày, **Lý do** "Lưu nhầm ngày hiệu lực", chờ "Đã hủy lịch đổi …"; (2) còn trong cuộc gọi và người trực nói tờ v2 còn trên quầy: Lưu lại với hôm nay, kiểm như 3.5; (3) không còn như vậy: chỉ hủy lịch, không Lưu, người trực đặt lại v1 (3.8); (4) không hủy được trên Desk: không nhắn "Đã đặt v2", báo đội ngay trong ngày. Có câu lý do: Lưu lại không xóa dòng ngày mai, buổi thay bị hủy mà dòng còn thì 00:00 Desk đổi sang v2 khi quầy để tờ v1. `02` 7.2 bước 3 (phía người trực): chủ đầu tư nói Lưu nhầm ngày thì tờ v2 vẫn để trên quầy trong lúc còn gọi; chủ đầu tư nói chỉ hủy lịch, không Lưu thì làm bước 6. `01` 9.2: không có câu về `privacy_notice_version` (chỉ có **Hủy lịch** của tài khoản nhận tiền), không sửa |

### 9.1 Vì sao thẻ 12 không dùng ô Ghi chú nội bộ

ORC giao ghi vào ô **Ghi chú nội bộ** của đơn và kiểm ô này có lên bill hoặc tới khách không. BA đã kiểm code trên `origin/v104/fe-param-cancel`:

- **Ô Ghi chú nội bộ của đơn (`reservations.internal_note`, nhãn `crm.f_note` "Ghi chú nội bộ"):**
  - Không in lên bill: `folio/internal/bill.service.ts` và các trang in của `admin-web` không đọc trường này.
  - Không gửi khách: không mẫu tin, thông báo hay `guest-web` nào đọc trường này. API trả trường theo quyền `D12c`; mock bỏ trường với vai CTV.
  - **Nhưng Desk v1.0.4 không cho nhập hay xem trường này với đơn của khách.** Ô chỉ có trong `BookingDialog.tsx` khi tạo đơn kênh **Nội bộ** (`form.group === 'internal'`). Đơn trực tiếp, OTA, đại lý không có ô này. Không màn nào hiện hay sửa trường này với đơn đã có. API `PATCH` nhận `internalNote`, nhưng Desk không có nút. Đã grep mọi nhánh `origin/*`: chỉ `BookingDialog.tsx` dùng trường này.
- **Ô Ghi chú nội bộ của yêu cầu website (`website_booking_request.decline_note`, nhãn `webreq.note`):**
  - Ô chỉ có trong hộp **Từ chối** (`WebRequestDrawer.tsx`).
  - Máy chủ xóa ô này khi yêu cầu được lập đơn (WR6), khi xóa theo yêu cầu người gửi (WR8) và khi hết hạn lưu (T19).
  - Không lên thông báo (`website-requests.service.ts` đầu tệp: C2 không vào tin).
  - Không dùng được để ghi "không dịch".
- **Ghi chú nội bộ của hồ sơ khách (`guests.free_note`):** không in bill, không gửi khách. Nhưng ô chỉ hiện trong hộp **Sửa** hồ sơ và chỉ với lễ tân trưởng trở lên, khách website chưa có hồ sơ. Người dịch tin không mở hộp này, nên ca sau không thấy.

Vì vậy BA giữ ý của DOM nhưng đổi chỗ ghi sang **trang Không dịch**:
- Ghi theo mã đơn hoặc mã yêu cầu.
- Giữ qua mọi ca và mọi ngày, nên khách dài ngày và HĐ thuê tháng không bị sót.
- Kiểm một trang, không phải lật sổ nhiều ngày.
- Theo đúng mẫu "trang riêng" đã dùng cho **sổ xóa Chat**.
- Hai chữ và mã đơn không phải dữ liệu nhạy cảm (DOM 12), và trang không lên bill, không tới khách.

Thẻ gửi FE/PO để Desk có ô ghi chú trên màn đơn và màn yêu cầu: `rounds/round-04/reviews/BA-on-FE-internal-note.md` (FB-R4-BA-FE-IN-01). Khi Desk có ô đó, BA chuyển chỗ ghi sang ô **Ghi chú nội bộ** như DOM đề xuất.

### 9.2 Đã kiểm

- Nhãn trên `origin/v104/fe-param-cancel` (`strings-vi.json`):
  - **Hủy lịch**: `params.cancel_scheduled`. Đính chính mục 8.5: `ParamDialog.tsx` dùng khóa riêng `params.cancel_scheduled`, không dùng lại `rcv.cancel_scheduled`; hai khóa cùng chữ.
  - Các nhãn khác: **Chưa hiệu lực** (`params.not_yet`), **Hủy giá trị đã lên lịch?** (`params.cancel_title`), **Lý do** (`params.reason`), "Đã hủy lịch đổi {name}." (`params.cancelled`), **Lịch sử thay đổi** (`params.history`), **Lưu thay đổi** (`params.save`).
  - Câu báo sau khi Lưu: "Đã lưu {name}, hiệu lực từ {date}." (`params.saved`, `ParamDialog.tsx` dòng 158). Đây là chỗ chủ đầu tư thấy ngay mình Lưu nhầm ngày.
- Máy chủ (`parameters.service.ts`):
  - Lưu theo ngày hiệu lực: Lưu hôm nay không đụng dòng ngày mai.
  - `cancelScheduled` trả 409 với dòng đã có hiệu lực (`effective_from <= today`).
  - Desk chỉ hiện nút ở dòng `effectiveFrom > today`. Hộp mở từ trước 06:00 (giờ đổi ngày trên Desk, mục 10) thì Desk báo "Giá trị từ {date} đã bắt đầu áp dụng nên không hủy lịch được nữa…" (`params.cancel_effective`).
  - Khớp câu "dòng hôm nay không hủy được".
- `build_guides.py` dựng lại trên bản chép (tờ A4 v2 từ `origin/v104/uxd-id-sheet-v2`): khớp nguyên văn bản A4 (10 đoạn + nhãn, tiêu đề, chân tờ); không có cảnh báo trỏ mục. Ảnh thiếu là ảnh có từ trước, không do lượt này.
- Không có tên, số giấy tờ, mật khẩu hay mã thật trong phần sửa.

### 9.3 Giả định, còn mở

- **G-BA-104-6:** dòng trên trang Không dịch giữ nguyên, không gạch (chỉ mã, không nhạy cảm). Đây là quy tắc nghiệp vụ. DOM xác nhận, hoặc cho quy tắc gạch dòng.
- **G-BA-104-7:** `02` 5.2 (đơn nhóm "Nhóm: OTM-…") và `02` mục 6 ý 5 (OTA sửa đơn), cùng sổ tay mục tương ứng, đang bảo ghi vào ô **Ghi chú nội bộ** khi tạo đơn. Ô này không có ở đơn trực tiếp và OTA (mục 9.1). Lỗi tài liệu có từ trước, không thuộc thẻ 12, 13. BA chưa sửa và chờ FE/PO trả lời thẻ FB-R4-BA-FE-IN-01:
  - FE thêm ô thì tài liệu đúng.
  - FE không thêm thì BA chuyển các câu đó sang sổ giao ca, cần DOM đọc lại.
- Chờ DOM, SEC xác nhận thẻ 12, 13.

## 10. SEC xác nhận @ `0699b1de` (ĐẠT) – thẻ FB-R4-SEC-BA-104-15

| ID | Trạng thái | Đã sửa |
|---|---|---|
| FB-R4-SEC-BA-104-15 (a) (Minor) | Done | `00-index` mục 4 bước 5 ý 4 (Hủy lịch không được): sau "báo đội" thêm việc tiếp theo. Trước khi đóng quầy (21:00), chủ đầu tư mở lại **Lịch sử thay đổi**. Còn dòng **Chưa hiệu lực** thì nhắn người trực "Tờ v2 từ 06:00 dd/mm" và chép lại tệp v2 cho máy tính bảng. Người trực giữ tờ v1 tới 05:59; từ 06:00, trước khi nhận giấy tờ của khách đầu tiên, đặt tờ v2 và ghi sổ giao ca "Tờ v2 từ 06:00 dd/mm". Từ 06:00 đã nhận giấy tờ khách dưới tờ v1 thì làm như bước 4 (tin đi chéo). Đội đã gỡ được dòng thì không nhắn, quầy giữ v1. `02` 7.2 bước 6: thêm phần việc của người trực (lấy tờ v2 trong phong bì; máy tính bảng chỉ dùng khi đã có lại tệp v2; khách nhận dưới tờ v1 làm như bước 7). Bốn chỗ mở quầy (`02` mục 2, 7.2 bước 11, mục 18; `00-index` mục 4 bước 9) thêm "(hoặc từ ngày ghi ở dòng "Tờ v2 từ 06:00 dd/mm")" |
| FB-R4-SEC-BA-104-15 (b) (Minor) | Done | Dòng hẹn có hiệu lực lúc **06:00**, không phải 00:00 (kiểm code mục 10.1). Đã sửa `00-index` mục 4 bước 5 ("00:00 Desk đổi sang v2" thành "06:00 sáng hôm sau … Desk đổi sang v2") và mục 9.2 tệp này. Đã grep `00:00` trong `guides/0*.md` và sổ tay: các chỗ còn lại là ca đêm, hạn khai báo, lọc báo cáo, đều không nói về tham số và đã đúng với mốc 06:00 |

### 10.1 Kiểm code: dòng hẹn có hiệu lực lúc nào

Nhánh `origin/v104/fe-param-cancel` @ `2502f179`.

- "Hôm nay" của tham số là **ngày kinh doanh**, không phải ngày lịch:
  - `product/services/api/src/modules/platform/public/property-context.ts` dòng 40–55: `now()` trả `today: businessDate(now, timezone, rollover)`, với `rollover` = tham số `business_day_rollover`.
  - `product/services/api/src/shared/time.ts` dòng 92–98: `businessDate()` trả ngày hôm trước khi giờ địa phương < `rollover`.
- Giá trị `business_day_rollover` = `'06:00'`: `product/services/api/src/admin/production-defaults.ts` dòng 191 (BR-010).
- Các chỗ dùng ngày kinh doanh này:
  - Đọc tham số: `parameters.service.ts` dòng 104/134/163/204/283 lấy `pc = await this.property.now(tx)`. Dòng 142 lấy giá trị đang áp dụng bằng `effective_from <= pc.today`. Dòng 185 tính dòng đang áp dụng cũng theo `pc.today`.
  - Hủy lịch: dòng 301 `row.effective_from <= pc.today` → 409.
  - Desk khi nhận giấy tờ: `registration.service.ts` dòng 1535–1539 (`businessToday()` = `businessDate(c.now, c.tz, rollover)`) và dòng 1559–1561 (`currentNoticeVersion` đọc `privacy_notice_version` theo ngày đó). Web check-in online: `guest-portal.service.ts` dòng 387–388 đọc theo `today` truyền vào.
  - FE: `product/apps/admin-web/src/app/businessDay.ts` dòng 16, 48–53 neo ngày theo `businessDate` và `businessDayRollover` của máy chủ. Chip **Chưa hiệu lực** và nút **Hủy lịch** (`ParamDialog.tsx` dòng 180, 332, 347) cũng đổi lúc 06:00.
- Kết luận:
  - Dòng hẹn ngày D có hiệu lực lúc **06:00 ngày D** (giờ Đà Lạt).
  - Từ 00:00 đến 05:59 ngày D, Desk vẫn ghi v1. Dòng vẫn là **Chưa hiệu lực** và vẫn **Hủy lịch** được.
  - Khớp `02` mục 2 ("Ngày trên Desk đổi lúc 06:00"). Câu "00:00" ở `00-index` là sai, đã sửa.
- Giả định:
  - **G-BA-104-8:** chủ đầu tư không đổi `business_day_rollover`. Nếu đổi, câu "06:00" trong mục 4 phải đổi theo.
  - Giờ đóng quầy 21:00 được dùng làm mốc chủ đầu tư kiểm lại Lịch sử (`02` mục 2).

