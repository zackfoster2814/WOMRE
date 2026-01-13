# Hướng Dẫn Cài Đặt - Wheel of Name

## Yêu Cầu Hệ Thống

### Phần mềm cần cài đặt:

1. **Node.js** (phiên bản 18 trở lên)
   - Tải về: https://nodejs.org/
   - Chọn phiên bản LTS (Long Term Support)
   - Kiểm tra cài đặt thành công:
     ```bash
     node --version
     npm --version
     ```

2. **Git** (để quản lý source code)
   - Tải về: https://git-scm.com/downloads
   - Kiểm tra cài đặt:
     ```bash
     git --version
     ```

3. **Rust** (chỉ cần nếu build Tauri desktop app)
   - Tải về: https://www.rust-lang.org/tools/install
   - Windows: Tải và chạy `rustup-init.exe`
   - Kiểm tra cài đặt:
     ```bash
     rustc --version
     cargo --version
     ```

4. **Visual Studio Code** (khuyến nghị)
   - Tải về: https://code.visualstudio.com/
   - Extensions nên cài:
     - ESLint
     - Prettier
     - Tailwind CSS IntelliSense
     - rust-analyzer (nếu làm việc với Tauri)

---

## Cài Đặt Dự Án

### Bước 1: Clone repository

```bash
git clone https://github.com/zackfoster2814/WOMRE.git
cd WOMRE
git checkout Feature/Wheel-Of-Name
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

Lệnh này sẽ tải về tất cả các thư viện cần thiết được liệt kê trong `package.json`.

---

## Các Lệnh Sử Dụng

### Chế độ Development (Phát triển)

#### Chạy ứng dụng web:
```bash
npm run dev
```
- Mở trình duyệt tại: http://localhost:5173
- Tự động reload khi có thay đổi code
- Hiển thị lỗi và warning trong console

#### Chạy ứng dụng Tauri (Desktop):
```bash
npm run tauri dev
```
- Mở ứng dụng desktop (yêu cầu đã cài Rust)
- Hot reload khi code thay đổi
- Console hiển thị cả frontend và backend logs

---

### Build Production (Xuất bản)

#### Build web app:
```bash
npm run build
```
- Tạo thư mục `dist/` chứa file build
- Tối ưu hóa code, minify CSS/JS
- Sẵn sàng để deploy lên hosting

#### Preview build web:
```bash
npm run preview
```
- Xem trước bản build tại http://localhost:4173
- Kiểm tra trước khi deploy

#### Build Tauri desktop app:
```bash
npm run tauri build
```
- Tạo file cài đặt trong `src-tauri/target/release/bundle/`
- Windows: `.exe`, `.msi`
- macOS: `.dmg`, `.app`
- Linux: `.deb`, `.AppImage`

---

## Cấu Trúc Thư Viện Sử Dụng

### Frontend Core:
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool & dev server (cực nhanh)
- **Tailwind CSS** - Utility-first CSS framework

### UI & Interaction:
- **React Router v7** - Routing/Navigation
- **@hello-pangea/dnd** - Drag & drop items
- **Lucide React** - Icon library

### Desktop:
- **Tauri v2** - Desktop app framework (nhẹ hơn Electron)
- **Rust** - Backend của Tauri

---

## Cấu Hình Môi Trường

### Cấu hình ports (nếu cần):

File `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 5173, // Thay đổi port dev server
  },
  preview: {
    port: 4173, // Thay đổi port preview
  },
});
```

### Cấu hình Tauri:

File `src-tauri/tauri.conf.json`:
```json
{
  "productName": "Wheel of Name",
  "version": "1.0.0",
  "identifier": "com.wheelofname.app"
}
```

---

## Xử Lý Lỗi Thường Gặp

### Lỗi: "npm: command not found"
**Nguyên nhân:** Chưa cài Node.js hoặc chưa thêm vào PATH

**Giải pháp:**
1. Cài đặt Node.js từ https://nodejs.org/
2. Restart terminal/command prompt
3. Kiểm tra lại: `node --version`

---

### Lỗi: "Failed to resolve import"
**Nguyên nhân:** Thiếu dependencies

**Giải pháp:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Lỗi: "Port 5173 already in use"
**Nguyên nhân:** Port đang được sử dụng bởi process khác

**Giải pháp 1:** Kill process đang dùng port
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9
```

**Giải pháp 2:** Đổi port trong `vite.config.ts`

---

### Lỗi Tauri: "cargo: command not found"
**Nguyên nhân:** Chưa cài Rust

**Giải pháp:**
1. Cài Rust: https://www.rust-lang.org/tools/install
2. Restart terminal
3. Chạy lại: `npm run tauri dev`

---

### Lỗi: "EACCES: permission denied"
**Nguyên nhân:** Thiếu quyền ghi file

**Giải pháp:**
```bash
# macOS/Linux
sudo chown -R $USER:$USER .
sudo chmod -R 755 .

# Windows: Chạy terminal với quyền Administrator
```

---

## Cấu Trúc Thư Mục

```
wheelofname/
├── public/               # Static files
│   ├── assets/sfx/      # Sound effects
│   └── data/            # Preset data & character files
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── types/           # TypeScript types
│   ├── utils/           # Helper functions
│   ├── hooks/           # Custom React hooks
│   ├── managers/        # Business logic
│   ├── contexts/        # React contexts
│   └── data/            # Static data
├── src-tauri/           # Tauri desktop app
│   ├── src/             # Rust backend code
│   ├── icons/           # App icons
│   └── Cargo.toml       # Rust dependencies
├── package.json         # NPM dependencies
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS config
└── tsconfig.json        # TypeScript config
```

---

## Workflow Phát Triển

### 1. Tạo nhánh mới:
```bash
git checkout -b feature/ten-tinh-nang-moi
```

### 2. Code & Test:
```bash
npm run dev    # Chạy dev server
# Làm việc với code...
```

### 3. Build & Kiểm tra:
```bash
npm run build
npm run preview
```

### 4. Commit changes:
```bash
git add .
git commit -m "feat: thêm tính năng XYZ"
```

### 5. Push lên GitHub:
```bash
git push origin feature/ten-tinh-nang-moi
```

---

## Tài Liệu Tham Khảo

- **React:** https://react.dev/
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Vite:** https://vitejs.dev/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **React Router:** https://reactrouter.com/
- **Tauri:** https://tauri.app/

---

## Tips & Tricks

### Tăng tốc độ cài đặt:
```bash
# Dùng pnpm (nhanh hơn npm)
npm install -g pnpm
pnpm install

# Hoặc dùng yarn
npm install -g yarn
yarn install
```

### Clear cache khi gặp lỗi lạ:
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear npm cache
npm cache clean --force

# Cài lại từ đầu
rm -rf node_modules package-lock.json
npm install
```

### Dev tools hữu ích:
- **React DevTools:** Extension để debug React
- **Tailwind CSS IntelliSense:** Autocomplete cho Tailwind
- **Error Lens:** Hiển thị lỗi inline trong VSCode

---
