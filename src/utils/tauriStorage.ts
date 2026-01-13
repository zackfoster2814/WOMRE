import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
  readDir,
  remove,
  copyFile,
  readFile,
  writeFile
} from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';
import type { WheelPreset, WheelItem } from '../types';

const PRESETS_DIR = 'wheel-of-name/presets';

// Check if running in Tauri
export const isTauri = (): boolean => {
  return '__TAURI__' in window;
};

// Initialize presets directory
export const initPresetsDirectory = async (): Promise<void> => {
  if (!isTauri()) return;

  try {
    const dirExists = await exists(PRESETS_DIR, { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
      await mkdir(PRESETS_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
    }
  } catch (error) {
    console.error('Failed to initialize presets directory:', error);
    throw error;
  }
};

// Convert Uint8Array to base64
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert base64 string to Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  // Extract base64 data (remove data:audio/...;base64, prefix if present)
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Save preset to file system
export const savePresetToFile = async (preset: WheelPreset): Promise<void> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri app');
  }

  try {
    await initPresetsDirectory();

    // Create preset folder
    const presetFolder = `${PRESETS_DIR}/${preset.id}`;
    await mkdir(presetFolder, { baseDir: BaseDirectory.AppData, recursive: true });

    // Process items and save audio files
    const itemsData: WheelItem[] = [];

    for (let i = 0; i < preset.items.length; i++) {
      const item = preset.items[i];
      let audioFileName: string | undefined = undefined;

      if (item.customSound) {
        // If it's a data URL or blob URL, save it as a file
        if (item.customSound.startsWith('data:') || item.customSound.startsWith('blob:')) {
          audioFileName = `audio_${i}_${Date.now()}.mp3`;
          const audioPath = `${presetFolder}/${audioFileName}`;

          if (item.customSound.startsWith('data:')) {
            // It's already base64, save directly
            const bytes = base64ToUint8Array(item.customSound);
            await writeFile(audioPath, bytes, { baseDir: BaseDirectory.AppData });
          } else {
            // It's a blob URL, fetch and convert
            const response = await fetch(item.customSound);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            await writeFile(audioPath, bytes, { baseDir: BaseDirectory.AppData });
          }
        } else if (item.customSound.includes('/') || item.customSound.includes('\\')) {
          // It's already a file path, copy it
          audioFileName = `audio_${i}_${Date.now()}.mp3`;
          const audioPath = `${presetFolder}/${audioFileName}`;
          try {
            await copyFile(item.customSound, audioPath, { toPathBaseDir: BaseDirectory.AppData });
          } catch (err) {
            console.warn('Could not copy audio file, will save as reference:', err);
            audioFileName = item.customSound;
          }
        } else {
          // It's a reference to a file in another preset
          audioFileName = item.customSound;
        }
      }

      itemsData.push({
        ...item,
        customSound: audioFileName,
      });
    }

    // Save preset metadata
    const presetData = {
      ...preset,
      items: itemsData,
    };

    const configPath = `${presetFolder}/preset.json`;
    await writeTextFile(configPath, JSON.stringify(presetData, null, 2), { baseDir: BaseDirectory.AppData });

  } catch (error) {
    console.error('Failed to save preset to file:', error);
    throw error;
  }
};

// Get all presets from file system
export const getPresetsFromFile = async (): Promise<WheelPreset[]> => {
  if (!isTauri()) {
    return [];
  }

  try {
    await initPresetsDirectory();

    const entries = await readDir(PRESETS_DIR, { baseDir: BaseDirectory.AppData });
    const presets: WheelPreset[] = [];

    for (const entry of entries) {
      if (entry.isDirectory && entry.name) {
        try {
          const configPath = `${PRESETS_DIR}/${entry.name}/preset.json`;
          const content = await readTextFile(configPath, { baseDir: BaseDirectory.AppData });
          const preset = JSON.parse(content);
          presets.push(preset);
        } catch (err) {
          console.error(`Failed to read preset ${entry.name}:`, err);
        }
      }
    }

    return presets;
  } catch (error) {
    console.error('Failed to get presets from file:', error);
    return [];
  }
};

// Load preset with audio files
export const loadPresetFromFile = async (presetId: string): Promise<WheelPreset | null> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri app');
  }

  try {
    const configPath = `${PRESETS_DIR}/${presetId}/preset.json`;
    const content = await readTextFile(configPath, { baseDir: BaseDirectory.AppData });
    const preset = JSON.parse(content);

    // Load audio files and convert to data URLs for playback
    const itemsWithAudio: WheelItem[] = [];

    for (const item of preset.items) {
      if (item.customSound && !item.customSound.startsWith('data:') && !item.customSound.startsWith('http')) {
        // This is a relative path
        const audioPath = `${PRESETS_DIR}/${presetId}/${item.customSound}`;
        try {
          const fileData = await readFile(audioPath, { baseDir: BaseDirectory.AppData });
          const base64 = uint8ArrayToBase64(fileData);
          const dataUrl = `data:audio/mpeg;base64,${base64}`;

          itemsWithAudio.push({
            ...item,
            customSound: dataUrl,
          });
        } catch (err) {
          console.warn(`Could not load audio file ${item.customSound}:`, err);
          itemsWithAudio.push(item);
        }
      } else {
        itemsWithAudio.push(item);
      }
    }

    return {
      ...preset,
      items: itemsWithAudio,
    };
  } catch (error) {
    console.error('Failed to load preset from file:', error);
    return null;
  }
};

// Delete preset from file system
export const deletePresetFromFile = async (presetId: string): Promise<void> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri app');
  }

  try {
    const presetFolder = `${PRESETS_DIR}/${presetId}`;
    await remove(presetFolder, { baseDir: BaseDirectory.AppData, recursive: true });
  } catch (error) {
    console.error('Failed to delete preset from file:', error);
    throw error;
  }
};

// Get absolute path to presets directory
export const getPresetsPath = async (): Promise<string> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri app');
  }

  const appData = await appDataDir();
  return `${appData}${PRESETS_DIR}`;
};
