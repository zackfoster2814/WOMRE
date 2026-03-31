// scripts/post-build-copy.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sourceFile = path.join(
  __dirname,
  "..", // về thư mục gốc dự án
  "src-tauri",
  "target",
  "release",
  "bundle",
  "msi",
  "Wheel of Multiverse_0.1.0_x64_en-US.msi",
);

const destFolder = "G:/My Drive/WOM/WON/file installer/Release-v0.1.2";
const destFile = path.join(
  destFolder,
  "Wheel of Multiverse_0.1.0_x64_en-US.msi",
);

try {
  // Đảm bảo thư mục đích tồn tại
  if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder, { recursive: true });
    console.log(`Đã tạo thư mục: ${destFolder}`);
  }

  // Copy và ghi đè nếu đã tồn tại
  fs.copyFileSync(sourceFile, destFile);
  console.log(`✓ Đã copy MSI thành công:`);
  console.log(`  Từ: ${sourceFile}`);
  console.log(`  Vào: ${destFile}`);
} catch (err) {
  console.error("Lỗi khi copy file MSI:");
  console.error(err.message);
  if (err.code === "ENOENT") {
    console.error("→ Kiểm tra xem file MSI có thực sự được tạo không?");
    console.error("→ Đường dẫn source có đúng không?");
  }
  process.exitCode = 1;
}
