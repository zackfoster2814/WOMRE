// This will be called from React component with a callback
export const saveCharacterToDatabase = async (
  characterState: any,
  onSuccess: (playerId: number) => void,
  onError: (error: string) => void
) => {
  try {
    // Check if we have the API available
    const api = (window as any).api || (window as any).electron?.ipcRenderer;

    if (!api) {
      throw new Error("Electron API not available");
    }

    let result;
    // Try using window.api first (preferred)
    if ((window as any).api?.importCharacterFromJSON) {
      result = await (window as any).api.importCharacterFromJSON(characterState);
    }
    // Fallback to direct IPC call
    else if ((window as any).electron?.ipcRenderer) {
      result = await (window as any).electron.ipcRenderer.invoke('import-character-from-json', characterState);
    } else {
      throw new Error("No IPC method available");
    }

    if (result && result.success) {
      onSuccess(result.playerId);
    } else {
      onError(result?.error || "Unknown error");
    }
  } catch (error) {
    console.error("Error saving to database:", error);
    onError(String(error));
  }
};

// Legacy function for backward compatibility (not used anymore)
export const exportCharacter = async (characterState: any) => {
  // Just download JSON as fallback
  const dataStr = JSON.stringify(characterState, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `character_${characterState.name || Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
