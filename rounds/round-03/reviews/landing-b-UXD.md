# UXD review – Landing đợt 2 (concept B + ảnh đầu trang 4, 32, 9, 37, 16, 33)

- Round 3 · Bước: Review · Người review: UXD · Tác giả: FE-LP · Ngày: 24/10/2026
- Bản rà: commit `bd2d128`, nhánh `worktree-agent-acd94dae90abbce64`. Report `rounds/round-03/outputs/FE/landing-b.md`, 42 ảnh `landing-b-shots/`.
- Căn cứ: FB-INV-003 ý 2 (ảnh đầu trang thể hiện **công năng** và **góc rộng**), decision-log 24/10 "INV – ảnh đầu trang landing", brand guideline OTTIMO, review song song `landing-b-CPY.md` (CPY).
- Cách kiểm: xem 42 ảnh chụp; đọc `Hero.astro`, `Picture.astro`, `hero.ts`, `gallery.ts`, `landing.css`, `en.ts`, `vi.ts`; dựng lại khung cắt bằng `sharp` trên ảnh gốc `00-brief/context/landing/raw/` (cắt đúng phép `object-fit: cover` + `object-position`) cho 4 tỉ lệ khung (4/5, 1/1, 4/3, 3/2) và soát 20 ảnh chưa dùng trong bảng 45 ảnh. Không sửa mã, không commit mã.

## Kết luận nhanh

| # | Câu FE hỏi | Quyết định UXD | Thẻ |
|---|---|---|---|
| 1 | VI "Nghệ thuật lưu trú an yên." rớt chữ "yên." ở 390 px | Theo CPY: `Nghệ thuật [[lưu trú an yên.]]` → "Nghệ thuật / lưu trú an yên.". Thêm `text-wrap: balance` cho `.h2` và `text-wrap: pretty` cho đoạn dẫn | 04 |
| 2 | Khung 4/5 trên máy tính cắt mất máy giặt sấy (37) và tủ lạnh (33) | **Đổi khung ảnh đầu trang trên máy tính (≥ 1024 px) từ 4/5 sang 4/3**, kèm `object-position` riêng cho từng id. Điện thoại và máy tính bảng giữ nguyên | 01 |
| 3 | Ảnh 9 lặp ở đầu trang và Tiện nghi | **Đổi ảnh Tiện nghi** sang ảnh 30 (`phong-4/1.png`: máy giặt sấy, bàn ăn, bếp, tủ lạnh) | 02 |
| 4 | Thêm 37, 33 vào Signature, 16 vào Garden | UXD đề xuất **có** (Signature thêm 33, 37, 30 → đủ 6 ảnh). **INV quyết**, FE chuẩn bị sẵn nhưng chỉ áp khi INV đồng ý | 05 |
| – | Alt 3 ảnh mới | Theo CPY thẻ 03, 04; UXD bổ sung phần máy giặt sấy (37) và tủ lạnh (33) vì sau khi đổi khung 4/3 hai thứ này hiện ở mọi cỡ màn hình | 03 |
| – | Brand guideline | **Đạt**: màu chỉ trong bảng 80/15/5, đúng 3 họ chữ, không emoji, một nút đặc mỗi màn hình | – |

Không có Blocker. 1 Major (khung ảnh đầu trang), 3 Minor, 1 Suggestion. Không tạo ESC.

---

