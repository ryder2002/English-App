# Hướng dẫn Migration Database cho Folder Hierarchy

## Các bước đã thực hiện:

1. **Cập nhật Prisma Schema** - Đã thêm các trường:
   - `parentId` - ID của thư mục cha
   - Quan hệ `parent` và `children` cho folder hierarchy
   - Cập nhật unique constraint để cho phép cùng tên nhưng khác parent

2. **Chạy Migration**:
   ```bash
   npx prisma migrate dev --name add_folder_hierarchy
   ```

3. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

## Tính năng mới:

### 1. Thư mục phân cấp (Folder Hierarchy)
- Tạo thư mục con trong thư mục cha
- Hiển thị cây thư mục với khả năng mở rộng/thu gọn
- Di chuyển từ vựng cùng với thư mục

### 2. API Updates
- `POST /api/folders` - Thêm tham số `parentId` để tạo subfolder
- `PUT /api/folders/[id]` - Cập nhật tên folder
- `DELETE /api/folders/[id]` - Xóa folder và tất cả subfolders đệ quy

### 3. UI Components
- **FolderManagerWithHierarchy** - Component mới hiển thị cây thư mục
- Nút "Thêm thư mục con" trong menu dropdown
- Icon expand/collapse cho folders có children
- Màu sắc và indentation để phân biệt levels

### 4. Context Updates
- `addFolder(name, parentId?)` - Hỗ trợ tạo subfolder
- `removeFolder(folderId)` - Xóa theo ID thay vì name
- `updateFolder(folderId, newName)` - Cập nhật theo ID
- `buildFolderTree()` - Build cây thư mục từ flat list

## Cách sử dụng:

### Tạo thư mục mới:
1. Vào trang "Quản lý Thư mục"
2. Click "Tạo thư mục mới"
3. Nhập tên và submit

### Tạo thư mục con:
1. Click icon "..." trên thư mục cha
2. Chọn "Thêm thư mục con"
3. Nhập tên thư mục con

### Khi thêm từ vựng:
- Dropdown folder sẽ hiển thị tất cả folders (cả parent và children)
- Từ vựng được lưu theo tên folder
- Khi xóa folder cha, tất cả từ vựng trong folder con cũng bị xóa

## Lưu ý:
- Folder names phải unique trong cùng một parent
- Có thể có 2 folders cùng tên nếu khác parent
- Xóa folder cha sẽ xóa tất cả subfolders và từ vựng bên trong
- Vocabulary vẫn dùng tên folder (không phải ID) để dễ migration
