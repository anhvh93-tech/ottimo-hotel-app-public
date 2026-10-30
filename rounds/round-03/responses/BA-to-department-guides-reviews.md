# BA – Phản hồi review Bộ hướng dẫn OTTIMO Desk v1.0 theo bộ phận

- Round 3 · Bước: **Phản hồi & sửa** · 30/10/2026 · Tác giả: BA · Hạn: trước buổi đào tạo C3a tối 31/10
- Review đã nhận:
  - `rounds/round-03/reviews/DOM-on-BA-department-guides.md` – 16 thẻ (7 Major G01–G07, 8 Minor G08–G15, 1 Suggestion G16) + quyết định D1–D4
  - `rounds/round-03/reviews/SEC-on-BA-department-guides.md` – 9 thẻ (4 Major G01–G04, 4 Minor G05–G08, 1 Suggestion G09) + quyết định S1–S4
  - `rounds/round-03/outputs/UXD/department-guides-html.md` mục 5.2 – 6 điểm (B1 Major, B2–B5 Minor, B6 Suggestion)
  - `rounds/round-03/qa/qa3-rc1.md` mục 22.6 – 12 dòng (11 cần sửa, dòng 12 không phải sửa) + BUG-R3-052, BUG-R3-053
  - Bổ sung của ORC (quyết định 30/10): tờ "Your ID details" in **A4**, **2 bản** (quầy + ngăn dự phòng); form "Yêu cầu đặt phòng" dự kiến bật sáng 31/10, Desk mở trên máy quầy và điện thoại người trực 07:00–22:00, tin Google Chat ở v1.0.1
- Đã sửa: `product/docs/manual/guides/00-index.md` … `05-sale-ctv.md` (bản 1.0 → **1.1**), `screenshot-additions.md`. Không sửa `user-manual-v1.0.md`. Chưa commit (theo giao việc).
- Cách làm: chữ đề xuất của người review **chép nguyên văn** khi có; chỗ khác đề xuất ghi rõ ở cột Ghi chú. Thẻ trùng nội dung trả lời chung (mục 5).
- Dựng kiểm: `python3 -I product/design/tools/build_guides.py` thoát 0 (mục 6). HTML không commit.

## 1. Tổng hợp

| Nguồn | Blocker | Major | Minor | Suggestion | Cộng | Done | Rejected / Deferred / Open |
|---|---:|---:|---:|---:|---:|---:|---:|
| DOM | 0 | 7 | 8 | 1 | 16 | 16 | 0 |
| SEC | 0 | 4 | 4 | 1 | 9 | 9 | 0 |
| UXD (mục 5.2) | 0 | 1 | 4 | 1 | 6 | 6 | 0 |
| QA (mục 22.6) | – | – | – | – | 12 dòng + 2 lỗi | 11 dòng sửa, 1 dòng không cần sửa; 2 lỗi đưa vào "Tạm thời tới v1.0.1" | 0 |
| ORC bổ sung | – | – | – | – | 2 | 2 | 0 |

**Không còn Major nào Open.** Không lập ESC mới.

