import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
  readDir,
  remove,
  writeFile,
  readFile
} from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import type { WheelPreset, WheelItem } from '../types';

const PRESETS_FOLDER = 'presets';

// Check if running in Tauri
export const isTauri = (): boolean => {
  // Check for Tauri v2 internals
  return typeof window !== 'undefined' &&
         (('__TAURI_INTERNALS__' in window) || ('__TAURI__' in window));
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
  try {
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Failed to convert base64 to Uint8Array:', error);
    throw new Error('Invalid base64 audio data');
  }
};

// Get presets directory path (in APPDATA for proper permissions)
export const getLocalPresetsDir = async (): Promise<string> => {
  const { appDataDir } = await import('@tauri-apps/api/path');

  try {
    // Save to APPDATA to avoid permission issues
    const appData = await appDataDir();
    // appDataDir already includes the app identifier, just add presets folder
    const normalizedPath = appData.replace(/[\/\\]$/, ''); // Remove trailing slash
    return `${normalizedPath}/${PRESETS_FOLDER}`;
  } catch (error) {
    console.error('Failed to get app data directory:', error);
    throw error;
  }
};

// Initialize local presets directory
export const initLocalPresetsDirectory = async (): Promise<void> => {
  if (!isTauri()) return;

  try {
    const presetsDir = await getLocalPresetsDir();
    const dirExists = await exists(presetsDir);
    if (!dirExists) {
      await mkdir(presetsDir, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to initialize local presets directory:', error);
    throw error;
  }
};

// Save preset to local directory (game folder)
export const savePresetToLocal = async (preset: WheelPreset): Promise<void> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri app');
  }

  try {
    console.log('[savePresetToLocal] Starting save for preset:', preset.name);
    await initLocalPresetsDirectory();

    const presetsDir = await getLocalPresetsDir();
    const presetFolder = await join(presetsDir, preset.id);
    console.log('[savePresetToLocal] Preset folder:', presetFolder);

    // Create preset folder
    await mkdir(presetFolder, { recursive: true });
    console.log('[savePresetToLocal] Preset folder created');

    // Process items and save audio files
    const itemsData: WheelItem[] = [];

    for (let i = 0; i < preset.items.length; i++) {
      const item = preset.items[i];
      let audioFileName: string | undefined = undefined;

      if (item.customSound) {
        console.log(`[savePresetToLocal] Processing audio for item ${i}: ${item.name}`);

        try {
          if (item.customSound.startsWith('data:') || item.customSound.startsWith('blob:')) {
            audioFileName = `audio_${i}_${Date.now()}.mp3`;
            const audioPath = await join(presetFolder, audioFileName);

            if (item.customSound.startsWith('data:')) {
              console.log(`[savePresetToLocal] Saving data URL audio to: ${audioFileName}`);
              const bytes = base64ToUint8Array(item.customSound);
              await writeFile(audioPath, bytes);
            } else {
              console.log(`[savePresetToLocal] Fetching blob URL audio: ${audioFileName}`);
              const response = await fetch(item.customSound);
              const blob = await response.blob();
              const arrayBuffer = await blob.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              await writeFile(audioPath, bytes);
            }
            console.log(`[savePresetToLocal] Audio saved successfully: ${audioFileName}`);
          } else if (item.customSound.includes('/') || item.customSound.includes('\\')) {
            // Copy from existing path
            audioFileName = `audio_${i}_${Date.now()}.mp3`;
            const audioPath = await join(presetFolder, audioFileName);
            try {
              const sourceData = await readFile(item.customSound);
              await writeFile(audioPath, sourceData);
              console.log(`[savePresetToLocal] Audio copied: ${audioFileName}`);
            } catch (err) {
              console.warn('Could not copy audio file, will save as reference:', err);
              audioFileName = item.customSound;
            }
          } else {
            audioFileName = item.customSound;
          }
        } catch (audioError) {
          console.error(`[savePresetToLocal] Error processing audio for item ${i}:`, audioError);
          // Skip the audio but continue with the item
          audioFileName = undefined;
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

    const configPath = await join(presetFolder, 'preset.json');
    await writeTextFile(configPath, JSON.stringify(presetData, null, 2));
    console.log('[savePresetToLocal] Preset saved successfully');

  } catch (error) {
    console.error('[savePresetToLocal] Failed to save preset to local directory:', error);
    throw error;
  }
};

// Get all presets from local directory
export const getPresetsFromLocal = async (): Promise<WheelPreset[]> => {
  if (!isTauri()) {
    return [];
  }

  try {
    await initLocalPresetsDirectory();

    const presetsDir = await getLocalPresetsDir();
    const entries = await readDir(presetsDir);
    const presets: WheelPreset[] = [];

    for (const entry of entries) {
      if (entry.isDirectory && entry.name) {
        try {
          const configPath = await join(presetsDir, entry.name, 'preset.json');
          const content = await readTextFile(configPath);
          const preset = JSON.parse(content);
          presets.push(preset);
        } catch (err) {
          console.error(`Failed to read preset ${entry.name}:`, err);
        }
      }
    }

    return presets;
  } catch (error) {
    console.error('Failed to get presets from local directory:', error);
    return [];
  }
};

// Load preset with audio files from local directory
export const loadPresetFromLocal = async (presetId: string): Promise<WheelPreset | null> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri app');
  }

  try {
    const presetsDir = await getLocalPresetsDir();
    const configPath = await join(presetsDir, presetId, 'preset.json');
    const content = await readTextFile(configPath);
    const preset = JSON.parse(content);

    // Load audio files and convert to data URLs for playback
    const itemsWithAudio: WheelItem[] = [];
    const presetFolder = await join(presetsDir, presetId);

    for (const item of preset.items) {
      if (item.customSound && !item.customSound.startsWith('data:') && !item.customSound.startsWith('http')) {
        const audioPath = await join(presetFolder, item.customSound);
        try {
          const fileData = await readFile(audioPath);
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
    console.error('Failed to load preset from local directory:', error);
    return null;
  }
};

// Delete preset from local directory
export const deletePresetFromLocal = async (presetId: string): Promise<void> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri app');
  }

  try {
    const presetsDir = await getLocalPresetsDir();
    const presetFolder = await join(presetsDir, presetId);
    await remove(presetFolder, { recursive: true });
  } catch (error) {
    console.error('Failed to delete preset from local directory:', error);
    throw error;
  }
};

// Export preset to shared folder (for sharing)
export const exportPresetToShared = async (presetId: string): Promise<string> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri app');
  }

  try {
    const presetsDir = await getLocalPresetsDir();
    const sourceFolder = await join(presetsDir, presetId);

    // Read preset to get name
    const configPath = await join(sourceFolder, 'preset.json');
    const content = await readTextFile(configPath);
    const preset = JSON.parse(content);

    // Create shared_presets folder in app data
    const { appDataDir } = await import('@tauri-apps/api/path');
    const appData = await appDataDir();
    const normalizedPath = appData.replace(/[\/\\]$/, '');
    const sharedDir = `${normalizedPath}/shared_presets`;

    // Ensure shared directory exists
    const sharedExists = await exists(sharedDir);
    if (!sharedExists) {
      await mkdir(sharedDir, { recursive: true });
    }

    // Create export folder with preset name and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const exportFolderName = `${preset.name}_${timestamp}`;
    const exportFolder = await join(sharedDir, exportFolderName);
    await mkdir(exportFolder, { recursive: true });

    // Copy all files from source to export folder
    const entries = await readDir(sourceFolder);
    for (const entry of entries) {
      if (entry.name) {
        const sourcePath = await join(sourceFolder, entry.name);
        const destPath = await join(exportFolder, entry.name);
        const fileData = await readFile(sourcePath);
        await writeFile(destPath, fileData);
      }
    }

    return exportFolder;
  } catch (error) {
    console.error('Failed to export preset:', error);
    throw error;
  }
};

