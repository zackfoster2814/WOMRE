import {
  GOOGLE_API_KEY,
  APPS_SCRIPT_URL,
} from "../config/googleDrive";

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
 * Check if Google Drive is configured
 */
export function isDriveConfigured(): { canRead: boolean; canWrite: boolean } {
  return {
    canRead: !!APPS_SCRIPT_URL || !!GOOGLE_API_KEY,
    canWrite: !!APPS_SCRIPT_URL,
  };
}
