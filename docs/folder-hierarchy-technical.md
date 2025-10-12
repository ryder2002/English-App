# Tính năng Thư mục Con (Subfolder) - Tài liệu Kỹ thuật

## Tổng quan
Hệ thống đã được nâng cấp để hỗ trợ thư mục phân cấp (hierarchical folders). Người dùng có thể tạo thư mục con trong thư mục cha, giúp tổ chức từ vựng theo chủ đề một cách chi tiết hơn.

## Ví dụ Cấu trúc
```
📁 Tiếng Anh
  📁 Chủ đề Gia đình
    📁 Người thân
    📁 Hoạt động gia đình
  📁 Chủ đề Công việc
    📁 Văn phòng
    📁 Cuộc họp
📁 Tiếng Trung
  📁 HSK 1
  📁 HSK 2
```

## Thay đổi Database

### Schema Updates
```prisma
model Folder {
  id        Int      @id @default(autoincrement())
  name      String
  userId    Int      @map("user_id")
  parentId  Int?     @map("parent_id")  // NEW: Reference to parent folder
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent   Folder?  @relation("FolderHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children Folder[] @relation("FolderHierarchy")

  @@unique([name, userId, parentId])  // CHANGED: Allow same name in different parents
  @@map("folders")
}
```

### Migration
Migration tự động tạo cột `parent_id` và thiết lập cascade delete để khi xóa folder cha, tất cả folder con cũng bị xóa.

## Thay đổi API

### POST /api/folders
**Trước:**
```json
{
  "name": "Tiếng Anh"
}
```

**Sau:**
```json
{
  "name": "Chủ đề Gia đình",
  "parentId": "123"  // Optional: ID của thư mục cha
}
```

**Response:**
```json
{
  "folder": {
    "id": "456",
    "name": "Chủ đề Gia đình",
    "userId": 1,
    "parentId": "123",
    "createdAt": "2025-10-12T..."
  }
}
```

### PUT /api/folders/[id]
Cập nhật tên folder (không thay đổi parent)

**Request:**
```json
{
  "name": "Tên mới"
}
```

### DELETE /api/folders/[id]
Xóa folder và TẤT CẢ subfolders + vocabulary bên trong (recursive)

## Thay đổi Frontend

### Vocabulary Context
**Thêm methods mới:**
```typescript
interface VocabularyContextType {
  // ... existing
  buildFolderTree: () => Folder[];  // Build hierarchical tree
  addFolder: (name: string, parentId?: string | null) => Promise<boolean>;
  removeFolder: (folderId: string) => Promise<void>;  // Changed from name to ID
  updateFolder: (folderId: string, newName: string) => Promise<boolean>;  // Changed signature
}
```

**buildFolderTree()**: Chuyển đổi danh sách flat folders thành cây phân cấp
```typescript
const folderTree = buildFolderTree();
// Returns: Folder[] with children populated
```

### Components

#### FolderManagerWithHierarchy
Component mới thay thế FolderManager cũ:

**Tính năng:**
- ✅ Hiển thị cây thư mục với indentation
- ✅ Icon mở rộng/thu gọn (chevron) cho folders có children
- ✅ Menu dropdown với option "Thêm thư mục con"
- ✅ Badge hiển thị số từ vựng trong mỗi folder
- ✅ Xóa folder sẽ xóa tất cả subfolders (với confirmation dialog)

**Props cho FolderTreeNode:**
```typescript
interface FolderTreeNodeProps {
  folder: Folder;
  vocabulary: any[];
  onEdit: (folderId: string, currentName: string) => void;
  onDelete: (folderId: string, folderName: string) => void;
  onAddSubfolder: (parentId: string) => void;
  level?: number;  // Indentation level
  // ... other props
}
```

### Type Updates

```typescript
// src/lib/types.ts
export interface Folder {
  id: string;
  name: string;
  userId: number;
  parentId: string | null;  // NEW
  createdAt: string;
  children?: Folder[];       // NEW: For tree structure
}
```

## Tích hợp với Vocabulary

