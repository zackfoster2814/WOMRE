/**
 * Bundle tất cả file No*.txt trong public/data/ thành một file JSON duy nhất.
 * Kết quả: public/data/players-bundle.json = { "1": "<text>", "2": "<text>", ... }
 *
 * Chạy: node scripts/bundle-players.js
 * Tự động chạy trong build pipeline (xem package.json)
 */

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../public/data");
const outputFile = join(dataDir, "players-bundle.json");

const files = readdirSync(dataDir)
  .filter((f) => /^No\d+\.txt$/i.test(f))
  .sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ""), 10);
    const nb = parseInt(b.replace(/\D/g, ""), 10);
    return na - nb;
  });

if (files.length === 0) {
  console.warn("bundle-players: Không tìm thấy file No*.txt trong", dataDir);
  process.exit(0);
}

const bundle = {};
for (const file of files) {
  const no = parseInt(file.replace(/\D/g, ""), 10);
  bundle[no] = readFileSync(join(dataDir, file), "utf8");
}

writeFileSync(outputFile, JSON.stringify(bundle), "utf8");
console.log(
  `bundle-players: Đã gộp ${files.length} file → public/data/players-bundle.json`
);
