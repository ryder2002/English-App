# CN - Language Learning App

Ứng dụng học từ vựng tiếng Anh và tiếng Trung với AI, hỗ trợ đầy đủ các tính năng quản lý lớp học và bài kiểm tra.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng chính](#tính-năng-chính)
- [Cài đặt](#cài-đặt)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)

## 🎯 Tổng quan

CN - Language Learning App là một ứng dụng web hiện đại giúp người dùng học từ vựng tiếng Anh và tiếng Trung một cách hiệu quả. Ứng dụng tích hợp AI để tự động tạo thông tin từ vựng (IPA, Pinyin, nghĩa tiếng Việt), hỗ trợ học qua flashcards, bài kiểm tra tương tác, và quản lý lớp học.

### Đặc điểm nổi bật

- ✅ **AI-Powered**: Tự động tạo IPA, Pinyin, và nghĩa tiếng Việt cho từ vựng
- ✅ **PWA Support**: Có thể cài đặt như ứng dụng trên mobile và desktop
- ✅ **Real-time Quiz**: Bài kiểm tra theo dõi real-time với khả năng tạm dừng/tiếp tục
- ✅ **Class Management**: Quản lý lớp học, học viên, và bài kiểm tra
- ✅ **Excel Import**: Import hàng loạt từ vựng từ file Excel
- ✅ **Responsive Design**: Tối ưu cho mobile, tablet, và desktop
- ✅ **Dark Mode**: Hỗ trợ chế độ tối

## ✨ Tính năng chính

### 👤 Tính năng cho người dùng

#### 1. **Quản lý từ vựng**
- Thêm từ vựng thủ công hoặc nhập hàng loạt từ Excel
- AI tự động tạo IPA (cho tiếng Anh), Pinyin (cho tiếng Trung), và nghĩa tiếng Việt
- Tổ chức từ vựng vào các thư mục có cấu trúc phân cấp (thư mục con)
- Xem danh sách từ vựng với bộ lọc và tìm kiếm

#### 2. **Thư mục (Folders)**
- Tạo và quản lý thư mục để phân loại từ vựng
- Hỗ trợ thư mục con (hierarchy) để tổ chức tốt hơn
- Dễ dàng di chuyển từ vựng giữa các thư mục

#### 3. **Flashcards**
- Học từ vựng qua flashcards tương tác
- Hiển thị từ hoặc nghĩa, sau đó lật để xem đáp án
- Tự động phát âm từ vựng (Speech Synthesis API)

#### 4. **Bài kiểm tra (Tests)**
- Làm bài trắc nghiệm với từ vựng của chính bạn
- Chọn hướng dịch: Anh → Việt, Việt → Anh, hoặc ngẫu nhiên
- Có timer tự động (nếu admin bật)
- Hiển thị kết quả chi tiết sau khi hoàn thành

#### 5. **Lớp học (Classes)**
- Tham gia lớp học bằng mã lớp
- Xem danh sách lớp đã tham gia
- Tham gia bài kiểm tra do giáo viên tạo
- Làm bài kiểm tra real-time với cập nhật tiến độ ngay lập tức

#### 6. **Từ điển (Dictionary)**
- Tìm kiếm từ vựng trong bộ sưu tập của bạn
- Xem chi tiết từ vựng bao gồm IPA, Pinyin, loại từ, nghĩa

#### 7. **Trợ lý AI (Chatbot)**
- Hỏi đáp về ngữ pháp, từ vựng, và cách sử dụng
- Tích hợp Google Gemini AI
- Hỗ trợ đa ngôn ngữ

#### 8. **Cài đặt**
- Đổi mật khẩu
- Test âm thanh phát âm từ vựng
- Tùy chỉnh giọng đọc

### 👨‍💼 Tính năng cho Admin

#### 1. **Tổng quan (Dashboard)**
- Xem thống kê tổng quan: số lớp học, thư mục, từ vựng, bài kiểm tra
- Xem hoạt động gần đây
- Số lượng học viên trong các lớp

#### 2. **Quản lý lớp học**
- Tạo lớp học mới
- Quản lý thành viên trong lớp (thêm/xóa)
- Xem chi tiết lớp học
- Chỉnh sửa thông tin lớp

#### 3. **Quản lý thư mục và từ vựng**
- Tạo và quản lý thư mục
- Thêm từ vựng thủ công hoặc import từ Excel
- Xóa và chỉnh sửa từ vựng
- Admin có quyền xóa bất kỳ thư mục nào

#### 4. **Tạo và quản lý bài kiểm tra**
- Tạo bài kiểm tra mới cho lớp học
- Chọn thư mục từ vựng để làm đề thi
- Thiết lập:
  - Thời gian cho mỗi câu hỏi (0 = không giới hạn)
  - Hướng dịch: Anh → Việt, Việt → Anh, hoặc ngẫu nhiên
- Theo dõi real-time:
  - Xem tiến độ của từng học viên
  - Điểm số, số câu đúng/sai
  - Streak (số câu đúng liên tiếp)
  - Bảng xếp hạng
- Điều khiển bài kiểm tra:
  - **Tạm dừng/ Tiếp tục**: Tạm dừng bài kiểm tra, học viên không thể chọn đáp án
  - **Kết thúc**: Kết thúc bài kiểm tra và tự động nộp bài cho tất cả học viên

#### 5. **Cài đặt**
- Đổi mật khẩu
- Test âm thanh phát âm

## 🚀 Cài đặt

### Yêu cầu hệ thống

- **Node.js**: 18.x trở lên
- **npm** hoặc **yarn**
- **PostgreSQL**: Database server
- **Google AI API Key**: Để sử dụng tính năng AI

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd English-App
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Thiết lập Database

1. **Tạo database PostgreSQL**:
   ```sql
   CREATE DATABASE english_app;
   ```

2. **Thiết lập connection string** trong file `.env.local`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/english_app"
   ```

3. **Chạy migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

### Bước 4: Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục gốc với các biến sau:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/english_app"

# JWT Secret (tạo một chuỗi ngẫu nhiên)
NEXTAUTH_SECRET="your-secret-key-here"

# Google AI API Key
GEMINI_API_KEY="your-gemini-api-key"

# Resend API Key (cho email service)
RESEND_API_KEY="your-resend-api-key"
```

**Lấy API Keys:**
- **Google AI API**: Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Resend API**: Truy cập [Resend](https://resend.com) để lấy API key cho tính năng gửi email

### Bước 5: Tạo tài khoản Admin đầu tiên

Chạy script để tạo admin user:

```bash
npx tsx scripts/reset-database-and-create-admin.ts
```

Hoặc tạo thủ công qua trang `/create-account` (chọn role "admin").

### Bước 6: Chạy ứng dụng

#### Development mode:

1. **Terminal 1** - Chạy Next.js server:
   ```bash
   npm run dev
   ```

2. **Terminal 2** - Chạy Genkit AI server (nếu cần):
   ```bash
   npm run genkit:watch
   ```

Truy cập [http://localhost:3000](http://localhost:3000)

#### Production mode:

1. **Build ứng dụng**:
   ```bash
   npm run build
   ```

2. **Start server**:
   ```bash
   npm start
   ```

## 📖 Hướng dẫn sử dụng

### Dành cho người dùng

#### Đăng ký/Đăng nhập

1. Truy cập trang `/login` hoặc `/signup`
2. Đăng ký tài khoản mới hoặc đăng nhập với tài khoản có sẵn
3. Sau khi đăng nhập, bạn sẽ được chuyển đến trang từ vựng

#### Thêm từ vựng

**Cách 1: Thêm thủ công**
1. Vào trang **"Thêm từ vựng"** từ sidebar
2. Nhập từ vựng (có thể thêm từ đồng nghĩa với ký tự `=`, `-`, `:`, hoặc `|`)
   - Ví dụ: `hello = hi` → AI sẽ tạo nghĩa tiếng Việt
3. Chọn ngôn ngữ (English hoặc Chinese)
4. Chọn thư mục (có thể tạo thư mục mới)
5. AI sẽ tự động tạo IPA/Pinyin và nghĩa tiếng Việt
6. Nhấn **"Lưu"**

**Cách 2: Import từ Excel**
1. Vào trang **"Từ vựng của tôi"**
2. Nhấn nút **"Import từ Excel"**
3. Tải file mẫu để xem format
4. Điền dữ liệu theo format:
   - Cột A: **Từ** (word)
   - Cột B: **Ngôn ngữ** (english hoặc chinese)
   - Cột C: **Từ loại** (part of speech, tùy chọn)
   - Cột D: **Phát âm** (IPA hoặc Pinyin, tùy chọn)
   - Cột E: **Tiếng Việt** (vietnamese translation, tùy chọn)
5. Upload file và nhấn **"Import"**

#### Quản lý thư mục

1. Vào trang **"Thư mục"** từ sidebar
2. **Tạo thư mục mới**: Nhấn nút **"Tạo thư mục"**
3. **Tạo thư mục con**: Chọn thư mục cha, nhấn **"Tạo thư mục con"**
4. **Đổi tên**: Click vào tên thư mục để chỉnh sửa
5. **Xóa**: Nhấn nút xóa (⚠️ Sẽ xóa tất cả từ vựng trong thư mục)

#### Học với Flashcards

1. Vào trang **"Flashcards"** từ sidebar
2. Chọn thư mục từ vựng muốn học
3. Chọn hướng hiển thị:
   - **Từ → Nghĩa**: Hiển thị từ trước, lật để xem nghĩa
   - **Nghĩa → Từ**: Hiển thị nghĩa trước, lật để xem từ
4. Click vào card để lật
5. Nhấn **"Đúng"** hoặc **"Sai"** để đánh dấu
6. Nhấn **"Tiếp theo"** để chuyển sang từ tiếp theo

#### Làm bài kiểm tra

**Bài kiểm tra cá nhân:**
1. Vào trang **"Kiểm tra"** từ sidebar
2. Chọn thư mục từ vựng
3. Chọn hướng dịch
4. Nhấn **"Bắt đầu"**
5. Chọn đáp án cho mỗi câu hỏi
6. Xem kết quả sau khi hoàn thành

**Bài kiểm tra trong lớp học:**
1. Vào trang **"Lớp học"** từ sidebar
2. Tham gia lớp bằng mã lớp (nếu chưa tham gia)
3. Vào lớp học, xem danh sách bài kiểm tra
4. Nhấn **"Tham gia"** để làm bài
5. Chờ giáo viên bắt đầu bài kiểm tra
6. Làm bài real-time (có thể bị tạm dừng bởi giáo viên)
7. Xem kết quả sau khi hoàn thành

#### Tham gia lớp học

1. Vào trang **"Lớp học"** từ sidebar
2. Nhấn **"Tham gia lớp học"**
3. Nhập **Mã lớp học** do giáo viên cung cấp
4. Nhấn **"Tham gia"**
5. Xem danh sách lớp đã tham gia và các bài kiểm tra

#### Sử dụng Chatbot AI

1. Vào trang **"Trợ lý AI"** từ sidebar
2. Nhập câu hỏi về ngữ pháp, từ vựng, hoặc cách sử dụng
3. AI sẽ trả lời và giải thích chi tiết
4. Ví dụ câu hỏi:
   - "Cách sử dụng từ 'appreciate'?"
   - "Sự khác biệt giữa 'bring' và 'take'?"
   - "Dịch câu 'Tôi thích học tiếng Anh' sang tiếng Anh"

#### Cài đặt

1. Vào trang **"Cài đặt"** từ sidebar
2. **Đổi mật khẩu**:
   - Nhập mật khẩu hiện tại
   - Nhập mật khẩu mới (tối thiểu 6 ký tự)
   - Nhấn **"Đổi mật khẩu"**
3. **Test âm thanh**:
   - Chọn giọng đọc (nếu có nhiều giọng)
   - Nhấn **"Phát thử"** để nghe phát âm

### Dành cho Admin

#### Truy cập Admin Panel

1. Đăng nhập với tài khoản có role **"admin"**
2. Truy cập `/admin` hoặc click vào **"Admin"** từ menu

#### Tạo lớp học

1. Vào **"Lớp học"** trong admin panel
2. Nhấn **"Tạo lớp học mới"**
3. Điền thông tin:
   - Tên lớp
   - Mô tả (tùy chọn)
4. Nhấn **"Tạo"**
5. Chia sẻ **Mã lớp học** cho học viên

#### Tạo bài kiểm tra

1. Vào **"Kiểm tra"** trong admin panel
2. Nhấn **"Tạo bài kiểm tra mới"**
3. Chọn lớp học
4. Điền thông tin:
   - Tiêu đề bài kiểm tra
   - Mô tả
   - Chọn thư mục từ vựng
   - Thời gian mỗi câu hỏi (0 = không giới hạn)
   - Hướng dịch
5. Nhấn **"Tạo"**
6. Bài kiểm tra sẽ có trạng thái **"Pending"** cho đến khi bạn bắt đầu

#### Bắt đầu và quản lý bài kiểm tra

1. Vào bài kiểm tra từ danh sách
2. Nhấn **"Bắt đầu"** để bắt đầu bài kiểm tra
3. Trong màn hình monitoring:
   - Xem tổng số học viên, số người đã hoàn thành, đang làm
   - Xem tiến độ real-time của từng học viên:
     - Điểm số hiện tại
     - Số câu đúng/sai
     - Streak (số câu đúng liên tiếp)
     - Tiến độ chi tiết
   - Xem bảng xếp hạng (sau khi có người nộp bài)
4. **Tạm dừng bài kiểm tra**:
   - Nhấn **"⏸️ Tạm dừng"** → Học viên không thể chọn đáp án
   - Nhấn **"▶️ Tiếp tục"** để cho phép tiếp tục làm bài
5. **Kết thúc bài kiểm tra**:
   - Nhấn **"🛑 Kết thúc bài kiểm tra"**
   - Xác nhận → Tất cả học viên sẽ bị nộp bài tự động
6. **Xem chi tiết kết quả**:
   - Click **"Xem"** để xem chi tiết từng câu trả lời của học viên

#### Import từ vựng hàng loạt (Admin)

1. Vào **"Thêm từ vựng"** trong admin panel
2. Chọn tab **"Import từ Excel"**
3. Tải file mẫu và điền theo format
4. Upload file và nhấn **"Import"**
5. Từ vựng sẽ được thêm vào thư mục đã chọn

## 📁 Cấu trúc dự án

```
English-App/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static files
│   ├── BG.png                 # PWA icon
│   └── manifest.json          # PWA manifest
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── admin/             # Admin pages
│   │   ├── api/               # API routes
│   │   ├── classes/           # Class management
│   │   ├── quizzes/           # Quiz pages
│   │   └── ...                # Other pages
│   ├── components/            # React components
│   │   ├── ui/                # UI components (shadcn/ui)
│   │   └── ...                # Feature components
│   ├── contexts/              # React contexts
│   ├── lib/                   # Utilities and services
│   │   ├── services/          # Business logic services
│   │   └── prisma.ts          # Prisma client
│   └── ai/                    # AI flows (Genkit)
├── scripts/                   # Utility scripts
├── .env.local                 # Environment variables (not in git)
├── package.json
└── README.md
```

## 🛠 Công nghệ sử dụng

### Frontend
- **Next.js 15**: React framework với App Router
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI component library
- **Radix UI**: Accessible component primitives
- **React Hook Form + Zod**: Form validation
- **SWR**: Data fetching và caching

### Backend
- **Next.js API Routes**: Server-side API
- **PostgreSQL**: Database
- **Prisma ORM**: Database client
- **JWT**: Authentication
- **bcryptjs**: Password hashing

### AI & Services
- **Google Gemini AI**: Chatbot và vocabulary generation
- **Genkit**: AI flow framework
- **Resend**: Email service
- **Speech Synthesis API**: Text-to-speech

### PWA
- **next-pwa**: Progressive Web App support
- **Service Worker**: Offline support

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **Prisma Studio**: Database GUI

## 📝 Scripts có sẵn

```bash
# Development
npm run dev              # Chạy Next.js dev server
npm run genkit:dev       # Chạy Genkit AI server
npm run genkit:watch     # Chạy Genkit với auto-reload

# Build
npm run build            # Build production
npm start               # Chạy production server

# Database
npm run db:migrate      # Chạy Prisma migrations
npm run db:generate     # Generate Prisma Client
npm run db:studio       # Mở Prisma Studio

# Code quality
npm run lint            # Chạy ESLint
npm run typecheck       # TypeScript type checking
```

## 🔒 Bảo mật

- Passwords được hash bằng bcryptjs
- JWT tokens với httpOnly cookies cho admin
- Role-based access control (RBAC)
- Input validation với Zod
- SQL injection protection với Prisma ORM

## 📱 PWA Features

Ứng dụng hỗ trợ PWA và có thể được cài đặt trên:
- **Mobile**: Android và iOS (qua browser)
- **Desktop**: Windows, macOS, Linux

**Cài đặt:**
- Mobile: Mở trong browser → Menu → "Add to Home Screen"
- Desktop: Click icon "Install" trong browser address bar

## 🤝 Đóng góp

Nếu bạn muốn đóng góp cho dự án:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Dự án này là private project.

## 📞 Hỗ trợ

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trong repository.

---

**Happy Learning! 🎓**