### FB-R3-UXD-FE-01
- Mức độ: Major
- Vị trí: `product/apps/landing-web/src/styles/landing.css` dòng 614–629 (`@media (min-width: 1024px)` → `.hero-media img { aspect-ratio: 4/5; … }`); `src/components/home/Hero.astro` dòng 41–49; ảnh `hero-1440-en-slide4…6.jpg`
- Vấn đề:
  - Khung 4/5 được thiết kế khi đầu trang chỉ có một ảnh mặt tiền (ảnh đứng). Nay 5/6 slide là ảnh ngang 3:2.
  - Đo thật ở 1440 × 900: khung 625 × 720 px (bị `max-height: 80svh` chặn, tỉ lệ thực 0,87). Ảnh ngang phóng theo chiều cao, rộng 1080 px, nên **chỉ còn 58% bề ngang ảnh**:
    - ảnh 37 mất máy giặt sấy (nằm ở 8–14% bề ngang);
    - ảnh 33 mất tủ lạnh (9–23%);
    - ảnh 16 mất góc TV và một phần sofa.
  - Ảnh ngang còn bị phóng to quá file: 1080 px CSS từ file 960 px (DPR1), 2160 px thiết bị từ file 1600 px (DPR2), nên mềm nét.
  - Đã thử dựng 4 tỉ lệ trên ảnh gốc:

    | Khung | Ảnh ngang còn | Ảnh mặt tiền (đứng) còn | Nhận xét |
    |---|---|---|---|
    | 4/5 (hiện tại) | 58% bề ngang | 76% chiều cao | Mất công năng ở 37, 33, 16 |
    | 1/1 | 67% | 66% | 37 vẫn mất máy giặt hoặc gối giường |
    | **4/3** | **89%** | **50%** | 37, 33, 16 đủ công năng; mặt tiền đủ 4 tầng ban công sáng đèn, biển OTTIMO, sảnh, bậc thềm (chỉ mất mái và trời) |
    | 3/2 | 100% | 44% | Mặt tiền mất tầng trên cùng hoặc mất sảnh + biển |

  - Chỉ đổi `object-position` mà giữ 4/5 thì không đủ: ảnh 37 cần thấy từ máy giặt (8%) tới gối giường (~93%), tức 85% bề ngang. Khung 4/5 chỉ cho 58%.
- Vì sao quan trọng: INV chọn lại ảnh (FB-INV-003) để khách thấy công năng và góc rộng. Trên máy tính, khung hiện tại cắt đúng những món công năng INV muốn khoe. Đây là điều INV thấy đầu tiên khi duyệt bản xem trước, trước khi phát hành tag `landing-v*`.
- Đề xuất sửa (áp ngay):
  1. `landing.css`, trong `@media (min-width: 1024px)` thay khối `.hero-media img` bằng:
     ```css
     .hero-media img {
       aspect-ratio: 4/3;
       max-height: none;
       object-position: 50% 50%;
     }
     /* Per-photo focus on the 4/3 desktop frame (UXD review landing-b 24/10). Ids without a rule stay centred. */
     .hero-media img.hero-img--hero-facade-dusk { object-position: 50% 60%; }      /* 4  – all balconies, sign, entrance */
     .hero-media img.hero-img--signature-dining { object-position: 50% 50%; }      /* 32 */
     .hero-media img.hero-img--detail-kitchen { object-position: 50% 50%; }        /* 9  */
     .hero-media img.hero-img--signature-bedroom-desk { object-position: 25% 50%; } /* 37 – washer-dryer in the hall + full bed */
     .hero-media img.hero-img--garden-navy-kitchen { object-position: 60% 50%; }   /* 16 – sofa + whole navy kitchen */
     .hero-media img.hero-img--signature-living-oak { object-position: 40% 50%; }  /* 33 – fridge + TV wall + corridor */
     ```
     Các rule này nằm trong `@media (min-width: 1024px)`, nên không đổi gì ở điện thoại (khung 4/5 + `max-height: 30svh`, mặt tiền giữ `50% 58%`) và máy tính bảng (khung 3/2).
  2. `Hero.astro`: truyền `imgClass={`hero-img hero-img--${id}`}` cho `<Picture>`. CSP `style-src 'self'` chặn `style=""`, nên không dùng style nội tuyến. Làm như mẫu `.op-x35` có sẵn.
  3. README mục "Đổi ảnh đầu trang": thêm một dòng. Ảnh mới không có rule thì nằm giữa khung 4/3 và chỉ mất 5,5% mỗi bên. Nếu ảnh mới là ảnh đứng thì báo UXD đặt `object-position`.
  4. Chụp lại `hero-1440-en-slide1…6`, thêm 1024 px slide 1 và 4 để UXD xác nhận.
- Ảnh hưởng hiệu năng (đã tính):
  - **CLS = 0.** Tỉ lệ khung cố định bằng CSS cho mọi slide, khung không đổi cỡ khi chuyển ảnh. `<img>` vẫn có `width`/`height`.
  - **LCP:** ảnh mặt tiền vẫn là phần tử lớn nhất (625 × 469 px so với khối chữ khoảng 440 × 480 px có nhiều khoảng trống). Phần tử LCP không đổi, preload không đổi.
  - **Byte: không đổi.** Ảnh vẫn chọn theo `sizes` cũ (640px) nên file tải về y như trước: mặt tiền 960 px AVIF q42 = 38,4 KB, vẫn ≤ 50 KB. Không cần nén thêm ảnh 4. Ảnh ngang hết bị phóng quá file: rộng hiển thị 703 px CSS, nằm trong file 960 (DPR1) và 1600 (DPR2), nên nét hơn.
  - Đầu trang trên máy tính thấp hơn (469 so với 720 px ở 1440). Mục The Stay ló lên trong màn hình đầu, có lợi cho việc khách cuộn tiếp. Khối chữ (≈ 480 px) và ảnh gần cao bằng nhau, giữ `align-items: center`.
