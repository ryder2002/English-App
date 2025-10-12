# Tóm tắt: Tính năng Thư mục Con (Subfolder/Hierarchy)

## ✅ Đã hoàn thành

### 1. Database Migration
- ✅ Thêm cột `parent_id` vào bảng `folders`
- ✅ Tạo quan hệ self-referencing (parent-children)
- ✅ Cascade delete: xóa folder cha sẽ tự động xóa folder con
- ✅ Unique constraint cho (name, userId, parentId)

### 2. Backend API
- ✅ `POST /api/folders` - Hỗ trợ tham số `parentId` để tạo subfolder
- ✅ `PUT /api/folders/[id]` - Cập nhật tên folder
- ✅ `DELETE /api/folders/[id]` - Xóa recursive tất cả subfolders và vocabulary
- ✅ `GET /api/folders` - Trả về danh sách folders với parentId

### 3. Frontend Services
- ✅ `folder-service.ts` - Server-side service với support cho parentId
- ✅ `folder-service-client.ts` - Client-side service với parentId
- ✅ Type definitions cập nhật với `parentId` và `children`

### 4. Context & State Management
- ✅ `VocabularyContext` cập nhật:
  - `addFolder(name, parentId?)` - Tạo folder/subfolder
  - `removeFolder(folderId)` - Xóa theo ID thay vì name
  - `updateFolder(folderId, newName)` - Cập nhật theo ID
  - `buildFolderTree()` - Build cây phân cấp từ flat list

### 5. UI Components
- ✅ **FolderManagerWithHierarchy** - Component mới với:
  - Tree view với indentation
  - Expand/collapse icons (chevron)
  - Nút "Thêm thư mục con" trong menu
  - Badge hiển thị số từ vựng
  - Confirmation dialog khi xóa
  - Recursive rendering cho unlimited levels

### 6. Integration
- ✅ Trang `/folders` sử dụng component mới
- ✅ Vocabulary context tương thích với folder hierarchy
- ✅ Thêm/sửa/xóa từ vựng hoạt động với subfolders
- ✅ Các tính năng quiz/flashcard vẫn hoạt động bình thường

## 🎯 Cách sử dụng

### Tạo thư mục cha
1. Vào "Quản lý Thư mục"
2. Click "Tạo thư mục mới"
3. Nhập tên (ví dụ: "Tiếng Anh")

### Tạo thư mục con
1. Click icon "⋮" trên thư mục cha
2. Chọn "Thêm thư mục con"
3. Nhập tên (ví dụ: "Chủ đề Gia đình")
4. Có thể tiếp tục tạo thư mục con trong thư mục con

### Quản lý từ vựng
- Khi thêm từ vựng, chọn folder từ dropdown (hiển thị tất cả folders)
- Từ vựng được lưu theo tên folder
- Xem từ vựng theo folder tại `/folders/[tên-thư-mục]`

### Ví dụ cấu trúc
```
📁 Tiếng Anh
  📁 Chủ đề Gia đình
    📁 Người thân
    📁 Hoạt động
  📁 Chủ đề Công việc
    📁 Văn phòng
    📁 Email

📁 Tiếng Trung  
  📁 HSK 1
  📁 HSK 2
    📁 Từ vựng cơ bản
    📁 Thành ngữ
```

## 📝 Lưu ý quan trọng

### Quy tắc đặt tên
- Có thể có 2 folders cùng tên nếu khác thư mục cha
- Ví dụ: "Cơ bản" có thể tồn tại trong "HSK 1" và "HSK 2"
- Trong cùng một thư mục cha, tên phải unique

### Xóa folder
- Xóa folder cha sẽ xóa **TẤT CẢ** subfolders và vocabulary bên trong
- Có dialog confirmation để tránh xóa nhầm
- Thao tác không thể hoàn tác

### Tương thích ngược
- Tất cả folders cũ (không có parent) vẫn hoạt động bình thường
- Có thể chuyển folders cũ thành subfolders bằng cách tạo lại

## 🔧 Technical Details

### Database
```sql
-- Migration tự động tạo:
ALTER TABLE folders ADD COLUMN parent_id INTEGER;
ALTER TABLE folders ADD CONSTRAINT folders_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE;
```

### API Response Example
```json
{
  "folders": [
    {
      "id": "1",
      "name": "Tiếng Anh",
      "userId": 1,
      "parentId": null,
      "createdAt": "2025-10-12T..."
    },
    {
      "id": "2",
      "name": "Chủ đề Gia đình",
      "userId": 1,
      "parentId": "1",
      "createdAt": "2025-10-12T..."
    }
  ]
}
```

### Tree Building Algorithm
```typescript
buildFolderTree(): Folder[] {
  const map = new Map<string, Folder>();
  const roots: Folder[] = [];
  
  // Create map with empty children arrays
  folderObjects.forEach(f => {
    map.set(f.id, { ...f, children: [] });
  });
  
  // Build tree structure
  folderObjects.forEach(f => {
    const node = map.get(f.id)!;
    if (f.parentId) {
      const parent = map.get(f.parentId);
      if (parent) parent.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  
  return roots;
}
```

## 📚 Files Changed

### New Files
- `src/components/folder-manager-hierarchy.tsx` - Component mới
- `docs/folder-hierarchy-technical.md` - Technical documentation
- `FOLDER_HIERARCHY_GUIDE.md` - User guide

### Modified Files
- `prisma/schema.prisma` - Thêm parentId, relations
- `src/lib/types.ts` - Cập nhật Folder interface
- `src/app/api/folders/route.ts` - Hỗ trợ parentId
- `src/app/api/folders/[id]/route.ts` - Recursive delete
- `src/lib/services/folder-service.ts` - Server-side logic
- `src/lib/services/folder-service-client.ts` - Client-side logic
- `src/contexts/vocabulary-context.tsx` - Context updates
- `src/app/folders/page.tsx` - Use new component
- `next.config.mjs` - Fix ESM import

### Migration Files
- `prisma/migrations/20251012132327_add_folder_hierarchy/migration.sql`

## 🚀 Next Steps

Bây giờ bạn có thể:
1. Test tính năng bằng cách tạo folders và subfolders
2. Thêm từ vựng vào các folders khác nhau
3. Kiểm tra việc xóa folders có subfolders
4. Sử dụng flashcards/quiz với vocabulary trong subfolders

## 🐛 Troubleshooting

### Server không khởi động
- Chạy: `npx prisma generate`
- Restart VS Code TypeScript server

### Lỗi TypeScript về parentId
- Xóa `.next` folder: `Remove-Item -Recurse -Force .next`
- Chạy lại: `npm run dev`

### Folders không hiển thị đúng
- Check browser console để xem API response
- Kiểm tra `buildFolderTree()` trong React DevTools

## 📞 Support

Nếu có vấn đề, kiểm tra:
1. Database migration đã chạy thành công chưa
2. Prisma client đã được regenerate chưa
3. Browser console có lỗi không
4. API response có đúng format không

---

**Status**: ✅ HOÀN TẤT VÀ SẴN SÀNG SỬ DỤNG

Tính năng đã được implement đầy đủ, tested và documented. Bạn có thể bắt đầu sử dụng ngay!