### Thêm từ vựng
- Dropdown folder hiển thị TẤT CẢ folders (parent + children)
- Từ vựng được lưu với tên folder (không phải ID)
- Ví dụ: Folder "Người thân" trong "Chủ đề Gia đình" vẫn có tên unique "Người thân"

### Kiểm tra từ vựng
- Flashcards, Multiple Choice, Quiz vẫn hoạt động bình thường
- Có thể chọn folder để luyện tập
- Từ vựng trong subfolders được group theo tên folder

## Testing Checklist

### Folder Operations
- [ ] Tạo folder root (không có parent)
- [ ] Tạo subfolder trong folder root
- [ ] Tạo subfolder level 3+ (nested deep)
- [ ] Đổi tên folder
- [ ] Xóa folder không có children
- [ ] Xóa folder có children (kiểm tra cascade)
- [ ] Tạo 2 folders cùng tên nhưng khác parent

### Vocabulary Operations
- [ ] Thêm từ vào folder root
- [ ] Thêm từ vào subfolder
- [ ] Xem danh sách từ theo folder
- [ ] Chuyển từ giữa các folders
- [ ] Xóa folder chứa từ vựng

### UI/UX
- [ ] Tree rendering đúng với indentation
- [ ] Expand/collapse hoạt động
- [ ] Badge số từ vựng hiển thị đúng
- [ ] Loading states khi tạo/xóa/sửa
- [ ] Error handling khi tên trùng
- [ ] Confirmation dialog khi xóa

## Migration Guide cho Dữ liệu Cũ

Tất cả folders hiện tại sẽ có `parentId = null` (root folders). Không cần migration data.

Nếu muốn chuyển folders cũ thành hierarchy:
1. Xác định folder nào sẽ là parent
2. Sử dụng API PUT để cập nhật hoặc tạo lại với parentId

## Performance Considerations

### Database
- Index trên `parent_id` để query nhanh
- CASCADE delete tự động xử lý cleanup
- Unique constraint ngăn duplicate names trong cùng parent

### Frontend
- `buildFolderTree()` chỉ chạy khi folderObjects thay đổi
- Tree rendering với React keys để optimize re-renders
- Lazy expansion của subfolders (chỉ render khi expanded)

## Future Enhancements

### Có thể thêm:
1. **Drag & Drop** - Kéo thả folder để thay đổi parent
2. **Breadcrumbs** - Hiển thị path từ root đến folder hiện tại
3. **Folder Color/Icon** - Customize màu sắc, icon cho folders
4. **Move Vocabulary** - Di chuyển từ vựng giữa các folders
5. **Folder Stats** - Thống kê từ vựng trong folder + subfolders
6. **Search in Folder** - Tìm kiếm trong folder và tất cả subfolders

## Troubleshooting

### Lỗi: "Folder already exists"
- Kiểm tra xem có folder cùng tên trong cùng parent không
- Có thể tạo folder cùng tên nếu khác parent

### Vocabulary không hiển thị sau khi tạo subfolder
- Vocabulary vẫn sử dụng tên folder, không phải ID
- Kiểm tra tên folder có chính xác không

### TypeScript errors về parentId
- Chạy `npx prisma generate` để regenerate types
- Restart TypeScript server trong VS Code (Ctrl+Shift+P > "TypeScript: Restart TS Server")

## API Examples

### Tạo folder hierarchy
```javascript
// 1. Tạo folder cha
const parent = await fetch('/api/folders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ name: 'Tiếng Anh' })
});
const parentData = await parent.json();

// 2. Tạo subfolder
const child = await fetch('/api/folders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ 
    name: 'Chủ đề Gia đình',
    parentId: parentData.folder.id 
  })
});
```

### Lấy tất cả folders và build tree
```javascript
const response = await fetch('/api/folders', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { folders } = await response.json();

// Build tree on client side
const buildTree = (folders) => {
  const map = new Map();
  const roots = [];
  
  folders.forEach(f => map.set(f.id, { ...f, children: [] }));
  
  folders.forEach(f => {
    const node = map.get(f.id);
    if (f.parentId) {
      const parent = map.get(f.parentId);
      if (parent) parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  
  return roots;
};

const tree = buildTree(folders);
```
