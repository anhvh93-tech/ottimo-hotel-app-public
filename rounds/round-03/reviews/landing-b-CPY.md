# CPY đọc lại landing concept B đã lên (FE-LP `bd2d128`)

- Người review: CPY | Round 3 – bước Review ("CPY đọc lại bản đã lên") | Ngày: 24/10/2026
- Bản rà: worktree `.claude/worktrees/agent-acd94dae90abbce64/`, commit `bd2d128`.
  - `product/apps/landing-web/src/content/{en,vi,hero,gallery}.ts`, `src/scripts/booking-strings.ts`;
  - `src/assets/photos/manifest.json` (alt 3 ảnh mới);
  - `rounds/round-03/outputs/FE/landing-b.md`, ảnh chụp `landing-b-shots/`;
  - chữ hiển thị của `dist/index.html` và `dist/vi/index.html` (bản build kèm commit).
- So với bản chốt: `rounds/round-03/outputs/CPY/landing-copy-review.md` (repo chính).
- CPY không sửa mã, không commit.

## Kết luận

**Đạt, kèm 4 Minor và 2 Suggestion. Không có Blocker hay Major.**

| Hạng mục | Kết quả |
|---|---|
| Câu chốt mục 1–10 và 8.2, EN + VI | Áp đúng từng khóa, không thiếu, không sai chữ. Hai khóa mới `why.more`, `location.ask` có trên trang |
| Khóa "Giữ" (mục 13) | Không bị đụng. Câu pháp lý SEC, câu chống giả danh, câu tiền cọc vẫn giữ "OTTIMO" |
| Từ cấm ở thân trang | Quét chữ hiển thị và alt của `dist` EN + VI: **0 lần** cho small hotel, hotel, khách sạn, phụ thu, căn hộ, căn, dịch vụ, serviced, apartment, công tơ, meter, open soon, sắp mở, Standard, `[[ ]]`, dấu "!" |
| Meta description | Khớp bản chốt (EN 150 / VI 140 ký tự) |
| Tên hạng | City Studio · Garden Studio · Premium One-Bedroom · Signature Two-Bedroom. VI: Studio hướng phố · Studio hướng vườn · Premium một phòng ngủ · Signature hai phòng ngủ |
| Alt 3 ảnh mới | Đúng giọng brand: ngắn, điềm tĩnh, không emoji, không "căn" hay "apartment", không nhắc số phòng. Có 2 alt cần sửa: một câu tả sai vị trí, một câu trùng ý (thẻ 03, 04) |
| Điểm FE nêu: VI `why.title` rớt chữ ở 390 px | **Giữ câu.** Chỉ đổi chỗ ngắt dòng (thẻ 01). Thêm một tiêu đề khác cũng rớt chữ mà FE chưa nêu (thẻ 02) |

---

### FB-R3-CPY-FE-01
- Mức độ: Minor
- Vị trí: `src/content/vi.ts` → `why.title`; `src/components/home/Why.astro` dòng 25 (`<h2>` in chữ thô); ảnh `landing-b-shots/why-390-vi.jpg`
- Vấn đề: ở 390 px, "Nghệ thuật lưu trú an / yên." bị ngắt đôi cụm "an yên", dòng hai chỉ còn một chữ. Đây là câu chủ đề của concept B.
- Vì sao quan trọng:
  - Câu ý tưởng chính bị ngắt sai làm mất nhịp đọc trên điện thoại, nơi phần lớn khách xem trang.
  - Dòng chỉ còn một chữ trông cẩu thả, trái tinh thần "small things done right".
- Đề xuất sửa:
  - **Không đổi câu.** "Nghệ thuật lưu trú an yên." là bản VI của câu chủ đề, và tiêu đề Tiện nghi "Lưu trú an yên, từ những chi tiết nhỏ." lặp lại nó.
  - Giữ "lưu trú an yên" thành một cụm không ngắt:

    | | Chữ |
    |---|---|
    | VI `why.title` | `Nghệ thuật [[lưu trú an yên.]]` |
    | Hiển thị ở 390 px | "Nghệ thuật / lưu trú an yên." |
    | EN `why.title` | Giữ "The art of staying well." |

  - Cách ngắt này giống nhịp của bản EN ("The art of / staying well."). Ở 320 px, cụm này ngắn hơn dòng đầu hiện tại nên vẫn vừa khung. Trên máy tính, câu vẫn nằm trên một dòng.
  - FE cho `why.title` (và `rooms.title`, xem thẻ 02) render qua `<Rich>`, như đã làm cho mô tả phòng.
  - Không chọn bọc `[[an yên.]]`: cách đó cho ra "Nghệ thuật lưu trú / an yên." – ngắt giữa động từ và ý chính.
  - Nếu UXD muốn chữa chung cho mọi tiêu đề, có thể thêm `text-wrap: balance` cho `.h2`. Vẫn nên giữ `[[ ]]` để chắc chỗ ngắt, vì Safari cũ không hỗ trợ thuộc tính này. UXD quyết.
