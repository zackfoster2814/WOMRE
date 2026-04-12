import {
  GOOGLE_API_KEY,
  APPS_SCRIPT_URL,
  PLAYER_INDEX_FILE_ID,
} from "../config/googleDrive";

void GOOGLE_API_KEY; // unused but kept for potential fallback

// Cache player index sau lần đầu load
let _playerIndexCache: Record<string, string> | null = null;

// Cache nội dung từng player text {no: content}
const _playerTextCache = new Map<number, string>();

// Promise-level cache cho fetchAllPlayerTexts — dedup các caller đồng thời
let _allTextsPromise: Promise<Map<number, string>> | null = null;

// ── Player Index ──────────────────────────────────────────────────────────────

export async function getPlayerIndex(): Promise<Record<string, string>> {
  if (_playerIndexCache) return _playerIndexCache;
  _playerIndexCache = await readDriveFile<Record<string, string>>(PLAYER_INDEX_FILE_ID);
  return _playerIndexCache;
}

export function clearPlayerIndexCache(): void {
  _playerIndexCache = null;
}

// ── Fetch single player ───────────────────────────────────────────────────────

export async function fetchPlayerText(no: number): Promise<string> {
  if (_playerTextCache.has(no)) return _playerTextCache.get(no)!;
  const index = await getPlayerIndex();
  const fileId = index[`No${no}`];
  if (!fileId) throw new Error(`Player No${no} not found in index`);
  const text = await readDriveFileAsText(fileId);
  _playerTextCache.set(no, text);
  return text;
}

// ── Fetch multiple players (batchRead, parallel chunks) ──────────────────────

export async function fetchPlayerTexts(
  nos: number[],
  { noCache = false }: { noCache?: boolean } = {},
): Promise<Map<number, string>> {
  const index = await getPlayerIndex();
  const result = new Map<number, string>();
  // noCache=true → bỏ qua in-memory cache của app, buộc fetch lại từ Worker/Drive
  const toFetch = noCache ? nos : nos.filter((no) => !_playerTextCache.has(no));

  if (toFetch.length > 0 && APPS_SCRIPT_URL) {
    const validNos = toFetch.filter((no) => index[`No${no}`]);
    const fileIds = validNos.map((no) => index[`No${no}`]);
    const noByFileId = new Map<string, number>(
      validNos.map((no) => [index[`No${no}`], no]),
    );

    // BATCH_SIZE nhỏ để Worker không vượt giới hạn 50 subrequests/invocation (free tier)
    const BATCH_SIZE = 15;
    const MAX_CONCURRENT = 6;
    const chunks: string[][] = [];
    for (let i = 0; i < fileIds.length; i += BATCH_SIZE) {
      chunks.push(fileIds.slice(i, i + BATCH_SIZE));
    }

    const fetchChunk = async (chunk: string[]) => {
      try {
        const url = `${APPS_SCRIPT_URL}?action=batchRead&fileIds=${chunk.join(",")}`;
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) return;
        const batch = await res.json() as Record<string, string | null>;
        for (const [fileId, content] of Object.entries(batch)) {
          if (content == null) continue;
          const no = noByFileId.get(fileId);
          if (no !== undefined) _playerTextCache.set(no, content);
        }
      } catch {
        // chunk fail — bỏ qua
      }
    };

    // Chạy song song theo window MAX_CONCURRENT
    for (let i = 0; i < chunks.length; i += MAX_CONCURRENT) {
      await Promise.all(chunks.slice(i, i + MAX_CONCURRENT).map(fetchChunk));
    }
  }

  for (const no of nos) {
    if (_playerTextCache.has(no)) result.set(no, _playerTextCache.get(no)!);
  }
  return result;
}

// ── Fetch all players ─────────────────────────────────────────────────────────

export async function fetchAllPlayerTexts(): Promise<Map<number, string>> {
  if (_allTextsPromise) return _allTextsPromise;
  _allTextsPromise = (async () => {
    const index = await getPlayerIndex();
    const nos = Object.keys(index)
      .filter((k) => /^No\d+$/.test(k))
      .map((k) => parseInt(k.replace("No", "")));
    return fetchPlayerTexts(nos);
  })();
  _allTextsPromise.catch(() => { _allTextsPromise = null; });
  return _allTextsPromise;
}

// ── Cache management ──────────────────────────────────────────────────────────

export function clearPlayerTextCache(): void {
  _playerTextCache.clear();
  _allTextsPromise = null;
}

export function invalidatePlayerCache(no: number): void {
  _playerTextCache.delete(no);
}

// ── Drive read/write via Cloudflare Worker ────────────────────────────────────

export async function readDriveFile<T>(fileId: string): Promise<T> {
  if (!APPS_SCRIPT_URL) throw new Error("Worker URL not configured.");
  const res = await fetch(`${APPS_SCRIPT_URL}?fileId=${fileId}`, { method: "GET" });
  if (!res.ok) throw new Error(`Worker read failed: ${res.status}`);
  return res.json();
}

export async function writeDriveFile<T>(fileId: string, data: T): Promise<void> {
  if (!APPS_SCRIPT_URL) throw new Error("Worker URL not configured.");
  const res = await fetch(`${APPS_SCRIPT_URL}?fileId=${fileId}`, {
    method: "POST",
    body: JSON.stringify(data, null, 2),
  });
  if (!res.ok) throw new Error(`Worker write failed: ${res.status} ${res.statusText}`);
  const result = await res.json().catch(() => null);
  if (result && !result.success) throw new Error(`Worker error: ${JSON.stringify(result)}`);
}

export async function readDriveFileAsText(fileId: string): Promise<string> {
  if (!APPS_SCRIPT_URL) throw new Error("Worker URL not configured.");
  const res = await fetch(`${APPS_SCRIPT_URL}?fileId=${fileId}`, { method: "GET" });
  if (!res.ok) throw new Error(`Worker read text failed: ${res.status} for ${fileId}`);
  return res.text();
}

export async function appendReportToDrive(fileId: string, content: string): Promise<void> {
  if (!APPS_SCRIPT_URL) throw new Error("Worker URL not configured.");
  const res = await fetch(`${APPS_SCRIPT_URL}?fileId=${fileId}&action=appendText`, {
    method: "POST",
    body: content,
  });
  if (!res.ok) throw new Error(`appendReportToDrive failed: ${res.status} ${res.statusText}`);
  const result = await res.json().catch(() => null);
  if (result && !result.success) throw new Error(`Worker error: ${JSON.stringify(result)}`);
}

export async function listDriveFolder(folderId: string): Promise<Record<string, string>> {
  if (!APPS_SCRIPT_URL) throw new Error("Worker URL not configured.");
  const res = await fetch(`${APPS_SCRIPT_URL}?action=listFolder&folderId=${folderId}`, { method: "GET" });
  if (!res.ok) throw new Error(`listDriveFolder failed: ${res.status}`);
  return res.json();
}

export function isDriveConfigured(): { canRead: boolean; canWrite: boolean } {
  return {
    canRead: !!APPS_SCRIPT_URL,
    canWrite: !!APPS_SCRIPT_URL,
  };
}
