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
