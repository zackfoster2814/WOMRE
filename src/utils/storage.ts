import { WheelPreset } from '../types';

export const savePresetToFile = async (preset: WheelPreset): Promise<void> => {
  try {
    // Check if running in Tauri
    if (window.__TAURI__) {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      const filePath = await save({
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }],
        defaultPath: `${preset.name}.json`
      });

      if (filePath) {
        await writeTextFile(filePath, JSON.stringify(preset, null, 2));
      }
    } else {
      // Browser fallback
      const dataStr = JSON.stringify(preset, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${preset.name}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Failed to save preset:', error);
    throw error;
  }
};

export const loadPresetFromFile = async (): Promise<WheelPreset | null> => {
  try {
    // Check if running in Tauri
    if (window.__TAURI__) {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile } = await import('@tauri-apps/plugin-fs');

      const filePath = await open({
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }],
        multiple: false
      });

      if (filePath && typeof filePath === 'string') {
        const content = await readTextFile(filePath);
        return JSON.parse(content);
      }
    } else {
      // Browser fallback
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const preset = JSON.parse(e.target?.result as string);
                resolve(preset);
              } catch (error) {
                console.error('Failed to parse preset:', error);
                resolve(null);
              }
            };
            reader.readAsText(file);
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    }
  } catch (error) {
    console.error('Failed to load preset:', error);
    return null;
  }
  return null;
};

// Storage functions for preset management
const PRESETS_STORAGE_KEY = 'wheel-of-name-presets';
const PRESETS_FILE_NAME = 'presets.json';

// Get the presets file path for Tauri
const getPresetsFilePath = async (): Promise<string> => {
  const { appDataDir } = await import('@tauri-apps/api/path');
  const appDataPath = await appDataDir();
  const normalizedPath = appDataPath.replace(/[\/\\]$/, '');
  return `${normalizedPath}/${PRESETS_FILE_NAME}`;
};

// Ensure the app data directory exists
const ensureAppDataDir = async (): Promise<void> => {
  try {
    const { appDataDir } = await import('@tauri-apps/api/path');
    const { exists, mkdir } = await import('@tauri-apps/plugin-fs');

    const appDataPath = await appDataDir();
    const normalizedPath = appDataPath.replace(/[\/\\]$/, '');

    if (!(await exists(normalizedPath))) {
      await mkdir(normalizedPath, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to ensure app data directory:', error);
  }
};

export const savePresetToStorage = async (preset: WheelPreset): Promise<void> => {
  try {
    if (window.__TAURI__) {
      // Use Tauri's file system
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      await ensureAppDataDir();
      const presets = await getPresetsFromStorage();
      const existingIndex = presets.findIndex(p => p.id === preset.id);

      if (existingIndex >= 0) {
        presets[existingIndex] = preset;
      } else {
        presets.push(preset);
      }

      const filePath = await getPresetsFilePath();
      await writeTextFile(filePath, JSON.stringify(presets, null, 2));
    } else {
      // Use localStorage for browser
      const presets = await getPresetsFromStorage();
      const existingIndex = presets.findIndex(p => p.id === preset.id);

      if (existingIndex >= 0) {
        presets[existingIndex] = preset;
      } else {
        presets.push(preset);
      }

      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    }
  } catch (error) {
    console.error('Failed to save preset to storage:', error);
    throw error;
  }
};

export const getPresetsFromStorage = async (): Promise<WheelPreset[]> => {
  try {
    if (window.__TAURI__) {
      // Use Tauri's file system
      const { readTextFile, exists } = await import('@tauri-apps/plugin-fs');

      await ensureAppDataDir();
      const filePath = await getPresetsFilePath();

      if (await exists(filePath)) {
        const content = await readTextFile(filePath);
        return JSON.parse(content);
      }
      return [];
    } else {
      // Use localStorage for browser
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  } catch (error) {
    console.error('Failed to get presets from storage:', error);
    return [];
  }
};

export const deletePresetFromStorage = async (presetId: string): Promise<void> => {
  try {
    if (window.__TAURI__) {
      // Use Tauri's file system
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      const presets = await getPresetsFromStorage();
      const filtered = presets.filter(p => p.id !== presetId);

      const filePath = await getPresetsFilePath();
      await writeTextFile(filePath, JSON.stringify(filtered, null, 2));
    } else {
      // Use localStorage for browser
      const presets = await getPresetsFromStorage();
      const filtered = presets.filter(p => p.id !== presetId);
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Failed to delete preset:', error);
    throw error;
  }
};

// Type declaration for Tauri
declare global {
  interface Window {
    __TAURI__?: unknown;
  }
}
