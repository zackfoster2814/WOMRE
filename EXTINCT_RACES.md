# Extinct Races Feature

## 🦴 Tộc Tuyệt Chủng

Ba tộc sau đã tuyệt chủng trong vũ trụ Wheel of Multiverse và được **mặc định disabled**:

1. **Vampire** 🧛 - Tộc ma cà rồng
2. **Spirit** 👻 - Tộc linh hồn
3. **Demon** 😈 - Tộc ác ma

## 🎮 Cách Sử Dụng

### Trạng thái mặc định
Khi load preset "Race", 3 tộc này sẽ tự động bị disable:
- Không xuất hiện trong vòng quay
- Hiển thị mờ và có dấu "○" màu cam
- Không thể chỉnh sửa weight hoặc color

### Enable lại tộc tuyệt chủng

#### Cách 1: Enable từng tộc
Click vào button "○" (màu cam) bên cạnh tên tộc → Sẽ chuyển thành "✓" (màu xanh lá)

#### Cách 2: Enable All (Khuyến nghị)
1. Nhấn button **"Enable All"** (màu xanh emerald)
2. TẤT CẢ các tộc bị disable sẽ được enable lại
3. Phù hợp khi muốn mở lại toàn bộ 23 tộc

### Disable lại
- Click vào button "✓" (màu xanh lá) để disable lại
- Hoặc sử dụng button "Reset All" để enable tất cả

## 📝 Lưu ý kỹ thuật

### File cấu hình
Các tộc tuyệt chủng được đánh dấu trong:
```
public/data/default-presets.json
```

```json
{ "name": "Vampire", "weight": 4, "disabled": true }
{ "name": "Spirit", "weight": 4.5, "disabled": true }
{ "name": "Demon", "weight": 2.5, "disabled": true }
```

### UI States
- **Disabled**: Background mờ (opacity-60), không thể edit, button "○" cam
- **Enabled**: Background bình thường, có thể edit, button "✓" xanh

### Wheel Logic
WheelCanvas tự động filter ra items disabled:
```typescript
const activeItems = items.filter(
  (item) => !item.disabled && item.weight > 0
);
```

## 🔧 Buttons có sẵn

| Button | Màu | Chức năng | Điều kiện |
|--------|-----|-----------|-----------|
| **Shuffle** | Purple | Xáo trộn thứ tự | Có items |
| **Reset All** | Green | Enable tất cả items disabled | Có items disabled |
| **Enable All** | Emerald | Enable tất cả (kể cả tộc tuyệt chủng) | Có items disabled |
| **Balance** | Cyan | Đặt weight = 1 cho tất cả active items | Có items |
| **Clear All** | Red | Xóa hết items | Có items |

## 🎯 Use Cases

### Chơi normal mode (theo lore)
- Giữ nguyên 3 tộc disabled
- Chỉ có 20 tộc active

### Chơi full mode (mở khóa tất cả)
1. Load preset "Race"
2. Click "Enable All"
3. Có đủ 23 tộc

### Custom mode
- Enable chọn lọc (ví dụ: chỉ enable Vampire)
- Tạo preset riêng với các tộc mong muốn

---

✨ Feature này giúp tôn trọng lore của game trong khi vẫn linh hoạt cho người chơi!