// Import preset from user-selected location
export const importPreset = async (): Promise<WheelPreset | null> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri app');
  }

  try {
    const { open } = await import('@tauri-apps/plugin-dialog');

    // Let user choose preset.json file
    const selected = await open({
      directory: false,
      multiple: false,
      filters: [{
        name: 'Preset JSON',
        extensions: ['json']
      }]
    });

    if (!selected || typeof selected !== 'string') return null;

    // Read the preset.json file
    const content = await readTextFile(selected);
    const preset = JSON.parse(content);

    // Get the directory containing the preset.json
    const sourceDir = selected.substring(0, selected.lastIndexOf('/'));

    // Generate new ID to avoid conflicts
    const newPresetId = crypto.randomUUID();
    const newPreset = {
      ...preset,
      id: newPresetId,
      name: `${preset.name} (Imported)`,
    };

    // Create destination folder
    const presetsDir = await getLocalPresetsDir();
    const destFolder = await join(presetsDir, newPresetId);
    await mkdir(destFolder, { recursive: true });

    // Copy all audio files referenced in items
    const itemsWithAudio: WheelItem[] = [];
    for (const item of preset.items) {
      if (item.customSound && !item.customSound.startsWith('data:') && !item.customSound.startsWith('http')) {
        try {
          const sourceAudioPath = await join(sourceDir, item.customSound);
          const destAudioPath = await join(destFolder, item.customSound);
          const audioData = await readFile(sourceAudioPath);
          await writeFile(destAudioPath, audioData);
          itemsWithAudio.push(item);
        } catch (err) {
          console.warn(`Could not import audio file ${item.customSound}:`, err);
          itemsWithAudio.push({ ...item, customSound: undefined });
        }
      } else {
        itemsWithAudio.push(item);
      }
    }

    // Save the new preset
    const newPresetData = {
      ...newPreset,
      items: itemsWithAudio,
    };

    const configPath = await join(destFolder, 'preset.json');
    await writeTextFile(configPath, JSON.stringify(newPresetData, null, 2));

    return newPresetData;

  } catch (error) {
    console.error('Failed to import preset:', error);
    throw error;
  }
};

