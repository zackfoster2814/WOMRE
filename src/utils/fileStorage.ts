import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile, readDir, remove } from '@tauri-apps/plugin-fs';
import { join, appDataDir } from '@tauri-apps/api/path';
import type { WheelPreset, WheelItem } from '../types';

const PRESETS_DIR = 'wheel-of-name/presets';

// Initialize presets directory
export const initPresetsDirectory = async (): Promise<void> => {
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

// Save preset to file system
export const savePresetToFile = async (preset: WheelPreset): Promise<void> => {
  try {
    await initPresetsDirectory();

    // Create preset folder
    const presetFolder = `${PRESETS_DIR}/${preset.id}`;
    await mkdir(presetFolder, { baseDir: BaseDirectory.AppData, recursive: true });

    // Copy audio files if they exist
    const itemsWithAudio: WheelItem[] = [];
    for (const item of preset.items) {
      if (item.customSound && item.customSound.startsWith('blob:')) {
        // For blob URLs, we need to fetch and save the blob
        const response = await fetch(item.customSound);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const audioFileName = `audio_${item.id}.mp3`;
        const audioPath = `${presetFolder}/${audioFileName}`;

        // Write audio file
        await writeTextFile(audioPath, uint8Array.toString(), { baseDir: BaseDirectory.AppData });

        itemsWithAudio.push({
          ...item,
          customSound: audioFileName, // Store relative path
        });
      } else {
        itemsWithAudio.push(item);
      }
    }

    // Save preset metadata
    const presetData = {
      ...preset,
      items: itemsWithAudio,
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
  try {
    await initPresetsDirectory();

    const entries = await readDir(PRESETS_DIR, { baseDir: BaseDirectory.AppData });
    const presets: WheelPreset[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) {
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
  try {
    const configPath = `${PRESETS_DIR}/${presetId}/preset.json`;
    const content = await readTextFile(configPath, { baseDir: BaseDirectory.AppData });
    const preset = JSON.parse(content);

    // Load audio files and convert to blob URLs
    const appData = await appDataDir();
    const itemsWithAudio: WheelItem[] = [];

    for (const item of preset.items) {
      if (item.customSound && !item.customSound.startsWith('blob:') && !item.customSound.startsWith('http')) {
        // This is a relative path, convert to absolute path
        const audioPath = await join(appData, PRESETS_DIR, presetId, item.customSound);
        itemsWithAudio.push({
          ...item,
          customSound: audioPath,
        });
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
  try {
    const presetFolder = `${PRESETS_DIR}/${presetId}`;
    await remove(presetFolder, { baseDir: BaseDirectory.AppData, recursive: true });
  } catch (error) {
    console.error('Failed to delete preset from file:', error);
    throw error;
  }
};

// Export preset to user-selected location
export const exportPresetToLocation = async (preset: WheelPreset): Promise<void> => {
  // This will be implemented using dialog plugin
  // For now, just return the preset folder path
  console.log('Export preset:', preset);
};

// Get preset folder path
export const getPresetPath = async (presetId: string): Promise<string> => {
  const appData = await appDataDir();
  return await join(appData, PRESETS_DIR, presetId);
};
