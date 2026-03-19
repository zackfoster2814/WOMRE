// Get the base path for fetching assets
// In development: '/'
// In production (GitHub Pages): '/WOMRE/'
export const BASE_PATH = import.meta.env.BASE_URL || '/';

export function getAssetPath(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Combine base path with asset path
  return `${BASE_PATH}${cleanPath}`;
}

// Avatar: thử lần lượt các extension cho đến khi tìm được ảnh hợp lệ
// Hỗ trợ: png, jpg, jpeg, gif, webp (bao gồm ảnh động)
export const AVATAR_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp'] as const;

export function getAvatarUrl(no: number, extIndex = 0): string {
  const ext = AVATAR_EXTENSIONS[extIndex] ?? AVATAR_EXTENSIONS[0];
  return getAssetPath(`/data/avatars/no${no}.${ext}`);
}

export const RANDOM_AVATAR_COUNT = 20;

export function getRandomAvatarUrl(no: number, extIndex = 0): string {
  const index = (no % RANDOM_AVATAR_COUNT) + 1;
  const ext = AVATAR_EXTENSIONS[extIndex] ?? AVATAR_EXTENSIONS[0];
  return getAssetPath(`/data/avatars/randomAvatar/${index}.${ext}`);
}

// Default fallback player range if player-index.json fails to load
const DEFAULT_PLAYER_RANGE = { start: 1, end: 259 };

// Cache for player numbers
let cachedPlayerNumbers: number[] | null = null;

/**
 * Load player numbers from player-index.json
 * Falls back to a default range if the file can't be loaded
 */
export async function getPlayerNumbers(noCache = false): Promise<number[]> {
  // Return cached value if available and cache is not disabled
  if (cachedPlayerNumbers && !noCache) {
    return cachedPlayerNumbers;
  }

  try {
    const response = await fetch(getAssetPath('/data/player-index.json'), {
      cache: noCache ? 'no-store' : 'default'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.players && Array.isArray(data.players)) {
        cachedPlayerNumbers = data.players;
        return data.players;
      }
    }
  } catch (error) {
    console.error('Failed to load player-index.json:', error);
  }

  // Fallback to default range
  console.warn('Using default player range as fallback');
  const fallbackNumbers: number[] = [];
  for (let i = DEFAULT_PLAYER_RANGE.start; i <= DEFAULT_PLAYER_RANGE.end; i++) {
    fallbackNumbers.push(i);
  }
  return fallbackNumbers;
}

/**
 * Clear the cached player numbers
 * Useful when refreshing data
 */
export function clearPlayerNumbersCache(): void {
  cachedPlayerNumbers = null;
}
