import {
  GOOGLE_API_KEY,
  APPS_SCRIPT_URL,
  PLAYER_INDEX_FILE_ID,
} from "../config/googleDrive";

// Cache player index sau lần đầu load
let _playerIndexCache: Record<string, string> | null = null;

// Cache nội dung từng player text {no: content}
const _playerTextCache = new Map<number, string>();

/**
 * Lấy player index map {No1: fileId, No2: fileId, ...}
 * Cache lại sau lần đầu để không fetch lại nhiều lần
 */
// Web production (GitHub Pages) thì dùng local files, Tauri native vẫn dùng Drive
const IS_WEB_PROD = import.meta.env.PROD && !import.meta.env.TAURI_ENV_TARGET_TRIPLE;

export async function getPlayerIndex(): Promise<Record<string, string>> {
  if (_playerIndexCache) return _playerIndexCache;
  if (IS_WEB_PROD) return getPlayerIndexLocal();
  _playerIndexCache = await readDriveFile<Record<string, string>>(PLAYER_INDEX_FILE_ID);
  return _playerIndexCache;
}

/** Reset cache index (dùng khi cần force reload dữ liệu mới nhất) */
export function clearPlayerIndexCache(): void {
  _playerIndexCache = null;
}

/**
 * Fetch nội dung text của 1 player theo số (No)
 * Có cache: lần đầu fetch từ Drive, lần sau trả từ cache
 */
export async function fetchPlayerText(no: number): Promise<string> {
  if (_playerTextCache.has(no)) return _playerTextCache.get(no)!;
  if (IS_WEB_PROD) {
    const res = await fetch(`${BASE_URL}data/No${no}.txt`);
    if (!res.ok) throw new Error(`Player No${no} not found`);
    const text = await res.text();
    _playerTextCache.set(no, text);
    return text;
  }
  const index = await getPlayerIndex();
  const fileId = index[`No${no}`];
  if (!fileId) throw new Error(`Player No${no} not found in index`);
  const text = await readDriveFileAsText(fileId);
  _playerTextCache.set(no, text);
  return text;
}

/**
 * Fetch player texts từ local public/data/ (dùng cho production/deploy)
 */
// Base path cho static assets (khác nhau giữa dev và GitHub Pages)
const BASE_URL = import.meta.env.BASE_URL ?? '/';

async function fetchPlayerTextsLocal(nos: number[]): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  const toFetch = nos.filter((no) => !_playerTextCache.has(no));
  await Promise.all(
    toFetch.map(async (no) => {
      try {
        const res = await fetch(`${BASE_URL}data/No${no}.txt`);
        if (res.ok) {
          const text = await res.text();
          _playerTextCache.set(no, text);
        }
      } catch {
        // file không tồn tại — bỏ qua
      }
    }),
  );
  for (const no of nos) {
    if (_playerTextCache.has(no)) result.set(no, _playerTextCache.get(no)!);
  }
  return result;
}

/**
 * Lấy player index local từ public/data/player-index.json
 * Local format: {"players": [1, 2, 3, ...]} → convert sang {"No1": "local", "No2": "local", ...}
 */
async function getPlayerIndexLocal(): Promise<Record<string, string>> {
  if (_playerIndexCache) return _playerIndexCache;
  const res = await fetch(`${BASE_URL}data/player-index.json`);
  const data = await res.json();
  const nos: number[] = Array.isArray(data) ? data : (data.players ?? []);
  const index: Record<string, string> = {};
  for (const no of nos) {
    index[`No${no}`] = `local:${no}`;
  }
  _playerIndexCache = index;
  return _playerIndexCache;
}

/**
 * Fetch nhiều player qua Apps Script batchRead (1 request / chunk)
 * Trả về map {no: text} — dùng cache, chỉ fetch những player chưa có
 */
export async function fetchPlayerTexts(
  nos: number[],
): Promise<Map<number, string>> {
  if (IS_WEB_PROD) return fetchPlayerTextsLocal(nos);
  const index = await getPlayerIndex();
  const result = new Map<number, string>();
  const toFetch = nos.filter((no) => !_playerTextCache.has(no));

  if (toFetch.length > 0 && APPS_SCRIPT_URL) {
    const validNos = toFetch.filter((no) => index[`No${no}`]);
    const fileIds = validNos.map((no) => index[`No${no}`]);
    const noByFileId = new Map<string, number>(
      validNos.map((no) => [index[`No${no}`], no]),
    );

    const BATCH_SIZE = 65;
    const chunks: string[][] = [];
    for (let i = 0; i < fileIds.length; i += BATCH_SIZE) {
      chunks.push(fileIds.slice(i, i + BATCH_SIZE));
    }

    const responses = await Promise.all(
      chunks.map(async (chunk) => {
        const url = `${APPS_SCRIPT_URL}?action=batchRead&fileIds=${chunk.join(",")}`;
        const res = await fetch(url, { method: "GET", redirect: "follow" });
        if (!res.ok) return {} as Record<string, string | null>;
        return res.json() as Promise<Record<string, string | null>>;
      }),
    );

    for (const batch of responses) {
      for (const [fileId, content] of Object.entries(batch)) {
        if (content == null) continue;
        const no = noByFileId.get(fileId);
        if (no !== undefined) _playerTextCache.set(no, content);
      }
    }
  }

  for (const no of nos) {
    if (_playerTextCache.has(no)) result.set(no, _playerTextCache.get(no)!);
  }
  return result;
}

/**
 * Fetch tất cả player trong index song song
 * Trả về map {no: text} — dùng cache
 */
export async function fetchAllPlayerTexts(): Promise<Map<number, string>> {
  const index = await getPlayerIndex();
  const nos = Object.keys(index)
    .filter((k) => /^No\d+$/.test(k))
    .map((k) => parseInt(k.replace("No", "")));
  return fetchPlayerTexts(nos);
}

/** Reset toàn bộ cache player texts (dùng khi cần force reload) */
export function clearPlayerTextCache(): void {
  _playerTextCache.clear();
}

/** Xóa cache của 1 player để force fetch mới khi click vào */
export function invalidatePlayerCache(no: number): void {
  _playerTextCache.delete(no);
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
