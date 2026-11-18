# SEC review – PR OPS #193 `r5-ops-pw-deps-cache` (tiếp #192: kiểm hash `.deb`, restore-keys, chỉ lưu trên main)

- Round 5 – bước Review (chuỗi cung ứng, TM-48). Người review: SEC. Tác giả: OPS.
- Phiên bản đã đọc: head `7c31b1ae` (`gh pr diff 193`). Base là main, đã có #192 (merged 18/11).

## Kết luận

**APPROVE.** Thẻ FB-R5-SEC-OPS-192-01 và 192-02 đã đóng. Không có thẻ Blocker, Major hay Minor mới; chỉ có 2 ghi chú dạng Suggestion.

## Xác minh thẻ của #192

| Thẻ | Trạng thái SEC | Bằng chứng |
|---|---|---|
| 192-01 (Minor) – kiểm hash trước `dpkg -i` | **Closed** | Kiểm lần lượt từng `.deb`: lấy `Package`/`Version`/`Architecture` bằng `dpkg-deb -f` (không sudo), rồi tra `apt-cache show "$pkg:$arch=$ver"`. Gói được cài khi `sha256sum` của nó khớp một trong các giá trị `SHA256` của index. Hỏng, không có trong index hoặc lệch hash → xóa. Chỉ mảng `verified[]` được đưa vào `dpkg -i`. |
| 192-02 (Suggestion) – chỉ lưu cache trên main | **Closed** | Bước save chỉ còn ở `docker-build`, với `if: github.ref == 'refs/heads/main' && cache-hit != 'true' && saved == 'true'`. Job landing không còn bước save. `saved=true` chỉ được ghi sau khi `install-deps` trên mạng thành công. |

## Câu hỏi 1: phép kiểm hash có chắc không?

**Nguồn index: chắc.**
- `apt-cache show` chỉ đọc `/var/lib/apt/lists` có sẵn trên runner. Trước bước đối chiếu, job không chạy `apt-get update` và không đổi nguồn apt. Đổi mirror chỉ diễn ra ở bước 3, sau bước đối chiếu.
- Các file index này đã được apt kiểm chữ ký `InRelease` lúc tạo runner image (apt không lưu index khi chữ ký sai). Mức tin cậy vì vậy bằng mức tin cậy runner image, vốn đã được tin.
- Index và các gói trong cache nằm ở hai chỗ khác nhau: cache chỉ giải nén vào `${{ runner.temp }}/pw-apt`. Kẻ ghi được cache không vì thế mà sửa được index.

**Gói không có trong index bị loại: đúng.**
- `want` rỗng (không có phiên bản hoặc kiến trúc đó) → `[ -n "$want" ]` sai → gói bị xóa. Phép kiểm vì vậy đóng khi thiếu dữ liệu.
- Hệ quả của restore-keys: gói của image cũ hoặc mới hơn có phiên bản lệch index hiện tại thì bị loại, rồi tải lại qua mạng. Đây là hành vi đúng.

**Các điểm khác đã kiểm:**
- `pkg`, `ver`, `arch` đọc từ control của gói, có thể do kẻ tấn công kiểm soát nếu cache bị đầu độc. Tuy vậy chúng luôn được đặt trong ngoặc kép và truyền nguyên một đối số cho `apt-cache`, không đi qua `eval` hay `bash -c`.
- `grep -qx "$have"` so khớp nguyên dòng với chuỗi hex của `sha256sum`, nên không có rủi ro chèn mẫu.
- Không có khoảng hở TOCTOU thực tế: file được kiểm và file được cài là cùng đường dẫn trong `runner.temp` của một VM dùng một lần, không có tiến trình nào khác ghi vào giữa hai bước.
- `--refuse-downgrade` và `--skip-same-version` vẫn giữ.
- Nếu chỉ có một phần gói được xác minh, bước `deps_present` (`apt-get install -s`) sẽ thấy còn thiếu, và phần còn lại được tải qua mạng có kiểm chữ ký.