- Trạng thái: Open

### FB-R3-UXD-FE-02
- Mức độ: Minor (làm cùng đợt với thẻ 01: FE đang chạy lại tool ảnh)
- Vị trí: `src/components/home/Amenities.astro` dòng 16–23 (`id="detail-kitchen"`, `imgClass="op-x35"`); `landing.css` dòng 562–564
- Vấn đề:
  - Ảnh 9 (`detail-kitchen`) xuất hiện hai lần: slide 3 đầu trang và ảnh cố định của mục Tiện nghi.
  - Thêm ảnh 32 (`signature-dining`) cũng lặp: slide 2 và ảnh bìa thẻ Signature. FE chưa nêu điểm này.
- Vì sao quan trọng: một ảnh lặp trên cùng một trang làm khách thấy nơi ở "ít hình", trái cảm giác boutique chỉn chu. Mục Tiện nghi là chỗ khách đọc chậm nhất, nên lặp ở đó dễ thấy nhất.
- Quy tắc UXD (ghi decision-log):
  - Ảnh **cố định mang tính biên tập** (The Stay, Tiện nghi, Vị trí) không trùng ảnh đầu trang.
  - **Ảnh bìa và thư viện hạng phòng** được trùng, vì đó là danh mục sản phẩm, còn đầu trang chỉ chạy qua 3 giây mỗi ảnh.
  - Theo quy tắc này, ảnh 32 ở thẻ Signature: **giữ**. Ảnh 9 ở Tiện nghi: **đổi**.
- Đề xuất sửa:
  1. Thêm ảnh **30** (bảng 45 ảnh) = `phong-4/1.png`, id **`signature-laundry-dining`**, vào `PHOTOS` của `optimize-images.mjs` (`type: 'Signature Two-Bedroom'`, `use: 'Amenities'`, AVIF q mặc định). Chạy `--only signature-laundry-dining --out …/src/assets/photos`. Ảnh có máy giặt sấy, bàn ăn, bếp gỗ, tủ lạnh, sofa, đúng ý "Live well" của mục. Không người, không số phòng, không cận khóa (SEC xác nhận lại theo checklist).
  2. `Amenities.astro`: `id="signature-laundry-dining"`, `alt={t.photoAlt['signature-laundry-dining']}`, `imgClass="op-x08"`.
  3. `landing.css`: thêm `.pic img.op-x08 { object-position: 8% 50%; }`. Ở khung 4/5 trên máy tính, giá trị này giữ trọn máy giặt sấy, bàn ăn và bếp. Điện thoại dùng khung 3/2 nên thấy cả ảnh. Bỏ `.op-x35` nếu không còn chỗ dùng.
  4. Alt (thêm vào `photoAlt` EN/VI và `manifest.json`; CPY đọc lại):
     - EN: `A washer and dryer beside a dining table and an oak kitchen`
     - VI: `Máy giặt sấy cạnh bàn ăn và gian bếp gỗ sồi`
  5. `detail-kitchen` vẫn ở đầu trang và thư viện Garden, không xóa file.
- Trạng thái: Open

### FB-R3-UXD-FE-03
- Mức độ: Minor
- Vị trí: `photoAlt` trong `src/content/en.ts` dòng 55–59, `vi.ts` cùng khóa, `manifest.json` (3 ảnh mới)
- Vấn đề:
  - UXD đồng ý với CPY thẻ 03 và 04: ảnh 37 tả sai vị trí bàn và trùng ý với `signature-bed`; ảnh 16 trùng cụm "Long navy kitchen" của Premium.
  - Sau thẻ 01 (khung 4/3, `object-position` riêng), máy giặt sấy ở ảnh 37 và tủ lạnh ở ảnh 33 **hiện ở mọi cỡ màn hình**: điện thoại khung ≈ 1,54 thấy gần trọn bề ngang, máy tính bảng 3/2 thấy trọn, máy tính 4/3 đã chỉnh vị trí. Nguyên tắc "alt chỉ tả phần còn thấy" của FE nay cho phép nhắc hai món công năng này, và đó là lý do INV chọn ảnh.