## 2. Thẻ của DOM

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R3-DOM-BA-G01 | Major | Done | Thêm `02` **mục 13.2a** nguyên văn (7 bước + câu "Khi OTTIMO có lễ tân trưởng…"). `02` 14.2 gạch cuối, `00` 2.1, `01` 1.8 thay bằng chữ DOM. `03` "Cách đọc" và mục 12 thêm "…, sau khi tự đi kiểm căn (tệp 02 mục 13.2a)"; thêm cùng ý ở `03` 5.1, `02` 1.8, `01` 15.6. `02` mục 2 dòng "Trước 12:00" thay theo G03. **Khác chữ DOM ở bước 5:** hộp **Hủy việc** trên Desk không có ô gõ lý do tự do mà có 3 lựa chọn (`HousekeepingPage.tsx` + `strings-vi.json`: **Treo biển "Không làm phiền"**, **Khách nói không cần dọn**, **Lý do khác** kèm **Ghi chú**). BA ghi đúng tên lựa chọn thay cho "Khách không muốn dọn – treo biển/khách nói"; cùng ý nghĩa. Sửa theo: `02` 13.2 bước 3, `02` 17.5 bước 4 (**Lý do khác** + ghi chú "Khách đã rời sớm"), bài tập ở `00` 5 và `02` 20.3. Ghi chú cho PO: Desk đã có lý do tương đương nút "Khách không muốn dọn" của app |
| FB-R3-DOM-BA-G02 | Major | Done | `05` 4.2 thay gạch 3 nguyên văn, bỏ chú thích `BA-GUIDES D2`. `05` 7.2 thay gạch nguyên văn. `02` 6.2 thêm 4a nguyên văn (trình bày là gạch con dưới bước 4 để bộ dựng giữ đúng số bước). Khác chữ DOM một chỗ: "Không ghi tên khách." gộp vào gạch "lý do khách nói (không ghi tên khách)" để danh sách không bị cắt khi dựng HTML |
| FB-R3-DOM-BA-G03 | Major | Done | Thay toàn bộ bảng `02` mục 2 bằng bảng DOM. Thêm vào dòng 07:00: "xem **Yêu cầu từ website** (mục 13.1)" (quyết định ORC về form). Sửa theo: `02` "Cách đọc" (cuối ca = đóng quầy; sau đóng quầy vẫn trực), `02` 17.1 sổ giao ca "Lúc đóng quầy", `01` 15.3, `05` 8.1 ("đóng quầy muộn nhất 21:00") |
| FB-R3-DOM-BA-G04 | Major | Done | `02` 17.1 thêm đoạn "Ở mốc 3 (đóng quầy)…" nguyên văn; `05` 8.1 thêm gạch nguyên văn. `01` 15.3 thêm "gồm giữ chỗ hết hạn trước 09:00 sáng mai". `05` 9 thêm dòng "Trước 21:00" |
| FB-R3-DOM-BA-G05 | Major | Done | `03` mục 2 thay bảng nguyên văn + câu thứ tự (1)→(4). `03` 13 thêm dòng 09:00 nguyên văn; "Đầu ca sáng" → "Trước 11:00". Thêm cho khớp: `03` mục 4 bảng "Giờ cần xong" (11:00; phòng khách ở từ 09:00), "Luôn nhớ" đổi "làm từ trên xuống" thành "làm theo thứ tự trên". Mốc 09:00 ghi theo DOM là việc nội bộ, chủ đầu tư đổi được |
| FB-R3-DOM-BA-G06 | Major | Done | `02` 13.3 gạch 4 thay nguyên văn (khách báo đến sau 22:00 + 5 bước nhận phòng ban đêm). Câu "Không giao mã trước khi xong giấy tờ…" nối vào bước 5 để danh sách không bị cắt khi dựng |
| FB-R3-DOM-BA-G07 | Major | Done | `01` 13 gạch 1 thay nguyên văn. Sửa theo: `01` 1.2 khung "Trước ngày chạy" (bỏ "ngoại lệ… kiểm VietQR", ghi đã làm 30/10, không tạo thêm đơn thử), `01` 14.2 gạch "Không tạo đơn thử…" |
| FB-R3-DOM-BA-G08 | Minor | Done | `04` 4.2 thêm ngoại lệ sự cố an toàn 5 bước nguyên văn; `04` 8.2 sửa gạch 1 nguyên văn. Câu xưng với khách bằng tiếng Anh: chưa có, để chú thích ẩn cho UXD (mục 7 câu 1) |
| FB-R3-DOM-BA-G09 | Minor | Done | `04` mục 2 thêm 2 dòng nguyên văn; `04` 10 thêm dòng 11:00 nguyên văn và dòng 09:00–18:00 |
| FB-R3-DOM-BA-G10 | Minor | Done | `04` 6 thay gạch cuối bằng 2 gạch nguyên văn (chốt đầu kỳ/cuối kỳ có ảnh; hiện không có khách dài hạn) |
| FB-R3-DOM-BA-G11 | Minor | Done | `02` 4.3 bước 2 và `05` 4.1 bước 2 thêm câu nguyên văn. `02` 17.1 (2) và `05` 8.1 sửa "12 h nếu hạn rơi trước 21:00; nếu không thì 24 h" |
| FB-R3-DOM-BA-G12 | Minor | Done | `02` 18: chuyển dòng mở quầy xuống dưới "Sáng (từ 08:00)", thêm "Trước 11:00", đổi "Trước 21:00" thành "Đóng quầy, muộn nhất 21:00" nguyên văn; dòng 23:00 thêm "Xong thì đăng xuất máy quầy". `01` 16 thêm 09:00, 21:00, 23:00 nguyên văn |
| FB-R3-DOM-BA-G13 | Minor | Done | `00` mục 5 thay gạch người trực bằng lộ trình ~5 giờ nguyên văn. `00` 2.1 bảng trỏ về lộ trình này. Thêm bài tập 10 vào `02` 20.3 cho người trực (cùng 3 bài DOM nêu + việc 22:00/23:00, nhận phòng sau 22:00) |
| FB-R3-DOM-BA-G14 | Minor | Done | Trả lời chung với SEC G04, UXD B1, B2 và bổ sung ORC (mục 5, nhóm A) |
| FB-R3-DOM-BA-G15 | Minor | Done | Chữ DOM "đang tắt tới khi chủ đầu tư báo bật" **đã cập nhật theo quyết định mới hơn** (INV chốt khung bật 31/10 07:00–08:30): "dự kiến bật sáng 31/10 … Chủ đầu tư báo khi đã bật". Ba gạch "Khi form bật" (07:00–22:00; 15 phút trong 08:00–21:00; ngoài giờ bấm **Nhận xử lý**, nhắn từ 08:00) chép nguyên văn vào khung "Tạm ở v1.0 (tới v1.0.1 có tin báo qua Google Chat)" ở `02` 13.1 và `05` 6.3. `00` mục 3 dòng `ottimo.vn` sửa tương ứng. Thêm mốc 07:00 vào `01` 16, `02` 18, việc báo người trực ở `01` 13 |
| FB-R3-DOM-BA-G16 | Suggestion | Done | Trả lời chung với SEC G06 (mục 5, nhóm B) |