- Trạng thái: Open

### FB-R3-CPY-FE-02
- Mức độ: Minor
- Vị trí: `src/content/vi.ts` → `rooms.title`; ảnh `landing-b-shots/rooms-390-vi.jpg`
- Vấn đề: lỗi giống thẻ 01, FE chưa nêu. Ở 390 px tiêu đề hiện "Chọn khung cửa sổ của / bạn", dòng hai chỉ còn một chữ "bạn".
- Vì sao quan trọng: đây là tiêu đề mục Phòng nghỉ, mục khách xem lâu nhất trước khi để lại yêu cầu.
- Đề xuất sửa:

  | | Chữ |
  |---|---|
  | VI `rooms.title` | `Chọn khung cửa sổ [[của bạn]]` |
  | Hiển thị ở 390 px | "Chọn khung cửa sổ / của bạn" |
  | EN `rooms.title` | Giữ "Choose your window" |

  - Cần render `rooms.title` qua `<Rich>` (như thẻ 01).
  - FE chụp lại `why-390-vi`, `rooms-390-vi` và bản 320 px để UXD xác nhận.
- Trạng thái: Open

### FB-R3-CPY-FE-03
- Mức độ: Minor
- Vị trí: `photoAlt['signature-bedroom-desk']` trong `en.ts`, `vi.ts` và `alt` của mục đó trong `manifest.json` (ảnh 37, slide 4)
- Vấn đề:
  - **Tả sai vị trí:** câu "a desk by the window" không đúng. Trong ảnh (`hero-1440-en-slide4.jpg`, `hero-390-en-slide4.jpg`), bàn kê sát tường bên, còn cửa sổ nằm sau đầu giường.
  - **Trùng ý:** câu mở "Bedroom with a white bed on an oak platform" gần trùng alt `signature-bed` ở mục The Stay ("A crisp white double bed on an oak platform, beside a window"). Người dùng trình đọc màn hình sẽ nghe hai câu gần như giống nhau trên cùng trang.
  - **Lệch chữ VI:** bản VI ghi "bệ gỗ", trong khi các alt khác ghi "bệ gỗ sồi".
- Vì sao quan trọng: alt phải tả đúng ảnh (a11y, test R3-Q52). Ảnh 37 được chọn để cho thấy góc làm việc, nên alt nên nói về góc làm việc.
- Đề xuất sửa:

  | | Chữ |
  |---|---|
  | EN | Bedroom with a writing desk, a built-in wardrobe and a raised bed |
  | VI | Phòng ngủ với bàn làm việc, tủ áo âm tường và giường đặt trên bệ |

  - Sửa cả ba chỗ để manifest và `photoAlt` khớp nhau.
- Trạng thái: Open

### FB-R3-CPY-FE-04
- Mức độ: Minor
- Vị trí: `photoAlt['garden-navy-kitchen']` trong `en.ts`, `vi.ts` và `manifest.json` (ảnh 16 – Garden Studio, slide 5)
- Vấn đề:
  - **Trùng ý với hạng khác:** "Long navy kitchen" trùng gần nguyên văn alt `premium-kitchen` ("Long navy kitchen opening onto…"). "Gian bếp navy dài" là nét riêng của Premium trong `rooms.items[2].desc`. Dùng cùng cụm cho ảnh Garden Studio làm khách khó phân biệt hai hạng.
  - **Sót nét đẹp nhất của ảnh:** "tall glass doors" tả đúng, nhưng bỏ qua khung nhìn ra phố đồi, chỗ đẹp nhất của ảnh. Bếp trong ảnh có mặt tủ navy và tủ trên gỗ sồi.
- Vì sao quan trọng:
  - Alt cần đúng ảnh và không làm mờ khác biệt giữa các hạng phòng.
  - Ảnh này được chọn để cho thấy "phòng nhỏ hơn vẫn đủ đầy" (concept 7.2).
- Đề xuất sửa:

  | | Chữ |
  |---|---|
  | EN | Navy and oak kitchen by a sofa corner, with tall windows over Da Lat |
  | VI | Bếp navy và gỗ sồi cạnh góc sofa, cửa kính lớn nhìn ra Đà Lạt |

  - Sửa cả ba chỗ.
- Trạng thái: Open

