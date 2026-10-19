# Content Replacement Checklist (CONTENT_TODO.md)

Tất cả các nội dung dưới đây hiện đang dùng giá trị mặc định hoặc placeholder trung tính, không chứa thông tin riêng tư. Khi triển khai thật cho người nhận, bạn hãy chỉnh sửa trong file [content/content.ts](file:///Users/hosynguyen/anniversary-web-app-design/content/content.ts) hoặc đặt các file ảnh/video vào thư mục `public/`.

---

### 1. Cổng bí mật (Gate)
- **Ngày mở khóa:** Mặc định là `20/10/2025` (được lưu dưới dạng mã băm SHA-256 có muối trong `content.gate.answerHash` và `content.gate.salt`).
- **Gợi ý sau 3 lần sai:** `content.gate.hint` (mặc định: *"Gợi ý: đó là một ngày của tháng Mười"*).
- *Cách đổi ngày:* Chỉnh sửa `targetDate` trong [scripts/make-hash.mjs](file:///Users/hosynguyen/anniversary-web-app-design/scripts/make-hash.mjs), chạy `node scripts/make-hash.mjs`, rồi dán kết quả `salt` & `answerHash` vào `content.gate`.

### 2. Bộ đếm ngày (Counter)
- **Ngày bắt đầu tính:** `content.counter.startDate` (mặc định: `2025-10-20T00:00:00+07:00`, múi giờ Việt Nam UTC+7).

### 3. Thước phim nhỏ (Video)
- **Quy trình chuẩn bị video tự động:**
  1. Đặt video kỷ niệm gốc vào thư mục: `video-source/original.mp4` (thư mục này đã nằm trong `.gitignore`, không lo bị commit lên repo).
  2. Chạy lệnh: `pnpm run video:prepare`
     - Tự động nén và chuẩn hóa sang `public/media/intro.mp4` (H.264, yuv420p, AAC 128k, faststart, cạnh dài <= 1280, giới hạn <= 30MB).
     - Tự động trích xuất khung hình poster tại 3s sang `public/media/intro-poster.webp`.
     - Xuất thông số `public/media/intro.json` (kích thước, tỷ lệ, thời lượng).
  3. Cấu hình đường dẫn trong [content/content.ts](file:///Users/hosynguyen/anniversary-web-app-design/content/content.ts): đổi `content.video.src = '/media/intro.mp4'` (hoặc truyền qua biến môi trường `NEXT_PUBLIC_VIDEO_URL` nếu lưu trữ trên cloud / S3 / R2).
- **Cơ chế dự phòng:** Nếu `content.video.src` là `null` hoặc file gặp lỗi 404, màn hình sẽ hiển thị giao diện polaroid mờ *"Đang chuẩn bị"* và tự động mở nút *"Tiếp tục"* sau 1.5s, đảm bảo người nhận không bao giờ bị kẹt lại.

### 4. Câu hỏi tương tác (Quiz)
- **Phản hồi câu 2:** `content.quiz.questions[1].reactionText` (mặc định: *"Anh ghi lại rồi nhé."*).
- **Phản hồi câu 3:** `content.quiz.questions[2].reactionText` (mặc định: *"Anh luôn yêu thương và ủng hộ em."*).

### 5. Dòng thời gian (Timeline)
- **Mục 1 (20.10.2025):** `content.timeline.items[0].body` - câu chuyện ngày đầu tiên.
- **Mục 2:** `content.timeline.items[1]` - ngày, tiêu đề và nội dung kỷ niệm số 2.
- **Mục 3:** `content.timeline.items[2]` - ngày, tiêu đề và nội dung chuyến đi/kỷ niệm số 3.
- **Mục 4 (Hôm nay):** `content.timeline.items[3].body` - lời nhắn gửi cho chặng đường tiếp theo.
- *(Tùy chọn)* Thêm thuộc tính `image: '/media/timeline/...'` cho từng mục nếu muốn hiển thị ảnh kỷ niệm.

### 6. Sách lật thư tay (Flipbook)
- **Quy trình chuẩn bị nội dung Flipbook (4 bước):**
  1. **Đặt file nguồn:** Đặt file PDF gộp 15 trang vào `flipbook-source/pages.pdf` (hoặc giữ 15 file ảnh WebP sẵn có trong `public/media/flipbook/p01.webp` ... `p15.webp`). Lưu ý: Thư mục `flipbook-source/` đã được gitignore để không commit file PDF nặng vào repo.
  2. **Chạy pipeline tự động:** Chạy lệnh:
     ```bash
     pnpm flipbook:build
     ```
     Pipeline sẽ tự động trích xuất các trang từ PDF, nén tối ưu sang định dạng WebP (dung lượng <= 180 KB mỗi ảnh, chiều dài tối đa 1400px), sinh ảnh blur siêu nhỏ và cập nhật `content/flipbook.manifest.json`.
  3. **Tùy chỉnh thông điệp:** Điền nội dung trong file `content/content.ts` (mục `flipbook`):
     - `coverTitle`: Tựa bìa sách (mặc định: *"Một năm của mình"*).
     - `backTitle`: Tựa bìa sau (mặc định: *"Hẹn năm sau"*).
     - `notesText`: Lời nhắn gửi riêng ở trang ghi chú (trang 17) (mặc định: để trống `""`).
  4. **Kiểm tra trải nghiệm:** Chạy `pnpm dev` và lật thử qua toàn bộ 18 trang trên điện thoại thật (hoặc chế độ Responsive 390x844).

### 7. Lời kết & Phản hồi (Finale)
- **Tiêu đề popup gửi lại:** `content.finale.sheetTitle` (mặc định: *"Gửi lại cho anh"*).
- **Placeholder ô nhập:** `content.finale.sheetPlaceholder` (mặc định: *"Em muốn nói gì với anh?"*).