## 3. Thẻ của SEC

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R3-SEC-BA-G01 | Major | Done | `01` 1.7 tách thành 2 dòng nguyên văn ("mất cả điện thoại lẫn mã" → thủ tục riêng; "quên mật khẩu" → chưa có cách khôi phục, trình quản lý mật khẩu, sai 2 lần thì dừng). Thêm câu chống lừa sau "Không ai…" nguyên văn. Xóa chú thích `BA-GUIDES S2`. Không ghi tên lệnh, máy chủ, câu xác minh. Thêm nhắc ở `01` 1.2 (lưu mật khẩu trong trình quản lý mật khẩu), `01` 1.4 (sai 2 lần thì dừng), bài tập `01` 18.2 số 1 |
| FB-R3-SEC-BA-G02 | Major | Done | `02` 1.2 thêm đoạn "Tài khoản có vai quản lý…" nguyên văn trước bước 1; bước 1 thêm "(tài khoản có vai quản lý: trên laptop riêng)". `01` 1.9 bước 7 thay nguyên văn. `00` 2.1 bảng người trực nhắc lần đầu không làm trên máy quầy |
| FB-R3-SEC-BA-G03 | Major | Done | `01` 1.7 dòng "Quản lý (người trực) mất cả điện thoại lẫn mã" nguyên văn. `01` 14.1 thay dòng cuối bằng 2 dòng nguyên văn (+ 1 dòng "bị khóa → Mở khóa" theo G05). `02` 1.7 dòng "Mất cả điện thoại lẫn mã" nguyên văn. Thêm cùng ý: `01` 1.9 gạch **Đặt lại mật khẩu** ("không gỡ khóa và không gỡ 2 bước"), `01` 17 |
| FB-R3-SEC-BA-G04 | Major | Done | Trả lời chung với DOM G14, UXD B1, B2 (mục 5, nhóm A) |
| FB-R3-SEC-BA-G05 | Minor | Done | Dòng "bị khóa do sai nhiều lần" thay nguyên văn ở `02` 1.7, `03` 1.5, `04` 1.5, `05` 1.6. `01` 1.9 gạch "Tạm khóa do sai mật khẩu" thay nguyên văn. Thêm **Mở khóa** vào `01` 14.1, 17 và bài tập `01` 18.2 số 6 |
| FB-R3-SEC-BA-G06 | Minor | Done | Trả lời chung với DOM G16 (mục 5, nhóm B) |
| FB-R3-SEC-BA-G07 | Minor | Done | Dòng in đậm đầu `01`–`05` thay nguyên văn (gộp UXD B6). `00` mục 5 thêm gạch "Gửi bộ hướng dẫn…" nguyên văn. `00` dòng cảnh báo thêm vế "không chuyển tiếp cho người ngoài OTTIMO". Thêm việc "gửi riêng từng người" vào `01` 13 |
| FB-R3-SEC-BA-G08 | Minor | Done | `screenshot-additions.md` G3-02: mô tả "…khi đang mở app nhân viên", cột che "**Che toàn bộ thanh địa chỉ**…". Rà 18 dòng G còn lại: không dòng nào khác ghi địa chỉ staging trong cột in ra; thêm quy tắc chung số 4 (mọi ảnh G che toàn bộ thanh địa chỉ hoặc cắt phần trang; cột "Màn hình" không ghi địa chỉ staging). Dựng lại: không tệp HTML nào còn chữ "staging" (đã kiểm) |
| FB-R3-SEC-BA-G09 | Suggestion | Done | `01` 14.2 thêm gạch giữ kín tên đăng nhập của chủ đầu tư nguyên văn |