- Vì sao quan trọng: người dùng trình đọc màn hình cần nghe được công năng của ảnh như người nhìn thấy, đúng mục tiêu FB-INV-003. Test R3-Q52 kiểm alt khớp ảnh.
- Đề xuất sửa (bản cuối, áp đồng bộ `en.ts`, `vi.ts`, `manifest.json`; CPY đọc lại câu chữ):

  | id (số ảnh) | EN | VI |
  |---|---|---|
  | `signature-bedroom-desk` (37) | Bedroom with a writing desk, a built-in wardrobe and a raised bed, a washer and dryer in the hall beyond | Phòng ngủ với bàn làm việc, tủ áo âm tường và giường đặt trên bệ, máy giặt sấy ở hành lang bên ngoài |
  | `garden-navy-kitchen` (16) | Theo CPY: Navy and oak kitchen by a sofa corner, with tall windows over Da Lat | Theo CPY: Bếp navy và gỗ sồi cạnh góc sofa, cửa kính lớn nhìn ra Đà Lạt |
  | `signature-living-oak` (33) | Living room with an oak shelf wall, a TV, a cream sofa and a full-size fridge | Phòng khách với vách kệ gỗ sồi, TV, sofa màu kem và tủ lạnh cỡ lớn |
  | `hero-facade-dusk` (4) | Giữ | Giữ. Khung 4/3 vẫn thấy mọi ban công sáng đèn |

  - Nếu FE chưa áp thẻ 01 trong đợt này thì giữ alt 37/33 theo bản CPY, không nhắc máy giặt và tủ lạnh.
- Trạng thái: Open

### FB-R3-UXD-FE-04
- Mức độ: Minor
- Vị trí: `vi.ts` → `why.title` (dòng 85), `rooms.title`, `location.distances[2].place` (dòng 194); `Why.astro` dòng 25; `landing.css` (`.h2`, đoạn dẫn `.head p`, `.why-intro`); ảnh `why-390-vi.jpg`, `rooms-390-vi.jpg`, `rooms-1440-en.jpg`, `location-390-vi.jpg`
- Vấn đề: một số dòng cuối chỉ còn một chữ, hoặc tên riêng bị ngắt giữa chừng:
  - `why.title` VI ở 390 px: "Nghệ thuật lưu trú an / yên." (FE nêu, CPY thẻ 01).
  - `rooms.title` VI ở 390 px: "…của / bạn" (CPY thẻ 02).
  - `rooms.intro` EN ở 1440 px: "…two bedrooms for the whole / family." (UXD phát hiện).
  - Bảng đi xe VI ở 390 px: "Chợ Đà Lạt · Hồ Xuân / Hương", tên hồ bị ngắt đôi (UXD phát hiện).
- Vì sao quan trọng: tiêu đề và đoạn dẫn là chữ lớn, chỗ ngắt sai dễ thấy và làm trang kém chỉn chu.
- Quyết định UXD và cách sửa:
  1. **Theo CPY thẻ 01:** `why.title` VI = `Nghệ thuật [[lưu trú an yên.]]`. Kết quả "Nghệ thuật / lưu trú an yên.", cùng nhịp với bản EN. Không bọc `[[an yên.]]`. `Why.astro` render tiêu đề qua `<Rich>`.
  2. **Theo CPY thẻ 02:** `rooms.title` VI = `Chọn khung cửa sổ [[của bạn]]`, render qua `<Rich>`.
  3. `location.distances[2].place` VI = `Chợ Đà Lạt · [[Hồ Xuân Hương]]`, render ô tên qua `<Rich>`. EN tương ứng nếu cũng ngắt.
  4. Lớp chữa chung (tăng cường dần, trình duyệt cũ bỏ qua cũng không hỏng):
     ```css
     .h2 { text-wrap: balance; }
     .head p, .why-intro, .hero-text .lead { text-wrap: pretty; }
     ```
     Không áp cho H1 tagline. Ngắt dòng H1 hiện tại ở 390 và 1440 đã đẹp, giữ nguyên.
  5. Chụp lại `why-390-vi`, `rooms-390-vi`, `location-390-vi` ở 390 và 320 px, cùng `rooms-1440-en`.
- Trạng thái: Open

