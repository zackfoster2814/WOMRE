import {
  GOOGLE_API_KEY,
  APPS_SCRIPT_URL,
  PLAYER_INDEX_FILE_ID,
} from "../config/googleDrive";

// Cache player index sau lần đầu load
let _playerIndexCache: Record<string, string> | null = null;

/**
 * Lấy player index map {No1: fileId, No2: fileId, ...}
 * Cache lại sau lần đầu để không fetch lại nhiều lần
 */
export async function getPlayerIndex(): Promise<Record<string, string>> {
  if (_playerIndexCache) return _playerIndexCache;
  _playerIndexCache = await readDriveFile<Record<string, string>>(PLAYER_INDEX_FILE_ID);
  return _playerIndexCache;
}

/** Reset cache index (dùng khi cần force reload dữ liệu mới nhất) */
export function clearPlayerIndexCache(): void {
  _playerIndexCache = null;
}

/**
 * Fetch nội dung text của 1 player theo số (No)
 * Ví dụ: fetchPlayerText(1) → nội dung No1.txt từ Drive
 */
export async function fetchPlayerText(no: number): Promise<string> {
  const index = await getPlayerIndex();
  const fileId = index[`No${no}`];
  if (!fileId) throw new Error(`Player No${no} not found in index`);
  return readDriveFileAsText(fileId);
}

/**
 * Fetch nhiều player song song theo danh sách số
 * Trả về map {no: text} — bỏ qua player không tìm thấy
 */
export async function fetchPlayerTexts(
  nos: number[],
): Promise<Map<number, string>> {
  const index = await getPlayerIndex();
  const result = new Map<number, string>();
  // Giới hạn 20 concurrent requests để tránh flood browser
  const CONCURRENCY = 20;
  for (let i = 0; i < nos.length; i += CONCURRENCY) {
    const batch = nos.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (no) => {
        const fileId = index[`No${no}`];
        if (!fileId) return;
        try {
          const text = await readDriveFileAsText(fileId);
          result.set(no, text);
        } catch {
          // bỏ qua nếu lỗi
        }
      }),
    );
  }
  return result;
}

/**
 * Fetch tất cả player trong index song song
 * Trả về map {no: text}
 */
export async function fetchAllPlayerTexts(): Promise<Map<number, string>> {
  const index = await getPlayerIndex();
  const nos = Object.keys(index)
    .filter((k) => /^No\d+$/.test(k))
    .map((k) => parseInt(k.replace("No", "")));
  return fetchPlayerTexts(nos);
}

/**
 * Append plain text to a Drive file (read current → append → overwrite).
 * Uses Apps Script with action=appendText.
 */
export async function appendReportToDrive(fileId: string, content: string): Promise<void> {
  if (!APPS_SCRIPT_URL) {
    throw new Error("Apps Script URL not configured.");
  }
  const url = `${APPS_SCRIPT_URL}?fileId=${fileId}&action=appendText`;
  const response = await fetch(url, {
    method: "POST",
    body: content,
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`appendReportToDrive failed: ${response.status} ${response.statusText}`);
  }
  const result = await response.json().catch(() => null);
  if (result && !result.success) {
    throw new Error(`Apps Script error: ${JSON.stringify(result)}`);
  }
}

/**
 * Read a JSON file from Google Drive
 * Uses Apps Script doGet (CORS-safe) as primary method
 */
export async function readDriveFile<T>(fileId: string): Promise<T> {
  // Primary: use Apps Script doGet (handles CORS properly)
  if (APPS_SCRIPT_URL) {
    try {
      const url = `${APPS_SCRIPT_URL}?fileId=${fileId}`;
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
      });
      if (response.ok) {
        return response.json();
      }
      console.warn("Apps Script read response not ok:", response.status);
    } catch (e) {
      console.warn("Apps Script read failed:", e);
    }
  }

  // Fallback: try with API key (may fail with CORS in some environments)
  if (GOOGLE_API_KEY) {
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
    } catch (e) {
      console.warn("Drive API key read failed:", e);
    }
  }

  // Last fallback: try direct download URL
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const response = await fetch(directUrl);
  if (!response.ok) {
    throw new Error(`Failed to read file from Drive: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Write/update a JSON file on Google Drive
 * Uses Google Apps Script as proxy (no login required)
 * IMPORTANT: Uses text/plain to avoid CORS preflight
 */
export async function writeDriveFile<T>(fileId: string, data: T): Promise<void> {
  if (!APPS_SCRIPT_URL) {
    throw new Error(
      "Apps Script URL not configured. See src/config/googleDrive.ts for setup instructions."
    );
  }

  // Use text/plain to avoid CORS preflight (OPTIONS request)
  // Apps Script reads e.postData.contents regardless of content type
  const url = `${APPS_SCRIPT_URL}?fileId=${fileId}`;
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data, null, 2),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to write file to Drive: ${response.status} ${response.statusText}`);
  }

  const result = await response.json().catch(() => null);
  if (result && !result.success) {
    throw new Error(`Apps Script error: ${JSON.stringify(result)}`);
  }
}

/**
 * Read a file from Google Drive as plain text (for .txt player files)
 */
export async function readDriveFileAsText(fileId: string): Promise<string> {
  // Try Apps Script first
  if (APPS_SCRIPT_URL) {
    try {
      const url = `${APPS_SCRIPT_URL}?fileId=${fileId}`;
      const response = await fetch(url, { method: "GET", redirect: "follow" });
      if (response.ok) return response.text();
    } catch {
      // CORS or network error — fall through to API key
    }
  }
  // Fallback: Google Drive API with API key
  if (GOOGLE_API_KEY) {
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      if (response.ok) return response.text();
    } catch {
      // fall through
    }
  }
  throw new Error(`Failed to read text file from Drive: ${fileId}`);
}

/**
 * List all files in a Drive folder, returns {filename_without_ext: fileId}
 */
export async function listDriveFolder(folderId: string): Promise<Record<string, string>> {
  if (!APPS_SCRIPT_URL) throw new Error("Apps Script URL not configured.");
  const url = `${APPS_SCRIPT_URL}?action=listFolder&folderId=${folderId}`;
  const response = await fetch(url, { method: "GET", redirect: "follow" });
  if (!response.ok) throw new Error(`listDriveFolder failed: ${response.status}`);
  return response.json();
}

/**
 * Check if Google Drive is configured
 */
export function isDriveConfigured(): { canRead: boolean; canWrite: boolean } {
  return {
    canRead: !!APPS_SCRIPT_URL || !!GOOGLE_API_KEY,
    canWrite: !!APPS_SCRIPT_URL,
  };
}