## 4. Điểm của UXD (mục 5.2) và QA (mục 22.6)

### 4.1 UXD

| # | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| B1 | Major | Done | Trả lời chung nhóm A (mục 5). Tệp `your-id-details-tablet.html` có tên trong `02` 7.2 và `00` mục 4; cách mở (chạm một lần cho toàn màn hình, khóa vào tờ) theo chữ SEC |
| B2 | Minor | Done | `00` mục 4: "Bản in A4: `product/docs/print/pdf/to-4-your-id-details-a4.pdf`. Bản cho máy tính bảng: `guides/html/your-id-details-tablet.html`" + "chỉ chép riêng tệp này lên máy tính bảng" (SEC S1). Cùng đường dẫn A4 ở `01` 13 |
| B3 | Minor | Done | `screenshot-additions.md` G2-03: "Bản in A4 dọc của UXD (`to-4-your-id-details-a4.pdf`)". Nhãn ảnh G2-03 ở `02` 7.2 thêm "khổ A4" |
| B4 | Minor | Done | "Cách đọc" của `01`–`05` thay câu `[ẢNH: …]` bằng câu UXD nguyên văn. `00` mục 6 giữ cú pháp cho đội, thêm câu cho người đọc |
| B5 | Minor | Done | `05` 6.1: "nhắn tay trong 08:00–21:00 (câu giờ nhận phòng ở mục 3, câu chống giả danh ở mục 5.1)" |
| B6 | Suggestion | Done | Gộp vào SEC G07 ("Nghỉ việc hoặc hết hợp tác: xóa tệp trên máy và báo chủ đầu tư") |

### 4.2 QA