### FB-R3-UXD-FE-05
- Mức độ: Suggestion (INV quyết, FE chuẩn bị sẵn)
- Vị trí: `src/content/gallery.ts` → `ROOM_GALLERIES`
- Vấn đề: thư viện Signature mới có 3 ảnh, dưới mục tiêu `GALLERY_TARGET = 6`. Trong khi đó 3 ảnh của phòng Signature (`phong-4`) đã tối ưu xong: 37, 33 và ảnh 30 (thẻ 02). Ảnh 16 thuộc Garden Studio hướng navy (`phong-2`), cùng nhóm với `garden-navy`, `detail-laundry-desk`, `detail-balcony-sunset`.
- Vì sao quan trọng: khách xem thư viện để hình dung đủ công năng trước khi để lại yêu cầu. Signature là hạng giá cao nhất mà có ít ảnh nhất.
- Đề xuất UXD (bộ ảnh hạng phòng do INV định ở R3-Q52 22–23/10, nên chờ INV):

  | Hạng | Thứ tự đề xuất | Số ảnh |
  |---|---|---|
  | Signature | `signature-dining` (bìa, giữ) · `signature-living-oak` (33) · `signature-bedroom-desk` (37) · `signature-bed` · `signature-laundry-dining` (30) · `signature-bath` | 3 → 6 |
  | Garden | `garden-oak` (bìa, giữ) · `garden-navy` · `garden-navy-kitchen` (16) · `garden-balcony` · `detail-kitchen` · `detail-laundry-desk` · `detail-balcony-sunset` | 6 → 7 |

  - FE chuẩn bị sẵn thay đổi `gallery.ts` (một commit riêng, chưa gộp). Khi INV đồng ý thì gộp trước tag `landing-v*`. Nếu INV không trả lời thì giữ nguyên thư viện hiện tại, không chặn phát hành.
  - Nhãn "N photos" trên thẻ tự cập nhật theo độ dài mảng. Test `gallery.landing.spec.ts` nên đọc số ảnh từ `ROOM_GALLERIES`, không viết cứng.
- Trạng thái: Open

---

## Rà brand guideline OTTIMO (đạt)

| Hạng mục | Kết quả |
|---|---|
| Màu | `src/styles/*.css` + components: chỉ có Ivory #F4F0E8, Cream #EDE6D8, Stone Grey #6B6760, Ink #2B2B28, Light Oak #B08D57, Earth Brown #7A5C44, Sage #8A9079. Thêm token `--brand-white #ffffff` có từ trước (chữ nút đặc, nền ô nhập), không mới trong commit này. Rà lại ở đợt dọn token sau, không chặn. Commit `bd2d128` không thêm mã màu nào |
| Tỉ lệ 80/15/5 | Nền Ivory/Cream chiếm chủ đạo, Ink cho mục Vị trí; Earth Brown chỉ ở nút đặc + link chữ; Light Oak ở vạch nhãn và đường kẻ. Đạt |
| Chữ | Lora cho H1/H2/tên hạng, Be Vietnam Pro cho thân và UI. Không có chỗ cần JetBrains Mono trên trang này. Đạt |
| Emoji | Quét `en.ts`, `vi.ts`, `booking-strings.ts`: 0 |
| Hai link chữ mới | `why.more`, `location.ask` dùng kiểu `.link` có sẵn. Earth Brown trên Ivory 5,4:1 (trên Cream 4,9:1), Ivory trên Ink 12,5:1, đạt AA. Vẫn một nút đặc mỗi màn hình |
| Độ dài chữ theo khung | 320–1440 không tràn, không cuộn ngang (FE kiểm 54/54 E2E). Còn các dòng mồ côi ở thẻ 04. Thẻ phòng EN 1440 chênh 1 dòng (Garden 3, City 2) nhưng link "Ask about this room" thẳng hàng theo hàng lưới. Chấp nhận, không cần bản ngắn |
| Ảnh 4 (LCP) | AVIF q42 không thấy vệt nén ở cỡ hiển thị (xem ở 1440 và 390). Đạt |

## Điểm làm tốt (nên giữ)
1. `HERO_PICKS` một dòng, truy được từ số ảnh INV tới tệp gốc, có test chặn ảnh bị loại. Đổi ảnh về sau rất rẻ. Thẻ 01 chỉ thêm rule theo id, không phá cơ chế này.
2. FE giữ ngân sách byte bằng cách mã hóa riêng ảnh 4 ở q42, không nới ngân sách. FE cũng tự nêu đúng 3 điểm thiết kế cần UXD quyết, thay vì tự đổi.
3. Bắt được lỗi "[[1.4 m]]" đang chạy thật và thêm luật dist-check chặn tái diễn.
