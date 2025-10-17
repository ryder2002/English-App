# Tính năng thêm từ vựng với từ đồng nghĩa

## Mô tả

Hệ thống hiện hỗ trợ thêm từ vựng với từ đồng nghĩa để AI hiểu rõ hơn ngữ cảnh. Người dùng có thể chỉ định từ đồng nghĩa ngay khi nhập từ, giúp AI tạo nghĩa tiếng Việt chính xác hơn.

## Cú pháp hỗ trợ

Bạn có thể sử dụng các ký tự phân cách sau để thêm từ đồng nghĩa:

- `=` (dấu bằng)
- `-` (dấu gạch ngang)
- `:` (dấu hai chấm)
- `|` (dấu ống)

### Ví dụ

```
hello = hi
put on : wear
fast - quick
big | large
```

## Cách hoạt động

### Input và Output

**Input**: `hello = hi`

**Kết quả**:
- Từ tiếng Anh: `hello`
- Nghĩa tiếng Việt: `xin chào` (do AI tự động tạo)
- Phát âm IPA: `/həˈloʊ/` (do AI tự động tạo)
- `hi` được sử dụng như ngữ cảnh để AI hiểu rõ hơn

### Thêm hàng loạt (Batch Add)

1. Người dùng nhập danh sách từ, mỗi từ một dòng
2. Hệ thống phân tích từng dòng để tách từ và từ đồng nghĩa (nếu có)
3. Đối với từ có đồng nghĩa:
   - Kiểm tra tính hợp lệ của từ gốc (đối với tiếng Anh)
   - Gửi từ kèm thông tin đồng nghĩa cho AI: `hello (synonym: hi)`
   - AI sử dụng từ đồng nghĩa để hiểu ngữ cảnh và tạo nghĩa tiếng Việt chính xác
   - Kết quả trả về chỉ chứa từ gốc, không có notation đồng nghĩa
4. Đối với từ không có đồng nghĩa:
   - Hoạt động như trước đây: AI tự động tra từ điển và tạo đầy đủ thông tin

### Thêm thủ công (Manual Add)

1. Trong cột "Từ vựng", người dùng có thể nhập: `hello = hi`
2. Hệ thống tự động:
   - Tách thành từ: "hello"
   - Đánh dấu có thông tin đồng nghĩa
   - Khi nhấn nút "Tự động điền", gửi request với ngữ cảnh đồng nghĩa
   - AI tạo nghĩa tiếng Việt, phát âm và từ loại

## Lợi ích

1. **Chính xác hơn**: AI hiểu rõ ngữ cảnh qua từ đồng nghĩa
2. **Linh hoạt**: Người dùng có thể hướng dẫn AI về nghĩa mong muốn
3. **Tránh lỗi**: Từ sai chính tả như "helllo" sẽ bị báo lỗi, nhưng "hello = hi" sẽ được chấp nhận
4. **Hỗ trợ đa nghĩa**: Có thể chỉ định nghĩa cụ thể cho từ có nhiều nghĩa

## So sánh trước và sau

### Trước đây
**Input**: `run`
**Output**: 
- Từ: `run`
- Nghĩa TV: `chạy, điều hành, hoạt động` (AI có thể cho nhiều nghĩa)

### Bây giờ
**Input**: `run = jog`
**Output**:
- Từ: `run`
- Nghĩa TV: `chạy bộ` (AI hiểu đúng ngữ cảnh thể thao)

## Files đã thay đổi

1. `src/lib/parse-word-with-definition.ts` - Utility function để parse từ với đồng nghĩa
2. `src/ai/flows/generate-batch-vocabulary-details.ts` - Logic xử lý synonym context
3. `src/components/batch-add-form.tsx` - Cập nhật UI và hướng dẫn
4. `src/components/manual-add-table.tsx` - Xử lý parse trong manual add
5. `src/app/add-vocabulary/page.tsx` - Cập nhật hướng dẫn sử dụng

## Ví dụ sử dụng thực tế

### Trường hợp 1: Từ có nhiều nghĩa
```
run = jog     → chạy bộ (thể thao)
run = operate → điều hành (công ty)
```

### Trường hợp 2: Phrasal verbs
```
put on = wear    → mặc (quần áo)
put on = apply   → bôi (mỹ phẩm)
```

### Trường hợp 3: Kết hợp cả hai cách
```
hello = hi
world
apple = fruit
```
Trong ví dụ này:
- `hello` → AI hiểu là lời chào, tạo nghĩa "xin chào"
- `world` → AI tự động tra từ điển
- `apple` → AI hiểu là trái cây, tạo nghĩa "táo"