| # | Chỗ | Trạng thái mới | Ghi chú |
|---|---|---|---|
| 1 | `03` 1.2 bước A.5 | Done | "Desk mở trang **Buồng phòng**. Không cần làm gì thêm…" nguyên văn; thêm "Làm lại bước A mỗi lần chủ đầu tư Đặt lại mật khẩu". Chú thích `QA kiểm (BA-GUIDES Q2)` ở `03`, `04`, `01` 1.9 xóa (thay bằng chú thích ngắn ghi kết quả ở `03`, `04`); chú thích cùng loại ở `02` 1.8 cũng xóa, thay bằng câu cho người đọc |
| 2 | `03`, `04` mục 1.3 | Done | Thêm dòng "mạng yếu" vào bảng câu báo (buồng phòng: "Chưa tải được việc hôm nay…"; bảo trì: "Chưa tải được phiếu sửa…") |
| 3 | `04` 1.1, 1.3, 5; `01` 1.9 | Done | `04` dòng thiết bị đầu tệp, 1.1, 1.3 phần Desk, mục 2, mục 5 (khung "Tạm ở v1.0" + "Lễ tân hoặc người trực"), bài tập 5; `01` 1.9 bảng vai cột "Đăng nhập ở" của Bảo trì = "App nhân viên" + câu sau bảng; `00` mục 1 và 3 bỏ "bảo trì khi khóa phòng" |
| 4 | `04` 1.3 Desk bước 2 | Done | "Desk mở sẵn trang **Bảo trì** (menu: **Vận hành → Phiếu sửa**)…". Nhãn ảnh G4-01 → "menu Phiếu sửa" (cả `screenshot-additions.md`) |
| 5 | `04` 4.4 bước 3, 5 | Done | Chép nguyên văn đề nghị QA; bước 3 thêm "(quản lý thấy thêm **Hủy phiếu**)", bước 5 thêm nội dung hộp xác nhận và **Không, quay lại** |
| 6 | `02` 1.6, nhãn G2-02 | Done | Màn **Đổi mật khẩu**, 3 ô, **Lưu và vào ứng dụng**, **Quay lại**. Nhãn ảnh "Màn Đổi mật khẩu" (cả `screenshot-additions.md`) |
| 7 | `02` 1.4 | Done | "Gõ sai nhiều lần (5 lần liền)… (thường 15 phút) và nút **Đăng nhập** mờ" |
| 8 | `01` 1.7 (và `02` 1.7) | Done | Thêm "**Làm xong đăng ký lại ngay, không bỏ dở.**" ở cả hai tệp. Phần SEC xem (mã điện thoại cũ còn dùng được tới khi đăng ký lại hoặc đặt lại mật khẩu): đã có bước "báo chủ đầu tư để Đặt lại mật khẩu" ngay sau |
| 9 | `01` 1.9 Đặt lại mật khẩu | Done | Thêm "Desk hỏi **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)**" |
| 10 | `05` 6.2 | Done | Viết lại theo trang **Khách hàng**: gõ ≥ 2 ký tự vào **Tìm khách**, các cột kết quả, nút **Thêm khách** |
| 11 | `02` 17.1 (a) | Done | "(mặc định)" → "(cách nên dùng)" |
| 12 | `02` 17.2 | Không cần sửa | QA xác nhận khớp |
| BUG-R3-052 | "Tạm thời tới v1.0.1" | Done | Dòng mới ở `01` 15.6, `02` 17.6, `03` 12, `04` 9: đổi mật khẩu tạm trên Desk trước, cả sau mỗi lần Đặt lại mật khẩu. Thêm câu ở `01` 1.9, `02` 1.8 |
| BUG-R3-053 | "Tạm thời tới v1.0.1" | Done | Dòng mới ở `01` 15.6, `02` 17.6, `04` 9; khung "Tạm ở v1.0" ở `02` 13.4 và `04` 5; câu ở `01` 1.9, 18.1 |

## 5. Thẻ trùng – trả lời chung

**Nhóm A – Tờ "Your ID details": DOM G14, SEC G04, UXD B1, UXD B2, ORC (A4, 2 bản).** Done.
- `02` 7.2: thay "hai cách" bằng danh sách 3 bậc **nguyên văn SEC G04** (đã gồm chữ DOM G14: bản in A4 là chính theo INV 30/10; bản in dự phòng trong ngăn quầy; máy tính bảng của cơ sở chỉ khi đạt đủ điều kiện, tên tệp `your-id-details-tablet.html`, Truy cập được hướng dẫn / Ghim ứng dụng, Không làm phiền). Câu cuối "Không có bản in nào và không có máy đạt điều kiện: không nhận giấy tờ, gọi chủ đầu tư". Bỏ câu cũ "Không có tờ này ở quầy thì không nhận giấy tờ" ở đầu mục (lo ngại G14: một tờ giấy không làm dừng nhận phòng cả đêm). Xóa chú thích `BA-GUIDES S1`, thay bằng chú thích ghi căn cứ SEC S1.
- `00` mục 4: gạch 2 nguyên văn SEC; bản in A4 + đường dẫn (UXD B2); in 2 bản.
- `01` 13: "In **2 bản** … khổ A4 (một trong khung mica, một trong ngăn quầy)" + chuẩn bị máy tính bảng nguyên văn SEC + in lại trong ngày khi hỏng.
- `02` 19: dòng "Không có tờ…" đổi thành "Tờ hỏng hoặc mất → thay bằng bản dự phòng, ghi sổ giao ca". `02` mục 2 dòng mở quầy: kiểm tờ đúng chỗ (theo G03).
- Chữ nguyên văn của tờ trong `02` 7.2 **không đổi**; bộ dựng xác nhận khớp bản A4.