### FB-R3-CPY-FE-05
- Mức độ: Minor
- Vị trí: `src/scripts/booking-strings.ts` → `BOOKING_STRINGS.vi.notReady`, dòng 160–164 (chỉ hiện khi form tạm dừng)
- Vấn đề: câu này vẫn xưng "OTTIMO" hai lần ("Vui lòng nhắn OTTIMO qua …", "OTTIMO sẽ trả lời sớm nhất có thể."), trái quyết định INV 24/10: VI xưng "chúng tôi", chỉ câu chống giả danh và câu tiền cọc giữ "OTTIMO". **Đây là chỗ bản chốt CPY bỏ sót, FE không làm sai:** mục 8.2 của bản chốt không liệt kê khóa `notReady`.
- Vì sao quan trọng: khi form bật, đây là câu khách đọc lúc gặp trục trặc. Nếu cách xưng đổi giữa chừng, giọng văn mất nhất quán ở đúng lúc khách cần được trấn an.
- Đề xuất sửa:

  | Ngôn ngữ | Chữ |
  |---|---|
  | VI | `['Yêu cầu trực tuyến đang tạm dừng. Vui lòng nhắn chúng tôi qua ', ' hoặc gọi ', '. Chúng tôi sẽ trả lời sớm nhất có thể.']` |
  | EN | Giữ nguyên |

  - Nên thêm `notReady` vào test "VI không có OTTIMO" mà FE vừa viết.
- Trạng thái: Open

### FB-R3-CPY-FE-06
- Mức độ: Suggestion
- Vị trí: `photoAlt.lobby` trong `en.ts`, `vi.ts` và `manifest.json`
- Vấn đề: alt vẫn ghi "a coffee counter" / "quầy cà phê" (FE nêu ở report mục 7.5). Ảnh này đã rời đầu trang và hiện không hiển thị ở đâu, nhưng nếu đưa lại lên trang thì alt sẽ hứa một tiện ích OTTIMO không cung cấp (bản chốt mục 14: không quầy cà phê).
- Vì sao quan trọng: sửa ngay bây giờ thì sau này không cần nhớ lại chỗ này.
- Đề xuất sửa:

  | | Chữ |
  |---|---|
  | EN | Ground-floor lobby with an oak reception desk |
  | VI | Sảnh tầng trệt với quầy lễ tân gỗ sồi |

- Trạng thái: Open

### FB-R3-CPY-FE-07
- Mức độ: Suggestion
- Vị trí: `vi.ts` → `book.steps[2].text`; ảnh `landing-b-shots/book-390-vi.jpg`
- Vấn đề: ở 390 px, chữ "QR." rớt xuống dòng cuối một mình ("…qua mã / QR.").
- Vì sao quan trọng: lỗi nhỏ ở phần thân chữ, nhưng nằm ngay câu tiền cọc, câu khách đọc kỹ nhất.
- Đề xuất sửa:

  | | Chữ |
  |---|---|
  | VI | `Khi bạn ưng báo giá, OTTIMO giữ phòng cho bạn sau khi nhận cọc 30% qua [[mã QR]].` |
  | EN | Giữ nguyên |

  - Không đổi ý, vẫn giữ "OTTIMO" và "30%", nên test số liệu vẫn qua.
- Trạng thái: Open

---

## Ghi chú (không phải lỗi, không cần sửa)
- Alt `signature-living-oak` (ảnh 33) đạt, giữ nguyên: "Living room with an oak shelf wall, a TV and a cream sofa by the window" / "Phòng khách với vách kệ gỗ sồi, TV và sofa màu kem cạnh cửa sổ".
- Alt `hero-facade-dusk` vẫn đúng với ảnh 4 mới (mặt tiền lúc chạng vạng, ban công sáng đèn).
- H1 trên trang VI vẫn là câu EN "A refined stay inspired by the calm spirit of Dalat." Đây là tagline thương hiệu trong `site.json`, bản chốt mục 13 đã quyết giữ. Ghi lại để QA không báo nhầm là lỗi.
- Alt cũ trong `manifest.json` (`signature-bed`, `garden-navy`) khác chữ với `photoAlt` đang hiển thị. Trang dùng `photoAlt` nên khách không bị ảnh hưởng. FE có thể đồng bộ khi rảnh.
- Ảnh 9 lặp ở đầu trang và mục Tiện nghi, ảnh ngang bị cắt trong khung 4/5: thuộc UXD, CPY không góp ý chữ.

## Điểm làm tốt (nên giữ)
1. Câu chữ áp đúng từng khóa của bản chốt, EN và VI. Các câu pháp lý và câu chống giả danh không bị đụng.
2. FE tự phát hiện và sửa lỗi "[[1.4 m]]" in thô trên ottimo.vn. FE còn thêm luật dist-check chặn dấu `[[ ]]` lọt ra trang, và test VI không có/có "OTTIMO" đúng chỗ. Hai lớp chặn này bảo vệ giọng văn lâu dài.
3. Alt mới chỉ tả phần còn thấy trong khung cắt (không nhắc máy giặt, tủ lạnh bị cắt mất), đúng nguyên tắc "không hứa điều khách không thấy".
