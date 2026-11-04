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