**Nhóm B – Gửi mã cọc khi sale ngoài quầy, CTV: DOM G16, SEC G06.** Done.
- Theo chữ SEC (chặt hơn và đã gồm đề xuất DOM): `05` 5.1 bước 3 thay nguyên văn (không đăng nhập Zalo OTTIMO trên máy cá nhân; ngoài quầy báo **chỉ mã đơn** cho người trực, không tự gửi), xóa chú thích `BA-GUIDES S3`; `05` 5.2 thêm gạch báo khách trước kèm **bản nháp câu EN/VI của SEC**; `05` 7.2 thêm gạch không nhận tiền cọc vào tài khoản mình; `02` 4.1 thêm gạch gửi mã thẳng cho khách của CTV, và gạch cách làm khi sale ngoài quầy nhờ gửi. `05` mục 2 dòng "Khi khách đồng ý" sửa theo.
- Câu EN/VI là bản nháp SEC, có chú thích ẩn "chờ UXD chốt". Nếu UXD đổi chữ, BA chép lại trước khi phát tệp.

**Nhóm C – Khôi phục tài khoản: SEC G01, G03, G05, QA dòng 8, 9.** Done, xem từng thẻ ở mục 3 và 4.2. Ba đường ghi thống nhất ở `01` 1.7, 1.9, 14.1, 17 và `02` 1.7: bị khóa → **Mở khóa**; quản lý mất cả điện thoại lẫn mã → khóa tài khoản cũ, tạo tài khoản mới; chủ đầu tư quên mật khẩu → chưa có đường khôi phục, phòng bằng trình quản lý mật khẩu và dừng sau 2 lần sai.

## 6. Kết quả dựng

`python3 -I product/design/tools/build_guides.py` – thoát 0, 30/10/2026 (sau lần sửa cuối):

| Tệp | Phần | Mục | Chỗ ảnh | Ảnh có / mã | Thiếu |
|---|---:|---:|---:|---:|---|
| `00-index.html` | 7 | 2 | 0 | – | – |
| `01-chu-dau-tu-quan-ly.html` | 18 | 42 | 34 | 33 / 34 | C1-15 |
| `02-le-tan.html` | 20 | 72 | 63 | 58 / 62 | G2-03, G2-05, G2-06, C2-34 |
| `03-buong-phong.html` | 15 | 11 | 12 | 11 / 12 | G3-02 |
| `04-bao-tri.html` | 12 | 11 | 13 | 12 / 12 | – |
| `05-sale-ctv.html` | 11 | 20 | 13 | 13 / 13 | – |
| `your-id-details-tablet.html` | – | – | – | – | 85 KB |

- **Ảnh: 127 / 133 mã có; thiếu 6** đúng như QA 22.5 (G2-05, G2-06 chụp sáng 31/10; G2-03 cần ảnh tờ in A4 thật ở quầy; G3-02 cần điện thoại thật; C1-15, C2-34 cần ca ESC-031). Bản dựng hiện mô tả chữ ở các chỗ này.
- Chữ tờ Your ID details trong `02` khớp nguyên văn bản A4 (8 đoạn + nhãn, tiêu đề, chân tờ).
- BA kiểm thêm: 0 liên kết `href` hỏng giữa các tệp; không tệp HTML nào có chữ "staging"; tệp lớn nhất `02` 4,75 MB (< 5 MB).
- Mục mới `02` **13.2a** dựng được, nhưng bộ dựng chỉ nhận số mục dạng `13.2`: thanh mục hiện "13.2a …" không có ô số, và chữ "mục 13.2a" nối tới mục 13.2 ngay phía trên. Đọc vẫn đúng; xem câu hỏi mở 2.
- HTML trong `product/docs/manual/guides/html/` không commit (theo giao việc).

## 7. Câu hỏi mở và việc cho vai khác (không chặn C3a)

