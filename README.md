# RYDER - Trợ lý học ngôn ngữ

Đây là một ứng dụng học từ vựng được xây dựng với Next.js, Firebase và Google AI (Genkit).

## Bắt đầu

Dưới đây là hướng dẫn để bạn có thể tải về và chạy dự án này trên máy tính của mình.

### 1. Yêu cầu cần có

- [Node.js](https://nodejs.org/) (phiên bản 18.x trở lên)
- [npm](https://www.npmjs.com/) (thường được cài đặt cùng với Node.js)

### 2. Thiết lập Khóa API

Các tính năng AI của ứng dụng (tạo từ vựng, chatbot...) sử dụng API Google Gemini. Bạn cần cung cấp khóa API của mình.

1.  **Lấy khóa API:**
    - Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey).
    - Nhấn "Create API key" để tạo một khóa mới.

2.  **Tạo tệp môi trường:**
    - Trong thư mục gốc của dự án, tạo một tệp mới có tên là `.env.local`.
    - Thêm nội dung sau vào tệp `.env.local`, thay `YOUR_API_KEY` bằng khóa bạn vừa tạo:

    ```
    GEMINI_API_KEY=YOUR_API_KEY
    ```

### 3. Cài đặt các thư viện cần thiết

Mở terminal trong thư mục gốc của dự án và chạy lệnh sau để cài đặt tất cả các thư viện đã được định nghĩa trong `package.json`:

```bash
npm install
```

### 4. Chạy ứng dụng

Ứng dụng này cần hai tiến trình chạy song song trong lúc phát triển:

- **Máy chủ Next.js:** Dành cho giao diện người dùng.
- **Máy chủ Genkit:** Dành cho các tác vụ AI.

Bạn nên mở hai cửa sổ terminal riêng biệt:

1.  **Trong terminal thứ nhất,** khởi động máy chủ Next.js:

    ```bash
    npm run dev
    ```

    Sau đó, mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

2.  **Trong terminal thứ hai,** khởi động máy chủ Genkit:

    ```bash
    npm run genkit:watch
    ```

    Lệnh này sẽ theo dõi các thay đổi trong các tệp flow AI và tự động cập nhật.

Bây giờ bạn đã sẵn sàng để khám phá và phát triển ứng dụng! Chúc bạn thành công!