// Open folder in file explorer
export const openFolder = async (folderPath: string): Promise<void> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri app');
  }

  try {
    const { Command } = await import('@tauri-apps/plugin-shell');

    // On Windows, use explorer command directly
    // Normalize path - keep backslashes for Windows explorer
    const normalizedPath = folderPath.replace(/\//g, '\\');

    // Use explorer.exe to open the folder on Windows
    const command = Command.create('explorer', [normalizedPath]);
    await command.execute();

    console.log('Folder opened successfully');
  } catch (error) {
    console.error('Failed to open folder:', error);
    // Fallback to copying path to clipboard
    try {
      if ('clipboard' in navigator) {
        await navigator.clipboard.writeText(folderPath);
        alert(`✅ Đường dẫn đã được copy!\n\n${folderPath}\n\nVui lòng mở File Explorer và dán đường dẫn vào thanh địa chỉ.`);
      } else {
        alert(`Preset đã lưu tại:\n${folderPath}`);
      }
    } catch (clipboardError) {
      console.error('Clipboard error:', clipboardError);
      alert(`Preset đã lưu tại:\n${folderPath}`);
    }
  }
};

// Get history directory path
export const getHistoryDir = async (): Promise<string> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri environment');
  }

  const { appDataDir } = await import('@tauri-apps/api/path');
  const appData = await appDataDir();
  const normalizedPath = appData.replace(/[\/\\]$/, '');
  return `${normalizedPath}/history`;
};

// Export history to local file system
export const exportHistoryToLocal = async (csvContent: string, filename: string): Promise<string> => {
  if (!isTauri()) {
    throw new Error('This function only works in Tauri environment');
  }

  const historyDir = await getHistoryDir();

  // Ensure history directory exists
  const historyExists = await exists(historyDir);
  if (!historyExists) {
    await mkdir(historyDir, { recursive: true });
  }

  // Check if file exists and find next available filename
  let finalFilename = filename;
  let counter = 1;
  let filePath = await join(historyDir, `${finalFilename}.csv`);

  while (await exists(filePath)) {
    finalFilename = `${filename} (${counter})`;
    filePath = await join(historyDir, `${finalFilename}.csv`);
    counter++;
  }

  // Write CSV content to file
  await writeTextFile(filePath, csvContent);

  return historyDir;
};
