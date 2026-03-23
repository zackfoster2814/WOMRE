/**
 * Generate player_index.json từ Google Drive folder
 * Chạy: node scripts/generate-player-index.js
 * Kết quả ghi vào Drive file player_index.json (PLAYER_INDEX_FILE_ID)
 */

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwwwSDyX85TLGt0bJHVWdSbbOuiXDB8fcP-hz6-ZYZBBJyzv5VGBGlB8NzsK2dGWYD_/exec";
const PLAYER_DATA_FOLDER_ID = "1C-YoYFTQgb0OEdHQb8E8IY3nmhOFJOAK";
const PLAYER_INDEX_FILE_ID = "1afL5qTXnCMitweWDUmTq3rECoIBAnbQl";
// Local mirror path (Google Drive desktop sync)
const LOCAL_OUTPUT = "g:/My Drive/WOM/WON/PvPData/playerdata/player_index.json";

async function main() {
  console.log("Fetching file list from Drive folder...");
  const url = `${APPS_SCRIPT_URL}?action=listFolder&folderId=${PLAYER_DATA_FOLDER_ID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);

  const raw = await res.json();

  // Filter chỉ lấy file No*.txt, sort theo số
  const index = Object.fromEntries(
    Object.entries(raw)
      .filter(([name]) => /^No\d+$/i.test(name))
      .sort(([a], [b]) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")))
  );

  const count = Object.keys(index).length;
  console.log(`Found ${count} player files`);

  const { writeFileSync } = await import("fs");
  writeFileSync(LOCAL_OUTPUT, JSON.stringify(index, null, 2), "utf8");
  console.log(`Written to ${LOCAL_OUTPUT}`);
  console.log("Google Drive desktop will sync automatically.");
  console.log("Sample:", Object.entries(index).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(", "));
}

main().catch(console.error);