1. **UXD:** (a) câu EN/VI kỹ thuật xưng khi gõ cửa (DOM G08) – `04` 4.2 hiện chỉ ghi tiếng Việt "xưng rõ là kỹ thuật OTTIMO", có chú thích ẩn; (b) chốt câu CTV báo khách mã cọc do OTTIMO gửi (SEC G06 / DOM G16) – bản nháp SEC đang in ở `05` 5.2.
2. **UXD (tùy chọn):** cho `build_guides.py` nhận số mục có chữ cái (`13.2a`) để thanh mục có số và liên kết "mục 13.2a" trỏ đúng. Không làm thì BA có thể đổi số thành 13.3 và dời 13.3, 13.4 – báo BA nếu muốn cách này (cần sửa các chỗ trỏ "mục 13.3" ở `02`).
3. **QA trước C3a:** (a) DOM D1 – trên Desk tập bấm **Làm xong** việc **Dọn trả phòng** thì căn `VD` → `VC` (điều kiện của `02` 13.2a; không đạt thì báo ORC, DOM sửa 13.2a); (b) SEC G05 – khóa tạm tài khoản tập → **Mở khóa** → đăng nhập được; (c) chụp G2-05, G2-06 sáng 31/10 và dọn OTM-00374/00375.
4. **ORC:** nếu form website **không** bật sáng 31/10, câu "dự kiến bật sáng 31/10" ở `00` 3, `01` 13, `02` 13.1, `05` 2 và 6.3 sẽ cũ – báo BA, sửa trong vài phút trước khi phát tệp.
5. **ORC/PO:** sổ tay `user-manual-v1.0.md` 1.5 nay chậm hơn bộ hướng dẫn 1.1 (13.2a, bảng việc mỗi ngày, rà mốc 3, khôi phục tài khoản, BUG-R3-052/053). BA đã ghi ở `00` mục 1 "khi khác nhau làm theo bộ hướng dẫn". Có cập nhật sổ tay lên 1.6 không: ORC quyết (không gấp trước C3a). `staff-one-pager.md`, `day-one-guide.md` vẫn nhắc in 4 tờ / A5 (PO, từ báo cáo trước).
6. **PO (sau v1.0.1, người review đã nêu):** DOM – chặn nút hủy của SAL/CTV khi đơn có tiền; ô "Khách báo hủy lúc" trong hộp hủy (nút "Khách không muốn dọn" trên Desk: hộp **Hủy việc** đã có 2 lý do tương đương, có thể bỏ khỏi danh sách). SEC – lệnh quản trị khôi phục tài khoản chủ đầu tư (Medium, đích tháng 11); nút **Đặt lại 2 bước** trên Desk (khi có, BA đổi `01` 1.7 và `02` 1.7 về "chủ đầu tư đặt lại 2 bước").

## 8. Giả định đã dùng

- `[GIẢ ĐỊNH BA]` Form website "dự kiến bật sáng 31/10" theo giao việc ORC và decision-log 30/10 (INV chốt khung 31/10 07:00–08:30). Tài liệu luôn kèm "chủ đầu tư báo khi đã bật", nên dùng được dù lịch lệch.
- Tên lựa chọn trong hộp **Hủy việc** (`02` 13.2a bước 5) lấy từ mã nguồn `main` (`HousekeepingPage.tsx`, `strings-vi.json`), chưa đối chiếu trên staging; QA xem lướt khi thử D1 (câu hỏi mở 3a).
- `[GIẢ ĐỊNH BA – trình bày]` Đánh số mục mới là **13.2a** (theo chữ DOM, để mọi chỗ trỏ "mục 13.2a" trong thẻ DOM giữ nguyên), không dời số mục khác.
- `[GIẢ ĐỊNH BA – trình bày]` Bản nháp câu EN/VI của SEC (G06) đưa vào tài liệu ngay để kịp C3a, có chú thích chờ UXD chốt.

## 9. Dòng decision-log đề xuất cho ORC

`| 2026-10-30 | 3 | **BA – Phản hồi review bộ hướng dẫn theo bộ phận** (`rounds/round-03/responses/BA-to-department-guides-reviews.md`): 31 thẻ (DOM 16, SEC 9, UXD 6) + QA 22.6 (11 dòng) + BUG-R3-052/053 – tất cả Done, 0 Major mở, 0 ESC. Bộ hướng dẫn lên bản 1.1: `02` 13.2a kiểm bằng mắt trước **Làm xong**; bảng việc mỗi ngày theo trình tự (đóng quầy ≤ 21:00, 22:00, 23:00 rồi đăng xuất); mốc 3 gồm giữ chỗ hết hạn trước 09:00 sáng mai, hạn giữ chỗ rơi 09:00–21:00; nhận phòng sau 22:00 đủ bước trên máy quầy; tờ Your ID details A4 × 2 bản, máy tính bảng chỉ dự phòng có điều kiện SEC; khôi phục tài khoản theo SEC S2; sale ngoài quầy không tự gửi mã cọc; form website dự kiến bật 31/10, Desk mở 07:00–22:00; lộ trình người trực ~5 giờ; tên nút theo QA; khi bộ hướng dẫn khác sổ tay 1.5 thì làm theo bộ hướng dẫn | BA | Quyền BA (trình bày, mức chi tiết); quy tắc lấy từ DOM D1–D4, SEC S1–S4, ORC/INV 30/10 |`