**Thay đổi phụ:**
- Bỏ `sudo apt-get clean`, nên `save_cache` có thể chép cả `.deb` có sẵn trong `/var/cache/apt/archives` của image. Các gói này đến từ image hoặc đã được apt kiểm lúc tải, và đằng nào cũng bị đối chiếu lại ở lần restore sau. Chấp nhận.
- File tải dở nằm ở `archives/partial/`, không khớp glob `*.deb`, nên không bị lưu.

## Câu hỏi 2: restore-keys có kéo cache của PR vào main không?

**Không.**
- `restore-keys` chỉ so prefix trong các scope mà lần chạy đó được phép đọc. Lần chạy trên main chỉ đọc scope main; lần chạy PR đọc scope của PR rồi tới scope base (main). Prefix khớp không mở rộng thêm scope.
- PR không còn ghi cache `.deb`, nên sẽ không có cache `pw-apt-*` mới trong scope PR.
- Cache cũ `refs/pull/190/merge …-chromium` (do #192 ghi) dùng định dạng key cũ `pw-apt-<OS>-<ImageVer>-<PW>-chromium`. Prefix mới là `pw-apt-<OS>-<PW>-`, nên ngay trong PR đó cache cũ cũng không còn khớp. Trên main thì cache này vốn đã không đọc được.
- Kể cả nếu một cache lạ được restore, mọi `.deb` vẫn phải khớp index có chữ ký (câu 1). Phép kiểm hash là lớp bảo vệ thứ hai, độc lập với phạm vi cache.

## Khác

- Thời gian: mỗi mirror 8 phút, bước deps 18, job landing 35, docker giữ 45; `Acquire::http(s)::Timeout 30`, `Retries 3`. Bước lỗi thì job đỏ, không bỏ test. Không ảnh hưởng bảo mật.
- Không có action mới. `actions/cache/restore` và `actions/cache/save` vẫn ghim SHA `55cc8345…` (v6.1.0).

## Ghi chú (Suggestion, không cần thẻ phản hồi bắt buộc)

- S1 – hiệu quả, không phải bảo mật: với gói `Architecture: all`, cú pháp `apt-cache show "pkg:all=ver"` có thể không trả bản ghi trên một số phiên bản apt. Khi đó gói bị loại (vẫn đóng an toàn) và tải lại, làm giảm tỉ lệ dùng cache. OPS xem dòng log `verified / dropped` sau lần chạy đầu trên main. Nếu `dropped` cao với gói `all`, thử tra `"$pkg=$ver"` khi `arch=all`.
- S2: nếu sau này có job chạy `apt-get update` trước `playwright-deps.sh`, index sẽ là bản vừa tải. Bản đó vẫn được apt kiểm chữ ký nên vẫn an toàn, nhưng nên giữ thứ tự hiện tại và ghi chú điều này trong script.

## Điểm làm tốt

- Sửa đúng cả hai thẻ của #192, và phép kiểm đóng an toàn khi thiếu dữ liệu: không có index hay hash không khớp thì gói không được cài.
- Chỉ ghi cache từ main và chỉ sau khi cài thành công, nên nguồn cache rõ ràng.
- Mô tả PR giải thích rõ vì sao cache không khớp, kèm số liệu cài lạnh (105 MB / 181 gói).

- **Delta `cc795cb7` (18/11):** vẫn **APPROVE**, không thêm ranh giới tin cậy nào. Bước "Browsers the E2E suite launches" chỉ chạy `playwright test --list` trên code của chính repo. `n` được lọc qua regex chỉ nhận chữ số và chỉ dùng để so sánh số. `list` và `key` chỉ nhận một trong hai giá trị viết cứng (`chromium` / `chromium webkit`), nên `${{ steps.browsers.outputs.* }}` đưa vào `run:` không tạo đường chèn lệnh. Không có action hay nguồn tải mới, phép kiểm hash `.deb` và quy tắc chỉ lưu cache trên main giữ nguyên. Nếu `--list` lỗi (bị `|| true` nuốt) thì webkit không được cài; khi đó test `mobile-webkit` sẽ lỗi lúc mở trình duyệt chứ không đỗ giả. Đây là vấn đề chất lượng CI, không phải bảo mật.
